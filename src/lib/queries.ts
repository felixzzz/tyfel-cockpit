import { runQuery, MASTER_RECIPES } from './duckdb';


export interface SourceFreshness {
  sourceKey: 'klikit' | 'dine_in_pos';
  sourceName: string;
  channelType: string;
  branchCoverage: string;
  lastOrderDate: string | null;
  lastOrderFormatted: string;
  lastImportedDate: string | null;
  lastImportedFormatted: string;
  earliestDate: string | null;
  orderCount: number;
  status: 'active' | 'pending' | 'stale';
  statusBadge: string;
  sourceFile: string | null;
  description: string;
}

export interface DataFreshnessSummary {
  sources: SourceFreshness[];
  klikit: SourceFreshness;
  dineInPos: SourceFreshness;
  overallCoverage: string;
  itemCoverage?: OrderItemCoverageAudit;
}

export interface QueryFilters {
  branch?: string;
  range?: string;
  from?: string;
  to?: string;
}

export interface PeriodDeltaMetrics {
  comparisonLabel: string;
  gmvDeltaPct: number | null;
  netPayoutDeltaPct: number | null;
  ordersDeltaPct: number | null;
  aovDeltaPct: number | null;
  promoBurnRateDeltaPts: number | null;
  slaBreachRateDeltaPts: number | null;
  cancelRateDeltaPts: number | null;
}

export interface DailyTrendPoint {
  date: string;
  dateLabel: string;
  order_count: number;
  gross_gmv: number;
  net_payout: number;
  merchant_promo_burn: number;
  net_realization_rate: number;
  avg_prep_time_min: number;
  sla_breaches: number;
}

export interface PrimeCostSummary {
  grossGmv: number;
  merchantPromoBurn: number;
  platformFeesAndCommissions: number;
  netRevenue: number;
  netRealizationPct: number;
  rawFoodCost: number;
  packagingCost: number;
  totalCogs: number;
  cogsPctOfNetRevenue: number;
  cogsPctOfGrossGmv: number;
  grossMarginAfterCogs: number;
  grossMarginAfterCogsPct: number;
  laborIncluded: boolean;
  laborOutletScope: string;
  activeStaffCount: number;
  paidShiftsCount: number;
  effectiveLaborHours: number;
  lateIncidentsCount: number;
  grossShiftAndBaseWages: number;
  latePenaltiesDeducted: number;
  netLaborCost: number;
  laborPctOfNetRevenue: number;
  laborPctOfGrossGmv: number;
  revenuePerLaborHour: number;
  primeCost: number;
  primeCostPctOfNetRevenue: number;
  primeCostPctOfGrossGmv: number;
  primeCostTargetPct: number;
  primeCostStatus: 'Optimal' | 'Watchlist' | 'High Strain';
  netContributionMarginRp: number;
  netContributionMarginPct: number;
  activeDaysCount: number;
  dateSpanLabel: string;
}

export interface CatalogBomItem {
  recipe_id: string | null;
  brand: string;
  item_name: string;
  canonical_name: string;
  category: string;
  bom_summary: string;
  raw_food_cost: number;
  packaging_dine_in: number;
  packaging_delivery: number;
  target_food_cost_pct: number;
  is_hero_bom: boolean;
  has_recipe_bom: boolean;
  is_seeded_default: boolean;
  realized_menu_price: number;
  total_units_sold: number;
}

export interface UpsertRecipeBomInput {
  recipe_id?: string | null;
  brand: string;
  item_name: string;
  canonical_name: string;
  category: string;
  bom_summary: string;
  raw_food_cost: number;
  packaging_dine_in: number;
  packaging_delivery: number;
  target_food_cost_pct: number;
  is_hero_bom?: boolean;
}

export interface ExecutiveSummary {
  total_orders: number;
  total_gross_gmv: number;
  total_net_payout: number;
  net_realization_rate: number;
  total_merchant_promo_burn: number;
  promo_burn_rate_pct: number;
  avg_order_value: number;
  sla_breach_count: number;
  sla_breach_rate_pct: number;
  red_alert_count: number;
  avg_prep_time_minutes: number;
  cancelled_orders_count: number;
  cancellation_rate_pct: number;
  cancelled_gross_gmv: number;
  cancelled_net_payout: number;
  post_prep_cancelled_count: number;
  deltas?: PeriodDeltaMetrics;
}

export interface BrandStats {
  brand: string;
  branch: string;
  order_count: number;
  gross_gmv: number;
  net_payout: number;
  net_realization_rate: number;
  merchant_promo_burn: number;
  promo_burn_rate_pct: number;
  avg_prep_time_min: number;
  sla_breaches: number;
}

export interface BranchStats {
  branch: string;
  order_count: number;
  gross_gmv: number;
  net_payout: number;
  net_realization_rate: number;
  merchant_promo_burn: number;
  avg_prep_time_min: number;
  sla_breaches: number;
}

export interface ChannelStats {
  provider: string;
  order_count: number;
  gross_gmv: number;
  net_payout: number;
  merchant_promo_burn: number;
  net_realization_rate: number;
}

export interface TopItem {
  item_name: string;
  brand: string;
  branch: string;
  total_qty: number;
  total_revenue: number;
}

export interface HourlyTrend {
  hour_of_day: number;
  order_count: number;
  gross_gmv: number;
}

export interface BrandDetailKPI {
  brand: string;
  order_count: number;
  gross_gmv: number;
  net_payout: number;
  net_realization_rate: number;
  merchant_promo_burn: number;
  promo_burn_rate_pct: number;
  total_units_sold: number;
  avg_order_value: number;
  avg_prep_time_min: number;
  sla_breaches: number;
  sla_breach_rate_pct: number;
  red_alerts: number;
  peak_rush_breaches: number;
  cancelled_orders_count: number;
  cancellation_rate_pct: number;
  cancelled_gross_gmv: number;
  cancelled_net_payout: number;
  post_prep_cancelled_count: number;
  deltas?: PeriodDeltaMetrics;
}

export interface SkuParetoItem {
  item_name: string;
  category: string;
  total_qty: number;
  total_revenue: number;
  avg_unit_price: number;
  orders_present: number;
  share_of_volume_pct: number;
  cumulative_volume_pct: number;
  tier: 'Tier A' | 'Tier B' | 'Tier C';
  action_label: string;
}

export interface BrandChannelStats {
  provider: string;
  order_count: number;
  gross_gmv: number;
  net_payout: number;
  merchant_promo_burn: number;
  promo_burn_rate_pct: number;
  net_realization_rate: number;
}

export interface BrandBranchStats {
  branch: string;
  order_count: number;
  gross_gmv: number;
  net_payout: number;
  avg_prep_time_min: number;
  sla_breaches: number;
  red_alerts: number;
}

export interface BrandHourlyStats {
  hour_of_day: number;
  order_count: number;
  gross_gmv: number;
  avg_prep_time_min: number;
  sla_breaches: number;
  rush_window: 'Lunch Rush' | 'Dinner Rush' | 'Off-Peak';
}

export type MenuEngineeringQuadrant = 'Star' | 'Plowhorse' | 'Puzzle' | 'Dog';

export interface MenuEngineeringItem {
  recipe_id?: string | null;
  brand?: string;
  item_name: string;
  canonical_name: string;
  category: string;
  bom_summary: string;
  is_hero_bom: boolean;
  has_recipe_bom: boolean;
  total_qty: number;
  dine_in_qty: number;
  delivery_qty: number;
  menu_price: number;
  raw_food_cost: number;
  packaging_dine_in: number;
  packaging_delivery: number;
  weighted_packaging_cost: number;
  unit_total_cost: number;
  unit_gross_margin: number;
  total_gross_margin: number;
  food_cost_pct: number;
  packaging_drag_pct: number;
  target_food_cost_pct: number;
  quadrant: MenuEngineeringQuadrant;
  quadrant_action: string;
}

export interface HeroRecipeBomSummary {
  recipe_id: string;
  brand: string;
  item_name: string;
  canonical_name: string;
  category: string;
  bom_summary: string;
  raw_food_cost: number;
  packaging_dine_in: number;
  packaging_delivery: number;
  target_food_cost_pct: number;
  realized_menu_price: number;
  realized_units_sold: number;
  dine_in_margin_rp: number;
  delivery_margin_rp: number;
  dine_in_food_cost_pct: number;
  delivery_food_cost_pct: number;
  packaging_drag_pct: number;
}

export interface MenuEngineeringSummary {
  starsCount: number;
  plowhorsesCount: number;
  puzzlesCount: number;
  dogsCount: number;
  avgFoodCostPct: number;
  avgPackagingDragPct: number;
  totalTheoreticalMarginRp: number;
  avgVolumeBenchmark: number;
  avgMarginBenchmarkRp: number;
  heroBoms: HeroRecipeBomSummary[];
}

export interface OrderItemBrandCoverage {
  brand: string;
  branch: string;
  channel_group: string;
  total_orders: number;
  orders_with_items: number;
  orphan_orders: number;
  coverage_pct: number;
  order_gross_gmv: number;
  item_exploded_revenue: number;
  total_units_sold: number;
  min_date: string | null;
  max_date: string | null;
  status: 'Complete' | 'Partial Gap' | 'Missing Items CSV';
}

export interface OrderItemCoverageAudit {
  totalOrders: number;
  ordersWithItems: number;
  orphanOrdersCount: number;
  orderCoveragePct: number;
  totalItemRows: number;
  totalUnitsSold: number;
  orderGrossGmv: number;
  itemExplodedRevenue: number;
  unreconciledGmvGap: number;
  brandBreakdown: OrderItemBrandCoverage[];
}

export interface SlaHeatmapCell {
  dow: number;
  dowLabel: string;
  hour: number;
  orderCount: number;
  kptSampleCount: number;
  avgPrepTimeMin: number;
  slaBreaches: number;
  redAlerts: number;
  breachRatePct: number;
}

export interface DaypartSlaStats {
  daypart: 'Breakfast (07-10)' | 'Lunch Rush (11-13)' | 'Afternoon (14-17)' | 'Dinner Rush (18-20)' | 'Late / Off-Hours';
  orderCount: number;
  kptSampleCount: number;
  avgPrepTimeMin: number;
  slaBreaches: number;
  redAlerts: number;
  breachRatePct: number;
  grossGmv: number;
}

export interface BreachTicketItem {
  order_id: string;
  brand: string;
  branch: string;
  provider: string;
  created_at_formatted: string;
  prep_time_minutes: number;
  sla_target_min: number;
  overage_minutes: number;
  is_red_alert: boolean;
  gross_amount: number;
  total_units: number;
  distinct_skus: number;
  basket_summary: string;
}

export interface BranchKitchenSlaProfile {
  branch: 'Combined' | 'Kemang' | 'Greenville';
  kitchenType: string;
  slaTargetMin: number;
  totalOrders: number;
  totalKptOrders: number;
  avgPrepTimeMin: number;
  p90PrepTimeMin: number;
  totalBreaches: number;
  totalRedAlerts: number;
  breachRatePct: number;
  worstDayHourLabel: string;
  worstDayHourPrepMin: number;
  heatmapCells: SlaHeatmapCell[];
  dayparts: DaypartSlaStats[];
  topBreachTickets: BreachTicketItem[];
}

export interface KitchenSlaDiagnostic {
  activeBranchFilter: 'all' | 'kemang' | 'greenville';
  combined: BranchKitchenSlaProfile;
  kemang: BranchKitchenSlaProfile;
  greenville: BranchKitchenSlaProfile;
  totalKptOrders: number;
  avgPrepTimeMin: number;
  p90PrepTimeMin: number;
  totalBreaches: number;
  totalRedAlerts: number;
  breachRatePct: number;
  worstDayHourLabel: string;
  worstDayHourPrepMin: number;
  heatmapCells: SlaHeatmapCell[];
  dayparts: DaypartSlaStats[];
  topBreachTickets: BreachTicketItem[];
}

export interface CanceledOrderItem {
  order_id: string;
  short_id: string;
  provider: string;
  brand: string;
  branch: string;
  created_at_formatted: string;
  hour_of_day: number;
  daypart_label: string;
  gross_amount: number;
  net_payout: number;
  cancellation_reason: string;
  reason_label: string;
  cancelled_by: string;
  prep_stage: 'Post-Prep Food Waste' | 'Pre-Prep Lost Sale';
  prep_time_minutes: number | null;
  meal_prep_time_raw: string;
  items_ordered: number;
  menu_items_summary: string;
}

export interface CancellationReasonBreakdown {
  reason_code: string;
  reason_label: string;
  cancelled_by: string;
  order_count: number;
  share_of_cancels_pct: number;
  lost_gross_gmv: number;
  lost_net_payout: number;
  operational_fix: string;
}

export interface CancellationWindowBreakdown {
  window_label: string;
  time_range: string;
  cancelled_orders: number;
  lost_gross_gmv: number;
  share_of_lost_gmv_pct: number;
  root_cause_note: string;
}

export interface CancellationBrandBreakdown {
  brand: string;
  completed_orders: number;
  cancelled_orders: number;
  cancellation_rate_pct: number;
  lost_gross_gmv: number;
  lost_net_payout: number;
  post_prep_waste_count: number;
}

export interface BranchCancellationProfile {
  branch: 'Combined' | 'Kemang' | 'Greenville';
  completedOrders: number;
  cancelledOrders: number;
  cancellationRatePct: number;
  lostGrossGmv: number;
  lostNetPayout: number;
  postPrepWasteOrders: number;
  postPrepWasteGrossGmv: number;
  prePrepLostOrders: number;
  prePrepLostGrossGmv: number;
  earlyOpeningCancels: number;
  earlyOpeningLostGmv: number;
  gofoodCancels: number;
  grabfoodCancels: number;
  reasons: CancellationReasonBreakdown[];
  windows: CancellationWindowBreakdown[];
  brands: CancellationBrandBreakdown[];
  tickets: CanceledOrderItem[];
}

export interface CanceledOrdersDiagnostic {
  activeBranchFilter: 'all' | 'kemang' | 'greenville';
  combined: BranchCancellationProfile;
  kemang: BranchCancellationProfile;
  greenville: BranchCancellationProfile;
}

export interface BrandDetailData {
  brandName: string;
  slug: string;
  kpi: BrandDetailKPI;
  skus: SkuParetoItem[];
  menuEngineering: MenuEngineeringItem[];
  menuEngineeringSummary: MenuEngineeringSummary;
  slaDiagnostic: KitchenSlaDiagnostic;
  cancellationDiagnostic: CanceledOrdersDiagnostic;
  channels: BrandChannelStats[];
  branches: BrandBranchStats[];
  hourly: BrandHourlyStats[];
  dailyTrend: DailyTrendPoint[];
  paretoSummary: {
    heroCount: number;
    secondaryCount: number;
    watchlistCount: number;
    totalUnits: number;
    heroSharePct: number;
  };
}


export const BRAND_SLUG_MAP: Record<string, string> = {
  'abc': 'American Breakfast Club',
  'american-breakfast-club': 'American Breakfast Club',
  'labc': 'LA Breakfast Club',
  'la-breakfast-club': 'LA Breakfast Club',
  'herbox': 'Herbox',
  'people-pasta': 'People Pasta',
  'tyfel': 'Tyfel Coffee',
  'tyfel-coffee': 'Tyfel Coffee',
};

