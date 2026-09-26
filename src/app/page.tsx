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
  ALL_BRAND_NAV,
  getDataFreshness,
  brandToSlug,
  QueryFilters,
} from "@/lib/queries";
import { getBrandTheme, getChannelColor } from "@/lib/brandTheme";
import { BrandRevenueChart, ChannelPieChart, HourlyOrderChart } from "@/components/Charts";
import { FilterBar } from "@/components/FilterBar";
import { DataFreshnessBar } from "@/components/DataFreshnessBar";
import {
  DollarSign,
  TrendingUp,
  Flame,
  Clock,
  ShoppingBag,
  Store,
  ShieldCheck,
  UploadCloud,
  Layers,
  ArrowRight,
  ExternalLink,
  ChevronRight,
  Building2,
  UtensilsCrossed,
} from "lucide-react";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{
    branch?: string;
    range?: string;
    from?: string;
    to?: string;
  }>;
}

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export default async function DashboardPage({ searchParams }: PageProps) {
  const resolvedSearchParams = await searchParams;
  const filters: QueryFilters = {
    branch: resolvedSearchParams?.branch,
    range: resolvedSearchParams?.range,
    from: resolvedSearchParams?.from,
    to: resolvedSearchParams?.to,
  };

  const [summary, brands, branches, channels, topItems, hourly, heroBoms, freshness] = await Promise.all([
    getExecutiveSummary(filters),
    getBrandBreakdown(filters),
    getBranchComparison(filters),
    getChannelPerformance(filters),
    getTopItems(8, filters),
    getHourlyDistribution(filters),
    getHeroRecipeBoms(filters),
    getDataFreshness(),
  ]);

  // Construct query string for persistent brand navigation
  const queryParams = new URLSearchParams();
  if (filters.branch && filters.branch !== "all") queryParams.set("branch", filters.branch);
  if (filters.range && filters.range !== "all") queryParams.set("range", filters.range);
  if (filters.from) queryParams.set("from", filters.from);
  if (filters.to) queryParams.set("to", filters.to);
  const filterQs = queryParams.toString() ? "?" + queryParams.toString() : "";

  return (
    <main className="min-h-screen p-4 sm:p-6 lg:p-10 space-y-8 max-w-[1600px] mx-auto">
      {/* =========================================================================
          Top Header: Executive Brandmark & Telemetry Status
          ========================================================================= */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-5 pb-6 border-b border-white/[0.08]">
        <div>
          <div className="flex items-center gap-3.5">
            <div className="p-2.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
              <Store className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <span className="text-xs font-mono tracking-widest uppercase px-2 py-0.5 rounded bg-white/[0.06] text-zinc-300 border border-white/[0.08]">
                  Executive Operations
                </span>
                <span className="text-xs font-mono text-emerald-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  LIVE
                </span>
              </div>
              <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-white mt-1">
                FnB Multi-Brand Operations Cockpit
              </h1>
              <p className="text-xs sm:text-sm text-zinc-400 mt-0.5">
                Real-time financial realization, unit economics & kitchen throughput across Greenville & Kemang
              </p>
            </div>
          </div>
        </div>

        {/* Engine Badges & Dropzone Action */}
        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            href="/ingest"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-black transition-colors cursor-pointer"
          >
            <UploadCloud className="w-4 h-4 stroke-[2.5]" />
            <span>Upload Reports (Dropzone)</span>
          </Link>
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono font-medium bg-white/[0.03] text-zinc-300 border border-white/[0.08]">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Idempotent Upsert</span>
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono font-medium bg-white/[0.03] text-zinc-300 border border-white/[0.08]">
            <Layers className="w-3.5 h-3.5 text-blue-400" />
            <span>DuckDB In-Memory OLAP</span>
          </div>
        </div>
      </header>

      {/* =========================================================================
          Data Freshness & Source Sync Status
          ========================================================================= */}
      <DataFreshnessBar freshness={freshness} />

      {/* =========================================================================
          Global Interactive Tactical Filter Bar
          ========================================================================= */}
      <Suspense fallback={<div className="h-20 cockpit-panel rounded-2xl animate-pulse" />}>
        <FilterBar
          initialBranch={filters.branch || "all"}
          initialRange={filters.range || "all"}
          initialFrom={filters.from || ""}
          initialTo={filters.to || ""}
        />
      </Suspense>

      {/* =========================================================================
          Brand Concept Matrix Switcher (Bespoke Personality Pills)
          ========================================================================= */}
      <div className="cockpit-panel rounded-2xl p-4 sm:p-5 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Brand Portfolio:
            </span>
            <span className="text-xs text-zinc-400 hidden md:inline">
              Select any brand to view SKU velocity, prep SLAs, and delivery vs dine-in mix
            </span>
          </div>
          <span className="text-xs text-zinc-400">
            5 Concepts · 2 Outlets
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
          {ALL_BRAND_NAV.map((b) => {
            const theme = getBrandTheme(b.slug);
            return (
              <Link
                key={b.slug}
                href={"/brands/" + b.slug + filterQs}
                className="group relative overflow-hidden rounded-xl p-3 bg-white/[0.02] hover:bg-white/[0.06] border border-white/[0.06] hover:border-white/[0.15] transition-all flex flex-col justify-between"
              >
                <div
                  className="absolute top-0 right-0 w-24 h-24 rounded-full blur-2xl opacity-20 pointer-events-none group-hover:opacity-40 transition-opacity"
                  style={{ backgroundColor: theme.primaryColor }}
                />
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-zinc-400 group-hover:text-zinc-300">
                    {theme.conceptTag}
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 text-zinc-500 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
                </div>
                <div className="mt-2">
                  <div className="text-sm font-semibold text-white group-hover:text-white flex items-center gap-2">
                    <span
                      className="w-2 h-2 rounded-full inline-block shrink-0 shadow-sm"
                      style={{ backgroundColor: theme.primaryColor }}
                    />
                    <span className="truncate">{b.name}</span>
                  </div>
                  <div className="text-xs text-zinc-400 truncate mt-1">
                    {theme.subtitle}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* =========================================================================
          Executive Performance Summary
          ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Gross GMV */}
        <div className="cockpit-panel rounded-2xl p-5 relative overflow-hidden accent-bar-blue">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Gross GMV
            </span>
            <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3.5">
            <div className="text-3xl sm:text-4xl font-bold text-white tracking-tight tabular-nums">
              {formatRupiah(summary.total_gross_gmv)}
            </div>
            <div className="text-xs text-zinc-400 mt-2 flex items-center gap-1.5 font-mono">
              <ShoppingBag className="w-3.5 h-3.5 text-blue-400 shrink-0" />
              <span>
                <strong className="text-zinc-200">{summary.total_orders.toLocaleString()}</strong> orders
                {" · "}
                AOV <strong className="text-zinc-200">{formatRupiah(summary.avg_order_value)}</strong>
              </span>
            </div>
          </div>
        </div>

        {/* Metric 2: Net Cash Realization */}
        <div className="cockpit-panel rounded-2xl p-5 relative overflow-hidden accent-bar-emerald">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Net Cash Realization
            </span>
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3.5">
            <div className="text-3xl sm:text-4xl font-bold text-emerald-400 tracking-tight tabular-nums">
              {formatRupiah(summary.total_net_payout)}
            </div>
            <div className="text-xs text-zinc-400 mt-2 flex items-center gap-1.5">
              <span className="font-mono font-semibold px-1.5 py-0.5 rounded text-xs bg-emerald-950/60 text-emerald-300 border border-emerald-800/40">
                {summary.net_realization_rate}% Realized
              </span>
              <span className="text-xs text-zinc-400">(Benchmark: ≥68%)</span>
            </div>
          </div>
        </div>

        {/* Metric 3: Merchant Promo Burn */}
        <div className="cockpit-panel rounded-2xl p-5 relative overflow-hidden accent-bar-rose">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Merchant Promo Burn
            </span>
            <div className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <Flame className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3.5">
            <div className="text-3xl sm:text-4xl font-bold text-rose-400 tracking-tight tabular-nums">
              {formatRupiah(summary.total_merchant_promo_burn)}
            </div>
            <div className="text-xs text-zinc-400 mt-2 flex items-center gap-1.5">
              <span
                className={`font-mono font-semibold px-1.5 py-0.5 rounded text-xs border ${
                  summary.promo_burn_rate_pct > 15
                    ? "bg-rose-950/70 text-rose-300 border-rose-800/50"
                    : "bg-zinc-800/60 text-zinc-300 border-white/10"
                }`}
              >
                {summary.promo_burn_rate_pct}% of GMV
              </span>
              <span className="text-xs text-zinc-400">
                {summary.promo_burn_rate_pct > 15 ? "⚠️ Over 15% ceiling" : "Ceiling ≤15%"}
              </span>
            </div>
          </div>
        </div>

        {/* Metric 4: Kitchen SLA & Prep Time */}
        <div className="cockpit-panel rounded-2xl p-5 relative overflow-hidden accent-bar-amber">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Avg Prep Time / SLA
            </span>
            <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3.5">
            <div className="text-3xl sm:text-4xl font-bold text-white tracking-tight tabular-nums flex items-baseline gap-2.5">
              <span>{summary.avg_prep_time_minutes > 0 ? `${summary.avg_prep_time_minutes} min` : "—"}</span>
              <span
                className={`text-xs px-2 py-0.5 rounded font-mono font-medium border ${
                  summary.sla_breach_count > 0
                    ? "bg-amber-950/70 text-amber-300 border-amber-800/40"
                    : "bg-emerald-950/70 text-emerald-300 border-emerald-800/40"
                }`}
              >
                {summary.sla_breach_count} Breaches ({summary.sla_breach_rate_pct}%)
              </span>
            </div>
            <div className="text-xs text-zinc-400 mt-2 font-mono text-xs">
              Targets: Kemang ≤12m · Greenville ≤15m
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          Visual Analytics Grid: Brand Financials & Channel Share
          ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Brand Performance & Economics */}
        <div className="lg:col-span-2 cockpit-panel rounded-2xl p-5 sm:p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold text-white tracking-tight">
                  Brand Financial Economics
                </h2>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-white/[0.05] text-zinc-400 border border-white/[0.08]">
                  Triple-Stream GMV vs Payout vs Promo
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Gross GMV vs Net Settlement vs Merchant Promo Burn across concepts
              </p>
            </div>
            <span className="text-xs text-zinc-400 font-mono">In Thousands (IDR)</span>
          </div>

          <BrandRevenueChart data={brands} />
        </div>

        {/* Channel Share Donut */}
        <div className="cockpit-panel rounded-2xl p-5 sm:p-6 space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-base font-semibold text-white tracking-tight">
                Channel Distribution
              </h2>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-white/[0.05] text-zinc-400 border border-white/[0.08]">
                Platform Split
              </span>
            </div>
            <p className="text-xs text-zinc-400">GrabFood vs GoFood vs Direct POS</p>
          </div>

          <ChannelPieChart data={channels} />

          <div className="space-y-2 border-t border-white/[0.08] pt-4">
            {channels.map((ch) => {
              const channelColor = getChannelColor(ch.provider);
              return (
                <div
                  key={ch.provider}
                  className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="w-3 h-3 rounded-full shrink-0 shadow-sm"
                      style={{ backgroundColor: channelColor }}
                    />
                    <span className="text-zinc-100 font-semibold text-sm">{ch.provider}</span>
                  </div>
                  <div className="text-right font-mono text-xs sm:text-sm">
                    <span className="text-zinc-300 font-medium">{ch.order_count.toLocaleString()} orders</span>
                    <span className="text-zinc-500 mx-2">·</span>
                    <span className="text-emerald-400 font-semibold">{ch.net_realization_rate}% net</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* =========================================================================
          Branch Comparison & Order Velocity (Hourly Cadence)
          ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Branch Benchmark Cards */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-white tracking-tight">
              Branch Benchmarks
            </h2>
            <span className="text-xs text-zinc-400">2 Active Locations</span>
          </div>

          {branches.length === 0 ? (
            <div className="cockpit-panel rounded-2xl p-6 text-center text-xs text-zinc-500">
              No branch orders found for selected filter
            </div>
          ) : (
            branches.map((b) => (
              <div
                key={b.branch}
                className={`cockpit-panel rounded-2xl p-5 space-y-3.5 relative overflow-hidden ${
                  b.branch === "Kemang" ? "accent-bar-purple" : "accent-bar-emerald"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`p-2 rounded-xl border ${
                        b.branch === "Kemang"
                          ? "bg-purple-500/10 text-purple-400 border-purple-500/20"
                          : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                      }`}
                    >
                      <Building2 className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-sm font-bold text-white flex items-center gap-1.5">
                        {b.branch}
                      </span>
                      <span className="text-xs text-zinc-400 block">
                        {b.branch === "Kemang" ? "Cloud Kitchen · Delivery Only" : "Flagship Dine-in & Delivery"}
                      </span>
                    </div>
                  </div>

                  <span className="text-xs font-mono bg-white/[0.04] border border-white/[0.08] px-2.5 py-1 rounded-lg text-zinc-300">
                    {b.order_count.toLocaleString()} orders
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs pt-3 border-t border-white/[0.06]">
                  <div className="bg-black/30 rounded-xl p-2.5 border border-white/[0.04]">
                    <div className="text-zinc-500 text-xs uppercase font-mono">Gross GMV</div>
                    <div className="text-sm font-bold text-white font-mono mt-0.5 tabular-nums">
                      {formatRupiah(b.gross_gmv)}
                    </div>
                  </div>
                  <div className="bg-black/30 rounded-xl p-2.5 border border-white/[0.04]">
                    <div className="text-zinc-500 text-xs uppercase font-mono">Net Settlement</div>
                    <div className="text-sm font-bold text-emerald-400 font-mono mt-0.5 tabular-nums">
                      {formatRupiah(b.net_payout)}
                    </div>
                  </div>
                  <div className="bg-black/30 rounded-xl p-2.5 border border-white/[0.04]">
                    <div className="text-zinc-500 text-xs uppercase font-mono">Net Realization</div>
                    <div className="text-sm font-bold text-white font-mono mt-0.5 tabular-nums">
                      {b.net_realization_rate}%
                    </div>
                  </div>
                  <div className="bg-black/30 rounded-xl p-2.5 border border-white/[0.04]">
                    <div className="text-zinc-500 text-xs uppercase font-mono">Avg Prep / SLA</div>
                    <div className="text-sm font-bold text-amber-400 font-mono mt-0.5 tabular-nums">
                      {b.avg_prep_time_min > 0 ? `${b.avg_prep_time_min}m` : "—"}
                      <span className="text-xs text-zinc-400 font-normal ml-1">
                        ({b.sla_breaches} breaches)
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Hourly Order Velocity */}
        <div className="lg:col-span-2 cockpit-panel rounded-2xl p-5 sm:p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-semibold text-white tracking-tight">
                Order Velocity & Rush Windows
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Peak kitchen ticket cadence (11:00-13:00 Lunch · 18:00-20:00 Dinner)
              </p>
            </div>
            <span className="text-xs text-zinc-500 font-mono">24h Cadence</span>
          </div>

          <HourlyOrderChart data={hourly} />
        </div>
      </div>

      {/* =========================================================================
          Brand Detailed Performance Matrix Table
          ========================================================================= */}
      <div className="cockpit-panel rounded-2xl p-5 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold text-white tracking-tight">
                Brand Unit Economics Matrix
              </h2>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-white/[0.05] text-zinc-400 border border-white/[0.08]">
                Granular Audit
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              Multi-brand unit economics, promo burn & SLA metrics across Greenville and Kemang
            </p>
          </div>
          <span className="text-xs text-emerald-400 bg-emerald-950/60 border border-emerald-800/40 px-3 py-1 rounded-xl font-mono">
            Zero-Duplicate Verified
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-white/[0.08] text-zinc-400 uppercase font-semibold text-xs tracking-wider">
                <th className="py-3.5 px-4">Brand & Concept</th>
                <th className="py-3.5 px-4">Branch</th>
                <th className="py-3.5 px-4 text-right">Orders</th>
                <th className="py-3.5 px-4 text-right">Gross GMV</th>
                <th className="py-3.5 px-4 text-right">Net Payout</th>
                <th className="py-3.5 px-4 text-right">Net Realization</th>
                <th className="py-3.5 px-4 text-right">Promo Burn</th>
                <th className="py-3.5 px-4 text-right">Avg Prep</th>
                <th className="py-3.5 px-4 text-right">Breaches</th>
                <th className="py-3.5 px-4 text-center">Drill-Down</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {brands.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-zinc-500 font-mono">
                    No brand activity found for the selected filter parameters.
                  </td>
                </tr>
              ) : (
                brands.map((b, idx) => {
                  const slug = brandToSlug(b.brand);
                  const theme = getBrandTheme(b.brand);
                  return (
                    <tr
                      key={b.brand + "-" + b.branch + "-" + idx}
                      className="hover:bg-white/[0.03] transition-colors"
                    >
                      <td className="py-3.5 px-4">
                        <Link
                          href={"/brands/" + slug + filterQs}
                          className="flex items-center gap-2 group"
                        >
                          <span
                            className="w-2 h-2 rounded-full shrink-0 shadow-sm"
                            style={{ backgroundColor: theme.primaryColor }}
                          />
                          <div>
                            <span className="font-semibold text-white group-hover:text-emerald-400 transition-colors">
                              {b.brand}
                            </span>
                            <span className="text-xs text-zinc-400 block">
                              {theme.conceptTag}
                            </span>
                          </div>
                          <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-emerald-400 ml-1" />
                        </Link>
                      </td>
                      <td className="py-3.5 px-4 text-zinc-400 font-mono text-xs">
                        <span
                          className={`inline-block w-1.5 h-1.5 rounded-full mr-1.5 ${
                            b.branch === "Kemang" ? "bg-purple-400" : "bg-emerald-400"
                          }`}
                        />
                        {b.branch}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-zinc-300 tabular-nums">
                        {b.order_count.toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-white font-semibold tabular-nums">
                        {formatRupiah(b.gross_gmv)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-emerald-400 font-semibold tabular-nums">
                        {formatRupiah(b.net_payout)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono tabular-nums">
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-medium border ${
                            b.net_realization_rate >= 80
                              ? "text-emerald-300 bg-emerald-950/60 border-emerald-800/40"
                              : "text-amber-300 bg-amber-950/60 border-amber-800/40"
                          }`}
                        >
                          {b.net_realization_rate}%
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-rose-400 tabular-nums">
                        {formatRupiah(b.merchant_promo_burn)}
                        <span className="text-zinc-500 text-xs ml-1">
                          ({b.promo_burn_rate_pct}%)
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-zinc-300 tabular-nums">
                        {b.avg_prep_time_min > 0 ? `${b.avg_prep_time_min}m` : "—"}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono tabular-nums">
                        {b.sla_breaches > 0 ? (
                          <span className="text-amber-400 font-semibold">
                            {b.sla_breaches}
                          </span>
                        ) : (
                          <span className="text-zinc-600">0</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <Link
                          href={"/brands/" + slug + filterQs}
                          className="inline-flex items-center gap-1 text-xs font-medium text-emerald-300 hover:text-white bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-800/40 px-2.5 py-1 rounded-lg transition-all"
                        >
                          <span>Drill-Down</span>
                          <ArrowRight className="w-3 h-3" />
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* =========================================================================
          Top 8 Menu Items Leaderboard
          ========================================================================= */}
      <div className="cockpit-panel rounded-2xl p-5 sm:p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold text-white tracking-tight">
                Top Menu Items (Volume Velocity)
              </h2>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-white/[0.05] text-zinc-400 border border-white/[0.08]">
                SKU Pareto Leaders
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              Ranked by total units sold across Greenville & Kemang
            </p>
          </div>
          <span className="text-xs font-mono text-zinc-500">Top 8 SKUs</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {topItems.length === 0 ? (
            <div className="col-span-full p-8 text-center text-zinc-500 text-xs font-mono">
              No menu items found for the selected filter.
            </div>
          ) : (
            topItems.map((item, idx) => {
              const theme = getBrandTheme(item.brand);
              return (
                <div
                  key={item.item_name + "-" + idx}
                  className="cockpit-panel rounded-xl p-4 flex flex-col justify-between space-y-3 relative overflow-hidden group hover:border-white/15"
                >
                  <div
                    className="absolute top-0 right-0 w-20 h-20 rounded-full blur-2xl opacity-15 pointer-events-none"
                    style={{ backgroundColor: theme.primaryColor }}
                  />
                  <div>
                    <div className="flex items-center justify-between text-xs text-zinc-400 mb-1.5 font-mono">
                      <span className="font-bold text-zinc-300">
                        #{idx + 1} · {item.branch}
                      </span>
                      <Link
                        href={"/brands/" + brandToSlug(item.brand) + filterQs}
                        className="hover:underline flex items-center gap-1 font-semibold"
                        style={{ color: theme.primaryColor }}
                      >
                        <span>{item.brand}</span>
                      </Link>
                    </div>
                    <div
                      className="text-xs font-semibold text-white line-clamp-2 leading-snug group-hover:text-emerald-300 transition-colors"
                      title={item.item_name}
                    >
                      {item.item_name}
                    </div>
                  </div>

                  <div className="flex items-baseline justify-between pt-2 border-t border-white/[0.06] text-xs">
                    <span className="font-mono text-zinc-400 text-xs">
                      <strong className="text-white font-bold">{item.total_qty}</strong> units
                    </span>
                    <span className="font-mono font-bold text-emerald-400 tabular-nums text-xs">
                      {formatRupiah(item.total_revenue)}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* =========================================================================
          Hero Recipe BOMs & Theoretical Food Cost Engine (dim_recipes)
          ========================================================================= */}
      {heroBoms.length > 0 && (
        <div className="cockpit-panel rounded-2xl p-5 sm:p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <UtensilsCrossed className="w-4 h-4 text-emerald-400" />
                <h2 className="text-base font-semibold text-white tracking-tight">
                  Hero SKU Recipe BOMs & Theoretical Food Cost
                </h2>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-300 border border-emerald-800/40">
                  100% Vegetarian BOM
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Standardized Bill of Materials from <code className="text-zinc-300">dim_recipes</code> joined against live SKU sales velocity
              </p>
            </div>
            <span className="text-xs font-mono text-zinc-400">
              Select any brand for full 4-Quadrant Menu Engineering Matrix
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {heroBoms.map((bom) => {
              const theme = getBrandTheme(bom.brand);
              const slug = brandToSlug(bom.brand);
              return (
                <Link
                  key={bom.recipe_id}
                  href={"/brands/" + slug + filterQs}
                  className="rounded-xl p-4 bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.08] hover:border-white/[0.18] transition-colors flex flex-col justify-between space-y-3"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className="text-xs font-semibold flex items-center gap-1.5"
                        style={{ color: theme.primaryColor }}
                      >
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: theme.primaryColor }}
                        />
                        {bom.brand}
                      </span>
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-300 border border-emerald-800/40">
                        {bom.delivery_food_cost_pct}% Deliv COGS
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-white leading-snug">
                      {bom.canonical_name}
                    </h3>
                    <p className="text-[11px] text-zinc-400 font-mono leading-relaxed line-clamp-2">
                      {bom.bom_summary}
                    </p>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-white/[0.06] text-xs font-mono">
                    <div className="grid grid-cols-3 gap-1.5 text-center">
                      <div className="bg-black/30 rounded-lg p-1.5 border border-white/[0.04]">
                        <span className="text-[10px] text-zinc-500 block">Menu</span>
                        <span className="text-white font-semibold tabular-nums">
                          {formatRupiah(bom.realized_menu_price)}
                        </span>
                      </div>
                      <div className="bg-black/30 rounded-lg p-1.5 border border-white/[0.04]">
                        <span className="text-[10px] text-zinc-500 block">BOM+Pkg</span>
                        <span className="text-amber-300 font-semibold tabular-nums">
                          {formatRupiah(bom.raw_food_cost + bom.packaging_delivery)}
                        </span>
                      </div>
                      <div className="bg-black/30 rounded-lg p-1.5 border border-white/[0.04]">
                        <span className="text-[10px] text-zinc-500 block">Margin</span>
                        <span className="text-emerald-400 font-bold tabular-nums">
                          {formatRupiah(bom.delivery_margin_rp)}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-zinc-400 pt-1">
                      <span>Sold: <strong className="text-zinc-200">{bom.realized_units_sold}</strong> units</span>
                      <span className="text-emerald-400 font-semibold">
                        Pkg Drag: {bom.packaging_drag_pct}%
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </main>
  );
}
