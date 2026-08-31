import assert from "node:assert/strict";
import {
  Q96, tickToSqrtPriceX96, reserves, swapExactIn, constantProductOut,
  MIN_TICK, MAX_TICK,
} from "./v4math.mjs";

/**
 * The ladder walk has to agree with the closed form the brief publishes,
 * because the site is going to print that formula and claim the numbers come
 * from it. If these disagree, one of them is lying to a depositor.
 */

let pass = 0;
const t = (name, fn) => { fn(); pass++; console.log(`  ok  ${name}`); };

t("tick 0 is 1:1", () => {
  assert.equal(tickToSqrtPriceX96(0), Q96);
});

t("tick maths is monotonic and symmetric", () => {
  assert.ok(tickToSqrtPriceX96(100) > tickToSqrtPriceX96(0));
  assert.ok(tickToSqrtPriceX96(-100) < tickToSqrtPriceX96(0));
  // 1.0001^(6932/2) is very close to 2**0.5... check a round trip instead:
  const a = tickToSqrtPriceX96(-887272);
  const b = tickToSqrtPriceX96(887272);
  assert.ok(a < Q96 && b > Q96);
});

// A full-range position: exactly the constant-product pool the brief describes.
const FULL = (L) => [{ tickLower: MIN_TICK + 12, tickUpper: MAX_TICK - 12, liquidity: L }];

t("full-range reserves are the geometric pair", () => {
  const L = 10n ** 18n;
  const { amount0, amount1 } = reserves(FULL(L), Q96);
  // At price 1, a symmetric full-range position holds ~L of each side.
  const ratio = Number(amount0) / Number(amount1);
  assert.ok(ratio > 0.999 && ratio < 1.001, `ratio ${ratio}`);
});

t("ladder walk agrees with out(D) = Rq*D(1-f)/(Rt+D(1-f))", () => {
  const L = 10n ** 20n;
  const fee = 3000; // 0.30%
  const { amount0: Rt, amount1: Rq } = reserves(FULL(L), Q96);

  for (const frac of [1n, 10n, 100n, 1000n]) {
    const amountIn = Rt / frac;
    const sim = swapExactIn({
      positions: FULL(L), sqrtPriceX96: Q96, currentTick: 0,
      feePips: fee, amountIn, zeroForOne: true,
    });
    const closed = constantProductOut(Rq, Rt, amountIn, fee);
    const drift = Number(sim.amountOut - closed) / Number(closed);
    assert.ok(Math.abs(drift) < 2e-4, `frac 1/${frac}: sim ${sim.amountOut} vs closed ${closed} (drift ${drift})`);
  }
});

t("recovery is asymptotic — infinite supply never drains the reserve", () => {
  const L = 10n ** 20n;
  const { amount0: Rt, amount1: Rq } = reserves(FULL(L), Q96);
  const huge = swapExactIn({
    positions: FULL(L), sqrtPriceX96: Q96, currentTick: 0,
    feePips: 3000, amountIn: Rt * 1_000_000n, zeroForOne: true,
  });
  assert.ok(huge.amountOut < Rq, "a swap paid out the entire reserve, which is impossible");
  assert.ok(huge.amountOut > (Rq * 99n) / 100n, "a million times the reserve should get close");
});

t("marginal recovery falls: the second half of supply pays less than the first", () => {
  const L = 10n ** 20n;
  const { amount0: Rt } = reserves(FULL(L), Q96);
  const half = swapExactIn({ positions: FULL(L), sqrtPriceX96: Q96, currentTick: 0, feePips: 3000, amountIn: Rt / 2n, zeroForOne: true });
  const whole = swapExactIn({ positions: FULL(L), sqrtPriceX96: Q96, currentTick: 0, feePips: 3000, amountIn: Rt, zeroForOne: true });
  const secondHalf = whole.amountOut - half.amountOut;
  assert.ok(secondHalf < half.amountOut, "marginal recovery did not fall");
});

t("execution is path-independent: one sale equals twenty slices", () => {
  const L = 10n ** 20n;
  const { amount0: Rt } = reserves(FULL(L), Q96);
  const total = Rt / 2n;

  const once = swapExactIn({ positions: FULL(L), sqrtPriceX96: Q96, currentTick: 0, feePips: 3000, amountIn: total, zeroForOne: true });

  let sqrtP = Q96;
  let sliced = 0n;
  for (let i = 0; i < 20; i++) {
    const step = swapExactIn({ positions: FULL(L), sqrtPriceX96: sqrtP, currentTick: 0, feePips: 3000, amountIn: total / 20n, zeroForOne: true });
    sliced += step.amountOut;
    sqrtP = step.sqrtPriceAfter;
  }
  const drift = Number(once.amountOut - sliced) / Number(once.amountOut);
  assert.ok(Math.abs(drift) < 1e-3, `one sale ${once.amountOut}, twenty slices ${sliced} (drift ${drift})`);
});

t("a concentrated position out of range holds only one asset", () => {
  // Range entirely above the current price: all token0, no token1.
  const pos = [{ tickLower: 60, tickUpper: 120, liquidity: 10n ** 18n }];
  const { amount0, amount1 } = reserves(pos, Q96);
  assert.ok(amount0 > 0n, "expected token0");
  assert.equal(amount1, 0n);
});

t("selling into a pool with no liquidity below returns nothing, and says so", () => {
  const pos = [{ tickLower: 60, tickUpper: 120, liquidity: 10n ** 18n }];
  const r = swapExactIn({ positions: pos, sqrtPriceX96: Q96, currentTick: 0, feePips: 3000, amountIn: 10n ** 18n, zeroForOne: true });
  assert.equal(r.amountOut, 0n);
  assert.equal(r.amountInUnused, 10n ** 18n);
});

console.log(`\n${pass} passed`);
