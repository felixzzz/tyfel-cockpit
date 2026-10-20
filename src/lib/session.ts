// Tyfel Hub · JWT Session Auth
// Uses `jose` for JWT (Edge-compatible) and `bcryptjs` for password hashing.

import { SignJWT, jwtVerify } from 'jose';
import { NextRequest, NextResponse } from 'next/server';
import { hasPermission, type Permission } from './permissions';

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

export type AuthResult =
  | { user: SessionPayload; errorResponse: null }
  | { user: null; errorResponse: NextResponse };

/**
 * Enforces authentication and optional feature-level permission on API route handlers.
 * Returns either `{ user, errorResponse: null }` or `{ user: null, errorResponse: NextResponse }`.
 */
export async function requireAuth(
  request: NextRequest,
  requiredPermission?: Permission
): Promise<AuthResult> {
  const token =
    request.cookies.get(SESSION_COOKIE)?.value ||
    request.cookies.get(LEGACY_SESSION_COOKIE)?.value ||
    request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');

  if (!token) {
    return {
      user: null,
      errorResponse: NextResponse.json(
        { success: false, error: 'Authentication required. Please log in.' },
        { status: 401 }
      ),
    };
  }

  const session = await verifySession(token);
  if (!session) {
    return {
      user: null,
      errorResponse: NextResponse.json(
        { success: false, error: 'Session expired or invalid. Please log in again.' },
        { status: 401 }
      ),
    };
  }

  if (requiredPermission && !hasPermission(session.permissions, requiredPermission, session.role)) {
    return {
      user: null,
      errorResponse: NextResponse.json(
        {
          success: false,
          error: `Forbidden: '${requiredPermission}' permission required.`,
        },
        { status: 403 }
      ),
    };
  }

  return { user: session, errorResponse: null };
}

// ─── Legacy passcode still accepted during migration ──────────────────────────
export { verifyStaffPasscode, STAFF_AUTH_COOKIE } from './auth';
