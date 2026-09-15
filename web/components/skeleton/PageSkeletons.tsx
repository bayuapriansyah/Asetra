"use client";

import { Skeleton, SkeletonCard } from "@/components/ui/skeleton";

function StatCardSkeleton({ className = "" }: { className?: string }) {
  return (
    <SkeletonCard className={className}>
      <Skeleton className="h-3 w-20" />
      <Skeleton className="h-7 w-28" />
      <Skeleton className="h-3 w-16" />
    </SkeletonCard>
  );
}

function TableRowSkeleton() {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-white/[0.06] bg-slate-950/40 p-4">
      <Skeleton className="h-8 w-8 rounded-lg shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-3 w-1/4" />
      </div>
      <div className="text-right space-y-2">
        <Skeleton className="h-4 w-20 ml-auto" />
        <Skeleton className="h-3 w-14 ml-auto" />
      </div>
    </div>
  );
}

function AssetCardSkeleton() {
  return (
    <SkeletonCard className="h-full">
      <div className="flex items-start justify-between mb-3">
        <div className="flex gap-2">
          <Skeleton className="h-5 w-10 rounded-md" />
          <Skeleton className="h-5 w-14 rounded-md" />
        </div>
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
      <Skeleton className="h-6 w-3/4 mb-4" />
      <div className="grid grid-cols-3 gap-3 rounded-xl border border-white/[0.06] bg-slate-950/50 p-3 mb-4">
        <div className="space-y-1.5">
          <Skeleton className="h-2.5 w-14" />
          <Skeleton className="h-4 w-16" />
        </div>
        <div className="space-y-1.5 border-l border-white/[0.06] pl-3">
          <Skeleton className="h-2.5 w-10" />
          <Skeleton className="h-4 w-14" />
        </div>
        <div className="space-y-1.5 border-l border-white/[0.06] pl-3">
          <Skeleton className="h-2.5 w-10" />
          <Skeleton className="h-4 w-12" />
        </div>
      </div>
      <div className="space-y-1.5 mb-4">
        <div className="flex justify-between">
          <Skeleton className="h-3 w-12" />
          <Skeleton className="h-3 w-8" />
        </div>
        <Skeleton className="h-1.5 w-full rounded-full" />
      </div>
      <div className="border-t border-white/[0.06] pt-3 flex justify-between">
        <Skeleton className="h-3 w-14" />
        <Skeleton className="h-3 w-20" />
      </div>
    </SkeletonCard>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-72" />
        </div>
        <Skeleton className="h-9 w-9 rounded-xl" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCardSkeleton className="animate-stagger-1" />
        <StatCardSkeleton className="animate-stagger-2" />
        <StatCardSkeleton className="animate-stagger-3" />
        <StatCardSkeleton className="animate-stagger-4" />
      </div>
      <SkeletonCard>
        <div className="flex items-center justify-between mb-4">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-20" />
        </div>
        <div className="space-y-3">
          <TableRowSkeleton />
          <TableRowSkeleton />
          <TableRowSkeleton />
        </div>
      </SkeletonCard>
    </div>
  );
}

export function MarketplaceSkeleton() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="space-y-2">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-4 w-80" />
      </div>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <AssetCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

export function AssetDetailSkeleton() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-9 rounded-xl" />
          <Skeleton className="h-7 w-40" />
          <Skeleton className="h-5 w-20 rounded-lg" />
          <Skeleton className="h-5 w-14 rounded-lg" />
        </div>
        <Skeleton className="h-8 w-24 rounded-xl" />
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <SkeletonCard className="h-80">
            <div className="flex items-center justify-between mb-4">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-24" />
            </div>
            <div className="space-y-3 mt-8">
              <Skeleton className="h-px w-full" />
              <div className="flex gap-4">
                <Skeleton className="h-40 flex-1" />
                <Skeleton className="h-40 flex-1" />
              </div>
            </div>
          </SkeletonCard>
        </div>
        <div className="lg:col-span-4">
          <SkeletonCard className="h-80">
            <div className="flex justify-between mb-4">
              <Skeleton className="h-5 w-28" />
              <Skeleton className="h-7 w-24 rounded-lg" />
            </div>
            <div className="space-y-4 mt-6">
              <Skeleton className="h-10 w-full rounded-2xl" />
              <Skeleton className="h-20 w-full rounded-2xl" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-3/4" />
            </div>
            <div className="mt-6 pt-4 border-t border-white/[0.06]">
              <Skeleton className="h-11 w-full rounded-2xl" />
            </div>
          </SkeletonCard>
        </div>
      </div>

      <SkeletonCard>
        <Skeleton className="h-6 w-36 mb-6" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-y-6 gap-x-8">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-5 w-24" />
            </div>
          ))}
        </div>
        <div className="mt-8 pt-6 border-t border-white/[0.06] grid grid-cols-1 sm:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-xl bg-slate-950/60 border border-white/[0.06] p-4 space-y-2">
              <Skeleton className="h-3 w-28" />
              <Skeleton className="h-4 w-24" />
            </div>
          ))}
        </div>
      </SkeletonCard>

      <SkeletonCard>
        <div className="flex justify-between mb-4">
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-4 w-24" />
        </div>
        <div className="flex gap-3">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="flex-1 space-y-2">
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-2 w-full rounded-full" />
            </div>
          ))}
        </div>
      </SkeletonCard>
    </div>
  );
}

