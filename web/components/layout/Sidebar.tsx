"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useRole, ROLE_LABELS, ROLE_ICONS, type Role } from "@/lib/context/RoleContext";
import {
  LayoutDashboard,
  Store,
  Briefcase,
  TrendingUp,
  ArrowLeftRight,
  Landmark,
  Banknote,
  PlusCircle,
  FileStack,
  Activity,
  Settings,
  ShieldCheck,
  ExternalLink,
} from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
  roles: Role[];
}

const navSections: { title: string; items: NavItem[] }[] = [
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

const ROLE_BADGE_STYLES: Record<Role, { bg: string; text: string; border: string }> = {
  admin: { bg: "bg-blue-500/10", text: "text-blue-400", border: "border-blue-500/20" },
  issuer: { bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/20" },
  investor: { bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/20" },
};

export function Sidebar() {
  const pathname = usePathname();
  const { role } = useRole();

  const filteredSections = navSections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => role && item.roles.includes(role)),
    }))
    .filter((section) => section.items.length > 0);

  const badge = role ? ROLE_BADGE_STYLES[role] : null;
  const RoleIcon = role ? ROLE_ICONS[role] : null;

  return (
    <aside className="fixed left-0 top-16 z-40 hidden h-[calc(100vh-4rem)] w-64 border-r border-white/[0.08] bg-[#111214] lg:block">
      <div className="flex h-full flex-col justify-between overflow-y-auto p-4">
        <div className="space-y-6">
          {/* Role Badge */}

          {filteredSections.map((section) => (
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
                        "group relative flex items-center justify-between rounded-xl px-3 py-2 text-sm font-medium transition-all duration-200",
                        isActive
                          ? "bg-cyan-500/10 text-cyan-300 font-semibold border-l-2 border-cyan-400 pl-[10px]"
                          : "text-slate-400 hover:bg-white/[0.04] hover:text-slate-100"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <Icon
                          className={cn(
                            "h-4 w-4 transition-colors",
                            isActive
                              ? "text-cyan-400"
                              : "text-slate-400 group-hover:text-slate-200"
                          )}
                        />
                        <span>{item.label}</span>
                      </div>
                      {item.badge && (
                        <span className="rounded-md bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-mono font-semibold text-emerald-400">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Network & Contract Status Card */}
        <div className="pt-4 border-t border-white/[0.06]">
          <div className="rounded-xl border border-white/[0.08] bg-[#16181b] p-3 text-xs">
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
              Programmable RWA state engine running on Bohr Chain.
            </p>
            <a
              href="https://scan.bohr.life"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[11px] font-mono text-cyan-400 hover:text-cyan-300 hover:underline"
            >
              <span>scan.bohr.life</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
      </div>
    </aside>
  );
}
