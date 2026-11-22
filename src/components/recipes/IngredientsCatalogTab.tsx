"use client";

import React, { useMemo } from "react";
import {
  Search,
  Plus,
  Edit3,
  Check,
  X,
  FileSpreadsheet,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Zap,
} from "lucide-react";
import type {
  RecipesCogsDashboardData,
  IngredientCategory,
  BaseUnit,
} from "@/lib/recipesCogs";
import {
  INGREDIENT_CATEGORIES,
  formatRp,
  formatCompactRp,
  formatQtyWithUnit,
} from "./types";

export interface EditingIngredientState {
  ingredient_id: string | null;
  ingredient_name: string;
  category: IngredientCategory;
  supplier_name: string;
  purchase_unit_label: string;
  purchase_qty: number;
  base_unit: BaseUnit;
  purchase_price: number;
  yield_pct: number;
}

export interface IngredientsCatalogTabProps {
  data: RecipesCogsDashboardData;
  ingCategoryFilter: string;
  onIngCategoryFilterChange: (cat: string) => void;
  ingSearch: string;
  onIngSearchChange: (val: string) => void;
  editingIngredient: EditingIngredientState | null;
  onEditIngredient: (ing: EditingIngredientState | null) => void;
  onSaveIngredient: (e: React.FormEvent) => void;
  actionBusy: boolean;
  onOpenBulkSync?: () => void;
  onOpenMarketUpdate?: () => void;
}

