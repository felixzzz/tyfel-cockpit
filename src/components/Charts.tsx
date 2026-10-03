'use client';

import React, { useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  Line,
  ComposedChart,
} from 'recharts';
import type {
  SkuParetoItem,
  BrandChannelStats,
  BrandHourlyStats,
  DailyTrendPoint,
  WeeklyDayPerformancePoint,
  BranchStats,
  ChannelStats,
} from '@/lib/queries';
import { getChannelColor } from '@/lib/brandTheme';

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount);
}

// Theme-Aware Tactile Tooltip Container
function GlassTooltip({
  title,
  items,
  footer,
}: {
  title?: React.ReactNode;
  items: { label: string; value: string | number; color?: string; badge?: string }[];
  footer?: React.ReactNode;
}) {
  return (
    <div className="bg-[var(--bg-surface)]/95 backdrop-blur-xl border border-[var(--border-strong)] rounded-xl p-3.5 shadow-xl min-w-[210px] text-xs space-y-2 pointer-events-none">
      {title && (
        <div className="font-semibold text-[var(--text-primary)] pb-1.5 border-b border-[var(--border-default)] flex items-center justify-between gap-2">
          {title}
        </div>
      )}
      <div className="space-y-1.5">
        {items.map((item, i) => (
          <div key={i} className="flex items-center justify-between gap-3 text-[11px]">
            <span className="text-[var(--text-secondary)] flex items-center gap-1.5">
              {item.color && (
                <span
                  className="w-2 h-2 rounded-full inline-block shrink-0"
                  style={{ backgroundColor: item.color }}
                />
              )}
              {item.label}
            </span>
            <span className="font-mono font-semibold text-[var(--text-primary)] tabular-nums">
              {item.value}
              {item.badge && (
                <span className="ml-1 text-[10px] text-[var(--text-muted)] font-normal">({item.badge})</span>
              )}
            </span>
          </div>
        ))}
      </div>
      {footer && (
        <div className="pt-1.5 border-t border-[var(--border-subtle)] text-[10px] text-[var(--text-muted)]">
          {footer}
        </div>
      )}
    </div>
  );
}

/* =========================================================================
   1. Brand Revenue & Unit Economics (Executive Overview)
   ========================================================================= */

interface BrandChartProps {
  data: {
    brand: string;
    gross_gmv: number;
    net_payout: number;
    merchant_promo_burn: number;
  }[];
}

export function BrandRevenueChart({ data }: BrandChartProps) {
  const aggregated: Record<string, { brand: string; gmv: number; net: number; promo: number }> = {};
  data.forEach((d) => {
    if (!aggregated[d.brand]) {
      aggregated[d.brand] = { brand: d.brand, gmv: 0, net: 0, promo: 0 };
    }
    aggregated[d.brand].gmv += d.gross_gmv;
    aggregated[d.brand].net += d.net_payout;
    aggregated[d.brand].promo += d.merchant_promo_burn;
  });

  const chartData = Object.values(aggregated).map((d) => ({
    name: d.brand.replace('American Breakfast Club', 'ABC').replace('LA Breakfast Club', 'LABC'),
    fullName: d.brand,
    GMV: Math.round(d.gmv / 1000),
    'Net Payout': Math.round(d.net / 1000),
    'Promo Burn': Math.round(d.promo / 1000),
    rawGmv: d.gmv,
    rawNet: d.net,
    rawPromo: d.promo,
    netRate: d.gmv > 0 ? ((d.net / d.gmv) * 100).toFixed(1) : '0',
  }));

  return (
    <div className="w-full h-80">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 12, right: 12, left: 0, bottom: 8 }} barGap={6}>
          <defs>
            <linearGradient id="gmvBarGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0284c7" stopOpacity={0.92} />
              <stop offset="100%" stopColor="#0369a1" stopOpacity={0.72} />
            </linearGradient>
            <linearGradient id="netBarGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity={0.95} />
              <stop offset="100%" stopColor="#059669" stopOpacity={0.75} />
            </linearGradient>
            <linearGradient id="promoBarGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#e11d48" stopOpacity={0.9} />
              <stop offset="100%" stopColor="#be123c" stopOpacity={0.7} />
            </linearGradient>
          </defs>

          <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" vertical={false} />

          <XAxis
            dataKey="name"
            stroke="var(--chart-axis)"
            fontSize={12}
            tickLine={false}
            axisLine={{ stroke: 'var(--border-default)' }}
            dy={6}
          />
          <YAxis
            stroke="var(--chart-axis)"
            fontSize={12}
            tickLine={false}
            axisLine={{ stroke: 'var(--border-default)' }}
            tickFormatter={(val) => `Rp${val}k`}
            dx={-4}
          />

          <Tooltip
            cursor={{ fill: 'var(--chart-cursor)' }}
            content={({ active, payload }) => {
              if (!active || !payload || !payload.length) return null;
              const dataPoint = payload[0].payload;
              return (
                <GlassTooltip
                  title={
                    <span className="text-[var(--text-primary)]">
                      {dataPoint.fullName}
                      <span className="ml-2 font-mono text-[10px] badge-emerald px-2 py-0.5 rounded">
                        {dataPoint.netRate}% Realized
                      </span>
                    </span>
                  }
                  items={[
                    { label: 'Gross GMV', value: formatRupiah(dataPoint.rawGmv), color: '#0284c7' },
                    { label: 'Net Settlement', value: formatRupiah(dataPoint.rawNet), color: '#10b981' },
                    { label: 'Merchant Promo Burn', value: formatRupiah(dataPoint.rawPromo), color: '#e11d48' },
                  ]}
                  footer={<span>Unit economics across consolidated branches</span>}
                />
              );
            }}
          />

          <Legend
            verticalAlign="top"
            align="right"
            wrapperStyle={{ paddingBottom: '16px', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}
            formatter={(val) => <span className="text-[var(--text-secondary)] font-semibold ml-1 mr-3">{val}</span>}
          />

          <Bar isAnimationActive={false} dataKey="GMV" fill="url(#gmvBarGrad)" radius={[5, 5, 0, 0]} maxBarSize={32} />
          <Bar isAnimationActive={false} dataKey="Net Payout" fill="url(#netBarGrad)" radius={[5, 5, 0, 0]} maxBarSize={32} />
          <Bar isAnimationActive={false} dataKey="Promo Burn" fill="url(#promoBarGrad)" radius={[5, 5, 0, 0]} maxBarSize={32} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/* =========================================================================
   2. Channel Distribution (GrabFood vs GoFood vs POS)
   ========================================================================= */

const FALLBACK_PALETTE = ['#10b981', '#e11d48', '#7c3aed', '#0284c7', '#d97706'];

interface ChannelChartProps {
  data: {
    provider: string;
    gross_gmv: number;
    net_payout: number;
    order_count?: number;
  }[];
}

export function ChannelPieChart({ data }: ChannelChartProps) {
  const totalGmv = data.reduce((acc, curr) => acc + curr.gross_gmv, 0);

  const chartData = data.map((d) => ({
    name: d.provider,
    value: d.gross_gmv,
    orders: d.order_count || 0,
    net: d.net_payout,
    share: totalGmv > 0 ? ((d.gross_gmv / totalGmv) * 100).toFixed(1) : '0',
    color: getChannelColor(d.provider),
  }));

  return (
    <div className="w-full h-64 flex items-center justify-center relative">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            isAnimationActive={false}
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={62}
            outerRadius={90}
            paddingAngle={4}
            dataKey="value"
            stroke="var(--bg-surface)"
            strokeWidth={3}
          >
            {chartData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.color || FALLBACK_PALETTE[index % FALLBACK_PALETTE.length]}
              />
            ))}
          </Pie>

          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload || !payload.length) return null;
              const d = payload[0].payload;
              return (
                <GlassTooltip
                  title={
                    <span className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                      <span>{d.name}</span>
                    </span>
                  }
                  items={[
                    { label: 'Platform GMV', value: formatRupiah(d.value) },
                    { label: 'Volume Share', value: `${d.share}%` },
                    ...(d.orders > 0 ? [{ label: 'Order Count', value: `${d.orders} completed` }] : []),
                  ]}
                  footer={<span>Net settlement: {formatRupiah(d.net)}</span>}
                />
              );
            }}
          />
        </PieChart>
      </ResponsiveContainer>

      {/* Donut Center Summary Badge */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <span className="text-[10px] uppercase font-mono tracking-wider text-[var(--text-muted)]">Total GMV</span>
        <span className="text-base sm:text-lg font-mono font-bold text-[var(--text-primary)] mt-0.5 tabular-nums">
          {totalGmv >= 1_000_000 ? `Rp${(totalGmv / 1_000_000).toFixed(1)}M` : formatRupiah(totalGmv)}
        </span>
      </div>
    </div>
  );
}

