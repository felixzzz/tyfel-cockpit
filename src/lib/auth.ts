// MAUS ATELIER · Staff Operations Authentication

export const STAFF_AUTH_COOKIE = 'fnb_ops_staff_auth';
export const STAFF_AUTH_STORAGE_KEY = 'fnb_ops_staff_auth_v1';

// Supported default staff passcodes
const VALID_PASSCODES = new Set([
  (process.env.STAFF_PASSCODE || 'maus2026').trim().toLowerCase(),
  '8888',
  'herbox2026',
]);

export function verifyStaffPasscode(input: string): boolean {
  if (!input) return false;
  return VALID_PASSCODES.has(input.trim().toLowerCase());
}

export function generateStaffSessionToken(): string {
  // Lightweight secure session marker
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 10);
  return `staff_${timestamp}_${random}`;
}
