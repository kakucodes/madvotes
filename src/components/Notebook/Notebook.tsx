import { useState } from "react";
import { Link } from "react-router-dom";
import { useChain } from "@cosmos-kit/react";
import { useQueryClient } from "@tanstack/react-query";
import {
  PROVIDER_CHAIN,
  useMadvotesSigningClient,
} from "../../hooks/useMadvotes";
import { colors, fonts, outcomeColor, outcomeLabel, CONTENT_MAX } from "../../theme";
import { useMadvotesGetClaimQuery } from "../../codegen/Madvotes.react-query";
import { MarketStatus, Outcome, OutcomeAccum } from "../../codegen/Madvotes.types";
import { MadvotesClient } from "../../codegen/Madvotes.client";
import { formatAtom, timeLeft } from "../../utils/format";
import { useGetUserPositions } from "../../hooks/useGetUserPositions";

type UserPosition = {
  proposal_id: number;
  depositor: string;
  positions: OutcomeAccum[];
  proposalId: number;
  status: MarketStatus;
  title: string;
  voting_end_time: number;
  voting_start_time: number;
  winning_outcome?: Outcome | null;
};

// ─── Small atoms ────────────────────────────────────────────────────────────

const FieldLabel = ({ children }: { children: React.ReactNode }) => (
  <div
    style={{
      fontFamily: fonts.label,
      fontSize: 9,
      letterSpacing: ".12em",
      color: colors.muted,
      marginBottom: 6,
    }}
  >
    {children}
  </div>
);

// ─── Claim section ──────────────────────────────────────────────────────────

const ClaimSection = ({
  position,
  signingClient,
}: {
  position: UserPosition;
  signingClient: MadvotesClient | undefined;
}) => {
  const [txStatus, setTxStatus] = useState<"idle" | "signing" | "success" | "error">("idle");
  const [errMsg, setErrMsg] = useState("");
  const reactQueryClient = useQueryClient();

  const { data: claim, isLoading } = useMadvotesGetClaimQuery({
    client: signingClient,
    args: { depositor: position.depositor, proposalId: position.proposal_id },
    options: { enabled: !!signingClient && position.status === "settled" },
  });

  const doClaim = async () => {
    if (!signingClient) return;
    setTxStatus("signing");
    try {
      await signingClient.claim({ proposalId: position.proposal_id });
      setTxStatus("success");
      reactQueryClient.invalidateQueries();
    } catch (e) {
      setErrMsg(e instanceof Error ? e.message : String(e));
      setTxStatus("error");
    }
  };

  if (isLoading) {
    return (
      <div style={{ fontFamily: fonts.mono, fontSize: 12, color: colors.muted, marginTop: 10 }}>
        Checking claim…
      </div>
    );
  }

  if (txStatus === "success") {
    return (
      <div
        style={{
          border: `1px solid ${colors.passed}`,
          background: "rgba(78,239,90,.08)",
          padding: "10px 14px",
          marginTop: 12,
          fontFamily: fonts.mono,
          fontSize: 13,
          color: colors.passed,
        }}
      >
        ✓ Payout collected!
      </div>
    );
  }

  if (!claim || !claim.settled || claim.already_claimed || claim.claimable === "0") {
    // Settled but no payout (lost or already claimed)
    return (
      <div style={{ fontFamily: fonts.mono, fontSize: 12, color: colors.muted, marginTop: 10 }}>
        {claim?.already_claimed ? "✓ Already collected." : "✗ No payout — better luck next time."}
      </div>
    );
  }

  return (
    <div style={{ marginTop: 12 }}>
      {txStatus === "error" && (
        <div style={{ fontFamily: fonts.mono, fontSize: 11, color: colors.rejected, marginBottom: 8 }}>
          {errMsg}
        </div>
      )}
      <div
        style={{
          border: `1px solid ${colors.violet}`,
          background: "rgba(139,108,255,.08)",
          padding: "12px 16px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 16,
        }}
      >
        <div>
          <FieldLabel>PAYOUT AVAILABLE</FieldLabel>
          <div
            style={{
              fontFamily: fonts.display,
              fontWeight: 700,
              fontSize: 22,
              color: colors.text,
              letterSpacing: ".5px",
            }}
          >
            {formatAtom(claim.claimable)}{" "}
            <span style={{ fontFamily: fonts.mono, fontSize: 13, color: colors.muted }}>ATOM</span>
          </div>
        </div>
        <button
          onClick={doClaim}
          disabled={txStatus === "signing"}
          style={{
            border: `1px solid ${colors.violet}`,
            background: colors.violet,
            color: colors.text,
            fontFamily: fonts.label,
            fontSize: 11,
            letterSpacing: ".1em",
            padding: "10px 20px",
            cursor: txStatus === "signing" ? "wait" : "pointer",
            opacity: txStatus === "signing" ? 0.6 : 1,
            flexShrink: 0,
          }}
        >
          {txStatus === "signing" ? "COLLECTING…" : "COLLECT PAYOUT"}
        </button>
      </div>
    </div>
  );
};

