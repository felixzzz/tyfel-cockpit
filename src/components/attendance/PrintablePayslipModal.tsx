"use client";

import React, { useState } from "react";
import type { AttendanceCycleReport } from "@/lib/attendance";
import { formatAccountingRp } from "./PayslipCard";
import {
  Printer,
  X,
  FileSpreadsheet,
  Users,
} from "lucide-react";

export interface PrintablePayslipModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: AttendanceCycleReport;
  initialEmployeeName?: string;
}

// Indonesian Terbilang function for legal financial slips
export function terbilang(n: number): string {
  const bilangan = Math.abs(Math.round(n));
  const huruf = [
    "",
    "Satu",
    "Dua",
    "Tiga",
    "Empat",
    "Lima",
    "Enam",
    "Tujuh",
    "Delapan",
    "Sembilan",
    "Sepuluh",
    "Sebelas",
  ];

  function toWords(num: number): string {
    if (num < 12) return huruf[num];
    if (num < 20) return `${huruf[num - 10]} Belas`;
    if (num < 100)
      return `${huruf[Math.floor(num / 10)]} Puluh ${toWords(num % 10)}`.trim();
    if (num < 200) return `Seratus ${toWords(num - 100)}`.trim();
    if (num < 1000)
      return `${huruf[Math.floor(num / 100)]} Ratus ${toWords(num % 100)}`.trim();
    if (num < 2000) return `Seribu ${toWords(num - 1000)}`.trim();
    if (num < 1000000)
      return `${toWords(Math.floor(num / 1000))} Ribu ${toWords(num % 1000)}`.trim();
    if (num < 1000000000)
      return `${toWords(Math.floor(num / 1000000))} Juta ${toWords(num % 1000000)}`.trim();
    return `${toWords(Math.floor(num / 1000000000))} Miliar ${toWords(num % 1000000000)}`.trim();
  }

  if (bilangan === 0) return "Nol Rupiah";
  const result = `${toWords(bilangan)} Rupiah`;
  return n < 0 ? `Minus ${result}` : result;
}

