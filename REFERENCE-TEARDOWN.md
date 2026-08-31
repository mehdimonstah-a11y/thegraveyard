# REFERENCE TEARDOWN

**Reference:** `https://www.gmicloud.ai/en` (serves `https://gmicloud.ai`)
**Observed:** 2026-08-31, rendered page + DOM + computed styles, at 1440 / 768 / 375.
**Reference's category:** GPU cloud — serverless inference, dedicated clusters, bare metal.
**Our category:** an on-chain salvage protocol on Robinhood Chain.

**Not a competitor.** Different market, different buyer, no overlap in what is sold. The §5
divergence minimums therefore apply as written rather than raised by one — but the palette is
being fully re-derived anyway, because the reference's black + acid lime is exactly the
combination our own build brief bans in §5.3.

Everything below is an observation of a page in a browser. No code, asset, font file, or
sentence from the reference has been copied into this repository, and none will be.

---

## 1. STRUCTURE

Ten sections in `<main>`, measured heights at 1280px content width, total document 9,477px.

| # | Height | Ground | Purpose |
|---|---|---|---|
| 1 | 540 | transparent to black | Hero. Partner badge, one animating headline, sub-line, two CTAs |
| 2 | 80 | black | Customer logo marquee |
| 3 | 906 | black | Entry product (serverless), four bullet claims, CTA |
| 4 | 1,483 | **white** | Second product (dedicated GPU), then a three-card price table |
| 5 | 836 | black | Four performance multiples — the proof block |
| 6 | 962 | black | Three-card "how it is designed" restatement |
| 7 | 1,303 | **white** | Model catalogue |
| 8 | 710 | black | Three named customers, four bullet outcomes each |
| 9 | 789 | #262626 | FAQ accordion |
| 10 | 676 | **#DDEA4D** | Closing CTA, full-bleed accent |

**Primary CTA:** the console link appears three times in the body plus a persistent header pair
(one solid accent, one outlined). Every section that sells something ends in a button; the
sections that only explain do not.

**IA:** the homepage carries the entire pitch. Nav has 6 items, two of them dropdowns, plus a
language switcher. Depth lives in subpages; the homepage never links sideways mid-argument.

**Silhouette:** with type replaced by grey, the page is a stack of full-bleed horizontal bands
alternating black / white / black / white, ending in one loud accent band. At thumbnail it
reads as a barcode of alternating dark and light stripes. That stripe pattern is the single
most recognisable thing about the page.

## 2. COMPOSITION

- **Max content width** 1280px, used by 9 containers. Nothing else is constrained above it.
- **Horizontal padding** 64px desktop, 24px at 375px.
- **Vertical section padding** 104px top and bottom, desktop. 48px bottom at 375px. The hero
  is the exception at 52/104.
- **Grid** is per-section, not global: 2-up at 296px and 320px, 3-up at 213px on tablet;
  2-up at 151.5px on mobile. Gutters 24–32px.
- **Corner radius: 0px on every element on the page.** Every button, card, badge and input is
  a hard rectangle. This is a deliberate, consistently held decision.
- **Density: 4/10.** Generous. A section is typically one heading, one 15–20 word sub-line,
  and 3–4 cards. Roughly 55–60% of any screenful is empty ground.
- Document height grows 9,477 to 11,447px from 1280 to 375, i.e. the mobile page is only 21%
  taller. The layout is engineered not to stack into a long ribbon.

## 3. TYPE

Two faces, both self-hosted `.woff2`, plus a third loaded for the wordmark only.

| Face | Role | Licence status for us |
|---|---|---|
| **Alpha Lyrae** (400, 500) | headings, sub-lines, body sentences | Proprietary. Unavailable. |
| **Geist Mono** (400, 500) | eyebrows, labels, buttons, numerals, small print | Open, but reference-identifying |
| A third display face | wordmark only | Identity — never touched |

Measured scale, desktop: 66.56 / 48 / 36 / 24 / 20 / 18 / 16 / 14 / 12. The ratio between
adjacent steps hovers around **1.2–1.35**, tightening at the small end. Leading is set to 1.0
at display sizes (66.56/66.56, 48/48) and 1.4–1.45 at body sizes (14/20, 16/24).

Body copy runs ~62–72 characters at 1280. Tracking is default everywhere except one case:
12px/16px mono at +0.6px, uppercase — the eyebrow and button label style.

**Case conventions, and this is the load-bearing one:** headings are sentence case; every
interactive label and every eyebrow is UPPERCASE MONO. The result is that the page has exactly
two registers — prose and machine — and the reader learns in one screenful that uppercase mono
means "you can click this, or this is a category."

## 4. COLOUR

| Hex | Role | Share of viewport at rest |
|---|---|---|
| `#000000` | primary ground | ~45% |
| `#FFFFFF` | alternate ground, and body text on black | ~40% |
| `#262626` | FAQ band, card fills on black | ~7% |
| `#DDEA4D` | **accent** | ~6.6%, almost all of it the single closing band |
| `#A3A3A3` | secondary text on black | ~0.6% |
| `#171717` / `#0A0A0A` | near-black card fills, text on accent | <1% |

