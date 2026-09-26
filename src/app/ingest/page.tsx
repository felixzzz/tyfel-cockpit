"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
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
  detectedType: "majoo" | "klikit_orders" | "klikit_items" | "unknown";
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
  type: "majoo" | "klikit_orders" | "klikit_items" | "unknown";
  label: string;
} {
  const sample = contentSample.slice(0, 3000);
  const lowerName = fileName.toLowerCase();

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
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch current raw files
  const loadRawFiles = async () => {
    setIsLoadingFiles(true);
    try {
      const res = await fetch("/api/ingest");
      const data = await res.json();
      if (data.success && Array.isArray(data.files)) {
        setRawFiles(data.files);
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
    <div className="min-h-screen bg-[#09090b] text-white p-6 lg:p-10 space-y-8">
      {/* Top Header & Navigation */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/[0.08] pb-6">
        <div>
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="p-2 bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.08] rounded-lg text-zinc-400 hover:text-white transition-colors"
              title="Return to Executive Cockpit"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">
                  Web Ingestion Portal & EOD Dropzone
                </h1>
                <span className="px-2 py-0.5 text-[11px] font-semibold tracking-wide bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded">
                  LIVE PIPELINE
                </span>
              </div>
              <p className="text-sm text-zinc-400 mt-1">
                Drag and drop raw POS or Aggregator CSV exports to automatically validate, deduplicate, and merge into DuckDB.
              </p>
            </div>
          </div>
        </div>

        {/* Engine Badges */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-emerald-950/60 text-emerald-300 border border-emerald-800/50">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            Zero-Duplicate Idempotent
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-blue-950/60 text-blue-300 border border-blue-800/50">
            <Database className="w-3.5 h-3.5 text-blue-400" />
            DuckDB Analytical Warehouse
          </div>
        </div>
      </div>

      {/* Main Upload Area & Floor Checklist */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Dropzone & Staged Files */}
        <div className="lg:col-span-2 space-y-6">
          <div className="cockpit-panel rounded-2xl p-6 lg:p-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <UploadCloud className="w-5 h-5 text-emerald-400" />
                Upload CSV Report
              </h2>
              <span className="text-xs text-zinc-400">Supports: Majoo POS & Klikit Deliveries</span>
            </div>

            {/* Drag & Drop Target */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-8 lg:p-12 text-center cursor-pointer transition-all ${
                isDragging
                  ? "border-emerald-500 bg-emerald-500/5 scale-[1.01]"
                  : "border-white/[0.08] hover:border-[#3f3f46] bg-black/30 hover:bg-white/[0.04]"
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
                <div className="p-4 bg-emerald-500/10 text-emerald-400 rounded-full">
                  <UploadCloud className="w-8 h-8" />
                </div>
                <div>
                  <p className="text-base font-semibold text-white">
                    Drag & drop your CSV files here, or <span className="text-emerald-400 underline">browse</span>
                  </p>
                  <p className="text-xs text-zinc-400 mt-1">
                    Accepts Majoo POS <code className="text-zinc-300 bg-white/[0.06] px-1 py-0.5 rounded">Detail Penjualan</code> or Klikit <code className="text-zinc-300 bg-white/[0.06] px-1 py-0.5 rounded">Orders/Items</code> CSV
                  </p>
                </div>
              </div>
            </div>

            {/* Staged Files Preview */}
            {stagedFiles.length > 0 && (
              <div className="mt-6 space-y-3">
                <div className="flex items-center justify-between text-xs font-medium text-zinc-400">
                  <span>Files Ready for Ingestion ({stagedFiles.length})</span>
                  <button
                    onClick={() => setStagedFiles([])}
                    className="text-red-400 hover:text-red-300 text-xs transition-colors"
                  >
                    Clear All
                  </button>
                </div>

                <div className="space-y-2">
                  {stagedFiles.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-3.5 bg-white/[0.03] border border-white/[0.08] rounded-xl text-sm"
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        <FileText className="w-5 h-5 text-emerald-400 shrink-0" />
                        <div className="truncate">
                          <p className="font-medium text-white truncate">{item.file.name}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span
                              className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                                item.detectedType === "majoo"
                                  ? "bg-purple-950/60 text-purple-300 border border-purple-800/40"
                                  : item.detectedType.startsWith("klikit")
                                  ? "bg-emerald-950/60 text-emerald-300 border border-emerald-800/40"
                                  : "bg-red-950/60 text-red-300 border border-red-800/40"
                              }`}
                            >
                              {item.detectedLabel}
                            </span>
                            <span className="text-[11px] text-zinc-500">
                              {formatBytes(item.file.size)} · ~{item.previewRows} rows
                            </span>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => removeStagedFile(item.id)}
                        className="p-1.5 text-zinc-500 hover:text-red-400 transition-colors ml-3"
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
                    className="w-full py-3 px-4 bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-500/50 text-black font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 cursor-pointer"
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
              <div className="mt-6 p-5 bg-emerald-950/30 border border-emerald-800/50 rounded-xl space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    <span>Ingestion Completed Successfully</span>
                  </div>
                  <Link
                    href="/"
                    className="text-xs font-semibold text-emerald-400 hover:underline flex items-center gap-1"
                  >
                    <span>View Dashboard</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                </div>

                <div className="space-y-3">
                  {uploadResults.map((res, i) => (
                    <div
                      key={i}
                      className="p-4 cockpit-panel rounded-lg space-y-2 text-xs"
                    >
                      <div className="flex items-start justify-between font-medium gap-2">
                        <div>
                          <span className="text-white font-semibold font-mono text-xs">{res.fileName}</span>
                          {res.originalFileName && res.originalFileName !== res.fileName && (
                            <span className="text-[11px] text-zinc-400 block font-mono mt-0.5">
                              Uploaded as: <span className="line-through text-zinc-500">{res.originalFileName}</span> ➔ Auto-renamed to standard canonical format
                            </span>
                          )}
                        </div>
                        <span className="text-emerald-400 font-medium px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-[10px] shrink-0">
                          {res.fileTypeLabel}
                        </span>
                      </div>
                      {res.ordersProcessed > 0 && res.newOrdersInserted === 0 && (
                        <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded text-[11px] text-amber-300">
                          <Info className="w-3.5 h-3.5 shrink-0" />
                          <span>All {res.ordersProcessed} orders in this file already exist in DuckDB. 0 new orders added (deduplication protected clean GMV against double counting).</span>
                        </div>
                      )}
                      {res.itemsProcessed > 0 && res.newItemsInserted === 0 && (
                        <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded text-[11px] text-amber-300">
                          <Info className="w-3.5 h-3.5 shrink-0" />
                          <span>All {res.itemsProcessed} item records already exist in DuckDB. Item Pareto velocity preserved.</span>
                        </div>
                      )}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-white/[0.08] text-zinc-400">
                        <div>
                          <span className="block text-[10px] uppercase text-zinc-500">Orders Processed</span>
                          <div className="flex items-baseline gap-1.5">
                            <span className="font-semibold text-white text-sm">{res.ordersProcessed}</span>
                            {res.ordersProcessed > 0 && (
                              <span className="text-[10px] text-zinc-400">({res.newOrdersInserted} new / {res.duplicatesHandled} dupes)</span>
                            )}
                          </div>
                        </div>
                        <div>
                          <span className="block text-[10px] uppercase text-zinc-500">Items Exploded</span>
                          <div className="flex items-baseline gap-1.5">
                            <span className="font-semibold text-white text-sm">{res.itemsProcessed}</span>
                            {res.itemsProcessed > 0 && (
                              <span className="text-[10px] text-zinc-400">({res.newItemsInserted} new / {res.duplicatesHandled} dupes)</span>
                            )}
                          </div>
                        </div>
                        <div>
                          <span className="block text-[10px] uppercase text-zinc-500">Gross Sales</span>
                          <span className="font-semibold text-emerald-400 text-sm">{formatRupiah(res.grossAmount)}</span>
                        </div>
                        <div>
                          <span className="block text-[10px] uppercase text-zinc-500">Date Range</span>
                          <span className="font-medium text-zinc-300 truncate block">
                            {res.minDate ? res.minDate.split(" ")[0] : "N/A"} to{" "}
                            {res.maxDate ? res.maxDate.split(" ")[0] : "N/A"}
                          </span>
                        </div>
                      </div>
                      <p className="text-[11px] text-zinc-400 pt-1">{res.message}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Error Feedback */}
            {uploadErrors.length > 0 && (
              <div className="mt-6 p-4 bg-red-950/30 border border-red-800/50 rounded-xl space-y-2">
                <div className="flex items-center gap-2 text-red-400 font-semibold text-sm">
                  <AlertCircle className="w-5 h-5" />
                  <span>Ingestion Error</span>
                </div>
                {uploadErrors.map((err, i) => (
                  <p key={i} className="text-xs text-red-300">
                    <strong className="text-white">{err.fileName}:</strong> {err.error}
                  </p>
                ))}
              </div>
            )}
          </div>

          {/* Currently Synced Raw Files in Storage */}
          <div className="cockpit-panel rounded-2xl p-6 lg:p-8 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white">Active Ingested Files in Data Lake</h3>
                <p className="text-xs text-zinc-400">Reports stored in DuckDB data warehouse directory</p>
              </div>
              <button
                onClick={loadRawFiles}
                disabled={isLoadingFiles}
                className="p-2 bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.08] rounded-lg text-zinc-400 hover:text-white transition-colors cursor-pointer"
                title="Refresh File List"
              >
                <RefreshCw className={`w-4 h-4 ${isLoadingFiles ? "animate-spin" : ""}`} />
              </button>
            </div>

            {rawFiles.length === 0 ? (
              <p className="text-xs text-zinc-500 py-4 text-center">No raw CSV files found in storage.</p>
            ) : (
              <div className="divide-y divide-[#27272a] border border-white/[0.08] rounded-xl overflow-hidden text-xs">
                {rawFiles.map((file, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 bg-white/[0.03]/50 hover:bg-white/[0.03] transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <FileText className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span className="font-mono text-white truncate">{file.name}</span>
                      {file.dateRangeLabel && (
                        <span className="hidden md:inline-block px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
                          {file.dateRangeLabel}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 shrink-0 text-zinc-500">
                      <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-white/[0.06] text-zinc-300">
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
            <div className="flex items-center gap-2 text-purple-400">
              <Store className="w-5 h-5" />
              <h3 className="font-bold text-sm text-white">Greenville Cashier EOD SOP (22:00 WIB)</h3>
            </div>
            <p className="text-xs text-zinc-400">
              Closing ritual to sync dine-in and counter takeaway sales:
            </p>

            <ol className="space-y-3 text-xs text-[#d4d4d8] list-decimal list-inside">
              <li className="leading-relaxed">
                Log into <span className="font-semibold text-purple-300">dashboard.majoo.id</span> on the POS tablet.
              </li>
              <li className="leading-relaxed">
                Navigate to: <br />
                <span className="font-mono text-[11px] bg-white/[0.03] px-1.5 py-0.5 rounded text-zinc-300 block mt-1">
                  Penjualan → Laporan → Laporan Penjualan → Detail Penjualan
                </span>
              </li>
              <li className="leading-relaxed">
                Filter Outlet: <span className="font-semibold text-white">Greenville</span>. Date: <span className="font-semibold text-white">Today</span>.
              </li>
              <li className="leading-relaxed">
                Click <span className="font-semibold text-purple-300">Ekspor Laporan → CSV</span> (standard comma/semicolon).
              </li>
              <li className="leading-relaxed">
                Open this portal (<span className="font-mono text-[11px] text-white">/ingest</span>) and drag the downloaded CSV into the dropzone.
              </li>
              <li className="leading-relaxed text-emerald-400">
                Confirm status turns <span className="font-bold">🟢 Synced</span> before closing the register.
              </li>
            </ol>
          </div>

          {/* Klikit Aggregator SOP */}
          <div className="cockpit-panel rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-2 text-emerald-400">
              <Layers className="w-5 h-5" />
              <h3 className="font-bold text-sm text-white">Klikit Aggregator Export SOP</h3>
            </div>
            <p className="text-xs text-zinc-400">
              Weekly or daily GrabFood & GoFood delivery sync:
            </p>

            <ol className="space-y-3 text-xs text-[#d4d4d8] list-decimal list-inside">
              <li className="leading-relaxed">
                Sign into Klikit merchant portal (<span className="font-mono text-[11px] text-emerald-300">klikit.io</span>).
              </li>
              <li className="leading-relaxed">
                Go to <span className="font-semibold text-white">Reports / Transactions</span>.
              </li>
              <li className="leading-relaxed">
                Download both:
                <ul className="list-disc list-inside ml-2 mt-1 space-y-1 text-zinc-400">
                  <li><strong className="text-white">Orders Report</strong> (GMV, Payout, Promo burn, KPT)</li>
                  <li><strong className="text-white">Items Report</strong> (SKU velocity & modifiers)</li>
                </ul>
              </li>
              <li className="leading-relaxed">
                Drop both files together into this dropzone. Deduplication ensures zero double-counting.
              </li>
            </ol>
          </div>

          {/* Technical Note */}
          <div className="p-4 bg-white/[0.03] border border-white/[0.08] rounded-xl flex items-start gap-3 text-xs text-zinc-400">
            <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-white block mb-0.5">Idempotent Upsert Guaranteed</span>
              Each transaction is identified by its unique receipt ID hash. Uploading the same file multiple times will update records safely with zero duplicates.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