export function PrintablePayslipModal({
  isOpen,
  onClose,
  report,
  initialEmployeeName,
}: PrintablePayslipModalProps) {
  const [selectedEmpName, setSelectedEmpName] = useState<string>(
    initialEmployeeName || report.payslips[0]?.employee.employee_name || ""
  );
  const [isBatchAllMode, setIsBatchAllMode] = useState(false);

  if (!isOpen || !report) return null;

  const currentSlip =
    report.payslips.find(
      (p) => p.employee.employee_name === selectedEmpName
    ) || report.payslips[0];

  const slipsToPrint = isBatchAllMode
    ? report.payslips
    : currentSlip
    ? [currentSlip]
    : [];

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex flex-col p-2 sm:p-6 overflow-y-auto print:p-0 print:bg-white print:static print:overflow-visible print:z-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <style jsx global>{`
        @media print {
          body {
            background: #ffffff !important;
            color: #09090b !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .no-print,
          nav,
          header,
          aside,
          .cockpit-sidebar,
          button {
            display: none !important;
          }
          .print-slip-container {
            display: block !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 8px !important;
            background: #ffffff !important;
            color: #000000 !important;
            box-shadow: none !important;
            border: none !important;
          }
          .payslip-page {
            page-break-after: always;
            break-after: page;
            page-break-inside: avoid;
            break-inside: avoid;
            padding: 16px 0;
          }
          .payslip-page:last-child {
            page-break-after: auto;
            break-after: auto;
          }
        }
      `}</style>

      {/* Control Action Bar (Hidden on print) */}
      <div className="no-print w-full max-w-4xl mx-auto mb-4 bg-zinc-900 border border-zinc-800 rounded-2xl p-4 shadow-2xl space-y-3 text-zinc-100">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Printer className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold tracking-wide text-zinc-100">
                Print Official Payslip (Slip Gaji)
              </h2>
              <p className="text-xs text-zinc-400">
                Format slip resmi A4/cetak dengan rincian take-home pay &amp; tanda tangan
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-950/40 transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>
                {isBatchAllMode
                  ? `Print All (${report.payslips.length} Slips)`
                  : "Print / Save PDF"}
              </span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors cursor-pointer"
              title="Close modal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Mode & Employee Selector Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          {/* Employee Picker Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 max-h-24 overflow-y-auto">
            {report.payslips.map((p) => {
              const isActive =
                !isBatchAllMode &&
                p.employee.employee_name === currentSlip?.employee.employee_name;
              return (
                <button
                  key={p.employee.employee_name}
                  type="button"
                  onClick={() => {
                    setIsBatchAllMode(false);
                    setSelectedEmpName(p.employee.employee_name);
                  }}
                  className={`px-3 py-1.5 rounded-xl font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                    isActive
                      ? "bg-emerald-600 text-white font-semibold shadow-sm"
                      : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white"
                  }`}
                >
                  <span>{p.employee.full_name}</span>
                  {p.is_paid && (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Batch Print Toggle */}
          <button
            type="button"
            onClick={() => setIsBatchAllMode(!isBatchAllMode)}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium border flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 ${
              isBatchAllMode
                ? "bg-purple-600 border-purple-500 text-white font-semibold"
                : "bg-zinc-800 border-zinc-700 text-zinc-300 hover:text-white"
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>
              {isBatchAllMode ? "✓ Batch All Mode Active" : "Cetak Semua Kru Sekaligus"}
            </span>
          </button>
        </div>
      </div>

      {/* The Printable Container */}
      <div className="print-slip-container w-full max-w-4xl mx-auto space-y-8">
        {slipsToPrint.map((slip) => (
          <div
            key={slip.employee.employee_name}
            className="payslip-page bg-white text-zinc-950 p-6 sm:p-10 rounded-2xl shadow-2xl border border-zinc-200"
          >
            {/* Payslip Header */}
            <div className="border-b-2 border-zinc-900 pb-4 mb-5">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/tyfel-logo.png"
                    alt="Tyfel Coffee"
                    className="h-10 w-auto object-contain"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold uppercase tracking-widest bg-zinc-900 text-white px-2 py-0.5 rounded">
                        Tyfel Coffee Hub
                      </span>
                      <span className="text-xs text-zinc-500 font-medium">
                        Operations &amp; Payroll Cockpit
                      </span>
                    </div>
                    <h1 className="text-xl sm:text-2xl font-black tracking-tight text-zinc-950 mt-1 uppercase">
                      Slip Gaji Karyawan / Payslip
                    </h1>
                  </div>
                </div>

                <div className="text-right text-xs space-y-1">
                  <div className="inline-flex items-center gap-2 bg-[#2d6147] text-white px-3 py-1 rounded-md font-semibold text-xs">
                    <span>{report.salary_code}</span>
                    <FileSpreadsheet className="w-3 h-3 opacity-80" />
                  </div>
                  <div className="text-zinc-600">
                    Status:{" "}
                    {slip.is_paid ? (
                      <span className="font-bold text-emerald-800">
                        SUDAH DIBAYAR (PAID)
                      </span>
                    ) : (
                      <span className="font-bold text-amber-800">
                        BELUM DIBAYAR (PENDING)
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Employee Bio Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-4 pt-3 border-t border-zinc-200 text-xs">
                <div className="bg-zinc-50 p-2.5 rounded border border-zinc-200">
                  <span className="text-zinc-500 block text-[10px] uppercase font-semibold">
                    Nama Lengkap
                  </span>
                  <span className="font-bold text-zinc-900 text-sm">
                    {slip.employee.full_name}
                  </span>
                </div>
                <div className="bg-zinc-50 p-2.5 rounded border border-zinc-200">
                  <span className="text-zinc-500 block text-[10px] uppercase font-semibold">
                    Jabatan / Role
                  </span>
                  <span className="font-semibold text-zinc-900">
                    {slip.employee.role}
                  </span>
                </div>
                <div className="bg-zinc-50 p-2.5 rounded border border-zinc-200">
                  <span className="text-zinc-500 block text-[10px] uppercase font-semibold">
                    Outlet / Cabang
                  </span>
                  <span className="font-semibold text-zinc-900">
                    {slip.employee.outlet}
                  </span>
                </div>
                <div className="bg-zinc-50 p-2.5 rounded border border-zinc-200">
                  <span className="text-zinc-500 block text-[10px] uppercase font-semibold">
                    Tanggal Bergabung
                  </span>
                  <span className="font-semibold text-zinc-900">
                    {slip.employee.join_date_label}
                  </span>
                </div>
              </div>
            </div>

            {/* Salary Calculation Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border border-zinc-300">
                <thead>
                  <tr className="bg-zinc-900 text-white uppercase text-[10px] tracking-wider font-semibold">
                    <th className="py-2.5 px-3 border-r border-zinc-800">
                      Rincian Pendapatan &amp; Potongan (Description)
                    </th>
                    <th className="py-2.5 px-3 border-r border-zinc-800 w-16 text-center">
                      Qty / Hari
                    </th>
                    <th className="py-2.5 px-3 border-r border-zinc-800 w-32 text-right">
                      Tarif Satuan (Rate)
                    </th>
                    <th className="py-2.5 px-3 w-36 text-right">
                      Jumlah (Amount)
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200">
                  {/* Basic Salary */}
                  <tr className="hover:bg-zinc-50">
                    <td className="py-2.5 px-3 font-medium border-r border-zinc-200">
                      Gaji Pokok (Basic Salary)
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono border-r border-zinc-200">
                      {slip.basic_qty}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono border-r border-zinc-200">
                      {formatAccountingRp(slip.basic_unit, false)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-semibold">
                      {formatAccountingRp(slip.basic_total)}
                    </td>
                  </tr>

                  {/* Daily Rate */}
                  <tr className="hover:bg-zinc-50">
                    <td className="py-2.5 px-3 font-medium border-r border-zinc-200">
                      Uang Kehadiran Harian (Daily Presence)
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono border-r border-zinc-200">
                      {slip.daily_qty} hari
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono border-r border-zinc-200">
                      {formatAccountingRp(slip.daily_unit, false)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-semibold">
                      {formatAccountingRp(slip.daily_total)}
                    </td>
                  </tr>

                  {/* Half-day row if applicable */}
                  {(slip.has_half_day || slip.half_day_qty > 0) && (
                    <tr className="hover:bg-zinc-50">
                      <td className="py-2.5 px-3 font-medium border-r border-zinc-200">
                        Shift Setengah Hari (Half-Day)
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono border-r border-zinc-200">
                        {slip.half_day_qty} kali
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono border-r border-zinc-200">
                        {formatAccountingRp(slip.half_day_unit, false)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-semibold">
                        {formatAccountingRp(slip.half_day_total)}
                      </td>
                    </tr>
                  )}

                  {/* Late Penalties */}
                  <tr className="hover:bg-zinc-50 text-rose-900 bg-rose-50/30">
                    <td className="py-2.5 px-3 font-medium border-r border-zinc-200">
                      Potongan Terlambat (Late Penalties)
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono border-r border-zinc-200">
                      {slip.late_qty} kali
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono border-r border-zinc-200 text-rose-700">
                      {formatAccountingRp(-slip.late_unit, false)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-semibold text-rose-700">
                      {formatAccountingRp(slip.late_total)}
                    </td>
                  </tr>

                  {/* No Late Bonus */}
                  <tr className="hover:bg-zinc-50 text-emerald-900 bg-emerald-50/30">
                    <td className="py-2.5 px-3 font-medium border-r border-zinc-200">
                      Bonus Disiplin (No-Late Attendance Bonus)
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono border-r border-zinc-200">
                      {slip.bonus_tidak_telat_qty}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono border-r border-zinc-200">
                      {formatAccountingRp(slip.bonus_tidak_telat_unit, false)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-semibold text-emerald-800">
                      {formatAccountingRp(slip.bonus_tidak_telat_total)}
                    </td>
                  </tr>

                  {/* Custom Line */}
                  {slip.custom_desc && (
                    <tr className="hover:bg-zinc-50">
                      <td className="py-2.5 px-3 font-medium border-r border-zinc-200">
                        Tambahan: {slip.custom_desc}
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono border-r border-zinc-200">
                        {slip.custom_qty > 0 ? slip.custom_qty : "-"}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono border-r border-zinc-200">
                        {slip.custom_unit !== 0
                          ? formatAccountingRp(slip.custom_unit, false)
                          : "-"}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-semibold">
                        {formatAccountingRp(slip.custom_total)}
                      </td>
                    </tr>
                  )}

                  {/* Subtotal Grand Total */}
                  <tr className="bg-zinc-100 font-bold border-t border-b border-zinc-300">
                    <td
                      colSpan={3}
                      className="py-2.5 px-3 text-left border-r border-zinc-300 uppercase text-[11px]"
                    >
                      Subtotal Gaji Kotor (Gross Total)
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-zinc-950">
                      {formatAccountingRp(slip.grand_total, false)}
                    </td>
                  </tr>

                  {/* Kasbon Deduction */}
                  <tr className="hover:bg-zinc-50 text-rose-900 bg-rose-50/40">
                    <td className="py-2.5 px-3 font-medium border-r border-zinc-200">
                      Potongan Cicilan Kasbon (Salary Advance)
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono border-r border-zinc-200">
                      {slip.kasbon_qty > 0 ? `${slip.kasbon_qty}x` : "-"}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono border-r border-zinc-200 text-rose-700">
                      {slip.kasbon_unit > 0
                        ? formatAccountingRp(-slip.kasbon_unit, false)
                        : "Rp -"}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-semibold text-rose-700">
                      {formatAccountingRp(slip.kasbon_total)}
                    </td>
                  </tr>

                  {/* Net Take Home Pay */}
                  <tr className="bg-emerald-100/70 border-t-2 border-emerald-600 text-emerald-950">
                    <td
                      colSpan={3}
                      className="py-3.5 px-3 text-left font-black uppercase tracking-wider text-xs border-r border-emerald-300"
                    >
                      Total Gaji Bersih Diterima (Take-Home Pay)
                    </td>
                    <td className="py-3.5 px-3 text-right font-mono font-black text-sm text-emerald-950">
                      {formatAccountingRp(slip.net_take_home_pay, false)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Terbilang block */}
            <div className="mt-3 p-3 bg-zinc-50 border border-zinc-200 rounded text-xs text-zinc-800">
              <span className="font-semibold text-zinc-500 uppercase text-[10px] block">
                Terbilang (Amount in Words):
              </span>
              <span className="italic font-medium text-zinc-900">
                &ldquo;{terbilang(slip.net_take_home_pay)}&rdquo;
              </span>
            </div>

            {/* Dual Signature Block */}
            <div className="mt-6 pt-4 border-t-2 border-zinc-900 text-xs text-zinc-800">
              <div className="grid grid-cols-2 gap-12 text-center">
                <div className="border border-zinc-300 rounded p-3">
                  <div className="text-[11px] font-semibold text-zinc-600 uppercase">
                    Penerima (Karyawan)
                  </div>
                  <div className="h-16 border-b border-dashed border-zinc-300 mt-2"></div>
                  <div className="text-xs font-bold text-zinc-900 mt-2">
                    ( {slip.employee.full_name} )
                  </div>
                  <div className="text-[10px] text-zinc-500">
                    Tanda Tangan &amp; Tanggal Terima
                  </div>
                </div>

                <div className="border border-zinc-300 rounded p-3">
                  <div className="text-[11px] font-semibold text-zinc-600 uppercase">
                    Bagian Keuangan (HRD / Finance Lead)
                  </div>
                  <div className="h-16 border-b border-dashed border-zinc-300 mt-2"></div>
                  <div className="text-xs font-bold text-zinc-900 mt-2">
                    ( Tyfel Operations Lead )
                  </div>
                  <div className="text-[10px] text-zinc-500">
                    Disetujui untuk Pembayaran
                  </div>
                </div>
              </div>

              <div className="text-center text-[10px] text-zinc-400 mt-4">
                Dokumen ini dicetak otomatis dari Tyfel Hub F&amp;B Operating System ·{" "}
                {new Date().toLocaleDateString("id-ID", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
