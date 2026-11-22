"use client";

import React from "react";
import type {
  CalendarDayHeader,
  EnrichedCateringCustomer,
  CateringDeliveryRow,
  MealSlot,
  CateringProgramCategory,
} from "@/lib/catering";
import { formatShortDate } from "./types";
import { Search, Edit3, CalendarPlus } from "lucide-react";

const MONTH_META_DISPLAY: Record<string, string> = {
  "2026-08": "August 2026 (AGS 26)",
  "2026-09": "September 2026 (SEPT 26)",
  "2026-10": "October 2026 (OKT 26)",
  "2026-11": "November 2026 (NOV 26)",
};

const MONTH_LABELS_SHORT: Record<string, string> = {
  "2026-08": "August",
  "2026-09": "September",
  "2026-10": "October",
  "2026-11": "November",
};

export interface CateringMatrixViewProps {
  selectedMonth: string;
  selectedDate: string;
  onSelectDate: (date: string) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  categoryFilter: string;
  setCategoryFilter: (cat: string) => void;
  calendarDays: CalendarDayHeader[];
  customers: EnrichedCateringCustomer[];
  matrix: Record<string, Record<string, { L?: CateringDeliveryRow; D?: CateringDeliveryRow }>>;
  onCellClick: (cellData: {
    customer: EnrichedCateringCustomer;
    date: string;
    dowShort: string;
    slot: MealSlot;
    existing?: CateringDeliveryRow;
  }) => void;
  onOpenEditCustomerModal: (cust: EnrichedCateringCustomer) => void;
  onOpenExtendModal: (cust?: EnrichedCateringCustomer) => void;
}

