// Financial Statement & P&L Categories for F&B Operations
export type FinanceCategoryType = 'REVENUE' | 'COGS' | 'OPEX' | 'NON_OPERATING';

export interface CategoryDefinition {
  id: string;
  name: string;
  type: FinanceCategoryType;
  description: string;
  subcategories: string[];
}

export const FINANCE_CATEGORIES: CategoryDefinition[] = [
  // ─── REVENUE ───
  {
    id: 'REV_ONLINE',
    name: 'Online Delivery Settlements',
    type: 'REVENUE',
    description: 'GoFood, GrabFood, ShopeeFood merchant disbursements',
    subcategories: ['GoPay / Dompet Anak Bangsa', 'OVO / Visionet', 'ShopeePay', 'Grab'],
  },
  {
    id: 'REV_OFFLINE',
    name: 'Dine-In & QRIS Settlements',
    type: 'REVENUE',
    description: 'BCA QRIS, EDC card settlement, Majoo POS cash/card',
    subcategories: ['QRIS Tyfel', 'EDC Kartu Kredit', 'Majoo POS', 'Cash / Direct'],
  },
  {
    id: 'REV_CATERING',
    name: 'Catering & B2B Orders',
    type: 'REVENUE',
    description: 'Herbox catering preorders and corporate event catering',
    subcategories: ['Herbox Catering', 'B2B Corporate Orders', 'Custom Events'],
  },
  {
    id: 'REV_OTHER',
    name: 'Other Operating Income',
    type: 'REVENUE',
    description: 'Bank interest, cashback, refunds from vendors',
    subcategories: ['Bank Interest', 'Vendor Refunds', 'Miscellaneous Income'],
  },

  // ─── COGS (Cost of Goods Sold) ───
  {
    id: 'COGS_INGREDIENTS',
    name: 'Raw Materials & Ingredients',
    type: 'COGS',
    description: 'Proteins, frozen items, veggies, eggs, dairy, seasonings',
    subcategories: [
      'Frozen & Proteins (Sukanda, Sumartono)',
      'Dairy & Milk (Fresh Milk, UHT)',
      'Eggs (Telor)',
      'Fresh Produce & Vegetables (Dunia Segar)',
      'Cooking Oil & Pantry Staples (Rio)',
      'Bakery & Pastry (Will & Em)',
    ],
  },
  {
    id: 'COGS_BEVERAGES',
    name: 'Coffee & Beverage Supplies',
    type: 'COGS',
    description: 'Coffee beans, syrups, tea bags, CO2 sodafresh',
    subcategories: ['Coffee Beans (Cipta Usaha)', 'Syrups & Flavourings', 'Tea & Matchas', 'CO2 Sodafresh'],
  },
  {
    id: 'COGS_PACKAGING',
    name: 'Packaging & Disposables',
    type: 'COGS',
    description: 'Thinwall boxes, cups, straws, carry bags, sticker labels',
    subcategories: ['Boxes & Thinwalls', 'Cups & Lids', 'Stickers & Labels', 'Plastics & Bags'],
  },

  // ─── OPEX (Operating Expenses) ───
  {
    id: 'OPEX_PAYROLL',
    name: 'Salaries & Staff Wages',
    type: 'OPEX',
    description: 'Employee monthly payroll, baristas, kitchen helpers',
    subcategories: ['Store Staff Salaries', 'Kitchen Helper Wages', 'Bonus & Overtime'],
  },
  {
    id: 'OPEX_RENT',
    name: 'Rent & Cloud Kitchen Facilities',
    type: 'OPEX',
    description: 'Store space rental, cloud kitchen shared facility (Dapur Awan)',
    subcategories: ['Cloud Kitchen Rent', 'Store Rental', 'Service Charge'],
  },
  {
    id: 'OPEX_UTILITIES',
    name: 'Utilities & Connectivity',
    type: 'OPEX',
    description: 'LPG cooking gas, Biznet internet, electricity, water',
    subcategories: ['LPG Cooking Gas (Rizki)', 'Internet & WiFi (Biznet)', 'Electricity & Water'],
  },
  {
    id: 'OPEX_LOGISTICS',
    name: 'Logistics & Inter-Branch Delivery',
    type: 'OPEX',
    description: 'Lalamove stock transfers, courier deliveries, store runs',
    subcategories: ['Lalamove Deliveries', 'Courier & Logistics', 'Transport'],
  },
  {
    id: 'OPEX_MAINTENANCE',
    name: 'Repairs & Store Maintenance',
    type: 'OPEX',
    description: 'Building repairs, painting, plumbing, sealant, hardware',
    subcategories: ['Building Repairs & Paint', 'Equipment Servicing', 'Sanitation & Pest Control'],
  },
  {
    id: 'OPEX_SUPPLIES',
    name: 'Store Supplies & Sundries',
    type: 'OPEX',
    description: 'Cleaning supplies, grocery runs (Astro), e-commerce supplies',
    subcategories: ['Astro Grocery Runs', 'Shopee/Tokopedia Supplies', 'Cleaning Supplies'],
  },
  {
    id: 'OPEX_TECH',
    name: 'Software & Technology',
    type: 'OPEX',
    description: 'POS subscriptions, kitchen display, Shadowchef ERP',
    subcategories: ['POS Software', 'Shadowchef ERP', 'IT Services'],
  },
  {
    id: 'OPEX_BANK_FEES',
    name: 'Bank & Transaction Fees',
    type: 'OPEX',
    description: 'Monthly account admin, BI-FAST transfer fees, QRIS DDR',
    subcategories: ['Monthly Bank Admin Fee', 'BI-FAST Transfer Fees (Rp 2,500)', 'QRIS / EDC Merchant Fees'],
  },
  {
    id: 'OPEX_TAX',
    name: 'Taxes & Regulatory',
    type: 'OPEX',
    description: 'Pajak Restoran DKI (PB1), interest withholding tax',
    subcategories: ['Pajak DKI Restoran', 'Interest Withholding Tax'],
  },
  {
    id: 'OPEX_MARKETING',
    name: 'Marketing, Events & CSR',
    type: 'OPEX',
    description: 'Bazaar sponsorship, promotional material, CSR donations',
    subcategories: ['Bazaar Sponsorship', 'Donations & CSR', 'Promotions'],
  },

  // ─── NON-OPERATING / TRANSFERS / CAPEX ───
  {
    id: 'NON_OP_CAPEX',
    name: 'Capital Expenditure (Equipment)',
    type: 'NON_OPERATING',
    description: 'Machinery, coffee grinders, espresso equipment investments',
    subcategories: ['Grinder & Brewing Equipment', 'Kitchen Machinery', 'Furniture'],
  },
  {
    id: 'NON_OP_DRAWINGS',
    name: 'Owner Transfers & Drawings',
    type: 'NON_OPERATING',
    description: 'Owner capital injection, personal drawings, deposit refunds',
    subcategories: ['Owner Injections / Capital', 'Owner Drawings', 'Deposit Transfers'],
  },
  {
    id: 'NON_OP_ADVANCE',
    name: 'Staff Cash Advance (Kasbon)',
    type: 'NON_OPERATING',
    description: 'Temporary employee cash advance settlements',
    subcategories: ['Cash Advance (Kasbon)', 'Loan Settlements'],
  },
];

