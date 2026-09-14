"use client";

import { useState, useEffect } from "react";
import { useAccount, useConnect, useDisconnect, useChainId, useSwitchChain, useBalance } from "wagmi";
import { Button } from "@/components/ui/button";
import { BOT_CHAIN_TESTNET } from "@/config/chains";
import { Wallet, LogOut, ExternalLink, AlertTriangle, Copy, Check } from "lucide-react";

export function ConnectButton() {
  const [mounted, setMounted] = useState(false);
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const { data: balance } = useBalance({ address });
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isWrongNetwork = isConnected && chainId !== BOT_CHAIN_TESTNET.id;
  const explorerUrl = `${BOT_CHAIN_TESTNET.blockExplorers.default.url}/address/${address}`;

  const copyAddress = () => {
    if (!address) return;
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  if (!mounted) {
    return (
      <Button
        className="rounded-xl bg-cyan-400 px-4 py-2 text-xs sm:text-sm font-bold text-slate-950 opacity-90"
      >
        <Wallet className="mr-2 h-4 w-4 text-slate-950" />
        Connect Wallet
      </Button>
    );
  }

  if (isConnected && address) {
    return (
      <div className="flex items-center gap-2">
        {isWrongNetwork && (
          <Button
            variant="destructive"
            size="sm"
            onClick={() => switchChain({ chainId: BOT_CHAIN_TESTNET.id })}
            className="rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 hover:bg-rose-500/30 text-xs font-semibold px-3"
          >
            <AlertTriangle className="mr-1.5 h-3.5 w-3.5 animate-pulse" />
            Switch Network
          </Button>
        )}

        <div className="flex items-center rounded-xl border border-white/[0.08] bg-slate-900/90 p-1 shadow-inner shadow-black/50">
          {balance && (
            <div className="hidden sm:block px-2.5 py-1 text-xs font-mono font-medium text-slate-300 border-r border-white/[0.08]">
              {(Number(balance.value) / 10 ** balance.decimals).toFixed(3)} {balance.symbol}
            </div>
          )}

          <button
            onClick={copyAddress}
            title="Click to copy address"
            className="flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-mono font-semibold text-cyan-300 hover:bg-white/[0.06] transition-colors"
          >
            {copied ? (
              <Check className="h-3.5 w-3.5 text-emerald-400" />
            ) : (
              <Copy className="h-3 w-3 text-slate-400" />
            )}
            <span>{address.slice(0, 6)}...{address.slice(-4)}</span>
          </button>

          <a
            href={explorerUrl}
            target="_blank"
            rel="noopener noreferrer"
            title="View on Explorer"
            className="rounded-lg p-1.5 text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors"
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </a>

          <button
            onClick={() => disconnect()}
            title="Disconnect Wallet"
            className="rounded-lg p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
          >
            <LogOut className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <Button
      onClick={() => connect({ connector: connectors[0] })}
      className="rounded-xl bg-cyan-400 px-4 py-2 text-xs sm:text-sm font-bold text-slate-950 hover:bg-cyan-300 active:scale-95 transition-all shadow-sm"
    >
      <Wallet className="mr-2 h-4 w-4 text-slate-950" />
      Connect Wallet
    </Button>
  );
}