The accent is a yellow-green at roughly 82% lightness, high chroma. Counted occurrences at
rest: one header button fill, the hero CTA fill, a handful of inline emphasis words, and the
full-bleed closing band. **Under ten placements in a 9,477px page.** On the two white sections
it does not appear at all.

Contrast: white on black 21:1; `#A3A3A3` on black 9.0:1; black on accent ~15:1. Body text never
drops below AA-large anywhere measured.

## 5. MOTION

Sparse and almost entirely CSS.

| Element | Duration | Easing | Trigger |
|---|---|---|---|
| Colour/border/fill on 52 interactive elements | 150ms | `cubic-bezier(.4,0,.2,1)` | hover / focus |
| Same, 16 elements | 200ms | same | hover |
| Transform on 12 elements | 200ms | same | hover |
| Transform on 4 elements | 300ms | same | hover |
| Headline caret blink | 1000ms | `steps(2, jump-none)` | load, infinite |
| Customer logo marquee | 126,150ms | `steps(3785)` | load, infinite |

**Two things move without being touched: the caret and the logo strip.** Everything else is a
hover response. There are no scroll-triggered reveals, no parallax, no counters that count up.
On a single screenful, the count of self-animating elements is **one**.

The one authored animation is the hero: a fixed lead-in phrase followed by a phrase that types
itself in, with a blinking block caret. It is the only place on the site that performs.

## 6. VOICE

- **Headline formula:** an imperative or a state-of-being claim, split across two short
  sentences, often with the second sentence as the turn. Verbs are operational — deploy, run,
  scale, take, explore.
- **Register:** technical-corporate. Confident, benefit-led, no jokes, no hedging.
- **Numbers:** presented as multiples against an unnamed baseline (`3.7x`, `5.1x`, `30%`), with
  a single footnote sentence describing methodology in general terms. Prices are exact and
  per-unit (`$2.00 /GPU-hour`).
- **Unfinished things:** one product is labelled as not yet available, with no price and no
  invented number in the cell. That is the honest move on the page, and it is understated.
- Everything else on the page is finished, so there is nothing else to disclose. Which means
  the page never has to demonstrate what it does with a bad number.

## 7. CRAFT

**The one signature element:** the hero headline that types itself, with a hard block caret, on
a face large enough that the typing is the only motion in the viewport. It is unusual because
the restraint around it is total — nothing else on the page competes, so a 1990s effect reads
as confidence rather than kitsch.

**Three decisions that took real effort and would be easy to get wrong:**

1. **Zero border radius, held everywhere.** One rounded input would collapse the whole
   impression. It is maintained across buttons, cards, badges, price cells and the accordion.
2. **The accent is rationed to under ten placements.** It appears in the header, the hero
   button, and then not again until the final band 8,800px later. The instinct is to sprinkle
   it through every section; they didn't, which is why the closing band lands.
3. **The two-register type system.** Prose in the sans, every clickable and every category
   label in uppercase mono. It replaces iconography entirely — the site has almost no icons and
   doesn't need them, because case and face already encode function.

**What it refuses that its competitors all do:** no gradient meshes, no 3D GPU renders, no
particle fields, no glassmorphism, no dashboard mockups floating at an angle, no scroll-jacked
storytelling. For a GPU-cloud site in 2026 that is a genuinely contrarian set of refusals.

## 8. WHY IT WORKS

Because the page spends all of its ambition on one axis and none on the others. It picks two
type faces, one accent, zero corner radius and one animation, then repeats that vocabulary for
nine thousand pixels without a single exception. The effect is not that any individual decision
is remarkable — alternating bands are a convention, mono labels are a convention — it is that
the *rule set is small enough for a reader to learn in one screenful and is never broken
afterwards*. By the fourth section you are reading a system rather than a page, and a system
reads as competence. The typing headline lands for the same reason: it is the only exception in
the document, so it registers as a deliberate flourish rather than as decoration. The lesson is
not the black and the lime. It is that a small vocabulary held without exception buys more
credibility than any amount of visual invention.

---

# THE FOUR-LAYER SORT

The test applied to every row: *"if a stranger saw this in our site, having seen theirs, would
they think of theirs?"*

## Layer 1 — GENRE (free to take)

| Observation | Note |
|---|---|
| Sticky header, wordmark left, nav centre, CTA right | Every site in both categories |
| Hero: claim, sub-line, primary + secondary CTA | Convention |
| Full-bleed sections stacked vertically | Convention |
| A constrained max content width with symmetric padding | Convention |
| Card grids collapsing on mobile | Convention |
| FAQ as an accordion | Convention |
| Footer with grouped link columns | Convention |
| Uppercase labels on buttons | Widespread; not theirs |
| Tabular numerals for money | Correctness, not style |

