"use client";

import { useChainId } from "wagmi";
import { getAsetraAddress, getTusdtAddress } from "@/config/contracts";

export function useAsetraAddress() {
  const chainId = useChainId();
  return getAsetraAddress(chainId);
}

export function useTusdtAddress() {
  const chainId = useChainId();
  return getTusdtAddress(chainId);
}
