import fs from "node:fs/promises";
import readline from "node:readline";
import { createReadStream } from "node:fs";
import { NATIVE, USDG } from "./rpc.mjs";
import { reserves, swapExactIn, tickToSqrtPriceX96 } from "./v4math.mjs";

/**
 * Stage 4: turn three log censuses into the graveyard.
 *
 * Inputs, all produced by the scan scripts and none of them typed by hand:
 *   pools.ndjson    every pool ever initialised, with its key and start price
 *   liquidity.json  every position ever opened or closed, per pool
 *   swaps.json      swap count, first and last block, and the latest price
 *
 * Output: data/graves.json, plus the four questions from §2 of the build brief
 * answered on stdout. Nothing here interpolates. A pool whose price cannot be
 * established is reported as unpriceable, not given a default.
 */

const DATA = new URL("../data/", import.meta.url);
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d; };

/** Days of no swap before a pool is called a grave. Justified in RECOVERY.md. */
const DEAD_DAYS = Number(arg("--dead-days", 30));
/** Below this, a recovery cannot be worth anyone's attention. */
const FLOOR_USD = Number(arg("--floor", 500));

const readJson = async (name) => JSON.parse(await fs.readFile(new URL(name, DATA), "utf8"));

console.log("loading censuses…");
const liq = await readJson("liquidity.json");
const swaps = await readJson("swaps.json");
const cursor = await readJson("pools.cursor.json");
const prices = await readJson("prices.json");

const head = cursor.head;
const headTs = cursor.headTs;
const SEC_PER_BLOCK = Number(arg("--spb", 0.208));
const deadBlocks = Math.round((DEAD_DAYS * 86400) / SEC_PER_BLOCK);
const deadBefore = head - deadBlocks;

console.log(`head ${head}  dead = no swap since block ${deadBefore} (${DEAD_DAYS}d at ${SEC_PER_BLOCK}s/block)`);
console.log(`ETH $${prices.eth}  USDG $${prices.usdg}`);

/** Which currencies count as the quote asset — the thing worth extracting. */
const QUOTE = new Map([
  [NATIVE, { symbol: "ETH", decimals: 18, usd: prices.eth }],
  [USDG.toLowerCase(), { symbol: "USDG", decimals: 6, usd: prices.usdg }],
]);

const stats = {
  pools: 0, hooked: 0, dynamicFee: 0,
  noQuoteSide: 0, bothQuote: 0, neverTraded: 0, alive: 0,
  noPositions: 0, unpriceable: 0, emptyQuote: 0, graves: 0,
};
const currencyTally = new Map();
const graves = [];

const rl = readline.createInterface({ input: createReadStream(new URL("pools.ndjson", DATA)), crlfDelay: Infinity });

for await (const line of rl) {
  if (!line) continue;
  const p = JSON.parse(line);
  stats.pools++;
  if (stats.pools % 50_000 === 0) console.log(`  ${stats.pools} pools read…`);

  currencyTally.set(p.c0, (currencyTally.get(p.c0) ?? 0) + 1);
  currencyTally.set(p.c1, (currencyTally.get(p.c1) ?? 0) + 1);

  const q0 = QUOTE.get(p.c0);
  const q1 = QUOTE.get(p.c1);
  if (q0 && q1) { stats.bothQuote++; continue; }   // ETH/USDG — a real pair, not a grave
  if (!q0 && !q1) { stats.noQuoteSide++; continue; } // nothing worth extracting

  const quoteIsToken0 = Boolean(q0);
  const quote = q0 ?? q1;

  // ── liveness ────────────────────────────────────────────────────────
  const sw = swaps.byPool[p.id];              // [count, firstBlock, lastBlock, lastSqrtPriceX96]
  const lastSwapBlock = sw ? sw[2] : null;
  if (!sw) stats.neverTraded++;
  else if (lastSwapBlock > deadBefore) { stats.alive++; continue; }

  // ── positions ───────────────────────────────────────────────────────
  const lq = liq.byPool[p.id];
  if (!lq) { stats.noPositions++; continue; }
  const positions = Object.entries(lq.ranges)
    .map(([k, v]) => {
      const [lo, hi] = k.split(":").map(Number);
      return { tickLower: lo, tickUpper: hi, liquidity: BigInt(v) };
    })
    .filter((x) => x.liquidity > 0n);
  if (!positions.length) { stats.noPositions++; continue; }

  // ── price ───────────────────────────────────────────────────────────
  // The last swap's post-swap price, or the initialisation price if it has
  // never traded. Both are read from chain; neither is interpolated.
  const sqrtPriceX96 = BigInt(sw ? sw[3] : p.sp);
  if (sqrtPriceX96 === 0n) { stats.unpriceable++; continue; }
  const currentTick = tickFromSqrt(sqrtPriceX96, positions);

  // ── what's left ─────────────────────────────────────────────────────
  let r;
  try { r = reserves(positions, sqrtPriceX96); } catch { stats.unpriceable++; continue; }
  const quoteRaw = quoteIsToken0 ? r.amount0 : r.amount1;
  const tokenRaw = quoteIsToken0 ? r.amount1 : r.amount0;
  const quoteUnits = Number(quoteRaw) / 10 ** quote.decimals;
  const quoteUsd = quoteUnits * quote.usd;
  if (quoteUsd <= 0) { stats.emptyQuote++; continue; }

  // ── what could come out ─────────────────────────────────────────────
  // Selling the pool's own token inventory many times over is the practical
  // ceiling: it is what an unbounded amount of supply would extract. The real
  // figure is capped by circulating supply and is measured per grave in
  // stage 5, for the graves that clear the floor.
  const feePips = (p.fee & 0x800000) ? 3000 : p.fee;
  const dynamic = Boolean(p.fee & 0x800000);
  if (dynamic) stats.dynamicFee++;
  if (p.hooks !== NATIVE) stats.hooked++;

  let ceiling = 0;
  try {
    const sim = swapExactIn({
      positions, sqrtPriceX96, currentTick, feePips,
      amountIn: tokenRaw * 1_000_000n,
      zeroForOne: !quoteIsToken0,
    });
    ceiling = Number(sim.amountOut) / 10 ** quote.decimals * quote.usd;
  } catch { /* leave at 0 — reported, never guessed */ }

  stats.graves++;
  graves.push({
    id: p.id,
    token: quoteIsToken0 ? p.c1 : p.c0,
    quote: quote.symbol,
    fee: p.fee, dynamic, tickSpacing: p.ts, hooks: p.hooks,
    initBlock: p.b,
    lastSwapBlock,
    swaps: sw ? sw[0] : 0,
    daysIdle: lastSwapBlock ? ((head - lastSwapBlock) * SEC_PER_BLOCK) / 86400 : ((head - p.b) * SEC_PER_BLOCK) / 86400,
    quoteRaw: quoteRaw.toString(),
    tokenRaw: tokenRaw.toString(),
    quoteUsd,
    ceilingUsd: ceiling,
    sqrtPriceX96: sqrtPriceX96.toString(),
    positions: positions.map((x) => [x.tickLower, x.tickUpper, x.liquidity.toString()]),
  });
}

