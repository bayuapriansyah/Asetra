"use client";

import { use, useState, useEffect, useCallback, useMemo } from "react";
import { useAccount, usePublicClient, useReadContract } from "wagmi";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAsset } from "@/hooks/useAssets";
import {
  useVerifyAsset, useTokenizeAsset, useListAsset,
  useMatureAsset, useSettleAsset,
} from "@/hooks/useLifecycle";
import { useBuyTokens } from "@/hooks/useBuyTokens";
import { useClaimYield } from "@/hooks/useClaimYield";
import { ASETRA_ABI, TUSDT_ABI } from "@/config/contracts";
import { useAsetraAddress, useTusdtAddress } from "@/hooks/useContractAddresses";
import { ASSET_STATE_LABELS, AssetState } from "@/types/asset";
import { formatUSD, formatBps, daysUntil, shortenAddress, timestampToDate, calcTokenCost } from "@/lib/utils/format";
import { parseContractError } from "@/lib/utils/errors";
import { TxSuccessBanner } from "@/components/ui/TxSuccessBanner";
import { AssetDetailSkeleton } from "@/components/skeleton/PageSkeletons";
import { useRole, ROLE_LABELS, ROLE_ICONS } from "@/lib/context/RoleContext";
import { formatUnits } from "viem";
import {
  Loader2, CheckCircle2, AlertCircle, ExternalLink,
  Shield, Coins, Tag, TrendingUp, Clock, Wallet,
  BadgeCheck, FileText, DollarSign, Activity, Gift,
  ArrowLeftRight, Landmark, ChevronRight, ShieldCheck,
  Building2, ArrowUpRight
} from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

const LIFECYCLE_STEPS = [
  { state: AssetState.CREATED, label: "Created", icon: FileText },
  { state: AssetState.VERIFIED, label: "Verified", icon: Shield },
  { state: AssetState.TOKENIZED, label: "Tokenized", icon: Coins },
  { state: AssetState.LISTED, label: "Listed", icon: Tag },
  { state: AssetState.FUNDED, label: "Funded", icon: DollarSign },
  { state: AssetState.ACTIVE, label: "Active", icon: TrendingUp },
  { state: AssetState.MATURED, label: "Matured", icon: Clock },
  { state: AssetState.SETTLED, label: "Settled", icon: BadgeCheck },
];

