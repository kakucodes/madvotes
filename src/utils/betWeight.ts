/**
 * Time-weighted deposit multiplier — exact port of the contract's `bet_weight`
 * (src/math.rs in cw-gov-predict). A bet placed early, when the outcome is
 * uncertain, earns a larger share than a last-moment bet. Keep this byte-for-byte
 * in step with the Rust implementation; the test in betWeight.test.ts pins the
 * shared vector (f ∈ {1, .75, .5, .25, 0}) so the two cannot silently drift.
 */

const SCALE_F = 1_000_000_000_000_000_000n; // 1e18
const K = 5n;
const EXP5_MINUS1_SCALED = 147_413_159_102_576_603_421n; // (e^5 - 1) * 1e18
const WEIGHT_SCALE = 1_000_000n; // output range [0, 1_000_000]
const TAYLOR_TERMS = 20; // 20 keeps worst-case error (<1 ppm) at x = 5

/** Evaluate e^x via a Taylor series. x is fixed-point ×1e18. Returns e^x ×1e18. */
function expFixed(x: bigint): bigint {
  let term = SCALE_F; // term_0 = 1 * scale
  let sum = SCALE_F;
  for (let n = 1n; n <= BigInt(TAYLOR_TERMS); n++) {
    term = (term * x) / n / SCALE_F;
    sum += term;
  }
  return sum;
}

/**
 * Exponential time-decay weight for a bet placed at `now`. All timestamps are
 * Unix seconds. Returns a value in [0, 1_000_000].
 */
export function betWeight(
  votingStartTime: bigint,
  votingEndTime: bigint,
  now: bigint
): bigint {
  if (now >= votingEndTime || votingEndTime <= votingStartTime) return 0n;

  const duration = votingEndTime - votingStartTime;
  // Clamp `now` into the window so a pre-start bet can't push f above 1.
  const clampedNow = now < votingStartTime ? votingStartTime : now;
  const remaining = votingEndTime - clampedNow;

  // f * 1e18, clamped to <= 1e18 (defensive — clampedNow already bounds it)
  const fRaw = (remaining * SCALE_F) / duration;
  const fScaled = fRaw > SCALE_F ? SCALE_F : fRaw;

  // x = k * f (still ×1e18), guaranteed <= 5e18
  const x = fScaled * K;

  // (e^x - 1) * 1e18
  const numerator = expFixed(x) - SCALE_F;

  // weight = (e^x - 1) / (e^k - 1) * WEIGHT_SCALE
  const weight = (numerator * WEIGHT_SCALE) / EXP5_MINUS1_SCALED;

  return weight > WEIGHT_SCALE ? WEIGHT_SCALE : weight;
}

export const WEIGHT_SCALE_NUM = Number(WEIGHT_SCALE);

/**
 * Weight at time-fraction-remaining f ∈ [0, 1], normalized to [0, 1]. Reuses
 * the exact integer betWeight so a plotted curve matches the on-chain weighting.
 * f = 1 is at open (max weight), f = 0 is at close.
 */
export const normalizedWeightAt = (f: number): number => {
  const ff = Math.min(1, Math.max(0, f));
  const D = 1_000_000n;
  const now = BigInt(Math.round((1 - ff) * Number(D)));
  return Number(betWeight(0n, D, now)) / WEIGHT_SCALE_NUM;
};
