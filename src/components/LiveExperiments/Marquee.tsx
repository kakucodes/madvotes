import { colors, fonts } from "../../theme";

/**
 * Violet scrolling ticker. Content is duplicated so the -50% keyframe loops
 * seamlessly. Items are sourced from data we actually have (no fabricated
 * global burn totals — those aren't queryable yet).
 */
export const Marquee = ({ items }: { items: string[] }) => {
  const run = `  ●  ${items.join(
    "  ●  "
  )}`;

  return (
    <div
      style={{
        background: colors.violet,
        overflow: "hidden",
        whiteSpace: "nowrap",
        borderBottom: `1px solid ${colors.border}`,
      }}
    >
      <div
        style={{
          display: "inline-block",
          fontFamily: fonts.label,
          fontSize: 11,
          letterSpacing: ".14em",
          color: colors.bg,
          padding: "7px 0",
          animation: "mv-marquee 26s linear infinite",
        }}
      >
        {run}
        {run}
      </div>
    </div>
  );
};
