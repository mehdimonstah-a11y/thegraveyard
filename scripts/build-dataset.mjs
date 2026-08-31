import fs from "node:fs/promises";

/**
 * Compile the scan into the single JSON file the site reads.
 *
 * The website never talks to the chain to render a page — 542,707 pools cannot
 * be scanned on a page load, and the endpoint that carries this chain throttles
 * after two log queries. So the pipeline writes a dataset and the site reads it,
 * with the block it was taken at printed on every surface that shows a figure.
 *
 * Rules this file enforces:
 *   - Nothing is interpolated. A pool with no exact ladder does not appear.
 *   - Every published reserve comes from the exact tick-ladder walk, never from
 *     the cheap active-liquidity screen.
 *   - Sample-derived figures are labelled as sample-derived, with the sample
 *     size and the scale factor attached, so no reader can mistake an
 *     extrapolation for a census.
 */

const DATA = new URL("../data/", import.meta.url);
const OUT = new URL("../src/data/scan.json", import.meta.url);
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d; };

const DEAD_DAYS = Number(arg("--dead-days", 30));
const FLOOR = Number(arg("--floor", 500));

const read = async (n) => { try { return JSON.parse(await fs.readFile(new URL(n, DATA), "utf8")); } catch { return null; } };

/** Input filenames are arguments so a provisional dataset can be compiled from
 *  an earlier, narrower pass while the full one is still running. */
const cursor = await read("pools.cursor.json");
const prices = await read("prices.json");
const liveness = await read(arg("--liveness", "liveness-sample.json"));
const exact = await read(arg("--exact", "exact-sample.json"));
const sample = await read(arg("--sample", "sample.json"));

if (!cursor || !prices || !liveness || !exact || !sample) {
  throw new Error("missing an input: run prices, sample-state, exact-sample and liveness-sample first");
}

const head = cursor.head;
const rows = liveness.rows.filter((r) => !r.error);
const scale = exact.population / exact.sampled;

const graves = rows
  .filter((r) => r.daysIdle >= DEAD_DAYS && r.ceilingUsd > 0)
  .sort((a, b) => b.ceilingUsd - a.ceilingUsd);

const aboveFloor = graves.filter((g) => g.ceilingUsd >= FLOOR);
const sumCeiling = (xs) => xs.reduce((s, g) => s + g.ceilingUsd, 0);
const sumLeft = (xs) => xs.reduce((s, g) => s + g.exactQuoteUsd, 0);

/**
 * A 95% interval on a count from a simple random sample, via the normal
 * approximation to the binomial, scaled to the population. Published beside
 * every extrapolated count, because a count of three observations scaled by
 * 331 is not a number anyone should read without its interval.
 */
function interval(count, n, population) {
  const p = count / n;
  const se = Math.sqrt(Math.max(p * (1 - p), 1e-12) / n);
  return {
    point: Math.round(p * population),
    low: Math.max(0, Math.round((p - 1.96 * se) * population)),
    high: Math.round((p + 1.96 * se) * population),
  };
}

const bands = [1, 10, 100, 500, 1000, 5000].map((from) => {
  const inBand = graves.filter((g) => g.ceilingUsd >= from);
  return { from, sampled: inBand.length, chainWide: interval(inBand.length, exact.sampled, exact.population) };
});

const out = {
  meta: {
    generatedAt: new Date(cursor.headTs ? cursor.headTs * 1000 : Date.now()).toISOString(),
    headBlock: head,
    chainId: 4663,
    poolsInitialised: cursor.count,
    quoteSidePopulation: exact.population,
    sampleSize: exact.sampled,
    scaleFactor: scale,
    deadDays: DEAD_DAYS,
    floorUsd: FLOOR,
    secPerBlock: liveness.secPerBlock,
    prices: { eth: prices.eth, usdg: prices.usdg, feeds: prices.feeds },
    method:
      "Every pool ever initialised was enumerated from Initialize events on the Uniswap V4 " +
      "singleton. A random sample of the pools with a quote asset on one side was screened " +
      "from contract storage, and every pool that could hold real money had its exact position " +
      "ladder pulled from ModifyLiquidity events and its reserve computed in integer arithmetic. " +
      "Liveness and tradeability come from each pool's complete swap history.",
  },
  totals: {
    /** Measured, not extrapolated: these are the graves we actually read. */
    measuredGraves: graves.length,
    measuredWhatsLeftUsd: sumLeft(graves),
    measuredCeilingUsd: sumCeiling(graves),
    measuredAboveFloor: aboveFloor.length,
    measuredAboveFloorCeilingUsd: sumCeiling(aboveFloor),
    /** Extrapolated, with intervals. Never printed without the word "estimated". */
    chainWideGraves: interval(graves.length, exact.sampled, exact.population),
    chainWideAboveFloor: interval(aboveFloor.length, exact.sampled, exact.population),
    chainWideCeilingUsd: Math.round(sumCeiling(graves) * scale),
    /** The archive. Zero, and it says zero. */
    exhumationsRun: 0,
    recoveredUsd: 0,
    paidOutUsd: 0,
  },
  bands,
  tradeability: {
    withCompletedSell: rows.filter((r) => r.sells > 0).length,
    neverTraded: rows.filter((r) => r.neverTraded).length,
    tradedNeverSold: rows.filter((r) => !r.neverTraded && r.sells === 0).length,
  },
  graves: graves.slice(0, 250).map((g) => ({
    id: g.id,
    token: g.token,
    quote: g.quote,
    whatsLeftUsd: g.exactQuoteUsd,
    ceilingUsd: g.ceilingUsd,
    daysIdle: g.daysIdle,
    lastBlock: g.lastBlock,
    swaps: g.swaps,
    sells: g.sells,
    /** True when the swap counts come from a window rather than the pool's
     *  whole life. The last-swap block is exact regardless. */
    historyPartial: Boolean(g.historyPartial),
    fullRange: Boolean(g.fullRange),
    fee: g.fee,
    hooks: g.hooks,
  })),
};

await fs.mkdir(new URL("../src/data/", import.meta.url), { recursive: true });
await fs.writeFile(OUT, JSON.stringify(out, null, 1));

console.log(`wrote src/data/scan.json`);
console.log(`  head block         ${head}`);
console.log(`  pools initialised  ${cursor.count}`);
console.log(`  sample             ${exact.sampled} of ${exact.population} (x${scale.toFixed(1)})`);
console.log(`  measured graves    ${graves.length}  ceiling $${sumCeiling(graves).toFixed(2)}`);
console.log(`  above $${FLOOR}         ${aboveFloor.length}  ->  chain-wide ${out.totals.chainWideAboveFloor.low}-${out.totals.chainWideAboveFloor.high}`);
