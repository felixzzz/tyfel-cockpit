import { NextResponse } from 'next/server';
import { runQuery } from '@/lib/duckdb';

export const dynamic = 'force-dynamic';

export async function GET() {
  const startTime = Date.now();

  try {
    const res = await runQuery<{ check: number }>('SELECT 1 as check;');
    const latencyMs = Date.now() - startTime;

    return NextResponse.json({
      status: 'ok',
      service: 'tyfel-cockpit',
      timestamp: new Date().toISOString(),
      database: {
        status: res?.[0]?.check === 1 ? 'connected' : 'unexpected_response',
        latencyMs,
        provider: 'supabase-postgresql',
      },
      version: '0.1.0',
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'error',
        service: 'tyfel-cockpit',
        timestamp: new Date().toISOString(),
        database: {
          status: 'disconnected',
          error: error instanceof Error ? error.message : String(error),
        },
      },
      { status: 503 }
    );
  }
}
