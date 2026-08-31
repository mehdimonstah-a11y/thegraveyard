import fs from "node:fs/promises";
import { rpc, isErr, decodeString, SEL } from "./rpc.mjs";

/**
 * The two prices the scan needs, read from the Chainlink aggregators that
 * Robinhood Chain publishes on chain.
 *
 * USDG is not assumed to be a dollar. It has a feed; the feed is what we use.
 * If either read fails the file is not written, because a graveyard total
 * denominated in a made-up ETH price is worse than no total at all.
 */

const FEEDS = {
  eth: "0x6091e64eb7138eef066a80fd3a0d7427b91f2721",
  usdg: "0x8beee3503f6860d5dac4ce26b5eee92982951c2e",
};

function decodeLatestRoundData(raw) {
  if (typeof raw !== "string" || raw.length < 2 + 64 * 5) return null;
  const d = raw.slice(2);
  const word = (i) => BigInt("0x" + d.slice(i * 64, (i + 1) * 64));
  const answer = word(1);
  const signed = answer >= 1n << 255n ? answer - (1n << 256n) : answer;
  return { answer: signed, updatedAt: Number(word(3)) };
}

const out = { readAtBlock: parseInt(await rpc("eth_blockNumber"), 16), feeds: {} };

for (const [key, addr] of Object.entries(FEEDS)) {
  const desc = decodeString(await rpc("eth_call", [{ to: addr, data: SEL.description }, "latest"]));
  const dpRaw = await rpc("eth_call", [{ to: addr, data: SEL.decimals }, "latest"]);
  const rdRaw = await rpc("eth_call", [{ to: addr, data: SEL.latestRoundData }, "latest"]);
  if (isErr(dpRaw) || isErr(rdRaw)) throw new Error(`${key}: feed unreadable at ${addr}`);

  const dp = Number(BigInt(dpRaw));
  const rd = decodeLatestRoundData(rdRaw);
  if (!rd || rd.answer <= 0n) throw new Error(`${key}: feed returned no answer`);

  const price = Number(rd.answer) / 10 ** dp;
  out[key] = price;
  out.feeds[key] = { address: addr, description: desc, decimals: dp, updatedAt: rd.updatedAt, updatedAtIso: new Date(rd.updatedAt * 1000).toISOString() };
  const ageH = (Date.now() / 1000 - rd.updatedAt) / 3600;
  console.log(`${key.padEnd(5)} $${price.toFixed(key === "eth" ? 2 : 6)}   ${desc}   updated ${ageH.toFixed(1)}h ago`);
}

await fs.writeFile(new URL("../data/prices.json", import.meta.url), JSON.stringify(out, null, 1));
console.log("wrote data/prices.json");
