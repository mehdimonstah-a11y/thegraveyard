/**
 * JSON-RPC transport for Robinhood Chain, shared by every scan script.
 *
 * The public endpoint is the only one that serves `eth_getLogs` for this chain
 * — dRPC's free tier refuses the method outright and the Blockscout proxy sits
 * behind a bot check — and it throttles after roughly two queries in quick
 * succession, clearing again within a couple of seconds. That single fact
 * shapes everything here:
 *
 *  - Throttling is waited out, never returned. A 429 that leaked through as an
 *    empty result would silently shorten a log range, and a shortened range
 *    reads as "this pool is dead" when the truth is "we did not look".
 *  - Only the node's explicit result-cap error shrinks a window. Throttling and
 *    transport faults retry the *same* window, because bisecting on a 429 just
 *    multiplies the load that caused it.
 *  - Windows are as wide as the 10,000-result cap allows. The census is 51.2M
 *    blocks; at 400k blocks a query that is 128 queries, and at 10k it is 5,117.
 *    Width, not rate, is what makes a chain-wide scan finish.
 */

export const RPC = process.env.RH_RPC_URL || "https://rpc.mainnet.chain.robinhood.com";
export const POOL_MANAGER = "0x8366a39cc670b4001a1121b8f6a443a643e40951";
export const USDG = "0x5fc5360d0400a0fd4f2af552add042d716f1d168";
/** Uniswap V4 represents native ETH as the zero address. */
export const NATIVE = "0x0000000000000000000000000000000000000000";
/**
 * The other two assets pools on this chain are quoted in. Both were found by
 * counting currencies across all 542,707 initialised pools and then asking each
 * contract what it is — `symbol()`, `name()`, `decimals()`, `totalSupply()` —
 * rather than by assuming a well-known address.
 *
 * WETH carries 108,946 pools, more than USDG's 111,903, and leaving it out of
 * an earlier pass understated the population by 28%. flETH is Flaunch's
 * ETH-backed wrapper and carries 5,146. Both are priced off the ETH feed; that
 * is an assumption about their redemption and it is recorded per row rather
 * than buried here.
 */
export const WETH = "0x0bd7d308f8e1639fab988df18a8011f41eacad73";
export const FLETH = "0x00000000043c1117dafa3a3d0c7148eb48b30130";

export const TOPIC = {
  initialize: "0xdd466e674ea557f56295e2d0218a125ea4b4f0f6f3307b95f85e6110838d6438",
  swap: "0x40e9cecb9f5f1f1c5b9c97dec2917b7ee92e57ba5563708daca94dd84ad7112f",
  modifyLiquidity: "0xf208f4912782fd25c7f114ca3723a2d5dd6f3bcc3ac8db5af63baa85f711d5ec",
  transfer: "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
};

export const SEL = {
  symbol: "0x95d89b41",
  name: "0x06fdde03",
  decimals: "0x313ce567",
  totalSupply: "0x18160ddd",
  balanceOf: "0x70a08231",
  extsload: "0x1e2eaeaf",
  uiMultiplier: "0x1b64c05a",
  latestRoundData: "0xfeaf968c",
  description: "0x7284e416",
};

let rpcCalls = 0;
let httpRequests = 0;
let lastCallAt = 0;
export const stats = () => ({ rpcCalls, httpRequests });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const MIN_GAP_MS = Number(process.env.RH_MIN_GAP_MS || 900);
/** The endpoint 429s a JSON-RPC batch above roughly a hundred calls, whatever
 *  the batch costs it to answer. Measured, not guessed. */
export const BATCH_MAX = Number(process.env.RH_BATCH_MAX || 50);
const MAX_ATTEMPTS = Number(process.env.RH_MAX_ATTEMPTS || 12);

export const hex = (n) => "0x" + n.toString(16);
export const isErr = (v) => v && typeof v === "object" && "ERR" in v;

