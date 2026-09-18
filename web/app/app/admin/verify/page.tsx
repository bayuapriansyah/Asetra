"use client";

import { useState, useEffect, useCallback } from "react";
import { useAccount, usePublicClient, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { AppLayout } from "@/components/layout/AppLayout";
import { ASETRA_ABI, TUSDT_ABI } from "@/config/contracts";
import { useAsetraAddress, useTusdtAddress } from "@/hooks/useContractAddresses";
import { useVerifyAsset } from "@/hooks/useLifecycle";
import { TxSuccessBanner } from "@/components/ui/TxSuccessBanner";
import { TxProgress } from "@/components/ui/TxProgress";
import { parseContractError } from "@/lib/utils/errors";
import { formatUSD } from "@/lib/utils/format";
import {
  ShieldCheck, RefreshCw, ExternalLink, CheckCircle2, Clock,
  FileText, Banknote, Loader2, AlertCircle, ArrowRight,
} from "lucide-react";
import { AdminVerifySkeleton } from "@/components/skeleton/PageSkeletons";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { RoleGuard } from "@/components/role/RoleGuard";

interface AssetInfo {
  assetId: number;
  name: string;
  counterparty: string;
  faceValue: bigint;
  docHash: string;
  createdAt: bigint;
  state: number;
  totalPaid: bigint;
  paymentFunded: bigint;
  tokenSupply: bigint;
}

type TabType = "verify" | "payment" | "fund";

const TABS: { id: TabType; label: string; icon: typeof FileText }[] = [
  { id: "verify", label: "Verification Queue", icon: ShieldCheck },
  { id: "payment", label: "Record Payment", icon: FileText },
  { id: "fund", label: "Fund Settlement", icon: Banknote },
];

function keccak256(text: string): `0x${string}` {
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = (hash * 0x01000193) >>> 0;
  }
  let hex = hash.toString(16).padStart(8, "0");
  for (let i = 1; i < 8; i++) {
    const part = ((hash * (i + 1)) ^ (hash >>> (i * 3))).toString(16).padStart(8, "0");
    hex += part;
  }
  return (`0x${hex.slice(0, 64).padStart(64, "0")}`) as `0x${string}`;
}