/* =========================================================================
   3. Hourly Order Velocity Cadence (24-Hour Cadence)
   ========================================================================= */

interface HourlyChartProps {
  data: {
    hour_of_day: number;
    order_count: number;
    gross_gmv: number;
  }[];
}

export function HourlyOrderChart({ data }: HourlyChartProps) {
  const chartData = data.map((d) => ({
    hour: `${String(d.hour_of_day).padStart(2, '0')}:00`,
    Orders: d.order_count,
    GMV: Math.round(d.gross_gmv / 1000),
    rawGmv: d.gross_gmv,
    isRush: (d.hour_of_day >= 11 && d.hour_of_day <= 13) || (d.hour_of_day >= 18 && d.hour_of_day <= 20),
  }));

  return (
    <div className="w-full h-72">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 12, right: 16, left: -10, bottom: 8 }}>
          <defs>
            <linearGradient id="ordersAreaGlow" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#c85a32" stopOpacity={0.35} />
              <stop offset="75%" stopColor="#c85a32" stopOpacity={0.06} />
              <stop offset="100%" stopColor="#c85a32" stopOpacity={0.0} />
            </linearGradient>
            <linearGradient id="orderStroke" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#d97706" />
              <stop offset="50%" stopColor="#c85a32" />
              <stop offset="100%" stopColor="#1b6b4a" />
            </linearGradient>
          </defs>

          <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" vertical={false} />

          <XAxis
            dataKey="hour"
            stroke="var(--chart-axis)"
            fontSize={12}
            tickLine={false}
            axisLine={{ stroke: 'var(--border-default)' }}
            dy={6}
          />
          <YAxis
            stroke="var(--chart-axis)"
            fontSize={12}
            tickLine={false}
            axisLine={{ stroke: 'var(--border-default)' }}
          />

          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload || !payload.length) return null;
              const d = payload[0].payload;
              return (
                <GlassTooltip
                  title={
                    <span className="flex items-center justify-between w-full">
                      <span>Window: {d.hour}</span>
                      {d.isRush && (
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded badge-amber">
                          Peak Rush
                        </span>
                      )}
                    </span>
                  }
                  items={[
                    { label: 'Completed Orders', value: `${d.Orders} tickets`, color: '#c85a32' },
                    { label: 'Hour Gross GMV', value: formatRupiah(d.rawGmv), color: '#1b6b4a' },
                  ]}
                  footer={<span>Kitchen batch prep priority window</span>}
                />
              );
            }}
          />

          <Area
            isAnimationActive={false}
            type="monotone"
            dataKey="Orders"
            stroke="url(#orderStroke)"
            strokeWidth={2.5}
            fillOpacity={1}
            fill="url(#ordersAreaGlow)"
            dot={{ r: 2.5, fill: '#c85a32', stroke: 'var(--bg-surface)', strokeWidth: 1.5 }}
            activeDot={{ r: 5, fill: '#c85a32', stroke: 'var(--bg-surface)', strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

/* =========================================================================
   4. SKU Volume Pareto Bar Chart (Brand Deep Dive)
   ========================================================================= */

interface SkuParetoChartProps {
  items: SkuParetoItem[];
  limit?: number;
}

export function SkuParetoBarChart({ items, limit = 10 }: SkuParetoChartProps) {
  const displayItems = items.slice(0, limit);
  const chartData = displayItems.map((it) => {
    const shortTitle = it.item_name.length > 24 ? `${it.item_name.substring(0, 22)}...` : it.item_name;

    let fill = '#10b981';
    let gradientId = 'skuHeroGrad';
    if (it.tier === 'Tier B') {
      fill = '#0284c7';
      gradientId = 'skuSecondaryGrad';
    }
    if (it.tier === 'Tier C') {
      fill = '#d97706';
      gradientId = 'skuWatchlistGrad';
    }

    return {
      fullName: it.item_name,
      name: shortTitle,
      qty: it.total_qty,
      share: it.share_of_volume_pct,
      cum: it.cumulative_volume_pct,
      revenue: it.total_revenue,
      tier: it.tier,
      action: it.action_label,
      fill,
      gradientId,
    };
  });

  return (
    <div className="w-full h-84">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 8, right: 30, left: 10, bottom: 8 }}
        >
          <defs>
            <linearGradient id="skuHeroGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#059669" stopOpacity={0.85} />
              <stop offset="100%" stopColor="#10b981" stopOpacity={1} />
            </linearGradient>
            <linearGradient id="skuSecondaryGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#0369a1" stopOpacity={0.85} />
              <stop offset="100%" stopColor="#0284c7" stopOpacity={1} />
            </linearGradient>
            <linearGradient id="skuWatchlistGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#b45309" stopOpacity={0.85} />
              <stop offset="100%" stopColor="#d97706" stopOpacity={1} />
            </linearGradient>
          </defs>

          <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" horizontal={false} />

          <XAxis
            type="number"
            stroke="var(--chart-axis)"
            fontSize={12}
            tickLine={false}
            axisLine={{ stroke: 'var(--border-default)' }}
          />
          <YAxis
            type="category"
            dataKey="name"
            stroke="var(--text-primary)"
            fontSize={12}
            tickLine={false}
            axisLine={{ stroke: 'var(--border-default)' }}
            width={140}
          />

          <Tooltip
            cursor={{ fill: 'var(--chart-cursor)' }}
            content={({ active, payload }) => {
              if (!active || !payload || !payload.length) return null;
              const d = payload[0].payload;
              return (
                <GlassTooltip
                  title={
                    <span className="flex items-center justify-between w-full">
                      <span className="truncate max-w-[200px]">{d.fullName}</span>
                      <span
                        className="text-[10px] font-mono px-2 py-0.5 rounded ml-2 shrink-0 border"
                        style={{
                          backgroundColor: `${d.fill}20`,
                          borderColor: `${d.fill}50`,
                          color: d.fill,
                        }}
                      >
                        {d.tier}
                      </span>
                    </span>
                  }
                  items={[
                    { label: 'Units Sold', value: `${d.qty} units`, color: d.fill },
                    { label: 'Volume Share', value: `${d.share}%` },
                    { label: 'Cumulative Vol', value: `${d.cum}%` },
                    ...(d.revenue > 0 ? [{ label: 'Gross Revenue', value: formatRupiah(d.revenue) }] : []),
                  ]}
                  footer={<span>Strategy: {d.action}</span>}
                />
              );
            }}
          />

          <Bar isAnimationActive={false} dataKey="qty" radius={[0, 4, 4, 0]} maxBarSize={22}>
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={`url(#${entry.gradientId})`} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/* =========================================================================
   5. Kitchen Prep Time & SLA Heatmap Composed Chart
   ========================================================================= */

interface BrandHourlyKptChartProps {
  data: BrandHourlyStats[];
}

export function BrandHourlyKptChart({ data }: BrandHourlyKptChartProps) {
  const chartData = data.map((d) => ({
    hour: `${String(d.hour_of_day).padStart(2, '0')}:00`,
    Orders: d.order_count,
    'Avg Prep Time (min)': d.avg_prep_time_min,
    breaches: d.sla_breaches,
    window: d.rush_window,
  }));

  return (
    <div className="w-full h-76">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={chartData} margin={{ top: 12, right: 16, left: -6, bottom: 8 }}>
          <defs>
            <linearGradient id="kptBarGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#1b6b4a" stopOpacity={0.85} />
              <stop offset="100%" stopColor="#1b6b4a" stopOpacity={0.35} />
            </linearGradient>
          </defs>

          <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" vertical={false} />

          <XAxis
            dataKey="hour"
            stroke="var(--chart-axis)"
            fontSize={12}
            tickLine={false}
            axisLine={{ stroke: 'var(--border-default)' }}
            dy={6}
          />
          <YAxis
            yAxisId="left"
            stroke="var(--chart-axis)"
            fontSize={12}
            tickLine={false}
            axisLine={{ stroke: 'var(--border-default)' }}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            stroke="#d97706"
            fontSize={12}
            tickLine={false}
            axisLine={{ stroke: 'rgba(217, 119, 6, 0.25)' }}
            unit="m"
          />

          <Tooltip
            cursor={{ fill: 'var(--chart-cursor)' }}
            content={({ active, payload }) => {
              if (!active || !payload || !payload.length) return null;
              const d = payload[0].payload;
              return (
                <GlassTooltip
                  title={
                    <span className="flex items-center justify-between w-full">
                      <span>Window: {d.hour} ({d.window})</span>
                      {d.breaches > 0 && (
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded badge-rose">
                          {d.breaches} SLA Breaches
                        </span>
                      )}
                    </span>
                  }
                  items={[
                    { label: 'Ticket Volume', value: `${d.Orders} orders`, color: '#1b6b4a' },
                    { label: 'Avg Kitchen Prep', value: `${d['Avg Prep Time (min)']} min`, color: '#d97706' },
                  ]}
                  footer={<span>Benchmark: ≤12m Kemang / ≤15m Greenville</span>}
                />
              );
            }}
          />

          <Legend
            verticalAlign="top"
            align="right"
            wrapperStyle={{ paddingBottom: '12px', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}
            formatter={(val) => <span className="text-[var(--text-secondary)] font-semibold ml-1 mr-3">{val}</span>}
          />

          <Bar
            isAnimationActive={false}
            yAxisId="left"
            dataKey="Orders"
            fill="url(#kptBarGrad)"
            radius={[4, 4, 0, 0]}
            maxBarSize={28}
          />
          <Line
            isAnimationActive={false}
            yAxisId="right"
            type="monotone"
            dataKey="Avg Prep Time (min)"
            stroke="#d97706"
            strokeWidth={2.5}
            dot={{ r: 3, fill: '#d97706', stroke: 'var(--bg-surface)', strokeWidth: 1.5 }}
            activeDot={{ r: 5, fill: '#f59e0b', stroke: 'var(--bg-surface)', strokeWidth: 2 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

/* =========================================================================
   6. Brand Channel Donut Chart
   ========================================================================= */

interface BrandChannelChartProps {
  data: BrandChannelStats[];
}

export function BrandChannelChart({ data }: BrandChannelChartProps) {
  const totalGmv = data.reduce((acc, curr) => acc + curr.gross_gmv, 0);

  const chartData = data.map((d) => ({
    name: d.provider,
    value: d.gross_gmv,
    orders: d.order_count,
    burnRate: d.promo_burn_rate_pct,
    net: d.net_payout,
    share: totalGmv > 0 ? ((d.gross_gmv / totalGmv) * 100).toFixed(1) : '0',
    color: getChannelColor(d.provider),
  }));

  return (
    <div className="w-full h-64 flex items-center justify-center relative">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            isAnimationActive={false}
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={88}
            paddingAngle={4}
            dataKey="value"
            stroke="var(--bg-surface)"
            strokeWidth={3}
          >
            {chartData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.color || FALLBACK_PALETTE[index % FALLBACK_PALETTE.length]}
              />
            ))}
          </Pie>

          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload || !payload.length) return null;
              const d = payload[0].payload;
              return (
                <GlassTooltip
                  title={
                    <span className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                      <span>{d.name}</span>
                    </span>
                  }
                  items={[
                    { label: 'Gross GMV', value: formatRupiah(d.value) },
                    { label: 'Volume Share', value: `${d.share}%` },
                    { label: 'Orders Completed', value: `${d.orders} tickets` },
                    { label: 'Promo Burn Rate', value: `${d.burnRate}%`, color: '#e11d48' },
                  ]}
                  footer={<span>Net Settlement: {formatRupiah(d.net)}</span>}
                />
              );
            }}
          />
        </PieChart>
      </ResponsiveContainer>

      {/* Donut Center Summary Badge */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <span className="text-[10px] uppercase font-mono tracking-wider text-[var(--text-muted)]">Channel Mix</span>
        <span className="text-base sm:text-lg font-mono font-bold text-[var(--text-primary)] mt-0.5 tabular-nums">
          {totalGmv >= 1_000_000 ? `Rp${(totalGmv / 1_000_000).toFixed(1)}M` : formatRupiah(totalGmv)}
        </span>
      </div>
    </div>
  );
}

/* =========================================================================
   7. Daily Revenue & Net Realization Time-Series Chart
   ========================================================================= */

interface DailyRevenueTrendChartProps {
  data: DailyTrendPoint[];
}

export function DailyRevenueTrendChart({ data }: DailyRevenueTrendChartProps) {
  const chartData = data.map((d) => ({
    date: d.dateLabel,
    fullDate: d.date,
    'Gross GMV': Math.round(d.gross_gmv / 1000),
    'Net Payout': Math.round(d.net_payout / 1000),
    'Promo Burn': Math.round(d.merchant_promo_burn / 1000),
    Orders: d.order_count,
    rawGmv: d.gross_gmv,
    rawNet: d.net_payout,
    rawPromo: d.merchant_promo_burn,
    realizationRate: d.net_realization_rate,
    avgPrepMin: d.avg_prep_time_min,
    slaBreaches: d.sla_breaches,
  }));

  if (chartData.length === 0) {
    return (
      <div className="w-full h-72 flex items-center justify-center text-xs font-mono text-[var(--text-muted)] surface-well rounded-xl">
        No daily transaction points in selected date range
      </div>
    );
  }

  return (
    <div className="w-full h-76">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={chartData} margin={{ top: 12, right: 16, left: 0, bottom: 8 }}>
          <defs>
            <linearGradient id="dailyGmvArea" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0284c7" stopOpacity={0.28} />
              <stop offset="85%" stopColor="#0284c7" stopOpacity={0.03} />
              <stop offset="100%" stopColor="#0284c7" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="dailyNetArea" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity={0.35} />
              <stop offset="85%" stopColor="#10b981" stopOpacity={0.05} />
              <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
            </linearGradient>
          </defs>

          <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" vertical={false} />

          <XAxis
            dataKey="date"
            stroke="var(--chart-axis)"
            fontSize={11}
            tickLine={false}
            axisLine={{ stroke: 'var(--border-default)' }}
            dy={6}
          />
          <YAxis
            yAxisId="left"
            stroke="var(--chart-axis)"
            fontSize={11}
            tickLine={false}
            axisLine={{ stroke: 'var(--border-default)' }}
            tickFormatter={(val) => (val >= 1000 ? `Rp${(val / 1000).toFixed(1)}M` : `Rp${val}k`)}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            stroke="#c85a32"
            fontSize={11}
            tickLine={false}
            axisLine={{ stroke: 'rgba(200, 90, 50, 0.25)' }}
            tickFormatter={(val) => `${val} ord`}
          />

          <Tooltip
            cursor={{ fill: 'var(--chart-cursor)' }}
            content={({ active, payload }) => {
              if (!active || !payload || !payload.length) return null;
              const d = payload[0].payload;
              return (
                <GlassTooltip
                  title={
                    <span className="flex items-center justify-between w-full gap-3">
                      <span>{d.date} ({d.fullDate})</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded badge-emerald">
                        {d.realizationRate}% Net
                      </span>
                    </span>
                  }
                  items={[
                    { label: 'Gross GMV', value: formatRupiah(d.rawGmv), color: '#0284c7' },
                    { label: 'Net Settlement', value: formatRupiah(d.rawNet), color: '#10b981' },
                    { label: 'Promo Burn', value: formatRupiah(d.rawPromo), color: '#e11d48' },
                    { label: 'Completed Orders', value: `${d.Orders} tickets`, color: '#c85a32' },
                    ...(d.avgPrepMin > 0
                      ? [
                          {
                            label: 'Avg Kitchen Prep',
                            value: `${d.avgPrepMin}m`,
                            badge: d.slaBreaches > 0 ? `${d.slaBreaches} SLA breach` : 'On Target',
                          },
                        ]
                      : []),
                  ]}
                  footer={<span>Daily revenue realization & order velocity</span>}
                />
              );
            }}
          />

          <Legend
            verticalAlign="top"
            align="right"
            wrapperStyle={{ paddingBottom: '12px', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}
            formatter={(val) => <span className="text-[var(--text-secondary)] font-semibold ml-1 mr-3">{val}</span>}
          />

          <Area
            isAnimationActive={false}
            yAxisId="left"
            type="monotone"
            dataKey="Gross GMV"
            stroke="#0284c7"
            strokeWidth={2}
            fill="url(#dailyGmvArea)"
          />
          <Area
            isAnimationActive={false}
            yAxisId="left"
            type="monotone"
            dataKey="Net Payout"
            stroke="#10b981"
            strokeWidth={2.5}
            fill="url(#dailyNetArea)"
          />
          <Line
            isAnimationActive={false}
            yAxisId="right"
            type="monotone"
            dataKey="Orders"
            stroke="#c85a32"
            strokeWidth={2}
            dot={{ r: 2.5, fill: '#c85a32', stroke: 'var(--bg-surface)', strokeWidth: 1.5 }}
            activeDot={{ r: 4.5, fill: '#c85a32', stroke: 'var(--bg-surface)', strokeWidth: 2 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

/* =========================================================================
   8. Weekly (by Day of Week) Performance Chart (Mon - Sun)
   ========================================================================= */

interface WeeklyDayPerformanceChartProps {
  data: WeeklyDayPerformancePoint[];
}

export function WeeklyDayPerformanceChart({ data }: WeeklyDayPerformanceChartProps) {
  const [metricMode, setMetricMode] = useState<'sales' | 'aov' | 'orders'>('sales');
  const [startDay, setStartDay] = useState<'sun' | 'mon'>('sun');

  // Order data according to startDay preference
  const rawData = [...data];
  let orderedData = rawData;
  if (startDay === 'sun') {
    // Put Sunday first (dayNum 7 or dayName 'Sun')
    const sunItem = rawData.find((d) => d.dayName === 'Sun' || d.dayNum === 7);
    const others = rawData.filter((d) => d.dayName !== 'Sun' && d.dayNum !== 7);
    orderedData = sunItem ? [sunItem, ...others] : rawData;
  } else {
    // Put Mon first
    const sunItem = rawData.find((d) => d.dayName === 'Sun' || d.dayNum === 7);
    const others = rawData.filter((d) => d.dayName !== 'Sun' && d.dayNum !== 7);
    orderedData = sunItem ? [...others, sunItem] : rawData;
  }

  const chartData = orderedData.map((d) => ({
    name: d.dayName,
    fullName: d.fullDayName,
    'Gross GMV': Math.round(d.grossGmv / 1000),
    'Net Settlement': Math.round(d.netPayout / 1000),
    'AOV (k)': Math.round(d.avgOrderValue / 1000),
    Orders: d.orderCount,
    rawGmv: d.grossGmv,
    rawNet: d.netPayout,
    rawPromo: d.merchantPromoBurn,
    aov: d.avgOrderValue,
    avgPrepMin: d.avgPrepTimeMin,
    slaBreaches: d.slaBreaches,
    isWeekend: d.isWeekend,
  }));

  if (chartData.length === 0 || chartData.every((d) => d.rawGmv === 0)) {
    return (
      <div className="w-full h-72 flex items-center justify-center text-xs font-mono text-[var(--text-muted)] surface-well rounded-xl">
        No day-of-week orders recorded for selected filter
      </div>
    );
  }

  // Find peak metrics
  const peakSalesDay = [...chartData].sort((a, b) => b.rawGmv - a.rawGmv)[0];
  const peakAovDay = [...chartData].sort((a, b) => b.aov - a.aov)[0];
  const weekendGmv = chartData.filter((d) => d.isWeekend).reduce((acc, d) => acc + d.rawGmv, 0);
  const totalGmv = chartData.reduce((acc, d) => acc + d.rawGmv, 0);
  const weekendSharePct = totalGmv > 0 ? Math.round((weekendGmv / totalGmv) * 100) : 0;
  const totalOrders = chartData.reduce((acc, d) => acc + d.Orders, 0);
  const overallAov = totalOrders > 0 ? Math.round(totalGmv / totalOrders) : 0;

  return (
    <div className="space-y-4">
      {/* Top Context Indicators & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-semibold text-[var(--text-primary)]">
            Peak Sales: <strong className="text-emerald-500 font-bold">{peakSalesDay?.fullName}</strong> ({formatRupiah(peakSalesDay?.rawGmv || 0)})
          </span>
          <span className="text-[var(--text-muted)] hidden sm:inline">•</span>
          <span className="text-[var(--text-secondary)]">
            Highest Basket: <strong className="text-purple-500 font-semibold">{peakAovDay?.fullName}</strong> ({formatRupiah(peakAovDay?.aov || 0)} AOV)
          </span>
          <span className="text-[var(--text-muted)] hidden sm:inline">•</span>
          <span className="text-[var(--text-secondary)]">
            Weekend: <strong className="text-[var(--accent-primary)] font-semibold">{weekendSharePct}%</strong> GMV
          </span>
        </div>

        {/* Chart View & Calendar Switcher */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="inline-flex p-0.5 rounded-lg bg-[var(--bg-surface-2)] border border-[var(--border-default)]">
            <button
              type="button"
              onClick={() => setStartDay('sun')}
              className={`px-2.5 py-1 text-[11px] font-mono font-semibold rounded-md transition cursor-pointer ${
                startDay === 'sun'
                  ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-2xs border border-[var(--border-default)]'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              Sun, Mon...
            </button>
            <button
              type="button"
              onClick={() => setStartDay('mon')}
              className={`px-2.5 py-1 text-[11px] font-mono font-semibold rounded-md transition cursor-pointer ${
                startDay === 'mon'
                  ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-2xs border border-[var(--border-default)]'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              Mon, Tue...
            </button>
          </div>

          <div className="inline-flex p-0.5 rounded-lg bg-[var(--bg-surface-2)] border border-[var(--border-default)]">
            <button
              type="button"
              onClick={() => setMetricMode('sales')}
              className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition cursor-pointer ${
                metricMode === 'sales'
                  ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-2xs border border-[var(--border-default)]'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              Sales (GMV/Net)
            </button>
            <button
              type="button"
              onClick={() => setMetricMode('aov')}
              className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition cursor-pointer ${
                metricMode === 'aov'
                  ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-2xs border border-[var(--border-default)]'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              AOV Basket
            </button>
            <button
              type="button"
              onClick={() => setMetricMode('orders')}
              className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition cursor-pointer ${
                metricMode === 'orders'
                  ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-2xs border border-[var(--border-default)]'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              Orders &amp; Speed
            </button>
          </div>
        </div>
      </div>

      <div className="w-full h-80">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 12, right: 16, left: 0, bottom: 8 }} barGap={6}>
            <defs>
              <linearGradient id="weekGmvBar" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#0284c7" stopOpacity={0.92} />
                <stop offset="100%" stopColor="#0369a1" stopOpacity={0.65} />
              </linearGradient>
              <linearGradient id="weekNetBar" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity={0.95} />
                <stop offset="100%" stopColor="#059669" stopOpacity={0.7} />
              </linearGradient>
              <linearGradient id="weekAovBar" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.92} />
                <stop offset="100%" stopColor="#6d28d9" stopOpacity={0.7} />
              </linearGradient>
              <linearGradient id="weekOrderBar" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.9} />
                <stop offset="100%" stopColor="#d97706" stopOpacity={0.65} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" vertical={false} />

            <XAxis
              dataKey="name"
              stroke="var(--chart-axis)"
              fontSize={12}
              fontWeight={600}
              tickLine={false}
              axisLine={{ stroke: 'var(--border-default)' }}
              dy={6}
            />

            {metricMode === 'sales' && (
              <>
                <YAxis
                  yAxisId="left"
                  stroke="var(--chart-axis)"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: 'var(--border-default)' }}
                  tickFormatter={(val) => (val >= 1000 ? `Rp${(val / 1000).toFixed(1)}M` : `Rp${val}k`)}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  stroke="#c85a32"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: 'rgba(200, 90, 50, 0.25)' }}
                  tickFormatter={(val) => `${val} ord`}
                />
              </>
            )}

            {metricMode === 'aov' && (
              <>
                <YAxis
                  yAxisId="left"
                  stroke="var(--chart-axis)"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: 'var(--border-default)' }}
                  tickFormatter={(val) => `Rp${val}k`}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  stroke="#0284c7"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: 'rgba(2, 132, 199, 0.25)' }}
                  tickFormatter={(val) => (val >= 1000 ? `Rp${(val / 1000).toFixed(1)}M` : `Rp${val}k`)}
                />
              </>
            )}

            {metricMode === 'orders' && (
              <>
                <YAxis
                  yAxisId="left"
                  stroke="var(--chart-axis)"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: 'var(--border-default)' }}
                  tickFormatter={(val) => `${val} ord`}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  stroke="#e11d48"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: 'rgba(225, 29, 72, 0.25)' }}
                  tickFormatter={(val) => `${val}m`}
                />
              </>
            )}

            <Tooltip
              cursor={{ fill: 'var(--chart-cursor)' }}
              content={({ active, payload }) => {
                if (!active || !payload || !payload.length) return null;
                const d = payload[0].payload;
                return (
                  <GlassTooltip
                    title={
                      <span className="flex items-center justify-between w-full gap-3">
                        <span>{d.fullName}</span>
                        {d.isWeekend && (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded font-semibold bg-amber-500/20 text-amber-600 dark:text-amber-400">
                            Weekend
                          </span>
                        )}
                      </span>
                    }
                    items={[
                      { label: 'Gross GMV', value: formatRupiah(d.rawGmv), color: '#0284c7' },
                      { label: 'Net Settlement', value: formatRupiah(d.rawNet), color: '#10b981' },
                      { label: 'Avg Order Value (AOV)', value: formatRupiah(d.aov), color: '#8b5cf6' },
                      { label: 'Completed Orders', value: `${d.Orders} tickets`, color: '#f59e0b' },
                      { label: 'Promo Burn', value: formatRupiah(d.rawPromo), color: '#e11d48' },
                      ...(d.avgPrepMin > 0
                        ? [
                            {
                              label: 'Avg Kitchen Prep',
                              value: `${d.avgPrepMin}m`,
                              badge: d.slaBreaches > 0 ? `${d.slaBreaches} SLA breach` : 'On Target',
                            },
                          ]
                        : []),
                    ]}
                    footer={
                      <span>
                        Overall Period AOV: {formatRupiah(overallAov)} ({d.aov >= overallAov ? '+' : ''}
                        {overallAov > 0 ? Math.round(((d.aov - overallAov) / overallAov) * 100) : 0}%)
                      </span>
                    }
                  />
                );
              }}
            />

            <Legend
              verticalAlign="top"
              align="right"
              wrapperStyle={{ paddingBottom: '12px', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}
              formatter={(val) => <span className="text-[var(--text-secondary)] font-semibold ml-1 mr-3">{val}</span>}
            />

            {metricMode === 'sales' && (
              <>
                <Bar
                  yAxisId="left"
                  dataKey="Gross GMV"
                  fill="url(#weekGmvBar)"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={44}
                />
                <Bar
                  yAxisId="left"
                  dataKey="Net Settlement"
                  fill="url(#weekNetBar)"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={44}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="Orders"
                  stroke="#c85a32"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: '#c85a32', stroke: 'var(--bg-surface)', strokeWidth: 2 }}
                  activeDot={{ r: 6, fill: '#c85a32', stroke: 'var(--bg-surface)', strokeWidth: 2 }}
                />
              </>
            )}

            {metricMode === 'aov' && (
              <>
                <Bar
                  yAxisId="left"
                  dataKey="AOV (k)"
                  name="Avg Order Value"
                  fill="url(#weekAovBar)"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={48}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="Gross GMV"
                  name="Gross GMV"
                  stroke="#0284c7"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: '#0284c7', stroke: 'var(--bg-surface)', strokeWidth: 2 }}
                  activeDot={{ r: 6, fill: '#0284c7', stroke: 'var(--bg-surface)', strokeWidth: 2 }}
                />
              </>
            )}

            {metricMode === 'orders' && (
              <>
                <Bar
                  yAxisId="left"
                  dataKey="Orders"
                  name="Orders"
                  fill="url(#weekOrderBar)"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={48}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="avgPrepMin"
                  name="Prep Time (min)"
                  stroke="#e11d48"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: '#e11d48', stroke: 'var(--bg-surface)', strokeWidth: 2 }}
                  activeDot={{ r: 6, fill: '#e11d48', stroke: 'var(--bg-surface)', strokeWidth: 2 }}
                />
              </>
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

