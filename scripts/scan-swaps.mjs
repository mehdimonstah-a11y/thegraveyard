import fs from "node:fs/promises";
import { rpc, walkLogs, hex, POOL_MANAGER, TOPIC, stats } from "./rpc.mjs";

/**
 * Stage 3: every Swap event on the singleton, aggregated per pool.
 *
 * This is the census that decides which pools are graves. Two things come out
 * of it and both are load-bearing:
 *
 *   lastBlock       — the only mechanical definition of "dead" we are willing
 *                     to publish. Not "looks abandoned"; not "low volume". No
 *                     swap since block N.
 *   lastSqrtPriceX96 — the pool's current price, free. The Swap event carries
 *                     the post-swap price, so the entire chain's pool prices
 *                     arrive from the same pass that establishes liveness,
 *                     without one eth_call.
 *
 * Individual swaps are not retained. There are millions and we need four
 * numbers per pool.
 */

const OUT = new URL("../data/swaps.json", import.meta.url);
const CKPT = new URL("../data/swaps.checkpoint.json", import.meta.url);

function decode(l) {
  const d = l.data.slice(2);
  const word = (i) => BigInt("0x" + d.slice(i * 64, (i + 1) * 64));
  return {
    poolId: l.topics[1],
    sqrtPriceX96: word(2).toString(),
    block: parseInt(l.blockNumber, 16),
  };
}

async function readJson(url) {
  try { return JSON.parse(await fs.readFile(url, "utf8")); } catch { return null; }
}

const head = parseInt(await rpc("eth_blockNumber"), 16);
await fs.mkdir(new URL("../data/", import.meta.url), { recursive: true });

const prior = await readJson(CKPT);
/** poolId -> [swaps, firstBlock, lastBlock, lastSqrtPriceX96] — array, not object, to keep the file small */
const byPool = new Map(Object.entries(prior?.byPool ?? {}));
let cursor = prior?.nextBlock ?? 0;
let total = prior?.total ?? 0;

console.log(`head ${head}`);
console.log(`resuming at block ${cursor} with ${byPool.size} pools that have ever traded`);

const t0 = Date.now();
const startedAt = cursor;

await walkLogs({ address: POOL_MANAGER, topics: [TOPIC.swap] }, cursor, head, {
  start: 200_000,
  onPage: async ({ to, logs }) => {
    for (const l of logs) {
      const s = decode(l);
      total++;
      const e = byPool.get(s.poolId);
      if (!e) byPool.set(s.poolId, [1, s.block, s.block, s.sqrtPriceX96]);
      else { e[0]++; e[2] = s.block; e[3] = s.sqrtPriceX96; }
    }
    cursor = to + 1;
    const mins = (Date.now() - t0) / 60000;
    const eta = to > startedAt ? ((mins / (to - startedAt)) * (head - to)).toFixed(0) : "?";
    console.log(`  ${((to / head) * 100).toFixed(1)}%  block ${to}  ${byPool.size} traded pools  ${total} swaps  ${stats().httpRequests} reqs  ${mins.toFixed(1)}m  eta ${eta}m`);
    await fs.writeFile(CKPT, JSON.stringify({ nextBlock: cursor, head, total, byPool: Object.fromEntries(byPool) }));
  },
});

await fs.writeFile(OUT, JSON.stringify({
  generatedAtBlock: head,
  tradedPools: byPool.size,
  totalSwaps: total,
  legend: ["swaps", "firstBlock", "lastBlock", "lastSqrtPriceX96"],
  byPool: Object.fromEntries(byPool),
}));
console.log(`\nWrote swaps.json — ${byPool.size} traded pools, ${total} swaps, ${((Date.now() - t0) / 60000).toFixed(1)}m`);
