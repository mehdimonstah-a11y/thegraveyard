"use client";

import { useEffect, useState } from "react";
import { Button, Container, GraveMark } from "./Chrome";
import { CHAIN_ID, CHAIN_NAME } from "@/lib/chain";

/**
 * The hero, replicating SPEC.md §2 (720px, zero section padding) and §7's one
 * authored animation: a fixed lead-in phrase followed by a phrase that types
 * itself in behind a blinking block caret.
 *
 * The mechanic is the reference's. The words are ours, and the typed phrase is
 * the one sentence this entire product exists to make true.
 *
 * Reduced motion is honoured by completing the sentence immediately rather
 * than by removing it — a half-typed headline is not an accessible headline.
 */

const LEAD = "Every dead pool on this chain";
const TAIL = "still has something in it.";

export function Hero({
  headBlock,
  poolsInitialised,
}: {
  headBlock: number;
  poolsInitialised: number;
}) {
  const [typed, setTyped] = useState("");

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setTyped(TAIL);
      return;
    }
    let i = 0;
    const id = window.setInterval(() => {
      i += 1;
      setTyped(TAIL.slice(0, i));
      if (i >= TAIL.length) window.clearInterval(id);
    }, 45);
    return () => window.clearInterval(id);
  }, []);

  return (
    // SPEC.md section 0: 720px tall at every desktop breakpoint, zero section
    // padding, content vertically centred inside it.
    <section className="flex items-center bg-bg py-12 md:h-[720px] md:py-0">
      <Container>
        {/* Badge block: same anatomy as the reference's partner badge — a
            bordered strip at the top of the hero — carrying measured chain
            facts instead of a partnership, because we have none. */}
        <div className="inline-flex flex-wrap items-stretch border border-line">
          <span className="tnum flex items-center gap-2 px-4 py-2.5 text-[12px] leading-4 uppercase tracking-[0.06em] text-ink-2">
            <GraveMark size={14} />
            {CHAIN_NAME} · {CHAIN_ID}
          </span>
          <span className="tnum flex items-center border-l border-line px-4 py-2.5 text-[12px] leading-4 uppercase tracking-[0.06em] text-ink-3">
            block {headBlock.toLocaleString("en-US")}
          </span>
          <span className="tnum hidden items-center border-l border-line px-4 py-2.5 text-[12px] leading-4 uppercase tracking-[0.06em] text-ink-3 sm:flex">
            {poolsInitialised.toLocaleString("en-US")} pools scanned
          </span>
        </div>

        <h1 className="mt-8 max-w-[16ch] text-[40px] font-medium leading-[1.02] tracking-[-0.02em] md:mt-10 md:max-w-[22ch] md:text-[66px]">
          {LEAD}{" "}
          <span className="text-accent">
            {typed}
            <span className="caret" aria-hidden="true">
              ▌
            </span>
          </span>
          <span className="sr-only">{TAIL}</span>
        </h1>

        <p className="mt-7 max-w-[62ch] text-[16px] leading-6 text-ink-2 md:mt-9 md:text-[18px]">
          Launch liquidity here is locked forever, so when a token dies the ETH and USDG in its
          pool are stranded. We measured how much is actually there, and the honest answer is
          that it is small — a few dollars a grave, and the largest one we found holds $242.
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <Button href="#waitlist" variant="primary">
            Join the waitlist
          </Button>
          <Button href="#the-scan" variant="secondary">
            See the scan
          </Button>
        </div>
      </Container>
    </section>
  );
}
