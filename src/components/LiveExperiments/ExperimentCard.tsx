import { Link } from "react-router-dom";
import { MadvotesQueryClient } from "../../codegen/Madvotes.client";
import { useMadvotesGetPoolsQuery } from "../../codegen/Madvotes.react-query";
import { Outcome } from "../../codegen/Madvotes.types";
import {
  useChainProposal,
  useGovTallyParams,
} from "../../hooks/useChainProposals";
import { ExperimentListing, deriveOutcome } from "../../utils/govProposal";
import { colors, fonts, outcomeColor, outcomeLabel } from "../../theme";
import { formatAtom, impliedCents, timeLeft } from "../../utils/format";

// Compact labels for the 2×2 odds grid (full labels live in theme.outcomeLabel).
const SHORT: Record<Outcome, string> = {
  passed: "Passed",
  rejected: "Reject",
  veto_rejected: "Veto",
  quorum_failed: "Q-f",
};
const ORDER: Outcome[] = ["passed", "rejected", "veto_rejected", "quorum_failed"];

export const ExperimentCard = ({
  listing,
  client,
}: {
  listing: ExperimentListing;
  client: MadvotesQueryClient | undefined;
}) => {
  const settled = listing.status === "settled";
  // Voting window closed on-chain but the contract market isn't settled yet.
  const votingEnded = listing.votingEndTime * 1000 < Date.now();
  const awaiting = listing.registered && !settled && votingEnded;
  // Both settled and awaiting-settlement markets read as "done" (no longer bettable).
  const done = settled || awaiting;

  // Odds come from the live pool; only meaningful for registered, open markets.
  // Unregistered chain proposals have no pool yet, so skip the query.
  const { data: poolsRes } = useMadvotesGetPoolsQuery({
    client,
    args: { proposalId: listing.proposalId },
    options: { enabled: listing.registered && !settled },
  });
  const pools = poolsRes?.pools ?? [];
  const poolTotal = pools.reduce((sum, p) => sum + Number(p.net), 0);

  // For an expired-but-unsettled market, derive the on-chain result to preview.
  const { data: proposal } = useChainProposal(listing.proposalId, awaiting);
  const { data: tallyParams } = useGovTallyParams(awaiting);
  const awaitingOutcome =
    awaiting && proposal && tallyParams
      ? deriveOutcome(proposal, tallyParams)
      : null;
  // Result to show on a "done" card: contract winner once settled, else derived.
  const resultOutcome = settled
    ? listing.market?.winning_outcome ?? null
    : awaitingOutcome;

  const remaining = timeLeft(listing.votingEndTime);
  const endingSoon = !done && remaining !== "ENDED" && !remaining.includes("D");

  return (
    <Link
      to={`/experiment/${listing.proposalId}`}
      style={{
        display: "block",
        border: `1px solid ${done ? colors.border : colors.violet}`,
        background: done ? "transparent" : "rgba(139,108,255,.05)",
        opacity: done ? 0.92 : 1,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "11px 13px",
          borderBottom: `1px solid ${colors.border}`,
        }}
      >
        <span
          style={{
            fontFamily: fonts.label,
            fontSize: 9,
            letterSpacing: ".1em",
            color: colors.violetLight,
          }}
        >
          EXP-{listing.proposalId}
        </span>
        <span
          style={{
            fontFamily: fonts.label,
            fontSize: 9,
            letterSpacing: ".1em",
            color: done
              ? colors.muted
              : endingSoon
              ? colors.rejected
              : colors.passed,
          }}
        >
          {done ? "✓ CONCLUDED" : `● ${remaining}`}
        </span>
      </div>

      <div style={{ padding: 13 }}>
        <div
          style={{
            fontFamily: fonts.display,
            fontWeight: 600,
            fontSize: 18,
            color: done ? colors.textDim : colors.text,
            lineHeight: 1.1,
            minHeight: 40,
          }}
        >
          {listing.title}
        </div>

        {done ? (
          <div
            style={{
              border: `1px solid ${colors.passed}`,
              background: "rgba(78,239,90,.06)",
              padding: "10px 12px",
              marginTop: 12,
              fontSize: 13,
              color: colors.textDim,
            }}
          >
            Result →{" "}
            <b
              style={{
                color: resultOutcome ? outcomeColor[resultOutcome] : colors.text,
              }}
            >
              {resultOutcome ? outcomeLabel[resultOutcome] : "—"}
            </b>
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 6,
              marginTop: 12,
            }}
          >
            {ORDER.map((outcome) => {
              const cents = impliedCents(pools, outcome);
              return (
                <div
                  key={outcome}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    border: `1px solid ${colors.border}`,
                    padding: "6px 9px",
                  }}
                >
                  <span style={{ fontSize: 12, color: colors.textDim }}>
                    {SHORT[outcome]}
                  </span>
                  <b
                    style={{
                      fontFamily: fonts.display,
                      fontSize: 15,
                      color: outcomeColor[outcome],
                    }}
                  >
                    {cents == null ? "—" : `${cents}¢`}
                  </b>
                </div>
              );
            })}
          </div>
        )}

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontFamily: fonts.label,
            fontSize: 9,
            letterSpacing: ".06em",
            color: colors.muted,
            marginTop: 12,
          }}
        >
          <span>POOL {poolTotal ? formatAtom(poolTotal) : "—"}</span>
          <span>
            {done
              ? "CONCLUDED"
              : listing.registered
              ? "OPEN"
              : "NEW · BE FIRST"}
          </span>
        </div>
      </div>
    </Link>
  );
};
