import { Outcome, OutcomeAccum } from "../codegen/Madvotes.types";

/**
 * uatom micro-units (a Uint128 string or summed number) → whole-ATOM display
 * with thousands separators.
 */
export const formatAtom = (micro: string | number): string => {
  const atom = Number(micro) / 1_000_000;
  return atom.toLocaleString("en-US", {
    maximumFractionDigits: atom >= 100 ? 0 : 2,
  });
};

/**
 * Compact countdown to a unix-seconds end time → "2D 14H" / "18H" / "ENDED".
 * NOTE: assumes voting_end_time is in seconds; verify against a real market
 * once one is registered (could be nanoseconds depending on the contract).
 */
export const timeLeft = (endSec?: number | null): string => {
  if (!endSec) return "";
  const diffMs = endSec * 1000 - Date.now();
  if (diffMs <= 0) return "ENDED";
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 60) return `${minutes}M`;
  const hours = Math.floor(diffMs / 3_600_000);
  const days = Math.floor(hours / 24);
  return days > 0 ? `${days}D ${hours % 24}H` : `${hours}H`;
};

/**
 * Parimutuel implied odds for an outcome, in cents: net stake on the outcome
 * over the total net pool. Returns null when the pool is empty.
 */
export const impliedCents = (
  pools: OutcomeAccum[],
  outcome: Outcome,
): number | null => {
  const total = pools.reduce((sum, p) => sum + Number(p.net), 0);
  if (!total) return null;
  const entry = pools.find((p) => p.outcome === outcome);
  return Math.round(((entry ? Number(entry.net) : 0) / total) * 100);
};
