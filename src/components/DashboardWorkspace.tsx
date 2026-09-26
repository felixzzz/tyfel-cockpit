"use client";

import React, { useState } from "react";
import Link from "next/link";
import type {
  ExecutiveSummary,
  BrandStats,
  BranchStats,
  ChannelStats,
  TopItem,
  HourlyTrend,
  HeroRecipeBomSummary,
  KitchenSlaDiagnostic,
  CanceledOrdersDiagnostic,
} from "@/lib/queries";
import {
  ALL_BRAND_NAV,
  brandToSlug,
  getBrandTheme,
  getChannelColor,
} from "@/lib/brandTheme";
import {
  BrandRevenueChart,
  ChannelPieChart,
  HourlyOrderChart,
} from "@/components/Charts";
import { KitchenSlaHeatmap } from "@/components/KitchenSlaHeatmap";
import { CanceledOrderInspector } from "@/components/CanceledOrderInspector";
import {
  DollarSign,
  TrendingUp,
  Flame,
  Clock,
  ShoppingBag,
  ArrowRight,
  ExternalLink,
  ChevronRight,
  Building2,
  UtensilsCrossed,
  Ban,
  LayoutGrid,
  Table2,
  Layers,
} from "lucide-react";

interface DashboardWorkspaceProps {
  summary: ExecutiveSummary;
  brands: BrandStats[];
  branches: BranchStats[];
  channels: ChannelStats[];
  topItems: TopItem[];
  hourly: HourlyTrend[];
  heroBoms: HeroRecipeBomSummary[];
  slaDiagnostic: KitchenSlaDiagnostic;
  cancellationDiagnostic: CanceledOrdersDiagnostic;
  filterQs: string;
}

