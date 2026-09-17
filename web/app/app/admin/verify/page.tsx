"use client";

import { useState, useEffect, useCallback } from "react";
import { useAccount, usePublicClient } from "wagmi";
import { AppLayout } from "@/components/layout/AppLayout";
import { ASETRA_ABI } from "@/config/contracts";
import { useAsetraAddress } from "@/hooks/useContractAddresses";
import { useVerifyAsset } from "@/hooks/useLifecycle";
import { TxSuccessBanner } from "@/components/ui/TxSuccessBanner";
import { TxProgress } from "@/components/ui/TxProgress";
import { parseContractError } from "@/lib/utils/errors";
import { ShieldCheck, RefreshCw, ExternalLink, CheckCircle2, Clock } from "lucide-react";
import { AdminVerifySkeleton } from "@/components/skeleton/PageSkeletons";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { RoleGuard } from "@/components/role/RoleGuard";

interface PendingAsset {
  assetId: number;
  name: string;
  counterparty: string;
  faceValue: bigint;
  docHash: string;
  createdAt: bigint;
}

export default function AdminVerifyPage() {
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const ASETRA_ADDRESS = useAsetraAddress();
  const { verify, txHash, isPending, isConfirming, isSuccess, isError, error, reset } = useVerifyAsset();
  const [pendingAssets, setPendingAssets] = useState<PendingAsset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [verifyingId, setVerifyingId] = useState<number | null>(null);

  const loadPending = useCallback(async () => {
    if (!publicClient) return;
    setIsLoading(true);
    try {
      const countResult = await publicClient.readContract({
        address: ASETRA_ADDRESS,
        abi: ASETRA_ABI,
        functionName: "getAssetCount",
      });
      const total = Number(countResult);
      const pending: PendingAsset[] = [];

      for (let i = 0; i < total; i++) {
        try {
          const [state, name, counterparty, faceValue, docHash, createdAt] = await Promise.all([
            publicClient.readContract({
              address: ASETRA_ADDRESS,
              abi: ASETRA_ABI,
              functionName: "assetState",
              args: [BigInt(i)],
            }),
            publicClient.readContract({
              address: ASETRA_ADDRESS,
              abi: ASETRA_ABI,
              functionName: "assetName",
              args: [BigInt(i)],
            }),
            publicClient.readContract({
              address: ASETRA_ADDRESS,
              abi: ASETRA_ABI,
              functionName: "assetCounterparty",
              args: [BigInt(i)],
            }),
            publicClient.readContract({
              address: ASETRA_ADDRESS,
              abi: ASETRA_ABI,
              functionName: "assetFaceValue",
              args: [BigInt(i)],
            }),
            publicClient.readContract({
              address: ASETRA_ADDRESS,
              abi: ASETRA_ABI,
              functionName: "assetDocHash",
              args: [BigInt(i)],
            }),
            publicClient.readContract({
              address: ASETRA_ADDRESS,
              abi: ASETRA_ABI,
              functionName: "assetCreatedAt",
              args: [BigInt(i)],
            }),
          ]);

          if (Number(state) === 0) {
            pending.push({
              assetId: i,
              name: name as string,
              counterparty: counterparty as string,
              faceValue: faceValue as bigint,
              docHash: docHash as string,
              createdAt: createdAt as bigint,
            });
          }
        } catch {
          /* skip */
        }
      }
      setPendingAssets(pending);
    } catch (e) {
      console.error("Failed to load pending assets:", e);
    } finally {
      setIsLoading(false);
    }
  }, [publicClient]);

  useEffect(() => {
    loadPending();
  }, [loadPending]);

  useEffect(() => {
    if (isSuccess) {
      loadPending();
      setVerifyingId(null);
    }
  }, [isSuccess, loadPending]);

  const handleVerify = async (assetId: number) => {
    setVerifyingId(assetId);
    reset();
    try {
      await verify(assetId);
    } catch (e) {
      console.error("Verify failed:", e);
    }
  };

  return (
    <RoleGuard allowed={["admin"]}>
    <AppLayout>
      <div className="mb-8">
        <div className="flex items-center gap-2.5 mb-1">
          <h1 className="text-3xl font-black tracking-tight text-white">Verification Queue</h1>
          <span className="rounded-full bg-blue-500/10 border border-blue-500/20 px-2.5 py-0.5 text-xs font-mono font-medium text-blue-400">
            Admin
          </span>
        </div>
        <p className="text-sm text-slate-400">
          Review and verify asset documents on-chain. Only the deployer address can verify.
        </p>
      </div>

      {isSuccess && txHash && (
        <div className="mb-6">
          <TxSuccessBanner txHash={txHash} message="Asset verified successfully!" onDismiss={reset} />
        </div>
      )}

      {isError && error && (
        <div className="mb-6 rounded-xl border border-red-500/20 bg-red-500/5 p-4">
          <p className="text-sm font-medium text-red-400">{parseContractError(error)}</p>
        </div>
      )}

      {(isPending || isConfirming) && verifyingId !== null && (
        <div className="mb-6">
          <TxProgress step={isConfirming ? "pending" : isPending ? "preparing" : "idle"} />
        </div>
      )}

      <div className="mb-4 flex items-center justify-between">
        <span className="text-xs font-mono text-slate-400">
          {pendingAssets.length} asset{pendingAssets.length !== 1 ? "s" : ""} pending verification
        </span>
        <button
          onClick={loadPending}
          disabled={isLoading}
          className="flex items-center gap-2 rounded-xl border border-white/[0.08] bg-slate-900/80 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-800 transition-all disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin text-cyan-400" : ""}`} />
          Refresh
        </button>
      </div>

      <AnimatePresence mode="wait">
      {isLoading ? (
        <motion.div key="skel" exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
          <AdminVerifySkeleton />
        </motion.div>
      ) : pendingAssets.length === 0 ? (
        <motion.div key="content" initial={{opacity:0, y:12}} animate={{opacity:1, y:0}} transition={{duration:0.35, ease:[0.16,1,0.3,1]}} className="web3-card rounded-2xl p-12 text-center">
          <CheckCircle2 className="mx-auto mb-4 h-12 w-12 text-emerald-400/60" />
          <h3 className="text-lg font-bold text-white mb-2">All Clear</h3>
          <p className="text-sm text-slate-400">
            No assets pending verification. All assets have been reviewed.
          </p>
        </motion.div>
      ) : (
        <motion.div key="content" initial={{opacity:0, y:12}} animate={{opacity:1, y:0}} transition={{duration:0.35, ease:[0.16,1,0.3,1]}} className="space-y-3">
          {pendingAssets.map((asset) => (
            <div
              key={asset.assetId}
              className="web3-card rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-900 border border-white/[0.08] text-blue-400 font-mono font-bold">
                  #{asset.assetId}
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-bold text-white">{asset.name}</span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 text-[10px] font-mono text-amber-400">
                      <Clock className="h-2.5 w-2.5" />
                      PENDING
                    </span>
                  </div>
                  <div className="text-xs font-mono text-slate-400">
                    Counterparty: {asset.counterparty.slice(0, 6)}...{asset.counterparty.slice(-4)}
                  </div>
                  <div className="text-[11px] font-mono text-slate-500 mt-0.5">
                    Doc: {asset.docHash.slice(0, 10)}...{asset.docHash.slice(-6)}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Link
                  href={`/app/assets/${asset.assetId}`}
                  className="flex items-center gap-1 rounded-lg border border-white/[0.08] bg-slate-800/60 px-3 py-2 text-xs font-medium text-slate-300 hover:bg-slate-700 transition-colors"
                >
                  View
                  <ExternalLink className="h-3 w-3" />
                </Link>
                <button
                  onClick={() => handleVerify(asset.assetId)}
                  disabled={isPending || isConfirming}
                  className="flex items-center gap-2 rounded-xl bg-blue-500 px-4 py-2 text-xs font-bold text-white shadow-md shadow-blue-500/20 hover:bg-blue-400 transition-all disabled:opacity-50"
                >
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Verify
                </button>
              </div>
            </div>
          ))}
        </motion.div>
      )}
      </AnimatePresence>
    </AppLayout>
    </RoleGuard>
  );
}
