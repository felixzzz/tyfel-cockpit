import { defineConfig } from 'drizzle-kit';
import fs from 'fs';
import path from 'path';

// Auto-load .env.local if present and not already populated
if (!process.env.DATABASE_URL && !process.env.DIRECT_URL) {
  const envPath = path.resolve(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);
    for (const rawLine of lines) {
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
}

const dbUrl = process.env.DIRECT_URL || process.env.DATABASE_URL;
if (!dbUrl) {
  throw new Error('DATABASE_URL or DIRECT_URL environment variable is required for drizzle-kit.');
}

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: dbUrl,
  },
});
