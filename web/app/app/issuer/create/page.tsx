"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { AppLayout } from "@/components/layout/AppLayout";
import { useCreateAsset } from "@/hooks/useCreateAsset";
import { parseDateToTimestamp } from "@/lib/utils/format";
import { parseContractError } from "@/lib/utils/errors";
import { TxSuccessBanner } from "@/components/ui/TxSuccessBanner";
import { TxProgress } from "@/components/ui/TxProgress";
import { keccak256 } from "viem";
import {
  FileText,
  Building2,
  Wallet,
  Calendar,
  Percent,
  Hash,
  ExternalLink,
  CheckCircle2,
  Loader2,
  AlertCircle,
  Upload,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  PlusCircle,
  FileCheck
} from "lucide-react";
import Link from "next/link";

const ASSET_TYPES = ["Invoice", "Bond", "Trade Finance", "Commodity", "Real Estate"];

// Parse text invoice (TXT/CSV/PDF extracted text) — regex-based extraction
function parseInvoiceText(text: string, setters: {
  setName: (v: string) => void;
  setFaceValue: (v: string) => void;
  setMaturityDate: (v: string) => void;
  setYieldBps: (v: string) => void;
  setCounterparty: (v: string) => void;
  setAssetType: (v: string) => void;
}) {
  // Invoice ID: INV-XXXX, INV XXXX, Invoice #XXXX
  const nameMatch = text.match(/(?:INV[-\s]?\d{4,}|Invoice\s*#?\s*\d{4,}|Bond[-\s]?\d{4,})/i);
  if (nameMatch) setters.setName(nameMatch[0].replace(/\s+/g, "-").toUpperCase());

  // Face value: $100,000, USD 100000, 100,000.00
  const amountMatch = text.match(/(?:USD?\s*\$?\s*)([\d,]+\.?\d*)/i) || text.match(/\$([\d,]+\.?\d*)/);
  if (amountMatch) setters.setFaceValue(amountMatch[1].replace(/,/g, ""));

  // Maturity: 2026-09-15, 09/15/2026, Sep 15 2026, Due: ...
  const dateMatch = text.match(/(?:due|maturity|date)[:\s]*(\d{4}-\d{2}-\d{2}|\d{2}\/\d{2}\/\d{4})/i)
    || text.match(/(\d{4}-\d{2}-\d{2})/)
    || text.match(/(\d{2}\/\d{2}\/\d{4})/);
  if (dateMatch) {
    const d = dateMatch[1];
    setters.setMaturityDate(d.includes("/") ? new Date(d).toISOString().split("T")[0] : d);
  }

  // Yield: 8.20%, 820 bps
  const yieldMatch = text.match(/(\d+\.?\d*)\s*%/) || text.match(/(\d+)\s*bps/i);
  if (yieldMatch) {
    const val = parseFloat(yieldMatch[1]);
    setters.setYieldBps(String(val > 100 ? val : Math.round(val * 100)));
  }

  // Counterparty: 0x address
  const addrMatch = text.match(/0x[a-fA-F0-9]{40}/);
  if (addrMatch) setters.setCounterparty(addrMatch[0]);

  // Asset type detection
  const lower = text.toLowerCase();
  if (lower.includes("bond")) setters.setAssetType("Bond");
  else if (lower.includes("trade finance")) setters.setAssetType("Trade Finance");
  else if (lower.includes("commodity")) setters.setAssetType("Commodity");
  else if (lower.includes("real estate")) setters.setAssetType("Real Estate");
  else if (lower.includes("invoice")) setters.setAssetType("Invoice");
}

// Parse JSON invoice — structured data extraction
function parseInvoiceJSON(text: string, setters: {
  setName: (v: string) => void;
  setFaceValue: (v: string) => void;
  setMaturityDate: (v: string) => void;
  setYieldBps: (v: string) => void;
  setCounterparty: (v: string) => void;
  setAssetType: (v: string) => void;
}) {
  try {
    const data = JSON.parse(text);
    if (data.name || data.invoiceId || data.id) setters.setName(data.name || data.invoiceId || data.id);
    if (data.faceValue || data.amount || data.value) setters.setFaceValue(String(data.faceValue || data.amount || data.value));
    if (data.maturity || data.dueDate || data.due_date) {
      const d = data.maturity || data.dueDate || data.due_date;
      setters.setMaturityDate(typeof d === "string" && d.includes("/") ? new Date(d).toISOString().split("T")[0] : String(d));
    }
    if (data.yieldBps || data.yield || data.apy) {
      const y = data.yieldBps || data.yield || data.apy;
      setters.setYieldBps(String(y > 100 ? y : Math.round(y * 100)));
    }
    if (data.counterparty || data.obligor || data.address) setters.setCounterparty(data.counterparty || data.obligor || data.address);
    if (data.assetType || data.type || data.category) setters.setAssetType(data.assetType || data.type || data.category);
  } catch { /* invalid JSON — ignore */ }
}

// Extract text from PDF using pdfjs-dist
async function extractPDFText(file: File): Promise<string> {
  const pdfjsLib = await import("pdfjs-dist");
  pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

  const buffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;

  let fullText = "";
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    fullText += content.items.map((item: any) => item.str).join(" ") + "\n";
  }
  return fullText;
}

export default function CreateAssetPage() {
  const { address, isConnected } = useAccount();
  const { createAsset, txHash, isPending, isConfirming, isSuccess, isError, error } =
    useCreateAsset();

  const [assetType, setAssetType] = useState("Invoice");
  const [name, setName] = useState("INV-2050");
  const [counterparty, setCounterparty] = useState("");
  const [faceValue, setFaceValue] = useState("100000");
  const [maturityDate, setMaturityDate] = useState(() => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return yesterday.toISOString().split("T")[0];
  });
  const [yieldBps, setYieldBps] = useState("820");

  const [createdAssetId, setCreatedAssetId] = useState<string | null>(null);
  const [aiExtracting, setAiExtracting] = useState(false);
  const [aiExtracted, setAiExtracted] = useState(false);
  const [docFileHash, setDocFileHash] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  const handleAiExtract = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setAiExtracting(true);

    try {
      // 1. Read file as bytes → compute keccak256 hash (real file hash)
      const buffer = await file.arrayBuffer();
      const bytes = new Uint8Array(buffer);
      const hash = keccak256(bytes);
      setDocFileHash(hash);

      // 2. Parse file content based on type
      const ext = file.name.split(".").pop()?.toLowerCase();
      const setters = {
        setName, setFaceValue, setMaturityDate, setYieldBps, setCounterparty, setAssetType,
      };

      if (ext === "txt" || ext === "csv") {
        const text = await file.text();
        parseInvoiceText(text, setters);
      } else if (ext === "json") {
        const text = await file.text();
        parseInvoiceJSON(text, setters);
      } else if (ext === "pdf") {
        const text = await extractPDFText(file);
        parseInvoiceText(text, setters);
      } else {
        // Image or unknown — hash only, brief delay for UX
        await new Promise((r) => setTimeout(r, 1500));
      }

      setAiExtracted(true);
      setTimeout(() => setAiExtracted(false), 5000);
    } catch (err) {
      console.error("File parse error:", err);
      // Still set the hash even if parsing fails
      if (!docFileHash) {
        const buffer = await file.arrayBuffer();
        const hash = keccak256(new Uint8Array(buffer));
        setDocFileHash(hash);
      }
    } finally {
      setAiExtracting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isConnected || !address) return;

    try {
      await createAsset({
        assetType,
        name,
        externalReference: `${name}-REF`,
        counterparty: (counterparty || address) as `0x${string}`,
        faceValue: BigInt(Math.floor(parseFloat(faceValue) * 1e18)),
        maturity: parseDateToTimestamp(maturityDate),
        expectedYieldBps: BigInt(parseInt(yieldBps)),
        documentHash: docFileHash || undefined,
      });

      setCreatedAssetId("0");
    } catch {
      console.error("Transaction failed");
    }
  };

  const explorerBase = process.env.NEXT_PUBLIC_BOT_EXPLORER_URL || "https://scan.bohr.life";

  return (
    <AppLayout>
      {/* Header Banner */}
      <div className="mb-8">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-white sm:text-4xl">Origin & Tokenize RWA</h1>
            <p className="mt-1 text-sm text-slate-400 font-mono">
              Register certified real-world financial contracts into programmable on-chain vaults
            </p>
          </div>
        </div>
      </div>

      {!isConnected ? (
        <div className="mx-auto max-w-2xl web3-card rounded-2xl p-12 text-center shadow-xl">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
            <Wallet className="h-8 w-8" />
          </div>
          <h2 className="text-xl font-black text-white">Wallet Connection Required</h2>
          <p className="mt-2 text-sm text-slate-400">
            Connect your Web3 wallet to sign asset origination transactions on the Bohr Testnet.
          </p>
        </div>
      ) : (
        <div className="max-w-6xl">
          {/* Real File Upload Box */}
          <div className="mb-8 rounded-2xl border-2 border-dashed border-cyan-500/30 bg-cyan-500/[0.04] hover:bg-cyan-500/[0.08] p-8 text-center transition-all duration-300 group">
            <label className="cursor-pointer block">
              <input
                type="file"
                className="hidden"
                accept=".pdf,.txt,.csv,.json,.png,.jpg,.jpeg"
                onChange={handleAiExtract}
                disabled={aiExtracting}
              />
              <div className="flex flex-col items-center gap-4">
                {aiExtracting ? (
                  <>
                    <Loader2 className="h-12 w-12 animate-spin text-cyan-400" />
                    <div>
                      <p className="text-base font-black text-cyan-300">Reading & Parsing Document...</p>
                      <p className="mt-1 text-xs text-slate-400 font-mono">Computing keccak256 hash, extracting fields</p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 group-hover:scale-110 transition-transform">
                      <Upload className="h-7 w-7" />
                    </div>
                    <div>
                      <p className="text-base font-black text-white group-hover:text-cyan-300 transition-colors">
                        Upload Invoice, Bond, or Contract Document
                      </p>
                      <p className="mt-1 text-xs text-slate-400 font-mono">
                        PDF, TXT, CSV, JSON — Real file parsing + on-chain hash proof
                      </p>
                    </div>
                  </>
                )}
              </div>
            </label>
          </div>

          {/* File Hash Display — Real on-chain proof */}
          {docFileHash && (
            <div className="mb-6 rounded-2xl border border-cyan-500/30 bg-cyan-500/[0.06] p-5">
              <div className="flex items-center gap-2.5 text-cyan-300 font-black">
                <FileCheck className="h-5 w-5 text-cyan-400" />
                <span>Document Verified & Hashed</span>
              </div>
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="rounded-xl bg-slate-950/60 border border-white/[0.06] p-3">
                  <div className="text-[10px] font-mono text-slate-500 uppercase">Source File</div>
                  <div className="mt-1 font-mono text-xs text-white break-all">{fileName}</div>
                </div>
                <div className="rounded-xl bg-slate-950/60 border border-white/[0.06] p-3">
                  <div className="text-[10px] font-mono text-slate-500 uppercase">Keccak256 Hash (On-Chain)</div>
                  <div className="mt-1 font-mono text-xs text-cyan-300 break-all">{docFileHash}</div>
                </div>
              </div>
            </div>
          )}

          {aiExtracted && (
            <div className="mb-6 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm font-semibold text-emerald-300 flex items-center gap-3">
              <Sparkles className="h-5 w-5 text-emerald-400 shrink-0" />
              <span>Fields extracted from document content — verify and confirm below.</span>
            </div>
          )}

          {/* Form Card */}
          <div className="web3-card rounded-2xl p-8 shadow-2xl">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400">Asset Category / Instrument</label>
                <div className="mt-2 grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {ASSET_TYPES.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setAssetType(t)}
                      className={`rounded-xl px-3 py-2.5 text-xs font-mono font-bold transition-all ${
                        assetType === t
                          ? "bg-cyan-400 text-slate-950 font-bold"
                          : "bg-slate-900/80 border border-white/[0.08] text-slate-400 hover:text-white hover:bg-slate-800"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400">
                  Asset Title / Invoice Identifier
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="e.g. INV-2050, US-BOND-2026"
                  className="mt-2 w-full rounded-xl border border-white/[0.08] bg-slate-900/90 px-4 py-3 text-sm font-bold text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400/30 font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400">
                  Obligor / Counterparty EVM Address
                </label>
                <input
                  type="text"
                  value={counterparty}
                  onChange={(e) => setCounterparty(e.target.value)}
                  placeholder={address || "0x..."}
                  className="mt-2 w-full rounded-xl border border-white/[0.08] bg-slate-900/90 px-4 py-3 text-sm font-mono text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400/30"
                />
                <p className="mt-1.5 text-xs text-slate-500 font-mono">Leave blank to assign to your connected address.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400">
                    Face Value (USD Nominal)
                  </label>
                  <div className="relative mt-2">
                    <span className="absolute left-4 top-3 text-sm font-bold text-slate-500">$</span>
                    <input
                      type="number"
                      value={faceValue}
                      onChange={(e) => setFaceValue(e.target.value)}
                      min="1"
                      required
                      className="w-full rounded-xl border border-white/[0.08] bg-slate-900/90 pl-8 pr-4 py-3 text-sm font-black font-mono text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400/30"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400">
                    Maturity / Due Date
                  </label>
                  <input
                    type="date"
                    value={maturityDate}
                    onChange={(e) => setMaturityDate(e.target.value)}
                    required
                    className="mt-2 w-full rounded-xl border border-white/[0.08] bg-slate-900/90 px-4 py-3 text-sm font-mono text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400/30"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400">
                  Target Yield / APY (%)
                </label>
                <div className="relative mt-2">
                  <input
                    type="number"
                    value={(parseInt(yieldBps) / 100).toString()}
                    onChange={(e) => setYieldBps(String(Math.round(parseFloat(e.target.value || "0") * 100)))}
                    step="0.1"
                    min="0"
                    required
                    className="w-full rounded-xl border border-white/[0.08] bg-slate-900/90 px-4 py-3 text-sm font-black font-mono text-emerald-400 placeholder-slate-500 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400/30"
                  />
                  <span className="absolute right-4 top-3 text-sm font-bold text-emerald-400">%</span>
                </div>
                <p className="mt-1 text-xs text-slate-500 font-mono">Yield in BPS: {yieldBps} bps</p>
              </div>

              {isError && (
                <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-300">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-rose-400" />
                    <span>{parseContractError(error)}</span>
                  </div>
                </div>
              )}

              <div className="pt-2">
                <TxProgress
                  step={
                    isSuccess ? "confirmed" :
                    isConfirming ? "pending" :
                    isPending ? "waiting" :
                    "idle"
                  }
                />
              </div>

              <button
                type="submit"
                disabled={isPending || isConfirming}
                className="w-full rounded-xl bg-cyan-400 px-6 py-3.5 text-sm font-bold text-slate-950 hover:bg-cyan-300 disabled:opacity-50 transition-colors shadow-sm"
              >
                {isPending ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="h-5 w-5 animate-spin" /> Waiting for Wallet Approval...
                  </span>
                ) : isConfirming ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="h-5 w-5 animate-spin" /> Confirming on Bohr Testnet...
                  </span>
                ) : (
                  "Create & Originate RWA"
                )}
              </button>
            </form>

            {isSuccess && (
              <div className="mt-6 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-5">
                <div className="flex items-center gap-2.5 text-emerald-300 font-black">
                  <CheckCircle2 className="h-6 w-6 text-emerald-400" />
                  <span>Real-World Asset Registered On-Chain!</span>
                </div>
                {docFileHash && (
                  <div className="mt-2 text-xs font-mono text-slate-400">
                    Document Hash: <span className="text-cyan-300">{docFileHash}</span>
                  </div>
                )}
                <div className="mt-3 flex items-center gap-4 text-sm font-mono">
                  {txHash && (
                    <Link
                      href={`${explorerBase}/tx/${txHash}`}
                      target="_blank"
                      className="flex items-center gap-1.5 text-cyan-400 hover:underline"
                    >
                      Bohr Explorer <ExternalLink className="h-3.5 w-3.5" />
                    </Link>
                  )}
                  <Link
                    href="/app/issuer/assets"
                    className="flex items-center gap-1 text-emerald-400 hover:underline font-bold"
                  >
                    View in My Assets →
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </AppLayout>
  );
}

