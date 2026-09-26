"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Trash2,
  Database,
  ShieldCheck,
  Layers,
  Store,
  ExternalLink,
  Info,
} from "lucide-react";

interface StagedFile {
  file: File;
  id: string;
  detectedType: "majoo" | "majoo_attendance" | "klikit_orders" | "klikit_items" | "unknown";
  detectedLabel: string;
  previewRows: number;
}

interface IngestSummary {
  success: boolean;
  fileType: string;
  fileTypeLabel: string;
  fileName: string;
  originalFileName?: string;
  fileSizeBytes: number;
  ordersProcessed: number;
  newOrdersInserted: number;
  duplicatesHandled: number;
  itemsProcessed: number;
  newItemsInserted: number;
  grossAmount: number;
  minDate: string | null;
  maxDate: string | null;
  message: string;
}

interface RawFileAudit {
  name: string;
  sizeBytes: number;
  sizeFormatted: string;
  modifiedAt: string;
  fileType: string;
  fileTypeLabel: string;
  dateRangeLabel?: string;
}

interface CoverageBrandRow {
  brand: string;
  branch: string;
  channel_group: string;
  total_orders: number;
  orders_with_items: number;
  orphan_orders: number;
  coverage_pct: number;
  order_gross_gmv: number;
  item_exploded_revenue: number;
  total_units_sold: number;
  min_date: string | null;
  max_date: string | null;
  status: "Complete" | "Partial Gap" | "Missing Items CSV";
}

interface CoverageAuditState {
  totalOrders: number;
  ordersWithItems: number;
  orphanOrdersCount: number;
  orderCoveragePct: number;
  totalItemRows: number;
  totalUnitsSold: number;
  orderGrossGmv: number;
  itemExplodedRevenue: number;
  unreconciledGmvGap: number;
  brandBreakdown: CoverageBrandRow[];
}

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function detectClientSignature(contentSample: string, fileName: string): {
  type: "majoo" | "majoo_attendance" | "klikit_orders" | "klikit_items" | "unknown";
  label: string;
} {
  const sample = contentSample.slice(0, 3000);
  const lowerName = fileName.toLowerCase();

  if (
    sample.includes("Laporan Absensi") ||
    (sample.includes("Jam Masuk") && sample.includes("Jam Pulang")) ||
    lowerName.includes("attendance") ||
    lowerName.includes("absensi")
  ) {
    return { type: "majoo_attendance", label: "Majoo Attendance (Laporan Absensi Karyawan)" };
  }

  if (
    sample.includes("DETAIL PENJUALAN") ||
    (sample.includes("No Transaksi") && sample.includes("Waktu Order")) ||
    (sample.includes(";") && (lowerName.includes("majoo") || lowerName.includes("detil_penjualan")))
  ) {
    return { type: "majoo", label: "Majoo POS (Greenville Dine-in / Takeaway)" };
  }

  if (
    sample.includes("Gross Order Value") ||
    sample.includes("Meal Preparation Time") ||
    sample.includes("Merchant Discount")
  ) {
    return { type: "klikit_orders", label: "Klikit Orders (Grab & GoFood Delivery)" };
  }

  if (
    sample.includes("Menu Items") ||
    sample.includes("Item Quantity") ||
    sample.includes("Item Sale Price")
  ) {
    return { type: "klikit_items", label: "Klikit Menu Items (SKU Velocity)" };
  }

  if (lowerName.includes("klikit") && lowerName.includes("order")) {
    return { type: "klikit_orders", label: "Klikit Orders (Grab & GoFood Delivery)" };
  }
  if (lowerName.includes("klikit") && lowerName.includes("item")) {
    return { type: "klikit_items", label: "Klikit Menu Items (SKU Velocity)" };
  }

  return { type: "unknown", label: "Unrecognized CSV Schema" };
}

