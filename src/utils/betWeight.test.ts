import { betWeight } from "./betWeight";

// Shared vector with the contract's bet_weight (cw-gov-predict src/math.rs).
// Values are the exact integers the 20-term Taylor algorithm yields — both the
// Rust and TS ports run identical integer ops, so they must agree to the digit.
// (The spec's prose table shows idealized reals; these are the truncated-series
// outputs.) If this drifts, the on-chain weight and the UI projection disagree.
describe("betWeight", () => {
  const DURATION = 1_000_000n;
  const start = 0n;
  const end = DURATION;
  // now for a given time-fraction-remaining f: now = (1 - f) * duration
  const at = (f: number) => betWeight(start, end, BigInt(Math.round((1 - f) * Number(DURATION))));

  it("matches the pinned vector", () => {
    expect(at(1)).toBe(999_999n);
    expect(at(0.75)).toBe(281_664n);
    expect(at(0.5)).toBe(75_858n);
    expect(at(0.25)).toBe(16_893n);
    expect(at(0)).toBe(0n);
  });

  it("returns 0 once voting has ended or the window is degenerate", () => {
    expect(betWeight(start, end, end)).toBe(0n);
    expect(betWeight(start, end, end + 10n)).toBe(0n);
    expect(betWeight(100n, 100n, 50n)).toBe(0n);
  });

  it("clamps a pre-start bet to the f=1 weight (never above)", () => {
    expect(betWeight(start, end, -50n)).toBe(999_999n);
  });
});
