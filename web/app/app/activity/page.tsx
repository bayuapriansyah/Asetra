"use client";

import { useState, useEffect, useCallback } from "react";
import { useAccount, usePublicClient } from "wagmi";
import { AppLayout } from "@/components/layout/AppLayout";
import { ASETRA_ABI, ASETRA_ADDRESS } from "@/config/contracts";
import { formatUSD, shortenAddress } from "@/lib/utils/format";
import { Wallet, RefreshCw, ExternalLink, Activity as ActivityIcon, CheckCircle2, FileText, ShieldCheck, Coins, ClipboardList, DollarSign, Tag, XCircle, ArrowRightLeft, Lock, Unlock, CreditCard, Gem, Clock, Flag, Info, ChevronLeft, ChevronRight } from "lucide-react";
import { ActivitySkeleton } from "@/components/skeleton/PageSkeletons";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

interface ActivityEvent {
  type: string;
  label: string;
  assetId: number;
  detail: string;
  timestamp: number;
  txHash: string;
}

const EVENT_CONFIG: Record<
  string,
  { icon: React.ReactNode; label: string; badgeColor: string; getDetail: (...args: unknown[]) => string }
> = {
  AssetCreated: {
    icon: <FileText className="h-5 w-5 text-slate-300" />,
    label: "Asset Created",
    badgeColor: "text-slate-300 bg-slate-800/80 border-slate-700",
    getDetail: (name: unknown) => String(name),
  },
  AssetVerified: {
    icon: <ShieldCheck className="h-5 w-5 text-cyan-400" />,
    label: "Asset Verified",
    badgeColor: "text-cyan-300 bg-cyan-500/10 border-cyan-500/20",
    getDetail: () => "Verification approved by auditor",
  },
  AssetTokenized: {
    icon: <Coins className="h-5 w-5 text-indigo-400" />,
    label: "Tokens Minted",
    badgeColor: "text-indigo-300 bg-indigo-500/10 border-indigo-500/20",
    getDetail: (supply: unknown) => `${supply} tokens issued on-chain`,
  },
  AssetListed: {
    icon: <ClipboardList className="h-5 w-5 text-amber-400" />,
    label: "Listed On Market",
    badgeColor: "text-amber-300 bg-amber-500/10 border-amber-500/20",
    getDetail: () => `Listed on primary marketplace`,
  },
  InvestmentMade: {
    icon: <DollarSign className="h-5 w-5 text-emerald-400" />,
    label: "Primary Investment",
    badgeColor: "text-emerald-300 bg-emerald-500/10 border-emerald-500/20",
    getDetail: (units: unknown, amount: unknown) => `${units} units · ${formatUSD(amount as bigint)}`,
  },
  SellOrderCreated: {
    icon: <Tag className="h-5 w-5 text-cyan-400" />,
    label: "Sell Order Listed",
    badgeColor: "text-cyan-300 bg-cyan-500/10 border-cyan-500/20",
    getDetail: (amount: unknown) => `${amount} units offered for secondary trade`,
  },
  SellOrderCancelled: {
    icon: <XCircle className="h-5 w-5 text-rose-400" />,
    label: "Order Cancelled",
    badgeColor: "text-rose-300 bg-rose-500/10 border-rose-500/20",
    getDetail: () => "Order cancelled by seller",
  },
  TradeExecuted: {
    icon: <ArrowRightLeft className="h-5 w-5 text-emerald-400" />,
    label: "Secondary Trade",
    badgeColor: "text-emerald-300 bg-emerald-500/10 border-emerald-500/20",
    getDetail: (units: unknown) => `${units} units traded peer-to-peer`,
  },
  CollateralDeposited: {
    icon: <Lock className="h-5 w-5 text-sky-400" />,
    label: "Collateral Locked",
    badgeColor: "text-sky-300 bg-sky-500/10 border-sky-500/20",
    getDetail: (amount: unknown) => `${amount} tokens locked in vault`,
  },
  CollateralWithdrawn: {
    icon: <Unlock className="h-5 w-5 text-amber-400" />,
    label: "Collateral Released",
    badgeColor: "text-amber-300 bg-amber-500/10 border-amber-500/20",
    getDetail: (amount: unknown) => `${amount} tokens released from vault`,
  },
  Borrowed: {
    icon: <CreditCard className="h-5 w-5 text-amber-400" />,
    label: "Liquidity Borrowed",
    badgeColor: "text-amber-300 bg-amber-500/10 border-amber-500/20",
    getDetail: (amount: unknown) => formatUSD(amount as bigint),
  },
  Repaid: {
    icon: <CheckCircle2 className="h-5 w-5 text-emerald-400" />,
    label: "Debt Repaid",
    badgeColor: "text-emerald-300 bg-emerald-500/10 border-emerald-500/20",
    getDetail: (amount: unknown) => formatUSD(amount as bigint),
  },
  YieldClaimed: {
    icon: <Gem className="h-5 w-5 text-emerald-400" />,
    label: "Yield Claimed",
    badgeColor: "text-emerald-300 bg-emerald-500/10 border-emerald-500/20",
    getDetail: (amount: unknown) => `+${formatUSD(amount as bigint)} claimed to wallet`,
  },
  AssetMatured: {
    icon: <Clock className="h-5 w-5 text-sky-400" />,
    label: "Asset Matured",
    badgeColor: "text-sky-300 bg-sky-500/10 border-sky-500/20",
    getDetail: () => "Term completed, ready for final settlement",
  },
  AssetSettled: {
    icon: <Flag className="h-5 w-5 text-teal-400" />,
    label: "Asset Settled",
    badgeColor: "text-teal-300 bg-teal-500/10 border-teal-500/20",
    getDetail: () => "Full lifecycle completed on-chain",
  },
};

