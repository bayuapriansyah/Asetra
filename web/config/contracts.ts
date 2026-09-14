export const ASSETFLOW_ADDRESS = process.env.NEXT_PUBLIC_ASSETFLOW_ADDRESS as `0x${string}`;

export const ASSETFLOW_ABI = [
  { type: "function", name: "admin", inputs: [], outputs: [{ name: "", type: "address" }], stateMutability: "view" },
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

  { type: "function", name: "buyTokens", inputs: [{ name: "assetId", type: "uint256" }, { name: "units", type: "uint256" }], outputs: [], stateMutability: "payable" },

  { type: "function", name: "createSellOrder", inputs: [
    { name: "assetId", type: "uint256" }, { name: "amount", type: "uint256" }, { name: "pricePerUnit_", type: "uint256" }
  ], outputs: [{ name: "", type: "uint256" }], stateMutability: "nonpayable" },
  { type: "function", name: "cancelSellOrder", inputs: [{ name: "orderId", type: "uint256" }], outputs: [], stateMutability: "nonpayable" },
  { type: "function", name: "executeTrade", inputs: [{ name: "orderId", type: "uint256" }, { name: "units", type: "uint256" }], outputs: [], stateMutability: "payable" },

  { type: "function", name: "depositCollateral", inputs: [{ name: "assetId", type: "uint256" }, { name: "amount", type: "uint256" }], outputs: [], stateMutability: "nonpayable" },
  { type: "function", name: "withdrawCollateral", inputs: [{ name: "assetId", type: "uint256" }, { name: "amount", type: "uint256" }], outputs: [], stateMutability: "nonpayable" },

  { type: "function", name: "borrow", inputs: [{ name: "assetId", type: "uint256" }, { name: "amount", type: "uint256" }], outputs: [], stateMutability: "nonpayable" },
  { type: "function", name: "repay", inputs: [{ name: "assetId", type: "uint256" }], outputs: [], stateMutability: "payable" },
  { type: "function", name: "getHealth", inputs: [{ name: "assetId", type: "uint256" }, { name: "user", type: "address" }], outputs: [{ name: "healthFactor", type: "uint256" }, { name: "healthy", type: "bool" }], stateMutability: "view" },

  { type: "function", name: "calculateYield", inputs: [{ name: "assetId", type: "uint256" }, { name: "user", type: "address" }], outputs: [{ name: "", type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "getHoldingScore", inputs: [{ name: "assetId", type: "uint256" }, { name: "user", type: "address" }], outputs: [{ name: "", type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "claimYield", inputs: [{ name: "assetId", type: "uint256" }], outputs: [], stateMutability: "nonpayable" },

  { type: "function", name: "matureAsset", inputs: [{ name: "assetId", type: "uint256" }], outputs: [], stateMutability: "nonpayable" },
  { type: "function", name: "settleAsset", inputs: [{ name: "assetId", type: "uint256" }], outputs: [], stateMutability: "nonpayable" },

  { type: "function", name: "getBorrowedAmount", inputs: [{ name: "assetId", type: "uint256" }, { name: "user", type: "address" }], outputs: [{ name: "", type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "getAvailableUnits", inputs: [{ name: "assetId", type: "uint256" }], outputs: [{ name: "", type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "getAvailableCredit", inputs: [{ name: "assetId", type: "uint256" }, { name: "user", type: "address" }], outputs: [{ name: "", type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "getPosition", inputs: [{ name: "assetId", type: "uint256" }, { name: "user", type: "address" }], outputs: [
    { name: "amount", type: "uint256" }, { name: "totalInvested", type: "uint256" },
    { name: "holdingStart", type: "uint256" }, { name: "accruedYield", type: "uint256" },
    { name: "claimedYield", type: "uint256" }, { name: "collateralAmount", type: "uint256" },
    { name: "active", type: "bool" }
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
] as const;
