'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  RefreshCw,
  Search,
  Building2,
  ShieldCheck,
  Clock,
} from 'lucide-react';
import type {
  SmartBankReconciliationReport,
} from '@/lib/finance';

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatCompactRupiah(n: number): string {
  if (Math.abs(n) >= 1_000_000_000) return `Rp ${(n / 1_000_000_000).toFixed(2)}B`;
  if (Math.abs(n) >= 1_000_000) return `Rp ${(n / 1_000_000).toFixed(2)}M`;
  if (Math.abs(n) >= 1_000) return `Rp ${(n / 1_000).toFixed(0)}k`;
  return `Rp ${Math.round(n)}`;
}

interface SmartReconciliationWorkbenchProps {
  bankFilter: string;
  periodFilter: string;
}

export function SmartReconciliationWorkbench({
  bankFilter,
  periodFilter,
}: SmartReconciliationWorkbenchProps) {
  const [data, setData] = useState<SmartBankReconciliationReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeSubTab, setActiveSubTab] = useState<'matches' | 'unmatched_bank' | 'unmatched_pos'>('matches');
  const [search, setSearch] = useState('');

  const fetchReconciliation = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (bankFilter && bankFilter !== 'all') params.set('bank', bankFilter);
      if (periodFilter && periodFilter !== 'all') params.set('period', periodFilter);

      const res = await fetch(`/api/finance/reconcile?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to load reconciliation data');
      const rep = await res.json();
      setData(rep);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [bankFilter, periodFilter]);

  useEffect(() => {
    fetchReconciliation();
  }, [fetchReconciliation]);

  const summary = data?.summary;

  const filteredMatches = (data?.matches || []).filter((m) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      m.description.toLowerCase().includes(q) ||
      m.expectedSource.toLowerCase().includes(q) ||
      m.bankName.toLowerCase().includes(q)
    );
  });

  const filteredUnmatchedBank = (data?.unmatchedBank || []).filter((u) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      u.description.toLowerCase().includes(q) ||
      u.category.toLowerCase().includes(q) ||
      u.bankName.toLowerCase().includes(q)
    );
  });

  const filteredUnmatchedPos = (data?.unmatchedPos || []).filter((p) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      p.provider.toLowerCase().includes(q) ||
      p.brand.toLowerCase().includes(q) ||
      p.date.includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Smart Reconciliation Header Banner */}
      <div className="bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-blue-500/10 border border-emerald-500/20 rounded-2xl p-5 shadow-sm space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-[var(--text-main)] uppercase tracking-wider">
                  Automated Bank Settlement &amp; POS Remittance Matching
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-semibold">
                  AI-Powered
                </span>
              </div>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5 max-w-2xl">
                Automatically reconciles incoming bank mutations (BCA, Panin) against GoFood, GrabFood,
                QRIS, and Catering remittance batches with variance &amp; leakage detection.
              </p>
            </div>
          </div>

          <button
            onClick={fetchReconciliation}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-2)] border border-[var(--border-subtle)] text-[var(--text-main)] shadow-sm transition disabled:opacity-50 self-start sm:self-auto"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Re-Audit Matching</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Reconciled Volume */}
        <div className="p-4 rounded-xl border bg-[var(--bg-surface)] border-[var(--border-subtle)]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
              Reconciled Settlements
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-[var(--text-main)]">
            {formatCompactRupiah(summary?.reconciledAmount ?? 0)}
          </div>
          <p className="mt-1 text-[11px] text-[var(--text-muted)]">
            {summary?.matchedCount ?? 0} verified gateway &amp; catering batches
          </p>
        </div>

        {/* Total Bank Credits */}
        <div className="p-4 rounded-xl border bg-[var(--bg-surface)] border-[var(--border-subtle)]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
              Total Bank Inflows (CR)
            </span>
            <Building2 className="w-4 h-4 text-blue-500" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-[var(--text-main)]">
            {formatCompactRupiah(summary?.totalBankCredits ?? 0)}
          </div>
          <p className="mt-1 text-[11px] text-[var(--text-muted)]">
            Mutasi masuk across active statement periods
          </p>
        </div>

        {/* Unmatched Bank Deposits */}
        <div
          onClick={() => setActiveSubTab('unmatched_bank')}
          className={`p-4 rounded-xl border cursor-pointer transition ${
            activeSubTab === 'unmatched_bank'
              ? 'bg-amber-500/20 border-amber-500 ring-2 ring-amber-500/30'
              : 'bg-[var(--bg-surface)] border-[var(--border-subtle)] hover:border-amber-500/40'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
              Unmatched Deposits
            </span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-[var(--text-main)]">
            {summary?.unmatchedBankCount ?? 0}
          </div>
          <p className="mt-1 text-[11px] text-[var(--text-muted)]">
            {formatCompactRupiah(summary?.unmatchedBankAmount ?? 0)} direct transfers / other inflows
          </p>
        </div>

        {/* Pending POS Payouts (Leakage Risk) */}
        <div
          onClick={() => setActiveSubTab('unmatched_pos')}
          className={`p-4 rounded-xl border cursor-pointer transition ${
            activeSubTab === 'unmatched_pos'
              ? 'bg-rose-500/20 border-rose-500 ring-2 ring-rose-500/30'
              : 'bg-[var(--bg-surface)] border-[var(--border-subtle)] hover:border-rose-500/40'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-rose-600 dark:text-rose-400 uppercase tracking-wider">
              Pending POS Settlements
            </span>
            <AlertOctagon className="w-4 h-4 text-rose-500" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-[var(--text-main)]">
            {summary?.unmatchedPosCount ?? 0}
          </div>
          <p className="mt-1 text-[11px] text-[var(--text-muted)]">
            {formatCompactRupiah(summary?.unmatchedPosAmount ?? 0)} pending gateway remittance
          </p>
        </div>
      </div>

      {/* Control & Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-[var(--bg-surface)] border border-[var(--border-subtle)] p-3 rounded-xl shadow-sm">
        {/* Sub-tab selection */}
        <div className="flex items-center gap-1.5 text-xs overflow-x-auto">
          <button
            onClick={() => setActiveSubTab('matches')}
            className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer whitespace-nowrap ${
              activeSubTab === 'matches'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-[var(--bg-surface-2)] text-[var(--text-secondary)] hover:text-[var(--text-main)]'
            }`}
          >
            Matched Batches ({data?.matches.length ?? 0})
          </button>
          <button
            onClick={() => setActiveSubTab('unmatched_bank')}
            className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer whitespace-nowrap ${
              activeSubTab === 'unmatched_bank'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'bg-[var(--bg-surface-2)] text-[var(--text-secondary)] hover:text-[var(--text-main)]'
            }`}
          >
            Unmatched Deposits ({data?.unmatchedBank.length ?? 0})
          </button>
          <button
            onClick={() => setActiveSubTab('unmatched_pos')}
            className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer whitespace-nowrap ${
              activeSubTab === 'unmatched_pos'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'bg-[var(--bg-surface-2)] text-[var(--text-secondary)] hover:text-[var(--text-main)]'
            }`}
          >
            Pending POS Remittances ({data?.unmatchedPos.length ?? 0})
          </button>
        </div>

        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
          <input
            type="text"
            placeholder="Search provider, description, bank..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-main)] text-[var(--text-main)] focus:outline-none focus:ring-2 focus:ring-blue-500/40"
          />
        </div>
      </div>

      {/* Sub-tab 1: Matched Batches */}
      {activeSubTab === 'matches' && (
        <div className="border border-[var(--border-subtle)] rounded-xl overflow-hidden bg-[var(--bg-surface)] shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[var(--bg-surface-2)]/60 border-b border-[var(--border-subtle)] text-[var(--text-muted)] font-medium">
                  <th className="py-3 px-4">Bank Transaction (Mutasi Masuk)</th>
                  <th className="py-3 px-4">Bank &amp; Date</th>
                  <th className="py-3 px-4 text-right">Bank Credit</th>
                  <th className="py-3 px-4">Matched POS / Order Batch</th>
                  <th className="py-3 px-4 text-right">Expected Payout</th>
                  <th className="py-3 px-4 text-right">Variance</th>
                  <th className="py-3 px-4 text-center">Confidence</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-subtle)]">
                {filteredMatches.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-xs text-[var(--text-muted)]">
                      No matched batches found for selected filter.
                    </td>
                  </tr>
                ) : (
                  filteredMatches.map((m) => (
                    <tr key={m.matchId} className="hover:bg-[var(--bg-surface-2)]/40 transition">
                      <td className="py-3 px-4 max-w-xs">
                        <div className="font-semibold text-[var(--text-main)] truncate" title={m.description}>
                          {m.description}
                        </div>
                        <div className="text-[10px] text-[var(--text-muted)] font-mono">
                          {m.txId}
                        </div>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap font-mono text-[var(--text-secondary)]">
                        <div>{m.bankName}</div>
                        <div className="text-[10px] text-[var(--text-muted)]">{m.txDate}</div>
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        {formatRupiah(m.bankAmount)}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-[var(--text-main)]">
                          {m.expectedSource}
                        </div>
                        <div className="text-[10px] text-[var(--text-muted)] font-mono">
                          Batch Date: {m.expectedDate}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-medium text-[var(--text-main)]">
                        {formatRupiah(m.expectedAmount)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-[11px]">
                        {Math.abs(m.varianceRp) < 10 ? (
                          <span className="text-emerald-500 font-semibold">Exact</span>
                        ) : (
                          <span
                            className={
                              m.varianceRp >= 0
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : 'text-rose-600 dark:text-rose-400'
                            }
                          >
                            {m.varianceRp > 0 ? '+' : ''}
                            {formatRupiah(m.varianceRp)} ({m.variancePct}%)
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {m.confidence === 'PERFECT' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>100% Match</span>
                          </span>
                        )}
                        {m.confidence === 'HIGH_PROBABLE' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-500/30">
                            <span>High Match</span>
                          </span>
                        )}
                        {m.confidence === 'TIMING_LAG' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                            <Clock className="w-3 h-3" />
                            <span>T+2 Lag</span>
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Sub-tab 2: Unmatched Bank Deposits */}
      {activeSubTab === 'unmatched_bank' && (
        <div className="border border-[var(--border-subtle)] rounded-xl overflow-hidden bg-[var(--bg-surface)] shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[var(--bg-surface-2)]/60 border-b border-[var(--border-subtle)] text-[var(--text-muted)] font-medium">
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Bank</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4 text-right">Inflow Amount</th>
                  <th className="py-3 px-4 text-center">Audit Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-subtle)]">
                {filteredUnmatchedBank.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-xs text-[var(--text-muted)]">
                      All bank inflows reconciled!
                    </td>
                  </tr>
                ) : (
                  filteredUnmatchedBank.map((u) => (
                    <tr key={u.txId} className="hover:bg-[var(--bg-surface-2)]/40 transition">
                      <td className="py-3 px-4 font-mono whitespace-nowrap">{u.txDate}</td>
                      <td className="py-3 px-4 font-mono">{u.bankName}</td>
                      <td className="py-3 px-4 font-medium text-[var(--text-main)] max-w-sm truncate" title={u.description}>
                        {u.description}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] bg-[var(--bg-surface-2)] border border-[var(--border-subtle)]">
                          {u.category} • {u.subcategory}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        {formatRupiah(u.amount)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                          <span>Unmatched Credit</span>
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Sub-tab 3: Pending POS Settlements */}
      {activeSubTab === 'unmatched_pos' && (
        <div className="border border-[var(--border-subtle)] rounded-xl overflow-hidden bg-[var(--bg-surface)] shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[var(--bg-surface-2)]/60 border-b border-[var(--border-subtle)] text-[var(--text-muted)] font-medium">
                  <th className="py-3 px-4">Order Date</th>
                  <th className="py-3 px-4">Provider / Channel</th>
                  <th className="py-3 px-4">Brand Concept</th>
                  <th className="py-3 px-4 text-right">Orders</th>
                  <th className="py-3 px-4 text-right">Expected Payout</th>
                  <th className="py-3 px-4 text-center">Settlement Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-subtle)]">
                {filteredUnmatchedPos.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-xs text-[var(--text-muted)]">
                      All POS remittances accounted for in bank statements!
                    </td>
                  </tr>
                ) : (
                  filteredUnmatchedPos.map((p, idx) => (
                    <tr key={`${p.date}-${p.provider}-${idx}`} className="hover:bg-[var(--bg-surface-2)]/40 transition">
                      <td className="py-3 px-4 font-mono whitespace-nowrap">{p.date}</td>
                      <td className="py-3 px-4 font-semibold text-[var(--text-main)]">{p.provider}</td>
                      <td className="py-3 px-4 text-[var(--text-secondary)]">{p.brand}</td>
                      <td className="py-3 px-4 text-right font-mono">{p.orderCount} tickets</td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-rose-600 dark:text-rose-400">
                        {formatRupiah(p.expectedNetPayout)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30">
                          <AlertOctagon className="w-3 h-3" />
                          <span>Pending Remittance</span>
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
