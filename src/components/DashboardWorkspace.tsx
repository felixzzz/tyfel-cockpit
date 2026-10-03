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
  DailyTrendPoint,
  WeeklyDayPerformancePoint,
  PrimeCostSummary,
  HeroRecipeBomSummary,
  KitchenSlaDiagnostic,
  CanceledOrdersDiagnostic,
  GlobalMenuEngineeringReport,
  HourlyLaborEfficiencyReport,
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
  DailyRevenueTrendChart,
  WeeklyDayPerformanceChart,
  BranchComparisonChart,
  ChannelAovChart,
} from "@/components/Charts";
import { KitchenSlaHeatmap } from "@/components/KitchenSlaHeatmap";
import { RealtimeKitchenAlerts } from "@/components/RealtimeKitchenAlerts";
import { CanceledOrderInspector } from "@/components/CanceledOrderInspector";
import { MenuEngineeringMatrix } from "@/components/MenuEngineeringMatrix";
import { HourlyLaborEfficiencyChart } from "@/components/HourlyLaborEfficiencyChart";
import {
  RecipeBomModal,
  type InitialRecipeBomTarget,
} from "@/components/RecipeBomModal";
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
  CalendarRange,
  Wallet,
  Users,
  SlidersHorizontal,
  Sparkles,
} from "lucide-react";
import type { CateringExecutiveSummary } from "@/lib/catering-invoice";

interface DashboardWorkspaceProps {
  summary: ExecutiveSummary;
  brands: BrandStats[];
  branches: BranchStats[];
  channels: ChannelStats[];
  topItems: TopItem[];
  hourly: HourlyTrend[];
  dailyTrend?: DailyTrendPoint[];
  weeklyDayPerformance?: WeeklyDayPerformancePoint[];
  primeCost?: PrimeCostSummary;
  heroBoms: HeroRecipeBomSummary[];
  slaDiagnostic: KitchenSlaDiagnostic;
  cancellationDiagnostic: CanceledOrdersDiagnostic;
  cateringSummary?: CateringExecutiveSummary | null;
  menuEngineeringReport?: GlobalMenuEngineeringReport;
  hourlyLaborReport?: HourlyLaborEfficiencyReport;
  filterQs: string;
}

type WorkspaceTab =
  | "overview"
  | "menu_engineering"
  | "labor_efficiency"
  | "branch_comparison"
  | "economics"
  | "sla"
  | "cancellations"
  | "all";

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function DeltaBadge({
  value,
  suffix = "%",
  invertGood = false,
  label,
}: {
  value: number | null | undefined;
  suffix?: string;
  invertGood?: boolean;
  label?: string;
}) {
  if (value === null || value === undefined) return null;
  const isPositive = value > 0;
  const isZero = value === 0;
  const isGood = isZero ? true : invertGood ? !isPositive : isPositive;

  return (
    <span
      title={label ? `${label}: ${isPositive ? "+" : ""}${value}${suffix}` : undefined}
      className={`inline-flex items-center gap-0.5 text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded ${
        isZero
          ? "badge-neutral"
          : isGood
          ? "badge-emerald"
          : "badge-rose"
      }`}
    >
      <span>
        {isPositive ? "▲ +" : value < 0 ? "▼ " : ""}
        {value}
        {suffix}
      </span>
    </span>
  );
}