// ─── Position card ──────────────────────────────────────────────────────────

const NotebookPositionCard = ({
  position,
  signingClient,
}: {
  position: UserPosition;
  signingClient: MadvotesClient | undefined;
}) => {
  const settled = position.status === "settled";
  const userWon =
    settled &&
    !!position.winning_outcome &&
    position.positions.some((p) => p.outcome === position.winning_outcome);

  return (
    <div
      style={{
        border: `1px solid ${settled ? colors.border : colors.violet}`,
        background: settled ? "transparent" : "rgba(139,108,255,.04)",
      }}
    >
      {/* Header bar */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "10px 16px",
          borderBottom: `1px solid ${colors.border}`,
          background: settled ? "transparent" : "rgba(139,108,255,.06)",
        }}
      >
        <Link
          to={`/experiment/${position.proposal_id}`}
          style={{
            fontFamily: fonts.label,
            fontSize: 10,
            letterSpacing: ".1em",
            color: colors.violetLight,
            textDecoration: "none",
          }}
        >
          EXP-{position.proposal_id}
        </Link>
        <span
          style={{
            fontFamily: fonts.label,
            fontSize: 9,
            letterSpacing: ".1em",
            color: settled ? colors.muted : colors.passed,
          }}
        >
          {settled
            ? "✓ CONCLUDED"
            : `● OPEN · ENDS ${timeLeft(position.voting_end_time)}`}
        </span>
      </div>

      <div style={{ padding: "14px 16px" }}>
        {/* Title */}
        <div
          style={{
            fontFamily: fonts.display,
            fontWeight: 600,
            fontSize: 18,
            color: settled ? colors.textDim : colors.text,
            lineHeight: 1.1,
            marginBottom: 14,
          }}
        >
          {position.title}
        </div>

        {/* User's bet positions */}
        <FieldLabel>YOUR CALL{position.positions.length > 1 ? "S" : ""}</FieldLabel>
        <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 14 }}>
          {position.positions.map((pos, i) => {
            const outcome = pos.outcome as Outcome;
            const isWinningCall = settled && position.winning_outcome === outcome;
            const isLosingCall = settled && !!position.winning_outcome && position.winning_outcome !== outcome;
            return (
              <div
                key={i}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  border: `1px solid ${isWinningCall ? outcomeColor[outcome] : colors.borderSoft}`,
                  background: isWinningCall ? `${outcomeColor[outcome]}12` : "transparent",
                  padding: "10px 14px",
                  opacity: isLosingCall ? 0.45 : 1,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div
                    style={{
                      width: 3,
                      height: 20,
                      background: outcomeColor[outcome],
                      flexShrink: 0,
                    }}
                  />
                  <span
                    style={{
                      fontFamily: fonts.mono,
                      fontSize: 13,
                      color: outcomeColor[outcome],
                    }}
                  >
                    {outcomeLabel[outcome]}
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                  <span
                    style={{
                      fontFamily: fonts.display,
                      fontWeight: 700,
                      fontSize: 18,
                      color: colors.text,
                    }}
                  >
                    {formatAtom(pos.net)}
                  </span>
                  <span style={{ fontFamily: fonts.mono, fontSize: 11, color: colors.muted }}>
                    ATOM
                  </span>
                  {isWinningCall && (
                    <span style={{ color: colors.passed, fontSize: 13, marginLeft: 2 }}>✓</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Result / claim section (settled only) */}
        {settled && (
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <FieldLabel>RESULT</FieldLabel>
              <span
                style={{
                  fontFamily: fonts.mono,
                  fontSize: 13,
                  color: position.winning_outcome
                    ? outcomeColor[position.winning_outcome]
                    : colors.muted,
                  marginTop: -6,
                }}
              >
                →{" "}
                {position.winning_outcome
                  ? outcomeLabel[position.winning_outcome]
                  : "—"}
              </span>
            </div>
            <ClaimSection
              position={position}
              signingClient={userWon ? signingClient : undefined}
            />
            {!userWon && !signingClient && (
              <div style={{ fontFamily: fonts.mono, fontSize: 12, color: colors.muted, marginTop: 10 }}>
                ✗ No payout — better luck next time.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Main page ───────────────────────────────────────────────────────────────

export const Notebook = () => {
  const { isWalletConnected, address } = useChain(PROVIDER_CHAIN);
  const { data: signingClient } = useMadvotesSigningClient();
  const positionsResp = useGetUserPositions();

  const isLoading = positionsResp.some((r) => r.isLoading);
  const userPositions = positionsResp
    .map((r) => r.data)
    .filter((p): p is UserPosition => !!p);

  return (
    <div
      style={{
        maxWidth: CONTENT_MAX,
        margin: "0 auto",
        padding: "24px 26px 90px",
      }}
    >
      {/* Page header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          marginBottom: 18,
        }}
      >
        <div
          style={{
            fontFamily: fonts.display,
            fontWeight: 700,
            fontSize: 26,
            color: colors.text,
          }}
        >
          MY NOTEBOOK
        </div>
        {isWalletConnected && userPositions.length > 0 && (
          <div style={{ fontFamily: fonts.mono, fontSize: 12, color: colors.muted }}>
            {userPositions.length} position{userPositions.length !== 1 ? "s" : ""}
          </div>
        )}
      </div>

      {/* Not connected */}
      {!isWalletConnected && (
        <div
          style={{
            border: `1px solid ${colors.border}`,
            padding: "40px 26px",
            textAlign: "center",
            color: colors.textSoft,
            fontFamily: fonts.mono,
            fontSize: 14,
          }}
        >
          Connect a wallet to view your hypotheses and claimable results.
        </div>
      )}

      {/* Connected — loading */}
      {isWalletConnected && isLoading && (
        <div
          style={{
            border: `1px solid ${colors.border}`,
            padding: "40px 26px",
            textAlign: "center",
            color: colors.textSoft,
            fontFamily: fonts.mono,
            fontSize: 14,
          }}
        >
          Loading positions…
        </div>
      )}

      {/* Connected — no positions */}
      {isWalletConnected && !isLoading && userPositions.length === 0 && (
        <div
          style={{
            border: `1px solid ${colors.border}`,
            padding: "40px 26px",
            textAlign: "center",
            fontFamily: fonts.mono,
            fontSize: 14,
          }}
        >
          <div style={{ color: colors.text, marginBottom: 4 }}>{address}</div>
          <div style={{ color: colors.textSoft }}>
            No positions yet — place a hypothesis to start your notebook.
          </div>
          <div style={{ marginTop: 16 }}>
            <Link
              to="/"
              style={{
                fontFamily: fonts.label,
                fontSize: 10,
                letterSpacing: ".1em",
                color: colors.violet,
                textDecoration: "none",
              }}
            >
              BROWSE EXPERIMENTS →
            </Link>
          </div>
        </div>
      )}

      {/* Connected — positions list */}
      {isWalletConnected && !isLoading && userPositions.length > 0 && (
        <div style={{ display: "grid", gap: 12 }}>
          {userPositions.map((pos) => (
            <NotebookPositionCard
              key={pos.proposal_id}
              position={pos}
              signingClient={signingClient}
            />
          ))}
        </div>
      )}
    </div>
  );
};
