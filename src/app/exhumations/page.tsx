import type { Metadata } from "next";
import { Button, Eyebrow, Footer, Header, Section } from "@/components/Chrome";
import { num, scan, usd } from "@/lib/data";

export const metadata: Metadata = {
  title: "The archive",
  description:
    "Every exhumation ever run, what came out, and what each depositor got. Currently zero, and it says so.",
};

const { meta, totals } = scan;

/**
 * The archive.
 *
 * Built now, while empty, because it is the whole trust argument and it only
 * improves with age. Every round will get a row — the ones that went badly
 * especially, since a results page that only lists successes is an
 * advertisement.
 */
export default function ExhumationsPage() {
  return (
    <>
      <Header />
      <main>
        <Section tight>
          <Eyebrow>The archive</Eyebrow>
          <h1 className="mt-5 max-w-[20ch] text-[36px] font-medium leading-[1.05] tracking-[-0.02em] md:text-[56px]">
            Every round ever run.
          </h1>
          <p className="mt-7 max-w-[68ch] text-[16px] leading-6 text-ink-2 md:text-[18px]">
            There have been none. This page exists now, empty, because it is the only thing that
            will ever be worth believing about this protocol, and a page that appears after the
            first good result is worth nothing.
          </p>
        </Section>

        <Section ground="s1">
          <div className="grid border-t border-line sm:grid-cols-2 lg:grid-cols-4 lg:border-l">
            {[
              [num(totals.exhumationsRun), "exhumations run"],
              [usd(totals.recoveredUsd), "quote asset recovered"],
              [usd(totals.paidOutUsd), "paid out to depositors"],
              ["0", "deposits refused at the cut"],
            ].map(([f, c], i) => (
              <div
                key={c}
                className={`border-b border-line py-7 lg:border-r lg:px-8 ${i > 0 ? "sm:border-l lg:border-l-0" : ""}`}
              >
                <p className="tnum text-[36px] leading-none font-medium text-ink md:text-[48px]">{f}</p>
                <p className="mt-4 max-w-[26ch] text-[14px] leading-[18px] text-ink-2">{c}</p>
              </div>
            ))}
          </div>

          <div className="mt-14 border border-line p-8 md:p-12">
            <p className="tnum text-[12px] leading-4 uppercase tracking-[0.06em] text-ink-3">
              the table
            </p>
            <p className="mt-5 max-w-[62ch] text-[18px] leading-7 text-ink md:text-[20px]">
              It is empty. Nothing is deployed, so nothing has been exhumed, so there is nothing
              here.
            </p>
            <p className="mt-5 max-w-[68ch] text-[15px] leading-6 text-ink-2">
              When there is, every round gets a row: the grave, the block it opened at, how many
              holders brought bags in, how many were refused at the cut and why, what the sale
              returned, what the protocol took, what the bounty cost, and what each depositor
              received. Including the rounds that return less than the gas they cost. Especially
              those.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button href="/#waitlist" variant="primary" size="md">
                Get told when the first one runs
              </Button>
              <Button href="/scan" variant="secondary" size="md">
                Until then, the scan
              </Button>
            </div>
          </div>
        </Section>
      </main>
      <Footer headBlock={meta.headBlock} />
    </>
  );
}
