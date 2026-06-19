import { useChain } from "@cosmos-kit/react";
import { PROVIDER_CHAIN } from "../../hooks/useMadvotes";
import { colors, fonts } from "../../theme";

export const WalletConnectionInfo = () => {
  const { isWalletConnected, address, connect, openView } =
    useChain(PROVIDER_CHAIN);

  if (!isWalletConnected || !address) {
    return (
      <button
        onClick={() => connect()}
        style={{
          border: "none",
          background: colors.violet,
          color: colors.bg,
          fontFamily: fonts.display,
          fontWeight: 700,
          fontSize: 15,
          padding: "9px 16px",
        }}
      >
        CONNECT WALLET
      </button>
    );
  }

  return (
    <button
      onClick={() => openView()}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        border: `1px solid ${colors.violet}`,
        background: "transparent",
        padding: "7px 12px",
      }}
    >
      <span
        style={{
          width: 9,
          height: 9,
          background: colors.violet,
          borderRadius: "50%",
        }}
      />
      <span style={{ fontFamily: fonts.mono, fontSize: 13, color: colors.text }}>
        {address.slice(0, 8)}…{address.slice(-3)}
      </span>
    </button>
  );
};
