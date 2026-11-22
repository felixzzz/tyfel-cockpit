"use client";

import React from "react";
import type { AttendanceCycleReport } from "@/lib/attendance";
import { formatAccountingRp } from "./PayslipCard";
import {
  Wallet,
  CalendarRange,
  Clock,
  TrendingDown,
} from "lucide-react";

export interface AttendanceKpiCardsProps {
  report: AttendanceCycleReport;
}

export function AttendanceKpiCards({ report }: AttendanceKpiCardsProps) {
  return (
    <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* KPI 1: Total Net Payroll Spend */}
      <div className="cockpit-panel rounded-2xl p-4 sm:p-5 flex flex-col justify-between space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-mono uppercase tracking-wider text-[var(--text-muted)] font-semibold">
            Total Net Payroll ({report.salary_code})
          </span>
          <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <Wallet className="w-4 h-4" />
          </div>
        </div>
        <div>
          <div className="text-2xl sm:text-3xl font-bold font-mono text-[var(--text-primary)]">
            {formatAccountingRp(report.overall.total_net_take_home)}
          </div>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            Gaji Bersih Diterima untuk {report.overall.active_employees} Kru Aktif
          </p>
        </div>
        <div className="pt-2 border-t border-[var(--border-subtle)] text-[11px] font-mono text-[var(--text-muted)] flex justify-between">
          <span>Gross: {formatAccountingRp(report.overall.total_gross_payroll)}</span>
          <span className="text-amber-600 dark:text-amber-300">
            Kasbon: -{formatAccountingRp(report.overall.total_kasbon_deducted)}
          </span>
        </div>
      </div>

      {/* KPI 2: Total Shift Shifts Recorded */}
      <div className="cockpit-panel rounded-2xl p-4 sm:p-5 flex flex-col justify-between space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-mono uppercase tracking-wider text-[var(--text-muted)] font-semibold">
            Shift Hadir Normal &amp; Setengah Hari
          </span>
          <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
            <CalendarRange className="w-4 h-4" />
          </div>
        </div>
        <div>
          <div className="text-2xl sm:text-3xl font-bold font-mono text-[var(--text-primary)]">
            {report.overall.total_work_days_paid}{" "}
            <span className="text-sm font-normal text-[var(--text-secondary)]">
              + {report.overall.total_half_days_paid || 0} ½ Hari
            </span>
          </div>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            Total {report.overall.total_attendance_logs} tap fingerprint presensi tercatat
          </p>
        </div>
        <div className="pt-2 border-t border-[var(--border-subtle)] text-[11px] font-mono text-[var(--text-muted)] flex justify-between">
          <span>Avg {report.overall.avg_daily_shift_hours}h / shift</span>
          <span className="text-sky-600 dark:text-sky-400">
            {report.overall.total_half_days_paid} ½ Shift
          </span>
        </div>
      </div>

      {/* KPI 3: Total Kasbon Recovered */}
      <div className="cockpit-panel rounded-2xl p-4 sm:p-5 flex flex-col justify-between space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-mono uppercase tracking-wider text-[var(--text-muted)] font-semibold">
            Cicilan Kasbon Ditarik
          </span>
          <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
            <TrendingDown className="w-4 h-4" />
          </div>
        </div>
        <div>
          <div className="text-2xl sm:text-3xl font-bold font-mono text-amber-600 dark:text-amber-400">
            {formatAccountingRp(Math.abs(report.overall.total_kasbon_deducted))}
          </div>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            Total pemotongan uang muka (salary advance) pada siklus ini
          </p>
        </div>
        <div className="pt-2 border-t border-[var(--border-subtle)] text-[11px] font-mono text-[var(--text-muted)] flex justify-between">
          <span>{report.overall.active_employees} Kru Terlibat</span>
          <span>Auto-deduct dari Net Pay</span>
        </div>
      </div>

      {/* KPI 4: Lateness & Penalties */}
      <div className="cockpit-panel rounded-2xl p-4 sm:p-5 flex flex-col justify-between space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-mono uppercase tracking-wider text-[var(--text-muted)] font-semibold">
            Keterlambatan &amp; Anomali Tap
          </span>
          <div className="p-2 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400">
            <Clock className="w-4 h-4" />
          </div>
        </div>
        <div>
          <div className="text-2xl sm:text-3xl font-bold font-mono text-rose-600 dark:text-rose-400">
            {report.overall.total_late_incidents}x{" "}
            <span className="text-sm font-normal text-[var(--text-secondary)]">
              Terlambat
            </span>
          </div>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            Total denda: -{formatAccountingRp(Math.abs(report.overall.total_late_penalties))} · {report.overall.overall_punctuality_pct}% On-Time
          </p>
        </div>
        <div className="pt-2 border-t border-[var(--border-subtle)] text-[11px] font-mono text-[var(--text-muted)] flex justify-between">
          <span className="text-emerald-600 dark:text-emerald-400">
            {report.overall.zero_late_achievers} Bonus 0-Telat
          </span>
          <span title="Anomali Tap">
            {report.overall.total_closing_taps + report.overall.total_overnight_rollovers} Flagged
          </span>
        </div>
      </div>
    </section>
  );
}
