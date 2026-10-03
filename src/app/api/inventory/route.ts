import { NextRequest, NextResponse } from 'next/server';
import {
  getInventoryDashboardData,
  runBOMDepletion,
  adjustInventoryStock,
} from '@/lib/inventory';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') || undefined;
    const status = searchParams.get('status') || undefined;

    const data = await getInventoryDashboardData(category, status);
    return NextResponse.json(data);
  } catch (error) {
    console.error('Inventory GET error:', error);
    return NextResponse.json(
      { error: (error as Error).message || 'Failed to fetch inventory' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    if (action === 'deplete_bom') {
      const result = await runBOMDepletion();
      return NextResponse.json({ success: true, result });
    }

    if (action === 'adjust_stock') {
      const { ingredientId, newStock, reason, notes } = body;
      if (!ingredientId || newStock === undefined) {
        return NextResponse.json(
          { error: 'Missing ingredientId or newStock' },
          { status: 400 }
        );
      }
      const result = await adjustInventoryStock(
        ingredientId,
        Number(newStock),
        reason || 'ADJUSTMENT_WASTAGE',
        notes || ''
      );
      return NextResponse.json(result);
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Inventory POST error:', error);
    return NextResponse.json(
      { error: (error as Error).message || 'Failed to update inventory' },
      { status: 500 }
    );
  }
}
