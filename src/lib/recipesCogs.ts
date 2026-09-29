import { runQuery, MASTER_RECIPES } from './duckdb';

const query = runQuery;
const execute = runQuery;


export type IngredientCategory =
  | 'Coffee & Tea'
  | 'Dairy & Plant Milk'
  | 'Plant Proteins & Eggs'
  | 'Grains, Bread & Pasta'
  | 'Produce & Fungi'
  | 'Sauces, Oils & Sweeteners'
  | 'Packaging (Dine-In)'
  | 'Packaging (Delivery)';

export type BaseUnit = 'g' | 'ml' | 'pcs';

export type ComponentRole = 'food' | 'packaging_dine_in' | 'packaging_delivery';

export interface MasterIngredientSeed {
  ingredient_id: string;
  ingredient_name: string;
  category: IngredientCategory;
  supplier_name: string;
  purchase_unit_label: string;
  purchase_qty: number;
  base_unit: BaseUnit;
  purchase_price: number;
  yield_pct: number;
}

export interface RecipeIngredientLineSeed {
  line_id: string;
  recipe_id: string;
  ingredient_id: string;
  component_role: ComponentRole;
  qty_per_serving: number;
  prep_notes: string;
}

/**
 * Master Ingredient & Packaging Catalog synced with:
 * - Link 2: "Item Price" (`Copy of Raw`, gid=1372626226) — Latest Shopee/Tokopedia supplier prices & pack sizes
 * - Link 1: "Food Cost Tyfel" (`HerBox New`, `Sauce Herbox`, `MAIN COURSE`, `LITEBITE`, `Drink Cost`) — BOMs & WIP batches
 */
