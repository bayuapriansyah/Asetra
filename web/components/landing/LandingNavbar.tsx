"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Menu, X } from "lucide-react";

const NAV_LINKS = [
  { label: "Lifecycle", href: "#lifecycle" },
  { label: "Instruments", href: "#instruments" },
  { label: "Marketplace", href: "#marketplace" },
];

/**
 * Landing-specific navigation bar (client component for mobile menu).
 * Glassmorphism pill nav with blue gradient — rwa.inc-inspired design.
 * Semi-transparent background with backdrop blur.
 */
export function LandingNavbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  function closeMenu() {
    setMobileOpen(false);
  }

  return (
    <header className="fixed top-0 left-0 w-full z-50 border-b border-[rgba(100,160,255,0.08)] bg-[#111111]/80 backdrop-blur-xl">
      <div className="flex h-18 max-w-8xl lg:mx-5 items-center justify-between px-6">
        {/* Brand — left */}
        <Link href="/" className="group flex items-center gap-3">
          <img src="/Asetra.png" alt="Asetra" className="h-15 w-15 object-contain" />
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold tracking-tight text-white" style={{ fontFamily: "var(--font-display)" }}>
              <span className="text-[#fff]">Asetra</span>
            </span>
            <span className="hidden sm:inline-block rounded-full border border-[rgba(100,160,255,0.3)] bg-[rgba(5,83,218,0.2)] px-2.5 py-0.5 text-[10px] font-bold tracking-wider text-[#4a9eff]">
              RWA
            </span>
          </div>
        </Link>

        {/* Glassmorphism pill nav — center (desktop only) */}
        <nav className="hidden lg:flex items-center gap-8 px-8 py-3 text-white text-sm font-medium tracking-wide lp-glass-pill">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="hover:opacity-75 transition-opacity whitespace-nowrap"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* CTA — right (desktop) */}
        <div className="hidden lg:flex">
          <Link href="/app" className="lp-btn-primary !py-2.5 !px-5 !text-xs !rounded-full">
            Launch App
            <span className="lp-btn-arrow !w-7 !h-7">
              <ArrowRight className="h-3.5 w-3.5 text-[#0553DA]" />
            </span>
          </Link>
        </div>

        {/* Hamburger — mobile */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="lg:hidden flex items-center justify-center w-10 h-10 rounded-xl border border-[rgba(100,160,255,0.2)] bg-[rgba(255,255,255,0.05)] text-white hover:border-[rgba(100,160,255,0.4)] transition"
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile dropdown menu */}
      <div
        className={`lg:hidden overflow-hidden transition-all duration-300 ease-out ${
          mobileOpen ? "max-h-80 opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="mx-auto max-w-7xl px-6 pb-5">
          <div className="rounded-2xl border border-[rgba(100,160,255,0.15)] bg-[rgba(4,6,18,0.95)] backdrop-blur-xl p-4 space-y-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={closeMenu}
                className="block px-4 py-3 rounded-xl text-sm font-medium text-white/80 hover:text-white hover:bg-[rgba(100,160,255,0.08)] transition"
              >
                {link.label}
              </Link>
            ))}
            <div className="pt-2 mt-2 border-t border-[rgba(100,160,255,0.1)]">
              <Link
                href="/app"
                onClick={closeMenu}
                className="lp-btn-primary !w-full !justify-center !text-xs"
              >
                Launch App
                <span className="lp-btn-arrow !w-7 !h-7">
                  <ArrowRight className="h-3.5 w-3.5 text-[#0553DA]" />
                </span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
