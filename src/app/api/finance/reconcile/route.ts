import { NextRequest, NextResponse } from 'next/server';
import { getSmartBankReconciliation } from '@/lib/finance';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const bank = searchParams.get('bank') || undefined;
    const period = searchParams.get('period') || undefined;

    const data = await getSmartBankReconciliation({ bank, period });
    return NextResponse.json(data);
  } catch (error) {
    console.error('Reconciliation API error:', error);
    return NextResponse.json(
      { error: (error as Error).message || 'Failed to fetch reconciliation' },
      { status: 500 }
    );
  }
}
