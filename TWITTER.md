# TWITTER — @thegraveyardxyz

Every number in this file is a placeholder marked `{}` and must be filled from
`src/data/scan.json` at the moment of posting, not from this document. A figure that was true
last week is not a figure; it is a claim.

---

## ACCOUNT

**Handle:** `@thegraveyardxyz`
**Display name:** The Graveyard
**Link:** thegraveyard.xyz
**Location:** leave empty. The chain is named in the thesis and in the dataset, where it is
load-bearing; in a profile field it is decoration.

**Bio** (the one to use):

> Nobody kept the key. There was never a key.
>
> The salvage yard for dead liquidity pools. We measure what's left, get it out, split it.

138 characters. The first line is the thing people will quote; the second says what it is.

Alternates, if a different register is wanted:

> Every dead pool still holds something.
> The first salvage protocol for stranded liquidity. We measure it, sell it once, and split it.

> 542,707 pools read. Most of them are dead. All of them still hold something.
> Salvage for stranded liquidity.

**Launch tweet**, to go with the announcement film:

> every token that died on this chain left money in its pool.
>
> nobody can get it out alone — the LP is locked forever and no single holder owns enough supply
> to make the sale worth making.
>
> so we read all 542,707 pools and built the thing that does.
>
> waitlist is open: https://thegraveyard.xyz

**The reply, posted immediately underneath it.** This is the whole positioning and it should not
be in the main tweet, where it reads as false modesty. Underneath, it reads as receipts:

> before anyone asks how much is down there: not much.
>
> 108 graves measured, $996 between them, largest one holds $241.
>
> the pools with real money in them turned out to be the ones people still trade. we published
> that instead of the number that would have looked better.

**Avatar.** `public/brand/avatar-400.png`, and the same mark at 1024 / 512 / 200 / 96 / 48.
Three bars and a wall on the page ground — each bar a grave filled to what comes out of it, the
wall the reserve, and the gap widening down the stack because every extra unit of supply recovers
less than the last. The ink sits inside the circular crop at every size. Regenerate with
`npm run brand`.

**Header.** `public/brand/twitter-banner-1500x500.png` (and `@2x`). The lockup on the left, and
on the right twenty-two graves each filled to a different depth, every one stopping short of the
same wall — the longest by twelve pixels. The left column stops well above the bottom edge
because Twitter overlays the profile picture there, and nothing that has to be read sits in the
outer 96px, because it crops the sides on narrow screens.

**Announcement film.** `trailer/out/thegraveyard-waitlist-*.mp4`, 10 s, three crops, each
re-laid rather than letterboxed. A field of graves fills in, a wall lands, every bar is revealed
to stop short of it, the field collapses into the mark — and the last beat is the top bar
reaching for the wall on out(u) = u/(1+u) and not arriving. The taps in the score stretch on the
same curve. Poster is frame 230, deliberately before the reach begins, so the thumbnail carries
the mark at its canonical proportions.

---

## PINNED THREAD — 8 TWEETS

