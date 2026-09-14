"use client";

import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { ASSETFLOW_ABI, ASSETFLOW_ADDRESS } from "@/config/contracts";

const PRICE_DIVISOR = BigInt("1000000000000000000");

export function useBuyTokens() {
  const { writeContractAsync, data: txHash, isPending, isError: isWriteError, error: writeError } = useWriteContract();
  const { isLoading: isConfirming, isSuccess, isError: isReceiptError, error: receiptError } = useWaitForTransactionReceipt({ hash: txHash });

  const isError = isWriteError || isReceiptError;
  const error = writeError || receiptError;

  const buyTokens = (assetId: number, units: number, rawPricePerUnit: bigint) => {
    const totalCost = (rawPricePerUnit * BigInt(units)) / PRICE_DIVISOR;
    return writeContractAsync({
      address: ASSETFLOW_ADDRESS,
      abi: ASSETFLOW_ABI,
      functionName: "buyTokens",
      args: [BigInt(assetId), BigInt(units)],
      value: totalCost,
    });
  };

  return { buyTokens, txHash, isPending, isConfirming, isSuccess, isError, error };
}
