"use client";

import Link from "next/link";
import type { AssetData } from "@/types/asset";
import { ASSET_STATE_LABELS, AssetState } from "@/types/asset";
import { formatUSD, formatBps, daysUntil, shortenAddress, normalizePrice } from "@/lib/utils/format";
import { FileText, Clock, User, TrendingUp, Sparkles, ArrowRight } from "lucide-react";

interface AssetCardProps {
  asset: AssetData;
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

export function AssetCard({ asset }: AssetCardProps) {
  const days = daysUntil(asset.maturity);
  const fundedPercent =
    asset.fundingTarget > BigInt(0)
      ? Number((asset.fundedAmount * BigInt(10000)) / asset.fundingTarget) / 100
      : 0;

  const badge = STATE_BADGE_STYLES[asset.state] || STATE_BADGE_STYLES[0];

  return (
    <Link href={`/app/assets/${asset.id}`}>
      <div className="web3-card web3-card-hover group flex h-full flex-col justify-between rounded-2xl p-5 relative overflow-hidden transition-all duration-300">
        {/* Top Header */}
        <div>
          <div className="mb-3 flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="rounded-md bg-[#16181b] border border-white/[0.08] px-1.5 py-0.5 text-[10px] font-mono text-cyan-400">
                #{asset.id.toString()}
              </span>
              <span className="rounded-md bg-white/[0.05] border border-white/[0.06] px-2 py-0.5 text-[11px] font-medium text-zinc-300">
                {asset.assetType}
              </span>
            </div>
            <span
              className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-mono font-medium ${badge.bg} ${badge.text} ${badge.border}`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${badge.dot}`} />
              {ASSET_STATE_LABELS[asset.state]}
            </span>
          </div>

          <h3 className="text-lg font-bold text-white group-hover:text-cyan-300 transition-colors line-clamp-1">
            {asset.name}
          </h3>

          {/* Key Financials */}
          <div className="my-4 grid grid-cols-3 gap-3 rounded-xl border border-white/[0.06] bg-[#000000]/60 p-3">
            <div>
              <div className="text-[11px] font-mono uppercase tracking-wider text-zinc-500">Face Value</div>
              <div className="mt-0.5 text-base font-bold font-mono text-white">
                {formatUSD(asset.faceValue)}
              </div>
            </div>
            <div className="border-l border-white/[0.06] pl-3">
              <div className="text-[11px] font-mono uppercase tracking-wider text-zinc-500">Price</div>
              <div className="mt-0.5 text-base font-bold font-mono text-cyan-300">
                {formatUSD(normalizePrice(asset.pricePerUnit))}
              </div>
            </div>
            <div className="border-l border-white/[0.06] pl-3">
              <div className="text-[11px] font-mono uppercase tracking-wider text-zinc-500">Yield</div>
              <div className="mt-0.5 text-base font-bold font-mono text-emerald-400 flex items-center gap-1">
                <TrendingUp className="h-3.5 w-3.5" />
                <span>{formatBps(asset.expectedYieldBps)}</span>
              </div>
            </div>
          </div>

          {/* Funding Progress Bar */}
          <div className="mb-4">
            <div className="mb-1.5 flex justify-between text-xs font-mono">
              <span className="text-zinc-400">Funded</span>
              <span className="font-semibold text-zinc-200">{fundedPercent.toFixed(1)}%</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-black/60">
              <div
                className="h-full rounded-full bg-cyan-400 transition-all duration-500"
                style={{ width: `${Math.min(fundedPercent, 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Footer Meta */}
        <div className="border-t border-white/[0.06] pt-3 flex items-center justify-between text-xs font-mono text-slate-400">
          <div className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-slate-500" />
            <span>{days > 0 ? `${days}d left` : "Matured"}</span>
          </div>

          <div className="flex items-center gap-1.5 text-slate-400 group-hover:text-cyan-300 transition-colors">
            <User className="h-3.5 w-3.5 text-slate-500" />
            <span>{shortenAddress(asset.issuer)}</span>
            <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>
      </div>
    </Link>
  );
}
