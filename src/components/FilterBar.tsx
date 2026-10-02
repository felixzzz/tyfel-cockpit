"use client";

import React, { useState, useTransition } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Calendar, MapPin, RotateCcw, Check } from "lucide-react";

interface FilterBarProps {
  initialBranch?: string;
  initialRange?: string;
  initialFrom?: string;
  initialTo?: string;
}

const BRANCHES = [
  { id: "all", label: "All Outlets", badge: "Consolidated", dot: "bg-[var(--text-muted)]" },
  { id: "greenville", label: "Greenville", badge: "Dine-in & Deliv", dot: "bg-emerald-500" },
  { id: "kemang", label: "Kemang", badge: "Cloud Kitchen", dot: "bg-purple-500" },
];

const DATE_PRESETS = [
  { id: "7d", label: "7 Days" },
  { id: "30d", label: "30 Days" },
  { id: "today", label: "Today" },
  { id: "yesterday", label: "Yesterday" },
  { id: "all", label: "All Time" },
  { id: "custom", label: "Custom" },
];

export function FilterBar({
  initialBranch = "all",
  initialRange = "7d",
  initialFrom = "",
  initialTo = "",
}: FilterBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const currentBranch = searchParams.get("branch") || initialBranch;
  const currentRange =
    searchParams.get("range") ||
    (searchParams.get("from") || searchParams.get("to") ? "custom" : initialRange);
  const [customFrom, setCustomFrom] = useState(searchParams.get("from") || initialFrom || "");
  const [customTo, setCustomTo] = useState(searchParams.get("to") || initialTo || "");
  const [showCustomInputs, setShowCustomInputs] = useState(
    currentRange === "custom" || Boolean(searchParams.get("from"))
  );

  const updateFilters = (updates: { branch?: string; range?: string; from?: string; to?: string }) => {
    const params = new URLSearchParams(searchParams.toString());

    if (updates.branch !== undefined) {
      if (updates.branch === "all") params.delete("branch");
      else params.set("branch", updates.branch);
    }

    if (updates.range !== undefined) {
      if (updates.range === "7d") {
        params.delete("range");
        params.delete("from");
        params.delete("to");
      } else if (updates.range === "custom") {
        params.set("range", "custom");
        if (updates.from) params.set("from", updates.from);
        if (updates.to) params.set("to", updates.to);
      } else {
        params.set("range", updates.range);
        params.delete("from");
        params.delete("to");
      }
    }

    if (updates.from !== undefined) {
      if (updates.from) params.set("from", updates.from);
      else params.delete("from");
    }

    if (updates.to !== undefined) {
      if (updates.to) params.set("to", updates.to);
      else params.delete("to");
    }

    startTransition(() => {
      const qs = params.toString();
      router.push(qs ? pathname + "?" + qs : pathname);
    });
  };

  const handleBranchChange = (branchId: string) => {
    updateFilters({ branch: branchId });
  };

  const handleRangeChange = (rangeId: string) => {
    if (rangeId === "custom") {
      setShowCustomInputs(true);
      updateFilters({ range: "custom", from: customFrom, to: customTo });
    } else {
      setShowCustomInputs(false);
      updateFilters({ range: rangeId });
    }
  };

  const handleApplyCustomDates = (e: React.FormEvent) => {
    e.preventDefault();
    if (customFrom && customTo) {
      updateFilters({ range: "custom", from: customFrom, to: customTo });
    }
  };

  const handleReset = () => {
    setCustomFrom("");
    setCustomTo("");
    setShowCustomInputs(false);
    startTransition(() => {
      router.push(pathname);
    });
  };

  const hasActiveFilters =
    currentBranch !== "all" || currentRange !== "7d" || Boolean(searchParams.get("from"));

  return (
    <div className="cockpit-panel rounded-2xl p-3.5 sm:p-4 space-y-3">
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3.5">
        {/* Left: Outlet Selector */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2.5">
          <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] shrink-0">
            <MapPin className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
            <span>Outlet</span>
          </div>
          <div className="inline-flex flex-wrap items-center gap-1 p-1 rounded-xl bg-[var(--bg-surface-2)] border border-[var(--border-subtle)]">
            {BRANCHES.map((b) => {
              const isActive = currentBranch.toLowerCase() === b.id.toLowerCase();
              return (
                <button
                  key={b.id}
                  onClick={() => handleBranchChange(b.id)}
                  disabled={isPending}
                  className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    isActive
                      ? "bg-[var(--bg-surface)] text-[var(--text-primary)] border border-[var(--border-default)] shadow-2xs"
                      : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full transition-transform ${b.dot} ${
                      isActive ? "scale-125" : "opacity-60"
                    }`}
                  />
                  <span>{b.label}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded font-mono hidden sm:inline ${
                      isActive
                        ? "bg-[var(--accent-primary-soft)] text-[var(--accent-primary)] font-semibold"
                        : "text-[var(--text-muted)]"
                    }`}
                  >
                    {b.badge}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Date Range Pills */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2.5">
          <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] shrink-0">
            <Calendar className="w-3.5 h-3.5 text-[var(--accent-secondary)]" />
            <span>Horizon</span>
          </div>
          <div className="inline-flex flex-wrap items-center gap-1 p-1 rounded-xl bg-[var(--bg-surface-2)] border border-[var(--border-subtle)]">
            {DATE_PRESETS.map((d) => {
              const isActive = currentRange.toLowerCase() === d.id.toLowerCase();
              return (
                <button
                  key={d.id}
                  onClick={() => handleRangeChange(d.id)}
                  disabled={isPending}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    isActive
                      ? "bg-[var(--accent-primary)] text-white shadow-2xs"
                      : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                  }`}
                >
                  {isActive && <Check className="w-3 h-3 stroke-[2.5]" />}
                  <span>{d.label}</span>
                </button>
              );
            })}

            {hasActiveFilters && (
              <button
                onClick={handleReset}
                disabled={isPending}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold badge-rose transition-colors ml-1 cursor-pointer"
                title="Reset all filters to defaults"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Custom Date Range Picker Inputs */}
      {showCustomInputs && (
        <form
          onSubmit={handleApplyCustomDates}
          className="flex flex-wrap items-center gap-3 pt-3 border-t border-[var(--border-subtle)] text-xs"
        >
          <span className="text-[var(--text-secondary)] font-mono text-[11px] uppercase tracking-wider font-semibold">
            Custom Window:
          </span>
          <div className="flex items-center gap-2">
            <label className="text-[var(--text-muted)] text-[11px] font-mono">From</label>
            <input
              type="date"
              value={customFrom}
              onChange={(e) => setCustomFrom(e.target.value)}
              className="bg-[var(--bg-surface-2)] border border-[var(--border-default)] text-[var(--text-primary)] rounded-lg px-2.5 py-1 text-xs focus:outline-none focus:border-[var(--accent-primary)]"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-[var(--text-muted)] text-[11px] font-mono">To</label>
            <input
              type="date"
              value={customTo}
              onChange={(e) => setCustomTo(e.target.value)}
              className="bg-[var(--bg-surface-2)] border border-[var(--border-default)] text-[var(--text-primary)] rounded-lg px-2.5 py-1 text-xs focus:outline-none focus:border-[var(--accent-primary)]"
            />
          </div>
          <button
            type="submit"
            className="px-3.5 py-1.5 bg-[var(--accent-primary)] hover:bg-[var(--accent-primary-hover)] text-white rounded-lg font-semibold transition-colors cursor-pointer"
          >
            Apply Dates
          </button>
        </form>
      )}

      {isPending && (
        <div className="text-[11px] font-mono text-[var(--accent-secondary)] animate-pulse pt-1">
          Refreshing operational telemetry...
        </div>
      )}
    </div>
  );
}