**1/**
> {measuredCeilingUsd} of ETH and USDG is sitting in {measuredGraves} pools on Robinhood Chain
> that nobody has traded in {deadDays} days.
>
> We enumerated all {poolsInitialised} pools ever created on the chain and read the reserves out
> of contract storage. Method and dataset: thegraveyard.xyz/scan

**2/**
> Why it's stuck, and it's not complicated.
>
> Pons, Layup, long.xyz and Ascend lock launch liquidity permanently. No withdrawal function
> exists — for the deployer or anyone else. When the token dies, the quote asset stays.
>
> That's a good design. It also builds a graveyard.

**3/**
> The only way quote asset leaves a pool is someone selling tokens into it.
>
> No individual holder owns enough supply for that to return more than dust, so nobody does. The
> position was written off months ago.
>
> What none of you can do alone, all of you can do together.

**4/**
> The maths, honestly.
>
> out(Δ) = R_q · Δ(1−f) / (R_t + Δ(1−f))
>
> That approaches the reserve. It never reaches it. There is no amount of supply that empties a
> pool — a million times the pool's own inventory still leaves a remainder.
>
> You never get it all.

**5/**
> So we refuse deposits.
>
> A fixed pot split among unlimited depositors moves value from the late to the early. Past the
> point where your marginal recovery drops below a dollar, the deposit is refused on screen with
> the reason and the tokens go back.
>
> Refused, not diluted.

**6/**
> Some of these tokens cannot be sold at all.
>
> Today we screen on evidence: has a sell ever completed in this pool, and does the token's
> bytecode carry blacklist, pause, trading-gate or max-transaction selectors.
>
> A live sell-simulation needs a deployed contract. We don't have one, so we don't claim one.

**7/**
> The ugly part, in full:
>
> You are not getting your money back. Constant-product maths means the reserve can never be
> fully drained, and by the time thousands of holders split what comes out, most people collect
> single-digit dollars.
>
> We show you your number before you deposit. The alternative was zero.

**8/**
> Nothing is deployed. No contract, no token, no sale, no allocation.
>
> What exists is the scan, and the scan is real — {poolsInitialised} pools, every reserve read
> from chain, the whole dataset downloadable.
>
> thegraveyard.xyz

---

## CONTENT BANK — 30 POSTS

### The daily grave report — 10 (the engine that runs itself)

1. `GRAVE REPORT` · biggest recoverable pool on the chain today, with address, what's left, days idle, and the explorer link. Posted at the same hour daily.
2. The pool that has been idle longest while still holding something. "Untraded for {n} days. Still holds {amount}."
3. A grave that got *smaller* since yesterday, because someone sold into it. Screenshot the before and after. Movement is news on a dead chain.
4. The full distribution as a table: how many graves in each band. The point is how few are large.
5. A pool that would be worth exhuming except its token cannot be sold, named, with the bytecode selector that flags it.
6. The pool with the most historical sells that is now completely idle. Someone traded that {n} times and then stopped.
7. Two graves that share a ticker and are different tokens. Both addresses. This chain has counterfeits; the address is the identity.
8. The median grave, not the biggest one. "Half the graveyard is worth less than this."
9. A grave whose entire quote reserve is under a dollar, posted without comment.
10. Weekly roll-up: what the scan found, what changed, what got quieter.

### Mechanism explainers — 6

11. The asymptote, drawn. One image of a filled bar that never reaches its stop, and the formula.
12. Why marginal recovery falls, with a real pool's numbers at 10%, 50% and 200% of supply.
13. Why one transaction beats twenty: path-independence in a static pool, and the test that asserts it.
14. What the cut is and why refusing a deposit is the ethical part, not the rude part.
15. How "dead" is defined mechanically, why {deadDays} days, and how to move the threshold yourself.
16. What GRAVE does: burned to open a grave. No governance, no staking, no yield, no revenue share. That is the entire specification.

### Post-exhumation results — 6, every one, including the bad ones

17. First round: the grave, the window, how many deposited, how many were refused and why.
18. What came out, what the protocol took, what the bounty cost, what each depositor got.
19. A round that returned less than the gas it cost. Posted in full, with the arithmetic.
20. A round where the pre-exhume check failed and every deposit was returned. What tripped it.
21. The distribution of payouts in a round: the biggest, the median, the smallest.
22. Cumulative: rounds run, recovered, paid out. Always with the zeros when they are zeros.

### Chain observations — 4

23. {poolsInitialised} pools in {chainAge} days. What that rate looks like plotted.
24. The launchpad hooks by pool count, with what fraction of each launchpad's pools are already dead.
25. The reserve-estimate trap: why reading active liquidity overstates a concentrated pool by orders of magnitude, with the real numbers that caught it here.
26. WETH carries more pools on this chain than USDG. A quote-set that names only ETH and USDG undercounts the chain by 28%.

### Shipped — 4

27. The dataset is downloadable. Here is the schema and what every field means.
28. The scan now covers {n} pools with exact ladders instead of {m}. What that changed.
29. A bug we shipped and caught: a row read "$27,364 recoverable" beside "$0.00 left". Here is the cause and the regression test.
30. The archive page, empty. Built now, on purpose, because a results page that appears after the first good result is worth nothing.

---

## VOICE

Deadpan, numerate, unsentimental, quietly on the reader's side. The joke is that the most useful
product on this chain is an undertaker, and it is never said out loud.

- Lead with the number. The sentence explains the number, not the other way round.
- Publish the method with the figure, every time, or link it.
- Never hype. No "gm". No token price chart. No countdown.
- **Never mock someone for holding dead bags.** Everyone reading this has them. The joke is with
  them, never at them.
- Never overstate a recovery. Never use reclaim, recover your losses, restore, or made whole.
- Short sentences. A paragraph is two of them.
- When something is zero, say zero.

## HARD RULES

1. No fabricated recovery, ever. If no round has run, the number is `$0.00`.
2. Always publish the method, or a link to it, alongside a figure.
3. Never tag Robinhood or Vlad Tenev. Never imply an affiliation with either.
4. Never imply restoration of losses.
5. Never post a projected recovery. Only the measured, current, on-chain number.
6. Every grave is named by contract address. Never by symbol alone — this chain has counterfeits.
7. If a Stock Token is involved, the US/Canada/UK restriction is stated in the same post.
8. Post the bad rounds. A feed of only good results is an advertisement, and this account's
   entire value is that it is not one.
