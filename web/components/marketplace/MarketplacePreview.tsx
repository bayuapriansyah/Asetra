"use client";

import { useState, useEffect, useCallback } from "react";
import { usePublicClient } from "wagmi";
import { ASETRA_ABI, ASETRA_ADDRESS } from "@/config/contracts";
import { formatUSD, formatBps, daysUntil, normalizePrice } from "@/lib/utils/format";
import { ASSET_STATE_LABELS, AssetState } from "@/types/asset";
import Link from "next/link";
import { ArrowRight, TrendingUp, Clock, Shield } from "lucide-react";

interface PreviewAsset {
  id: number;
  name: string;
  assetType: string;
  faceValue: bigint;
  yieldBps: bigint;
  maturity: bigint;
  fundedPercent: number;
  state: AssetState;
}

const STATE_STYLES: Record<AssetState, { bg: string; text: string; border: string }> = {
  0: { bg: "bg-slate-500/10", text: "text-slate-300", border: "border-slate-500/20" },
  1: { bg: "bg-cyan-500/10", text: "text-cyan-300", border: "border-cyan-500/20" },
  2: { bg: "bg-indigo-500/10", text: "text-indigo-300", border: "border-indigo-500/20" },
  3: { bg: "bg-amber-500/10", text: "text-amber-300", border: "border-amber-500/20" },
  4: { bg: "bg-emerald-500/10", text: "text-emerald-300", border: "border-emerald-500/20" },
  5: { bg: "bg-emerald-500/15", text: "text-emerald-300", border: "border-emerald-500/30" },
  6: { bg: "bg-sky-500/10", text: "text-sky-300", border: "border-sky-500/20" },
  7: { bg: "bg-teal-500/10", text: "text-teal-300", border: "border-teal-500/20" },
};

export function MarketplacePreview() {
  const publicClient = usePublicClient();
  const [assets, setAssets] = useState<PreviewAsset[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadPreview = useCallback(async () => {
    if (!publicClient) return;
    try {
      const countResult = await publicClient.readContract({
        address: ASETRA_ADDRESS, abi: ASETRA_ABI,         functionName: "getAssetCount",
      });
      const total = Math.min(Number(countResult), 3);
      if (total === 0) { setIsLoading(false); return; }

      const results: PreviewAsset[] = [];
      for (let i = 0; i < total; i++) {
        try {
          const [name, assetType, faceValue, yieldBps, maturity, state, fundedAmount, fundingTarget] = await Promise.all([
            publicClient.readContract({ address: ASETRA_ADDRESS, abi: ASETRA_ABI, functionName: "assetName", args: [BigInt(i)] }),
            publicClient.readContract({ address: ASETRA_ADDRESS, abi: ASETRA_ABI, functionName: "assetType", args: [BigInt(i)] }),
            publicClient.readContract({ address: ASETRA_ADDRESS, abi: ASETRA_ABI, functionName: "assetFaceValue", args: [BigInt(i)] }),
            publicClient.readContract({ address: ASETRA_ADDRESS, abi: ASETRA_ABI, functionName: "assetYieldBps", args: [BigInt(i)] }),
            publicClient.readContract({ address: ASETRA_ADDRESS, abi: ASETRA_ABI, functionName: "assetMaturity", args: [BigInt(i)] }),
            publicClient.readContract({ address: ASETRA_ADDRESS, abi: ASETRA_ABI, functionName: "assetState", args: [BigInt(i)] }),
            publicClient.readContract({ address: ASETRA_ADDRESS, abi: ASETRA_ABI, functionName: "assetFundedAmount", args: [BigInt(i)] }),
            publicClient.readContract({ address: ASETRA_ADDRESS, abi: ASETRA_ABI, functionName: "assetFundingTarget", args: [BigInt(i)] }),
          ]);
          const ft = fundingTarget as bigint;
          const fa = fundedAmount as bigint;
          results.push({
            id: i,
            name: name as string,
            assetType: assetType as string,
            faceValue: faceValue as bigint,
            yieldBps: yieldBps as bigint,
            maturity: maturity as bigint,
            fundedPercent: ft > BigInt(0) ? Number((fa * BigInt(10000)) / ft) / 100 : 0,
            state: Number(state) as AssetState,
          });
        } catch { /* skip */ }
      }
      setAssets(results);
    } catch (e) {
      console.error("Failed to load preview:", e);
    } finally {
      setIsLoading(false);
    }
  }, [publicClient]);

  useEffect(() => { loadPreview(); }, [loadPreview]);

  const displayAssets = assets.length > 0 ? assets : [
    { id: 0, name: "Invoice #INV-2048", assetType: "Invoice Financing", faceValue: BigInt("100000000000000000000000"), yieldBps: BigInt(820), maturity: BigInt(Math.floor(Date.now() / 1000) + 7776000), fundedPercent: 82, state: AssetState.ACTIVE as AssetState },
    { id: 1, name: "Trade Receivable #TR-1024", assetType: "Trade Receivable", faceValue: BigInt("50000000000000000000000"), yieldBps: BigInt(650), maturity: BigInt(Math.floor(Date.now() / 1000) + 5184000), fundedPercent: 100, state: AssetState.ACTIVE as AssetState },
    { id: 2, name: "Equipment Lease #EQ-0512", assetType: "Equipment Financing", faceValue: BigInt("200000000000000000000000"), yieldBps: BigInt(910), maturity: BigInt(Math.floor(Date.now() / 1000) + 10368000), fundedPercent: 45, state: AssetState.LISTED as AssetState },
  ];

  return (
    <div className="grid gap-6 md:grid-cols-3">
      {displayAssets.map((asset) => {
        const badge = STATE_STYLES[asset.state] || STATE_STYLES[0];
        const days = daysUntil(asset.maturity);
        return (
          <Link key={asset.id} href={`/app/assets/${asset.id}`}>
            <div className="web3-card web3-card-hover rounded-2xl p-6 transition duration-300">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-mono text-cyan-400 font-bold">{asset.assetType}</span>
                <span className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-0.5 text-xs font-black uppercase font-mono border ${badge.bg} ${badge.text} ${badge.border}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${badge.text.replace("text-", "bg-")}`} />
                  {ASSET_STATE_LABELS[asset.state]}
                </span>
              </div>
              <h3 className="text-lg font-black text-white mb-4">{asset.name}</h3>

              <div className="grid grid-cols-2 gap-3 text-xs mb-4">
                <div className="rounded-xl bg-slate-950/60 p-2.5 border border-white/[0.06]">
                  <div className="text-slate-400 uppercase font-mono">Face Value</div>
                  <div className="mt-0.5 font-mono text-sm font-black text-white">{formatUSD(asset.faceValue)}</div>
                </div>
                <div className="rounded-xl bg-slate-950/60 p-2.5 border border-white/[0.06]">
                  <div className="text-slate-400 uppercase font-mono">Target APY</div>
                  <div className="mt-0.5 font-mono text-sm font-black text-emerald-400">{formatBps(asset.yieldBps)}</div>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-mono text-slate-400">
                  <span>Funded</span>
                  <span className="text-cyan-400 font-bold">{asset.fundedPercent.toFixed(0)}%</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-slate-800">
                  <div className="h-full rounded-full bg-cyan-400 transition-all duration-500" style={{ width: `${Math.min(asset.fundedPercent, 100)}%` }} />
                </div>
                <div className="flex justify-between text-xs font-mono text-slate-500 pt-1">
                  <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {days > 0 ? `${days}d` : "Matured"}</span>
                  <span className="flex items-center gap-1"><Shield className="h-3 w-3" /> Verified</span>
                </div>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
