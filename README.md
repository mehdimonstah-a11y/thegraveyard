# The Graveyard

Every dead pool on Robinhood Chain still has real money in it. This measures how much.

Launch liquidity on this chain is locked permanently, with no withdrawal function. That stops
rugs. It also means that when a token dies, the ETH or USDG in its pool is stranded — and the
only way out is to sell tokens into the pool, which no individual holder owns enough supply to
do profitably. The Graveyard aggregates the supply nobody can use alone, sells it in one
transaction, and splits what comes out.

**Nothing is deployed.** There is no contract, no `GRAVE` token and no exhumation. What exists
is the scan, and the scan is real.

**The site is open.** `/` is a one-screen front door; the scan, the docs and the archive are
behind it. The waitlist and the middleware gate are gone.

**No boilerplate.** The chain's name, its id, the explorer's vendor and an affiliation
disclaimer appear nowhere a visitor reads — none of it is something anyone can act on, and all of
it makes a page look like a template. Explorer links stay, because a figure you cannot go and
check is a claim; they route through `/e/<kind>/<value>` so the vendor is not in the markup
either. `scripts/grep-test.mjs` fails the build if any of it comes back.

---

## What is measured

| | |
|---|---|
| Pools ever initialised on chain 4663 | **542,707** — a complete census, not a sample |
| Pools with a quote asset on one side | **505,055** (native ETH, WETH, flETH, USDG) |
| Uniswap V4 singleton | `0x8366a39cc670b4001a1121b8f6a443a643e40951` |
| Chain age at scan time | 123 days, 0.208 s/block |

Every published reserve comes from replaying a pool's exact position ladder out of
`ModifyLiquidity` events and evaluating it in integer arithmetic. Nothing is interpolated and
nothing is defaulted; a field the scan could not establish renders as an em dash.

## The pipeline

```bash
npm run prices        # ETH/USD and USDG/USD from this chain's own Chainlink feeds
npm run scan:pools    # every Initialize event, ever — the population
npm run sample        # a random sample, screened from contract storage
npm run exact         # exact position ladders for everything the screen passes
npm run liveness      # per-grave swap history: idle days, sells, tradeability
npm run publish:data  # compile it all into src/data/scan.json, which the site reads
```

The site never queries the chain to render a page. Half a million pools cannot be scanned on a
page load, and the only endpoint that serves logs for this chain throttles after two queries.
The trade is that every figure is as of a stated block, and every surface that shows a figure
prints that block.

## Tests

```bash
npm test
```

- `v4math.test.mjs` — nine assertions on the recovery maths, including the three properties the
  product is built on: the recovery is asymptotic, marginal recovery falls, and one sale equals
  twenty slices to within 0.1%. That last one is why there is no execution engine here.
- `grep-test.mjs` — 30 banned patterns. Reference-identifying strings, and the language this
  product refuses to use about what it does.

## Documents

| File | What it is |
|---|---|
| `RECOVERY.md` | The chain-wide scan, the four questions, and the honest recommendation |
| `SPEC.md` | The measured extraction of the reference layout, and the section mapping |
| `DEVIATIONS.md` | Every deviation with its reason, plus all seven fidelity QA results |
| `DECISIONS.md` | Every judgment call, with the reasoning and the risks |
| `DESIGN_PLAN.md` | Palette, type, grid, wireframes, self-critique |
| `REFERENCE-TEARDOWN.md` | Reference observations and the four-layer sort |
| `DIVERGENCE.md` | The scored divergence ledger from the earlier brief |

## Brand

```bash
npm run brand      # renders scripts/brand.html in Chrome, writes public/brand
```

| File | What it is |
|---|---|
| `mark.svg`, `mark-on-light.svg` | The mark, vector, for anywhere a file is wanted |
| `avatar-1024/512/400/200/96/48.png` | Square avatar, dark ground |
| `twitter-banner-1500x500.png`, `@2x` | Header. Left column clears the profile-picture overlay |
| `wordmark.png`, `wordmark-on-dark.png` | 1200×360, transparent and on ground |
| `icon-512.png` | Favicon source |
| `posts/*.png` | Five 1600×900 launch cards, shot at 2× — `npm run cards` |

Three bars and a wall: each bar a grave filled to what comes out of it, the wall the reserve, and
the gap widening because every extra unit of supply recovers less than the last. Drawn in markup
at every size, so it cannot drift between the 22px header and the 1500px banner.

## Stack

Next.js 15 App Router, TypeScript strict, Tailwind v4, Vercel. Archivo and IBM Plex Mono, both
SIL OFL. The app ships no image files — every graphic on every page is drawn in markup. The only
rasters in the repository are the exported brand assets above, which exist because Twitter will
not take an SVG.
