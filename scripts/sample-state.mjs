import fs from "node:fs/promises";
import { createReadStream } from "node:fs";
import readline from "node:readline";
import { keccak256, encodeAbiParameters } from "viem";
import { rpcBatch, isErr, stats, POOL_MANAGER, SEL, NATIVE, USDG, WETH, FLETH } from "./rpc.mjs";
import { Q96 } from "./v4math.mjs";

/**
 * The cheap screen: a price and an active-liquidity figure for a random sample
 * of every pool on this chain with a quote asset on one side.
 *
 * 542,707 pools have been initialised here. Reading state for all of the ones
 * with a quote side is over a million `eth_call`s against an endpoint that 429s
 * a JSON-RPC batch above about a hundred calls — days of work. So this reads a
 * random sample, and the pools that survive it get their exact position ladder
 * pulled afterwards by `exact-sample.mjs`.
 *
 * WHAT THIS NUMBER IS, AND IS NOT. `extsload` gives the pool's price and the
 * liquidity in force at the current tick. Turning that into a reserve with
 * amount0 = L*Q96/sqrtP assumes the liquidity spans the full curve. For a
 * concentrated position it does not, and the assumption OVERSTATES the reserve
 * — `probe-ranges.mjs` measured the error at up to six orders of magnitude on
 * real pools here, and found it exact only where the position is full-range.
 *
 * So `quoteUsd` in this file is an UPPER BOUND and a screen. It is safe in the
 * one direction that matters — it can never hide a real grave — and it must
 * never be published as a reserve. Every figure that reaches a reader comes
 * from the exact ladder.
 *
 * PoolManager storage: mapping(PoolId => Pool.State) at slot 6.
 *   +0 slot0 = sqrtPriceX96 | tick | protocolFee | lpFee     +3 liquidity
 */

const DATA = new URL("../data/", import.meta.url);
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d; };
const N = Number(arg("--n", 20000));
const SEED = Number(arg("--seed", 1));
const OUT = new URL(arg("--out", "sample.json"), DATA);

const POOLS_SLOT = 6n;
const stateSlot = (id) => keccak256(encodeAbiParameters([{ type: "bytes32" }, { type: "uint256" }], [id, POOLS_SLOT]));
const offset = (base, n) => "0x" + (BigInt(base) + BigInt(n)).toString(16).padStart(64, "0");
const extsload = (slot) => ({ method: "eth_call", params: [{ to: POOL_MANAGER, data: SEL.extsload + slot.slice(2) }, "latest"] });

const prices = JSON.parse(await fs.readFile(new URL("prices.json", DATA), "utf8"));
/**
 * What counts as a quote asset: the four things on this chain that someone
 * would actually want back. Every one was identified by counting currencies
 * across the whole pool census and then asking the contract what it is.
 *
 * `priced` records how each one got its dollar value, because two of them are
 * assumptions rather than feed readings and the dataset should say which.
 */
const QUOTE = new Map([
  [NATIVE, { symbol: "ETH", decimals: 18, usd: prices.eth, priced: "ETH/USD feed" }],
  [WETH, { symbol: "WETH", decimals: 18, usd: prices.eth, priced: "ETH/USD feed, assumed 1:1 with ETH" }],
  [FLETH, { symbol: "flETH", decimals: 18, usd: prices.eth, priced: "ETH/USD feed, assumed 1:1 with ETH" }],
  [USDG, { symbol: "USDG", decimals: 6, usd: prices.usdg, priced: "USDG/USD feed" }],
]);

// ── the population ────────────────────────────────────────────────────
console.log("reading the pool census…");
const population = [];
{
  const rl = readline.createInterface({ input: createReadStream(new URL("pools.ndjson", DATA)), crlfDelay: Infinity });
  for await (const line of rl) {
    if (!line) continue;
    const p = JSON.parse(line);
    const q0 = QUOTE.has(p.c0), q1 = QUOTE.has(p.c1);
    if (q0 === q1) continue; // both, or neither
    population.push({ id: p.id, c0: p.c0, c1: p.c1, fee: p.fee, ts: p.ts, hooks: p.hooks, b: p.b, quoteIsToken0: q0 });
  }
}
console.log(`population: ${population.length} pools with exactly one quote side`);

// ── a reproducible sample ─────────────────────────────────────────────
// Deterministic so a rerun reads the same pools and the numbers can be checked.
let s = SEED >>> 0 || 1;
const rand = () => (s = (s * 1664525 + 1013904223) >>> 0) / 2 ** 32;
const idx = population.map((_p, i) => i);
for (let i = idx.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [idx[i], idx[j]] = [idx[j], idx[i]]; }
const sample = idx.slice(0, Math.min(N, idx.length)).map((i) => population[i]);
console.log(`sampling ${sample.length} (seed ${SEED})`);

// ── resume ────────────────────────────────────────────────────────────
let done = [];
try { done = JSON.parse(await fs.readFile(OUT, "utf8")).rows ?? []; } catch { /* first run */ }
const seen = new Set(done.map((r) => r.id));
const todo = sample.filter((p) => !seen.has(p.id));
console.log(`${done.length} already read, ${todo.length} to go`);

