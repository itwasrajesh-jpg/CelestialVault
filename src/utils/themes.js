// ─── THEMES — exact port from App.js ─────────────────────────────────────────
// Default = Material You dynamic (accent injected at runtime from wallpaper)
// AMOLED  = pure black
// Glass   = frosted blur dark
// White   = matte white neumorphic (replaces matte black)

export const THEMES = {
  default: {
    bg: '#1C1B1F', surface: '#2B2930', surface2: '#322F37',
    text: '#E6E1E5', sub: 'rgba(230,225,229,0.45)',
    border: 'rgba(255,255,255,0.07)', accent: '#B985FA',
    grad1: '#6750A4', grad2: '#9C68E8', nav: '#2B2930', card: '#6750A4',
    // Material You flag — accent colours replaced at runtime
    materialYou: true,
  },
  amoled: {
    bg: '#000000', surface: '#0A0A0A', surface2: '#111111',
    text: '#FFFFFF', sub: 'rgba(255,255,255,0.38)',
    border: 'rgba(255,255,255,0.06)', accent: '#D0BCFF',
    grad1: '#4A0080', grad2: '#7B2FBE', nav: '#050505', card: '#3D0075',
    amoled: true,
  },
  glass: {
    bg: '#0A0812', surface: 'rgba(255,255,255,0.06)', surface2: 'rgba(255,255,255,0.03)',
    text: '#E6E1E5', sub: 'rgba(230,225,229,0.45)',
    border: 'rgba(255,255,255,0.12)', accent: '#B985FA',
    grad1: '#6750A4', grad2: '#9C68E8', nav: 'rgba(10,8,18,0.88)', card: 'rgba(103,80,164,0.22)',
    glass: true,
  },
  white: {
    // Matte White — light neumorphic, tiles float on soft white surface
    bg: '#ECEEF3', surface: '#ECEEF3', surface2: '#E4E6ED',
    text: '#1A1D2E', sub: 'rgba(26,29,46,0.45)',
    border: 'rgba(166,172,189,0.3)', accent: '#6B4EFF',
    grad1: '#6750A4', grad2: '#9C68E8', nav: '#ECEEF3', card: '#6750A4',
    white: true,
  },
};

// ─── ACCENT PRESETS — apply over any theme ───────────────────────────────────
export const ACCENT_PRESETS = {
  purple: { label:'Purple', swatch:'#6750A4', accent:'#B985FA', grad1:'#6750A4', grad2:'#9C68E8', card:'#6750A4' },
  blue:   { label:'Blue',   swatch:'#1D6AE5', accent:'#60A5FA', grad1:'#1D4ED8', grad2:'#3B82F6', card:'#1E3A8A' },
  teal:   { label:'Teal',   swatch:'#0D9488', accent:'#2DD4BF', grad1:'#0D9488', grad2:'#14B8A6', card:'#134E4A' },
  rose:   { label:'Rose',   swatch:'#BE185D', accent:'#FB7185', grad1:'#BE185D', grad2:'#F43F5E', card:'#881337' },
  orange: { label:'Orange', swatch:'#C2410C', accent:'#FB923C', grad1:'#C2410C', grad2:'#EA580C', card:'#7C2D12' },
  green:  { label:'Green',  swatch:'#15803D', accent:'#4ADE80', grad1:'#15803D', grad2:'#16A34A', card:'#14532D' },
  gold:   { label:'Gold',   swatch:'#B45309', accent:'#FBBF24', grad1:'#B45309', grad2:'#D97706', card:'#78350F' },
  indigo: { label:'Indigo', swatch:'#4338CA', accent:'#818CF8', grad1:'#4338CA', grad2:'#6366F1', card:'#312E81' },
};

// ─── TILE STYLE — neumorphic depth per theme, exact port from App.js ─────────
export function tileStyle(T, extra = {}) {
  // WHITE MAGIC — light neumorphic
  if (T.white) return {
    backgroundColor: T.surface,
    borderRadius: 18,
    elevation: 4,
    borderTopWidth: 1.5,
    borderLeftWidth: 1.5,
    borderTopColor: 'rgba(255,255,255,0.92)',
    borderLeftColor: 'rgba(255,255,255,0.82)',
    borderBottomWidth: 1.5,
    borderRightWidth: 1.5,
    borderBottomColor: 'rgba(0,0,0,0.12)',
    borderRightColor: 'rgba(0,0,0,0.08)',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 4, height: 5 },
    ...extra,
  };
  // AMOLED — floating tiles in pure darkness
  if (T.amoled) return {
    backgroundColor: T.surface,
    borderRadius: 18,
    elevation: 6,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
    borderLeftColor: 'rgba(255,255,255,0.03)',
    borderBottomWidth: 1,
    borderRightWidth: 1,
    borderBottomColor: 'rgba(0,0,0,1)',
    borderRightColor: 'rgba(0,0,0,0.9)',
    shadowColor: '#000',
    shadowOpacity: 0.95,
    shadowRadius: 10,
    shadowOffset: { width: 4, height: 6 },
    ...extra,
  };
  // GLASS — own border system
  if (T.glass) return {
    backgroundColor: T.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: T.border,
    ...extra,
  };
  // DEFAULT (Material You dark) — subtle material depth
  return {
    backgroundColor: T.surface,
    borderRadius: 18,
    elevation: 3,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.09)',
    borderLeftColor: 'rgba(255,255,255,0.06)',
    borderBottomWidth: 1,
    borderRightWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.35)',
    borderRightColor: 'rgba(0,0,0,0.25)',
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 6,
    shadowOffset: { width: 2, height: 3 },
    ...extra,
  };
}

export function neuSurface(T, extra = {}) {
  if (T.glass) return { backgroundColor: T.surface, borderRadius: 18, ...extra };
  return tileStyle(T, extra);
}

// ─── RESOLVE THEME — merges accent preset into theme ────────────────────────
export function resolveTheme(themeKey, accentKey) {
  const base = { ...THEMES[themeKey] || THEMES.default };
  const accent = ACCENT_PRESETS[accentKey];
  if (accent) {
    base.accent = accent.accent;
    base.grad1  = accent.grad1;
    base.grad2  = accent.grad2;
    base.card   = accent.card;
  }
  return base;
}
