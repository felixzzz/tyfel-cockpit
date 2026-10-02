// Tyfel Hub · Feature Permissions
// Single source of truth for all permission keys.

export const ALL_PERMISSIONS = [
  'overview',
  'finance',
  'recipes',
  'catering',
  'attendance',
  'ingest',
  'brands',
  'user_management',
] as const;

export type Permission = (typeof ALL_PERMISSIONS)[number];

export type UserRole = 'superadmin' | 'admin' | 'staff';

export const PERMISSION_LABELS: Record<Permission, { label: string; description: string; icon: string }> = {
  overview:        { label: 'Executive Overview',    description: 'Dashboard, revenue KPIs, and multi-brand analytics', icon: 'LayoutDashboard' },
  finance:         { label: 'Financial Statements',  description: 'Bank statement ingest, categorization, P&L, and financial reports', icon: 'Landmark' },
  recipes:         { label: 'Recipes & COGS',        description: 'Recipe BOM builder and ingredient cost intelligence',  icon: 'Scale' },
  catering:        { label: 'Herbox Catering',       description: 'Catering CRM, schedule matrix, and subscriber portal', icon: 'CalendarRange' },
  attendance:      { label: 'Staff & Payslips',      description: 'Payroll, attendance records, and staff payslips',      icon: 'Users' },
  ingest:          { label: 'Data Sync',             description: 'CSV upload and warehouse data ingestion',              icon: 'Database' },
  brands:          { label: 'Brand Pages',           description: 'Per-brand telemetry pages for all 5 concepts',        icon: 'ChefHat' },
  user_management: { label: 'User Management',       description: 'Create and manage staff user accounts and access',    icon: 'UserCog' },
};

/** All permissions granted to superadmin and admin roles */
export const ADMIN_DEFAULT_PERMISSIONS: Permission[] = [...ALL_PERMISSIONS];

/** Default permissions for a new staff member (none by default — admin grants explicitly) */
export const STAFF_DEFAULT_PERMISSIONS: Permission[] = [];

/** Roles that automatically have full access to everything */
const FULL_ACCESS_ROLES: ReadonlySet<string> = new Set(['superadmin', 'admin']);

/** Check if a role has implicit full access (superadmin / admin) */
export function isFullAccessRole(role: string): boolean {
  return FULL_ACCESS_ROLES.has(role);
}

/** Parse raw JSON string from DB into a typed array */
export function parsePermissions(raw: string | null | undefined): Permission[] {
  if (!raw) return [];
  try {
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return [];
    return arr.filter((p): p is Permission => ALL_PERMISSIONS.includes(p as Permission));
  } catch {
    return [];
  }
}

/** Serialize permissions array to JSON string for DB storage */
export function serializePermissions(perms: Permission[]): string {
  return JSON.stringify([...new Set(perms)]);
}

/**
 * Check if a user has a specific permission.
 * Superadmin and admin roles ALWAYS have all permissions regardless of stored array.
 */
export function hasPermission(permissions: Permission[], perm: Permission, role?: string): boolean {
  if (role && isFullAccessRole(role)) return true;
  return permissions.includes(perm);
}

/** Get the effective permissions for a user, accounting for role-based overrides */
export function getEffectivePermissions(permissions: Permission[], role?: string): Permission[] {
  if (role && isFullAccessRole(role)) return [...ALL_PERMISSIONS];
  return permissions;
}

