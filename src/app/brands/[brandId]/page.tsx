import React, { Suspense } from "react";
import Link from "next/link";
import {
  getBrandDetail,
  ALL_BRAND_NAV,
  QueryFilters,
} from "@/lib/queries";
import { getBrandTheme } from "@/lib/brandTheme";
import { FilterBar } from "@/components/FilterBar";
import { BrandWorkspace } from "@/components/BrandWorkspace";
import {
  ArrowLeft,
  Store,
  Sparkles,
  CalendarRange,
} from "lucide-react";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ brandId: string }>;
  searchParams: Promise<{
    branch?: string;
    range?: string;
    from?: string;
    to?: string;
  }>;
}

export default async function BrandDetailPage({ params, searchParams }: PageProps) {
  const { brandId } = await params;
  const resolvedSearchParams = await searchParams;
  const filters: QueryFilters = {
    branch: resolvedSearchParams?.branch,
    range: resolvedSearchParams?.range,
    from: resolvedSearchParams?.from,
    to: resolvedSearchParams?.to,
  };

  const brandData = await getBrandDetail(brandId, filters);

  // Preserve query string for brand switching and back navigation
  const queryParams = new URLSearchParams();
  if (filters.branch && filters.branch !== "all") queryParams.set("branch", filters.branch);
  if (filters.range && filters.range !== "all") queryParams.set("range", filters.range);
  if (filters.from) queryParams.set("from", filters.from);
  if (filters.to) queryParams.set("to", filters.to);
  const filterQs = queryParams.toString() ? "?" + queryParams.toString() : "";

  if (!brandData) {
    return (
      <div className="p-6 sm:p-10 flex flex-col items-center justify-center space-y-4 max-w-xl mx-auto text-center">
        <div className="cockpit-panel rounded-2xl p-8 space-y-4">
          <h1 className="text-xl font-bold text-[var(--text-primary)]">Concept Not Found</h1>
          <p className="text-xs text-[var(--text-secondary)]">
            No telemetry records found for concept identifier:{" "}
            <code className="text-[var(--accent-primary)] font-mono px-1.5 py-0.5 rounded bg-[var(--bg-surface-2)]">
              {brandId}
            </code>
          </p>
          <div className="pt-2">
            <Link
              href={"/" + filterQs}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--accent-primary)] hover:opacity-90 text-white text-xs font-semibold rounded-xl transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Return to Executive Cockpit</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const { brandName, slug, kpi } = brandData;
  const theme = getBrandTheme(slug);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1600px] mx-auto">
      {/* =========================================================================
          Brand Hero Banner (Themed to Concept Personality)
          ========================================================================= */}
      <div className="cockpit-panel rounded-2xl p-5 sm:p-6 relative overflow-hidden">
        <div
          className="absolute top-0 right-0 w-[420px] h-[260px] rounded-full blur-3xl opacity-15 pointer-events-none"
          style={{ backgroundColor: theme.primaryColor }}
        />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 relative z-10">
          <div className="flex items-start sm:items-center gap-4">
            <div
              className="p-3.5 rounded-2xl border shadow-sm shrink-0"
              style={{
                backgroundColor: `${theme.primaryColor}18`,
                borderColor: `${theme.primaryColor}45`,
                color: theme.primaryColor,
              }}
            >
              <Store className="w-7 h-7" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <Link
                  href={"/" + filterQs}
                  className="inline-flex items-center gap-1 text-[11px] font-mono text-[var(--text-secondary)] hover:text-[var(--text-primary)] px-2 py-0.5 rounded-full bg-[var(--bg-surface-2)] border border-[var(--border-subtle)] transition-colors"
                >
                  <ArrowLeft className="w-3 h-3 text-[var(--accent-primary)]" />
                  <span>All Brands</span>
                </Link>
                <span
                  className="text-[11px] font-mono tracking-wider uppercase px-2.5 py-0.5 rounded-full border font-semibold"
                  style={{
                    backgroundColor: `${theme.primaryColor}15`,
                    borderColor: `${theme.primaryColor}35`,
                    color: theme.primaryColor,
                  }}
                >
                  {theme.conceptTag}
                </span>
                <span className="text-[11px] font-mono bg-[var(--bg-surface-2)] border border-[var(--border-subtle)] text-[var(--text-secondary)] px-2.5 py-0.5 rounded-full">
                  {kpi.order_count.toLocaleString()} completed tickets
                </span>
                <span className="badge-emerald px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold inline-flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  Pareto Engine
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text-primary)] mt-1.5">
                {brandName}
              </h1>
              <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-0.5">
                {theme.subtitle} · SKU Velocity, Kitchen SLA Throughput & Channel Mix
              </p>
            </div>
          </div>

          {/* Quick Concept Switcher */}
          <div className="flex flex-wrap items-center gap-1 p-1.5 surface-well rounded-xl self-start lg:self-center">
            {ALL_BRAND_NAV.map((b) => {
              const isActive = b.slug === slug;
              const bTheme = getBrandTheme(b.slug);
              return (
                <Link
                  key={b.slug}
                  href={"/brands/" + b.slug + filterQs}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all flex items-center gap-1.5 ${
                    isActive
                      ? "bg-[var(--bg-surface)] text-[var(--text-primary)] border border-[var(--border-strong)] shadow-sm font-semibold"
                      : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface)]/50"
                  }`}
                >
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: bTheme.primaryColor }}
                  />
                  <span>{b.shortName}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {slug === "herbox" && (
        <div className="cockpit-panel rounded-2xl p-4 sm:p-5 border-emerald-500/35 bg-emerald-500/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 shrink-0">
              <CalendarRange className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
                <span>Herbox Personal Catering Program CRM</span>
                <span className="badge-emerald px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold">
                  Aug – Nov 2026 Live
                </span>
              </div>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                Manage flexible L/D catering subscriptions, Lauk-only routines, 1-click date skips (OFF) with automatic Last Date rollover, and daily kitchen prep sheets.
              </p>
            </div>
          </div>
          <Link
            href="/catering"
            className="px-4 py-2 rounded-xl bg-[var(--accent-primary)] hover:opacity-90 text-white text-xs font-semibold inline-flex items-center gap-2 shrink-0 self-start sm:self-center shadow-xs transition-all"
          >
            <CalendarRange className="w-4 h-4" />
            <span>Open Catering CRM</span>
          </Link>
        </div>
      )}

      {/* =========================================================================
          Filter Bar
          ========================================================================= */}
      <Suspense fallback={<div className="h-16 cockpit-panel rounded-2xl animate-pulse" />}>
        <FilterBar
          initialBranch={filters.branch || "all"}
          initialRange={filters.range || "all"}
          initialFrom={filters.from || ""}
          initialTo={filters.to || ""}
        />
      </Suspense>

      {kpi.order_count === 0 ? (
        <div className="cockpit-panel rounded-2xl p-12 text-center space-y-3">
          <p className="text-base font-semibold text-[var(--text-primary)]">
            No Orders Recorded For Selected Filter
          </p>
          <p className="text-xs text-[var(--text-secondary)]">
            {brandName} did not record any completed orders matching outlet &quot;{filters.branch || "All"}&quot; and period &quot;{filters.range || "All"}&quot;.
          </p>
          <div className="pt-2">
            <Link
              href={"/brands/" + slug}
              className="text-xs font-mono text-[var(--accent-primary)] hover:underline font-semibold"
            >
              Reset to All Time / All Branches
            </Link>
          </div>
        </div>
      ) : (
        <BrandWorkspace brandData={brandData} />
      )}
    </div>
  );
}
