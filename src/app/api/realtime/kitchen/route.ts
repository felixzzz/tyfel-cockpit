import { NextRequest } from 'next/server';
import { runQuery } from '@/lib/duckdb';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      let isClosed = false;

      req.signal.addEventListener('abort', () => {
        isClosed = true;
        try {
          controller.close();
        } catch {
          // ignore
        }
      });

      // Send initial connection handshake
      const sendEvent = (event: string, data: unknown) => {
        if (isClosed) return;
        try {
          controller.enqueue(
            encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
          );
        } catch {
          isClosed = true;
        }
      };

      sendEvent('connected', {
        timestamp: new Date().toISOString(),
        message: 'Supabase Realtime Kitchen SLA Stream connected',
      });

      // Initial Kitchen SLA Snapshot
      try {
        const recentOrders = await runQuery<{
          order_id: string;
          brand: string;
          branch: string;
          status: string;
          prep_time_minutes: number;
          kpt_sla_breach: boolean;
          kpt_red_alert: boolean;
          created_at: string;
        }>(`
          SELECT
            order_id, brand, branch, status,
            ROUND(prep_time_minutes::numeric, 1) as prep_time_minutes,
            kpt_sla_breach, kpt_red_alert,
            created_at
          FROM fact_orders
          WHERE created_at IS NOT NULL
          ORDER BY created_at DESC
          LIMIT 10;
        `);

        const breachStats = await runQuery<{
          total_orders: number;
          breach_count: number;
          red_alert_count: number;
          avg_prep_time: number;
        }>(`
          SELECT
            COUNT(*) as total_orders,
            COUNT(CASE WHEN kpt_sla_breach = true THEN 1 END) as breach_count,
            COUNT(CASE WHEN kpt_red_alert = true THEN 1 END) as red_alert_count,
            COALESCE(ROUND(AVG(prep_time_minutes)::numeric, 1), 0) as avg_prep_time
          FROM fact_orders
          WHERE created_at >= (SELECT MAX(created_at) - INTERVAL '7 days' FROM fact_orders);
        `);

        sendEvent('sla_snapshot', {
          stats: breachStats[0] || {},
          recentOrders,
          timestamp: new Date().toISOString(),
        });
      } catch (err) {
        console.error('Realtime initial snapshot error:', err);
      }

      // Heartbeat interval and polling check every 10 seconds
      const timer = setInterval(async () => {
        if (isClosed) {
          clearInterval(timer);
          return;
        }

        try {
          // Check for latest orders
          const latest = await runQuery<{
            order_id: string;
            brand: string;
            prep_time_minutes: number;
            kpt_sla_breach: boolean;
            created_at: string;
          }>(`
            SELECT order_id, brand, ROUND(prep_time_minutes::numeric, 1) as prep_time_minutes, kpt_sla_breach, created_at
            FROM fact_orders
            WHERE created_at IS NOT NULL
            ORDER BY created_at DESC
            LIMIT 1;
          `);

          sendEvent('heartbeat', {
            status: 'live',
            timestamp: new Date().toISOString(),
            latestOrder: latest[0] || null,
          });
        } catch {
          // continue heartbeat
          sendEvent('ping', { time: Date.now() });
        }
      }, 10000);

      req.signal.addEventListener('abort', () => {
        clearInterval(timer);
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
