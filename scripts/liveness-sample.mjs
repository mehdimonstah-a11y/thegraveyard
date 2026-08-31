import fs from "node:fs/promises";
import { getLogs, hex, stats, POOL_MANAGER, TOPIC } from "./rpc.mjs";

/**
 * Which of the pools that hold something are actually graves?
 *
 * A pool with money in it is only interesting if nobody is trading it. This
 * pulls the complete swap history of every pool that survived the exact-reserve
 * pass — one topic-filtered query per pool, which is cheap because a dead pool
 * has few swaps — and records when it last traded, how many times, and in
 * which direction.
 *
 * The direction matters twice over. It is the liveness signal, and it is the
 * only tradeability evidence available before a helper contract exists: a pool
 * where a sell has completed is a pool where a sell can complete.
 */

const DATA = new URL("../data/", import.meta.url);
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d; };
const MIN_CEILING = Number(arg("--min", 1));
const OUT = new URL("liveness-sample.json", DATA);

const cursor = JSON.parse(await fs.readFile(new URL("pools.cursor.json", DATA), "utf8"));
const exact = JSON.parse(await fs.readFile(new URL("exact-sample.json", DATA), "utf8"));
const head = cursor.head;
const SEC_PER_BLOCK = 0.208;

const rows = exact.rows.filter((r) => !r.error && (r.ceilingUsd ?? 0) >= MIN_CEILING).sort((a, b) => b.ceilingUsd - a.ceilingUsd);
console.log(`${rows.length} pools with a recoverable ceiling at or above $${MIN_CEILING} — reading their swap histories`);

let done = [];
try { done = JSON.parse(await fs.readFile(OUT, "utf8")).rows ?? []; } catch { /* first run */ }
const seen = new Set(done.map((r) => r.id));
const todo = rows.filter((r) => !seen.has(r.id));

const signed128 = (h) => { const v = BigInt("0x" + h); return v >= 1n << 127n ? v - (1n << 128n) : v; };
const t0 = Date.now();

for (const [i, r] of todo.entries()) {
  let logs;
  try {
    logs = await getLogs({ address: POOL_MANAGER, topics: [TOPIC.swap, r.id], fromBlock: "0x0", toBlock: hex(head) });
  } catch (e) { done.push({ ...r, error: String(e).slice(0, 60) }); continue; }

  const tokenIsCurrency0 = r.token.toLowerCase() < r.quoteAddr.toLowerCase();

  let sells = 0, buys = 0, lastSellBlock = null, lastSellTx = null;
  for (const l of logs) {
    const d = l.data.slice(2);
    const tokenDelta = signed128(tokenIsCurrency0 ? d.slice(0, 64) : d.slice(64, 128));
    if (tokenDelta > 0n) { sells++; lastSellBlock = parseInt(l.blockNumber, 16); lastSellTx = l.transactionHash; }
    else if (tokenDelta < 0n) buys++;
  }
  const lastBlock = logs.length ? parseInt(logs.at(-1).blockNumber, 16) : null;
  const firstBlock = logs.length ? parseInt(logs[0].blockNumber, 16) : null;

  done.push({
    id: r.id, token: r.token, quote: r.quote, quoteAddr: r.quoteAddr,
    exactQuoteUsd: r.exactQuoteUsd, ceilingUsd: r.ceilingUsd,
    fullRange: r.fullRange, hooks: r.hooks, fee: r.fee, initBlock: r.initBlock,
    swaps: logs.length, sells, buys, firstBlock, lastBlock, lastSellBlock, lastSellTx,
    daysIdle: ((head - (lastBlock ?? r.initBlock)) * SEC_PER_BLOCK) / 86400,
    neverTraded: logs.length === 0,
  });

  if ((i + 1) % 25 === 0 || i + 1 === todo.length) {
    const mins = (Date.now() - t0) / 60000;
    console.log(`  ${i + 1}/${todo.length}  ${stats().httpRequests} reqs  ${mins.toFixed(1)}m  eta ${((mins / (i + 1)) * (todo.length - i - 1)).toFixed(0)}m`);
    await fs.writeFile(OUT, JSON.stringify({ head, secPerBlock: SEC_PER_BLOCK, minCeiling: MIN_CEILING, sampled: exact.sampled, population: exact.population, rows: done }, null, 0));
  }
}

await fs.writeFile(OUT, JSON.stringify({ head, secPerBlock: SEC_PER_BLOCK, minCeiling: MIN_CEILING, sampled: exact.sampled, population: exact.population, rows: done }, null, 0));

// ── the graveyard, as this sample sees it ─────────────────────────────
const ok = done.filter((r) => !r.error);
const scale = exact.population / exact.sampled;

console.log(`\n── liveness for ${ok.length} pools, sample of ${exact.sampled} of ${exact.population} (x${scale.toFixed(1)}) ──`);
for (const days of [7, 14, 30, 60]) {
  const dead = ok.filter((r) => r.daysIdle >= days);
  const over500 = dead.filter((r) => r.ceilingUsd >= 500);
  console.log(
    `  idle >= ${String(days).padStart(2)}d:  ${String(dead.length).padStart(4)} graves (~${Math.round(dead.length * scale)} chain-wide)   ` +
    `ceiling $${dead.reduce((s, r) => s + r.ceilingUsd, 0).toFixed(0).padStart(7)} (~$${Math.round(dead.reduce((s, r) => s + r.ceilingUsd, 0) * scale).toLocaleString("en-US")} chain-wide)   ` +
    `over $500: ${over500.length} (~${Math.round(over500.length * scale)})`,
  );
}
console.log(`\n  never traded at all:  ${ok.filter((r) => r.neverTraded).length}`);
console.log(`  traded, no sell ever: ${ok.filter((r) => !r.neverTraded && r.sells === 0).length}`);
console.log(`  has a completed sell: ${ok.filter((r) => r.sells > 0).length}`);

const graves30 = ok.filter((r) => r.daysIdle >= 30).sort((a, b) => b.ceilingUsd - a.ceilingUsd);
console.log(`\ntop 15 graves at the 30-day definition:`);
for (const g of graves30.slice(0, 15)) {
  console.log(`  $${g.ceilingUsd.toFixed(2).padStart(9)}  ${g.quote.padEnd(5)} ${g.token}  idle ${g.daysIdle.toFixed(0).padStart(3)}d  swaps ${String(g.swaps).padStart(4)} (${g.sells} sells)  ${g.fullRange ? "full-range" : ""}`);
}
