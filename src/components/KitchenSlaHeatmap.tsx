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
    return "bg-black/20 border-white/[0.04] text-zinc-600";
  }
  if (cell.kptSampleCount === 0) {
    return "bg-white/[0.03] border-white/[0.07] text-zinc-400";
  }
  if (cell.redAlerts > 0 || cell.avgPrepTimeMin >= 20.0) {
    return "bg-rose-950/75 border-rose-700/60 text-rose-200";
  }
  if (cell.slaBreaches > 0 || cell.avgPrepTimeMin > slaTargetMin) {
    return "bg-amber-950/70 border-amber-700/50 text-amber-200";
  }
  if (cell.avgPrepTimeMin > slaTargetMin * 0.8) {
    return "bg-blue-950/50 border-blue-800/40 text-blue-200";
  }
  return "bg-emerald-950/55 border-emerald-800/45 text-emerald-200";
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

  const isKemang = profile.branch === "Kemang";
  const optimalCutoff = Number((profile.slaTargetMin * 0.8).toFixed(1));

  if (profile.totalOrders === 0) {
    return (
      <div className="rounded-xl p-6 bg-black/25 border border-white/[0.06] text-center text-xs font-mono text-zinc-500">
        No orders recorded for <strong className="text-zinc-300">{profile.branch} Kitchen</strong> in the selected filter window.
      </div>
    );
  }

  return (
    <div
      className={`rounded-2xl p-4 sm:p-5 bg-black/25 border space-y-5 ${
        isKemang ? "border-purple-500/25" : "border-emerald-500/25"
      }`}
    >
      {/* Kitchen Sub-Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-white/[0.07] pb-3.5">
        <div className="flex items-center gap-3">
          <div
            className={`p-2 rounded-xl border ${
              isKemang
                ? "bg-purple-500/10 text-purple-400 border-purple-500/25"
                : "bg-emerald-500/10 text-emerald-400 border-emerald-500/25"
            }`}
          >
            <Building2 className="w-4 h-4" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm sm:text-base font-bold text-white">
                {profile.branch} Kitchen Line
              </h3>
              <span
                className={`text-[11px] font-mono px-2 py-0.5 rounded border font-semibold ${
                  isKemang
                    ? "bg-purple-950/60 text-purple-300 border-purple-800/50"
                    : "bg-emerald-950/60 text-emerald-300 border-emerald-800/50"
                }`}
              >
                SLA Target ≤{profile.slaTargetMin}m
              </span>
              <span className="text-xs text-zinc-400 font-mono">
                {profile.kitchenType}
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5 font-mono">
              {profile.totalOrders.toLocaleString()} total orders · {profile.totalKptOrders.toLocaleString()} KPT-tracked delivery tickets
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
          <div className="px-2.5 py-1 rounded-lg bg-white/[0.03] border border-white/[0.07]">
            <span className="text-zinc-400">Mean / P90: </span>
            <strong className="text-white">{profile.avgPrepTimeMin}m</strong>
            <span className="text-zinc-500"> / </span>
            <strong className="text-amber-300">{profile.p90PrepTimeMin}m</strong>
          </div>
          <div className="px-2.5 py-1 rounded-lg bg-white/[0.03] border border-white/[0.07]">
            <span className="text-zinc-400">Breaches (&gt;{profile.slaTargetMin}m): </span>
            <strong className={profile.totalBreaches > 0 ? "text-amber-300" : "text-emerald-300"}>
              {profile.totalBreaches} ({profile.breachRatePct}%)
            </strong>
          </div>
          <div className="px-2.5 py-1 rounded-lg bg-rose-950/40 border border-rose-800/40">
            <span className="text-rose-300">Red (&gt;20m): </span>
            <strong className="text-rose-200">{profile.totalRedAlerts}</strong>
          </div>
          {profile.worstDayHourPrepMin > 0 && (
            <div className="px-2.5 py-1 rounded-lg bg-amber-950/40 border border-amber-800/40">
              <span className="text-amber-300">Peak Bottleneck: </span>
              <strong className="text-white">
                {profile.worstDayHourLabel} ({profile.worstDayHourPrepMin}m)
              </strong>
            </div>
          )}
        </div>
      </div>

      {/* 5-Daypart Throughput & SLA Comparison Cards for this Kitchen */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
        {profile.dayparts.map((dp) => {
          const isRush = dp.daypart.includes("Rush");
          return (
            <div
              key={dp.daypart}
              className={`rounded-xl p-3 border flex flex-col justify-between space-y-2 ${
                isRush
                  ? "bg-white/[0.03] border-amber-500/25"
                  : "bg-black/30 border-white/[0.06]"
              }`}
            >
              <div className="flex items-center justify-between gap-1">
                <span className="text-xs font-semibold text-white">{dp.daypart}</span>
                {isRush && (
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30">
                    RUSH
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2 font-mono text-xs pt-1 border-t border-white/[0.05]">
                <div>
                  <span className="text-[10px] text-zinc-500 block uppercase">Avg Prep</span>
                  <span
                    className={`font-bold text-sm tabular-nums ${
                      dp.avgPrepTimeMin > profile.slaTargetMin
                        ? "text-amber-300"
                        : dp.avgPrepTimeMin > 0
                        ? "text-emerald-300"
                        : "text-zinc-500"
                    }`}
                  >
                    {dp.avgPrepTimeMin > 0 ? `${dp.avgPrepTimeMin}m` : "—"}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-zinc-500 block uppercase">Breach Rate</span>
                  <span
                    className={`font-bold text-sm tabular-nums ${
                      dp.breachRatePct >= 15
                        ? "text-rose-400"
                        : dp.breachRatePct > 0
                        ? "text-amber-300"
                        : "text-zinc-400"
                    }`}
                  >
                    {dp.breachRatePct}%
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400 pt-1 border-t border-white/[0.04]">
                <span>{dp.orderCount.toLocaleString()} orders</span>
                <span>
                  {dp.slaBreaches} breach ·{" "}
                  <strong className={dp.redAlerts > 0 ? "text-rose-400" : "text-zinc-500"}>
                    {dp.redAlerts} red
                  </strong>
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Day x Hour Heatmap Grid for this Kitchen */}
      <div className="space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <span className="font-semibold text-zinc-300 uppercase tracking-wider text-[11px] font-mono">
            {profile.branch} Day × Hour Prep Matrix (SLA ≤{profile.slaTargetMin}m)
          </span>
          <div className="flex flex-wrap items-center gap-3 text-[11px] font-mono text-zinc-400">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-emerald-950/80 border border-emerald-700/60 inline-block" />
              ≤{optimalCutoff}m Optimal
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-blue-950/80 border border-blue-700/60 inline-block" />
              {optimalCutoff}–{profile.slaTargetMin}m Within SLA
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-amber-950/80 border border-amber-700/60 inline-block" />
              &gt;{profile.slaTargetMin}m SLA Breach
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-rose-950/80 border border-rose-700/60 inline-block" />
              ≥20m Red Alert
            </span>
          </div>
        </div>

        <div className="overflow-x-auto pb-1">
          <div className="min-w-[820px] space-y-1.5">
            <div className="grid grid-cols-[56px_repeat(16,minmax(0,1fr))] gap-1 text-[10px] font-mono text-zinc-400 text-center">
              <div className="text-left pl-1 font-semibold text-zinc-500">DAY</div>
              {DISPLAY_HOURS.map((hr) => {
                const isRushHr = (hr >= 11 && hr <= 13) || (hr >= 18 && hr <= 20);
                return (
                  <div
                    key={hr}
                    className={`py-1 rounded ${
                      isRushHr ? "bg-amber-500/10 text-amber-300 font-semibold" : ""
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
                <div className="text-xs font-mono font-semibold text-zinc-300 pl-1">
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
                          ? `${profile.branch} · ${d.label} ${String(hr).padStart(2, "0")}:00 — ${cell.orderCount} orders (${cell.kptSampleCount} with KPT) · Avg Prep: ${cell.avgPrepTimeMin}m (SLA ≤${profile.slaTargetMin}m) · Breaches: ${cell.slaBreaches} · Red Alerts: ${cell.redAlerts}`
                          : `${profile.branch} · ${d.label} ${String(hr).padStart(2, "0")}:00 — 0 orders`
                      }
                      className={`h-11 rounded-lg border px-1 flex flex-col items-center justify-center font-mono transition-colors ${styleClass}`}
                    >
                      {hasKpt ? (
                        <>
                          <span className="text-[11px] font-bold leading-none tabular-nums">
                            {cell.avgPrepTimeMin}m
                          </span>
                          <span className="text-[9px] opacity-75 leading-none mt-1 tabular-nums">
                            {cell.orderCount}o{cell.slaBreaches > 0 ? `·${cell.slaBreaches}!` : ""}
                          </span>
                        </>
                      ) : hasOrdersOnly ? (
                        <>
                          <span className="text-[10px] font-medium leading-none text-zinc-300">
                            POS
                          </span>
                          <span className="text-[9px] text-zinc-500 leading-none mt-1">
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

      {/* Worst Breach Tickets for this Kitchen */}
      <div className="space-y-2.5 pt-2 border-t border-white/[0.07]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
            <h4 className="text-xs font-semibold text-white uppercase tracking-wider font-mono">
              {profile.branch} Worst SLA Breach Tickets (&gt;{profile.slaTargetMin}m)
            </h4>
          </div>
          <span className="text-[11px] font-mono text-zinc-400">
            Joined with <code className="text-zinc-300">fact_order_items</code> basket composition
          </span>
        </div>

        {profile.topBreachTickets.length === 0 ? (
          <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-800/30 flex items-center justify-center gap-2 text-xs text-emerald-300 font-mono">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Zero SLA breach tickets (&gt;{profile.slaTargetMin}m) in {profile.branch} Kitchen.</span>
          </div>
        ) : (
          <div className="overflow-x-auto border border-white/[0.08] rounded-xl">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/[0.08] bg-white/[0.02] text-zinc-400 uppercase font-semibold tracking-wider text-[11px]">
                  <th className="py-2.5 px-3">Timestamp &amp; Ticket</th>
                  {showBrandColumn && <th className="py-2.5 px-3">Brand</th>}
                  <th className="py-2.5 px-3">Channel</th>
                  <th className="py-2.5 px-3 text-right">Prep vs {profile.slaTargetMin}m SLA</th>
                  <th className="py-2.5 px-3 text-right">Basket Size</th>
                  <th className="py-2.5 px-3">Basket SKU Composition</th>
                  <th className="py-2.5 px-3 text-right">Ticket GMV</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {profile.topBreachTickets.map((t, idx) => (
                  <tr key={t.order_id + "-" + idx} className="hover:bg-white/[0.03] transition-colors">
                    <td className="py-2.5 px-3 font-mono">
                      <div className="text-white font-semibold">{t.created_at_formatted}</div>
                      <div className="text-[11px] text-zinc-500 truncate max-w-[130px]" title={t.order_id}>
                        #{t.order_id}
                      </div>
                    </td>
                    {showBrandColumn && (
                      <td className="py-2.5 px-3 font-semibold text-white">
                        {t.brand}
                      </td>
                    )}
                    <td className="py-2.5 px-3 font-mono text-xs text-zinc-300">
                      {t.provider}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums">
                      <div className="flex items-center justify-end gap-1.5">
                        <span
                          className={`font-bold text-sm ${
                            t.is_red_alert ? "text-rose-400" : "text-amber-300"
                          }`}
                        >
                          {t.prep_time_minutes}m
                        </span>
                        {t.is_red_alert && (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-950/80 text-rose-300 border border-rose-700/60">
                            <Flame className="w-2.5 h-2.5" />
                            RED
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-zinc-500">
                        +{t.overage_minutes}m over {t.sla_target_min}m
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white/[0.04] border border-white/[0.08] text-zinc-200">
                        <Layers className="w-3 h-3 text-blue-400" />
                        {t.total_units > 0 ? `${t.total_units}u (${t.distinct_skus} SKU)` : "—"}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-zinc-300 max-w-md">
                      <div className="line-clamp-2 text-xs font-mono leading-relaxed" title={t.basket_summary}>
                        {t.basket_summary}
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-emerald-400 font-semibold tabular-nums">
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
  title = "Branch-Separated Kitchen SLA Heatmap & Bottleneck Inspector",
  subtitle = "Isolated physical kitchen telemetry: Kemang Cloud Kitchen (≤12.0m SLA) vs Greenville Flagship Kitchen (≤15.0m SLA)",
  showBrandColumn = true,
}: KitchenSlaHeatmapProps) {
  const { kemang, greenville, activeBranchFilter } = diagnostic;

  const defaultTab: "split" | "kemang" | "greenville" =
    activeBranchFilter === "kemang"
      ? "kemang"
      : activeBranchFilter === "greenville"
      ? "greenville"
      : kemang.totalOrders > 0 && greenville.totalOrders > 0
      ? "split"
      : kemang.totalOrders > 0
      ? "kemang"
      : "greenville";

  const [selectedKitchen, setSelectedKitchen] = useState<"split" | "kemang" | "greenville">(
    defaultTab
  );

  return (
    <div className="cockpit-panel rounded-2xl p-5 sm:p-6 space-y-6">
      {/* Top Header & Kitchen Line Selector */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-white/[0.08] pb-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Clock className="w-4 h-4 text-amber-400" />
            <h2 className="text-base font-semibold text-white tracking-tight">{title}</h2>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-amber-950/60 text-amber-300 border border-amber-800/40">
              Kemang ≤12m · Greenville ≤15m
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-1">{subtitle}</p>
        </div>

        {/* Interactive Kitchen Line Switcher */}
        <div className="inline-flex items-center gap-1.5 p-1 rounded-xl bg-black/40 border border-white/[0.08] self-start lg:self-auto">
          <button
            type="button"
            onClick={() => setSelectedKitchen("split")}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-colors cursor-pointer ${
              selectedKitchen === "split"
                ? "bg-white/[0.12] text-white border border-white/[0.15]"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Both Kitchens (Separated)
          </button>
          <button
            type="button"
            onClick={() => setSelectedKitchen("kemang")}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
              selectedKitchen === "kemang"
                ? "bg-purple-950/80 text-purple-200 border border-purple-700/60"
                : "text-zinc-400 hover:text-purple-300"
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
            Kemang (≤12m)
          </button>
          <button
            type="button"
            onClick={() => setSelectedKitchen("greenville")}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
              selectedKitchen === "greenville"
                ? "bg-emerald-950/80 text-emerald-200 border border-emerald-700/60"
                : "text-zinc-400 hover:text-emerald-300"
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            Greenville (≤15m)
          </button>
        </div>
      </div>

      {/* Side-by-Side Kitchen Line Summary Comparison Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[kemang, greenville].map((k) => {
          const isK = k.branch === "Kemang";
          const isSelected =
            selectedKitchen === "split" ||
            selectedKitchen === k.branch.toLowerCase();
          return (
            <div
              key={k.branch}
              onClick={() =>
                setSelectedKitchen(k.branch.toLowerCase() as "kemang" | "greenville")
              }
              className={`rounded-xl p-4 border transition-colors cursor-pointer flex flex-col justify-between space-y-3 ${
                isK
                  ? isSelected
                    ? "bg-purple-950/15 border-purple-500/30 hover:border-purple-400/50"
                    : "bg-black/20 border-white/[0.05] opacity-60 hover:opacity-100"
                  : isSelected
                  ? "bg-emerald-950/15 border-emerald-500/30 hover:border-emerald-400/50"
                  : "bg-black/20 border-white/[0.05] opacity-60 hover:opacity-100"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span
                    className={`w-2.5 h-2.5 rounded-full ${
                      isK ? "bg-purple-400" : "bg-emerald-400"
                    }`}
                  />
                  <span className="text-sm font-bold text-white">
                    {k.branch} Kitchen
                  </span>
                  <span className="text-xs font-mono text-zinc-400">
                    ({k.kitchenType})
                  </span>
                </div>
                <span
                  className={`text-xs font-mono px-2 py-0.5 rounded border font-semibold ${
                    isK
                      ? "bg-purple-950/70 text-purple-300 border-purple-800/50"
                      : "bg-emerald-950/70 text-emerald-300 border-emerald-800/50"
                  }`}
                >
                  Target ≤{k.slaTargetMin}m
                </span>
              </div>

              <div className="grid grid-cols-4 gap-2 text-xs font-mono pt-2 border-t border-white/[0.06]">
                <div>
                  <span className="text-[10px] text-zinc-500 block uppercase">Mean / P90</span>
                  <span className="text-white font-bold tabular-nums">
                    {k.avgPrepTimeMin > 0 ? `${k.avgPrepTimeMin}m` : "—"}
                  </span>
                  <span className="text-zinc-500 text-[11px]">
                    {" "}/ {k.p90PrepTimeMin > 0 ? `${k.p90PrepTimeMin}m` : "—"}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-500 block uppercase">
                    Breaches (&gt;{k.slaTargetMin}m)
                  </span>
                  <span
                    className={`font-bold tabular-nums ${
                      k.totalBreaches > 0 ? "text-amber-300" : "text-emerald-400"
                    }`}
                  >
                    {k.totalBreaches} ({k.breachRatePct}%)
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-500 block uppercase">
                    Red Alerts (&gt;20m)
                  </span>
                  <span
                    className={`font-bold tabular-nums ${
                      k.totalRedAlerts > 0 ? "text-rose-400" : "text-zinc-400"
                    }`}
                  >
                    {k.totalRedAlerts}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-500 block uppercase">
                    Worst Window
                  </span>
                  <span className="text-zinc-200 font-semibold truncate block">
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

      {/* Separated Kitchen Matrices */}
      <div className="space-y-6">
        {(selectedKitchen === "split" || selectedKitchen === "kemang") && (
          <SingleKitchenMatrix
            profile={kemang}
            showBrandColumn={showBrandColumn}
          />
        )}
        {(selectedKitchen === "split" || selectedKitchen === "greenville") && (
          <SingleKitchenMatrix
            profile={greenville}
            showBrandColumn={showBrandColumn}
          />
        )}
      </div>
    </div>
  );
}
