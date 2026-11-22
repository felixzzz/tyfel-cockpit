"use client";

import React from "react";
import type { AttendanceCycleReport, EmployeePayslipSummary } from "@/lib/attendance";
import { CheckCircle2, Clock, FileSpreadsheet } from "lucide-react";

export interface PayslipCardProps {
  report: AttendanceCycleReport;
  activeSlip: EmployeePayslipSummary;
  amplified?: boolean;
  theme?: "light" | "dark";
}

export function formatAccountingRp(amount: number, showSymbol = true): string {
  const isNegative = amount < 0;
  const absFormatted = Math.abs(Math.round(amount)).toLocaleString("id-ID");
  if (amount === 0) {
    return showSymbol ? "Rp 0" : "0";
  }
  if (isNegative) {
    return showSymbol ? `(Rp ${absFormatted})` : `(${absFormatted})`;
  }
  return showSymbol ? `Rp ${absFormatted}` : absFormatted;
}

export function PayslipCard({
  report,
  activeSlip,
  amplified = false,
  theme = "light",
}: PayslipCardProps) {
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
              <div className="px-3.5 py-2 text-xs opacity-80">
                {activeSlip.employee.outlet}
              </div>
              <div className="px-3.5 py-2 text-xs">
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

                  {/* Row 2.5: Setengah hari (Budi / half-day staff) */}
                  {(activeSlip.has_half_day || activeSlip.half_day_qty > 0) && (
                    <tr>
                      <td className="py-2.5 px-3.5 font-medium border-r border-current/10">
                        Setengah hari
                      </td>
                      <td className="py-2.5 px-2.5 text-right font-mono border-r border-current/10">
                        {activeSlip.half_day_qty}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono border-r border-current/10">
                        {formatAccountingRp(activeSlip.half_day_unit, false)}
                      </td>
                      <td className="py-2.5 px-3.5 text-right font-mono font-medium">
                        {formatAccountingRp(activeSlip.half_day_total)}
                      </td>
                    </tr>
                  )}

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
                      {formatAccountingRp(activeSlip.bonus_tidak_telat_unit, false)}
                    </td>
                    <td className="py-2.5 px-3.5 text-right font-mono font-medium">
                      {formatAccountingRp(activeSlip.bonus_tidak_telat_total)}
                    </td>
                  </tr>

                  {/* Row 5: Custom / Extra Line */}
                  <tr>
                    <td className="py-2.5 px-3.5 font-medium border-r border-current/10 min-h-[36px]">
                      {activeSlip.custom_desc || "\u00A0"}
                    </td>
                    <td className="py-2.5 px-2.5 text-right font-mono border-r border-current/10">
                      {activeSlip.custom_qty > 0 ? activeSlip.custom_qty : ""}
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
                      {activeSlip.kasbon_qty > 0 ? activeSlip.kasbon_qty : ""}
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
                      {formatAccountingRp(activeSlip.net_take_home_pay, false)}
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
}
