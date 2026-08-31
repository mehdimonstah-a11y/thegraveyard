# SPEC — STRUCTURAL EXTRACTION

**Reference:** `https://www.gmicloud.ai/en` (serves `https://gmicloud.ai`)
**Our project:** The Graveyard — `thegraveyard.xyz`
**Measured:** 2026-08-31, from computed styles and `getBoundingClientRect`, at 1440 / 1024 / 768 / 375.
**Not a competitor.** GPU cloud vs. an on-chain salvage protocol. Different market, no overlap.

Everything below is a measurement of a rendered page. No code, asset, font file or sentence
from the reference is in this repository, and none will be. Every value here was read from the
DOM, not estimated by eye.

---

## 1. GRID

| Breakpoint | Viewport | Page padding | Container max-width | Content width |
|---|---|---|---|---|
| xl | 1440 | 64px | 1312px | 1312px |
| lg | 1024 | 64px | 1024px | 896px |
| md | 768 | 64px | 768px | 640px |
| sm | 375 | 24px | none | 327px |

The container max-width tracks the breakpoint rather than sitting at one fixed value: it is
`max-w-screen-{bp}` behaviour, so at 1440 the content is 1312 (viewport − 2×64) and at 1024 it
is 896 (viewport − 2×64) while the max-width token reads 1024.

**Breakpoints where layout changes:** 768 and 1024 for column counts; 768 for padding
(64 → 24) and section rhythm (104 → 48).

Column structures measured, by breakpoint:

| Structure | 1440 | 1024 | 768 | 375 |
|---|---|---|---|---|
| Four-up stat row | `328px ×4`, gap 0 | `224px ×4`, gap 0 | — | — |
| Three-up card row | `437px ×3`, gap 0 | `298px ×3`, gap 0 | `213px ×3`, gap 0 | 1 col |
| Two-up split | `457px` + flow | — | `296px ×2`, gap 48 | `151.5px ×2`, gap 24 |
| Model / list grid | — | — | `320px ×2`, gap 0 | `326px ×1` |

**The four-up and three-up rows have zero gap.** Columns butt against each other and are
separated by 1px borders, not whitespace. This is the single most distinctive structural
decision on the page and it is replicated exactly.

---

## 2. SPACING SCALE

Every unique vertical value in use, deduplicated: **0, 4, 8, 12, 16, 24, 32, 40, 48, 52, 64,
80, 88, 104**px. A 4px base with an 8px working step.

### Section padding, per section, per breakpoint

Section indices are `main`'s element children, top to bottom.

| # | Ground | pt/pb @1440 | pt/pb @1024 | pt/pb @768 | pt/pb @375 |
|---|---|---|---|---|---|
| 0 hero | transparent over black | 0 / 0 | 0 / 0 | 0 / 0 | 0 / 0 |
| 1 marquee | `#000000` | 0 / 0 | 0 / 0 | 0 / 0 | 0 / 0 |
| 2 | `#000000` | 52 / 104 | 52 / 104 | 52 / 104 | 24 / 48 |
| 3 | `#FFFFFF` | 104 / 104 | 104 / 104 | 104 / 104 | 48 / 48 |
| 4 | `#000000` | 104 / 104 | 104 / 104 | 104 / 104 | 48 / 48 |
| 5 | `#000000` | 104 / 104 | 104 / 104 | 104 / 104 | 48 / 48 |
| 6 | `#FFFFFF` | 104 / 104 | 104 / 104 | 104 / 104 | 48 / 48 |
| 7 | `#000000` | 104 / 104 | 104 / 104 | 104 / 104 | 48 / 48 |
| 8 | `#262626` | 104 / 104 | 104 / 104 | 104 / 104 | 48 / 48 |
| 9 accent | `#DDEA4D` | 104 / 104 | 104 / 104 | 104 / 104 | 48 / 48 |
| footer | `#000000` | 88 / 88 | 88 / 88 | 88 / 88 | 48 / 48 |

### Section heights, measured

| # | 1440 | 1024 | 768 | 375 |
|---|---|---|---|---|
| 0 hero | 720 | 720 | 720 | 602 |
| 1 marquee | 80 | 80 | 80 | 80 |
| 2 | 906 | 930 | 1134 | 1086 |
| 3 | 1395 | 1589 | 3039 | 2754 |
| 4 | 836 | 870 | 1192 | 928 |
| 5 | 944 | 1040 | 1152 | 1034 |
| 6 | 1163 | 1403 | 2040 | 688 |
| 7 | 710 | 790 | 970 | 1344 |
| 8 | 725 | 949 | 981 | 845 |
| 9 | 676 | 676 | 758 | 464 |
| footer | 1092 | 1092 | 1022 | 1298 |
| **document** | **9,347** | — | — | **11,447** |

