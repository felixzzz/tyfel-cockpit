'use client';

import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  Flame,
} from 'lucide-react';

interface RecentOrderSla {
  order_id: string;
  brand: string;
  branch: string;
  status: string;
  prep_time_minutes: number;
  kpt_sla_breach: boolean;
  kpt_red_alert: boolean;
  created_at: string;
}

interface SlaStats {
  total_orders: number;
  breach_count: number;
  red_alert_count: number;
  avg_prep_time: number;
}

export function RealtimeKitchenAlerts() {
  const [connected, setConnected] = useState(false);
  const [stats, setStats] = useState<SlaStats | null>(null);
  const [recentOrders, setRecentOrders] = useState<RecentOrderSla[]>([]);
  const [latestAlert, setLatestAlert] = useState<string | null>(null);
  const [lastPing, setLastPing] = useState<string>('');

  useEffect(() => {
    let eventSource: EventSource | null = null;
    let reconnectTimeout: NodeJS.Timeout | null = null;

    function connect() {
      try {
        eventSource = new EventSource('/api/realtime/kitchen');

        eventSource.addEventListener('connected', () => {
          setConnected(true);
        });

        eventSource.addEventListener('sla_snapshot', (e) => {
          try {
            const data = JSON.parse(e.data);
            if (data.stats) setStats(data.stats);
            if (data.recentOrders) setRecentOrders(data.recentOrders);
            setConnected(true);
            setLastPing(new Date().toLocaleTimeString('id-ID'));
          } catch (err) {
            console.error('Error parsing sla_snapshot:', err);
          }
        });

        eventSource.addEventListener('heartbeat', (e) => {
          try {
            const data = JSON.parse(e.data);
            setConnected(true);
            setLastPing(new Date().toLocaleTimeString('id-ID'));
            if (data.latestOrder?.kpt_sla_breach) {
              setLatestAlert(
                `SLA Breach Alert: Order #${data.latestOrder.order_id} (${data.latestOrder.brand}) took ${data.latestOrder.prep_time_minutes}m prep time!`
              );
            }
          } catch {
            // ignore
          }
        });

        eventSource.onerror = () => {
          setConnected(false);
          if (eventSource) {
            eventSource.close();
            eventSource = null;
          }
          // Attempt reconnect after 5s
          reconnectTimeout = setTimeout(connect, 5000);
        };
      } catch {
        setConnected(false);
        reconnectTimeout = setTimeout(connect, 5000);
      }
    }

    connect();

    return () => {
      if (eventSource) eventSource.close();
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
    };
  }, []);

  const breachRate =
    stats && stats.total_orders > 0
      ? ((Number(stats.breach_count) / Number(stats.total_orders)) * 100).toFixed(1)
      : '0.0';

  return (
    <div className="bg-gradient-to-r from-emerald-500/10 via-[var(--bg-surface)] to-amber-500/10 border border-[var(--border-strong)] rounded-2xl p-4 shadow-sm space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="relative flex items-center justify-center">
            {connected ? (
              <>
                <span className="animate-ping absolute inline-flex h-3 w-3 rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
              </>
            ) : (
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[var(--text-main)] uppercase tracking-wider flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-amber-500" />
                Supabase Realtime Kitchen Stream
              </span>
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-semibold ${
                  connected
                    ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                    : 'bg-rose-500/15 text-rose-700 dark:text-rose-300'
                }`}
              >
                {connected ? 'LIVE (CONNECTED)' : 'RECONNECTING...'}
              </span>
            </div>
            <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
              Instant order telemetry, KPT prep bottlenecks &amp; SLA breach monitors
            </p>
          </div>
        </div>

        {/* Live Metrics Quick Counters */}
        <div className="flex items-center gap-4 text-xs font-mono self-start sm:self-auto">
          <div className="text-right">
            <span className="text-[10px] text-[var(--text-muted)] block uppercase">
              Avg Prep Time
            </span>
            <span className="font-bold text-[var(--text-main)]">
              {stats?.avg_prep_time ?? 0}m
            </span>
          </div>

          <div className="text-right">
            <span className="text-[10px] text-[var(--text-muted)] block uppercase">
              Breach Rate
            </span>
            <span
              className={`font-bold ${
                Number(breachRate) > 10
                  ? 'text-rose-600 dark:text-rose-400'
                  : 'text-emerald-600 dark:text-emerald-400'
              }`}
            >
              {breachRate}% ({stats?.breach_count ?? 0})
            </span>
          </div>

          <div className="text-right">
            <span className="text-[10px] text-[var(--text-muted)] block uppercase">
              Last Ping
            </span>
            <span className="text-[var(--text-muted)]">{lastPing || 'Just now'}</span>
          </div>
        </div>
      </div>

      {/* Active Breach Alert Banner */}
      {latestAlert && (
        <div className="p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs flex items-center justify-between animate-pulse">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span className="font-semibold">{latestAlert}</span>
          </div>
          <button
            onClick={() => setLatestAlert(null)}
            className="text-[11px] underline opacity-80 hover:opacity-100 ml-2"
          >
            Acknowledge
          </button>
        </div>
      )}

      {/* Live Recent Kitchen Order Tickets */}
      {recentOrders.length > 0 && (
        <div className="pt-2 border-t border-[var(--border-subtle)]">
          <div className="flex items-center justify-between text-[11px] text-[var(--text-muted)] mb-2 font-medium">
            <span>Recent Kitchen Tickets</span>
            <span>Greenville Flagship &amp; Kemang Cloud</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
            {recentOrders.slice(0, 5).map((order) => {
              const isBreach = order.kpt_sla_breach;
              const isRedAlert = order.kpt_red_alert;
              return (
                <div
                  key={order.order_id}
                  className={`p-2 rounded-xl border text-[11px] font-mono transition ${
                    isRedAlert
                      ? 'bg-rose-500/15 border-rose-500/40 text-rose-700 dark:text-rose-300'
                      : isBreach
                      ? 'bg-amber-500/15 border-amber-500/40 text-amber-700 dark:text-amber-300'
                      : 'bg-[var(--bg-main)] border-[var(--border-subtle)] text-[var(--text-secondary)]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold truncate">#{order.order_id.slice(-6)}</span>
                    <span className="text-[10px]">
                      {order.prep_time_minutes > 0 ? `${order.prep_time_minutes}m` : 'Ready'}
                    </span>
                  </div>
                  <div className="text-[10px] text-[var(--text-muted)] truncate mt-0.5">
                    {order.brand}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
