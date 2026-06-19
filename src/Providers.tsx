import { ChainProvider } from "@cosmos-kit/react";
import { chains, assets } from "chain-registry";
import { wallets as keplrWallets } from "@cosmos-kit/keplr";
import { wallets as cosmostationWallets } from "@cosmos-kit/cosmostation";
import { wallets as leapWallets } from "@cosmos-kit/leap";
import "@interchain-ui/react/styles";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { GasPrice } from "@cosmjs/stargate";
import { PROVIDER_CHAIN } from "./hooks/useMadvotes";
import { REST, RPC } from "./utils/constants";

export const Providers = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <ChainProvider
        chains={[...chains]} // supported chains
        assetLists={assets} // supported asset lists
        wallets={[...keplrWallets, ...cosmostationWallets, ...leapWallets]} // supported wallets
        signerOptions={{
          // Contract execution uses a SigningCosmWasmClient; the provider
          // testnet pays fees in uatom (min gas price 0.005).
          signingCosmwasm: () => ({
            gasPrice: GasPrice.fromString("0.025uatom"),
          }),
        }}
        endpointOptions={{
          endpoints: {
            // Point the provider testnet at the same itrocket node the read
            // client uses, so signing/broadcast and queries share an endpoint.
            [PROVIDER_CHAIN]: {
              rpc: [RPC],
              rest: [REST],
            },
          },
        }}
      >
        {children}
      </ChainProvider>
    </QueryClientProvider>
  );
};
