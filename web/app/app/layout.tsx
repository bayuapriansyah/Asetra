"use client";

import { useRole } from "@/lib/context/RoleContext";
import { RoleSelector } from "@/components/role/RoleSelector";
import { useAccount } from "wagmi";
import { Wallet, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { isRoleSelected } = useRole();
  const { isConnected, isConnecting } = useAccount();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center px-4">
        <div className="web3-card rounded-2xl p-12 text-center max-w-md">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
            <Wallet className="h-7 w-7" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Connect Your Wallet</h3>
          <p className="text-sm text-slate-400 mb-6">
            Connect your Web3 wallet on Bohr Chain Testnet to continue.
          </p>
          <p className="text-xs font-mono text-cyan-400">
            Click &quot;Connect Wallet&quot; in the navigation bar above.
          </p>
        </div>
      </div>
    );
  }

  if (!isRoleSelected) {
    return <RoleSelector />;
  }

  return <>{children}</>;
}
