"use client";

import React from "react";
import Link from "next/link";
import type { MealSlot } from "@/lib/catering";
import type { ActiveCellState } from "./types";
import { formatShortDate } from "./types";
import {
  X,
  Check,
  Ban,
  ArrowLeftRight,
  Trash2,
  MessageSquare,
  Smartphone,
  ExternalLink,
} from "lucide-react";

export interface CateringSlotModalProps {
  activeCell: ActiveCellState | null;
  onClose: () => void;
  cellNoteInput: string;
  setCellNoteInput: (val: string) => void;
  cellAutoRollover: boolean;
  setCellAutoRollover: (val: boolean) => void;
  mutating: boolean;
  onSlotAction: (
    customer_id: string,
    delivery_date: string,
    meal_slot: MealSlot,
    slot_action: "schedule" | "skip" | "clear" | "swap_slot",
    menu_note?: string,
    auto_rollover?: boolean
  ) => void;
  onOpenSkipConfirmationWa: (cell: ActiveCellState) => void;
}

export function CateringSlotModal({
  activeCell,
  onClose,
  cellNoteInput,
  setCellNoteInput,
  cellAutoRollover,
  setCellAutoRollover,
  mutating,
  onSlotAction,
  onOpenSkipConfirmationWa,
}: CateringSlotModalProps) {
  if (!activeCell) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="cockpit-panel rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl border border-[var(--border-strong)]">
        <div className="flex items-start justify-between gap-3">
          <div>
            <span className="badge-emerald px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold">
              Flexible Slot Command
            </span>
            <h3 className="text-base font-bold text-[var(--text-primary)] font-display mt-1">
              {activeCell.customer.customer_name} ·{" "}
              {activeCell.slot === "L" ? "☀️ Lunch (L)" : "🌙 Dinner (D)"}
            </h3>
            <p className="text-xs font-mono text-[var(--text-secondary)]">
              {activeCell.dowShort}, {formatShortDate(activeCell.date)} (
              {activeCell.date})
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {activeCell.existing && (
          <div className="p-3 rounded-xl bg-[var(--bg-surface-2)] border border-[var(--border-default)] text-xs space-y-1">
            <div className="font-mono text-[10px] uppercase text-[var(--text-muted)]">
              Current Slot Status:
            </div>
            <div className="font-semibold text-[var(--text-primary)] flex items-center justify-between">
              <span>
                {activeCell.existing.status.toUpperCase()} (
                {activeCell.existing.box_qty} box)
              </span>
              <span className="font-mono text-[11px] text-[var(--text-secondary)]">
                Sheet val: &ldquo;{activeCell.existing.raw_sheet_val}&rdquo;
              </span>
            </div>
            <div className="text-[11px] text-[var(--text-secondary)]">
              {activeCell.existing.menu_note}
            </div>
          </div>
        )}

        <div className="space-y-2">
          <label className="block text-[11px] font-mono uppercase text-[var(--text-secondary)] font-semibold">
            Menu / Dietary Override Note (Optional)
          </label>
          <input
            type="text"
            value={cellNoteInput}
            onChange={(e) => setCellNoteInput(e.target.value)}
            placeholder={
              activeCell.customer.category === "LAUK"
                ? "e.g. Lauk Only (No Rice)"
                : "e.g. Vegan Wrap instead of Ricebox, No Spicy..."
            }
            className="w-full px-3 py-2 rounded-xl bg-[var(--bg-surface-2)] border border-[var(--border-default)] text-xs text-[var(--text-primary)]"
          />
        </div>

        <label className="flex items-center gap-2 text-xs text-[var(--text-secondary)] cursor-pointer select-none">
          <input
            type="checkbox"
            checked={cellAutoRollover}
            onChange={(e) => setCellAutoRollover(e.target.checked)}
            className="rounded accent-emerald-600"
          />
          <span>
            When marking <strong>OFF (Skip)</strong>, automatically roll box
            forward to next eligible delivery day
          </span>
        </label>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
          <button
            type="button"
            disabled={mutating}
            onClick={() =>
              onSlotAction(
                activeCell.customer.customer_id,
                activeCell.date,
                activeCell.slot,
                "schedule",
                cellNoteInput
              )
            }
            className="px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>
              {activeCell.date <= "2026-09-29"
                ? "Mark Delivered (1 Box)"
                : "Schedule (1 Box)"}
            </span>
          </button>

          <button
            type="button"
            disabled={mutating}
            onClick={() =>
              onSlotAction(
                activeCell.customer.customer_id,
                activeCell.date,
                activeCell.slot,
                "skip",
                cellNoteInput || "Customer Skipped (OFF)",
                cellAutoRollover
              )
            }
            className="px-3.5 py-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-800 dark:text-amber-200 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Ban className="w-4 h-4" />
            <span>Skip Date (Mark OFF)</span>
          </button>

          {activeCell.existing && activeCell.existing.box_qty > 0 && (
            <button
              type="button"
              disabled={mutating}
              onClick={() =>
                onSlotAction(
                  activeCell.customer.customer_id,
                  activeCell.date,
                  activeCell.slot,
                  "swap_slot",
                  cellNoteInput
                )
              }
              className="px-3.5 py-2.5 rounded-xl bg-[var(--bg-surface-2)] hover:bg-[var(--bg-surface-3)] border border-[var(--border-default)] text-[var(--text-primary)] text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <ArrowLeftRight className="w-4 h-4 text-sky-500" />
              <span>
                Swap to {activeCell.slot === "L" ? "Dinner (D)" : "Lunch (L)"}
              </span>
            </button>
          )}

          {activeCell.existing && (
            <button
              type="button"
              disabled={mutating}
              onClick={() =>
                onSlotAction(
                  activeCell.customer.customer_id,
                  activeCell.date,
                  activeCell.slot,
                  "clear"
                )
              }
              className="px-3.5 py-2.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              <span>Clear Slot</span>
            </button>
          )}
        </div>

        {activeCell.customer.phone && (
          <div className="pt-2 border-t border-[var(--border-subtle)] flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => onOpenSkipConfirmationWa(activeCell)}
              className="px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-700 dark:text-emerald-300 text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Send WhatsApp Notice</span>
            </button>
            <Link
              href={`/catering/portal/${activeCell.customer.customer_id}`}
              target="_blank"
              className="text-xs font-semibold text-[var(--accent-primary)] hover:underline inline-flex items-center gap-1"
            >
              <Smartphone className="w-3 h-3" />
              <span>View Customer Portal</span>
              <ExternalLink className="w-2.5 h-2.5" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
