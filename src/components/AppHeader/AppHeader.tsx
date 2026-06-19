import { useEffect, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { WalletConnectionInfo } from "../WalletConnectionInfo/WalletConnectionInfo";
import { useMediaQuery } from "../../hooks/useMediaQuery";
import { colors, fonts, CONTENT_MAX } from "../../theme";

const navLink = (
  active: boolean,
  opts: { mobile?: boolean; last?: boolean } = {}
) => ({
  fontFamily: fonts.label,
  fontSize: opts.mobile ? 12 : 11,
  letterSpacing: ".12em",
  color: active ? colors.violetLight : colors.muted,
  textDecoration: "none",
  ...(opts.mobile
    ? {
        display: "block",
        padding: "15px 22px",
        borderBottom: opts.last ? "none" : `1px solid ${colors.borderSoft}`,
      }
    : {
        padding: "0 24px",
        borderRight: opts.last ? "none" : `1px solid ${colors.borderSoft}`,
        alignSelf: "center" as const,
      }),
});

const LINKS: { to: string; label: string }[] = [
  { to: "/experiments", label: "EXPERIMENTS" },
  { to: "/notebook", label: "NOTEBOOK" },
  { to: "/docs", label: "DOCS" },
];

export const AppHeader = () => {
  // Below ~720px the inline nav doesn't fit alongside the logo + wallet, so
  // collapse it behind a hamburger toggle.
  const isMobile = useMediaQuery("(max-width: 720px)");
  const [menuOpen, setMenuOpen] = useState(false);

  // Never leave the dropdown stuck open when the viewport grows back to desktop.
  useEffect(() => {
    if (!isMobile) setMenuOpen(false);
  }, [isMobile]);

  return (
    <header
      style={{
        borderBottom: `1px solid ${colors.border}`,
        background:
          "radial-gradient(circle at 18% 50%, rgba(139,108,255,.12), transparent 55%)",
      }}
    >
      <div style={{ maxWidth: CONTENT_MAX, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "stretch" }}>
          <Link
            to="/"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 11,
              padding: "15px 22px",
              borderRight: `1px solid ${colors.border}`,
              textDecoration: "none",
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
          </Link>

          {isMobile ? (
            <span style={{ flex: 1 }} />
          ) : (
            <nav style={{ flex: 1, display: "flex", alignItems: "center" }}>
              {LINKS.map((l, i) => (
                <NavLink
                  key={l.to}
                  to={l.to}
                  style={({ isActive }) =>
                    navLink(isActive, { last: i === LINKS.length - 1 })
                  }
                >
                  {l.label}
                </NavLink>
              ))}
            </nav>
          )}

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

          {isMobile && (
            <button
              onClick={() => setMenuOpen((o) => !o)}
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              aria-expanded={menuOpen}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "transparent",
                border: "none",
                borderLeft: `1px solid ${colors.border}`,
                color: colors.text,
                fontSize: 20,
                padding: "0 18px",
                cursor: "pointer",
              }}
            >
              {menuOpen ? "✕" : "☰"}
            </button>
          )}
        </div>

        {isMobile && menuOpen && (
          <nav style={{ borderTop: `1px solid ${colors.border}` }}>
            {LINKS.map((l, i) => (
              <NavLink
                key={l.to}
                to={l.to}
                onClick={() => setMenuOpen(false)}
                style={({ isActive }) =>
                  navLink(isActive, { mobile: true, last: i === LINKS.length - 1 })
                }
              >
                {l.label}
              </NavLink>
            ))}
          </nav>
        )}
      </div>
    </header>
  );
};
