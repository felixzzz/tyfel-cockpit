// POST /api/auth/login  — email + password login
// GET  /api/auth/login  — verify current session
// DELETE /api/auth/login — logout (clear cookie)

import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import {
  getUserByEmail,
  updateLastLogin,
  countUsers,
  createUser,
} from '@/lib/db-users';
import { ADMIN_DEFAULT_PERMISSIONS, getEffectivePermissions } from '@/lib/permissions';
import { signSession, verifySession, SESSION_COOKIE, LEGACY_SESSION_COOKIE, SESSION_COOKIE_MAX_AGE } from '@/lib/session';

// ─── GET: verify session ─────────────────────────────────────────────────────
export async function GET(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value || request.cookies.get(LEGACY_SESSION_COOKIE)?.value;
  if (!token) return NextResponse.json({ authenticated: false });

  const session = await verifySession(token);
  if (!session) return NextResponse.json({ authenticated: false });

  return NextResponse.json({
    authenticated: true,
    user: {
      id:          session.sub,
      email:       session.email,
      name:        session.name,
      role:        session.role,
      permissions: getEffectivePermissions(session.permissions, session.role),
    },
  });
}

// ─── POST: login ─────────────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email    = (body?.email    || '').trim().toLowerCase();
    const password = (body?.password || '').trim();

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email dan password wajib diisi.' },
        { status: 400 }
      );
    }

    // Auto-seed first admin — ONLY in development, never in production
    const total = await countUsers();
    if (total === 0) {
      if (process.env.NODE_ENV === 'production') {
        return NextResponse.json(
          { success: false, error: 'No users configured. Run the setup script to create the first admin account.' },
          { status: 503 }
        );
      }

      const DEFAULT_ADMIN_EMAIL    = (process.env.SEED_ADMIN_EMAIL    || 'admin@tyfelhub.id').toLowerCase();
      const DEFAULT_ADMIN_PASSWORD =  process.env.SEED_ADMIN_PASSWORD;
      const DEFAULT_ADMIN_NAME     =  process.env.SEED_ADMIN_NAME     || 'Admin';

      if (!DEFAULT_ADMIN_PASSWORD) {
        return NextResponse.json(
          { success: false, error: 'SEED_ADMIN_PASSWORD env var must be set to create the initial admin account.' },
          { status: 503 }
        );
      }

      const hash = await bcrypt.hash(DEFAULT_ADMIN_PASSWORD, 12);
      await createUser({
        email:       DEFAULT_ADMIN_EMAIL,
        name:        DEFAULT_ADMIN_NAME,
        role:        'superadmin',
        passwordHash: hash,
        permissions: ADMIN_DEFAULT_PERMISSIONS,
      });
    }

    const dbUser = await getUserByEmail(email);
    if (!dbUser) {
      return NextResponse.json(
        { success: false, error: 'Email atau password salah.' },
        { status: 401 }
      );
    }

    const match = await bcrypt.compare(password, dbUser.password_hash);
    if (!match) {
      return NextResponse.json(
        { success: false, error: 'Email atau password salah.' },
        { status: 401 }
      );
    }

    // Parse permissions from DB user — superadmin/admin always get ALL permissions
    const { parsePermissions, getEffectivePermissions } = await import('@/lib/permissions');
    const rawPermissions = parsePermissions(dbUser.permissions);
    const permissions = getEffectivePermissions(rawPermissions, dbUser.role);

    const sessionPayload = {
      sub:         dbUser.id,
      email:       dbUser.email,
      name:        dbUser.name,
      role:        dbUser.role,
      permissions,
    };

    const token = await signSession(sessionPayload);
    await updateLastLogin(dbUser.id);

    const response = NextResponse.json({
      success: true,
      user: {
        id:          dbUser.id,
        email:       dbUser.email,
        name:        dbUser.name,
        role:        dbUser.role,
        permissions,
      },
    });

    response.cookies.set({
      name:     SESSION_COOKIE,
      value:    token,
      httpOnly: true,
      path:     '/',
      maxAge:   SESSION_COOKIE_MAX_AGE,
      sameSite: 'lax',
      secure:   process.env.NODE_ENV === 'production',
    });

    return response;
  } catch (error) {
    console.error('[Login Error]', error);
    return NextResponse.json(
      { success: false, error: 'Server error. Silakan coba lagi.' },
      { status: 500 }
    );
  }
}

// ─── DELETE: logout ───────────────────────────────────────────────────────────
export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.delete(SESSION_COOKIE);
  response.cookies.delete(LEGACY_SESSION_COOKIE);
  return response;
}
