'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Scale,
  ChefHat,
  Package,
  Plus,
  RefreshCw,
  Download,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  Sliders,
  X,
  Boxes,
  FileSpreadsheet,
} from 'lucide-react';
import { InventoryWorkbench } from '@/components/InventoryWorkbench';
import { RecipesCatalogTab } from '@/components/recipes/RecipesCatalogTab';
import {
  IngredientsCatalogTab,
  type EditingIngredientState,
} from '@/components/recipes/IngredientsCatalogTab';
import { CogsSimulatorTab } from '@/components/recipes/CogsSimulatorTab';
import { RecipeBulkSyncModal } from '@/components/recipes/RecipeBulkSyncModal';
import {
  BRAND_OPTIONS,
  formatCompactRp,
  type EditableBomLine,
} from '@/components/recipes/types';
import type {
  RecipesCogsDashboardData,
  RecipeCogsDetailRecord,
  MasterIngredientRecord,
  ComponentRole,
} from '@/lib/recipesCogs';

export default function RecipesCogsCommandPage() {
  const [brandFilter, setBrandFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'recipes' | 'ingredients' | 'simulator' | 'inventory'>('recipes');
  const [data, setData] = useState<RecipesCogsDashboardData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionBusy, setActionBusy] = useState<boolean>(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [bulkSyncOpen, setBulkSyncOpen] = useState<boolean>(false);

  // Tab 1: Recipe Analyzer & BOM Workbench state
  const [recipeSearch, setRecipeSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'healthy' | 'watch' | 'critical'>('all');
  const [selectedRecipeId, setSelectedRecipeId] = useState<string | null>(null);
  const [draftLines, setDraftLines] = useState<EditableBomLine[]>([]);
  const [draftTargetPct, setDraftTargetPct] = useState<number>(30);
  const [bomDirty, setBomDirty] = useState<boolean>(false);

  // Tab 2: Master Ingredient Catalog state
  const [ingSearch, setIngSearch] = useState<string>('');
  const [ingCategoryFilter, setIngCategoryFilter] = useState<string>('all');
  const [editingIngredient, setEditingIngredient] = useState<EditingIngredientState | null>(null);

  // Tab 3: Commodity Inflation Simulator state (% shocks by category group)
  const [shocks, setShocks] = useState<Record<string, number>>({
    'Coffee & Tea': 0,
    'Dairy & Plant Milk': 0,
    'Plant Proteins & Eggs': 0,
    'Grains, Bread & Pasta': 0,
    'Produce & Fungi': 0,
    'Sauces, Oils & Sweeteners': 0,
    Packaging: 0,
  });

  const showNotice = useCallback((type: 'success' | 'error', text: string) => {
    setToast({ type, text });
    setTimeout(() => {
      setToast((prev) => (prev?.text === text ? null : prev));
    }, 5000);
  }, []);

  const fetchDashboard = useCallback(
    async (keepSelection = true) => {
      setLoading(true);
      try {
        const qs = brandFilter !== 'all' ? `?brand=${encodeURIComponent(brandFilter)}` : '';
        const res = await fetch(`/api/recipes/cogs${qs}`, { cache: 'no-store' });
        const json = await res.json();
        if (!json.ok) throw new Error(json.error || 'Failed to load COGS telemetry');
        const nextData = json.data as RecipesCogsDashboardData;
        setData(nextData);

        if (nextData.recipes.length > 0) {
          const targetRec =
            keepSelection && selectedRecipeId
              ? nextData.recipes.find((r) => r.recipe_id === selectedRecipeId) || nextData.recipes[0]
              : nextData.recipes[0];
          setSelectedRecipeId(targetRec.recipe_id);
          setDraftLines(
            targetRec.lines.map((l) => ({
              ingredient_id: l.ingredient_id,
              component_role: l.component_role,
              qty_per_serving: l.qty_per_serving,
              prep_notes: l.prep_notes,
            }))
          );
          setDraftTargetPct(targetRec.target_food_cost_pct);
          setBomDirty(false);
        } else {
          setSelectedRecipeId(null);
          setDraftLines([]);
        }
      } catch (err) {
        showNotice('error', err instanceof Error ? err.message : 'Failed to load recipes');
      } finally {
        setLoading(false);
      }
    },
    [brandFilter, selectedRecipeId, showNotice]
  );

  useEffect(() => {
    fetchDashboard(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [brandFilter]);

  const ingredientMap = useMemo(() => {
    const map = new Map<string, MasterIngredientRecord>();
    if (!data) return map;
    for (const ing of data.ingredients) {
      map.set(ing.ingredient_id, ing);
    }
    return map;
  }, [data]);

  const selectedRecipe: RecipeCogsDetailRecord | null = useMemo(() => {
    if (!data || !selectedRecipeId) return null;
    return data.recipes.find((r) => r.recipe_id === selectedRecipeId) || null;
  }, [data, selectedRecipeId]);

  const handleSelectRecipe = (rec: RecipeCogsDetailRecord) => {
    setSelectedRecipeId(rec.recipe_id);
    setDraftLines(
      rec.lines.map((l) => ({
        ingredient_id: l.ingredient_id,
        component_role: l.component_role,
        qty_per_serving: l.qty_per_serving,
        prep_notes: l.prep_notes,
      }))
    );
    setDraftTargetPct(rec.target_food_cost_pct);
    setBomDirty(false);
  };

  const handleAddDraftLine = (role: ComponentRole) => {
    if (!data || data.ingredients.length === 0) return;
    const defaultIng =
      role === 'packaging_dine_in'
        ? data.ingredients.find((i) => i.category === 'Packaging (Dine-In)') || data.ingredients[0]
        : role === 'packaging_delivery'
        ? data.ingredients.find((i) => i.category === 'Packaging (Delivery)') || data.ingredients[0]
        : data.ingredients.find((i) => !i.category.startsWith('Packaging')) || data.ingredients[0];

    setDraftLines((prev) => [
      ...prev,
      {
        ingredient_id: defaultIng.ingredient_id,
        component_role: role,
        qty_per_serving: defaultIng.base_unit === 'pcs' ? 1 : 50,
        prep_notes: '',
      },
    ]);
    setBomDirty(true);
  };

  const handlePopulateDefaultLinesForRecipe = () => {
    if (!selectedRecipe || !data) return;
    const isBeverage =
      selectedRecipe.category.toLowerCase().includes('coffee') ||
      selectedRecipe.category.toLowerCase().includes('tea') ||
      selectedRecipe.category.toLowerCase().includes('matcha') ||
      selectedRecipe.category.toLowerCase().includes('beverage');

    if (isBeverage) {
      setDraftLines([
        {
          ingredient_id: 'ING-ESP-HOUSE',
          component_role: 'food',
          qty_per_serving: 18,
          prep_notes: 'Double shot extraction',
        },
        {
          ingredient_id: 'ING-MILK-FRESH',
          component_role: 'food',
          qty_per_serving: 140,
          prep_notes: 'Chilled/steamed barista milk',
        },
        {
          ingredient_id: 'ING-PKG-DI-CUP',
          component_role: 'packaging_dine_in',
          qty_per_serving: 1,
          prep_notes: 'Dine-in cup & straw set',
        },
        {
          ingredient_id: 'ING-PKG-DEL-CUP',
          component_role: 'packaging_delivery',
          qty_per_serving: 1,
          prep_notes: 'Delivery sealed cup + carrier',
        },
      ]);
    } else {
      setDraftLines([
        {
          ingredient_id: 'ING-PROT-CHICK-CUTLET',
          component_role: 'food',
          qty_per_serving: 90,
          prep_notes: 'Primary plant-based protein portion',
        },
        {
          ingredient_id: 'ING-EGG-OMEGA',
          component_role: 'food',
          qty_per_serving: 80,
          prep_notes: 'Cage-free egg component',
        },
        {
          ingredient_id: 'ING-SAUCE-AIOLI-SALSA',
          component_role: 'food',
          qty_per_serving: 35,
          prep_notes: 'House signature glaze/sauce',
        },
        {
          ingredient_id: 'ING-PKG-DI-WRAP',
          component_role: 'packaging_dine_in',
          qty_per_serving: 1,
          prep_notes: 'Dine-in liner & service',
        },
        {
          ingredient_id: 'ING-PKG-DEL-BOX',
          component_role: 'packaging_delivery',
          qty_per_serving: 1,
          prep_notes: 'Thermal kraft box + tamper seal',
        },
      ]);
    }
    setBomDirty(true);
  };

  const handleSaveRecipeBomLines = async () => {
    if (!selectedRecipe) return;
    setActionBusy(true);
    try {
      const res = await fetch('/api/recipes/cogs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'save_recipe_lines',
          recipe_id: selectedRecipe.recipe_id,
          target_food_cost_pct: draftTargetPct,
          lines: draftLines,
        }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error || 'Failed to save recipe lines');
      showNotice('success', json.message);
      await fetchDashboard(true);
    } catch (err) {
      showNotice('error', err instanceof Error ? err.message : 'Error saving recipe BOM');
    } finally {
      setActionBusy(false);
    }
  };

  const handleSaveIngredient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingIngredient) return;
    setActionBusy(true);
    try {
      const res = await fetch('/api/recipes/cogs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'upsert_ingredient',
          ingredient: editingIngredient,
        }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error || 'Failed to save ingredient');
      showNotice('success', json.message);
      setEditingIngredient(null);
      await fetchDashboard(true);
    } catch (err) {
      showNotice('error', err instanceof Error ? err.message : 'Failed to update ingredient');
    } finally {
      setActionBusy(false);
    }
  };

  const handleAutoMapUnmapped = async () => {
    setActionBusy(true);
    try {
      const res = await fetch('/api/recipes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'auto_map_unmapped',
          brand: brandFilter,
        }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error || 'Failed to auto-map SKUs');
      showNotice('success', json.message);
      await fetchDashboard(true);
    } catch (err) {
      showNotice('error', err instanceof Error ? err.message : 'Auto-map failed');
    } finally {
      setActionBusy(false);
    }
  };

  const handleSyncAllRecipes = async () => {
    setActionBusy(true);
    try {
      const res = await fetch('/api/recipes/cogs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'sync_all_recipes' }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error || 'Failed to sync recipes');
      showNotice('success', json.message);
      await fetchDashboard(true);
    } catch (err) {
      showNotice('error', err instanceof Error ? err.message : 'Sync failed');
    } finally {
      setActionBusy(false);
    }
  };

  const handleExportCsv = () => {
    if (!data) return;
    const headers = [
      'Recipe ID',
      'Brand',
      'Canonical Dish Name',
      'POS Item Name',
      'Category',
      'Units Sold',
      'Avg Selling Price (Rp)',
      'Raw Food Cost (Rp)',
      'Dine-In Packaging (Rp)',
      'Delivery Packaging (Rp)',
      'Blended COGS / Unit (Rp)',
      'Blended COGS %',
      'Target COGS %',
      'Margin / Unit (Rp)',
      'Total Theoretical COGS (Rp)',
      'Total Gross Profit (Rp)',
      'Status',
      'BOM Specification',
    ];
    const rows = data.recipes.map((r) => [
      r.recipe_id,
      `"${r.brand.replace(/"/g, '""')}"`,
      `"${r.canonical_name.replace(/"/g, '""')}"`,
      `"${r.item_name.replace(/"/g, '""')}"`,
      `"${r.category.replace(/"/g, '""')}"`,
      r.units_sold,
      r.avg_selling_price,
      r.raw_food_cost,
      r.packaging_dine_in,
      r.packaging_delivery,
      r.blended_cogs_per_unit,
      r.blended_cogs_pct,
      r.target_food_cost_pct,
      r.gross_margin_per_unit,
      r.total_theoretical_cogs,
      r.total_gross_profit,
      r.margin_status.toUpperCase(),
      `"${r.bom_summary.replace(/"/g, '""')}"`,
    ]);
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tyfel-recipes-cogs-${brandFilter === 'all' ? 'portfolio' : brandFilter.toLowerCase().replace(/\s+/g, '-')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Tab 3: Simulated Commodity Price-Shock Calculations
  const simulationResults = useMemo(() => {
    if (!data) return null;

    let simTotalFoodSpend = 0;
    let simTotalPkgSpend = 0;

    const simulatedRecipes = data.recipes.map((rec) => {
      let simFood = 0;
      let simPkgDi = 0;
      let simPkgDel = 0;

      if (rec.has_itemized_lines && rec.lines.length > 0) {
        for (const ln of rec.lines) {
          const shockKey = ln.category.startsWith('Packaging') ? 'Packaging' : ln.category;
          const shockPct = shocks[shockKey] || 0;
          const shockedLineCost = ln.line_cost * (1 + shockPct / 100);
          if (ln.component_role === 'food') simFood += shockedLineCost;
          else if (ln.component_role === 'packaging_dine_in') simPkgDi += shockedLineCost;
          else if (ln.component_role === 'packaging_delivery') simPkgDel += shockedLineCost;
        }
      } else {
        const avgFoodShock =
          (shocks['Coffee & Tea'] +
            shocks['Dairy & Plant Milk'] +
            shocks['Plant Proteins & Eggs'] +
            shocks['Grains, Bread & Pasta']) /
          4;
        const pkgShock = shocks['Packaging'] || 0;
        simFood = rec.raw_food_cost * (1 + avgFoodShock / 100);
        simPkgDi = rec.packaging_dine_in * (1 + pkgShock / 100);
        simPkgDel = rec.packaging_delivery * (1 + pkgShock / 100);
      }

      const simFoodRounded = Math.round(simFood);
      const simBlendedPkg = Math.round(simPkgDi * 0.38 + simPkgDel * 0.62);
      const simBlendedCogs = simFoodRounded + simBlendedPkg;
      const simCogsPct =
        rec.avg_selling_price > 0
          ? Number(((simBlendedCogs / rec.avg_selling_price) * 100).toFixed(1))
          : 0;
      const cogsDeltaPerUnit = simBlendedCogs - rec.blended_cogs_per_unit;
      const monthlyImpactRp = cogsDeltaPerUnit * rec.units_sold;

      const targetRatio = Math.max(0.15, rec.blended_cogs_pct / 100);
      const recommendedMenuPrice =
        rec.blended_cogs_pct > 0
          ? Math.ceil(simBlendedCogs / targetRatio / 500) * 500
          : rec.avg_selling_price;

      simTotalFoodSpend += simFoodRounded * rec.units_sold;
      simTotalPkgSpend += simBlendedPkg * rec.units_sold;

      return {
        ...rec,
        simFoodRounded,
        simBlendedPkg,
        simBlendedCogs,
        simCogsPct,
        cogsDeltaPerUnit,
        monthlyImpactRp,
        recommendedMenuPrice,
      };
    });

    const simTotalCogs = simTotalFoodSpend + simTotalPkgSpend;
    const totalRev = data.summary.totalRevenueMapped;
    const simWeightedCogsPct =
      totalRev > 0 ? Number(((simTotalCogs / totalRev) * 100).toFixed(1)) : 0;
    const totalMonthlyDeltaRp = simTotalCogs - data.summary.totalTheoreticalCogs;

    return {
      simulatedRecipes,
      simTotalFoodSpend,
      simTotalPkgSpend,
      simTotalCogs,
      simWeightedCogsPct,
      totalMonthlyDeltaRp,
    };
  }, [data, shocks]);

  return (
    <main className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto space-y-6">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-xl border shadow-lg text-xs font-semibold transition-all ${
            toast.type === 'success'
              ? 'bg-[var(--bg-surface)] border-emerald-500/40 text-emerald-600 dark:text-emerald-400'
              : 'bg-[var(--bg-surface)] border-rose-500/40 text-rose-600 dark:text-rose-400'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 shrink-0" />
          )}
          <span>{toast.text}</span>
          <button
            type="button"
            onClick={() => setToast(null)}
            className="p-1 hover:opacity-75 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Hero Header & Concept Filter Bar */}
      <section className="cockpit-panel rounded-2xl p-5 sm:p-6 space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-[var(--accent-primary)] font-semibold">
              <Scale className="w-4 h-4" />
              <span>Culinary Cost Accounting & Master BOM Engine</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight font-display text-[var(--text-primary)]">
              Recipes, Ingredients & Theoretical COGS Command
            </h1>
            <p className="text-xs sm:text-sm text-[var(--text-secondary)] max-w-3xl">
              Manage master ingredient & packaging costs (`g`, `ml`, `pcs`) with yield/waste factors,
              build line-by-line dish BOMs, and automatically cascade supplier price updates across all
              5 culinary concepts.
            </p>
          </div>

          {/* Global Action Toolbar */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => setBulkSyncOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-all cursor-pointer"
              title="Sinkronisasi massal / Import-Export Excel & CSV data resep & bahan baku"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Bulk Sync (Excel/CSV)</span>
            </button>

            <button
              type="button"
              disabled={actionBusy}
              onClick={handleAutoMapUnmapped}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-[var(--bg-surface-2)] hover:bg-[var(--bg-surface-3)] text-[var(--text-primary)] border border-[var(--border-default)] transition-all cursor-pointer disabled:opacity-50"
              title="Automatically generate recipe BOM mappings for any unmapped POS items"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>1-Click Auto-Map SKUs</span>
            </button>

            <button
              type="button"
              disabled={actionBusy}
              onClick={handleSyncAllRecipes}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-[var(--bg-surface-2)] hover:bg-[var(--bg-surface-3)] text-[var(--text-primary)] border border-[var(--border-default)] transition-all cursor-pointer disabled:opacity-50"
              title="Recalculate all recipe BOM costs from current Master Ingredient prices"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${actionBusy ? 'animate-spin' : ''}`} />
              <span>Sync All BOM Costs</span>
            </button>

            <button
              type="button"
              onClick={handleExportCsv}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-[var(--accent-primary)] text-white shadow-xs hover:opacity-95 transition-all cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export COGS CSV</span>
            </button>
          </div>
        </div>

        {/* Concept Filter Pills & Main Workspace Tabs */}
        <div className="pt-3 border-t border-[var(--border-subtle)] flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          {/* Brand Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            {BRAND_OPTIONS.map((opt) => {
              const active = brandFilter === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setBrandFilter(opt.value)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    active
                      ? 'bg-[var(--accent-primary)] text-white shadow-2xs'
                      : 'bg-[var(--bg-surface-2)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-3)] border border-[var(--border-subtle)]'
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>

          {/* Segmented Mode Tabs */}
          <div className="inline-flex p-1 rounded-xl bg-[var(--bg-surface-2)] border border-[var(--border-default)] self-start xl:self-auto">
            <button
              type="button"
              onClick={() => setActiveTab('recipes')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'recipes'
                  ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-xs border border-[var(--border-default)]'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              <ChefHat className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
              <span>1. Recipe Analyzer & BOM Workbench</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('ingredients')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'ingredients'
                  ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-xs border border-[var(--border-default)]'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              <Package className="w-3.5 h-3.5 text-emerald-500" />
              <span>2. Master Ingredients ({data?.summary.totalMasterIngredients ?? 30})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('simulator')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'simulator'
                  ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-xs border border-[var(--border-default)]'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              <Sliders className="w-3.5 h-3.5 text-amber-500" />
              <span>3. Price-Shock Simulator</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('inventory')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'inventory'
                  ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-xs border border-[var(--border-default)]'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              <Boxes className="w-3.5 h-3.5 text-purple-500" />
              <span>4. Stock & Depletion Alerts</span>
            </button>
          </div>
        </div>
      </section>

      {/* Executive COGS Telemetry KPI Cards */}
      {data && (
        <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {/* Card 1: Weighted Theoretical COGS % */}
          <div className="cockpit-panel rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono uppercase tracking-wider text-[var(--text-muted)] font-semibold">
                Weighted Theoretical COGS
              </span>
              <span
                className={`text-[11px] font-mono px-2 py-0.5 rounded-full font-semibold ${
                  data.summary.weightedTotalCogsPct <= 35
                    ? 'badge-emerald'
                    : data.summary.weightedTotalCogsPct <= 40
                    ? 'badge-amber'
                    : 'badge-rose'
                }`}
              >
                {data.summary.weightedTotalCogsPct <= 35 ? 'On Target' : 'Watch Margin'}
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold font-mono text-[var(--text-primary)]">
                {data.summary.weightedTotalCogsPct.toFixed(1)}%
              </span>
              <span className="text-xs font-mono text-[var(--text-muted)]">
                of {formatCompactRp(data.summary.totalRevenueMapped)} POS Rev
              </span>
            </div>
            <div className="space-y-1.5">
              <div className="h-2 rounded-full bg-[var(--bg-surface-3)] overflow-hidden flex">
                <div
                  className="bg-emerald-500 h-full"
                  style={{ width: `${Math.min(100, data.summary.weightedFoodCostPct * 2)}%` }}
                  title={`Raw Food: ${data.summary.weightedFoodCostPct}%`}
                />
                <div
                  className="bg-amber-500 h-full"
                  style={{ width: `${Math.min(100, data.summary.weightedPackagingCostPct * 2)}%` }}
                  title={`Packaging: ${data.summary.weightedPackagingCostPct}%`}
                />
              </div>
              <div className="flex items-center justify-between text-[11px] font-mono text-[var(--text-secondary)]">
                <span>Food: {data.summary.weightedFoodCostPct.toFixed(1)}%</span>
                <span>Packaging: {data.summary.weightedPackagingCostPct.toFixed(1)}%</span>
              </div>
            </div>
          </div>

          {/* Card 2: Total Theoretical Food & Packaging Spend */}
          <div className="cockpit-panel rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono uppercase tracking-wider text-[var(--text-muted)] font-semibold">
                Theoretical COGS Spend
              </span>
              <span className="text-[11px] font-mono text-[var(--text-muted)]">
                {data.summary.totalUnitsSoldMapped.toLocaleString()} Dish Units
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-bold font-mono text-[var(--text-primary)]">
              {formatCompactRp(data.summary.totalTheoreticalCogs)}
            </div>
            <div className="grid grid-cols-2 gap-2 pt-1 text-[11px] font-mono">
              <div className="p-2 rounded-xl surface-well">
                <div className="text-[var(--text-muted)]">Raw Ingredients</div>
                <div className="font-semibold text-[var(--text-primary)]">
                  {formatCompactRp(data.summary.totalTheoreticalFoodSpend)}
                </div>
              </div>
              <div className="p-2 rounded-xl surface-well">
                <div className="text-[var(--text-muted)]">Cup / Box Pkg</div>
                <div className="font-semibold text-[var(--text-primary)]">
                  {formatCompactRp(data.summary.totalTheoreticalPackagingSpend)}
                </div>
              </div>
            </div>
          </div>

          {/* Card 3: Recipe & BOM Matrix Coverage */}
          <div className="cockpit-panel rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono uppercase tracking-wider text-[var(--text-muted)] font-semibold">
                Recipe Margin Guardrails
              </span>
              <span className="text-[11px] font-mono badge-sky px-2 py-0.5 rounded-full">
                {data.summary.itemizedRecipesCount}/{data.summary.totalActiveRecipes} Itemized
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold font-mono text-[var(--text-primary)]">
                {data.summary.totalActiveRecipes}
              </span>
              <span className="text-xs text-[var(--text-secondary)]">Active Menu BOMs</span>
            </div>
            <div className="grid grid-cols-3 gap-1.5 pt-1 text-[11px] font-mono text-center">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('recipes');
                  setStatusFilter(statusFilter === 'healthy' ? 'all' : 'healthy');
                }}
                className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/25 text-emerald-600 dark:text-emerald-400 cursor-pointer"
              >
                <div className="font-bold">{data.summary.healthyRecipesCount}</div>
                <div className="text-[10px]">Healthy</div>
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('recipes');
                  setStatusFilter(statusFilter === 'watch' ? 'all' : 'watch');
                }}
                className="p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/25 text-amber-600 dark:text-amber-400 cursor-pointer"
              >
                <div className="font-bold">{data.summary.watchlistRecipesCount}</div>
                <div className="text-[10px]">Watch</div>
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('recipes');
                  setStatusFilter(statusFilter === 'critical' ? 'all' : 'critical');
                }}
                className="p-1.5 rounded-lg bg-rose-500/10 border border-rose-500/25 text-rose-600 dark:text-rose-400 cursor-pointer"
              >
                <div className="font-bold">{data.summary.criticalRecipesCount}</div>
                <div className="text-[10px]">Critical</div>
              </button>
            </div>
          </div>

          {/* Card 4: Master Ingredient & Supplier Spend Driver */}
          <div className="cockpit-panel rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono uppercase tracking-wider text-[var(--text-muted)] font-semibold">
                Master Ingredient Catalog
              </span>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('ingredients');
                  setEditingIngredient({
                    ingredient_id: null,
                    ingredient_name: '',
                    category: 'Produce & Fungi',
                    supplier_name: '',
                    purchase_unit_label: '1 kg Pack',
                    purchase_qty: 1000,
                    base_unit: 'g',
                    purchase_price: 50000,
                    yield_pct: 95,
                  });
                }}
                className="text-[11px] font-mono text-[var(--accent-primary)] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3 h-3" /> Add SKU
              </button>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold font-mono text-[var(--text-primary)]">
                {data.summary.totalMasterIngredients}
              </span>
              <span className="text-xs text-[var(--text-secondary)]">
                Raw & Packaging SKUs
              </span>
            </div>
            <div className="p-2 rounded-xl surface-well text-[11px] font-mono flex items-center justify-between">
              <span className="text-[var(--text-muted)] truncate">Top Cost Category:</span>
              <span className="font-semibold text-[var(--text-primary)] truncate ml-2">
                {data.categorySpendBreakdown[0]?.category || 'Plant Proteins'} (
                {data.categorySpendBreakdown[0]?.shareOfSpendPct ?? 0}%)
              </span>
            </div>
          </div>
        </section>
      )}

      {/* Loading State */}
      {loading && !data && (
        <div className="cockpit-panel rounded-2xl p-12 text-center space-y-3">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[var(--accent-primary)]" />
          <div className="text-sm font-semibold text-[var(--text-primary)]">
            Loading Master Ingredient Catalog & Recipe BOM Telemetry...
          </div>
        </div>
      )}

      {/* TAB 1: Recipes Catalog & BOM */}
      {data && activeTab === 'recipes' && (
        <RecipesCatalogTab
          data={data}
          ingredientMap={ingredientMap}
          selectedRecipeId={selectedRecipeId}
          selectedRecipe={selectedRecipe}
          recipeSearch={recipeSearch}
          onRecipeSearchChange={setRecipeSearch}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          onSelectRecipe={handleSelectRecipe}
          draftLines={draftLines}
          onDraftLinesChange={setDraftLines}
          draftTargetPct={draftTargetPct}
          onDraftTargetPctChange={setDraftTargetPct}
          bomDirty={bomDirty}
          actionBusy={actionBusy}
          onSaveBom={handleSaveRecipeBomLines}
          onPopulateDefaultLines={handlePopulateDefaultLinesForRecipe}
          onAddDraftLine={handleAddDraftLine}
          onOpenBulkSync={() => setBulkSyncOpen(true)}
        />
      )}

      {/* TAB 2: Ingredients Catalog */}
      {data && activeTab === 'ingredients' && (
        <IngredientsCatalogTab
          data={data}
          ingCategoryFilter={ingCategoryFilter}
          onIngCategoryFilterChange={setIngCategoryFilter}
          ingSearch={ingSearch}
          onIngSearchChange={setIngSearch}
          editingIngredient={editingIngredient}
          onEditIngredient={setEditingIngredient}
          onSaveIngredient={handleSaveIngredient}
          actionBusy={actionBusy}
          onOpenBulkSync={() => setBulkSyncOpen(true)}
        />
      )}

      {/* TAB 3: Commodity Inflation & Menu Engineering Simulator */}
      {data && activeTab === 'simulator' && simulationResults && (
        <CogsSimulatorTab
          data={data}
          shocks={shocks}
          onShocksChange={setShocks}
          simulationResults={simulationResults}
        />
      )}

      {/* TAB 4: Automated Inventory & Stock Depletion Tracking */}
      {activeTab === 'inventory' && <InventoryWorkbench />}

      {/* Bulk Sync Modal */}
      {bulkSyncOpen && (
        <RecipeBulkSyncModal
          isOpen={bulkSyncOpen}
          onClose={() => setBulkSyncOpen(false)}
          onSuccess={() => fetchDashboard(true)}
          currentIngredients={data?.ingredients || []}
          currentRecipes={data?.recipes || []}
          showNotice={showNotice}
        />
      )}
    </main>
  );
}
