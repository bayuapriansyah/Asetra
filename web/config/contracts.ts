/* ── Multi-chain contract addresses ──────────────────────────────── */
const CONTRACTS: Record<number, { asetra: `0x${string}`; tusdt: `0x${string}` }> = {
  968: { // BOT Chain Testnet
    asetra: (process.env.NEXT_PUBLIC_ASETRA_ADDRESS || "0x954Eac94dAB99fA988918bed1ab2E63ff2E41E2a") as `0x${string}`,
    tusdt: (process.env.NEXT_PUBLIC_TUSDT_ADDRESS || "0x75edC9335175Fc0552D51D48439F229c10420fe3") as `0x${string}`,
  },
  677: { // BOT Chain Mainnet
    asetra: "0x0000000000000000000000000000000000000000" as `0x${string}`, // TODO: deploy & replace
    tusdt: "0xaBabc7Ddc03e501d190C676BF3d92ef0e6e87a3C" as `0x${string}`,
  },
};

export function getAsetraAddress(chainId: number): `0x${string}` {
  return CONTRACTS[chainId]?.asetra ?? CONTRACTS[968].asetra;
}

export function getTusdtAddress(chainId: number): `0x${string}` {
  return CONTRACTS[chainId]?.tusdt ?? CONTRACTS[968].tusdt;
}

/** @deprecated Use getAsetraAddress(chainId) instead */
export const ASETRA_ADDRESS = CONTRACTS[968].asetra;
/** @deprecated Use getAsetraAddress(chainId) instead */
export const ASSETFLOW_ADDRESS = ASETRA_ADDRESS;
/** @deprecated Use getTusdtAddress(chainId) instead */
export const TUSDT_ADDRESS = CONTRACTS[968].tusdt;

