"use client";

import { useAccount, useBalance, useReadContract } from "wagmi";
import { AppLayout } from "@/components/layout/AppLayout";
import { TUSDT_ABI } from "@/config/contracts";
import { useAsetraAddress, useTusdtAddress } from "@/hooks/useContractAddresses";
import { Wallet, ExternalLink, Copy, Check, ShieldCheck, Globe, Cpu, Droplets } from "lucide-react";
import { useState } from "react";

export default function SettingsPage() {
  const { address, isConnected, chain } = useAccount();
  const ASETRA_ADDRESS = useAsetraAddress();
  const TUSDT_ADDRESS = useTusdtAddress();
  const { data: balance } = useBalance({ address });
  const { data: tusdtBalance } = useReadContract({
    address: TUSDT_ADDRESS,
    abi: TUSDT_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
  });
  const [copiedAddr, setCopiedAddr] = useState(false);
  const [copiedContract, setCopiedContract] = useState(false);

  const explorerBase = process.env.NEXT_PUBLIC_BOT_EXPLORER_URL || "https://scan.botchain.ai";
  const chainId = process.env.NEXT_PUBLIC_BOT_CHAIN_ID || "677";
  const rpcUrl = process.env.NEXT_PUBLIC_BOT_RPC_URL || "https://rpc.botchain.ai";

  const copyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      setCopiedAddr(true);
      setTimeout(() => setCopiedAddr(false), 2000);
    }
  };

  const copyContract = () => {
    navigator.clipboard.writeText(ASETRA_ADDRESS);
    setCopiedContract(true);
    setTimeout(() => setCopiedContract(false), 2000);
  };

  return (
    <AppLayout>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2.5">
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white font-sans">
            Settings &amp; Network
          </h1>
          <span className="rounded-full bg-cyan-500/10 border border-cyan-500/20 px-2.5 py-0.5 text-xs font-mono font-medium text-cyan-400">
            Node RPC
          </span>
        </div>
        <p className="mt-1 text-sm text-slate-400">
          Connected wallet state, protocol smart contracts, and network configuration.
        </p>
      </div>

      <div className="max-w-5xl space-y-6">
        {/* Wallet Section */}
        <div className="web3-card rounded-2xl p-6">
          <div className="mb-4 flex items-center justify-between border-b border-white/[0.06] pb-3">
            <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-slate-400">
              <Wallet className="h-4 w-4 text-cyan-400" />
              <span>Connected Account</span>
            </div>
            {isConnected && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 text-[11px] font-mono font-medium text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Active Session
              </span>
            )}
          </div>

          {!isConnected ? (
            <div className="text-center py-6">
              <Wallet className="mx-auto mb-3 h-10 w-10 text-slate-600" />
              <p className="text-sm text-slate-400">No Web3 wallet currently connected.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-mono uppercase tracking-wider text-slate-500">
                  Account Address
                </label>
                <div className="mt-1.5 flex items-center gap-2">
                  <code className="flex-1 rounded-xl border border-white/[0.08] bg-slate-950/80 px-3.5 py-2.5 text-xs font-mono text-cyan-300 break-all">
                    {address}
                  </code>
                  <button
                    onClick={copyAddress}
                    title="Copy Address"
                    className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.08] bg-slate-900 text-slate-300 hover:text-white hover:border-cyan-400/40 transition-colors"
                  >
                    {copiedAddr ? (
                      <Check className="h-4 w-4 text-emerald-400" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </button>
                  <a
                    href={`${explorerBase}/address/${address}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="View on Explorer"
                    className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.08] bg-slate-900 text-slate-300 hover:text-cyan-400 hover:border-cyan-400/40 transition-colors"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 rounded-xl border border-white/[0.06] bg-slate-950/50 p-4 font-mono text-xs">
                <div>
                  <div className="text-[11px] text-slate-500 uppercase">BOT Balance</div>
                  <div className="mt-1 text-base font-bold text-white">
                    {balance
                      ? `${(Number(balance.value) / 10 ** balance.decimals).toFixed(4)} ${balance.symbol}`
                      : "—"}
                  </div>
                </div>
                <div>
                  <div className="text-[11px] text-slate-500 uppercase">tUSDT Balance</div>
                  <div className="mt-1 text-base font-bold text-emerald-400">
                    {tusdtBalance !== undefined
                      ? `${(Number(tusdtBalance) / 1e6).toFixed(2)} tUSDT`
                      : "—"}
                  </div>
                </div>
                <div>
                  <div className="text-[11px] text-slate-500 uppercase">Active Network</div>
                  <div className="mt-1 text-base font-bold text-cyan-400">
                    {chain?.name || "BOT Chain"}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Network Specification */}
        <div className="web3-card rounded-2xl p-6">
          <div className="mb-4 flex items-center justify-between border-b border-white/[0.06] pb-3">
            <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-slate-400">
              <Globe className="h-4 w-4 text-cyan-400" />
              <span>Network Parameters</span>
            </div>
          </div>

          <div className="space-y-3 text-xs font-mono">
            <div className="flex items-center justify-between py-1.5 border-b border-white/[0.04]">
              <span className="text-slate-400">Network Name</span>
              <span className="font-bold text-white">BOT Chain</span>
            </div>

            <div className="flex items-center justify-between py-1.5 border-b border-white/[0.04]">
              <span className="text-slate-400">Chain ID</span>
              <span className="font-bold text-cyan-400">{chainId}</span>
            </div>

            <div className="flex items-center justify-between py-1.5 border-b border-white/[0.04]">
              <span className="text-slate-400">Public RPC URL</span>
              <span className="text-slate-300">{rpcUrl}</span>
            </div>

            <div className="flex items-center justify-between py-1.5">
              <span className="text-slate-400">Block Explorer</span>
              <a
                href={explorerBase}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-cyan-400 hover:underline"
              >
                <span>{explorerBase}</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
        </div>

        {/* Protocol Contracts */}
        <div className="web3-card rounded-2xl p-6">
          <div className="mb-4 flex items-center justify-between border-b border-white/[0.06] pb-3">
            <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-slate-400">
              <Cpu className="h-4 w-4 text-cyan-400" />
              <span>Smart Contract Deployment</span>
            </div>
            <span className="rounded-full bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 text-[10px] font-mono text-cyan-400">
              Asetra Core
            </span>
          </div>

          <div>
            <label className="text-xs font-mono uppercase tracking-wider text-slate-500">
              Asetra.sol Address
            </label>
            <div className="mt-1.5 flex items-center gap-2">
              <code className="flex-1 rounded-xl border border-white/[0.08] bg-slate-950/80 px-3.5 py-2.5 text-xs font-mono text-slate-200 break-all">
                {ASETRA_ADDRESS}
              </code>
              <button
                onClick={copyContract}
                title="Copy Contract Address"
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.08] bg-slate-900 text-slate-300 hover:text-white hover:border-cyan-400/40 transition-colors"
              >
                {copiedContract ? (
                  <Check className="h-4 w-4 text-emerald-400" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </button>
              <a
                href={`${explorerBase}/address/${ASETRA_ADDRESS}`}
                target="_blank"
                rel="noopener noreferrer"
                title="View on Explorer"
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.08] bg-slate-900 text-slate-300 hover:text-cyan-400 hover:border-cyan-400/40 transition-colors"
              >
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>

        {/* Faucet */}
        <div className="web3-card rounded-2xl p-6">
          <div className="mb-4 flex items-center justify-between border-b border-white/[0.06] pb-3">
            <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-slate-400">
              <Droplets className="h-4 w-4 text-cyan-400" />
              <span>Faucet</span>
            </div>
          </div>
          <p className="text-xs text-slate-400 mb-4">Get BOT tokens for gas fees on BOT Chain.</p>
          <a
            href="https://faucet.botchain.ai/basic"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-xl bg-cyan-400 px-5 py-2.5 text-xs font-bold text-slate-950 hover:bg-cyan-300 transition-colors shadow-sm"
          >
            Request Tokens <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>
    </AppLayout>
  );
}