/**
 * Signals that mean "this query was too expensive" rather than "you are asking
 * too often". Both are fixed by narrowing the window, and only these shrink it.
 *
 * The node has two of them and they are not interchangeable with throttling:
 * `exceeds limit of 10000` is a result-count cap, and `log query timed out` is
 * a server-side execution budget that Swap and ModifyLiquidity filters hit long
 * before Initialize does.
 */
export function isOverflow(msg) {
  return /exceeds limit of|too many results|response size|query returned more|limit exceeded|log query timed out/i.test(String(msg));
}

/** Transport weather: throttling, upstream drops, timeouts. Wait, then ask again. */
export function isTransient(err) {
  if (!err) return false;
  const msg = String(err.message ?? err);
  if (isOverflow(msg)) return false;
  if (err.code === 429 || err.code === -32000) return true;
  return /too many requests|rate limit|connection refused|dial tcp|EOF|timeout|timed out|bad gateway|service unavailable|upstream|reset by peer|fetch failed/i.test(msg);
}

const backoff = (attempt) => Math.min(20_000, 900 * 1.7 ** attempt);

export async function rpc(method, params = []) {
  rpcCalls++;
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const wait = lastCallAt + MIN_GAP_MS - Date.now();
    if (wait > 0) await sleep(wait);
    lastCallAt = Date.now();
    httpRequests++;

    try {
      const res = await fetch(RPC, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ jsonrpc: "2.0", id: rpcCalls, method, params }),
        signal: AbortSignal.timeout(120_000),
      });
      if (res.status === 429 || res.status >= 500) { await sleep(backoff(attempt)); continue; }
      const json = await res.json();
      if (json.error) {
        if (isTransient(json.error)) { await sleep(backoff(attempt)); continue; }
        return { ERR: json.error };
      }
      return json.result;
    } catch (err) {
      if (attempt === MAX_ATTEMPTS - 1) return { ERR: String(err).slice(0, 160) };
      await sleep(backoff(attempt));
    }
  }
  return { ERR: { code: 429, message: "exhausted retries (throttled)" } };
}

/**
 * Batched JSON-RPC: many calls, one HTTP request, one unit of the rate limit.
 * This is the only way a per-pool read over a six-figure pool census finishes.
 */
export async function rpcBatch(calls, { chunk = BATCH_MAX } = {}) {
  chunk = Math.min(chunk, BATCH_MAX);
  const out = [];
  for (let i = 0; i < calls.length; i += chunk) {
    const slice = calls.slice(i, i + chunk);
    const body = slice.map((c, j) => ({ jsonrpc: "2.0", id: j, method: c.method, params: c.params }));
    rpcCalls += slice.length;

    let got = null;
    for (let attempt = 0; attempt < MAX_ATTEMPTS && got === null; attempt++) {
      const wait = lastCallAt + MIN_GAP_MS - Date.now();
      if (wait > 0) await sleep(wait);
      lastCallAt = Date.now();
      httpRequests++;
      try {
        const res = await fetch(RPC, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(body),
          signal: AbortSignal.timeout(120_000),
        });
        if (res.status === 429 || res.status >= 500) { await sleep(backoff(attempt)); continue; }
        const json = await res.json();
        if (!Array.isArray(json)) {
          if (json?.error && !isTransient(json.error)) { got = slice.map(() => ({ ERR: json.error })); break; }
          await sleep(backoff(attempt));
          continue;
        }
        got = null;
        const byId = new Map(json.map((r) => [r.id, r]));
        const mapped = slice.map((_c, j) => {
          const r = byId.get(j);
          return !r ? { ERR: "missing" } : r.error ? { ERR: r.error } : r.result;
        });
        // A whole-batch throttle shows up as every entry erroring transiently.
        const allTransient = mapped.every((m) => isErr(m) && isTransient(m.ERR));
        if (allTransient && attempt < MAX_ATTEMPTS - 1) { await sleep(backoff(attempt)); continue; }
        got = mapped;
      } catch {
        await sleep(backoff(attempt));
      }
    }
    out.push(...(got ?? slice.map(() => ({ ERR: "batch failed" }))));
  }
  return out;
}

