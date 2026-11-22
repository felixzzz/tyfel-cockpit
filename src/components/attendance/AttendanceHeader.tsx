"use client";

import React, { useRef } from "react";
import type { AttendanceCycleReport, PayrollCycleOption } from "@/lib/attendance";
import {
  Users,
  UploadCloud,
  Download,
  Calendar,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Clock,
  Lock,
} from "lucide-react";

export interface AttendanceHeaderProps {
  report: AttendanceCycleReport | null;
  selectedYear: number;
  onSelectYear: (year: number) => void;
  selectedPeriod: string;
  onSelectPeriod: (periodKey: string) => void;
  prevCycle: PayrollCycleOption | null;
  nextCycle: PayrollCycleOption | null;
  monthsForYear: PayrollCycleOption[];
  onUploadCsv: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isUploadingCsv: boolean;
  uploadNotice: string | null;
  onDismissUploadNotice: () => void;
  saveBanner: string | null;
  onExportCsv: () => void;
}

export function AttendanceHeader({
  report,
  selectedYear,
  onSelectYear,
  onSelectPeriod,
  prevCycle,
  nextCycle,
  monthsForYear,
  onUploadCsv,
  isUploadingCsv,
  uploadNotice,
  onDismissUploadNotice,
  saveBanner,
  onExportCsv,
}: AttendanceHeaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="space-y-5">
      {/* Top Header: Title & Action Buttons */}
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 pb-5 border-b border-[var(--border-subtle)]">
        <div>
          <div className="flex items-center gap-3.5">
            <div className="p-2.5 rounded-2xl bg-[#5c7c5c]/20 border border-[#5c7c5c]/40 text-[#5c7c5c] dark:text-[#e9e5c9]">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-[var(--text-primary)]">
                  Tyfel Coffee · Staff Attendance &amp; Payslips
                </h1>
                <span className="badge-emerald text-[10px] font-mono uppercase tracking-widest px-2.5 py-0.5 rounded-full font-semibold">
                  Payroll Studio
                </span>
              </div>
              <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-0.5">
                Monthly payroll periods (16th–15th), per-period employee overrides, payment disbursement status &amp; attendance verification
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.xlsx,.xls"
            onChange={onUploadCsv}
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
              : "Upload Laporan Absensi (CSV / XLSX)"}
          </button>

          <button
            type="button"
            onClick={onExportCsv}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-mono surface-well hover:bg-[var(--bg-surface-3)] text-[var(--text-primary)] transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            Export Payroll CSV
          </button>
        </div>
      </header>

      {/* Upload Notification */}
      {uploadNotice && (
        <div className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-200 text-xs">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>{uploadNotice}</span>
          </div>
          <button
            onClick={onDismissUploadNotice}
            className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-xs font-mono cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Save Banner */}
      {saveBanner && (
        <div className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-200 text-xs">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>{saveBanner}</span>
          </div>
        </div>
      )}

      {/* Payroll Period Selector: Ordered by Year & Month */}
      <section className="cockpit-panel rounded-2xl p-4 sm:p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-[var(--text-primary)]">
              <Calendar className="w-4 h-4 text-[var(--accent-primary)]" />
              <span className="font-semibold">Payroll Period (Year &amp; Month)</span>
            </div>

            {/* Year Selector Tabs */}
            <div className="inline-flex items-center surface-well p-1 rounded-xl">
              {(report?.available_years || [2025, 2026]).map((yr) => (
                <button
                  key={yr}
                  type="button"
                  onClick={() => onSelectYear(yr)}
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
                  onSelectYear(prevCycle.year);
                  onSelectPeriod(prevCycle.period_key);
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
                  onSelectYear(nextCycle.year);
                  onSelectPeriod(nextCycle.period_key);
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

        {/* Chronological 12-Month Grid */}
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
                    onSelectPeriod(cyc.period_key);
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
                        {cyc.log_count > 0 ? `${cyc.log_count} logs` : "0 logs"}
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
    </div>
  );
}
