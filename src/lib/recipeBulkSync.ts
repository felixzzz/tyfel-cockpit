import * as XLSX from 'xlsx';
import type {
  IngredientCategory,
  BaseUnit,
  ComponentRole,
  UpsertMasterIngredientInput,
  MasterIngredientRecord,
  RecipeCogsDetailRecord,
} from './recipesCogs';

export interface ParsedIngredientRow {
  ingredient_id: string;
  ingredient_name: string;
  category: IngredientCategory;
  supplier_name: string;
  purchase_unit_label: string;
  purchase_qty: number;
  base_unit: BaseUnit;
  purchase_price: number;
  yield_pct: number;
  is_new?: boolean;
  status: 'valid' | 'warning' | 'error';
  status_message?: string;
}

export interface ParsedBomLineRow {
  recipe_id: string;
  menu_item_name?: string;
  ingredient_id: string;
  ingredient_name?: string;
  component_role: ComponentRole;
  qty_per_serving: number;
  prep_notes: string;
  target_food_cost_pct?: number;
  status: 'valid' | 'warning' | 'error';
  status_message?: string;
}

export interface RecipeSyncParseResult {
  ingredients: ParsedIngredientRow[];
  recipeBoms: Array<{
    recipe_id: string;
    menu_item_name?: string;
    target_food_cost_pct?: number;
    lines: ParsedBomLineRow[];
  }>;
  summary: {
    totalIngredients: number;
    validIngredients: number;
    totalRecipes: number;
    validRecipes: number;
    totalBomLines: number;
    validBomLines: number;
    errorsCount: number;
    warningsCount: number;
  };
  warnings: string[];
  errors: string[];
}

export const ALLOWED_CATEGORIES: IngredientCategory[] = [
  'Coffee & Tea',
  'Dairy & Plant Milk',
  'Plant Proteins & Eggs',
  'Grains, Bread & Pasta',
  'Produce & Fungi',
  'Sauces, Oils & Sweeteners',
  'Packaging (Dine-In)',
  'Packaging (Delivery)',
];

export const ALLOWED_BASE_UNITS: BaseUnit[] = ['g', 'ml', 'pcs'];

export const ALLOWED_COMPONENT_ROLES: ComponentRole[] = [
  'food',
  'packaging_dine_in',
  'packaging_delivery',
];

/**
 * Sanitizes numeric string or number into a clean float (handles "Rp 150.000", "150,000", "150000.50").
 */
export function sanitizeNumericValue(val: unknown, fallback = 0): number {
  if (typeof val === 'number') {
    return isNaN(val) ? fallback : val;
  }
  if (!val) return fallback;

  let str = String(val).trim();
  // Strip currency symbols and whitespace
  str = str.replace(/^(rp|idr)\s*/i, '').trim();

  // If Indonesian style (e.g. 150.000,50), remove dots, replace comma with dot
  if (/^\d{1,3}(\.\d{3})+(,\d+)?$/.test(str)) {
    str = str.replace(/\./g, '').replace(',', '.');
  } else if (/^\d{1,3}(,\d{3})+(\.\d+)?$/.test(str)) {
    // English style (e.g. 150,000.50)
    str = str.replace(/,/g, '');
  } else if (str.includes(',') && !str.includes('.')) {
    str = str.replace(',', '.');
  }

  const parsed = parseFloat(str);
  return isNaN(parsed) ? fallback : parsed;
}

/**
 * Maps arbitrary category text from user spreadsheet to canonical IngredientCategory.
 */
