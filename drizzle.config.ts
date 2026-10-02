import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url:
      process.env.DIRECT_URL ||
      process.env.DATABASE_URL ||
      'postgresql://postgres.vrimefznzyslagskfmsi:W32QXB4J87OpHs0a@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres',
  },
});
