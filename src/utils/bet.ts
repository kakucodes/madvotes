import { Outcome, OutcomeAccum } from "../codegen/Madvotes.types";
import { BURN_BPS, MICRO } from "./constants";

/** Parse a decimal ATOM string ("100", "12.5") into uatom micro-units. */
export const atomToMicro = (atom: string): bigint => {
  const t = atom.trim();
  if (!t || Number.isNaN(Number(t))) return 0n;
  const [whole, frac = ""] = t.split(".");
  const fracPadded = (frac + "000000").slice(0, 6);
  return BigInt(whole || "0") * MICRO + BigInt(fracPadded || "0");
};

export interface Slip {
  burn: bigint; // 5% destroyed at bet time
  net: bigint; // 95% credited to the pool
  projected: bigint; // est. payout if this outcome wins and no one bets after
  weightedContribution: bigint; // net × weight
}

/**
 * Project a bet's economics, mirroring the contract's PlaceBet + Claim math:
 *   burn = stake × burn_bps / 10000,  net = stake − burn
 *   payout = net + L × (net·w) / (Ω + net·w)
 * where L is the losing pool (the other three outcomes' net) and Ω the winning
 * outcome's weighted accumulator. Falls back to a net-proportional split when
 * the new weighted denominator would be zero (matches the Ω = 0 claim branch).
 * This is an optimistic "you win, nobody bets after you" projection.
 */
export const computeSlip = (
  stakeMicro: bigint,
  weight: bigint, // [0, 1_000_000]
  pools: OutcomeAccum[],
  outcome: Outcome
): Slip => {
  const burn = (stakeMicro * BURN_BPS) / 10_000n;
  const net = stakeMicro - burn;
  const weightedContribution = net * weight;

  const own = pools.find((p) => p.outcome === outcome);
  const poolNet = own ? BigInt(own.net) : 0n;
  const poolWeighted = own ? BigInt(own.weighted) : 0n;
  const losing = pools
    .filter((p) => p.outcome !== outcome)
    .reduce((sum, p) => sum + BigInt(p.net), 0n);

  const newOmega = poolWeighted + weightedContribution;
  const projected =
    newOmega > 0n
      ? net + (losing * weightedContribution) / newOmega
      : net + (losing * net) / (poolNet + net || 1n);

  return { burn, net, projected, weightedContribution };
};
