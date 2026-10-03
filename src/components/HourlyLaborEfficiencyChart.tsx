'use client';

import React, { useState } from 'react';
import type { HourlyLaborEfficiencyReport } from '@/lib/queries';
import {
  Users,
  Clock,
  ChevronDown,
  ChevronUp,
  Flame,
  ShieldAlert,
} from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';

interface HourlyLaborEfficiencyChartProps {
  report: HourlyLaborEfficiencyReport;
}

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatCompactRupiah(n: number): string {
  if (Math.abs(n) >= 1_000_000) return `Rp ${(n / 1_000_000).toFixed(1)}M`;
  if (Math.abs(n) >= 1_000) return `Rp ${(n / 1_000).toFixed(0)}k`;
  return `Rp ${Math.round(n)}`;
}

export function HourlyLaborEfficiencyChart({ report }: HourlyLaborEfficiencyChartProps) {
  const [showTable, setShowTable] = useState(false);
  const { hourlyPoints, peakSplhHour, peakSplhValue, highestStrainHour, blendedSplh, blendedLaborPct } = report;

  // Filter out late night 00:00 - 06:00 if completely closed
  const chartData = hourlyPoints.filter((p) => p.hour_of_day >= 6 && p.hour_of_day <= 22).map((p) => ({
    hour: `${String(p.hour_of_day).padStart(2, '0')}:00`,
    orders: p.order_count,
    gmv: p.gross_gmv,
    staff: p.active_staff_count,
    splh: p.splh,
    laborCostPct: p.labor_cost_pct,
    status: p.operational_status,
  }));

  const statusBadge = (status: string) => {
    switch (status) {
      case 'Optimal':
        return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
      case 'Overstaffed Dead-Hour':
        return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
      case 'Understaffed Bottleneck':
        return 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20';
      default:
        return 'bg-surface-elevated text-muted-foreground border-border';
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER & SUMMARY METRICS */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-surface p-6 rounded-2xl border border-border shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider mb-1">
            <Users className="w-4 h-4 text-primary" />
            Human Capital & Kitchen Velocity Analysis
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-foreground">
            Hourly Labor Efficiency & SPLH
          </h2>
          <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
            Correlating scheduled shift attendance against hourly order influx to detect understaffed rush bottlenecks vs overstaffed dead hours.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-surface-elevated px-4 py-2.5 rounded-xl border border-border flex items-center gap-4">
            <div>
              <div className="text-[11px] text-muted-foreground font-medium uppercase">Blended SPLH</div>
              <div className="text-lg font-bold text-foreground">
                {formatCompactRupiah(blendedSplh)}/hr/staff
              </div>
            </div>
            <div className="h-8 w-[1px] bg-border" />
            <div>
              <div className="text-[11px] text-muted-foreground font-medium uppercase">Labor-to-Sales %</div>
              <div className={`text-lg font-bold ${blendedLaborPct > 30 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                {blendedLaborPct}%
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* QUICK HIGHLIGHT CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/5">
          <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300 font-semibold text-xs mb-1">
            <Flame className="w-4 h-4" />
            Peak Efficiency Window (Max SPLH)
          </div>
          <div className="text-xl font-extrabold text-foreground">{peakSplhHour}</div>
          <p className="text-xs text-muted-foreground mt-1">
            Generated <strong className="text-emerald-600 dark:text-emerald-400">{formatRupiah(peakSplhValue)}</strong> per labor hour.
          </p>
        </div>

        <div className="p-4 rounded-xl border border-rose-500/30 bg-rose-500/5">
          <div className="flex items-center gap-2 text-rose-700 dark:text-rose-300 font-semibold text-xs mb-1">
            <ShieldAlert className="w-4 h-4" />
            Highest Kitchen Strain Window
          </div>
          <div className="text-xl font-extrabold text-foreground">{highestStrainHour}</div>
          <p className="text-xs text-muted-foreground mt-1">
            Elevated SLA breaches & longest prep wait. Cook line needs support.
          </p>
        </div>

        <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/5">
          <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300 font-semibold text-xs mb-1">
            <Clock className="w-4 h-4" />
            Shift Optimization Opportunity
          </div>
          <div className="text-xl font-extrabold text-foreground">14:00 - 17:00 (Afternoon)</div>
          <p className="text-xs text-muted-foreground mt-1">
            Labor cost spikes &gt; 35% of GMV. Reassign kru to batch prep or staggered rest.
          </p>
        </div>
      </div>

      {/* COMBO CHART: GMV / SPLH / ACTIVE STAFF */}
      <div className="bg-surface p-6 rounded-2xl border border-border shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-foreground">Sales Per Labor Hour (SPLH) vs Staff Headcount</h3>
            <p className="text-xs text-muted-foreground">Bars show hourly GMV; lines track active staff headcount and SPLH efficiency.</p>
          </div>
          <button
            onClick={() => setShowTable(!showTable)}
            className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
          >
            {showTable ? 'Hide Table View' : 'Show Hourly Audit Table'}
            {showTable ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>

        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 10, right: 20, bottom: 20, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
              <XAxis dataKey="hour" tick={{ fontSize: 11 }} />
              <YAxis
                yAxisId="left"
                tickFormatter={(val) => formatCompactRupiah(val)}
                tick={{ fontSize: 11 }}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                domain={[0, 8]}
                tick={{ fontSize: 11 }}
                unit=" kru"
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const d = payload[0].payload;
                  return (
                    <div className="bg-surface p-3 rounded-xl border border-border shadow-lg text-xs space-y-1">
                      <div className="font-bold text-foreground">{d.hour}</div>
                      <div className="text-muted-foreground">Orders: <span className="text-foreground font-semibold">{d.orders}</span></div>
                      <div className="text-muted-foreground">GMV: <span className="text-foreground font-semibold">{formatRupiah(d.gmv)}</span></div>
                      <div className="text-muted-foreground">Active Staff: <span className="text-foreground font-semibold">{d.staff} kru</span></div>
                      <div className="text-muted-foreground">SPLH: <span className="text-emerald-600 dark:text-emerald-400 font-bold">{formatRupiah(d.splh)}/hr</span></div>
                      <div className="text-muted-foreground">Labor %: <span className="text-foreground font-semibold">{d.laborCostPct}%</span></div>
                      <div className="pt-1 border-t border-border">
                        <span className={`px-2 py-0.5 rounded text-[10px] border ${statusBadge(d.status)}`}>
                          {d.status}
                        </span>
                      </div>
                    </div>
                  );
                }}
              />
              <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
              <Bar yAxisId="left" dataKey="gmv" name="Hourly GMV" fill="#3b82f6" opacity={0.65} radius={[4, 4, 0, 0]} />
              <Line yAxisId="left" type="monotone" dataKey="splh" name="SPLH (Sales/Labor Hr)" stroke="#10b981" strokeWidth={2.5} dot={{ r: 3 }} />
              <Line yAxisId="right" type="stepAfter" dataKey="staff" name="Active Kru Headcount" stroke="#f59e0b" strokeWidth={2} strokeDasharray="4 4" dot={{ r: 2 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* DETAILED TABLE VIEW (COLLAPSIBLE) */}
      {showTable && (
        <div className="bg-surface rounded-2xl border border-border overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-elevated text-muted-foreground font-semibold border-b border-border">
                <tr>
                  <th className="py-3 px-4">Hour Window</th>
                  <th className="py-3 px-3 text-right">Orders</th>
                  <th className="py-3 px-3 text-right">Gross GMV</th>
                  <th className="py-3 px-3 text-right">Active Kru</th>
                  <th className="py-3 px-3 text-right">Est Labor Cost</th>
                  <th className="py-3 px-3 text-right">SPLH</th>
                  <th className="py-3 px-3 text-right">Labor %</th>
                  <th className="py-3 px-3 text-right">Avg Prep</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-4">Recommendation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {hourlyPoints
                  .filter((p) => p.hour_of_day >= 7 && p.hour_of_day <= 22)
                  .map((p) => (
                    <tr key={p.hour_of_day} className="hover:bg-surface-elevated/60 transition-colors">
                      <td className="py-3 px-4 font-semibold text-foreground">{p.hour_label}</td>
                      <td className="py-3 px-3 text-right">{p.order_count}</td>
                      <td className="py-3 px-3 text-right font-medium">{formatRupiah(p.gross_gmv)}</td>
                      <td className="py-3 px-3 text-right font-medium text-amber-600 dark:text-amber-400">
                        {p.active_staff_count}
                      </td>
                      <td className="py-3 px-3 text-right text-muted-foreground">{formatRupiah(p.estimated_labor_cost)}</td>
                      <td className="py-3 px-3 text-right font-bold text-emerald-600 dark:text-emerald-400">
                        {formatRupiah(p.splh)}
                      </td>
                      <td className="py-3 px-3 text-right">{p.labor_cost_pct}%</td>
                      <td className="py-3 px-3 text-right">{p.avg_prep_time_min > 0 ? `${p.avg_prep_time_min}m` : '-'}</td>
                      <td className="py-3 px-3 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] border ${statusBadge(p.operational_status)}`}>
                          {p.operational_status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-muted-foreground text-[11px]">{p.recommendation}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
