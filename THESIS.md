# The $GRAVE Thesis

Every token that dies on this chain leaves money behind, and the money is stuck for a reason
nobody chose.

Pons, Layup, long.xyz and Ascend all lock launch liquidity permanently, with no withdrawal
function. That is a good design. It is the single feature that stops a deployer from pulling the
pool out from under everyone, and it is why launching on this chain feels safer than it did
anywhere else three years ago.

It also means that when the token stops trading, the ETH and USDG sitting in its pool stay there.
Forever. Not in escrow, not in a treasury, not somewhere a team can decide to return it. In a
pool, priced against a token nobody wants, waiting for a sale that no individual holder has
enough supply to make worth their time.

There are **542,707** such pools on this chain. We read every one of them.

**The Graveyard is the salvage operation.** It aggregates the supply that nobody can use alone,
sells it in one transaction, and splits what comes out.

And before anything else, here is the part every other project would put in a footnote: **there
is far less down there than you would hope.** We will get to the exact number in section 3, and
it is the reason this document exists in this form.

---

## 1. The census

We enumerated every Uniswap V4 pool ever initialised on this chain, from the first block to
51,185,460, by reading `Initialize` events off the singleton at
`0x8366a39cc670b4001a1121b8f6a443a643e40951`.

Not a sample. Not an index provider's list. Every pool.

| | |
|---|---|
| Pools ever initialised | **542,707** |
| Pools with a quote asset on one side | **505,055** |
| Quote assets found | native ETH, WETH, flETH, USDG |
| Chain age at scan | 123.2 days, 0.208 s/block |

Nobody else has this dataset, and it took a day. The scan is the product's foundation and, as it
turns out, its most valuable output.

## 2. Why the naive number is a lie

The obvious way to value a pool is to read its price and its active liquidity from contract
storage and multiply. It is one call, it is fast, and on this chain it is wrong by up to twelve
orders of magnitude.

That method assumes the liquidity spans the whole price curve. Most of it does not. Measured
against real pools:

| Pool | The cheap estimate | The exact ladder | Overstated by |
|---|---|---|---|
| `0x0cfb8e3c…` | $650,763,254,629 | **$0.11** | 5.8 × 10¹² |
| `0x8aeb45ae…` | $6,201.96 | **$0.005** | 1.3 × 10⁶ |
| `0xe1e7d8dc…` | $6,253.70 | **$26.98** | 232 × |
| `0x2e2f6a8b…` | $14.72 | $14.72 | 1.00 (full-range) |

It is exact only where the position spans the full curve, and inflated everywhere else — always
upward, never down.

So The Graveyard never publishes it. Every reserve on this site is computed by replaying the
pool's actual position ladder out of `ModifyLiquidity` events and walking it in exact integer
arithmetic. The cheap estimate is used only as a screen, because a screen that always overstates
can never hide a real grave.

**If you see a chain-wide "value locked in dead pools" figure for this chain anywhere else, it is
almost certainly that first column.**

## 3. What is actually down there

At the definition of dead we publish — no swap in 30 days, measured in blocks at this chain's own
rate — across a random sample of 2,025 of the 505,055 quote-side pools:

| | Measured | Scaled to the chain, 95% CI |
|---|---|---|
| Graves holding anything | **108** | 21,993 – 31,879 |
| Total recoverable from them | **$996.23** | ≈ $248,000 |
| **Graves above $500 recoverable** | **0** | **0 – 0** |
| Largest single grave found | **$241.67** | — |

Mean grave: **$9.22**. Median: **$1.37**.

Not one pool in the sample clears a $500 floor. The largest dead pool we measured anywhere on
this chain holds two hundred and forty-one dollars.

**And here is the finding that matters most: the pools with real money in them are the ones people
still trade.** The exact-ladder pass found nine pools holding more than $500 — $5,669, $3,507,
$3,505, $3,083, $3,001, $2,342, $2,330, $1,314, $1,265. Every one of them last traded within
eleven days. Six of them within a day.

They are not graves. They are quiet markets. A pool ends up dead *because* nobody wanted what was
in it.

That is the honest shape of this opportunity, published first rather than last, because a
salvage yard that opens by telling you how much treasure is buried is not a salvage yard.

## 4. The maths, and why you never get it all

For a pool with reserves `(R_t, R_q)` and fee `f`, selling `Δ` tokens returns:

