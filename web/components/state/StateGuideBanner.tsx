"use client";

import { AssetState } from "@/types/asset";
import type { Role } from "@/lib/context/RoleContext";
import {
  STATE_FLOW,
  STATE_FLOW_LABELS,
  getStateActions,
  isActionAvailable,
  INVESTOR_ACTIONS,
  ISSUER_ACTIONS,
} from "@/lib/utils/stateActions";
import { CheckCircle2, Lock, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

const STATE_COLORS: Record<number, string> = {
  [AssetState.CREATED]: "bg-slate-700",
  [AssetState.VERIFIED]: "bg-cyan-600",
  [AssetState.TOKENIZED]: "bg-teal-600",
  [AssetState.LISTED]: "bg-cyan-400",
  [AssetState.ACTIVE]: "bg-emerald-500",
  [AssetState.MATURED]: "bg-sky-500",
  [AssetState.SETTLED]: "bg-slate-500",
};

const STATE_COLORS_TEXT: Record<number, string> = {
  [AssetState.CREATED]: "text-slate-400",
  [AssetState.VERIFIED]: "text-cyan-400",
  [AssetState.TOKENIZED]: "text-teal-400",
  [AssetState.LISTED]: "text-cyan-300",
  [AssetState.ACTIVE]: "text-emerald-400",
  [AssetState.MATURED]: "text-sky-400",
  [AssetState.SETTLED]: "text-slate-400",
};

export function StateGuideBanner({
  assetState,
  role,
}: {
  assetState: AssetState;
  role: Role;
}) {
  const [expanded, setExpanded] = useState(false);
  const { available, locked } = getStateActions(assetState, role);
  const actions = role === "issuer" ? ISSUER_ACTIONS : INVESTOR_ACTIONS;

  const currentIndex = STATE_FLOW.indexOf(assetState);
  if (currentIndex === -1) return null;

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-slate-950/80 p-4 mb-6">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center justify-between w-full text-left"
      >
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            {STATE_FLOW.map((s, i) => (
              <div key={s} className="flex items-center">
                <div
                  className={`h-2 w-8 rounded-full transition-all ${
                    i <= currentIndex
                      ? STATE_COLORS[s]
                      : "bg-slate-800"
                  }`}
                />
              </div>
            ))}
          </div>
          <span className={`text-xs font-bold ml-2 ${STATE_COLORS_TEXT[assetState]}`}>
            {STATE_FLOW_LABELS[assetState]}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {available.length > 0 && (
            <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
              {available.length} available
            </span>
          )}
          {locked.length > 0 && (
            <span className="text-[10px] font-bold text-slate-500 bg-slate-800 px-2 py-0.5 rounded-full">
              {locked.length} locked
            </span>
          )}
          {expanded ? (
            <ChevronUp className="h-4 w-4 text-slate-400" />
          ) : (
            <ChevronDown className="h-4 w-4 text-slate-400" />
          )}
        </div>
      </button>

      {expanded && (
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {available.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                Available Now
              </p>
              {available.map(({ key, info }) => (
                <div
                  key={key}
                  className="flex items-center gap-2 text-xs text-emerald-300"
                >
                  <CheckCircle2 className="h-3 w-3 shrink-0" />
                  <span>{info.label}</span>
                </div>
              ))}
            </div>
          )}
          {locked.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Locked
              </p>
              {locked.map(({ key, info }) => (
                <div
                  key={key}
                  className="flex items-center gap-2 text-xs text-slate-500"
                >
                  <Lock className="h-3 w-3 shrink-0" />
                  <span>
                    {info.label}{" "}
                    <span className="text-slate-600">({info.description})</span>
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
