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
  // 4 Hero SKUs (Track B Master Specification) + Exact Item Aliases
  // =========================================================================
  {
    recipe_id: 'HERO-TYFEL-KGA',
    brand: 'Tyfel Coffee',
    item_name: 'Kopi Gula Aren',
    canonical_name: 'Kopi Gula Aren',
    category: 'Signature Espresso',
    bom_summary: '18g espresso blend, 25ml organic aren palm sugar, 120ml oat/plant base, crystal ice | Pkg: 12oz cold cup, lid, straw, seal',
    raw_food_cost: 5200,
    packaging_dine_in: 0,
    packaging_delivery: 1950,
    target_food_cost_pct: 18.0,
    is_hero_bom: true,
  },
  {
    recipe_id: 'HERO-ABC-CBB-CANONICAL',
    brand: 'American Breakfast Club',
    item_name: 'Classic Breakfast Burrito',
    canonical_name: 'Classic Breakfast Burrito',
    category: 'All-Day Burritos',
    bom_summary: '10" flour tortilla, 120g seasoned scramble & black beans, 40g plant-based sausage/katsu, cheddar, avocado smash, pico | Pkg: foil wrap, kraft bag',
    raw_food_cost: 18500,
    packaging_dine_in: 450,
    packaging_delivery: 2800,
    target_food_cost_pct: 28.0,
    is_hero_bom: true,
  },
  {
    recipe_id: 'HERO-ABC-CBB-KATSU',
    brand: 'American Breakfast Club',
    item_name: 'Burrito - Mock Katsu, 2 Scrambled Eggs, Cheddar, Avocado, Tater Tots',
    canonical_name: 'Classic Breakfast Burrito (Mock Katsu)',
    category: 'All-Day Burritos',
    bom_summary: '10" tortilla, 120g scramble & black beans, 40g soy katsu/sausage, cheddar, avocado smash, tater tots | Pkg: foil wrap, kraft bag',
    raw_food_cost: 18500,
    packaging_dine_in: 450,
    packaging_delivery: 2800,
    target_food_cost_pct: 28.0,
    is_hero_bom: true,
  },
  {
    recipe_id: 'HERO-PP-CTM-CANONICAL',
    brand: 'People Pasta',
    item_name: 'Creamy Truffle Mushroom',
    canonical_name: 'Creamy Truffle Mushroom',
    category: 'Artisanal Pasta',
    bom_summary: '110g dry penne, 90g champignon & shimeji, cashew-oat cream, 5ml white truffle oil, plant-based parm | Pkg: kraft round bowl, PET lid, cutlery',
    raw_food_cost: 14200,
    packaging_dine_in: 0,
    packaging_delivery: 3200,
    target_food_cost_pct: 28.0,
    is_hero_bom: true,
  },
  {
    recipe_id: 'HERO-PP-CTM-POS',
    brand: 'People Pasta',
    item_name: 'Creamy Mushroom - Vegetarian - Plantbased',
    canonical_name: 'Creamy Truffle Mushroom',
    category: 'Artisanal Pasta',
    bom_summary: '110g dry penne, 90g champignon & shimeji, cashew-oat cream, 5ml white truffle oil, plant-based parm | Pkg: kraft round bowl, PET lid, cutlery',
    raw_food_cost: 14200,
    packaging_dine_in: 0,
    packaging_delivery: 3200,
    target_food_cost_pct: 28.0,
    is_hero_bom: true,
  },
  {
    recipe_id: 'HERO-HBX-KPC-CANONICAL',
    brand: 'Herbox',
    item_name: "Kung Pao Chick'n Ricebox",
    canonical_name: "Kung Pao Chick'n Ricebox",
    category: 'Plant Ricebox',
    bom_summary: "180g jasmine rice, 100g soy chick'n bites, roasted Szechuan chili, peanuts, diced zucchini, soy-ginger reduction | Pkg: leak-proof box, cutlery",
    raw_food_cost: 13800,
    packaging_dine_in: 0,
    packaging_delivery: 2500,
    target_food_cost_pct: 28.0,
    is_hero_bom: true,
  },
  {
    recipe_id: 'HERO-HBX-KPC-POS',
    brand: 'Herbox',
    item_name: 'Kung Paow Chick Vegan Vegetarian Ricebox',
    canonical_name: "Kung Pao Chick'n Ricebox",
    category: 'Plant Ricebox',
    bom_summary: "180g jasmine rice, 100g soy chick'n bites, roasted Szechuan chili, peanuts, diced zucchini, soy-ginger reduction | Pkg: leak-proof box, cutlery",
    raw_food_cost: 13800,
    packaging_dine_in: 0,
    packaging_delivery: 2500,
    target_food_cost_pct: 28.0,
    is_hero_bom: true,
  },
  {
    recipe_id: 'HERO-LABC-CO',
    brand: 'LA Breakfast Club',
    item_name: 'Cheese Omelette - Side of Tater Tots',
    canonical_name: 'West Coast Cheese Omelette Skillet',
    category: 'Griddle & Skillets',
    bom_summary: '3-egg farm/plant skillet, aged cheddar fold, crispy golden tater tots, chive garnish | Pkg: vented kraft clamshell, bag',
    raw_food_cost: 16500,
    packaging_dine_in: 450,
    packaging_delivery: 2800,
    target_food_cost_pct: 28.0,
    is_hero_bom: true,
  },

  // =========================================================================
  // Core Portfolio Vegetarian BOM Catalog
  // =========================================================================
  // American Breakfast Club
  {
    recipe_id: 'ABC-BRI-EGG',
    brand: 'American Breakfast Club',
    item_name: 'Sandwich - 2 Scrambled Eggs melty cheddar cheese on a wavy brioche bun',
    canonical_name: 'Brioche Egg & Melty Cheddar Sandwich',
    category: 'Brioche Sandwiches',
    bom_summary: 'Toasted wavy brioche bun, 2 folded eggs, double cheddar slice, house herb aioli',
    raw_food_cost: 11200,
    packaging_dine_in: 450,
    packaging_delivery: 2400,
    target_food_cost_pct: 28.0,
    is_hero_bom: false,
  },
  {
    recipe_id: 'ABC-TOTS-STD',
    brand: 'American Breakfast Club',
    item_name: 'Tater Tots',
    canonical_name: 'Crispy Golden Tater Tots',
    category: 'Sides & Hash',
    bom_summary: '160g crispy shredded potato tots, sea salt, smoky paprika dust, tomato dip',
    raw_food_cost: 6400,
    packaging_dine_in: 300,
    packaging_delivery: 1800,
    target_food_cost_pct: 25.0,
    is_hero_bom: false,
  },
  {
    recipe_id: 'ABC-PAN-MAPLE',
    brand: 'American Breakfast Club',
    item_name: '2 Pancakes - Butter, Maple Syrup',
    canonical_name: 'Buttermilk Stack (Butter & Maple)',
    category: 'Sweet Griddle',
    bom_summary: '180g fluffy griddle batter, whipped cultured/plant butter, 35ml amber maple syrup',
    raw_food_cost: 10200,
    packaging_dine_in: 0,
    packaging_delivery: 2600,
    target_food_cost_pct: 26.0,
    is_hero_bom: false,
  },
  {
    recipe_id: 'ABC-PAN-BLUE',
    brand: 'American Breakfast Club',
    item_name: '2 Pancakes - Blueberries, Butter, Maple Syrup',
    canonical_name: 'Wild Blueberry Griddle Stack',
    category: 'Sweet Griddle',
    bom_summary: '180g griddle batter, 45g blueberries compote, butter pat, 35ml maple syrup',
    raw_food_cost: 13800,
    packaging_dine_in: 0,
    packaging_delivery: 2600,
    target_food_cost_pct: 28.0,
    is_hero_bom: false,
  },
  {
    recipe_id: 'ABC-BRI-BEEF',
    brand: 'American Breakfast Club',
    item_name: 'Sandwich - 2 Scrambled Eggs Mock Beef, Cheddar Cheese  on a wavy brioche bun',
    canonical_name: 'Mock Beef & Egg Brioche Sandwich',
    category: 'Brioche Sandwiches',
    bom_summary: 'Wavy brioche bun, 55g seared plant-based beef strips, 2 folded eggs, cheddar',
    raw_food_cost: 16200,
    packaging_dine_in: 450,
    packaging_delivery: 2400,
    target_food_cost_pct: 28.0,
    is_hero_bom: false,
  },
  {
    recipe_id: 'ABC-BRI-CHICK',
    brand: 'American Breakfast Club',
    item_name: 'Sandwich - 2 Scrambled Eggs, Mock Chicken, Cheddar Cheese Mix, Brioche Bun',
    canonical_name: 'Mock Chicken & Egg Brioche Sandwich',
    category: 'Brioche Sandwiches',
    bom_summary: 'Wavy brioche bun, 60g crispy soy chicken patty, 2 scrambled eggs, cheddar',
    raw_food_cost: 15600,
    packaging_dine_in: 450,
    packaging_delivery: 2400,
    target_food_cost_pct: 28.0,
    is_hero_bom: false,
  },
  {
    recipe_id: 'ABC-BUR-FISH',
    brand: 'American Breakfast Club',
    item_name: 'Burrito - Mock Fish, 2 Scrambled Eggs, Cheddar, Avocado, Tater Tots,',
    canonical_name: 'Baja Mock-Fish Breakfast Burrito',
    category: 'All-Day Burritos',
    bom_summary: '10" tortilla, nori-battered plant fillet, 2 eggs, cheddar, avocado, tater tots',
    raw_food_cost: 19200,
    packaging_dine_in: 450,
    packaging_delivery: 2800,
    target_food_cost_pct: 28.0,
    is_hero_bom: false,
  },

  // Tyfel Coffee
  {
    recipe_id: 'TYF-LB',
    brand: 'Tyfel Coffee',
    item_name: 'Long Black',
    canonical_name: 'Single-Origin Long Black',
    category: 'Signature Espresso',
    bom_summary: '18g double-ristretto specialty arabica blend, filtered water, crystal ice',
    raw_food_cost: 3800,
    packaging_dine_in: 0,
    packaging_delivery: 1950,
    target_food_cost_pct: 18.0,
    is_hero_bom: false,
  },
  {
    recipe_id: 'TYF-MATCHA',
    brand: 'Tyfel Coffee',
    item_name: 'Matcha Latte',
    canonical_name: 'Uji Ceremonial Matcha Latte',
    category: 'Artisanal Beverages',
    bom_summary: '4g Uji matcha whisked, 140ml steamed oat/plant milk, light organic cane syrup',
    raw_food_cost: 7400,
    packaging_dine_in: 0,
    packaging_delivery: 1950,
    target_food_cost_pct: 20.0,
    is_hero_bom: false,
  },
  {
    recipe_id: 'TYF-BURRITO',
    brand: 'Tyfel Coffee',
    item_name: 'Breakfast Burrito',
    canonical_name: 'Classic Breakfast Burrito (Dine-in)',
    category: 'All-Day Brunch',
    bom_summary: '10" flour tortilla, 120g tofu scramble & black beans, 40g soy sausage, vegan cheddar, avocado smash, pico',
    raw_food_cost: 18500,
    packaging_dine_in: 450,
    packaging_delivery: 2800,
    target_food_cost_pct: 28.0,
    is_hero_bom: false,
  },
  {
    recipe_id: 'TYF-CAP',
    brand: 'Tyfel Coffee',
    item_name: 'Cappuccino',
    canonical_name: 'Artisanal Cappuccino',
    category: 'Signature Espresso',
    bom_summary: '18g espresso shot, 150ml micro-foamed barista oat/plant milk, cocoa dust',
    raw_food_cost: 6200,
    packaging_dine_in: 0,
    packaging_delivery: 1950,
    target_food_cost_pct: 18.0,
    is_hero_bom: false,
  },
  {
    recipe_id: 'TYF-LYCHEE',
    brand: 'Tyfel Coffee',
    item_name: 'Lychee Tea',
    canonical_name: 'Botanical Iced Lychee Tea',
    category: 'Refreshers',
    bom_summary: 'Cold-steeped jasmine black tea, 2 whole lychee fruit, lychee reduction, mint leaf',
    raw_food_cost: 4900,
    packaging_dine_in: 0,
    packaging_delivery: 1950,
    target_food_cost_pct: 18.0,
    is_hero_bom: false,
  },

  // People Pasta
  {
    recipe_id: 'PP-NUGGET',
    brand: 'People Pasta',
    item_name: 'Chicken Nugget - Vegan',
    canonical_name: "Crispy Plant Chick'n Nuggets",
    category: 'Antipasti & Sides',
    bom_summary: "6pcs golden soy-wheat chick'n nuggets, rosemary herb salt, smoky BBQ dip",
    raw_food_cost: 9200,
    packaging_dine_in: 0,
    packaging_delivery: 2200,
    target_food_cost_pct: 28.0,
    is_hero_bom: false,
  },
  {
    recipe_id: 'PP-CHICK-BURGER',
    brand: 'People Pasta',
    item_name: 'Vegan Chicken Crispy Burger',
    canonical_name: "Crispy Plant Chick'n Burger",
    category: 'Plant Burgers',
    bom_summary: "Artisan bun, 100g southern-crusted soy chick'n fillet, romaine, truffle mayo",
    raw_food_cost: 13800,
    packaging_dine_in: 450,
    packaging_delivery: 2600,
    target_food_cost_pct: 28.0,
    is_hero_bom: false,
  },
  {
    recipe_id: 'PP-CACIO',
    brand: 'People Pasta',
    item_name: 'Cacio e Pepe - Vegetarian - Plantbased',
    canonical_name: 'Roman Cacio e Pepe',
    category: 'Artisanal Pasta',
    bom_summary: '110g spaghetti, toasted Sarawak black peppercorn, aged plant-based pecorino emulsion',
    raw_food_cost: 10800,
    packaging_dine_in: 0,
    packaging_delivery: 3200,
    target_food_cost_pct: 28.0,
    is_hero_bom: false,
  },
  {
    recipe_id: 'PP-MEATLESS',
    brand: 'People Pasta',
    item_name: 'Meat-less Burger - Vegan',
    canonical_name: 'Signature Meat-Less Smash Burger',
    category: 'Plant Burgers',
    bom_summary: 'Toasted bun, 110g pea-protein smash patty, vegan cheddar, caramelized onion, pickles',
    raw_food_cost: 14200,
    packaging_dine_in: 450,
    packaging_delivery: 2600,
    target_food_cost_pct: 28.0,
    is_hero_bom: false,
  },
  {
    recipe_id: 'PP-BOLOGNESE',
    brand: 'People Pasta',
    item_name: 'Bolognese - Vegan Friendly - Vegetarian - Plantbase',
    canonical_name: 'Slow-Simmered Plant Ragu Bolognese',
    category: 'Artisanal Pasta',
    bom_summary: '110g tagliatelle, 120g San Marzano tomato & minced mushroom-soy ragu, fresh basil',
    raw_food_cost: 12900,
    packaging_dine_in: 0,
    packaging_delivery: 3200,
    target_food_cost_pct: 28.0,
    is_hero_bom: false,
  },

  // Herbox
  {
    recipe_id: 'HBX-NASGOR-BK',
    brand: 'Herbox',
    item_name: 'Nasi Goreng Bintang Kuning Vegan Vegetarian',
    canonical_name: 'Nasi Goreng Bintang Kuning (Turmeric Herb)',
    category: 'Wok Ricebox',
    bom_summary: '180g wok-tossed turmeric jasmine rice, diced soy protein, lemongrass, kerupuk, acar',
    raw_food_cost: 8600,
    packaging_dine_in: 0,
    packaging_delivery: 2500,
    target_food_cost_pct: 28.0,
    is_hero_bom: false,
  },
  {
    recipe_id: 'HBX-TERIYAKI',
    brand: 'Herbox',
    item_name: 'Teriyaki Vegan Vegetarian Ricebox',
    canonical_name: 'Glazed Teriyaki Plant Ricebox',
    category: 'Plant Ricebox',
    bom_summary: '180g jasmine rice, 95g seared soy strips, house mirin-free sweet soy teriyaki, sesame, broccoli',
    raw_food_cost: 11800,
    packaging_dine_in: 0,
    packaging_delivery: 2500,
    target_food_cost_pct: 28.0,
    is_hero_bom: false,
  },
  {
    recipe_id: 'HBX-PESMOL',
    brand: 'Herbox',
    item_name: 'Pesmol Vegan Vegetarian Ricebox',
    canonical_name: 'Sundanese Golden Pesmol Ricebox',
    category: 'Plant Ricebox',
    bom_summary: '180g jasmine rice, 95g crispy plant protein fillet, candlenut-turmeric pesmol sauce, red chili',
    raw_food_cost: 12200,
    packaging_dine_in: 0,
    packaging_delivery: 2500,
    target_food_cost_pct: 28.0,
    is_hero_bom: false,
  },
  {
    recipe_id: 'HBX-BLACKPEPPER',
    brand: 'Herbox',
    item_name: 'Lada Hitam Blackpepper Vegan Vegetarian Ricebox',
    canonical_name: 'Wok Blackpepper Plant Ricebox',
    category: 'Plant Ricebox',
    bom_summary: '180g jasmine rice, 95g plant protein bites, cracked coarse black pepper glaze, bell peppers',
    raw_food_cost: 12400,
    packaging_dine_in: 0,
    packaging_delivery: 2500,
    target_food_cost_pct: 28.0,
    is_hero_bom: false,
  },

  // LA Breakfast Club
  {
    recipe_id: 'LABC-CHICK-BUR',
    brand: 'LA Breakfast Club',
    item_name: 'Mock Chicken Burrito',
    canonical_name: 'LA Crispy Mock-Chicken Burrito',
    category: 'West Coast Burritos',
    bom_summary: '12" tortilla, crispy soy chicken tenders, scrambled eggs, hash tots, chipotle crema, cheddar',
    raw_food_cost: 19200,
    packaging_dine_in: 450,
    packaging_delivery: 2800,
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
}

export async function runQuery<T = Record<string, unknown>>(sql: string): Promise<T[]> {
  const db = await getDuckDB();
  let conn: DuckDBConnection | null = null;
  try {
    conn = await db.connect();
    const res = await conn.run(sql);
    const colNames = res.columnNames();
    const rawRows = await res.getRows();

    return rawRows.map((row) => {
      const obj: Record<string, unknown> = {};
      colNames.forEach((col, idx) => {
        const val = row[idx];
        obj[col] = typeof val === 'bigint' ? Number(val) : val;
      });
      return obj as T;
    });
  } catch (error) {
    console.error('[DuckDB Query Error]', error, 'SQL:', sql);
    throw error;
  } finally {
    if (conn) {
      try {
        conn.closeSync();
      } catch {
        // ignore close errors
      }
    }
  }
}

