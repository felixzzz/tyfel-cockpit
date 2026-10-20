import { describe, it, expect, beforeAll } from 'vitest';
import { NextRequest } from 'next/server';
import {
  signSession,
  verifySession,
  requireAuth,
  SESSION_COOKIE,
  type SessionPayload,
} from '../session';

describe('Session Authentication & Route Guards', () => {
  beforeAll(() => {
    if (!process.env.AUTH_JWT_SECRET) {
      process.env.AUTH_JWT_SECRET = 'test-secret-must-be-at-least-32-chars-long-security-token';
    }
  });

  const staffUser: SessionPayload = {
    sub: 'user-staff-1',
    email: 'kitchen@tyfel.com',
    name: 'Chef Mario',
    role: 'staff',
    permissions: ['inventory', 'recipes'],
  };

  const adminUser: SessionPayload = {
    sub: 'user-admin-1',
    email: 'admin@tyfel.com',
    name: 'Admin Sarah',
    role: 'admin',
    permissions: [],
  };

  it('signs and verifies JWT session tokens correctly', async () => {
    const token = await signSession(staffUser);
    expect(typeof token).toBe('string');

    const decoded = await verifySession(token);
    expect(decoded).not.toBeNull();
    expect(decoded?.sub).toBe(staffUser.sub);
    expect(decoded?.email).toBe(staffUser.email);
    expect(decoded?.permissions).toEqual(staffUser.permissions);
  });

  it('returns null for an invalid or tampered token', async () => {
    const result = await verifySession('invalid.jwt.token');
    expect(result).toBeNull();
  });

  it('requireAuth returns 401 when no session cookie or header is provided', async () => {
    const req = new NextRequest('http://localhost:3000/api/inventory');
    const auth = await requireAuth(req, 'inventory');

    expect(auth.user).toBeNull();
    expect(auth.errorResponse?.status).toBe(401);

    const body = await auth.errorResponse?.json();
    expect(body?.error).toContain('Authentication required');
  });

  it('requireAuth returns 403 when staff lacks required permission', async () => {
    const token = await signSession(staffUser);
    const req = new NextRequest('http://localhost:3000/api/finance', {
      headers: {
        cookie: `${SESSION_COOKIE}=${token}`,
      },
    });

    const auth = await requireAuth(req, 'finance');
    expect(auth.user).toBeNull();
    expect(auth.errorResponse?.status).toBe(403);

    const body = await auth.errorResponse?.json();
    expect(body?.error).toContain("'finance' permission required");
  });

  it('requireAuth succeeds for staff with granted permission', async () => {
    const token = await signSession(staffUser);
    const req = new NextRequest('http://localhost:3000/api/inventory', {
      headers: {
        cookie: `${SESSION_COOKIE}=${token}`,
      },
    });

    const auth = await requireAuth(req, 'inventory');
    expect(auth.errorResponse).toBeNull();
    expect(auth.user?.sub).toBe(staffUser.sub);
    expect(auth.user?.name).toBe('Chef Mario');
  });

  it('requireAuth succeeds for admin across any permission', async () => {
    const token = await signSession(adminUser);
    const req = new NextRequest('http://localhost:3000/api/finance', {
      headers: {
        authorization: `Bearer ${token}`,
      },
    });

    const auth = await requireAuth(req, 'finance');
    expect(auth.errorResponse).toBeNull();
    expect(auth.user?.role).toBe('admin');
  });
});
