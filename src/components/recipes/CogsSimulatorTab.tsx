"use client";

import React from "react";
import {
  RotateCcw,
  TrendingUp,
} from "lucide-react";
import type { RecipesCogsDashboardData } from "@/lib/recipesCogs";
import { formatRp, formatCompactRp } from "./types";

export interface SimulationResults {
  simulatedRecipes: Array<{
    recipe_id: string;
    canonical_name: string;
    brand: string;
    avg_selling_price: number;
    blended_cogs_per_unit: number;
    simBlendedCogs: number;
    simCogsPct: number;
    cogsDeltaPerUnit: number;
    monthlyImpactRp: number;
    recommendedMenuPrice: number;
  }>;
  simTotalFoodSpend: number;
  simTotalPkgSpend: number;
  simTotalCogs: number;
  simWeightedCogsPct: number;
  totalMonthlyDeltaRp: number;
}

export interface CogsSimulatorTabProps {
  data: RecipesCogsDashboardData;
  shocks: Record<string, number>;
  onShocksChange: React.Dispatch<React.SetStateAction<Record<string, number>>>;
  simulationResults: SimulationResults;
}

export function CogsSimulatorTab({
  data,
  shocks,
  onShocksChange,
  simulationResults,
}: CogsSimulatorTabProps) {
  return (
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
              onShocksChange({
                "Coffee & Tea": 0,
                "Dairy & Plant Milk": 0,
                "Plant Proteins & Eggs": 0,
                "Grains, Bread & Pasta": 0,
                "Produce & Fungi": 0,
                "Sauces, Oils & Sweeteners": 0,
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
                      ? "text-rose-500"
                      : pctVal < 0
                      ? "text-emerald-500"
                      : "text-[var(--text-muted)]"
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
                  onShocksChange((prev) => ({
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
              Monthly P&amp;L Profit Impact
            </div>
            <div
              className={`text-2xl font-bold font-mono ${
                simulationResults.totalMonthlyDeltaRp > 0
                  ? "text-rose-500"
                  : simulationResults.totalMonthlyDeltaRp < 0
                  ? "text-emerald-500"
                  : "text-[var(--text-primary)]"
              }`}
            >
              {simulationResults.totalMonthlyDeltaRp > 0
                ? `-${formatCompactRp(simulationResults.totalMonthlyDeltaRp)} Margin`
                : simulationResults.totalMonthlyDeltaRp < 0
                ? `+${formatCompactRp(Math.abs(simulationResults.totalMonthlyDeltaRp))} Saved`
                : "Rp 0 Delta"}
            </div>
          </div>
        </div>

        {/* Simulated Recipe Margin Defense Table */}
        <div className="cockpit-panel rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-[var(--border-subtle)] flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold font-display text-[var(--text-primary)]">
                Dish-by-Dish Margin Sensitivity &amp; Recommended Menu Price Defense
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
                          ? "text-rose-500"
                          : r.cogsDeltaPerUnit < 0
                          ? "text-emerald-500"
                          : "text-[var(--text-muted)]"
                      }`}
                    >
                      {r.cogsDeltaPerUnit > 0 ? `+${formatRp(r.cogsDeltaPerUnit)}` : formatRp(r.cogsDeltaPerUnit)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                          r.simCogsPct <= 28
                            ? "badge-emerald"
                            : r.simCogsPct <= 35
                            ? "badge-amber"
                            : "badge-rose"
                        }`}
                      >
                        {r.simCogsPct.toFixed(1)}%
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      {formatRp(r.recommendedMenuPrice)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
