"use client";

import { useState, useEffect, useCallback } from "react";
import { useAccount, usePublicClient } from "wagmi";
import { AppLayout } from "@/components/layout/AppLayout";
import { ASSETFLOW_ABI, ASSETFLOW_ADDRESS } from "@/config/contracts";
import { formatUSD, timestampToDate } from "@/lib/utils/format";
import { ASSET_STATE_LABELS, type AssetState } from "@/types/asset";
import {
  Loader2,
  Wallet,
  TrendingUp,
  DollarSign,
  Clock,
  ExternalLink,
  Package,
  Shield,
  Layers,
  ArrowUpRight,
  Sparkles,
} from "lucide-react";
import Link from "next/link";

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
  const [positions, setPositions] = useState<PositionWithAsset[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadPositions = useCallback(async () => {
    if (!publicClient || !address) return;
    try {
      const countResult = await publicClient.readContract({
        address: ASSETFLOW_ADDRESS,
        abi: ASSETFLOW_ABI,
        functionName: "getAssetCount",
      });
      const total = Number(countResult);
      const results: PositionWithAsset[] = [];

      for (let i = 0; i < total; i++) {
        try {
          const [pos, name, assetType, state, borrowed, liveYield, faceValue, tokenSupply] = await Promise.all([
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
              functionName: "assetType",
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
              functionName: "getBorrowedAmount",
              args: [BigInt(i), address],
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

          const posData = pos as readonly [bigint, bigint, bigint, bigint, bigint, bigint, boolean];
          if (posData[6] && posData[0] > BigInt(0)) {
            results.push({
              assetId: BigInt(i),
              amount: posData[0],
              totalInvested: posData[1],
              holdingStart: posData[2],
              accruedYield: posData[3],
              claimedYield: posData[4],
              collateralAmount: posData[5],
              active: posData[6],
              assetName: name as string,
              assetType: assetType as string,
              assetState: Number(state) as AssetState,
              borrowedAmount: borrowed as bigint,
              liveYield: liveYield as bigint,
              faceValue: faceValue as bigint,
              tokenSupply: tokenSupply as bigint,
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

  const totalInvested = positions.reduce((acc, p) => acc + p.totalInvested, BigInt(0));
  const totalYield = positions.reduce((acc, p) => acc + p.liveYield, BigInt(0));
  const totalCollateral = positions.reduce((acc, p) => acc + p.collateralAmount, BigInt(0));
  const totalBorrowed = positions.reduce((acc, p) => acc + p.borrowedAmount, BigInt(0));

  return (
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
      ) : isLoading ? (
        <div className="web3-card rounded-2xl flex flex-col items-center justify-center py-24">
          <Loader2 className="h-10 w-10 animate-spin text-cyan-400 mb-3" />
          <p className="text-xs font-mono text-slate-400">Reading positions from contract...</p>
        </div>
      ) : (
        <>
          {/* Stat Cards Strip */}
          <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
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
                <span className="text-[11px] font-mono uppercase tracking-wider">Total Positions</span>
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
                <Sparkles className="h-3.5 w-3.5" />
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
                      <th className="px-4 py-3.5 text-right">Collateral</th>
                      <th className="px-4 py-3.5 text-right">Borrowed</th>
                      <th className="px-4 py-3.5">Holding Since</th>
                      <th className="px-4 py-3.5">Duration</th>
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

                          <td className="px-4 py-4 text-right text-sky-400">
                            {p.collateralAmount > BigInt(0) ? formatUSD(p.collateralAmount) : "—"}
                          </td>

                          <td className="px-4 py-4 text-right text-amber-400">
                            {p.borrowedAmount > BigInt(0) ? formatUSD(p.borrowedAmount) : "—"}
                          </td>

                          <td className="px-4 py-4 text-slate-400">
                            {p.holdingStart > BigInt(0) ? timestampToDate(p.holdingStart) : "—"}
                          </td>

                          <td className="px-4 py-4 text-slate-300">
                            {p.holdingStart > BigInt(0) ? (() => {
                              const held = Math.floor(Date.now() / 1000) - Number(p.holdingStart);
                              const days = Math.floor(held / 86400);
                              const hours = Math.floor((held % 86400) / 3600);
                              return days > 0 ? `${days}d ${hours}h` : `${hours}h`;
                            })() : "—"}
                          </td>

                          <td className="px-5 py-4 text-center">
                            <Link
                              href={`/app/assets/${p.assetId}`}
                              className="inline-flex items-center gap-1 rounded-lg border border-white/[0.08] bg-slate-800/60 px-2.5 py-1 text-[11px] font-medium text-slate-300 hover:border-cyan-400/40 hover:text-cyan-300 transition-all"
                            >
                              <span>Manage</span>
                              <ArrowUpRight className="h-3 w-3" />
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </AppLayout>
  );
}
