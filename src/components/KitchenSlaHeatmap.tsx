"use client";

import React, { useState } from "react";
import {
  KitchenSlaDiagnostic,
  BranchKitchenSlaProfile,
  SlaHeatmapCell,
} from "@/lib/queries";
import {
  Clock,
  AlertTriangle,
  Flame,
  CheckCircle2,
  Layers,
  Building2,
} from "lucide-react";

interface KitchenSlaHeatmapProps {
  diagnostic: KitchenSlaDiagnostic;
  title?: string;
  subtitle?: string;
  showBrandColumn?: boolean;
}

const DISPLAY_DAYS: { dow: number; label: string }[] = [
  { dow: 1, label: "Mon" },
  { dow: 2, label: "Tue" },
  { dow: 3, label: "Wed" },
  { dow: 4, label: "Thu" },
  { dow: 5, label: "Fri" },
  { dow: 6, label: "Sat" },
  { dow: 0, label: "Sun" },
];

const DISPLAY_HOURS = [7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22];

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function getBranchCellStyle(cell: SlaHeatmapCell | undefined, slaTargetMin: number): string {
  if (!cell || cell.orderCount === 0) {
    return "bg-[var(--bg-surface-2)]/60 border-[var(--border-subtle)] text-[var(--text-muted)]";
  }
  if (cell.kptSampleCount === 0) {
    return "bg-[var(--bg-surface-2)] border-[var(--border-default)] text-[var(--text-secondary)]";
  }
  if (cell.redAlerts > 0 || cell.avgPrepTimeMin >= 20.0) {
    return "badge-rose";
  }
  if (cell.slaBreaches > 0 || cell.avgPrepTimeMin > slaTargetMin) {
    return "badge-amber";
  }
  if (cell.avgPrepTimeMin > slaTargetMin * 0.8) {
    return "badge-blue";
  }
  return "badge-emerald";
}

