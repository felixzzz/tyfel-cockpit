"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  CheckCircle2,
  Clock,
  Printer,
  Moon,
  Sun,
  Maximize2,
  Minimize2,
} from "lucide-react";
import type {
  AttendanceCycleReport,
  EmployeePayslipSummary,
  AttendanceRecord,
  PayrollCycleOption,
} from "@/lib/attendance";

import { AttendanceHeader } from "@/components/attendance/AttendanceHeader";
import { AttendanceKpiCards } from "@/components/attendance/AttendanceKpiCards";
import { PayslipCard } from "@/components/attendance/PayslipCard";
import { PayslipEditor } from "@/components/attendance/PayslipEditor";
import { AttendanceMatrixTable } from "@/components/attendance/AttendanceMatrixTable";
import { AttendanceLogsTable } from "@/components/attendance/AttendanceLogsTable";
import { PrintablePayslipModal } from "@/components/attendance/PrintablePayslipModal";

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
  const [isPrintModalOpen, setIsPrintModalOpen] = useState<boolean>(false);
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
  const [editHalfDayRate, setEditHalfDayRate] = useState<number>(42500);
  const [editLatePenalty, setEditLatePenalty] = useState<number>(20000);
  const [editNoLateBonus, setEditNoLateBonus] = useState<number>(85000);
  const [editDailyOverride, setEditDailyOverride] = useState<string>("");
  const [editHalfDayOverride, setEditHalfDayOverride] = useState<string>("");
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
    setEditHalfDayRate(activeSlip.effective_half_day_rate);
    setEditLatePenalty(activeSlip.effective_late_penalty_rate);
    setEditNoLateBonus(activeSlip.effective_no_late_bonus);
    setEditDailyOverride(
      activeSlip.daily_is_overridden ? String(activeSlip.daily_qty) : ""
    );
    setEditHalfDayOverride(
      activeSlip.half_day_is_overridden ? String(activeSlip.half_day_qty) : ""
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
          half_day_rate_override: Number(editHalfDayRate),
          late_penalty_override: Number(editLatePenalty),
          no_late_bonus_override: Number(editNoLateBonus),
          daily_count_override:
            editDailyOverride.trim() === "" ? null : Number(editDailyOverride),
          half_day_count_override:
            editHalfDayOverride.trim() === ""
              ? null
              : Number(editHalfDayOverride),
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
      } else if (data.errors?.[0]?.error) {
        setUploadNotice(`Error: ${data.errors[0].error}`);
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
      "Paid Setengah Hari (#)",
      "Setengah Hari Rate",
      "Setengah Hari Total",
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
      `"${report.start_date} to ${report.end_date}"`,
      report.salary_code,
      p.employee.employee_name,
      `"${p.employee.full_name}"`,
      `"${p.employee.role}"`,
      `"${p.employee.join_date_label}"`,
      p.effective_shift_start,
      p.raw_logs_count,
      p.daily_qty,
      p.effective_daily_rate,
      p.daily_total,
      p.half_day_qty,
      p.effective_half_day_rate,
      p.half_day_total,
      p.effective_basic_salary,
      p.late_qty,
      p.effective_late_penalty_rate,
      p.late_total,
      p.bonus_tidak_telat_qty,
      p.bonus_tidak_telat_total,
      p.custom_total,
      p.grand_total,
      p.kasbon_total,
      p.net_take_home_pay,
      p.is_paid ? "PAID" : "UNPAID",
      p.paid_at || "",
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `Tyfel_Payroll_${report.salary_code}_${report.period_key}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // Find Selectable cycles for navigation
  const selectableCycles = (report?.available_cycles || []).filter(
    (c) => c.is_selectable
  );
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
      {report && activeSlip && (
        <div className="hidden print-only-slip">
          <PayslipCard
            report={report}
            activeSlip={activeSlip}
            theme="light"
          />
        </div>
      )}

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
                        ({p.daily_qty}d{p.half_day_qty > 0 ? ` + ${p.half_day_qty}h` : ""})
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
                  onClick={() => setIsPrintModalOpen(true)}
                  className="px-3 py-1.5 rounded-lg badge-emerald text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Official Payslip PDF</span>
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
            <PayslipCard
              report={report}
              activeSlip={activeSlip}
              amplified={true}
              theme={slipTheme}
            />
          </div>
        </div>
      )}

      {/* Official Printable Payslip Modal (A4 Print Ready with Terbilang & Signatures) */}
      {report && (
        <PrintablePayslipModal
          isOpen={isPrintModalOpen}
          onClose={() => setIsPrintModalOpen(false)}
          report={report}
          initialEmployeeName={activeSlip?.employee.employee_name}
        />
      )}

      <div className="no-print space-y-6">
        {/* Header & Controls */}
        <AttendanceHeader
          report={report}
          selectedYear={selectedYear}
          onSelectYear={setSelectedYear}
          selectedPeriod={selectedPeriod}
          onSelectPeriod={setSelectedPeriod}
          prevCycle={prevCycle}
          nextCycle={nextCycle}
          monthsForYear={monthsForYear}
          onUploadCsv={handleUploadAttendanceCsv}
          isUploadingCsv={isUploadingCsv}
          uploadNotice={uploadNotice}
          onDismissUploadNotice={() => setUploadNotice(null)}
          saveBanner={saveBanner}
          onExportCsv={handleExportPayrollCsv}
        />

        {/* Loading state indicator */}
        {loading && !report && (
          <div className="cockpit-panel rounded-2xl p-8 text-center text-xs font-mono text-[var(--text-secondary)] animate-pulse">
            Loading Payroll &amp; Attendance Telemetry from Database...
          </div>
        )}

        {/* KPI Summary Cards */}
        {report && <AttendanceKpiCards report={report} />}

        {/* Interactive Tyfel Coffee Payslip Studio */}
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
                          ({p.daily_qty}d{p.half_day_qty > 0 ? ` + ${p.half_day_qty}h` : ""})
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

                  {/* Print Official Payslip Trigger */}
                  <button
                    type="button"
                    onClick={() => setIsPrintModalOpen(true)}
                    className="p-1.5 rounded-lg surface-well hover:bg-[var(--bg-surface-3)] text-[var(--text-primary)] transition-colors cursor-pointer"
                    title="Open Official Printable Payslip (PDF / Print Preview)"
                  >
                    <Printer className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  </button>

                  {/* Full-Screen Zoom Button */}
                  <button
                    type="button"
                    onClick={() => setIsFullScreenSlip(true)}
                    className="p-1.5 rounded-lg surface-well hover:bg-[var(--bg-surface-3)] text-[var(--text-primary)] transition-colors cursor-pointer"
                    title="Expand Full Screen Payslip (Focus View)"
                  >
                    <Maximize2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Payslip Card Render */}
              <PayslipCard
                report={report}
                activeSlip={activeSlip}
                amplified={false}
                theme={slipTheme}
              />
            </div>

            {/* Right 5 Columns: Breakdown & Override Editor */}
            <div className="xl:col-span-5 space-y-4">
              <PayslipEditor
                report={report}
                activeSlip={activeSlip}
                isEditingSlip={isEditingSlip}
                setIsEditingSlip={setIsEditingSlip}
                savingSlip={savingSlip}
                onSavePayslip={handleSavePayslip}
                onResetPeriodOverride={handleResetPeriodOverride}
                editFullName={editFullName}
                setEditFullName={setEditFullName}
                editRole={editRole}
                setEditRole={setEditRole}
                editJoinDate={editJoinDate}
                setEditJoinDate={setEditJoinDate}
                editShiftCutoff={editShiftCutoff}
                setEditShiftCutoff={setEditShiftCutoff}
                editBasicSalary={editBasicSalary}
                setEditBasicSalary={setEditBasicSalary}
                editDailyRate={editDailyRate}
                setEditDailyRate={setEditDailyRate}
                editHalfDayRate={editHalfDayRate}
                setEditHalfDayRate={setEditHalfDayRate}
                editLatePenalty={editLatePenalty}
                setEditLatePenalty={setEditLatePenalty}
                editNoLateBonus={editNoLateBonus}
                setEditNoLateBonus={setEditNoLateBonus}
                editDailyOverride={editDailyOverride}
                setEditDailyOverride={setEditDailyOverride}
                editHalfDayOverride={editHalfDayOverride}
                setEditHalfDayOverride={setEditHalfDayOverride}
                editLateOverride={editLateOverride}
                setEditLateOverride={setEditLateOverride}
                editBonusQtyOverride={editBonusQtyOverride}
                setEditBonusQtyOverride={setEditBonusQtyOverride}
                editCustomDesc={editCustomDesc}
                setEditCustomDesc={setEditCustomDesc}
                editCustomQty={editCustomQty}
                setEditCustomQty={setEditCustomQty}
                editCustomUnit={editCustomUnit}
                setEditCustomUnit={setEditCustomUnit}
                editKasbonQty={editKasbonQty}
                setEditKasbonQty={setEditKasbonQty}
                editKasbonUnit={editKasbonUnit}
                setEditKasbonUnit={setEditKasbonUnit}
                editNotes={editNotes}
                setEditNotes={setEditNotes}
                editIsPaid={editIsPaid}
                setEditIsPaid={setEditIsPaid}
                alsoUpdateMasterDefaults={alsoUpdateMasterDefaults}
                setAlsoUpdateMasterDefaults={setAlsoUpdateMasterDefaults}
              />
            </div>
          </section>
        )}

        {/* Matrix Table */}
        {report && (
          <AttendanceMatrixTable
            report={report}
            activeSlip={activeSlip}
            matrixPaymentFilter={matrixPaymentFilter}
            setMatrixPaymentFilter={setMatrixPaymentFilter}
            togglingPaymentKey={togglingPaymentKey}
            onSelectEmployee={setSelectedEmpName}
            onToggleEmployeePayment={handleToggleEmployeePayment}
            onSetPeriodAllPayment={handleSetPeriodAllPayment}
          />
        )}

        {/* Detailed Logs Table */}
        {report && (
          <AttendanceLogsTable
            report={report}
            filteredLogs={filteredLogs}
            logEmpFilter={logEmpFilter}
            setLogEmpFilter={setLogEmpFilter}
            logStatusFilter={logStatusFilter}
            setLogStatusFilter={setLogStatusFilter}
            logSearch={logSearch}
            setLogSearch={setLogSearch}
          />
        )}
      </div>
    </main>
  );
}
