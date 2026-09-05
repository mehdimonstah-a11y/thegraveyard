"use client";

import { useMemo, useState } from "react";
import { feeLabel, num, usd, type Grave } from "@/lib/data";
import { short, tokenUrl } from "@/lib/chain";

/**
 * The scan.
 *
 * Structurally this is the reference's catalogue grid: a heading, a sub-line, a
 * CTA, and a long list of rows on an alternate ground. Ours carries measured
 * chain data instead of a product menu.
 *
 * Two rules the table exists to hold:
 *   Every grave is keyed by CONTRACT ADDRESS, never by symbol. This chain
 *   carries counterfeit stock tokens, and two graves may legitimately share a
 *   ticker; the address is the identity and it is always on screen.
 *   Nothing is interpolated. A field the scan could not establish renders as an
 *   em dash, not a plausible default.
 */

type SortKey = "ceilingUsd" | "whatsLeftUsd" | "daysIdle" | "swaps";

const COLUMNS: { key: SortKey | null; label: string; align?: "right" }[] = [
  { key: null, label: "Grave" },
  { key: "whatsLeftUsd", label: "What's left", align: "right" },
  { key: "ceilingUsd", label: "Recoverable", align: "right" },
  { key: null, label: "" },
  { key: "daysIdle", label: "Idle", align: "right" },
  { key: "swaps", label: "Sells", align: "right" },
];

export function ScanTable({ graves, pageSize = 24 }: { graves: Grave[]; pageSize?: number }) {
  const [sort, setSort] = useState<SortKey>("ceilingUsd");
  const [limit, setLimit] = useState(pageSize);
  const [onlyTradeable, setOnlyTradeable] = useState(false);

  const rows = useMemo(() => {
    const filtered = onlyTradeable ? graves.filter((g) => g.sells > 0) : graves;
    return [...filtered].sort((a, b) => b[sort] - a[sort]);
  }, [graves, sort, onlyTradeable]);

  const max = rows.length ? Math.max(...rows.map((g) => g.whatsLeftUsd)) : 1;

  if (!graves.length) {
    return (
      <div className="border border-line bg-surface-1 p-8">
        <p className="tnum text-[14px] leading-5 text-ink-2">
          The scan has not produced a grave that clears the floor yet. This table is empty and
          says so rather than showing something else.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <span className="tnum mr-1 text-[12px] leading-4 uppercase tracking-[0.06em] text-ink-3">
          sort
        </span>
        {(
          [
            ["ceilingUsd", "Recoverable"],
            ["whatsLeftUsd", "What's left"],
            ["daysIdle", "Idle"],
            ["swaps", "Sells"],
          ] as [SortKey, string][]
        ).map(([k, l]) => (
          <button
            key={k}
            type="button"
            onClick={() => setSort(k)}
            aria-pressed={sort === k}
            className={`t150 tnum h-8 border px-3 text-[12px] uppercase tracking-[0.06em] ${
              sort === k
                ? "border-accent text-accent"
                : "border-line text-ink-2 hover:border-line-strong hover:text-ink"
            }`}
          >
            {l}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setOnlyTradeable((v) => !v)}
          aria-pressed={onlyTradeable}
          className={`t150 tnum ml-auto h-8 border px-3 text-[12px] uppercase tracking-[0.06em] ${
            onlyTradeable
              ? "border-accent text-accent"
              : "border-line text-ink-2 hover:border-line-strong hover:text-ink"
          }`}
        >
          Only pools where a sell has completed
        </button>
      </div>

      <div className="scroll-x mt-4 border border-line bg-surface-1">
        <table className="w-full min-w-[720px] border-collapse text-left">
          <caption className="sr-only">
            Dead pools, sorted by {sort}. Every grave is identified by contract address.
          </caption>
          <thead>
            <tr className="border-b border-line">
              {COLUMNS.map((c, i) => (
                <th
                  key={c.label + i}
                  scope="col"
                  className={`tnum px-4 py-3 text-[12px] leading-4 font-medium uppercase tracking-[0.06em] text-ink-3 ${
                    c.align === "right" ? "text-right" : ""
                  }`}
                >
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.slice(0, limit).map((g, i) => (
              <tr key={g.id} className="t150 border-b border-line last:border-0 hover:bg-surface-2">
                <td className="px-4 py-3.5">
                  <div className="flex items-baseline gap-3">
                    <span className="tnum text-[12px] leading-4 text-ink-3">
                      {String(i + 1).padStart(4, "0")}
                    </span>
                    <a
                      href={tokenUrl(g.token)}
                      target="_blank"
                      rel="noreferrer noopener"
                      title={g.token}
                      className="t150 tnum text-[14px] leading-5 text-ink hover:text-accent"
                    >
                      {short(g.token, 10, 8)}
                    </a>
                    <span className="tnum text-[12px] leading-4 uppercase tracking-[0.06em] text-ink-3">
                      {g.quote} · {feeLabel(g.fee)}
                      {g.fullRange ? " · full-range" : ""}
                    </span>
                  </div>
                </td>
                <td className="tnum px-4 py-3.5 text-right text-[14px] leading-5 text-ink-2">
                  {usd(g.whatsLeftUsd)}
                </td>
                <td className="tnum px-4 py-3.5 text-right text-[14px] leading-5 font-medium text-ink">
                  {usd(g.ceilingUsd)}
                </td>
                <td className="w-[180px] px-4 py-3.5">
                  {/* The shortfall, at row scale: fill is what comes out, the
                      hatched remainder is what the maths keeps. */}
                  <div className="flex h-3 w-full border border-line-strong" aria-hidden="true">
                    <div
                      className="h-full bg-accent"
                      style={{
                        width: `${Math.max(1.5, Math.min(100, (g.ceilingUsd / max) * 100))}%`,
                      }}
                    />
                    <div
                      className="h-full flex-1"
                      style={{
                        backgroundImage:
                          "repeating-linear-gradient(135deg, rgba(255,255,255,0.10) 0 1px, transparent 1px 6px)",
                      }}
                    />
                  </div>
                </td>
                <td className="tnum px-4 py-3.5 text-right text-[14px] leading-5 text-ink-2">
                  {Math.round(g.daysIdle)}d
                </td>
                <td className="tnum px-4 py-3.5 text-right text-[14px] leading-5 text-ink-2">
                  {g.historyPartial ? (
                    // Its full history overflows the node's log cap, so the count
                    // would be a window's count wearing a lifetime's label.
                    <span className="text-ink-3" title="Full history exceeds the node's log cap; not counted">
                      —
                    </span>
                  ) : g.sells > 0 ? (
                    num(g.sells)
                  ) : (
                    <span className="text-ink-3">none</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <p className="tnum text-[13px] leading-5 text-ink-2">
          {num(Math.min(limit, rows.length))} of {num(rows.length)} measured graves
        </p>
        {limit < rows.length ? (
          <button
            type="button"
            onClick={() => setLimit((l) => l + pageSize * 2)}
            className="t150 tnum h-10 border border-line-strong px-4 text-[12px] uppercase tracking-[0.06em] text-ink hover:border-accent hover:text-accent"
          >
            Show more
          </button>
        ) : null}
      </div>
    </div>
  );
}
