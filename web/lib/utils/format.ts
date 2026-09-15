import { formatUnits, parseUnits } from "viem";

export function formatTokenAmount(value: bigint, decimals: number = 18): string {
  const str = formatUnits(value, decimals);
  const num = parseFloat(str);
  if (num === 0) return "0";
  if (num < 0.01) return "<0.01";
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(2)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(2)}K`;
  return num.toFixed(2);
}

export function formatUSD(value: bigint): string {
  const str = formatUnits(value, 6);
  const num = parseFloat(str);
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(num);
}

export function parseDateToTimestamp(dateStr: string): bigint {
  const date = new Date(dateStr + "T00:00:00Z");
  return BigInt(Math.floor(date.getTime() / 1000));
}

export function timestampToDate(ts: bigint): string {
  const date = new Date(Number(ts) * 1000);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function daysUntil(timestamp: bigint): number {
  const now = Math.floor(Date.now() / 1000);
  const target = Number(timestamp);
  return Math.max(0, Math.ceil((target - now) / 86400));
}

export function formatBps(bps: bigint): string {
  return `${(Number(bps) / 100).toFixed(1)}%`;
}

export function shortenAddress(address: `0x${string}`): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function normalizePrice(rawPricePerUnit: bigint): bigint {
  return rawPricePerUnit;
}

export function calcTokenCost(rawPricePerUnit: bigint, units: number): bigint {
  return rawPricePerUnit * BigInt(units);
}
