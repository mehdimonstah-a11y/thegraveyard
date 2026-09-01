import { WaitlistForm } from "@/components/Bits";
import { Mark, MARK_GEOMETRY } from "@/components/Mark";
import { NOT_LOSSES_SENTENCE, PHASE_0_SENTENCE, HANDLE } from "@/lib/chain";
import { scan, num, usd } from "@/lib/data";

/**
 * The front door, and pre-launch the only public surface.
 *
 * One screen, no scroll, no nav. Every link would be a door and there are
 * supposed to be none — `src/middleware.ts` bounces the rest of the site here,
 * because removing the links alone would not have done it: a route with no
 * link is still a route anyone can type.
 *
 * The three figures below are the only ones on it, and they are the three that
 * are true rather than the three that flatter: how many pools were read, what
 * the dead ones hold, and how much has been recovered so far. The last one is
 * zero. Leading a closed door with a zero is the whole posture.
 */
export default function WaitlistPage() {
  const { meta, totals } = scan;

  return (
    <main className="flex min-h-[100svh] flex-col justify-between">
      <div className="mx-auto flex w-full max-w-[1120px] flex-1 flex-col justify-center px-6 py-14 md:px-16 md:py-20">
        <div className="grid items-center gap-14 lg:grid-cols-[1fr_auto] lg:gap-20">
          <div>
            <span className="inline-flex items-center gap-2.5 text-ink">
              <Mark size={26} />
              <span className="text-[17px] font-semibold tracking-[-0.02em]">The Graveyard</span>
            </span>

            <p className="tnum mt-11 text-[12px] leading-4 font-medium uppercase tracking-[0.06em] text-accent">
              The waitlist is open
            </p>

            <h1 className="mt-5 max-w-[15ch] text-[38px] font-medium leading-[1.03] tracking-[-0.025em] md:text-[60px]">
              Dead pools still hold&nbsp;money.
            </h1>

            <p className="mt-7 max-w-[52ch] text-[16px] leading-6 text-ink-2 md:text-[18px]">
              Launch liquidity is locked forever, so when a token dies the ETH and USDG in its
              pool stay there. We read every pool ever made and measured what is actually left.
              The honest answer is <span className="text-ink">not much</span>, and we would
              rather lead with that than sell you a recovery.
            </p>

            <div className="mt-9">
              <WaitlistForm />
            </div>

            <p className="mt-8 max-w-[52ch] text-[13px] leading-5 text-ink-2">
              {PHASE_0_SENTENCE} The rest of the site is closed until there is something in it
              worth opening.
            </p>
          </div>

          {/* The three numbers, and nothing else. The wall runs down the side of
              them because it is the same wall as in the mark: the part of every
              reserve that never comes out. */}
          <dl className="relative grid w-full gap-px border-l-2 border-ink pl-6 lg:w-[300px]">
            {[
              [num(meta.poolsInitialised), "pools read on this chain"],
              [usd(totals.measuredCeilingUsd), "recoverable from the dead ones"],
              [usd(totals.recoveredUsd), "recovered so far"],
            ].map(([figure, caption], i) => (
              <div key={caption} className={i > 0 ? "border-t border-line pt-7 mt-7" : ""}>
                <dd className="tnum text-[34px] leading-none font-medium text-ink md:text-[40px]">
                  {figure}
                </dd>
                <dt className="mt-3 max-w-[24ch] text-[14px] leading-[18px] text-ink-2">
                  {caption}
                </dt>
              </div>
            ))}
            <p className="tnum mt-8 text-[12px] leading-4 uppercase tracking-[0.06em] text-ink-3">
              measured at block {num(meta.headBlock)}
            </p>
          </dl>
        </div>
      </div>

      <footer className="border-t border-line">
        <div className="mx-auto flex w-full max-w-[1120px] flex-col gap-4 px-6 py-7 md:flex-row md:items-center md:justify-between md:px-16">
          <p className="max-w-[76ch] text-[13px] leading-5 text-ink-2">{NOT_LOSSES_SENTENCE}</p>
          <a
            href="https://x.com/thegraveyardxyz"
            target="_blank"
            rel="noreferrer noopener"
            className="t150 tnum shrink-0 text-[13px] text-ink-2 hover:text-ink"
          >
            {HANDLE}
          </a>
        </div>
      </footer>

      {/* Referenced so the geometry constant cannot drift out of use unnoticed. */}
      <span hidden data-mark-viewbox={MARK_GEOMETRY.viewBox} />
    </main>
  );
}
