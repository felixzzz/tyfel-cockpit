"use client";

import React, { useMemo } from "react";
import {
  Search,
  Plus,
  Trash2,
  Save,
  Sparkles,
  Layers,
} from "lucide-react";
import type {
  RecipesCogsDashboardData,
  RecipeCogsDetailRecord,
  MasterIngredientRecord,
  ComponentRole,
} from "@/lib/recipesCogs";
import {
  formatRp,
  type EditableBomLine,
} from "./types";

export interface RecipesCatalogTabProps {
  data: RecipesCogsDashboardData;
  ingredientMap: Map<string, MasterIngredientRecord>;
  selectedRecipeId: string | null;
  selectedRecipe: RecipeCogsDetailRecord | null;
  recipeSearch: string;
  onRecipeSearchChange: (val: string) => void;
  statusFilter: "all" | "healthy" | "watch" | "critical";
  onStatusFilterChange: (val: "all" | "healthy" | "watch" | "critical") => void;
  onSelectRecipe: (rec: RecipeCogsDetailRecord) => void;
  draftLines: EditableBomLine[];
  onDraftLinesChange: React.Dispatch<React.SetStateAction<EditableBomLine[]>>;
  draftTargetPct: number;
  onDraftTargetPctChange: (pct: number) => void;
  bomDirty: boolean;
  actionBusy: boolean;
  onSaveBom: () => void;
  onPopulateDefaultLines: () => void;
  onAddDraftLine: (role: ComponentRole) => void;
}

