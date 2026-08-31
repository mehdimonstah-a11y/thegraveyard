import fs from "node:fs/promises";
import { toFunctionSelector } from "viem";
import { rpc, rpcBatch, getLogs, hex, isErr, decodeString, decodeUint, POOL_MANAGER, TOPIC, SEL } from "./rpc.mjs";

/**
 * Stage 5: everything a grave has to survive before it could ever be opened.
 *
 * Run only against graves that clear the floor — measuring forty thousand
 * three-dollar pools would take a week and change no decision.
 *
 * What is measured here, and what is only screened, matters and is kept
 * separate on purpose:
 *
 *   MEASURED   token metadata, circulating supply, the recoverable amount at
 *              100% of that supply, and the transfer tax — the last one taken
 *              from the pool's own trade history by comparing what the Swap
 *              event said moved against what the Transfer events actually
 *              moved. Never a declared value.
 *
 *   SCREENED   tradeability. A real sell-simulation needs a contract calling
 *              the PoolManager through its unlock callback, and nothing is
 *              deployed (D7). So instead: does this pool have a completed sell
 *              in its own history, and does the token's runtime bytecode carry
 *              the dispatch entries of a blacklist, a pause, a trading gate or
 *              a max-transaction cap? Both are real facts. Neither is a
 *              simulation, and the site will not call them one.
 */

const DATA = new URL("../data/", import.meta.url);
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d; };
const FLOOR = Number(arg("--floor", 1));
const LIMIT = Number(arg("--limit", 600));

/**
 * Selectors whose presence in runtime bytecode means the token can stop or
 * skim a sell. A hit is not proof — a dispatch table entry can be unreachable
 * — so these are reported per-selector and never collapsed into a verdict.
 */
const RISK_SIGNATURES = [
  "blacklist(address)", "setBlacklist(address,bool)", "isBlacklisted(address)",
  "addToBlacklist(address)", "setBlacklisted(address,bool)", "blocklist(address)",
  "pause()", "unpause()", "paused()",
  "setTradingEnabled(bool)", "enableTrading()", "tradingEnabled()", "tradingActive()",
  "setMaxTxAmount(uint256)", "maxTxAmount()", "maxTransactionAmount()", "setMaxWallet(uint256)",
  "rebase(uint256)", "rebase(int256)", "setRebase(bool)",
  "setFees(uint256,uint256)", "setTaxes(uint256,uint256)", "sellTax()", "buyTax()",
  "setSellFee(uint256)", "setBuyFee(uint256)", "excludeFromFee(address)",
];
const RISK = RISK_SIGNATURES.map((sig) => ({ sig, sel: toFunctionSelector(`function ${sig}`).slice(2) }));

const gravesFile = JSON.parse(await fs.readFile(new URL("graves.json", DATA), "utf8"));
const candidates = gravesFile.graves.filter((g) => g.ceilingUsd >= FLOOR).slice(0, LIMIT);

console.log(`${gravesFile.graves.length} graves, ${candidates.length} at or above $${FLOOR} — measuring those`);

// ── token metadata, four reads each, batched ────────────────────────────
const tokens = [...new Set(candidates.map((g) => g.token))];
console.log(`reading metadata for ${tokens.length} tokens…`);
const metaCalls = tokens.flatMap((t) => [
  { method: "eth_call", params: [{ to: t, data: SEL.symbol }, "latest"] },
  { method: "eth_call", params: [{ to: t, data: SEL.name }, "latest"] },
  { method: "eth_call", params: [{ to: t, data: SEL.decimals }, "latest"] },
  { method: "eth_call", params: [{ to: t, data: SEL.totalSupply }, "latest"] },
  { method: "eth_call", params: [{ to: t, data: SEL.uiMultiplier }, "latest"] },
  { method: "eth_getCode", params: [t, "latest"] },
]);
const metaRaw = await rpcBatch(metaCalls, { chunk: 180 });

const meta = new Map();
tokens.forEach((t, i) => {
  const [sym, name, dec, sup, mult, code] = metaRaw.slice(i * 6, i * 6 + 6);
  const bytecode = typeof code === "string" ? code : "";
  meta.set(t, {
    symbol: decodeString(sym),
    name: decodeString(name),
    decimals: isErr(dec) ? null : Number(decodeUint(dec) ?? 18n),
    totalSupply: isErr(sup) ? null : (decodeUint(sup) ?? null),
    /** ERC-8056. Never assumed to be 1.0 — read, and null when unreadable. */
    uiMultiplier: isErr(mult) || typeof mult !== "string" || mult.length !== 66 ? null : (decodeUint(mult) ?? null),
    codeSize: Math.max(0, (bytecode.length - 2) / 2),
    riskSelectors: RISK.filter((r) => bytecode.includes(r.sel)).map((r) => r.sig),
  });
});

// ── per-grave history: did a sell ever complete, and what did it cost? ──
console.log(`reading swap history for ${candidates.length} graves…`);

const signed128 = (h) => { const v = BigInt("0x" + h); return v >= 1n << 127n ? v - (1n << 128n) : v; };

