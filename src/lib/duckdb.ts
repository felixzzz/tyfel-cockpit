import path from 'path';
import { DuckDBInstance, DuckDBConnection } from '@duckdb/node-api';

const DB_PATH =
  process.env.DUCKDB_PATH ||
  path.resolve(process.cwd(), '../data/fnb_analytics.duckdb');

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

async function initializeSchemaAndSeed(db: DuckDBInstance): Promise<void> {
  const conn = await db.connect();
  try {
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
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    const valuesSql = MASTER_RECIPES.map(
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
    ).join(',\n');

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
        updated_at = CURRENT_TIMESTAMP;
    `);
  } catch (err) {
    console.warn('[DuckDB Seed Notice] Could not write dim_recipes on init:', err);
  } finally {
    try {
      conn.closeSync();
    } catch {
      // ignore close errors
    }
  }
}

export async function getDuckDB(): Promise<DuckDBInstance> {
  if (dbInstance) return dbInstance;
  if (!dbInitPromise) {
    dbInitPromise = (async () => {
      const instance = await DuckDBInstance.create(DB_PATH);
      await initializeSchemaAndSeed(instance);
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