type WorkspaceTab = "overview" | "economics" | "sla" | "cancellations" | "all";

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function DashboardWorkspace({
  summary,
  brands,
  branches,
  channels,
  topItems,
  hourly,
  heroBoms,
  slaDiagnostic,
  cancellationDiagnostic,
  filterQs,
}: DashboardWorkspaceProps) {
  const [activeTab, setActiveTab] = useState<WorkspaceTab>("overview");

  const showOverview = activeTab === "overview" || activeTab === "all";
  const showEconomics = activeTab === "economics" || activeTab === "all";
  const showSla = activeTab === "sla" || activeTab === "all";
  const showCancellations = activeTab === "cancellations" || activeTab === "all";

  return (
    <div className="space-y-6">
      {/* =========================================================================
          Executive KPI Telemetry Deck (Interactive Action Cards)
          ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Metric 1: Gross GMV */}
        <div
          onClick={() => setActiveTab("overview")}
          className="cockpit-panel rounded-2xl p-5 relative overflow-hidden accent-bar-blue cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
              Gross GMV
            </span>
            <div className="p-1.5 rounded-lg badge-blue">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-[26px] font-bold text-[var(--text-primary)] tracking-tight tabular-nums font-display">
              {formatRupiah(summary.total_gross_gmv)}
            </div>
            <div className="text-xs text-[var(--text-secondary)] mt-2 flex items-center gap-1.5 font-mono">
              <ShoppingBag className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400 shrink-0" />
              <span>
                <strong className="text-[var(--text-primary)]">
                  {summary.total_orders.toLocaleString()}
                </strong>{" "}
                orders · AOV{" "}
                <strong className="text-[var(--text-primary)]">
                  {formatRupiah(summary.avg_order_value)}
                </strong>
              </span>
            </div>
          </div>
        </div>

        {/* Metric 2: Net Cash Realization */}
        <div
          onClick={() => setActiveTab("overview")}
          className="cockpit-panel rounded-2xl p-5 relative overflow-hidden accent-bar-emerald cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
              Net Cash Realized
            </span>
            <div className="p-1.5 rounded-lg badge-emerald">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-[26px] font-bold text-emerald-700 dark:text-emerald-400 tracking-tight tabular-nums font-display">
              {formatRupiah(summary.total_net_payout)}
            </div>
            <div className="text-xs text-[var(--text-secondary)] mt-2 flex items-center gap-1.5">
              <span className="font-mono font-semibold px-2 py-0.5 rounded text-xs badge-emerald">
                {summary.net_realization_rate}% Realized
              </span>
              <span className="text-xs text-[var(--text-muted)] font-mono">Target ≥68%</span>
            </div>
          </div>
        </div>

        {/* Metric 3: Merchant Promo Burn */}
        <div
          onClick={() => setActiveTab("economics")}
          className="cockpit-panel rounded-2xl p-5 relative overflow-hidden accent-bar-rose cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
              Merchant Promo Burn
            </span>
            <div className="p-1.5 rounded-lg badge-rose">
              <Flame className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-[26px] font-bold text-rose-600 dark:text-rose-400 tracking-tight tabular-nums font-display">
              {formatRupiah(summary.total_merchant_promo_burn)}
            </div>
            <div className="text-xs text-[var(--text-secondary)] mt-2 flex items-center justify-between gap-1.5">
              <span
                className={`font-mono font-semibold px-2 py-0.5 rounded text-xs ${
                  summary.promo_burn_rate_pct > 15 ? "badge-rose" : "badge-neutral"
                }`}
              >
                {summary.promo_burn_rate_pct}% of GMV
              </span>
              <span className="text-[11px] font-mono text-[var(--text-muted)] group-hover:text-[var(--text-primary)]">
                Unit Matrix →
              </span>
            </div>
          </div>
        </div>

        {/* Metric 4: Kitchen SLA & Prep Time */}
        <div
          onClick={() => setActiveTab("sla")}
          className="cockpit-panel rounded-2xl p-5 relative overflow-hidden accent-bar-amber cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
              Kitchen Prep / SLA
            </span>
            <div className="p-1.5 rounded-lg badge-amber">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-[26px] font-bold text-[var(--text-primary)] tracking-tight tabular-nums flex items-baseline gap-2 font-display">
              <span>
                {summary.avg_prep_time_minutes > 0
                  ? `${summary.avg_prep_time_minutes}m`
                  : "—"}
              </span>
              <span
                className={`text-[11px] px-1.5 py-0.5 rounded font-mono font-semibold ${
                  summary.sla_breach_count > 0 ? "badge-amber" : "badge-emerald"
                }`}
              >
                {summary.sla_breach_count} ({summary.sla_breach_rate_pct}%)
              </span>
            </div>
            <div className="text-xs text-[var(--text-secondary)] mt-2 font-mono flex items-center justify-between">
              <span>KMG ≤12m · GRV ≤15m</span>
              <span className="text-[11px] text-[var(--accent-secondary)] font-semibold group-hover:translate-x-0.5 transition-transform">
                Heatmap →
              </span>
            </div>
          </div>
        </div>

        {/* Metric 5: Cancelled Orders & Revenue Leakage */}
        <div
          onClick={() => setActiveTab("cancellations")}
          className="cockpit-panel rounded-2xl p-5 relative overflow-hidden accent-bar-terracotta cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
              Cancelled & Leakage
            </span>
            <div className="p-1.5 rounded-lg badge-rose">
              <Ban className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-[26px] font-bold text-rose-600 dark:text-rose-400 tracking-tight tabular-nums flex items-baseline gap-2 font-display">
              <span>{summary.cancelled_orders_count}</span>
              <span className="text-[11px] px-1.5 py-0.5 rounded font-mono font-semibold badge-rose">
                {summary.cancellation_rate_pct}% Rate
              </span>
            </div>
            <div className="text-xs text-[var(--text-secondary)] mt-2 font-mono flex items-center justify-between">
              <span>
                Lost:{" "}
                <strong className="text-rose-600 dark:text-rose-400">
                  {formatRupiah(summary.cancelled_gross_gmv)}
                </strong>
              </span>
              <span className="text-[11px] text-[var(--accent-secondary)] font-semibold group-hover:translate-x-0.5 transition-transform">
                Audit →
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          Tactile Operational Mode Switcher (Segmented Tab Bar)
          ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[var(--bg-surface)] p-2 rounded-2xl border border-[var(--border-default)] shadow-2xs">
        <div className="flex flex-wrap items-center gap-1">
          <button
            type="button"
            onClick={() => setActiveTab("overview")}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === "overview"
                ? "bg-[var(--accent-primary)] text-white shadow-xs"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-2)]"
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>Executive Overview</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("economics")}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === "economics"
                ? "bg-[var(--accent-primary)] text-white shadow-xs"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-2)]"
            }`}
          >
            <Table2 className="w-3.5 h-3.5" />
            <span>Unit Economics & Menu BOMs</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("sla")}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === "sla"
                ? "bg-[var(--accent-primary)] text-white shadow-xs"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-2)]"
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Kitchen SLA Heatmap</span>
            {summary.sla_breach_count > 0 && (
              <span
                className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${
                  activeTab === "sla" ? "bg-white/20 text-white" : "badge-amber"
                }`}
              >
                {summary.sla_breach_count}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("cancellations")}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === "cancellations"
                ? "bg-[var(--accent-primary)] text-white shadow-xs"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-2)]"
            }`}
          >
            <Ban className="w-3.5 h-3.5" />
            <span>Cancellations & Leakage</span>
            {summary.cancelled_orders_count > 0 && (
              <span
                className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${
                  activeTab === "cancellations"
                    ? "bg-white/20 text-white"
                    : "badge-rose"
                }`}
              >
                {summary.cancelled_orders_count}
              </span>
            )}
          </button>
        </div>

        <button
          type="button"
          onClick={() =>
            setActiveTab(activeTab === "all" ? "overview" : "all")
          }
          className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-mono font-semibold transition-all cursor-pointer self-start sm:self-auto ${
            activeTab === "all"
              ? "bg-[var(--text-primary)] text-[var(--bg-surface)]"
              : "bg-[var(--bg-surface-2)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-subtle)]"
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>{activeTab === "all" ? "Showing All Panels" : "Expand All Panels"}</span>
        </button>
      </div>

      {/* =========================================================================
          TAB 1: EXECUTIVE OVERVIEW (Portfolio, Charts, Outlets, Velocity)
          ========================================================================= */}
      {showOverview && (
        <div className="space-y-6">
          {/* Brand Concept Matrix Switcher */}
          <div className="cockpit-panel rounded-2xl p-4 sm:p-5 space-y-3.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-primary)] font-display">
                  Culinary Concept Portfolio
                </span>
                <span className="text-xs text-[var(--text-secondary)] hidden md:inline">
                  — Select any concept to inspect SKU Pareto velocity, prep SLAs, and menu BOM margins
                </span>
              </div>
              <span className="text-xs font-mono text-[var(--text-muted)]">
                5 Active Concepts · 2 Kitchens
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {ALL_BRAND_NAV.map((b) => {
                const theme = getBrandTheme(b.slug);
                return (
                  <Link
                    key={b.slug}
                    href={"/brands/" + b.slug + filterQs}
                    className="group relative overflow-hidden rounded-xl p-3.5 surface-well hover:bg-[var(--bg-surface-3)] hover:border-[var(--border-strong)] transition-all flex flex-col justify-between"
                  >
                    <div
                      className="absolute top-0 right-0 w-24 h-24 rounded-full blur-2xl opacity-15 pointer-events-none group-hover:opacity-35 transition-opacity"
                      style={{ backgroundColor: theme.primaryColor }}
                    />
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-mono text-[var(--text-muted)] group-hover:text-[var(--text-secondary)]">
                        {theme.conceptTag}
                      </span>
                      <ChevronRight className="w-3.5 h-3.5 text-[var(--text-muted)] group-hover:text-[var(--text-primary)] group-hover:translate-x-0.5 transition-all" />
                    </div>
                    <div className="mt-2.5">
                      <div className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2 font-display">
                        <span
                          className="w-2.5 h-2.5 rounded-full inline-block shrink-0"
                          style={{ backgroundColor: theme.primaryColor }}
                        />
                        <span className="truncate">{b.name}</span>
                      </div>
                      <div className="text-xs text-[var(--text-secondary)] truncate mt-0.5">
                        {theme.subtitle}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Visual Analytics Grid: Brand Financials & Channel Share */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Brand Performance & Economics */}
            <div className="lg:col-span-2 cockpit-panel rounded-2xl p-5 sm:p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-[var(--text-primary)] tracking-tight">
                      Brand Financial Economics
                    </h2>
                    <span className="text-xs font-mono px-2 py-0.5 rounded badge-neutral">
                      GMV vs Payout vs Promo
                    </span>
                  </div>
                  <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                    Gross GMV vs Net Settlement vs Merchant Promo Burn across concepts
                  </p>
                </div>
                <span className="text-xs text-[var(--text-muted)] font-mono">
                  In Thousands (IDR)
                </span>
              </div>

              <BrandRevenueChart data={brands} />
            </div>

            {/* Channel Share Donut */}
            <div className="cockpit-panel rounded-2xl p-5 sm:p-6 space-y-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <h2 className="text-base font-bold text-[var(--text-primary)] tracking-tight">
                    Channel Distribution
                  </h2>
                  <span className="text-xs font-mono px-2 py-0.5 rounded badge-neutral">
                    Platform Split
                  </span>
                </div>
                <p className="text-xs text-[var(--text-secondary)]">
                  GrabFood vs GoFood vs Direct POS
                </p>
              </div>

              <ChannelPieChart data={channels} />

              <div className="space-y-2 border-t border-[var(--border-default)] pt-4">
                {channels.map((ch) => {
                  const channelColor = getChannelColor(ch.provider);
                  return (
                    <div
                      key={ch.provider}
                      className="flex items-center justify-between p-2.5 rounded-xl surface-well"
                    >
                      <div className="flex items-center gap-2.5">
                        <span
                          className="w-3 h-3 rounded-full shrink-0"
                          style={{ backgroundColor: channelColor }}
                        />
                        <span className="text-[var(--text-primary)] font-semibold text-xs sm:text-sm">
                          {ch.provider}
                        </span>
                      </div>
                      <div className="text-right font-mono text-xs">
                        <span className="text-[var(--text-secondary)] font-medium">
                          {ch.order_count.toLocaleString()} orders
                        </span>
                        <span className="text-[var(--text-muted)] mx-1.5">·</span>
                        <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                          {ch.net_realization_rate}% net
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Branch Comparison & Order Velocity (Hourly Cadence) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Branch Benchmark Cards */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-[var(--text-primary)] tracking-tight">
                  Kitchen Outlet Benchmarks
                </h2>
                <span className="text-xs font-mono text-[var(--text-muted)]">
                  2 Active Locations
                </span>
              </div>

              {branches.length === 0 ? (
                <div className="cockpit-panel rounded-2xl p-6 text-center text-xs text-[var(--text-muted)]">
                  No branch orders found for selected filter
                </div>
              ) : (
                branches.map((b) => (
                  <div
                    key={b.branch}
                    className={`cockpit-panel rounded-2xl p-5 space-y-3.5 relative overflow-hidden ${
                      b.branch === "Kemang"
                        ? "accent-bar-purple"
                        : "accent-bar-emerald"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`p-2 rounded-xl ${
                            b.branch === "Kemang"
                              ? "badge-purple"
                              : "badge-emerald"
                          }`}
                        >
                          <Building2 className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                            {b.branch}
                          </span>
                          <span className="text-xs text-[var(--text-secondary)] block">
                            {b.branch === "Kemang"
                              ? "Cloud Kitchen · Delivery Only"
                              : "Flagship Dine-in & Delivery"}
                          </span>
                        </div>
                      </div>

                      <span className="text-xs font-mono badge-neutral px-2.5 py-1 rounded-lg">
                        {b.order_count.toLocaleString()} orders
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5 text-xs pt-3 border-t border-[var(--border-subtle)]">
                      <div className="surface-well p-2.5">
                        <div className="text-[var(--text-muted)] text-[10px] uppercase font-mono">
                          Gross GMV
                        </div>
                        <div className="text-sm font-bold text-[var(--text-primary)] font-mono mt-0.5 tabular-nums">
                          {formatRupiah(b.gross_gmv)}
                        </div>
                      </div>
                      <div className="surface-well p-2.5">
                        <div className="text-[var(--text-muted)] text-[10px] uppercase font-mono">
                          Net Settlement
                        </div>
                        <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400 font-mono mt-0.5 tabular-nums">
                          {formatRupiah(b.net_payout)}
                        </div>
                      </div>
                      <div className="surface-well p-2.5">
                        <div className="text-[var(--text-muted)] text-[10px] uppercase font-mono">
                          Net Realization
                        </div>
                        <div className="text-sm font-bold text-[var(--text-primary)] font-mono mt-0.5 tabular-nums">
                          {b.net_realization_rate}%
                        </div>
                      </div>
                      <div className="surface-well p-2.5">
                        <div className="text-[var(--text-muted)] text-[10px] uppercase font-mono">
                          Avg Prep / SLA
                        </div>
                        <div className="text-sm font-bold text-amber-600 dark:text-amber-400 font-mono mt-0.5 tabular-nums">
                          {b.avg_prep_time_min > 0 ? `${b.avg_prep_time_min}m` : "—"}
                          <span className="text-xs text-[var(--text-muted)] font-normal ml-1">
                            ({b.sla_breaches} br)
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
                  <h2 className="text-base font-bold text-[var(--text-primary)] tracking-tight">
                    Order Velocity & Rush Windows
                  </h2>
                  <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                    Peak kitchen ticket cadence (11:00–13:00 Lunch · 18:00–20:00 Dinner)
                  </p>
                </div>
                <span className="text-xs text-[var(--text-muted)] font-mono">
                  24h Cadence
                </span>
              </div>

              <HourlyOrderChart data={hourly} />
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 2: UNIT ECONOMICS & MENU BOMs
          ========================================================================= */}
      {showEconomics && (
        <div className="space-y-6">
          {/* Brand Detailed Performance Matrix Table */}
          <div className="cockpit-panel rounded-2xl p-5 sm:p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-[var(--text-primary)] tracking-tight">
                    Brand Unit Economics Matrix
                  </h2>
                  <span className="text-xs font-mono px-2 py-0.5 rounded badge-neutral">
                    Granular Audit
                  </span>
                </div>
                <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                  Multi-brand unit economics, promo burn & SLA metrics across Greenville and Kemang
                </p>
              </div>
            </div>

            <div className="overflow-x-auto border border-[var(--border-default)] rounded-xl">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[var(--border-default)] bg-[var(--bg-surface-2)] text-[var(--text-secondary)] uppercase font-semibold text-[11px] tracking-wider font-mono">
                    <th className="py-3.5 px-4">Brand & Concept</th>
                    <th className="py-3.5 px-4">Branch</th>
                    <th className="py-3.5 px-4 text-right">Orders</th>
                    <th className="py-3.5 px-4 text-right">Gross GMV</th>
                    <th className="py-3.5 px-4 text-right">Net Payout</th>
                    <th className="py-3.5 px-4 text-right">Net Realized</th>
                    <th className="py-3.5 px-4 text-right">Promo Burn</th>
                    <th className="py-3.5 px-4 text-right">Avg Prep</th>
                    <th className="py-3.5 px-4 text-right">Breaches</th>
                    <th className="py-3.5 px-4 text-center">Inspect</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-subtle)]">
                  {brands.length === 0 ? (
                    <tr>
                      <td
                        colSpan={10}
                        className="py-8 text-center text-[var(--text-muted)] font-mono"
                      >
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
                          className="hover:bg-[var(--bg-surface-2)]/60 transition-colors"
                        >
                          <td className="py-3.5 px-4">
                            <Link
                              href={"/brands/" + slug + filterQs}
                              className="flex items-center gap-2.5 group"
                            >
                              <span
                                className="w-2.5 h-2.5 rounded-full shrink-0"
                                style={{ backgroundColor: theme.primaryColor }}
                              />
                              <div>
                                <span className="font-semibold text-[var(--text-primary)] group-hover:text-[var(--accent-primary)] transition-colors">
                                  {b.brand}
                                </span>
                                <span className="text-[11px] text-[var(--text-muted)] block font-mono">
                                  {theme.conceptTag}
                                </span>
                              </div>
                              <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-[var(--accent-primary)] ml-1" />
                            </Link>
                          </td>
                          <td className="py-3.5 px-4 text-[var(--text-secondary)] font-mono text-xs">
                            <span
                              className={`inline-block w-1.5 h-1.5 rounded-full mr-1.5 ${
                                b.branch === "Kemang"
                                  ? "bg-purple-500"
                                  : "bg-emerald-500"
                              }`}
                            />
                            {b.branch}
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono text-[var(--text-primary)] tabular-nums">
                            {b.order_count.toLocaleString()}
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono text-[var(--text-primary)] font-semibold tabular-nums">
                            {formatRupiah(b.gross_gmv)}
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono text-emerald-600 dark:text-emerald-400 font-semibold tabular-nums">
                            {formatRupiah(b.net_payout)}
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono tabular-nums">
                            <span
                              className={`px-2 py-0.5 rounded text-xs font-semibold ${
                                b.net_realization_rate >= 80
                                  ? "badge-emerald"
                                  : "badge-amber"
                              }`}
                            >
                              {b.net_realization_rate}%
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono text-rose-600 dark:text-rose-400 tabular-nums">
                            {formatRupiah(b.merchant_promo_burn)}
                            <span className="text-[var(--text-muted)] text-xs ml-1">
                              ({b.promo_burn_rate_pct}%)
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono text-[var(--text-secondary)] tabular-nums">
                            {b.avg_prep_time_min > 0
                              ? `${b.avg_prep_time_min}m`
                              : "—"}
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono tabular-nums">
                            {b.sla_breaches > 0 ? (
                              <span className="text-amber-600 dark:text-amber-400 font-semibold">
                                {b.sla_breaches}
                              </span>
                            ) : (
                              <span className="text-[var(--text-muted)]">0</span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <Link
                              href={"/brands/" + slug + filterQs}
                              className="inline-flex items-center gap-1 text-xs font-semibold badge-emerald px-2.5 py-1 rounded-lg hover:opacity-85 transition-opacity"
                            >
                              <span>Open</span>
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

          {/* Top 8 Menu Items Leaderboard */}
          <div className="cockpit-panel rounded-2xl p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-[var(--text-primary)] tracking-tight">
                    Top Menu Items (Volume Velocity)
                  </h2>
                  <span className="text-xs font-mono px-2 py-0.5 rounded badge-neutral">
                    SKU Pareto Leaders
                  </span>
                </div>
                <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                  Ranked by total units sold across Greenville & Kemang
                </p>
              </div>
              <span className="text-xs font-mono text-[var(--text-muted)]">
                Top 8 SKUs
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5">
              {topItems.length === 0 ? (
                <div className="col-span-full p-8 text-center text-[var(--text-muted)] text-xs font-mono">
                  No menu items found for the selected filter.
                </div>
              ) : (
                topItems.map((item, idx) => {
                  const theme = getBrandTheme(item.brand);
                  return (
                    <div
                      key={item.item_name + "-" + idx}
                      className="surface-well p-4 flex flex-col justify-between space-y-3 relative overflow-hidden group hover:border-[var(--border-strong)] transition-colors"
                    >
                      <div>
                        <div className="flex items-center justify-between text-xs text-[var(--text-secondary)] mb-1.5 font-mono">
                          <span className="font-bold text-[var(--text-primary)]">
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
                          className="text-xs font-semibold text-[var(--text-primary)] line-clamp-2 leading-snug"
                          title={item.item_name}
                        >
                          {item.item_name}
                        </div>
                      </div>

                      <div className="flex items-baseline justify-between pt-2 border-t border-[var(--border-subtle)] text-xs">
                        <span className="font-mono text-[var(--text-secondary)]">
                          <strong className="text-[var(--text-primary)] font-bold">
                            {item.total_qty}
                          </strong>{" "}
                          units
                        </span>
                        <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                          {formatRupiah(item.total_revenue)}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Hero Recipe BOMs & Theoretical Food Cost Engine */}
          {heroBoms.length > 0 && (
            <div className="cockpit-panel rounded-2xl p-5 sm:p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <UtensilsCrossed className="w-4 h-4 text-[var(--accent-primary)]" />
                    <h2 className="text-base font-bold text-[var(--text-primary)] tracking-tight">
                      Hero SKU Recipe BOMs & Theoretical Food Cost
                    </h2>
                    <span className="text-xs font-mono px-2 py-0.5 rounded badge-emerald font-semibold">
                      100% Vegetarian BOM
                    </span>
                  </div>
                  <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                    Standardized Bill of Materials joined against live SKU sales velocity
                  </p>
                </div>
                <span className="text-xs font-mono text-[var(--text-muted)]">
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
                      className="surface-well p-4 hover:border-[var(--border-strong)] transition-all flex flex-col justify-between space-y-3"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <span
                            className="text-xs font-bold flex items-center gap-1.5"
                            style={{ color: theme.primaryColor }}
                          >
                            <span
                              className="w-2 h-2 rounded-full shrink-0"
                              style={{ backgroundColor: theme.primaryColor }}
                            />
                            {bom.brand}
                          </span>
                          <span className="text-[11px] font-mono px-2 py-0.5 rounded badge-emerald font-semibold">
                            {bom.delivery_food_cost_pct}% COGS
                          </span>
                        </div>
                        <h3 className="text-sm font-bold text-[var(--text-primary)] leading-snug">
                          {bom.canonical_name}
                        </h3>
                        <p className="text-[11px] text-[var(--text-secondary)] font-mono leading-relaxed line-clamp-2">
                          {bom.bom_summary}
                        </p>
                      </div>

                      <div className="space-y-2 pt-2 border-t border-[var(--border-subtle)] text-xs font-mono">
                        <div className="grid grid-cols-3 gap-1.5 text-center">
                          <div className="bg-[var(--bg-surface)] rounded-lg p-1.5 border border-[var(--border-subtle)]">
                            <span className="text-[10px] text-[var(--text-muted)] block">
                              Menu
                            </span>
                            <span className="text-[var(--text-primary)] font-semibold tabular-nums">
                              {formatRupiah(bom.realized_menu_price)}
                            </span>
                          </div>
                          <div className="bg-[var(--bg-surface)] rounded-lg p-1.5 border border-[var(--border-subtle)]">
                            <span className="text-[10px] text-[var(--text-muted)] block">
                              BOM+Pkg
                            </span>
                            <span className="text-amber-600 dark:text-amber-400 font-semibold tabular-nums">
                              {formatRupiah(
                                bom.raw_food_cost + bom.packaging_delivery
                              )}
                            </span>
                          </div>
                          <div className="bg-[var(--bg-surface)] rounded-lg p-1.5 border border-[var(--border-subtle)]">
                            <span className="text-[10px] text-[var(--text-muted)] block">
                              Margin
                            </span>
                            <span className="text-emerald-600 dark:text-emerald-400 font-bold tabular-nums">
                              {formatRupiah(bom.delivery_margin_rp)}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-[var(--text-secondary)] pt-1">
                          <span>
                            Sold:{" "}
                            <strong className="text-[var(--text-primary)]">
                              {bom.realized_units_sold}
                            </strong>{" "}
                            units
                          </span>
                          <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
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
        </div>
      )}

      {/* =========================================================================
          TAB 3: KITCHEN PREP SLA HEATMAP & BOTTLENECK INSPECTOR
          ========================================================================= */}
      {showSla && <KitchenSlaHeatmap diagnostic={slaDiagnostic} />}

      {/* =========================================================================
          TAB 4: CANCELLED ORDER & REVENUE LEAKAGE INSPECTOR
          ========================================================================= */}
      {showCancellations && (
        <CanceledOrderInspector diagnostic={cancellationDiagnostic} />
      )}
    </div>
  );
}
