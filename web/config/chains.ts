export const BOT_CHAIN_TESTNET = {
  id: 968,
  name: "BOT Chain Testnet",
  nativeCurrency: {
    name: "BOT",
    symbol: "BOT",
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ["https://rpc.bohr.life"],
    },
  },
  blockExplorers: {
    default: {
      name: "BOT Scan",
      url: "https://scan.bohr.life",
    },
  },
} as const;

export const BOT_CHAIN_MAINNET = {
  id: 677,
  name: "BOT Chain",
  nativeCurrency: {
    name: "BOT",
    symbol: "BOT",
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ["https://rpc.botchain.ai"],
    },
  },
  blockExplorers: {
    default: {
      name: "BOT Scan",
      url: "https://scan.botchain.ai",
    },
  },
} as const;

export const BOT_CHAIN_FAUCET = "https://faucet.botchain.ai/basic";
export const BOT_CHAIN_DEX = "https://dex.botchain.ai/#/swap";
