import { useQuery } from "@tanstack/react-query";
import { Proposal } from "../codegen/Madvotes.types";
import { REST } from "../utils/constants";
import {
  GovTallyParams,
  RestGovProposal,
  restToContractProposal,
} from "../utils/govProposal";

// x/gov v1beta1 proposal_status for the voting period. These are the only
// proposals worth surfacing: betting is open exactly during voting, and
// `register_market` requires the proposal to be in its voting period.
const VOTING_PERIOD = 2;

interface ProposalsRestResponse {
  proposals?: RestGovProposal[];
}

/**
 * Fetches the chain's current voting-period governance proposals straight from
 * the REST (LCD) endpoint and maps each into the contract's `Proposal` shape.
 * This is what lets the SPA show — and bet on — proposals that haven't been
 * registered as markets yet, removing the need for a backend that polls the
 * chain and pre-registers markets.
 */
export const useChainProposals = () =>
  useQuery({
    queryKey: ["chain-proposals", REST, VOTING_PERIOD],
    staleTime: 30_000,
    queryFn: async (): Promise<Proposal[]> => {
      const url = `${REST}/cosmos/gov/v1beta1/proposals?proposal_status=${VOTING_PERIOD}&pagination.limit=100`;
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`gov proposals query failed (${res.status})`);
      }
      const body: ProposalsRestResponse = await res.json();
      return (body.proposals ?? []).map(
        (p) => restToContractProposal(p).proposal
      );
    },
  });

/**
 * Fetches a single gov proposal by id and maps it to the contract `Proposal`
 * shape. Used to pull the *concluded* snapshot (terminal status + final tally)
 * for a market whose voting window has closed but which hasn't been settled
 * on-chain yet — exactly what `settle_market` needs.
 */
export const useChainProposal = (proposalId?: number, enabled = true) =>
  useQuery({
    queryKey: ["chain-proposal", REST, proposalId],
    enabled: enabled && proposalId != null,
    staleTime: 30_000,
    queryFn: async (): Promise<Proposal> => {
      const res = await fetch(
        `${REST}/cosmos/gov/v1beta1/proposals/${proposalId}`
      );
      if (!res.ok) {
        throw new Error(`gov proposal ${proposalId} query failed (${res.status})`);
      }
      const body: { proposal?: RestGovProposal } = await res.json();
      if (!body.proposal) {
        throw new Error(`gov proposal ${proposalId} not found`);
      }
      return restToContractProposal(body.proposal).proposal;
    },
  });

interface TallyParamsRestResponse {
  tally_params?: {
    quorum?: string;
    threshold?: string;
    veto_threshold?: string;
  };
}
interface PoolRestResponse {
  pool?: { bonded_tokens?: string };
}

// Parse a gov-param decimal string ("0.334000000000000000") to permille (×1000).
const toPermille = (decimal?: string): bigint =>
  BigInt(Math.round(Number(decimal ?? "0") * 1000));

/**
 * Queries the chain's gov tally params + bonded supply, scaled for the BigInt
 * outcome derivation in `deriveOutcome`. The contract hard-codes Phase-1 values
 * meant to track these, so reading them live keeps the client in step.
 */
export const useGovTallyParams = (enabled = true) =>
  useQuery({
    queryKey: ["gov-tally-params", REST],
    enabled,
    staleTime: 5 * 60_000,
    queryFn: async (): Promise<GovTallyParams> => {
      const [paramsRes, poolRes] = await Promise.all([
        fetch(`${REST}/cosmos/gov/v1beta1/params/tallying`),
        fetch(`${REST}/cosmos/staking/v1beta1/pool`),
      ]);
      if (!paramsRes.ok || !poolRes.ok) {
        throw new Error("gov tally params / staking pool query failed");
      }
      const params: TallyParamsRestResponse = await paramsRes.json();
      const pool: PoolRestResponse = await poolRes.json();
      return {
        bondedUatom: BigInt(pool.pool?.bonded_tokens ?? "0"),
        quorumPermille: toPermille(params.tally_params?.quorum),
        vetoPermille: toPermille(params.tally_params?.veto_threshold),
        thresholdPermille: toPermille(params.tally_params?.threshold),
      };
    },
  });
