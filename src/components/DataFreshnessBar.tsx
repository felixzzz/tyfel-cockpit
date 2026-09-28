"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import type {
  DataFreshnessSummary,
  ExecutiveSummary,
  PrimeCostSummary,
  BrandStats,
} from "@/lib/queries";
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
  FileText,
  Copy,
  Check,
  Download,
} from "lucide-react";

export interface EodDigestContext {
  summary: ExecutiveSummary;
  primeCost?: PrimeCostSummary;
  brands?: BrandStats[];
  filterLabel?: string;
}

interface DataFreshnessBarProps {
  freshness: DataFreshnessSummary;
  compact?: boolean;
  digestContext?: EodDigestContext;
}

function formatRp(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function DataFreshnessBar({
  freshness,
  compact = false,
  digestContext,
}: DataFreshnessBarProps) {
  const { klikit, dineInPos, itemCoverage } = freshness;
  const isPosSynced = dineInPos.orderCount > 0;
  const coveragePct = itemCoverage?.orderCoveragePct ?? 100;
  const orphanCount = itemCoverage?.orphanOrdersCount ?? 0;

  const [digestOpen, setDigestOpen] = useState(false);
  const [digestFormat, setDigestFormat] = useState<"whatsapp" | "markdown">("whatsapp");
  const [copied, setCopied] = useState(false);

  const generatedDigestText = useMemo(() => {
    if (!digestContext) return "";
    const { summary, primeCost, brands = [], filterLabel = "All Branches · Active Window" } =
      digestContext;

    // Aggregate brands across branches
    const brandMap = new Map<
      string,
      { orders: number; gmv: number; net: number; promo: number; slaBreaches: number }
    >();
    for (const b of brands) {
      const prev = brandMap.get(b.brand) || {
        orders: 0,
        gmv: 0,
        net: 0,
        promo: 0,
        slaBreaches: 0,
      };
      prev.orders += Number(b.order_count);
      prev.gmv += Number(b.gross_gmv);
      prev.net += Number(b.net_payout);
      prev.promo += Number(b.merchant_promo_burn);
      prev.slaBreaches += Number(b.sla_breaches);
      brandMap.set(b.brand, prev);
    }
    const topBrands = Array.from(brandMap.entries())
      .map(([name, stats]) => ({ name, ...stats }))
      .sort((a, b) => b.gmv - a.gmv);

    const gmvDeltaStr =
      summary.deltas?.gmvDeltaPct !== null && summary.deltas?.gmvDeltaPct !== undefined
        ? ` (${summary.deltas.gmvDeltaPct >= 0 ? "+" : ""}${summary.deltas.gmvDeltaPct}% ${summary.deltas.comparisonLabel})`
        : "";

    const ordersDeltaStr =
      summary.deltas?.ordersDeltaPct !== null && summary.deltas?.ordersDeltaPct !== undefined
        ? ` (${summary.deltas.ordersDeltaPct >= 0 ? "+" : ""}${summary.deltas.ordersDeltaPct}%)`
        : "";

    if (digestFormat === "whatsapp") {
      const lines: string[] = [
        `*F&B OPS EOD EXECUTIVE DIGEST*`,
        `Scope: ${filterLabel}`,
        `Data Coverage: ${freshness.overallCoverage}`,
        `────────────────────────`,
        `*1. PORTFOLIO REVENUE & REALIZATION*`,
        `• Gross GMV: *${formatRp(summary.total_gross_gmv)}*${gmvDeltaStr}`,
        `• Net Settlement: *${formatRp(summary.total_net_payout)}* (${summary.net_realization_rate}% realized)`,
        `• Completed Orders: *${summary.total_orders.toLocaleString()} tickets*${ordersDeltaStr} (AOV: ${formatRp(summary.avg_order_value)})`,
        `• Promo Burn: *${formatRp(summary.total_merchant_promo_burn)}* (${summary.promo_burn_rate_pct}% of GMV)`,
      ];

      if (primeCost) {
        lines.push(
          `────────────────────────`,
          `*2. STORE P&L & PRIME COST BRIDGE*`,
          `• Theoretical COGS (Food + Pkg): *${formatRp(primeCost.totalCogs)}* (${primeCost.cogsPctOfNetRevenue}% of Net)`,
          primeCost.laborIncluded
            ? `• Store Labor (${primeCost.paidShiftsCount} shifts · ${primeCost.activeStaffCount} staff): *${formatRp(primeCost.netLaborCost)}* (${primeCost.laborPctOfNetRevenue}% of Net)`
            : `• Store Labor: _Excluded for Kemang-only filter_`,
          `• Total Prime Cost: *${formatRp(primeCost.primeCost)}* (${primeCost.primeCostPctOfNetRevenue}% of Net · ${primeCost.primeCostStatus})`,
          `• Store Net Contribution Margin: *${formatRp(primeCost.netContributionMarginRp)}* (*${primeCost.netContributionMarginPct}%* of Net)`
        );
      }

      lines.push(
        `────────────────────────`,
        `*3. KITCHEN SLA & CANCELLATION HYGIENE*`,
        `• Avg Prep Time: *${summary.avg_prep_time_minutes} min*`,
        `• SLA Breaches: *${summary.sla_breach_count}* (${summary.sla_breach_rate_pct}%) · Red Alerts (>20m): *${summary.red_alert_count}*`,
        `• Cancelled Tickets: *${summary.cancelled_orders_count}* (${summary.cancellation_rate_pct}% rate · Lost GMV: ${formatRp(summary.cancelled_gross_gmv)})`
      );

      if (topBrands.length > 0) {
        lines.push(`────────────────────────`, `*4. BRAND LEADERBOARD*`);
        topBrands.forEach((b, idx) => {
          const netPct = b.gmv > 0 ? ((b.net / b.gmv) * 100).toFixed(1) : "0";
          lines.push(
            `${idx + 1}. *${b.name}*: ${formatRp(b.gmv)} GMV | ${formatRp(b.net)} Net (${netPct}%) | ${b.orders} ord`
          );
        });
      }

      return lines.join("\n");
    }

    // Markdown format
    const mdLines: string[] = [
      `# F&B Operations Cockpit — EOD Executive Digest`,
      `- **Filter Scope**: ${filterLabel}`,
      `- **Transaction Window**: ${freshness.overallCoverage}`,
      `- **Klikit Delivery**: ${klikit.orderCount.toLocaleString()} orders (${klikit.lastOrderFormatted})`,
      `- **Greenville POS**: ${dineInPos.orderCount.toLocaleString()} orders (${dineInPos.lastOrderFormatted})`,
      ``,
      `## 1. Executive Revenue & Realization`,
      `| Metric | Value | Benchmark / Delta |`,
      `| :--- | :--- | :--- |`,
      `| **Gross GMV** | ${formatRp(summary.total_gross_gmv)} | ${gmvDeltaStr || "Baseline"} |`,
      `| **Net Settlement** | ${formatRp(summary.total_net_payout)} | ${summary.net_realization_rate}% Realization |`,
      `| **Completed Orders** | ${summary.total_orders.toLocaleString()} tickets | AOV ${formatRp(summary.avg_order_value)}${ordersDeltaStr} |`,
      `| **Merchant Promo Burn** | ${formatRp(summary.total_merchant_promo_burn)} | ${summary.promo_burn_rate_pct}% of Gross GMV |`,
      `| **Kitchen SLA Breaches** | ${summary.sla_breach_count} (${summary.sla_breach_rate_pct}%) | Avg Prep: ${summary.avg_prep_time_minutes}m · ${summary.red_alert_count} Red Alerts |`,
      `| **Cancelled Orders** | ${summary.cancelled_orders_count} (${summary.cancellation_rate_pct}%) | Lost GMV: ${formatRp(summary.cancelled_gross_gmv)} |`,
    ];

    if (primeCost) {
      mdLines.push(
        ``,
        `## 2. Store P&L & Prime Cost Bridge (${primeCost.dateSpanLabel})`,
        `| P&L Line Item | Amount (IDR) | % of Net Revenue |`,
        `| :--- | :--- | :--- |`,
        `| **Net Realized Revenue** | **${formatRp(primeCost.netRevenue)}** | **100.0%** |`,
        `| Raw Food Cost (Theoretical BOM) | (${formatRp(primeCost.rawFoodCost)}) | ${primeCost.netRevenue > 0 ? ((primeCost.rawFoodCost / primeCost.netRevenue) * 100).toFixed(1) : 0}% |`,
        `| Packaging Cost (Dine-in + Delivery) | (${formatRp(primeCost.packagingCost)}) | ${primeCost.netRevenue > 0 ? ((primeCost.packagingCost / primeCost.netRevenue) * 100).toFixed(1) : 0}% |`,
        `| **Gross Margin After COGS** | **${formatRp(primeCost.grossMarginAfterCogs)}** | **${primeCost.grossMarginAfterCogsPct}%** |`,
        `| Net Store Labor (${primeCost.paidShiftsCount} shifts, ${primeCost.activeStaffCount} staff) | (${formatRp(primeCost.netLaborCost)}) | ${primeCost.laborPctOfNetRevenue}% |`,
        `| **Total Prime Cost (COGS + Labor)** | **(${formatRp(primeCost.primeCost)})** | **${primeCost.primeCostPctOfNetRevenue}% (${primeCost.primeCostStatus})** |`,
        `| **Store Net Contribution Margin** | **${formatRp(primeCost.netContributionMarginRp)}** | **${primeCost.netContributionMarginPct}%** |`
      );
    }

    if (topBrands.length > 0) {
      mdLines.push(
        ``,
        `## 3. Brand Performance Breakdown`,
        `| Brand | Orders | Gross GMV | Net Payout | Promo Burn | SLA Breaches |`,
        `| :--- | :---: | :---: | :---: | :---: | :---: |`
      );
      for (const b of topBrands) {
        mdLines.push(
          `| **${b.name}** | ${b.orders} | ${formatRp(b.gmv)} | ${formatRp(b.net)} | ${formatRp(b.promo)} | ${b.slaBreaches} |`
        );
      }
    }

    return mdLines.join("\n");
  }, [digestContext, digestFormat, freshness.overallCoverage, klikit, dineInPos]);

  const handleCopyDigest = async () => {
    if (!generatedDigestText) return;
    try {
      await navigator.clipboard.writeText(generatedDigestText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // ignore
    }
  };

  const handleDownloadMarkdown = () => {
    if (!generatedDigestText) return;
    const blob = new Blob([generatedDigestText], { type: "text/markdown;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `fnb-ops-eod-digest-${new Date().toISOString().slice(0, 10)}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (compact) {
    return (
      <>
        <div className="cockpit-panel rounded-xl p-3 text-xs flex flex-wrap items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-2">
            <Activity className="w-3.5 h-3.5 text-emerald-500" />
            <span className="font-mono uppercase text-xs tracking-wider font-semibold text-[var(--text-secondary)]">
              Data Streams:
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 text-xs">
            {/* Klikit Pill */}
            <div className="flex items-center gap-2 surface-well rounded-lg px-3 py-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-[var(--text-secondary)]">Klikit Delivery:</span>
              <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-300">
                {klikit.orderCount.toLocaleString()} orders
              </span>
              <span className="text-[var(--text-muted)] font-mono text-xs">
                · {klikit.lastOrderFormatted.split(",")[0]}
              </span>
            </div>

            {/* POS Pill */}
            <div className="flex items-center gap-2 surface-well rounded-lg px-3 py-1.5">
              {isPosSynced ? (
                <>
                  <span className="relative flex h-2 w-2">
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span className="text-[var(--text-secondary)]">Greenville POS:</span>
                  <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-300">
                    {dineInPos.orderCount.toLocaleString()} orders
                  </span>
                </>
              ) : (
                <>
                  <span className="h-2 w-2 rounded-full bg-amber-500"></span>
                  <span className="text-[var(--text-secondary)]">Greenville POS:</span>
                  <span className="font-mono text-xs badge-amber px-1.5 py-0.5 rounded">
                    Awaiting EOD Drop
                  </span>
                </>
              )}
            </div>

            {/* Order-to-Item Coverage Pill */}
            {itemCoverage && (
              <div className="flex items-center gap-2 surface-well rounded-lg px-3 py-1.5">
                <span
                  className={`h-2 w-2 rounded-full ${
                    coveragePct >= 95 ? "bg-emerald-500" : "bg-amber-500"
                  }`}
                />
                <span className="text-[var(--text-secondary)]">Item BOM Linkage:</span>
                <span
                  className={`font-mono font-semibold ${
                    coveragePct >= 95
                      ? "text-emerald-600 dark:text-emerald-300"
                      : "text-amber-600 dark:text-amber-300"
                  }`}
                >
                  {coveragePct}% ({itemCoverage.ordersWithItems.toLocaleString()}/
                  {itemCoverage.totalOrders.toLocaleString()})
                </span>
              </div>
            )}

            {digestContext && (
              <button
                type="button"
                onClick={() => setDigestOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg badge-sky hover:opacity-90 font-mono font-semibold transition-opacity text-xs cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>EOD Digest</span>
              </button>
            )}

            <Link
              href="/ingest"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg badge-emerald hover:opacity-90 font-medium transition-opacity text-xs"
            >
              <UploadCloud className="w-3.5 h-3.5" />
              <span>Drop CSV</span>
            </Link>
          </div>
        </div>
        {digestOpen && digestContext && (
          <EodDigestModal
            onClose={() => setDigestOpen(false)}
            digestFormat={digestFormat}
            setDigestFormat={setDigestFormat}
            text={generatedDigestText}
            copied={copied}
            onCopy={handleCopyDigest}
            onDownload={handleDownloadMarkdown}
          />
        )}
      </>
    );
  }

  return (
    <div className="space-y-3.5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Card 1: Klikit Aggregator */}
        <div className="cockpit-panel rounded-2xl p-5 space-y-4 relative overflow-hidden cockpit-glow-emerald">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-500">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-sm font-semibold text-[var(--text-primary)] tracking-tight">
                    {klikit.sourceName}
                  </h3>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-semibold badge-emerald">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    LIVE PIPELINE
                  </span>
                </div>
                <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                  {klikit.channelType} · {klikit.branchCoverage}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {digestContext && (
                <button
                  type="button"
                  onClick={() => setDigestOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono font-semibold badge-sky hover:opacity-90 transition-all cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>EOD Digest</span>
                </button>
              )}
              <Link
                href="/ingest"
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium surface-well hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all"
              >
                <UploadCloud className="w-3.5 h-3.5 text-emerald-500" />
                <span>Upload Batch</span>
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-3 border-t border-[var(--border-subtle)] text-xs">
            <div className="surface-well rounded-xl p-3">
              <div className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)] mb-1">
                <CalendarClock className="w-3.5 h-3.5 text-emerald-500" />
                <span>Last Imported</span>
              </div>
              <div className="font-mono font-semibold text-[var(--text-primary)] text-xs">
                {klikit.lastImportedFormatted}
              </div>
              <div
                className="text-[11px] font-mono text-[var(--text-muted)] mt-1 truncate"
                title={klikit.sourceFile || ""}
              >
                {klikit.sourceFile || "klikit_orders.csv"}
              </div>
            </div>

            <div className="surface-well rounded-xl p-3">
              <div className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)] mb-1">
                <Clock className="w-3.5 h-3.5 text-sky-500" />
                <span>Last Transaction</span>
              </div>
              <div className="font-mono font-semibold text-[var(--text-primary)] text-xs">
                {klikit.lastOrderFormatted}
              </div>
              <div className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold mt-1">
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
                    ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                    : "bg-amber-500/10 text-amber-500 border-amber-500/20"
                }`}
              >
                <UtensilsCrossed className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-sm font-semibold text-[var(--text-primary)] tracking-tight">
                    {dineInPos.sourceName}
                  </h3>
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-semibold ${
                      isPosSynced ? "badge-emerald" : "badge-amber"
                    }`}
                  >
                    {isPosSynced ? (
                      <>
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        SYNCED IN DB
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-3 h-3" />
                        AWAITING INGESTION
                      </>
                    )}
                  </span>
                </div>
                <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                  {dineInPos.channelType} · {dineInPos.branchCoverage}
                </p>
              </div>
            </div>

            <Link
              href="/ingest"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium surface-well hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all"
            >
              <UploadCloud className="w-3.5 h-3.5 text-emerald-500" />
              <span>Upload POS</span>
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-3 border-t border-[var(--border-subtle)] text-xs">
            <div className="surface-well rounded-xl p-3">
              <div className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)] mb-1">
                <CalendarClock
                  className={`w-3.5 h-3.5 ${isPosSynced ? "text-emerald-500" : "text-amber-500"}`}
                />
                <span>Last Imported</span>
              </div>
              <div
                className={`font-mono font-semibold text-xs ${
                  isPosSynced ? "text-[var(--text-primary)]" : "text-amber-600 dark:text-amber-300"
                }`}
              >
                {dineInPos.lastImportedFormatted}
              </div>
              <div
                className="text-[11px] font-mono text-[var(--text-muted)] mt-1 truncate"
                title={dineInPos.sourceFile || ""}
              >
                {dineInPos.sourceFile || "Awaiting POS CSV drop"}
              </div>
            </div>

            <div className="surface-well rounded-xl p-3">
              <div className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)] mb-1">
                <Clock
                  className={`w-3.5 h-3.5 ${isPosSynced ? "text-sky-500" : "text-amber-500"}`}
                />
                <span>Last Transaction</span>
              </div>
              <div
                className={`font-mono font-semibold text-xs ${
                  isPosSynced ? "text-[var(--text-primary)]" : "text-[var(--text-muted)]"
                }`}
              >
                {dineInPos.lastOrderFormatted}
              </div>
              <div
                className={`text-[11px] font-mono font-semibold mt-1 ${
                  isPosSynced
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-amber-600 dark:text-amber-400"
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
            orphanCount === 0 ? "badge-emerald" : "badge-amber"
          }`}
        >
          <div className="flex items-start sm:items-center gap-3">
            {orphanCount === 0 ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 sm:mt-0" />
            ) : (
              <Info className="w-4 h-4 shrink-0 mt-0.5 sm:mt-0" />
            )}
            <div className="leading-relaxed text-[var(--text-primary)]">
              <strong className="font-semibold font-mono">
                Order-to-Item BOM Reconciliation ({coveragePct}% Coverage):
              </strong>{" "}
              <span className="font-mono font-bold">
                {itemCoverage.ordersWithItems.toLocaleString()}
              </span>{" "}
              of{" "}
              <span className="font-mono font-bold">
                {itemCoverage.totalOrders.toLocaleString()}
              </span>{" "}
              orders have full SKU line-item breakdowns (
              {itemCoverage.totalItemRows.toLocaleString()} item rows ·{" "}
              {itemCoverage.totalUnitsSold.toLocaleString()} units sold).
              {orphanCount > 0 && (
                <span className="ml-1">
                  · <strong>{orphanCount.toLocaleString()} delivery orders</strong> are awaiting
                  their matching Klikit Items CSV export.
                </span>
              )}
            </div>
          </div>

          <Link
            href="/ingest"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--bg-surface)] hover:bg-[var(--bg-hover)] border border-[var(--border-default)] text-[var(--text-primary)] font-mono text-[11px] font-semibold shrink-0 transition-colors self-start sm:self-auto"
          >
            <span>Reconciliation Audit</span>
            <UploadCloud className="w-3.5 h-3.5 text-emerald-500" />
          </Link>
        </div>
      )}

      {digestOpen && digestContext && (
        <EodDigestModal
          onClose={() => setDigestOpen(false)}
          digestFormat={digestFormat}
          setDigestFormat={setDigestFormat}
          text={generatedDigestText}
          copied={copied}
          onCopy={handleCopyDigest}
          onDownload={handleDownloadMarkdown}
        />
      )}
    </div>
  );
}

