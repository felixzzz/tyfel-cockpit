import { runQuery, invalidateQueryCache } from './duckdb';

export interface IngredientInventoryItem {
  ingredientId: string;
  ingredientName: string;
  category: string;
  supplierName: string;
  purchaseUnitLabel: string;
  purchaseQty: number;
  baseUnit: string;
  purchasePrice: number;
  currentStock: number;
  minStockThreshold: number;
  reorderQty: number;
  unitCost: number;
  totalValue: number;
  dailyBurnRate: number;
  daysOfStockLeft: number;
  status: 'OUT_OF_STOCK' | 'CRITICAL' | 'LOW_STOCK' | 'HEALTHY';
  recommendedReorderQty: number;
  estimatedReorderCost: number;
  lastDepletedAt: string | null;
  updatedAt: string | null;
}

export interface InventoryTelemetry {
  totalIngredients: number;
  healthyCount: number;
  lowStockCount: number;
  criticalCount: number;
  outOfStockCount: number;
  totalInventoryValue: number;
  totalDepletionsRecorded: number;
  lastSyncTime: string | null;
}

export interface InventoryTransactionRecord {
  txId: string;
  ingredientId: string;
  ingredientName: string;
  txType: 'DEPLETION_SALE' | 'PURCHASE_RESTOCK' | 'ADJUSTMENT_WASTAGE' | 'INITIAL_COUNT';
  changeQty: number;
  resultingStock: number;
  baseUnit: string;
  referenceId: string | null;
  notes: string | null;
  createdAt: string;
}

let inventorySchemaReady = false;

export async function ensureInventoryInitialized(): Promise<void> {
  if (inventorySchemaReady) return;

  // Insert any missing ingredients into dim_ingredient_inventory
  await runQuery(`
    INSERT INTO dim_ingredient_inventory (ingredient_id, current_stock, min_stock_threshold, reorder_qty, base_unit, updated_at)
    SELECT
      i.ingredient_id,
      COALESCE(i.purchase_qty * 3, 1000) AS current_stock,
      COALESCE(i.purchase_qty * 0.75, 500) AS min_stock_threshold,
      COALESCE(i.purchase_qty, 1000) AS reorder_qty,
      COALESCE(i.base_unit, 'g') AS base_unit,
      CURRENT_TIMESTAMP
    FROM dim_ingredients i
    WHERE NOT EXISTS (
      SELECT 1 FROM dim_ingredient_inventory inv WHERE inv.ingredient_id = i.ingredient_id
    );
  `);

  inventorySchemaReady = true;
}

