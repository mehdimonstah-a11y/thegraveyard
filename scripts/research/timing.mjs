import { RPC, POOL_MANAGER, TOPIC, hex } from "./rpc.mjs";

/** How large a log window will this node actually serve, and how fast? */
async function raw(from, to, topics = [TOPIC.initialize], address = POOL_MANAGER) {
  const t = Date.now();
  try {
    const res = await fetch(RPC, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0", id: 1, method: "eth_getLogs",
        params: [{ address, topics, fromBlock: hex(from), toBlock: hex(to) }],
      }),
      signal: AbortSignal.timeout(120_000),
    });
    const j = await res.json();
    const ms = Date.now() - t;
    if (j.error) return `${to - from + 1} blocks -> ERROR ${j.error.code} ${String(j.error.message).slice(0, 70)} (${ms}ms)`;
    return `${to - from + 1} blocks -> ${j.result.length} logs (${ms}ms)`;
  } catch (e) {
    return `${to - from + 1} blocks -> THROW ${String(e).slice(0, 60)} (${Date.now() - t}ms)`;
  }
}

const base = 6_800_000;
for (const span of [10_000, 50_000, 100_000, 200_000, 400_000]) {
  console.log("init  " + (await raw(base, base + span - 1)));
}
console.log("swap  " + (await raw(base, base + 10_000 - 1, [TOPIC.swap])));
console.log("swap  " + (await raw(base, base + 50_000 - 1, [TOPIC.swap])));
console.log("swap  " + (await raw(50_000_000, 50_050_000, [TOPIC.swap])));
console.log("init@50M " + (await raw(50_000_000, 50_200_000)));
