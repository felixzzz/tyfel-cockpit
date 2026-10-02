// /api/admin/users — User Management CRUD (requires user_management permission)
// GET    → list all users
// POST   → create a new user
// PUT    → update user (body must include id)
// DELETE → deactivate user (body must include id)

import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { verifySession, SESSION_COOKIE, LEGACY_SESSION_COOKIE } from '@/lib/session';
import {
  listUsers,
  createUser,
  updateUser,
  getUserById,
  UserRole,
} from '@/lib/db-users';
import { Permission, ALL_PERMISSIONS, ADMIN_DEFAULT_PERMISSIONS, STAFF_DEFAULT_PERMISSIONS, isFullAccessRole } from '@/lib/permissions';

async function requireUserManagement(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value || request.cookies.get(LEGACY_SESSION_COOKIE)?.value;
  if (!token) return null;
  const session = await verifySession(token);
  if (!session) return null;
  // Superadmin/admin always have full access; staff must have explicit user_management permission
  if (isFullAccessRole(session.role)) return session;
  if (!session.permissions.includes('user_management')) return null;
  return session;
}

// ─── GET /api/admin/users ─────────────────────────────────────────────────────
export async function GET(request: NextRequest) {
  const session = await requireUserManagement(request);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const users = await listUsers();
  return NextResponse.json({ users });
}

// ─── POST /api/admin/users ────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  const session = await requireUserManagement(request);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const body = await request.json();
  const email       = (body?.email    || '').trim().toLowerCase();
  const name        = (body?.name     || '').trim();
  const role        = (body?.role     || 'staff') as UserRole;
  const password    = (body?.password || '').trim();
  // If permissions not explicitly provided, use role default
  const permissions: Permission[] = Array.isArray(body?.permissions)
    ? (body.permissions as string[]).filter((p): p is Permission => ALL_PERMISSIONS.includes(p as Permission))
    : role === 'admin' ? ADMIN_DEFAULT_PERMISSIONS : STAFF_DEFAULT_PERMISSIONS;

  if (!email || !name || !password) {
    return NextResponse.json(
      { error: 'Email, nama, dan password wajib diisi.' },
      { status: 400 }
    );
  }
  if (!['superadmin', 'admin', 'staff'].includes(role)) {
    return NextResponse.json({ error: 'Role tidak valid.' }, { status: 400 });
  }
  if (password.length < 6) {
    return NextResponse.json({ error: 'Password minimal 6 karakter.' }, { status: 400 });
  }

  try {
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await createUser({ email, name, role, passwordHash, permissions });
    return NextResponse.json({ success: true, user }, { status: 201 });
  } catch (error) {
    const msg = (error as Error).message ?? '';
    if (msg.includes('unique') || msg.includes('duplicate') || msg.includes('already exists')) {
      return NextResponse.json({ error: 'Email sudah terdaftar.' }, { status: 409 });
    }
    console.error('[Create User]', error);
    return NextResponse.json({ error: 'Server error.' }, { status: 500 });
  }
}

// ─── PUT /api/admin/users ─────────────────────────────────────────────────────
export async function PUT(request: NextRequest) {
  const session = await requireUserManagement(request);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const body = await request.json();
  const id = (body?.id || '').trim();
  if (!id) return NextResponse.json({ error: 'User ID wajib diisi.' }, { status: 400 });

  // Prevent removing the last admin
  if (body?.role === 'staff') {
    const existing = await getUserById(id);
    if (existing?.role === 'admin') {
      const allUsers = await listUsers();
      const adminCount = allUsers.filter((u) => u.role === 'admin' && u.is_active).length;
      if (adminCount <= 1) {
        return NextResponse.json(
          { error: 'Tidak dapat mengubah role admin terakhir.' },
          { status: 400 }
        );
      }
    }
  }

  const updates: Parameters<typeof updateUser>[1] = {};
  if (body?.name      !== undefined) updates.name      = (body.name as string).trim();
  if (body?.role      !== undefined) updates.role      = body.role as UserRole;
  if (body?.is_active !== undefined) updates.is_active = Boolean(body.is_active);
  if (body?.password) {
    if ((body.password as string).length < 6) {
      return NextResponse.json({ error: 'Password minimal 6 karakter.' }, { status: 400 });
    }
    updates.passwordHash = await bcrypt.hash(body.password as string, 12);
  }
  if (Array.isArray(body?.permissions)) {
    updates.permissions = (body.permissions as string[]).filter(
      (p): p is Permission => ALL_PERMISSIONS.includes(p as Permission)
    );
  }

  const user = await updateUser(id, updates);
  if (!user) return NextResponse.json({ error: 'User tidak ditemukan.' }, { status: 404 });
  return NextResponse.json({ success: true, user });
}

// ─── DELETE /api/admin/users ──────────────────────────────────────────────────
export async function DELETE(request: NextRequest) {
  const session = await requireUserManagement(request);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const body = await request.json();
  const id = (body?.id || '').trim();
  if (!id) return NextResponse.json({ error: 'User ID wajib diisi.' }, { status: 400 });

  // Prevent deactivating yourself
  if (id === session.sub) {
    return NextResponse.json({ error: 'Tidak dapat menonaktifkan akun sendiri.' }, { status: 400 });
  }

  const allUsers = await listUsers();
  const adminCount = allUsers.filter((u) => u.role === 'admin' && u.is_active).length;
  const target = allUsers.find((u) => u.id === id);
  if (target?.role === 'admin' && adminCount <= 1) {
    return NextResponse.json(
      { error: 'Tidak dapat menonaktifkan admin terakhir.' },
      { status: 400 }
    );
  }

  const user = await updateUser(id, { is_active: false });
  if (!user) return NextResponse.json({ error: 'User tidak ditemukan.' }, { status: 404 });
  return NextResponse.json({ success: true });
}
