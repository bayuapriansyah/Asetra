"use client";

import { useWriteContract, useWaitForTransactionReceipt, usePublicClient } from "wagmi";
import { ASETRA_ABI, TUSDT_ABI } from "@/config/contracts";
import { useAsetraAddress, useTusdtAddress } from "@/hooks/useContractAddresses";

export function useBuyTokens() {
  const ASETRA_ADDRESS = useAsetraAddress();
  const TUSDT_ADDRESS = useTusdtAddress();
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
      args: [ASETRA_ADDRESS, totalCost],
    });

    // Step 2: Wait for approve to be mined
    const receipt = await publicClient!.waitForTransactionReceipt({ hash: approveHash });
    if (receipt.status !== "success") {
      throw new Error("Approve transaction failed. Please try again.");
    }

    // Step 3: Call buyTokens (allowance is now set)
    return writeContractAsync({
      address: ASETRA_ADDRESS,
      abi: ASETRA_ABI,
      functionName: "buyTokens",
      args: [BigInt(assetId), BigInt(units)],
    });
  };

  return { buyTokens, txHash, isPending, isConfirming, isSuccess, isError, error };
}
