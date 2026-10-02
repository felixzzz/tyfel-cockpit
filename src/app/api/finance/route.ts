import { NextRequest, NextResponse } from 'next/server';
import {
  getFinancialStatementReport,
  getBankTransactionsList,
  updateTransactionCategory,
  reseedBankStatements,
} from '@/lib/finance';
import { FINANCE_CATEGORIES } from '@/lib/finance-categories';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const view = searchParams.get('view') || 'report';
    const period = searchParams.get('period') || undefined;
    const bank = searchParams.get('bank') || undefined;
    const startDate = searchParams.get('startDate') || undefined;
    const endDate = searchParams.get('endDate') || undefined;

    if (view === 'transactions') {
      const category = searchParams.get('category') || undefined;
      const txType = searchParams.get('txType') || undefined;
      const search = searchParams.get('search') || undefined;
      const limit = parseInt(searchParams.get('limit') || '100', 10);
      const offset = parseInt(searchParams.get('offset') || '0', 10);

      const data = await getBankTransactionsList({
        period,
        bank,
        category,
        txType,
        search,
        limit,
        offset,
      });

      return NextResponse.json({
        success: true,
        transactions: data.transactions,
        totalCount: data.totalCount,
        categories: FINANCE_CATEGORIES,
      });
    }

    // Default: Financial Statement Report (P&L, Cash Flow, Balances)
    const report = await getFinancialStatementReport({
      period,
      bank,
      startDate,
      endDate,
    });

    return NextResponse.json({
      success: true,
      report,
      categories: FINANCE_CATEGORIES,
    });
  } catch (err: unknown) {
    console.error('[API /api/finance GET Error]', err);
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { txId, category, subcategory, applyToSimilar } = body;

    if (!txId || !category) {
      return NextResponse.json(
        { success: false, error: 'txId and category are required' },
        { status: 400 }
      );
    }

    const res = await updateTransactionCategory(
      txId,
      category,
      subcategory || 'General',
      Boolean(applyToSimilar)
    );

    return NextResponse.json({ success: true, updatedCount: res.updatedCount });
  } catch (err: unknown) {
    console.error('[API /api/finance PATCH Error]', err);
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body;

    if (action === 'reseed') {
      await reseedBankStatements(true);
      return NextResponse.json({
        success: true,
        message: 'Successfully reseeded verified statements for July, August, and September 2026.',
      });
    }

    return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 });
  } catch (err: unknown) {
    console.error('[API /api/finance POST Error]', err);
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
