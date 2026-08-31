/**
 * Uniswap V4 concentrated-liquidity maths, in exact integer arithmetic.
 *
 * The build brief states the constant-product form of the recovery:
 *
 *     out(D) = Rq * D(1-f) / (Rt + D(1-f))
 *
 * That formula is correct for a pool whose entire liquidity sits in one
 * full-range position, which is what a locked-LP launchpad deploys. It is NOT
 * correct for a pool with several ranges, and using it there would overstate a
 * recovery — the exact error the brief spends section 10 telling us not to make.
 *
 * So this file does the real thing: it walks the tick ladder, range by range,
 * consuming liquidity as the price moves, and returns what a sell would
 * actually pay out. For a single full-range position it reduces to the formula
 * above, which is asserted in the tests.
 *
 * Everything is BigInt. No floating point touches a reserve or a payout.
 */

export const Q96 = 2n ** 96n;
export const MIN_TICK = -887272;
export const MAX_TICK = 887272;
export const MIN_SQRT_RATIO = 4295128739n;
export const MAX_SQRT_RATIO = 1461446703485210103287273052203988822378723970342n;

/** Uniswap's TickMath.getSqrtRatioAtTick, transcribed as integer ops. */
export function tickToSqrtPriceX96(tick) {
  const t = Math.trunc(tick);
  if (t < MIN_TICK || t > MAX_TICK) throw new RangeError(`tick ${t} out of range`);
  const abs = BigInt(Math.abs(t));

  let ratio = (abs & 0x1n) !== 0n
    ? 0xfffcb933bd6fad37aa2d162d1a594001n
    : 0x100000000000000000000000000000000n;

  const m = (bit, k) => { if ((abs & bit) !== 0n) ratio = (ratio * k) >> 128n; };
  m(0x2n, 0xfff97272373d413259a46990580e213an);
  m(0x4n, 0xfff2e50f5f656932ef12357cf3c7fdccn);
  m(0x8n, 0xffe5caca7e10e4e61c3624eaa0941cd0n);
  m(0x10n, 0xffcb9843d60f6159c9db58835c926644n);
  m(0x20n, 0xff973b41fa98c081472e6896dfb254c0n);
  m(0x40n, 0xff2ea16466c96a3843ec78b326b52861n);
  m(0x80n, 0xfe5dee046a99a2a811c461f1969c3053n);
  m(0x100n, 0xfcbe86c7900a88aedcffc83b479aa3a4n);
  m(0x200n, 0xf987a7253ac413176f2b074cf7815e54n);
  m(0x400n, 0xf3392b0822b70005940c7a398e4b70f3n);
  m(0x800n, 0xe7159475a2c29b7443b29c7fa6e889d9n);
  m(0x1000n, 0xd097f3bdfd2022b8845ad8f792aa5825n);
  m(0x2000n, 0xa9f746462d870fdf8a65dc1f90e061e5n);
  m(0x4000n, 0x70d869a156d2a1b890bb3df62baf32f7n);
  m(0x8000n, 0x31be135f97d08fd981231505542fcfa6n);
  m(0x10000n, 0x9aa508b5b7a84e1c677de54f3e99bc9n);
  m(0x20000n, 0x5d6af8dedb81196699c329225ee604n);
  m(0x40000n, 0x2216e584f5fa1ea926041bedfe98n);
  m(0x80000n, 0x48a170391f7dc42444e8fa2n);

  if (t > 0) ratio = (2n ** 256n - 1n) / ratio;
  // Round up to the nearest representable X96 value, as Uniswap does.
  return (ratio >> 32n) + (ratio % (1n << 32n) === 0n ? 0n : 1n);
}

const mulDivRoundingUp = (a, b, d) => {
  const p = a * b;
  return p / d + (p % d === 0n ? 0n : 1n);
};