Section heights are content-driven and ours will differ where our copy differs. The **padding**
and the **structure** are what get replicated; §7's ±8px section-boundary test is applied to
the sections whose content maps 1:1 in length.

---

## 3. TYPE SCALE

Two families. Sizes are the rendered values at 1440.

| Element | Family | Weight | Size / line-height | Case | Colour |
|---|---|---|---|---|---|
| Hero headline | display sans | 500 | 66.56 / 66.56 | sentence | `#FFFFFF` |
| Section heading (h2) | display sans | 500 | 48 / 40 · 48 / 64 · 48 / 68 | sentence | `#FFFFFF` on dark, `#0A0A0A` on light |
| Sub-heading (h3, large) | display sans | 500 | 36 / 40 | sentence | as ground |
| Card title (h3) | display sans | 500 | 24 / 24 · 24 / 32 | sentence | as ground |
| Big stat figure | display sans | 500 | 48 / 48 | — | `#FFFFFF` |
| Lead paragraph | display sans | 500 | 20 / 24 · 18 / 24 | sentence | as ground |
| Body | mono | 400 | 18 / 24 | sentence | as ground |
| Body small | mono | 400 | 14 / 18 | sentence | `#0A0A0A` / `#A3A3A3` |
| Nav link | display sans | 400 | 14 / 20 | sentence | `#FFFFFF` |
| Button label | mono | 500 | 16 / 24 (lg) · 14 / 20 (md) · 12 / 16 (sm) | **UPPERCASE** | per variant |
| Eyebrow / label | mono | 500 | 12 / 16 | uppercase, +0.6px tracking | `#A3A3A3` |
| Footer link | mono | 400 | 14 / 20 | sentence | `#FFFFFF` |
| Footer column head | mono | 500 | 12 / 16 | uppercase | `#A3A3A3` |
| Legal / fine print | mono | 400 | 10 / 12 · 12 / 20 | sentence | 70% white |

Ratio between adjacent steps: **1.2–1.35**, tightening at the small end. Leading is 1.0 at
display sizes and 1.33–1.45 at body sizes. Body measure 62–72 characters at 1440.

**The load-bearing convention:** prose and headings in the display sans, every button label and
every category label in UPPERCASE MONO. It replaces iconography — the page has almost no icons.

At 375 the hero drops to 40/40 and button labels to 12/16; heading sizes step down one rung.

---

## 4. COLOUR — reference roles

| Hex | Role | Share of viewport at rest |
|---|---|---|
| `#000000` | page background | ~45% |
| `#FFFFFF` | alternate section ground; primary text on dark | ~40% |
| `#262626` | one section ground; card fill on dark | ~7% |
| `#DDEA4D` | accent | ~6.6%, almost all of it the closing band |
| `#A3A3A3` | secondary text on dark | ~0.6% |
| `#171717` | secondary button fill on dark | <1% |
| `#0A0A0A` | primary text on light grounds | <1% |
| `#404040` | default border on dark | — |
| `#525252` | stronger border on dark | — |
| `#FAFAFA` | text on the `#171717` button | — |

**Accent frequency, counted at rest: 9 placements in a 9,347px page** — one header button fill,
the hero primary CTA, a small number of inline emphasis words, and the full-bleed closing band.
Zero occurrences on either light section.

Contrast measured: white on black 21:1; `#A3A3A3` on black 9.0:1; black on accent ~15:1.

---

## 5. RADII, BORDERS, SHADOWS

- **Radii: `0px` on every element on the page.** No exceptions — buttons, cards, badges, inputs,
  price cells, accordion rows. The `radii` sweep across ~2,500 elements returned an empty set.
- **Borders:** `1px solid #404040` (16 elements, the default divider and the secondary button
  outline), `1px solid #525252` (12), `1px solid #E8E8E8`-equivalent on light grounds (12),
  `1px solid #FFFFFF` (1), `1px solid #000000` (1, the accent-band secondary button).
- **Shadows: none.** The `box-shadow` sweep across the same ~2,500 elements returned an empty
  set. Depth is expressed entirely through ground changes and 1px borders.

