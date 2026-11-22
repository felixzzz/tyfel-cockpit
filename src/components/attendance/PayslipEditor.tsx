"use client";

import React from "react";
import type { AttendanceCycleReport, EmployeePayslipSummary } from "@/lib/attendance";
import { formatAccountingRp } from "./PayslipCard";
import {
  Sliders,
  Sparkles,
  Award,
  Clock,
  CheckCircle2,
  RotateCcw,
  Save,
} from "lucide-react";

export interface PayslipEditorProps {
  report: AttendanceCycleReport;
  activeSlip: EmployeePayslipSummary;
  isEditingSlip: boolean;
  setIsEditingSlip: (val: boolean) => void;
  savingSlip: boolean;
  onSavePayslip: (e: React.FormEvent) => void;
  onResetPeriodOverride: () => void;
  editFullName: string;
  setEditFullName: (v: string) => void;
  editRole: string;
  setEditRole: (v: string) => void;
  editJoinDate: string;
  setEditJoinDate: (v: string) => void;
  editShiftCutoff: string;
  setEditShiftCutoff: (v: string) => void;
  editBasicSalary: number;
  setEditBasicSalary: (v: number) => void;
  editDailyRate: number;
  setEditDailyRate: (v: number) => void;
  editHalfDayRate: number;
  setEditHalfDayRate: (v: number) => void;
  editLatePenalty: number;
  setEditLatePenalty: (v: number) => void;
  editNoLateBonus: number;
  setEditNoLateBonus: (v: number) => void;
  editDailyOverride: string;
  setEditDailyOverride: (v: string) => void;
  editHalfDayOverride: string;
  setEditHalfDayOverride: (v: string) => void;
  editLateOverride: string;
  setEditLateOverride: (v: string) => void;
  editBonusQtyOverride: string;
  setEditBonusQtyOverride: (v: string) => void;
  editCustomDesc: string;
  setEditCustomDesc: (v: string) => void;
  editCustomQty: number;
  setEditCustomQty: (v: number) => void;
  editCustomUnit: number;
  setEditCustomUnit: (v: number) => void;
  editKasbonQty: number;
  setEditKasbonQty: (v: number) => void;
  editKasbonUnit: number;
  setEditKasbonUnit: (v: number) => void;
  editNotes: string;
  setEditNotes: (v: string) => void;
  editIsPaid: boolean;
  setEditIsPaid: (v: boolean) => void;
  alsoUpdateMasterDefaults: boolean;
  setAlsoUpdateMasterDefaults: (v: boolean) => void;
}