## Layer 2 — CRAFT (take the principle, re-derive the value)

| Their execution | The principle | Ours, re-derived |
|---|---|---|
| Accent in <10 placements per 9.5k px | An accent survives by rationing | Our oxide red is reserved for exactly one meaning — a refusal — and appears only where the protocol declines something. Its frequency is set by the mechanism, not by a count we picked |
| Two registers: sans prose / uppercase mono UI | Case and face can replace iconography | Ours is prose sans / mono figures. The split is **claim vs. measurement**, not prose vs. clickable — because our page is mostly numbers and theirs is mostly claims |
| `border-radius: 0` held everywhere | One exception destroys a system | Held, for a different reason: this is a printed inventory, and forms have no round corners |
| 104px section rhythm, density 4/10 | Consistent vertical rhythm is the spine | Ours is 72px on an 8px base, density ~8/10. A ledger is dense; airiness would be a lie about how much data there is |
| Body at 62–72 characters | Measure discipline | Ours at ~66 |
| One self-animating element per screen | The motion budget is per-screen, not per-page | Ours is stricter: **zero** self-animating elements, one drag-driven recompute |
| An unavailable product's price cell left empty rather than filled with a guess | Never invent a number to fill a slot | Ours: unbuilt capabilities and the empty archive render as literal zeros with a sentence saying so |
| Homepage carries the whole pitch | Don't scatter the argument | Ours does too — but our argument is a dataset, so the homepage is mostly table |

## Layer 3 — SURFACE (replaced entirely — zero transfer)

| Theirs | Ours |
|---|---|
| `#000000` ground, `#DDEA4D` accent, `#262626`, `#A3A3A3` | A zinc-and-carbon-paper palette derived from a weighbridge ticket. No black ground, no yellow-green, no shared hex |
| Alpha Lyrae + Geist Mono | Archivo + IBM Plex Mono (both SIL OFL, both licensed for this use) |
| Alternating black/white full-bleed bands | One continuous ruled sheet with a persistent left index column |
| Corporate-technical benefit voice, `3.7x` multiples | Flat declarative, numbers first, no multiples, no superlatives |
| Two-sentence imperative headline shape | A measured statement containing a measured number |
| Section names drawn from cloud infrastructure | Section names from our own vocabulary: the scan, what's left, an exhumation, the split |
| Typing headline with block caret | No typing, no caret, anywhere |
| Logo marquee | No marquee. No third-party logos at all — we have no partners and will not imply any |
| Hover transitions 150–300ms | 90ms, and only on rows in the table |
| Photography and partner badges | No photography. Rules, hatching and figures only |

## Layer 4 — IDENTITY (never touched, at any distance)

The GMI wordmark and mark; the display face used for it; the partner badge; all customer logos
and names; the OG image; every headline, sub-line and FAQ string; the product names; the pricing
table's contents; every line of their CSS and JS. None of it appears in this repository in any
form, adapted or otherwise.

---

# THE ONE-TO-ONE MAP TEST

| # | Theirs | # | Ours |
|---|---|---|---|
| 1 | Hero — animating claim + 2 CTAs | 1 | **The scan** — one measured total, then the live table of every dead pool on the chain |
| 2 | Customer logo marquee | 2 | **The ugly part** — why this returns a fraction, and not your money |
| 3 | Serverless product + bullets | 3 | **Why it's stuck** — locked LP, no withdrawal function, no holder with enough supply |
| 4 | Dedicated GPU + price table | 4 | **The curve** — the asymptote, drawn, with the shortfall named |
| 5 | Four performance multiples | 5 | **An exhumation** — open, gather, cut, exhume, split |
| 6 | Three design principles | 6 | **What we refuse** — the cut, honeypots, taxes, no execution theatre |
| 7 | Model catalogue | 7 | **Your bags** — connect, see your own dead positions and what they would pay |
| 8 | Three customer case studies | 8 | **The archive** — every round ever run. Currently empty, and says so |
| 9 | FAQ accordion | 9 | **The waitlist** — with the jurisdiction question asked plainly |
| 10 | Full-bleed accent CTA | — | — |

**Count:** 10 vs 9. **Order:** our proof is section 1 and our worst news is section 2; theirs
puts proof at 5 and has no bad news at all. **Purpose:** only one pair rhymes even loosely
(their catalogue of models, our catalogue of graves) and the resemblance ends at the word
"list" — theirs is a menu you buy from, ours is a dataset that is the entire argument for the
product's existence.

Differs in count, in order, **and** in purpose. The requirement is two of three.

The structural reason they cannot converge: their page must make an unfamiliar buyer trust an
infrastructure vendor, so it front-loads promise and back-loads proof. Our page must convince a
sceptical holder that a specific number is real, so it front-loads the proof and immediately
follows it with the reason the number is smaller than they want. The information architecture
falls out of that difference, not out of a decision to be different.
