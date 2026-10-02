// Tyfel Hub · JWT Session Auth
// Uses `jose` for JWT (Edge-compatible) and `bcryptjs` for password hashing.

import { SignJWT, jwtVerify } from 'jose';
import type { Permission } from './permissions';

export const SESSION_COOKIE = 'tyfel_ops_session';
export const LEGACY_SESSION_COOKIE = 'maus_ops_session';
export const SESSION_COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

// Secret must be ≥ 32 bytes for HS256
function getJwtSecret(): Uint8Array {
  const raw = process.env.AUTH_JWT_SECRET;
  if (!raw) {
    throw new Error(
      'AUTH_JWT_SECRET environment variable is required. ' +
      'Set it in .env.local (min 32 characters). ' +
      'Example: AUTH_JWT_SECRET="$(openssl rand -base64 48)"'
    );
  }
  return new TextEncoder().encode(raw);
}

export interface SessionPayload {
  sub:         string;       // user id
  email:       string;
  name:        string;
  role:        'superadmin' | 'admin' | 'staff';
  permissions: Permission[]; // granular feature access
}

export async function signSession(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(getJwtSecret());
}

export async function verifySession(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getJwtSecret());
    return {
      sub:         payload.sub as string,
      email:       payload.email as string,
      name:        payload.name  as string,
      role:        payload.role  as 'superadmin' | 'admin' | 'staff',
      permissions: (payload.permissions as Permission[]) ?? [],
    };
  } catch {
    return null;
  }
}

// ─── Legacy passcode still accepted during migration ──────────────────────────
export { verifyStaffPasscode, STAFF_AUTH_COOKIE } from './auth';
