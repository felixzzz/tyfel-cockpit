"use client";

import React from "react";
import Link from "next/link";
import type { EnrichedCateringCustomer, EnrichedCateringPackage } from "@/lib/catering";
import { generateRenewalWhatsAppText, buildWhatsAppLink } from "@/lib/catering-whatsapp";
import { formatShortDate } from "./types";
import {
  Sparkles,
  MessageSquare,
  Edit3,
  Phone,
  MapPin,
  Info,
  AlertTriangle,
  Check,
  Receipt,
  Smartphone,
  ExternalLink,
  Share2,
  Copy,
  CalendarPlus,
} from "lucide-react";

export interface CateringCrmViewProps {
  customers: EnrichedCateringCustomer[];
  categoryFilter: string;
  searchQuery: string;
  onOpenEditCustomerModal: (cust: EnrichedCateringCustomer) => void;
  onOpenExtendModal: (cust?: EnrichedCateringCustomer) => void;
  onTogglePaymentStatus: (packageId: string, currentStatus: string) => void;
  onOpenInvoice: (cust: EnrichedCateringCustomer, pkg: EnrichedCateringPackage) => void;
  onOpenPortalShareWa: (cust: EnrichedCateringCustomer) => void;
  onCopyText: (text: string, label: string) => void;
  baseUrl: string;
}

