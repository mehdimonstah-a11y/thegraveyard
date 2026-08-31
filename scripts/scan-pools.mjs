import fs from "node:fs/promises";
import { rpc, walkLogs, hex, POOL_MANAGER, TOPIC, stats } from "./rpc.mjs";

/**
 * Stage 1 of the graveyard scan: enumerate every Uniswap V4 pool that has ever
 * existed on this chain, from Initialize events on the singleton.
 *
 * This is the population. Everything downstream — dead or alive, what's left,
 * what is recoverable — is a measurement made against this list, so it has to
 * be complete rather than sampled.
 *
 * Output is newline-delimited JSON, appended. There are several hundred
 * thousand pools on this chain; re-serialising the whole set after every page
 * would spend more time writing than scanning, and a crash would cost the run.
 * Append + a one-line cursor means a resume costs at most one page.
 */

const NDJSON = new URL("../data/pools.ndjson", import.meta.url);
const CURSOR = new URL("../data/pools.cursor.json", import.meta.url);

/**
 * Initialize(PoolId indexed id, Currency indexed currency0,
 *            Currency indexed currency1, uint24 fee, int24 tickSpacing,
 *            IHooks hooks, uint160 sqrtPriceX96, int24 tick)
 */
const signed24 = (h) => { const v = parseInt(h.slice(-6), 16); return v >= 0x800000 ? v - 0x1000000 : v; };

function decodeInitialize(l) {
  const d = l.data.slice(2);
  const word = (i) => d.slice(i * 64, (i + 1) * 64);
  return {
    id: l.topics[1],
    c0: "0x" + l.topics[2].slice(26),
    c1: "0x" + l.topics[3].slice(26),
    fee: parseInt(word(0), 16),
    ts: signed24(word(1)),
    hooks: "0x" + word(2).slice(24),
    sp: BigInt("0x" + word(3)).toString(),
    tick: signed24(word(4)),
    b: parseInt(l.blockNumber, 16),
  };
}

const head = parseInt(await rpc("eth_blockNumber"), 16);
const headBlock = await rpc("eth_getBlockByNumber", [hex(head), false]);
const headTs = parseInt(headBlock.timestamp, 16);

await fs.mkdir(new URL("../data/", import.meta.url), { recursive: true });

let cursor = 0;
let count = 0;
try {
  const c = JSON.parse(await fs.readFile(CURSOR, "utf8"));
  cursor = c.nextBlock ?? 0;
  count = c.count ?? 0;
} catch { /* first run */ }

// If the cursor is missing but the file exists, the file is untrustworthy —
// truncate rather than risk a partial page appearing twice in the census.
if (cursor === 0) await fs.writeFile(NDJSON, "");

console.log(`head ${head}  ${new Date(headTs * 1000).toISOString()}`);
console.log(`resuming at block ${cursor} with ${count} pools already written`);

const t0 = Date.now();
const startedAt = cursor;

await walkLogs({ address: POOL_MANAGER, topics: [TOPIC.initialize] }, cursor, head, {
  start: 400_000,
  onPage: async ({ to, logs }) => {
    if (logs.length) {
      await fs.appendFile(NDJSON, logs.map((l) => JSON.stringify(decodeInitialize(l))).join("\n") + "\n");
      count += logs.length;
    }
    cursor = to + 1;
    const mins = (Date.now() - t0) / 60000;
    const eta = to > startedAt ? ((mins / (to - startedAt)) * (head - to)).toFixed(0) : "?";
    console.log(`  ${((to / head) * 100).toFixed(1)}%  block ${to}  ${count} pools  ${stats().httpRequests} reqs  ${mins.toFixed(1)}m  eta ${eta}m`);
    await fs.writeFile(CURSOR, JSON.stringify({ nextBlock: cursor, count, head, headTs, poolManager: POOL_MANAGER }));
  },
});

console.log(`\nDone — ${count} pools to block ${head}, ${stats().httpRequests} requests, ${((Date.now() - t0) / 60000).toFixed(1)}m`);
