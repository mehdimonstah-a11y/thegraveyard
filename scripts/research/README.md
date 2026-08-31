# research

Throwaway probes, kept because they are the evidence for decisions in
`DECISIONS.md` rather than assertions in it.

| File | Question it answered | Where the answer landed |
|---|---|---|
| `probe.mjs` | chain age, block time, pool count, does the `extsload` slot layout hold? | 123 days, 0.208 s/block, PoolManager `_pools` at slot 6 |
| `endpoints.mjs` | does the canonical RPC sustain a census? | ~2 log queries then a throttle, recovers in ~1s |
| `endpoints2.mjs` | do dRPC, thirdweb or Ankr carry chain 4663? | dRPC answers but refuses `eth_getLogs`; the others do not carry the chain |
| `endpoints3.mjs` | is dRPC usable at any window size? | no, at any size — D2 |
| `endpoints4.mjs` | how wide a log window will the node serve? | 800k blocks for Initialize; width, not rate, is what makes the census finish |
| `timing.mjs`, `timing2.mjs` | swap and liquidity log density, and single-pool full-range queries | Swap and ModifyLiquidity filters hit a server-side query timeout long before Initialize does |

Nothing here runs in CI and nothing here produces a published figure.
