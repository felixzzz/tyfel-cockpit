"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Users,
  Calendar,
  Clock,
  CheckCircle2,
  DollarSign,
  Award,
  FileSpreadsheet,
  UploadCloud,
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
  ChevronLeft,
  ChevronRight,
  Lock,
  RotateCcw,
  Maximize2,
  Minimize2,
} from "lucide-react";
import type {
  AttendanceCycleReport,
  EmployeePayslipSummary,
  AttendanceRecord,
  PayrollCycleOption,
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
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [selectedEmpName, setSelectedEmpName] = useState<string>("Aji");

  // Payslip visual mode: 'light' matches the exact Tyfel Coffee spreadsheet screenshot
  const [slipTheme, setSlipTheme] = useState<"light" | "dark">("light");
  const [isEditingSlip, setIsEditingSlip] = useState<boolean>(false);
  const [isFullScreenSlip, setIsFullScreenSlip] = useState<boolean>(false);
  const [savingSlip, setSavingSlip] = useState<boolean>(false);
  const [togglingPaymentKey, setTogglingPaymentKey] = useState<string | null>(
    null
  );
  const [saveBanner, setSaveBanner] = useState<string | null>(null);
  const [matrixPaymentFilter, setMatrixPaymentFilter] = useState<
    "all" | "paid" | "unpaid"
  >("all");

  // Per-period Edit Form State (saved per employee + period_key)
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
  const [editBonusQtyOverride, setEditBonusQtyOverride] = useState<string>("");
  const [editCustomDesc, setEditCustomDesc] = useState<string>("");
  const [editCustomQty, setEditCustomQty] = useState<number>(0);
  const [editCustomUnit, setEditCustomUnit] = useState<number>(0);
  const [editKasbonQty, setEditKasbonQty] = useState<number>(0);
  const [editKasbonUnit, setEditKasbonUnit] = useState<number>(0);
  const [editNotes, setEditNotes] = useState<string>("");
  const [editIsPaid, setEditIsPaid] = useState<boolean>(false);
  const [alsoUpdateMasterDefaults, setAlsoUpdateMasterDefaults] =
    useState<boolean>(false);

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

  async function fetchReport(periodKey?: string) {
    setLoading(true);
    try {
      const qs = new URLSearchParams();
      if (periodKey) qs.set("period", periodKey);

      const res = await fetch(`/api/attendance?${qs.toString()}`);
      const data = await res.json();
      if (data.success && data.report) {
        setReport(data.report);
        setSelectedPeriod(data.report.period_key);
        setSelectedYear(data.report.year);
        if (!data.report.is_editable) {
          setIsEditingSlip(false);
        }
      }
    } catch (err) {
      console.error("Failed to fetch attendance report:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchReport(selectedPeriod);
  }, [selectedPeriod]);

  // Sync payslip preview theme with global Light/Dark Atelier theme toggle
  useEffect(() => {
    const syncDocTheme = () => {
      const attr = document.documentElement.getAttribute("data-theme");
      if (attr === "dark" || attr === "light") {
        setSlipTheme(attr);
      }
    };
    syncDocTheme();
    const observer = new MutationObserver(syncDocTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isFullScreenSlip) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsFullScreenSlip(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isFullScreenSlip]);

  const activeSlip: EmployeePayslipSummary | undefined =
    report?.payslips.find(
      (p) => p.employee.employee_name === selectedEmpName
    ) || report?.payslips[0];

  // Sync edit form whenever activeSlip or period changes
  useEffect(() => {
    if (!activeSlip) return;
    setEditFullName(activeSlip.employee.full_name);
    setEditRole(activeSlip.employee.role);
    setEditJoinDate(activeSlip.employee.join_date_label);
    setEditShiftCutoff(activeSlip.effective_shift_start);
    setEditBasicSalary(activeSlip.effective_basic_salary);
    setEditDailyRate(activeSlip.effective_daily_rate);
    setEditLatePenalty(activeSlip.effective_late_penalty_rate);
    setEditNoLateBonus(activeSlip.effective_no_late_bonus);
    setEditDailyOverride(
      activeSlip.daily_is_overridden ? String(activeSlip.daily_qty) : ""
    );
    setEditLateOverride(
      activeSlip.late_is_overridden ? String(activeSlip.late_qty) : ""
    );
    setEditBonusQtyOverride(
      activeSlip.bonus_qty_is_overridden
        ? String(activeSlip.bonus_tidak_telat_qty)
        : ""
    );
    setEditCustomDesc(activeSlip.custom_desc || "");
    setEditCustomQty(activeSlip.custom_qty || 0);
    setEditCustomUnit(activeSlip.custom_unit || 0);
    setEditKasbonQty(activeSlip.kasbon_qty || 0);
    setEditKasbonUnit(activeSlip.kasbon_unit || 0);
    setEditNotes(activeSlip.notes || "");
    setEditIsPaid(Boolean(activeSlip.is_paid));
    setAlsoUpdateMasterDefaults(false);
  }, [activeSlip]);

  async function handleToggleEmployeePayment(
    empName: string,
    fullName: string,
    currentIsPaid: boolean,
    e?: React.MouseEvent
  ) {
    if (e) {
      e.stopPropagation();
    }
    if (!report) return;
    const nextIsPaid = !currentIsPaid;
    setTogglingPaymentKey(empName);
    setSaveBanner(null);
    try {
      const res = await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "set_payment_status",
          period_key: report.period_key,
          employee_name: empName,
          is_paid: nextIsPaid,
        }),
      });
      const data = await res.json();
      if (data.success && data.report) {
        setReport(data.report);
        setSaveBanner(
          nextIsPaid
            ? `Salary for ${fullName} (${report.salary_code}) marked as Proceeded to Payment ✓`
            : `Salary for ${fullName} (${report.salary_code}) marked as Not Yet Proceeded to Payment`
        );
        setTimeout(() => setSaveBanner(null), 4500);
      }
    } catch (err) {
      console.error("Failed to toggle payment status:", err);
    } finally {
      setTogglingPaymentKey(null);
    }
  }

  async function handleSetPeriodAllPayment(targetIsPaid: boolean) {
    if (!report) return;
    setTogglingPaymentKey("ALL");
    setSaveBanner(null);
    try {
      const allEmpNames = report.payslips.map((p) => p.employee.employee_name);
      const res = await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "set_payment_status",
          period_key: report.period_key,
          employee_names: allEmpNames,
          is_paid: targetIsPaid,
        }),
      });
      const data = await res.json();
      if (data.success && data.report) {
        setReport(data.report);
        setSaveBanner(
          targetIsPaid
            ? `All ${allEmpNames.length} staff salaries in ${report.salary_code} (${report.cycle_label}) marked as Proceeded to Payment ✓`
            : `Reset all ${allEmpNames.length} staff salaries in ${report.salary_code} to Not Yet Proceeded to Payment`
        );
        setTimeout(() => setSaveBanner(null), 4500);
      }
    } catch (err) {
      console.error("Failed to update period payment status:", err);
    } finally {
      setTogglingPaymentKey(null);
    }
  }

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
          update_master_defaults: alsoUpdateMasterDefaults,
          full_name: editFullName,
          role: editRole,
          join_date_label: editJoinDate,
          shift_start_override: editShiftCutoff,
          basic_salary_override: Number(editBasicSalary),
          daily_rate_override: Number(editDailyRate),
          late_penalty_override: Number(editLatePenalty),
          no_late_bonus_override: Number(editNoLateBonus),
          daily_count_override:
            editDailyOverride.trim() === "" ? null : Number(editDailyOverride),
          late_count_override:
            editLateOverride.trim() === "" ? null : Number(editLateOverride),
          bonus_qty_override:
            editBonusQtyOverride.trim() === ""
              ? null
              : Number(editBonusQtyOverride),
          custom_desc: editCustomDesc,
          custom_qty: Number(editCustomQty),
          custom_unit_value: Number(editCustomUnit),
          kasbon_qty: Number(editKasbonQty),
          kasbon_unit_value: Number(editKasbonUnit),
          notes: editNotes,
          is_paid: editIsPaid,
        }),
      });
      const data = await res.json();
      if (data.success && data.report) {
        setReport(data.report);
        setIsEditingSlip(false);
        setSaveBanner(
          `Saved override for ${editFullName} in period ${report.year}-${String(report.month).padStart(2, "0")} (${report.salary_code})`
        );
        setTimeout(() => setSaveBanner(null), 4500);
      }
    } catch (err) {
      console.error("Failed to save payslip:", err);
    } finally {
      setSavingSlip(false);
    }
  }

  async function handleResetPeriodOverride() {
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
          reset_period: true,
        }),
      });
      const data = await res.json();
      if (data.success && data.report) {
        setReport(data.report);
        setIsEditingSlip(false);
        setSaveBanner(
          `Reset period overrides for ${activeSlip.employee.full_name} in ${report.salary_code} back to automatic attendance values.`
        );
        setTimeout(() => setSaveBanner(null), 4500);
      }
    } catch (err) {
      console.error("Failed to reset period override:", err);
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
      if (data.summaries?.[0]?.message) {
        setUploadNotice(data.summaries[0].message);
      } else {
        setUploadNotice(`Uploaded ${file.name} and refreshed attendance logs.`);
      }
      await fetchReport(selectedPeriod);
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
      "Year",
      "Month",
      "Period Window",
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
      "Payment Status",
      "Paid At",
    ];
    const rows = report.payslips.map((p) => [
      report.year,
      report.month,
      `${report.start_date} to ${report.end_date}`,
      report.salary_code,
      p.employee.employee_name,
      `"${p.employee.full_name}"`,
      `"${p.employee.role}"`,
      `"${p.employee.join_date_label}"`,
      p.effective_shift_start,
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
      p.is_paid ? "Proceeded to Payment" : "Not Yet Paid",
      p.paid_at ? `"${p.paid_at}"` : "",
    ]);
    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `tyfel_payroll_${report.year}_${String(report.month).padStart(2, "0")}_${report.salary_code}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // Chronological selectable cycles for Prev / Next navigation
  const selectableCycles: PayrollCycleOption[] = (
    report?.available_cycles || []
  ).filter((c) => c.is_selectable);
  const currentSelectableIdx = selectableCycles.findIndex(
    (c) => c.period_key === report?.period_key
  );
  const prevCycle =
    currentSelectableIdx > 0
      ? selectableCycles[currentSelectableIdx - 1]
      : null;
  const nextCycle =
    currentSelectableIdx >= 0 &&
    currentSelectableIdx < selectableCycles.length - 1
      ? selectableCycles[currentSelectableIdx + 1]
      : null;

  // Months for the currently selected Year tab (ordered 1..12)
  const monthsForYear: PayrollCycleOption[] = (
    report?.available_cycles || []
  ).filter((c) => c.year === selectedYear);

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

  const renderPayslipCard = (
    amplified = false,
    forceTheme?: "light" | "dark"
  ) => {
    if (!report || !activeSlip) return null;
    const theme = forceTheme || slipTheme;
    const isLight = theme === "light";

    return (
      <div
        className={`rounded-2xl overflow-hidden border transition-all shadow-xl ${
          isLight
            ? "bg-[#fffdf9] text-[#181512] border-[#d6cfc2]"
            : "bg-[#191714] text-[#f6f3ec] border-[#f5eee2]/15"
        }`}
      >
        <div className={amplified ? "p-6 sm:p-10" : "p-5 sm:p-7"}>
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
            {/* Left Column: Tyfel Coffee Brand Logo & Employee Info */}
            <div className="md:col-span-4 flex flex-col justify-between space-y-5">
              {/* Tyfel Coffee Olive Green Logo Box */}
              <div
                className={`bg-[#6a916e] rounded-lg flex items-center justify-center shadow-inner border border-[#56795a] overflow-hidden ${
                  amplified ? "p-4" : "p-3"
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/tyfel-logo.png"
                  alt="Tyfel Coffee"
                  className={`w-full h-auto object-contain select-none ${
                    amplified ? "max-w-[280px]" : "max-w-[240px]"
                  }`}
                />
              </div>

              {/* Employee Bio Rows matching screenshot */}
              <div
                className={`space-y-0 border rounded-lg overflow-hidden ${
                  amplified ? "text-base" : "text-sm"
                } ${
                  isLight
                    ? "border-[#ded8cb] divide-y divide-[#ded8cb] bg-[#f8f5ed]"
                    : "border-[#f5eee2]/10 divide-y divide-[#f5eee2]/10 bg-[#13110f]"
                }`}
              >
                <div
                  className={`px-3.5 py-2.5 font-semibold ${
                    amplified ? "text-lg" : "text-base"
                  }`}
                >
                  {activeSlip.employee.full_name}
                </div>
                <div className="px-3.5 py-2 font-medium">
                  {activeSlip.employee.role}
                </div>
                <div className="px-3.5 py-2">
                  {activeSlip.employee.join_date_label}
                </div>
              </div>
            </div>

            {/* Right Column: Salary Table */}
            <div className="md:col-span-8">
              {/* Top Green Tab Header (Salary_X) & Payment Status Flag */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div
                  className={`inline-flex items-center gap-3 bg-[#2d6147] text-white px-4 py-1.5 rounded-t-xl font-semibold border-b border-white/20 ${
                    amplified ? "text-sm" : "text-xs"
                  }`}
                >
                  <span>{report.salary_code}</span>
                  <span className="opacity-75">▾</span>
                  <FileSpreadsheet className="w-3.5 h-3.5 opacity-80" />
                </div>

                {/* Salary Payment Status Flag on Payslip */}
                <div className="mb-1.5">
                  {activeSlip.is_paid ? (
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-mono font-bold uppercase tracking-wider border ${
                        isLight
                          ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                          : "bg-emerald-950/70 text-emerald-300 border-emerald-500/40"
                      } ${amplified ? "text-xs" : "text-[11px]"}`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                      <span>Proceeded to Payment</span>
                      {activeSlip.paid_at && (
                        <span className="opacity-75 font-normal">
                          · {activeSlip.paid_at}
                        </span>
                      )}
                    </span>
                  ) : (
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-mono font-bold uppercase tracking-wider border ${
                        isLight
                          ? "bg-amber-100 text-amber-800 border-amber-300"
                          : "bg-amber-950/70 text-amber-300 border-amber-500/40"
                      } ${amplified ? "text-xs" : "text-[11px]"}`}
                    >
                      <Clock className="w-3.5 h-3.5 shrink-0" />
                      <span>Not Yet Proceeded to Payment</span>
                    </span>
                  )}
                </div>
              </div>

              <div
                className={`border rounded-b-xl rounded-tr-xl overflow-hidden ${
                  isLight ? "border-[#2d6147]/40" : "border-[#2d6147]"
                }`}
              >
                <table
                  className={`w-full border-collapse ${
                    amplified ? "text-base" : "text-sm"
                  }`}
                >
                  <thead>
                    <tr
                      className={`bg-[#2d6147] text-white ${
                        amplified ? "text-sm" : "text-xs"
                      }`}
                    >
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
                      isLight
                        ? "divide-[#ded8cb] text-[#181512]"
                        : "divide-[#f5eee2]/10 text-[#f6f3ec]"
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
                        Daily
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
                        Telat
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

                    {/* Row 5: Custom / Extra Line */}
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
                          ? formatAccountingRp(activeSlip.custom_unit, false)
                          : ""}
                      </td>
                      <td className="py-2.5 px-3.5 text-right font-mono font-medium">
                        {formatAccountingRp(activeSlip.custom_total)}
                      </td>
                    </tr>

                    {/* Row 6: Grand Total */}
                    <tr
                      className={
                        isLight
                          ? "bg-[#f1ece1] font-semibold"
                          : "bg-[#24201c] font-semibold"
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
                          ? formatAccountingRp(-activeSlip.kasbon_unit, false)
                          : "Rp -"}
                      </td>
                      <td className="py-2.5 px-3.5 text-right font-mono font-medium text-rose-600 dark:text-rose-400">
                        {formatAccountingRp(activeSlip.kasbon_total)}
                      </td>
                    </tr>

                    {/* Row 8: Final Net Pay */}
                    <tr
                      className={
                        isLight
                          ? "bg-[#eef5f0] font-bold text-base"
                          : "bg-emerald-950/30 font-bold text-base text-emerald-300"
                      }
                    >
                      <td
                        colSpan={3}
                        className="py-3 px-3.5 text-left text-xs font-mono uppercase tracking-wider opacity-80 border-r border-current/10"
                      >
                        Take-Home Pay ·{" "}
                        <span
                          className={
                            activeSlip.is_paid
                              ? isLight
                                ? "text-emerald-700 font-bold"
                                : "text-emerald-400 font-bold"
                              : isLight
                                ? "text-amber-700 font-bold"
                                : "text-amber-400 font-bold"
                          }
                        >
                          {activeSlip.is_paid
                            ? "PROCEEDED TO PAYMENT ✓"
                            : "NOT YET PAID"}
                        </span>
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
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <main className="min-h-screen p-4 sm:p-6 lg:p-10 max-w-[1600px] mx-auto">
      {/* Global Print Rule: Only print the payslip card */}
      <style jsx global>{`
        @media print {
          body {
            background: #ffffff !important;
            color: #18181b !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .no-print {
            display: none !important;
          }
          .print-only-slip {
            display: block !important;
            width: 100% !important;
            max-width: 820px !important;
            margin: 0 auto !important;
            padding: 0 !important;
          }
        }
      `}</style>

      {/* Print-Only Payslip View */}
      <div className="hidden print-only-slip">
        {renderPayslipCard(false, "light")}
      </div>

      {/* Amplified / Full-Screen Payslip Modal */}
      {isFullScreenSlip && report && activeSlip && (
        <div
          className="no-print fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex flex-col p-4 sm:p-8 overflow-y-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setIsFullScreenSlip(false);
            }
          }}
        >
          <div className="w-full max-w-5xl mx-auto space-y-5 my-auto">
            {/* Full-Screen Modal Top Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 cockpit-panel p-3.5 rounded-2xl shadow-xl">
              <div className="flex flex-wrap items-center gap-1.5">
                {report.payslips.map((p) => {
                  const isActive =
                    p.employee.employee_name ===
                    activeSlip.employee.employee_name;
                  return (
                    <button
                      key={p.employee.employee_name}
                      type="button"
                      onClick={() => setSelectedEmpName(p.employee.employee_name)}
                      title={
                        p.is_paid
                          ? `${p.employee.full_name}: Salary Proceeded to Payment`
                          : `${p.employee.full_name}: Salary Not Yet Proceeded to Payment`
                      }
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                        isActive
                          ? "bg-[#5c7c5c] text-[#f5f2dc] font-semibold shadow"
                          : "surface-well hover:bg-[var(--bg-surface-3)] text-[var(--text-primary)]"
                      }`}
                    >
                      {p.is_paid ? (
                        <CheckCircle2
                          className={`w-3.5 h-3.5 shrink-0 ${
                            isActive
                              ? "text-emerald-200"
                              : "text-emerald-600 dark:text-emerald-400"
                          }`}
                        />
                      ) : (
                        <Clock
                          className={`w-3 h-3 shrink-0 ${
                            isActive
                              ? "text-amber-200"
                              : "text-amber-600 dark:text-amber-400"
                          }`}
                        />
                      )}
                      <span>{p.employee.employee_name}</span>
                      <span className="text-[10px] opacity-75 font-mono">
                        ({p.daily_qty}d)
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  disabled={
                    togglingPaymentKey === activeSlip.employee.employee_name
                  }
                  onClick={() =>
                    handleToggleEmployeePayment(
                      activeSlip.employee.employee_name,
                      activeSlip.employee.full_name,
                      activeSlip.is_paid
                    )
                  }
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all ${
                    activeSlip.is_paid ? "badge-emerald" : "badge-amber"
                  }`}
                  title={
                    activeSlip.is_paid
                      ? "Salary has been proceeded to payment. Click to mark as Not Yet Paid."
                      : "Salary has not yet been proceeded to payment. Click to mark as Proceeded to Payment."
                  }
                >
                  {activeSlip.is_paid ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Proceeded to Payment ✓</span>
                    </>
                  ) : (
                    <>
                      <Clock className="w-3.5 h-3.5" />
                      <span>Not Yet Paid · Mark Proceeded</span>
                    </>
                  )}
                </button>
                <span className="text-xs font-mono text-[var(--text-secondary)] hidden sm:inline">
                  {report.cycle_label}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setSlipTheme(slipTheme === "light" ? "dark" : "light")
                  }
                  className="px-3 py-1.5 rounded-lg surface-well hover:bg-[var(--bg-surface-3)] text-[var(--text-primary)] text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  {slipTheme === "light" ? (
                    <>
                      <Moon className="w-3.5 h-3.5" />
                      <span>Dark</span>
                    </>
                  ) : (
                    <>
                      <Sun className="w-3.5 h-3.5 text-amber-500" />
                      <span>Classic</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3 py-1.5 rounded-lg badge-emerald text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Payslip</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsFullScreenSlip(false)}
                  className="px-3 py-1.5 rounded-lg surface-well hover:bg-[var(--bg-surface-3)] text-[var(--text-primary)] text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                  title="Close Full Screen (Esc)"
                >
                  <Minimize2 className="w-3.5 h-3.5" />
                  <span>Close</span>
                </button>
              </div>
            </div>

            {/* Amplified Payslip Card */}
            {renderPayslipCard(true)}
          </div>
        </div>
      )}

      <div className="no-print space-y-6">
      {/* =========================================================================
          Top Header: Navigation & Attendance CSV Upload
          ========================================================================= */}
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 pb-5 border-b border-[var(--border-subtle)]">
        <div>
          <div className="flex items-center gap-3.5">
            <div className="p-2.5 rounded-2xl bg-[#5c7c5c]/20 border border-[#5c7c5c]/40 text-[#5c7c5c] dark:text-[#e9e5c9]">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-[var(--text-primary)]">
                  Tyfel Coffee · Staff Attendance & Payslips
                </h1>
                <span className="badge-emerald text-[10px] font-mono uppercase tracking-widest px-2.5 py-0.5 rounded-full font-semibold">
                  Payroll Studio
                </span>
              </div>
              <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-0.5">
                Monthly payroll periods (16th–15th), per-period employee overrides, payment disbursement status & attendance verification
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
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-[var(--accent-primary)] hover:opacity-90 text-white transition-all cursor-pointer disabled:opacity-50 shadow-sm"
          >
            <UploadCloud className="w-4 h-4" />
            {isUploadingCsv
              ? "Importing Absensi..."
              : "Upload Laporan Absensi CSV"}
          </button>

          <button
            type="button"
            onClick={handleExportPayrollCsv}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-mono surface-well hover:bg-[var(--bg-surface-3)] text-[var(--text-primary)] transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            Export Payroll CSV
          </button>
        </div>
      </header>

      {uploadNotice && (
        <div className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-200 text-xs">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>{uploadNotice}</span>
          </div>
          <button
            onClick={() => setUploadNotice(null)}
            className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-xs font-mono cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {saveBanner && (
        <div className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-200 text-xs">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>{saveBanner}</span>
          </div>
        </div>
      )}

      {/* =========================================================================
          Payroll Period Selector: Ordered by Year & Month
          ========================================================================= */}
      <section className="cockpit-panel rounded-2xl p-4 sm:p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-[var(--text-primary)]">
              <Calendar className="w-4 h-4 text-[var(--accent-primary)]" />
              <span className="font-semibold">Payroll Period (Year & Month)</span>
            </div>

            {/* Year Selector Tabs (Ordered Ascending) */}
            <div className="inline-flex items-center surface-well p-1 rounded-xl">
              {(report?.available_years || [2025, 2026]).map((yr) => (
                <button
                  key={yr}
                  type="button"
                  onClick={() => setSelectedYear(yr)}
                  className={`px-3 py-1 rounded-lg text-xs font-mono font-semibold transition-colors cursor-pointer ${
                    selectedYear === yr
                      ? "bg-[var(--accent-primary)] text-white"
                      : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                  }`}
                >
                  {yr}
                </button>
              ))}
            </div>

            {report && (
              <span className="text-xs font-mono text-[var(--text-secondary)] flex flex-wrap items-center gap-2">
                <span>
                  Active Period:{" "}
                  <strong className="text-[var(--text-primary)]">{report.cycle_label}</strong> ·{" "}
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                    {report.salary_code}
                  </span>
                </span>
                {report.overall.cycle_payment_status === "paid" ? (
                  <span className="badge-emerald px-2.5 py-0.5 rounded-full text-[11px] font-semibold inline-flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    All Proceeded to Payment ({report.overall.paid_employees_count}/{report.payslips.length})
                  </span>
                ) : report.overall.cycle_payment_status === "partial" ? (
                  <span className="badge-amber px-2.5 py-0.5 rounded-full text-[11px] font-semibold inline-flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Partial Payment ({report.overall.paid_employees_count}/{report.payslips.length} Paid)
                  </span>
                ) : (
                  <span className="badge-amber px-2.5 py-0.5 rounded-full text-[11px] font-semibold inline-flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Not Yet Proceeded to Payment (0/{report.payslips.length})
                  </span>
                )}
                {report.is_current_running && (
                  <span className="badge-blue px-2 py-0.5 rounded-full text-[11px]">
                    In Progress · Read-Only
                  </span>
                )}
              </span>
            )}
          </div>

          {/* Prev / Next Selectable Period Stepper */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={!prevCycle}
              onClick={() => {
                if (prevCycle) {
                  setSelectedYear(prevCycle.year);
                  setSelectedPeriod(prevCycle.period_key);
                }
              }}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-mono surface-well hover:bg-[var(--bg-surface-3)] text-[var(--text-primary)] disabled:opacity-35 disabled:cursor-not-allowed cursor-pointer transition-colors"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Prev Month</span>
            </button>
            <button
              type="button"
              disabled={!nextCycle}
              onClick={() => {
                if (nextCycle) {
                  setSelectedYear(nextCycle.year);
                  setSelectedPeriod(nextCycle.period_key);
                }
              }}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-mono surface-well hover:bg-[var(--bg-surface-3)] text-[var(--text-primary)] disabled:opacity-35 disabled:cursor-not-allowed cursor-pointer transition-colors"
              title={
                !nextCycle
                  ? "Future periods are locked"
                  : `Go to ${nextCycle.short_label}`
              }
            >
              <span>Next Month</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Chronological 12-Month Grid (01 Jan -> 12 Dec) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 xl:grid-cols-12 gap-2">
          {monthsForYear.map((cyc) => {
            const isSelected = report?.period_key === cyc.period_key;
            const mm = String(cyc.month).padStart(2, "0");

            return (
              <button
                key={cyc.period_key}
                type="button"
                disabled={!cyc.is_selectable}
                onClick={() => {
                  if (cyc.is_selectable) {
                    setSelectedPeriod(cyc.period_key);
                  }
                }}
                title={
                  cyc.is_current_running
                    ? `${cyc.label} — In Progress (Read-Only)`
                    : cyc.is_selectable
                      ? `${cyc.label} (${cyc.salary_code})`
                      : `Future period locked (${cyc.start_date} to ${cyc.end_date})`
                }
                className={`p-2.5 rounded-xl text-left border transition-all flex flex-col justify-between min-h-[78px] ${
                  isSelected
                    ? cyc.is_current_running
                      ? "bg-sky-500/15 border-sky-500/60 text-[var(--text-primary)] shadow-sm cursor-pointer"
                      : "bg-emerald-500/15 border-emerald-500/60 text-[var(--text-primary)] shadow-sm cursor-pointer"
                    : cyc.is_selectable
                      ? "surface-well hover:bg-[var(--bg-surface-3)] text-[var(--text-primary)] cursor-pointer"
                      : "bg-[var(--bg-surface-2)]/40 border-[var(--border-subtle)] text-[var(--text-muted)] cursor-not-allowed opacity-55"
                }`}
              >
                <div className="flex items-center justify-between gap-1">
                  <span className="text-xs font-mono font-bold">
                    {mm} · {cyc.month_short}
                  </span>
                  {!cyc.is_selectable ? (
                    <Lock className="w-3 h-3 text-[var(--text-muted)] shrink-0" />
                  ) : cyc.is_current_running ? (
                    <span
                      className="w-2 h-2 rounded-full bg-sky-500 animate-pulse shrink-0"
                      title="In Progress (Read-Only)"
                    />
                  ) : cyc.payment_status === "paid" ? (
                    <span
                      className="inline-flex shrink-0"
                      title="All salaries in this period proceeded to payment"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    </span>
                  ) : cyc.log_count > 0 ? (
                    <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                  ) : null}
                </div>

                <div className="mt-1.5 space-y-0.5">
                  <div className="text-[10px] font-mono text-[var(--text-secondary)] truncate">
                    {cyc.start_date.slice(5)} → {cyc.end_date.slice(5)}
                  </div>
                  <div className="flex items-center justify-between gap-1 text-[10px] font-mono">
                    {cyc.is_current_running ? (
                      <span className="text-sky-600 dark:text-sky-400 font-semibold">
                        In Progress ({cyc.log_count})
                      </span>
                    ) : cyc.is_selectable ? (
                      <span
                        className={
                          cyc.log_count > 0
                            ? "text-emerald-600 dark:text-emerald-400 font-semibold"
                            : "text-[var(--text-muted)]"
                        }
                      >
                        {cyc.log_count > 0
                          ? `${cyc.log_count} logs`
                          : "0 logs"}
                      </span>
                    ) : (
                      <span className="text-[var(--text-muted)]">Locked</span>
                    )}
                    {cyc.is_selectable &&
                    (cyc.paid_count > 0 ||
                      (cyc.log_count > 0 && !cyc.is_current_running)) ? (
                      cyc.payment_status === "paid" ? (
                        <span
                          className="px-1 rounded badge-emerald text-[9px] font-bold"
                          title={`All ${cyc.paid_count}/${cyc.active_employee_count} staff salaries proceeded to payment`}
                        >
                          PAID
                        </span>
                      ) : cyc.payment_status === "partial" ? (
                        <span
                          className="px-1 rounded badge-amber text-[9px] font-bold"
                          title={`${cyc.paid_count}/${cyc.active_employee_count} staff salaries proceeded to payment`}
                        >
                          {cyc.paid_count}/{cyc.active_employee_count} PAID
                        </span>
                      ) : (
                        <span
                          className="px-1 rounded badge-rose text-[9px] font-semibold"
                          title="Salaries for this completed period have not yet been proceeded to payment"
                        >
                          UNPAID
                        </span>
                      )
                    ) : cyc.override_count > 0 ? (
                      <span
                        className="px-1 rounded badge-amber text-[10px]"
                        title={`${cyc.override_count} saved employee override(s) in this period`}
                      >
                        {cyc.override_count} adj
                      </span>
                    ) : null}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* =========================================================================
          Executive Payroll & Punctuality KPIs
          ========================================================================= */}
      {loading && !report && (
        <div className="cockpit-panel rounded-2xl p-8 text-center text-xs font-mono text-[var(--text-secondary)] animate-pulse">
          Loading Payroll & Attendance Telemetry from DuckDB...
        </div>
      )}
      {report && (
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="cockpit-panel rounded-2xl p-5 accent-bar-emerald">
            <div className="flex items-center justify-between text-xs text-[var(--text-secondary)] mb-2">
              <span className="font-mono uppercase tracking-wider font-semibold">
                Cycle Net Payroll ({report.salary_code})
              </span>
              <DollarSign className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="text-2xl font-bold font-mono text-[var(--text-primary)]">
              {formatRp(report.overall.total_net_take_home)}
            </div>
            <div className="mt-2 flex items-center justify-between text-xs text-[var(--text-secondary)]">
              <span>Gross: {formatRp(report.overall.total_gross_payroll)}</span>
              <span className="text-amber-600 dark:text-amber-300 font-mono">
                Kasbon: -{formatRp(report.overall.total_kasbon_deducted)}
              </span>
            </div>
            <div className="mt-2.5 pt-2 border-t border-[var(--border-subtle)] flex items-center justify-between text-[11px] font-mono">
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                Paid ({report.overall.paid_employees_count}):{" "}
                {formatRp(report.overall.total_paid_net_amount)}
              </span>
              <span
                className={
                  report.overall.unpaid_employees_count > 0
                    ? "text-amber-600 dark:text-amber-400 font-semibold"
                    : "text-[var(--text-muted)]"
                }
              >
                Unpaid ({report.overall.unpaid_employees_count}):{" "}
                {formatRp(report.overall.total_unpaid_net_amount)}
              </span>
            </div>
          </div>

          <div className="cockpit-panel rounded-2xl p-5 accent-bar-blue">
            <div className="flex items-center justify-between text-xs text-[var(--text-secondary)] mb-2">
              <span className="font-mono uppercase tracking-wider font-semibold">
                Active Staff & Paid Shifts
              </span>
              <UserCheck className="w-4 h-4 text-sky-600 dark:text-sky-400" />
            </div>
            <div className="text-2xl font-bold font-mono text-[var(--text-primary)]">
              {report.overall.active_employees} Staff ·{" "}
              {report.overall.total_work_days_paid} Days
            </div>
            <div className="mt-2 flex items-center justify-between text-xs text-[var(--text-secondary)]">
              <span>{report.overall.total_attendance_logs} raw logs</span>
              <span className="text-sky-600 dark:text-sky-300 font-mono">
                Avg {report.overall.avg_daily_shift_hours}h / shift
              </span>
            </div>
          </div>

          <div className="cockpit-panel rounded-2xl p-5 accent-bar-amber">
            <div className="flex items-center justify-between text-xs text-[var(--text-secondary)] mb-2">
              <span className="font-mono uppercase tracking-wider font-semibold">
                Punctuality & Telat Fines
              </span>
              <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="text-2xl font-bold font-mono text-[var(--text-primary)]">
              {report.overall.overall_punctuality_pct}% On-Time
            </div>
            <div className="mt-2 flex items-center justify-between text-xs text-[var(--text-secondary)]">
              <span className="text-rose-600 dark:text-rose-400 font-mono">
                {report.overall.total_late_incidents}x Telat (-
                {formatRp(report.overall.total_late_penalties)})
              </span>
              <span className="text-emerald-600 dark:text-emerald-400 font-mono">
                {report.overall.zero_late_achievers} Bonus Achievers
              </span>
            </div>
          </div>

          <div className="cockpit-panel rounded-2xl p-5 accent-bar-purple">
            <div className="flex items-center justify-between text-xs text-[var(--text-secondary)] mb-2">
              <span className="font-mono uppercase tracking-wider font-semibold">
                POS Clock Anomaly Shield
              </span>
              <ShieldAlert className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="text-2xl font-bold font-mono text-[var(--text-primary)]">
              {report.overall.total_closing_taps +
                report.overall.total_overnight_rollovers}{" "}
              Flagged
            </div>
            <div className="mt-2 flex items-center justify-between text-xs text-[var(--text-secondary)]">
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
          Interactive Tyfel Coffee Payslip Studio (Left: Payslip Card | Right: Breakdown & Per-Period Editor)
          ========================================================================= */}
      {report && activeSlip && (
        <section className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
          {/* Left 7 Columns: Authentic Tyfel Coffee Payslip Card */}
          <div className="xl:col-span-7 space-y-4">
            {/* Employee Switcher Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2 cockpit-panel p-3 rounded-2xl">
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
                      title={
                        p.is_paid
                          ? "Salary Proceeded to Payment"
                          : "Salary Not Yet Proceeded to Payment"
                      }
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                        isActive
                          ? "bg-[#5c7c5c] text-[#f5f2dc] font-semibold shadow"
                          : "surface-well hover:bg-[var(--bg-surface-3)] text-[var(--text-primary)]"
                      }`}
                    >
                      {p.is_paid ? (
                        <CheckCircle2
                          className={`w-3.5 h-3.5 shrink-0 ${
                            isActive
                              ? "text-emerald-200"
                              : "text-emerald-600 dark:text-emerald-400"
                          }`}
                        />
                      ) : (
                        <Clock
                          className={`w-3 h-3 shrink-0 ${
                            isActive
                              ? "text-amber-200"
                              : "text-amber-600 dark:text-amber-400"
                          }`}
                        />
                      )}
                      <span>{p.employee.employee_name}</span>
                      <span className="text-[10px] opacity-75 font-mono">
                        ({p.daily_qty}d)
                      </span>
                      {p.has_period_override && (
                        <span
                          className="w-1.5 h-1.5 rounded-full bg-amber-400"
                          title="Has saved override for this period"
                        />
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                {/* One-Click Salary Payment Flag Toggle for Active Employee */}
                <button
                  type="button"
                  disabled={
                    togglingPaymentKey === activeSlip.employee.employee_name
                  }
                  onClick={() =>
                    handleToggleEmployeePayment(
                      activeSlip.employee.employee_name,
                      activeSlip.employee.full_name,
                      activeSlip.is_paid
                    )
                  }
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50 ${
                    activeSlip.is_paid ? "badge-emerald" : "badge-amber"
                  }`}
                  title={
                    activeSlip.is_paid
                      ? "Salary has been proceeded to payment. Click to mark as Not Yet Paid."
                      : "Salary has not yet been proceeded to payment. Click to mark as Proceeded to Payment."
                  }
                >
                  {activeSlip.is_paid ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Proceeded to Payment ✓</span>
                    </>
                  ) : (
                    <>
                      <Clock className="w-3.5 h-3.5" />
                      <span>Not Yet Paid · Mark Proceeded</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setSlipTheme(slipTheme === "light" ? "dark" : "light")
                  }
                  className="p-2 rounded-lg surface-well hover:bg-[var(--bg-surface-3)] text-[var(--text-primary)] text-xs flex items-center gap-1 cursor-pointer"
                  title="Toggle Classic Spreadsheet Light View vs Dark View"
                >
                  {slipTheme === "light" ? (
                    <>
                      <Moon className="w-3.5 h-3.5" />
                      <span className="text-[11px]">Dark</span>
                    </>
                  ) : (
                    <>
                      <Sun className="w-3.5 h-3.5 text-amber-500" />
                      <span className="text-[11px]">Classic</span>
                    </>
                  )}
                </button>

                {report.is_editable ? (
                  <button
                    type="button"
                    onClick={() => setIsEditingSlip(!isEditingSlip)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                      isEditingSlip
                        ? "badge-amber"
                        : "badge-emerald"
                    }`}
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>
                      {isEditingSlip
                        ? "Close Editor"
                        : `Override (${report.salary_code})`}
                    </span>
                  </button>
                ) : (
                  <span
                    className="px-2.5 py-1.5 rounded-lg text-xs font-mono flex items-center gap-1.5 badge-blue cursor-not-allowed"
                    title="In-progress periods can be viewed live, but overrides are locked until the period closes"
                  >
                    <Lock className="w-3 h-3" />
                    <span>In Progress (Read-Only)</span>
                  </span>
                )}

                <button
                  type="button"
                  onClick={() => setIsFullScreenSlip(true)}
                  className="p-2 rounded-lg surface-well hover:bg-[var(--bg-surface-3)] text-[var(--text-primary)] cursor-pointer flex items-center gap-1 text-xs"
                  title="Amplify / Open Payslip in Full Screen Modal"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                  <span className="text-[11px] hidden sm:inline">Full Screen</span>
                </button>

                <button
                  type="button"
                  onClick={() => window.print()}
                  className="p-2 rounded-lg surface-well hover:bg-[var(--bg-surface-3)] text-[var(--text-primary)] cursor-pointer"
                  title="Print Only Payslip"
                >
                  <Printer className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* THE PAYSLIP CARD */}
            {renderPayslipCard(false)}
          </div>

          {/* Right 5 Columns: Per-Period Editor Form OR Late & Anomaly Audit Breakdown */}
          <div className="xl:col-span-5 space-y-4">
            {isEditingSlip && report.is_editable ? (
              <form
                onSubmit={handleSavePayslip}
                className="cockpit-panel rounded-2xl p-5 border-emerald-500/40 space-y-4"
              >
                <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
                      <Sliders className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      Period Override · {activeSlip.employee.full_name}
                    </h3>
                    <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                      Saved strictly for{" "}
                      <strong className="text-emerald-600 dark:text-emerald-400 font-mono">
                        {report.year}-{String(report.month).padStart(2, "0")} ({report.salary_code})
                      </strong>{" "}
                      ({report.start_date} – {report.end_date})
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsEditingSlip(false)}
                    className="text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>

                {/* Employee Bio */}
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-[var(--text-secondary)] mb-1">Full Name</label>
                    <input
                      type="text"
                      value={editFullName}
                      onChange={(e) => setEditFullName(e.target.value)}
                      className="w-full surface-well rounded-lg px-2.5 py-1.5 text-[var(--text-primary)]"
                    />
                  </div>
                  <div>
                    <label className="block text-[var(--text-secondary)] mb-1">
                      Role / Division
                    </label>
                    <input
                      type="text"
                      value={editRole}
                      onChange={(e) => setEditRole(e.target.value)}
                      className="w-full surface-well rounded-lg px-2.5 py-1.5 text-[var(--text-primary)]"
                    />
                  </div>
                  <div>
                    <label className="block text-[var(--text-secondary)] mb-1">
                      Join Date Label
                    </label>
                    <input
                      type="text"
                      value={editJoinDate}
                      onChange={(e) => setEditJoinDate(e.target.value)}
                      className="w-full surface-well rounded-lg px-2.5 py-1.5 text-[var(--text-primary)]"
                    />
                  </div>
                  <div>
                    <label className="block text-[var(--text-secondary)] mb-1">
                      Period Shift Cutoff (HH:MM)
                    </label>
                    <input
                      type="time"
                      value={editShiftCutoff}
                      onChange={(e) => setEditShiftCutoff(e.target.value)}
                      className="w-full surface-well rounded-lg px-2.5 py-1.5 text-[var(--text-primary)] font-mono"
                    />
                  </div>
                </div>

                {/* Period Rate Overrides */}
                <div className="grid grid-cols-2 gap-3 text-xs pt-2 border-t border-[var(--border-subtle)]">
                  <div>
                    <label className="block text-[var(--text-secondary)] mb-1">
                      Basic Salary ({report.salary_code})
                    </label>
                    <input
                      type="number"
                      value={editBasicSalary}
                      onChange={(e) =>
                        setEditBasicSalary(Number(e.target.value))
                      }
                      className="w-full surface-well rounded-lg px-2.5 py-1.5 text-[var(--text-primary)] font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[var(--text-secondary)] mb-1">
                      Daily Rate ({report.salary_code})
                    </label>
                    <input
                      type="number"
                      value={editDailyRate}
                      onChange={(e) => setEditDailyRate(Number(e.target.value))}
                      className="w-full surface-well rounded-lg px-2.5 py-1.5 text-[var(--text-primary)] font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[var(--text-secondary)] mb-1">
                      Telat Penalty ({report.salary_code})
                    </label>
                    <input
                      type="number"
                      value={editLatePenalty}
                      onChange={(e) =>
                        setEditLatePenalty(Number(e.target.value))
                      }
                      className="w-full surface-well rounded-lg px-2.5 py-1.5 text-[var(--text-primary)] font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[var(--text-secondary)] mb-1">
                      Bonus Tidak Telat ({report.salary_code})
                    </label>
                    <input
                      type="number"
                      value={editNoLateBonus}
                      onChange={(e) =>
                        setEditNoLateBonus(Number(e.target.value))
                      }
                      className="w-full surface-well rounded-lg px-2.5 py-1.5 text-[var(--text-primary)] font-mono"
                    />
                  </div>
                </div>

                {/* Period Count Overrides */}
                <div className="grid grid-cols-3 gap-2.5 text-xs pt-2 border-t border-[var(--border-subtle)]">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[var(--text-secondary)]">Daily (#)</label>
                      <button
                        type="button"
                        onClick={() => setEditDailyOverride("")}
                        className="text-[10px] text-emerald-600 dark:text-emerald-400 hover:underline font-mono cursor-pointer"
                      >
                        Auto ({activeSlip.computed_daily_count})
                      </button>
                    </div>
                    <input
                      type="number"
                      placeholder={`Auto: ${activeSlip.computed_daily_count}`}
                      value={editDailyOverride}
                      onChange={(e) => setEditDailyOverride(e.target.value)}
                      className="w-full surface-well rounded-lg px-2.5 py-1.5 text-[var(--text-primary)] font-mono"
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[var(--text-secondary)]">Telat (#)</label>
                      <button
                        type="button"
                        onClick={() => setEditLateOverride("")}
                        className="text-[10px] text-emerald-600 dark:text-emerald-400 hover:underline font-mono cursor-pointer"
                      >
                        Auto ({activeSlip.computed_late_count})
                      </button>
                    </div>
                    <input
                      type="number"
                      placeholder={`Auto: ${activeSlip.computed_late_count}`}
                      value={editLateOverride}
                      onChange={(e) => setEditLateOverride(e.target.value)}
                      className="w-full surface-well rounded-lg px-2.5 py-1.5 text-[var(--text-primary)] font-mono"
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[var(--text-secondary)]">Bonus (#)</label>
                      <button
                        type="button"
                        onClick={() => setEditBonusQtyOverride("")}
                        className="text-[10px] text-emerald-600 dark:text-emerald-400 hover:underline font-mono cursor-pointer"
                      >
                        Auto
                      </button>
                    </div>
                    <input
                      type="number"
                      placeholder="Auto (0/1)"
                      value={editBonusQtyOverride}
                      onChange={(e) => setEditBonusQtyOverride(e.target.value)}
                      className="w-full surface-well rounded-lg px-2.5 py-1.5 text-[var(--text-primary)] font-mono"
                    />
                  </div>
                </div>

                {/* Extra Line & Kasbon for this Period */}
                <div className="grid grid-cols-3 gap-2.5 text-xs pt-2 border-t border-[var(--border-subtle)]">
                  <div>
                    <label className="block text-[var(--text-secondary)] mb-1">
                      Extra Line Label
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Lembur / THR"
                      value={editCustomDesc}
                      onChange={(e) => setEditCustomDesc(e.target.value)}
                      className="w-full surface-well rounded-lg px-2.5 py-1.5 text-[var(--text-primary)]"
                    />
                  </div>
                  <div>
                    <label className="block text-[var(--text-secondary)] mb-1">Extra #</label>
                    <input
                      type="number"
                      value={editCustomQty}
                      onChange={(e) => setEditCustomQty(Number(e.target.value))}
                      className="w-full surface-well rounded-lg px-2.5 py-1.5 text-[var(--text-primary)] font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[var(--text-secondary)] mb-1">
                      Extra Value (Rp)
                    </label>
                    <input
                      type="number"
                      value={editCustomUnit}
                      onChange={(e) =>
                        setEditCustomUnit(Number(e.target.value))
                      }
                      className="w-full surface-well rounded-lg px-2.5 py-1.5 text-[var(--text-primary)] font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs pt-2 border-t border-[var(--border-subtle)]">
                  <div>
                    <label className="block text-[var(--text-secondary)] mb-1">
                      Kasbon (#) for {report.salary_code}
                    </label>
                    <input
                      type="number"
                      value={editKasbonQty}
                      onChange={(e) => setEditKasbonQty(Number(e.target.value))}
                      className="w-full surface-well rounded-lg px-2.5 py-1.5 text-[var(--text-primary)] font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[var(--text-secondary)] mb-1">
                      Kasbon Amount (Rp)
                    </label>
                    <input
                      type="number"
                      value={editKasbonUnit}
                      onChange={(e) =>
                        setEditKasbonUnit(Number(e.target.value))
                      }
                      className="w-full surface-well rounded-lg px-2.5 py-1.5 text-[var(--text-primary)] font-mono"
                    />
                  </div>
                </div>

                <div className="text-xs pt-2 border-t border-[var(--border-subtle)]">
                  <label className="block text-[var(--text-secondary)] mb-1">
                    Period Notes ({report.salary_code})
                  </label>
                  <input
                    type="text"
                    placeholder="Optional note for this employee in this period..."
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    className="w-full surface-well rounded-lg px-2.5 py-1.5 text-[var(--text-primary)]"
                  />
                </div>

                {/* Payment Status Flag inside Editor */}
                <div className="pt-2 border-t border-[var(--border-subtle)]">
                  <label className="block text-xs text-[var(--text-secondary)] mb-1.5">
                    Salary Payment Status ({report.salary_code})
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setEditIsPaid(false)}
                      className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border cursor-pointer transition-all ${
                        !editIsPaid
                          ? "badge-amber shadow-xs"
                          : "surface-well text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                      }`}
                    >
                      <Clock className="w-3.5 h-3.5" />
                      <span>Not Yet Proceeded</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditIsPaid(true)}
                      className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border cursor-pointer transition-all ${
                        editIsPaid
                          ? "badge-emerald shadow-xs"
                          : "surface-well text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Proceeded to Payment</span>
                    </button>
                  </div>
                </div>

                <label className="flex items-center gap-2 text-xs text-[var(--text-secondary)] pt-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={alsoUpdateMasterDefaults}
                    onChange={(e) =>
                      setAlsoUpdateMasterDefaults(e.target.checked)
                    }
                    className="rounded border-[var(--border-strong)]"
                  />
                  <span>
                    Also update default base salary / daily rate for un-overridden periods
                  </span>
                </label>

                <div className="flex items-center justify-between gap-2 pt-3 border-t border-[var(--border-subtle)]">
                  {activeSlip.has_period_override ? (
                    <button
                      type="button"
                      disabled={savingSlip}
                      onClick={handleResetPeriodOverride}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl badge-rose text-xs font-medium cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      Reset {report.salary_code} Override
                    </button>
                  ) : (
                    <div />
                  )}

                  <button
                    type="submit"
                    disabled={savingSlip}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--accent-primary)] hover:opacity-90 text-white font-semibold text-xs cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" />
                    {savingSlip
                      ? "Saving..."
                      : `Save for ${report.salary_code}`}
                  </button>
                </div>
              </form>
            ) : (
              /* Audit Card for Selected Employee */
              <div className="cockpit-panel rounded-2xl p-5 space-y-5">
                <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3.5">
                  <div>
                    <h3 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      Attendance Verification · {activeSlip.employee.full_name}
                    </h3>
                    <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                      {activeSlip.raw_logs_count} clock-in records in{" "}
                      {report.start_date} – {report.end_date}
                    </p>
                  </div>
                  <span className="text-xs font-mono px-2.5 py-1 rounded-lg surface-well text-[var(--text-primary)]">
                    Cutoff {activeSlip.effective_shift_start}
                  </span>
                </div>

                {/* Shift Breakdown Mini Grid */}
                <div className="grid grid-cols-3 gap-2.5 text-center">
                  <div className="p-3 rounded-xl surface-well">
                    <div className="text-lg font-bold font-mono text-[var(--text-primary)]">
                      {activeSlip.full_shifts_count}
                    </div>
                    <div className="text-[11px] text-[var(--text-secondary)]">Full Shifts</div>
                  </div>
                  <div className="p-3 rounded-xl surface-well">
                    <div
                      className={`text-lg font-bold font-mono ${
                        activeSlip.late_qty > 0
                          ? "text-rose-600 dark:text-rose-400"
                          : "text-emerald-600 dark:text-emerald-400"
                      }`}
                    >
                      {activeSlip.late_qty}
                    </div>
                    <div className="text-[11px] text-[var(--text-secondary)]">
                      Telat (&gt;{activeSlip.effective_shift_start})
                    </div>
                  </div>
                  <div className="p-3 rounded-xl surface-well">
                    <div className="text-lg font-bold font-mono text-sky-600 dark:text-sky-400">
                      {activeSlip.avg_effective_hours}h
                    </div>
                    <div className="text-[11px] text-[var(--text-secondary)]">
                      Avg Shift / Day
                    </div>
                  </div>
                </div>

                {/* Exact Dates of Telat Incidents */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono uppercase tracking-wider text-[var(--text-secondary)]">
                      Telat Incident Log ({activeSlip.late_logs.length} dates)
                    </span>
                    <span className="font-mono text-rose-600 dark:text-rose-400">
                      Total +{activeSlip.total_late_minutes} mins late
                    </span>
                  </div>

                  {activeSlip.late_logs.length === 0 ? (
                    <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2.5">
                      <Award className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span>
                        Zero late arrivals in this period! Qualifies for{" "}
                        <strong>
                          Bonus Tidak Telat (
                          {formatRp(activeSlip.effective_no_late_bonus)})
                        </strong>
                        .
                      </span>
                    </div>
                  ) : (
                    <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
                      {activeSlip.late_logs.map((ll) => (
                        <div
                          key={ll.attendance_id}
                          className="flex items-center justify-between px-3 py-2 rounded-lg bg-rose-500/10 border border-rose-500/25 text-xs"
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="font-mono font-semibold text-[var(--text-primary)]">
                              {ll.work_date}
                            </span>
                            <span className="font-mono text-rose-600 dark:text-rose-300">
                              In: {ll.clock_in}
                            </span>
                            <span className="text-[var(--text-secondary)] font-mono text-[11px]">
                              Out: {ll.clock_out}
                            </span>
                          </div>
                          <span className="badge-rose font-mono text-[11px] px-2 py-0.5 rounded">
                            +{ll.late_minutes}m late
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Anomaly / Short Shift Alerts for Selected Employee */}
                {activeSlip.anomaly_logs.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-[var(--border-subtle)]">
                    <div className="text-xs font-mono uppercase tracking-wider text-[var(--text-secondary)]">
                      Shift Anomalies & Notes ({activeSlip.anomaly_logs.length})
                    </div>
                    <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                      {activeSlip.anomaly_logs.map((al) => (
                        <div
                          key={al.attendance_id}
                          className="flex items-center justify-between px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/25 text-xs"
                        >
                          <div>
                            <span className="font-mono font-semibold text-[var(--text-primary)] mr-2">
                              {al.work_date}
                            </span>
                            <span className="font-mono text-amber-600 dark:text-amber-300">
                              {al.clock_in} → {al.clock_out}
                            </span>
                            <div className="text-[11px] text-[var(--text-secondary)] mt-0.5">
                              Raw: {al.raw_duration}
                            </div>
                          </div>
                          <span className="badge-amber font-mono text-[10px] px-2 py-0.5 rounded uppercase">
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
          Team Roster & Payroll Matrix (All Employees for Selected Period)
          ========================================================================= */}
      {report && (
        <section className="cockpit-panel rounded-2xl overflow-hidden">
          <div className="p-5 border-b border-[var(--border-subtle)] flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-[var(--text-primary)]">
                Outlet Payroll & Attendance Matrix · {report.cycle_label}
              </h2>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                Click any employee row to inspect their payslip, or toggle the payment status flag directly for{" "}
                {report.salary_code}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              {/* Payment Status Filter Pills */}
              <div className="flex items-center gap-1 surface-well p-1 rounded-xl">
                {(
                  [
                    {
                      id: "all",
                      label: `All (${report.payslips.length})`,
                    },
                    {
                      id: "paid",
                      label: `Proceeded (${report.overall.paid_employees_count})`,
                    },
                    {
                      id: "unpaid",
                      label: `Not Yet Paid (${report.overall.unpaid_employees_count})`,
                    },
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setMatrixPaymentFilter(tab.id)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                      matrixPaymentFilter === tab.id
                        ? "bg-[var(--accent-primary)] text-white font-semibold"
                        : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Bulk Period Payment Actions */}
              {report.overall.unpaid_employees_count > 0 && (
                <button
                  type="button"
                  disabled={togglingPaymentKey === "ALL"}
                  onClick={() => handleSetPeriodAllPayment(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold badge-emerald cursor-pointer transition-all hover:opacity-90 disabled:opacity-50"
                  title={`Mark all ${report.payslips.length} staff salaries in ${report.salary_code} as Proceeded to Payment`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>
                    {togglingPaymentKey === "ALL"
                      ? "Updating..."
                      : `Mark All Proceeded (${report.salary_code})`}
                  </span>
                </button>
              )}

              {report.overall.paid_employees_count > 0 && (
                <button
                  type="button"
                  disabled={togglingPaymentKey === "ALL"}
                  onClick={() => handleSetPeriodAllPayment(false)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono surface-well hover:bg-[var(--bg-surface-3)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer transition-all disabled:opacity-50"
                  title={`Reset all staff salaries in ${report.salary_code} back to Not Yet Paid`}
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset All Unpaid</span>
                </button>
              )}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-[var(--bg-surface-2)] text-[var(--text-secondary)] font-mono uppercase border-b border-[var(--border-subtle)]">
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
                  <th className="py-3 px-3 text-right">Net Pay</th>
                  <th className="py-3 px-4 text-center">Payment Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-subtle)]">
                {report.payslips
                  .filter((p) => {
                    if (matrixPaymentFilter === "paid") return p.is_paid;
                    if (matrixPaymentFilter === "unpaid") return !p.is_paid;
                    return true;
                  })
                  .map((p) => {
                    const isSelected =
                      p.employee.employee_name ===
                      activeSlip?.employee.employee_name;
                    const isTogglingThis =
                      togglingPaymentKey === p.employee.employee_name ||
                      togglingPaymentKey === "ALL";
                    return (
                      <tr
                        key={p.employee.employee_name}
                        onClick={() =>
                          setSelectedEmpName(p.employee.employee_name)
                        }
                        className={`cursor-pointer transition-colors ${
                          isSelected
                            ? "bg-emerald-500/10 hover:bg-emerald-500/15"
                            : "hover:bg-[var(--bg-surface-2)]/60"
                        }`}
                      >
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-[var(--text-primary)] flex items-center gap-2">
                            <span>{p.employee.full_name}</span>
                            {p.has_period_override && (
                              <span className="badge-amber text-[10px] font-mono px-1.5 py-0.5 rounded">
                                Override
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-[var(--text-secondary)]">
                            ID: {p.employee.employee_name} ·{" "}
                            {p.employee.join_date_label}
                          </div>
                        </td>
                        <td className="py-3.5 px-3">
                          <div className="text-[var(--text-primary)]">{p.employee.role}</div>
                          <div className="text-[11px] font-mono text-[var(--text-secondary)]">
                            In ≤ {p.effective_shift_start}
                          </div>
                        </td>
                        <td className="py-3.5 px-3 text-right font-mono text-[var(--text-secondary)]">
                          <div>{p.raw_logs_count}</div>
                          {(p.closing_taps_count > 0 ||
                            p.overnight_rollovers_count > 0) && (
                            <div className="text-[10px] text-amber-600 dark:text-amber-400">
                              {p.closing_taps_count > 0
                                ? `${p.closing_taps_count} tap `
                                : ""}
                              {p.overnight_rollovers_count > 0
                                ? `${p.overnight_rollovers_count} >20h`
                                : ""}
                            </div>
                          )}
                        </td>
                        <td className="py-3.5 px-3 text-right font-mono font-bold text-[var(--text-primary)]">
                          {p.daily_qty}
                        </td>
                        <td className="py-3.5 px-3 text-right font-mono">
                          <span
                            className={`px-2 py-0.5 rounded ${
                              p.late_qty === 0
                                ? "badge-emerald"
                                : "badge-rose font-bold"
                            }`}
                          >
                            {p.late_qty}
                          </span>
                        </td>
                        <td className="py-3.5 px-3 text-right font-mono text-[var(--text-secondary)]">
                          {formatAccountingRp(p.basic_total)}
                        </td>
                        <td className="py-3.5 px-3 text-right font-mono text-[var(--text-primary)]">
                          {formatAccountingRp(p.daily_total)}
                        </td>
                        <td className="py-3.5 px-3 text-right font-mono text-rose-600 dark:text-rose-400">
                          {formatAccountingRp(p.late_total)}
                        </td>
                        <td className="py-3.5 px-3 text-right font-mono text-emerald-600 dark:text-emerald-400">
                          {formatAccountingRp(p.bonus_tidak_telat_total)}
                        </td>
                        <td className="py-3.5 px-3 text-right font-mono font-bold text-[var(--text-primary)]">
                          {formatAccountingRp(p.grand_total, false)}
                        </td>
                        <td className="py-3.5 px-3 text-right font-mono text-amber-600 dark:text-amber-300">
                          {formatAccountingRp(p.kasbon_total)}
                        </td>
                        <td className="py-3.5 px-3 text-right font-mono font-bold text-emerald-600 dark:text-emerald-300 text-sm">
                          {formatAccountingRp(p.net_take_home_pay, false)}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <div className="flex flex-col items-center justify-center gap-0.5">
                            <button
                              type="button"
                              disabled={isTogglingThis}
                              onClick={(e) =>
                                handleToggleEmployeePayment(
                                  p.employee.employee_name,
                                  p.employee.full_name,
                                  p.is_paid,
                                  e
                                )
                              }
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-mono font-semibold transition-all cursor-pointer disabled:opacity-50 ${
                                p.is_paid ? "badge-emerald" : "badge-amber"
                              }`}
                              title={
                                p.is_paid
                                  ? "Salary has been proceeded to payment. Click to mark as Not Yet Paid."
                                  : "Salary has not yet been proceeded to payment. Click to mark as Proceeded to Payment."
                              }
                            >
                              {p.is_paid ? (
                                <>
                                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                                  <span>Proceeded</span>
                                </>
                              ) : (
                                <>
                                  <Clock className="w-3.5 h-3.5 shrink-0" />
                                  <span>Not Yet Paid</span>
                                </>
                              )}
                            </button>
                            {p.is_paid && p.paid_at && (
                              <span className="text-[10px] font-mono text-[var(--text-muted)]">
                                {p.paid_at}
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
              <tfoot>
                <tr className="bg-[var(--bg-surface-2)] font-mono font-bold text-[var(--text-primary)] border-t border-[var(--border-default)]">
                  <td colSpan={3} className="py-3.5 px-4 text-left uppercase">
                    Total Cycle Liability ({report.salary_code})
                  </td>
                  <td className="py-3.5 px-3 text-right">
                    {report.overall.total_work_days_paid}
                  </td>
                  <td className="py-3.5 px-3 text-right text-rose-600 dark:text-rose-300">
                    {report.overall.total_late_incidents}
                  </td>
                  <td colSpan={4} className="py-3.5 px-3 text-right text-[var(--text-secondary)]">
                    Bonuses: {formatRp(report.overall.total_bonuses_paid)}
                  </td>
                  <td className="py-3.5 px-3 text-right">
                    {formatRp(report.overall.total_gross_payroll)}
                  </td>
                  <td className="py-3.5 px-3 text-right text-amber-600 dark:text-amber-300">
                    -{formatRp(report.overall.total_kasbon_deducted)}
                  </td>
                  <td className="py-3.5 px-3 text-right text-emerald-600 dark:text-emerald-400 text-sm">
                    {formatRp(report.overall.total_net_take_home)}
                  </td>
                  <td className="py-3.5 px-4 text-center text-xs">
                    <span
                      className={
                        report.overall.cycle_payment_status === "paid"
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-amber-600 dark:text-amber-400"
                      }
                    >
                      {report.overall.paid_employees_count}/{report.payslips.length} Paid
                    </span>
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
        <section className="cockpit-panel rounded-2xl overflow-hidden">
          <div className="p-5 border-b border-[var(--border-subtle)] flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-[var(--text-primary)]">
                Granular Attendance Logs (Laporan Absensi)
              </h2>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                Showing {filteredLogs.length} of {report.recent_logs.length} logs in {report.start_date} – {report.end_date}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              {/* Employee Filter */}
              <select
                value={logEmpFilter}
                onChange={(e) => setLogEmpFilter(e.target.value)}
                className="surface-well rounded-xl px-3 py-1.5 text-xs text-[var(--text-primary)]"
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
              <div className="flex items-center gap-1 surface-well p-1 rounded-xl">
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
                        ? "bg-[var(--accent-primary)] text-white font-semibold"
                        : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                    }`}
                  >
                    {st.label}
                  </button>
                ))}
              </div>

              {/* Search */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter date or name..."
                  value={logSearch}
                  onChange={(e) => setLogSearch(e.target.value)}
                  className="surface-well rounded-xl pl-8 pr-3 py-1.5 text-xs text-[var(--text-primary)] w-44"
                />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto max-h-[520px] overflow-y-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead className="sticky top-0 bg-[var(--bg-surface-2)] z-10 border-b border-[var(--border-subtle)] text-[var(--text-secondary)] font-mono uppercase">
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
              <tbody className="divide-y divide-[var(--border-subtle)]">
                {filteredLogs.map((log) => (
                  <tr
                    key={log.attendance_id}
                    className="hover:bg-[var(--bg-surface-2)]/60 transition-colors"
                  >
                    <td className="py-2.5 px-4 font-mono text-[var(--text-primary)]">
                      {log.work_date}
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-[var(--text-primary)]">
                      {log.employee_name}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-[var(--text-secondary)]">
                      {log.shift_start_time}
                    </td>
                    <td className="py-2.5 px-3 font-mono">
                      <span
                        className={
                          log.is_late
                            ? "text-rose-600 dark:text-rose-400 font-bold"
                            : "text-emerald-600 dark:text-emerald-400"
                        }
                      >
                        {log.clock_in}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-[var(--text-secondary)]">
                      {log.clock_out}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-[var(--text-secondary)]">
                      {log.raw_duration}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-right text-[var(--text-primary)]">
                      {log.effective_hours > 0 ? `${log.effective_hours}h` : "-"}
                    </td>
                    <td className="py-2.5 px-4">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {log.is_late ? (
                          <span className="badge-rose px-2 py-0.5 rounded font-mono text-[11px]">
                            TELAT (+{log.late_minutes}m)
                          </span>
                        ) : log.anomaly_type === "closing_tap" ? (
                          <span className="badge-amber px-2 py-0.5 rounded font-mono text-[11px]">
                            Closing Tap ({log.raw_duration})
                          </span>
                        ) : (
                          <span className="badge-emerald px-2 py-0.5 rounded font-mono text-[11px]">
                            On Time (-{log.early_minutes}m)
                          </span>
                        )}

                        {log.anomaly_type === "overnight_rollover" && (
                          <span className="badge-purple px-2 py-0.5 rounded font-mono text-[11px]">
                            Overnight Rollover (&gt;18h capped)
                          </span>
                        )}
                        {log.anomaly_type === "short_shift" && (
                          <span className="badge-blue px-2 py-0.5 rounded font-mono text-[11px]">
                            Short / Half Shift
                          </span>
                        )}
                        {log.anomaly_type === "missing_clock_out" && (
                          <span className="badge-neutral px-2 py-0.5 rounded font-mono text-[11px]">
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
      </div>
    </main>
  );
}
