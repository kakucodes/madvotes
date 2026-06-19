import { useState } from "react";
import { useChain } from "@cosmos-kit/react";
import { Outcome, OutcomeAccum } from "../../codegen/Madvotes.types";
import { ExperimentListing } from "../../utils/govProposal";
import { PROVIDER_CHAIN } from "../../hooks/useMadvotes";
import { MIN_BET_UATOM } from "../../utils/constants";
import { atomToMicro, computeSlip } from "../../utils/bet";
import { betWeight, normalizedWeightAt } from "../../utils/betWeight";
import { formatAtom } from "../../utils/format";
import { colors, fonts, outcomeColor, outcomeLabel } from "../../theme";
import { ConfirmModal } from "./ConfirmModal";

const ORDER: Outcome[] = ["passed", "rejected", "veto_rejected", "quorum_failed"];

export const HypothesisSlip = ({
  listing,
  pools,
}: {
  listing: ExperimentListing;
  pools: OutcomeAccum[];
}) => {
  const { isWalletConnected, connect } = useChain(PROVIDER_CHAIN);
  const [outcome, setOutcome] = useState<Outcome>("passed");
  const [stake, setStake] = useState("100");
  const [confirming, setConfirming] = useState(false);

  const stakeMicro = atomToMicro(stake);
  const nowSec = Math.floor(Date.now() / 1000);
  const weight = betWeight(
    BigInt(listing.votingStartTime),
    BigInt(listing.votingEndTime),
    BigInt(nowSec)
  );
  const multiplier = (Number(weight) / 1_000_000).toFixed(2);
  // Where the bet lands along the open→close axis, for the curve marker.
  const duration = listing.votingEndTime - listing.votingStartTime;
  const elapsed =
    duration > 0
      ? Math.min(1, Math.max(0, (nowSec - listing.votingStartTime) / duration))
      : 1;
  const slip = computeSlip(stakeMicro, weight, pools, outcome);
  const belowMin = stakeMicro < MIN_BET_UATOM;

  return (
    <div style={{ border: `1px solid ${colors.violet}` }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "13px 16px",
          borderBottom: `1px solid ${colors.border}`,
          background: "rgba(139,108,255,.1)",
        }}
      >
        <span
          style={{
            fontFamily: fonts.display,
            fontWeight: 700,
            fontSize: 18,
            color: colors.text,
            letterSpacing: ".5px",
          }}
        >
          HYPOTHESIS SLIP
        </span>
        <span
          style={{
            fontFamily: fonts.label,
            fontSize: 9,
            color: colors.violetLight,
            letterSpacing: ".1em",
          }}
        >
          EXP-{listing.proposalId}
        </span>
      </div>

      <div style={{ padding: 16 }}>
        <Label>YOUR CALL</Label>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 7, marginBottom: 14 }}>
          {ORDER.map((o) => {
            const active = o === outcome;
            return (
              <button
                key={o}
                onClick={() => setOutcome(o)}
                style={{
                  textAlign: "center",
                  border: `1px solid ${active ? outcomeColor[o] : colors.border}`,
                  color: active ? outcomeColor[o] : colors.textSoft,
                  background: active ? `${outcomeColor[o]}14` : "transparent",
                  padding: 9,
                  fontSize: 13,
                  fontFamily: fonts.mono,
                }}
              >
                {outcomeLabel[o]} {active ? "✓" : ""}
              </button>
            );
          })}
        </div>

        <Label>STAKE</Label>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            border: `1px solid ${belowMin ? colors.rejected : colors.border}`,
            padding: "12px 14px",
            marginBottom: belowMin ? 6 : 14,
          }}
        >
          <input
            value={stake}
            onChange={(e) => setStake(e.target.value)}
            inputMode="decimal"
            style={{
              flex: 1,
              border: "none",
              outline: "none",
              background: "transparent",
              fontFamily: fonts.mono,
              fontWeight: 700,
              fontSize: 24,
              color: colors.text,
            }}
          />
          <span style={{ fontFamily: fonts.mono, fontSize: 13, color: colors.muted }}>
            ATOM
          </span>
        </div>
        {belowMin && (
          <div style={{ fontSize: 11, color: colors.rejected, marginBottom: 14 }}>
            Minimum bet is {formatAtom(MIN_BET_UATOM.toString())} ATOM.
          </div>
        )}

        <div
          style={{
            border: `1px solid ${colors.border}`,
            padding: 12,
            marginBottom: 14,
          }}
        >
          <Label>EARLY-OBSERVER CURVE</Label>
          <EarlyObserverCurve elapsed={elapsed} />
          <div
            style={{
              fontFamily: fonts.hand,
              fontSize: 18,
              color: colors.violetLight,
              textAlign: "center",
              marginTop: 4,
            }}
          >
            your slip lands at ×{multiplier}
          </div>
        </div>

        <div
          style={{
            fontFamily: fonts.mono,
            fontSize: 13,
            color: colors.textDim,
            lineHeight: 2,
            borderTop: `1px solid ${colors.borderSoft}`,
            paddingTop: 10,
          }}
        >
          <Line label="stake" value={formatAtom(stakeMicro.toString())} />
          <Line
            label="reagent burn 5% 🔥"
            value={`− ${formatAtom(slip.burn.toString())}`}
            color={colors.violetLight}
          />
          <Line label="net credited" value={formatAtom(slip.net.toString())} />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ color: colors.textDim }}>max yield</span>
            <span style={{ fontFamily: fonts.display, fontSize: 20, color: colors.passed }}>
              ≈ {formatAtom(slip.projected.toString())}
            </span>
          </div>
        </div>

        {isWalletConnected ? (
          <button
            onClick={() => setConfirming(true)}
            disabled={belowMin}
            style={{ ...runButton, opacity: belowMin ? 0.5 : 1 }}
          >
            RUN HYPOTHESIS →
          </button>
        ) : (
          <button onClick={() => connect()} style={runButton}>
            CONNECT WALLET
          </button>
        )}
      </div>

      {confirming && (
        <ConfirmModal
          listing={listing}
          outcome={outcome}
          stakeMicro={stakeMicro}
          slip={slip}
          onClose={() => setConfirming(false)}
        />
      )}
    </div>
  );
};

