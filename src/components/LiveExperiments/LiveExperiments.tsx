import { useMadvotesListMarketsQuery } from "../../codegen/Madvotes.react-query";
import { useMadvotesQueryClient } from "../../hooks/useMadvotes";
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
  // undefined until the read-only client connects; the generated query hook
  // stays disabled until then.
  const { data: client } = useMadvotesQueryClient();
  const { data, isLoading, error } = useMadvotesListMarketsQuery({
    client,
    args: {},
  });

  const markets = data?.markets ?? [];
  const running = markets.filter((m) => m.status === "open").length;
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
          padding: "24px 26px 90px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
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
          <span style={chip}>sort: closing soon ▾</span>
          <span style={chip}>filter ▾</span>
        </div>

        {connecting && <Notice>Connecting to the lab…</Notice>}
        {error && <Notice color={colors.rejected}>{error.message}</Notice>}
        {!connecting && !error && markets.length === 0 && <EmptyState />}

        {markets.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
            {markets.map((market) => (
              <ExperimentCard
                key={market.proposal_id}
                market={market}
                client={client}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
};
