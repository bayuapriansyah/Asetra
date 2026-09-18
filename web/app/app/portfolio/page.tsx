"use client";

import { useState, useEffect, useCallback } from "react";
import { useAccount, usePublicClient, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { AppLayout } from "@/components/layout/AppLayout";
import { ASETRA_ABI } from "@/config/contracts";
import { useAsetraAddress } from "@/hooks/useContractAddresses";
import { RoleGuard } from "@/components/role/RoleGuard";
import { formatUSD, timestampToDate } from "@/lib/utils/format";
import { parseContractError } from "@/lib/utils/errors";
import { TxSuccessBanner } from "@/components/ui/TxSuccessBanner";
import { TxProgress } from "@/components/ui/TxProgress";
import { ASSET_STATE_LABELS, type AssetState } from "@/types/asset";
import {
  Wallet,
  TrendingUp,
  DollarSign,
  Clock,
  ExternalLink,
  Package,
  Shield,
  Layers,
  ArrowUpRight,
  Banknote,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { PortfolioSkeleton } from "@/components/skeleton/PageSkeletons";
import { motion, AnimatePresence } from "framer-motion";

interface Position {
  assetId: bigint;
  amount: bigint;
  totalInvested: bigint;
  holdingStart: bigint;
  accruedYield: bigint;
  claimedYield: bigint;
  collateralAmount: bigint;
  active: boolean;
}

interface PositionWithAsset extends Position {
  assetName: string;
  assetType: string;
  assetState: AssetState;
  borrowedAmount: bigint;
  liveYield: bigint;
  faceValue: bigint;
  tokenSupply: bigint;
  claimableProceeds: bigint;
}

const STATE_BADGE_STYLES: Record<AssetState, { bg: string; text: string; dot: string; border: string }> = {
  0: { bg: "bg-slate-500/10", text: "text-slate-300", dot: "bg-slate-400", border: "border-slate-500/20" },
  1: { bg: "bg-cyan-500/10", text: "text-cyan-300", dot: "bg-cyan-400", border: "border-cyan-500/20" },
  2: { bg: "bg-indigo-500/10", text: "text-indigo-300", dot: "bg-indigo-400", border: "border-indigo-500/20" },
  3: { bg: "bg-amber-500/10", text: "text-amber-300", dot: "bg-amber-400", border: "border-amber-500/20" },
  4: { bg: "bg-emerald-500/10", text: "text-emerald-300", dot: "bg-emerald-400", border: "border-emerald-500/20" },
  5: { bg: "bg-emerald-500/15", text: "text-emerald-300", dot: "bg-emerald-400 animate-pulse", border: "border-emerald-500/30" },
  6: { bg: "bg-sky-500/10", text: "text-sky-300", dot: "bg-sky-400", border: "border-sky-500/20" },
  7: { bg: "bg-teal-500/10", text: "text-teal-300", dot: "bg-teal-400", border: "border-teal-500/20" },
};

export default function PortfolioPage() {
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const ASETRA_ADDRESS = useAsetraAddress();
  const [positions, setPositions] = useState<PositionWithAsset[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const { writeContractAsync, data: claimTxHash, isPending: claimPending, reset: claimReset } = useWriteContract();
  const { isLoading: claimConfirming, isSuccess: claimSuccess, isError: claimIsError, error: claimError } = useWaitForTransactionReceipt({ hash: claimTxHash });
  const [claimingAssetId, setClaimingAssetId] = useState<string | null>(null);

  const loadPositions = useCallback(async () => {
    if (!publicClient || !address) return;
    try {
      const countResult = await publicClient.readContract({
        address: ASETRA_ADDRESS,
        abi: ASETRA_ABI,
        functionName: "getAssetCount",
      });
      const total = Number(countResult);
      const results: PositionWithAsset[] = [];

      for (let i = 0; i < total; i++) {
        try {
          const [pos, name, assetType, state, borrowed, liveYield, faceValue, tokenSupply, claimable] = await Promise.all([
            publicClient.readContract({ address: ASETRA_ADDRESS, abi: ASETRA_ABI, functionName: "getPosition", args: [BigInt(i), address] }),
            publicClient.readContract({ address: ASETRA_ADDRESS, abi: ASETRA_ABI, functionName: "assetName", args: [BigInt(i)] }),
            publicClient.readContract({ address: ASETRA_ADDRESS, abi: ASETRA_ABI, functionName: "assetType", args: [BigInt(i)] }),
            publicClient.readContract({ address: ASETRA_ADDRESS, abi: ASETRA_ABI, functionName: "assetState", args: [BigInt(i)] }),
            publicClient.readContract({ address: ASETRA_ADDRESS, abi: ASETRA_ABI, functionName: "getBorrowedAmount", args: [BigInt(i), address] }),
            publicClient.readContract({ address: ASETRA_ADDRESS, abi: ASETRA_ABI, functionName: "calculateYield", args: [BigInt(i), address] }),
            publicClient.readContract({ address: ASETRA_ADDRESS, abi: ASETRA_ABI, functionName: "assetFaceValue", args: [BigInt(i)] }),
            publicClient.readContract({ address: ASETRA_ADDRESS, abi: ASETRA_ABI, functionName: "assetTokenSupply", args: [BigInt(i)] }),
            publicClient.readContract({ address: ASETRA_ADDRESS, abi: ASETRA_ABI, functionName: "getClaimableProceeds", args: [BigInt(i), address] }),
          ]);

          const posData = pos as readonly [bigint, bigint, bigint, bigint, bigint, bigint, bigint, boolean];
          if (posData[7] && posData[0] > BigInt(0)) {
            results.push({
              assetId: BigInt(i),
              amount: posData[0],
              totalInvested: posData[1],
              holdingStart: posData[2],
              accruedYield: posData[3],
              claimedYield: posData[4],
              collateralAmount: posData[5],
              active: posData[7],
              assetName: name as string,
              assetType: assetType as string,
              assetState: Number(state) as AssetState,
              borrowedAmount: borrowed as bigint,
              liveYield: liveYield as bigint,
              faceValue: faceValue as bigint,
              tokenSupply: tokenSupply as bigint,
              claimableProceeds: claimable as bigint,
            });
          }
        } catch {
          // skip
        }
      }

      setPositions(results);
    } catch (e) {
      console.error("Failed to load positions:", e);
    } finally {
      setIsLoading(false);
    }
  }, [publicClient, address]);

  useEffect(() => {
    if (isConnected) loadPositions();
    else setIsLoading(false);
  }, [isConnected, loadPositions]);

  useEffect(() => {
    if (claimSuccess) {
      claimReset();
      setClaimingAssetId(null);
      loadPositions();
    }
  }, [claimSuccess, claimReset, loadPositions]);

  const handleClaimProceeds = async (assetId: string) => {
    setClaimingAssetId(assetId);
    try {
      await writeContractAsync({
        address: ASETRA_ADDRESS,
        abi: ASETRA_ABI,
        functionName: "claimProceeds",
        args: [BigInt(assetId)],
      });
    } catch (e) {
      console.error("Claim failed:", e);
      setClaimingAssetId(null);
    }
  };

  const totalInvested = positions.reduce((acc, p) => acc + p.totalInvested, BigInt(0));
  const totalYield = positions.reduce((acc, p) => acc + p.liveYield, BigInt(0));
  const totalClaimable = positions.reduce((acc, p) => acc + p.claimableProceeds, BigInt(0));
  const totalCollateral = positions.reduce((acc, p) => {
    if (p.tokenSupply > BigInt(0)) {
      return acc + (p.collateralAmount * p.faceValue) / p.tokenSupply;
    }
    return acc;
  }, BigInt(0));
  const totalBorrowed = positions.reduce((acc, p) => acc + p.borrowedAmount, BigInt(0));

  return (
    <RoleGuard allowed={["investor"]}>
    <AppLayout>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2.5">
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white font-sans">
            Portfolio Holdings
          </h1>
          <span className="rounded-full bg-cyan-500/10 border border-cyan-500/20 px-2.5 py-0.5 text-xs font-mono font-medium text-cyan-400">
            On-Chain
          </span>
        </div>
        <p className="mt-1 text-sm text-slate-400">
          Complete breakdown of your tokenized real-world assets, live yields, and active collateral.
        </p>
      </div>

      {!isConnected ? (
        <div className="web3-card rounded-2xl p-12 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
            <Wallet className="h-7 w-7" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Connect Your Wallet</h3>
          <p className="text-sm text-slate-400 max-w-sm mx-auto mb-4">
            Connect your wallet to inspect your positions, yield performance, and manage collateral.
          </p>
        </div>
      ) : (
        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div key="skel" exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
              <PortfolioSkeleton />
            </motion.div>
          ) : (
            <motion.div key="content" initial={{opacity:0, y:12}} animate={{opacity:1, y:0}} transition={{duration:0.35, ease:[0.16,1,0.3,1]}}>

          {/* Claim Feedback */}
          {(claimPending || claimConfirming) && claimingAssetId && (
            <div className="mb-6">
              <TxProgress step={claimConfirming ? "pending" : claimPending ? "preparing" : "idle"} />
            </div>
          )}
          {claimSuccess && claimTxHash && (
            <div className="mb-6">
              <TxSuccessBanner txHash={claimTxHash} message="Proceeds claimed successfully!" onDismiss={claimReset} />
            </div>
          )}
          {claimIsError && claimError && (
            <div className="mb-6 rounded-xl border border-rose-500/30 bg-rose-500/10 p-4">
              <p className="text-sm font-medium text-rose-300">{parseContractError(claimError)}</p>
            </div>
          )}

          {/* Stat Cards Strip */}
          <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
            <div className="web3-card rounded-2xl p-4">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-[11px] font-mono uppercase tracking-wider">Total Invested</span>
                <DollarSign className="h-4 w-4 text-cyan-400" />
              </div>
              <div className="mt-2 text-2xl font-black font-mono text-white">
                {formatUSD(totalInvested)}
              </div>
            </div>

            <div className="web3-card rounded-2xl p-4">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-[11px] font-mono uppercase tracking-wider">Accrued Yield</span>
                <TrendingUp className="h-4 w-4 text-emerald-400" />
              </div>
              <div className="mt-2 text-2xl font-black font-mono text-emerald-400">
                {formatUSD(totalYield)}
              </div>
            </div>

            <div className="web3-card rounded-2xl p-4 border border-emerald-500/30 bg-emerald-500/[0.06]">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-[11px] font-mono uppercase tracking-wider">Claimable</span>
                <Banknote className="h-4 w-4 text-emerald-400" />
              </div>
              <div className="mt-2 text-2xl font-black font-mono text-emerald-300">
                {formatUSD(totalClaimable)}
              </div>
            </div>

            <div className="web3-card rounded-2xl p-4">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-[11px] font-mono uppercase tracking-wider">Collateral Locked</span>
                <Shield className="h-4 w-4 text-sky-400" />
              </div>
              <div className="mt-2 text-2xl font-black font-mono text-sky-300">
                {formatUSD(totalCollateral)}
              </div>
            </div>

            <div className="web3-card rounded-2xl p-4">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-[11px] font-mono uppercase tracking-wider">Active Debt</span>
                <Wallet className="h-4 w-4 text-amber-400" />
              </div>
              <div className="mt-2 text-2xl font-black font-mono text-amber-400">
                {formatUSD(totalBorrowed)}
              </div>
            </div>

            <div className="web3-card rounded-2xl p-4">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-[11px] font-mono uppercase tracking-wider">Positions</span>
                <Layers className="h-4 w-4 text-cyan-400" />
              </div>
              <div className="mt-2 text-2xl font-black font-mono text-white">
                {positions.length}
              </div>
            </div>
          </div>

          {/* Positions Table */}
          {positions.length === 0 ? (
            <div className="web3-card rounded-2xl p-16 text-center">
              <Package className="mx-auto mb-3 h-12 w-12 text-slate-600" />
              <h3 className="text-lg font-bold text-white mb-1">No Active Positions</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto mb-4">
                You haven&apos;t participated in any RWA primary offerings yet. Browse the marketplace to fund assets.
              </p>
              <Link
                href="/app/marketplace"
                className="inline-flex items-center gap-1.5 rounded-xl bg-cyan-400 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-cyan-300 transition-colors"
              >
                Go to Marketplace
              </Link>
            </div>
          ) : (
            <div className="web3-card rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="border-b border-white/[0.08] bg-slate-950/80 text-[11px] uppercase tracking-wider text-slate-400 font-mono">
                    <tr>
                      <th className="px-5 py-3.5">Asset</th>
                      <th className="px-4 py-3.5">Status</th>
                      <th className="px-4 py-3.5 text-right">Tokens</th>
                      <th className="px-4 py-3.5 text-right">Invested</th>
                      <th className="px-4 py-3.5 text-right">Current Value</th>
                      <th className="px-4 py-3.5 text-right">Yield</th>
                      <th className="px-4 py-3.5 text-right">Claimable</th>
                      <th className="px-4 py-3.5 text-right">Collateral</th>
                      <th className="px-4 py-3.5 text-right">Borrowed</th>
                      <th className="px-4 py-3.5">Holding Since</th>
                      <th className="px-5 py-3.5 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04]">
                    {positions.map((p) => {
                      const currentValue =
                        p.tokenSupply > BigInt(0)
                          ? (p.amount * p.faceValue) / p.tokenSupply
                          : BigInt(0);
                      const badge = STATE_BADGE_STYLES[p.assetState] || STATE_BADGE_STYLES[0];
                      const isClaimingThis = claimingAssetId === p.assetId.toString() && (claimPending || claimConfirming);

                      return (
                        <tr
                          key={p.assetId.toString()}
                          className="hover:bg-slate-800/30 transition-colors duration-150"
                        >
                          <td className="px-5 py-4">
                            <Link
                              href={`/app/assets/${p.assetId}`}
                              className="group flex items-center gap-2.5"
                            >
                              <span className="rounded-md bg-slate-800 border border-white/[0.08] px-1.5 py-0.5 text-[10px] text-cyan-400">
                                #{p.assetId.toString()}
                              </span>
                              <div>
                                <div className="font-bold text-white group-hover:text-cyan-300 font-sans text-sm transition-colors">
                                  {p.assetName}
                                </div>
                                <div className="text-[10px] text-slate-400 font-mono">{p.assetType}</div>
                              </div>
                            </Link>
                          </td>

                          <td className="px-4 py-4">
                            <span
                              className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-mono font-medium ${badge.bg} ${badge.text} ${badge.border}`}
                            >
                              <span className={`h-1.5 w-1.5 rounded-full ${badge.dot}`} />
                              {ASSET_STATE_LABELS[p.assetState]}
                            </span>
                          </td>

                          <td className="px-4 py-4 text-right font-bold text-slate-200">
                            {p.amount.toString()}
                          </td>

                          <td className="px-4 py-4 text-right text-slate-300">
                            {formatUSD(p.totalInvested)}
                          </td>

                          <td className="px-4 py-4 text-right font-bold text-white">
                            {formatUSD(currentValue)}
                          </td>

                          <td className="px-4 py-4 text-right font-bold text-emerald-400">
                            +{formatUSD(p.liveYield)}
                          </td>

                          <td className="px-4 py-4 text-right">
                            {p.claimableProceeds > BigInt(0) ? (
                              <span className="font-bold text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-2 py-0.5">
                                {formatUSD(p.claimableProceeds)}
                              </span>
                            ) : (
                              <span className="text-slate-500">—</span>
                            )}
                          </td>

                          <td className="px-4 py-4 text-right text-sky-400">
                            {p.collateralAmount > BigInt(0) ? formatUSD(p.collateralAmount) : "—"}
                          </td>

                          <td className="px-4 py-4 text-right text-amber-400">
                            {p.borrowedAmount > BigInt(0) ? formatUSD(p.borrowedAmount) : "—"}
                          </td>

                          <td className="px-4 py-4 text-slate-400">
                            {p.holdingStart > BigInt(0) ? timestampToDate(p.holdingStart) : "—"}
                          </td>

                          <td className="px-5 py-4 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              {p.claimableProceeds > BigInt(0) && (
                                <button
                                  onClick={() => handleClaimProceeds(p.assetId.toString())}
                                  disabled={isClaimingThis || claimSuccess}
                                  className="inline-flex items-center gap-1 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-bold text-emerald-300 hover:bg-emerald-500/20 transition-all disabled:opacity-50"
                                >
                                  {isClaimingThis ? (
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                  ) : (
                                    <Banknote className="h-3 w-3" />
                                  )}
                                  Claim
                                </button>
                              )}
                              <Link
                                href={`/app/assets/${p.assetId}`}
                                className="inline-flex items-center gap-1 rounded-lg border border-white/[0.08] bg-slate-800/60 px-2.5 py-1 text-[11px] font-medium text-slate-300 hover:border-cyan-400/40 hover:text-cyan-300 transition-all"
                              >
                                <span>Manage</span>
                                <ArrowUpRight className="h-3 w-3" />
                              </Link>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </motion.div>
          )}
        </AnimatePresence>
      )}
    </AppLayout>
    </RoleGuard>
  );
}