export function DashboardWorkspace({
  summary,
  brands,
  branches,
  channels,
  topItems,
  hourly,
  dailyTrend = [],
  weeklyDayPerformance = [],
  primeCost,
  heroBoms,
  slaDiagnostic,
  cancellationDiagnostic,
  cateringSummary,
  menuEngineeringReport,
  hourlyLaborReport,
  filterQs,
}: DashboardWorkspaceProps) {
  const [activeTab, setActiveTab] = useState<WorkspaceTab>("overview");
  const [trendViewMode, setTrendViewMode] = useState<"chronological" | "weekly_day">("chronological");
  const [channelViewMode, setChannelViewMode] = useState<"share" | "aov">("share");
  const [outletChartMode, setOutletChartMode] = useState<"branch_compare" | "hourly_rush">("branch_compare");
  const [bomModalOpen, setBomModalOpen] = useState(false);
  const [bomModalTarget, setBomModalTarget] =
    useState<InitialRecipeBomTarget | null>(null);

  // Store P&L "What-If" Profit Lever Simulator State
  const [pnlSimOpen, setPnlSimOpen] = useState<boolean>(false);
  const [pnlPriceNudgeRp, setPnlPriceNudgeRp] = useState<number>(0);
  const [pnlPromoCapPct, setPnlPromoCapPct] = useState<number>(0);
  const [pnlCogsSavePct, setPnlCogsSavePct] = useState<number>(0);

  const showOverview = activeTab === "overview" || activeTab === "all";
  const showMenuEngineering = activeTab === "menu_engineering" || activeTab === "all";
  const showLaborEfficiency = activeTab === "labor_efficiency" || activeTab === "all";
  const showBranchComparison = activeTab === "branch_comparison" || activeTab === "all";
  const showEconomics = activeTab === "economics" || activeTab === "all";
  const showSla = activeTab === "sla" || activeTab === "all";
  const showCancellations = activeTab === "cancellations" || activeTab === "all";

  const deltas = summary.deltas;

  return (
    <div className="space-y-6">
      {/* =========================================================================
          Executive KPI Telemetry Deck (Interactive Action Cards + PoP Deltas)
          ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Metric 1: Gross GMV */}
        <div
          onClick={() => setActiveTab("overview")}
          className="cockpit-panel rounded-2xl p-5 relative overflow-hidden accent-bar-blue cursor-pointer group"
        >
          <div className="flex items-center justify-between gap-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
              Gross GMV
            </span>
            <div className="flex items-center gap-1.5">
              <DeltaBadge
                value={deltas?.gmvDeltaPct}
                suffix="%"
                label={deltas?.comparisonLabel}
              />
              <div className="p-1.5 rounded-lg badge-blue">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-[26px] font-bold text-[var(--text-primary)] tracking-tight tabular-nums font-display">
              {formatRupiah(summary.total_gross_gmv)}
            </div>
            <div className="text-xs text-[var(--text-secondary)] mt-2 flex items-center justify-between gap-1.5 font-mono">
              <span className="flex items-center gap-1">
                <ShoppingBag className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400 shrink-0" />
                <strong className="text-[var(--text-primary)]">
                  {summary.total_orders.toLocaleString()}
                </strong>{" "}
                ord · AOV{" "}
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
          <div className="flex items-center justify-between gap-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
              Net Cash Realized
            </span>
            <div className="flex items-center gap-1.5">
              <DeltaBadge
                value={deltas?.netPayoutDeltaPct}
                suffix="%"
                label={deltas?.comparisonLabel}
              />
              <div className="p-1.5 rounded-lg badge-emerald">
                <TrendingUp className="w-4 h-4" />
              </div>
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
              <span className="text-xs text-[var(--text-muted)] font-mono">
                {deltas?.comparisonLabel || "Target ≥68%"}
              </span>
            </div>
          </div>
        </div>

        {/* Metric 3: Merchant Promo Burn */}
        <div
          onClick={() => setActiveTab("economics")}
          className="cockpit-panel rounded-2xl p-5 relative overflow-hidden accent-bar-rose cursor-pointer group"
        >
          <div className="flex items-center justify-between gap-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
              Merchant Promo Burn
            </span>
            <div className="flex items-center gap-1.5">
              <DeltaBadge
                value={deltas?.promoBurnRateDeltaPts}
                suffix="pt"
                invertGood
                label={deltas?.comparisonLabel}
              />
              <div className="p-1.5 rounded-lg badge-rose">
                <Flame className="w-4 h-4" />
              </div>
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
                P&amp;L Bridge →
              </span>
            </div>
          </div>
        </div>

        {/* Metric 4: Kitchen SLA & Prep Time */}
        <div
          onClick={() => setActiveTab("sla")}
          className="cockpit-panel rounded-2xl p-5 relative overflow-hidden accent-bar-amber cursor-pointer group"
        >
          <div className="flex items-center justify-between gap-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
              Kitchen Prep / SLA
            </span>
            <div className="flex items-center gap-1.5">
              <DeltaBadge
                value={deltas?.slaBreachRateDeltaPts}
                suffix="pt"
                invertGood
                label={deltas?.comparisonLabel}
              />
              <div className="p-1.5 rounded-lg badge-amber">
                <Clock className="w-4 h-4" />
              </div>
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
          <div className="flex items-center justify-between gap-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
              Cancelled & Leakage
            </span>
            <div className="flex items-center gap-1.5">
              <DeltaBadge
                value={deltas?.cancelRateDeltaPts}
                suffix="pt"
                invertGood
                label={deltas?.comparisonLabel}
              />
              <div className="p-1.5 rounded-lg badge-rose">
                <Ban className="w-4 h-4" />
              </div>
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
            onClick={() => setActiveTab("menu_engineering")}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === "menu_engineering"
                ? "bg-[var(--accent-primary)] text-white shadow-xs"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-2)]"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Menu Engineering (BCG)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("labor_efficiency")}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === "labor_efficiency"
                ? "bg-[var(--accent-primary)] text-white shadow-xs"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-2)]"
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Labor &amp; SPLH Efficiency</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("branch_comparison")}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === "branch_comparison"
                ? "bg-[var(--accent-primary)] text-white shadow-xs"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-2)]"
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Branch Comparison</span>
            <span
              className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${
                activeTab === "branch_comparison" ? "bg-white/20 text-white" : "badge-emerald"
              }`}
            >
              {branches.length} Outlets
            </span>
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
            <span>Prime Cost P&amp;L &amp; Menu BOMs</span>
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

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => {
              setBomModalTarget(null);
              setBomModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-mono font-semibold badge-emerald hover:opacity-90 transition-opacity cursor-pointer"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Edit BOMs / Map SKUs</span>
          </button>

          <button
            type="button"
            onClick={() =>
              setActiveTab(activeTab === "all" ? "overview" : "all")
            }
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-mono font-semibold transition-all cursor-pointer ${
              activeTab === "all"
                ? "bg-[var(--text-primary)] text-[var(--bg-surface)]"
                : "bg-[var(--bg-surface-2)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-subtle)]"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>{activeTab === "all" ? "Showing All Panels" : "Expand All Panels"}</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          TAB 1: EXECUTIVE OVERVIEW (Portfolio, Daily Trend, Charts, Outlets, Velocity)
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

          {/* Herbox Personal Catering Recurring Subscription Stream Highlight */}
          {cateringSummary && (
            <div className="cockpit-panel rounded-2xl p-4 sm:p-5 border-emerald-500/35 bg-gradient-to-r from-emerald-500/10 via-[var(--bg-surface-1)] to-transparent flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex items-start sm:items-center gap-3.5">
                <div className="p-3 rounded-2xl bg-emerald-500/20 border border-emerald-500/35 text-emerald-600 dark:text-emerald-400 shrink-0">
                  <CalendarRange className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-bold text-[var(--text-primary)]">
                      Herbox Personal Catering Program
                    </span>
                    <span className="badge-emerald px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold">
                      Recurring Subscription Stream
                    </span>
                    <span className="text-[11px] font-mono text-[var(--text-muted)]">
                      Aug–Nov 2026 Live
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5 text-xs text-[var(--text-secondary)] font-mono">
                    <span>
                      Contracted:{" "}
                      <strong className="text-emerald-600 dark:text-emerald-400 font-bold">
                        {formatRupiah(cateringSummary.total_revenue_billed)}
                      </strong>
                    </span>
                    <span>
                      Est. MRR:{" "}
                      <strong className="text-[var(--text-primary)] font-bold">
                        {formatRupiah(cateringSummary.estimated_mrr)}/mo
                      </strong>
                    </span>
                    <span>
                      Boxes:{" "}
                      <strong className="text-[var(--text-primary)] font-bold">
                        {cateringSummary.total_boxes_delivered}/{cateringSummary.total_boxes_contracted}
                      </strong>{" "}
                      ({cateringSummary.fulfillment_rate_pct}% fulfilled)
                    </span>
                    <span>
                      Active:{" "}
                      <strong className="text-[var(--text-primary)] font-bold">
                        {cateringSummary.active_subscribers} subscribers
                      </strong>
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 self-start lg:self-center">
                <Link
                  href="/catering"
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold inline-flex items-center gap-1.5 shadow-xs transition-all"
                >
                  <span>Open Catering CRM</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
                <Link
                  href={`/brands/herbox${filterQs}`}
                  className="px-3.5 py-2 rounded-xl bg-[var(--bg-surface-2)] hover:bg-[var(--bg-surface-3)] text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-subtle)] transition-colors"
                >
                  Herbox Brand
                </Link>
              </div>
            </div>
          )}

          {/* Track 2: Daily Revenue, Net Realization & Order Velocity Time-Series */}
          {(dailyTrend.length > 0 || weeklyDayPerformance.length > 0) && (
            <div className="cockpit-panel rounded-2xl p-5 sm:p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <CalendarRange className="w-4 h-4 text-sky-500" />
                    <h2 className="text-base font-bold text-[var(--text-primary)] tracking-tight">
                      {trendViewMode === "chronological"
                        ? "Daily Revenue, Net Settlement & Order Trajectory"
                        : "Sales by Day of Week (Sun, Mon...)"}
                    </h2>
                    <span className="text-xs font-mono px-2 py-0.5 rounded badge-sky font-semibold">
                      {trendViewMode === "chronological"
                        ? `${dailyTrend.length} Active Days`
                        : "Sun – Sat Demand Profile"}
                    </span>
                    {trendViewMode === "chronological" && deltas?.gmvDeltaPct !== null && deltas?.gmvDeltaPct !== undefined && (
                      <span className="text-xs font-mono text-[var(--text-muted)]">
                        PoP Benchmark: {deltas.comparisonLabel}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                    {trendViewMode === "chronological"
                      ? "Day-over-day Gross GMV, Net Cash Realization, and completed order velocity across selected outlets"
                      : "Weekly day cadence analyzing peak demand, weekend surges (Fri–Sun), and average order value (AOV) from Sunday to Saturday"}
                  </p>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <div className="inline-flex p-1 rounded-xl bg-[var(--bg-surface-2)] border border-[var(--border-default)]">
                    <button
                      type="button"
                      onClick={() => setTrendViewMode("chronological")}
                      className={`px-3 py-1 text-xs font-semibold rounded-lg transition cursor-pointer ${
                        trendViewMode === "chronological"
                          ? "bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-xs border border-[var(--border-default)]"
                          : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                      }`}
                    >
                      Chronological (Daily)
                    </button>
                    <button
                      type="button"
                      onClick={() => setTrendViewMode("weekly_day")}
                      className={`px-3 py-1 text-xs font-semibold rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                        trendViewMode === "weekly_day"
                          ? "bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-xs border border-[var(--border-default)]"
                          : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                      }`}
                    >
                      <span>Day of Week Sales (Sun, Mon...)</span>
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    </button>
                  </div>
                </div>
              </div>

              {trendViewMode === "chronological" ? (
                <DailyRevenueTrendChart data={dailyTrend} />
              ) : (
                <WeeklyDayPerformanceChart data={weeklyDayPerformance} />
              )}
            </div>
          )}

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

            {/* Channel Share Donut & Channel AOV */}
            <div className="cockpit-panel rounded-2xl p-5 sm:p-6 space-y-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <h2 className="text-base font-bold text-[var(--text-primary)] tracking-tight">
                    {channelViewMode === "share" ? "Channel Distribution" : "Channel AOV (Basket Size)"}
                  </h2>
                  <div className="inline-flex p-0.5 rounded-lg bg-[var(--bg-surface-2)] border border-[var(--border-default)]">
                    <button
                      type="button"
                      onClick={() => setChannelViewMode("share")}
                      className={`px-2.5 py-0.5 text-[11px] font-semibold rounded-md transition cursor-pointer ${
                        channelViewMode === "share"
                          ? "bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-2xs border border-[var(--border-default)]"
                          : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                      }`}
                    >
                      Share %
                    </button>
                    <button
                      type="button"
                      onClick={() => setChannelViewMode("aov")}
                      className={`px-2.5 py-0.5 text-[11px] font-semibold rounded-md transition cursor-pointer flex items-center gap-1 ${
                        channelViewMode === "aov"
                          ? "bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-2xs border border-[var(--border-default)]"
                          : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                      }`}
                    >
                      <span>Channel AOV</span>
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    </button>
                  </div>
                </div>
                <p className="text-xs text-[var(--text-secondary)]">
                  {channelViewMode === "share"
                    ? "GrabFood vs GoFood vs Direct POS GMV Split"
                    : "Average basket size (Gross vs Net Realized) per order across platforms"}
                </p>
              </div>

              {channelViewMode === "share" ? (
                <ChannelPieChart data={channels} />
              ) : (
                <ChannelAovChart data={channels} />
              )}

              <div className="space-y-2 border-t border-[var(--border-default)] pt-4">
                {channels.map((ch) => {
                  const channelColor = getChannelColor(ch.provider);
                  const aov = ch.avg_order_value || (ch.order_count > 0 ? Math.round(ch.gross_gmv / ch.order_count) : 0);
                  const netAov = ch.net_avg_order_value || (ch.order_count > 0 ? Math.round(ch.net_payout / ch.order_count) : 0);
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
                        <div>
                          <span className="text-[var(--text-primary)] font-semibold text-xs sm:text-sm block">
                            {ch.provider}
                          </span>
                          <span className="text-[11px] font-mono text-purple-600 dark:text-purple-400 font-semibold">
                            AOV {formatRupiah(aov)}
                          </span>
                        </div>
                      </div>
                      <div className="text-right font-mono text-xs">
                        <div className="text-[var(--text-secondary)] font-medium">
                          <span>{ch.order_count.toLocaleString()} ord</span>
                          <span className="text-[var(--text-muted)] mx-1">·</span>
                          <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                            {ch.net_realization_rate}% net
                          </span>
                        </div>
                        <div className="text-[10px] text-[var(--text-muted)]">
                          Net basket: {formatRupiah(netAov)}
                        </div>
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
                <div>
                  <h2 className="text-base font-bold text-[var(--text-primary)] tracking-tight">
                    Kitchen Outlet Benchmarks
                  </h2>
                  <span className="text-xs text-[var(--text-secondary)]">
                    Flagship vs Cloud Kitchen
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab("branch_comparison")}
                  className="text-xs font-mono font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span>Full Audit</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>

              {branches.length === 0 ? (
                <div className="cockpit-panel rounded-2xl p-6 text-center text-xs text-[var(--text-muted)]">
                  No branch orders found for selected filter
                </div>
              ) : (
                branches.map((b) => {
                  const aov = b.avg_order_value || (b.order_count > 0 ? Math.round(b.gross_gmv / b.order_count) : 0);
                  const promoBurnPct = b.gross_gmv > 0 ? Math.round((b.merchant_promo_burn / b.gross_gmv) * 100) : 0;
                  return (
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

                      <div className="grid grid-cols-3 gap-2 text-xs pt-3 border-t border-[var(--border-subtle)]">
                        <div className="surface-well p-2">
                          <div className="text-[var(--text-muted)] text-[10px] uppercase font-mono">
                            Gross GMV
                          </div>
                          <div className="text-xs sm:text-sm font-bold text-[var(--text-primary)] font-mono mt-0.5 tabular-nums">
                            {formatRupiah(b.gross_gmv)}
                          </div>
                        </div>
                        <div className="surface-well p-2">
                          <div className="text-[var(--text-muted)] text-[10px] uppercase font-mono">
                            Net Settlement
                          </div>
                          <div className="text-xs sm:text-sm font-bold text-emerald-600 dark:text-emerald-400 font-mono mt-0.5 tabular-nums">
                            {formatRupiah(b.net_payout)}
                          </div>
                        </div>
                        <div className="surface-well p-2">
                          <div className="text-[var(--text-muted)] text-[10px] uppercase font-mono">
                            Basket AOV
                          </div>
                          <div className="text-xs sm:text-sm font-bold text-purple-600 dark:text-purple-400 font-mono mt-0.5 tabular-nums">
                            {formatRupiah(aov)}
                          </div>
                        </div>
                        <div className="surface-well p-2">
                          <div className="text-[var(--text-muted)] text-[10px] uppercase font-mono">
                            Realization
                          </div>
                          <div className="text-xs sm:text-sm font-bold text-[var(--text-primary)] font-mono mt-0.5 tabular-nums">
                            {b.net_realization_rate}%
                          </div>
                        </div>
                        <div className="surface-well p-2">
                          <div className="text-[var(--text-muted)] text-[10px] uppercase font-mono">
                            Promo Burn
                          </div>
                          <div className="text-xs sm:text-sm font-bold text-rose-600 dark:text-rose-400 font-mono mt-0.5 tabular-nums">
                            {promoBurnPct}%
                          </div>
                        </div>
                        <div className="surface-well p-2">
                          <div className="text-[var(--text-muted)] text-[10px] uppercase font-mono">
                            Avg Prep / SLA
                          </div>
                          <div className="text-xs sm:text-sm font-bold text-amber-600 dark:text-amber-400 font-mono mt-0.5 tabular-nums">
                            {b.avg_prep_time_min > 0 ? `${b.avg_prep_time_min}m` : "—"}
                            <span className="text-[10px] text-[var(--text-muted)] font-normal ml-0.5">
                              ({b.sla_breaches}br)
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Outlet Performance Panel: Branch Comparison Chart vs Hourly Order Velocity */}
            <div className="lg:col-span-2 cockpit-panel rounded-2xl p-5 sm:p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h2 className="text-base font-bold text-[var(--text-primary)] tracking-tight">
                    {outletChartMode === "branch_compare" ? "Branch Performance Comparison" : "Order Velocity & Rush Windows"}
                  </h2>
                  <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                    {outletChartMode === "branch_compare"
                      ? "Head-to-head comparison between Greenville Flagship and Kemang Cloud Kitchen across GMV, AOV, and prep speed"
                      : "Peak kitchen ticket cadence (11:00–13:00 Lunch · 18:00–20:00 Dinner)"}
                  </p>
                </div>
                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <div className="inline-flex p-0.5 rounded-lg bg-[var(--bg-surface-2)] border border-[var(--border-default)]">
                    <button
                      type="button"
                      onClick={() => setOutletChartMode("branch_compare")}
                      className={`px-2.5 py-1 text-xs font-semibold rounded-md transition cursor-pointer flex items-center gap-1.5 ${
                        outletChartMode === "branch_compare"
                          ? "bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-2xs border border-[var(--border-default)]"
                          : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                      }`}
                    >
                      <Building2 className="w-3.5 h-3.5" />
                      <span>Branch Comparison</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setOutletChartMode("hourly_rush")}
                      className={`px-2.5 py-1 text-xs font-semibold rounded-md transition cursor-pointer flex items-center gap-1.5 ${
                        outletChartMode === "hourly_rush"
                          ? "bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-2xs border border-[var(--border-default)]"
                          : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                      }`}
                    >
                      <Clock className="w-3.5 h-3.5" />
                      <span>24h Rush Windows</span>
                    </button>
                  </div>
                </div>
              </div>

              {outletChartMode === "branch_compare" ? (
                <BranchComparisonChart data={branches} />
              ) : (
                <HourlyOrderChart data={hourly} />
              )}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB: STRATEGIC MENU ENGINEERING (BCG MATRIX) & SKU NET CONTRIBUTION
          ========================================================================= */}
      {showMenuEngineering && menuEngineeringReport && (
        <MenuEngineeringMatrix report={menuEngineeringReport} />
      )}

      {/* =========================================================================
          TAB: HOURLY LABOR EFFICIENCY & SPLH (SALES PER LABOR HOUR)
          ========================================================================= */}
      {showLaborEfficiency && hourlyLaborReport && (
        <HourlyLaborEfficiencyChart report={hourlyLaborReport} />
      )}

      {/* =========================================================================
          TAB: DEDICATED BRANCH COMPARISON WORKBENCH
          ========================================================================= */}
      {showBranchComparison && (
        <div className="space-y-6">
          <div className="cockpit-panel rounded-2xl p-5 sm:p-6 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Building2 className="w-5 h-5 text-emerald-500" />
                  <h2 className="text-lg font-bold text-[var(--text-primary)] tracking-tight">
                    Branch Comparison &amp; Multi-Outlet Benchmarking
                  </h2>
                  <span className="text-xs font-mono px-2 py-0.5 rounded badge-emerald font-semibold">
                    Greenville Flagship vs Kemang Cloud Kitchen
                  </span>
                </div>
                <p className="text-xs text-[var(--text-secondary)] mt-1">
                  Side-by-side comparative analysis of Gross GMV, Net Cash Realization, Average Order Value (AOV), Promo Burn, and Kitchen Prep SLAs
                </p>
              </div>
            </div>

            {/* Visual Head-to-Head Comparison Chart */}
            <BranchComparisonChart data={branches} />
          </div>

          {/* Granular Comparative Scorecard Matrix */}
          <div className="cockpit-panel rounded-2xl p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-[var(--text-primary)] tracking-tight">
                  Granular Outlet Performance Scorecard
                </h3>
                <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                  Detailed unit economics, average basket size, and operational speed comparison
                </p>
              </div>
              <span className="text-xs font-mono text-[var(--text-muted)]">
                2 Kitchen Outlets
              </span>
            </div>

            <div className="overflow-x-auto border border-[var(--border-default)] rounded-xl">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[var(--border-default)] bg-[var(--bg-surface-2)] text-[var(--text-secondary)] uppercase font-semibold text-[11px] tracking-wider font-mono">
                    <th className="py-3 px-4">Metric Benchmark</th>
                    <th className="py-3 px-4 text-right">
                      <span className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        Greenville Flagship
                      </span>
                    </th>
                    <th className="py-3 px-4 text-right">
                      <span className="inline-flex items-center gap-1.5 text-purple-600 dark:text-purple-400">
                        <span className="w-2 h-2 rounded-full bg-purple-500" />
                        Kemang Cloud Kitchen
                      </span>
                    </th>
                    <th className="py-3 px-4 text-right">Portfolio Total</th>
                    <th className="py-3 px-4 text-center">Variance / Advantage</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-subtle)] font-mono">
                  {(() => {
                    const gv = branches.find((b) => b.branch.toLowerCase().includes("greenville"));
                    const kmg = branches.find((b) => b.branch.toLowerCase().includes("kemang"));
                    const totalGmv = (gv?.gross_gmv || 0) + (kmg?.gross_gmv || 0);
                    const totalNet = (gv?.net_payout || 0) + (kmg?.net_payout || 0);
                    const totalOrders = (gv?.order_count || 0) + (kmg?.order_count || 0);
                    const gvAov = gv?.avg_order_value || (gv?.order_count ? Math.round(gv.gross_gmv / gv.order_count) : 0);
                    const kmgAov = kmg?.avg_order_value || (kmg?.order_count ? Math.round(kmg.gross_gmv / kmg.order_count) : 0);
                    const overallAov = totalOrders > 0 ? Math.round(totalGmv / totalOrders) : 0;
                    const gvPromoBurn = gv?.merchant_promo_burn || 0;
                    const kmgPromoBurn = kmg?.merchant_promo_burn || 0;
                    const totalPromoBurn = gvPromoBurn + kmgPromoBurn;
                    const gvPromoPct = gv?.gross_gmv ? Number(((gvPromoBurn / gv.gross_gmv) * 100).toFixed(1)) : 0;
                    const kmgPromoPct = kmg?.gross_gmv ? Number(((kmgPromoBurn / kmg.gross_gmv) * 100).toFixed(1)) : 0;

                    return (
                      <>
                        <tr className="hover:bg-[var(--bg-surface-2)]/60">
                          <td className="py-3 px-4 font-sans font-semibold text-[var(--text-primary)]">
                            Kitchen Format
                          </td>
                          <td className="py-3 px-4 text-right text-[var(--text-secondary)]">
                            Flagship (Dine-in + Delivery)
                          </td>
                          <td className="py-3 px-4 text-right text-[var(--text-secondary)]">
                            Cloud Kitchen (Delivery Only)
                          </td>
                          <td className="py-3 px-4 text-right text-[var(--text-muted)]">
                            Multi-Format
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className="badge-neutral px-2 py-0.5 rounded text-[10px]">
                              Complementary
                            </span>
                          </td>
                        </tr>
                        <tr className="hover:bg-[var(--bg-surface-2)]/60">
                          <td className="py-3 px-4 font-sans font-semibold text-[var(--text-primary)]">
                            Gross GMV
                          </td>
                          <td className="py-3 px-4 text-right text-[var(--text-primary)] font-bold">
                            {formatRupiah(gv?.gross_gmv || 0)} ({totalGmv > 0 ? Math.round(((gv?.gross_gmv || 0) / totalGmv) * 100) : 0}%)
                          </td>
                          <td className="py-3 px-4 text-right text-[var(--text-primary)] font-bold">
                            {formatRupiah(kmg?.gross_gmv || 0)} ({totalGmv > 0 ? Math.round(((kmg?.gross_gmv || 0) / totalGmv) * 100) : 0}%)
                          </td>
                          <td className="py-3 px-4 text-right font-bold text-[var(--text-primary)]">
                            {formatRupiah(totalGmv)}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className="badge-emerald px-2 py-0.5 rounded text-[10px]">
                              Greenville leads by {totalGmv > 0 && kmg?.gross_gmv ? Math.round((((gv?.gross_gmv || 0) - kmg.gross_gmv) / kmg.gross_gmv) * 100) : 0}%
                            </span>
                          </td>
                        </tr>
                        <tr className="hover:bg-[var(--bg-surface-2)]/60">
                          <td className="py-3 px-4 font-sans font-semibold text-[var(--text-primary)]">
                            Net Cash Realized
                          </td>
                          <td className="py-3 px-4 text-right text-emerald-600 dark:text-emerald-400 font-bold">
                            {formatRupiah(gv?.net_payout || 0)}
                          </td>
                          <td className="py-3 px-4 text-right text-emerald-600 dark:text-emerald-400 font-bold">
                            {formatRupiah(kmg?.net_payout || 0)}
                          </td>
                          <td className="py-3 px-4 text-right font-bold text-emerald-600 dark:text-emerald-400">
                            {formatRupiah(totalNet)}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className="badge-sky px-2 py-0.5 rounded text-[10px]">
                              {totalGmv > 0 ? ((totalNet / totalGmv) * 100).toFixed(1) : 0}% Realization
                            </span>
                          </td>
                        </tr>
                        <tr className="hover:bg-[var(--bg-surface-2)]/60">
                          <td className="py-3 px-4 font-sans font-semibold text-[var(--text-primary)]">
                            Net Realization Rate
                          </td>
                          <td className="py-3 px-4 text-right">
                            <span className="badge-emerald px-2 py-0.5 rounded font-semibold">
                              {gv?.net_realization_rate}%
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <span className="badge-emerald px-2 py-0.5 rounded font-semibold">
                              {kmg?.net_realization_rate}%
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right text-[var(--text-secondary)]">
                            {totalGmv > 0 ? ((totalNet / totalGmv) * 100).toFixed(1) : 0}% avg
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className="badge-purple px-2 py-0.5 rounded text-[10px]">
                              Kemang +{((kmg?.net_realization_rate || 0) - (gv?.net_realization_rate || 0)).toFixed(1)}pt higher
                            </span>
                          </td>
                        </tr>
                        <tr className="hover:bg-[var(--bg-surface-2)]/60">
                          <td className="py-3 px-4 font-sans font-semibold text-[var(--text-primary)]">
                            Average Order Value (AOV)
                          </td>
                          <td className="py-3 px-4 text-right font-bold text-purple-600 dark:text-purple-400">
                            {formatRupiah(gvAov)}
                          </td>
                          <td className="py-3 px-4 text-right font-bold text-purple-600 dark:text-purple-400">
                            {formatRupiah(kmgAov)}
                          </td>
                          <td className="py-3 px-4 text-right font-bold text-purple-600 dark:text-purple-400">
                            {formatRupiah(overallAov)}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className="badge-emerald px-2 py-0.5 rounded text-[10px]">
                              Greenville +{kmgAov > 0 ? (((gvAov - kmgAov) / kmgAov) * 100).toFixed(1) : 0}% basket
                            </span>
                          </td>
                        </tr>
                        <tr className="hover:bg-[var(--bg-surface-2)]/60">
                          <td className="py-3 px-4 font-sans font-semibold text-[var(--text-primary)]">
                            Completed Orders
                          </td>
                          <td className="py-3 px-4 text-right text-[var(--text-primary)]">
                            {gv?.order_count.toLocaleString()} tickets
                          </td>
                          <td className="py-3 px-4 text-right text-[var(--text-primary)]">
                            {kmg?.order_count.toLocaleString()} tickets
                          </td>
                          <td className="py-3 px-4 text-right text-[var(--text-primary)]">
                            {totalOrders.toLocaleString()} tickets
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className="badge-neutral px-2 py-0.5 rounded text-[10px]">
                              66% / 34% split
                            </span>
                          </td>
                        </tr>
                        <tr className="hover:bg-[var(--bg-surface-2)]/60">
                          <td className="py-3 px-4 font-sans font-semibold text-[var(--text-primary)]">
                            Promo Burn % of GMV
                          </td>
                          <td className="py-3 px-4 text-right text-rose-500 font-semibold">
                            {formatRupiah(gvPromoBurn)} ({gvPromoPct}%)
                          </td>
                          <td className="py-3 px-4 text-right text-rose-500 font-semibold">
                            {formatRupiah(kmgPromoBurn)} ({kmgPromoPct}%)
                          </td>
                          <td className="py-3 px-4 text-right text-rose-500">
                            {formatRupiah(totalPromoBurn)}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className="badge-purple px-2 py-0.5 rounded text-[10px]">
                              Kemang promo burn lower (-0.7pt)
                            </span>
                          </td>
                        </tr>
                        <tr className="hover:bg-[var(--bg-surface-2)]/60">
                          <td className="py-3 px-4 font-sans font-semibold text-[var(--text-primary)]">
                            Avg Prep Time &amp; SLA
                          </td>
                          <td className="py-3 px-4 text-right text-emerald-600 dark:text-emerald-400 font-bold">
                            {gv?.avg_prep_time_min}m ({gv?.sla_breaches} breaches)
                          </td>
                          <td className="py-3 px-4 text-right text-amber-600 dark:text-amber-400 font-bold">
                            {kmg?.avg_prep_time_min}m ({kmg?.sla_breaches} breaches)
                          </td>
                          <td className="py-3 px-4 text-right text-[var(--text-muted)]">
                            Flagship faster
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className="badge-emerald px-2 py-0.5 rounded text-[10px]">
                              Greenville {Math.abs(Number(((gv?.avg_prep_time_min || 0) - (kmg?.avg_prep_time_min || 0)).toFixed(1)))}m faster
                            </span>
                          </td>
                        </tr>
                      </>
                    );
                  })()}
                </tbody>
              </table>
            </div>
          </div>

          {/* Hourly Order Velocity Comparison */}
          <div className="cockpit-panel rounded-2xl p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-[var(--text-primary)] tracking-tight">
                  Portfolio Hourly Order Velocity &amp; Kitchen Rush Windows
                </h3>
                <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                  Aggregated 24-hour order velocity identifying peak kitchen capacity constraints
                </p>
              </div>
              <span className="text-xs font-mono text-[var(--text-muted)]">
                24h Profile
              </span>
            </div>
            <HourlyOrderChart data={hourly} />
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 2: PRIME COST P&L BRIDGE, UNIT ECONOMICS & MENU BOMs
          ========================================================================= */}
      {(showOverview || showEconomics) && primeCost && (
        <div className="cockpit-panel rounded-2xl p-5 sm:p-6 space-y-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <Wallet className="w-4 h-4 text-emerald-500" />
                <h2 className="text-base font-bold text-[var(--text-primary)] tracking-tight">
                  Store P&amp;L Bridge: Prime Cost (COGS + Labor) &amp; Net Contribution Margin
                </h2>
                <span
                  className={`text-xs font-mono px-2.5 py-0.5 rounded font-semibold ${
                    primeCost.primeCostStatus === "Optimal"
                      ? "badge-emerald"
                      : primeCost.primeCostStatus === "Watchlist"
                      ? "badge-amber"
                      : "badge-rose"
                  }`}
                >
                  Prime Cost: {primeCost.primeCostPctOfNetRevenue}% of Net ({primeCost.primeCostStatus})
                </span>
              </div>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                {primeCost.dateSpanLabel} · Connects Theoretical Recipe COGS (<code className="font-mono">dim_recipes</code>) with Majoo POS Staff Attendance (<code className="font-mono">fact_attendance</code>)
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap self-start md:self-auto">
              <button
                type="button"
                onClick={() => setPnlSimOpen((v) => !v)}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-mono font-semibold border transition-colors cursor-pointer ${
                  pnlSimOpen || pnlPriceNudgeRp > 0 || pnlPromoCapPct > 0 || pnlCogsSavePct > 0
                    ? "badge-emerald border-emerald-500/40"
                    : "surface-well hover:bg-[var(--bg-hover)] text-[var(--text-primary)] border-[var(--border-default)]"
                }`}
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>{pnlSimOpen ? "Hide P&L Simulator" : "Simulate P&L Levers"}</span>
              </button>

              <Link
                href="/attendance"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-mono font-semibold surface-well hover:bg-[var(--bg-hover)] text-[var(--text-primary)] border border-[var(--border-default)] shrink-0"
              >
                <Users className="w-3.5 h-3.5 text-emerald-500" />
                <span>Inspect Staff Shifts &amp; Payslips →</span>
              </Link>
            </div>
          </div>

          {/* 5-Stage P&L Waterfall Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
            {/* Step 1: Gross GMV */}
            <div className="surface-well rounded-xl p-4 border border-[var(--border-subtle)] flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-[10px] font-mono uppercase text-[var(--text-muted)]">
                  <span>1. Gross GMV</span>
                  <span>100% Top-Line</span>
                </div>
                <div className="text-lg font-bold font-mono text-[var(--text-primary)] mt-1 tabular-nums">
                  {formatRupiah(primeCost.grossGmv)}
                </div>
              </div>
              <div className="pt-2.5 mt-2.5 border-t border-[var(--border-subtle)] text-[11px] font-mono text-[var(--text-secondary)] space-y-0.5">
                <div className="flex justify-between">
                  <span>Promo Burn:</span>
                  <span className="text-rose-500">-{formatRupiah(primeCost.merchantPromoBurn)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Platform Cut:</span>
                  <span className="text-[var(--text-muted)]">
                    -{formatRupiah(primeCost.platformFeesAndCommissions)}
                  </span>
                </div>
              </div>
            </div>

            {/* Step 2: Net Realized Revenue */}
            <div className="surface-well rounded-xl p-4 border border-[var(--border-subtle)] flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-[10px] font-mono uppercase text-[var(--text-muted)]">
                  <span>2. Net Settlement</span>
                  <span className="text-emerald-500 font-semibold">
                    {primeCost.netRealizationPct}% of GMV
                  </span>
                </div>
                <div className="text-lg font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1 tabular-nums">
                  {formatRupiah(primeCost.netRevenue)}
                </div>
              </div>
              <div className="pt-2.5 mt-2.5 border-t border-[var(--border-subtle)] text-[11px] font-mono text-[var(--text-secondary)]">
                <span>100% P&amp;L Revenue Base after aggregator commissions &amp; promos</span>
              </div>
            </div>

            {/* Step 3: Theoretical COGS */}
            <div className="surface-well rounded-xl p-4 border border-[var(--border-subtle)] flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-[10px] font-mono uppercase text-[var(--text-muted)]">
                  <span>3. Theoretical COGS</span>
                  <span className="text-amber-500 font-semibold">
                    {primeCost.cogsPctOfNetRevenue}% of Net
                  </span>
                </div>
                <div className="text-lg font-bold font-mono text-amber-600 dark:text-amber-400 mt-1 tabular-nums">
                  -{formatRupiah(primeCost.totalCogs)}
                </div>
              </div>
              <div className="pt-2.5 mt-2.5 border-t border-[var(--border-subtle)] text-[11px] font-mono text-[var(--text-secondary)] space-y-0.5">
                <div className="flex justify-between">
                  <span>Raw Ingredients:</span>
                  <span>{formatRupiah(primeCost.rawFoodCost)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Packaging Cost:</span>
                  <span>{formatRupiah(primeCost.packagingCost)}</span>
                </div>
              </div>
            </div>

            {/* Step 4: Store Labor Cost */}
            <div className="surface-well rounded-xl p-4 border border-[var(--border-subtle)] flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-[10px] font-mono uppercase text-[var(--text-muted)]">
                  <span>4. Store Labor</span>
                  <span className="text-sky-500 font-semibold">
                    {primeCost.laborIncluded ? `${primeCost.laborPctOfNetRevenue}% of Net` : "N/A"}
                  </span>
                </div>
                <div className="text-lg font-bold font-mono text-sky-600 dark:text-sky-400 mt-1 tabular-nums">
                  {primeCost.laborIncluded ? `-${formatRupiah(primeCost.netLaborCost)}` : "Excluded"}
                </div>
              </div>
              <div className="pt-2.5 mt-2.5 border-t border-[var(--border-subtle)] text-[11px] font-mono text-[var(--text-secondary)] space-y-0.5">
                {primeCost.laborIncluded ? (
                  <>
                    <div className="flex justify-between">
                      <span>Shifts / Staff:</span>
                      <span>
                        {primeCost.paidShiftsCount} sh · {primeCost.activeStaffCount} crew
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Rev / Labor Hr:</span>
                      <span className="text-emerald-500">
                        {formatRupiah(primeCost.revenuePerLaborHour)}/h
                      </span>
                    </div>
                  </>
                ) : (
                  <span className="text-[10px] text-[var(--text-muted)]">
                    Majoo attendance tracks Greenville Flagship crew
                  </span>
                )}
              </div>
            </div>

            {/* Step 5: Store Net Contribution Margin */}
            <div className="surface-well rounded-xl p-4 border border-emerald-500/30 bg-emerald-500/[0.04] flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-[10px] font-mono uppercase text-[var(--text-muted)]">
                  <span>5. Net Contribution</span>
                  <span className="badge-emerald px-1.5 py-0.2 rounded font-semibold">
                    {primeCost.netContributionMarginPct}% of Net
                  </span>
                </div>
                <div className="text-lg font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1 tabular-nums">
                  {formatRupiah(primeCost.netContributionMarginRp)}
                </div>
              </div>
              <div className="pt-2.5 mt-2.5 border-t border-[var(--border-subtle)] text-[11px] font-mono text-[var(--text-secondary)] space-y-0.5">
                <div className="flex justify-between">
                  <span>Total Prime Cost:</span>
                  <span className="font-semibold text-[var(--text-primary)]">
                    {formatRupiah(primeCost.primeCost)} ({primeCost.primeCostPctOfNetRevenue}%)
                  </span>
                </div>
                <div className="flex justify-between text-[10px] text-[var(--text-muted)]">
                  <span>Benchmark Target:</span>
                  <span>Prime Cost ≤ {primeCost.primeCostTargetPct}%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Store P&L "What-If" Profit Lever Simulator */}
          {pnlSimOpen && (() => {
            const totalOrdersCount = Math.max(1, summary.total_orders || 1);
            const priceGainNetRp = Math.round(totalOrdersCount * pnlPriceNudgeRp * 0.82); // ~82% net realization after commission
            const promoSavedRp = Math.round(primeCost.merchantPromoBurn * (pnlPromoCapPct / 100));
            const cogsSavedRp = Math.round(primeCost.totalCogs * (pnlCogsSavePct / 100));
            const totalNetUnlockRp = priceGainNetRp + promoSavedRp + cogsSavedRp;

            const simNetRev = primeCost.netRevenue + priceGainNetRp + promoSavedRp;
            const simCogs = Math.max(0, primeCost.totalCogs - cogsSavedRp);
            const simPrimeCost = simCogs + (primeCost.laborIncluded ? primeCost.netLaborCost : 0);
            const simNetContribRp = simNetRev - simPrimeCost;
            const simPrimeCostPct =
              simNetRev > 0 ? Number(((simPrimeCost / simNetRev) * 100).toFixed(1)) : 0;
            const simNetContribPct =
              simNetRev > 0 ? Number(((simNetContribRp / simNetRev) * 100).toFixed(1)) : 0;

            return (
              <div className="rounded-xl p-4 surface-well border border-emerald-500/30 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 rounded badge-emerald font-semibold">
                      Interactive Store P&amp;L Simulator
                    </span>
                    <h3 className="text-sm font-bold text-[var(--text-primary)] mt-1">
                      What-If Margin &amp; Prime Cost Optimization Levers ({totalOrdersCount.toLocaleString()} orders)
                    </h3>
                  </div>
                  {(pnlPriceNudgeRp > 0 || pnlPromoCapPct > 0 || pnlCogsSavePct > 0) && (
                    <button
                      type="button"
                      onClick={() => {
                        setPnlPriceNudgeRp(0);
                        setPnlPromoCapPct(0);
                        setPnlCogsSavePct(0);
                      }}
                      className="px-2.5 py-1 rounded-lg text-xs font-mono border border-[var(--border-default)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] bg-[var(--bg-surface)] cursor-pointer"
                    >
                      Reset Sliders
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                  <div className="p-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] space-y-1.5">
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-[var(--text-secondary)] font-semibold">Avg Basket Price Nudge</span>
                      <span className="font-bold text-emerald-500">+{formatRupiah(pnlPriceNudgeRp)}/ord</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={10000}
                      step={500}
                      value={pnlPriceNudgeRp}
                      onChange={(e) => setPnlPriceNudgeRp(Number(e.target.value))}
                      className="w-full accent-emerald-500 cursor-pointer"
                    />
                    <div className="text-[10px] font-mono text-[var(--text-muted)] flex justify-between">
                      <span>Rp 0</span>
                      <span>Net Impact: +{formatRupiah(priceGainNetRp)}</span>
                      <span>+Rp 10k</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] space-y-1.5">
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-[var(--text-secondary)] font-semibold">Promo Subsidy Cap</span>
                      <span className="font-bold text-purple-500">-{pnlPromoCapPct}% Burn</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={50}
                      step={5}
                      value={pnlPromoCapPct}
                      onChange={(e) => setPnlPromoCapPct(Number(e.target.value))}
                      className="w-full accent-purple-500 cursor-pointer"
                    />
                    <div className="text-[10px] font-mono text-[var(--text-muted)] flex justify-between">
                      <span>0%</span>
                      <span>Saved: +{formatRupiah(promoSavedRp)}</span>
                      <span>-50%</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] space-y-1.5">
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-[var(--text-secondary)] font-semibold">COGS &amp; Pkg Efficiency</span>
                      <span className="font-bold text-sky-500">-{pnlCogsSavePct}% COGS</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={15}
                      step={1}
                      value={pnlCogsSavePct}
                      onChange={(e) => setPnlCogsSavePct(Number(e.target.value))}
                      className="w-full accent-sky-500 cursor-pointer"
                    />
                    <div className="text-[10px] font-mono text-[var(--text-muted)] flex justify-between">
                      <span>0%</span>
                      <span>Saved: +{formatRupiah(cogsSavedRp)}</span>
                      <span>-15%</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 font-mono text-xs">
                  <div className="p-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)]">
                    <span className="text-[10px] uppercase text-[var(--text-muted)] block">
                      Simulated Net Contribution
                    </span>
                    <span className="text-base font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                      {formatRupiah(simNetContribRp)} ({simNetContribPct}%)
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)]">
                    <span className="text-[10px] uppercase text-[var(--text-muted)] block">
                      Simulated Prime Cost %
                    </span>
                    <span
                      className={`text-base font-bold tabular-nums ${
                        simPrimeCostPct <= primeCost.primeCostTargetPct
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-amber-600 dark:text-amber-400"
                      }`}
                    >
                      {simPrimeCostPct}% of Net (was {primeCost.primeCostPctOfNetRevenue}%)
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
                    <span className="text-[10px] uppercase text-emerald-600 dark:text-emerald-400 font-semibold block">
                      Total Period Profit Unlock
                    </span>
                    <span className="text-base font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                      +{formatRupiah(totalNetUnlockRp)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}

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
                  <div className="flex items-center gap-2 flex-wrap">
                    <UtensilsCrossed className="w-4 h-4 text-[var(--accent-primary)]" />
                    <h2 className="text-base font-bold text-[var(--text-primary)] tracking-tight">
                      Hero SKU Recipe BOMs &amp; Theoretical Food Cost
                    </h2>
                    <span className="text-xs font-mono px-2 py-0.5 rounded badge-emerald font-semibold">
                      100% Vegetarian BOM
                    </span>
                  </div>
                  <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                    Standardized Bill of Materials joined against live SKU sales velocity — click Edit BOM on any card to adjust cost assumptions
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setBomModalTarget(null);
                    setBomModalOpen(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono font-semibold badge-emerald hover:opacity-90 cursor-pointer self-start sm:self-auto"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  <span>Open Full BOM Catalog</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {heroBoms.map((bom) => {
                  const theme = getBrandTheme(bom.brand);
                  const slug = brandToSlug(bom.brand);
                  return (
                    <div
                      key={bom.recipe_id}
                      className="surface-well p-4 hover:border-[var(--border-strong)] transition-all flex flex-col justify-between space-y-3"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <Link
                            href={"/brands/" + slug + filterQs}
                            className="text-xs font-bold flex items-center gap-1.5 hover:underline"
                            style={{ color: theme.primaryColor }}
                          >
                            <span
                              className="w-2 h-2 rounded-full shrink-0"
                              style={{ backgroundColor: theme.primaryColor }}
                            />
                            {bom.brand}
                          </Link>
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
                            u · Pkg {bom.packaging_drag_pct}%
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setBomModalTarget({
                                recipe_id: bom.recipe_id,
                                brand: bom.brand,
                                item_name: bom.item_name,
                                canonical_name: bom.canonical_name,
                                category: bom.category,
                                bom_summary: bom.bom_summary,
                                raw_food_cost: bom.raw_food_cost,
                                packaging_dine_in: bom.packaging_dine_in,
                                packaging_delivery: bom.packaging_delivery,
                                target_food_cost_pct: bom.target_food_cost_pct,
                                is_hero_bom: true,
                                realized_menu_price: bom.realized_menu_price,
                              });
                              setBomModalOpen(true);
                            }}
                            className="px-2 py-0.5 rounded bg-[var(--bg-surface)] hover:bg-[var(--bg-hover)] border border-[var(--border-default)] text-[var(--text-primary)] font-semibold cursor-pointer"
                          >
                            Edit BOM
                          </button>
                        </div>
                      </div>
                    </div>
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
      {showSla && (
        <div className="space-y-5">
          <RealtimeKitchenAlerts />
          <KitchenSlaHeatmap diagnostic={slaDiagnostic} />
        </div>
      )}

      {/* =========================================================================
          TAB 4: CANCELLED ORDER & REVENUE LEAKAGE INSPECTOR
          ========================================================================= */}
      {showCancellations && (
        <CanceledOrderInspector diagnostic={cancellationDiagnostic} />
      )}

      <RecipeBomModal
        isOpen={bomModalOpen}
        onClose={() => setBomModalOpen(false)}
        initialTarget={bomModalTarget}
      />
    </div>
  );
}
