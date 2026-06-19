import { NavLink } from "react-router-dom";
import { WalletConnectionInfo } from "../WalletConnectionInfo/WalletConnectionInfo";
import { colors, fonts, CONTENT_MAX } from "../../theme";

const navLink = (active: boolean, last = false) => ({
  fontFamily: fonts.label,
  fontSize: 11,
  letterSpacing: ".12em",
  color: active ? colors.violetLight : colors.muted,
  padding: "0 24px",
  borderRight: last ? "none" : `1px solid ${colors.borderSoft}`,
  alignSelf: "center" as const,
  textDecoration: "none",
});

export const AppHeader = () => {
  return (
    <header
      style={{
        borderBottom: `1px solid ${colors.border}`,
        background:
          "radial-gradient(circle at 18% 50%, rgba(139,108,255,.12), transparent 55%)",
      }}
    >
      <div
        style={{
          maxWidth: CONTENT_MAX,
          margin: "0 auto",
          display: "flex",
          alignItems: "stretch",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 11,
            padding: "15px 22px",
            borderRight: `1px solid ${colors.border}`,
          }}
        >
          <img
            src={`${process.env.PUBLIC_URL}/flask.png`}
            alt=""
            className="mv-pixel"
            style={{ width: 26, height: "auto" }}
          />
          <span
            style={{
              fontFamily: fonts.display,
              fontWeight: 700,
              fontSize: 21,
              color: colors.text,
              letterSpacing: ".5px",
            }}
          >
            MADVOTES
          </span>
        </div>

        <nav style={{ flex: 1, display: "flex", alignItems: "center" }}>
          <NavLink to="/" style={({ isActive }) => navLink(isActive)} end>
            EXPERIMENTS
          </NavLink>
          <NavLink to="/notebook" style={({ isActive }) => navLink(isActive)}>
            NOTEBOOK
          </NavLink>
          <NavLink to="/docs" style={({ isActive }) => navLink(isActive, true)}>
            DOCS
          </NavLink>
        </nav>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            padding: "11px 18px",
            borderLeft: `1px solid ${colors.border}`,
          }}
        >
          <WalletConnectionInfo />
        </div>
      </div>
    </header>
  );
};
