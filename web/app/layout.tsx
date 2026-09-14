import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Web3Provider } from "@/lib/web3/provider";
import { RoleProvider } from "@/lib/context/RoleContext";
import { Navbar } from "@/components/layout/Navbar";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AssetFlow — Real-World Assets, Made Programmable",
  description:
    "AssetFlow transforms verified real-world assets into programmable on-chain financial positions.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} dark h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#080a0f] text-slate-100 font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
        <Web3Provider>
          <RoleProvider>
            <Navbar />
            {children}
          </RoleProvider>
        </Web3Provider>
      </body>
    </html>
  );
}
