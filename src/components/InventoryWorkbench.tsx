'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  AlertTriangle,
  AlertOctagon,
  CheckCircle2,
  RefreshCw,
  Search,
  Filter,
  DollarSign,
  Zap,
} from 'lucide-react';
import type {
  IngredientInventoryItem,
  InventoryTelemetry,
  InventoryTransactionRecord,
} from '@/lib/inventory';

function formatRp(val: number): string {
  return `Rp ${Math.round(Number(val) || 0).toLocaleString('id-ID')}`;
}

function formatCompactRp(val: number): string {
  const n = Number(val) || 0;
  if (Math.abs(n) >= 1_000_000_000) return `Rp ${(n / 1_000_000_000).toFixed(2)}B`;
  if (Math.abs(n) >= 1_000_000) return `Rp ${(n / 1_000_000).toFixed(2)}M`;
  if (Math.abs(n) >= 1_000) return `Rp ${(n / 1_000).toFixed(0)}k`;
  return `Rp ${Math.round(n)}`;
}

export function InventoryWorkbench() {
  const [items, setItems] = useState<IngredientInventoryItem[]>([]);
  const [telemetry, setTelemetry] = useState<InventoryTelemetry | null>(null);
  const [transactions, setTransactions] = useState<InventoryTransactionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionBusy, setActionBusy] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'alerts' | 'OUT_OF_STOCK' | 'CRITICAL' | 'LOW_STOCK' | 'HEALTHY'>('all');

  // Restock modal state
  const [restockModalItem, setRestockModalItem] = useState<IngredientInventoryItem | null>(null);
  const [restockQty, setRestockQty] = useState<number>(0);
  const [restockNotes, setRestockNotes] = useState<string>('');

  const fetchInventory = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/inventory');
      if (!res.ok) throw new Error('Failed to load inventory data');
      const data = await res.json();
      setItems(data.items || []);
      setTelemetry(data.telemetry || null);
      setTransactions(data.recentTransactions || []);
    } catch (err) {
      setToast({ type: 'error', text: (err as Error).message });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  const handleRunDepletion = async () => {
    try {
      setActionBusy(true);
      const res = await fetch('/api/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'deplete_bom' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Depletion failed');
      setToast({
        type: 'success',
        text: `BOM Depletion synced! Processed ${data.result.ordersProcessed} POS orders across ${data.result.depletedIngredientsCount} raw materials.`,
      });
      fetchInventory();
    } catch (err) {
      setToast({ type: 'error', text: (err as Error).message });
    } finally {
      setActionBusy(false);
    }
  };

  const handleQuickRestock = async () => {
    if (!restockModalItem) return;
    try {
      setActionBusy(true);
      const newStock = restockModalItem.currentStock + Number(restockQty);
      const res = await fetch('/api/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'adjust_stock',
          ingredientId: restockModalItem.ingredientId,
          newStock,
          reason: 'PURCHASE_RESTOCK',
          notes: restockNotes || `Restocked +${restockQty} ${restockModalItem.baseUnit} via Cockpit Workbench`,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Restock failed');
      setToast({
        type: 'success',
        text: `Restocked ${restockModalItem.ingredientName}! New stock: ${newStock} ${restockModalItem.baseUnit}`,
      });
      setRestockModalItem(null);
      fetchInventory();
    } catch (err) {
      setToast({ type: 'error', text: (err as Error).message });
    } finally {
      setActionBusy(false);
    }
  };

  // Filtered ingredients
  const categories = useMemo(() => {
    const set = new Set<string>();
    items.forEach((i) => set.add(i.category));
    return Array.from(set).sort();
  }, [items]);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchSearch =
        !search ||
        item.ingredientName.toLowerCase().includes(search.toLowerCase()) ||
        item.ingredientId.toLowerCase().includes(search.toLowerCase()) ||
        item.supplierName.toLowerCase().includes(search.toLowerCase());

      const matchCategory = categoryFilter === 'all' || item.category === categoryFilter;

      let matchStatus = true;
      if (statusFilter === 'alerts') {
        matchStatus = item.status !== 'HEALTHY';
      } else if (statusFilter !== 'all') {
        matchStatus = item.status === statusFilter;
      }

      return matchSearch && matchCategory && matchStatus;
    });
  }, [items, search, categoryFilter, statusFilter]);

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`p-3 rounded-xl border text-xs flex items-center justify-between shadow-sm animate-fade-in ${
            toast.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 shrink-0" />
            )}
            <span>{toast.text}</span>
          </div>
          <button
            onClick={() => setToast(null)}
            className="text-xs underline opacity-70 hover:opacity-100"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Telemetry KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        {/* Out of Stock */}
        <div
          onClick={() => setStatusFilter(statusFilter === 'OUT_OF_STOCK' ? 'all' : 'OUT_OF_STOCK')}
          className={`p-4 rounded-xl border cursor-pointer transition ${
            statusFilter === 'OUT_OF_STOCK'
              ? 'bg-rose-500/20 border-rose-500 shadow-md ring-2 ring-rose-500/30'
              : 'bg-[var(--bg-surface)] border-[var(--border-subtle)] hover:border-rose-500/40'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-rose-600 dark:text-rose-400 uppercase tracking-wider">
              Out of Stock
            </span>
            <AlertOctagon className="w-4 h-4 text-rose-500" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-[var(--text-main)]">
            {telemetry?.outOfStockCount ?? 0}
          </div>
          <p className="mt-1 text-[11px] text-[var(--text-muted)]">
            Immediate kitchen halt risk
          </p>
        </div>

        {/* Critical & Low Stock */}
        <div
          onClick={() => setStatusFilter(statusFilter === 'alerts' ? 'all' : 'alerts')}
          className={`p-4 rounded-xl border cursor-pointer transition ${
            statusFilter === 'alerts'
              ? 'bg-amber-500/20 border-amber-500 shadow-md ring-2 ring-amber-500/30'
              : 'bg-[var(--bg-surface)] border-[var(--border-subtle)] hover:border-amber-500/40'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
              Reorder Alerts
            </span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-[var(--text-main)]">
            {(telemetry?.lowStockCount ?? 0) + (telemetry?.criticalCount ?? 0)}
          </div>
          <p className="mt-1 text-[11px] text-[var(--text-muted)]">
            {telemetry?.criticalCount ?? 0} critical &lt; 50% safety stock
          </p>
        </div>

        {/* Healthy Stock */}
        <div
          onClick={() => setStatusFilter(statusFilter === 'HEALTHY' ? 'all' : 'HEALTHY')}
          className={`p-4 rounded-xl border cursor-pointer transition ${
            statusFilter === 'HEALTHY'
              ? 'bg-emerald-500/20 border-emerald-500 shadow-md ring-2 ring-emerald-500/30'
              : 'bg-[var(--bg-surface)] border-[var(--border-subtle)] hover:border-emerald-500/40'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
              Adequate Stock
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-[var(--text-main)]">
            {telemetry?.healthyCount ?? 0}
          </div>
          <p className="mt-1 text-[11px] text-[var(--text-muted)]">
            Safe buffer above par level
          </p>
        </div>

        {/* Total Inventory Value */}
        <div className="p-4 rounded-xl border bg-[var(--bg-surface)] border-[var(--border-subtle)]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
              Total Stock Asset
            </span>
            <DollarSign className="w-4 h-4 text-blue-500" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-[var(--text-main)]">
            {formatCompactRp(telemetry?.totalInventoryValue ?? 0)}
          </div>
          <p className="mt-1 text-[11px] text-[var(--text-muted)]">
            {telemetry?.totalIngredients ?? 0} cataloged raw ingredients
          </p>
        </div>

        {/* Depletion Sync Status */}
        <div className="p-4 rounded-xl border bg-[var(--bg-surface)] border-[var(--border-subtle)] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-wider">
                POS BOM Depletion
              </span>
              <Zap className="w-4 h-4 text-purple-500" />
            </div>
            <p className="mt-2 text-xs text-[var(--text-muted)]">
              Last synced:{' '}
              <span className="font-mono text-[var(--text-main)] font-semibold">
                {telemetry?.lastSyncTime
                  ? new Date(telemetry.lastSyncTime).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : 'Pending first sync'}
              </span>
            </p>
          </div>
          <button
            onClick={handleRunDepletion}
            disabled={actionBusy}
            className="mt-3 flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-purple-600 hover:bg-purple-700 text-white shadow-sm transition disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${actionBusy ? 'animate-spin' : ''}`} />
            <span>Sync BOM Depletion</span>
          </button>
        </div>
      </div>

      {/* Action and Filter Control Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-[var(--bg-surface)] border border-[var(--border-subtle)] p-3 rounded-xl shadow-sm">
        <div className="flex flex-wrap items-center gap-2 flex-1">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
            <input
              type="text"
              placeholder="Search ingredient, SKU, supplier..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-main)] text-[var(--text-main)] focus:outline-none focus:ring-2 focus:ring-blue-500/40"
            />
          </div>

          {/* Category Filter */}
          <div className="flex items-center gap-1.5 border border-[var(--border-subtle)] rounded-lg px-2.5 py-1.5 text-xs bg-[var(--bg-main)]">
            <Filter className="w-3.5 h-3.5 text-[var(--text-muted)]" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-transparent text-[var(--text-main)] outline-none cursor-pointer font-medium"
            >
              <option value="all">All Categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1 text-xs">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-2.5 py-1 rounded-lg border transition ${
                statusFilter === 'all'
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-[var(--bg-main)] border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-[var(--text-main)]'
              }`}
            >
              All ({items.length})
            </button>
            <button
              onClick={() => setStatusFilter('alerts')}
              className={`px-2.5 py-1 rounded-lg border transition ${
                statusFilter === 'alerts'
                  ? 'bg-amber-600 text-white border-amber-600'
                  : 'bg-[var(--bg-main)] border-[var(--border-subtle)] text-amber-600 dark:text-amber-400 hover:text-[var(--text-main)]'
              }`}
            >
              Alerts Only ({(telemetry?.lowStockCount ?? 0) + (telemetry?.criticalCount ?? 0) + (telemetry?.outOfStockCount ?? 0)})
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchInventory}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-[var(--border-subtle)] hover:bg-[var(--bg-surface-2)] transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Main Stock Table */}
      <div className="border border-[var(--border-subtle)] rounded-xl overflow-hidden bg-[var(--bg-surface)] shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[var(--bg-surface-2)]/60 border-b border-[var(--border-subtle)] text-[var(--text-muted)] font-medium">
                <th className="py-3 px-4">Ingredient & Supplier</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4 text-right">Current Stock</th>
                <th className="py-3 px-4">Stock Par Level</th>
                <th className="py-3 px-4 text-right">Burn Rate (7d)</th>
                <th className="py-3 px-4 text-right">Runway (Days)</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Stock Value</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-subtle)]">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-xs text-[var(--text-muted)]">
                    No ingredients match the selected filters.
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => {
                  const pct = Math.min(100, Math.round((item.currentStock / Math.max(1, item.minStockThreshold)) * 100));
                  return (
                    <tr
                      key={item.ingredientId}
                      className="hover:bg-[var(--bg-surface-2)]/40 transition group"
                    >
                      <td className="py-3 px-4">
                        <div className="font-semibold text-[var(--text-main)]">
                          {item.ingredientName}
                        </div>
                        <div className="text-[11px] text-[var(--text-muted)] flex items-center gap-1.5 mt-0.5">
                          <span className="font-mono">{item.ingredientId}</span>
                          <span>•</span>
                          <span>{item.supplierName}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-medium bg-[var(--bg-surface-2)] border border-[var(--border-subtle)] text-[var(--text-secondary)]">
                          {item.category}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-semibold text-[var(--text-main)]">
                        {item.currentStock.toLocaleString('id-ID')} {item.baseUnit}
                      </td>
                      <td className="py-3 px-4 min-w-[140px]">
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[10px] text-[var(--text-muted)] font-mono">
                            <span>{pct}% Par</span>
                            <span>Min: {item.minStockThreshold} {item.baseUnit}</span>
                          </div>
                          <div className="w-full h-1.5 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                item.status === 'OUT_OF_STOCK'
                                  ? 'bg-rose-600 w-0'
                                  : item.status === 'CRITICAL'
                                  ? 'bg-rose-500'
                                  : item.status === 'LOW_STOCK'
                                  ? 'bg-amber-500'
                                  : 'bg-emerald-500'
                              }`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-[var(--text-main)]">
                        {item.dailyBurnRate > 0 ? (
                          <span>
                            {item.dailyBurnRate} {item.baseUnit}/d
                          </span>
                        ) : (
                          <span className="text-[var(--text-muted)]">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-semibold">
                        {item.daysOfStockLeft === 999 ? (
                          <span className="text-[var(--text-muted)] font-normal">&gt; 30d</span>
                        ) : item.daysOfStockLeft <= 2 ? (
                          <span className="text-rose-600 dark:text-rose-400">
                            {item.daysOfStockLeft}d
                          </span>
                        ) : item.daysOfStockLeft <= 7 ? (
                          <span className="text-amber-600 dark:text-amber-400">
                            {item.daysOfStockLeft}d
                          </span>
                        ) : (
                          <span className="text-emerald-600 dark:text-emerald-400">
                            {item.daysOfStockLeft}d
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {item.status === 'OUT_OF_STOCK' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30">
                            <AlertOctagon className="w-3 h-3" />
                            <span>Out of Stock</span>
                          </span>
                        )}
                        {item.status === 'CRITICAL' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30">
                            <AlertTriangle className="w-3 h-3" />
                            <span>Critical Low</span>
                          </span>
                        )}
                        {item.status === 'LOW_STOCK' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                            <AlertTriangle className="w-3 h-3" />
                            <span>Low Stock</span>
                          </span>
                        )}
                        {item.status === 'HEALTHY' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Adequate</span>
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-medium text-[var(--text-main)]">
                        {formatRp(item.totalValue)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => {
                            setRestockModalItem(item);
                            setRestockQty(item.recommendedReorderQty || item.reorderQty || 1000);
                            setRestockNotes('');
                          }}
                          className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-[var(--bg-main)] hover:bg-blue-600 hover:text-white border border-[var(--border-subtle)] transition"
                        >
                          Restock
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Inventory Audit Ledger */}
      {transactions.length > 0 && (
        <div className="border border-[var(--border-subtle)] rounded-xl overflow-hidden bg-[var(--bg-surface)] shadow-sm">
          <div className="p-3.5 bg-[var(--bg-surface-2)]/60 border-b border-[var(--border-subtle)] flex items-center justify-between">
            <h4 className="text-xs font-bold text-[var(--text-main)] uppercase tracking-wider">
              Recent Inventory Audit Ledger (Depletions &amp; Restocks)
            </h4>
            <span className="text-[10px] font-mono text-[var(--text-muted)]">
              Last {transactions.length} events recorded
            </span>
          </div>
          <div className="overflow-x-auto max-h-60">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[var(--border-subtle)] text-[var(--text-muted)] font-medium bg-[var(--bg-surface-2)]/30">
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Ingredient</th>
                  <th className="py-2.5 px-3">Transaction Type</th>
                  <th className="py-2.5 px-3 text-right">Adjustment Qty</th>
                  <th className="py-2.5 px-3 text-right">Balance</th>
                  <th className="py-2.5 px-3">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-subtle)]">
                {transactions.map((t) => (
                  <tr key={t.txId} className="hover:bg-[var(--bg-surface-2)]/30 transition text-[11px]">
                    <td className="py-2 px-3 font-mono whitespace-nowrap text-[var(--text-muted)]">
                      {new Date(t.createdAt).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="py-2 px-3 font-semibold text-[var(--text-main)]">
                      {t.ingredientName}
                    </td>
                    <td className="py-2 px-3">
                      <span
                        className={`px-1.5 py-0.5 rounded font-mono text-[10px] font-semibold ${
                          t.txType === 'DEPLETION_SALE'
                            ? 'bg-purple-500/15 text-purple-700 dark:text-purple-300'
                            : t.txType === 'PURCHASE_RESTOCK'
                            ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                            : 'bg-amber-500/15 text-amber-700 dark:text-amber-300'
                        }`}
                      >
                        {t.txType}
                      </span>
                    </td>
                    <td
                      className={`py-2 px-3 text-right font-mono font-bold ${
                        t.changeQty < 0
                          ? 'text-rose-600 dark:text-rose-400'
                          : 'text-emerald-600 dark:text-emerald-400'
                      }`}
                    >
                      {t.changeQty > 0 ? '+' : ''}
                      {t.changeQty.toLocaleString('id-ID')} {t.baseUnit}
                    </td>
                    <td className="py-2 px-3 text-right font-mono font-medium text-[var(--text-main)]">
                      {t.resultingStock.toLocaleString('id-ID')} {t.baseUnit}
                    </td>
                    <td className="py-2 px-3 text-[var(--text-muted)] truncate max-w-xs">
                      {t.notes || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Restock Modal */}
      {restockModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-[var(--bg-surface)] border border-[var(--border-strong)] rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-base font-bold text-[var(--text-main)]">
                  Restock Raw Material
                </h3>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">
                  {restockModalItem.ingredientName} ({restockModalItem.ingredientId})
                </p>
              </div>
              <button
                onClick={() => setRestockModalItem(null)}
                className="text-[var(--text-muted)] hover:text-[var(--text-main)] text-sm"
              >
                ✕
              </button>
            </div>

            <div className="p-3 rounded-xl bg-[var(--bg-surface-2)]/60 border border-[var(--border-subtle)] space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-[var(--text-muted)]">Current Stock:</span>
                <span className="font-mono font-semibold">
                  {restockModalItem.currentStock} {restockModalItem.baseUnit}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-muted)]">Par Min Level:</span>
                <span className="font-mono font-semibold">
                  {restockModalItem.minStockThreshold} {restockModalItem.baseUnit}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-muted)]">Supplier Pack:</span>
                <span>{restockModalItem.purchaseUnitLabel} ({restockModalItem.supplierName})</span>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[var(--text-main)] mb-1">
                  Quantity to Add ({restockModalItem.baseUnit})
                </label>
                <input
                  type="number"
                  value={restockQty}
                  onChange={(e) => setRestockQty(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-main)] text-[var(--text-main)] font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-main)] mb-1">
                  Notes / Purchase Order Ref
                </label>
                <input
                  type="text"
                  placeholder="e.g. PO-2026-09 Shopee House Blend delivery"
                  value={restockNotes}
                  onChange={(e) => setRestockNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-main)] text-[var(--text-main)] focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--border-subtle)]">
              <button
                onClick={() => setRestockModalItem(null)}
                className="px-4 py-2 text-xs font-medium rounded-lg hover:bg-[var(--bg-surface-2)] text-[var(--text-muted)]"
              >
                Cancel
              </button>
              <button
                onClick={handleQuickRestock}
                disabled={actionBusy || restockQty <= 0}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition disabled:opacity-50"
              >
                Confirm Restock
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
