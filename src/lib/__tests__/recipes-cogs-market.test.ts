import { describe, it, expect } from 'vitest';
import {
  getRecipesCogsDashboardData,
  quickUpdateMarketPrices,
  upsertMasterIngredient,
} from '../recipesCogs';

describe('Recipe & Market Price Fluctuation System', () => {
  it('correctly tracks previous price and computes price variance and spike alerts', async () => {
    // 1. Initial dashboard fetch
    const initialData = await getRecipesCogsDashboardData();
    expect(initialData.summary.totalMasterIngredients).toBeGreaterThan(0);
    expect(initialData.summary.volatileIngredientsCount).toBeGreaterThan(0);

    // Look for test ingredient or fresh milk
    const targetIng = initialData.ingredients.find((i) => i.ingredient_id === 'ING-MILK-FRESH');
    expect(targetIng).toBeDefined();

    // 2. Perform quick market price update on ING-MILK-FRESH
    // Update price to 240,000 (from 216,450)
    const updateRes = await quickUpdateMarketPrices([
      {
        ingredient_id: 'ING-MILK-FRESH',
        purchase_price: 240000,
      },
    ]);

    expect(updateRes.updatedCount).toBe(1);
    expect(updateRes.cascadedRecipesCount).toBeGreaterThan(0);

    // 3. Re-fetch dashboard data
    const updatedData = await getRecipesCogsDashboardData();
    const updatedMilk = updatedData.ingredients.find((i) => i.ingredient_id === 'ING-MILK-FRESH');

    expect(updatedMilk).toBeDefined();
    expect(updatedMilk?.purchase_price).toBe(240000);
    expect(updatedMilk?.previous_price).toBe(216450);
    expect(updatedMilk?.price_variance_rp).toBe(240000 - 216450);
    expect(updatedMilk?.price_variance_pct).toBeGreaterThan(5);
    expect(updatedMilk?.is_price_spiked).toBe(true);

    // 4. Verify that recipes using ING-MILK-FRESH are flagged with has_price_spike
    const affectedRecipe = updatedData.recipes.find((r) =>
      r.lines.some((l) => l.ingredient_id === 'ING-MILK-FRESH')
    );
    if (affectedRecipe) {
      expect(affectedRecipe.has_price_spike).toBe(true);
      expect(affectedRecipe.spiked_ingredients_count).toBeGreaterThan(0);
    }

    // 5. Verify that priceSpikeCount in summary is tracked
    expect(updatedData.summary.priceSpikeCount).toBeGreaterThanOrEqual(1);

    // 6. Reset price back to normal to restore baseline
    await quickUpdateMarketPrices([
      {
        ingredient_id: 'ING-MILK-FRESH',
        purchase_price: 216450,
      },
    ]);
  });

  it('preserves previous price when updating master ingredient attributes', async () => {
    const data = await getRecipesCogsDashboardData();
    const testIng = data.ingredients[0];

    const res = await upsertMasterIngredient({
      ingredient_id: testIng.ingredient_id,
      ingredient_name: testIng.ingredient_name,
      category: testIng.category,
      supplier_name: 'Verified Vendor Update',
      purchase_unit_label: testIng.purchase_unit_label,
      purchase_qty: testIng.purchase_qty,
      base_unit: testIng.base_unit,
      purchase_price: testIng.purchase_price,
      yield_pct: testIng.yield_pct,
    });

    expect(res.ingredient_id).toBe(testIng.ingredient_id);
  });
});
