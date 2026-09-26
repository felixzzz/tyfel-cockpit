"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Users,
  Calendar,
  Clock,
  CheckCircle2,
  DollarSign,
  Award,
  FileSpreadsheet,
  UploadCloud,
  ArrowLeft,
  Sliders,
  Printer,
  Download,
  ShieldAlert,
  Sparkles,
  UserCheck,
  Edit3,
  Save,
  Sun,
  Moon,
  Search,
} from "lucide-react";
import type {
  AttendanceCycleReport,
  EmployeePayslipSummary,
  AttendanceRecord,
} from "@/lib/attendance";

function formatRp(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatNumber(n: number): string {
  return new Intl.NumberFormat("id-ID", {
    maximumFractionDigits: 0,
  }).format(Math.abs(n));
}

function formatAccountingRp(amount: number, showDashIfZero = true): string {
  if (amount === 0) {
    return showDashIfZero ? "Rp -" : "Rp 0";
  }
  if (amount < 0) {
    return `Rp (${formatNumber(amount)})`;
  }
  return `Rp ${formatNumber(amount)}`;
}

export default function AttendancePayrollPage() {
  const [report, setReport] = useState<AttendanceCycleReport | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedPeriod, setSelectedPeriod] = useState<string>(
    "2026-08-16_to_2026-09-15"
  );
  const [customFrom, setCustomFrom] = useState<string>("2026-08-16");
  const [customTo, setCustomTo] = useState<string>("2026-09-15");
  const [selectedEmpName, setSelectedEmpName] = useState<string>("Aji");

  // Payslip visual mode: 'light' matches the exact Tyfel Coffee spreadsheet screenshot
  const [slipTheme, setSlipTheme] = useState<"light" | "dark">("light");
  const [isEditingSlip, setIsEditingSlip] = useState<boolean>(false);
  const [savingSlip, setSavingSlip] = useState<boolean>(false);
  const [saveBanner, setSaveBanner] = useState<string | null>(null);

  // Edit form state
  const [editFullName, setEditFullName] = useState<string>("");
  const [editRole, setEditRole] = useState<string>("");
  const [editJoinDate, setEditJoinDate] = useState<string>("");
  const [editShiftCutoff, setEditShiftCutoff] = useState<string>("07:30");
  const [editBasicSalary, setEditBasicSalary] = useState<number>(800000);
  const [editDailyRate, setEditDailyRate] = useState<number>(85000);
  const [editLatePenalty, setEditLatePenalty] = useState<number>(20000);
  const [editNoLateBonus, setEditNoLateBonus] = useState<number>(85000);
  const [editDailyOverride, setEditDailyOverride] = useState<string>("");
  const [editLateOverride, setEditLateOverride] = useState<string>("");
  const [editCustomDesc, setEditCustomDesc] = useState<string>("");
  const [editCustomQty, setEditCustomQty] = useState<number>(0);
  const [editCustomUnit, setEditCustomUnit] = useState<number>(0);
  const [editKasbonQty, setEditKasbonQty] = useState<number>(0);
  const [editKasbonUnit, setEditKasbonUnit] = useState<number>(0);
  const [editNotes, setEditNotes] = useState<string>("");

  // Daily log filter state
  const [logEmpFilter, setLogEmpFilter] = useState<string>("all");
  const [logStatusFilter, setLogStatusFilter] = useState<
    "all" | "late" | "anomaly" | "ontime"
  >("all");
  const [logSearch, setLogSearch] = useState<string>("");

  // CSV Upload state
  const [isUploadingCsv, setIsUploadingCsv] = useState<boolean>(false);
  const [uploadNotice, setUploadNotice] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function fetchReport(opts?: {
    period?: string;
    from?: string;
    to?: string;
  }) {
    setLoading(true);
    try {
      const qs = new URLSearchParams();
      if (opts?.period) qs.set("period", opts.period);
      if (opts?.from) qs.set("from", opts.from);
      if (opts?.to) qs.set("to", opts.to);

      const res = await fetch(`/api/attendance?${qs.toString()}`);
      const data = await res.json();
      if (data.success && data.report) {
        setReport(data.report);
        setCustomFrom(data.report.start_date);
        setCustomTo(data.report.end_date);
      }
    } catch (err) {
      console.error("Failed to fetch attendance report:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchReport({ period: selectedPeriod });
  }, [selectedPeriod]);

  const activeSlip: EmployeePayslipSummary | undefined =
    report?.payslips.find(
      (p) => p.employee.employee_name === selectedEmpName
    ) || report?.payslips[0];

  // Sync edit form whenever activeSlip changes
  useEffect(() => {
    if (!activeSlip) return;
    setEditFullName(activeSlip.employee.full_name);
    setEditRole(activeSlip.employee.role);
    setEditJoinDate(activeSlip.employee.join_date_label);
    setEditShiftCutoff(activeSlip.employee.shift_start_time);
    setEditBasicSalary(activeSlip.employee.basic_salary);
    setEditDailyRate(activeSlip.employee.daily_rate);
    setEditLatePenalty(activeSlip.employee.late_penalty_rate);
    setEditNoLateBonus(activeSlip.employee.no_late_bonus);
    setEditDailyOverride(
      activeSlip.daily_is_overridden ? String(activeSlip.daily_qty) : ""
    );
    setEditLateOverride(
      activeSlip.late_is_overridden ? String(activeSlip.late_qty) : ""
    );
    setEditCustomDesc(activeSlip.custom_desc || "");
    setEditCustomQty(activeSlip.custom_qty || 0);
    setEditCustomUnit(activeSlip.custom_unit || 0);
    setEditKasbonQty(activeSlip.kasbon_qty || 0);
    setEditKasbonUnit(activeSlip.kasbon_unit || 0);
    setEditNotes(activeSlip.notes || "");
  }, [activeSlip]);

  async function handleSavePayslip(e: React.FormEvent) {
    e.preventDefault();
    if (!activeSlip || !report) return;
    setSavingSlip(true);
    setSaveBanner(null);
    try {
      const res = await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employee_name: activeSlip.employee.employee_name,
          period_key: report.period_key,
          full_name: editFullName,
          role: editRole,
          join_date_label: editJoinDate,
          shift_start_time: editShiftCutoff,
          basic_salary: Number(editBasicSalary),
          daily_rate: Number(editDailyRate),
          late_penalty_rate: Number(editLatePenalty),
          no_late_bonus: Number(editNoLateBonus),
          daily_count_override:
            editDailyOverride.trim() === "" ? null : Number(editDailyOverride),
          late_count_override:
            editLateOverride.trim() === "" ? null : Number(editLateOverride),
          custom_desc: editCustomDesc,
          custom_qty: Number(editCustomQty),
          custom_unit_value: Number(editCustomUnit),
          kasbon_qty: Number(editKasbonQty),
          kasbon_unit_value: Number(editKasbonUnit),
          notes: editNotes,
        }),
      });
      const data = await res.json();
      if (data.success && data.report) {
        setReport(data.report);
        setIsEditingSlip(false);
        setSaveBanner(
          `Saved payslip & rate configuration for ${editFullName} (${report.salary_code})`
        );
        setTimeout(() => setSaveBanner(null), 4000);
      }
    } catch (err) {
      console.error("Failed to save payslip:", err);
    } finally {
      setSavingSlip(false);
    }
  }

  async function handleUploadAttendanceCsv(
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingCsv(true);
    setUploadNotice(null);
    try {
      const formData = new FormData();
      formData.append("files", file);
      const res = await fetch("/api/ingest", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.results?.[0]?.message) {
        setUploadNotice(data.results[0].message);
      } else {
        setUploadNotice(`Uploaded ${file.name} and refreshed attendance logs.`);
      }
      await fetchReport({ period: selectedPeriod });
    } catch (err) {
      console.error("Upload error:", err);
    } finally {
      setIsUploadingCsv(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function handleExportPayrollCsv() {
    if (!report) return;
    const headers = [
      "Period",
      "Salary Code",
      "Employee ID",
      "Full Name",
      "Role",
      "Join Date",
      "Shift Cutoff",
      "Raw Logs",
      "Paid Daily (#)",
      "Daily Rate",
      "Daily Total",
      "Basic Salary",
      "Telat (#)",
      "Telat Penalty Rate",
      "Telat Total",
      "Bonus Tidak Telat (#)",
      "Bonus Total",
      "Custom Adjustment",
      "Grand Total",
      "Kasbon Deduction",
      "Net Take-Home Pay",
    ];
    const rows = report.payslips.map((p) => [
      `${report.start_date} to ${report.end_date}`,
      report.salary_code,
      p.employee.employee_name,
      `"${p.employee.full_name}"`,
      `"${p.employee.role}"`,
      `"${p.employee.join_date_label}"`,
      p.employee.shift_start_time,
      p.raw_logs_count,
      p.daily_qty,
      p.daily_unit,
      p.daily_total,
      p.basic_total,
      p.late_qty,
      p.late_unit,
      p.late_total,
      p.bonus_tidak_telat_qty,
      p.bonus_tidak_telat_total,
      p.custom_total,
      p.grand_total,
      p.kasbon_total,
      p.net_take_home_pay,
    ]);
    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `tyfel_payroll_${report.salary_code}_${report.start_date}_to_${report.end_date}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  const filteredLogs: AttendanceRecord[] = (report?.recent_logs || []).filter(
    (log) => {
      if (logEmpFilter !== "all" && log.employee_name !== logEmpFilter) {
        return false;
      }
      if (logStatusFilter === "late" && !log.is_late) return false;
      if (logStatusFilter === "anomaly" && log.anomaly_type === "none")
        return false;
      if (
        logStatusFilter === "ontime" &&
        (log.is_late || log.anomaly_type === "closing_tap")
      )
        return false;
      if (logSearch.trim() !== "") {
        const q = logSearch.toLowerCase();
        return (
          log.employee_name.toLowerCase().includes(q) ||
          log.work_date.includes(q) ||
          log.raw_duration.toLowerCase().includes(q)
        );
      }
      return true;
    }
  );

  return (
    <main className="min-h-screen p-4 sm:p-6 lg:p-10 space-y-8 max-w-[1600px] mx-auto">
      {/* =========================================================================
          Top Header: Navigation & Attendance CSV Upload
          ========================================================================= */}
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 pb-6 border-b border-white/[0.08]">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs font-mono text-zinc-400 hover:text-white transition-colors bg-white/[0.04] hover:bg-white/[0.08] px-3 py-1.5 rounded-lg border border-white/[0.08]"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to Executive Cockpit
            </Link>
            <span className="text-xs font-mono uppercase tracking-widest px-2.5 py-1 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
              16–15 Payroll Cycle Engine
            </span>
          </div>
          <div className="flex items-center gap-3.5">
            <div className="p-2.5 rounded-2xl bg-[#5c7c5c]/25 border border-[#5c7c5c]/50 text-[#e9e5c9]">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-white">
                Tyfel Coffee · Employee Attendance & Payslip Cockpit
              </h1>
              <p className="text-xs sm:text-sm text-zinc-400 mt-0.5">
                Automated 16th–15th monthly cutoff attendance audit, shift punctuality tracking, anomaly filtering & instant payslip generation
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleUploadAttendanceCsv}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploadingCsv}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-black transition-colors cursor-pointer disabled:opacity-50"
          >
            <UploadCloud className="w-4 h-4" />
            {isUploadingCsv
              ? "Importing Absensi..."
              : "Upload Laporan Absensi CSV"}
          </button>

          <button
            type="button"
            onClick={handleExportPayrollCsv}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-mono bg-white/[0.05] hover:bg-white/[0.1] text-zinc-200 border border-white/[0.1] transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            Export Payroll CSV
          </button>
        </div>
      </header>

      {uploadNotice && (
        <div className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-200 text-xs">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{uploadNotice}</span>
          </div>
          <button
            onClick={() => setUploadNotice(null)}
            className="text-zinc-400 hover:text-white text-xs font-mono"
          >
            Dismiss
          </button>
        </div>
      )}

      {saveBanner && (
        <div className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-200 text-xs">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{saveBanner}</span>
          </div>
        </div>
      )}

      {/* =========================================================================
          16–15 Payroll Cycle Bar & Custom Date Filter
          ========================================================================= */}
      <section className="glass-card rounded-2xl p-4 sm:p-5 border border-white/[0.08] bg-[#18191e]">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-zinc-400">
              <Calendar className="w-3.5 h-3.5 text-emerald-400" />
              <span>Select 16th–15th Payroll Cutoff Period</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {(report?.available_cycles || []).map((cyc) => {
                const isSelected = report?.period_key === cyc.period_key;
                return (
                  <button
                    key={cyc.period_key}
                    type="button"
                    onClick={() => setSelectedPeriod(cyc.period_key)}
                    className={`px-3.5 py-2 rounded-xl text-left transition-all cursor-pointer border ${
                      isSelected
                        ? "bg-emerald-500/15 border-emerald-500/50 text-white shadow-sm"
                        : "bg-white/[0.03] hover:bg-white/[0.06] border-white/[0.07] text-zinc-300"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold font-mono text-emerald-400">
                        {cyc.salary_code}
                      </span>
                      <span className="text-xs font-semibold">
                        {cyc.short_label}
                      </span>
                    </div>
                    <div className="text-[10px] text-zinc-400 mt-0.5">
                      {cyc.badge}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Date Range Override */}
          <div className="flex flex-wrap items-end gap-2.5 pt-3 xl:pt-0 border-t xl:border-t-0 border-white/[0.06]">
            <div>
              <label className="block text-[10px] font-mono uppercase text-zinc-400 mb-1">
                From Date
              </label>
              <input
                type="date"
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
                className="bg-black/40 border border-white/[0.12] rounded-lg px-2.5 py-1.5 text-xs font-mono text-white"
              />
            </div>
            <div>
              <label className="block text-[10px] font-mono uppercase text-zinc-400 mb-1">
                To Date
              </label>
              <input
                type="date"
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
                className="bg-black/40 border border-white/[0.12] rounded-lg px-2.5 py-1.5 text-xs font-mono text-white"
              />
            </div>
            <button
              type="button"
              onClick={() =>
                fetchReport({ from: customFrom, to: customTo })
              }
              className="px-3.5 py-1.5 rounded-lg bg-white/[0.08] hover:bg-white/[0.14] text-xs font-semibold text-white border border-white/[0.1] transition-colors cursor-pointer"
            >
              Apply Range
            </button>
          </div>
        </div>
      </section>

      {/* =========================================================================
          Executive Payroll & Punctuality KPIs
          ========================================================================= */}
      {loading && !report && (
        <div className="rounded-2xl p-8 bg-[#18191e] border border-white/[0.08] text-center text-xs font-mono text-zinc-400 animate-pulse">
          Loading 16–15 Payroll & Attendance Telemetry from DuckDB...
        </div>
      )}
      {report && (
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-2xl p-5 bg-[#18191e] border border-white/[0.08]">
            <div className="flex items-center justify-between text-xs text-zinc-400 mb-2">
              <span className="font-mono uppercase tracking-wider">
                Cycle Net Payroll ({report.salary_code})
              </span>
              <DollarSign className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-bold font-mono text-white">
              {formatRp(report.overall.total_net_take_home)}
            </div>
            <div className="mt-2 flex items-center justify-between text-xs text-zinc-400">
              <span>Gross: {formatRp(report.overall.total_gross_payroll)}</span>
              <span className="text-amber-300 font-mono">
                Kasbon: -{formatRp(report.overall.total_kasbon_deducted)}
              </span>
            </div>
          </div>

          <div className="rounded-2xl p-5 bg-[#18191e] border border-white/[0.08]">
            <div className="flex items-center justify-between text-xs text-zinc-400 mb-2">
              <span className="font-mono uppercase tracking-wider">
                Active Staff & Paid Shifts
              </span>
              <UserCheck className="w-4 h-4 text-sky-400" />
            </div>
            <div className="text-2xl font-bold font-mono text-white">
              {report.overall.active_employees} Staff ·{" "}
              {report.overall.total_work_days_paid} Days
            </div>
            <div className="mt-2 flex items-center justify-between text-xs text-zinc-400">
              <span>{report.overall.total_attendance_logs} raw logs</span>
              <span className="text-sky-300 font-mono">
                Avg {report.overall.avg_daily_shift_hours}h / shift
              </span>
            </div>
          </div>

          <div className="rounded-2xl p-5 bg-[#18191e] border border-white/[0.08]">
            <div className="flex items-center justify-between text-xs text-zinc-400 mb-2">
              <span className="font-mono uppercase tracking-wider">
                Punctuality & Telat Fines
              </span>
              <Clock className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-bold font-mono text-white">
              {report.overall.overall_punctuality_pct}% On-Time
            </div>
            <div className="mt-2 flex items-center justify-between text-xs text-zinc-400">
              <span className="text-rose-400 font-mono">
                {report.overall.total_late_incidents}x Telat (-
                {formatRp(report.overall.total_late_penalties)})
              </span>
              <span className="text-emerald-400 font-mono">
                {report.overall.zero_late_achievers} Bonus Achievers
              </span>
            </div>
          </div>

          <div className="rounded-2xl p-5 bg-[#18191e] border border-white/[0.08]">
            <div className="flex items-center justify-between text-xs text-zinc-400 mb-2">
              <span className="font-mono uppercase tracking-wider">
                POS Clock Anomaly Shield
              </span>
              <ShieldAlert className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-2xl font-bold font-mono text-white">
              {report.overall.total_closing_taps +
                report.overall.total_overnight_rollovers}{" "}
              Flagged
            </div>
            <div className="mt-2 flex items-center justify-between text-xs text-zinc-400">
              <span title="Staff forgot morning clock-in and double-tapped at closing (<15s)">
                {report.overall.total_closing_taps}x Closing Double-Tap
              </span>
              <span title="Staff forgot evening clock-out and closed shift next morning (>20h)">
                {report.overall.total_overnight_rollovers}x Overnight (&gt;20h)
              </span>
            </div>
          </div>
        </section>
      )}

      {/* =========================================================================
          Interactive Tyfel Coffee Payslip Studio (Left: Payslip Card | Right: Breakdown & Editor)
          ========================================================================= */}
      {report && activeSlip && (
        <section className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
          {/* Left 7 Columns: Authentic Tyfel Coffee Payslip Card */}
          <div className="xl:col-span-7 space-y-4">
            {/* Employee Switcher Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2 bg-[#18191e] p-3 rounded-2xl border border-white/[0.08]">
              <div className="flex flex-wrap items-center gap-1.5">
                {report.payslips.map((p) => {
                  const isActive =
                    p.employee.employee_name ===
                    activeSlip.employee.employee_name;
                  return (
                    <button
                      key={p.employee.employee_name}
                      type="button"
                      onClick={() => {
                        setSelectedEmpName(p.employee.employee_name);
                        setIsEditingSlip(false);
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                        isActive
                          ? "bg-[#5c7c5c] text-[#f5f2dc] font-semibold shadow"
                          : "bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300"
                      }`}
                    >
                      <span>{p.employee.employee_name}</span>
                      <span className="text-[10px] opacity-75 font-mono">
                        ({p.daily_qty}d)
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() =>
                    setSlipTheme(slipTheme === "light" ? "dark" : "light")
                  }
                  className="p-2 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-zinc-300 border border-white/[0.08] text-xs flex items-center gap-1 cursor-pointer"
                  title="Toggle Classic Spreadsheet Light View vs Dark View"
                >
                  {slipTheme === "light" ? (
                    <>
                      <Moon className="w-3.5 h-3.5" />
                      <span className="text-[11px]">Dark</span>
                    </>
                  ) : (
                    <>
                      <Sun className="w-3.5 h-3.5 text-amber-300" />
                      <span className="text-[11px]">Classic</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditingSlip(!isEditingSlip)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 border transition-colors cursor-pointer ${
                    isEditingSlip
                      ? "bg-amber-500/20 border-amber-500/50 text-amber-300"
                      : "bg-emerald-500/15 hover:bg-emerald-500/25 border-emerald-500/30 text-emerald-300"
                  }`}
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>{isEditingSlip ? "Close Editor" : "Edit Slip / Kasbon"}</span>
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="p-2 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-zinc-300 border border-white/[0.08] cursor-pointer"
                  title="Print or Save Payslip as PDF"
                >
                  <Printer className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* THE PAYSLIP CARD — Faithful to Tyfel Coffee Salary_8 Screenshot */}
            <div
              className={`rounded-2xl overflow-hidden border transition-all shadow-xl ${
                slipTheme === "light"
                  ? "bg-white text-zinc-900 border-zinc-300"
                  : "bg-[#18191e] text-zinc-100 border-white/[0.12]"
              }`}
            >
              <div className="p-5 sm:p-7">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                  {/* Left Column: Tyfel Coffee Brand Logo & Employee Info */}
                  <div className="md:col-span-4 flex flex-col justify-between space-y-5">
                    {/* Tyfel Coffee Olive Green Logo Box */}
                    <div className="bg-[#648364] rounded-lg px-5 py-6 text-center shadow-inner border border-[#526e52]">
                      <div className="text-3xl font-bold tracking-[0.18em] text-[#f3ecc8] font-serif flex items-center justify-center gap-1">
                        <span>T</span>
                        <span className="inline-flex flex-col items-center text-xl leading-none -mt-1">
                          🌿
                        </span>
                        <span>FEL</span>
                      </div>
                      <div className="text-[11px] tracking-[0.42em] text-[#f3ecc8]/90 font-medium mt-1">
                        COFFEE
                      </div>
                    </div>

                    {/* Employee Bio Rows matching screenshot */}
                    <div
                      className={`space-y-0 border rounded-lg overflow-hidden text-sm ${
                        slipTheme === "light"
                          ? "border-zinc-200 divide-y divide-zinc-200"
                          : "border-white/[0.1] divide-y divide-white/[0.08]"
                      }`}
                    >
                      <div className="px-3.5 py-2.5 font-semibold text-base">
                        {activeSlip.employee.full_name}
                      </div>
                      <div className="px-3.5 py-2 font-medium">
                        {activeSlip.employee.role}
                      </div>
                      <div className="px-3.5 py-2">
                        {activeSlip.employee.join_date_label}
                      </div>
                      <div
                        className={`px-3.5 py-2 text-xs font-mono flex items-center justify-between ${
                          slipTheme === "light"
                            ? "bg-zinc-50 text-zinc-600"
                            : "bg-white/[0.03] text-zinc-400"
                        }`}
                      >
                        <span>Shift Cutoff:</span>
                        <span className="font-bold">
                          {activeSlip.employee.shift_start_time} WIB
                        </span>
                      </div>
                      <div
                        className={`px-3.5 py-2 text-xs font-mono flex items-center justify-between ${
                          slipTheme === "light"
                            ? "bg-zinc-50 text-zinc-600"
                            : "bg-white/[0.03] text-zinc-400"
                        }`}
                      >
                        <span>Period:</span>
                        <span>
                          {report.start_date.slice(5)} → {report.end_date.slice(5)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Salary_8 Table */}
                  <div className="md:col-span-8">
                    {/* Top Green Tab Header (Salary_8) */}
                    <div className="inline-flex items-center gap-3 bg-[#2d6147] text-white px-4 py-1.5 rounded-t-xl text-xs font-semibold border-b border-white/20">
                      <span>{report.salary_code}</span>
                      <span className="opacity-75">▾</span>
                      <FileSpreadsheet className="w-3.5 h-3.5 opacity-80" />
                    </div>

                    <div
                      className={`border rounded-b-xl rounded-tr-xl overflow-hidden ${
                        slipTheme === "light"
                          ? "border-[#2d6147]/40"
                          : "border-[#2d6147]"
                      }`}
                    >
                      <table className="w-full text-sm border-collapse">
                        <thead>
                          <tr className="bg-[#2d6147] text-white text-xs">
                            <th className="py-2.5 px-3.5 text-left font-semibold border-r border-white/15">
                              Description
                            </th>
                            <th className="py-2.5 px-2.5 text-center font-semibold border-r border-white/15 w-14">
                              #
                            </th>
                            <th className="py-2.5 px-3 text-right font-semibold border-r border-white/15">
                              # Value
                            </th>
                            <th className="py-2.5 px-3.5 text-right font-semibold">
                              # Total
                            </th>
                          </tr>
                        </thead>
                        <tbody
                          className={`divide-y ${
                            slipTheme === "light"
                              ? "divide-zinc-300 text-zinc-900"
                              : "divide-white/[0.1] text-zinc-100"
                          }`}
                        >
                          {/* Row 1: Basic Salary */}
                          <tr>
                            <td className="py-2.5 px-3.5 font-medium border-r border-current/10">
                              Basic Salary
                            </td>
                            <td className="py-2.5 px-2.5 text-right font-mono border-r border-current/10">
                              {activeSlip.basic_qty}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono border-r border-current/10">
                              {formatAccountingRp(activeSlip.basic_unit, false)}
                            </td>
                            <td className="py-2.5 px-3.5 text-right font-mono font-medium">
                              {formatAccountingRp(activeSlip.basic_total)}
                            </td>
                          </tr>

                          {/* Row 2: Daily */}
                          <tr>
                            <td className="py-2.5 px-3.5 font-medium border-r border-current/10">
                              <div className="flex items-center justify-between gap-1">
                                <span>Daily</span>
                                {activeSlip.daily_is_overridden && (
                                  <span
                                    className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-600 dark:text-amber-300"
                                    title={`Raw attendance logs in period: ${activeSlip.raw_logs_count} (${activeSlip.full_shifts_count} full shifts, ${activeSlip.short_shifts_count} short shifts)`}
                                  >
                                    adj ({activeSlip.raw_logs_count} logs)
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-2.5 px-2.5 text-right font-mono border-r border-current/10">
                              {activeSlip.daily_qty}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono border-r border-current/10">
                              {formatAccountingRp(activeSlip.daily_unit, false)}
                            </td>
                            <td className="py-2.5 px-3.5 text-right font-mono font-medium">
                              {formatAccountingRp(activeSlip.daily_total)}
                            </td>
                          </tr>

                          {/* Row 3: Telat */}
                          <tr>
                            <td className="py-2.5 px-3.5 font-medium border-r border-current/10">
                              <div className="flex items-center justify-between gap-1">
                                <span>Telat</span>
                                <span className="text-[10px] font-mono opacity-60">
                                  &gt;{activeSlip.employee.shift_start_time}
                                </span>
                              </div>
                            </td>
                            <td className="py-2.5 px-2.5 text-right font-mono border-r border-current/10">
                              {activeSlip.late_qty}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono border-r border-current/10">
                              {formatAccountingRp(-activeSlip.late_unit, false)}
                            </td>
                            <td className="py-2.5 px-3.5 text-right font-mono font-medium text-rose-600 dark:text-rose-400">
                              {formatAccountingRp(activeSlip.late_total)}
                            </td>
                          </tr>

                          {/* Row 4: BonusTidak telat */}
                          <tr>
                            <td className="py-2.5 px-3.5 font-medium border-r border-current/10">
                              BonusTidak telat
                            </td>
                            <td className="py-2.5 px-2.5 text-right font-mono border-r border-current/10 opacity-75">
                              {activeSlip.bonus_tidak_telat_qty}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono border-r border-current/10">
                              {formatAccountingRp(
                                activeSlip.bonus_tidak_telat_unit,
                                false
                              )}
                            </td>
                            <td className="py-2.5 px-3.5 text-right font-mono font-medium">
                              {formatAccountingRp(
                                activeSlip.bonus_tidak_telat_total
                              )}
                            </td>
                          </tr>

                          {/* Row 5: Custom / Extra Line (matches blank spacer row in screenshot) */}
                          <tr>
                            <td className="py-2.5 px-3.5 font-medium border-r border-current/10 min-h-[36px]">
                              {activeSlip.custom_desc || "\u00A0"}
                            </td>
                            <td className="py-2.5 px-2.5 text-right font-mono border-r border-current/10">
                              {activeSlip.custom_qty > 0
                                ? activeSlip.custom_qty
                                : ""}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono border-r border-current/10">
                              {activeSlip.custom_unit !== 0
                                ? formatAccountingRp(
                                    activeSlip.custom_unit,
                                    false
                                  )
                                : ""}
                            </td>
                            <td className="py-2.5 px-3.5 text-right font-mono font-medium">
                              {formatAccountingRp(activeSlip.custom_total)}
                            </td>
                          </tr>

                          {/* Row 6: Grand Total */}
                          <tr
                            className={
                              slipTheme === "light"
                                ? "bg-zinc-100/90 font-semibold"
                                : "bg-white/[0.04] font-semibold"
                            }
                          >
                            <td
                              colSpan={3}
                              className="py-2.5 px-3.5 text-left border-r border-current/10 opacity-80"
                            >
                              Grand Total
                            </td>
                            <td className="py-2.5 px-3.5 text-right font-mono font-bold">
                              {formatAccountingRp(activeSlip.grand_total, false)}
                            </td>
                          </tr>

                          {/* Row 7: Kasbon */}
                          <tr>
                            <td className="py-2.5 px-3.5 font-medium border-r border-current/10 opacity-80">
                              Kasbon
                            </td>
                            <td className="py-2.5 px-2.5 text-right font-mono border-r border-current/10">
                              {activeSlip.kasbon_qty > 0
                                ? activeSlip.kasbon_qty
                                : ""}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono border-r border-current/10 opacity-85">
                              {activeSlip.kasbon_unit > 0
                                ? formatAccountingRp(
                                    -activeSlip.kasbon_unit,
                                    false
                                  )
                                : "Rp -"}
                            </td>
                            <td className="py-2.5 px-3.5 text-right font-mono font-medium text-rose-600 dark:text-rose-400">
                              {formatAccountingRp(activeSlip.kasbon_total)}
                            </td>
                          </tr>

                          {/* Row 8: Final Net Take-Home Pay */}
                          <tr
                            className={
                              slipTheme === "light"
                                ? "bg-[#eef5f0] font-bold text-base"
                                : "bg-emerald-950/30 font-bold text-base text-emerald-300"
                            }
                          >
                            <td
                              colSpan={3}
                              className="py-3 px-3.5 text-left text-xs font-mono uppercase tracking-wider opacity-75 border-r border-current/10"
                            >
                              Net Take-Home Pay
                            </td>
                            <td className="py-3 px-3.5 text-right font-mono font-extrabold">
                              {formatAccountingRp(
                                activeSlip.net_take_home_pay,
                                false
                              )}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    {activeSlip.notes && (
                      <div
                        className={`mt-2.5 text-xs font-mono px-3 py-1.5 rounded ${
                          slipTheme === "light"
                            ? "bg-zinc-100 text-zinc-600"
                            : "bg-white/[0.04] text-zinc-400"
                        }`}
                      >
                        Note: {activeSlip.notes}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right 5 Columns: Editor Form OR Late & Anomaly Audit Breakdown */}
          <div className="xl:col-span-5 space-y-4">
            {isEditingSlip ? (
              <form
                onSubmit={handleSavePayslip}
                className="rounded-2xl p-5 bg-[#18191e] border border-emerald-500/40 space-y-4"
              >
                <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Sliders className="w-4 h-4 text-emerald-400" />
                      Edit Payslip & Rates · {activeSlip.employee.employee_name}
                    </h3>
                    <p className="text-xs text-zinc-400">
                      Changes persist in DuckDB for {report.salary_code} ({report.start_date} – {report.end_date})
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsEditingSlip(false)}
                    className="text-xs text-zinc-400 hover:text-white"
                  >
                    Cancel
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-zinc-400 mb-1">Full Name</label>
                    <input
                      type="text"
                      value={editFullName}
                      onChange={(e) => setEditFullName(e.target.value)}
                      className="w-full bg-black/40 border border-white/[0.12] rounded-lg px-2.5 py-1.5 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-zinc-400 mb-1">Role / Division</label>
                    <input
                      type="text"
                      value={editRole}
                      onChange={(e) => setEditRole(e.target.value)}
                      className="w-full bg-black/40 border border-white/[0.12] rounded-lg px-2.5 py-1.5 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-zinc-400 mb-1">Join Date Label</label>
                    <input
                      type="text"
                      value={editJoinDate}
                      onChange={(e) => setEditJoinDate(e.target.value)}
                      className="w-full bg-black/40 border border-white/[0.12] rounded-lg px-2.5 py-1.5 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-zinc-400 mb-1">
                      Shift Clock-In Cutoff (HH:MM)
                    </label>
                    <input
                      type="time"
                      value={editShiftCutoff}
                      onChange={(e) => setEditShiftCutoff(e.target.value)}
                      className="w-full bg-black/40 border border-white/[0.12] rounded-lg px-2.5 py-1.5 text-white font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs pt-2 border-t border-white/[0.06]">
                  <div>
                    <label className="block text-zinc-400 mb-1">
                      Basic Salary (Rp)
                    </label>
                    <input
                      type="number"
                      value={editBasicSalary}
                      onChange={(e) => setEditBasicSalary(Number(e.target.value))}
                      className="w-full bg-black/40 border border-white/[0.12] rounded-lg px-2.5 py-1.5 text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-zinc-400 mb-1">
                      Daily Rate (Rp / day)
                    </label>
                    <input
                      type="number"
                      value={editDailyRate}
                      onChange={(e) => setEditDailyRate(Number(e.target.value))}
                      className="w-full bg-black/40 border border-white/[0.12] rounded-lg px-2.5 py-1.5 text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-zinc-400 mb-1">
                      Telat Penalty (Rp / late)
                    </label>
                    <input
                      type="number"
                      value={editLatePenalty}
                      onChange={(e) => setEditLatePenalty(Number(e.target.value))}
                      className="w-full bg-black/40 border border-white/[0.12] rounded-lg px-2.5 py-1.5 text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-zinc-400 mb-1">
                      Bonus Tidak Telat (Rp)
                    </label>
                    <input
                      type="number"
                      value={editNoLateBonus}
                      onChange={(e) => setEditNoLateBonus(Number(e.target.value))}
                      className="w-full bg-black/40 border border-white/[0.12] rounded-lg px-2.5 py-1.5 text-white font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs pt-2 border-t border-white/[0.06]">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-zinc-400">
                        Paid Daily (#) Override
                      </label>
                      <button
                        type="button"
                        onClick={() => setEditDailyOverride("")}
                        className="text-[10px] text-emerald-400 hover:underline font-mono"
                      >
                        Auto ({activeSlip.computed_daily_count})
                      </button>
                    </div>
                    <input
                      type="number"
                      placeholder={`Auto: ${activeSlip.computed_daily_count}`}
                      value={editDailyOverride}
                      onChange={(e) => setEditDailyOverride(e.target.value)}
                      className="w-full bg-black/40 border border-white/[0.12] rounded-lg px-2.5 py-1.5 text-white font-mono"
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-zinc-400">
                        Telat (#) Override
                      </label>
                      <button
                        type="button"
                        onClick={() => setEditLateOverride("")}
                        className="text-[10px] text-emerald-400 hover:underline font-mono"
                      >
                        Auto ({activeSlip.computed_late_count})
                      </button>
                    </div>
                    <input
                      type="number"
                      placeholder={`Auto: ${activeSlip.computed_late_count}`}
                      value={editLateOverride}
                      onChange={(e) => setEditLateOverride(e.target.value)}
                      className="w-full bg-black/40 border border-white/[0.12] rounded-lg px-2.5 py-1.5 text-white font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2.5 text-xs pt-2 border-t border-white/[0.06]">
                  <div>
                    <label className="block text-zinc-400 mb-1">
                      Extra Line Label
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Lembur / THR"
                      value={editCustomDesc}
                      onChange={(e) => setEditCustomDesc(e.target.value)}
                      className="w-full bg-black/40 border border-white/[0.12] rounded-lg px-2.5 py-1.5 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-zinc-400 mb-1">Extra #</label>
                    <input
                      type="number"
                      value={editCustomQty}
                      onChange={(e) => setEditCustomQty(Number(e.target.value))}
                      className="w-full bg-black/40 border border-white/[0.12] rounded-lg px-2.5 py-1.5 text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-zinc-400 mb-1">
                      Extra Value (Rp)
                    </label>
                    <input
                      type="number"
                      value={editCustomUnit}
                      onChange={(e) => setEditCustomUnit(Number(e.target.value))}
                      className="w-full bg-black/40 border border-white/[0.12] rounded-lg px-2.5 py-1.5 text-white font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs pt-2 border-t border-white/[0.06]">
                  <div>
                    <label className="block text-zinc-400 mb-1">
                      Kasbon (#)
                    </label>
                    <input
                      type="number"
                      value={editKasbonQty}
                      onChange={(e) => setEditKasbonQty(Number(e.target.value))}
                      className="w-full bg-black/40 border border-white/[0.12] rounded-lg px-2.5 py-1.5 text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-zinc-400 mb-1">
                      Kasbon Amount (Rp)
                    </label>
                    <input
                      type="number"
                      value={editKasbonUnit}
                      onChange={(e) => setEditKasbonUnit(Number(e.target.value))}
                      className="w-full bg-black/40 border border-white/[0.12] rounded-lg px-2.5 py-1.5 text-white font-mono"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/[0.08]">
                  <button
                    type="submit"
                    disabled={savingSlip}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-xs cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" />
                    {savingSlip ? "Saving..." : "Save Payslip & Recalculate"}
                  </button>
                </div>
              </form>
            ) : (
              /* Audit Card for Selected Employee */
              <div className="rounded-2xl p-5 bg-[#18191e] border border-white/[0.08] space-y-5">
                <div className="flex items-center justify-between border-b border-white/[0.08] pb-3.5">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-emerald-400" />
                      Attendance Verification · {activeSlip.employee.full_name}
                    </h3>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      Automated audit of {activeSlip.raw_logs_count} clock-in records ({report.start_date} to {report.end_date})
                    </p>
                  </div>
                  <span className="text-xs font-mono px-2.5 py-1 rounded-lg bg-white/[0.05] text-zinc-300 border border-white/[0.08]">
                    Cutoff {activeSlip.employee.shift_start_time}
                  </span>
                </div>

                {/* Shift Breakdown Mini Grid */}
                <div className="grid grid-cols-3 gap-2.5 text-center">
                  <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                    <div className="text-lg font-bold font-mono text-white">
                      {activeSlip.full_shifts_count}
                    </div>
                    <div className="text-[11px] text-zinc-400">Full Shifts</div>
                  </div>
                  <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                    <div
                      className={`text-lg font-bold font-mono ${
                        activeSlip.late_qty > 0
                          ? "text-rose-400"
                          : "text-emerald-400"
                      }`}
                    >
                      {activeSlip.late_qty}
                    </div>
                    <div className="text-[11px] text-zinc-400">
                      Telat (&gt;{activeSlip.employee.shift_start_time})
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                    <div className="text-lg font-bold font-mono text-sky-400">
                      {activeSlip.avg_effective_hours}h
                    </div>
                    <div className="text-[11px] text-zinc-400">
                      Avg Shift / Day
                    </div>
                  </div>
                </div>

                {/* Exact Dates of Telat Incidents */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono uppercase tracking-wider text-zinc-400">
                      Telat Incident Log ({activeSlip.late_logs.length} dates)
                    </span>
                    <span className="font-mono text-rose-400">
                      Total +{activeSlip.total_late_minutes} mins late
                    </span>
                  </div>

                  {activeSlip.late_logs.length === 0 ? (
                    <div className="p-3.5 rounded-xl bg-emerald-950/25 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2.5">
                      <Award className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>
                        Zero late arrivals! Qualifies for{" "}
                        <strong>
                          Bonus Tidak Telat ({formatRp(activeSlip.employee.no_late_bonus)})
                        </strong>
                        .
                      </span>
                    </div>
                  ) : (
                    <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
                      {activeSlip.late_logs.map((ll) => (
                        <div
                          key={ll.attendance_id}
                          className="flex items-center justify-between px-3 py-2 rounded-lg bg-rose-950/20 border border-rose-500/25 text-xs"
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="font-mono font-semibold text-white">
                              {ll.work_date}
                            </span>
                            <span className="font-mono text-rose-300">
                              In: {ll.clock_in}
                            </span>
                            <span className="text-zinc-400 font-mono text-[11px]">
                              Out: {ll.clock_out}
                            </span>
                          </div>
                          <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-rose-500/20 text-rose-300">
                            +{ll.late_minutes}m late
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Anomaly / Short Shift Alerts for Selected Employee */}
                {activeSlip.anomaly_logs.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-white/[0.06]">
                    <div className="text-xs font-mono uppercase tracking-wider text-zinc-400">
                      Shift Anomalies & Notes ({activeSlip.anomaly_logs.length})
                    </div>
                    <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                      {activeSlip.anomaly_logs.map((al) => (
                        <div
                          key={al.attendance_id}
                          className="flex items-center justify-between px-3 py-2 rounded-lg bg-amber-950/20 border border-amber-500/25 text-xs"
                        >
                          <div>
                            <span className="font-mono font-semibold text-white mr-2">
                              {al.work_date}
                            </span>
                            <span className="font-mono text-amber-300">
                              {al.clock_in} → {al.clock_out}
                            </span>
                            <div className="text-[11px] text-zinc-400 mt-0.5">
                              Raw: {al.raw_duration}
                            </div>
                          </div>
                          <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 uppercase">
                            {al.anomaly_type.replace(/_/g, " ")}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>
      )}

      {/* =========================================================================
          Team Roster & Payroll Matrix (All Employees for Selected 16–15 Cycle)
          ========================================================================= */}
      {report && (
        <section className="rounded-2xl bg-[#18191e] border border-white/[0.08] overflow-hidden">
          <div className="p-5 border-b border-white/[0.08] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-white">
                Outlet Payroll & Attendance Matrix · {report.cycle_label}
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Click any employee row to inspect or customize their Tyfel Coffee payslip above
              </p>
            </div>
            <div className="text-xs font-mono text-zinc-400">
              Showing {report.payslips.length} employees
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-white/[0.03] text-zinc-400 font-mono uppercase border-b border-white/[0.08]">
                  <th className="py-3 px-4">Employee</th>
                  <th className="py-3 px-3">Role & Cutoff</th>
                  <th className="py-3 px-3 text-right">Raw Logs</th>
                  <th className="py-3 px-3 text-right">Paid Daily (#)</th>
                  <th className="py-3 px-3 text-right">Telat (#)</th>
                  <th className="py-3 px-3 text-right">Basic Salary</th>
                  <th className="py-3 px-3 text-right">Daily Total</th>
                  <th className="py-3 px-3 text-right">Telat Fine</th>
                  <th className="py-3 px-3 text-right">Bonus 0-Telat</th>
                  <th className="py-3 px-3 text-right">Grand Total</th>
                  <th className="py-3 px-3 text-right">Kasbon</th>
                  <th className="py-3 px-4 text-right">Net Pay</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06]">
                {report.payslips.map((p) => {
                  const isSelected =
                    p.employee.employee_name ===
                    activeSlip?.employee.employee_name;
                  return (
                    <tr
                      key={p.employee.employee_name}
                      onClick={() =>
                        setSelectedEmpName(p.employee.employee_name)
                      }
                      className={`cursor-pointer transition-colors ${
                        isSelected
                          ? "bg-emerald-500/10 hover:bg-emerald-500/15"
                          : "hover:bg-white/[0.04]"
                      }`}
                    >
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-white flex items-center gap-2">
                          <span>{p.employee.full_name}</span>
                          {isSelected && (
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                              Selected
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-zinc-400">
                          ID: {p.employee.employee_name} ·{" "}
                          {p.employee.join_date_label}
                        </div>
                      </td>
                      <td className="py-3.5 px-3">
                        <div className="text-zinc-200">{p.employee.role}</div>
                        <div className="text-[11px] font-mono text-zinc-400">
                          In ≤ {p.employee.shift_start_time}
                        </div>
                      </td>
                      <td className="py-3.5 px-3 text-right font-mono text-zinc-300">
                        <div>{p.raw_logs_count}</div>
                        {(p.closing_taps_count > 0 ||
                          p.overnight_rollovers_count > 0) && (
                          <div className="text-[10px] text-amber-400">
                            {p.closing_taps_count > 0
                              ? `${p.closing_taps_count} tap `
                              : ""}
                            {p.overnight_rollovers_count > 0
                              ? `${p.overnight_rollovers_count} >20h`
                              : ""}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-3 text-right font-mono font-bold text-white">
                        {p.daily_qty}
                      </td>
                      <td className="py-3.5 px-3 text-right font-mono">
                        <span
                          className={`px-2 py-0.5 rounded ${
                            p.late_qty === 0
                              ? "bg-emerald-500/15 text-emerald-300"
                              : "bg-rose-500/15 text-rose-300 font-bold"
                          }`}
                        >
                          {p.late_qty}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-right font-mono text-zinc-300">
                        {formatAccountingRp(p.basic_total)}
                      </td>
                      <td className="py-3.5 px-3 text-right font-mono text-zinc-200">
                        {formatAccountingRp(p.daily_total)}
                      </td>
                      <td className="py-3.5 px-3 text-right font-mono text-rose-400">
                        {formatAccountingRp(p.late_total)}
                      </td>
                      <td className="py-3.5 px-3 text-right font-mono text-emerald-400">
                        {formatAccountingRp(p.bonus_tidak_telat_total)}
                      </td>
                      <td className="py-3.5 px-3 text-right font-mono font-bold text-white">
                        {formatAccountingRp(p.grand_total, false)}
                      </td>
                      <td className="py-3.5 px-3 text-right font-mono text-amber-300">
                        {formatAccountingRp(p.kasbon_total)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-300 text-sm">
                        {formatAccountingRp(p.net_take_home_pay, false)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-white/[0.04] font-mono font-bold text-white border-t border-white/[0.1]">
                  <td colSpan={3} className="py-3.5 px-4 text-left uppercase">
                    Total Cycle Liability ({report.salary_code})
                  </td>
                  <td className="py-3.5 px-3 text-right">
                    {report.overall.total_work_days_paid}
                  </td>
                  <td className="py-3.5 px-3 text-right text-rose-300">
                    {report.overall.total_late_incidents}
                  </td>
                  <td colSpan={4} className="py-3.5 px-3 text-right text-zinc-400">
                    Bonuses: {formatRp(report.overall.total_bonuses_paid)}
                  </td>
                  <td className="py-3.5 px-3 text-right">
                    {formatRp(report.overall.total_gross_payroll)}
                  </td>
                  <td className="py-3.5 px-3 text-right text-amber-300">
                    -{formatRp(report.overall.total_kasbon_deducted)}
                  </td>
                  <td className="py-3.5 px-4 text-right text-emerald-400 text-sm">
                    {formatRp(report.overall.total_net_take_home)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </section>
      )}

      {/* =========================================================================
          Daily Attendance Log Explorer (Laporan Absensi Audit Table)
          ========================================================================= */}
      {report && (
        <section className="rounded-2xl bg-[#18191e] border border-white/[0.08] overflow-hidden">
          <div className="p-5 border-b border-white/[0.08] flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-white">
                Granular Attendance Logs (Laporan Absensi)
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Showing {filteredLogs.length} of {report.recent_logs.length} logs in {report.start_date} – {report.end_date}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              {/* Employee Filter */}
              <select
                value={logEmpFilter}
                onChange={(e) => setLogEmpFilter(e.target.value)}
                className="bg-black/40 border border-white/[0.12] rounded-xl px-3 py-1.5 text-xs text-white"
              >
                <option value="all">All Employees</option>
                {report.payslips.map((p) => (
                  <option
                    key={p.employee.employee_name}
                    value={p.employee.employee_name}
                  >
                    {p.employee.full_name} ({p.employee.employee_name})
                  </option>
                ))}
              </select>

              {/* Status Filter Pills */}
              <div className="flex items-center gap-1 bg-black/30 p-1 rounded-xl border border-white/[0.08]">
                {(
                  [
                    { id: "all", label: "All" },
                    { id: "late", label: "Telat Only" },
                    { id: "anomaly", label: "Anomalies" },
                    { id: "ontime", label: "On-Time" },
                  ] as const
                ).map((st) => (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => setLogStatusFilter(st.id)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                      logStatusFilter === st.id
                        ? "bg-emerald-500 text-black font-semibold"
                        : "text-zinc-400 hover:text-white"
                    }`}
                  >
                    {st.label}
                  </button>
                ))}
              </div>

              {/* Search */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter date or name..."
                  value={logSearch}
                  onChange={(e) => setLogSearch(e.target.value)}
                  className="bg-black/40 border border-white/[0.12] rounded-xl pl-8 pr-3 py-1.5 text-xs text-white w-44"
                />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto max-h-[520px] overflow-y-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead className="sticky top-0 bg-[#1c1e24] z-10 border-b border-white/[0.08] text-zinc-400 font-mono uppercase">
                <tr>
                  <th className="py-3 px-4">Tanggal</th>
                  <th className="py-3 px-3">Nama</th>
                  <th className="py-3 px-3">Shift Cutoff</th>
                  <th className="py-3 px-3">Jam Masuk</th>
                  <th className="py-3 px-3">Jam Pulang</th>
                  <th className="py-3 px-3">Total Jam Kerja Aktual</th>
                  <th className="py-3 px-3 text-right">Effective Hrs</th>
                  <th className="py-3 px-4">Punctuality & Audit Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06]">
                {filteredLogs.map((log) => (
                  <tr
                    key={log.attendance_id}
                    className="hover:bg-white/[0.03] transition-colors"
                  >
                    <td className="py-2.5 px-4 font-mono text-white">
                      {log.work_date}
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-white">
                      {log.employee_name}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-zinc-400">
                      {log.shift_start_time}
                    </td>
                    <td className="py-2.5 px-3 font-mono">
                      <span
                        className={
                          log.is_late
                            ? "text-rose-400 font-bold"
                            : "text-emerald-300"
                        }
                      >
                        {log.clock_in}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-zinc-300">
                      {log.clock_out}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-zinc-300">
                      {log.raw_duration}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-right text-zinc-200">
                      {log.effective_hours > 0 ? `${log.effective_hours}h` : "-"}
                    </td>
                    <td className="py-2.5 px-4">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {log.is_late ? (
                          <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 font-mono text-[11px]">
                            TELAT (+{log.late_minutes}m)
                          </span>
                        ) : log.anomaly_type === "closing_tap" ? (
                          <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono text-[11px]">
                            Closing Tap ({log.raw_duration})
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 font-mono text-[11px]">
                            On Time (-{log.early_minutes}m)
                          </span>
                        )}

                        {log.anomaly_type === "overnight_rollover" && (
                          <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 font-mono text-[11px]">
                            Overnight Rollover (&gt;18h capped)
                          </span>
                        )}
                        {log.anomaly_type === "short_shift" && (
                          <span className="px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 font-mono text-[11px]">
                            Short / Half Shift
                          </span>
                        )}
                        {log.anomaly_type === "missing_clock_out" && (
                          <span className="px-2 py-0.5 rounded bg-zinc-500/25 text-zinc-300 font-mono text-[11px]">
                            Active / Open Shift
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </main>
  );
}
