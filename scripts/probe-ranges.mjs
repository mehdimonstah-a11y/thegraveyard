import fs from "node:fs/promises";
import { getLogs, hex, POOL_MANAGER, TOPIC, NATIVE, USDG } from "./rpc.mjs";
import { reserves, Q96 } from "./v4math.mjs";

/**
 * Is the active-liquidity reserve estimate usable, and in which direction is it
 * wrong?
 *
 * `extsload` gives a pool's price and the liquidity in force at the current
 * tick, cheaply. Turning that into a reserve with amount0 = L*Q96/sqrtP assumes
 * the liquidity spans the full range. For a concentrated position it does not,
 * and the assumption OVERSTATES the reserve — badly, if the range is narrow.
 * Overstating a recovery is the one error this product may not make, so the
 * estimate can only ever be used as a screen that cannot exclude a real grave,
 * never as a published figure.
 *
 * This takes pools from the pilot sample, fetches their actual position ranges
 * from ModifyLiquidity, and reports the ratio. One query per pool.
 */

const DATA = new URL("../data/", import.meta.url);
const sample = JSON.parse(await fs.readFile(new URL("sample.json", DATA), "utf8"));
const prices = sample.prices;
const N = Number(process.argv[process.argv.indexOf("--n") + 1] || 24);

const rows = sample.rows.filter((r) => !r.unreadable && r.quoteUsd > 0).sort((a, b) => b.quoteUsd - a.quoteUsd);
// A spread across the distribution, not just the head.
const picks = [];
for (let i = 0; i < N; i++) picks.push(rows[Math.floor((i / N) * rows.length)]);

const signed = (h, bits) => { const v = BigInt("0x" + h); const lim = 1n << BigInt(bits - 1); return v >= lim ? v - (1n << BigInt(bits)) : v; };
const head = 51_200_000;

console.log("pool                                   estimate       exact      ratio  ranges  span(ticks)");
let worst = 0, better = 0, agree = 0;

for (const r of picks) {
  const logs = await getLogs({ address: POOL_MANAGER, topics: [TOPIC.modifyLiquidity, r.id], fromBlock: "0x0", toBlock: hex(head) });
  const net = new Map();
  for (const l of logs) {
    const d = l.data.slice(2);
    const lo = Number(signed(d.slice(0, 64).slice(58), 24));
    const hi = Number(signed(d.slice(64, 128).slice(58), 24));
    const delta = signed(d.slice(128, 192), 256);
    const k = `${lo}:${hi}`;
    net.set(k, (net.get(k) ?? 0n) + delta);
  }
  const positions = [...net.entries()]
    .map(([k, v]) => { const [lo, hi] = k.split(":").map(Number); return { tickLower: lo, tickUpper: hi, liquidity: v }; })
    .filter((p) => p.liquidity > 0n);

  if (!positions.length) { console.log(`${r.id.slice(0, 14)}…  ${r.quoteUsd.toFixed(2).padStart(12)}  no live positions`); continue; }

  const sqrtP = BigInt(r.sqrtPriceX96);
  const ex = reserves(positions, sqrtP);
  const quoteRaw = r.quoteIsToken0 ? ex.amount0 : ex.amount1;
  const dec = r.quote === "ETH" ? 18 : 6;
  const usd = (Number(quoteRaw) / 10 ** dec) * (r.quote === "ETH" ? prices.eth : prices.usdg);
  const ratio = usd > 0 ? r.quoteUsd / usd : Infinity;
  const span = Math.max(...positions.map((p) => p.tickUpper - p.tickLower));

  if (ratio > 1.05) worst++; else if (ratio < 0.95) better++; else agree++;
  console.log(
    `${r.id.slice(0, 14)}…  ${r.quoteUsd.toFixed(2).padStart(12)}  ${usd.toFixed(2).padStart(11)}  ${ratio === Infinity ? "   inf" : ratio.toFixed(2).padStart(6)}  ${String(positions.length).padStart(5)}  ${span}`,
  );
}

console.log(`\nestimate overstates: ${worst}   understates: ${better}   agrees: ${agree}  (of ${picks.length})`);
