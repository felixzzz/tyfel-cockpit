import { NextRequest, NextResponse } from 'next/server';
import { lookupCateringCustomerByPhone } from '@/lib/catering';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const phone = String(body?.phone || '');
    if (!phone) {
      return NextResponse.json(
        { success: false, error: 'Phone number is required' },
        { status: 400 }
      );
    }

    const customerId = await lookupCateringCustomerByPhone(phone);
    if (!customerId) {
      return NextResponse.json(
        { success: false, error: 'Nomor WhatsApp belum terdaftar di katering Herbox.' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, customerId });
  } catch (err: unknown) {
    console.error('Error looking up catering customer:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to look up subscriber' },
      { status: 500 }
    );
  }
}
