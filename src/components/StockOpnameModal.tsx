'use client';

import React, { useState } from 'react';
import type { IngredientInventoryItem, StockOpnameAuditRecord } from '@/lib/inventory';
import {
  ClipboardCheck,
  X,
  CheckCircle2,
  RefreshCw,
  Search,
} from 'lucide-react';

interface StockOpnameModalProps {
  isOpen: boolean;
  onClose: () => void;
  ingredients: IngredientInventoryItem[];
  onCommitted: () => void;
}

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function StockOpnameModal({
  isOpen,
  onClose,
  ingredients,
  onCommitted,
}: StockOpnameModalProps) {
  const [branch, setBranch] = useState('Greenville Flagship');
  const [conductedBy, setConductedBy] = useState('Head Chef / Shift Lead');
  const [notes, setNotes] = useState('');
  const [search, setSearch] = useState('');
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [submitting, setSubmitting] = useState(false);
  const [auditResult, setAuditResult] = useState<StockOpnameAuditRecord | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const filtered = ingredients.filter((ing) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      ing.ingredientName.toLowerCase().includes(q) ||
      ing.category.toLowerCase().includes(q)
    );
  });

  const handleCountChange = (ingredientId: string, val: string) => {
    const num = parseFloat(val);
    setCounts((prev) => ({
      ...prev,
      [ingredientId]: isNaN(num) ? 0 : num,
    }));
  };

  const handleSetAllToSystem = () => {
    const initial: Record<string, number> = {};
    ingredients.forEach((ing) => {
      initial[ing.ingredientId] = ing.currentStock;
    });
    setCounts(initial);
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      setErrorMsg(null);

      // Prepare payload
      const payloadCounts = Object.entries(counts).map(([ingId, actual]) => ({
        ingredientId: ingId,
        actualCount: actual,
      }));

      if (payloadCounts.length === 0) {
        setErrorMsg('Please input physical counts for at least 1 ingredient.');
        setSubmitting(false);
        return;
      }

      const res = await fetch('/api/inventory/opname', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          branch,
          conductedBy,
          notes: notes || 'Weekly Physical Inventory Audit',
          counts: payloadCounts,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to submit stock opname');
      }

      const result = await res.json();
      setAuditResult(result.audit);
      onCommitted();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Error submitting opname');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-surface w-full max-w-4xl max-h-[90vh] rounded-2xl border border-border shadow-2xl flex flex-col overflow-hidden">
        {/* HEADER */}
        <div className="p-6 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
              <ClipboardCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground">Physical Stock Opname & Variance Audit</h3>
              <p className="text-xs text-muted-foreground">
                Reconcile physical stock counts against theoretical BOM depletion to detect shrinkage & waste.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-muted-foreground hover:text-foreground rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* AUDIT SUCCESS RESULT VIEW */}
        {auditResult ? (
          <div className="p-6 space-y-6 overflow-y-auto">
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-start gap-3">
              <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-foreground">Stock Opname Committed Successfully!</h4>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Audit ID: <span className="font-mono text-foreground font-semibold">{auditResult.opnameId}</span> · Recorded at{' '}
                  {new Date(auditResult.conductedAt).toLocaleTimeString()}
                </p>
              </div>
            </div>

            {/* AUDIT SUMMARY METRICS */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 bg-surface-elevated rounded-xl border border-border">
                <div className="text-xs text-muted-foreground">Total Variance Value</div>
                <div className={`text-xl font-bold mt-1 ${auditResult.totalVarianceRp < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                  {formatRupiah(auditResult.totalVarianceRp)}
                </div>
                <div className="text-[11px] text-muted-foreground mt-0.5">
                  {auditResult.totalVarianceRp < 0 ? 'Shrinkage / Unrecorded Loss' : 'Surplus Stock'}
                </div>
              </div>

              <div className="p-4 bg-surface-elevated rounded-xl border border-border">
                <div className="text-xs text-muted-foreground">Net Shrinkage Rate</div>
                <div className={`text-xl font-bold mt-1 ${auditResult.netShrinkagePct > 2.5 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                  {auditResult.netShrinkagePct}%
                </div>
                <div className="text-[11px] text-muted-foreground mt-0.5">
                  Target threshold: &le; 2.5% of total stock
                </div>
              </div>

              <div className="p-4 bg-surface-elevated rounded-xl border border-border">
                <div className="text-xs text-muted-foreground">High Risk Shrinkage Items</div>
                <div className="text-xl font-bold text-foreground mt-1">
                  {auditResult.highRiskShrinkageCount} Items
                </div>
                <div className="text-[11px] text-rose-600 dark:text-rose-400 mt-0.5">
                  &gt;10% variance from theoretical
                </div>
              </div>
            </div>

            {/* AUDIT ITEMS TABLE */}
            <div className="border border-border rounded-xl overflow-hidden">
              <table className="w-full text-xs text-left">
                <thead className="bg-surface-elevated text-muted-foreground font-semibold border-b border-border">
                  <tr>
                    <th className="py-2.5 px-3">Ingredient</th>
                    <th className="py-2.5 px-3 text-right">System BOM</th>
                    <th className="py-2.5 px-3 text-right">Actual Count</th>
                    <th className="py-2.5 px-3 text-right">Variance Qty</th>
                    <th className="py-2.5 px-3 text-right">Variance Rp</th>
                    <th className="py-2.5 px-3 text-center">Variance Classification</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border font-mono">
                  {auditResult.items.map((it) => (
                    <tr key={it.ingredientId} className="hover:bg-surface-elevated/50">
                      <td className="py-2.5 px-3 font-sans font-medium text-foreground">
                        {it.ingredientName}
                      </td>
                      <td className="py-2.5 px-3 text-right text-muted-foreground">
                        {it.systemStock} {it.baseUnit}
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-foreground">
                        {it.actualCount} {it.baseUnit}
                      </td>
                      <td className={`py-2.5 px-3 text-right font-bold ${it.varianceQty < 0 ? 'text-rose-600 dark:text-rose-400' : it.varianceQty > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'}`}>
                        {it.varianceQty > 0 ? `+${it.varianceQty}` : it.varianceQty} {it.baseUnit}
                      </td>
                      <td className={`py-2.5 px-3 text-right font-bold ${it.varianceValueRp < 0 ? 'text-rose-600 dark:text-rose-400' : it.varianceValueRp > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'}`}>
                        {formatRupiah(it.varianceValueRp)}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-sans ${
                          it.varianceType === 'SHRINKAGE_SPILLAGE'
                            ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                            : it.varianceType === 'PORTION_VARIANCE'
                            ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                            : it.varianceType === 'SURPLUS'
                            ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20'
                            : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                        }`}>
                          {it.varianceType}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={onClose}
                className="px-5 py-2 text-xs font-semibold bg-primary text-primary-foreground rounded-xl"
              >
                Close Audit Workbench
              </button>
            </div>
          </div>
        ) : (
          /* AUDIT INPUT FORM */
          <div className="p-6 space-y-5 overflow-y-auto flex-1">
            {errorMsg && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-600 dark:text-rose-400">
                {errorMsg}
              </div>
            )}

            {/* METADATA BAR */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">
                  Kitchen Branch
                </label>
                <select
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-surface-elevated rounded-lg border border-border text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="Greenville Flagship">Greenville Flagship</option>
                  <option value="Kemang Cloud Kitchen">Kemang Cloud Kitchen</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">
                  Conducted By (Shift Lead)
                </label>
                <input
                  type="text"
                  value={conductedBy}
                  onChange={(e) => setConductedBy(e.target.value)}
                  placeholder="e.g. Chef Budi"
                  className="w-full px-3 py-1.5 text-xs bg-surface-elevated rounded-lg border border-border text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">
                  Audit Notes / Reason
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. End of Week Physical Count"
                  className="w-full px-3 py-1.5 text-xs bg-surface-elevated rounded-lg border border-border text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>

            {/* TOOLBAR */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Filter ingredients..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-surface-elevated rounded-lg border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSetAllToSystem}
                  className="px-3 py-1.5 text-xs font-medium bg-surface-elevated border border-border text-muted-foreground hover:text-foreground rounded-lg transition-colors"
                >
                  Pre-fill All with System Stock
                </button>
              </div>
            </div>

            {/* INGREDIENTS TABLE */}
            <div className="border border-border rounded-xl overflow-hidden">
              <table className="w-full text-xs text-left">
                <thead className="bg-surface-elevated text-muted-foreground font-semibold border-b border-border">
                  <tr>
                    <th className="py-2.5 px-3">Ingredient</th>
                    <th className="py-2.5 px-3">Category</th>
                    <th className="py-2.5 px-3 text-right">System Stock</th>
                    <th className="py-2.5 px-3 text-right w-40">Physical Count</th>
                    <th className="py-2.5 px-3 text-right">Variance Preview</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filtered.map((ing) => {
                    const enteredCount = counts[ing.ingredientId] ?? ing.currentStock;
                    const diff = enteredCount - ing.currentStock;

                    return (
                      <tr key={ing.ingredientId} className="hover:bg-surface-elevated/40">
                        <td className="py-2.5 px-3 font-semibold text-foreground">
                          {ing.ingredientName}
                          <span className="text-[10px] text-muted-foreground ml-1.5 font-normal">
                            ({ing.ingredientId})
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-muted-foreground">{ing.category}</td>
                        <td className="py-2.5 px-3 text-right font-mono text-muted-foreground">
                          {ing.currentStock} {ing.baseUnit}
                        </td>
                        <td className="py-2 px-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <input
                              type="number"
                              step="any"
                              value={enteredCount}
                              onChange={(e) => handleCountChange(ing.ingredientId, e.target.value)}
                              className="w-24 px-2 py-1 text-right text-xs bg-surface-elevated border border-border rounded font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                            />
                            <span className="text-muted-foreground text-[11px] w-6">{ing.baseUnit}</span>
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold">
                          {diff === 0 ? (
                            <span className="text-muted-foreground">0</span>
                          ) : diff > 0 ? (
                            <span className="text-emerald-600 dark:text-emerald-400">+{diff} {ing.baseUnit}</span>
                          ) : (
                            <span className="text-rose-600 dark:text-rose-400">{diff} {ing.baseUnit}</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* FOOTER ACTIONS */}
            <div className="flex items-center justify-between pt-3 border-t border-border">
              <span className="text-xs text-muted-foreground">
                Auditing {Object.keys(counts).length} of {ingredients.length} ingredients
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground bg-surface-elevated rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="px-5 py-2 text-xs font-semibold bg-primary text-primary-foreground rounded-xl flex items-center gap-1.5 disabled:opacity-50"
                >
                  {submitting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  Commit Stock Opname &amp; Calculate Variance
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