const EVENT_NAMES = Object.keys(EVENT_CONFIG);
const ITEMS_PER_PAGE = 15;

export default function ActivityPage() {
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(0);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [page]);

  const loadActivity = useCallback(async () => {
    if (!publicClient || !address) return;
    setIsLoading(true);
    try {
      const latestBlock = await publicClient.getBlockNumber();
      const fromBlock = BigInt(0);

      const eventPromises = EVENT_NAMES.map(async (eventName) => {
        try {
          const logs = await publicClient.getLogs({
            address: ASETRA_ADDRESS,
            event: ASETRA_ABI.find((item) => item.type === "event" && item.name === eventName) as any,
            fromBlock,
            toBlock: "latest",
          });
          return logs.map((log: any) => {
            const config = EVENT_CONFIG[eventName];
            const args = log.args as Record<string, unknown>;
            const assetId = Number(args.id ?? args.assetId ?? args.orderId ?? 0);
            const detailArgs = Object.values(args).filter((v) => typeof v !== "object" || v === null);
            return {
              type: eventName,
              label: config.label,
              assetId,
              detail: config.getDetail(...detailArgs.slice(1)),
              timestamp: 0,
              txHash: log.transactionHash,
            };
          });
        } catch {
          return [];
        }
      });

      const results = await Promise.all(eventPromises);
      const allEvents = results.flat();

      const blockNumbers = [...new Set(allEvents.map((e) => e.txHash))];
      const blockTimestamps: Record<string, number> = {};
      await Promise.all(
        blockNumbers.map(async (txHash) => {
          try {
            const receipt = await publicClient.getTransactionReceipt({ hash: txHash as `0x${string}` });
            if (receipt) {
              const block = await publicClient.getBlock({ blockNumber: receipt.blockNumber });
              blockTimestamps[txHash] = Number(block.timestamp);
            }
          } catch {
            /* skip */
          }
        })
      );

      const eventsWithTime = allEvents.map((evt) => ({
        ...evt,
        timestamp: blockTimestamps[evt.txHash] || Math.floor(Date.now() / 1000),
      }));

      eventsWithTime.sort((a, b) => b.timestamp - a.timestamp);
      setEvents(eventsWithTime);
      setPage(0);
    } catch (e) {
      console.error("Failed to load activity:", e);
    } finally {
      setIsLoading(false);
    }
  }, [publicClient, address]);

  useEffect(() => {
    if (isConnected) loadActivity();
    else setIsLoading(false);
  }, [isConnected, loadActivity]);

  const explorerBase = process.env.NEXT_PUBLIC_BOT_EXPLORER_URL || "https://scan.bohr.life";

  const totalPages = Math.ceil(events.length / ITEMS_PER_PAGE);
  const paginatedEvents = events.slice(page * ITEMS_PER_PAGE, (page + 1) * ITEMS_PER_PAGE);

  return (
    <AppLayout>
      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white font-sans">
              On-Chain Activity
            </h1>
            <span className="rounded-full bg-cyan-500/10 border border-cyan-500/20 px-2.5 py-0.5 text-xs font-mono font-medium text-cyan-400">
              Contract Logs
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-400">
            Real-time event stream from Asetra protocol smart contracts on Bohr Chain.
          </p>
        </div>

        {isConnected && (
          <button
            onClick={loadActivity}
            disabled={isLoading}
            className="flex items-center gap-2 rounded-xl border border-white/[0.08] bg-slate-900/80 px-3.5 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition-all disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin text-cyan-400" : ""}`} />
            <span>Refresh Events</span>
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
            Connect your wallet to monitor recent transactions and event emissions.
          </p>
        </div>
      ) : (
        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div key="skel" exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
              <ActivitySkeleton />
            </motion.div>
          ) : events.length === 0 ? (
            <motion.div key="content" initial={{opacity:0, y:12}} animate={{opacity:1, y:0}} transition={{duration:0.35, ease:[0.16,1,0.3,1]}} className="web3-card rounded-2xl p-16 text-center">
          <ActivityIcon className="mx-auto mb-3 h-12 w-12 text-slate-600" />
          <h3 className="text-lg font-bold text-white mb-1">No Recent Events</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mb-4">
            No events detected in the recent block range. Create an asset or perform a transaction to generate activity.
          </p>
          <a
            href={`${explorerBase}/address/${ASETRA_ADDRESS}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-xl border border-white/[0.08] bg-slate-900 px-4 py-2 text-xs font-mono text-cyan-400 hover:text-cyan-300 transition-colors"
          >
            <span>Inspect Contract on Bohr Scan</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </motion.div>
      ) : (
        <motion.div key="content" initial={{opacity:0, y:12}} animate={{opacity:1, y:0}} transition={{duration:0.35, ease:[0.16,1,0.3,1]}} className="web3-card rounded-2xl overflow-hidden">
          <div className="divide-y divide-white/[0.04]">
            {paginatedEvents.map((evt, i) => {
              const date = new Date(evt.timestamp * 1000);
              const timeStr =
                evt.timestamp > 0
                  ? date.toLocaleDateString("en-US", { month: "short", day: "numeric" }) +
                    " " +
                    date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
                  : "";
              const config = EVENT_CONFIG[evt.type] || {
                icon: <Info className="h-5 w-5 text-slate-400" />,
                label: evt.label,
                badgeColor: "text-slate-300 bg-slate-800 border-slate-700",
              };

              return (
                <div
                  key={`${evt.txHash}-${evt.type}-${i}`}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 sm:px-6 hover:bg-slate-800/20 transition-colors"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-900 border border-white/[0.08]">
                      {config.icon}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-white">{config.label}</span>
                        {evt.assetId >= 0 && (
                          <Link
                            href={`/app/assets/${evt.assetId}`}
                            className="rounded-md bg-slate-800 border border-white/[0.08] px-1.5 py-0.5 text-[10px] font-mono text-cyan-400 hover:underline"
                          >
                            Asset #{evt.assetId}
                          </Link>
                        )}
                      </div>
                      <div className="text-xs font-mono text-slate-400 mt-0.5">{evt.detail}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-xs font-mono text-slate-400 justify-between sm:justify-end">
                    <span>{timeStr}</span>
                    <a
                      href={`${explorerBase}/tx/${evt.txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-slate-900/80 px-2.5 py-1 text-cyan-400 hover:text-cyan-300 hover:border-cyan-400/40 transition-all"
                    >
                      <span>{shortenAddress(evt.txHash as `0x${string}`)}</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </div>
              );
            })}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-white/[0.06] px-6 py-4">
              <span className="text-xs font-mono text-slate-500">
                Page {page + 1} of {totalPages} ({events.length} events)
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="flex items-center gap-1 rounded-lg border border-white/[0.08] bg-slate-900 px-3 py-1.5 text-xs font-mono text-slate-300 hover:bg-slate-800 hover:text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                  Prev
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                  className="flex items-center gap-1 rounded-lg border border-white/[0.08] bg-slate-900 px-3 py-1.5 text-xs font-mono text-slate-300 hover:bg-slate-800 hover:text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  Next
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )}
        </motion.div>
      )}
        </AnimatePresence>
      )}
    </AppLayout>
  );
}