export function IngredientsCatalogTab({
  data,
  ingCategoryFilter,
  onIngCategoryFilterChange,
  ingSearch,
  onIngSearchChange,
  editingIngredient,
  onEditIngredient,
  onSaveIngredient,
  actionBusy,
  onOpenBulkSync,
  onOpenMarketUpdate,
}: IngredientsCatalogTabProps) {
  // Filtered Master Ingredients for Tab 2
  const filteredIngredients = useMemo(() => {
    const q = ingSearch.trim().toLowerCase();
    return data.ingredients.filter((ing) => {
      if (ingCategoryFilter !== "all" && ing.category !== ingCategoryFilter) return false;
      if (!q) return true;
      return (
        ing.ingredient_name.toLowerCase().includes(q) ||
        ing.ingredient_id.toLowerCase().includes(q) ||
        ing.supplier_name.toLowerCase().includes(q) ||
        ing.category.toLowerCase().includes(q)
      );
    });
  }, [data.ingredients, ingSearch, ingCategoryFilter]);

  return (
    <div className="space-y-6">
      {/* Category Theoretical Spend Breakdown Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-8 gap-3">
        {data.categorySpendBreakdown.map((cat) => {
          const active = ingCategoryFilter === cat.category;
          return (
            <button
              key={cat.category}
              type="button"
              onClick={() =>
                onIngCategoryFilterChange(active ? "all" : cat.category)
              }
              className={`p-3 rounded-xl text-left border transition-all cursor-pointer ${
                active
                  ? "bg-[var(--accent-primary)]/10 border-[var(--accent-primary)]"
                  : "cockpit-panel hover:bg-[var(--bg-surface-2)]"
              }`}
            >
              <div className="text-[10px] font-mono text-[var(--text-muted)] truncate">
                {cat.category}
              </div>
              <div className="text-sm font-bold font-mono text-[var(--text-primary)] mt-1">
                {formatCompactRp(cat.monthlySpend)}
              </div>
              <div className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 mt-0.5">
                {cat.shareOfSpendPct}% of spend
              </div>
            </button>
          );
        })}
      </div>

      {/* Price Spike Alert Radar Banner */}
      {data.summary.priceSpikeCount > 0 && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-[var(--bg-surface-2)] to-rose-500/10 border border-amber-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold font-display uppercase tracking-wider text-amber-600 dark:text-amber-400">
                  Radar Lonjakan Harga Pasar ({data.summary.priceSpikeCount} Bahan Baku Naik &ge; 5%)
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-mono font-semibold bg-rose-500/10 text-rose-600 border border-rose-500/20">
                  +{formatCompactRp(data.summary.netMonthlyInflationImpactRp)} / bln
                </span>
              </div>
              <p className="text-xs text-[var(--text-secondary)]">
                Terdeteksi kenaikan harga beli pada bahan baku utama. Perbarui harga belanja pasar mingguan atau simulasikan penyesuaian harga jual menu.
              </p>
              <div className="flex flex-wrap items-center gap-2 pt-1">
                {data.ingredients
                  .filter((i) => i.is_price_spiked)
                  .slice(0, 5)
                  .map((i) => (
                    <span
                      key={i.ingredient_id}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-mono bg-[var(--bg-surface-3)] text-[var(--text-primary)] border border-[var(--border-subtle)]"
                    >
                      <span className="font-semibold">{i.ingredient_name.split('(')[0].trim()}</span>
                      <span className="text-rose-500 font-bold">+{i.price_variance_pct}%</span>
                      <span className="text-[var(--text-muted)]">({i.recipes_using_count} menu)</span>
                    </span>
                  ))}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {onOpenMarketUpdate && (
              <button
                type="button"
                onClick={onOpenMarketUpdate}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white shadow-xs transition-all cursor-pointer"
                title="Buka Papan Update Cepat Belanja Pasar"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Update Belanja Pasar</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Ingredient Editor Drawer / Modal when editing or adding an ingredient */}
      {editingIngredient && (
        <form
          onSubmit={onSaveIngredient}
          className="cockpit-panel rounded-2xl p-5 border-2 border-[var(--accent-primary)] space-y-4"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Edit3 className="w-4 h-4 text-[var(--accent-primary)]" />
              <h3 className="text-sm font-bold font-display text-[var(--text-primary)]">
                {editingIngredient.ingredient_id
                  ? `Edit Master Ingredient (${editingIngredient.ingredient_id}) — Auto-Cascades to Linked Recipes`
                  : "Register New Master Ingredient / Packaging SKU"}
              </h3>
            </div>
            <button
              type="button"
              onClick={() => onEditIngredient(null)}
              className="p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <div>
              <label className="block text-[11px] font-mono text-[var(--text-secondary)] mb-1">
                Ingredient Name
              </label>
              <input
                type="text"
                required
                value={editingIngredient.ingredient_name}
                onChange={(e) =>
                  onEditIngredient({
                    ...editingIngredient,
                    ingredient_name: e.target.value,
                  })
                }
                className="w-full px-3 py-2 rounded-xl bg-[var(--bg-surface-2)] border border-[var(--border-default)] text-[var(--text-primary)]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-mono text-[var(--text-secondary)] mb-1">
                Category
              </label>
              <select
                value={editingIngredient.category}
                onChange={(e) =>
                  onEditIngredient({
                    ...editingIngredient,
                    category: e.target.value as IngredientCategory,
                  })
                }
                className="w-full px-3 py-2 rounded-xl bg-[var(--bg-surface-2)] border border-[var(--border-default)] text-[var(--text-primary)]"
              >
                {INGREDIENT_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-mono text-[var(--text-secondary)] mb-1">
                Supplier / Commissary
              </label>
              <input
                type="text"
                value={editingIngredient.supplier_name}
                onChange={(e) =>
                  onEditIngredient({
                    ...editingIngredient,
                    supplier_name: e.target.value,
                  })
                }
                className="w-full px-3 py-2 rounded-xl bg-[var(--bg-surface-2)] border border-[var(--border-default)] text-[var(--text-primary)]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-mono text-[var(--text-secondary)] mb-1">
                Pack Label (e.g. 1 kg Bag)
              </label>
              <input
                type="text"
                value={editingIngredient.purchase_unit_label}
                onChange={(e) =>
                  onEditIngredient({
                    ...editingIngredient,
                    purchase_unit_label: e.target.value,
                  })
                }
                className="w-full px-3 py-2 rounded-xl bg-[var(--bg-surface-2)] border border-[var(--border-default)] text-[var(--text-primary)]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-mono text-[var(--text-secondary)] mb-1">
                Purchase Pack Price (Rp)
              </label>
              <input
                type="number"
                min="0"
                step="100"
                required
                value={editingIngredient.purchase_price}
                onChange={(e) =>
                  onEditIngredient({
                    ...editingIngredient,
                    purchase_price: Number(e.target.value),
                  })
                }
                className="w-full px-3 py-2 rounded-xl font-mono bg-[var(--bg-surface-2)] border border-[var(--border-default)] text-[var(--text-primary)]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-mono text-[var(--text-secondary)] mb-1">
                Pack Net Quantity
              </label>
              <input
                type="number"
                min="1"
                step="any"
                required
                value={editingIngredient.purchase_qty}
                onChange={(e) =>
                  onEditIngredient({
                    ...editingIngredient,
                    purchase_qty: Number(e.target.value),
                  })
                }
                className="w-full px-3 py-2 rounded-xl font-mono bg-[var(--bg-surface-2)] border border-[var(--border-default)] text-[var(--text-primary)]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-mono text-[var(--text-secondary)] mb-1">
                Base Recipe Unit
              </label>
              <select
                value={editingIngredient.base_unit}
                onChange={(e) =>
                  onEditIngredient({
                    ...editingIngredient,
                    base_unit: e.target.value as BaseUnit,
                  })
                }
                className="w-full px-3 py-2 rounded-xl font-mono bg-[var(--bg-surface-2)] border border-[var(--border-default)] text-[var(--text-primary)]"
              >
                <option value="g">Grams (g)</option>
                <option value="ml">Milliliters (ml)</option>
                <option value="pcs">Pieces (pcs)</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-mono text-[var(--text-secondary)] mb-1">
                Usable Yield % (After Trim/Waste)
              </label>
              <input
                type="number"
                min="10"
                max="100"
                step="0.5"
                required
                value={editingIngredient.yield_pct}
                onChange={(e) =>
                  onEditIngredient({
                    ...editingIngredient,
                    yield_pct: Number(e.target.value),
                  })
                }
                className="w-full px-3 py-2 rounded-xl font-mono bg-[var(--bg-surface-2)] border border-[var(--border-default)] text-[var(--text-primary)]"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <div className="text-xs font-mono text-[var(--text-secondary)]">
              Effective Unit Cost after {editingIngredient.yield_pct}% yield:{" "}
              <span className="font-bold text-[var(--text-primary)]">
                {formatRp(
                  editingIngredient.purchase_price /
                    (Math.max(1, editingIngredient.purchase_qty) *
                      (Math.max(10, editingIngredient.yield_pct) / 100))
                )}{" "}
                / {editingIngredient.base_unit}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onEditIngredient(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-[var(--bg-surface-2)] text-[var(--text-secondary)] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={actionBusy}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-[var(--accent-primary)] text-white cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Save &amp; Auto-Cascade to Recipes</span>
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Master Ingredients Table */}
      <div className="cockpit-panel rounded-2xl overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-[var(--border-subtle)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold font-display text-[var(--text-primary)]">
              Master Ingredient &amp; Packaging Catalog ({filteredIngredients.length})
            </h2>
            <p className="text-xs text-[var(--text-secondary)]">
              Updating any pack price or yield % automatically recalculates the BOM cost of all
              recipes using that ingredient.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative w-64">
              <Search className="w-3.5 h-3.5 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={ingSearch}
                onChange={(e) => onIngSearchChange(e.target.value)}
                placeholder="Search ingredient or supplier..."
                className="w-full pl-8 pr-3 py-1.5 rounded-xl text-xs bg-[var(--bg-surface-2)] border border-[var(--border-default)] text-[var(--text-primary)]"
              />
            </div>

            {onOpenMarketUpdate && (
              <button
                type="button"
                onClick={onOpenMarketUpdate}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white transition-all cursor-pointer shadow-2xs"
                title="Papan Update Cepat Belanja Pasar Mingguan"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Update Belanja Pasar</span>
              </button>
            )}

            {onOpenBulkSync && (
              <button
                type="button"
                onClick={onOpenBulkSync}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition-all cursor-pointer shadow-2xs"
                title="Bulk Import / Export Excel & CSV Bahan Baku"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Bulk Sync Excel/CSV</span>
              </button>
            )}

            <button
              type="button"
              onClick={() =>
                onEditIngredient({
                  ingredient_id: null,
                  ingredient_name: "",
                  category: "Produce & Fungi",
                  supplier_name: "Preferred Supplier",
                  purchase_unit_label: "1 kg Pack",
                  purchase_qty: 1000,
                  base_unit: "g",
                  purchase_price: 60000,
                  yield_pct: 95,
                })
              }
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[var(--accent-primary)] text-white cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Ingredient</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-[var(--bg-surface-2)] border-b border-[var(--border-default)] text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)]">
              <tr>
                <th className="py-3 px-4">Ingredient / Supplier</th>
                <th className="py-3 px-3">Category</th>
                <th className="py-3 px-3 text-right">Purchase Pack</th>
                <th className="py-3 px-3 text-right">Pack Price</th>
                <th className="py-3 px-3 text-right">Yield %</th>
                <th className="py-3 px-3 text-right">Effective Cost</th>
                <th className="py-3 px-3 text-center">Recipes Using</th>
                <th className="py-3 px-3 text-right">POS Consumption</th>
                <th className="py-3 px-3 text-right">Theoretical Spend</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-subtle)] text-xs">
              {filteredIngredients.map((ing) => (
                <tr key={ing.ingredient_id} className="hover:bg-[var(--bg-surface-2)]">
                  <td className="py-3 px-4">
                    <div className="font-semibold text-[var(--text-primary)]">
                      {ing.ingredient_name}
                    </div>
                    <div className="text-[10px] font-mono text-[var(--text-muted)]">
                      {ing.ingredient_id} · {ing.supplier_name}
                    </div>
                  </td>
                  <td className="py-3 px-3">
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-[var(--bg-surface-2)] border border-[var(--border-subtle)] text-[var(--text-secondary)]">
                      {ing.category}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-[var(--text-secondary)]">
                    <div>{ing.purchase_unit_label}</div>
                    <div className="text-[10px] text-[var(--text-muted)]">
                      ({ing.purchase_qty.toLocaleString()} {ing.base_unit})
                    </div>
                  </td>
                  <td className="py-3 px-3 text-right font-mono">
                    <div className="font-semibold text-[var(--text-primary)]">
                      {formatRp(ing.purchase_price)}
                    </div>
                    {ing.price_variance_pct !== 0 ? (
                      <div className="flex items-center justify-end gap-1 text-[10px] mt-0.5">
                        {ing.price_variance_pct > 0 ? (
                          <span
                            className="inline-flex items-center gap-0.5 text-rose-500 font-semibold"
                            title={`Naik dari Rp ${ing.previous_price.toLocaleString('id-ID')}`}
                          >
                            <TrendingUp className="w-3 h-3" />
                            +{ing.price_variance_pct}%
                          </span>
                        ) : (
                          <span
                            className="inline-flex items-center gap-0.5 text-emerald-500 font-semibold"
                            title={`Turun dari Rp ${ing.previous_price.toLocaleString('id-ID')}`}
                          >
                            <TrendingDown className="w-3 h-3" />
                            {ing.price_variance_pct}%
                          </span>
                        )}
                      </div>
                    ) : (
                      <div className="text-[10px] text-[var(--text-muted)] mt-0.5">Stabil</div>
                    )}
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-[var(--text-secondary)]">
                    {ing.yield_pct}%
                  </td>
                  <td className="py-3 px-3 text-right font-mono">
                    <div className="font-semibold text-emerald-600 dark:text-emerald-400">
                      {formatRp(ing.effective_unit_cost)} / {ing.base_unit}
                    </div>
                    {ing.base_unit !== "pcs" && (
                      <div className="text-[10px] text-[var(--text-muted)]">
                        {formatRp(ing.cost_per_100_units)} / 100{ing.base_unit}
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-3 text-center font-mono">
                    <span
                      className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] badge-sky"
                      title={ing.recipe_names.join(", ")}
                    >
                      {ing.recipes_using_count} dishes
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-[var(--text-secondary)]">
                    {formatQtyWithUnit(ing.monthly_units_consumed, ing.base_unit)}
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-semibold text-[var(--text-primary)]">
                    {formatRp(ing.monthly_theoretical_spend)}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      type="button"
                      onClick={() =>
                        onEditIngredient({
                          ingredient_id: ing.ingredient_id,
                          ingredient_name: ing.ingredient_name,
                          category: ing.category,
                          supplier_name: ing.supplier_name,
                          purchase_unit_label: ing.purchase_unit_label,
                          purchase_qty: ing.purchase_qty,
                          base_unit: ing.base_unit,
                          purchase_price: ing.purchase_price,
                          yield_pct: ing.yield_pct,
                        })
                      }
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-[var(--bg-surface-2)] hover:bg-[var(--bg-surface-3)] text-[var(--text-primary)] border border-[var(--border-default)] cursor-pointer"
                    >
                      <Edit3 className="w-3 h-3" />
                      <span>Edit Price</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
