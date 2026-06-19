export const COSMOS_DIRECTORY_REST = "https://rest.cosmos.directory/";

export const MADVOTES_CONTRACT_ADDRESS =
  "cosmos17zz7caq9usyh2c8crltzt2nvxdvmp4n769f8jq40d0ltgklnupxshhjmwz";

export const CHAIN_ID = "provider";
export const RPC = "https://cosmos-testnet-rpc.itrocket.net";
export const REST = "https://cosmos-testnet-api.itrocket.net";

// Mintscan explorer base for the provider (ICS) testnet; append a tx hash.
export const EXPLORER_TX = "https://www.mintscan.io/ics-testnet-provider/tx/";

export const DENOM = "uatom";
export const MICRO = 1_000_000n; // 1 ATOM = 1e6 uatom

// burn_bps / min_bet live in the contract's Config, which the deployed contract
// doesn't expose via a query yet — hardcoded to the spec defaults. Swap to a
// config query once one exists.
export const BURN_BPS = 500n; // 5%
export const MIN_BET_UATOM = MICRO; // 1 ATOM
