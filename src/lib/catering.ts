import type { DuckDBInstance } from '@duckdb/node-api';
import { getDuckDB, invalidateQueryCache, runQuery } from './duckdb';

export type CateringProgramCategory =
  | 'LUNCH_DINNER'
  | 'LAUK'
  | 'LUNCH_OR_DINNER';

export type MealSlot = 'L' | 'D';

export type DeliverySlotStatus =
  | 'delivered'
  | 'scheduled'
  | 'skipped'
  | 'finish_marker';

export interface CateringCustomerRow {
  customer_id: string;
  customer_name: string;
  category: CateringProgramCategory;
  phone: string;
  delivery_address: string;
  dietary_notes: string;
  default_days: string; // e.g. 'MON,TUE,WED,THU,FRI' or 'MON,THU' or 'TUE,THU'
  default_slot: string; // 'L', 'D', 'L+D', 'FLEX'
  status: 'active' | 'completed' | 'paused';
  sheet_raw_label: string;
  excel_comment: string;
}

export interface CateringPackageRow {
  package_id: string;
  customer_id: string;
  package_name: string;
  program_type: CateringProgramCategory;
  total_boxes: number;
  start_date: string;
  manual_last_date: string | null;
  price_per_box: number;
  payment_status: 'paid' | 'pending';
  sheet_note: string;
  excel_comment: string;
  status: 'active' | 'completed';
}

export interface CateringDeliveryRow {
  delivery_id: string;
  customer_id: string;
  package_id: string;
  delivery_date: string; // YYYY-MM-DD
  meal_slot: MealSlot; // 'L' | 'D'
  status: DeliverySlotStatus;
  box_qty: number; // 1 for delivered/scheduled, 0 for skipped/finish_marker
  menu_note: string;
  raw_sheet_val: string;
  source_sheet: string;
}

export interface EnrichedCateringPackage extends CateringPackageRow {
  boxes_delivered: number;
  boxes_scheduled: number;
  boxes_used: number; // delivered + scheduled
  boxes_remaining: number; // max(0, total_boxes - boxes_used)
  unscheduled_boxes: number; // boxes not yet placed on calendar
  boxes_left_to_deliver: number; // max(0, total_boxes - boxes_delivered)
  skipped_slots_count: number;
  computed_last_date: string | null;
  effective_last_date: string | null;
}

export interface EnrichedCateringCustomer extends CateringCustomerRow {
  category_label: string;
  packages: EnrichedCateringPackage[];
  active_package: EnrichedCateringPackage | null;
  total_boxes_purchased: number;
  total_boxes_delivered: number;
  total_boxes_scheduled: number;
  total_boxes_remaining: number; // active package remaining to deliver
  active_quota_total: number;
  active_quota_used: number;
  active_quota_unscheduled: number;
  active_boxes_left_to_deliver: number;
  skipped_dates_count: number;
  projected_last_date: string | null;
  renewal_urgency: 'critical' | 'soon' | 'healthy' | 'inactive';
  renewal_reason: string;
}

export interface CalendarDayHeader {
  date: string; // YYYY-MM-DD
  day_num: number; // 1..31
  dow_index: number; // 0=Sun..6=Sat
  dow_id: string; // SENIN, SELASA, RABU, KAMIS, JUMAT, SABTU, MINGGU
  dow_short: string; // SEN, SEL, RAB, KAM, JUM, SAB, MIN
  is_weekend: boolean;
  is_today: boolean;
  is_past: boolean;
  lunch_boxes: number;
  dinner_boxes: number;
  total_boxes: number;
  skipped_count: number;
}

export interface DailyDispatchItem {
  delivery_id: string;
  customer_id: string;
  customer_name: string;
  category: CateringProgramCategory;
  category_label: string;
  package_name: string;
  meal_slot: MealSlot;
  status: DeliverySlotStatus;
  box_qty: number;
  menu_note: string;
  dietary_notes: string;
  delivery_address: string;
  phone: string;
  boxes_left_to_deliver: number;
  projected_last_date: string | null;
}

export interface SheetCleanupInsight {
  id: string;
  customer_name: string;
  sheet_tab: string;
  raw_issue: string;
  digital_solution: string;
  severity: 'amber' | 'emerald' | 'blue' | 'rose';
}

export interface CateringCrmDashboardData {
  reference_today: string;
  selected_month: string; // YYYY-MM
  selected_date: string; // YYYY-MM-DD
  available_months: Array<{
    month_key: string; // '2026-08'
    sheet_name: string; // 'AGS 26'
    label: string; // 'August 2026'
    short_label: string; // 'Aug 2026'
    delivered_boxes: number;
    scheduled_boxes: number;
    skipped_slots: number;
    active_customers: number;
  }>;
  kpi: {
    active_subscribers: number;
    total_customers: number;
    month_total_boxes: number;
    month_delivered_boxes: number;
    month_scheduled_boxes: number;
    month_lunch_boxes: number;
    month_dinner_boxes: number;
    month_lauk_boxes: number;
    month_skipped_slots: number;
    total_remaining_liability_boxes: number;
    renewal_alerts_count: number;
    selected_date_lunch_boxes: number;
    selected_date_dinner_boxes: number;
    selected_date_total_boxes: number;
    selected_date_skipped: number;
  };
  customers: EnrichedCateringCustomer[];
  calendar_days: CalendarDayHeader[];
  // Map of customer_id -> date (YYYY-MM-DD) -> { L?: CateringDeliveryRow, D?: CateringDeliveryRow }
  matrix: Record<
    string,
    Record<
      string,
      {
        L?: CateringDeliveryRow;
        D?: CateringDeliveryRow;
      }
    >
  >;
  daily_manifest: {
    date: string;
    day_label: string;
    lunch_items: DailyDispatchItem[];
    dinner_items: DailyDispatchItem[];
    skipped_items: DailyDispatchItem[];
  };
  sheet_Diagnostics: SheetCleanupInsight[];
}

const REFERENCE_TODAY = '2026-09-29';

const INDONESIAN_DOW = [
  'MINGGU',
  'SENIN',
  'SELASA',
  'RABU',
  'KAMIS',
  'JUMAT',
  'SABTU',
];

const INDONESIAN_DOW_SHORT = ['MIN', 'SEN', 'SEL', 'RAB', 'KAM', 'JUM', 'SAB'];

const MONTH_META: Record<
  string,
  { sheet_name: string; label: string; short_label: string }
> = {
  '2026-08': {
    sheet_name: 'AGS 26',
    label: 'August 2026 (AGS 26)',
    short_label: 'Aug 2026',
  },
  '2026-09': {
    sheet_name: 'SEPT 26',
    label: 'September 2026 (SEPT 26)',
    short_label: 'Sep 2026',
  },
  '2026-10': {
    sheet_name: 'OKT 26',
    label: 'October 2026 (OKT 26)',
    short_label: 'Oct 2026',
  },
  '2026-11': {
    sheet_name: 'NOV 26',
    label: 'November 2026 (NOV 26)',
    short_label: 'Nov 2026',
  },
};

export function getCategoryLabel(cat: CateringProgramCategory): string {
  switch (cat) {
    case 'LUNCH_DINNER':
      return 'Full Day (Lunch & Dinner)';
    case 'LAUK':
      return 'Lauk Only (Side Dish)';
    case 'LUNCH_OR_DINNER':
      return 'Flexible (Lunch / Dinner)';
    default:
      return cat;
  }
}

