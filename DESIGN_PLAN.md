# DESIGN PLAN — THE GRAVEYARD

Written before any build code. Derived from `DIVERGENCE.md` §5.1: the noun is **salvage
paperwork** — a weighbridge ticket, an NCR duplicate, a zinc tag, a rubber stamp. Nothing on
this site comes from a graveyard, a terminal, or the reference.

---

## 1. PALETTE

Every value below was picked off the object, then checked for contrast. No hex here appears
anywhere on the reference, and no hue family is shared with it.

### Light — the printed sheet (default)

| Token | Hex | Where it came from | Use |
|---|---|---|---|
| `--ground` | `#E3E4DF` | NCR duplicate stock — cold, faintly green, deliberately not cream | The page. The only background |
| `--sheet` | `#EFEFEB` | The form printed on top of it | Tables, the scan, any bounded field |
| `--ink` | `#191A17` | Press black, slightly warm | All body text, all figures |
| `--rule` | `#CDCCC3` | Hairline form rules | Every divider and cell edge on the site |
| `--zinc` | `#6B6F6C` | Galvanised tag metal | Secondary text, units, timestamps, addresses |
| `--brass` | `#8C6A16` | The stamped brass tag wired to a pallet | Recoverable amounts, and nothing else |
| `--oxide` | `#A32E1D` | The red rejection stamp | A refusal, and nothing else |

The shortfall has no token. It is `--sheet` with no ink on it, bounded by `--rule`. That is the
point: the thing you cannot have is drawn as an absence.

### Dark — the night shift

Same objects under a work light. Not an inversion; a re-derivation.

| Token | Hex |
|---|---|
| `--ground` | `#1A1B18` |
| `--sheet` | `#222320` |
| `--ink` | `#E6E5DE` |
| `--rule` | `#3B3C37` |
| `--zinc` | `#9BA09A` |
| `--brass` | `#C69A3A` |
| `--oxide` | `#D2604A` |

Measured contrast, both themes: ink on sheet ≥ 13:1, zinc on sheet ≥ 4.6:1, brass on sheet
≥ 4.5:1, oxide on sheet ≥ 4.5:1. Nothing on the site is below AA at its size.

**Accent discipline:** `--oxide` carries exactly one meaning — *the protocol declined this* —
and appears only where something is refused: a deposit past the cut, a failed sell-simulation, a
tax that eats the recovery, a grave below the minimum. On a healthy homepage it appears three
times or fewer. If it starts appearing decoratively, the system has failed.

---

## 2. TYPE

| Role | Face | Weights | Licence |
|---|---|---|---|
| Prose, headings, labels | **Archivo** | 400, 500, 600 | SIL OFL |
| Every figure, address, pool id, tag, ordinal | **IBM Plex Mono** | 400, 500 | SIL OFL |

Both self-hosted as `woff2` subsets. Neither is the reference's.

**The split is claim vs. measurement, not prose vs. clickable.** If a thing on this site was
measured on chain, it is set in the mono with `font-variant-numeric: tabular-nums`. If a person
wrote it, it is set in Archivo. A reader can tell at a glance which parts of the page we are
responsible for and which parts the chain is.

Scale, derived from the content rather than a ratio picked in advance:

```
132 / 96 / 56    the chain total, one instance, clamp(56px, 11vw, 132px)   mono 500
34               section headings                                          archivo 600
22               the ugly part, set larger than body because it matters    archivo 400
17 / 15          body prose                                                archivo 400
15               table figures                                             mono 400
13               units, addresses, block numbers, timestamps               mono 400
11               the left index ordinals, +0.08em tracking, uppercase      mono 400
```

Body measure 62–68 characters. Leading 1.5 on prose, 1.15 on the display figure, 1.35 in table
rows. Sentence case everywhere except the index ordinals and the section eyebrows.

---

## 3. GRID AND RHYTHM

- Max width **1320px**. The Scan needs it; nothing else may exceed it.
- 12 columns, 20px gutters, page margin 32px ≥768px and 16px below.
- Vertical rhythm on an **8px** base. Section spacing **72px**, and 48px below 768px.
- A persistent **44px left index column** carrying each grave's ordinal — `0001`, `0002` —
  down the whole table. It is the ledger's spine and it is the first thing that tells you this
  is an inventory rather than a landing page.
- `border-radius: 0` on every element. No exceptions, no inputs, no buttons, no cards.
- Minimum tap target 44px on marketing surfaces; the build brief asks for 32px and a table this
  dense needs more.

Density target ~8/10: a screenful of the Scan carries 14–18 graves with eight fields each. The
reference's 4/10 airiness would be a lie about how much data there is.

---

## 4. THE SIGNATURE ELEMENT — THE SHORTFALL RULE

Built first, alone, before any other surface.

