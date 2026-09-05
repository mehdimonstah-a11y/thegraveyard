/**
 * The chain, and the one place any address is written down.
 *
 * Every address here was verified on chain during the scan — the PoolManager by
 * reading its code and its Initialize stream, the quote assets by asking each
 * contract its `symbol()`, `name()`, `decimals()` and `totalSupply()`. Nothing
 * in this file was copied from a block explorer or assumed from another chain.
 *
 * NOTE ON COPY: the chain's name, its id, and the explorer's brand name do not
 * appear anywhere a visitor reads. Neither does an affiliation disclaimer. That
 * boilerplate says nothing a reader can act on and it is the first thing that
 * makes a site look like a template. Explorer links are kept, because a figure
 * you cannot go and check is a claim — they are labelled "Explorer", never by
 * vendor. `scripts/grep-test.mjs` fails the build if any of it comes back.
 */

export const CHAIN_ID = 4663;
export const PUBLIC_RPC = "https://rpc.mainnet.chain.robinhood.com";
/**
 * Server-side only, and never interpolated into a page. Links go through
 * `/e/<kind>/<value>`, which redirects here — see src/app/e/[...path]/route.ts.
 */
export const EXPLORER_ORIGIN = "https://robinhoodchain.blockscout.com";

/** Uniswap V4 singleton. Every pool in the scan lives inside it. */
export const POOL_MANAGER = "0x8366a39cc670b4001a1121b8f6a443a643e40951";

export const QUOTE_ASSETS: Record<string, { symbol: string; decimals: number }> = {
  "0x0000000000000000000000000000000000000000": { symbol: "ETH", decimals: 18 },
  "0x0bd7d308f8e1639fab988df18a8011f41eacad73": { symbol: "WETH", decimals: 18 },
  "0x00000000043c1117dafa3a3d0c7148eb48b30130": { symbol: "flETH", decimals: 18 },
  "0x5fc5360d0400a0fd4f2af552add042d716f1d168": { symbol: "USDG", decimals: 6 },
};

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://thegraveyard.xyz";
export const HANDLE = "@thegraveyardxyz";
export const TICKER = "GRAVE";

/** Server-only. Never imported into a client component. */
export function serverRpcUrl(): string {
  return process.env.RH_RPC_URL || PUBLIC_RPC;
}

export const tokenUrl = (a: string) => `/e/token/${a}`;
export const addressUrl = (a: string) => `/e/address/${a}`;
export const blockUrl = (n: number) => `/e/block/${n}`;
export const txUrl = (h: string) => `/e/tx/${h}`;

/** Short form for a 20-byte address. The full value is always in the title. */
export const short = (a: string, head = 6, tail = 4) =>
  a.length > head + tail + 2 ? `${a.slice(0, head)}…${a.slice(-tail)}` : a;

/**
 * Sentences that must be identical wherever they appear, so they cannot drift
 * between the landing page, the docs and the footer.
 */
export const PHASE_0_SENTENCE =
  "No contract has been deployed and no exhumation has ever run. The scan is real and dated; everything about depositing is described, not offered.";

export const NOT_LOSSES_SENTENCE =
  "The Graveyard extracts a fraction of the quote asset stranded in a dead pool. That is not the same thing as returning what a position cost, and this site will never describe it that way.";
