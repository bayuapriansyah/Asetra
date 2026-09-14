export function parseContractError(error: unknown): string {
  if (!error) return "Unknown error occurred.";

  const raw = String(error);

  // User rejected in MetaMask
  if (raw.includes("UserRejectedRequest") || raw.includes("user rejected") || raw.includes("rejected")) {
    return "Transaction rejected by user in wallet.";
  }

  // Contract custom errors
  if (raw.includes("Unauthorized")) return "You are not authorized for this action.";
  if (raw.includes("InvalidStateTransition")) return "Asset is not in the correct state for this action.";
  if (raw.includes("AssetNotFound")) return "Asset not found on contract.";
  if (raw.includes("InsufficientUnits")) return "Insufficient token units available.";
  if (raw.includes("InsufficientFunds")) return "Insufficient balance for this transaction.";
  if (raw.includes("InsufficientCredit")) return "Insufficient credit or collateral.";
  if (raw.includes("CollateralWithdrawalViolatesDebt")) return "Withdrawal would violate debt-to-collateral ratio (max LTV 60%).";
  if (raw.includes("AssetNotInvestable")) return "Asset is not available for investing in its current state.";
  if (raw.includes("MaturityNotReached")) return "Maturity date has not been reached yet. The asset must reach its due date before it can be matured.";
  if (raw.includes("InvalidAmount")) return "Invalid amount. Please check the value you entered.";
  if (raw.includes("OrderNotFound")) return "Sell order not found.";
  if (raw.includes("OrderNotActive")) return "This sell order is no longer active.";
  if (raw.includes("CannotTradeWithSelf")) return "You cannot buy your own sell order.";

  // Check for revert data
  if (raw.includes("execution reverted")) {
    const match = raw.match(/execution reverted[:\s]*(.*?)(?:\s*\(|$)/i);
    if (match && match[1].trim()) return `Smart contract error: ${match[1].trim()}`;
    return "Transaction was reverted by the smart contract. Check the transaction on the explorer for details.";
  }

  // Truncate long messages
  if (raw.length > 200) return raw.slice(0, 200) + "...";
  return raw;
}
