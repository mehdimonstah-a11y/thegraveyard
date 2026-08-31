import { rpc, getLogsRange, hex, isErr, POOL_MANAGER, TOPIC, SEL } from "./rpc.mjs";
import { keccak256, encodeAbiParameters } from "viem";

const t0 = Date.now();
const log = (s) => console.log(s);

async function blockTs(n) {
  const b = await rpc("eth_getBlockByNumber", [hex(n), false]);
  return isErr(b) ? null : parseInt(b.timestamp, 16);
}

const head = parseInt(await rpc("eth_blockNumber"), 16);
const chainId = await rpc("eth_chainId");
const headTs = await blockTs(head);
const genesisTs = await blockTs(1);
const secPerBlock = (headTs - genesisTs) / (head - 1);

log(`chainId    ${chainId} (${parseInt(chainId, 16)})`);
log(`head       ${head}  ${new Date(headTs * 1000).toISOString()}`);
log(`block 1    ${new Date(genesisTs * 1000).toISOString()}`);
log(`chain age  ${((headTs - genesisTs) / 86400).toFixed(2)} days   ${secPerBlock.toFixed(4)} s/block`);

log("");
log("-- Initialize events, full history --");
const init = await getLogsRange(
  { address: POOL_MANAGER, topics: [TOPIC.initialize] },
  0, head, 2_000_000,
  (end, n) => log(`   scanned to ${end}  ${n} pools`),
);
log(`pools initialised: ${init.length}`);
log(`first block ${parseInt(init[0]?.blockNumber ?? "0x0", 16)}  last block ${parseInt(init.at(-1)?.blockNumber ?? "0x0", 16)}`);
log("sample topics: " + JSON.stringify(init[0]?.topics));
log("sample data:   " + init[0]?.data);

// Verify the extsload storage layout against a pool with known state.
// PoolManager: mapping(PoolId => Pool.State) _pools at slot 6.
//   +0 slot0 (sqrtPriceX96 | tick | protocolFee | lpFee)   +3 liquidity
const POOLS_SLOT = 6n;
const stateSlot = (poolId) =>
  keccak256(encodeAbiParameters([{ type: "bytes32" }, { type: "uint256" }], [poolId, POOLS_SLOT]));
const addSlot = (s, n) => "0x" + (BigInt(s) + BigInt(n)).toString(16).padStart(64, "0");

const knownPool = "0x3d436b4fdc532c61a0bf15d6cae80a66eb8f28ee9daec34dbec4b5bc9964063b";
const base = stateSlot(knownPool);
const raw0 = await rpc("eth_call", [{ to: POOL_MANAGER, data: SEL.extsload + base.slice(2) }, "latest"]);
const raw3 = await rpc("eth_call", [{ to: POOL_MANAGER, data: SEL.extsload + addSlot(base, 3).slice(2) }, "latest"]);
log("");
log("-- extsload layout check (GME/USDG pool) --");
log("slot0 word: " + raw0);
log("liq   word: " + raw3);
if (typeof raw0 === "string" && raw0.length === 66) {
  const w = BigInt(raw0);
  const sqrtPriceX96 = w & ((1n << 160n) - 1n);
  let tick = Number((w >> 160n) & 0xffffffn);
  if (tick >= 0x800000) tick -= 0x1000000;
  log(`sqrtPriceX96=${sqrtPriceX96}  tick=${tick}  protocolFee=${Number((w >> 184n) & 0xffffffn)}  lpFee=${Number((w >> 208n) & 0xffffffn)}`);
  log(`liquidity=${typeof raw3 === "string" ? BigInt(raw3) : raw3}`);
}

log("");
log(`${((Date.now() - t0) / 1000).toFixed(1)}s`);