export function CateringCrmView({
  customers,
  categoryFilter,
  searchQuery,
  onOpenEditCustomerModal,
  onOpenExtendModal,
  onTogglePaymentStatus,
  onOpenInvoice,
  onOpenPortalShareWa,
  onCopyText,
  baseUrl,
}: CateringCrmViewProps) {
  const filteredCustomers = customers.filter((c) => {
    if (categoryFilter !== "all" && c.category !== categoryFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = c.customer_name.toLowerCase().includes(q);
      const matchNote = (c.dietary_notes || "").toLowerCase().includes(q);
      const matchAddr = (c.delivery_address || "").toLowerCase().includes(q);
      const matchSheet = (c.sheet_raw_label || "").toLowerCase().includes(q);
      if (!matchName && !matchNote && !matchAddr && !matchSheet) return false;
    }
    return true;
  });

  const urgentRenewals = customers.filter(
    (c) =>
      c.renewal_urgency === "critical" ||
      c.renewal_urgency === "soon" ||
      c.renewal_urgency === "inactive"
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-[var(--text-primary)] font-display">
            Subscriber CRM Directory &amp; Package History (Aug – Nov 2026)
          </h2>
          <p className="text-xs text-[var(--text-secondary)]">
            Complete digital profiles with original Google Sheet annotations, Excel comments, and package quota balances.
          </p>
        </div>
      </div>

      {/* PROACTIVE SUBSCRIBER RETENTION & AUTO-RENEWAL PIPELINE */}
      {urgentRenewals.length > 0 && (
        <div className="p-5 rounded-2xl border border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-[var(--bg-surface-1)] to-transparent space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[var(--text-primary)]">
                  Active Retention &amp; Package Renewal Pipeline
                </h3>
                <p className="text-xs text-[var(--text-secondary)]">
                  {urgentRenewals.length} subscriber(s) nearing quota depletion or requiring reactivation follow-up.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {urgentRenewals.map((c) => {
              const isCritical = c.renewal_urgency === "critical";
              const isInactive = c.renewal_urgency === "inactive";
              return (
                <div
                  key={`renewal-${c.customer_id}`}
                  className="p-3.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-default)] shadow-xs flex flex-col justify-between space-y-3"
                >
                  <div>
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-bold text-sm text-[var(--text-primary)]">
                        {c.customer_name}
                      </span>
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold uppercase ${
                          isCritical
                            ? "badge-rose animate-pulse"
                            : isInactive
                            ? "badge-neutral"
                            : "badge-amber"
                        }`}
                      >
                        {isCritical
                          ? "Critical Renewal"
                          : isInactive
                          ? "Reactivation Needed"
                          : "Expiring Soon"}
                      </span>
                    </div>
                    <div className="text-xs text-[var(--text-secondary)] mt-1">
                      {c.active_package?.package_name || "Completed Plan"}
                    </div>
                    <div className="text-[11px] text-amber-600 dark:text-amber-400 font-mono mt-1 font-semibold">
                      {c.renewal_reason}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-[var(--border-subtle)] flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const waText = generateRenewalWhatsAppText(c, baseUrl);
                        const link = buildWhatsAppLink(c.phone, waText);
                        window.open(link, "_blank");
                      }}
                      className="flex-1 py-1.5 px-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs inline-flex items-center justify-center gap-1.5 transition cursor-pointer"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Kirim WA Renewal</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onOpenExtendModal(c)}
                      className="py-1.5 px-2.5 rounded-lg bg-[var(--bg-surface-2)] hover:bg-[var(--bg-surface-3)] text-[var(--text-primary)] font-semibold text-xs border border-[var(--border-default)] transition cursor-pointer"
                    >
                      Extend
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Directory Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredCustomers.map((cust) => (
          <div
            key={cust.customer_id}
            className="cockpit-panel rounded-2xl p-5 flex flex-col justify-between space-y-4"
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-[var(--text-primary)] font-display">
                      {cust.customer_name}
                    </h3>
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-semibold ${
                        cust.category === "LAUK"
                          ? "badge-blue"
                          : cust.category === "LUNCH_DINNER"
                          ? "badge-purple"
                          : "badge-emerald"
                      }`}
                    >
                      {cust.category_label}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-[var(--text-muted)] font-mono mt-1">
                    <span className="inline-flex items-center gap-1">
                      <Phone className="w-3 h-3" />
                      {cust.phone}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onOpenEditCustomerModal(cust)}
                  className="p-1.5 rounded-lg bg-[var(--bg-surface-2)] hover:bg-[var(--bg-surface-3)] text-[var(--text-secondary)] cursor-pointer"
                  title="Edit Customer CRM"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
              </div>

              <div className="text-xs text-[var(--text-secondary)] bg-[var(--bg-surface-2)] p-3 rounded-xl border border-[var(--border-subtle)] space-y-1.5">
                <div className="flex items-start gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[var(--accent-primary)] shrink-0 mt-0.5" />
                  <span>{cust.delivery_address}</span>
                </div>
                <div className="flex items-start gap-1.5">
                  <Info className="w-3.5 h-3.5 text-sky-500 shrink-0 mt-0.5" />
                  <span>{cust.dietary_notes}</span>
                </div>
              </div>

              {/* Sheet Origin Metadata */}
              {(cust.sheet_raw_label || cust.excel_comment) && (
                <div className="p-2.5 rounded-xl bg-amber-500/5 border border-amber-500/20 text-[11px] space-y-1">
                  <div className="font-mono text-[10px] uppercase text-amber-700 dark:text-amber-300 font-semibold">
                    Imported Google Sheet Metadata:
                  </div>
                  {cust.sheet_raw_label && (
                    <div className="text-[var(--text-secondary)] font-mono text-[10px]">
                      Col B: {cust.sheet_raw_label}
                    </div>
                  )}
                  {cust.excel_comment && (
                    <div className="text-amber-700 dark:text-amber-300 font-mono text-[10px]">
                      Comment: &ldquo;{cust.excel_comment}&rdquo;
                    </div>
                  )}
                </div>
              )}

              {/* Packages List */}
              <div className="space-y-2">
                <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)] font-semibold">
                  Subscription Batches ({cust.packages.length})
                </div>
                {cust.packages.map((pkg) => (
                  <div
                    key={pkg.package_id}
                    className={`p-2.5 rounded-xl border text-xs space-y-2 ${
                      pkg.status === "active"
                        ? "bg-emerald-500/5 border-emerald-500/30"
                        : "bg-[var(--bg-surface-2)] border-[var(--border-subtle)] opacity-80"
                    }`}
                  >
                    <div className="flex items-center justify-between font-semibold text-[var(--text-primary)]">
                      <span>{pkg.package_name}</span>
                      <span className="font-mono text-[10px]">
                        {pkg.boxes_delivered} deliv · {pkg.boxes_scheduled}{" "}
                        sched / {pkg.total_boxes} box
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[10px] font-mono text-[var(--text-muted)]">
                      <span>
                        Start: {formatShortDate(pkg.start_date)} → Last:{" "}
                        {formatShortDate(pkg.effective_last_date)}
                      </span>
                      <span
                        className={
                          pkg.status === "active"
                            ? "text-emerald-600 dark:text-emerald-400 font-bold"
                            : ""
                        }
                      >
                        {pkg.status === "active"
                          ? `Sisa ${pkg.boxes_left_to_deliver} box`
                          : "Completed"}
                      </span>
                    </div>

                    {/* Payment Status & Invoice Button */}
                    <div className="flex items-center justify-between gap-2 pt-1.5 border-t border-[var(--border-subtle)]/70 text-[10px]">
                      <button
                        type="button"
                        onClick={() =>
                          onTogglePaymentStatus(
                            pkg.package_id,
                            pkg.payment_status || "paid"
                          )
                        }
                        title="Click to toggle Paid / Pending"
                        className={`px-2 py-0.5 rounded-md font-mono font-bold cursor-pointer inline-flex items-center gap-1 transition-all ${
                          pkg.payment_status === "pending"
                            ? "bg-amber-500/15 hover:bg-amber-500/25 text-amber-600 dark:text-amber-400 border border-amber-500/30"
                            : "bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                        }`}
                      >
                        {pkg.payment_status === "pending" ? (
                          <>
                            <AlertTriangle className="w-2.5 h-2.5" />
                            <span>UNPAID / PENDING</span>
                          </>
                        ) : (
                          <>
                            <Check className="w-2.5 h-2.5" />
                            <span>PAID</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => onOpenInvoice(cust, pkg)}
                        className="px-2 py-0.5 rounded-md bg-[var(--bg-surface-3)] hover:bg-[var(--accent-primary)] hover:text-white text-[var(--text-secondary)] font-medium inline-flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <Receipt className="w-2.5 h-2.5" />
                        <span>Invoice</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-[var(--border-subtle)] space-y-2.5">
              <div className="flex items-center justify-between text-[11px] font-mono text-[var(--text-secondary)]">
                <span>
                  Default:{" "}
                  <strong className="text-[var(--text-primary)]">
                    {cust.default_days}
                  </strong>{" "}
                  ({cust.default_slot})
                </span>
                <Link
                  href={`/catering/portal/${cust.customer_id}`}
                  target="_blank"
                  className="text-xs font-semibold text-[var(--accent-primary)] hover:underline inline-flex items-center gap-1"
                >
                  <Smartphone className="w-3 h-3" />
                  <span>Open Portal</span>
                  <ExternalLink className="w-2.5 h-2.5" />
                </Link>
              </div>
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => onOpenPortalShareWa(cust)}
                    className="px-2.5 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-700 dark:text-emerald-300 text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                    title="Share Self-Service Portal via WhatsApp"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>Share Portal</span>
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      onCopyText(
                        `${baseUrl}/catering/portal/${cust.customer_id}`,
                        `Portal Link for ${cust.customer_name}`
                      )
                    }
                    className="p-1.5 rounded-xl bg-[var(--bg-surface-2)] hover:bg-[var(--bg-surface-3)] text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
                    title="Copy Magic Link"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => onOpenExtendModal(cust)}
                  className="px-3 py-1.5 rounded-xl bg-[var(--accent-primary)] hover:opacity-90 text-white text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <CalendarPlus className="w-3.5 h-3.5" />
                  <span>Extend Package</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