export interface CategorizationRule {
  id: string;
  pattern: RegExp;
  category: string;
  subcategory: string;
  txType?: 'CR' | 'DB' | 'ANY';
  priority: number;
}

export const DEFAULT_RULES: CategorizationRule[] = [
  // ── REVENUE RULES (Credits) ──
  {
    id: 'rule_dab',
    pattern: /DOMPET\s+ANAK\s+BANGSA/i,
    category: 'Online Delivery Settlements',
    subcategory: 'GoPay / Dompet Anak Bangsa',
    txType: 'CR',
    priority: 10,
  },
  {
    id: 'rule_visionet',
    pattern: /VISIONET\s+INTERNASI/i,
    category: 'Online Delivery Settlements',
    subcategory: 'OVO / Visionet',
    txType: 'CR',
    priority: 10,
  },
  {
    id: 'rule_qris',
    pattern: /KR\s+OTOMATIS.*TYFEL|QRIS/i,
    category: 'Dine-In & QRIS Settlements',
    subcategory: 'QRIS Tyfel',
    txType: 'CR',
    priority: 10,
  },
  {
    id: 'rule_cc_edc',
    pattern: /KARTU\s+KREDIT.*TYFEL/i,
    category: 'Dine-In & QRIS Settlements',
    subcategory: 'EDC Kartu Kredit',
    txType: 'CR',
    priority: 10,
  },
  {
    id: 'rule_majoo',
    pattern: /MAJOO\s+TEKNOLOGI/i,
    category: 'Dine-In & QRIS Settlements',
    subcategory: 'Majoo POS',
    txType: 'CR',
    priority: 10,
  },
  {
    id: 'rule_catering',
    pattern: /CATERING|PESANAN|TAMU\s+KKC|BEEF\s+WRAP|BOXES/i,
    category: 'Catering & B2B Orders',
    subcategory: 'Herbox Catering',
    txType: 'CR',
    priority: 9,
  },
  {
    id: 'rule_interest',
    pattern: /BUNGA|INTEREST\s+PAYMENT/i,
    category: 'Other Operating Income',
    subcategory: 'Bank Interest',
    txType: 'CR',
    priority: 8,
  },
  {
    id: 'rule_owner_in',
    pattern: /SALAH\s+TF|DEPOSIT\s+DP/i,
    category: 'Owner Transfers & Drawings',
    subcategory: 'Owner Injections / Capital',
    txType: 'CR',
    priority: 9,
  },

  // ── COGS RULES (Debits) ──
  {
    id: 'rule_sukanda',
    pattern: /SUKANDA\s+DJAYA/i,
    category: 'Raw Materials & Ingredients',
    subcategory: 'Frozen & Proteins (Sukanda, Sumartono)',
    txType: 'DB',
    priority: 10,
  },
  {
    id: 'rule_sumartono',
    pattern: /SUMARTONO\s+SUTARTHO|VEGGIE\s+WAY/i,
    category: 'Raw Materials & Ingredients',
    subcategory: 'Frozen & Proteins (Sukanda, Sumartono)',
    txType: 'DB',
    priority: 10,
  },
  {
    id: 'rule_andreas',
    pattern: /ANDREAS\s+BUDIONO|ALPUKAT|FROZEN\s+FRUIT/i,
    category: 'Raw Materials & Ingredients',
    subcategory: 'Frozen & Proteins (Sukanda, Sumartono)',
    txType: 'DB',
    priority: 9,
  },
  {
    id: 'rule_coffee_beans',
    pattern: /CIPTA\s+USAHA\s+PERSAD|KOPI/i,
    category: 'Coffee & Beverage Supplies',
    subcategory: 'Coffee Beans (Cipta Usaha)',
    txType: 'DB',
    priority: 9,
  },
  {
    id: 'rule_milk',
    pattern: /SUGIANTO|BUDI\s+ARIFIYANTO|CALVIN\s+OCTAVIAN|SAHRUL\s+KIROM|SUSU|UHT/i,
    category: 'Raw Materials & Ingredients',
    subcategory: 'Dairy & Milk (Fresh Milk, UHT)',
    txType: 'DB',
    priority: 9,
  },
  {
    id: 'rule_eggs',
    pattern: /NG\s+NJUK\s+TJIN|TELOR/i,
    category: 'Raw Materials & Ingredients',
    subcategory: 'Eggs (Telor)',
    txType: 'DB',
    priority: 9,
  },
  {
    id: 'rule_vegetables',
    pattern: /DUNIA\s+SEGAR\s+MOD|SAYUR/i,
    category: 'Raw Materials & Ingredients',
    subcategory: 'Fresh Produce & Vegetables (Dunia Segar)',
    txType: 'DB',
    priority: 9,
  },
  {
    id: 'rule_staples_rio',
    pattern: /MINYAK|TEPUNG|SEMBAKO/i,
    category: 'Raw Materials & Ingredients',
    subcategory: 'Cooking Oil & Pantry Staples (Rio)',
    txType: 'DB',
    priority: 9,
  },
  {
    id: 'rule_mayo',
    pattern: /SUMBER\s+BERKAT\s+CAHA|MAYO/i,
    category: 'Raw Materials & Ingredients',
    subcategory: 'Cooking Oil & Pantry Staples (Rio)',
    txType: 'DB',
    priority: 9,
  },
  {
    id: 'rule_sodafresh',
    pattern: /SODAFRESH|MAPLE/i,
    category: 'Coffee & Beverage Supplies',
    subcategory: 'CO2 Sodafresh',
    txType: 'DB',
    priority: 9,
  },
  {
    id: 'rule_bakery',
    pattern: /WILL\s+DAN\s+EM|KUE\s+TART/i,
    category: 'Raw Materials & Ingredients',
    subcategory: 'Bakery & Pastry (Will & Em)',
    txType: 'DB',
    priority: 9,
  },
  {
    id: 'rule_packaging',
    pattern: /MARCO\s+EDYSON|THINWALL|INOVASI\s+KEMASAN|PLASTIK\s+TYFEL|PACKAGING/i,
    category: 'Packaging & Disposables',
    subcategory: 'Boxes & Thinwalls',
    txType: 'DB',
    priority: 9,
  },

  // ── OPEX RULES ──
  {
    id: 'rule_payroll',
    pattern: /SALARY|LUNAS\s+JUL|LUNAS\s+AUG|LUNAS\s+SEPT/i,
    category: 'Salaries & Staff Wages',
    subcategory: 'Store Staff Salaries',
    txType: 'DB',
    priority: 10,
  },
  {
    id: 'rule_grinder_capex',
    pattern: /GRINDER/i,
    category: 'Capital Expenditure (Equipment)',
    subcategory: 'Grinder & Brewing Equipment',
    txType: 'DB',
    priority: 10,
  },
  {
    id: 'rule_gas_util',
    pattern: /RIZKI\s+FIRMANSYAH|GAS\s+3|GAS\s+TYFEL/i,
    category: 'Utilities & Connectivity',
    subcategory: 'LPG Cooking Gas (Rizki)',
    txType: 'DB',
    priority: 9,
  },
  {
    id: 'rule_internet',
    pattern: /BIZNET/i,
    category: 'Utilities & Connectivity',
    subcategory: 'Internet & WiFi (Biznet)',
    txType: 'DB',
    priority: 9,
  },
  {
    id: 'rule_rent',
    pattern: /DAPUR\s+AWAN\s+BERKARY|RENT|TERMIN\s+2/i,
    category: 'Rent & Cloud Kitchen Facilities',
    subcategory: 'Cloud Kitchen Rent',
    txType: 'DB',
    priority: 9,
  },
  {
    id: 'rule_logistics_lalamove',
    pattern: /LALAMOVE/i,
    category: 'Logistics & Inter-Branch Delivery',
    subcategory: 'Lalamove Deliveries',
    txType: 'DB',
    priority: 9,
  },
  {
    id: 'rule_maintenance',
    pattern: /PURWANTO|CAT\s+TYFEL|SEALENT|BAHAN\s+BANGUNAN|RENOVASI|NGATIMAN|DIDIK\s+ADI/i,
    category: 'Repairs & Store Maintenance',
    subcategory: 'Building Repairs & Paint',
    txType: 'DB',
    priority: 9,
  },
  {
    id: 'rule_pest_control',
    pattern: /FOGGING|SAEPUDIN/i,
    category: 'Repairs & Store Maintenance',
    subcategory: 'Sanitation & Pest Control',
    txType: 'DB',
    priority: 9,
  },
  {
    id: 'rule_astro_supplies',
    pattern: /ASTRO/i,
    category: 'Store Supplies & Sundries',
    subcategory: 'Astro Grocery Runs',
    txType: 'DB',
    priority: 8,
  },
  {
    id: 'rule_shopee_supplies',
    pattern: /SHOPEE|TOKOPEDIA/i,
    category: 'Store Supplies & Sundries',
    subcategory: 'Shopee/Tokopedia Supplies',
    txType: 'DB',
    priority: 7,
  },
  {
    id: 'rule_tech',
    pattern: /SHADOWCHEF/i,
    category: 'Software & Technology',
    subcategory: 'Shadowchef ERP',
    txType: 'DB',
    priority: 9,
  },
  {
    id: 'rule_tax_pajak',
    pattern: /PAJAK\s+DKI/i,
    category: 'Taxes & Regulatory',
    subcategory: 'Pajak DKI Restoran',
    txType: 'DB',
    priority: 9,
  },
  {
    id: 'rule_tax_bunga',
    pattern: /PAJAK\s+BUNGA/i,
    category: 'Taxes & Regulatory',
    subcategory: 'Interest Withholding Tax',
    txType: 'DB',
    priority: 9,
  },
  {
    id: 'rule_admin_bank',
    pattern: /BIAYA\s+ADM|ADMIN\s+CHARGE/i,
    category: 'Bank & Transaction Fees',
    subcategory: 'Monthly Bank Admin Fee',
    txType: 'DB',
    priority: 9,
  },
  {
    id: 'rule_bifast_fee',
    pattern: /BIF\s+BIAYA\s+TXN|BIAYA\s+TXN/i,
    category: 'Bank & Transaction Fees',
    subcategory: 'BI-FAST Transfer Fees (Rp 2,500)',
    txType: 'DB',
    priority: 9,
  },
  {
    id: 'rule_marketing_csr',
    pattern: /BAZAAR|YAY\s+|PELITA\s+TAHUNAN/i,
    category: 'Marketing, Events & CSR',
    subcategory: 'Bazaar Sponsorship',
    txType: 'DB',
    priority: 8,
  },
  {
    id: 'rule_cash_advance',
    pattern: /\bCI\b|KASBON/i,
    category: 'Staff Cash Advance (Kasbon)',
    subcategory: 'Cash Advance (Kasbon)',
    txType: 'DB',
    priority: 8,
  },
  {
    id: 'rule_owner_draw',
    pattern: /FELIX\s+SALIM/i,
    category: 'Owner Transfers & Drawings',
    subcategory: 'Owner Drawings',
    txType: 'DB',
    priority: 7,
  },
];

export function categorizeTransaction(
  desc: string,
  txType: 'CR' | 'DB',
  _amount?: number
): { category: string; subcategory: string; type: FinanceCategoryType; confidence: number } {
  const clean = desc.trim();

  // Try matching default rules
  for (const rule of DEFAULT_RULES) {
    if (rule.txType && rule.txType !== 'ANY' && rule.txType !== txType) continue;
    if (rule.pattern.test(clean)) {
      const catDef = FINANCE_CATEGORIES.find((c) => c.name === rule.category);
      return {
        category: rule.category,
        subcategory: rule.subcategory,
        type: catDef ? catDef.type : txType === 'CR' ? 'REVENUE' : 'OPEX',
        confidence: 0.95,
      };
    }
  }

  // Fallback defaults
  if (txType === 'CR') {
    return {
      category: 'Other Operating Income',
      subcategory: 'Miscellaneous Income',
      type: 'REVENUE',
      confidence: 0.5,
    };
  } else {
    return {
      category: 'Store Supplies & Sundries',
      subcategory: 'Cleaning Supplies',
      type: 'OPEX',
      confidence: 0.5,
    };
  }
}