export const TUSDT_ABI = [
  { type: "function", name: "balanceOf", inputs: [{ name: "account", type: "address" }], outputs: [{ name: "", type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "allowance", inputs: [{ name: "owner", type: "address" }, { name: "spender", type: "address" }], outputs: [{ name: "", type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "approve", inputs: [{ name: "spender", type: "address" }, { name: "amount", type: "uint256" }], outputs: [{ name: "", type: "bool" }], stateMutability: "nonpayable" },
  { type: "function", name: "decimals", inputs: [], outputs: [{ name: "", type: "uint8" }], stateMutability: "view" },
  { type: "function", name: "symbol", inputs: [], outputs: [{ name: "", type: "string" }], stateMutability: "view" },
  { type: "function", name: "name", inputs: [], outputs: [{ name: "", type: "string" }], stateMutability: "view" },
] as const;

export const ASETRA_ABI = [
  { type: "function", name: "admin", inputs: [], outputs: [{ name: "", type: "address" }], stateMutability: "view" },
  { type: "function", name: "tUSDT", inputs: [], outputs: [{ name: "", type: "address" }], stateMutability: "view" },
  { type: "function", name: "nextAssetId", inputs: [], outputs: [{ name: "", type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "nextOrderId", inputs: [], outputs: [{ name: "", type: "uint256" }], stateMutability: "view" },

  { type: "function", name: "createAsset", inputs: [
    { name: "_assetType", type: "string" }, { name: "_name", type: "string" },
    { name: "_externalRef", type: "string" }, { name: "_counterparty", type: "address" },
    { name: "_faceValue", type: "uint256" }, { name: "_maturity", type: "uint256" },
    { name: "_yieldBps", type: "uint256" }, { name: "_docHash", type: "bytes32" }
  ], outputs: [{ name: "", type: "uint256" }], stateMutability: "nonpayable" },

  { type: "function", name: "getAssetCount", inputs: [], outputs: [{ name: "", type: "uint256" }], stateMutability: "view" },

  { type: "function", name: "verifyAsset", inputs: [{ name: "assetId", type: "uint256" }], outputs: [], stateMutability: "nonpayable" },
  { type: "function", name: "tokenizeAsset", inputs: [{ name: "assetId", type: "uint256" }, { name: "tokenSupply", type: "uint256" }], outputs: [], stateMutability: "nonpayable" },
  { type: "function", name: "listAsset", inputs: [{ name: "assetId", type: "uint256" }], outputs: [], stateMutability: "nonpayable" },

  { type: "function", name: "buyTokens", inputs: [{ name: "assetId", type: "uint256" }, { name: "units", type: "uint256" }], outputs: [], stateMutability: "nonpayable" },

  { type: "function", name: "createSellOrder", inputs: [
    { name: "assetId", type: "uint256" }, { name: "amount", type: "uint256" }, { name: "pricePerUnit_", type: "uint256" }
  ], outputs: [{ name: "", type: "uint256" }], stateMutability: "nonpayable" },
  { type: "function", name: "cancelSellOrder", inputs: [{ name: "orderId", type: "uint256" }], outputs: [], stateMutability: "nonpayable" },
  { type: "function", name: "executeTrade", inputs: [{ name: "orderId", type: "uint256" }, { name: "units", type: "uint256" }], outputs: [], stateMutability: "nonpayable" },

  { type: "function", name: "depositCollateral", inputs: [{ name: "assetId", type: "uint256" }, { name: "amount", type: "uint256" }], outputs: [], stateMutability: "nonpayable" },
  { type: "function", name: "withdrawCollateral", inputs: [{ name: "assetId", type: "uint256" }, { name: "amount", type: "uint256" }], outputs: [], stateMutability: "nonpayable" },
  { type: "function", name: "withdrawRaisedFunds", inputs: [{ name: "assetId", type: "uint256" }], outputs: [], stateMutability: "nonpayable" },

  { type: "function", name: "recordPayment", inputs: [
    { name: "assetId", type: "uint256" }, { name: "amount", type: "uint256" }, { name: "evidenceHash", type: "bytes32" }
  ], outputs: [], stateMutability: "nonpayable" },
  { type: "function", name: "fundSettlement", inputs: [{ name: "assetId", type: "uint256" }, { name: "amount", type: "uint256" }], outputs: [], stateMutability: "nonpayable" },
  { type: "function", name: "claimProceeds", inputs: [{ name: "assetId", type: "uint256" }], outputs: [], stateMutability: "nonpayable" },

  { type: "function", name: "borrow", inputs: [{ name: "assetId", type: "uint256" }, { name: "amount", type: "uint256" }], outputs: [], stateMutability: "nonpayable" },
  { type: "function", name: "repay", inputs: [{ name: "assetId", type: "uint256" }, { name: "amount", type: "uint256" }], outputs: [], stateMutability: "nonpayable" },
  { type: "function", name: "getHealth", inputs: [{ name: "assetId", type: "uint256" }, { name: "user", type: "address" }], outputs: [{ name: "healthFactor", type: "uint256" }, { name: "healthy", type: "bool" }], stateMutability: "view" },

  { type: "function", name: "calculateYield", inputs: [{ name: "assetId", type: "uint256" }, { name: "user", type: "address" }], outputs: [{ name: "", type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "getHoldingScore", inputs: [{ name: "assetId", type: "uint256" }, { name: "user", type: "address" }], outputs: [{ name: "", type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "claimYield", inputs: [{ name: "assetId", type: "uint256" }], outputs: [], stateMutability: "nonpayable" },

  { type: "function", name: "matureAsset", inputs: [{ name: "assetId", type: "uint256" }], outputs: [], stateMutability: "nonpayable" },
  { type: "function", name: "settleAsset", inputs: [{ name: "assetId", type: "uint256" }], outputs: [], stateMutability: "nonpayable" },

  { type: "function", name: "getBorrowedAmount", inputs: [{ name: "assetId", type: "uint256" }, { name: "user", type: "address" }], outputs: [{ name: "", type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "getAvailableUnits", inputs: [{ name: "assetId", type: "uint256" }], outputs: [{ name: "", type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "getAvailableCredit", inputs: [{ name: "assetId", type: "uint256" }, { name: "user", type: "address" }], outputs: [{ name: "", type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "getPaymentCount", inputs: [{ name: "assetId", type: "uint256" }], outputs: [{ name: "", type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "getPayment", inputs: [{ name: "assetId", type: "uint256" }, { name: "index", type: "uint256" }], outputs: [
    { name: "amount", type: "uint256" }, { name: "timestamp", type: "uint256" },
    { name: "evidenceHash", type: "bytes32" }, { name: "recordedBy", type: "address" }
  ], stateMutability: "view" },
  { type: "function", name: "getClaimableProceeds", inputs: [{ name: "assetId", type: "uint256" }, { name: "user", type: "address" }], outputs: [{ name: "", type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "totalPaid", inputs: [{ name: "", type: "uint256" }], outputs: [{ name: "", type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "paidPerUnit", inputs: [{ name: "", type: "uint256" }], outputs: [{ name: "", type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "paymentFunded", inputs: [{ name: "", type: "uint256" }], outputs: [{ name: "", type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "getPosition", inputs: [{ name: "assetId", type: "uint256" }, { name: "user", type: "address" }], outputs: [
    { name: "amount", type: "uint256" }, { name: "totalInv", type: "uint256" },
    { name: "holdingStart", type: "uint256" }, { name: "accruedYield", type: "uint256" },
    { name: "claimedYield", type: "uint256" }, { name: "collateralAmount", type: "uint256" },
    { name: "lastClaimedPPU", type: "uint256" }, { name: "active", type: "bool" }
  ], stateMutability: "view" },
  { type: "function", name: "getSellOrder", inputs: [{ name: "orderId", type: "uint256" }], outputs: [
    { name: "oId", type: "uint256" }, { name: "aId", type: "uint256" },
    { name: "seller", type: "address" }, { name: "amt", type: "uint256" },
    { name: "price", type: "uint256" }, { name: "isActive", type: "bool" },
    { name: "created", type: "uint256" }
  ], stateMutability: "view" },

  { type: "function", name: "assetIssuer", inputs: [{ name: "", type: "uint256" }], outputs: [{ name: "", type: "address" }], stateMutability: "view" },
  { type: "function", name: "assetName", inputs: [{ name: "", type: "uint256" }], outputs: [{ name: "", type: "string" }], stateMutability: "view" },
  { type: "function", name: "assetType", inputs: [{ name: "", type: "uint256" }], outputs: [{ name: "", type: "string" }], stateMutability: "view" },
  { type: "function", name: "assetCounterparty", inputs: [{ name: "", type: "uint256" }], outputs: [{ name: "", type: "address" }], stateMutability: "view" },
  { type: "function", name: "assetFaceValue", inputs: [{ name: "", type: "uint256" }], outputs: [{ name: "", type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "assetTokenSupply", inputs: [{ name: "", type: "uint256" }], outputs: [{ name: "", type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "assetFundedAmount", inputs: [{ name: "", type: "uint256" }], outputs: [{ name: "", type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "assetFundingTarget", inputs: [{ name: "", type: "uint256" }], outputs: [{ name: "", type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "assetMaturity", inputs: [{ name: "", type: "uint256" }], outputs: [{ name: "", type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "assetYieldBps", inputs: [{ name: "", type: "uint256" }], outputs: [{ name: "", type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "assetDocHash", inputs: [{ name: "", type: "uint256" }], outputs: [{ name: "", type: "bytes32" }], stateMutability: "view" },
  { type: "function", name: "assetState", inputs: [{ name: "", type: "uint256" }], outputs: [{ name: "", type: "uint8" }], stateMutability: "view" },
  { type: "function", name: "assetVerifier", inputs: [{ name: "", type: "uint256" }], outputs: [{ name: "", type: "address" }], stateMutability: "view" },
  { type: "function", name: "assetVerified", inputs: [{ name: "", type: "uint256" }], outputs: [{ name: "", type: "bool" }], stateMutability: "view" },
  { type: "function", name: "assetCreatedAt", inputs: [{ name: "", type: "uint256" }], outputs: [{ name: "", type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "assetVerifiedAt", inputs: [{ name: "", type: "uint256" }], outputs: [{ name: "", type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "assetTokenizedAt", inputs: [{ name: "", type: "uint256" }], outputs: [{ name: "", type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "assetListedAt", inputs: [{ name: "", type: "uint256" }], outputs: [{ name: "", type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "assetPricePerUnit", inputs: [{ name: "", type: "uint256" }], outputs: [{ name: "", type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "assetExternalRef", inputs: [{ name: "", type: "uint256" }], outputs: [{ name: "", type: "string" }], stateMutability: "view" },

  { type: "event", name: "AssetCreated", inputs: [
    { name: "id", type: "uint256", indexed: true }, { name: "issuer", type: "address", indexed: true }, { name: "name", type: "string", indexed: false }
  ]},
  { type: "event", name: "AssetVerified", inputs: [
    { name: "id", type: "uint256", indexed: true }, { name: "verifier", type: "address", indexed: true }
  ]},
  { type: "event", name: "AssetTokenized", inputs: [
    { name: "id", type: "uint256", indexed: true }, { name: "tokenSupply", type: "uint256", indexed: false }
  ]},
  { type: "event", name: "AssetListed", inputs: [
    { name: "id", type: "uint256", indexed: true }, { name: "pricePerUnit", type: "uint256", indexed: false }
  ]},
  { type: "event", name: "InvestmentMade", inputs: [
    { name: "id", type: "uint256", indexed: true }, { name: "investor", type: "address", indexed: true },
    { name: "units", type: "uint256", indexed: false }, { name: "amount", type: "uint256", indexed: false }
  ]},
  { type: "event", name: "SellOrderCreated", inputs: [
    { name: "orderId", type: "uint256", indexed: true }, { name: "assetId", type: "uint256", indexed: true },
    { name: "seller", type: "address", indexed: true }, { name: "amount", type: "uint256", indexed: false },
    { name: "pricePerUnit", type: "uint256", indexed: false }
  ]},
  { type: "event", name: "SellOrderCancelled", inputs: [
    { name: "orderId", type: "uint256", indexed: true }
  ]},
  { type: "event", name: "TradeExecuted", inputs: [
    { name: "orderId", type: "uint256", indexed: true }, { name: "assetId", type: "uint256", indexed: true },
    { name: "buyer", type: "address", indexed: true }, { name: "units", type: "uint256", indexed: false },
    { name: "amount", type: "uint256", indexed: false }
  ]},
  { type: "event", name: "CollateralDeposited", inputs: [
    { name: "assetId", type: "uint256", indexed: true }, { name: "user", type: "address", indexed: true },
    { name: "amount", type: "uint256", indexed: false }
  ]},
  { type: "event", name: "CollateralWithdrawn", inputs: [
    { name: "assetId", type: "uint256", indexed: true }, { name: "user", type: "address", indexed: true },
    { name: "amount", type: "uint256", indexed: false }
  ]},
  { type: "event", name: "Borrowed", inputs: [
    { name: "assetId", type: "uint256", indexed: true }, { name: "user", type: "address", indexed: true },
    { name: "amount", type: "uint256", indexed: false }
  ]},
  { type: "event", name: "Repaid", inputs: [
    { name: "assetId", type: "uint256", indexed: true }, { name: "user", type: "address", indexed: true },
    { name: "amount", type: "uint256", indexed: false }
  ]},
  { type: "event", name: "YieldClaimed", inputs: [
    { name: "assetId", type: "uint256", indexed: true }, { name: "user", type: "address", indexed: true },
    { name: "amount", type: "uint256", indexed: false }
  ]},
  { type: "event", name: "AssetMatured", inputs: [{ name: "id", type: "uint256", indexed: true }] },
  { type: "event", name: "AssetSettled", inputs: [
    { name: "id", type: "uint256", indexed: true }, { name: "investor", type: "address", indexed: true },
    { name: "principal", type: "uint256", indexed: false }, { name: "yield_", type: "uint256", indexed: false }
  ]},
  { type: "event", name: "FundsWithdrawn", inputs: [
    { name: "assetId", type: "uint256", indexed: true }, { name: "issuer", type: "address", indexed: true },
    { name: "amount", type: "uint256", indexed: false }
  ]},
  { type: "event", name: "PaymentRecorded", inputs: [
    { name: "assetId", type: "uint256", indexed: true }, { name: "amount", type: "uint256", indexed: false },
    { name: "evidenceHash", type: "bytes32", indexed: false }, { name: "recordedBy", type: "address", indexed: true }
  ]},
  { type: "event", name: "SettlementFunded", inputs: [
    { name: "assetId", type: "uint256", indexed: true }, { name: "amount", type: "uint256", indexed: false },
    { name: "funder", type: "address", indexed: true }
  ]},
  { type: "event", name: "ProceedsClaimed", inputs: [
    { name: "assetId", type: "uint256", indexed: true }, { name: "user", type: "address", indexed: true },
    { name: "amount", type: "uint256", indexed: false }
  ]},
] as const;

export const ASSETFLOW_ABI = ASETRA_ABI;