This matters for §5.4 of the clone brief: there are no light-mode shadows to translate, because
there are none at all.

---

## 6. COMPONENT INVENTORY

### 6.1 Header / nav

| Property | Value |
|---|---|
| Height | 68px, all breakpoints |
| Position | `sticky` |
| Ground | `#000000` |
| Border | none |
| Padding | 64px sides ≥768, 24px at 375 |
| Structure | wordmark left · nav centre · CTA pair right |
| Nav items | 6, two with dropdowns, plus a language switcher |
| Nav type | display sans 400, 14/20, sentence case, `#FFFFFF` |
| Nav buttons | 36px tall, 24px horizontal padding, radius 0, mono 500 14/24 uppercase |
| Mobile | collapses to a hamburger; nav items hidden below 1024 |

### 6.2 Buttons — full anatomy

| Variant | Height | Padding X | Padding Y | Radius | Fill | Text | Border | Type |
|---|---|---|---|---|---|---|---|---|
| Primary, nav | 36 | 24 | 0 | 0 | accent | `#000000` | none | mono 500 14/24 upper |
| Secondary, nav | 36 | 24 | 0 | 0 | transparent | `#FFFFFF` | 1px `#404040` | mono 500 14/24 upper |
| Primary, hero | 48 | 24 | 12 | 0 | accent | `#000000` | none | mono 500 16/24 upper |
| Secondary, hero | 48 | 24 | 12 | 0 | transparent | `#FFFFFF` | 1px `#404040` | mono 500 16/24 upper |
| Primary, inline | 40 | 16 | 0 | 0 | accent | `#000000` | none | mono 500 14/20 upper |
| Tertiary, inline | 40 | 16 | 0 | 0 | `#171717` | `#FAFAFA` | none | mono 500 14/20 upper |
| On-light inline | 40 | 16 | 12 | 0 | `#000000` | `#FFFFFF` | none | mono 500 14/20 upper |
| On-accent secondary | 48 | 24 | 12 | 0 | accent | `#000000` | 1px `#000000` | mono 500 16/24 upper |
| Primary @375 | 40 | 16 | 0 | 0 | accent | `#000000` | none | mono 500 12/24 upper |
| Inline @375 | 32 | 12 | 0 | 0 | accent | `#000000` | none | mono 500 12/16 upper |

**States.** The reference's stylesheet is served cross-origin and its `:hover` rules could not
be read from `document.styleSheets`. What is measurable is the transition: `150ms
cubic-bezier(0.4, 0, 0.2, 1)` on `color, background-color, border-color, outline-color,
text-decoration-color, fill, stroke`, applied to 52 interactive elements; a second group of 16
at 200ms; 12 elements transition `transform` at 200ms and 4 at 300ms. Hover, active,
focus-visible and disabled values are therefore **derived** rather than copied, and the
derivation is logged in `DEVIATIONS.md`.

### 6.3 Cards

- Padding 24–32px, radius 0, 1px `#404040` border on dark grounds.
- Zero gap between cards in a row; adjacent cards share an edge.
- No shadow, no hover lift. Hover changes border and text colour only, at 150ms.

### 6.4 Price / stat cells (§3's three-up)

Three equal columns, zero gap, 1px dividers. Each holds: a title (24/32), a large figure
(48/48), a body paragraph (14/18), and a status label in uppercase mono 12/16.

### 6.5 Stat row (§4's four-up)

Four equal columns, zero gap. Each holds a large figure (48/48 display sans) and a caption
(14/18 mono). A single footnote paragraph sits beneath the row, full width, mono 14/18 muted.

### 6.6 Accordion (§8 FAQ)

Rows separated by 1px dividers, question in display sans, plus/minus affordance on the right,
row height driven by content, no radius, expands in place.

### 6.7 Marquee (§1)

Full-bleed, 80px tall, ground `#000000`, no padding. One CSS animation:
`126,150ms steps(3785)`, infinite, translating a duplicated track. Content is a strip of
third-party logos.

### 6.8 Footer

- 88px top and bottom padding, `#000000`.
- Four link columns, each with an uppercase mono 12/16 `#A3A3A3` heading and mono 14/20 white links.
- A subscribe block with an email input and a submit button.
- A social row and a copyright line in 10/12 mono.

### 6.9 Inputs

Height ~40px, radius 0, 1px border, transparent fill, placeholder in the muted grey. Focus
treatment not readable from the cross-origin stylesheet; derived and logged.

---

## 7. MOTION INVENTORY

