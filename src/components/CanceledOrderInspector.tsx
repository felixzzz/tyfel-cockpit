"use client";

import React, { useState } from "react";
import type {
  CanceledOrdersDiagnostic,
  BranchCancellationProfile,
} from "@/lib/queries";
import {
  Ban,
  AlertOctagon,
  Clock,
  Flame,
  Store,
  Building2,
  Layers,
  ShieldAlert,
  Receipt,
  CheckCircle2,
} from "lucide-react";

interface CanceledOrderInspectorProps {
  diagnostic: CanceledOrdersDiagnostic;
  title?: string;
  subtitle?: string;
}

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
}

type TicketFilterMode = "all" | "post_prep" | "early_morning" | "gofood" | "grabfood";

function SingleBranchCancellationView({
  profile,
  showBrandBreakdown = true,
}: {
  profile: BranchCancellationProfile;
  showBrandBreakdown?: boolean;
}) {
  const [ticketFilter, setTicketFilter] = useState<TicketFilterMode>("all");

  const isCombined = profile.branch === "Combined";
  const isKemang = profile.branch === "Kemang";

  const filteredTickets = profile.tickets.filter((t) => {
    if (ticketFilter === "post_prep") return t.prep_stage === "Post-Prep Food Waste";
    if (ticketFilter === "early_morning") return t.hour_of_day >= 6 && t.hour_of_day <= 8;
    if (ticketFilter === "gofood") return t.provider.toLowerCase().includes("go");
    if (ticketFilter === "grabfood") return t.provider.toLowerCase().includes("grab");
    return true;
  });

  const earlySharePct =
    profile.lostGrossGmv > 0
      ? Number(((profile.earlyOpeningLostGmv / profile.lostGrossGmv) * 100).toFixed(1))
      : 0;

  return (
    <div className="rounded-xl surface-well p-4 sm:p-5 space-y-5">
      {/* Branch Header Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-[var(--border-default)]">
        <div className="flex items-start gap-3">
          <div
            className={`p-2.5 rounded-xl ${
              isCombined
                ? "badge-rose"
                : isKemang
                ? "badge-amber"
                : "badge-blue"
            }`}
          >
            {isCombined ? (
              <Layers className="w-5 h-5" />
            ) : isKemang ? (
              <Flame className="w-5 h-5" />
            ) : (
              <Building2 className="w-5 h-5" />
            )}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h4 className="text-base font-bold text-[var(--text-primary)] tracking-tight">
                {isCombined
                  ? "Both Kitchens Combined (Kemang + Greenville)"
                  : `${profile.branch} Kitchen Cancellation Profile`}
              </h4>
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded font-semibold badge-rose">
                {profile.cancelledOrders} Cancelled ({profile.cancellationRatePct}% Rate)
              </span>
              {profile.postPrepWasteOrders > 0 && (
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded font-semibold badge-amber">
                  {profile.postPrepWasteOrders} Cooked Waste Risk
                </span>
              )}
            </div>
            <p className="text-xs text-[var(--text-secondary)] mt-1">
              {isCombined
                ? "Aggregated delivery cancellation audit across Greenville & Kemang: separates pre-prep unaccepted orders (opening hour gaps) from post-prep cooked food waste."
                : isKemang
                ? "Kemang Cloud Kitchen (Delivery-Only): tracks GrabFood & GoFood order cancellations, morning opening sync, and kitchen prep timeouts."
                : "Greenville Flagship Kitchen: tracks aggregator delivery cancellations, early-morning store closed rejects, and post-prep customer/driver walkouts."}
            </p>
          </div>
        </div>

        {/* 4 Summary Pills */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 shrink-0">
          <div className="px-3 py-2 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-default)]">
            <p className="text-[10px] font-mono uppercase text-[var(--text-muted)]">Cancel Rate</p>
            <p
              className={`text-sm font-bold font-mono mt-0.5 ${
                profile.cancellationRatePct > 1.5
                  ? "text-rose-600 dark:text-rose-400"
                  : profile.cancellationRatePct > 0.5
                  ? "text-amber-600 dark:text-amber-400"
                  : "text-emerald-600 dark:text-emerald-400"
              }`}
            >
              {profile.cancellationRatePct}%
            </p>
            <p className="text-[10px] font-mono text-[var(--text-muted)]">
              {profile.cancelledOrders} of {profile.completedOrders + profile.cancelledOrders}
            </p>
          </div>

          <div className="px-3 py-2 rounded-lg bg-[var(--bg-surface)] border border-[var(--status-rose-border)]">
            <p className="text-[10px] font-mono uppercase text-rose-600 dark:text-rose-400">Lost Gross GMV</p>
            <p className="text-sm font-bold font-mono text-rose-600 dark:text-rose-400 mt-0.5">
              {formatRupiah(profile.lostGrossGmv)}
            </p>
            <p className="text-[10px] font-mono text-[var(--text-muted)]">
              Net: {formatRupiah(profile.lostNetPayout)}
            </p>
          </div>

          <div className="px-3 py-2 rounded-lg bg-[var(--bg-surface)] border border-[var(--status-amber-border)]">
            <p className="text-[10px] font-mono uppercase text-amber-600 dark:text-amber-400">Post-Prep Waste</p>
            <p className="text-sm font-bold font-mono text-amber-600 dark:text-amber-400 mt-0.5">
              {profile.postPrepWasteOrders} orders
            </p>
            <p className="text-[10px] font-mono text-[var(--text-muted)]">
              {formatRupiah(profile.postPrepWasteGrossGmv)} cooked
            </p>
          </div>

          <div className="px-3 py-2 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-default)]">
            <p className="text-[10px] font-mono uppercase text-[var(--text-muted)]">06–08 WIB Gap</p>
            <p className="text-sm font-bold font-mono text-[var(--text-primary)] mt-0.5">
              {profile.earlyOpeningCancels} orders ({earlySharePct}%)
            </p>
            <p className="text-[10px] font-mono text-[var(--text-muted)]">
              {formatRupiah(profile.earlyOpeningLostGmv)} lost
            </p>
          </div>
        </div>
      </div>

      {/* Diagnostic Grid: Root Causes + Time Windows + Brand Exposure */}
      <div
        className={`grid grid-cols-1 ${
          showBrandBreakdown ? "xl:grid-cols-3" : "xl:grid-cols-2"
        } gap-4`}
      >
        {/* 1. Root Cause & SOP Action Playbook */}
        <div className="rounded-xl bg-[var(--bg-surface)] border border-[var(--border-default)] p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h5 className="text-xs font-mono uppercase tracking-wider text-[var(--text-primary)] font-semibold flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-rose-500" />
              <span>Root Cause & SOP Playbook</span>
            </h5>
            <span className="text-[10px] font-mono text-[var(--text-muted)]">
              GoFood: {profile.gofoodCancels} · GrabFood: {profile.grabfoodCancels}
            </span>
          </div>

          {profile.reasons.length === 0 ? (
            <div className="py-6 text-center text-xs text-emerald-600 dark:text-emerald-400 font-mono">
              Zero cancellations recorded in this window.
            </div>
          ) : (
            <div className="space-y-2.5">
              {profile.reasons.map((r) => (
                <div
                  key={`${r.reason_code}-${r.reason_label}`}
                  className="p-3 rounded-lg surface-well space-y-1.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-[var(--text-primary)]">{r.reason_label}</span>
                    <span className="text-xs font-mono font-bold text-rose-600 dark:text-rose-400">
                      {formatRupiah(r.lost_gross_gmv)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] font-mono text-[var(--text-secondary)]">
                    <span>
                      {r.order_count} {r.order_count === 1 ? "order" : "orders"} ({r.share_of_cancels_pct}%) · Code:{" "}
                      <span className="text-[var(--text-primary)]">{r.reason_code}</span>
                    </span>
                    <span>Net: {formatRupiah(r.lost_net_payout)}</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-[var(--border-default)] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-rose-500"
                      style={{ width: `${Math.min(100, Math.max(6, r.share_of_cancels_pct))}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-[var(--text-secondary)] pt-0.5 leading-relaxed">
                    <span className="font-mono uppercase text-[10px] text-[var(--accent-primary)] font-bold mr-1">
                      SOP Fix:
                    </span>
                    {r.operational_fix}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 2. Time-of-Day Leakage Windows */}
        <div className="rounded-xl bg-[var(--bg-surface)] border border-[var(--border-default)] p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h5 className="text-xs font-mono uppercase tracking-wider text-[var(--text-primary)] font-semibold flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-500" />
              <span>Daypart Leakage Windows (WIB)</span>
            </h5>
            <span className="text-[10px] font-mono text-[var(--text-muted)]">Shift Start: 07:30 WIB</span>
          </div>

          <div className="space-y-2.5">
            {profile.windows.map((w) => {
              const hasCancels = w.cancelled_orders > 0;
              return (
                <div
                  key={w.window_label}
                  className={`p-3 rounded-lg surface-well ${
                    hasCancels ? "" : "opacity-65"
                  } space-y-1.5`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-[var(--text-primary)]">{w.window_label}</span>
                    <span
                      className={`text-xs font-mono font-bold ${
                        hasCancels
                          ? "text-amber-600 dark:text-amber-400"
                          : "text-emerald-600 dark:text-emerald-400"
                      }`}
                    >
                      {hasCancels ? formatRupiah(w.lost_gross_gmv) : "Rp 0 (Clean)"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] font-mono text-[var(--text-secondary)]">
                    <span>
                      {w.cancelled_orders} cancelled{" "}
                      {w.cancelled_orders === 1 ? "ticket" : "tickets"}
                    </span>
                    <span>{w.share_of_lost_gmv_pct}% of lost GMV</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-[var(--border-default)] overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        w.share_of_lost_gmv_pct >= 35
                          ? "bg-rose-500"
                          : w.share_of_lost_gmv_pct > 0
                          ? "bg-amber-500"
                          : "bg-emerald-500"
                      }`}
                      style={{
                        width: `${hasCancels ? Math.min(100, Math.max(6, w.share_of_lost_gmv_pct)) : 0}%`,
                      }}
                    />
                  </div>
                  <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">{w.root_cause_note}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* 3. Brand Cancellation Exposure */}
        {showBrandBreakdown && (
          <div className="rounded-xl bg-[var(--bg-surface)] border border-[var(--border-default)] p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h5 className="text-xs font-mono uppercase tracking-wider text-[var(--text-primary)] font-semibold flex items-center gap-1.5">
                <Store className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
                <span>Brand Cancellation Exposure</span>
              </h5>
              <span className="text-[10px] font-mono text-[var(--text-muted)]">By Lost GMV</span>
            </div>

            <div className="space-y-2">
              {profile.brands.map((b) => {
                const hasCancel = b.cancelled_orders > 0;
                return (
                  <div
                    key={b.brand}
                    className="p-2.5 rounded-lg surface-well flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-[var(--text-primary)] truncate">
                          {b.brand}
                        </span>
                        {b.post_prep_waste_count > 0 && (
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded badge-amber">
                            {b.post_prep_waste_count} cooked waste
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] font-mono text-[var(--text-secondary)] mt-0.5">
                        {b.cancelled_orders} cancelled / {b.completed_orders + b.cancelled_orders} total (
                        <span
                          className={
                            b.cancellation_rate_pct > 1.0
                              ? "text-rose-600 dark:text-rose-400 font-semibold"
                              : b.cancellation_rate_pct > 0
                              ? "text-amber-600 dark:text-amber-400"
                              : "text-emerald-600 dark:text-emerald-400"
                          }
                        >
                          {b.cancellation_rate_pct}%
                        </span>
                        )
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p
                        className={`text-xs font-mono font-bold ${
                          hasCancel
                            ? "text-rose-600 dark:text-rose-400"
                            : "text-emerald-600 dark:text-emerald-400"
                        }`}
                      >
                        {hasCancel ? `-${formatRupiah(b.lost_gross_gmv)}` : "0 Lost"}
                      </p>
                      <p className="text-[10px] font-mono text-[var(--text-muted)]">
                        Net: {formatRupiah(b.lost_net_payout)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Cancelled Orders Ledger Table */}
      <div className="space-y-3 pt-1">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            <Receipt className="w-4 h-4 text-rose-500" />
            <h5 className="text-xs font-mono uppercase tracking-wider text-[var(--text-primary)] font-semibold">
              Cancelled Ticket Audit Ledger — {profile.branch} ({filteredTickets.length} of{" "}
              {profile.tickets.length} tickets)
            </h5>
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            {(
              [
                { id: "all", label: `All (${profile.tickets.length})` },
                {
                  id: "post_prep",
                  label: `Cooked Food Waste (${profile.postPrepWasteOrders})`,
                },
                {
                  id: "early_morning",
                  label: `06–08 WIB Opening (${profile.earlyOpeningCancels})`,
                },
                { id: "gofood", label: `GoFood (${profile.gofoodCancels})` },
                { id: "grabfood", label: `GrabFood (${profile.grabfoodCancels})` },
              ] as { id: TicketFilterMode; label: string }[]
            ).map((pill) => (
              <button
                key={pill.id}
                type="button"
                onClick={() => setTicketFilter(pill.id)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-mono transition-colors cursor-pointer ${
                  ticketFilter === pill.id
                    ? "badge-rose font-semibold"
                    : "bg-[var(--bg-surface)] text-[var(--text-secondary)] border border-[var(--border-default)] hover:text-[var(--text-primary)]"
                }`}
              >
                {pill.label}
              </button>
            ))}
          </div>
        </div>

        {filteredTickets.length === 0 ? (
          <div className="rounded-xl bg-[var(--bg-surface)] border border-[var(--border-default)] p-6 text-center text-xs font-mono text-emerald-600 dark:text-emerald-400 flex items-center justify-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>Zero cancelled tickets match this filter.</span>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)]">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[var(--border-default)] text-[10px] font-mono uppercase text-[var(--text-secondary)] bg-[var(--bg-surface-2)]">
                  <th className="py-2.5 px-3">Order / Short ID</th>
                  <th className="py-2.5 px-3">Timestamp (WIB)</th>
                  <th className="py-2.5 px-3">Brand</th>
                  {isCombined && <th className="py-2.5 px-3">Kitchen</th>}
                  <th className="py-2.5 px-3">Channel</th>
                  <th className="py-2.5 px-3">Prep & Waste Stage</th>
                  <th className="py-2.5 px-3">Cancellation Reason</th>
                  <th className="py-2.5 px-3">Cancelled Basket Items</th>
                  <th className="py-2.5 px-3 text-right">Lost Gross GMV</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-subtle)] text-xs">
                {filteredTickets.map((t) => {
                  const isGrab = t.provider.toLowerCase().includes("grab");
                  const isWaste = t.prep_stage === "Post-Prep Food Waste";
                  return (
                    <tr
                      key={t.order_id}
                      className={`transition-colors ${
                        isWaste
                          ? "bg-rose-500/[0.06] hover:bg-rose-500/[0.1]"
                          : "hover:bg-[var(--bg-surface-2)]/60"
                      }`}
                    >
                      <td className="py-2.5 px-3 font-mono whitespace-nowrap">
                        <span className="text-[var(--text-primary)] font-semibold">#{t.order_id}</span>
                        {t.short_id && t.short_id !== t.order_id && (
                          <span className="ml-1.5 text-[10px] px-1.5 py-0.5 rounded badge-neutral">
                            {t.short_id}
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[var(--text-secondary)] whitespace-nowrap">
                        <div className="text-[var(--text-primary)]">{t.created_at_formatted}</div>
                        <div className="text-[10px] text-[var(--text-muted)]">{t.daypart_label}</div>
                      </td>
                      <td className="py-2.5 px-3 text-[var(--text-primary)] font-medium whitespace-nowrap">
                        {t.brand}
                      </td>
                      {isCombined && (
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-semibold ${
                              t.branch.toLowerCase() === "kemang"
                                ? "badge-amber"
                                : "badge-blue"
                            }`}
                          >
                            {t.branch}
                          </span>
                        </td>
                      )}
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-semibold ${
                            isGrab ? "badge-emerald" : "badge-rose"
                          }`}
                        >
                          {t.provider}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        {isWaste ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold badge-rose">
                            <AlertOctagon className="w-3 h-3" />
                            COOKED WASTE ({t.prep_time_minutes}m)
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono badge-neutral">
                            PRE-PREP · Uncooked
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <div className="text-[var(--text-primary)] font-medium">{t.reason_label}</div>
                        <div className="text-[10px] font-mono text-[var(--text-muted)]">
                          {t.cancellation_reason} · by {t.cancelled_by}
                        </div>
                      </td>
                      <td
                        className="py-2.5 px-3 text-[var(--text-secondary)] max-w-md truncate"
                        title={t.menu_items_summary}
                      >
                        {t.menu_items_summary || `${t.items_ordered}x item(s)`}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono whitespace-nowrap">
                        <div className="font-bold text-rose-600 dark:text-rose-400">
                          -{formatRupiah(t.gross_amount)}
                        </div>
                        <div className="text-[10px] text-[var(--text-muted)]">
                          Net: -{formatRupiah(t.net_payout)}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export function CanceledOrderInspector({
  diagnostic,
  title = "Cancelled Order & Revenue Leakage Inspector",
  subtitle = "Audits cancelled GrabFood & GoFood tickets by kitchen branch, separating early-opening tablet mismatches (pre-prep lost sales) from cooked post-prep food waste",
}: CanceledOrderInspectorProps) {
  const initialMode: "combined" | "kemang" | "greenville" =
    diagnostic.activeBranchFilter === "kemang"
      ? "kemang"
      : diagnostic.activeBranchFilter === "greenville"
      ? "greenville"
      : "combined";

  const [viewMode, setViewMode] = useState<"combined" | "kemang" | "greenville">(
    initialMode
  );

  const activeProfile =
    viewMode === "kemang"
      ? diagnostic.kemang
      : viewMode === "greenville"
      ? diagnostic.greenville
      : diagnostic.combined;

  return (
    <section className="cockpit-panel rounded-2xl p-5 sm:p-6 space-y-6">
      {/* Top Header & Branch Switcher */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 pb-5 border-b border-[var(--border-default)]">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider px-2.5 py-0.5 rounded-md badge-rose font-semibold">
              <Ban className="w-3.5 h-3.5" />
              Cancellation & Waste Telemetry
            </span>
            <span className="text-xs font-mono text-[var(--text-secondary)]">
              {diagnostic.combined.cancelledOrders} Cancelled Orders ·{" "}
              <span className="text-rose-600 dark:text-rose-400 font-semibold">
                {formatRupiah(diagnostic.combined.lostGrossGmv)} Lost Gross GMV
              </span>{" "}
              ({diagnostic.combined.postPrepWasteOrders} Cooked Food Waste)
            </span>
          </div>
          <h3 className="text-lg sm:text-xl font-bold text-[var(--text-primary)] mt-1.5">{title}</h3>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">{subtitle}</p>
        </div>

        {/* Interactive Kitchen View Switcher */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex items-center rounded-xl bg-[var(--bg-surface-2)] p-1 border border-[var(--border-default)]">
            <button
              type="button"
              onClick={() => setViewMode("combined")}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-colors cursor-pointer flex items-center gap-1.5 ${
                viewMode === "combined"
                  ? "badge-rose font-semibold"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
            >
              <span>Both Kitchens</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-black/10 dark:bg-white/10">
                {diagnostic.combined.cancelledOrders}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("kemang")}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-colors cursor-pointer flex items-center gap-1.5 ${
                viewMode === "kemang"
                  ? "badge-amber font-semibold"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
            >
              <span>Kemang</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-black/10 dark:bg-white/10">
                {diagnostic.kemang.cancelledOrders}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("greenville")}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-colors cursor-pointer flex items-center gap-1.5 ${
                viewMode === "greenville"
                  ? "badge-blue font-semibold"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
            >
              <span>Greenville</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-black/10 dark:bg-white/10">
                {diagnostic.greenville.cancelledOrders}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Active Branch Cancellation Matrix */}
      <SingleBranchCancellationView profile={activeProfile} />
    </section>
  );
}
