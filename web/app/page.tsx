import Link from "next/link";
import { MarketplacePreview } from "@/components/marketplace/MarketplacePreview";
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
  Activity,
  Globe,
  Coins,
  ShieldCheck,
  Cpu,
  Lock
} from "lucide-react";

const lifecycleSteps = [
  { label: "Create", icon: FileText, state: "Origination" },
  { label: "Verify", icon: Shield, state: "Audit" },
  { label: "Tokenize", icon: Layers, state: "Fractionalize" },
  { label: "List", icon: BarChart3, state: "Discovery" },
  { label: "Invest", icon: Banknote, state: "Liquidity" },
  { label: "Active", icon: Zap, state: "Yield Engine" },
  { label: "Mature", icon: TrendingUp, state: "Redemption" },
  { label: "Settle", icon: CheckCircle, state: "Disbursement" },
];

const features = [
  {
    title: "Deterministic State Machine",
    description:
      "Every asset transition (from creation to settlement) is guarded by smart contracts. Strict on-chain state machine rules enforce legitimate actions.",
    icon: Layers,
    accent: "text-cyan-400",
  },
  {
    title: "Programmable DeFi Positions",
    description:
      "Fractionalized tokens are composable financial primitives. Deposit as collateral to borrow, trade secondary P2P, or earn variable holding yield.",
    icon: Zap,
    accent: "text-emerald-400",
  },
  {
    title: "Bohr Chain Native Settlement",
    description:
      "Sub-second finality and near-zero gas costs. Direct verifiable document hashes stored immutably on Bohr EVM Testnet (Chain 968).",
    icon: ShieldCheck,
    accent: "text-amber-400",
  },
];

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-[#080A0F] text-slate-200">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 border-b border-white/[0.08] bg-[#080A0F]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 border border-white/[0.12] text-cyan-400 font-black">
              AF
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-black tracking-tight text-white leading-none">AssetFlow</span>
              <span className="text-[10px] font-mono tracking-widest text-cyan-400 uppercase">RWA Protocol</span>
            </div>
          </Link>

          <div className="hidden items-center gap-8 text-xs font-bold uppercase tracking-wider text-slate-400 md:flex">
            <a href="#lifecycle" className="hover:text-cyan-300 transition">Lifecycle</a>
            <a href="#features" className="hover:text-cyan-300 transition">Architecture</a>
            <a href="#preview" className="hover:text-cyan-300 transition">Marketplace</a>
            <a href="#infrastructure" className="hover:text-cyan-300 transition">Bohr Network</a>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/app/marketplace"
              className="rounded-xl border border-white/[0.08] bg-slate-900/80 px-4 py-2 text-xs font-bold uppercase tracking-wider text-slate-300 hover:border-slate-500 hover:text-white transition"
            >
              Explore
            </Link>
            <Link
              href="/app"
              className="inline-flex items-center gap-1.5 rounded-xl bg-cyan-400 px-4 py-2 text-xs font-bold uppercase tracking-wider text-slate-950 hover:bg-cyan-300 transition-colors shadow-sm"
            >
              Launch App
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden px-6 pt-24 pb-20 md:pt-36 md:pb-32">
        <div className="relative mx-auto max-w-5xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-4 py-1.5 mb-8">
            <span className="h-2 w-2 rounded-full bg-cyan-400" />
            <span className="text-xs font-mono font-bold tracking-widest text-cyan-300 uppercase">
              LIVE ON BOHR TESTNET (CHAIN 968)
            </span>
          </div>

          <h1 className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tight text-white leading-[1.08]">
            REAL-WORLD ASSETS.
            <br />
            <span className="text-cyan-400">
              PROGRAMMABLE ON-CHAIN.
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-base sm:text-lg text-slate-400 leading-relaxed font-medium">
            Turn verified invoices, commercial paper, and high-yield receivables into yield-bearing DeFi collateral. From origination to automated maturity settlement.
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/app/marketplace"
              className="inline-flex items-center gap-2 rounded-xl bg-cyan-400 px-7 py-3.5 text-sm font-bold uppercase tracking-wider text-slate-950 hover:bg-cyan-300 transition shadow-sm"
            >
              Explore Assets
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/app"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900/80 px-7 py-3.5 text-sm font-black uppercase tracking-wider text-white hover:border-slate-500 hover:bg-slate-800 transition"
            >
              Open Terminal
              <ArrowUpRight className="h-4 w-4 text-cyan-400" />
            </Link>
          </div>

          {/* Key Metric Strip */}
          <div className="mt-16 grid grid-cols-2 gap-4 sm:grid-cols-4 max-w-4xl mx-auto">
            <div className="web3-card rounded-2xl p-4 text-center">
              <div className="text-2xl sm:text-3xl font-black font-mono text-white">$10.4M+</div>
              <div className="mt-1 text-xs font-mono text-slate-400 uppercase">Volume Processed</div>
            </div>
            <div className="web3-card rounded-2xl p-4 text-center">
              <div className="text-2xl sm:text-3xl font-black font-mono text-emerald-400">8.4% — 14.2%</div>
              <div className="mt-1 text-xs font-mono text-slate-400 uppercase">Target APY</div>
            </div>
            <div className="web3-card rounded-2xl p-4 text-center">
              <div className="text-2xl sm:text-3xl font-black font-mono text-cyan-300">&lt; 1.5s</div>
              <div className="mt-1 text-xs font-mono text-slate-400 uppercase">Bohr Block Time</div>
            </div>
            <div className="web3-card rounded-2xl p-4 text-center">
              <div className="text-2xl sm:text-3xl font-black font-mono text-amber-400">0% Reverts</div>
              <div className="mt-1 text-xs font-mono text-slate-400 uppercase">Audit Verified</div>
            </div>
          </div>
        </div>
      </section>

      {/* Lifecycle Section */}
      <section id="lifecycle" className="relative border-t border-slate-800/80 bg-[#0B0F19] px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-mono font-bold tracking-widest text-cyan-400 uppercase">State Machine Engine</span>
            <h2 className="mt-2 text-3xl sm:text-5xl font-black tracking-tight text-white">
              Every Asset Has a Transparent Lifecycle.
            </h2>
            <p className="mt-4 text-sm sm:text-base text-slate-400">
              Unlike static NFTs, AssetFlow positions dynamically adapt. Allowed transactions depend directly on the real-world milestone achieved.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {lifecycleSteps.map((step, i) => {
              const Icon = step.icon;
              return (
                <div
                  key={step.label}
                  className="web3-card web3-card-hover rounded-2xl p-5 relative overflow-hidden group transition-all duration-300"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-mono font-bold text-slate-500">0{i + 1}</span>
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-md border border-cyan-500/20">
                      {step.state}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 border border-white/[0.08] text-cyan-400 group-hover:bg-cyan-500/10 group-hover:border-cyan-500/30 transition">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="text-base font-black text-white">{step.label}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Architecture & Features */}
      <section id="features" className="border-t border-slate-800/80 bg-[#080A0F] px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-mono font-bold tracking-widest text-emerald-400 uppercase">Protocol Design</span>
            <h2 className="mt-2 text-3xl sm:text-5xl font-black tracking-tight text-white">
              Institutional Grade Infrastructure
            </h2>
            <p className="mt-4 text-sm sm:text-base text-slate-400">
              Built for speed, legal auditability, and deep decentralized liquidity.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {features.map((f) => {
              const Icon = f.icon;
              return (
                <div
                  key={f.title}
                  className="web3-card web3-card-hover rounded-2xl p-8 shadow-xl transition"
                >
                  <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 border border-white/[0.08]">
                    <Icon className={`h-6 w-6 ${f.accent}`} />
                  </div>
                  <h3 className="text-xl font-black text-white">{f.title}</h3>
                  <p className="mt-3 text-sm text-slate-400 leading-relaxed">{f.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Dual Role Ecosystem */}
      <section className="border-t border-slate-800/80 bg-[#0B0F19] px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-8 md:grid-cols-2">
            <div className="web3-card rounded-3xl p-8 sm:p-10 shadow-xl">
              <div className="flex items-center gap-2 mb-4">
                <span className="h-2 w-2 rounded-full bg-cyan-400" />
                <span className="text-xs font-mono font-bold tracking-widest text-cyan-400 uppercase">FOR ASSET ORIGINATORS</span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-black text-white">Instant Global Liquidity</h3>
              <p className="mt-2 text-sm text-slate-400">
                Tokenize receivables, commercial invoices, and private debt with automated compliance.
              </p>
              <ul className="mt-6 space-y-3.5 text-sm text-slate-300">
                <li className="flex items-center gap-3">
                  <CheckCircle className="h-4 w-4 text-cyan-400 shrink-0" />
                  <span>AI-powered automated invoice document extraction</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="h-4 w-4 text-cyan-400 shrink-0" />
                  <span>Configurable fractionalization token supply</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="h-4 w-4 text-cyan-400 shrink-0" />
                  <span>Single-transaction settlement and investor payout distribution</span>
                </li>
              </ul>
              <Link
                href="/app/issuer/create"
                className="mt-8 inline-flex items-center gap-2 rounded-xl bg-cyan-400 px-5 py-3 text-xs font-black uppercase tracking-wider text-slate-950 hover:bg-cyan-300 transition"
              >
                Tokenize an Asset <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="web3-card rounded-3xl p-8 sm:p-10 shadow-xl">
              <div className="flex items-center gap-2 mb-4">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                <span className="text-xs font-mono font-bold tracking-widest text-emerald-400 uppercase">FOR DEFI INVESTORS</span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-black text-white">Real Yield Backed by RWAs</h3>
              <p className="mt-2 text-sm text-slate-400">
                Diversify out of purely speculative tokens into real-world cashflow producing yields.
              </p>
              <ul className="mt-6 space-y-3.5 text-sm text-slate-300">
                <li className="flex items-center gap-3">
                  <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>Direct cryptographic proof of verified counterparty invoices</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>Holding Score multiplier system to incentivize loyal capital</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>Borrow against active positions with up to 60% safe LTV</span>
                </li>
              </ul>
              <Link
                href="/app/marketplace"
                className="mt-8 inline-flex items-center gap-2 rounded-xl bg-emerald-400 px-5 py-3 text-xs font-black uppercase tracking-wider text-slate-950 hover:bg-emerald-300 transition"
              >
                Explore Yield Pools <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Marketplace Preview */}
      <section id="preview" className="border-t border-slate-800/80 bg-[#080A0F] px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-12 gap-4">
            <div>
              <span className="text-xs font-mono font-bold tracking-widest text-cyan-400 uppercase">Market Overview</span>
              <h2 className="mt-1 text-3xl sm:text-4xl font-black tracking-tight text-white">Live Verified Offerings</h2>
            </div>
            <Link
              href="/app/marketplace"
              className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-400 hover:text-cyan-300 inline-flex items-center gap-1"
            >
              Full Marketplace →
            </Link>
          </div>

          <MarketplacePreview />
        </div>
      </section>

      {/* CTA Strip */}
      <section className="relative border-t border-white/[0.08] bg-[#0A0D15] px-6 py-20 text-center">
        <div className="relative mx-auto max-w-3xl">
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white">
            Experience the Future of RWA on Bohr Chain.
          </h2>
          <p className="mt-4 text-base text-slate-400">
            Connect your Web3 wallet and interact directly with smart contracts on the Bohr Testnet.
          </p>
          <div className="mt-8 flex justify-center gap-4">
            <Link
              href="/app"
              className="inline-flex items-center gap-2 rounded-xl bg-cyan-400 px-8 py-4 text-sm font-bold uppercase tracking-wider text-slate-950 hover:bg-cyan-300 transition shadow-sm"
            >
              Enter Application
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/[0.08] bg-[#080A0F] px-6 py-12">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 md:flex-row">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 border border-white/[0.12] text-cyan-400 font-bold text-xs">
              AF
            </div>
            <span className="font-black text-white">AssetFlow Protocol</span>
          </div>
          <div className="text-center text-xs font-mono text-slate-500">
            Built on Bohr EVM Testnet (Chain ID: 968) &bull; High-Performance Real World Asset Engine
          </div>
          <div className="flex items-center gap-4 text-xs font-mono text-slate-400">
            <a href="https://scan.bohr.life" target="_blank" rel="noopener noreferrer" className="hover:text-cyan-400 transition">
              Explorer
            </a>
            <span>&bull;</span>
            <Link href="/app/marketplace" className="hover:text-cyan-400 transition">
              Marketplace
            </Link>
            <span>&bull;</span>
            <Link href="/app" className="hover:text-cyan-400 transition">
              Launch App
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

