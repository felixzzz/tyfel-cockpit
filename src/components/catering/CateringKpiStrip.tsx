"use client";

import React from "react";
import type { CateringCrmDashboardData, EnrichedCateringCustomer } from "@/lib/catering";
import { formatShortDate } from "./types";
import {
  Users,
  Boxes,
  ShieldCheck,
  Ban,
  Utensils,
  AlertTriangle,
  MessageSquare,
} from "lucide-react";

const MONTH_LABELS_SHORT: Record<string, string> = {
  "2026-08": "August",
  "2026-09": "September",
  "2026-10": "October",
  "2026-11": "November",
};

export interface CateringKpiStripProps {
  kpi: CateringCrmDashboardData["kpi"];
  selectedMonth: string;
  selectedDate: string;
  onSelectDate: (date: string) => void;
  renewalCandidates: EnrichedCateringCustomer[];
  onOpenRenewalWa: (cust: EnrichedCateringCustomer) => void;
  onOpenExtendModal: (cust?: EnrichedCateringCustomer) => void;
}

export function CateringKpiStrip({
  kpi,
  selectedMonth,
  selectedDate,
  onSelectDate,
  renewalCandidates,
  onOpenRenewalWa,
  onOpenExtendModal,
}: CateringKpiStripProps) {
  return (
    <div className="space-y-4">
      {/* 2. EXECUTIVE KPI TELEMETRY STRIP */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Card 1: Active Subscribers */}
        <div className="cockpit-panel rounded-2xl p-4 space-y-2 accent-bar-emerald">
          <div className="flex items-center justify-between text-xs text-[var(--text-secondary)]">
            <span className="font-mono uppercase tracking-wider text-[10px] font-semibold">
              Active Subscribers
            </span>
            <Users className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-display tabular-nums text-[var(--text-primary)]">
              {kpi.active_subscribers}
            </span>
            <span className="text-xs text-[var(--text-muted)] font-mono">
              / {kpi.total_customers} roster
            </span>
          </div>
          <div className="text-[11px] text-[var(--text-secondary)] flex items-center justify-between pt-1 border-t border-[var(--border-subtle)]">
            <span>4 Flex L/D · 1 Lauk Only</span>
            <span className="badge-emerald px-1.5 py-0.5 rounded text-[10px] font-mono">
              Aug–Nov 26
            </span>
          </div>
        </div>

        {/* Card 2: Month Box Throughput */}
        <div className="cockpit-panel rounded-2xl p-4 space-y-2 accent-bar-blue">
          <div className="flex items-center justify-between text-xs text-[var(--text-secondary)]">
            <span className="font-mono uppercase tracking-wider text-[10px] font-semibold">
              {MONTH_LABELS_SHORT[selectedMonth] || selectedMonth} Box Volume
            </span>
            <Boxes className="w-4 h-4 text-sky-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-display tabular-nums text-[var(--text-primary)]">
              {kpi.month_total_boxes}
            </span>
            <span className="text-xs text-[var(--text-muted)] font-mono">
              boxes ({kpi.month_lunch_boxes}L · {kpi.month_dinner_boxes}D)
            </span>
          </div>
          <div className="text-[11px] text-[var(--text-secondary)] flex items-center justify-between pt-1 border-t border-[var(--border-subtle)]">
            <span>
              {kpi.month_delivered_boxes} delivered · {kpi.month_scheduled_boxes}{" "}
              scheduled
            </span>
            <span className="font-mono text-[10px] text-sky-600 dark:text-sky-400 font-semibold">
              {kpi.month_lauk_boxes} Lauk
            </span>
          </div>
        </div>

        {/* Card 3: Remaining Box Liability (Sisa Box) */}
        <div className="cockpit-panel rounded-2xl p-4 space-y-2 accent-bar-purple">
          <div className="flex items-center justify-between text-xs text-[var(--text-secondary)]">
            <span className="font-mono uppercase tracking-wider text-[10px] font-semibold">
              Remaining Quota (Sisa Box)
            </span>
            <ShieldCheck className="w-4 h-4 text-purple-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-display tabular-nums text-[var(--text-primary)]">
              {kpi.total_remaining_liability_boxes}
            </span>
            <span className="text-xs text-[var(--text-muted)] font-mono">
              boxes owed
            </span>
          </div>
          <div className="text-[11px] text-[var(--text-secondary)] flex items-center justify-between pt-1 border-t border-[var(--border-subtle)]">
            <span>Across active paid packages</span>
            <span className="badge-purple px-1.5 py-0.5 rounded text-[10px] font-mono">
              Live Balance
            </span>
          </div>
        </div>

        {/* Card 4: Flexible Skips (OFF) */}
        <div className="cockpit-panel rounded-2xl p-4 space-y-2 accent-bar-amber">
          <div className="flex items-center justify-between text-xs text-[var(--text-secondary)]">
            <span className="font-mono uppercase tracking-wider text-[10px] font-semibold">
              Flexible Skips (OFF)
            </span>
            <Ban className="w-4 h-4 text-amber-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-display tabular-nums text-[var(--text-primary)]">
              {kpi.month_skipped_slots}
            </span>
            <span className="text-xs text-[var(--text-muted)] font-mono">
              skipped slots in month
            </span>
          </div>
          <div className="text-[11px] text-[var(--text-secondary)] flex items-center justify-between pt-1 border-t border-[var(--border-subtle)]">
            <span>0 boxes lost · Auto-rolled over</span>
            <span className="badge-amber px-1.5 py-0.5 rounded text-[10px] font-mono">
              Flex OFF
            </span>
          </div>
        </div>

        {/* Card 5: Selected Date Dispatch */}
        <div className="cockpit-panel rounded-2xl p-4 space-y-2 accent-bar-terracotta">
          <div className="flex items-center justify-between text-xs text-[var(--text-secondary)]">
            <span className="font-mono uppercase tracking-wider text-[10px] font-semibold">
              Dispatch ({formatShortDate(selectedDate)})
            </span>
            <Utensils className="w-4 h-4 text-orange-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-display tabular-nums text-[var(--text-primary)]">
              {kpi.selected_date_total_boxes}
            </span>
            <span className="text-xs text-[var(--text-muted)] font-mono">
              boxes ({kpi.selected_date_lunch_boxes} Lunch ·{" "}
              {kpi.selected_date_dinner_boxes} Dinner)
            </span>
          </div>
          <div className="text-[11px] text-[var(--text-secondary)] flex items-center justify-between pt-1 border-t border-[var(--border-subtle)]">
            <span>
              {kpi.selected_date_skipped > 0
                ? `${kpi.selected_date_skipped} slot(s) marked OFF`
                : "No skips on this date"}
            </span>
            <button
              type="button"
              onClick={() => onSelectDate("2026-09-29")}
              className="text-[10px] font-mono text-[var(--accent-primary)] hover:underline cursor-pointer font-semibold"
            >
              Jump Today
            </button>
          </div>
        </div>
      </div>

      {/* 3. LOW QUOTA / RENEWAL PIPELINE ALERT STRIP */}
      {renewalCandidates.length > 0 && (
        <div className="cockpit-panel rounded-2xl p-4 border-amber-500/30 bg-amber-500/5">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div className="flex items-start sm:items-center gap-3">
              <div className="p-2 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-600 dark:text-amber-400 shrink-0">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-[var(--text-primary)] flex items-center gap-2">
                  <span>Subscription Renewal &amp; Follow-Up Radar</span>
                  <span className="badge-amber px-2 py-0.5 rounded-full text-[10px] font-mono">
                    {renewalCandidates.length} Subscribers Need Attention
                  </span>
                </div>
                <p className="text-xs text-[var(--text-secondary)]">
                  Replaces manual &quot;sisa X box&quot; notes in Column B — automatically flags subscribers approaching their Last Date:
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {renewalCandidates.map((rc) => (
                <div
                  key={rc.customer_id}
                  className="px-3 py-1.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-default)] flex items-center gap-2.5 text-xs shadow-2xs"
                >
                  <div>
                    <div className="font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                      <span>{rc.customer_name}</span>
                      <span
                        className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${
                          rc.renewal_urgency === "critical"
                            ? "badge-rose"
                            : rc.renewal_urgency === "soon"
                            ? "badge-amber"
                            : "badge-neutral"
                        }`}
                      >
                        {rc.renewal_urgency === "inactive"
                          ? "Completed"
                          : `Sisa ${rc.active_boxes_left_to_deliver} box`}
                      </span>
                    </div>
                    <div className="text-[10px] text-[var(--text-muted)] font-mono">
                      {rc.projected_last_date
                        ? `Last Date: ${formatShortDate(rc.projected_last_date)}`
                        : rc.renewal_reason}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => onOpenRenewalWa(rc)}
                      className="px-2 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-700 dark:text-emerald-300 text-[10px] font-semibold inline-flex items-center gap-1 cursor-pointer"
                      title="Send WhatsApp Renewal Nudge"
                    >
                      <MessageSquare className="w-3 h-3" />
                      <span>WA Nudge</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onOpenExtendModal(rc)}
                      className="px-2.5 py-1 rounded-lg bg-[var(--accent-primary)] text-white text-[10px] font-semibold hover:opacity-90 transition-opacity cursor-pointer"
                    >
                      + Extend
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
