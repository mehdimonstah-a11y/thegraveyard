import fs from "node:fs/promises";
import { rpc, walkLogs, hex, POOL_MANAGER, TOPIC, stats } from "./rpc.mjs";

/**
 * Stage 2: every ModifyLiquidity event on the singleton, aggregated per pool
 * into a position ladder.
 *
 * Why from logs rather than from storage: there are hundreds of thousands of
 * pools on this chain, and reading each one's tick ladder through `extsload`
 * would be millions of eth_calls against an endpoint that throttles after two.
 * The event stream contains the same information — every position ever opened,
 * every one ever closed — and one log query covers 400,000 blocks of it.
 *
 * A pool's net liquidity in a tick range is the sum of the deltas for that
 * range. Combined with the current price (Stage 3) that is the exact reserve,
 * not an approximation. Stage 4 spot-checks a sample against `extsload` so the
 * reconstruction has to earn the claim.
 *
 * ModifyLiquidity(PoolId indexed id, address indexed sender, int24 tickLower,
 *                 int24 tickUpper, int256 liquidityDelta, bytes32 salt)
 */

const OUT = new URL("../data/liquidity.json", import.meta.url);
const CKPT = new URL("../data/liquidity.checkpoint.json", import.meta.url);

const signed = (h, bits) => {
  const v = BigInt("0x" + h);
  const lim = 1n << BigInt(bits - 1);
  return v >= lim ? v - (1n << BigInt(bits)) : v;
};

function decode(l) {
  const d = l.data.slice(2);
  const word = (i) => d.slice(i * 64, (i + 1) * 64);
  return {
    poolId: l.topics[1],
    sender: "0x" + l.topics[2].slice(26),
    tickLower: Number(signed(word(0).slice(58), 24)),
    tickUpper: Number(signed(word(1).slice(58), 24)),
    liquidityDelta: signed(word(2), 256),
    block: parseInt(l.blockNumber, 16),
  };
}

async function readJson(url) {
  try { return JSON.parse(await fs.readFile(url, "utf8")); } catch { return null; }
}

const head = parseInt(await rpc("eth_blockNumber"), 16);
await fs.mkdir(new URL("../data/", import.meta.url), { recursive: true });

const prior = await readJson(CKPT);
/** poolId -> { ranges: { "lo:hi": netLiquidity }, events, firstBlock, lastBlock, senders } */
const byPool = new Map(Object.entries(prior?.byPool ?? {}));
let cursor = prior?.nextBlock ?? 0;
let events = prior?.events ?? 0;

console.log(`head ${head}`);
console.log(`resuming at block ${cursor} with ${byPool.size} pools carrying positions`);

const t0 = Date.now();
const startedAt = cursor;

await walkLogs({ address: POOL_MANAGER, topics: [TOPIC.modifyLiquidity] }, cursor, head, {
  start: 400_000,
  onPage: async ({ to, logs }) => {
    for (const l of logs) {
      const m = decode(l);
      events++;
      let e = byPool.get(m.poolId);
      if (!e) { e = { ranges: {}, events: 0, firstBlock: m.block, lastBlock: m.block, senders: [] }; byPool.set(m.poolId, e); }
      const key = `${m.tickLower}:${m.tickUpper}`;
      e.ranges[key] = ((BigInt(e.ranges[key] ?? "0")) + m.liquidityDelta).toString();
      e.events++;
      e.lastBlock = m.block;
      if (e.senders.length < 4 && !e.senders.includes(m.sender)) e.senders.push(m.sender);
    }
    cursor = to + 1;
    const mins = (Date.now() - t0) / 60000;
    const eta = to > startedAt ? ((mins / (to - startedAt)) * (head - to)).toFixed(0) : "?";
    console.log(`  ${((to / head) * 100).toFixed(1)}%  block ${to}  ${byPool.size} pools  ${events} events  ${stats().httpRequests} reqs  ${mins.toFixed(1)}m  eta ${eta}m`);
    await fs.writeFile(CKPT, JSON.stringify({ nextBlock: cursor, head, events, byPool: Object.fromEntries(byPool) }));
  },
});

await fs.writeFile(OUT, JSON.stringify({
  generatedAtBlock: head,
  poolsWithPositions: byPool.size,
  events,
  byPool: Object.fromEntries(byPool),
}));
console.log(`\nWrote liquidity.json — ${byPool.size} pools, ${events} events, ${((Date.now() - t0) / 60000).toFixed(1)}m`);