function LifecycleTimeline({ current }: { current: AssetState }) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
      {LIFECYCLE_STEPS.map((step, i) => {
        const active = step.state <= current;
        const isCurrent = step.state === current;
        const Icon = step.icon;
        return (
          <div key={step.state} className="flex items-center gap-2 shrink-0">
            <div
              className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition-all duration-200 ${
                isCurrent
                  ? "bg-cyan-500/20 border border-cyan-400 text-cyan-300"
                  : active
                  ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-400"
                  : "bg-slate-900/60 border border-slate-800 text-slate-500"
              }`}
            >
              <Icon className={`h-4 w-4 ${isCurrent ? "text-cyan-400" : active ? "text-emerald-400" : "text-slate-600"}`} />
              <span className="uppercase tracking-wider">{step.label}</span>
              {isCurrent && <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />}
            </div>
            {i < LIFECYCLE_STEPS.length - 1 && (
              <ChevronRight className={`h-4 w-4 shrink-0 ${active ? "text-cyan-400/60" : "text-slate-700"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function SettlementSummary({ assetId, publicClient }: { assetId: number; publicClient: any }) {
  const [settlement, setSettlement] = useState<{ principal: bigint; yield: bigint } | null>(null);
  const ASETRA_ADDRESS = useAsetraAddress();

  useEffect(() => {
    if (!publicClient) return;
    (async () => {
      try {
        const abi = ASETRA_ABI.find((item: any) => item.type === "event" && item.name === "AssetSettled") as any;
        const logs = await publicClient.getLogs({
          address: ASETRA_ADDRESS, event: abi, fromBlock: BigInt(0), toBlock: "latest",
          args: { id: BigInt(assetId) },
        });
        if (logs.length > 0) {
          const latest = logs[logs.length - 1] as any;
          setSettlement({ principal: latest.args.principal as bigint, yield: latest.args.yield_ as bigint });
        }
      } catch { /* ignore */ }
    })();
  }, [assetId, publicClient]);

  return (
    <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-5 space-y-3">
      <div className="flex items-center gap-2 text-emerald-400 font-bold">
        <CheckCircle2 className="h-5 w-5" /> Settlement Complete
      </div>
      {settlement ? (
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-lg bg-slate-950/60 border border-white/[0.06] p-3 text-center">
            <div className="text-[11px] font-mono text-slate-400 uppercase">Principal</div>
            <div className="mt-1 font-mono font-bold text-white">{formatUSD(settlement.principal)}</div>
          </div>
          <div className="rounded-lg bg-slate-950/60 border border-white/[0.06] p-3 text-center">
            <div className="text-[11px] font-mono text-slate-400 uppercase">Yield</div>
            <div className="mt-1 font-mono font-bold text-emerald-400">{formatUSD(settlement.yield)}</div>
          </div>
          <div className="rounded-lg bg-slate-950/60 border border-white/[0.06] p-3 text-center">
            <div className="text-[11px] font-mono text-slate-400 uppercase">Total</div>
            <div className="mt-1 font-mono font-bold text-cyan-300">{formatUSD(settlement.principal + settlement.yield)}</div>
          </div>
        </div>
      ) : (
        <p className="text-xs text-slate-400">Loading settlement data...</p>
      )}
    </div>
  );
}

function ErrorBanner({ error, onDismiss }: { error: string | null; onDismiss: () => void }) {
  if (!error) return null;
  return (
    <div className="mb-6 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-300">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-rose-400" />
          <span className="font-medium">{error}</span>
        </div>
        <button onClick={onDismiss} className="ml-2 shrink-0 text-rose-400 hover:text-rose-200 text-lg font-bold">&times;</button>
      </div>
    </div>
  );
}

// Normalized display price calculator
function getNormalizedPrice(rawPrice: bigint, faceValue: bigint, tokenSupply: bigint): number {
  if (rawPrice > BigInt(0)) {
    const floatVal = parseFloat(formatUnits(rawPrice, 6));
    if (!isNaN(floatVal) && floatVal > 0) return floatVal;
  }
  if (tokenSupply > BigInt(0) && faceValue > BigInt(0)) {
    const floatFace = parseFloat(formatUnits(faceValue, 6));
    const floatVal = floatFace / Number(tokenSupply);
    if (!isNaN(floatVal) && floatVal > 0) return floatVal;
  }
  return 1.00;
}

// Interactive Trading / Volume Activity Chart with Real On-Chain Data
function TradingActivityChart({
  assetId,
  price,
  tokenSupply,
  availableUnits,
  soldUnits,
  createdAt,
  publicClient,
  className = "",
}: {
  assetId: number;
  price: number;
  tokenSupply: number;
  availableUnits: number;
  soldUnits: number;
  createdAt: bigint;
  publicClient: any;
  className?: string;
}) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [directBuys, setDirectBuys] = useState(0);
  const [secondaryTrades, setSecondaryTrades] = useState(0);
  const [chartPoints, setChartPoints] = useState<{ idx: number; time: string; cumulative: number; volumeBohr: string; percentFunded: string }[]>([]);
  const ASETRA_ADDRESS = useAsetraAddress();

  const supply = tokenSupply > 0 ? tokenSupply : 10000;
  const baseTs = createdAt > BigInt(0) ? Number(createdAt) : (Math.floor(Date.now() / 1000) - 86400 * 2);

  // Fetch real events and build cumulative chart points
  useEffect(() => {
    if (!publicClient) return;

    let cancelled = false;

    (async () => {
      try {
        const latestBlock = await publicClient.getBlockNumber();
        const fromBlock = latestBlock > BigInt(50000) ? latestBlock - BigInt(50000) : BigInt(0);

        const investmentLogs = await publicClient.getLogs({
          address: ASETRA_ADDRESS,
          event: ASETRA_ABI.find((e: any) => e.type === "event" && e.name === "InvestmentMade"),
          fromBlock,
          toBlock: "latest",
          args: { id: BigInt(assetId) },
        });

        const tradeLogs = await publicClient.getLogs({
          address: ASETRA_ADDRESS,
          event: ASETRA_ABI.find((e: any) => e.type === "event" && e.name === "TradeExecuted"),
          fromBlock,
          toBlock: "latest",
          args: { assetId: BigInt(assetId) },
        });

        if (cancelled) return;

        // Build event list with timestamps and units
        interface TradingEvent { timestamp: number; units: number; type: "buy" | "trade"; }
        const allEvents: TradingEvent[] = [];

        for (const log of investmentLogs) {
          const args = (log as any).args;
          const units = Number(args.units as bigint);
          const receipt = await publicClient.getTransactionReceipt({ hash: log.transactionHash });
          const block = receipt ? await publicClient.getBlock({ blockNumber: receipt.blockNumber }) : null;
          allEvents.push({ timestamp: block ? Number(block.timestamp) : baseTs, units, type: "buy" });
        }

        for (const log of tradeLogs) {
          const args = (log as any).args;
          const units = Number(args.units as bigint);
          const receipt = await publicClient.getTransactionReceipt({ hash: log.transactionHash });
          const block = receipt ? await publicClient.getBlock({ blockNumber: receipt.blockNumber }) : null;
          allEvents.push({ timestamp: block ? Number(block.timestamp) : baseTs, units, type: "trade" });
        }

        if (cancelled) return;

        // Sort ascending by timestamp
        allEvents.sort((a, b) => a.timestamp - b.timestamp);

        // Compute stats
        let totalDirect = 0;
        let totalSecondary = 0;
        for (const e of allEvents) {
          if (e.type === "buy") totalDirect += e.units;
          else totalSecondary += e.units;
        }
        setDirectBuys(totalDirect);
        setSecondaryTrades(totalSecondary);

        // Build cumulative chart points from events
        const now = Math.floor(Date.now() / 1000);
        const points: { idx: number; time: string; cumulative: number; volumeBohr: string; percentFunded: string }[] = [];

        // Start point at createdAt
        const startDate = new Date(baseTs * 1000);
        points.push({
          idx: 0,
          time: startDate.toLocaleDateString("en-US", { month: "short", day: "numeric" }) +
            `, ${startDate.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false })}`,
          cumulative: 0,
          volumeBohr: "0.00",
          percentFunded: "0.0",
        });

        // Add each event as a point
        let cumulativeUnits = 0;
        for (let i = 0; i < allEvents.length; i++) {
          const evt = allEvents[i];
          cumulativeUnits += evt.units;
          const dateObj = new Date(evt.timestamp * 1000);
          const volumeBohr = (evt.units * price).toFixed(2);
          const percentFunded = ((cumulativeUnits / supply) * 100).toFixed(1);

          points.push({
            idx: points.length,
            time: dateObj.toLocaleDateString("en-US", { month: "short", day: "numeric" }) +
              `, ${dateObj.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false })}`,
            cumulative: cumulativeUnits,
            volumeBohr,
            percentFunded,
          });
        }

        // End point at now (current state)
        if (allEvents.length > 0 || points.length === 1) {
          const nowDate = new Date(now * 1000);
          const finalVolume = soldUnits > cumulativeUnits ? soldUnits - cumulativeUnits : 0;
          points.push({
            idx: points.length,
            time: nowDate.toLocaleDateString("en-US", { month: "short", day: "numeric" }) +
              `, ${nowDate.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false })}`,
            cumulative: soldUnits,
            volumeBohr: (finalVolume * price).toFixed(2),
            percentFunded: ((soldUnits / supply) * 100).toFixed(1),
          });
        }

        if (!cancelled) setChartPoints(points);
      } catch {
        // Events fetch failed — show flat line at 0
        if (!cancelled) {
          const now = Math.floor(Date.now() / 1000);
          const startDate = new Date(baseTs * 1000);
          const nowDate = new Date(now * 1000);
          setChartPoints([
            {
              idx: 0,
              time: startDate.toLocaleDateString("en-US", { month: "short", day: "numeric" }) +
                `, ${startDate.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false })}`,
              cumulative: 0, volumeBohr: "0.00", percentFunded: "0.0",
            },
            {
              idx: 1,
              time: nowDate.toLocaleDateString("en-US", { month: "short", day: "numeric" }) +
                `, ${nowDate.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false })}`,
              cumulative: 0, volumeBohr: "0.00", percentFunded: "0.0",
            },
          ]);
        }
      }
    })();

    return () => { cancelled = true; };
  }, [publicClient, assetId, baseTs, supply, price, soldUnits]);

  // Dimensions of SVG Chart
  const svgWidth = 740;
  const svgHeight = 320;
  const paddingLeft = 45;
  const paddingRight = 95;
  const paddingTop = 20;
  const paddingBottom = 40;

  const chartW = svgWidth - paddingLeft - paddingRight;
  const chartH = svgHeight - paddingTop - paddingBottom;

  const maxVal = supply;
  const numPoints = chartPoints.length;

  const coords = chartPoints.map((p, i) => {
    const x = numPoints > 1 ? paddingLeft + (i / (numPoints - 1)) * chartW : paddingLeft + chartW / 2;
    const y = paddingTop + chartH - (p.cumulative / (maxVal || 1)) * chartH;
    return { ...p, x, y };
  });

  const linePath = coords.reduce((acc, p, i) => `${acc} ${i === 0 ? "M" : "L"} ${p.x} ${p.y}`, "");
  const areaPath = `${linePath} L ${paddingLeft + chartW} ${paddingTop + chartH} L ${paddingLeft} ${paddingTop + chartH} Z`;

  const activePoint = hoveredIdx !== null ? coords[hoveredIdx] : null;

  const formattedPriceStr = useMemo(() => {
    if (price === 0) return "0.00";
    if (price < 0.01) return parseFloat(price.toFixed(4)).toString();
    return price.toFixed(2);
  }, [price]);

  // Adaptive Y-axis labels: auto-scale K/M suffix
  const formatYLabel = (val: number) => {
    if (val === 0) return "0";
    if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(1)}M`;
    if (val >= 1_000) return `${(val / 1_000).toFixed(1)}K`;
    return val.toFixed(0);
  };

  const yTicks = [
    { val: 0, label: "0" },
    { val: maxVal * 0.25, label: formatYLabel(maxVal * 0.25) },
    { val: maxVal * 0.5, label: formatYLabel(maxVal * 0.5) },
    { val: maxVal * 0.75, label: formatYLabel(maxVal * 0.75) },
    { val: maxVal, label: `${formatYLabel(maxVal)} Tokens` },
  ];

  return (
    <div className={`web3-card rounded-3xl p-6 sm:p-7 flex flex-col justify-between relative ${className}`}>
      {/* Header Metric Row */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 pb-2">
        <div>
          <div className="text-3xl sm:text-4xl font-black tracking-tight text-white font-mono">
            ${formattedPriceStr}
          </div>
          <div className="mt-1 text-xs font-mono font-semibold text-emerald-400">
            Token Price (BOHR)
          </div>
        </div>

        {/* Activity Stats Bar — Real Data */}
        <div className="flex flex-wrap items-center gap-6 sm:gap-8 font-mono text-xs">
          <div>
            <span className="text-slate-400 uppercase tracking-wider text-[11px] block">DIRECT BUYS</span>
            <span className="text-sm sm:text-base font-bold text-white mt-0.5 block">{directBuys.toLocaleString()}</span>
          </div>
          <div>
            <span className="text-slate-400 uppercase tracking-wider text-[11px] block">SECONDARY</span>
            <span className="text-sm sm:text-base font-bold text-white mt-0.5 block">{secondaryTrades.toLocaleString()}</span>
          </div>
          <div>
            <span className="text-slate-400 uppercase tracking-wider text-[11px] block">AVAILABLE</span>
            <span className="text-sm sm:text-base font-bold text-white mt-0.5 block">{availableUnits.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* SVG Interactive Chart */}
      <div className="relative mt-auto pt-2 w-full flex-1 flex flex-col justify-end">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-auto overflow-visible select-none"
          onMouseLeave={() => setHoveredIdx(null)}
        >
          {/* Grid lines & Y-axis */}
          {yTicks.map((t, idx) => {
            const y = paddingTop + chartH - (t.val / (maxVal || 1)) * chartH;
            return (
              <g key={idx}>
                <line x1={paddingLeft} y1={y} x2={paddingLeft + chartW} y2={y} stroke="rgba(255, 255, 255, 0.06)" strokeDasharray="3 3" />
                <text x={paddingLeft + chartW + 12} y={y + 3.5} fill="#94a3b8" fontSize="11" fontFamily="monospace">{t.label}</text>
              </g>
            );
          })}

          {/* Area fill */}
          <path d={areaPath} fill="rgba(16, 185, 129, 0.08)" />

          {/* Line stroke */}
          <path d={linePath} fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

          {/* Baseline */}
          <line x1={paddingLeft} y1={paddingTop + chartH} x2={paddingLeft + chartW} y2={paddingTop + chartH} stroke="rgba(255, 255, 255, 0.12)" />

          {/* X-Axis Timestamps — evenly spaced */}
          {coords.filter((_, i) => {
            const step = Math.max(1, Math.floor(numPoints / 6));
            return i % step === 0 || i === numPoints - 1;
          }).map((pt) => (
            <text key={pt.idx} x={pt.x} y={paddingTop + chartH + 20} fill="#64748b" fontSize="10" fontFamily="monospace" textAnchor="middle">
              {pt.time}
            </text>
          ))}

          {/* Hover guideline */}
          {activePoint && (
            <g>
              <line x1={activePoint.x} y1={paddingTop} x2={activePoint.x} y2={paddingTop + chartH} stroke="#22d3ee" strokeWidth="1.5" strokeDasharray="3 3" />
              <circle cx={activePoint.x} cy={activePoint.y} r="6" fill="#22d3ee" stroke="#080a0f" strokeWidth="2.5" />
            </g>
          )}

          {/* Hover detection rects */}
          {coords.map((pt, i) => {
            const rectW = chartW / numPoints;
            return (
              <rect key={i} x={pt.x - rectW / 2} y={paddingTop} width={rectW} height={chartH} fill="transparent" className="cursor-pointer" onMouseEnter={() => setHoveredIdx(i)} />
            );
          })}
        </svg>

        {/* Tooltip */}
        {activePoint && (
          <div
            className="pointer-events-none absolute z-20 rounded-xl border border-cyan-500/40 bg-slate-950/95 p-3 shadow-xl backdrop-blur-md text-xs font-mono transition-all duration-75"
            style={{
              left: `${Math.min(Math.max(10, (activePoint.x / svgWidth) * 100), 75)}%`,
              top: `${Math.max(10, (activePoint.y / svgHeight) * 100 - 35)}%`,
            }}
          >
            <div className="text-slate-400 text-[10px] mb-1 pb-1 border-b border-white/[0.08]">{activePoint.time}</div>
            <div className="space-y-1">
              <div className="flex justify-between gap-3">
                <span className="text-slate-400">Cumulative:</span>
                <span className="font-bold text-white">{activePoint.cumulative.toLocaleString()} tokens</span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-slate-400">Volume:</span>
                <span className="font-bold text-cyan-300">{activePoint.volumeBohr} tUSDT</span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-slate-400">Funded:</span>
                <span className="font-bold text-emerald-400">{activePoint.percentFunded}%</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AssetDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const assetId = parseInt(id);
  const { address } = useAccount();
  const ASETRA_ADDRESS = useAsetraAddress();
  const TUSDT_ADDRESS = useTusdtAddress();
  const { asset, isLoading, refetch } = useAsset(assetId);
  const { role } = useRole();
  const RoleIcon = role ? ROLE_ICONS[role] : null;

  const { data: tusdtBalance } = useReadContract({
    address: TUSDT_ADDRESS,
    abi: TUSDT_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
  });

  const { verify, isPending: vPending, isConfirming: vConfirming, isSuccess: vSuccess, isError: vIsError, error: vError, reset: vReset, txHash: vTxHash } = useVerifyAsset();
  const { tokenize, isPending: tPending, isConfirming: tConfirming, isSuccess: tSuccess, isError: tIsError, error: tError, reset: tReset, txHash: tTxHash } = useTokenizeAsset();
  const { list, isPending: lPending, isConfirming: lConfirming, isSuccess: lSuccess, isError: lIsError, error: lError, reset: lReset, txHash: lTxHash } = useListAsset();
  const { mature, isPending: mPending, isConfirming: mConfirming, isSuccess: mSuccess, isError: mIsError, error: mError, reset: mReset, txHash: mTxHash } = useMatureAsset();
  const { settle, isPending: sPending, isConfirming: sConfirming, isSuccess: sSuccess, isError: sIsError, error: sError, reset: sReset, txHash: sTxHash } = useSettleAsset();

  const { buyTokens, isPending: bPending, isConfirming: bConfirming, isSuccess: bSuccess, isError: bIsError, error: bError, txHash: bTxHash } = useBuyTokens();
  const { claimYield, isPending: cPending, isConfirming: cConfirming, isSuccess: cSuccess, isError: cIsError, error: cError, reset: cReset } = useClaimYield();

  const [buyUnits, setBuyUnits] = useState<number>(1);
  const [activeTab, setActiveTab] = useState<"usdc" | "leverage" | "payments">("usdc");
  const [tokenSupply, setTokenSupply] = useState("10000");

  const [txStatus, setTxStatus] = useState<string | null>(null);
  const [txError, setTxError] = useState<string | null>(null);
  const [successTxHash, setSuccessTxHash] = useState<string | null>(null);

  interface PaymentRecord { amount: bigint; timestamp: bigint; evidenceHash: string; recordedBy: string; }
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [totalPaid, setTotalPaid] = useState<bigint>(BigInt(0));
  const [paymentFundedAmt, setPaymentFundedAmt] = useState<bigint>(BigInt(0));
  const [totalSettledAmt, setTotalSettledAmt] = useState<bigint>(BigInt(0));
  const [claimableProceeds, setClaimableProceeds] = useState<bigint>(BigInt(0));
  const [paidPerUnitVal, setPaidPerUnitVal] = useState<bigint>(BigInt(0));

  const publicClient = usePublicClient();
  const explorerBase = process.env.NEXT_PUBLIC_BOT_EXPLORER_URL || "https://scan.bohr.life";
  const isIssuer = address && asset && address.toLowerCase() === asset.issuer.toLowerCase();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (!publicClient || !address) return;
    (async () => {
      try {
        const admin = await publicClient.readContract({
          address: ASETRA_ADDRESS, abi: ASETRA_ABI, functionName: "admin",
        });
        setIsAdmin(address.toLowerCase() === (admin as string).toLowerCase());
      } catch { /* ignore */ }
    })();
  }, [publicClient, address]);

  const days = asset ? daysUntil(asset.maturity) : 0;
  const availableUnits = asset?.availableUnits ?? BigInt(0);

  // Normalized float price per unit
  const tokenPriceFloat = useMemo(() => {
    if (!asset) return 1.0;
    return getNormalizedPrice(asset.pricePerUnit, asset.faceValue, asset.tokenSupply);
  }, [asset]);

  // Estimated purchase total (integer math, consistent with contract)
  const estimatedCost = useMemo(() => {
    if (!asset) return "0.00";
    const cost = BigInt(buyUnits) * asset.pricePerUnit;
    return (Number(cost) / 1e6).toFixed(2);
  }, [buyUnits, asset]);

  // Claimable yield
  const [claimableYield, setClaimableYield] = useState<bigint>(BigInt(0));
  const [userUnitsOwned, setUserUnitsOwned] = useState<bigint>(BigInt(0));

  useEffect(() => {
    if (!publicClient || !address || !asset || asset.state !== AssetState.ACTIVE) return;
    (async () => {
      try {
        const [yield_, pos] = await Promise.all([
          publicClient.readContract({
            address: ASETRA_ADDRESS, abi: ASETRA_ABI,
            functionName: "calculateYield", args: [BigInt(assetId), address],
          }),
          publicClient.readContract({
            address: ASETRA_ADDRESS, abi: ASETRA_ABI,
            functionName: "getPosition", args: [BigInt(assetId), address],
          }),
        ]);
        const posData = pos as readonly [bigint, bigint, bigint, bigint, bigint, bigint, bigint, boolean];
        setUserUnitsOwned(posData[0]);
        const claimed = posData[4];
        const claimable = (yield_ as bigint) - claimed;
        setClaimableYield(claimable > BigInt(0) ? claimable : BigInt(0));
      } catch { /* ignore */ }
    })();
  }, [publicClient, address, asset, assetId]);

  // Position Journey events
  interface JourneyEvent { label: string; detail: string; timestamp: number; }
  const [journeyEvents, setJourneyEvents] = useState<JourneyEvent[]>([]);

  const loadJourney = useCallback(async () => {
    if (!publicClient || !address) return;
    try {
      const latestBlock = await publicClient.getBlockNumber();
      const fromBlock = latestBlock > BigInt(10000) ? latestBlock - BigInt(10000) : BigInt(0);
      const events: JourneyEvent[] = [];

      const eventDefs = [
        { name: "InvestmentMade", label: "Investment Made" },
        { name: "CollateralDeposited", label: "Collateral Deposited" },
        { name: "CollateralWithdrawn", label: "Collateral Withdrawn" },
        { name: "Borrowed", label: "Borrowed" },
        { name: "Repaid", label: "Loan Repaid" },
        { name: "YieldClaimed", label: "Yield Claimed" },
        { name: "AssetMatured", label: "Asset Matured" },
        { name: "AssetSettled", label: "Asset Settled" },
      ];

      for (const def of eventDefs) {
        try {
          const abi = ASETRA_ABI.find((item: any) => item.type === "event" && item.name === def.name) as any;
          const logs = await publicClient.getLogs({
            address: ASETRA_ADDRESS, event: abi, fromBlock, toBlock: "latest",
            args: { assetId: BigInt(assetId) },
          });
          for (const log of logs) {
            const args = (log as any).args as Record<string, unknown>;
            const values = Object.values(args);
            let detail = "";
            if (def.name === "InvestmentMade") detail = `${values[2]} units · ${formatUSD(values[3] as bigint)}`;
            else if (def.name === "CollateralDeposited" || def.name === "CollateralWithdrawn" || def.name === "Borrowed" || def.name === "Repaid" || def.name === "YieldClaimed") detail = formatUSD(values[2] as bigint);
            else detail = "";

            const receipt = await publicClient.getTransactionReceipt({ hash: log.transactionHash });
            const block = receipt ? await publicClient.getBlock({ blockNumber: receipt.blockNumber }) : null;
            events.push({ label: def.label, detail, timestamp: block ? Number(block.timestamp) : 0 });
          }
        } catch { /* skip */ }
      }
      events.sort((a, b) => b.timestamp - a.timestamp);
      setJourneyEvents(events);
    } catch { /* skip */ }
  }, [publicClient, assetId, address]);

  useEffect(() => { if (asset) loadJourney(); }, [asset, loadJourney]);

  useEffect(() => {
    if (!publicClient || !asset) return;
    (async () => {
      try {
        const [tp, pf, ppu, ts] = await Promise.all([
          publicClient.readContract({ address: ASETRA_ADDRESS, abi: ASETRA_ABI, functionName: "totalPaid", args: [BigInt(assetId)] }),
          publicClient.readContract({ address: ASETRA_ADDRESS, abi: ASETRA_ABI, functionName: "paymentFunded", args: [BigInt(assetId)] }),
          publicClient.readContract({ address: ASETRA_ADDRESS, abi: ASETRA_ABI, functionName: "paidPerUnit", args: [BigInt(assetId)] }),
          publicClient.readContract({ address: ASETRA_ADDRESS, abi: ASETRA_ABI, functionName: "totalSettled", args: [BigInt(assetId)] }),
        ]);
        setTotalPaid(tp as bigint);
        setPaymentFundedAmt(pf as bigint);
        setPaidPerUnitVal(ppu as bigint);
        setTotalSettledAmt(ts as bigint);

        const count = await publicClient.readContract({ address: ASETRA_ADDRESS, abi: ASETRA_ABI, functionName: "getPaymentCount", args: [BigInt(assetId)] });
        const recs: PaymentRecord[] = [];
        for (let j = 0; j < Number(count); j++) {
          const p = await publicClient.readContract({ address: ASETRA_ADDRESS, abi: ASETRA_ABI, functionName: "getPayment", args: [BigInt(assetId), BigInt(j)] });
          const d = p as readonly [bigint, bigint, `0x${string}`, string];
          recs.push({ amount: d[0], timestamp: d[1], evidenceHash: d[2], recordedBy: d[3] });
        }
        setPayments(recs);

        if (address) {
          const cp = await publicClient.readContract({ address: ASETRA_ADDRESS, abi: ASETRA_ABI, functionName: "getClaimableProceeds", args: [BigInt(assetId), address] });
          setClaimableProceeds(cp as bigint);
        }
      } catch { /* ignore */ }
    })();
  }, [publicClient, asset, assetId, address]);

  const handleAction = async (action: () => Promise<unknown>, label: string) => {
    setTxError(null);
    setTxStatus(`${label}...`);
    try {
      await action();
    } catch (e) {
      setTxStatus(null);
      setTxError(parseContractError(e));
    }
  };

  const handleBuyTokensDirect = async () => {
    if (!asset) return;
    setTxError(null);
    try {
      await buyTokens(assetId, buyUnits, asset.pricePerUnit);
    } catch (e) {
      setTxError(parseContractError(e));
    }
  };

  const handleClaimYield = () => handleAction(() => claimYield(assetId), "Claiming yield");
  const handleVerify = () => handleAction(() => verify(assetId), "Sending verification");
  const handleTokenize = () => handleAction(() => tokenize(assetId, BigInt(parseInt(tokenSupply) || 10000)), "Sending tokenize");
  const handleList = () => handleAction(() => list(assetId), "Sending list");
  const handleMature = () => handleAction(() => mature(assetId), "Sending maturity");
  const handleSettle = () => handleAction(() => settle(assetId), "Sending settlement");

  // Refetch after any lifecycle or buy action succeeds
  useEffect(() => {
    if (vSuccess || tSuccess || lSuccess || mSuccess || sSuccess || cSuccess || bSuccess) {
      const hash = vTxHash || tTxHash || lTxHash || mTxHash || sTxHash || bTxHash || null;
      setSuccessTxHash(hash);
      setTxStatus("Transaction confirmed on-chain! Refreshing state...");
      setTxError(null);
      const timer = setTimeout(async () => {
        await refetch();
        setTxStatus(null);
        vReset(); tReset(); lReset(); mReset(); sReset(); cReset();
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [vSuccess, tSuccess, lSuccess, mSuccess, sSuccess, cSuccess, bSuccess, refetch, vReset, tReset, lReset, mReset, sReset, cReset, vTxHash, tTxHash, lTxHash, mTxHash, sTxHash, bTxHash]);

  useEffect(() => {
    if (vIsError && vError) { setTxStatus(null); setTxError(parseContractError(vError)); }
  }, [vIsError, vError]);
  useEffect(() => {
    if (tIsError && tError) { setTxStatus(null); setTxError(parseContractError(tError)); }
  }, [tIsError, tError]);
  useEffect(() => {
    if (lIsError && lError) { setTxStatus(null); setTxError(parseContractError(lError)); }
  }, [lIsError, lError]);
  useEffect(() => {
    if (mIsError && mError) { setTxStatus(null); setTxError(parseContractError(mError)); }
  }, [mIsError, mError]);
  useEffect(() => {
    if (sIsError && sError) { setTxStatus(null); setTxError(parseContractError(sError)); }
  }, [sIsError, sError]);
  useEffect(() => {
    if (cIsError && cError) { setTxStatus(null); setTxError(parseContractError(cError)); }
  }, [cIsError, cError]);
  useEffect(() => {
    if (bIsError && bError) { setTxStatus(null); setTxError(parseContractError(bError)); }
  }, [bIsError, bError]);

  if (isLoading) {
    return (
      <AppLayout>
        <AssetDetailSkeleton />
      </AppLayout>
    );
  }

  if (!asset) {
    return (
      <AppLayout>
        <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-8 text-center text-rose-300">
          <AlertCircle className="mx-auto h-8 w-8 mb-2" />
          <p className="font-bold">Asset not found on-chain.</p>
        </div>
      </AppLayout>
    );
  }

  const soldTokens = Math.max(0, Number(asset.tokenSupply) - Number(availableUnits));

  return (
    <AppLayout>
      <motion.div initial={{opacity:0, y:12}} animate={{opacity:1, y:0}} transition={{duration:0.35, ease:[0.16,1,0.3,1]}}>
      {/* ========================================================
          1. TOP HEADER BAR
      ======================================================== */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Asset Identity Badge */}
          <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.08] bg-slate-900 text-slate-300">
            <Building2 className="h-4 w-4 text-cyan-400" />
          </div>

          {/* Title */}
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white font-sans">
            {asset.name}
          </h1>

          {/* Quick Navigation Pills */}
          <div className="flex items-center gap-2">
            <Link
              href="/app/trading"
              className="inline-flex items-center gap-1 rounded-lg border border-white/[0.1] bg-slate-900 px-3 py-1 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition"
            >
              Trade
            </Link>
            <Link
              href="/app/portfolio"
              className="inline-flex items-center gap-1 rounded-lg border border-white/[0.1] bg-slate-900 px-3 py-1 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition"
            >
              Portfolio
            </Link>
          </div>

          {/* Status Badge */}
          <div className="font-mono text-xs font-semibold text-slate-400">
            Status: <span className={`font-bold uppercase ${
              asset.state === AssetState.ACTIVE ? "text-emerald-400" :
              asset.state === AssetState.LISTED ? "text-cyan-400" :
              asset.state === AssetState.VERIFIED ? "text-blue-400" :
              asset.state === AssetState.TOKENIZED ? "text-indigo-400" :
              asset.state === AssetState.FUNDED ? "text-amber-400" :
              asset.state === AssetState.MATURED ? "text-orange-400" :
              asset.state === AssetState.SETTLED ? "text-slate-500" : "text-slate-200"
            }`}>
              {ASSET_STATE_LABELS[asset.state]}
            </span>
          </div>
        </div>

        {/* Contract Link */}
        <div className="flex items-center gap-3">
          <a
            href={`${explorerBase}/address/${ASETRA_ADDRESS}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-xl border border-white/[0.08] bg-slate-900/80 px-3.5 py-1.5 text-xs font-bold text-slate-300 hover:border-slate-500 hover:text-white transition"
          >
            <span>Contract</span>
            <ExternalLink className="h-3 w-3 text-cyan-400" />
          </a>
        </div>
      </div>

      {txStatus && (
        <div className="mb-6 rounded-2xl border border-cyan-500/30 bg-cyan-500/10 p-4 text-sm font-semibold text-cyan-300 flex items-center gap-3">
          <Loader2 className="h-5 w-5 animate-spin text-cyan-400 shrink-0" />
          <span>{txStatus}</span>
        </div>
      )}

      <ErrorBanner error={txError} onDismiss={() => setTxError(null)} />
      <TxSuccessBanner txHash={successTxHash} onDismiss={() => setSuccessTxHash(null)} />

      {/* ========================================================
          2. TRADING TERMINAL ROW (Chart Left, Operation Widget Right)
      ======================================================== */}
      <div className="grid gap-6 lg:grid-cols-12 mb-8 items-stretch">
        {/* Left Column: Interactive Trading Activity Chart (Direct Grid Child) */}
        <TradingActivityChart
          className="lg:col-span-8 flex flex-col justify-between h-full"
          assetId={assetId}
          price={tokenPriceFloat}
          tokenSupply={Number(asset.tokenSupply)}
          availableUnits={Number(availableUnits)}
          soldUnits={soldTokens}
          createdAt={asset.createdAt}
          publicClient={publicClient}
        />

        {/* Right Column: Dynamic Action & Buy Widget (Direct Grid Child) */}
        <div className="lg:col-span-4 web3-card rounded-3xl p-6 sm:p-7 flex flex-col justify-between h-full">
          <div>
            {/* Header & Tabs */}
            <div className="flex items-center justify-between pb-4 border-b border-white/[0.06]">
                <h2 className="text-base sm:text-lg font-black text-white font-sans">
                  {asset.state === AssetState.LISTED ? "Buy Tokens" : "Position Hub"}
                </h2>

                {/* USDC / Leverage / Payments Tab Toggle */}
                <div className="inline-flex rounded-xl bg-slate-950 p-1 border border-white/[0.08]">
                  <button
                    onClick={() => setActiveTab("usdc")}
                    className={`rounded-lg px-3 py-1 text-xs font-bold transition ${
                      activeTab === "usdc"
                        ? "bg-slate-800 text-white shadow-sm"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    tUSDT
                  </button>
                  <button
                    onClick={() => setActiveTab("leverage")}
                    className={`rounded-lg px-3 py-1 text-xs font-bold transition ${
                      activeTab === "leverage"
                        ? "bg-slate-800 text-white shadow-sm"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    Leverage
                  </button>
                  <button
                    onClick={() => setActiveTab("payments")}
                    className={`rounded-lg px-3 py-1 text-xs font-bold transition ${
                      activeTab === "payments"
                        ? "bg-slate-800 text-white shadow-sm"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    Payments
                  </button>
                </div>
              </div>

              {/* TAB 1: tUSDT BUY & POSITION STATE */}
              {activeTab === "usdc" ? (
                <div className="mt-5 space-y-4">
                  {asset.state === AssetState.LISTED ? (
                    <>
                      {/* Tokens to buy input */}
                      <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1.5">
                          Tokens to buy
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            min="1"
                            max={Number(availableUnits) || 100000}
                            value={buyUnits}
                            onChange={(e) => setBuyUnits(Math.max(1, parseInt(e.target.value) || 1))}
                            className="w-full rounded-2xl border border-white/[0.08] bg-slate-950/80 px-4 py-3.5 text-base font-black text-white font-mono focus:border-cyan-400 focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => setBuyUnits(Number(availableUnits) > 0 ? Number(availableUnits) : 1000)}
                            className="absolute right-3 top-3 rounded-lg bg-slate-800 hover:bg-slate-700 px-2.5 py-1 text-[11px] font-mono font-bold text-cyan-300 transition"
                          >
                            MAX
                          </button>
                        </div>
                        <div className="mt-1.5 text-xs text-slate-400 font-mono">
                          Available: {Number(availableUnits).toLocaleString()} tokens
                        </div>
                      </div>

                      {/* Estimated Total Price Box */}
                      <div className="rounded-2xl border border-white/[0.06] bg-slate-950/90 p-4 space-y-1.5">
                        <span className="text-[11px] font-medium text-slate-400 block">
                          Estimated Total Price
                        </span>
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-500/20 text-blue-400 font-bold text-xs border border-blue-500/40">
                            $
                          </div>
                          <span className="text-xl sm:text-2xl font-black text-white font-mono">
                            ${estimatedCost} tUSDT
                          </span>
                        </div>
                      </div>

                      {/* Metadata Row: Balance & Min Investment */}
                      <div className="space-y-1 text-xs font-mono pt-1 text-slate-400">
                        <div className="flex justify-between items-center">
                          <span>Your tUSDT Balance</span>
                          <span className="font-bold text-white">
                            {tusdtBalance !== undefined ? `${(Number(tusdtBalance) / 1e6).toFixed(2)} tUSDT` : "—"}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span>Min Investment</span>
                          <span className="font-bold text-slate-300">—</span>
                        </div>
                      </div>
                    </>
                  ) : (
                    /* Active / Funded Position Overview */
                    <div className="space-y-4">
                      <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 space-y-2">
                        <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase font-mono">
                          <CheckCircle2 className="h-4 w-4" /> Position Active
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed">
                          This asset has completed primary tokenization and is generating real on-chain yield on Bohr Chain.
                        </p>
                      </div>

                      <div className="rounded-2xl border border-white/[0.06] bg-slate-950/90 p-4 space-y-3 font-mono text-xs">
                        <div className="flex justify-between">
                          <span className="text-slate-400">Your Tokens Owned</span>
                          <span className="font-bold text-white text-sm">{userUnitsOwned.toString()} Units</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Yield Accrual Rate</span>
                          <span className="font-bold text-emerald-400">{formatBps(asset.expectedYieldBps)} APY</span>
                        </div>
                        <div className="flex justify-between border-t border-white/[0.06] pt-2">
                          <span className="text-slate-400">Claimable Yield</span>
                          <span className="font-bold text-cyan-300">{formatUSD(claimableYield)}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : activeTab === "leverage" ? (
                <div className="mt-5 space-y-4">
                  <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 space-y-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-amber-300 uppercase font-mono">
                      <Landmark className="h-4 w-4" /> 60% Max Safe LTV
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      Borrow credit against your RWA positions on Bohr Testnet without liquidating token ownership.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-white/[0.06] bg-slate-950/90 p-4 space-y-1.5">
                    <span className="text-[11px] font-medium text-slate-400 block font-mono">
                      Borrow Capacity Estimate
                    </span>
                    <div className="text-xl font-black text-emerald-400 font-mono">
                      ${(parseFloat(estimatedCost) * 0.6).toFixed(2)} BOHR
                    </div>
                  </div>

                  <Link href="/app/collateral" className="block w-full">
                    <button className="w-full rounded-xl border border-white/[0.08] bg-slate-900 py-3 text-xs font-bold uppercase tracking-wider text-cyan-300 hover:bg-slate-800 transition">
                      Open Collateral Vault →
                    </button>
                  </Link>
                </div>
              ) : (
                /* TAB 3: PAYMENT HISTORY */
                <div className="mt-5 space-y-4">
                  <div className="rounded-2xl border border-blue-500/30 bg-blue-500/10 p-4 space-y-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-blue-300 uppercase font-mono">
                      <FileText className="h-4 w-4" /> Payment-Adjusted Receivable
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      Real-world debtor payments are recorded on-chain and distributed pro-rata to token holders.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-white/[0.06] bg-slate-950/90 p-4 space-y-1.5 font-mono text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Total Paid by Debtor</span>
                      <span className="font-bold text-blue-300">{formatUSD(totalPaid)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Settlement Pool Funded</span>
                      <span className="font-bold text-emerald-400">{formatUSD(paymentFundedAmt)}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">Already Settled</span>
                      <span className="font-bold text-amber-400">{formatUSD(totalSettledAmt)}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">Available to Claim</span>
                      <span className="font-bold text-cyan-300">{formatUSD(paymentFundedAmt - totalSettledAmt)}</span>
                    </div>
                    <div className="flex justify-between border-t border-white/[0.06] pt-2">
                      <span className="text-slate-400">Paid Per Unit (PPU)</span>
                      <span className="font-bold text-white">{paidPerUnitVal > BigInt(0) ? formatUSD(paidPerUnitVal) : "—"}</span>
                    </div>
                    {address && (
                      <div className="flex justify-between border-t border-white/[0.06] pt-2">
                        <span className="text-slate-400">Your Claimable</span>
                        <span className={`font-bold ${claimableProceeds > BigInt(0) ? "text-emerald-300" : "text-slate-500"}`}>
                          {claimableProceeds > BigInt(0) ? formatUSD(claimableProceeds) : "—"}
                        </span>
                      </div>
                    )}
                  </div>

                  {payments.length > 0 ? (
                    <div className="space-y-2">
                      <div className="text-[10px] font-mono uppercase tracking-wider text-slate-500">
                        {payments.length} Payment{payments.length !== 1 ? "s" : ""} Recorded
                      </div>
                      {payments.map((p, idx) => (
                        <div key={idx} className="rounded-xl border border-white/[0.06] bg-slate-950/60 p-3 font-mono text-xs">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-bold text-white">{formatUSD(p.amount)}</span>
                            <span className="text-slate-500">{p.timestamp > BigInt(0) ? timestampToDate(p.timestamp) : "—"}</span>
                          </div>
                          <div className="flex items-center justify-between text-[10px] text-slate-500">
                            <span>Evidence: {p.evidenceHash.slice(0, 10)}...{p.evidenceHash.slice(-6)}</span>
                            <span>By: {p.recordedBy.slice(0, 6)}...{p.recordedBy.slice(-4)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-xs text-slate-500">
                      No payments recorded yet for this asset.
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Bottom Actions based on Role & State */}
            <div className="mt-6 pt-4 border-t border-white/[0.06]">
              {/* Role Badge */}
              {role && (
                <div className="mb-4 flex items-center gap-2 rounded-xl border border-white/[0.06] bg-slate-950/60 px-3 py-2 text-xs font-mono text-slate-400">
                  <span>{RoleIcon && <RoleIcon className="h-4 w-4" />}</span>
                  <span>Acting as <span className="font-bold text-white">{ROLE_LABELS[role]}</span></span>
                </div>
              )}

              {/* Role-based Hint Banners */}
              {role === "investor" && !isAdmin && !isIssuer && asset.state === AssetState.CREATED && (
                <div className="mb-4 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-300 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>Asset pending admin verification — not yet available for investment.</span>
                </div>
              )}
              {role === "investor" && !isAdmin && !isIssuer && asset.state === AssetState.VERIFIED && (
                <div className="mb-4 rounded-xl border border-blue-500/30 bg-blue-500/10 p-3 text-xs text-blue-300 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>Asset verified — awaiting tokenization by issuer.</span>
                </div>
              )}
              {role === "investor" && !isAdmin && !isIssuer && asset.state === AssetState.TOKENIZED && (
                <div className="mb-4 rounded-xl border border-indigo-500/30 bg-indigo-500/10 p-3 text-xs text-indigo-300 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>Asset tokenized — awaiting marketplace listing by issuer.</span>
                </div>
              )}
              {role === "investor" && !isAdmin && !isIssuer && asset.state === AssetState.FUNDED && (
                <div className="mb-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-300 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <span>100% funding target met — awaiting protocol activation.</span>
                </div>
              )}
              {role === "issuer" && isIssuer && asset.state === AssetState.CREATED && (
                <div className="mb-4 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-300 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>Asset created — awaiting admin verification before tokenization.</span>
                </div>
              )}
              {/* If Asset is LISTED and Investor: Direct Buy */}
              {asset.state === AssetState.LISTED && role === "investor" && (
                  <button
                    onClick={handleBuyTokensDirect}
                    disabled={bPending || bConfirming || Number(availableUnits) <= 0}
                    title={Number(availableUnits) <= 0 ? "No tokens available" : ""}
                    className="w-full rounded-2xl bg-white text-slate-950 hover:bg-slate-200 py-3.5 text-sm font-black uppercase tracking-wider transition duration-150 disabled:opacity-50"
                  >
                    {bPending ? (
                      <span className="flex items-center justify-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" /> Confirming...
                      </span>
                    ) : bConfirming ? (
                      <span className="flex items-center justify-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" /> Broadcasting...
                      </span>
                    ) : (
                      "Buy Tokens"
                    )}
                  </button>
              )}

              {/* If Asset is ACTIVE (investor): Accrued Yield & Quick Secondary Trade */}
              {asset.state === AssetState.ACTIVE && role === "investor" && (
                <div className="space-y-2.5">
                  <button
                    onClick={handleClaimYield}
                    disabled={cPending || cConfirming || claimableYield === BigInt(0)}
                    title={claimableYield === BigInt(0) ? "No yield to claim" : ""}
                    className="w-full rounded-2xl bg-emerald-400 text-slate-950 hover:bg-emerald-300 py-3 text-xs font-black uppercase tracking-wider transition duration-150 disabled:opacity-40 disabled:bg-slate-800 disabled:text-slate-500"
                  >
                    <Gift className="mr-1.5 inline h-4 w-4" />
                    {claimableYield > BigInt(0) ? `Claim ${formatUSD(claimableYield)} Yield` : "No Yield to Claim"}
                  </button>
                  <div className="grid grid-cols-2 gap-2">
                    <Link href="/app/trading" className="w-full">
                      <button className="w-full rounded-xl bg-slate-900 border border-white/[0.08] py-2.5 text-xs font-bold text-cyan-300 hover:bg-slate-800 transition">
                        Trade P2P
                      </button>
                    </Link>
                    <Link href="/app/collateral" className="w-full">
                      <button className="w-full rounded-xl bg-slate-900 border border-white/[0.08] py-2.5 text-xs font-bold text-emerald-300 hover:bg-slate-800 transition">
                        Collateralize
                      </button>
                    </Link>
                  </div>
                </div>
              )}

              {/* If Admin role and CREATED */}
              {role === "admin" && isAdmin && asset.state === AssetState.CREATED && (
                <button
                  onClick={handleVerify}
                  disabled={vPending || vConfirming}
                  className="w-full rounded-2xl bg-cyan-400 text-slate-950 hover:bg-cyan-300 py-3.5 text-xs font-black uppercase tracking-wider transition"
                >
                  Verify Asset On-Chain
                </button>
              )}

              {/* If Issuer role and VERIFIED */}
              {role === "issuer" && isIssuer && asset.state === AssetState.VERIFIED && (
                <div className="space-y-3">
                  <div>
                    <span className="text-[11px] font-medium text-slate-400 block mb-2">Token Supply</span>
                    <div className="flex flex-wrap gap-2">
                      {[100, 500, 1000, 10000, 100000].map((opt) => (
                        <button
                          key={opt}
                          onClick={() => setTokenSupply(String(opt))}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition ${
                            tokenSupply === String(opt)
                              ? "bg-cyan-400 text-slate-950 border border-cyan-300"
                              : "bg-slate-900 border border-white/[0.08] text-slate-300 hover:border-slate-500 hover:text-white"
                          }`}
                        >
                          {opt.toLocaleString()}
                        </button>
                      ))}
                    </div>
                    <div className="mt-2 text-[11px] text-slate-500 font-mono">
                      1 token = {formatUSD(BigInt(Math.floor((parseFloat(formatUnits(asset.faceValue, 6)) / parseInt(tokenSupply || "10000")) * 1e6)))}
                    </div>
                  </div>
                  <button
                    onClick={handleTokenize}
                    disabled={tPending || tConfirming}
                    className="w-full rounded-2xl bg-cyan-400 text-slate-950 hover:bg-cyan-300 py-3.5 text-xs font-black uppercase tracking-wider transition"
                  >
                    Tokenize Into {parseInt(tokenSupply || "10000").toLocaleString()} Positions
                  </button>
                </div>
              )}

              {/* If Issuer role and TOKENIZED */}
              {role === "issuer" && isIssuer && asset.state === AssetState.TOKENIZED && (
                <button
                  onClick={handleList}
                  disabled={lPending || lConfirming}
                  className="w-full rounded-2xl bg-cyan-400 text-slate-950 hover:bg-cyan-300 py-3.5 text-xs font-black uppercase tracking-wider transition"
                >
                  Publish to Marketplace
                </button>
              )}

              {/* If Issuer role and ACTIVE */}
              {role === "issuer" && isIssuer && asset.state === AssetState.ACTIVE && (
                <div className="space-y-3">
                  <button
                    onClick={handleMature}
                    disabled={mPending || mConfirming}
                    className="w-full rounded-2xl bg-amber-400 text-slate-950 hover:bg-amber-300 py-3.5 text-xs font-black uppercase tracking-wider transition"
                  >
                    {mPending ? "Maturing..." : mConfirming ? "Confirming..." : "Mature Asset"}
                  </button>
                </div>
              )}

              {/* If Issuer role and MATURED */}
              {role === "issuer" && isIssuer && asset.state === AssetState.MATURED && (
                <button
                  onClick={handleSettle}
                  disabled={sPending || sConfirming}
                  className="w-full rounded-2xl bg-emerald-400 text-slate-950 hover:bg-emerald-300 py-3.5 text-xs font-black uppercase tracking-wider transition"
                >
                  Complete Settlement
                </button>
              )}

              {/* Other States Info Banner */}
              {asset.state === AssetState.SETTLED && (
                <SettlementSummary assetId={assetId} publicClient={publicClient} />
              )}
            </div>
          </div>
        </div>

      {/* ========================================================
          3. INVOICE DETAILS SPECIFICATIONS
      ======================================================== */}
      <div className="web3-card rounded-3xl p-6 sm:p-8 mb-8">
        <h2 className="text-xl font-black text-white font-sans mb-6">
          Invoice Details
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-y-6 gap-x-8 font-mono">
          <div>
            <span className="text-xs text-slate-400 block mb-1">Face Value</span>
            <span className="text-base sm:text-lg font-black text-white block">
              USD {Number(asset.faceValue / BigInt(1e6)).toLocaleString()}
            </span>
          </div>

          <div>
            <span className="text-xs text-slate-400 block mb-1">Issue Date</span>
            <span className="text-base sm:text-lg font-bold text-white block">
              {asset.createdAt > BigInt(0) ? timestampToDate(asset.createdAt) : "07/01/2026"}
            </span>
          </div>

          <div>
            <span className="text-xs text-slate-400 block mb-1">Due Date</span>
            <span className="text-base sm:text-lg font-bold text-white block">
              {timestampToDate(asset.maturity)}
            </span>
          </div>

          <div>
            <span className="text-xs text-slate-400 block mb-1">Total Supply</span>
            <span className="text-base sm:text-lg font-bold text-white block">
              {Number(asset.tokenSupply).toLocaleString()} tokens
            </span>
          </div>

          <div>
            <span className="text-xs text-slate-400 block mb-1">Minimum Investment</span>
            <span className="text-base font-bold text-white block">
              —
            </span>
          </div>

          <div>
            <span className="text-xs text-slate-400 block mb-1">Sold Tokens</span>
            <span className="text-base font-bold text-white block">
              {soldTokens > 0 ? `${soldTokens.toLocaleString()} tokens` : "0 tokens"}
            </span>
          </div>

          <div>
            <span className="text-xs text-slate-400 block mb-1">Expected APY</span>
            <span className="text-base font-bold text-emerald-400 block">
              {formatBps(asset.expectedYieldBps)}
            </span>
          </div>

          <div>
            <span className="text-xs text-slate-400 block mb-1">Settlement Network</span>
            <span className="text-base font-bold text-cyan-300 block">
              BOHR Chain (968)
            </span>
          </div>
        </div>

        {/* Counterparty & On-chain Proofs */}
        <div className="mt-8 pt-6 border-t border-white/[0.06] grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-xl bg-slate-950/60 border border-white/[0.06] p-4">
            <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block mb-1">
              Originator / Issuer
            </span>
            <div className="flex items-center justify-between">
              <span className="font-mono text-sm font-bold text-white">
                {shortenAddress(asset.issuer)}
              </span>
              <a href={`${explorerBase}/address/${asset.issuer}`} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4 text-cyan-400" />
              </a>
            </div>
          </div>

          <div className="rounded-xl bg-slate-950/60 border border-white/[0.06] p-4">
            <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block mb-1">
              Counterparty Obligor
            </span>
            <div className="flex items-center justify-between">
              <span className="font-mono text-sm font-bold text-white">
                {shortenAddress(asset.counterparty)}
              </span>
              <a href={`${explorerBase}/address/${asset.counterparty}`} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4 text-cyan-400" />
              </a>
            </div>
          </div>

          <div className="rounded-xl bg-slate-950/60 border border-white/[0.06] p-4">
            <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block mb-1">
              Document Hash
            </span>
            <div className="font-mono text-xs text-cyan-300 truncate">
              {asset.documentHash}
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================
          4. PROGRAMMABLE LIFECYCLE PROGRESS
      ======================================================== */}
      <div className="web3-card rounded-2xl p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xs font-mono font-bold tracking-wider text-slate-400 uppercase">
            PROGRAMMABLE ASSET LIFECYCLE
          </h2>
          <span className="text-xs font-mono text-cyan-400 font-bold">
            STATE: {ASSET_STATE_LABELS[asset.state].toUpperCase()}
          </span>
        </div>
        <LifecycleTimeline current={asset.state} />
      </div>

      {/* ========================================================
          5. POSITION TIMELINE / EVENT LOGS
      ======================================================== */}
      {journeyEvents.length > 0 && (
        <div className="web3-card rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-6">
            <Activity className="h-4 w-4 text-cyan-400" />
            <h2 className="text-xs font-mono font-bold tracking-wider text-slate-400 uppercase">
              ON-CHAIN AUDIT TIMELINE
            </h2>
          </div>
          <div className="relative space-y-6 pl-6">
            <div className="absolute left-2.5 top-2 bottom-2 w-px bg-slate-800" />
            {journeyEvents.map((evt, i) => (
              <div key={i} className="relative group">
                <div className="absolute -left-4 top-1.5 h-3 w-3 rounded-full border-2 border-slate-950 bg-cyan-400" />
                <div className="rounded-xl bg-slate-950/50 border border-white/[0.06] p-3.5 hover:border-cyan-500/30 transition">
                  <div className="text-sm font-bold text-white">{evt.label}</div>
                  {evt.detail && <div className="mt-0.5 text-xs font-mono text-cyan-300">{evt.detail}</div>}
                  {evt.timestamp > 0 && (
                    <div className="mt-1 text-xs text-slate-400 font-mono">
                      {new Date(evt.timestamp * 1000).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      </motion.div>
    </AppLayout>
  );
}
