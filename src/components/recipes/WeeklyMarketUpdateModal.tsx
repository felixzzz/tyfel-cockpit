'use client';

import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Search,
  Check,
  X,
  RotateCcw,
  Sparkles,
  AlertTriangle,
  Zap,
} from 'lucide-react';
import {
  formatRp,
  formatCompactRp,
} from './types';
import type { MasterIngredientRecord } from '@/lib/recipesCogs';

interface WeeklyMarketUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  ingredients: MasterIngredientRecord[];
  showNotice: (type: 'success' | 'error', text: string) => void;
}

export function WeeklyMarketUpdateModal({
  isOpen,
  onClose,
  onSuccess,
  ingredients,
  showNotice,
}: WeeklyMarketUpdateModalProps) {
  // Local state holding edited prices keyed by ingredient_id
  const [editedPrices, setEditedPrices] = useState<Record<string, number>>({});
  const [search, setSearch] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('volatile');
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Filtered ingredients
  const filteredList = useMemo(() => {
    const q = search.trim().toLowerCase();
    return ingredients.filter((ing) => {
      if (categoryFilter === 'volatile') {
        if (!ing.is_volatile) return false;
      } else if (categoryFilter !== 'all' && ing.category !== categoryFilter) {
        return false;
      }
      if (!q) return true;
      return (
        ing.ingredient_name.toLowerCase().includes(q) ||
        ing.ingredient_id.toLowerCase().includes(q) ||
        ing.supplier_name.toLowerCase().includes(q) ||
        ing.category.toLowerCase().includes(q)
      );
    });
  }, [ingredients, search, categoryFilter]);

  // Track modified ingredients
  const modifiedItems = useMemo(() => {
    const items: Array<{
      ingredient: MasterIngredientRecord;
      newPrice: number;
      deltaRp: number;
      deltaPct: number;
      monthlyImpactRp: number;
    }> = [];

    for (const [id, newPrice] of Object.entries(editedPrices)) {
      const ing = ingredients.find((i) => i.ingredient_id === id);
      if (!ing) continue;
      if (Math.round(newPrice) !== Math.round(ing.purchase_price)) {
        const deltaRp = newPrice - ing.purchase_price;
        const deltaPct = ing.purchase_price > 0 ? (deltaRp / ing.purchase_price) * 100 : 0;
        const newEffCost =
          newPrice / (Math.max(1, ing.purchase_qty) * (Math.max(10, ing.yield_pct) / 100));
        const oldEffCost = ing.effective_unit_cost;
        const monthlyImpact = Math.round(ing.monthly_units_consumed * (newEffCost - oldEffCost));

        items.push({
          ingredient: ing,
          newPrice,
          deltaRp,
          deltaPct,
          monthlyImpactRp: monthlyImpact,
        });
      }
    }
    return items;
  }, [editedPrices, ingredients]);

  const totalMonthlyImpactRp = useMemo(() => {
    return modifiedItems.reduce((acc, curr) => acc + curr.monthlyImpactRp, 0);
  }, [modifiedItems]);

  if (!isOpen) return null;

  const handlePriceChange = (ingredientId: string, valStr: string) => {
    const num = Math.max(0, parseInt(valStr.replace(/[^0-9]/g, '') || '0', 10));
    setEditedPrices((prev) => ({
      ...prev,
      [ingredientId]: num,
    }));
  };

  const handleResetRow = (ingredientId: string) => {
    setEditedPrices((prev) => {
      const copy = { ...prev };
      delete copy[ingredientId];
      return copy;
    });
  };

  const handleResetAll = () => {
    setEditedPrices({});
  };

  const handleApplyChanges = async () => {
    if (modifiedItems.length === 0) return;
    setSubmitting(true);

    try {
      const updates = modifiedItems.map((item) => ({
        ingredient_id: item.ingredient.ingredient_id,
        purchase_price: item.newPrice,
      }));

      const res = await fetch('/api/recipes/cogs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'quick_update_prices',
          updates,
        }),
      });

      const json = await res.json();
      if (!json.ok) throw new Error(json.error || 'Gagal menyimpan harga pasar');

      showNotice(
        'success',
        `Berhasil memperbarui ${updates.length} harga bahan pasar. HPP dan margin pada seluruh menu terkait telah disinkronkan!`
      );
      onSuccess();
      onClose();
    } catch (err) {
      showNotice('error', err instanceof Error ? err.message : 'Gagal memperbarui harga pasar');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-2xl shadow-2xl max-w-5xl w-full max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[var(--border-subtle)] flex items-center justify-between gap-4 bg-[var(--bg-surface-2)] shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-[var(--text-primary)] font-display flex items-center gap-2">
                <span>Papan Update Cepat Belanja Pasar (Weekly Market Ticker)</span>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                  Live COGS Cascade
                </span>
              </h2>
              <p className="text-xs text-[var(--text-secondary)]">
                Input harga belanja pasar atau invoice supplier mingguan dalam &lt; 1 menit. HPP &amp; Gross Margin seluruh resep otomatis dihitung ulang.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-3)] transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filters & Search Toolbar */}
        <div className="px-5 py-3 border-b border-[var(--border-subtle)] bg-[var(--bg-surface)] flex flex-col md:flex-row md:items-center justify-between gap-3 shrink-0">
          {/* Category Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setCategoryFilter('volatile')}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                categoryFilter === 'volatile'
                  ? 'bg-amber-500 text-white shadow-2xs'
                  : 'bg-[var(--bg-surface-2)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-subtle)]'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Bahan Fluktuatif Pasar ({ingredients.filter((i) => i.is_volatile).length})</span>
            </button>

            <button
              type="button"
              onClick={() => setCategoryFilter('all')}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                categoryFilter === 'all'
                  ? 'bg-[var(--accent-primary)] text-white shadow-2xs'
                  : 'bg-[var(--bg-surface-2)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-subtle)]'
              }`}
            >
              Semua Bahan ({ingredients.length})
            </button>

            {['Dairy & Plant Milk', 'Coffee & Tea', 'Plant Proteins & Eggs', 'Produce & Fungi', 'Sauces, Oils & Sweeteners'].map(
              (cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-2.5 py-1.5 rounded-xl text-[11px] transition-all cursor-pointer hidden lg:inline-flex ${
                    categoryFilter === cat
                      ? 'bg-[var(--accent-primary)] text-white shadow-2xs'
                      : 'bg-[var(--bg-surface-2)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-subtle)]'
                  }`}
                >
                  {cat.split('&')[0].trim()}
                </button>
              )
            )}
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-64">
            <Search className="w-3.5 h-3.5 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari bahan atau supplier..."
              className="w-full pl-8 pr-3 py-1.5 rounded-xl text-xs bg-[var(--bg-surface-2)] border border-[var(--border-default)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
            />
          </div>
        </div>

        {/* Live Impact Alert Strip if changes made */}
        {modifiedItems.length > 0 && (
          <div className="px-5 py-2.5 bg-gradient-to-r from-amber-500/10 via-[var(--bg-surface-2)] to-emerald-500/10 border-b border-[var(--border-subtle)] flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
              <span className="font-semibold text-[var(--text-primary)]">
                {modifiedItems.length} bahan sedang diubah:
              </span>
              <span className="text-[var(--text-secondary)]">
                Estimasi dampak pengeluaran:{' '}
                <strong
                  className={`font-mono ${
                    totalMonthlyImpactRp > 0
                      ? 'text-rose-600 dark:text-rose-400'
                      : totalMonthlyImpactRp < 0
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-[var(--text-primary)]'
                  }`}
                >
                  {totalMonthlyImpactRp > 0 ? '+' : ''}
                  {formatRp(totalMonthlyImpactRp)} / bulan
                </strong>
              </span>
            </div>

            <button
              type="button"
              onClick={handleResetAll}
              className="inline-flex items-center gap-1 text-[11px] text-[var(--text-muted)] hover:text-rose-500 cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset Semua</span>
            </button>
          </div>
        )}

        {/* Table Body */}
        <div className="p-5 flex-1 overflow-y-auto">
          <div className="border border-[var(--border-default)] rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-[var(--bg-surface-2)] border-b border-[var(--border-subtle)] text-[var(--text-secondary)] sticky top-0 z-10">
                <tr>
                  <th className="py-2.5 px-3 font-semibold">Bahan Baku &amp; Supplier</th>
                  <th className="py-2.5 px-3 font-semibold">Kemasan Beli</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Harga Terakhir</th>
                  <th className="py-2.5 px-3 font-semibold text-right min-w-[150px]">Harga Pasar Baru (Rp)</th>
                  <th className="py-2.5 px-3 font-semibold text-center">Selisih (%)</th>
                  <th className="py-2.5 px-3 font-semibold text-center">Menu Terdampak</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Dampak / Bulan</th>
                  <th className="py-2.5 px-3 font-semibold text-center w-10">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-subtle)]">
                {filteredList.map((ing) => {
                  const isModified = ing.ingredient_id in editedPrices;
                  const currentEffectivePrice = isModified
                    ? editedPrices[ing.ingredient_id]
                    : ing.purchase_price;

                  const deltaRp = currentEffectivePrice - ing.purchase_price;
                  const deltaPct =
                    ing.purchase_price > 0 ? (deltaRp / ing.purchase_price) * 100 : 0;

                  const newEffCost =
                    currentEffectivePrice /
                    (Math.max(1, ing.purchase_qty) * (Math.max(10, ing.yield_pct) / 100));
                  const rowMonthlyImpact = Math.round(
                    ing.monthly_units_consumed * (newEffCost - ing.effective_unit_cost)
                  );

                  return (
                    <tr
                      key={ing.ingredient_id}
                      className={`hover:bg-[var(--bg-surface-2)] transition-colors ${
                        isModified ? 'bg-amber-500/5' : ''
                      }`}
                    >
                      <td className="py-2.5 px-3">
                        <div className="font-semibold text-[var(--text-primary)]">
                          {ing.ingredient_name}
                        </div>
                        <div className="text-[11px] text-[var(--text-muted)] flex items-center gap-1.5 mt-0.5">
                          <span className="font-mono">{ing.ingredient_id}</span>
                          <span>·</span>
                          <span>{ing.supplier_name}</span>
                        </div>
                      </td>

                      <td className="py-2.5 px-3 font-mono text-[var(--text-secondary)]">
                        {ing.purchase_qty.toLocaleString()} {ing.base_unit} ({ing.purchase_unit_label})
                      </td>

                      <td className="py-2.5 px-3 text-right font-mono font-medium text-[var(--text-muted)]">
                        Rp {ing.purchase_price.toLocaleString('id-ID')}
                      </td>

                      <td className="py-2.5 px-3 text-right">
                        <div className="inline-flex items-center gap-1.5 justify-end">
                          <span className="text-[11px] font-mono text-[var(--text-muted)]">Rp</span>
                          <input
                            type="text"
                            value={currentEffectivePrice.toLocaleString('id-ID')}
                            onChange={(e) => handlePriceChange(ing.ingredient_id, e.target.value)}
                            className={`w-28 px-2.5 py-1 text-right font-mono font-bold rounded-lg border text-xs transition-all ${
                              isModified
                                ? 'border-amber-500 bg-amber-500/10 text-[var(--text-primary)]'
                                : 'border-[var(--border-default)] bg-[var(--bg-surface-2)] text-[var(--text-primary)]'
                            }`}
                          />
                        </div>
                      </td>

                      <td className="py-2.5 px-3 text-center">
                        {Math.abs(deltaPct) < 0.1 ? (
                          <span className="text-[10px] font-mono text-[var(--text-muted)]">
                            Tetap
                          </span>
                        ) : deltaPct > 0 ? (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400">
                            <TrendingUp className="w-3 h-3" />
                            +{deltaPct.toFixed(1)}%
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                            <TrendingDown className="w-3 h-3" />
                            {deltaPct.toFixed(1)}%
                          </span>
                        )}
                      </td>

                      <td className="py-2.5 px-3 text-center">
                        <span
                          className="px-2 py-0.5 rounded-full text-[11px] font-mono font-semibold bg-[var(--bg-surface-3)] text-[var(--text-secondary)]"
                          title={ing.recipe_names.join(', ')}
                        >
                          {ing.recipes_using_count} menu
                        </span>
                      </td>

                      <td className="py-2.5 px-3 text-right font-mono">
                        {rowMonthlyImpact === 0 ? (
                          <span className="text-[var(--text-muted)]">-</span>
                        ) : rowMonthlyImpact > 0 ? (
                          <span className="font-bold text-rose-600 dark:text-rose-400">
                            +{formatCompactRp(rowMonthlyImpact)}
                          </span>
                        ) : (
                          <span className="font-bold text-emerald-600 dark:text-emerald-400">
                            {formatCompactRp(rowMonthlyImpact)}
                          </span>
                        )}
                      </td>

                      <td className="py-2.5 px-3 text-center">
                        {isModified ? (
                          <button
                            type="button"
                            onClick={() => handleResetRow(ing.ingredient_id)}
                            className="p-1 text-[var(--text-muted)] hover:text-rose-500 cursor-pointer"
                            title="Kembalikan ke harga semula"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <span className="text-zinc-400 text-xs">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-4 border-t border-[var(--border-subtle)] bg-[var(--bg-surface-2)] flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-[var(--text-muted)]">
            {modifiedItems.length > 0 ? (
              <span>
                <strong>{modifiedItems.length} bahan</strong> akan diperbarui harganya &amp; resep terkait akan otomatis dihitung ulang.
              </span>
            ) : (
              <span>Ubah nilai pada kolom <strong>Harga Pasar Baru</strong> untuk melihat estimasi dampak biaya.</span>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-3)] border border-[var(--border-subtle)] transition-all cursor-pointer"
            >
              Batal
            </button>

            <button
              type="button"
              onClick={handleApplyChanges}
              disabled={modifiedItems.length === 0 || submitting}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-all cursor-pointer disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Sparkles className="w-3.5 h-3.5 animate-spin" />
                  <span>Menyimpan &amp; Menghitung Ulang...</span>
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>
                    Simpan &amp; Update HPP ({modifiedItems.length} Bahan)
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
