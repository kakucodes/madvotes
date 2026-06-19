import { colors, fonts, CONTENT_MAX } from "../../theme";

export const Docs = () => (
  <div style={{ maxWidth: CONTENT_MAX, margin: "0 auto", padding: "24px 26px 90px" }}>
    <div
      style={{
        fontFamily: fonts.display,
        fontWeight: 700,
        fontSize: 26,
        color: colors.text,
        marginBottom: 18,
      }}
    >
      DOCS
    </div>
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
      How MadVotes works — staking ATOM on Hub proposal outcomes, the reagent
      burn, and early-observer weighting. Coming soon.
    </div>
  </div>
);
