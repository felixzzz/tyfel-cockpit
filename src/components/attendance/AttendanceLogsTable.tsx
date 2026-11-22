"use client";

import React from "react";
import type { AttendanceCycleReport, AttendanceRecord } from "@/lib/attendance";
import { Search } from "lucide-react";

export interface AttendanceLogsTableProps {
  report: AttendanceCycleReport;
  filteredLogs: AttendanceRecord[];
  logEmpFilter: string;
  setLogEmpFilter: (val: string) => void;
  logStatusFilter: "all" | "late" | "anomaly" | "ontime";
  setLogStatusFilter: (val: "all" | "late" | "anomaly" | "ontime") => void;
  logSearch: string;
  setLogSearch: (val: string) => void;
}

export function AttendanceLogsTable({
  report,
  filteredLogs,
  logEmpFilter,
  setLogEmpFilter,
  logStatusFilter,
  setLogStatusFilter,
  logSearch,
  setLogSearch,
}: AttendanceLogsTableProps) {
  return (
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
              <th className="py-3 px-4">Punctuality &amp; Audit Status</th>
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
                        Setengah Hari ({log.raw_duration})
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
  );
}