export const ALL_BRAND_NAV = [
  { slug: 'american-breakfast-club', name: 'American Breakfast Club', shortName: 'ABC' },
  { slug: 'herbox', name: 'Herbox', shortName: 'Herbox' },
  { slug: 'people-pasta', name: 'People Pasta', shortName: 'People Pasta' },
  { slug: 'tyfel-coffee', name: 'Tyfel Coffee', shortName: 'Tyfel' },
  { slug: 'la-breakfast-club', name: 'LA Breakfast Club', shortName: 'LABC' },
];

export function resolveBrandName(slugOrName: string): string {
  const normalized = decodeURIComponent(slugOrName).toLowerCase().trim();
  if (BRAND_SLUG_MAP[normalized]) {
    return BRAND_SLUG_MAP[normalized];
  }
  const found = ALL_BRAND_NAV.find(b => b.name.toLowerCase() === normalized || b.slug === normalized);
  if (found) return found.name;
  return slugOrName;
}

export function brandToSlug(brand: string): string {
  const match = ALL_BRAND_NAV.find(b => b.name.toLowerCase() === brand.toLowerCase());
  if (match) return match.slug;
  return brand.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

export function buildDateAndBranchFilterClause(filters?: QueryFilters, tablePrefix: string = ''): string {
  const p = tablePrefix ? `${tablePrefix}.` : '';
  const clauses: string[] = ['1=1'];

  if (filters?.branch && filters.branch.toLowerCase() !== 'all') {
    const escapedBranch = filters.branch.toLowerCase().replace(/'/g, "''");
    clauses.push(`LOWER(${p}branch) = '${escapedBranch}'`);
  }

  if (filters?.from && filters?.to) {
    const escapedFrom = filters.from.replace(/'/g, "''");
    const escapedTo = filters.to.replace(/'/g, "''");
    clauses.push(`CAST(${p}created_at AS DATE) >= '${escapedFrom}'`);
    clauses.push(`CAST(${p}created_at AS DATE) <= '${escapedTo}'`);
  } else if (filters?.from) {
    const escapedFrom = filters.from.replace(/'/g, "''");
    clauses.push(`CAST(${p}created_at AS DATE) >= '${escapedFrom}'`);
  } else if (filters?.to) {
    const escapedTo = filters.to.replace(/'/g, "''");
    clauses.push(`CAST(${p}created_at AS DATE) <= '${escapedTo}'`);
  } else if (filters?.range) {
    const r = filters.range.toLowerCase();
    if (r === 'today') {
      clauses.push(`CAST(${p}created_at AS DATE) = CAST(CURRENT_DATE AS DATE)`);
    } else if (r === 'yesterday') {
      clauses.push(`CAST(${p}created_at AS DATE) = CAST(CURRENT_DATE - INTERVAL 1 DAY AS DATE)`);
    } else if (r === '7d') {
      clauses.push(`CAST(${p}created_at AS DATE) >= CAST(CURRENT_DATE - INTERVAL 7 DAY AS DATE)`);
    } else if (r === '30d') {
      clauses.push(`CAST(${p}created_at AS DATE) >= CAST(CURRENT_DATE - INTERVAL 30 DAY AS DATE)`);
    }
  }

  return clauses.join(' AND ');
}

export function buildWhereClause(filters?: QueryFilters, tablePrefix: string = ''): string {
  const p = tablePrefix ? `${tablePrefix}.` : '';
  return `${p}status != 'CANCELLED' AND ${buildDateAndBranchFilterClause(filters, tablePrefix)}`;
}

function calcPctDelta(curr: number, prev: number): number | null {
  if (prev <= 0) return curr > 0 ? 100 : null;
  return Number((((curr - prev) / prev) * 100).toFixed(1));
}

function calcPtsDelta(curr: number, prev: number): number | null {
  if (prev === 0 && curr === 0) return null;
  return Number((curr - prev).toFixed(1));
}

export async function computePeriodDeltas(
  filters?: QueryFilters,
  brandName?: string
): Promise<PeriodDeltaMetrics> {
  const branchClause =
    filters?.branch && filters.branch.toLowerCase() !== 'all'
      ? ` AND LOWER(branch) = '${filters.branch.toLowerCase().replace(/'/g, "''")}'`
      : '';
  const brandClause = brandName
    ? ` AND LOWER(brand) = '${brandName.toLowerCase().replace(/'/g, "''")}'`
    : '';

  let comparisonLabel = '7d vs Prior 7d';
  let currDateCond = `CAST(created_at AS DATE) >= CAST((SELECT MAX(created_at) FROM fact_orders) AS DATE) - INTERVAL 6 DAY`;
  let prevDateCond = `CAST(created_at AS DATE) >= CAST((SELECT MAX(created_at) FROM fact_orders) AS DATE) - INTERVAL 13 DAY AND CAST(created_at AS DATE) < CAST((SELECT MAX(created_at) FROM fact_orders) AS DATE) - INTERVAL 6 DAY`;

  const range = (filters?.range || 'all').toLowerCase();
  if (filters?.from && filters?.to) {
    const fromDate = new Date(`${filters.from}T00:00:00Z`);
    const toDate = new Date(`${filters.to}T00:00:00Z`);
    const spanDays = Math.max(1, Math.round((toDate.getTime() - fromDate.getTime()) / 86400000) + 1);
    const prevTo = new Date(fromDate.getTime() - 86400000).toISOString().slice(0, 10);
    const prevFrom = new Date(fromDate.getTime() - spanDays * 86400000).toISOString().slice(0, 10);
    comparisonLabel = `vs Prior ${spanDays}d`;
    currDateCond = `CAST(created_at AS DATE) >= '${filters.from.replace(/'/g, "''")}' AND CAST(created_at AS DATE) <= '${filters.to.replace(/'/g, "''")}'`;
    prevDateCond = `CAST(created_at AS DATE) >= '${prevFrom}' AND CAST(created_at AS DATE) <= '${prevTo}'`;
  } else if (range === 'today') {
    comparisonLabel = 'vs Yesterday';
    currDateCond = `CAST(created_at AS DATE) = CAST(CURRENT_DATE AS DATE)`;
    prevDateCond = `CAST(created_at AS DATE) = CAST(CURRENT_DATE - INTERVAL 1 DAY AS DATE)`;
  } else if (range === 'yesterday') {
    comparisonLabel = 'vs Prior Day';
    currDateCond = `CAST(created_at AS DATE) = CAST(CURRENT_DATE - INTERVAL 1 DAY AS DATE)`;
    prevDateCond = `CAST(created_at AS DATE) = CAST(CURRENT_DATE - INTERVAL 2 DAY AS DATE)`;
  } else if (range === '7d') {
    comparisonLabel = 'vs Prior 7d';
    currDateCond = `CAST(created_at AS DATE) >= CAST(CURRENT_DATE - INTERVAL 7 DAY AS DATE)`;
    prevDateCond = `CAST(created_at AS DATE) >= CAST(CURRENT_DATE - INTERVAL 14 DAY AS DATE) AND CAST(created_at AS DATE) < CAST(CURRENT_DATE - INTERVAL 7 DAY AS DATE)`;
  } else if (range === '30d') {
    comparisonLabel = 'vs Prior 30d';
    currDateCond = `CAST(created_at AS DATE) >= CAST(CURRENT_DATE - INTERVAL 30 DAY AS DATE)`;
    prevDateCond = `CAST(created_at AS DATE) >= CAST(CURRENT_DATE - INTERVAL 60 DAY AS DATE) AND CAST(created_at AS DATE) < CAST(CURRENT_DATE - INTERVAL 30 DAY AS DATE)`;
  }

  const [orderWindowRows, cancelWindowRows] = await Promise.all([
    runQuery<Record<string, unknown>>(`
      SELECT
        CASE
          WHEN ${currDateCond} THEN 'curr'
          WHEN ${prevDateCond} THEN 'prev'
          ELSE 'other'
        END AS win,
        COUNT(*) AS orders,
        COALESCE(SUM(gross_amount), 0) AS gmv,
        COALESCE(SUM(net_payout), 0) AS net_payout,
        COALESCE(SUM(merchant_promo_burn), 0) AS promo_burn,
        COUNT(CASE WHEN prep_time_minutes IS NOT NULL THEN 1 END) AS kpt_orders,
        COALESCE(SUM(CASE WHEN kpt_sla_breach = true THEN 1 ELSE 0 END), 0) AS sla_breaches
      FROM fact_orders
      WHERE status != 'CANCELLED'${branchClause}${brandClause}
        AND (${currDateCond} OR ${prevDateCond})
      GROUP BY 1;
    `),
    runQuery<Record<string, unknown>>(`
      SELECT
        CASE
          WHEN ${currDateCond} THEN 'curr'
          WHEN ${prevDateCond} THEN 'prev'
          ELSE 'other'
        END AS win,
        COUNT(*) AS cancel_cnt
      FROM dim_order_cancellations
      WHERE 1=1${branchClause}${brandClause}
        AND (${currDateCond} OR ${prevDateCond})
      GROUP BY 1;
    `),
  ]);

  const currRow = orderWindowRows.find((r) => r.win === 'curr') || {};
  const prevRow = orderWindowRows.find((r) => r.win === 'prev') || {};
  const currCancel = Number(cancelWindowRows.find((r) => r.win === 'curr')?.cancel_cnt ?? 0);
  const prevCancel = Number(cancelWindowRows.find((r) => r.win === 'prev')?.cancel_cnt ?? 0);

  const currOrders = Number(currRow.orders ?? 0);
  const prevOrders = Number(prevRow.orders ?? 0);
  const currGmv = Number(currRow.gmv ?? 0);
  const prevGmv = Number(prevRow.gmv ?? 0);
  const currNet = Number(currRow.net_payout ?? 0);
  const prevNet = Number(prevRow.net_payout ?? 0);
  const currAov = currOrders > 0 ? currGmv / currOrders : 0;
  const prevAov = prevOrders > 0 ? prevGmv / prevOrders : 0;

  const currPromoRate = currGmv > 0 ? (Number(currRow.promo_burn ?? 0) / currGmv) * 100 : 0;
  const prevPromoRate = prevGmv > 0 ? (Number(prevRow.promo_burn ?? 0) / prevGmv) * 100 : 0;

  const currKpt = Number(currRow.kpt_orders ?? 0);
  const prevKpt = Number(prevRow.kpt_orders ?? 0);
  const currBreachRate = currKpt > 0 ? (Number(currRow.sla_breaches ?? 0) / currKpt) * 100 : 0;
  const prevBreachRate = prevKpt > 0 ? (Number(prevRow.sla_breaches ?? 0) / prevKpt) * 100 : 0;

  const currCancelRate = currOrders + currCancel > 0 ? (currCancel / (currOrders + currCancel)) * 100 : 0;
  const prevCancelRate = prevOrders + prevCancel > 0 ? (prevCancel / (prevOrders + prevCancel)) * 100 : 0;

  return {
    comparisonLabel,
    gmvDeltaPct: calcPctDelta(currGmv, prevGmv),
    netPayoutDeltaPct: calcPctDelta(currNet, prevNet),
    ordersDeltaPct: calcPctDelta(currOrders, prevOrders),
    aovDeltaPct: calcPctDelta(currAov, prevAov),
    promoBurnRateDeltaPts: prevOrders > 0 ? calcPtsDelta(currPromoRate, prevPromoRate) : null,
    slaBreachRateDeltaPts: prevKpt > 0 ? calcPtsDelta(currBreachRate, prevBreachRate) : null,
    cancelRateDeltaPts: prevOrders + prevCancel > 0 ? calcPtsDelta(currCancelRate, prevCancelRate) : null,
  };
}

export async function getExecutiveSummary(filters?: QueryFilters): Promise<ExecutiveSummary> {
  const where = buildWhereClause(filters);
  const cancelWhere = buildDateAndBranchFilterClause(filters, 'c');

  const [rows, cancelRows, deltas] = await Promise.all([
    runQuery<Record<string, unknown>>(`
      SELECT
        COUNT(*) AS total_orders,
        COALESCE(SUM(gross_amount), 0) AS total_gross_gmv,
        COALESCE(SUM(net_payout), 0) AS total_net_payout,
        CASE 
          WHEN SUM(gross_amount) > 0 THEN ROUND((SUM(net_payout) / SUM(gross_amount)) * 100, 2)
          ELSE 0 
        END AS net_realization_rate,
        COALESCE(SUM(merchant_promo_burn), 0) AS total_merchant_promo_burn,
        CASE 
          WHEN SUM(gross_amount) > 0 THEN ROUND((SUM(merchant_promo_burn) / SUM(gross_amount)) * 100, 2)
          ELSE 0 
        END AS promo_burn_rate_pct,
        CASE 
          WHEN COUNT(*) > 0 THEN ROUND(SUM(gross_amount) / COUNT(*), 0)
          ELSE 0 
        END AS avg_order_value,
        COALESCE(SUM(CASE WHEN kpt_sla_breach = true THEN 1 ELSE 0 END), 0) AS sla_breach_count,
        CASE 
          WHEN COUNT(CASE WHEN prep_time_minutes IS NOT NULL THEN 1 END) > 0 
          THEN ROUND((SUM(CASE WHEN kpt_sla_breach = true THEN 1.0 ELSE 0.0 END) / COUNT(CASE WHEN prep_time_minutes IS NOT NULL THEN 1 END)) * 100, 2)
          ELSE 0 
        END AS sla_breach_rate_pct,
        COALESCE(SUM(CASE WHEN kpt_red_alert = true THEN 1 ELSE 0 END), 0) AS red_alert_count,
        COALESCE(ROUND(AVG(prep_time_minutes), 1), 0) AS avg_prep_time_minutes
      FROM fact_orders
      WHERE ${where};
    `),
    runQuery<Record<string, unknown>>(`
      SELECT
        COUNT(*) AS cancelled_orders_count,
        COALESCE(SUM(c.gross_amount), 0) AS cancelled_gross_gmv,
        COALESCE(SUM(c.net_payout), 0) AS cancelled_net_payout,
        COALESCE(SUM(CASE WHEN c.prep_time_minutes IS NOT NULL AND c.prep_time_minutes > 0 THEN 1 ELSE 0 END), 0) AS post_prep_cancelled_count
      FROM dim_order_cancellations c
      WHERE ${cancelWhere};
    `),
    computePeriodDeltas(filters),
  ]);

  const r = rows[0] || {};
  const cr = cancelRows[0] || {};
  const totalOrders = Number(r.total_orders ?? 0);
  const cancelledCount = Number(cr.cancelled_orders_count ?? 0);
  const totalAllOrders = totalOrders + cancelledCount;
  const cancelRate = totalAllOrders > 0 ? Number(((cancelledCount / totalAllOrders) * 100).toFixed(2)) : 0;

  return {
    total_orders: totalOrders,
    total_gross_gmv: Number(r.total_gross_gmv ?? 0),
    total_net_payout: Number(r.total_net_payout ?? 0),
    net_realization_rate: Number(r.net_realization_rate ?? 0),
    total_merchant_promo_burn: Number(r.total_merchant_promo_burn ?? 0),
    promo_burn_rate_pct: Number(r.promo_burn_rate_pct ?? 0),
    avg_order_value: Number(r.avg_order_value ?? 0),
    sla_breach_count: Number(r.sla_breach_count ?? 0),
    sla_breach_rate_pct: Number(r.sla_breach_rate_pct ?? 0),
    red_alert_count: Number(r.red_alert_count ?? 0),
    avg_prep_time_minutes: Number(r.avg_prep_time_minutes ?? 0),
    cancelled_orders_count: cancelledCount,
    cancellation_rate_pct: cancelRate,
    cancelled_gross_gmv: Number(cr.cancelled_gross_gmv ?? 0),
    cancelled_net_payout: Number(cr.cancelled_net_payout ?? 0),
    post_prep_cancelled_count: Number(cr.post_prep_cancelled_count ?? 0),
    deltas,
  };
}

export async function getBrandBreakdown(filters?: QueryFilters): Promise<BrandStats[]> {
  const where = buildWhereClause(filters);
  return await runQuery<BrandStats>(`
    SELECT
      brand,
      branch,
      COUNT(*) AS order_count,
      COALESCE(SUM(gross_amount), 0) AS gross_gmv,
      COALESCE(SUM(net_payout), 0) AS net_payout,
      CASE 
        WHEN SUM(gross_amount) > 0 THEN ROUND((SUM(net_payout) / SUM(gross_amount)) * 100, 1)
        ELSE 0 
      END AS net_realization_rate,
      COALESCE(SUM(merchant_promo_burn), 0) AS merchant_promo_burn,
      CASE 
        WHEN SUM(gross_amount) > 0 THEN ROUND((SUM(merchant_promo_burn) / SUM(gross_amount)) * 100, 1)
        ELSE 0 
      END AS promo_burn_rate_pct,
      COALESCE(ROUND(AVG(prep_time_minutes), 1), 0) AS avg_prep_time_min,
      COALESCE(SUM(CASE WHEN kpt_sla_breach = true THEN 1 ELSE 0 END), 0) AS sla_breaches
    FROM fact_orders
    WHERE ${where}
    GROUP BY brand, branch
    ORDER BY gross_gmv DESC;
  `);
}

export async function getBranchComparison(filters?: QueryFilters): Promise<BranchStats[]> {
  const where = buildWhereClause(filters);
  return await runQuery<BranchStats>(`
    SELECT
      branch,
      COUNT(*) AS order_count,
      COALESCE(SUM(gross_amount), 0) AS gross_gmv,
      COALESCE(SUM(net_payout), 0) AS net_payout,
      CASE 
        WHEN SUM(gross_amount) > 0 THEN ROUND((SUM(net_payout) / SUM(gross_amount)) * 100, 1)
        ELSE 0 
      END AS net_realization_rate,
      COALESCE(SUM(merchant_promo_burn), 0) AS merchant_promo_burn,
      COALESCE(ROUND(AVG(prep_time_minutes), 1), 0) AS avg_prep_time_min,
      COALESCE(SUM(CASE WHEN kpt_sla_breach = true THEN 1 ELSE 0 END), 0) AS sla_breaches
    FROM fact_orders
    WHERE ${where}
    GROUP BY branch
    ORDER BY gross_gmv DESC;
  `);
}

export async function getChannelPerformance(filters?: QueryFilters): Promise<ChannelStats[]> {
  const where = buildWhereClause(filters);
  return await runQuery<ChannelStats>(`
    SELECT
      CASE
        WHEN LOWER(provider) LIKE '%grab%' THEN 'GrabFood'
        WHEN LOWER(provider) LIKE '%go%' THEN 'GoFood'
        WHEN LOWER(provider) LIKE '%pos%' OR LOWER(provider) LIKE '%greenville%' OR LOWER(provider) LIKE '%majoo%' THEN 'Greenville POS'
        ELSE provider
      END AS provider,
      COUNT(*) AS order_count,
      COALESCE(SUM(gross_amount), 0) AS gross_gmv,
      COALESCE(SUM(net_payout), 0) AS net_payout,
      COALESCE(SUM(merchant_promo_burn), 0) AS merchant_promo_burn,
      CASE 
        WHEN SUM(gross_amount) > 0 THEN ROUND((SUM(net_payout) / SUM(gross_amount)) * 100, 1) 
        ELSE 0 
      END AS net_realization_rate
    FROM fact_orders
    WHERE ${where}
    GROUP BY 1
    ORDER BY gross_gmv DESC;
  `);
}

export async function getTopItems(limit: number = 10, filters?: QueryFilters): Promise<TopItem[]> {
  const where = buildWhereClause(filters);
  return await runQuery<TopItem>(`
    SELECT
      item_name,
      brand,
      branch,
      SUM(COALESCE(item_qty, 1)) AS total_qty,
      SUM(COALESCE(total_price, 0)) AS total_revenue
    FROM fact_order_items
    WHERE ${where}
    GROUP BY item_name, brand, branch
    ORDER BY total_qty DESC
    LIMIT ${limit};
  `);
}

export async function getHourlyDistribution(filters?: QueryFilters): Promise<HourlyTrend[]> {
  const where = buildWhereClause(filters);
  return await runQuery<HourlyTrend>(`
    SELECT
      EXTRACT(HOUR FROM created_at) AS hour_of_day,
      COUNT(*) AS order_count,
      SUM(gross_amount) AS gross_gmv
    FROM fact_orders
    WHERE ${where} AND created_at IS NOT NULL
    GROUP BY 1
    ORDER BY 1 ASC;
  `);
}

export async function getDailyRevenueTrend(
  filters?: QueryFilters,
  brandName?: string
): Promise<DailyTrendPoint[]> {
  const where = buildWhereClause(filters);
  const brandClause = brandName
    ? ` AND LOWER(brand) = '${brandName.toLowerCase().replace(/'/g, "''")}'`
    : '';

  const rows = await runQuery<Record<string, unknown>>(`
    SELECT
      strftime(created_at, '%Y-%m-%d') AS dt,
      COUNT(*) AS order_count,
      COALESCE(SUM(gross_amount), 0) AS gross_gmv,
      COALESCE(SUM(net_payout), 0) AS net_payout,
      COALESCE(SUM(merchant_promo_burn), 0) AS merchant_promo_burn,
      CASE
        WHEN SUM(gross_amount) > 0 THEN ROUND((SUM(net_payout) / SUM(gross_amount)) * 100, 1)
        ELSE 0
      END AS net_realization_rate,
      COALESCE(ROUND(AVG(prep_time_minutes), 1), 0) AS avg_prep_time_min,
      COALESCE(SUM(CASE WHEN kpt_sla_breach = true THEN 1 ELSE 0 END), 0) AS sla_breaches
    FROM fact_orders
    WHERE ${where}${brandClause} AND created_at IS NOT NULL
    GROUP BY 1
    ORDER BY 1 ASC;
  `);

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  return rows.map((r) => {
    const dtStr = String(r.dt || '');
    let dateLabel = dtStr;
    if (/^\d{4}-\d{2}-\d{2}$/.test(dtStr)) {
      const [, mm, dd] = dtStr.split('-');
      const mIdx = parseInt(mm, 10) - 1;
      dateLabel = `${dd} ${monthNames[mIdx] || mm}`;
    }
    return {
      date: dtStr,
      dateLabel,
      order_count: Number(r.order_count ?? 0),
      gross_gmv: Number(r.gross_gmv ?? 0),
      net_payout: Number(r.net_payout ?? 0),
      merchant_promo_burn: Number(r.merchant_promo_burn ?? 0),
      net_realization_rate: Number(r.net_realization_rate ?? 0),
      avg_prep_time_min: Number(r.avg_prep_time_min ?? 0),
      sla_breaches: Number(r.sla_breaches ?? 0),
    };
  });
}

export async function getHeroRecipeBoms(
  filters?: QueryFilters,
  brandFilter?: string
): Promise<HeroRecipeBomSummary[]> {
  const itemWhere = buildWhereClause(filters, 'foi');
  const brandClause = brandFilter
    ? `AND LOWER(r.brand) = '${brandFilter.toLowerCase().replace(/'/g, "''")}'`
    : '';

  const rows = await runQuery<{
    recipe_id: string;
    brand: string;
    item_name: string;
    canonical_name: string;
    category: string;
    bom_summary: string;
    raw_food_cost: number;
    packaging_dine_in: number;
    packaging_delivery: number;
    target_food_cost_pct: number;
    realized_menu_price: number;
    realized_units_sold: number;
  }>(`
    SELECT
      MIN(r.recipe_id) AS recipe_id,
      r.brand,
      MIN(r.item_name) AS item_name,
      r.canonical_name,
      MAX(r.category) AS category,
      MAX(r.bom_summary) AS bom_summary,
      MAX(r.raw_food_cost) AS raw_food_cost,
      MAX(r.packaging_dine_in) AS packaging_dine_in,
      MAX(r.packaging_delivery) AS packaging_delivery,
      MAX(r.target_food_cost_pct) AS target_food_cost_pct,
      COALESCE(ROUND(AVG(foi.item_price), 0), 0) AS realized_menu_price,
      CAST(COALESCE(SUM(foi.item_qty), 0) AS INTEGER) AS realized_units_sold
    FROM dim_recipes r
    LEFT JOIN fact_order_items foi
      ON LOWER(foi.brand) = LOWER(r.brand)
     AND LOWER(TRIM(foi.item_name)) = LOWER(TRIM(r.item_name))
     AND ${itemWhere}
    WHERE r.is_hero_bom = TRUE ${brandClause}
    GROUP BY r.brand, r.canonical_name
    ORDER BY realized_units_sold DESC, r.brand ASC;
  `);

  return rows.map((row) => {
    const rawCost = Number(row.raw_food_cost);
    const pkgDineIn = Number(row.packaging_dine_in);
    const pkgDelivery = Number(row.packaging_delivery);
    const targetPct = Number(row.target_food_cost_pct);

    // Fallback reference menu price if filter window has 0 orders for this SKU
    const defaultMenuPrice =
      row.brand === 'Tyfel Coffee'
        ? 38500
        : row.brand === 'American Breakfast Club'
        ? 64000
        : row.brand === 'People Pasta'
        ? 43000
        : row.brand === 'Herbox'
        ? 37500
        : 70000;

    const menuPrice = Number(row.realized_menu_price) > 0 ? Number(row.realized_menu_price) : defaultMenuPrice;
    const dineInTotalCost = rawCost + pkgDineIn;
    const deliveryTotalCost = rawCost + pkgDelivery;

    const dineInMargin = Math.max(0, menuPrice - dineInTotalCost);
    const deliveryMargin = Math.max(0, menuPrice - deliveryTotalCost);

    const dineInFcPct = menuPrice > 0 ? Number(((dineInTotalCost / menuPrice) * 100).toFixed(1)) : 0;
    const deliveryFcPct = menuPrice > 0 ? Number(((deliveryTotalCost / menuPrice) * 100).toFixed(1)) : 0;
    const pkgDragPct = menuPrice > 0 ? Number(((pkgDelivery / menuPrice) * 100).toFixed(1)) : 0;

    return {
      recipe_id: String(row.recipe_id),
      brand: String(row.brand),
      item_name: String(row.item_name),
      canonical_name: String(row.canonical_name),
      category: String(row.category),
      bom_summary: String(row.bom_summary),
      raw_food_cost: rawCost,
      packaging_dine_in: pkgDineIn,
      packaging_delivery: pkgDelivery,
      target_food_cost_pct: targetPct,
      realized_menu_price: menuPrice,
      realized_units_sold: Number(row.realized_units_sold),
      dine_in_margin_rp: dineInMargin,
      delivery_margin_rp: deliveryMargin,
      dine_in_food_cost_pct: dineInFcPct,
      delivery_food_cost_pct: deliveryFcPct,
      packaging_drag_pct: pkgDragPct,
    };
  });
}

export async function getBrandDetail(slugOrName: string, filters?: QueryFilters): Promise<BrandDetailData | null> {
  const brandName = resolveBrandName(slugOrName);
  const slug = brandToSlug(brandName);

  const isValidBrand = ALL_BRAND_NAV.some(b => b.name.toLowerCase() === brandName.toLowerCase()) || Boolean(BRAND_SLUG_MAP[slugOrName.toLowerCase()]);
  if (!isValidBrand) {
    return null;
  }

  const escapedBrand = brandName.replace(/'/g, "''");
  const brandCond = `brand = '${escapedBrand}'`;
  const extraWhere = buildWhereClause(filters);
  const combinedWhere = `${brandCond} AND ${extraWhere}`;

  // 1. KPI
  const cancelBrandWhere = `c.brand = '${escapedBrand}' AND ${buildDateAndBranchFilterClause(filters, 'c')}`;
  const [kpiRows, cancelKpiRows, unitsRow, brandDeltas, dailyTrend] = await Promise.all([
    runQuery<Record<string, unknown>>(`
      SELECT
        COUNT(*) AS order_count,
        COALESCE(SUM(gross_amount), 0) AS gross_gmv,
        COALESCE(SUM(net_payout), 0) AS net_payout,
        CASE 
          WHEN SUM(gross_amount) > 0 THEN ROUND((SUM(net_payout) / SUM(gross_amount)) * 100, 1)
          ELSE 0 
        END AS net_realization_rate,
        COALESCE(SUM(merchant_promo_burn), 0) AS merchant_promo_burn,
        CASE 
          WHEN SUM(gross_amount) > 0 THEN ROUND((SUM(merchant_promo_burn) / SUM(gross_amount)) * 100, 1)
          ELSE 0 
        END AS promo_burn_rate_pct,
        CASE 
          WHEN COUNT(*) > 0 THEN ROUND(SUM(gross_amount) / COUNT(*), 0)
          ELSE 0 
        END AS avg_order_value,
        COALESCE(ROUND(AVG(prep_time_minutes), 1), 0) AS avg_prep_time_min,
        COALESCE(SUM(CASE WHEN kpt_sla_breach = true THEN 1 ELSE 0 END), 0) AS sla_breaches,
        CASE 
          WHEN COUNT(CASE WHEN prep_time_minutes IS NOT NULL THEN 1 END) > 0 
          THEN ROUND((SUM(CASE WHEN kpt_sla_breach = true THEN 1.0 ELSE 0.0 END) / COUNT(CASE WHEN prep_time_minutes IS NOT NULL THEN 1 END)) * 100, 1)
          ELSE 0 
        END AS sla_breach_rate_pct,
        COALESCE(SUM(CASE WHEN kpt_red_alert = true THEN 1 ELSE 0 END), 0) AS red_alerts,
        COALESCE(SUM(CASE WHEN kpt_sla_breach = true AND EXTRACT(HOUR FROM created_at) IN (11, 12, 13, 18, 19, 20) THEN 1 ELSE 0 END), 0) AS peak_rush_breaches
      FROM fact_orders
      WHERE ${combinedWhere};
    `),
    runQuery<Record<string, unknown>>(`
      SELECT
        COUNT(*) AS cancelled_orders_count,
        COALESCE(SUM(c.gross_amount), 0) AS cancelled_gross_gmv,
        COALESCE(SUM(c.net_payout), 0) AS cancelled_net_payout,
        COALESCE(SUM(CASE WHEN c.prep_time_minutes IS NOT NULL AND c.prep_time_minutes > 0 THEN 1 ELSE 0 END), 0) AS post_prep_cancelled_count
      FROM dim_order_cancellations c
      WHERE ${cancelBrandWhere};
    `),
    runQuery<{ total_units_sold: number }>(`
      SELECT COALESCE(SUM(COALESCE(item_qty, 1)), 0) AS total_units_sold
      FROM fact_order_items
      WHERE ${combinedWhere};
    `),
    computePeriodDeltas(filters, brandName),
    getDailyRevenueTrend(filters, brandName),
  ]);

  const totalUnitsSold = unitsRow[0]?.total_units_sold ? Number(unitsRow[0].total_units_sold) : 0;
  const completedCount = kpiRows[0]?.order_count ? Number(kpiRows[0].order_count) : 0;
  const cancelledCount = cancelKpiRows[0]?.cancelled_orders_count ? Number(cancelKpiRows[0].cancelled_orders_count) : 0;
  const totalBrandOrders = completedCount + cancelledCount;
  const brandCancelRate = totalBrandOrders > 0 ? Number(((cancelledCount / totalBrandOrders) * 100).toFixed(2)) : 0;

  const kpi: BrandDetailKPI = {
    brand: brandName,
    order_count: completedCount,
    gross_gmv: kpiRows[0]?.gross_gmv ? Number(kpiRows[0].gross_gmv) : 0,
    net_payout: kpiRows[0]?.net_payout ? Number(kpiRows[0].net_payout) : 0,
    net_realization_rate: kpiRows[0]?.net_realization_rate ? Number(kpiRows[0].net_realization_rate) : 0,
    merchant_promo_burn: kpiRows[0]?.merchant_promo_burn ? Number(kpiRows[0].merchant_promo_burn) : 0,
    promo_burn_rate_pct: kpiRows[0]?.promo_burn_rate_pct ? Number(kpiRows[0].promo_burn_rate_pct) : 0,
    total_units_sold: totalUnitsSold,
    avg_order_value: kpiRows[0]?.avg_order_value ? Number(kpiRows[0].avg_order_value) : 0,
    avg_prep_time_min: kpiRows[0]?.avg_prep_time_min ? Number(kpiRows[0].avg_prep_time_min) : 0,
    sla_breaches: kpiRows[0]?.sla_breaches ? Number(kpiRows[0].sla_breaches) : 0,
    sla_breach_rate_pct: kpiRows[0]?.sla_breach_rate_pct ? Number(kpiRows[0].sla_breach_rate_pct) : 0,
    red_alerts: kpiRows[0]?.red_alerts ? Number(kpiRows[0].red_alerts) : 0,
    peak_rush_breaches: kpiRows[0]?.peak_rush_breaches ? Number(kpiRows[0].peak_rush_breaches) : 0,
    cancelled_orders_count: cancelledCount,
    cancellation_rate_pct: brandCancelRate,
    cancelled_gross_gmv: cancelKpiRows[0]?.cancelled_gross_gmv ? Number(cancelKpiRows[0].cancelled_gross_gmv) : 0,
    cancelled_net_payout: cancelKpiRows[0]?.cancelled_net_payout ? Number(cancelKpiRows[0].cancelled_net_payout) : 0,
    post_prep_cancelled_count: cancelKpiRows[0]?.post_prep_cancelled_count ? Number(cancelKpiRows[0].post_prep_cancelled_count) : 0,
    deltas: brandDeltas,
  };

  // 2. SKUs Pareto
  const rawItems = await runQuery<{
    item_name: string;
    category: string;
    total_qty: number;
    total_revenue: number;
    avg_unit_price: number;
    orders_present: number;
  }>(`
    SELECT
      item_name,
      COALESCE(category, 'General') AS category,
      CAST(SUM(COALESCE(item_qty, 1)) AS INTEGER) AS total_qty,
      CAST(SUM(COALESCE(total_price, 0)) AS DOUBLE) AS total_revenue,
      CAST(ROUND(AVG(COALESCE(item_price, 0)), 0) AS DOUBLE) AS avg_unit_price,
      CAST(COUNT(DISTINCT order_id) AS INTEGER) AS orders_present
    FROM fact_order_items
    WHERE ${combinedWhere}
    GROUP BY item_name, category
    ORDER BY total_qty DESC;
  `);

  let runningVolume = 0;
  let heroUnits = 0;
  let heroCount = 0;
  let secondaryCount = 0;
  let watchlistCount = 0;

  const skus: SkuParetoItem[] = rawItems.map((item) => {
    const qty = Number(item.total_qty);
    const share = totalUnitsSold > 0 ? (qty / totalUnitsSold) * 100 : 0;
    const prevCumulative = runningVolume;
    runningVolume += share;
    const currentCumulative = Math.min(100, runningVolume);

    let tier: 'Tier A' | 'Tier B' | 'Tier C';
    let action_label: string;

    if (prevCumulative < 80) {
      tier = 'Tier A';
      action_label = 'Hero SKU · Zero-stockout buffer & priority batch prep';
      heroCount++;
      heroUnits += qty;
    } else if (prevCumulative < 95) {
      tier = 'Tier B';
      action_label = 'Menu Stabilizer · Cook-to-order, monitor velocity trends';
      secondaryCount++;
    } else {
      tier = 'Tier C';
      action_label = 'Operational Drag · Pruning candidate or bundle into combo';
      watchlistCount++;
    }

    return {
      item_name: String(item.item_name),
      category: String(item.category),
      total_qty: qty,
      total_revenue: Number(item.total_revenue),
      avg_unit_price: Number(item.avg_unit_price),
      orders_present: Number(item.orders_present),
      share_of_volume_pct: Number(share.toFixed(1)),
      cumulative_volume_pct: Number(currentCumulative.toFixed(1)),
      tier,
      action_label,
    };
  });

  // 2B. Track B: Theoretical Food Cost Engine & Menu Engineering Matrix
  // Join fact_order_items against dim_recipes
  const rawBomItems = await runQuery<{
    recipe_id: string | null;
    item_name: string;
    canonical_name: string | null;
    category: string;
    bom_summary: string | null;
    is_hero_bom: boolean | null;
    has_recipe_bom: boolean;
    total_qty: number;
    dine_in_qty: number;
    delivery_qty: number;
    menu_price: number;
    raw_food_cost: number | null;
    packaging_dine_in: number | null;
    packaging_delivery: number | null;
    target_food_cost_pct: number | null;
  }>(`
    SELECT
      MAX(r.recipe_id) AS recipe_id,
      foi.item_name,
      MAX(r.canonical_name) AS canonical_name,
      COALESCE(MAX(r.category), COALESCE(foi.category, 'General')) AS category,
      MAX(r.bom_summary) AS bom_summary,
      BOOL_OR(COALESCE(r.is_hero_bom, FALSE)) AS is_hero_bom,
      BOOL_OR(r.recipe_id IS NOT NULL) AS has_recipe_bom,
      CAST(SUM(COALESCE(foi.item_qty, 1)) AS INTEGER) AS total_qty,
      CAST(SUM(CASE WHEN LOWER(foi.provider) LIKE '%pos%' OR LOWER(foi.provider) LIKE '%majoo%' OR LOWER(foi.provider) LIKE '%greenville%' THEN COALESCE(foi.item_qty, 1) ELSE 0 END) AS INTEGER) AS dine_in_qty,
      CAST(SUM(CASE WHEN LOWER(foi.provider) LIKE '%pos%' OR LOWER(foi.provider) LIKE '%majoo%' OR LOWER(foi.provider) LIKE '%greenville%' THEN 0 ELSE COALESCE(foi.item_qty, 1) END) AS INTEGER) AS delivery_qty,
      CAST(ROUND(AVG(COALESCE(foi.item_price, 0)), 0) AS DOUBLE) AS menu_price,
      MAX(r.raw_food_cost) AS raw_food_cost,
      MAX(r.packaging_dine_in) AS packaging_dine_in,
      MAX(r.packaging_delivery) AS packaging_delivery,
      MAX(r.target_food_cost_pct) AS target_food_cost_pct
    FROM fact_order_items foi
    LEFT JOIN dim_recipes r
      ON LOWER(foi.brand) = LOWER(r.brand)
     AND LOWER(TRIM(foi.item_name)) = LOWER(TRIM(r.item_name))
    WHERE ${buildWhereClause(filters, 'foi')}
      AND foi.brand = '${escapedBrand}'
      AND LOWER(foi.item_name) NOT LIKE '%cutler%'
    GROUP BY foi.item_name, foi.category
    ORDER BY total_qty DESC;
  `);

  // Compute theoretical food cost, packaging drag, and unit gross margin per SKU
  const prelimBomItems = rawBomItems.map((row) => {
    const itemName = String(row.item_name);
    const lowerName = itemName.toLowerCase();
    const cat = String(row.category || 'General');
    const lowerCat = cat.toLowerCase();
    const isBeverage =
      lowerCat.includes('drink') ||
      lowerCat.includes('espresso') ||
      lowerCat.includes('beverage') ||
      lowerCat.includes('refresher') ||
      lowerName.includes('coffee') ||
      lowerName.includes('latte') ||
      lowerName.includes('tea') ||
      lowerName.includes('water') ||
      lowerName.includes('mojito') ||
      lowerName.includes('black') ||
      lowerName.includes('coke');
    const isSide =
      lowerCat.includes('side') ||
      lowerCat.includes('lite') ||
      lowerName.includes('tots') ||
      lowerName.includes('fries') ||
      lowerName.includes('nugget') ||
      lowerName.includes('stick');

    const totalQty = Number(row.total_qty);
    const dineInQty = Number(row.dine_in_qty);
    const deliveryQty = Number(row.delivery_qty);
    const menuPrice = Number(row.menu_price) > 0 ? Number(row.menu_price) : 35000;

    const hasBom = Boolean(row.has_recipe_bom);
    const rawFoodCost =
      row.raw_food_cost !== null && row.raw_food_cost !== undefined
        ? Number(row.raw_food_cost)
        : Math.round(menuPrice * (isBeverage ? 0.16 : isSide ? 0.23 : 0.27));

    const pkgDineIn =
      row.packaging_dine_in !== null && row.packaging_dine_in !== undefined
        ? Number(row.packaging_dine_in)
        : isSide
        ? 300
        : 0;

    const pkgDelivery =
      row.packaging_delivery !== null && row.packaging_delivery !== undefined
        ? Number(row.packaging_delivery)
        : isBeverage
        ? 1950
        : isSide
        ? 1800
        : 2600;

    const targetFcPct =
      row.target_food_cost_pct !== null && row.target_food_cost_pct !== undefined
        ? Number(row.target_food_cost_pct)
        : isBeverage
        ? 18.0
        : isSide
        ? 25.0
        : 28.0;

    const weightedPkg =
      totalQty > 0
        ? Math.round((dineInQty * pkgDineIn + deliveryQty * pkgDelivery) / totalQty)
        : pkgDelivery;

    const unitTotalCost = rawFoodCost + weightedPkg;
    const unitGrossMargin = Math.max(0, menuPrice - unitTotalCost);
    const totalGrossMargin = unitGrossMargin * totalQty;
    const foodCostPct = menuPrice > 0 ? Number(((unitTotalCost / menuPrice) * 100).toFixed(1)) : 0;
    const packagingDragPct = menuPrice > 0 ? Number(((weightedPkg / menuPrice) * 100).toFixed(1)) : 0;

    const defaultBomSummary = isBeverage
      ? 'Plant/espresso beverage base & sealed 12oz delivery cup'
      : isSide
      ? 'Vegetarian crispy side portion & vented kraft sleeve'
      : '100% vegetarian culinary recipe BOM & leak-proof container';

    return {
      recipe_id: row.recipe_id ? String(row.recipe_id) : null,
      brand: brandName,
      item_name: itemName,
      canonical_name: row.canonical_name ? String(row.canonical_name) : itemName,
      category: cat,
      bom_summary: row.bom_summary ? String(row.bom_summary) : defaultBomSummary,
      is_hero_bom: Boolean(row.is_hero_bom),
      has_recipe_bom: hasBom,
      total_qty: totalQty,
      dine_in_qty: dineInQty,
      delivery_qty: deliveryQty,
      menu_price: menuPrice,
      raw_food_cost: rawFoodCost,
      packaging_dine_in: pkgDineIn,
      packaging_delivery: pkgDelivery,
      weighted_packaging_cost: weightedPkg,
      unit_total_cost: unitTotalCost,
      unit_gross_margin: unitGrossMargin,
      total_gross_margin: totalGrossMargin,
      food_cost_pct: foodCostPct,
      packaging_drag_pct: packagingDragPct,
      target_food_cost_pct: targetFcPct,
    };
  });

  const avgVolumeBenchmark =
    prelimBomItems.length > 0
      ? Math.round(prelimBomItems.reduce((acc, it) => acc + it.total_qty, 0) / prelimBomItems.length)
      : 0;

  const avgMarginBenchmarkRp =
    prelimBomItems.length > 0
      ? Math.round(prelimBomItems.reduce((acc, it) => acc + it.unit_gross_margin, 0) / prelimBomItems.length)
      : 0;

  let starsCount = 0;
  let plowhorsesCount = 0;
  let puzzlesCount = 0;
  let dogsCount = 0;
  let weightedCostSum = 0;
  let weightedPkgSum = 0;
  let weightedRevSum = 0;
  let totalTheoreticalMarginRp = 0;

  const menuEngineering: MenuEngineeringItem[] = prelimBomItems.map((it) => {
    const isHighVol = it.total_qty >= avgVolumeBenchmark;
    // High Margin if unit Rp contribution >= brand mean AND food cost % within reasonable range of target, or beats target food cost %
    const isHighMargin =
      it.food_cost_pct <= it.target_food_cost_pct ||
      (it.unit_gross_margin >= avgMarginBenchmarkRp && it.food_cost_pct <= it.target_food_cost_pct + 7.5);

    let quadrant: MenuEngineeringQuadrant;
    let quadrant_action: string;

    if (isHighVol && isHighMargin) {
      quadrant = 'Star';
      quadrant_action = 'High Vol · High Margin — Protect recipe BOM & maintain zero-stockout prep';
      starsCount++;
    } else if (isHighVol && !isHighMargin) {
      quadrant = 'Plowhorse';
      quadrant_action = 'High Vol · Low Margin — Nudge menu price +Rp 3k–5k or engineer packaging/portion';
      plowhorsesCount++;
    } else if (!isHighVol && isHighMargin) {
      quadrant = 'Puzzle';
      quadrant_action = 'Low Vol · High Margin — Push visibility via aggregator promos & bundle combos';
      puzzlesCount++;
    } else {
      quadrant = 'Dog';
      quadrant_action = 'Low Vol · Low Margin — Candidate for menu elimination or recipe re-concepting';
      dogsCount++;
    }

    weightedCostSum += it.unit_total_cost * it.total_qty;
    weightedPkgSum += it.weighted_packaging_cost * it.total_qty;
    weightedRevSum += it.menu_price * it.total_qty;
    totalTheoreticalMarginRp += it.total_gross_margin;

    return {
      ...it,
      quadrant,
      quadrant_action,
    };
  });

  const brandHeroBoms = await getHeroRecipeBoms(filters, brandName);

  const menuEngineeringSummary: MenuEngineeringSummary = {
    starsCount,
    plowhorsesCount,
    puzzlesCount,
    dogsCount,
    avgFoodCostPct: weightedRevSum > 0 ? Number(((weightedCostSum / weightedRevSum) * 100).toFixed(1)) : 0,
    avgPackagingDragPct: weightedRevSum > 0 ? Number(((weightedPkgSum / weightedRevSum) * 100).toFixed(1)) : 0,
    totalTheoreticalMarginRp,
    avgVolumeBenchmark,
    avgMarginBenchmarkRp,
    heroBoms: brandHeroBoms,
  };

  // 3. Channels
  const channels = await runQuery<BrandChannelStats>(`
    SELECT
      CASE
        WHEN LOWER(provider) LIKE '%grab%' THEN 'GrabFood'
        WHEN LOWER(provider) LIKE '%go%' THEN 'GoFood'
        WHEN LOWER(provider) LIKE '%pos%' OR LOWER(provider) LIKE '%greenville%' OR LOWER(provider) LIKE '%majoo%' THEN 'Greenville POS'
        ELSE provider
      END AS provider,
      COUNT(*) AS order_count,
      COALESCE(SUM(gross_amount), 0) AS gross_gmv,
      COALESCE(SUM(net_payout), 0) AS net_payout,
      COALESCE(SUM(merchant_promo_burn), 0) AS merchant_promo_burn,
      CASE 
        WHEN SUM(gross_amount) > 0 THEN ROUND((SUM(merchant_promo_burn) / SUM(gross_amount)) * 100, 1) 
        ELSE 0 
      END AS promo_burn_rate_pct,
      CASE 
        WHEN SUM(gross_amount) > 0 THEN ROUND((SUM(net_payout) / SUM(gross_amount)) * 100, 1) 
        ELSE 0 
      END AS net_realization_rate
    FROM fact_orders
    WHERE ${combinedWhere}
    GROUP BY 1
    ORDER BY gross_gmv DESC;
  `);

  // 4. Branches
  const branches = await runQuery<BrandBranchStats>(`
    SELECT
      branch,
      COUNT(*) AS order_count,
      COALESCE(SUM(gross_amount), 0) AS gross_gmv,
      COALESCE(SUM(net_payout), 0) AS net_payout,
      COALESCE(ROUND(AVG(prep_time_minutes), 1), 0) AS avg_prep_time_min,
      COALESCE(SUM(CASE WHEN kpt_sla_breach = true THEN 1 ELSE 0 END), 0) AS sla_breaches,
      COALESCE(SUM(CASE WHEN kpt_red_alert = true THEN 1 ELSE 0 END), 0) AS red_alerts
    FROM fact_orders
    WHERE ${combinedWhere}
    GROUP BY branch
    ORDER BY gross_gmv DESC;
  `);

  // 5. Hourly & Rush
  const hourlyRaw = await runQuery<Record<string, unknown>>(`
    SELECT
      EXTRACT(HOUR FROM created_at) AS hour_of_day,
      COUNT(*) AS order_count,
      COALESCE(SUM(gross_amount), 0) AS gross_gmv,
      COALESCE(ROUND(AVG(prep_time_minutes), 1), 0) AS avg_prep_time_min,
      COALESCE(SUM(CASE WHEN kpt_sla_breach = true THEN 1 ELSE 0 END), 0) AS sla_breaches
    FROM fact_orders
    WHERE ${combinedWhere} AND created_at IS NOT NULL
    GROUP BY 1
    ORDER BY 1 ASC;
  `);

  const hourly: BrandHourlyStats[] = hourlyRaw.map((h) => {
    const hour = Number(h.hour_of_day);
    let rush_window: 'Lunch Rush' | 'Dinner Rush' | 'Off-Peak' = 'Off-Peak';
    if (hour >= 11 && hour <= 13) rush_window = 'Lunch Rush';
    else if (hour >= 18 && hour <= 20) rush_window = 'Dinner Rush';

    return {
      hour_of_day: hour,
      order_count: Number(h.order_count),
      gross_gmv: Number(h.gross_gmv),
      avg_prep_time_min: Number(h.avg_prep_time_min),
      sla_breaches: Number(h.sla_breaches),
      rush_window,
    };
  });

  const [slaDiagnostic, cancellationDiagnostic] = await Promise.all([
    getKitchenSlaDiagnostic(filters, brandName),
    getCanceledOrdersDiagnostic(filters, brandName),
  ]);

  return {
    brandName,
    slug,
    kpi,
    skus,
    menuEngineering,
    menuEngineeringSummary,
    slaDiagnostic,
    cancellationDiagnostic,
    channels,
    branches,
    hourly,
    dailyTrend,
    paretoSummary: {
      heroCount,
      secondaryCount,
      watchlistCount,
      totalUnits: totalUnitsSold,
      heroSharePct: totalUnitsSold > 0 ? Number(((heroUnits / totalUnitsSold) * 100).toFixed(1)) : 0,
    },
  };
}

export async function getOrderItemCoverageAudit(filters?: QueryFilters): Promise<OrderItemCoverageAudit> {
  const whereOrders = buildWhereClause(filters, 'o');
  const whereItems = buildWhereClause(filters, 'foi');

  const brandRows = await runQuery<Record<string, unknown>>(`
    WITH item_agg AS (
      SELECT
        order_id,
        COUNT(*) AS item_rows,
        COALESCE(SUM(item_qty), 0) AS units_sold,
        COALESCE(SUM(total_price), 0) AS item_rev
      FROM fact_order_items foi
      WHERE ${whereItems}
      GROUP BY order_id
    )
    SELECT
      o.brand,
      o.branch,
      CASE
        WHEN LOWER(o.provider) LIKE '%pos%' OR LOWER(o.provider) LIKE '%greenville%' OR LOWER(o.provider) LIKE '%majoo%' THEN 'Greenville POS'
        ELSE 'Klikit Delivery'
      END AS channel_group,
      COUNT(DISTINCT o.order_id) AS total_orders,
      COUNT(DISTINCT CASE WHEN ia.order_id IS NOT NULL THEN o.order_id END) AS orders_with_items,
      COALESCE(SUM(o.gross_amount), 0) AS order_gross_gmv,
      COALESCE(SUM(ia.item_rev), 0) AS item_exploded_revenue,
      COALESCE(SUM(ia.units_sold), 0) AS total_units_sold,
      strftime(MIN(o.created_at), '%Y-%m-%d') AS min_date,
      strftime(MAX(o.created_at), '%Y-%m-%d') AS max_date
    FROM fact_orders o
    LEFT JOIN item_agg ia ON o.order_id = ia.order_id
    WHERE ${whereOrders}
    GROUP BY 1, 2, 3
    ORDER BY total_orders DESC;
  `);

  const itemCountRow = await runQuery<Record<string, unknown>>(`
    SELECT COUNT(*) AS cnt
    FROM fact_order_items foi
    WHERE ${whereItems};
  `);
  const totalItemRows = Number(itemCountRow[0]?.cnt ?? 0);

  let totalOrders = 0;
  let ordersWithItems = 0;
  let totalUnitsSold = 0;
  let orderGrossGmv = 0;
  let itemExplodedRevenue = 0;

  const brandBreakdown: OrderItemBrandCoverage[] = brandRows.map((r) => {
    const tOrders = Number(r.total_orders ?? 0);
    const wItems = Number(r.orders_with_items ?? 0);
    const orphan = Math.max(0, tOrders - wItems);
    const covPct = tOrders > 0 ? Number(((wItems / tOrders) * 100).toFixed(1)) : 100;
    const oGmv = Number(r.order_gross_gmv ?? 0);
    const iRev = Number(r.item_exploded_revenue ?? 0);
    const units = Number(r.total_units_sold ?? 0);

    totalOrders += tOrders;
    ordersWithItems += wItems;
    totalUnitsSold += units;
    orderGrossGmv += oGmv;
    itemExplodedRevenue += iRev;

    let status: 'Complete' | 'Partial Gap' | 'Missing Items CSV' = 'Complete';
    if (covPct === 0 && tOrders > 0) status = 'Missing Items CSV';
    else if (covPct < 95) status = 'Partial Gap';

    return {
      brand: String(r.brand),
      branch: String(r.branch),
      channel_group: String(r.channel_group),
      total_orders: tOrders,
      orders_with_items: wItems,
      orphan_orders: orphan,
      coverage_pct: covPct,
      order_gross_gmv: oGmv,
      item_exploded_revenue: iRev,
      total_units_sold: units,
      min_date: r.min_date ? String(r.min_date) : null,
      max_date: r.max_date ? String(r.max_date) : null,
      status,
    };
  });

  const orphanOrdersCount = Math.max(0, totalOrders - ordersWithItems);
  const orderCoveragePct = totalOrders > 0 ? Number(((ordersWithItems / totalOrders) * 100).toFixed(1)) : 100;
  const unreconciledGmvGap = Math.max(0, orderGrossGmv - itemExplodedRevenue);

  return {
    totalOrders,
    ordersWithItems,
    orphanOrdersCount,
    orderCoveragePct,
    totalItemRows,
    totalUnitsSold,
    orderGrossGmv,
    itemExplodedRevenue,
    unreconciledGmvGap,
    brandBreakdown,
  };
}

async function buildBranchKitchenProfile(
  branch: 'Combined' | 'Kemang' | 'Greenville',
  kitchenType: string,
  slaTargetMin: number,
  dateAndBrandWhere: string
): Promise<BranchKitchenSlaProfile> {
  const branchClause =
    branch === 'Combined' ? '' : ` AND LOWER(o.branch) = '${branch.toLowerCase()}'`;
  const branchWhere = `${dateAndBrandWhere}${branchClause} AND o.created_at IS NOT NULL`;

  const breachExpr =
    branch === 'Combined'
      ? `(CASE WHEN LOWER(o.branch) = 'kemang' THEN o.prep_time_minutes > 12.0 ELSE o.prep_time_minutes > 15.0 END)`
      : `(o.prep_time_minutes > ${slaTargetMin})`;

  const targetExpr =
    branch === 'Combined'
      ? `(CASE WHEN LOWER(o.branch) = 'kemang' THEN 12.0 ELSE 15.0 END)`
      : `${slaTargetMin}`;

  const kptSummaryRows = await runQuery<Record<string, unknown>>(`
    SELECT
      COUNT(*) AS total_orders,
      COUNT(CASE WHEN o.prep_time_minutes IS NOT NULL AND o.prep_time_minutes > 0 THEN 1 END) AS total_kpt_orders,
      COALESCE(ROUND(AVG(CASE WHEN o.prep_time_minutes > 0 THEN o.prep_time_minutes END), 1), 0) AS avg_prep_min,
      COALESCE(ROUND(QUANTILE_CONT(CASE WHEN o.prep_time_minutes > 0 THEN o.prep_time_minutes END, 0.9), 1), 0) AS p90_prep_min,
      COALESCE(SUM(CASE WHEN ${breachExpr} THEN 1 ELSE 0 END), 0) AS total_breaches,
      COALESCE(SUM(CASE WHEN o.prep_time_minutes > 20.0 THEN 1 ELSE 0 END), 0) AS total_red_alerts
    FROM fact_orders o
    WHERE ${branchWhere};
  `);

  const sumRow = kptSummaryRows[0] || {};
  const totalOrders = Number(sumRow.total_orders ?? 0);
  const totalKptOrders = Number(sumRow.total_kpt_orders ?? 0);
  const avgPrepTimeMin = Number(sumRow.avg_prep_min ?? 0);
  const p90PrepTimeMin = Number(sumRow.p90_prep_min ?? 0);
  const totalBreaches = Number(sumRow.total_breaches ?? 0);
  const totalRedAlerts = Number(sumRow.total_red_alerts ?? 0);
  const breachRatePct = totalKptOrders > 0 ? Number(((totalBreaches / totalKptOrders) * 100).toFixed(1)) : 0;

  const heatmapRaw = await runQuery<Record<string, unknown>>(`
    SELECT
      CAST(EXTRACT(DOW FROM o.created_at) AS INTEGER) AS dow,
      CAST(EXTRACT(HOUR FROM o.created_at) AS INTEGER) AS hr,
      COUNT(*) AS order_count,
      COUNT(CASE WHEN o.prep_time_minutes IS NOT NULL AND o.prep_time_minutes > 0 THEN 1 END) AS kpt_sample_count,
      COALESCE(ROUND(AVG(CASE WHEN o.prep_time_minutes > 0 THEN o.prep_time_minutes END), 1), 0) AS avg_prep_min,
      COALESCE(SUM(CASE WHEN ${breachExpr} THEN 1 ELSE 0 END), 0) AS sla_breaches,
      COALESCE(SUM(CASE WHEN o.prep_time_minutes > 20.0 THEN 1 ELSE 0 END), 0) AS red_alerts
    FROM fact_orders o
    WHERE ${branchWhere}
    GROUP BY 1, 2
    ORDER BY 1 ASC, 2 ASC;
  `);

  const DOW_LABELS: Record<number, string> = {
    0: 'Sun',
    1: 'Mon',
    2: 'Tue',
    3: 'Wed',
    4: 'Thu',
    5: 'Fri',
    6: 'Sat',
  };

  let worstDayHourLabel = 'N/A';
  let worstDayHourPrepMin = 0;

  const heatmapCells: SlaHeatmapCell[] = heatmapRaw.map((r) => {
    const dow = Number(r.dow ?? 0);
    const hour = Number(r.hr ?? 0);
    const orderCount = Number(r.order_count ?? 0);
    const kptSampleCount = Number(r.kpt_sample_count ?? 0);
    const avgPrep = Number(r.avg_prep_min ?? 0);
    const slaBreaches = Number(r.sla_breaches ?? 0);
    const redAlerts = Number(r.red_alerts ?? 0);
    const cellBreachRate = kptSampleCount > 0 ? Number(((slaBreaches / kptSampleCount) * 100).toFixed(1)) : 0;
    const dowLabel = DOW_LABELS[dow] || 'Day';

    if (kptSampleCount >= 1 && avgPrep > worstDayHourPrepMin) {
      worstDayHourPrepMin = avgPrep;
      worstDayHourLabel = `${dowLabel} ${String(hour).padStart(2, '0')}:00`;
    }

    return {
      dow,
      dowLabel,
      hour,
      orderCount,
      kptSampleCount,
      avgPrepTimeMin: avgPrep,
      slaBreaches,
      redAlerts,
      breachRatePct: cellBreachRate,
    };
  });

  const daypartRaw = await runQuery<Record<string, unknown>>(`
    SELECT
      CASE
        WHEN EXTRACT(HOUR FROM o.created_at) BETWEEN 7 AND 10 THEN 'Breakfast (07-10)'
        WHEN EXTRACT(HOUR FROM o.created_at) BETWEEN 11 AND 13 THEN 'Lunch Rush (11-13)'
        WHEN EXTRACT(HOUR FROM o.created_at) BETWEEN 14 AND 17 THEN 'Afternoon (14-17)'
        WHEN EXTRACT(HOUR FROM o.created_at) BETWEEN 18 AND 20 THEN 'Dinner Rush (18-20)'
        ELSE 'Late / Off-Hours'
      END AS daypart,
      COUNT(*) AS order_count,
      COUNT(CASE WHEN o.prep_time_minutes IS NOT NULL AND o.prep_time_minutes > 0 THEN 1 END) AS kpt_sample_count,
      COALESCE(ROUND(AVG(CASE WHEN o.prep_time_minutes > 0 THEN o.prep_time_minutes END), 1), 0) AS avg_prep_min,
      COALESCE(SUM(CASE WHEN ${breachExpr} THEN 1 ELSE 0 END), 0) AS sla_breaches,
      COALESCE(SUM(CASE WHEN o.prep_time_minutes > 20.0 THEN 1 ELSE 0 END), 0) AS red_alerts,
      COALESCE(SUM(o.gross_amount), 0) AS gross_gmv
    FROM fact_orders o
    WHERE ${branchWhere}
    GROUP BY 1;
  `);

  const DAYPART_ORDER: DaypartSlaStats['daypart'][] = [
    'Breakfast (07-10)',
    'Lunch Rush (11-13)',
    'Afternoon (14-17)',
    'Dinner Rush (18-20)',
    'Late / Off-Hours',
  ];

  const dayparts: DaypartSlaStats[] = DAYPART_ORDER.map((dpName) => {
    const found = daypartRaw.find((d) => String(d.daypart) === dpName);
    const orderCount = Number(found?.order_count ?? 0);
    const kptSampleCount = Number(found?.kpt_sample_count ?? 0);
    const slaBreaches = Number(found?.sla_breaches ?? 0);
    return {
      daypart: dpName,
      orderCount,
      kptSampleCount,
      avgPrepTimeMin: Number(found?.avg_prep_min ?? 0),
      slaBreaches,
      redAlerts: Number(found?.red_alerts ?? 0),
      breachRatePct: kptSampleCount > 0 ? Number(((slaBreaches / kptSampleCount) * 100).toFixed(1)) : 0,
      grossGmv: Number(found?.gross_gmv ?? 0),
    };
  });

  const breachTicketsRaw = await runQuery<Record<string, unknown>>(`
    WITH basket AS (
      SELECT
        order_id,
        CAST(COALESCE(SUM(item_qty), 0) AS INTEGER) AS total_units,
        COUNT(DISTINCT item_name) AS distinct_skus,
        STRING_AGG(CAST(CAST(item_qty AS INTEGER) AS VARCHAR) || 'x ' || item_name, ' · ' ORDER BY item_qty DESC) AS basket_summary
      FROM fact_order_items
      GROUP BY order_id
    )
    SELECT
      o.order_id,
      o.brand,
      o.branch,
      CASE
        WHEN LOWER(o.provider) LIKE '%grab%' THEN 'GrabFood'
        WHEN LOWER(o.provider) LIKE '%go%' THEN 'GoFood'
        ELSE o.provider
      END AS provider,
      strftime(o.created_at, '%d %b %H:%M') AS created_at_formatted,
      ROUND(o.prep_time_minutes, 1) AS prep_time_minutes,
      ${targetExpr} AS sla_target_min,
      ROUND(o.prep_time_minutes - ${targetExpr}, 1) AS overage_minutes,
      CASE WHEN o.prep_time_minutes > 20.0 THEN true ELSE false END AS is_red_alert,
      COALESCE(o.gross_amount, 0) AS gross_amount,
      COALESCE(b.total_units, 0) AS total_units,
      COALESCE(b.distinct_skus, 0) AS distinct_skus,
      COALESCE(b.basket_summary, 'Basket items pending Klikit Items CSV') AS basket_summary
    FROM fact_orders o
    LEFT JOIN basket b ON o.order_id = b.order_id
    WHERE ${branchWhere}
      AND ${breachExpr}
    ORDER BY o.prep_time_minutes DESC
    LIMIT 10;
  `);

  const topBreachTickets: BreachTicketItem[] = breachTicketsRaw.map((t) => ({
    order_id: String(t.order_id),
    brand: String(t.brand),
    branch: String(t.branch),
    provider: String(t.provider),
    created_at_formatted: String(t.created_at_formatted || ''),
    prep_time_minutes: Number(t.prep_time_minutes ?? 0),
    sla_target_min: Number(t.sla_target_min ?? slaTargetMin),
    overage_minutes: Number(t.overage_minutes ?? 0),
    is_red_alert: Boolean(t.is_red_alert),
    gross_amount: Number(t.gross_amount ?? 0),
    total_units: Number(t.total_units ?? 0),
    distinct_skus: Number(t.distinct_skus ?? 0),
    basket_summary: String(t.basket_summary || ''),
  }));

  return {
    branch,
    kitchenType,
    slaTargetMin,
    totalOrders,
    totalKptOrders,
    avgPrepTimeMin,
    p90PrepTimeMin,
    totalBreaches,
    totalRedAlerts,
    breachRatePct,
    worstDayHourLabel,
    worstDayHourPrepMin,
    heatmapCells,
    dayparts,
    topBreachTickets,
  };
}

export async function getKitchenSlaDiagnostic(
  filters?: QueryFilters,
  brandName?: string
): Promise<KitchenSlaDiagnostic> {
  // Build date-only + brand where clause so we always compute accurate Combined, Kemang, and Greenville profiles
  const dateOnlyFilters: QueryFilters = {
    range: filters?.range,
    from: filters?.from,
    to: filters?.to,
  };
  const dateWhere = buildWhereClause(dateOnlyFilters, 'o');
  const brandClause = brandName ? ` AND LOWER(o.brand) = '${brandName.toLowerCase().replace(/'/g, "''")}'` : '';
  const dateAndBrandWhere = `${dateWhere}${brandClause}`;

  const [combined, kemang, greenville] = await Promise.all([
    buildBranchKitchenProfile('Combined', 'Kemang (≤12m) + Greenville (≤15m)', 13.5, dateAndBrandWhere),
    buildBranchKitchenProfile('Kemang', 'Cloud Kitchen · Delivery Only', 12.0, dateAndBrandWhere),
    buildBranchKitchenProfile('Greenville', 'Flagship Kitchen · Dine-In & Delivery', 15.0, dateAndBrandWhere),
  ]);

  const rawBranch = (filters?.branch || 'all').toLowerCase();
  const activeBranchFilter: 'all' | 'kemang' | 'greenville' =
    rawBranch === 'kemang' ? 'kemang' : rawBranch === 'greenville' ? 'greenville' : 'all';

  const primaryProfile =
    activeBranchFilter === 'kemang'
      ? kemang
      : activeBranchFilter === 'greenville'
      ? greenville
      : combined;

  return {
    activeBranchFilter,
    combined,
    kemang,
    greenville,
    totalKptOrders: primaryProfile.totalKptOrders,
    avgPrepTimeMin: primaryProfile.avgPrepTimeMin,
    p90PrepTimeMin: primaryProfile.p90PrepTimeMin,
    totalBreaches: primaryProfile.totalBreaches,
    totalRedAlerts: primaryProfile.totalRedAlerts,
    breachRatePct: primaryProfile.breachRatePct,
    worstDayHourLabel: primaryProfile.worstDayHourLabel,
    worstDayHourPrepMin: primaryProfile.worstDayHourPrepMin,
    heatmapCells: primaryProfile.heatmapCells,
    dayparts: primaryProfile.dayparts,
    topBreachTickets: primaryProfile.topBreachTickets,
  };
}

async function buildBranchCancellationProfile(
  branch: 'Combined' | 'Kemang' | 'Greenville',
  dateOnlyFilters?: QueryFilters,
  brandName?: string
): Promise<BranchCancellationProfile> {
  const dateClauseOrders = buildDateAndBranchFilterClause(
    {
      range: dateOnlyFilters?.range,
      from: dateOnlyFilters?.from,
      to: dateOnlyFilters?.to,
      branch: branch === 'Combined' ? 'all' : branch.toLowerCase(),
    },
    'o'
  );
  const dateClauseCancel = buildDateAndBranchFilterClause(
    {
      range: dateOnlyFilters?.range,
      from: dateOnlyFilters?.from,
      to: dateOnlyFilters?.to,
      branch: branch === 'Combined' ? 'all' : branch.toLowerCase(),
    },
    'c'
  );

  const brandClauseOrders = brandName
    ? ` AND LOWER(o.brand) = '${brandName.toLowerCase().replace(/'/g, "''")}'`
    : '';
  const brandClauseCancel = brandName
    ? ` AND LOWER(c.brand) = '${brandName.toLowerCase().replace(/'/g, "''")}'`
    : '';

  const [completedRows, cancelTicketsRaw, brandCompletedRows] = await Promise.all([
    runQuery<Record<string, unknown>>(`
      SELECT COUNT(*) AS completed_cnt
      FROM fact_orders o
      WHERE o.status != 'CANCELLED' AND ${dateClauseOrders}${brandClauseOrders};
    `),
    runQuery<Record<string, unknown>>(`
      SELECT
        c.order_id,
        COALESCE(c.short_id, c.order_id) AS short_id,
        CASE
          WHEN LOWER(c.provider) LIKE '%grab%' THEN 'GrabFood'
          WHEN LOWER(c.provider) LIKE '%go%' THEN 'GoFood'
          ELSE c.provider
        END AS provider,
        c.brand,
        c.branch,
        strftime(c.created_at, '%d %b %H:%M') AS created_at_formatted,
        CAST(COALESCE(EXTRACT(HOUR FROM c.created_at), 0) AS INTEGER) AS hour_of_day,
        COALESCE(c.gross_amount, 0) AS gross_amount,
        COALESCE(c.net_payout, 0) AS net_payout,
        COALESCE(c.cancellation_reason, 'UNSPECIFIED_PLATFORM_CANCEL') AS cancellation_reason,
        COALESCE(c.cancelled_by, 'unspecified') AS cancelled_by,
        c.prep_time_minutes,
        COALESCE(c.meal_prep_time_raw, 'N/A') AS meal_prep_time_raw,
        COALESCE(c.items_ordered, 1) AS items_ordered,
        COALESCE(c.menu_items_summary, '') AS menu_items_summary
      FROM dim_order_cancellations c
      WHERE ${dateClauseCancel}${brandClauseCancel}
      ORDER BY c.created_at DESC;
    `),
    runQuery<Record<string, unknown>>(`
      SELECT o.brand, COUNT(*) AS completed_cnt
      FROM fact_orders o
      WHERE o.status != 'CANCELLED' AND ${dateClauseOrders}${brandClauseOrders}
      GROUP BY o.brand;
    `),
  ]);

  const completedOrders = Number(completedRows[0]?.completed_cnt ?? 0);
  const cancelledOrders = cancelTicketsRaw.length;
  const totalOrdersWithCancels = completedOrders + cancelledOrders;
  const cancellationRatePct =
    totalOrdersWithCancels > 0
      ? Number(((cancelledOrders / totalOrdersWithCancels) * 100).toFixed(2))
      : 0;

  const formatReasonMeta = (code: string, by: string, prepMin: number | null) => {
    const upper = code.toUpperCase();
    if (upper.includes('RESTAURANT_CLOSED')) {
      return {
        label: 'Store Closed / Early Opening Gap',
        fix: 'Sync GrabFood/GoFood opening hours to 07:30 WIB or assign 06:15 WIB early opener',
      };
    }
    if (upper.includes('PROBLEM_CONTACT_CUSTOMER')) {
      return {
        label: 'Customer Unreachable (Post-Prep)',
        fix: 'Claim platform merchant reimbursement for cooked order (#photo proof in GrabMerchant)',
      };
    }
    if (prepMin !== null && prepMin > 20) {
      return {
        label: 'Severe Prep Delay Walkout (>20m)',
        fix: 'Auto-alert kitchen expeditor at 12m KPT before driver/customer cancels',
      };
    }
    return {
      label: by === 'provider' ? 'Aggregator Driver / System Cancel' : 'GoFood Unaccepted / Platform Cancel',
      fix: 'Enable auto-accept on GoBiz/Klikit tablet & audit morning/peak stockout toggles',
    };
  };

  const getWindowLabel = (hr: number): { label: string; range: string; note: string } => {
    if (hr >= 6 && hr <= 8) {
      return {
        label: 'Early Opening (06:00–08:59)',
        range: '06:00 – 08:59 WIB',
        note: 'Tablet active before 07:30 WIB staff clock-in (`RESTAURANT_CLOSED` & unaccepted morning tickets)',
      };
    }
    if (hr >= 9 && hr <= 13) {
      return {
        label: 'Mid-Morning & Lunch (09:00–13:59)',
        range: '09:00 – 13:59 WIB',
        note: 'Peak breakfast-to-lunch transition queue & post-prep customer/driver handoff friction',
      };
    }
    if (hr >= 14 && hr <= 16) {
      return {
        label: 'Afternoon Transition (14:00–16:59)',
        range: '14:00 – 16:59 WIB',
        note: 'Shift handoff & prep replenishment window',
      };
    }
    return {
      label: 'Evening Rush (17:00–21:59)',
      range: '17:00 – 21:59 WIB',
      note: 'Dinner rush aggregator queue & SKU availability sync on GoFood',
    };
  };

  let lostGrossGmv = 0;
  let lostNetPayout = 0;
  let postPrepWasteOrders = 0;
  let postPrepWasteGrossGmv = 0;
  let prePrepLostOrders = 0;
  let prePrepLostGrossGmv = 0;
  let earlyOpeningCancels = 0;
  let earlyOpeningLostGmv = 0;
  let gofoodCancels = 0;
  let grabfoodCancels = 0;

  const reasonMap = new Map<
    string,
    {
      reason_code: string;
      reason_label: string;
      cancelled_by: string;
      order_count: number;
      lost_gross_gmv: number;
      lost_net_payout: number;
      operational_fix: string;
    }
  >();

  const windowOrder = [
    'Early Opening (06:00–08:59)',
    'Mid-Morning & Lunch (09:00–13:59)',
    'Afternoon Transition (14:00–16:59)',
    'Evening Rush (17:00–21:59)',
  ];
  const windowMap = new Map<
    string,
    {
      window_label: string;
      time_range: string;
      cancelled_orders: number;
      lost_gross_gmv: number;
      root_cause_note: string;
    }
  >();
  for (const w of [6, 10, 15, 18]) {
    const meta = getWindowLabel(w);
    windowMap.set(meta.label, {
      window_label: meta.label,
      time_range: meta.range,
      cancelled_orders: 0,
      lost_gross_gmv: 0,
      root_cause_note: meta.note,
    });
  }

  const brandCancelMap = new Map<
    string,
    {
      cancelled_orders: number;
      lost_gross_gmv: number;
      lost_net_payout: number;
      post_prep_waste_count: number;
    }
  >();

  const tickets: CanceledOrderItem[] = cancelTicketsRaw.map((r) => {
    const gross = Number(r.gross_amount ?? 0);
    const net = Number(r.net_payout ?? 0);
    const hr = Number(r.hour_of_day ?? 0);
    const prepMin =
      r.prep_time_minutes !== null && r.prep_time_minutes !== undefined && Number(r.prep_time_minutes) > 0
        ? Number(Number(r.prep_time_minutes).toFixed(1))
        : null;
    const isPostPrep = prepMin !== null && prepMin > 0;
    const reasonCode = String(r.cancellation_reason || 'UNSPECIFIED_PLATFORM_CANCEL');
    const cancelledBy = String(r.cancelled_by || 'unspecified');
    const provider = String(r.provider || 'GoFood');
    const bName = String(r.brand || 'Unknown');

    lostGrossGmv += gross;
    lostNetPayout += net;

    if (isPostPrep) {
      postPrepWasteOrders++;
      postPrepWasteGrossGmv += gross;
    } else {
      prePrepLostOrders++;
      prePrepLostGrossGmv += gross;
    }

    if (hr >= 6 && hr <= 8) {
      earlyOpeningCancels++;
      earlyOpeningLostGmv += gross;
    }

    if (provider.toLowerCase().includes('grab')) grabfoodCancels++;
    else gofoodCancels++;

    const rMeta = formatReasonMeta(reasonCode, cancelledBy, prepMin);
    const rKey = `${reasonCode}::${rMeta.label}`;
    const existingReason = reasonMap.get(rKey);
    if (existingReason) {
      existingReason.order_count++;
      existingReason.lost_gross_gmv += gross;
      existingReason.lost_net_payout += net;
    } else {
      reasonMap.set(rKey, {
        reason_code: reasonCode,
        reason_label: rMeta.label,
        cancelled_by: cancelledBy,
        order_count: 1,
        lost_gross_gmv: gross,
        lost_net_payout: net,
        operational_fix: rMeta.fix,
      });
    }

    const wMeta = getWindowLabel(hr);
    const wEntry = windowMap.get(wMeta.label);
    if (wEntry) {
      wEntry.cancelled_orders++;
      wEntry.lost_gross_gmv += gross;
    }

    const bEntry = brandCancelMap.get(bName) || {
      cancelled_orders: 0,
      lost_gross_gmv: 0,
      lost_net_payout: 0,
      post_prep_waste_count: 0,
    };
    bEntry.cancelled_orders++;
    bEntry.lost_gross_gmv += gross;
    bEntry.lost_net_payout += net;
    if (isPostPrep) bEntry.post_prep_waste_count++;
    brandCancelMap.set(bName, bEntry);

    return {
      order_id: String(r.order_id),
      short_id: String(r.short_id || r.order_id),
      provider,
      brand: bName,
      branch: String(r.branch || ''),
      created_at_formatted: String(r.created_at_formatted || ''),
      hour_of_day: hr,
      daypart_label: wMeta.label,
      gross_amount: gross,
      net_payout: net,
      cancellation_reason: reasonCode,
      reason_label: rMeta.label,
      cancelled_by: cancelledBy,
      prep_stage: isPostPrep ? 'Post-Prep Food Waste' : 'Pre-Prep Lost Sale',
      prep_time_minutes: prepMin,
      meal_prep_time_raw: String(r.meal_prep_time_raw || 'N/A'),
      items_ordered: Number(r.items_ordered ?? 1),
      menu_items_summary: String(r.menu_items_summary || ''),
    };
  });

  const reasons: CancellationReasonBreakdown[] = Array.from(reasonMap.values())
    .sort((a, b) => b.lost_gross_gmv - a.lost_gross_gmv)
    .map((item) => ({
      ...item,
      share_of_cancels_pct:
        cancelledOrders > 0 ? Number(((item.order_count / cancelledOrders) * 100).toFixed(1)) : 0,
    }));

  const windows: CancellationWindowBreakdown[] = windowOrder.map((wLabel) => {
    const item = windowMap.get(wLabel)!;
    return {
      ...item,
      share_of_lost_gmv_pct:
        lostGrossGmv > 0 ? Number(((item.lost_gross_gmv / lostGrossGmv) * 100).toFixed(1)) : 0,
    };
  });

  const completedMap = new Map<string, number>();
  for (const row of brandCompletedRows) {
    completedMap.set(String(row.brand), Number(row.completed_cnt ?? 0));
  }

  const allBrandNames = Array.from(
    new Set([...Array.from(completedMap.keys()), ...Array.from(brandCancelMap.keys())])
  );

  const brands: CancellationBrandBreakdown[] = allBrandNames
    .map((b) => {
      const comp = completedMap.get(b) ?? 0;
      const cStats = brandCancelMap.get(b) || {
        cancelled_orders: 0,
        lost_gross_gmv: 0,
        lost_net_payout: 0,
        post_prep_waste_count: 0,
      };
      const tot = comp + cStats.cancelled_orders;
      return {
        brand: b,
        completed_orders: comp,
        cancelled_orders: cStats.cancelled_orders,
        cancellation_rate_pct: tot > 0 ? Number(((cStats.cancelled_orders / tot) * 100).toFixed(2)) : 0,
        lost_gross_gmv: cStats.lost_gross_gmv,
        lost_net_payout: cStats.lost_net_payout,
        post_prep_waste_count: cStats.post_prep_waste_count,
      };
    })
    .filter((b) => b.cancelled_orders > 0 || b.completed_orders > 0)
    .sort((a, b) => b.lost_gross_gmv - a.lost_gross_gmv || b.completed_orders - a.completed_orders);

  return {
    branch,
    completedOrders,
    cancelledOrders,
    cancellationRatePct,
    lostGrossGmv,
    lostNetPayout,
    postPrepWasteOrders,
    postPrepWasteGrossGmv,
    prePrepLostOrders,
    prePrepLostGrossGmv,
    earlyOpeningCancels,
    earlyOpeningLostGmv,
    gofoodCancels,
    grabfoodCancels,
    reasons,
    windows,
    brands,
    tickets,
  };
}

export async function getCanceledOrdersDiagnostic(
  filters?: QueryFilters,
  brandName?: string
): Promise<CanceledOrdersDiagnostic> {
  const [combined, kemang, greenville] = await Promise.all([
    buildBranchCancellationProfile('Combined', filters, brandName),
    buildBranchCancellationProfile('Kemang', filters, brandName),
    buildBranchCancellationProfile('Greenville', filters, brandName),
  ]);

  const rawBranch = (filters?.branch || 'all').toLowerCase();
  const activeBranchFilter: 'all' | 'kemang' | 'greenville' =
    rawBranch === 'kemang' ? 'kemang' : rawBranch === 'greenville' ? 'greenville' : 'all';

  return {
    activeBranchFilter,
    combined,
    kemang,
    greenville,
  };
}

export async function getDataFreshness(filters?: QueryFilters): Promise<DataFreshnessSummary> {
  const [rawSources, itemCoverage] = await Promise.all([
    runQuery<{
      source_key: string;
      order_count: number;
      min_created: string | null;
      max_created: string | null;
      max_ingested: string | null;
      latest_file: string | null;
    }>(`
      SELECT 
        CASE 
          WHEN source_file ILIKE '%klikit%' OR LOWER(provider) IN ('grabfood', 'gofood') THEN 'klikit'
          ELSE 'pos'
        END as source_key,
        CAST(COUNT(*) AS INTEGER) as order_count,
        strftime(MIN(created_at), '%Y-%m-%d %H:%M:%S') as min_created,
        strftime(MAX(created_at), '%Y-%m-%d %H:%M:%S') as max_created,
        strftime(MAX(ingested_at), '%Y-%m-%d %H:%M:%S') as max_ingested,
        MAX(source_file) as latest_file
      FROM fact_orders
      WHERE status != 'CANCELLED'
      GROUP BY 1;
    `),
    getOrderItemCoverageAudit(filters),
  ]);

  const klikitRaw = rawSources.find((s) => s.source_key === 'klikit');
  const posRaw = rawSources.find((s) => s.source_key === 'pos');

  const formatTs = (tsStr: string | null): string => {
    if (!tsStr) return 'N/A';
    try {
      const [datePart, timePart] = tsStr.split(' ');
      if (!datePart || !timePart) return tsStr;
      const [year, month, day] = datePart.split('-');
      const [hour, minute] = timePart.split(':');
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const mIdx = parseInt(month, 10) - 1;
      const mName = monthNames[mIdx] || month;
      return `${day} ${mName} ${year}, ${hour}:${minute} WIB`;
    } catch {
      return tsStr;
    }
  };

  const klikit: SourceFreshness = {
    sourceKey: 'klikit',
    sourceName: 'Klikit Delivery Aggregator',
    channelType: 'GrabFood & GoFood (Online Delivery)',
    branchCoverage: 'Greenville & Kemang (Both Branches)',
    lastOrderDate: klikitRaw?.max_created || null,
    lastOrderFormatted: klikitRaw?.max_created ? formatTs(klikitRaw.max_created) : 'No delivery orders found',
    lastImportedDate: klikitRaw?.max_ingested || null,
    lastImportedFormatted: klikitRaw?.max_ingested ? formatTs(klikitRaw.max_ingested) : 'Not imported',
    earliestDate: klikitRaw?.min_created ? formatTs(klikitRaw.min_created) : null,
    orderCount: Number(klikitRaw?.order_count || 0),
    status: klikitRaw?.order_count ? 'active' : 'pending',
    statusBadge: klikitRaw?.order_count ? 'Synced & Active' : 'Missing File',
    sourceFile: klikitRaw?.latest_file || null,
    description: 'Ingested from Klikit portal export. Tracks delivery orders, platform GMV, promo burn, and kitchen SLAs.',
  };

  const dineInPos: SourceFreshness = {
    sourceKey: 'dine_in_pos',
    sourceName: 'Greenville POS (Dine-in / Direct)',
    channelType: 'Dine-In, Takeaway & Direct Offline POS',
    branchCoverage: 'Greenville Dine-in Location',
    lastOrderDate: posRaw?.max_created || null,
    lastOrderFormatted: posRaw?.max_created ? formatTs(posRaw.max_created) : 'No Dine-in data ingested yet',
    lastImportedDate: posRaw?.max_ingested || null,
    lastImportedFormatted: posRaw?.max_ingested ? formatTs(posRaw.max_ingested) : 'Awaiting POS export file',
    earliestDate: posRaw?.min_created ? formatTs(posRaw.min_created) : null,
    orderCount: Number(posRaw?.order_count || 0),
    status: posRaw?.order_count ? 'active' : 'pending',
    statusBadge: posRaw?.order_count ? 'Synced' : 'Awaiting Import',
    sourceFile: posRaw?.latest_file || null,
    description: 'Direct POS cash register export for Greenville offline dine-in & counter orders. Awaiting export CSV ingestion.',
  };

  return {
    sources: [klikit, dineInPos],
    klikit,
    dineInPos,
    overallCoverage: klikit.lastOrderDate
      ? `${klikit.earliestDate?.split(',')[0] || '19 Sep'} - ${klikit.lastOrderFormatted}`
      : 'No transaction data',
    itemCoverage,
  };
}

export async function getPrimeCostSummary(filters?: QueryFilters): Promise<PrimeCostSummary> {
  const whereOrders = buildWhereClause(filters, 'o');
  const whereItems = buildWhereClause(filters, 'foi');

  const [orderSummaryRows, itemCogsRows] = await Promise.all([
    runQuery<Record<string, unknown>>(`
      SELECT
        COALESCE(SUM(o.gross_amount), 0) AS gross_gmv,
        COALESCE(SUM(o.net_payout), 0) AS net_revenue,
        COALESCE(SUM(o.merchant_promo_burn), 0) AS promo_burn,
        COUNT(DISTINCT strftime(o.created_at, '%Y-%m-%d')) AS active_days,
        strftime(MIN(o.created_at), '%Y-%m-%d') AS min_dt,
        strftime(MAX(o.created_at), '%Y-%m-%d') AS max_dt
      FROM fact_orders o
      WHERE ${whereOrders};
    `),
    runQuery<Record<string, unknown>>(`
      SELECT
        COALESCE(SUM(COALESCE(foi.total_price, 0)), 0) AS item_exploded_rev,
        COALESCE(SUM(
          COALESCE(foi.item_qty, 1) * COALESCE(
            r.raw_food_cost,
            ROUND(COALESCE(foi.item_price, 35000) * (
              CASE
                WHEN LOWER(COALESCE(foi.category, '')) LIKE '%drink%'
                  OR LOWER(COALESCE(foi.category, '')) LIKE '%espresso%'
                  OR LOWER(foi.item_name) LIKE '%coffee%'
                  OR LOWER(foi.item_name) LIKE '%latte%'
                  OR LOWER(foi.item_name) LIKE '%tea%' THEN 0.16
                WHEN LOWER(COALESCE(foi.category, '')) LIKE '%side%'
                  OR LOWER(foi.item_name) LIKE '%tots%'
                  OR LOWER(foi.item_name) LIKE '%fries%' THEN 0.23
                ELSE 0.27
              END
            ), 0)
          )
        ), 0) AS raw_food_cost_sum,
        COALESCE(SUM(
          COALESCE(foi.item_qty, 1) * (
            CASE
              WHEN LOWER(foi.provider) LIKE '%pos%' OR LOWER(foi.provider) LIKE '%majoo%' OR LOWER(foi.provider) LIKE '%greenville%'
                THEN COALESCE(r.packaging_dine_in, 0)
              ELSE COALESCE(r.packaging_delivery, 2200)
            END
          )
        ), 0) AS packaging_cost_sum
      FROM fact_order_items foi
      LEFT JOIN dim_recipes r
        ON LOWER(foi.brand) = LOWER(r.brand)
       AND LOWER(TRIM(foi.item_name)) = LOWER(TRIM(r.item_name))
      WHERE ${whereItems}
        AND LOWER(foi.item_name) NOT LIKE '%cutler%';
    `),
  ]);

  const ord = orderSummaryRows[0] || {};
  const itm = itemCogsRows[0] || {};

  const grossGmv = Number(ord.gross_gmv ?? 0);
  const netRevenue = Number(ord.net_revenue ?? 0);
  const merchantPromoBurn = Number(ord.promo_burn ?? 0);
  const platformFeesAndCommissions = Math.max(0, grossGmv - netRevenue - merchantPromoBurn);
  const netRealizationPct = grossGmv > 0 ? Number(((netRevenue / grossGmv) * 100).toFixed(1)) : 0;
  const activeDaysCount = Math.max(1, Number(ord.active_days ?? 1));
  const minDt = ord.min_dt ? String(ord.min_dt) : '2026-09-01';
  const maxDt = ord.max_dt ? String(ord.max_dt) : '2026-09-26';

  const itemExplodedRev = Number(itm.item_exploded_rev ?? 0);
  const unscaledRawFood = Number(itm.raw_food_cost_sum ?? 0);
  const unscaledPkg = Number(itm.packaging_cost_sum ?? 0);

  // Scale theoretical COGS proportionally if order-item CSV coverage is partial (<92% of Gross GMV)
  const coverageScale =
    itemExplodedRev > 0 && itemExplodedRev < grossGmv * 0.92
      ? Math.min(2.5, grossGmv / itemExplodedRev)
      : 1.0;

  const rawFoodCost = Math.round(unscaledRawFood * coverageScale);
  const packagingCost = Math.round(unscaledPkg * coverageScale);
  const totalCogs = rawFoodCost + packagingCost;

  const cogsPctOfNetRevenue = netRevenue > 0 ? Number(((totalCogs / netRevenue) * 100).toFixed(1)) : 0;
  const cogsPctOfGrossGmv = grossGmv > 0 ? Number(((totalCogs / grossGmv) * 100).toFixed(1)) : 0;
  const grossMarginAfterCogs = netRevenue - totalCogs;
  const grossMarginAfterCogsPct =
    netRevenue > 0 ? Number(((grossMarginAfterCogs / netRevenue) * 100).toFixed(1)) : 0;

  // Check if labor applies (Greenville Flagship has Majoo attendance logs; Kemang-only filter excludes Greenville labor)
  const branchFilter = (filters?.branch || 'all').toLowerCase();
  const laborIncluded = branchFilter !== 'kemang';
  const laborOutletScope = laborIncluded
    ? 'Greenville Flagship (Majoo POS Shifts + Prorated Base Salary)'
    : 'Kemang Cloud Kitchen selected (Majoo POS attendance tracks Greenville Flagship)';

  let activeStaffCount = 0;
  let paidShiftsCount = 0;
  let effectiveLaborHours = 0;
  let lateIncidentsCount = 0;
  let grossShiftAndBaseWages = 0;
  let latePenaltiesDeducted = 0;
  let netLaborCost = 0;

  if (laborIncluded && grossGmv > 0) {
    try {
      const [attRows, empBaseRows] = await Promise.all([
        runQuery<Record<string, unknown>>(`
          SELECT
            COUNT(DISTINCT a.employee_name) AS staff_cnt,
            COUNT(*) AS paid_shifts,
            COALESCE(ROUND(SUM(COALESCE(a.effective_hours, 9.0)), 1), 0) AS total_hours,
            COALESCE(SUM(COALESCE(e.daily_rate, 85000)), 0) AS shift_wages,
            COALESCE(SUM(
              CASE
                WHEN a.clock_in IS NOT NULL
                 AND LENGTH(TRIM(a.clock_in)) >= 5
                 AND SUBSTR(TRIM(a.clock_in), 1, 5) > COALESCE(e.shift_start_time, '07:30')
                THEN 1 ELSE 0
              END
            ), 0) AS late_cnt,
            COALESCE(SUM(
              CASE
                WHEN a.clock_in IS NOT NULL
                 AND LENGTH(TRIM(a.clock_in)) >= 5
                 AND SUBSTR(TRIM(a.clock_in), 1, 5) > COALESCE(e.shift_start_time, '07:30')
                THEN COALESCE(e.late_penalty_rate, 20000) ELSE 0
              END
            ), 0) AS late_penalties
          FROM fact_attendance a
          LEFT JOIN dim_employees e ON LOWER(a.employee_name) = LOWER(e.employee_name)
          WHERE a.work_date >= DATE '${minDt}'
            AND a.work_date <= DATE '${maxDt}'
            AND COALESCE(a.anomaly_type, 'none') != 'missing_clock_out';
        `),
        runQuery<Record<string, unknown>>(`
          SELECT
            COUNT(*) AS active_emp_cnt,
            COALESCE(SUM(basic_salary), 0) AS monthly_basic_sum
          FROM dim_employees
          WHERE is_active = TRUE;
        `),
      ]);

      const att = attRows[0] || {};
      const emp = empBaseRows[0] || {};

      activeStaffCount = Number(att.staff_cnt ?? emp.active_emp_cnt ?? 0);
      paidShiftsCount = Number(att.paid_shifts ?? 0);
      effectiveLaborHours = Number(att.total_hours ?? 0);
      lateIncidentsCount = Number(att.late_cnt ?? 0);

      const shiftWages = Number(att.shift_wages ?? 0);
      const monthlyBasicSum = Number(emp.monthly_basic_sum ?? 6600000);
      const proratedBaseWages = Math.round((monthlyBasicSum / 30) * activeDaysCount);

      grossShiftAndBaseWages = shiftWages + proratedBaseWages;
      latePenaltiesDeducted = Number(att.late_penalties ?? 0);
      netLaborCost = Math.max(0, grossShiftAndBaseWages - latePenaltiesDeducted);
    } catch {
      // Fallback if attendance tables are not yet initialized
      if (laborIncluded) {
        activeStaffCount = 8;
      }
    }
  }

  const laborPctOfNetRevenue =
    netRevenue > 0 ? Number(((netLaborCost / netRevenue) * 100).toFixed(1)) : 0;
  const laborPctOfGrossGmv =
    grossGmv > 0 ? Number(((netLaborCost / grossGmv) * 100).toFixed(1)) : 0;
  const revenuePerLaborHour =
    effectiveLaborHours > 0 ? Math.round(netRevenue / effectiveLaborHours) : 0;

  const primeCost = totalCogs + netLaborCost;
  const primeCostPctOfNetRevenue =
    netRevenue > 0 ? Number(((primeCost / netRevenue) * 100).toFixed(1)) : 0;
  const primeCostPctOfGrossGmv =
    grossGmv > 0 ? Number(((primeCost / grossGmv) * 100).toFixed(1)) : 0;
  const primeCostTargetPct = laborIncluded ? 58.0 : 35.0;

  const primeCostStatus: 'Optimal' | 'Watchlist' | 'High Strain' =
    primeCostPctOfNetRevenue <= primeCostTargetPct
      ? 'Optimal'
      : primeCostPctOfNetRevenue <= primeCostTargetPct + 8.0
      ? 'Watchlist'
      : 'High Strain';

  const netContributionMarginRp = netRevenue - primeCost;
  const netContributionMarginPct =
    netRevenue > 0 ? Number(((netContributionMarginRp / netRevenue) * 100).toFixed(1)) : 0;

  return {
    grossGmv,
    merchantPromoBurn,
    platformFeesAndCommissions,
    netRevenue,
    netRealizationPct,
    rawFoodCost,
    packagingCost,
    totalCogs,
    cogsPctOfNetRevenue,
    cogsPctOfGrossGmv,
    grossMarginAfterCogs,
    grossMarginAfterCogsPct,
    laborIncluded,
    laborOutletScope,
    activeStaffCount,
    paidShiftsCount,
    effectiveLaborHours,
    lateIncidentsCount,
    grossShiftAndBaseWages,
    latePenaltiesDeducted,
    netLaborCost,
    laborPctOfNetRevenue,
    laborPctOfGrossGmv,
    revenuePerLaborHour,
    primeCost,
    primeCostPctOfNetRevenue,
    primeCostPctOfGrossGmv,
    primeCostTargetPct,
    primeCostStatus,
    netContributionMarginRp,
    netContributionMarginPct,
    activeDaysCount,
    dateSpanLabel: `${minDt} to ${maxDt} (${activeDaysCount}d)`,
  };
}

export async function getCatalogRecipesAndUnmappedSkus(
  brandFilter?: string
): Promise<CatalogBomItem[]> {
  const brandCond = brandFilter
    ? `AND LOWER(brand) = '${brandFilter.toLowerCase().replace(/'/g, "''")}'`
    : '';

  const [recipeRows, skuRows] = await Promise.all([
    runQuery<Record<string, unknown>>(`
      SELECT
        recipe_id,
        brand,
        item_name,
        canonical_name,
        category,
        bom_summary,
        raw_food_cost,
        packaging_dine_in,
        packaging_delivery,
        target_food_cost_pct,
        is_hero_bom
      FROM dim_recipes
      WHERE 1=1 ${brandCond}
      ORDER BY is_hero_bom DESC, brand ASC, canonical_name ASC;
    `),
    runQuery<Record<string, unknown>>(`
      SELECT
        foi.brand,
        foi.item_name,
        COALESCE(MAX(foi.category), 'General') AS category,
        CAST(SUM(COALESCE(foi.item_qty, 1)) AS INTEGER) AS total_units_sold,
        CAST(ROUND(AVG(COALESCE(foi.item_price, 0)), 0) AS DOUBLE) AS realized_menu_price
      FROM fact_order_items foi
      WHERE foi.status != 'CANCELLED'
        AND LOWER(foi.item_name) NOT LIKE '%cutler%'
        ${brandFilter ? `AND LOWER(foi.brand) = '${brandFilter.toLowerCase().replace(/'/g, "''")}'` : ''}
      GROUP BY foi.brand, foi.item_name
      ORDER BY total_units_sold DESC;
    `),
  ]);

  const seededIds = new Set(MASTER_RECIPES.map((r) => r.recipe_id));
  const skuStatsMap = new Map<string, { units: number; price: number; category: string }>();

  for (const s of skuRows) {
    const key = `${String(s.brand).toLowerCase()}::${String(s.item_name).trim().toLowerCase()}`;
    skuStatsMap.set(key, {
      units: Number(s.total_units_sold ?? 0),
      price: Number(s.realized_menu_price ?? 0),
      category: String(s.category || 'General'),
    });
  }

  const mappedKeys = new Set<string>();
  const catalogItems: CatalogBomItem[] = [];

  for (const r of recipeRows) {
    const brand = String(r.brand);
    const itemName = String(r.item_name);
    const key = `${brand.toLowerCase()}::${itemName.trim().toLowerCase()}`;
    mappedKeys.add(key);

    const stats = skuStatsMap.get(key);
    const rId = String(r.recipe_id);

    catalogItems.push({
      recipe_id: rId,
      brand,
      item_name: itemName,
      canonical_name: String(r.canonical_name || itemName),
      category: String(r.category || stats?.category || 'General'),
      bom_summary: String(r.bom_summary || ''),
      raw_food_cost: Number(r.raw_food_cost ?? 0),
      packaging_dine_in: Number(r.packaging_dine_in ?? 0),
      packaging_delivery: Number(r.packaging_delivery ?? 0),
      target_food_cost_pct: Number(r.target_food_cost_pct ?? 28),
      is_hero_bom: Boolean(r.is_hero_bom),
      has_recipe_bom: true,
      is_seeded_default: seededIds.has(rId),
      realized_menu_price: stats?.price && stats.price > 0 ? stats.price : 38000,
      total_units_sold: stats?.units ?? 0,
    });
  }

  // Append unmapped SKUs from fact_order_items so operators can map them in 1 click
  for (const s of skuRows) {
    const brand = String(s.brand);
    const itemName = String(s.item_name);
    const key = `${brand.toLowerCase()}::${itemName.trim().toLowerCase()}`;
    if (mappedKeys.has(key)) continue;

    const menuPrice = Number(s.realized_menu_price ?? 0) > 0 ? Number(s.realized_menu_price) : 35000;
    const cat = String(s.category || 'General');
    const lowerName = itemName.toLowerCase();
    const isBev =
      cat.toLowerCase().includes('drink') ||
      lowerName.includes('coffee') ||
      lowerName.includes('latte') ||
      lowerName.includes('tea');

    catalogItems.push({
      recipe_id: null,
      brand,
      item_name: itemName,
      canonical_name: itemName,
      category: cat,
      bom_summary: 'Estimated fallback BOM (Click to map exact culinary recipe & packaging cost)',
      raw_food_cost: Math.round(menuPrice * (isBev ? 0.16 : 0.27)),
      packaging_dine_in: 0,
      packaging_delivery: isBev ? 1950 : 2500,
      target_food_cost_pct: isBev ? 18.0 : 28.0,
      is_hero_bom: false,
      has_recipe_bom: false,
      is_seeded_default: false,
      realized_menu_price: menuPrice,
      total_units_sold: Number(s.total_units_sold ?? 0),
    });
  }

  return catalogItems;
}

export async function upsertRecipeBom(input: UpsertRecipeBomInput): Promise<{ recipe_id: string }> {
  const esc = (s: string) => (s || '').replace(/'/g, "''").trim();
  const brand = esc(input.brand);
  const itemName = esc(input.item_name);
  const canonicalName = esc(input.canonical_name || input.item_name);
  const category = esc(input.category || 'General');
  const bomSummary = esc(input.bom_summary || 'Custom culinary recipe BOM');
  const rawFoodCost = Math.max(0, Math.round(Number(input.raw_food_cost) || 0));
  const pkgDineIn = Math.max(0, Math.round(Number(input.packaging_dine_in) || 0));
  const pkgDelivery = Math.max(0, Math.round(Number(input.packaging_delivery) || 0));
  const targetFcPct = Math.max(1, Math.min(95, Number(Number(input.target_food_cost_pct || 28).toFixed(1))));
  const isHero = Boolean(input.is_hero_bom);

  // Check if a row already exists for (brand, item_name) or recipe_id
  let recipeId = input.recipe_id ? esc(input.recipe_id) : '';
  if (!recipeId) {
    const existing = await runQuery<{ recipe_id: string }>(`
      SELECT recipe_id
      FROM dim_recipes
      WHERE LOWER(brand) = LOWER('${brand}')
        AND LOWER(TRIM(item_name)) = LOWER(TRIM('${itemName}'))
      LIMIT 1;
    `);
    if (existing[0]?.recipe_id) {
      recipeId = esc(String(existing[0].recipe_id));
    } else {
      const slugBrand = brand
        .toUpperCase()
        .replace(/[^A-Z0-9]+/g, '')
        .slice(0, 5);
      const slugItem = itemName
        .toUpperCase()
        .replace(/[^A-Z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 18);
      recipeId = `CUSTOM-${slugBrand}-${slugItem}`;
    }
  }

  await runQuery(`
    INSERT INTO dim_recipes (
      recipe_id, brand, item_name, canonical_name, category,
      bom_summary, raw_food_cost, packaging_dine_in, packaging_delivery,
      target_food_cost_pct, is_hero_bom
    )
    VALUES (
      '${recipeId}',
      '${brand}',
      '${itemName}',
      '${canonicalName}',
      '${category}',
      '${bomSummary}',
      ${rawFoodCost},
      ${pkgDineIn},
      ${pkgDelivery},
      ${targetFcPct},
      ${isHero ? 'TRUE' : 'FALSE'}
    )
    ON CONFLICT (recipe_id) DO UPDATE SET
      canonical_name = EXCLUDED.canonical_name,
      category = EXCLUDED.category,
      bom_summary = EXCLUDED.bom_summary,
      raw_food_cost = EXCLUDED.raw_food_cost,
      packaging_dine_in = EXCLUDED.packaging_dine_in,
      packaging_delivery = EXCLUDED.packaging_delivery,
      target_food_cost_pct = EXCLUDED.target_food_cost_pct,
      is_hero_bom = EXCLUDED.is_hero_bom;
  `);

  return { recipe_id: recipeId };
}

export async function deleteOrResetRecipeBom(
  recipeId: string
): Promise<{ resetToDefault: boolean; deleted: boolean }> {
  const escId = (recipeId || '').replace(/'/g, "''").trim();
  const seeded = MASTER_RECIPES.find((r) => r.recipe_id === recipeId);

  if (seeded) {
    const esc = (s: string) => s.replace(/'/g, "''");
    await runQuery(`
      UPDATE dim_recipes
      SET
        canonical_name = '${esc(seeded.canonical_name)}',
        category = '${esc(seeded.category)}',
        bom_summary = '${esc(seeded.bom_summary)}',
        raw_food_cost = ${seeded.raw_food_cost},
        packaging_dine_in = ${seeded.packaging_dine_in},
        packaging_delivery = ${seeded.packaging_delivery},
        target_food_cost_pct = ${seeded.target_food_cost_pct},
        is_hero_bom = ${seeded.is_hero_bom ? 'TRUE' : 'FALSE'}
      WHERE recipe_id = '${escId}';
    `);
    return { resetToDefault: true, deleted: false };
  }

  await runQuery(`DELETE FROM dim_recipes WHERE recipe_id = '${escId}';`);
  return { resetToDefault: false, deleted: true };
}

