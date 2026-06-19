import { Link } from "react-router-dom";
import { useChain } from "@cosmos-kit/react";
import { PROVIDER_CHAIN } from "../../hooks/useMadvotes";
import { colors, fonts, CONTENT_MAX } from "../../theme";

/** Screen 01 — "Enter the lab". Marketing entry point + wallet connect. */
export const Landing = () => {
  const { isWalletConnected, connect } = useChain(PROVIDER_CHAIN);

  return (
    <div
      style={{
        maxWidth: CONTENT_MAX,
        margin: "0 auto",
        padding: "32px 20px 60px",
      }}
    >
      <div
        style={{
          background: colors.bg,
          border: `1px solid ${colors.border}`,
          overflow: "hidden",
          display: "grid",
          gridTemplateColumns: "1.05fr .95fr",
        }}
      >
        {/* pitch */}
        <div
          style={{
            padding: "54px 46px",
            borderRight: `1px solid ${colors.borderSoft}`,
          }}
        >
          <span
            style={{
              fontFamily: fonts.label,
              fontSize: 10,
              color: colors.violetLight,
              letterSpacing: ".16em",
              border: `1px solid ${colors.border}`,
              padding: "7px 11px",
            }}
          >
            COSMOS HUB GOVERNANCE
          </span>
          <div
            style={{
              fontFamily: fonts.display,
              fontWeight: 700,
              fontSize: 58,
              color: colors.text,
              lineHeight: 0.98,
              letterSpacing: ".5px",
              margin: "24px 0 0",
            }}
          >
            EVERYTHING
            <br />
            IS AN
            <br />
            <span style={{ color: colors.violet }}>EXPERIMENT.</span>
          </div>
          <div
            style={{
              fontFamily: fonts.mono,
              fontSize: 15,
              color: colors.textDim,
              lineHeight: 1.6,
              marginTop: 22,
              maxWidth: 430,
            }}
          >
            Stake ATOM on how a live Hub proposal resolves — Passed, Rejected,
            Veto-Rejected or Quorum-Failed. Settled by the chain itself. No
            oracle, no house.
          </div>
          <div style={{ display: "flex", gap: 12, marginTop: 30 }}>
            <Stat title="🔥 5% burn" sub="EVERY EXPERIMENT · DEFLATIONARY" />
            <Stat title="⏱ early edge" sub="CALL IT SOONER · CLAIM MORE" />
          </div>
        </div>

        {/* art + connect */}
        <div
          style={{
            padding: "40px 46px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 26,
            background:
              "radial-gradient(circle at 70% 30%, rgba(139,108,255,.10), transparent 60%)",
          }}
        >
          <div
            style={{
              position: "relative",
              width: "100%",
              backgroundImage: `url(${process.env.PUBLIC_URL}/banner_move.gif)`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          >
            <img
              src={`${process.env.PUBLIC_URL}/vote-scientist.png`}
              alt="vote"
              className="mv-pixel"
              style={{
                width: 300,
                height: "auto",
                display: "block",
                margin: "0 auto",
                // animation: "mv-bob 5s ease-in-out infinite",
              }}
            />
          </div>

          {isWalletConnected ? (
            <Link
              to="/experiments"
              style={{
                width: "100%",
                maxWidth: 330,
                textAlign: "center",
                textDecoration: "none",
                background: colors.violet,
                color: colors.bg,
                fontFamily: fonts.display,
                fontWeight: 700,
                fontSize: 18,
                letterSpacing: ".5px",
                padding: 14,
              }}
            >
              ENTER THE LAB →
            </Link>
          ) : (
            <div
              style={{
                width: "100%",
                maxWidth: 330,
                border: `1px solid ${colors.violet}`,
              }}
            >
              <div
                style={{
                  fontFamily: fonts.label,
                  fontSize: 10,
                  color: colors.violetLight,
                  letterSpacing: ".12em",
                  padding: "11px 14px",
                  borderBottom: `1px solid ${colors.border}`,
                  background: "rgba(139,108,255,.1)",
                }}
              >
                CONNECT TO BEGIN
              </div>
              <div
                style={{
                  padding: 12,
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                }}
              >
                <WalletRow letter="K" name="Keplr" onClick={() => connect()} />
                <WalletRow letter="L" name="Leap" onClick={() => connect()} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const Stat = ({ title, sub }: { title: string; sub: string }) => (
  <div
    style={{
      border: `1px solid ${colors.border}`,
      padding: "13px 16px",
      flex: 1,
    }}
  >
    <div
      style={{
        fontFamily: fonts.display,
        fontWeight: 700,
        fontSize: 20,
        color: colors.text,
      }}
    >
      {title}
    </div>
    <div
      style={{
        fontFamily: fonts.label,
        fontSize: 9,
        color: colors.muted,
        letterSpacing: ".08em",
        marginTop: 6,
      }}
    >
      {sub}
    </div>
  </div>
);

const WalletRow = ({
  letter,
  name,
  onClick,
}: {
  letter: string;
  name: string;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    style={{
      display: "flex",
      alignItems: "center",
      gap: 11,
      border: `1px solid ${colors.border}`,
      background: "transparent",
      padding: "11px 13px",
      cursor: "pointer",
      textAlign: "left",
    }}
  >
    <span
      style={{
        width: 26,
        height: 26,
        background: "#1a1530",
        border: "1px solid #3a3358",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 13,
        color: colors.violetLight,
      }}
    >
      {letter}
    </span>
    <span
      style={{
        flex: 1,
        fontFamily: fonts.mono,
        fontSize: 14,
        color: colors.text,
      }}
    >
      {name}
    </span>
    <span style={{ color: colors.muted }}>›</span>
  </button>
);
