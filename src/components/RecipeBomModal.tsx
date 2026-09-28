'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import type { CatalogBomItem } from '@/lib/queries';
import { ALL_BRAND_NAV } from '@/lib/brandTheme';

export interface InitialRecipeBomTarget {
  recipe_id?: string | null;
  brand: string;
  item_name: string;
  canonical_name: string;
  category: string;
  bom_summary: string;
  raw_food_cost: number;
  packaging_dine_in: number;
  packaging_delivery: number;
  target_food_cost_pct: number;
  is_hero_bom?: boolean;
  realized_menu_price?: number;
}

interface RecipeBomModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTarget?: InitialRecipeBomTarget | null;
  defaultBrandFilter?: string;
}

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function RecipeBomModal({
  isOpen,
  onClose,
  initialTarget,
  defaultBrandFilter,
}: RecipeBomModalProps) {
  const router = useRouter();
  const [catalog, setCatalog] = useState<CatalogBomItem[]>([]);
  const [loadingCatalog, setLoadingCatalog] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'unmapped' | 'hero'>('all');
  const [selectedBrandFilter, setSelectedBrandFilter] = useState<string>(defaultBrandFilter || 'all');

  // Editor Form State
  const [recipeId, setRecipeId] = useState<string | null>(null);
  const [brand, setBrand] = useState<string>('Tyfel Coffee');
  const [itemName, setItemName] = useState<string>('');
  const [canonicalName, setCanonicalName] = useState<string>('');
  const [category, setCategory] = useState<string>('General');
  const [bomSummary, setBomSummary] = useState<string>('');
  const [rawFoodCost, setRawFoodCost] = useState<number>(12000);
  const [packagingDineIn, setPackagingDineIn] = useState<number>(0);
  const [packagingDelivery, setPackagingDelivery] = useState<number>(2500);
  const [targetFoodCostPct, setTargetFoodCostPct] = useState<number>(28.0);
  const [isHeroBom, setIsHeroBom] = useState<boolean>(false);
  const [referenceMenuPrice, setReferenceMenuPrice] = useState<number>(42000);

  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadCatalog = async (brandParam?: string) => {
    setLoadingCatalog(true);
    try {
      const url =
        brandParam && brandParam !== 'all'
          ? `/api/recipes?brand=${encodeURIComponent(brandParam)}`
          : '/api/recipes';
      const res = await fetch(url, { cache: 'no-store' });
      const data = await res.json();
      if (data.ok && Array.isArray(data.items)) {
        setCatalog(data.items);
        if (!initialTarget && data.items.length > 0) {
          const first = data.items[0] as CatalogBomItem;
          setRecipeId(first.recipe_id);
          setBrand(first.brand);
          setItemName(first.item_name);
          setCanonicalName(first.canonical_name || first.item_name);
          setCategory(first.category || 'General');
          setBomSummary(first.bom_summary || '');
          setRawFoodCost(first.raw_food_cost);
          setPackagingDineIn(first.packaging_dine_in);
          setPackagingDelivery(first.packaging_delivery);
          setTargetFoodCostPct(first.target_food_cost_pct);
          setIsHeroBom(first.is_hero_bom);
          setReferenceMenuPrice(first.realized_menu_price > 0 ? first.realized_menu_price : 38000);
        }
      }
    } catch (err) {
      console.error('Failed loading BOM catalog:', err);
    } finally {
      setLoadingCatalog(false);
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    setFeedback(null);
    loadCatalog(defaultBrandFilter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, defaultBrandFilter]);

  useEffect(() => {
    if (!isOpen || !initialTarget) return;
    setRecipeId(initialTarget.recipe_id || null);
    setBrand(initialTarget.brand || 'Tyfel Coffee');
    setItemName(initialTarget.item_name || '');
    setCanonicalName(initialTarget.canonical_name || initialTarget.item_name || '');
    setCategory(initialTarget.category || 'General');
    setBomSummary(initialTarget.bom_summary || '');
    setRawFoodCost(Number(initialTarget.raw_food_cost ?? 12000));
    setPackagingDineIn(Number(initialTarget.packaging_dine_in ?? 0));
    setPackagingDelivery(Number(initialTarget.packaging_delivery ?? 2500));
    setTargetFoodCostPct(Number(initialTarget.target_food_cost_pct ?? 28));
    setIsHeroBom(Boolean(initialTarget.is_hero_bom));
    setReferenceMenuPrice(Number(initialTarget.realized_menu_price ?? 42000));
  }, [isOpen, initialTarget]);

  const selectCatalogItem = (item: CatalogBomItem) => {
    setFeedback(null);
    setRecipeId(item.recipe_id);
    setBrand(item.brand);
    setItemName(item.item_name);
    setCanonicalName(item.canonical_name || item.item_name);
    setCategory(item.category || 'General');
    setBomSummary(item.bom_summary || '');
    setRawFoodCost(item.raw_food_cost);
    setPackagingDineIn(item.packaging_dine_in);
    setPackagingDelivery(item.packaging_delivery);
    setTargetFoodCostPct(item.target_food_cost_pct);
    setIsHeroBom(item.is_hero_bom);
    setReferenceMenuPrice(item.realized_menu_price > 0 ? item.realized_menu_price : 38000);
  };

  const filteredCatalog = useMemo(() => {
    return catalog.filter((it) => {
      if (selectedBrandFilter !== 'all' && it.brand.toLowerCase() !== selectedBrandFilter.toLowerCase()) {
        return false;
      }
      if (filterMode === 'unmapped' && it.has_recipe_bom) return false;
      if (filterMode === 'hero' && !it.is_hero_bom) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        it.item_name.toLowerCase().includes(q) ||
        it.canonical_name.toLowerCase().includes(q) ||
        it.brand.toLowerCase().includes(q) ||
        it.category.toLowerCase().includes(q)
      );
    });
  }, [catalog, selectedBrandFilter, filterMode, searchQuery]);

  const unmappedCount = useMemo(
    () => catalog.filter((c) => !c.has_recipe_bom).length,
    [catalog]
  );

  // Live Simulated Unit Economics
  const menuPriceSafe = Math.max(1000, referenceMenuPrice || 38000);
  const dineInCost = (Number(rawFoodCost) || 0) + (Number(packagingDineIn) || 0);
  const deliveryCost = (Number(rawFoodCost) || 0) + (Number(packagingDelivery) || 0);
  const dineInMargin = Math.max(0, menuPriceSafe - dineInCost);
  const deliveryMargin = Math.max(0, menuPriceSafe - deliveryCost);
  const dineInFcPct = Number(((dineInCost / menuPriceSafe) * 100).toFixed(1));
  const deliveryFcPct = Number(((deliveryCost / menuPriceSafe) * 100).toFixed(1));
  const pkgDragPct = Number((((Number(packagingDelivery) || 0) / menuPriceSafe) * 100).toFixed(1));

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemName.trim()) {
      setFeedback({ type: 'error', text: 'POS/Aggregator SKU Name is required.' });
      return;
    }

    setSaving(true);
    setFeedback(null);

    try {
      const res = await fetch('/api/recipes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipe_id: recipeId,
          brand,
          item_name: itemName.trim(),
          canonical_name: canonicalName.trim() || itemName.trim(),
          category: category.trim() || 'General',
          bom_summary: bomSummary.trim(),
          raw_food_cost: Number(rawFoodCost) || 0,
          packaging_dine_in: Number(packagingDineIn) || 0,
          packaging_delivery: Number(packagingDelivery) || 0,
          target_food_cost_pct: Number(targetFoodCostPct) || 28,
          is_hero_bom: isHeroBom,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || 'Failed to save recipe BOM');
      }

      setRecipeId(data.recipe_id);
      setFeedback({ type: 'success', text: data.message || 'Saved recipe BOM to DuckDB/Layerbase.' });
      await loadCatalog(defaultBrandFilter);
      router.refresh();
    } catch (err) {
      setFeedback({
        type: 'error',
        text: err instanceof Error ? err.message : 'Error saving recipe BOM',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleResetOrDelete = async () => {
    if (!recipeId) return;
    setSaving(true);
    setFeedback(null);
    try {
      const res = await fetch(`/api/recipes?recipe_id=${encodeURIComponent(recipeId)}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || 'Failed to reset recipe BOM');
      }
      setFeedback({ type: 'success', text: data.message || 'Reset recipe BOM.' });
      await loadCatalog(defaultBrandFilter);
      router.refresh();
    } catch (err) {
      setFeedback({
        type: 'error',
        text: err instanceof Error ? err.message : 'Error resetting recipe BOM',
      });
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="cockpit-panel rounded-2xl border border-[var(--border-strong)] shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden bg-[var(--bg-surface)]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[var(--border-default)] flex items-center justify-between gap-4 bg-[var(--bg-elevated)]/60">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 rounded badge-emerald font-semibold">
                Track 3 · Culinary Cost Engine
              </span>
              {unmappedCount > 0 && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded badge-amber">
                  {unmappedCount} Unmapped SKUs
                </span>
              )}
            </div>
            <h3 className="text-base sm:text-lg font-bold text-[var(--text-primary)] mt-1">
              Interactive Menu BOM &amp; Packaging COGS Editor
            </h3>
            <p className="text-xs text-[var(--text-secondary)]">
              Update raw ingredient costs, dine-in vs delivery packaging drag, or map unmapped POS/Klikit SKUs directly in <code className="font-mono">dim_recipes</code>.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg text-xs font-mono font-semibold border border-[var(--border-default)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors cursor-pointer"
          >
            ESC / Close
          </button>
        </div>

        {/* Body Split: Left Catalog Picker + Right Live BOM Editor */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden min-h-0">
          {/* Left Column: SKU & Recipe Catalog */}
          <div className="lg:col-span-5 border-b lg:border-b-0 lg:border-r border-[var(--border-default)] flex flex-col min-h-0 bg-[var(--bg-well)]/40">
            <div className="p-3.5 border-b border-[var(--border-subtle)] space-y-2.5">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search SKU, recipe, or category..."
                  className="w-full px-3 py-1.5 text-xs rounded-lg bg-[var(--bg-surface)] border border-[var(--border-default)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-emerald-500"
                />
                <button
                  type="button"
                  onClick={() => {
                    setFeedback(null);
                    setRecipeId(null);
                    setItemName('');
                    setCanonicalName('');
                    setCategory('General');
                    setBomSummary('');
                    setRawFoodCost(12000);
                    setPackagingDineIn(0);
                    setPackagingDelivery(2500);
                    setTargetFoodCostPct(28);
                    setIsHeroBom(false);
                  }}
                  className="shrink-0 px-2.5 py-1.5 rounded-lg text-[11px] font-mono font-semibold badge-sky hover:opacity-90 cursor-pointer"
                  title="Create a new SKU BOM mapping"
                >
                  + New SKU
                </button>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-1">
                  {(['all', 'unmapped', 'hero'] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setFilterMode(m)}
                      className={`px-2 py-1 rounded text-[10px] font-mono uppercase tracking-wider cursor-pointer transition-colors ${
                        filterMode === m
                          ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30 font-semibold'
                          : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                      }`}
                    >
                      {m === 'all' ? `All (${catalog.length})` : m === 'unmapped' ? `Unmapped (${unmappedCount})` : 'Hero BOMs'}
                    </button>
                  ))}
                </div>

                <select
                  value={selectedBrandFilter}
                  onChange={(e) => setSelectedBrandFilter(e.target.value)}
                  className="px-2 py-1 rounded text-[11px] font-mono bg-[var(--bg-surface)] border border-[var(--border-default)] text-[var(--text-secondary)]"
                >
                  <option value="all">All Brands</option>
                  {ALL_BRAND_NAV.map((b) => (
                    <option key={b.slug} value={b.name}>
                      {b.shortName}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-[var(--border-subtle)] max-h-[260px] lg:max-h-none">
              {loadingCatalog ? (
                <div className="p-6 text-center text-xs font-mono text-[var(--text-muted)]">
                  Loading SKU &amp; BOM catalog...
                </div>
              ) : filteredCatalog.length === 0 ? (
                <div className="p-6 text-center text-xs font-mono text-[var(--text-muted)]">
                  No matching SKUs found.
                </div>
              ) : (
                filteredCatalog.map((item, idx) => {
                  const isSelected =
                    item.item_name.toLowerCase() === itemName.toLowerCase() &&
                    item.brand.toLowerCase() === brand.toLowerCase();
                  return (
                    <button
                      key={`${item.brand}-${item.item_name}-${idx}`}
                      type="button"
                      onClick={() => selectCatalogItem(item)}
                      className={`w-full text-left p-3 transition-colors cursor-pointer flex items-start justify-between gap-2 ${
                        isSelected
                          ? 'bg-emerald-500/10 border-l-2 border-l-emerald-500'
                          : 'hover:bg-[var(--bg-hover)]'
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[10px] font-mono text-[var(--text-muted)] uppercase">
                            {item.brand}
                          </span>
                          {item.is_hero_bom && (
                            <span className="text-[9px] font-mono px-1.5 py-0.2 rounded badge-emerald">
                              HERO
                            </span>
                          )}
                          {!item.has_recipe_bom && (
                            <span className="text-[9px] font-mono px-1.5 py-0.2 rounded badge-amber">
                              ESTIMATED
                            </span>
                          )}
                        </div>
                        <p className="text-xs font-semibold text-[var(--text-primary)] truncate mt-0.5">
                          {item.canonical_name}
                        </p>
                        <p className="text-[10px] font-mono text-[var(--text-muted)] truncate">
                          POS SKU: {item.item_name}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-xs font-mono font-bold text-[var(--text-primary)] block">
                          {formatRupiah(item.raw_food_cost)}
                        </span>
                        <span className="text-[10px] font-mono text-[var(--text-muted)]">
                          +{formatRupiah(item.packaging_delivery)} pkg
                        </span>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Column: Interactive BOM Form & Live Margin Preview */}
          <form onSubmit={handleSave} className="lg:col-span-7 p-5 overflow-y-auto space-y-4">
            {feedback && (
              <div
                className={`p-3 rounded-xl text-xs font-mono flex items-center justify-between ${
                  feedback.type === 'success' ? 'badge-emerald' : 'badge-rose'
                }`}
              >
                <span>{feedback.text}</span>
                <button
                  type="button"
                  onClick={() => setFeedback(null)}
                  className="text-[10px] underline ml-3 cursor-pointer"
                >
                  Dismiss
                </button>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)] mb-1">
                  Brand
                </label>
                <select
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg bg-[var(--bg-well)] border border-[var(--border-default)] text-[var(--text-primary)] font-medium"
                >
                  {ALL_BRAND_NAV.map((b) => (
                    <option key={b.slug} value={b.name}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)] mb-1">
                  Menu Category
                </label>
                <input
                  type="text"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="e.g. Signature Espresso, All-Day Burritos"
                  className="w-full px-3 py-2 text-xs rounded-lg bg-[var(--bg-well)] border border-[var(--border-default)] text-[var(--text-primary)]"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)] mb-1">
                  Exact POS / Klikit SKU Item Name (Join Key)
                </label>
                <input
                  type="text"
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  required
                  placeholder="Exact item_name from fact_order_items..."
                  className="w-full px-3 py-2 text-xs font-mono rounded-lg bg-[var(--bg-well)] border border-[var(--border-default)] text-[var(--text-primary)]"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)] mb-1">
                  Canonical Display Name
                </label>
                <input
                  type="text"
                  value={canonicalName}
                  onChange={(e) => setCanonicalName(e.target.value)}
                  placeholder="Clean executive menu title..."
                  className="w-full px-3 py-2 text-xs rounded-lg bg-[var(--bg-well)] border border-[var(--border-default)] text-[var(--text-primary)]"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)] mb-1">
                  Recipe Bill of Materials (BOM) &amp; Packaging Specification
                </label>
                <textarea
                  rows={2}
                  value={bomSummary}
                  onChange={(e) => setBomSummary(e.target.value)}
                  placeholder="e.g. 18g espresso blend, 25ml organic aren palm sugar, 120ml oat base | Pkg: 12oz cup, lid, straw"
                  className="w-full px-3 py-2 text-xs rounded-lg bg-[var(--bg-well)] border border-[var(--border-default)] text-[var(--text-primary)]"
                />
              </div>
            </div>

            {/* Cost Inputs */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
              <div>
                <label className="block text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)] mb-1">
                  Raw Food Cost (Rp)
                </label>
                <input
                  type="number"
                  min={0}
                  step={100}
                  value={rawFoodCost}
                  onChange={(e) => setRawFoodCost(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs font-mono font-bold rounded-lg bg-[var(--bg-well)] border border-[var(--border-default)] text-[var(--text-primary)]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)] mb-1">
                  Dine-In Pkg (Rp)
                </label>
                <input
                  type="number"
                  min={0}
                  step={50}
                  value={packagingDineIn}
                  onChange={(e) => setPackagingDineIn(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs font-mono font-bold rounded-lg bg-[var(--bg-well)] border border-[var(--border-default)] text-[var(--text-primary)]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)] mb-1">
                  Delivery Pkg (Rp)
                </label>
                <input
                  type="number"
                  min={0}
                  step={50}
                  value={packagingDelivery}
                  onChange={(e) => setPackagingDelivery(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs font-mono font-bold rounded-lg bg-[var(--bg-well)] border border-[var(--border-default)] text-[var(--text-primary)]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)] mb-1">
                  Target COGS %
                </label>
                <input
                  type="number"
                  min={1}
                  max={90}
                  step={0.5}
                  value={targetFoodCostPct}
                  onChange={(e) => setTargetFoodCostPct(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs font-mono font-bold rounded-lg bg-[var(--bg-well)] border border-[var(--border-default)] text-[var(--text-primary)]"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <label className="inline-flex items-center gap-2 text-xs text-[var(--text-secondary)] cursor-pointer">
                <input
                  type="checkbox"
                  checked={isHeroBom}
                  onChange={(e) => setIsHeroBom(e.target.checked)}
                  className="rounded border-[var(--border-default)]"
                />
                <span>Pin as Flagship Hero BOM Card on Executive Dashboard</span>
              </label>

              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono text-[var(--text-muted)]">Ref Menu Price:</span>
                <input
                  type="number"
                  min={1000}
                  step={500}
                  value={referenceMenuPrice}
                  onChange={(e) => setReferenceMenuPrice(Number(e.target.value))}
                  className="w-28 px-2 py-1 text-xs font-mono rounded bg-[var(--bg-well)] border border-[var(--border-default)] text-[var(--text-primary)]"
                />
              </div>
            </div>

            {/* Live Unit Economics Simulation Preview */}
            <div className="surface-well rounded-xl p-4 border border-[var(--border-subtle)] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)] font-semibold">
                  Live Unit Economics Preview (@ {formatRupiah(menuPriceSafe)} Menu Price)
                </span>
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded font-semibold ${
                    deliveryFcPct <= targetFoodCostPct
                      ? 'badge-emerald'
                      : deliveryFcPct <= targetFoodCostPct + 5
                      ? 'badge-amber'
                      : 'badge-rose'
                  }`}
                >
                  {deliveryFcPct <= targetFoodCostPct
                    ? 'Within Target COGS'
                    : `+${(deliveryFcPct - targetFoodCostPct).toFixed(1)}% vs Target`}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-2.5 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)]">
                  <span className="text-[10px] text-[var(--text-muted)] block">Dine-In COGS %</span>
                  <span className="font-mono font-bold text-sm text-emerald-500">{dineInFcPct}%</span>
                  <span className="text-[10px] font-mono text-[var(--text-muted)] block mt-0.5">
                    Margin: {formatRupiah(dineInMargin)}
                  </span>
                </div>
                <div className="p-2.5 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)]">
                  <span className="text-[10px] text-[var(--text-muted)] block">Delivery COGS %</span>
                  <span
                    className={`font-mono font-bold text-sm ${
                      deliveryFcPct <= targetFoodCostPct ? 'text-emerald-500' : 'text-amber-500'
                    }`}
                  >
                    {deliveryFcPct}%
                  </span>
                  <span className="text-[10px] font-mono text-[var(--text-muted)] block mt-0.5">
                    Margin: {formatRupiah(deliveryMargin)}
                  </span>
                </div>
                <div className="p-2.5 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)]">
                  <span className="text-[10px] text-[var(--text-muted)] block">Packaging Drag</span>
                  <span className="font-mono font-bold text-sm text-sky-500">+{pkgDragPct}%</span>
                  <span className="text-[10px] font-mono text-[var(--text-muted)] block mt-0.5">
                    {formatRupiah(packagingDelivery)} / order
                  </span>
                </div>
                <div className="p-2.5 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)]">
                  <span className="text-[10px] text-[var(--text-muted)] block">Total Unit Cost</span>
                  <span className="font-mono font-bold text-sm text-[var(--text-primary)]">
                    {formatRupiah(deliveryCost)}
                  </span>
                  <span className="text-[10px] font-mono text-[var(--text-muted)] block mt-0.5">
                    Target ≤ {targetFoodCostPct}%
                  </span>
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--border-default)]">
              <div>
                {recipeId && (
                  <button
                    type="button"
                    disabled={saving}
                    onClick={handleResetOrDelete}
                    className="px-3 py-2 rounded-lg text-xs font-mono text-rose-500 hover:bg-rose-500/10 border border-rose-500/30 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    Reset / Remove Override
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-lg text-xs font-mono text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] border border-[var(--border-default)] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-lg text-xs font-mono font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm transition-colors cursor-pointer disabled:opacity-50"
                >
                  {saving ? 'Saving to DB...' : recipeId ? 'Update Recipe BOM' : 'Save & Map SKU BOM'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
