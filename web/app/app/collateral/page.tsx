"use client";

import { useState, useEffect, useCallback } from "react";
import { useAccount, usePublicClient } from "wagmi";
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { AppLayout } from "@/components/layout/AppLayout";
import { ASSETFLOW_ABI, ASSETFLOW_ADDRESS } from "@/config/contracts";
import { formatUSD } from "@/lib/utils/format";
import { parseContractError } from "@/lib/utils/errors";
import { TxSuccessBanner } from "@/components/ui/TxSuccessBanner";
import { TxProgress } from "@/components/ui/TxProgress";
import { RoleGuard } from "@/components/role/RoleGuard";
import { ASSET_STATE_LABELS, type AssetState } from "@/types/asset";
import {
  Shield,
  ArrowDownToLine,
  ArrowUpFromLine,
  Loader2,
  Wallet,
  AlertCircle,
  RefreshCw,
  Lock,
  Unlock,
} from "lucide-react";
import Link from "next/link";
import { CollateralSkeleton } from "@/components/skeleton/PageSkeletons";
import { motion, AnimatePresence } from "framer-motion";

interface PositionWithCollateral {
  assetId: number;
  assetName: string;
  assetState: AssetState;
  amount: bigint;
  collateralAmount: bigint;
  active: boolean;
  faceValue: bigint;
  tokenSupply: bigint;
}

