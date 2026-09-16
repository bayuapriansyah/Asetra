"use client";

import { useState, useEffect, useCallback } from "react";
import { usePublicClient } from "wagmi";
import { ASETRA_ABI, ASETRA_ADDRESS } from "@/config/contracts";
import type { AssetData, AssetState } from "@/types/asset";

async function fetchAsset(publicClient: NonNullable<ReturnType<typeof usePublicClient>>, id: number): Promise<AssetData> {
  const c = ASETRA_ADDRESS;
  const a = ASETRA_ABI;
  const i = BigInt(id);

  const [
    issuer, name, assetType, counterparty, faceValue, tokenSupply,
    fundedAmount, fundingTarget, maturity, yieldBps, docHash,
    state, pricePerUnit, availableUnits, verifier, verifiedAt, createdAt, externalRef,
  ] = await Promise.all([
    publicClient.readContract({ address: c, abi: a, functionName: "assetIssuer", args: [i] }),
    publicClient.readContract({ address: c, abi: a, functionName: "assetName", args: [i] }),
    publicClient.readContract({ address: c, abi: a, functionName: "assetType", args: [i] }),
    publicClient.readContract({ address: c, abi: a, functionName: "assetCounterparty", args: [i] }),
    publicClient.readContract({ address: c, abi: a, functionName: "assetFaceValue", args: [i] }),
    publicClient.readContract({ address: c, abi: a, functionName: "assetTokenSupply", args: [i] }),
    publicClient.readContract({ address: c, abi: a, functionName: "assetFundedAmount", args: [i] }),
    publicClient.readContract({ address: c, abi: a, functionName: "assetFundingTarget", args: [i] }),
    publicClient.readContract({ address: c, abi: a, functionName: "assetMaturity", args: [i] }),
    publicClient.readContract({ address: c, abi: a, functionName: "assetYieldBps", args: [i] }),
    publicClient.readContract({ address: c, abi: a, functionName: "assetDocHash", args: [i] }),
    publicClient.readContract({ address: c, abi: a, functionName: "assetState", args: [i] }),
    publicClient.readContract({ address: c, abi: a, functionName: "assetPricePerUnit", args: [i] }),
    publicClient.readContract({ address: c, abi: a, functionName: "getAvailableUnits", args: [i] }),
    publicClient.readContract({ address: c, abi: a, functionName: "assetVerifier", args: [i] }),
    publicClient.readContract({ address: c, abi: a, functionName: "assetVerifiedAt", args: [i] }),
    publicClient.readContract({ address: c, abi: a, functionName: "assetCreatedAt", args: [i] }),
    publicClient.readContract({ address: c, abi: a, functionName: "assetExternalRef", args: [i] }),
  ]);

  return {
    id: BigInt(id),
    issuer: issuer as `0x${string}`,
    name: name as string,
    assetType: assetType as string,
    counterparty: counterparty as `0x${string}`,
    faceValue: faceValue as bigint,
    tokenSupply: tokenSupply as bigint,
    fundedAmount: fundedAmount as bigint,
    fundingTarget: fundingTarget as bigint,
    maturity: maturity as bigint,
    expectedYieldBps: yieldBps as bigint,
    documentHash: docHash as `0x${string}`,
    state: Number(state) as AssetState,
    pricePerUnit: pricePerUnit as bigint,
    availableUnits: availableUnits as bigint,
    verifier: verifier as `0x${string}`,
    verifiedAt: verifiedAt as bigint,
    createdAt: createdAt as bigint,
    externalRef: externalRef as string,
  };
}

export function useAsset(id: number | null) {
  const publicClient = usePublicClient();
  const [asset, setAsset] = useState<AssetData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  const refetch = useCallback(() => setRefreshKey((k) => k + 1), []);

  useEffect(() => {
    if (!publicClient || id === null) {
      setIsLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setIsLoading(true);
      try {
        const result = await fetchAsset(publicClient, id);
        if (!cancelled) setAsset(result);
      } catch (e) {
        console.error("Failed to fetch asset:", e);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [publicClient, id, refreshKey]);

  return { asset, isLoading, refetch };
}

export function useAllAssets() {
  const publicClient = usePublicClient();
  const [assets, setAssets] = useState<AssetData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    if (!publicClient) return;
    try {
      const countResult = await publicClient.readContract({
        address: ASETRA_ADDRESS,
        abi: ASETRA_ABI,
        functionName: "getAssetCount",
      });
      const total = Number(countResult);
      if (total === 0) {
        setAssets([]);
        return;
      }
      const results = await Promise.all(
        Array.from({ length: total }, (_, i) => fetchAsset(publicClient, i))
      );
      setAssets(results);
    } catch (e) {
      console.error("Failed to load assets:", e);
    } finally {
      setIsLoading(false);
    }
  }, [publicClient]);

  useEffect(() => {
    load();
  }, [load]);

  return { assets, isLoading, refetch: load };
}