export function PayslipEditor({
  report,
  activeSlip,
  isEditingSlip,
  setIsEditingSlip,
  savingSlip,
  onSavePayslip,
  onResetPeriodOverride,
  editFullName,
  setEditFullName,
  editRole,
  setEditRole,
  editJoinDate,
  setEditJoinDate,
  editShiftCutoff,
  setEditShiftCutoff,
  editBasicSalary,
  setEditBasicSalary,
  editDailyRate,
  setEditDailyRate,
  editHalfDayRate,
  setEditHalfDayRate,
  editLatePenalty,
  setEditLatePenalty,
  editNoLateBonus,
  setEditNoLateBonus,
  editDailyOverride,
  setEditDailyOverride,
  editHalfDayOverride,
  setEditHalfDayOverride,
  editLateOverride,
  setEditLateOverride,
  editBonusQtyOverride,
  setEditBonusQtyOverride,
  editCustomDesc,
  setEditCustomDesc,
  editCustomQty,
  setEditCustomQty,
  editCustomUnit,
  setEditCustomUnit,
  editKasbonQty,
  setEditKasbonQty,
  editKasbonUnit,
  setEditKasbonUnit,
  editNotes,
  setEditNotes,
  editIsPaid,
  setEditIsPaid,
  alsoUpdateMasterDefaults,
  setAlsoUpdateMasterDefaults,
}: PayslipEditorProps) {
  return isEditingSlip && report.is_editable ? (
    <form
      onSubmit={onSavePayslip}
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
          <label className="block text-[var(--text-secondary)] mb-1">Role / Division</label>
          <input
            type="text"
            value={editRole}
            onChange={(e) => setEditRole(e.target.value)}
            className="w-full surface-well rounded-lg px-2.5 py-1.5 text-[var(--text-primary)]"
          />
        </div>
        <div>
          <label className="block text-[var(--text-secondary)] mb-1">Join Date Label</label>
          <input
            type="text"
            value={editJoinDate}
            onChange={(e) => setEditJoinDate(e.target.value)}
            className="w-full surface-well rounded-lg px-2.5 py-1.5 text-[var(--text-primary)]"
          />
        </div>
        <div>
          <label className="block text-[var(--text-secondary)] mb-1">Period Shift Cutoff (HH:MM)</label>
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
            onChange={(e) => setEditBasicSalary(Number(e.target.value))}
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
        {activeSlip.has_half_day && (
          <div>
            <label className="block text-[var(--text-secondary)] mb-1">
              Rate Setengah Hari ({report.salary_code})
            </label>
            <input
              type="number"
              value={editHalfDayRate}
              onChange={(e) => setEditHalfDayRate(Number(e.target.value))}
              className="w-full surface-well rounded-lg px-2.5 py-1.5 text-[var(--text-primary)] font-mono"
            />
          </div>
        )}
        <div>
          <label className="block text-[var(--text-secondary)] mb-1">
            Telat Penalty ({report.salary_code})
          </label>
          <input
            type="number"
            value={editLatePenalty}
            onChange={(e) => setEditLatePenalty(Number(e.target.value))}
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
            onChange={(e) => setEditNoLateBonus(Number(e.target.value))}
            className="w-full surface-well rounded-lg px-2.5 py-1.5 text-[var(--text-primary)] font-mono"
          />
        </div>
      </div>

      {/* Period Count Overrides */}
      <div
        className={`grid ${
          activeSlip.has_half_day ? "grid-cols-2 sm:grid-cols-4" : "grid-cols-3"
        } gap-2.5 text-xs pt-2 border-t border-[var(--border-subtle)]`}
      >
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
        {activeSlip.has_half_day && (
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[var(--text-secondary)]">Setengah Hari (#)</label>
              <button
                type="button"
                onClick={() => setEditHalfDayOverride("")}
                className="text-[10px] text-emerald-600 dark:text-emerald-400 hover:underline font-mono cursor-pointer"
              >
                Auto ({activeSlip.computed_half_day_count})
              </button>
            </div>
            <input
              type="number"
              placeholder={`Auto: ${activeSlip.computed_half_day_count}`}
              value={editHalfDayOverride}
              onChange={(e) => setEditHalfDayOverride(e.target.value)}
              className="w-full surface-well rounded-lg px-2.5 py-1.5 text-[var(--text-primary)] font-mono"
            />
          </div>
        )}
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
          <label className="block text-[var(--text-secondary)] mb-1">Extra Line Label</label>
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
          <label className="block text-[var(--text-secondary)] mb-1">Extra Value (Rp)</label>
          <input
            type="number"
            value={editCustomUnit}
            onChange={(e) => setEditCustomUnit(Number(e.target.value))}
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
          <label className="block text-[var(--text-secondary)] mb-1">Kasbon Amount (Rp)</label>
          <input
            type="number"
            value={editKasbonUnit}
            onChange={(e) => setEditKasbonUnit(Number(e.target.value))}
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
          onChange={(e) => setAlsoUpdateMasterDefaults(e.target.checked)}
          className="rounded border-[var(--border-strong)]"
        />
        <span>Also update default base salary / daily rate for un-overridden periods</span>
      </label>

      <div className="flex items-center justify-between gap-2 pt-3 border-t border-[var(--border-subtle)]">
        {activeSlip.has_period_override ? (
          <button
            type="button"
            disabled={savingSlip}
            onClick={onResetPeriodOverride}
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
          {savingSlip ? "Saving..." : `Save for ${report.salary_code}`}
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
            {activeSlip.raw_logs_count} clock-in records in {report.start_date} – {report.end_date}
          </p>
        </div>
        <span className="text-xs font-mono px-2.5 py-1 rounded-lg surface-well text-[var(--text-primary)]">
          Cutoff {activeSlip.effective_shift_start}
        </span>
      </div>

      {/* Shift Breakdown Mini Grid */}
      <div
        className={`grid ${
          activeSlip.has_half_day ? "grid-cols-2 sm:grid-cols-4" : "grid-cols-3"
        } gap-2.5 text-center`}
      >
        <div className="p-3 rounded-xl surface-well">
          <div className="text-lg font-bold font-mono text-[var(--text-primary)]">
            {activeSlip.daily_qty}
          </div>
          <div className="text-[11px] text-[var(--text-secondary)]">Full Shifts</div>
        </div>
        {activeSlip.has_half_day && (
          <div className="p-3 rounded-xl surface-well">
            <div className="text-lg font-bold font-mono text-blue-600 dark:text-blue-400">
              {activeSlip.half_day_qty}
            </div>
            <div className="text-[11px] text-[var(--text-secondary)]">Setengah Hari</div>
          </div>
        )}
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
          <div className="text-[11px] text-[var(--text-secondary)]">Avg Shift / Day</div>
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
                Bonus Tidak Telat ({formatAccountingRp(activeSlip.effective_no_late_bonus)})
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
            Shift Anomalies &amp; Notes ({activeSlip.anomaly_logs.length})
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
  );
}
