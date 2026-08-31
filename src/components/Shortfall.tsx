"use client";

import { useMemo, useState } from "react";
import { usd } from "@/lib/data";

/**
 * The recovery curve, drawn on one real grave.
 *
 * For a pool whose liquidity is a single full-range position — which is what a
 * locked-LP launchpad deploys, and the only kind of grave this control is ever
 * shown for — selling Δ tokens into reserves (R_t, R_q) at fee f returns
 *
 *     out(Δ) = R_q · Δ(1−f) / (R_t + Δ(1−f))
 *
 * Substituting u = Δ(1−f)/R_t, that is exactly
 *
 *     out(u) = R_q · u / (1 + u)
 *
 * so the whole curve is determined by the quote reserve and one dimensionless
 * quantity: how much supply is brought in, as a multiple of the pool's own
 * token inventory. No other input is needed and none is invented.
 *
 * Three things the drawing has to say, and does:
 *   out(u) → R_q but never reaches it. The bare strip on the right never closes.
 *   Marginal recovery falls. The fill slows visibly as the handle moves right.
 *   Every extra depositor lowers everyone's split. The per-unit figure falls.
 */

const MIN_U = 0.02;
const MAX_U = 200;

export function Shortfall({
  whatsLeftUsd,
  label,
  /** Where marginal recovery per unit of supply drops below the dust line. */
  cutAtU = 60,
}: {
  whatsLeftUsd: number;
  label: string;
  cutAtU?: number;
}) {
  const [t, setT] = useState(0.42);

  const { u, recovered, shortfall, filled, perUnit, refused } = useMemo(() => {
    // Log scale: the interesting behaviour is all in the first few multiples.
    const uu = MIN_U * Math.pow(MAX_U / MIN_U, t);
    const capped = Math.min(uu, cutAtU);
    const out = whatsLeftUsd * (capped / (1 + capped));
    return {
      u: uu,
      recovered: out,
      shortfall: whatsLeftUsd - out,
      filled: whatsLeftUsd > 0 ? out / whatsLeftUsd : 0,
      // What one unit of supply — 1% of the pool's token inventory — collects.
      perUnit: capped > 0 ? out / (capped * 100) : 0,
      refused: uu > cutAtU,
    };
  }, [t, whatsLeftUsd, cutAtU]);

  return (
    <div className="border border-line bg-surface-1 p-6 md:p-8">
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
        <p className="tnum text-[12px] leading-4 uppercase tracking-[0.06em] text-ink-3">
          what&rsquo;s left in {label}
        </p>
        <p className="tnum text-[15px] leading-5 text-ink">{usd(whatsLeftUsd)}</p>
      </div>

      {/* The bar. Filled = recoverable at this level. Bare = the shortfall.
          The stop at the right edge is 2px and never moves. */}
      <div className="mt-5 flex h-14 w-full border border-line-strong" aria-hidden="true">
        <div
          className="h-full bg-accent"
          style={{ width: `${Math.max(0, Math.min(100, filled * 100))}%` }}
        />
        <div
          className="h-full flex-1"
          style={{
            backgroundImage:
              "repeating-linear-gradient(135deg, rgba(255,255,255,0.10) 0 1px, transparent 1px 7px)",
          }}
        />
        <div className="h-full w-0.5 bg-ink" />
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <Figure label="recovered at this level" value={usd(recovered)} tone="accent" />
        <Figure label="the shortfall" value={usd(shortfall)} tone="ink" note="never, at any size" />
        <Figure
          label="split, per 1% of supply"
          value={usd(perUnit)}
          tone="ink"
          note="falls as others join"
        />
      </div>

      <label className="mt-7 block">
        <span className="tnum text-[12px] leading-4 uppercase tracking-[0.06em] text-ink-3">
          supply brought in · {u < 1 ? `${(u * 100).toFixed(0)}%` : `${u.toFixed(1)}×`} of the
          pool&rsquo;s token inventory
        </span>
        <input
          type="range"
          min={0}
          max={1}
          step={0.001}
          value={t}
          onChange={(e) => setT(Number(e.target.value))}
          aria-label="Supply brought in"
          aria-valuetext={`${u < 1 ? `${(u * 100).toFixed(0)} percent` : `${u.toFixed(1)} times`} of the pool's token inventory. ${usd(recovered)} recovered, ${usd(shortfall)} left in the pool.`}
          className="mt-3 h-2 w-full cursor-ew-resize appearance-none bg-surface-3 accent-[var(--color-accent)]"
        />
      </label>

      {refused ? (
        <p className="tnum mt-4 border border-accent px-3 py-2 text-[12px] leading-4 uppercase tracking-[0.06em] text-accent">
          refused at the cut · marginal recovery below the dust threshold
        </p>
      ) : (
        <p className="mt-4 text-[13px] leading-5 text-ink-2">
          The hatched strip is the part constant-product maths will never surrender. It narrows
          as more supply comes in. It does not close.
        </p>
      )}
    </div>
  );
}

function Figure({
  label,
  value,
  tone,
  note,
}: {
  label: string;
  value: string;
  tone: "accent" | "ink";
  note?: string;
}) {
  return (
    <div>
      <p className="tnum text-[12px] leading-4 uppercase tracking-[0.06em] text-ink-3">{label}</p>
      <p
        className={`tnum mt-1.5 text-[22px] leading-7 font-medium ${tone === "accent" ? "text-accent" : "text-ink"}`}
      >
        {value}
      </p>
      {note ? <p className="mt-0.5 text-[13px] leading-5 text-ink-2">{note}</p> : null}
    </div>
  );
}
