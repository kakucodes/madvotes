import { useMadvotesListMarketsQuery } from "../../codegen/Madvotes.react-query";
import { useMadvotesQueryClient } from "../../hooks/useMadvotes";
import { useChainProposals } from "../../hooks/useChainProposals";
import { useMediaQuery } from "../../hooks/useMediaQuery";
import {
  ExperimentListing,
  listingFromMarket,
  listingFromProposal,
} from "../../utils/govProposal";
import { colors, fonts, CONTENT_MAX } from "../../theme";
import { ExperimentCard } from "./ExperimentCard";
import { Marquee } from "./Marquee";

const chip = {
  fontFamily: fonts.mono,
  fontSize: 12,
  color: colors.textSoft,
  border: `1px solid ${colors.border}`,
  padding: "7px 12px",
};

const Notice = ({
  children,
  color = colors.textSoft,
}: {
  children: React.ReactNode;
  color?: string;
}) => <span style={{ fontSize: 13, color }}>{children}</span>;

const EmptyState = () => (
  <div
    style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: 14,
      padding: "56px 20px",
      textAlign: "center",
      background:
        "radial-gradient(circle at 50% 30%, rgba(139,108,255,.10), transparent 60%)",
    }}
  >
    <img
      src={`${process.env.PUBLIC_URL}/vote.png`}
      alt=""
      className="mv-pixel"
      style={{ width: 120, height: "auto", animation: "mv-bob 5s ease-in-out infinite" }}
    />
    <div
      style={{
        fontFamily: fonts.display,
        fontWeight: 700,
        fontSize: 24,
        color: colors.text,
      }}
    >
      NO EXPERIMENTS RUNNING
    </div>
    <div style={{ fontFamily: fonts.mono, fontSize: 13, color: colors.textSoft, maxWidth: 420 }}>
      Once a Hub proposal is registered as a market, it shows up here to stake
      ATOM on. Everything is an experiment.
    </div>
  </div>
);

export const LiveExperiments = () => {
  const compact = useMediaQuery("(max-width: 720px)");
  // undefined until the read-only client connects; the generated query hook
  // stays disabled until then.
  const { data: client } = useMadvotesQueryClient();
  const { data, isLoading, error } = useMadvotesListMarketsQuery({
    client,
    args: {},
  });
  // Voting-period proposals straight from the chain — these may not be
  // registered as markets yet, but we still want to show (and bet on) them.
  const { data: chainProposals } = useChainProposals();

  // Merge contract markets with chain proposals, keyed by proposal id. A
  // registered market wins over the bare chain proposal (it has live pools and
  // a settled state); unregistered proposals fill in the rest.
  const byId = new Map<number, ExperimentListing>();
  for (const proposal of chainProposals ?? []) {
    byId.set(proposal.id, listingFromProposal(proposal));
  }
  for (const market of data?.markets ?? []) {
    byId.set(market.proposal_id, listingFromMarket(market));
  }

  // Newest first — governance proposal IDs increment, so the highest ID is the
  // most recent experiment.
  const listings = [...byId.values()].sort(
    (a, b) => b.proposalId - a.proposalId
  );
  // "Running" = open and still inside its voting window. Expired-but-unsettled
  // markets are open on the contract but no longer bettable, so exclude them.
  const nowMs = Date.now();
  const running = listings.filter(
    (l) => l.status === "open" && l.votingEndTime * 1000 > nowMs
  ).length;
  const connecting = isLoading || !client;

  return (
    <>
      <Marquee
        items={[
          "EVERYTHING IS AN EXPERIMENT",
          `${running} EXPERIMENT${running === 1 ? "" : "S"} RUNNING`,
          "STAKE ATOM ON HOW THE HUB VOTES",
          "SETTLED BY THE CHAIN · NO ORACLE",
        ]}
      />

      <div
        style={{
          maxWidth: CONTENT_MAX,
          margin: "0 auto",
          padding: compact ? "20px 14px 70px" : "24px 26px 90px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 12,
            marginBottom: 18,
          }}
        >
          <span
            style={{
              fontFamily: fonts.display,
              fontWeight: 700,
              fontSize: 26,
              color: colors.text,
            }}
          >
            LIVE EXPERIMENTS
          </span>
          <span style={{ flex: 1 }} />
          <span style={chip}>sort: newest ▾</span>
          <span style={chip}>filter ▾</span>
        </div>

        {connecting && <Notice>Connecting to the lab…</Notice>}
        {error && <Notice color={colors.rejected}>{error.message}</Notice>}
        {!connecting && !error && listings.length === 0 && <EmptyState />}

        {listings.length > 0 && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
              gap: 14,
            }}
          >
            {listings.map((listing) => (
              <ExperimentCard
                key={listing.proposalId}
                listing={listing}
                client={client}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
};
