"use client";

import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { ASSETFLOW_ABI, ASSETFLOW_ADDRESS } from "@/config/contracts";

function useLifecycleAction() {
  const { writeContractAsync, data: txHash, isPending, isError: isWriteError, error: writeError, reset } = useWriteContract();
  const { isLoading: isConfirming, isSuccess, isError: isReceiptError, error: receiptError } = useWaitForTransactionReceipt({ hash: txHash });

  const isError = isWriteError || isReceiptError;
  const error = writeError || receiptError;

  return { writeContractAsync, txHash, isPending, isConfirming, isSuccess, isError, error, reset };
}

export function useVerifyAsset() {
  const hook = useLifecycleAction();
  const verify = (assetId: number) =>
    hook.writeContractAsync({
      address: ASSETFLOW_ADDRESS,
      abi: ASSETFLOW_ABI,
      functionName: "verifyAsset",
      args: [BigInt(assetId)],
    });
  return { verify, ...hook };
}

export function useTokenizeAsset() {
  const hook = useLifecycleAction();
  const tokenize = (assetId: number, tokenSupply: bigint) =>
    hook.writeContractAsync({
      address: ASSETFLOW_ADDRESS,
      abi: ASSETFLOW_ABI,
      functionName: "tokenizeAsset",
      args: [BigInt(assetId), tokenSupply],
    });
  return { tokenize, ...hook };
}

export function useListAsset() {
  const hook = useLifecycleAction();
  const list = (assetId: number) =>
    hook.writeContractAsync({
      address: ASSETFLOW_ADDRESS,
      abi: ASSETFLOW_ABI,
      functionName: "listAsset",
      args: [BigInt(assetId)],
    });
  return { list, ...hook };
}

export function useMatureAsset() {
  const hook = useLifecycleAction();
  const mature = (assetId: number) =>
    hook.writeContractAsync({
      address: ASSETFLOW_ADDRESS,
      abi: ASSETFLOW_ABI,
      functionName: "matureAsset",
      args: [BigInt(assetId)],
    });
  return { mature, ...hook };
}

export function useSettleAsset() {
  const hook = useLifecycleAction();
  const settle = (assetId: number) =>
    hook.writeContractAsync({
      address: ASSETFLOW_ADDRESS,
      abi: ASSETFLOW_ABI,
      functionName: "settleAsset",
      args: [BigInt(assetId)],
    });
  return { settle, ...hook };
}