export function normalizeCategory(raw: unknown): IngredientCategory {
  if (!raw) return 'Coffee & Tea';
  const str = String(raw).trim().toLowerCase();

  if (str.includes('grain') || str.includes('rice') || str.includes('beras') || str.includes('nasi') || str.includes('bread') || str.includes('roti') || str.includes('pasta') || str.includes('mie') || str.includes('noodle') || str.includes('tepung') || str.includes('oat')) {
    return 'Grains, Bread & Pasta';
  }
  if (str.includes('coffee') || str.includes('kopi') || str.includes('tea') || str.includes('teh') || str.includes('matcha') || (str.includes('jasmine') && !str.includes('rice') && !str.includes('beras'))) {
    return 'Coffee & Tea';
  }
  if (str.includes('dairy') || str.includes('milk') || str.includes('susu') || str.includes('cream')) {
    return 'Dairy & Plant Milk';
  }
  if (str.includes('protein') || str.includes('egg') || str.includes('telur') || str.includes('chicken') || str.includes('daging') || str.includes('ayam') || str.includes('patty')) {
    return 'Plant Proteins & Eggs';
  }
  if (str.includes('produce') || str.includes('sayur') || str.includes('buah') || str.includes('fruit') || str.includes('fungi') || str.includes('jamur')) {
    return 'Produce & Fungi';
  }
  if (str.includes('sauce') || str.includes('saus') || str.includes('oil') || str.includes('minyak') || str.includes('sugar') || str.includes('gula') || str.includes('sweet') || str.includes('sirup') || str.includes('syrup')) {
    return 'Sauces, Oils & Sweeteners';
  }
  if (str.includes('dine') || str.includes('cup dine') || str.includes('dine in')) {
    return 'Packaging (Dine-In)';
  }
  if (str.includes('deliv') || str.includes('takeaway') || str.includes('box') || str.includes('delivery')) {
    return 'Packaging (Delivery)';
  }
  if (str.includes('pack') || str.includes('kemas')) {
    return 'Packaging (Dine-In)';
  }

  return 'Coffee & Tea';
}

/**
 * Normalizes base units to 'g' | 'ml' | 'pcs'.
 */
export function normalizeBaseUnit(raw: unknown): BaseUnit {
  if (!raw) return 'g';
  const str = String(raw).trim().toLowerCase();
  if (str === 'g' || str === 'gr' || str === 'gram' || str === 'grams' || str === 'kg' || str === 'kilogram') {
    return 'g';
  }
  if (str === 'ml' || str === 'mili' || str === 'liter' || str === 'l') {
    return 'ml';
  }
  if (str === 'pcs' || str === 'pc' || str === 'buah' || str === 'lembar' || str === 'cup' || str === 'botol' || str === 'pack' || str === 'unit') {
    return 'pcs';
  }
  return 'g';
}

/**
 * Normalizes component role to 'food' | 'packaging_dine_in' | 'packaging_delivery'.
 */
export function normalizeComponentRole(raw: unknown): ComponentRole {
  if (!raw) return 'food';
  const str = String(raw).trim().toLowerCase();
  if (str.includes('dine') || str.includes('dine-in') || str.includes('dine_in')) {
    return 'packaging_dine_in';
  }
  if (str.includes('deliv') || str.includes('delivery') || str.includes('takeaway') || str.includes('bungkus')) {
    return 'packaging_delivery';
  }
  if (str.includes('pack') || str.includes('kemasan')) {
    return 'packaging_dine_in';
  }
  return 'food';
}

/**
 * Finds key in an object case-insensitively with alias support.
 */
function getField(row: Record<string, unknown>, aliases: string[]): unknown {
  const keys = Object.keys(row);
  for (const alias of aliases) {
    const target = alias.toLowerCase().replace(/[^a-z0-9]/g, '');
    const found = keys.find((k) => k.toLowerCase().replace(/[^a-z0-9]/g, '') === target);
    if (found !== undefined && row[found] !== undefined && row[found] !== null && String(row[found]).trim() !== '') {
      return row[found];
    }
  }
  return undefined;
}

/**
 * Parses an Excel Workbook (.xlsx) or CSV data into validated Ingredients & Recipe BOM structures.
 */
