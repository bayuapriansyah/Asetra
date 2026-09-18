"use client";

import { useState, useEffect, useCallback } from "react";
import { useAccount, usePublicClient } from "wagmi";
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { AppLayout } from "@/components/layout/AppLayout";
import { ASETRA_ABI, TUSDT_ABI } from "@/config/contracts";
import { useAsetraAddress, useTusdtAddress } from "@/hooks/useContractAddresses";
import { formatUSD, shortenAddress, calcTokenCost } from "@/lib/utils/format";
import { parseContractError } from "@/lib/utils/errors";
import { TxSuccessBanner } from "@/components/ui/TxSuccessBanner";
import { TxProgress } from "@/components/ui/TxProgress";
import { RoleGuard } from "@/components/role/RoleGuard";
import {
  Loader2,
  Wallet,
  AlertCircle,
  RefreshCw,
  Plus,
  X,
  ShoppingCart,
  ArrowLeftRight,
  Tag,
  User,
} from "lucide-react";
import Link from "next/link";
import { TradingSkeleton } from "@/components/skeleton/PageSkeletons";
import { motion, AnimatePresence } from "framer-motion";

interface SellOrderData {
  orderId: bigint;
  assetId: bigint;
  seller: `0x${string}`;
  amount: bigint;
  pricePerUnit: bigint;
  active: boolean;
  createdAt: bigint;
  assetName: string;
}

interface UserPosition {
  assetId: number;
  assetName: string;
  amount: bigint;
  availableUnits: bigint;
  pricePerUnit: bigint;
}

