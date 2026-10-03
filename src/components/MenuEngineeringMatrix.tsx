'use client';

import React, { useState, useMemo } from 'react';
import type {
  GlobalMenuEngineeringReport,
  MenuEngineeringQuadrant,
} from '@/lib/queries';
import {
  Sparkles,
  TrendingUp,
  Lightbulb,
  Search,
  Package,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface MenuEngineeringMatrixProps {
  report: GlobalMenuEngineeringReport;
}

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

export function MenuEngineeringMatrix({ report }: MenuEngineeringMatrixProps) {
  const [selectedQuadrant, setSelectedQuadrant] = useState<MenuEngineeringQuadrant | 'ALL'>('ALL');
  const [selectedBrand, setSelectedBrand] = useState<string>('ALL');
  const [search, setSearch] = useState('');
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);

  const { items, summary } = report;

  // Extract distinct brands
  const brandList = useMemo(() => {
    const set = new Set<string>();
    items.forEach((it) => set.add(it.brand));
    return Array.from(set).sort();
  }, [items]);

  // Filter items
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (selectedQuadrant !== 'ALL' && item.quadrant !== selectedQuadrant) return false;
      if (selectedBrand !== 'ALL' && item.brand.toLowerCase() !== selectedBrand.toLowerCase()) return false;
      if (search) {
        const q = search.toLowerCase();
        const matchName = item.item_name.toLowerCase().includes(q);
        const matchBrand = item.brand.toLowerCase().includes(q);
        const matchCat = item.category.toLowerCase().includes(q);
        if (!matchName && !matchBrand && !matchCat) return false;
      }
      return true;
    });
  }, [items, selectedQuadrant, selectedBrand, search]);

  const quadrantBadgeStyles: Record<MenuEngineeringQuadrant, { bg: string; text: string; border: string; icon: string }> = {
    Star: {
      bg: 'bg-emerald-500/10 dark:bg-emerald-500/20',
      text: 'text-emerald-700 dark:text-emerald-300 font-semibold',
      border: 'border-emerald-500/30',
      icon: '🌟 Star',
    },
    Plowhorse: {
      bg: 'bg-amber-500/10 dark:bg-amber-500/20',
      text: 'text-amber-700 dark:text-amber-300 font-semibold',
      border: 'border-amber-500/30',
      icon: '🐎 Plowhorse',
    },
    Puzzle: {
      bg: 'bg-blue-500/10 dark:bg-blue-500/20',
      text: 'text-blue-700 dark:text-blue-300 font-semibold',
      border: 'border-blue-500/30',
      icon: '🧩 Puzzle',
    },
    Dog: {
      bg: 'bg-rose-500/10 dark:bg-rose-500/20',
      text: 'text-rose-700 dark:text-rose-300 font-semibold',
      border: 'border-rose-500/30',
      icon: '🐕 Dog',
    },
  };

  return (
    <div className="space-y-6">
      {/* SECTION HEADER */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-surface p-6 rounded-2xl border border-border shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider mb-1">
            <Sparkles className="w-4 h-4 text-amber-500" />
            Strategic Menu Intelligence & BCG Matrix
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-foreground">
            SKU Net Contribution & Menu Engineering
          </h2>
          <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
            True net profitability per item after deducting aggregator platform fees (~20%), merchant promo burn (~8%), and recipe BOM packaging costs.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-surface-elevated px-4 py-2.5 rounded-xl border border-border flex items-center gap-3">
            <div>
              <div className="text-[11px] text-muted-foreground font-medium uppercase">Net Contribution Rate</div>
              <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                {summary.avgNetContributionMarginPct}%
              </div>
            </div>
            <div className="h-8 w-[1px] bg-border" />
            <div>
              <div className="text-[11px] text-muted-foreground font-medium uppercase">Total Net Contribution</div>
              <div className="text-lg font-bold text-foreground">
                {formatCompactRupiah(summary.totalNetContributionRp)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4 QUADRANT SUMMARY CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* STARS */}
        <button
          onClick={() => setSelectedQuadrant(selectedQuadrant === 'Star' ? 'ALL' : 'Star')}
          className={`text-left p-4 rounded-xl border transition-all ${
            selectedQuadrant === 'Star'
              ? 'ring-2 ring-emerald-500 border-emerald-500 bg-emerald-500/10'
              : 'border-border bg-surface hover:bg-surface-elevated'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">
              🌟 Stars
            </span>
            <span className="text-2xl font-extrabold text-foreground">{summary.starsCount}</span>
          </div>
          <div className="mt-3 text-xs text-muted-foreground">
            <strong>High Volume · High Net Margin</strong>
          </div>
          <p className="text-[11px] text-emerald-700/80 dark:text-emerald-400/80 mt-1 line-clamp-2">
            Anchor profit engines. Ensure 100% recipe BOM consistency & zero-stockout prep.
          </p>
        </button>

        {/* PLOWHORSES */}
        <button
          onClick={() => setSelectedQuadrant(selectedQuadrant === 'Plowhorse' ? 'ALL' : 'Plowhorse')}
          className={`text-left p-4 rounded-xl border transition-all ${
            selectedQuadrant === 'Plowhorse'
              ? 'ring-2 ring-amber-500 border-amber-500 bg-amber-500/10'
              : 'border-border bg-surface hover:bg-surface-elevated'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-amber-500/15 text-amber-700 dark:text-amber-300">
              🐎 Plowhorses
            </span>
            <span className="text-2xl font-extrabold text-foreground">{summary.plowhorsesCount}</span>
          </div>
          <div className="mt-3 text-xs text-muted-foreground">
            <strong>High Volume · Low Net Margin</strong>
          </div>
          <p className="text-[11px] text-amber-700/80 dark:text-amber-400/80 mt-1 line-clamp-2">
            Popular but margin drained by platform fees/BOM. Test +Rp 3k–5k price or trim gramasi.
          </p>
        </button>

        {/* PUZZLES */}
        <button
          onClick={() => setSelectedQuadrant(selectedQuadrant === 'Puzzle' ? 'ALL' : 'Puzzle')}
          className={`text-left p-4 rounded-xl border transition-all ${
            selectedQuadrant === 'Puzzle'
              ? 'ring-2 ring-blue-500 border-blue-500 bg-blue-500/10'
              : 'border-border bg-surface hover:bg-surface-elevated'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-blue-500/15 text-blue-700 dark:text-blue-300">
              🧩 Puzzles
            </span>
            <span className="text-2xl font-extrabold text-foreground">{summary.puzzlesCount}</span>
          </div>
          <div className="mt-3 text-xs text-muted-foreground">
            <strong>Low Volume · High Net Margin</strong>
          </div>
          <p className="text-[11px] text-blue-700/80 dark:text-blue-400/80 mt-1 line-clamp-2">
            Underpromoted profit gems. Create 2-in-1 combo bundles or spotlight on app banners.
          </p>
        </button>

        {/* DOGS */}
        <button
          onClick={() => setSelectedQuadrant(selectedQuadrant === 'Dog' ? 'ALL' : 'Dog')}
          className={`text-left p-4 rounded-xl border transition-all ${
            selectedQuadrant === 'Dog'
              ? 'ring-2 ring-rose-500 border-rose-500 bg-rose-500/10'
              : 'border-border bg-surface hover:bg-surface-elevated'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-rose-500/15 text-rose-700 dark:text-rose-300">
              🐕 Dogs
            </span>
            <span className="text-2xl font-extrabold text-foreground">{summary.dogsCount}</span>
          </div>
          <div className="mt-3 text-xs text-muted-foreground">
            <strong>Low Volume · Low Net Margin</strong>
          </div>
          <p className="text-[11px] text-rose-700/80 dark:text-rose-400/80 mt-1 line-clamp-2">
            Operational drag on kitchen line. Consider pruning from online menus to reduce waste.
          </p>
        </button>
      </div>

      {/* FILTER & SEARCH BAR */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-surface p-3 rounded-xl border border-border">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search menu or category..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-surface-elevated rounded-lg border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <select
            value={selectedBrand}
            onChange={(e) => setSelectedBrand(e.target.value)}
            className="px-3 py-1.5 text-xs bg-surface-elevated rounded-lg border border-border text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="ALL">All Brands ({items.length})</option>
            {brandList.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {(['ALL', 'Star', 'Plowhorse', 'Puzzle', 'Dog'] as const).map((q) => (
            <button
              key={q}
              onClick={() => setSelectedQuadrant(q)}
              className={`px-3 py-1 text-xs rounded-lg font-medium transition-colors whitespace-nowrap ${
                selectedQuadrant === q
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-surface-elevated text-muted-foreground hover:text-foreground'
              }`}
            >
              {q === 'ALL' ? `All (${items.length})` : `${q}s`}
            </button>
          ))}
        </div>
      </div>

      {/* INTERACTIVE TABLE */}
      <div className="bg-surface rounded-2xl border border-border overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface-elevated text-muted-foreground font-semibold border-b border-border">
              <tr>
                <th className="py-3 px-4">Menu Item & Brand</th>
                <th className="py-3 px-3 text-right">Units Sold</th>
                <th className="py-3 px-3 text-right">Avg Price</th>
                <th className="py-3 px-3 text-right">Platform Fee</th>
                <th className="py-3 px-3 text-right">Promo Burn</th>
                <th className="py-3 px-3 text-right">BOM + Pkg</th>
                <th className="py-3 px-3 text-right">Net Margin Rp</th>
                <th className="py-3 px-3 text-right">Margin %</th>
                <th className="py-3 px-4 text-center">Quadrant</th>
                <th className="py-3 px-3 text-center">Action Plan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-muted-foreground">
                    No items match the selected filter.
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => {
                  const qStyle = quadrantBadgeStyles[item.quadrant];
                  const isExpanded = expandedItemId === `${item.brand}-${item.item_name}`;

                  return (
                    <React.Fragment key={`${item.brand}-${item.item_name}`}>
                      <tr
                        onClick={() =>
                          setExpandedItemId(isExpanded ? null : `${item.brand}-${item.item_name}`)
                        }
                        className="hover:bg-surface-elevated/70 cursor-pointer transition-colors"
                      >
                        <td className="py-3 px-4">
                          <div className="font-semibold text-foreground">{item.item_name}</div>
                          <div className="text-[11px] text-muted-foreground flex items-center gap-1.5 mt-0.5">
                            <span className="px-1.5 py-0.5 rounded bg-surface-elevated border border-border text-[10px]">
                              {item.brand}
                            </span>
                            <span>•</span>
                            <span>{item.category}</span>
                            {item.has_recipe_bom && (
                              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                                ✓ BOM Verified
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="py-3 px-3 text-right font-medium text-foreground">
                          {item.total_qty.toLocaleString()}
                          <div className="text-[10px] text-muted-foreground">
                            {item.delivery_qty} deliv / {item.dine_in_qty} dine
                          </div>
                        </td>

                        <td className="py-3 px-3 text-right font-medium text-foreground">
                          {formatRupiah(item.avg_selling_price)}
                        </td>

                        <td className="py-3 px-3 text-right text-rose-600 dark:text-rose-400">
                          -{formatRupiah(item.estimated_platform_fee)}
                        </td>

                        <td className="py-3 px-3 text-right text-amber-600 dark:text-amber-400">
                          -{formatRupiah(item.estimated_promo_burn)}
                        </td>

                        <td className="py-3 px-3 text-right text-muted-foreground">
                          {formatRupiah(item.blended_cogs)}
                        </td>

                        <td className="py-3 px-3 text-right font-bold text-foreground">
                          {formatRupiah(item.unit_net_contribution_rp)}
                        </td>

                        <td className="py-3 px-3 text-right">
                          <span
                            className={`inline-block px-2 py-0.5 rounded font-bold ${
                              item.unit_net_contribution_pct >= 35
                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                : item.unit_net_contribution_pct >= 20
                                ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                                : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                            }`}
                          >
                            {item.unit_net_contribution_pct}%
                          </span>
                        </td>

                        <td className="py-3 px-4 text-center">
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] border ${qStyle.bg} ${qStyle.text} ${qStyle.border}`}
                          >
                            {qStyle.icon}
                          </span>
                        </td>

                        <td className="py-3 px-3 text-center">
                          <button className="text-muted-foreground hover:text-foreground">
                            {isExpanded ? (
                              <ChevronUp className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                          </button>
                        </td>
                      </tr>

                      {/* EXPANDABLE DETAIL DRAWER */}
                      {isExpanded && (
                        <tr className="bg-surface-elevated/40">
                          <td colSpan={10} className="p-4 border-b border-border">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                              <div className="p-3 bg-surface rounded-xl border border-border space-y-1.5">
                                <div className="font-semibold text-foreground flex items-center gap-1.5">
                                  <Package className="w-4 h-4 text-primary" />
                                  Recipe BOM & Cost Breakdown
                                </div>
                                <div className="text-[11px] text-muted-foreground">{item.bom_summary}</div>
                                <div className="pt-2 border-t border-border flex justify-between">
                                  <span className="text-muted-foreground">Raw Food Cost:</span>
                                  <span className="font-medium text-foreground">{formatRupiah(item.raw_food_cost)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Packaging Cost:</span>
                                  <span className="font-medium text-foreground">{formatRupiah(item.packaging_cost)}</span>
                                </div>
                              </div>

                              <div className="p-3 bg-surface rounded-xl border border-border space-y-1.5">
                                <div className="font-semibold text-foreground flex items-center gap-1.5">
                                  <Lightbulb className="w-4 h-4 text-amber-500" />
                                  Operational Action Recommendation
                                </div>
                                <p className="text-[11px] text-foreground leading-relaxed">
                                  {item.quadrant_action}
                                </p>
                              </div>

                              <div className="p-3 bg-surface rounded-xl border border-border space-y-1.5">
                                <div className="font-semibold text-foreground flex items-center gap-1.5">
                                  <TrendingUp className="w-4 h-4 text-emerald-500" />
                                  Pricing Elasticity Strategy
                                </div>
                                <p className="text-[11px] text-foreground leading-relaxed">
                                  {item.price_elasticity_recommendation}
                                </p>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