```
out(Δ) = R_q × Δ(1−f) / (R_t + Δ(1−f))
```

Three properties follow, and all three shape the product rather than sitting in a footnote.

**It is asymptotic.** `out(Δ)` approaches `R_q` as `Δ` grows without bound, and reaches it at no
finite amount of supply. A million times the pool's own inventory still leaves a remainder. You
can never recover the full reserve, and that gap is drawn on every row of the scan and in the
logo.

**Marginal recovery falls fast.** The first tenth of supply recovers far more per token than the
last. Every additional depositor raises the total recovered and lowers the payout per token for
everyone already in. The interface shows your number going down as others join, live, before you
deposit.

**Execution is path-independent.** In a static pool with no other traders — which is the
definition of a dead pool — selling in one transaction and selling in twenty slices return the
same amount, minus more gas. Our test suite asserts the two agree to within 0.1%.

That last one is why there is no execution engine here. A TWAP on a dead pool is a moving graphic
that costs depositors money, and building one would be theatre.

## 5. An exhumation

One round per grave. A dead pool does not refill, so there is no second chance and the size of
the round decides everyone's payout.

**Open.** Anyone burns `$GRAVE` to nominate a dead pool. Supply falls permanently every time.
The grave must clear a passing tradeability check, a measured tax below the recovery, and a
published minimum reserve.

**Gather.** A fixed 72-hour window. Holders bring their bags in. The interface shows the total
deposited, the total recoverable at the current level, and your payout at the current level. The
third number goes down as others join, and it is shown going down.

**Cut.** Deposits beyond the point where marginal recovery per token falls below the dust
threshold are **refused**, not accepted and diluted. Late depositors get their tokens back rather
than a rounding error.

**Exhume.** One transaction, permissionless once the window closes, paying a bounty from the
proceeds so nobody has to be trusted to be awake. The tradeability check runs again immediately
beforehand; a failure returns every deposit.

**Split.** Proceeds distributed pro rata, minus the protocol fee and the bounty. Claimable
forever, no deadline, no unclaimed-funds sweep. Rounding favours the depositor, always.

## 6. Refusing deposits is the whole ethic

A fixed pot split among unlimited depositors transfers value from the late arrivals to the early
ones. There is no version of that which is fair, and every protocol that accepts unlimited
deposits into a bounded recovery is doing it whether or not it says so.

So past the cut, the deposit is refused on screen, with the reason printed, and the tokens go
home. Not accepted at a worse rate. Not queued for the next round. Refused.

This is the one mechanism in the product that costs us money and we are not negotiating on it.

## 7. Honeypots, and what we can and cannot check

Some of these tokens cannot be sold at all. A grave that accepts deposits and then blocks the
sale has trapped everyone in it.

**What is measured today.** Every pool's own complete swap history: whether a sell has ever
completed in it, how many, and when. Of the 144 pools we read histories for, **142** have a
completed sell, 2 have never traded at all, and none has traded without ever selling. That is the
strongest evidence available that another sell would complete.

**Transfer tax is measured, never declared.** We compare what the `Swap` event says went into the
pool against what the token's own `Transfer` events actually delivered, in the same transaction.
A token that claims 0% and takes 8% is caught by arithmetic, not by trust.

**What is not built, by name.** A live sell-simulation. Doing it properly means calling the
PoolManager through its unlock callback, and that needs a deployed contract. Nothing is deployed.
Until one exists, no grave on this site will ever be described as having passed a simulation —
the word "screened" is used, and it means what it says.

## 8. Counterfeits, and why every grave is an address

Fake NVDA and TSLA tokens trade on this chain right now, some copying the naming of the real ones
exactly. Two unrelated tokens can share a ticker, and one of them may be the one with money in
its pool.

So a grave is keyed by contract address everywhere in this system — in the dataset, in the table,
in the URL, in the marquee. The symbol is a label. The address is the identity, and it is always
on screen.

## 9. Splits do not break a reserve

Robinhood's stock tokens handle splits and dividends through an on-chain multiplier under
ERC-8056 rather than by minting. Raw balance stays fixed; `uiMultiplier()` gives the effective
ratio.

Every valuation applies it. It currently reads 1.0 for almost everything, and a system that
hardcodes that will one day report that half a grave evaporated overnight. This one reads it.

## 10. The honest limits

This is the part most projects leave out.

