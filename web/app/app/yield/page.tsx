"use client";

import { useState, useEffect, useCallback } from "react";
import { useAccount, usePublicClient } from "wagmi";
import { AppLayout } from "@/components/layout/AppLayout";
import { ASETRA_ABI } from "@/config/contracts";
import { useAsetraAddress } from "@/hooks/useContractAddresses";
import { RoleGuard } from "@/components/role/RoleGuard";
import { formatUSD } from "@/lib/utils/format";
import { ASSET_STATE_LABELS, type AssetState } from "@/types/asset";
import {
  TrendingUp,
  Award,
  DollarSign,
  Wallet,
  RefreshCw,
  ArrowRight,
  Gift,
  Clock,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { YieldSkeleton } from "@/components/skeleton/PageSkeletons";
import { motion, AnimatePresence } from "framer-motion";

interface YieldData {
  assetId: number;
  assetName: string;
  assetState: AssetState;
  amount: bigint;
  totalInvested: bigint;
  holdingStart: bigint;
  liveYield: bigint;
  claimedYield: bigint;
  holdingScore: bigint;
  holdingSeconds: number;
  maturity: bigint;
  yieldBps: bigint;
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

export default function YieldPage() {
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const ASETRA_ADDRESS = useAsetraAddress();
  const [yields, setYields] = useState<YieldData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadYield = useCallback(async () => {
    if (!publicClient || !address) return;
    setIsLoading(true);
    try {
      const countResult = await publicClient.readContract({
        address: ASETRA_ADDRESS,
        abi: ASETRA_ABI,
        functionName: "getAssetCount",
      });
      const total = Number(countResult);
      const results: YieldData[] = [];

      for (let i = 0; i < total; i++) {
        try {
          const [pos, name, state, liveYield, score, maturity, yieldBps] = await Promise.all([
            publicClient.readContract({
              address: ASETRA_ADDRESS,
              abi: ASETRA_ABI,
              functionName: "getPosition",
              args: [BigInt(i), address],
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
              functionName: "assetState",
              args: [BigInt(i)],
            }),
            publicClient.readContract({
              address: ASETRA_ADDRESS,
              abi: ASETRA_ABI,
              functionName: "calculateYield",
              args: [BigInt(i), address],
            }),
            publicClient.readContract({
              address: ASETRA_ADDRESS,
              abi: ASETRA_ABI,
              functionName: "getHoldingScore",
              args: [BigInt(i), address],
            }),
            publicClient.readContract({
              address: ASETRA_ADDRESS,
              abi: ASETRA_ABI,
              functionName: "assetMaturity",
              args: [BigInt(i)],
            }),
            publicClient.readContract({
              address: ASETRA_ADDRESS,
              abi: ASETRA_ABI,
              functionName: "assetYieldBps",
              args: [BigInt(i)],
            }),
          ]);

          const p = pos as readonly [bigint, bigint, bigint, bigint, bigint, bigint, bigint, boolean];
          if (p[7] && p[0] > BigInt(0)) {
            const holdingStart = Number(p[2]);
            const holdingSeconds =
              holdingStart > 0 ? Math.max(0, Math.floor(Date.now() / 1000) - holdingStart) : 0;
            results.push({
              assetId: i,
              assetName: name as string,
              assetState: Number(state) as AssetState,
              amount: p[0],
              totalInvested: p[1],
              holdingStart: p[2],
              liveYield: liveYield as bigint,
              claimedYield: p[4],
              holdingScore: score as bigint,
              holdingSeconds,
              maturity: maturity as bigint,
              yieldBps: yieldBps as bigint,
            });
          }
        } catch {
          /* skip */
        }
      }
      setYields(results);
    } catch (e) {
      console.error("Failed to load yield data:", e);
    } finally {
      setIsLoading(false);
    }
  }, [publicClient, address]);

  useEffect(() => {
    if (isConnected) loadYield();
    else setIsLoading(false);
  }, [isConnected, loadYield]);

  const totalAccrued = yields.reduce((a, y) => a + y.liveYield, BigInt(0));
  const totalClaimed = yields.reduce((a, y) => a + y.claimedYield, BigInt(0));
  const totalUnclaimed = totalAccrued > totalClaimed ? totalAccrued - totalClaimed : BigInt(0);

  const totalProjected = yields.reduce((a, y) => {
    const maturityTs = Number(y.maturity);
    const holdingStartTs = Number(y.holdingStart);
    if (maturityTs <= 0 || holdingStartTs <= 0) return a;
    const totalDays = Math.max(1, Math.floor((maturityTs - holdingStartTs) / 86400));
    const annualYield = (y.totalInvested * y.yieldBps) / BigInt(10000);
    const projected = (annualYield * BigInt(totalDays)) / BigInt(365);
    return a + projected;
  }, BigInt(0));

  return (
    <RoleGuard allowed={["investor"]}>
    <AppLayout>
      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white font-sans">
              Yield &amp; Staking
            </h1>
            <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 text-xs font-mono font-medium text-emerald-400">
              Live Accrual
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-400">
            Real-time on-chain yield calculation with quadratic holding score multiplier.
          </p>
        </div>

        {isConnected && (
          <button
            onClick={loadYield}
            disabled={isLoading}
            className="flex items-center gap-2 rounded-xl border border-white/[0.08] bg-slate-900/80 px-3.5 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition-all disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin text-cyan-400" : ""}`} />
            <span>Refresh Yield</span>
          </button>
        )}
      </div>

      {!isConnected ? (
        <div className="web3-card rounded-2xl p-12 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
            <Wallet className="h-7 w-7" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Connect Your Wallet</h3>
          <p className="text-sm text-slate-400 max-w-sm mx-auto mb-4">
            Connect your wallet to calculate your real-time yield distribution.
          </p>
        </div>
      ) : (
        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div key="skel" exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
              <YieldSkeleton />
            </motion.div>
          ) : (
            <motion.div key="content" initial={{opacity:0, y:12}} animate={{opacity:1, y:0}} transition={{duration:0.35, ease:[0.16,1,0.3,1]}}>
          {/* Yield Metric Cards */}
          <div className="mb-8 grid gap-4 sm:grid-cols-3">
            <div className="web3-card rounded-2xl p-5 relative overflow-hidden">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-mono uppercase tracking-wider">Total Accrued Yield</span>
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                  <TrendingUp className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-3 text-3xl font-black font-mono text-emerald-400">
                {formatUSD(totalAccrued)}
              </div>
              <div className="mt-2 text-xs text-slate-400 flex items-center gap-1.5">
                <Zap className="h-3.5 w-3.5 text-emerald-400" />
                <span>Calculated dynamically per block</span>
              </div>
            </div>

            <div className="web3-card rounded-2xl p-5 relative overflow-hidden">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-mono uppercase tracking-wider">Unclaimed Balance</span>
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                  <Gift className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-3 text-3xl font-black font-mono text-cyan-400">
                {formatUSD(totalUnclaimed)}
              </div>
              <div className="mt-2 text-xs text-slate-400">
                <span>Available to claim in position actions</span>
              </div>
            </div>

            <div className="web3-card rounded-2xl p-5 relative overflow-hidden">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-mono uppercase tracking-wider">Projected At Maturity</span>
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400">
                  <Award className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-3 text-3xl font-black font-mono text-white">
                {formatUSD(totalProjected)}
              </div>
              <div className="mt-2 text-xs text-slate-400">
                <span>Estimated full term returns</span>
              </div>
            </div>
          </div>

          {/* Yield Assets List */}
          {yields.length === 0 ? (
            <div className="web3-card rounded-2xl p-16 text-center">
              <TrendingUp className="mx-auto mb-3 h-12 w-12 text-slate-600" />
              <h3 className="text-lg font-bold text-white mb-1">No Yield-Bearing Positions</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto mb-4">
                Invest in verified assets on the marketplace to begin accruing interest.
              </p>
              <Link
                href="/app/marketplace"
                className="inline-flex items-center gap-1.5 rounded-xl bg-cyan-400 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-cyan-300 transition-colors"
              >
                Browse Market
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {yields.map((y) => {
                const days = Math.floor(y.holdingSeconds / 86400);
                const hours = Math.floor((y.holdingSeconds % 86400) / 3600);
                const holdingText =
                  days > 0 ? `${days}d ${hours}h` : hours > 0 ? `${hours}h` : "< 1h";
                const unclaimed =
                  y.liveYield > y.claimedYield ? y.liveYield - y.claimedYield : BigInt(0);
                const maturityTs = Number(y.maturity);
                const holdingStartTs = Number(y.holdingStart);
                let projected = BigInt(0);
                if (maturityTs > 0 && holdingStartTs > 0) {
                  const totalDays = Math.max(1, Math.floor((maturityTs - holdingStartTs) / 86400));
                  const annualYield = (y.totalInvested * y.yieldBps) / BigInt(10000);
                  projected = (annualYield * BigInt(totalDays)) / BigInt(365);
                }
                const badge = STATE_BADGE_STYLES[y.assetState] || STATE_BADGE_STYLES[0];

                return (
                  <div
                    key={y.assetId}
                    className="web3-card web3-card-hover rounded-2xl p-6 transition-all duration-200"
                  >
                    <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-white/[0.06] pb-3">
                      <div className="flex items-center gap-3">
                        <span className="rounded-md bg-slate-800 border border-white/[0.08] px-2 py-0.5 text-xs font-mono text-cyan-400 font-bold">
                          #{y.assetId}
                        </span>
                        <Link
                          href={`/app/assets/${y.assetId}`}
                          className="text-base font-bold text-white hover:text-cyan-300 transition-colors"
                        >
                          {y.assetName}
                        </Link>
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-mono font-medium ${badge.bg} ${badge.text} ${badge.border}`}
                        >
                          <span className={`h-1.5 w-1.5 rounded-full ${badge.dot}`} />
                          {ASSET_STATE_LABELS[y.assetState]}
                        </span>
                      </div>

                      <Link
                        href={`/app/assets/${y.assetId}`}
                        className="inline-flex items-center gap-1 text-xs font-mono font-semibold text-cyan-400 hover:text-cyan-300"
                      >
                        <span>Claim or Trade</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </div>

                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-6 font-mono text-xs">
                      <div>
                        <div className="text-[11px] uppercase tracking-wider text-slate-500 font-sans">Tokens</div>
                        <div className="mt-1 text-sm font-bold text-slate-200">{y.amount.toString()}</div>
                      </div>

                      <div>
                        <div className="text-[11px] uppercase tracking-wider text-slate-500 font-sans">Invested</div>
                        <div className="mt-1 text-sm font-bold text-white">{formatUSD(y.totalInvested)}</div>
                      </div>

                      <div>
                        <div className="text-[11px] uppercase tracking-wider text-slate-500 font-sans">Duration Held</div>
                        <div className="mt-1 text-sm font-semibold text-slate-300 flex items-center gap-1">
                          <Clock className="h-3 w-3 text-slate-500" />
                          <span>{holdingText}</span>
                        </div>
                      </div>

                      <div>
                        <div className="text-[11px] uppercase tracking-wider text-slate-500 font-sans">Holding Score</div>
                        <div className="mt-1 text-sm font-bold text-cyan-400">{y.holdingScore.toString()} pts</div>
                      </div>

                      <div>
                        <div className="text-[11px] uppercase tracking-wider text-slate-500 font-sans">Accrued Yield</div>
                        <div className="mt-1 text-sm font-bold text-emerald-400">+{formatUSD(y.liveYield)}</div>
                      </div>

                      <div>
                        <div className="text-[11px] uppercase tracking-wider text-slate-500 font-sans">Projected Full Term</div>
                        <div className="mt-1 text-sm font-bold text-white">{formatUSD(projected)}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
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
