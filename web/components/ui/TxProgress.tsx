"use client";

import { Loader2, CheckCircle2 } from "lucide-react";

type TxStep = "preparing" | "waiting" | "pending" | "confirmed" | "error" | "idle";

interface TxProgressProps {
  step: TxStep;
}

const STEPS: { key: TxStep; label: string }[] = [
  { key: "preparing", label: "Preparing" },
  { key: "waiting", label: "Waiting for Wallet" },
  { key: "pending", label: "Confirming on-chain" },
  { key: "confirmed", label: "Confirmed" },
];

export function TxProgress({ step }: TxProgressProps) {
  if (step === "idle" || step === "error") return null;

  const activeIndex = STEPS.findIndex((s) => s.key === step);

  return (
    <div className="flex items-center gap-1">
      {STEPS.map((s, i) => {
        const isActive = i === activeIndex;
        const isDone = i < activeIndex;
        return (
          <div key={s.key} className="flex items-center gap-1">
            {i > 0 && <div className={`h-px w-4 ${isDone ? "bg-green-400" : "bg-gray-300"}`} />}
            <div className="flex items-center gap-1">
              {isDone ? (
                <CheckCircle2 className="h-3 w-3 text-green-500" />
              ) : isActive ? (
                <Loader2 className="h-3 w-3 animate-spin text-blue-600" />
              ) : (
                <div className="h-3 w-3 rounded-full border border-gray-300" />
              )}
              <span className={`text-xs ${isActive ? "font-medium text-blue-700" : isDone ? "text-green-600" : "text-gray-400"}`}>
                {s.label}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
