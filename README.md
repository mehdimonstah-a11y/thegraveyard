# The Graveyard

Every dead pool on Robinhood Chain still has real money in it. This measures how much.

Launch liquidity on this chain is locked permanently, with no withdrawal function. That stops
rugs. It also means that when a token dies, the ETH or USDG in its pool is stranded — and the
only way out is to sell tokens into the pool, which no individual holder owns enough supply to
do profitably. The Graveyard aggregates the supply nobody can use alone, sells it in one
transaction, and splits what comes out.

**Nothing is deployed.** There is no contract, no `GRAVE` token and no exhumation. What exists
is the scan, and the scan is real.

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

## Stack

Next.js 15 App Router, TypeScript strict, Tailwind v4, Vercel. Archivo and IBM Plex Mono, both
SIL OFL. No images anywhere in the project — every graphic is drawn in markup.
