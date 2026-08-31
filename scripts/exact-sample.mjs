import fs from "node:fs/promises";
import { getLogs, hex, stats, POOL_MANAGER, TOPIC } from "./rpc.mjs";
import { reserves, swapExactIn, tickToSqrtPriceX96 } from "./v4math.mjs";

/**
 * The exact reserve, for every pool in the pilot sample that could possibly
 * hold real money.
 *
 * `probe-ranges.mjs` established the thing this script exists to handle: the
 * cheap active-liquidity estimate OVERSTATES a concentrated pool's reserve, by
 * up to six orders of magnitude, and agrees exactly only where the position is
 * full-range. So the estimate is a screen and nothing more — it can never
 * exclude a real grave, and it can never be published.
 *
 * Every pool whose estimate clears the threshold gets its actual position
 * ladder pulled from ModifyLiquidity and its reserve computed exactly. One
 * query per pool. The result is a sample-based answer to the only question
 * that decides whether this product exists: how many pools on this chain hold
 * more than a few hundred dollars that could actually come out.
 */

const DATA = new URL("../data/", import.meta.url);
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d; };
const SCREEN = Number(arg("--screen", 100));
const OUT = new URL(arg("--out", "exact-sample.json"), DATA);

const sample = JSON.parse(await fs.readFile(new URL("sample.json", DATA), "utf8"));
const prices = sample.prices;
const head = 51_200_000;

const candidates = sample.rows
  .filter((r) => !r.unreadable && r.quoteUsd >= SCREEN)
  .sort((a, b) => b.quoteUsd - a.quoteUsd);

console.log(`sample: ${sample.rows.length} pools of a ${sample.population} population`);
console.log(`screen: ${candidates.length} with an estimate at or above $${SCREEN} — reading their exact ladders`);

let done = [];
try { done = JSON.parse(await fs.readFile(OUT, "utf8")).rows ?? []; } catch { /* first run */ }
const seen = new Set(done.map((r) => r.id));
const todo = candidates.filter((r) => !seen.has(r.id));

const signed = (h, bits) => { const v = BigInt("0x" + h); const lim = 1n << BigInt(bits - 1); return v >= lim ? v - (1n << BigInt(bits)) : v; };
const FULL_RANGE_SPAN = 1_700_000; // ticks; a locked launchpad LP spans essentially the whole curve

