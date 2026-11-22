"use client";

import React, { useState, useEffect } from "react";
import type {
  CateringCrmDashboardData,
  EnrichedCateringCustomer,
  MealSlot,
  CateringProgramCategory,
  DailyDispatchItem,
  EnrichedCateringPackage,
} from "@/lib/catering";
import { generateInvoiceForPackage } from "@/lib/catering-invoice";
import {
  generateDispatchWhatsAppText,
  generateRenewalWhatsAppText,
  generatePortalShareWhatsAppText,
  generateSkipConfirmationWhatsAppText,
} from "@/lib/catering-whatsapp";

import {
  formatShortDate,
  type ActiveCellState,
  type WhatsAppModalState,
  type InvoiceModalState,
} from "@/components/catering/types";
import { CateringHeader } from "@/components/catering/CateringHeader";
import { CateringDiagnostics } from "@/components/catering/CateringDiagnostics";
import { CateringKpiStrip } from "@/components/catering/CateringKpiStrip";
import { CateringMatrixView } from "@/components/catering/CateringMatrixView";
import { CateringDispatchView } from "@/components/catering/CateringDispatchView";
import { CateringCrmView } from "@/components/catering/CateringCrmView";
import { CateringSlotModal } from "@/components/catering/CateringSlotModal";
import { CateringExtendModal } from "@/components/catering/CateringExtendModal";
import { CateringCustomerModal } from "@/components/catering/CateringCustomerModal";
import { CateringWhatsAppModal } from "@/components/catering/CateringWhatsAppModal";
import { CateringManifestModal } from "@/components/catering/CateringManifestModal";
import { CateringInvoiceModal } from "@/components/catering/CateringInvoiceModal";