export function parseRecipeSyncWorkbook(
  data: Uint8Array | ArrayBuffer | string,
  existingIngredients: Array<{ ingredient_id: string; ingredient_name: string }> = [],
  existingRecipes: Array<{ recipe_id: string; item_name: string; canonical_name?: string }> = []
): RecipeSyncParseResult {
  const wb = typeof data === 'string'
    ? XLSX.read(data, { type: 'string' })
    : XLSX.read(data, { type: 'array' });

  const parsedIngredients: ParsedIngredientRow[] = [];
  const parsedBomLines: ParsedBomLineRow[] = [];
  const warnings: string[] = [];
  const errors: string[] = [];

  // Build lookups from existing data to assist smart matching
  const knownIngIdMap = new Map<string, string>();
  const knownIngNameMap = new Map<string, string>();
  for (const ing of existingIngredients) {
    knownIngIdMap.set(ing.ingredient_id.toLowerCase().trim(), ing.ingredient_id);
    knownIngNameMap.set(ing.ingredient_name.toLowerCase().trim(), ing.ingredient_id);
  }

  const knownRecipeIdMap = new Map<string, string>();
  const knownRecipeNameMap = new Map<string, string>();
  for (const rec of existingRecipes) {
    knownRecipeIdMap.set(rec.recipe_id.toLowerCase().trim(), rec.recipe_id);
    knownRecipeNameMap.set(rec.item_name.toLowerCase().trim(), rec.recipe_id);
    if (rec.canonical_name) {
      knownRecipeNameMap.set(rec.canonical_name.toLowerCase().trim(), rec.recipe_id);
    }
  }

  // 1. Identify Sheets: Look for ingredients sheet & recipes/bom sheet
  let ingSheetName: string | null = null;
  let bomSheetName: string | null = null;

  for (const sheetName of wb.SheetNames) {
    const lower = sheetName.toLowerCase();
    if (lower.includes('bahan') || lower.includes('ingredient')) {
      ingSheetName = sheetName;
    } else if (lower.includes('bom') || lower.includes('resep') || lower.includes('recipe')) {
      bomSheetName = sheetName;
    }
  }

  // Fallbacks if only 1 or 2 sheets without explicit keywords
  if (!ingSheetName && wb.SheetNames.length === 1) {
    // Check first row headers to determine sheet type
    const firstSheet = wb.Sheets[wb.SheetNames[0]];
    const previewRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(firstSheet, { range: 0, defval: '' });
    if (previewRows.length > 0) {
      const keys = Object.keys(previewRows[0]).join(' ').toLowerCase();
      if (keys.includes('recipe') || keys.includes('porsi') || keys.includes('bom') || keys.includes('serving')) {
        bomSheetName = wb.SheetNames[0];
      } else {
        ingSheetName = wb.SheetNames[0];
      }
    }
  } else if (!ingSheetName && wb.SheetNames.length > 0) {
    ingSheetName = wb.SheetNames[0];
    if (wb.SheetNames.length > 1 && !bomSheetName) {
      bomSheetName = wb.SheetNames[1];
    }
  }

  // 2. Parse Ingredients Sheet
  if (ingSheetName && wb.Sheets[ingSheetName]) {
    const ingRawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(wb.Sheets[ingSheetName], { defval: '' });
    for (let i = 0; i < ingRawRows.length; i++) {
      const r = ingRawRows[i];
      const name = String(getField(r, ['Nama Bahan Baku', 'Nama Bahan', 'ingredient_name', 'name', 'Nama']) || '').trim();
      if (!name) continue; // Skip empty row

      let id = String(getField(r, ['ID Bahan', 'ingredient_id', 'id', 'Kode Bahan']) || '').trim();
      const categoryRaw = getField(r, ['Kategori', 'category', 'Category']);
      const supplier = String(getField(r, ['Supplier', 'supplier_name', 'Vendor', 'Pemasok']) || 'Preferred Supplier').trim();
      const packLabel = String(getField(r, ['Kemasan Beli', 'purchase_unit_label', 'Satuan Beli', 'Pack Size']) || '1 Pack').trim();
      const packQty = sanitizeNumericValue(getField(r, ['Isi Kemasan', 'purchase_qty', 'Isi', 'Qty Pack']), 1);
      const baseUnit = normalizeBaseUnit(getField(r, ['Satuan Dasar', 'base_unit', 'Unit', 'Satuan']));
      const price = sanitizeNumericValue(getField(r, ['Harga Beli (Rp)', 'Harga Beli', 'purchase_price', 'Price', 'Harga']), 0);
      const yieldPct = sanitizeNumericValue(getField(r, ['Yield / Rendemen (%)', 'Yield (%)', 'yield_pct', 'Yield', 'Rendemen']), 100);

      // Auto-generate ID if empty or match existing by name
      const isNew = !id;
      if (!id) {
        const matchedExistingId = knownIngNameMap.get(name.toLowerCase());
        if (matchedExistingId) {
          id = matchedExistingId;
        } else {
          // Generate clean canonical ID from name
          const slug = name.toUpperCase().replace(/[^A-Z0-9]/g, '-').slice(0, 16);
          id = `ING-NEW-${slug}-${(i + 1).toString().padStart(2, '0')}`;
        }
      }

      // Record in local lookup so BOM parsing can resolve it
      knownIngIdMap.set(id.toLowerCase(), id);
      knownIngNameMap.set(name.toLowerCase(), id);

      let status: 'valid' | 'warning' | 'error' = 'valid';
      let status_message = 'Valid';

      if (price <= 0) {
        status = 'warning';
        status_message = 'Harga beli Rp 0, pastikan harga terisi agar kalkulasi COGS akurat';
        warnings.push(`Baris ${i + 2} (${name}): Harga beli Rp 0`);
      }

      parsedIngredients.push({
        ingredient_id: id,
        ingredient_name: name,
        category: normalizeCategory(categoryRaw),
        supplier_name: supplier,
        purchase_unit_label: packLabel,
        purchase_qty: Math.max(0.01, packQty),
        base_unit: baseUnit,
        purchase_price: Math.max(0, price),
        yield_pct: Math.min(100, Math.max(10, yieldPct)),
        is_new: isNew,
        status,
        status_message,
      });
    }
  }

  // 3. Parse Recipe BOM Sheet
  if (bomSheetName && wb.Sheets[bomSheetName]) {
    const bomRawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(wb.Sheets[bomSheetName], { defval: '' });
    for (let i = 0; i < bomRawRows.length; i++) {
      const r = bomRawRows[i];
      let recipeId = String(getField(r, ['ID Resep / Menu', 'ID Resep', 'recipe_id', 'Recipe ID', 'Kode Resep']) || '').trim();
      const menuName = String(getField(r, ['Nama Menu', 'menu_item_name', 'item_name', 'Menu Name', 'Menu']) || '').trim();

      if (!recipeId && !menuName) continue; // Skip empty row

      // If recipeId missing, resolve from menuName
      if (!recipeId && menuName) {
        const found = knownRecipeNameMap.get(menuName.toLowerCase());
        if (found) {
          recipeId = found;
        } else {
          recipeId = `REC-${menuName.toUpperCase().replace(/[^A-Z0-9]/g, '-').slice(0, 16)}`;
        }
      }

      let ingId = String(getField(r, ['ID Bahan', 'ingredient_id', 'Ingredient ID', 'Kode Bahan']) || '').trim();
      const ingName = String(getField(r, ['Nama Bahan', 'ingredient_name', 'Ingredient Name', 'Bahan']) || '').trim();

      // Resolve ingredientId from ingName if needed
      if (!ingId && ingName) {
        const resolved = knownIngNameMap.get(ingName.toLowerCase());
        if (resolved) {
          ingId = resolved;
        } else {
          // Check if starts with similar
          for (const [k, v] of knownIngNameMap.entries()) {
            if (k.includes(ingName.toLowerCase()) || ingName.toLowerCase().includes(k)) {
              ingId = v;
              break;
            }
          }
        }
      }

      const roleRaw = getField(r, ['Peran Komponen', 'component_role', 'Role', 'Peran']);
      const qtyServing = sanitizeNumericValue(getField(r, ['Takaran per Porsi', 'qty_per_serving', 'Gramasi', 'Qty', 'Takaran']), 0);
      const prepNotes = String(getField(r, ['Catatan Prep / Gramasi', 'prep_notes', 'Catatan', 'Notes']) || '').trim();
      const targetPctRaw = getField(r, ['Target Food Cost (%)', 'target_food_cost_pct', 'Target %']);
      const targetPct = targetPctRaw ? sanitizeNumericValue(targetPctRaw, 30) : undefined;

      let status: 'valid' | 'warning' | 'error' = 'valid';
      let status_message = 'Valid';

      if (!ingId) {
        status = 'error';
        status_message = `Bahan "${ingName || 'Unknown'}" tidak ditemukan di database maupun Sheet Bahan Baku`;
        errors.push(`Resep ${menuName || recipeId}: ${status_message}`);
      } else if (qtyServing <= 0) {
        status = 'warning';
        status_message = 'Takaran per porsi 0 atau belum diisi';
        warnings.push(`Resep ${menuName || recipeId} (${ingName || ingId}): Takaran 0`);
      }

      parsedBomLines.push({
        recipe_id: recipeId,
        menu_item_name: menuName,
        ingredient_id: ingId,
        ingredient_name: ingName,
        component_role: normalizeComponentRole(roleRaw),
        qty_per_serving: qtyServing,
        prep_notes: prepNotes,
        target_food_cost_pct: targetPct,
        status,
        status_message,
      });
    }
  }

  // Group BOM lines by recipe_id
  const recipeGroupMap = new Map<string, {
    recipe_id: string;
    menu_item_name?: string;
    target_food_cost_pct?: number;
    lines: ParsedBomLineRow[];
  }>();

  for (const line of parsedBomLines) {
    let group = recipeGroupMap.get(line.recipe_id);
    if (!group) {
      group = {
        recipe_id: line.recipe_id,
        menu_item_name: line.menu_item_name,
        target_food_cost_pct: line.target_food_cost_pct,
        lines: [],
      };
      recipeGroupMap.set(line.recipe_id, group);
    }
    if (line.target_food_cost_pct && !group.target_food_cost_pct) {
      group.target_food_cost_pct = line.target_food_cost_pct;
    }
    group.lines.push(line);
  }

  const recipeBoms = Array.from(recipeGroupMap.values());

  const validIngredients = parsedIngredients.filter((i) => i.status !== 'error').length;
  const validBomLines = parsedBomLines.filter((l) => l.status !== 'error').length;
  const validRecipes = recipeBoms.filter((r) => r.lines.some((l) => l.status !== 'error')).length;

  return {
    ingredients: parsedIngredients,
    recipeBoms,
    summary: {
      totalIngredients: parsedIngredients.length,
      validIngredients,
      totalRecipes: recipeBoms.length,
      validRecipes,
      totalBomLines: parsedBomLines.length,
      validBomLines,
      errorsCount: errors.length,
      warningsCount: warnings.length,
    },
    warnings,
    errors,
  };
}

