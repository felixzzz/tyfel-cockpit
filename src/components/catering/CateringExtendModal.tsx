"use client";

import React from "react";
import type { EnrichedCateringCustomer } from "@/lib/catering";
import { formatRp } from "./types";
import { X } from "lucide-react";

export interface CateringExtendModalProps {
  isOpen: boolean;
  onClose: () => void;
  customers: EnrichedCateringCustomer[];
  extendCustomerId: string;
  setExtendCustomerId: (id: string) => void;
  onSelectCustomerPreset: (cust: EnrichedCateringCustomer) => void;
  extendPkgName: string;
  setExtendPkgName: (name: string) => void;
  extendTotalBoxes: number;
  setExtendTotalBoxes: (boxes: number) => void;
  extendStartDate: string;
  setExtendStartDate: (date: string) => void;
  extendPricePerBox: number;
  setExtendPricePerBox: (price: number) => void;
  extendDays: string[];
  setExtendDays: React.Dispatch<React.SetStateAction<string[]>>;
  extendSlotMode: "L" | "D" | "L+D";
  setExtendSlotMode: (mode: "L" | "D" | "L+D") => void;
  onSubmit: (e: React.FormEvent) => void;
  mutating: boolean;
}

export function CateringExtendModal({
  isOpen,
  onClose,
  customers,
  extendCustomerId,
  setExtendCustomerId,
  onSelectCustomerPreset,
  extendPkgName,
  setExtendPkgName,
  extendTotalBoxes,
  setExtendTotalBoxes,
  extendStartDate,
  setExtendStartDate,
  extendPricePerBox,
  setExtendPricePerBox,
  extendDays,
  setExtendDays,
  extendSlotMode,
  setExtendSlotMode,
  onSubmit,
  mutating,
}: CateringExtendModalProps) {
  if (!isOpen) return null;

  function toggleDay(d: string) {
    setExtendDays((prev) =>
      prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <form
        onSubmit={onSubmit}
        className="cockpit-panel rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-[var(--border-strong)]"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <span className="badge-emerald px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold">
              Auto-Calendar Generator
            </span>
            <h3 className="text-lg font-bold text-[var(--text-primary)] font-display mt-1">
              Extend / Renew Catering Package
            </h3>
            <p className="text-xs text-[var(--text-secondary)]">
              Automatically allocates boxes across preferred weekdays and computes the exact Last Date.
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

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div className="sm:col-span-2">
            <label className="block text-[11px] font-mono uppercase text-[var(--text-secondary)] font-semibold mb-1">
              Subscriber
            </label>
            <select
              value={extendCustomerId}
              onChange={(e) => {
                const cid = e.target.value;
                setExtendCustomerId(cid);
                const found = customers.find((c) => c.customer_id === cid);
                if (found) onSelectCustomerPreset(found);
              }}
              className="w-full px-3 py-2 rounded-xl bg-[var(--bg-surface-2)] border border-[var(--border-default)] text-xs font-semibold text-[var(--text-primary)]"
            >
              {customers.map((c) => (
                <option key={c.customer_id} value={c.customer_id}>
                  {c.customer_name} ({c.category_label} · Sisa{" "}
                  {c.active_boxes_left_to_deliver} box)
                </option>
              ))}
            </select>
          </div>

          {/* Quick Preset Pills */}
          <div className="sm:col-span-2 flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] font-mono text-[var(--text-muted)] mr-1">
              Quick Presets:
            </span>
            {[
              { name: "5 Days · 5 Box Plan", boxes: 5, slot: "L" as const },
              {
                name: "5 Days · 10 Box Plan (L+D)",
                boxes: 10,
                slot: "L+D" as const,
              },
              {
                name: "Lauk Only 16 Box (Mon & Thu)",
                boxes: 16,
                slot: "L+D" as const,
              },
              {
                name: "56 Box Extended Plan",
                boxes: 56,
                slot: "D" as const,
              },
            ].map((preset) => (
              <button
                key={preset.name}
                type="button"
                onClick={() => {
                  setExtendPkgName(preset.name);
                  setExtendTotalBoxes(preset.boxes);
                  setExtendSlotMode(preset.slot);
                }}
                className="px-2.5 py-1 rounded-lg bg-[var(--bg-surface-2)] hover:bg-[var(--bg-surface-3)] border border-[var(--border-default)] text-[10px] font-mono font-semibold text-[var(--text-primary)] cursor-pointer"
              >
                {preset.name}
              </button>
            ))}
          </div>

          <div className="sm:col-span-2">
            <label className="block text-[11px] font-mono uppercase text-[var(--text-secondary)] font-semibold mb-1">
              Package Name
            </label>
            <input
              type="text"
              required
              value={extendPkgName}
              onChange={(e) => setExtendPkgName(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[var(--bg-surface-2)] border border-[var(--border-default)] text-xs text-[var(--text-primary)]"
            />
          </div>

          <div>
            <label className="block text-[11px] font-mono uppercase text-[var(--text-secondary)] font-semibold mb-1">
              Total Boxes Quota
            </label>
            <input
              type="number"
              min={1}
              max={200}
              required
              value={extendTotalBoxes}
              onChange={(e) => setExtendTotalBoxes(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-xl bg-[var(--bg-surface-2)] border border-[var(--border-default)] text-xs font-mono font-bold text-[var(--text-primary)]"
            />
          </div>

          <div>
            <label className="block text-[11px] font-mono uppercase text-[var(--text-secondary)] font-semibold mb-1">
              Start Date
            </label>
            <input
              type="date"
              required
              value={extendStartDate}
              onChange={(e) => setExtendStartDate(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[var(--bg-surface-2)] border border-[var(--border-default)] text-xs font-mono text-[var(--text-primary)]"
            />
          </div>

          <div>
            <label className="block text-[11px] font-mono uppercase text-[var(--text-secondary)] font-semibold mb-1">
              Default Meal Slot
            </label>
            <select
              value={extendSlotMode}
              onChange={(e) =>
                setExtendSlotMode(e.target.value as "L" | "D" | "L+D")
              }
              className="w-full px-3 py-2 rounded-xl bg-[var(--bg-surface-2)] border border-[var(--border-default)] text-xs font-semibold text-[var(--text-primary)]"
            >
              <option value="L">Lunch Only (1 box/day)</option>
              <option value="D">Dinner Only (1 box/day)</option>
              <option value="L+D">Both Lunch + Dinner (2 boxes/day)</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-mono uppercase text-[var(--text-secondary)] font-semibold mb-1">
              Price per Box (IDR)
            </label>
            <input
              type="number"
              step={1000}
              value={extendPricePerBox}
              onChange={(e) => setExtendPricePerBox(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-xl bg-[var(--bg-surface-2)] border border-[var(--border-default)] text-xs font-mono text-[var(--text-primary)]"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-[11px] font-mono uppercase text-[var(--text-secondary)] font-semibold mb-1.5">
              Delivery Days of Week
            </label>
            <div className="flex flex-wrap gap-1.5">
              {["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"].map((d) => {
                const active = extendDays.includes(d);
                return (
                  <button
                    key={d}
                    type="button"
                    onClick={() => toggleDay(d)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold border cursor-pointer ${
                      active
                        ? "bg-[var(--accent-primary)] text-white border-transparent"
                        : "bg-[var(--bg-surface-2)] text-[var(--text-muted)] border-[var(--border-default)]"
                    }`}
                  >
                    {d}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[var(--border-subtle)]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-[var(--bg-surface-2)] text-xs font-semibold text-[var(--text-secondary)] cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={mutating}
            className="px-4 py-2 rounded-xl bg-[var(--accent-primary)] text-white text-xs font-semibold cursor-pointer"
          >
            {mutating
              ? "Generating Schedule..."
              : `Create Package (${formatRp(
                  extendTotalBoxes * extendPricePerBox
                )})`}
          </button>
        </div>
      </form>
    </div>
  );
}