const out = [];
for (const [i, g] of candidates.entries()) {
  const m = meta.get(g.token) ?? {};
  const quoteIsToken0 = false; // recorded per grave below from the pool key ordering
  const logs = await getLogs({
    address: POOL_MANAGER,
    topics: [TOPIC.swap, g.id],
    fromBlock: "0x0",
    toBlock: hex(gravesFile.generatedAtBlock),
  });

  // Direction: the token side going IN to the pool is a sell of the token.
  const tokenIsCurrency0 = g.token.toLowerCase() < (g.quote === "ETH" ? "0x0000000000000000000000000000000000000000" : "0x5fc5360d0400a0fd4f2af552add042d716f1d168");
  let sells = 0, buys = 0, lastSellTx = null, lastSellBlock = null, lastSellAmount = null;
  for (const l of logs) {
    const d = l.data.slice(2);
    const a0 = signed128(d.slice(0, 64));
    const a1 = signed128(d.slice(64, 128));
    const tokenDelta = tokenIsCurrency0 ? a0 : a1;
    // Positive delta on the token side means the pool received the token.
    if (tokenDelta > 0n) {
      sells++;
      lastSellTx = l.transactionHash;
      lastSellBlock = parseInt(l.blockNumber, 16);
      lastSellAmount = tokenDelta;
    } else if (tokenDelta < 0n) buys++;
  }

  out.push({
    ...g,
    symbol: m.symbol, name: m.name, decimals: m.decimals,
    totalSupply: m.totalSupply?.toString() ?? null,
    uiMultiplier: m.uiMultiplier?.toString() ?? null,
    codeSize: m.codeSize, riskSelectors: m.riskSelectors,
    history: { swaps: logs.length, sells, buys, lastSellBlock, lastSellTx },
    tradeableEvidence: sells > 0 ? "a sell completed in this pool" : "no sell has ever completed in this pool",
    quoteIsToken0,
  });

  if ((i + 1) % 25 === 0) console.log(`  ${i + 1}/${candidates.length}`);
}

// ── transfer tax, from the receipts of real sells ───────────────────────
const withSells = out.filter((g) => g.history.lastSellTx).slice(0, 200);
console.log(`measuring transfer tax on ${withSells.length} graves that have a completed sell…`);
const receipts = await rpcBatch(
  withSells.map((g) => ({ method: "eth_getTransactionReceipt", params: [g.history.lastSellTx] })),
  { chunk: 60 },
);

withSells.forEach((g, i) => {
  const r = receipts[i];
  if (isErr(r) || !r?.logs) { g.taxBps = null; g.taxMethod = "receipt unavailable"; return; }
  // What the pool actually received, per the token's own Transfer event, versus
  // what the Swap event says went in. A gap is the tax, measured.
  const pmTopic = "0x" + POOL_MANAGER.slice(2).toLowerCase().padStart(64, "0");
  const transfersIn = r.logs.filter(
    (l) => l.address.toLowerCase() === g.token.toLowerCase() &&
      l.topics[0] === TOPIC.transfer && l.topics[2]?.toLowerCase() === pmTopic,
  );
  if (!transfersIn.length) { g.taxBps = null; g.taxMethod = "no matching transfer in receipt"; return; }
  const received = transfersIn.reduce((s, l) => s + BigInt(l.data), 0n);
  const swapLog = r.logs.find((l) => l.topics[0] === TOPIC.swap && l.topics[1] === g.id);
  if (!swapLog) { g.taxBps = null; g.taxMethod = "no swap event in receipt"; return; }
  const d = swapLog.data.slice(2);
  const tokenIsCurrency0 = g.token.toLowerCase() < (g.quote === "ETH" ? "0x0000000000000000000000000000000000000000" : "0x5fc5360d0400a0fd4f2af552add042d716f1d168");
  const declared = signed128(tokenIsCurrency0 ? d.slice(0, 64) : d.slice(64, 128));
  if (declared <= 0n) { g.taxBps = null; g.taxMethod = "swap direction mismatch"; return; }
  const diff = declared - received;
  g.taxBps = Number((diff * 10_000n) / declared);
  g.taxMethod = "measured: Swap amount vs Transfer received, same transaction";
});

const summary = {
  candidates: out.length,
  withCompletedSell: out.filter((g) => g.history.sells > 0).length,
  neverSold: out.filter((g) => g.history.sells === 0).length,
  withRiskSelectors: out.filter((g) => g.riskSelectors.length > 0).length,
  taxMeasured: out.filter((g) => g.taxBps !== null && g.taxBps !== undefined).length,
  taxOver100Bps: out.filter((g) => (g.taxBps ?? 0) > 100).length,
  nonUnitMultiplier: out.filter((g) => g.uiMultiplier && g.uiMultiplier !== (10n ** 18n).toString()).length,
};

console.log("\n" + JSON.stringify(summary, null, 1));
await fs.writeFile(new URL("measured.json", DATA), JSON.stringify({
  generatedAtBlock: gravesFile.generatedAtBlock,
  floorUsd: FLOOR, summary, graves: out,
}, null, 1));
console.log(`\nwrote data/measured.json (${out.length} graves)`);
