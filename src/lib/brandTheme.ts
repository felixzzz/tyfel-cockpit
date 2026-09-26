export interface BrandTheme {
  name: string;
  shortName: string;
  slug: string;
  primaryColor: string;
  secondaryColor: string;
  glowColor: string;
  conceptTag: string;
  subtitle: string;
  textColor: string;
  borderColor: string;
  bgTint: string;
  badgeBg: string;
  gradientFrom: string;
}

export const ALL_BRAND_NAV = [
  { slug: 'american-breakfast-club', name: 'American Breakfast Club', shortName: 'ABC' },
  { slug: 'herbox', name: 'Herbox', shortName: 'Herbox' },
  { slug: 'people-pasta', name: 'People Pasta', shortName: 'People Pasta' },
  { slug: 'tyfel-coffee', name: 'Tyfel Coffee', shortName: 'Tyfel' },
  { slug: 'la-breakfast-club', name: 'LA Breakfast Club', shortName: 'LABC' },
];

export function brandToSlug(brand: string): string {
  const match = ALL_BRAND_NAV.find((b) => b.name.toLowerCase() === brand.toLowerCase());
  if (match) return match.slug;
  return brand
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export const BRAND_THEMES: Record<string, BrandTheme> = {
  'american-breakfast-club': {
    name: 'American Breakfast Club',
    shortName: 'ABC',
    slug: 'american-breakfast-club',
    primaryColor: '#d97706',
    secondaryColor: '#b45309',
    glowColor: 'rgba(217, 119, 6, 0.18)',
    conceptTag: 'All-Day Brunch & Griddle',
    subtitle: 'Classic American Brunch & Griddles',
    textColor: 'text-amber-600 dark:text-amber-400',
    borderColor: 'border-amber-500/30',
    bgTint: 'bg-amber-500/10',
    badgeBg: 'badge-amber',
    gradientFrom: 'from-amber-500/15',
  },
  'la-breakfast-club': {
    name: 'LA Breakfast Club',
    shortName: 'LABC',
    slug: 'la-breakfast-club',
    primaryColor: '#c85a32',
    secondaryColor: '#ea580c',
    glowColor: 'rgba(200, 90, 50, 0.18)',
    conceptTag: 'West Coast Burritos',
    subtitle: 'West Coast Breakfast Burritos & Skillets',
    textColor: 'text-orange-600 dark:text-orange-400',
    borderColor: 'border-orange-500/30',
    bgTint: 'bg-orange-500/10',
    badgeBg: 'badge-amber',
    gradientFrom: 'from-orange-500/15',
  },
  'tyfel-coffee': {
    name: 'Tyfel Coffee',
    shortName: 'Tyfel',
    slug: 'tyfel-coffee',
    primaryColor: '#4b7453',
    secondaryColor: '#2d6147',
    glowColor: 'rgba(75, 116, 83, 0.18)',
    conceptTag: 'Specialty Coffee & Roastery',
    subtitle: 'Specialty Espresso & Roasted Blends',
    textColor: 'text-emerald-700 dark:text-emerald-300',
    borderColor: 'border-emerald-600/30',
    bgTint: 'bg-emerald-600/10',
    badgeBg: 'badge-emerald',
    gradientFrom: 'from-emerald-600/15',
  },
  'people-pasta': {
    name: 'People Pasta',
    shortName: 'People Pasta',
    slug: 'people-pasta',
    primaryColor: '#65a30d',
    secondaryColor: '#4d7c0f',
    glowColor: 'rgba(101, 163, 13, 0.18)',
    conceptTag: 'Hand-Crafted Pasta',
    subtitle: 'Hand-Rolled Pasta & Trattoria Sugo',
    textColor: 'text-lime-700 dark:text-lime-400',
    borderColor: 'border-lime-500/30',
    bgTint: 'bg-lime-500/10',
    badgeBg: 'badge-emerald',
    gradientFrom: 'from-lime-500/15',
  },
  'herbox': {
    name: 'Herbox',
    shortName: 'Herbox',
    slug: 'herbox',
    primaryColor: '#10b981',
    secondaryColor: '#059669',
    glowColor: 'rgba(16, 185, 129, 0.18)',
    conceptTag: 'Plant Superfood Bowls',
    subtitle: 'Superfood Salads & Cold-Pressed Tonics',
    textColor: 'text-emerald-600 dark:text-emerald-400',
    borderColor: 'border-emerald-500/30',
    bgTint: 'bg-emerald-500/10',
    badgeBg: 'badge-emerald',
    gradientFrom: 'from-emerald-500/15',
  },
};

const DEFAULT_THEME: BrandTheme = {
  name: 'Multi-Brand',
  shortName: 'All Brands',
  slug: 'all',
  primaryColor: '#1b6b4a',
  secondaryColor: '#c85a32',
  glowColor: 'rgba(27, 107, 74, 0.18)',
  conceptTag: 'Portfolio Overview',
  subtitle: 'Multi-Brand F&B Cockpit',
  textColor: 'text-emerald-600 dark:text-emerald-400',
  borderColor: 'border-[var(--border-default)]',
  bgTint: 'bg-[var(--bg-surface-2)]',
  badgeBg: 'badge-neutral',
  gradientFrom: 'from-emerald-500/15',
};

export function getBrandTheme(brandOrSlug: string): BrandTheme {
  const norm = (brandOrSlug || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-');

  if (norm.includes('american') || norm === 'abc') return BRAND_THEMES['american-breakfast-club'];
  if (norm.includes('la-breakfast') || norm === 'labc') return BRAND_THEMES['la-breakfast-club'];
  if (norm.includes('tyfel') || norm.includes('coffee')) return BRAND_THEMES['tyfel-coffee'];
  if (norm.includes('pasta')) return BRAND_THEMES['people-pasta'];
  if (norm.includes('herbox')) return BRAND_THEMES['herbox'];

  return BRAND_THEMES[norm] || DEFAULT_THEME;
}

export function getChannelColor(provider: string): string {
  const p = (provider || '').toLowerCase().trim();
  if (p.includes('grab')) return '#00b14f'; // Official GrabFood Green
  if (p.includes('go')) return '#ee2737';   // Official GoFood / Gojek Red
  if (p.includes('pos') || p.includes('greenville') || p.includes('majoo') || p.includes('dine')) return '#7c3aed'; // POS Iris
  if (p.includes('shopee')) return '#ee4d2d'; // Shopee Orange
  return '#0284c7'; // Ocean Slate fallback
}
