import { rpc, hex, isErr, POOL_MANAGER, TOPIC } from "./rpc.mjs";

/**
 * Two questions that decide the shape of the whole scan:
 *   1. How dense are Swap events? (does a chain-wide swap census fit in a day?)
 *   2. Will the node serve a full-range query filtered to ONE pool id?
 *      If yes, liveness can be asked per grave instead of by censusing 51M
 *      blocks of swaps, which is the difference between hours and minutes.
 */

const head = parseInt(await rpc("eth_blockNumber"), 16);

console.log("-- Swap density, 10k-block samples across the chain --");
for (const at of [2_000_000, 10_000_000, 20_000_000, 30_000_000, 40_000_000, 50_000_000]) {
  const t = Date.now();
  const r = await rpc("eth_getLogs", [{ address: POOL_MANAGER, topics: [TOPIC.swap], fromBlock: hex(at), toBlock: hex(at + 9_999) }]);
  console.log(`  block ${at}: ${Array.isArray(r) ? r.length + " swaps" : "ERR " + JSON.stringify(r).slice(0, 60)}  (${Date.now() - t}ms)`);
}

console.log("\n-- Initialize density, 10k-block samples --");
for (const at of [2_000_000, 10_000_000, 20_000_000, 30_000_000, 40_000_000, 50_000_000]) {
  const r = await rpc("eth_getLogs", [{ address: POOL_MANAGER, topics: [TOPIC.initialize], fromBlock: hex(at), toBlock: hex(at + 9_999) }]);
  console.log(`  block ${at}: ${Array.isArray(r) ? r.length + " pools" : "ERR " + JSON.stringify(r).slice(0, 60)}`);
}

console.log("\n-- Full-range query filtered to a single pool id --");
const known = "0x3d436b4fdc532c61a0bf15d6cae80a66eb8f28ee9daec34dbec4b5bc9964063b";
for (const [label, filter] of [
  ["swaps for one pool, 0..head", { address: POOL_MANAGER, topics: [TOPIC.swap, known], fromBlock: "0x0", toBlock: hex(head) }],
  ["initialize for one pool, 0..head", { address: POOL_MANAGER, topics: [TOPIC.initialize, known], fromBlock: "0x0", toBlock: hex(head) }],
]) {
  const t = Date.now();
  const r = await rpc("eth_getLogs", [filter]);
  console.log(`  ${label}: ${Array.isArray(r) ? r.length + " logs, last block " + (r.length ? parseInt(r.at(-1).blockNumber, 16) : "-") : "ERR " + JSON.stringify(r).slice(0, 80)}  (${Date.now() - t}ms)`);
}

console.log("\n-- Sustained rate: 20 sequential 10k-block queries, 700ms gap --");
let ok = 0, errs = 0;
const t0 = Date.now();
for (let i = 0; i < 20; i++) {
  const r = await rpc("eth_getLogs", [{ address: POOL_MANAGER, topics: [TOPIC.initialize], fromBlock: hex(20_000_000 + i * 10_000), toBlock: hex(20_009_999 + i * 10_000) }]);
  if (Array.isArray(r)) ok++; else errs++;
}
console.log(`  ${ok} ok / ${errs} err in ${((Date.now() - t0) / 1000).toFixed(1)}s`);
