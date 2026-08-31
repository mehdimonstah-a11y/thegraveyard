import type { Metadata } from "next";
import { Button, Container, Eyebrow, Footer, Header, Section } from "@/components/Chrome";
import { ScanTable } from "@/components/ScanTable";
import { num, range, scan, usd } from "@/lib/data";
import { addressUrl, blockUrl, POOL_MANAGER } from "@/lib/chain";

export const metadata: Metadata = {
  title: "The dataset",
  description:
    "Every dead pool The Graveyard has measured on Robinhood Chain, with the method, the sample, and the intervals.",
};

const { meta, totals, bands, tradeability, graves } = scan;

/**
 * The dataset page. The moat, and the thing that has to be checkable.
 *
 * Everything a reader would need to disagree with us is here: the population,
 * the sample size, the definition of dead, the pricing source, the intervals,
 * and the raw file.
 */
export default function ScanPage() {
  return (
    <>
      <Header />
      <main>
        <Section tight>
          <Eyebrow>The dataset</Eyebrow>
          <h1 className="mt-5 max-w-[24ch] text-[36px] font-medium leading-[1.05] tracking-[-0.02em] md:text-[56px]">
            {num(meta.poolsInitialised)} pools, and what is left in the dead ones.
          </h1>
          <p className="mt-7 max-w-[68ch] text-[16px] leading-6 text-ink-2 md:text-[18px]">
            Taken at block {num(meta.headBlock)} on chain {meta.chainId}. A pool is a grave when it
            has had no swap in {meta.deadDays} days, measured in blocks at this chain&rsquo;s own
            rate of {meta.secPerBlock}s per block. Change that number and the answer changes; the
            per-grave idle days are in the table so you can.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button href="/scan/data.json" variant="primary" size="md">
              Download the JSON
            </Button>
            <Button href={blockUrl(meta.headBlock)} variant="secondary" size="md" external>
              Verify the block
            </Button>
          </div>
        </Section>

        <Section ground="s1">
          <div className="grid border-t border-line sm:grid-cols-2 lg:grid-cols-4 lg:border-l">
            {[
              [num(meta.quoteSidePopulation), "pools with a quote asset on one side"],
              [num(meta.sampleSize), "of them read at random"],
              [num(totals.measuredGraves), `graves found, idle ${meta.deadDays}+ days`],
              [usd(totals.measuredCeilingUsd, { cents: false }), "recoverable from those graves"],
            ].map(([f, c], i) => (
              <div
                key={c}
                className={`border-b border-line py-7 lg:border-r lg:px-8 ${i > 0 ? "sm:border-l lg:border-l-0" : ""}`}
              >
                <p className="tnum text-[32px] leading-none font-medium text-ink md:text-[40px]">{f}</p>
                <p className="mt-4 max-w-[26ch] text-[14px] leading-[18px] text-ink-2">{c}</p>
              </div>
            ))}
          </div>

          <h2 className="mt-16 text-[28px] font-medium leading-tight tracking-[-0.015em] md:text-[36px]">
            The distribution
          </h2>
          <p className="mt-5 max-w-[62ch] text-[16px] leading-6 text-ink-2">
            The left column is what we read. The right is that count scaled to the whole chain, at
            95% confidence. The interval is wide because the distribution is long-tailed and the
            top of it is a handful of pools.
          </p>
          <div className="scroll-x mt-8 border border-line">
            <table className="w-full min-w-[560px] border-collapse text-left">
              <thead>
                <tr className="border-b border-line">
                  {["Recoverable at least", "Graves measured", "Estimated chain-wide"].map((h, i) => (
                    <th
                      key={h}
                      scope="col"
                      className={`tnum px-5 py-3 text-[12px] leading-4 font-medium uppercase tracking-[0.06em] text-ink-3 ${i ? "text-right" : ""}`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {bands.map((b) => (
                  <tr key={b.from} className="border-b border-line last:border-0">
                    <td className="tnum px-5 py-3.5 text-[14px] text-ink">
                      {usd(b.from, { cents: false })}
                    </td>
                    <td className="tnum px-5 py-3.5 text-right text-[14px] text-ink">
                      {num(b.sampled)}
                    </td>
                    <td className="tnum px-5 py-3.5 text-right text-[14px] text-ink-2">
                      {range(b.chainWide)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h2 className="mt-16 text-[28px] font-medium leading-tight tracking-[-0.015em] md:text-[36px]">
            Tradeability
          </h2>
          <p className="mt-5 max-w-[62ch] text-[16px] leading-6 text-ink-2">
            A screen, not a simulation. What a pool&rsquo;s own history shows about whether a sell
            can complete in it.
          </p>
          <div className="mt-8 grid border border-line md:grid-cols-3">
            {[
              [num(tradeability.withCompletedSell), "pools where a sell has completed"],
              [num(tradeability.tradedNeverSold), "pools that traded but never sold"],
              [num(tradeability.neverTraded), "pools that have never traded at all"],
            ].map(([f, c], i) => (
              <div key={c} className={`p-6 md:p-8 ${i < 2 ? "border-b border-line md:border-b-0 md:border-r" : ""}`}>
                <p className="tnum text-[32px] leading-none font-medium text-ink">{f}</p>
                <p className="mt-4 max-w-[30ch] text-[14px] leading-[18px] text-ink-2">{c}</p>
              </div>
            ))}
          </div>
        </Section>

        <Section>
          <h2 className="text-[28px] font-medium leading-tight tracking-[-0.015em] md:text-[36px]">
            Every measured grave
          </h2>
          <p className="mt-5 max-w-[62ch] text-[16px] leading-6 text-ink-2">
            Sorted by recoverable amount. Addresses link to the explorer.
          </p>
          <div className="mt-10">
            <ScanTable graves={graves} pageSize={40} />
          </div>
        </Section>

        <Section ground="s1">
          <h2 className="text-[28px] font-medium leading-tight tracking-[-0.015em] md:text-[36px]">
            Method
          </h2>
          <div className="mt-6 max-w-[72ch] space-y-4 text-[15px] leading-6 text-ink-2">
            <p>
              Every pool that has ever existed on this chain was enumerated from Initialize events
              on the Uniswap V4 singleton at{" "}
              <a
                className="t150 text-ink underline underline-offset-2 hover:text-accent"
                href={addressUrl(POOL_MANAGER)}
                target="_blank"
                rel="noreferrer noopener"
              >
                {POOL_MANAGER}
              </a>
              . That pass is complete, not sampled: {num(meta.poolsInitialised)} pools to block{" "}
              {num(meta.headBlock)}.
            </p>
            <p>
              Quote assets were found by counting currencies across the whole census and asking each
              contract what it is. Four qualify: native ETH, WETH, flETH and USDG. ETH and USDG are
              priced from this chain&rsquo;s own Chainlink feeds — ${meta.prices.eth.toFixed(2)} and $
              {meta.prices.usdg.toFixed(6)} at the time of the scan. WETH and flETH are priced off the
              ETH feed, which is an assumption about their redemption and is recorded as one.
            </p>
            <p>
              Reserves are not taken from active liquidity. Reading a pool&rsquo;s price and active
              liquidity from storage is cheap, and turning that into a reserve assumes the liquidity
              spans the full curve — an assumption that overstated real pools here by up to six
              orders of magnitude. It is used only as a screen that cannot hide a grave. Every
              published reserve comes from the pool&rsquo;s exact position ladder, replayed from
              ModifyLiquidity events and evaluated in integer arithmetic.
            </p>
            <p>
              &ldquo;Recoverable&rdquo; is the ceiling: what an unbounded amount of supply would
              extract, computed by walking the tick ladder. Real recovery is lower, because
              circulating supply is finite and the asymptote is real.
            </p>
          </div>
        </Section>
      </main>
      <Footer headBlock={meta.headBlock} />
    </>
  );
}
