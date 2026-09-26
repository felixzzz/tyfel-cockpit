import React, { Suspense } from "react";
import Link from "next/link";
import {
  getExecutiveSummary,
  getBrandBreakdown,
  getBranchComparison,
  getChannelPerformance,
  getTopItems,
  getHourlyDistribution,
  getHeroRecipeBoms,
  getKitchenSlaDiagnostic,
  getCanceledOrdersDiagnostic,
  QueryFilters,
} from "@/lib/queries";
import { FilterBar } from "@/components/FilterBar";
import { DashboardWorkspace } from "@/components/DashboardWorkspace";
import { Store, Users, ArrowUpRight } from "lucide-react";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{
    branch?: string;
    range?: string;
    from?: string;
    to?: string;
  }>;
}

export default async function DashboardPage({ searchParams }: PageProps) {
  const resolvedSearchParams = await searchParams;
  const filters: QueryFilters = {
    branch: resolvedSearchParams?.branch,
    range: resolvedSearchParams?.range,
    from: resolvedSearchParams?.from,
    to: resolvedSearchParams?.to,
  };

  const [
    summary,
    brands,
    branches,
    channels,
    topItems,
    hourly,
    heroBoms,
    slaDiagnostic,
    cancellationDiagnostic,
  ] = await Promise.all([
    getExecutiveSummary(filters),
    getBrandBreakdown(filters),
    getBranchComparison(filters),
    getChannelPerformance(filters),
    getTopItems(8, filters),
    getHourlyDistribution(filters),
    getHeroRecipeBoms(filters),
    getKitchenSlaDiagnostic(filters),
    getCanceledOrdersDiagnostic(filters),
  ]);

  // Construct query string for persistent brand navigation
  const queryParams = new URLSearchParams();
  if (filters.branch && filters.branch !== "all") queryParams.set("branch", filters.branch);
  if (filters.range && filters.range !== "all") queryParams.set("range", filters.range);
  if (filters.from) queryParams.set("from", filters.from);
  if (filters.to) queryParams.set("to", filters.to);
  const filterQs = queryParams.toString() ? "?" + queryParams.toString() : "";

  return (
    <main className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1560px] mx-auto">
      {/* =========================================================================
          Top Header: Editorial Brandmark & Quick Operations Switcher
          ========================================================================= */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-2">
        <div className="flex items-start gap-3.5">
          <div className="p-3 rounded-2xl badge-emerald shrink-0 mt-0.5">
            <Store className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono tracking-widest uppercase px-2 py-0.5 rounded badge-neutral font-semibold">
                Consolidated Portfolio
              </span>
              <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                {summary.total_orders.toLocaleString()} Completed Tickets
              </span>
            </div>
            <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-[var(--text-primary)] mt-1 font-display">
              Multi-Brand Culinary Operations
            </h1>
            <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-0.5">
              Financial realization, unit economics & kitchen prep SLA across Greenville Flagship & Kemang Cloud Kitchen
            </p>
          </div>
        </div>

        {/* Clean Operational Shortcut */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <Link
            href="/attendance"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-[var(--accent-primary)] hover:bg-[var(--accent-primary-hover)] text-white transition-all shadow-xs"
          >
            <Users className="w-4 h-4" />
            <span>Staff & Payslips (16–15)</span>
            <ArrowUpRight className="w-3.5 h-3.5 opacity-80" />
          </Link>
        </div>
      </div>

      {/* =========================================================================
          Global Interactive Tactical Filter Bar
          ========================================================================= */}
      <Suspense fallback={<div className="h-16 cockpit-panel rounded-2xl animate-pulse" />}>
        <FilterBar
          initialBranch={filters.branch || "all"}
          initialRange={filters.range || "all"}
          initialFrom={filters.from || ""}
          initialTo={filters.to || ""}
        />
      </Suspense>

      {/* =========================================================================
          Interactive Mode-Scoped Dashboard Workspace
          ========================================================================= */}
      <DashboardWorkspace
        summary={summary}
        brands={brands}
        branches={branches}
        channels={channels}
        topItems={topItems}
        hourly={hourly}
        heroBoms={heroBoms}
        slaDiagnostic={slaDiagnostic}
        cancellationDiagnostic={cancellationDiagnostic}
        filterQs={filterQs}
      />
    </main>
  );
}