**The graveyard is nearly all dust.** Section 3 is not a teaser. Mean $9.22, median $1.37, zero
above $500. Any version of this product that leads with the $248,000 chain-wide figure in large
type and puts the distribution in a footnote is selling you something.

**The chain-wide totals are sampled.** The pool census is complete — every `Initialize` event
ever. The money figures come from 2,025 of 505,055 pools, because the only endpoint that serves
logs for this chain throttles after roughly two queries and a full read is over a million calls.
Every extrapolation on this site carries a 95% interval, and none of them appears in display type.

**"Recoverable" is a ceiling.** It is what an unbounded amount of supply would extract. Real
recovery is strictly lower, because circulating supply is finite and the asymptote is real. Every
number in this document is an upper bound on what actually comes out.

**Dead is a choice.** Thirty days is a quarter of this chain's entire existence with zero trades,
on a chain where a swap costs a fraction of a cent. It is still a threshold somebody picked. The
dataset carries every grave's exact idle days so you can move it and disagree.

**We had a bug and it changed an answer.** An intermediate run produced rows reading "$27,364
recoverable" beside "$0.00 left". A pool holding none of an asset cannot pay any of it out. The
swap loop was pricing input against liquidity that does not exist past a range boundary. Fixed,
with two regression tests and a per-pool invariant that halts the run rather than publishing.
Separately, a liveness pass silently dropped the six largest pools because their histories
overflowed the node's log cap — six missing rows at the exact top of the distribution, which is
the difference between this conclusion and its opposite. Both are written up in `RECOVERY.md`
rather than quietly corrected.

**And nothing is deployed.** No contract, no `$GRAVE` token, no exhumation has ever run. The scan
is real and dated. Everything about depositing is described, not offered.

## 11. What $GRAVE does

Burned to open a grave. Supply falls permanently every time someone nominates a dead pool for
recovery.

That is the entire specification. No governance. No staking. No yield. No access tier. No revenue
share, and no value-accrual language anywhere on this site — the moment a token is described as
capturing value it becomes a different kind of instrument, and this is not one.

It is not presented as an investment, carries no promise of profit, and has no claim on anything
The Graveyard earns. It does not exist yet and there is no sale planned.

## 12. The Graveyard never takes custody it does not need

Deposits sit in a per-grave contract with no admin path, an automatic return on failure, and the
shortest viable window. There is no key that can move a grave's deposits somewhere else. You
connect your own wallet and you sign your own transactions.

The custody window is real and it is the part a lawyer gets to look at before anything touches
mainnet. That milestone is written into `DECISIONS.md`, not implied.

## 13. What this is not

The Graveyard extracts a fraction of the quote asset stranded in a dead pool. That is the whole
claim, and it is narrower than it sounds.

What you paid for the token is unrelated to what the pool holds today. They are different numbers
and only the second one exists. Anyone who blurs them is selling you a story about being made
whole, and there is a list of words this project will never use, in any form or tense, with a
test in CI that fails the build if one appears. That test caught a heading in this very
document while it was being written, which is the only reason it is worth having.

## 14. The loop

Someone burns `$GRAVE` → a grave opens → holders bring their bags in → the preview shows each of
them their number falling → the cut refuses the deposits that would be dust → one transaction
empties what can be emptied → the split pays out pro rata → the round appears in the archive,
good or bad → someone reads the archive and opens the next one.

No committee approves a grave. No operator edits a round. No deposit is accepted into a pot it
cannot be paid out of.

## 15. The thesis in one paragraph

The Graveyard is a salvage protocol for dead liquidity pools. Launch liquidity on this chain is
locked forever with no withdrawal function, so when a token dies the quote asset in its pool is
stranded — and the only exit is a sale no individual holder owns enough supply to make worth
making. It aggregates that supply, sells once, and splits the proceeds, refusing any deposit past
the point where the marginal recovery becomes dust. It exists because 542,707 pools have been
created on this chain and tens of thousands of them are already dead. It is being published with
the discouraging version of its own numbers on the front page — mean grave $9.22, median $1.37,
nothing above $500 — because the alternative was a beautiful salvage yard with a made-up figure
on the sign, and the measurement is the only thing here worth anyone's trust.

## 16. Closing

Everyone reading this has a position they stopped looking at.

It is still there. There is still something in it. It is less than you want, and it is more than
zero, and nobody was ever going to go and get it.

The waitlist is open.

**thegraveyard.xyz**