/** Recover the tick that a sqrt price sits in, without a log: bisect the
 *  position boundaries, which is all the swap loop needs to know. */
function tickFromSqrt(sqrtPriceX96, positions) {
  const bounds = [...new Set(positions.flatMap((p) => [p.tickLower, p.tickUpper]))].sort((a, b) => a - b);
  let tick = bounds[0] ?? 0;
  for (const b of bounds) if (tickToSqrtPriceX96(b) <= sqrtPriceX96) tick = b;
  // Refine within the bracketing range so partially-filled positions are right.
  let lo = tick, hi = bounds.find((b) => b > tick) ?? tick + 1;
  while (hi - lo > 1) {
    const mid = Math.floor((lo + hi) / 2);
    if (tickToSqrtPriceX96(mid) <= sqrtPriceX96) lo = mid; else hi = mid;
  }
  return lo;
}

graves.sort((a, b) => b.ceilingUsd - a.ceilingUsd);

// ── the four questions ────────────────────────────────────────────────
const total = graves.reduce((s, g) => s + g.quoteUsd, 0);
const totalCeiling = graves.reduce((s, g) => s + g.ceilingUsd, 0);
const bands = [0.01, 0.1, 1, 10, 100, 500, 1000, 5000, 25000];
const bandCounts = bands.map((b, i) => {
  const hi = bands[i + 1] ?? Infinity;
  const inBand = graves.filter((g) => g.ceilingUsd >= b && g.ceilingUsd < hi);
  return { from: b, to: hi, n: inBand.length, sum: inBand.reduce((s, g) => s + g.ceilingUsd, 0) };
});
const aboveFloor = graves.filter((g) => g.ceilingUsd >= FLOOR_USD);

console.log("\n──────────── THE GRAVEYARD ────────────");
console.log(JSON.stringify(stats, null, 1));
console.log(`\ntop currencies by pool count:`);
[...currencyTally.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8)
  .forEach(([a, n]) => console.log(`  ${a}  ${n}`));

console.log(`\n1. graves: ${stats.graves}   what's left, total: $${total.toFixed(2)}`);
console.log(`2. distribution by recoverable ceiling:`);
for (const b of bandCounts) {
  if (!b.n) continue;
  console.log(`     $${String(b.from).padStart(6)} – ${b.to === Infinity ? "  ∞" : "$" + b.to}  ${String(b.n).padStart(6)} graves   $${b.sum.toFixed(2)}`);
}
console.log(`3. graves above $${FLOOR_USD} recoverable: ${aboveFloor.length}   totalling $${aboveFloor.reduce((s, g) => s + g.ceilingUsd, 0).toFixed(2)}`);
console.log(`   chain-wide recoverable ceiling: $${totalCeiling.toFixed(2)}`);
console.log(`\ntop 25 graves:`);
for (const g of graves.slice(0, 25)) {
  console.log(`  ${g.token}  ${g.quote.padEnd(4)} left $${g.quoteUsd.toFixed(2).padStart(10)}  ceiling $${g.ceilingUsd.toFixed(2).padStart(10)}  idle ${g.daysIdle.toFixed(0)}d  swaps ${g.swaps}`);
}

await fs.writeFile(new URL("graves.json", DATA), JSON.stringify({
  generatedAtBlock: head,
  generatedAtIso: headTs ? new Date(headTs * 1000).toISOString() : null,
  deadDays: DEAD_DAYS, deadBeforeBlock: deadBefore, secPerBlock: SEC_PER_BLOCK,
  prices, stats, floorUsd: FLOOR_USD,
  totals: { whatsLeftUsd: total, ceilingUsd: totalCeiling, aboveFloor: aboveFloor.length },
  bands: bandCounts,
  graves,
}));
console.log(`\nwrote data/graves.json (${graves.length} graves)`);
