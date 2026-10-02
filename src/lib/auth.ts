// Tyfel Hub · Staff Operations Authentication

export const STAFF_AUTH_COOKIE = 'fnb_ops_staff_auth';
export const STAFF_AUTH_STORAGE_KEY = 'fnb_ops_staff_auth_v1';

// Staff passcodes MUST be configured via environment variable.
// Set STAFF_PASSCODES as a comma-separated list, e.g.: STAFF_PASSCODES="secretcode1,secretcode2"
function getValidPasscodes(): Set<string> {
  const raw = process.env.STAFF_PASSCODES || process.env.STAFF_PASSCODE || '';
  if (!raw) {
    console.warn('[Auth] No STAFF_PASSCODES or STAFF_PASSCODE env var set. Legacy passcode auth will reject all attempts.');
    return new Set();
  }
  return new Set(
    raw.split(',').map(p => p.trim().toLowerCase()).filter(Boolean)
  );
}

export function verifyStaffPasscode(input: string): boolean {
  if (!input) return false;
  return getValidPasscodes().has(input.trim().toLowerCase());
}

export function generateStaffSessionToken(): string {
  const timestamp = Date.now();
  const random = crypto.randomUUID().replace(/-/g, '').slice(0, 16);
  return `staff_${timestamp}_${random}`;
}

