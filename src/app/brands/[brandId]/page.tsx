import React, { Suspense } from "react";
import Link from "next/link";
import {
  getBrandDetail,
  ALL_BRAND_NAV,
  getDataFreshness,
  QueryFilters,
} from "@/lib/queries";
import { getBrandTheme, getChannelColor } from "@/lib/brandTheme";
import {
  SkuParetoBarChart,
  BrandHourlyKptChart,
  BrandChannelChart,
} from "@/components/Charts";
import { FilterBar } from "@/components/FilterBar";
import { DataFreshnessBar } from "@/components/DataFreshnessBar";
import { KitchenSlaHeatmap } from "@/components/KitchenSlaHeatmap";
import {
  ArrowLeft,
  Flame,
  ShoppingBag,
  TrendingUp,
  AlertTriangle,
  Store,
  Layers,
  Sparkles,
  Boxes,
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

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
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

  const [brandData, freshness] = await Promise.all([
    getBrandDetail(brandId, filters),
    getDataFreshness(filters),
  ]);

  // Preserve query string for brand switching and back navigation
  const queryParams = new URLSearchParams();
  if (filters.branch && filters.branch !== "all") queryParams.set("branch", filters.branch);
  if (filters.range && filters.range !== "all") queryParams.set("range", filters.range);
  if (filters.from) queryParams.set("from", filters.from);
  if (filters.to) queryParams.set("to", filters.to);
  const filterQs = queryParams.toString() ? "?" + queryParams.toString() : "";

  if (!brandData) {
    return (
      <main className="min-h-screen p-6 sm:p-10 flex flex-col items-center justify-center space-y-4 max-w-xl mx-auto text-center">
        <div className="cockpit-panel rounded-2xl p-8 space-y-4">
          <h1 className="text-xl font-bold text-white">Concept Not Found</h1>
          <p className="text-xs text-zinc-400">
            No telemetry records found for concept identifier:{" "}
            <code className="text-amber-400 font-mono px-1.5 py-0.5 rounded bg-white/[0.05]">
              {brandId}
            </code>
          </p>
          <div className="pt-2">
            <Link
              href={"/" + filterQs}
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-semibold rounded-xl transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Return to Executive Cockpit</span>
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const {
    brandName,
    slug,
    kpi,
    skus,
    menuEngineering,
    menuEngineeringSummary,
    slaDiagnostic,
    channels,
    branches,
    hourly,
    paretoSummary,
  } = brandData;
  const theme = getBrandTheme(slug);

  return (
    <main className="min-h-screen p-4 sm:p-6 lg:p-10 space-y-8 max-w-[1600px] mx-auto">
      {/* =========================================================================
          Top Breadcrumb & Brand Hero Banner (Themed to Concept Personality)
          ========================================================================= */}
      <div className="space-y-4 pb-6 border-b border-white/[0.08]">
        {/* Navigation & Engine Status */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <Link
            href={"/" + filterQs}
            className="inline-flex items-center gap-2 text-xs font-mono text-zinc-400 hover:text-white transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 text-emerald-400 group-hover:-translate-x-0.5 transition-transform" />
            <span>← Executive Telemetry Cockpit</span>
          </Link>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-mono font-medium bg-emerald-950/60 text-emerald-300 border border-emerald-800/50">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              Pareto Velocity Engine Active
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-mono font-medium bg-white/[0.03] text-zinc-300 border border-white/[0.08]">
              <Layers className="w-3.5 h-3.5 text-blue-400" />
              Verified Logs
            </span>
          </div>
        </div>

        {/* Brand Hero Card with Ambient Radial Vignette */}
        <div className="cockpit-panel rounded-2xl p-6 sm:p-7 relative overflow-hidden">
          <div
            className="absolute top-0 right-0 w-[500px] h-[300px] rounded-full blur-3xl opacity-20 pointer-events-none"
            style={{ backgroundColor: theme.primaryColor }}
          />

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
            <div className="flex items-center gap-4">
              <div
                className="p-3.5 rounded-2xl border text-white shadow-xl"
                style={{
                  backgroundColor: `${theme.primaryColor}15`,
                  borderColor: `${theme.primaryColor}40`,
                  color: theme.primaryColor,
                }}
              >
                <Store className="w-8 h-8" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2.5">
                  <span
                    className="text-xs font-mono tracking-widest uppercase px-2.5 py-0.5 rounded-full border"
                    style={{
                      backgroundColor: `${theme.primaryColor}15`,
                      borderColor: `${theme.primaryColor}30`,
                      color: theme.primaryColor,
                    }}
                  >
                    {theme.conceptTag}
                  </span>
                  <span className="text-xs font-mono bg-white/[0.06] border border-white/[0.08] text-zinc-300 px-2.5 py-0.5 rounded-full">
                    {kpi.order_count.toLocaleString()} completed tickets
                  </span>
                </div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-white mt-1">
                  {brandName}
                </h1>
                <p className="text-xs sm:text-sm text-zinc-400 mt-1">
                  {theme.subtitle} · SKU Velocity, Kitchen SLA Throughput & Channel Mix
                </p>
              </div>
            </div>

            {/* Quick Switcher Tabs */}
            <div className="flex flex-wrap items-center gap-1.5 p-1.5 bg-black/40 rounded-xl border border-white/[0.06] self-start lg:self-center">
              {ALL_BRAND_NAV.map((b) => {
                const isActive = b.slug === slug;
                const bTheme = getBrandTheme(b.slug);
                return (
                  <Link
                    key={b.slug}
                    href={"/brands/" + b.slug + filterQs}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all flex items-center gap-1.5 ${
                      isActive
                        ? "bg-white/[0.12] text-white border border-white/20 shadow-md font-semibold"
                        : "text-zinc-400 hover:text-white hover:bg-white/[0.04]"
                    }`}
                  >
                    <span
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ backgroundColor: bTheme.primaryColor }}
                    />
                    <span>{b.shortName}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          Data Freshness & Filter Bar
          ========================================================================= */}
      <DataFreshnessBar freshness={freshness} compact />

      <Suspense fallback={<div className="h-20 cockpit-panel rounded-2xl animate-pulse" />}>
        <FilterBar
          initialBranch={filters.branch || "all"}
          initialRange={filters.range || "all"}
          initialFrom={filters.from || ""}
          initialTo={filters.to || ""}
        />
      </Suspense>

      {kpi.order_count === 0 ? (
        <div className="cockpit-panel rounded-2xl p-12 text-center space-y-3">
          <p className="text-base font-semibold text-white">No Orders Recorded For Selected Filter</p>
          <p className="text-xs text-zinc-400">
            {brandName} did not record any completed orders matching outlet &quot;{filters.branch || "All"}&quot; and period &quot;{filters.range || "All"}&quot;.
          </p>
          <div className="pt-2">
            <Link
              href={"/brands/" + slug}
              className="text-xs font-mono text-emerald-400 hover:underline"
            >
              Reset to All Time / All Branches
            </Link>
          </div>
        </div>
      ) : (
        <>
          {/* =========================================================================
              Operational Guardrails & SLA Indicators
              ========================================================================= */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Guardrail 1: Promo Drag */}
            <div
              className={`cockpit-panel rounded-2xl p-5 relative overflow-hidden ${
                kpi.promo_burn_rate_pct > 15 ? "accent-bar-rose" : "accent-bar-emerald"
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-xs font-mono uppercase tracking-wider text-zinc-400 font-semibold">
                    Merchant Promo Drag
                  </div>
                  <div className="text-2xl font-bold mt-1 text-white font-mono flex items-baseline gap-2 tabular-nums">
                    {kpi.promo_burn_rate_pct}%
                    <span className="text-xs font-normal text-zinc-500 font-sans">of GMV</span>
                  </div>
                </div>
                {kpi.promo_burn_rate_pct > 15 ? (
                  <span className="p-2 bg-rose-500/20 rounded-xl text-rose-400 border border-rose-500/30">
                    <Flame className="w-5 h-5" />
                  </span>
                ) : (
                  <span className="px-2.5 py-1 rounded-xl text-xs font-mono font-medium bg-emerald-950/60 text-emerald-300 border border-emerald-800/40">
                    ≤15% Ceiling Compliant
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-400 mt-2.5 leading-relaxed">
                {kpi.promo_burn_rate_pct > 15
                  ? `⚠️ Exceeds 15% operating ceiling by ${(kpi.promo_burn_rate_pct - 15).toFixed(1)}%. Review platform campaign co-funding.`
                  : "Promo burn is healthy and disciplined within planned unit margins."}
              </p>
            </div>

            {/* Guardrail 2: Kitchen SLA & Red Alerts */}
            <div
              className={`cockpit-panel rounded-2xl p-5 relative overflow-hidden ${
                kpi.red_alerts > 0 ? "accent-bar-amber" : "accent-bar-emerald"
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-xs font-mono uppercase tracking-wider text-zinc-400 font-semibold">
                    Kitchen Prep SLA
                  </div>
                  <div className="text-2xl font-bold mt-1 text-white font-mono flex items-baseline gap-2 tabular-nums">
                    {kpi.avg_prep_time_min > 0 ? `${kpi.avg_prep_time_min}m` : "—"}
                    <span className="text-xs font-normal text-zinc-400 font-sans">
                      ({kpi.sla_breaches} breaches)
                    </span>
                  </div>
                </div>
                {kpi.red_alerts > 0 ? (
                  <span className="p-2 bg-amber-500/20 rounded-xl text-amber-400 border border-amber-500/30">
                    <AlertTriangle className="w-5 h-5" />
                  </span>
                ) : (
                  <span className="px-2.5 py-1 rounded-xl text-xs font-mono font-medium bg-emerald-950/60 text-emerald-300 border border-emerald-800/40">
                    SLA Compliant
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-400 mt-2.5 leading-relaxed">
                {kpi.red_alerts > 0
                  ? `🚨 ${kpi.red_alerts} critical prep breaches (>20m). Check station prep load during peak rush windows.`
                  : "Kitchen throughput meets operational targets (≤12m Kemang / ≤15m Greenville)."}
              </p>
            </div>

            {/* Guardrail 3: Menu Pareto Concentration */}
            <div className="cockpit-panel rounded-2xl p-5 relative overflow-hidden accent-bar-purple">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-xs font-mono uppercase tracking-wider text-zinc-400 font-semibold">
                    Menu Pareto Concentration
                  </div>
                  <div className="text-2xl font-bold mt-1 text-white font-mono flex items-baseline gap-2 tabular-nums">
                    {paretoSummary.heroCount} Hero SKUs
                    <span className="text-xs font-normal text-emerald-400 font-sans">
                      ({paretoSummary.heroSharePct}% vol)
                    </span>
                  </div>
                </div>
                <span className="p-2 bg-purple-500/20 rounded-xl text-purple-400 border border-purple-500/30">
                  <Boxes className="w-5 h-5" />
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-2.5 leading-relaxed">
                {paretoSummary.watchlistCount > 0
                  ? `${paretoSummary.watchlistCount} low-velocity items in Tier C watchlist. Candidates for pruning or meal bundles.`
                  : "Concentrated menu catalog with active volume turnover."}
              </p>
            </div>
          </div>

          {/* =========================================================================
              Brand Executive KPI Telemetry Cards
              ========================================================================= */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* GMV */}
            <div className="cockpit-panel rounded-2xl p-5 relative overflow-hidden accent-bar-blue">
              <div className="flex items-center justify-between text-zinc-400">
                <span className="text-xs font-mono uppercase tracking-wider font-semibold">
                  Brand GMV
                </span>
                <TrendingUp className="w-4 h-4 text-blue-400" />
              </div>
              <div className="text-2xl font-bold mt-2 text-white font-mono tabular-nums">
                {formatRupiah(kpi.gross_gmv)}
              </div>
              <div className="text-xs text-zinc-400 mt-1 font-mono">
                Avg Order: <strong className="text-white">{formatRupiah(kpi.avg_order_value)}</strong>
              </div>
            </div>

            {/* Net Settlement */}
            <div className="cockpit-panel rounded-2xl p-5 relative overflow-hidden accent-bar-emerald">
              <div className="flex items-center justify-between text-zinc-400">
                <span className="text-xs font-mono uppercase tracking-wider font-semibold">
                  Net Settlement
                </span>
                <span className="text-xs text-emerald-400 font-mono font-medium">
                  {kpi.net_realization_rate}% Realized
                </span>
              </div>
              <div className="text-2xl font-bold mt-2 text-emerald-400 font-mono tabular-nums">
                {formatRupiah(kpi.net_payout)}
              </div>
              <div className="text-xs text-zinc-400 mt-1 font-mono">
                Settled net proceeds from platforms
              </div>
            </div>

            {/* Units Sold */}
            <div className="cockpit-panel rounded-2xl p-5 relative overflow-hidden accent-bar-purple">
              <div className="flex items-center justify-between text-zinc-400">
                <span className="text-xs font-mono uppercase tracking-wider font-semibold">
                  Total Units Sold
                </span>
                <ShoppingBag className="w-4 h-4 text-purple-400" />
              </div>
              <div className="text-2xl font-bold mt-2 text-white font-mono tabular-nums">
                {kpi.total_units_sold.toLocaleString()} units
              </div>
              <div className="text-xs text-zinc-400 mt-1 font-mono">
                Across <strong className="text-white">{skus.length} catalog SKUs</strong>
              </div>
            </div>

            {/* Promo Burn */}
            <div className="cockpit-panel rounded-2xl p-5 relative overflow-hidden accent-bar-rose">
              <div className="flex items-center justify-between text-zinc-400">
                <span className="text-xs font-mono uppercase tracking-wider font-semibold">
                  Merchant Promo Burn
                </span>
                <Flame className="w-4 h-4 text-rose-400" />
              </div>
              <div className="text-2xl font-bold mt-2 text-rose-400 font-mono tabular-nums">
                {formatRupiah(kpi.merchant_promo_burn)}
              </div>
              <div className="text-xs text-zinc-400 mt-1 font-mono">
                Burn Drag: <strong className="text-white">{kpi.promo_burn_rate_pct}%</strong> of GMV
              </div>
            </div>
          </div>

          {/* =========================================================================
              Charts Grid: Pareto Distribution & Channel Mix
              ========================================================================= */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Pareto Horizontal Bar Chart */}
            <div className="lg:col-span-2 cockpit-panel rounded-2xl p-5 sm:p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-semibold text-white tracking-tight">
                      SKU Volume Pareto Distribution
                    </h2>
                    <span className="text-xs font-mono px-2 py-0.5 rounded bg-white/[0.05] text-zinc-400 border border-white/[0.08]">
                      Top 10 Volume SKUs
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Classified into Tier A (Hero 80%), Tier B (15%), Tier C (5%)
                  </p>
                </div>

                {/* Tier Legend Pills */}
                <div className="flex items-center gap-2.5 text-xs font-mono">
                  <span className="flex items-center gap-1.5 text-emerald-300 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
                    Tier A (80%)
                  </span>
                  <span className="flex items-center gap-1.5 text-blue-300 bg-blue-950/60 px-2 py-0.5 rounded border border-blue-800/40">
                    <span className="w-2 h-2 rounded-full bg-blue-400 inline-block" />
                    Tier B (15%)
                  </span>
                  <span className="flex items-center gap-1.5 text-amber-300 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800/40">
                    <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
                    Tier C (5%)
                  </span>
                </div>
              </div>

              <SkuParetoBarChart items={skus} limit={10} />
            </div>

            {/* Channel Concentration */}
            <div className="cockpit-panel rounded-2xl p-5 sm:p-6 space-y-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <h2 className="text-base font-semibold text-white tracking-tight">
                    Channel Concentration
                  </h2>
                  <span className="text-xs font-mono px-2 py-0.5 rounded bg-white/[0.05] text-zinc-400 border border-white/[0.08]">
                    Brand Mix
                  </span>
                </div>
                <p className="text-xs text-zinc-400">GrabFood vs GoFood vs Direct POS split</p>
              </div>

              <BrandChannelChart data={channels} />

              <div className="space-y-2 border-t border-white/[0.08] pt-4">
                {channels.map((ch) => {
                  const color = getChannelColor(ch.provider);
                  return (
                    <div
                      key={ch.provider}
                      className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className="w-3 h-3 rounded-full shrink-0 shadow-sm"
                          style={{ backgroundColor: color }}
                        />
                        <div>
                          <span className="text-zinc-100 font-semibold text-sm">{ch.provider}</span>
                          <div className="text-zinc-400 text-xs font-mono mt-0.5">
                            {ch.order_count} tickets · {ch.net_realization_rate}% net
                          </div>
                        </div>
                      </div>
                      <div className="text-right font-mono text-xs sm:text-sm">
                        <div className="text-white font-bold">{formatRupiah(ch.gross_gmv)}</div>
                        <div className="text-rose-400 text-xs font-medium">{ch.promo_burn_rate_pct}% promo</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* =========================================================================
              Hourly Prep Cadence & Branch Benchmark
              ========================================================================= */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Hourly Volume & KPT Line */}
            <div className="lg:col-span-2 cockpit-panel rounded-2xl p-5 sm:p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h2 className="text-base font-semibold text-white tracking-tight">
                    Order Volume vs Kitchen Prep Time (KPT)
                  </h2>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Hourly order count vs average preparation minutes
                  </p>
                </div>
                <div className="text-xs text-zinc-500 font-mono">
                  Lunch (11-13h) · Dinner (18-20h)
                </div>
              </div>

              <BrandHourlyKptChart data={hourly} />
            </div>

            {/* Branch Benchmark Cards */}
            <div className="space-y-4">
              <h2 className="text-base font-semibold text-white tracking-tight">
                Outlet Operations
              </h2>

              {branches.length === 0 ? (
                <div className="cockpit-panel rounded-2xl p-6 text-center text-xs text-zinc-500">
                  No branch activity for current filter
                </div>
              ) : (
                branches.map((b) => (
                  <div
                    key={b.branch}
                    className={`cockpit-panel rounded-2xl p-5 space-y-3 relative overflow-hidden ${
                      b.branch === "Kemang" ? "accent-bar-purple" : "accent-bar-emerald"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            b.branch === "Kemang" ? "bg-purple-400" : "bg-emerald-400"
                          }`}
                        />
                        <span className="text-sm font-bold text-white">{b.branch}</span>
                        <span className="text-xs text-zinc-400 font-mono">
                          {b.branch === "Kemang" ? "(Cloud Kitchen)" : "(Dine-in)"}
                        </span>
                      </div>
                      <span className="text-xs bg-white/[0.04] border border-white/[0.08] px-2.5 py-0.5 rounded-lg text-zinc-300 font-mono">
                        {b.order_count} orders
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5 text-xs pt-2.5 border-t border-white/[0.06] font-mono">
                      <div>
                        <div className="text-zinc-500 text-xs uppercase">Gross GMV</div>
                        <div className="text-sm font-bold text-white mt-0.5 tabular-nums">
                          {formatRupiah(b.gross_gmv)}
                        </div>
                      </div>
                      <div>
                        <div className="text-zinc-500 text-xs uppercase">Net Settlement</div>
                        <div className="text-sm font-bold text-emerald-400 mt-0.5 tabular-nums">
                          {formatRupiah(b.net_payout)}
                        </div>
                      </div>
                      <div>
                        <div className="text-zinc-500 text-xs uppercase">Avg Prep Time</div>
                        <div className="text-sm font-bold text-amber-400 mt-0.5 tabular-nums">
                          {b.avg_prep_time_min > 0 ? `${b.avg_prep_time_min}m` : "—"}
                        </div>
                      </div>
                      <div>
                        <div className="text-zinc-500 text-xs uppercase">SLA Breaches</div>
                        <div
                          className={`text-sm font-bold mt-0.5 tabular-nums ${
                            b.sla_breaches > 0 ? "text-rose-400" : "text-emerald-400"
                          }`}
                        >
                          {b.sla_breaches} ({b.red_alerts} red)
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* =========================================================================
              Track D: Brand Kitchen Prep SLA Heatmap & Bottleneck Inspector
              ========================================================================= */}
          <KitchenSlaHeatmap
            diagnostic={slaDiagnostic}
            title={`${brandName} — Kitchen Prep SLA Heatmap & Breach Inspector`}
            subtitle={`Day × hour KPT matrix, daypart rush strain, and slow ticket basket breakdown for ${brandName}`}
            showBrandColumn={false}
          />

          {/* =========================================================================
              Track B: Recipe BOM & Theoretical Food Cost Engine (Menu Engineering Matrix)
              ========================================================================= */}
          <div className="cockpit-panel rounded-2xl p-5 sm:p-6 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-white/[0.08] pb-4">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-base sm:text-lg font-semibold text-white tracking-tight">
                    Theoretical Food Cost Engine & Menu Engineering Matrix
                  </h2>
                  <span className="text-xs font-mono px-2.5 py-0.5 rounded bg-emerald-950/60 text-emerald-300 border border-emerald-800/50">
                    Track B · dim_recipes Joined
                  </span>
                  <span className="text-xs font-mono px-2.5 py-0.5 rounded bg-white/[0.05] text-zinc-300 border border-white/[0.08]">
                    100% Vegetarian BOM Standard
                  </span>
                </div>
                <p className="text-xs text-zinc-400 mt-1">
                  Unit economics joining <code className="text-zinc-300 font-mono">dim_recipes</code> against <code className="text-zinc-300 font-mono">fact_order_items</code> · Gross Margin = Menu Price − (Raw Food Cost + Packaging Drag)
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
                <div className="px-3 py-1.5 rounded-xl bg-black/40 border border-white/[0.08] text-zinc-300">
                  Avg Food + Pkg Cost:{" "}
                  <strong
                    className={
                      menuEngineeringSummary.avgFoodCostPct <= 28
                        ? "text-emerald-400"
                        : "text-amber-400"
                    }
                  >
                    {menuEngineeringSummary.avgFoodCostPct}%
                  </strong>
                </div>
                <div className="px-3 py-1.5 rounded-xl bg-black/40 border border-white/[0.08] text-zinc-300">
                  Pkg Drag:{" "}
                  <strong className="text-purple-300">
                    {menuEngineeringSummary.avgPackagingDragPct}%
                  </strong>
                </div>
                <div className="px-3 py-1.5 rounded-xl bg-emerald-950/50 border border-emerald-800/40 text-emerald-300">
                  Est. Gross Profit:{" "}
                  <strong className="text-white">
                    {formatRupiah(menuEngineeringSummary.totalTheoreticalMarginRp)}
                  </strong>
                </div>
              </div>
            </div>

            {/* Seeded Hero Recipe BOM Spotlight */}
            {menuEngineeringSummary.heroBoms.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono uppercase tracking-wider text-zinc-400 font-semibold">
                    Seeded Hero Recipe BOM Master ({brandName})
                  </span>
                  <span className="text-xs font-mono text-zinc-500">
                    Dine-In vs Online Delivery Packaging Drag
                  </span>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {menuEngineeringSummary.heroBoms.map((hb) => (
                    <div
                      key={hb.recipe_id}
                      className="rounded-xl p-4 bg-black/35 border border-white/[0.08] space-y-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-white">
                              {hb.canonical_name}
                            </span>
                            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-300 border border-emerald-800/40">
                              Target ≤{hb.target_food_cost_pct}% COGS
                            </span>
                          </div>
                          <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                            {hb.bom_summary}
                          </p>
                        </div>
                        <div className="text-right font-mono shrink-0">
                          <div className="text-xs text-zinc-500">Realized Price</div>
                          <div className="text-sm font-bold text-white tabular-nums">
                            {formatRupiah(hb.realized_menu_price)}
                          </div>
                          <div className="text-[11px] text-zinc-400">
                            {hb.realized_units_sold.toLocaleString()} units sold
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2.5 border-t border-white/[0.06] text-xs font-mono">
                        <div className="bg-white/[0.02] p-2.5 rounded-lg border border-white/[0.05]">
                          <div className="text-[10px] text-zinc-500 uppercase">Raw Food Cost</div>
                          <div className="text-white font-bold mt-0.5 tabular-nums">
                            {formatRupiah(hb.raw_food_cost)}
                          </div>
                        </div>
                        <div className="bg-white/[0.02] p-2.5 rounded-lg border border-white/[0.05]">
                          <div className="text-[10px] text-zinc-500 uppercase">Packaging (Dine/Del)</div>
                          <div className="text-zinc-200 font-semibold mt-0.5 tabular-nums">
                            {formatRupiah(hb.packaging_dine_in)} / {formatRupiah(hb.packaging_delivery)}
                          </div>
                        </div>
                        <div className="bg-white/[0.02] p-2.5 rounded-lg border border-white/[0.05]">
                          <div className="text-[10px] text-zinc-500 uppercase">Dine-In Margin</div>
                          <div className="text-emerald-400 font-bold mt-0.5 tabular-nums">
                            {formatRupiah(hb.dine_in_margin_rp)}{" "}
                            <span className="text-[10px] text-zinc-400 font-normal">
                              ({hb.dine_in_food_cost_pct}% FC)
                            </span>
                          </div>
                        </div>
                        <div className="bg-white/[0.02] p-2.5 rounded-lg border border-white/[0.05]">
                          <div className="text-[10px] text-zinc-500 uppercase">Delivery Margin</div>
                          <div className="text-blue-300 font-bold mt-0.5 tabular-nums">
                            {formatRupiah(hb.delivery_margin_rp)}{" "}
                            <span className="text-[10px] text-zinc-400 font-normal">
                              ({hb.delivery_food_cost_pct}% FC)
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 4 Menu Engineering Quadrant Summary Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
              <div className="rounded-xl p-4 bg-emerald-950/20 border border-emerald-800/35 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono uppercase tracking-wider text-emerald-300 font-semibold">
                    ⭐ Stars
                  </span>
                  <span className="text-lg font-bold font-mono text-white tabular-nums">
                    {menuEngineeringSummary.starsCount}
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400">
                  High Volume · High Margin (≥{menuEngineeringSummary.avgVolumeBenchmark}u)
                </p>
              </div>

              <div className="rounded-xl p-4 bg-blue-950/20 border border-blue-800/35 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono uppercase tracking-wider text-blue-300 font-semibold">
                    🐴 Plowhorses
                  </span>
                  <span className="text-lg font-bold font-mono text-white tabular-nums">
                    {menuEngineeringSummary.plowhorsesCount}
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400">
                  High Volume · Low Margin (Re-price / BOM)
                </p>
              </div>

              <div className="rounded-xl p-4 bg-purple-950/20 border border-purple-800/35 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono uppercase tracking-wider text-purple-300 font-semibold">
                    🧩 Puzzles
                  </span>
                  <span className="text-lg font-bold font-mono text-white tabular-nums">
                    {menuEngineeringSummary.puzzlesCount}
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400">
                  Low Volume · High Margin (Promo push)
                </p>
              </div>

              <div className="rounded-xl p-4 bg-amber-950/20 border border-amber-800/35 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono uppercase tracking-wider text-amber-300 font-semibold">
                    🐕 Dogs
                  </span>
                  <span className="text-lg font-bold font-mono text-white tabular-nums">
                    {menuEngineeringSummary.dogsCount}
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400">
                  Low Volume · Low Margin (Prune / Bundle)
                </p>
              </div>
            </div>

            {/* Menu Engineering Matrix Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-white/[0.08] text-zinc-400 uppercase font-mono text-xs tracking-wider">
                    <th className="py-3.5 px-3">Menu Item & Vegetarian BOM</th>
                    <th className="py-3.5 px-3 text-right">Volume</th>
                    <th className="py-3.5 px-3 text-right">Menu Price</th>
                    <th className="py-3.5 px-3 text-right">Food Cost</th>
                    <th className="py-3.5 px-3 text-right">Pkg Drag</th>
                    <th className="py-3.5 px-3 text-right">Food Cost %</th>
                    <th className="py-3.5 px-3 text-right">Unit Margin</th>
                    <th className="py-3.5 px-3 text-right">Total Profit</th>
                    <th className="py-3.5 px-3 text-center">Matrix Quadrant</th>
                    <th className="py-3.5 px-3">Engineering Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {menuEngineering.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-8 text-center text-zinc-500 font-mono">
                        No catalog items recorded for menu engineering analysis.
                      </td>
                    </tr>
                  ) : (
                    menuEngineering.map((item, idx) => {
                      let quadBadge =
                        "bg-emerald-950/60 text-emerald-300 border-emerald-800/40";
                      let quadLabel = "⭐ Star";
                      if (item.quadrant === "Plowhorse") {
                        quadBadge = "bg-blue-950/60 text-blue-300 border-blue-800/40";
                        quadLabel = "🐴 Plowhorse";
                      } else if (item.quadrant === "Puzzle") {
                        quadBadge = "bg-purple-950/60 text-purple-300 border-purple-800/40";
                        quadLabel = "🧩 Puzzle";
                      } else if (item.quadrant === "Dog") {
                        quadBadge = "bg-amber-950/60 text-amber-300 border-amber-800/40";
                        quadLabel = "🐕 Dog";
                      }

                      const isOverBenchmark = item.food_cost_pct > item.target_food_cost_pct;

                      return (
                        <tr
                          key={item.item_name + "-me-" + idx}
                          className="hover:bg-white/[0.03] transition-colors"
                        >
                          <td className="py-3.5 px-3 max-w-xs">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-semibold text-white">
                                {item.canonical_name}
                              </span>
                              {item.has_recipe_bom && (
                                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/25">
                                  {item.is_hero_bom ? "Hero BOM" : "Seeded BOM"}
                                </span>
                              )}
                            </div>
                            <div
                              className="text-[11px] text-zinc-500 line-clamp-1 mt-0.5"
                              title={item.bom_summary}
                            >
                              {item.bom_summary}
                            </div>
                          </td>
                          <td className="py-3.5 px-3 text-right font-mono text-white font-bold tabular-nums whitespace-nowrap">
                            {item.total_qty.toLocaleString()}
                            <span className="block text-[10px] text-zinc-500 font-normal">
                              {item.delivery_qty} del · {item.dine_in_qty} dine
                            </span>
                          </td>
                          <td className="py-3.5 px-3 text-right font-mono text-zinc-200 tabular-nums whitespace-nowrap">
                            {formatRupiah(item.menu_price)}
                          </td>
                          <td className="py-3.5 px-3 text-right font-mono text-zinc-300 tabular-nums whitespace-nowrap">
                            {formatRupiah(item.raw_food_cost)}
                          </td>
                          <td className="py-3.5 px-3 text-right font-mono text-purple-300 tabular-nums whitespace-nowrap">
                            {formatRupiah(item.weighted_packaging_cost)}
                            <span className="block text-[10px] text-zinc-500">
                              ({item.packaging_drag_pct}%)
                            </span>
                          </td>
                          <td className="py-3.5 px-3 text-right font-mono tabular-nums whitespace-nowrap">
                            <span
                              className={`px-2 py-0.5 rounded text-xs font-semibold border ${
                                !isOverBenchmark
                                  ? "bg-emerald-950/60 text-emerald-300 border-emerald-800/40"
                                  : item.food_cost_pct <= item.target_food_cost_pct + 7.5
                                  ? "bg-amber-950/60 text-amber-300 border-amber-800/40"
                                  : "bg-rose-950/60 text-rose-300 border-rose-800/40"
                              }`}
                            >
                              {item.food_cost_pct}%
                            </span>
                            <span className="block text-[10px] text-zinc-500 mt-0.5">
                              Target ≤{item.target_food_cost_pct}%
                            </span>
                          </td>
                          <td className="py-3.5 px-3 text-right font-mono text-emerald-400 font-semibold tabular-nums whitespace-nowrap">
                            {formatRupiah(item.unit_gross_margin)}
                          </td>
                          <td className="py-3.5 px-3 text-right font-mono text-white font-bold tabular-nums whitespace-nowrap">
                            {formatRupiah(item.total_gross_margin)}
                          </td>
                          <td className="py-3.5 px-3 text-center whitespace-nowrap">
                            <span
                              className={
                                "px-2.5 py-1 rounded-lg text-xs font-mono font-medium border " +
                                quadBadge
                              }
                            >
                              {quadLabel}
                            </span>
                          </td>
                          <td className="py-3.5 px-3 text-zinc-400 text-xs leading-relaxed min-w-[210px]">
                            {item.quadrant_action}
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
              Menu SKU Pareto Velocity Matrix Table
              ========================================================================= */}
          <div className="cockpit-panel rounded-2xl p-5 sm:p-6 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-semibold text-white tracking-tight">
                    Full Catalog Pareto Matrix (Velocity & Drag)
                  </h2>
                  <span className="text-xs font-mono px-2 py-0.5 rounded bg-white/[0.05] text-zinc-400 border border-white/[0.08]">
                    Unit-Level Telemetry
                  </span>
                </div>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Classified by cumulative volume share: Tier A (Hero 0-80%), Tier B (Secondary 80-95%), Tier C (Watchlist 95-100%)
                </p>
              </div>
              <span className="text-xs text-emerald-400 bg-emerald-950/60 border border-emerald-800/40 px-3 py-1 rounded-xl font-mono">
                {skus.length} SKUs Ingested
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-white/[0.08] text-zinc-400 uppercase font-mono text-xs tracking-wider">
                    <th className="py-3.5 px-4 w-10 text-center">#</th>
                    <th className="py-3.5 px-4">Menu Item</th>
                    <th className="py-3.5 px-4">Category</th>
                    <th className="py-3.5 px-4 text-right">Units Sold</th>
                    <th className="py-3.5 px-4 text-right">Volume Share</th>
                    <th className="py-3.5 px-4 text-right">Cum. %</th>
                    <th className="py-3.5 px-4 text-right">Est. Revenue</th>
                    <th className="py-3.5 px-4 text-center">Pareto Classification</th>
                    <th className="py-3.5 px-4">Operational Strategy</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {skus.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-zinc-500 font-mono">
                        No items sold during this period.
                      </td>
                    </tr>
                  ) : (
                    skus.map((item, idx) => {
                      let badgeClass = "bg-emerald-950/60 text-emerald-300 border-emerald-800/40";
                      if (item.tier === "Tier B")
                        badgeClass = "bg-blue-950/60 text-blue-300 border-blue-800/40";
                      if (item.tier === "Tier C")
                        badgeClass = "bg-amber-950/60 text-amber-300 border-amber-800/40";

                      return (
                        <tr
                          key={item.item_name + "-" + idx}
                          className="hover:bg-white/[0.03] transition-colors"
                        >
                          <td className="py-3.5 px-4 text-center font-mono text-zinc-500">{idx + 1}</td>
                          <td className="py-3.5 px-4 font-semibold text-white max-w-xs">{item.item_name}</td>
                          <td className="py-3.5 px-4 text-zinc-400 whitespace-nowrap">{item.category}</td>
                          <td className="py-3.5 px-4 text-right font-mono text-white font-bold tabular-nums">
                            {item.total_qty.toLocaleString()}
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono text-zinc-300 tabular-nums">
                            {item.share_of_volume_pct}%
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono text-zinc-500 tabular-nums">
                            {item.cumulative_volume_pct}%
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono text-emerald-400 font-semibold whitespace-nowrap tabular-nums">
                            {item.total_revenue > 0 ? formatRupiah(item.total_revenue) : "—"}
                          </td>
                          <td className="py-3.5 px-4 text-center whitespace-nowrap">
                            <span className={"px-2.5 py-1 rounded-lg text-xs font-mono font-medium border " + badgeClass}>
                              {item.tier === "Tier A" && "⭐ Tier A · Hero"}
                              {item.tier === "Tier B" && "🔹 Tier B · Secondary"}
                              {item.tier === "Tier C" && "⚠️ Tier C · Watchlist"}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-zinc-400 text-xs leading-relaxed">
                            {item.action_label}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </main>
  );
}
