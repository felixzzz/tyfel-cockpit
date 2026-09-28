import path from 'path';
import fs from 'fs';
import { DuckDBInstance } from '@duckdb/node-api';

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

const defaultQueryUrl =
  'https://tyfel-cockpit-poor-hedge.sage.cloud.layerbase.dev/v1/databases/36373641-c5db-463e-975c-0d636a0c92c5/query';
const queryUrl = process.env.LAYERBASE_QUERY_URL || defaultQueryUrl;
const apiKey = process.env.LAYERBASE_API_KEY;

if (!apiKey) {
  console.error('❌ Missing LAYERBASE_API_KEY environment variable (checked process.env and .env.local).');
  console.error('');
  console.error('Usage:');
  console.error('  LAYERBASE_API_KEY="sk_..." npm run db:push-layerbase');
  process.exit(1);
}

const localDbPath = path.resolve(process.cwd(), 'data', 'fnb_analytics.duckdb');
if (!fs.existsSync(localDbPath)) {
  console.error(`❌ Local database not found at: ${localDbPath}`);
  process.exit(1);
}

async function runLayerbaseQuery(sql) {
  const res = await fetch(queryUrl.trim(), {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey.trim()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: sql }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`[Layerbase HTTP ${res.status}] ${text}`);
  }
  return res.json();
}

function formatSqlValue(val) {
  if (val === null || val === undefined) return 'NULL';
  if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE';
  if (typeof val === 'number' || typeof val === 'bigint') return String(val);
  if (val instanceof Date) return `'${val.toISOString()}'`;
  if (typeof val === 'object') {
    if ('micros' in val && typeof val.micros === 'bigint') {
      const ms = Number(val.micros / 1000n);
      return `'${new Date(ms).toISOString().replace('T', ' ').replace('Z', '')}'`;
    }
    if ('days' in val && typeof val.days === 'number') {
      const ms = val.days * 86400 * 1000;
      return `'${new Date(ms).toISOString().slice(0, 10)}'`;
    }
  }
  const s = String(val).replace(/'/g, "''");
  return `'${s}'`;
}

async function main() {
  console.log(`🦆 Reading local database: ${localDbPath}`);
  console.log(`🔗 Target Layerbase endpoint: ${queryUrl}`);
  const localDb = await DuckDBInstance.create(localDbPath, { access_mode: 'READ_ONLY' });
  const conn = await localDb.connect();

  try {
    const tablesRes = await conn.run(`
      SELECT table_name, sql
      FROM duckdb_tables()
      WHERE internal = false AND schema_name = 'main'
      ORDER BY table_name;
    `);
    const tables = await tablesRes.getRows();

    for (const [tableNameRaw, createSqlRaw] of tables) {
      const tableName = String(tableNameRaw);
      const createSql = String(createSqlRaw).replace(
        /^CREATE TABLE/i,
        'CREATE OR REPLACE TABLE'
      );

      console.log(`📦 Creating & uploading table ${tableName}...`);
      await runLayerbaseQuery(createSql);

      const colsRes = await conn.run(`
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_name = '${tableName}' AND table_schema = 'main'
        ORDER BY ordinal_position;
      `);
      const colDefs = await colsRes.getRows();
      const selectExprs = colDefs.map(([col, dtype]) => {
        const t = String(dtype).toUpperCase();
        if (t.includes('TIMESTAMP') || t.includes('DATE')) {
          return `CAST("${col}" AS VARCHAR) AS "${col}"`;
        }
        return `"${col}"`;
      });
      const colNamesSql = colDefs.map(([col]) => `"${col}"`).join(', ');
      const prefix = `INSERT INTO "${tableName}" (${colNamesSql}) VALUES `;

      const rowsRes = await conn.run(`SELECT ${selectExprs.join(', ')} FROM "${tableName}";`);
      const rows = await rowsRes.getRows();

      const MAX_QUERY_BYTES = 7500;
      let batchTuples = [];
      let currentBytes = Buffer.byteLength(prefix, 'utf8') + 2;

      for (const row of rows) {
        const tupleSql = `(${row.map((val) => formatSqlValue(val)).join(',')})`;
        const tupleBytes = Buffer.byteLength(tupleSql, 'utf8') + 2;

        if (batchTuples.length > 0 && currentBytes + tupleBytes > MAX_QUERY_BYTES) {
          await runLayerbaseQuery(`${prefix}${batchTuples.join(',')};`);
          batchTuples = [];
          currentBytes = Buffer.byteLength(prefix, 'utf8') + 2;
        }

        batchTuples.push(tupleSql);
        currentBytes += tupleBytes;
      }

      if (batchTuples.length > 0) {
        await runLayerbaseQuery(`${prefix}${batchTuples.join(',')};`);
      }

      console.log(`   ✅ Uploaded ${rows.length} rows to ${tableName}`);
    }

    console.log('\n🎉 All tables uploaded to Layerbase Cloud successfully!');
  } finally {
    conn.closeSync();
  }
}

main().catch((err) => {
  console.error('❌ Failed to push to Layerbase:', err);
  process.exit(1);
});
