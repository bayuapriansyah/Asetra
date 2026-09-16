"use client";

import { useState, useEffect, useCallback } from "react";
import { useAccount, usePublicClient } from "wagmi";
import { AppLayout } from "@/components/layout/AppLayout";
import { AssetCard } from "@/components/asset/AssetCard";
import { ASETRA_ABI, ASETRA_ADDRESS } from "@/config/contracts";
import type { AssetData, AssetState } from "@/types/asset";
import { Package, Wallet, Plus, FolderKanban } from "lucide-react";
import { IssuerAssetsSkeleton } from "@/components/skeleton/PageSkeletons";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { RoleGuard } from "@/components/role/RoleGuard";

export default function IssuerAssetsPage() {
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const [assets, setAssets] = useState<AssetData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadAssets = useCallback(async () => {
    if (!publicClient || !address) return;
    setIsLoading(true);
    try {
      const countResult = await publicClient.readContract({
        address: ASETRA_ADDRESS, abi: ASETRA_ABI, functionName: "getAssetCount",
      });
      const total = Number(countResult);
      const results: AssetData[] = [];

      for (let i = 0; i < total; i++) {
        try {
          const [issuer, name, assetType, counterparty, faceValue, tokenSupply,
            fundedAmount, fundingTarget, maturity, yieldBps, docHash, state, pricePerUnit, availableUnits,
            verifier, verifiedAt, createdAt, externalRef,
          ] = await Promise.all([
            publicClient.readContract({ address: ASETRA_ADDRESS, abi: ASETRA_ABI, functionName: "assetIssuer", args: [BigInt(i)] }),
            publicClient.readContract({ address: ASETRA_ADDRESS, abi: ASETRA_ABI, functionName: "assetName", args: [BigInt(i)] }),
            publicClient.readContract({ address: ASETRA_ADDRESS, abi: ASETRA_ABI, functionName: "assetType", args: [BigInt(i)] }),
            publicClient.readContract({ address: ASETRA_ADDRESS, abi: ASETRA_ABI, functionName: "assetCounterparty", args: [BigInt(i)] }),
            publicClient.readContract({ address: ASETRA_ADDRESS, abi: ASETRA_ABI, functionName: "assetFaceValue", args: [BigInt(i)] }),
            publicClient.readContract({ address: ASETRA_ADDRESS, abi: ASETRA_ABI, functionName: "assetTokenSupply", args: [BigInt(i)] }),
            publicClient.readContract({ address: ASETRA_ADDRESS, abi: ASETRA_ABI, functionName: "assetFundedAmount", args: [BigInt(i)] }),
            publicClient.readContract({ address: ASETRA_ADDRESS, abi: ASETRA_ABI, functionName: "assetFundingTarget", args: [BigInt(i)] }),
            publicClient.readContract({ address: ASETRA_ADDRESS, abi: ASETRA_ABI, functionName: "assetMaturity", args: [BigInt(i)] }),
            publicClient.readContract({ address: ASETRA_ADDRESS, abi: ASETRA_ABI, functionName: "assetYieldBps", args: [BigInt(i)] }),
            publicClient.readContract({ address: ASETRA_ADDRESS, abi: ASETRA_ABI, functionName: "assetDocHash", args: [BigInt(i)] }),
            publicClient.readContract({ address: ASETRA_ADDRESS, abi: ASETRA_ABI, functionName: "assetState", args: [BigInt(i)] }),
            publicClient.readContract({ address: ASETRA_ADDRESS, abi: ASETRA_ABI, functionName: "assetPricePerUnit", args: [BigInt(i)] }),
            publicClient.readContract({ address: ASETRA_ADDRESS, abi: ASETRA_ABI, functionName: "getAvailableUnits", args: [BigInt(i)] }),
            publicClient.readContract({ address: ASETRA_ADDRESS, abi: ASETRA_ABI, functionName: "assetVerifier", args: [BigInt(i)] }),
            publicClient.readContract({ address: ASETRA_ADDRESS, abi: ASETRA_ABI, functionName: "assetVerifiedAt", args: [BigInt(i)] }),
            publicClient.readContract({ address: ASETRA_ADDRESS, abi: ASETRA_ABI, functionName: "assetCreatedAt", args: [BigInt(i)] }),
            publicClient.readContract({ address: ASETRA_ADDRESS, abi: ASETRA_ABI, functionName: "assetExternalRef", args: [BigInt(i)] }),
          ]);

          if ((issuer as string).toLowerCase() === address.toLowerCase()) {
            results.push({
              id: BigInt(i),
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
            });
          }
        } catch { /* skip */ }
      }
      setAssets(results);
    } catch (e) {
      console.error("Failed to load issuer assets:", e);
    } finally {
      setIsLoading(false);
    }
  }, [publicClient, address]);

  useEffect(() => {
    if (isConnected) loadAssets();
    else setIsLoading(false);
  }, [isConnected, loadAssets]);

  return (
    <RoleGuard allowed={["issuer"]}>
    <AppLayout>
      {/* Header Banner */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3">

          <div>
            <h1 className="text-3xl font-black tracking-tight text-white sm:text-4xl">Originator Portfolio</h1>
            <p className="mt-1 text-sm text-slate-400 font-mono">
              Monitor, verify, tokenize, and mature real-world assets originated under your credentials
            </p>
          </div>
        </div>

        <Link
          href="/app/issuer/create"
          className="inline-flex items-center gap-2 rounded-xl bg-cyan-400 px-5 py-2.5 text-xs font-bold text-slate-950 hover:bg-cyan-300 transition-colors shadow-sm"
        >
          <Plus className="h-4 w-4" />
          <span>New Asset</span>
        </Link>
      </div>

      {!isConnected ? (
        <div className="mx-auto max-w-2xl web3-card rounded-2xl p-12 text-center shadow-xl">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
            <Wallet className="h-8 w-8" />
          </div>
          <h2 className="text-xl font-black text-white">Connect Wallet</h2>
          <p className="mt-2 text-sm text-slate-400">Connect your Web3 wallet to manage your originated assets.</p>
        </div>
      ) : (
        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div key="skel" exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
              <IssuerAssetsSkeleton />
            </motion.div>
          ) : assets.length === 0 ? (
            <motion.div key="content" initial={{opacity:0, y:12}} animate={{opacity:1, y:0}} transition={{duration:0.35, ease:[0.16,1,0.3,1]}} className="web3-card rounded-2xl p-16 text-center shadow-xl">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-900 border border-white/[0.08] text-slate-500">
            <Package className="h-8 w-8" />
          </div>
          <h3 className="text-lg font-black text-white">No Assets Originated Yet</h3>
          <p className="mt-1 text-sm text-slate-400">You haven&apos;t tokenized any real-world assets on Bohr Chain yet.</p>
          <Link
            href="/app/issuer/create"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-cyan-400 px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-slate-950 hover:bg-cyan-300 transition-colors shadow-sm"
          >
            <Plus className="h-4 w-4" /> Create First Asset
          </Link>
        </motion.div>
      ) : (
        <motion.div key="content" initial={{opacity:0, y:12}} animate={{opacity:1, y:0}} transition={{duration:0.35, ease:[0.16,1,0.3,1]}} className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {assets.map((asset) => (
            <AssetCard key={asset.id.toString()} asset={asset} />
          ))}
        </motion.div>
          )}
        </AnimatePresence>
      )}
    </AppLayout>
    </RoleGuard>
  );
}

