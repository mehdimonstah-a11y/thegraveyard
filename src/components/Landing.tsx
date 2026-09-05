import Link from "next/link";
import { Mark } from "@/components/Mark";
import { HANDLE, PHASE_0_SENTENCE } from "@/lib/chain";
import { num, scan, usd } from "@/lib/data";

/**
 * The front door: one viewport, one action.
 *
 * A mark, a claim, a sub-line, one button into the product, and a footer that
 * is the whole nav. Everything that used to be argued at length on this page
 * now lives where someone can act on it — the table on /scan, the mechanism in
 * /docs, the results in /exhumations.
 *
 * What is not here, deliberately: the chain's name, its id, an explorer's
 * brand, and an affiliation disclaimer. None of it is something a reader can
 * act on, and a front door made of boilerplate is the fastest way to look like
 * every other site in this category.
 *
 * The field behind the claim is the mark at page scale — every grave stopping
 * short of the same wall. It is drawn, not an image, and it does not move.
 */
export default function Landing() {
  const { meta, totals } = scan;

  return (
    <div className="relative flex min-h-[100svh] flex-col overflow-hidden">
      <GraveField />

      <main className="relative mx-auto flex w-full max-w-[1120px] flex-1 flex-col justify-center px-6 py-16 md:px-16">
        <Mark size={44} />

        <h1 className="mt-10 max-w-[13ch] text-[42px] font-medium leading-[1.02] tracking-[-0.03em] md:mt-12 md:text-[76px]">
          Dead pools still hold <span className="text-accent">money.</span>
        </h1>

        <p className="mt-7 max-w-[54ch] text-[17px] leading-[1.55] text-ink-2 md:mt-9 md:text-[20px]">
          Launch liquidity is locked forever, so when a token dies the ETH and USDG in its pool
          stay there. We read every pool ever made and measured exactly what is left in the dead
          ones.
        </p>

        <div className="mt-10 flex flex-wrap items-center gap-4 md:mt-12">
          <Link
            href="/scan"
            className="t150 tnum inline-flex h-13 items-center justify-center bg-accent px-8 text-[15px] font-medium uppercase tracking-[0.06em] text-on-accent hover:bg-accent-hover active:bg-accent-pressed"
          >
            Open the scan
          </Link>
          <Link
            href="/docs"
            className="t150 tnum inline-flex h-13 items-center justify-center border border-line-strong px-8 text-[15px] font-medium uppercase tracking-[0.06em] text-ink hover:border-accent hover:text-accent"
          >
            How it works
          </Link>
        </div>

        {/* Three figures, and the smallest one is the point. */}
        <dl className="mt-14 flex flex-wrap gap-x-12 gap-y-6 border-t border-line pt-8 md:mt-20">
          {[
            [num(meta.poolsInitialised), "pools read"],
            [num(totals.measuredGraves), "graves measured"],
            [usd(totals.measuredCeilingUsd), "recoverable from them"],
          ].map(([figure, caption]) => (
            <div key={caption}>
              <dd className="tnum text-[26px] leading-none font-medium text-ink md:text-[32px]">
                {figure}
              </dd>
              <dt className="mt-2.5 text-[13px] leading-4 text-ink-2">{caption}</dt>
            </div>
          ))}
        </dl>
      </main>

      <footer className="relative border-t border-line">
        <div className="mx-auto flex w-full max-w-[1120px] flex-col gap-5 px-6 py-7 md:flex-row md:items-center md:justify-between md:px-16">
          <p className="max-w-[68ch] text-[13px] leading-5 text-ink-2">{PHASE_0_SENTENCE}</p>
          <nav aria-label="Elsewhere" className="flex shrink-0 items-center gap-6">
            {[
              ["/scan", "The scan"],
              ["/docs", "Docs"],
              ["/exhumations", "The archive"],
            ].map(([href, label]) => (
              <Link key={href} href={href} className="t150 text-[13px] text-ink-2 hover:text-ink">
                {label}
              </Link>
            ))}
            <a
              href="https://x.com/thegraveyardxyz"
              target="_blank"
              rel="noreferrer noopener"
              className="t150 tnum text-[13px] text-ink-2 hover:text-ink"
            >
              {HANDLE}
            </a>
          </nav>
        </div>
      </footer>
    </div>
  );
}

/**
 * The field: the mark at page scale. Twenty-eight graves at fixed depths, every
 * one stopping short of the same wall, sitting behind the type on the right.
 *
 * Depths are a hand-picked sequence rather than random so the page renders
 * identically on every request and nothing shifts between server and client.
 * It sits at low opacity and is hidden below `lg`, where the claim needs the
 * width more than the page needs the texture.
 */
function GraveField() {
  const DEPTHS = [
    0.94, 0.31, 0.68, 0.15, 0.82, 0.24, 0.57, 0.12, 0.75, 0.4, 0.51, 0.19,
    0.87, 0.28, 0.63, 0.14, 0.46, 0.22, 0.71, 0.35, 0.6, 0.17, 0.79, 0.26,
    0.54, 0.2, 0.66, 0.13,
  ];
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute top-0 right-0 hidden h-full w-[38%] flex-col justify-center gap-[10px] pr-16 lg:flex"
    >
      {DEPTHS.map((d, i) => (
        <div key={i} className="flex h-[7px] w-full items-stretch">
          <div className="bg-accent/25" style={{ width: `${d * 100}%` }} />
          <div className="flex-1" />
          <div className="w-[3px] bg-ink/25" />
        </div>
      ))}
    </div>
  );
}
