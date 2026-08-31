# DECISIONS

Every judgment call, with the reason. Newest at the bottom.

---

### D1 — The scan is built from event logs, not from contract storage

**Call:** reconstruct every pool's price and liquidity from `Initialize`, `ModifyLiquidity` and
`Swap` events rather than reading `extsload` per pool.

**Why:** there are several hundred thousand pools on this chain. Reading two storage slots each
is over half a million `eth_call`s against an endpoint that throttles after roughly two requests
in quick succession. The event stream carries the same information — every position ever
opened, every one ever closed, and the post-swap price on every trade — and one log query covers
up to 800,000 blocks of it. The whole census costs a few hundred requests instead of a few
hundred thousand.

**The cost, stated:** a reconstruction can be wrong in ways a direct read cannot. Mitigation is
a spot-check stage that reads `extsload` for a random sample of graves and compares price and
active liquidity against the reconstruction. If the sample disagrees, the reconstruction is
wrong and the published figures are withdrawn, not adjusted.

### D2 — dRPC and Blockscout are not usable, so pacing is the design

**Call:** the scan runs against `rpc.mainnet.chain.robinhood.com` alone, at roughly one request
per second, with wide windows.

**Why:** measured, not assumed. dRPC's free tier answers `eth_chainId` for chain 4663 but
refuses `eth_getLogs` outright. The Blockscout JSON-RPC proxy sits behind a bot check and
returns 403. Ankr does not carry the chain. The canonical endpoint serves a 400,000-block log
window in about a second and then throttles for a second or two; it recovers reliably.

**Consequence for the product:** the marketing site cannot scan the chain on page load, which
the build brief already anticipated in §5.5. The scan is a pipeline that writes a dataset; the
site reads the dataset and re-reads a handful of individual pools live. Which numbers are live
and which are from the last scan will be stated on the page, per figure.

### D3 — "Dead" is defined mechanically, and the number is arguable

**Call:** a pool is a grave when it has had **no swap in 30 days**, measured in blocks at the
chain's own measured rate of 0.208 s/block.

**Why 30:** the chain is 123 days old. Seven days is too short — plenty of small tokens trade
weekly. Sixty days would classify only a quarter of the chain's life as "abandoned" and would
be unfalsifiable on a chain this young. Thirty days is a quarter of the chain's entire
existence with zero trades, on a chain where a swap costs a fraction of a cent, and there is no
plausible reading of that other than abandonment.

**It is still a choice, and it is exposed.** The scan runs at any threshold via `--dead-days`,
the published dataset carries every pool's exact days-idle, and the site lets a reader move the
threshold and watch the total change. A definition you can move is more honest than a
definition you have to trust.

### D4 — The maths is a real tick-ladder walk, not the closed form

**Call:** implement the full Uniswap V4 concentrated-liquidity swap in exact integer arithmetic
and use it for every recoverable figure, rather than the constant-product formula in §3.2 of the
build brief.

**Why:** the closed form is exactly right for a pool whose liquidity is one full-range position,
which is what a locked-LP launchpad deploys — and it is wrong for a pool with several ranges,
in the direction that **overstates** a recovery. Overstating a recovery is the one error this
product cannot make. `scripts/v4math.test.mjs` proves the ladder walk agrees with the closed
form to within 0.02% on a full-range pool, and separately proves the three properties the brief
says must shape the product: the recovery is asymptotic, marginal recovery falls, and execution
is path-independent — one sale and twenty slices return the same amount to within 0.1%.

That last test is the reason there is no execution engine in this product. It is not an opinion,
it is an assertion in the test suite.

### D5 — Native ETH and USDG are the quote assets; everything else is skipped

**Call:** a pool is only a candidate grave if exactly one side is native ETH or USDG.

**Why:** those are the two assets on this chain with a Chainlink feed, a real market, and a
plausible claim to being what someone wants back. A pool pairing two dead memecoins may contain
"value" in a spreadsheet sense but there is nothing to split at the end of it. Pools where both
sides are quote assets (ETH/USDG) are excluded too — they are working markets, not graves.