export function RecipesCatalogTab({
  data,
  ingredientMap,
  selectedRecipeId,
  selectedRecipe,
  recipeSearch,
  onRecipeSearchChange,
  statusFilter,
  onStatusFilterChange,
  onSelectRecipe,
  draftLines,
  onDraftLinesChange,
  draftTargetPct,
  onDraftTargetPctChange,
  bomDirty,
  actionBusy,
  onSaveBom,
  onPopulateDefaultLines,
  onAddDraftLine,
}: RecipesCatalogTabProps) {
  // Filtered recipes for Tab 1
  const filteredRecipes = useMemo(() => {
    const q = recipeSearch.trim().toLowerCase();
    return data.recipes.filter((r) => {
      if (statusFilter !== "all" && r.margin_status !== statusFilter) return false;
      if (!q) return true;
      return (
        r.canonical_name.toLowerCase().includes(q) ||
        r.item_name.toLowerCase().includes(q) ||
        r.brand.toLowerCase().includes(q) ||
        r.category.toLowerCase().includes(q) ||
        r.bom_summary.toLowerCase().includes(q) ||
        (r.kitchen_recipe_card || "").toLowerCase().includes(q) ||
        (r.audit_note || "").toLowerCase().includes(q)
      );
    });
  }, [data.recipes, recipeSearch, statusFilter]);

  // Live calculation for the Draft BOM in the right-hand workbench
  const draftCalculation = useMemo(() => {
    let foodCost = 0;
    let pkgDineIn = 0;
    let pkgDelivery = 0;

    const evaluatedLines = draftLines.map((ln) => {
      const ing = ingredientMap.get(ln.ingredient_id);
      const unitCost = ing ? ing.effective_unit_cost : 0;
      const lineCost = Math.round((Number(ln.qty_per_serving) || 0) * unitCost);

      if (ln.component_role === "food") foodCost += lineCost;
      else if (ln.component_role === "packaging_dine_in") pkgDineIn += lineCost;
      else if (ln.component_role === "packaging_delivery") pkgDelivery += lineCost;

      return {
        ...ln,
        ingredient: ing,
        unitCost,
        lineCost,
      };
    });

    const avgPrice = selectedRecipe?.avg_selling_price || 45000;
    const dineInTotal = foodCost + pkgDineIn;
    const deliveryTotal = foodCost + pkgDelivery;
    const blendedPkg = Math.round(pkgDineIn * 0.38 + pkgDelivery * 0.62);
    const blendedTotal = foodCost + blendedPkg;

    const dineInPct = avgPrice > 0 ? Number(((dineInTotal / avgPrice) * 100).toFixed(1)) : 0;
    const deliveryPct = avgPrice > 0 ? Number(((deliveryTotal / avgPrice) * 100).toFixed(1)) : 0;
    const blendedPct = avgPrice > 0 ? Number(((blendedTotal / avgPrice) * 100).toFixed(1)) : 0;
    const marginPerUnit = Math.max(0, avgPrice - blendedTotal);

    return {
      evaluatedLines,
      foodCost,
      pkgDineIn,
      pkgDelivery,
      dineInTotal,
      deliveryTotal,
      blendedTotal,
      dineInPct,
      deliveryPct,
      blendedPct,
      marginPerUnit,
    };
  }, [draftLines, ingredientMap, selectedRecipe]);

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
      {/* Left 7 Columns: Recipe COGS Matrix Table */}
      <div className="xl:col-span-7 cockpit-panel rounded-2xl overflow-hidden flex flex-col">
        <div className="p-4 sm:p-5 border-b border-[var(--border-subtle)] space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold font-display text-[var(--text-primary)]">
                Recipe Unit Economics & COGS Matrix ({filteredRecipes.length})
              </h2>
              <p className="text-xs text-[var(--text-secondary)]">
                Click any dish row to open its interactive Line-by-Line Ingredient BOM Workbench.
              </p>
            </div>

            {/* Search Box */}
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={recipeSearch}
                onChange={(e) => onRecipeSearchChange(e.target.value)}
                placeholder="Search dish, SKU, ingredient..."
                className="w-full pl-8 pr-3 py-1.5 rounded-xl text-xs bg-[var(--bg-surface-2)] border border-[var(--border-default)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
              />
            </div>
          </div>

          {/* Status Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            {(["all", "healthy", "watch", "critical"] as const).map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => onStatusFilterChange(st)}
                className={`px-2.5 py-1 rounded-lg font-mono text-[11px] capitalize cursor-pointer transition-all ${
                  statusFilter === st
                    ? "bg-[var(--text-primary)] text-[var(--bg-surface)] font-semibold"
                    : "bg-[var(--bg-surface-2)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                }`}
              >
                {st === "all" ? "All Statuses" : st}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto max-h-[760px] overflow-y-auto">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 z-10 bg-[var(--bg-surface-2)] border-b border-[var(--border-default)] text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)]">
              <tr>
                <th className="py-3 px-4">Dish / Concept</th>
                <th className="py-3 px-3 text-right">Avg Price</th>
                <th className="py-3 px-3 text-right">Raw Food</th>
                <th className="py-3 px-3 text-right">Pkg (DI / Del)</th>
                <th className="py-3 px-3 text-right">Blended COGS %</th>
                <th className="py-3 px-3 text-right">Margin / Unit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-subtle)] text-xs">
              {filteredRecipes.map((rec) => {
                const isSelected = rec.recipe_id === selectedRecipeId;
                return (
                  <tr
                    key={rec.recipe_id}
                    onClick={() => onSelectRecipe(rec)}
                    className={`cursor-pointer transition-colors ${
                      isSelected
                        ? "bg-[var(--accent-primary)]/10 font-medium"
                        : "hover:bg-[var(--bg-surface-2)]"
                    }`}
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-2 h-2 rounded-full shrink-0 ${
                            rec.margin_status === "healthy"
                              ? "bg-emerald-500"
                              : rec.margin_status === "watch"
                              ? "bg-amber-500"
                              : "bg-rose-500"
                          }`}
                        />
                        <div className="min-w-0">
                          <div className="font-semibold text-[var(--text-primary)] truncate max-w-[230px]">
                            {rec.canonical_name}
                          </div>
                          <div className="text-[10px] font-mono text-[var(--text-muted)] flex flex-wrap items-center gap-1.5 mt-0.5">
                            <span>{rec.brand}</span>
                            <span>·</span>
                            <span>{rec.units_sold.toLocaleString()} sold</span>
                            {rec.has_itemized_lines && (
                              <span className="text-emerald-600 dark:text-emerald-400">
                                · {rec.lines.length} lines
                              </span>
                            )}
                          </div>
                          {rec.kitchen_recipe_card && (
                            <div className="text-[10px] font-mono text-[var(--text-secondary)] flex items-center gap-1.5 mt-0.5 truncate max-w-[240px]">
                              <span
                                className={`px-1.5 py-0.2 rounded text-[9px] font-semibold shrink-0 ${
                                  rec.audit_status === "verified_sheet"
                                    ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                                    : rec.audit_status === "flagged_fixed"
                                    ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                                    : "bg-sky-500/15 text-sky-600 dark:text-sky-400"
                                }`}
                              >
                                {rec.audit_status === "verified_sheet"
                                  ? "Sheet 1:1"
                                  : rec.audit_status === "flagged_fixed"
                                  ? "Fixed Sheet"
                                  : "Shared Card"}
                              </span>
                              <span className="truncate" title={rec.kitchen_recipe_card}>
                                {rec.kitchen_recipe_card}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-[var(--text-secondary)]">
                      {formatRp(rec.avg_selling_price)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-semibold text-[var(--text-primary)]">
                      {formatRp(rec.raw_food_cost)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-[11px] text-[var(--text-muted)]">
                      {formatRp(rec.packaging_dine_in)} / {formatRp(rec.packaging_delivery)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                          rec.margin_status === "healthy"
                            ? "badge-emerald"
                            : rec.margin_status === "watch"
                            ? "badge-amber"
                            : "badge-rose"
                        }`}
                      >
                        {rec.blended_cogs_pct.toFixed(1)}%
                      </span>
                      <div className="text-[10px] text-[var(--text-muted)] mt-0.5">
                        Target ≤{rec.target_food_cost_pct}%
                      </div>
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                      +{formatRp(rec.gross_margin_per_unit)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Right 5 Columns: Interactive Line-by-Line Recipe BOM Workbench */}
      <div className="xl:col-span-5 cockpit-panel rounded-2xl p-5 space-y-5 sticky top-20">
        {selectedRecipe ? (
          <>
            {/* Selected Recipe Header */}
            <div className="flex items-start justify-between gap-3 pb-4 border-b border-[var(--border-subtle)]">
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-[var(--bg-surface-2)] text-[var(--text-secondary)] border border-[var(--border-subtle)]">
                    {selectedRecipe.brand}
                  </span>
                  <span className="text-[10px] font-mono text-[var(--text-muted)]">
                    {selectedRecipe.recipe_id}
                  </span>
                  {selectedRecipe.kitchen_recipe_card && (
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded font-semibold ${
                        selectedRecipe.audit_status === "verified_sheet"
                          ? "badge-emerald"
                          : selectedRecipe.audit_status === "flagged_fixed"
                          ? "badge-amber"
                          : "badge-sky"
                      }`}
                    >
                      {selectedRecipe.kitchen_recipe_card}
                    </span>
                  )}
                </div>
                <h3 className="text-lg font-bold font-display text-[var(--text-primary)]">
                  {selectedRecipe.canonical_name}
                </h3>
                <p className="text-xs text-[var(--text-secondary)]">
                  POS SKU: <span className="font-mono">{selectedRecipe.item_name}</span> · Avg Realized Price:{" "}
                  <span className="font-mono font-semibold text-[var(--text-primary)]">
                    {formatRp(selectedRecipe.avg_selling_price)}
                  </span>
                </p>
                {selectedRecipe.audit_note && (
                  <div className="text-[11px] font-mono text-[var(--text-muted)] bg-[var(--bg-surface-2)] px-2.5 py-1.5 rounded-lg border border-[var(--border-subtle)]">
                    <span className="font-semibold text-[var(--text-secondary)]">
                      Sheet Mapping:{" "}
                    </span>
                    {selectedRecipe.audit_note}
                  </div>
                )}
              </div>

              {bomDirty && (
                <span className="badge-amber text-[10px] font-mono px-2 py-1 rounded-lg shrink-0">
                  Unsaved Edits
                </span>
              )}
            </div>

            {/* Live Calculated Unit Economics Strip */}
            <div className="grid grid-cols-3 gap-2.5 text-xs font-mono">
              <div className="p-3 rounded-xl surface-well">
                <div className="text-[10px] text-[var(--text-muted)] uppercase">
                  Raw Food Cost
                </div>
                <div className="text-base font-bold text-[var(--text-primary)] mt-0.5">
                  {formatRp(draftCalculation.foodCost)}
                </div>
                <div className="text-[10px] text-[var(--text-secondary)]">
                  {selectedRecipe.avg_selling_price > 0
                    ? (
                        (draftCalculation.foodCost / selectedRecipe.avg_selling_price) *
                        100
                      ).toFixed(1)
                    : "0.0"}
                  % food-only
                </div>
              </div>

              <div className="p-3 rounded-xl surface-well">
                <div className="text-[10px] text-[var(--text-muted)] uppercase">
                  Dine-In vs Del COGS
                </div>
                <div className="text-sm font-bold text-[var(--text-primary)] mt-0.5">
                  {draftCalculation.dineInPct}% / {draftCalculation.deliveryPct}%
                </div>
                <div className="text-[10px] text-[var(--text-secondary)]">
                  Pkg: {formatRp(draftCalculation.pkgDineIn)} /{" "}
                  {formatRp(draftCalculation.pkgDelivery)}
                </div>
              </div>

              <div className="p-3 rounded-xl surface-well">
                <div className="text-[10px] text-[var(--text-muted)] uppercase">
                  Unit Gross Profit
                </div>
                <div className="text-base font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                  +{formatRp(draftCalculation.marginPerUnit)}
                </div>
                <div className="text-[10px] text-[var(--text-secondary)]">
                  Blended {draftCalculation.blendedPct}% COGS
                </div>
              </div>
            </div>

            {/* Visual Ingredient Cost Share Bar */}
            {draftCalculation.foodCost > 0 && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px] font-mono text-[var(--text-secondary)]">
                  <span>Dish Cost Composition</span>
                  <span>
                    Target Guardrail:{" "}
                    <input
                      type="number"
                      min={10}
                      max={75}
                      value={draftTargetPct}
                      onChange={(e) => onDraftTargetPctChange(Number(e.target.value) || 30)}
                      className="w-12 px-1.5 py-0.5 text-right rounded bg-[var(--bg-surface-2)] border border-[var(--border-default)] text-[var(--text-primary)]"
                    />
                    %
                  </span>
                </div>
                <div className="h-2.5 rounded-full bg-[var(--bg-surface-3)] overflow-hidden flex gap-0.5">
                  {draftCalculation.evaluatedLines
                    .filter((l) => l.component_role === "food" && l.lineCost > 0)
                    .map((l, idx) => {
                      const colors = [
                        "bg-emerald-500",
                        "bg-sky-500",
                        "bg-amber-500",
                        "bg-violet-500",
                        "bg-rose-500",
                        "bg-teal-500",
                      ];
                      const pct = Math.max(
                        4,
                        Math.round((l.lineCost / draftCalculation.foodCost) * 100)
                      );
                      return (
                        <div
                          key={`${l.ingredient_id}-${idx}`}
                          className={`${colors[idx % colors.length]} h-full`}
                          style={{ width: `${pct}%` }}
                          title={`${l.ingredient?.ingredient_name}: ${formatRp(l.lineCost)}`}
                        />
                      );
                    })}
                </div>
              </div>
            )}

            {/* Itemized Ingredient & Packaging Lines Editor */}
            <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
              {draftLines.length === 0 ? (
                <div className="p-5 rounded-xl surface-well text-center space-y-3">
                  <Layers className="w-5 h-5 mx-auto text-[var(--text-muted)]" />
                  <div className="text-xs text-[var(--text-secondary)]">
                    This recipe uses a summary BOM ({formatRp(selectedRecipe.raw_food_cost)}{" "}
                    food cost). Click below to generate itemized ingredient lines linked to the
                    Master Catalog.
                  </div>
                  <button
                    type="button"
                    onClick={onPopulateDefaultLines}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-[var(--accent-primary)] text-white cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Populate Itemized Ingredient Lines</span>
                  </button>
                </div>
              ) : (
                draftCalculation.evaluatedLines.map((ln, idx) => (
                  <div
                    key={`${ln.ingredient_id}-${idx}`}
                    className="p-3 rounded-xl bg-[var(--bg-surface-2)] border border-[var(--border-subtle)] space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <select
                        value={ln.ingredient_id}
                        onChange={(e) => {
                          const nextId = e.target.value;
                          onDraftLinesChange((prev) =>
                            prev.map((item, i) =>
                              i === idx ? { ...item, ingredient_id: nextId } : item
                            )
                          );
                        }}
                        className="flex-1 text-xs font-semibold bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg px-2.5 py-1.5 text-[var(--text-primary)]"
                      >
                        {data.ingredients.map((ing) => (
                          <option key={ing.ingredient_id} value={ing.ingredient_id}>
                            [{ing.category}] {ing.ingredient_name} ({formatRp(ing.effective_unit_cost)}/{ing.base_unit})
                          </option>
                        ))}
                      </select>

                      <button
                        type="button"
                        onClick={() => {
                          onDraftLinesChange((prev) => prev.filter((_, i) => i !== idx));
                        }}
                        className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-rose-500 hover:bg-rose-500/10 cursor-pointer"
                        title="Remove line"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="grid grid-cols-12 gap-2 items-center text-xs">
                      <div className="col-span-4">
                        <select
                          value={ln.component_role}
                          onChange={(e) => {
                            const nextRole = e.target.value as ComponentRole;
                            onDraftLinesChange((prev) =>
                              prev.map((item, i) =>
                                i === idx ? { ...item, component_role: nextRole } : item
                              )
                            );
                          }}
                          className="w-full text-[11px] font-mono bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg px-2 py-1 text-[var(--text-secondary)]"
                        >
                          <option value="food">Raw Food</option>
                          <option value="packaging_dine_in">Pkg Dine-In</option>
                          <option value="packaging_delivery">Pkg Delivery</option>
                        </select>
                      </div>

                      <div className="col-span-4 flex items-center gap-1">
                        <input
                          type="number"
                          step="0.5"
                          min="0"
                          value={ln.qty_per_serving}
                          onChange={(e) => {
                            const nextQty = Number(e.target.value);
                            onDraftLinesChange((prev) =>
                              prev.map((item, i) =>
                                i === idx ? { ...item, qty_per_serving: nextQty } : item
                              )
                            );
                          }}
                          className="w-full font-mono text-right bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg px-2 py-1 text-[var(--text-primary)]"
                        />
                        <span className="font-mono text-[11px] text-[var(--text-muted)] shrink-0">
                          {ln.ingredient?.base_unit || "g"}
                        </span>
                      </div>

                      <div className="col-span-4 text-right font-mono font-semibold text-[var(--text-primary)]">
                        {formatRp(ln.lineCost)}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Add Line & Save BOM Footer */}
            <div className="pt-3 border-t border-[var(--border-subtle)] space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => onAddDraftLine("food")}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold bg-[var(--bg-surface-2)] hover:bg-[var(--bg-surface-3)] text-[var(--text-primary)] border border-[var(--border-default)] cursor-pointer"
                >
                  <Plus className="w-3 h-3 text-emerald-500" />
                  <span>Add Food Ingredient</span>
                </button>
                <button
                  type="button"
                  onClick={() => onAddDraftLine("packaging_delivery")}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold bg-[var(--bg-surface-2)] hover:bg-[var(--bg-surface-3)] text-[var(--text-primary)] border border-[var(--border-default)] cursor-pointer"
                >
                  <Plus className="w-3 h-3 text-amber-500" />
                  <span>Add Packaging Line</span>
                </button>
              </div>

              <button
                type="button"
                disabled={actionBusy || draftLines.length === 0}
                onClick={onSaveBom}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-semibold bg-[var(--accent-primary)] text-white shadow-sm hover:opacity-95 transition-all cursor-pointer disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>
                  Save Recipe BOM & Cascade to P&L ({formatRp(draftCalculation.foodCost)} Food)
                </span>
              </button>
            </div>
          </>
        ) : (
          <div className="p-8 text-center text-xs text-[var(--text-muted)]">
            Select a recipe from the matrix on the left to inspect or edit its itemized BOM.
          </div>
        )}
      </div>
    </div>
  );
}
