'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import {
  Scale,
  ChefHat,
  Package,
  Search,
  Plus,
  Trash2,
  Save,
  RefreshCw,
  Download,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  Layers,
  Sliders,
  ArrowUpRight,
  RotateCcw,
  Edit3,
  Check,
  X,
  TrendingUp,
  Boxes,
} from 'lucide-react';
import { InventoryWorkbench } from '@/components/InventoryWorkbench';
import type {
  RecipesCogsDashboardData,
  RecipeCogsDetailRecord,
  MasterIngredientRecord,
  IngredientCategory,
  BaseUnit,
  ComponentRole,
} from '@/lib/recipesCogs';

const BRAND_OPTIONS = [
  { label: 'All 5 Concepts', value: 'all' },
  { label: 'American Breakfast Club', value: 'American Breakfast Club' },
  { label: 'Tyfel Coffee', value: 'Tyfel Coffee' },
  { label: 'People Pasta', value: 'People Pasta' },
  { label: 'Herbox', value: 'Herbox' },
  { label: 'LA Breakfast Club', value: 'LA Breakfast Club' },
];

const INGREDIENT_CATEGORIES: IngredientCategory[] = [
  'Coffee & Tea',
  'Dairy & Plant Milk',
  'Plant Proteins & Eggs',
  'Grains, Bread & Pasta',
  'Produce & Fungi',
  'Sauces, Oils & Sweeteners',
  'Packaging (Dine-In)',
  'Packaging (Delivery)',
];

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

function formatQtyWithUnit(qty: number, unit: BaseUnit): string {
  if (unit === 'g' && qty >= 1000) {
    return `${(qty / 1000).toFixed(2)} kg`;
  }
  if (unit === 'ml' && qty >= 1000) {
    return `${(qty / 1000).toFixed(2)} L`;
  }
  return `${qty.toLocaleString('id-ID', { maximumFractionDigits: 1 })} ${unit}`;
}

interface EditableBomLine {
  ingredient_id: string;
  component_role: ComponentRole;
  qty_per_serving: number;
  prep_notes: string;
}

