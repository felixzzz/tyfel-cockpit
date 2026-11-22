import type {
  CateringCrmDashboardData,
  EnrichedCateringCustomer,
  CateringDeliveryRow,
  MealSlot,
  EnrichedCateringPackage,
} from "@/lib/catering";
import type { CateringInvoiceData } from "@/lib/catering-invoice";

export function formatRp(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatShortDate(dateStr: string | null | undefined): string {
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

export type DailyManifestData = CateringCrmDashboardData["daily_manifest"];

export interface ActiveCellState {
  customer: EnrichedCateringCustomer;
  date: string;
  dowShort: string;
  slot: MealSlot;
  existing?: CateringDeliveryRow;
}

export interface WhatsAppModalState {
  isOpen: boolean;
  title: string;
  subtitle: string;
  recipientName: string;
  recipientPhone: string;
  messageText: string;
  portalUrl?: string;
}

export interface InvoiceModalState {
  isOpen: boolean;
  data: CateringInvoiceData | null;
  cust: EnrichedCateringCustomer | null;
  pkg: EnrichedCateringPackage | null;
}
