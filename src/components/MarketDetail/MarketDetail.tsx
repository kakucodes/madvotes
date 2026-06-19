import { Link, useParams } from "react-router-dom";
import { useMadvotesQueryClient } from "../../hooks/useMadvotes";
import { useChainProposals } from "../../hooks/useChainProposals";
import { useMediaQuery } from "../../hooks/useMediaQuery";
import {
  useMadvotesGetMarketQuery,
  useMadvotesGetPoolsQuery,
} from "../../codegen/Madvotes.react-query";
import { Outcome } from "../../codegen/Madvotes.types";
import {
  listingFromMarket,
  listingFromProposal,
} from "../../utils/govProposal";
import { colors, fonts, outcomeColor, outcomeLabel, CONTENT_MAX } from "../../theme";
import { formatAtom, impliedCents, timeLeft } from "../../utils/format";
import { HypothesisSlip } from "./HypothesisSlip";

const ORDER: Outcome[] = ["passed", "rejected", "veto_rejected", "quorum_failed"];

export const MarketDetail = () => {
  const { proposalId } = useParams();
  const id = Number(proposalId);
  // Below ~820px the odds-grid / hypothesis-slip split is too tight, so stack.
  const stacked = useMediaQuery("(max-width: 820px)");
  const wrap = {
    maxWidth: CONTENT_MAX,
    margin: "0 auto",
    padding: stacked ? "16px 14px 70px" : "20px 26px 90px",
  };
  const { data: client } = useMadvotesQueryClient();

  // The market may not be registered yet — getMarket will error in that case,
  // so we fall back to the chain proposal and register-on-first-bet.
  const { data: market, isLoading: marketLoading } = useMadvotesGetMarketQuery({
    client,
    args: { proposalId: id },
    options: { enabled: Number.isFinite(id), retry: false },
  });
  const { data: chainProposals, isLoading: proposalsLoading } =
    useChainProposals();
  const chainProposal = chainProposals?.find((p) => p.id === id);

  // Pools only exist for a registered market.
  const { data: poolsRes } = useMadvotesGetPoolsQuery({
    client,
    args: { proposalId: id },
    options: { enabled: Number.isFinite(id) && !!market },
  });
  const pools = poolsRes?.pools ?? [];
  const poolTotal = pools.reduce((sum, p) => sum + Number(p.net), 0);

  const listing = market
    ? listingFromMarket(market)
    : chainProposal
    ? listingFromProposal(chainProposal)
    : undefined;

  const crumb = (
    <Link to="/experiments" style={{ fontFamily: fonts.mono, fontSize: 12, color: colors.muted }}>
      ← EXPERIMENTS
    </Link>
  );

  if (!Number.isFinite(id)) {
    return <div style={wrap}>{crumb}<Notice>Invalid experiment id.</Notice></div>;
  }
  if (!listing) {
    if (!client || marketLoading || proposalsLoading) {
      return <div style={wrap}>{crumb}<Notice>Loading experiment…</Notice></div>;
    }
    return (
      <div style={wrap}>
        {crumb}
        <Notice color={colors.rejected}>Experiment not found.</Notice>
      </div>
    );
  }

  const settled = listing.status === "settled";

  return (
    <div style={wrap}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        {crumb}
        <span
          style={{
            fontFamily: fonts.label,
            fontSize: 10,
            letterSpacing: ".12em",
            color: settled ? colors.muted : colors.passed,
          }}
        >
          {settled ? "✓ CONCLUDED" : `● RUNNING · ENDS ${timeLeft(listing.votingEndTime)}`}
        </span>
      </div>

      <div
        style={{
          fontFamily: fonts.display,
          fontWeight: 700,
          fontSize: "clamp(24px, 6vw, 33px)",
          color: colors.text,
          lineHeight: 1.05,
          letterSpacing: ".5px",
          margin: "10px 0 6px",
        }}
      >
        EXP-{listing.proposalId} · {listing.title}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", border: `1px solid ${colors.border}`, margin: "16px 0 20px" }}>
        <Stat label="POOL VOLUME" value={poolTotal ? formatAtom(poolTotal) : "—"} />
        <Stat label="ENDS IN" value={settled ? "—" : timeLeft(listing.votingEndTime)} />
        <Stat
          label="STATUS"
          value={listing.registered ? listing.status.toUpperCase() : "NEW"}
          last
        />
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: stacked ? "1fr" : "1.5fr 1fr",
          gap: 18,
          alignItems: "start",
        }}
      >
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", border: `1px solid ${colors.border}` }}>
          {ORDER.map((o, i) => {
            const cents = impliedCents(pools, o);
            const net = pools.find((p) => p.outcome === o)?.net ?? "0";
            return (
              <div
                key={o}
                style={{
                  position: "relative",
                  padding: 16,
                  borderRight: i % 2 === 0 ? `1px solid ${colors.borderSoft}` : undefined,
                  borderBottom: i < 2 ? `1px solid ${colors.borderSoft}` : undefined,
                }}
              >
                <div style={{ position: "absolute", top: 0, left: 0, width: 3, height: "100%", background: outcomeColor[o] }} />
                <div style={{ fontSize: 14, color: colors.textDim }}>{outcomeLabel[o]}</div>
                <div
                  style={{
                    fontFamily: fonts.display,
                    fontWeight: 700,
                    fontSize: 32,
                    color: outcomeColor[o],
                    lineHeight: 1,
                    margin: "4px 0",
                  }}
                >
                  {cents == null ? "—" : `${cents}¢`}
                </div>
                <div style={{ fontFamily: fonts.label, fontSize: 9, color: colors.muted, letterSpacing: ".08em" }}>
                  POOL {formatAtom(net)}
                </div>
              </div>
            );
          })}
        </div>

        {settled ? (
          <div style={{ border: `1px solid ${colors.border}`, padding: 16 }}>
            <div style={{ fontFamily: fonts.display, fontWeight: 700, fontSize: 18, color: colors.text, marginBottom: 10 }}>
              RESULT
            </div>
            <div style={{ fontSize: 15, color: colors.textDim }}>
              →{" "}
              <b style={{ color: listing.market?.winning_outcome ? outcomeColor[listing.market.winning_outcome] : colors.text }}>
                {listing.market?.winning_outcome ? outcomeLabel[listing.market.winning_outcome] : "—"}
              </b>
            </div>
          </div>
        ) : (
          <HypothesisSlip listing={listing} pools={pools} />
        )}
      </div>
    </div>
  );
};

const Stat = ({ label, value, last }: { label: string; value: string; last?: boolean }) => (
  <div style={{ padding: "13px 12px", borderRight: last ? undefined : `1px solid ${colors.borderSoft}` }}>
    <div style={{ fontFamily: fonts.label, fontSize: 9, color: colors.muted, letterSpacing: ".1em" }}>{label}</div>
    <div
      style={{
        fontFamily: fonts.mono,
        fontSize: "clamp(15px, 4.5vw, 20px)",
        color: colors.text,
        marginTop: 4,
        whiteSpace: "nowrap",
      }}
    >
      {value}
    </div>
  </div>
);

const Notice = ({ children, color = colors.textSoft }: { children: React.ReactNode; color?: string }) => (
  <div style={{ fontSize: 13, color, marginTop: 16 }}>{children}</div>
);