export default function CollateralPage() {
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const [positions, setPositions] = useState<PositionWithCollateral[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [selectedAsset, setSelectedAsset] = useState<number | null>(null);
  const [depositAmount, setDepositAmount] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [tab, setTab] = useState<"deposit" | "withdraw">("deposit");
  const [txError, setTxError] = useState<string | null>(null);

  const { writeContractAsync, data: txHash, isPending, reset } = useWriteContract();
  const { isLoading: isConfirming, isSuccess, isError: rcptIsError, error: rcptError } = useWaitForTransactionReceipt({ hash: txHash });

  const isError = rcptIsError;
  const error = rcptError;

  const loadPositions = useCallback(async () => {
    if (!publicClient || !address) return;
    setIsLoading(true);
    try {
      const countResult = await publicClient.readContract({
        address: ASSETFLOW_ADDRESS,
        abi: ASSETFLOW_ABI,
        functionName: "getAssetCount",
      });
      const total = Number(countResult);
      const results: PositionWithCollateral[] = [];

      for (let i = 0; i < total; i++) {
        try {
          const [pos, name, state, faceValue, tokenSupply] = await Promise.all([
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
          const p = pos as readonly [bigint, bigint, bigint, bigint, bigint, bigint, boolean];
          if (p[6] && p[0] > BigInt(0)) {
            results.push({
              assetId: i,
              assetName: name as string,
              assetState: Number(state) as AssetState,
              amount: p[0],
              collateralAmount: p[5],
              active: p[6],
              faceValue: faceValue as bigint,
              tokenSupply: tokenSupply as bigint,
            });
          }
        } catch {
          /* skip */
        }
      }
      setPositions(results);
      if (results.length > 0 && selectedAsset === null) {
        setSelectedAsset(results[0].assetId);
      }
    } catch (e) {
      console.error("Failed to load positions:", e);
    } finally {
      setIsLoading(false);
    }
  }, [publicClient, address, selectedAsset]);

  useEffect(() => {
    if (isConnected) loadPositions();
    else setIsLoading(false);
  }, [isConnected, loadPositions]);

  useEffect(() => {
    if (isSuccess) {
      reset();
      setDepositAmount("");
      setWithdrawAmount("");
      loadPositions();
    }
  }, [isSuccess, reset, loadPositions]);

  const handleDeposit = async () => {
    if (selectedAsset === null || !depositAmount) return;
    setTxError(null);
    try {
      await writeContractAsync({
        address: ASSETFLOW_ADDRESS,
        abi: ASSETFLOW_ABI,
        functionName: "depositCollateral",
        args: [BigInt(selectedAsset), BigInt(depositAmount)],
      });
    } catch (e) {
      setTxError(parseContractError(e));
    }
  };

  const handleWithdraw = async () => {
    if (selectedAsset === null || !withdrawAmount) return;
    setTxError(null);
    try {
      await writeContractAsync({
        address: ASSETFLOW_ADDRESS,
        abi: ASSETFLOW_ABI,
        functionName: "withdrawCollateral",
        args: [BigInt(selectedAsset), BigInt(withdrawAmount)],
      });
    } catch (e) {
      setTxError(parseContractError(e));
    }
  };

  const totalCollateralTokens = positions.reduce((a, p) => a + p.collateralAmount, BigInt(0));
  const totalCollateralUsd = positions.reduce((a, p) => {
    if (p.tokenSupply > BigInt(0)) {
      return a + (p.collateralAmount * p.faceValue) / p.tokenSupply;
    }
    return a;
  }, BigInt(0));

  const selectedPosition = positions.find((p) => p.assetId === selectedAsset);
  const freeTokens = selectedPosition ? selectedPosition.amount - selectedPosition.collateralAmount : BigInt(0);

  return (
    <RoleGuard allowed={["investor"]}>
    <AppLayout>
      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white font-sans">
              Collateral Vault
            </h1>
            <span className="rounded-full bg-sky-500/10 border border-sky-500/20 px-2.5 py-0.5 text-xs font-mono font-medium text-sky-400">
              Risk Engine
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-400">
            Lock verified RWA tokens as credit collateral to unlock borrowing facilities.
          </p>
        </div>

        {isConnected && (
          <button
            onClick={loadPositions}
            disabled={isLoading}
            className="flex items-center gap-2 rounded-xl border border-white/[0.08] bg-slate-900/80 px-3.5 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition-all disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin text-cyan-400" : ""}`} />
            <span>Refresh Vault</span>
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
            Connect your wallet to deposit or withdraw collateral positions.
          </p>
        </div>
      ) : (
        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div key="skel" exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
              <CollateralSkeleton />
            </motion.div>
          ) : (
            <motion.div key="content" initial={{opacity:0, y:12}} animate={{opacity:1, y:0}} transition={{duration:0.35, ease:[0.16,1,0.3,1]}}>
          {/* Collateral Metrics */}
          <div className="mb-8 grid gap-4 sm:grid-cols-2">
            <div className="web3-card rounded-2xl p-5">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-mono uppercase tracking-wider">Total Value Locked In Vault</span>
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400">
                  <Shield className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-3 text-3xl font-black font-mono text-sky-300">
                {formatUSD(totalCollateralUsd)}
              </div>
              <div className="mt-2 text-xs font-mono text-slate-400">
                {totalCollateralTokens.toString()} total tokens committed
              </div>
            </div>

            <div className="web3-card rounded-2xl p-5">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-mono uppercase tracking-wider">Active Collateral Positions</span>
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                  <Lock className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-3 text-3xl font-black font-mono text-white">
                {positions.filter((p) => p.collateralAmount > BigInt(0)).length} Assets
              </div>
              <div className="mt-2 text-xs text-slate-400">
                <span>Available to secure loans in Borrow facility</span>
              </div>
            </div>
          </div>

          {/* Interactive Vault Management */}
          <div className="grid gap-6 lg:grid-cols-12">
            {/* Action Panel (Left - 7 cols) */}
            <div className="web3-card rounded-2xl p-6 lg:col-span-7">
              {/* Tab Switcher */}
              <div className="mb-6 flex rounded-xl border border-white/[0.08] bg-slate-950/80 p-1">
                <button
                  onClick={() => setTab("deposit")}
                  className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs sm:text-sm font-bold font-mono transition-all ${
                    tab === "deposit"
                      ? "bg-cyan-400 text-slate-950 shadow-md shadow-cyan-500/20"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <ArrowDownToLine className="h-4 w-4" />
                  <span>Lock Collateral</span>
                </button>
                <button
                  onClick={() => setTab("withdraw")}
                  className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs sm:text-sm font-bold font-mono transition-all ${
                    tab === "withdraw"
                      ? "bg-amber-400 text-slate-950 shadow-md shadow-amber-500/20"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <ArrowUpFromLine className="h-4 w-4" />
                  <span>Withdraw Collateral</span>
                </button>
              </div>

              <div className="space-y-4">
                {/* Position Select */}
                <div>
                  <label className="text-xs font-mono uppercase tracking-wider text-slate-400">
                    Select RWA Position
                  </label>
                  <select
                    value={selectedAsset ?? ""}
                    onChange={(e) => setSelectedAsset(e.target.value ? parseInt(e.target.value) : null)}
                    className="mt-1.5 w-full rounded-xl border border-white/[0.08] bg-slate-900 px-3.5 py-2.5 text-sm text-white focus:border-cyan-400 focus:outline-none"
                  >
                    <option value="" className="bg-slate-900 text-slate-400">
                      Choose an asset position...
                    </option>
                    {positions.map((p) => (
                      <option key={p.assetId} value={p.assetId} className="bg-slate-900 text-white">
                        {p.assetName} (Total: {p.amount.toString()} | Locked: {p.collateralAmount.toString()})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Selected position breakdown */}
                {selectedPosition && (
                  <div className="rounded-xl border border-white/[0.06] bg-slate-950/60 p-4 font-mono text-xs">
                    <div className="grid grid-cols-3 gap-3 text-center">
                      <div>
                        <div className="text-[10px] text-slate-500 uppercase">Total Tokens</div>
                        <div className="mt-1 font-bold text-white text-sm">
                          {selectedPosition.amount.toString()}
                        </div>
                      </div>
                      <div className="border-x border-white/[0.06]">
                        <div className="text-[10px] text-slate-500 uppercase">Available Free</div>
                        <div className="mt-1 font-bold text-emerald-400 text-sm">
                          {freeTokens.toString()}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-500 uppercase">Locked Collateral</div>
                        <div className="mt-1 font-bold text-sky-400 text-sm">
                          {selectedPosition.collateralAmount.toString()}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {tab === "deposit" ? (
                  <>
                    <div>
                      <div className="flex items-center justify-between text-xs font-mono">
                        <label className="text-slate-400 uppercase tracking-wider">
                          Amount To Deposit (Tokens)
                        </label>
                        {selectedPosition && (
                          <button
                            type="button"
                            onClick={() => setDepositAmount(freeTokens.toString())}
                            className="text-cyan-400 hover:underline font-bold"
                          >
                            Max ({freeTokens.toString()})
                          </button>
                        )}
                      </div>
                      <input
                        type="number"
                        value={depositAmount}
                        onChange={(e) => setDepositAmount(e.target.value)}
                        placeholder="0"
                        className="mt-1.5 w-full rounded-xl border border-white/[0.08] bg-slate-900 px-4 py-3 font-mono text-base text-white placeholder:text-slate-600 focus:border-cyan-400 focus:outline-none"
                      />
                    </div>

                    <div className="pt-2">
                      <TxProgress step={isSuccess ? "confirmed" : isConfirming ? "pending" : isPending ? "waiting" : "idle"} />
                    </div>

                    <button
                      onClick={handleDeposit}
                      disabled={isPending || isConfirming || selectedAsset === null || !depositAmount}
                      className="w-full rounded-xl bg-cyan-400 py-3 text-sm font-bold text-slate-950 shadow-md shadow-cyan-500/20 hover:bg-cyan-300 disabled:opacity-40 transition-all flex items-center justify-center gap-2"
                    >
                      {isPending || isConfirming ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <span>Lock In Vault</span>
                      )}
                    </button>
                  </>
                ) : (
                  <>
                    <div>
                      <div className="flex items-center justify-between text-xs font-mono">
                        <label className="text-slate-400 uppercase tracking-wider">
                          Amount To Withdraw (Tokens)
                        </label>
                        {selectedPosition && (
                          <button
                            type="button"
                            onClick={() => setWithdrawAmount(selectedPosition.collateralAmount.toString())}
                            className="text-amber-400 hover:underline font-bold"
                          >
                            Max ({selectedPosition.collateralAmount.toString()})
                          </button>
                        )}
                      </div>
                      <input
                        type="number"
                        value={withdrawAmount}
                        onChange={(e) => setWithdrawAmount(e.target.value)}
                        placeholder="0"
                        className="mt-1.5 w-full rounded-xl border border-white/[0.08] bg-slate-900 px-4 py-3 font-mono text-base text-white placeholder:text-slate-600 focus:border-amber-400 focus:outline-none"
                      />
                    </div>

                    <button
                      onClick={handleWithdraw}
                      disabled={isPending || isConfirming || selectedAsset === null || !withdrawAmount}
                      className="w-full rounded-xl bg-amber-400 py-3 text-sm font-bold text-slate-950 shadow-md shadow-amber-500/20 hover:bg-amber-300 disabled:opacity-40 transition-all flex items-center justify-center gap-2"
                    >
                      {isPending || isConfirming ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <span>Release Collateral</span>
                      )}
                    </button>
                  </>
                )}

                {/* Error Banner */}
                {(txError || isError) && (
                  <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3.5 text-xs text-rose-300 flex items-start gap-2.5">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" />
                    <span>{txError || parseContractError(error)}</span>
                  </div>
                )}

                {/* Success Banner */}
                {isSuccess && (
                  <TxSuccessBanner
                    txHash={txHash || null}
                    onDismiss={() => reset()}
                    message="Vault collateral position updated successfully!"
                  />
                )}
              </div>
            </div>

            {/* Position Vault Cards (Right - 5 cols) */}
            <div className="space-y-4 lg:col-span-5">
              <div className="web3-card rounded-2xl p-5">
                <div className="mb-4 flex items-center justify-between border-b border-white/[0.06] pb-3">
                  <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400">
                    Vault Position List
                  </h3>
                  <span className="text-xs font-mono text-slate-500">{positions.length} Total</span>
                </div>

                {positions.length === 0 ? (
                  <div className="text-center py-8">
                    <Shield className="mx-auto mb-2 h-8 w-8 text-slate-600" />
                    <p className="text-xs text-slate-400">No tokenized positions available.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {positions.map((p) => {
                      const isSelected = selectedAsset === p.assetId;
                      const hasCollateral = p.collateralAmount > BigInt(0);
                      return (
                        <div
                          key={p.assetId}
                          onClick={() => setSelectedAsset(p.assetId)}
                          className={`cursor-pointer rounded-xl border p-3.5 transition-all ${
                            isSelected
                              ? "border-cyan-400/50 bg-cyan-500/[0.06]"
                              : "border-white/[0.06] bg-slate-900/60 hover:border-white/[0.15]"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="font-bold text-sm text-white">{p.assetName}</div>
                            <span
                              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-mono font-semibold ${
                                hasCollateral
                                  ? "bg-sky-500/15 text-sky-300 border border-sky-500/30"
                                  : "bg-slate-800 text-slate-400"
                              }`}
                            >
                              {hasCollateral ? <Lock className="h-3 w-3" /> : <Unlock className="h-3 w-3" />}
                              <span>{hasCollateral ? "Locked" : "Unbonded"}</span>
                            </span>
                          </div>

                          <div className="mt-3 grid grid-cols-2 gap-2 font-mono text-xs">
                            <div>
                              <div className="text-[10px] text-slate-500">Holdings</div>
                              <div className="text-slate-200">{p.amount.toString()} tokens</div>
                            </div>
                            <div>
                              <div className="text-[10px] text-slate-500">Collateralized</div>
                              <div className="text-sky-400 font-bold">{p.collateralAmount.toString()} tokens</div>
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
