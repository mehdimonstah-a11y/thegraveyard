import { hex, TOPIC, POOL_MANAGER } from "./rpc.mjs";

/**
 * Which endpoint will actually serve a chain-wide scan?
 *
 * The public RPC 429s after a single log query, which is fine for a page render
 * and useless for a census. This probes the alternatives before the scan is
 * designed around any one of them.
 */

const ENDPOINTS = [
  "https://rpc.mainnet.chain.robinhood.com",
  "https://rpc.chain.robinhood.com",
  "https://robinhoodchain.blockscout.com/api/eth-rpc",
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function post(url, body, timeout = 45_000) {
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
    try { j = JSON.parse(txt); } catch { /* not json */ }
    return { ms: Date.now() - t, status: res.status, j, txt: txt.slice(0, 120) };
  } catch (e) {
    return { ms: Date.now() - t, status: 0, err: String(e).slice(0, 80) };
  }
}

for (const url of ENDPOINTS) {
  const bn = await post(url, { jsonrpc: "2.0", id: 1, method: "eth_blockNumber", params: [] });
  console.log(`\n${url}`);
  console.log(`  eth_blockNumber  status=${bn.status} ${bn.j?.result ?? bn.err ?? bn.txt} (${bn.ms}ms)`);
  if (!bn.j?.result) continue;

  // Six consecutive 10k-block log queries: does it throttle, and how fast?
  let ok = 0, err = 0;
  for (let i = 0; i < 6; i++) {
    const r = await post(url, {
      jsonrpc: "2.0", id: 2, method: "eth_getLogs",
      params: [{ address: POOL_MANAGER, topics: [TOPIC.initialize], fromBlock: hex(6_800_000 + i * 10_000), toBlock: hex(6_809_999 + i * 10_000) }],
    });
    if (Array.isArray(r.j?.result)) { ok++; process.stdout.write(`  [${i}] ${r.j.result.length} logs ${r.ms}ms\n`); }
    else { err++; process.stdout.write(`  [${i}] ERR ${r.j?.error?.code ?? r.status} ${String(r.j?.error?.message ?? r.err ?? r.txt).slice(0, 50)} ${r.ms}ms\n`); }
  }
  console.log(`  back-to-back: ${ok} ok / ${err} err`);

  // How long does a throttle take to clear?
  if (err) {
    for (const gap of [1000, 3000, 8000]) {
      await sleep(gap);
      const r = await post(url, {
        jsonrpc: "2.0", id: 3, method: "eth_getLogs",
        params: [{ address: POOL_MANAGER, topics: [TOPIC.initialize], fromBlock: hex(7_000_000), toBlock: hex(7_009_999) }],
      });
      console.log(`  after ${gap}ms gap: ${Array.isArray(r.j?.result) ? r.j.result.length + " logs" : "ERR " + (r.j?.error?.code ?? r.status)} (${r.ms}ms)`);
    }
  }

  // Batch support — one HTTP request carrying many calls is the cheap path.
  const b = await post(url, [
    { jsonrpc: "2.0", id: 1, method: "eth_chainId", params: [] },
    { jsonrpc: "2.0", id: 2, method: "eth_blockNumber", params: [] },
    { jsonrpc: "2.0", id: 3, method: "eth_getBlockByNumber", params: ["0x1", false] },
  ]);
  console.log(`  batch of 3: ${Array.isArray(b.j) ? b.j.length + " results" : "unsupported (" + b.status + ")"} (${b.ms}ms)`);
}