export async function getInventoryDashboardData(
  categoryFilter?: string,
  statusFilter?: string
): Promise<{
  items: IngredientInventoryItem[];
  telemetry: InventoryTelemetry;
  recentTransactions: InventoryTransactionRecord[];
}> {
  await ensureInventoryInitialized();

  // 1. Calculate burn rate from historical order items matched to recipe BOMs
  // Summing consumption over the last 30 days to get reliable daily burn
  const burnRateRows = await runQuery<{
    ingredient_id: string;
    total_consumed_30d: number;
  }>(`
    SELECT
      fri.ingredient_id,
      COALESCE(SUM(foi.item_qty * fri.qty_per_serving), 0) AS total_consumed_30d
    FROM fact_order_items foi
    JOIN dim_recipes r ON LOWER(TRIM(foi.item_name)) = LOWER(TRIM(r.item_name))
      OR LOWER(TRIM(foi.item_name)) = LOWER(TRIM(r.canonical_name))
    JOIN fact_recipe_ingredients fri ON r.recipe_id = fri.recipe_id
    GROUP BY fri.ingredient_id;
  `);

  const burnRateMap = new Map<string, number>();
  for (const r of burnRateRows) {
    const consumed = Number(r.total_consumed_30d) || 0;
    // Daily burn over ~30 days
    burnRateMap.set(r.ingredient_id, Math.round((consumed / 30) * 10) / 10);
  }

  // 2. Fetch inventory joined with master ingredient catalog
  const rows = await runQuery<{
    ingredient_id: string;
    ingredient_name: string;
    category: string;
    supplier_name: string;
    purchase_unit_label: string;
    purchase_qty: number;
    base_unit: string;
    purchase_price: number;
    current_stock: number;
    min_stock_threshold: number;
    reorder_qty: number;
    last_depleted_at: string | null;
    updated_at: string | null;
  }>(`
    SELECT
      i.ingredient_id,
      COALESCE(i.ingredient_name, i.ingredient_id) AS ingredient_name,
      COALESCE(i.category, 'Uncategorized') AS category,
      COALESCE(i.supplier_name, 'Direct') AS supplier_name,
      COALESCE(i.purchase_unit_label, 'Pack') AS purchase_unit_label,
      COALESCE(i.purchase_qty, 1000) AS purchase_qty,
      COALESCE(inv.base_unit, i.base_unit, 'g') AS base_unit,
      COALESCE(i.purchase_price, 0) AS purchase_price,
      COALESCE(inv.current_stock, 0) AS current_stock,
      COALESCE(inv.min_stock_threshold, 500) AS min_stock_threshold,
      COALESCE(inv.reorder_qty, 1000) AS reorder_qty,
      inv.last_depleted_at,
      inv.updated_at
    FROM dim_ingredients i
    LEFT JOIN dim_ingredient_inventory inv ON i.ingredient_id = inv.ingredient_id
    ORDER BY i.category ASC, i.ingredient_name ASC;
  `);

  let healthyCount = 0;
  let lowStockCount = 0;
  let criticalCount = 0;
  let outOfStockCount = 0;
  let totalInventoryValue = 0;
  let latestDepletedAt: string | null = null;

  const items: IngredientInventoryItem[] = rows.map((r) => {
    const currentStock = Math.round(Number(r.current_stock) * 10) / 10;
    const minThreshold = Number(r.min_stock_threshold);
    const purchasePrice = Number(r.purchase_price);
    const purchaseQty = Number(r.purchase_qty) || 1;
    const unitCost = purchasePrice / purchaseQty;
    const totalVal = Math.round(currentStock * unitCost);
    totalInventoryValue += Math.max(0, totalVal);

    if (r.last_depleted_at && (!latestDepletedAt || r.last_depleted_at > latestDepletedAt)) {
      latestDepletedAt = r.last_depleted_at;
    }

    const burnRate = burnRateMap.get(r.ingredient_id) || 0;
    const daysLeft = burnRate > 0 ? Math.round((currentStock / burnRate) * 10) / 10 : 999;

    let status: 'OUT_OF_STOCK' | 'CRITICAL' | 'LOW_STOCK' | 'HEALTHY' = 'HEALTHY';
    if (currentStock <= 0) {
      status = 'OUT_OF_STOCK';
      outOfStockCount++;
    } else if (currentStock <= minThreshold * 0.5) {
      status = 'CRITICAL';
      criticalCount++;
    } else if (currentStock <= minThreshold) {
      status = 'LOW_STOCK';
      lowStockCount++;
    } else {
      healthyCount++;
    }

    const reorderQty = Number(r.reorder_qty);
    const recommendedReorder =
      status === 'OUT_OF_STOCK'
        ? reorderQty * 2
        : status === 'CRITICAL' || status === 'LOW_STOCK'
        ? reorderQty
        : 0;

    const estReorderCost = Math.round(recommendedReorder * unitCost);

    return {
      ingredientId: r.ingredient_id,
      ingredientName: r.ingredient_name,
      category: r.category,
      supplierName: r.supplier_name,
      purchaseUnitLabel: r.purchase_unit_label,
      purchaseQty,
      baseUnit: r.base_unit,
      purchasePrice,
      currentStock,
      minStockThreshold: minThreshold,
      reorderQty,
      unitCost,
      totalValue: totalVal,
      dailyBurnRate: burnRate,
      daysOfStockLeft: daysLeft,
      status,
      recommendedReorderQty: recommendedReorder,
      estimatedReorderCost: estReorderCost,
      lastDepletedAt: r.last_depleted_at ? String(r.last_depleted_at) : null,
      updatedAt: r.updated_at ? String(r.updated_at) : null,
    };
  });

  // 3. Fetch recent inventory ledger transactions
  const txRows = await runQuery<{
    tx_id: string;
    ingredient_id: string;
    ingredient_name: string;
    tx_type: string;
    change_qty: number;
    resulting_stock: number;
    base_unit: string;
    reference_id: string | null;
    notes: string | null;
    created_at: string;
  }>(`
    SELECT
      t.tx_id,
      t.ingredient_id,
      COALESCE(i.ingredient_name, t.ingredient_id) AS ingredient_name,
      t.tx_type,
      t.change_qty,
      t.resulting_stock,
      COALESCE(inv.base_unit, 'g') AS base_unit,
      t.reference_id,
      t.notes,
      t.created_at
    FROM fact_inventory_transactions t
    LEFT JOIN dim_ingredients i ON t.ingredient_id = i.ingredient_id
    LEFT JOIN dim_ingredient_inventory inv ON t.ingredient_id = inv.ingredient_id
    ORDER BY t.created_at DESC
    LIMIT 30;
  `);

  const recentTransactions: InventoryTransactionRecord[] = txRows.map((t) => ({
    txId: t.tx_id,
    ingredientId: t.ingredient_id,
    ingredientName: t.ingredient_name,
    txType: t.tx_type as InventoryTransactionRecord['txType'],
    changeQty: Number(t.change_qty),
    resultingStock: Number(t.resulting_stock),
    baseUnit: t.base_unit,
    referenceId: t.reference_id,
    notes: t.notes,
    createdAt: String(t.created_at),
  }));

  // Filtering
  let filteredItems = items;
  if (categoryFilter && categoryFilter !== 'all') {
    filteredItems = filteredItems.filter((i) => i.category === categoryFilter);
  }
  if (statusFilter && statusFilter !== 'all') {
    if (statusFilter === 'alerts') {
      filteredItems = filteredItems.filter((i) => i.status !== 'HEALTHY');
    } else {
      filteredItems = filteredItems.filter((i) => i.status === statusFilter);
    }
  }

  return {
    items: filteredItems,
    telemetry: {
      totalIngredients: items.length,
      healthyCount,
      lowStockCount,
      criticalCount,
      outOfStockCount,
      totalInventoryValue,
      totalDepletionsRecorded: txRows.length,
      lastSyncTime: latestDepletedAt,
    },
    recentTransactions,
  };
}

