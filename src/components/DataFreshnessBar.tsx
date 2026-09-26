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
  const { klikit, dineInPos, itemCoverage } = freshness;
  const isPosSynced = dineInPos.orderCount > 0;
  const coveragePct = itemCoverage?.orderCoveragePct ?? 100;
  const orphanCount = itemCoverage?.orphanOrdersCount ?? 0;

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

          {/* Order-to-Item Coverage Pill */}
          {itemCoverage && (
            <div className="flex items-center gap-2 bg-white/[0.03] border border-white/[0.07] rounded-lg px-3 py-1.5">
              <span
                className={`h-2 w-2 rounded-full ${
                  coveragePct >= 95 ? "bg-emerald-500" : "bg-amber-400"
                }`}
              />
              <span className="text-zinc-400">Item BOM Linkage:</span>
              <span
                className={`font-mono font-medium ${
                  coveragePct >= 95 ? "text-emerald-300" : "text-amber-300"
                }`}
              >
                {coveragePct}% ({itemCoverage.ordersWithItems.toLocaleString()}/{itemCoverage.totalOrders.toLocaleString()})
              </span>
            </div>
          )}

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

      {/* Track A: Order-to-Item Coverage & Reconciliation Audit Banner */}
      {itemCoverage && (
        <div
          className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 rounded-xl border text-xs ${
            orphanCount === 0
              ? "bg-emerald-950/20 border-emerald-800/35 text-emerald-200/90"
              : "bg-amber-950/20 border-amber-800/40 text-amber-200/90"
          }`}
        >
          <div className="flex items-start sm:items-center gap-3">
            {orphanCount === 0 ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5 sm:mt-0" />
            ) : (
              <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5 sm:mt-0" />
            )}
            <div className="leading-relaxed">
              <strong
                className={`font-semibold font-mono ${
                  orphanCount === 0 ? "text-emerald-300" : "text-amber-300"
                }`}
              >
                Order-to-Item BOM Reconciliation ({coveragePct}% Coverage):
              </strong>{" "}
              <span className="font-mono text-white font-semibold">
                {itemCoverage.ordersWithItems.toLocaleString()}
              </span>{" "}
              of{" "}
              <span className="font-mono text-white font-semibold">
                {itemCoverage.totalOrders.toLocaleString()}
              </span>{" "}
              orders have full SKU line-item breakdowns ({itemCoverage.totalItemRows.toLocaleString()} item rows ·{" "}
              {itemCoverage.totalUnitsSold.toLocaleString()} units sold).
              {orphanCount > 0 && (
                <span className="text-amber-300 ml-1">
                  · <strong>{orphanCount.toLocaleString()} delivery orders</strong> are awaiting their matching Klikit Items CSV export.
                </span>
              )}
            </div>
          </div>

          <Link
            href="/ingest"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.1] text-white font-mono text-[11px] shrink-0 transition-colors self-start sm:self-auto"
          >
            <span>Reconciliation Audit</span>
            <UploadCloud className="w-3.5 h-3.5 text-emerald-400" />
          </Link>
        </div>
      )}
    </div>
  );
}
