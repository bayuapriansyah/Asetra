"use client";

import { useState, useEffect, useCallback } from "react";
import { useAccount, usePublicClient, useBalance, useReadContract } from "wagmi";
import { AppLayout } from "@/components/layout/AppLayout";
import { ASSETFLOW_ABI, TUSDT_ABI } from "@/config/contracts";
import { useAsetraAddress, useTusdtAddress } from "@/hooks/useContractAddresses";
import { formatUSD, shortenAddress } from "@/lib/utils/format";
import { ASSET_STATE_LABELS, type AssetState } from "@/types/asset";
import { useRole } from "@/lib/context/RoleContext";
import {
  TrendingUp,
  DollarSign,
  Shield,
  Wallet,
  RefreshCw,
  ArrowRight,
  ArrowUpRight,
  PlusCircle,
  Layers,
  ArrowLeftRight,
  ShieldCheck,
  FileStack,
  Clock,
  CheckCircle2,
  Eye,
} from "lucide-react";
import Link from "next/link";
import { DashboardSkeleton } from "@/components/skeleton/PageSkeletons";
import { motion, AnimatePresence } from "framer-motion";

interface PositionData {
  assetId: number;
  assetName: string;
  assetState: AssetState;
  amount: bigint;
  totalInvested: bigint;
  accruedYield: bigint;
  collateralAmount: bigint;
  borrowedAmount: bigint;
  faceValue: bigint;
  tokenSupply: bigint;
}