```
 what's left in this pool: 412.80 USDG
 |--------------------------------------------------------------|
 [############################################:.................]
  ^ recoverable at this deposit level          ^ the shortfall
    338.91 USDG                                  73.89 USDG
                                                 never, at any size
 |------------------------------------ drag ------------------->|
 supply brought in    41%          your split, per 1M tokens: $0.0412
```

- Full width = the quote reserve. Solid fill = `out(Δ)` at the current level. Bare paper =
  `R_q − out(Δ)`, terminated by a 2px `--ink` stop that never moves.
- Dragging raises Δ. The fill advances with diminishing returns, exactly as the maths says. The
  per-token split figure **falls** as it advances, and it is the largest number in the row.
- Past the cut — where marginal recovery per token drops below the dust threshold — the handle
  stops and stamps `REFUSED · BELOW DUST` in `--oxide`, with the reason on screen. It does not
  keep sliding into a diluted number.
- Reduced motion: nothing to disable. There is no transition on the fill; it tracks the pointer.
  Keyboard: arrow keys move Δ in 1% steps, Home/End to the ends, value announced via
  `aria-valuetext` as a sentence, not a percentage.

Stacked down the Scan, the shortfalls line up into a ragged bare margin down the right of the
table. That margin is the site's silhouette and its argument.

---

## 5. WIREFRAMES

### `/` — desktop, 1320px

```
+--------------------------------------------------------------------------+
| THE GRAVEYARD                      the scan  an exhumation  the archive   |
+--------------------------------------------------------------------------+
|                                                                          |
|  ON ROBINHOOD CHAIN, BLOCK 51,182,737, READ 2 MIN AGO                     |
|                                                                          |
|  $ 1 2 4 , 8 8 1 . 4 0                                                    |
|  is sitting in 3,417 pools that nobody has traded in 30 days.             |
|  Not all of it can come out. Most of this page is about that.             |
|                                                                          |
+--------------------------------------------------------------------------+
| 0001 | TOKEN            POOL          WHAT'S LEFT   RECOVERABLE  LAST     |
+------+-------------------------------------------------------------------+
| 0001 | PEPECHAIN  0x3f.. 0x9a1c..     412.80 USDG   [####:...] 338.91  41d |
| 0002 | MOONDOG    0x7b.. 0x2e04..     388.10 USDG   [####:..]  301.44  52d |
| 0003 | ...                                                                |
|      | [ sort: recoverable | what's left | last swap | tax ]              |
|      | [ connect a wallet to mark your own ]                              |
+--------------------------------------------------------------------------+
|                                                                          |
|  You are not getting your money back.                     <- 22px, ink   |
|  <the ugly part, §6, verbatim, in the founder's voice>                    |
|  $124,881.40 total. $0.00 recovered so far, across 0 exhumations.         |
|                                                                          |
+--------------------------------------------------------------------------+
|  WHY IT'S STUCK                                                          |
|  Locked LP -> no withdrawal function -> no holder with enough supply      |
|  [three short columns, hairline rules between, no cards]                  |
+--------------------------------------------------------------------------+
|  THE CURVE                                                               |
|  out(D) = Rq x D(1-f) / (Rt + D(1-f))                                     |
|  [the shortfall rule at full width, draggable, one grave's real numbers]  |
|  The line on the right is the asymptote. It is not a rendering artefact.  |
+--------------------------------------------------------------------------+
|  AN EXHUMATION                                                           |
|  01 OPEN   02 GATHER   03 CUT   04 EXHUME   05 SPLIT                      |
|  [five ruled rows, each two sentences, the CUT row stamped in oxide]      |
+--------------------------------------------------------------------------+
|  WHAT WE REFUSE                                                          |
|  [ruled list: deposits past the cut · honeypots · taxed tokens ·          |
|   rebasing and blacklisting tokens · execution theatre]                   |
+--------------------------------------------------------------------------+
|  YOUR BAGS                                                               |
|  [connect] -> your dead positions, their pools, what they would pay       |
|  Nothing is stored. The read happens in your browser.                     |
+--------------------------------------------------------------------------+
|  THE ARCHIVE                                                             |
|  Exhumations run: 0. Recovered: $0.00. Paid out: $0.00.                    |
|  There is nothing here yet. There will be a row for every round, good     |
|  and bad, and this page is the reason to believe the next one.            |
+--------------------------------------------------------------------------+
|  THE WAITLIST                                                            |
|  [email] [country v]  ->  Join                                           |
|  Nothing is deployed. No token, no contracts, no sale.                    |
+--------------------------------------------------------------------------+
| Stock Token issuer + jurisdiction notice · addresses · method · block     |
+--------------------------------------------------------------------------+
```

### 360px

```
+----------------------------+
| THE GRAVEYARD          [=] |
+----------------------------+
| BLOCK 51,182,737           |
| $124,881.40                |
| in 3,417 pools nobody has  |
| traded in 30 days.         |
+----------------------------+
| 0001 PEPECHAIN             |
|      0x3f4a...9c21         |
|      what's left  412.80   |
|      recoverable  338.91   |
|      [######:.........]    |
|      last swap    41d      |
+----------------------------+
| 0002 MOONDOG               |
| ...                        |
+----------------------------+
```