/**
 * Creates a downloadable Excel (.xlsx) workbook containing:
 * 1. Current or Template Master Ingredients
 * 2. Current or Template Recipe BOMs
 * 3. Instructions & Guidelines Sheet
 */
export function generateRecipesExportWorkbook(
  ingredients: MasterIngredientRecord[] | UpsertMasterIngredientInput[],
  recipes: RecipeCogsDetailRecord[]
): XLSX.WorkBook {
  const wb = XLSX.utils.book_new();

  // 1. Sheet 1: Master_Ingredients
  const ingRows = ingredients.map((ing) => ({
    'ID Bahan': ing.ingredient_id || '',
    'Nama Bahan Baku': ing.ingredient_name,
    'Kategori': ing.category,
    'Supplier': ing.supplier_name,
    'Kemasan Beli': ing.purchase_unit_label,
    'Isi Kemasan': ing.purchase_qty,
    'Satuan Dasar': ing.base_unit,
    'Harga Beli (Rp)': ing.purchase_price,
    'Yield / Rendemen (%)': ing.yield_pct,
  }));
  const wsIng = XLSX.utils.json_to_sheet(ingRows);
  XLSX.utils.book_append_sheet(wb, wsIng, 'Master_Ingredients');

  // 2. Sheet 2: Recipe_BOMs
  const bomRows: Array<Record<string, unknown>> = [];
  for (const rec of recipes) {
    if (rec.lines && rec.lines.length > 0) {
      for (const ln of rec.lines) {
        bomRows.push({
          'ID Resep / Menu': rec.recipe_id,
          'Nama Menu': rec.item_name,
          'ID Bahan': ln.ingredient_id,
          'Nama Bahan': ln.ingredient_name,
          'Peran Komponen': ln.component_role,
          'Takaran per Porsi': ln.qty_per_serving,
          'Catatan Prep / Gramasi': ln.prep_notes || '',
          'Target Food Cost (%)': rec.target_food_cost_pct || 30,
        });
      }
    } else {
      // Unmapped / empty placeholder row for editing
      bomRows.push({
        'ID Resep / Menu': rec.recipe_id,
        'Nama Menu': rec.item_name,
        'ID Bahan': '',
        'Nama Bahan': '',
        'Peran Komponen': 'food',
        'Takaran per Porsi': 0,
        'Catatan Prep / Gramasi': 'BOM belum di-mapping',
        'Target Food Cost (%)': rec.target_food_cost_pct || 30,
      });
    }
  }
  const wsBom = XLSX.utils.json_to_sheet(bomRows);
  XLSX.utils.book_append_sheet(wb, wsBom, 'Recipe_BOMs');

  // 3. Sheet 3: Petunjuk_Pengisian
  const guideRows = [
    {
      'Topik / Panduan': 'Penyesuaian Nama Bahan Baku',
      'Aturan & Contoh':
        'Bila ingin mengganti nama bahan baku, pertahankan "ID Bahan" (misal ING-ESP-HOUSE) dan ubah "Nama Bahan Baku". Semua resep yang memakai ID tersebut akan otomatis ter-update namanya tanpa merusak relasi resep.',
    },
    {
      'Topik / Panduan': 'Menambahkan Bahan Baku Baru',
      'Aturan & Contoh':
        'Kosongkan kolom "ID Bahan" atau buat ID unik diawali ING- (misal ING-SUSU-OAT). Sistem akan otomatis membuatkan ID bila dikosongkan.',
    },
    {
      'Topik / Panduan': 'Satuan Dasar yang Diizinkan',
      'Aturan & Contoh':
        'Hanya isi dengan: "g" (gram untuk padatan/bubuk), "ml" (mililiter untuk cairan), atau "pcs" (buah/cup/tutup/sedotan/box).',
    },
    {
      'Topik / Panduan': 'Kategori Bahan yang Diizinkan',
      'Aturan & Contoh':
        ALLOWED_CATEGORIES.join(', '),
    },
    {
      'Topik / Panduan': 'Peran Komponen di Recipe_BOMs',
      'Aturan & Contoh':
        '"food" (makanan/minuman inti), "packaging_dine_in" (kemasan/alat saji dine in), "packaging_delivery" (box/seal/paper bag takeaway delivery).',
    },
    {
      'Topik / Panduan': 'Yield / Rendemen (%)',
      'Aturan & Contoh':
        'Persentase bagian yang terpakai setelah trimming/cooking loss. Standard: 100% (tidak ada susut), 90% (susut 10%), dsb.',
    },
  ];
  const wsGuide = XLSX.utils.json_to_sheet(guideRows);
  XLSX.utils.book_append_sheet(wb, wsGuide, 'Petunjuk_Pengisian');

  return wb;
}

