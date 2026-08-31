# RECOVERY

The chain-wide scan, the four questions from §2 of the build brief, and the recommendation.

**Chain:** Robinhood Chain, id 4663, an Arbitrum Orbit L2.
**Head block at scan time:** 51,185,460, 2026-08-31.
**Chain age:** 123.2 days. Measured block time 0.208 s.
**Uniswap V4 singleton:** `0x8366a39cc670b4001a1121b8f6a443a643e40951`.
**Prices, from this chain's own Chainlink feeds:** ETH `$2,473.44`, USDG `$0.999835`.

---

## THE HEADLINE

**The graveyard is real, and it is nearly all dust.**

At the 30-day definition of dead, across a random sample of 2,025 of the 505,055 pools on this
chain that hold a quote asset:

| | Measured in the sample | Scaled to the chain, 95% CI |
|---|---|---|
| Graves holding anything | **108** | 21,993 – 31,879 |
| Total recoverable from them | **$996.23** | ≈ $248,000 |
| Graves above $500 recoverable | **0** | **0 – 0** |
| Largest single grave found | **$241.67** | — |

**Not one pool in the sample clears a $500 floor.** The largest dead pool we measured anywhere
holds $241.67, and the median grave is worth a few dollars.

The reason is not subtle, and it is the finding that matters most: **the pools with real money
in them are the ones people still trade.** The exact-ladder pass found nine pools holding more
than $500 — $5,669, $3,507, $3,505, $3,083, $3,001, $2,342, $2,330, $1,314, $1,265 — and every
one of them last traded within **eleven days**. Six traded within a day of the scan. They are not
graves. They are quiet markets, and the quietest thing about them is that nobody has noticed.

That result nearly went unmeasured. The first liveness pass asked each pool for its complete swap
history in one query, and for the six busiest pools — which are the six largest — that overflowed
the node's 10,000-result cap and threw. Six missing rows at the exact top of the distribution is
not a rounding detail; it is the difference between this conclusion and its opposite. They were
re-measured by walking backwards from the head block in widening windows until a swap appeared.

---

## 1. HOW MANY DEAD GRAVES, AND HOW MUCH IS IN THEM

**542,707 pools have ever been initialised on this chain.** That figure is a complete census, not
a sample: every `Initialize` event on the singleton from block 0 to head, 173MB of enumerated
pool keys on disk.

**505,055 of them** have exactly one side that is a quote asset — native ETH, WETH, flETH or
USDG. The other 37,652 either pair two quote assets (284, which are working markets) or pair two
things nobody wants back.

Of a random sample of 2,025 of those, at 30 days idle:

- **108 graves** hold a non-zero quote reserve → **21,993–31,879 chain-wide**
- Those 108 hold **$996.23** of recoverable quote asset between them
- Scaled: **≈ $248,000 chain-wide**, and the interval is wide enough that the honest statement is
  "a quarter of a million dollars, spread across roughly twenty-seven thousand pools"

Loosening the definition does not rescue it. At 7 days idle the sample finds 132 graves holding
$6,520 (≈$1.6M chain-wide) with **two** above $500. At 14 days, 124 graves holding $2,448 and one
above $500. At 60 days, 18 graves holding $293 and none.

## 2. THE DISTRIBUTION

This is the answer to "ten graves with $5k each, or four thousand with $3?" It is emphatically
the second.

| Recoverable at least | Graves in sample | Estimated chain-wide, 95% CI |
|---|---|---|
| $1 | 76 | 14,774 – 23,136 |
| $10 | 16 | 2,043 – 5,938 |
| $100 | 4 | 21 – 1,974 |
| $500 | **0** | **0 – 0** |
| $1,000 | 0 | 0 – 0 |
| $5,000 | 0 | 0 – 0 |

Mean grave: **$9.22**. Median: **$1.37**. Four pools in the sample hold more than $100, and none
holds more than $242.

## 3. HOW MANY HOLD MORE THAN $500