The table becomes a stack of ruled cards, one grave each, ordinal retained. Figures never
reflow: every money value is `tabular-nums` in a fixed-width cell, and the shortfall rule keeps
its proportions because it is drawn from the same two numbers at any width.

### `/g/[address]` — one grave

Keyed by **contract address**, never by symbol, because this chain has counterfeit NVDA and
TSLA tokens and two graves may legitimately share a ticker. The address is the page title, the
symbol is a subtitle, and both are printed in full at the top with an explorer link.

```
+--------------------------------------------------------------------------+
| 0x3f4a...9c21   PEPECHAIN   pool 0x9a1c...  fee 1.00%  tickSpacing 60      |
+--------------------------------------------------------------------------+
| RESERVES        4,120,000,000 PEPECHAIN / 412.80 USDG    block 51,182,737 |
| SELL SIM        PASSES, 0.00% tax, measured at block 51,182,701           |
| LAST SWAP       41 days ago, block 34,102,884                             |
| HOLDERS         1,204                                                     |
+--------------------------------------------------------------------------+
| [ the shortfall rule, full width, draggable ]                             |
+--------------------------------------------------------------------------+
| CAMPAIGN        not open. Nothing is deployed.                            |
+--------------------------------------------------------------------------+
```

---

## 6. MOTION

One line: **nothing on this site animates by itself.**

- No scroll reveals, no counters, no marquee, no typing, no parallax.
- Row hover: background `--sheet` → 4% ink, 90ms linear. That is the only transition.
- The shortfall rule tracks the pointer with no easing at all, because it is direct
  manipulation and an eased fill would misrepresent the maths as a performance.
- `prefers-reduced-motion`: the 90ms hover becomes 0ms. Nothing else changes, because there is
  nothing else.

---

## 7. COPY RULES

- Flat declarative. Sentences start with the measured number where one exists.
- Never "reclaim", "recover your losses", "restore", "get back what you lost". Grepped in CI.
- Never skulls, tombstones, RIP, coffins, ghosts, "rest in peace". Grepped in CI.
- The joke, where there is one, is with the reader. Never at someone holding a dead bag.
- Every figure on screen carries its block number and its method within one click.
- Zeros are printed as zeros: `0 exhumations`, `$0.00 recovered`, and a sentence saying so.

---

## SELF-CRITIQUE

Six things wrong with the plan above, before you have to point them out.

**1. The pale sheet risks reading as "cream + serif + terracotta", which the build brief bans.**
`#E3E4DF` is a cold grey-green, the type is a grotesque and a mono with no serif anywhere, and
the oxide is a stamp used ≤3 times rather than a field — but it is one drift away from the
banned zone. Mitigation: the ground is locked colder than instinct wants, and if a build
screenshot reads warm, the ground goes to `#E0E2DE` and the brass loses saturation. Logged as
a live risk in `DECISIONS.md`, not as a solved problem.

**2. Density 8/10 plus a 44px index column plus tabular figures is a lot of system for a page
whose top two sections are one number and one paragraph.** The risk is that the top of the page
and the table look like two different sites. Fix: the display total sits *on* the table's top
rule and shares its left index column, so the hero is visibly the first row of the ledger
rather than a hero that happens to precede one.

**3. "Nothing animates" is a rule I will want to break at the waitlist.** Every form wants a
success state that moves. It does not get one: the button becomes a stamped `RECEIVED` in ink,
instantly. If that reads as broken in testing, the honest fix is a 90ms opacity step, not a
checkmark that draws itself.

**4. The shortfall rule is hard to make legible at 360px.** At 320px of drawable width, a 5%
shortfall is 16 pixels and a 0.5% shortfall is under two. Mitigation: below 768px the rule gets
a minimum shortfall width of 6px and prints the exact figure beneath it, and the row states in
words that the drawing is not to scale when it isn't. A bar that lies about a small number
would undermine the one thing the element exists to say.

**5. The Scan's honesty depends on data volume I have not finished measuring.** If the chain
turns out to hold four thousand graves worth $3 each, the giant total at the top is technically
true and practically a misrepresentation, because nobody can extract $3 profitably. Fix,
already in the plan: the headline total is the total **above the recoverable minimum**, with the
full chain total printed beneath it in `--zinc` at 13px and the gap between the two explained
in one sentence. The number that flatters us is the smaller one, and it is the one in 132px.

**6. Two sibling projects in this repo already use a hairline-ruled, mono-figure, zero-radius
system.** The differentiator here is the index column, the shortfall's bare-paper device and
the pale cold ground; if a side-by-side with Floorr or Containur reads as the same template,
that is a real failure and the fix is structural — the Scan becomes a true two-pane layout with
a fixed left grave list and a right detail pane, which neither sibling has. Held in reserve
rather than built speculatively.
