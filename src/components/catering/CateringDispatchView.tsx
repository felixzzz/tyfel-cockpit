"use client";

import React from "react";
import type { DailyDispatchItem, MealSlot } from "@/lib/catering";
import { generateDispatchWhatsAppText } from "@/lib/catering-whatsapp";
import { formatShortDate, type DailyManifestData } from "./types";
import {
  ChevronLeft,
  ChevronRight,
  Printer,
  Download,
  Sun,
  Moon,
  Ban,
  MapPin,
  MessageSquare,
  Copy,
  ArrowLeftRight,
} from "lucide-react";

export interface CateringDispatchViewProps {
  dailyManifest: DailyManifestData;
  selectedDate: string;
  onSelectDate: (date: string) => void;
  stepSelectedDate: (deltaDays: number) => void;
  onOpenPrintManifest: () => void;
  onExportManifestCsv: () => void;
  onOpenDispatchWa: (item: DailyDispatchItem) => void;
  onCopyText: (text: string, label: string) => void;
  onSlotAction: (
    customer_id: string,
    delivery_date: string,
    meal_slot: MealSlot,
    slot_action: "schedule" | "skip" | "clear" | "swap_slot",
    menu_note?: string,
    auto_rollover?: boolean
  ) => void;
  mutating: boolean;
  baseUrl: string;
}