function SingleKitchenMatrix({
  profile,
  showBrandColumn,
}: {
  profile: BranchKitchenSlaProfile;
  showBrandColumn: boolean;
}) {
  const cellMap = new Map<string, SlaHeatmapCell>();
  for (const c of profile.heatmapCells) {
    cellMap.set(`${c.dow}-${c.hour}`, c);
  }

  const isCombined = profile.branch === "Combined";
  const isKemang = profile.branch === "Kemang";
  const optimalCutoff = Number((profile.slaTargetMin * 0.8).toFixed(1));
  const slaLabel = isCombined
    ? "Kemang ≤12m · Greenville ≤15m"
    : `SLA Target ≤${profile.slaTargetMin}m`;

  if (profile.totalOrders === 0) {
    return (
      <div className="rounded-xl p-6 surface-well text-center text-xs font-mono text-[var(--text-muted)]">
        No orders recorded for{" "}
        <strong className="text-[var(--text-primary)]">
          {isCombined ? "Both Kitchens" : `${profile.branch} Kitchen`}
        </strong>{" "}
        in the selected filter window.
      </div>
    );
  }

  return (
    <div className="rounded-2xl p-4 sm:p-5 surface-well space-y-5">
      {/* Kitchen Sub-Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-[var(--border-default)] pb-3.5">
        <div className="flex items-center gap-3">
          <div
            className={`p-2 rounded-xl ${
              isCombined
                ? "badge-amber"
                : isKemang
                ? "badge-purple"
                : "badge-emerald"
            }`}
          >
            <Building2 className="w-4 h-4" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm sm:text-base font-bold text-[var(--text-primary)]">
                {isCombined
                  ? "Both Kitchens Combined (Kemang + Greenville)"
                  : `${profile.branch} Kitchen Line`}
              </h3>
              <span
                className={`text-[11px] font-mono px-2 py-0.5 rounded font-semibold ${
                  isCombined
                    ? "badge-amber"
                    : isKemang
                    ? "badge-purple"
                    : "badge-emerald"
                }`}
              >
                {slaLabel}
              </span>
              <span className="text-xs text-[var(--text-muted)] font-mono">
                {profile.kitchenType}
              </span>
            </div>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5 font-mono">
              {profile.totalOrders.toLocaleString()} total orders ·{" "}
              {profile.totalKptOrders.toLocaleString()} KPT-tracked delivery tickets
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
          <div className="px-2.5 py-1 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-default)]">
            <span className="text-[var(--text-secondary)]">Mean / P90: </span>
            <strong className="text-[var(--text-primary)]">{profile.avgPrepTimeMin}m</strong>
            <span className="text-[var(--text-muted)]"> / </span>
            <strong className="text-amber-600 dark:text-amber-400">{profile.p90PrepTimeMin}m</strong>
          </div>
          <div className="px-2.5 py-1 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-default)]">
            <span className="text-[var(--text-secondary)]">
              Breaches ({isCombined ? "Branch SLA" : `>${profile.slaTargetMin}m`}):{" "}
            </span>
            <strong
              className={
                profile.totalBreaches > 0
                  ? "text-amber-600 dark:text-amber-400"
                  : "text-emerald-600 dark:text-emerald-400"
              }
            >
              {profile.totalBreaches} ({profile.breachRatePct}%)
            </strong>
          </div>
          <div className="px-2.5 py-1 rounded-lg badge-rose">
            <span>Red (&gt;20m): </span>
            <strong>{profile.totalRedAlerts}</strong>
          </div>
          {profile.worstDayHourPrepMin > 0 && (
            <div className="px-2.5 py-1 rounded-lg badge-amber">
              <span>Peak Bottleneck: </span>
              <strong>
                {profile.worstDayHourLabel} ({profile.worstDayHourPrepMin}m)
              </strong>
            </div>
          )}
        </div>
      </div>

      {/* 5-Daypart Throughput & SLA Comparison Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
        {profile.dayparts.map((dp) => {
          const isRush = dp.daypart.includes("Rush");
          return (
            <div
              key={dp.daypart}
              className={`rounded-xl p-3 bg-[var(--bg-surface)] border flex flex-col justify-between space-y-2 ${
                isRush
                  ? "border-amber-500/40"
                  : "border-[var(--border-default)]"
              }`}
            >
              <div className="flex items-center justify-between gap-1">
                <span className="text-xs font-semibold text-[var(--text-primary)]">{dp.daypart}</span>
                {isRush && (
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded badge-amber font-semibold">
                    RUSH
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2 font-mono text-xs pt-1 border-t border-[var(--border-subtle)]">
                <div>
                  <span className="text-[10px] text-[var(--text-muted)] block uppercase">Avg Prep</span>
                  <span
                    className={`font-bold text-sm tabular-nums ${
                      dp.avgPrepTimeMin > profile.slaTargetMin
                        ? "text-amber-600 dark:text-amber-400"
                        : dp.avgPrepTimeMin > 0
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-[var(--text-muted)]"
                    }`}
                  >
                    {dp.avgPrepTimeMin > 0 ? `${dp.avgPrepTimeMin}m` : "—"}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-[var(--text-muted)] block uppercase">Breach Rate</span>
                  <span
                    className={`font-bold text-sm tabular-nums ${
                      dp.breachRatePct >= 15
                        ? "text-rose-600 dark:text-rose-400"
                        : dp.breachRatePct > 0
                        ? "text-amber-600 dark:text-amber-400"
                        : "text-[var(--text-secondary)]"
                    }`}
                  >
                    {dp.breachRatePct}%
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] font-mono text-[var(--text-secondary)] pt-1 border-t border-[var(--border-subtle)]">
                <span>{dp.orderCount.toLocaleString()} orders</span>
                <span>
                  {dp.slaBreaches} breach ·{" "}
                  <strong className={dp.redAlerts > 0 ? "text-rose-600 dark:text-rose-400" : "text-[var(--text-muted)]"}>
                    {dp.redAlerts} red
                  </strong>
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Day x Hour Heatmap Grid */}
      <div className="space-y-2.5 bg-[var(--bg-surface)] p-4 rounded-xl border border-[var(--border-default)]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <span className="font-semibold text-[var(--text-primary)] uppercase tracking-wider text-[11px] font-mono">
            {isCombined ? "Combined Portfolio" : profile.branch} Day × Hour Prep Matrix (
            {slaLabel})
          </span>
          <div className="flex flex-wrap items-center gap-3 text-[11px] font-mono text-[var(--text-secondary)]">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-xs badge-emerald inline-block" />
              ≤{optimalCutoff}m Optimal
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-xs badge-blue inline-block" />
              {optimalCutoff}–{profile.slaTargetMin}m Within SLA
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-xs badge-amber inline-block" />
              SLA Breach ({isCombined ? ">12m KMG / >15m GRV" : `>${profile.slaTargetMin}m`})
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-xs badge-rose inline-block" />
              ≥20m Red Alert
            </span>
          </div>
        </div>

        <div className="overflow-x-auto pb-1">
          <div className="min-w-[820px] space-y-1.5">
            <div className="grid grid-cols-[56px_repeat(16,minmax(0,1fr))] gap-1 text-[10px] font-mono text-[var(--text-secondary)] text-center">
              <div className="text-left pl-1 font-semibold text-[var(--text-muted)]">DAY</div>
              {DISPLAY_HOURS.map((hr) => {
                const isRushHr = (hr >= 11 && hr <= 13) || (hr >= 18 && hr <= 20);
                return (
                  <div
                    key={hr}
                    className={`py-1 rounded ${
                      isRushHr ? "badge-amber font-semibold" : ""
                    }`}
                  >
                    {String(hr).padStart(2, "0")}h
                  </div>
                );
              })}
            </div>

            {DISPLAY_DAYS.map((d) => (
              <div
                key={d.dow}
                className="grid grid-cols-[56px_repeat(16,minmax(0,1fr))] gap-1 items-center"
              >
                <div className="text-xs font-mono font-semibold text-[var(--text-primary)] pl-1">
                  {d.label}
                </div>
                {DISPLAY_HOURS.map((hr) => {
                  const cell = cellMap.get(`${d.dow}-${hr}`);
                  const styleClass = getBranchCellStyle(cell, profile.slaTargetMin);
                  const hasKpt = cell && cell.kptSampleCount > 0;
                  const hasOrdersOnly = cell && cell.orderCount > 0 && cell.kptSampleCount === 0;

                  return (
                    <div
                      key={hr}
                      title={
                        cell
                          ? `${profile.branch} · ${d.label} ${String(hr).padStart(2, "0")}:00 — ${cell.orderCount} orders (${cell.kptSampleCount} with KPT) · Avg Prep: ${cell.avgPrepTimeMin}m · Breaches: ${cell.slaBreaches} · Red Alerts: ${cell.redAlerts}`
                          : `${profile.branch} · ${d.label} ${String(hr).padStart(2, "0")}:00 — 0 orders`
                      }
                      className={`h-11 rounded-lg border px-1 flex flex-col items-center justify-center font-mono transition-colors ${styleClass}`}
                    >
                      {hasKpt ? (
                        <>
                          <span className="text-[11px] font-bold leading-none tabular-nums">
                            {cell.avgPrepTimeMin}m
                          </span>
                          <span className="text-[9px] opacity-80 leading-none mt-1 tabular-nums">
                            {cell.orderCount}o{cell.slaBreaches > 0 ? `·${cell.slaBreaches}!` : ""}
                          </span>
                        </>
                      ) : hasOrdersOnly ? (
                        <>
                          <span className="text-[10px] font-semibold leading-none">
                            POS
                          </span>
                          <span className="text-[9px] opacity-75 leading-none mt-1">
                            {cell.orderCount}o
                          </span>
                        </>
                      ) : (
                        <span className="text-[10px] opacity-40">·</span>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Worst Breach Tickets */}
      <div className="space-y-2.5 pt-2 border-t border-[var(--border-default)]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
            <h4 className="text-xs font-semibold text-[var(--text-primary)] uppercase tracking-wider font-mono">
              {isCombined
                ? "Combined Worst SLA Breach Tickets (Kemang >12m · Greenville >15m)"
                : `${profile.branch} Worst SLA Breach Tickets (>${profile.slaTargetMin}m)`}
            </h4>
          </div>
          <span className="text-[11px] font-mono text-[var(--text-muted)]">
            Basket composition & prep overage audit
          </span>
        </div>

        {profile.topBreachTickets.length === 0 ? (
          <div className="p-4 rounded-xl badge-emerald flex items-center justify-center gap-2 text-xs font-mono">
            <CheckCircle2 className="w-4 h-4" />
            <span>
              Zero SLA breach tickets recorded in{" "}
              {isCombined ? "Both Kitchens" : `${profile.branch} Kitchen`}.
            </span>
          </div>
        ) : (
          <div className="overflow-x-auto border border-[var(--border-default)] rounded-xl bg-[var(--bg-surface)]">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[var(--border-default)] bg-[var(--bg-surface-2)] text-[var(--text-secondary)] uppercase font-semibold tracking-wider text-[11px]">
                  <th className="py-2.5 px-3">Timestamp &amp; Ticket</th>
                  {showBrandColumn && <th className="py-2.5 px-3">Brand</th>}
                  {isCombined && <th className="py-2.5 px-3">Kitchen Branch</th>}
                  <th className="py-2.5 px-3">Channel</th>
                  <th className="py-2.5 px-3 text-right">Prep vs SLA</th>
                  <th className="py-2.5 px-3 text-right">Basket Size</th>
                  <th className="py-2.5 px-3">Basket SKU Composition</th>
                  <th className="py-2.5 px-3 text-right">Ticket GMV</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-subtle)]">
                {profile.topBreachTickets.map((t, idx) => (
                  <tr key={t.order_id + "-" + idx} className="hover:bg-[var(--bg-surface-2)]/60 transition-colors">
                    <td className="py-2.5 px-3 font-mono">
                      <div className="text-[var(--text-primary)] font-semibold">{t.created_at_formatted}</div>
                      <div className="text-[11px] text-[var(--text-muted)] truncate max-w-[130px]" title={t.order_id}>
                        #{t.order_id}
                      </div>
                    </td>
                    {showBrandColumn && (
                      <td className="py-2.5 px-3 font-semibold text-[var(--text-primary)]">
                        {t.brand}
                      </td>
                    )}
                    {isCombined && (
                      <td className="py-2.5 px-3 font-mono text-xs">
                        <span
                          className={`inline-block w-1.5 h-1.5 rounded-full mr-1.5 ${
                            t.branch === "Kemang" ? "bg-purple-500" : "bg-emerald-500"
                          }`}
                        />
                        <span className="text-[var(--text-primary)]">{t.branch}</span>
                        <span className="text-[var(--text-muted)] text-[10px] ml-1">
                          (≤{t.sla_target_min}m)
                        </span>
                      </td>
                    )}
                    <td className="py-2.5 px-3 font-mono text-xs text-[var(--text-secondary)]">
                      {t.provider}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums">
                      <div className="flex items-center justify-end gap-1.5">
                        <span
                          className={`font-bold text-sm ${
                            t.is_red_alert
                              ? "text-rose-600 dark:text-rose-400"
                              : "text-amber-600 dark:text-amber-400"
                          }`}
                        >
                          {t.prep_time_minutes}m
                        </span>
                        {t.is_red_alert && (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold badge-rose">
                            <Flame className="w-2.5 h-2.5" />
                            RED
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-[var(--text-muted)]">
                        +{t.overage_minutes}m over {t.sla_target_min}m
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded badge-neutral text-[var(--text-primary)]">
                        <Layers className="w-3 h-3 text-[var(--accent-primary)]" />
                        {t.total_units > 0 ? `${t.total_units}u (${t.distinct_skus} SKU)` : "—"}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-[var(--text-secondary)] max-w-md">
                      <div className="line-clamp-2 text-xs font-mono leading-relaxed" title={t.basket_summary}>
                        {t.basket_summary}
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-emerald-600 dark:text-emerald-400 font-semibold tabular-nums">
                      {formatRupiah(t.gross_amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export function KitchenSlaHeatmap({
  diagnostic,
  title = "Kitchen Prep SLA Heatmap & Bottleneck Inspector",
  subtitle = "Unified or branch-isolated physical kitchen telemetry: Kemang Cloud Kitchen (≤12.0m SLA) & Greenville Flagship Kitchen (≤15.0m SLA)",
  showBrandColumn = true,
}: KitchenSlaHeatmapProps) {
  const { combined, kemang, greenville, activeBranchFilter } = diagnostic;

  const defaultTab: "combined" | "kemang" | "greenville" =
    activeBranchFilter === "kemang"
      ? "kemang"
      : activeBranchFilter === "greenville"
      ? "greenville"
      : "combined";

  const [selectedKitchen, setSelectedKitchen] = useState<
    "combined" | "kemang" | "greenville"
  >(defaultTab);

  const activeProfile =
    selectedKitchen === "kemang"
      ? kemang
      : selectedKitchen === "greenville"
      ? greenville
      : combined;

  return (
    <div className="cockpit-panel rounded-2xl p-5 sm:p-6 space-y-6">
      {/* Top Header & Kitchen Line Selector */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-[var(--border-default)] pb-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Clock className="w-4 h-4 text-amber-500" />
            <h2 className="text-base font-semibold text-[var(--text-primary)] tracking-tight">{title}</h2>
            <span className="text-xs font-mono px-2 py-0.5 rounded badge-amber font-semibold">
              Kemang ≤12m · Greenville ≤15m
            </span>
          </div>
          <p className="text-xs text-[var(--text-secondary)] mt-1">{subtitle}</p>
        </div>

        {/* Interactive Kitchen Line Switcher */}
        <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-[var(--bg-surface-2)] border border-[var(--border-default)] self-start lg:self-auto">
          <button
            type="button"
            onClick={() => setSelectedKitchen("combined")}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all cursor-pointer ${
              selectedKitchen === "combined"
                ? "bg-[var(--bg-surface)] text-[var(--text-primary)] border border-[var(--border-default)] shadow-2xs"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            Both Kitchens
          </button>
          <button
            type="button"
            onClick={() => setSelectedKitchen("kemang")}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              selectedKitchen === "kemang"
                ? "badge-purple shadow-2xs"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
            Kemang (≤12m)
          </button>
          <button
            type="button"
            onClick={() => setSelectedKitchen("greenville")}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              selectedKitchen === "greenville"
                ? "badge-emerald shadow-2xs"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Greenville (≤15m)
          </button>
        </div>
      </div>

      {/* Side-by-Side Kitchen Line Summary Comparison Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[kemang, greenville].map((k) => {
          const isK = k.branch === "Kemang";
          const targetTab = isK ? "kemang" : "greenville";
          const isSelected =
            selectedKitchen === "combined" || selectedKitchen === targetTab;
          return (
            <div
              key={k.branch}
              onClick={() =>
                setSelectedKitchen(
                  selectedKitchen === targetTab ? "combined" : targetTab
                )
              }
              className={`rounded-xl p-4 border transition-all cursor-pointer flex flex-col justify-between space-y-3 ${
                isSelected
                  ? "bg-[var(--bg-surface-2)] border-[var(--border-strong)] shadow-2xs"
                  : "bg-[var(--bg-surface-2)]/50 border-[var(--border-subtle)] opacity-65 hover:opacity-100"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span
                    className={`w-2.5 h-2.5 rounded-full ${
                      isK ? "bg-purple-500" : "bg-emerald-500"
                    }`}
                  />
                  <span className="text-sm font-bold text-[var(--text-primary)]">
                    {k.branch} Kitchen
                  </span>
                  <span className="text-xs font-mono text-[var(--text-muted)]">
                    ({k.kitchenType})
                  </span>
                </div>
                <span
                  className={`text-xs font-mono px-2 py-0.5 rounded font-semibold ${
                    isK ? "badge-purple" : "badge-emerald"
                  }`}
                >
                  Target ≤{k.slaTargetMin}m
                </span>
              </div>

              <div className="grid grid-cols-4 gap-2 text-xs font-mono pt-2 border-t border-[var(--border-subtle)]">
                <div>
                  <span className="text-[10px] text-[var(--text-muted)] block uppercase">Mean / P90</span>
                  <span className="text-[var(--text-primary)] font-bold tabular-nums">
                    {k.avgPrepTimeMin > 0 ? `${k.avgPrepTimeMin}m` : "—"}
                  </span>
                  <span className="text-[var(--text-muted)] text-[11px]">
                    {" "}/ {k.p90PrepTimeMin > 0 ? `${k.p90PrepTimeMin}m` : "—"}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-[var(--text-muted)] block uppercase">
                    Breaches (&gt;{k.slaTargetMin}m)
                  </span>
                  <span
                    className={`font-bold tabular-nums ${
                      k.totalBreaches > 0
                        ? "text-amber-600 dark:text-amber-400"
                        : "text-emerald-600 dark:text-emerald-400"
                    }`}
                  >
                    {k.totalBreaches} ({k.breachRatePct}%)
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-[var(--text-muted)] block uppercase">
                    Red Alerts (&gt;20m)
                  </span>
                  <span
                    className={`font-bold tabular-nums ${
                      k.totalRedAlerts > 0
                        ? "text-rose-600 dark:text-rose-400"
                        : "text-[var(--text-secondary)]"
                    }`}
                  >
                    {k.totalRedAlerts}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-[var(--text-muted)] block uppercase">
                    Worst Window
                  </span>
                  <span className="text-[var(--text-primary)] font-semibold truncate block">
                    {k.worstDayHourPrepMin > 0
                      ? `${k.worstDayHourLabel} (${k.worstDayHourPrepMin}m)`
                      : "—"}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Single Active Kitchen Matrix (Combined, Kemang, or Greenville) */}
      <SingleKitchenMatrix
        profile={activeProfile}
        showBrandColumn={showBrandColumn}
      />
    </div>
  );
}