export function PortfolioSkeleton() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-9 w-9 rounded-xl" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>
      <SkeletonCard>
        <Skeleton className="h-5 w-36 mb-4" />
        <div className="space-y-3">
          <TableRowSkeleton />
          <TableRowSkeleton />
        </div>
      </SkeletonCard>
    </div>
  );
}

export function BorrowSkeleton() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-9 w-9 rounded-xl" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <SkeletonCard>
            <Skeleton className="h-5 w-32 mb-4" />
            <div className="space-y-3">
              <TableRowSkeleton />
              <TableRowSkeleton />
            </div>
          </SkeletonCard>
        </div>
        <div className="lg:col-span-5">
          <SkeletonCard>
            <Skeleton className="h-5 w-36 mb-4" />
            <div className="space-y-4">
              <Skeleton className="h-10 w-full rounded-2xl" />
              <Skeleton className="h-10 w-full rounded-2xl" />
              <Skeleton className="h-11 w-full rounded-2xl" />
            </div>
          </SkeletonCard>
        </div>
      </div>
    </div>
  );
}

export function CollateralSkeleton() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-9 w-9 rounded-xl" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <StatCardSkeleton />
        <StatCardSkeleton />
      </div>
      <SkeletonCard>
        <Skeleton className="h-5 w-40 mb-4" />
        <div className="space-y-3">
          <TableRowSkeleton />
          <TableRowSkeleton />
        </div>
      </SkeletonCard>
    </div>
  );
}

export function YieldSkeleton() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-9 w-9 rounded-xl" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>
      <SkeletonCard>
        <Skeleton className="h-5 w-36 mb-4" />
        <div className="space-y-3">
          <TableRowSkeleton />
          <TableRowSkeleton />
        </div>
      </SkeletonCard>
    </div>
  );
}

export function ActivitySkeleton() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-9 w-9 rounded-xl" />
      </div>
      <SkeletonCard>
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 rounded-xl border border-white/[0.06] bg-slate-950/40 p-4">
              <Skeleton className="h-10 w-10 rounded-lg shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-3 w-1/4" />
              </div>
              <Skeleton className="h-3 w-24" />
            </div>
          ))}
        </div>
      </SkeletonCard>
    </div>
  );
}

export function TradingSkeleton() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-64" />
      </div>
      <div className="grid gap-6 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <SkeletonCard>
            <Skeleton className="h-5 w-32 mb-4" />
            <div className="space-y-4">
              <Skeleton className="h-10 w-full rounded-2xl" />
              <Skeleton className="h-10 w-full rounded-2xl" />
              <Skeleton className="h-10 w-full rounded-2xl" />
              <Skeleton className="h-11 w-full rounded-2xl" />
            </div>
          </SkeletonCard>
        </div>
        <div className="lg:col-span-7">
          <SkeletonCard>
            <Skeleton className="h-5 w-36 mb-4" />
            <div className="space-y-3">
              <TableRowSkeleton />
              <TableRowSkeleton />
              <TableRowSkeleton />
            </div>
          </SkeletonCard>
        </div>
      </div>
    </div>
  );
}

export function IssuerAssetsSkeleton() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-10 w-40 rounded-xl" />
      </div>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <AssetCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

export function AdminVerifySkeleton() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-4 w-72" />
        </div>
        <Skeleton className="h-9 w-9 rounded-xl" />
      </div>
      <SkeletonCard>
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-white/[0.06] bg-slate-950/40 p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-8 w-8 rounded-lg" />
                  <Skeleton className="h-5 w-32" />
                </div>
                <Skeleton className="h-8 w-28 rounded-xl" />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
          ))}
        </div>
      </SkeletonCard>
    </div>
  );
}
