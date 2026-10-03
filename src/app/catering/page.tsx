"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import type {
  CateringCrmDashboardData,
  EnrichedCateringCustomer,
  CateringDeliveryRow,
  MealSlot,
  CateringProgramCategory,
  DailyDispatchItem,
  EnrichedCateringPackage,
} from "@/lib/catering";
import type { CateringInvoiceData } from "@/lib/catering-invoice";
import { generateInvoiceForPackage } from "@/lib/catering-invoice";
import {
  buildWhatsAppLink,
  generateDispatchWhatsAppText,
  generateRenewalWhatsAppText,
  generatePortalShareWhatsAppText,
  generateSkipConfirmationWhatsAppText,
  generateInvoiceWhatsAppText,
} from "@/lib/catering-whatsapp";
import {
  Calendar,
  Users,
  Boxes,
  Sparkles,
  Plus,
  CheckCircle2,
  Ban,
  ArrowLeftRight,
  Phone,
  MapPin,
  AlertTriangle,
  Utensils,
  Sun,
  Moon,
  ChevronLeft,
  ChevronRight,
  FileSpreadsheet,
  Edit3,
  Trash2,
  Check,
  X,
  Search,
  CalendarPlus,
  Info,
  ShieldCheck,
  MessageSquare,
  Share2,
  ExternalLink,
  Copy,
  Send,
  Smartphone,
  Printer,
  Download,
  Receipt,
} from "lucide-react";

