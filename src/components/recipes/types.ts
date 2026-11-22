import type {
  IngredientCategory,
  BaseUnit,
  ComponentRole,
} from '@/lib/recipesCogs';

export const BRAND_OPTIONS = [
  { label: 'All 5 Concepts', value: 'all' },
  { label: 'American Breakfast Club', value: 'American Breakfast Club' },
  { label: 'Tyfel Coffee', value: 'Tyfel Coffee' },
  { label: 'People Pasta', value: 'People Pasta' },
  { label: 'Herbox', value: 'Herbox' },
  { label: 'LA Breakfast Club', value: 'LA Breakfast Club' },
];

export const INGREDIENT_CATEGORIES: IngredientCategory[] = [
  'Coffee & Tea',
  'Dairy & Plant Milk',
  'Plant Proteins & Eggs',
  'Grains, Bread & Pasta',
  'Produce & Fungi',
  'Sauces, Oils & Sweeteners',
  'Packaging (Dine-In)',
  'Packaging (Delivery)',
];

export function formatRp(val: number): string {
  return `Rp ${Math.round(Number(val) || 0).toLocaleString('id-ID')}`;
}

export function formatCompactRp(val: number): string {
  const n = Number(val) || 0;
  if (Math.abs(n) >= 1_000_000_000) return `Rp ${(n / 1_000_000_000).toFixed(2)}B`;
  if (Math.abs(n) >= 1_000_000) return `Rp ${(n / 1_000_000).toFixed(2)}M`;
  if (Math.abs(n) >= 1_000) return `Rp ${(n / 1_000).toFixed(0)}k`;
  return `Rp ${Math.round(n)}`;
}

export function formatQtyWithUnit(qty: number, unit: BaseUnit): string {
  if (unit === 'g' && qty >= 1000) {
    return `${(qty / 1000).toFixed(2)} kg`;
  }
  if (unit === 'ml' && qty >= 1000) {
    return `${(qty / 1000).toFixed(2)} L`;
  }
  return `${qty.toLocaleString('id-ID', { maximumFractionDigits: 1 })} ${unit}`;
}

export interface EditableBomLine {
  ingredient_id: string;
  component_role: ComponentRole;
  qty_per_serving: number;
  prep_notes: string;
}
