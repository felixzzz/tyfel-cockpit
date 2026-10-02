import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const connectionString =
  process.env.DATABASE_URL ||
  'postgresql://postgres.vrimefznzyslagskfmsi:W32QXB4J87OpHs0a@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres';

// For serverless runtimes (Next.js / Vercel), create a client with connection limits
const globalForDb = globalThis as unknown as {
  __postgresClient?: postgres.Sql;
};

export const client =
  globalForDb.__postgresClient ||
  (globalForDb.__postgresClient = postgres(connectionString, {
    ssl: 'require',
    max: 10,
    idle_timeout: 20,
    connect_timeout: 10,
    prepare: false, // Recommended for transaction-mode connection poolers
  }));

export const db = drizzle(client, { schema });
export { schema };
