import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { MarketResponse, Outcome } from "../../codegen/Madvotes.types";
import { MadvotesMsgComposer } from "../../codegen/Madvotes.message-composer";
import { useMadvotesSigningClient } from "../../hooks/useMadvotes";
import { DENOM, EXPLORER_TX, MADVOTES_CONTRACT_ADDRESS } from "../../utils/constants";
import { formatAtom } from "../../utils/format";
import { Slip } from "../../utils/bet";
import { colors, fonts, outcomeColor, outcomeLabel } from "../../theme";

type Status = "idle" | "signing" | "success" | "error";

/** Pull the most informative string + dump every own field for the console. */
function describeError(e: unknown): string {
  if (e instanceof Error) {
    try {
      const own = JSON.stringify(e, Object.getOwnPropertyNames(e));
      console.error("[madvotes] error fields:", own);
    } catch {
      /* circular — ignore */
    }
    return e.stack ? `${e.name}: ${e.message}` : e.message;
  }
  return String(e);
}

const Row = ({
  label,
  value,
  color = colors.text,
}: {
  label: string;
  value: React.ReactNode;
  color?: string;
}) => (
  <div style={{ display: "flex", justifyContent: "space-between" }}>
    <span>{label}</span>
    <b style={{ color }}>{value}</b>
  </div>
);