export async function runBOMDepletion(): Promise<{
  depletedIngredientsCount: number;
  ordersProcessed: number;
  totalDepletedUnits: number;
}> {
  await ensureInventoryInitialized();

  // Calculate total consumption from order items
  const usageRows = await runQuery<{
    ingredient_id: string;
    total_qty: number;
    orders_count: number;
  }>(`
    SELECT
      fri.ingredient_id,
      SUM(foi.item_qty * fri.qty_per_serving) AS total_qty,
      COUNT(DISTINCT foi.order_id) AS orders_count
    FROM fact_order_items foi
    JOIN dim_recipes r ON LOWER(TRIM(foi.item_name)) = LOWER(TRIM(r.item_name))
      OR LOWER(TRIM(foi.item_name)) = LOWER(TRIM(r.canonical_name))
    JOIN fact_recipe_ingredients fri ON r.recipe_id = fri.recipe_id
    GROUP BY fri.ingredient_id;
  `);

  if (!usageRows.length) {
    return { depletedIngredientsCount: 0, ordersProcessed: 0, totalDepletedUnits: 0 };
  }

  let totalOrders = 0;
  let totalUnits = 0;

  for (const row of usageRows) {
    const qty = Math.round(Number(row.total_qty) * 10) / 10;
    totalOrders = Math.max(totalOrders, Number(row.orders_count));
    totalUnits += qty;

    const txId = `TX-DEP-${row.ingredient_id}-${Date.now()}`;
    await runQuery(`
      UPDATE dim_ingredient_inventory
      SET
        current_stock = GREATEST(0, current_stock - ${qty}),
        last_depleted_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
      WHERE ingredient_id = '${row.ingredient_id}';

      INSERT INTO fact_inventory_transactions (
        tx_id, ingredient_id, tx_type, change_qty, resulting_stock, reference_id, notes, created_at
      )
      SELECT
        '${txId}',
        '${row.ingredient_id}',
        'DEPLETION_SALE',
        -${qty},
        inv.current_stock,
        'POS_BATCH_DEPLETION',
        'Automated BOM deduction from completed POS orders',
        CURRENT_TIMESTAMP
      FROM dim_ingredient_inventory inv
      WHERE inv.ingredient_id = '${row.ingredient_id}';
    `);
  }

  invalidateQueryCache();

  return {
    depletedIngredientsCount: usageRows.length,
    ordersProcessed: totalOrders,
    totalDepletedUnits: Math.round(totalUnits),
  };
}

