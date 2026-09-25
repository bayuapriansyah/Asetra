"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { Reveal } from "@/components/landing/Reveal";
import { RevealCard } from "@/components/landing/RevealCard";
import { LandingNavbar } from "@/components/landing/LandingNavbar";
import { getAsetraAddress } from "@/config/contracts";
import RotatingEarth from "@/components/ui/wireframe-dotted-globe";
import { SpotlightCard } from "spotlight-card";

import {
  ArrowRight,
  Shield,
  TrendingUp,
  Layers,
  Zap,
  CheckCircle,
  FileText,
  Banknote,
  BarChart3,
  ArrowUpRight,
  Globe,
  ShieldCheck,
  Landmark,
  Cpu,
  Lock,
  Repeat,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Data                                                               */
/* ------------------------------------------------------------------ */

const stats = [
  { value: "$10.4M+", label: "Volume processed" },
  { value: "8.4–14.2%", label: "Target APY range" },
  { value: "< 1.5s", label: "BOT block finality" },
  { value: "100%", label: "On-chain state machine" },
];

const lifecycleSteps = [
  { num: "01", label: "Create", state: "Origination", icon: FileText, detail: "Issuer submits asset documents and terms" },
  { num: "02", label: "Verify", state: "Admin audit", icon: Shield, detail: "Admin verifies document hash on-chain" },
  { num: "03", label: "Tokenize", state: "Fractionalize", icon: Layers, detail: "Face value split into tradeable tokens" },
  { num: "04", label: "List", state: "Discovery", icon: BarChart3, detail: "Asset appears in the marketplace" },
  { num: "05", label: "Invest", state: "Liquidity", icon: Banknote, detail: "Investors purchase tokens with tUSDT" },
  { num: "06", label: "Active", state: "Yield engine", icon: Zap, detail: "Holding Score multiplier begins accruing" },
  { num: "07", label: "Mature", state: "Redemption", icon: TrendingUp, detail: "Issuer triggers maturity payout" },
  { num: "08", label: "Settle", state: "Disbursement", icon: CheckCircle, detail: "Principal plus yield distributed to holders" },
];

const assetClasses = [
  {
    name: "InvoiceFi",
    tag: "SHORT-TERM",
    apy: "8.4%",
    description:
      "Verified commercial invoices financing real working capital — the fastest, lowest-duration instrument in the protocol.",
  },
  {
    name: "TradeFi",
    tag: "RECEIVABLES",
    apy: "9.6%",
    description:
      "Trade receivables with cryptographic proof of counterparty and immutable document hashes on BOT Chain.",
  },
  {
    name: "EquipmentFi",
    tag: "MID-TERM",
    apy: "12.1%",
    description:
      "Equipment leases and asset-backed credit with configurable fractionalization and automated maturity.",
  },
  {
    name: "PrivateCredit",
    tag: "YIELD ENGINE",
    apy: "14.2%",
    description:
      "Private debt positions that become DeFi collateral — borrow at 60% LTV or trade on the P2P secondary.",
  },
];

const marketListings = [
  {
    tag: "Invoice · 45d",
    name: "PT Nusantara Textile — Receivables",
    apy: "9.6%",
    minTicket: "500 tUSDT",
    funded: "72%",
  },
  {
    tag: "Trade · 90d",
    name: "Borneo Palm Oil — Export Finance",
    apy: "11.2%",
    minTicket: "1,000 tUSDT",
    funded: "38%",
  },
  {
    tag: "Equipment · 180d",
    name: "Fleet Leasing Pool — Logistics",
    apy: "8.1%",
    minTicket: "250 tUSDT",
    funded: "84%",
  },
  {
    tag: "Credit · 365d",
    name: "Senior Secured — Private Credit",
    apy: "14.2%",
    minTicket: "2,500 tUSDT",
    funded: "21%",
  },
];

/* ------------------------------------------------------------------ */
/*  Abstract SVG — floating connected blocks                           */
/* ------------------------------------------------------------------ */

function AbstractSVG() {
  return (
    <div className="relative w-full max-w-lg mx-auto lg:mx-0">
      {/* Background glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(circle at 50% 50%, rgba(19,109,228,0.08) 0%, transparent 65%)",
          filter: "blur(40px)",
        }}
      />
      <svg
        viewBox="0 0 400 360"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="relative w-full h-auto"
      >
        {/* Connecting lines */}
        <line x1="100" y1="80" x2="300" y2="80" stroke="url(#lineGrad)" strokeWidth="1.5" opacity="0.5" />
        <line x1="100" y1="80" x2="100" y2="260" stroke="url(#lineGrad)" strokeWidth="1.5" opacity="0.5" />
        <line x1="300" y1="80" x2="300" y2="260" stroke="url(#lineGrad)" strokeWidth="1.5" opacity="0.5" />
        <line x1="100" y1="260" x2="300" y2="260" stroke="url(#lineGrad)" strokeWidth="1.5" opacity="0.5" />
        <line x1="100" y1="80" x2="300" y2="260" stroke="url(#lineGrad)" strokeWidth="1" opacity="0.3" />
        <line x1="300" y1="80" x2="100" y2="260" stroke="url(#lineGrad)" strokeWidth="1" opacity="0.3" />

        {/* Block 1 — top left (InvoiceFi) */}
        <g className="lp-float" style={{ animationDelay: "0s" }}>
          <rect x="55" y="40" width="90" height="78" rx="12" fill="#080f20" stroke="rgba(74,158,255,0.4)" strokeWidth="1.5" />
          <rect x="55" y="40" width="90" height="78" rx="12" fill="url(#blockGlow1)" />
          <text x="100" y="72" textAnchor="middle" fill="#4a9eff" fontSize="11" fontWeight="700" fontFamily="Space Grotesk, sans-serif">INV</text>
          <text x="100" y="92" textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize="9" fontFamily="Space Grotesk, sans-serif">$100K</text>
        </g>

        {/* Block 2 — top right (TradeFi) */}
        <g className="lp-float lp-float-delay-1">
          <rect x="255" y="40" width="90" height="78" rx="12" fill="#080f20" stroke="rgba(74,158,255,0.4)" strokeWidth="1.5" />
          <rect x="255" y="40" width="90" height="78" rx="12" fill="url(#blockGlow2)" />
          <text x="300" y="72" textAnchor="middle" fill="#4a9eff" fontSize="11" fontWeight="700" fontFamily="Space Grotesk, sans-serif">TRD</text>
          <text x="300" y="92" textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize="9" fontFamily="Space Grotesk, sans-serif">$250K</text>
        </g>

        {/* Block 3 — bottom left (EquipmentFi) */}
        <g className="lp-float lp-float-delay-2">
          <rect x="55" y="220" width="90" height="78" rx="12" fill="#080f20" stroke="rgba(74,158,255,0.4)" strokeWidth="1.5" />
          <rect x="55" y="220" width="90" height="78" rx="12" fill="url(#blockGlow3)" />
          <text x="100" y="252" textAnchor="middle" fill="#4a9eff" fontSize="11" fontWeight="700" fontFamily="Space Grotesk, sans-serif">EQP</text>
          <text x="100" y="272" textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize="9" fontFamily="Space Grotesk, sans-serif">$500K</text>
        </g>

        {/* Block 4 — bottom right (PrivateCredit) */}
        <g className="lp-float lp-float-delay-3">
          <rect x="255" y="220" width="90" height="78" rx="12" fill="#080f20" stroke="rgba(74,158,255,0.4)" strokeWidth="1.5" />
          <rect x="255" y="220" width="90" height="78" rx="12" fill="url(#blockGlow4)" />
          <text x="300" y="252" textAnchor="middle" fill="#4a9eff" fontSize="11" fontWeight="700" fontFamily="Space Grotesk, sans-serif">CRD</text>
          <text x="300" y="272" textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize="9" fontFamily="Space Grotesk, sans-serif">$1M</text>
        </g>

        {/* Center hub */}
        <circle cx="200" cy="170" r="28" fill="#080f20" stroke="rgba(74,158,255,0.5)" strokeWidth="1.5" />
        <circle cx="200" cy="170" r="28" fill="url(#centerGlow)" />
        <text x="200" y="167" textAnchor="middle" fill="#4a9eff" fontSize="9" fontWeight="700" fontFamily="Space Grotesk, sans-serif">A</text>
        <text x="200" y="180" textAnchor="middle" fill="rgba(255,255,255,0.35)" fontSize="7" fontFamily="Space Grotesk, sans-serif">PROTOCOL</text>

        {/* Gradients */}
        <defs>
          <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#136DE4" stopOpacity="0.6" />
            <stop offset="50%" stopColor="#4a9eff" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#136DE4" stopOpacity="0.6" />
          </linearGradient>
          <radialGradient id="blockGlow1" cx="50%" cy="0%" r="80%">
            <stop offset="0%" stopColor="rgba(19,109,228,0.15)" />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
          <radialGradient id="blockGlow2" cx="50%" cy="0%" r="80%">
            <stop offset="0%" stopColor="rgba(74,158,255,0.12)" />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
          <radialGradient id="blockGlow3" cx="50%" cy="100%" r="80%">
            <stop offset="0%" stopColor="rgba(19,109,228,0.12)" />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
          <radialGradient id="blockGlow4" cx="50%" cy="100%" r="80%">
            <stop offset="0%" stopColor="rgba(74,158,255,0.1)" />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
          <radialGradient id="centerGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(19,109,228,0.2)" />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
        </defs>
      </svg>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

const EXPLORER_BASE = process.env.NEXT_PUBLIC_BOT_EXPLORER_URL || "https://scan.botchain.ai";
const CONTRACT_URL = `${EXPLORER_BASE}/address/${getAsetraAddress(677)}`;

export default function LandingPage() {
  const [timelineProgress, setTimelineProgress] = useState(0);
  const [activeDots, setActiveDots] = useState<boolean[]>([]);
  const timelineRef = useRef<HTMLDivElement>(null);
  const dotRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const handleScroll = () => {
      if (!timelineRef.current) return;
      const rect = timelineRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      const sectionHeight = rect.height;

      // Calculate how far through the timeline we've scrolled
      const scrolled = windowHeight - rect.top;
      const total = sectionHeight + windowHeight;
      const progress = Math.min(1, Math.max(0, scrolled / total));
      setTimelineProgress(progress * 100);

      // Compute pixel position of the progress line tip from top of timeline
      const progressPx = progress * sectionHeight;

      // Mark each dot active if progress line has reached it
      const newActive = dotRefs.current.map((dotEl) => {
        if (!dotEl) return false;
        // dot center relative to top of the timeline container
        const dotRect = dotEl.getBoundingClientRect();
        const dotCenterRelative = dotRect.top - rect.top + dotRect.height / 2;
        return progressPx >= dotCenterRelative;
      });
      setActiveDots(newActive);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-[#0a0a0a] text-white">
      <LandingNavbar />

      {/* ── Hero ────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden lp-aurora px-6 pt-28 pb-20 md:pt-20 md:pb-28">
        <div className="absolute inset-0 lp-grid [mask-image:radial-gradient(ellipse_70%_60%_at_50%_0%,black,transparent)] opacity-40 pointer-events-none" />
        <div className="absolute inset-0 lp-dot-grid [mask-image:radial-gradient(ellipse_85%_75%_at_50%_35%,black,transparent)] opacity-60 pointer-events-none" />
        {/* Radial glow behind globe */}
        <div className="pointer-events-none absolute right-0 top-0 h-full w-1/2 [mask-image:radial-gradient(ellipse_80%_80%_at_80%_50%,black,transparent)]"
          style={{ background: "radial-gradient(ellipse 65% 75% at 82% 48%, rgba(19,109,228,0.22), transparent 70%)" }} />

        <div className="relative mx-auto flex max-w-7xl flex-col items-center gap-10 lg:flex-row lg:items-center lg:gap-6 min-h-[600px] xl:min-h-[680px]">
          {/* ── Left: copy ── */}
          <div className="flex-1 text-center lg:text-left z-10 max-w-2xl py-4">
            <Reveal delay={0.20}>
              <div className="inline-flex items-center gap-2.5 rounded-full border border-[rgba(100,160,255,0.15)] bg-[rgba(255,255,255,0.04)] px-4 py-1.5">
                <span className="lp-pulse h-2 w-2 rounded-full bg-[#4a9eff]" />
                <span className="text-[11px] font-bold tracking-[0.16em] text-[#4a9eff] uppercase" style={{ fontFamily: "var(--font-display)" }}>
                  Live on BOT Chain — Chain 677
                </span>
              </div>

              <h1 className="mt-7 text-5xl sm:text-6xl xl:text-7xl font-bold tracking-tight text-white leading-[1.06]" style={{ fontFamily: "var(--font-display)" }}>
                Real World Assets,
                <br />
                <span className="lp-text-gradient italic">programmable on-chain.</span>
              </h1>

              <p className="mt-6 mx-auto max-w-xl lg:mx-0 text-base sm:text-lg text-[rgba(255,255,255,0.55)] leading-relaxed" style={{ fontFamily: "var(--font-display)" }}>
                Asetra transforms verified invoices, receivables, and private credit into
                yield-bearing DeFi positions — with a deterministic on-chain state machine
                from origination to automated settlement.
              </p>

              <div className="mt-9 flex flex-wrap items-center justify-center lg:justify-start gap-4">
                <Link href="/app/marketplace" className="lp-btn-primary">
                  Explore Assets
                  <span className="lp-btn-arrow">
                    <ArrowRight className="h-4 w-4 text-[#0553DA]" />
                  </span>
                </Link>
                <Link href="/app" className="lp-btn-outline">
                  Open App
                  <span className="lp-btn-arrow">
                    <ArrowUpRight className="h-4 w-4 text-white" />
                  </span>
                </Link>
              </div>

            </Reveal>
          </div>

          {/* ── Right: globe (desktop: side column, mobile: large watermark cropped to bottom-right ~1/2 visible) ── */}
          <div className="absolute -bottom-70 -right-70 sm:-bottom-40 sm:-right-32 lg:static lg:bottom-auto lg:right-auto lg:flex-1 flex items-center justify-center lg:justify-end lg:w-full lg:-mr-10 xl:-mr-20 pointer-events-none lg:pointer-events-auto opacity-40 sm:opacity-50 lg:opacity-100 z-0 lg:z-auto transition-opacity duration-300">
            <Reveal delay={0.20} y={10}>
              <RotatingEarth size={580} mobileSize={560} className="flex justify-center lg:justify-end" />
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── Stats band ──────────────────────────────────────────────── */}
      <section className="border-t border-[rgba(100,160,255,0.08)] bg-[#0a0a0a] px-6 py-14">
        <Reveal>
          <div className="mx-auto flex max-w-5xl flex-col items-center sm:flex-row sm:justify-center">
            {stats.map((s, i) => (
              <div key={s.label} className="flex items-center">
                {i > 0 && <div className="lp-stat-divider hidden sm:block" />}
                <div className="text-center px-6 py-4 sm:py-0">
                  <div className="text-3xl sm:text-4xl font-bold lp-stat-value" style={{ fontFamily: "var(--font-display)" }}>{s.value}</div>
                  <div className="mt-2 text-[11px] font-bold uppercase tracking-[0.14em] text-[rgba(255,255,255,0.4)]" style={{ fontFamily: "var(--font-display)" }}>{s.label}</div>
                </div>
              </div>
            ))}
          </div>
        </Reveal>
      </section>

      {/* ── Lifecycle: Verified Asset Pipeline ──────────────────────── */}
      <section id="lifecycle" className="relative scroll-mt-20 border-t border-[rgba(100,160,255,0.08)] bg-[#0a0a0a] px-6 py-32">
        <div className="mx-auto max-w-5xl">
          <Reveal>
            <div className="text-center mb-20">
              <div className="lp-number-badge mb-5">
                <span className="badge-num">1</span>
                <span>Asset Lifecycle</span>
              </div>
              <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-white" style={{ fontFamily: "var(--font-display)" }}>
                Every asset follows a transparent,
                <br />
                <span className="lp-text-gradient italic">contract-enforced pipeline.</span>
              </h2>
              <p className="mt-6 mx-auto max-w-lg text-sm text-[rgba(255,255,255,0.45)]" style={{ fontFamily: "var(--font-display)" }}>
                Allowed transactions depend directly on the real-world milestone achieved — enforced by smart contracts, not promises.
              </p>
            </div>
          </Reveal>

          {/* Vertical timeline */}
          <div className="lp-timeline" ref={timelineRef}>
            {/* Progress fill line */}
            <div className="lp-timeline-progress" style={{ height: `${timelineProgress}%` }} />

            {lifecycleSteps.map((step, i) => {
              const Icon = step.icon;
              const isLeft = i % 2 === 0;
              return (
                <Reveal key={step.label} delay={i * 0.06} y={20}>
                  <div className={`lp-timeline-item ${isLeft ? "lp-timeline-item-left" : "lp-timeline-item-right"}`}>
                    <div
                      ref={(el) => { dotRefs.current[i] = el; }}
                      className={`lp-timeline-dot${activeDots[i] ? " is-active" : ""}`}
                    />
                    <div className="text-xs font-bold uppercase tracking-wider text-[rgba(100,160,255,0.5)] mb-2" style={{ fontFamily: "var(--font-display)" }}>
                      {step.num} — {step.state}
                    </div>
                    <div className={`lp-timeline-icon-row${isLeft ? " lp-timeline-icon-row-left" : ""} flex items-center gap-2.5 mb-3`}>
                      <Icon className="h-5 w-5 text-[#4a9eff]" />
                      <h3 className="text-xl sm:text-2xl font-bold text-white" style={{ fontFamily: "var(--font-display)" }}>{step.label}</h3>
                    </div>
                    <p className="text-sm sm:text-base text-[rgba(255,255,255,0.45)] leading-relaxed" style={{ fontFamily: "var(--font-display)" }}>
                      {step.detail}
                    </p>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Dual Audience: Built for Two Sides ──────────────────────── */}
      <section className="border-t border-[rgba(100,160,255,0.08)] bg-[#0a0a0a] px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <Reveal>
            <div className="mb-14">
              <div className="lp-number-badge mb-5">
                <span className="badge-num">2</span>
                <span>Built for Two Sides</span>
              </div>
              <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-white" style={{ fontFamily: "var(--font-display)" }}>
                One protocol, <span className="lp-text-gradient italic">two experiences.</span>
              </h2>
            </div>
          </Reveal>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Issuer card */}
            <Reveal>
              <SpotlightCard
                className="lp-card-gradient-blue rounded-3xl p-8 sm:p-10 h-full flex flex-col"
                color="74, 158, 255"
                opacity={0.15}
                size={350}
              >
                <div className="flex items-center gap-2 mb-5">
                  <span className="h-2 w-2 rounded-full bg-[#4a9eff]" />
                  <span className="text-[11px] font-bold tracking-[0.18em] uppercase text-[#4a9eff]" style={{ fontFamily: "var(--font-display)" }}>
                    For Asset Originators
                  </span>
                </div>
                <h3 className="text-2xl sm:text-3xl font-bold text-white" style={{ fontFamily: "var(--font-display)" }}>Instant Global Liquidity</h3>
                <p className="mt-3 text-sm text-[rgba(255,255,255,0.45)]">
                  Tokenize receivables, commercial invoices, and private debt with automated compliance.
                </p>
                <ul className="mt-7 space-y-3.5 text-sm text-[rgba(255,255,255,0.65)]">
                  {[
                    "AI-powered invoice document extraction",
                    "Configurable fractionalization token supply",
                    "Single-transaction settlement and investor payout",
                  ].map((bullet) => (
                    <li key={bullet} className="flex items-start gap-3">
                      <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#4a9eff]" />
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-auto pt-8">
                  <Link href="/app/issuer/create" className="lp-btn-primary !text-xs">
                    Tokenize an Asset <ArrowRight className="h-4 w-4 text-[#0553DA]" />
                  </Link>
                </div>
              </SpotlightCard>
            </Reveal>

            {/* Investor card */}
            <Reveal delay={0.1}>
              <SpotlightCard
                className="lp-card-gradient-gold rounded-3xl p-8 sm:p-10 h-full flex flex-col"
                color="232, 196, 118"
                opacity={0.15}
                size={350}
              >
                <div className="flex items-center gap-2 mb-5">
                  <span className="h-2 w-2 rounded-full bg-[#e8c476]" />
                  <span className="text-[11px] font-bold tracking-[0.18em] uppercase text-[#e8c476]" style={{ fontFamily: "var(--font-display)" }}>
                    For DeFi Investors
                  </span>
                </div>
                <h3 className="text-2xl sm:text-3xl font-bold text-white" style={{ fontFamily: "var(--font-display)" }}>Real Yield Backed by RWAs</h3>
                <p className="mt-3 text-sm text-[rgba(255,255,255,0.45)]">
                  Diversify out of purely speculative tokens into real-world cashflow-producing yields.
                </p>
                <ul className="mt-7 space-y-3.5 text-sm text-[rgba(255,255,255,0.65)]">
                  {[
                    "Cryptographic proof of verified counterparty invoices",
                    "Holding Score multiplier for loyal capital",
                    "Borrow against active positions at 60% max LTV",
                  ].map((bullet) => (
                    <li key={bullet} className="flex items-start gap-3">
                      <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#e8c476]" />
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-auto pt-8">
                  <Link href="/app/marketplace" className="lp-btn-outline !text-xs !border-[rgba(232,196,118,0.4)] hover:!border-[rgba(232,196,118,0.85)] hover:!shadow-[0_0_18px_rgba(232,196,118,0.35)]">
                    Explore Marketplace <ArrowRight className="h-4 w-4 text-[#e8c476]" />
                  </Link>
                </div>
              </SpotlightCard>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── Asset Classes: Yield Instruments ─────────────────────────── */}
      <section id="instruments" className="scroll-mt-20 border-t border-[rgba(100,160,255,0.08)] bg-[#0a0a0a] px-6 py-32">
        <div className="mx-auto max-w-7xl">
          <Reveal>
            <div className="mb-14">
              <div className="lp-number-badge mb-5">
                <span className="badge-num">3</span>
                <span>Yield Instruments</span>
              </div>
              <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-white" style={{ fontFamily: "var(--font-display)" }}>
                Four asset classes. <span className="lp-text-gradient italic">One settlement rail.</span>
              </h2>
            </div>
          </Reveal>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {assetClasses.map((asset, i) => (
              <RevealCard key={asset.name} index={i}>
                <div className="lp-card lp-card-hover rounded-3xl p-6 h-full flex flex-col">
                  <div className="flex items-center justify-between">
                    <span className="rounded-full border border-[rgba(100,160,255,0.25)] bg-[rgba(5,83,218,0.15)] px-3 py-1 text-[9px] font-bold tracking-[0.16em] text-[#4a9eff] uppercase" style={{ fontFamily: "var(--font-display)" }}>
                      {asset.tag}
                    </span>
                    <Globe className="h-3.5 w-3.5 text-[rgba(100,160,255,0.3)]" />
                  </div>
                  <h3 className="mt-5 text-lg font-bold text-white" style={{ fontFamily: "var(--font-display)" }}>{asset.name}</h3>
                  <p className="mt-2 text-xs text-[rgba(255,255,255,0.4)] leading-relaxed">{asset.description}</p>
                  <div className="mt-auto pt-6 flex items-end justify-between border-t border-[rgba(100,160,255,0.08)] mt-6">
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-wider text-[rgba(255,255,255,0.35)]" style={{ fontFamily: "var(--font-display)" }}>Target APY</div>
                      <div className="text-xl font-bold text-[#4a9eff]" style={{ fontFamily: "var(--font-display)" }}>{asset.apy}</div>
                    </div>
                    <Link
                      href="/app/marketplace"
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-[rgba(100,160,255,0.15)] text-[rgba(255,255,255,0.35)] hover:border-[rgba(100,160,255,0.5)] hover:text-[#4a9eff] transition"
                      aria-label={`Explore ${asset.name}`}
                    >
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              </RevealCard>
            ))}
          </div>
        </div>
      </section>

      {/* ── Marketplace Preview ─────────────────────────────────────── */}
      <section id="marketplace" className="scroll-mt-20 border-t border-[rgba(100,160,255,0.08)] bg-[#0a0a0a] px-6 py-32">
        <div className="mx-auto max-w-6xl">
          <Reveal>
            <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-12 gap-4">
              <div>
                <div className="lp-number-badge mb-5">
                  <span className="badge-num">4</span>
                  <span>Marketplace</span>
                </div>
                <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white" style={{ fontFamily: "var(--font-display)" }}>
                  Curated, verified offerings.
                </h2>
                <p className="mt-2 text-sm text-[rgba(255,255,255,0.45)]">A representative slice of the marketplace — connect your wallet to browse live listings.</p>
              </div>
              <Link
                href="/app/marketplace"
                className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#4a9eff] hover:text-[#6ab4ff] transition"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Full Marketplace <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </Reveal>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {marketListings.map((listing, i) => (
              <Reveal key={listing.name} delay={i * 0.07} y={18}>
                <div className="lp-card lp-card-hover rounded-3xl p-6 h-full flex flex-col">
                  <div className="flex items-center justify-between">
                    <span className="rounded-full border border-[rgba(100,160,255,0.25)] bg-[rgba(5,83,218,0.15)] px-3 py-1 text-[9px] font-bold tracking-[0.16em] text-[#4a9eff] uppercase" style={{ fontFamily: "var(--font-display)" }}>
                      {listing.tag}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[rgba(255,255,255,0.3)]" style={{ fontFamily: "var(--font-display)" }}>tUSDT</span>
                  </div>
                  <h3 className="mt-5 text-base font-bold text-white leading-snug" style={{ fontFamily: "var(--font-display)" }}>{listing.name}</h3>
                  <div className="mt-4 flex items-end justify-between">
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-wider text-[rgba(255,255,255,0.35)]" style={{ fontFamily: "var(--font-display)" }}>Target APY</div>
                      <div className="text-xl font-bold text-[#4a9eff]" style={{ fontFamily: "var(--font-display)" }}>{listing.apy}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-[rgba(255,255,255,0.35)]" style={{ fontFamily: "var(--font-display)" }}>Min Ticket</div>
                      <div className="text-sm font-bold text-[#e8c476]" style={{ fontFamily: "var(--font-display)" }}>{listing.minTicket}</div>
                    </div>
                  </div>
                  <div className="mt-5">
                    <div className="mb-1.5 flex justify-between text-[10px] font-bold uppercase tracking-wider text-[rgba(255,255,255,0.35)]">
                      <span>Funded</span>
                      <span className="text-[rgba(255,255,255,0.5)]">{listing.funded}</span>
                    </div>
                    <div className="h-1 w-full rounded-full bg-[rgba(100,160,255,0.08)] overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-[#136DE4] to-[#4a9eff]"
                        style={{ width: listing.funded }}
                      />
                    </div>
                  </div>
                  <Link
                    href="/app/marketplace"
                    className="mt-6 inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-[rgba(100,160,255,0.15)] bg-[rgba(255,255,255,0.02)] px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-[rgba(255,255,255,0.5)] transition hover:border-[rgba(100,160,255,0.5)] hover:text-[#4a9eff]"
                    style={{ fontFamily: "var(--font-display)" }}
                  >
                    View Listing <ArrowUpRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </Reveal>
            ))}
          </div>

          <p className="mt-8 text-center text-[11px] font-bold uppercase tracking-[0.16em] text-[rgba(255,255,255,0.25)]">
            Illustrative listings — example figures, not live quotes.
          </p>
        </div>
      </section>

      {/* ── Final CTA ───────────────────────────────────────────────── */}
      <section className="px-6 py-24 bg-[#0a0a0a]">
        <Reveal>
          <div className="lp-cta-glow relative mx-auto max-w-5xl overflow-hidden rounded-[2rem] px-8 py-16 sm:px-16 text-center">
            <div className="absolute inset-0 lp-grid opacity-50 [mask-image:radial-gradient(ellipse_60%_80%_at_50%_100%,black,transparent)]" />
            <div className="relative">
              <span className="text-xs font-bold tracking-[0.18em] text-[#4a9eff] uppercase" style={{ fontFamily: "var(--font-display)" }}>Institutional rails, retail access</span>
              <h2 className="mt-4 text-3xl sm:text-5xl font-bold tracking-tight text-white leading-tight" style={{ fontFamily: "var(--font-display)" }}>
                Put real-world yield
                <br />
                <span className="lp-text-gradient italic">on your balance sheet.</span>
              </h2>
              <p className="mt-5 text-sm sm:text-base text-[rgba(255,255,255,0.45)] max-w-xl mx-auto">
                Connect your Web3 wallet and interact directly with the Asetra state machine on BOT Chain — no intermediaries, no custodians.
              </p>
              <div className="mt-9 flex flex-wrap justify-center gap-4">
                <Link href="/app" className="lp-btn-primary">
                  Enter Application
                  <span className="lp-btn-arrow">
                    <ArrowRight className="h-4 w-4 text-[#0553DA]" />
                  </span>
                </Link>
                <Link href="/app/issuer/create" className="lp-btn-outline">
                  List an Asset
                </Link>
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ── Footer ──────────────────────────────────────────────────── */}
      <footer className="border-t border-[rgba(100,160,255,0.08)] bg-[#0a0a0a] px-6 py-14">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col items-center justify-between gap-8 md:flex-row">
            <div className="flex items-center gap-3">
              <img src="/Asetra.png" alt="Asetra" className="h-14 w-14 object-contain" />
              <span className="font-bold text-xl text-white" style={{ fontFamily: "var(--font-display)" }}>Asetra Protocol</span>
            </div>
            <div className="flex items-center gap-4 text-xs font-bold text-[rgba(255,255,255,0.35)]" style={{ fontFamily: "var(--font-display)" }}>
              <a href={CONTRACT_URL} target="_blank" rel="noopener noreferrer" className="hover:text-[#4a9eff] transition">
                Explorer
              </a>
              <span className="text-[rgba(255,255,255,0.15)]">&bull;</span>
              <Link href="/app/marketplace" className="hover:text-[#4a9eff] transition">
                Marketplace
              </Link>
              <span className="text-[rgba(255,255,255,0.15)]">&bull;</span>
              <Link href="/app" className="hover:text-[#4a9eff] transition">
                Launch App
              </Link>
            </div>
          </div>

          {/* BOT Chain Branding */}
          <div className="mt-8 flex flex-col items-center justify-center gap-3 border-t border-[rgba(100,160,255,0.08)] pt-8">
            <span className="text-[10px] font-mono uppercase tracking-widest text-[rgba(255,255,255,0.25)]">Built on</span>
            <div className="flex items-center gap-4">
              <a href={CONTRACT_URL} target="_blank" rel="noopener noreferrer" className="group flex items-center gap-2.5 transition">
                <img src="/botchain.png" alt="BOT Chain" className="h-7 w-auto object-contain opacity-70 group-hover:opacity-100 transition" />
                <span className="text-sm font-bold text-[rgba(255,255,255,0.45)] group-hover:text-white transition" style={{ fontFamily: "var(--font-display)" }}>BOT Chain</span>
              </a>
              <span className="text-[rgba(255,255,255,0.15)]">&bull;</span>
              <a href={CONTRACT_URL} target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-[rgba(255,255,255,0.35)] hover:text-[#4a9eff] transition" style={{ fontFamily: "var(--font-display)" }}>
                Explorer
              </a>
            </div>
          </div>

          <p className="mt-8 text-center text-[11px] leading-relaxed text-[rgba(255,255,255,0.2)] max-w-3xl mx-auto">
            Asetra is an experimental protocol deployed on BOT Chain (Chain ID: 677).
            Digital asset offerings involve substantial risk, including illiquidity and total loss of capital.
            Nothing on this page constitutes financial advice or a solicitation to purchase securities.
            Verify every transaction against the official explorer before signing.
          </p>
        </div>
      </footer>
    </div>
  );
}
