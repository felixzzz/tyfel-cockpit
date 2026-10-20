import { describe, it, expect } from 'vitest';
import { computeStockVarianceItem } from '../inventory';

describe('Stock Opname Variance & Shrinkage Engine', () => {
  it('correctly calculates zero variance when actual count equals system stock', () => {
    const item = computeStockVarianceItem({
      ingredientId: 'ING-ESP-HOUSE',
      ingredientName: 'Coffee House Blend',
      baseUnit: 'g',
      category: 'Coffee & Tea',
      systemStock: 5000,
      actualCount: 5000,
      purchasePrice: 171385,
      purchaseQty: 1000,
    });

    expect(item.varianceQty).toBe(0);
    expect(item.varianceValueRp).toBe(0);
    expect(item.variancePct).toBe(0);
    expect(item.varianceType).toBe('OK');
  });

  it('flags surplus inventory when physical count exceeds system stock', () => {
    const item = computeStockVarianceItem({
      ingredientId: 'ING-MILK-DIAMOND',
      ingredientName: 'Susu Fresh Milk',
      baseUnit: 'ml',
      category: 'Dairy',
      systemStock: 2000,
      actualCount: 2500,
      purchasePrice: 24600,
      purchaseQty: 1000,
    });

    expect(item.varianceQty).toBe(500);
    expect(item.varianceValueRp).toBe(12300); // 500 * 24.6
    expect(item.variancePct).toBe(25);
    expect(item.varianceType).toBe('SURPLUS');
  });

  it('classifies normal variance within tolerance as PORTION_VARIANCE', () => {
    // 3% reduction, below threshold
    const item = computeStockVarianceItem({
      ingredientId: 'ING-CHEDDAR',
      ingredientName: 'Cheddar Cheese',
      baseUnit: 'g',
      category: 'Dairy',
      systemStock: 1000,
      actualCount: 970, // -30g = -3%
      purchasePrice: 50000,
      purchaseQty: 1000,
    });

    expect(item.varianceQty).toBe(-30);
    expect(item.variancePct).toBe(-3);
    expect(item.varianceType).toBe('PORTION_VARIANCE');
  });

  it('classifies heavy loss (>10% or >Rp 50,000) as SHRINKAGE_SPILLAGE', () => {
    const item = computeStockVarianceItem({
      ingredientId: 'ING-BEEF-MOCK',
      ingredientName: 'Plant Beef Patty',
      baseUnit: 'g',
      category: 'Plant Proteins',
      systemStock: 5000,
      actualCount: 3500, // -1500g = -30%
      purchasePrice: 62000,
      purchaseQty: 1000,
    });

    expect(item.varianceQty).toBe(-1500);
    expect(item.variancePct).toBe(-30);
    expect(item.varianceType).toBe('SHRINKAGE_SPILLAGE');
  });
});
