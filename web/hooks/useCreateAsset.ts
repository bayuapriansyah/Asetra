"use client";

import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { ASETRA_ABI, ASETRA_ADDRESS } from "@/config/contracts";
import { keccak256, toBytes } from "viem";

interface CreateAssetParams {
  assetType: string;
  name: string;
  externalReference: string;
  counterparty: `0x${string}`;
  faceValue: bigint;
  maturity: bigint;
  expectedYieldBps: bigint;
  documentHash?: string;
}

export function useCreateAsset() {
  const { writeContractAsync, data: txHash, isPending, isError, error } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  const createAsset = async (params: CreateAssetParams) => {
    const docHash = params.documentHash
      ? keccak256(toBytes(params.documentHash))
      : keccak256(toBytes(`${params.name}-${params.faceValue}-${Date.now()}`));

    return writeContractAsync({
      address: ASETRA_ADDRESS,
      abi: ASETRA_ABI,
      functionName: "createAsset",
      args: [
        params.assetType,
        params.name,
        params.externalReference,
        params.counterparty,
        params.faceValue,
        params.maturity,
        params.expectedYieldBps,
        docHash,
      ],
    });
  };

  return {
    createAsset,
    txHash,
    isPending,
    isConfirming,
    isSuccess,
    isError,
    error,
  };
}
