import { useQuery } from "@tanstack/react-query";
import { CosmWasmClient, SigningCosmWasmClient } from "@cosmjs/cosmwasm-stargate";
import { GasPrice } from "@cosmjs/stargate";
import { useChain } from "@cosmos-kit/react";
import {
  MadvotesClient,
  MadvotesQueryClient,
} from "../codegen/Madvotes.client";
import { MADVOTES_CONTRACT_ADDRESS, RPC } from "../utils/constants";

// The madvotes contract lives on the Cosmos Hub provider testnet, registered in
// chain-registry as "rsprovidertestnet" (chain_id "provider").
export const PROVIDER_CHAIN = "rsprovidertestnet";

/**
 * Connects a read-only CosmWasmClient to the configured RPC and wraps it in the
 * generated MadvotesQueryClient pointed at the madvotes contract. The resulting
 * client can be fed into the generated react-query hooks (e.g.
 * useMadvotesListMarketsQuery), which guard on `client` being defined.
 */
export const useMadvotesQueryClient = () =>
  useQuery({
    queryKey: ["madvotes-query-client", RPC, MADVOTES_CONTRACT_ADDRESS],
    queryFn: async (): Promise<MadvotesQueryClient> => {
      const client = await CosmWasmClient.connect(RPC);
      return new MadvotesQueryClient(client, MADVOTES_CONTRACT_ADDRESS);
    },
    staleTime: Infinity,
  });

// Provider testnet pays fees in uatom (min gas price 0.005).
const GAS_PRICE = GasPrice.fromString("0.025uatom");

/**
 * Builds a signing MadvotesClient from the connected cosmos-kit wallet, ready
 * for execute messages (placeBet / claim). Resolves to undefined until a wallet
 * is connected on the provider chain.
 *
 * We connect the SigningCosmWasmClient to our own `RPC` constant using the
 * wallet's offline signer, rather than cosmos-kit's `getSigningCosmWasmClient`.
 * cosmos-kit resolves the endpoint from the chain-registry rotation (which has
 * flaky/down nodes for this testnet); pinning our known-good RPC avoids the bad
 * endpoints that were causing signing/broadcast failures.
 */
export const useMadvotesSigningClient = () => {
  const { address, isWalletConnected, getOfflineSigner } =
    useChain(PROVIDER_CHAIN);

  return useQuery({
    queryKey: ["madvotes-signing-client", RPC, address],
    enabled: isWalletConnected && !!address,
    queryFn: async (): Promise<MadvotesClient> => {
      console.log("[madvotes] connecting signing client", { rpc: RPC, address });
      const signer = await getOfflineSigner();
      const accounts = await signer.getAccounts().catch(() => []);
      console.log("[madvotes] offline signer accounts", accounts);
      const client = await SigningCosmWasmClient.connectWithSigner(RPC, signer, {
        gasPrice: GAS_PRICE,
      });
      const chainId = await client.getChainId();
      console.log("[madvotes] signing client connected", { chainId });
      return new MadvotesClient(client, address!, MADVOTES_CONTRACT_ADDRESS);
    },
    staleTime: Infinity,
  });
};