export default function TradingPage() {
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const ASETRA_ADDRESS = useAsetraAddress();
  const TUSDT_ADDRESS = useTusdtAddress();
  const [orders, setOrders] = useState<SellOrderData[]>([]);
  const [userPositions, setUserPositions] = useState<UserPosition[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const [showCreate, setShowCreate] = useState(false);
  const [createAssetId, setCreateAssetId] = useState("");
  const [createAmount, setCreateAmount] = useState("");
  const [createPrice, setCreatePrice] = useState("");
  const [createPriceDisplay, setCreatePriceDisplay] = useState("");
  const [buyUnits, setBuyUnits] = useState<{ [key: string]: string }>({});
  const [txError, setTxError] = useState<string | null>(null);

  const { writeContractAsync, data: txHash, isPending, reset } = useWriteContract();
  const { isLoading: isConfirming, isSuccess, isError: rcptIsError, error: rcptError } = useWaitForTransactionReceipt({ hash: txHash });

  const isError = rcptIsError;
  const error = rcptError;

  const loadOrders = useCallback(async () => {
    if (!publicClient || !address) return;
    setIsLoading(true);
    try {
      const countResult = await publicClient.readContract({
        address: ASETRA_ADDRESS,
        abi: ASETRA_ABI,
        functionName: "getAssetCount",
      });
      const total = Number(countResult);
      const results: SellOrderData[] = [];
      const positions: UserPosition[] = [];

      // Load user positions
      for (let i = 0; i < total; i++) {
        try {
          const [pos, name, state, faceValue, tokenSupply] = await Promise.all([
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
              functionName: "assetFaceValue",
              args: [BigInt(i)],
            }),
            publicClient.readContract({
              address: ASETRA_ADDRESS,
              abi: ASETRA_ABI,
              functionName: "assetTokenSupply",
              args: [BigInt(i)],
            }),
          ]);
          const p = pos as readonly [bigint, bigint, bigint, bigint, bigint, bigint, bigint, boolean];
          // p[0]=amount, p[5]=collateralAmount, p[7]=active
          if (p[7] && p[0] > BigInt(0)) {
            const available = p[0] - p[5];
            const pricePerUnit = tokenSupply as bigint > BigInt(0)
              ? (faceValue as bigint) / (tokenSupply as bigint)
              : BigInt(0);
            positions.push({
              assetId: i,
              assetName: name as string,
              amount: p[0],
              availableUnits: available,
              pricePerUnit,
            });
          }
        } catch {
          /* skip */
        }
      }
      setUserPositions(positions);

      // Load sell orders
      for (let orderId = 1; orderId <= 100; orderId++) {
        try {
          const raw = (await publicClient.readContract({
            address: ASETRA_ADDRESS,
            abi: ASETRA_ABI,
            functionName: "getSellOrder",
            args: [BigInt(orderId)],
          })) as unknown as readonly [bigint, bigint, `0x${string}`, bigint, bigint, boolean, bigint];
          if (raw[5] && raw[0] > BigInt(0)) {
            let assetName = "Unknown";
            try {
              const name = await publicClient.readContract({
                address: ASETRA_ADDRESS,
                abi: ASETRA_ABI,
                functionName: "assetName",
                args: [raw[1]],
              });
              assetName = name as string;
            } catch {
              /* skip */
            }
            results.push({
              orderId: raw[0],
              assetId: raw[1],
              seller: raw[2],
              amount: raw[3],
              pricePerUnit: raw[4],
              active: raw[5],
              createdAt: raw[6],
              assetName,
            });
          }
        } catch {
          break;
        }
      }
      setOrders(results);
    } catch (e) {
      console.error("Failed to load orders:", e);
    } finally {
      setIsLoading(false);
    }
  }, [publicClient, address]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  useEffect(() => {
    if (isSuccess) {
      reset();
      setShowCreate(false);
      setCreateAssetId("");
      setCreateAmount("");
      setCreatePrice("");
      setCreatePriceDisplay("");
      loadOrders();
    }
  }, [isSuccess, reset, loadOrders]);

  const handleCreateOrder = async () => {
    if (!createAssetId || !createAmount || !createPrice) return;
    setTxError(null);

    // Validate amount doesn't exceed available
    const pos = userPositions.find((p) => p.assetId === Number(createAssetId));
    if (pos && BigInt(createAmount) > pos.availableUnits) {
      setTxError("Sell amount exceeds available token balance");
      return;
    }

    try {
      if (publicClient) {
        const stateResult = await publicClient.readContract({
          address: ASETRA_ADDRESS,
          abi: ASETRA_ABI,
          functionName: "assetState",
          args: [BigInt(createAssetId)],
        });
        const stateNum = Number(stateResult);
        if (stateNum < 2 || stateNum > 3) {
          setTxError("Asset must be TOKENIZED or LISTED to create a sell order");
          return;
        }
      }
      await writeContractAsync({
        address: ASETRA_ADDRESS,
        abi: ASETRA_ABI,
        functionName: "createSellOrder",
        args: [BigInt(createAssetId), BigInt(createAmount), BigInt(createPrice)],
      });
      setCreateAssetId("");
      setCreateAmount("");
      setCreatePrice("");
      setCreatePriceDisplay("");
    } catch (e) {
      setTxError(parseContractError(e));
    }
  };

  const handleBuy = async (orderId: number, units: string) => {
    const order = orders.find((o) => o.orderId === BigInt(orderId));
    if (!order || !units || !publicClient) return;
    const totalCost = calcTokenCost(order.pricePerUnit, parseInt(units));
    setTxError(null);
    try {
      // Step 1: Approve tUSDT
      const approveHash = await writeContractAsync({
        address: TUSDT_ADDRESS,
        abi: TUSDT_ABI,
        functionName: "approve",
        args: [ASETRA_ADDRESS, totalCost],
      });

      // Step 2: Wait for approve to be mined
      const receipt = await publicClient.waitForTransactionReceipt({ hash: approveHash });
      if (receipt.status !== "success") {
        throw new Error("Approve transaction failed. Please try again.");
      }

      // Step 3: Execute trade (allowance is now set)
      await writeContractAsync({
        address: ASETRA_ADDRESS,
        abi: ASETRA_ABI,
        functionName: "executeTrade",
        args: [BigInt(orderId), BigInt(units)],
      });
    } catch (e) {
      setTxError(parseContractError(e));
    }
  };

  const handleCancel = async (orderId: number) => {
    setTxError(null);
    try {
      await writeContractAsync({
        address: ASETRA_ADDRESS,
        abi: ASETRA_ABI,
        functionName: "cancelSellOrder",
        args: [BigInt(orderId)],
      });
    } catch (e) {
      setTxError(parseContractError(e));
    }
  };

  const myOrders = orders.filter((o) => address && o.seller.toLowerCase() === address.toLowerCase());
  const otherOrders = orders.filter((o) => !address || o.seller.toLowerCase() !== address.toLowerCase());

  return (
    <RoleGuard allowed={["investor"]}>
    <AppLayout>
      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white font-sans">
              Secondary P2P Market
            </h1>
            <span className="rounded-full bg-cyan-500/10 border border-cyan-500/20 px-2.5 py-0.5 text-xs font-mono font-medium text-cyan-400">
              P2P Trading
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-400">
            Trustless peer-to-peer secondary market for fractional RWA tokenized positions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isConnected && (
            <button
              onClick={loadOrders}
              disabled={isLoading}
              className="flex items-center gap-2 rounded-xl border border-white/[0.08] bg-slate-900/80 px-3.5 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition-all disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin text-cyan-400" : ""}`} />
              <span>Refresh</span>
            </button>
          )}

          {isConnected && (
            <button
              onClick={() => setShowCreate(!showCreate)}
              className="flex items-center gap-1.5 rounded-xl bg-cyan-400 px-4 py-2 text-xs sm:text-sm font-bold text-slate-950 shadow-md shadow-cyan-500/20 hover:bg-cyan-300 transition-all"
            >
              <Plus className="h-4 w-4" />
              <span>{showCreate ? "Close Form" : "Create Sell Order"}</span>
            </button>
          )}
        </div>
      </div>

      {!mounted || !isConnected ? (
        <div className="web3-card rounded-2xl p-12 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
            <Wallet className="h-7 w-7" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Connect Your Wallet</h3>
          <p className="text-sm text-slate-400 max-w-sm mx-auto mb-4">
            Connect your wallet to browse active order book listings and trade tokens peer-to-peer.
          </p>
        </div>
      ) : (
        <motion.div initial={{opacity:0, y:12}} animate={{opacity:1, y:0}} transition={{duration:0.35, ease:[0.16,1,0.3,1]}}>
          {/* Create Sell Order Drawer */}
          {showCreate && (
            <div className="web3-card mb-8 rounded-2xl p-6 animate-slide-up border-cyan-500/30">
              <div className="mb-4 flex items-center justify-between border-b border-white/[0.06] pb-3">
                <div className="flex items-center gap-2">
                  <Tag className="h-4 w-4 text-cyan-400" />
                  <h3 className="font-bold text-white text-base">New Secondary Sell Order</h3>
                </div>
                <button
                  onClick={() => setShowCreate(false)}
                  className="rounded-lg p-1 text-slate-400 hover:text-white hover:bg-white/[0.05]"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label className="text-xs font-mono uppercase tracking-wider text-slate-400">
                    Select Asset
                  </label>
                  <select
                    value={createAssetId}
                    onChange={(e) => setCreateAssetId(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-white/[0.08] bg-slate-900 px-4 py-2.5 font-mono text-sm text-white focus:border-cyan-400 focus:outline-none"
                  >
                    <option value="">Select Asset</option>
                    {userPositions.map((p) => (
                      <option key={p.assetId} value={p.assetId}>
                        {p.assetName} — {p.availableUnits.toString()} units
                      </option>
                    ))}
                  </select>
                  {userPositions.length === 0 && (
                    <p className="mt-1 text-[11px] text-slate-500">No tokens held. Buy from marketplace first.</p>
                  )}
                </div>

                <div>
                  <label className="text-xs font-mono uppercase tracking-wider text-slate-400">
                    Token Units To Sell
                  </label>
                  <div className="mt-1.5 flex gap-2">
                    <input
                      type="number"
                      value={createAmount}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (!val) { setCreateAmount(""); return; }
                        const pos = userPositions.find((p) => p.assetId === Number(createAssetId));
                        const max = pos ? Number(pos.availableUnits) : Infinity;
                        const num = Math.min(Math.max(1, Number(val)), max);
                        setCreateAmount(String(num));
                      }}
                      placeholder={createAssetId ? "0" : "Select asset first"}
                      min="1"
                      disabled={!createAssetId}
                      className="flex-1 rounded-xl border border-white/[0.08] bg-slate-900 px-4 py-2.5 font-mono text-sm text-white focus:border-cyan-400 focus:outline-none disabled:opacity-40 disabled:cursor-not-allowed"
                    />
                    {createAssetId && userPositions.find((p) => p.assetId === Number(createAssetId)) && (
                      <button
                        type="button"
                        onClick={() => {
                          const pos = userPositions.find((p) => p.assetId === Number(createAssetId));
                          if (pos) setCreateAmount(pos.availableUnits.toString());
                        }}
                        className="shrink-0 rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-3 py-2.5 text-xs font-bold text-cyan-400 hover:bg-cyan-500/20 transition-all"
                      >
                        MAX
                      </button>
                    )}
                  </div>
                  {createAssetId && userPositions.find((p) => p.assetId === Number(createAssetId)) && (
                    <p className="mt-1 text-[11px] text-slate-500">
                      Available: {userPositions.find((p) => p.assetId === Number(createAssetId))?.availableUnits.toString()} units
                    </p>
                  )}
                  {createAssetId && createAmount && Number(createAmount) > Number(userPositions.find((p) => p.assetId === Number(createAssetId))?.availableUnits || BigInt(0)) && (
                    <p className="mt-1 text-[11px] text-rose-400">
                      Exceeds available balance
                    </p>
                  )}
                </div>

                <div>
                  <label className="text-xs font-mono uppercase tracking-wider text-slate-400">
                    Price Per Unit (tUSDT)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={createPriceDisplay}
                    onChange={(e) => {
                      const display = e.target.value;
                      setCreatePriceDisplay(display);
                      const num = parseFloat(display || "0");
                      const wei = BigInt(Math.round(num * 1_000_000));
                      setCreatePrice(wei.toString());
                    }}
                    placeholder="e.g. 10.50"
                    min="0.01"
                    className="mt-1.5 w-full rounded-xl border border-white/[0.08] bg-slate-900 px-4 py-2.5 font-mono text-sm text-white focus:border-cyan-400 focus:outline-none"
                  />
                  {createAssetId && userPositions.length > 0 && (
                    <p className="mt-1 text-[11px] text-slate-500">
                      Original: {formatUSD(userPositions.find((p) => p.assetId === Number(createAssetId))?.pricePerUnit ?? BigInt(0))}
                    </p>
                  )}
                </div>
              </div>

              {/* Error Banner */}
              {(txError || isError) && (
                <div className="mt-4 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3.5 text-xs text-rose-300 flex items-start gap-2.5">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" />
                  <span>{txError || parseContractError(error)}</span>
                </div>
              )}

              {/* Success Banner */}
              {isSuccess && (
                <div className="mt-4">
                  <TxSuccessBanner
                    txHash={txHash || null}
                    onDismiss={() => reset()}
                    message="Sell order published to secondary orderbook!"
                  />
                </div>
              )}

              <div className="mt-4">
                <TxProgress step={isSuccess ? "confirmed" : isConfirming ? "pending" : isPending ? "waiting" : "idle"} />
                <div className="mt-2 flex justify-end">
                  <button
                    onClick={handleCreateOrder}
                    disabled={isPending || isConfirming || !createAssetId || !createAmount || !createPrice || (createAssetId ? BigInt(createAmount || "0") > (userPositions.find((p) => p.assetId === Number(createAssetId))?.availableUnits || BigInt(0)) : false)}
                    className="rounded-xl bg-cyan-400 px-6 py-2.5 text-xs sm:text-sm font-bold text-slate-950 shadow-md shadow-cyan-500/20 hover:bg-cyan-300 disabled:opacity-40 transition-all flex items-center gap-2"
                  >
                    {isPending || isConfirming ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <span>Publish Order</span>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div key="skel" exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
              <TradingSkeleton />
            </motion.div>
          ) : orders.length === 0 ? (
            <div className="web3-card rounded-2xl p-16 text-center">
              <ShoppingCart className="mx-auto mb-3 h-12 w-12 text-slate-600" />
              <h3 className="text-lg font-bold text-white mb-1">Orderbook Empty</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto mb-4">
                There are currently no active sell orders on the secondary market. Be the first to create one!
              </p>
            </div>
          ) : (
            <div className="space-y-8">
              {/* My Orders */}
              {myOrders.length > 0 && (
                <div>
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400">
                      My Open Sell Orders
                    </h3>
                    <span className="text-xs font-mono text-cyan-400">{myOrders.length} Listed</span>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {myOrders.map((o) => (
                      <div
                        key={o.orderId.toString()}
                        className="web3-card rounded-xl p-4 flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="rounded-md bg-slate-800 border border-white/[0.08] px-1.5 py-0.5 text-[10px] font-mono text-cyan-400">
                              Order #{o.orderId.toString()}
                            </span>
                            <span className="rounded-full bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 text-[10px] font-mono text-amber-300">
                              Active
                            </span>
                          </div>

                          <div className="font-bold text-white text-sm">{o.assetName}</div>
                          <div className="mt-2 grid grid-cols-2 gap-2 text-xs font-mono">
                            <div>
                              <div className="text-[10px] text-slate-500">Units</div>
                              <div className="font-bold text-slate-200">{o.amount.toString()}</div>
                            </div>
                            <div>
                              <div className="text-[10px] text-slate-500">Price / Unit</div>
                              <div className="font-bold text-white">
                                {formatUSD(o.pricePerUnit ?? BigInt(0))}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="mt-4 pt-3 border-t border-white/[0.06] flex justify-end">
                          <button
                            onClick={() => handleCancel(Number(o.orderId))}
                            disabled={isPending || isConfirming}
                            className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-1.5 text-xs font-semibold text-rose-300 hover:bg-rose-500/20 transition-all flex items-center gap-1"
                          >
                            <X className="h-3 w-3" />
                            <span>Cancel Order</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Other Open Orders to Buy */}
              {otherOrders.length > 0 && (
                <div>
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400">
                      Market Listings
                    </h3>
                    <span className="text-xs font-mono text-emerald-400">{otherOrders.length} Available</span>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {otherOrders.map((o) => {
                      const unitsToBuy = buyUnits[o.orderId.toString()] || "1";
                      return (
                        <div
                          key={o.orderId.toString()}
                          className="web3-card web3-card-hover rounded-xl p-5 flex flex-col justify-between"
                        >
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <span className="rounded-md bg-slate-800 border border-white/[0.08] px-1.5 py-0.5 text-[10px] font-mono text-cyan-400">
                                Order #{o.orderId.toString()}
                              </span>
                              <div className="flex items-center gap-1 text-[11px] font-mono text-slate-400">
                                <User className="h-3 w-3 text-slate-500" />
                                <span>{shortenAddress(o.seller)}</span>
                              </div>
                            </div>

                            <div className="font-bold text-white text-base">{o.assetName}</div>

                            <div className="mt-3 grid grid-cols-2 gap-2 rounded-lg border border-white/[0.06] bg-slate-950/60 p-2.5 font-mono text-xs">
                              <div>
                                <div className="text-[10px] text-slate-500 uppercase">Available</div>
                                <div className="font-bold text-slate-200">{o.amount.toString()} units</div>
                              </div>
                              <div>
                                <div className="text-[10px] text-slate-500 uppercase">Price / Unit</div>
                                <div className="font-bold text-emerald-400">
                                  {formatUSD(o.pricePerUnit ?? BigInt(0))}
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center gap-2">
                            <input
                              type="number"
                              value={buyUnits[o.orderId.toString()] || ""}
                              onChange={(e) =>
                                setBuyUnits({ ...buyUnits, [o.orderId.toString()]: e.target.value })
                              }
                              placeholder="1"
                              min="1"
                              max={Number(o.amount)}
                              className="w-24 rounded-lg border border-white/[0.08] bg-slate-900 px-3 py-1.5 font-mono text-xs text-white focus:border-cyan-400 focus:outline-none"
                            />
                            <button
                              onClick={() => handleBuy(Number(o.orderId), unitsToBuy)}
                              disabled={isPending || isConfirming}
                              className="flex-1 rounded-lg bg-emerald-400 py-1.5 text-xs font-bold text-slate-950 hover:bg-emerald-300 transition-all flex items-center justify-center gap-1"
                            >
                              <ShoppingCart className="h-3 w-3" />
                              <span>Buy Units</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
          </AnimatePresence>
        </motion.div>
      )}
    </AppLayout>
    </RoleGuard>
  );
}