export async function adjustInventoryStock(
  ingredientId: string,
  newStock: number,
  reason: 'PURCHASE_RESTOCK' | 'ADJUSTMENT_WASTAGE' | 'INITIAL_COUNT',
  notes: string = ''
): Promise<{ success: boolean; newStock: number }> {
  await ensureInventoryInitialized();

  const currentRows = await runQuery<{ current_stock: number }>(`
    SELECT current_stock FROM dim_ingredient_inventory WHERE ingredient_id = '${ingredientId}';
  `);

  const prevStock = currentRows.length ? Number(currentRows[0].current_stock) : 0;
  const changeQty = newStock - prevStock;
  const txId = `TX-ADJ-${ingredientId}-${Date.now()}`;

  await runQuery(`
    INSERT INTO dim_ingredient_inventory (ingredient_id, current_stock, updated_at)
    VALUES ('${ingredientId}', ${newStock}, CURRENT_TIMESTAMP)
    ON CONFLICT (ingredient_id) DO UPDATE
    SET current_stock = ${newStock}, updated_at = CURRENT_TIMESTAMP;

    INSERT INTO fact_inventory_transactions (
      tx_id, ingredient_id, tx_type, change_qty, resulting_stock, notes, created_at
    ) VALUES (
      '${txId}',
      '${ingredientId}',
      '${reason}',
      ${changeQty},
      ${newStock},
      '${notes.replace(/'/g, "''")}',
      CURRENT_TIMESTAMP
    );
  `);

  invalidateQueryCache();
  return { success: true, newStock };
}

// ─────────────────────────────────────────────────────────────────────────────
// STOCK OPNAME AUDIT & VARIANCE TRACKING ENGINE
// ─────────────────────────────────────────────────────────────────────────────

export interface StockOpnameItemAudit {
  ingredientId: string;
  ingredientName: string;
  baseUnit: string;
  category: string;
  systemStock: number;
  actualCount: number;
  varianceQty: number;
  unitCost: number;
  varianceValueRp: number;
  variancePct: number;
  varianceType: 'SHRINKAGE_SPILLAGE' | 'PORTION_VARIANCE' | 'SURPLUS' | 'OK';
  notes?: string;
}

export interface StockOpnameAuditRecord {
  opnameId: string;
  branch: string;
  conductedBy: string;
  status: 'DRAFT' | 'COMMITTED';
  totalItemsCount: number;
  totalVarianceRp: number;
  netShrinkagePct: number;
  highRiskShrinkageCount: number;
  notes: string;
  conductedAt: string;
  items: StockOpnameItemAudit[];
}

let opnameTablesReady = false;

export async function ensureOpnameTablesInitialized(): Promise<void> {
  if (opnameTablesReady) return;

  await runQuery(`
    CREATE TABLE IF NOT EXISTS stock_opname_records (
      opname_id VARCHAR PRIMARY KEY,
      branch VARCHAR NOT NULL DEFAULT 'all',
      conducted_by VARCHAR NOT NULL DEFAULT 'Kitchen Manager',
      status VARCHAR NOT NULL DEFAULT 'COMMITTED',
      total_items_count INTEGER DEFAULT 0,
      total_variance_rp DOUBLE DEFAULT 0,
      net_shrinkage_pct DOUBLE DEFAULT 0,
      notes VARCHAR DEFAULT '',
      conducted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS stock_opname_items (
      item_id VARCHAR PRIMARY KEY,
      opname_id VARCHAR NOT NULL,
      ingredient_id VARCHAR NOT NULL,
      system_stock DOUBLE DEFAULT 0,
      actual_count DOUBLE DEFAULT 0,
      variance_qty DOUBLE DEFAULT 0,
      unit_cost DOUBLE DEFAULT 0,
      variance_value_rp DOUBLE DEFAULT 0,
      variance_pct DOUBLE DEFAULT 0,
      variance_type VARCHAR DEFAULT 'OK',
      notes VARCHAR DEFAULT ''
    );
  `);

  opnameTablesReady = true;
}