export const MASTER_INGREDIENTS_SEED: MasterIngredientSeed[] = [
  // ── Coffee & Tea (`Item Price` Copy of Raw) ──
  {
    ingredient_id: 'ING-ESP-HOUSE',
    ingredient_name: 'COFFEE HOUSE BLEND (50:50 Arabika Robusta)',
    category: 'Coffee & Tea',
    supplier_name: 'Shopee House Blend Lampung (Item Price #52)',
    purchase_unit_label: '1,000 gr Bag',
    purchase_qty: 1000,
    base_unit: 'g',
    purchase_price: 171385, // Rp 171.39 / g (Item Price #52)
    yield_pct: 100,
  },
  {
    ingredient_id: 'ING-MATCHA-UJI',
    ingredient_name: 'GREEN TEA POWDER (Matcha)',
    category: 'Coffee & Tea',
    supplier_name: 'Health Today / Matcha Powder (Item Price #83)',
    purchase_unit_label: '1,000 gr Pack',
    purchase_qty: 1000,
    base_unit: 'g',
    purchase_price: 115000, // Rp 115 / g (Item Price #83)
    yield_pct: 100,
  },
  {
    ingredient_id: 'ING-TEA-BLACK',
    ingredient_name: 'BLACK TEA / JASMINE TEA',
    category: 'Coffee & Tea',
    supplier_name: 'Commercial Black Tea / Lipton (Item Price #20)',
    purchase_unit_label: '100 pcs Box',
    purchase_qty: 100,
    base_unit: 'pcs',
    purchase_price: 47500, // Rp 475 / bag
    yield_pct: 100,
  },
  {
    ingredient_id: 'ING-LYCHEE-FRUIT',
    ingredient_name: 'LYCHEE FRUIT (Meily Kaleng)',
    category: 'Coffee & Tea',
    supplier_name: 'Meily Lychee Canned (Item Price #114)',
    purchase_unit_label: '565 gr Can',
    purchase_qty: 565,
    base_unit: 'g',
    purchase_price: 35000, // Rp 61.95 / g (Item Price #114)
    yield_pct: 100,
  },

  // ── Dairy & Plant Milk (Synced with Sukanda OneLink & `Item Price`) ──
  {
    ingredient_id: 'ING-MILK-FRESH',
    ingredient_name: 'DIAMOND UHT MILK FULL CREAM SLEEVE 1000 ML',
    category: 'Dairy & Plant Milk',
    supplier_name: 'Sukanda OneLink (DIAMOND - SOL1709262137-2)',
    purchase_unit_label: '12 x 1,000 ml Carton',
    purchase_qty: 12000,
    base_unit: 'ml',
    purchase_price: 216450, // Rp 18.04 / ml (Rp 18,037.50 / L via Sukanda OneLink)
    yield_pct: 100,
  },
  {
    ingredient_id: 'ING-MILK-FRESH-PASTEURIZED',
    ingredient_name: 'DIAMOND FRESH MILK PLAIN FS 946 ML',
    category: 'Dairy & Plant Milk',
    supplier_name: 'Sukanda OneLink (DIAMOND - SOL1709262137-2)',
    purchase_unit_label: '12 x 946 ml Carton (11,352 ml)',
    purchase_qty: 11352,
    base_unit: 'ml',
    purchase_price: 216300, // Rp 19.05 / ml (Rp 18,025 / 946ml bottle via Sukanda OneLink)
    yield_pct: 100,
  },
  {
    ingredient_id: 'ING-MILK-SOY',
    ingredient_name: 'SOY MILK (V-Soy Low Sugar)',
    category: 'Dairy & Plant Milk',
    supplier_name: 'V-Soy Shopee JAKSEL (Item Price #190)',
    purchase_unit_label: '1,000 ml Carton',
    purchase_qty: 1000,
    base_unit: 'ml',
    purchase_price: 35190, // Rp 35.19 / ml (Item Price #190)
    yield_pct: 100,
  },
  {
    ingredient_id: 'ING-MILK-CONDENSED',
    ingredient_name: 'CONDENSED MILK (Carnation)',
    category: 'Dairy & Plant Milk',
    supplier_name: 'Carnation Krimer Kental Manis (Item Price #53)',
    purchase_unit_label: '370 ml Can',
    purchase_qty: 370,
    base_unit: 'ml',
    purchase_price: 16500, // Rp 44.59 / ml (Item Price #53)
    yield_pct: 100,
  },
  {
    ingredient_id: 'ING-SAUCE-BECHAMEL',
    ingredient_name: 'SAUCE BECHAMEL (Leggos / Kitchen WIP)',
    category: 'Dairy & Plant Milk',
    supplier_name: 'Leggos Bechamel Cheese Sauce (Item Price #173)',
    purchase_unit_label: '1,500 gr Batch',
    purchase_qty: 1500,
    base_unit: 'g',
    purchase_price: 84520, // Rp 56.35 / g (Item Price #173)
    yield_pct: 100,
  },
  {
    ingredient_id: 'ING-CHEESE-CHEDDAR',
    ingredient_name: 'BEGA CHEESE CHEDDAR PROCESS SLICE W/ BURGER',
    category: 'Dairy & Plant Milk',
    supplier_name: 'Sukanda OneLink (TRADING - SOL2309260966-1)',
    purchase_unit_label: '1,000 gr Pack (84 Slices)',
    purchase_qty: 1000,
    base_unit: 'g',
    purchase_price: 140000, // Rp 140 / g (~Rp 1,667 / slice via Sukanda OneLink)
    yield_pct: 100,
  },
  {
    ingredient_id: 'ING-CHEESE-MELT',
    ingredient_name: 'BEGA CHEESE CHEDDAR PROCESS SLICE W/ BURGER (Melt)',
    category: 'Dairy & Plant Milk',
    supplier_name: 'Sukanda OneLink (TRADING - SOL2309260966-1)',
    purchase_unit_label: '1,000 gr Pack (84 Slices)',
    purchase_qty: 1000,
    base_unit: 'g',
    purchase_price: 140000, // Rp 140 / g (~Rp 1,667 / slice via Sukanda OneLink)
    yield_pct: 100,
  },
  {
    ingredient_id: 'ING-CHEESE-MOZA',
    ingredient_name: 'CHEESE MOZA (Emina Mozzarella Stretch)',
    category: 'Dairy & Plant Milk',
    supplier_name: 'Emina Mozzarella 1kg JAKTIM (Item Price #40)',
    purchase_unit_label: '1,000 gr Block',
    purchase_qty: 1000,
    base_unit: 'g',
    purchase_price: 103500, // Rp 103.5 / g (Item Price #40)
    yield_pct: 100,
  },
  {
    ingredient_id: 'ING-CHEESE-PARM',
    ingredient_name: 'PARMESAN (Green Valley Grated)',
    category: 'Dairy & Plant Milk',
    supplier_name: 'Green Valley Parmesan (Item Price #154)',
    purchase_unit_label: '100 gr Shaker',
    purchase_qty: 100,
    base_unit: 'g',
    purchase_price: 46530, // Rp 465.3 / g (Item Price #154)
    yield_pct: 100,
  },
  {
    ingredient_id: 'ING-BUTTER-UNSALTED',
    ingredient_name: 'MENTEGA / BLUE BAND MASTER',
    category: 'Dairy & Plant Milk',
    supplier_name: 'Simas Margarine / Blue Band (Item Price #120 & #22)',
    purchase_unit_label: '1,000 gr Pack',
    purchase_qty: 1000,
    base_unit: 'g',
    purchase_price: 28500, // Rp 28.5 / g (Item Price #120)
    yield_pct: 100,
  },

  // ── Plant Proteins & Eggs (`Item Price` Copy of Raw) ──
  {
    ingredient_id: 'ING-EGG-OMEGA',
    ingredient_name: 'TELUR (Zifara Grade A)',
    category: 'Plant Proteins & Eggs',
    supplier_name: 'Zifara Telur Negeri Grade A JAKBAR (Item Price #203)',
    purchase_unit_label: '30 pcs Tray (2 kg)',
    purchase_qty: 30,
    base_unit: 'pcs',
    purchase_price: 61000, // Rp 2,033.33 / pcs (Item Price #203)
    yield_pct: 100,
  },
  {
    ingredient_id: 'ING-PROT-CHICK-CUTLET',
    ingredient_name: "JI' KATSU (15PCS) (VeggieWay J001A)",
    category: 'Plant Proteins & Eggs',
    supplier_name: 'VeggieWay Direct (Faktur 07653/09/26 - J001A)',
    purchase_unit_label: '15 pcs Pack',
    purchase_qty: 15,
    base_unit: 'pcs',
    purchase_price: 87200, // Rp 5,813.33 / pcs (VeggieWay Direct Rp 87,200 / 15 pcs, down -27.3% from Rp 7,992)
    yield_pct: 100,
  },
  {
    ingredient_id: 'ING-PROT-CHICK-CHUNK',
    ingredient_name: 'JI BLOCK TYFEL (2,5KG) (VeggieWay A005)',
    category: 'Plant Proteins & Eggs',
    supplier_name: 'VeggieWay Direct (Faktur 07653/09/26 - A005)',
    purchase_unit_label: '2,500 gr Block (2.5 kg)',
    purchase_qty: 2500,
    base_unit: 'g',
    purchase_price: 162750, // Rp 65.10 / g (VeggieWay Direct Rp 162,750 / 2.5kg, down -38.6% from Rp 106/g)
    yield_pct: 100,
  },
  {
    ingredient_id: 'ING-PROT-NUGGET',
    ingredient_name: 'NUGGET (Evergreen Vegetarian Chicken Nugget)',
    category: 'Plant Proteins & Eggs',
    supplier_name: "Evergreen / Tokped Ten's Online JAKBAR (Item Price #138)",
    purchase_unit_label: '1,000 gr Frozen Pack',
    purchase_qty: 1000,
    base_unit: 'g',
    purchase_price: 45000, // Rp 45 / g (Item Price #138)
    yield_pct: 100,
  },
  {
    ingredient_id: 'ING-PROT-BURGER-PATTY',
    ingredient_name: 'DAGING BURGER (Vway / Green Rebel Patty)',
    category: 'Plant Proteins & Eggs',
    supplier_name: 'Vway / Green Rebel Combo JAKBAR (Item Price #58)',
    purchase_unit_label: '9 pcs Pack',
    purchase_qty: 9,
    base_unit: 'pcs',
    purchase_price: 115000, // Rp 12,777.78 / pcs (Item Price #58)
    yield_pct: 100,
  },
  {
    ingredient_id: 'ING-PROT-BEEF-STRIPS',
    ingredient_name: 'MUTTON BLOCK (VeggieWay D051)',
    category: 'Plant Proteins & Eggs',
    supplier_name: 'VeggieWay Direct (Faktur 07653/09/26 - D051)',
    purchase_unit_label: '500 gr Block',
    purchase_qty: 500,
    base_unit: 'g',
    purchase_price: 40000, // Rp 80.00 / g (VeggieWay Direct Rp 40,000 / 500g block)
    yield_pct: 100,
  },
  {
    ingredient_id: 'ING-PROT-FISH-FILLET',
    ingredient_name: 'KAN FINGER (VEGAN FISH STRIP) 14PCS (VeggieWay J005)',
    category: 'Plant Proteins & Eggs',
    supplier_name: 'VeggieWay Direct (Faktur 07653/09/26 - J005)',
    purchase_unit_label: '14 pcs Pack',
    purchase_qty: 14,
    base_unit: 'pcs',
    purchase_price: 36000, // Rp 2,571.43 / pcs (VeggieWay Direct Rp 36,000 / 14 pcs; 2 strips = Rp 5,143)
    yield_pct: 100,
  },
  {
    ingredient_id: 'ING-PROT-YUBA-FILLET',
    ingredient_name: 'YUBA FILLET (VeggieWay F002)',
    category: 'Plant Proteins & Eggs',
    supplier_name: 'VeggieWay Direct (Faktur 07653/09/26 - F002)',
    purchase_unit_label: '500 gr Pack',
    purchase_qty: 500,
    base_unit: 'g',
    purchase_price: 40000, // Rp 80.00 / g (VeggieWay Direct Rp 40,000 / 500g pack)
    yield_pct: 100,
  },
  {
    ingredient_id: 'ING-PROT-SQUID',
    ingredient_name: 'HAPPY SQUID (VeggieWay EQ01)',
    category: 'Plant Proteins & Eggs',
    supplier_name: 'VeggieWay Direct (Faktur 07653/09/26 - EQ01)',
    purchase_unit_label: '500 gr Pack',
    purchase_qty: 500,
    base_unit: 'g',
    purchase_price: 38000, // Rp 76.00 / g (VeggieWay Direct Rp 38,000 / 500g pack)
    yield_pct: 100,
  },

  // ── Grains, Bread & Pasta (Synced with Sukanda OneLink & `Item Price`) ──
  {
    ingredient_id: 'ING-TORTILLA-10',
    ingredient_name: 'MISSION TORTILLAS PRESS 10INCH',
    category: 'Grains, Bread & Pasta',
    supplier_name: 'Sukanda OneLink (TRADING - SOL2809266184-1)',
    purchase_unit_label: '144 pcs Carton (12x12 pcs)',
    purchase_qty: 144,
    base_unit: 'pcs',
    purchase_price: 590000, // Rp 4,097.22 / pcs (Sukanda OneLink Rp 590,000 / carton)
    yield_pct: 100,
  },
  {
    ingredient_id: 'ING-BUN-BRIOCHE',
    ingredient_name: 'EDO BKP BURGER BUN SESAME 300 GR',
    category: 'Grains, Bread & Pasta',
    supplier_name: 'Sukanda OneLink (TRADING - SOL1709262137-1)',
    purchase_unit_label: '6 pcs Pack (300g)',
    purchase_qty: 6,
    base_unit: 'pcs',
    purchase_price: 11433, // Rp 1,905.50 / pcs (Sukanda OneLink Rp 11,433 / 6 pcs)
    yield_pct: 100,
  },
  {
    ingredient_id: 'ING-BREAD-ROTI',
    ingredient_name: 'WHITE BREAD / ROTI TAWAR VEGAN',
    category: 'Grains, Bread & Pasta',
    supplier_name: 'Vegan Plain White Toast JAKBAR (Item Price #222)',
    purchase_unit_label: '10 lbr Loaf Pack',
    purchase_qty: 10,
    base_unit: 'pcs',
    purchase_price: 30000, // Rp 3,000 / lbr (Item Price #222)
    yield_pct: 100,
  },
  {
    ingredient_id: 'ING-TOTS-POTATO',
    ingredient_name: 'NN POTATO POM2 / TATER TOTS SHAPE HYF 1 KG',
    category: 'Grains, Bread & Pasta',
    supplier_name: 'Sukanda OneLink (TRADING - SOL2309260966-1)',
    purchase_unit_label: '1,000 gr Frozen Bag',
    purchase_qty: 1000,
    base_unit: 'g',
    purchase_price: 44500, // Rp 44.50 / g (Sukanda OneLink Rp 44,500 / 1kg)
    yield_pct: 100,
  },
  {
    ingredient_id: 'ING-FRIES-FRENCH',
    ingredient_name: 'NN FRENCH FRIES SHOESTRING J',
    category: 'Grains, Bread & Pasta',
    supplier_name: 'Sukanda OneLink (TRADING - SOL1709262137-1)',
    purchase_unit_label: '1,000 gr Frozen Bag',
    purchase_qty: 1000,
    base_unit: 'g',
    purchase_price: 26640, // Rp 26.64 / g (Sukanda OneLink Rp 26,640 / kg)
    yield_pct: 100,
  },
  {
    ingredient_id: 'ING-POTATO-RAW',
    ingredient_name: 'SIMPLOT FRENCH FRIES TINY TRIANGLE 2 KG IN',
    category: 'Grains, Bread & Pasta',
    supplier_name: 'Sukanda OneLink (TRADING - SOL2309260966-1)',
    purchase_unit_label: '2,000 gr Frozen Bag (Rp 42,735/kg)',
    purchase_qty: 2000,
    base_unit: 'g',
    purchase_price: 85470, // Rp 42.74 / g (Sukanda OneLink Rp 42,735 / kg)
    yield_pct: 100,
  },
  {
    ingredient_id: 'ING-PASTA-FETT',
    ingredient_name: 'FETTUCHINI (La Fonte No. 31)',
    category: 'Grains, Bread & Pasta',
    supplier_name: 'La Fonte Pasta Fettucine 750g (Item Price #71)',
    purchase_unit_label: '750 gr Box',
    purchase_qty: 750,
    base_unit: 'g',
    purchase_price: 34000, // Rp 45.33 / g (Item Price #71)
    yield_pct: 100,
  },
  {
    ingredient_id: 'ING-PASTA-SPAG',
    ingredient_name: 'SPAGETTHI (San Remo)',
    category: 'Grains, Bread & Pasta',
    supplier_name: 'San Remo Spaghetti JAKUT (Item Price #191)',
    purchase_unit_label: '250 gr Pack',
    purchase_qty: 250,
    base_unit: 'g',
    purchase_price: 17160, // Rp 68.64 / g (Item Price #191)
    yield_pct: 100,
  },
  {
    ingredient_id: 'ING-RICE-JASMINE',
    ingredient_name: 'BERAS (Cap Bunga Setra Ramos)',
    category: 'Grains, Bread & Pasta',
    supplier_name: 'Cap Bunga 5kg JAKBAR (Item Price #15)',
    purchase_unit_label: '5,000 gr Sack',
    purchase_qty: 5000,
    base_unit: 'g',
    purchase_price: 85000, // Rp 17 / g (Item Price #15)
    yield_pct: 100,
  },
  {
    ingredient_id: 'ING-NASI-PORSI',
    ingredient_name: 'NASI PUTIH (Cooked Portion)',
    category: 'Grains, Bread & Pasta',
    supplier_name: 'Kitchen Steamed Rice (Item Price #137)',
    purchase_unit_label: '1 Porsi',
    purchase_qty: 1,
    base_unit: 'pcs',
    purchase_price: 3000, // Rp 3,000 / porsi (Item Price #137)
    yield_pct: 100,
  },
  {
    ingredient_id: 'ING-PANCAKE-BATTER',
    ingredient_name: 'ADONAN WAFFLE / PANCAKE (Sriboga EasyMix)',
    category: 'Grains, Bread & Pasta',
    supplier_name: 'Sriboga EasyMix 1kg JAKBAR (Item Price #1)',
    purchase_unit_label: '1,000 gr Pack',
    purchase_qty: 1000,
    base_unit: 'g',
    purchase_price: 58925, // Rp 58.93 / g (Item Price #1)
    yield_pct: 100,
  },
  {
    ingredient_id: 'ING-BREAD-CRUMBS',
    ingredient_name: 'BREAD CRUMBS (Zena White Tepung Roti)',
    category: 'Grains, Bread & Pasta',
    supplier_name: 'Zena White 1kg JAKBAR (Item Price #24)',
    purchase_unit_label: '1,000 gr Pack',
    purchase_qty: 1000,
    base_unit: 'g',
    purchase_price: 23000, // Rp 23 / g (Item Price #24)
    yield_pct: 100,
  },

  // ── Produce & Fungi (`Item Price` Copy of Raw) ──
  {
    ingredient_id: 'ING-MUSHROOM-CHAMP',
    ingredient_name: 'JAMUR CHAMPIGNON (Pronas / Lumbung Bhumi)',
    category: 'Produce & Fungi',
    supplier_name: 'Pronas 400g JAKSEL (Item Price #92)',
    purchase_unit_label: '400 gr Can',
    purchase_qty: 400,
    base_unit: 'g',
    purchase_price: 30000, // Rp 75 / g (Item Price #92)
    yield_pct: 100,
  },
  {
    ingredient_id: 'ING-PRODUCE-LETTUCE',
    ingredient_name: 'LETTUCE (Salad Fresh / Iceberg)',
    category: 'Produce & Fungi',
    supplier_name: 'Shopee Lettuce Salad Fresh (Item Price #112)',
    purchase_unit_label: '1,000 gr Pack',
    purchase_qty: 1000,
    base_unit: 'g',
    purchase_price: 21000, // Rp 21 / g (Item Price #112)
    yield_pct: 100,
  },
  {
    ingredient_id: 'ING-PRODUCE-WORTEL',
    ingredient_name: 'WORTEL (Inagreen Farm Brastagi)',
    category: 'Produce & Fungi',
    supplier_name: 'Inagreen Farm 500g (Item Price #224)',
    purchase_unit_label: '500 gr Pack',
    purchase_qty: 500,
    base_unit: 'g',
    purchase_price: 17000, // Rp 34 / g (Item Price #224)
    yield_pct: 100,
  },
  {
    ingredient_id: 'ING-PRODUCE-KOL-UNGU',
    ingredient_name: 'KOL UNGU (Lumbung Bhumi / SayurBox)',
    category: 'Produce & Fungi',
    supplier_name: 'SayurBox / Lumbung Bhumi 500g JAKBAR (Item Price #235)',
    purchase_unit_label: '500 gr Pack',
    purchase_qty: 500,
    base_unit: 'g',
    purchase_price: 30270, // Rp 60.54 / g (Item Price #235)
    yield_pct: 100,
  },
  {
    ingredient_id: 'ING-PRODUCE-TOMATO',
    ingredient_name: 'TOMATO CHERRY / TOMAT MERAH',
    category: 'Produce & Fungi',
    supplier_name: 'Shopee Tomat Cherry 1kg JAKPUS (Item Price #246)',
    purchase_unit_label: '1,000 gr Pack',
    purchase_qty: 1000,
    base_unit: 'g',
    purchase_price: 31000, // Rp 31 / g (Item Price #246)
    yield_pct: 100,
  },
  {
    ingredient_id: 'ING-PRODUCE-KYURI',
    ingredient_name: 'KYURI (Timun Jepang Fresh)',
    category: 'Produce & Fungi',
    supplier_name: 'Shopee Kyuri 1kg (Item Price #107)',
    purchase_unit_label: '1,000 gr Pack',
    purchase_qty: 1000,
    base_unit: 'g',
    purchase_price: 25000, // Rp 25 / g (Item Price #107)
    yield_pct: 100,
  },
  {
    ingredient_id: 'ING-PRODUCE-PAPRIKA-M',
    ingredient_name: 'PAPRIKA MERAH',
    category: 'Produce & Fungi',
    supplier_name: 'Shopee Paprika Merah 250g (Item Price #153)',
    purchase_unit_label: '250 gr Pack',
    purchase_qty: 250,
    base_unit: 'g',
    purchase_price: 56250, // Rp 225 / g (Item Price #153)
    yield_pct: 100,
  },
  {
    ingredient_id: 'ING-PRODUCE-PAPRIKA-H',
    ingredient_name: 'PAPRIKA HIJAU',
    category: 'Produce & Fungi',
    supplier_name: 'Shopee Paprika Hijau 250g (Item Price #152)',
    purchase_unit_label: '250 gr Pack',
    purchase_qty: 250,
    base_unit: 'g',
    purchase_price: 26250, // Rp 105 / g (Item Price #152)
    yield_pct: 100,
  },
  {
    ingredient_id: 'ING-PRODUCE-LIME',
    ingredient_name: 'LIME / JERUK NIPIS',
    category: 'Produce & Fungi',
    supplier_name: 'Shopee Lime 1kg (Item Price #113)',
    purchase_unit_label: '1,000 gr Pack',
    purchase_qty: 1000,
    base_unit: 'g',
    purchase_price: 18000, // Rp 18 / g (Item Price #113)
    yield_pct: 100,
  },
  {
    ingredient_id: 'ING-PRODUCE-STRAWBERRY',
    ingredient_name: 'STRAWBERRY (Frozen 1kg)',
    category: 'Produce & Fungi',
    supplier_name: 'Shopee Strawberry 1kg JAKBAR (Item Price #194)',
    purchase_unit_label: '1,000 gr Pack',
    purchase_qty: 1000,
    base_unit: 'g',
    purchase_price: 35000, // Rp 35 / g (Item Price #194)
    yield_pct: 100,
  },
  {
    ingredient_id: 'ING-PRODUCE-MINT',
    ingredient_name: 'MINT LEAVES (Daun Mint)',
    category: 'Produce & Fungi',
    supplier_name: 'Bakoel Sayur Daun Mint 100g (Item Price #123)',
    purchase_unit_label: '100 gr Pack',
    purchase_qty: 100,
    base_unit: 'g',
    purchase_price: 5700, // Rp 57 / g (Item Price #123)
    yield_pct: 100,
  },
  {
    ingredient_id: 'ING-PRODUCE-AROMATICS',
    ingredient_name: 'BLACK PEPPER CRUSTED, PARSLEY & SEASONING',
    category: 'Produce & Fungi',
    supplier_name: 'Granology Crushed Black Pepper 500g (Item Price #19)',
    purchase_unit_label: '500 gr Pack',
    purchase_qty: 500,
    base_unit: 'g',
    purchase_price: 50000, // Rp 100 / g (Item Price #19)
    yield_pct: 100,
  },

  // ── Sauces, Oils & Sweeteners (`Item Price` Copy of Raw + `Sauce Herbox` WIP) ──
  {
    ingredient_id: 'ING-SAUCE-BOLOGNAISE',
    ingredient_name: 'SAUCE BOLOGNAISE (Bolognaisku / Kitchen WIP)',
    category: 'Sauces, Oils & Sweeteners',
    supplier_name: 'Bolognaisku 250g (Item Price #174)',
    purchase_unit_label: '250 gr Pouch',
    purchase_qty: 250,
    base_unit: 'g',
    purchase_price: 18600, // Rp 74.4 / g (Item Price #174)
    yield_pct: 100,
  },
  {
    ingredient_id: 'ING-SAUCE-TOMATO',
    ingredient_name: 'SAUCE TOMATO (Delmonte 1kg)',
    category: 'Sauces, Oils & Sweeteners',
    supplier_name: 'Delmonte Saus Tomat Pouch 1kg (Item Price #176)',
    purchase_unit_label: '1,000 gr Pouch',
    purchase_qty: 1000,
    base_unit: 'g',
    purchase_price: 20800, // Rp 20.8 / g (Item Price #176)
    yield_pct: 100,
  },
  {
    ingredient_id: 'ING-SAUCE-SAMBAL',
    ingredient_name: 'SAOS SAMBAL (Delmonte Extra Hot 1kg)',
    category: 'Sauces, Oils & Sweeteners',
    supplier_name: 'Delmonte Extra Hot Chilli 1kg (Item Price #171)',
    purchase_unit_label: '1,000 gr Pouch',
    purchase_qty: 1000,
    base_unit: 'g',
    purchase_price: 27300, // Rp 27.3 / g (Item Price #171)
    yield_pct: 100,
  },
  {
    ingredient_id: 'ING-SAUCE-MAYO',
    ingredient_name: 'MAYONAISE (Maestro 1kg)',
    category: 'Sauces, Oils & Sweeteners',
    supplier_name: 'Maestro Mayonnaise 1kg (Item Price #118)',
    purchase_unit_label: '1,000 gr Pouch',
    purchase_qty: 1000,
    base_unit: 'g',
    purchase_price: 37000, // Rp 37 / g (Item Price #118)
    yield_pct: 100,
  },
  {
    ingredient_id: 'ING-TRUFFLE-OIL',
    ingredient_name: 'TRUFFLE OIL (Urbani White Truffle 250ml)',
    category: 'Sauces, Oils & Sweeteners',
    supplier_name: 'Urbani Tartufi 250ml (Item Price #214)',
    purchase_unit_label: '250 ml Bottle',
    purchase_qty: 250,
    base_unit: 'ml',
    purchase_price: 363300, // Rp 1,453.2 / ml (Item Price #214)
    yield_pct: 100,
  },
  {
    ingredient_id: 'ING-CHOCO-CHIP',
    ingredient_name: 'CHOCO CHIP (Tulip Dark Choco Chips)',
    category: 'Sauces, Oils & Sweeteners',
    supplier_name: 'Tulip Dark Choco Chips JAKBAR (Item Price #44)',
    purchase_unit_label: '100 gr Pack',
    purchase_qty: 100,
    base_unit: 'g',
    purchase_price: 26925, // Rp 269.25 / g (Item Price #44)
    yield_pct: 100,
  },
  {
    ingredient_id: 'ING-WIP-PESMOL',
    ingredient_name: 'SAUCE PESMOL (Herbox WIP — Kemiri, Kunyit, Jahe, Sereh, Totole)',
    category: 'Sauces, Oils & Sweeteners',
    supplier_name: 'Herbox WIP Batch (Fixed #DIV/0! in Item Price #240 using Sauce Herbox)',
    purchase_unit_label: '25 Porsi Batch',
    purchase_qty: 25,
    base_unit: 'pcs',
    purchase_price: 43375, // Rp 1,735 / porsi (Sauce Herbox Row 26)
    yield_pct: 100,
  },
  {
    ingredient_id: 'ING-WIP-RICA',
    ingredient_name: 'SAUCE RICA-RICA (Herbox WIP — Cabe Keriting, Rawit, Sereh, Totole)',
    category: 'Sauces, Oils & Sweeteners',
    supplier_name: 'Herbox WIP Batch (Fixed #DIV/0! in Item Price #241 using Sauce Herbox)',
    purchase_unit_label: '25 Porsi Batch',
    purchase_qty: 25,
    base_unit: 'pcs',
    purchase_price: 83500, // Rp 3,340 / porsi (Sauce Herbox Row 40)
    yield_pct: 100,
  },
  {
    ingredient_id: 'ING-WIP-KUNGPAO',
    ingredient_name: 'SAUCE KUNG PAO (Herbox WIP — Kecap Manis ABC, Kecap Asin, Minyak Wijen)',
    category: 'Sauces, Oils & Sweeteners',
    supplier_name: 'Herbox WIP Batch (Fixed #VALUE! in Item Price #245 using Sauce Herbox)',
    purchase_unit_label: '25 Porsi Batch',
    purchase_qty: 25,
    base_unit: 'pcs',
    purchase_price: 92100, // Rp 3,684 / porsi (Sauce Herbox Row 116)
    yield_pct: 100,
  },
  {
    ingredient_id: 'ING-WIP-LADA-HITAM',
    ingredient_name: 'SAUCE LADA HITAM (Granology Black Pepper + Lee Kum Kee Soy Sauce)',
    category: 'Sauces, Oils & Sweeteners',
    supplier_name: 'Granology / Lee Kum Kee (Item Price #233 & #243 + Sauce Herbox)',
    purchase_unit_label: '25 Porsi Batch',
    purchase_qty: 25,
    base_unit: 'pcs',
    purchase_price: 38750, // Rp 1,550 / porsi
    yield_pct: 100,
  },
  {
    ingredient_id: 'ING-WIP-TERIYAKI',
    ingredient_name: 'SAUCE TERIYAKI (Saori Oriental Teriyaki 1L)',
    category: 'Sauces, Oils & Sweeteners',
    supplier_name: 'Saori Saus Oriental Teriyaki 1L (Item Price #244)',
    purchase_unit_label: '1,000 ml Bottle',
    purchase_qty: 1000,
    base_unit: 'ml',
    purchase_price: 53000, // Rp 53 / ml (Item Price #244)
    yield_pct: 100,
  },
  {
    ingredient_id: 'ING-WIP-MENTAI',
    ingredient_name: 'SAUCE MENTAI (Herbox WIP — Vegan Mayo, Sauce Tomato, Sambal)',
    category: 'Sauces, Oils & Sweeteners',
    supplier_name: 'Herbox Kitchen WIP (Sauce Herbox Row 139 / HerBox New Row 200)',
    purchase_unit_label: '25 Porsi Batch',
    purchase_qty: 25,
    base_unit: 'pcs',
    purchase_price: 42500, // Rp 1,700 / porsi
    yield_pct: 100,
  },
  {
    ingredient_id: 'ING-WIP-DRESSING',
    ingredient_name: 'DRESSING SALAD HERBOX (Lily Flower Salad Oil, Lime, Black Pepper)',
    category: 'Sauces, Oils & Sweeteners',
    supplier_name: 'Herbox WIP Batch (Fixed #VALUE! in Item Price #247 using Sauce Herbox)',
    purchase_unit_label: '100 Porsi Batch',
    purchase_qty: 100,
    base_unit: 'pcs',
    purchase_price: 142700, // Rp 1,427 / porsi (Sauce Herbox Row 98)
    yield_pct: 100,
  },
  {
    ingredient_id: 'ING-BUMBU-NASMIGOR',
    ingredient_name: 'NASMIGOR KAMPOENG 140GR (VeggieWay L004)',
    category: 'Sauces, Oils & Sweeteners',
    supplier_name: 'VeggieWay Direct (Faktur 07653/09/26 - L004)',
    purchase_unit_label: '140 gr Pack',
    purchase_qty: 140,
    base_unit: 'g',
    purchase_price: 17500, // Rp 125.00 / g (VeggieWay Direct Rp 17,500 / 140g; 20g/porsi = Rp 2,500)
    yield_pct: 100,
  },
  {
    ingredient_id: 'ING-SIMPLE-SYRUP',
    ingredient_name: 'SIMPLE SYRUP (Gula Cair)',
    category: 'Sauces, Oils & Sweeteners',
    supplier_name: 'Shopee Simple Syrup JAKBAR (Item Price #179)',
    purchase_unit_label: '500 ml Bottle',
    purchase_qty: 500,
    base_unit: 'ml',
    purchase_price: 32500, // Rp 65 / ml (Item Price #179)
    yield_pct: 100,
  },
  {
    ingredient_id: 'ING-GULA-AREN',
    ingredient_name: 'SIRUP GULA MERAH (Gulare Aren 1.3kg)',
    category: 'Sauces, Oils & Sweeteners',
    supplier_name: 'Gulare Sirup Gula Aren JAKTIM (Item Price #181)',
    purchase_unit_label: '1,300 ml Bottle',
    purchase_qty: 1300,
    base_unit: 'ml',
    purchase_price: 50000, // Rp 38.46 / ml (Item Price #181)
    yield_pct: 100,
  },
  {
    ingredient_id: 'ING-MAPLE-SYRUP',
    ingredient_name: 'SIRUP MAPLE (Pondan 1kg)',
    category: 'Sauces, Oils & Sweeteners',
    supplier_name: 'Pondan Maple Syrup JAKUT (Item Price #182)',
    purchase_unit_label: '1,000 ml Bottle',
    purchase_qty: 1000,
    base_unit: 'ml',
    purchase_price: 42800, // Rp 42.8 / ml (Item Price #182)
    yield_pct: 100,
  },
  {
    ingredient_id: 'ING-MONIN-LYCHEE',
    ingredient_name: 'MONIN LYCHEE SYRUP (700ml)',
    category: 'Sauces, Oils & Sweeteners',
    supplier_name: 'Monin Official Shopee (Item Price #129)',
    purchase_unit_label: '700 ml Bottle',
    purchase_qty: 700,
    base_unit: 'ml',
    purchase_price: 169000, // Rp 241.43 / ml (Item Price #129)
    yield_pct: 100,
  },
  {
    ingredient_id: 'ING-MONIN-STRAWBERRY',
    ingredient_name: 'MONIN STRAWBERRY SYRUP (700ml)',
    category: 'Sauces, Oils & Sweeteners',
    supplier_name: 'Monin Official Shopee (Item Price #132)',
    purchase_unit_label: '700 ml Bottle',
    purchase_qty: 700,
    base_unit: 'ml',
    purchase_price: 169000, // Rp 241.43 / ml (Item Price #132)
    yield_pct: 100,
  },
  {
    ingredient_id: 'ING-MONIN-PEACH',
    ingredient_name: 'MONIN PEACH SYRUP (700ml)',
    category: 'Sauces, Oils & Sweeteners',
    supplier_name: 'Monin Official Shopee (Item Price #131)',
    purchase_unit_label: '700 ml Bottle',
    purchase_qty: 700,
    base_unit: 'ml',
    purchase_price: 169000, // Rp 241.43 / ml (Item Price #131)
    yield_pct: 100,
  },
  {
    ingredient_id: 'ING-MONIN-MINT',
    ingredient_name: 'MONIN WILD MINT SYRUP (700ml)',
    category: 'Sauces, Oils & Sweeteners',
    supplier_name: 'Monin Official Shopee (Item Price #130)',
    purchase_unit_label: '700 ml Bottle',
    purchase_qty: 700,
    base_unit: 'ml',
    purchase_price: 169000, // Rp 241.43 / ml (Item Price #130)
    yield_pct: 100,
  },
  {
    ingredient_id: 'ING-SAUCE-LEMON',
    ingredient_name: 'LEMON SAUCE (Sunquick Lemon 330ml)',
    category: 'Sauces, Oils & Sweeteners',
    supplier_name: 'Sunquick Lemon 330ml (Item Price #111)',
    purchase_unit_label: '330 ml Bottle',
    purchase_qty: 330,
    base_unit: 'ml',
    purchase_price: 36500, // Rp 110.61 / ml (Item Price #111)
    yield_pct: 100,
  },
  {
    ingredient_id: 'ING-WATER-ICE',
    ingredient_name: 'ICE CUBE & MINERAL WATER (Kristal 10kg)',
    category: 'Sauces, Oils & Sweeteners',
    supplier_name: 'Gudang Es Batu Kristal JAKBAR (Item Price #89 & #122)',
    purchase_unit_label: '10,000 gr Pack',
    purchase_qty: 10000,
    base_unit: 'g',
    purchase_price: 39000, // Rp 3.9 / g (Item Price #89)
    yield_pct: 100,
  },

  // ── Packaging (Dine-In) (`Item Price` Copy of Raw) ──
  {
    ingredient_id: 'ING-PKG-DI-NAPKIN-STRAW',
    ingredient_name: 'BIG STRAW 8MM + COCKTAIL NAPKIN',
    category: 'Packaging (Dine-In)',
    supplier_name: 'Item Price #16 (Straw Rp 85) + #48 (Napkin Rp 90)',
    purchase_unit_label: '100 Sets Pack',
    purchase_qty: 100,
    base_unit: 'pcs',
    purchase_price: 17500, // Rp 175 / pcs (Item Price #16 + #48)
    yield_pct: 100,
  },
  {
    ingredient_id: 'ING-PKG-DI-WRAP',
    ingredient_name: 'ALUMINIUM FOIL WRAP (Best Fresh 30cm x 7.6m)',
    category: 'Packaging (Dine-In)',
    supplier_name: 'Best Fresh Foil JAKBAR (Item Price #4 — 50 sheets/roll)',
    purchase_unit_label: '50 Sheets Roll',
    purchase_qty: 50,
    base_unit: 'pcs',
    purchase_price: 22000, // Rp 440 / sheet (Item Price #4)
    yield_pct: 100,
  },

  // ── Packaging (Delivery) (`Item Price` Copy of Raw) ──
  {
    ingredient_id: 'ING-PKG-DEL-HERBOX',
    ingredient_name: 'PACKING HERBOX + STIKER HERBOX',
    category: 'Packaging (Delivery)',
    supplier_name: 'Item Price #248 (Packing Rp 710) + #249 (Stiker Rp 333)',
    purchase_unit_label: '250 Sets Carton',
    purchase_qty: 250,
    base_unit: 'pcs',
    purchase_price: 260750, // Rp 1,043 / pcs (Item Price #248 + #249)
    yield_pct: 100,
  },
  {
    ingredient_id: 'ING-PKG-DEL-CUP',
    ingredient_name: 'PLASTIC CUP (Okey 14/22oz) + STRAW + NAPKIN',
    category: 'Packaging (Delivery)',
    supplier_name: 'Item Price #160 (Okey Cup Rp 250) + #16 (Straw Rp 85) + #48 (Napkin Rp 90)',
    purchase_unit_label: '50 Sets Pack',
    purchase_qty: 50,
    base_unit: 'pcs',
    purchase_price: 21250, // Rp 425 / pcs (Item Price #160 + #16 + #48)
    yield_pct: 100,
  },
  {
    ingredient_id: 'ING-PKG-DEL-BOX',
    ingredient_name: 'TAKEAWAY FOOD BOX / BOWL + CUTLERY',
    category: 'Packaging (Delivery)',
    supplier_name: 'Kitchen Takeaway Packaging',
    purchase_unit_label: '200 Sets Carton',
    purchase_qty: 200,
    base_unit: 'pcs',
    purchase_price: 500000, // Rp 2,500 / pcs
    yield_pct: 100,
  },
];

/**
 * Recipe Ingredient Lines synced with Link 1 ("Food Cost Tyfel" BOM quantities),
 * Sukanda OneLink invoices, VeggieWay invoices, and Link 2 ("Item Price" supplier unit costs).
 */
