"use client";

import React from "react";
import Link from "next/link";
import {
  Calendar,
  Sparkles,
  Utensils,
  Plus,
  FileSpreadsheet,
  CalendarPlus,
  CheckCircle2,
  X,
} from "lucide-react";

export interface CateringHeaderProps {
  selectedMonth: string;
  onSelectMonth: (month: string) => void;
  availableMonths: Array<{
    month_key: string;
    short_label: string;
    sheet_name: string;
    delivered_boxes: number;
    scheduled_boxes: number;
  }>;
  activeView: "matrix" | "dispatch" | "crm" | "all";
  setActiveView: (view: "matrix" | "dispatch" | "crm" | "all") => void;
  showDiagnostics: boolean;
  setShowDiagnostics: (show: boolean) => void;
  onOpenExtendModal: () => void;
  onOpenNewCustomerModal: () => void;
  bannerNotice: string | null;
  onDismissBanner: () => void;
}

export function CateringHeader({
  selectedMonth,
  onSelectMonth,
  availableMonths,
  activeView,
  setActiveView,
  showDiagnostics,
  setShowDiagnostics,
  onOpenExtendModal,
  onOpenNewCustomerModal,
  bannerNotice,
  onDismissBanner,
}: CateringHeaderProps) {
  return (
    <>
      {/* 1. HERO COMMAND BANNER */}
      <div className="cockpit-panel rounded-2xl p-5 sm:p-6 relative overflow-hidden accent-bar-emerald">
        <div
          className="absolute top-0 right-0 w-[440px] h-[260px] rounded-full blur-3xl opacity-15 pointer-events-none"
          style={{ backgroundColor: "#10b981" }}
        />

        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-5 relative z-10">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Link
                href="/brands/herbox"
                className="inline-flex items-center gap-1.5 text-[11px] font-mono text-emerald-700 dark:text-emerald-300 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 font-semibold hover:bg-emerald-500/20 transition-colors"
              >
                <Utensils className="w-3 h-3" />
                <span>Herbox Culinary Concept</span>
              </Link>
              <span className="badge-emerald px-2.5 py-0.5 rounded-full text-[11px] font-mono font-semibold inline-flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                Flexible Skip & Quota Rollover Engine
              </span>
              <span className="text-[11px] font-mono bg-[var(--bg-surface-2)] border border-[var(--border-subtle)] text-[var(--text-secondary)] px-2.5 py-0.5 rounded-full">
                Digitalized from Aug 2026 (AGS 26 – NOV 26)
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text-primary)] font-display">
              Herbox Personal Catering CRM &amp; Schedule Matrix
            </h1>
            <p className="text-xs sm:text-sm text-[var(--text-secondary)] max-w-3xl">
              Unified subscriber quota tracker, 1-click flexible date skipping (
              <code className="font-mono text-xs px-1 py-0.5 rounded bg-[var(--bg-surface-2)]">
                OFF
              </code>{" "}
              auto-extends{" "}
              <code className="font-mono text-xs px-1 py-0.5 rounded bg-[var(--bg-surface-2)]">
                Last Date
              </code>
              ), Lunch ↔ Dinner slot swapping, and daily kitchen dispatch manifest.
            </p>
          </div>

          {/* Right Action Controls */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => setShowDiagnostics(!showDiagnostics)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all inline-flex items-center gap-2 cursor-pointer ${
                showDiagnostics
                  ? "bg-amber-500/15 border-amber-500/40 text-amber-700 dark:text-amber-300"
                  : "bg-[var(--bg-surface-2)] border-[var(--border-default)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
            >
              <FileSpreadsheet className="w-4 h-4 text-amber-500" />
              <span>Sheet Cleanup Audit (4 Fixes)</span>
            </button>

            <button
              type="button"
              onClick={onOpenExtendModal}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-[var(--bg-surface-2)] hover:bg-[var(--bg-surface-3)] border border-[var(--border-strong)] text-[var(--text-primary)] transition-all inline-flex items-center gap-2 cursor-pointer"
            >
              <CalendarPlus className="w-4 h-4 text-emerald-500" />
              <span>Extend / Renew Package</span>
            </button>

            <button
              type="button"
              onClick={onOpenNewCustomerModal}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-[var(--accent-primary)] hover:opacity-95 text-white shadow-sm transition-all inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>New Subscriber</span>
            </button>
          </div>
        </div>

        {/* Month Tabs (AGS 26, SEPT 26, OKT 26, NOV 26) & View Selector */}
        <div className="mt-5 pt-4 border-t border-[var(--border-subtle)] flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-mono uppercase tracking-wider text-[var(--text-muted)] mr-1.5 font-semibold">
              Sheet Month:
            </span>
            {availableMonths.map((m) => {
              const isSelected = m.month_key === selectedMonth;
              return (
                <button
                  key={m.month_key}
                  type="button"
                  onClick={() => onSelectMonth(m.month_key)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-medium transition-all flex items-center gap-2 cursor-pointer border ${
                    isSelected
                      ? "bg-[var(--accent-primary)] text-white border-transparent shadow-xs font-semibold"
                      : "bg-[var(--bg-surface-2)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border-[var(--border-subtle)]"
                  }`}
                >
                  <Calendar className="w-3.5 h-3.5 opacity-80" />
                  <span>{m.short_label}</span>
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                      isSelected
                        ? "bg-white/20 text-white"
                        : "bg-[var(--bg-surface)] text-[var(--text-muted)]"
                    }`}
                  >
                    {m.sheet_name} · {m.delivered_boxes + m.scheduled_boxes} box
                  </span>
                </button>
              );
            })}
          </div>

          {/* Workspace View Mode Switcher */}
          <div className="inline-flex items-center p-1 rounded-xl surface-well self-start lg:self-auto">
            {[
              { id: "all", label: "All-in-One Cockpit" },
              { id: "matrix", label: "L/D Schedule Matrix" },
              { id: "dispatch", label: "Daily Kitchen Prep" },
              { id: "crm", label: "Subscriber CRM" },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() =>
                  setActiveView(
                    tab.id as "matrix" | "dispatch" | "crm" | "all"
                  )
                }
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  activeView === tab.id
                    ? "bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-xs border border-[var(--border-default)]"
                    : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Feedback Toast Banner */}
      {bannerNotice && (
        <div className="cockpit-panel rounded-xl p-3.5 border-emerald-500/40 bg-emerald-500/10 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 text-xs font-semibold text-emerald-800 dark:text-emerald-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>{bannerNotice}</span>
          </div>
          <button
            type="button"
            onClick={onDismissBanner}
            className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </>
  );
}