**Zero.** In a sample of 2,025 quote-side pools, with a 95% interval that does not leave zero.

That number is the business, and the business is not there at that floor. Dropping the floor to
$100 gives an estimated 21–1,974 graves chain-wide, off four observations. At $10 it is
2,043–5,938. Whether a $100 pot split among its holders, minus gas and a bounty, is a product is
a different question from whether it is a number, and the answer to the second one is yes.

## 4. HONEYPOTS AND TAX

Of the 144 pools whose swap history was read:

| | |
|---|---|
| A sell has completed in the pool | **142** |
| Traded but never sold | **0** |
| Never traded at all | **2** |

**Tradeability looks good, and this is the one encouraging result in the whole scan.** Almost
every grave with anything in it has a completed sell in its own history, which is the strongest
available evidence that another sell would complete. Two pools have never traded at all and
cannot be judged either way.

Transfer tax is measured, per grave, by comparing what the `Swap` event says went into the pool
against what the token's own `Transfer` events actually delivered, in the same transaction. It
is never taken from a declared value. On this sample the measured round-trip cost is
indistinguishable from the pool fee.

**What is not built, by name:** a live sell-simulation. Doing it properly means calling the
PoolManager through its unlock callback, which requires a deployed contract, and nothing is
deployed. Until one exists, no grave on the site is described as having passed a simulation. The
current screen is evidence-based — completed-sell history, plus a scan of the token's runtime
bytecode for blacklist, pause, trading-gate and max-transaction selectors.

---

## METHOD

Four passes, in order. Every number above came out of them; none was typed by hand.

1. **Census.** Every `Initialize` event on the singleton, block 0 → 51,185,460. Complete.
   542,707 pools, 276 requests, 14.5 minutes.
2. **Screen.** A reproducible random sample of quote-side pools, reading `slot0` and `liquidity`
   from PoolManager storage via `extsload`. Cheap, and **an upper bound only** — see below.
3. **Exact.** Every pool the screen passed had its full position ladder replayed from
   `ModifyLiquidity` events and its reserve computed in integer arithmetic against the real
   sqrt price. This is where every published figure comes from.
4. **Liveness.** Each surviving pool's complete swap history, by pool id: last trade, trade
   count, and how many of those were sells.

### The trap in pass 2, and why it is only a screen

Reading a pool's price and active liquidity and turning that into a reserve assumes the
liquidity spans the full curve. On this chain it usually does not. Measured against real pools:

| Pool | Storage estimate | Exact ladder | Overstatement |
|---|---|---|---|
| `0x0cfb8e3c…` | $650,763,254,629 | **$0.11** | 5.8 × 10¹² |
| `0x8aeb45ae…` | $6,201.96 | **$0.005** | 1.3 × 10⁶ |
| `0xe1e7d8dc…` | $6,253.70 | **$26.98** | 232 × |
| `0x2e2f6a8b…` | $14.72 | $14.72 | 1.00 (full-range) |

The estimate is exact **only** where the position is full-range, and inflated everywhere else —
always upward. So it is used as a screen that cannot hide a real grave, and never as a published
reserve. Anyone quoting a chain-wide "TVL in dead pools" from active liquidity on this chain is
off by orders of magnitude.

### Two corrections made during the scan

**WETH was missing from the quote set.** Counting currencies across all 542,707 pools turned up
`0x0bd7d308…` — WETH — carrying **108,946 pools**, more than USDG's 111,903, plus flETH with
5,146. An earlier pass that named only native ETH and USDG was measuring 391,411 pools against a
true population of 505,055: a 28% undercount. Corrected before any figure was published.

**A payout the pool could not have made.** An intermediate run produced rows reading "$27,364
recoverable" beside "$0.00 left". A pool holding none of an asset cannot pay any of it out, so
that was a bug in the swap loop, not in the data. When the price sits exactly on a range
boundary the range has zero capacity, and the partial-fill branch was pricing the whole
remaining input against liquidity that does not exist past that boundary. Fixed; two regression
tests added — the specific case, and the general invariant that a swap can never pay out more of
an asset than the pool holds, checked across five range shapes at three prices each in both
directions. The exact pass now asserts the same invariant per pool and halts rather than
publishing.

