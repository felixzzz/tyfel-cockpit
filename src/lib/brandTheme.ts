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

export const BRAND_THEMES: Record<string, BrandTheme> = {
  'american-breakfast-club': {
    name: 'American Breakfast Club',
    shortName: 'ABC',
    slug: 'american-breakfast-club',
    primaryColor: '#f97316',
    secondaryColor: '#ea580c',
    glowColor: 'rgba(249, 115, 22, 0.18)',
    conceptTag: 'All-Day Brunch & Griddle',
    subtitle: 'Classic American Brunch & Griddles',
    textColor: 'text-amber-400',
    borderColor: 'border-amber-500/30',
    bgTint: 'bg-amber-500/10',
    badgeBg: 'bg-amber-950/60 text-amber-300 border-amber-700/40',
    gradientFrom: 'from-amber-500/15',
  },
  'la-breakfast-club': {
    name: 'LA Breakfast Club',
    shortName: 'LABC',
    slug: 'la-breakfast-club',
    primaryColor: '#ea580c',
    secondaryColor: '#f97316',
    glowColor: 'rgba(234, 88, 12, 0.18)',
    conceptTag: 'West Coast Burritos',
    subtitle: 'West Coast Breakfast Burritos & Skillets',
    textColor: 'text-orange-400',
    borderColor: 'border-orange-500/30',
    bgTint: 'bg-orange-500/10',
    badgeBg: 'bg-orange-950/60 text-orange-300 border-orange-700/40',
    gradientFrom: 'from-orange-500/15',
  },
  'tyfel-coffee': {
    name: 'Tyfel Coffee',
    shortName: 'Tyfel',
    slug: 'tyfel-coffee',
    primaryColor: '#d97706',
    secondaryColor: '#b45309',
    glowColor: 'rgba(217, 119, 6, 0.18)',
    conceptTag: 'Specialty Coffee & Espresso',
    subtitle: 'Specialty Espresso & Roasted Blends',
    textColor: 'text-amber-300',
    borderColor: 'border-amber-600/30',
    bgTint: 'bg-amber-600/10',
    badgeBg: 'bg-amber-950/60 text-amber-200 border-amber-600/40',
    gradientFrom: 'from-amber-600/15',
  },
  'people-pasta': {
    name: 'People Pasta',
    shortName: 'People Pasta',
    slug: 'people-pasta',
    primaryColor: '#84cc16',
    secondaryColor: '#65a30d',
    glowColor: 'rgba(132, 204, 22, 0.18)',
    conceptTag: 'Hand-Crafted Pasta',
    subtitle: 'Hand-Rolled Pasta & Trattoria Sugo',
    textColor: 'text-lime-400',
    borderColor: 'border-lime-500/30',
    bgTint: 'bg-lime-500/10',
    badgeBg: 'bg-lime-950/60 text-lime-300 border-lime-700/40',
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
    textColor: 'text-emerald-400',
    borderColor: 'border-emerald-500/30',
    bgTint: 'bg-emerald-500/10',
    badgeBg: 'bg-emerald-950/60 text-emerald-300 border-emerald-700/40',
    gradientFrom: 'from-emerald-500/15',
  },
};

const DEFAULT_THEME: BrandTheme = {
  name: 'Multi-Brand',
  shortName: 'All Brands',
  slug: 'all',
  primaryColor: '#10b981',
  secondaryColor: '#3b82f6',
  glowColor: 'rgba(16, 185, 129, 0.18)',
  conceptTag: 'Portfolio Overview',
  subtitle: 'Multi-Brand F&B Cockpit',
  textColor: 'text-emerald-400',
  borderColor: 'border-white/10',
  bgTint: 'bg-white/5',
  badgeBg: 'bg-zinc-800/80 text-zinc-300 border-white/10',
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
  if (p.includes('pos') || p.includes('greenville') || p.includes('majoo') || p.includes('dine')) return '#8b5cf6'; // POS Purple / Iris
  if (p.includes('shopee')) return '#ee4d2d'; // Shopee Orange
  return '#38bdf8'; // Sky Blue fallback
}