/** token0 amount between two sqrt prices for a given liquidity. */
export function amount0Delta(sqrtA, sqrtB, liquidity, roundUp) {
  if (sqrtA > sqrtB) [sqrtA, sqrtB] = [sqrtB, sqrtA];
  if (sqrtA === 0n) throw new Error("amount0Delta: zero price");
  const num1 = liquidity << 96n;
  const num2 = sqrtB - sqrtA;
  return roundUp
    ? mulDivRoundingUp(mulDivRoundingUp(num1, num2, sqrtB), 1n, sqrtA)
    : (num1 * num2) / sqrtB / sqrtA;
}

/** token1 amount between two sqrt prices for a given liquidity. */
export function amount1Delta(sqrtA, sqrtB, liquidity, roundUp) {
  if (sqrtA > sqrtB) [sqrtA, sqrtB] = [sqrtB, sqrtA];
  return roundUp
    ? mulDivRoundingUp(liquidity, sqrtB - sqrtA, Q96)
    : (liquidity * (sqrtB - sqrtA)) / Q96;
}

/**
 * Turn a set of positions into the tick ladder the swap loop walks:
 *   ticks: sorted [tick, netLiquidityChange] crossing points
 *   active: liquidity in force at the current tick
 */
export function buildLadder(positions, currentTick) {
  const net = new Map();
  let active = 0n;
  for (const { tickLower, tickUpper, liquidity } of positions) {
    if (liquidity === 0n) continue;
    net.set(tickLower, (net.get(tickLower) ?? 0n) + liquidity);
    net.set(tickUpper, (net.get(tickUpper) ?? 0n) - liquidity);
    if (tickLower <= currentTick && currentTick < tickUpper) active += liquidity;
  }
  const ticks = [...net.entries()].filter(([, d]) => d !== 0n).sort((a, b) => a[0] - b[0]);
  return { ticks, active };
}

/**
 * Reserves currently held by the pool, exactly.
 *
 * This is "what's left" for the quote side and the pool's token inventory for
 * the other. It is a sum over positions, not an approximation from the active
 * liquidity, because a pool with several ranges holds tokens in ranges that are
 * not currently active.
 */
export function reserves(positions, sqrtPriceX96) {
  let amount0 = 0n;
  let amount1 = 0n;
  for (const { tickLower, tickUpper, liquidity } of positions) {
    if (liquidity <= 0n) continue;
    const sa = tickToSqrtPriceX96(tickLower);
    const sb = tickToSqrtPriceX96(tickUpper);
    if (sqrtPriceX96 <= sa) {
      amount0 += amount0Delta(sa, sb, liquidity, false);
    } else if (sqrtPriceX96 < sb) {
      amount0 += amount0Delta(sqrtPriceX96, sb, liquidity, false);
      amount1 += amount1Delta(sa, sqrtPriceX96, liquidity, false);
    } else {
      amount1 += amount1Delta(sa, sb, liquidity, false);
    }
  }
  return { amount0, amount1 };
}

/**
 * Simulate an exact-input swap across the ladder and return what comes out.
 *
 * `zeroForOne` true means selling token0 for token1 — the price falls. This is
 * the direction that matters for us whenever the dead token is currency0.
 *
 * The fee is taken off the input, as V4 does. `feePips` is the pool's LP fee in
 * hundredths of a bip, so 3000 is 0.30%.
 *
 * Returns the output amount and the input actually consumed. If the pool runs
 * out of liquidity before the input does, the leftover is reported rather than
 * silently swallowed — a pool that cannot absorb the supply is a fact about the
 * grave, not a rounding detail.
 */
