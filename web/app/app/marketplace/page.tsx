"use client";

import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAllAssets } from "@/hooks/useAssets";
import { AssetCard } from "@/components/asset/AssetCard";
import { AssetState } from "@/types/asset";
import { Loader2, Search, Package, Sparkles, Filter, Layers, TrendingUp, DollarSign } from "lucide-react";
import { formatUSD } from "@/lib/utils/format";

const STATE_FILTERS = [
  { label: "All Assets", value: -1 },
  { label: "Listed", value: AssetState.LISTED },
  { label: "Funded", value: AssetState.FUNDED },
  { label: "Active Yield", value: AssetState.ACTIVE },
  { label: "Matured", value: AssetState.MATURED },
];

export default function MarketplacePage() {
  const { assets, isLoading } = useAllAssets();
  const [filter, setFilter] = useState(-1);
  const [search, setSearch] = useState("");

  const filtered = assets.filter((a) => {
    if (filter !== -1 && a.state !== filter) return false;
    if (search && !a.name.toLowerCase().includes(search.toLowerCase()) && !a.assetType.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const totalMarketValue = assets.reduce((acc, a) => acc + a.faceValue, BigInt(0));
  const listedCount = assets.filter((a) => a.state === AssetState.LISTED).length;

  return (
    <AppLayout>
      {/* Header & Metrics Strip */}
      <div className="mb-8 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white font-sans">
              Primary Marketplace
            </h1>
            <span className="rounded-full bg-cyan-500/10 border border-cyan-500/20 px-2.5 py-0.5 text-xs font-mono font-medium text-cyan-400">
              Verified RWAs
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-400">
            Discover verified institutional debt, trade finance invoices, and tokenized yield positions.
          </p>
        </div>

        {/* Quick Market Stats */}
        <div className="flex items-center gap-3">
          <div className="rounded-xl border border-white/[0.08] bg-slate-900/80 px-4 py-2 text-right">
            <div className="text-[10px] font-mono uppercase tracking-wider text-slate-500">Total RWA Value</div>
            <div className="text-sm font-extrabold font-mono text-white">{formatUSD(totalMarketValue)}</div>
          </div>
          <div className="rounded-xl border border-white/[0.08] bg-slate-900/80 px-4 py-2 text-right">
            <div className="text-[10px] font-mono uppercase tracking-wider text-slate-500">Listed For Funding</div>
            <div className="text-sm font-extrabold font-mono text-cyan-400">{listedCount} Assets</div>
          </div>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or asset type..."
            className="w-full rounded-xl border border-white/[0.08] bg-slate-900/90 py-2.5 pl-10 pr-4 text-xs sm:text-sm text-white placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400/30 transition-all"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-white/[0.08] bg-slate-900/80 p-1">
          {STATE_FILTERS.map((f) => {
            const isSelected = filter === f.value;
            return (
              <button
                key={f.value}
                onClick={() => setFilter(f.value)}
                className={`rounded-lg px-3 py-1.5 text-xs font-mono font-semibold transition-all ${
                  isSelected
                    ? "bg-cyan-400 text-slate-950 shadow-sm shadow-cyan-500/20"
                    : "text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]"
                }`}
              >
                {f.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Asset Grid */}
      {isLoading ? (
        <div className="web3-card rounded-2xl flex flex-col items-center justify-center py-24">
          <Loader2 className="h-10 w-10 animate-spin text-cyan-400 mb-3" />
          <p className="text-xs font-mono text-slate-400">Loading verified assets from contract...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="web3-card rounded-2xl p-16 text-center">
          <Package className="mx-auto mb-4 h-12 w-12 text-slate-600" />
          <h3 className="text-lg font-bold text-white mb-1">No Assets Found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            {assets.length === 0
              ? "No assets have been tokenized yet on the testnet. Be the first to issue an asset!"
              : "No assets match your current search or state filters."}
          </p>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((asset) => (
            <AssetCard key={asset.id.toString()} asset={asset} />
          ))}
        </div>
      )}
    </AppLayout>
  );
}