/**
 * Creates a clean starter template Excel (.xlsx) workbook for new setups.
 */
export function generateStarterTemplateWorkbook(): XLSX.WorkBook {
  const wb = XLSX.utils.book_new();

  const starterIngredients = [
    {
      'ID Bahan': 'ING-ESP-HOUSE',
      'Nama Bahan Baku': 'Espresso House Blend 50:50 (Arabika Robusta)',
      'Kategori': 'Coffee & Tea',
      'Supplier': 'Supplier Kopi Utama',
      'Kemasan Beli': '1,000 gr Bag',
      'Isi Kemasan': 1000,
      'Satuan Dasar': 'g',
      'Harga Beli (Rp)': 175000,
      'Yield / Rendemen (%)': 100,
    },
    {
      'ID Bahan': 'ING-MILK-FRESH',
      'Nama Bahan Baku': 'Fresh Milk UHT Full Cream',
      'Kategori': 'Dairy & Plant Milk',
      'Supplier': 'Distributor Susu',
      'Kemasan Beli': '1,000 ml Karton',
      'Isi Kemasan': 1000,
      'Satuan Dasar': 'ml',
      'Harga Beli (Rp)': 19500,
      'Yield / Rendemen (%)': 100,
    },
    {
      'ID Bahan': 'ING-PKG-CUP-16OZ',
      'Nama Bahan Baku': 'Plastic Cup 16oz + Strawless Lid',
      'Kategori': 'Packaging (Dine-In)',
      'Supplier': 'Packaging Indo',
      'Kemasan Beli': '50 pcs Pack',
      'Isi Kemasan': 50,
      'Satuan Dasar': 'pcs',
      'Harga Beli (Rp)': 37500,
      'Yield / Rendemen (%)': 100,
    },
  ];
  const wsIng = XLSX.utils.json_to_sheet(starterIngredients);
  XLSX.utils.book_append_sheet(wb, wsIng, 'Master_Ingredients');

  const starterBoms = [
    {
      'ID Resep / Menu': 'REC-LATTE-01',
      'Nama Menu': 'Iced Cafe Latte 16oz',
      'ID Bahan': 'ING-ESP-HOUSE',
      'Nama Bahan': 'Espresso House Blend 50:50 (Arabika Robusta)',
      'Peran Komponen': 'food',
      'Takaran per Porsi': 18,
      'Catatan Prep / Gramasi': 'Double shot extraction',
      'Target Food Cost (%)': 28,
    },
    {
      'ID Resep / Menu': 'REC-LATTE-01',
      'Nama Menu': 'Iced Cafe Latte 16oz',
      'ID Bahan': 'ING-MILK-FRESH',
      'Nama Bahan': 'Fresh Milk UHT Full Cream',
      'Peran Komponen': 'food',
      'Takaran per Porsi': 140,
      'Catatan Prep / Gramasi': 'Chilled fresh milk',
      'Target Food Cost (%)': 28,
    },
    {
      'ID Resep / Menu': 'REC-LATTE-01',
      'Nama Menu': 'Iced Cafe Latte 16oz',
      'ID Bahan': 'ING-PKG-CUP-16OZ',
      'Nama Bahan': 'Plastic Cup 16oz + Strawless Lid',
      'Peran Komponen': 'packaging_dine_in',
      'Takaran per Porsi': 1,
      'Catatan Prep / Gramasi': '1 cup + 1 lid',
      'Target Food Cost (%)': 28,
    },
  ];
  const wsBom = XLSX.utils.json_to_sheet(starterBoms);
  XLSX.utils.book_append_sheet(wb, wsBom, 'Recipe_BOMs');

  const guideRows = [
    {
      'Topik / Panduan': 'Format Satuan Dasar',
      'Aturan & Contoh': 'Gunakan "g" untuk gram, "ml" untuk mililiter, "pcs" untuk buah/satuan.',
    },
    {
      'Topik / Panduan': 'Kategori yang Tersedia',
      'Aturan & Contoh': ALLOWED_CATEGORIES.join(', '),
    },
    {
      'Topik / Panduan': 'Peran Komponen',
      'Aturan & Contoh': 'food (makanan/minuman), packaging_dine_in (dine in), packaging_delivery (takeaway).',
    },
  ];
  const wsGuide = XLSX.utils.json_to_sheet(guideRows);
  XLSX.utils.book_append_sheet(wb, wsGuide, 'Petunjuk_Pengisian');

  return wb;
}
