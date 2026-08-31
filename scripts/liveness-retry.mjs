import fs from "node:fs/promises";
import { getLogs, hex, POOL_MANAGER, TOPIC } from "./rpc.mjs";

/**
 * Retry the graves whose swap history did not come back.
 *
 * The first liveness pass dropped nine pools to transport errors, and six of
 * them were the six largest in the whole scan. A missing row there is not a
 * rounding detail: it is the difference between "nothing on this chain clears
 * the floor" and "the top of the distribution is unmeasured", and the second
 * one is not a finding, it is a hole.
 */

const DATA = new URL("../data/", import.meta.url);
const read = async (n) => JSON.parse(await fs.readFile(new URL(n, DATA), "utf8"));

const cursor = await read("pools.cursor.json");
const exact = await read("exact-sample.json");
const live = await read("liveness-sample.json");

const head = cursor.head;
const SEC_PER_BLOCK = 0.208;
const have = new Set(live.rows.filter((r) => !r.error).map((r) => r.id));
const missing = exact.rows
  .filter((r) => !r.error && (r.ceilingUsd ?? 0) >= 0.5 && !have.has(r.id))
  .sort((a, b) => b.ceilingUsd - a.ceilingUsd);

console.log(`${missing.length} graves still without a swap history — retrying, largest first`);

const signed128 = (h) => { const v = BigInt("0x" + h); return v >= 1n << 127n ? v - (1n << 128n) : v; };
const added = [];

for (const r of missing) {
  // The first pass asked for each pool's complete history in one query. For the
  // busiest pools that overflows the node's 10,000-result cap and throws — which
  // is why the six largest went missing, and why they went missing together.
  //
  // Liveness does not need the whole history. It needs the most recent swap, so
  // this walks backwards in widening windows and stops at the first one that
  // returns anything. A pool that traded yesterday costs one query.
  let logs = null;
  let windowFrom = null;
  const WINDOWS = [1, 3, 7, 14, 30, 60, 125].map((d) => Math.round((d * 86400) / SEC_PER_BLOCK));
  for (const span of WINDOWS) {
    const from = Math.max(0, head - span);
    let got = null;
    for (let attempt = 0; attempt < 5 && got === null; attempt++) {
      try {
        got = await getLogs({ address: POOL_MANAGER, topics: [TOPIC.swap, r.id], fromBlock: hex(from), toBlock: hex(head) });
      } catch {
        await new Promise((s) => setTimeout(s, 3000 * (attempt + 1)));
      }
    }
    // A window that will not come back even shrunk is a hole, not a zero.
    if (got === null) continue;
    if (got.length) { logs = got; windowFrom = from; break; }
    windowFrom = from;
  }
  if (logs === null) {
    if (windowFrom !== null && windowFrom === 0) {
      // Genuinely no swap in the pool's entire life.
      logs = [];
    } else {
      console.log(`  ${r.id.slice(0, 12)}… UNRESOLVED — no window returned`);
      continue;
    }
  }

  const tokenIsCurrency0 = r.token.toLowerCase() < r.quoteAddr.toLowerCase();
  let sells = 0, buys = 0, lastSellBlock = null, lastSellTx = null;
  for (const l of logs) {
    const d = l.data.slice(2);
    const delta = signed128(tokenIsCurrency0 ? d.slice(0, 64) : d.slice(64, 128));
    if (delta > 0n) { sells++; lastSellBlock = parseInt(l.blockNumber, 16); lastSellTx = l.transactionHash; }
    else if (delta < 0n) buys++;
  }
  const lastBlock = logs.length ? parseInt(logs.at(-1).blockNumber, 16) : null;
  const row = {
    id: r.id, token: r.token, quote: r.quote, quoteAddr: r.quoteAddr,
    exactQuoteUsd: r.exactQuoteUsd, ceilingUsd: r.ceilingUsd,
    fullRange: r.fullRange, hooks: r.hooks, fee: r.fee, initBlock: r.initBlock,
    swaps: logs.length, sells, buys,
    /**
     * The counts above are for the window this pool was found in, not its whole
     * life — the whole life is what overflowed the node in the first place. The
     * last-swap block, and therefore the liveness call, is exact either way.
     * Anything that consumes `swaps` or `sells` has to respect this flag.
     */
    historyPartial: true,
    historyFromBlock: windowFrom,
    firstBlock: logs.length ? parseInt(logs[0].blockNumber, 16) : null,
    lastBlock, lastSellBlock, lastSellTx,
    daysIdle: ((head - (lastBlock ?? r.initBlock)) * SEC_PER_BLOCK) / 86400,
    neverTraded: logs.length === 0,
  };
  added.push(row);
  console.log(`  $${r.ceilingUsd.toFixed(2).padStart(9)}  ${r.quote.padEnd(5)} idle ${row.daysIdle.toFixed(0).padStart(3)}d  swaps ${row.swaps} (${sells} sells)`);
}

live.rows = live.rows.filter((r) => !r.error).concat(added);
await fs.writeFile(new URL("liveness-sample.json", DATA), JSON.stringify(live, null, 0));

const ok = live.rows;
const scale = exact.population / exact.sampled;
console.log(`\n── liveness for ${ok.length} pools (${added.length} recovered on retry) ──`);
for (const days of [7, 14, 30, 60]) {
  const dead = ok.filter((r) => r.daysIdle >= days);
  const over500 = dead.filter((r) => r.ceilingUsd >= 500);
  console.log(
    `  idle >= ${String(days).padStart(2)}d:  ${String(dead.length).padStart(4)} graves (~${Math.round(dead.length * scale)})   ` +
    `ceiling $${dead.reduce((s, r) => s + r.ceilingUsd, 0).toFixed(0).padStart(7)} (~$${Math.round(dead.reduce((s, r) => s + r.ceilingUsd, 0) * scale).toLocaleString("en-US")})   ` +
    `over $500: ${over500.length} (~${Math.round(over500.length * scale)})`,
  );
}
