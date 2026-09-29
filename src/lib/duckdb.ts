import fs from 'fs';
import os from 'os';
import path from 'path';
import type { DuckDBInstance, DuckDBConnection } from '@duckdb/node-api';

const BUNDLED_DB_PATH = path.join(process.cwd(), 'data', 'fnb_analytics.duckdb');
const LEGACY_PARENT_DB_PATH = path.resolve(process.cwd(), '../data/fnb_analytics.duckdb');
const TMP_DIR = process.env.VERCEL ? '/tmp' : os.tmpdir();
const TMP_DB_PATH = path.join(TMP_DIR, 'fnb_analytics.duckdb');

export function getSeedDbPath(): string | null {
  if (fs.existsSync(BUNDLED_DB_PATH)) return BUNDLED_DB_PATH;
  if (fs.existsSync(LEGACY_PARENT_DB_PATH)) return LEGACY_PARENT_DB_PATH;
  return null;
}

export function resolveRuntimeDbPath(): string {
  if (process.env.DUCKDB_PATH) {
    return process.env.DUCKDB_PATH;
  }
  if (process.env.VERCEL) {
    return TMP_DB_PATH;
  }
  if (fs.existsSync(BUNDLED_DB_PATH)) {
    return BUNDLED_DB_PATH;
  }
  if (fs.existsSync(LEGACY_PARENT_DB_PATH)) {
    return LEGACY_PARENT_DB_PATH;
  }
  return BUNDLED_DB_PATH;
}

export function getRawReportsReadDirs(): string[] {
  const candidates = [
    process.env.RAW_REPORTS_DIR,
    path.join(TMP_DIR, 'reports', 'raw'),
    path.join(process.cwd(), 'data', 'raw'),
    path.resolve(process.cwd(), '../reports/raw'),
  ].filter((d): d is string => Boolean(d));
  return Array.from(new Set(candidates)).filter((d) => fs.existsSync(d));
}

export function getRawReportsWriteDir(): string {
  if (process.env.RAW_REPORTS_DIR) return process.env.RAW_REPORTS_DIR;
  if (process.env.VERCEL) {
    return path.join(TMP_DIR, 'reports', 'raw');
  }
  const bundledRaw = path.join(process.cwd(), 'data', 'raw');
  if (fs.existsSync(bundledRaw)) return bundledRaw;
  return path.resolve(process.cwd(), '../reports/raw');
}

let dbInstance: DuckDBInstance | null = null;
let dbInitPromise: Promise<DuckDBInstance> | null = null;

export interface SeedRecipeRow {
  recipe_id: string;
  brand: string;
  item_name: string;
  canonical_name: string;
  category: string;
  bom_summary: string;
  raw_food_cost: number;
  packaging_dine_in: number;
  packaging_delivery: number;
  target_food_cost_pct: number;
  is_hero_bom: boolean;
}

