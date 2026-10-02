// Tyfel Hub · User Management — Layerbase PostgreSQL via raw SQL
// Uses the same runQuery / Layerbase HTTP client as the rest of the app.

import { runQuery } from './duckdb';
import {
  Permission,
  UserRole,
  ADMIN_DEFAULT_PERMISSIONS,
  STAFF_DEFAULT_PERMISSIONS,
  parsePermissions,
  serializePermissions,
} from './permissions';

// ─── SQL Sanitization ────────────────────────────────────────────────────────
// Defence-in-depth: strip null bytes, escape single quotes, validate against
// SQL injection patterns. This is not a substitute for parameterized queries,
// but DuckDB's node-api doesn't support prepared-statement params in run().

function safeSqlString(val: string): string {
  // Strip null bytes (can bypass escaping in some drivers)
  let safe = val.replace(/\0/g, '');
  // Escape single quotes for SQL string literals
  safe = safe.replace(/'/g, "''");
  return safe;
}

function safeSqlIdentifier(val: string): string {
  // Only allow alphanumeric, underscore, hyphen, dot, @
  // Reject anything that could be SQL injection
  if (!/^[\w@.\-]+$/i.test(val)) {
    throw new Error(`Invalid SQL identifier: ${val}`);
  }
  return safeSqlString(val);
}

export type { UserRole };

export interface DbUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  password_hash: string;
  permissions: string; // JSON array string, e.g. '["overview","recipes"]'
  is_active: boolean;
  created_at: string;
  updated_at: string;
  last_login_at: string | null;
}

export interface PublicUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  permissions: Permission[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
  last_login_at: string | null;
}

// ─── Schema Bootstrap ────────────────────────────────────────────────────────

export async function ensureUsersTable(): Promise<void> {
  await runQuery(`
    CREATE TABLE IF NOT EXISTS maus_users (
      id            TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
      email         TEXT UNIQUE NOT NULL,
      name          TEXT NOT NULL,
      role          TEXT NOT NULL DEFAULT 'staff',
      password_hash TEXT NOT NULL,
      permissions   TEXT NOT NULL DEFAULT '[]',
      is_active     BOOLEAN NOT NULL DEFAULT TRUE,
      created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      last_login_at TIMESTAMPTZ
    )
  `);

  // Migrate existing tables that don't have the permissions column yet
  try {
    await runQuery(`ALTER TABLE maus_users ADD COLUMN IF NOT EXISTS permissions TEXT NOT NULL DEFAULT '[]'`);
  } catch {
    // Column already exists — ignore
  }
}

// ─── Internal helper: map raw DB row → PublicUser ────────────────────────────

function toPublicUser(row: DbUser): PublicUser {
  return {
    id:            row.id,
    email:         row.email,
    name:          row.name,
    role:          row.role,
    permissions:   parsePermissions(row.permissions),
    is_active:     row.is_active,
    created_at:    row.created_at,
    updated_at:    row.updated_at,
    last_login_at: row.last_login_at,
  };
}

// ─── Queries ─────────────────────────────────────────────────────────────────

export async function getUserByEmail(email: string): Promise<DbUser | null> {
  await ensureUsersTable();
  const safeEmail = safeSqlIdentifier(email.toLowerCase());
  const rows = await runQuery<DbUser>(
    `SELECT * FROM maus_users WHERE email = '${safeEmail}' AND is_active = TRUE LIMIT 1`
  );
  return rows[0] ?? null;
}

export async function getUserById(id: string): Promise<DbUser | null> {
  await ensureUsersTable();
  const safeId = safeSqlString(id);
  const rows = await runQuery<DbUser>(
    `SELECT * FROM maus_users WHERE id = '${safeId}' AND is_active = TRUE LIMIT 1`
  );
  return rows[0] ?? null;
}

export async function listUsers(): Promise<PublicUser[]> {
  await ensureUsersTable();
  const rows = await runQuery<DbUser>(
    `SELECT id, email, name, role, permissions, is_active, created_at, updated_at, last_login_at
     FROM maus_users
     ORDER BY created_at ASC`
  );
  return rows.map(toPublicUser);
}

const VALID_ROLES: ReadonlySet<string> = new Set(['superadmin', 'admin', 'staff']);

export async function createUser(params: {
  email: string;
  name: string;
  role: UserRole;
  passwordHash: string;
  permissions?: Permission[];
}): Promise<PublicUser> {
  await ensureUsersTable();

  if (!VALID_ROLES.has(params.role)) {
    throw new Error(`Invalid role: ${params.role}`);
  }

  const defaultPerms = params.permissions
    ?? (params.role === 'admin' || params.role === 'superadmin' ? ADMIN_DEFAULT_PERMISSIONS : STAFF_DEFAULT_PERMISSIONS);
  const safeEmail = safeSqlIdentifier(params.email.toLowerCase());
  const safeName  = safeSqlString(params.name);
  const safeHash  = safeSqlString(params.passwordHash);
  const safePerms = safeSqlString(serializePermissions(defaultPerms));

  const rows = await runQuery<DbUser>(`
    INSERT INTO maus_users (email, name, role, password_hash, permissions)
    VALUES ('${safeEmail}', '${safeName}', '${params.role}', '${safeHash}', '${safePerms}')
    RETURNING id, email, name, role, permissions, is_active, created_at, updated_at, last_login_at
  `);
  return toPublicUser(rows[0]);
}

export async function updateUser(
  id: string,
  params: Partial<{
    name: string;
    role: UserRole;
    is_active: boolean;
    passwordHash: string;
    permissions: Permission[];
  }>
): Promise<PublicUser | null> {
  await ensureUsersTable();
  const safeId = safeSqlString(id);
  const setClauses: string[] = ['updated_at = NOW()'];

  if (params.name !== undefined)
    setClauses.push(`name = '${safeSqlString(params.name)}'`);
  if (params.role !== undefined) {
    if (!VALID_ROLES.has(params.role)) throw new Error(`Invalid role: ${params.role}`);
    setClauses.push(`role = '${params.role}'`);
  }
  if (params.is_active !== undefined)
    setClauses.push(`is_active = ${Boolean(params.is_active)}`);
  if (params.passwordHash !== undefined)
    setClauses.push(`password_hash = '${safeSqlString(params.passwordHash)}'`);
  if (params.permissions !== undefined)
    setClauses.push(`permissions = '${safeSqlString(serializePermissions(params.permissions))}'`);

  const rows = await runQuery<DbUser>(`
    UPDATE maus_users
    SET ${setClauses.join(', ')}
    WHERE id = '${safeId}'
    RETURNING id, email, name, role, permissions, is_active, created_at, updated_at, last_login_at
  `);
  return rows[0] ? toPublicUser(rows[0]) : null;
}

export async function updateLastLogin(id: string): Promise<void> {
  await ensureUsersTable();
  const safeId = safeSqlString(id);
  await runQuery(
    `UPDATE maus_users SET last_login_at = NOW() WHERE id = '${safeId}'`
  );
}

export async function countUsers(): Promise<number> {
  await ensureUsersTable();
  const rows = await runQuery<{ cnt: number }>(`SELECT COUNT(*)::INT AS cnt FROM maus_users`);
  return rows[0]?.cnt ?? 0;
}

