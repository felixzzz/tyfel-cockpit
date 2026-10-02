import { NextRequest, NextResponse } from 'next/server';
import {
  verifyStaffPasscode,
  generateStaffSessionToken,
  STAFF_AUTH_COOKIE,
} from '@/lib/auth';

export async function GET(request: NextRequest) {
  const token = request.cookies.get(STAFF_AUTH_COOKIE)?.value;
  const authenticated = Boolean(token && token.startsWith('staff_'));
  return NextResponse.json({ authenticated });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const passcode = body?.passcode || '';

    if (!verifyStaffPasscode(passcode)) {
      return NextResponse.json(
        { success: false, error: 'Invalid staff passcode. Please try again.' },
        { status: 401 }
      );
    }

    const token = generateStaffSessionToken();
    const response = NextResponse.json({
      success: true,
      message: 'Staff authenticated successfully',
    });

    // 30 days session cookie
    response.cookies.set({
      name: STAFF_AUTH_COOKIE,
      value: token,
      httpOnly: true,
      path: '/',
      maxAge: 60 * 60 * 24 * 30,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    });

    return response;
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  const response = NextResponse.json({
    success: true,
    message: 'Staff session locked/terminated',
  });
  response.cookies.delete(STAFF_AUTH_COOKIE);
  return response;
}
