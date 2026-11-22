"use client";

import React from "react";
import type { DailyDispatchItem } from "@/lib/catering";
import { formatShortDate, type DailyManifestData } from "./types";
import { Printer, X, MapPin } from "lucide-react";

export interface CateringManifestModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: string;
  dailyManifest: DailyManifestData;
  printSlotFilter: "ALL" | "L" | "D";
  setPrintSlotFilter: (filter: "ALL" | "L" | "D") => void;
}

export function CateringManifestModal({
  isOpen,
  onClose,
  selectedDate,
  dailyManifest,
  printSlotFilter,
  setPrintSlotFilter,
}: CateringManifestModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs overflow-y-auto">
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-manifest-area,
          #printable-manifest-area * {
            visibility: visible;
          }
          #printable-manifest-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 16px;
            background: white !important;
            color: black !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>
      <div className="bg-[var(--bg-surface-1)] border border-[var(--border-default)] rounded-2xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto">
        {/* Modal Header */}
        <div className="p-4 border-b border-[var(--border-subtle)] flex items-center justify-between gap-3 bg-[var(--bg-surface-2)] no-print">
          <div>
            <h3 className="text-base font-bold text-[var(--text-primary)] flex items-center gap-2">
              <Printer className="w-5 h-5 text-[var(--accent-primary)]" />
              <span>Dispatch Manifest &amp; Kitchen Slips</span>
            </h3>
            <p className="text-xs text-[var(--text-secondary)]">
              Herbox Personal Catering — Date:{" "}
              <strong className="text-[var(--text-primary)]">
                {formatShortDate(selectedDate)}
              </strong>
            </p>
          </div>

          {/* Slot Filter & Print Trigger */}
          <div className="flex items-center gap-2">
            <div className="inline-flex rounded-xl bg-[var(--bg-surface-3)] p-1 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setPrintSlotFilter("ALL")}
                className={`px-3 py-1 rounded-lg cursor-pointer transition-colors ${
                  printSlotFilter === "ALL"
                    ? "bg-[var(--bg-surface-1)] text-[var(--text-primary)] shadow-xs"
                    : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                }`}
              >
                All Slots
              </button>
              <button
                type="button"
                onClick={() => setPrintSlotFilter("L")}
                className={`px-3 py-1 rounded-lg cursor-pointer transition-colors ${
                  printSlotFilter === "L"
                    ? "bg-amber-500 text-white shadow-xs"
                    : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                }`}
              >
                Lunch (L)
              </button>
              <button
                type="button"
                onClick={() => setPrintSlotFilter("D")}
                className={`px-3 py-1 rounded-lg cursor-pointer transition-colors ${
                  printSlotFilter === "D"
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                }`}
              >
                Dinner (D)
              </button>
            </div>

            <button
              type="button"
              onClick={() => window.print()}
              className="px-3.5 py-1.5 rounded-xl bg-[var(--accent-primary)] hover:opacity-90 text-white text-xs font-semibold inline-flex items-center gap-1.5 shadow-md cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Sheet</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl hover:bg-[var(--bg-surface-3)] text-[var(--text-secondary)] cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Area */}
        <div id="printable-manifest-area" className="p-6 overflow-y-auto space-y-5">
          {/* Manifest Overview Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl border border-gray-200 dark:border-neutral-800 bg-gray-50 dark:bg-neutral-900/40 text-xs">
            <div>
              <div className="font-bold text-sm tracking-wide uppercase text-gray-900 dark:text-gray-100">
                HERBOX CATERING DISPATCH MANIFEST
              </div>
              <div className="text-gray-500 dark:text-gray-400 font-mono mt-0.5">
                Delivery Date: {selectedDate} · Generated:{" "}
                {new Date().toLocaleTimeString("id-ID", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>
            </div>
            <div className="flex items-center gap-4 text-xs font-mono">
              <div className="text-center px-3 py-1.5 rounded-lg border border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
                <span className="text-gray-400 block text-[10px] uppercase">
                  Total Deliveries
                </span>
                <strong className="text-sm font-bold text-gray-900 dark:text-white">
                  {(printSlotFilter === "ALL" || printSlotFilter === "L"
                    ? dailyManifest.lunch_items.length
                    : 0) +
                    (printSlotFilter === "ALL" || printSlotFilter === "D"
                      ? dailyManifest.dinner_items.length
                      : 0)}
                </strong>
              </div>
              <div className="text-center px-3 py-1.5 rounded-lg border border-amber-200 bg-amber-50/50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-300">
                <span className="block text-[10px] uppercase">Lunch (L)</span>
                <strong className="text-sm font-bold">
                  {dailyManifest.lunch_items.reduce(
                    (acc: number, i: DailyDispatchItem) => acc + i.box_qty,
                    0
                  )}{" "}
                  box
                </strong>
              </div>
              <div className="text-center px-3 py-1.5 rounded-lg border border-indigo-200 bg-indigo-50/50 dark:bg-indigo-950/20 text-indigo-700 dark:text-indigo-300">
                <span className="block text-[10px] uppercase">Dinner (D)</span>
                <strong className="text-sm font-bold">
                  {dailyManifest.dinner_items.reduce(
                    (acc: number, i: DailyDispatchItem) => acc + i.box_qty,
                    0
                  )}{" "}
                  box
                </strong>
              </div>
            </div>
          </div>

          {/* Slips Grid (2-column layout for paper-efficient printing) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(printSlotFilter === "ALL" || printSlotFilter === "L"
              ? dailyManifest.lunch_items
              : []
            ).map((item: DailyDispatchItem, idx: number) => (
              <div
                key={`print-l-${item.customer_id}-${idx}`}
                className="p-4 rounded-xl border border-gray-300 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-gray-900 dark:text-gray-100 space-y-2.5 shadow-xs break-inside-avoid"
              >
                <div className="flex items-center justify-between border-b pb-2 border-gray-200 dark:border-neutral-800">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md bg-amber-500 text-white font-mono text-[10px] font-bold">
                      LUNCH (L)
                    </span>
                    <span className="font-bold text-sm tracking-tight">
                      {item.customer_name}
                    </span>
                  </div>
                  <span className="text-xs font-mono font-semibold text-gray-600 dark:text-gray-300">
                    {item.phone}
                  </span>
                </div>

                <div className="text-xs space-y-1">
                  <div className="flex items-start gap-1.5 text-gray-700 dark:text-gray-300">
                    <MapPin className="w-3.5 h-3.5 text-gray-500 shrink-0 mt-0.5" />
                    <span className="font-medium leading-snug">
                      {item.delivery_address || "Alamat belum tercatat"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] pt-1 font-mono text-gray-500">
                    <span>
                      Package: <strong>{item.package_name}</strong>
                    </span>
                    <span className="px-1.5 py-0.5 rounded-sm bg-gray-100 dark:bg-neutral-800 font-bold text-gray-900 dark:text-white">
                      QTY: {item.box_qty} Box
                    </span>
                  </div>
                </div>

                {/* Dietary / Menu Special Notes */}
                {(item.dietary_notes || item.menu_note) && (
                  <div className="p-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-[11px] leading-tight font-medium">
                    <strong>⚠️ NOTES:</strong>{" "}
                    {item.dietary_notes || item.menu_note}
                  </div>
                )}

                {/* Courier Receipt Check Line */}
                <div className="pt-2 border-t border-dashed border-gray-200 dark:border-neutral-800 flex items-center justify-between text-[10px] text-gray-500 font-mono">
                  <span>Sisa: {item.boxes_left_to_deliver} box</span>
                  <span>[ ] Driver: ____________ Jam: _______</span>
                </div>
              </div>
            ))}

            {(printSlotFilter === "ALL" || printSlotFilter === "D"
              ? dailyManifest.dinner_items
              : []
            ).map((item: DailyDispatchItem, idx: number) => (
              <div
                key={`print-d-${item.customer_id}-${idx}`}
                className="p-4 rounded-xl border border-gray-300 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-gray-900 dark:text-gray-100 space-y-2.5 shadow-xs break-inside-avoid"
              >
                <div className="flex items-center justify-between border-b pb-2 border-gray-200 dark:border-neutral-800">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md bg-indigo-600 text-white font-mono text-[10px] font-bold">
                      DINNER (D)
                    </span>
                    <span className="font-bold text-sm tracking-tight">
                      {item.customer_name}
                    </span>
                  </div>
                  <span className="text-xs font-mono font-semibold text-gray-600 dark:text-gray-300">
                    {item.phone}
                  </span>
                </div>

                <div className="text-xs space-y-1">
                  <div className="flex items-start gap-1.5 text-gray-700 dark:text-gray-300">
                    <MapPin className="w-3.5 h-3.5 text-gray-500 shrink-0 mt-0.5" />
                    <span className="font-medium leading-snug">
                      {item.delivery_address || "Alamat belum tercatat"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] pt-1 font-mono text-gray-500">
                    <span>
                      Package: <strong>{item.package_name}</strong>
                    </span>
                    <span className="px-1.5 py-0.5 rounded-sm bg-gray-100 dark:bg-neutral-800 font-bold text-gray-900 dark:text-white">
                      QTY: {item.box_qty} Box
                    </span>
                  </div>
                </div>

                {/* Dietary / Menu Special Notes */}
                {(item.dietary_notes || item.menu_note) && (
                  <div className="p-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-[11px] leading-tight font-medium">
                    <strong>⚠️ NOTES:</strong>{" "}
                    {item.dietary_notes || item.menu_note}
                  </div>
                )}

                {/* Courier Receipt Check Line */}
                <div className="pt-2 border-t border-dashed border-gray-200 dark:border-neutral-800 flex items-center justify-between text-[10px] text-gray-500 font-mono">
                  <span>Sisa: {item.boxes_left_to_deliver} box</span>
                  <span>[ ] Driver: ____________ Jam: _______</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
