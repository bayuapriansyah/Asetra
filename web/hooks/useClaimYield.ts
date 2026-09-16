"use client";

import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { ASETRA_ABI, ASETRA_ADDRESS } from "@/config/contracts";

export function useClaimYield() {
  const { writeContractAsync, data: txHash, isPending, isError: isWriteError, error: writeError, reset } = useWriteContract();
  const { isLoading: isConfirming, isSuccess, isError: isReceiptError, error: receiptError } = useWaitForTransactionReceipt({ hash: txHash });

  const isError = isWriteError || isReceiptError;
  const error = writeError || receiptError;

  const claimYield = (assetId: number) =>
    writeContractAsync({
      address: ASETRA_ADDRESS,
      abi: ASETRA_ABI,
      functionName: "claimYield",
      args: [BigInt(assetId)],
    });

  return { claimYield, txHash, isPending, isConfirming, isSuccess, isError, error, reset };
}