export function CateringDispatchView({
  dailyManifest,
  selectedDate,
  onSelectDate,
  stepSelectedDate,
  onOpenPrintManifest,
  onExportManifestCsv,
  onOpenDispatchWa,
  onCopyText,
  onSlotAction,
  mutating,
  baseUrl,
}: CateringDispatchViewProps) {
  return (
    <div className="cockpit-panel rounded-2xl p-5 sm:p-6 space-y-5">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-[var(--border-subtle)] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="badge-emerald px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold">
              Kitchen &amp; Courier Dispatch Sheet
            </span>
            <span className="text-xs font-mono text-[var(--text-muted)]">
              {dailyManifest.day_label}
            </span>
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-[var(--text-primary)] font-display mt-1">
            Daily Catering Prep &amp; Delivery Manifest —{" "}
            {formatShortDate(selectedDate)}
          </h2>
        </div>

        {/* Date Navigator Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => stepSelectedDate(-1)}
            className="p-2 rounded-xl bg-[var(--bg-surface-2)] hover:bg-[var(--bg-surface-3)] border border-[var(--border-default)] text-[var(--text-primary)] cursor-pointer"
            title="Previous Day"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <input
            type="date"
            value={selectedDate}
            min="2026-08-01"
            max="2026-11-30"
            onChange={(e) => {
              if (e.target.value) onSelectDate(e.target.value);
            }}
            className="px-3 py-1.5 rounded-xl bg-[var(--bg-surface-2)] border border-[var(--border-default)] text-xs font-mono font-semibold text-[var(--text-primary)]"
          />

          <button
            type="button"
            onClick={() => stepSelectedDate(1)}
            className="p-2 rounded-xl bg-[var(--bg-surface-2)] hover:bg-[var(--bg-surface-3)] border border-[var(--border-default)] text-[var(--text-primary)] cursor-pointer"
            title="Next Day"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => onSelectDate("2026-09-29")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border cursor-pointer ${
              selectedDate === "2026-09-29"
                ? "bg-[var(--accent-primary)] text-white border-transparent"
                : "bg-[var(--bg-surface-2)] border-[var(--border-default)] text-[var(--text-secondary)]"
            }`}
          >
            Today (29 Sep)
          </button>
          <button
            type="button"
            onClick={() => onSelectDate("2026-09-30")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border cursor-pointer ${
              selectedDate === "2026-09-30"
                ? "bg-[var(--accent-primary)] text-white border-transparent"
                : "bg-[var(--bg-surface-2)] border-[var(--border-default)] text-[var(--text-secondary)]"
            }`}
          >
            Tomorrow (30 Sep)
          </button>

          <div className="h-5 w-[1px] bg-[var(--border-default)] mx-1" />

          <button
            type="button"
            onClick={onOpenPrintManifest}
            className="px-3 py-1.5 rounded-xl bg-[var(--bg-surface-2)] hover:bg-[var(--bg-surface-3)] border border-[var(--border-default)] text-xs font-semibold text-[var(--text-primary)] inline-flex items-center gap-1.5 cursor-pointer shadow-2xs"
            title="Print Kitchen & Courier Dispatch Manifest"
          >
            <Printer className="w-3.5 h-3.5 text-indigo-500" />
            <span>Print Manifest</span>
          </button>

          <button
            type="button"
            onClick={onExportManifestCsv}
            className="px-3 py-1.5 rounded-xl bg-[var(--bg-surface-2)] hover:bg-[var(--bg-surface-3)] border border-[var(--border-default)] text-xs font-semibold text-[var(--text-primary)] inline-flex items-center gap-1.5 cursor-pointer shadow-2xs"
            title="Download Courier Dispatch CSV"
          >
            <Download className="w-3.5 h-3.5 text-emerald-500" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* 3-Column Dispatch Cards: Lunch (L) | Dinner (D) | Skipped (OFF) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Column 1: Lunch (L) Dispatch */}
        <div className="p-4 rounded-2xl bg-[var(--bg-surface-2)] border border-[var(--border-default)] space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-amber-500/15 text-amber-500">
                <Sun className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[var(--text-primary)]">
                  Lunch (L) Prep &amp; Dispatch
                </h3>
                <p className="text-[11px] text-[var(--text-muted)] font-mono">
                  Cutoff 10:30 WIB · Dispatch 11:00 WIB
                </p>
              </div>
            </div>
            <span className="badge-amber px-2.5 py-1 rounded-full text-xs font-mono font-bold">
              {dailyManifest.lunch_items.length} Box
            </span>
          </div>

          {dailyManifest.lunch_items.length === 0 ? (
            <div className="p-6 text-center text-xs text-[var(--text-muted)] border border-dashed border-[var(--border-default)] rounded-xl">
              No Lunch (L) deliveries scheduled for {formatShortDate(selectedDate)}.
            </div>
          ) : (
            <div className="space-y-2.5">
              {dailyManifest.lunch_items.map((item: DailyDispatchItem) => (
                <div
                  key={item.delivery_id}
                  className="p-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-default)] space-y-2 shadow-2xs"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-bold text-sm text-[var(--text-primary)] flex items-center gap-1.5">
                        <span>{item.customer_name}</span>
                        <span
                          className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${
                            item.category === "LAUK"
                              ? "badge-blue"
                              : "badge-emerald"
                          }`}
                        >
                          {item.category === "LAUK" ? "Lauk Only" : "Ricebox"}
                        </span>
                      </div>
                      <div className="text-[11px] text-[var(--text-secondary)] mt-0.5">
                        {item.menu_note}
                      </div>
                    </div>
                    <span className="text-[10px] font-mono text-[var(--text-muted)]">
                      Sisa {item.boxes_left_to_deliver} box
                    </span>
                  </div>

                  <div className="text-[11px] text-[var(--text-muted)] flex items-center gap-1.5">
                    <MapPin className="w-3 h-3 shrink-0 text-[var(--accent-primary)]" />
                    <span className="truncate">{item.delivery_address}</span>
                  </div>

                  <div className="pt-2 border-t border-[var(--border-subtle)] flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => onOpenDispatchWa(item)}
                        className="px-2 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-[10px] font-semibold text-emerald-700 dark:text-emerald-300 inline-flex items-center gap-1 cursor-pointer"
                        title="Send WhatsApp Dispatch Notice"
                      >
                        <MessageSquare className="w-3 h-3" />
                        <span>WA Alert</span>
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          onCopyText(
                            generateDispatchWhatsAppText(item, baseUrl),
                            `WA Dispatch for ${item.customer_name}`
                          )
                        }
                        className="p-1 rounded-lg bg-[var(--bg-surface-2)] hover:bg-[var(--bg-surface-3)] text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
                        title="Copy WA Message"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() =>
                          onSlotAction(
                            item.customer_id,
                            selectedDate,
                            "L",
                            "swap_slot"
                          )
                        }
                        disabled={mutating}
                        className="px-2 py-1 rounded-lg bg-[var(--bg-surface-2)] hover:bg-[var(--bg-surface-3)] text-[10px] font-mono font-semibold text-[var(--text-secondary)] inline-flex items-center gap-1 cursor-pointer"
                      >
                        <ArrowLeftRight className="w-3 h-3" />
                        <span>Move D</span>
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          onSlotAction(
                            item.customer_id,
                            selectedDate,
                            "L",
                            "skip",
                            "Customer requested OFF",
                            true
                          )
                        }
                        disabled={mutating}
                        className="px-2 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-[10px] font-mono font-semibold text-amber-700 dark:text-amber-300 inline-flex items-center gap-1 cursor-pointer"
                      >
                        <Ban className="w-3 h-3" />
                        <span>Skip OFF</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Column 2: Dinner (D) Dispatch */}
        <div className="p-4 rounded-2xl bg-[var(--bg-surface-2)] border border-[var(--border-default)] space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-indigo-500/15 text-indigo-400">
                <Moon className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[var(--text-primary)]">
                  Dinner (D) Prep &amp; Dispatch
                </h3>
                <p className="text-[11px] text-[var(--text-muted)] font-mono">
                  Cutoff 15:30 WIB · Dispatch 16:30 WIB
                </p>
              </div>
            </div>
            <span className="badge-purple px-2.5 py-1 rounded-full text-xs font-mono font-bold">
              {dailyManifest.dinner_items.length} Box
            </span>
          </div>

          {dailyManifest.dinner_items.length === 0 ? (
            <div className="p-6 text-center text-xs text-[var(--text-muted)] border border-dashed border-[var(--border-default)] rounded-xl">
              No Dinner (D) deliveries scheduled for {formatShortDate(selectedDate)}.
            </div>
          ) : (
            <div className="space-y-2.5">
              {dailyManifest.dinner_items.map((item: DailyDispatchItem) => (
                <div
                  key={item.delivery_id}
                  className="p-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-default)] space-y-2 shadow-2xs"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-bold text-sm text-[var(--text-primary)] flex items-center gap-1.5">
                        <span>{item.customer_name}</span>
                        <span
                          className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${
                            item.category === "LAUK"
                              ? "badge-blue"
                              : "badge-emerald"
                          }`}
                        >
                          {item.category === "LAUK" ? "Lauk Only" : "Ricebox"}
                        </span>
                      </div>
                      <div className="text-[11px] text-[var(--text-secondary)] mt-0.5">
                        {item.menu_note}
                      </div>
                    </div>
                    <span className="text-[10px] font-mono text-[var(--text-muted)]">
                      Sisa {item.boxes_left_to_deliver} box
                    </span>
                  </div>

                  <div className="text-[11px] text-[var(--text-muted)] flex items-center gap-1.5">
                    <MapPin className="w-3 h-3 shrink-0 text-[var(--accent-primary)]" />
                    <span className="truncate">{item.delivery_address}</span>
                  </div>

                  <div className="pt-2 border-t border-[var(--border-subtle)] flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => onOpenDispatchWa(item)}
                        className="px-2 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-[10px] font-semibold text-emerald-700 dark:text-emerald-300 inline-flex items-center gap-1 cursor-pointer"
                        title="Send WhatsApp Dispatch Notice"
                      >
                        <MessageSquare className="w-3 h-3" />
                        <span>WA Alert</span>
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          onCopyText(
                            generateDispatchWhatsAppText(item, baseUrl),
                            `WA Dispatch for ${item.customer_name}`
                          )
                        }
                        className="p-1 rounded-lg bg-[var(--bg-surface-2)] hover:bg-[var(--bg-surface-3)] text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
                        title="Copy WA Message"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() =>
                          onSlotAction(
                            item.customer_id,
                            selectedDate,
                            "D",
                            "swap_slot"
                          )
                        }
                        disabled={mutating}
                        className="px-2 py-1 rounded-lg bg-[var(--bg-surface-2)] hover:bg-[var(--bg-surface-3)] text-[10px] font-mono font-semibold text-[var(--text-secondary)] inline-flex items-center gap-1 cursor-pointer"
                      >
                        <ArrowLeftRight className="w-3 h-3" />
                        <span>Move L</span>
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          onSlotAction(
                            item.customer_id,
                            selectedDate,
                            "D",
                            "skip",
                            "Customer requested OFF",
                            true
                          )
                        }
                        disabled={mutating}
                        className="px-2 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-[10px] font-mono font-semibold text-amber-700 dark:text-amber-300 inline-flex items-center gap-1 cursor-pointer"
                      >
                        <Ban className="w-3 h-3" />
                        <span>Skip OFF</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Column 3: Skipped (OFF) & Quick Add */}
        <div className="p-4 rounded-2xl bg-[var(--bg-surface-2)] border border-[var(--border-default)] space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-rose-500/15 text-rose-500">
                <Ban className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[var(--text-primary)]">
                  Skipped (OFF) Hold List
                </h3>
                <p className="text-[11px] text-[var(--text-muted)] font-mono">
                  Do NOT prep · Quota rolled forward
                </p>
              </div>
            </div>
            <span className="badge-rose px-2.5 py-1 rounded-full text-xs font-mono font-bold">
              {dailyManifest.skipped_items.length} OFF
            </span>
          </div>

          {dailyManifest.skipped_items.length === 0 ? (
            <div className="p-6 text-center text-xs text-[var(--text-muted)] border border-dashed border-[var(--border-default)] rounded-xl">
              No customers marked OFF on {formatShortDate(selectedDate)}.
            </div>
          ) : (
            <div className="space-y-2">
              {dailyManifest.skipped_items.map((item: DailyDispatchItem) => (
                <div
                  key={item.delivery_id}
                  className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-2"
                >
                  <div>
                    <div className="font-bold text-xs text-[var(--text-primary)]">
                      {item.customer_name} ({item.meal_slot}) — OFF
                    </div>
                    <div className="text-[10px] text-[var(--text-secondary)]">
                      {item.menu_note}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      onSlotAction(
                        item.customer_id,
                        selectedDate,
                        item.meal_slot,
                        "schedule"
                      )
                    }
                    className="px-2 py-1 rounded-lg bg-[var(--bg-surface)] text-[10px] font-mono font-semibold text-[var(--text-primary)] border border-[var(--border-default)] cursor-pointer"
                  >
                    Restore
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