/**
 * Walk a block range in windows sized by the result cap.
 *
 * `onPage` is awaited for every page so callers can checkpoint: a 51M-block
 * census that dies at block 40M should resume, not restart.
 */
export async function walkLogs(filter, from, to, opts = {}) {
  const { start = 400_000, min = 500, max = 800_000, target = 7_000, onPage, onStall } = opts;
  let step = Math.min(start, max);
  let cursor = from;
  let stalls = 0;
  const all = [];

  while (cursor <= to) {
    const end = Math.min(to, cursor + step - 1);
    const r = await rpc("eth_getLogs", [{ ...filter, fromBlock: hex(cursor), toBlock: hex(end) }]);

    if (!Array.isArray(r)) {
      const msg = isErr(r) ? JSON.stringify(r.ERR) : "unknown";
      // Too expensive: narrow the window and ask again.
      if (isOverflow(msg)) {
        if (step <= min) throw new Error(`walkLogs irreducible at [${cursor},${end}]: ${msg}`);
        step = Math.max(min, Math.floor(step / 2));
        continue;
      }
      // Asking too often. rpc() has already backed off through its own ladder,
      // so this is a longer cooldown, not a reason to abandon a census that is
      // hours into a 51M-block walk. Wait it out and narrow, in case the
      // window is part of why the endpoint is unhappy.
      stalls++;
      if (stalls > 200) throw new Error(`walkLogs gave up at [${cursor},${end}] after ${stalls} stalls: ${msg}`);
      if (onStall) onStall({ from: cursor, to: end, stalls, msg });
      await new Promise((r2) => setTimeout(r2, Math.min(180_000, 20_000 * Math.min(6, stalls))));
      step = Math.max(min, Math.floor(step / 2));
      continue;
    }
    stalls = 0;

    all.push(...r);
    if (onPage) await onPage({ from: cursor, to: end, logs: r, total: all.length });
    cursor = end + 1;

    if (r.length < target * 0.45) step = Math.min(max, Math.floor(step * 1.6));
    else if (r.length > target) step = Math.max(min, Math.floor(step * 0.6));
  }
  return all;
}

/** ABI-decode a `string` return. Returns null rather than guessing. */
export function decodeString(raw) {
  if (typeof raw !== "string" || raw.length < 130) return null;
  const d = raw.slice(2);
  try {
    const len = parseInt(d.slice(64, 128), 16);
    if (!Number.isFinite(len) || len === 0 || len > 512) return null;
    let out = "";
    for (let i = 0; i < len; i++) {
      const c = parseInt(d.slice(128 + i * 2, 130 + i * 2), 16);
      if (c) out += String.fromCharCode(c);
    }
    return out.replace(/[^\x20-\x7e]/g, "").trim();
  } catch {
    return null;
  }
}

export function decodeUint(raw) {
  if (typeof raw !== "string" || !/^0x[0-9a-fA-F]*$/.test(raw) || raw === "0x") return null;
  try { return BigInt(raw); } catch { return null; }
}

export const call = (to, data) => ({ method: "eth_call", params: [{ to, data }, "latest"] });
export const pad32 = (addr) => addr.toLowerCase().replace(/^0x/, "").padStart(64, "0");

/**
 * A single log query for one filter, with the same patience as everything else
 * here. Used when the filter is already narrow — a topic-1 pool id, say — so
 * there is nothing to walk and nothing to shrink.
 */
export async function getLogs(filter) {
  const r = await rpc("eth_getLogs", [filter]);
  if (Array.isArray(r)) return r;
  throw new Error(`getLogs failed: ${isErr(r) ? JSON.stringify(r.ERR) : "unknown"}`);
}
