import { AssetState } from "@/types/asset";
import type { Role } from "@/lib/context/RoleContext";

interface StateActionInfo {
  label: string;
  requiredState: AssetState | AssetState[];
  description: string;
}

export const INVESTOR_ACTIONS: Record<string, StateActionInfo> = {
  buy: {
    label: "Buy Tokens",
    requiredState: AssetState.LISTED,
    description: "Asset must be LISTED",
  },
  claimProceeds: {
    label: "Claim Proceeds",
    requiredState: [AssetState.ACTIVE, AssetState.MATURED],
    description: "Asset must be ACTIVE or MATURED",
  },
  createSellOrder: {
    label: "Create Sell Order",
    requiredState: [AssetState.TOKENIZED, AssetState.LISTED],
    description: "Asset must be TOKENIZED or LISTED",
  },
  depositCollateral: {
    label: "Deposit Collateral",
    requiredState: AssetState.ACTIVE,
    description: "Asset must be ACTIVE",
  },
  withdrawCollateral: {
    label: "Withdraw Collateral",
    requiredState: AssetState.ACTIVE,
    description: "Asset must be ACTIVE",
  },
  borrow: {
    label: "Borrow tUSDT",
    requiredState: AssetState.ACTIVE,
    description: "Asset must be ACTIVE",
  },
  repay: {
    label: "Repay Debt",
    requiredState: AssetState.ACTIVE,
    description: "Asset must be ACTIVE",
  },
  claimYield: {
    label: "Claim Yield",
    requiredState: [AssetState.ACTIVE, AssetState.MATURED],
    description: "Asset must be ACTIVE or MATURED",
  },
};

export const ISSUER_ACTIONS: Record<string, StateActionInfo> = {
  tokenize: {
    label: "Tokenize",
    requiredState: AssetState.VERIFIED,
    description: "Asset must be VERIFIED",
  },
  list: {
    label: "List on Marketplace",
    requiredState: AssetState.TOKENIZED,
    description: "Asset must be TOKENIZED",
  },
  mature: {
    label: "Mature Asset",
    requiredState: AssetState.ACTIVE,
    description: "Asset must be ACTIVE",
  },
  settle: {
    label: "Complete Settlement",
    requiredState: AssetState.MATURED,
    description: "Asset must be MATURED",
  },
  withdrawFunds: {
    label: "Withdraw Raised Funds",
    requiredState: [AssetState.ACTIVE, AssetState.MATURED, AssetState.SETTLED],
    description: "Asset must have raised funds",
  },
};

export function isActionAvailable(
  state: AssetState,
  action: StateActionInfo
): boolean {
  if (Array.isArray(action.requiredState)) {
    return action.requiredState.includes(state);
  }
  return state === action.requiredState;
}

export function getStateActions(state: AssetState, role: Role) {
  const actions = role === "issuer" ? ISSUER_ACTIONS : INVESTOR_ACTIONS;
  const available: { key: string; info: StateActionInfo }[] = [];
  const locked: { key: string; info: StateActionInfo }[] = [];

  for (const [key, info] of Object.entries(actions)) {
    if (isActionAvailable(state, info)) {
      available.push({ key, info });
    } else {
      locked.push({ key, info });
    }
  }

  return { available, locked };
}

export const STATE_FLOW = [
  AssetState.CREATED,
  AssetState.VERIFIED,
  AssetState.TOKENIZED,
  AssetState.LISTED,
  AssetState.ACTIVE,
  AssetState.MATURED,
  AssetState.SETTLED,
];

export const STATE_FLOW_LABELS: Record<AssetState, string> = {
  [AssetState.CREATED]: "Created",
  [AssetState.VERIFIED]: "Verified",
  [AssetState.TOKENIZED]: "Tokenized",
  [AssetState.LISTED]: "Listed",
  [AssetState.FUNDED]: "Funded",
  [AssetState.ACTIVE]: "Active",
  [AssetState.MATURED]: "Matured",
  [AssetState.SETTLED]: "Settled",
};