export const MASTER_RECIPES: SeedRecipeRow[] = [
  // =========================================================================
  // 5 Hero SKUs (Exact POS Product Names)
  // =========================================================================
  {
    recipe_id: 'HERO-TYFEL-KGA',
    brand: 'Tyfel Coffee',
    item_name: 'Kopi Gula Aren',
    canonical_name: 'Kopi Gula Aren',
    category: 'Signature Espresso',
    bom_summary: '20g Coffee House Blend (Rp 3,428), 150ml Susu Full Cream Diamond (Rp 3,690), 20ml Sirup Gula Merah Gulare (Rp 769), 150g Ice Cube (Rp 585) | Pkg DI Rp 175 / Del Rp 425',
    raw_food_cost: 8472,
    packaging_dine_in: 175,
    packaging_delivery: 425,
    target_food_cost_pct: 25.0,
    is_hero_bom: true,
  },
  {
    recipe_id: 'HERO-ABC-CBB-KATSU',
    brand: 'American Breakfast Club',
    item_name: 'Burrito - Mock Katsu, 2 Scrambled Eggs, Cheddar, Avocado, Tater Tots',
    canonical_name: 'Burrito - Mock Katsu, 2 Scrambled Eggs, Cheddar, Avocado, Tater Tots',
    category: 'All-Day Burritos',
    bom_summary: '1pcs Tortilla Kebab Gilss (Rp 2,450), 2pcs Telur (Rp 4,067), 1pcs Veggie Way Chicken Katsu (Rp 7,992), 50g Potato Nugget (Rp 2,850), 20g Cheddar (Rp 1,010), Lettuce & Mayo',
    raw_food_cost: 19553,
    packaging_dine_in: 440,
    packaging_delivery: 2500,
    target_food_cost_pct: 28.0,
    is_hero_bom: true,
  },
  {
    recipe_id: 'HERO-PP-CTM-POS',
    brand: 'People Pasta',
    item_name: 'Creamy Mushroom - Vegetarian - Plantbased',
    canonical_name: 'Creamy Mushroom - Vegetarian - Plantbased',
    category: 'Artisanal Pasta',
    bom_summary: '150g Fettuchini La Fonte (Rp 6,800), 40g Jamur Champignon (Rp 3,000), 50g Sauce Bechamel Leggos (Rp 2,817), 20g Cheddar (Rp 1,010)',
    raw_food_cost: 13627,
    packaging_dine_in: 0,
    packaging_delivery: 2500,
    target_food_cost_pct: 28.0,
    is_hero_bom: true,
  },
  {
    recipe_id: 'HERO-HBX-KPC-POS',
    brand: 'Herbox',
    item_name: 'Kung Paow Chick Vegan Vegetarian Ricebox',
    canonical_name: 'Kung Paow Chick Vegan Vegetarian Ricebox',
    category: 'Plant Ricebox',
    bom_summary: '100g Beras Cap Bunga (Rp 1,700), 65g Veggie Way Vegan Crispy (Rp 6,890), 1porsi Sauce Kung Pao WIP (Rp 3,684), Lettuce, Kol Ungu, Wortel, Tomat Cherry, Dressing Herbox',
    raw_food_cost: 19515,
    packaging_dine_in: 0,
    packaging_delivery: 1043,
    target_food_cost_pct: 30.0,
    is_hero_bom: true,
  },
  {
    recipe_id: 'HERO-LABC-CO',
    brand: 'LA Breakfast Club',
    item_name: 'Cheese Omelette - Side of Tater Tots',
    canonical_name: 'Cheese Omelette - Side of Tater Tots',
    category: 'Griddle & Skillets',
    bom_summary: '3pcs Telur Zifara (Rp 6,100), 30g Cheesy Quick Melt (Rp 3,492), 120g Potato Nugget / Tater Tots (Rp 6,840), 10g Mentega (Rp 285)',
    raw_food_cost: 16717,
    packaging_dine_in: 440,
    packaging_delivery: 2500,
    target_food_cost_pct: 28.0,
    is_hero_bom: true,
  },

  // =========================================================================
  // Core Portfolio BOM Catalog (Exact POS Product Names)
  // =========================================================================
  // ── American Breakfast Club ──
  {
    recipe_id: 'ABC-BUR-EGG',
    brand: 'American Breakfast Club',
    item_name: 'Burrito - 2 Scrambled Eggs, Cheddar, Avocado, Tater Tots',
    canonical_name: 'Burrito - 2 Scrambled Eggs, Cheddar, Avocado, Tater Tots',
    category: 'All-Day Burritos',
    bom_summary: '1pcs Tortilla Kebab Gilss (Rp 2,450), 2pcs Telur (Rp 4,067), 60g Potato Nugget / Tots (Rp 3,420), 25g Cheddar (Rp 1,263), 40g Lettuce (Rp 840), 15g Mayo (Rp 555)',
    raw_food_cost: 12594,
    packaging_dine_in: 440,
    packaging_delivery: 2500,
    target_food_cost_pct: 28.0,
    is_hero_bom: false,
  },
  {
    recipe_id: 'ABC-OML-CHEESE',
    brand: 'American Breakfast Club',
    item_name: 'Cheese Omelette - Side Tater Tots',
    canonical_name: 'Cheese Omelette - Side Tater Tots',
    category: 'Griddle & Skillets',
    bom_summary: '3pcs Telur Zifara (Rp 6,100), 30g Cheesy Quick Melt (Rp 3,492), 120g Potato Nugget / Tater Tots (Rp 6,840), 10g Mentega (Rp 285)',
    raw_food_cost: 16717,
    packaging_dine_in: 440,
    packaging_delivery: 2500,
    target_food_cost_pct: 28.0,
    is_hero_bom: false,
  },
  {
    recipe_id: 'ABC-BUR-BEEF',
    brand: 'American Breakfast Club',
    item_name: 'Burrito - Mock Beef, 2 Scrambled Eggs, Cheddar, Avocado, Tater Tots,',
    canonical_name: 'Burrito - Mock Beef, 2 Scrambled Eggs, Cheddar, Avocado, Tater Tots,',
    category: 'All-Day Burritos',
    bom_summary: '1pcs Tortilla Kebab Gilss (Rp 2,450), 60g Vway Mutton / Mock Beef (Rp 3,720), 2pcs Telur (Rp 4,067), 50g Potato Nugget (Rp 2,850), 20g Cheddar (Rp 1,010), Lettuce & Mayo',
    raw_food_cost: 15282,
    packaging_dine_in: 440,
    packaging_delivery: 2500,
    target_food_cost_pct: 28.0,
    is_hero_bom: false,
  },
  {
    recipe_id: 'ABC-BUR-CHICK',
    brand: 'American Breakfast Club',
    item_name: 'Burrito - Mock Chicken, 2 Scrambled Eggs, Cheddar, Avocado, Tater Tots',
    canonical_name: 'Burrito - Mock Chicken, 2 Scrambled Eggs, Cheddar, Avocado, Tater Tots',
    category: 'All-Day Burritos',
    bom_summary: '1pcs Tortilla Kebab Gilss (Rp 2,450), 1pcs Veggie Way Chicken Katsu (Rp 7,992), 2pcs Telur (Rp 4,067), 50g Potato Nugget (Rp 2,850), 20g Cheddar (Rp 1,010), Lettuce & Mayo',
    raw_food_cost: 19553,
    packaging_dine_in: 440,
    packaging_delivery: 2500,
    target_food_cost_pct: 28.0,
    is_hero_bom: false,
  },
  {
    recipe_id: 'ABC-OML-MUSH',
    brand: 'American Breakfast Club',
    item_name: 'Mushroom Omelette - Mushrooms, Spinach, Side Tater Tots',
    canonical_name: 'Mushroom Omelette - Mushrooms, Spinach, Side Tater Tots',
    category: 'Griddle & Skillets',
    bom_summary: '3pcs Telur Zifara (Rp 6,100), 40g Jamur Champignon (Rp 3,000), 120g Potato Nugget / Tater Tots (Rp 6,840), 30g Greens (Rp 630), 10g Mentega (Rp 285)',
    raw_food_cost: 16855,
    packaging_dine_in: 440,
    packaging_delivery: 2500,
    target_food_cost_pct: 28.0,
    is_hero_bom: false,
  },
  {
    recipe_id: 'ABC-BRI-EGG',
    brand: 'American Breakfast Club',
    item_name: 'Sandwich - 2 Scrambled Eggs melty cheddar cheese on a wavy brioche bun',
    canonical_name: 'Sandwich - 2 Scrambled Eggs melty cheddar cheese on a wavy brioche bun',
    category: 'Brioche Sandwiches',
    bom_summary: '1pcs Madam Bun Burger (Rp 2,767), 2pcs Telur (Rp 4,067), 30g Cheesy Melt (Rp 3,492), 15g Mayonnaise (Rp 555)',
    raw_food_cost: 10880,
    packaging_dine_in: 440,
    packaging_delivery: 2500,
    target_food_cost_pct: 28.0,
    is_hero_bom: false,
  },
  {
    recipe_id: 'ABC-TOTS-STD',
    brand: 'American Breakfast Club',
    item_name: 'Tater Tots',
    canonical_name: 'Tater Tots',
    category: 'Sides & Hash',
    bom_summary: '200g Potato Nugget Golden Farm (Rp 11,400), 5g Saos Sambal (Rp 137), 5g Sauce Tomato (Rp 104)',
    raw_food_cost: 11641,
    packaging_dine_in: 440,
    packaging_delivery: 2500,
    target_food_cost_pct: 28.0,
    is_hero_bom: false,
  },
  {
    recipe_id: 'ABC-TOTS-TRUFFLE',
    brand: 'American Breakfast Club',
    item_name: 'Tater Tots With Truffle Oil',
    canonical_name: 'Tater Tots With Truffle Oil',
    category: 'Sides & Hash',
    bom_summary: '200g Potato Nugget Golden Farm (Rp 11,400), 2ml Urbani Truffle Oil (Rp 2,906), 5g Saos Sambal (Rp 137)',
    raw_food_cost: 14443,
    packaging_dine_in: 440,
    packaging_delivery: 2500,
    target_food_cost_pct: 28.0,
    is_hero_bom: false,
  },
  {
    recipe_id: 'ABC-HOME-FRIES',
    brand: 'American Breakfast Club',
    item_name: 'Home Fries',
    canonical_name: 'Home Fries',
    category: 'Sides & Hash',
    bom_summary: '200g Kentang (Rp 9,200), 10g Saos Sambal (Rp 273), 10g Sauce Tomato (Rp 208)',
    raw_food_cost: 9681,
    packaging_dine_in: 440,
    packaging_delivery: 2500,
    target_food_cost_pct: 28.0,
    is_hero_bom: false,
  },
  {
    recipe_id: 'ABC-HOME-FRIES-TRUFFLE',
    brand: 'American Breakfast Club',
    item_name: 'Home Fries With Truffle Oil',
    canonical_name: 'Home Fries With Truffle Oil',
    category: 'Sides & Hash',
    bom_summary: '200g Kentang (Rp 9,200), 2ml Urbani Truffle Oil (Rp 2,906)',
    raw_food_cost: 12106,
    packaging_dine_in: 440,
    packaging_delivery: 2500,
    target_food_cost_pct: 28.0,
    is_hero_bom: false,
  },
  {
    recipe_id: 'ABC-PAN-MAPLE',
    brand: 'American Breakfast Club',
    item_name: '2 Pancakes - Butter, Maple Syrup',
    canonical_name: '2 Pancakes - Butter, Maple Syrup',
    category: 'Sweet Griddle',
    bom_summary: '150g Sriboga EasyMix Batter (Rp 8,839), 20g Mentega (Rp 570), 35ml Pondan Sirup Maple (Rp 1,498)',
    raw_food_cost: 10907,
    packaging_dine_in: 0,
    packaging_delivery: 2500,
    target_food_cost_pct: 26.0,
    is_hero_bom: false,
  },
  {
    recipe_id: 'ABC-PAN-BLUE',
    brand: 'American Breakfast Club',
    item_name: '2 Pancakes - Blueberries, Butter, Maple Syrup',
    canonical_name: '2 Pancakes - Blueberries, Butter, Maple Syrup',
    category: 'Sweet Griddle',
    bom_summary: '150g Sriboga EasyMix Batter (Rp 8,839), 50g Berry Topping (Rp 1,750), 20g Mentega (Rp 570), 35ml Sirup Maple (Rp 1,498)',
    raw_food_cost: 12657,
    packaging_dine_in: 0,
    packaging_delivery: 2500,
    target_food_cost_pct: 28.0,
    is_hero_bom: false,
  },
  {
    recipe_id: 'ABC-PAN-CHOCO',
    brand: 'American Breakfast Club',
    item_name: '2 Pancakes - Chocolate Chips, Butter, Maple Syrup',
    canonical_name: '2 Pancakes - Chocolate Chips, Butter, Maple Syrup',
    category: 'Sweet Griddle',
    bom_summary: '150g Sriboga EasyMix Batter (Rp 8,839), 15g Tulip Choco Chip (Rp 4,039), 20g Mentega (Rp 570), 35ml Sirup Maple (Rp 1,498)',
    raw_food_cost: 14946,
    packaging_dine_in: 0,
    packaging_delivery: 2500,
    target_food_cost_pct: 28.0,
    is_hero_bom: false,
  },
  {
    recipe_id: 'ABC-BRI-BEEF',
    brand: 'American Breakfast Club',
    item_name: 'Sandwich - 2 Scrambled Eggs Mock Beef, Cheddar Cheese  on a wavy brioche bun',
    canonical_name: 'Sandwich - 2 Scrambled Eggs Mock Beef, Cheddar Cheese  on a wavy brioche bun',
    category: 'Brioche Sandwiches',
    bom_summary: '1pcs Madam Bun Burger (Rp 2,767), 60g Vway Mutton / Mock Beef (Rp 3,720), 2pcs Telur (Rp 4,067), 30g Cheesy Melt (Rp 3,492), 15g Mayonnaise (Rp 555)',
    raw_food_cost: 14600,
    packaging_dine_in: 440,
    packaging_delivery: 2500,
    target_food_cost_pct: 28.0,
    is_hero_bom: false,
  },
  {
    recipe_id: 'ABC-BRI-CHICK',
    brand: 'American Breakfast Club',
    item_name: 'Sandwich - 2 Scrambled Eggs, Mock Chicken, Cheddar Cheese Mix, Brioche Bun',
    canonical_name: 'Sandwich - 2 Scrambled Eggs, Mock Chicken, Cheddar Cheese Mix, Brioche Bun',
    category: 'Brioche Sandwiches',
    bom_summary: '1pcs Madam Bun Burger (Rp 2,767), 1pcs Veggie Way Chicken Katsu (Rp 7,992), 2pcs Telur (Rp 4,067), 30g Cheesy Melt (Rp 3,492), 15g Mayonnaise (Rp 555)',
    raw_food_cost: 18872,
    packaging_dine_in: 440,
    packaging_delivery: 2500,
    target_food_cost_pct: 28.0,
    is_hero_bom: false,
  },
  {
    recipe_id: 'ABC-BRI-FISH',
    brand: 'American Breakfast Club',
    item_name: 'Sandwich - 2 Scrambled Eggs, Mock Fish, Cheddar Cheese, Mix, Brioche Bun',
    canonical_name: 'Sandwich - 2 Scrambled Eggs, Mock Fish, Cheddar Cheese, Mix, Brioche Bun',
    category: 'Brioche Sandwiches',
    bom_summary: '1pcs Madam Bun Burger (Rp 2,767), 1pcs Veggie Way Ikan Nemo (Rp 5,688), 2pcs Telur (Rp 4,067), 30g Cheesy Melt (Rp 3,492), 15g Mayonnaise (Rp 555)',
    raw_food_cost: 16568,
    packaging_dine_in: 440,
    packaging_delivery: 2500,
    target_food_cost_pct: 28.0,
    is_hero_bom: false,
  },
  {
    recipe_id: 'ABC-BUR-FISH',
    brand: 'American Breakfast Club',
    item_name: 'Burrito - Mock Fish, 2 Scrambled Eggs, Cheddar, Avocado, Tater Tots,',
    canonical_name: 'Burrito - Mock Fish, 2 Scrambled Eggs, Cheddar, Avocado, Tater Tots,',
    category: 'All-Day Burritos',
    bom_summary: '1pcs Tortilla Kebab Gilss (Rp 2,450), 1pcs Veggie Way Ikan Nemo (Rp 5,688), 2pcs Telur (Rp 4,067), 50g Potato Nugget (Rp 2,850), 20g Cheddar (Rp 1,010), Lettuce & Mayo',
    raw_food_cost: 17249,
    packaging_dine_in: 440,
    packaging_delivery: 2500,
    target_food_cost_pct: 28.0,
    is_hero_bom: false,
  },

  // ── Tyfel Coffee ──
  {
    recipe_id: 'TYF-LB',
    brand: 'Tyfel Coffee',
    item_name: 'Long Black',
    canonical_name: 'Long Black',
    category: 'Signature Espresso',
    bom_summary: '20g Coffee House Blend (Rp 3,428), 250g Water & Ice (Rp 975), 15ml Simple Syrup (Rp 975)',
    raw_food_cost: 5378,
    packaging_dine_in: 175,
    packaging_delivery: 425,
    target_food_cost_pct: 21.0,
    is_hero_bom: false,
  },
  {
    recipe_id: 'TYF-MATCHA',
    brand: 'Tyfel Coffee',
    item_name: 'Matcha Latte',
    canonical_name: 'Matcha Latte',
    category: 'Artisanal Beverages',
    bom_summary: '20g Green Tea Powder (Rp 2,300), 20ml Condensed Milk Carnation (Rp 892), 150ml Susu Full Cream Diamond (Rp 3,690), 150g Ice Cube (Rp 585)',
    raw_food_cost: 7467,
    packaging_dine_in: 175,
    packaging_delivery: 425,
    target_food_cost_pct: 24.2,
    is_hero_bom: false,
  },
  {
    recipe_id: 'TYF-CAP',
    brand: 'Tyfel Coffee',
    item_name: 'Cappuccino',
    canonical_name: 'Cappuccino',
    category: 'Signature Espresso',
    bom_summary: '20g Coffee House Blend (Rp 3,428), 150ml Susu Full Cream Diamond (Rp 3,690), 150g Ice Cube (Rp 585), 15ml Simple Syrup (Rp 975)',
    raw_food_cost: 8678,
    packaging_dine_in: 175,
    packaging_delivery: 425,
    target_food_cost_pct: 28.0,
    is_hero_bom: false,
  },
  {
    recipe_id: 'TYF-LATTE',
    brand: 'Tyfel Coffee',
    item_name: 'Café Latte',
    canonical_name: 'Café Latte',
    category: 'Signature Espresso',
    bom_summary: '20g Coffee House Blend (Rp 3,428), 150ml Susu Full Cream Diamond (Rp 3,690), 150g Ice Cube (Rp 585), 15ml Simple Syrup (Rp 975)',
    raw_food_cost: 8678,
    packaging_dine_in: 175,
    packaging_delivery: 425,
    target_food_cost_pct: 28.0,
    is_hero_bom: false,
  },
  {
    recipe_id: 'TYF-LYCHEE',
    brand: 'Tyfel Coffee',
    item_name: 'Lychee Tea',
    canonical_name: 'Lychee Tea',
    category: 'Refreshers',
    bom_summary: '1bag Tea (Rp 475), 25ml Monin Lychee (Rp 6,036), 20g Lychee Fruit (Rp 1,239), 15ml Simple Syrup (Rp 975), Water & Ice (Rp 780)',
    raw_food_cost: 9505,
    packaging_dine_in: 175,
    packaging_delivery: 425,
    target_food_cost_pct: 25.0,
    is_hero_bom: false,
  },
  {
    recipe_id: 'TYF-BERRY-BOOM',
    brand: 'Tyfel Coffee',
    item_name: 'Berry Boom',
    canonical_name: 'Berry Boom',
    category: 'Mocktails',
    bom_summary: '10g Strawberry (Rp 350), 20ml Monin Strawberry (Rp 4,829), 20ml Monin Peach (Rp 4,829), 20ml Lemon Sauce (Rp 2,212), 50g Lime (Rp 900), 1bag Tea, Ice',
    raw_food_cost: 14180,
    packaging_dine_in: 175,
    packaging_delivery: 425,
    target_food_cost_pct: 32.0,
    is_hero_bom: false,
  },
  {
    recipe_id: 'TYF-MOJITO',
    brand: 'Tyfel Coffee',
    item_name: 'Virgin Mojito',
    canonical_name: 'Virgin Mojito',
    category: 'Mocktails',
    bom_summary: '50g Lime (Rp 900), 15ml Monin Wild Mint (Rp 3,621), 5g Mint Leaves (Rp 285), 20ml Lemon Sauce (Rp 2,212), Ice (Rp 585)',
    raw_food_cost: 7603,
    packaging_dine_in: 175,
    packaging_delivery: 425,
    target_food_cost_pct: 22.0,
    is_hero_bom: false,
  },
  {
    recipe_id: 'TYF-BURRITO',
    brand: 'Tyfel Coffee',
    item_name: 'Breakfast Burrito',
    canonical_name: 'Breakfast Burrito',
    category: 'Litebite & Brunch',
    bom_summary: '1pcs Tortilla Kebab Gilss (Rp 2,450), 1pcs Veggie Way Chicken Katsu (Rp 7,992), 150g Lettuce (Rp 3,150), 15g Mayonnaise (Rp 555), Sauce Tomato & Sambal',
    raw_food_cost: 14628,
    packaging_dine_in: 440,
    packaging_delivery: 2500,
    target_food_cost_pct: 30.0,
    is_hero_bom: false,
  },
  {
    recipe_id: 'TYF-MOCK-CHICK-BUR',
    brand: 'Tyfel Coffee',
    item_name: 'Mock Chicken Burrito',
    canonical_name: 'Mock Chicken Burrito',
    category: 'Litebite & Brunch',
    bom_summary: '1pcs Tortilla Kebab Gilss (Rp 2,450), 1pcs Veggie Way Chicken Katsu (Rp 7,992), 2pcs Telur (Rp 4,067), 50g Potato Nugget (Rp 2,850), 20g Cheddar (Rp 1,010), Lettuce & Mayo',
    raw_food_cost: 19553,
    packaging_dine_in: 440,
    packaging_delivery: 2500,
    target_food_cost_pct: 28.0,
    is_hero_bom: false,
  },
  {
    recipe_id: 'TYF-MOCK-BEEF-SAND',
    brand: 'Tyfel Coffee',
    item_name: 'Mock Beef Sandwich',
    canonical_name: 'Mock Beef Sandwich',
    category: 'Litebite & Brunch',
    bom_summary: '1pcs Madam Bun Burger (Rp 2,767), 60g Vway Mutton / Mock Beef (Rp 3,720), 2pcs Telur (Rp 4,067), 30g Cheesy Melt (Rp 3,492), 15g Mayonnaise (Rp 555)',
    raw_food_cost: 14600,
    packaging_dine_in: 440,
    packaging_delivery: 2500,
    target_food_cost_pct: 28.0,
    is_hero_bom: false,
  },
  {
    recipe_id: 'TYF-FRIES',
    brand: 'Tyfel Coffee',
    item_name: 'French Friess',
    canonical_name: 'French Friess',
    category: 'Litebite & Sides',
    bom_summary: '200g Kentang (Rp 9,200), 2ml Urbani Truffle Oil (Rp 2,906)',
    raw_food_cost: 12106,
    packaging_dine_in: 0,
    packaging_delivery: 2500,
    target_food_cost_pct: 25.0,
    is_hero_bom: false,
  },
  {
    recipe_id: 'TYF-HOME-FRIES',
    brand: 'Tyfel Coffee',
    item_name: 'Home Fries',
    canonical_name: 'Home Fries',
    category: 'Litebite & Sides',
    bom_summary: '200g Kentang (Rp 9,200), 10g Saos Sambal (Rp 273), 10g Sauce Tomato (Rp 208)',
    raw_food_cost: 9681,
    packaging_dine_in: 0,
    packaging_delivery: 2500,
    target_food_cost_pct: 25.0,
    is_hero_bom: false,
  },
  {
    recipe_id: 'TYF-CHICK-CHUNK',
    brand: 'Tyfel Coffee',
    item_name: 'Chic Chunk - Vegan Plantbased',
    canonical_name: 'Chic Chunk - Vegan Plantbased',
    category: 'Litebite & Sides',
    bom_summary: '80g Evergreen Vegan Nugget (Rp 3,600), 5g Mayonnaise (Rp 185), 5g Saos Sambal (Rp 137)',
    raw_food_cost: 3922,
    packaging_dine_in: 0,
    packaging_delivery: 2500,
    target_food_cost_pct: 22.0,
    is_hero_bom: false,
  },
  {
    recipe_id: 'TYF-TOTS',
    brand: 'Tyfel Coffee',
    item_name: 'Tater Tots',
    canonical_name: 'Tater Tots',
    category: 'Litebite & Sides',
    bom_summary: '200g Potato Nugget Golden Farm (Rp 11,400), 5g Saos Sambal (Rp 137), 5g Sauce Tomato (Rp 104)',
    raw_food_cost: 11641,
    packaging_dine_in: 0,
    packaging_delivery: 2500,
    target_food_cost_pct: 28.0,
    is_hero_bom: false,
  },
  {
    recipe_id: 'TYF-RISOTTO',
    brand: 'Tyfel Coffee',
    item_name: 'Risotto',
    canonical_name: 'Risotto',
    category: 'Main Course',
    bom_summary: '1porsi Nasi Putih (Rp 3,000), 30g Jamur Champignon (Rp 2,250), 30g Sauce Bechamel (Rp 1,690), 10g Paprika Merah (Rp 2,250), 10g Paprika Hijau (Rp 1,050), Balsamic & Seasoning',
    raw_food_cost: 12240,
    packaging_dine_in: 0,
    packaging_delivery: 2500,
    target_food_cost_pct: 28.0,
    is_hero_bom: false,
  },
  {
    recipe_id: 'TYF-MOZA-STICK',
    brand: 'Tyfel Coffee',
    item_name: 'Mozarella Stick',
    canonical_name: 'Mozarella Stick',
    category: 'Litebite & Sides',
    bom_summary: '120g Emina Mozzarella (Rp 12,420), 80g Zena Bread Crumbs (Rp 1,840), 1pcs Telur (Rp 2,033), 5g Saos Sambal (Rp 137)',
    raw_food_cost: 16430,
    packaging_dine_in: 0,
    packaging_delivery: 2500,
    target_food_cost_pct: 32.0,
    is_hero_bom: false,
  },

  // ── People Pasta ──
  {
    recipe_id: 'PP-NUGGET',
    brand: 'People Pasta',
    item_name: 'Chicken Nugget - Vegan',
    canonical_name: 'Chicken Nugget - Vegan',
    category: 'Antipasti & Sides',
    bom_summary: '80g Evergreen Vegan Nugget (Rp 3,600), 5g Mayonnaise (Rp 185), 5g Saos Sambal (Rp 137)',
    raw_food_cost: 3922,
    packaging_dine_in: 0,
    packaging_delivery: 2500,
    target_food_cost_pct: 25.0,
    is_hero_bom: false,
  },
  {
    recipe_id: 'PP-CHICK-BURGER',
    brand: 'People Pasta',
    item_name: 'Vegan Chicken Crispy Burger',
    canonical_name: 'Vegan Chicken Crispy Burger',
    category: 'Plant Burgers',
    bom_summary: '1pcs Madam Bun Burger (Rp 2,767), 1pcs Veggie Way Chicken Katsu (Rp 7,992), Lettuce, Tomato, Kyuri, Mayo, 100g French Fries (Rp 4,590)',
    raw_food_cost: 17758,
    packaging_dine_in: 440,
    packaging_delivery: 2500,
    target_food_cost_pct: 28.0,
    is_hero_bom: false,
  },
  {
    recipe_id: 'PP-CACIO',
    brand: 'People Pasta',
    item_name: 'Cacio e Pepe - Vegetarian - Plantbased',
    canonical_name: 'Cacio e Pepe - Vegetarian - Plantbased',
    category: 'Artisanal Pasta',
    bom_summary: '150g Spaghetti San Remo (Rp 10,296), 10g Parmesan Green Valley (Rp 4,653), 20g Mentega (Rp 570), Crushed Black Pepper (Rp 500)',
    raw_food_cost: 16019,
    packaging_dine_in: 0,
    packaging_delivery: 2500,
    target_food_cost_pct: 28.0,
    is_hero_bom: false,
  },
  {
    recipe_id: 'PP-MEATLESS',
    brand: 'People Pasta',
    item_name: 'Meat-less Burger - Vegan',
    canonical_name: 'Meat-less Burger - Vegan',
    category: 'Plant Burgers',
    bom_summary: '1pcs Madam Bun Burger (Rp 2,767), 1pcs Vway / Green Rebel Burger Patty (Rp 12,778), Lettuce, Tomato, Kyuri, Mayo, 100g French Fries (Rp 4,590)',
    raw_food_cost: 22151,
    packaging_dine_in: 440,
    packaging_delivery: 2500,
    target_food_cost_pct: 30.0,
    is_hero_bom: false,
  },
  {
    recipe_id: 'PP-BOLOGNESE',
    brand: 'People Pasta',
    item_name: 'Bolognese - Vegan Friendly - Vegetarian - Plantbase',
    canonical_name: 'Bolognese - Vegan Friendly - Vegetarian - Plantbase',
    category: 'Artisanal Pasta',
    bom_summary: '150g Spaghetti San Remo (Rp 10,296), 100g Sauce Bolognaise (Rp 7,440), 2g Parsley (Rp 200)',
    raw_food_cost: 17936,
    packaging_dine_in: 0,
    packaging_delivery: 2500,
    target_food_cost_pct: 28.0,
    is_hero_bom: false,
  },
  {
    recipe_id: 'PP-TOTS',
    brand: 'People Pasta',
    item_name: 'Tattert Tots',
    canonical_name: 'Tattert Tots',
    category: 'Antipasti & Sides',
    bom_summary: '200g Potato Nugget Golden Farm (Rp 11,400), 5g Saos Sambal (Rp 137), 5g Sauce Tomato (Rp 104)',
    raw_food_cost: 11641,
    packaging_dine_in: 0,
    packaging_delivery: 2500,
    target_food_cost_pct: 28.0,
    is_hero_bom: false,
  },
  {
    recipe_id: 'PP-TRUFFLE-TOTS',
    brand: 'People Pasta',
    item_name: 'Truffle Tatter Tots',
    canonical_name: 'Truffle Tatter Tots',
    category: 'Antipasti & Sides',
    bom_summary: '200g Potato Nugget Golden Farm (Rp 11,400), 2ml Urbani Truffle Oil (Rp 2,906), 5g Saos Sambal (Rp 137)',
    raw_food_cost: 14443,
    packaging_dine_in: 0,
    packaging_delivery: 2500,
    target_food_cost_pct: 28.0,
    is_hero_bom: false,
  },
  {
    recipe_id: 'PP-TRUFFLE-FRIES',
    brand: 'People Pasta',
    item_name: 'Truffle Fries',
    canonical_name: 'Truffle Fries',
    category: 'Antipasti & Sides',
    bom_summary: '200g Kentang (Rp 9,200), 2ml Urbani Truffle Oil (Rp 2,906)',
    raw_food_cost: 12106,
    packaging_dine_in: 0,
    packaging_delivery: 2500,
    target_food_cost_pct: 28.0,
    is_hero_bom: false,
  },

  // ── Herbox ──
  {
    recipe_id: 'HBX-NASGOR-BK',
    brand: 'Herbox',
    item_name: 'Nasi Goreng Bintang Kuning Vegan Vegetarian',
    canonical_name: 'Nasi Goreng Bintang Kuning Vegan Vegetarian',
    category: 'Wok Ricebox',
    bom_summary: '1porsi Nasi Putih (Rp 3,000), 50g Veggie Way Vegan Crispy (Rp 5,300), 1porsi Bumbu Kunyit/Pesmol WIP (Rp 1,735), 50g Lettuce (Rp 1,050), 25g Kyuri (Rp 625)',
    raw_food_cost: 11710,
    packaging_dine_in: 0,
    packaging_delivery: 1043,
    target_food_cost_pct: 28.0,
    is_hero_bom: false,
  },
  {
    recipe_id: 'HBX-NASGOR-SM',
    brand: 'Herbox',
    item_name: 'Nasi Goreng Sedap Malam Vegan Vegetarian',
    canonical_name: 'Nasi Goreng Sedap Malam Vegan Vegetarian',
    category: 'Wok Ricebox',
    bom_summary: '1porsi Nasi Putih (Rp 3,000), 50g Veggie Way Vegan Crispy (Rp 5,300), 0.5porsi Wok Glaze WIP (Rp 1,842), 50g Lettuce (Rp 1,050), 25g Kyuri (Rp 625)',
    raw_food_cost: 11817,
    packaging_dine_in: 0,
    packaging_delivery: 1043,
    target_food_cost_pct: 28.0,
    is_hero_bom: false,
  },
  {
    recipe_id: 'HBX-TERIYAKI',
    brand: 'Herbox',
    item_name: 'Teriyaki Vegan Vegetarian Ricebox',
    canonical_name: 'Teriyaki Vegan Vegetarian Ricebox',
    category: 'Plant Ricebox',
    bom_summary: '100g Beras Cap Bunga (Rp 1,700), 1pcs Veggie Way Ikan Nemo (Rp 5,688), 30ml Saori Teriyaki (Rp 1,590), Lettuce, Kol Ungu, Wortel, Tomat Cherry, Dressing Herbox',
    raw_food_cost: 16219,
    packaging_dine_in: 0,
    packaging_delivery: 1043,
    target_food_cost_pct: 30.0,
    is_hero_bom: false,
  },
  {
    recipe_id: 'HBX-PESMOL',
    brand: 'Herbox',
    item_name: 'Pesmol Vegan Vegetarian Ricebox',
    canonical_name: 'Pesmol Vegan Vegetarian Ricebox',
    category: 'Plant Ricebox',
    bom_summary: '100g Beras Cap Bunga (Rp 1,700), 1pcs Veggie Way Ikan Nemo (Rp 5,688), 1porsi Sauce Pesmol WIP (Rp 1,735), Lettuce, Kol Ungu, Wortel, Tomat Cherry, Dressing Herbox',
    raw_food_cost: 16364,
    packaging_dine_in: 0,
    packaging_delivery: 1043,
    target_food_cost_pct: 30.0,
    is_hero_bom: false,
  },
  {
    recipe_id: 'HBX-BLACKPEPPER',
    brand: 'Herbox',
    item_name: 'Lada Hitam Blackpepper Vegan Vegetarian Ricebox',
    canonical_name: 'Lada Hitam Blackpepper Vegan Vegetarian Ricebox',
    category: 'Plant Ricebox',
    bom_summary: '100g Beras Cap Bunga (Rp 1,700), 65g Vway Vegan Mutton (Rp 4,030), 1porsi Sauce Lada Hitam WIP (Rp 1,550), Lettuce, Kol Ungu, Wortel, Tomat Cherry, Dressing Herbox',
    raw_food_cost: 14521,
    packaging_dine_in: 0,
    packaging_delivery: 1043,
    target_food_cost_pct: 30.0,
    is_hero_bom: false,
  },
  {
    recipe_id: 'HBX-RICA',
    brand: 'Herbox',
    item_name: 'Rica Rica Vegan Vegetarian Ricebox',
    canonical_name: 'Rica Rica Vegan Vegetarian Ricebox',
    category: 'Plant Ricebox',
    bom_summary: '100g Beras Cap Bunga (Rp 1,700), 65g Veggie Way Vegan Crispy (Rp 6,890), 1porsi Sauce Rica-Rica WIP (Rp 3,340), Lettuce, Kol Ungu, Wortel, Tomat Cherry, Dressing Herbox',
    raw_food_cost: 19171,
    packaging_dine_in: 0,
    packaging_delivery: 1043,
    target_food_cost_pct: 30.0,
    is_hero_bom: false,
  },
  {
    recipe_id: 'HBX-KATSU-RICE',
    brand: 'Herbox',
    item_name: 'Katsu Chickin Vegan Vegetarian Ricebox',
    canonical_name: 'Katsu Chickin Vegan Vegetarian Ricebox',
    category: 'Plant Ricebox',
    bom_summary: '100g Beras Cap Bunga (Rp 1,700), 1pcs Veggie Way Chicken Katsu (Rp 7,992), Lettuce, Kol Ungu, Wortel, Tomat Cherry, Dressing Herbox',
    raw_food_cost: 16933,
    packaging_dine_in: 0,
    packaging_delivery: 1043,
    target_food_cost_pct: 30.0,
    is_hero_bom: false,
  },
  {
    recipe_id: 'HBX-BEEF-MENTAI',
    brand: 'Herbox',
    item_name: 'Beef Mentai Vegan Vegetarian Rice',
    canonical_name: 'Beef Mentai Vegan Vegetarian Rice',
    category: 'Plant Ricebox',
    bom_summary: '100g Beras Cap Bunga (Rp 1,700), 65g Vway Vegan Mutton (Rp 4,030), 1porsi Sauce Mentai WIP (Rp 1,700), Lettuce, Kol Ungu, Wortel, Tomat Cherry, Dressing Herbox',
    raw_food_cost: 14671,
    packaging_dine_in: 0,
    packaging_delivery: 1043,
    target_food_cost_pct: 30.0,
    is_hero_bom: false,
  },
  {
    recipe_id: 'HBX-FYSH-MENTAI',
    brand: 'Herbox',
    item_name: 'Fysh Mentai',
    canonical_name: 'Fysh Mentai',
    category: 'Plant Ricebox',
    bom_summary: '100g Beras Cap Bunga (Rp 1,700), 1pcs Veggie Way Ikan Nemo (Rp 5,688), 1porsi Sauce Mentai WIP (Rp 1,700), Lettuce, Kol Ungu, Wortel, Tomat Cherry, Dressing Herbox',
    raw_food_cost: 16329,
    packaging_dine_in: 0,
    packaging_delivery: 1043,
    target_food_cost_pct: 30.0,
    is_hero_bom: false,
  },
  {
    recipe_id: 'HBX-BEEF-WRAP',
    brand: 'Herbox',
    item_name: 'Beef  wrap Vegan Herbox',
    canonical_name: 'Beef  wrap Vegan Herbox',
    category: 'Plant Wraps',
    bom_summary: '1pcs Tortilla Kebab Gilss (Rp 2,450), 60g Vway Vegan Mutton (Rp 3,720), 150g Lettuce (Rp 3,150), 30g Mayonnaise (Rp 1,110), 30g Sauce Tomato (Rp 624)',
    raw_food_cost: 11054,
    packaging_dine_in: 440,
    packaging_delivery: 1043,
    target_food_cost_pct: 28.0,
    is_hero_bom: false,
  },
  {
    recipe_id: 'HBX-RICA-WRAP',
    brand: 'Herbox',
    item_name: 'Rica Wrap',
    canonical_name: 'Rica Wrap',
    category: 'Plant Wraps',
    bom_summary: '1pcs Tortilla Kebab Gilss (Rp 2,450), 65g Veggie Way Vegan Crispy (Rp 6,890), 1porsi Sauce Rica-Rica WIP (Rp 3,340), 150g Lettuce (Rp 3,150)',
    raw_food_cost: 15830,
    packaging_dine_in: 440,
    packaging_delivery: 1043,
    target_food_cost_pct: 28.0,
    is_hero_bom: false,
  },
  {
    recipe_id: 'HBX-KATSU-WRAP',
    brand: 'Herbox',
    item_name: 'Katsu Wrap vegan Herbox',
    canonical_name: 'Katsu Wrap vegan Herbox',
    category: 'Plant Wraps',
    bom_summary: '1pcs Tortilla Kebab Gilss (Rp 2,450), 1pcs Veggie Way Chicken Katsu (Rp 7,992), 150g Lettuce (Rp 3,150), 15g Mayonnaise (Rp 555), Sauce Tomato & Sambal',
    raw_food_cost: 14628,
    packaging_dine_in: 440,
    packaging_delivery: 1043,
    target_food_cost_pct: 28.0,
    is_hero_bom: false,
  },
  {
    recipe_id: 'HBX-TOTS',
    brand: 'Herbox',
    item_name: 'Tater tots',
    canonical_name: 'Tater tots',
    category: 'Sides & Snacks',
    bom_summary: '200g Potato Nugget Golden Farm (Rp 11,400), 5g Saos Sambal (Rp 137), 5g Sauce Tomato (Rp 104)',
    raw_food_cost: 11641,
    packaging_dine_in: 0,
    packaging_delivery: 1043,
    target_food_cost_pct: 28.0,
    is_hero_bom: false,
  },
  {
    recipe_id: 'HBX-NUGGET',
    brand: 'Herbox',
    item_name: 'Vegan Chickin Nugget',
    canonical_name: 'Vegan Chickin Nugget',
    category: 'Sides & Snacks',
    bom_summary: '80g Evergreen Vegan Nugget (Rp 3,600), 5g Mayonnaise (Rp 185), 5g Saos Sambal (Rp 137)',
    raw_food_cost: 3922,
    packaging_dine_in: 0,
    packaging_delivery: 1043,
    target_food_cost_pct: 25.0,
    is_hero_bom: false,
  },

  // ── LA Breakfast Club ──
  {
    recipe_id: 'LABC-CHICK-BUR',
    brand: 'LA Breakfast Club',
    item_name: 'Mock Chicken Burrito',
    canonical_name: 'Mock Chicken Burrito',
    category: 'West Coast Burritos',
    bom_summary: '1pcs Tortilla Kebab Gilss (Rp 2,450), 1pcs Veggie Way Chicken Katsu (Rp 7,992), 2pcs Telur (Rp 4,067), 50g Potato Nugget (Rp 2,850), 20g Cheddar (Rp 1,010), Lettuce & Mayo',
    raw_food_cost: 19553,
    packaging_dine_in: 440,
    packaging_delivery: 2500,
    target_food_cost_pct: 28.0,
    is_hero_bom: false,
  },
];

