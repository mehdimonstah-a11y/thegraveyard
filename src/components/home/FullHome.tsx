import Link from "next/link";
import { Button, Container, Eyebrow, Footer, Header, Section } from "@/components/Chrome";
import { Hero } from "@/components/Hero";
import { Marquee } from "@/components/Marquee";
import { Shortfall } from "@/components/Shortfall";
import { ScanTable } from "@/components/ScanTable";
import { Accordion, WaitlistForm } from "@/components/Bits";
import { num, range, scan, usd } from "@/lib/data";
import { blockUrl, TICKER } from "@/lib/chain";

/**
 * The homepage.
 *
 * Section order, count, grounds and padding replicate SPEC.md §2 and §8's
 * mapping table exactly: ten sections plus a footer, in the reference's order,
 * with the reference's rhythm. Nothing is merged, reordered or invented.
 *
 * Every figure below comes from `src/data/scan.json`, which is compiled by the
 * scan pipeline. Measured counts and estimated counts are visually and verbally
 * distinct, and no estimate appears in display type.
 */

const { meta, totals, graves, tradeability } = scan;

export default function FullHome() {
  const top = graves[0];

  return (
    <>
      <Header />
      <main>
        {/* 0 — hero */}
        <Hero headBlock={meta.headBlock} poolsInitialised={meta.poolsInitialised} />

        {/* 1 — full-bleed 80px marquee */}
        <Marquee graves={graves} />

        {/* 2 — two-column: the argument, and the curve drawn on a real grave */}
        <Section id="stuck" tight>
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
            <div>
              <Eyebrow>Why it&rsquo;s stuck</Eyebrow>
              <h2 className="mt-5 max-w-[16ch] text-[32px] font-medium leading-[1.06] tracking-[-0.015em] md:text-[48px]">
                Nobody kept the key. There was never a key.
              </h2>
              <p className="mt-6 max-w-[58ch] text-[16px] leading-6 text-ink-2 md:text-[18px]">
                Pons, Layup, long.xyz and Ascend all lock launch liquidity permanently, with no
                withdrawal function. It is a good design — it stops rugs. It also means that when
                a token dies, the quote asset in its pool stays there.
              </p>
              <ul className="mt-9 border-t border-line">
                {[
                  ["The LP is locked forever", "There is no withdrawal function to call. Not for the deployer, not for anyone."],
                  ["The only exit is a sale", "Quote asset leaves a pool when someone sells tokens into it. That is the whole mechanism."],
                  ["No holder owns enough", "One person's bag moves the price a fraction of a percent and returns dust."],
                  ["So nobody bothers", "The position was written off months ago. Most holders have never looked at it again."],
                ].map(([h, b]) => (
                  <li key={h} className="border-b border-line py-4">
                    <p className="text-[16px] leading-6 font-medium text-ink">{h}</p>
                    <p className="mt-1.5 max-w-[56ch] text-[15px] leading-6 text-ink-2">{b}</p>
                  </li>
                ))}
              </ul>
              <div className="mt-9">
                <Button href="/docs" variant="secondary" size="md">
                  Read the mechanism
                </Button>
              </div>
            </div>

            <div className="lg:pt-14">
              {top ? (
                <Shortfall
                  whatsLeftUsd={top.whatsLeftUsd}
                  label={`${top.token.slice(0, 10)}… · ${top.quote}`}
                />
              ) : (
                <div className="border border-line bg-surface-1 p-8">
                  <p className="text-[15px] leading-6 text-ink-2">
                    No grave has been measured yet, so there is nothing to draw.
                  </p>
                </div>
              )}
              <p className="mt-4 max-w-[58ch] text-[13px] leading-5 text-ink-2">
                Drawn on the largest grave the scan found, using its measured reserve. The
                constant-product form is <span className="tnum">out(Δ) = R_q · Δ(1−f) / (R_t + Δ(1−f))</span>,
                which approaches the reserve and never reaches it.
              </p>
            </div>
          </div>
        </Section>

        {/* 3 — alternate ground: the round, then the published minimums */}
        <Section id="exhumation" ground="s1">
          <Eyebrow>An exhumation</Eyebrow>
          <h2 className="mt-5 max-w-[22ch] text-[32px] font-medium leading-[1.06] tracking-[-0.015em] md:text-[48px]">
            One round per grave. There is no second one.
          </h2>
          <p className="mt-6 max-w-[62ch] text-[16px] leading-6 text-ink-2 md:text-[18px]">
            A dead pool does not refill. The size of the round decides everyone&rsquo;s payout, so
            the whole design is about being honest with people before they deposit rather than
            after.
          </p>
          <div className="mt-8">
            <Button href="/docs#exhumation" variant="primary" size="md">
              How a round runs
            </Button>
          </div>

          <div className="mt-14 grid border-t border-line md:grid-cols-3 md:border-l">
            {[
              ["Open", `Anyone burns ${TICKER} to nominate a dead pool. The supply falls permanently every time.`],
              ["Gather", "Holders bring their bags in for a fixed window. The interface shows your split falling as others join."],
              ["Cut, exhume, split", "Deposits past the dust line are refused, not diluted. One transaction, then pro rata, claimable forever."],
            ].map(([h, b], i) => (
              <div key={h} className="border-b border-line px-0 py-6 md:border-r md:px-8 md:py-8">
                <p className="tnum text-[12px] leading-4 uppercase tracking-[0.06em] text-ink-3">
                  {String(i + 1).padStart(2, "0")}
                </p>
                <p className="mt-3 text-[20px] leading-7 font-medium text-ink md:text-[24px]">{h}</p>
                <p className="mt-2 max-w-[42ch] text-[15px] leading-6 text-ink-2">{b}</p>
              </div>
            ))}
          </div>

          <div className="mt-20">
            <h2 className="max-w-[20ch] text-[28px] font-medium leading-[1.08] tracking-[-0.015em] md:text-[36px]">
              The published minimums
            </h2>
            <p className="mt-5 max-w-[62ch] text-[16px] leading-6 text-ink-2 md:text-[18px]">
              A grave has to clear all three before it can be opened. They are published because a
              threshold you cannot check is not a threshold —{" "}
              <span className="text-accent">
                and at the minimum reserve below, nothing on this chain currently clears them.
              </span>{" "}
              That is the measurement, not a placeholder.
            </p>
            <div className="mt-8">
              <Button href="/scan" variant="secondary" size="md">
                See the dataset
              </Button>
            </div>

            <div className="mt-10 grid border border-line md:grid-cols-3">
              {[
                {
                  name: "Minimum reserve",
                  figure: usd(meta.floorUsd, { cents: false }),
                  body: "A pool holding less than this cannot pay for the attention it would take, and the round would end in dust.",
                  status: "Set, not deployed",
                },
                {
                  name: "Dust threshold",
                  figure: "$1.00",
                  body: "Once the marginal recovery for a depositor falls below a dollar, further deposits are refused rather than accepted and diluted.",
                  status: "Set, not deployed",
                },
                {
                  name: "Gather window",
                  figure: "72h",
                  body: "The shortest window that gives holders of a forgotten token a realistic chance to notice. Deposits are locked for its duration.",
                  status: "Set, not deployed",
                },
              ].map((c, i) => (
                <div
                  key={c.name}
                  className={`p-6 md:p-8 ${i < 2 ? "border-b border-line md:border-b-0 md:border-r" : ""}`}
                >
                  <p className="text-[20px] leading-7 font-medium text-ink md:text-[24px]">{c.name}</p>
                  <p className="tnum mt-5 text-[40px] leading-none font-medium text-ink md:text-[48px]">
                    {c.figure}
                  </p>
                  <p className="mt-5 max-w-[38ch] text-[14px] leading-[18px] text-ink-2">{c.body}</p>
                  <p className="tnum mt-6 text-[12px] leading-4 uppercase tracking-[0.06em] text-ink-3">
                    {c.status}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </Section>

        {/* 4 — the four measured figures */}
        <Section id="numbers">
          <Eyebrow>What the scan found</Eyebrow>
          <h2 className="mt-5 max-w-[24ch] text-[32px] font-medium leading-[1.06] tracking-[-0.015em] md:text-[48px]">
            Every number here was read off the chain.
          </h2>
          <p className="mt-6 max-w-[62ch] text-[16px] leading-6 text-ink-2 md:text-[18px]">
            Measured at block {num(meta.headBlock)}. Nothing on this page is projected, and the
            last cell is zero because nothing has been recovered yet.
          </p>

          <div className="mt-14 grid border-t border-line sm:grid-cols-2 lg:grid-cols-4 lg:border-l">
            {[
              [num(meta.poolsInitialised), "pools ever initialised on this chain"],
              [num(totals.measuredGraves), `graves measured, idle ${meta.deadDays}+ days`],
              [usd(totals.measuredCeilingUsd, { cents: false }), "recoverable from those graves"],
              [usd(totals.recoveredUsd), "recovered so far, across 0 exhumations"],
            ].map(([figure, caption], i) => (
              <div
                key={caption}
                className={`border-b border-line py-7 lg:border-r lg:px-8 ${i > 0 ? "sm:border-l lg:border-l-0" : ""}`}
              >
                <p className="tnum text-[36px] leading-none font-medium text-ink md:text-[48px]">
                  {figure}
                </p>
                <p className="mt-4 max-w-[26ch] text-[14px] leading-[18px] text-ink-2">{caption}</p>
              </div>
            ))}
          </div>

          <p className="mt-8 max-w-[86ch] text-[14px] leading-[18px] text-ink-2">
            Method: every pool was enumerated from Initialize events on the Uniswap V4 singleton.
            A random sample of {num(meta.sampleSize)} of the {num(meta.quoteSidePopulation)} pools
            with ETH, WETH, flETH or USDG on one side was screened from contract storage, and every
            pool that could hold real money had its exact position ladder pulled from
            ModifyLiquidity events and its reserve computed in integer arithmetic. The four figures
            above are counts over what was actually read. Scaling the sample to the whole chain
            gives an estimated {range(totals.chainWideGraves)} graves and{" "}
            {range(totals.chainWideAboveFloor)} above the {usd(meta.floorUsd, { cents: false })}{" "}
            floor, at 95% confidence — an estimate, which is why it is in this paragraph and not in
            the type above.{" "}
            <a
              className="t150 text-ink underline underline-offset-2 hover:text-accent"
              href={blockUrl(meta.headBlock)}
              target="_blank"
              rel="noreferrer noopener"
            >
              Block {num(meta.headBlock)}
            </a>
            .
          </p>
        </Section>

        {/* 5 — what we refuse */}
        <Section id="refuse">
          <Eyebrow>What we refuse</Eyebrow>
          <h2 className="mt-5 max-w-[22ch] text-[32px] font-medium leading-[1.06] tracking-[-0.015em] md:text-[48px]">
            Three things this will not do.
          </h2>
          <p className="mt-6 max-w-[62ch] text-[16px] leading-6 text-ink-2 md:text-[18px]">
            Each of them is a way to make the numbers look better at a depositor&rsquo;s expense.
          </p>

          <div className="mt-12 grid border border-line md:grid-cols-3">
            {[
              {
                h: "Accept a deposit past the cut",
                b: "A fixed pot split among unlimited depositors transfers value from the late arrivals to the early ones. There is no version of that which is fair.",
                c: "Past the point where marginal recovery per token falls below the dust threshold, a deposit is refused on screen, with the reason printed, and the tokens go back.",
                s: "Refused, not diluted",
              },
              {
                h: "Exhume without a fresh check",
                b: "A token that could be sold when its grave opened may block transfers by the time the window closes. Owners change things.",
                c: "The tradeability check runs again immediately before the sale. A failure returns every deposit automatically rather than leaving them somewhere they cannot leave.",
                s: "Checked twice",
              },
              {
                h: "Build an execution engine",
                b: "In a static pool with no other traders — which is what a dead pool is — one sale and twenty slices return the same amount, minus more gas.",
                c: "Our test suite asserts the two agree to within 0.1%. A TWAP here would be a moving graphic that costs depositors money, so there is not one.",
                s: "One transaction",
              },
            ].map((c, i) => (
              <div
                key={c.h}
                className={`p-6 md:p-12 ${i < 2 ? "border-b border-line md:border-b-0 md:border-r" : ""}`}
              >
                <p className="text-[20px] leading-7 font-medium text-ink md:text-[24px]">{c.h}</p>
                <p className="mt-5 max-w-[40ch] text-[15px] leading-6 text-ink-2">{c.b}</p>
                <p className="mt-4 max-w-[40ch] text-[15px] leading-6 text-ink-2">{c.c}</p>
                <p className="tnum mt-7 text-[12px] leading-4 uppercase tracking-[0.06em] text-accent">
                  {c.s}
                </p>
              </div>
            ))}
          </div>
        </Section>

        {/* 6 — alternate ground: the scan */}
        <Section id="the-scan" ground="s1">
          <Eyebrow>The scan</Eyebrow>
          <h2 className="mt-5 max-w-[24ch] text-[32px] font-medium leading-[1.06] tracking-[-0.015em] md:text-[48px]">
            Every dead pool we have measured, and what is in it.
          </h2>
          <p className="mt-6 max-w-[62ch] text-[16px] leading-6 text-ink-2 md:text-[18px]">
            Keyed by contract address, never by symbol — this chain carries counterfeit tickers and
            two graves can legitimately share one. The bar is the recovery: filled is what comes
            out, hatched is what the maths keeps. Read the amounts before you read anything else.
          </p>
          <div className="mt-8">
            <Button href="/scan" variant="primary" size="md">
              The full dataset
            </Button>
          </div>
          <div className="mt-12">
            <ScanTable graves={graves} pageSize={10} />
          </div>
        </Section>

        {/* 7 — the ugly part */}
        <Section id="ugly">
          <Eyebrow tone="accent">The ugly part</Eyebrow>
          <h2 className="mt-5 max-w-[20ch] text-[32px] font-medium leading-[1.06] tracking-[-0.015em] md:text-[48px]">
            You are not getting your money back.
          </h2>
          <p className="mt-6 max-w-[68ch] text-[17px] leading-7 text-ink md:text-[20px]">
            Constant-product maths means the pool&rsquo;s reserve can never be fully drained, and by
            the time thousands of holders have split what comes out, most people will collect
            single-digit dollars. We will show you your number before you deposit, not after. The
            alternative was zero, and we would rather be boring about that than sell you a recovery.
          </p>

          <div className="mt-14 grid gap-px border-t border-line lg:grid-cols-3">
            {[
              {
                h: "The reserve is never emptied",
                bullets: [
                  "out(Δ) approaches R_q as Δ grows without bound",
                  "It reaches it at no finite amount of supply",
                  "A million times the pool's inventory still leaves a remainder",
                  "That remainder is drawn on every row of the scan",
                ],
              },
              {
                h: "Your share falls as others join",
                bullets: [
                  "The first tenth of supply recovers far more per token than the last",
                  "Every new depositor raises the total and lowers the per-token split",
                  "The preview shows it going down while you watch",
                  "Past the dust line the deposit is refused instead",
                ],
              },
              {
                h: "And the graves are tiny",
                bullets: [
                  `${num(totals.measuredGraves)} graves measured, holding ${usd(totals.measuredCeilingUsd)} between them`,
                  `The largest one holds ${top ? usd(top.whatsLeftUsd) : "—"}. That is the largest`,
                  `${num(totals.measuredAboveFloor)} of them clear the ${usd(meta.floorUsd, { cents: false })} floor`,
                  "The pools with real money in them are the ones people still trade",
                ],
              },
            ].map((c) => (
              <div key={c.h} className="border-b border-line py-8 lg:border-r lg:px-8 lg:last:border-r-0">
                <p className="text-[20px] leading-7 font-medium text-ink md:text-[24px]">{c.h}</p>
                <ul className="mt-5 space-y-3">
                  {c.bullets.map((b) => (
                    <li key={b} className="flex gap-3 text-[14px] leading-[18px] text-ink-2">
                      <span className="mt-2 h-px w-3 shrink-0 bg-line-strong" aria-hidden="true" />
                      <span className="max-w-[36ch]">{b}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </Section>

        {/* 8 — FAQ */}
        <Section ground="s2">
          <Eyebrow>Questions</Eyebrow>
          <h2 className="mt-5 max-w-[20ch] text-[32px] font-medium leading-[1.06] tracking-[-0.015em] md:text-[48px]">
            The ones worth answering.
          </h2>
          <p className="mt-6 max-w-[62ch] text-[16px] leading-6 text-ink-2 md:text-[18px]">
            Including the two that make this look worse.
          </p>
          <div className="mt-12">
            <Accordion
              items={[
                {
                  q: "How much will I actually get?",
                  a: (
                    <>
                      On today&rsquo;s numbers, cents. The scan measured {num(totals.measuredGraves)}{" "}
                      graves holding {usd(totals.measuredCeilingUsd)} between them, none of which
                      clears the {usd(meta.floorUsd, { cents: false })} floor — and that total is
                      before it is split among everyone who deposits into it. We are publishing
                      that rather than a projection, because the projection would be the lie.
                    </>
                  ),
                },
                {
                  q: "Why can't you get all of it out?",
                  a: (
                    <>
                      Because a constant-product pool prices each unit of supply against a shrinking
                      reserve. <span className="tnum">out(Δ) = R_q · Δ(1−f) / (R_t + Δ(1−f))</span>{" "}
                      approaches <span className="tnum">R_q</span> and never arrives. This is not a
                      limitation of our implementation; it is the pool.
                    </>
                  ),
                },
                {
                  q: "Is this recovering my losses?",
                  a: (
                    <>
                      No, and we will not use that phrase. It extracts a fraction of the quote asset
                      stranded in a pool. What you paid for the token is unrelated to what the pool
                      holds today, and anyone conflating the two is selling you something.
                    </>
                  ),
                },
                {
                  q: "What stops you exhuming a honeypot?",
                  a: (
                    <>
                      Right now: nothing, because nothing is deployed. Today the scan screens on
                      evidence — whether a sell has ever completed in that pool, and whether the
                      token&rsquo;s bytecode carries blacklist, pause, trading-gate or
                      max-transaction selectors. A live sell-simulation needs a contract calling the
                      PoolManager through its unlock callback, and that is Phase 1. Until it exists,
                      no grave here is described as having passed one.
                    </>
                  ),
                },
                {
                  q: `What does ${TICKER} do?`,
                  a: (
                    <>
                      It is burned to open a grave, and nothing else. No governance, no staking, no
                      yield, no access tier, no revenue share. Supply falls permanently every time
                      someone nominates a dead pool. It does not exist yet.
                    </>
                  ),
                },
                {
                  q: "Why is the estimate so much wider than the measurement?",
                  a: (
                    <>
                      Because it comes from a sample of {num(meta.sampleSize)} pools out of{" "}
                      {num(meta.quoteSidePopulation)}, and the distribution is dominated by a handful
                      of large graves. A count of a few observations scaled by{" "}
                      {meta.scaleFactor.toFixed(0)} has a wide interval, and printing the midpoint
                      alone would be a stronger claim than the data supports.
                    </>
                  ),
                },
              ]}
            />
          </div>
        </Section>

        {/* 9 — full-bleed accent CTA */}
        <Section id="waitlist" ground="accent">
          <h2 className="max-w-[18ch] text-[32px] font-medium leading-[1.04] tracking-[-0.015em] md:text-[48px]">
            Nothing is deployed. Get told when it is.
          </h2>
          <p className="mt-6 max-w-[58ch] text-[16px] leading-6 text-on-accent/80 md:text-[18px]">
            No token sale, no allocation, no presale. A waitlist and a dataset, which is all there
            is to have right now.
          </p>
          <div className="mt-10">
            <WaitlistForm tone="on-accent" />
          </div>
          <div className="mt-10 flex flex-wrap gap-3">
            <Button href="/docs" variant="on-accent">
              Read the maths first
            </Button>
            <Button href="/scan" variant="on-accent">
              Or the dataset
            </Button>
          </div>
          <p className="mt-9 max-w-[62ch] text-[13px] leading-5 text-on-accent/80">
            There is no token sale and no allocation. The only thing behind this form is a list of
            addresses to email once something exists.{" "}
            <Link href="/exhumations" className="underline underline-offset-2">
              The archive is empty and says so.
            </Link>
          </p>
        </Section>
      </main>
      <Footer headBlock={meta.headBlock} />
    </>
  );
}
