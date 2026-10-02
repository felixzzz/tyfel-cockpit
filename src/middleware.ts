// Tyfel Hub · Server-side Route Protection Middleware
// Runs before any page/API is rendered to enforce authentication.

import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const SESSION_COOKIE = 'tyfel_ops_session';
const LEGACY_SESSION_COOKIE = 'maus_ops_session';

// Routes that don't require authentication
const PUBLIC_PATHS = new Set([
  '/api/auth/login',
  '/api/auth/staff',
]);

// Route prefixes that don't require authentication
const PUBLIC_PREFIXES = [
  '/catering/portal',     // Customer-facing portal — no staff login required
  '/api/catering/portal', // Portal API
  '/_next',               // Next.js internals
  '/favicon.ico',
];

function isPublicPath(pathname: string): boolean {
  if (PUBLIC_PATHS.has(pathname)) return true;
  return PUBLIC_PREFIXES.some(prefix => pathname.startsWith(prefix));
}

function getJwtSecret(): Uint8Array | null {
  const raw = process.env.AUTH_JWT_SECRET;
  if (!raw) return null;
  return new TextEncoder().encode(raw);
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public routes through
  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  // Allow static assets and Next.js internals
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/public') ||
    pathname.match(/\.(svg|png|jpg|jpeg|gif|ico|css|js|woff|woff2)$/)
  ) {
    return NextResponse.next();
  }

  const token =
    request.cookies.get(SESSION_COOKIE)?.value ||
    request.cookies.get(LEGACY_SESSION_COOKIE)?.value;

  // No token — for API routes, return 401. For pages, let client-side handle redirect.
  if (!token) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    // For page routes, let the client-side AppShell handle the login screen
    // (it already does this). We don't redirect to prevent flash issues.
    return NextResponse.next();
  }

  // Verify token
  const secret = getJwtSecret();
  if (!secret) {
    // No secret configured — can't verify tokens
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }
    return NextResponse.next();
  }

  try {
    await jwtVerify(token, secret);
    return NextResponse.next();
  } catch {
    // Invalid/expired token — clear it
    if (pathname.startsWith('/api/')) {
      const response = NextResponse.json(
        { error: 'Session expired. Please log in again.' },
        { status: 401 }
      );
      response.cookies.delete(SESSION_COOKIE);
      response.cookies.delete(LEGACY_SESSION_COOKIE);
      return response;
    }

    // For pages, clear the bad cookie and let client-side handle login
    const response = NextResponse.next();
    response.cookies.delete(SESSION_COOKIE);
    response.cookies.delete(LEGACY_SESSION_COOKIE);
    return response;
  }
}

export const config = {
  // Run middleware on all routes except static files
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
};
