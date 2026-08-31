import fs from "node:fs/promises";
import { keccak256, encodeAbiParameters } from "viem";
import { rpcBatch, isErr, POOL_MANAGER, SEL } from "./rpc.mjs";

/**
 * The reconstruction has to earn its claim.
 *
 * Every figure in the scan comes from replaying event logs rather than from
 * reading contract storage (see D1 in DECISIONS.md). That is the only way a
 * census of several hundred thousand pools finishes against a throttled
 * endpoint, and it is also a way to be quietly, systematically wrong.
 *
 * So: take a random sample of graves, read their actual `slot0` and active
 * `liquidity` out of the PoolManager with `extsload`, and compare. A mismatch
 * is not something to correct in the dataset. It means the method is wrong and
 * the published figures come down.
 *
 * PoolManager storage: mapping(PoolId => Pool.State) at slot 6.
 *   +0  slot0 = sqrtPriceX96 | tick | protocolFee | lpFee   (packed)
 *   +3  liquidity (uint128)
 */

const POOLS_SLOT = 6n;
const SAMPLE = Number(process.env.SAMPLE || 60);

const stateSlot = (poolId) =>
  keccak256(encodeAbiParameters([{ type: "bytes32" }, { type: "uint256" }], [poolId, POOLS_SLOT]));
const offset = (base, n) => "0x" + (BigInt(base) + BigInt(n)).toString(16).padStart(64, "0");
const extsload = (slot) => ({ method: "eth_call", params: [{ to: POOL_MANAGER, data: SEL.extsload + slot.slice(2) }, "latest"] });

const data = JSON.parse(await fs.readFile(new URL("../data/graves.json", import.meta.url), "utf8"));
const pool = data.graves;

// Deterministic sample: every nth grave across the whole distribution, so the
// check covers dust and the top of the table alike rather than the head.
const step = Math.max(1, Math.floor(pool.length / SAMPLE));
const sample = pool.filter((_g, i) => i % step === 0).slice(0, SAMPLE);

console.log(`verifying ${sample.length} of ${pool.length} graves against contract storage`);

const calls = sample.flatMap((g) => {
  const base = stateSlot(g.id);
  return [extsload(base), extsload(offset(base, 3))];
});
const results = await rpcBatch(calls, { chunk: 120 });

let checked = 0, priceOk = 0, liqOk = 0;
const failures = [];

sample.forEach((g, i) => {
  const raw0 = results[i * 2];
  const raw3 = results[i * 2 + 1];
  if (isErr(raw0) || isErr(raw3) || typeof raw0 !== "string" || raw0.length !== 66) return;
  checked++;

  const w = BigInt(raw0);
  const onChainSqrt = w & ((1n << 160n) - 1n);
  let onChainTick = Number((w >> 160n) & 0xffffffn);
  if (onChainTick >= 0x800000) onChainTick -= 0x1000000;
  const onChainLiq = BigInt(raw3);

  const ourSqrt = BigInt(g.sqrtPriceX96);
  // Active liquidity at the current tick, from our reconstructed positions.
  const ourLiq = g.positions.reduce((s, [lo, hi, L]) => {
    return lo <= onChainTick && onChainTick < hi ? s + BigInt(L) : s;
  }, 0n);

  const priceMatch = onChainSqrt === ourSqrt;
  const liqMatch = onChainLiq === ourLiq;
  if (priceMatch) priceOk++;
  if (liqMatch) liqOk++;

  if (!priceMatch || !liqMatch) {
    failures.push({
      id: g.id, token: g.token,
      price: priceMatch ? "ok" : `chain ${onChainSqrt} vs ours ${ourSqrt}`,
      liquidity: liqMatch ? "ok" : `chain ${onChainLiq} vs ours ${ourLiq}`,
    });
  }
});

console.log(`\nread ${checked} pools from storage`);
console.log(`  price matches:     ${priceOk}/${checked}  (${((priceOk / checked) * 100).toFixed(1)}%)`);
console.log(`  liquidity matches: ${liqOk}/${checked}  (${((liqOk / checked) * 100).toFixed(1)}%)`);

if (failures.length) {
  console.log(`\n${failures.length} mismatch(es), first 10:`);
  for (const f of failures.slice(0, 10)) console.log(`  ${f.token} ${f.id.slice(0, 12)}…  price ${f.price}  liq ${f.liquidity}`);
}

await fs.writeFile(new URL("../data/verification.json", import.meta.url), JSON.stringify({
  sampled: sample.length, checked, priceOk, liqOk, failures,
}, null, 1));

// A reconstruction that does not match storage is not a dataset with a caveat.
if (checked === 0) { console.error("\nFAIL: no pool could be read from storage"); process.exit(1); }
if (priceOk !== checked || liqOk !== checked) {
  console.error("\nFAIL: the reconstruction disagrees with contract storage. Figures must not be published.");
  process.exit(1);
}
console.log("\nPASS: every sampled pool matches contract storage exactly.");
