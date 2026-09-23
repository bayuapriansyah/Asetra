"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ConnectButton } from "@/components/wallet/ConnectButton";
import { useRole, ROLE_LABELS, ROLE_ICONS, type Role } from "@/lib/context/RoleContext";
import {
  Menu,
  ChevronDown,
  X,
  ShieldCheck,
  Coins,
  TrendingUp,
  LayoutDashboard,
  Store,
  Briefcase,
  ArrowLeftRight,
  Landmark,
  Banknote,
  PlusCircle,
  FileStack,
  Activity,
  Settings,
  ExternalLink,
} from "lucide-react";
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

interface MobileNavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  roles: Role[];
}

const MOBILE_NAV_SECTIONS: { title: string; items: MobileNavItem[] }[] = [
  {
    title: "OVERVIEW",
    items: [
      { label: "Dashboard", href: "/app", icon: LayoutDashboard, roles: ["admin", "issuer", "investor"] },
    ],
  },
  {
    title: "MARKETS",
    items: [
      { label: "Marketplace", href: "/app/marketplace", icon: Store, roles: ["issuer", "investor"] },
      { label: "Secondary P2P", href: "/app/trading", icon: ArrowLeftRight, roles: ["investor"] },
    ],
  },
  {
    title: "PORTFOLIO & YIELD",
    items: [
      { label: "My Positions", href: "/app/portfolio", icon: Briefcase, roles: ["issuer", "investor"] },
      { label: "Yield & Staking", href: "/app/yield", icon: TrendingUp, roles: ["investor"] },
    ],
  },
  {
    title: "DEFI CREDIT",
    items: [
      { label: "Collateral Vault", href: "/app/collateral", icon: Landmark, roles: ["investor"] },
      { label: "Borrow Credit", href: "/app/borrow", icon: Banknote, roles: ["investor"] },
    ],
  },
  {
    title: "RWA ISSUER",
    items: [
      { label: "Tokenize Asset", href: "/app/issuer/create", icon: PlusCircle, roles: ["issuer"] },
      { label: "My Offerings", href: "/app/issuer/assets", icon: FileStack, roles: ["issuer"] },
    ],
  },
  {
    title: "PROTOCOL",
    items: [
      { label: "Verification Queue", href: "/app/admin/verify", icon: ShieldCheck, roles: ["admin"] },
      { label: "On-Chain Activity", href: "/app/activity", icon: Activity, roles: ["admin", "issuer", "investor"] },
      { label: "Settings & RPC", href: "/app/settings", icon: Settings, roles: ["admin", "issuer", "investor"] },
    ],
  },
];

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const isApp = pathname.startsWith("/app");
  const { role, setRole, clearRole, isRoleSelected } = useRole();
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showMobileDrawer, setShowMobileDrawer] = useState(false);
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

  // Close drawer on route change
  useEffect(() => {
    setShowMobileDrawer(false);
  }, [pathname]);

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (showMobileDrawer) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [showMobileDrawer]);

  const badge = role ? ROLE_BADGE_STYLES[role] : null;
  const RoleIcon = role ? ROLE_ICONS[role] : null;

  const filteredMobileSections = MOBILE_NAV_SECTIONS
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => role && item.roles.includes(role)),
    }))
    .filter((section) => section.items.length > 0);

  return (
    <>
      <nav className="sticky top-0 z-50 border-b border-white/[0.08] bg-[#111214]/95 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-8xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Left: Hamburger + Brand */}
          <div className="flex items-center gap-4">
            {/* Hamburger - mobile only */}
            {isApp && isRoleSelected && (
              <button
                onClick={() => setShowMobileDrawer(true)}
                className="lg:hidden flex items-center justify-center h-9 w-9 rounded-lg border border-white/[0.08] bg-slate-900/60 text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors"
              >
                <Menu className="h-5 w-5" />
              </button>
            )}

            <Link href="/" className="group flex items-center gap-3">
              <img src="/Asetra.png" alt="Asetra" className="h-9 w-9 object-contain" />
              <div className="flex items-center gap-2">
                <span className="text-lg font-extrabold tracking-tight text-white font-sans">
                  <span className="text-cyan-400">Asetra</span>
                </span>
                <span className="hidden sm:inline-block rounded-md border border-cyan-500/20 bg-cyan-500/10 px-1.5 py-0.5 text-[10px] font-mono font-medium tracking-wider text-cyan-300">
                  RWA
                </span>
              </div>
            </Link>

            {/* Quick links - desktop only */}
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
              <span className="font-medium text-slate-200">BOT Chain</span>
              <span className="text-slate-500">· 677</span>
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
                  <div className="absolute right-0 top-full mt-2 w-56 rounded-xl border border-white/[0.1] bg-[#111214] shadow-2xl p-1.5">
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

      {/* Mobile Drawer Overlay */}
      {showMobileDrawer && (
        <div className="fixed inset-0 z-[60] lg:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowMobileDrawer(false)}
          />

          {/* Drawer */}
          <div className="absolute left-0 top-0 h-full w-72 bg-[#111214] border-r border-white/[0.08] shadow-2xl overflow-y-auto">
            {/* Drawer Header */}
            <div className="flex items-center justify-between px-4 h-16 border-b border-white/[0.08]">
              <Link href="/" className="flex items-center gap-2.5" onClick={() => setShowMobileDrawer(false)}>
                <img src="/Asetra.png" alt="Asetra" className="h-8 w-8 object-contain" />
                <span className="text-base font-extrabold text-white">
                  <span className="text-cyan-400">Asetra</span>
                </span>
              </Link>
              <button
                onClick={() => setShowMobileDrawer(false)}
                className="flex items-center justify-center h-8 w-8 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Role Badge */}
            {role && badge && (
              <div className="mx-4 mt-4">
                <div className={`rounded-xl border ${badge.border} ${badge.bg} px-3 py-2.5 flex items-center gap-2.5`}>
                  <span>{RoleIcon && <RoleIcon className="h-4 w-4" />}</span>
                  <div>
                    <div className={`text-xs font-bold uppercase tracking-wider ${badge.text}`}>
                      {ROLE_LABELS[role]}
                    </div>
                    <div className="text-[10px] text-slate-500">Session Role</div>
                  </div>
                </div>
              </div>
            )}

            {/* Nav Sections */}
            <div className="px-3 mt-4 space-y-5 pb-6">
              {filteredMobileSections.map((section) => (
                <div key={section.title} className="space-y-1">
                  <h3 className="px-3 text-[11px] font-mono font-semibold uppercase tracking-wider text-slate-500">
                    {section.title}
                  </h3>
                  <div className="space-y-0.5 pt-1">
                    {section.items.map((item) => {
                      const isActive =
                        item.href === "/app"
                          ? pathname === "/app"
                          : pathname.startsWith(item.href);
                      const Icon = item.icon;
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          className={cn(
                            "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                            isActive
                              ? "bg-cyan-500/10 text-cyan-300 font-semibold"
                              : "text-slate-400 hover:bg-white/[0.04] hover:text-slate-100"
                          )}
                        >
                          <Icon
                            className={cn(
                              "h-4 w-4 transition-colors",
                              isActive ? "text-cyan-400" : "text-slate-400"
                            )}
                          />
                          <span>{item.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Bottom Card */}
            <div className="mx-4 mb-4 mt-auto">
              <div className="rounded-xl border border-white/[0.08] bg-slate-900/60 p-3 text-xs">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5 font-semibold text-slate-200">
                    <ShieldCheck className="h-3.5 w-3.5 text-cyan-400" />
                    <span>Asetra Core</span>
                  </div>
                  <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-1.5 py-0.5 text-[9px] font-mono font-medium text-emerald-400">
                    Verified
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mb-2">
                  Programmable RWA state engine on BOT Chain.
                </p>
                <a
                  href="https://scan.botchain.ai"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] font-mono text-cyan-400 hover:text-cyan-300 hover:underline"
                >
                  <span>scan.botchain.ai</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