function sqlEscape(val: string): string {
  return val.replace(/'/g, "''");
}

async function initializeSchemaAndSeed(db: DuckDBInstance, isRemoteHttp = false): Promise<void> {
  const conn = await db.connect();
  try {
    await conn.run(`
      CREATE TABLE IF NOT EXISTS fact_orders (
        dedup_id VARCHAR PRIMARY KEY,
        order_id VARCHAR,
        external_id VARCHAR,
        short_id VARCHAR,
        provider VARCHAR,
        brand VARCHAR,
        branch VARCHAR,
        status VARCHAR,
        gross_amount DOUBLE,
        net_payout DOUBLE,
        merchant_promo_burn DOUBLE,
        provider_promo_burn DOUBLE,
        delivery_fee DOUBLE,
        net_sales DOUBLE,
        net_realization_rate DOUBLE,
        order_type VARCHAR,
        meal_prep_time_raw VARCHAR,
        prep_time_minutes DOUBLE,
        kpt_sla_breach BOOLEAN,
        kpt_red_alert BOOLEAN,
        created_at TIMESTAMP,
        delivered_at TIMESTAMP,
        source_file VARCHAR,
        ingested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await conn.run(`
      CREATE TABLE IF NOT EXISTS fact_order_items (
        dedup_id VARCHAR PRIMARY KEY,
        order_id VARCHAR,
        external_id VARCHAR,
        provider VARCHAR,
        brand VARCHAR,
        branch VARCHAR,
        item_name VARCHAR,
        category VARCHAR,
        item_qty DOUBLE,
        item_price DOUBLE,
        total_price DOUBLE,
        created_at TIMESTAMP,
        status VARCHAR,
        source_file VARCHAR,
        ingested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await conn.run(`
      CREATE TABLE IF NOT EXISTS dim_recipes (
        recipe_id VARCHAR PRIMARY KEY,
        brand VARCHAR NOT NULL,
        item_name VARCHAR NOT NULL,
        canonical_name VARCHAR NOT NULL,
        category VARCHAR NOT NULL,
        bom_summary VARCHAR NOT NULL,
        raw_food_cost DOUBLE NOT NULL,
        packaging_dine_in DOUBLE NOT NULL,
        packaging_delivery DOUBLE NOT NULL,
        target_food_cost_pct DOUBLE NOT NULL,
        is_hero_bom BOOLEAN DEFAULT FALSE,
        updated_at TIMESTAMP
      );
    `);

    const recipeCountRes = await conn.run(`SELECT count(*) FROM dim_recipes`);
    const recipeCountRows = await recipeCountRes.getRows();
    const existingRecipeCount = Number(recipeCountRows[0]?.[0] ?? 0);
    let didWrite = false;

    if (existingRecipeCount < MASTER_RECIPES.length) {
      const RECIPE_BATCH_SIZE = 10;
      for (let i = 0; i < MASTER_RECIPES.length; i += RECIPE_BATCH_SIZE) {
        const chunk = MASTER_RECIPES.slice(i, i + RECIPE_BATCH_SIZE);
        const valuesSql = chunk
          .map(
            (r) => `(
              '${sqlEscape(r.recipe_id)}',
              '${sqlEscape(r.brand)}',
              '${sqlEscape(r.item_name)}',
              '${sqlEscape(r.canonical_name)}',
              '${sqlEscape(r.category)}',
              '${sqlEscape(r.bom_summary)}',
              ${r.raw_food_cost},
              ${r.packaging_dine_in},
              ${r.packaging_delivery},
              ${r.target_food_cost_pct},
              ${r.is_hero_bom ? 'TRUE' : 'FALSE'},
              CURRENT_TIMESTAMP
            )`
          )
          .join(',\n');

        await conn.run(`
          INSERT INTO dim_recipes (
            recipe_id, brand, item_name, canonical_name, category, bom_summary,
            raw_food_cost, packaging_dine_in, packaging_delivery, target_food_cost_pct,
            is_hero_bom, updated_at
          )
          VALUES ${valuesSql}
          ON CONFLICT (recipe_id) DO UPDATE SET
            brand = EXCLUDED.brand,
            item_name = EXCLUDED.item_name,
            canonical_name = EXCLUDED.canonical_name,
            category = EXCLUDED.category,
            bom_summary = EXCLUDED.bom_summary,
            raw_food_cost = EXCLUDED.raw_food_cost,
            packaging_dine_in = EXCLUDED.packaging_dine_in,
            packaging_delivery = EXCLUDED.packaging_delivery,
            target_food_cost_pct = EXCLUDED.target_food_cost_pct,
            is_hero_bom = EXCLUDED.is_hero_bom,
            updated_at = EXCLUDED.updated_at;
        `);
      }
      didWrite = true;
    }

    await conn.run(`
      CREATE TABLE IF NOT EXISTS dim_order_cancellations (
        order_id VARCHAR PRIMARY KEY,
        external_id VARCHAR,
        short_id VARCHAR,
        provider VARCHAR,
        brand VARCHAR,
        branch VARCHAR,
        status VARCHAR,
        gross_amount DOUBLE,
        net_payout DOUBLE,
        merchant_promo_burn DOUBLE,
        provider_promo_burn DOUBLE,
        cancellation_reason VARCHAR,
        cancelled_by VARCHAR,
        menu_items_summary VARCHAR,
        items_ordered INTEGER,
        meal_prep_time_raw VARCHAR,
        prep_time_minutes DOUBLE,
        created_at TIMESTAMP,
        source_file VARCHAR
      );
    `);

    const cancelCountRes = await conn.run(`SELECT count(*) FROM dim_order_cancellations`);
    const cancelCountRows = await cancelCountRes.getRows();
    const existingCancelCount = Number(cancelCountRows[0]?.[0] ?? 0);

    if (existingCancelCount === 0 && !isRemoteHttp) {
      for (const rawReportsDir of getRawReportsReadDirs()) {
        const klikitOrderFiles = fs
          .readdirSync(rawReportsDir)
          .filter((f) => f.startsWith('klikit_orders_') && f.endsWith('.csv'))
          .sort();

        for (const f of klikitOrderFiles) {
          const fullCsvPath = path.join(rawReportsDir, f);
          await conn.run(`
            INSERT INTO dim_order_cancellations (
              order_id, external_id, short_id, provider, brand, branch, status,
              gross_amount, net_payout, merchant_promo_burn, provider_promo_burn,
              cancellation_reason, cancelled_by, menu_items_summary, items_ordered,
              meal_prep_time_raw, prep_time_minutes, created_at, source_file
            )
            SELECT
              CAST("Order ID" AS VARCHAR) AS order_id,
              CAST("External ID" AS VARCHAR) AS external_id,
              CAST("Short ID" AS VARCHAR) AS short_id,
              CASE
                WHEN LOWER("Provider") LIKE '%grab%' THEN 'GrabFood'
                WHEN LOWER("Provider") LIKE '%go%' THEN 'GoFood'
                ELSE "Provider"
              END AS provider,
              trim(both '"' from "Brand") AS brand,
              "Branch" AS branch,
              UPPER(TRIM("Status")) AS status,
              COALESCE(TRY_CAST("Gross Order Value" AS DOUBLE), 0) AS gross_amount,
              COALESCE(TRY_CAST("Net Order Value" AS DOUBLE), 0) AS net_payout,
              COALESCE(TRY_CAST("Merchant Discount" AS DOUBLE), 0) AS merchant_promo_burn,
              COALESCE(TRY_CAST("Provider Discount" AS DOUBLE), 0) AS provider_promo_burn,
              CASE
                WHEN "Cancellation Reason" IS NULL OR TRIM("Cancellation Reason") IN ('', '-', 'N/A', 'null') THEN 'UNSPECIFIED_PLATFORM_CANCEL'
                ELSE UPPER(TRIM("Cancellation Reason"))
              END AS cancellation_reason,
              CASE
                WHEN "Cancelled By" IS NULL OR TRIM("Cancelled By") IN ('', '-', 'N/A', 'null') THEN 'unspecified'
                ELSE LOWER(TRIM("Cancelled By"))
              END AS cancelled_by,
              trim(both '"' from COALESCE("Menu Items", '')) AS menu_items_summary,
              COALESCE(TRY_CAST("Items Ordered" AS INTEGER), 1) AS items_ordered,
              COALESCE("Meal Preparation Time", 'N/A') AS meal_prep_time_raw,
              TRY_CAST(regexp_extract("Meal Preparation Time", '(\\d+)\\s*min', 1) AS DOUBLE) +
                COALESCE(TRY_CAST(regexp_extract("Meal Preparation Time", '(\\d+)\\s*sec', 1) AS DOUBLE) / 60.0, 0.0) AS prep_time_minutes,
              TRY_STRPTIME("Created At", '%B %d, %Y %I:%M:%S%p') AS created_at,
              '${sqlEscape(f)}' AS source_file
            FROM read_csv_auto('${sqlEscape(fullCsvPath)}', ignore_errors=true)
            WHERE UPPER(TRIM("Status")) IN ('CANCELLED', 'CANCELED')
            ON CONFLICT (order_id) DO UPDATE SET
              provider = EXCLUDED.provider,
              brand = EXCLUDED.brand,
              branch = EXCLUDED.branch,
              status = EXCLUDED.status,
              gross_amount = EXCLUDED.gross_amount,
              net_payout = EXCLUDED.net_payout,
              merchant_promo_burn = EXCLUDED.merchant_promo_burn,
              provider_promo_burn = EXCLUDED.provider_promo_burn,
              cancellation_reason = EXCLUDED.cancellation_reason,
              cancelled_by = EXCLUDED.cancelled_by,
              menu_items_summary = EXCLUDED.menu_items_summary,
              items_ordered = EXCLUDED.items_ordered,
              meal_prep_time_raw = EXCLUDED.meal_prep_time_raw,
              prep_time_minutes = EXCLUDED.prep_time_minutes,
              created_at = EXCLUDED.created_at,
              source_file = EXCLUDED.source_file;
          `);
          didWrite = true;
        }
      }
    }

    if (didWrite) {
      await conn.run(`CHECKPOINT;`);
    }
  } catch (err) {
    console.warn('[DuckDB Seed Notice] Could not write dim_recipes / dim_order_cancellations on init:', err);
  } finally {
    try {
      conn.closeSync();
    } catch {
      // ignore close errors
    }
  }
}

function copySeedToTarget(seedPath: string, targetPath: string): void {
  fs.mkdirSync(path.dirname(targetPath), { recursive: true });
  const tmpCopyPath = `${targetPath}.${process.pid}.tmp`;
  fs.copyFileSync(seedPath, tmpCopyPath);
  try {
    fs.renameSync(tmpCopyPath, targetPath);
  } catch {
    try {
      fs.unlinkSync(tmpCopyPath);
    } catch {
      // ignore
    }
  }
}

const DEFAULT_LAYERBASE_SQL_ENDPOINT = 'https://api.sage.cloud.layerbase.dev/sql';
const DEFAULT_LAYERBASE_QUERY_URL =
  'https://tyfel-cockpit-poor-hedge.sage.cloud.layerbase.dev/v1/databases/36373641-c5db-463e-975c-0d636a0c92c5/query';

let envLocalLoaded = false;
function ensureLocalEnvLoaded(): void {
  if (envLocalLoaded) return;
  envLocalLoaded = true;
  if (process.env.LAYERBASE_CONNECTION_STRING || process.env.LAYERBASE_API_KEY) return;
  try {
    const envPath = path.join(process.cwd(), '.env.local');
    if (!fs.existsSync(envPath)) return;
    const content = fs.readFileSync(envPath, 'utf-8');
    for (const rawLine of content.split(/\r?\n/)) {
      const line = rawLine.trim();
      if (!line || line.startsWith('#')) continue;
      const eqIdx = line.indexOf('=');
      if (eqIdx <= 0) continue;
      const key = line.slice(0, eqIdx).trim();
      const val = line.slice(eqIdx + 1).trim().replace(/^['"]|['"]$/g, '');
      if (key && process.env[key] === undefined) {
        process.env[key] = val;
      }
    }
  } catch {
    // ignore env read errors
  }
}

const STRING_ID_COLUMNS = new Set([
  'order_id',
  'external_id',
  'short_id',
  'dedup_id',
  'item_dedup_id',
  'recipe_id',
  'attendance_id',
  'period_key',
  'clock_in',
  'clock_out',
  'shift_start_time',
  'shift_start_override',
  'work_date',
  'work_date_str',
  'max_d',
  'min_d',
  'dt',
  'date',
  'day',
  'customer_id',
  'package_id',
  'delivery_id',
  'delivery_date',
  'start_date',
  'manual_last_date',
  'phone',
  'raw_sheet_val',
]);

function normalizeLayerbaseValue(val: unknown, colName: string, dataTypeID?: number): unknown {
  // Postgres OID 20 = INT8 (BIGINT), 21 = INT2, 23 = INT4, 700 = FLOAT4, 701 = FLOAT8, 1700 = NUMERIC
  if (typeof val === 'string' && dataTypeID && [20, 21, 23, 700, 701, 1700].includes(dataTypeID)) {
    const num = Number(val);
    if (!Number.isNaN(num)) return num;
  }
  if (typeof val === 'string' && /^-?\d+$/.test(val) && !STRING_ID_COLUMNS.has(colName.toLowerCase())) {
    const num = Number(val);
    if (Number.isSafeInteger(num)) {
      return num;
    }
  }
  return val;
}

const QUERY_CACHE_TTL_MS = 60_000; // 60s TTL for read queries, auto-invalidated on any write
const MAX_CACHE_ENTRIES = 500;

interface CachedQueryEntry {
  rows: unknown[];
  expiresAt: number;
}

const globalForDuckCache = globalThis as unknown as {
  __fnbQueryResultCache?: Map<string, CachedQueryEntry>;
  __fnbInFlightQueries?: Map<string, Promise<unknown[]>>;
};

const queryResultCache =
  globalForDuckCache.__fnbQueryResultCache ||
  (globalForDuckCache.__fnbQueryResultCache = new Map<string, CachedQueryEntry>());

const inFlightQueries =
  globalForDuckCache.__fnbInFlightQueries ||
  (globalForDuckCache.__fnbInFlightQueries = new Map<string, Promise<unknown[]>>());

export function invalidateQueryCache(): void {
  queryResultCache.clear();
  inFlightQueries.clear();
}

function normalizeSqlKey(sql: string): string {
  return sql.trim().replace(/\s+/g, ' ');
}

function isMutatingSql(sql: string): boolean {
  const trimmed = sql.trim().replace(/^\/\*[\s\S]*?\*\/\s*/, '');
  if (/^CREATE\s+TABLE\s+IF\s+NOT\s+EXISTS\b/i.test(trimmed)) {
    return false;
  }
  return /^(INSERT\s+INTO|UPDATE\s+\S+|DELETE\s+FROM|DROP\s+|ALTER\s+|CREATE\s+|TRUNCATE\s+|REPLACE\s+INTO)\b/i.test(
    trimmed
  );
}

function isReadOnlySql(sql: string): boolean {
  const trimmed = sql.trim().replace(/^\/\*[\s\S]*?\*\/\s*/, '');
  return /^(SELECT|WITH|SHOW|DESCRIBE|EXPLAIN|PRAGMA)\b/i.test(trimmed) && !isMutatingSql(trimmed);
}

function createLayerbaseHttpInstance(options: {
  sqlEndpoint?: string;
  connectionString?: string;
  queryUrl?: string;
  apiKey?: string;
}): DuckDBInstance {
  const sqlEndpoint = (options.sqlEndpoint || DEFAULT_LAYERBASE_SQL_ENDPOINT).trim();
  const connStr = (options.connectionString || '').trim();
  const fallbackQueryUrl = (options.queryUrl || DEFAULT_LAYERBASE_QUERY_URL).trim();
  const fallbackApiKey = (options.apiKey || '').trim();

  const conn = {
    async run(sql: string) {
      const normalized = sql.trim().replace(/;+\s*$/, '').toUpperCase();
      if (normalized === 'CHECKPOINT' || normalized === 'FORCE CHECKPOINT') {
        return {
          columnNames: () => [] as string[],
          getRows: async () => [] as unknown[][],
        };
      }

      if (isMutatingSql(sql)) {
        invalidateQueryCache();
      }

      // Primary: Layerbase Serverless SQL HTTP Endpoint (/sql) — No 10 KB limit
      if (sqlEndpoint && connStr) {
        const res = await fetch(sqlEndpoint, {
          method: 'POST',
          headers: {
            'Neon-Connection-String': connStr,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ query: sql, params: [] }),
          cache: 'no-store',
        });

        if (!res.ok) {
          const errBody = await res.text();
          throw new Error(`[Layerbase SQL HTTP ${res.status}] ${errBody}`);
        }

        const payload = (await res.json()) as {
          fields?: Array<{ name: string; dataTypeID?: number }>;
          columns?: string[];
          rows?: unknown[][];
          error?: string;
        };

        if (payload.error) {
          throw new Error(`[Layerbase Query Error] ${payload.error}`);
        }

        const fields = Array.isArray(payload.fields) ? payload.fields : [];
        const columns =
          fields.length > 0
            ? fields.map((f) => f.name)
            : Array.isArray(payload.columns)
              ? payload.columns
              : [];
        const typeIds = fields.map((f) => f.dataTypeID);
        const rawRows = Array.isArray(payload.rows) ? payload.rows : [];
        const rows: unknown[][] = rawRows.map((r) => {
          if (Array.isArray(r)) {
            return r.map((val, idx) => normalizeLayerbaseValue(val, columns[idx] || '', typeIds[idx]));
          }
          if (r && typeof r === 'object') {
            return columns.map((c, idx) =>
              normalizeLayerbaseValue((r as Record<string, unknown>)[c], c, typeIds[idx])
            );
          }
          return [r];
        });

        return {
          columnNames: () => columns,
          getRows: async () => rows,
        };
      }

      // Secondary: Management Query API (/v1/databases/:id/query)
      const res = await fetch(fallbackQueryUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${fallbackApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: sql }),
        cache: 'no-store',
      });

      if (!res.ok) {
        const errBody = await res.text();
        throw new Error(`[Layerbase HTTP ${res.status}] ${errBody}`);
      }

      const payload = (await res.json()) as {
        columns?: string[];
        rows?: unknown[][];
        error?: string;
      };

      if (payload.error) {
        throw new Error(`[Layerbase Query Error] ${payload.error}`);
      }

      const columns = Array.isArray(payload.columns) ? payload.columns : [];
      const rawRows = Array.isArray(payload.rows) ? payload.rows : [];
      const rows: unknown[][] = rawRows.map((r) => {
        if (Array.isArray(r)) {
          return r.map((val, idx) => normalizeLayerbaseValue(val, columns[idx] || ''));
        }
        if (r && typeof r === 'object') {
          return columns.map((c) => normalizeLayerbaseValue((r as Record<string, unknown>)[c], c));
        }
        return [r];
      });

      return {
        columnNames: () => columns,
        getRows: async () => rows,
      };
    },
    closeSync() {
      // Stateless HTTP connection; no socket to close
    },
  };

  return {
    async connect() {
      return conn as unknown as DuckDBConnection;
    },
  } as unknown as DuckDBInstance;
}

export async function getDuckDB(): Promise<DuckDBInstance> {
  if (dbInstance) return dbInstance;
  if (!dbInitPromise) {
    dbInitPromise = (async () => {
      ensureLocalEnvLoaded();
      const connectionString =
        process.env.LAYERBASE_CONNECTION_STRING || process.env.DATABASE_URL || '';
      const apiKey = process.env.LAYERBASE_API_KEY || '';

      if (process.env.LAYERBASE_DISABLED !== 'true' && (connectionString || apiKey)) {
        const instance = createLayerbaseHttpInstance({
          sqlEndpoint: process.env.LAYERBASE_SQL_ENDPOINT || DEFAULT_LAYERBASE_SQL_ENDPOINT,
          connectionString,
          queryUrl: process.env.LAYERBASE_QUERY_URL || DEFAULT_LAYERBASE_QUERY_URL,
          apiKey,
        });
        dbInstance = instance;
        return instance;
      }

      const { DuckDBInstance } = await import('@duckdb/node-api');
      let dbPath = resolveRuntimeDbPath();
      const seedPath = getSeedDbPath();

      if (!fs.existsSync(dbPath) && seedPath && seedPath !== dbPath) {
        try {
          copySeedToTarget(seedPath, dbPath);
        } catch (copyErr) {
          console.warn('[DuckDB Seed Copy] Failed copying seed DB to runtime path:', copyErr);
        }
      }

      let instance: DuckDBInstance;
      let isReadOnly = false;
      try {
        instance = await DuckDBInstance.create(dbPath);
      } catch (err) {
        const msg = String(err);
        const walPath = `${dbPath}.wal`;
        if (msg.includes('replaying WAL file') && fs.existsSync(walPath)) {
          console.warn('[DuckDB WAL Recovery] Removing unreplayable WAL file and re-initializing:', walPath);
          try {
            fs.unlinkSync(walPath);
          } catch {
            // ignore unlink errors
          }
          instance = await DuckDBInstance.create(dbPath);
        } else if (
          msg.includes('Conflicting lock') ||
          msg.includes('Read-only file system') ||
          msg.includes('Cannot open file') ||
          msg.includes('EROFS') ||
          msg.includes('EACCES')
        ) {
          try {
            const fallbackPath = path.join(TMP_DIR, `fnb_analytics_${process.pid}.duckdb`);
            const sourceForFallback = seedPath || (fs.existsSync(dbPath) ? dbPath : null);
            if (sourceForFallback && !fs.existsSync(fallbackPath)) {
              copySeedToTarget(sourceForFallback, fallbackPath);
            }
            console.warn('[DuckDB Fallback] Using isolated writable /tmp copy:', fallbackPath);
            dbPath = fallbackPath;
            instance = await DuckDBInstance.create(fallbackPath);
          } catch {
            const roSource = seedPath || dbPath;
            console.warn('[DuckDB Read-Only Fallback] Opening seed DB in READ_ONLY mode:', roSource);
            isReadOnly = true;
            instance = await DuckDBInstance.create(roSource, { access_mode: 'READ_ONLY' });
          }
        } else {
          dbInitPromise = null;
          throw err;
        }
      }
      if (!isReadOnly) {
        await initializeSchemaAndSeed(instance);
        const { initializeAttendanceSchemaAndSeed } = await import('./attendance');
        await initializeAttendanceSchemaAndSeed(instance);
      }
      dbInstance = instance;
      return instance;
    })();
  }
  return dbInitPromise;
}

export async function resetDuckDB(): Promise<void> {
  dbInstance = null;
  dbInitPromise = null;
  invalidateQueryCache();
}

export async function runQuery<T = Record<string, unknown>>(sql: string): Promise<T[]> {
  const cacheable = isReadOnlySql(sql);
  const cacheKey = cacheable ? normalizeSqlKey(sql) : '';

  if (cacheable) {
    const now = Date.now();
    const cached = queryResultCache.get(cacheKey);
    if (cached && cached.expiresAt > now) {
      return cached.rows as T[];
    }
    const existingInFlight = inFlightQueries.get(cacheKey);
    if (existingInFlight) {
      return (await existingInFlight) as T[];
    }
  } else if (isMutatingSql(sql)) {
    invalidateQueryCache();
  }

  const executePromise = (async (): Promise<T[]> => {
    const db = await getDuckDB();
    let conn: DuckDBConnection | null = null;
    try {
      conn = await db.connect();
      const res = await conn.run(sql);
      const colNames = res.columnNames();
      const rawRows = await res.getRows();

      const mapped = rawRows.map((row) => {
        const obj: Record<string, unknown> = {};
        colNames.forEach((col, idx) => {
          const val = row[idx];
          obj[col] = typeof val === 'bigint' ? Number(val) : val;
        });
        return obj as T;
      });

      if (cacheable) {
        if (queryResultCache.size >= MAX_CACHE_ENTRIES) {
          const oldestKey = queryResultCache.keys().next().value;
          if (oldestKey) queryResultCache.delete(oldestKey);
        }
        queryResultCache.set(cacheKey, {
          rows: mapped,
          expiresAt: Date.now() + QUERY_CACHE_TTL_MS,
        });
      }

      return mapped;
    } catch (error) {
      console.error('[DuckDB Query Error]', error, 'SQL:', sql);
      throw error;
    } finally {
      if (cacheable) {
        inFlightQueries.delete(cacheKey);
      }
      if (conn) {
        try {
          conn.closeSync();
        } catch {
          // ignore close errors
        }
      }
    }
  })();

  if (cacheable) {
    inFlightQueries.set(cacheKey, executePromise as Promise<unknown[]>);
  }

  return executePromise;
}


