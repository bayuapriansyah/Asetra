"use client";

import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { ASSETFLOW_ABI, ASSETFLOW_ADDRESS } from "@/config/contracts";

export function useClaimYield() {
  const { writeContractAsync, data: txHash, isPending, isError: isWriteError, error: writeError, reset } = useWriteContract();
  const { isLoading: isConfirming, isSuccess, isError: isReceiptError, error: receiptError } = useWaitForTransactionReceipt({ hash: txHash });

  const isError = isWriteError || isReceiptError;
  const error = writeError || receiptError;

  const claimYield = (assetId: number) =>
    writeContractAsync({
      address: ASSETFLOW_ADDRESS,
      abi: ASSETFLOW_ABI,
      functionName: "claimYield",
      args: [BigInt(assetId)],
    });

  return { claimYield, txHash, isPending, isConfirming, isSuccess, isError, error, reset };
}
