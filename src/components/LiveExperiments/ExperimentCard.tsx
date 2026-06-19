import { Link } from "react-router-dom";
import { MadvotesQueryClient } from "../../codegen/Madvotes.client";
import { useMadvotesGetPoolsQuery } from "../../codegen/Madvotes.react-query";
import { MarketResponse, Outcome } from "../../codegen/Madvotes.types";
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
  market,
  client,
}: {
  market: MarketResponse;
  client: MadvotesQueryClient | undefined;
}) => {
  const settled = market.status === "settled";

  // Odds come from the live pool; only meaningful for open markets.
  const { data: poolsRes } = useMadvotesGetPoolsQuery({
    client,
    args: { proposalId: market.proposal_id },
    options: { enabled: !settled },
  });
  const pools = poolsRes?.pools ?? [];
  const poolTotal = pools.reduce((sum, p) => sum + Number(p.net), 0);

  const remaining = timeLeft(market.voting_end_time);
  const endingSoon = !settled && remaining !== "ENDED" && !remaining.includes("D");

  return (
    <Link
      to={`/experiment/${market.proposal_id}`}
      style={{
        display: "block",
        border: `1px solid ${settled ? colors.border : colors.violet}`,
        background: settled ? "transparent" : "rgba(139,108,255,.05)",
        opacity: settled ? 0.92 : 1,
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
          EXP-{market.proposal_id}
        </span>
        <span
          style={{
            fontFamily: fonts.label,
            fontSize: 9,
            letterSpacing: ".1em",
            color: settled
              ? colors.muted
              : endingSoon
              ? colors.rejected
              : colors.passed,
          }}
        >
          {settled ? "✓ CONCLUDED" : `● ${remaining}`}
        </span>
      </div>

      <div style={{ padding: 13 }}>
        <div
          style={{
            fontFamily: fonts.display,
            fontWeight: 600,
            fontSize: 18,
            color: settled ? colors.textDim : colors.text,
            lineHeight: 1.1,
            minHeight: 40,
          }}
        >
          {market.title}
        </div>

        {settled ? (
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
                color: market.winning_outcome
                  ? outcomeColor[market.winning_outcome]
                  : colors.text,
              }}
            >
              {market.winning_outcome
                ? outcomeLabel[market.winning_outcome]
                : "—"}
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
          <span>{settled ? "SETTLED" : "OPEN"}</span>
        </div>
      </div>
    </Link>
  );
};
