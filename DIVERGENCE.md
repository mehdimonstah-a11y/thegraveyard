# DIVERGENCE LEDGER

**Project:** The Graveyard — `thegraveyard.xyz`
**Reference:** `https://www.gmicloud.ai/en`
**Relationship:** unrelated categories. GPU cloud vs. an on-chain salvage protocol. Not a
competitor, so §5 minimums apply as written.

---

## THE SIGNATURE ELEMENT

> **The shortfall rule.** Every grave is drawn as a single horizontal line whose full width is
> the quote asset sitting in its pool; the recoverable part fills from the left in solid ink,
> the part constant-product maths will never surrender is left as bare paper at the right, and
> dragging along the line raises how much supply gets brought in — the fill advances, your
> split per token falls, and the bare part narrows without ever closing.

Built first, before anything else on the site.

It is native to this product in a way that could not be transplanted: it only means anything if
your business is extracting a bounded amount of quote asset from a pool that mathematically
cannot be emptied. On a GPU cloud's site it would be a bar chart of nothing. Stacked down the
Scan, several hundred of those unclosed gaps line up into a ragged bare margin running the
height of the page — the page's silhouette is literally the money nobody can have, which is
also the single most important thing this product has to tell you.

It carries three of the build brief's acceptance criteria at once: the live payout preview that
visibly decreases as deposits increase, the asymptote stated on the homepage, and the refusal
at the cut — past the cut point the fill stops advancing and the drag handle stamps `REFUSED`
in oxide rather than continuing to move.

**Naming note for you:** this needs one word added to the locked vocabulary in §1 of the build
brief — the uncrossable remainder is called **the shortfall** throughout. Say the word and I
will change it everywhere; it is one constant.

---

## THE SCORED LEDGER

| Axis | Min | Score | What they did → what I'm doing → where mine came from |
|---|---|---|---|
| **Palette** | 3 | **3** | Black ground with a single acid yellow-green accent → a cold grey duplicate-form stock, press-black ink, hairline form rules, a stamped-brass figure colour and one oxide-red refusal stamp → the paperwork of a scrap yard: a weighbridge ticket, an NCR duplicate, a zinc tag wired to a pallet, a rubber stamp. Not one hex, not one hue family, and no black ground anywhere |
| **Typography** | 3 | **3** | A proprietary geometric sans plus a mono, split prose vs. clickable → Archivo for words, IBM Plex Mono for every figure, address and tag, split claim vs. measurement → an inventory is typed; the numbers are the part someone has to be able to check, so the numbers get the typewriter and the prose gets out of the way. Both faces SIL OFL and licensed for this use |
| **Copy voice & headline formula** | 3 | **3** | Imperative two-sentence product promise, benefit-led, multiples against an unnamed baseline → flat declarative sentences that begin with a measured figure and name their method, no multiples, no superlatives, no imperatives → a probate inventory. It states what was found, where, and how it was counted. `$X in Y pools nobody has traded since Z.` |
| **Signature interaction** | 3 | **3** | A headline that types itself with a block caret → the shortfall rule, above → the constant-product curve, drawn at the scale of one pool, made draggable so the bad news arrives under the reader's own hand |
| **Motion language** | 2 | **3** | Two self-animating elements per page, hover transitions at 150–300ms → **zero** self-animating elements; the only movement on the site is the figure you are changing with your own finger, and one 90ms row hover → a ledger does not move. Nothing on a printed sheet animates, and a number that ticks on its own in a product about money you have lost would be a lie about activity |
| **Imagery & illustration** | 2 | **3** | Photography, partner badges, a scrolling wall of customer logos → no photographs, no logos, no icons: rules, hatching, ordinals and figures, and that is the whole graphic inventory → printers' furniture. A form is made of rules and boxes, so the site is made of rules and boxes |
| **Layout grid & density** | 2 | **2** | 1280px, 64px gutters, 104px section rhythm, density 4/10 → 1320px, 32px gutters, 72px section rhythm, density ~8/10, plus a persistent 44px left index column carrying each grave's ordinal → a ledger's spine. Honest score: it is still a centred max-width column of stacked sections, which is genre, so this is a re-derived density on a shared skeleton and not a new idea about layout |
| **Information architecture** | 2 | **3** | Promise first, proof at section five, no bad news anywhere → proof at section one, worst news at section two, mechanism at three through six → what this product has to explain is a number a sceptic will not believe, followed immediately by why it is smaller than they want. Nine sections, derived in the one-to-one map test in `REFERENCE-TEARDOWN.md` |
| **Brand vocabulary** | 3 | **3** | Inference, compute, clusters, console, serverless → a grave, what's left, an exhumation, bringing them in, the split, the cut, the shortfall → the build brief's locked vocabulary, extended by exactly one word, all of it from salvage and probate rather than from anything the reference has a name for |
| **Silhouette at thumbnail** | 2 | **2** | Alternating full-bleed black and white bands ending in one loud accent band — a barcode → one continuous pale ruled sheet, no bands at all, no accent field, with a ragged bare right margin down the table → a printed inventory page. Honest score: both are long vertical scrolls at 200px, and no amount of surface work changes that, so 2 is the truthful number |

