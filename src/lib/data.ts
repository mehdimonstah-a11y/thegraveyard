import raw from "@/data/scan.json";

/**
 * The dataset the site renders.
 *
 * It is compiled by `scripts/build-dataset.mjs` from the chain scan and read
 * here as a static import — the site never queries the chain to render a page.
 * That is not a shortcut: 542,707 pools cannot be scanned on a page load, and
 * the only endpoint that serves logs for this chain throttles after two
 * queries. The trade is that every figure is as of a stated block, and every
 * surface that shows a figure prints that block.
 *
 * Two categories of number live here and they are never mixed:
 *
 *   MEASURED     a count or a sum over pools we actually read. Exact.
 *   ESTIMATED    a measured count scaled to the population by the sampling
 *                factor, always carrying a 95% interval. Never rendered
 *                without the word "estimated" and never in the largest type.
 */

export interface Grave {
  id: string;
  token: string;
  quote: string;
  whatsLeftUsd: number;
  ceilingUsd: number;
  daysIdle: number;
  lastBlock: number | null;
  swaps: number;
  sells: number;
  fullRange: boolean;
  fee: number;
  hooks: string;
}

export interface Interval {
  point: number;
  low: number;
  high: number;
}

export interface ScanData {
  meta: {
    generatedAt: string;
    headBlock: number;
    chainId: number;
    poolsInitialised: number;
    quoteSidePopulation: number;
    sampleSize: number;
    scaleFactor: number;
    deadDays: number;
    floorUsd: number;
    secPerBlock: number;
    prices: { eth: number; usdg: number; feeds: Record<string, unknown> };
    method: string;
  };
  totals: {
    measuredGraves: number;
    measuredWhatsLeftUsd: number;
    measuredCeilingUsd: number;
    measuredAboveFloor: number;
    measuredAboveFloorCeilingUsd: number;
    chainWideGraves: Interval;
    chainWideAboveFloor: Interval;
    chainWideCeilingUsd: number;
    exhumationsRun: number;
    recoveredUsd: number;
    paidOutUsd: number;
  };
  bands: { from: number; sampled: number; chainWide: Interval }[];
  tradeability: { withCompletedSell: number; neverTraded: number; tradedNeverSold: number };
  graves: Grave[];
}

export const scan = raw as unknown as ScanData;

/** Money, tabular, never abbreviated above a dollar. */
export function usd(n: number, opts: { cents?: boolean } = {}): string {
  const cents = opts.cents ?? n < 1000;
  return n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: cents ? 2 : 0,
    maximumFractionDigits: cents ? 2 : 0,
  });
}

export function num(n: number): string {
  return n.toLocaleString("en-US");
}

/** An interval, printed the only way it should be: as a range. */
export function range(i: Interval): string {
  return `${num(i.low)}–${num(i.high)}`;
}

export function feeLabel(fee: number): string {
  if (fee & 0x800000) return "dynamic";
  return `${(fee / 10_000).toFixed(2)}%`;
}
