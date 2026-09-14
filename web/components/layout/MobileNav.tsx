"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useRole, type Role } from "@/lib/context/RoleContext";
import {
  LayoutDashboard,
  Store,
  Briefcase,
  TrendingUp,
  Landmark,
  ShieldCheck,
  Activity,
} from "lucide-react";

interface MobileNavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  roles: Role[];
}

const navItems: MobileNavItem[] = [
  { label: "Home", href: "/app", icon: LayoutDashboard, roles: ["admin", "issuer", "investor"] },
  { label: "Verify", href: "/app/admin/verify", icon: ShieldCheck, roles: ["admin"] },
  { label: "Market", href: "/app/marketplace", icon: Store, roles: ["issuer", "investor"] },
  { label: "Portfolio", href: "/app/portfolio", icon: Briefcase, roles: ["investor"] },
  { label: "Yield", href: "/app/yield", icon: TrendingUp, roles: ["investor"] },
  { label: "Borrow", href: "/app/borrow", icon: Landmark, roles: ["investor"] },
  { label: "Activity", href: "/app/activity", icon: Activity, roles: ["admin", "issuer", "investor"] },
];

export function MobileNav() {
  const pathname = usePathname();
  const { role } = useRole();

  const filtered = navItems.filter((item) => role && item.roles.includes(role));

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/[0.08] bg-[#0a0e17]/90 backdrop-blur-xl lg:hidden">
      <div className="flex items-center justify-around py-2.5 px-2">
        {filtered.map((item) => {
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
                "flex flex-col items-center gap-1 px-2.5 py-1 text-[11px] font-medium transition-colors",
                isActive
                  ? "text-cyan-400 font-semibold"
                  : "text-slate-400 hover:text-slate-200"
              )}
            >
              <Icon className={cn("h-4 w-4", isActive && "text-cyan-400")} />
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