**Total: 28 / 30.** Required 25. No axis below 2. The four named axes are all at 3.

---

## §5.1 — WHERE THE SURFACE CAME FROM

The noun is **salvage paperwork**. Not death, not Halloween, not a terminal.

When a scrapyard weighs a load, someone prints a ticket: a pale duplicate form with hairline
rules, a typed figure, a stamped tag number and, if the load is rejected, a red stamp. Every
surface decision on this site was taken from that object and nothing else:

| The object | The site |
|---|---|
| NCR duplicate stock — cold, slightly grey-green, never cream | `--ground`, the only page background |
| Hairline printed form rules | Every divider, every table row, every box. There is no other border |
| The typed figure in the weight box | IBM Plex Mono, tabular, for every number on the site |
| The brass tag wired to the pallet | `--brass`, and only ever on a recoverable amount |
| The red rejection stamp | `--oxide`, and only ever on a refusal |
| The ordinal at the top of the form | The 44px left index column, `0001`… |
| Bare paper where nothing was printed | The shortfall. It is not a colour, it is the absence of ink |
| Forms have no rounded corners | `border-radius: 0`, everywhere, no exceptions |

A site built out of a weighbridge ticket cannot look like a site built out of a GPU rack, no
matter how similar the underlying skeleton is. That is the whole mechanism, and it is also why
the result is better than a recolour would have been.

**Sibling check:** Containur, in this same repo, derived its surface from shipping containers —
oxide red, signal blue, mustard against steel. The Graveyard shares an oxide red with it by
coincidence of both worlds containing rust, so the value here is set colder and darker
(`#A32E1D` vs Containur's) and is restricted to a single meaning that Containur does not use it
for. Flagged in `DECISIONS.md` rather than hidden.

---

## THE FIVE TESTS

Tests 1–4 need the built site and are scheduled, not claimed. Test 5 is defined and enforceable
from the first commit and is running now.

| # | Test | Status |
|---|---|---|
| 1 | **Thumbnail.** Both homepages at 200px, blurred | **To run at build.** Prediction: passes on ground colour alone — theirs is 45% pure black, mine has no black field anywhere. The risk is that both blur to "a long light-and-dark scroll", which is why the silhouette axis is scored 2 and not 3 |
| 2 | **Stranger.** Two questions, in order, two nos | **To run at build**, on someone who has not seen this document |
| 3 | **Swap.** One of my sections dropped visually into theirs | **To run at build.** Prediction: the Scan table is a foreign object in their page — a 400-row hairline-ruled data table has nowhere to sit in a 4/10-density band layout |
| 4 | **Description.** Three sentences each, no cross-reference | **To run at build.** Draft of mine: *"It is a live census of every dead liquidity pool on one chain and exactly how much money is stuck in each. It aggregates the token supply that no single holder owns enough of to bother selling, sells it once, and splits what comes out. It tells you what your share will be before you deposit, and refuses your deposit when your share would be dust."* No sentence in that trio has an analogue in theirs |
| 5 | **Grep.** Their hexes, typefaces, section headings, taglines, distinctive phrases | **Defined and enforced.** `scripts/grep-test.mjs`, wired into CI, fails the build on any hit. Banned list: `DDEA4D`, `ddea4d`, `#262626`, `#A3A3A3`, `#0A0A0A`, `Alpha Lyrae`, `alpha-lyrae`, `Geist`, `SPACERR`, and every section heading and CTA string observed on the reference, plus the build brief's own bans — `reclaim`, `recover your losses`, `restore`, `RIP`, `tombstone`, `skull`, `coffin`, `rest in peace` |

A failed test is a revision, not a note. Results will be written back into this file before the
build is called done.

---

## WHAT WAS TAKEN, MAXIMALLY

Per §9 of the reference brief, and stated plainly so it can be checked:

- **The refusal to decorate.** No gradients, no 3D, no particles, no glass. Held.
- **A vocabulary small enough to learn in one screenful, then never broken.** Two faces, one
  accent with one meaning, zero corner radius, one motion. Their rule count is small; mine is
  smaller.
- **Rationing the accent so it still reads as an accent.** Their mechanism, my values.
- **Leaving an unfinished thing visibly empty rather than filling it with a plausible number.**
  Their price cell for an unreleased product; my empty exhumation archive and my zero counts.
- **Building one hard thing instead of five easy ones.** Theirs is a typing headline done
  properly. Mine is a chain-wide census of every pool that has ever existed on this chain,
  which is the only reason anything else on the site is worth reading.

None of that is visible in a screenshot, and all of it is why the reference was worth studying.