function EodDigestModal({
  onClose,
  digestFormat,
  setDigestFormat,
  text,
  copied,
  onCopy,
  onDownload,
}: {
  onClose: () => void;
  digestFormat: "whatsapp" | "markdown";
  setDigestFormat: (f: "whatsapp" | "markdown") => void;
  text: string;
  copied: boolean;
  onCopy: () => void;
  onDownload: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="cockpit-panel rounded-2xl border border-[var(--border-strong)] shadow-2xl w-full max-w-2xl overflow-hidden bg-[var(--bg-surface)]">
        <div className="px-5 py-4 border-b border-[var(--border-default)] flex items-center justify-between gap-3 bg-[var(--bg-elevated)]/60">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 rounded badge-sky font-semibold">
              Track 5 · Executive Telemetry Export
            </span>
            <h3 className="text-base font-bold text-[var(--text-primary)] mt-1">
              1-Click EOD Operational &amp; P&amp;L Digest
            </h3>
            <p className="text-xs text-[var(--text-secondary)]">
              Ready-to-share daily flash report for WhatsApp management groups or Markdown board notes.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg text-xs font-mono border border-[var(--border-default)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
          >
            Close
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setDigestFormat("whatsapp")}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold cursor-pointer transition-colors ${
                  digestFormat === "whatsapp"
                    ? "badge-emerald"
                    : "surface-well text-[var(--text-secondary)]"
                }`}
              >
                WhatsApp / Telegram Brief
              </button>
              <button
                type="button"
                onClick={() => setDigestFormat("markdown")}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold cursor-pointer transition-colors ${
                  digestFormat === "markdown"
                    ? "badge-sky"
                    : "surface-well text-[var(--text-secondary)]"
                }`}
              >
                Markdown Report (.md)
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onCopy}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-mono font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm transition-colors cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? "Copied to Clipboard!" : "Copy Digest"}</span>
              </button>
              <button
                type="button"
                onClick={onDownload}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-semibold surface-well hover:bg-[var(--bg-hover)] text-[var(--text-primary)] border border-[var(--border-default)] cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download .md</span>
              </button>
            </div>
          </div>

          <pre className="surface-well rounded-xl p-4 text-xs font-mono text-[var(--text-primary)] whitespace-pre-wrap overflow-y-auto max-h-[52vh] border border-[var(--border-subtle)] leading-relaxed">
            {text}
          </pre>
        </div>
      </div>
    </div>
  );
}
