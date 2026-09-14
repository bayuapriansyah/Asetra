"use client";

import { http, createConfig } from "wagmi";
import { injected } from "wagmi/connectors";
import { BOT_CHAIN_TESTNET } from "@/config/chains";

export const wagmiConfig = createConfig({
  chains: [BOT_CHAIN_TESTNET],
  connectors: [injected()],
  transports: {
    [BOT_CHAIN_TESTNET.id]: http(BOT_CHAIN_TESTNET.rpcUrls.default.http[0]),
  },
});