/**
 * The exponential early-observer weight plotted across the voting window
 * (open → close), with a dot marking where the current bet lands. The curve is
 * sampled from the same betWeight used on-chain, so it's the real weighting.
 */
const EarlyObserverCurve = ({ elapsed }: { elapsed: number }) => {
  const X0 = 24;
  const X1 = 272;
  const Y_TOP = 10;
  const Y_BASE = 74;
  const SAMPLES = 48;
  const xAt = (p: number) => X0 + p * (X1 - X0);
  const yAt = (wNorm: number) => Y_BASE - wNorm * (Y_BASE - Y_TOP);

  const points = Array.from({ length: SAMPLES + 1 }, (_, i) => {
    const p = i / SAMPLES; // fraction of the window elapsed
    return `${xAt(p).toFixed(1)},${yAt(normalizedWeightAt(1 - p)).toFixed(1)}`;
  }).join(" ");

  const p = Math.min(1, Math.max(0, elapsed));
  const dotX = xAt(p);
  const dotY = yAt(normalizedWeightAt(1 - p));

  return (
    <svg viewBox="0 0 280 90" style={{ width: "100%", height: "auto", display: "block" }}>
      <line x1={X0} y1="8" x2={X0} y2={Y_BASE} stroke={colors.border} strokeWidth="1" />
      <line x1={X0} y1={Y_BASE} x2={X1} y2={Y_BASE} stroke={colors.border} strokeWidth="1" />
      <polyline fill="none" stroke={colors.violet} strokeWidth="2.5" points={points} />
      <circle cx={dotX} cy={dotY} r="5" fill={colors.violet} stroke={colors.bg} strokeWidth="2" />
      <text x="40" y="88" fontFamily="Silkscreen, monospace" fontSize="8" fill={colors.muted}>
        OPEN
      </text>
      <text x="232" y="88" fontFamily="Silkscreen, monospace" fontSize="8" fill={colors.muted}>
        CLOSE
      </text>
    </svg>
  );
};

const Label = ({ children }: { children: React.ReactNode }) => (
  <div
    style={{
      fontFamily: fonts.label,
      fontSize: 9,
      color: colors.muted,
      letterSpacing: ".1em",
      marginBottom: 8,
    }}
  >
    {children}
  </div>
);

const Line = ({
  label,
  value,
  color = colors.text,
}: {
  label: string;
  value: string;
  color?: string;
}) => (
  <div style={{ display: "flex", justifyContent: "space-between" }}>
    <span>{label}</span>
    <span style={{ color }}>{value}</span>
  </div>
);

const runButton: React.CSSProperties = {
  width: "100%",
  border: "none",
  background: colors.violet,
  color: colors.text,
  fontFamily: fonts.display,
  fontWeight: 700,
  fontSize: 18,
  letterSpacing: ".5px",
  padding: 14,
  marginTop: 14,
  cursor: "pointer",
};
