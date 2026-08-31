const URL = "https://rpc.mainnet.chain.robinhood.com";
const PM = "0x8366a39cc670b4001a1121b8f6a443a643e40951";
const INIT = "0xdd466e674ea557f56295e2d0218a125ea4b4f0f6f3307b95f85e6110838d6438";
const SWAP = "0x40e9cecb9f5f1f1c5b9c97dec2917b7ee92e57ba5563708daca94dd84ad7112f";
const hex = (n) => "0x" + n.toString(16);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function q(params, timeout = 90_000) {
  const t = Date.now();
  try {
    const res = await fetch(URL, {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "eth_getLogs", params: [params] }),
      signal: AbortSignal.timeout(timeout),
    });
    const j = await res.json();
    return { ms: Date.now() - t, n: Array.isArray(j.result) ? j.result.length : null, err: j.error?.message };
  } catch (e) { return { ms: Date.now() - t, n: null, err: String(e).slice(0, 50) }; }
}

/**
 * The throttle recovers, so the question is not "how many queries per second"
 * but "how much chain does one query buy". Wide windows are the whole game: at
 * 400k blocks a full-history census is ~128 queries instead of ~5,100.
 */
console.log("-- how wide a window will it serve? (patient, 4s between attempts) --");
for (const span of [200_000, 400_000, 800_000, 1_600_000, 3_200_000]) {
  let r = null;
  for (let a = 0; a < 5; a++) {
    r = await q({ address: PM, topics: [INIT], fromBlock: hex(20_000_000), toBlock: hex(20_000_000 + span - 1) });
    if (r.n !== null) break;
    await sleep(4000 + a * 2000);
  }
  console.log(`  init ${(span / 1000).toString().padStart(5)}k blocks: ${r.n ?? "ERR " + r.err} (${r.ms}ms)`);
  await sleep(4000);
}

console.log("\n-- sustained: 10 x 400k-block init windows, 4s gap, patient retry --");
let ok = 0, logs = 0, attempts = 0;
const t0 = Date.now();
for (let i = 0; i < 10; i++) {
  for (let a = 0; a < 6; a++) {
    attempts++;
    const r = await q({ address: PM, topics: [INIT], fromBlock: hex(25_000_000 + i * 400_000), toBlock: hex(25_399_999 + i * 400_000) });
    if (r.n !== null) { ok++; logs += r.n; break; }
    await sleep(3000 + a * 2000);
  }
  await sleep(4000);
}
console.log(`  ${ok}/10 windows, ${logs} pools, ${attempts} attempts, ${((Date.now() - t0) / 60000).toFixed(2)} min`);
console.log(`  => full 51.2M-block census ≈ ${(128 * (attempts / 10) * 0).toFixed(0)}`);
console.log(`  => projected census time: ${(((Date.now() - t0) / 10) * 128 / 60000).toFixed(0)} min`);

console.log("\n-- swap windows (denser) --");
for (const span of [50_000, 200_000, 400_000]) {
  let r = null;
  for (let a = 0; a < 5; a++) {
    r = await q({ address: PM, topics: [SWAP], fromBlock: hex(40_000_000), toBlock: hex(40_000_000 + span - 1) });
    if (r.n !== null) break;
    await sleep(4000 + a * 2000);
  }
  console.log(`  swap ${(span / 1000).toString().padStart(5)}k blocks: ${r.n ?? "ERR " + r.err} (${r.ms}ms)`);
  await sleep(4000);
}
