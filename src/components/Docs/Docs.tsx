import { useState } from "react";
import { colors, fonts, CONTENT_MAX } from "../../theme";

type Faq = { q: string; a: React.ReactNode };

const FAQS: Faq[] = [
  {
    q: "What is MadVotes?",
    a: (
      <>
        MadVotes is a prediction market on Cosmos Hub governance. Each live Hub
        proposal becomes an <em>experiment</em> you can stake ATOM on by calling
        how it will resolve. When the proposal finishes, the chain&apos;s own
        result settles the market — there&apos;s no oracle and no house.
      </>
    ),
  },
  {
    q: "What outcomes can I stake on?",
    a: (
      <>
        Every experiment has the four governance outcomes the Hub itself can
        return:
        <br />
        <b style={{ color: colors.passed }}>Passed</b> — the proposal is adopted.
        <br />
        <b style={{ color: colors.rejected }}>Rejected</b> — it&apos;s voted
        down.
        <br />
        <b style={{ color: colors.veto }}>Veto-Rejected</b> — rejected with the
        veto threshold ({"≥"}33.4% NoWithVeto), which also burns the deposit.
        <br />
        <b style={{ color: colors.quorum }}>Quorum-Failed</b> — not enough of the
        bonded stake voted, so the proposal fails for lack of quorum.
      </>
    ),
  },
  {
    q: "How is an experiment settled?",
    a: (
      <>
        By the chain, not by us. Once voting ends, the Hub records the
        proposal&apos;s final status on-chain. The market reads that status and
        pays out the pool that called it correctly. Because settlement comes
        straight from governance, there&apos;s nothing to dispute and no trusted
        reporter in the loop.
      </>
    ),
  },
  {
    q: "What is the 5% reagent burn?",
    a: (
      <>
        Every stake is charged a flat 5% burn the moment it&apos;s placed — we
        call it the <em>reagent burn</em>. Those ATOM are removed from supply
        permanently, so the protocol is deflationary by design. The remaining
        95% is your <em>net credited</em> stake and the only amount that earns
        yield.
      </>
    ),
  },
  {
    q: "What's the early-observer edge?",
    a: (
      <>
        The earlier in the voting window you stake, the larger the share you
        earn — calling an outcome while it&apos;s still uncertain is worth more
        than piling onto a near-certain result at the last minute. Your stake is
        multiplied by a time-weight that decays exponentially from open to
        close, so two equal stakes on the same winning outcome can pay out very
        differently depending on when each was placed. The hypothesis slip plots
        exactly where your stake lands on that curve before you sign.
      </>
    ),
  },
  {
    q: "How is my payout calculated?",
    a: (
      <>
        If your hypothesis is correct you get your net (post-burn) stake back,
        plus a share of every <em>incorrect</em> outcome&apos;s pool. Your share
        is proportional to your time-weighted contribution relative to all
        correct callers — so the size of your stake and how early you placed it
        both matter. If you&apos;re wrong, your net stake stays in the pool and
        is distributed to the callers who got it right. The slip&apos;s
        &quot;max yield&quot; is a live projection from the current pools; the
        final number depends on how the pools look at settlement.
      </>
    ),
  },
  {
    q: "How do I collect winnings?",
    a: (
      <>
        After an experiment settles, head to your <b>Notebook</b>. Any winning
        position shows a claimable amount; signing the claim transfers your net
        stake plus winnings back to your wallet. Claims are one transaction per
        position and can be made any time after settlement.
      </>
    ),
  },
  {
    q: "Is there a minimum stake?",
    a: <>Yes — the minimum is 1 ATOM per hypothesis (before the 5% burn).</>,
  },
  {
    q: "Which wallets and network are supported?",
    a: (
      <>
        MadVotes connects with <b>Keplr</b> or <b>Leap</b>. It currently runs on
        the Cosmos Hub <b>provider testnet</b>, so you&apos;re staking testnet
        ATOM, not mainnet funds. Make sure your wallet is on the provider
        testnet before connecting.
      </>
    ),
  },
];

const FaqItem = ({ item }: { item: Faq }) => {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ borderBottom: `1px solid ${colors.border}` }}>
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
          background: "transparent",
          border: "none",
          padding: "18px 4px",
          cursor: "pointer",
          textAlign: "left",
        }}
      >
        <span
          style={{
            fontFamily: fonts.display,
            fontWeight: 700,
            fontSize: 18,
            color: colors.text,
            letterSpacing: ".3px",
          }}
        >
          {item.q}
        </span>
        <span
          style={{
            fontFamily: fonts.mono,
            fontSize: 18,
            color: colors.violetLight,
            flexShrink: 0,
          }}
        >
          {open ? "−" : "+"}
        </span>
      </button>
      {open && (
        <div
          style={{
            fontFamily: fonts.mono,
            fontSize: 14,
            color: colors.textDim,
            lineHeight: 1.75,
            padding: "0 4px 22px",
            maxWidth: 760,
          }}
        >
          {item.a}
        </div>
      )}
    </div>
  );
};

export const Docs = () => (
  <div style={{ maxWidth: CONTENT_MAX, margin: "0 auto", padding: "24px 26px 90px" }}>
    <div
      style={{
        fontFamily: fonts.display,
        fontWeight: 700,
        fontSize: 26,
        color: colors.text,
        marginBottom: 6,
      }}
    >
      DOCS
    </div>
    <div
      style={{
        fontFamily: fonts.label,
        fontSize: 10,
        color: colors.violetLight,
        letterSpacing: ".16em",
        marginBottom: 22,
      }}
    >
      HOW THE LAB WORKS · FAQ
    </div>

    <div style={{ border: `1px solid ${colors.border}`, borderBottom: "none" }}>
      {FAQS.map((item) => (
        <FaqItem key={item.q} item={item} />
      ))}
    </div>

    <div
      style={{
        fontFamily: fonts.mono,
        fontSize: 12,
        color: colors.muted,
        lineHeight: 1.7,
        marginTop: 20,
      }}
    >
      Still curious? Everything here settles from on-chain governance data —
      read the proposal you&apos;re staking on directly on the Hub before you run
      a hypothesis. Everything is an experiment.
    </div>
  </div>
);
