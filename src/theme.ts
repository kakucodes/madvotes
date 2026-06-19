import { Outcome } from "./codegen/Madvotes.types";

/**
 * Design tokens for the Cosmos Violet build, mirrored from src/index.css so
 * they can be used in inline styles within TSX. Keep the two in sync.
 */
export const colors = {
  bg: "#0b0a16",
  panel: "#0d0b1a",
  border: "#2a2542",
  borderSoft: "#1e1a30",
  borderFaint: "#14101f",
  violet: "#8b6cff",
  violetLight: "#a78bff",
  text: "#ffffff",
  textDim: "#b3adc9",
  textSoft: "#8780a0",
  muted: "#6b6585",
  passed: "#4eef5a",
  rejected: "#ff6060",
  veto: "#d36bff",
  quorum: "#7d88a3",
} as const;

/** Shared max content width; bars are full-bleed, inner content centers to this. */
export const CONTENT_MAX = 1280;

export const fonts = {
  display: '"Pixelify Sans", sans-serif',
  label: '"Silkscreen", monospace',
  mono: '"Space Mono", monospace',
  hand: '"Caveat", cursive',
} as const;

/** Outcome → accent color, matching the hi-fi odds grid. */
export const outcomeColor: Record<Outcome, string> = {
  passed: colors.passed,
  rejected: colors.rejected,
  veto_rejected: colors.veto,
  quorum_failed: colors.quorum,
};

/** Outcome → human label used across cards and slips. */
export const outcomeLabel: Record<Outcome, string> = {
  passed: "Passed",
  rejected: "Rejected",
  veto_rejected: "Veto-Rejected",
  quorum_failed: "Quorum-Failed",
};
