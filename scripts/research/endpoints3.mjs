const URL_D = "https://robinhood.drpc.org";
const PM = "0x8366a39cc670b4001a1121b8f6a443a643e40951";
const INIT = "0xdd466e674ea557f56295e2d0218a125ea4b4f0f6f3307b95f85e6110838d6438";
const hex = (n) => "0x" + n.toString(16);

async function q(url, params) {
  const t = Date.now();
  try {
    const res = await fetch(url, {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "eth_getLogs", params: [params] }),
      signal: AbortSignal.timeout(30_000),
    });
    const j = await res.json();
    return { ms: Date.now() - t, n: Array.isArray(j.result) ? j.result.length : null, err: j.error?.message };
  } catch (e) { return { ms: Date.now() - t, n: null, err: String(e).slice(0, 60) }; }
}

console.log("-- drpc, varying window size --");
for (const span of [999, 4999, 9998, 9999, 10000]) {
  const r = await q(URL_D, { address: PM, topics: [INIT], fromBlock: hex(20_000_000), toBlock: hex(20_000_000 + span) });
  console.log(`  span ${span + 1} blocks: ${r.n ?? "ERR " + r.err} (${r.ms}ms)`);
}

console.log("\n-- drpc, 20 sequential 9,999-block windows, no gap --");
let ok = 0, err = 0, logs = 0; const seen = new Set();
const t0 = Date.now();
for (let i = 0; i < 20; i++) {
  const r = await q(URL_D, { address: PM, topics: [INIT], fromBlock: hex(20_000_000 + i * 10_000), toBlock: hex(20_009_999 + i * 10_000) });
  if (r.n === null) { err++; seen.add(String(r.err).slice(0, 50)); } else { ok++; logs += r.n; }
}
const s = (Date.now() - t0) / 1000;
console.log(`  ${ok} ok (${logs} logs) / ${err} err in ${s.toFixed(1)}s = ${(ok / s).toFixed(2)} q/s`);
console.log("  errors seen: " + [...seen].join(" | "));

console.log("\n-- drpc, does a retry recover the failures? --");
let recovered = 0, tries = 0;
for (let i = 0; i < 10; i++) {
  for (let a = 0; a < 4; a++) {
    tries++;
    const r = await q(URL_D, { address: PM, topics: [INIT], fromBlock: hex(30_000_000 + i * 10_000), toBlock: hex(30_009_999 + i * 10_000) });
    if (r.n !== null) { recovered++; break; }
  }
}
console.log(`  ${recovered}/10 windows served, ${tries} attempts total`);
