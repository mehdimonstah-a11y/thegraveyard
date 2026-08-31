import Link from "next/link";
import { HANDLE, JURISDICTION_SENTENCE, NOT_LOSSES_SENTENCE, PHASE_0_SENTENCE, POOL_MANAGER, addressUrl, blockUrl, CHAIN_ID } from "@/lib/chain";

/**
 * The page frame: container, header, footer, and the two primitives every
 * section is built from.
 *
 * Measurements replicated from SPEC.md §1, §6.1 and §6.8:
 *   container   1312 @1440, 896 @1024, 640 @768, 327 @375 — page padding
 *               64px down to 24px below the md breakpoint
 *   header      68px, sticky, no border
 *   footer      88px top and bottom, four link columns
 *   section     104px top and bottom, 48px below md
 *   radius      0 everywhere, no exceptions
 *   shadow      none anywhere; depth is ground changes and 1px lines
 */

export function Container({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`mx-auto w-full max-w-[1312px] px-6 md:px-16 ${className}`}>{children}</div>
  );
}

export function Section({
  children,
  ground = "bg",
  tight = false,
  id,
}: {
  children: React.ReactNode;
  ground?: "bg" | "s1" | "s2" | "accent";
  tight?: boolean;
  id?: string;
}) {
  const grounds = {
    bg: "bg-bg",
    s1: "bg-surface-1",
    s2: "bg-surface-2",
    accent: "bg-accent text-on-accent",
  } as const;
  return (
    <section id={id} className={`scroll-mt-[68px] ${grounds[ground]} ${tight ? "pt-6 pb-12 md:pt-13 md:pb-26" : "py-12 md:py-26"}`}>
      <Container>{children}</Container>
    </section>
  );
}

/** Uppercase mono label. The reference's second register, and ours. */
export function Eyebrow({ children, tone = "muted" }: { children: React.ReactNode; tone?: "muted" | "accent" | "on-accent" }) {
  const tones = { muted: "text-ink-3", accent: "text-accent", "on-accent": "text-on-accent/80" } as const;
  return (
    <p className={`tnum text-[12px] leading-4 font-medium uppercase tracking-[0.06em] ${tones[tone]}`}>{children}</p>
  );
}

type ButtonProps = {
  children: React.ReactNode;
  href: string;
  variant?: "primary" | "secondary" | "tertiary" | "on-accent";
  size?: "sm" | "md" | "lg";
  external?: boolean;
};

/**
 * Button anatomy from SPEC.md §6.2 — heights 36 / 40 / 48, horizontal padding
 * 24 / 16 / 24, radius 0, uppercase mono label, 150ms colour transition.
 *
 * Hover, active, focus-visible and disabled values are derived rather than
 * copied: the reference's stylesheet is cross-origin and its state rules could
 * not be read. Derivation and reasoning are in DEVIATIONS.md.
 */
export function Button({ children, href, variant = "primary", size = "lg", external }: ButtonProps) {
  const sizes = {
    sm: "h-8 px-3 text-[12px] leading-4",
    md: "h-10 px-4 text-[14px] leading-5",
    lg: "h-10 px-4 text-[12px] leading-6 md:h-12 md:px-6 md:text-[16px] md:leading-6",
  } as const;
  const variants = {
    primary: "bg-accent text-on-accent hover:bg-accent-hover active:bg-accent-pressed",
    secondary: "border border-line-strong text-ink hover:border-accent hover:text-accent",
    tertiary: "bg-surface-2 text-ink hover:bg-surface-3",
    "on-accent": "border border-on-accent text-on-accent hover:bg-on-accent hover:text-accent",
  } as const;
  const cls = `t150 tnum inline-flex items-center justify-center font-medium uppercase ${sizes[size]} ${variants[variant]}`;
  if (external) {
    return (
      <a className={cls} href={href} target="_blank" rel="noreferrer noopener">
        {children}
      </a>
    );
  }
  return (
    <Link className={cls} href={href}>
      {children}
    </Link>
  );
}

const NAV = [
  { href: "/#the-scan", label: "The scan" },
  { href: "/#stuck", label: "Why it's stuck" },
  { href: "/#exhumation", label: "An exhumation" },
  { href: "/exhumations", label: "The archive" },
  { href: "/scan", label: "The dataset" },
  { href: "/docs", label: "Docs" },
];

