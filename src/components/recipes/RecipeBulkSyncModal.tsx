'use client';

import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import {
  FileSpreadsheet,
  Upload,
  Download,
  CheckCircle2,
  AlertTriangle,
  X,
  FileCheck,
  RefreshCw,
  Layers,
  Sparkles,
  Info,
  HelpCircle,
} from 'lucide-react';
import {
  parseRecipeSyncWorkbook,
  generateRecipesExportWorkbook,
  generateStarterTemplateWorkbook,
  type RecipeSyncParseResult,
} from '@/lib/recipeBulkSync';
import type {
  MasterIngredientRecord,
  RecipeCogsDetailRecord,
} from '@/lib/recipesCogs';

interface RecipeBulkSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  currentIngredients: MasterIngredientRecord[];
  currentRecipes: RecipeCogsDetailRecord[];
  showNotice: (type: 'success' | 'error', text: string) => void;
}

export function RecipeBulkSyncModal({
  isOpen,
  onClose,
  onSuccess,
  currentIngredients,
  currentRecipes,
  showNotice,
}: RecipeBulkSyncModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<'upload' | 'preview_ing' | 'preview_bom' | 'guide'>('upload');
  const [fileName, setFileName] = useState<string | null>(null);
  const [parseResult, setParseResult] = useState<RecipeSyncParseResult | null>(null);
  const [parsing, setParsing] = useState<boolean>(false);
  const [applying, setApplying] = useState<boolean>(false);

  // Import options
  const [importIngredients, setImportIngredients] = useState<boolean>(true);
  const [importBoms, setImportBoms] = useState<boolean>(true);

  if (!isOpen) return null;

  // Handle Export Current Snapshot
  const handleExportCurrentData = () => {
    try {
      const wb = generateRecipesExportWorkbook(currentIngredients, currentRecipes);
      const dateStr = new Date().toISOString().slice(0, 10);
      XLSX.writeFile(wb, `Tyfel_Master_Recipes_and_Ingredients_${dateStr}.xlsx`);
      showNotice('success', 'File Excel data riil berhasil diunduh. Anda dapat langsung mengeditnya dan upload kembali.');
    } catch (err) {
      showNotice('error', err instanceof Error ? err.message : 'Gagal mengekspor file Excel');
    }
  };

  // Handle Download Blank Template
  const handleDownloadTemplate = () => {
    try {
      const wb = generateStarterTemplateWorkbook();
      XLSX.writeFile(wb, 'Template_Master_Resep_dan_Bahan_Baku.xlsx');
      showNotice('success', 'Template Excel kosong berhasil diunduh.');
    } catch (err) {
      showNotice('error', err instanceof Error ? err.message : 'Gagal mengunduh template');
    }
  };

  // Handle File Selection
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setParsing(true);
    setFileName(file.name);

    try {
      const buffer = await file.arrayBuffer();
      const existingIngList = currentIngredients.map((i) => ({
        ingredient_id: i.ingredient_id,
        ingredient_name: i.ingredient_name,
      }));
      const existingRecList = currentRecipes.map((r) => ({
        recipe_id: r.recipe_id,
        item_name: r.item_name,
        canonical_name: r.canonical_name,
      }));

      const parsed = parseRecipeSyncWorkbook(new Uint8Array(buffer), existingIngList, existingRecList);
      setParseResult(parsed);

      if (parsed.ingredients.length > 0) {
        setActiveTab('preview_ing');
      } else if (parsed.recipeBoms.length > 0) {
        setActiveTab('preview_bom');
      }

      if (parsed.errors.length > 0) {
        showNotice('error', `Ditemukan ${parsed.errors.length} baris tidak valid pada file.`);
      } else {
        showNotice(
          'success',
          `Berhasil membaca ${parsed.summary.validIngredients} bahan baku dan ${parsed.summary.validRecipes} resep dari file.`
        );
      }
    } catch (err) {
      showNotice('error', err instanceof Error ? err.message : 'Format file tidak dapat dibaca');
      setParseResult(null);
    } finally {
      setParsing(false);
    }
  };

  // Handle Apply Sync to Database
  const handleApplySync = async () => {
    if (!parseResult) return;

    const ingredientsPayload = importIngredients
      ? parseResult.ingredients
          .filter((i) => i.status !== 'error')
          .map((i) => ({
            ingredient_id: i.ingredient_id,
            ingredient_name: i.ingredient_name,
            category: i.category,
            supplier_name: i.supplier_name,
            purchase_unit_label: i.purchase_unit_label,
            purchase_qty: i.purchase_qty,
            base_unit: i.base_unit,
            purchase_price: i.purchase_price,
            yield_pct: i.yield_pct,
          }))
      : undefined;

    const recipesPayload = importBoms
      ? parseResult.recipeBoms
          .filter((r) => r.lines.some((l) => l.status !== 'error'))
          .map((r) => ({
            recipe_id: r.recipe_id,
            target_food_cost_pct: r.target_food_cost_pct,
            lines: r.lines
              .filter((l) => l.status !== 'error')
              .map((l) => ({
                ingredient_id: l.ingredient_id,
                component_role: l.component_role,
                qty_per_serving: l.qty_per_serving,
                prep_notes: l.prep_notes,
              })),
          }))
      : undefined;

    if (!ingredientsPayload && !recipesPayload) {
      showNotice('error', 'Pilih setidaknya satu opsi data untuk disinkronkan.');
      return;
    }

    setApplying(true);
    try {
      const res = await fetch('/api/recipes/cogs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'bulk_sync',
          ingredients: ingredientsPayload,
          recipes: recipesPayload,
        }),
      });

      const json = await res.json();
      if (!json.ok) {
        throw new Error(json.error || 'Gagal menyimpan sinkronisasi massal');
      }

      showNotice('success', json.message || 'Sinkronisasi massal berhasil diterapkan.');
      onSuccess();
      onClose();
    } catch (err) {
      showNotice('error', err instanceof Error ? err.message : 'Terjadi kesalahan saat menyimpan data');
    } finally {
      setApplying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-2xl shadow-2xl max-w-5xl w-full max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[var(--border-subtle)] flex items-center justify-between gap-4 bg-[var(--bg-surface-2)] shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-[var(--text-primary)] font-display flex items-center gap-2">
                <span>Bulk Sync Resep & Bahan Baku (Excel / CSV)</span>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] border border-[var(--accent-primary)]/20">
                  Dual-Sheet Ingest
                </span>
              </h2>
              <p className="text-xs text-[var(--text-secondary)]">
                Sinkronkan nama bahan baku, harga beli, kemasan, dan takaran porsi (BOM) riil sekaligus.
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

        {/* Modal Navigation & Quick Export Bar */}
        <div className="px-5 py-3 border-b border-[var(--border-subtle)] bg-[var(--bg-surface)] flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="inline-flex p-1 rounded-xl bg-[var(--bg-surface-2)] border border-[var(--border-default)] text-xs font-semibold">
            <button
              type="button"
              onClick={() => setActiveTab('upload')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeTab === 'upload'
                  ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-xs'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              1. Upload & Sumber File
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('preview_ing')}
              disabled={!parseResult}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-40 ${
                activeTab === 'preview_ing'
                  ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-xs'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              <span>2. Bahan Baku</span>
              {parseResult && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-500/10 text-emerald-600 font-mono">
                  {parseResult.summary.validIngredients}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('preview_bom')}
              disabled={!parseResult}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-40 ${
                activeTab === 'preview_bom'
                  ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-xs'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              <span>3. Resep & BOM</span>
              {parseResult && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] font-mono">
                  {parseResult.summary.validRecipes}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('guide')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                activeTab === 'guide'
                  ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-xs'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Panduan Format</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportCurrentData}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[var(--bg-surface-2)] hover:bg-[var(--bg-surface-3)] text-[var(--text-primary)] border border-[var(--border-default)] transition-all cursor-pointer"
              title="Unduh snapshot seluruh bahan & resep riil saat ini ke file Excel"
            >
              <Download className="w-3.5 h-3.5 text-emerald-500" />
              <span>Export Data Riil (.xlsx)</span>
            </button>
            <button
              type="button"
              onClick={handleDownloadTemplate}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[var(--bg-surface-2)] hover:bg-[var(--bg-surface-3)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-subtle)] transition-all cursor-pointer"
              title="Unduh file template kosong dengan contoh format"
            >
              <FileCheck className="w-3.5 h-3.5 text-blue-500" />
              <span>Download Template Kosong</span>
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 flex-1 overflow-y-auto space-y-5">
          {/* TAB 1: UPLOAD & SOURCE */}
          {activeTab === 'upload' && (
            <div className="space-y-5">
              {/* Recommended Workflow Guide Box */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-[var(--accent-primary)]/5 via-transparent to-emerald-500/5 border border-[var(--border-default)] flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-[var(--accent-primary)] shrink-0 mt-0.5" />
                <div className="space-y-1 text-xs">
                  <p className="font-semibold text-[var(--text-primary)]">
                    Alur Praktis Mencocokkan Resep Riil:
                  </p>
                  <ol className="list-decimal list-inside space-y-0.5 text-[var(--text-secondary)] leading-relaxed">
                    <li>Klik <strong>&quot;Export Data Riil (.xlsx)&quot;</strong> di atas untuk mengunduh seluruh database saat ini ke Excel.</li>
                    <li>Buka di Excel/Spreadsheet. Ubah nama bahan baku, harga beli, atau takaran gram/ml per porsi sesuai resep dapur Anda.</li>
                    <li>Simpan file Excel, lalu drag &amp; drop file tersebut ke area upload di bawah.</li>
                    <li>Sistem akan memvalidasi data dan otomatis menghitung ulang seluruh HPP (COGS) menu Anda!</li>
                  </ol>
                </div>
              </div>

              {/* Upload Dropzone */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-8 text-center flex flex-col items-center justify-center gap-3 transition-all cursor-pointer ${
                  fileName
                    ? 'border-emerald-500/50 bg-emerald-500/5 hover:bg-emerald-500/10'
                    : 'border-[var(--border-default)] bg-[var(--bg-surface-2)] hover:bg-[var(--bg-surface-3)] hover:border-[var(--accent-primary)]/50'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <div className="p-3.5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-default)] shadow-xs">
                  {parsing ? (
                    <RefreshCw className="w-8 h-8 text-[var(--accent-primary)] animate-spin" />
                  ) : fileName ? (
                    <FileCheck className="w-8 h-8 text-emerald-500" />
                  ) : (
                    <Upload className="w-8 h-8 text-[var(--text-muted)]" />
                  )}
                </div>

                <div>
                  <p className="text-sm font-semibold text-[var(--text-primary)]">
                    {fileName ? fileName : 'Pilih atau Tarik File Excel (.xlsx) / CSV ke Sini'}
                  </p>
                  <p className="text-xs text-[var(--text-muted)] mt-1">
                    Mendukung file Excel multi-sheet (Master_Ingredients + Recipe_BOMs) atau CSV tunggal
                  </p>
                </div>
              </div>

              {/* Parse Summary Cards if file parsed */}
              {parseResult && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="p-3.5 rounded-xl bg-[var(--bg-surface-2)] border border-[var(--border-default)]">
                      <p className="text-xs text-[var(--text-muted)]">Bahan Baku Terdeteksi</p>
                      <p className="text-xl font-bold font-mono text-[var(--text-primary)] mt-0.5">
                        {parseResult.summary.validIngredients}{' '}
                        <span className="text-xs font-normal text-[var(--text-secondary)]">item</span>
                      </p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-[var(--bg-surface-2)] border border-[var(--border-default)]">
                      <p className="text-xs text-[var(--text-muted)]">Resep Terdeteksi</p>
                      <p className="text-xl font-bold font-mono text-[var(--text-primary)] mt-0.5">
                        {parseResult.summary.validRecipes}{' '}
                        <span className="text-xs font-normal text-[var(--text-secondary)]">
                          resep ({parseResult.summary.validBomLines} baris)
                        </span>
                      </p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-[var(--bg-surface-2)] border border-[var(--border-default)]">
                      <p className="text-xs text-[var(--text-muted)]">Status Validasi</p>
                      <div className="flex items-center gap-1.5 mt-1 font-semibold text-xs">
                        {parseResult.errors.length === 0 ? (
                          <>
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                            <span className="text-emerald-600 dark:text-emerald-400">Siap Diterapkan</span>
                          </>
                        ) : (
                          <>
                            <AlertTriangle className="w-4 h-4 text-rose-500" />
                            <span className="text-rose-600 dark:text-rose-400">
                              {parseResult.errors.length} Baris Bermasalah
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Sync Options Checkboxes */}
                  <div className="p-3.5 rounded-xl bg-[var(--bg-surface-2)] border border-[var(--border-default)] flex flex-wrap items-center gap-6 text-xs font-semibold">
                    <label className="flex items-center gap-2 cursor-pointer text-[var(--text-primary)]">
                      <input
                        type="checkbox"
                        checked={importIngredients}
                        onChange={(e) => setImportIngredients(e.target.checked)}
                        className="rounded border-[var(--border-default)] text-[var(--accent-primary)] focus:ring-0"
                      />
                      <span>Sinkronkan Master Bahan Baku ({parseResult.summary.validIngredients} item)</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer text-[var(--text-primary)]">
                      <input
                        type="checkbox"
                        checked={importBoms}
                        onChange={(e) => setImportBoms(e.target.checked)}
                        className="rounded border-[var(--border-default)] text-[var(--accent-primary)] focus:ring-0"
                      />
                      <span>Sinkronkan Recipe BOMs ({parseResult.summary.validRecipes} resep)</span>
                    </label>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: PREVIEW INGREDIENTS */}
          {activeTab === 'preview_ing' && parseResult && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-[var(--text-secondary)]">
                <span>Menampilkan {parseResult.ingredients.length} data bahan baku dari file:</span>
                <span className="font-mono">
                  {parseResult.ingredients.filter((i) => i.is_new).length} item baru
                </span>
              </div>

              <div className="border border-[var(--border-default)] rounded-xl overflow-hidden max-h-96 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[var(--bg-surface-2)] border-b border-[var(--border-subtle)] text-[var(--text-secondary)] sticky top-0">
                    <tr>
                      <th className="py-2.5 px-3 font-semibold">ID Bahan</th>
                      <th className="py-2.5 px-3 font-semibold">Nama Bahan Baku</th>
                      <th className="py-2.5 px-3 font-semibold">Kategori</th>
                      <th className="py-2.5 px-3 font-semibold text-right">Kemasan Beli</th>
                      <th className="py-2.5 px-3 font-semibold text-center">Unit</th>
                      <th className="py-2.5 px-3 font-semibold text-right">Harga Beli</th>
                      <th className="py-2.5 px-3 font-semibold text-right">Yield %</th>
                      <th className="py-2.5 px-3 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border-subtle)]">
                    {parseResult.ingredients.map((ing, idx) => (
                      <tr
                        key={ing.ingredient_id || idx}
                        className={`hover:bg-[var(--bg-surface-2)] transition-colors ${
                          ing.status === 'warning' ? 'bg-amber-500/5' : ''
                        }`}
                      >
                        <td className="py-2 px-3 font-mono text-[11px] font-medium text-[var(--text-muted)]">
                          {ing.ingredient_id}
                        </td>
                        <td className="py-2 px-3 font-medium text-[var(--text-primary)]">
                          {ing.ingredient_name}
                        </td>
                        <td className="py-2 px-3 text-[var(--text-secondary)]">
                          {ing.category}
                        </td>
                        <td className="py-2 px-3 text-right font-mono text-[var(--text-secondary)]">
                          {ing.purchase_qty.toLocaleString()} {ing.base_unit} ({ing.purchase_unit_label})
                        </td>
                        <td className="py-2 px-3 text-center font-mono font-semibold uppercase text-[var(--accent-primary)]">
                          {ing.base_unit}
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-semibold text-[var(--text-primary)]">
                          Rp {ing.purchase_price.toLocaleString()}
                        </td>
                        <td className="py-2 px-3 text-right font-mono text-[var(--text-secondary)]">
                          {ing.yield_pct}%
                        </td>
                        <td className="py-2 px-3">
                          {ing.is_new ? (
                            <span className="px-1.5 py-0.5 rounded text-[10px] bg-blue-500/10 text-blue-600 font-semibold">
                              Baru
                            </span>
                          ) : ing.status === 'warning' ? (
                            <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-500/10 text-amber-600 font-semibold" title={ing.status_message}>
                              Peringatan
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-500/10 text-emerald-600 font-semibold">
                              Valid
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: PREVIEW RECIPE BOMS */}
          {activeTab === 'preview_bom' && parseResult && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-[var(--text-secondary)]">
                <span>Menampilkan {parseResult.recipeBoms.length} resep ({parseResult.summary.validBomLines} baris takaran):</span>
              </div>

              <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                {parseResult.recipeBoms.map((rec) => (
                  <div
                    key={rec.recipe_id}
                    className="p-3.5 rounded-xl bg-[var(--bg-surface-2)] border border-[var(--border-default)] space-y-2.5"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border-subtle)] pb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-[var(--accent-primary)]">
                          {rec.recipe_id}
                        </span>
                        <span className="text-xs font-bold text-[var(--text-primary)]">
                          {rec.menu_item_name || 'Menu Resep'}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs">
                        {rec.target_food_cost_pct && (
                          <span className="text-[var(--text-muted)]">
                            Target Food Cost: <strong>{rec.target_food_cost_pct}%</strong>
                          </span>
                        )}
                        <span className="px-2 py-0.5 rounded-full text-[10px] bg-[var(--bg-surface-3)] font-mono text-[var(--text-secondary)]">
                          {rec.lines.length} bahan
                        </span>
                      </div>
                    </div>

                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="text-[var(--text-muted)] text-[11px]">
                          <th className="py-1">Bahan Baku</th>
                          <th className="py-1">Peran</th>
                          <th className="py-1 text-right">Takaran/Porsi</th>
                          <th className="py-1 pl-3">Catatan Prep</th>
                          <th className="py-1 text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--border-subtle)]">
                        {rec.lines.map((ln, lIdx) => (
                          <tr key={lIdx} className="hover:bg-[var(--bg-surface-3)]/50">
                            <td className="py-1.5 font-medium text-[var(--text-primary)]">
                              {ln.ingredient_name || ln.ingredient_id}
                            </td>
                            <td className="py-1.5 text-[var(--text-secondary)]">
                              <span
                                className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                                  ln.component_role === 'food'
                                    ? 'bg-amber-500/10 text-amber-600'
                                    : ln.component_role === 'packaging_dine_in'
                                    ? 'bg-blue-500/10 text-blue-600'
                                    : 'bg-purple-500/10 text-purple-600'
                                }`}
                              >
                                {ln.component_role}
                              </span>
                            </td>
                            <td className="py-1.5 text-right font-mono font-semibold text-[var(--text-primary)]">
                              {ln.qty_per_serving}
                            </td>
                            <td className="py-1.5 pl-3 text-[var(--text-muted)] text-[11px] truncate max-w-[200px]">
                              {ln.prep_notes || '-'}
                            </td>
                            <td className="py-1.5 text-right">
                              {ln.status === 'valid' ? (
                                <span className="text-[10px] text-emerald-600 font-semibold">OK</span>
                              ) : (
                                <span className="text-[10px] text-rose-500 font-semibold" title={ln.status_message}>
                                  Error
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: FORMAT GUIDE */}
          {activeTab === 'guide' && (
            <div className="space-y-4 text-xs leading-relaxed">
              <div className="p-4 rounded-xl bg-[var(--bg-surface-2)] border border-[var(--border-default)] space-y-2">
                <h3 className="font-bold text-[var(--text-primary)] flex items-center gap-2">
                  <Info className="w-4 h-4 text-blue-500" />
                  <span>Prinsip Penting: Menyesuaikan Nama Bahan Baku Tanpa Merusak Resep</span>
                </h3>
                <p className="text-[var(--text-secondary)]">
                  Di database sistem, setiap bahan baku diikat oleh <strong>ID Bahan</strong> (misal <code>ING-ESP-HOUSE</code>).
                  Jika Anda ingin menyesuaikan nama (misalnya mengganti dari &quot;Espresso Roast Blend&quot; menjadi &quot;Arabika House Blend Gayo 1kg&quot;),
                  <strong>pertahankan ID Bahan tersebut</strong> di Excel dan cukup ganti kolom <strong>Nama Bahan Baku</strong>.
                </p>
                <p className="text-[var(--text-secondary)]">
                  Semua resep menu yang sudah ada akan otomatis menampilkan nama baru tersebut tanpa perlu di-mapping ulang!
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-[var(--bg-surface-2)] border border-[var(--border-default)] space-y-2">
                  <h4 className="font-semibold text-[var(--text-primary)]">Satuan Dasar yang Sah</h4>
                  <ul className="list-disc list-inside space-y-1 text-[var(--text-secondary)] font-mono">
                    <li><strong>g</strong> : Gram (untuk padatan, bubuk, kopi, beras, daging)</li>
                    <li><strong>ml</strong> : Mililiter (untuk cairan, susu, sirup, saus, minyak)</li>
                    <li><strong>pcs</strong> : Satuan buah (untuk paper cup, tutup, sedotan, box)</li>
                  </ul>
                </div>

                <div className="p-4 rounded-xl bg-[var(--bg-surface-2)] border border-[var(--border-default)] space-y-2">
                  <h4 className="font-semibold text-[var(--text-primary)]">Peran Komponen (BOM Role)</h4>
                  <ul className="list-disc list-inside space-y-1 text-[var(--text-secondary)]">
                    <li><strong className="font-mono">food</strong> : Bahan makanan / minuman utama</li>
                    <li><strong className="font-mono">packaging_dine_in</strong> : Cup saji, alas kertas, alat makan dine-in</li>
                    <li><strong className="font-mono">packaging_delivery</strong> : Box kraft, paper bag, seal takeaway</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-4 border-t border-[var(--border-subtle)] bg-[var(--bg-surface-2)] flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-[var(--text-muted)] flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-[var(--accent-primary)]" />
            <span>Kalkulasi COGS &amp; Gross Margin % otomatis disinkronkan ke seluruh menu.</span>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={applying}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-3)] border border-[var(--border-subtle)] transition-all cursor-pointer"
            >
              Tutup
            </button>

            <button
              type="button"
              onClick={handleApplySync}
              disabled={!parseResult || applying || (parseResult.summary.validIngredients === 0 && parseResult.summary.validRecipes === 0)}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-semibold bg-[var(--accent-primary)] text-white shadow-xs hover:opacity-95 transition-all cursor-pointer disabled:opacity-50"
            >
              {applying ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Menerapkan Sinkronisasi...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Terapkan Sinkronisasi Massal</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
