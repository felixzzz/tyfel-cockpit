"use client";

import React, { useState, useMemo } from "react";
import type { IngredientInventoryItem } from "@/lib/inventory";
import {
  Printer,
  X,
  Eye,
  EyeOff,
} from "lucide-react";

export interface PrintableStockOpnameSheetProps {
  isOpen: boolean;
  onClose: () => void;
  ingredients: IngredientInventoryItem[];
  defaultBranch?: string;
  defaultConductedBy?: string;
}

export function PrintableStockOpnameSheet({
  isOpen,
  onClose,
  ingredients,
  defaultBranch = "Greenville Flagship",
  defaultConductedBy = "Kitchen Shift Lead",
}: PrintableStockOpnameSheetProps) {
  const [branch, setBranch] = useState(defaultBranch);
  const [conductedBy, setConductedBy] = useState(defaultConductedBy);
  const [auditDate, setAuditDate] = useState(() =>
    new Date().toISOString().split("T")[0]
  );
  const [shift, setShift] = useState<"Pagi" | "Siang" | "Closing">("Closing");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [isBlindCount, setIsBlindCount] = useState(true);

  // Collect unique categories
  const categories = useMemo(() => {
    const set = new Set<string>();
    ingredients.forEach((item) => {
      if (item.category) set.add(item.category);
    });
    return Array.from(set).sort();
  }, [ingredients]);

  // Filter items
  const filteredItems = useMemo(() => {
    return ingredients.filter((item) => {
      if (categoryFilter !== "all" && item.category !== categoryFilter) {
        return false;
      }
      return true;
    });
  }, [ingredients, categoryFilter]);

  // Group items by category for printing
  const groupedByCategory = useMemo(() => {
    const map = new Map<string, IngredientInventoryItem[]>();
    filteredItems.forEach((item) => {
      const cat = item.category || "Uncategorized";
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat)!.push(item);
    });
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [filteredItems]);

  if (!isOpen) return null;

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
          .print-opname-sheet {
            display: block !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 12px !important;
            background: #ffffff !important;
            color: #000000 !important;
            box-shadow: none !important;
            border: none !important;
          }
          table {
            page-break-inside: auto;
            border-collapse: collapse !important;
            width: 100% !important;
          }
          tr {
            page-break-inside: avoid;
            page-break-after: auto;
          }
          thead {
            display: table-header-group;
          }
          tfoot {
            display: table-footer-group;
          }
        }
      `}</style>

      {/* Control Action Bar (Hidden on print) */}
      <div className="no-print w-full max-w-5xl mx-auto mb-4 bg-zinc-900 border border-zinc-800 rounded-2xl p-4 shadow-2xl space-y-3 text-zinc-100">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Printer className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold tracking-wide text-zinc-100">
                Print Stock Opname Audit Sheet
              </h2>
              <p className="text-xs text-zinc-400">
                Lembar hitung fisik untuk kitchen manager & kru outlet
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
              <span>Print / Simpan PDF</span>
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

        {/* Configuration Toolbar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 text-xs">
          <div>
            <label className="block text-zinc-400 text-[11px] mb-1 font-medium">
              Outlet / Branch
            </label>
            <input
              type="text"
              value={branch}
              onChange={(e) => setBranch(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-800/80 border border-zinc-700 text-zinc-200 text-xs focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-zinc-400 text-[11px] mb-1 font-medium">
              Penanggung Jawab (Auditor)
            </label>
            <input
              type="text"
              value={conductedBy}
              onChange={(e) => setConductedBy(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-800/80 border border-zinc-700 text-zinc-200 text-xs focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-zinc-400 text-[11px] mb-1 font-medium">
              Tanggal & Shift
            </label>
            <div className="flex gap-1.5">
              <input
                type="date"
                value={auditDate}
                onChange={(e) => setAuditDate(e.target.value)}
                className="w-3/5 px-2 py-1.5 rounded-lg bg-zinc-800/80 border border-zinc-700 text-zinc-200 text-xs focus:ring-1 focus:ring-emerald-500"
              />
              <select
                value={shift}
                onChange={(e) => setShift(e.target.value as any)}
                className="w-2/5 px-2 py-1.5 rounded-lg bg-zinc-800/80 border border-zinc-700 text-zinc-200 text-xs focus:ring-1 focus:ring-emerald-500"
              >
                <option value="Pagi">Pagi</option>
                <option value="Siang">Siang</option>
                <option value="Closing">Closing</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-zinc-400 text-[11px] mb-1 font-medium">
              Kategori Bahan
            </label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-800/80 border border-zinc-700 text-zinc-200 text-xs focus:ring-1 focus:ring-emerald-500"
            >
              <option value="all">Semua Kategori ({ingredients.length} SKU)</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-zinc-400 text-[11px] mb-1 font-medium">
              Tipe Audit (Blind vs Guided)
            </label>
            <button
              type="button"
              onClick={() => setIsBlindCount(!isBlindCount)}
              className={`w-full px-2.5 py-1.5 rounded-lg border flex items-center justify-center gap-1.5 text-xs font-medium cursor-pointer transition-colors ${
                isBlindCount
                  ? "bg-amber-500/15 border-amber-500/30 text-amber-300"
                  : "bg-blue-500/15 border-blue-500/30 text-blue-300"
              }`}
            >
              {isBlindCount ? (
                <>
                  <EyeOff className="w-3.5 h-3.5" />
                  <span>Blind Count (Rekomendasi)</span>
                </>
              ) : (
                <>
                  <Eye className="w-3.5 h-3.5" />
                  <span>Guided (Lihat Stok Sistem)</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* The Printable Document Paper Container */}
      <div className="print-opname-sheet w-full max-w-5xl mx-auto bg-white text-zinc-950 p-6 sm:p-10 rounded-2xl shadow-2xl border border-zinc-200">
        {/* Header Section */}
        <div className="border-b-2 border-zinc-900 pb-4 mb-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold uppercase tracking-widest bg-zinc-900 text-white px-2.5 py-0.5 rounded">
                  Tyfel Hub · F&B OS
                </span>
                <span className="text-xs text-zinc-600 font-medium">
                  Central Kitchen & Multi-Brand Operations
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-zinc-950 mt-1 uppercase">
                Lembar Hitung Fisik Stock Opname
              </h1>
              <p className="text-xs text-zinc-600">
                Formulir audit fisik inventaris & bahan baku dapur
              </p>
            </div>

            <div className="text-right text-xs space-y-1">
              <div className="font-semibold text-zinc-900">
                Mode Audit:{" "}
                <span
                  className={
                    isBlindCount ? "text-amber-800 font-bold" : "text-blue-800 font-bold"
                  }
                >
                  {isBlindCount
                    ? "Blind Count (Tanpa Angka Sistem)"
                    : "Guided Count (Tampak Angka Sistem)"}
                </span>
              </div>
              <div className="text-zinc-600">
                Total Item:{" "}
                <span className="font-semibold text-zinc-900">
                  {filteredItems.length} Bahan
                </span>
              </div>
            </div>
          </div>

          {/* Audit Info Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4 pt-3 border-t border-zinc-200 text-xs">
            <div className="bg-zinc-100 p-2 rounded border border-zinc-200">
              <span className="text-zinc-500 block text-[10px] uppercase font-semibold">
                Outlet / Cabang
              </span>
              <span className="font-bold text-zinc-900">{branch}</span>
            </div>
            <div className="bg-zinc-100 p-2 rounded border border-zinc-200">
              <span className="text-zinc-500 block text-[10px] uppercase font-semibold">
                Tanggal Audit
              </span>
              <span className="font-bold text-zinc-900">
                {new Date(auditDate).toLocaleDateString("id-ID", {
                  weekday: "short",
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </span>
            </div>
            <div className="bg-zinc-100 p-2 rounded border border-zinc-200">
              <span className="text-zinc-500 block text-[10px] uppercase font-semibold">
                Shift & Waktu
              </span>
              <span className="font-bold text-zinc-900">{shift} Shift</span>
            </div>
            <div className="bg-zinc-100 p-2 rounded border border-zinc-200">
              <span className="text-zinc-500 block text-[10px] uppercase font-semibold">
                Lead Auditor / Chef
              </span>
              <span className="font-bold text-zinc-900">{conductedBy}</span>
            </div>
          </div>
        </div>

        {/* Audit Inventory Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border border-zinc-300">
            <thead>
              <tr className="bg-zinc-900 text-white uppercase text-[10px] tracking-wider font-semibold">
                <th className="py-2 px-2 border-r border-zinc-800 w-10 text-center">No</th>
                <th className="py-2 px-3 border-r border-zinc-800 w-24">Kode</th>
                <th className="py-2 px-3 border-r border-zinc-800">Nama Bahan Baku / Packaging</th>
                <th className="py-2 px-2 border-r border-zinc-800 w-16 text-center">Satuan</th>
                <th className="py-2 px-3 border-r border-zinc-800 w-28 text-right">
                  {isBlindCount ? "Status Sistem" : "Stok Sistem"}
                </th>
                <th className="py-2 px-3 border-r border-zinc-800 w-36 text-center bg-zinc-800 text-amber-300 font-bold">
                  Hitungan Fisik
                </th>
                <th className="py-2 px-2 border-r border-zinc-800 w-28 text-center">Kondisi</th>
                <th className="py-2 px-3 w-40">Catatan / Expire Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200">
              {groupedByCategory.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-6 text-center text-zinc-500">
                    Tidak ada bahan baku yang cocok dengan filter.
                  </td>
                </tr>
              ) : (
                groupedByCategory.map(([category, items]) => (
                  <React.Fragment key={category}>
                    {/* Category Header Row */}
                    <tr className="bg-zinc-100 font-bold text-zinc-800 border-t border-b border-zinc-300">
                      <td colSpan={8} className="py-1.5 px-3 uppercase text-[11px] tracking-wide">
                        📁 {category} ({items.length} Item)
                      </td>
                    </tr>

                    {/* Ingredient Line Rows */}
                    {items.map((ing, idx) => (
                      <tr
                        key={ing.ingredientId}
                        className="hover:bg-zinc-50 border-b border-zinc-200 text-zinc-900"
                      >
                        <td className="py-2 px-2 border-r border-zinc-200 text-center font-mono text-zinc-500">
                          {idx + 1}
                        </td>
                        <td className="py-2 px-3 border-r border-zinc-200 font-mono text-[11px] text-zinc-600">
                          {ing.ingredientId}
                        </td>
                        <td className="py-2 px-3 border-r border-zinc-200 font-medium">
                          {ing.ingredientName}
                          {ing.supplierName && (
                            <span className="block text-[10px] text-zinc-500">
                              Vendor: {ing.supplierName}
                            </span>
                          )}
                        </td>
                        <td className="py-2 px-2 border-r border-zinc-200 text-center font-mono font-semibold">
                          {ing.baseUnit}
                        </td>
                        <td className="py-2 px-3 border-r border-zinc-200 text-right font-mono">
                          {isBlindCount ? (
                            <span className="text-zinc-400">---</span>
                          ) : (
                            <span className="font-semibold">
                              {ing.currentStock.toLocaleString("id-ID")} {ing.baseUnit}
                            </span>
                          )}
                        </td>
                        {/* Box for Physical Count Pen entry */}
                        <td className="py-1.5 px-3 border-r border-zinc-300 text-center bg-amber-50/50">
                          <div className="w-full h-7 border border-zinc-400 bg-white rounded flex items-center justify-end px-2 font-mono text-xs"></div>
                        </td>
                        {/* Checklist Condition */}
                        <td className="py-2 px-2 border-r border-zinc-200 text-center text-[10px]">
                          <div className="flex items-center justify-center gap-1.5 text-zinc-600">
                            <span>[ ] OK</span>
                            <span>[ ] Rusak</span>
                          </div>
                        </td>
                        {/* Notes Column */}
                        <td className="py-2 px-3 text-zinc-400">
                          <div className="border-b border-dotted border-zinc-300 h-5"></div>
                        </td>
                      </tr>
                    ))}
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* SOP Notice & Signature Block */}
        <div className="mt-6 pt-4 border-t-2 border-zinc-900 text-xs text-zinc-800 space-y-4">
          <div className="bg-zinc-50 border border-zinc-200 p-2.5 rounded text-[11px] text-zinc-700">
            <strong>Instruksi Audit Fisik:</strong>
            <ul className="list-disc list-inside mt-0.5 space-y-0.5 text-zinc-600">
              <li>
                Hitung jumlah fisik dalam satuan dasar yang tertera (gram, ml, atau pcs).
                Gunakan timbangan digital untuk bahan terbuka.
              </li>
              <li>
                Jika ditemukan bahan mendekati tanggal kedaluwarsa (&lt; 3 hari) atau rusak,
                tandai kotak Rusak dan tuliskan catatan tanggal di kolom kanan.
              </li>
              <li>
                Setelah selesai dihitung, segera input angka fisik ke menu{" "}
                <strong>Stock Opname Engine</strong> di Tyfel Hub untuk rekonsiliasi selisih.
              </li>
            </ul>
          </div>

          {/* Triple Signatures */}
          <div className="grid grid-cols-3 gap-6 pt-4 text-center">
            <div className="border border-zinc-300 rounded p-3">
              <div className="text-[11px] font-semibold text-zinc-600 uppercase">
                Dihitung Oleh (Kru / Barista)
              </div>
              <div className="h-16 border-b border-dashed border-zinc-300 mt-2"></div>
              <div className="text-xs font-semibold text-zinc-900 mt-2">
                ( .................................... )
              </div>
              <div className="text-[10px] text-zinc-500">Kru Kitchen / Barista</div>
            </div>

            <div className="border border-zinc-300 rounded p-3">
              <div className="text-[11px] font-semibold text-zinc-600 uppercase">
                Diverifikasi Oleh (Kitchen Lead)
              </div>
              <div className="h-16 border-b border-dashed border-zinc-300 mt-2"></div>
              <div className="text-xs font-semibold text-zinc-900 mt-2">
                ( {conductedBy} )
              </div>
              <div className="text-[10px] text-zinc-500">Head Chef / Supervisor</div>
            </div>

            <div className="border border-zinc-300 rounded p-3">
              <div className="text-[11px] font-semibold text-zinc-600 uppercase">
                Disetujui Oleh (Operations Manager)
              </div>
              <div className="h-16 border-b border-dashed border-zinc-300 mt-2"></div>
              <div className="text-xs font-semibold text-zinc-900 mt-2">
                ( .................................... )
              </div>
              <div className="text-[10px] text-zinc-500">Ops Lead / Owner</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