function formatRp(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatShortDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  const parts = dateStr.split("-");
  if (parts.length !== 3) return dateStr;
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const mIdx = parseInt(parts[1], 10) - 1;
  const d = parseInt(parts[2], 10);
  return `${d} ${months[mIdx] || parts[1]} ${parts[0]}`;
}

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

  // Interactive Cell Editor Modal/Popover State
  const [activeCell, setActiveCell] = useState<{
    customer: EnrichedCateringCustomer;
    date: string;
    dowShort: string;
    slot: MealSlot;
    existing?: CateringDeliveryRow;
  } | null>(null);
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
  const [waModal, setWaModal] = useState<{
    isOpen: boolean;
    title: string;
    subtitle: string;
    recipientName: string;
    recipientPhone: string;
    messageText: string;
    portalUrl?: string;
  }>({
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
  const [printManifestModalOpen, setPrintManifestModalOpen] = useState<boolean>(false);
  const [printSlotFilter, setPrintSlotFilter] = useState<"ALL" | "L" | "D">("ALL");

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
    setBannerNotice(`Exported Courier Dispatch CSV for ${formatShortDate(selectedDate)}`);
    setTimeout(() => setBannerNotice(null), 3500);
  }

  // Digital Invoice Modal State
  const [invoiceModal, setInvoiceModal] = useState<{
    isOpen: boolean;
    data: CateringInvoiceData | null;
    cust: EnrichedCateringCustomer | null;
    pkg: EnrichedCateringPackage | null;
  }>({
    isOpen: false,
    data: null,
    cust: null,
    pkg: null,
  });

  function handleOpenInvoice(cust: EnrichedCateringCustomer, pkg: EnrichedCateringPackage) {
    const invData = generateInvoiceForPackage(cust, pkg);
    setInvoiceModal({
      isOpen: true,
      data: invData,
      cust,
      pkg,
    });
  }

  async function handleTogglePaymentStatus(packageId: string, currentStatus: string) {
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
                  data: { ...prev.data, payment_status: nextStatus as "paid" | "pending" },
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
    if (m !== selectedMonth && ["2026-08", "2026-09", "2026-10", "2026-11"].includes(m)) {
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
          setBannerNotice(
            `Swapped ${delivery_date} meal slot to ${other}.`
          );
        } else if (slot_action === "schedule") {
          setBannerNotice(
            `Scheduled 1 box on ${formatShortDate(delivery_date)} (${
              meal_slot === "L" ? "Lunch" : "Dinner"
            }).`
          );
        } else {
          setBannerNotice(`Cleared slot on ${formatShortDate(delivery_date)} (${meal_slot}).`);
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

  function toggleDayInList(day: string, list: string[], setter: (v: string[]) => void) {
    if (list.includes(day)) {
      if (list.length > 1) setter(list.filter((d) => d !== day));
    } else {
      setter([...list, day]);
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

  const { kpi, customers, calendar_days, matrix, daily_manifest, available_months } =
    data;

  const filteredCustomers = customers.filter((c) => {
    if (categoryFilter !== "all" && c.category !== categoryFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        c.customer_name.toLowerCase().includes(q) ||
        c.dietary_notes.toLowerCase().includes(q) ||
        c.delivery_address.toLowerCase().includes(q) ||
        c.sheet_raw_label.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const groupedCategories: Array<{
    key: CateringProgramCategory;
    title: string;
    sheetHeader: string;
    subtitle: string;
    badgeClass: string;
  }> = [
    {
      key: "LUNCH_DINNER",
      title: "Full Day Catering (Lunch + Dinner)",
      sheetHeader: "LUNCH DINNER",
      subtitle: "2 meals/day routine · Fixed Lunch (L) & Dinner (D)",
      badgeClass: "badge-purple",
    },
    {
      key: "LAUK",
      title: "Lauk Only Program (No Rice)",
      sheetHeader: "LAUK",
      subtitle: "Plant-based protein & side dishes only · Scheduled L & D pairs",
      badgeClass: "badge-blue",
    },
    {
      key: "LUNCH_OR_DINNER",
      title: "Flexible Box Program (Lunch / Dinner)",
      sheetHeader: "LUNCH/DINNER",
      subtitle: "Flexible 1 or 2 box/day · Can skip dates (OFF) & swap L ↔ D",
      badgeClass: "badge-emerald",
    },
  ];

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
      {/* =========================================================================
          1. HERO COMMAND BANNER
          ========================================================================= */}
      <div className="cockpit-panel rounded-2xl p-5 sm:p-6 relative overflow-hidden accent-bar-emerald">
        <div
          className="absolute top-0 right-0 w-[440px] h-[260px] rounded-full blur-3xl opacity-15 pointer-events-none"
          style={{ backgroundColor: "#10b981" }}
        />

        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-5 relative z-10">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Link
                href="/brands/herbox"
                className="inline-flex items-center gap-1.5 text-[11px] font-mono text-emerald-700 dark:text-emerald-300 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 font-semibold hover:bg-emerald-500/20 transition-colors"
              >
                <Utensils className="w-3 h-3" />
                <span>Herbox Culinary Concept</span>
              </Link>
              <span className="badge-emerald px-2.5 py-0.5 rounded-full text-[11px] font-mono font-semibold inline-flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                Flexible Skip & Quota Rollover Engine
              </span>
              <span className="text-[11px] font-mono bg-[var(--bg-surface-2)] border border-[var(--border-subtle)] text-[var(--text-secondary)] px-2.5 py-0.5 rounded-full">
                Digitalized from Aug 2026 (AGS 26 – NOV 26)
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text-primary)] font-display">
              Herbox Personal Catering CRM & Schedule Matrix
            </h1>
            <p className="text-xs sm:text-sm text-[var(--text-secondary)] max-w-3xl">
              Unified subscriber quota tracker, 1-click flexible date skipping (
              <code className="font-mono text-xs px-1 py-0.5 rounded bg-[var(--bg-surface-2)]">
                OFF
              </code>{" "}
              auto-extends{" "}
              <code className="font-mono text-xs px-1 py-0.5 rounded bg-[var(--bg-surface-2)]">
                Last Date
              </code>
              ), Lunch ↔ Dinner slot swapping, and daily kitchen dispatch manifest.
            </p>
          </div>

          {/* Right Action Controls */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => setShowDiagnostics(!showDiagnostics)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all inline-flex items-center gap-2 cursor-pointer ${
                showDiagnostics
                  ? "bg-amber-500/15 border-amber-500/40 text-amber-700 dark:text-amber-300"
                  : "bg-[var(--bg-surface-2)] border-[var(--border-default)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
            >
              <FileSpreadsheet className="w-4 h-4 text-amber-500" />
              <span>Sheet Cleanup Audit (4 Fixes)</span>
            </button>

            <button
              type="button"
              onClick={() => openExtendModalForCustomer()}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-[var(--bg-surface-2)] hover:bg-[var(--bg-surface-3)] border border-[var(--border-strong)] text-[var(--text-primary)] transition-all inline-flex items-center gap-2 cursor-pointer"
            >
              <CalendarPlus className="w-4 h-4 text-emerald-500" />
              <span>Extend / Renew Package</span>
            </button>

            <button
              type="button"
              onClick={openNewCustomerModal}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-[var(--accent-primary)] hover:opacity-95 text-white shadow-sm transition-all inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>New Subscriber</span>
            </button>
          </div>
        </div>

        {/* Month Tabs (AGS 26, SEPT 26, OKT 26, NOV 26) & View Selector */}
        <div className="mt-5 pt-4 border-t border-[var(--border-subtle)] flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-mono uppercase tracking-wider text-[var(--text-muted)] mr-1.5 font-semibold">
              Sheet Month:
            </span>
            {available_months.map((m) => {
              const isSelected = m.month_key === selectedMonth;
              return (
                <button
                  key={m.month_key}
                  type="button"
                  onClick={() => handleSelectMonth(m.month_key)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-medium transition-all flex items-center gap-2 cursor-pointer border ${
                    isSelected
                      ? "bg-[var(--accent-primary)] text-white border-transparent shadow-xs font-semibold"
                      : "bg-[var(--bg-surface-2)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border-[var(--border-subtle)]"
                  }`}
                >
                  <Calendar className="w-3.5 h-3.5 opacity-80" />
                  <span>{m.short_label}</span>
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                      isSelected
                        ? "bg-white/20 text-white"
                        : "bg-[var(--bg-surface)] text-[var(--text-muted)]"
                    }`}
                  >
                    {m.sheet_name} · {m.delivered_boxes + m.scheduled_boxes} box
                  </span>
                </button>
              );
            })}
          </div>

          {/* Workspace View Mode Switcher */}
          <div className="inline-flex items-center p-1 rounded-xl surface-well self-start lg:self-auto">
            {[
              { id: "all", label: "All-in-One Cockpit" },
              { id: "matrix", label: "L/D Schedule Matrix" },
              { id: "dispatch", label: "Daily Kitchen Prep" },
              { id: "crm", label: "Subscriber CRM" },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() =>
                  setActiveView(
                    tab.id as "matrix" | "dispatch" | "crm" | "all"
                  )
                }
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  activeView === tab.id
                    ? "bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-xs border border-[var(--border-default)]"
                    : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Feedback Toast Banner */}
      {bannerNotice && (
        <div className="cockpit-panel rounded-xl p-3.5 border-emerald-500/40 bg-emerald-500/10 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 text-xs font-semibold text-emerald-800 dark:text-emerald-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>{bannerNotice}</span>
          </div>
          <button
            type="button"
            onClick={() => setBannerNotice(null)}
            className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* =========================================================================
          COLLAPSIBLE GOOGLE SHEET CLEANUP DIAGNOSTIC PANEL
          ========================================================================= */}
      {showDiagnostics && (
        <div className="cockpit-panel rounded-2xl p-5 space-y-4 accent-bar-amber">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <FileSpreadsheet className="w-5 h-5 text-amber-500" />
              <div>
                <h2 className="text-sm font-bold text-[var(--text-primary)]">
                  Google Sheet Digitization & Data Cleanup Report (From August 2026)
                </h2>
                <p className="text-xs text-[var(--text-secondary)]">
                  Here is what made the original Google Sheet messy and how this CRM standardizes it automatically:
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowDiagnostics(false)}
              className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {data.sheet_Diagnostics.map((d) => (
              <div
                key={d.id}
                className="p-3.5 rounded-xl bg-[var(--bg-surface-2)] border border-[var(--border-default)] space-y-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-[var(--text-primary)]">
                    {d.customer_name}
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--text-secondary)]">
                    Tab: {d.sheet_tab}
                  </span>
                </div>
                <div className="text-xs text-rose-600 dark:text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-lg p-2">
                  <span className="font-mono font-semibold uppercase text-[10px] mr-1">
                    Before (Sheet):
                  </span>
                  {d.raw_issue}
                </div>
                <div className="text-xs text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-2">
                  <span className="font-mono font-semibold uppercase text-[10px] mr-1">
                    After (CRM):
                  </span>
                  {d.digital_solution}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =========================================================================
          2. EXECUTIVE KPI TELEMETRY STRIP
          ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Card 1: Active Subscribers */}
        <div className="cockpit-panel rounded-2xl p-4 space-y-2 accent-bar-emerald">
          <div className="flex items-center justify-between text-xs text-[var(--text-secondary)]">
            <span className="font-mono uppercase tracking-wider text-[10px] font-semibold">
              Active Subscribers
            </span>
            <Users className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-display tabular-nums text-[var(--text-primary)]">
              {kpi.active_subscribers}
            </span>
            <span className="text-xs text-[var(--text-muted)] font-mono">
              / {kpi.total_customers} roster
            </span>
          </div>
          <div className="text-[11px] text-[var(--text-secondary)] flex items-center justify-between pt-1 border-t border-[var(--border-subtle)]">
            <span>4 Flex L/D · 1 Lauk Only</span>
            <span className="badge-emerald px-1.5 py-0.5 rounded text-[10px] font-mono">
              Aug–Nov 26
            </span>
          </div>
        </div>

        {/* Card 2: Month Box Throughput */}
        <div className="cockpit-panel rounded-2xl p-4 space-y-2 accent-bar-blue">
          <div className="flex items-center justify-between text-xs text-[var(--text-secondary)]">
            <span className="font-mono uppercase tracking-wider text-[10px] font-semibold">
              {MONTH_LABELS_SHORT[selectedMonth] || selectedMonth} Box Volume
            </span>
            <Boxes className="w-4 h-4 text-sky-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-display tabular-nums text-[var(--text-primary)]">
              {kpi.month_total_boxes}
            </span>
            <span className="text-xs text-[var(--text-muted)] font-mono">
              boxes ({kpi.month_lunch_boxes}L · {kpi.month_dinner_boxes}D)
            </span>
          </div>
          <div className="text-[11px] text-[var(--text-secondary)] flex items-center justify-between pt-1 border-t border-[var(--border-subtle)]">
            <span>
              {kpi.month_delivered_boxes} delivered · {kpi.month_scheduled_boxes}{" "}
              scheduled
            </span>
            <span className="font-mono text-[10px] text-sky-600 dark:text-sky-400 font-semibold">
              {kpi.month_lauk_boxes} Lauk
            </span>
          </div>
        </div>

        {/* Card 3: Remaining Box Liability (Sisa Box) */}
        <div className="cockpit-panel rounded-2xl p-4 space-y-2 accent-bar-purple">
          <div className="flex items-center justify-between text-xs text-[var(--text-secondary)]">
            <span className="font-mono uppercase tracking-wider text-[10px] font-semibold">
              Remaining Quota (Sisa Box)
            </span>
            <ShieldCheck className="w-4 h-4 text-purple-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-display tabular-nums text-[var(--text-primary)]">
              {kpi.total_remaining_liability_boxes}
            </span>
            <span className="text-xs text-[var(--text-muted)] font-mono">
              boxes owed
            </span>
          </div>
          <div className="text-[11px] text-[var(--text-secondary)] flex items-center justify-between pt-1 border-t border-[var(--border-subtle)]">
            <span>Across active paid packages</span>
            <span className="badge-purple px-1.5 py-0.5 rounded text-[10px] font-mono">
              Live Balance
            </span>
          </div>
        </div>

        {/* Card 4: Flexible Skips (OFF) */}
        <div className="cockpit-panel rounded-2xl p-4 space-y-2 accent-bar-amber">
          <div className="flex items-center justify-between text-xs text-[var(--text-secondary)]">
            <span className="font-mono uppercase tracking-wider text-[10px] font-semibold">
              Flexible Skips (OFF)
            </span>
            <Ban className="w-4 h-4 text-amber-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-display tabular-nums text-[var(--text-primary)]">
              {kpi.month_skipped_slots}
            </span>
            <span className="text-xs text-[var(--text-muted)] font-mono">
              skipped slots in month
            </span>
          </div>
          <div className="text-[11px] text-[var(--text-secondary)] flex items-center justify-between pt-1 border-t border-[var(--border-subtle)]">
            <span>0 boxes lost · Auto-rolled over</span>
            <span className="badge-amber px-1.5 py-0.5 rounded text-[10px] font-mono">
              Flex OFF
            </span>
          </div>
        </div>

        {/* Card 5: Selected Date Dispatch */}
        <div className="cockpit-panel rounded-2xl p-4 space-y-2 accent-bar-terracotta">
          <div className="flex items-center justify-between text-xs text-[var(--text-secondary)]">
            <span className="font-mono uppercase tracking-wider text-[10px] font-semibold">
              Dispatch ({formatShortDate(selectedDate)})
            </span>
            <Utensils className="w-4 h-4 text-orange-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-display tabular-nums text-[var(--text-primary)]">
              {kpi.selected_date_total_boxes}
            </span>
            <span className="text-xs text-[var(--text-muted)] font-mono">
              boxes ({kpi.selected_date_lunch_boxes} Lunch ·{" "}
              {kpi.selected_date_dinner_boxes} Dinner)
            </span>
          </div>
          <div className="text-[11px] text-[var(--text-secondary)] flex items-center justify-between pt-1 border-t border-[var(--border-subtle)]">
            <span>
              {kpi.selected_date_skipped > 0
                ? `${kpi.selected_date_skipped} slot(s) marked OFF`
                : "No skips on this date"}
            </span>
            <button
              type="button"
              onClick={() => handleSelectDate("2026-09-29")}
              className="text-[10px] font-mono text-[var(--accent-primary)] hover:underline cursor-pointer font-semibold"
            >
              Jump Today
            </button>
          </div>
        </div>
      </div>

      {/* =========================================================================
          3. LOW QUOTA / RENEWAL PIPELINE ALERT STRIP
          ========================================================================= */}
      {renewalCandidates.length > 0 && (
        <div className="cockpit-panel rounded-2xl p-4 border-amber-500/30 bg-amber-500/5">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div className="flex items-start sm:items-center gap-3">
              <div className="p-2 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-600 dark:text-amber-400 shrink-0">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-[var(--text-primary)] flex items-center gap-2">
                  <span>Subscription Renewal & Follow-Up Radar</span>
                  <span className="badge-amber px-2 py-0.5 rounded-full text-[10px] font-mono">
                    {renewalCandidates.length} Subscribers Need Attention
                  </span>
                </div>
                <p className="text-xs text-[var(--text-secondary)]">
                  Replaces manual &quot;sisa X box&quot; notes in Column B — automatically flags subscribers approaching their Last Date:
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {renewalCandidates.map((rc) => (
                <div
                  key={rc.customer_id}
                  className="px-3 py-1.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-default)] flex items-center gap-2.5 text-xs shadow-2xs"
                >
                  <div>
                    <div className="font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                      <span>{rc.customer_name}</span>
                      <span
                        className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${
                          rc.renewal_urgency === "critical"
                            ? "badge-rose"
                            : rc.renewal_urgency === "soon"
                            ? "badge-amber"
                            : "badge-neutral"
                        }`}
                      >
                        {rc.renewal_urgency === "inactive"
                          ? "Completed"
                          : `Sisa ${rc.active_boxes_left_to_deliver} box`}
                      </span>
                    </div>
                    <div className="text-[10px] text-[var(--text-muted)] font-mono">
                      {rc.projected_last_date
                        ? `Last Date: ${formatShortDate(rc.projected_last_date)}`
                        : rc.renewal_reason}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleOpenRenewalWa(rc)}
                      className="px-2 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-700 dark:text-emerald-300 text-[10px] font-semibold inline-flex items-center gap-1 cursor-pointer"
                      title="Send WhatsApp Renewal Nudge"
                    >
                      <MessageSquare className="w-3 h-3" />
                      <span>WA Nudge</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => openExtendModalForCustomer(rc)}
                      className="px-2.5 py-1 rounded-lg bg-[var(--accent-primary)] text-white text-[10px] font-semibold hover:opacity-90 transition-opacity cursor-pointer"
                    >
                      + Extend
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          4. INTERACTIVE MONTHLY L/D SCHEDULE MATRIX (AGS 26 - NOV 26)
          ========================================================================= */}
      {showMatrix && (
        <div className="cockpit-panel rounded-2xl overflow-hidden">
          {/* Matrix Header Controls */}
          <div className="p-4 sm:p-5 border-b border-[var(--border-default)] flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-[var(--text-primary)] font-display">
                  Interactive Monthly Catering Matrix ·{" "}
                  {MONTH_META_DISPLAY[selectedMonth] || selectedMonth}
                </h2>
                <span className="badge-emerald px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold">
                  Click any L / D cell to Schedule, Skip (OFF), or Swap L↔D
                </span>
              </div>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                Click any date column header to inspect that day&apos;s Kitchen Prep & Dispatch Manifest below. Weekend columns (Sabtu/Minggu) are shaded rose.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              {/* Search input */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter subscriber or note..."
                  className="pl-8 pr-3 py-1.5 rounded-xl bg-[var(--bg-surface-2)] border border-[var(--border-default)] text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-primary)] w-48"
                />
              </div>

              {/* Category Filter */}
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-[var(--bg-surface-2)] border border-[var(--border-default)] text-xs font-semibold text-[var(--text-primary)] focus:outline-none cursor-pointer"
              >
                <option value="all">All Programs (3 Categories)</option>
                <option value="LUNCH_OR_DINNER">LUNCH/DINNER (Flexible)</option>
                <option value="LAUK">LAUK ONLY (No Rice)</option>
                <option value="LUNCH_DINNER">LUNCH DINNER (Full Day)</option>
              </select>
            </div>
          </div>

          {/* Legend Bar */}
          <div className="px-4 sm:px-5 py-2.5 bg-[var(--bg-surface-2)] border-b border-[var(--border-subtle)] flex flex-wrap items-center justify-between gap-3 text-[11px]">
            <div className="flex flex-wrap items-center gap-4">
              <span className="flex items-center gap-1.5 font-mono text-[var(--text-secondary)]">
                <span className="w-4 h-4 rounded bg-emerald-500 text-white inline-flex items-center justify-center text-[10px] font-bold">
                  1
                </span>
                <span>Delivered Box (≤ 29 Sep)</span>
              </span>
              <span className="flex items-center gap-1.5 font-mono text-[var(--text-secondary)]">
                <span className="w-4 h-4 rounded bg-emerald-500/20 border border-emerald-500/50 text-emerald-700 dark:text-emerald-300 inline-flex items-center justify-center text-[10px] font-bold">
                  1
                </span>
                <span>Scheduled Box (&gt; 29 Sep)</span>
              </span>
              <span className="flex items-center gap-1.5 font-mono text-[var(--text-secondary)]">
                <span className="w-4 h-4 rounded bg-sky-500 text-white inline-flex items-center justify-center text-[10px] font-bold">
                  V
                </span>
                <span>Lauk Only Portion</span>
              </span>
              <span className="flex items-center gap-1.5 font-mono text-[var(--text-secondary)]">
                <span className="px-1.5 py-0.5 rounded bg-amber-500/20 border border-amber-500/40 text-amber-700 dark:text-amber-300 text-[9px] font-bold">
                  OFF
                </span>
                <span>Customer Skipped (Quota Rolled Over)</span>
              </span>
              <span className="flex items-center gap-1.5 font-mono text-[var(--text-secondary)]">
                <span className="px-1.5 py-0.5 rounded bg-purple-500/20 border border-purple-500/40 text-purple-700 dark:text-purple-300 text-[9px] font-bold">
                  FIN
                </span>
                <span>Package Finish Milestone</span>
              </span>
            </div>
            <div className="font-mono text-[10px] text-[var(--text-muted)]">
              L = Lunch · D = Dinner
            </div>
          </div>

          {/* Scrollable Matrix Table */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-xs">
              <thead>
                {/* Row 1: Day of Week & Day Number */}
                <tr className="bg-[var(--bg-surface-2)] border-b border-[var(--border-default)]">
                  <th
                    rowSpan={2}
                    className="sticky left-0 z-20 bg-[var(--bg-surface-2)] px-3.5 py-2.5 text-left font-mono uppercase tracking-wider text-[10px] text-[var(--text-secondary)] border-r border-[var(--border-default)] min-w-[170px]"
                  >
                    Subscriber (Nama)
                  </th>
                  <th
                    rowSpan={2}
                    className="sticky left-[170px] z-20 bg-[var(--bg-surface-2)] px-3 py-2.5 text-left font-mono uppercase tracking-wider text-[10px] text-[var(--text-secondary)] border-r border-[var(--border-default)] min-w-[210px]"
                  >
                    Active Plan · Quota · Last Date
                  </th>
                  {calendar_days.map((day) => {
                    const isSelectedDay = day.date === selectedDate;
                    return (
                      <th
                        key={day.date}
                        colSpan={2}
                        onClick={() => handleSelectDate(day.date)}
                        title={`Click to view ${day.dow_id}, ${day.date} Kitchen Dispatch (${day.total_boxes} boxes)`}
                        className={`px-1 py-1.5 text-center border-r border-[var(--border-subtle)] cursor-pointer transition-colors select-none min-w-[52px] ${
                          isSelectedDay
                            ? "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-bold"
                            : day.is_today
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                            : day.is_weekend
                            ? "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                            : "hover:bg-[var(--bg-surface-3)] text-[var(--text-primary)]"
                        }`}
                      >
                        <div className="text-[9px] font-mono uppercase tracking-tighter opacity-80">
                          {day.dow_short}
                        </div>
                        <div className="text-xs font-mono font-bold leading-tight flex items-center justify-center gap-0.5">
                          <span>{day.day_num}</span>
                          {day.is_today && (
                            <span
                              className="w-1.5 h-1.5 rounded-full bg-emerald-500"
                              title="Today (29 Sep 2026)"
                            />
                          )}
                        </div>
                      </th>
                    );
                  })}
                </tr>

                {/* Row 2: L | D Sub-columns */}
                <tr className="bg-[var(--bg-surface-2)] border-b border-[var(--border-default)] text-[10px] font-mono">
                  {calendar_days.map((day) => {
                    const isSelectedDay = day.date === selectedDate;
                    return (
                      <React.Fragment key={`${day.date}-ld`}>
                        <th
                          onClick={() => handleSelectDate(day.date)}
                          className={`py-1 px-0.5 text-center border-r border-[var(--border-subtle)] cursor-pointer ${
                            isSelectedDay
                              ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-bold"
                              : day.is_weekend
                              ? "bg-rose-500/5 text-rose-500/80"
                              : "text-amber-600 dark:text-amber-400"
                          }`}
                        >
                          L
                        </th>
                        <th
                          onClick={() => handleSelectDate(day.date)}
                          className={`py-1 px-0.5 text-center border-r border-[var(--border-default)] cursor-pointer ${
                            isSelectedDay
                              ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-bold"
                              : day.is_weekend
                              ? "bg-rose-500/5 text-rose-500/80"
                              : "text-indigo-600 dark:text-indigo-400"
                          }`}
                        >
                          D
                        </th>
                      </React.Fragment>
                    );
                  })}
                </tr>
              </thead>

              <tbody>
                {groupedCategories.map((group) => {
                  const groupCusts = filteredCustomers.filter(
                    (c) => c.category === group.key
                  );
                  if (groupCusts.length === 0) return null;

                  return (
                    <React.Fragment key={group.key}>
                      {/* Category Section Divider Row (matching LUNCH DINNER, LAUK, LUNCH/DINNER in sheet) */}
                      <tr className="bg-[var(--bg-surface-3)]/70 border-y border-[var(--border-default)]">
                        <td
                          colSpan={2 + calendar_days.length * 2}
                          className="px-3.5 py-1.5 font-mono text-[10px] font-bold uppercase tracking-wider text-[var(--text-primary)]"
                        >
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-2 py-0.5 rounded ${group.badgeClass}`}
                            >
                              {group.sheetHeader}
                            </span>
                            <span>{group.title}</span>
                            <span className="text-[var(--text-muted)] font-normal">
                              — {group.subtitle}
                            </span>
                          </div>
                        </td>
                      </tr>

                      {groupCusts.map((cust) => {
                        const custMatrix = matrix[cust.customer_id] || {};
                        const monthDeliveriesCount = Object.values(
                          custMatrix
                        ).reduce(
                          (acc, pair) =>
                            acc +
                            (pair.L?.box_qty || 0) +
                            (pair.D?.box_qty || 0),
                          0
                        );
                        const pctUsed =
                          cust.active_quota_total > 0
                            ? Math.min(
                                100,
                                Math.round(
                                  ((cust.active_quota_total -
                                    cust.active_boxes_left_to_deliver) /
                                    cust.active_quota_total) *
                                    100
                                )
                              )
                            : 100;

                        return (
                          <tr
                            key={cust.customer_id}
                            className="border-b border-[var(--border-subtle)] hover:bg-[var(--bg-surface-2)]/60 transition-colors"
                          >
                            {/* Sticky Col 1: Subscriber Name & Actions */}
                            <td className="sticky left-0 z-10 bg-[var(--bg-surface)] px-3.5 py-2.5 border-r border-[var(--border-default)] min-w-[170px]">
                              <div className="flex items-center justify-between gap-1.5">
                                <div>
                                  <div className="font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                                    <span>{cust.customer_name}</span>
                                    {cust.status !== "active" && (
                                      <span className="badge-neutral px-1.5 py-0.2 rounded text-[9px] font-mono">
                                        {cust.status}
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-[10px] font-mono text-[var(--text-muted)] mt-0.5">
                                    {monthDeliveriesCount} box in{" "}
                                    {MONTH_LABELS_SHORT[selectedMonth]}
                                  </div>
                                </div>
                                <div className="flex items-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => openEditCustomerModal(cust)}
                                    title="Edit Subscriber Profile"
                                    className="p-1 rounded-lg hover:bg-[var(--bg-surface-3)] text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
                                  >
                                    <Edit3 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      openExtendModalForCustomer(cust)
                                    }
                                    title="Extend / Renew Catering Package"
                                    className="p-1 rounded-lg hover:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 cursor-pointer"
                                  >
                                    <CalendarPlus className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            </td>

                            {/* Sticky Col 2: Structured Quota & Last Date (Replaces Messy Col B) */}
                            <td className="sticky left-[170px] z-10 bg-[var(--bg-surface)] px-3 py-2 border-r border-[var(--border-default)] min-w-[210px]">
                              {cust.active_package ? (
                                <div className="space-y-1">
                                  <div className="flex items-center justify-between gap-1">
                                    <span className="text-[11px] font-semibold text-[var(--text-primary)] truncate max-w-[130px]">
                                      {cust.active_package.package_name}
                                    </span>
                                    <span
                                      className={`text-[10px] font-mono font-semibold px-1.5 py-0.2 rounded shrink-0 ${
                                        cust.active_boxes_left_to_deliver === 0
                                          ? "badge-neutral"
                                          : cust.active_boxes_left_to_deliver <=
                                            3
                                          ? "badge-rose"
                                          : "badge-emerald"
                                      }`}
                                    >
                                      Sisa {cust.active_boxes_left_to_deliver}/
                                      {cust.active_quota_total}
                                    </span>
                                  </div>

                                  {/* Mini Quota Progress Bar */}
                                  <div className="w-full h-1.5 rounded-full bg-[var(--bg-surface-3)] overflow-hidden">
                                    <div
                                      className="h-full rounded-full bg-emerald-500 transition-all"
                                      style={{ width: `${pctUsed}%` }}
                                    />
                                  </div>

                                  <div className="flex items-center justify-between text-[10px] font-mono text-[var(--text-muted)]">
                                    <span>
                                      Last:{" "}
                                      <strong className="text-[var(--text-primary)]">
                                        {formatShortDate(
                                          cust.projected_last_date
                                        )}
                                      </strong>
                                    </span>
                                    {cust.skipped_dates_count > 0 && (
                                      <span className="text-amber-600 dark:text-amber-400">
                                        {cust.skipped_dates_count}d OFF
                                      </span>
                                    )}
                                  </div>
                                </div>
                              ) : (
                                <div className="text-[11px] text-[var(--text-muted)] font-mono">
                                  No active package
                                </div>
                              )}
                            </td>

                            {/* Daily L & D Cells */}
                            {calendar_days.map((day) => {
                              const pair = custMatrix[day.date] || {};
                              const slots: MealSlot[] = ["L", "D"];
                              return slots.map((slot) => {
                                const cell = pair[slot];
                                const isLauk = cust.category === "LAUK";
                                const isSelectedCol = day.date === selectedDate;

                                let cellContent: React.ReactNode = null;
                                let cellStyle = "";

                                if (cell) {
                                  if (cell.status === "skipped") {
                                    cellContent = (
                                      <span className="text-[9px] font-mono font-bold tracking-tighter text-amber-700 dark:text-amber-300">
                                        OFF
                                      </span>
                                    );
                                    cellStyle =
                                      "bg-amber-500/20 hover:bg-amber-500/30";
                                  } else if (cell.status === "finish_marker") {
                                    cellContent = (
                                      <span className="text-[9px] font-mono font-bold tracking-tighter text-purple-700 dark:text-purple-300">
                                        {slot === "L" ? "FIN" : "ISH"}
                                      </span>
                                    );
                                    cellStyle =
                                      "bg-purple-500/20 hover:bg-purple-500/30";
                                  } else if (cell.status === "delivered") {
                                    const isFinNote =
                                      cell.raw_sheet_val === "fin" ||
                                      cell.raw_sheet_val === "ish";
                                    cellContent = (
                                      <span
                                        className={`w-5 h-5 rounded inline-flex items-center justify-center font-mono text-[10px] font-bold shadow-2xs ${
                                          isLauk
                                            ? "bg-sky-500 text-white"
                                            : "bg-emerald-500 text-white"
                                        }`}
                                      >
                                        {isFinNote
                                          ? slot === "L"
                                            ? "F"
                                            : "I"
                                          : isLauk
                                          ? "V"
                                          : cell.box_qty}
                                      </span>
                                    );
                                  } else if (cell.status === "scheduled") {
                                    cellContent = (
                                      <span
                                        className={`w-5 h-5 rounded inline-flex items-center justify-center font-mono text-[10px] font-bold border ${
                                          isLauk
                                            ? "bg-sky-500/20 border-sky-500/50 text-sky-700 dark:text-sky-300"
                                            : "bg-emerald-500/20 border-emerald-500/50 text-emerald-700 dark:text-emerald-300"
                                        }`}
                                      >
                                        {isLauk ? "V" : cell.box_qty}
                                      </span>
                                    );
                                  }
                                }

                                return (
                                  <td
                                    key={`${cust.customer_id}_${day.date}_${slot}`}
                                    onClick={() => {
                                      setActiveCell({
                                        customer: cust,
                                        date: day.date,
                                        dowShort: day.dow_id,
                                        slot,
                                        existing: cell,
                                      });
                                      setCellNoteInput(cell?.menu_note || "");
                                      setCellAutoRollover(true);
                                    }}
                                    title={`${cust.customer_name} · ${day.dow_id} ${day.date} (${
                                      slot === "L" ? "Lunch" : "Dinner"
                                    })${
                                      cell
                                        ? ` — ${cell.status.toUpperCase()}: ${
                                            cell.menu_note
                                          }`
                                        : " — Click to schedule or mark OFF"
                                    }`}
                                    className={`p-0.5 text-center border-r ${
                                      slot === "D"
                                        ? "border-[var(--border-default)]"
                                        : "border-[var(--border-subtle)]"
                                    } cursor-pointer transition-colors h-9 min-w-[26px] ${cellStyle} ${
                                      !cellStyle && isSelectedCol
                                        ? "bg-emerald-500/5 hover:bg-emerald-500/15"
                                        : !cellStyle && day.is_weekend
                                        ? "bg-rose-500/5 hover:bg-rose-500/15"
                                        : !cellStyle
                                        ? "hover:bg-[var(--bg-surface-3)]"
                                        : ""
                                    }`}
                                  >
                                    {cellContent}
                                  </td>
                                );
                              });
                            })}
                          </tr>
                        );
                      })}
                    </React.Fragment>
                  );
                })}
              </tbody>

              {/* Daily Totals Footer Row */}
              <tfoot>
                <tr className="bg-[var(--bg-surface-2)] border-t-2 border-[var(--border-default)] font-mono text-[10px]">
                  <td
                    colSpan={2}
                    className="sticky left-0 z-10 bg-[var(--bg-surface-2)] px-3.5 py-2 font-bold text-[var(--text-primary)] border-r border-[var(--border-default)]"
                  >
                    Daily Kitchen Prep Totals (L / D Boxes)
                  </td>
                  {calendar_days.map((day) => (
                    <React.Fragment key={`${day.date}-totals`}>
                      <td
                        className={`py-1.5 text-center border-r border-[var(--border-subtle)] font-bold ${
                          day.lunch_boxes > 0
                            ? "text-amber-600 dark:text-amber-400"
                            : "text-[var(--text-muted)] opacity-40"
                        }`}
                      >
                        {day.lunch_boxes || "·"}
                      </td>
                      <td
                        className={`py-1.5 text-center border-r border-[var(--border-default)] font-bold ${
                          day.dinner_boxes > 0
                            ? "text-indigo-600 dark:text-indigo-400"
                            : "text-[var(--text-muted)] opacity-40"
                        }`}
                      >
                        {day.dinner_boxes || "·"}
                      </td>
                    </React.Fragment>
                  ))}
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* =========================================================================
          5. DAILY KITCHEN PREP & COURIER DISPATCH MANIFEST
          ========================================================================= */}
      {showDispatch && (
        <div className="cockpit-panel rounded-2xl p-5 sm:p-6 space-y-5">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-[var(--border-subtle)] pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="badge-emerald px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold">
                  Kitchen & Courier Dispatch Sheet
                </span>
                <span className="text-xs font-mono text-[var(--text-muted)]">
                  {daily_manifest.day_label}
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-[var(--text-primary)] font-display mt-1">
                Daily Catering Prep & Delivery Manifest —{" "}
                {formatShortDate(selectedDate)}
              </h2>
            </div>

            {/* Date Navigator Controls */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => stepSelectedDate(-1)}
                className="p-2 rounded-xl bg-[var(--bg-surface-2)] hover:bg-[var(--bg-surface-3)] border border-[var(--border-default)] text-[var(--text-primary)] cursor-pointer"
                title="Previous Day"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <input
                type="date"
                value={selectedDate}
                min="2026-08-01"
                max="2026-11-30"
                onChange={(e) => {
                  if (e.target.value) handleSelectDate(e.target.value);
                }}
                className="px-3 py-1.5 rounded-xl bg-[var(--bg-surface-2)] border border-[var(--border-default)] text-xs font-mono font-semibold text-[var(--text-primary)]"
              />

              <button
                type="button"
                onClick={() => stepSelectedDate(1)}
                className="p-2 rounded-xl bg-[var(--bg-surface-2)] hover:bg-[var(--bg-surface-3)] border border-[var(--border-default)] text-[var(--text-primary)] cursor-pointer"
                title="Next Day"
              >
                <ChevronRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => handleSelectDate("2026-09-29")}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border cursor-pointer ${
                  selectedDate === "2026-09-29"
                    ? "bg-[var(--accent-primary)] text-white border-transparent"
                    : "bg-[var(--bg-surface-2)] border-[var(--border-default)] text-[var(--text-secondary)]"
                }`}
              >
                Today (29 Sep)
              </button>
              <button
                type="button"
                onClick={() => handleSelectDate("2026-09-30")}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border cursor-pointer ${
                  selectedDate === "2026-09-30"
                    ? "bg-[var(--accent-primary)] text-white border-transparent"
                    : "bg-[var(--bg-surface-2)] border-[var(--border-default)] text-[var(--text-secondary)]"
                }`}
              >
                Tomorrow (30 Sep)
              </button>

              <div className="h-5 w-[1px] bg-[var(--border-default)] mx-1" />

              <button
                type="button"
                onClick={() => setPrintManifestModalOpen(true)}
                className="px-3 py-1.5 rounded-xl bg-[var(--bg-surface-2)] hover:bg-[var(--bg-surface-3)] border border-[var(--border-default)] text-xs font-semibold text-[var(--text-primary)] inline-flex items-center gap-1.5 cursor-pointer shadow-2xs"
                title="Print Kitchen & Courier Dispatch Manifest"
              >
                <Printer className="w-3.5 h-3.5 text-indigo-500" />
                <span>Print Manifest</span>
              </button>

              <button
                type="button"
                onClick={handleExportManifestCsv}
                className="px-3 py-1.5 rounded-xl bg-[var(--bg-surface-2)] hover:bg-[var(--bg-surface-3)] border border-[var(--border-default)] text-xs font-semibold text-[var(--text-primary)] inline-flex items-center gap-1.5 cursor-pointer shadow-2xs"
                title="Download Courier Dispatch CSV"
              >
                <Download className="w-3.5 h-3.5 text-emerald-500" />
                <span>Export CSV</span>
              </button>
            </div>
          </div>

          {/* 3-Column Dispatch Cards: Lunch (L) | Dinner (D) | Skipped (OFF) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Column 1: Lunch (L) Dispatch */}
            <div className="p-4 rounded-2xl bg-[var(--bg-surface-2)] border border-[var(--border-default)] space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-amber-500/15 text-amber-500">
                    <Sun className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[var(--text-primary)]">
                      Lunch (L) Prep & Dispatch
                    </h3>
                    <p className="text-[11px] text-[var(--text-muted)] font-mono">
                      Cutoff 10:30 WIB · Dispatch 11:00 WIB
                    </p>
                  </div>
                </div>
                <span className="badge-amber px-2.5 py-1 rounded-full text-xs font-mono font-bold">
                  {daily_manifest.lunch_items.length} Box
                </span>
              </div>

              {daily_manifest.lunch_items.length === 0 ? (
                <div className="p-6 text-center text-xs text-[var(--text-muted)] border border-dashed border-[var(--border-default)] rounded-xl">
                  No Lunch (L) deliveries scheduled for{" "}
                  {formatShortDate(selectedDate)}.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {daily_manifest.lunch_items.map((item) => (
                    <div
                      key={item.delivery_id}
                      className="p-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-default)] space-y-2 shadow-2xs"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="font-bold text-sm text-[var(--text-primary)] flex items-center gap-1.5">
                            <span>{item.customer_name}</span>
                            <span
                              className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${
                                item.category === "LAUK"
                                  ? "badge-blue"
                                  : "badge-emerald"
                              }`}
                            >
                              {item.category === "LAUK"
                                ? "Lauk Only"
                                : "Ricebox"}
                            </span>
                          </div>
                          <div className="text-[11px] text-[var(--text-secondary)] mt-0.5">
                            {item.menu_note}
                          </div>
                        </div>
                        <span className="text-[10px] font-mono text-[var(--text-muted)]">
                          Sisa {item.boxes_left_to_deliver} box
                        </span>
                      </div>

                      <div className="text-[11px] text-[var(--text-muted)] flex items-center gap-1.5">
                        <MapPin className="w-3 h-3 shrink-0 text-[var(--accent-primary)]" />
                        <span className="truncate">{item.delivery_address}</span>
                      </div>

                      <div className="pt-2 border-t border-[var(--border-subtle)] flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenDispatchWa(item)}
                            className="px-2 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-[10px] font-semibold text-emerald-700 dark:text-emerald-300 inline-flex items-center gap-1 cursor-pointer"
                            title="Send WhatsApp Dispatch Notice"
                          >
                            <MessageSquare className="w-3 h-3" />
                            <span>WA Alert</span>
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              copyToClipboard(
                                generateDispatchWhatsAppText(
                                  item,
                                  getBaseUrl()
                                ),
                                `WA Dispatch for ${item.customer_name}`
                              )
                            }
                            className="p-1 rounded-lg bg-[var(--bg-surface-2)] hover:bg-[var(--bg-surface-3)] text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
                            title="Copy WA Message"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() =>
                              handleSlotAction(
                                item.customer_id,
                                selectedDate,
                                "L",
                                "swap_slot"
                              )
                            }
                            disabled={mutating}
                            className="px-2 py-1 rounded-lg bg-[var(--bg-surface-2)] hover:bg-[var(--bg-surface-3)] text-[10px] font-mono font-semibold text-[var(--text-secondary)] inline-flex items-center gap-1 cursor-pointer"
                          >
                            <ArrowLeftRight className="w-3 h-3" />
                            <span>Move D</span>
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              handleSlotAction(
                                item.customer_id,
                                selectedDate,
                                "L",
                                "skip",
                                "Customer requested OFF",
                                true
                              )
                            }
                            disabled={mutating}
                            className="px-2 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-[10px] font-mono font-semibold text-amber-700 dark:text-amber-300 inline-flex items-center gap-1 cursor-pointer"
                          >
                            <Ban className="w-3 h-3" />
                            <span>Skip OFF</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Column 2: Dinner (D) Dispatch */}
            <div className="p-4 rounded-2xl bg-[var(--bg-surface-2)] border border-[var(--border-default)] space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-indigo-500/15 text-indigo-400">
                    <Moon className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[var(--text-primary)]">
                      Dinner (D) Prep & Dispatch
                    </h3>
                    <p className="text-[11px] text-[var(--text-muted)] font-mono">
                      Cutoff 15:30 WIB · Dispatch 16:30 WIB
                    </p>
                  </div>
                </div>
                <span className="badge-purple px-2.5 py-1 rounded-full text-xs font-mono font-bold">
                  {daily_manifest.dinner_items.length} Box
                </span>
              </div>

              {daily_manifest.dinner_items.length === 0 ? (
                <div className="p-6 text-center text-xs text-[var(--text-muted)] border border-dashed border-[var(--border-default)] rounded-xl">
                  No Dinner (D) deliveries scheduled for{" "}
                  {formatShortDate(selectedDate)}.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {daily_manifest.dinner_items.map((item) => (
                    <div
                      key={item.delivery_id}
                      className="p-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-default)] space-y-2 shadow-2xs"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="font-bold text-sm text-[var(--text-primary)] flex items-center gap-1.5">
                            <span>{item.customer_name}</span>
                            <span
                              className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${
                                item.category === "LAUK"
                                  ? "badge-blue"
                                  : "badge-emerald"
                              }`}
                            >
                              {item.category === "LAUK"
                                ? "Lauk Only"
                                : "Ricebox"}
                            </span>
                          </div>
                          <div className="text-[11px] text-[var(--text-secondary)] mt-0.5">
                            {item.menu_note}
                          </div>
                        </div>
                        <span className="text-[10px] font-mono text-[var(--text-muted)]">
                          Sisa {item.boxes_left_to_deliver} box
                        </span>
                      </div>

                      <div className="text-[11px] text-[var(--text-muted)] flex items-center gap-1.5">
                        <MapPin className="w-3 h-3 shrink-0 text-[var(--accent-primary)]" />
                        <span className="truncate">{item.delivery_address}</span>
                      </div>

                      <div className="pt-2 border-t border-[var(--border-subtle)] flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenDispatchWa(item)}
                            className="px-2 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-[10px] font-semibold text-emerald-700 dark:text-emerald-300 inline-flex items-center gap-1 cursor-pointer"
                            title="Send WhatsApp Dispatch Notice"
                          >
                            <MessageSquare className="w-3 h-3" />
                            <span>WA Alert</span>
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              copyToClipboard(
                                generateDispatchWhatsAppText(
                                  item,
                                  getBaseUrl()
                                ),
                                `WA Dispatch for ${item.customer_name}`
                              )
                            }
                            className="p-1 rounded-lg bg-[var(--bg-surface-2)] hover:bg-[var(--bg-surface-3)] text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
                            title="Copy WA Message"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() =>
                              handleSlotAction(
                                item.customer_id,
                                selectedDate,
                                "D",
                                "swap_slot"
                              )
                            }
                            disabled={mutating}
                            className="px-2 py-1 rounded-lg bg-[var(--bg-surface-2)] hover:bg-[var(--bg-surface-3)] text-[10px] font-mono font-semibold text-[var(--text-secondary)] inline-flex items-center gap-1 cursor-pointer"
                          >
                            <ArrowLeftRight className="w-3 h-3" />
                            <span>Move L</span>
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              handleSlotAction(
                                item.customer_id,
                                selectedDate,
                                "D",
                                "skip",
                                "Customer requested OFF",
                                true
                              )
                            }
                            disabled={mutating}
                            className="px-2 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-[10px] font-mono font-semibold text-amber-700 dark:text-amber-300 inline-flex items-center gap-1 cursor-pointer"
                          >
                            <Ban className="w-3 h-3" />
                            <span>Skip OFF</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Column 3: Skipped (OFF) & Quick Add */}
            <div className="p-4 rounded-2xl bg-[var(--bg-surface-2)] border border-[var(--border-default)] space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-rose-500/15 text-rose-500">
                    <Ban className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[var(--text-primary)]">
                      Skipped (OFF) Hold List
                    </h3>
                    <p className="text-[11px] text-[var(--text-muted)] font-mono">
                      Do NOT prep · Quota rolled forward
                    </p>
                  </div>
                </div>
                <span className="badge-rose px-2.5 py-1 rounded-full text-xs font-mono font-bold">
                  {daily_manifest.skipped_items.length} OFF
                </span>
              </div>

              {daily_manifest.skipped_items.length === 0 ? (
                <div className="p-6 text-center text-xs text-[var(--text-muted)] border border-dashed border-[var(--border-default)] rounded-xl">
                  No customers marked OFF on {formatShortDate(selectedDate)}.
                </div>
              ) : (
                <div className="space-y-2">
                  {daily_manifest.skipped_items.map((item) => (
                    <div
                      key={item.delivery_id}
                      className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-2"
                    >
                      <div>
                        <div className="font-bold text-xs text-[var(--text-primary)]">
                          {item.customer_name} ({item.meal_slot}) — OFF
                        </div>
                        <div className="text-[10px] text-[var(--text-secondary)]">
                          {item.menu_note}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          handleSlotAction(
                            item.customer_id,
                            selectedDate,
                            item.meal_slot,
                            "schedule"
                          )
                        }
                        className="px-2 py-1 rounded-lg bg-[var(--bg-surface)] text-[10px] font-mono font-semibold text-[var(--text-primary)] border border-[var(--border-default)] cursor-pointer"
                      >
                        Restore
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          6. SUBSCRIBER CRM DIRECTORY & PACKAGE HISTORY CARDS
          ========================================================================= */}
      {showCrm && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-[var(--text-primary)] font-display">
                Subscriber CRM Directory & Package History (Aug – Nov 2026)
              </h2>
              <p className="text-xs text-[var(--text-secondary)]">
                Complete digital profiles with original Google Sheet annotations, Excel comments, and package quota balances.
              </p>
            </div>
          </div>

          {/* =========================================================================
              PROACTIVE SUBSCRIBER RETENTION & AUTO-RENEWAL PIPELINE
              ========================================================================= */}
          {(() => {
            const urgentRenewals = (data?.customers || []).filter(
              (c) =>
                c.renewal_urgency === "critical" ||
                c.renewal_urgency === "soon" ||
                c.renewal_urgency === "inactive"
            );
            if (urgentRenewals.length === 0) return null;

            return (
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
                              const waText = generateRenewalWhatsAppText(c, getBaseUrl());
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
                            onClick={() => {
                              setExtendCustomerId(c.customer_id);
                              setExtendModalOpen(true);
                            }}
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
            );
          })()}

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
                      onClick={() => openEditCustomerModal(cust)}
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
                              handleTogglePaymentStatus(
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
                            onClick={() => handleOpenInvoice(cust, pkg)}
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
                        onClick={() => handleOpenPortalShareWa(cust)}
                        className="px-2.5 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-700 dark:text-emerald-300 text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                        title="Share Self-Service Portal via WhatsApp"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                        <span>Share Portal</span>
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          copyToClipboard(
                            `${getBaseUrl()}/catering/portal/${cust.customer_id}`,
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
                      onClick={() => openExtendModalForCustomer(cust)}
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
      )}

      {/* =========================================================================
          MODAL 1: INTERACTIVE CELL ACTION POPOVER (SCHEDULE / SKIP OFF / SWAP L-D)
          ========================================================================= */}
      {activeCell && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="cockpit-panel rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl border border-[var(--border-strong)]">
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="badge-emerald px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold">
                  Flexible Slot Command
                </span>
                <h3 className="text-base font-bold text-[var(--text-primary)] font-display mt-1">
                  {activeCell.customer.customer_name} ·{" "}
                  {activeCell.slot === "L" ? "☀️ Lunch (L)" : "🌙 Dinner (D)"}
                </h3>
                <p className="text-xs font-mono text-[var(--text-secondary)]">
                  {activeCell.dowShort}, {formatShortDate(activeCell.date)} (
                  {activeCell.date})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveCell(null)}
                className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {activeCell.existing && (
              <div className="p-3 rounded-xl bg-[var(--bg-surface-2)] border border-[var(--border-default)] text-xs space-y-1">
                <div className="font-mono text-[10px] uppercase text-[var(--text-muted)]">
                  Current Slot Status:
                </div>
                <div className="font-semibold text-[var(--text-primary)] flex items-center justify-between">
                  <span>
                    {activeCell.existing.status.toUpperCase()} (
                    {activeCell.existing.box_qty} box)
                  </span>
                  <span className="font-mono text-[11px] text-[var(--text-secondary)]">
                    Sheet val: &ldquo;{activeCell.existing.raw_sheet_val}&rdquo;
                  </span>
                </div>
                <div className="text-[11px] text-[var(--text-secondary)]">
                  {activeCell.existing.menu_note}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="block text-[11px] font-mono uppercase text-[var(--text-secondary)] font-semibold">
                Menu / Dietary Override Note (Optional)
              </label>
              <input
                type="text"
                value={cellNoteInput}
                onChange={(e) => setCellNoteInput(e.target.value)}
                placeholder={
                  activeCell.customer.category === "LAUK"
                    ? "e.g. Lauk Only (No Rice)"
                    : "e.g. Vegan Wrap instead of Ricebox, No Spicy..."
                }
                className="w-full px-3 py-2 rounded-xl bg-[var(--bg-surface-2)] border border-[var(--border-default)] text-xs text-[var(--text-primary)]"
              />
            </div>

            <label className="flex items-center gap-2 text-xs text-[var(--text-secondary)] cursor-pointer select-none">
              <input
                type="checkbox"
                checked={cellAutoRollover}
                onChange={(e) => setCellAutoRollover(e.target.checked)}
                className="rounded accent-emerald-600"
              />
              <span>
                When marking <strong>OFF (Skip)</strong>, automatically roll box
                forward to next eligible delivery day
              </span>
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
              <button
                type="button"
                disabled={mutating}
                onClick={() =>
                  handleSlotAction(
                    activeCell.customer.customer_id,
                    activeCell.date,
                    activeCell.slot,
                    "schedule",
                    cellNoteInput
                  )
                }
                className="px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>
                  {activeCell.date <= "2026-09-29"
                    ? "Mark Delivered (1 Box)"
                    : "Schedule (1 Box)"}
                </span>
              </button>

              <button
                type="button"
                disabled={mutating}
                onClick={() =>
                  handleSlotAction(
                    activeCell.customer.customer_id,
                    activeCell.date,
                    activeCell.slot,
                    "skip",
                    cellNoteInput || "Customer Skipped (OFF)",
                    cellAutoRollover
                  )
                }
                className="px-3.5 py-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-800 dark:text-amber-200 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Ban className="w-4 h-4" />
                <span>Skip Date (Mark OFF)</span>
              </button>

              {activeCell.existing && activeCell.existing.box_qty > 0 && (
                <button
                  type="button"
                  disabled={mutating}
                  onClick={() =>
                    handleSlotAction(
                      activeCell.customer.customer_id,
                      activeCell.date,
                      activeCell.slot,
                      "swap_slot",
                      cellNoteInput
                    )
                  }
                  className="px-3.5 py-2.5 rounded-xl bg-[var(--bg-surface-2)] hover:bg-[var(--bg-surface-3)] border border-[var(--border-default)] text-[var(--text-primary)] text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeftRight className="w-4 h-4 text-sky-500" />
                  <span>
                    Swap to{" "}
                    {activeCell.slot === "L" ? "Dinner (D)" : "Lunch (L)"}
                  </span>
                </button>
              )}

              {activeCell.existing && (
                <button
                  type="button"
                  disabled={mutating}
                  onClick={() =>
                    handleSlotAction(
                      activeCell.customer.customer_id,
                      activeCell.date,
                      activeCell.slot,
                      "clear"
                    )
                  }
                  className="px-3.5 py-2.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Clear Slot</span>
                </button>
              )}
            </div>

            {activeCell.customer.phone && (
              <div className="pt-2 border-t border-[var(--border-subtle)] flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const sisa =
                      activeCell.customer.active_boxes_left_to_deliver;
                    const text = generateSkipConfirmationWhatsAppText(
                      activeCell.customer.customer_name,
                      activeCell.date,
                      activeCell.slot,
                      sisa,
                      activeCell.customer.projected_last_date
                    );
                    setWaModal({
                      isOpen: true,
                      title: "WhatsApp Skip Confirmation",
                      subtitle: `Notify Kak ${activeCell.customer.customer_name} that ${activeCell.date} (${activeCell.slot === "L" ? "Lunch" : "Dinner"}) is OFF and quota is safely rolled forward`,
                      recipientName: activeCell.customer.customer_name,
                      recipientPhone: activeCell.customer.phone,
                      messageText: text,
                      portalUrl: `${getBaseUrl()}/catering/portal/${activeCell.customer.customer_id}`,
                    });
                  }}
                  className="px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-700 dark:text-emerald-300 text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Send WhatsApp Notice</span>
                </button>
                <Link
                  href={`/catering/portal/${activeCell.customer.customer_id}`}
                  target="_blank"
                  className="text-xs font-semibold text-[var(--accent-primary)] hover:underline inline-flex items-center gap-1"
                >
                  <Smartphone className="w-3 h-3" />
                  <span>View Customer Portal</span>
                  <ExternalLink className="w-2.5 h-2.5" />
                </Link>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 2: EXTEND / RENEW PACKAGE WITH AUTO-SCHEDULE GENERATOR
          ========================================================================= */}
      {extendModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <form
            onSubmit={handleExtendPackageSubmit}
            className="cockpit-panel rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-[var(--border-strong)]"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="badge-emerald px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold">
                  Auto-Calendar Generator
                </span>
                <h3 className="text-lg font-bold text-[var(--text-primary)] font-display mt-1">
                  Extend / Renew Catering Package
                </h3>
                <p className="text-xs text-[var(--text-secondary)]">
                  Automatically allocates boxes across preferred weekdays and computes the exact Last Date.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setExtendModalOpen(false)}
                className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-mono uppercase text-[var(--text-secondary)] font-semibold mb-1">
                  Subscriber
                </label>
                <select
                  value={extendCustomerId}
                  onChange={(e) => {
                    const cid = e.target.value;
                    setExtendCustomerId(cid);
                    const found = customers.find((c) => c.customer_id === cid);
                    if (found) openExtendModalForCustomer(found);
                  }}
                  className="w-full px-3 py-2 rounded-xl bg-[var(--bg-surface-2)] border border-[var(--border-default)] text-xs font-semibold text-[var(--text-primary)]"
                >
                  {customers.map((c) => (
                    <option key={c.customer_id} value={c.customer_id}>
                      {c.customer_name} ({c.category_label} · Sisa{" "}
                      {c.active_boxes_left_to_deliver} box)
                    </option>
                  ))}
                </select>
              </div>

              {/* Quick Preset Pills */}
              <div className="sm:col-span-2 flex flex-wrap items-center gap-1.5">
                <span className="text-[10px] font-mono text-[var(--text-muted)] mr-1">
                  Quick Presets:
                </span>
                {[
                  { name: "5 Days · 5 Box Plan", boxes: 5, slot: "L" as const },
                  {
                    name: "5 Days · 10 Box Plan (L+D)",
                    boxes: 10,
                    slot: "L+D" as const,
                  },
                  {
                    name: "Lauk Only 16 Box (Mon & Thu)",
                    boxes: 16,
                    slot: "L+D" as const,
                  },
                  {
                    name: "56 Box Extended Plan",
                    boxes: 56,
                    slot: "D" as const,
                  },
                ].map((preset) => (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => {
                      setExtendPkgName(preset.name);
                      setExtendTotalBoxes(preset.boxes);
                      setExtendSlotMode(preset.slot);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-[var(--bg-surface-2)] hover:bg-[var(--bg-surface-3)] border border-[var(--border-default)] text-[10px] font-mono font-semibold text-[var(--text-primary)] cursor-pointer"
                  >
                    {preset.name}
                  </button>
                ))}
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-mono uppercase text-[var(--text-secondary)] font-semibold mb-1">
                  Package Name
                </label>
                <input
                  type="text"
                  required
                  value={extendPkgName}
                  onChange={(e) => setExtendPkgName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[var(--bg-surface-2)] border border-[var(--border-default)] text-xs text-[var(--text-primary)]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase text-[var(--text-secondary)] font-semibold mb-1">
                  Total Boxes Quota
                </label>
                <input
                  type="number"
                  min={1}
                  max={200}
                  required
                  value={extendTotalBoxes}
                  onChange={(e) => setExtendTotalBoxes(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-[var(--bg-surface-2)] border border-[var(--border-default)] text-xs font-mono font-bold text-[var(--text-primary)]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase text-[var(--text-secondary)] font-semibold mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  required
                  value={extendStartDate}
                  onChange={(e) => setExtendStartDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[var(--bg-surface-2)] border border-[var(--border-default)] text-xs font-mono text-[var(--text-primary)]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase text-[var(--text-secondary)] font-semibold mb-1">
                  Default Meal Slot
                </label>
                <select
                  value={extendSlotMode}
                  onChange={(e) =>
                    setExtendSlotMode(e.target.value as "L" | "D" | "L+D")
                  }
                  className="w-full px-3 py-2 rounded-xl bg-[var(--bg-surface-2)] border border-[var(--border-default)] text-xs font-semibold text-[var(--text-primary)]"
                >
                  <option value="L">Lunch Only (1 box/day)</option>
                  <option value="D">Dinner Only (1 box/day)</option>
                  <option value="L+D">Both Lunch + Dinner (2 boxes/day)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase text-[var(--text-secondary)] font-semibold mb-1">
                  Price per Box (IDR)
                </label>
                <input
                  type="number"
                  step={1000}
                  value={extendPricePerBox}
                  onChange={(e) => setExtendPricePerBox(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-[var(--bg-surface-2)] border border-[var(--border-default)] text-xs font-mono text-[var(--text-primary)]"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-mono uppercase text-[var(--text-secondary)] font-semibold mb-1.5">
                  Delivery Days of Week
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"].map(
                    (d) => {
                      const active = extendDays.includes(d);
                      return (
                        <button
                          key={d}
                          type="button"
                          onClick={() =>
                            toggleDayInList(d, extendDays, setExtendDays)
                          }
                          className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold border cursor-pointer ${
                            active
                              ? "bg-[var(--accent-primary)] text-white border-transparent"
                              : "bg-[var(--bg-surface-2)] text-[var(--text-muted)] border-[var(--border-default)]"
                          }`}
                        >
                          {d}
                        </button>
                      );
                    }
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[var(--border-subtle)]">
              <button
                type="button"
                onClick={() => setExtendModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-[var(--bg-surface-2)] text-xs font-semibold text-[var(--text-secondary)] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={mutating}
                className="px-4 py-2 rounded-xl bg-[var(--accent-primary)] text-white text-xs font-semibold cursor-pointer"
              >
                {mutating
                  ? "Generating Schedule..."
                  : `Create Package (${formatRp(
                      extendTotalBoxes * extendPricePerBox
                    )})`}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* =========================================================================
          MODAL 3: NEW / EDIT SUBSCRIBER CRM PROFILE
          ========================================================================= */}
      {customerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <form
            onSubmit={handleCustomerSubmit}
            className="cockpit-panel rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-[var(--border-strong)]"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="badge-emerald px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold">
                  Herbox Subscriber CRM
                </span>
                <h3 className="text-lg font-bold text-[var(--text-primary)] font-display mt-1">
                  {editingCustomerId
                    ? `Edit Subscriber: ${custName}`
                    : "Add New Catering Subscriber"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setCustomerModalOpen(false)}
                className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-[11px] font-mono uppercase text-[var(--text-secondary)] font-semibold mb-1">
                  Customer Name (Nama)
                </label>
                <input
                  type="text"
                  required
                  value={custName}
                  onChange={(e) => setCustName(e.target.value)}
                  placeholder="e.g. Clarissa"
                  className="w-full px-3 py-2 rounded-xl bg-[var(--bg-surface-2)] border border-[var(--border-default)] text-xs text-[var(--text-primary)]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase text-[var(--text-secondary)] font-semibold mb-1">
                  Program Category
                </label>
                <select
                  value={custCategory}
                  onChange={(e) =>
                    setCustCategory(e.target.value as CateringProgramCategory)
                  }
                  className="w-full px-3 py-2 rounded-xl bg-[var(--bg-surface-2)] border border-[var(--border-default)] text-xs font-semibold text-[var(--text-primary)]"
                >
                  <option value="LUNCH_OR_DINNER">
                    LUNCH/DINNER (Flexible Box)
                  </option>
                  <option value="LAUK">LAUK ONLY (No Rice)</option>
                  <option value="LUNCH_DINNER">
                    LUNCH DINNER (Full Day 2x)
                  </option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase text-[var(--text-secondary)] font-semibold mb-1">
                  WhatsApp / Phone
                </label>
                <input
                  type="text"
                  value={custPhone}
                  onChange={(e) => setCustPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[var(--bg-surface-2)] border border-[var(--border-default)] text-xs font-mono text-[var(--text-primary)]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase text-[var(--text-secondary)] font-semibold mb-1">
                  Status
                </label>
                <select
                  value={custStatus}
                  onChange={(e) =>
                    setCustStatus(
                      e.target.value as "active" | "completed" | "paused"
                    )
                  }
                  className="w-full px-3 py-2 rounded-xl bg-[var(--bg-surface-2)] border border-[var(--border-default)] text-xs font-semibold text-[var(--text-primary)]"
                >
                  <option value="active">Active</option>
                  <option value="paused">Paused</option>
                  <option value="completed">Completed</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-mono uppercase text-[var(--text-secondary)] font-semibold mb-1">
                  Delivery Address
                </label>
                <input
                  type="text"
                  value={custAddress}
                  onChange={(e) => setCustAddress(e.target.value)}
                  placeholder="Street, Blok, Area (e.g. Greenville / Kemang)..."
                  className="w-full px-3 py-2 rounded-xl bg-[var(--bg-surface-2)] border border-[var(--border-default)] text-xs text-[var(--text-primary)]"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-mono uppercase text-[var(--text-secondary)] font-semibold mb-1">
                  Dietary & Packaging Preferences
                </label>
                <input
                  type="text"
                  value={custDietary}
                  onChange={(e) => setCustDietary(e.target.value)}
                  placeholder="e.g. No Onion/Garlic, Prefers Wrap on Wednesdays, Lauk Only..."
                  className="w-full px-3 py-2 rounded-xl bg-[var(--bg-surface-2)] border border-[var(--border-default)] text-xs text-[var(--text-primary)]"
                />
              </div>

              {!editingCustomerId && (
                <>
                  <div>
                    <label className="block text-[11px] font-mono uppercase text-[var(--text-secondary)] font-semibold mb-1">
                      Initial Package Boxes
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={120}
                      value={custInitialBoxes}
                      onChange={(e) =>
                        setCustInitialBoxes(Number(e.target.value))
                      }
                      className="w-full px-3 py-2 rounded-xl bg-[var(--bg-surface-2)] border border-[var(--border-default)] text-xs font-mono font-bold text-[var(--text-primary)]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-mono uppercase text-[var(--text-secondary)] font-semibold mb-1">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={custInitialStart}
                      onChange={(e) => setCustInitialStart(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-[var(--bg-surface-2)] border border-[var(--border-default)] text-xs font-mono text-[var(--text-primary)]"
                    />
                  </div>
                </>
              )}
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[var(--border-subtle)]">
              <button
                type="button"
                onClick={() => setCustomerModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-[var(--bg-surface-2)] text-xs font-semibold text-[var(--text-secondary)] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={mutating}
                className="px-4 py-2 rounded-xl bg-[var(--accent-primary)] text-white text-xs font-semibold cursor-pointer"
              >
                {mutating ? "Saving..." : "Save Subscriber"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* =========================================================================
          MODAL 4: WHATSAPP ACTION CENTER & MESSAGE PREVIEW
          ========================================================================= */}
      {waModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="cockpit-panel rounded-2xl max-w-lg w-full p-5 space-y-4 shadow-2xl border border-[var(--border-strong)]">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[var(--text-primary)] font-display">
                    {waModal.title}
                  </h3>
                  <p className="text-xs text-[var(--text-secondary)]">
                    {waModal.subtitle}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() =>
                  setWaModal((prev) => ({ ...prev, isOpen: false }))
                }
                className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Recipient Info Card */}
            <div className="p-3 rounded-xl bg-[var(--bg-surface-2)] border border-[var(--border-default)] flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <div>
                  <div className="font-bold text-[var(--text-primary)]">
                    {waModal.recipientName}
                  </div>
                  <div className="text-[11px] font-mono text-[var(--text-muted)]">
                    {waModal.recipientPhone || "No phone number registered"}
                  </div>
                </div>
              </div>
              <span className="badge-emerald px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold">
                WhatsApp Ready
              </span>
            </div>

            {/* Message Preview & Quick Edit */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px] font-mono text-[var(--text-secondary)] uppercase font-semibold">
                <span>Message Content (Editable)</span>
                <span className="text-[10px] normal-case text-[var(--text-muted)]">
                  Formatted for WhatsApp
                </span>
              </div>
              <textarea
                rows={9}
                value={waModal.messageText}
                onChange={(e) =>
                  setWaModal((prev) => ({
                    ...prev,
                    messageText: e.target.value,
                  }))
                }
                className="w-full px-3 py-2.5 rounded-xl bg-[var(--bg-surface-2)] border border-[var(--border-default)] text-xs text-[var(--text-primary)] font-mono leading-relaxed resize-y focus:outline-hidden focus:border-[var(--accent-primary)]"
              />
            </div>

            {/* If portal link exists, show quick preview button */}
            {waModal.portalUrl && (
              <div className="p-2.5 rounded-xl bg-[var(--bg-surface-2)] border border-[var(--border-subtle)] flex items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-1.5 truncate text-[11px] text-[var(--text-secondary)]">
                  <Smartphone className="w-3.5 h-3.5 text-[var(--accent-primary)] shrink-0" />
                  <span className="truncate">{waModal.portalUrl}</span>
                </div>
                <Link
                  href={waModal.portalUrl}
                  target="_blank"
                  className="px-2.5 py-1 rounded-lg bg-[var(--bg-surface-3)] hover:bg-[var(--bg-surface-2)] text-[10px] font-semibold text-[var(--text-primary)] inline-flex items-center gap-1 shrink-0"
                >
                  <span>Test Portal</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-between gap-2 pt-2 border-t border-[var(--border-subtle)]">
              <button
                type="button"
                onClick={() =>
                  copyToClipboard(
                    waModal.messageText,
                    `WhatsApp message for ${waModal.recipientName}`
                  )
                }
                className="px-3.5 py-2 rounded-xl bg-[var(--bg-surface-2)] hover:bg-[var(--bg-surface-3)] text-xs font-semibold text-[var(--text-secondary)] inline-flex items-center gap-1.5 cursor-pointer"
              >
                {copiedNotice ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-500" />
                    <span className="text-emerald-500 font-bold">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copy Text</span>
                  </>
                )}
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setWaModal((prev) => ({ ...prev, isOpen: false }))
                  }
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const url = buildWhatsAppLink(
                      waModal.recipientPhone,
                      waModal.messageText
                    );
                    window.open(url, "_blank");
                  }}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold inline-flex items-center gap-1.5 shadow-md cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>Open WhatsApp</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Printable Dispatch Manifest & Courier Slips Modal */}
      {printManifestModalOpen && data?.daily_manifest && (
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
                  <span>Dispatch Manifest & Kitchen Slips</span>
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
                  onClick={() => setPrintManifestModalOpen(false)}
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
                        ? data.daily_manifest.lunch_items.length
                        : 0) +
                        (printSlotFilter === "ALL" || printSlotFilter === "D"
                          ? data.daily_manifest.dinner_items.length
                          : 0)}
                    </strong>
                  </div>
                  <div className="text-center px-3 py-1.5 rounded-lg border border-amber-200 bg-amber-50/50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-300">
                    <span className="block text-[10px] uppercase">Lunch (L)</span>
                    <strong className="text-sm font-bold">
                      {data.daily_manifest.lunch_items.reduce(
                        (acc, i) => acc + i.box_qty,
                        0
                      )}{" "}
                      box
                    </strong>
                  </div>
                  <div className="text-center px-3 py-1.5 rounded-lg border border-indigo-200 bg-indigo-50/50 dark:bg-indigo-950/20 text-indigo-700 dark:text-indigo-300">
                    <span className="block text-[10px] uppercase">Dinner (D)</span>
                    <strong className="text-sm font-bold">
                      {data.daily_manifest.dinner_items.reduce(
                        (acc, i) => acc + i.box_qty,
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
                  ? data.daily_manifest.lunch_items
                  : []
                ).map((item, idx) => (
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
                  ? data.daily_manifest.dinner_items
                  : []
                ).map((item, idx) => (
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
      )}

      {/* Digital Catering Invoice Modal */}
      {invoiceModal.isOpen && invoiceModal.data && (
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
                  Digital Invoice — {invoiceModal.data.invoice_number}
                </span>
              </div>
              <button
                type="button"
                onClick={() =>
                  setInvoiceModal({
                    isOpen: false,
                    data: null,
                    cust: null,
                    pkg: null,
                  })
                }
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
                    Healthy & Nutritious Personal Catering
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
                    {invoiceModal.data.invoice_number}
                  </div>
                  <div className="mt-2">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold inline-flex items-center gap-1 ${
                        invoiceModal.data.payment_status === "paid"
                          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300"
                          : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300"
                      }`}
                    >
                      {invoiceModal.data.payment_status === "paid" ? (
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
                    {invoiceModal.data.customer_name}
                  </div>
                  <div className="text-gray-600 dark:text-gray-400 font-mono mt-0.5">
                    {invoiceModal.data.phone}
                  </div>
                  <div className="text-gray-600 dark:text-gray-400 mt-1 leading-snug">
                    {invoiceModal.data.delivery_address}
                  </div>
                </div>

                <div className="text-right space-y-1 font-mono text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Invoice Date:</span>
                    <strong className="text-gray-800 dark:text-gray-200">
                      {invoiceModal.data.issue_date}
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Due Date:</span>
                    <strong className="text-gray-800 dark:text-gray-200">
                      {invoiceModal.data.due_date}
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Plan Category:</span>
                    <strong className="text-gray-800 dark:text-gray-200">
                      {invoiceModal.data.category_label}
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
                        {invoiceModal.data.package_name}
                        <span className="block text-[11px] font-normal text-gray-500">
                          Herbox Personal Catering Program ({invoiceModal.data.total_boxes} Deliveries)
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center font-mono">
                        {invoiceModal.data.total_boxes}
                      </td>
                      <td className="py-3 px-4 text-right font-mono">
                        {formatRp(invoiceModal.data.price_per_box)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-gray-900 dark:text-white">
                        {formatRp(invoiceModal.data.total_amount)}
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
                    {invoiceModal.data.bank_details.bank_name}
                  </div>
                  <div className="text-sm font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    {invoiceModal.data.bank_details.account_number}
                  </div>
                  <div className="text-[11px] text-gray-500">
                    a.n. {invoiceModal.data.bank_details.account_holder}
                  </div>
                  <div className="text-[10px] text-gray-400 pt-1 border-t border-gray-200 dark:border-neutral-800">
                    Berita Transfer: <strong>{invoiceModal.data.invoice_number}</strong>
                  </div>
                </div>

                <div className="space-y-2 text-xs font-mono self-end">
                  <div className="flex justify-between text-gray-500">
                    <span>Subtotal ({invoiceModal.data.total_boxes} boxes):</span>
                    <span>{formatRp(invoiceModal.data.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-gray-500">
                    <span>Discount:</span>
                    <span>Rp 0</span>
                  </div>
                  <div className="flex justify-between items-center text-sm font-bold pt-2 border-t border-gray-200 dark:border-neutral-800 text-gray-900 dark:text-white">
                    <span>TOTAL CONTRACT:</span>
                    <span className="text-base text-emerald-600 dark:text-emerald-400">
                      {formatRp(invoiceModal.data.total_amount)}
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
                  handleTogglePaymentStatus(
                    invoiceModal.data!.package_id,
                    invoiceModal.data!.payment_status
                  )
                }
                disabled={mutating}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer transition-colors ${
                  invoiceModal.data.payment_status === "paid"
                    ? "bg-amber-500/15 hover:bg-amber-500/25 text-amber-700 dark:text-amber-300 border border-amber-500/30"
                    : "bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30"
                }`}
              >
                {invoiceModal.data.payment_status === "paid" ? (
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
                      invoiceModal.data!.customer_name,
                      invoiceModal.data!.package_name,
                      invoiceModal.data!.total_boxes,
                      invoiceModal.data!.price_per_box,
                      invoiceModal.data!.invoice_number,
                      invoiceModal.data!.payment_status
                    );
                    const url = buildWhatsAppLink(invoiceModal.data!.phone, waText);
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
                  onClick={() =>
                    setInvoiceModal({
                      isOpen: false,
                      data: null,
                      cust: null,
                      pkg: null,
                    })
                  }
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const MONTH_LABELS_SHORT: Record<string, string> = {
  "2026-08": "Aug 2026",
  "2026-09": "Sep 2026",
  "2026-10": "Oct 2026",
  "2026-11": "Nov 2026",
};

const MONTH_META_DISPLAY: Record<string, string> = {
  "2026-08": "August 2026 (AGS 26)",
  "2026-09": "September 2026 (SEPT 26)",
  "2026-10": "October 2026 (OKT 26)",
  "2026-11": "November 2026 (NOV 26)",
};