const t0 = Date.now();
for (const [i, r] of todo.entries()) {
  let logs;
  try {
    logs = await getLogs({ address: POOL_MANAGER, topics: [TOPIC.modifyLiquidity, r.id], fromBlock: "0x0", toBlock: hex(head) });
  } catch (e) {
    done.push({ ...r, error: String(e).slice(0, 80) });
    continue;
  }

  const net = new Map();
  for (const l of logs) {
    const d = l.data.slice(2);
    const lo = Number(signed(d.slice(0, 64).slice(58), 24));
    const hi = Number(signed(d.slice(64, 128).slice(58), 24));
    const k = `${lo}:${hi}`;
    net.set(k, (net.get(k) ?? 0n) + signed(d.slice(128, 192), 256));
  }
  const positions = [...net.entries()]
    .map(([k, v]) => { const [lo, hi] = k.split(":").map(Number); return { tickLower: lo, tickUpper: hi, liquidity: v }; })
    .filter((p) => p.liquidity > 0n);

  const dec = r.quoteDecimals;
  const usd = r.quoteUsdPrice;

  if (!positions.length) {
    done.push({ ...r, positions: 0, exactQuoteUsd: 0, ceilingUsd: 0, note: "no live positions" });
  } else {
    const sqrtP = BigInt(r.sqrtPriceX96);
    const ex = reserves(positions, sqrtP);
    const quoteRaw = r.quoteIsToken0 ? ex.amount0 : ex.amount1;
    const tokenRaw = r.quoteIsToken0 ? ex.amount1 : ex.amount0;
    const exactQuoteUsd = (Number(quoteRaw) / 10 ** dec) * usd;

    // What an unbounded amount of the token would extract — the ceiling the
    // asymptote never reaches. The real figure is capped by circulating supply
    // and is measured per grave later; this is the upper bound on the upper bound.
    let ceilingUsd = 0;
    if (tokenRaw > 0n) {
      const feePips = (r.fee & 0x800000) ? (r.lpFee || 3000) : r.fee;
      try {
        const sim = swapExactIn({
          positions, sqrtPriceX96: sqrtP, currentTick: r.tick,
          feePips, amountIn: tokenRaw * 1_000_000n, zeroForOne: !r.quoteIsToken0,
        });
        ceilingUsd = (Number(sim.amountOut) / 10 ** dec) * usd;
        // A swap cannot pay out more of an asset than the pool holds. If this
        // ever trips, the maths is wrong and the figures must not be published
        // — so it stops the run rather than clamping quietly. It caught a real
        // bug once; see the regression in v4math.test.mjs.
        if (sim.amountOut > quoteRaw) {
          throw new Error(
            `INVARIANT: pool ${r.id} would pay out ${sim.amountOut} from a reserve of ${quoteRaw}`,
          );
        }
      } catch (e) {
        if (String(e).includes("INVARIANT")) throw e;
        /* anything else is reported as zero, never guessed */
      }
    }

    done.push({
      ...r,
      positions: positions.length,
      maxSpan: Math.max(...positions.map((p) => p.tickUpper - p.tickLower)),
      fullRange: positions.some((p) => p.tickUpper - p.tickLower >= FULL_RANGE_SPAN),
      exactQuoteRaw: quoteRaw.toString(),
      exactTokenRaw: tokenRaw.toString(),
      exactQuoteUsd, ceilingUsd,
      lpEvents: logs.length,
    });
  }

  if ((i + 1) % 20 === 0 || i + 1 === todo.length) {
    const mins = (Date.now() - t0) / 60000;
    console.log(`  ${i + 1}/${todo.length}  ${stats().httpRequests} reqs  ${mins.toFixed(1)}m  eta ${((mins / (i + 1)) * (todo.length - i - 1)).toFixed(0)}m`);
    await fs.writeFile(OUT, JSON.stringify({ screen: SCREEN, sampled: sample.rows.length, population: sample.population, prices, rows: done }, null, 0));
  }
}

await fs.writeFile(OUT, JSON.stringify({ screen: SCREEN, sampled: sample.rows.length, population: sample.population, prices, rows: done }, null, 0));

// ── what it says ──────────────────────────────────────────────────────
const scale = sample.population / sample.rows.length;
const ok = done.filter((r) => !r.error);
const sorted = [...ok].sort((a, b) => b.ceilingUsd - a.ceilingUsd);

console.log(`\n── exact reserves for ${ok.length} screened pools, scaled x${scale.toFixed(1)} to the chain ──`);
console.log(`estimate total across these pools:  $${ok.reduce((s, r) => s + r.quoteUsd, 0).toFixed(2)}`);
console.log(`exact total across these pools:     $${ok.reduce((s, r) => s + r.exactQuoteUsd, 0).toFixed(2)}`);
console.log(`full-range positions:               ${ok.filter((r) => r.fullRange).length} of ${ok.length}`);

for (const band of [1, 10, 100, 500, 1000, 5000]) {
  const n = ok.filter((r) => r.ceilingUsd >= band).length;
  console.log(`  recoverable ceiling >= $${String(band).padStart(5)}:  ${String(n).padStart(5)} in sample   ~${Math.round(n * scale)} chain-wide`);
}
console.log(`\ntop 20 by recoverable ceiling:`);
for (const r of sorted.slice(0, 20)) {
  console.log(`  ceiling $${r.ceilingUsd.toFixed(2).padStart(10)}  left $${r.exactQuoteUsd.toFixed(2).padStart(10)}  (est $${r.quoteUsd.toFixed(0).padStart(9)})  ${r.quote.padEnd(5)} ${r.token}  ${r.fullRange ? "full-range" : "span " + r.maxSpan}`);
}
const chainCeiling = ok.reduce((s, r) => s + r.ceilingUsd, 0) * scale;
console.log(`\nextrapolated chain-wide recoverable ceiling: $${chainCeiling.toFixed(0)}`);
