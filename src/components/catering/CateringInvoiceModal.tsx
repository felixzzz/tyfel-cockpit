"use client";

import React from "react";
import { generateInvoiceWhatsAppText, buildWhatsAppLink } from "@/lib/catering-whatsapp";
import type { InvoiceModalState } from "./types";
import { formatRp } from "./types";
import { Receipt, X, Check, AlertTriangle, Send, Printer } from "lucide-react";

export interface CateringInvoiceModalProps {
  invoiceModal: InvoiceModalState;
  onClose: () => void;
  onTogglePaymentStatus: (packageId: string, currentStatus: string) => void;
  mutating: boolean;
}

export function CateringInvoiceModal({
  invoiceModal,
  onClose,
  onTogglePaymentStatus,
  mutating,
}: CateringInvoiceModalProps) {
  if (!invoiceModal.isOpen || !invoiceModal.data) return null;

  const { data } = invoiceModal;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs overflow-y-auto">
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-invoice-area,
          #printable-invoice-area * {
            visibility: visible;
          }
          #printable-invoice-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 24px;
            background: white !important;
            color: black !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>
      <div className="bg-[var(--bg-surface-1)] border border-[var(--border-default)] rounded-2xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto">
        {/* Modal Bar */}
        <div className="p-4 border-b border-[var(--border-subtle)] flex items-center justify-between bg-[var(--bg-surface-2)] no-print">
          <div className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-[var(--accent-primary)]" />
            <span className="font-bold text-sm text-[var(--text-primary)]">
              Digital Invoice — {data.invoice_number}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-[var(--bg-surface-3)] text-[var(--text-secondary)] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Printable Invoice Sheet */}
        <div
          id="printable-invoice-area"
          className="p-8 overflow-y-auto space-y-6 bg-white dark:bg-neutral-950 text-gray-900 dark:text-gray-100"
        >
          {/* Header */}
          <div className="flex items-start justify-between border-b pb-6 border-gray-200 dark:border-neutral-800">
            <div>
              <div className="text-xl font-extrabold tracking-tight text-emerald-600 dark:text-emerald-400">
                HERBOX
              </div>
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-widest mt-0.5">
                Healthy &amp; Nutritious Personal Catering
              </div>
              <div className="text-[11px] text-gray-500 mt-1">
                PT Herbox Pangan Sehat / Tyfel Hub · Jakarta, Indonesia
              </div>
            </div>

            <div className="text-right">
              <div className="text-lg font-black tracking-wider uppercase text-gray-900 dark:text-white">
                INVOICE
              </div>
              <div className="text-xs font-mono font-bold text-gray-600 dark:text-gray-400 mt-0.5">
                {data.invoice_number}
              </div>
              <div className="mt-2">
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold inline-flex items-center gap-1 ${
                    data.payment_status === "paid"
                      ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300"
                      : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300"
                  }`}
                >
                  {data.payment_status === "paid" ? (
                    <>
                      <Check className="w-3 h-3" />
                      <span>LUNAS / PAID</span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-3 h-3" />
                      <span>BELUM LUNAS / PENDING</span>
                    </>
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* Bill To & Metadata */}
          <div className="grid grid-cols-2 gap-6 text-xs">
            <div>
              <div className="text-[10px] font-mono uppercase tracking-wider text-gray-400 font-bold mb-1">
                Billed To:
              </div>
              <div className="font-bold text-sm text-gray-900 dark:text-white">
                {data.customer_name}
              </div>
              <div className="text-gray-600 dark:text-gray-400 font-mono mt-0.5">
                {data.phone}
              </div>
              <div className="text-gray-600 dark:text-gray-400 mt-1 leading-snug">
                {data.delivery_address}
              </div>
            </div>

            <div className="text-right space-y-1 font-mono text-[11px]">
              <div className="flex justify-between">
                <span className="text-gray-400">Invoice Date:</span>
                <strong className="text-gray-800 dark:text-gray-200">
                  {data.issue_date}
                </strong>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Due Date:</span>
                <strong className="text-gray-800 dark:text-gray-200">
                  {data.due_date}
                </strong>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Plan Category:</span>
                <strong className="text-gray-800 dark:text-gray-200">
                  {data.category_label}
                </strong>
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div className="rounded-xl border border-gray-200 dark:border-neutral-800 overflow-hidden">
            <table className="w-full text-xs">
              <thead className="bg-gray-50 dark:bg-neutral-900 border-b border-gray-200 dark:border-neutral-800 text-[10px] font-mono uppercase text-gray-500">
                <tr>
                  <th className="py-2.5 px-4 text-left">Subscription Item</th>
                  <th className="py-2.5 px-4 text-center">Boxes</th>
                  <th className="py-2.5 px-4 text-right">Price / Box</th>
                  <th className="py-2.5 px-4 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-neutral-900">
                <tr>
                  <td className="py-3 px-4 font-semibold text-gray-900 dark:text-white">
                    {data.package_name}
                    <span className="block text-[11px] font-normal text-gray-500">
                      Herbox Personal Catering Program ({data.total_boxes} Deliveries)
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center font-mono">
                    {data.total_boxes}
                  </td>
                  <td className="py-3 px-4 text-right font-mono">
                    {formatRp(data.price_per_box)}
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-gray-900 dark:text-white">
                    {formatRp(data.total_amount)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Total & Bank Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            <div className="p-4 rounded-xl border border-gray-200 dark:border-neutral-800 bg-gray-50 dark:bg-neutral-900/50 space-y-1.5 text-xs">
              <div className="font-bold text-[11px] uppercase tracking-wider text-gray-500 font-mono">
                Payment Instructions:
              </div>
              <div className="font-semibold text-gray-900 dark:text-white">
                {data.bank_details.bank_name}
              </div>
              <div className="text-sm font-mono font-bold text-emerald-600 dark:text-emerald-400">
                {data.bank_details.account_number}
              </div>
              <div className="text-[11px] text-gray-500">
                a.n. {data.bank_details.account_holder}
              </div>
              <div className="text-[10px] text-gray-400 pt-1 border-t border-gray-200 dark:border-neutral-800">
                Berita Transfer: <strong>{data.invoice_number}</strong>
              </div>
            </div>

            <div className="space-y-2 text-xs font-mono self-end">
              <div className="flex justify-between text-gray-500">
                <span>Subtotal ({data.total_boxes} boxes):</span>
                <span>{formatRp(data.subtotal)}</span>
              </div>
              <div className="flex justify-between text-gray-500">
                <span>Discount:</span>
                <span>Rp 0</span>
              </div>
              <div className="flex justify-between items-center text-sm font-bold pt-2 border-t border-gray-200 dark:border-neutral-800 text-gray-900 dark:text-white">
                <span>TOTAL CONTRACT:</span>
                <span className="text-base text-emerald-600 dark:text-emerald-400">
                  {formatRp(data.total_amount)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Bottom Actions */}
        <div className="p-4 border-t border-[var(--border-subtle)] bg-[var(--bg-surface-2)] flex flex-wrap items-center justify-between gap-3 no-print">
          <button
            type="button"
            onClick={() =>
              onTogglePaymentStatus(data.package_id, data.payment_status)
            }
            disabled={mutating}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer transition-colors ${
              data.payment_status === "paid"
                ? "bg-amber-500/15 hover:bg-amber-500/25 text-amber-700 dark:text-amber-300 border border-amber-500/30"
                : "bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30"
            }`}
          >
            {data.payment_status === "paid" ? (
              <>
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Mark as Pending (Unpaid)</span>
              </>
            ) : (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Mark as LUNAS (Paid)</span>
              </>
            )}
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                const waText = generateInvoiceWhatsAppText(
                  data.customer_name,
                  data.package_name,
                  data.total_boxes,
                  data.price_per_box,
                  data.invoice_number,
                  data.payment_status
                );
                const url = buildWhatsAppLink(data.phone, waText);
                window.open(url, "_blank");
              }}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold inline-flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send via WhatsApp</span>
            </button>

            <button
              type="button"
              onClick={() => window.print()}
              className="px-3.5 py-2 rounded-xl bg-[var(--bg-surface-3)] hover:bg-[var(--accent-primary)] hover:text-white text-xs font-semibold text-[var(--text-primary)] inline-flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / PDF</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