export default function IngestPage() {
  const [isDragging, setIsDragging] = useState(false);
  const [stagedFiles, setStagedFiles] = useState<StagedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResults, setUploadResults] = useState<IngestSummary[] | null>(null);
  const [uploadErrors, setUploadErrors] = useState<{ fileName: string; error: string }[]>([]);
  const [rawFiles, setRawFiles] = useState<RawFileAudit[]>([]);
  const [coverageAudit, setCoverageAudit] = useState<CoverageAuditState | null>(null);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadRawFiles = async () => {
    setIsLoadingFiles(true);
    try {
      const res = await fetch("/api/ingest");
      const data = await res.json();
      if (data.success && Array.isArray(data.files)) {
        setRawFiles(data.files);
      }
      if (data.success && data.coverageAudit) {
        setCoverageAudit(data.coverageAudit);
      }
    } catch (err) {
      console.error("Failed to load raw files:", err);
    } finally {
      setIsLoadingFiles(false);
    }
  };

  useEffect(() => {
    loadRawFiles();
  }, []);

  const handleFilesSelected = async (files: FileList | File[]) => {
    const newStaged: StagedFile[] = [];

    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      if (!f.name.endsWith(".csv")) continue;

      try {
        const textSample = await f.slice(0, 4096).text();
        const lineCount = (await f.text()).split(/\r?\n/).filter((l) => l.trim().length > 0).length;
        const detection = detectClientSignature(textSample, f.name);

        newStaged.push({
          file: f,
          id: `${f.name}-${f.size}-${Date.now()}-${i}`,
          detectedType: detection.type,
          detectedLabel: detection.label,
          previewRows: lineCount,
        });
      } catch (err) {
        console.error("Error reading file sample:", err);
      }
    }

    setStagedFiles((prev) => [...prev, ...newStaged]);
    setUploadResults(null);
    setUploadErrors([]);
  };

  const removeStagedFile = (id: string) => {
    setStagedFiles((prev) => prev.filter((item) => item.id !== id));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFilesSelected(e.dataTransfer.files);
    }
  };

  const handleUpload = async () => {
    if (stagedFiles.length === 0) return;
    setIsUploading(true);
    setUploadErrors([]);
    setUploadResults(null);

    const formData = new FormData();
    for (const item of stagedFiles) {
      formData.append("files", item.file);
    }

    try {
      const res = await fetch("/api/ingest", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (data.success && data.summaries) {
        setUploadResults(data.summaries);
        setStagedFiles([]);
        loadRawFiles();
      } else {
        setUploadErrors(data.errors || [{ fileName: "Upload Batch", error: data.error || "Failed to process files." }]);
      }
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : "Connection error.";
      setUploadErrors([{ fileName: "Network", error: errMsg }]);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1600px] mx-auto">
      {/* Top Header & Navigation */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[var(--border-subtle)] pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-[var(--text-primary)]">
              Data Sync & EOD Dropzone
            </h1>
            <span className="badge-emerald px-2.5 py-0.5 text-[11px] font-mono font-semibold tracking-wide rounded-full">
              LIVE PIPELINE
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-1">
            Drag and drop raw Majoo POS or Klikit Aggregator CSV exports to automatically validate, deduplicate, and merge into DuckDB.
          </p>
        </div>

        {/* Engine Badges */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="badge-emerald inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium">
            <ShieldCheck className="w-3.5 h-3.5" />
            Zero-Duplicate Idempotent
          </div>
          <div className="badge-blue inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium">
            <Database className="w-3.5 h-3.5" />
            DuckDB Analytical Warehouse
          </div>
        </div>
      </div>

      {/* Main Upload Area & Floor Checklist */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Dropzone & Staged Files */}
        <div className="lg:col-span-2 space-y-6">
          <div className="cockpit-panel rounded-2xl p-6 lg:p-7">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base sm:text-lg font-bold flex items-center gap-2 text-[var(--text-primary)]">
                <UploadCloud className="w-5 h-5 text-[var(--accent-primary)]" />
                Upload CSV Report
              </h2>
              <span className="text-xs text-[var(--text-secondary)]">Supports: Majoo POS, Attendance & Klikit</span>
            </div>

            {/* Drag & Drop Target */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-8 lg:p-12 text-center cursor-pointer transition-all ${
                isDragging
                  ? "border-[var(--accent-primary)] bg-[var(--accent-primary)]/10 scale-[1.01]"
                  : "border-[var(--border-default)] hover:border-[var(--accent-primary)] surface-well hover:bg-[var(--bg-surface-3)]/50"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".csv"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files) handleFilesSelected(e.target.files);
                }}
              />
              <div className="flex flex-col items-center justify-center space-y-3">
                <div className="p-4 bg-[var(--accent-primary)]/15 text-[var(--accent-primary)] rounded-full border border-[var(--accent-primary)]/30">
                  <UploadCloud className="w-8 h-8" />
                </div>
                <div>
                  <p className="text-base font-semibold text-[var(--text-primary)]">
                    Drag & drop your CSV files here, or <span className="text-[var(--accent-primary)] underline">browse</span>
                  </p>
                  <p className="text-xs text-[var(--text-secondary)] mt-1">
                    Accepts Majoo POS <code className="text-[var(--text-primary)] bg-[var(--bg-surface)] px-1.5 py-0.5 rounded border border-[var(--border-subtle)]">Detail Penjualan</code>, <code className="text-[var(--text-primary)] bg-[var(--bg-surface)] px-1.5 py-0.5 rounded border border-[var(--border-subtle)]">Laporan Absensi</code>, or Klikit <code className="text-[var(--text-primary)] bg-[var(--bg-surface)] px-1.5 py-0.5 rounded border border-[var(--border-subtle)]">Orders/Items</code> CSV
                  </p>
                </div>
              </div>
            </div>

            {/* Staged Files Preview */}
            {stagedFiles.length > 0 && (
              <div className="mt-6 space-y-3">
                <div className="flex items-center justify-between text-xs font-medium text-[var(--text-secondary)]">
                  <span>Files Ready for Ingestion ({stagedFiles.length})</span>
                  <button
                    onClick={() => setStagedFiles([])}
                    className="text-rose-500 hover:opacity-80 text-xs font-semibold transition-opacity cursor-pointer"
                  >
                    Clear All
                  </button>
                </div>

                <div className="space-y-2">
                  {stagedFiles.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-3.5 surface-well rounded-xl text-sm"
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        <FileText className="w-5 h-5 text-[var(--accent-primary)] shrink-0" />
                        <div className="truncate">
                          <p className="font-medium text-[var(--text-primary)] truncate">{item.file.name}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span
                              className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                                item.detectedType === "majoo"
                                  ? "badge-purple"
                                  : item.detectedType.startsWith("klikit") || item.detectedType === "majoo_attendance"
                                  ? "badge-emerald"
                                  : "badge-rose"
                              }`}
                            >
                              {item.detectedLabel}
                            </span>
                            <span className="text-[11px] text-[var(--text-muted)]">
                              {formatBytes(item.file.size)} · ~{item.previewRows} rows
                            </span>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => removeStagedFile(item.id)}
                        className="p-1.5 text-[var(--text-muted)] hover:text-rose-500 transition-colors ml-3 cursor-pointer"
                        title="Remove file"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Upload Action Button */}
                <div className="pt-3">
                  <button
                    onClick={handleUpload}
                    disabled={isUploading}
                    className="w-full py-3 px-4 bg-[var(--accent-primary)] hover:opacity-90 disabled:opacity-50 text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                  >
                    {isUploading ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Parsing & Ingesting to DuckDB...</span>
                      </>
                    ) : (
                      <>
                        <UploadCloud className="w-4 h-4" />
                        <span>Process & Ingest {stagedFiles.length} File{stagedFiles.length > 1 ? "s" : ""}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Ingestion Results Card */}
            {uploadResults && uploadResults.length > 0 && (
              <div className="mt-6 p-5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-semibold text-sm">
                    <CheckCircle2 className="w-5 h-5" />
                    <span>Ingestion Completed Successfully</span>
                  </div>
                  <Link
                    href="/"
                    className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
                  >
                    <span>View Dashboard</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                </div>

                <div className="space-y-3">
                  {uploadResults.map((res, i) => (
                    <div
                      key={i}
                      className="p-4 cockpit-panel rounded-xl space-y-2 text-xs"
                    >
                      <div className="flex items-start justify-between font-medium gap-2">
                        <div>
                          <span className="text-[var(--text-primary)] font-semibold font-mono text-xs">{res.fileName}</span>
                          {res.originalFileName && res.originalFileName !== res.fileName && (
                            <span className="text-[11px] text-[var(--text-secondary)] block font-mono mt-0.5">
                              Uploaded as: <span className="line-through text-[var(--text-muted)]">{res.originalFileName}</span> ➔ Auto-renamed to canonical format
                            </span>
                          )}
                        </div>
                        <span className="badge-emerald font-medium px-2 py-0.5 rounded text-[10px] shrink-0">
                          {res.fileTypeLabel}
                        </span>
                      </div>
                      {res.ordersProcessed > 0 && res.newOrdersInserted === 0 && (
                        <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-amber-500/10 border border-amber-500/25 rounded text-[11px] text-amber-600 dark:text-amber-300">
                          <Info className="w-3.5 h-3.5 shrink-0" />
                          <span>All {res.ordersProcessed} orders in this file already exist in DuckDB. 0 new orders added (deduplication protected clean GMV).</span>
                        </div>
                      )}
                      {res.itemsProcessed > 0 && res.newItemsInserted === 0 && (
                        <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-amber-500/10 border border-amber-500/25 rounded text-[11px] text-amber-600 dark:text-amber-300">
                          <Info className="w-3.5 h-3.5 shrink-0" />
                          <span>All {res.itemsProcessed} item records already exist in DuckDB. Item Pareto velocity preserved.</span>
                        </div>
                      )}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-[var(--border-subtle)] text-[var(--text-secondary)]">
                        <div>
                          <span className="block text-[10px] uppercase text-[var(--text-muted)]">Orders Processed</span>
                          <div className="flex items-baseline gap-1.5">
                            <span className="font-semibold text-[var(--text-primary)] text-sm">{res.ordersProcessed}</span>
                            {res.ordersProcessed > 0 && (
                              <span className="text-[10px] text-[var(--text-secondary)]">({res.newOrdersInserted} new / {res.duplicatesHandled} dupes)</span>
                            )}
                          </div>
                        </div>
                        <div>
                          <span className="block text-[10px] uppercase text-[var(--text-muted)]">Items Exploded</span>
                          <div className="flex items-baseline gap-1.5">
                            <span className="font-semibold text-[var(--text-primary)] text-sm">{res.itemsProcessed}</span>
                            {res.itemsProcessed > 0 && (
                              <span className="text-[10px] text-[var(--text-secondary)]">({res.newItemsInserted} new / {res.duplicatesHandled} dupes)</span>
                            )}
                          </div>
                        </div>
                        <div>
                          <span className="block text-[10px] uppercase text-[var(--text-muted)]">Gross Sales</span>
                          <span className="font-semibold text-emerald-600 dark:text-emerald-400 text-sm">{formatRupiah(res.grossAmount)}</span>
                        </div>
                        <div>
                          <span className="block text-[10px] uppercase text-[var(--text-muted)]">Date Range</span>
                          <span className="font-medium text-[var(--text-primary)] truncate block">
                            {res.minDate ? res.minDate.split(" ")[0] : "N/A"} to{" "}
                            {res.maxDate ? res.maxDate.split(" ")[0] : "N/A"}
                          </span>
                        </div>
                      </div>
                      <p className="text-[11px] text-[var(--text-secondary)] pt-1">{res.message}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Error Feedback */}
            {uploadErrors.length > 0 && (
              <div className="mt-6 p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl space-y-2">
                <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-semibold text-sm">
                  <AlertCircle className="w-5 h-5" />
                  <span>Ingestion Error</span>
                </div>
                {uploadErrors.map((err, i) => (
                  <p key={i} className="text-xs text-rose-600 dark:text-rose-300">
                    <strong className="text-[var(--text-primary)]">{err.fileName}:</strong> {err.error}
                  </p>
                ))}
              </div>
            )}
          </div>

          {/* Track A: Order-to-Item Coverage & Reconciliation Matrix */}
          {coverageAudit && (
            <div className="cockpit-panel rounded-2xl p-6 lg:p-7 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-[var(--text-primary)]">
                      Order-to-Item Coverage & Reconciliation Matrix
                    </h3>
                    <span
                      className={`text-[11px] font-mono px-2 py-0.5 rounded font-semibold ${
                        coverageAudit.orderCoveragePct >= 95
                          ? "badge-emerald"
                          : "badge-amber"
                      }`}
                    >
                      {coverageAudit.orderCoveragePct}% Linked
                    </span>
                  </div>
                  <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                    Verifies every order in <code className="text-[var(--text-primary)] font-mono">fact_orders</code> has matching SKU line-items in <code className="text-[var(--text-primary)] font-mono">fact_order_items</code> for Menu Engineering BOM accuracy
                  </p>
                </div>

                <div className="text-right font-mono text-xs text-[var(--text-secondary)]">
                  <span className="text-[var(--text-primary)] font-semibold">{coverageAudit.ordersWithItems.toLocaleString()}</span> / {coverageAudit.totalOrders.toLocaleString()} orders ·{" "}
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{coverageAudit.totalUnitsSold.toLocaleString()}</span> units
                </div>
              </div>

              <div className="overflow-x-auto border border-[var(--border-subtle)] rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-[var(--border-subtle)] bg-[var(--bg-surface-2)] text-[var(--text-secondary)] uppercase font-semibold tracking-wider text-[11px]">
                      <th className="py-2.5 px-3">Brand</th>
                      <th className="py-2.5 px-3">Branch & Stream</th>
                      <th className="py-2.5 px-3 text-right">Orders</th>
                      <th className="py-2.5 px-3 text-right">With Items</th>
                      <th className="py-2.5 px-3 text-right">Orphans</th>
                      <th className="py-2.5 px-3 text-right">Units Sold</th>
                      <th className="py-2.5 px-3">Date Span</th>
                      <th className="py-2.5 px-3 text-right">Coverage</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border-subtle)] font-mono">
                    {coverageAudit.brandBreakdown.map((row, idx) => (
                      <tr key={idx} className="hover:bg-[var(--bg-surface-2)]/60 transition-colors">
                        <td className="py-2.5 px-3 font-sans font-semibold text-[var(--text-primary)]">
                          {row.brand}
                        </td>
                        <td className="py-2.5 px-3 text-[var(--text-secondary)]">
                          {row.branch} · <span className="text-[var(--text-primary)]">{row.channel_group}</span>
                        </td>
                        <td className="py-2.5 px-3 text-right text-[var(--text-primary)] tabular-nums">
                          {row.total_orders.toLocaleString()}
                        </td>
                        <td className="py-2.5 px-3 text-right text-emerald-600 dark:text-emerald-400 font-semibold tabular-nums">
                          {row.orders_with_items.toLocaleString()}
                        </td>
                        <td className="py-2.5 px-3 text-right tabular-nums">
                          {row.orphan_orders > 0 ? (
                            <span className="text-amber-600 dark:text-amber-400 font-semibold">{row.orphan_orders.toLocaleString()}</span>
                          ) : (
                            <span className="text-[var(--text-muted)]">0</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-right text-[var(--text-primary)] tabular-nums">
                          {row.total_units_sold.toLocaleString()}
                        </td>
                        <td className="py-2.5 px-3 text-[var(--text-secondary)] text-[11px]">
                          {row.min_date || "—"} → {row.max_date || "—"}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                              row.status === "Complete"
                                ? "badge-emerald"
                                : row.status === "Partial Gap"
                                ? "badge-amber"
                                : "badge-rose"
                            }`}
                          >
                            {row.coverage_pct}% · {row.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Currently Synced Raw Files in Storage */}
          <div className="cockpit-panel rounded-2xl p-6 lg:p-7 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-[var(--text-primary)]">Active Ingested Files in Data Lake</h3>
                <p className="text-xs text-[var(--text-secondary)]">Reports stored in DuckDB data warehouse directory</p>
              </div>
              <button
                onClick={loadRawFiles}
                disabled={isLoadingFiles}
                className="p-2 surface-well hover:bg-[var(--bg-surface-3)] rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
                title="Refresh File List"
              >
                <RefreshCw className={`w-4 h-4 ${isLoadingFiles ? "animate-spin" : ""}`} />
              </button>
            </div>

            {rawFiles.length === 0 ? (
              <p className="text-xs text-[var(--text-muted)] py-4 text-center">No raw CSV files found in storage.</p>
            ) : (
              <div className="divide-y divide-[var(--border-subtle)] border border-[var(--border-subtle)] rounded-xl overflow-hidden text-xs">
                {rawFiles.map((file, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 bg-[var(--bg-surface-2)]/40 hover:bg-[var(--bg-surface-2)] transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <FileText className="w-4 h-4 text-[var(--accent-primary)] shrink-0" />
                      <span className="font-mono text-[var(--text-primary)] truncate">{file.name}</span>
                      {file.dateRangeLabel && (
                        <span className="hidden md:inline-block badge-emerald px-2 py-0.5 rounded text-[10px] font-mono shrink-0">
                          {file.dateRangeLabel}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 shrink-0 text-[var(--text-muted)]">
                      <span className="badge-neutral px-2 py-0.5 rounded text-[10px] font-medium">
                        {file.fileTypeLabel}
                      </span>
                      <span>{file.sizeFormatted}</span>
                      <span>{file.modifiedAt.split("T")[0]}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Store Floor Closing Ritual & Instructions */}
        <div className="space-y-6">
          {/* Greenville Majoo POS Closing SOP */}
          <div className="cockpit-panel rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400">
              <Store className="w-5 h-5" />
              <h3 className="font-bold text-sm text-[var(--text-primary)]">Greenville Cashier EOD SOP (22:00 WIB)</h3>
            </div>
            <p className="text-xs text-[var(--text-secondary)]">
              Closing ritual to sync dine-in and counter takeaway sales:
            </p>

            <ol className="space-y-3 text-xs text-[var(--text-secondary)] list-decimal list-inside">
              <li className="leading-relaxed">
                Log into <span className="font-semibold text-purple-600 dark:text-purple-300">dashboard.majoo.id</span> on the POS tablet.
              </li>
              <li className="leading-relaxed">
                Navigate to: <br />
                <span className="font-mono text-[11px] surface-well px-2 py-1 rounded text-[var(--text-primary)] block mt-1">
                  Penjualan → Laporan → Laporan Penjualan → Detail Penjualan
                </span>
              </li>
              <li className="leading-relaxed">
                Filter Outlet: <span className="font-semibold text-[var(--text-primary)]">Greenville</span>. Date: <span className="font-semibold text-[var(--text-primary)]">Today</span>.
              </li>
              <li className="leading-relaxed">
                Click <span className="font-semibold text-purple-600 dark:text-purple-300">Ekspor Laporan → CSV</span> (standard comma/semicolon).
              </li>
              <li className="leading-relaxed">
                Open this portal (<span className="font-mono text-[11px] text-[var(--text-primary)]">/ingest</span>) and drag the downloaded CSV into the dropzone.
              </li>
              <li className="leading-relaxed text-emerald-600 dark:text-emerald-400 font-medium">
                Confirm status turns <span className="font-bold">🟢 Synced</span> before closing the register.
              </li>
            </ol>
          </div>

          {/* Klikit Aggregator SOP */}
          <div className="cockpit-panel rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
              <Layers className="w-5 h-5" />
              <h3 className="font-bold text-sm text-[var(--text-primary)]">Klikit Aggregator Export SOP</h3>
            </div>
            <p className="text-xs text-[var(--text-secondary)]">
              Weekly or daily GrabFood & GoFood delivery sync:
            </p>

            <ol className="space-y-3 text-xs text-[var(--text-secondary)] list-decimal list-inside">
              <li className="leading-relaxed">
                Sign into Klikit merchant portal (<span className="font-mono text-[11px] text-emerald-600 dark:text-emerald-300">klikit.io</span>).
              </li>
              <li className="leading-relaxed">
                Go to <span className="font-semibold text-[var(--text-primary)]">Reports / Transactions</span>.
              </li>
              <li className="leading-relaxed">
                Download both:
                <ul className="list-disc list-inside ml-2 mt-1 space-y-1 text-[var(--text-secondary)]">
                  <li><strong className="text-[var(--text-primary)]">Orders Report</strong> (GMV, Payout, Promo burn, KPT)</li>
                  <li><strong className="text-[var(--text-primary)]">Items Report</strong> (SKU velocity & modifiers)</li>
                </ul>
              </li>
              <li className="leading-relaxed">
                Drop both files together into this dropzone. Deduplication ensures zero double-counting.
              </li>
            </ol>
          </div>

          {/* Technical Note */}
          <div className="p-4 surface-well rounded-xl flex items-start gap-3 text-xs text-[var(--text-secondary)]">
            <Info className="w-4 h-4 text-[var(--accent-primary)] shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-[var(--text-primary)] block mb-0.5">Idempotent Upsert Guaranteed</span>
              Each transaction is identified by its unique receipt ID hash. Uploading the same file multiple times will update records safely with zero duplicates.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
