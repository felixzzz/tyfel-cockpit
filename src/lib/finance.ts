// Tyfel Hub · Financial Statement & Bank Reconciliation Engine
import fs from 'fs';
import path from 'path';
import { invalidateQueryCache, runQuery } from './duckdb';
import {
  ParsedBankStatement,
  parseBcaCsv,
  parseBcaPdfText,
  parsePaninPdfText,
} from './finance-parser';
import { FINANCE_CATEGORIES, FinanceCategoryType } from './finance-categories';

let schemaInitialized = false;

export async function ensureFinanceSchema(): Promise<void> {
  if (schemaInitialized) return;

  await runQuery(`
    CREATE TABLE IF NOT EXISTS fact_bank_statements (
      statement_id VARCHAR PRIMARY KEY,
      bank_name VARCHAR,
      account_number VARCHAR,
      account_name VARCHAR,
      period VARCHAR,
      currency VARCHAR,
      starting_balance DOUBLE,
      ending_balance DOUBLE,
      total_cr DOUBLE,
      total_db DOUBLE,
      tx_count INTEGER,
      file_name VARCHAR,
      file_type VARCHAR,
      uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await runQuery(`
    CREATE TABLE IF NOT EXISTS fact_bank_transactions (
      tx_id VARCHAR PRIMARY KEY,
      statement_id VARCHAR,
      bank_name VARCHAR,
      account_number VARCHAR,
      tx_date DATE,
      description VARCHAR,
      raw_description VARCHAR,
      branch VARCHAR,
      tx_type VARCHAR,
      amount DOUBLE,
      balance DOUBLE,
      category VARCHAR,
      subcategory VARCHAR,
      category_type VARCHAR,
      is_manual_override BOOLEAN DEFAULT FALSE,
      notes VARCHAR
    );
  `);

  await runQuery(`
    CREATE TABLE IF NOT EXISTS dim_finance_category_rules (
      rule_id VARCHAR PRIMARY KEY,
      pattern VARCHAR,
      tx_type VARCHAR,
      category VARCHAR,
      subcategory VARCHAR,
      priority INTEGER DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  schemaInitialized = true;
}

// ─── INGESTION & STORAGE ─────────────────────────────────────────────────────

export async function storeBankStatement(
  statement: ParsedBankStatement,
  fileName: string,
  fileType: string
): Promise<{ statementId: string; txCount: number }> {
  await ensureFinanceSchema();

  const statementId = `${statement.bankName}-${statement.accountNumber.replace(/[^A-Za-z0-9]/g, '')}-${statement.period.replace('-', '')}`;

  // Upsert statement record
  await runQuery(`DELETE FROM fact_bank_statements WHERE statement_id = '${statementId}';`);
  await runQuery(`DELETE FROM fact_bank_transactions WHERE statement_id = '${statementId}';`);

  const insStmt = `
    INSERT INTO fact_bank_statements (
      statement_id, bank_name, account_number, account_name, period,
      currency, starting_balance, ending_balance, total_cr, total_db,
      tx_count, file_name, file_type, uploaded_at
    ) VALUES (
      '${statementId}',
      '${statement.bankName}',
      '${statement.accountNumber}',
      '${statement.accountName.replace(/'/g, "''")}',
      '${statement.period}',
      '${statement.currency}',
      ${statement.startingBalance},
      ${statement.endingBalance},
      ${statement.totalCr},
      ${statement.totalDb},
      ${statement.transactions.length},
      '${fileName.replace(/'/g, "''")}',
      '${fileType}',
      CURRENT_TIMESTAMP
    );
  `;
  await runQuery(insStmt);

  // Batch insert transactions in chunks of 50
  const chunkSize = 50;
  for (let i = 0; i < statement.transactions.length; i += chunkSize) {
    const chunk = statement.transactions.slice(i, i + chunkSize);
    const valueClauses = chunk.map((tx, relIdx) => {
      const idx = i + relIdx;
      const txId = `${statementId}-${String(idx + 1).padStart(5, '0')}`;
      const escapedDesc = tx.description.replace(/'/g, "''");
      const escapedRaw = tx.rawDescription.replace(/'/g, "''");
      const escapedBranch = tx.branch.replace(/'/g, "''");
      const escapedCat = tx.category.replace(/'/g, "''");
      const escapedSub = tx.subcategory.replace(/'/g, "''");

      return `(
        '${txId}',
        '${statementId}',
        '${statement.bankName}',
        '${statement.accountNumber}',
        DATE '${txDateToIso(tx.txDate)}',
        '${escapedDesc}',
        '${escapedRaw}',
        '${escapedBranch}',
        '${tx.txType}',
        ${tx.amount},
        ${tx.balance},
        '${escapedCat}',
        '${escapedSub}',
        '${tx.categoryType}',
        FALSE
      )`;
    });

    await runQuery(`
      INSERT INTO fact_bank_transactions (
        tx_id, statement_id, bank_name, account_number, tx_date,
        description, raw_description, branch, tx_type, amount, balance,
        category, subcategory, category_type, is_manual_override
      ) VALUES ${valueClauses.join(', ')};
    `);
  }

  invalidateQueryCache();
  return { statementId, txCount: statement.transactions.length };
}

function txDateToIso(dateStr: string): string {
  if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) return dateStr;
  const parts = dateStr.split('/');
  if (parts.length === 3) {
    return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
  }
  return dateStr;
}

// ─── QUERY FINANCIAL REPORT / STATEMENTS ─────────────────────────────────────

export interface FinancialMetric {
  category: string;
  type: FinanceCategoryType;
  totalAmount: number;
  pctOfRevenue: number;
  itemCount: number;
  subcategories: { subcategory: string; amount: number; count: number }[];
}

export interface FinancialStatementReport {
  period: string;
  startDate: string;
  endDate: string;
  bankFilter: string;
  summary: {
    grossRevenue: number;
    totalCogs: number;
    grossProfit: number;
    grossMarginPct: number;
    totalOpex: number;
    operatingProfit: number; // EBITDA
    operatingMarginPct: number;
    totalBankCredits: number;
    totalBankDebits: number;
    nonOpInflow: number;
    nonOpOutflow: number;
    nonOperatingNet: number; // Inflows minus Outflows
    netCashMovement: number;
  };
  revenueBreakdown: FinancialMetric[];
  cogsBreakdown: FinancialMetric[];
  opexBreakdown: FinancialMetric[];
  nonOpBreakdown: FinancialMetric[];
  accountBalances: {
    bankName: string;
    accountNumber: string;
    accountName: string;
    period: string;
    startingBalance: number;
    totalCr: number;
    totalDb: number;
    endingBalance: number;
    calculatedNet: number;
    isReconciled: boolean;
  }[];
  monthlyTrend: {
    period: string;
    revenue: number;
    cogs: number;
    grossProfit: number;
    opex: number;
    netProfit: number;
  }[];
}

export interface SmartReconciliationMatch {
  matchId: string;
  txId: string;
  txDate: string;
  bankName: string;
  description: string;
  bankAmount: number;
  expectedSource: string;
  expectedDate: string;
  expectedAmount: number;
  varianceRp: number;
  variancePct: number;
  confidence: 'PERFECT' | 'HIGH_PROBABLE' | 'TIMING_LAG';
  notes: string;
}

export interface UnmatchedBankDeposit {
  txId: string;
  txDate: string;
  bankName: string;
  description: string;
  amount: number;
  category: string;
  subcategory: string;
}

export interface UnmatchedPosPayout {
  date: string;
  provider: string;
  brand: string;
  orderCount: number;
  expectedNetPayout: number;
  status: 'PENDING_BANK_DEPOSIT' | 'LEAKAGE_RISK';
}

export interface SmartBankReconciliationReport {
  summary: {
    totalBankCredits: number;
    reconciledAmount: number;
    reconciliationRate: number;
    matchedCount: number;
    unmatchedBankCount: number;
    unmatchedBankAmount: number;
    unmatchedPosCount: number;
    unmatchedPosAmount: number;
  };
  matches: SmartReconciliationMatch[];
  unmatchedBank: UnmatchedBankDeposit[];
  unmatchedPos: UnmatchedPosPayout[];
}

export async function getFinancialStatementReport(filters?: {
  period?: string;
  bank?: string;
  startDate?: string;
  endDate?: string;
}): Promise<FinancialStatementReport> {
  await ensureFinanceSchema();
  await seedIfEmpty();

  const whereClauses: string[] = ['1=1'];
  if (filters?.bank && filters.bank !== 'all') {
    whereClauses.push(`bank_name = '${filters.bank}'`);
  }
  if (filters?.period && filters.period !== 'all') {
    whereClauses.push(`strftime(tx_date, '%Y-%m') = '${filters.period}'`);
  }
  if (filters?.startDate) {
    whereClauses.push(`tx_date >= DATE '${filters.startDate}'`);
  }
  if (filters?.endDate) {
    whereClauses.push(`tx_date <= DATE '${filters.endDate}'`);
  }

  const whereSql = whereClauses.join(' AND ');

  // Query transactions aggregated by category & subcategory
  const catRows = await runQuery<{
    category: string;
    subcategory: string;
    category_type: string;
    tx_type: string;
    total_amount: number;
    tx_count: number;
  }>(`
    SELECT
      category,
      subcategory,
      category_type,
      tx_type,
      SUM(amount) as total_amount,
      COUNT(*) as tx_count
    FROM fact_bank_transactions
    WHERE ${whereSql}
    GROUP BY category, subcategory, category_type, tx_type
    ORDER BY total_amount DESC;
  `);

  // Calculate high level totals
  let grossRevenue = 0;
  let totalCogs = 0;
  let totalOpex = 0;
  let nonOpInflow = 0;
  let nonOpOutflow = 0;

  const revMap = new Map<string, FinancialMetric>();
  const cogsMap = new Map<string, FinancialMetric>();
  const opexMap = new Map<string, FinancialMetric>();
  const nonOpMap = new Map<string, FinancialMetric>();

  for (const row of catRows) {
    const amt = Number(row.total_amount) || 0;
    const cnt = Number(row.tx_count) || 0;
    const catType = row.category_type as FinanceCategoryType;

    let targetMap = opexMap;
    if (catType === 'REVENUE') {
      targetMap = revMap;
      grossRevenue += amt;
    } else if (catType === 'COGS') {
      targetMap = cogsMap;
      totalCogs += amt;
    } else if (catType === 'OPEX') {
      targetMap = opexMap;
      totalOpex += amt;
    } else {
      targetMap = nonOpMap;
      if (row.tx_type === 'CR') {
        nonOpInflow += amt;
      } else {
        nonOpOutflow += amt;
      }
    }

    if (!targetMap.has(row.category)) {
      targetMap.set(row.category, {
        category: row.category,
        type: catType,
        totalAmount: 0,
        pctOfRevenue: 0,
        itemCount: 0,
        subcategories: [],
      });
    }

    const metric = targetMap.get(row.category)!;
    metric.totalAmount += amt;
    metric.itemCount += cnt;
    metric.subcategories.push({
      subcategory: row.subcategory || 'General',
      amount: amt,
      count: cnt,
    });
  }

  // Calculate percentages
  const calcPcts = (metrics: FinancialMetric[]) => {
    metrics.forEach((m) => {
      m.pctOfRevenue = grossRevenue > 0 ? (m.totalAmount / grossRevenue) * 100 : 0;
    });
    return metrics.sort((a, b) => b.totalAmount - a.totalAmount);
  };

  const revenueBreakdown = calcPcts(Array.from(revMap.values()));
  const cogsBreakdown = calcPcts(Array.from(cogsMap.values()));
  const opexBreakdown = calcPcts(Array.from(opexMap.values()));
  const nonOpBreakdown = calcPcts(Array.from(nonOpMap.values()));

  const grossProfit = grossRevenue - totalCogs;
  const grossMarginPct = grossRevenue > 0 ? (grossProfit / grossRevenue) * 100 : 0;
  const operatingProfit = grossProfit - totalOpex;
  const operatingMarginPct = grossRevenue > 0 ? (operatingProfit / grossRevenue) * 100 : 0;
  const nonOperatingNet = nonOpInflow - nonOpOutflow;
  const totalBankCredits = grossRevenue + nonOpInflow;
  const totalBankDebits = totalCogs + totalOpex + nonOpOutflow;
  const netCashMovement = totalBankCredits - totalBankDebits;

  // Query Account Balances & Reconciliation
  const stmtRows = await runQuery<{
    bank_name: string;
    account_number: string;
    account_name: string;
    period: string;
    starting_balance: number;
    ending_balance: number;
    total_cr: number;
    total_db: number;
  }>(`
    SELECT
      bank_name, account_number, account_name, period,
      starting_balance, ending_balance, total_cr, total_db
    FROM fact_bank_statements
    ${filters?.bank && filters.bank !== 'all' ? `WHERE bank_name = '${filters.bank}'` : ''}
    ORDER BY period DESC, bank_name ASC;
  `);

  const accountBalances = stmtRows.map((s) => {
    const calcNet = Number(s.total_cr) - Number(s.total_db);
    const expectedEnd = Number(s.starting_balance) + calcNet;
    const diff = Math.abs(expectedEnd - Number(s.ending_balance));
    return {
      bankName: s.bank_name,
      accountNumber: s.account_number,
      accountName: s.account_name,
      period: s.period,
      startingBalance: Number(s.starting_balance),
      totalCr: Number(s.total_cr),
      totalDb: Number(s.total_db),
      endingBalance: Number(s.ending_balance),
      calculatedNet: calcNet,
      isReconciled: diff < 100, // Within rounding
    };
  });

  // Query Monthly Trends
  const trendRows = await runQuery<{
    period: string;
    category_type: string;
    amount: number;
  }>(`
    SELECT
      strftime(tx_date, '%Y-%m') as period,
      category_type,
      SUM(amount) as amount
    FROM fact_bank_transactions
    ${filters?.bank && filters.bank !== 'all' ? `WHERE bank_name = '${filters.bank}'` : ''}
    GROUP BY strftime(tx_date, '%Y-%m'), category_type
    ORDER BY period ASC;
  `);

  const monthlyMap = new Map<string, { period: string; revenue: number; cogs: number; grossProfit: number; opex: number; netProfit: number }>();
  for (const row of trendRows) {
    if (!monthlyMap.has(row.period)) {
      monthlyMap.set(row.period, {
        period: row.period,
        revenue: 0,
        cogs: 0,
        grossProfit: 0,
        opex: 0,
        netProfit: 0,
      });
    }
    const t = monthlyMap.get(row.period)!;
    const a = Number(row.amount) || 0;
    if (row.category_type === 'REVENUE') t.revenue += a;
    else if (row.category_type === 'COGS') t.cogs += a;
    else if (row.category_type === 'OPEX') t.opex += a;
  }

  const monthlyTrend = Array.from(monthlyMap.values()).map((t) => {
    t.grossProfit = t.revenue - t.cogs;
    t.netProfit = t.grossProfit - t.opex;
    return t;
  });

  return {
    period: filters?.period || 'all',
    startDate: filters?.startDate || '',
    endDate: filters?.endDate || '',
    bankFilter: filters?.bank || 'all',
    summary: {
      grossRevenue,
      totalCogs,
      grossProfit,
      grossMarginPct,
      totalOpex,
      operatingProfit,
      operatingMarginPct,
      totalBankCredits,
      totalBankDebits,
      nonOpInflow,
      nonOpOutflow,
      nonOperatingNet,
      netCashMovement,
    },
    revenueBreakdown,
    cogsBreakdown,
    opexBreakdown,
    nonOpBreakdown,
    accountBalances,
    monthlyTrend,
  };
}

// ─── TRANSACTIONS LIST & RECATEGORIZATION ─────────────────────────────────────

export async function getBankTransactionsList(filters?: {
  period?: string;
  bank?: string;
  category?: string;
  txType?: string;
  search?: string;
  limit?: number;
  offset?: number;
}): Promise<{ transactions: any[]; totalCount: number }> {
  await ensureFinanceSchema();
  await seedIfEmpty();

  const where: string[] = ['1=1'];
  if (filters?.bank && filters.bank !== 'all') {
    where.push(`bank_name = '${filters.bank}'`);
  }
  if (filters?.period && filters.period !== 'all') {
    where.push(`strftime(tx_date, '%Y-%m') = '${filters.period}'`);
  }
  if (filters?.category && filters.category !== 'all') {
    where.push(`category = '${filters.category.replace(/'/g, "''")}'`);
  }
  if (filters?.txType && filters.txType !== 'all') {
    where.push(`tx_type = '${filters.txType}'`);
  }
  if (filters?.search) {
    const q = filters.search.replace(/'/g, "''").toLowerCase();
    where.push(`(lower(description) LIKE '%${q}%' OR lower(category) LIKE '%${q}%' OR lower(subcategory) LIKE '%${q}%')`);
  }

  const whereSql = where.join(' AND ');
  const limit = filters?.limit || 100;
  const offset = filters?.offset || 0;

  const countRows = await runQuery<{ total: number }>(`
    SELECT COUNT(*) as total FROM fact_bank_transactions WHERE ${whereSql};
  `);
  const totalCount = Number(countRows[0]?.total) || 0;

  const txs = await runQuery(`
    SELECT
      tx_id, statement_id, bank_name, account_number,
      strftime(tx_date, '%Y-%m-%d') as tx_date,
      description, branch, tx_type, amount, balance,
      category, subcategory, category_type, is_manual_override
    FROM fact_bank_transactions
    WHERE ${whereSql}
    ORDER BY tx_date DESC, tx_id DESC
    LIMIT ${limit} OFFSET ${offset};
  `);

  return { transactions: txs, totalCount };
}

export async function updateTransactionCategory(
  txId: string,
  category: string,
  subcategory: string,
  applyToSimilar: boolean = false
): Promise<{ updatedCount: number }> {
  await ensureFinanceSchema();

  const catDef = FINANCE_CATEGORIES.find((c) => c.name === category);
  const catType = catDef ? catDef.type : 'OPEX';

  const txRows = await runQuery<{ description: string; tx_type: string }>(`
    SELECT description, tx_type FROM fact_bank_transactions WHERE tx_id = '${txId}';
  `);

  if (txRows.length === 0) return { updatedCount: 0 };
  const { description, tx_type } = txRows[0];

  const escapedCat = category.replace(/'/g, "''");
  const escapedSub = subcategory.replace(/'/g, "''");

  if (applyToSimilar) {
    // Find core keyword in description (first 2-3 words)
    const keyword = description.split(/\s+/).slice(0, 3).join(' ').replace(/'/g, "''");
    await runQuery(`
      UPDATE fact_bank_transactions
      SET
        category = '${escapedCat}',
        subcategory = '${escapedSub}',
        category_type = '${catType}',
        is_manual_override = TRUE
      WHERE tx_type = '${tx_type}' AND description LIKE '%${keyword}%';
    `);

    // Save as custom rule
    const ruleId = `rule_${Date.now()}`;
    await runQuery(`
      INSERT INTO dim_finance_category_rules (rule_id, pattern, tx_type, category, subcategory, priority)
      VALUES ('${ruleId}', '${keyword}', '${tx_type}', '${escapedCat}', '${escapedSub}', 20);
    `);

    invalidateQueryCache();
    return { updatedCount: 1 };
  } else {
    await runQuery(`
      UPDATE fact_bank_transactions
      SET
        category = '${escapedCat}',
        subcategory = '${escapedSub}',
        category_type = '${catType}',
        is_manual_override = TRUE
      WHERE tx_id = '${txId}';
    `);
    invalidateQueryCache();
    return { updatedCount: 1 };
  }
}

// ─── SEED INITIAL DATA (From Bank Statements) ─────────────────────────────────

export async function reseedBankStatements(force: boolean = false): Promise<void> {
  await ensureFinanceSchema();

  const existing = await runQuery<{ cnt: number; total_tx: number }>(`
    SELECT
      (SELECT COUNT(*) FROM fact_bank_statements) as cnt,
      (SELECT COUNT(*) FROM fact_bank_transactions) as total_tx;
  `);

  const stmtCount = Number(existing[0]?.cnt || 0);
  const txCount = Number(existing[0]?.total_tx || 0);

  // If already seeded with all 4 statements and over 1,000 transactions, skip unless forced
  if (!force && stmtCount >= 4 && txCount >= 1000) {
    return;
  }

  console.log(`[Finance Seed] Seeding bank statements (force: ${force}, current stmts: ${stmtCount}, txs: ${txCount})...`);

  // 1) BCA August 2026 CSV (398 transactions, Rp 81.06M CR)
  const bcaAugCsv = path.join(process.cwd(), 'data', 'bank_statements', 'BCA_Mutasi_Agustus_2026.csv');
  if (fs.existsSync(bcaAugCsv)) {
    const csvContent = fs.readFileSync(bcaAugCsv, 'utf-8');
    const stmts = parseBcaCsv(csvContent);
    for (const stmt of stmts) {
      await storeBankStatement(stmt, 'BCA_Mutasi_Agustus_2026.csv', 'csv');
    }
  }

  // 2) BCA September 2026 CSV (406 transactions, Rp 113.56M CR)
  const bcaSepCsv = path.join(process.cwd(), 'data', 'bank_statements', 'BCA_Mutasi_September_2026.csv');
  if (fs.existsSync(bcaSepCsv)) {
    const csvContent = fs.readFileSync(bcaSepCsv, 'utf-8');
    const stmts = parseBcaCsv(csvContent);
    for (const stmt of stmts) {
      await storeBankStatement(stmt, 'BCA_Mutasi_September_2026.csv', 'csv');
    }
  }

  // 3) BCA July 2026 PDF (400 transactions, Rp 97.43M CR)
  const bcaJulyPdf = path.join(process.cwd(), 'data', 'bank_statements', 'BCA_Mutasi_Juli_2026.pdf');
  if (fs.existsSync(bcaJulyPdf)) {
    try {
      const { PDFParse } = await import('pdf-parse');
      const buf = fs.readFileSync(bcaJulyPdf);
      const parser = new (PDFParse as any)({ data: buf });
      const parsed = await parser.getText();
      const stmt = parseBcaPdfText(parsed.text);
      await storeBankStatement(stmt, 'BCA_Mutasi_Juli_2026.pdf', 'pdf');
    } catch (err) {
      console.warn('[Finance Seed] Error parsing BCA July PDF:', err);
    }
  }

  // 4) Panin August 2026 PDF (10 transactions, Rp 633.6K CR)
  const paninAugPdf = path.join(process.cwd(), 'data', 'bank_statements', 'Panin_Mutasi_Agustus_2026.pdf');
  if (fs.existsSync(paninAugPdf)) {
    try {
      const { PDFParse } = await import('pdf-parse');
      const buf = fs.readFileSync(paninAugPdf);
      const parser = new (PDFParse as any)({ data: buf });
      const parsed = await parser.getText();
      const stmt = parsePaninPdfText(parsed.text);
      await storeBankStatement(stmt, 'Panin_Mutasi_Agustus_2026.pdf', 'pdf');
    } catch (err) {
      console.warn('[Finance Seed] Error parsing Panin August PDF:', err);
    }
  }

  console.log('[Finance Seed] Bank statements seeding completed successfully.');
}

async function seedIfEmpty(): Promise<void> {
  await reseedBankStatements(false);
}

export async function getSmartBankReconciliation(filters?: {
  bank?: string;
  period?: string;
}): Promise<SmartBankReconciliationReport> {
  await ensureFinanceSchema();
  await seedIfEmpty();

  // 1. Fetch bank credits (inflows)
  const bankWhere: string[] = ["tx_type = 'CR'", "category_type = 'REVENUE'"];
  if (filters?.bank && filters.bank !== 'all') {
    bankWhere.push(`bank_name = '${filters.bank}'`);
  }
  if (filters?.period && filters.period !== 'all') {
    bankWhere.push(`strftime(tx_date, '%Y-%m') = '${filters.period}'`);
  }

  const bankRows = await runQuery<{
    tx_id: string;
    tx_date: string;
    bank_name: string;
    description: string;
    amount: number;
    category: string;
    subcategory: string;
  }>(`
    SELECT
      tx_id,
      strftime(tx_date, '%Y-%m-%d') as tx_date,
      bank_name,
      description,
      amount,
      category,
      subcategory
    FROM fact_bank_transactions
    WHERE ${bankWhere.join(' AND ')}
    ORDER BY tx_date DESC, amount DESC;
  `);

  // 2. Fetch daily POS settlement batches
  const posRows = await runQuery<{
    dt: string;
    provider: string;
    brand: string;
    order_count: number;
    expected_net_payout: number;
  }>(`
    SELECT
      strftime(created_at, '%Y-%m-%d') as dt,
      provider,
      brand,
      COUNT(*) as order_count,
      ROUND(SUM(net_payout)::numeric, 0) as expected_net_payout
    FROM fact_orders
    WHERE created_at IS NOT NULL
    GROUP BY 1, 2, 3
    ORDER BY dt DESC, expected_net_payout DESC;
  `);

  // 3. Fetch catering package payments
  const cateringRows = await runQuery<{
    package_id: string;
    customer_name: string;
    start_date: string;
    total_amount: number;
    payment_status: string;
  }>(`
    SELECT
      p.package_id,
      c.customer_name,
      p.start_date,
      ROUND((p.total_boxes * p.price_per_box)::numeric, 0) as total_amount,
      p.payment_status
    FROM catering_packages p
    JOIN catering_customers c ON p.customer_id = c.customer_id
    ORDER BY p.start_date DESC;
  `);

  const matches: SmartReconciliationMatch[] = [];
  const unmatchedBank: UnmatchedBankDeposit[] = [];
  const matchedPosKeys = new Set<string>();
  const matchedCateringKeys = new Set<string>();

  let totalBankCredits = 0;
  let reconciledAmount = 0;

  for (const b of bankRows) {
    const bAmt = Number(b.amount) || 0;
    totalBankCredits += bAmt;
    const bDesc = (b.description || '').toUpperCase();
    const bDate = String(b.tx_date || '');

    let foundMatch = false;

    // Check catering match first
    for (const c of cateringRows) {
      const cKey = c.package_id;
      if (matchedCateringKeys.has(cKey)) continue;

      const cAmt = Number(c.total_amount) || 0;
      const cCust = c.customer_name.toUpperCase();
      const nameMatch = bDesc.includes(cCust) || cCust.includes(bDesc.slice(0, 8));
      const amtDiff = Math.abs(bAmt - cAmt);

      if ((nameMatch && amtDiff < 50000) || amtDiff < 500) {
        matchedCateringKeys.add(cKey);
        foundMatch = true;
        reconciledAmount += bAmt;

        matches.push({
          matchId: `M-CAT-${b.tx_id}`,
          txId: b.tx_id,
          txDate: bDate,
          bankName: b.bank_name,
          description: b.description,
          bankAmount: bAmt,
          expectedSource: `Catering Invoice: ${c.customer_name} (${c.package_id})`,
          expectedDate: c.start_date,
          expectedAmount: cAmt,
          varianceRp: bAmt - cAmt,
          variancePct: cAmt > 0 ? Math.round(((bAmt - cAmt) / cAmt) * 1000) / 10 : 0,
          confidence: amtDiff < 500 ? 'PERFECT' : 'HIGH_PROBABLE',
          notes: `Direct customer bank transfer verified against catering subscription.`,
        });
        break;
      }
    }

    if (foundMatch) continue;

    // Check POS daily settlement match
    for (const p of posRows) {
      const pKey = `${p.dt}-${p.provider}-${p.brand}`;
      if (matchedPosKeys.has(pKey)) continue;

      const pAmt = Number(p.expected_net_payout) || 0;
      const amtDiff = Math.abs(bAmt - pAmt);
      const pctDiff = pAmt > 0 ? amtDiff / pAmt : 1;

      // Check provider keyword alignment
      const pName = (p.provider || '').toUpperCase();
      const isVisionetOvo = (pName.includes('OVO') || pName.includes('QRIS')) && bDesc.includes('VISIONET');
      const isGoPay = pName.includes('GOFOOD') && (bDesc.includes('GOPAY') || bDesc.includes('DOMPET') || bDesc.includes('GO-JEK'));
      const isGrab = pName.includes('GRAB') && bDesc.includes('GRAB');
      const isShopee = pName.includes('SHOPEE') && (bDesc.includes('AIRPAY') || bDesc.includes('SHOPEE'));
      const isGenericCardEdc = (pName.includes('POS') || pName.includes('EDC')) && (bDesc.includes('SETTLEMENT') || bDesc.includes('EDC'));

      const isProviderMatch = isVisionetOvo || isGoPay || isGrab || isShopee || isGenericCardEdc;

      // Date window within +/- 2 days (standard settlement delay)
      const dayDiff = Math.abs(new Date(bDate).getTime() - new Date(p.dt).getTime()) / (1000 * 3600 * 24);

      if ((isProviderMatch && dayDiff <= 3 && pctDiff <= 0.05) || (dayDiff <= 1 && amtDiff < 2000)) {
        matchedPosKeys.add(pKey);
        foundMatch = true;
        reconciledAmount += bAmt;

        matches.push({
          matchId: `M-POS-${b.tx_id}`,
          txId: b.tx_id,
          txDate: bDate,
          bankName: b.bank_name,
          description: b.description,
          bankAmount: bAmt,
          expectedSource: `${p.provider} Daily Payout (${p.brand})`,
          expectedDate: p.dt,
          expectedAmount: pAmt,
          varianceRp: bAmt - pAmt,
          variancePct: Math.round(pctDiff * 1000) / 10,
          confidence: amtDiff < 1000 ? 'PERFECT' : dayDiff > 1 ? 'TIMING_LAG' : 'HIGH_PROBABLE',
          notes: dayDiff > 1
            ? `Settled with T+${Math.round(dayDiff)} timing lag (weekend/holiday gateway batching).`
            : `Net payout successfully reconciled against gateway remittance.`,
        });
        break;
      }
    }

    if (!foundMatch) {
      unmatchedBank.push({
        txId: b.tx_id,
        txDate: bDate,
        bankName: b.bank_name,
        description: b.description,
        amount: bAmt,
        category: b.category,
        subcategory: b.subcategory,
      });
    }
  }

  // Identify unmatched POS settlements (potential revenue leakage or delayed gateway settlement)
  const unmatchedPos: UnmatchedPosPayout[] = [];
  let unmatchedPosAmount = 0;

  for (const p of posRows) {
    const pKey = `${p.dt}-${p.provider}-${p.brand}`;
    if (!matchedPosKeys.has(pKey)) {
      const pAmt = Number(p.expected_net_payout) || 0;
      if (pAmt > 50000) {
        unmatchedPosAmount += pAmt;
        unmatchedPos.push({
          date: p.dt,
          provider: p.provider,
          brand: p.brand,
          orderCount: Number(p.order_count),
          expectedNetPayout: pAmt,
          status: 'PENDING_BANK_DEPOSIT',
        });
      }
    }
  }

  const reconciliationRate =
    totalBankCredits > 0 ? Math.round((reconciledAmount / totalBankCredits) * 1000) / 10 : 0;

  return {
    summary: {
      totalBankCredits,
      reconciledAmount,
      reconciliationRate,
      matchedCount: matches.length,
      unmatchedBankCount: unmatchedBank.length,
      unmatchedBankAmount: unmatchedBank.reduce((acc, u) => acc + u.amount, 0),
      unmatchedPosCount: unmatchedPos.length,
      unmatchedPosAmount,
    },
    matches: matches.slice(0, 100),
    unmatchedBank: unmatchedBank.slice(0, 50),
    unmatchedPos: unmatchedPos.slice(0, 50),
  };
}