const RAW_RECIPE_LINES: Array<[string, string, ComponentRole, number, string]> = [
  // ── 1. Tyfel Coffee (Drinks & Food) ──
  // HERO-TYFEL-KGA: Kopi Gula Aren (Kitchen Card: Kopi Susu Gula Aren)
  ['HERO-TYFEL-KGA', 'ING-ESP-HOUSE', 'food', 20, '20g Coffee House Blend 2 shots (Rp 3,428)'],
  ['HERO-TYFEL-KGA', 'ING-MILK-FRESH', 'food', 150, '150ml Diamond UHT Milk Full Cream Sukanda (Rp 2,706)'],
  ['HERO-TYFEL-KGA', 'ING-GULA-AREN', 'food', 20, '20ml Sirup Gula Merah Gulare (Rp 769)'],
  ['HERO-TYFEL-KGA', 'ING-WATER-ICE', 'food', 150, '150g Ice Cube Kristal (Rp 585)'],
  ['HERO-TYFEL-KGA', 'ING-PKG-DI-NAPKIN-STRAW', 'packaging_dine_in', 1, 'Big Straw + Cocktail Napkin (Rp 175)'],
  ['HERO-TYFEL-KGA', 'ING-PKG-DEL-CUP', 'packaging_delivery', 1, 'Okey Plastic Cup + Straw + Napkin (Rp 425)'],

  // TYF-LB: Long Black (Kitchen Card: Black Coffee Ice/Hot — Drink Cost Row 51)
  ['TYF-LB', 'ING-ESP-HOUSE', 'food', 20, '20g Coffee House Blend 2 shots (Rp 3,428)'],
  ['TYF-LB', 'ING-WATER-ICE', 'food', 250, '200ml Mineral Water + 150g Ice Cube (Rp 975)'],
  ['TYF-LB', 'ING-SIMPLE-SYRUP', 'food', 15, '15ml Simple Syrup on the side (Rp 975)'],
  ['TYF-LB', 'ING-PKG-DI-NAPKIN-STRAW', 'packaging_dine_in', 1, 'Big Straw + Cocktail Napkin (Rp 175)'],
  ['TYF-LB', 'ING-PKG-DEL-CUP', 'packaging_delivery', 1, 'Okey Plastic Cup + Straw + Napkin (Rp 425)'],

  // TYF-MATCHA: Matcha Latte (Kitchen Card: Matcha Latte — Drink Cost Row 366)
  ['TYF-MATCHA', 'ING-MATCHA-UJI', 'food', 20, '20g Green Tea Powder (Rp 2,300)'],
  ['TYF-MATCHA', 'ING-MILK-CONDENSED', 'food', 20, '20ml Condensed Milk Carnation (Rp 892)'],
  ['TYF-MATCHA', 'ING-MILK-FRESH', 'food', 150, '150ml Diamond UHT Milk Full Cream Sukanda (Rp 2,706)'],
  ['TYF-MATCHA', 'ING-WATER-ICE', 'food', 150, '150g Ice Cube Kristal (Rp 585)'],
  ['TYF-MATCHA', 'ING-PKG-DI-NAPKIN-STRAW', 'packaging_dine_in', 1, 'Big Straw + Cocktail Napkin (Rp 175)'],
  ['TYF-MATCHA', 'ING-PKG-DEL-CUP', 'packaging_delivery', 1, 'Okey Plastic Cup + Straw + Napkin (Rp 425)'],

  // TYF-CAP: Cappuccino (Kitchen Card: Cappuccino Ice/Hot — Drink Cost Row 65)
  ['TYF-CAP', 'ING-ESP-HOUSE', 'food', 20, '20g Coffee House Blend 2 shots (Rp 3,428)'],
  ['TYF-CAP', 'ING-MILK-FRESH', 'food', 150, '150ml Diamond UHT Milk Full Cream Sukanda (Rp 2,706)'],
  ['TYF-CAP', 'ING-WATER-ICE', 'food', 150, '150g Ice Cube Kristal (Rp 585)'],
  ['TYF-CAP', 'ING-SIMPLE-SYRUP', 'food', 15, '15ml Simple Syrup on the side (Rp 975)'],
  ['TYF-CAP', 'ING-PKG-DI-NAPKIN-STRAW', 'packaging_dine_in', 1, 'Big Straw + Cocktail Napkin (Rp 175)'],
  ['TYF-CAP', 'ING-PKG-DEL-CUP', 'packaging_delivery', 1, 'Okey Plastic Cup + Straw + Napkin (Rp 425)'],

  // TYF-LATTE: Café Latte (Kitchen Card: Latte Ice/Hot — Drink Cost Row 78)
  ['TYF-LATTE', 'ING-ESP-HOUSE', 'food', 20, '20g Coffee House Blend 2 shots (Rp 3,428)'],
  ['TYF-LATTE', 'ING-MILK-FRESH', 'food', 150, '150ml Diamond UHT Milk Full Cream Sukanda (Rp 2,706)'],
  ['TYF-LATTE', 'ING-WATER-ICE', 'food', 150, '150g Ice Cube Kristal (Rp 585)'],
  ['TYF-LATTE', 'ING-SIMPLE-SYRUP', 'food', 15, '15ml Simple Syrup on the side (Rp 975)'],
  ['TYF-LATTE', 'ING-PKG-DI-NAPKIN-STRAW', 'packaging_dine_in', 1, 'Big Straw + Cocktail Napkin (Rp 175)'],
  ['TYF-LATTE', 'ING-PKG-DEL-CUP', 'packaging_delivery', 1, 'Okey Plastic Cup + Straw + Napkin (Rp 425)'],

  // TYF-LYCHEE: Lychee Tea (Kitchen Card: Lychee Tea — Drink Cost Row 13)
  ['TYF-LYCHEE', 'ING-TEA-BLACK', 'food', 1, '1 bag Black Tea (Rp 475)'],
  ['TYF-LYCHEE', 'ING-MONIN-LYCHEE', 'food', 25, '25ml Monin Lychee Syrup (Rp 6,036)'],
  ['TYF-LYCHEE', 'ING-LYCHEE-FRUIT', 'food', 20, '2 pcs (~20g) Meily Lychee Fruit (Rp 1,239)'],
  ['TYF-LYCHEE', 'ING-SIMPLE-SYRUP', 'food', 15, '15ml Simple Syrup (Rp 975)'],
  ['TYF-LYCHEE', 'ING-WATER-ICE', 'food', 200, 'Mineral Water + Ice Cube (Rp 780)'],
  ['TYF-LYCHEE', 'ING-PKG-DI-NAPKIN-STRAW', 'packaging_dine_in', 1, 'Big Straw + Cocktail Napkin (Rp 175)'],
  ['TYF-LYCHEE', 'ING-PKG-DEL-CUP', 'packaging_delivery', 1, 'Okey Plastic Cup + Straw + Napkin (Rp 425)'],

  // TYF-BERRY-BOOM: Berry Boom (Kitchen Card: Berry Boom — Drink Cost Row 157)
  ['TYF-BERRY-BOOM', 'ING-PRODUCE-STRAWBERRY', 'food', 10, '10g Slice Strawberry (Rp 350)'],
  ['TYF-BERRY-BOOM', 'ING-MONIN-STRAWBERRY', 'food', 20, '20ml Monin Strawberry Syrup (Rp 4,829)'],
  ['TYF-BERRY-BOOM', 'ING-MONIN-PEACH', 'food', 20, '20ml Monin Peach Syrup (Rp 4,829)'],
  ['TYF-BERRY-BOOM', 'ING-SAUCE-LEMON', 'food', 20, '20ml Sunquick Lemon Sauce (Rp 2,212)'],
  ['TYF-BERRY-BOOM', 'ING-PRODUCE-LIME', 'food', 50, '50g Lime quartered & torched (Rp 900)'],
  ['TYF-BERRY-BOOM', 'ING-TEA-BLACK', 'food', 1, '1 bag Black Tea (Rp 475)'],
  ['TYF-BERRY-BOOM', 'ING-WATER-ICE', 'food', 150, '150g Ice Cube (Rp 585)'],
  ['TYF-BERRY-BOOM', 'ING-PKG-DI-NAPKIN-STRAW', 'packaging_dine_in', 1, 'Straw + Cocktail Napkin (Rp 175)'],
  ['TYF-BERRY-BOOM', 'ING-PKG-DEL-CUP', 'packaging_delivery', 1, 'Okey Plastic Cup + Straw + Napkin (Rp 425)'],

  // TYF-MOJITO: Virgin Mojito (Kitchen Card: Virgin Mojito — Drink Cost Row 397)
  ['TYF-MOJITO', 'ING-PRODUCE-LIME', 'food', 50, '50g Lime muddled (Rp 900)'],
  ['TYF-MOJITO', 'ING-MONIN-MINT', 'food', 15, '15ml Monin Wild Mint Syrup (Rp 3,621)'],
  ['TYF-MOJITO', 'ING-PRODUCE-MINT', 'food', 5, '5g Fresh Mint Leaves (Rp 285)'],
  ['TYF-MOJITO', 'ING-SAUCE-LEMON', 'food', 20, '20ml Sunquick Lemon Sauce (Rp 2,212)'],
  ['TYF-MOJITO', 'ING-WATER-ICE', 'food', 150, '150g Ice Cube (Rp 585)'],
  ['TYF-MOJITO', 'ING-PKG-DI-NAPKIN-STRAW', 'packaging_dine_in', 1, 'Straw + Cocktail Napkin (Rp 175)'],
  ['TYF-MOJITO', 'ING-PKG-DEL-CUP', 'packaging_delivery', 1, 'Okey Plastic Cup + Straw + Napkin (Rp 425)'],

  // TYF-BURRITO: Breakfast Burrito (Kitchen Card: Tyfel Burritos — LITEBITE Row 122)
  ['TYF-BURRITO', 'ING-TORTILLA-10', 'food', 1, '1pcs Mission Tortilla 10" Sukanda (Rp 4,097)'],
  ['TYF-BURRITO', 'ING-PROT-CHICK-CUTLET', 'food', 1, "1pcs VeggieWay Ji' Katsu J001A (Rp 5,813)"],
  ['TYF-BURRITO', 'ING-PRODUCE-LETTUCE', 'food', 150, '150g Lettuce (Rp 3,150)'],
  ['TYF-BURRITO', 'ING-SAUCE-MAYO', 'food', 15, '15g Maestro Mayonnaise (Rp 555)'],
  ['TYF-BURRITO', 'ING-SAUCE-TOMATO', 'food', 10, '10g Delmonte Sauce Tomato (Rp 208)'],
  ['TYF-BURRITO', 'ING-SAUCE-SAMBAL', 'food', 10, '10g Delmonte Saos Sambal (Rp 273)'],
  ['TYF-BURRITO', 'ING-PKG-DI-WRAP', 'packaging_dine_in', 1, 'Best Fresh Aluminium Foil Wrap (Rp 440)'],
  ['TYF-BURRITO', 'ING-PKG-DEL-BOX', 'packaging_delivery', 1, 'Takeaway Box'],

  // TYF-MOCK-CHICK-BUR: Mock Chicken Burrito (Shares Kitchen Card: Tyfel Burritos — LITEBITE Row 122)
  ['TYF-MOCK-CHICK-BUR', 'ING-TORTILLA-10', 'food', 1, '1pcs Mission Tortilla 10" Sukanda (Rp 4,097)'],
  ['TYF-MOCK-CHICK-BUR', 'ING-PROT-CHICK-CUTLET', 'food', 1, "1pcs VeggieWay Ji' Katsu J001A (Rp 5,813)"],
  ['TYF-MOCK-CHICK-BUR', 'ING-EGG-OMEGA', 'food', 2, '2pcs Telur Zifara (Rp 4,067)'],
  ['TYF-MOCK-CHICK-BUR', 'ING-TOTS-POTATO', 'food', 50, '50g NN Potato Pom2 / Tater Tots Sukanda (Rp 2,225)'],
  ['TYF-MOCK-CHICK-BUR', 'ING-CHEESE-CHEDDAR', 'food', 20, '20g Bega Cheddar Slice Sukanda (Rp 2,800)'],
  ['TYF-MOCK-CHICK-BUR', 'ING-PRODUCE-LETTUCE', 'food', 30, '30g Lettuce (Rp 630)'],
  ['TYF-MOCK-CHICK-BUR', 'ING-SAUCE-MAYO', 'food', 15, '15g Maestro Mayonnaise (Rp 555)'],
  ['TYF-MOCK-CHICK-BUR', 'ING-PKG-DI-WRAP', 'packaging_dine_in', 1, 'Best Fresh Aluminium Foil Wrap (Rp 440)'],
  ['TYF-MOCK-CHICK-BUR', 'ING-PKG-DEL-BOX', 'packaging_delivery', 1, 'Takeaway Box'],

  // TYF-MOCK-BEEF-SAND: Mock Beef Sandwich (Shares Kitchen Card: Mock Beef Brioche Sandwich)
  ['TYF-MOCK-BEEF-SAND', 'ING-BUN-BRIOCHE', 'food', 1, '1pcs Edo BKP Burger Bun Sesame Sukanda (Rp 1,906)'],
  ['TYF-MOCK-BEEF-SAND', 'ING-PROT-BEEF-STRIPS', 'food', 60, '60g VeggieWay Mutton Block D051 (Rp 4,800)'],
  ['TYF-MOCK-BEEF-SAND', 'ING-EGG-OMEGA', 'food', 2, '2pcs Telur Zifara (Rp 4,067)'],
  ['TYF-MOCK-BEEF-SAND', 'ING-CHEESE-MELT', 'food', 30, '30g (~2.5 slices) Bega Cheddar Slice Sukanda (Rp 4,200)'],
  ['TYF-MOCK-BEEF-SAND', 'ING-SAUCE-MAYO', 'food', 15, '15g Maestro Mayonnaise (Rp 555)'],
  ['TYF-MOCK-BEEF-SAND', 'ING-PKG-DI-WRAP', 'packaging_dine_in', 1, 'Best Fresh Aluminium Foil Wrap (Rp 440)'],
  ['TYF-MOCK-BEEF-SAND', 'ING-PKG-DEL-BOX', 'packaging_delivery', 1, 'Takeaway Burger Box'],

  // TYF-FRIES: French Friess (Kitchen Card: French Fries Truffle — LITEBITE Row 140)
  ['TYF-FRIES', 'ING-FRIES-FRENCH', 'food', 200, '200g NN French Fries Shoestring Sukanda (Rp 5,328)'],
  ['TYF-FRIES', 'ING-TRUFFLE-OIL', 'food', 2, '2ml Urbani Truffle Oil (Rp 2,906)'],
  ['TYF-FRIES', 'ING-PKG-DEL-BOX', 'packaging_delivery', 1, 'Takeaway Snack Box'],

  // TYF-HOME-FRIES: Home Fries (Shares Kitchen Card: Home Fries / Simplot Tiny Triangle 200g)
  ['TYF-HOME-FRIES', 'ING-POTATO-RAW', 'food', 200, '200g Simplot Tiny Triangle Sukanda (Rp 8,547)'],
  ['TYF-HOME-FRIES', 'ING-SAUCE-SAMBAL', 'food', 10, '10g Delmonte Saos Sambal (Rp 273)'],
  ['TYF-HOME-FRIES', 'ING-SAUCE-TOMATO', 'food', 10, '10g Delmonte Sauce Tomato (Rp 208)'],
  ['TYF-HOME-FRIES', 'ING-PKG-DEL-BOX', 'packaging_delivery', 1, 'Takeaway Snack Box'],

  // TYF-CHICK-CHUNK: Chic Chunk - Vegan Plantbased (Kitchen Card: Chick Chunk — LITEBITE Row 171)
  ['TYF-CHICK-CHUNK', 'ING-PROT-CHICK-CHUNK', 'food', 80, '80g VeggieWay Ji Block Tyfel A005 (Rp 5,208)'],
  ['TYF-CHICK-CHUNK', 'ING-SAUCE-MAYO', 'food', 5, '5g Maestro Mayonnaise (Rp 185)'],
  ['TYF-CHICK-CHUNK', 'ING-SAUCE-SAMBAL', 'food', 5, '5g Delmonte Saos Sambal (Rp 137)'],
  ['TYF-CHICK-CHUNK', 'ING-PKG-DEL-BOX', 'packaging_delivery', 1, 'Takeaway Snack Box'],

  // TYF-TOTS: Tater Tots (Kitchen Card: Potato Nugget — LITEBITE Row 188)
  ['TYF-TOTS', 'ING-TOTS-POTATO', 'food', 200, '200g NN Potato Pom2 / Tater Tots Sukanda (Rp 8,900)'],
  ['TYF-TOTS', 'ING-SAUCE-SAMBAL', 'food', 5, '5g Delmonte Saos Sambal (Rp 137)'],
  ['TYF-TOTS', 'ING-SAUCE-TOMATO', 'food', 5, '5g Delmonte Sauce Tomato (Rp 104)'],
  ['TYF-TOTS', 'ING-PKG-DEL-BOX', 'packaging_delivery', 1, 'Takeaway Snack Box'],

  // TYF-RISOTTO: Risotto (Kitchen Card: Risotto — MAIN COURSE Row 43)
  ['TYF-RISOTTO', 'ING-NASI-PORSI', 'food', 1, '1 porsi Nasi Putih (Rp 3,000)'],
  ['TYF-RISOTTO', 'ING-MUSHROOM-CHAMP', 'food', 30, '30g Pronas Jamur Champignon (Rp 2,250)'],
  ['TYF-RISOTTO', 'ING-SAUCE-BECHAMEL', 'food', 30, '30g Leggos Sauce Bechamel (Rp 1,690)'],
  ['TYF-RISOTTO', 'ING-PRODUCE-PAPRIKA-M', 'food', 10, '10g Paprika Merah (Rp 2,250)'],
  ['TYF-RISOTTO', 'ING-PRODUCE-PAPRIKA-H', 'food', 10, '10g Paprika Hijau (Rp 1,050)'],
  ['TYF-RISOTTO', 'ING-PRODUCE-AROMATICS', 'food', 20, 'Balsamic & Chicken Seasoning (Rp 2,000)'],
  ['TYF-RISOTTO', 'ING-PKG-DEL-BOX', 'packaging_delivery', 1, 'Takeaway Bowl + Cutlery'],

  // TYF-MOZA-STICK: Mozarella Stick (Kitchen Card: Mozzarella Stick — LITEBITE Row 223)
  ['TYF-MOZA-STICK', 'ING-CHEESE-MOZA', 'food', 120, '120g Emina Mozzarella (Rp 12,420)'],
  ['TYF-MOZA-STICK', 'ING-BREAD-CRUMBS', 'food', 80, '80g Zena Bread Crumbs (Rp 1,840)'],
  ['TYF-MOZA-STICK', 'ING-EGG-OMEGA', 'food', 1, '1pcs Telur Zifara (Rp 2,033)'],
  ['TYF-MOZA-STICK', 'ING-SAUCE-SAMBAL', 'food', 5, '5g Delmonte Saos Sambal (Rp 137)'],
  ['TYF-MOZA-STICK', 'ING-PKG-DEL-BOX', 'packaging_delivery', 1, 'Takeaway Snack Box'],

  // ── 2. American Breakfast Club ──
  // ABC-BUR-EGG: Burrito - 2 Scrambled Eggs, Cheddar, Avocado, Tater Tots (549 sold — #1 SKU!)
  ['ABC-BUR-EGG', 'ING-TORTILLA-10', 'food', 1, '1pcs Mission Tortilla 10" Sukanda (Rp 4,097)'],
  ['ABC-BUR-EGG', 'ING-EGG-OMEGA', 'food', 2, '2pcs Telur Zifara scrambled (Rp 4,067)'],
  ['ABC-BUR-EGG', 'ING-TOTS-POTATO', 'food', 60, '60g NN Potato Pom2 / Tater Tots Sukanda (Rp 2,670)'],
  ['ABC-BUR-EGG', 'ING-CHEESE-CHEDDAR', 'food', 25, '25g (~2 slices) Bega Cheddar Slice Sukanda (Rp 3,500)'],
  ['ABC-BUR-EGG', 'ING-PRODUCE-LETTUCE', 'food', 40, '40g Lettuce / Greens (Rp 840)'],
  ['ABC-BUR-EGG', 'ING-SAUCE-MAYO', 'food', 15, '15g Maestro Mayonnaise (Rp 555)'],
  ['ABC-BUR-EGG', 'ING-PKG-DI-WRAP', 'packaging_dine_in', 1, 'Best Fresh Aluminium Foil Wrap (Rp 440)'],
  ['ABC-BUR-EGG', 'ING-PKG-DEL-BOX', 'packaging_delivery', 1, 'Takeaway Box'],

  // ABC-OML-CHEESE: Cheese Omelette - Side Tater Tots (284 sold — #2 SKU!)
  ['ABC-OML-CHEESE', 'ING-EGG-OMEGA', 'food', 3, '3pcs Telur Zifara omelette fold (Rp 6,100)'],
  ['ABC-OML-CHEESE', 'ING-CHEESE-MELT', 'food', 30, '30g (~2.5 slices) Bega Cheddar Slice Sukanda (Rp 4,200)'],
  ['ABC-OML-CHEESE', 'ING-TOTS-POTATO', 'food', 120, '120g NN Potato Pom2 / Tater Tots Sukanda (Rp 5,340)'],
  ['ABC-OML-CHEESE', 'ING-BUTTER-UNSALTED', 'food', 10, '10g Mentega (Rp 285)'],
  ['ABC-OML-CHEESE', 'ING-PKG-DI-WRAP', 'packaging_dine_in', 1, 'Skillet Foil Liner (Rp 440)'],
  ['ABC-OML-CHEESE', 'ING-PKG-DEL-BOX', 'packaging_delivery', 1, 'Takeaway Clamshell Box'],

  // ABC-BUR-BEEF: Burrito - Mock Beef, 2 Scrambled Eggs, Cheddar, Avocado, Tater Tots, (274 sold)
  ['ABC-BUR-BEEF', 'ING-TORTILLA-10', 'food', 1, '1pcs Mission Tortilla 10" Sukanda (Rp 4,097)'],
  ['ABC-BUR-BEEF', 'ING-PROT-BEEF-STRIPS', 'food', 60, '60g VeggieWay Mutton Block D051 (Rp 4,800)'],
  ['ABC-BUR-BEEF', 'ING-EGG-OMEGA', 'food', 2, '2pcs Telur Zifara scrambled (Rp 4,067)'],
  ['ABC-BUR-BEEF', 'ING-TOTS-POTATO', 'food', 50, '50g NN Potato Pom2 / Tater Tots Sukanda (Rp 2,225)'],
  ['ABC-BUR-BEEF', 'ING-CHEESE-CHEDDAR', 'food', 20, '20g Bega Cheddar Slice Sukanda (Rp 2,800)'],
  ['ABC-BUR-BEEF', 'ING-PRODUCE-LETTUCE', 'food', 30, '30g Lettuce (Rp 630)'],
  ['ABC-BUR-BEEF', 'ING-SAUCE-MAYO', 'food', 15, '15g Maestro Mayonnaise (Rp 555)'],
  ['ABC-BUR-BEEF', 'ING-PKG-DI-WRAP', 'packaging_dine_in', 1, 'Best Fresh Aluminium Foil Wrap (Rp 440)'],
  ['ABC-BUR-BEEF', 'ING-PKG-DEL-BOX', 'packaging_delivery', 1, 'Takeaway Box'],

  // ABC-BUR-CHICK: Burrito - Mock Chicken, 2 Scrambled Eggs, Cheddar, Avocado, Tater Tots (190 sold)
  ['ABC-BUR-CHICK', 'ING-TORTILLA-10', 'food', 1, '1pcs Mission Tortilla 10" Sukanda (Rp 4,097)'],
  ['ABC-BUR-CHICK', 'ING-PROT-CHICK-CUTLET', 'food', 1, "1pcs VeggieWay Ji' Katsu J001A (Rp 5,813)"],
  ['ABC-BUR-CHICK', 'ING-EGG-OMEGA', 'food', 2, '2pcs Telur Zifara scrambled (Rp 4,067)'],
  ['ABC-BUR-CHICK', 'ING-TOTS-POTATO', 'food', 50, '50g NN Potato Pom2 / Tater Tots Sukanda (Rp 2,225)'],
  ['ABC-BUR-CHICK', 'ING-CHEESE-CHEDDAR', 'food', 20, '20g Bega Cheddar Slice Sukanda (Rp 2,800)'],
  ['ABC-BUR-CHICK', 'ING-PRODUCE-LETTUCE', 'food', 30, '30g Lettuce (Rp 630)'],
  ['ABC-BUR-CHICK', 'ING-SAUCE-MAYO', 'food', 15, '15g Maestro Mayonnaise (Rp 555)'],
  ['ABC-BUR-CHICK', 'ING-PKG-DI-WRAP', 'packaging_dine_in', 1, 'Best Fresh Aluminium Foil Wrap (Rp 440)'],
  ['ABC-BUR-CHICK', 'ING-PKG-DEL-BOX', 'packaging_delivery', 1, 'Takeaway Box'],

  // ABC-OML-MUSH: Mushroom Omelette - Mushrooms, Spinach, Side Tater Tots (177 sold)
  ['ABC-OML-MUSH', 'ING-EGG-OMEGA', 'food', 3, '3pcs Telur Zifara omelette fold (Rp 6,100)'],
  ['ABC-OML-MUSH', 'ING-MUSHROOM-CHAMP', 'food', 40, '40g Pronas Jamur Champignon (Rp 3,000)'],
  ['ABC-OML-MUSH', 'ING-TOTS-POTATO', 'food', 120, '120g NN Potato Pom2 / Tater Tots Sukanda (Rp 5,340)'],
  ['ABC-OML-MUSH', 'ING-PRODUCE-LETTUCE', 'food', 30, '30g Greens / Spinach (Rp 630)'],
  ['ABC-OML-MUSH', 'ING-BUTTER-UNSALTED', 'food', 10, '10g Mentega (Rp 285)'],
  ['ABC-OML-MUSH', 'ING-PKG-DI-WRAP', 'packaging_dine_in', 1, 'Skillet Foil Liner (Rp 440)'],
  ['ABC-OML-MUSH', 'ING-PKG-DEL-BOX', 'packaging_delivery', 1, 'Takeaway Clamshell Box'],

  // HERO-ABC-CBB-KATSU: Burrito - Mock Katsu, 2 Scrambled Eggs, Cheddar, Avocado, Tater Tots (65 sold)
  ['HERO-ABC-CBB-KATSU', 'ING-TORTILLA-10', 'food', 1, '1pcs Mission Tortilla 10" Sukanda (Rp 4,097)'],
  ['HERO-ABC-CBB-KATSU', 'ING-EGG-OMEGA', 'food', 2, '2pcs Telur Zifara scrambled (Rp 4,067)'],
  ['HERO-ABC-CBB-KATSU', 'ING-PROT-CHICK-CUTLET', 'food', 1, "1pcs VeggieWay Ji' Katsu J001A (Rp 5,813)"],
  ['HERO-ABC-CBB-KATSU', 'ING-TOTS-POTATO', 'food', 50, '50g NN Potato Pom2 / Tater Tots Sukanda (Rp 2,225)'],
  ['HERO-ABC-CBB-KATSU', 'ING-CHEESE-CHEDDAR', 'food', 20, '20g Bega Cheddar Slice Sukanda (Rp 2,800)'],
  ['HERO-ABC-CBB-KATSU', 'ING-PRODUCE-LETTUCE', 'food', 30, '30g Lettuce (Rp 630)'],
  ['HERO-ABC-CBB-KATSU', 'ING-SAUCE-MAYO', 'food', 15, '15g Maestro Mayonnaise (Rp 555)'],
  ['HERO-ABC-CBB-KATSU', 'ING-PKG-DI-WRAP', 'packaging_dine_in', 1, 'Best Fresh Aluminium Foil Wrap (Rp 440)'],
  ['HERO-ABC-CBB-KATSU', 'ING-PKG-DEL-BOX', 'packaging_delivery', 1, 'Takeaway Box'],

  // ABC-BRI-EGG: Sandwich - 2 Scrambled Eggs melty cheddar cheese on a wavy brioche bun (108 sold)
  ['ABC-BRI-EGG', 'ING-BUN-BRIOCHE', 'food', 1, '1pcs Edo BKP Burger Bun Sesame Sukanda (Rp 1,906)'],
  ['ABC-BRI-EGG', 'ING-EGG-OMEGA', 'food', 2, '2pcs Telur Zifara scrambled (Rp 4,067)'],
  ['ABC-BRI-EGG', 'ING-CHEESE-MELT', 'food', 30, '30g (~2.5 slices) Bega Cheddar Slice Sukanda (Rp 4,200)'],
  ['ABC-BRI-EGG', 'ING-SAUCE-MAYO', 'food', 15, '15g Maestro Mayonnaise (Rp 555)'],
  ['ABC-BRI-EGG', 'ING-PKG-DI-WRAP', 'packaging_dine_in', 1, 'Best Fresh Aluminium Foil Wrap (Rp 440)'],
  ['ABC-BRI-EGG', 'ING-PKG-DEL-BOX', 'packaging_delivery', 1, 'Takeaway Burger Box'],

  // ABC-TOTS-STD: Tater Tots (86 sold — Shares Kitchen Card: Potato Nugget)
  ['ABC-TOTS-STD', 'ING-TOTS-POTATO', 'food', 200, '200g NN Potato Pom2 / Tater Tots Sukanda (Rp 8,900)'],
  ['ABC-TOTS-STD', 'ING-SAUCE-SAMBAL', 'food', 5, '5g Delmonte Saos Sambal (Rp 137)'],
  ['ABC-TOTS-STD', 'ING-SAUCE-TOMATO', 'food', 5, '5g Delmonte Sauce Tomato (Rp 104)'],
  ['ABC-TOTS-STD', 'ING-PKG-DI-WRAP', 'packaging_dine_in', 1, 'Snack Liner (Rp 440)'],
  ['ABC-TOTS-STD', 'ING-PKG-DEL-BOX', 'packaging_delivery', 1, 'Takeaway Snack Box'],

  // ABC-TOTS-TRUFFLE: Tater Tots With Truffle Oil (31 sold — Shares Kitchen Card: Potato Nugget Truffle)
  ['ABC-TOTS-TRUFFLE', 'ING-TOTS-POTATO', 'food', 200, '200g NN Potato Pom2 / Tater Tots Sukanda (Rp 8,900)'],
  ['ABC-TOTS-TRUFFLE', 'ING-TRUFFLE-OIL', 'food', 2, '2ml Urbani Truffle Oil (Rp 2,906)'],
  ['ABC-TOTS-TRUFFLE', 'ING-SAUCE-SAMBAL', 'food', 5, '5g Delmonte Saos Sambal (Rp 137)'],
  ['ABC-TOTS-TRUFFLE', 'ING-PKG-DI-WRAP', 'packaging_dine_in', 1, 'Snack Liner (Rp 440)'],
  ['ABC-TOTS-TRUFFLE', 'ING-PKG-DEL-BOX', 'packaging_delivery', 1, 'Takeaway Snack Box'],

  // ABC-HOME-FRIES: Home Fries (31 sold — Shares Kitchen Card: Simplot Tiny Triangle 200g)
  ['ABC-HOME-FRIES', 'ING-POTATO-RAW', 'food', 200, '200g Simplot Tiny Triangle Sukanda (Rp 8,547)'],
  ['ABC-HOME-FRIES', 'ING-SAUCE-SAMBAL', 'food', 10, '10g Delmonte Saos Sambal (Rp 273)'],
  ['ABC-HOME-FRIES', 'ING-SAUCE-TOMATO', 'food', 10, '10g Delmonte Sauce Tomato (Rp 208)'],
  ['ABC-HOME-FRIES', 'ING-PKG-DI-WRAP', 'packaging_dine_in', 1, 'Snack Liner (Rp 440)'],
  ['ABC-HOME-FRIES', 'ING-PKG-DEL-BOX', 'packaging_delivery', 1, 'Takeaway Snack Box'],

  // ABC-HOME-FRIES-TRUFFLE: Home Fries With Truffle Oil (29 sold — Shares Kitchen Card: Simplot Tiny Triangle + Truffle)
  ['ABC-HOME-FRIES-TRUFFLE', 'ING-POTATO-RAW', 'food', 200, '200g Simplot Tiny Triangle Sukanda (Rp 8,547)'],
  ['ABC-HOME-FRIES-TRUFFLE', 'ING-TRUFFLE-OIL', 'food', 2, '2ml Urbani Truffle Oil (Rp 2,906)'],
  ['ABC-HOME-FRIES-TRUFFLE', 'ING-PKG-DI-WRAP', 'packaging_dine_in', 1, 'Snack Liner (Rp 440)'],
  ['ABC-HOME-FRIES-TRUFFLE', 'ING-PKG-DEL-BOX', 'packaging_delivery', 1, 'Takeaway Snack Box'],

  // ABC-PAN-MAPLE: 2 Pancakes - Butter, Maple Syrup (91 sold)
  ['ABC-PAN-MAPLE', 'ING-PANCAKE-BATTER', 'food', 150, '150g Sriboga EasyMix Batter (Rp 8,839)'],
  ['ABC-PAN-MAPLE', 'ING-BUTTER-UNSALTED', 'food', 20, '20g Mentega (Rp 570)'],
  ['ABC-PAN-MAPLE', 'ING-MAPLE-SYRUP', 'food', 35, '35ml Pondan Sirup Maple (Rp 1,498)'],
  ['ABC-PAN-MAPLE', 'ING-PKG-DEL-BOX', 'packaging_delivery', 1, 'Takeaway Pancake Box'],

  // ABC-PAN-BLUE: 2 Pancakes - Blueberries, Butter, Maple Syrup (89 sold)
  ['ABC-PAN-BLUE', 'ING-PANCAKE-BATTER', 'food', 150, '150g Sriboga EasyMix Batter (Rp 8,839)'],
  ['ABC-PAN-BLUE', 'ING-PRODUCE-STRAWBERRY', 'food', 50, '50g Berry / Fruit Topping (Rp 1,750)'],
  ['ABC-PAN-BLUE', 'ING-BUTTER-UNSALTED', 'food', 20, '20g Mentega (Rp 570)'],
  ['ABC-PAN-BLUE', 'ING-MAPLE-SYRUP', 'food', 35, '35ml Pondan Sirup Maple (Rp 1,498)'],
  ['ABC-PAN-BLUE', 'ING-PKG-DEL-BOX', 'packaging_delivery', 1, 'Takeaway Pancake Box'],

  // ABC-PAN-CHOCO: 2 Pancakes - Chocolate Chips, Butter, Maple Syrup (46 sold)
  ['ABC-PAN-CHOCO', 'ING-PANCAKE-BATTER', 'food', 150, '150g Sriboga EasyMix Batter (Rp 8,839)'],
  ['ABC-PAN-CHOCO', 'ING-CHOCO-CHIP', 'food', 15, '15g Tulip Dark Choco Chip (Rp 4,039)'],
  ['ABC-PAN-CHOCO', 'ING-BUTTER-UNSALTED', 'food', 20, '20g Mentega (Rp 570)'],
  ['ABC-PAN-CHOCO', 'ING-MAPLE-SYRUP', 'food', 35, '35ml Pondan Sirup Maple (Rp 1,498)'],
  ['ABC-PAN-CHOCO', 'ING-PKG-DEL-BOX', 'packaging_delivery', 1, 'Takeaway Pancake Box'],

  // ABC-BRI-BEEF: Sandwich - 2 Scrambled Eggs Mock Beef, Cheddar Cheese  on a wavy brioche bun (78 sold)
  ['ABC-BRI-BEEF', 'ING-BUN-BRIOCHE', 'food', 1, '1pcs Edo BKP Burger Bun Sesame Sukanda (Rp 1,906)'],
  ['ABC-BRI-BEEF', 'ING-PROT-BEEF-STRIPS', 'food', 60, '60g VeggieWay Mutton Block D051 (Rp 4,800)'],
  ['ABC-BRI-BEEF', 'ING-EGG-OMEGA', 'food', 2, '2pcs Telur Zifara scrambled (Rp 4,067)'],
  ['ABC-BRI-BEEF', 'ING-CHEESE-MELT', 'food', 30, '30g (~2.5 slices) Bega Cheddar Slice Sukanda (Rp 4,200)'],
  ['ABC-BRI-BEEF', 'ING-SAUCE-MAYO', 'food', 15, '15g Maestro Mayonnaise (Rp 555)'],
  ['ABC-BRI-BEEF', 'ING-PKG-DI-WRAP', 'packaging_dine_in', 1, 'Best Fresh Aluminium Foil Wrap (Rp 440)'],
  ['ABC-BRI-BEEF', 'ING-PKG-DEL-BOX', 'packaging_delivery', 1, 'Takeaway Burger Box'],

  // ABC-BRI-CHICK: Sandwich - 2 Scrambled Eggs, Mock Chicken, Cheddar Cheese Mix, Brioche Bun (47 sold)
  ['ABC-BRI-CHICK', 'ING-BUN-BRIOCHE', 'food', 1, '1pcs Edo BKP Burger Bun Sesame Sukanda (Rp 1,906)'],
  ['ABC-BRI-CHICK', 'ING-PROT-CHICK-CUTLET', 'food', 1, "1pcs VeggieWay Ji' Katsu J001A (Rp 5,813)"],
  ['ABC-BRI-CHICK', 'ING-EGG-OMEGA', 'food', 2, '2pcs Telur Zifara scrambled (Rp 4,067)'],
  ['ABC-BRI-CHICK', 'ING-CHEESE-MELT', 'food', 30, '30g (~2.5 slices) Bega Cheddar Slice Sukanda (Rp 4,200)'],
  ['ABC-BRI-CHICK', 'ING-SAUCE-MAYO', 'food', 15, '15g Maestro Mayonnaise (Rp 555)'],
  ['ABC-BRI-CHICK', 'ING-PKG-DI-WRAP', 'packaging_dine_in', 1, 'Best Fresh Aluminium Foil Wrap (Rp 440)'],
  ['ABC-BRI-CHICK', 'ING-PKG-DEL-BOX', 'packaging_delivery', 1, 'Takeaway Burger Box'],

  // ABC-BRI-FISH: Sandwich - 2 Scrambled Eggs, Mock Fish, Cheddar Cheese, Mix, Brioche Bun (31 sold)
  ['ABC-BRI-FISH', 'ING-BUN-BRIOCHE', 'food', 1, '1pcs Edo BKP Burger Bun Sesame Sukanda (Rp 1,906)'],
  ['ABC-BRI-FISH', 'ING-PROT-FISH-FILLET', 'food', 2, '2pcs VeggieWay Kan Finger (Vegan Fish Strip) J005 (Rp 5,143)'],
  ['ABC-BRI-FISH', 'ING-EGG-OMEGA', 'food', 2, '2pcs Telur Zifara scrambled (Rp 4,067)'],
  ['ABC-BRI-FISH', 'ING-CHEESE-MELT', 'food', 30, '30g (~2.5 slices) Bega Cheddar Slice Sukanda (Rp 4,200)'],
  ['ABC-BRI-FISH', 'ING-SAUCE-MAYO', 'food', 15, '15g Maestro Mayonnaise (Rp 555)'],
  ['ABC-BRI-FISH', 'ING-PKG-DI-WRAP', 'packaging_dine_in', 1, 'Best Fresh Aluminium Foil Wrap (Rp 440)'],
  ['ABC-BRI-FISH', 'ING-PKG-DEL-BOX', 'packaging_delivery', 1, 'Takeaway Burger Box'],

  // ABC-BUR-FISH: Burrito - Mock Fish, 2 Scrambled Eggs, Cheddar, Avocado, Tater Tots, (51 sold)
  ['ABC-BUR-FISH', 'ING-TORTILLA-10', 'food', 1, '1pcs Mission Tortilla 10" Sukanda (Rp 4,097)'],
  ['ABC-BUR-FISH', 'ING-PROT-FISH-FILLET', 'food', 2, '2pcs VeggieWay Kan Finger (Vegan Fish Strip) J005 (Rp 5,143)'],
  ['ABC-BUR-FISH', 'ING-EGG-OMEGA', 'food', 2, '2pcs Telur Zifara scrambled (Rp 4,067)'],
  ['ABC-BUR-FISH', 'ING-TOTS-POTATO', 'food', 50, '50g NN Potato Pom2 / Tater Tots Sukanda (Rp 2,225)'],
  ['ABC-BUR-FISH', 'ING-CHEESE-CHEDDAR', 'food', 20, '20g Bega Cheddar Slice Sukanda (Rp 2,800)'],
  ['ABC-BUR-FISH', 'ING-PRODUCE-LETTUCE', 'food', 30, '30g Lettuce (Rp 630)'],
  ['ABC-BUR-FISH', 'ING-SAUCE-MAYO', 'food', 15, '15g Maestro Mayonnaise (Rp 555)'],
  ['ABC-BUR-FISH', 'ING-PKG-DI-WRAP', 'packaging_dine_in', 1, 'Best Fresh Aluminium Foil Wrap (Rp 440)'],
  ['ABC-BUR-FISH', 'ING-PKG-DEL-BOX', 'packaging_delivery', 1, 'Takeaway Box'],

  // ── 3. People Pasta (Synced with MAIN COURSE & LITEBITE tabs + Item Price) ──
  // HERO-PP-CTM-POS: Creamy Mushroom - Vegetarian - Plantbased (Kitchen Card: Fettuchini Mushroom — MAIN COURSE Row 175)
  ['HERO-PP-CTM-POS', 'ING-PASTA-FETT', 'food', 150, '150g Fettuchini La Fonte (Rp 6,800)'],
  ['HERO-PP-CTM-POS', 'ING-MUSHROOM-CHAMP', 'food', 40, '40g Pronas Jamur Champignon (Rp 3,000)'],
  ['HERO-PP-CTM-POS', 'ING-SAUCE-BECHAMEL', 'food', 50, '50g Leggos Sauce Bechamel (Rp 2,817)'],
  ['HERO-PP-CTM-POS', 'ING-CHEESE-CHEDDAR', 'food', 20, '20g Bega Cheddar Slice Sukanda (Rp 2,800)'],
  ['HERO-PP-CTM-POS', 'ING-PKG-DEL-BOX', 'packaging_delivery', 1, 'Takeaway Pasta Bowl + Cutlery'],

  // PP-NUGGET: Chicken Nugget - Vegan (Shares Kitchen Card: Chick Chunk — LITEBITE Row 171)
  ['PP-NUGGET', 'ING-PROT-NUGGET', 'food', 80, '80g Evergreen Vegan Nugget (Rp 3,600)'],
  ['PP-NUGGET', 'ING-SAUCE-MAYO', 'food', 5, '5g Maestro Mayonnaise (Rp 185)'],
  ['PP-NUGGET', 'ING-SAUCE-SAMBAL', 'food', 5, '5g Delmonte Saos Sambal (Rp 137)'],
  ['PP-NUGGET', 'ING-PKG-DEL-BOX', 'packaging_delivery', 1, 'Takeaway Snack Box'],

  // PP-CHICK-BURGER: Vegan Chicken Crispy Burger (Kitchen Card: Sandwich / Katsu Burger — LITEBITE Row 29)
  ['PP-CHICK-BURGER', 'ING-BUN-BRIOCHE', 'food', 1, '1pcs Edo BKP Burger Bun Sesame Sukanda (Rp 1,906)'],
  ['PP-CHICK-BURGER', 'ING-PROT-CHICK-CUTLET', 'food', 1, "1pcs VeggieWay Ji' Katsu J001A (Rp 5,813)"],
  ['PP-CHICK-BURGER', 'ING-PRODUCE-LETTUCE', 'food', 30, '30g Lettuce (Rp 630)'],
  ['PP-CHICK-BURGER', 'ING-PRODUCE-TOMATO', 'food', 20, '20g Tomat (Rp 620)'],
  ['PP-CHICK-BURGER', 'ING-PRODUCE-KYURI', 'food', 20, '20g Kyuri (Rp 500)'],
  ['PP-CHICK-BURGER', 'ING-SAUCE-TOMATO', 'food', 5, '5g Delmonte Sauce Tomato (Rp 104)'],
  ['PP-CHICK-BURGER', 'ING-SAUCE-MAYO', 'food', 15, '15g Maestro Mayonnaise (Rp 555)'],
  ['PP-CHICK-BURGER', 'ING-FRIES-FRENCH', 'food', 100, '100g NN French Fries Shoestring Sukanda (Rp 2,664)'],
  ['PP-CHICK-BURGER', 'ING-PKG-DI-WRAP', 'packaging_dine_in', 1, 'Best Fresh Aluminium Foil Wrap (Rp 440)'],
  ['PP-CHICK-BURGER', 'ING-PKG-DEL-BOX', 'packaging_delivery', 1, 'Takeaway Burger Box'],

  // PP-CACIO: Cacio e Pepe - Vegetarian - Plantbased
  ['PP-CACIO', 'ING-PASTA-SPAG', 'food', 150, '150g Spaghetti San Remo (Rp 10,296)'],
  ['PP-CACIO', 'ING-CHEESE-PARM', 'food', 10, '10g Green Valley Parmesan (Rp 4,653)'],
  ['PP-CACIO', 'ING-BUTTER-UNSALTED', 'food', 20, '20g Mentega (Rp 570)'],
  ['PP-CACIO', 'ING-PRODUCE-AROMATICS', 'food', 5, '5g Granology Crushed Black Pepper (Rp 500)'],
  ['PP-CACIO', 'ING-PKG-DEL-BOX', 'packaging_delivery', 1, 'Takeaway Pasta Bowl + Cutlery'],

  // PP-MEATLESS: Meat-less Burger - Vegan (Kitchen Card: Burger — LITEBITE Row 9)
  ['PP-MEATLESS', 'ING-BUN-BRIOCHE', 'food', 1, '1pcs Edo BKP Burger Bun Sesame Sukanda (Rp 1,906)'],
  ['PP-MEATLESS', 'ING-PROT-BURGER-PATTY', 'food', 1, '1pcs Vway / Green Rebel Burger Patty (Rp 12,778)'],
  ['PP-MEATLESS', 'ING-PRODUCE-TOMATO', 'food', 10, '10g Tomato (Rp 310)'],
  ['PP-MEATLESS', 'ING-PRODUCE-LETTUCE', 'food', 20, '20g Lettuce (Rp 420)'],
  ['PP-MEATLESS', 'ING-PRODUCE-KYURI', 'food', 20, '20g Kyuri (Rp 500)'],
  ['PP-MEATLESS', 'ING-SAUCE-TOMATO', 'food', 20, '20g Delmonte Sauce Tomato (Rp 416)'],
  ['PP-MEATLESS', 'ING-SAUCE-MAYO', 'food', 10, '10g Maestro Mayonnaise (Rp 370)'],
  ['PP-MEATLESS', 'ING-FRIES-FRENCH', 'food', 100, '100g NN French Fries Shoestring Sukanda (Rp 2,664)'],
  ['PP-MEATLESS', 'ING-PKG-DI-WRAP', 'packaging_dine_in', 1, 'Best Fresh Aluminium Foil Wrap (Rp 440)'],
  ['PP-MEATLESS', 'ING-PKG-DEL-BOX', 'packaging_delivery', 1, 'Takeaway Burger Box'],

  // PP-BOLOGNESE: Bolognese - Vegan Friendly - Vegetarian - Plantbase (Kitchen Card: Spaghetti Bolognaise — MAIN COURSE Row 110)
  ['PP-BOLOGNESE', 'ING-PASTA-SPAG', 'food', 150, '150g Spaghetti San Remo (Rp 10,296)'],
  ['PP-BOLOGNESE', 'ING-SAUCE-BOLOGNAISE', 'food', 100, '100g Sauce Bolognaise (Rp 7,440)'],
  ['PP-BOLOGNESE', 'ING-PRODUCE-AROMATICS', 'food', 2, '2g Parsley & Herbs (Rp 200)'],
  ['PP-BOLOGNESE', 'ING-PKG-DEL-BOX', 'packaging_delivery', 1, 'Takeaway Pasta Bowl + Cutlery'],

  // PP-TOTS: Tattert Tots (Shares Kitchen Card: Potato Nugget — LITEBITE Row 188)
  ['PP-TOTS', 'ING-TOTS-POTATO', 'food', 200, '200g NN Potato Pom2 / Tater Tots Sukanda (Rp 8,900)'],
  ['PP-TOTS', 'ING-SAUCE-SAMBAL', 'food', 5, '5g Delmonte Saos Sambal (Rp 137)'],
  ['PP-TOTS', 'ING-SAUCE-TOMATO', 'food', 5, '5g Delmonte Sauce Tomato (Rp 104)'],
  ['PP-TOTS', 'ING-PKG-DEL-BOX', 'packaging_delivery', 1, 'Takeaway Snack Box'],

  // PP-TRUFFLE-TOTS: Truffle Tatter Tots (Shares Kitchen Card: Potato Nugget Truffle — LITEBITE Row 188)
  ['PP-TRUFFLE-TOTS', 'ING-TOTS-POTATO', 'food', 200, '200g NN Potato Pom2 / Tater Tots Sukanda (Rp 8,900)'],
  ['PP-TRUFFLE-TOTS', 'ING-TRUFFLE-OIL', 'food', 2, '2ml Urbani Truffle Oil (Rp 2,906)'],
  ['PP-TRUFFLE-TOTS', 'ING-SAUCE-SAMBAL', 'food', 5, '5g Delmonte Saos Sambal (Rp 137)'],
  ['PP-TRUFFLE-TOTS', 'ING-PKG-DEL-BOX', 'packaging_delivery', 1, 'Takeaway Snack Box'],

  // PP-TRUFFLE-FRIES: Truffle Fries (Shares Kitchen Card: French Fries Truffle — LITEBITE Row 140)
  ['PP-TRUFFLE-FRIES', 'ING-FRIES-FRENCH', 'food', 200, '200g NN French Fries Shoestring Sukanda (Rp 5,328)'],
  ['PP-TRUFFLE-FRIES', 'ING-TRUFFLE-OIL', 'food', 2, '2ml Urbani Truffle Oil (Rp 2,906)'],
  ['PP-TRUFFLE-FRIES', 'ING-PKG-DEL-BOX', 'packaging_delivery', 1, 'Takeaway Snack Box'],

  // ── 4. Herbox (Synced with HerBox New, Sauce Herbox, VeggieWay Direct & Item Price) ──
  // HERO-HBX-KPC-POS: Kung Paow Chick Vegan Vegetarian Ricebox (HerBox New Row 133)
  ['HERO-HBX-KPC-POS', 'ING-RICE-JASMINE', 'food', 100, '100g Beras Cap Bunga (Rp 1,700)'],
  ['HERO-HBX-KPC-POS', 'ING-PROT-CHICK-CHUNK', 'food', 65, '65g VeggieWay Ji Block Tyfel A005 (Rp 4,232)'],
  ['HERO-HBX-KPC-POS', 'ING-WIP-KUNGPAO', 'food', 1, '1 porsi Sauce Kung Pao WIP (Rp 3,684)'],
  ['HERO-HBX-KPC-POS', 'ING-PRODUCE-LETTUCE', 'food', 50, '50g Lettuce (Rp 1,050)'],
  ['HERO-HBX-KPC-POS', 'ING-PRODUCE-KOL-UNGU', 'food', 25, '25g Kol Ungu SayurBox (Rp 1,514)'],
  ['HERO-HBX-KPC-POS', 'ING-PRODUCE-WORTEL', 'food', 50, '50g Wortel Inagreen (Rp 1,700)'],
  ['HERO-HBX-KPC-POS', 'ING-PRODUCE-TOMATO', 'food', 50, '50g Tomat Cherry (Rp 1,550)'],
  ['HERO-HBX-KPC-POS', 'ING-WIP-DRESSING', 'food', 1, '1 porsi Dressing Salad Herbox (Rp 1,427)'],
  ['HERO-HBX-KPC-POS', 'ING-PKG-DEL-HERBOX', 'packaging_delivery', 1, 'Packing Herbox (Rp 710) + Stiker Herbox (Rp 333)'],

  // HBX-NASGOR-BK: Nasi Goreng Bintang Kuning Vegan Vegetarian
  ['HBX-NASGOR-BK', 'ING-NASI-PORSI', 'food', 1, '1 porsi Nasi Putih (Rp 3,000)'],
  ['HBX-NASGOR-BK', 'ING-PROT-CHICK-CHUNK', 'food', 50, '50g VeggieWay Ji Block Tyfel A005 (Rp 3,255)'],
  ['HBX-NASGOR-BK', 'ING-BUMBU-NASMIGOR', 'food', 20, '20g VeggieWay Nasmigor Kampoeng L004 (Rp 2,500)'],
  ['HBX-NASGOR-BK', 'ING-PRODUCE-LETTUCE', 'food', 50, '50g Lettuce (Rp 1,050)'],
  ['HBX-NASGOR-BK', 'ING-PRODUCE-KYURI', 'food', 25, '25g Kyuri / Acar (Rp 625)'],
  ['HBX-NASGOR-BK', 'ING-PKG-DEL-HERBOX', 'packaging_delivery', 1, 'Packing Herbox (Rp 710) + Stiker Herbox (Rp 333)'],

  // HBX-NASGOR-SM: Nasi Goreng Sedap Malam Vegan Vegetarian (32 sold — Shares Kitchen Card: Herbox Nasgor)
  ['HBX-NASGOR-SM', 'ING-NASI-PORSI', 'food', 1, '1 porsi Nasi Putih (Rp 3,000)'],
  ['HBX-NASGOR-SM', 'ING-PROT-CHICK-CHUNK', 'food', 50, '50g VeggieWay Ji Block Tyfel A005 (Rp 3,255)'],
  ['HBX-NASGOR-SM', 'ING-BUMBU-NASMIGOR', 'food', 20, '20g VeggieWay Nasmigor Kampoeng L004 (Rp 2,500)'],
  ['HBX-NASGOR-SM', 'ING-PRODUCE-LETTUCE', 'food', 50, '50g Lettuce (Rp 1,050)'],
  ['HBX-NASGOR-SM', 'ING-PRODUCE-KYURI', 'food', 25, '25g Kyuri / Acar (Rp 625)'],
  ['HBX-NASGOR-SM', 'ING-PKG-DEL-HERBOX', 'packaging_delivery', 1, 'Packing Herbox (Rp 710) + Stiker Herbox (Rp 333)'],

  // HBX-TERIYAKI: Teriyaki Vegan Vegetarian Ricebox (HerBox New Row 111)
  ['HBX-TERIYAKI', 'ING-RICE-JASMINE', 'food', 100, '100g Beras Cap Bunga (Rp 1,700)'],
  ['HBX-TERIYAKI', 'ING-PROT-YUBA-FILLET', 'food', 50, '50g VeggieWay Yuba Fillet F002 (Rp 4,000)'],
  ['HBX-TERIYAKI', 'ING-WIP-TERIYAKI', 'food', 30, '30ml Saori Teriyaki Sauce (Rp 1,590)'],
  ['HBX-TERIYAKI', 'ING-PRODUCE-LETTUCE', 'food', 50, '50g Lettuce (Rp 1,050)'],
  ['HBX-TERIYAKI', 'ING-PRODUCE-KOL-UNGU', 'food', 25, '25g Kol Ungu SayurBox (Rp 1,514)'],
  ['HBX-TERIYAKI', 'ING-PRODUCE-WORTEL', 'food', 50, '50g Wortel Inagreen (Rp 1,700)'],
  ['HBX-TERIYAKI', 'ING-PRODUCE-TOMATO', 'food', 50, '50g Tomat Cherry (Rp 1,550)'],
  ['HBX-TERIYAKI', 'ING-WIP-DRESSING', 'food', 1, '1 porsi Dressing Salad Herbox (Rp 1,427)'],
  ['HBX-TERIYAKI', 'ING-PKG-DEL-HERBOX', 'packaging_delivery', 1, 'Packing Herbox (Rp 710) + Stiker Herbox (Rp 333)'],

  // HBX-PESMOL: Pesmol Vegan Vegetarian Ricebox (HerBox New Row 13)
  ['HBX-PESMOL', 'ING-RICE-JASMINE', 'food', 100, '100g Beras Cap Bunga (Rp 1,700)'],
  ['HBX-PESMOL', 'ING-PROT-FISH-FILLET', 'food', 2, '2pcs VeggieWay Kan Finger (Vegan Fish Strip) J005 (Rp 5,143)'],
  ['HBX-PESMOL', 'ING-WIP-PESMOL', 'food', 1, '1 porsi Sauce Pesmol WIP (Rp 1,735)'],
  ['HBX-PESMOL', 'ING-PRODUCE-LETTUCE', 'food', 50, '50g Lettuce (Rp 1,050)'],
  ['HBX-PESMOL', 'ING-PRODUCE-KOL-UNGU', 'food', 25, '25g Kol Ungu SayurBox (Rp 1,514)'],
  ['HBX-PESMOL', 'ING-PRODUCE-WORTEL', 'food', 50, '50g Wortel Inagreen (Rp 1,700 — Fixed Rp 333/g sheet typo)'],
  ['HBX-PESMOL', 'ING-PRODUCE-TOMATO', 'food', 50, '50g Tomat Cherry (Rp 1,550)'],
  ['HBX-PESMOL', 'ING-WIP-DRESSING', 'food', 1, '1 porsi Dressing Salad Herbox (Rp 1,427)'],
  ['HBX-PESMOL', 'ING-PKG-DEL-HERBOX', 'packaging_delivery', 1, 'Packing Herbox (Rp 710) + Stiker Herbox (Rp 333)'],

  // HBX-BLACKPEPPER: Lada Hitam Blackpepper Vegan Vegetarian Ricebox (HerBox New Row 89)
  ['HBX-BLACKPEPPER', 'ING-RICE-JASMINE', 'food', 100, '100g Beras Cap Bunga (Rp 1,700)'],
  ['HBX-BLACKPEPPER', 'ING-PROT-BEEF-STRIPS', 'food', 65, '65g VeggieWay Mutton Block D051 (Rp 5,200)'],
  ['HBX-BLACKPEPPER', 'ING-WIP-LADA-HITAM', 'food', 1, '1 porsi Sauce Lada Hitam WIP (Rp 1,550)'],
  ['HBX-BLACKPEPPER', 'ING-PRODUCE-LETTUCE', 'food', 50, '50g Lettuce (Rp 1,050)'],
  ['HBX-BLACKPEPPER', 'ING-PRODUCE-KOL-UNGU', 'food', 25, '25g Kol Ungu SayurBox (Rp 1,514)'],
  ['HBX-BLACKPEPPER', 'ING-PRODUCE-WORTEL', 'food', 50, '50g Wortel Inagreen (Rp 1,700)'],
  ['HBX-BLACKPEPPER', 'ING-PRODUCE-TOMATO', 'food', 50, '50g Tomat Cherry (Rp 1,550)'],
  ['HBX-BLACKPEPPER', 'ING-WIP-DRESSING', 'food', 1, '1 porsi Dressing Salad Herbox (Rp 1,427)'],
  ['HBX-BLACKPEPPER', 'ING-PKG-DEL-HERBOX', 'packaging_delivery', 1, 'Packing Herbox (Rp 710) + Stiker Herbox (Rp 333)'],

  // HBX-RICA: Rica Rica Vegan Vegetarian Ricebox (HerBox New Row 34)
  ['HBX-RICA', 'ING-RICE-JASMINE', 'food', 100, '100g Beras Cap Bunga (Rp 1,700)'],
  ['HBX-RICA', 'ING-PROT-CHICK-CHUNK', 'food', 65, '65g VeggieWay Ji Block Tyfel A005 (Rp 4,232)'],
  ['HBX-RICA', 'ING-WIP-RICA', 'food', 1, '1 porsi Sauce Rica-Rica WIP (Rp 3,340)'],
  ['HBX-RICA', 'ING-PRODUCE-LETTUCE', 'food', 50, '50g Lettuce (Rp 1,050)'],
  ['HBX-RICA', 'ING-PRODUCE-KOL-UNGU', 'food', 25, '25g Kol Ungu SayurBox (Rp 1,514)'],
  ['HBX-RICA', 'ING-PRODUCE-WORTEL', 'food', 50, '50g Wortel Inagreen (Rp 1,700)'],
  ['HBX-RICA', 'ING-PRODUCE-TOMATO', 'food', 50, '50g Tomat Cherry (Rp 1,550)'],
  ['HBX-RICA', 'ING-WIP-DRESSING', 'food', 1, '1 porsi Dressing Salad Herbox (Rp 1,427)'],
  ['HBX-RICA', 'ING-PKG-DEL-HERBOX', 'packaging_delivery', 1, 'Packing Herbox (Rp 710) + Stiker Herbox (Rp 333)'],

  // HBX-KATSU-RICE: Katsu Chickin Vegan Vegetarian Ricebox (13 sold — Herbox Ricebox Base + Katsu)
  ['HBX-KATSU-RICE', 'ING-RICE-JASMINE', 'food', 100, '100g Beras Cap Bunga (Rp 1,700)'],
  ['HBX-KATSU-RICE', 'ING-PROT-CHICK-CUTLET', 'food', 1, "1pcs VeggieWay Ji' Katsu J001A (Rp 5,813)"],
  ['HBX-KATSU-RICE', 'ING-PRODUCE-LETTUCE', 'food', 50, '50g Lettuce (Rp 1,050)'],
  ['HBX-KATSU-RICE', 'ING-PRODUCE-KOL-UNGU', 'food', 25, '25g Kol Ungu SayurBox (Rp 1,514)'],
  ['HBX-KATSU-RICE', 'ING-PRODUCE-WORTEL', 'food', 50, '50g Wortel Inagreen (Rp 1,700)'],
  ['HBX-KATSU-RICE', 'ING-PRODUCE-TOMATO', 'food', 50, '50g Tomat Cherry (Rp 1,550)'],
  ['HBX-KATSU-RICE', 'ING-WIP-DRESSING', 'food', 1, '1 porsi Dressing Salad Herbox (Rp 1,427)'],
  ['HBX-KATSU-RICE', 'ING-PKG-DEL-HERBOX', 'packaging_delivery', 1, 'Packing Herbox (Rp 710) + Stiker Herbox (Rp 333)'],

  // HBX-BEEF-MENTAI: Beef Mentai Vegan Vegetarian Rice (11 sold — HerBox New + Sauce Mentai)
  ['HBX-BEEF-MENTAI', 'ING-RICE-JASMINE', 'food', 100, '100g Beras Cap Bunga (Rp 1,700)'],
  ['HBX-BEEF-MENTAI', 'ING-PROT-BEEF-STRIPS', 'food', 65, '65g VeggieWay Mutton Block D051 (Rp 5,200)'],
  ['HBX-BEEF-MENTAI', 'ING-WIP-MENTAI', 'food', 1, '1 porsi Sauce Mentai WIP (Rp 1,700)'],
  ['HBX-BEEF-MENTAI', 'ING-PRODUCE-LETTUCE', 'food', 50, '50g Lettuce (Rp 1,050)'],
  ['HBX-BEEF-MENTAI', 'ING-PRODUCE-KOL-UNGU', 'food', 25, '25g Kol Ungu SayurBox (Rp 1,514)'],
  ['HBX-BEEF-MENTAI', 'ING-PRODUCE-WORTEL', 'food', 50, '50g Wortel Inagreen (Rp 1,700)'],
  ['HBX-BEEF-MENTAI', 'ING-PRODUCE-TOMATO', 'food', 50, '50g Tomat Cherry (Rp 1,550)'],
  ['HBX-BEEF-MENTAI', 'ING-WIP-DRESSING', 'food', 1, '1 porsi Dressing Salad Herbox (Rp 1,427)'],
  ['HBX-BEEF-MENTAI', 'ING-PKG-DEL-HERBOX', 'packaging_delivery', 1, 'Packing Herbox (Rp 710) + Stiker Herbox (Rp 333)'],

  // HBX-FYSH-MENTAI: Fysh Mentai (11 sold — HerBox New Row 199)
  ['HBX-FYSH-MENTAI', 'ING-RICE-JASMINE', 'food', 100, '100g Beras Cap Bunga (Rp 1,700)'],
  ['HBX-FYSH-MENTAI', 'ING-PROT-FISH-FILLET', 'food', 2, '2pcs VeggieWay Kan Finger (Vegan Fish Strip) J005 (Rp 5,143)'],
  ['HBX-FYSH-MENTAI', 'ING-WIP-MENTAI', 'food', 1, '1 porsi Sauce Mentai WIP (Rp 1,700)'],
  ['HBX-FYSH-MENTAI', 'ING-PRODUCE-LETTUCE', 'food', 50, '50g Lettuce (Rp 1,050)'],
  ['HBX-FYSH-MENTAI', 'ING-PRODUCE-KOL-UNGU', 'food', 25, '25g Kol Ungu SayurBox (Rp 1,514)'],
  ['HBX-FYSH-MENTAI', 'ING-PRODUCE-WORTEL', 'food', 50, '50g Wortel Inagreen (Rp 1,700)'],
  ['HBX-FYSH-MENTAI', 'ING-PRODUCE-TOMATO', 'food', 50, '50g Tomat Cherry (Rp 1,550)'],
  ['HBX-FYSH-MENTAI', 'ING-WIP-DRESSING', 'food', 1, '1 porsi Dressing Salad Herbox (Rp 1,427)'],
  ['HBX-FYSH-MENTAI', 'ING-PKG-DEL-HERBOX', 'packaging_delivery', 1, 'Packing Herbox (Rp 710) + Stiker Herbox (Rp 333)'],

  // HBX-BEEF-WRAP: Beef wrap Vegan Herbox (Sauce Herbox Row 247)
  ['HBX-BEEF-WRAP', 'ING-TORTILLA-10', 'food', 1, '1pcs Mission Tortilla 10" Sukanda (Rp 4,097)'],
  ['HBX-BEEF-WRAP', 'ING-PROT-BEEF-STRIPS', 'food', 60, '60g VeggieWay Mutton Block D051 (Rp 4,800)'],
  ['HBX-BEEF-WRAP', 'ING-PRODUCE-LETTUCE', 'food', 150, '150g Lettuce (Rp 3,150)'],
  ['HBX-BEEF-WRAP', 'ING-SAUCE-MAYO', 'food', 30, '30g Maestro Mayonnaise (Rp 1,110)'],
  ['HBX-BEEF-WRAP', 'ING-SAUCE-TOMATO', 'food', 30, '30g Delmonte Sauce Tomato (Rp 624)'],
  ['HBX-BEEF-WRAP', 'ING-PKG-DI-WRAP', 'packaging_dine_in', 1, 'Best Fresh Aluminium Foil Wrap (Rp 440)'],
  ['HBX-BEEF-WRAP', 'ING-PKG-DEL-HERBOX', 'packaging_delivery', 1, 'Packing Herbox + Stiker (Rp 1,043)'],

  // HBX-RICA-WRAP: Rica Wrap (Sauce Herbox Row 211)
  ['HBX-RICA-WRAP', 'ING-TORTILLA-10', 'food', 1, '1pcs Mission Tortilla 10" Sukanda (Rp 4,097)'],
  ['HBX-RICA-WRAP', 'ING-PROT-CHICK-CHUNK', 'food', 65, '65g VeggieWay Ji Block Tyfel A005 (Rp 4,232)'],
  ['HBX-RICA-WRAP', 'ING-WIP-RICA', 'food', 1, '1 porsi Sauce Rica-Rica WIP (Rp 3,340)'],
  ['HBX-RICA-WRAP', 'ING-PRODUCE-LETTUCE', 'food', 150, '150g Lettuce (Rp 3,150)'],
  ['HBX-RICA-WRAP', 'ING-PKG-DI-WRAP', 'packaging_dine_in', 1, 'Best Fresh Aluminium Foil Wrap (Rp 440)'],
  ['HBX-RICA-WRAP', 'ING-PKG-DEL-HERBOX', 'packaging_delivery', 1, 'Packing Herbox + Stiker (Rp 1,043)'],

  // HBX-KATSU-WRAP: Katsu Wrap vegan Herbox (12 sold — Shares Kitchen Card: Tyfel Burritos / Katsu Wrap)
  ['HBX-KATSU-WRAP', 'ING-TORTILLA-10', 'food', 1, '1pcs Mission Tortilla 10" Sukanda (Rp 4,097)'],
  ['HBX-KATSU-WRAP', 'ING-PROT-CHICK-CUTLET', 'food', 1, "1pcs VeggieWay Ji' Katsu J001A (Rp 5,813)"],
  ['HBX-KATSU-WRAP', 'ING-PRODUCE-LETTUCE', 'food', 150, '150g Lettuce (Rp 3,150)'],
  ['HBX-KATSU-WRAP', 'ING-SAUCE-MAYO', 'food', 15, '15g Maestro Mayonnaise (Rp 555)'],
  ['HBX-KATSU-WRAP', 'ING-SAUCE-TOMATO', 'food', 10, '10g Delmonte Sauce Tomato (Rp 208)'],
  ['HBX-KATSU-WRAP', 'ING-SAUCE-SAMBAL', 'food', 10, '10g Delmonte Saos Sambal (Rp 273)'],
  ['HBX-KATSU-WRAP', 'ING-PKG-DI-WRAP', 'packaging_dine_in', 1, 'Best Fresh Aluminium Foil Wrap (Rp 440)'],
  ['HBX-KATSU-WRAP', 'ING-PKG-DEL-HERBOX', 'packaging_delivery', 1, 'Packing Herbox + Stiker (Rp 1,043)'],

  // HBX-TOTS: Tater tots (19 sold — Shares Kitchen Card: Potato Nugget)
  ['HBX-TOTS', 'ING-TOTS-POTATO', 'food', 200, '200g NN Potato Pom2 / Tater Tots Sukanda (Rp 8,900)'],
  ['HBX-TOTS', 'ING-SAUCE-SAMBAL', 'food', 5, '5g Delmonte Saos Sambal (Rp 137)'],
  ['HBX-TOTS', 'ING-SAUCE-TOMATO', 'food', 5, '5g Delmonte Sauce Tomato (Rp 104)'],
  ['HBX-TOTS', 'ING-PKG-DEL-HERBOX', 'packaging_delivery', 1, 'Packing Herbox + Stiker (Rp 1,043)'],

  // HBX-NUGGET: Vegan Chickin Nugget (18 sold — Shares Kitchen Card: Chick Chunk — LITEBITE Row 171)
  ['HBX-NUGGET', 'ING-PROT-CHICK-CHUNK', 'food', 80, '80g VeggieWay Ji Block Tyfel A005 (Rp 5,208)'],
  ['HBX-NUGGET', 'ING-SAUCE-MAYO', 'food', 5, '5g Maestro Mayonnaise (Rp 185)'],
  ['HBX-NUGGET', 'ING-SAUCE-SAMBAL', 'food', 5, '5g Delmonte Saos Sambal (Rp 137)'],
  ['HBX-NUGGET', 'ING-PKG-DEL-HERBOX', 'packaging_delivery', 1, 'Packing Herbox + Stiker (Rp 1,043)'],

  // ── 5. LA Breakfast Club ──
  // HERO-LABC-CO: Cheese Omelette - Side of Tater Tots (Shares Kitchen Card: Cheese Omelette + Tots)
  ['HERO-LABC-CO', 'ING-EGG-OMEGA', 'food', 3, '3pcs Telur Zifara omelette fold (Rp 6,100)'],
  ['HERO-LABC-CO', 'ING-CHEESE-MELT', 'food', 30, '30g (~2.5 slices) Bega Cheddar Slice Sukanda (Rp 4,200)'],
  ['HERO-LABC-CO', 'ING-TOTS-POTATO', 'food', 120, '120g NN Potato Pom2 / Tater Tots Sukanda (Rp 5,340)'],
  ['HERO-LABC-CO', 'ING-BUTTER-UNSALTED', 'food', 10, '10g Mentega (Rp 285)'],
  ['HERO-LABC-CO', 'ING-PKG-DI-WRAP', 'packaging_dine_in', 1, 'Skillet Liner (Rp 440)'],
  ['HERO-LABC-CO', 'ING-PKG-DEL-BOX', 'packaging_delivery', 1, 'Takeaway Clamshell Box'],

  // LABC-CHICK-BUR: Mock Chicken Burrito (Shares Kitchen Card: Mock Chicken / Katsu Breakfast Burrito)
  ['LABC-CHICK-BUR', 'ING-TORTILLA-10', 'food', 1, '1pcs Mission Tortilla 10" Sukanda (Rp 4,097)'],
  ['LABC-CHICK-BUR', 'ING-PROT-CHICK-CUTLET', 'food', 1, "1pcs VeggieWay Ji' Katsu J001A (Rp 5,813)"],
  ['LABC-CHICK-BUR', 'ING-EGG-OMEGA', 'food', 2, '2pcs Telur Zifara scrambled (Rp 4,067)'],
  ['LABC-CHICK-BUR', 'ING-TOTS-POTATO', 'food', 50, '50g NN Potato Pom2 / Tater Tots Sukanda (Rp 2,225)'],
  ['LABC-CHICK-BUR', 'ING-CHEESE-CHEDDAR', 'food', 20, '20g Bega Cheddar Slice Sukanda (Rp 2,800)'],
  ['LABC-CHICK-BUR', 'ING-PRODUCE-LETTUCE', 'food', 30, '30g Lettuce (Rp 630)'],
  ['LABC-CHICK-BUR', 'ING-SAUCE-MAYO', 'food', 15, '15g Maestro Mayonnaise (Rp 555)'],
  ['LABC-CHICK-BUR', 'ING-PKG-DI-WRAP', 'packaging_dine_in', 1, 'Best Fresh Aluminium Foil Wrap (Rp 440)'],
  ['LABC-CHICK-BUR', 'ING-PKG-DEL-BOX', 'packaging_delivery', 1, 'Takeaway Box'],
];