export function CateringMatrixView({
  selectedMonth,
  selectedDate,
  onSelectDate,
  searchQuery,
  setSearchQuery,
  categoryFilter,
  setCategoryFilter,
  calendarDays,
  customers,
  matrix,
  onCellClick,
  onOpenEditCustomerModal,
  onOpenExtendModal,
}: CateringMatrixViewProps) {
  const filteredCustomers = customers.filter((c) => {
    if (categoryFilter !== "all" && c.category !== categoryFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = c.customer_name.toLowerCase().includes(q);
      const matchNote = (c.dietary_notes || "").toLowerCase().includes(q);
      const matchAddr = (c.delivery_address || "").toLowerCase().includes(q);
      const matchSheet = (c.sheet_raw_label || "").toLowerCase().includes(q);
      if (!matchName && !matchNote && !matchAddr && !matchSheet) return false;
    }
    return true;
  });

  const groupedCategories: Array<{
    key: CateringProgramCategory;
    title: string;
    sheetHeader: string;
    subtitle: string;
    badgeClass: string;
  }> = [
    {
      key: "LUNCH_DINNER",
      title: "Full Day Lunch & Dinner Plan",
      sheetHeader: "LUNCH DINNER",
      subtitle: "2 Boxes Daily (Lunch + Dinner)",
      badgeClass: "badge-purple",
    },
    {
      key: "LAUK",
      title: "Lauk Only (No Rice)",
      sheetHeader: "LAUK",
      subtitle: "Protein & Vegetable Portions Only",
      badgeClass: "badge-blue",
    },
    {
      key: "LUNCH_OR_DINNER",
      title: "Flexible Lunch or Dinner Plan",
      sheetHeader: "LUNCH / DINNER",
      subtitle: "Standard Single Meal with Flexible Skip/Swap",
      badgeClass: "badge-emerald",
    },
  ];

  return (
    <div className="cockpit-panel rounded-2xl overflow-hidden">
      {/* Matrix Header Controls */}
      <div className="p-4 sm:p-5 border-b border-[var(--border-default)] flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base sm:text-lg font-bold text-[var(--text-primary)] font-display">
              Interactive Monthly Catering Matrix ·{" "}
              {MONTH_META_DISPLAY[selectedMonth] || selectedMonth}
            </h2>
            <span className="badge-emerald px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold">
              Click any L / D cell to Schedule, Skip (OFF), or Swap L↔D
            </span>
          </div>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            Click any date column header to inspect that day&apos;s Kitchen Prep &amp; Dispatch Manifest below. Weekend columns (Sabtu/Minggu) are shaded rose.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Search input */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter subscriber or note..."
              className="pl-8 pr-3 py-1.5 rounded-xl bg-[var(--bg-surface-2)] border border-[var(--border-default)] text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-primary)] w-48"
            />
          </div>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-[var(--bg-surface-2)] border border-[var(--border-default)] text-xs font-semibold text-[var(--text-primary)] focus:outline-none cursor-pointer"
          >
            <option value="all">All Programs (3 Categories)</option>
            <option value="LUNCH_OR_DINNER">LUNCH/DINNER (Flexible)</option>
            <option value="LAUK">LAUK ONLY (No Rice)</option>
            <option value="LUNCH_DINNER">LUNCH DINNER (Full Day)</option>
          </select>
        </div>
      </div>

      {/* Legend Bar */}
      <div className="px-4 sm:px-5 py-2.5 bg-[var(--bg-surface-2)] border-b border-[var(--border-subtle)] flex flex-wrap items-center justify-between gap-3 text-[11px]">
        <div className="flex flex-wrap items-center gap-4">
          <span className="flex items-center gap-1.5 font-mono text-[var(--text-secondary)]">
            <span className="w-4 h-4 rounded bg-emerald-500 text-white inline-flex items-center justify-center text-[10px] font-bold">
              1
            </span>
            <span>Delivered Box (≤ 29 Sep)</span>
          </span>
          <span className="flex items-center gap-1.5 font-mono text-[var(--text-secondary)]">
            <span className="w-4 h-4 rounded bg-emerald-500/20 border border-emerald-500/50 text-emerald-700 dark:text-emerald-300 inline-flex items-center justify-center text-[10px] font-bold">
              1
            </span>
            <span>Scheduled Box (&gt; 29 Sep)</span>
          </span>
          <span className="flex items-center gap-1.5 font-mono text-[var(--text-secondary)]">
            <span className="w-4 h-4 rounded bg-sky-500 text-white inline-flex items-center justify-center text-[10px] font-bold">
              V
            </span>
            <span>Lauk Only Portion</span>
          </span>
          <span className="flex items-center gap-1.5 font-mono text-[var(--text-secondary)]">
            <span className="px-1.5 py-0.5 rounded bg-amber-500/20 border border-amber-500/40 text-amber-700 dark:text-amber-300 text-[9px] font-bold">
              OFF
            </span>
            <span>Customer Skipped (Quota Rolled Over)</span>
          </span>
          <span className="flex items-center gap-1.5 font-mono text-[var(--text-secondary)]">
            <span className="px-1.5 py-0.5 rounded bg-purple-500/20 border border-purple-500/40 text-purple-700 dark:text-purple-300 text-[9px] font-bold">
              FIN
            </span>
            <span>Package Finish Milestone</span>
          </span>
        </div>
        <div className="font-mono text-[10px] text-[var(--text-muted)]">
          L = Lunch · D = Dinner
        </div>
      </div>

      {/* Scrollable Matrix Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-xs">
          <thead>
            {/* Row 1: Day of Week & Day Number */}
            <tr className="bg-[var(--bg-surface-2)] border-b border-[var(--border-default)]">
              <th
                rowSpan={2}
                className="sticky left-0 z-20 bg-[var(--bg-surface-2)] px-3.5 py-2.5 text-left font-mono uppercase tracking-wider text-[10px] text-[var(--text-secondary)] border-r border-[var(--border-default)] min-w-[170px]"
              >
                Subscriber (Nama)
              </th>
              <th
                rowSpan={2}
                className="sticky left-[170px] z-20 bg-[var(--bg-surface-2)] px-3 py-2.5 text-left font-mono uppercase tracking-wider text-[10px] text-[var(--text-secondary)] border-r border-[var(--border-default)] min-w-[210px]"
              >
                Active Plan · Quota · Last Date
              </th>
              {calendarDays.map((day) => {
                const isSelectedDay = day.date === selectedDate;
                return (
                  <th
                    key={day.date}
                    colSpan={2}
                    onClick={() => onSelectDate(day.date)}
                    title={`Click to view ${day.dow_id}, ${day.date} Kitchen Dispatch (${day.total_boxes} boxes)`}
                    className={`px-1 py-1.5 text-center border-r border-[var(--border-subtle)] cursor-pointer transition-colors select-none min-w-[52px] ${
                      isSelectedDay
                        ? "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-bold"
                        : day.is_today
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                        : day.is_weekend
                        ? "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                        : "hover:bg-[var(--bg-surface-3)] text-[var(--text-primary)]"
                    }`}
                  >
                    <div className="text-[9px] font-mono uppercase tracking-tighter opacity-80">
                      {day.dow_short}
                    </div>
                    <div className="text-xs font-mono font-bold leading-tight flex items-center justify-center gap-0.5">
                      <span>{day.day_num}</span>
                      {day.is_today && (
                        <span
                          className="w-1.5 h-1.5 rounded-full bg-emerald-500"
                          title="Today (29 Sep 2026)"
                        />
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>

            {/* Row 2: L | D Sub-columns */}
            <tr className="bg-[var(--bg-surface-2)] border-b border-[var(--border-default)] text-[10px] font-mono">
              {calendarDays.map((day) => {
                const isSelectedDay = day.date === selectedDate;
                return (
                  <React.Fragment key={`${day.date}-ld`}>
                    <th
                      onClick={() => onSelectDate(day.date)}
                      className={`py-1 px-0.5 text-center border-r border-[var(--border-subtle)] cursor-pointer ${
                        isSelectedDay
                          ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-bold"
                          : day.is_weekend
                          ? "bg-rose-500/5 text-rose-500/80"
                          : "text-amber-600 dark:text-amber-400"
                      }`}
                    >
                      L
                    </th>
                    <th
                      onClick={() => onSelectDate(day.date)}
                      className={`py-1 px-0.5 text-center border-r border-[var(--border-default)] cursor-pointer ${
                        isSelectedDay
                          ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-bold"
                          : day.is_weekend
                          ? "bg-rose-500/5 text-rose-500/80"
                          : "text-indigo-600 dark:text-indigo-400"
                      }`}
                    >
                      D
                    </th>
                  </React.Fragment>
                );
              })}
            </tr>
          </thead>

          <tbody>
            {groupedCategories.map((group) => {
              const groupCusts = filteredCustomers.filter(
                (c) => c.category === group.key
              );
              if (groupCusts.length === 0) return null;

              return (
                <React.Fragment key={group.key}>
                  {/* Category Section Divider Row */}
                  <tr className="bg-[var(--bg-surface-3)]/70 border-y border-[var(--border-default)]">
                    <td
                      colSpan={2 + calendarDays.length * 2}
                      className="px-3.5 py-1.5 font-mono text-[10px] font-bold uppercase tracking-wider text-[var(--text-primary)]"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded ${group.badgeClass}`}
                        >
                          {group.sheetHeader}
                        </span>
                        <span>{group.title}</span>
                        <span className="text-[var(--text-muted)] font-normal">
                          — {group.subtitle}
                        </span>
                      </div>
                    </td>
                  </tr>

                  {groupCusts.map((cust) => {
                    const custMatrix = matrix[cust.customer_id] || {};
                    const monthDeliveriesCount = Object.values(
                      custMatrix
                    ).reduce(
                      (acc, pair) =>
                        acc +
                        (pair.L?.box_qty || 0) +
                        (pair.D?.box_qty || 0),
                      0
                    );
                    const pctUsed =
                      cust.active_quota_total > 0
                        ? Math.min(
                            100,
                            Math.round(
                              ((cust.active_quota_total -
                                cust.active_boxes_left_to_deliver) /
                                cust.active_quota_total) *
                                100
                            )
                          )
                        : 100;

                    return (
                      <tr
                        key={cust.customer_id}
                        className="border-b border-[var(--border-subtle)] hover:bg-[var(--bg-surface-2)]/60 transition-colors"
                      >
                        {/* Sticky Col 1: Subscriber Name & Actions */}
                        <td className="sticky left-0 z-10 bg-[var(--bg-surface)] px-3.5 py-2.5 border-r border-[var(--border-default)] min-w-[170px]">
                          <div className="flex items-center justify-between gap-1.5">
                            <div>
                              <div className="font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                                <span>{cust.customer_name}</span>
                                {cust.status !== "active" && (
                                  <span className="badge-neutral px-1.5 py-0.2 rounded text-[9px] font-mono">
                                    {cust.status}
                                  </span>
                                )}
                              </div>
                              <div className="text-[10px] font-mono text-[var(--text-muted)] mt-0.5">
                                {monthDeliveriesCount} box in{" "}
                                {MONTH_LABELS_SHORT[selectedMonth]}
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => onOpenEditCustomerModal(cust)}
                                title="Edit Subscriber Profile"
                                className="p-1 rounded-lg hover:bg-[var(--bg-surface-3)] text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => onOpenExtendModal(cust)}
                                title="Extend / Renew Catering Package"
                                className="p-1 rounded-lg hover:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 cursor-pointer"
                              >
                                <CalendarPlus className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </td>

                        {/* Sticky Col 2: Structured Quota & Last Date */}
                        <td className="sticky left-[170px] z-10 bg-[var(--bg-surface)] px-3 py-2 border-r border-[var(--border-default)] min-w-[210px]">
                          {cust.active_package ? (
                            <div className="space-y-1">
                              <div className="flex items-center justify-between gap-1">
                                <span className="text-[11px] font-semibold text-[var(--text-primary)] truncate max-w-[130px]">
                                  {cust.active_package.package_name}
                                </span>
                                <span
                                  className={`text-[10px] font-mono font-semibold px-1.5 py-0.2 rounded shrink-0 ${
                                    cust.active_boxes_left_to_deliver === 0
                                      ? "badge-neutral"
                                      : cust.active_boxes_left_to_deliver <= 3
                                      ? "badge-rose"
                                      : "badge-emerald"
                                  }`}
                                >
                                  Sisa {cust.active_boxes_left_to_deliver}/
                                  {cust.active_quota_total}
                                </span>
                              </div>

                              {/* Mini Quota Progress Bar */}
                              <div className="w-full h-1.5 rounded-full bg-[var(--bg-surface-3)] overflow-hidden">
                                <div
                                  className="h-full rounded-full bg-emerald-500 transition-all"
                                  style={{ width: `${pctUsed}%` }}
                                />
                              </div>

                              <div className="flex items-center justify-between text-[10px] font-mono text-[var(--text-muted)]">
                                <span>
                                  Last:{" "}
                                  <strong className="text-[var(--text-primary)]">
                                    {formatShortDate(cust.projected_last_date)}
                                  </strong>
                                </span>
                                {cust.skipped_dates_count > 0 && (
                                  <span className="text-amber-600 dark:text-amber-400">
                                    {cust.skipped_dates_count}d OFF
                                  </span>
                                )}
                              </div>
                            </div>
                          ) : (
                            <div className="text-[11px] text-[var(--text-muted)] font-mono">
                              No active package
                            </div>
                          )}
                        </td>

                        {/* Daily L & D Cells */}
                        {calendarDays.map((day) => {
                          const pair = custMatrix[day.date] || {};
                          const slots: MealSlot[] = ["L", "D"];
                          return slots.map((slot) => {
                            const cell = pair[slot];
                            const isLauk = cust.category === "LAUK";
                            const isSelectedCol = day.date === selectedDate;

                            let cellContent: React.ReactNode = null;
                            let cellStyle = "";

                            if (cell) {
                              if (cell.status === "skipped") {
                                cellContent = (
                                  <span className="text-[9px] font-mono font-bold tracking-tighter text-amber-700 dark:text-amber-300">
                                    OFF
                                  </span>
                                );
                                cellStyle =
                                  "bg-amber-500/20 hover:bg-amber-500/30";
                              } else if (cell.status === "finish_marker") {
                                cellContent = (
                                  <span className="text-[9px] font-mono font-bold tracking-tighter text-purple-700 dark:text-purple-300">
                                    {slot === "L" ? "FIN" : "ISH"}
                                  </span>
                                );
                                cellStyle =
                                  "bg-purple-500/20 hover:bg-purple-500/30";
                              } else if (cell.status === "delivered") {
                                const isFinNote =
                                  cell.raw_sheet_val === "fin" ||
                                  cell.raw_sheet_val === "ish";
                                cellContent = (
                                  <span
                                    className={`w-5 h-5 rounded inline-flex items-center justify-center font-mono text-[10px] font-bold shadow-2xs ${
                                      isLauk
                                        ? "bg-sky-500 text-white"
                                        : "bg-emerald-500 text-white"
                                    }`}
                                  >
                                    {isFinNote
                                      ? slot === "L"
                                        ? "F"
                                        : "I"
                                      : isLauk
                                      ? "V"
                                      : cell.box_qty}
                                  </span>
                                );
                              } else if (cell.status === "scheduled") {
                                cellContent = (
                                  <span
                                    className={`w-5 h-5 rounded inline-flex items-center justify-center font-mono text-[10px] font-bold border ${
                                      isLauk
                                        ? "bg-sky-500/20 border-sky-500/50 text-sky-700 dark:text-sky-300"
                                        : "bg-emerald-500/20 border-emerald-500/50 text-emerald-700 dark:text-emerald-300"
                                    }`}
                                  >
                                    {isLauk ? "V" : cell.box_qty}
                                  </span>
                                );
                              }
                            }

                            return (
                              <td
                                key={`${cust.customer_id}_${day.date}_${slot}`}
                                onClick={() =>
                                  onCellClick({
                                    customer: cust,
                                    date: day.date,
                                    dowShort: day.dow_id,
                                    slot,
                                    existing: cell,
                                  })
                                }
                                title={`${cust.customer_name} · ${day.dow_id} ${day.date} (${
                                  slot === "L" ? "Lunch" : "Dinner"
                                })${
                                  cell
                                    ? ` — ${cell.status.toUpperCase()}: ${
                                        cell.menu_note
                                      }`
                                    : " — Click to schedule or mark OFF"
                                }`}
                                className={`p-0.5 text-center border-r ${
                                  slot === "D"
                                    ? "border-[var(--border-default)]"
                                    : "border-[var(--border-subtle)]"
                                } cursor-pointer transition-colors h-9 min-w-[26px] ${cellStyle} ${
                                  !cellStyle && isSelectedCol
                                    ? "bg-emerald-500/5 hover:bg-emerald-500/15"
                                    : !cellStyle && day.is_weekend
                                    ? "bg-rose-500/5 hover:bg-rose-500/15"
                                    : !cellStyle
                                    ? "hover:bg-[var(--bg-surface-3)]"
                                    : ""
                                }`}
                              >
                                {cellContent}
                              </td>
                            );
                          });
                        })}
                      </tr>
                    );
                  })}
                </React.Fragment>
              );
            })}
          </tbody>

          {/* Daily Totals Footer Row */}
          <tfoot>
            <tr className="bg-[var(--bg-surface-2)] border-t-2 border-[var(--border-default)] font-mono text-[10px]">
              <td
                colSpan={2}
                className="sticky left-0 z-10 bg-[var(--bg-surface-2)] px-3.5 py-2 font-bold text-[var(--text-primary)] border-r border-[var(--border-default)]"
              >
                Daily Kitchen Prep Totals (L / D Boxes)
              </td>
              {calendarDays.map((day) => (
                <React.Fragment key={`${day.date}-totals`}>
                  <td
                    className={`py-1.5 text-center border-r border-[var(--border-subtle)] font-bold ${
                      day.lunch_boxes > 0
                        ? "text-amber-600 dark:text-amber-400"
                        : "text-[var(--text-muted)] opacity-40"
                    }`}
                  >
                    {day.lunch_boxes || "·"}
                  </td>
                  <td
                    className={`py-1.5 text-center border-r border-[var(--border-default)] font-bold ${
                      day.dinner_boxes > 0
                        ? "text-indigo-600 dark:text-indigo-400"
                        : "text-[var(--text-muted)] opacity-40"
                    }`}
                  >
                    {day.dinner_boxes || "·"}
                  </td>
                </React.Fragment>
              ))}
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
