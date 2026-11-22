import { describe, it, expect } from 'vitest';
import * as XLSX from 'xlsx';
import {
  sanitizeNumericValue,
  normalizeCategory,
  normalizeBaseUnit,
  normalizeComponentRole,
  parseRecipeSyncWorkbook,
  generateStarterTemplateWorkbook,
  generateRecipesExportWorkbook,
} from '../recipeBulkSync';

describe('Recipe Bulk Sync - Parser & Sanitizer', () => {
  it('correctly sanitizes numeric values with Indonesian currency and punctuation', () => {
    expect(sanitizeNumericValue('Rp 175.000')).toBe(175000);
    expect(sanitizeNumericValue('IDR 250.500')).toBe(250500);
    expect(sanitizeNumericValue('150000.50')).toBe(150000.5);
    expect(sanitizeNumericValue('1,250.75')).toBe(1250.75);
    expect(sanitizeNumericValue('18,5')).toBe(18.5);
    expect(sanitizeNumericValue(null, 10)).toBe(10);
    expect(sanitizeNumericValue(undefined, 0)).toBe(0);
  });

  it('normalizes categories and units accurately', () => {
    expect(normalizeCategory('kopi house blend')).toBe('Coffee & Tea');
    expect(normalizeCategory('Fresh Milk')).toBe('Dairy & Plant Milk');
    expect(normalizeCategory('Ayam Fillet')).toBe('Plant Proteins & Eggs');
    expect(normalizeCategory('Beras Jasmine')).toBe('Grains, Bread & Pasta');
    expect(normalizeCategory('Jamur Portobello')).toBe('Produce & Fungi');
    expect(normalizeCategory('Sirup Karamel')).toBe('Sauces, Oils & Sweeteners');
    expect(normalizeCategory('Paper Cup Dine In')).toBe('Packaging (Dine-In)');
    expect(normalizeCategory('Takeaway Box')).toBe('Packaging (Delivery)');

    expect(normalizeBaseUnit('gram')).toBe('g');
    expect(normalizeBaseUnit('liter')).toBe('ml');
    expect(normalizeBaseUnit('buah')).toBe('pcs');

    expect(normalizeComponentRole('makanan')).toBe('food');
    expect(normalizeComponentRole('dine in')).toBe('packaging_dine_in');
    expect(normalizeComponentRole('delivery')).toBe('packaging_delivery');
  });

  it('generates a starter template workbook with 3 sheets and valid structure', () => {
    const wb = generateStarterTemplateWorkbook();
    expect(wb.SheetNames).toContain('Master_Ingredients');
    expect(wb.SheetNames).toContain('Recipe_BOMs');
    expect(wb.SheetNames).toContain('Petunjuk_Pengisian');

    const ingRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(wb.Sheets['Master_Ingredients']);
    expect(ingRows.length).toBeGreaterThan(0);
    expect(ingRows[0]['ID Bahan']).toBe('ING-ESP-HOUSE');
    expect(ingRows[0]['Satuan Dasar']).toBe('g');

    const bomRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(wb.Sheets['Recipe_BOMs']);
    expect(bomRows.length).toBeGreaterThan(0);
    expect(bomRows[0]['ID Resep / Menu']).toBe('REC-LATTE-01');
  });

  it('parses an Excel workbook containing ingredients and BOM lines successfully', () => {
    const wb = generateStarterTemplateWorkbook();
    const buffer = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });

    const existingIngredients = [
      { ingredient_id: 'ING-ESP-HOUSE', ingredient_name: 'Original Espresso House Blend' },
      { ingredient_id: 'ING-MILK-FRESH', ingredient_name: 'Original Fresh Milk' },
    ];
    const existingRecipes = [
      { recipe_id: 'REC-LATTE-01', item_name: 'Iced Cafe Latte 16oz' },
    ];

    const result = parseRecipeSyncWorkbook(buffer, existingIngredients, existingRecipes);

    expect(result.summary.totalIngredients).toBe(3);
    expect(result.summary.validIngredients).toBe(3);
    expect(result.ingredients[0].ingredient_id).toBe('ING-ESP-HOUSE');
    expect(result.ingredients[0].purchase_price).toBe(175000);
    expect(result.ingredients[0].base_unit).toBe('g');

    expect(result.recipeBoms.length).toBe(1);
    expect(result.recipeBoms[0].recipe_id).toBe('REC-LATTE-01');
    expect(result.recipeBoms[0].lines.length).toBe(3);
    expect(result.summary.validBomLines).toBe(3);
    expect(result.errors.length).toBe(0);
  });

  it('resolves ingredient IDs from ingredient names when ID is omitted in BOM lines', () => {
    const wb = XLSX.utils.book_new();

    const ingSheet = XLSX.utils.json_to_sheet([
      {
        'ID Bahan': 'ING-MATCHA-PREM',
        'Nama Bahan Baku': 'Matcha Powder Premium Uji 1kg',
        'Kategori': 'Coffee & Tea',
        'Supplier': 'Supplier Matcha',
        'Kemasan Beli': '1 Pack',
        'Isi Kemasan': 1000,
        'Satuan Dasar': 'g',
        'Harga Beli (Rp)': 180000,
        'Yield / Rendemen (%)': 100,
      },
    ]);
    XLSX.utils.book_append_sheet(wb, ingSheet, 'Bahan_Baku');

    const bomSheet = XLSX.utils.json_to_sheet([
      {
        'ID Resep / Menu': 'REC-MATCHA-01',
        'Nama Menu': 'Iced Uji Matcha Latte',
        'ID Bahan': '', // Omitted ID!
        'Nama Bahan': 'Matcha Powder Premium Uji 1kg', // Matches name in sheet 1
        'Peran Komponen': 'food',
        'Takaran per Porsi': 15,
        'Catatan Prep / Gramasi': 'Whisked with bamboo chasen',
      },
    ]);
    XLSX.utils.book_append_sheet(wb, bomSheet, 'Resep_BOM');

    const buffer = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
    const result = parseRecipeSyncWorkbook(buffer);

    expect(result.ingredients.length).toBe(1);
    expect(result.recipeBoms.length).toBe(1);
    // Verified that ingredient_id was auto-resolved to ING-MATCHA-PREM!
    expect(result.recipeBoms[0].lines[0].ingredient_id).toBe('ING-MATCHA-PREM');
    expect(result.recipeBoms[0].lines[0].qty_per_serving).toBe(15);
    expect(result.errors.length).toBe(0);
  });

  it('parses a standalone CSV file of ingredients directly', () => {
    const csvContent = `ID Bahan,Nama Bahan Baku,Kategori,Supplier,Kemasan Beli,Isi Kemasan,Satuan Dasar,Harga Beli (Rp),Yield / Rendemen (%)
ING-GULA-AREN,Gula Aren Cair Organik,"Sauces, Oils & Sweeteners",Supplier Aren,5 Liter Jerigen,5000,ml,125000,100
ING-OAT-OATSIDE,Oatside Barista Blend,"Dairy & Plant Milk",Oatside Official,1 Liter,1000,ml,38500,100`;

    const result = parseRecipeSyncWorkbook(csvContent);
    expect(result.ingredients.length).toBe(2);
    expect(result.ingredients[0].ingredient_id).toBe('ING-GULA-AREN');
    expect(result.ingredients[0].base_unit).toBe('ml');
    expect(result.ingredients[0].purchase_price).toBe(125000);
    expect(result.ingredients[1].ingredient_name).toBe('Oatside Barista Blend');
    expect(result.ingredients[1].category).toBe('Dairy & Plant Milk');
  });

  it('generates an export workbook with recipes and ingredients populated', () => {
    const wb = generateRecipesExportWorkbook(
      [
        {
          ingredient_id: 'ING-ESP-HOUSE',
          ingredient_name: 'Espresso House Blend',
          category: 'Coffee & Tea',
          supplier_name: 'Shopee House Blend Lampung',
          purchase_unit_label: '1,000 gr Bag',
          purchase_qty: 1000,
          base_unit: 'g',
          purchase_price: 175000,
          yield_pct: 100,
        },
      ],
      [
        {
          recipe_id: 'REC-ESP-01',
          brand: 'Tyfel Coffee',
          item_name: 'Espresso Single',
          canonical_name: 'Espresso Single',
          category: 'Coffee',
          kitchen_recipe_card: 'Card #1',
          audit_status: 'full_bom',
          audit_note: 'Verified',
          bom_summary: '18g Espresso',
          raw_food_cost: 3150,
          packaging_dine_in: 0,
          packaging_delivery: 1200,
          target_food_cost_pct: 30,
          is_hero_bom: true,
          has_itemized_lines: true,
          calculated_food_cost: 3150,
          calculated_pkg_dine_in: 0,
          calculated_pkg_delivery: 1200,
          units_sold: 100,
          gross_revenue: 2500000,
          avg_selling_price: 25000,
          dine_in_total_cogs: 3150,
          delivery_total_cogs: 4350,
          dine_in_cogs_pct: 12.6,
          delivery_cogs_pct: 17.4,
          blended_cogs_per_unit: 3600,
          blended_cogs_pct: 14.4,
          gross_margin_per_unit: 21400,
          total_theoretical_cogs: 360000,
          total_gross_profit: 2140000,
          variance_vs_target_pct: -15.6,
          margin_status: 'healthy',
          lines: [
            {
              line_id: 'LINE-1',
              recipe_id: 'REC-ESP-01',
              ingredient_id: 'ING-ESP-HOUSE',
              ingredient_name: 'Espresso House Blend',
              category: 'Coffee & Tea',
              supplier_name: 'Shopee House Blend Lampung',
              base_unit: 'g',
              component_role: 'food',
              qty_per_serving: 18,
              effective_unit_cost: 175,
              line_cost: 3150,
              share_of_food_cost_pct: 100,
              prep_notes: '18g grind',
            },
          ],
        }
      ]
    );

    expect(wb.SheetNames).toContain('Master_Ingredients');
    expect(wb.SheetNames).toContain('Recipe_BOMs');
    expect(wb.SheetNames).toContain('Petunjuk_Pengisian');
  });
});
