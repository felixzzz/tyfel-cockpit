import { runQuery } from './duckdb';


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

export interface KitchenSlaDiagnostic {
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

export interface BrandDetailData {
  brandName: string;
  slug: string;
  kpi: BrandDetailKPI;
  skus: SkuParetoItem[];
  menuEngineering: MenuEngineeringItem[];
  menuEngineeringSummary: MenuEngineeringSummary;
  slaDiagnostic: KitchenSlaDiagnostic;
  channels: BrandChannelStats[];
  branches: BrandBranchStats[];
  hourly: BrandHourlyStats[];
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

export function buildWhereClause(filters?: QueryFilters, tablePrefix: string = ''): string {
  const p = tablePrefix ? `${tablePrefix}.` : '';
  const clauses: string[] = [`${p}status != 'CANCELLED'`];

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

export async function getExecutiveSummary(filters?: QueryFilters): Promise<ExecutiveSummary> {
  const where = buildWhereClause(filters);
  const rows = await runQuery<any>(`
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
  `);
  return rows[0] as ExecutiveSummary;
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
  const kpiRows = await runQuery<Record<string, unknown>>(`
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
  `);

  // Units sold
  const unitsRow = await runQuery<{ total_units_sold: number }>(`
    SELECT COALESCE(SUM(COALESCE(item_qty, 1)), 0) AS total_units_sold
    FROM fact_order_items
    WHERE ${combinedWhere};
  `);
  const totalUnitsSold = unitsRow[0]?.total_units_sold ? Number(unitsRow[0].total_units_sold) : 0;

  const kpi: BrandDetailKPI = {
    brand: brandName,
    order_count: kpiRows[0]?.order_count ? Number(kpiRows[0].order_count) : 0,
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

  const slaDiagnostic = await getKitchenSlaDiagnostic(filters, brandName);

  return {
    brandName,
    slug,
    kpi,
    skus,
    menuEngineering,
    menuEngineeringSummary,
    slaDiagnostic,
    channels,
    branches,
    hourly,
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

export async function getKitchenSlaDiagnostic(
  filters?: QueryFilters,
  brandName?: string
): Promise<KitchenSlaDiagnostic> {
  const baseWhere = buildWhereClause(filters, 'o');
  const brandClause = brandName ? ` AND LOWER(o.brand) = '${brandName.toLowerCase().replace(/'/g, "''")}'` : '';
  const whereClause = `${baseWhere}${brandClause} AND o.created_at IS NOT NULL`;

  // 1. Overall KPT summary + P90
  const kptSummaryRows = await runQuery<Record<string, unknown>>(`
    SELECT
      COUNT(CASE WHEN o.prep_time_minutes IS NOT NULL AND o.prep_time_minutes > 0 THEN 1 END) AS total_kpt_orders,
      COALESCE(ROUND(AVG(CASE WHEN o.prep_time_minutes > 0 THEN o.prep_time_minutes END), 1), 0) AS avg_prep_min,
      COALESCE(ROUND(QUANTILE_CONT(CASE WHEN o.prep_time_minutes > 0 THEN o.prep_time_minutes END, 0.9), 1), 0) AS p90_prep_min,
      COALESCE(SUM(CASE WHEN o.kpt_sla_breach = true THEN 1 ELSE 0 END), 0) AS total_breaches,
      COALESCE(SUM(CASE WHEN o.kpt_red_alert = true THEN 1 ELSE 0 END), 0) AS total_red_alerts
    FROM fact_orders o
    WHERE ${whereClause};
  `);

  const sumRow = kptSummaryRows[0] || {};
  const totalKptOrders = Number(sumRow.total_kpt_orders ?? 0);
  const avgPrepTimeMin = Number(sumRow.avg_prep_min ?? 0);
  const p90PrepTimeMin = Number(sumRow.p90_prep_min ?? 0);
  const totalBreaches = Number(sumRow.total_breaches ?? 0);
  const totalRedAlerts = Number(sumRow.total_red_alerts ?? 0);
  const breachRatePct = totalKptOrders > 0 ? Number(((totalBreaches / totalKptOrders) * 100).toFixed(1)) : 0;

  // 2. Day of Week x Hour of Day Heatmap
  const heatmapRaw = await runQuery<Record<string, unknown>>(`
    SELECT
      CAST(EXTRACT(DOW FROM o.created_at) AS INTEGER) AS dow,
      CAST(EXTRACT(HOUR FROM o.created_at) AS INTEGER) AS hr,
      COUNT(*) AS order_count,
      COUNT(CASE WHEN o.prep_time_minutes IS NOT NULL AND o.prep_time_minutes > 0 THEN 1 END) AS kpt_sample_count,
      COALESCE(ROUND(AVG(CASE WHEN o.prep_time_minutes > 0 THEN o.prep_time_minutes END), 1), 0) AS avg_prep_min,
      COALESCE(SUM(CASE WHEN o.kpt_sla_breach = true THEN 1 ELSE 0 END), 0) AS sla_breaches,
      COALESCE(SUM(CASE WHEN o.kpt_red_alert = true THEN 1 ELSE 0 END), 0) AS red_alerts
    FROM fact_orders o
    WHERE ${whereClause}
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

    if (kptSampleCount >= 2 && avgPrep > worstDayHourPrepMin) {
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

  // 3. 5-Daypart SLA Breakdown
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
      COALESCE(SUM(CASE WHEN o.kpt_sla_breach = true THEN 1 ELSE 0 END), 0) AS sla_breaches,
      COALESCE(SUM(CASE WHEN o.kpt_red_alert = true THEN 1 ELSE 0 END), 0) AS red_alerts,
      COALESCE(SUM(o.gross_amount), 0) AS gross_gmv
    FROM fact_orders o
    WHERE ${whereClause}
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

  // 4. Worst SLA Breach & Red Alert Ticket Inspector (joined with fact_order_items basket)
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
      CASE WHEN LOWER(o.branch) = 'kemang' THEN 12.0 ELSE 15.0 END AS sla_target_min,
      ROUND(o.prep_time_minutes - (CASE WHEN LOWER(o.branch) = 'kemang' THEN 12.0 ELSE 15.0 END), 1) AS overage_minutes,
      COALESCE(o.kpt_red_alert, false) AS is_red_alert,
      COALESCE(o.gross_amount, 0) AS gross_amount,
      COALESCE(b.total_units, 0) AS total_units,
      COALESCE(b.distinct_skus, 0) AS distinct_skus,
      COALESCE(b.basket_summary, 'Basket items pending Klikit Items CSV') AS basket_summary
    FROM fact_orders o
    LEFT JOIN basket b ON o.order_id = b.order_id
    WHERE ${whereClause}
      AND o.kpt_sla_breach = true
      AND o.prep_time_minutes IS NOT NULL
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
    sla_target_min: Number(t.sla_target_min ?? 15),
    overage_minutes: Number(t.overage_minutes ?? 0),
    is_red_alert: Boolean(t.is_red_alert),
    gross_amount: Number(t.gross_amount ?? 0),
    total_units: Number(t.total_units ?? 0),
    distinct_skus: Number(t.distinct_skus ?? 0),
    basket_summary: String(t.basket_summary || ''),
  }));

  return {
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
