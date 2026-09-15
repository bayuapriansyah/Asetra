const SELECTOR_MAP: Record<string, string> = {
  "0x82b42900": "Unauthorized",
  "0x8f9a780c": "InvalidStateTransition",
  "0x470cbf47": "AssetNotFound",
  "0x60845cde": "InsufficientUnits",
  "0x356680b7": "InsufficientFunds",
  "0x8ac4bc73": "InsufficientCredit",
  "0xcc967abb": "CollateralWithdrawalViolatesDebt",
  "0x536123e1": "AssetNotInvestable",
  "0x7fb65b4a": "MaturityNotReached",
  "0x2c5211c6": "InvalidAmount",
  "0xd36d8965": "OrderNotFound",
  "0x1d4ecc5b": "OrderNotActive",
  "0x9cbdca72": "CannotTradeWithSelf",
  "0x90b8ec18": "TransferFailed",
};

const ERROR_MESSAGES: Record<string, string> = {
  Unauthorized: "You are not authorized for this action. Switch to the correct wallet or role.",
  InvalidStateTransition:
    "Asset is not in the correct state for this action. Check the lifecycle state in the dashboard.",
  AssetNotFound: "Asset not found on the smart contract. It may have been deployed to a different address.",
  InsufficientUnits: "Not enough token units available for this action.",
  InsufficientFunds: "Insufficient tUSDT balance. Please claim from the faucet or check your wallet.",
  InsufficientCredit: "Not enough credit available. Deposit more collateral or repay existing debt first.",
  CollateralWithdrawalViolatesDebt:
    "Withdrawal rejected: it would push your loan-to-value ratio above the 60% safety limit. Repay debt first.",
  AssetNotInvestable:
    "Asset is not available for this action in its current state. It must be fully funded (ACTIVE) before borrowing, or LISTED before buying.",
  MaturityNotReached:
    "Maturity date has not been reached yet. Wait until the due date to mature this asset.",
  InvalidAmount: "Invalid amount. Please check the value you entered and try again.",
  OrderNotFound: "Sell order not found. It may have been cancelled or filled.",
  OrderNotActive: "This sell order is no longer active.",
  CannotTradeWithSelf: "You cannot buy your own sell order.",
  TransferFailed:
    "Token transfer failed. Make sure you have approved tUSDT spending and have sufficient balance.",
};

function extractSelectors(raw: string): string[] {
  const found: string[] = [];
  const lower = raw.toLowerCase();
  for (const [sel, name] of Object.entries(SELECTOR_MAP)) {
    if (lower.includes(sel.slice(2))) {
      found.push(name);
    }
  }
  return found;
}

function resolveErrorFromSelectors(selectors: string[]): string | null {
  for (const name of selectors) {
    if (ERROR_MESSAGES[name]) return ERROR_MESSAGES[name];
  }
  return null;
}

export function parseContractError(error: unknown): string {
  if (!error) return "Unknown error occurred.";

  let raw = "";

  if (error instanceof Error) {
    raw = error.message + " " + (error as any).shortMessage + " " + JSON.stringify((error as any).data ?? "");
  }
  raw = raw || String(error);

  if (raw.includes("UserRejectedRequest") || raw.includes("user rejected") || raw.includes("rejected")) {
    return "Transaction rejected by user in wallet.";
  }

  const selectors = extractSelectors(raw);
  const fromSelectors = resolveErrorFromSelectors(selectors);
  if (fromSelectors) return fromSelectors;

  if (raw.includes("UserRejectedRequest") || raw.includes("user rejected") || raw.includes("rejected")) {
    return "Transaction rejected by user in wallet.";
  }

  if (raw.includes("insufficient allowance") || raw.includes("ERC20InsufficientAllowance")) {
    return "Insufficient tUSDT allowance. The approve transaction may not have been confirmed yet. Wait and try again.";
  }
  if (raw.includes("insufficient balance") || raw.includes("ERC20InsufficientBalance")) {
    return "Insufficient tUSDT balance. Please claim from the faucet first.";
  }

  if (raw.includes("execution reverted")) {
    const match = raw.match(/execution reverted[:\s]*(0x[a-fA-F0-9]+)/i);
    if (match) {
      const sel = match[1].toLowerCase().slice(0, 10);
      const name = SELECTOR_MAP[sel];
      if (name && ERROR_MESSAGES[name]) return ERROR_MESSAGES[name];
      return `Transaction reverted on-chain (selector: ${sel}). Check the explorer for details.`;
    }
    return "Transaction was reverted by the smart contract. Check the transaction on the explorer for details.";
  }

  if (raw.includes("Approve transaction failed")) {
    return "Approve transaction failed. Please try again.";
  }

  if (raw.includes("insufficient funds") || raw.includes("insufficient funds for gas")) {
    return "Not enough BOT for gas fees. Please claim from the faucet.";
  }

  if (raw.length > 300) return raw.slice(0, 300) + "...";
  return raw;
}