export function Header() {
  return (
    <header className="sticky top-0 z-50 h-[68px] bg-bg">
      <Container className="flex h-full items-center justify-between gap-6">
        <Link href="/" className="t150 flex items-center gap-2.5 text-ink hover:text-accent">
          <GraveMark />
          <span className="text-[15px] font-semibold tracking-tight">The Graveyard</span>
        </Link>

        <nav className="hidden items-center gap-7 lg:flex" aria-label="Primary">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className="t150 text-[14px] leading-5 text-ink-2 hover:text-ink">
              {n.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <span className="tnum hidden text-[12px] leading-4 uppercase tracking-[0.06em] text-ink-3 xl:inline">
            chain {CHAIN_ID}
          </span>
          <Button href="/#waitlist" size="sm" variant="primary">
            Join the waitlist
          </Button>
        </div>
      </Container>
    </header>
  );
}

/**
 * The mark: a plot outline with a filled portion and a gap that never closes.
 * It is the shortfall, at 20px. Drawn here, not imported — there is no image
 * file anywhere in this project.
 */
export function GraveMark({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" aria-hidden="true" focusable="false">
      <rect x="0.5" y="4.5" width="19" height="11" fill="none" stroke="currentColor" strokeWidth="1" />
      <rect x="0.5" y="4.5" width="12" height="11" fill="var(--color-accent)" />
      <line x1="16.5" y1="2" x2="16.5" y2="18" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

const FOOTER_COLUMNS = [
  {
    head: "The scan",
    links: [
      { href: "/#the-scan", label: "Live graves" },
      { href: "/scan", label: "The full dataset" },
      { href: "/#numbers", label: "What was measured" },
      { href: "/exhumations", label: "The archive" },
    ],
  },
  {
    head: "The mechanism",
    links: [
      { href: "/#stuck", label: "Why the money is stuck" },
      { href: "/#exhumation", label: "How an exhumation works" },
      { href: "/#refuse", label: "What we refuse" },
      { href: "/docs", label: "The maths" },
    ],
  },
  {
    head: "The method",
    links: [
      { href: "/docs#method", label: "How the scan is built" },
      { href: "/docs#limits", label: "What is not built" },
      { href: "/docs#attacks", label: "Attack surface" },
      { href: "/docs#token", label: `The ${"GRAVE"} token` },
    ],
  },
];

export function Footer({ headBlock }: { headBlock: number }) {
  return (
    <footer className="bg-bg pt-12 pb-12 md:pt-22 md:pb-22">
      <Container>
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          {FOOTER_COLUMNS.map((col) => (
            <div key={col.head}>
              <Eyebrow>{col.head}</Eyebrow>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((l) => (
                  <li key={l.href + l.label}>
                    <Link href={l.href} className="t150 tnum text-[14px] leading-5 text-ink-2 hover:text-ink">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div>
            <Eyebrow>Addresses</Eyebrow>
            <ul className="mt-4 space-y-2.5">
              <li>
                <a
                  href={addressUrl(POOL_MANAGER)}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="t150 tnum block text-[14px] leading-5 text-ink-2 hover:text-ink"
                >
                  PoolManager <span className="text-ink-3">{POOL_MANAGER.slice(0, 10)}…</span>
                </a>
              </li>
              <li>
                <a
                  href={blockUrl(headBlock)}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="t150 tnum block text-[14px] leading-5 text-ink-2 hover:text-ink"
                >
                  Scanned at block {headBlock.toLocaleString("en-US")}
                </a>
              </li>
              <li className="tnum text-[14px] leading-5 text-ink-3">
                No contract deployed. No {"GRAVE"} token exists.
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-14 border-t border-line pt-8">
          <div className="grid gap-6 lg:grid-cols-[1fr_auto]">
            <div className="max-w-[68ch] space-y-3">
              <p className="text-[13px] leading-5 text-ink-2">{PHASE_0_SENTENCE}</p>
              <p className="text-[13px] leading-5 text-ink-2">{NOT_LOSSES_SENTENCE}</p>
              <p className="text-[13px] leading-5 text-ink-2">{JURISDICTION_SENTENCE}</p>
            </div>
            <div className="flex flex-col items-start gap-3 lg:items-end">
              <a
                href="https://x.com/thegraveyardxyz"
                target="_blank"
                rel="noreferrer noopener"
                className="t150 tnum text-[13px] text-ink-2 hover:text-ink"
              >
                {HANDLE}
              </a>
              <p className="tnum text-[13px] text-ink-2">thegraveyard.xyz</p>
            </div>
          </div>
        </div>
      </Container>
    </footer>
  );
}
