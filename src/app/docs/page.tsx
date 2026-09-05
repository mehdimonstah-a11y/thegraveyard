import type { Metadata } from "next";
import { Eyebrow, Footer, Header, Section } from "@/components/Chrome";
import { Accordion } from "@/components/Bits";
import { num, scan, usd } from "@/lib/data";
import { PHASE_0_SENTENCE, TICKER } from "@/lib/chain";

export const metadata: Metadata = {
  title: "Docs",
  description:
    "The mechanism, the recovery maths, the attack surface, and a list of what is not built — by name.",
};

const { meta, totals, graves } = scan;
const topGrave = graves[0];

function H2({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <h2 id={id} className="scroll-mt-24 text-[28px] font-medium leading-tight tracking-[-0.015em] md:text-[36px]">
      {children}
    </h2>
  );
}

function P({ children }: { children: React.ReactNode }) {
  return <p className="max-w-[72ch] text-[15px] leading-6 text-ink-2 md:text-[16px]">{children}</p>;
}

export default function DocsPage() {
  return (
    <>
      <Header />
      <main>
        <Section tight>
          <Eyebrow>Docs</Eyebrow>
          <h1 className="mt-5 max-w-[22ch] text-[36px] font-medium leading-[1.05] tracking-[-0.02em] md:text-[56px]">
            The mechanism, and what it cannot do.
          </h1>
          <p className="mt-7 max-w-[68ch] text-[16px] leading-6 text-ink-2 md:text-[18px]">
            {PHASE_0_SENTENCE}
          </p>
        </Section>

        <Section id="stuck">
          <div className="space-y-6">
            <H2 id="stuck-h">Why the money is stuck</H2>
            <P>
              Launch liquidity here is locked permanently, with no withdrawal function. It is a good
              design — it is the single feature that stops a deployer pulling the pool out from
              under everyone. It also means that when a token dies, the quote asset in its pool
              stays there.
            </P>
            <ul className="max-w-[72ch] border-t border-line">
              {[
                ["The LP is locked forever", "There is no withdrawal function to call. Not for the deployer, not for anyone."],
                ["The only exit is a sale", "Quote asset leaves a pool when someone sells tokens into it. That is the whole mechanism."],
                ["No holder owns enough", "One person's bag moves the price a fraction of a percent and returns dust."],
                ["So nobody bothers", "The position was written off months ago. Most holders have never looked at it again."],
              ].map(([h, b]) => (
                <li key={h} className="border-b border-line py-5">
                  <p className="text-[16px] leading-6 font-medium text-ink">{h}</p>
                  <p className="mt-1.5 max-w-[62ch] text-[15px] leading-6 text-ink-2">{b}</p>
                </li>
              ))}
            </ul>
            <P>
              What none of them can do alone, all of them can do together. That is the entire
              product.
            </P>
          </div>
        </Section>

        <Section ground="s1">
          <div className="space-y-6">
            <H2 id="maths">The recovery maths</H2>
            <P>
              For a pool with reserves <span className="tnum">(R_t, R_q)</span> and fee{" "}
              <span className="tnum">f</span>, selling <span className="tnum">Δ</span> tokens returns
            </P>
            <p className="tnum border border-line bg-surface-2 px-5 py-4 text-[15px] leading-6 text-ink">
              out(Δ) = R_q × Δ(1−f) / (R_t + Δ(1−f))
            </p>
            <P>
              Three properties follow, and all three shape the product rather than sitting in a
              footnote.
            </P>
            <ul className="max-w-[72ch] space-y-4 border-t border-line pt-6">
              {[
                [
                  "It is asymptotic",
                  "out(Δ) approaches R_q as Δ grows without bound, and reaches it at no finite amount of supply. You can never recover the full reserve. This is drawn on the homepage rather than mentioned.",
                ],
                [
                  "Marginal recovery falls fast",
                  "The first tenth of supply recovers far more per token than the last. Every additional depositor raises the total recovered and lowers the payout per token for everyone already in.",
                ],
                [
                  "Execution is path-independent",
                  "In a static pool with no other traders — which is the definition of a dead pool — selling in one transaction and selling in twenty slices return the same amount, minus more gas. Our test suite asserts the two agree to within 0.1%. There is no TWAP here and building one would be theatre.",
                ],
              ].map(([h, b]) => (
                <li key={h}>
                  <p className="text-[16px] leading-6 font-medium text-ink">{h}</p>
                  <p className="mt-1.5 text-[15px] leading-6 text-ink-2">{b}</p>
                </li>
              ))}
            </ul>
            <P>
              The site does not use that closed form to publish a figure. It is exact only when a
              pool&rsquo;s liquidity is a single full-range position, and it overstates the recovery
              for a pool with several ranges — the one direction this product may not be wrong in.
              Every published number comes from walking the actual tick ladder in integer
              arithmetic, which reduces to the formula above on a full-range pool and is asserted to
              do so.
            </P>
          </div>
        </Section>

        <Section>
          <div className="space-y-6">
            <H2 id="exhumation">How a round runs</H2>
            <div className="grid border-t border-line md:grid-cols-2">
              {[
                ["01 Open", `Anyone burns ${TICKER} to nominate a dead pool. It has to pass the tradeability screen, have a measured tax below the recovery, and hold at least the published minimum reserve of ${usd(meta.floorUsd, { cents: false })}.`],
                ["02 Gather", "A fixed 72-hour window. Holders deposit that token. The interface shows the total deposited, the total recoverable at the current level, and your payout at the current level — the third number goes down as others join, and it is shown going down."],
                ["03 Cut", "Deposits beyond the point where marginal recovery per token falls below the dust threshold are refused, not accepted and diluted. Late depositors get their tokens back rather than a rounding error. This is the ethical core of the design and it is not negotiable."],
                ["04 Exhume", "One transaction, permissionless after the window closes, paying a bounty from the proceeds so nobody has to be trusted to be awake. The tradeability check runs again immediately beforehand; a failure returns every deposit."],
                ["05 Split", "Proceeds distributed pro rata, minus the protocol fee and the bounty. Claimable forever, with no deadline and no unclaimed-funds sweep. Rounding favours the depositor, always."],
              ].map(([h, b]) => (
                <div key={h} className="border-b border-line py-6 md:px-8 md:odd:border-r">
                  <p className="tnum text-[12px] leading-4 uppercase tracking-[0.06em] text-ink-3">
                    {h.slice(0, 2)}
                  </p>
                  <p className="mt-3 text-[18px] leading-6 font-medium text-ink md:text-[20px]">
                    {h.slice(3)}
                  </p>
                  <p className="mt-2 max-w-[52ch] text-[15px] leading-6 text-ink-2">{b}</p>
                </div>
              ))}
            </div>
          </div>
        </Section>

        <Section id="refuse" ground="s1">
          <div className="space-y-6">
            <H2 id="refuse-h">What we refuse</H2>
            <P>Three things this will not do. Each of them would make the numbers look better at a depositor&rsquo;s expense.</P>
            <div className="grid border border-line md:grid-cols-3">
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
                  c: "The test suite asserts the two agree to within 0.1%. A TWAP here would be a moving graphic that costs depositors money, so there is not one.",
                  s: "One transaction",
                },
              ].map((c, i) => (
                <div key={c.h} className={`p-6 md:p-10 ${i < 2 ? "border-b border-line md:border-b-0 md:border-r" : ""}`}>
                  <p className="text-[20px] leading-7 font-medium text-ink md:text-[24px]">{c.h}</p>
                  <p className="mt-5 max-w-[40ch] text-[15px] leading-6 text-ink-2">{c.b}</p>
                  <p className="mt-4 max-w-[40ch] text-[15px] leading-6 text-ink-2">{c.c}</p>
                  <p className="tnum mt-7 text-[12px] leading-4 uppercase tracking-[0.06em] text-accent">
                    {c.s}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </Section>

        <Section id="ugly">
          <div className="space-y-6">
            <Eyebrow tone="accent">The ugly part</Eyebrow>
            <h2
              id="ugly-h"
              className="scroll-mt-24 max-w-[20ch] text-[32px] font-medium leading-[1.06] tracking-[-0.015em] md:text-[48px]"
            >
              You are not getting your money back.
            </h2>
            <p className="max-w-[68ch] text-[17px] leading-7 text-ink md:text-[20px]">
              Constant-product maths means the pool&rsquo;s reserve can never be fully drained, and
              by the time thousands of holders have split what comes out, most people will collect
              single-digit dollars. We will show you your number before you deposit, not after. The
              alternative was zero, and we would rather be boring about that than sell you a
              recovery.
            </p>
            <div className="grid gap-px border-t border-line lg:grid-cols-3">
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
                    `The largest one holds ${topGrave ? usd(topGrave.whatsLeftUsd) : "—"}. That is the largest`,
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
          </div>
        </Section>

        <Section>
          <div className="space-y-6">
            <H2 id="attacks">Attack surface</H2>
            <P>Enumerated, with what is done about each and what is not done yet.</P>
            <div className="scroll-x border border-line">
              <table className="w-full min-w-[640px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-line">
                    {["Attack", "Response", "Status"].map((h) => (
                      <th
                        key={h}
                        scope="col"
                        className="tnum px-5 py-3 text-[12px] leading-4 font-medium uppercase tracking-[0.06em] text-ink-3"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    ["Honeypots — tokens that cannot be sold", "A live sell-simulation at open and again immediately before the exhume; a failure returns every deposit automatically.", "Not built"],
                    ["Transfer-tax tokens", "Round-trip tax measured on chain from the pool's own trade history — the Swap amount against the Transfer actually received in the same transaction. Never a declared value. If the tax exceeds the recovery the grave does not open.", "Measured"],
                    ["Rebasing or blacklisting tokens", "Refused entirely. Screened from the token's runtime bytecode for rebase, blacklist, pause, trading-gate and max-transaction selectors.", "Screened"],
                    ["Front-running the exhume", "The exhume transaction is public and the pool is unwatched, so the risk is small but real. Published rather than mitigated; a commit-reveal on the exhume amount is under consideration.", "Published risk"],
                    ["Deposit-then-withdraw griefing", "Deposits are locked for the duration of the window, so the live payout preview cannot be distorted by a deposit that is about to leave.", "Designed"],
                    ["A grave that is not dead", "\"Dead\" is defined mechanically as no swap in " + meta.deadDays + " days, re-checked at exhume time, and the round aborts if it fails.", "Designed"],
                    ["Dust griefing — opening thousands of worthless graves", `The burn-to-open cost, sized against the published minimum reserve of ${usd(meta.floorUsd, { cents: false })}.`, "Designed"],
                    ["Rounding", "Always against the protocol, never against the depositor. The amounts are small and the goodwill is the product.", "Designed"],
                  ].map(([a, r, s]) => (
                    <tr key={a} className="border-b border-line last:border-0 align-top">
                      <td className="px-5 py-4 text-[14px] leading-5 text-ink">{a}</td>
                      <td className="max-w-[42ch] px-5 py-4 text-[14px] leading-5 text-ink-2">{r}</td>
                      <td className="tnum whitespace-nowrap px-5 py-4 text-[12px] uppercase tracking-[0.06em] text-ink-3">
                        {s}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Section>

        <Section>
          <div className="space-y-6">
            <H2 id="limits">What is not built</H2>
            <P>By name, because a capability list that only lists what works is marketing.</P>
            <div className="grid border-t border-line md:grid-cols-3">
              {[
                {
                  head: "Live",
                  tone: "text-accent",
                  items: [
                    "The pool census — all " + num(meta.poolsInitialised) + " pools, complete",
                    "Exact reserves from the tick ladder, in integer arithmetic",
                    "Liveness and sell history, per grave, from its own swap log",
                    "The recovery curve, drawn on real reserves",
                  ],
                },
                {
                  head: "Partial",
                  tone: "text-ink",
                  items: [
                    "Chain-wide totals — sampled, with published intervals, not a census",
                    "Tradeability — screened from history and bytecode, not simulated",
                    "Transfer tax — measured where a pool has a completed sell to measure from",
                  ],
                },
                {
                  head: "Not built",
                  tone: "text-ink-2",
                  items: [
                    "Any contract at all. Nothing is deployed",
                    "The " + TICKER + " token",
                    "A live sell-simulation through the PoolManager unlock callback",
                    "Deposits, the cut, the exhume, the split, claims",
                    "Wallet connect and your-own-bags highlighting",
                  ],
                },
              ].map((col, i) => (
                <div key={col.head} className={`border-b border-line py-7 md:px-8 ${i < 2 ? "md:border-r" : ""}`}>
                  <p className={`tnum text-[12px] leading-4 uppercase tracking-[0.06em] ${col.tone}`}>
                    {col.head}
                  </p>
                  <ul className="mt-4 space-y-2.5">
                    {col.items.map((it) => (
                      <li key={it} className="text-[14px] leading-5 text-ink-2">
                        {it}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </Section>

        <Section ground="s1">
          <div className="space-y-6">
            <H2 id="token">The {TICKER} token</H2>
            <P>
              Burned to open a grave. Supply falls permanently every time someone nominates a dead
              pool for recovery. That is the token&rsquo;s entire job.
            </P>
            <P>
              No governance. No staking. No yield. No access tier. No revenue share, and no
              value-accrual language anywhere on this site — deliberately, because the moment a
              token is described as capturing value it becomes a different kind of instrument and
              this is not one. It does not exist yet and there is no sale planned.
            </P>
            <H2 id="numbers">What the scan currently says</H2>
            <P>
              {num(totals.measuredGraves)} graves measured at block {num(meta.headBlock)}, holding{" "}
              {usd(totals.measuredCeilingUsd)} of recoverable quote asset between them, of which{" "}
              {num(totals.measuredAboveFloor)} clear the {usd(meta.floorUsd, { cents: false })}{" "}
              floor. {usd(totals.recoveredUsd)} has been recovered, across{" "}
              {totals.exhumationsRun} exhumations, because there have been none.
            </P>
          </div>
        </Section>
        <Section id="questions" ground="s2">
          <div className="space-y-6">
            <H2 id="questions-h">The questions worth answering</H2>
            <P>Including the two that make this look worse.</P>
            <div className="pt-4">
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
                        Because a constant-product pool prices each unit of supply against a
                        shrinking reserve.{" "}
                        <span className="tnum">out(Δ) = R_q · Δ(1−f) / (R_t + Δ(1−f))</span>{" "}
                        approaches <span className="tnum">R_q</span> and never arrives. This is not a
                        limitation of our implementation; it is the pool.
                      </>
                    ),
                  },
                  {
                    q: "Is this recovering what I lost?",
                    a: (
                      <>
                        No, and we will not use that phrase. It extracts a fraction of the quote
                        asset stranded in a pool. What you paid for the token is unrelated to what
                        the pool holds today, and anyone conflating the two is selling you
                        something.
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
                        max-transaction selectors. A live sell-simulation needs a contract calling
                        the PoolManager through its unlock callback, and that is Phase 1. Until it
                        exists, no grave here is described as having passed one.
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
                        {num(meta.quoteSidePopulation)}, and the distribution is dominated by a
                        handful of large graves. A count of a few observations scaled by{" "}
                        {meta.scaleFactor.toFixed(0)} has a wide interval, and printing the midpoint
                        alone would be a stronger claim than the data supports.
                      </>
                    ),
                  },
                ]}
              />
            </div>
          </div>
        </Section>

      </main>
      <Footer headBlock={meta.headBlock} />
    </>
  );
}
