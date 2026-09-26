"use client";

import React, { useState } from "react";
import type { BrandDetailData } from "@/lib/queries";
import { getChannelColor } from "@/lib/brandTheme";
import {
  SkuParetoBarChart,
  BrandHourlyKptChart,
  BrandChannelChart,
} from "@/components/Charts";
import { KitchenSlaHeatmap } from "@/components/KitchenSlaHeatmap";
import { CanceledOrderInspector } from "@/components/CanceledOrderInspector";
import {
  Flame,
  ShoppingBag,
  TrendingUp,
  AlertTriangle,
  Boxes,
  Clock,
  Ban,
  UtensilsCrossed,
  BarChart3,
  Layers,
} from "lucide-react";

interface BrandWorkspaceProps {
  brandData: BrandDetailData;
}

type BrandTab = "velocity" | "bom" | "sla" | "cancellations" | "all";

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function BrandWorkspace({ brandData }: BrandWorkspaceProps) {
  const [activeTab, setActiveTab] = useState<BrandTab>("velocity");

  const {
    brandName,
    kpi,
    skus,
    menuEngineering,
    menuEngineeringSummary,
    slaDiagnostic,
    cancellationDiagnostic,
    channels,
    branches,
    hourly,
    paretoSummary,
  } = brandData;

  const showVelocity = activeTab === "velocity" || activeTab === "all";
  const showBom = activeTab === "bom" || activeTab === "all";
  const showSla = activeTab === "sla" || activeTab === "all";
  const showCancellations = activeTab === "cancellations" || activeTab === "all";

  return (
    <div className="space-y-6">
      {/* =========================================================================
          Brand Executive KPI Telemetry Cards
          ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* GMV */}
        <div
          onClick={() => setActiveTab("velocity")}
          className="cockpit-panel rounded-2xl p-5 relative overflow-hidden accent-bar-blue cursor-pointer"
        >
          <div className="flex items-center justify-between text-[var(--text-secondary)]">
            <span className="text-xs font-mono uppercase tracking-wider font-semibold">
              Brand GMV
            </span>
            <TrendingUp className="w-4 h-4 text-sky-600 dark:text-sky-400" />
          </div>
          <div className="text-2xl font-bold mt-2 text-[var(--text-primary)] font-display tabular-nums">
            {formatRupiah(kpi.gross_gmv)}
          </div>
          <div className="text-xs text-[var(--text-secondary)] mt-1.5 font-mono">
            Avg Order:{" "}
            <strong className="text-[var(--text-primary)]">
              {formatRupiah(kpi.avg_order_value)}
            </strong>
          </div>
        </div>

        {/* Net Settlement */}
        <div
          onClick={() => setActiveTab("velocity")}
          className="cockpit-panel rounded-2xl p-5 relative overflow-hidden accent-bar-emerald cursor-pointer"
        >
          <div className="flex items-center justify-between text-[var(--text-secondary)]">
            <span className="text-xs font-mono uppercase tracking-wider font-semibold">
              Net Settlement
            </span>
            <span className="text-xs badge-emerald px-2 py-0.5 rounded font-mono font-semibold">
              {kpi.net_realization_rate}% Realized
            </span>
          </div>
          <div className="text-2xl font-bold mt-2 text-emerald-600 dark:text-emerald-400 font-display tabular-nums">
            {formatRupiah(kpi.net_payout)}
          </div>
          <div className="text-xs text-[var(--text-secondary)] mt-1.5 font-mono">
            Settled net proceeds from platforms
          </div>
        </div>

        {/* Units Sold */}
        <div
          onClick={() => setActiveTab("bom")}
          className="cockpit-panel rounded-2xl p-5 relative overflow-hidden accent-bar-purple cursor-pointer"
        >
          <div className="flex items-center justify-between text-[var(--text-secondary)]">
            <span className="text-xs font-mono uppercase tracking-wider font-semibold">
              Total Units Sold
            </span>
            <ShoppingBag className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          </div>
          <div className="text-2xl font-bold mt-2 text-[var(--text-primary)] font-display tabular-nums">
            {kpi.total_units_sold.toLocaleString()} units
          </div>
          <div className="text-xs text-[var(--text-secondary)] mt-1.5 font-mono">
            Across{" "}
            <strong className="text-[var(--text-primary)]">
              {skus.length} catalog SKUs
            </strong>
          </div>
        </div>

        {/* Promo Burn */}
        <div
          onClick={() => setActiveTab("velocity")}
          className="cockpit-panel rounded-2xl p-5 relative overflow-hidden accent-bar-rose cursor-pointer"
        >
          <div className="flex items-center justify-between text-[var(--text-secondary)]">
            <span className="text-xs font-mono uppercase tracking-wider font-semibold">
              Merchant Promo Burn
            </span>
            <Flame className="w-4 h-4 text-rose-600 dark:text-rose-400" />
          </div>
          <div className="text-2xl font-bold mt-2 text-rose-600 dark:text-rose-400 font-display tabular-nums">
            {formatRupiah(kpi.merchant_promo_burn)}
          </div>
          <div className="text-xs text-[var(--text-secondary)] mt-1.5 font-mono">
            Burn Drag:{" "}
            <strong className="text-[var(--text-primary)]">
              {kpi.promo_burn_rate_pct}%
            </strong>{" "}
            of GMV
          </div>
        </div>
      </div>

      {/* =========================================================================
          Operational Guardrails & SLA Indicators
          ========================================================================= */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Guardrail 1: Promo Drag */}
        <div
          className={`cockpit-panel rounded-2xl p-4 sm:p-5 relative overflow-hidden ${
            kpi.promo_burn_rate_pct > 15 ? "accent-bar-rose" : "accent-bar-emerald"
          }`}
        >
          <div className="flex items-start justify-between">
            <div>
              <div className="text-xs font-mono uppercase tracking-wider text-[var(--text-secondary)] font-semibold">
                Merchant Promo Guardrail
              </div>
              <div className="text-xl font-bold mt-1 text-[var(--text-primary)] font-mono flex items-baseline gap-2 tabular-nums">
                {kpi.promo_burn_rate_pct}%
                <span className="text-xs font-normal text-[var(--text-muted)] font-sans">
                  of GMV
                </span>
              </div>
            </div>
            {kpi.promo_burn_rate_pct > 15 ? (
              <span className="p-2 badge-rose rounded-xl">
                <Flame className="w-4 h-4" />
              </span>
            ) : (
              <span className="px-2.5 py-1 rounded-xl text-xs font-mono font-semibold badge-emerald">
                ≤15% Compliant
              </span>
            )}
          </div>
          <p className="text-xs text-[var(--text-secondary)] mt-2 leading-relaxed">
            {kpi.promo_burn_rate_pct > 15
              ? `Exceeds 15% operating ceiling by ${(kpi.promo_burn_rate_pct - 15).toFixed(1)}%. Review campaign co-funding.`
              : "Promo burn is disciplined within target unit margins."}
          </p>
        </div>

        {/* Guardrail 2: Kitchen SLA & Red Alerts */}
        <div
          onClick={() => setActiveTab("sla")}
          className={`cockpit-panel rounded-2xl p-4 sm:p-5 relative overflow-hidden cursor-pointer ${
            kpi.red_alerts > 0 ? "accent-bar-amber" : "accent-bar-emerald"
          }`}
        >
          <div className="flex items-start justify-between">
            <div>
              <div className="text-xs font-mono uppercase tracking-wider text-[var(--text-secondary)] font-semibold">
                Kitchen Prep SLA
              </div>
              <div className="text-xl font-bold mt-1 text-[var(--text-primary)] font-mono flex items-baseline gap-2 tabular-nums">
                {kpi.avg_prep_time_min > 0 ? `${kpi.avg_prep_time_min}m` : "—"}
                <span className="text-xs font-normal text-[var(--text-secondary)] font-sans">
                  ({kpi.sla_breaches} breaches)
                </span>
              </div>
            </div>
            {kpi.red_alerts > 0 ? (
              <span className="p-2 badge-amber rounded-xl">
                <AlertTriangle className="w-4 h-4" />
              </span>
            ) : (
              <span className="px-2.5 py-1 rounded-xl text-xs font-mono font-semibold badge-emerald">
                SLA Compliant
              </span>
            )}
          </div>
          <p className="text-xs text-[var(--text-secondary)] mt-2 leading-relaxed">
            {kpi.red_alerts > 0
              ? `${kpi.red_alerts} critical prep breaches (>20m). Click to inspect station heatmap.`
              : "Kitchen throughput meets targets (≤12m Kemang / ≤15m Greenville)."}
          </p>
        </div>

        {/* Guardrail 3: Menu Pareto Concentration */}
        <div
          onClick={() => setActiveTab("bom")}
          className="cockpit-panel rounded-2xl p-4 sm:p-5 relative overflow-hidden accent-bar-purple cursor-pointer"
        >
          <div className="flex items-start justify-between">
            <div>
              <div className="text-xs font-mono uppercase tracking-wider text-[var(--text-secondary)] font-semibold">
                Menu Pareto Concentration
              </div>
              <div className="text-xl font-bold mt-1 text-[var(--text-primary)] font-mono flex items-baseline gap-2 tabular-nums">
                {paretoSummary.heroCount} Hero SKUs
                <span className="text-xs font-normal text-emerald-600 dark:text-emerald-400 font-sans font-semibold">
                  ({paretoSummary.heroSharePct}% vol)
                </span>
              </div>
            </div>
            <span className="p-2 badge-purple rounded-xl">
              <Boxes className="w-4 h-4" />
            </span>
          </div>
          <p className="text-xs text-[var(--text-secondary)] mt-2 leading-relaxed">
            {paretoSummary.watchlistCount > 0
              ? `${paretoSummary.watchlistCount} low-velocity items in Tier C watchlist. Click to inspect Menu Engineering.`
              : "Concentrated menu catalog with healthy volume turnover."}
          </p>
        </div>
      </div>

      {/* =========================================================================
          Brand Operational Mode Switcher (Segmented Tab Bar)
          ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[var(--bg-surface)] p-2 rounded-2xl border border-[var(--border-default)] shadow-2xs">
        <div className="flex flex-wrap items-center gap-1">
          <button
            type="button"
            onClick={() => setActiveTab("velocity")}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === "velocity"
                ? "bg-[var(--accent-primary)] text-white shadow-xs"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-2)]"
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>SKU Velocity & Channels</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("bom")}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === "bom"
                ? "bg-[var(--accent-primary)] text-white shadow-xs"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-2)]"
            }`}
          >
            <UtensilsCrossed className="w-3.5 h-3.5" />
            <span>Menu Engineering & BOM</span>
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
            {kpi.sla_breaches > 0 && (
              <span
                className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${
                  activeTab === "sla" ? "bg-white/20 text-white" : "badge-amber"
                }`}
              >
                {kpi.sla_breaches}
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
            <span>Cancellations & Waste</span>
            {kpi.cancelled_orders_count > 0 && (
              <span
                className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${
                  activeTab === "cancellations"
                    ? "bg-white/20 text-white"
                    : "badge-rose"
                }`}
              >
                {kpi.cancelled_orders_count}
              </span>
            )}
          </button>
        </div>

        <button
          type="button"
          onClick={() => setActiveTab(activeTab === "all" ? "velocity" : "all")}
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
          TAB 1: VELOCITY, CHANNELS, HOURLY KPT & FULL PARETO CATALOG
          ========================================================================= */}
      {showVelocity && (
        <div className="space-y-6">
          {/* Charts Grid: Pareto Distribution & Channel Mix */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Pareto Horizontal Bar Chart */}
            <div className="lg:col-span-2 cockpit-panel rounded-2xl p-5 sm:p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-[var(--text-primary)] tracking-tight">
                      SKU Volume Pareto Distribution
                    </h2>
                    <span className="text-xs font-mono px-2 py-0.5 rounded badge-neutral">
                      Top 10 Volume SKUs
                    </span>
                  </div>
                  <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                    Classified into Tier A (Hero 80%), Tier B (15%), Tier C (5%)
                  </p>
                </div>

                {/* Tier Legend Pills */}
                <div className="flex items-center gap-2 text-xs font-mono">
                  <span className="flex items-center gap-1.5 badge-emerald px-2 py-0.5 rounded">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                    Tier A (80%)
                  </span>
                  <span className="flex items-center gap-1.5 badge-blue px-2 py-0.5 rounded">
                    <span className="w-2 h-2 rounded-full bg-sky-500 inline-block" />
                    Tier B (15%)
                  </span>
                  <span className="flex items-center gap-1.5 badge-amber px-2 py-0.5 rounded">
                    <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
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
                  <h2 className="text-base font-bold text-[var(--text-primary)] tracking-tight">
                    Channel Concentration
                  </h2>
                  <span className="text-xs font-mono px-2 py-0.5 rounded badge-neutral">
                    Brand Mix
                  </span>
                </div>
                <p className="text-xs text-[var(--text-secondary)]">
                  GrabFood vs GoFood vs Direct POS split
                </p>
              </div>

              <BrandChannelChart data={channels} />

              <div className="space-y-2 border-t border-[var(--border-default)] pt-4">
                {channels.map((ch) => {
                  const color = getChannelColor(ch.provider);
                  return (
                    <div
                      key={ch.provider}
                      className="flex items-center justify-between p-2.5 rounded-xl surface-well"
                    >
                      <div className="flex items-center gap-2.5">
                        <span
                          className="w-3 h-3 rounded-full shrink-0"
                          style={{ backgroundColor: color }}
                        />
                        <div>
                          <span className="text-[var(--text-primary)] font-semibold text-xs sm:text-sm">
                            {ch.provider}
                          </span>
                          <div className="text-[var(--text-secondary)] text-[11px] font-mono">
                            {ch.order_count} tickets · {ch.net_realization_rate}% net
                          </div>
                        </div>
                      </div>
                      <div className="text-right font-mono text-xs">
                        <div className="text-[var(--text-primary)] font-bold">
                          {formatRupiah(ch.gross_gmv)}
                        </div>
                        <div className="text-rose-600 dark:text-rose-400 text-[11px] font-medium">
                          {ch.promo_burn_rate_pct}% promo
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Hourly Prep Cadence & Branch Benchmark */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Hourly Volume & KPT Line */}
            <div className="lg:col-span-2 cockpit-panel rounded-2xl p-5 sm:p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h2 className="text-base font-bold text-[var(--text-primary)] tracking-tight">
                    Order Volume vs Kitchen Prep Time (KPT)
                  </h2>
                  <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                    Hourly order count vs average preparation minutes
                  </p>
                </div>
                <div className="text-xs text-[var(--text-muted)] font-mono">
                  Lunch (11–13h) · Dinner (18–20h)
                </div>
              </div>

              <BrandHourlyKptChart data={hourly} />
            </div>

            {/* Branch Benchmark Cards */}
            <div className="space-y-4">
              <h2 className="text-base font-bold text-[var(--text-primary)] tracking-tight">
                Outlet Operations
              </h2>

              {branches.length === 0 ? (
                <div className="cockpit-panel rounded-2xl p-6 text-center text-xs text-[var(--text-muted)]">
                  No branch activity for current filter
                </div>
              ) : (
                branches.map((b) => (
                  <div
                    key={b.branch}
                    className={`cockpit-panel rounded-2xl p-5 space-y-3 relative overflow-hidden ${
                      b.branch === "Kemang"
                        ? "accent-bar-purple"
                        : "accent-bar-emerald"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            b.branch === "Kemang"
                              ? "bg-purple-500"
                              : "bg-emerald-500"
                          }`}
                        />
                        <span className="text-sm font-bold text-[var(--text-primary)]">
                          {b.branch}
                        </span>
                        <span className="text-xs text-[var(--text-secondary)] font-mono">
                          {b.branch === "Kemang"
                            ? "(Cloud Kitchen)"
                            : "(Dine-in)"}
                        </span>
                      </div>
                      <span className="text-xs badge-neutral px-2.5 py-0.5 rounded-lg font-mono">
                        {b.order_count} orders
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5 text-xs pt-2.5 border-t border-[var(--border-subtle)] font-mono">
                      <div className="surface-well p-2.5">
                        <div className="text-[var(--text-muted)] text-[10px] uppercase">
                          Gross GMV
                        </div>
                        <div className="text-sm font-bold text-[var(--text-primary)] mt-0.5 tabular-nums">
                          {formatRupiah(b.gross_gmv)}
                        </div>
                      </div>
                      <div className="surface-well p-2.5">
                        <div className="text-[var(--text-muted)] text-[10px] uppercase">
                          Net Settlement
                        </div>
                        <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-0.5 tabular-nums">
                          {formatRupiah(b.net_payout)}
                        </div>
                      </div>
                      <div className="surface-well p-2.5">
                        <div className="text-[var(--text-muted)] text-[10px] uppercase">
                          Avg Prep Time
                        </div>
                        <div className="text-sm font-bold text-amber-600 dark:text-amber-400 mt-0.5 tabular-nums">
                          {b.avg_prep_time_min > 0 ? `${b.avg_prep_time_min}m` : "—"}
                        </div>
                      </div>
                      <div className="surface-well p-2.5">
                        <div className="text-[var(--text-muted)] text-[10px] uppercase">
                          SLA Breaches
                        </div>
                        <div
                          className={`text-sm font-bold mt-0.5 tabular-nums ${
                            b.sla_breaches > 0
                              ? "text-rose-600 dark:text-rose-400"
                              : "text-emerald-600 dark:text-emerald-400"
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

          {/* Menu SKU Pareto Velocity Matrix Table */}
          <div className="cockpit-panel rounded-2xl p-5 sm:p-6 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-[var(--text-primary)] tracking-tight">
                    Full Catalog Pareto Matrix (Velocity & Drag)
                  </h2>
                  <span className="text-xs font-mono px-2 py-0.5 rounded badge-neutral">
                    Unit-Level Telemetry
                  </span>
                </div>
                <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                  Classified by cumulative volume share: Tier A (Hero 0–80%), Tier B (Secondary 80–95%), Tier C (Watchlist 95–100%)
                </p>
              </div>
              <span className="text-xs badge-emerald px-3 py-1 rounded-xl font-mono font-semibold">
                {skus.length} SKUs Active
              </span>
            </div>

            <div className="overflow-x-auto border border-[var(--border-default)] rounded-xl">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[var(--border-default)] bg-[var(--bg-surface-2)] text-[var(--text-secondary)] uppercase font-mono text-[11px] tracking-wider">
                    <th className="py-3 px-4 w-10 text-center">#</th>
                    <th className="py-3 px-4">Menu Item</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4 text-right">Units Sold</th>
                    <th className="py-3 px-4 text-right">Volume Share</th>
                    <th className="py-3 px-4 text-right">Cum. %</th>
                    <th className="py-3 px-4 text-right">Est. Revenue</th>
                    <th className="py-3 px-4 text-center">Pareto Tier</th>
                    <th className="py-3 px-4">Operational Strategy</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-subtle)]">
                  {skus.length === 0 ? (
                    <tr>
                      <td
                        colSpan={9}
                        className="py-8 text-center text-[var(--text-muted)] font-mono"
                      >
                        No items sold during this period.
                      </td>
                    </tr>
                  ) : (
                    skus.map((item, idx) => {
                      let badgeClass = "badge-emerald";
                      if (item.tier === "Tier B") badgeClass = "badge-blue";
                      if (item.tier === "Tier C") badgeClass = "badge-amber";

                      return (
                        <tr
                          key={item.item_name + "-" + idx}
                          className="hover:bg-[var(--bg-surface-2)]/60 transition-colors"
                        >
                          <td className="py-3 px-4 text-center font-mono text-[var(--text-muted)]">
                            {idx + 1}
                          </td>
                          <td className="py-3 px-4 font-semibold text-[var(--text-primary)] max-w-xs">
                            {item.item_name}
                          </td>
                          <td className="py-3 px-4 text-[var(--text-secondary)] whitespace-nowrap">
                            {item.category}
                          </td>
                          <td className="py-3 px-4 text-right font-mono text-[var(--text-primary)] font-bold tabular-nums">
                            {item.total_qty.toLocaleString()}
                          </td>
                          <td className="py-3 px-4 text-right font-mono text-[var(--text-secondary)] tabular-nums">
                            {item.share_of_volume_pct}%
                          </td>
                          <td className="py-3 px-4 text-right font-mono text-[var(--text-muted)] tabular-nums">
                            {item.cumulative_volume_pct}%
                          </td>
                          <td className="py-3 px-4 text-right font-mono text-emerald-600 dark:text-emerald-400 font-semibold whitespace-nowrap tabular-nums">
                            {item.total_revenue > 0
                              ? formatRupiah(item.total_revenue)
                              : "—"}
                          </td>
                          <td className="py-3 px-4 text-center whitespace-nowrap">
                            <span
                              className={
                                "px-2.5 py-1 rounded-lg text-xs font-mono font-semibold " +
                                badgeClass
                              }
                            >
                              {item.tier === "Tier A" && "⭐ Tier A · Hero"}
                              {item.tier === "Tier B" && "🔹 Tier B · Secondary"}
                              {item.tier === "Tier C" && "⚠️ Tier C · Watchlist"}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-[var(--text-secondary)] text-xs leading-relaxed">
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
        </div>
      )}

      {/* =========================================================================
          TAB 2: MENU ENGINEERING & RECIPE BOM COST ENGINE
          ========================================================================= */}
      {showBom && (
        <div className="cockpit-panel rounded-2xl p-5 sm:p-6 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-[var(--border-default)] pb-4">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-[var(--text-primary)] tracking-tight">
                  Theoretical Food Cost Engine & Menu Engineering Matrix
                </h2>
                <span className="text-xs font-mono px-2.5 py-0.5 rounded badge-emerald font-semibold">
                  100% Vegetarian BOM Standard
                </span>
              </div>
              <p className="text-xs text-[var(--text-secondary)] mt-1">
                Gross Margin = Menu Price − (Raw Food Cost + Packaging Drag)
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
              <div className="px-3 py-1.5 rounded-xl surface-well text-[var(--text-secondary)]">
                Avg Food + Pkg Cost:{" "}
                <strong
                  className={
                    menuEngineeringSummary.avgFoodCostPct <= 28
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-amber-600 dark:text-amber-400"
                  }
                >
                  {menuEngineeringSummary.avgFoodCostPct}%
                </strong>
              </div>
              <div className="px-3 py-1.5 rounded-xl surface-well text-[var(--text-secondary)]">
                Pkg Drag:{" "}
                <strong className="text-purple-600 dark:text-purple-400">
                  {menuEngineeringSummary.avgPackagingDragPct}%
                </strong>
              </div>
              <div className="px-3 py-1.5 rounded-xl badge-emerald font-semibold">
                Est. Gross Profit:{" "}
                <strong>
                  {formatRupiah(menuEngineeringSummary.totalTheoreticalMarginRp)}
                </strong>
              </div>
            </div>
          </div>

          {/* Seeded Hero Recipe BOM Spotlight */}
          {menuEngineeringSummary.heroBoms.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase tracking-wider text-[var(--text-secondary)] font-semibold">
                  Seeded Hero Recipe BOM Master ({brandName})
                </span>
                <span className="text-xs font-mono text-[var(--text-muted)]">
                  Dine-In vs Online Delivery Packaging Drag
                </span>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {menuEngineeringSummary.heroBoms.map((hb) => (
                  <div
                    key={hb.recipe_id}
                    className="rounded-xl p-4 surface-well space-y-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-[var(--text-primary)]">
                            {hb.canonical_name}
                          </span>
                          <span className="text-[11px] font-mono px-2 py-0.5 rounded badge-emerald font-semibold">
                            Target ≤{hb.target_food_cost_pct}% COGS
                          </span>
                        </div>
                        <p className="text-xs text-[var(--text-secondary)] mt-1 leading-relaxed">
                          {hb.bom_summary}
                        </p>
                      </div>
                      <div className="text-right font-mono shrink-0">
                        <div className="text-xs text-[var(--text-muted)]">
                          Realized Price
                        </div>
                        <div className="text-sm font-bold text-[var(--text-primary)] tabular-nums">
                          {formatRupiah(hb.realized_menu_price)}
                        </div>
                        <div className="text-[11px] text-[var(--text-secondary)]">
                          {hb.realized_units_sold.toLocaleString()} units sold
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2.5 border-t border-[var(--border-subtle)] text-xs font-mono">
                      <div className="bg-[var(--bg-surface)] p-2.5 rounded-lg border border-[var(--border-subtle)]">
                        <div className="text-[10px] text-[var(--text-muted)] uppercase">
                          Raw Food Cost
                        </div>
                        <div className="text-[var(--text-primary)] font-bold mt-0.5 tabular-nums">
                          {formatRupiah(hb.raw_food_cost)}
                        </div>
                      </div>
                      <div className="bg-[var(--bg-surface)] p-2.5 rounded-lg border border-[var(--border-subtle)]">
                        <div className="text-[10px] text-[var(--text-muted)] uppercase">
                          Pkg (Dine/Del)
                        </div>
                        <div className="text-[var(--text-primary)] font-semibold mt-0.5 tabular-nums">
                          {formatRupiah(hb.packaging_dine_in)} /{" "}
                          {formatRupiah(hb.packaging_delivery)}
                        </div>
                      </div>
                      <div className="bg-[var(--bg-surface)] p-2.5 rounded-lg border border-[var(--border-subtle)]">
                        <div className="text-[10px] text-[var(--text-muted)] uppercase">
                          Dine-In Margin
                        </div>
                        <div className="text-emerald-600 dark:text-emerald-400 font-bold mt-0.5 tabular-nums">
                          {formatRupiah(hb.dine_in_margin_rp)}{" "}
                          <span className="text-[10px] text-[var(--text-muted)] font-normal">
                            ({hb.dine_in_food_cost_pct}%)
                          </span>
                        </div>
                      </div>
                      <div className="bg-[var(--bg-surface)] p-2.5 rounded-lg border border-[var(--border-subtle)]">
                        <div className="text-[10px] text-[var(--text-muted)] uppercase">
                          Delivery Margin
                        </div>
                        <div className="text-sky-600 dark:text-sky-400 font-bold mt-0.5 tabular-nums">
                          {formatRupiah(hb.delivery_margin_rp)}{" "}
                          <span className="text-[10px] text-[var(--text-muted)] font-normal">
                            ({hb.delivery_food_cost_pct}%)
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
            <div className="rounded-xl p-4 badge-emerald space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase tracking-wider font-semibold">
                  ⭐ Stars
                </span>
                <span className="text-lg font-bold font-mono tabular-nums">
                  {menuEngineeringSummary.starsCount}
                </span>
              </div>
              <p className="text-[11px] opacity-85">
                High Volume · High Margin (≥{menuEngineeringSummary.avgVolumeBenchmark}u)
              </p>
            </div>

            <div className="rounded-xl p-4 badge-blue space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase tracking-wider font-semibold">
                  🐴 Plowhorses
                </span>
                <span className="text-lg font-bold font-mono tabular-nums">
                  {menuEngineeringSummary.plowhorsesCount}
                </span>
              </div>
              <p className="text-[11px] opacity-85">
                High Volume · Low Margin (Re-price / BOM)
              </p>
            </div>

            <div className="rounded-xl p-4 badge-purple space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase tracking-wider font-semibold">
                  🧩 Puzzles
                </span>
                <span className="text-lg font-bold font-mono tabular-nums">
                  {menuEngineeringSummary.puzzlesCount}
                </span>
              </div>
              <p className="text-[11px] opacity-85">
                Low Volume · High Margin (Promo push)
              </p>
            </div>

            <div className="rounded-xl p-4 badge-amber space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase tracking-wider font-semibold">
                  🐕 Dogs
                </span>
                <span className="text-lg font-bold font-mono tabular-nums">
                  {menuEngineeringSummary.dogsCount}
                </span>
              </div>
              <p className="text-[11px] opacity-85">
                Low Volume · Low Margin (Prune / Bundle)
              </p>
            </div>
          </div>

          {/* Menu Engineering Matrix Table */}
          <div className="overflow-x-auto border border-[var(--border-default)] rounded-xl">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[var(--border-default)] bg-[var(--bg-surface-2)] text-[var(--text-secondary)] uppercase font-mono text-[11px] tracking-wider">
                  <th className="py-3 px-3">Menu Item & Vegetarian BOM</th>
                  <th className="py-3 px-3 text-right">Volume</th>
                  <th className="py-3 px-3 text-right">Menu Price</th>
                  <th className="py-3 px-3 text-right">Food Cost</th>
                  <th className="py-3 px-3 text-right">Pkg Drag</th>
                  <th className="py-3 px-3 text-right">Food Cost %</th>
                  <th className="py-3 px-3 text-right">Unit Margin</th>
                  <th className="py-3 px-3 text-right">Total Profit</th>
                  <th className="py-3 px-3 text-center">Matrix Quadrant</th>
                  <th className="py-3 px-3">Engineering Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-subtle)]">
                {menuEngineering.length === 0 ? (
                  <tr>
                    <td
                      colSpan={10}
                      className="py-8 text-center text-[var(--text-muted)] font-mono"
                    >
                      No catalog items recorded for menu engineering analysis.
                    </td>
                  </tr>
                ) : (
                  menuEngineering.map((item, idx) => {
                    let quadBadge = "badge-emerald";
                    let quadLabel = "⭐ Star";
                    if (item.quadrant === "Plowhorse") {
                      quadBadge = "badge-blue";
                      quadLabel = "🐴 Plowhorse";
                    } else if (item.quadrant === "Puzzle") {
                      quadBadge = "badge-purple";
                      quadLabel = "🧩 Puzzle";
                    } else if (item.quadrant === "Dog") {
                      quadBadge = "badge-amber";
                      quadLabel = "🐕 Dog";
                    }

                    const isOverBenchmark =
                      item.food_cost_pct > item.target_food_cost_pct;

                    return (
                      <tr
                        key={item.item_name + "-me-" + idx}
                        className="hover:bg-[var(--bg-surface-2)]/60 transition-colors"
                      >
                        <td className="py-3 px-3 max-w-xs">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-[var(--text-primary)]">
                              {item.canonical_name}
                            </span>
                            {item.has_recipe_bom && (
                              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded badge-emerald font-semibold">
                                {item.is_hero_bom ? "Hero BOM" : "Seeded BOM"}
                              </span>
                            )}
                          </div>
                          <div
                            className="text-[11px] text-[var(--text-muted)] line-clamp-1 mt-0.5"
                            title={item.bom_summary}
                          >
                            {item.bom_summary}
                          </div>
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-[var(--text-primary)] font-bold tabular-nums whitespace-nowrap">
                          {item.total_qty.toLocaleString()}
                          <span className="block text-[10px] text-[var(--text-muted)] font-normal">
                            {item.delivery_qty} del · {item.dine_in_qty} dine
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-[var(--text-primary)] tabular-nums whitespace-nowrap">
                          {formatRupiah(item.menu_price)}
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-[var(--text-secondary)] tabular-nums whitespace-nowrap">
                          {formatRupiah(item.raw_food_cost)}
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-purple-600 dark:text-purple-400 tabular-nums whitespace-nowrap">
                          {formatRupiah(item.weighted_packaging_cost)}
                          <span className="block text-[10px] text-[var(--text-muted)]">
                            ({item.packaging_drag_pct}%)
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right font-mono tabular-nums whitespace-nowrap">
                          <span
                            className={`px-2 py-0.5 rounded text-xs font-semibold ${
                              !isOverBenchmark
                                ? "badge-emerald"
                                : item.food_cost_pct <=
                                  item.target_food_cost_pct + 7.5
                                ? "badge-amber"
                                : "badge-rose"
                            }`}
                          >
                            {item.food_cost_pct}%
                          </span>
                          <span className="block text-[10px] text-[var(--text-muted)] mt-0.5">
                            Target ≤{item.target_food_cost_pct}%
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-emerald-600 dark:text-emerald-400 font-semibold tabular-nums whitespace-nowrap">
                          {formatRupiah(item.unit_gross_margin)}
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-[var(--text-primary)] font-bold tabular-nums whitespace-nowrap">
                          {formatRupiah(item.total_gross_margin)}
                        </td>
                        <td className="py-3 px-3 text-center whitespace-nowrap">
                          <span
                            className={
                              "px-2.5 py-1 rounded-lg text-xs font-mono font-semibold " +
                              quadBadge
                            }
                          >
                            {quadLabel}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-[var(--text-secondary)] text-xs leading-relaxed min-w-[210px]">
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
      )}

      {/* =========================================================================
          TAB 3: KITCHEN PREP SLA HEATMAP
          ========================================================================= */}
      {showSla && (
        <KitchenSlaHeatmap
          diagnostic={slaDiagnostic}
          title={`${brandName} — Kitchen Prep SLA Heatmap & Breach Inspector`}
          subtitle={`Day × hour KPT matrix, daypart rush strain, and slow ticket basket breakdown for ${brandName}`}
          showBrandColumn={false}
        />
      )}

      {/* =========================================================================
          TAB 4: CANCELLED ORDERS & WASTE INSPECTOR
          ========================================================================= */}
      {showCancellations && (
        <CanceledOrderInspector
          diagnostic={cancellationDiagnostic}
          title={`${brandName} — Cancelled Order & Revenue Leakage Inspector`}
          subtitle={`Cancelled delivery tickets, pre-prep opening gap vs post-prep cooked food waste for ${brandName}`}
        />
      )}
    </div>
  );
}
