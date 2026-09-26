"use client";

import React, { useState, useTransition } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Calendar, MapPin, RotateCcw, Check,  SlidersHorizontal } from "lucide-react";

interface FilterBarProps {
  initialBranch?: string;
  initialRange?: string;
  initialFrom?: string;
  initialTo?: string;
}

const BRANCHES = [
  { id: "all", label: "All Outlets", badge: "Consolidated", dot: "bg-zinc-400" },
  { id: "greenville", label: "Greenville", badge: "Dine-in & Delivery", dot: "bg-emerald-400" },
  { id: "kemang", label: "Kemang", badge: "Ghost Kitchen", dot: "bg-purple-400" },
];

const DATE_PRESETS = [
  { id: "all", label: "All Time" },
  { id: "30d", label: "30 Days" },
  { id: "7d", label: "7 Days" },
  { id: "yesterday", label: "Yesterday (T-1)" },
  { id: "today", label: "Today" },
  { id: "custom", label: "Custom Range" },
];

export function FilterBar({
  initialBranch = "all",
  initialRange = "all",
  initialFrom = "",
  initialTo = "",
}: FilterBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const currentBranch = searchParams.get("branch") || initialBranch;
  const currentRange = searchParams.get("range") || initialRange;
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
      if (updates.range === "all") {
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
    currentBranch !== "all" || currentRange !== "all" || Boolean(searchParams.get("from"));

  return (
    <div className="cockpit-panel rounded-2xl p-4 sm:p-5 space-y-3.5">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Left: Branch Filter Pills */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2.5">
          <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-zinc-400 shrink-0">
            <MapPin className="w-3.5 h-3.5 text-emerald-400" />
            <span>Outlet:</span>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            {BRANCHES.map((b) => {
              const isActive = currentBranch.toLowerCase() === b.id.toLowerCase();
              return (
                <button
                  key={b.id}
                  onClick={() => handleBranchChange(b.id)}
                  disabled={isPending}
                  className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                    isActive
                      ? "bg-white/[0.12] text-white border border-white/25 shadow-sm"
                      : "bg-white/[0.03] hover:bg-white/[0.07] text-zinc-400 hover:text-zinc-200 border border-white/[0.06]"
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full transition-transform ${b.dot} ${
                      isActive ? "scale-125" : "opacity-60"
                    }`}
                  />
                  <span>{b.label}</span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded font-medium ${
                      isActive
                        ? "bg-white/10 text-zinc-200"
                        : "bg-white/[0.04] text-zinc-500"
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
          <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-zinc-400 shrink-0">
            <Calendar className="w-3.5 h-3.5 text-blue-400" />
            <span>Period:</span>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            {DATE_PRESETS.map((d) => {
              const isActive = currentRange.toLowerCase() === d.id.toLowerCase();
              return (
                <button
                  key={d.id}
                  onClick={() => handleRangeChange(d.id)}
                  disabled={isPending}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                    isActive
                      ? "bg-blue-500/20 text-blue-200 border border-blue-400/40 shadow-sm"
                      : "bg-white/[0.03] hover:bg-white/[0.07] text-zinc-400 hover:text-zinc-200 border border-white/[0.06]"
                  }`}
                >
                  {isActive && <Check className="w-3 h-3 text-blue-300 stroke-[2.5]" />}
                  <span>{d.label}</span>
                </button>
              );
            })}

            {hasActiveFilters && (
              <button
                onClick={handleReset}
                disabled={isPending}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-medium text-rose-300 hover:text-rose-200 bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/40 transition-colors ml-1 cursor-pointer"
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
          className="flex flex-wrap items-center gap-3 pt-3 border-t border-white/[0.06] text-xs"
        >
          <span className="text-zinc-400 font-mono text-[11px] uppercase tracking-wider">
            Custom Horizon:
          </span>
          <div className="flex items-center gap-2">
            <label className="text-zinc-500 text-[11px] font-mono">From</label>
            <input
              type="date"
              value={customFrom}
              onChange={(e) => setCustomFrom(e.target.value)}
              className="bg-zinc-900/90 border border-white/[0.1] text-zinc-200 rounded-lg px-2.5 py-1 text-xs focus:outline-none focus:border-blue-400/60 focus:ring-1 focus:ring-blue-400/30"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-zinc-500 text-[11px] font-mono">To</label>
            <input
              type="date"
              value={customTo}
              onChange={(e) => setCustomTo(e.target.value)}
              className="bg-zinc-900/90 border border-white/[0.1] text-zinc-200 rounded-lg px-2.5 py-1 text-xs focus:outline-none focus:border-blue-400/60 focus:ring-1 focus:ring-blue-400/30"
            />
          </div>
          <button
            type="submit"
            className="px-3.5 py-1 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-400/40 text-blue-200 rounded-lg font-medium transition-colors cursor-pointer"
          >
            Apply Horizon
          </button>
        </form>
      )}

      {/* Filter Status Badge */}
      <div className="flex items-center justify-between text-[11px] text-zinc-500 border-t border-white/[0.06] pt-2.5">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-3 h-3 text-emerald-400" />
          <span>
            Active Scope:{" "}
            <strong className="text-zinc-300 font-medium font-mono">
              {BRANCHES.find((b) => b.id === currentBranch.toLowerCase())?.label || currentBranch}
            </strong>
            {" · "}
            Horizon:{" "}
            <strong className="text-zinc-300 font-medium font-mono">
              {currentRange === "custom" && customFrom && customTo
                ? `${customFrom} → ${customTo}`
                : DATE_PRESETS.find((d) => d.id === currentRange.toLowerCase())?.label || currentRange}
            </strong>
          </span>
          {isPending && (
            <span className="text-amber-400 animate-pulse font-mono text-xs ml-1">
              Updating metrics...
            </span>
          )}
        </div>
        <div className="text-xs text-zinc-500 font-mono hidden sm:flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400/80 animate-pulse" />
          <span>DuckDB In-Memory Analytics</span>
        </div>
      </div>
    </div>
  );
}