function sqlEsc(val: string): string {
  return (val || '').replace(/'/g, "''");
}

// ============================================================================
// EXACT SEED DATA EXTRACTED FROM GOOGLE SHEET (AGS 26, SEPT 26, OKT 26, NOV 26)
// ============================================================================

const SEED_CUSTOMERS: CateringCustomerRow[] = [
  {
    customer_id: 'CUST-FINA',
    customer_name: 'Fina',
    category: 'LUNCH_OR_DINNER',
    phone: '+62 812-8841-2090',
    delivery_address: 'Greenville Blok AW No. 14, Jakarta Barat',
    dietary_notes:
      'Flexible 1 box/day (Mon–Fri). Alternates Lunch (L) & Dinner (D) based on work-from-home schedule.',
    default_days: 'MON,TUE,WED,THU,FRI',
    default_slot: 'FLEX',
    status: 'active',
    sheet_raw_label: 'AGS: "sisa 46 box" | SEPT/OKT: "56 box" | NOV: "2026-11-02"',
    excel_comment: 'baru extend selasa tgl 18 agst 2026 (56 box)',
  },
  {
    customer_id: 'CUST-RENNY',
    customer_name: 'Renny',
    category: 'LAUK',
    phone: '+62 811-9023-4412',
    delivery_address: 'Taman Ratu Indah Blok D2, Kebon Jeruk',
    dietary_notes:
      'Lauk Only (No Rice) · 2 portions per delivery day (L + D). Aug–Sep 17: Tue & Thu; Renewed Sep 21–Nov 26: Mon & Thu.',
    default_days: 'MON,THU',
    default_slot: 'L+D',
    status: 'active',
    sheet_raw_label: 'AGS: "sisa 6 box" | OKT: "Lauk only" | NOV: "2026-11-26"',
    excel_comment: 'LAST DATE : 16 sept 2026 (then extended through 26 Nov 2026)',
  },
  {
    customer_id: 'CUST-YOLA',
    customer_name: 'Yola',
    category: 'LUNCH_OR_DINNER',
    phone: '+62 813-1776-8901',
    delivery_address: 'Tanjung Duren Utara IV, Jakarta Barat',
    dietary_notes:
      'Flexible 5-box packages (~2 days/week, mostly Dinner D or Wed/Thu Lunch L). Often skips & rolls over dates.',
    default_days: 'MON,THU',
    default_slot: 'D',
    status: 'active',
    sheet_raw_label: 'AGS: "sisa 4 box" | SEPT: "5 days 5 box"',
    excel_comment: 'extend tgl 22 agst, last date bulan sept 2026',
  },
  {
    customer_id: 'CUST-VIKTOR',
    customer_name: 'Viktor',
    category: 'LUNCH_OR_DINNER',
    phone: '+62 818-0822-5519',
    delivery_address: 'Puri Indah Blok I-3, Kembangan',
    dietary_notes:
      '5 Days · 5 Box weekday plan. Batch 1 (Sep 21–25): Dinner (D); Batch 2 (Sep 28–Oct 2): switched to Lunch (L).',
    default_days: 'MON,TUE,WED,THU,FRI',
    default_slot: 'L',
    status: 'active',
    sheet_raw_label: 'SEPT & OKT: "5 days 5 box"',
    excel_comment: 'Started 21 Sept 2026 (5 days 5 box), renewed 28 Sept 2026',
  },
  {
    customer_id: 'CUST-JYOTI',
    customer_name: 'Jyoti',
    category: 'LUNCH_OR_DINNER',
    phone: '+62 812-9981-7734',
    delivery_address: 'Kemang Village Residence Tower Tiffany, Jakarta Selatan',
    dietary_notes:
      '5 Days · 10 Box Intensive Plan (Both Lunch L + Dinner D = 2 boxes/day). Includes Saturday Oct 3 delivery.',
    default_days: 'TUE,WED,THU,FRI,SAT',
    default_slot: 'L+D',
    status: 'active',
    sheet_raw_label: 'SEPT & OKT: "5 days 10 box"',
    excel_comment: '2 boxes/day (L+D) for 5 consecutive days (29 Sep – 3 Oct 2026)',
  },
  {
    customer_id: 'CUST-IVAN',
    customer_name: 'Ivan',
    category: 'LUNCH_OR_DINNER',
    phone: '+62 816-743-992',
    delivery_address: 'Sunrise Garden Blok X, Kedoya',
    dietary_notes:
      'Weekday Lunch (L) subscriber. Took 6 OFF days in Aug 2026 (Aug 17–21 & Aug 25), shifting Last Date from Aug 18 to Aug 27.',
    default_days: 'MON,TUE,WED,THU,FRI',
    default_slot: 'L',
    status: 'completed',
    sheet_raw_label: 'JULI: "sisa 12 box" | AGS: "27 agst 2026"',
    excel_comment: 'LAST DATE : 18/8/26 -> Extended to 27 Agst 2026 due to 6 OFF days',
  },
  {
    customer_id: 'CUST-SURYANI',
    customer_name: 'Suryani',
    category: 'LUNCH_DINNER',
    phone: '+62 811-188-204',
    delivery_address: 'Kebon Jeruk Baru Blok A5, Jakarta Barat',
    dietary_notes:
      'Full Day Lunch + Dinner VIP subscriber. Completed last batch on 14 July 2026; listed on Aug–Nov roster for reactivation.',
    default_days: 'MON,TUE,WED,THU,FRI',
    default_slot: 'L+D',
    status: 'paused',
    sheet_raw_label: 'JULI: "2026-07-14" | AGS–NOV: Listed under LUNCH DINNER',
    excel_comment: 'Completed prior package 14 Jul 2026; awaiting renewal',
  },
];

const SEED_PACKAGES: CateringPackageRow[] = [
  // FINA
  {
    package_id: 'PKG-FINA-AUG26-PRIOR',
    customer_id: 'CUST-FINA',
    package_name: 'Prior Batch Carryover (5 Box)',
    program_type: 'LUNCH_OR_DINNER',
    total_boxes: 5,
    start_date: '2026-08-10',
    manual_last_date: '2026-08-14',
    price_per_box: 45000,
    payment_status: 'paid',
    sheet_note: 'Completed Aug 14 before 56-box extension',
    excel_comment: '',
    status: 'completed',
  },
  {
    package_id: 'PKG-FINA-AUG26-56',
    customer_id: 'CUST-FINA',
    package_name: '56 Box Extended Plan',
    program_type: 'LUNCH_OR_DINNER',
    total_boxes: 56,
    start_date: '2026-08-18',
    manual_last_date: '2026-11-02',
    price_per_box: 43000,
    payment_status: 'paid',
    sheet_note: 'AGS: sisa 46 box | SEPT/OKT: 56 box | NOV: Last Date 2026-11-02',
    excel_comment: 'baru extend selasa tgl 18 agst 2026 (56 box)',
    status: 'active',
  },
  // RENNY
  {
    package_id: 'PKG-RENNY-AUG26',
    customer_id: 'CUST-RENNY',
    package_name: 'Lauk Only Routine (Tue & Thu · L+D)',
    program_type: 'LAUK',
    total_boxes: 28,
    start_date: '2026-08-04',
    manual_last_date: '2026-09-17',
    price_per_box: 38000,
    payment_status: 'paid',
    sheet_note: 'AGS: sisa 6 box | SEPT: fin/ish on 17 Sept',
    excel_comment: 'LAST DATE : 16 sept 2026',
    status: 'completed',
  },
  {
    package_id: 'PKG-RENNY-SEP26',
    customer_id: 'CUST-RENNY',
    package_name: 'Lauk Only Renewal (Mon & Thu · L+D)',
    program_type: 'LAUK',
    total_boxes: 40,
    start_date: '2026-09-21',
    manual_last_date: '2026-11-26',
    price_per_box: 38000,
    payment_status: 'paid',
    sheet_note: 'OKT: Lauk only | NOV: Last Date 2026-11-26 (46352)',
    excel_comment: 'Switched from Tue/Thu to Mon/Thu starting 21 Sept 2026',
    status: 'active',
  },
  // YOLA
  {
    package_id: 'PKG-YOLA-AUG26',
    customer_id: 'CUST-YOLA',
    package_name: 'August Flexible Plan (8 Box)',
    program_type: 'LUNCH_OR_DINNER',
    total_boxes: 8,
    start_date: '2026-08-03',
    manual_last_date: '2026-08-28',
    price_per_box: 48000,
    payment_status: 'paid',
    sheet_note: 'AGS: sisa 4 box',
    excel_comment: 'extend tgl 22 agst, last date bulan sept 2026',
    status: 'completed',
  },
  {
    package_id: 'PKG-YOLA-SEP26',
    customer_id: 'CUST-YOLA',
    package_name: '5 Days · 5 Box Plan (×2 Batches = 10 Box)',
    program_type: 'LUNCH_OR_DINNER',
    total_boxes: 10,
    start_date: '2026-09-01',
    manual_last_date: null,
    price_per_box: 48000,
    payment_status: 'paid',
    sheet_note: 'SEPT: 5 days 5 box (9 used in Sept, 1 box remaining)',
    excel_comment: 'extend tgl 22 agst, last date bulan sept 2026',
    status: 'active',
  },
  // IVAN
  {
    package_id: 'PKG-IVAN-AUG26',
    customer_id: 'CUST-IVAN',
    package_name: 'August Carryover Plan (12 Box)',
    program_type: 'LUNCH_OR_DINNER',
    total_boxes: 12,
    start_date: '2026-08-03',
    manual_last_date: '2026-08-27',
    price_per_box: 45000,
    payment_status: 'paid',
    sheet_note: 'AGS: 27 agst 2026 (6 weekdays marked OFF)',
    excel_comment: 'LAST DATE : 18/8/26 (pushed to 27/8/26 due to OFF days)',
    status: 'completed',
  },
  // VIKTOR
  {
    package_id: 'PKG-VIKTOR-SEP26-1',
    customer_id: 'CUST-VIKTOR',
    package_name: '5 Days · 5 Box Plan (Batch 1 · Dinner)',
    program_type: 'LUNCH_OR_DINNER',
    total_boxes: 5,
    start_date: '2026-09-21',
    manual_last_date: '2026-09-25',
    price_per_box: 48000,
    payment_status: 'paid',
    sheet_note: 'SEPT: 5 days 5 box (21–25 Sept Dinner)',
    excel_comment: '',
    status: 'completed',
  },
  {
    package_id: 'PKG-VIKTOR-SEP26-2',
    customer_id: 'CUST-VIKTOR',
    package_name: '5 Days · 5 Box Plan (Batch 2 · Lunch)',
    program_type: 'LUNCH_OR_DINNER',
    total_boxes: 5,
    start_date: '2026-09-28',
    manual_last_date: '2026-10-02',
    price_per_box: 48000,
    payment_status: 'paid',
    sheet_note: 'SEPT & OKT: 5 days 5 box (28 Sept – 2 Oct Lunch)',
    excel_comment: '',
    status: 'active',
  },
  // JYOTI
  {
    package_id: 'PKG-JYOTI-SEP26',
    customer_id: 'CUST-JYOTI',
    package_name: '5 Days · 10 Box Plan (Lunch + Dinner)',
    program_type: 'LUNCH_OR_DINNER',
    total_boxes: 10,
    start_date: '2026-09-29',
    manual_last_date: '2026-10-03',
    price_per_box: 46000,
    payment_status: 'paid',
    sheet_note: 'SEPT & OKT: 5 days 10 box (L+D including Sat Oct 3)',
    excel_comment: '',
    status: 'active',
  },
  // SURYANI
  {
    package_id: 'PKG-SURYANI-JUL26',
    customer_id: 'CUST-SURYANI',
    package_name: 'Full Day Lunch + Dinner Plan (Completed Jul)',
    program_type: 'LUNCH_DINNER',
    total_boxes: 20,
    start_date: '2026-07-01',
    manual_last_date: '2026-07-14',
    price_per_box: 45000,
    payment_status: 'paid',
    sheet_note: 'Completed 2026-07-14; inactive in Aug–Nov 2026',
    excel_comment: '',
    status: 'completed',
  },
];

function buildSeedDeliveries(): CateringDeliveryRow[] {
  const rows: CateringDeliveryRow[] = [];

  const addSlot = (
    customer_id: string,
    package_id: string,
    delivery_date: string,
    meal_slot: MealSlot,
    raw_sheet_val: string,
    source_sheet: string,
    menu_note = ''
  ) => {
    const lower = raw_sheet_val.toLowerCase().trim();
    let status: DeliverySlotStatus =
      delivery_date <= REFERENCE_TODAY ? 'delivered' : 'scheduled';
    let box_qty = 1;

    if (lower === 'off') {
      status = 'skipped';
      box_qty = 0;
    } else if (lower === 'fin' || lower === 'ish') {
      // Notice in SEPT 26 Renny has fin/ish on Sep 17 (which was her last delivery day)
      // and in NOV 26 Fina has fin/ish on Nov 2 (her projected finish marker)
      if (customer_id === 'CUST-RENNY' && delivery_date === '2026-09-17') {
        status = 'delivered';
        box_qty = 1;
        menu_note = 'Package Finish (fin/ish)';
      } else {
        status = 'finish_marker';
        box_qty = 0;
        menu_note = 'Projected Finish Date (fin/ish)';
      }
    }

    rows.push({
      delivery_id: `${customer_id}_${delivery_date}_${meal_slot}`,
      customer_id,
      package_id,
      delivery_date,
      meal_slot,
      status,
      box_qty,
      menu_note:
        menu_note ||
        (customer_id === 'CUST-RENNY' ? 'Lauk Only (No Rice)' : 'Herbox Ricebox'),
      raw_sheet_val,
      source_sheet,
    });
  };

  // -------------------------------------------------------------------------
  // 1. AGS 26 (August 2026)
  // -------------------------------------------------------------------------
  // RENNY (AGS 26): Tue & Thu L+D (16 boxes)
  for (const d of [
    '2026-08-04',
    '2026-08-06',
    '2026-08-11',
    '2026-08-13',
    '2026-08-18',
    '2026-08-20',
    '2026-08-25',
    '2026-08-27',
  ]) {
    addSlot('CUST-RENNY', 'PKG-RENNY-AUG26', d, 'L', 'v', 'AGS 26');
    addSlot('CUST-RENNY', 'PKG-RENNY-AUG26', d, 'D', 'v', 'AGS 26');
  }

  // YOLA (AGS 26): 8 boxes
  const yolaAug: Array<[string, MealSlot]> = [
    ['2026-08-03', 'D'],
    ['2026-08-07', 'L'],
    ['2026-08-11', 'D'],
    ['2026-08-13', 'D'],
    ['2026-08-18', 'D'],
    ['2026-08-20', 'L'],
    ['2026-08-27', 'D'],
    ['2026-08-28', 'L'],
  ];
  for (const [d, slot] of yolaAug) {
    addSlot('CUST-YOLA', 'PKG-YOLA-AUG26', d, slot, '1', 'AGS 26');
  }

  // IVAN (AGS 26): 12 delivered boxes + 6 OFF days (12 OFF slots)
  const ivanAugDelivered: Array<[string, MealSlot]> = [
    ['2026-08-03', 'L'],
    ['2026-08-04', 'D'],
    ['2026-08-06', 'L'],
    ['2026-08-07', 'L'],
    ['2026-08-10', 'L'],
    ['2026-08-11', 'L'],
    ['2026-08-12', 'L'],
    ['2026-08-13', 'L'],
    ['2026-08-14', 'L'],
    ['2026-08-24', 'L'],
    ['2026-08-26', 'L'],
    ['2026-08-27', 'L'],
  ];
  for (const [d, slot] of ivanAugDelivered) {
    addSlot('CUST-IVAN', 'PKG-IVAN-AUG26', d, slot, '1', 'AGS 26');
  }
  for (const offDate of [
    '2026-08-17',
    '2026-08-18',
    '2026-08-19',
    '2026-08-20',
    '2026-08-21',
    '2026-08-25',
  ]) {
    addSlot(
      'CUST-IVAN',
      'PKG-IVAN-AUG26',
      offDate,
      'L',
      'off',
      'AGS 26',
      'Customer Skipped (OFF) — Quota Rolled Over'
    );
    addSlot(
      'CUST-IVAN',
      'PKG-IVAN-AUG26',
      offDate,
      'D',
      'off',
      'AGS 26',
      'Customer Skipped (OFF) — Quota Rolled Over'
    );
  }

  // FINA (AGS 26): 5 boxes prior batch (Aug 10–14) + 10 boxes new 56-box plan (Aug 18–31)
  const finaAugPrior: Array<[string, MealSlot]> = [
    ['2026-08-10', 'D'],
    ['2026-08-11', 'D'],
    ['2026-08-12', 'D'],
    ['2026-08-13', 'D'],
    ['2026-08-14', 'L'],
  ];
  for (const [d, slot] of finaAugPrior) {
    addSlot('CUST-FINA', 'PKG-FINA-AUG26-PRIOR', d, slot, '1', 'AGS 26');
  }

  const finaAug56: Array<[string, MealSlot]> = [
    ['2026-08-18', 'L'],
    ['2026-08-19', 'L'],
    ['2026-08-20', 'L'],
    ['2026-08-21', 'D'],
    ['2026-08-24', 'D'],
    ['2026-08-25', 'L'],
    ['2026-08-26', 'L'],
    ['2026-08-27', 'D'],
    ['2026-08-28', 'L'],
    ['2026-08-31', 'D'],
  ];
  for (const [d, slot] of finaAug56) {
    addSlot('CUST-FINA', 'PKG-FINA-AUG26-56', d, slot, '1', 'AGS 26');
  }

  // -------------------------------------------------------------------------
  // 2. SEPT 26 (September 2026)
  // -------------------------------------------------------------------------
  // RENNY (SEPT 26): Sep 1, 3, 8, 10, 15 (v/v) + Sep 17 (fin/ish) -> PKG-RENNY-AUG26
  for (const d of [
    '2026-09-01',
    '2026-09-03',
    '2026-09-08',
    '2026-09-10',
    '2026-09-15',
  ]) {
    addSlot('CUST-RENNY', 'PKG-RENNY-AUG26', d, 'L', 'v', 'SEPT 26');
    addSlot('CUST-RENNY', 'PKG-RENNY-AUG26', d, 'D', 'v', 'SEPT 26');
  }
  addSlot('CUST-RENNY', 'PKG-RENNY-AUG26', '2026-09-17', 'L', 'fin', 'SEPT 26');
  addSlot('CUST-RENNY', 'PKG-RENNY-AUG26', '2026-09-17', 'D', 'ish', 'SEPT 26');

  // RENNY Renewal (SEPT 26): Mon & Thu starting Sep 21 (Sep 21, 24, 28) -> PKG-RENNY-SEP26
  for (const d of ['2026-09-21', '2026-09-24', '2026-09-28']) {
    addSlot('CUST-RENNY', 'PKG-RENNY-SEP26', d, 'L', 'v', 'SEPT 26');
    addSlot('CUST-RENNY', 'PKG-RENNY-SEP26', d, 'D', 'v', 'SEPT 26');
  }

  // YOLA (SEPT 26): 9 boxes used
  const yolaSept: Array<[string, MealSlot]> = [
    ['2026-09-01', 'D'],
    ['2026-09-03', 'D'],
    ['2026-09-07', 'D'],
    ['2026-09-09', 'D'],
    ['2026-09-14', 'D'],
    ['2026-09-16', 'L'],
    ['2026-09-21', 'D'],
    ['2026-09-24', 'L'],
    ['2026-09-28', 'D'],
  ];
  for (const [d, slot] of yolaSept) {
    addSlot('CUST-YOLA', 'PKG-YOLA-SEP26', d, slot, '1', 'SEPT 26');
  }

  // FINA (SEPT 26): 22 boxes across all weekdays of Sept
  const finaSept: Array<[string, MealSlot]> = [
    ['2026-09-01', 'L'],
    ['2026-09-02', 'L'],
    ['2026-09-03', 'L'],
    ['2026-09-04', 'L'],
    ['2026-09-07', 'L'],
    ['2026-09-08', 'L'],
    ['2026-09-09', 'L'],
    ['2026-09-10', 'D'],
    ['2026-09-11', 'L'],
    ['2026-09-14', 'D'],
    ['2026-09-15', 'L'],
    ['2026-09-16', 'D'],
    ['2026-09-17', 'L'],
    ['2026-09-18', 'D'],
    ['2026-09-21', 'D'],
    ['2026-09-22', 'D'],
    ['2026-09-23', 'D'],
    ['2026-09-24', 'D'],
    ['2026-09-25', 'L'],
    ['2026-09-28', 'L'],
    ['2026-09-29', 'D'],
    ['2026-09-30', 'D'],
  ];
  for (const [d, slot] of finaSept) {
    addSlot('CUST-FINA', 'PKG-FINA-AUG26-56', d, slot, '1', 'SEPT 26');
  }

  // VIKTOR (SEPT 26): Batch 1 (Sep 21–25 Dinner) & Batch 2 (Sep 28–30 Lunch)
  for (const d of [
    '2026-09-21',
    '2026-09-22',
    '2026-09-23',
    '2026-09-24',
    '2026-09-25',
  ]) {
    addSlot('CUST-VIKTOR', 'PKG-VIKTOR-SEP26-1', d, 'D', '1', 'SEPT 26');
  }
  for (const d of ['2026-09-28', '2026-09-29', '2026-09-30']) {
    addSlot('CUST-VIKTOR', 'PKG-VIKTOR-SEP26-2', d, 'L', '1', 'SEPT 26');
  }

  // JYOTI (SEPT 26): Sep 29 & Sep 30 (L + D)
  for (const d of ['2026-09-29', '2026-09-30']) {
    addSlot('CUST-JYOTI', 'PKG-JYOTI-SEP26', d, 'L', '1', 'SEPT 26');
    addSlot('CUST-JYOTI', 'PKG-JYOTI-SEP26', d, 'D', '1', 'SEPT 26');
  }

  // -------------------------------------------------------------------------
  // 3. OKT 26 (October 2026)
  // -------------------------------------------------------------------------
  // RENNY (OKT 26): Mon & Thu L+D (9 days = 18 boxes)
  for (const d of [
    '2026-10-01',
    '2026-10-05',
    '2026-10-08',
    '2026-10-12',
    '2026-10-15',
    '2026-10-19',
    '2026-10-22',
    '2026-10-26',
    '2026-10-29',
  ]) {
    const rawV = d >= '2026-10-19' ? 'V' : 'v';
    addSlot('CUST-RENNY', 'PKG-RENNY-SEP26', d, 'L', rawV, 'OKT 26');
    addSlot('CUST-RENNY', 'PKG-RENNY-SEP26', d, 'D', rawV, 'OKT 26');
  }

  // FINA (OKT 26): Oct 1 & Oct 2 Dinner
  addSlot('CUST-FINA', 'PKG-FINA-AUG26-56', '2026-10-01', 'D', '1', 'OKT 26');
  addSlot('CUST-FINA', 'PKG-FINA-AUG26-56', '2026-10-02', 'D', '1', 'OKT 26');

  // VIKTOR (OKT 26): Oct 1 & Oct 2 Lunch
  addSlot('CUST-VIKTOR', 'PKG-VIKTOR-SEP26-2', '2026-10-01', 'L', '1', 'OKT 26');
  addSlot('CUST-VIKTOR', 'PKG-VIKTOR-SEP26-2', '2026-10-02', 'L', '1', 'OKT 26');

  // JYOTI (OKT 26): Oct 1, Oct 2, Oct 3 (Sat) L + D
  for (const d of ['2026-10-01', '2026-10-02', '2026-10-03']) {
    addSlot(
      'CUST-JYOTI',
      'PKG-JYOTI-SEP26',
      d,
      'L',
      '1',
      'OKT 26',
      d === '2026-10-03' ? 'Saturday Special Delivery' : 'Herbox Ricebox'
    );
    addSlot(
      'CUST-JYOTI',
      'PKG-JYOTI-SEP26',
      d,
      'D',
      '1',
      'OKT 26',
      d === '2026-10-03' ? 'Saturday Special Delivery' : 'Herbox Ricebox'
    );
  }

  // -------------------------------------------------------------------------
  // 4. NOV 26 (November 2026)
  // -------------------------------------------------------------------------
  // RENNY (NOV 26): Mon & Thu L+D (8 days = 16 boxes, ends Nov 26)
  for (const d of [
    '2026-11-02',
    '2026-11-05',
    '2026-11-09',
    '2026-11-12',
    '2026-11-16',
    '2026-11-19',
    '2026-11-23',
    '2026-11-26',
  ]) {
    addSlot('CUST-RENNY', 'PKG-RENNY-SEP26', d, 'L', 'V', 'NOV 26');
    addSlot('CUST-RENNY', 'PKG-RENNY-SEP26', d, 'D', 'V', 'NOV 26');
  }

  // FINA (NOV 26): Nov 2 fin/ish marker
  addSlot('CUST-FINA', 'PKG-FINA-AUG26-56', '2026-11-02', 'L', 'fin', 'NOV 26');
  addSlot('CUST-FINA', 'PKG-FINA-AUG26-56', '2026-11-02', 'D', 'ish', 'NOV 26');

  return rows;
}

const SEED_DELIVERIES: CateringDeliveryRow[] = buildSeedDeliveries();

export const SHEET_DIAGNOSTICS: SheetCleanupInsight[] = [
  {
    id: 'DIAG-OVERLOADED-COL-B',
    customer_name: 'Fina, Yola, Renny, Ivan',
    sheet_tab: 'AGS 26 – NOV 26',
    raw_issue:
      'Column B ("Last Date") mixed remaining quota ("sisa 46 box", "sisa 4 box"), plan names ("5 days 5 box", "Lauk only"), text dates ("27 agst 2026"), and raw Excel serial numbers (46352.0 / 46328.0).',
    digital_solution:
      'Separated into structured fields: Package Plan Quota (Total Boxes), Live Remaining Balance (Sisa Box), and Auto-Calculated Projected Last Date.',
    severity: 'amber',
  },
  {
    id: 'DIAG-HIDDEN-COMMENTS',
    customer_name: 'Fina, Yola, Ivan, Renny',
    sheet_tab: 'JULI 26 & AGS 26',
    raw_issue:
      'Critical renewal history was hidden inside hover-only cell comments (e.g. B14: "baru extend selasa tgl 18 agst 2026 (56 box)", B13: "LAST DATE : 18/8/26").',
    digital_solution:
      'Extracted all cell comments into permanent Package Renewal History logs and automated low-balance renewal alerts.',
    severity: 'blue',
  },
  {
    id: 'DIAG-SKIP-ROLLOVER',
    customer_name: 'Ivan & Flexible Subscribers',
    sheet_tab: 'AGS 26',
    raw_issue:
      'When Ivan skipped 6 weekdays ("off" on Aug 17–21 & Aug 25), staff had to manually recount boxes across columns and overwrite his Last Date from 18 Aug to 27 Aug.',
    digital_solution:
      '1-Click "Skip Date (OFF)" action automatically preserves box quota and rolls the delivery forward to the next eligible weekday.',
    severity: 'emerald',
  },
  {
    id: 'DIAG-FINISH-MARKERS',
    customer_name: 'Renny & Fina',
    sheet_tab: 'SEPT 26 & NOV 26',
    raw_issue:
      'Staff typed "fin" into the Lunch (L) column and "ish" into the Dinner (D) column ("fin"+"ish" = finish) on Sep 17 and Nov 2, breaking numeric SUM/COUNT formulas.',
    digital_solution:
      'Tracked via explicit Package Completion Milestones while keeping numeric Lunch (L) and Dinner (D) kitchen prep counts 100% accurate.',
    severity: 'rose',
  },
];

// ============================================================================
// DATABASE INITIALIZATION & SEEDING
// ============================================================================

const globalForCatering = globalThis as unknown as {
  __fnbCateringSchemaEnsured?: boolean;
};

export async function initializeCateringSchemaAndSeed(
  instance?: DuckDBInstance
): Promise<void> {
  const db = instance || (await getDuckDB());
  const conn = await db.connect();
  try {
    await conn.run(`
      CREATE TABLE IF NOT EXISTS catering_customers (
        customer_id VARCHAR PRIMARY KEY,
        customer_name VARCHAR NOT NULL,
        category VARCHAR NOT NULL,
        phone VARCHAR DEFAULT '',
        delivery_address VARCHAR DEFAULT '',
        dietary_notes VARCHAR DEFAULT '',
        default_days VARCHAR DEFAULT 'MON,TUE,WED,THU,FRI',
        default_slot VARCHAR DEFAULT 'FLEX',
        status VARCHAR DEFAULT 'active',
        sheet_raw_label VARCHAR DEFAULT '',
        excel_comment VARCHAR DEFAULT '',
        updated_at TIMESTAMP
      );
    `);

    await conn.run(`
      CREATE TABLE IF NOT EXISTS catering_packages (
        package_id VARCHAR PRIMARY KEY,
        customer_id VARCHAR NOT NULL,
        package_name VARCHAR NOT NULL,
        program_type VARCHAR NOT NULL,
        total_boxes INTEGER NOT NULL,
        start_date VARCHAR NOT NULL,
        manual_last_date VARCHAR,
        price_per_box DOUBLE DEFAULT 45000,
        payment_status VARCHAR DEFAULT 'paid',
        sheet_note VARCHAR DEFAULT '',
        excel_comment VARCHAR DEFAULT '',
        status VARCHAR DEFAULT 'active',
        updated_at TIMESTAMP
      );
    `);

    await conn.run(`
      CREATE TABLE IF NOT EXISTS catering_deliveries (
        delivery_id VARCHAR PRIMARY KEY,
        customer_id VARCHAR NOT NULL,
        package_id VARCHAR NOT NULL,
        delivery_date VARCHAR NOT NULL,
        meal_slot VARCHAR NOT NULL,
        status VARCHAR NOT NULL,
        box_qty INTEGER NOT NULL,
        menu_note VARCHAR DEFAULT '',
        raw_sheet_val VARCHAR DEFAULT '',
        source_sheet VARCHAR DEFAULT '',
        updated_at TIMESTAMP
      );
    `);

    const countRes = await conn.run(`SELECT count(*) FROM catering_customers`);
    const countRows = await countRes.getRows();
    const existingCustomers = Number(countRows[0]?.[0] ?? 0);

    if (existingCustomers === 0) {
      const custValues = SEED_CUSTOMERS.map(
        (c) => `(
          '${sqlEsc(c.customer_id)}',
          '${sqlEsc(c.customer_name)}',
          '${sqlEsc(c.category)}',
          '${sqlEsc(c.phone)}',
          '${sqlEsc(c.delivery_address)}',
          '${sqlEsc(c.dietary_notes)}',
          '${sqlEsc(c.default_days)}',
          '${sqlEsc(c.default_slot)}',
          '${sqlEsc(c.status)}',
          '${sqlEsc(c.sheet_raw_label)}',
          '${sqlEsc(c.excel_comment)}'
        )`
      ).join(',\n');

      await conn.run(`
        INSERT INTO catering_customers (
          customer_id, customer_name, category, phone, delivery_address,
          dietary_notes, default_days, default_slot, status, sheet_raw_label, excel_comment
        )
        VALUES ${custValues}
        ON CONFLICT (customer_id) DO NOTHING;
      `);

      const pkgValues = SEED_PACKAGES.map(
        (p) => `(
          '${sqlEsc(p.package_id)}',
          '${sqlEsc(p.customer_id)}',
          '${sqlEsc(p.package_name)}',
          '${sqlEsc(p.program_type)}',
          ${p.total_boxes},
          '${sqlEsc(p.start_date)}',
          ${p.manual_last_date ? `'${sqlEsc(p.manual_last_date)}'` : 'NULL'},
          ${p.price_per_box},
          '${sqlEsc(p.payment_status)}',
          '${sqlEsc(p.sheet_note)}',
          '${sqlEsc(p.excel_comment)}',
          '${sqlEsc(p.status)}'
        )`
      ).join(',\n');

      await conn.run(`
        INSERT INTO catering_packages (
          package_id, customer_id, package_name, program_type, total_boxes,
          start_date, manual_last_date, price_per_box, payment_status,
          sheet_note, excel_comment, status
        )
        VALUES ${pkgValues}
        ON CONFLICT (package_id) DO NOTHING;
      `);

      const BATCH_SIZE = 30;
      for (let i = 0; i < SEED_DELIVERIES.length; i += BATCH_SIZE) {
        const chunk = SEED_DELIVERIES.slice(i, i + BATCH_SIZE);
        const delivValues = chunk
          .map(
            (d) => `(
              '${sqlEsc(d.delivery_id)}',
              '${sqlEsc(d.customer_id)}',
              '${sqlEsc(d.package_id)}',
              '${sqlEsc(d.delivery_date)}',
              '${sqlEsc(d.meal_slot)}',
              '${sqlEsc(d.status)}',
              ${d.box_qty},
              '${sqlEsc(d.menu_note)}',
              '${sqlEsc(d.raw_sheet_val)}',
              '${sqlEsc(d.source_sheet)}'
            )`
          )
          .join(',\n');

        await conn.run(`
          INSERT INTO catering_deliveries (
            delivery_id, customer_id, package_id, delivery_date, meal_slot,
            status, box_qty, menu_note, raw_sheet_val, source_sheet
          )
          VALUES ${delivValues}
          ON CONFLICT (delivery_id) DO NOTHING;
        `);
      }

      await conn.run(`CHECKPOINT;`);
      invalidateQueryCache();
    }

    globalForCatering.__fnbCateringSchemaEnsured = true;
  } catch (err) {
    console.warn('[DuckDB Catering Seed Notice]', err);
  } finally {
    try {
      conn.closeSync();
    } catch {
      // ignore
    }
  }
}

async function ensureCateringReady(): Promise<void> {
  if (!globalForCatering.__fnbCateringSchemaEnsured) {
    await initializeCateringSchemaAndSeed();
  }
}

// ============================================================================
// DATE & SCHEDULE HELPER FUNCTIONS
// ============================================================================

function parseDateParts(dateStr: string): { y: number; m: number; d: number } {
  const [y, m, d] = dateStr.split('-').map(Number);
  return { y: y || 2026, m: m || 8, d: d || 1 };
}

function getDayOfWeekIndex(dateStr: string): number {
  const { y, m, d } = parseDateParts(dateStr);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

function addDays(dateStr: string, days: number): string {
  const { y, m, d } = parseDateParts(dateStr);
  const dt = new Date(Date.UTC(y, m - 1, d + days));
  const yy = dt.getUTCFullYear();
  const mm = String(dt.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(dt.getUTCDate()).padStart(2, '0');
  return `${yy}-${mm}-${dd}`;
}

function getDaysInMonth(yearMonth: string): number {
  const [y, m] = yearMonth.split('-').map(Number);
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
}

function parseAllowedDays(defaultDaysStr: string): Set<number> {
  const reverseMap: Record<string, number> = {
    SUN: 0,
    MON: 1,
    TUE: 2,
    WED: 3,
    THU: 4,
    FRI: 5,
    SAT: 6,
  };
  const set = new Set<number>();
  for (const part of (defaultDaysStr || '').split(',')) {
    const clean = part.trim().toUpperCase();
    if (clean in reverseMap) set.add(reverseMap[clean]);
  }
  if (set.size === 0) {
    return new Set([1, 2, 3, 4, 5]); // default Mon-Fri
  }
  return set;
}

/**
 * Projects the Last Date when a customer still has unscheduled boxes in their active package.
 */
function projectCompletionDate(
  lastScheduledOrStartDate: string,
  unscheduledBoxes: number,
  defaultDaysStr: string,
  defaultSlot: string
): string {
  if (unscheduledBoxes <= 0) return lastScheduledOrStartDate;
  const allowedDows = parseAllowedDays(defaultDaysStr);
  const boxesPerDay = defaultSlot === 'L+D' ? 2 : 1;
  let remaining = unscheduledBoxes;
  let cursor =
    lastScheduledOrStartDate > REFERENCE_TODAY
      ? lastScheduledOrStartDate
      : REFERENCE_TODAY;
  let safety = 0;

  while (remaining > 0 && safety < 365) {
    cursor = addDays(cursor, 1);
    safety++;
    const dow = getDayOfWeekIndex(cursor);
    if (allowedDows.has(dow)) {
      remaining -= boxesPerDay;
    }
  }
  return cursor;
}

// ============================================================================
// MAIN DASHBOARD QUERY
// ============================================================================

export async function getCateringCrmDashboard(options?: {
  month?: string;
  date?: string;
}): Promise<CateringCrmDashboardData> {
  await ensureCateringReady();

  const selectedMonth =
    options?.month && /^\d{4}-\d{2}$/.test(options.month)
      ? options.month
      : '2026-09';

  const defaultDateForMonth =
    selectedMonth === '2026-09' ? REFERENCE_TODAY : `${selectedMonth}-01`;
  const selectedDate =
    options?.date && /^\d{4}-\d{2}-\d{2}$/.test(options.date)
      ? options.date
      : defaultDateForMonth;

  const customersRaw = await runQuery<CateringCustomerRow>(`
    SELECT
      customer_id,
      customer_name,
      category,
      COALESCE(phone, '') AS phone,
      COALESCE(delivery_address, '') AS delivery_address,
      COALESCE(dietary_notes, '') AS dietary_notes,
      COALESCE(default_days, 'MON,TUE,WED,THU,FRI') AS default_days,
      COALESCE(default_slot, 'FLEX') AS default_slot,
      COALESCE(status, 'active') AS status,
      COALESCE(sheet_raw_label, '') AS sheet_raw_label,
      COALESCE(excel_comment, '') AS excel_comment
    FROM catering_customers
    ORDER BY
      CASE category
        WHEN 'LUNCH_DINNER' THEN 1
        WHEN 'LAUK' THEN 2
        WHEN 'LUNCH_OR_DINNER' THEN 3
        ELSE 4
      END,
      customer_name ASC;
  `);

  const packagesRaw = await runQuery<CateringPackageRow>(`
    SELECT
      package_id,
      customer_id,
      package_name,
      program_type,
      CAST(total_boxes AS INTEGER) AS total_boxes,
      start_date,
      manual_last_date,
      CAST(COALESCE(price_per_box, 45000) AS DOUBLE) AS price_per_box,
      COALESCE(payment_status, 'paid') AS payment_status,
      COALESCE(sheet_note, '') AS sheet_note,
      COALESCE(excel_comment, '') AS excel_comment,
      COALESCE(status, 'active') AS status
    FROM catering_packages
    ORDER BY start_date ASC, package_id ASC;
  `);

  const deliveriesRaw = await runQuery<CateringDeliveryRow>(`
    SELECT
      delivery_id,
      customer_id,
      package_id,
      delivery_date,
      meal_slot,
      status,
      CAST(box_qty AS INTEGER) AS box_qty,
      COALESCE(menu_note, '') AS menu_note,
      COALESCE(raw_sheet_val, '') AS raw_sheet_val,
      COALESCE(source_sheet, '') AS source_sheet
    FROM catering_deliveries
    ORDER BY delivery_date ASC, meal_slot ASC;
  `);

  // Normalize delivery status relative to REFERENCE_TODAY for active boxes
  const deliveries: CateringDeliveryRow[] = deliveriesRaw.map((d) => {
    if (d.status === 'skipped' || d.status === 'finish_marker') {
      return { ...d, box_qty: 0 };
    }
    const normalizedStatus: DeliverySlotStatus =
      d.delivery_date <= REFERENCE_TODAY ? 'delivered' : 'scheduled';
    return {
      ...d,
      status: normalizedStatus,
      box_qty: Number(d.box_qty) > 0 ? Number(d.box_qty) : 1,
    };
  });

  // Group deliveries by package_id and customer_id
  const delivByPkg = new Map<string, CateringDeliveryRow[]>();
  const delivByCust = new Map<string, CateringDeliveryRow[]>();

  for (const d of deliveries) {
    const pList = delivByPkg.get(d.package_id) || [];
    pList.push(d);
    delivByPkg.set(d.package_id, pList);

    const cList = delivByCust.get(d.customer_id) || [];
    cList.push(d);
    delivByCust.set(d.customer_id, cList);
  }

  // Enrich packages & customers
  const customerMap = new Map<string, CateringCustomerRow>();
  for (const c of customersRaw) customerMap.set(c.customer_id, c);

  const enrichedPackagesByCust = new Map<string, EnrichedCateringPackage[]>();
  for (const pkg of packagesRaw) {
    const cust = customerMap.get(pkg.customer_id);
    const pDelivs = delivByPkg.get(pkg.package_id) || [];
    let delivered = 0;
    let scheduled = 0;
    let skipped = 0;
    let maxActiveDate: string | null = null;
    let finishMarkerDate: string | null = null;

    for (const d of pDelivs) {
      if (d.status === 'delivered') {
        delivered += d.box_qty;
        if (!maxActiveDate || d.delivery_date > maxActiveDate) {
          maxActiveDate = d.delivery_date;
        }
      } else if (d.status === 'scheduled') {
        scheduled += d.box_qty;
        if (!maxActiveDate || d.delivery_date > maxActiveDate) {
          maxActiveDate = d.delivery_date;
        }
      } else if (d.status === 'skipped') {
        skipped += 1;
      } else if (d.status === 'finish_marker') {
        finishMarkerDate = d.delivery_date;
      }
    }

    if (pkg.status === 'completed' && pDelivs.length === 0) {
      delivered = pkg.total_boxes;
    }

    const used = delivered + scheduled;
    const unscheduled =
      pkg.status === 'completed' ? 0 : Math.max(0, pkg.total_boxes - used);
    const leftToDeliver =
      pkg.status === 'completed' ? 0 : Math.max(0, pkg.total_boxes - delivered);

    let computedLastDate = maxActiveDate || finishMarkerDate || pkg.manual_last_date;
    if (unscheduled > 0 && cust && pkg.status !== 'completed') {
      computedLastDate = projectCompletionDate(
        maxActiveDate || pkg.start_date,
        unscheduled,
        cust.default_days,
        cust.default_slot
      );
    }

    const effectiveLastDate =
      finishMarkerDate || computedLastDate || pkg.manual_last_date;

    const enrichedPkg: EnrichedCateringPackage = {
      ...pkg,
      boxes_delivered: delivered,
      boxes_scheduled: scheduled,
      boxes_used: used,
      boxes_remaining: leftToDeliver,
      unscheduled_boxes: unscheduled,
      boxes_left_to_deliver: leftToDeliver,
      skipped_slots_count: skipped,
      computed_last_date: computedLastDate,
      effective_last_date: effectiveLastDate,
    };

    const list = enrichedPackagesByCust.get(pkg.customer_id) || [];
    list.push(enrichedPkg);
    enrichedPackagesByCust.set(pkg.customer_id, list);
  }

  const enrichedCustomers: EnrichedCateringCustomer[] = customersRaw.map(
    (c) => {
      const pkgs = enrichedPackagesByCust.get(c.customer_id) || [];
      const activePkg =
        pkgs.find((p) => p.status === 'active') ||
        pkgs[pkgs.length - 1] ||
        null;

      const cDelivs = delivByCust.get(c.customer_id) || [];
      const skippedDates = new Set(
        cDelivs.filter((d) => d.status === 'skipped').map((d) => d.delivery_date)
      );

      const totalPurchased = pkgs.reduce((s, p) => s + p.total_boxes, 0);
      const totalDelivered = pkgs.reduce((s, p) => s + p.boxes_delivered, 0);
      const totalScheduled = pkgs.reduce((s, p) => s + p.boxes_scheduled, 0);

      const activeQuotaTotal = activePkg ? activePkg.total_boxes : 0;
      const activeQuotaUsed = activePkg ? activePkg.boxes_used : 0;
      const activeQuotaUnscheduled = activePkg
        ? activePkg.unscheduled_boxes
        : 0;
      const activeBoxesLeft = activePkg ? activePkg.boxes_left_to_deliver : 0;
      const projectedLastDate = activePkg
        ? activePkg.effective_last_date
        : null;

      let renewalUrgency: 'critical' | 'soon' | 'healthy' | 'inactive' =
        'healthy';
      let renewalReason = 'Active schedule on track';

      if (c.status !== 'active' || !activePkg || activePkg.status === 'completed') {
        renewalUrgency = 'inactive';
        renewalReason =
          c.customer_name === 'Ivan'
            ? 'Finished 12-box package on 27 Aug (after 6 OFF days) — Follow up to renew'
            : 'Prior package completed — Ready for reactivation';
      } else if (activeBoxesLeft <= 3) {
        renewalUrgency = 'critical';
        renewalReason = `Only ${activeBoxesLeft} box${
          activeBoxesLeft === 1 ? '' : 'es'
        } left before completion (${projectedLastDate || 'soon'})`;
      } else if (activeBoxesLeft <= 8) {
        renewalUrgency = 'soon';
        renewalReason = `${activeBoxesLeft} boxes left · Finishes ${
          projectedLastDate || 'soon'
        }`;
      }

      return {
        ...c,
        category_label: getCategoryLabel(c.category),
        packages: pkgs,
        active_package: activePkg,
        total_boxes_purchased: totalPurchased,
        total_boxes_delivered: totalDelivered,
        total_boxes_scheduled: totalScheduled,
        total_boxes_remaining: activeBoxesLeft,
        active_quota_total: activeQuotaTotal,
        active_quota_used: activeQuotaUsed,
        active_quota_unscheduled: activeQuotaUnscheduled,
        active_boxes_left_to_deliver: activeBoxesLeft,
        skipped_dates_count: skippedDates.size,
        projected_last_date: projectedLastDate,
        renewal_urgency: renewalUrgency,
        renewal_reason: renewalReason,
      };
    }
  );

  // Build available months summary (Aug 2026 – Nov 2026)
  const monthKeys = ['2026-08', '2026-09', '2026-10', '2026-11'];
  const availableMonths = monthKeys.map((mKey) => {
    const meta = MONTH_META[mKey] || {
      sheet_name: mKey,
      label: mKey,
      short_label: mKey,
    };
    const mDelivs = deliveries.filter((d) => d.delivery_date.startsWith(mKey));
    const deliveredBoxes = mDelivs
      .filter((d) => d.status === 'delivered')
      .reduce((s, d) => s + d.box_qty, 0);
    const scheduledBoxes = mDelivs
      .filter((d) => d.status === 'scheduled')
      .reduce((s, d) => s + d.box_qty, 0);
    const skippedSlots = mDelivs.filter((d) => d.status === 'skipped').length;
    const activeCusts = new Set(
      mDelivs.filter((d) => d.box_qty > 0).map((d) => d.customer_id)
    ).size;

    return {
      month_key: mKey,
      sheet_name: meta.sheet_name,
      label: meta.label,
      short_label: meta.short_label,
      delivered_boxes: deliveredBoxes,
      scheduled_boxes: scheduledBoxes,
      skipped_slots: skippedSlots,
      active_customers: activeCusts,
    };
  });

  // Build calendar headers & matrix for selectedMonth
  const daysCount = getDaysInMonth(selectedMonth);
  const matrix: Record<
    string,
    Record<string, { L?: CateringDeliveryRow; D?: CateringDeliveryRow }>
  > = {};
  for (const c of enrichedCustomers) {
    matrix[c.customer_id] = {};
  }

  const monthDeliveries = deliveries.filter((d) =>
    d.delivery_date.startsWith(selectedMonth)
  );
  for (const d of monthDeliveries) {
    if (!matrix[d.customer_id]) matrix[d.customer_id] = {};
    if (!matrix[d.customer_id][d.delivery_date]) {
      matrix[d.customer_id][d.delivery_date] = {};
    }
    matrix[d.customer_id][d.delivery_date][d.meal_slot] = d;
  }

  const calendarDays: CalendarDayHeader[] = [];
  for (let dayNum = 1; dayNum <= daysCount; dayNum++) {
    const dd = String(dayNum).padStart(2, '0');
    const dateStr = `${selectedMonth}-${dd}`;
    const dowIdx = getDayOfWeekIndex(dateStr);
    const dayDelivs = monthDeliveries.filter(
      (d) => d.delivery_date === dateStr
    );
    const lunchBoxes = dayDelivs
      .filter((d) => d.meal_slot === 'L' && d.box_qty > 0)
      .reduce((s, d) => s + d.box_qty, 0);
    const dinnerBoxes = dayDelivs
      .filter((d) => d.meal_slot === 'D' && d.box_qty > 0)
      .reduce((s, d) => s + d.box_qty, 0);
    const skippedCount = dayDelivs.filter((d) => d.status === 'skipped').length;

    calendarDays.push({
      date: dateStr,
      day_num: dayNum,
      dow_index: dowIdx,
      dow_id: INDONESIAN_DOW[dowIdx],
      dow_short: INDONESIAN_DOW_SHORT[dowIdx],
      is_weekend: dowIdx === 0 || dowIdx === 6,
      is_today: dateStr === REFERENCE_TODAY,
      is_past: dateStr < REFERENCE_TODAY,
      lunch_boxes: lunchBoxes,
      dinner_boxes: dinnerBoxes,
      total_boxes: lunchBoxes + dinnerBoxes,
      skipped_count: skippedCount,
    });
  }

  // Build Daily Dispatch Manifest for selectedDate
  const enrichedCustMap = new Map<string, EnrichedCateringCustomer>();
  for (const c of enrichedCustomers) enrichedCustMap.set(c.customer_id, c);

  const dateDelivs = deliveries.filter((d) => d.delivery_date === selectedDate);
  const lunchItems: DailyDispatchItem[] = [];
  const dinnerItems: DailyDispatchItem[] = [];
  const skippedItems: DailyDispatchItem[] = [];

  for (const d of dateDelivs) {
    const cust = enrichedCustMap.get(d.customer_id);
    if (!cust) continue;
    const pkg = cust.packages.find((p) => p.package_id === d.package_id);
    const item: DailyDispatchItem = {
      delivery_id: d.delivery_id,
      customer_id: cust.customer_id,
      customer_name: cust.customer_name,
      category: cust.category,
      category_label: cust.category_label,
      package_name: pkg?.package_name || cust.active_package?.package_name || 'Catering Plan',
      meal_slot: d.meal_slot,
      status: d.status,
      box_qty: d.box_qty,
      menu_note:
        d.menu_note ||
        (cust.category === 'LAUK' ? 'Lauk Only (No Rice)' : 'Herbox Ricebox'),
      dietary_notes: cust.dietary_notes,
      delivery_address: cust.delivery_address,
      phone: cust.phone,
      boxes_left_to_deliver: cust.active_boxes_left_to_deliver,
      projected_last_date: cust.projected_last_date,
    };

    if (d.status === 'skipped') {
      skippedItems.push(item);
    } else if (d.box_qty > 0) {
      if (d.meal_slot === 'L') lunchItems.push(item);
      else dinnerItems.push(item);
    }
  }

  // Month KPIs
  const monthLunchBoxes = monthDeliveries
    .filter((d) => d.meal_slot === 'L' && d.box_qty > 0)
    .reduce((s, d) => s + d.box_qty, 0);
  const monthDinnerBoxes = monthDeliveries
    .filter((d) => d.meal_slot === 'D' && d.box_qty > 0)
    .reduce((s, d) => s + d.box_qty, 0);
  const monthDeliveredBoxes = monthDeliveries
    .filter((d) => d.status === 'delivered')
    .reduce((s, d) => s + d.box_qty, 0);
  const monthScheduledBoxes = monthDeliveries
    .filter((d) => d.status === 'scheduled')
    .reduce((s, d) => s + d.box_qty, 0);
  const monthLaukBoxes = monthDeliveries
    .filter((d) => {
      const c = enrichedCustMap.get(d.customer_id);
      return c?.category === 'LAUK' && d.box_qty > 0;
    })
    .reduce((s, d) => s + d.box_qty, 0);
  const monthSkippedSlots = monthDeliveries.filter(
    (d) => d.status === 'skipped'
  ).length;

  const totalRemainingLiability = enrichedCustomers
    .filter((c) => c.status === 'active')
    .reduce((s, c) => s + c.active_boxes_left_to_deliver, 0);

  const renewalAlertsCount = enrichedCustomers.filter(
    (c) => c.renewal_urgency === 'critical' || c.renewal_urgency === 'soon'
  ).length;

  const selDow = getDayOfWeekIndex(selectedDate);
  const dayLabel = `${INDONESIAN_DOW[selDow]}, ${selectedDate}`;

  return {
    reference_today: REFERENCE_TODAY,
    selected_month: selectedMonth,
    selected_date: selectedDate,
    available_months: availableMonths,
    kpi: {
      active_subscribers: enrichedCustomers.filter((c) => c.status === 'active')
        .length,
      total_customers: enrichedCustomers.length,
      month_total_boxes: monthLunchBoxes + monthDinnerBoxes,
      month_delivered_boxes: monthDeliveredBoxes,
      month_scheduled_boxes: monthScheduledBoxes,
      month_lunch_boxes: monthLunchBoxes,
      month_dinner_boxes: monthDinnerBoxes,
      month_lauk_boxes: monthLaukBoxes,
      month_skipped_slots: monthSkippedSlots,
      total_remaining_liability_boxes: totalRemainingLiability,
      renewal_alerts_count: renewalAlertsCount,
      selected_date_lunch_boxes: lunchItems.reduce((s, i) => s + i.box_qty, 0),
      selected_date_dinner_boxes: dinnerItems.reduce((s, i) => s + i.box_qty, 0),
      selected_date_total_boxes:
        lunchItems.reduce((s, i) => s + i.box_qty, 0) +
        dinnerItems.reduce((s, i) => s + i.box_qty, 0),
      selected_date_skipped: skippedItems.length,
    },
    customers: enrichedCustomers,
    calendar_days: calendarDays,
    matrix,
    daily_manifest: {
      date: selectedDate,
      day_label: dayLabel,
      lunch_items: lunchItems,
      dinner_items: dinnerItems,
      skipped_items: skippedItems,
    },
    sheet_Diagnostics: SHEET_DIAGNOSTICS,
  };
}

// ============================================================================
// MUTATIONS: FLEXIBLE SKIP (OFF), SLOT UPDATE, SWAP L<->D, PACKAGE & CUSTOMER
// ============================================================================

export async function updateCateringSlot(params: {
  customer_id: string;
  delivery_date: string;
  meal_slot: MealSlot;
  action: 'schedule' | 'skip' | 'clear' | 'swap_slot';
  menu_note?: string;
  auto_rollover?: boolean;
}): Promise<{ rolledOverToDate?: string | null }> {
  await ensureCateringReady();
  const db = await getDuckDB();
  const conn = await db.connect();

  try {
    const {
      customer_id,
      delivery_date,
      meal_slot,
      action,
      menu_note = '',
      auto_rollover = true,
    } = params;

    const custRows = await runQuery<CateringCustomerRow>(`
      SELECT * FROM catering_customers WHERE customer_id = '${sqlEsc(customer_id)}' LIMIT 1;
    `);
    const cust = custRows[0];
    if (!cust) throw new Error(`Customer not found: ${customer_id}`);

    const pkgRows = await runQuery<CateringPackageRow>(`
      SELECT * FROM catering_packages
      WHERE customer_id = '${sqlEsc(customer_id)}'
      ORDER BY CASE WHEN status = 'active' THEN 0 ELSE 1 END, start_date DESC
      LIMIT 1;
    `);
    const activePkg = pkgRows[0];
    const package_id = activePkg ? activePkg.package_id : `PKG-${customer_id}-DEFAULT`;

    const delivery_id = `${customer_id}_${delivery_date}_${meal_slot}`;
    const ym = delivery_date.slice(0, 7);
    const source_sheet = MONTH_META[ym]?.sheet_name || ym;

    if (action === 'clear') {
      await conn.run(`
        DELETE FROM catering_deliveries WHERE delivery_id = '${sqlEsc(delivery_id)}';
      `);
      await conn.run(`CHECKPOINT;`);
      invalidateQueryCache();
      return {};
    }

    if (action === 'swap_slot') {
      const otherSlot: MealSlot = meal_slot === 'L' ? 'D' : 'L';
      const otherId = `${customer_id}_${delivery_date}_${otherSlot}`;
      await conn.run(`
        DELETE FROM catering_deliveries WHERE delivery_id = '${sqlEsc(delivery_id)}';
      `);
      const status: DeliverySlotStatus =
        delivery_date <= REFERENCE_TODAY ? 'delivered' : 'scheduled';
      const rawVal = cust.category === 'LAUK' ? 'v' : '1';
      const defaultNote =
        menu_note ||
        (cust.category === 'LAUK'
          ? 'Lauk Only (Swapped Slot)'
          : `Swapped from ${meal_slot} to ${otherSlot}`);
      await conn.run(`
        INSERT INTO catering_deliveries (
          delivery_id, customer_id, package_id, delivery_date, meal_slot,
          status, box_qty, menu_note, raw_sheet_val, source_sheet
        )
        VALUES (
          '${sqlEsc(otherId)}',
          '${sqlEsc(customer_id)}',
          '${sqlEsc(package_id)}',
          '${sqlEsc(delivery_date)}',
          '${sqlEsc(otherSlot)}',
          '${sqlEsc(status)}',
          1,
          '${sqlEsc(defaultNote)}',
          '${sqlEsc(rawVal)}',
          '${sqlEsc(source_sheet)}'
        )
        ON CONFLICT (delivery_id) DO UPDATE SET
          status = EXCLUDED.status,
          box_qty = EXCLUDED.box_qty,
          menu_note = EXCLUDED.menu_note,
          raw_sheet_val = EXCLUDED.raw_sheet_val;
      `);
      await conn.run(`CHECKPOINT;`);
      invalidateQueryCache();
      return {};
    }

    if (action === 'schedule') {
      const status: DeliverySlotStatus =
        delivery_date <= REFERENCE_TODAY ? 'delivered' : 'scheduled';
      const rawVal = cust.category === 'LAUK' ? 'v' : '1';
      const defaultNote =
        menu_note ||
        (cust.category === 'LAUK' ? 'Lauk Only (No Rice)' : 'Herbox Ricebox');

      await conn.run(`
        INSERT INTO catering_deliveries (
          delivery_id, customer_id, package_id, delivery_date, meal_slot,
          status, box_qty, menu_note, raw_sheet_val, source_sheet
        )
        VALUES (
          '${sqlEsc(delivery_id)}',
          '${sqlEsc(customer_id)}',
          '${sqlEsc(package_id)}',
          '${sqlEsc(delivery_date)}',
          '${sqlEsc(meal_slot)}',
          '${sqlEsc(status)}',
          1,
          '${sqlEsc(defaultNote)}',
          '${sqlEsc(rawVal)}',
          '${sqlEsc(source_sheet)}'
        )
        ON CONFLICT (delivery_id) DO UPDATE SET
          status = EXCLUDED.status,
          box_qty = 1,
          menu_note = EXCLUDED.menu_note,
          raw_sheet_val = EXCLUDED.raw_sheet_val;
      `);
      await conn.run(`CHECKPOINT;`);
      invalidateQueryCache();
      return {};
    }

    // action === 'skip' (Customer skips date -> 'OFF')
    // Check if there was previously a scheduled/delivered box on this slot
    const existingRows = await runQuery<CateringDeliveryRow>(`
      SELECT * FROM catering_deliveries WHERE delivery_id = '${sqlEsc(delivery_id)}' LIMIT 1;
    `);
    const hadActiveBox =
      existingRows.length > 0 && Number(existingRows[0].box_qty) > 0;

    const skipNote =
      menu_note || 'Customer Skipped Date (OFF) — Box Quota Preserved';

    await conn.run(`
      INSERT INTO catering_deliveries (
        delivery_id, customer_id, package_id, delivery_date, meal_slot,
        status, box_qty, menu_note, raw_sheet_val, source_sheet
      )
      VALUES (
        '${sqlEsc(delivery_id)}',
        '${sqlEsc(customer_id)}',
        '${sqlEsc(package_id)}',
        '${sqlEsc(delivery_date)}',
        '${sqlEsc(meal_slot)}',
        'skipped',
        0,
        '${sqlEsc(skipNote)}',
        'off',
        '${sqlEsc(source_sheet)}'
      )
      ON CONFLICT (delivery_id) DO UPDATE SET
        status = 'skipped',
        box_qty = 0,
        menu_note = EXCLUDED.menu_note,
        raw_sheet_val = 'off';
    `);

    let rolledOverToDate: string | null = null;

    if (auto_rollover && hadActiveBox) {
      // Find the latest scheduled/delivered date for this customer and roll the box to the next eligible weekday
      const allCustDelivs = await runQuery<CateringDeliveryRow>(`
        SELECT delivery_date, meal_slot, status, CAST(box_qty AS INTEGER) AS box_qty
        FROM catering_deliveries
        WHERE customer_id = '${sqlEsc(customer_id)}';
      `);
      const occupiedDates = new Set(
        allCustDelivs
          .filter((d) => d.status === 'skipped' || (d.box_qty > 0 && d.meal_slot === meal_slot))
          .map((d) => d.delivery_date)
      );
      // For flexible 1-box/day customers, also avoid dates that already have either L or D
      if (cust.default_slot !== 'L+D' && cust.category !== 'LAUK') {
        for (const d of allCustDelivs) {
          if (d.box_qty > 0) occupiedDates.add(d.delivery_date);
        }
      }

      let maxDate = delivery_date;
      for (const d of allCustDelivs) {
        if (d.box_qty > 0 && d.delivery_date > maxDate) {
          maxDate = d.delivery_date;
        }
      }

      const allowedDows = parseAllowedDays(cust.default_days);
      let cursor = maxDate;
      for (let step = 0; step < 90; step++) {
        cursor = addDays(cursor, 1);
        const dow = getDayOfWeekIndex(cursor);
        if (allowedDows.has(dow) && !occupiedDates.has(cursor)) {
          rolledOverToDate = cursor;
          break;
        }
      }

      if (rolledOverToDate) {
        const rollId = `${customer_id}_${rolledOverToDate}_${meal_slot}`;
        const rollYm = rolledOverToDate.slice(0, 7);
        const rollSheet = MONTH_META[rollYm]?.sheet_name || rollYm;
        const rollStatus: DeliverySlotStatus =
          rolledOverToDate <= REFERENCE_TODAY ? 'delivered' : 'scheduled';
        const rawVal = cust.category === 'LAUK' ? 'v' : '1';

        await conn.run(`
          INSERT INTO catering_deliveries (
            delivery_id, customer_id, package_id, delivery_date, meal_slot,
            status, box_qty, menu_note, raw_sheet_val, source_sheet
          )
          VALUES (
            '${sqlEsc(rollId)}',
            '${sqlEsc(customer_id)}',
            '${sqlEsc(package_id)}',
            '${sqlEsc(rolledOverToDate)}',
            '${sqlEsc(meal_slot)}',
            '${sqlEsc(rollStatus)}',
            1,
            'Auto-rolled over from skipped date ${sqlEsc(delivery_date)}',
            '${sqlEsc(rawVal)}',
            '${sqlEsc(rollSheet)}'
          )
          ON CONFLICT (delivery_id) DO UPDATE SET
            status = EXCLUDED.status,
            box_qty = 1,
            menu_note = EXCLUDED.menu_note;
        `);
      }
    }

    await conn.run(`CHECKPOINT;`);
    invalidateQueryCache();
    return { rolledOverToDate };
  } finally {
    try {
      conn.closeSync();
    } catch {
      // ignore
    }
  }
}

export async function createOrExtendCateringPackage(params: {
  customer_id: string;
  package_name: string;
  total_boxes: number;
  start_date: string;
  price_per_box?: number;
  default_days?: string;
  meal_slot_mode?: 'L' | 'D' | 'L+D';
  auto_generate_schedule?: boolean;
  sheet_note?: string;
}): Promise<{ package_id: string; generated_slots: number; last_date: string | null }> {
  await ensureCateringReady();
  const db = await getDuckDB();
  const conn = await db.connect();

  try {
    const custRows = await runQuery<CateringCustomerRow>(`
      SELECT * FROM catering_customers WHERE customer_id = '${sqlEsc(params.customer_id)}' LIMIT 1;
    `);
    const cust = custRows[0];
    if (!cust) throw new Error(`Customer not found: ${params.customer_id}`);

    const package_id = `PKG-${params.customer_id.replace('CUST-', '')}-${Date.now()
      .toString()
      .slice(-5)}`;
    const totalBoxes = Math.max(1, Number(params.total_boxes) || 5);
    const pricePerBox = Number(params.price_per_box) || 45000;
    const daysStr = params.default_days || cust.default_days || 'MON,TUE,WED,THU,FRI';
    const slotMode =
      params.meal_slot_mode ||
      (cust.default_slot === 'L+D'
        ? 'L+D'
        : cust.default_slot === 'D'
          ? 'D'
          : 'L');

    // Mark prior packages as completed if starting a new active package
    await conn.run(`
      UPDATE catering_packages
      SET status = 'completed'
      WHERE customer_id = '${sqlEsc(params.customer_id)}' AND status = 'active';
    `);

    await conn.run(`
      UPDATE catering_customers
      SET status = 'active',
          default_days = '${sqlEsc(daysStr)}',
          default_slot = '${sqlEsc(slotMode)}'
      WHERE customer_id = '${sqlEsc(params.customer_id)}';
    `);

    let lastDate: string | null = null;
    let generatedCount = 0;

    if (params.auto_generate_schedule !== false) {
      const allowedDows = parseAllowedDays(daysStr);
      let boxesToPlace = totalBoxes;
      let cursor = params.start_date;
      let safety = 0;

      const slotsToInsert: CateringDeliveryRow[] = [];

      while (boxesToPlace > 0 && safety < 240) {
        const dow = getDayOfWeekIndex(cursor);
        if (allowedDows.has(dow)) {
          const ym = cursor.slice(0, 7);
          const sheetName = MONTH_META[ym]?.sheet_name || ym;
          const status: DeliverySlotStatus =
            cursor <= REFERENCE_TODAY ? 'delivered' : 'scheduled';
          const rawVal = cust.category === 'LAUK' ? 'V' : '1';
          const menuNote =
            cust.category === 'LAUK' ? 'Lauk Only (No Rice)' : 'Herbox Ricebox';

          if (slotMode === 'L+D') {
            slotsToInsert.push({
              delivery_id: `${cust.customer_id}_${cursor}_L`,
              customer_id: cust.customer_id,
              package_id,
              delivery_date: cursor,
              meal_slot: 'L',
              status,
              box_qty: 1,
              menu_note: menuNote,
              raw_sheet_val: rawVal,
              source_sheet: sheetName,
            });
            boxesToPlace -= 1;
            if (boxesToPlace > 0) {
              slotsToInsert.push({
                delivery_id: `${cust.customer_id}_${cursor}_D`,
                customer_id: cust.customer_id,
                package_id,
                delivery_date: cursor,
                meal_slot: 'D',
                status,
                box_qty: 1,
                menu_note: menuNote,
                raw_sheet_val: rawVal,
                source_sheet: sheetName,
              });
              boxesToPlace -= 1;
            }
          } else {
            const slot: MealSlot = slotMode === 'D' ? 'D' : 'L';
            slotsToInsert.push({
              delivery_id: `${cust.customer_id}_${cursor}_${slot}`,
              customer_id: cust.customer_id,
              package_id,
              delivery_date: cursor,
              meal_slot: slot,
              status,
              box_qty: 1,
              menu_note: menuNote,
              raw_sheet_val: rawVal,
              source_sheet: sheetName,
            });
            boxesToPlace -= 1;
          }
          lastDate = cursor;
        }
        cursor = addDays(cursor, 1);
        safety++;
      }

      for (const s of slotsToInsert) {
        await conn.run(`
          INSERT INTO catering_deliveries (
            delivery_id, customer_id, package_id, delivery_date, meal_slot,
            status, box_qty, menu_note, raw_sheet_val, source_sheet
          )
          VALUES (
            '${sqlEsc(s.delivery_id)}',
            '${sqlEsc(s.customer_id)}',
            '${sqlEsc(s.package_id)}',
            '${sqlEsc(s.delivery_date)}',
            '${sqlEsc(s.meal_slot)}',
            '${sqlEsc(s.status)}',
            ${s.box_qty},
            '${sqlEsc(s.menu_note)}',
            '${sqlEsc(s.raw_sheet_val)}',
            '${sqlEsc(s.source_sheet)}'
          )
          ON CONFLICT (delivery_id) DO UPDATE SET
            package_id = EXCLUDED.package_id,
            status = EXCLUDED.status,
            box_qty = EXCLUDED.box_qty,
            menu_note = EXCLUDED.menu_note;
        `);
      }
      generatedCount = slotsToInsert.length;
    }

    await conn.run(`
      INSERT INTO catering_packages (
        package_id, customer_id, package_name, program_type, total_boxes,
        start_date, manual_last_date, price_per_box, payment_status,
        sheet_note, excel_comment, status
      )
      VALUES (
        '${sqlEsc(package_id)}',
        '${sqlEsc(params.customer_id)}',
        '${sqlEsc(params.package_name)}',
        '${sqlEsc(cust.category)}',
        ${totalBoxes},
        '${sqlEsc(params.start_date)}',
        ${lastDate ? `'${sqlEsc(lastDate)}'` : 'NULL'},
        ${pricePerBox},
        'paid',
        '${sqlEsc(params.sheet_note || `Extended on ${REFERENCE_TODAY}`)}',
        '',
        'active'
      );
    `);

    await conn.run(`CHECKPOINT;`);
    invalidateQueryCache();
    return { package_id, generated_slots: generatedCount, last_date: lastDate };
  } finally {
    try {
      conn.closeSync();
    } catch {
      // ignore
    }
  }
}

export async function upsertCateringCustomer(params: {
  customer_id?: string;
  customer_name: string;
  category: CateringProgramCategory;
  phone?: string;
  delivery_address?: string;
  dietary_notes?: string;
  default_days?: string;
  default_slot?: 'L' | 'D' | 'L+D' | 'FLEX';
  status?: 'active' | 'completed' | 'paused';
  initial_package_boxes?: number;
  initial_start_date?: string;
}): Promise<{ customer_id: string }> {
  await ensureCateringReady();
  const db = await getDuckDB();
  const conn = await db.connect();

  try {
    const cleanName = params.customer_name.trim();
    if (!cleanName) throw new Error('Customer name is required');

    const customer_id =
      params.customer_id ||
      `CUST-${cleanName.toUpperCase().replace(/[^A-Z0-9]+/g, '')}`;

    await conn.run(`
      INSERT INTO catering_customers (
        customer_id, customer_name, category, phone, delivery_address,
        dietary_notes, default_days, default_slot, status, sheet_raw_label, excel_comment
      )
      VALUES (
        '${sqlEsc(customer_id)}',
        '${sqlEsc(cleanName)}',
        '${sqlEsc(params.category)}',
        '${sqlEsc(params.phone || '')}',
        '${sqlEsc(params.delivery_address || '')}',
        '${sqlEsc(params.dietary_notes || '')}',
        '${sqlEsc(params.default_days || 'MON,TUE,WED,THU,FRI')}',
        '${sqlEsc(params.default_slot || 'FLEX')}',
        '${sqlEsc(params.status || 'active')}',
        'CRM Digital Profile',
        ''
      )
      ON CONFLICT (customer_id) DO UPDATE SET
        customer_name = EXCLUDED.customer_name,
        category = EXCLUDED.category,
        phone = EXCLUDED.phone,
        delivery_address = EXCLUDED.delivery_address,
        dietary_notes = EXCLUDED.dietary_notes,
        default_days = EXCLUDED.default_days,
        default_slot = EXCLUDED.default_slot,
        status = EXCLUDED.status;
    `);

    await conn.run(`CHECKPOINT;`);
    invalidateQueryCache();

    if (params.initial_package_boxes && params.initial_package_boxes > 0) {
      await createOrExtendCateringPackage({
        customer_id,
        package_name: `${params.initial_package_boxes} Box Personal Catering Plan`,
        total_boxes: params.initial_package_boxes,
        start_date: params.initial_start_date || REFERENCE_TODAY,
        default_days: params.default_days || 'MON,TUE,WED,THU,FRI',
        meal_slot_mode:
          params.default_slot === 'L+D'
            ? 'L+D'
            : params.default_slot === 'D'
              ? 'D'
              : 'L',
        auto_generate_schedule: true,
      });
    }

    return { customer_id };
  } finally {
    try {
      conn.closeSync();
    } catch {
      // ignore
    }
  }
}

// ============================================================================
// 1. WHATSAPP MESSAGE & RENEWAL ASSISTANT HELPERS
// ============================================================================

export * from './catering-whatsapp';

// ============================================================================
// 2. SUBSCRIBER SELF-SERVICE PORTAL DATA
// ============================================================================

export interface CustomerPortalData {
  customer: EnrichedCateringCustomer;
  active_package: EnrichedCateringPackage | null;
  current_month_deliveries: CateringDeliveryRow[];
  upcoming_deliveries: CateringDeliveryRow[];
  cutoff_info: {
    lunch_cutoff_hour: string;
    dinner_cutoff_hour: string;
    description: string;
  };
}

export async function getCustomerPortalData(customerId: string): Promise<CustomerPortalData | null> {
  await ensureCateringReady();
  const dashboard = await getCateringCrmDashboard({ month: '2026-09' });
  const cust = dashboard.customers.find((c) => c.customer_id === customerId);
  if (!cust) return null;

  const allDelivs = await runQuery<CateringDeliveryRow>(`
    SELECT
      delivery_id, customer_id, package_id, delivery_date, meal_slot,
      status, CAST(box_qty AS INTEGER) AS box_qty,
      COALESCE(menu_note, '') AS menu_note,
      COALESCE(raw_sheet_val, '') AS raw_sheet_val,
      COALESCE(source_sheet, '') AS source_sheet
    FROM catering_deliveries
    WHERE customer_id = '${sqlEsc(customerId)}'
    ORDER BY delivery_date ASC, meal_slot ASC;
  `);

  const currentMonth = REFERENCE_TODAY.slice(0, 7);
  const currentMonthDeliveries = allDelivs.filter((d) => d.delivery_date.startsWith(currentMonth));
  const upcomingDeliveries = allDelivs.filter((d) => d.delivery_date >= REFERENCE_TODAY);

  return {
    customer: cust,
    active_package: cust.active_package,
    current_month_deliveries: currentMonthDeliveries,
    upcoming_deliveries: upcomingDeliveries,
    cutoff_info: {
      lunch_cutoff_hour: '08:30 WIB',
      dinner_cutoff_hour: '14:00 WIB',
      description: 'Perubahan jam makan atau skip hari harus diajukan sebelum jam cutoff agar dapur dapat menyesuaikan persiapan bahan segar.',
    },
  };
}

// ============================================================================
// 3. CUSTOMER PORTAL SELF-SERVICE PROFILE UPDATE
// ============================================================================

export async function updateCustomerPortalProfile(params: {
  customer_id: string;
  delivery_address: string;
  dietary_notes: string;
  phone?: string;
}): Promise<void> {
  await ensureCateringReady();
  const db = await getDuckDB();
  const conn = await db.connect();
  try {
    let updateSql = `
      UPDATE catering_customers
      SET
        delivery_address = '${sqlEsc(params.delivery_address.trim())}',
        dietary_notes = '${sqlEsc(params.dietary_notes.trim())}'
    `;
    if (params.phone) {
      updateSql += `, phone = '${sqlEsc(params.phone.trim())}'`;
    }
    updateSql += ` WHERE customer_id = '${sqlEsc(params.customer_id)}';`;

    await conn.run(updateSql);
    await conn.run(`CHECKPOINT;`);
    invalidateQueryCache();
  } finally {
    try {
      conn.closeSync();
    } catch {
      // ignore
    }
  }
}

// ============================================================================
// 4. BILLING, PAYMENT STATUS & INVOICE ENGINE
// ============================================================================

export * from './catering-invoice';

export async function updatePackagePaymentStatus(params: {
  package_id: string;
  payment_status: 'paid' | 'pending';
}): Promise<void> {
  await ensureCateringReady();
  const db = await getDuckDB();
  const conn = await db.connect();
  try {
    await conn.run(`
      UPDATE catering_packages
      SET payment_status = '${sqlEsc(params.payment_status)}'
      WHERE package_id = '${sqlEsc(params.package_id)}';
    `);
    await conn.run(`CHECKPOINT;`);
    invalidateQueryCache();
  } finally {
    try {
      conn.closeSync();
    } catch {
      // ignore
    }
  }
}

// ============================================================================
// 5. HERBOX CATERING EXECUTIVE TELEMETRY SUMMARY
// ============================================================================

export interface CateringExecutiveSummary {
  total_subscribers: number;
  active_subscribers: number;
  total_packages: number;
  total_revenue_billed: number;
  total_revenue_paid: number;
  total_revenue_pending: number;
  total_boxes_contracted: number;
  total_boxes_delivered: number;
  total_boxes_scheduled: number;
  total_boxes_skipped: number;
  fulfillment_rate_pct: number;
  estimated_mrr: number;
  category_breakdown: {
    category: CateringProgramCategory;
    label: string;
    subscribers: number;
    boxes: number;
    revenue: number;
  }[];
}

export async function getCateringExecutiveSummary(): Promise<CateringExecutiveSummary> {
  await ensureCateringReady();
  const dashboard = await getCateringCrmDashboard({ month: '2026-09' });

  const totalSubscribers = dashboard.customers.length;
  const activeSubscribers = dashboard.customers.filter((c) => c.status === 'active').length;

  let totalPackages = 0;
  let totalRevenueBilled = 0;
  let totalRevenuePaid = 0;
  let totalRevenuePending = 0;
  let totalBoxesContracted = 0;
  let totalBoxesDelivered = 0;
  let totalBoxesScheduled = 0;
  let totalBoxesSkipped = 0;

  for (const cust of dashboard.customers) {
    totalPackages += cust.packages.length;
    for (const pkg of cust.packages) {
      const revenue = pkg.total_boxes * pkg.price_per_box;
      totalRevenueBilled += revenue;
      if (pkg.payment_status === 'paid') {
        totalRevenuePaid += revenue;
      } else {
        totalRevenuePending += revenue;
      }
      totalBoxesContracted += pkg.total_boxes;
      totalBoxesDelivered += pkg.boxes_delivered;
      totalBoxesScheduled += pkg.boxes_scheduled;
      totalBoxesSkipped += pkg.skipped_slots_count;
    }
  }

  const fulfillmentRate = totalBoxesContracted > 0
    ? Math.round((totalBoxesDelivered / totalBoxesContracted) * 100)
    : 0;

  let activeMrr = 0;
  for (const cust of dashboard.customers) {
    if (cust.status === 'active' && cust.active_package) {
      const pkg = cust.active_package;
      const pkgRev = pkg.total_boxes * pkg.price_per_box;
      const durationWeeks = Math.max(1, pkg.total_boxes / (cust.category === 'LUNCH_DINNER' ? 10 : 5));
      const monthlyRate = (pkgRev / durationWeeks) * 4.3;
      activeMrr += Math.round(monthlyRate);
    }
  }

  const catMap: Record<CateringProgramCategory, { subscribers: number; boxes: number; revenue: number }> = {
    LUNCH_DINNER: { subscribers: 0, boxes: 0, revenue: 0 },
    LAUK: { subscribers: 0, boxes: 0, revenue: 0 },
    LUNCH_OR_DINNER: { subscribers: 0, boxes: 0, revenue: 0 },
  };

  for (const cust of dashboard.customers) {
    const entry = catMap[cust.category] || { subscribers: 0, boxes: 0, revenue: 0 };
    entry.subscribers += 1;
    for (const pkg of cust.packages) {
      entry.boxes += pkg.total_boxes;
      entry.revenue += pkg.total_boxes * pkg.price_per_box;
    }
  }

  const categoryBreakdown = [
    {
      category: 'LUNCH_DINNER' as CateringProgramCategory,
      label: '2x Meals Daily (Lunch + Dinner)',
      subscribers: catMap.LUNCH_DINNER.subscribers,
      boxes: catMap.LUNCH_DINNER.boxes,
      revenue: catMap.LUNCH_DINNER.revenue,
    },
    {
      category: 'LAUK' as CateringProgramCategory,
      label: 'Lauk Only (Protein & Sayur)',
      subscribers: catMap.LAUK.subscribers,
      boxes: catMap.LAUK.boxes,
      revenue: catMap.LAUK.revenue,
    },
    {
      category: 'LUNCH_OR_DINNER' as CateringProgramCategory,
      label: 'Flexible Lunch / Dinner (1 Box/Day)',
      subscribers: catMap.LUNCH_OR_DINNER.subscribers,
      boxes: catMap.LUNCH_OR_DINNER.boxes,
      revenue: catMap.LUNCH_OR_DINNER.revenue,
    },
  ];

  return {
    total_subscribers: totalSubscribers,
    active_subscribers: activeSubscribers,
    total_packages: totalPackages,
    total_revenue_billed: totalRevenueBilled,
    total_revenue_paid: totalRevenuePaid,
    total_revenue_pending: totalRevenuePending,
    total_boxes_contracted: totalBoxesContracted,
    total_boxes_delivered: totalBoxesDelivered,
    total_boxes_scheduled: totalBoxesScheduled,
    total_boxes_skipped: totalBoxesSkipped,
    fulfillment_rate_pct: fulfillmentRate,
    estimated_mrr: activeMrr,
    category_breakdown: categoryBreakdown,
  };
}


