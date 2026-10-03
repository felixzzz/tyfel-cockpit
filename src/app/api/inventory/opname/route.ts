import { NextResponse } from 'next/server';
import { submitStockOpnameAudit, getRecentStockOpnameAudits } from '@/lib/inventory';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const audits = await getRecentStockOpnameAudits(10);
    return NextResponse.json({ audits });
  } catch (err: unknown) {
    console.error('Error fetching stock opname audits:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { branch, conductedBy, notes, counts } = body;

    if (!Array.isArray(counts) || counts.length === 0) {
      return NextResponse.json(
        { error: 'Counts array must contain at least 1 ingredient' },
        { status: 400 }
      );
    }

    const auditRecord = await submitStockOpnameAudit({
      branch,
      conductedBy,
      notes,
      counts,
    });

    return NextResponse.json({
      success: true,
      audit: auditRecord,
    });
  } catch (err: unknown) {
    console.error('Error recording stock opname:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to record stock opname' },
      { status: 500 }
    );
  }
}
