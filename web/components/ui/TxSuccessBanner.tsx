"use client";

import { ExternalLink, CheckCircle2, X } from "lucide-react";

const EXPLORER_BASE = process.env.NEXT_PUBLIC_BOT_EXPLORER_URL || "https://scan.bohr.life";

export function TxSuccessBanner({
  txHash,
  message,
  onDismiss,
}: {
  txHash: string | null;
  message?: string;
  onDismiss: () => void;
}) {
  if (!txHash) return null;
  return (
    <div className="mb-4 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-2">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <span>{message || "Transaction confirmed!"}</span>
            <a
              href={`${EXPLORER_BASE}/tx/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-2 inline-flex items-center gap-1 font-medium text-green-800 underline hover:text-green-900"
            >
              View on Explorer <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
        <button onClick={onDismiss} className="ml-2 shrink-0 text-green-400 hover:text-green-600">
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
