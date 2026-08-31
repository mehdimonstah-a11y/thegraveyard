import { short, tokenUrl } from "@/lib/chain";
import type { Grave } from "@/lib/data";

/**
 * SPEC.md §6.7: a full-bleed 80px strip, no padding, one infinite CSS
 * translation of a duplicated track.
 *
 * The reference runs a wall of customer logos through it. We have no customers
 * and will not imply any, so the same component carries the thing we do have:
 * the largest graves the scan found, with the address, what is left in the
 * pool and how long since anyone traded it. Logged as a substitution of kind
 * in DEVIATIONS.md.
 */
export function Marquee({ graves }: { graves: Grave[] }) {
  const strip = graves.slice(0, 14);
  if (!strip.length) {
    return (
      <div className="flex h-20 items-center justify-center border-y border-line bg-bg">
        <p className="tnum text-[12px] uppercase tracking-[0.06em] text-ink-3">
          no graves measured yet
        </p>
      </div>
    );
  }
  const track = [...strip, ...strip];
  return (
    <div className="relative h-20 overflow-hidden border-y border-line bg-bg">
      <div className="marquee-track absolute top-0 left-0 flex h-20 w-max items-center">
        {track.map((g, i) => (
          <a
            key={`${g.id}-${i}`}
            href={tokenUrl(g.token)}
            target="_blank"
            rel="noreferrer noopener"
            aria-hidden={i >= strip.length}
            tabIndex={i >= strip.length ? -1 : 0}
            className="t150 flex h-20 shrink-0 items-center gap-4 border-r border-line px-7 hover:bg-surface-1"
          >
            <span className="tnum text-[13px] leading-4 text-ink-3">{short(g.token, 8, 6)}</span>
            <span className="tnum text-[15px] leading-5 font-medium text-ink">
              ${g.whatsLeftUsd < 1 ? g.whatsLeftUsd.toFixed(4) : g.whatsLeftUsd.toFixed(2)}
            </span>
            <span className="tnum text-[12px] leading-4 uppercase tracking-[0.06em] text-ink-3">
              {g.quote} · idle {Math.round(g.daysIdle)}d
            </span>
          </a>
        ))}
      </div>
    </div>
  );
}
