import React from "react";
import Link from "next/link";
import { DataFreshnessSummary } from "@/lib/queries";
import {
    CalendarClock,
  AlertCircle,
  ShoppingBag,
  UtensilsCrossed,
  Clock,
  Info,
  CheckCircle2,
  UploadCloud,
    Activity,
} from "lucide-react";

interface DataFreshnessBarProps {
  freshness: DataFreshnessSummary;
  compact?: boolean;
}

export function DataFreshnessBar({ freshness, compact = false }: DataFreshnessBarProps) {
  const { klikit, dineInPos } = freshness;
  const isPosSynced = dineInPos.orderCount > 0;

  if (compact) {
    return (
      <div className="cockpit-panel rounded-xl p-3 text-xs flex flex-wrap items-center justify-between gap-3 shadow-md">
        <div className="flex items-center gap-2">
          <Activity className="w-3.5 h-3.5 text-emerald-400" />
          <span className="font-mono uppercase text-xs tracking-wider font-semibold text-zinc-400">
            Data Streams:
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 text-xs">
          {/* Klikit Pill */}
          <div className="flex items-center gap-2 bg-white/[0.03] border border-white/[0.07] rounded-lg px-3 py-1.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-zinc-400">Klikit Delivery:</span>
            <span className="font-mono font-medium text-emerald-300">
              {klikit.orderCount.toLocaleString()} orders
            </span>
            <span className="text-zinc-500 font-mono text-xs">
              · {klikit.lastOrderFormatted.split(",")[0]}
            </span>
          </div>

          {/* POS Pill */}
          <div className="flex items-center gap-2 bg-white/[0.03] border border-white/[0.07] rounded-lg px-3 py-1.5">
            {isPosSynced ? (
              <>
                <span className="relative flex h-2 w-2">
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-zinc-400">Greenville POS:</span>
                <span className="font-mono font-medium text-emerald-300">
                  {dineInPos.orderCount.toLocaleString()} orders
                </span>
              </>
            ) : (
              <>
                <span className="h-2 w-2 rounded-full bg-amber-400/80"></span>
                <span className="text-zinc-400">Greenville POS:</span>
                <span className="font-mono text-xs text-amber-300 bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-800/40">
                  Awaiting EOD Drop
                </span>
              </>
            )}
          </div>

          <Link
            href="/ingest"
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-medium transition-colors text-xs"
          >
            <UploadCloud className="w-3.5 h-3.5 text-emerald-400" />
            <span>Drop CSV</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3.5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Card 1: Klikit Aggregator */}
        <div className="cockpit-panel rounded-2xl p-5 space-y-4 relative overflow-hidden cockpit-glow-emerald">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-white tracking-tight">
                    {klikit.sourceName}
                  </h3>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-medium bg-emerald-950/70 text-emerald-300 border border-emerald-700/50">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    LIVE PIPELINE
                  </span>
                </div>
                <p className="text-xs text-zinc-400 mt-0.5">
                  {klikit.channelType} · {klikit.branchCoverage}
                </p>
              </div>
            </div>

            <Link
              href="/ingest"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-zinc-300 hover:text-white transition-all"
            >
              <UploadCloud className="w-3.5 h-3.5 text-emerald-400" />
              <span>Upload Batch</span>
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-3 border-t border-white/[0.06] text-xs">
            <div className="bg-black/30 rounded-xl p-3 border border-white/[0.05]">
              <div className="flex items-center gap-1.5 text-xs text-zinc-400 mb-1">
                <CalendarClock className="w-3.5 h-3.5 text-emerald-400" />
                <span>Last Imported</span>
              </div>
              <div className="font-mono font-medium text-white text-xs">
                {klikit.lastImportedFormatted}
              </div>
              <div className="text-xs font-mono text-zinc-500 mt-1 truncate" title={klikit.sourceFile || ""}>
                {klikit.sourceFile || "klikit_orders.csv"}
              </div>
            </div>

            <div className="bg-black/30 rounded-xl p-3 border border-white/[0.05]">
              <div className="flex items-center gap-1.5 text-xs text-zinc-400 mb-1">
                <Clock className="w-3.5 h-3.5 text-blue-400" />
                <span>Last Transaction</span>
              </div>
              <div className="font-mono font-medium text-white text-xs">
                {klikit.lastOrderFormatted}
              </div>
              <div className="text-xs font-mono text-emerald-400 font-semibold mt-1">
                {klikit.orderCount.toLocaleString()} orders indexed
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Greenville POS (Dine-in) */}
        <div
          className={`cockpit-panel rounded-2xl p-5 space-y-4 relative overflow-hidden ${
            isPosSynced ? "cockpit-glow-emerald" : "cockpit-glow-amber"
          }`}
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div
                className={`p-2.5 rounded-xl border ${
                  isPosSynced
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                    : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                }`}
              >
                <UtensilsCrossed className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-white tracking-tight">
                    {dineInPos.sourceName}
                  </h3>
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-medium ${
                      isPosSynced
                        ? "bg-emerald-950/70 text-emerald-300 border border-emerald-700/50"
                        : "bg-amber-950/70 text-amber-300 border border-amber-700/50"
                    }`}
                  >
                    {isPosSynced ? (
                      <>
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                        SYNCED IN DUCKDB
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-3 h-3 text-amber-400" />
                        AWAITING INGESTION
                      </>
                    )}
                  </span>
                </div>
                <p className="text-xs text-zinc-400 mt-0.5">
                  {dineInPos.channelType} · {dineInPos.branchCoverage}
                </p>
              </div>
            </div>

            <Link
              href="/ingest"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-zinc-300 hover:text-white transition-all"
            >
              <UploadCloud className="w-3.5 h-3.5 text-emerald-400" />
              <span>Upload POS</span>
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-3 border-t border-white/[0.06] text-xs">
            <div className="bg-black/30 rounded-xl p-3 border border-white/[0.05]">
              <div className="flex items-center gap-1.5 text-xs text-zinc-400 mb-1">
                <CalendarClock
                  className={`w-3.5 h-3.5 ${isPosSynced ? "text-emerald-400" : "text-amber-400"}`}
                />
                <span>Last Imported</span>
              </div>
              <div
                className={`font-mono font-medium text-xs ${
                  isPosSynced ? "text-white" : "text-amber-300/90"
                }`}
              >
                {dineInPos.lastImportedFormatted}
              </div>
              <div className="text-xs font-mono text-zinc-500 mt-1 truncate" title={dineInPos.sourceFile || ""}>
                {dineInPos.sourceFile || "Awaiting POS CSV drop"}
              </div>
            </div>

            <div className="bg-black/30 rounded-xl p-3 border border-white/[0.05]">
              <div className="flex items-center gap-1.5 text-xs text-zinc-400 mb-1">
                <Clock
                  className={`w-3.5 h-3.5 ${isPosSynced ? "text-blue-400" : "text-amber-400"}`}
                />
                <span>Last Transaction</span>
              </div>
              <div className={`font-mono font-medium text-xs ${isPosSynced ? "text-white" : "text-zinc-500"}`}>
                {dineInPos.lastOrderFormatted}
              </div>
              <div
                className={`text-xs font-mono font-semibold mt-1 ${
                  isPosSynced ? "text-emerald-400" : "text-amber-400/80"
                }`}
              >
                {isPosSynced
                  ? `${dineInPos.orderCount.toLocaleString()} orders indexed`
                  : "0 dine-in orders"}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Operational Notice Banner */}
      {isPosSynced ? (
        <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-emerald-950/25 border border-emerald-800/35 text-emerald-200/90 text-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="leading-relaxed">
            <strong className="text-emerald-300 font-semibold font-mono">Consolidated Multi-Channel Stream:</strong>{" "}
            Online delivery orders (Klikit) and Greenville direct POS tickets are unified in DuckDB.
            Floor managers can upload additional EOD closures at{" "}
            <Link href="/ingest" className="underline font-semibold hover:text-white">
              /ingest
            </Link>
            .
          </span>
        </div>
      ) : (
        <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-amber-950/20 border border-amber-800/35 text-amber-200/90 text-xs">
          <Info className="w-4 h-4 text-amber-400 shrink-0" />
          <span className="leading-relaxed">
            <strong className="text-amber-300 font-semibold font-mono">Channel Coverage Note:</strong>{" "}
            Current telemetry reflects online delivery channels (GrabFood & GoFood).
            Greenville offline dine-in & takeaway register sales will merge seamlessly when uploaded at{" "}
            <Link href="/ingest" className="underline font-semibold hover:text-white">
              /ingest
            </Link>
            .
          </span>
        </div>
      )}
    </div>
  );
}
