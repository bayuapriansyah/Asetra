export enum AssetState {
  CREATED = 0,
  VERIFIED = 1,
  TOKENIZED = 2,
  LISTED = 3,
  FUNDED = 4,
  ACTIVE = 5,
  MATURED = 6,
  SETTLED = 7,
}

export const ASSET_STATE_LABELS: Record<AssetState, string> = {
  [AssetState.CREATED]: "Created",
  [AssetState.VERIFIED]: "Verified",
  [AssetState.TOKENIZED]: "Tokenized",
  [AssetState.LISTED]: "Listed",
  [AssetState.FUNDED]: "Funded",
  [AssetState.ACTIVE]: "Active",
  [AssetState.MATURED]: "Matured",
  [AssetState.SETTLED]: "Settled",
};

export const ASSET_STATE_COLORS: Record<AssetState, string> = {
  [AssetState.CREATED]: "bg-slate-800 text-slate-300 border border-slate-700",
  [AssetState.VERIFIED]: "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40",
  [AssetState.TOKENIZED]: "bg-teal-500/20 text-teal-300 border border-teal-500/40",
  [AssetState.LISTED]: "bg-cyan-400 text-slate-950 font-bold",
  [AssetState.FUNDED]: "bg-amber-500/20 text-amber-300 border border-amber-500/40",
  [AssetState.ACTIVE]: "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40",
  [AssetState.MATURED]: "bg-sky-500/20 text-sky-300 border border-sky-500/40",
  [AssetState.SETTLED]: "bg-emerald-500 text-slate-950 font-bold",
};

export interface AssetData {
  id: bigint;
  issuer: `0x${string}`;
  name: string;
  assetType: string;
  counterparty: `0x${string}`;
  faceValue: bigint;
  tokenSupply: bigint;
  fundedAmount: bigint;
  fundingTarget: bigint;
  maturity: bigint;
  expectedYieldBps: bigint;
  documentHash: `0x${string}`;
  state: AssetState;
  pricePerUnit: bigint;
  availableUnits: bigint;
  verifier: `0x${string}`;
  verifiedAt: bigint;
  createdAt: bigint;
  externalRef: string;
}

export interface PositionData {
  amount: bigint;
  totalInvested: bigint;
  holdingStart: bigint;
  accruedYield: bigint;
  claimedYield: bigint;
  collateralAmount: bigint;
  lastClaimedPPU: bigint;
  active: boolean;
}

export interface SellOrderData {
  orderId: bigint;
  assetId: bigint;
  seller: `0x${string}`;
  amount: bigint;
  pricePerUnit: bigint;
  active: boolean;
  createdAt: bigint;
}
