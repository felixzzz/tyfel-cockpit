"use client";

import React from "react";
import { FileSpreadsheet, X } from "lucide-react";

export interface SheetDiagnosticItem {
  id: string;
  customer_name: string;
  sheet_tab: string;
  raw_issue: string;
  digital_solution: string;
}

export interface CateringDiagnosticsProps {
  showDiagnostics: boolean;
  onClose: () => void;
  diagnostics: SheetDiagnosticItem[];
}

export function CateringDiagnostics({
  showDiagnostics,
  onClose,
  diagnostics,
}: CateringDiagnosticsProps) {
  if (!showDiagnostics) return null;

  return (
    <div className="cockpit-panel rounded-2xl p-5 space-y-4 accent-bar-amber">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <FileSpreadsheet className="w-5 h-5 text-amber-500" />
          <div>
            <h2 className="text-sm font-bold text-[var(--text-primary)]">
              Google Sheet Digitization &amp; Data Cleanup Report (From August 2026)
            </h2>
            <p className="text-xs text-[var(--text-secondary)]">
              Here is what made the original Google Sheet messy and how this CRM standardizes it automatically:
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {diagnostics.map((d) => (
          <div
            key={d.id}
            className="p-3.5 rounded-xl bg-[var(--bg-surface-2)] border border-[var(--border-default)] space-y-2"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold text-[var(--text-primary)]">
                {d.customer_name}
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--text-secondary)]">
                Tab: {d.sheet_tab}
              </span>
            </div>
            <div className="text-xs text-rose-600 dark:text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-lg p-2">
              <span className="font-mono font-semibold uppercase text-[10px] mr-1">
                Before (Sheet):
              </span>
              {d.raw_issue}
            </div>
            <div className="text-xs text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-2">
              <span className="font-mono font-semibold uppercase text-[10px] mr-1">
                After (CRM):
              </span>
              {d.digital_solution}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
