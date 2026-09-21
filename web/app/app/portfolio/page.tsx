"use client";

import { useState, useEffect, useCallback } from "react";
import { useAccount, usePublicClient, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { AppLayout } from "@/components/layout/AppLayout";
import { ASETRA_ABI } from "@/config/contracts";
import { useAsetraAddress } from "@/hooks/useContractAddresses";
import { RoleGuard } from "@/components/role/RoleGuard";
import { useRole } from "@/lib/context/RoleContext";
import { formatUSD, timestampToDate } from "@/lib/utils/format";
import { parseContractError } from "@/lib/utils/errors";
import { TxSuccessBanner } from "@/components/ui/TxSuccessBanner";
import { TxProgress } from "@/components/ui/TxProgress";
import { ASSET_STATE_LABELS, type AssetState } from "@/types/asset";
import {
  Wallet,
  TrendingUp,
  DollarSign,
  Package,
  Shield,
  Layers,
  ArrowUpRight,
  Banknote,
  Loader2,
  Coins,
  Receipt,
  Landmark,
} from "lucide-react";
import Link from "next/link";
import { PortfolioSkeleton } from "@/components/skeleton/PageSkeletons";
import { motion, AnimatePresence } from "framer-motion";

/* ─── Investor Types ─── */
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
  claimableProceeds: bigint;
}

/* ─── Issuer Types ─── */
interface IssuerAsset {
  assetId: bigint;
  name: string;
  assetType: string;
  state: AssetState;
  faceValue: bigint;
  tokenSupply: bigint;
  fundedAmount: bigint;
  totalRaised: bigint;
  totalPaid: bigint;
  paymentFunded: bigint;
  availableUnits: bigint;
}

const STATE_BADGE_STYLES: Record<number, { bg: string; text: string; dot: string; border: string }> = {
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
  const ASETRA_ADDRESS = useAsetraAddress();
  const { role } = useRole();

  const isIssuer = role === "issuer";

  return (
    <RoleGuard allowed={["issuer", "investor"]}>
      <AppLayout>
        {isIssuer ? (
          <IssuerView address={address} isConnected={isConnected} publicClient={publicClient} ASETRA_ADDRESS={ASETRA_ADDRESS} />
        ) : (
          <InvestorView address={address} isConnected={isConnected} publicClient={publicClient} ASETRA_ADDRESS={ASETRA_ADDRESS} />
        )}
      </AppLayout>
    </RoleGuard>
  );
}

