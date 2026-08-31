import { hex, TOPIC, POOL_MANAGER } from "./rpc.mjs";

/**
 * A census needs an endpoint that will serve thousands of log queries. The
 * canonical public RPC allows roughly two before it throttles for a minute, so
 * this measures every alternative that answers for chain 4663 and reports the
 * only figure that matters: sustained log queries per second.
 */

const ENDPOINTS = [
  "https://rpc.mainnet.chain.robinhood.com",
  "https://robinhood.drpc.org",
  "https://robinhood-mainnet.rpc.thirdweb.com",
  "https://4663.rpc.thirdweb.com",
  "https://rpc.ankr.com/robinhood",
];

async function post(url, body, timeout = 30_000) {
  const t = Date.now();
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(timeout),
    });
    const txt = await res.text();
    let j = null;
    try { j = JSON.parse(txt); } catch { /* html error page */ }
    return { ms: Date.now() - t, status: res.status, j, txt: txt.slice(0, 100) };
  } catch (e) {
    return { ms: Date.now() - t, status: 0, err: String(e).slice(0, 70) };
  }
}

for (const url of ENDPOINTS) {
  const id = await post(url, { jsonrpc: "2.0", id: 1, method: "eth_chainId", params: [] });
  const chain = id.j?.result ? parseInt(id.j.result, 16) : null;
  console.log(`\n${url}`);
  console.log(`  chainId ${chain ?? `-- (${id.status}) ${id.err ?? id.txt}`}`);
  if (chain !== 4663) continue;

  // 12 log queries as fast as the endpoint will take them.
  const t0 = Date.now();
  let ok = 0, err = 0, logs = 0, firstErr = null;
  for (let i = 0; i < 12; i++) {
    const r = await post(url, {
      jsonrpc: "2.0", id: 2, method: "eth_getLogs",
      params: [{ address: POOL_MANAGER, topics: [TOPIC.initialize], fromBlock: hex(20_000_000 + i * 10_000), toBlock: hex(20_009_999 + i * 10_000) }],
    });
    if (Array.isArray(r.j?.result)) { ok++; logs += r.j.result.length; }
    else { err++; firstErr ??= String(r.j?.error?.message ?? r.err ?? r.txt).slice(0, 60); }
  }
  const secs = (Date.now() - t0) / 1000;
  console.log(`  12 log queries: ${ok} ok (${logs} logs) / ${err} err in ${secs.toFixed(1)}s  =  ${(ok / secs).toFixed(2)} q/s${firstErr ? `  [${firstErr}]` : ""}`);

  // Does it serve a wide range, and does it batch?
  const wide = await post(url, {
    jsonrpc: "2.0", id: 3, method: "eth_getLogs",
    params: [{ address: POOL_MANAGER, topics: [TOPIC.initialize], fromBlock: hex(20_000_000), toBlock: hex(20_499_999) }],
  }, 60_000);
  console.log(`  500k-block window: ${Array.isArray(wide.j?.result) ? wide.j.result.length + " logs" : "ERR " + String(wide.j?.error?.message ?? wide.status).slice(0, 60)} (${wide.ms}ms)`);

  const b = await post(url, [
    { jsonrpc: "2.0", id: 1, method: "eth_chainId", params: [] },
    { jsonrpc: "2.0", id: 2, method: "eth_blockNumber", params: [] },
  ]);
  console.log(`  batch: ${Array.isArray(b.j) ? b.j.length + " results" : "unsupported (" + b.status + ")"}`);
}