/* =========================================================================
   9. Branch Comparison Chart (Greenville vs Kemang)
   ========================================================================= */

export interface BranchComparisonChartProps {
  data: BranchStats[];
}

export function BranchComparisonChart({ data }: BranchComparisonChartProps) {
  const [metricMode, setMetricMode] = useState<'revenue' | 'aov' | 'efficiency'>('revenue');

  const chartData = data.map((b) => {
    const calculatedAov = b.avg_order_value && b.avg_order_value > 0
      ? b.avg_order_value
      : b.order_count > 0 ? Math.round(b.gross_gmv / b.order_count) : 0;
    const netAov = b.order_count > 0 ? Math.round(b.net_payout / b.order_count) : 0;
    const promoPct = b.gross_gmv > 0 ? Number(((b.merchant_promo_burn / b.gross_gmv) * 100).toFixed(1)) : 0;

    return {
      branch: b.branch,
      displayName: b.branch === 'Kemang' ? 'Kemang Cloud' : 'Greenville Flagship',
      grossGmv: b.gross_gmv,
      netPayout: b.net_payout,
      grossGmvK: Math.round(b.gross_gmv / 1000),
      netPayoutK: Math.round(b.net_payout / 1000),
      promoBurn: b.merchant_promo_burn,
      promoPct,
      orderCount: b.order_count,
      aov: calculatedAov,
      aovK: Math.round(calculatedAov / 1000),
      netAov,
      netRealization: b.net_realization_rate,
      avgPrepMin: b.avg_prep_time_min,
      slaBreaches: b.sla_breaches,
      isGreenville: b.branch.toLowerCase().includes('greenville'),
    };
  });

  if (chartData.length === 0) {
    return (
      <div className="w-full h-64 flex items-center justify-center text-xs font-mono text-[var(--text-muted)] surface-well rounded-xl">
        No branch order data available
      </div>
    );
  }

  const totalGmv = chartData.reduce((acc, d) => acc + d.grossGmv, 0);
  const totalOrders = chartData.reduce((acc, d) => acc + d.orderCount, 0);

  return (
    <div className="space-y-4">
      {/* Branch Metric Mode Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-semibold text-[var(--text-primary)]">
            Outlet Comparison:
          </span>
          <span className="text-[var(--text-secondary)]">
            {chartData.map((b) => (
              <span key={b.branch} className="mr-3 font-mono">
                <span
                  className="inline-block w-2 h-2 rounded-full mr-1.5"
                  style={{ backgroundColor: b.isGreenville ? '#10b981' : '#a855f7' }}
                />
                <strong>{b.branch}</strong>: {totalGmv > 0 ? Math.round((b.grossGmv / totalGmv) * 100) : 0}% GMV
                <span className="text-[var(--text-muted)] ml-1">({formatRupiah(b.aov)} AOV)</span>
              </span>
            ))}
          </span>
        </div>

        <div className="inline-flex p-0.5 rounded-lg bg-[var(--bg-surface-2)] border border-[var(--border-default)] self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setMetricMode('revenue')}
            className={`px-3 py-1 text-xs font-semibold rounded-md transition cursor-pointer ${
              metricMode === 'revenue'
                ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-2xs border border-[var(--border-default)]'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
          >
            GMV vs Payout
          </button>
          <button
            type="button"
            onClick={() => setMetricMode('aov')}
            className={`px-3 py-1 text-xs font-semibold rounded-md transition cursor-pointer ${
              metricMode === 'aov'
                ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-2xs border border-[var(--border-default)]'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
          >
            Basket Size (AOV)
          </button>
          <button
            type="button"
            onClick={() => setMetricMode('efficiency')}
            className={`px-3 py-1 text-xs font-semibold rounded-md transition cursor-pointer ${
              metricMode === 'efficiency'
                ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-2xs border border-[var(--border-default)]'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
          >
            Orders &amp; Prep SLA
          </button>
        </div>
      </div>

      {/* Comparison Chart */}
      <div className="w-full h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 12, right: 16, left: 0, bottom: 8 }} barGap={8}>
            <defs>
              <linearGradient id="gvGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity={0.95} />
                <stop offset="100%" stopColor="#059669" stopOpacity={0.7} />
              </linearGradient>
              <linearGradient id="kmgGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#a855f7" stopOpacity={0.95} />
                <stop offset="100%" stopColor="#7e22ce" stopOpacity={0.7} />
              </linearGradient>
              <linearGradient id="netPayoutGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#0284c7" stopOpacity={0.9} />
                <stop offset="100%" stopColor="#0369a1" stopOpacity={0.65} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" vertical={false} />

            <XAxis
              dataKey="displayName"
              stroke="var(--chart-axis)"
              fontSize={12}
              fontWeight={600}
              tickLine={false}
              axisLine={{ stroke: 'var(--border-default)' }}
              dy={6}
            />

            {metricMode === 'revenue' && (
              <YAxis
                stroke="var(--chart-axis)"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: 'var(--border-default)' }}
                tickFormatter={(val) => (val >= 1000 ? `Rp${(val / 1000).toFixed(1)}M` : `Rp${val}k`)}
              />
            )}

            {metricMode === 'aov' && (
              <YAxis
                stroke="var(--chart-axis)"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: 'var(--border-default)' }}
                tickFormatter={(val) => `Rp${val}k`}
              />
            )}

            {metricMode === 'efficiency' && (
              <YAxis
                stroke="var(--chart-axis)"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: 'var(--border-default)' }}
                tickFormatter={(val) => `${val}`}
              />
            )}

            <Tooltip
              cursor={{ fill: 'var(--chart-cursor)' }}
              content={({ active, payload }) => {
                if (!active || !payload || !payload.length) return null;
                const d = payload[0].payload;
                return (
                  <GlassTooltip
                    title={
                      <span className="flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: d.isGreenville ? '#10b981' : '#a855f7' }}
                        />
                        <span>{d.displayName}</span>
                      </span>
                    }
                    items={[
                      { label: 'Gross GMV', value: formatRupiah(d.grossGmv), color: '#0284c7' },
                      { label: 'Net Settlement', value: formatRupiah(d.netPayout), color: '#10b981' },
                      { label: 'Net Realization Rate', value: `${d.netRealization}%` },
                      { label: 'Average Order Value (AOV)', value: formatRupiah(d.aov), color: '#8b5cf6' },
                      { label: 'Total Orders', value: `${d.orderCount.toLocaleString()} tickets` },
                      { label: 'Merchant Promo Burn', value: `${formatRupiah(d.promoBurn)} (${d.promoPct}%)`, color: '#e11d48' },
                      { label: 'Avg Kitchen Prep', value: `${d.avgPrepMin}m (${d.slaBreaches} breaches)` },
                    ]}
                    footer={
                      <span>
                        Portfolio Share: {totalGmv > 0 ? Math.round((d.grossGmv / totalGmv) * 100) : 0}% of GMV ·{' '}
                        {totalOrders > 0 ? Math.round((d.orderCount / totalOrders) * 100) : 0}% of orders
                      </span>
                    }
                  />
                );
              }}
            />

            <Legend
              verticalAlign="top"
              align="right"
              wrapperStyle={{ paddingBottom: '12px', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}
              formatter={(val) => <span className="text-[var(--text-secondary)] font-semibold ml-1 mr-3">{val}</span>}
            />

            {metricMode === 'revenue' && (
              <>
                <Bar
                  dataKey="grossGmvK"
                  name="Gross GMV (k)"
                  fill="url(#gvGrad)"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={64}
                >
                  {chartData.map((entry, index) => (
                    <Cell
                      key={`rev-cell-${index}`}
                      fill={entry.isGreenville ? 'url(#gvGrad)' : 'url(#kmgGrad)'}
                    />
                  ))}
                </Bar>
                <Bar
                  dataKey="netPayoutK"
                  name="Net Settlement (k)"
                  fill="url(#netPayoutGrad)"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={64}
                />
              </>
            )}

            {metricMode === 'aov' && (
              <Bar
                dataKey="aovK"
                name="Average Order Value (k)"
                radius={[6, 6, 0, 0]}
                maxBarSize={72}
              >
                {chartData.map((entry, index) => (
                  <Cell
                    key={`aov-cell-${index}`}
                    fill={entry.isGreenville ? 'url(#gvGrad)' : 'url(#kmgGrad)'}
                  />
                ))}
              </Bar>
            )}

            {metricMode === 'efficiency' && (
              <>
                <Bar
                  dataKey="orderCount"
                  name="Completed Orders"
                  fill="#0284c7"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={64}
                />
                <Bar
                  dataKey="avgPrepMin"
                  name="Avg Prep Time (min)"
                  fill="#f59e0b"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={64}
                />
              </>
            )}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

/* =========================================================================
   10. Channel AOV & Basket Size Chart
   ========================================================================= */

export interface ChannelAovChartProps {
  data: ChannelStats[];
}

export function ChannelAovChart({ data }: ChannelAovChartProps) {
  const chartData = data.map((ch) => {
    const grossAov = ch.avg_order_value && ch.avg_order_value > 0
      ? ch.avg_order_value
      : ch.order_count > 0 ? Math.round(ch.gross_gmv / ch.order_count) : 0;
    const netAov = ch.net_avg_order_value && ch.net_avg_order_value > 0
      ? ch.net_avg_order_value
      : ch.order_count > 0 ? Math.round(ch.net_payout / ch.order_count) : 0;
    const promoDragPerOrder = Math.max(0, grossAov - netAov);
    const color = getChannelColor(ch.provider);

    return {
      provider: ch.provider,
      orderCount: ch.order_count,
      grossGmv: ch.gross_gmv,
      netPayout: ch.net_payout,
      grossAov,
      netAov,
      grossAovK: Math.round(grossAov / 1000),
      netAovK: Math.round(netAov / 1000),
      promoDragPerOrder,
      netRealization: ch.net_realization_rate,
      color,
    };
  });

  if (chartData.length === 0) {
    return (
      <div className="w-full h-64 flex items-center justify-center text-xs font-mono text-[var(--text-muted)] surface-well rounded-xl">
        No channel data recorded
      </div>
    );
  }

  // Top AOV Channel
  const topAovChannel = [...chartData].sort((a, b) => b.grossAov - a.grossAov)[0];

  return (
    <div className="space-y-3">
      {/* Top Banner Callout */}
      <div className="flex items-center justify-between text-xs px-1">
        <span className="text-[var(--text-secondary)]">
          Top Basket: <strong className="text-emerald-500 font-semibold">{topAovChannel?.provider}</strong> ({formatRupiah(topAovChannel?.grossAov || 0)}/ord)
        </span>
        <span className="text-[11px] font-mono text-[var(--text-muted)]">
          Gross vs Net Basket
        </span>
      </div>

      <div className="w-full h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 12, right: 12, left: 0, bottom: 8 }} barGap={6}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" vertical={false} />

            <XAxis
              dataKey="provider"
              stroke="var(--chart-axis)"
              fontSize={11}
              fontWeight={600}
              tickLine={false}
              axisLine={{ stroke: 'var(--border-default)' }}
              dy={6}
            />
            <YAxis
              stroke="var(--chart-axis)"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: 'var(--border-default)' }}
              tickFormatter={(val) => `Rp${val}k`}
            />

            <Tooltip
              cursor={{ fill: 'var(--chart-cursor)' }}
              content={({ active, payload }) => {
                if (!active || !payload || !payload.length) return null;
                const d = payload[0].payload;
                return (
                  <GlassTooltip
                    title={
                      <span className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                        <span>{d.provider} AOV</span>
                      </span>
                    }
                    items={[
                      { label: 'Gross Basket (AOV)', value: formatRupiah(d.grossAov), color: d.color },
                      { label: 'Net Realized Basket', value: formatRupiah(d.netAov), color: '#10b981' },
                      { label: 'Promo Drag / Basket', value: `-${formatRupiah(d.promoDragPerOrder)}`, color: '#e11d48' },
                      { label: 'Net Realization Rate', value: `${d.netRealization}%` },
                      { label: 'Completed Tickets', value: `${d.orderCount.toLocaleString()} orders` },
                    ]}
                    footer={<span>Total GMV: {formatRupiah(d.grossGmv)}</span>}
                  />
                );
              }}
            />

            <Legend
              verticalAlign="top"
              align="right"
              wrapperStyle={{ paddingBottom: '10px', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}
              formatter={(val) => <span className="text-[var(--text-secondary)] font-semibold ml-1 mr-2">{val}</span>}
            />

            <Bar
              dataKey="grossAovK"
              name="Gross Basket (k)"
              fill="#0284c7"
              radius={[5, 5, 0, 0]}
              maxBarSize={40}
            />
            <Bar
              dataKey="netAovK"
              name="Net Basket (k)"
              fill="#10b981"
              radius={[5, 5, 0, 0]}
              maxBarSize={40}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}


