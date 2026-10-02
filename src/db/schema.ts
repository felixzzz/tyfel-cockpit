import {
  pgTable,
  text,
  boolean,
  integer,
  doublePrecision,
  timestamp,
  date,
  primaryKey,
  index,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

// ─── AUTH & USERS ─────────────────────────────────────────────────────────────
export const mausUsers = pgTable('maus_users', {
  id: text('id')
    .primaryKey()
    .default(sql`gen_random_uuid()::TEXT`),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  role: text('role').notNull().default('staff'),
  passwordHash: text('password_hash').notNull(),
  permissions: text('permissions').notNull().default('[]'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
});

// ─── EMPLOYEES & ATTENDANCE ───────────────────────────────────────────────────
export const dimEmployees = pgTable('dim_employees', {
  employeeName: text('employee_name').primaryKey(),
  fullName: text('full_name').notNull(),
  role: text('role').notNull(),
  outlet: text('outlet').notNull(),
  joinDateLabel: text('join_date_label').notNull(),
  shiftStartTime: text('shift_start_time').notNull(),
  basicSalary: doublePrecision('basic_salary').notNull(),
  dailyRate: doublePrecision('daily_rate').notNull(),
  latePenaltyRate: doublePrecision('late_penalty_rate').notNull(),
  noLateBonus: doublePrecision('no_late_bonus').notNull(),
  isActive: boolean('is_active').default(true),
  updatedAt: timestamp('updated_at', { withTimezone: true }),
});

export const factAttendance = pgTable(
  'fact_attendance',
  {
    attendanceId: text('attendance_id').primaryKey(),
    workDate: date('work_date').notNull(),
    employeeName: text('employee_name').notNull(),
    outlet: text('outlet').notNull(),
    clockIn: text('clock_in'),
    clockOut: text('clock_out'),
    rawDuration: text('raw_duration'),
    durationSeconds: integer('duration_seconds'),
    effectiveHours: doublePrecision('effective_hours'),
    anomalyType: text('anomaly_type'),
    status: text('status'),
    notes: text('notes'),
    sourceFile: text('source_file'),
    updatedAt: timestamp('updated_at', { withTimezone: true }),
  },
  (table) => [
    index('idx_attendance_work_date_emp').on(table.workDate, table.employeeName),
    index('idx_attendance_outlet').on(table.outlet),
  ]
);

export const payrollPeriodAdjustments = pgTable(
  'payroll_period_adjustments',
  {
    periodKey: text('period_key').notNull(),
    employeeName: text('employee_name').notNull(),
    shiftStartOverride: text('shift_start_override'),
    basicSalaryOverride: doublePrecision('basic_salary_override'),
    dailyRateOverride: doublePrecision('daily_rate_override'),
    latePenaltyOverride: doublePrecision('late_penalty_override'),
    noLateBonusOverride: doublePrecision('no_late_bonus_override'),
    dailyCountOverride: integer('daily_count_override'),
    lateCountOverride: integer('late_count_override'),
    bonusQtyOverride: integer('bonus_qty_override'),
    bonusOverride: doublePrecision('bonus_override'),
    customDesc: text('custom_desc').default(''),
    customQty: integer('custom_qty').default(0),
    customUnitValue: doublePrecision('custom_unit_value').default(0),
    kasbonQty: integer('kasbon_qty').default(0),
    kasbonUnitValue: doublePrecision('kasbon_unit_value').default(0),
    notes: text('notes').default(''),
    updatedAt: timestamp('updated_at', { withTimezone: true }),
  },
  (table) => [
    primaryKey({ columns: [table.periodKey, table.employeeName] }),
  ]
);

export const payrollPaymentStatus = pgTable(
  'payroll_payment_status',
  {
    periodKey: text('period_key').notNull(),
    employeeName: text('employee_name').notNull(),
    isPaid: boolean('is_paid').default(false),
    paidAt: text('paid_at'),
    paymentNote: text('payment_note').default(''),
    updatedAt: timestamp('updated_at', { withTimezone: true }),
  },
  (table) => [
    primaryKey({ columns: [table.periodKey, table.employeeName] }),
  ]
);

// ─── RECIPES & BOM ────────────────────────────────────────────────────────────
export const dimRecipes = pgTable('dim_recipes', {
  recipeId: text('recipe_id').primaryKey(),
  brand: text('brand').notNull(),
  itemName: text('item_name').notNull(),
  canonicalName: text('canonical_name').notNull(),
  category: text('category').notNull(),
  bomSummary: text('bom_summary').notNull(),
  rawFoodCost: doublePrecision('raw_food_cost').notNull(),
  packagingDineIn: doublePrecision('packaging_dine_in').notNull(),
  packagingDelivery: doublePrecision('packaging_delivery').notNull(),
  targetFoodCostPct: doublePrecision('target_food_cost_pct').notNull(),
  isHeroBom: boolean('is_hero_bom').default(false),
  updatedAt: timestamp('updated_at', { withTimezone: true }),
});

export const dimIngredients = pgTable('dim_ingredients', {
  ingredientId: text('ingredient_id').primaryKey(),
  ingredientName: text('ingredient_name'),
  category: text('category'),
  supplierName: text('supplier_name'),
  purchaseUnitLabel: text('purchase_unit_label'),
  purchaseQty: doublePrecision('purchase_qty'),
  baseUnit: text('base_unit'),
  purchasePrice: doublePrecision('purchase_price'),
  yieldPct: doublePrecision('yield_pct'),
  updatedAt: text('updated_at'),
});

export const factRecipeIngredients = pgTable(
  'fact_recipe_ingredients',
  {
    lineId: text('line_id').primaryKey(),
    recipeId: text('recipe_id'),
    ingredientId: text('ingredient_id'),
    componentRole: text('component_role'),
    qtyPerServing: doublePrecision('qty_per_serving'),
    prepNotes: text('prep_notes'),
  },
  (table) => [
    index('idx_recipe_ingredients_recipe').on(table.recipeId),
    index('idx_recipe_ingredients_ing').on(table.ingredientId),
  ]
);

// ─── ORDERS & SALES ───────────────────────────────────────────────────────────
export const factOrders = pgTable(
  'fact_orders',
  {
    dedupId: text('dedup_id').primaryKey(),
    orderId: text('order_id'),
    externalId: text('external_id'),
    shortId: text('short_id'),
    provider: text('provider'),
    brand: text('brand'),
    branch: text('branch'),
    status: text('status'),
    grossAmount: doublePrecision('gross_amount'),
    netPayout: doublePrecision('net_payout'),
    merchantPromoBurn: doublePrecision('merchant_promo_burn'),
    providerPromoBurn: doublePrecision('provider_promo_burn'),
    deliveryFee: doublePrecision('delivery_fee'),
    netSales: doublePrecision('net_sales'),
    netRealizationRate: doublePrecision('net_realization_rate'),
    orderType: text('order_type'),
    mealPrepTimeRaw: text('meal_prep_time_raw'),
    prepTimeMinutes: doublePrecision('prep_time_minutes'),
    kptSlaBreach: boolean('kpt_sla_breach').default(false),
    kptRedAlert: boolean('kpt_red_alert').default(false),
    createdAt: timestamp('created_at', { withTimezone: true }),
    deliveredAt: timestamp('delivered_at', { withTimezone: true }),
    sourceFile: text('source_file'),
    ingestedAt: timestamp('ingested_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index('idx_orders_created_at').on(table.createdAt),
    index('idx_orders_brand_branch').on(table.brand, table.branch),
    index('idx_orders_status').on(table.status),
  ]
);

export const factOrderItems = pgTable(
  'fact_order_items',
  {
    dedupId: text('dedup_id').primaryKey(),
    orderId: text('order_id'),
    externalId: text('external_id'),
    provider: text('provider'),
    brand: text('brand'),
    branch: text('branch'),
    itemName: text('item_name'),
    category: text('category'),
    itemQty: doublePrecision('item_qty'),
    itemPrice: doublePrecision('item_price'),
    totalPrice: doublePrecision('total_price'),
    createdAt: timestamp('created_at', { withTimezone: true }),
    status: text('status'),
    sourceFile: text('source_file'),
    ingestedAt: timestamp('ingested_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index('idx_order_items_order_id').on(table.orderId),
    index('idx_order_items_created_brand').on(table.createdAt, table.brand),
  ]
);

export const dimOrderCancellations = pgTable('dim_order_cancellations', {
  orderId: text('order_id').primaryKey(),
  externalId: text('external_id'),
  shortId: text('short_id'),
  provider: text('provider'),
  brand: text('brand'),
  branch: text('branch'),
  status: text('status'),
  grossAmount: doublePrecision('gross_amount'),
  netPayout: doublePrecision('net_payout'),
  merchantPromoBurn: doublePrecision('merchant_promo_burn'),
  providerPromoBurn: doublePrecision('provider_promo_burn'),
  cancellationReason: text('cancellation_reason'),
  cancelledBy: text('cancelled_by'),
  menuItemsSummary: text('menu_items_summary'),
  itemsOrdered: integer('items_ordered'),
  mealPrepTimeRaw: text('meal_prep_time_raw'),
  prepTimeMinutes: doublePrecision('prep_time_minutes'),
  createdAt: timestamp('created_at', { withTimezone: true }),
  sourceFile: text('source_file'),
});

export const factMarketingSpend = pgTable('fact_marketing_spend', {
  spendId: text('spend_id').primaryKey(),
  spendDate: date('spend_date'),
  channel: text('channel'),
  brand: text('brand'),
  branch: text('branch'),
  campaignName: text('campaign_name'),
  adSpend: doublePrecision('ad_spend'),
  impressions: integer('impressions'),
  clicks: integer('clicks'),
  attributedOrders: integer('attributed_orders'),
  attributedGmv: doublePrecision('attributed_gmv'),
  sourceFile: text('source_file'),
  ingestedAt: timestamp('ingested_at', { withTimezone: true }).defaultNow(),
});

// ─── CATERING ─────────────────────────────────────────────────────────────────
export const cateringCustomers = pgTable('catering_customers', {
  customerId: text('customer_id').primaryKey(),
  customerName: text('customer_name').notNull(),
  category: text('category').notNull(),
  phone: text('phone').default(''),
  deliveryAddress: text('delivery_address').default(''),
  dietaryNotes: text('dietary_notes').default(''),
  defaultDays: text('default_days').default('MON,TUE,WED,THU,FRI'),
  defaultSlot: text('default_slot').default('FLEX'),
  status: text('status').default('active'),
  sheetRawLabel: text('sheet_raw_label').default(''),
  excelComment: text('excel_comment').default(''),
  updatedAt: timestamp('updated_at', { withTimezone: true }),
});

export const cateringPackages = pgTable(
  'catering_packages',
  {
    packageId: text('package_id').primaryKey(),
    customerId: text('customer_id').notNull(),
    packageName: text('package_name').notNull(),
    programType: text('program_type').notNull(),
    totalBoxes: integer('total_boxes').notNull(),
    startDate: text('start_date').notNull(),
    manualLastDate: text('manual_last_date'),
    pricePerBox: doublePrecision('price_per_box').default(45000),
    paymentStatus: text('payment_status').default('paid'),
    sheetNote: text('sheet_note').default(''),
    excelComment: text('excel_comment').default(''),
    status: text('status').default('active'),
    updatedAt: timestamp('updated_at', { withTimezone: true }),
  },
  (table) => [
    index('idx_catering_packages_customer').on(table.customerId),
  ]
);

export const cateringDeliveries = pgTable(
  'catering_deliveries',
  {
    deliveryId: text('delivery_id').primaryKey(),
    customerId: text('customer_id').notNull(),
    packageId: text('package_id').notNull(),
    deliveryDate: text('delivery_date').notNull(),
    mealSlot: text('meal_slot').notNull(),
    status: text('status').notNull(),
    boxQty: integer('box_qty').notNull(),
    menuNote: text('menu_note').default(''),
    rawSheetVal: text('raw_sheet_val').default(''),
    sourceSheet: text('source_sheet').default(''),
    updatedAt: timestamp('updated_at', { withTimezone: true }),
  },
  (table) => [
    index('idx_catering_deliv_date').on(table.deliveryDate),
    index('idx_catering_deliv_customer').on(table.customerId),
    index('idx_catering_deliv_package').on(table.packageId),
  ]
);

// ─── FINANCE & BANK STATEMENTS ────────────────────────────────────────────────
export const factBankStatements = pgTable('fact_bank_statements', {
  statementId: text('statement_id').primaryKey(),
  bankName: text('bank_name'),
  accountNumber: text('account_number'),
  accountName: text('account_name'),
  period: text('period'),
  currency: text('currency'),
  startingBalance: doublePrecision('starting_balance'),
  endingBalance: doublePrecision('ending_balance'),
  totalCr: doublePrecision('total_cr'),
  totalDb: doublePrecision('total_db'),
  txCount: integer('tx_count'),
  fileName: text('file_name'),
  fileType: text('file_type'),
  uploadedAt: timestamp('uploaded_at', { withTimezone: true }).defaultNow(),
});

export const factBankTransactions = pgTable(
  'fact_bank_transactions',
  {
    txId: text('tx_id').primaryKey(),
    statementId: text('statement_id'),
    bankName: text('bank_name'),
    accountNumber: text('account_number'),
    txDate: date('tx_date'),
    description: text('description'),
    rawDescription: text('raw_description'),
    branch: text('branch'),
    txType: text('tx_type'),
    amount: doublePrecision('amount'),
    balance: doublePrecision('balance'),
    category: text('category'),
    subcategory: text('subcategory'),
    categoryType: text('category_type'),
    isManualOverride: boolean('is_manual_override').default(false),
    notes: text('notes'),
  },
  (table) => [
    index('idx_bank_tx_statement').on(table.statementId),
    index('idx_bank_tx_date').on(table.txDate),
    index('idx_bank_tx_category').on(table.category),
  ]
);

export const dimFinanceCategoryRules = pgTable('dim_finance_category_rules', {
  ruleId: text('rule_id').primaryKey(),
  pattern: text('pattern'),
  txType: text('tx_type'),
  category: text('category'),
  subcategory: text('subcategory'),
  priority: integer('priority').default(1),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});