const t0 = Date.now();
const CHUNK = 25; // 25 pools = 50 calls = one batch the endpoint will serve

for (let i = 0; i < todo.length; i += CHUNK) {
  const slice = todo.slice(i, i + CHUNK);
  const calls = slice.flatMap((p) => { const b = stateSlot(p.id); return [extsload(b), extsload(offset(b, 3))]; });
  const res = await rpcBatch(calls, { chunk: 50 });

  slice.forEach((p, k) => {
    const raw0 = res[k * 2], raw3 = res[k * 2 + 1];
    if (isErr(raw0) || isErr(raw3) || typeof raw0 !== "string" || raw0.length !== 66) {
      done.push({ ...p, unreadable: true });
      return;
    }
    const w = BigInt(raw0);
    const sqrtPriceX96 = w & ((1n << 160n) - 1n);
    let tick = Number((w >> 160n) & 0xffffffn);
    if (tick >= 0x800000) tick -= 0x1000000;
    const lpFee = Number((w >> 208n) & 0xffffffn);
    const liquidity = BigInt(raw3);

    let quoteRaw = 0n, tokenRaw = 0n;
    if (sqrtPriceX96 > 0n && liquidity > 0n) {
      // Active-liquidity reserves: amount0 = L*Q96/sqrtP, amount1 = L*sqrtP/Q96.
      const a0 = (liquidity * Q96) / sqrtPriceX96;
      const a1 = (liquidity * sqrtPriceX96) / Q96;
      quoteRaw = p.quoteIsToken0 ? a0 : a1;
      tokenRaw = p.quoteIsToken0 ? a1 : a0;
    }
    const q = QUOTE.get(p.quoteIsToken0 ? p.c0 : p.c1);
    const quoteUsd = (Number(quoteRaw) / 10 ** q.decimals) * q.usd;

    done.push({
      id: p.id, hooks: p.hooks, fee: p.fee, lpFee, ts: p.ts, initBlock: p.b,
      quote: q.symbol, quoteAddr: p.quoteIsToken0 ? p.c0 : p.c1,
      quoteDecimals: q.decimals, quoteUsdPrice: q.usd, priced: q.priced,
      quoteIsToken0: p.quoteIsToken0,
      token: p.quoteIsToken0 ? p.c1 : p.c0,
      sqrtPriceX96: sqrtPriceX96.toString(), tick, liquidity: liquidity.toString(),
      quoteRaw: quoteRaw.toString(), tokenRaw: tokenRaw.toString(), quoteUsd,
    });
  });

  if ((i / CHUNK) % 20 === 0 || i + CHUNK >= todo.length) {
    const pct = ((i + slice.length) / todo.length) * 100;
    const mins = (Date.now() - t0) / 60000;
    const eta = i > 0 ? (mins / (i + slice.length)) * (todo.length - i - slice.length) : 0;
    console.log(`  ${pct.toFixed(1)}%  ${done.length} read  ${stats().httpRequests} reqs  ${mins.toFixed(1)}m  eta ${eta.toFixed(0)}m`);
    await fs.writeFile(OUT, JSON.stringify({ population: population.length, sampled: sample.length, seed: SEED, prices, rows: done }));
  }
}

await fs.writeFile(OUT, JSON.stringify({ population: population.length, sampled: sample.length, seed: SEED, prices, rows: done }));

// ── what the sample says ──────────────────────────────────────────────
const read = done.filter((r) => !r.unreadable);
const withMoney = read.filter((r) => r.quoteUsd > 0);
const sorted = [...withMoney].sort((a, b) => b.quoteUsd - a.quoteUsd);
const sum = withMoney.reduce((t, r) => t + r.quoteUsd, 0);
const scale = population.length / read.length;

console.log(`\n── sample of ${read.length} of ${population.length} quote-side pools ──`);
console.log(`unreadable:            ${done.length - read.length}`);
console.log(`zero quote reserve:    ${read.length - withMoney.length}`);
console.log(`holding something:     ${withMoney.length}`);
console.log(`sample total:          $${sum.toFixed(2)}`);
console.log(`extrapolated chain:    $${(sum * scale).toFixed(0)}  (x${scale.toFixed(1)})`);
for (const band of [0.01, 1, 10, 100, 500, 1000, 5000]) {
  const n = withMoney.filter((r) => r.quoteUsd >= band).length;
  console.log(`  >= $${String(band).padStart(6)}:  ${String(n).padStart(6)} in sample   ~${Math.round(n * scale)} chain-wide`);
}
console.log(`\ntop 20 in the sample:`);
for (const r of sorted.slice(0, 20)) {
  console.log(`  $${r.quoteUsd.toFixed(2).padStart(12)}  ${r.quote.padEnd(5)} ${r.token}  hooks ${r.hooks.slice(0, 10)}  fee ${r.fee}`);
}
