import { describe, it, expect } from 'vitest';
import {
  hasPermission,
  isFullAccessRole,
  parsePermissions,
  serializePermissions,
  getEffectivePermissions,
  ALL_PERMISSIONS,
} from '../permissions';

describe('Permissions & RBAC Engine', () => {
  it('correctly identifies full access roles', () => {
    expect(isFullAccessRole('superadmin')).toBe(true);
    expect(isFullAccessRole('admin')).toBe(true);
    expect(isFullAccessRole('staff')).toBe(false);
    expect(isFullAccessRole('guest')).toBe(false);
  });

  it('superadmin and admin automatically possess all permissions', () => {
    for (const perm of ALL_PERMISSIONS) {
      expect(hasPermission([], perm, 'superadmin')).toBe(true);
      expect(hasPermission([], perm, 'admin')).toBe(true);
    }
  });

  it('staff only possesses explicitly assigned permissions', () => {
    const staffPerms = ['attendance', 'recipes'] as const;
    expect(hasPermission([...staffPerms], 'attendance', 'staff')).toBe(true);
    expect(hasPermission([...staffPerms], 'recipes', 'staff')).toBe(true);
    expect(hasPermission([...staffPerms], 'finance', 'staff')).toBe(false);
    expect(hasPermission([...staffPerms], 'user_management', 'staff')).toBe(false);
  });

  it('safely serializes and parses permissions JSON', () => {
    const original = ['finance', 'attendance'] as const;
    const serialized = serializePermissions([...original]);
    expect(typeof serialized).toBe('string');

    const parsed = parsePermissions(serialized);
    expect(parsed).toEqual(['finance', 'attendance']);

    // Handles malformed JSON gracefully
    expect(parsePermissions('invalid json')).toEqual([]);
    expect(parsePermissions(null)).toEqual([]);
    expect(parsePermissions(undefined)).toEqual([]);
  });

  it('returns all permissions for full access roles in getEffectivePermissions', () => {
    const effAdmin = getEffectivePermissions([], 'admin');
    expect(effAdmin.length).toBe(ALL_PERMISSIONS.length);

    const effStaff = getEffectivePermissions(['catering'], 'staff');
    expect(effStaff).toEqual(['catering']);
  });
});
