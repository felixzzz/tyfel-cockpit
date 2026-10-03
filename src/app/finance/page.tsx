"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Landmark,
  TrendingUp,
  Receipt,
  FileSpreadsheet,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Search,
  ChevronDown,
  ChevronRight,
  ShieldCheck,
  Building2,
  PieChart as PieIcon,
  BarChart3,
  Calendar,
  Sparkles,
  Edit2,
  X,
  FileDown,
  Download,
  Info,
  HelpCircle,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { FinancialStatementReport } from "@/lib/finance";
import { SmartReconciliationWorkbench } from "@/components/SmartReconciliationWorkbench";

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatShortRupiah(amount: number): string {
  if (Math.abs(amount) >= 1_000_000_000) {
    return `Rp ${(amount / 1_000_000_000).toFixed(2)}B`;
  }
  if (Math.abs(amount) >= 1_000_000) {
    return `Rp ${(amount / 1_000_000).toFixed(1)}M`;
  }
  if (Math.abs(amount) >= 1_000) {
    return `Rp ${(amount / 1_000).toFixed(0)}k`;
  }
  return formatRupiah(amount);
}

const PALETTE = [
  "#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6",
  "#ec4899", "#14b8a6", "#f97316", "#06b6d4", "#6366f1",
];

export default function FinancePage() {
  const [activeTab, setActiveTab] = useState<"pnl" | "cashflow" | "reconciliation" | "statements" | "transactions" | "rules">("pnl");
  const [bankFilter, setBankFilter] = useState<string>("all");
  const [periodFilter, setPeriodFilter] = useState<string>("all");
  const [loading, setLoading] = useState<boolean>(true);
  const [report, setReport] = useState<FinancialStatementReport | null>(null);
  const [categories, setCategories] = useState<any[]>([]);

  // Transactions tab state
  const [txList, setTxList] = useState<any[]>([]);
  const [txTotalCount, setTxTotalCount] = useState<number>(0);
  const [txLoading, setTxLoading] = useState<boolean>(false);
  const [txSearch, setTxSearch] = useState<string>("");
  const [txCategoryFilter, setTxCategoryFilter] = useState<string>("all");
  const [txTypeFilter, setTxTypeFilter] = useState<string>("all");
  const [txPage, setTxPage] = useState<number>(1);
  const txLimit = 50;

  // Edit category modal state
  const [editingTx, setEditingTx] = useState<any | null>(null);
  const [selectedCat, setSelectedCat] = useState<string>("");
  const [selectedSub, setSelectedSub] = useState<string>("");
  const [applyToSimilar, setApplyToSimilar] = useState<boolean>(true);
  const [savingCategory, setSavingCategory] = useState<boolean>(false);

  // Upload state
  const [uploadBank, setUploadBank] = useState<"auto" | "BCA" | "Panin">("auto");
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState<boolean>(false);
  const [uploadResults, setUploadResults] = useState<any[] | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Expanded sections in P&L
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    revenue: true,
    cogs: true,
    opex: true,
    nonOp: false,
  });

  const toggleSection = (key: string) => {
    setExpandedSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Fetch Report Data
  const fetchReport = async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams();
      if (bankFilter !== "all") q.set("bank", bankFilter);
      if (periodFilter !== "all") q.set("period", periodFilter);
      const res = await fetch(`/api/finance?${q.toString()}`);
      const data = await res.json();
      if (data.success) {
        setReport(data.report);
        setCategories(data.categories || []);
      }
    } catch (err) {
      console.error("Failed to fetch financial report", err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch Transactions List
  const fetchTransactions = async () => {
    setTxLoading(true);
    try {
      const q = new URLSearchParams();
      q.set("view", "transactions");
      q.set("limit", String(txLimit));
      q.set("offset", String((txPage - 1) * txLimit));
      if (bankFilter !== "all") q.set("bank", bankFilter);
      if (periodFilter !== "all") q.set("period", periodFilter);
      if (txCategoryFilter !== "all") q.set("category", txCategoryFilter);
      if (txTypeFilter !== "all") q.set("txType", txTypeFilter);
      if (txSearch) q.set("search", txSearch);

      const res = await fetch(`/api/finance?${q.toString()}`);
      const data = await res.json();
      if (data.success) {
        setTxList(data.transactions || []);
        setTxTotalCount(data.totalCount || 0);
      }
    } catch (err) {
      console.error("Failed to fetch transactions", err);
    } finally {
      setTxLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [bankFilter, periodFilter]);

  useEffect(() => {
    if (activeTab === "transactions") {
      fetchTransactions();
    }
  }, [activeTab, bankFilter, periodFilter, txCategoryFilter, txTypeFilter, txPage, txSearch]);

  // Handle Category Save
  const handleSaveCategory = async () => {
    if (!editingTx || !selectedCat) return;
    setSavingCategory(true);
    try {
      const res = await fetch("/api/finance", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          txId: editingTx.tx_id,
          category: selectedCat,
          subcategory: selectedSub,
          applyToSimilar,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setEditingTx(null);
        fetchTransactions();
        fetchReport();
      }
    } catch (err) {
      console.error("Failed to save category", err);
    } finally {
      setSavingCategory(false);
    }
  };

  // Handle Statement Upload
  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (uploadFiles.length === 0) return;
    setUploading(true);
    setUploadResults(null);

    try {
      const formData = new FormData();
      uploadFiles.forEach((f) => formData.append("files", f));
      if (uploadBank !== "auto") formData.append("bank", uploadBank);

      const res = await fetch("/api/finance/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.results) {
        setUploadResults(data.results);
        setUploadFiles([]);
        if (fileInputRef.current) fileInputRef.current.value = "";
        fetchReport();
      }
    } catch (err) {
      console.error("Upload error", err);
    } finally {
      setUploading(false);
    }
  };

  // Available periods from monthly trend or statements
  const availablePeriods = useMemo(() => {
    if (!report?.accountBalances) return [];
    const set = new Set<string>();
    report.accountBalances.forEach((a) => set.add(a.period));
    report.monthlyTrend.forEach((m) => set.add(m.period));
    return Array.from(set).sort().reverse();
  }, [report]);

  // COGS & OPEX Pie Chart Data
  const expensePieData = useMemo(() => {
    if (!report) return [];
    const items = [
      ...report.cogsBreakdown.map((c) => ({ name: c.category, value: c.totalAmount, type: "COGS" })),
      ...report.opexBreakdown.map((o) => ({ name: o.category, value: o.totalAmount, type: "OPEX" })),
    ];
    return items.filter((i) => i.value > 0).sort((a, b) => b.value - a.value);
  }, [report]);

  // Reseed Bank Statements from Verified Archive
  const [reseeding, setReseeding] = useState(false);
  const handleReseed = async () => {
    if (!confirm("Resync and reseed verified bank statements (July, August, September 2026)? This will refresh all statement balances and mutasi records.")) return;
    setReseeding(true);
    try {
      const res = await fetch("/api/finance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reseed" }),
      });
      const data = await res.json();
      if (data.success) {
        alert(data.message || "Statements reseeded successfully!");
        await fetchReport();
        if (activeTab === "transactions") await fetchTransactions();
      } else {
        alert(data.error || "Failed to reseed statements");
      }
    } catch (err) {
      console.error("Reseed error", err);
      alert("Failed to reseed bank statements. Please check server logs.");
    } finally {
      setReseeding(false);
    }
  };

  // Export P&L to CSV
  const exportPnlCsv = () => {
    if (!report) return;
    const lines: string[] = [];
    lines.push(`Tyfel Hub - Financial Statement (Profit & Loss)`);
    lines.push(`Report Period,${report.period},Bank Filter,${bankFilter}`);
    lines.push(`Generated At,${new Date().toISOString()}`);
    lines.push(``);
    lines.push(`Line Item,Category,Subcategory,Amount (IDR),% of Revenue`);
    lines.push(`REVENUE`);
    for (const r of report.revenueBreakdown) {
      lines.push(`Revenue,"${r.category}","${r.subcategories.map((s) => s.subcategory).join('; ')}",${r.totalAmount},${r.pctOfRevenue.toFixed(1)}%`);
    }
    lines.push(`Total Gross Operating Revenue,,,${report.summary.grossRevenue},100.0%`);
    lines.push(``);
    lines.push(`COST OF GOODS SOLD (COGS)`);
    for (const c of report.cogsBreakdown) {
      lines.push(`COGS,"${c.category}","${c.subcategories.map((s) => s.subcategory).join('; ')}",${c.totalAmount},${c.pctOfRevenue.toFixed(1)}%`);
    }
    lines.push(`Total COGS,,,${report.summary.totalCogs},${((report.summary.totalCogs / (report.summary.grossRevenue || 1)) * 100).toFixed(1)}%`);
    lines.push(`GROSS PROFIT,,,${report.summary.grossProfit},${report.summary.grossMarginPct.toFixed(1)}%`);
    lines.push(``);
    lines.push(`OPERATING EXPENSES (OPEX)`);
    for (const o of report.opexBreakdown) {
      lines.push(`OPEX,"${o.category}","${o.subcategories.map((s) => s.subcategory).join('; ')}",${o.totalAmount},${o.pctOfRevenue.toFixed(1)}%`);
    }
    lines.push(`Total OPEX,,,${report.summary.totalOpex},${((report.summary.totalOpex / (report.summary.grossRevenue || 1)) * 100).toFixed(1)}%`);
    lines.push(`OPERATING PROFIT (EBITDA),,,${report.summary.operatingProfit},${report.summary.operatingMarginPct.toFixed(1)}%`);
    lines.push(``);
    lines.push(`NON-OPERATING & CAPITAL MOVEMENTS`);
    for (const n of report.nonOpBreakdown) {
      lines.push(`Non-Operating,"${n.category}","${n.subcategories.map((s) => s.subcategory).join('; ')}",${n.totalAmount},N/A`);
    }
    lines.push(`Total Bank Credits (Mutasi Masuk),,,${report.summary.totalBankCredits || report.summary.grossRevenue},N/A`);
    lines.push(`Total Bank Debits (Mutasi Keluar),,,${report.summary.totalBankDebits || (report.summary.totalCogs + report.summary.totalOpex)},N/A`);
    lines.push(`Net Cash Movement,,,${report.summary.netCashMovement},N/A`);

    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Tyfel_PnL_${report.period}_${bankFilter}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Export Mutasi Transactions to CSV
  const [exportingTx, setExportingTx] = useState(false);
  const exportTransactionsCsv = async () => {
    setExportingTx(true);
    try {
      const q = new URLSearchParams();
      q.set("view", "transactions");
      q.set("limit", "5000");
      q.set("offset", "0");
      if (bankFilter !== "all") q.set("bank", bankFilter);
      if (periodFilter !== "all") q.set("period", periodFilter);
      if (txCategoryFilter !== "all") q.set("category", txCategoryFilter);
      if (txTypeFilter !== "all") q.set("txType", txTypeFilter);
      if (txSearch) q.set("search", txSearch);

      const res = await fetch(`/api/finance?${q.toString()}`);
      const data = await res.json();
      if (!data.success || !data.transactions) return;

      const lines: string[] = [
        "Tx Date,Bank,Account,Type,Amount (IDR),Balance (IDR),Category,Subcategory,Description",
      ];
      for (const t of data.transactions) {
        const cleanDesc = (t.description || "").replace(/"/g, '""');
        lines.push(
          `"${t.tx_date}","${t.bank_name}","${t.account_number}","${t.tx_type}",${t.amount},${t.balance},"${t.category}","${t.subcategory || ''}","${cleanDesc}"`
        );
      }

      const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Tyfel_Mutasi_${periodFilter}_${bankFilter}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Export tx error", err);
    } finally {
      setExportingTx(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-main)] p-4 sm:p-6 lg:p-8 space-y-6">
      {/* ─── Top Header & Controls ─── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[var(--border-subtle)] pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
              <Landmark className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
                Financial Statements & Intelligence
              </h1>
              <p className="text-xs sm:text-sm text-[var(--text-muted)]">
                Multi-bank statement reconciliation (BCA & Panin), F&B COGS & automated P&L reporting
              </p>
            </div>
          </div>
        </div>

        {/* Global Filter Bar */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Bank Filter */}
          <div className="flex items-center gap-1.5 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-lg px-2.5 py-1.5 text-xs shadow-sm">
            <Building2 className="w-3.5 h-3.5 text-[var(--text-muted)]" />
            <select
              value={bankFilter}
              onChange={(e) => setBankFilter(e.target.value)}
              className="bg-transparent text-[var(--text-main)] outline-none cursor-pointer font-medium"
            >
              <option value="all">All Accounts (BCA & Panin)</option>
              <option value="BCA">BCA (4080067271)</option>
              <option value="Panin">Panin Bank (1002036756)</option>
            </select>
          </div>

          {/* Period Filter */}
          <div className="flex items-center gap-1.5 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-lg px-2.5 py-1.5 text-xs shadow-sm">
            <Calendar className="w-3.5 h-3.5 text-[var(--text-muted)]" />
            <select
              value={periodFilter}
              onChange={(e) => setPeriodFilter(e.target.value)}
              className="bg-transparent text-[var(--text-main)] outline-none cursor-pointer font-medium"
            >
              <option value="all">All Time (YTD 2026)</option>
              {availablePeriods.map((p) => (
                <option key={p} value={p}>
                  Periode {p}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => {
              fetchReport();
              if (activeTab === "transactions") fetchTransactions();
            }}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-2)] border border-[var(--border-subtle)] transition shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>

          {activeTab === "pnl" && (
            <button
              onClick={exportPnlCsv}
              disabled={!report}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-2)] border border-[var(--border-subtle)] transition shadow-sm text-[var(--text-main)]"
              title="Download Profit & Loss statement as CSV"
            >
              <FileDown className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>Export P&L</span>
            </button>
          )}

          {activeTab === "transactions" && (
            <button
              onClick={exportTransactionsCsv}
              disabled={exportingTx || txList.length === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-2)] border border-[var(--border-subtle)] transition shadow-sm text-[var(--text-main)]"
              title="Export filtered transactions to CSV"
            >
              <Download className={`w-3.5 h-3.5 ${exportingTx ? "animate-bounce" : "text-blue-600 dark:text-blue-400"}`} />
              <span>{exportingTx ? "Exporting..." : "Export CSV"}</span>
            </button>
          )}

          <button
            onClick={() => setActiveTab("statements")}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition"
          >
            <UploadCloud className="w-3.5 h-3.5" />
            <span>Upload Statement</span>
          </button>
        </div>
      </div>

      {/* ─── Navigation Tabs ─── */}
      <div className="flex items-center gap-2 border-b border-[var(--border-subtle)] overflow-x-auto text-sm pb-1">
        <button
          onClick={() => setActiveTab("pnl")}
          className={`flex items-center gap-2 px-4 py-2 border-b-2 font-medium transition whitespace-nowrap ${
            activeTab === "pnl"
              ? "border-blue-600 text-blue-600 dark:text-blue-400"
              : "border-transparent text-[var(--text-muted)] hover:text-[var(--text-main)]"
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Profit & Loss (Laba Rugi)</span>
        </button>

        <button
          onClick={() => setActiveTab("cashflow")}
          className={`flex items-center gap-2 px-4 py-2 border-b-2 font-medium transition whitespace-nowrap ${
            activeTab === "cashflow"
              ? "border-blue-600 text-blue-600 dark:text-blue-400"
              : "border-transparent text-[var(--text-muted)] hover:text-[var(--text-main)]"
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>Cash Flow (Arus Kas)</span>
        </button>

        <button
          onClick={() => setActiveTab("reconciliation")}
          className={`flex items-center gap-2 px-4 py-2 border-b-2 font-medium transition whitespace-nowrap ${
            activeTab === "reconciliation"
              ? "border-blue-600 text-blue-600 dark:text-blue-400"
              : "border-transparent text-[var(--text-muted)] hover:text-[var(--text-main)]"
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Smart Reconciliation (Bank &amp; POS)</span>
        </button>

        <button
          onClick={() => setActiveTab("statements")}
          className={`flex items-center gap-2 px-4 py-2 border-b-2 font-medium transition whitespace-nowrap ${
            activeTab === "statements"
              ? "border-blue-600 text-blue-600 dark:text-blue-400"
              : "border-transparent text-[var(--text-muted)] hover:text-[var(--text-main)]"
          }`}
        >
          <UploadCloud className="w-4 h-4" />
          <span>Bank Statements & Ingest</span>
          {report?.accountBalances && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 font-mono">
              {report.accountBalances.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab("transactions")}
          className={`flex items-center gap-2 px-4 py-2 border-b-2 font-medium transition whitespace-nowrap ${
            activeTab === "transactions"
              ? "border-blue-600 text-blue-600 dark:text-blue-400"
              : "border-transparent text-[var(--text-muted)] hover:text-[var(--text-main)]"
          }`}
        >
          <Receipt className="w-4 h-4" />
          <span>Mutasi & Categorization</span>
        </button>

        <button
          onClick={() => setActiveTab("rules")}
          className={`flex items-center gap-2 px-4 py-2 border-b-2 font-medium transition whitespace-nowrap ${
            activeTab === "rules"
              ? "border-blue-600 text-blue-600 dark:text-blue-400"
              : "border-transparent text-[var(--text-muted)] hover:text-[var(--text-main)]"
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>Category Rules</span>
        </button>
      </div>

      {/* ─── TAB 1: PROFIT & LOSS STATEMENT ─── */}
      {activeTab === "pnl" && (
        <div className="space-y-6">
          {/* Revenue & Bank Credits Reconciliation Audit Callout */}
          {report && (
            <div className="bg-gradient-to-r from-blue-500/10 via-indigo-500/5 to-purple-500/10 border border-blue-500/20 rounded-xl p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-xl bg-blue-500/20 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5">
                  <Info className="w-5 h-5" />
                </div>
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold tracking-wide uppercase text-blue-700 dark:text-blue-300">
                      Bank Telemetry & Revenue Categorization Audit
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-700 dark:text-blue-300 font-semibold">
                      {report.period === "all" ? "All Periods (YTD 2026)" : `Periode ${report.period}`}
                    </span>
                  </div>
                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed max-w-3xl">
                    <strong className="text-[var(--text-main)]">Gross Operating Revenue: {formatRupiah(report.summary.grossRevenue)}</strong>
                    {" "}(reflects food & beverage sales from GoPay, OVO/Visionet, QRIS Tyfel, EDC Kartu Kredit, and Catering orders).
                    Total Bank Credits (Mutasi Masuk) for this period is <strong className="text-[var(--text-main)]">{formatRupiah(report.summary.totalBankCredits || report.summary.grossRevenue)}</strong>.
                  </p>
                  {report.summary.nonOpInflow > 0 && (
                    <div className="inline-flex items-center gap-1.5 text-xs text-amber-700 dark:text-amber-300 font-medium bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-lg mt-1">
                      <HelpCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>
                        Note: <strong>{formatRupiah(report.summary.nonOpInflow)}</strong> was identified as Non-Operating Inflows (Owner Capital Injections / DP Transfers) and excluded from Operating Sales to preserve authentic F&B profit margins.
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 w-full md:w-auto">
                <button
                  onClick={exportPnlCsv}
                  className="w-full md:w-auto flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-2)] border border-[var(--border-subtle)] text-[var(--text-main)] shadow-sm transition"
                >
                  <FileDown className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span>Download P&L (CSV)</span>
                </button>
              </div>
            </div>
          )}

          {/* F&B Operating Health & Benchmark Scorecard */}
          {report && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {/* Food Cost (COGS) % */}
              {(() => {
                const cogsRatio = report.summary.grossRevenue > 0
                  ? (report.summary.totalCogs / report.summary.grossRevenue) * 100
                  : 0;
                const isHealthy = cogsRatio > 0 && cogsRatio <= 32;
                const isWarning = cogsRatio > 32 && cogsRatio <= 35;
                return (
                  <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl p-4 shadow-sm space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                        Food Cost Ratio
                      </span>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        isHealthy
                          ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                          : isWarning
                          ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                          : "bg-rose-500/15 text-rose-600 dark:text-rose-400"
                      }`}>
                        {isHealthy ? "Optimal (28-32%)" : isWarning ? "Elevated (32-35%)" : "High (>35%)"}
                      </span>
                    </div>
                    <div className="text-xl font-bold font-mono text-[var(--text-main)]">
                      {cogsRatio.toFixed(1)}%
                    </div>
                    <div className="text-[11px] text-[var(--text-muted)] flex items-center justify-between">
                      <span>Target: 28% – 32%</span>
                      <span>{formatShortRupiah(report.summary.totalCogs)} COGS</span>
                    </div>
                  </div>
                );
              })()}

              {/* Gross Margin % */}
              {(() => {
                const gm = report.summary.grossMarginPct;
                const isStrong = gm >= 68;
                const isAcceptable = gm >= 60 && gm < 68;
                return (
                  <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl p-4 shadow-sm space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                        Gross Margin
                      </span>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        isStrong
                          ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                          : isAcceptable
                          ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                          : "bg-rose-500/15 text-rose-600 dark:text-rose-400"
                      }`}>
                        {isStrong ? "Prime (>=68%)" : isAcceptable ? "Average (60-68%)" : "Narrow (<60%)"}
                      </span>
                    </div>
                    <div className={`text-xl font-bold font-mono ${gm >= 65 ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"}`}>
                      {gm.toFixed(1)}%
                    </div>
                    <div className="text-[11px] text-[var(--text-muted)] flex items-center justify-between">
                      <span>Target: &gt;= 68%</span>
                      <span>{formatShortRupiah(report.summary.grossProfit)} Gross Profit</span>
                    </div>
                  </div>
                );
              })()}

              {/* Operating EBITDA % */}
              {(() => {
                const opm = report.summary.operatingMarginPct;
                const isProfitable = opm >= 15;
                const isLow = opm >= 0 && opm < 15;
                return (
                  <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl p-4 shadow-sm space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                        Operating Margin
                      </span>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        isProfitable
                          ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                          : isLow
                          ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                          : "bg-rose-500/15 text-rose-600 dark:text-rose-400"
                      }`}>
                        {isProfitable ? "Healthy (15-25%)" : isLow ? "Slim (0-15%)" : "Operating Loss"}
                      </span>
                    </div>
                    <div className={`text-xl font-bold font-mono ${opm >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
                      {opm.toFixed(1)}%
                    </div>
                    <div className="text-[11px] text-[var(--text-muted)] flex items-center justify-between">
                      <span>Target: 15% – 25%</span>
                      <span>{formatShortRupiah(report.summary.operatingProfit)} EBITDA</span>
                    </div>
                  </div>
                );
              })()}

              {/* Total Bank Cash Flow */}
              <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl p-4 shadow-sm space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                    Total Bank Credits
                  </span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-600 dark:text-blue-400">
                    All Inflows
                  </span>
                </div>
                <div className="text-xl font-bold font-mono text-blue-600 dark:text-blue-400">
                  {formatShortRupiah(report.summary.totalBankCredits || report.summary.grossRevenue)}
                </div>
                <div className="text-[11px] text-[var(--text-muted)] flex items-center justify-between">
                  <span>Mutasi Masuk</span>
                  <span className={report.summary.netCashMovement >= 0 ? "text-emerald-600" : "text-amber-600"}>
                    Net: {formatShortRupiah(report.summary.netCashMovement)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Executive KPI Cards */}
          {report && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
              {/* Gross Revenue */}
              <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl p-4 shadow-sm space-y-1">
                <div className="text-[11px] font-medium text-[var(--text-muted)] uppercase tracking-wider">
                  Gross Revenue
                </div>
                <div className="text-lg sm:text-xl font-bold text-emerald-600 dark:text-emerald-400">
                  {formatShortRupiah(report.summary.grossRevenue)}
                </div>
                <div className="text-[11px] text-[var(--text-muted)]">Settlements & Catering</div>
              </div>

              {/* COGS */}
              <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl p-4 shadow-sm space-y-1">
                <div className="text-[11px] font-medium text-[var(--text-muted)] uppercase tracking-wider">
                  Total COGS
                </div>
                <div className="text-lg sm:text-xl font-bold text-rose-600 dark:text-rose-400">
                  {formatShortRupiah(report.summary.totalCogs)}
                </div>
                <div className="text-[11px] text-[var(--text-muted)]">
                  {report.summary.grossRevenue > 0
                    ? `${((report.summary.totalCogs / report.summary.grossRevenue) * 100).toFixed(1)}% of Revenue`
                    : "Ingredients & Pkg"}
                </div>
              </div>

              {/* Gross Profit */}
              <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl p-4 shadow-sm space-y-1">
                <div className="text-[11px] font-medium text-[var(--text-muted)] uppercase tracking-wider">
                  Gross Profit
                </div>
                <div className={`text-lg sm:text-xl font-bold ${report.summary.grossProfit >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
                  {formatShortRupiah(report.summary.grossProfit)}
                </div>
                <div className="text-[11px] text-[var(--text-muted)]">
                  Margin: {report.summary.grossMarginPct.toFixed(1)}%
                </div>
              </div>

              {/* OPEX */}
              <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl p-4 shadow-sm space-y-1">
                <div className="text-[11px] font-medium text-[var(--text-muted)] uppercase tracking-wider">
                  Operating Expenses
                </div>
                <div className="text-lg sm:text-xl font-bold text-amber-600 dark:text-amber-400">
                  {formatShortRupiah(report.summary.totalOpex)}
                </div>
                <div className="text-[11px] text-[var(--text-muted)]">Payroll, Rent & Utilities</div>
              </div>

              {/* Operating Profit */}
              <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl p-4 shadow-sm space-y-1">
                <div className="text-[11px] font-medium text-[var(--text-muted)] uppercase tracking-wider">
                  EBITDA (Operating)
                </div>
                <div className={`text-lg sm:text-xl font-bold ${report.summary.operatingProfit >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
                  {formatShortRupiah(report.summary.operatingProfit)}
                </div>
                <div className="text-[11px] text-[var(--text-muted)]">
                  Op Margin: {report.summary.operatingMarginPct.toFixed(1)}%
                </div>
              </div>

              {/* Net Cash Movement */}
              <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl p-4 shadow-sm space-y-1">
                <div className="text-[11px] font-medium text-[var(--text-muted)] uppercase tracking-wider">
                  Net Movement
                </div>
                <div className={`text-lg sm:text-xl font-bold ${report.summary.netCashMovement >= 0 ? "text-blue-600 dark:text-blue-400" : "text-amber-600 dark:text-amber-400"}`}>
                  {formatShortRupiah(report.summary.netCashMovement)}
                </div>
                <div className="text-[11px] text-[var(--text-muted)]">All Cash In vs Out</div>
              </div>
            </div>
          )}

          {/* Charts Row */}
          {report && report.monthlyTrend.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Monthly Trend Chart */}
              <div className="lg:col-span-2 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl p-5 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-blue-500" />
                    <h3 className="text-sm font-semibold">Monthly Revenue vs Expenses Trend</h3>
                  </div>
                  <div className="text-xs text-[var(--text-muted)]">By Bank Reconciliation</div>
                </div>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={report.monthlyTrend}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                      <XAxis dataKey="period" stroke="var(--text-muted)" fontSize={11} />
                      <YAxis stroke="var(--text-muted)" fontSize={11} tickFormatter={(v) => `${(v / 1e6).toFixed(0)}M`} />
                      <Tooltip
                        formatter={(val: any) => formatRupiah(Number(val) || 0)}
                        contentStyle={{
                          backgroundColor: "var(--bg-surface)",
                          borderColor: "var(--border-subtle)",
                          borderRadius: "8px",
                          fontSize: "12px",
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: "11px" }} />
                      <Bar dataKey="revenue" name="Revenue" fill="#10b981" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="cogs" name="COGS" fill="#ef4444" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="opex" name="OPEX" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Expense Distribution Pie */}
              <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl p-5 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <PieIcon className="w-4 h-4 text-purple-500" />
                    <h3 className="text-sm font-semibold">Top Expense Categories</h3>
                  </div>
                </div>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={expensePieData.slice(0, 6)}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {expensePieData.slice(0, 6).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={PALETTE[index % PALETTE.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(val: any) => formatRupiah(Number(val) || 0)}
                        contentStyle={{
                          backgroundColor: "var(--bg-surface)",
                          borderColor: "var(--border-subtle)",
                          borderRadius: "8px",
                          fontSize: "11px",
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: "10px" }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {/* Interactive Financial Statement Table */}
          {report && (
            <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl shadow-sm overflow-hidden">
              <div className="p-4 sm:p-5 border-b border-[var(--border-subtle)] flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-base">Statement of Profit & Loss (Laporan Laba Rugi)</h3>
                  <p className="text-xs text-[var(--text-muted)]">
                    Calculated from actual bank settlement records and categorized mutasi
                  </p>
                </div>
                <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-medium">
                  Verified Statement
                </span>
              </div>

              <div className="divide-y divide-[var(--border-subtle)] text-sm">
                {/* ── SECTION: REVENUE ── */}
                <div className="bg-[var(--bg-surface)]">
                  <button
                    onClick={() => toggleSection("revenue")}
                    className="w-full px-4 sm:px-6 py-3.5 flex items-center justify-between hover:bg-[var(--bg-surface-2)] transition"
                  >
                    <div className="flex items-center gap-2.5 font-semibold text-emerald-600 dark:text-emerald-400">
                      {expandedSections.revenue ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      <span>1. REVENUE (PENDAPATAN USAHA)</span>
                    </div>
                    <div className="font-bold text-emerald-600 dark:text-emerald-400">
                      {formatRupiah(report.summary.grossRevenue)}
                    </div>
                  </button>

                  {expandedSections.revenue && (
                    <div className="px-6 sm:px-12 py-2 space-y-2 border-t border-[var(--border-subtle)]/50 bg-[var(--bg-surface-2)]/30">
                      {report.revenueBreakdown.map((item, i) => (
                        <div key={i} className="flex items-center justify-between text-xs py-1.5 border-b border-[var(--border-subtle)]/30 last:border-0">
                          <div>
                            <span className="font-medium text-[var(--text-main)]">{item.category}</span>
                            <span className="text-[var(--text-muted)] ml-2">({item.itemCount} transactions)</span>
                          </div>
                          <div className="font-mono font-medium">{formatRupiah(item.totalAmount)}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* ── SECTION: COGS ── */}
                <div className="bg-[var(--bg-surface)]">
                  <button
                    onClick={() => toggleSection("cogs")}
                    className="w-full px-4 sm:px-6 py-3.5 flex items-center justify-between hover:bg-[var(--bg-surface-2)] transition"
                  >
                    <div className="flex items-center gap-2.5 font-semibold text-rose-600 dark:text-rose-400">
                      {expandedSections.cogs ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      <span>2. COST OF GOODS SOLD (HARGA POKOK PENJUALAN)</span>
                    </div>
                    <div className="font-bold text-rose-600 dark:text-rose-400">
                      ({formatRupiah(report.summary.totalCogs)})
                    </div>
                  </button>

                  {expandedSections.cogs && (
                    <div className="px-6 sm:px-12 py-2 space-y-2 border-t border-[var(--border-subtle)]/50 bg-[var(--bg-surface-2)]/30">
                      {report.cogsBreakdown.map((item, i) => (
                        <div key={i} className="flex items-center justify-between text-xs py-1.5 border-b border-[var(--border-subtle)]/30 last:border-0">
                          <div>
                            <span className="font-medium text-[var(--text-main)]">{item.category}</span>
                            <span className="text-[var(--text-muted)] ml-2">({item.itemCount} txs • {item.pctOfRevenue.toFixed(1)}% rev)</span>
                          </div>
                          <div className="font-mono font-medium text-rose-500">
                            {formatRupiah(item.totalAmount)}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* ── SUB-TOTAL: GROSS PROFIT ── */}
                <div className="px-4 sm:px-6 py-3.5 flex items-center justify-between bg-blue-500/5 font-bold border-y border-[var(--border-subtle)]">
                  <div className="flex items-center gap-2">
                    <span className="text-blue-600 dark:text-blue-400">GROSS PROFIT (LABA KOTOR)</span>
                    <span className="text-xs px-2 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 font-normal">
                      Margin: {report.summary.grossMarginPct.toFixed(1)}%
                    </span>
                  </div>
                  <div className={`font-mono text-base ${report.summary.grossProfit >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
                    {formatRupiah(report.summary.grossProfit)}
                  </div>
                </div>

                {/* ── SECTION: OPEX ── */}
                <div className="bg-[var(--bg-surface)]">
                  <button
                    onClick={() => toggleSection("opex")}
                    className="w-full px-4 sm:px-6 py-3.5 flex items-center justify-between hover:bg-[var(--bg-surface-2)] transition"
                  >
                    <div className="flex items-center gap-2.5 font-semibold text-amber-600 dark:text-amber-400">
                      {expandedSections.opex ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      <span>3. OPERATING EXPENSES (BEBAN OPERASIONAL)</span>
                    </div>
                    <div className="font-bold text-amber-600 dark:text-amber-400">
                      ({formatRupiah(report.summary.totalOpex)})
                    </div>
                  </button>

                  {expandedSections.opex && (
                    <div className="px-6 sm:px-12 py-2 space-y-2 border-t border-[var(--border-subtle)]/50 bg-[var(--bg-surface-2)]/30">
                      {report.opexBreakdown.map((item, i) => (
                        <div key={i} className="flex items-center justify-between text-xs py-1.5 border-b border-[var(--border-subtle)]/30 last:border-0">
                          <div>
                            <span className="font-medium text-[var(--text-main)]">{item.category}</span>
                            <span className="text-[var(--text-muted)] ml-2">({item.itemCount} txs • {item.pctOfRevenue.toFixed(1)}% rev)</span>
                          </div>
                          <div className="font-mono font-medium text-amber-500">
                            {formatRupiah(item.totalAmount)}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* ── SUB-TOTAL: OPERATING PROFIT (EBITDA) ── */}
                <div className="px-4 sm:px-6 py-3.5 flex items-center justify-between bg-[var(--bg-surface-2)] font-bold border-y border-[var(--border-subtle)]">
                  <div className="flex items-center gap-2">
                    <span>OPERATING PROFIT / EBITDA (LABA OPERASIONAL)</span>
                    <span className="text-xs px-2 py-0.5 rounded bg-[var(--bg-surface)] text-[var(--text-muted)] font-normal">
                      Margin: {report.summary.operatingMarginPct.toFixed(1)}%
                    </span>
                  </div>
                  <div className={`font-mono text-base ${report.summary.operatingProfit >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
                    {formatRupiah(report.summary.operatingProfit)}
                  </div>
                </div>

                {/* ── SECTION: NON-OPERATING / CAPEX / OWNER TRANSFERS ── */}
                <div className="bg-[var(--bg-surface)]">
                  <button
                    onClick={() => toggleSection("nonOp")}
                    className="w-full px-4 sm:px-6 py-3.5 flex items-center justify-between hover:bg-[var(--bg-surface-2)] transition"
                  >
                    <div className="flex items-center gap-2.5 font-semibold text-purple-600 dark:text-purple-400">
                      {expandedSections.nonOp ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      <span>4. NON-OPERATING, CAPEX & TRANSFERS</span>
                    </div>
                    <div className="font-bold text-purple-600 dark:text-purple-400">
                      {formatRupiah(report.summary.nonOperatingNet)}
                    </div>
                  </button>

                  {expandedSections.nonOp && (
                    <div className="px-6 sm:px-12 py-2 space-y-2 border-t border-[var(--border-subtle)]/50 bg-[var(--bg-surface-2)]/30">
                      {report.nonOpBreakdown.map((item, i) => (
                        <div key={i} className="flex items-center justify-between text-xs py-1.5 border-b border-[var(--border-subtle)]/30 last:border-0">
                          <div>
                            <span className="font-medium text-[var(--text-main)]">{item.category}</span>
                            <span className="text-[var(--text-muted)] ml-2">({item.itemCount} txs)</span>
                          </div>
                          <div className="font-mono font-medium">
                            {formatRupiah(item.totalAmount)}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* ── FINAL NET RESULT ── */}
                <div className="px-4 sm:px-6 py-4 flex items-center justify-between bg-emerald-500/10 font-bold text-base">
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-700 dark:text-emerald-300">NET CASH MOVEMENT / RESULT</span>
                  </div>
                  <div className={`font-mono text-lg ${report.summary.netCashMovement >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
                    {formatRupiah(report.summary.netCashMovement)}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── TAB 2: CASH FLOW STATEMENT ─── */}
      {activeTab === "cashflow" && report && (
        <div className="space-y-6">
          <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl p-5 shadow-sm space-y-4">
            <div>
              <h3 className="text-base font-semibold">Cash Flow Statement (Laporan Arus Kas)</h3>
              <p className="text-xs text-[var(--text-muted)]">Reconciliation of bank cash inflows, outflows and liquidity</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-[var(--border-subtle)] text-[11px] font-semibold text-[var(--text-muted)] uppercase">
                    <th className="py-2.5 px-3">Flow Item</th>
                    <th className="py-2.5 px-3">Category</th>
                    <th className="py-2.5 px-3 text-right">Inflow (CR)</th>
                    <th className="py-2.5 px-3 text-right">Outflow (DB)</th>
                    <th className="py-2.5 px-3 text-right">Net Flow</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-subtle)]/40 text-xs">
                  {/* Operating Cash Inflows */}
                  <tr className="bg-emerald-500/5 font-semibold">
                    <td colSpan={2} className="py-2 px-3 text-emerald-600 dark:text-emerald-400">
                      Operating Inflows (Revenue & Settlements)
                    </td>
                    <td className="py-2 px-3 text-right font-mono text-emerald-600">
                      {formatRupiah(report.summary.grossRevenue)}
                    </td>
                    <td className="py-2 px-3 text-right font-mono">-</td>
                    <td className="py-2 px-3 text-right font-mono text-emerald-600">
                      +{formatRupiah(report.summary.grossRevenue)}
                    </td>
                  </tr>

                  {/* COGS Outflows */}
                  <tr>
                    <td className="py-2 px-3 pl-6 text-[var(--text-main)]">Cost of Goods Sold (Ingredients & Packaging)</td>
                    <td className="py-2 px-3 text-[var(--text-muted)]">COGS</td>
                    <td className="py-2 px-3 text-right font-mono">-</td>
                    <td className="py-2 px-3 text-right font-mono text-rose-500">
                      {formatRupiah(report.summary.totalCogs)}
                    </td>
                    <td className="py-2 px-3 text-right font-mono text-rose-500">
                      -{formatRupiah(report.summary.totalCogs)}
                    </td>
                  </tr>

                  {/* OPEX Outflows */}
                  <tr>
                    <td className="py-2 px-3 pl-6 text-[var(--text-main)]">Operating Expenses (Payroll, Rent, Utilities, Logistics)</td>
                    <td className="py-2 px-3 text-[var(--text-muted)]">OPEX</td>
                    <td className="py-2 px-3 text-right font-mono">-</td>
                    <td className="py-2 px-3 text-right font-mono text-amber-500">
                      {formatRupiah(report.summary.totalOpex)}
                    </td>
                    <td className="py-2 px-3 text-right font-mono text-amber-500">
                      -{formatRupiah(report.summary.totalOpex)}
                    </td>
                  </tr>

                  {/* Net Operating Cash Flow */}
                  <tr className="font-semibold bg-[var(--bg-surface-2)]">
                    <td colSpan={4} className="py-2.5 px-3">
                      Net Cash Flow from Operations
                    </td>
                    <td className={`py-2.5 px-3 text-right font-mono ${report.summary.operatingProfit >= 0 ? "text-emerald-600" : "text-rose-500"}`}>
                      {formatRupiah(report.summary.operatingProfit)}
                    </td>
                  </tr>

                  {/* Financing & Capex */}
                  <tr>
                    <td className="py-2 px-3 pl-6 text-[var(--text-main)]">Capex, Equipment & Owner Transfers</td>
                    <td className="py-2 px-3 text-[var(--text-muted)]">Non-Operating</td>
                    <td className="py-2 px-3 text-right font-mono">-</td>
                    <td className="py-2 px-3 text-right font-mono">
                      {formatRupiah(Math.abs(report.summary.nonOperatingNet))}
                    </td>
                    <td className="py-2 px-3 text-right font-mono">
                      {formatRupiah(report.summary.nonOperatingNet)}
                    </td>
                  </tr>

                  {/* Net Cash Movement */}
                  <tr className="font-bold text-sm bg-blue-500/10">
                    <td colSpan={4} className="py-3 px-3 text-blue-700 dark:text-blue-300">
                      Net Cash Inflow / (Outflow) for Period
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-blue-700 dark:text-blue-300">
                      {formatRupiah(report.summary.netCashMovement)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB: SMART RECONCILIATION (BANK & POS) ─── */}
      {activeTab === "reconciliation" && (
        <SmartReconciliationWorkbench bankFilter={bankFilter} periodFilter={periodFilter} />
      )}

      {/* ─── TAB 3: BANK STATEMENTS & UPLOAD ─── */}
      {activeTab === "statements" && (
        <div className="space-y-6">
          {/* Bank Uploader Card */}
          <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[var(--border-subtle)] pb-3">
              <div>
                <h3 className="font-semibold text-base flex items-center gap-2">
                  <UploadCloud className="w-5 h-5 text-blue-500" />
                  <span>Upload Bank Statements (BCA & Panin)</span>
                </h3>
                <p className="text-xs text-[var(--text-muted)]">
                  Directly ingest PDF e-statements or CSV exports from BCA (KlikBCA / myBCA) and Panin Bank
                </p>
              </div>

              {/* Bank selector toggle */}
              <div className="flex items-center gap-1.5 p-1 bg-[var(--bg-surface-2)] rounded-lg text-xs font-medium">
                <button
                  type="button"
                  onClick={() => setUploadBank("auto")}
                  className={`px-3 py-1 rounded-md transition ${uploadBank === "auto" ? "bg-[var(--bg-surface)] shadow text-blue-600 dark:text-blue-400 font-semibold" : "text-[var(--text-muted)]"}`}
                >
                  Auto-Detect
                </button>
                <button
                  type="button"
                  onClick={() => setUploadBank("BCA")}
                  className={`px-3 py-1 rounded-md transition ${uploadBank === "BCA" ? "bg-[var(--bg-surface)] shadow text-blue-600 dark:text-blue-400 font-semibold" : "text-[var(--text-muted)]"}`}
                >
                  BCA
                </button>
                <button
                  type="button"
                  onClick={() => setUploadBank("Panin")}
                  className={`px-3 py-1 rounded-md transition ${uploadBank === "Panin" ? "bg-[var(--bg-surface)] shadow text-blue-600 dark:text-blue-400 font-semibold" : "text-[var(--text-muted)]"}`}
                >
                  Panin Bank
                </button>
              </div>
            </div>

            <form onSubmit={handleFileUpload} className="space-y-4">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-[var(--border-subtle)] hover:border-blue-500/50 rounded-xl p-8 text-center cursor-pointer transition bg-[var(--bg-surface-2)]/20 hover:bg-[var(--bg-surface-2)]/40 space-y-2"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".pdf,.csv,.txt"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files) {
                      setUploadFiles(Array.from(e.target.files));
                    }
                  }}
                />
                <div className="w-12 h-12 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 mx-auto flex items-center justify-center">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <div className="text-sm font-semibold">
                  Click or drag files here to upload bank statements
                </div>
                <div className="text-xs text-[var(--text-muted)]">
                  Supports BCA & Panin Bank • Formats: PDF (Rekening Koran) & CSV exports
                </div>
                {uploadFiles.length > 0 && (
                  <div className="pt-2 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                    {uploadFiles.length} file(s) selected: {uploadFiles.map((f) => f.name).join(", ")}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between">
                <div className="text-xs text-[var(--text-muted)]">
                  Statements are automatically parsed, categorized, and reconciled against account balance headers.
                </div>
                <button
                  type="submit"
                  disabled={uploadFiles.length === 0 || uploading}
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-2 shadow-sm transition"
                >
                  {uploading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4" />}
                  <span>{uploading ? "Parsing Statement..." : "Process & Categorize"}</span>
                </button>
              </div>
            </form>

            {/* Upload results audit */}
            {uploadResults && (
              <div className="p-4 rounded-xl bg-[var(--bg-surface-2)] border border-[var(--border-subtle)] space-y-2 text-xs">
                <div className="font-semibold text-sm">Upload Result:</div>
                {uploadResults.map((res, idx) => (
                  <div key={idx} className="flex items-center justify-between py-1 border-b border-[var(--border-subtle)]/40 last:border-0">
                    <div className="flex items-center gap-2">
                      {res.status === "SUCCESS" ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-rose-500" />
                      )}
                      <span className="font-medium">{res.fileName}</span>
                      <span className="text-[var(--text-muted)]">({res.bankName} • {res.period})</span>
                    </div>
                    <div>
                      {res.status === "SUCCESS" ? (
                        <span className="text-emerald-600 dark:text-emerald-400 font-mono">
                          {res.txCount} transactions parsed (CR: {formatShortRupiah(res.totalCr)} | DB: {formatShortRupiah(res.totalDb)})
                        </span>
                      ) : (
                        <span className="text-rose-500">{res.message}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Reconciled Bank Statements Summary */}
          {report && (
            <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl p-5 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--border-subtle)] pb-3">
                <div>
                  <h3 className="text-base font-semibold">Active Bank Accounts & Reconciliation Status</h3>
                  <p className="text-xs text-[var(--text-muted)]">
                    Verification of Starting Balance + Credits - Debits == Ending Balance (BCA & Panin Bank)
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleReseed}
                  disabled={reseeding}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--bg-surface-2)] hover:bg-[var(--bg-surface-3)] border border-[var(--border-subtle)] text-xs font-semibold text-[var(--text-main)] shadow-sm transition"
                  title="Resync statements from data/bank_statements"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${reseeding ? "animate-spin text-blue-500" : "text-blue-500"}`} />
                  <span>{reseeding ? "Resyncing..." : "Reseed Verified Archive (July-Sept)"}</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {report.accountBalances.map((acc, i) => (
                  <div
                    key={i}
                    className="p-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface-2)]/40 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold text-xs">
                          {acc.bankName}
                        </div>
                        <div>
                          <div className="font-semibold text-sm">{acc.bankName} - {acc.accountNumber}</div>
                          <div className="text-[11px] text-[var(--text-muted)]">{acc.accountName} • Period {acc.period}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {acc.isReconciled ? (
                          <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            <span>Reconciled</span>
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-[11px] font-semibold text-amber-600 bg-amber-500/10 px-2 py-0.5 rounded-full">
                            <AlertCircle className="w-3.5 h-3.5" />
                            <span>Unbalanced</span>
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-[var(--border-subtle)]">
                      <div>
                        <div className="text-[10px] text-[var(--text-muted)] uppercase">Starting Balance</div>
                        <div className="font-mono font-medium">{formatRupiah(acc.startingBalance)}</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-[var(--text-muted)] uppercase">Ending Balance</div>
                        <div className="font-mono font-medium">{formatRupiah(acc.endingBalance)}</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-emerald-600 uppercase">Total Inflow (CR)</div>
                        <div className="font-mono font-medium text-emerald-600">+{formatRupiah(acc.totalCr)}</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-rose-500 uppercase">Total Outflow (DB)</div>
                        <div className="font-mono font-medium text-rose-500">-{formatRupiah(acc.totalDb)}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── TAB 4: TRANSACTIONS & CATEGORIZATION ─── */}
      {activeTab === "transactions" && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl p-4 shadow-sm flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
              {/* Search */}
              <div className="relative flex-1 min-w-[180px]">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                <input
                  type="text"
                  placeholder="Search description, recipient, category..."
                  value={txSearch}
                  onChange={(e) => {
                    setTxSearch(e.target.value);
                    setTxPage(1);
                  }}
                  className="w-full pl-9 pr-3 py-1.5 bg-[var(--bg-surface-2)] border border-[var(--border-subtle)] rounded-lg outline-none text-xs text-[var(--text-main)]"
                />
              </div>

              {/* Type Filter */}
              <select
                value={txTypeFilter}
                onChange={(e) => {
                  setTxTypeFilter(e.target.value);
                  setTxPage(1);
                }}
                className="bg-[var(--bg-surface-2)] border border-[var(--border-subtle)] rounded-lg px-2.5 py-1.5 text-xs text-[var(--text-main)]"
              >
                <option value="all">All Types (CR & DB)</option>
                <option value="CR">Inflow (CR) Only</option>
                <option value="DB">Outflow (DB) Only</option>
              </select>

              {/* Category Filter */}
              <select
                value={txCategoryFilter}
                onChange={(e) => {
                  setTxCategoryFilter(e.target.value);
                  setTxPage(1);
                }}
                className="bg-[var(--bg-surface-2)] border border-[var(--border-subtle)] rounded-lg px-2.5 py-1.5 text-xs text-[var(--text-main)]"
              >
                <option value="all">All Categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={exportTransactionsCsv}
                disabled={exportingTx || txList.length === 0}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--bg-surface-2)] hover:bg-[var(--bg-surface-3)] border border-[var(--border-subtle)] text-xs font-semibold text-[var(--text-main)] shadow-sm transition"
                title="Download filtered transactions as CSV"
              >
                <Download className={`w-3.5 h-3.5 ${exportingTx ? "animate-bounce" : "text-blue-600 dark:text-blue-400"}`} />
                <span>{exportingTx ? "Exporting..." : "Export CSV"}</span>
              </button>
              <div className="text-[var(--text-muted)] font-mono text-xs">
                Showing {txList.length} of {txTotalCount} transactions
              </div>
            </div>
          </div>

          {/* Quick Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] text-[var(--text-muted)] font-medium mr-1">Quick Presets:</span>
            <button
              type="button"
              onClick={() => {
                setTxTypeFilter("all");
                setTxCategoryFilter("all");
                setTxSearch("");
                setTxPage(1);
              }}
              className={`px-2.5 py-1 rounded-full text-[11px] transition ${
                txTypeFilter === "all" && txCategoryFilter === "all" && !txSearch
                  ? "bg-blue-600 text-white font-semibold"
                  : "bg-[var(--bg-surface-2)] text-[var(--text-muted)] hover:text-[var(--text-main)]"
              }`}
            >
              All Mutasi
            </button>
            <button
              type="button"
              onClick={() => {
                setTxTypeFilter("CR");
                setTxCategoryFilter("Online Delivery Settlements");
                setTxSearch("");
                setTxPage(1);
              }}
              className={`px-2.5 py-1 rounded-full text-[11px] transition ${
                txCategoryFilter === "Online Delivery Settlements"
                  ? "bg-emerald-600 text-white font-semibold"
                  : "bg-[var(--bg-surface-2)] text-[var(--text-muted)] hover:text-[var(--text-main)]"
              }`}
            >
              🛵 GoPay & OVO Settlements
            </button>
            <button
              type="button"
              onClick={() => {
                setTxTypeFilter("CR");
                setTxCategoryFilter("Dine-In & QRIS Settlements");
                setTxSearch("");
                setTxPage(1);
              }}
              className={`px-2.5 py-1 rounded-full text-[11px] transition ${
                txCategoryFilter === "Dine-In & QRIS Settlements"
                  ? "bg-emerald-600 text-white font-semibold"
                  : "bg-[var(--bg-surface-2)] text-[var(--text-muted)] hover:text-[var(--text-main)]"
              }`}
            >
              📱 QRIS & EDC Dine-In
            </button>
            <button
              type="button"
              onClick={() => {
                setTxTypeFilter("DB");
                setTxCategoryFilter("Food & Beverage Ingredients (BOM)");
                setTxSearch("");
                setTxPage(1);
              }}
              className={`px-2.5 py-1 rounded-full text-[11px] transition ${
                txCategoryFilter === "Food & Beverage Ingredients (BOM)"
                  ? "bg-rose-600 text-white font-semibold"
                  : "bg-[var(--bg-surface-2)] text-[var(--text-muted)] hover:text-[var(--text-main)]"
              }`}
            >
              🥩 Ingredients & COGS Suppliers
            </button>
            <button
              type="button"
              onClick={() => {
                setTxTypeFilter("DB");
                setTxCategoryFilter("Salaries & Operational Wages");
                setTxSearch("");
                setTxPage(1);
              }}
              className={`px-2.5 py-1 rounded-full text-[11px] transition ${
                txCategoryFilter === "Salaries & Operational Wages"
                  ? "bg-amber-600 text-white font-semibold"
                  : "bg-[var(--bg-surface-2)] text-[var(--text-muted)] hover:text-[var(--text-main)]"
              }`}
            >
              👥 Payroll & Staff
            </button>
            <button
              type="button"
              onClick={() => {
                setTxTypeFilter("CR");
                setTxCategoryFilter("Owner Transfers & Drawings");
                setTxSearch("");
                setTxPage(1);
              }}
              className={`px-2.5 py-1 rounded-full text-[11px] transition ${
                txTypeFilter === "CR" && txCategoryFilter === "Owner Transfers & Drawings"
                  ? "bg-purple-600 text-white font-semibold"
                  : "bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 hover:bg-purple-500/20"
              }`}
            >
              💎 Owner Injections / DP Transfers (Non-Op)
            </button>
          </div>

          {/* Transactions Table */}
          <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[var(--border-subtle)] text-[11px] font-semibold text-[var(--text-muted)] uppercase bg-[var(--bg-surface-2)]/50">
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Bank</th>
                    <th className="py-2.5 px-3">Description</th>
                    <th className="py-2.5 px-3 text-right">Amount</th>
                    <th className="py-2.5 px-3">Category</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-subtle)]/40">
                  {txLoading ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-[var(--text-muted)]">
                        <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-blue-500" />
                        Loading transactions...
                      </td>
                    </tr>
                  ) : txList.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-[var(--text-muted)]">
                        No transactions found for the selected filters.
                      </td>
                    </tr>
                  ) : (
                    txList.map((tx) => (
                      <tr key={tx.tx_id} className="hover:bg-[var(--bg-surface-2)]/40 transition">
                        <td className="py-2.5 px-3 font-mono text-[var(--text-muted)] whitespace-nowrap">
                          {tx.tx_date}
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400">
                            {tx.bank_name}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 max-w-md truncate font-medium text-[var(--text-main)]" title={tx.description}>
                          {tx.description}
                        </td>
                        <td className={`py-2.5 px-3 text-right font-mono font-medium whitespace-nowrap ${tx.tx_type === "CR" ? "text-emerald-600 dark:text-emerald-400" : "text-rose-500"}`}>
                          {tx.tx_type === "CR" ? "+" : "-"}
                          {formatRupiah(tx.amount)}
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${
                            tx.category_type === "REVENUE"
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                              : tx.category_type === "COGS"
                              ? "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                              : tx.category_type === "OPEX"
                              ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                              : "bg-purple-500/10 text-purple-600 dark:text-purple-400"
                          }`}>
                            {tx.category}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right whitespace-nowrap">
                          <button
                            onClick={() => {
                              setEditingTx(tx);
                              setSelectedCat(tx.category);
                              setSelectedSub(tx.subcategory || "");
                            }}
                            className="p-1 rounded hover:bg-[var(--bg-surface-2)] text-[var(--text-muted)] hover:text-blue-600 transition"
                            title="Recategorize"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {txTotalCount > txLimit && (
              <div className="p-3 border-t border-[var(--border-subtle)] flex items-center justify-between text-xs">
                <button
                  disabled={txPage <= 1}
                  onClick={() => setTxPage((p) => Math.max(1, p - 1))}
                  className="px-3 py-1 rounded bg-[var(--bg-surface-2)] disabled:opacity-40"
                >
                  Previous
                </button>
                <span className="text-[var(--text-muted)]">
                  Page {txPage} of {Math.ceil(txTotalCount / txLimit)}
                </span>
                <button
                  disabled={txPage >= Math.ceil(txTotalCount / txLimit)}
                  onClick={() => setTxPage((p) => p + 1)}
                  className="px-3 py-1 rounded bg-[var(--bg-surface-2)] disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── TAB 5: CATEGORY RULES ─── */}
      {activeTab === "rules" && (
        <div className="space-y-4">
          <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl p-5 shadow-sm space-y-3">
            <h3 className="text-base font-semibold flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-500" />
              <span>Automated Categorization Rules Dictionary</span>
            </h3>
            <p className="text-xs text-[var(--text-muted)]">
              When bank statements are parsed, transactions are automatically categorized based on these keyword patterns.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
              {categories.map((cat) => (
                <div key={cat.id} className="p-3.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface-2)]/30 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-[var(--text-main)]">{cat.name}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      cat.type === "REVENUE"
                        ? "bg-emerald-500/15 text-emerald-600"
                        : cat.type === "COGS"
                        ? "bg-rose-500/15 text-rose-600"
                        : cat.type === "OPEX"
                        ? "bg-amber-500/15 text-amber-600"
                        : "bg-purple-500/15 text-purple-600"
                    }`}>
                      {cat.type}
                    </span>
                  </div>
                  <p className="text-[11px] text-[var(--text-muted)]">{cat.description}</p>
                  <div className="space-y-1 pt-1 border-t border-[var(--border-subtle)]/40">
                    <div className="text-[10px] font-semibold text-[var(--text-muted)] uppercase">Subcategories:</div>
                    <div className="flex flex-wrap gap-1">
                      {cat.subcategories.map((sub: string, sIdx: number) => (
                        <span key={sIdx} className="px-1.5 py-0.5 rounded bg-[var(--bg-surface)] text-[10px] border border-[var(--border-subtle)]/50">
                          {sub}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL: EDIT CATEGORY ─── */}
      {editingTx && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl max-w-lg w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
              <h3 className="font-semibold text-sm">Recategorize Transaction</h3>
              <button
                onClick={() => setEditingTx(null)}
                className="text-[var(--text-muted)] hover:text-[var(--text-main)]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-lg bg-[var(--bg-surface-2)] space-y-1">
                <div className="text-[11px] text-[var(--text-muted)]">{editingTx.tx_date} • {editingTx.bank_name}</div>
                <div className="font-semibold text-[var(--text-main)]">{editingTx.description}</div>
                <div className="font-mono text-sm font-bold text-blue-600">
                  {formatRupiah(editingTx.amount)} ({editingTx.tx_type})
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-[var(--text-muted)] mb-1">
                  Accounting Category
                </label>
                <select
                  value={selectedCat}
                  onChange={(e) => {
                    setSelectedCat(e.target.value);
                    const def = categories.find((c) => c.name === e.target.value);
                    setSelectedSub(def?.subcategories?.[0] || "");
                  }}
                  className="w-full bg-[var(--bg-surface-2)] border border-[var(--border-subtle)] rounded-lg p-2 text-xs"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.type}: {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {selectedCat && (
                <div>
                  <label className="block text-[11px] font-medium text-[var(--text-muted)] mb-1">
                    Subcategory
                  </label>
                  <select
                    value={selectedSub}
                    onChange={(e) => setSelectedSub(e.target.value)}
                    className="w-full bg-[var(--bg-surface-2)] border border-[var(--border-subtle)] rounded-lg p-2 text-xs"
                  >
                    {categories
                      .find((c) => c.name === selectedCat)
                      ?.subcategories.map((s: string, idx: number) => (
                        <option key={idx} value={s}>
                          {s}
                        </option>
                      ))}
                  </select>
                </div>
              )}

              <label className="flex items-center gap-2 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={applyToSimilar}
                  onChange={(e) => setApplyToSimilar(e.target.checked)}
                  className="rounded text-blue-600"
                />
                <span className="text-[11px] text-[var(--text-muted)]">
                  Apply to all similar existing and future transactions (creates auto-rule)
                </span>
              </label>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--border-subtle)]">
              <button
                type="button"
                onClick={() => setEditingTx(null)}
                className="px-3 py-1.5 rounded-lg border border-[var(--border-subtle)] text-xs font-medium hover:bg-[var(--bg-surface-2)] transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveCategory}
                disabled={savingCategory}
                className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 transition"
              >
                {savingCategory && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>Save Category</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
