"use client";

import { useState, useEffect, useCallback } from "react";
import { useAccount, usePublicClient, useReadContract } from "wagmi";
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { AppLayout } from "@/components/layout/AppLayout";
import { ASETRA_ABI, TUSDT_ABI } from "@/config/contracts";
import { useAsetraAddress, useTusdtAddress } from "@/hooks/useContractAddresses";
import { formatUSD } from "@/lib/utils/format";
import { parseContractError } from "@/lib/utils/errors";
import { TxSuccessBanner } from "@/components/ui/TxSuccessBanner";
import { TxProgress } from "@/components/ui/TxProgress";
import { BorrowSkeleton } from "@/components/skeleton/PageSkeletons";
import { RoleGuard } from "@/components/role/RoleGuard";
import { ASSET_STATE_LABELS, type AssetState } from "@/types/asset";
import {
  Wallet,
  DollarSign,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  RefreshCw,
  Landmark,
  Shield,
  ArrowRight,
  TrendingDown,
  Info,
} from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

interface BorrowData {
  assetId: number;
  assetName: string;
  assetState: AssetState;
  collateralAmount: bigint;
  borrowedAmount: bigint;
  healthFactor: bigint;
  healthy: boolean;
  availableCredit: bigint;
}

export default function BorrowPage() {
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const ASETRA_ADDRESS = useAsetraAddress();
  const TUSDT_ADDRESS = useTusdtAddress();
  const [assets, setAssets] = useState<BorrowData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [selectedAsset, setSelectedAsset] = useState<number | null>(null);
  const [borrowAmount, setBorrowAmount] = useState("");
  const [tab, setTab] = useState<"borrow" | "repay">("borrow");
  const [txError, setTxError] = useState<string | null>(null);

  const { writeContractAsync, data: txHash, isPending, reset } = useWriteContract();
  const { isLoading: isConfirming, isSuccess, isError: rcptIsError, error: rcptError } = useWaitForTransactionReceipt({ hash: txHash });

  const isError = rcptIsError;
  const error = rcptError;

  const { data: tusdtBalance } = useReadContract({
    address: TUSDT_ADDRESS,
    abi: TUSDT_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
  });

  const loadData = useCallback(async () => {
    if (!publicClient || !address) return;
    setIsLoading(true);
    try {
      const countResult = await publicClient.readContract({
        address: ASETRA_ADDRESS,
        abi: ASETRA_ABI,
        functionName: "getAssetCount",
      });
      const total = Number(countResult);
      const results: BorrowData[] = [];

      for (let i = 0; i < total; i++) {
        try {
          const [pos, name, state, health, borrowed, available] = await Promise.all([
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
              functionName: "getHealth",
              args: [BigInt(i), address],
            }),
            publicClient.readContract({
              address: ASETRA_ADDRESS,
              abi: ASETRA_ABI,
              functionName: "getBorrowedAmount",
              args: [BigInt(i), address],
            }),
            publicClient.readContract({
              address: ASETRA_ADDRESS,
              abi: ASETRA_ABI,
              functionName: "getAvailableCredit",
              args: [BigInt(i), address],
            }),
          ]);
          const p = pos as readonly [bigint, bigint, bigint, bigint, bigint, bigint, bigint, boolean];
          const h = health as readonly [bigint, boolean];
          if (p[7] && (p[0] > BigInt(0) || (borrowed as bigint) > BigInt(0))) {
            results.push({
              assetId: i,
              assetName: name as string,
              assetState: Number(state) as AssetState,
              collateralAmount: p[5],
              borrowedAmount: borrowed as bigint,
              healthFactor: h[0],
              healthy: h[1],
              availableCredit: available as bigint,
            });
          }
        } catch {
          /* skip */
        }
      }
      setAssets(results);
      if (results.length > 0 && selectedAsset === null) {
        setSelectedAsset(results[0].assetId);
      }
    } catch (e) {
      console.error("Failed to load borrow data:", e);
    } finally {
      setIsLoading(false);
    }
  }, [publicClient, address, selectedAsset]);

  useEffect(() => {
    if (isConnected) loadData();
    else setIsLoading(false);
  }, [isConnected, loadData]);

  useEffect(() => {
    if (isSuccess) {
      reset();
      setBorrowAmount("");
      loadData();
    }
  }, [isSuccess, reset, loadData]);

  const handleBorrow = async () => {
    if (selectedAsset === null || !borrowAmount) return;
    setTxError(null);
    try {
      await writeContractAsync({
        address: ASETRA_ADDRESS,
        abi: ASETRA_ABI,
        functionName: "borrow",
        args: [BigInt(selectedAsset), BigInt(borrowAmount) * BigInt(1e6)],
      });
    } catch (e) {
      setTxError(parseContractError(e));
    }
  };

  const handleRepay = async () => {
    if (selectedAsset === null || !publicClient) return;
    const asset = assets.find((a) => a.assetId === selectedAsset);
    if (!asset) return;
    setTxError(null);
    try {
      // Step 1: Approve tUSDT
      const approveHash = await writeContractAsync({
        address: TUSDT_ADDRESS,
        abi: TUSDT_ABI,
        functionName: "approve",
        args: [ASETRA_ADDRESS, asset.borrowedAmount],
      });

      // Step 2: Wait for approve to be mined
      const receipt = await publicClient.waitForTransactionReceipt({ hash: approveHash });
      if (receipt.status !== "success") {
        throw new Error("Approve transaction failed. Please try again.");
      }

      // Step 3: Repay (allowance is now set)
      await writeContractAsync({
        address: ASETRA_ADDRESS,
        abi: ASETRA_ABI,
        functionName: "repay",
        args: [BigInt(selectedAsset), asset.borrowedAmount],
      });
    } catch (e) {
      setTxError(parseContractError(e));
    }
  };

  const totalBorrowed = assets.reduce((a, b) => a + b.borrowedAmount, BigInt(0));
  const totalCredit = assets.reduce((a, b) => a + b.availableCredit, BigInt(0));
  const selectedPosition = assets.find((a) => a.assetId === selectedAsset);

  return (
    <RoleGuard allowed={["investor"]}>
    <AppLayout>
      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white font-sans">
              Credit &amp; Borrowing
            </h1>
            <span className="rounded-full bg-cyan-500/10 border border-cyan-500/20 px-2.5 py-0.5 text-xs font-mono font-medium text-cyan-400">
              DeFi Liquidity
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-400">
            Draw instant liquidity against verified real-world asset collateral positions.
          </p>
        </div>

        {isConnected && (
          <button
            onClick={loadData}
            disabled={isLoading}
            className="flex items-center gap-2 rounded-xl border border-white/[0.08] bg-slate-900/80 px-3.5 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition-all disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin text-cyan-400" : ""}`} />
            <span>Refresh State</span>
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
            Connect your wallet to inspect your available credit lines and borrow against collateral.
          </p>
        </div>
      ) : (
        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div key="skel" exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
              <BorrowSkeleton />
            </motion.div>
          ) : (
            <motion.div key="content" initial={{opacity:0, y:12}} animate={{opacity:1, y:0}} transition={{duration:0.35, ease:[0.16,1,0.3,1]}}>
          {/* Credit Overview Strip */}
          <div className="mb-8 grid gap-4 sm:grid-cols-3">
            <div className="web3-card rounded-2xl p-5">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-mono uppercase tracking-wider">Total Outstanding Debt</span>
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
                  <TrendingDown className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-3 text-3xl font-black font-mono text-amber-400">
                {formatUSD(totalBorrowed)}
              </div>
              <div className="mt-2 text-xs text-slate-400">Across all collateral positions</div>
            </div>

            <div className="web3-card rounded-2xl p-5">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-mono uppercase tracking-wider">Available Borrow Capacity</span>
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                  <DollarSign className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-3 text-3xl font-black font-mono text-cyan-400">
                {formatUSD(totalCredit)}
              </div>
              <div className="mt-2 text-xs text-slate-400">Backed by locked RWA tokens</div>
            </div>

            <div className="web3-card rounded-2xl p-5">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-mono uppercase tracking-wider">Collateral Vault</span>
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400">
                  <Shield className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-3 text-3xl font-black font-mono text-sky-300">
                {assets.length} Assets
              </div>
              <div className="mt-2 text-xs text-slate-400">
                <Link href="/app/collateral" className="text-cyan-400 hover:underline flex items-center gap-1">
                  <span>Manage Collateral Vault</span>
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </div>
          </div>

          {/* Interactive Borrow/Repay Terminal & Health Panel */}
          <div className="grid gap-6 lg:grid-cols-12">
            {/* Terminal Panel (Left - 7 cols) */}
            <div className="web3-card rounded-2xl p-6 lg:col-span-7">
              {/* Tab Switcher */}
              <div className="mb-6 flex rounded-xl border border-white/[0.08] bg-slate-950/80 p-1">
                <button
                  onClick={() => setTab("borrow")}
                  className={`flex-1 rounded-lg py-2 text-xs sm:text-sm font-bold font-mono transition-all ${
                    tab === "borrow"
                      ? "bg-cyan-400 text-slate-950 shadow-md shadow-cyan-500/20"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Borrow Liquidity
                </button>
                <button
                  onClick={() => setTab("repay")}
                  className={`flex-1 rounded-lg py-2 text-xs sm:text-sm font-bold font-mono transition-all ${
                    tab === "repay"
                      ? "bg-emerald-400 text-slate-950 shadow-md shadow-emerald-500/20"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Repay Debt
                </button>
              </div>

              <div className="space-y-4">
                {/* Position Select */}
                <div>
                  <label className="text-xs font-mono uppercase tracking-wider text-slate-400">
                    Select Collateralized Position
                  </label>
                  <select
                    value={selectedAsset ?? ""}
                    onChange={(e) => setSelectedAsset(e.target.value ? parseInt(e.target.value) : null)}
                    className="mt-1.5 w-full rounded-xl border border-white/[0.08] bg-slate-900 px-3.5 py-2.5 text-sm text-white focus:border-cyan-400 focus:outline-none"
                  >
                    <option value="" className="bg-slate-900 text-slate-400">
                      Select a position...
                    </option>
                    {assets.map((a) => (
                      <option key={a.assetId} value={a.assetId} className="bg-slate-900 text-white">
                        {a.assetName} (Collateral: {a.collateralAmount.toString()} tokens)
                      </option>
                    ))}
                  </select>
                </div>

                {/* Selected position details preview */}
                {selectedPosition && (
                  <div className="rounded-xl border border-white/[0.06] bg-slate-950/60 p-4 font-mono text-xs">
                    <div className="grid grid-cols-3 gap-3 text-center">
                      <div>
                        <div className="text-[10px] text-slate-500 uppercase">Available Credit</div>
                        <div className="mt-1 font-bold text-cyan-400 text-sm">
                          {formatUSD(selectedPosition.availableCredit)}
                        </div>
                      </div>
                      <div className="border-x border-white/[0.06]">
                        <div className="text-[10px] text-slate-500 uppercase">Current Debt</div>
                        <div className="mt-1 font-bold text-amber-400 text-sm">
                          {formatUSD(selectedPosition.borrowedAmount)}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-500 uppercase">Health Factor</div>
                        <div
                          className={`mt-1 font-bold text-sm ${
                            selectedPosition.healthFactor === BigInt(0)
                              ? "text-slate-400"
                              : selectedPosition.healthy
                              ? "text-emerald-400"
                              : "text-rose-400"
                          }`}
                        >
                          {selectedPosition.healthFactor === BigInt(0)
                            ? "No Debt"
                            : selectedPosition.healthFactor.toString()}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {tab === "borrow" ? (
                  <>
                    <div>
                      <div className="flex items-center justify-between text-xs font-mono">
                        <label className="text-slate-400 uppercase tracking-wider">
                          Borrow Amount (tUSDT)
                        </label>
                        {selectedPosition && (
                          <button
                            type="button"
                            onClick={() => setBorrowAmount((selectedPosition.availableCredit / BigInt(1e6)).toString())}
                            className="text-cyan-400 hover:underline font-bold"
                          >
                            Max Credit ({formatUSD(selectedPosition.availableCredit)})
                          </button>
                        )}
                      </div>
                      <input
                        type="number"
                        value={borrowAmount}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (!val) { setBorrowAmount(""); return; }
                          const max = selectedPosition ? Number(selectedPosition.availableCredit / BigInt(1e6)) : Infinity;
                          const num = Math.min(Math.max(0, Number(val)), max);
                          setBorrowAmount(String(num));
                        }}
                        placeholder="0"
                        className="mt-1.5 w-full rounded-xl border border-white/[0.08] bg-slate-900 px-4 py-3 font-mono text-base text-white placeholder:text-slate-600 focus:border-cyan-400 focus:outline-none"
                      />
                      <div className="mt-1.5 text-xs font-mono text-slate-400 flex justify-between">
                        <span>Your tUSDT Balance</span>
                        <span className="text-emerald-400 font-bold">{tusdtBalance !== undefined ? `${(Number(tusdtBalance) / 1e6).toFixed(2)} tUSDT` : "—"}</span>
                      </div>
                    </div>

                    <div className="pt-2">
                      <TxProgress step={isSuccess ? "confirmed" : isConfirming ? "pending" : isPending ? "waiting" : "idle"} />
                    </div>

                    <button
                      onClick={handleBorrow}
                      disabled={isPending || isConfirming || selectedAsset === null || !borrowAmount}
                      className="w-full rounded-xl bg-cyan-400 py-3 text-sm font-bold text-slate-950 shadow-md shadow-cyan-500/20 hover:bg-cyan-300 disabled:opacity-40 transition-all flex items-center justify-center gap-2"
                    >
                      {isPending || isConfirming ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <span>Execute Borrow</span>
                      )}
                    </button>
                  </>
                ) : (
                  <>
                    {selectedPosition && (
                      <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 font-mono text-xs">
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-slate-300">Debt To Repay</span>
                          <span className="font-extrabold text-emerald-300">
                            {formatUSD(selectedPosition.borrowedAmount)}
                          </span>
                        </div>
                        <p className="mt-2 text-[11px] text-slate-400 font-sans">
                          Repaying your outstanding debt unlocks collateral back to your position.
                        </p>
                      </div>
                    )}

                    <button
                      onClick={handleRepay}
                      disabled={
                        isPending ||
                        isConfirming ||
                        selectedAsset === null ||
                        !selectedPosition ||
                        selectedPosition.borrowedAmount <= BigInt(0)
                      }
                      className="w-full rounded-xl bg-emerald-400 py-3 text-sm font-bold text-slate-950 shadow-md shadow-emerald-500/20 hover:bg-emerald-300 disabled:opacity-40 transition-all flex items-center justify-center gap-2"
                    >
                      {isPending || isConfirming ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <span>Repay Full Debt</span>
                      )}
                    </button>
                  </>
                )}

                {/* Error Banner */}
                {(txError || isError) && (
                  <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3.5 text-xs text-rose-300 flex items-start gap-2.5">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" />
                    <span>{txError || parseContractError(error)}</span>
                  </div>
                )}

                {/* Success Banner */}
                {isSuccess && (
                  <TxSuccessBanner
                    txHash={txHash || null}
                    onDismiss={() => reset()}
                    message="Credit facility transaction confirmed on Bohr Chain!"
                  />
                )}
              </div>
            </div>

            {/* Position Health Cards (Right - 5 cols) */}
            <div className="space-y-4 lg:col-span-5">
              <div className="web3-card rounded-2xl p-5">
                <div className="mb-4 flex items-center justify-between border-b border-white/[0.06] pb-3">
                  <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400">
                    Collateral Positions
                  </h3>
                  <span className="text-xs font-mono text-slate-500">{assets.length} Active</span>
                </div>

                {assets.length === 0 ? (
                  <div className="text-center py-8">
                    <Shield className="mx-auto mb-2 h-8 w-8 text-slate-600" />
                    <p className="text-xs text-slate-400">No positions with collateral found.</p>
                    <Link
                      href="/app/collateral"
                      className="mt-3 inline-flex items-center gap-1 text-xs text-cyan-400 hover:underline"
                    >
                      <span>Deposit Collateral</span>
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {assets.map((a) => {
                      const isSelected = selectedAsset === a.assetId;
                      return (
                        <div
                          key={a.assetId}
                          onClick={() => setSelectedAsset(a.assetId)}
                          className={`cursor-pointer rounded-xl border p-3.5 transition-all ${
                            isSelected
                              ? "border-cyan-400/50 bg-cyan-500/[0.06]"
                              : "border-white/[0.06] bg-slate-900/60 hover:border-white/[0.15]"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="font-bold text-sm text-white">{a.assetName}</div>
                            <div
                              className={`flex items-center gap-1 text-xs font-mono font-semibold ${
                                a.healthy ? "text-emerald-400" : "text-rose-400"
                              }`}
                            >
                              {a.healthy ? (
                                <CheckCircle2 className="h-3.5 w-3.5" />
                              ) : (
                                <AlertTriangle className="h-3.5 w-3.5" />
                              )}
                              <span>Health: {a.healthFactor === BigInt(0) ? "No Debt" : a.healthFactor.toString()}</span>
                            </div>
                          </div>

                          <div className="mt-3 grid grid-cols-3 gap-2 font-mono text-xs">
                            <div>
                              <div className="text-[10px] text-slate-500">Locked Tokens</div>
                              <div className="text-slate-200">{a.collateralAmount.toString()}</div>
                            </div>
                            <div>
                              <div className="text-[10px] text-slate-500">Borrowed</div>
                              <div className="text-amber-400">{formatUSD(a.borrowedAmount)}</div>
                            </div>
                            <div>
                              <div className="text-[10px] text-slate-500">Credit Limit</div>
                              <div className="text-cyan-400">{formatUSD(a.availableCredit)}</div>
                            </div>
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
        </AnimatePresence>
      )}
    </AppLayout>
    </RoleGuard>
  );
}