| Element | Duration | Easing | Trigger |
|---|---|---|---|
| Colour/border/fill, 52 elements | 150ms | `cubic-bezier(.4,0,.2,1)` | hover / focus |
| Colour/border/fill, 16 elements | 200ms | same | hover |
| Transform, 12 elements | 200ms | same | hover |
| Transform, 4 elements | 300ms | same | hover |
| Hero caret blink | 1000ms | `steps(2, jump-none)` | load, infinite |
| Logo marquee | 126,150ms | `steps(3785)` | load, infinite |

**Two elements self-animate; everything else is a hover response.** No scroll-triggered
reveals, no parallax, no count-ups. Self-animating elements per screenful: one.

The hero performs a fixed lead-in phrase followed by a phrase that types itself in behind a
blinking block caret.

---

## 8. THE MAPPING TABLE

Default is 1:1. No section is reordered, merged, invented or dropped.

| # | Reference section | Their content | Our content | Notes |
|---|---|---|---|---|
| 0 | Hero, 720px, badge + animating headline + sub + 2 CTAs | Partner badge; "one cloud for …" typing headline; one-sentence sub; primary + secondary CTA | `ROBINHOOD CHAIN · 4663` badge; headline whose tail types itself through the four things a grave holds; one-sentence sub; `JOIN THE WAITLIST` + `READ THE METHOD` | Same anatomy, same typing mechanic, our words |
| 1 | Full-bleed 80px marquee | Scrolling strip of customer logos | Scrolling strip of the largest measured graves: address, what's left, days idle | We have no customers and will not imply any. Same component, real data |
| 2 | Heading + sub + 4 bullet claims + CTA | Serverless product pitch | **Why the money is stuck** — locked LP, no withdrawal function, no holder with enough supply, dust returns dust. CTA to the method | 1:1 |
| 3 | Alternate ground. Heading + 3 bullet columns + CTA, then a second heading + sub + CTA + 3-up price cards | Dedicated GPU pitch, then GPU pricing | **How an exhumation works** — three columns, then **The published minimums** — three cells carrying the minimum reserve, the dust threshold and the window length | Their price table is our threshold table: same three-up, zero gap, figure + status label |
| 4 | Heading + sub + 4-up stat row + footnote | 3.7× / 5.1× / 30% / 2.3× performance multiples | The four measured chain figures: graves, what's left, above the floor, recovered so far. The last one reads `$0.00` | Their multiples are our measurements. Every cell is real or zero |
| 5 | Heading + sub + 3-up cards | Three design principles | **What we refuse** — deposits past the cut, honeypots, execution theatre | 1:1 |
| 6 | Alternate ground. Heading + sub + CTA + long list grid | Model catalogue | **The scan** — the grave table, sortable, address-keyed, with explorer links | Their catalogue is our dataset. Same grid, same row rhythm |
| 7 | Heading + sub + 3 blocks, 4 bullets each | Three customer case studies | **The ugly part** — three blocks: you are not getting your money back; marginal recovery falls; execution is one transaction. Four measured facts each | Their proof-by-customer is our proof-by-maths |
| 8 | Heading + sub + accordion | FAQ | FAQ, ours | 1:1 |
| 9 | Full-bleed accent band + 2 CTAs | Closing CTA | Closing CTA: the waitlist, with the country field | 1:1 |
| — | Footer, 4 columns + subscribe + social + legal | — | Four columns; the subscribe block is the waitlist; legal carries the issuer and jurisdiction sentences | 1:1 |

**Nothing is dropped.** Two sections carry a logged substitution of *kind* — no third-party
logos in the marquee, no customer testimonials in §7 — because we have neither and inventing
either would breach both this brief and ours. Both are recorded in `DEVIATIONS.md`.

---

## 9. WHAT CHANGES

1. **Copy** — every string ours, matched to their structure: headline length, sentence count
   per paragraph, label style, sentence case for prose and uppercase for labels.
2. **Brand** — The Graveyard wordmark at the same optical size and position; `$GRAVE`; our
   accent at the same nine placements as theirs.
3. **Colour mode** — a derived dark palette per §5 of the clone brief. The reference is already
   dark, which is a deviation from that section's premise and is logged.
4. **Typefaces** — both of theirs are unusable: one is proprietary, the other identifies the
   reference. Metric-matched substitutes, logged in `DEVIATIONS.md`.
5. **Imagery** — none of theirs. We use none at all: rules, figures and one drawn element.