/* ═══════════════════════════════════════════════════════════════════ */
/*  INVESTOR VIEW                                                     */
/* ═══════════════════════════════════════════════════════════════════ */
function InvestorView({ address, isConnected, publicClient, ASETRA_ADDRESS }: {
  address: `0x${string}` | undefined;
  isConnected: boolean;
  publicClient: ReturnType<typeof usePublicClient>;
  ASETRA_ADDRESS: `0x${string}`;
}) {
  const [positions, setPositions] = useState<PositionWithAsset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { writeContractAsync, data: claimTxHash, isPending: claimPending, reset: claimReset } = useWriteContract();
  const { isLoading: claimConfirming, isSuccess: claimSuccess, isError: claimIsError, error: claimError } = useWaitForTransactionReceipt({ hash: claimTxHash });
  const [claimingAssetId, setClaimingAssetId] = useState<string | null>(null);

  const loadPositions = useCallback(async () => {
    if (!publicClient || !address) return;
    try {
      const countResult = await publicClient.readContract({ address: ASETRA_ADDRESS, abi: ASETRA_ABI, functionName: "getAssetCount" });
      const total = Number(countResult);
      const results: PositionWithAsset[] = [];
      for (let i = 0; i < total; i++) {
        try {
          const [pos, name, assetType, state, borrowed, liveYield, faceValue, tokenSupply, claimable] = await Promise.all([
            publicClient.readContract({ address: ASETRA_ADDRESS, abi: ASETRA_ABI, functionName: "getPosition", args: [BigInt(i), address] }),
            publicClient.readContract({ address: ASETRA_ADDRESS, abi: ASETRA_ABI, functionName: "assetName", args: [BigInt(i)] }),
            publicClient.readContract({ address: ASETRA_ADDRESS, abi: ASETRA_ABI, functionName: "assetType", args: [BigInt(i)] }),
            publicClient.readContract({ address: ASETRA_ADDRESS, abi: ASETRA_ABI, functionName: "assetState", args: [BigInt(i)] }),
            publicClient.readContract({ address: ASETRA_ADDRESS, abi: ASETRA_ABI, functionName: "getBorrowedAmount", args: [BigInt(i), address] }),
            publicClient.readContract({ address: ASETRA_ADDRESS, abi: ASETRA_ABI, functionName: "calculateYield", args: [BigInt(i), address] }),
            publicClient.readContract({ address: ASETRA_ADDRESS, abi: ASETRA_ABI, functionName: "assetFaceValue", args: [BigInt(i)] }),
            publicClient.readContract({ address: ASETRA_ADDRESS, abi: ASETRA_ABI, functionName: "assetTokenSupply", args: [BigInt(i)] }),
            publicClient.readContract({ address: ASETRA_ADDRESS, abi: ASETRA_ABI, functionName: "getClaimableProceeds", args: [BigInt(i), address] }),
          ]);
          const posData = pos as readonly [bigint, bigint, bigint, bigint, bigint, bigint, bigint, boolean];
          if (posData[7] && posData[0] > BigInt(0)) {
            results.push({
              assetId: BigInt(i), amount: posData[0], totalInvested: posData[1], holdingStart: posData[2],
              accruedYield: posData[3], claimedYield: posData[4], collateralAmount: posData[5], active: posData[7],
              assetName: name as string, assetType: assetType as string, assetState: Number(state) as AssetState,
              borrowedAmount: borrowed as bigint, liveYield: liveYield as bigint, faceValue: faceValue as bigint,
              tokenSupply: tokenSupply as bigint, claimableProceeds: claimable as bigint,
            });
          }
        } catch { /* skip */ }
      }
      setPositions(results);
    } catch (e) { console.error("Failed to load positions:", e); } finally { setIsLoading(false); }
  }, [publicClient, address, ASETRA_ADDRESS]);

  useEffect(() => { if (isConnected) loadPositions(); else setIsLoading(false); }, [isConnected, loadPositions]);
  useEffect(() => { if (claimSuccess) { claimReset(); setClaimingAssetId(null); loadPositions(); } }, [claimSuccess, claimReset, loadPositions]);

  const handleClaimProceeds = async (assetId: string) => {
    setClaimingAssetId(assetId);
    try { await writeContractAsync({ address: ASETRA_ADDRESS, abi: ASETRA_ABI, functionName: "claimProceeds", args: [BigInt(assetId)] }); }
    catch (e) { console.error("Claim failed:", e); setClaimingAssetId(null); }
  };

  const totalInvested = positions.reduce((a, p) => a + p.totalInvested, BigInt(0));
  const totalYield = positions.reduce((a, p) => a + p.liveYield, BigInt(0));
  const totalClaimable = positions.reduce((a, p) => a + p.claimableProceeds, BigInt(0));
  const totalCollateral = positions.reduce((a, p) => p.tokenSupply > BigInt(0) ? a + (p.collateralAmount * p.faceValue) / p.tokenSupply : a, BigInt(0));
  const totalBorrowed = positions.reduce((a, p) => a + p.borrowedAmount, BigInt(0));

  return (
    <>
      <div className="mb-8">
        <div className="flex items-center gap-2.5">
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white font-sans">Portfolio Holdings</h1>
          <span className="rounded-full bg-cyan-500/10 border border-cyan-500/20 px-2.5 py-0.5 text-xs font-mono font-medium text-cyan-400">On-Chain</span>
        </div>
        <p className="mt-1 text-sm text-slate-400">Complete breakdown of your tokenized real-world assets, live yields, and active collateral.</p>
      </div>

      {!isConnected ? (
        <div className="web3-card rounded-2xl p-12 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400"><Wallet className="h-7 w-7" /></div>
          <h3 className="text-xl font-bold text-white mb-2">Connect Your Wallet</h3>
          <p className="text-sm text-slate-400 max-w-sm mx-auto mb-4">Connect your wallet to inspect your positions, yield performance, and manage collateral.</p>
        </div>
      ) : (
        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div key="skel" exit={{ opacity: 0 }} transition={{ duration: 0.15 }}><PortfolioSkeleton /></motion.div>
          ) : (
            <motion.div key="content" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}>
              {(claimPending || claimConfirming) && claimingAssetId && (
                <div className="mb-6"><TxProgress step={claimConfirming ? "pending" : claimPending ? "preparing" : "idle"} /></div>
              )}
              {claimSuccess && claimTxHash && (
                <div className="mb-6"><TxSuccessBanner txHash={claimTxHash} message="Proceeds claimed successfully!" onDismiss={claimReset} /></div>
              )}
              {claimIsError && claimError && (
                <div className="mb-6 rounded-xl border border-rose-500/30 bg-rose-500/10 p-4"><p className="text-sm font-medium text-rose-300">{parseContractError(claimError)}</p></div>
              )}

              <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
                <StatCard label="Total Invested" value={formatUSD(totalInvested)} icon={DollarSign} iconColor="text-cyan-400" />
                <StatCard label="Accrued Yield" value={formatUSD(totalYield)} icon={TrendingUp} iconColor="text-emerald-400" valueColor="text-emerald-400" />
                <StatCard label="Claimable" value={formatUSD(totalClaimable)} icon={Banknote} iconColor="text-emerald-400" valueColor="text-emerald-300" highlight />
                <StatCard label="Collateral Locked" value={formatUSD(totalCollateral)} icon={Shield} iconColor="text-sky-400" valueColor="text-sky-300" />
                <StatCard label="Active Debt" value={formatUSD(totalBorrowed)} icon={Wallet} iconColor="text-amber-400" valueColor="text-amber-400" />
                <StatCard label="Positions" value={positions.length.toString()} icon={Layers} iconColor="text-cyan-400" />
              </div>

              {positions.length === 0 ? (
                <div className="web3-card rounded-2xl p-16 text-center">
                  <Package className="mx-auto mb-3 h-12 w-12 text-slate-600" />
                  <h3 className="text-lg font-bold text-white mb-1">No Active Positions</h3>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto mb-4">You haven&apos;t participated in any RWA primary offerings yet. Browse the marketplace to fund assets.</p>
                  <Link href="/app/marketplace" className="inline-flex items-center gap-1.5 rounded-xl bg-cyan-400 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-cyan-300 transition-colors">Go to Marketplace</Link>
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
                          <th className="px-4 py-3.5 text-right">Claimable</th>
                          <th className="px-4 py-3.5 text-right">Collateral</th>
                          <th className="px-4 py-3.5 text-right">Borrowed</th>
                          <th className="px-4 py-3.5">Holding Since</th>
                          <th className="px-5 py-3.5 text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/[0.04]">
                        {positions.map((p) => {
                          const currentValue = p.tokenSupply > BigInt(0) ? (p.amount * p.faceValue) / p.tokenSupply : BigInt(0);
                          const badge = STATE_BADGE_STYLES[p.assetState] || STATE_BADGE_STYLES[0];
                          const isClaimingThis = claimingAssetId === p.assetId.toString() && (claimPending || claimConfirming);
                          return (
                            <tr key={p.assetId.toString()} className="hover:bg-slate-800/30 transition-colors duration-150">
                              <td className="px-5 py-4">
                                <Link href={`/app/assets/${p.assetId}`} className="group flex items-center gap-2.5">
                                  <span className="rounded-md bg-slate-800 border border-white/[0.08] px-1.5 py-0.5 text-[10px] text-cyan-400">#{p.assetId.toString()}</span>
                                  <div>
                                    <div className="font-bold text-white group-hover:text-cyan-300 font-sans text-sm transition-colors">{p.assetName}</div>
                                    <div className="text-[10px] text-slate-400 font-mono">{p.assetType}</div>
                                  </div>
                                </Link>
                              </td>
                              <td className="px-4 py-4">
                                <span className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-mono font-medium ${badge.bg} ${badge.text} ${badge.border}`}>
                                  <span className={`h-1.5 w-1.5 rounded-full ${badge.dot}`} />{ASSET_STATE_LABELS[p.assetState]}
                                </span>
                              </td>
                              <td className="px-4 py-4 text-right font-bold text-slate-200">{p.amount.toString()}</td>
                              <td className="px-4 py-4 text-right text-slate-300">{formatUSD(p.totalInvested)}</td>
                              <td className="px-4 py-4 text-right font-bold text-white">{formatUSD(currentValue)}</td>
                              <td className="px-4 py-4 text-right font-bold text-emerald-400">+{formatUSD(p.liveYield)}</td>
                              <td className="px-4 py-4 text-right">
                                {p.claimableProceeds > BigInt(0) ? (
                                  <span className="font-bold text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-2 py-0.5">{formatUSD(p.claimableProceeds)}</span>
                                ) : <span className="text-slate-500">—</span>}
                              </td>
                              <td className="px-4 py-4 text-right text-sky-400">{p.collateralAmount > BigInt(0) ? formatUSD(p.collateralAmount) : "—"}</td>
                              <td className="px-4 py-4 text-right text-amber-400">{p.borrowedAmount > BigInt(0) ? formatUSD(p.borrowedAmount) : "—"}</td>
                              <td className="px-4 py-4 text-slate-400">{p.holdingStart > BigInt(0) ? timestampToDate(p.holdingStart) : "—"}</td>
                              <td className="px-5 py-4 text-center">
                                <div className="flex items-center justify-center gap-1.5">
                                  {p.claimableProceeds > BigInt(0) && (
                                    <button onClick={() => handleClaimProceeds(p.assetId.toString())} disabled={isClaimingThis || claimSuccess}
                                      title={p.assetState !== 5 && p.assetState !== 6 ? "Asset must be ACTIVE or MATURED" : ""}
                                      className="inline-flex items-center gap-1 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-bold text-emerald-300 hover:bg-emerald-500/20 transition-all disabled:opacity-50">
                                      {isClaimingThis ? <Loader2 className="h-3 w-3 animate-spin" /> : <Banknote className="h-3 w-3" />}Claim
                                    </button>
                                  )}
                                  <Link href={`/app/assets/${p.assetId}`}
                                    className="inline-flex items-center gap-1 rounded-lg border border-white/[0.08] bg-slate-800/60 px-2.5 py-1 text-[11px] font-medium text-slate-300 hover:border-cyan-400/40 hover:text-cyan-300 transition-all">
                                    <span>Manage</span><ArrowUpRight className="h-3 w-3" />
                                  </Link>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════════ */
/*  ISSUER VIEW                                                       */
/* ═══════════════════════════════════════════════════════════════════ */
function IssuerView({ address, isConnected, publicClient, ASETRA_ADDRESS }: {
  address: `0x${string}` | undefined;
  isConnected: boolean;
  publicClient: ReturnType<typeof usePublicClient>;
  ASETRA_ADDRESS: `0x${string}`;
}) {
  const [assets, setAssets] = useState<IssuerAsset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { writeContractAsync, data: withdrawTxHash, isPending: withdrawPending, reset: withdrawReset } = useWriteContract();
  const { isLoading: withdrawConfirming, isSuccess: withdrawSuccess, isError: withdrawIsError, error: withdrawError } = useWaitForTransactionReceipt({ hash: withdrawTxHash });
  const [withdrawingId, setWithdrawingId] = useState<string | null>(null);

  const loadAssets = useCallback(async () => {
    if (!publicClient || !address) return;
    try {
      const countResult = await publicClient.readContract({ address: ASETRA_ADDRESS, abi: ASETRA_ABI, functionName: "getAssetCount" });
      const total = Number(countResult);
      const results: IssuerAsset[] = [];
      for (let i = 0; i < total; i++) {
        try {
          const [issuer, name, assetType, state, faceValue, tokenSupply, fundedAmount, totalRaised_, totalPaid_, paymentFunded_, availableUnits_] = await Promise.all([
            publicClient.readContract({ address: ASETRA_ADDRESS, abi: ASETRA_ABI, functionName: "assetIssuer", args: [BigInt(i)] }),
            publicClient.readContract({ address: ASETRA_ADDRESS, abi: ASETRA_ABI, functionName: "assetName", args: [BigInt(i)] }),
            publicClient.readContract({ address: ASETRA_ADDRESS, abi: ASETRA_ABI, functionName: "assetType", args: [BigInt(i)] }),
            publicClient.readContract({ address: ASETRA_ADDRESS, abi: ASETRA_ABI, functionName: "assetState", args: [BigInt(i)] }),
            publicClient.readContract({ address: ASETRA_ADDRESS, abi: ASETRA_ABI, functionName: "assetFaceValue", args: [BigInt(i)] }),
            publicClient.readContract({ address: ASETRA_ADDRESS, abi: ASETRA_ABI, functionName: "assetTokenSupply", args: [BigInt(i)] }),
            publicClient.readContract({ address: ASETRA_ADDRESS, abi: ASETRA_ABI, functionName: "assetFundedAmount", args: [BigInt(i)] }),
            publicClient.readContract({ address: ASETRA_ADDRESS, abi: ASETRA_ABI, functionName: "totalRaised", args: [BigInt(i)] }),
            publicClient.readContract({ address: ASETRA_ADDRESS, abi: ASETRA_ABI, functionName: "totalPaid", args: [BigInt(i)] }),
            publicClient.readContract({ address: ASETRA_ADDRESS, abi: ASETRA_ABI, functionName: "paymentFunded", args: [BigInt(i)] }),
            publicClient.readContract({ address: ASETRA_ADDRESS, abi: ASETRA_ABI, functionName: "getAvailableUnits", args: [BigInt(i)] }),
          ]);
          if ((issuer as string).toLowerCase() === address.toLowerCase()) {
            results.push({
              assetId: BigInt(i), name: name as string, assetType: assetType as string,
              state: Number(state) as AssetState, faceValue: faceValue as bigint, tokenSupply: tokenSupply as bigint,
              fundedAmount: fundedAmount as bigint, totalRaised: totalRaised_ as bigint, totalPaid: totalPaid_ as bigint,
              paymentFunded: paymentFunded_ as bigint, availableUnits: availableUnits_ as bigint,
            });
          }
        } catch { /* skip */ }
      }
      setAssets(results);
    } catch (e) { console.error("Failed to load issuer assets:", e); } finally { setIsLoading(false); }
  }, [publicClient, address, ASETRA_ADDRESS]);

  useEffect(() => { if (isConnected) loadAssets(); else setIsLoading(false); }, [isConnected, loadAssets]);
  useEffect(() => { if (withdrawSuccess) { withdrawReset(); setWithdrawingId(null); loadAssets(); } }, [withdrawSuccess, withdrawReset, loadAssets]);

  const handleWithdraw = async (assetId: string) => {
    setWithdrawingId(assetId);
    try { await writeContractAsync({ address: ASETRA_ADDRESS, abi: ASETRA_ABI, functionName: "withdrawRaisedFunds", args: [BigInt(assetId)] }); }
    catch (e) { console.error("Withdraw failed:", e); setWithdrawingId(null); }
  };

  const totalRaisedSum = assets.reduce((a, p) => a + p.totalRaised, BigInt(0));
  const totalPayments = assets.reduce((a, p) => a + p.totalPaid, BigInt(0));
  const activeAssets = assets.filter((a) => a.state >= 3 && a.state <= 5).length;

  return (
    <>
      <div className="mb-8">
        <div className="flex items-center gap-2.5">
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white font-sans">Issuer Portfolio</h1>
          <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 text-xs font-mono font-medium text-emerald-400">Originator</span>
        </div>
        <p className="mt-1 text-sm text-slate-400">Overview of your originated assets, funding status, and payments received.</p>
      </div>

      {!isConnected ? (
        <div className="web3-card rounded-2xl p-12 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"><Wallet className="h-7 w-7" /></div>
          <h3 className="text-xl font-bold text-white mb-2">Connect Your Wallet</h3>
          <p className="text-sm text-slate-400 max-w-sm mx-auto mb-4">Connect your wallet to manage your originated assets and track funding.</p>
        </div>
      ) : (
        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div key="skel" exit={{ opacity: 0 }} transition={{ duration: 0.15 }}><PortfolioSkeleton /></motion.div>
          ) : (
            <motion.div key="content" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}>
              {(withdrawPending || withdrawConfirming) && withdrawingId && (
                <div className="mb-6"><TxProgress step={withdrawConfirming ? "pending" : withdrawPending ? "preparing" : "idle"} /></div>
              )}
              {withdrawSuccess && withdrawTxHash && (
                <div className="mb-6"><TxSuccessBanner txHash={withdrawTxHash} message="Funds withdrawn successfully!" onDismiss={withdrawReset} /></div>
              )}
              {withdrawIsError && withdrawError && (
                <div className="mb-6 rounded-xl border border-rose-500/30 bg-rose-500/10 p-4"><p className="text-sm font-medium text-rose-300">{parseContractError(withdrawError)}</p></div>
              )}

              <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard label="Total Assets" value={assets.length.toString()} icon={Coins} iconColor="text-emerald-400" />
                <StatCard label="Total Raised" value={formatUSD(totalRaisedSum)} icon={DollarSign} iconColor="text-cyan-400" />
                <StatCard label="Payments Received" value={formatUSD(totalPayments)} icon={Receipt} iconColor="text-emerald-400" valueColor="text-emerald-400" />
                <StatCard label="Active Assets" value={activeAssets.toString()} icon={Landmark} iconColor="text-amber-400" valueColor="text-amber-400" />
              </div>

              {assets.length === 0 ? (
                <div className="web3-card rounded-2xl p-16 text-center">
                  <Package className="mx-auto mb-3 h-12 w-12 text-slate-600" />
                  <h3 className="text-lg font-bold text-white mb-1">No Assets Originated</h3>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto mb-4">You haven&apos;t created any RWA assets yet. Start by tokenizing your first asset.</p>
                  <Link href="/app/issuer/create" className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-400 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-emerald-300 transition-colors">Create Asset</Link>
                </div>
              ) : (
                <div className="web3-card rounded-2xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs font-mono">
                      <thead className="border-b border-white/[0.08] bg-slate-950/80 text-[11px] uppercase tracking-wider text-slate-400 font-mono">
                        <tr>
                          <th className="px-5 py-3.5">Asset</th>
                          <th className="px-4 py-3.5">Status</th>
                          <th className="px-4 py-3.5 text-right">Sold</th>
                          <th className="px-4 py-3.5 text-right">Raised</th>
                          <th className="px-4 py-3.5 text-right">Payments</th>
                          <th className="px-4 py-3.5 text-right">Settlement Pool</th>
                          <th className="px-5 py-3.5 text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/[0.04]">
                        {assets.map((a) => {
                          const badge = STATE_BADGE_STYLES[a.state] || STATE_BADGE_STYLES[0];
                          const totalUnitsSold = a.tokenSupply - a.availableUnits;
                          const soldPct = a.tokenSupply > BigInt(0) ? Number((totalUnitsSold * BigInt(100)) / a.tokenSupply) : 0;
                          const paidPct = a.faceValue > BigInt(0) ? Number((a.totalPaid * BigInt(100)) / a.faceValue) : 0;
                          const canWithdraw = a.fundedAmount > BigInt(0);
                          const isWithdrawingThis = withdrawingId === a.assetId.toString() && (withdrawPending || withdrawConfirming);
                          return (
                            <tr key={a.assetId.toString()} className="hover:bg-slate-800/30 transition-colors duration-150">
                              <td className="px-5 py-4">
                                <Link href={`/app/assets/${a.assetId}`} className="group flex items-center gap-2.5">
                                  <span className="rounded-md bg-slate-800 border border-white/[0.08] px-1.5 py-0.5 text-[10px] text-emerald-400">#{a.assetId.toString()}</span>
                                  <div>
                                    <div className="font-bold text-white group-hover:text-cyan-300 font-sans text-sm transition-colors">{a.name}</div>
                                    <div className="text-[10px] text-slate-400 font-mono">{a.assetType}</div>
                                  </div>
                                </Link>
                              </td>
                              <td className="px-4 py-4">
                                <span className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-mono font-medium ${badge.bg} ${badge.text} ${badge.border}`}>
                                  <span className={`h-1.5 w-1.5 rounded-full ${badge.dot}`} />{ASSET_STATE_LABELS[a.state]}
                                </span>
                              </td>
                              <td className="px-4 py-4 text-right">
                                <div className="text-slate-200 font-bold">{totalUnitsSold.toString()}/{a.tokenSupply.toString()}</div>
                                <div className="mt-1 h-1 w-16 rounded-full bg-slate-700 ml-auto overflow-hidden">
                                  <div className="h-full bg-cyan-400 rounded-full" style={{ width: `${soldPct}%` }} />
                                </div>
                              </td>
                              <td className="px-4 py-4 text-right">
                                <div className="font-bold text-white">{formatUSD(a.totalRaised)}</div>
                                <div className="text-[10px] text-slate-500">of {formatUSD(a.faceValue)}</div>
                              </td>
                              <td className="px-4 py-4 text-right">
                                <div className="font-bold text-emerald-400">{formatUSD(a.totalPaid)}</div>
                                <div className="mt-1 h-1 w-16 rounded-full bg-slate-700 ml-auto overflow-hidden">
                                  <div className="h-full bg-emerald-400 rounded-full" style={{ width: `${paidPct}%` }} />
                                </div>
                              </td>
                              <td className="px-4 py-4 text-right text-sky-400 font-bold">{formatUSD(a.paymentFunded)}</td>
                              <td className="px-5 py-4 text-center">
                                <div className="flex items-center justify-center gap-1.5">
                                  {canWithdraw && (
                                    <button onClick={() => handleWithdraw(a.assetId.toString())} disabled={isWithdrawingThis || withdrawSuccess || (a.state !== 5 && a.state !== 6)}
                                      title={a.state !== 5 && a.state !== 6 ? "Asset must be ACTIVE or MATURED to withdraw" : ""}
                                      className="inline-flex items-center gap-1 rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-2.5 py-1 text-[11px] font-bold text-cyan-300 hover:bg-cyan-500/20 transition-all disabled:opacity-50">
                                      {isWithdrawingThis ? <Loader2 className="h-3 w-3 animate-spin" /> : <DollarSign className="h-3 w-3" />}Withdraw
                                    </button>
                                  )}
                                  <Link href={`/app/assets/${a.assetId}`}
                                    className="inline-flex items-center gap-1 rounded-lg border border-white/[0.08] bg-slate-800/60 px-2.5 py-1 text-[11px] font-medium text-slate-300 hover:border-cyan-400/40 hover:text-cyan-300 transition-all">
                                    <span>View</span><ArrowUpRight className="h-3 w-3" />
                                  </Link>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════════ */
/*  SHARED COMPONENTS                                                  */
/* ═══════════════════════════════════════════════════════════════════ */
function StatCard({ label, value, icon: Icon, iconColor, valueColor, highlight }: {
  label: string; value: string; icon: React.ElementType; iconColor: string; valueColor?: string; highlight?: boolean;
}) {
  return (
    <div className={`web3-card rounded-2xl p-4 ${highlight ? "border border-emerald-500/30 bg-emerald-500/[0.06]" : ""}`}>
      <div className="flex items-center justify-between text-slate-400">
        <span className="text-[11px] font-mono uppercase tracking-wider">{label}</span>
        <Icon className={`h-4 w-4 ${iconColor}`} />
      </div>
      <div className={`mt-2 text-2xl font-black font-mono ${valueColor || "text-white"}`}>{value}</div>
    </div>
  );
}
