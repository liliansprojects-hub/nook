// Pastel accents. Picking one tints the whole app: the brand tone, a soft tint
// used by chips and card edges, and an ink tone for headings.
export const ACCENTS = [
  { id: 'coral', name: 'Coral', brand: '8 78% 74%', soft: '8 80% 96%', ink: '8 42% 36%' },
  { id: 'apricot', name: 'Apricot', brand: '26 82% 76%', soft: '28 85% 96%', ink: '24 45% 36%' },
  { id: 'honey', name: 'Honey', brand: '44 82% 76%', soft: '44 88% 96%', ink: '40 45% 34%' },
  { id: 'pistachio', name: 'Pistachio', brand: '86 40% 72%', soft: '86 50% 95%', ink: '86 28% 31%' },
  { id: 'sage', name: 'Sage', brand: '140 32% 72%', soft: '140 38% 95%', ink: '140 26% 31%' },
  { id: 'mint', name: 'Mint', brand: '168 42% 73%', soft: '168 48% 95%', ink: '168 30% 30%' },
  { id: 'seafoam', name: 'Seafoam', brand: '186 45% 74%', soft: '186 50% 95%', ink: '186 32% 30%' },
  { id: 'sky', name: 'Sky', brand: '205 68% 78%', soft: '205 72% 96%', ink: '205 40% 36%' },
  { id: 'periwinkle', name: 'Periwinkle', brand: '228 58% 79%', soft: '228 62% 96%', ink: '228 34% 38%' },
  { id: 'lilac', name: 'Lilac', brand: '264 52% 80%', soft: '264 58% 96%', ink: '264 30% 38%' },
  { id: 'mauve', name: 'Mauve', brand: '292 42% 79%', soft: '292 48% 96%', ink: '292 26% 36%' },
  { id: 'rose', name: 'Rose', brand: '336 62% 80%', soft: '336 68% 96%', ink: '336 36% 38%' },
  { id: 'clay', name: 'Clay', brand: '16 42% 70%', soft: '18 42% 96%', ink: '16 30% 34%' },
  { id: 'black', name: 'Black', brand: '0 0% 18%', soft: '0 0% 94%', ink: '0 0% 34%', onBrand: '0 0% 100%' },
  { id: 'stone', name: 'Stone', brand: '220 12% 72%', soft: '220 14% 96%', ink: '220 12% 32%' },
  { id: 'cocoa', name: 'Cocoa', brand: '24 26% 68%', soft: '24 26% 96%', ink: '22 24% 30%' },
];

export const TAG_COLOURS = [
  '#DE7864', '#CE9450', '#C79A3E', '#5F9E7A', '#4E9C80',
  '#5B8FB0', '#6D82C9', '#8E71CE', '#B96AA0', '#8A8A96',
];

const SAVED_KEY = 'nook.accent';
const CUSTOM_KEY = 'nook.accent.custom';
const DEFAULT_SHADE = { h: 8, s: 78, l: 74 };

const hueOf = (brand) => brand.split(' ')[0];
const tint = (brand, s, l) => `${hueOf(brand)} ${s}% ${l}%`;

export function readCustom() {
  try {
    const raw = localStorage.getItem(CUSTOM_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function writeCustom(shade) {
  try {
    localStorage.setItem(CUSTOM_KEY, JSON.stringify(shade));
  } catch {
    /* nothing kept */
  }
}

// A shade mixed on the colour wheel, turned into a full accent.
export function customAccent(shade) {
  const { h, s, l } = shade || readCustom() || DEFAULT_SHADE;
  return {
    id: 'custom',
    name: 'Your own',
    h,
    s,
    l,
    brand: `${h} ${s}% ${l}%`,
    soft: `${h} ${Math.round(s * 0.45)}% ${Math.min(97, l + 22)}%`,
    ink: `${h} ${Math.round(s * 0.55)}% ${Math.max(26, Math.round(l * 0.48))}%`,
  };
}

export function getAccent(id) {
  if (id === 'custom') {
    const stored = readCustom();
    if (stored) return customAccent(stored);
  }
  return ACCENTS.find((a) => a.id === id) || ACCENTS[0];
}

export function applyAccent(id) {
  const accent = getAccent(id);
  const root = document.documentElement;
  const dark = root.classList.contains('dark');
  // a dark accent needs white ink on it; the pastels keep their deep ink
  const onBrand = accent.onBrand || accent.ink;

  root.style.setProperty('--brand', accent.brand);
  root.style.setProperty('--brand-soft', accent.soft);
  root.style.setProperty('--brand-on', onBrand);
  root.style.setProperty('--ring', accent.brand);
  root.style.setProperty('--sidebar-primary', accent.brand);

  // the accent carries the whole app: buttons, chips, headings, card edges.
  // Everything else stays white and neutral.
  root.style.setProperty('--primary', accent.brand);
  root.style.setProperty('--primary-foreground', onBrand);
  root.style.setProperty('--sidebar-primary-foreground', onBrand);
  if (!dark) {
    root.style.setProperty('--brand-ink', accent.ink);
  }

  try {
    localStorage.setItem(SAVED_KEY, accent.id);
  } catch {
    /* nothing to keep */
  }
  return accent;
}

export function rememberAccent() {
  try {
    const saved = localStorage.getItem(SAVED_KEY);
    if (saved) applyAccent(saved);
  } catch {
    /* nothing kept */
  }
}