export default function HerboxCateringCrmPage() {
  const [data, setData] = useState<CateringCrmDashboardData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedMonth, setSelectedMonth] = useState<string>("2026-09");
  const [selectedDate, setSelectedDate] = useState<string>("2026-09-29");
  const [activeView, setActiveView] = useState<
    "matrix" | "dispatch" | "crm" | "all"
  >("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [showDiagnostics, setShowDiagnostics] = useState<boolean>(false);
  const [bannerNotice, setBannerNotice] = useState<string | null>(null);
  const [mutating, setMutating] = useState<boolean>(false);

  // Interactive Cell Editor Modal State
  const [activeCell, setActiveCell] = useState<ActiveCellState | null>(null);
  const [cellNoteInput, setCellNoteInput] = useState<string>("");
  const [cellAutoRollover, setCellAutoRollover] = useState<boolean>(true);

  // Extend / Renew Package Modal State
  const [extendModalOpen, setExtendModalOpen] = useState<boolean>(false);
  const [extendCustomerId, setExtendCustomerId] = useState<string>("CUST-YOLA");
  const [extendPkgName, setExtendPkgName] =
    useState<string>("5 Days · 5 Box Plan");
  const [extendTotalBoxes, setExtendTotalBoxes] = useState<number>(5);
  const [extendStartDate, setExtendStartDate] = useState<string>("2026-10-01");
  const [extendPricePerBox, setExtendPricePerBox] = useState<number>(45000);
  const [extendDays, setExtendDays] = useState<string[]>([
    "MON",
    "TUE",
    "WED",
    "THU",
    "FRI",
  ]);
  const [extendSlotMode, setExtendSlotMode] = useState<"L" | "D" | "L+D">("D");
  const extendAutoSchedule = true;
  const [extendNote, setExtendNote] = useState<string>("");

  // Customer CRM Profile Modal State
  const [customerModalOpen, setCustomerModalOpen] = useState<boolean>(false);
  const [editingCustomerId, setEditingCustomerId] = useState<string | null>(
    null
  );
  const [custName, setCustName] = useState<string>("");
  const [custCategory, setCustCategory] =
    useState<CateringProgramCategory>("LUNCH_OR_DINNER");
  const [custPhone, setCustPhone] = useState<string>("");
  const [custAddress, setCustAddress] = useState<string>("");
  const [custDietary, setCustDietary] = useState<string>("");
  const [custDefaultDays, setCustDefaultDays] = useState<string[]>([
    "MON",
    "TUE",
    "WED",
    "THU",
    "FRI",
  ]);
  const [custDefaultSlot, setCustDefaultSlot] = useState<
    "L" | "D" | "L+D" | "FLEX"
  >("FLEX");
  const [custStatus, setCustStatus] = useState<
    "active" | "completed" | "paused"
  >("active");
  const [custInitialBoxes, setCustInitialBoxes] = useState<number>(5);
  const [custInitialStart, setCustInitialStart] =
    useState<string>("2026-10-01");

  // WhatsApp Action Center Modal State
  const [waModal, setWaModal] = useState<WhatsAppModalState>({
    isOpen: false,
    title: "",
    subtitle: "",
    recipientName: "",
    recipientPhone: "",
    messageText: "",
  });
  const [copiedNotice, setCopiedNotice] = useState<boolean>(false);

  function getBaseUrl(): string {
    if (typeof window !== "undefined") {
      return window.location.origin;
    }
    return "";
  }

  function handleOpenDispatchWa(item: DailyDispatchItem) {
    const origin = getBaseUrl();
    const text = generateDispatchWhatsAppText(item, origin);
    setWaModal({
      isOpen: true,
      title: "WhatsApp Dispatch Alert",
      subtitle: `Send real-time courier dispatch update for ${item.meal_slot === "L" ? "Lunch (L)" : "Dinner (D)"}`,
      recipientName: item.customer_name,
      recipientPhone: item.phone,
      messageText: text,
      portalUrl: origin ? `${origin}/catering/portal/${item.customer_id}` : undefined,
    });
  }

  function handleOpenRenewalWa(cust: EnrichedCateringCustomer) {
    const origin = getBaseUrl();
    const text = generateRenewalWhatsAppText(cust, origin);
    setWaModal({
      isOpen: true,
      title: "WhatsApp Subscription Renewal",
      subtitle: `Send proactive renewal nudge — sisa ${cust.active_boxes_left_to_deliver} box, projected finish: ${formatShortDate(cust.projected_last_date)}`,
      recipientName: cust.customer_name,
      recipientPhone: cust.phone,
      messageText: text,
      portalUrl: origin ? `${origin}/catering/portal/${cust.customer_id}` : undefined,
    });
  }

  function handleOpenPortalShareWa(cust: EnrichedCateringCustomer) {
    const origin = getBaseUrl();
    const text = generatePortalShareWhatsAppText(cust, origin);
    setWaModal({
      isOpen: true,
      title: "Customer Self-Service Magic Link",
      subtitle: `Share personalized catering portal so Kak ${cust.customer_name} can view quota and skip/swap meals`,
      recipientName: cust.customer_name,
      recipientPhone: cust.phone,
      messageText: text,
      portalUrl: origin ? `${origin}/catering/portal/${cust.customer_id}` : undefined,
    });
  }

  function handleOpenSkipConfirmationWa(cell: ActiveCellState) {
    const sisa = cell.customer.active_boxes_left_to_deliver;
    const text = generateSkipConfirmationWhatsAppText(
      cell.customer.customer_name,
      cell.date,
      cell.slot,
      sisa,
      cell.customer.projected_last_date
    );
    setWaModal({
      isOpen: true,
      title: "WhatsApp Skip Confirmation",
      subtitle: `Notify Kak ${cell.customer.customer_name} that ${cell.date} (${cell.slot === "L" ? "Lunch" : "Dinner"}) is OFF and quota is safely rolled forward`,
      recipientName: cell.customer.customer_name,
      recipientPhone: cell.customer.phone,
      messageText: text,
      portalUrl: `${getBaseUrl()}/catering/portal/${cell.customer.customer_id}`,
    });
  }

  async function copyToClipboard(text: string, label = "Text") {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedNotice(true);
      setBannerNotice(`Copied ${label} to clipboard!`);
      setTimeout(() => {
        setCopiedNotice(false);
      }, 2500);
    } catch (e) {
      console.error("Clipboard copy failed", e);
    }
  }

  // Dispatch Manifest Print & Export State
  const [printManifestModalOpen, setPrintManifestModalOpen] =
    useState<boolean>(false);
  const [printSlotFilter, setPrintSlotFilter] = useState<"ALL" | "L" | "D">(
    "ALL"
  );

  function handleExportManifestCsv() {
    if (!data?.daily_manifest) return;
    const manifest = data.daily_manifest;
    const rows: string[][] = [
      [
        "Date",
        "Slot",
        "Customer Name",
        "Phone",
        "Delivery Address",
        "Plan Category",
        "Package Name",
        "Box Qty",
        "Dietary / Menu Notes",
        "Remaining Boxes",
        "Status",
      ],
    ];

    for (const item of manifest.lunch_items) {
      rows.push([
        selectedDate,
        "Lunch (L)",
        `"${item.customer_name.replace(/"/g, '""')}"`,
        `"${item.phone}"`,
        `"${(item.delivery_address || "").replace(/"/g, '""')}"`,
        item.category === "LAUK" ? "Lauk Only" : "Ricebox",
        `"${item.package_name}"`,
        String(item.box_qty),
        `"${(item.menu_note || "").replace(/"/g, '""')}"`,
        String(item.boxes_left_to_deliver),
        item.status,
      ]);
    }

    for (const item of manifest.dinner_items) {
      rows.push([
        selectedDate,
        "Dinner (D)",
        `"${item.customer_name.replace(/"/g, '""')}"`,
        `"${item.phone}"`,
        `"${(item.delivery_address || "").replace(/"/g, '""')}"`,
        item.category === "LAUK" ? "Lauk Only" : "Ricebox",
        `"${item.package_name}"`,
        String(item.box_qty),
        `"${(item.menu_note || "").replace(/"/g, '""')}"`,
        String(item.boxes_left_to_deliver),
        item.status,
      ]);
    }

    const csvContent = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `herbox-dispatch-manifest-${selectedDate}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setBannerNotice(
      `Exported Courier Dispatch CSV for ${formatShortDate(selectedDate)}`
    );
    setTimeout(() => setBannerNotice(null), 3500);
  }

  // Digital Invoice Modal State
  const [invoiceModal, setInvoiceModal] = useState<InvoiceModalState>({
    isOpen: false,
    data: null,
    cust: null,
    pkg: null,
  });

  function handleOpenInvoice(
    cust: EnrichedCateringCustomer,
    pkg: EnrichedCateringPackage
  ) {
    const invData = generateInvoiceForPackage(cust, pkg);
    setInvoiceModal({
      isOpen: true,
      data: invData,
      cust,
      pkg,
    });
  }

  async function handleTogglePaymentStatus(
    packageId: string,
    currentStatus: string
  ) {
    const nextStatus = currentStatus === "paid" ? "pending" : "paid";
    setMutating(true);
    try {
      const res = await fetch("/api/catering", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "update_payment_status",
          package_id: packageId,
          payment_status: nextStatus,
          month: selectedMonth,
          date: selectedDate,
        }),
      });
      const json = await res.json();
      if (json.success && json.data) {
        setData(json.data);
        if (invoiceModal.isOpen && invoiceModal.data?.package_id === packageId) {
          setInvoiceModal((prev) =>
            prev.data
              ? {
                  ...prev,
                  data: {
                    ...prev.data,
                    payment_status: nextStatus as "paid" | "pending",
                  },
                }
              : prev
          );
        }
        setBannerNotice(`Updated payment status to ${nextStatus.toUpperCase()}`);
        setTimeout(() => setBannerNotice(null), 3000);
      }
    } finally {
      setMutating(false);
    }
  }

  async function fetchDashboard(month = selectedMonth, date = selectedDate) {
    setLoading(true);
    try {
      const qs = new URLSearchParams({ month, date });
      const res = await fetch(`/api/catering?${qs.toString()}`, {
        cache: "no-store",
      });
      const json = await res.json();
      if (json.success && json.data) {
        setData(json.data);
      }
    } catch (err) {
      console.error("Failed to fetch Herbox Catering CRM:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchDashboard(selectedMonth, selectedDate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleSelectMonth(newMonth: string) {
    setSelectedMonth(newMonth);
    const nextDate =
      newMonth === "2026-09"
        ? "2026-09-29"
        : selectedDate.startsWith(newMonth)
        ? selectedDate
        : `${newMonth}-01`;
    setSelectedDate(nextDate);
    fetchDashboard(newMonth, nextDate);
  }

  function handleSelectDate(newDate: string) {
    const m = newDate.slice(0, 7);
    setSelectedDate(newDate);
    if (
      m !== selectedMonth &&
      ["2026-08", "2026-09", "2026-10", "2026-11"].includes(m)
    ) {
      setSelectedMonth(m);
      fetchDashboard(m, newDate);
    } else {
      fetchDashboard(selectedMonth, newDate);
    }
  }

  function stepSelectedDate(deltaDays: number) {
    const [y, m, d] = selectedDate.split("-").map(Number);
    const dt = new Date(Date.UTC(y, m - 1, d + deltaDays));
    const nextDate = dt.toISOString().slice(0, 10);
    handleSelectDate(nextDate);
  }

  async function handleSlotAction(
    customer_id: string,
    delivery_date: string,
    meal_slot: MealSlot,
    slot_action: "schedule" | "skip" | "clear" | "swap_slot",
    menu_note?: string,
    auto_rollover = true
  ) {
    setMutating(true);
    try {
      const res = await fetch("/api/catering", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "update_slot",
          customer_id,
          delivery_date,
          meal_slot,
          slot_action,
          menu_note,
          auto_rollover,
          month: selectedMonth,
          date: selectedDate,
        }),
      });
      const json = await res.json();
      if (json.success && json.data) {
        setData(json.data);
        setActiveCell(null);
        if (slot_action === "skip") {
          setBannerNotice(
            json.rolledOverToDate
              ? `Marked ${delivery_date} (${meal_slot}) as OFF — Box quota preserved & auto-rolled over to ${formatShortDate(
                  json.rolledOverToDate
                )}!`
              : `Marked ${delivery_date} (${meal_slot}) as OFF (Skipped).`
          );
        } else if (slot_action === "swap_slot") {
          const other = meal_slot === "L" ? "Dinner (D)" : "Lunch (L)";
          setBannerNotice(`Swapped ${delivery_date} meal slot to ${other}.`);
        } else if (slot_action === "schedule") {
          setBannerNotice(
            `Scheduled 1 box on ${formatShortDate(delivery_date)} (${
              meal_slot === "L" ? "Lunch" : "Dinner"
            }).`
          );
        } else {
          setBannerNotice(
            `Cleared slot on ${formatShortDate(delivery_date)} (${meal_slot}).`
          );
        }
        setTimeout(() => setBannerNotice(null), 5000);
      }
    } finally {
      setMutating(false);
    }
  }

  function openExtendModalForCustomer(cust?: EnrichedCateringCustomer) {
    const target = cust || data?.customers[0];
    if (target) {
      setExtendCustomerId(target.customer_id);
      const daysArr = (target.default_days || "MON,TUE,WED,THU,FRI")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      setExtendDays(daysArr);
      if (target.category === "LAUK") {
        setExtendPkgName("Lauk Only Routine (Mon & Thu · L+D)");
        setExtendTotalBoxes(16);
        setExtendSlotMode("L+D");
        setExtendPricePerBox(38000);
      } else if (target.default_slot === "L+D") {
        setExtendPkgName("5 Days · 10 Box Plan (L+D)");
        setExtendTotalBoxes(10);
        setExtendSlotMode("L+D");
        setExtendPricePerBox(46000);
      } else {
        setExtendPkgName("5 Days · 5 Box Plan");
        setExtendTotalBoxes(5);
        setExtendSlotMode(target.default_slot === "D" ? "D" : "L");
        setExtendPricePerBox(48000);
      }
      const baseStart =
        target.projected_last_date && target.projected_last_date >= "2026-09-29"
          ? target.projected_last_date
          : "2026-10-01";
      setExtendStartDate(baseStart);
      setExtendNote("");
    }
    setExtendModalOpen(true);
  }

  async function handleExtendPackageSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMutating(true);
    try {
      const res = await fetch("/api/catering", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "extend_package",
          customer_id: extendCustomerId,
          package_name: extendPkgName,
          total_boxes: extendTotalBoxes,
          start_date: extendStartDate,
          price_per_box: extendPricePerBox,
          default_days: extendDays.join(","),
          meal_slot_mode: extendSlotMode,
          auto_generate_schedule: extendAutoSchedule,
          sheet_note: extendNote,
          month: selectedMonth,
          date: selectedDate,
        }),
      });
      const json = await res.json();
      if (json.success && json.data) {
        setData(json.data);
        setExtendModalOpen(false);
        setBannerNotice(
          `Created "${extendPkgName}" (${extendTotalBoxes} boxes) · Auto-scheduled ${
            json.generated_slots || 0
          } slots through ${formatShortDate(json.last_date)}!`
        );
        setTimeout(() => setBannerNotice(null), 5500);
      }
    } finally {
      setMutating(false);
    }
  }

  function openNewCustomerModal() {
    setEditingCustomerId(null);
    setCustName("");
    setCustCategory("LUNCH_OR_DINNER");
    setCustPhone("+62 812-");
    setCustAddress("");
    setCustDietary("Flexible 1 box/day (Mon–Fri)");
    setCustDefaultDays(["MON", "TUE", "WED", "THU", "FRI"]);
    setCustDefaultSlot("FLEX");
    setCustStatus("active");
    setCustInitialBoxes(5);
    setCustInitialStart("2026-10-01");
    setCustomerModalOpen(true);
  }

  function openEditCustomerModal(c: EnrichedCateringCustomer) {
    setEditingCustomerId(c.customer_id);
    setCustName(c.customer_name);
    setCustCategory(c.category);
    setCustPhone(c.phone);
    setCustAddress(c.delivery_address);
    setCustDietary(c.dietary_notes);
    setCustDefaultDays(
      (c.default_days || "MON,TUE,WED,THU,FRI")
        .split(",")
        .map((d) => d.trim())
        .filter(Boolean)
    );
    setCustDefaultSlot(
      (c.default_slot as "L" | "D" | "L+D" | "FLEX") || "FLEX"
    );
    setCustStatus(c.status);
    setCustInitialBoxes(0);
    setCustomerModalOpen(true);
  }

  async function handleCustomerSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMutating(true);
    try {
      const res = await fetch("/api/catering", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "upsert_customer",
          customer_id: editingCustomerId || undefined,
          customer_name: custName,
          category: custCategory,
          phone: custPhone,
          delivery_address: custAddress,
          dietary_notes: custDietary,
          default_days: custDefaultDays.join(","),
          default_slot: custDefaultSlot,
          status: custStatus,
          initial_package_boxes: editingCustomerId ? 0 : custInitialBoxes,
          initial_start_date: custInitialStart,
          month: selectedMonth,
          date: selectedDate,
        }),
      });
      const json = await res.json();
      if (json.success && json.data) {
        setData(json.data);
        setCustomerModalOpen(false);
        setBannerNotice(
          editingCustomerId
            ? `Updated subscriber profile for ${custName}.`
            : `Added subscriber ${custName} with ${custInitialBoxes}-box catering schedule!`
        );
        setTimeout(() => setBannerNotice(null), 5000);
      }
    } finally {
      setMutating(false);
    }
  }

  if (loading && !data) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1640px] mx-auto">
        <div className="h-36 cockpit-panel rounded-2xl animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-28 cockpit-panel rounded-2xl animate-pulse" />
          ))}
        </div>
        <div className="h-96 cockpit-panel rounded-2xl animate-pulse" />
      </div>
    );
  }

  if (!data) return null;

  const {
    kpi,
    customers,
    calendar_days,
    matrix,
    daily_manifest,
    available_months,
    sheet_Diagnostics,
  } = data;

  const renewalCandidates = customers.filter(
    (c) =>
      c.renewal_urgency === "critical" ||
      c.renewal_urgency === "soon" ||
      c.renewal_urgency === "inactive"
  );

  const showMatrix = activeView === "matrix" || activeView === "all";
  const showDispatch = activeView === "dispatch" || activeView === "all";
  const showCrm = activeView === "crm" || activeView === "all";

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1640px] mx-auto">
      {/* 1. Header Command Banner & Navigation */}
      <CateringHeader
        selectedMonth={selectedMonth}
        onSelectMonth={handleSelectMonth}
        availableMonths={available_months}
        activeView={activeView}
        setActiveView={setActiveView}
        showDiagnostics={showDiagnostics}
        setShowDiagnostics={setShowDiagnostics}
        onOpenExtendModal={() => openExtendModalForCustomer()}
        onOpenNewCustomerModal={openNewCustomerModal}
        bannerNotice={bannerNotice}
        onDismissBanner={() => setBannerNotice(null)}
      />

      {/* Sheet Cleanup Diagnostic Panel */}
      <CateringDiagnostics
        showDiagnostics={showDiagnostics}
        onClose={() => setShowDiagnostics(false)}
        diagnostics={sheet_Diagnostics}
      />

      {/* 2 & 3. Executive KPI Telemetry Strip & Renewal Pipeline Radar */}
      <CateringKpiStrip
        kpi={kpi}
        selectedMonth={selectedMonth}
        selectedDate={selectedDate}
        onSelectDate={handleSelectDate}
        renewalCandidates={renewalCandidates}
        onOpenRenewalWa={handleOpenRenewalWa}
        onOpenExtendModal={openExtendModalForCustomer}
      />

      {/* 4. Interactive Monthly L/D Schedule Matrix */}
      {showMatrix && (
        <CateringMatrixView
          selectedMonth={selectedMonth}
          selectedDate={selectedDate}
          onSelectDate={handleSelectDate}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          categoryFilter={categoryFilter}
          setCategoryFilter={setCategoryFilter}
          calendarDays={calendar_days}
          customers={customers}
          matrix={matrix}
          onCellClick={(cell) => {
            setActiveCell(cell);
            setCellNoteInput(cell.existing?.menu_note || "");
            setCellAutoRollover(true);
          }}
          onOpenEditCustomerModal={openEditCustomerModal}
          onOpenExtendModal={openExtendModalForCustomer}
        />
      )}

      {/* 5. Daily Kitchen Prep & Courier Dispatch Manifest */}
      {showDispatch && (
        <CateringDispatchView
          dailyManifest={daily_manifest}
          selectedDate={selectedDate}
          onSelectDate={handleSelectDate}
          stepSelectedDate={stepSelectedDate}
          onOpenPrintManifest={() => setPrintManifestModalOpen(true)}
          onExportManifestCsv={handleExportManifestCsv}
          onOpenDispatchWa={handleOpenDispatchWa}
          onCopyText={copyToClipboard}
          onSlotAction={handleSlotAction}
          mutating={mutating}
          baseUrl={getBaseUrl()}
        />
      )}

      {/* 6. Subscriber CRM Directory & Package History Cards */}
      {showCrm && (
        <CateringCrmView
          customers={customers}
          categoryFilter={categoryFilter}
          searchQuery={searchQuery}
          onOpenEditCustomerModal={openEditCustomerModal}
          onOpenExtendModal={openExtendModalForCustomer}
          onTogglePaymentStatus={handleTogglePaymentStatus}
          onOpenInvoice={handleOpenInvoice}
          onOpenPortalShareWa={handleOpenPortalShareWa}
          onCopyText={copyToClipboard}
          baseUrl={getBaseUrl()}
        />
      )}

      {/* MODAL 1: Interactive Cell Action Popover */}
      <CateringSlotModal
        activeCell={activeCell}
        onClose={() => setActiveCell(null)}
        cellNoteInput={cellNoteInput}
        setCellNoteInput={setCellNoteInput}
        cellAutoRollover={cellAutoRollover}
        setCellAutoRollover={setCellAutoRollover}
        mutating={mutating}
        onSlotAction={handleSlotAction}
        onOpenSkipConfirmationWa={handleOpenSkipConfirmationWa}
      />

      {/* MODAL 2: Extend / Renew Package with Auto-Schedule */}
      <CateringExtendModal
        isOpen={extendModalOpen}
        onClose={() => setExtendModalOpen(false)}
        customers={customers}
        extendCustomerId={extendCustomerId}
        setExtendCustomerId={setExtendCustomerId}
        onSelectCustomerPreset={openExtendModalForCustomer}
        extendPkgName={extendPkgName}
        setExtendPkgName={setExtendPkgName}
        extendTotalBoxes={extendTotalBoxes}
        setExtendTotalBoxes={setExtendTotalBoxes}
        extendStartDate={extendStartDate}
        setExtendStartDate={setExtendStartDate}
        extendPricePerBox={extendPricePerBox}
        setExtendPricePerBox={setExtendPricePerBox}
        extendDays={extendDays}
        setExtendDays={setExtendDays}
        extendSlotMode={extendSlotMode}
        setExtendSlotMode={setExtendSlotMode}
        onSubmit={handleExtendPackageSubmit}
        mutating={mutating}
      />

      {/* MODAL 3: New / Edit Subscriber CRM Profile */}
      <CateringCustomerModal
        isOpen={customerModalOpen}
        onClose={() => setCustomerModalOpen(false)}
        editingCustomerId={editingCustomerId}
        custName={custName}
        setCustName={setCustName}
        custCategory={custCategory}
        setCustCategory={setCustCategory}
        custPhone={custPhone}
        setCustPhone={setCustPhone}
        custStatus={custStatus}
        setCustStatus={setCustStatus}
        custAddress={custAddress}
        setCustAddress={setCustAddress}
        custDietary={custDietary}
        setCustDietary={setCustDietary}
        custInitialBoxes={custInitialBoxes}
        setCustInitialBoxes={setCustInitialBoxes}
        custInitialStart={custInitialStart}
        setCustInitialStart={setCustInitialStart}
        onSubmit={handleCustomerSubmit}
        mutating={mutating}
      />

      {/* MODAL 4: WhatsApp Action Center & Preview */}
      <CateringWhatsAppModal
        waModal={waModal}
        setWaModal={setWaModal}
        copiedNotice={copiedNotice}
        onCopy={copyToClipboard}
        onClose={() => setWaModal((prev) => ({ ...prev, isOpen: false }))}
      />

      {/* MODAL 5: Printable Dispatch Manifest & Courier Slips */}
      <CateringManifestModal
        isOpen={printManifestModalOpen}
        onClose={() => setPrintManifestModalOpen(false)}
        selectedDate={selectedDate}
        dailyManifest={daily_manifest}
        printSlotFilter={printSlotFilter}
        setPrintSlotFilter={setPrintSlotFilter}
      />

      {/* MODAL 6: Digital Catering Invoice */}
      <CateringInvoiceModal
        invoiceModal={invoiceModal}
        onClose={() =>
          setInvoiceModal({
            isOpen: false,
            data: null,
            cust: null,
            pkg: null,
          })
        }
        onTogglePaymentStatus={handleTogglePaymentStatus}
        mutating={mutating}
      />
    </div>
  );
}