export default function RecipesCogsCommandPage() {
  const [brandFilter, setBrandFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'recipes' | 'ingredients' | 'simulator' | 'inventory'>('recipes');
  const [data, setData] = useState<RecipesCogsDashboardData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionBusy, setActionBusy] = useState<boolean>(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

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
  const [editingIngredient, setEditingIngredient] = useState<{
    ingredient_id: string | null;
    ingredient_name: string;
    category: IngredientCategory;
    supplier_name: string;
    purchase_unit_label: string;
    purchase_qty: number;
    base_unit: BaseUnit;
    purchase_price: number;
    yield_pct: number;
  } | null>(null);

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

  // Filtered recipes for Tab 1
  const filteredRecipes = useMemo(() => {
    if (!data) return [];
    const q = recipeSearch.trim().toLowerCase();
    return data.recipes.filter((r) => {
      if (statusFilter !== 'all' && r.margin_status !== statusFilter) return false;
      if (!q) return true;
      return (
        r.canonical_name.toLowerCase().includes(q) ||
        r.item_name.toLowerCase().includes(q) ||
        r.brand.toLowerCase().includes(q) ||
        r.category.toLowerCase().includes(q) ||
        r.bom_summary.toLowerCase().includes(q) ||
        (r.kitchen_recipe_card || '').toLowerCase().includes(q) ||
        (r.audit_note || '').toLowerCase().includes(q)
      );
    });
  }, [data, recipeSearch, statusFilter]);

  // Live calculation for the Draft BOM in the right-hand workbench
  const draftCalculation = useMemo(() => {
    let foodCost = 0;
    let pkgDineIn = 0;
    let pkgDelivery = 0;

    const evaluatedLines = draftLines.map((ln) => {
      const ing = ingredientMap.get(ln.ingredient_id);
      const unitCost = ing ? ing.effective_unit_cost : 0;
      const lineCost = Math.round((Number(ln.qty_per_serving) || 0) * unitCost);

      if (ln.component_role === 'food') foodCost += lineCost;
      else if (ln.component_role === 'packaging_dine_in') pkgDineIn += lineCost;
      else if (ln.component_role === 'packaging_delivery') pkgDelivery += lineCost;

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

  // Filtered Master Ingredients for Tab 2
  const filteredIngredients = useMemo(() => {
    if (!data) return [];
    const q = ingSearch.trim().toLowerCase();
    return data.ingredients.filter((ing) => {
      if (ingCategoryFilter !== 'all' && ing.category !== ingCategoryFilter) return false;
      if (!q) return true;
      return (
        ing.ingredient_name.toLowerCase().includes(q) ||
        ing.ingredient_id.toLowerCase().includes(q) ||
        ing.supplier_name.toLowerCase().includes(q) ||
        ing.category.toLowerCase().includes(q)
      );
    });
  }, [data, ingSearch, ingCategoryFilter]);

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
        // Fallback average food shock for non-itemized recipes
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

      // Recommended price to maintain baseline COGS %
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

      {/* =====================================================================
          TAB 1: RECIPE COGS ANALYZER & LINE-BY-LINE BOM WORKBENCH
         ===================================================================== */}
      {data && activeTab === 'recipes' && (
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
                    onChange={(e) => setRecipeSearch(e.target.value)}
                    placeholder="Search dish, SKU, ingredient..."
                    className="w-full pl-8 pr-3 py-1.5 rounded-xl text-xs bg-[var(--bg-surface-2)] border border-[var(--border-default)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
                  />
                </div>
              </div>

              {/* Status Filter Pills */}
              <div className="flex flex-wrap items-center gap-1.5 text-xs">
                {(['all', 'healthy', 'watch', 'critical'] as const).map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setStatusFilter(st)}
                    className={`px-2.5 py-1 rounded-lg font-mono text-[11px] capitalize cursor-pointer transition-all ${
                      statusFilter === st
                        ? 'bg-[var(--text-primary)] text-[var(--bg-surface)] font-semibold'
                        : 'bg-[var(--bg-surface-2)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    {st === 'all' ? 'All Statuses' : st}
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
                        onClick={() => handleSelectRecipe(rec)}
                        className={`cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-[var(--accent-primary)]/10 font-medium'
                            : 'hover:bg-[var(--bg-surface-2)]'
                        }`}
                      >
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <span
                              className={`w-2 h-2 rounded-full shrink-0 ${
                                rec.margin_status === 'healthy'
                                  ? 'bg-emerald-500'
                                  : rec.margin_status === 'watch'
                                  ? 'bg-amber-500'
                                  : 'bg-rose-500'
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
                                      rec.audit_status === 'verified_sheet'
                                        ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                                        : rec.audit_status === 'flagged_fixed'
                                        ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                                        : 'bg-sky-500/15 text-sky-600 dark:text-sky-400'
                                    }`}
                                  >
                                    {rec.audit_status === 'verified_sheet'
                                      ? 'Sheet 1:1'
                                      : rec.audit_status === 'flagged_fixed'
                                      ? 'Fixed Sheet'
                                      : 'Shared Card'}
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
                              rec.margin_status === 'healthy'
                                ? 'badge-emerald'
                                : rec.margin_status === 'watch'
                                ? 'badge-amber'
                                : 'badge-rose'
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
                            selectedRecipe.audit_status === 'verified_sheet'
                              ? 'badge-emerald'
                              : selectedRecipe.audit_status === 'flagged_fixed'
                              ? 'badge-amber'
                              : 'badge-sky'
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
                      POS SKU: <span className="font-mono">{selectedRecipe.item_name}</span> · Avg
                      Realized Price:{' '}
                      <span className="font-mono font-semibold text-[var(--text-primary)]">
                        {formatRp(selectedRecipe.avg_selling_price)}
                      </span>
                    </p>
                    {selectedRecipe.audit_note && (
                      <div className="text-[11px] font-mono text-[var(--text-muted)] bg-[var(--bg-surface-2)] px-2.5 py-1.5 rounded-lg border border-[var(--border-subtle)]">
                        <span className="font-semibold text-[var(--text-secondary)]">
                          Sheet Mapping:{' '}
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
                        : '0.0'}
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
                      Pkg: {formatRp(draftCalculation.pkgDineIn)} /{' '}
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
                        Target Guardrail:{' '}
                        <input
                          type="number"
                          min={10}
                          max={75}
                          value={draftTargetPct}
                          onChange={(e) => {
                            setDraftTargetPct(Number(e.target.value) || 30);
                            setBomDirty(true);
                          }}
                          className="w-12 px-1.5 py-0.5 text-right rounded bg-[var(--bg-surface-2)] border border-[var(--border-default)] text-[var(--text-primary)]"
                        />
                        %
                      </span>
                    </div>
                    <div className="h-2.5 rounded-full bg-[var(--bg-surface-3)] overflow-hidden flex gap-0.5">
                      {draftCalculation.evaluatedLines
                        .filter((l) => l.component_role === 'food' && l.lineCost > 0)
                        .map((l, idx) => {
                          const colors = [
                            'bg-emerald-500',
                            'bg-sky-500',
                            'bg-amber-500',
                            'bg-violet-500',
                            'bg-rose-500',
                            'bg-teal-500',
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
                        This recipe uses a summary BOM ({formatRp(selectedRecipe.raw_food_cost)}{' '}
                        food cost). Click below to generate itemized ingredient lines linked to the
                        Master Catalog.
                      </div>
                      <button
                        type="button"
                        onClick={handlePopulateDefaultLinesForRecipe}
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
                              setDraftLines((prev) =>
                                prev.map((item, i) =>
                                  i === idx ? { ...item, ingredient_id: nextId } : item
                                )
                              );
                              setBomDirty(true);
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
                              setDraftLines((prev) => prev.filter((_, i) => i !== idx));
                              setBomDirty(true);
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
                                setDraftLines((prev) =>
                                  prev.map((item, i) =>
                                    i === idx ? { ...item, component_role: nextRole } : item
                                  )
                                );
                                setBomDirty(true);
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
                                setDraftLines((prev) =>
                                  prev.map((item, i) =>
                                    i === idx ? { ...item, qty_per_serving: nextQty } : item
                                  )
                                );
                                setBomDirty(true);
                              }}
                              className="w-full font-mono text-right bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg px-2 py-1 text-[var(--text-primary)]"
                            />
                            <span className="font-mono text-[11px] text-[var(--text-muted)] shrink-0">
                              {ln.ingredient?.base_unit || 'g'}
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
                      onClick={() => handleAddDraftLine('food')}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold bg-[var(--bg-surface-2)] hover:bg-[var(--bg-surface-3)] text-[var(--text-primary)] border border-[var(--border-default)] cursor-pointer"
                    >
                      <Plus className="w-3 h-3 text-emerald-500" />
                      <span>Add Food Ingredient</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddDraftLine('packaging_delivery')}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold bg-[var(--bg-surface-2)] hover:bg-[var(--bg-surface-3)] text-[var(--text-primary)] border border-[var(--border-default)] cursor-pointer"
                    >
                      <Plus className="w-3 h-3 text-amber-500" />
                      <span>Add Packaging Line</span>
                    </button>
                  </div>

                  <button
                    type="button"
                    disabled={actionBusy || draftLines.length === 0}
                    onClick={handleSaveRecipeBomLines}
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
      )}

      {/* =====================================================================
          TAB 2: MASTER INGREDIENT & PACKAGING CATALOG (AUTO-CASCADE PRICING)
         ===================================================================== */}
      {data && activeTab === 'ingredients' && (
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
                    setIngCategoryFilter(active ? 'all' : cat.category)
                  }
                  className={`p-3 rounded-xl text-left border transition-all cursor-pointer ${
                    active
                      ? 'bg-[var(--accent-primary)]/10 border-[var(--accent-primary)]'
                      : 'cockpit-panel hover:bg-[var(--bg-surface-2)]'
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

          {/* Ingredient Editor Drawer / Modal when editing or adding an ingredient */}
          {editingIngredient && (
            <form
              onSubmit={handleSaveIngredient}
              className="cockpit-panel rounded-2xl p-5 border-2 border-[var(--accent-primary)] space-y-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Edit3 className="w-4 h-4 text-[var(--accent-primary)]" />
                  <h3 className="text-sm font-bold font-display text-[var(--text-primary)]">
                    {editingIngredient.ingredient_id
                      ? `Edit Master Ingredient (${editingIngredient.ingredient_id}) — Auto-Cascades to Linked Recipes`
                      : 'Register New Master Ingredient / Packaging SKU'}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingIngredient(null)}
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
                      setEditingIngredient({
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
                      setEditingIngredient({
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
                      setEditingIngredient({
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
                      setEditingIngredient({
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
                      setEditingIngredient({
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
                      setEditingIngredient({
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
                      setEditingIngredient({
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
                      setEditingIngredient({
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
                  Effective Unit Cost after {editingIngredient.yield_pct}% yield:{' '}
                  <span className="font-bold text-[var(--text-primary)]">
                    {formatRp(
                      editingIngredient.purchase_price /
                        (Math.max(1, editingIngredient.purchase_qty) *
                          (Math.max(10, editingIngredient.yield_pct) / 100))
                    )}{' '}
                    / {editingIngredient.base_unit}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingIngredient(null)}
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
                    <span>Save & Auto-Cascade to Recipes</span>
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
                  Master Ingredient & Packaging Catalog ({filteredIngredients.length})
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
                    onChange={(e) => setIngSearch(e.target.value)}
                    placeholder="Search ingredient or supplier..."
                    className="w-full pl-8 pr-3 py-1.5 rounded-xl text-xs bg-[var(--bg-surface-2)] border border-[var(--border-default)] text-[var(--text-primary)]"
                  />
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setEditingIngredient({
                      ingredient_id: null,
                      ingredient_name: '',
                      category: 'Produce & Fungi',
                      supplier_name: 'Preferred Supplier',
                      purchase_unit_label: '1 kg Pack',
                      purchase_qty: 1000,
                      base_unit: 'g',
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
                      <td className="py-3 px-3 text-right font-mono font-semibold text-[var(--text-primary)]">
                        {formatRp(ing.purchase_price)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-[var(--text-secondary)]">
                        {ing.yield_pct}%
                      </td>
                      <td className="py-3 px-3 text-right font-mono">
                        <div className="font-semibold text-emerald-600 dark:text-emerald-400">
                          {formatRp(ing.effective_unit_cost)} / {ing.base_unit}
                        </div>
                        {ing.base_unit !== 'pcs' && (
                          <div className="text-[10px] text-[var(--text-muted)]">
                            {formatRp(ing.cost_per_100_units)} / 100{ing.base_unit}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-3 text-center font-mono">
                        <span
                          className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] badge-sky"
                          title={ing.recipe_names.join(', ')}
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
                            setEditingIngredient({
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
      )}

      {/* =====================================================================
          TAB 3: COMMODITY INFLATION & MENU ENGINEERING SIMULATOR
         ===================================================================== */}
      {data && activeTab === 'simulator' && simulationResults && (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
          {/* Left 4 Columns: Commodity Price-Shock Sliders */}
          <div className="xl:col-span-4 cockpit-panel rounded-2xl p-5 space-y-5">
            <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
              <div>
                <h2 className="text-base font-bold font-display text-[var(--text-primary)]">
                  Supplier Price-Shock Sliders
                </h2>
                <p className="text-xs text-[var(--text-secondary)]">
                  Simulate commodity inflation or supplier bulk discounts across categories.
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  setShocks({
                    'Coffee & Tea': 0,
                    'Dairy & Plant Milk': 0,
                    'Plant Proteins & Eggs': 0,
                    'Grains, Bread & Pasta': 0,
                    'Produce & Fungi': 0,
                    'Sauces, Oils & Sweeteners': 0,
                    Packaging: 0,
                  })
                }
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-mono bg-[var(--bg-surface-2)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" /> Reset
              </button>
            </div>

            <div className="space-y-4">
              {Object.entries(shocks).map(([catKey, pctVal]) => (
                <div key={catKey} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-[var(--text-primary)]">{catKey}</span>
                    <span
                      className={`font-mono font-bold ${
                        pctVal > 0
                          ? 'text-rose-500'
                          : pctVal < 0
                          ? 'text-emerald-500'
                          : 'text-[var(--text-muted)]'
                      }`}
                    >
                      {pctVal > 0 ? `+${pctVal}%` : `${pctVal}%`}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={-25}
                    max={40}
                    step={1}
                    value={pctVal}
                    onChange={(e) =>
                      setShocks((prev) => ({
                        ...prev,
                        [catKey]: Number(e.target.value),
                      }))
                    }
                    className="w-full accent-[var(--accent-primary)] cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] font-mono text-[var(--text-muted)]">
                    <span>-25% Bulk Rebate</span>
                    <span>Baseline</span>
                    <span>+40% Inflation</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right 8 Columns: Simulated Portfolio & Recipe Impact */}
          <div className="xl:col-span-8 space-y-5">
            {/* Simulated Summary Banner */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="cockpit-panel rounded-2xl p-4 space-y-1">
                <div className="text-[10px] font-mono uppercase text-[var(--text-muted)]">
                  Simulated Weighted COGS %
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold font-mono text-[var(--text-primary)]">
                    {simulationResults.simWeightedCogsPct.toFixed(1)}%
                  </span>
                  <span className="text-xs font-mono text-[var(--text-muted)]">
                    vs {data.summary.weightedTotalCogsPct.toFixed(1)}% base
                  </span>
                </div>
              </div>

              <div className="cockpit-panel rounded-2xl p-4 space-y-1">
                <div className="text-[10px] font-mono uppercase text-[var(--text-muted)]">
                  Simulated Total COGS Spend
                </div>
                <div className="text-2xl font-bold font-mono text-[var(--text-primary)]">
                  {formatCompactRp(simulationResults.simTotalCogs)}
                </div>
              </div>

              <div className="cockpit-panel rounded-2xl p-4 space-y-1">
                <div className="text-[10px] font-mono uppercase text-[var(--text-muted)]">
                  Monthly P&L Profit Impact
                </div>
                <div
                  className={`text-2xl font-bold font-mono ${
                    simulationResults.totalMonthlyDeltaRp > 0
                      ? 'text-rose-500'
                      : simulationResults.totalMonthlyDeltaRp < 0
                      ? 'text-emerald-500'
                      : 'text-[var(--text-primary)]'
                  }`}
                >
                  {simulationResults.totalMonthlyDeltaRp > 0
                    ? `-${formatCompactRp(simulationResults.totalMonthlyDeltaRp)} Margin`
                    : simulationResults.totalMonthlyDeltaRp < 0
                    ? `+${formatCompactRp(Math.abs(simulationResults.totalMonthlyDeltaRp))} Saved`
                    : 'Rp 0 Delta'}
                </div>
              </div>
            </div>

            {/* Simulated Recipe Margin Defense Table */}
            <div className="cockpit-panel rounded-2xl overflow-hidden">
              <div className="p-4 border-b border-[var(--border-subtle)] flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold font-display text-[var(--text-primary)]">
                    Dish-by-Dish Margin Sensitivity & Recommended Menu Price Defense
                  </h3>
                  <p className="text-xs text-[var(--text-secondary)]">
                    Shows how commodity shocks alter each dish’s unit cost and the menu price needed
                    to preserve baseline margin %.
                  </p>
                </div>
                <TrendingUp className="w-4 h-4 text-[var(--accent-primary)]" />
              </div>

              <div className="overflow-x-auto max-h-[520px] overflow-y-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="sticky top-0 bg-[var(--bg-surface-2)] border-b border-[var(--border-default)] text-[10px] font-mono uppercase text-[var(--text-muted)]">
                    <tr>
                      <th className="py-3 px-4">Dish / Concept</th>
                      <th className="py-3 px-3 text-right">Base COGS</th>
                      <th className="py-3 px-3 text-right">Simulated COGS</th>
                      <th className="py-3 px-3 text-right">Unit Delta</th>
                      <th className="py-3 px-3 text-right">Sim COGS %</th>
                      <th className="py-3 px-4 text-right">Recommended Price Defense</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border-subtle)] text-xs">
                    {simulationResults.simulatedRecipes.map((r) => (
                      <tr key={r.recipe_id} className="hover:bg-[var(--bg-surface-2)]">
                        <td className="py-2.5 px-4">
                          <div className="font-semibold text-[var(--text-primary)]">
                            {r.canonical_name}
                          </div>
                          <div className="text-[10px] font-mono text-[var(--text-muted)]">
                            {r.brand} · Current Price {formatRp(r.avg_selling_price)}
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-[var(--text-secondary)]">
                          {formatRp(r.blended_cogs_per_unit)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-semibold text-[var(--text-primary)]">
                          {formatRp(r.simBlendedCogs)}
                        </td>
                        <td
                          className={`py-2.5 px-3 text-right font-mono font-semibold ${
                            r.cogsDeltaPerUnit > 0
                              ? 'text-rose-500'
                              : r.cogsDeltaPerUnit < 0
                              ? 'text-emerald-500'
                              : 'text-[var(--text-muted)]'
                          }`}
                        >
                          {r.cogsDeltaPerUnit > 0
                            ? `+${formatRp(r.cogsDeltaPerUnit)}`
                            : r.cogsDeltaPerUnit < 0
                            ? formatRp(r.cogsDeltaPerUnit)
                            : 'Rp 0'}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                              r.simCogsPct <= r.target_food_cost_pct + 2
                                ? 'badge-emerald'
                                : r.simCogsPct <= r.target_food_cost_pct + 6
                                ? 'badge-amber'
                                : 'badge-rose'
                            }`}
                          >
                            {r.simCogsPct}%
                          </span>
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono">
                          <span className="font-bold text-[var(--text-primary)]">
                            {formatRp(r.recommendedMenuPrice)}
                          </span>
                          {r.recommendedMenuPrice > r.avg_selling_price && (
                            <span className="ml-1.5 text-[10px] text-amber-500">
                              (+{formatRp(r.recommendedMenuPrice - r.avg_selling_price)})
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Brand COGS Comparison Footer Strip */}
      {data && (
        <section className="cockpit-panel rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold font-display text-[var(--text-primary)]">
                Concept-Level Theoretical COGS Comparison
              </h3>
              <p className="text-xs text-[var(--text-secondary)]">
                Direct feed into Executive Overview and Concept P&L Statements.
              </p>
            </div>
            <Link
              href="/"
              className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--accent-primary)] hover:underline"
            >
              <span>View Executive P&L</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {data.brandCogsComparison.map((b) => (
              <div
                key={b.brand}
                className="p-3.5 rounded-xl surface-well space-y-2 border border-[var(--border-subtle)]"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[var(--text-primary)] truncate">
                    {b.brand}
                  </span>
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-semibold ${
                      b.cogsPct <= 36 ? 'badge-emerald' : b.cogsPct <= 41 ? 'badge-amber' : 'badge-rose'
                    }`}
                  >
                    {b.cogsPct}% COGS
                  </span>
                </div>
                <div className="text-[11px] font-mono text-[var(--text-secondary)] space-y-0.5">
                  <div className="flex justify-between">
                    <span className="text-[var(--text-muted)]">Mapped Rev:</span>
                    <span>{formatCompactRp(b.revenue)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--text-muted)]">Food + Pkg:</span>
                    <span className="font-semibold text-[var(--text-primary)]">
                      {formatCompactRp(b.totalCogs)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--text-muted)]">Active BOMs:</span>
                    <span>{b.recipeCount} dishes</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Tab 4: Raw Material Inventory & Automated BOM Depletion */}
      {activeTab === 'inventory' && <InventoryWorkbench />}
    </main>
  );
}
