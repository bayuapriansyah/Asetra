"use client";

import { type ReactNode } from "react";
import { Sidebar } from "./Sidebar";

export function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#000000] text-slate-100 relative">
      {/* Subtle architectural grid pattern */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute inset-0 bg-web3-grid opacity-15" />
      </div>

      <div className="relative z-10">
        <Sidebar />
        <main className="pt-4 pb-6 lg:pl-64 lg:pt-6 lg:pb-12">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