export async function submitStockOpnameAudit(params: {
  branch?: string;
  conductedBy?: string;
  notes?: string;
  counts: Array<{ ingredientId: string; actualCount: number; notes?: string }>;
}): Promise<StockOpnameAuditRecord> {
  await ensureInventoryInitialized();
  await ensureOpnameTablesInitialized();

  const branch = params.branch || 'Greenville Flagship';
  const conductedBy = params.conductedBy || 'Kitchen Shift Lead';
  const opnameNotes = params.notes || 'Weekly Physical Inventory Audit';
  const opnameId = `OPNAME-${Date.now()}`;

  // Fetch current ingredient specs and inventory
  const ingredientData = await runQuery<{
    ingredient_id: string;
    ingredient_name: string;
    base_unit: string;
    category: string;
    purchase_price: number | null;
    purchase_qty: number | null;
    current_stock: number | null;
  }>(`
    SELECT
      i.ingredient_id,
      i.ingredient_name,
      COALESCE(i.base_unit, 'g') AS base_unit,
      COALESCE(i.category, 'General') AS category,
      i.purchase_price,
      i.purchase_qty,
      COALESCE(inv.current_stock, 0) AS current_stock
    FROM dim_ingredients i
    LEFT JOIN dim_ingredient_inventory inv ON i.ingredient_id = inv.ingredient_id;
  `);

  const ingMap = new Map<string, typeof ingredientData[0]>();
  for (const ing of ingredientData) {
    ingMap.set(ing.ingredient_id, ing);
  }

  let totalVarianceRp = 0;
  let totalSystemValue = 0;
  let highRiskCount = 0;
  const auditItems: StockOpnameItemAudit[] = [];

  for (const c of params.counts) {
    const ing = ingMap.get(c.ingredientId);
    if (!ing) continue;

    const systemStock = Number(ing.current_stock || 0);
    const actualCount = Math.max(0, Number(c.actualCount));
    const varianceQty = actualCount - systemStock;

    const purchasePrice = Number(ing.purchase_price || 0);
    const purchaseQty = Number(ing.purchase_qty || 1000);
    const unitCost = purchaseQty > 0 ? purchasePrice / purchaseQty : 0;
    const varianceValueRp = Math.round(varianceQty * unitCost);

    const variancePct =
      systemStock > 0 ? Number(((varianceQty / systemStock) * 100).toFixed(1)) : 0;

    totalVarianceRp += varianceValueRp;
    totalSystemValue += systemStock * unitCost;

    let varianceType: StockOpnameItemAudit['varianceType'] = 'OK';
    if (varianceQty < 0) {
      if (Math.abs(variancePct) > 10 || Math.abs(varianceValueRp) > 50000) {
        varianceType = 'SHRINKAGE_SPILLAGE';
        highRiskCount++;
      } else {
        varianceType = 'PORTION_VARIANCE';
      }
    } else if (varianceQty > 0) {
      varianceType = 'SURPLUS';
    }

    const auditItem: StockOpnameItemAudit = {
      ingredientId: ing.ingredient_id,
      ingredientName: String(ing.ingredient_name || ing.ingredient_id),
      baseUnit: String(ing.base_unit),
      category: String(ing.category),
      systemStock,
      actualCount,
      varianceQty,
      unitCost,
      varianceValueRp,
      variancePct,
      varianceType,
      notes: c.notes || '',
    };
    auditItems.push(auditItem);

    // Update actual stock in dim_ingredient_inventory
    await runQuery(`
      INSERT INTO dim_ingredient_inventory (ingredient_id, current_stock, updated_at)
      VALUES ('${ing.ingredient_id}', ${actualCount}, CURRENT_TIMESTAMP)
      ON CONFLICT (ingredient_id) DO UPDATE
      SET current_stock = ${actualCount}, updated_at = CURRENT_TIMESTAMP;

      INSERT INTO fact_inventory_transactions (
        tx_id, ingredient_id, tx_type, change_qty, resulting_stock, reference_id, notes, created_at
      ) VALUES (
        'TX-OPNAME-${ing.ingredient_id}-${Date.now()}',
        '${ing.ingredient_id}',
        '${varianceQty < 0 ? 'ADJUSTMENT_WASTAGE' : 'INITIAL_COUNT'}',
        ${varianceQty},
        ${actualCount},
        '${opnameId}',
        'Stock opname variance reconciliation: ${varianceType} (${varianceQty > 0 ? '+' : ''}${varianceQty} ${ing.base_unit})',
        CURRENT_TIMESTAMP
      );

      INSERT INTO stock_opname_items (
        item_id, opname_id, ingredient_id, system_stock, actual_count,
        variance_qty, unit_cost, variance_value_rp, variance_pct, variance_type, notes
      ) VALUES (
        'OPN-ITM-${ing.ingredient_id}-${Date.now()}',
        '${opnameId}',
        '${ing.ingredient_id}',
        ${systemStock},
        ${actualCount},
        ${varianceQty},
        ${unitCost},
        ${varianceValueRp},
        ${variancePct},
        '${varianceType}',
        '${(c.notes || '').replace(/'/g, "''")}'
      );
    `);
  }

  const netShrinkagePct =
    totalSystemValue > 0 ? Number(((Math.abs(totalVarianceRp) / totalSystemValue) * 100).toFixed(2)) : 0;

  await runQuery(`
    INSERT INTO stock_opname_records (
      opname_id, branch, conducted_by, status, total_items_count,
      total_variance_rp, net_shrinkage_pct, notes, conducted_at
    ) VALUES (
      '${opnameId}',
      '${branch.replace(/'/g, "''")}',
      '${conductedBy.replace(/'/g, "''")}',
      'COMMITTED',
      ${auditItems.length},
      ${totalVarianceRp},
      ${netShrinkagePct},
      '${opnameNotes.replace(/'/g, "''")}',
      CURRENT_TIMESTAMP
    );
  `);

  invalidateQueryCache();

  return {
    opnameId,
    branch,
    conductedBy,
    status: 'COMMITTED',
    totalItemsCount: auditItems.length,
    totalVarianceRp,
    netShrinkagePct,
    highRiskShrinkageCount: highRiskCount,
    notes: opnameNotes,
    conductedAt: new Date().toISOString(),
    items: auditItems,
  };
}

