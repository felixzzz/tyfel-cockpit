import React, { Suspense } from "react";
import Link from "next/link";
import {
  getBrandDetail,
  ALL_BRAND_NAV,
  QueryFilters,
} from "@/lib/queries";
import { getBrandTheme } from "@/lib/brandTheme";
import { getCateringExecutiveSummary } from "@/lib/catering";
import { FilterBar } from "@/components/FilterBar";
import { BrandWorkspace } from "@/components/BrandWorkspace";
import {
  ArrowLeft,
  Store,
  Sparkles,
  CalendarRange,
  Boxes,
  Users,
  Receipt,
  TrendingUp,
  CheckCircle2,
  ArrowUpRight,
} from "lucide-react";

export const dynamic = "force-dynamic";

function formatRp(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
}

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
  const defaultRange = resolvedSearchParams?.from || resolvedSearchParams?.to ? undefined : "7d";
  const selectedRange = resolvedSearchParams?.range ?? defaultRange;
  const filters: QueryFilters = {
    branch: resolvedSearchParams?.branch,
    range: selectedRange,
    from: resolvedSearchParams?.from,
    to: resolvedSearchParams?.to,
  };

  const [brandData, cateringSummary] = await Promise.all([
    getBrandDetail(brandId, filters),
    brandId.toLowerCase() === "herbox" ? getCateringExecutiveSummary() : null,
  ]);

  // Preserve query string for brand switching and back navigation
  const queryParams = new URLSearchParams();
  if (filters.branch && filters.branch !== "all") queryParams.set("branch", filters.branch);
  if (filters.range && filters.range !== "7d") queryParams.set("range", filters.range);
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

      {slug === "herbox" && cateringSummary && (
        <div className="cockpit-panel rounded-2xl p-5 sm:p-6 border-emerald-500/35 bg-gradient-to-br from-emerald-500/10 via-[var(--bg-surface-1)] to-emerald-500/5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--border-subtle)] pb-4">
            <div className="flex items-start sm:items-center gap-3.5">
              <div className="p-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 shrink-0">
                <CalendarRange className="w-5 h-5" />
              </div>
              <div>
                <div className="text-base font-bold text-[var(--text-primary)] flex items-center gap-2 flex-wrap">
                  <span>Herbox Personal Catering · Recurring Subscription Stream</span>
                  <span className="badge-emerald px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold">
                    Aug – Nov 2026 Live
                  </span>
                  <span className="badge-neutral px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold">
                    Digitalized Matrix CRM
                  </span>
                </div>
                <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                  Subscription delivery telemetry beyond regular POS orders: meal quotas, flexible date skips (OFF), daily dispatch, and client self-service portals.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Link
                href="/catering"
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold inline-flex items-center gap-2 shadow-xs transition-all"
              >
                <CalendarRange className="w-4 h-4" />
                <span>Open Catering CRM</span>
                <ArrowUpRight className="w-3.5 h-3.5 opacity-80" />
              </Link>
            </div>
          </div>

          {/* 4 Telemetry Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-xl bg-[var(--bg-surface-2)]/70 border border-[var(--border-subtle)] space-y-1">
              <div className="flex items-center justify-between text-[11px] font-mono uppercase text-[var(--text-muted)] font-semibold">
                <span>Contracted Revenue</span>
                <Receipt className="w-3.5 h-3.5 text-emerald-500" />
              </div>
              <div className="text-xl font-bold text-[var(--text-primary)] font-display">
                {formatRp(cateringSummary.total_revenue_billed)}
              </div>
              <div className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                <span>
                  {formatRp(cateringSummary.total_revenue_paid)} Paid
                  {cateringSummary.total_revenue_pending > 0 && (
                    <span className="text-amber-500 ml-1">
                      ({formatRp(cateringSummary.total_revenue_pending)} Pending)
                    </span>
                  )}
                </span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-[var(--bg-surface-2)]/70 border border-[var(--border-subtle)] space-y-1">
              <div className="flex items-center justify-between text-[11px] font-mono uppercase text-[var(--text-muted)] font-semibold">
                <span>Estimated MRR</span>
                <TrendingUp className="w-3.5 h-3.5 text-sky-500" />
              </div>
              <div className="text-xl font-bold text-sky-600 dark:text-sky-400 font-display">
                {formatRp(cateringSummary.estimated_mrr)}
              </div>
              <div className="text-[11px] text-[var(--text-secondary)] font-mono">
                Active monthly subscription run-rate
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-[var(--bg-surface-2)]/70 border border-[var(--border-subtle)] space-y-1">
              <div className="flex items-center justify-between text-[11px] font-mono uppercase text-[var(--text-muted)] font-semibold">
                <span>Fulfillment Velocity</span>
                <Boxes className="w-3.5 h-3.5 text-amber-500" />
              </div>
              <div className="text-xl font-bold text-[var(--text-primary)] font-display">
                {cateringSummary.total_boxes_delivered}{" "}
                <span className="text-xs font-normal text-[var(--text-muted)]">
                  / {cateringSummary.total_boxes_contracted} boxes
                </span>
              </div>
              <div className="text-[11px] font-mono text-[var(--text-secondary)]">
                <strong className="text-emerald-600 dark:text-emerald-400">
                  {cateringSummary.fulfillment_rate_pct}% fulfilled
                </strong>{" "}
                · {cateringSummary.total_boxes_scheduled} scheduled
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-[var(--bg-surface-2)]/70 border border-[var(--border-subtle)] space-y-1">
              <div className="flex items-center justify-between text-[11px] font-mono uppercase text-[var(--text-muted)] font-semibold">
                <span>Subscribers &amp; Skips</span>
                <Users className="w-3.5 h-3.5 text-indigo-500" />
              </div>
              <div className="text-xl font-bold text-[var(--text-primary)] font-display">
                {cateringSummary.active_subscribers}{" "}
                <span className="text-xs font-normal text-[var(--text-muted)]">
                  active ({cateringSummary.total_subscribers} total)
                </span>
              </div>
              <div className="text-[11px] font-mono text-[var(--text-secondary)]">
                {cateringSummary.total_boxes_skipped} skips smoothly rolled over
              </div>
            </div>
          </div>

          {/* Plan Category Distribution Strip */}
          <div className="pt-2 flex flex-wrap items-center justify-between gap-3 text-xs border-t border-[var(--border-subtle)]">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-mono uppercase text-[var(--text-muted)] font-semibold">
                Plan Mix:
              </span>
              {cateringSummary.category_breakdown.map((cat) => (
                <div
                  key={cat.category}
                  className="px-2.5 py-1 rounded-lg bg-[var(--bg-surface-2)] border border-[var(--border-subtle)] flex items-center gap-1.5 text-[11px]"
                >
                  <span className="font-semibold text-[var(--text-primary)]">
                    {cat.label}:
                  </span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-mono font-bold">
                    {cat.subscribers} subs · {cat.boxes} box ({formatRp(cat.revenue)})
                  </span>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2 text-xs">
              <Link
                href="/catering"
                className="text-[var(--accent-primary)] hover:underline font-semibold font-mono text-[11px] inline-flex items-center gap-1"
              >
                <span>Dispatch Slips &amp; Invoices</span>
                <ArrowUpRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          Filter Bar
          ========================================================================= */}
      <Suspense fallback={<div className="h-16 cockpit-panel rounded-2xl animate-pulse" />}>
        <FilterBar
          initialBranch={filters.branch || "all"}
          initialRange={filters.range || "7d"}
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
            {brandName} did not record any completed orders matching outlet &quot;{filters.branch || "All"}&quot; and period &quot;{filters.range || "7d"}&quot;.
          </p>
          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            <Link
              href={"/brands/" + slug + "?range=all"}
              className="text-xs font-mono text-[var(--accent-primary)] hover:underline font-semibold"
            >
              View All Time
            </Link>
            <span className="text-[var(--text-muted)] text-xs">·</span>
            <Link
              href={"/brands/" + slug}
              className="text-xs font-mono text-[var(--text-secondary)] hover:underline font-semibold"
            >
              Reset to 7 Days (Default)
            </Link>
          </div>
        </div>
      ) : (
        <BrandWorkspace brandData={brandData} />
      )}
    </div>
  );
}
