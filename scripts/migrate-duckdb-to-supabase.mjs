import path from 'path';
import fs from 'fs';
import postgres from 'postgres';
import bcrypt from 'bcryptjs';
import { DuckDBInstance } from '@duckdb/node-api';

// Load .env.local
const envLocalPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envLocalPath)) {
  for (const rawLine of fs.readFileSync(envLocalPath, 'utf-8').split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const eqIdx = line.indexOf('=');
    if (eqIdx > 0) {
      const k = line.slice(0, eqIdx).trim();
      const v = line.slice(eqIdx + 1).trim().replace(/^['"]|['"]$/g, '');
      if (k && process.env[k] === undefined) process.env[k] = v;
    }
  }
}

const dbUrl =
  process.env.DIRECT_URL ||
  process.env.DATABASE_URL ||
  'postgresql://postgres.vrimefznzyslagskfmsi:W32QXB4J87OpHs0a@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres';

const localDbPath = path.resolve(process.cwd(), 'data', 'fnb_analytics.duckdb');
if (!fs.existsSync(localDbPath)) {
  console.error(`❌ Local database not found at: ${localDbPath}`);
  process.exit(1);
}

const sql = postgres(dbUrl, { ssl: 'require', max: 5 });

function formatValue(v) {
  if (v === null || v === undefined) return null;
  if (typeof v === 'bigint') return Number(v);
  if (v instanceof Date) return v.toISOString();
  if (typeof v === 'object') {
    if ('micros' in v && typeof v.micros === 'bigint') {
      const ms = Number(v.micros / 1000n);
      return new Date(ms).toISOString();
    }
    if ('days' in v && typeof v.days === 'number') {
      const ms = v.days * 86400 * 1000;
      return new Date(ms).toISOString().slice(0, 10);
    }
  }
  return v;
}

async function migrateTable(conn, tableName, pkCol) {
  console.log(`\n⏳ Migrating table: ${tableName}...`);
  const countRes = await conn.run(`SELECT count(*) FROM ${tableName}`);
  const countRows = await countRes.getRows();
  const totalRows = Number(countRows[0]?.[0] ?? 0);

  if (totalRows === 0) {
    console.log(`ℹ️ ${tableName} has 0 rows in DuckDB, skipping.`);
    return;
  }

  const colsRes = await conn.run(`
    SELECT column_name
    FROM information_schema.columns
    WHERE table_name = '${tableName}'
    ORDER BY ordinal_position;
  `);
  const colRows = await colsRes.getRows();
  const colNames = colRows.map((r) => String(r[0]));

  const allDataRes = await conn.run(`SELECT * FROM ${tableName}`);
  const rawRows = await allDataRes.getRows();

  const BATCH_SIZE = 100;
  let inserted = 0;

  for (let i = 0; i < rawRows.length; i += BATCH_SIZE) {
    const chunk = rawRows.slice(i, i + BATCH_SIZE);
    const objectsToInsert = chunk.map((r) => {
      const obj = {};
      colNames.forEach((col, idx) => {
        obj[col] = formatValue(r[idx]);
      });
      return obj;
    });

    if (objectsToInsert.length > 0) {
      if (pkCol) {
        await sql`
          INSERT INTO ${sql(tableName)} ${sql(objectsToInsert)}
          ON CONFLICT (${sql(pkCol)}) DO NOTHING
        `;
      } else {
        await sql`
          INSERT INTO ${sql(tableName)} ${sql(objectsToInsert)}
        `;
      }
      inserted += objectsToInsert.length;
      process.stdout.write(`\r   Progress: ${inserted}/${totalRows} rows`);
    }
  }

  const supaCountRes = await sql`SELECT count(*) FROM ${sql(tableName)}`;
  console.log(`\n✅ ${tableName} migrated! Supabase row count: ${supaCountRes[0].count}`);
}

async function seedAdminUser() {
  console.log('\n⏳ Ensuring default admin user in maus_users...');
  const existing = await sql`SELECT id FROM maus_users WHERE email = 'admin@mausatelier.id'`;
  if (existing.length === 0) {
    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync('maus2026', salt);
    await sql`
      INSERT INTO maus_users (email, name, role, password_hash, permissions, is_active)
      VALUES (
        'admin@mausatelier.id',
        'Admin',
        'superadmin',
        ${hash},
        '["orders:view","analytics:view","recipes:view","recipes:edit","attendance:view","attendance:manage","finance:view","finance:manage","catering:view","catering:manage","admin:users"]',
        true
      )
    `;
    console.log('✅ Default superadmin created (admin@mausatelier.id / maus2026)');
  } else {
    console.log('ℹ️ Admin user already exists.');
  }
}

async function main() {
  console.log('🦆 Connecting to local DuckDB:', localDbPath);
  console.log('⚡ Connecting to Supabase PostgreSQL:', dbUrl.replace(/:[^:@]+@/, ':***@'));

  const localDb = await DuckDBInstance.create(localDbPath, { access_mode: 'READ_ONLY' });
  const conn = await localDb.connect();

  try {
    const tablesToMigrate = [
      { name: 'dim_employees', pk: 'employee_name' },
      { name: 'dim_ingredients', pk: 'ingredient_id' },
      { name: 'dim_order_cancellations', pk: 'order_id' },
      { name: 'dim_recipes', pk: 'recipe_id' },
      { name: 'fact_attendance', pk: 'attendance_id' },
      { name: 'fact_marketing_spend', pk: 'spend_id' },
      { name: 'fact_orders', pk: 'dedup_id' },
      { name: 'fact_order_items', pk: 'dedup_id' },
      { name: 'fact_recipe_ingredients', pk: 'line_id' },
      { name: 'payroll_payment_status', pk: ['period_key', 'employee_name'] },
      { name: 'payroll_period_adjustments', pk: ['period_key', 'employee_name'] },
    ];

    for (const t of tablesToMigrate) {
      await migrateTable(conn, t.name, t.pk);
    }

    await seedAdminUser();

    console.log('\n🎉 ALL DATA MIGRATED SUCCESSFULLY TO SUPABASE!');
  } finally {
    conn.closeSync();
    await sql.end();
  }
}

main().catch((err) => {
  console.error('\n❌ Migration failed:', err);
  process.exit(1);
});