export const ConfirmModal = ({
  market,
  outcome,
  stakeMicro,
  slip,
  onClose,
}: {
  market: MarketResponse;
  outcome: Outcome;
  stakeMicro: bigint;
  slip: Slip;
  onClose: () => void;
}) => {
  const {
    data: signingClient,
    error: clientError,
    isFetching: clientConnecting,
  } = useMadvotesSigningClient();
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<Status>("idle");
  const [txHash, setTxHash] = useState("");
  const [errMsg, setErrMsg] = useState("");

  // Surface a failed client connect (the queryFn error is otherwise swallowed).
  useEffect(() => {
    if (clientError) {
      console.error("[madvotes] signing client connect failed:", clientError);
      setErrMsg(describeError(clientError));
      setStatus("error");
    }
  }, [clientError]);

  const sign = async () => {
    if (!signingClient) {
      console.warn("[madvotes] sign() with no signing client", {
        clientConnecting,
        clientError,
      });
      return;
    }

    const funds = [{ denom: DENOM, amount: stakeMicro.toString() }];
    const params = { outcome, proposalId: market.proposal_id };
    console.log("[madvotes] placeBet →", {
      contract: MADVOTES_CONTRACT_ADDRESS,
      sender: signingClient.sender,
      params,
      funds,
      fee: "auto",
    });

    setStatus("signing");
    try {
      // Build the execute msg with the composer and broadcast via
      // signAndBroadcast instead of the generated placeBet (which routes through
      // cosmjs `execute` → parseRawLog). SDK 0.50 returns an empty raw_log for
      // successful txs, and cosmjs 0.32's JSON.parse("") throws on it even though
      // the tx succeeded. signAndBroadcast skips that parse; we check `code`.
      const composer = new MadvotesMsgComposer(
        signingClient.sender,
        signingClient.contractAddress
      );
      const msg = composer.placeBet(params, funds);
      const res = await signingClient.client.signAndBroadcast(
        signingClient.sender,
        [msg],
        "auto"
      );
      console.log("[madvotes] broadcast result", {
        code: res.code,
        txHash: res.transactionHash,
        gasUsed: res.gasUsed?.toString(),
        height: res.height,
        rawLog: res.rawLog,
      });
      if (res.code !== 0) {
        throw new Error(`tx failed (code ${res.code}): ${res.rawLog || "no log"}`);
      }
      setTxHash(res.transactionHash);
      setStatus("success");
      // Refresh pools/markets so the new stake shows up.
      queryClient.invalidateQueries({ queryKey: ["madvotesGetPools"] });
      queryClient.invalidateQueries({ queryKey: ["madvotesGetMarket"] });
      queryClient.invalidateQueries({ queryKey: ["madvotesListMarkets"] });
    } catch (e) {
      console.error("[madvotes] placeBet ✗ raw error:", e);
      setErrMsg(describeError(e));
      setStatus("error");
    }
  };

  return (
    <div
      onClick={status === "signing" ? undefined : onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 50,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(5,4,12,.66)",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 430,
          margin: "0 16px",
          background: colors.panel,
          border: `1px solid ${colors.violet}`,
          boxShadow: "0 0 40px rgba(139,108,255,.18)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "14px 18px",
            borderBottom: `1px solid ${colors.border}`,
            background: "rgba(139,108,255,.1)",
          }}
        >
          <span
            style={{
              fontFamily: fonts.display,
              fontWeight: 700,
              fontSize: 19,
              color: colors.text,
              letterSpacing: ".5px",
            }}
          >
            {status === "success" ? "HYPOTHESIS RECORDED" : "CONFIRM HYPOTHESIS"}
          </span>
          <span
            onClick={onClose}
            style={{ color: colors.textSoft, cursor: "pointer" }}
          >
            ✕
          </span>
        </div>

        <div style={{ padding: 18 }}>
          {status === "success" ? (
            <div style={{ textAlign: "center" }}>
              <img
                src={`${process.env.PUBLIC_URL}/flask.png`}
                alt=""
                className="mv-pixel"
                style={{ width: 64, height: "auto" }}
              />
              <div
                style={{
                  fontFamily: fonts.display,
                  fontWeight: 700,
                  fontSize: 24,
                  color: colors.passed,
                  marginTop: 10,
                }}
              >
                {formatAtom(slip.net.toString())} ATOM STAKED
              </div>
              <a
                href={`${EXPLORER_TX}${txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "inline-block",
                  fontFamily: fonts.mono,
                  fontSize: 12,
                  color: colors.violetLight,
                  marginTop: 8,
                  wordBreak: "break-all",
                }}
              >
                view on mintscan ↗
              </a>
              <div
                style={{
                  fontFamily: fonts.mono,
                  fontSize: 11,
                  color: colors.muted,
                  marginTop: 4,
                  wordBreak: "break-all",
                }}
              >
                {txHash}
              </div>
              <button onClick={onClose} style={buttonStyle}>
                BACK TO EXPERIMENT
              </button>
            </div>
          ) : (
            <>
              <div
                style={{
                  border: `1px solid ${colors.border}`,
                  padding: "12px 14px",
                  marginBottom: 14,
                }}
              >
                <div
                  style={{
                    fontFamily: fonts.label,
                    fontSize: 9,
                    color: colors.muted,
                    letterSpacing: ".1em",
                  }}
                >
                  EXPERIMENT
                </div>
                <div style={{ fontSize: 15, color: colors.text, margin: "5px 0 9px" }}>
                  EXP-{market.proposal_id} · {market.title}
                </div>
                <span
                  style={{
                    border: `1px solid ${outcomeColor[outcome]}`,
                    color: outcomeColor[outcome],
                    padding: "3px 10px",
                    fontSize: 13,
                  }}
                >
                  hypothesis · {outcomeLabel[outcome]}
                </span>
              </div>

              <div
                style={{
                  fontFamily: fonts.mono,
                  fontSize: 13,
                  color: colors.textDim,
                  lineHeight: 2,
                  border: `1px solid ${colors.border}`,
                  padding: "11px 14px",
                  background: "rgba(139,108,255,.04)",
                }}
              >
                <Row label="stake" value={`${formatAtom(stakeMicro.toString())} ATOM`} />
                <Row
                  label="reagent burn 5% 🔥"
                  value={`− ${formatAtom(slip.burn.toString())}`}
                  color={colors.violetLight}
                />
                <Row label="net credited" value={`${formatAtom(slip.net.toString())} ATOM`} />
                <Row
                  label="projected yield"
                  value={`≈ ${formatAtom(slip.projected.toString())}`}
                  color={colors.passed}
                />
              </div>

              <div
                style={{
                  fontFamily: fonts.label,
                  fontSize: 9,
                  color: colors.muted,
                  letterSpacing: ".06em",
                  lineHeight: 1.7,
                  margin: "13px 2px",
                }}
              >
                ⚠ HYPOTHESES ARE FINAL ONCE SIGNED. YIELD DEPENDS ON THE FINAL
                POOL &amp; ON-CHAIN RESULT.
              </div>

              {status === "error" && (
                <div
                  style={{
                    fontFamily: fonts.mono,
                    fontSize: 12,
                    color: colors.rejected,
                    marginBottom: 12,
                    wordBreak: "break-word",
                  }}
                >
                  {errMsg}
                </div>
              )}

              <button
                onClick={sign}
                disabled={!signingClient || status === "signing"}
                style={{
                  ...buttonStyle,
                  marginTop: 0,
                  opacity: !signingClient || status === "signing" ? 0.6 : 1,
                }}
              >
                {status === "signing"
                  ? "WAITING FOR SIGNATURE…"
                  : status === "error"
                  ? "TRY AGAIN →"
                  : "SIGN IN WALLET →"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

const buttonStyle: React.CSSProperties = {
  width: "100%",
  border: "none",
  background: colors.violet,
  color: colors.text,
  fontFamily: fonts.display,
  fontWeight: 700,
  fontSize: 18,
  letterSpacing: ".5px",
  padding: 13,
  marginTop: 14,
  cursor: "pointer",
};
