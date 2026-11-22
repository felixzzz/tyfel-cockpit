"use client";

import React from "react";
import type { CateringProgramCategory } from "@/lib/catering";
import { X } from "lucide-react";

export interface CateringCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingCustomerId: string | null;
  custName: string;
  setCustName: (val: string) => void;
  custCategory: CateringProgramCategory;
  setCustCategory: (cat: CateringProgramCategory) => void;
  custPhone: string;
  setCustPhone: (phone: string) => void;
  custStatus: "active" | "completed" | "paused";
  setCustStatus: (status: "active" | "completed" | "paused") => void;
  custAddress: string;
  setCustAddress: (addr: string) => void;
  custDietary: string;
  setCustDietary: (d: string) => void;
  custInitialBoxes: number;
  setCustInitialBoxes: (boxes: number) => void;
  custInitialStart: string;
  setCustInitialStart: (start: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  mutating: boolean;
}

export function CateringCustomerModal({
  isOpen,
  onClose,
  editingCustomerId,
  custName,
  setCustName,
  custCategory,
  setCustCategory,
  custPhone,
  setCustPhone,
  custStatus,
  setCustStatus,
  custAddress,
  setCustAddress,
  custDietary,
  setCustDietary,
  custInitialBoxes,
  setCustInitialBoxes,
  custInitialStart,
  setCustInitialStart,
  onSubmit,
  mutating,
}: CateringCustomerModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <form
        onSubmit={onSubmit}
        className="cockpit-panel rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-[var(--border-strong)]"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <span className="badge-emerald px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold">
              Herbox Subscriber CRM
            </span>
            <h3 className="text-lg font-bold text-[var(--text-primary)] font-display mt-1">
              {editingCustomerId
                ? `Edit Subscriber: ${custName}`
                : "Add New Catering Subscriber"}
            </h3>
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
          <div>
            <label className="block text-[11px] font-mono uppercase text-[var(--text-secondary)] font-semibold mb-1">
              Customer Name (Nama)
            </label>
            <input
              type="text"
              required
              value={custName}
              onChange={(e) => setCustName(e.target.value)}
              placeholder="e.g. Clarissa"
              className="w-full px-3 py-2 rounded-xl bg-[var(--bg-surface-2)] border border-[var(--border-default)] text-xs text-[var(--text-primary)]"
            />
          </div>

          <div>
            <label className="block text-[11px] font-mono uppercase text-[var(--text-secondary)] font-semibold mb-1">
              Program Category
            </label>
            <select
              value={custCategory}
              onChange={(e) =>
                setCustCategory(e.target.value as CateringProgramCategory)
              }
              className="w-full px-3 py-2 rounded-xl bg-[var(--bg-surface-2)] border border-[var(--border-default)] text-xs font-semibold text-[var(--text-primary)]"
            >
              <option value="LUNCH_OR_DINNER">
                LUNCH/DINNER (Flexible Box)
              </option>
              <option value="LAUK">LAUK ONLY (No Rice)</option>
              <option value="LUNCH_DINNER">
                LUNCH DINNER (Full Day 2x)
              </option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-mono uppercase text-[var(--text-secondary)] font-semibold mb-1">
              WhatsApp / Phone
            </label>
            <input
              type="text"
              value={custPhone}
              onChange={(e) => setCustPhone(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[var(--bg-surface-2)] border border-[var(--border-default)] text-xs font-mono text-[var(--text-primary)]"
            />
          </div>

          <div>
            <label className="block text-[11px] font-mono uppercase text-[var(--text-secondary)] font-semibold mb-1">
              Status
            </label>
            <select
              value={custStatus}
              onChange={(e) =>
                setCustStatus(
                  e.target.value as "active" | "completed" | "paused"
                )
              }
              className="w-full px-3 py-2 rounded-xl bg-[var(--bg-surface-2)] border border-[var(--border-default)] text-xs font-semibold text-[var(--text-primary)]"
            >
              <option value="active">Active</option>
              <option value="paused">Paused</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          <div className="sm:col-span-2">
            <label className="block text-[11px] font-mono uppercase text-[var(--text-secondary)] font-semibold mb-1">
              Delivery Address
            </label>
            <input
              type="text"
              value={custAddress}
              onChange={(e) => setCustAddress(e.target.value)}
              placeholder="Street, Blok, Area (e.g. Greenville / Kemang)..."
              className="w-full px-3 py-2 rounded-xl bg-[var(--bg-surface-2)] border border-[var(--border-default)] text-xs text-[var(--text-primary)]"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-[11px] font-mono uppercase text-[var(--text-secondary)] font-semibold mb-1">
              Dietary &amp; Packaging Preferences
            </label>
            <input
              type="text"
              value={custDietary}
              onChange={(e) => setCustDietary(e.target.value)}
              placeholder="e.g. No Onion/Garlic, Prefers Wrap on Wednesdays, Lauk Only..."
              className="w-full px-3 py-2 rounded-xl bg-[var(--bg-surface-2)] border border-[var(--border-default)] text-xs text-[var(--text-primary)]"
            />
          </div>

          {!editingCustomerId && (
            <>
              <div>
                <label className="block text-[11px] font-mono uppercase text-[var(--text-secondary)] font-semibold mb-1">
                  Initial Package Boxes
                </label>
                <input
                  type="number"
                  min={0}
                  max={120}
                  value={custInitialBoxes}
                  onChange={(e) =>
                    setCustInitialBoxes(Number(e.target.value))
                  }
                  className="w-full px-3 py-2 rounded-xl bg-[var(--bg-surface-2)] border border-[var(--border-default)] text-xs font-mono font-bold text-[var(--text-primary)]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-mono uppercase text-[var(--text-secondary)] font-semibold mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={custInitialStart}
                  onChange={(e) => setCustInitialStart(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[var(--bg-surface-2)] border border-[var(--border-default)] text-xs font-mono text-[var(--text-primary)]"
                />
              </div>
            </>
          )}
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
            {mutating ? "Saving..." : "Save Subscriber"}
          </button>
        </div>
      </form>
    </div>
  );
}
