"use client";

import { useWriteContract, useWaitForTransactionReceipt, usePublicClient } from "wagmi";
import { ASSETFLOW_ABI, ASSETFLOW_ADDRESS, TUSDT_ABI, TUSDT_ADDRESS } from "@/config/contracts";

export function useBuyTokens() {
  const { writeContractAsync, data: txHash, isPending, isError: isWriteError, error: writeError } = useWriteContract();
  const { isLoading: isConfirming, isSuccess, isError: isReceiptError, error: receiptError } = useWaitForTransactionReceipt({ hash: txHash });
  const publicClient = usePublicClient();

  const isError = isWriteError || isReceiptError;
  const error = writeError || receiptError;

  const buyTokens = async (assetId: number, units: number, rawPricePerUnit: bigint) => {
    const totalCost = rawPricePerUnit * BigInt(units);

    // Step 1: Approve tUSDT
    const approveHash = await writeContractAsync({
      address: TUSDT_ADDRESS,
      abi: TUSDT_ABI,
      functionName: "approve",
      args: [ASSETFLOW_ADDRESS, totalCost],
    });

    // Step 2: Wait for approve to be mined
    const receipt = await publicClient!.waitForTransactionReceipt({ hash: approveHash });
    if (receipt.status !== "success") {
      throw new Error("Approve transaction failed. Please try again.");
    }

    // Step 3: Call buyTokens (allowance is now set)
    return writeContractAsync({
      address: ASSETFLOW_ADDRESS,
      abi: ASSETFLOW_ABI,
      functionName: "buyTokens",
      args: [BigInt(assetId), BigInt(units)],
    });
  };

  return { buyTokens, txHash, isPending, isConfirming, isSuccess, isError, error };
}