interface AssetSummary {
  totalAssets: number;
  pendingCount: number;
  verifiedCount: number;
  tokenizedCount: number;
  listedCount: number;
  activeCount: number;
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

export default function OverviewPage() {
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const { role } = useRole();
  const ASSETFLOW_ADDRESS = useAsetraAddress();
  const TUSDT_ADDRESS = useTusdtAddress();
  const { data: balanceData } = useBalance({ address });
  const { data: tusdtBalance } = useReadContract({
    address: TUSDT_ADDRESS,
    abi: TUSDT_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
  });
  const [positions, setPositions] = useState<PositionData[]>([]);
  const [assetSummary, setAssetSummary] = useState<AssetSummary>({
    totalAssets: 0,
    pendingCount: 0,
    verifiedCount: 0,
    tokenizedCount: 0,
    listedCount: 0,
    activeCount: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  const loadOverview = useCallback(async () => {
    if (!publicClient || !address) return;
    setIsLoading(true);
    try {
      const countResult = await publicClient.readContract({
        address: ASSETFLOW_ADDRESS,
        abi: ASSETFLOW_ABI,
        functionName: "getAssetCount",
      });
      const total = Number(countResult);
      const results: PositionData[] = [];
      const summary: AssetSummary = {
        totalAssets: total,
        pendingCount: 0,
        verifiedCount: 0,
        tokenizedCount: 0,
        listedCount: 0,
        activeCount: 0,
      };

      for (let i = 0; i < total; i++) {
        try {
          const [pos, name, state, liveYield, borrowed, faceValue, tokenSupply] = await Promise.all([
            publicClient.readContract({
              address: ASSETFLOW_ADDRESS,
              abi: ASSETFLOW_ABI,
              functionName: "getPosition",
              args: [BigInt(i), address],
            }),
            publicClient.readContract({
              address: ASSETFLOW_ADDRESS,
              abi: ASSETFLOW_ABI,
              functionName: "assetName",
              args: [BigInt(i)],
            }),
            publicClient.readContract({
              address: ASSETFLOW_ADDRESS,
              abi: ASSETFLOW_ABI,
              functionName: "assetState",
              args: [BigInt(i)],
            }),
            publicClient.readContract({
              address: ASSETFLOW_ADDRESS,
              abi: ASSETFLOW_ABI,
              functionName: "calculateYield",
              args: [BigInt(i), address],
            }),
            publicClient.readContract({
              address: ASSETFLOW_ADDRESS,
              abi: ASSETFLOW_ABI,
              functionName: "getBorrowedAmount",
              args: [BigInt(i), address],
            }),
            publicClient.readContract({
              address: ASSETFLOW_ADDRESS,
              abi: ASSETFLOW_ABI,
              functionName: "assetFaceValue",
              args: [BigInt(i)],
            }),
            publicClient.readContract({
              address: ASSETFLOW_ADDRESS,
              abi: ASSETFLOW_ABI,
              functionName: "assetTokenSupply",
              args: [BigInt(i)],
            }),
          ]);

          const stateNum = Number(state) as AssetState;
          if (stateNum === 0) summary.pendingCount++;
          else if (stateNum === 1) summary.verifiedCount++;
          else if (stateNum === 2) summary.tokenizedCount++;
          else if (stateNum === 3) summary.listedCount++;
          else if (stateNum >= 4) summary.activeCount++;

          const p = pos as readonly [bigint, bigint, bigint, bigint, bigint, bigint, bigint, boolean];
          if (p[7] && p[0] > BigInt(0)) {
            const faceVal = faceValue as bigint;
            const supply = tokenSupply as bigint;
            results.push({
              assetId: i,
              assetName: name as string,
              assetState: stateNum,
              amount: p[0],
              totalInvested: p[1],
              accruedYield: liveYield as bigint,
              collateralAmount: p[5],
              borrowedAmount: borrowed as bigint,
              faceValue: faceVal,
              tokenSupply: supply,
            });
          }
        } catch {
          /* skip */
        }
      }
      setPositions(results);
      setAssetSummary(summary);
    } catch (e) {
      console.error("Failed to load overview:", e);
    } finally {
      setIsLoading(false);
    }
  }, [publicClient, address]);

  useEffect(() => {
    if (isConnected) loadOverview();
    else setIsLoading(false);
  }, [isConnected, loadOverview]);

  const totalInvested = positions.reduce((a, p) => a + p.totalInvested, BigInt(0));
  const totalYield = positions.reduce((a, p) => a + p.accruedYield, BigInt(0));
  const totalCollateral = positions.reduce((a, p) => {
    if (p.tokenSupply > BigInt(0)) {
      return a + (p.collateralAmount * p.faceValue) / p.tokenSupply;
    }
    return a;
  }, BigInt(0));
  const totalBorrowed = positions.reduce((a, p) => a + p.borrowedAmount, BigInt(0));

  return (
    <AppLayout>
      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white font-sans">
              {role === "admin" && "Protocol Overview"}
              {role === "issuer" && "Issuer Dashboard"}
              {role === "investor" && "Portfolio Overview"}
            </h1>
            <span className="rounded-full bg-cyan-500/10 border border-cyan-500/20 px-2.5 py-0.5 text-xs font-mono font-medium text-cyan-400">
              Live
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-400">
            {role === "admin" && "Monitor all assets, verification queue, and protocol health."}
            {role === "issuer" && "Manage your originated assets and tokenization pipeline."}
            {role === "investor" && "Real-world asset positions, live yields, and collateralized borrowing health."}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isConnected && (
            <button
              onClick={loadOverview}
              disabled={isLoading}
              title="Refresh"
              className="flex items-center gap-2 rounded-xl border border-white/[0.08] bg-slate-900/80 px-3.5 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition-all disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin text-cyan-400" : ""}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          )}
          <Link
            href="/app/marketplace"
            className="flex items-center gap-1.5 rounded-xl bg-cyan-400 px-4 py-2 text-xs sm:text-sm font-bold text-slate-950 shadow-md shadow-cyan-500/20 hover:bg-cyan-300 hover:shadow-cyan-500/35 transition-all"
          >
            <span>Explore Assets</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {!isConnected ? (
        <div className="web3-card rounded-2xl p-12 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
            <Wallet className="h-7 w-7" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Connect Your Wallet</h3>
          <p className="mx-auto max-w-md text-sm text-slate-400 mb-6">
            Connect your Web3 wallet on BOT Chain Testnet to continue.
          </p>
          <div className="inline-block">
            <p className="text-xs font-mono text-cyan-400">Click &quot;Connect Wallet&quot; in the navigation bar above.</p>
          </div>
        </div>
      ) : (
        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div key="skel" exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
              <DashboardSkeleton />
            </motion.div>
          ) : (
            <motion.div key="content" initial={{opacity:0, y:12}} animate={{opacity:1, y:0}} transition={{duration:0.35, ease:[0.16,1,0.3,1]}}>
          {/* ============ ADMIN DASHBOARD ============ */}
          {role === "admin" && (
            <>
              <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="web3-card web3-card-hover rounded-2xl p-5 relative overflow-hidden group">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono uppercase tracking-wider text-slate-400">Total Assets</span>
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                      <Layers className="h-4 w-4" />
                    </div>
                  </div>
                  <div className="mt-3 text-3xl font-extrabold font-mono text-white tracking-tight">{assetSummary.totalAssets}</div>
                  <div className="absolute -bottom-8 -right-8 h-24 w-24 rounded-full bg-cyan-500/[0.05] blur-xl group-hover:bg-cyan-500/[0.1] transition-all" />
                </div>

                <div className="web3-card web3-card-hover rounded-2xl p-5 relative overflow-hidden group">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono uppercase tracking-wider text-slate-400">Pending Verification</span>
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
                      <Clock className="h-4 w-4" />
                    </div>
                  </div>
                  <div className="mt-3 text-3xl font-extrabold font-mono text-amber-400 tracking-tight">{assetSummary.pendingCount}</div>
                  <div className="mt-2 text-xs text-slate-400">
                    <Link href="/app/admin/verify" className="text-amber-400/90 hover:underline flex items-center gap-1">
                      <span>Review Queue</span>
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                  <div className="absolute -bottom-8 -right-8 h-24 w-24 rounded-full bg-amber-500/[0.05] blur-xl group-hover:bg-amber-500/[0.1] transition-all" />
                </div>

                <div className="web3-card web3-card-hover rounded-2xl p-5 relative overflow-hidden group">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono uppercase tracking-wider text-slate-400">Verified</span>
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                      <ShieldCheck className="h-4 w-4" />
                    </div>
                  </div>
                  <div className="mt-3 text-3xl font-extrabold font-mono text-emerald-400 tracking-tight">{assetSummary.verifiedCount}</div>
                  <div className="absolute -bottom-8 -right-8 h-24 w-24 rounded-full bg-emerald-500/[0.05] blur-xl group-hover:bg-emerald-500/[0.1] transition-all" />
                </div>

                <div className="web3-card web3-card-hover rounded-2xl p-5 relative overflow-hidden group">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono uppercase tracking-wider text-slate-400">Active / Settled</span>
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400">
                      <CheckCircle2 className="h-4 w-4" />
                    </div>
                  </div>
                  <div className="mt-3 text-3xl font-extrabold font-mono text-sky-300 tracking-tight">{assetSummary.activeCount}</div>
                  <div className="absolute -bottom-8 -right-8 h-24 w-24 rounded-full bg-sky-500/[0.05] blur-xl group-hover:bg-sky-500/[0.1] transition-all" />
                </div>
              </div>

              {/* Quick Actions */}
              <div className="mb-8 grid gap-4 md:grid-cols-3">
                <Link href="/app/admin/verify" className="web3-card web3-card-hover rounded-2xl p-4 flex items-center justify-between group">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/15 border border-blue-500/30 text-blue-400">
                      <ShieldCheck className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white group-hover:text-blue-300 transition-colors">Verification Queue</h4>
                      <p className="text-xs text-slate-400">Review pending asset documents</p>
                    </div>
                  </div>
                  <ArrowUpRight className="h-4 w-4 text-slate-500 group-hover:text-blue-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                </Link>

                <Link href="/app/activity" className="web3-card web3-card-hover rounded-2xl p-4 flex items-center justify-between group">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-400">
                      <Eye className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white group-hover:text-purple-300 transition-colors">On-Chain Activity</h4>
                      <p className="text-xs text-slate-400">Monitor all protocol events</p>
                    </div>
                  </div>
                  <ArrowUpRight className="h-4 w-4 text-slate-500 group-hover:text-purple-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                </Link>

                <Link href="/app/marketplace" className="web3-card web3-card-hover rounded-2xl p-4 flex items-center justify-between group">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-400">
                      <Layers className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors">View Marketplace</h4>
                      <p className="text-xs text-slate-400">See all listed assets</p>
                    </div>
                  </div>
                  <ArrowUpRight className="h-4 w-4 text-slate-500 group-hover:text-cyan-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                </Link>
              </div>
            </>
          )}

          {/* ============ ISSUER DASHBOARD ============ */}
          {role === "issuer" && (
            <>
              <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="web3-card web3-card-hover rounded-2xl p-5 relative overflow-hidden group">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono uppercase tracking-wider text-slate-400">Total Assets</span>
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                      <Layers className="h-4 w-4" />
                    </div>
                  </div>
                  <div className="mt-3 text-3xl font-extrabold font-mono text-white tracking-tight">{assetSummary.totalAssets}</div>
                  <div className="absolute -bottom-8 -right-8 h-24 w-24 rounded-full bg-cyan-500/[0.05] blur-xl group-hover:bg-cyan-500/[0.1] transition-all" />
                </div>

                <div className="web3-card web3-card-hover rounded-2xl p-5 relative overflow-hidden group">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono uppercase tracking-wider text-slate-400">Listed</span>
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
                      <FileStack className="h-4 w-4" />
                    </div>
                  </div>
                  <div className="mt-3 text-3xl font-extrabold font-mono text-amber-400 tracking-tight">{assetSummary.listedCount}</div>
                  <div className="absolute -bottom-8 -right-8 h-24 w-24 rounded-full bg-amber-500/[0.05] blur-xl group-hover:bg-amber-500/[0.1] transition-all" />
                </div>

                <div className="web3-card web3-card-hover rounded-2xl p-5 relative overflow-hidden group">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono uppercase tracking-wider text-slate-400">Tokenized</span>
                  </div>
                  <div className="mt-3 text-3xl font-extrabold font-mono text-indigo-400 tracking-tight">{assetSummary.tokenizedCount}</div>
                  <div className="absolute -bottom-8 -right-8 h-24 w-24 rounded-full bg-indigo-500/[0.05] blur-xl group-hover:bg-indigo-500/[0.1] transition-all" />
                </div>

                <div className="web3-card web3-card-hover rounded-2xl p-5 relative overflow-hidden group">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono uppercase tracking-wider text-slate-400">Pending Verify</span>
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-500/10 border border-slate-500/20 text-slate-400">
                      <Clock className="h-4 w-4" />
                    </div>
                  </div>
                  <div className="mt-3 text-3xl font-extrabold font-mono text-slate-300 tracking-tight">{assetSummary.pendingCount}</div>
                  <div className="absolute -bottom-8 -right-8 h-24 w-24 rounded-full bg-slate-500/[0.05] blur-xl group-hover:bg-slate-500/[0.1] transition-all" />
                </div>
              </div>

              <div className="mb-8 grid gap-4 md:grid-cols-2">
                <Link href="/app/issuer/create" className="web3-card web3-card-hover rounded-2xl p-4 flex items-center justify-between group">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
                      <PlusCircle className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white group-hover:text-emerald-300 transition-colors">Create New Asset</h4>
                      <p className="text-xs text-slate-400">Originate &amp; tokenize real-world assets</p>
                    </div>
                  </div>
                  <ArrowUpRight className="h-4 w-4 text-slate-500 group-hover:text-emerald-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                </Link>

                <Link href="/app/issuer/assets" className="web3-card web3-card-hover rounded-2xl p-4 flex items-center justify-between group">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-400">
                      <FileStack className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors">My Offerings</h4>
                      <p className="text-xs text-slate-400">Manage your originated assets</p>
                    </div>
                  </div>
                  <ArrowUpRight className="h-4 w-4 text-slate-500 group-hover:text-cyan-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                </Link>
              </div>
            </>
          )}

          {/* ============ INVESTOR DASHBOARD ============ */}
          {role === "investor" && (
            <>
              <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="web3-card web3-card-hover rounded-2xl p-5 relative overflow-hidden group">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono uppercase tracking-wider text-slate-400">Total Portfolio Value</span>
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                      <DollarSign className="h-4 w-4" />
                    </div>
                  </div>
                  <div className="mt-3 text-3xl font-extrabold font-mono text-white tracking-tight">{formatUSD(totalInvested)}</div>
                  <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-400">
                    <span className="font-semibold text-cyan-400 font-mono">{positions.length}</span>
                    <span>active {positions.length === 1 ? "position" : "positions"}</span>
                  </div>
                  <div className="absolute -bottom-8 -right-8 h-24 w-24 rounded-full bg-cyan-500/[0.05] blur-xl group-hover:bg-cyan-500/[0.1] transition-all" />
                </div>

                <div className="web3-card web3-card-hover rounded-2xl p-5 relative overflow-hidden group">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono uppercase tracking-wider text-slate-400">Accrued Yield</span>
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                      <TrendingUp className="h-4 w-4" />
                    </div>
                  </div>
                  <div className="mt-3 text-3xl font-extrabold font-mono text-emerald-400 tracking-tight">{formatUSD(totalYield)}</div>
                  <div className="mt-2 flex items-center gap-1 text-xs text-emerald-400/90 font-medium">
                    <span className="relative flex h-1.5 w-1.5 mr-1">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    </span>
                    <span>Live On-Chain Earning</span>
                  </div>
                  <div className="absolute -bottom-8 -right-8 h-24 w-24 rounded-full bg-emerald-500/[0.05] blur-xl group-hover:bg-emerald-500/[0.1] transition-all" />
                </div>

                <div className="web3-card web3-card-hover rounded-2xl p-5 relative overflow-hidden group">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono uppercase tracking-wider text-slate-400">Active Collateral</span>
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400">
                      <Shield className="h-4 w-4" />
                    </div>
                  </div>
                  <div className="mt-3 text-3xl font-extrabold font-mono text-sky-300 tracking-tight">{formatUSD(totalCollateral)}</div>
                  <div className="mt-2 text-xs text-slate-400"><span>Locked in Credit Facility</span></div>
                  <div className="absolute -bottom-8 -right-8 h-24 w-24 rounded-full bg-sky-500/[0.05] blur-xl group-hover:bg-sky-500/[0.1] transition-all" />
                </div>

                <div className="web3-card web3-card-hover rounded-2xl p-5 relative overflow-hidden group">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono uppercase tracking-wider text-slate-400">Outstanding Debt</span>
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
                      <Wallet className="h-4 w-4" />
                    </div>
                  </div>
                  <div className="mt-3 text-3xl font-extrabold font-mono text-amber-400 tracking-tight">{formatUSD(totalBorrowed)}</div>
                  <div className="mt-2 text-xs text-slate-400">
                    <Link href="/app/borrow" className="text-amber-400/90 hover:underline flex items-center gap-1">
                      <span>Manage Credit Line</span>
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                  <div className="absolute -bottom-8 -right-8 h-24 w-24 rounded-full bg-amber-500/[0.05] blur-xl group-hover:bg-amber-500/[0.1] transition-all" />
                </div>
              </div>

              {/* Wallet Balances */}
              <div className="mb-8 grid gap-4 sm:grid-cols-2">
                <div className="web3-card rounded-2xl p-5 flex items-center justify-between">
                  <div>
                    <div className="text-[11px] text-slate-500 uppercase font-mono">BOHR Balance</div>
                    <div className="mt-1 text-xl font-bold font-mono text-white">
                      {balanceData ? `${(Number(balanceData.value) / 10 ** balanceData.decimals).toFixed(4)} BOHR` : "—"}
                    </div>
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                    <Wallet className="h-5 w-5" />
                  </div>
                </div>
                <div className="web3-card rounded-2xl p-5 flex items-center justify-between">
                  <div>
                    <div className="text-[11px] text-slate-500 uppercase font-mono">tUSDT Balance</div>
                    <div className="mt-1 text-xl font-bold font-mono text-emerald-400">
                      {tusdtBalance !== undefined ? `${(Number(tusdtBalance) / 1e6).toFixed(2)} tUSDT` : "—"}
                    </div>
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                    <DollarSign className="h-5 w-5" />
                  </div>
                </div>
              </div>
              <div className="mb-8 grid gap-4 md:grid-cols-3">
                <Link href="/app/marketplace" className="web3-card web3-card-hover rounded-2xl p-4 flex items-center justify-between group">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-400">
                      <Layers className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors">Primary Marketplace</h4>
                      <p className="text-xs text-slate-400">Browse verified institutional RWAs</p>
                    </div>
                  </div>
                  <ArrowUpRight className="h-4 w-4 text-slate-500 group-hover:text-cyan-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                </Link>

                <Link href="/app/trading" className="web3-card web3-card-hover rounded-2xl p-4 flex items-center justify-between group">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
                      <ArrowLeftRight className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white group-hover:text-emerald-300 transition-colors">Secondary P2P Market</h4>
                      <p className="text-xs text-slate-400">Buy &amp; sell fractional tokens</p>
                    </div>
                  </div>
                  <ArrowUpRight className="h-4 w-4 text-slate-500 group-hover:text-emerald-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                </Link>

                <Link href="/app/yield" className="web3-card web3-card-hover rounded-2xl p-4 flex items-center justify-between group">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/15 border border-sky-500/30 text-sky-400">
                      <TrendingUp className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white group-hover:text-sky-300 transition-colors">Yield &amp; Staking</h4>
                      <p className="text-xs text-slate-400">Track accrual &amp; claim rewards</p>
                    </div>
                  </div>
                  <ArrowUpRight className="h-4 w-4 text-slate-500 group-hover:text-sky-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                </Link>
              </div>

              {/* Positions Table */}
              <div className="web3-card rounded-2xl p-6">
                <div className="mb-6 flex items-center justify-between border-b border-white/[0.06] pb-4">
                  <div>
                    <h2 className="text-lg font-bold text-white">Active Positions</h2>
                    <p className="text-xs text-slate-400">Your tokenized RWA holdings across BOT Chain</p>
                  </div>
                  <span className="rounded-full bg-slate-800/80 border border-white/[0.08] px-2.5 py-1 text-xs font-mono text-slate-300">
                    {positions.length} {positions.length === 1 ? "position" : "positions"}
                  </span>
                </div>

                {positions.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-white/[0.1] bg-slate-950/40 p-10 text-center">
                    <Layers className="mx-auto mb-3 h-10 w-10 text-slate-600" />
                    <h3 className="text-base font-semibold text-slate-300 mb-1">No Active Positions Yet</h3>
                    <p className="text-xs text-slate-400 max-w-sm mx-auto mb-4">
                      Visit the marketplace to explore verified offerings.
                    </p>
                    <Link href="/app/marketplace" className="inline-flex items-center gap-1.5 rounded-xl bg-cyan-400 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-cyan-300 transition-colors">
                      Explore Marketplace
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {positions.map((p) => {
                      const badge = STATE_BADGE_STYLES[p.assetState] || STATE_BADGE_STYLES[0];
                      return (
                        <Link
                          key={p.assetId}
                          href={`/app/assets/${p.assetId}`}
                          className="group flex flex-col gap-4 rounded-xl border border-white/[0.06] bg-slate-900/50 p-4 transition-all duration-200 hover:border-cyan-500/40 hover:bg-slate-900/90 sm:flex-row sm:items-center sm:justify-between"
                        >
                          <div className="flex items-center gap-3.5">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-900 border border-white/[0.08] text-cyan-400 font-mono font-bold text-sm">
                              #{p.assetId}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-white group-hover:text-cyan-300 transition-colors">{p.assetName}</span>
                                <span className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-mono font-medium ${badge.bg} ${badge.text} ${badge.border}`}>
                                  <span className={`h-1.5 w-1.5 rounded-full ${badge.dot}`} />
                                  {ASSET_STATE_LABELS[p.assetState]}
                                </span>
                              </div>
                              <div className="text-xs font-mono text-slate-400 mt-0.5">Account: {shortenAddress(address!)}</div>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-6 sm:gap-8 text-xs font-mono">
                            <div className="text-right">
                              <div className="text-[11px] uppercase tracking-wider text-slate-500 font-sans">Tokens</div>
                              <div className="font-bold text-slate-200 text-sm">{p.amount.toString()}</div>
                            </div>
                            <div className="text-right">
                              <div className="text-[11px] uppercase tracking-wider text-slate-500 font-sans">Invested</div>
                              <div className="font-bold text-slate-100 text-sm">{formatUSD(p.totalInvested)}</div>
                            </div>
                            <div className="text-right">
                              <div className="text-[11px] uppercase tracking-wider text-slate-500 font-sans">Yield</div>
                              <div className="font-bold text-emerald-400 text-sm">{formatUSD(p.accruedYield)}</div>
                            </div>
                            {p.collateralAmount > BigInt(0) && (
                              <div className="text-right">
                                <div className="text-[11px] uppercase tracking-wider text-slate-500 font-sans">Collateral</div>
                                <div className="font-bold text-sky-400 text-sm">{formatUSD(p.collateralAmount)}</div>
                              </div>
                            )}
                            {p.borrowedAmount > BigInt(0) && (
                              <div className="text-right">
                                <div className="text-[11px] uppercase tracking-wider text-slate-500 font-sans">Borrowed</div>
                                <div className="font-bold text-amber-400 text-sm">{formatUSD(p.borrowedAmount)}</div>
                              </div>
                            )}
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.08] bg-slate-800/40 text-slate-400 group-hover:border-cyan-400/40 group-hover:text-cyan-400 transition-colors">
                              <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}
        </motion.div>
          )}
        </AnimatePresence>
      )}
    </AppLayout>
  );
}
