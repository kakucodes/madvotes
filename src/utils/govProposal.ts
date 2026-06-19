import {
  MarketResponse,
  MarketStatus,
  Outcome,
  Proposal,
  ProposalStatus,
} from "../codegen/Madvotes.types";

/**
 * Shape of a single proposal in a Cosmos SDK x/gov **v1beta1** REST response
 * (`/cosmos/gov/v1beta1/proposals`). Only the fields we consume are typed;
 * everything arrives as JSON, so ids are strings and timestamps are RFC3339.
 */
export interface RestGovProposal {
  proposal_id: string;
  content?: {
    "@type"?: string;
    title?: string;
    description?: string;
  } | null;
  status: string; // e.g. "PROPOSAL_STATUS_VOTING_PERIOD"
  final_tally_result?: {
    yes?: string;
    abstain?: string;
    no?: string;
    no_with_veto?: string;
  } | null;
  submit_time?: string | null;
  deposit_end_time?: string | null;
  voting_start_time?: string | null;
  voting_end_time?: string | null;
}

// REST returns the status as the proto enum *name*; map it onto the contract's
// lowercase ProposalStatus. Anything unexpected folds to "unspecified".
const STATUS_BY_NAME: Record<string, ProposalStatus> = {
  PROPOSAL_STATUS_UNSPECIFIED: "unspecified",
  PROPOSAL_STATUS_DEPOSIT_PERIOD: "deposit_period",
  PROPOSAL_STATUS_VOTING_PERIOD: "voting_period",
  PROPOSAL_STATUS_PASSED: "passed",
  PROPOSAL_STATUS_REJECTED: "rejected",
  PROPOSAL_STATUS_FAILED: "failed",
};

// Cosmos serializes "unset" timestamps as year 0001, which parses to a negative
// epoch. Treat anything at or before the unix epoch as a sentinel → null. Real
// times are returned as unix *seconds* (i64), matching the contract's state.
const toUnixSeconds = (rfc3339?: string | null): number | null => {
  if (!rfc3339) return null;
  const ms = Date.parse(rfc3339);
  if (Number.isNaN(ms) || ms <= 0) return null;
  return Math.floor(ms / 1000);
};

/**
 * Translate a v1beta1 gov proposal (REST JSON) into the `Proposal` snapshot the
 * contract's `register_market` expects. Mirrors `govProposalToMarketProposal`
 * from the deploy script, adapted to the REST wire shape (string ids, enum-name
 * status, RFC3339 timestamps).
 */
export const restToContractProposal = (
  p: RestGovProposal
): { proposalId: number; proposal: Proposal } => {
  const proposalId = Number(p.proposal_id);
  const tally = p.final_tally_result;

  return {
    proposalId,
    proposal: {
      id: proposalId,
      status: STATUS_BY_NAME[p.status] ?? "unspecified",
      title: p.content?.title ?? "",
      summary: p.content?.description ?? "",
      metadata: p.content?.["@type"] ?? "",
      proposer: "",
      expedited: false,
      failed_reason: "",
      submit_time: toUnixSeconds(p.submit_time),
      deposit_end_time: toUnixSeconds(p.deposit_end_time),
      voting_start_time: toUnixSeconds(p.voting_start_time),
      voting_end_time: toUnixSeconds(p.voting_end_time),
      tally: tally
        ? {
            yes_count: tally.yes ?? "0",
            no_count: tally.no ?? "0",
            abstain_count: tally.abstain ?? "0",
            no_with_veto_count: tally.no_with_veto ?? "0",
          }
        : null,
    },
  };
};

/**
 * A single row in the experiments list / detail view. Unifies a contract-side
 * registered market with an unregistered chain proposal so the UI can render
 * both, and so the bet flow can decide whether it must `register_market` first.
 *
 * - `registered` markets carry the contract `market`.
 * - unregistered chain proposals carry the full `proposal` snapshot, which the
 *   bet tx prepends as `register_market`.
 */
export interface ExperimentListing {
  proposalId: number;
  title: string;
  status: MarketStatus; // chain voting-period proposals surface as "open"
  votingStartTime: number;
  votingEndTime: number;
  registered: boolean;
  market?: MarketResponse;
  proposal?: Proposal;
}

/** Build a listing from a registered contract market. */
export const listingFromMarket = (market: MarketResponse): ExperimentListing => ({
  proposalId: market.proposal_id,
  title: market.title,
  status: market.status,
  votingStartTime: market.voting_start_time,
  votingEndTime: market.voting_end_time,
  registered: true,
  market,
});

/** Build a listing from an unregistered chain proposal snapshot. */
export const listingFromProposal = (
  proposal: Proposal
): ExperimentListing => ({
  proposalId: proposal.id,
  title: proposal.title,
  status: "open",
  votingStartTime: proposal.voting_start_time ?? 0,
  votingEndTime: proposal.voting_end_time ?? 0,
  registered: false,
  proposal,
});

/**
 * Gov tally parameters + bonded supply, scaled to permille (×1000) so the
 * outcome derivation stays in exact integer (BigInt) math. The contract uses
 * hard-coded Phase-1 values; we query the chain live, which those values are
 * meant to approximate.
 */
export interface GovTallyParams {
  bondedUatom: bigint;
  quorumPermille: bigint; // e.g. 334 → 0.334
  vetoPermille: bigint; // e.g. 334 → 0.334
  thresholdPermille: bigint; // e.g. 500 → 0.5
}

const toBig = (s?: string | null): bigint => {
  try {
    return BigInt(s ?? "0");
  } catch {
    return 0n;
  }
};

/**
 * Derive the market outcome from a terminal proposal + final tally, replaying
 * x/gov's tally in order (quorum → veto → threshold). A faithful port of the
 * contract's `Outcome::from_proposal`. Returns `null` while the proposal is
 * still active or in an unknown/failed terminal state (no winner to settle on).
 */
export const deriveOutcome = (
  proposal: Proposal,
  params: GovTallyParams
): Outcome | null => {
  if (proposal.status === "passed") return "passed";
  if (proposal.status !== "rejected") return null; // active / unspecified / failed

  const t = proposal.tally;
  if (!t) return null;

  const yes = toBig(t.yes_count);
  const abstain = toBig(t.abstain_count);
  const no = toBig(t.no_count);
  const veto = toBig(t.no_with_veto_count);
  const totalVoted = yes + abstain + no + veto;

  // 1. Quorum: turnout / bonded < quorum  →  quorum_failed.
  const { bondedUatom, quorumPermille, vetoPermille, thresholdPermille } =
    params;
  if (bondedUatom === 0n || totalVoted * 1000n < quorumPermille * bondedUatom) {
    return "quorum_failed";
  }

  // 2. Veto: no_with_veto / turnout > veto  →  veto_rejected (turnout incl. abstain).
  if (totalVoted !== 0n && veto * 1000n > vetoPermille * totalVoted) {
    return "veto_rejected";
  }

  // 3. Threshold: yes / (yes + no + veto) > threshold (abstain excluded).
  const denom = yes + no + veto;
  if (denom !== 0n && yes * 1000n > thresholdPermille * denom) {
    return "passed";
  }
  return "rejected";
};
