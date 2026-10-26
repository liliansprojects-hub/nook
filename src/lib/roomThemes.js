// Room looks — data used to paint each study room. Each room stores its theme id.
export const ROOM_THEMES = [
  { id: 'sunrise', name: 'Sunrise', from: '#FFE3CF', to: '#FCC4AC', ink: '#8C4A2F' },
  { id: 'sage', name: 'Sage', from: '#E6F0E4', to: '#C6DCC4', ink: '#3F6142' },
  { id: 'lilac', name: 'Lilac', from: '#EFE6F7', to: '#D6C6EE', ink: '#57407E' },
  { id: 'sky', name: 'Sky', from: '#E3EEF8', to: '#C4DCF0', ink: '#3B5D7C' },
  { id: 'blush', name: 'Blush', from: '#FCE6EC', to: '#F5C6D3', ink: '#8C4257' },
  { id: 'oat', name: 'Oat', from: '#F6EEE0', to: '#E8D8BC', ink: '#6E5B3E' },
  { id: 'mint', name: 'Mint', from: '#E2F3F0', to: '#BEE4DE', ink: '#2F6159' },
  { id: 'cocoa', name: 'Cocoa', from: '#EFE4DE', to: '#D9C4B7', ink: '#5C4034' },
  { id: 'dusk', name: 'Dusk', from: '#E8E8F2', to: '#CFCFE4', ink: '#454A6B' },
  { id: 'peach', name: 'Peach', from: '#FFEEE3', to: '#FBD3B6', ink: '#8A5330' },
];

// A room can carry a colour mixed on the wheel: the theme id holds "custom:h,s,l".
export function themeShade(id) {
  const match = /^custom:(\d+),(\d+),(\d+)$/.exec(id || '');
  return match ? { h: Number(match[1]), s: Number(match[2]), l: Number(match[3]) } : null;
}

export function customTheme(shade) {
  const { h, s, l } = shade;
  return {
    id: `custom:${h},${s},${l}`,
    name: 'Your own',
    from: `hsl(${h} ${s}% ${l}%)`,
    to: `hsl(${h} ${s}% ${Math.max(32, l - 14)}%)`,
    ink: `hsl(${h} ${Math.max(24, s - 22)}% ${Math.max(24, l - 42)}%)`,
  };
}

export function getTheme(id) {
  const shade = themeShade(id);
  if (shade) return customTheme(shade);
  return ROOM_THEMES.find((t) => t.id === id) || ROOM_THEMES[0];
}