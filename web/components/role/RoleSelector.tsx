"use client";

import { useRole, type Role } from "@/lib/context/RoleContext";
import { ShieldCheck, Coins, TrendingUp, ArrowRight } from "lucide-react";

const roles: {
  id: Role;
  label: string;
  icon: React.ElementType;
  color: string;
  border: string;
  glow: string;
  desc: string;
  features: string[];
}[] = [
  {
    id: "admin",
    label: "Admin",
    icon: ShieldCheck,
    color: "text-blue-400",
    border: "border-blue-500/30 hover:border-blue-400/60",
    glow: "hover:shadow-[0_0_20px_rgba(59,130,246,0.15)]",
    desc: "Verify assets & monitor protocol",
    features: ["Verify asset documents", "Monitor all activity", "View settlement reports"],
  },
  {
    id: "issuer",
    label: "Issuer",
    icon: Coins,
    color: "text-emerald-400",
    border: "border-emerald-500/30 hover:border-emerald-400/60",
    glow: "hover:shadow-[0_0_20px_rgba(16,185,129,0.15)]",
    desc: "Create, tokenize & list assets",
    features: ["Originate new RWAs", "Tokenize into positions", "List on marketplace"],
  },
  {
    id: "investor",
    label: "Investor",
    icon: TrendingUp,
    color: "text-amber-400",
    border: "border-amber-500/30 hover:border-amber-400/60",
    glow: "hover:shadow-[0_0_20px_rgba(245,158,11,0.15)]",
    desc: "Buy, trade, yield & borrow",
    features: ["Invest in assets", "Earn on-chain yield", "Collateralize & borrow"],
  },
];

export function RoleSelector() {
  const { setRole } = useRole();

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4">
      <div className="w-full max-w-3xl">
        {/* Header */}
        <div className="mb-10 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-4 py-1.5 mb-6">
            <span className="h-2 w-2 rounded-full bg-cyan-400" />
            <span className="text-xs font-mono font-bold tracking-widest text-cyan-300 uppercase">
              Session Mode
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white mb-3">
            Select Your Role
          </h1>
          <p className="text-sm text-slate-400 max-w-md mx-auto">
            Same wallet, different perspectives. Choose how you want to interact
            with the protocol this session.
          </p>
        </div>

        {/* Role Cards */}
        <div className="grid gap-4 sm:grid-cols-3">
          {roles.map((r) => {
            const Icon = r.icon;
            return (
              <button
                key={r.id}
                onClick={() => setRole(r.id)}
                className={`group relative rounded-2xl border ${r.border} bg-slate-900/60 p-6 text-left transition-all duration-200 hover:-translate-y-1 hover:bg-slate-900/90`}
              >
                {/* Icon */}
                <div
                  className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-white/[0.08] bg-slate-800/80 ${r.color} transition-colors group-hover:scale-105`}
                >
                  <Icon className="h-6 w-6" />
                </div>

                {/* Label */}
                <h3 className="text-lg font-bold text-white mb-1">{r.label}</h3>
                <p className="text-xs text-slate-400 mb-4">{r.desc}</p>

                {/* Features */}
                <ul className="space-y-2 mb-5">
                  {r.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-xs text-slate-300">
                      <span className={`h-1 w-1 rounded-full ${r.color.replace("text-", "bg-")}`} />
                      {f}
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <div className={`flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider ${r.color}`}>
                  <span>Select {r.label}</span>
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                </div>
              </button>
            );
          })}
        </div>

        {/* Hint */}
        <p className="mt-8 text-center text-xs text-slate-500">
          You can switch roles anytime from the navbar.
        </p>
      </div>
    </div>
  );
}