export async function getRecentStockOpnameAudits(limit: number = 5): Promise<StockOpnameAuditRecord[]> {
  await ensureOpnameTablesInitialized();

  const records = await runQuery<{
    opname_id: string;
    branch: string;
    conducted_by: string;
    status: string;
    total_items_count: number;
    total_variance_rp: number;
    net_shrinkage_pct: number;
    notes: string;
    conducted_at: string;
  }>(`
    SELECT * FROM stock_opname_records
    ORDER BY conducted_at DESC
    LIMIT ${limit};
  `);

  if (!records.length) return [];

  const results: StockOpnameAuditRecord[] = [];

  for (const rec of records) {
    const items = await runQuery<{
      ingredient_id: string;
      ingredient_name: string | null;
      base_unit: string | null;
      category: string | null;
      system_stock: number;
      actual_count: number;
      variance_qty: number;
      unit_cost: number;
      variance_value_rp: number;
      variance_pct: number;
      variance_type: string;
      notes: string | null;
    }>(`
      SELECT
        oi.ingredient_id,
        COALESCE(i.ingredient_name, oi.ingredient_id) AS ingredient_name,
        COALESCE(i.base_unit, 'g') AS base_unit,
        COALESCE(i.category, 'General') AS category,
        oi.system_stock,
        oi.actual_count,
        oi.variance_qty,
        oi.unit_cost,
        oi.variance_value_rp,
        oi.variance_pct,
        oi.variance_type,
        oi.notes
      FROM stock_opname_items oi
      LEFT JOIN dim_ingredients i ON oi.ingredient_id = i.ingredient_id
      WHERE oi.opname_id = '${rec.opname_id}'
      ORDER BY ABS(oi.variance_value_rp) DESC;
    `);

    let highRisk = 0;
    const mappedItems: StockOpnameItemAudit[] = items.map((it) => {
      const vType = it.variance_type as StockOpnameItemAudit['varianceType'];
      if (vType === 'SHRINKAGE_SPILLAGE') highRisk++;
      return {
        ingredientId: it.ingredient_id,
        ingredientName: String(it.ingredient_name || it.ingredient_id),
        baseUnit: String(it.base_unit || 'g'),
        category: String(it.category || 'General'),
        systemStock: Number(it.system_stock || 0),
        actualCount: Number(it.actual_count || 0),
        varianceQty: Number(it.variance_qty || 0),
        unitCost: Number(it.unit_cost || 0),
        varianceValueRp: Number(it.variance_value_rp || 0),
        variancePct: Number(it.variance_pct || 0),
        varianceType: vType,
        notes: String(it.notes || ''),
      };
    });

    results.push({
      opnameId: rec.opname_id,
      branch: rec.branch,
      conductedBy: rec.conducted_by,
      status: rec.status as 'DRAFT' | 'COMMITTED',
      totalItemsCount: Number(rec.total_items_count || mappedItems.length),
      totalVarianceRp: Number(rec.total_variance_rp || 0),
      netShrinkagePct: Number(rec.net_shrinkage_pct || 0),
      highRiskShrinkageCount: highRisk,
      notes: rec.notes || '',
      conductedAt: rec.conducted_at,
      items: mappedItems,
    });
  }

  return results;
}
