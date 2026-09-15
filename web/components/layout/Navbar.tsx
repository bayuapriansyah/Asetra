"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ConnectButton } from "@/components/wallet/ConnectButton";
import { useRole, ROLE_LABELS, ROLE_ICONS, type Role } from "@/lib/context/RoleContext";
import { Layers, ChevronDown, X, ShieldCheck, Coins, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useRef, useEffect } from "react";

const ROLE_BADGE_STYLES: Record<Role, { bg: string; text: string; border: string }> = {
  admin: { bg: "bg-blue-500/10", text: "text-blue-400", border: "border-blue-500/30" },
  issuer: { bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/30" },
  investor: { bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/30" },
};

const ROLE_OPTIONS: { id: Role; label: string; icon: React.ElementType; desc: string }[] = [
  { id: "admin", label: "Admin", icon: ShieldCheck, desc: "Verify & monitor" },
  { id: "issuer", label: "Issuer", icon: Coins, desc: "Create & tokenize" },
  { id: "investor", label: "Investor", icon: TrendingUp, desc: "Buy & trade" },
];

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const isApp = pathname.startsWith("/app");
  const { role, setRole, clearRole, isRoleSelected } = useRole();
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowRoleMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const badge = role ? ROLE_BADGE_STYLES[role] : null;
  const RoleIcon = role ? ROLE_ICONS[role] : null;

  return (
    <nav className="sticky top-0 z-50 border-b border-white/[0.08] bg-[#080a0f]/85 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-8xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand */}
        <div className="flex items-center gap-6">
          <Link href="/" className="group flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 border border-white/[0.12] text-cyan-400 transition-all duration-200 group-hover:border-cyan-400/50">
              <Layers className="h-5 w-5 transition-transform duration-300 group-hover:rotate-6" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-extrabold tracking-tight text-white font-sans">
                Asset<span className="text-cyan-400">Flow</span>
              </span>
              <span className="hidden sm:inline-block rounded-md border border-cyan-500/20 bg-cyan-500/10 px-1.5 py-0.5 text-[10px] font-mono font-medium tracking-wider text-cyan-300">
                RWA
              </span>
            </div>
          </Link>

          {/* Quick links */}
          <div className="hidden md:flex items-center gap-1 text-sm font-medium text-slate-400">
            <Link
              href="/app/marketplace"
              className={cn(
                "rounded-lg px-3 py-1.5 transition-colors hover:text-white hover:bg-white/[0.04]",
                pathname === "/app/marketplace" && "text-cyan-400 bg-cyan-500/10"
              )}
            >
              Marketplace
            </Link>
            <Link
              href="/app/yield"
              className={cn(
                "rounded-lg px-3 py-1.5 transition-colors hover:text-white hover:bg-white/[0.04]",
                pathname === "/app/yield" && "text-cyan-400 bg-cyan-500/10"
              )}
            >
              Yield
            </Link>
            <Link
              href="/app/borrow"
              className={cn(
                "rounded-lg px-3 py-1.5 transition-colors hover:text-white hover:bg-white/[0.04]",
                pathname === "/app/borrow" && "text-cyan-400 bg-cyan-500/10"
              )}
            >
              Borrow
            </Link>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          {/* Network Pill */}
          <div className="hidden sm:flex items-center gap-2 rounded-full border border-white/[0.08] bg-slate-900/80 px-3 py-1 text-xs font-mono text-slate-300">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            <span className="font-medium text-slate-200">Bohr</span>
            <span className="text-slate-500">· 968</span>
          </div>

          {/* Role Switcher */}
          {isApp && isRoleSelected && role && badge && (
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setShowRoleMenu(!showRoleMenu)}
                className={`flex items-center gap-2 rounded-full border ${badge.border} ${badge.bg} px-3 py-1.5 text-xs font-bold uppercase tracking-wider ${badge.text} transition-all hover:brightness-110`}
              >
                <span>{RoleIcon && <RoleIcon className="h-3.5 w-3.5" />}</span>
                <span className="hidden sm:inline">{ROLE_LABELS[role]}</span>
                <ChevronDown className={cn("h-3 w-3 transition-transform", showRoleMenu && "rotate-180")} />
              </button>

              {showRoleMenu && (
                <div className="absolute right-0 top-full mt-2 w-56 rounded-xl border border-white/[0.1] bg-[#0a0e17] shadow-2xl p-1.5">
                  <div className="px-3 py-2 mb-1">
                    <p className="text-[10px] font-mono uppercase tracking-wider text-slate-500">Switch Role</p>
                  </div>
                  {ROLE_OPTIONS.map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => {
                        setRole(opt.id);
                        setShowRoleMenu(false);
                        router.push("/app");
                      }}
                      className={cn(
                        "w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors",
                        role === opt.id
                          ? "bg-white/[0.06] text-white"
                          : "text-slate-400 hover:bg-white/[0.04] hover:text-slate-100"
                      )}
                    >
                      <span className="text-base"><opt.icon className="h-4 w-4" /></span>
                      <div>
                        <div className="text-xs font-bold">{opt.label}</div>
                        <div className="text-[10px] text-slate-500">{opt.desc}</div>
                      </div>
                      {role === opt.id && (
                        <div className="ml-auto h-1.5 w-1.5 rounded-full bg-cyan-400" />
                      )}
                    </button>
                  ))}
                  <div className="border-t border-white/[0.06] mt-1 pt-1">
                    <button
                      onClick={() => {
                        clearRole();
                        setShowRoleMenu(false);
                        router.push("/app");
                      }}
                      className="w-full flex items-center gap-2 rounded-lg px-3 py-2 text-left text-xs text-slate-500 hover:text-red-400 hover:bg-red-500/5 transition-colors"
                    >
                      <X className="h-3 w-3" />
                      <span>Clear Role</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {!isApp && (
            <Link
              href="/app"
              className="hidden sm:inline-flex items-center gap-1.5 rounded-lg border border-cyan-500/40 bg-cyan-500/10 px-3.5 py-1.5 text-xs font-semibold text-cyan-300 transition-all hover:bg-cyan-500/20 hover:border-cyan-400"
            >
              Launch App
            </Link>
          )}

          <ConnectButton />
        </div>
      </div>
    </nav>
  );
}
