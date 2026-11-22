"use client";

import React from "react";
import type { AttendanceCycleReport, EmployeePayslipSummary } from "@/lib/attendance";
import { formatAccountingRp } from "./PayslipCard";
import { CheckCircle2, Clock, RotateCcw } from "lucide-react";

export interface AttendanceMatrixTableProps {
  report: AttendanceCycleReport;
  activeSlip: EmployeePayslipSummary | undefined;
  matrixPaymentFilter: "all" | "paid" | "unpaid";
  setMatrixPaymentFilter: (val: "all" | "paid" | "unpaid") => void;
  togglingPaymentKey: string | null;
  onSelectEmployee: (empName: string) => void;
  onToggleEmployeePayment: (
    empName: string,
    fullName: string,
    currentIsPaid: boolean,
    e?: React.MouseEvent
  ) => void;
  onSetPeriodAllPayment: (paid: boolean) => void;
}

export function AttendanceMatrixTable({
  report,
  activeSlip,
  matrixPaymentFilter,
  setMatrixPaymentFilter,
  togglingPaymentKey,
  onSelectEmployee,
  onToggleEmployeePayment,
  onSetPeriodAllPayment,
}: AttendanceMatrixTableProps) {
  return (
    <section className="cockpit-panel rounded-2xl overflow-hidden">
      <div className="p-5 border-b border-[var(--border-subtle)] flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-[var(--text-primary)]">
            Outlet Payroll &amp; Attendance Matrix · {report.cycle_label}
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
              onClick={() => onSetPeriodAllPayment(true)}
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
              onClick={() => onSetPeriodAllPayment(false)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono surface-well hover:bg-[var(--bg-surface-3)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer transition-all disabled:opacity-50"
              title={`Reset all staff salaries in ${report.salary_code} back to Not Yet Paid`}
            >
              <RotateCcw className="w-3.5 h-3.5" />
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
              <th className="py-3 px-3">Role &amp; Cutoff</th>
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
            {report.payslips.length === 0 ? (
              <tr>
                <td
                  colSpan={13}
                  className="py-8 text-center text-xs text-[var(--text-secondary)]"
                >
                  Tidak ada karyawan yang memiliki absensi pada periode ini.
                </td>
              </tr>
            ) : (
              report.payslips
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
                      onClick={() => onSelectEmployee(p.employee.employee_name)}
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
                          ID: {p.employee.employee_name} · {p.employee.join_date_label}
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
                            {p.closing_taps_count > 0 ? `${p.closing_taps_count} tap ` : ""}
                            {p.overnight_rollovers_count > 0
                              ? `${p.overnight_rollovers_count} >20h`
                              : ""}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-3 text-right font-mono text-[var(--text-primary)]">
                        <div className="font-bold">{p.daily_qty}</div>
                        {p.half_day_qty > 0 && (
                          <div className="text-[10px] text-blue-600 dark:text-blue-400 font-medium">
                            +{p.half_day_qty} stg
                          </div>
                        )}
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
                        <div>{formatAccountingRp(p.daily_total)}</div>
                        {p.half_day_total > 0 && (
                          <div className="text-[10px] text-blue-600 dark:text-blue-400">
                            +{formatAccountingRp(p.half_day_total)} (stg)
                          </div>
                        )}
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
                              onToggleEmployeePayment(
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
                })
            )}
          </tbody>
          <tfoot>
            <tr className="bg-[var(--bg-surface-2)] font-mono font-bold text-[var(--text-primary)] border-t border-[var(--border-default)]">
              <td colSpan={3} className="py-3.5 px-4 text-left uppercase">
                Total Cycle Liability ({report.salary_code})
              </td>
              <td className="py-3.5 px-3 text-right">
                <div>{report.overall.total_work_days_paid}</div>
                {report.overall.total_half_days_paid > 0 && (
                  <div className="text-[10px] text-blue-600 dark:text-blue-400 font-normal">
                    +{report.overall.total_half_days_paid} stg
                  </div>
                )}
              </td>
              <td className="py-3.5 px-3 text-right text-rose-600 dark:text-rose-300">
                {report.overall.total_late_incidents}
              </td>
              <td colSpan={4} className="py-3.5 px-3 text-right text-[var(--text-secondary)]">
                Bonuses: {formatAccountingRp(report.overall.total_bonuses_paid)}
              </td>
              <td className="py-3.5 px-3 text-right">
                {formatAccountingRp(report.overall.total_gross_payroll)}
              </td>
              <td className="py-3.5 px-3 text-right text-amber-600 dark:text-amber-300">
                -{formatAccountingRp(report.overall.total_kasbon_deducted)}
              </td>
              <td className="py-3.5 px-3 text-right text-emerald-600 dark:text-emerald-400 text-sm">
                {formatAccountingRp(report.overall.total_net_take_home)}
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
  );
}