export function swapExactIn({ positions, sqrtPriceX96, currentTick, feePips, amountIn, zeroForOne }) {
  const { ticks } = buildLadder(positions, currentTick);
  let sqrtP = sqrtPriceX96;
  let liquidity = 0n;
  for (const { tickLower, tickUpper, liquidity: L } of positions) {
    if (L > 0n && tickLower <= currentTick && currentTick < tickUpper) liquidity += L;
  }

  let remaining = amountIn;
  let out = 0n;
  let consumed = 0n;
  const limit = zeroForOne ? MIN_SQRT_RATIO + 1n : MAX_SQRT_RATIO - 1n;

  // Crossing points ahead of us, in the direction of travel.
  const ahead = zeroForOne
    ? ticks.filter(([t]) => t <= currentTick).sort((a, b) => b[0] - a[0])
    : ticks.filter(([t]) => t > currentTick).sort((a, b) => a[0] - b[0]);

  let guard = 0;
  for (let i = 0; remaining > 0n && guard++ < 100_000; i++) {
    const nextTick = i < ahead.length ? ahead[i][0] : (zeroForOne ? MIN_TICK : MAX_TICK);
    const sqrtNext = tickToSqrtPriceX96(nextTick);
    const sqrtTarget = zeroForOne
      ? (sqrtNext < limit ? limit : sqrtNext)
      : (sqrtNext > limit ? limit : sqrtNext);

    if (liquidity === 0n) {
      // No liquidity in this range: jump to the boundary and pick up whatever
      // the crossing adds. Nothing is paid out across an empty range.
      if (i >= ahead.length) break;
      sqrtP = sqrtNext;
      liquidity += zeroForOne ? -ahead[i][1] : ahead[i][1];
      if (liquidity < 0n) liquidity = 0n;
      continue;
    }

    // Input this range can absorb before the price reaches the boundary.
    const maxIn = zeroForOne
      ? amount0Delta(sqrtTarget, sqrtP, liquidity, true)
      : amount1Delta(sqrtP, sqrtTarget, liquidity, true);
    const feeDen = 1_000_000n;
    const maxInWithFee = maxIn === 0n ? 0n : mulDivRoundingUp(maxIn, feeDen, feeDen - BigInt(feePips));

    let sqrtNew;
    let amountInStep;
    if (remaining >= maxInWithFee && maxInWithFee > 0n) {
      amountInStep = maxInWithFee;
      sqrtNew = sqrtTarget;
    } else {
      const netIn = (remaining * (feeDen - BigInt(feePips))) / feeDen;
      sqrtNew = zeroForOne
        ? nextSqrtFromInput0(sqrtP, liquidity, netIn)
        : nextSqrtFromInput1(sqrtP, liquidity, netIn);
      amountInStep = remaining;
    }

    out += zeroForOne
      ? amount1Delta(sqrtNew, sqrtP, liquidity, false)
      : amount0Delta(sqrtP, sqrtNew, liquidity, false);
    remaining -= amountInStep;
    consumed += amountInStep;
    sqrtP = sqrtNew;

    if (sqrtP === sqrtTarget && i < ahead.length) {
      liquidity += zeroForOne ? -ahead[i][1] : ahead[i][1];
      if (liquidity < 0n) liquidity = 0n;
    } else if (sqrtP === limit) {
      break;
    }
    if (i >= ahead.length && sqrtP === sqrtTarget) break;
  }

  return { amountOut: out, amountInConsumed: consumed, amountInUnused: remaining, sqrtPriceAfter: sqrtP };
}

function nextSqrtFromInput0(sqrtP, liquidity, amountIn) {
  if (amountIn === 0n) return sqrtP;
  const numerator = liquidity << 96n;
  const product = amountIn * sqrtP;
  const denominator = numerator + product;
  if (denominator >= numerator) return mulDivRoundingUp(numerator, sqrtP, denominator);
  return mulDivRoundingUp(numerator, 1n, numerator / sqrtP + amountIn);
}

function nextSqrtFromInput1(sqrtP, liquidity, amountIn) {
  return sqrtP + (amountIn << 96n) / liquidity;
}

/**
 * The closed form from the build brief, for a single full-range position.
 * Kept so the tests can prove the ladder walk agrees with it, and so the
 * website can show the reader the formula it is actually using.
 */
export function constantProductOut(reserveQuote, reserveToken, amountIn, feePips) {
  const net = (amountIn * (1_000_000n - BigInt(feePips))) / 1_000_000n;
  if (reserveToken + net === 0n) return 0n;
  return (reserveQuote * net) / (reserveToken + net);
}