export default function AdminVerifyPage() {
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const ASETRA_ADDRESS = useAsetraAddress();
  const TUSDT_ADDRESS = useTusdtAddress();
  const { verify, txHash: verifyTxHash, isPending: verifyPending, isConfirming: verifyConfirming, isSuccess: verifySuccess, isError: verifyIsError, error: verifyError, reset: verifyReset } = useVerifyAsset();

  const { writeContractAsync, data: txHash, isPending, reset } = useWriteContract();
  const { isLoading: isConfirming, isSuccess, isError: rcptIsError, error: rcptError } = useWaitForTransactionReceipt({ hash: txHash });

  const isError = rcptIsError;
  const error = rcptError;

  const [activeTab, setActiveTab] = useState<TabType>("verify");
  const [assets, setAssets] = useState<AssetInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [verifyingId, setVerifyingId] = useState<number | null>(null);
  const [txError, setTxError] = useState<string | null>(null);

  const [payAssetId, setPayAssetId] = useState<number | null>(null);
  const [payAmount, setPayAmount] = useState("");
  const [payAmountDisplay, setPayAmountDisplay] = useState("");
  const [payEvidence, setPayEvidence] = useState("");

  const [fundAssetId, setFundAssetId] = useState<number | null>(null);
  const [fundAmount, setFundAmount] = useState("");
  const [fundAmountDisplay, setFundAmountDisplay] = useState("");
  const [tusdtBalance, setTusdtBalance] = useState<bigint>(BigInt(0));

  const loadAssets = useCallback(async () => {
    if (!publicClient) return;
    setIsLoading(true);
    try {
      const countResult = await publicClient.readContract({
        address: ASETRA_ADDRESS,
        abi: ASETRA_ABI,
        functionName: "getAssetCount",
      });
      const total = Number(countResult);
      const results: AssetInfo[] = [];

      for (let i = 0; i < total; i++) {
        try {
          const [state, name, counterparty, faceValue, docHash, createdAt, totalPaid, paymentFunded, tokenSupply] = await Promise.all([
            publicClient.readContract({ address: ASETRA_ADDRESS, abi: ASETRA_ABI, functionName: "assetState", args: [BigInt(i)] }),
            publicClient.readContract({ address: ASETRA_ADDRESS, abi: ASETRA_ABI, functionName: "assetName", args: [BigInt(i)] }),
            publicClient.readContract({ address: ASETRA_ADDRESS, abi: ASETRA_ABI, functionName: "assetCounterparty", args: [BigInt(i)] }),
            publicClient.readContract({ address: ASETRA_ADDRESS, abi: ASETRA_ABI, functionName: "assetFaceValue", args: [BigInt(i)] }),
            publicClient.readContract({ address: ASETRA_ADDRESS, abi: ASETRA_ABI, functionName: "assetDocHash", args: [BigInt(i)] }),
            publicClient.readContract({ address: ASETRA_ADDRESS, abi: ASETRA_ABI, functionName: "assetCreatedAt", args: [BigInt(i)] }),
            publicClient.readContract({ address: ASETRA_ADDRESS, abi: ASETRA_ABI, functionName: "totalPaid", args: [BigInt(i)] }),
            publicClient.readContract({ address: ASETRA_ADDRESS, abi: ASETRA_ABI, functionName: "paymentFunded", args: [BigInt(i)] }),
            publicClient.readContract({ address: ASETRA_ADDRESS, abi: ASETRA_ABI, functionName: "assetTokenSupply", args: [BigInt(i)] }),
          ]);
          results.push({
            assetId: i,
            name: name as string,
            counterparty: counterparty as string,
            faceValue: faceValue as bigint,
            docHash: docHash as string,
            createdAt: createdAt as bigint,
            state: Number(state),
            totalPaid: totalPaid as bigint,
            paymentFunded: paymentFunded as bigint,
            tokenSupply: tokenSupply as bigint,
          });
        } catch { /* skip */ }
      }
      setAssets(results);

      if (address && publicClient) {
        try {
          const bal = await publicClient.readContract({
            address: TUSDT_ADDRESS,
            abi: TUSDT_ABI,
            functionName: "balanceOf",
            args: [address],
          });
          setTusdtBalance(bal as bigint);
        } catch { /* skip */ }
      }
    } catch (e) {
      console.error("Failed to load assets:", e);
    } finally {
      setIsLoading(false);
    }
  }, [publicClient, address]);

  useEffect(() => { loadAssets(); }, [loadAssets]);

  useEffect(() => {
    if (isSuccess || verifySuccess) {
      loadAssets();
      setVerifyingId(null);
      setPayAmount("");
      setPayAmountDisplay("");
      setPayEvidence("");
      setFundAmount("");
      setFundAmountDisplay("");
      setTxError(null);
    }
  }, [isSuccess, verifySuccess, loadAssets]);

  const handleVerify = async (assetId: number) => {
    setVerifyingId(assetId);
    verifyReset();
    try { await verify(assetId); } catch (e) { console.error("Verify failed:", e); }
  };

  const handleRecordPayment = async () => {
    if (payAssetId === null || !payAmount) return;
    setTxError(null);
    try {
      const evHash = keccak256(payEvidence || `payment-${Date.now()}`);
      await writeContractAsync({
        address: ASETRA_ADDRESS,
        abi: ASETRA_ABI,
        functionName: "recordPayment",
        args: [BigInt(payAssetId), BigInt(payAmount), evHash],
      });
    } catch (e) { setTxError(parseContractError(e)); }
  };

  const handleFundSettlement = async () => {
    if (fundAssetId === null || !fundAmount) return;
    setTxError(null);
    try {
      const approveHash = await writeContractAsync({
        address: TUSDT_ADDRESS,
        abi: TUSDT_ABI,
        functionName: "approve",
        args: [ASETRA_ADDRESS, BigInt(fundAmount)],
      });
      if (publicClient) {
        await publicClient.waitForTransactionReceipt({ hash: approveHash });
      }
      await writeContractAsync({
        address: ASETRA_ADDRESS,
        abi: ASETRA_ABI,
        functionName: "fundSettlement",
        args: [BigInt(fundAssetId), BigInt(fundAmount)],
      });
    } catch (e) { setTxError(parseContractError(e)); }
  };

  const pendingAssets = assets.filter((a) => a.state === 0);
  const paymentAssets = assets.filter((a) => a.state >= 3);
  const selectedPayAsset = payAssetId !== null ? assets.find((a) => a.assetId === payAssetId) : null;
  const maxPayAmount = selectedPayAsset ? Number(selectedPayAsset.faceValue - selectedPayAsset.totalPaid) : 0;
  const selectedFundAsset = fundAssetId !== null ? assets.find((a) => a.assetId === fundAssetId) : null;

  return (
    <RoleGuard allowed={["admin"]}>
    <AppLayout>
      <div className="mb-8">
        <div className="flex items-center gap-2.5 mb-1">
          <h1 className="text-3xl font-black tracking-tight text-white">Admin Control</h1>
          <span className="rounded-full bg-blue-500/10 border border-blue-500/20 px-2.5 py-0.5 text-xs font-mono font-medium text-blue-400">
            Admin
          </span>
        </div>
        <p className="text-sm text-slate-400">
          Verify assets, record debtor payments, and fund settlements on-chain.
        </p>
      </div>

      {/* Tab Bar */}
      <div className="mb-8 flex rounded-xl border border-white/[0.08] bg-slate-950/80 p-1">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setTxError(null); verifyReset(); reset(); }}
              className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2.5 text-xs sm:text-sm font-bold font-mono transition-all ${
                isActive
                  ? "bg-blue-500 text-white shadow-md shadow-blue-500/20"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Icon className="h-4 w-4" />
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="sm:hidden">{tab.id === "verify" ? "Verify" : tab.id === "payment" ? "Payment" : "Fund"}</span>
            </button>
          );
        })}
      </div>

      {/* Global Feedback */}
      {(isSuccess || verifySuccess) && (txHash || verifyTxHash) && (
        <div className="mb-6">
          <TxSuccessBanner
            txHash={(txHash || verifyTxHash) as string}
            message={activeTab === "verify" ? "Asset verified successfully!" : activeTab === "payment" ? "Payment recorded!" : "Settlement funded!"}
            onDismiss={() => { verifyReset(); reset(); }}
          />
        </div>
      )}

      {(isError || verifyIsError) && (error || verifyError) && (
        <div className="mb-6 rounded-xl border border-red-500/20 bg-red-500/5 p-4">
          <p className="text-sm font-medium text-red-400">{parseContractError(error || verifyError)}</p>
        </div>
      )}

      {txError && (
        <div className="mb-6 rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 flex items-start gap-2.5">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" />
          <p className="text-sm font-medium text-rose-300">{txError}</p>
        </div>
      )}

      {(isPending || isConfirming) && (
        <div className="mb-6">
          <TxProgress step={isConfirming ? "pending" : isPending ? "preparing" : "idle"} />
        </div>
      )}

      {/* ─── VERIFY TAB ─── */}
      {activeTab === "verify" && (
        <>
          <div className="mb-4 flex items-center justify-between">
            <span className="text-xs font-mono text-slate-400">
              {pendingAssets.length} asset{pendingAssets.length !== 1 ? "s" : ""} pending verification
            </span>
            <button onClick={loadAssets} disabled={isLoading}
              className="flex items-center gap-2 rounded-xl border border-white/[0.08] bg-slate-900/80 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-800 transition-all disabled:opacity-50">
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
            <motion.div key="empty" initial={{opacity:0, y:12}} animate={{opacity:1, y:0}} transition={{duration:0.35, ease:[0.16,1,0.3,1]}} className="web3-card rounded-2xl p-12 text-center">
              <CheckCircle2 className="mx-auto mb-4 h-12 w-12 text-emerald-400/60" />
              <h3 className="text-lg font-bold text-white mb-2">All Clear</h3>
              <p className="text-sm text-slate-400">No assets pending verification.</p>
            </motion.div>
          ) : (
            <motion.div key="list" initial={{opacity:0, y:12}} animate={{opacity:1, y:0}} transition={{duration:0.35, ease:[0.16,1,0.3,1]}} className="space-y-3">
              {pendingAssets.map((asset) => (
                <div key={asset.assetId} className="web3-card rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-900 border border-white/[0.08] text-blue-400 font-mono font-bold">
                      #{asset.assetId}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-bold text-white">{asset.name}</span>
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 text-[10px] font-mono text-amber-400">
                          <Clock className="h-2.5 w-2.5" /> PENDING
                        </span>
                      </div>
                      <div className="text-xs font-mono text-slate-400">
                        Counterparty: {asset.counterparty.slice(0, 6)}...{asset.counterparty.slice(-4)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Link href={`/app/assets/${asset.assetId}`}
                      className="flex items-center gap-1 rounded-lg border border-white/[0.08] bg-slate-800/60 px-3 py-2 text-xs font-medium text-slate-300 hover:bg-slate-700 transition-colors">
                      View <ExternalLink className="h-3 w-3" />
                    </Link>
                    <button onClick={() => handleVerify(asset.assetId)} disabled={verifyPending || verifyConfirming}
                      className="flex items-center gap-2 rounded-xl bg-blue-500 px-4 py-2 text-xs font-bold text-white shadow-md shadow-blue-500/20 hover:bg-blue-400 transition-all disabled:opacity-50">
                      {verifyingId === asset.assetId && (verifyPending || verifyConfirming) ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <ShieldCheck className="h-3.5 w-3.5" />
                      )}
                      Verify
                    </button>
                  </div>
                </div>
              ))}
            </motion.div>
          )}
          </AnimatePresence>
        </>
      )}

      {/* ─── RECORD PAYMENT TAB ─── */}
      {activeTab === "payment" && (
        <motion.div initial={{opacity:0, y:12}} animate={{opacity:1, y:0}} transition={{duration:0.35, ease:[0.16,1,0.3,1]}}>
          <div className="grid gap-6 lg:grid-cols-12">
            <div className="web3-card rounded-2xl p-6 lg:col-span-7">
              <div className="mb-5 flex items-center gap-2 border-b border-white/[0.06] pb-3">
                <FileText className="h-4 w-4 text-blue-400" />
                <h3 className="font-bold text-white">Record Debtor Payment</h3>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-mono uppercase tracking-wider text-slate-400">Select Asset</label>
                  <select value={payAssetId ?? ""} onChange={(e) => { setPayAssetId(e.target.value ? parseInt(e.target.value) : null); setPayAmount(""); setPayAmountDisplay(""); }}
                    className="mt-1.5 w-full rounded-xl border border-white/[0.08] bg-slate-900 px-4 py-2.5 font-mono text-sm text-white focus:border-blue-400 focus:outline-none">
                    <option value="">Select an active asset...</option>
                    {paymentAssets.map((a) => (
                      <option key={a.assetId} value={a.assetId}>
                        #{a.assetId} {a.name} — Paid: {formatUSD(a.totalPaid)} / {formatUSD(a.faceValue)}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedPayAsset && (
                  <div className="rounded-xl border border-white/[0.06] bg-slate-950/60 p-4 font-mono text-xs">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-slate-400">Payment Progress</span>
                      <span className="text-blue-400 font-bold">{formatUSD(selectedPayAsset.totalPaid)} / {formatUSD(selectedPayAsset.faceValue)}</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                      <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all"
                        style={{ width: `${selectedPayAsset.faceValue > BigInt(0) ? Math.min(100, (Number(selectedPayAsset.totalPaid) / Number(selectedPayAsset.faceValue)) * 100) : 0}%` }} />
                    </div>
                    <div className="mt-1 text-[10px] text-slate-500 text-right">
                      Remaining: {formatUSD(selectedPayAsset.faceValue - selectedPayAsset.totalPaid)}
                    </div>
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-mono uppercase tracking-wider text-slate-400">Payment Amount (tUSDT)</label>
                    {selectedPayAsset && maxPayAmount > 0 && (
                      <button onClick={() => { setPayAmount(String(maxPayAmount)); setPayAmountDisplay(formatUSD(BigInt(maxPayAmount)).replace("$","")); }}
                        className="text-blue-400 hover:underline text-xs font-bold font-mono">
                        Max ({formatUSD(BigInt(maxPayAmount))})
                      </button>
                    )}
                  </div>
                  <input type="number" value={payAmountDisplay}
                    onChange={(e) => {
                      const display = e.target.value;
                      setPayAmountDisplay(display);
                      const num = parseFloat(display || "0");
                      const wei = BigInt(Math.round(num * 1_000_000));
                      setPayAmount(wei.toString());
                    }}
                    placeholder="0.00" min="0.01" max={maxPayAmount}
                    disabled={!payAssetId}
                    className="mt-1.5 w-full rounded-xl border border-white/[0.08] bg-slate-900 px-4 py-3 font-mono text-base text-white placeholder:text-slate-600 focus:border-blue-400 focus:outline-none disabled:opacity-40 disabled:cursor-not-allowed" />
                </div>

                <div>
                  <label className="text-xs font-mono uppercase tracking-wider text-slate-400">Evidence Reference (optional)</label>
                  <input type="text" value={payEvidence} onChange={(e) => setPayEvidence(e.target.value)}
                    placeholder="e.g. invoice-2024-001 or tx hash"
                    className="mt-1.5 w-full rounded-xl border border-white/[0.08] bg-slate-900 px-4 py-2.5 font-mono text-sm text-white placeholder:text-slate-600 focus:border-blue-400 focus:outline-none" />
                  <p className="mt-1 text-[10px] text-slate-500">Auto-hashed to bytes32 on-chain</p>
                </div>

                <button onClick={handleRecordPayment}
                  disabled={isPending || isConfirming || payAssetId === null || !payAmount}
                  className="w-full rounded-xl bg-blue-500 py-3 text-sm font-bold text-white shadow-md shadow-blue-500/20 hover:bg-blue-400 disabled:opacity-40 transition-all flex items-center justify-center gap-2">
                  {isPending || isConfirming ? <Loader2 className="h-4 w-4 animate-spin" /> : <span>Record Payment On-Chain</span>}
                </button>
              </div>
            </div>

            <div className="lg:col-span-5 space-y-4">
              <div className="web3-card rounded-2xl p-5">
                <h3 className="mb-3 text-xs font-mono font-bold uppercase tracking-wider text-slate-400">Asset Payment Status</h3>
                {paymentAssets.length === 0 ? (
                  <p className="text-xs text-slate-500 text-center py-4">No active assets found.</p>
                ) : (
                  <div className="space-y-2">
                    {paymentAssets.map((a) => {
                      const pct = a.faceValue > BigInt(0) ? Number(a.totalPaid) / Number(a.faceValue) * 100 : 0;
                      return (
                        <div key={a.assetId} onClick={() => { setPayAssetId(a.assetId); setPayAmount(""); setPayAmountDisplay(""); }}
                          className={`cursor-pointer rounded-xl border p-3 transition-all ${payAssetId === a.assetId ? "border-blue-400/50 bg-blue-500/[0.06]" : "border-white/[0.06] bg-slate-900/60 hover:border-white/[0.15]"}`}>
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="font-bold text-xs text-white">#{a.assetId} {a.name}</span>
                            <span className="text-[10px] font-mono text-blue-400">{pct.toFixed(1)}%</span>
                          </div>
                          <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
                            <div className="h-full rounded-full bg-blue-500" style={{ width: `${Math.min(100, pct)}%` }} />
                          </div>
                          <div className="mt-1.5 flex justify-between text-[10px] font-mono text-slate-500">
                            <span>{formatUSD(a.totalPaid)} paid</span>
                            <span>{formatUSD(a.faceValue)} face</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* ─── FUND SETTLEMENT TAB ─── */}
      {activeTab === "fund" && (
        <motion.div initial={{opacity:0, y:12}} animate={{opacity:1, y:0}} transition={{duration:0.35, ease:[0.16,1,0.3,1]}}>
          <div className="grid gap-6 lg:grid-cols-12">
            <div className="web3-card rounded-2xl p-6 lg:col-span-7">
              <div className="mb-5 flex items-center gap-2 border-b border-white/[0.06] pb-3">
                <Banknote className="h-4 w-4 text-emerald-400" />
                <h3 className="font-bold text-white">Fund Settlement Pool</h3>
              </div>

              <div className="space-y-4">
                <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3.5 text-xs text-emerald-300 flex items-start gap-2.5">
                  <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                  <span>Deposit tUSDT into the contract to back investor claims. Your wallet balance: <strong>{formatUSD(tusdtBalance)}</strong></span>
                </div>

                <div>
                  <label className="text-xs font-mono uppercase tracking-wider text-slate-400">Select Asset</label>
                  <select value={fundAssetId ?? ""} onChange={(e) => { setFundAssetId(e.target.value ? parseInt(e.target.value) : null); setFundAmount(""); setFundAmountDisplay(""); }}
                    className="mt-1.5 w-full rounded-xl border border-white/[0.08] bg-slate-900 px-4 py-2.5 font-mono text-sm text-white focus:border-emerald-400 focus:outline-none">
                    <option value="">Select an active asset...</option>
                    {paymentAssets.map((a) => (
                      <option key={a.assetId} value={a.assetId}>
                        #{a.assetId} {a.name} — Funded: {formatUSD(a.paymentFunded)}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedFundAsset && (
                  <div className="rounded-xl border border-white/[0.06] bg-slate-950/60 p-4 font-mono text-xs">
                    <div className="grid grid-cols-2 gap-3 text-center">
                      <div>
                        <div className="text-[10px] text-slate-500 uppercase">Total Paid</div>
                        <div className="mt-1 font-bold text-blue-400 text-sm">{formatUSD(selectedFundAsset.totalPaid)}</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-500 uppercase">Pool Funded</div>
                        <div className="mt-1 font-bold text-emerald-400 text-sm">{formatUSD(selectedFundAsset.paymentFunded)}</div>
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-mono uppercase tracking-wider text-slate-400">Fund Amount (tUSDT)</label>
                    {tusdtBalance > BigInt(0) && (
                      <button onClick={() => { const max = Number(tusdtBalance); setFundAmount(String(max)); setFundAmountDisplay(formatUSD(tusdtBalance).replace("$","")); }}
                        className="text-emerald-400 hover:underline text-xs font-bold font-mono">
                        Max Wallet
                      </button>
                    )}
                  </div>
                  <input type="number" value={fundAmountDisplay}
                    onChange={(e) => {
                      const display = e.target.value;
                      setFundAmountDisplay(display);
                      const num = parseFloat(display || "0");
                      const wei = BigInt(Math.round(num * 1_000_000));
                      setFundAmount(wei.toString());
                    }}
                    placeholder="0.00" min="0.01"
                    disabled={!fundAssetId}
                    className="mt-1.5 w-full rounded-xl border border-white/[0.08] bg-slate-900 px-4 py-3 font-mono text-base text-white placeholder:text-slate-600 focus:border-emerald-400 focus:outline-none disabled:opacity-40 disabled:cursor-not-allowed" />
                </div>

                <button onClick={handleFundSettlement}
                  disabled={isPending || isConfirming || fundAssetId === null || !fundAmount}
                  className="w-full rounded-xl bg-emerald-500 py-3 text-sm font-bold text-white shadow-md shadow-emerald-500/20 hover:bg-emerald-400 disabled:opacity-40 transition-all flex items-center justify-center gap-2">
                  {isPending || isConfirming ? <Loader2 className="h-4 w-4 animate-spin" /> : <span>Approve & Fund Settlement</span>}
                </button>
              </div>
            </div>

            <div className="lg:col-span-5 space-y-4">
              <div className="web3-card rounded-2xl p-5">
                <h3 className="mb-3 text-xs font-mono font-bold uppercase tracking-wider text-slate-400">Settlement Pool Status</h3>
                {paymentAssets.length === 0 ? (
                  <p className="text-xs text-slate-500 text-center py-4">No active assets found.</p>
                ) : (
                  <div className="space-y-2">
                    {paymentAssets.map((a) => (
                      <div key={a.assetId} onClick={() => { setFundAssetId(a.assetId); setFundAmount(""); setFundAmountDisplay(""); }}
                        className={`cursor-pointer rounded-xl border p-3 transition-all ${fundAssetId === a.assetId ? "border-emerald-400/50 bg-emerald-500/[0.06]" : "border-white/[0.06] bg-slate-900/60 hover:border-white/[0.15]"}`}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-xs text-white">#{a.assetId} {a.name}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
                          <div>
                            <div className="text-slate-500">Total Paid</div>
                            <div className="text-blue-400 font-bold">{formatUSD(a.totalPaid)}</div>
                          </div>
                          <div>
                            <div className="text-slate-500">Pool Funded</div>
                            <div className="text-emerald-400 font-bold">{formatUSD(a.paymentFunded)}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AppLayout>
    </RoleGuard>
  );
}