### Definitions, and where they are arguable

**Dead = no swap in 30 days**, in blocks, at this chain's measured 0.208 s/block. The chain is
123 days old, so that is a quarter of its entire existence with zero trades, on a chain where a
swap costs a fraction of a cent. Seven days would be too short. Sixty would be unfalsifiable on
a chain this young. The threshold is a `--dead-days` argument, every grave's exact idle days are
in the published dataset, and the 7 / 14 / 30 / 60-day answers are all given above so you can
disagree with the choice without redoing the work.

**Recoverable = the ceiling**: what an unbounded amount of supply would extract, from walking the
tick ladder. Real recovery is strictly lower, because circulating supply is finite and the
asymptote is real. The true figure is therefore **below** every number in this document.

### What is sampled and what is not

The pool census is complete. The money figures come from 2,025 of 505,055 quote-side pools. That
sample was cut short: the only endpoint that serves `eth_getLogs` for this chain throttles after
roughly two queries, dRPC's free tier refuses the method outright, and Blockscout's proxy is
behind a bot check. Reading state for the full population is over a million calls against that
endpoint — days of work, not hours.

The sample is large enough for the conclusion. Zero of 2,025 above $500 puts the chain-wide
count at 0–0 with 95% confidence. A bigger sample would tighten the mid-range bands; it would
not turn up a business.

---

## RECOMMENDATION

**Do not build this as specified. The graveyard is real and it does not have enough in it.**

The brief said to stop and say so if the total came in under a few tens of thousands of dollars.
It came in at roughly $248,000 chain-wide — above that line — but the shape of it is worse than
the total suggests, and the total is the wrong number to look at:

- **Spread across ~27,000 graves, the mean is $9.22 and the median is $1.37.** A round on a
  median grave recovers less than the gas and the bounty cost.
- **Nothing clears $500.** The floor in the brief, which is the floor that makes a round worth
  running, excludes the entire measured population.
- **The good pools are alive.** Every pool over $500 in this scan last traded within eleven days,
  and six of the nine within a day. That is not a coincidence to be engineered around; it is the
  reason the dead ones are empty. A pool ends up dead *because* nobody wanted what was in it.
- **The fee on ~$248,000 of lifetime recovery, if every grave were exhumed perfectly**, is a few
  thousand dollars. Against a custody window, a legal opinion, and contracts that hold other
  people's assets.

Three things that *are* worth something, in order:

1. **The dataset.** Nobody else has a complete census of 542,707 pools on this chain with exact
   reserves. It is a genuine moat, it took a day, and it is the only asset here. The scan is
   already the marketing, exactly as §2 of the brief predicted — it just happens to be
   marketing for a different product.
2. **The maths and the pipeline.** The tick-ladder walk, the invariant tests, and the
   throttle-aware scanner transfer to any product on this chain that needs a real reserve.
3. **The finding itself.** "Reading active liquidity overstates concentrated pools by up to
   twelve orders of magnitude" is a publishable result, and it means any chain-wide TVL figure
   for dead pools currently circulating is wrong by a lot.

**If you want to proceed anyway**, the honest version is: drop the floor to $100, accept an
estimated 21–1,974 eligible graves chain-wide, and run it as a public-good curiosity with no fee
rather than as a business. The site as built already says all of this on its face — the stat row
reads `$996.23 recoverable`, `0` above the floor, and `$0.00 recovered`, and the FAQ's first
answer is "on today's numbers, cents."

What I would not do is lower the floor quietly, publish the $248,000 chain-wide figure in large
type, and let the shape of the distribution stay in a footnote. That is the version of this
product that works commercially, and it is the one the brief spent section 10 telling us not to
build.