**Cost:** any quote asset we have not enumerated is invisible to the scan. The dataset publishes
the currency frequency table so anyone can see what was excluded and argue with it.

### D6 — Prices come from the chain's own oracles, and USDG is not assumed to be a dollar

**Call:** ETH/USD and USDG/USD are read from the Chainlink aggregators deployed on Robinhood
Chain. If either read fails, no dataset is written.

**Why:** a graveyard total denominated in a hardcoded ETH price is a fabricated number, and this
product's entire claim is that its numbers are not fabricated. At the time of writing the feeds
read $2,473.44 and $0.999835. The second figure is why USDG is not treated as $1.00: it is close
to a dollar, it is not a dollar, and the difference across a six-figure total is real money.

### D7 — The live sell-simulation is Phase 1, and the site will say so

**Call:** Phase 0 ships a *screen*, not a simulation: a grave is flagged as untradeable if its
pool has no evidence of a completed sell in its own swap history, or if its token's runtime
bytecode carries the dispatch selectors of a blacklist, pause, or max-transaction mechanism.
Transfer tax is measured by comparing the `Swap` event's reported amount against the `Transfer`
events in the same transaction — the pool's own trade history, never a declared value.

**Why not the real thing:** a true sell-simulation requires calling the PoolManager through the
unlock callback, which requires a deployed helper contract. There is no contract deployed and
the launch posture in §1 of the build brief says there will not be one before launch.

**How it is handled:** named as not built, in the §0.5 sense. The docs page will list what the
scan measures, what it screens, and what it cannot yet check, by name. No grave will ever be
described as having "passed a sell-simulation" until one has actually run.

### D8 — One word added to the locked vocabulary

**Call:** the part of a pool's reserve that constant-product maths will never surrender is
called **the shortfall**.

**Why:** the signature element in `DIVERGENCE.md` draws it, the homepage has to name it, and
the locked vocabulary in §1 of the build brief has no word for it. "The remainder" is too soft
and "the asymptote" is the mechanism rather than the thing. **Awaiting confirmation** — it is
one constant and one CSS token if you want a different word.

### D9 — The palette risks the banned direction, and is locked colder because of it

**Call:** ground `#E3E4DF`, ink `#191A17`, one brass and one oxide accent.

**Why it is a risk:** the build brief bans "cream + serif + terracotta". A pale paper ground with
a warm brass and a red-brown oxide is one drift away from that. The mitigations are structural
rather than hopeful: the ground is a cold grey-green and not a cream, there is no serif anywhere
in the type system, the oxide is a stamp restricted to a single meaning and never a field, and
the brass only ever appears on a recoverable amount. If a build screenshot reads warm, the
ground goes to `#E0E2DE` and the brass loses saturation. Flagged as live rather than solved.

**Sibling collision:** Containur, in this repo, derived its surface from shipping-container
paint and also uses an oxide red. The values differ and the meanings differ — Containur's is
structural, ours only ever means *refused* — but if a side-by-side reads as the same template,
the fix is structural, not chromatic: the Scan becomes a two-pane layout with a fixed grave list
and a detail pane, which no sibling has.

### D10 — The headline number is the smaller one

**Call:** the giant figure at the top of the homepage is the total recoverable from graves
**above the floor**, not the chain-wide total. The chain-wide total is printed underneath it in
`--zinc` at 13px, with one sentence explaining the gap.

**Why:** a chain-wide total that includes forty thousand pools holding three dollars each is
technically true and practically a misrepresentation, because nobody can extract three dollars
profitably and every one of those pools would fail at the cut anyway. The number that flatters
this product is the bigger one. It is not the one in 132px type.

### D11 — Counsel before mainnet

**Milestone, per §10.6 of the build brief:** the custody window and the protocol fee get a legal
opinion before any contract is deployed to mainnet. The two questions are (a) whether holding
depositors' tokens for the duration of a gather window constitutes custody in the jurisdictions
we accept, and (b) whether taking a fee on the proceeds of trades executed on others' behalf is
a regulated activity. Neither is answerable from inside this repository. Not started; blocking
mainnet, not blocking the waitlist.