export const RECIPE_INGREDIENT_LINES_SEED: RecipeIngredientLineSeed[] = RAW_RECIPE_LINES.map(
  ([recipe_id, ingredient_id, component_role, qty_per_serving, prep_notes], idx) => ({
    line_id: `LINE-${String(idx + 1).padStart(3, '0')}-${recipe_id}-${ingredient_id}`,
    recipe_id,
    ingredient_id,
    component_role,
    qty_per_serving,
    prep_notes,
  })
);

function sqlEscape(val: string): string {
  return val.replace(/'/g, "''");
}

export function computeEffectiveUnitCost(
  purchasePrice: number,
  purchaseQty: number,
  yieldPct: number
): number {
  const safeQty = Math.max(0.0001, Number(purchaseQty) || 1);
  const safeYield = Math.max(1, Math.min(100, Number(yieldPct) || 100)) / 100;
  return Number(purchasePrice) / (safeQty * safeYield);
}

const globalForRecipesCogs = globalThis as unknown as {
  __fnbRecipesCogsEnsured?: boolean;
  __fnbRecipesCogsEnsuringPromise?: Promise<void> | null;
};

/**
 * Ensures `dim_ingredients` and `fact_recipe_ingredients` exist and are seeded.
 * Memoized on `globalThis` so DDL only runs once per server process.
 */
export async function ensureRecipesCogsTables(): Promise<void> {
  if (globalForRecipesCogs.__fnbRecipesCogsEnsured) {
    return;
  }
  if (globalForRecipesCogs.__fnbRecipesCogsEnsuringPromise) {
    return globalForRecipesCogs.__fnbRecipesCogsEnsuringPromise;
  }

  const initPromise = (async () => {
    await execute(`
      CREATE TABLE IF NOT EXISTS dim_ingredients (
        ingredient_id VARCHAR PRIMARY KEY,
        ingredient_name VARCHAR,
        category VARCHAR,
        supplier_name VARCHAR,
        purchase_unit_label VARCHAR,
        purchase_qty DOUBLE,
        base_unit VARCHAR,
        purchase_price DOUBLE,
        yield_pct DOUBLE,
        updated_at VARCHAR
      );
    `);

    await execute(`
      CREATE TABLE IF NOT EXISTS fact_recipe_ingredients (
        line_id VARCHAR PRIMARY KEY,
        recipe_id VARCHAR,
        ingredient_id VARCHAR,
        component_role VARCHAR,
        qty_per_serving DOUBLE,
        prep_notes VARCHAR
      );
    `);

    const countRows = await query<{
      cnt: number;
      line_cnt: number;
      rec_cnt: number;
      veggieway_seeded: number;
      mismatched_names: number;
    }>(`
      SELECT
        (SELECT COUNT(*) FROM dim_ingredients) AS cnt,
        (SELECT COUNT(*) FROM fact_recipe_ingredients) AS line_cnt,
        (SELECT COUNT(*) FROM dim_recipes) AS rec_cnt,
        (SELECT COUNT(*) FROM dim_ingredients WHERE ingredient_id = 'ING-BUMBU-NASMIGOR') AS veggieway_seeded,
        (SELECT COUNT(*) FROM dim_recipes WHERE canonical_name != item_name) AS mismatched_names
    `);

    const ingCount = Number(countRows[0]?.cnt ?? 0);
    const lineCount = Number(countRows[0]?.line_cnt ?? 0);
    const recCount = Number(countRows[0]?.rec_cnt ?? 0);
    const veggiewaySeeded = Number(countRows[0]?.veggieway_seeded ?? 0);
    const mismatchedNames = Number(countRows[0]?.mismatched_names ?? 0);

    if (
      ingCount === 0 ||
      lineCount === 0 ||
      recCount < MASTER_RECIPES.length ||
      veggiewaySeeded === 0 ||
      mismatchedNames > 0
    ) {
      await execute(`DELETE FROM dim_ingredients`);
      await execute(`DELETE FROM fact_recipe_ingredients`);
      await execute(`DELETE FROM dim_recipes`);

      const recipeValuesSql = MASTER_RECIPES.map(
        (r) =>
          `('${sqlEscape(r.recipe_id)}', '${sqlEscape(r.brand)}', '${sqlEscape(
            r.item_name
          )}', '${sqlEscape(r.canonical_name)}', '${sqlEscape(r.category)}', '${sqlEscape(
            r.bom_summary
          )}', ${r.raw_food_cost}, ${r.packaging_dine_in}, ${r.packaging_delivery}, ${
            r.target_food_cost_pct
          }, ${r.is_hero_bom})`
      ).join(',\n');

      await execute(`
        INSERT INTO dim_recipes (
          recipe_id, brand, item_name, canonical_name, category,
          bom_summary, raw_food_cost, packaging_dine_in, packaging_delivery,
          target_food_cost_pct, is_hero_bom
        ) VALUES
        ${recipeValuesSql};
      `);

      const nowIso = new Date().toISOString();
      const valuesSql = MASTER_INGREDIENTS_SEED.map(
        (ing) =>
          `('${sqlEscape(ing.ingredient_id)}', '${sqlEscape(ing.ingredient_name)}', '${sqlEscape(
            ing.category
          )}', '${sqlEscape(ing.supplier_name)}', '${sqlEscape(ing.purchase_unit_label)}', ${
            ing.purchase_qty
          }, '${sqlEscape(ing.base_unit)}', ${ing.purchase_price}, ${ing.yield_pct}, '${nowIso}')`
      ).join(',\n');

      await execute(`
        INSERT INTO dim_ingredients (
          ingredient_id, ingredient_name, category, supplier_name,
          purchase_unit_label, purchase_qty, base_unit, purchase_price, yield_pct, updated_at
        ) VALUES
        ${valuesSql};
      `);

      const lineValuesSql = RECIPE_INGREDIENT_LINES_SEED.map(
        (ln) =>
          `('${sqlEscape(ln.line_id)}', '${sqlEscape(ln.recipe_id)}', '${sqlEscape(
            ln.ingredient_id
          )}', '${sqlEscape(ln.component_role)}', ${ln.qty_per_serving}, '${sqlEscape(
            ln.prep_notes
          )}')`
      ).join(',\n');

      await execute(`
        INSERT INTO fact_recipe_ingredients (
          line_id, recipe_id, ingredient_id, component_role, qty_per_serving, prep_notes
        ) VALUES
        ${lineValuesSql};
      `);
    }

    globalForRecipesCogs.__fnbRecipesCogsEnsured = true;
  })();

  globalForRecipesCogs.__fnbRecipesCogsEnsuringPromise = initPromise;
  try {
    await initPromise;
  } finally {
    globalForRecipesCogs.__fnbRecipesCogsEnsuringPromise = null;
  }
}

export type RecipeAuditStatus = 'verified_sheet' | 'flagged_fixed' | 'shared_card';

const KITCHEN_RECIPE_CARD_MAP: Record<
  string,
  { card: string; status: RecipeAuditStatus; note: string }
> = {
  // Tyfel Coffee
  'HERO-TYFEL-KGA': {
    card: 'Drink Cost #27: Kopi Susu Gula Aren',
    status: 'verified_sheet',
    note: 'Synced Diamond UHT Milk Sukanda (Rp 18.04/ml) + House Blend (#52) + Gulare (#189)',
  },
  'TYF-LB': {
    card: 'Drink Cost #51: Black Coffee Ice/Hot',
    status: 'flagged_fixed',
    note: 'Fixed Simple Syrup typo (150ml -> 15ml) & synced House Blend Rp 171.39/g',
  },
  'TYF-MATCHA': {
    card: 'Drink Cost #366: Matcha Latte',
    status: 'verified_sheet',
    note: 'Synced Diamond UHT Milk Sukanda (Rp 18.04/ml) + Green Tea Powder (#83)',
  },
  'TYF-CAP': {
    card: 'Drink Cost #65: Cappuccino Ice/Hot',
    status: 'flagged_fixed',
    note: 'Synced Diamond UHT Milk Sukanda (Rp 18.04/ml) & fixed Simple Syrup typo (150ml -> 15ml)',
  },
  'TYF-LATTE': {
    card: 'Drink Cost #78: Latte Ice/Hot',
    status: 'flagged_fixed',
    note: 'Synced Diamond UHT Milk Sukanda (Rp 18.04/ml) & fixed Simple Syrup typo (150ml -> 15ml)',
  },
  'TYF-LYCHEE': {
    card: 'Drink Cost #13: Lychee Tea',
    status: 'flagged_fixed',
    note: 'Fixed Meily Lychee fruit unit (2 pcs = 20g, not 2g) & Monin Lychee (#127)',
  },
  'TYF-BERRY-BOOM': {
    card: 'Drink Cost #157: Berry Boom',
    status: 'verified_sheet',
    note: 'Direct match with Drink Cost #157 + Monin Strawberry/Peach (#129/#128)',
  },
  'TYF-MOJITO': {
    card: 'Drink Cost #397: Virgin Mojito',
    status: 'verified_sheet',
    note: 'Direct match with Drink Cost #397 + Monin Wild Mint (#130)',
  },
  'TYF-BURRITO': {
    card: 'LITEBITE #122: Tyfel Burritos',
    status: 'verified_sheet',
    note: "Synced Mission Tortilla 10\" Sukanda (Rp 4,097) + VeggieWay Ji' Katsu J001A (Rp 5,813/pcs)",
  },
  'TYF-MOCK-CHICK-BUR': {
    card: 'Shared Card: Mock Chicken / Katsu Breakfast Burrito',
    status: 'shared_card',
    note: "Synced Mission Tortilla 10\", VeggieWay Ji' Katsu (Rp 5,813), NN Tots & Bega Cheddar",
  },
  'TYF-MOCK-BEEF-SAND': {
    card: 'Shared Card: Mock Beef Brioche Sandwich',
    status: 'shared_card',
    note: 'Synced Edo BKP Sesame Bun, VeggieWay Mutton Block D051 (Rp 80/g) & Bega Cheddar',
  },
  'TYF-FRIES': {
    card: 'LITEBITE #140: French Fries Truffle',
    status: 'flagged_fixed',
    note: 'Synced NN French Fries Shoestring Sukanda (Rp 26.64/g) + 2ml Urbani Truffle Oil (#216)',
  },
  'TYF-HOME-FRIES': {
    card: 'Shared Card: Simplot Tiny Triangle / Home Fries 200g',
    status: 'shared_card',
    note: 'Synced Simplot French Fries Tiny Triangle Sukanda (Rp 42.74/g)',
  },
  'TYF-CHICK-CHUNK': {
    card: 'LITEBITE #171: Chick Chunk (VeggieWay Ji Block A005)',
    status: 'verified_sheet',
    note: 'Synced VeggieWay Ji Block Tyfel 2.5kg A005 (Rp 65.10/g)',
  },
  'TYF-TOTS': {
    card: 'LITEBITE #188: Potato Pom2 / Tater Tots (Sukanda)',
    status: 'verified_sheet',
    note: 'Synced NN Potato Pom2 / Tater Tots Sukanda (Rp 44,500/kg = Rp 44.50/g)',
  },
  'TYF-RISOTTO': {
    card: 'MAIN COURSE #43: Risotto',
    status: 'verified_sheet',
    note: 'Direct match with MAIN COURSE #43 + Pronas Champignon (#92) & Bechamel (#177)',
  },
  'TYF-MOZA-STICK': {
    card: 'LITEBITE #223: Mozzarella Stick',
    status: 'verified_sheet',
    note: 'Direct match with LITEBITE #223 + Emina Mozzarella (#134) & Zena Crumbs (#24)',
  },

  // American Breakfast Club
  'ABC-BUR-EGG': {
    card: 'Shared Card: ABC Scrambled Egg & Tots Burrito',
    status: 'shared_card',
    note: 'Synced Mission Tortilla 10" (Rp 4,097), NN Tater Tots (Rp 44.50/g) & Bega Cheddar (Sukanda)',
  },
  'ABC-OML-CHEESE': {
    card: 'Shared Card: 3-Egg Cheese Omelette + Side Tots',
    status: 'shared_card',
    note: 'Synced Bega Cheddar Slice (Rp 140/g) & NN Potato Pom2 / Tater Tots (Sukanda)',
  },
  'ABC-BUR-BEEF': {
    card: 'Shared Card: Mock Beef Breakfast Burrito',
    status: 'shared_card',
    note: 'Synced Mission Tortilla 10", VeggieWay Mutton Block D051 (Rp 80/g), NN Tots & Bega Cheddar',
  },
  'ABC-BUR-CHICK': {
    card: 'Shared Card: Mock Chicken / Katsu Breakfast Burrito',
    status: 'shared_card',
    note: "Synced Mission Tortilla 10\", VeggieWay Ji' Katsu J001A (Rp 5,813), NN Tots & Bega Cheddar",
  },
  'ABC-OML-MUSH': {
    card: 'Shared Card: 3-Egg Mushroom Omelette + Side Tots',
    status: 'shared_card',
    note: 'Synced NN Potato Pom2 / Tater Tots Sukanda (Rp 44,500/kg)',
  },
  'HERO-ABC-CBB-KATSU': {
    card: 'Shared Card: Mock Chicken / Katsu Breakfast Burrito',
    status: 'shared_card',
    note: "Synced Mission Tortilla 10\", VeggieWay Ji' Katsu J001A (Rp 5,813), NN Tots & Bega Cheddar",
  },
  'ABC-BRI-EGG': {
    card: 'Shared Card: Brioche Egg & Cheese Sandwich',
    status: 'shared_card',
    note: 'Synced Edo BKP Sesame Burger Bun (Rp 1,906) & Bega Cheddar Slice (Sukanda)',
  },
  'ABC-TOTS-STD': {
    card: 'LITEBITE #188: Potato Pom2 / Tater Tots (Sukanda)',
    status: 'shared_card',
    note: 'Synced NN Potato Pom2 / Tater Tots Sukanda (Rp 44,500/kg = Rp 44.50/g)',
  },
  'ABC-TOTS-TRUFFLE': {
    card: 'LITEBITE #188: Potato Pom2 / Tater Tots + Truffle Oil',
    status: 'shared_card',
    note: 'Synced NN Potato Pom2 / Tater Tots Sukanda (Rp 44.50/g) + Urbani Truffle Oil (#216)',
  },
  'ABC-HOME-FRIES': {
    card: 'Shared Card: Simplot Tiny Triangle / Home Fries 200g',
    status: 'shared_card',
    note: 'Synced Simplot French Fries Tiny Triangle Sukanda (Rp 42.74/g)',
  },
  'ABC-HOME-FRIES-TRUFFLE': {
    card: 'Shared Card: Simplot Tiny Triangle + Truffle Oil',
    status: 'shared_card',
    note: 'Synced Simplot French Fries Tiny Triangle Sukanda (Rp 42.74/g) + Urbani Truffle Oil (#216)',
  },
  'ABC-PAN-MAPLE': {
    card: 'Shared Card: 2 Pancakes Base (Sriboga EasyMix #1)',
    status: 'shared_card',
    note: 'Mapped to Sriboga EasyMix #1 + Mentega #120 + Pondan Maple Syrup #190',
  },
  'ABC-PAN-BLUE': {
    card: 'Shared Card: 2 Pancakes Base + Berry Topping',
    status: 'shared_card',
    note: 'Mapped to Sriboga EasyMix #1 + Fruit Topping #195 + Pondan Maple Syrup #190',
  },
  'ABC-PAN-CHOCO': {
    card: 'Shared Card: 2 Pancakes Base + Tulip Choco Chips (#36)',
    status: 'shared_card',
    note: 'Mapped to Sriboga EasyMix #1 + Tulip Choco Chip #36 + Pondan Maple Syrup #190',
  },
  'ABC-BRI-BEEF': {
    card: 'Shared Card: Mock Beef Brioche Sandwich',
    status: 'shared_card',
    note: 'Synced Edo BKP Sesame Bun, VeggieWay Mutton Block D051 (Rp 80/g) & Bega Cheddar',
  },
  'ABC-BRI-CHICK': {
    card: 'Shared Card: Mock Chicken Brioche Sandwich',
    status: 'shared_card',
    note: "Synced Edo BKP Sesame Bun, VeggieWay Ji' Katsu J001A (Rp 5,813) & Bega Cheddar",
  },
  'ABC-BRI-FISH': {
    card: 'Shared Card: Mock Fish Brioche Sandwich',
    status: 'shared_card',
    note: 'Synced Edo BKP Sesame Bun, VeggieWay Kan Finger J005 (2 strips = Rp 5,143) & Bega Cheddar',
  },
  'ABC-BUR-FISH': {
    card: 'Shared Card: Mock Fish Breakfast Burrito',
    status: 'shared_card',
    note: 'Synced Mission Tortilla 10", VeggieWay Kan Finger J005 (2 strips = Rp 5,143) & NN Tots',
  },

  // People Pasta
  'HERO-PP-CTM-POS': {
    card: 'MAIN COURSE #175: Fettuchini Mushroom',
    status: 'verified_sheet',
    note: 'Direct match with MAIN COURSE #175 + La Fonte Fettuchini (#71) & Pronas Champignon (#92)',
  },
  'PP-NUGGET': {
    card: 'LITEBITE #171: Chick Chunk (Evergreen Nugget)',
    status: 'shared_card',
    note: 'Shares Kitchen Card with Evergreen Vegan Nugget (#138)',
  },
  'PP-CHICK-BURGER': {
    card: 'LITEBITE #29: Sandwich / Katsu Burger',
    status: 'verified_sheet',
    note: "Synced Edo BKP Sesame Bun, VeggieWay Ji' Katsu J001A (Rp 5,813) & NN Shoestring Fries",
  },
  'PP-CACIO': {
    card: 'Shared Card: Spaghetti San Remo (#191) + Parmesan (#155)',
    status: 'shared_card',
    note: 'Mapped to 150g San Remo Spaghetti (#191) + Green Valley Parmesan (#155) + Mentega (#120)',
  },
  'PP-MEATLESS': {
    card: 'LITEBITE #9: Burger (Vway / Green Rebel Patty)',
    status: 'verified_sheet',
    note: 'Direct match with LITEBITE #9 + Edo BKP Bun, Vway Patty (#58) & NN Shoestring Fries',
  },
  'PP-BOLOGNESE': {
    card: 'MAIN COURSE #110: Spaghetti Bolognaise',
    status: 'verified_sheet',
    note: 'Direct match with MAIN COURSE #110 + San Remo Spaghetti (#191) & Fonte Bolognaise (#176)',
  },
  'PP-TOTS': {
    card: 'LITEBITE #188: Potato Pom2 / Tater Tots (Sukanda)',
    status: 'shared_card',
    note: 'Synced NN Potato Pom2 / Tater Tots Sukanda (Rp 44,500/kg)',
  },
  'PP-TRUFFLE-TOTS': {
    card: 'LITEBITE #188: Potato Pom2 / Tater Tots + Truffle Oil',
    status: 'shared_card',
    note: 'Synced NN Potato Pom2 / Tater Tots Sukanda + Urbani Truffle Oil (#216)',
  },
  'PP-TRUFFLE-FRIES': {
    card: 'LITEBITE #140: French Fries Truffle',
    status: 'shared_card',
    note: 'Synced NN French Fries Shoestring Sukanda (Rp 26.64/g) + Urbani Truffle Oil',
  },

  // Herbox
  'HERO-HBX-KPC-POS': {
    card: 'HerBox New #133: Kungpao Ricebox',
    status: 'flagged_fixed',
    note: 'Synced VeggieWay Ji Block Tyfel 2.5kg A005 (Rp 65.10/g = Rp 4,232) + Sauce Kung Pao WIP',
  },
  'HBX-NASGOR-BK': {
    card: 'Shared Card: Herbox Wok Nasi Goreng + VeggieWay Nasmigor L004',
    status: 'shared_card',
    note: 'Synced VeggieWay Ji Block Tyfel A005 (50g = Rp 3,255) + Nasmigor Kampoeng 140gr L004',
  },
  'HBX-NASGOR-SM': {
    card: 'Shared Card: Herbox Wok Nasi Goreng + VeggieWay Nasmigor L004',
    status: 'shared_card',
    note: 'Synced VeggieWay Ji Block Tyfel A005 (50g = Rp 3,255) + Nasmigor Kampoeng 140gr L004',
  },
  'HBX-TERIYAKI': {
    card: 'HerBox New #111: Teriyaki Ricebox',
    status: 'verified_sheet',
    note: 'Synced VeggieWay Yuba Fillet F002 (50g = Rp 4,000) & Saori Teriyaki (#244)',
  },
  'HBX-PESMOL': {
    card: 'HerBox New #13: Pesmol Ricebox',
    status: 'flagged_fixed',
    note: 'Synced VeggieWay Kan Finger J005 (2 strips = Rp 5,143) & Sauce Pesmol WIP',
  },
  'HBX-BLACKPEPPER': {
    card: 'HerBox New #89: Lada Hitam Ricebox',
    status: 'verified_sheet',
    note: 'Synced VeggieWay Mutton Block D051 (65g = Rp 5,200) & Sauce Lada Hitam WIP',
  },
  'HBX-RICA': {
    card: 'HerBox New #34: Rica-Rica Ricebox',
    status: 'flagged_fixed',
    note: 'Synced VeggieWay Ji Block Tyfel 2.5kg A005 (65g = Rp 4,232) & Sauce Rica-Rica WIP',
  },
  'HBX-KATSU-RICE': {
    card: 'Shared Card: Herbox Ricebox Base + VeggieWay Ji Katsu J001A',
    status: 'shared_card',
    note: "Synced VeggieWay Ji' Katsu J001A (Rp 5,813/pcs) + Herbox Rice/Salad Base",
  },
  'HBX-BEEF-MENTAI': {
    card: 'HerBox New #199: Mentai Ricebox (VeggieWay Mutton D051)',
    status: 'shared_card',
    note: 'Synced VeggieWay Mutton Block D051 (65g = Rp 5,200) + Sauce Mentai WIP',
  },
  'HBX-FYSH-MENTAI': {
    card: 'HerBox New #199: Fysh Mentai Ricebox',
    status: 'verified_sheet',
    note: 'Synced VeggieWay Kan Finger J005 (2 strips = Rp 5,143) + Sauce Mentai WIP',
  },
  'HBX-BEEF-WRAP': {
    card: 'Sauce Herbox #247: Beef Wrap',
    status: 'verified_sheet',
    note: 'Synced Mission Tortilla 10" Sukanda & VeggieWay Mutton Block D051 (60g = Rp 4,800)',
  },
  'HBX-RICA-WRAP': {
    card: 'Sauce Herbox #211: Rica Wrap',
    status: 'verified_sheet',
    note: 'Synced Mission Tortilla 10" Sukanda & VeggieWay Ji Block Tyfel A005 (65g = Rp 4,232)',
  },
  'HBX-KATSU-WRAP': {
    card: 'LITEBITE #122: Tyfel Burritos / Katsu Wrap',
    status: 'shared_card',
    note: "Synced Mission Tortilla 10\" Sukanda & VeggieWay Ji' Katsu J001A (Rp 5,813/pcs)",
  },
  'HBX-TOTS': {
    card: 'LITEBITE #188: Potato Pom2 / Tater Tots (Sukanda)',
    status: 'shared_card',
    note: 'Synced NN Potato Pom2 / Tater Tots Sukanda (Rp 44,500/kg)',
  },
  'HBX-NUGGET': {
    card: 'LITEBITE #171: Chick Chunk (VeggieWay Ji Block A005)',
    status: 'shared_card',
    note: 'Synced VeggieWay Ji Block Tyfel 2.5kg A005 (80g = Rp 5,208)',
  },

  // LA Breakfast Club
  'HERO-LABC-CO': {
    card: 'Shared Card: 3-Egg Cheese Omelette + Side Tots',
    status: 'shared_card',
    note: 'Shares Kitchen Card with ABC Cheese Omelette - Side Tater Tots',
  },
  'LABC-CHICK-BUR': {
    card: 'Shared Card: Mock Chicken / Katsu Breakfast Burrito',
    status: 'shared_card',
    note: "Synced Mission Tortilla 10\", VeggieWay Ji' Katsu J001A (Rp 5,813), NN Tots & Bega Cheddar",
  },
};

export interface MasterIngredientRecord extends MasterIngredientSeed {
  updated_at: string;
  effective_unit_cost: number; // Rp per base_unit after yield_pct
  cost_per_100_units: number; // Rp per 100g / 100ml / 1 pcs
  recipes_using_count: number;
  recipe_names: string[];
  monthly_units_consumed: number; // in base_unit (g, ml, pcs) based on POS sales
  monthly_theoretical_spend: number; // in Rp based on POS sales
}

export interface RecipeBomLineDetail {
  line_id: string;
  recipe_id: string;
  ingredient_id: string;
  ingredient_name: string;
  category: IngredientCategory;
  supplier_name: string;
  base_unit: BaseUnit;
  component_role: ComponentRole;
  qty_per_serving: number;
  effective_unit_cost: number;
  line_cost: number;
  share_of_food_cost_pct: number;
  prep_notes: string;
}

export interface RecipeCogsDetailRecord {
  recipe_id: string;
  brand: string;
  item_name: string;
  canonical_name: string;
  category: string;
  kitchen_recipe_card: string;
  audit_status: RecipeAuditStatus;
  audit_note: string;
  bom_summary: string;
  raw_food_cost: number;
  packaging_dine_in: number;
  packaging_delivery: number;
  target_food_cost_pct: number;
  is_hero_bom: boolean;
  has_itemized_lines: boolean;
  calculated_food_cost: number;
  calculated_pkg_dine_in: number;
  calculated_pkg_delivery: number;
  units_sold: number;
  gross_revenue: number;
  avg_selling_price: number;
  dine_in_total_cogs: number;
  delivery_total_cogs: number;
  dine_in_cogs_pct: number;
  delivery_cogs_pct: number;
  blended_cogs_per_unit: number;
  blended_cogs_pct: number;
  gross_margin_per_unit: number;
  total_theoretical_cogs: number;
  total_gross_profit: number;
  variance_vs_target_pct: number;
  margin_status: 'healthy' | 'watch' | 'critical';
  lines: RecipeBomLineDetail[];
}

export interface RecipesCogsDashboardData {
  summary: {
    totalActiveRecipes: number;
    itemizedRecipesCount: number;
    totalMasterIngredients: number;
    totalUnitsSoldMapped: number;
    totalRevenueMapped: number;
    totalTheoreticalFoodSpend: number;
    totalTheoreticalPackagingSpend: number;
    totalTheoreticalCogs: number;
    weightedFoodCostPct: number;
    weightedPackagingCostPct: number;
    weightedTotalCogsPct: number;
    healthyRecipesCount: number;
    watchlistRecipesCount: number;
    criticalRecipesCount: number;
  };
  ingredients: MasterIngredientRecord[];
  recipes: RecipeCogsDetailRecord[];
  categorySpendBreakdown: Array<{
    category: string;
    ingredientCount: number;
    monthlySpend: number;
    shareOfSpendPct: number;
  }>;
  brandCogsComparison: Array<{
    brand: string;
    recipeCount: number;
    revenue: number;
    foodSpend: number;
    packagingSpend: number;
    totalCogs: number;
    cogsPct: number;
    targetPct: number;
  }>;
}

/**
 * Fetches the complete Recipe & Ingredient COGS Intelligence dataset.
 */
export async function getRecipesCogsDashboardData(
  brandFilter?: string
): Promise<RecipesCogsDashboardData> {
  await ensureRecipesCogsTables();

  const normalizedBrand =
    brandFilter && brandFilter !== 'all' ? sqlEscape(brandFilter.trim()) : null;

  const [rawIngredients, rawRecipes, rawLines] = await Promise.all([
    // 1. Fetch all master ingredients
    query<{
      ingredient_id: string;
      ingredient_name: string;
      category: IngredientCategory;
      supplier_name: string;
      purchase_unit_label: string;
      purchase_qty: number;
      base_unit: BaseUnit;
      purchase_price: number;
      yield_pct: number;
      updated_at: string;
    }>(`
      SELECT
        ingredient_id,
        ingredient_name,
        category,
        supplier_name,
        purchase_unit_label,
        purchase_qty,
        base_unit,
        purchase_price,
        yield_pct,
        updated_at
      FROM dim_ingredients
      ORDER BY category ASC, ingredient_name ASC
    `),

    // 2. Fetch all recipes + their realized POS volume and revenue
    query<{
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
      units_sold: number;
      gross_revenue: number;
      avg_price: number;
    }>(`
      WITH sku_sales AS (
        SELECT
          foi.brand,
          LOWER(TRIM(foi.item_name)) AS item_key,
          CAST(SUM(COALESCE(foi.item_qty, 1)) AS DOUBLE) AS units_sold,
          CAST(
            COALESCE(
              SUM(COALESCE(foi.item_qty, 1)) * ROUND(AVG(NULLIF(foi.item_price, 0)), 0),
              SUM(COALESCE(foi.item_qty, 1) * COALESCE(foi.item_price, 0))
            ) AS DOUBLE
          ) AS gross_revenue,
          CAST(ROUND(AVG(NULLIF(foi.item_price, 0)), 0) AS DOUBLE) AS avg_price
        FROM fact_order_items foi
        WHERE foi.status != 'CANCELLED'
        GROUP BY 1, 2
      )
      SELECT
        r.recipe_id,
        r.brand,
        r.item_name,
        r.canonical_name,
        r.category,
        r.bom_summary,
        r.raw_food_cost,
        r.packaging_dine_in,
        r.packaging_delivery,
        r.target_food_cost_pct,
        r.is_hero_bom,
        COALESCE(s.units_sold, 0) AS units_sold,
        COALESCE(s.gross_revenue, 0) AS gross_revenue,
        CASE
          WHEN COALESCE(s.avg_price, 0) > 0 THEN s.avg_price
          WHEN r.category ILIKE '%Coffee%' OR r.category ILIKE '%Tea%' OR r.category ILIKE '%Matcha%' THEN 35000
          ELSE 55000
        END AS avg_price
      FROM dim_recipes r
      LEFT JOIN sku_sales s
        ON LOWER(r.brand) = LOWER(s.brand)
       AND LOWER(TRIM(r.item_name)) = s.item_key
      ${normalizedBrand ? `WHERE LOWER(r.brand) = LOWER('${normalizedBrand}')` : ''}
      ORDER BY COALESCE(s.gross_revenue, 0) DESC, r.is_hero_bom DESC, r.canonical_name ASC
    `),

    // 3. Fetch all recipe ingredient lines
    query<{
      line_id: string;
      recipe_id: string;
      ingredient_id: string;
      component_role: ComponentRole;
      qty_per_serving: number;
      prep_notes: string;
    }>(`
      SELECT
        line_id,
        recipe_id,
        ingredient_id,
        component_role,
        qty_per_serving,
        prep_notes
      FROM fact_recipe_ingredients
      ORDER BY line_id ASC
    `),
  ]);

  // Map ingredients by ID
  const ingredientMap = new Map<string, MasterIngredientRecord>();
  for (const ing of rawIngredients) {
    const effCost = computeEffectiveUnitCost(
      Number(ing.purchase_price),
      Number(ing.purchase_qty),
      Number(ing.yield_pct)
    );
    ingredientMap.set(ing.ingredient_id, {
      ...ing,
      purchase_qty: Number(ing.purchase_qty),
      purchase_price: Number(ing.purchase_price),
      yield_pct: Number(ing.yield_pct),
      effective_unit_cost: effCost,
      cost_per_100_units: ing.base_unit === 'pcs' ? effCost : effCost * 100,
      recipes_using_count: 0,
      recipe_names: [],
      monthly_units_consumed: 0,
      monthly_theoretical_spend: 0,
    });
  }

  // Group lines by recipe_id
  const linesByRecipe = new Map<string, typeof rawLines>();
  for (const ln of rawLines) {
    const list = linesByRecipe.get(ln.recipe_id) || [];
    list.push(ln);
    linesByRecipe.set(ln.recipe_id, list);
  }

  let totalUnitsSoldMapped = 0;
  let totalRevenueMapped = 0;
  let totalTheoreticalFoodSpend = 0;
  let totalTheoreticalPackagingSpend = 0;
  let itemizedRecipesCount = 0;
  let healthyRecipesCount = 0;
  let watchlistRecipesCount = 0;
  let criticalRecipesCount = 0;

  const brandAggMap = new Map<
    string,
    {
      recipeCount: number;
      revenue: number;
      foodSpend: number;
      packagingSpend: number;
      targetWeightedSum: number;
    }
  >();

  // Delivery vs Dine-In channel blend (approx 62% delivery / 38% dine-in across cloud-kitchen + cafe concepts)
  const DELIVERY_SHARE = 0.62;
  const DINE_IN_SHARE = 0.38;

  const detailedRecipes: RecipeCogsDetailRecord[] = rawRecipes.map((rec) => {
    const recLinesRaw = linesByRecipe.get(rec.recipe_id) || [];
    const hasItemizedLines = recLinesRaw.length > 0;
    if (hasItemizedLines) itemizedRecipesCount += 1;

    let calcFood = 0;
    let calcPkgDi = 0;
    let calcPkgDel = 0;

    const unitsSold = Number(rec.units_sold || 0);
    const grossRev = Number(rec.gross_revenue || 0);
    const avgSellingPrice = Math.round(Number(rec.avg_price || 45000));

    const tempLines: RecipeBomLineDetail[] = recLinesRaw.map((ln) => {
      const ing = ingredientMap.get(ln.ingredient_id);
      const effUnitCost = ing ? ing.effective_unit_cost : 0;
      const qty = Number(ln.qty_per_serving || 0);
      const lineCost = qty * effUnitCost;

      if (ln.component_role === 'food') {
        calcFood += lineCost;
      } else if (ln.component_role === 'packaging_dine_in') {
        calcPkgDi += lineCost;
      } else if (ln.component_role === 'packaging_delivery') {
        calcPkgDel += lineCost;
      }

      // Accumulate ingredient usage & theoretical spend if this recipe is in scope
      if (ing) {
        if (!ing.recipe_names.includes(rec.canonical_name)) {
          ing.recipe_names.push(rec.canonical_name);
          ing.recipes_using_count = ing.recipe_names.length;
        }
        const channelWeight =
          ln.component_role === 'packaging_dine_in'
            ? DINE_IN_SHARE
            : ln.component_role === 'packaging_delivery'
            ? DELIVERY_SHARE
            : 1;
        const unitsConsumed = unitsSold * qty * channelWeight;
        ing.monthly_units_consumed += unitsConsumed;
        ing.monthly_theoretical_spend += unitsConsumed * effUnitCost;
      }

      return {
        line_id: ln.line_id,
        recipe_id: ln.recipe_id,
        ingredient_id: ln.ingredient_id,
        ingredient_name: ing?.ingredient_name || ln.ingredient_id,
        category: ing?.category || 'Produce & Fungi',
        supplier_name: ing?.supplier_name || 'Local Supplier',
        base_unit: ing?.base_unit || 'g',
        component_role: ln.component_role,
        qty_per_serving: qty,
        effective_unit_cost: effUnitCost,
        line_cost: Math.round(lineCost),
        share_of_food_cost_pct: 0,
        prep_notes: ln.prep_notes || '',
      };
    });

    const rawFoodCost = hasItemizedLines
      ? Math.round(calcFood)
      : Math.round(Number(rec.raw_food_cost || 0));
    const pkgDineIn = hasItemizedLines
      ? Math.round(calcPkgDi)
      : Math.round(Number(rec.packaging_dine_in || 0));
    const pkgDelivery = hasItemizedLines
      ? Math.round(calcPkgDel)
      : Math.round(Number(rec.packaging_delivery || 0));

    // Populate share_of_food_cost_pct
    for (const l of tempLines) {
      if (l.component_role === 'food' && rawFoodCost > 0) {
        l.share_of_food_cost_pct = Number(((l.line_cost / rawFoodCost) * 100).toFixed(1));
      }
    }

    const dineInTotalCogs = rawFoodCost + pkgDineIn;
    const deliveryTotalCogs = rawFoodCost + pkgDelivery;
    const blendedPkgPerUnit = Math.round(pkgDineIn * DINE_IN_SHARE + pkgDelivery * DELIVERY_SHARE);
    const blendedCogsPerUnit = rawFoodCost + blendedPkgPerUnit;

    const rawFoodCostPct =
      avgSellingPrice > 0 ? Number(((rawFoodCost / avgSellingPrice) * 100).toFixed(1)) : 0;
    const dineInCogsPct =
      avgSellingPrice > 0 ? Number(((dineInTotalCogs / avgSellingPrice) * 100).toFixed(1)) : 0;
    const deliveryCogsPct =
      avgSellingPrice > 0 ? Number(((deliveryTotalCogs / avgSellingPrice) * 100).toFixed(1)) : 0;
    const blendedCogsPct =
      avgSellingPrice > 0 ? Number(((blendedCogsPerUnit / avgSellingPrice) * 100).toFixed(1)) : 0;

    const targetPct = Number(rec.target_food_cost_pct || 28);
    const varianceVsTargetPct = Number((rawFoodCostPct - targetPct).toFixed(1));

    let marginStatus: 'healthy' | 'watch' | 'critical' = 'healthy';
    if (varianceVsTargetPct > 6 || blendedCogsPct >= 44) {
      marginStatus = 'critical';
      criticalRecipesCount += 1;
    } else if (varianceVsTargetPct > 2 || blendedCogsPct >= 38) {
      marginStatus = 'watch';
      watchlistRecipesCount += 1;
    } else {
      healthyRecipesCount += 1;
    }

    const recipeFoodSpend = unitsSold * rawFoodCost;
    const recipePkgSpend = unitsSold * blendedPkgPerUnit;
    const totalTheoreticalCogs = recipeFoodSpend + recipePkgSpend;
    const totalGrossProfit = Math.max(0, grossRev - totalTheoreticalCogs);

    totalUnitsSoldMapped += unitsSold;
    totalRevenueMapped += grossRev;
    totalTheoreticalFoodSpend += recipeFoodSpend;
    totalTheoreticalPackagingSpend += recipePkgSpend;

    const bAgg = brandAggMap.get(rec.brand) || {
      recipeCount: 0,
      revenue: 0,
      foodSpend: 0,
      packagingSpend: 0,
      targetWeightedSum: 0,
    };
    bAgg.recipeCount += 1;
    bAgg.revenue += grossRev;
    bAgg.foodSpend += recipeFoodSpend;
    bAgg.packagingSpend += recipePkgSpend;
    bAgg.targetWeightedSum += targetPct * (grossRev > 0 ? grossRev : 1);
    brandAggMap.set(rec.brand, bAgg);

    const cardMeta = KITCHEN_RECIPE_CARD_MAP[rec.recipe_id] || {
      card: `POS Mapped: ${rec.category}`,
      status: 'shared_card' as RecipeAuditStatus,
      note: 'Mapped to Master Ingredient Catalog',
    };

    return {
      recipe_id: rec.recipe_id,
      brand: rec.brand,
      item_name: rec.item_name,
      canonical_name: rec.canonical_name,
      category: rec.category,
      kitchen_recipe_card: cardMeta.card,
      audit_status: cardMeta.status,
      audit_note: cardMeta.note,
      bom_summary: rec.bom_summary,
      raw_food_cost: rawFoodCost,
      packaging_dine_in: pkgDineIn,
      packaging_delivery: pkgDelivery,
      target_food_cost_pct: targetPct,
      is_hero_bom: Boolean(rec.is_hero_bom),
      has_itemized_lines: hasItemizedLines,
      calculated_food_cost: Math.round(calcFood),
      calculated_pkg_dine_in: Math.round(calcPkgDi),
      calculated_pkg_delivery: Math.round(calcPkgDel),
      units_sold: unitsSold,
      gross_revenue: Math.round(grossRev),
      avg_selling_price: avgSellingPrice,
      dine_in_total_cogs: dineInTotalCogs,
      delivery_total_cogs: deliveryTotalCogs,
      dine_in_cogs_pct: dineInCogsPct,
      delivery_cogs_pct: deliveryCogsPct,
      blended_cogs_per_unit: blendedCogsPerUnit,
      blended_cogs_pct: blendedCogsPct,
      gross_margin_per_unit: Math.max(0, avgSellingPrice - blendedCogsPerUnit),
      total_theoretical_cogs: Math.round(totalTheoreticalCogs),
      total_gross_profit: Math.round(totalGrossProfit),
      variance_vs_target_pct: varianceVsTargetPct,
      margin_status: marginStatus,
      lines: tempLines,
    };
  });

  const ingredientsList = Array.from(ingredientMap.values()).map((ing) => ({
    ...ing,
    monthly_units_consumed: Math.round(ing.monthly_units_consumed),
    monthly_theoretical_spend: Math.round(ing.monthly_theoretical_spend),
  }));

  // Category spend breakdown
  const catMap = new Map<string, { ingredientCount: number; monthlySpend: number }>();
  let totalIngredientTrackedSpend = 0;
  for (const ing of ingredientsList) {
    const curr = catMap.get(ing.category) || { ingredientCount: 0, monthlySpend: 0 };
    curr.ingredientCount += 1;
    curr.monthlySpend += ing.monthly_theoretical_spend;
    totalIngredientTrackedSpend += ing.monthly_theoretical_spend;
    catMap.set(ing.category, curr);
  }

  const categorySpendBreakdown = Array.from(catMap.entries())
    .map(([category, stats]) => ({
      category,
      ingredientCount: stats.ingredientCount,
      monthlySpend: Math.round(stats.monthlySpend),
      shareOfSpendPct:
        totalIngredientTrackedSpend > 0
          ? Number(((stats.monthlySpend / totalIngredientTrackedSpend) * 100).toFixed(1))
          : 0,
    }))
    .sort((a, b) => b.monthlySpend - a.monthlySpend);

  const brandCogsComparison = Array.from(brandAggMap.entries())
    .map(([brand, stats]) => {
      const totalCogs = stats.foodSpend + stats.packagingSpend;
      return {
        brand,
        recipeCount: stats.recipeCount,
        revenue: Math.round(stats.revenue),
        foodSpend: Math.round(stats.foodSpend),
        packagingSpend: Math.round(stats.packagingSpend),
        totalCogs: Math.round(totalCogs),
        cogsPct:
          stats.revenue > 0 ? Number(((totalCogs / stats.revenue) * 100).toFixed(1)) : 0,
        targetPct:
          stats.revenue > 0
            ? Number((stats.targetWeightedSum / stats.revenue).toFixed(1))
            : 30,
      };
    })
    .sort((a, b) => b.revenue - a.revenue);

  const totalTheoreticalCogs = totalTheoreticalFoodSpend + totalTheoreticalPackagingSpend;
  const weightedFoodCostPct =
    totalRevenueMapped > 0
      ? Number(((totalTheoreticalFoodSpend / totalRevenueMapped) * 100).toFixed(1))
      : 0;
  const weightedPackagingCostPct =
    totalRevenueMapped > 0
      ? Number(((totalTheoreticalPackagingSpend / totalRevenueMapped) * 100).toFixed(1))
      : 0;
  const weightedTotalCogsPct =
    totalRevenueMapped > 0
      ? Number(((totalTheoreticalCogs / totalRevenueMapped) * 100).toFixed(1))
      : 0;

  return {
    summary: {
      totalActiveRecipes: detailedRecipes.length,
      itemizedRecipesCount,
      totalMasterIngredients: ingredientsList.length,
      totalUnitsSoldMapped,
      totalRevenueMapped: Math.round(totalRevenueMapped),
      totalTheoreticalFoodSpend: Math.round(totalTheoreticalFoodSpend),
      totalTheoreticalPackagingSpend: Math.round(totalTheoreticalPackagingSpend),
      totalTheoreticalCogs: Math.round(totalTheoreticalCogs),
      weightedFoodCostPct,
      weightedPackagingCostPct,
      weightedTotalCogsPct,
      healthyRecipesCount,
      watchlistRecipesCount,
      criticalRecipesCount,
    },
    ingredients: ingredientsList,
    recipes: detailedRecipes,
    categorySpendBreakdown,
    brandCogsComparison,
  };
}

/**
 * Recalculates `raw_food_cost`, `packaging_dine_in`, `packaging_delivery`, and `bom_summary`
 * in `dim_recipes` for all recipes (or a specific list of recipe_ids) that have itemized lines
 * in `fact_recipe_ingredients`.
 */
export async function syncDimRecipesFromIngredientLines(
  targetRecipeIds?: string[]
): Promise<{ updatedRecipesCount: number; affectedRecipeIds: string[] }> {
  await ensureRecipesCogsTables();

  const filterClause =
    targetRecipeIds && targetRecipeIds.length > 0
      ? `WHERE l.recipe_id IN (${targetRecipeIds.map((id) => `'${sqlEscape(id)}'`).join(', ')})`
      : '';

  const rows = await query<{
    recipe_id: string;
    ingredient_name: string;
    base_unit: string;
    component_role: ComponentRole;
    qty_per_serving: number;
    purchase_price: number;
    purchase_qty: number;
    yield_pct: number;
  }>(`
    SELECT
      l.recipe_id,
      i.ingredient_name,
      i.base_unit,
      l.component_role,
      l.qty_per_serving,
      i.purchase_price,
      i.purchase_qty,
      i.yield_pct
    FROM fact_recipe_ingredients l
    INNER JOIN dim_ingredients i
      ON l.ingredient_id = i.ingredient_id
    ${filterClause}
    ORDER BY l.recipe_id ASC, l.line_id ASC
  `);

  const byRecipe = new Map<
    string,
    {
      foodCost: number;
      pkgDi: number;
      pkgDel: number;
      summaryParts: string[];
    }
  >();

  for (const r of rows) {
    const effUnit = computeEffectiveUnitCost(
      Number(r.purchase_price),
      Number(r.purchase_qty),
      Number(r.yield_pct)
    );
    const qty = Number(r.qty_per_serving || 0);
    const lineCost = qty * effUnit;

    const curr = byRecipe.get(r.recipe_id) || {
      foodCost: 0,
      pkgDi: 0,
      pkgDel: 0,
      summaryParts: [],
    };

    if (r.component_role === 'food') {
      curr.foodCost += lineCost;
      const shortName = r.ingredient_name.split('(')[0].trim();
      const qtyStr = Number.isInteger(qty) ? String(qty) : qty.toFixed(1);
      curr.summaryParts.push(
        `${qtyStr}${r.base_unit} ${shortName} (Rp ${Math.round(lineCost).toLocaleString()})`
      );
    } else if (r.component_role === 'packaging_dine_in') {
      curr.pkgDi += lineCost;
    } else if (r.component_role === 'packaging_delivery') {
      curr.pkgDel += lineCost;
    }

    byRecipe.set(r.recipe_id, curr);
  }

  const affectedRecipeIds: string[] = [];
  const updatePromises: Promise<unknown>[] = [];

  for (const [recipeId, calc] of byRecipe.entries()) {
    const foodRounded = Math.round(calc.foodCost);
    const diRounded = Math.round(calc.pkgDi);
    const delRounded = Math.round(calc.pkgDel);
    const summaryText =
      calc.summaryParts.join(' + ') +
      ` · Pkg DI Rp ${diRounded.toLocaleString()} / Del Rp ${delRounded.toLocaleString()}`;

    affectedRecipeIds.push(recipeId);
    updatePromises.push(
      execute(`
        UPDATE dim_recipes
        SET
          raw_food_cost = ${foodRounded},
          packaging_dine_in = ${diRounded},
          packaging_delivery = ${delRounded},
          bom_summary = '${sqlEscape(summaryText)}'
        WHERE recipe_id = '${sqlEscape(recipeId)}'
      `)
    );
  }

  await Promise.all(updatePromises);

  return {
    updatedRecipesCount: affectedRecipeIds.length,
    affectedRecipeIds,
  };
}

export interface UpsertMasterIngredientInput {
  ingredient_id?: string | null;
  ingredient_name: string;
  category: IngredientCategory;
  supplier_name: string;
  purchase_unit_label: string;
  purchase_qty: number;
  base_unit: BaseUnit;
  purchase_price: number;
  yield_pct: number;
}

/**
 * Updates or creates a master ingredient in `dim_ingredients` and automatically cascades
 * the new unit cost to every recipe in `dim_recipes` that uses this ingredient.
 */
export async function upsertMasterIngredient(input: UpsertMasterIngredientInput): Promise<{
  ingredient_id: string;
  cascadedRecipesCount: number;
  affectedRecipeIds: string[];
}> {
  await ensureRecipesCogsTables();

  const ingId =
    input.ingredient_id && input.ingredient_id.trim().length > 0
      ? input.ingredient_id.trim()
      : `ING-CUST-${Date.now().toString(36).toUpperCase()}`;

  const nowIso = new Date().toISOString();
  const safePrice = Math.max(0, Number(input.purchase_price) || 0);
  const safeQty = Math.max(0.01, Number(input.purchase_qty) || 1);
  const safeYield = Math.max(10, Math.min(100, Number(input.yield_pct) || 100));

  await execute(`DELETE FROM dim_ingredients WHERE ingredient_id = '${sqlEscape(ingId)}'`);
  await execute(`
    INSERT INTO dim_ingredients (
      ingredient_id, ingredient_name, category, supplier_name,
      purchase_unit_label, purchase_qty, base_unit, purchase_price, yield_pct, updated_at
    ) VALUES (
      '${sqlEscape(ingId)}',
      '${sqlEscape(input.ingredient_name.trim())}',
      '${sqlEscape(input.category)}',
      '${sqlEscape(input.supplier_name.trim() || 'Preferred Supplier')}',
      '${sqlEscape(input.purchase_unit_label.trim() || '1 Pack')}',
      ${safeQty},
      '${sqlEscape(input.base_unit)}',
      ${safePrice},
      ${safeYield},
      '${nowIso}'
    )
  `);

  // Find all recipes using this ingredient and cascade update their dim_recipes COGS
  const usedInRows = await query<{ recipe_id: string }>(`
    SELECT DISTINCT recipe_id
    FROM fact_recipe_ingredients
    WHERE ingredient_id = '${sqlEscape(ingId)}'
  `);
  const recipeIds = usedInRows.map((r) => r.recipe_id);

  let cascadedRecipesCount = 0;
  if (recipeIds.length > 0) {
    const syncRes = await syncDimRecipesFromIngredientLines(recipeIds);
    cascadedRecipesCount = syncRes.updatedRecipesCount;
  }

  return {
    ingredient_id: ingId,
    cascadedRecipesCount,
    affectedRecipeIds: recipeIds,
  };
}

export interface SaveRecipeLinesInput {
  recipe_id: string;
  target_food_cost_pct?: number;
  lines: Array<{
    ingredient_id: string;
    component_role: ComponentRole;
    qty_per_serving: number;
    prep_notes?: string;
  }>;
}

/**
 * Replaces the itemized ingredient lines for a recipe in `fact_recipe_ingredients`
 * and recalculates the recipe's `dim_recipes` cost columns.
 */
export async function saveRecipeIngredientLines(input: SaveRecipeLinesInput): Promise<{
  recipe_id: string;
  linesSaved: number;
}> {
  await ensureRecipesCogsTables();

  const recipeId = input.recipe_id.trim();
  await execute(`DELETE FROM fact_recipe_ingredients WHERE recipe_id = '${sqlEscape(recipeId)}'`);

  const validLines = input.lines.filter(
    (l) => l.ingredient_id && Number(l.qty_per_serving) > 0
  );

  if (validLines.length > 0) {
    const valuesSql = validLines
      .map((ln, idx) => {
        const lineId = `LINE-${recipeId}-${String(idx + 1).padStart(2, '0')}-${Date.now()
          .toString(36)
          .slice(-4)}`;
        return `('${sqlEscape(lineId)}', '${sqlEscape(recipeId)}', '${sqlEscape(
          ln.ingredient_id
        )}', '${sqlEscape(ln.component_role)}', ${Number(ln.qty_per_serving)}, '${sqlEscape(
          (ln.prep_notes || '').trim()
        )}')`;
      })
      .join(',\n');

    await execute(`
      INSERT INTO fact_recipe_ingredients (
        line_id, recipe_id, ingredient_id, component_role, qty_per_serving, prep_notes
      ) VALUES
      ${valuesSql};
    `);
  }

  if (typeof input.target_food_cost_pct === 'number' && input.target_food_cost_pct > 0) {
    await execute(`
      UPDATE dim_recipes
      SET target_food_cost_pct = ${Number(input.target_food_cost_pct)}
      WHERE recipe_id = '${sqlEscape(recipeId)}'
    `);
  }

  await syncDimRecipesFromIngredientLines([recipeId]);

  return {
    recipe_id: recipeId,
    linesSaved: validLines.length,
  };
}

/**
 * Resets all master ingredients and recipe ingredient lines to the calibrated factory seed,
 * and syncs `dim_recipes` back to the master specifications.
 */
export async function resetRecipesCogsToFactorySeed(): Promise<{
  ingredientsReset: number;
  linesReset: number;
}> {
  await ensureRecipesCogsTables();

  await execute(`DELETE FROM dim_ingredients`);
  await execute(`DELETE FROM fact_recipe_ingredients`);
  await execute(`DELETE FROM dim_recipes`);
  globalForRecipesCogs.__fnbRecipesCogsEnsured = false;

  await ensureRecipesCogsTables();
  await syncDimRecipesFromIngredientLines();

  return {
    ingredientsReset: MASTER_INGREDIENTS_SEED.length,
    linesReset: RECIPE_INGREDIENT_LINES_SEED.length,
  };
}

