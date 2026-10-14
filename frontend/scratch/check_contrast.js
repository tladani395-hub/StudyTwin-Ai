// WCAG AA Contrast Ratio Checker for Aanvi Color Palettes
function hexToRgb(hex) {
  const clean = hex.replace('#', '');
  const bigint = parseInt(clean, 16);
  return [(bigint >> 16) & 255, (bigint >> 8) & 255, bigint & 255];
}

function srgbLuminance(rgb) {
  const [r, g, b] = rgb.map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrastRatio(hex1, hex2) {
  const lum1 = srgbLuminance(hexToRgb(hex1));
  const lum2 = srgbLuminance(hexToRgb(hex2));
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  return (brightest + 0.05) / (darkest + 0.05);
}

const combinations = [
  // Scholar Dark
  { name: 'Scholar Dark - Text on App BG', fg: '#E8EEEA', bg: '#121614', type: 'body' },
  { name: 'Scholar Dark - Text on Surface', fg: '#E8EEEA', bg: '#1B211E', type: 'body' },
  { name: 'Scholar Dark Palette A - Emerald on Surface', fg: '#0E9F6E', bg: '#1B211E', type: 'ui' },
  { name: 'Scholar Dark Palette B - Amber on Surface', fg: '#F59E0B', bg: '#1B211E', type: 'ui' },
  { name: 'Scholar Dark - Primary Contrast Dark text on Emerald Button', fg: '#0E1210', bg: '#0E9F6E', type: 'body' },

  // Scholar Light
  { name: 'Scholar Light - Text on App BG', fg: '#14201B', bg: '#F7F7F2', type: 'body' },
  { name: 'Scholar Light - Text on Surface', fg: '#14201B', bg: '#FFFFFF', type: 'body' },
  { name: 'Scholar Light Palette A - Emerald on Surface', fg: '#0E9F6E', bg: '#FFFFFF', type: 'ui' },
  { name: 'Scholar Light Palette B - Amber on Surface', fg: '#D97706', bg: '#FFFFFF', type: 'ui' },
  { name: 'Scholar Light - Primary Contrast Dark text on Emerald Button', fg: '#0E1210', bg: '#0E9F6E', type: 'body' },

  // Explorer Dark
  { name: 'Explorer Dark - Text on App BG', fg: '#FFF3E0', bg: '#1E1530', type: 'body' },
  { name: 'Explorer Dark - Text on Surface', fg: '#FFF3E0', bg: '#2B2042', type: 'body' },
  { name: 'Explorer Dark Palette A - Coral on Surface', fg: '#FF6B57', bg: '#2B2042', type: 'ui' },
  { name: 'Explorer Dark Palette B - Grape on Surface', fg: '#A78BFA', bg: '#2B2042', type: 'ui' },
  { name: 'Explorer Dark - Dark Plum Text on Coral Button', fg: '#1E1530', bg: '#FF6B57', type: 'body' },

  // Explorer Light
  { name: 'Explorer Light - Text on App BG', fg: '#2A1F3D', bg: '#FFF8EC', type: 'body' },
  { name: 'Explorer Light - Text on Surface', fg: '#2A1F3D', bg: '#FFFFFF', type: 'body' },
  { name: 'Explorer Light Palette A - Coral on Surface', fg: '#E8503A', bg: '#FFFFFF', type: 'ui' },
  { name: 'Explorer Light Palette B - Grape on Surface', fg: '#7B4BFF', bg: '#FFFFFF', type: 'ui' },
  { name: 'Explorer Light - White Text on Grape Button', fg: '#FFFFFF', bg: '#7B4BFF', type: 'body' },
];

console.log('=== WCAG AA Contrast Verification ===\n');
let allPassed = true;

combinations.forEach((c) => {
  const ratio = contrastRatio(c.fg, c.bg);
  const minRequired = c.type === 'body' ? 4.5 : 3.0;
  const passed = ratio >= minRequired;
  if (!passed) allPassed = false;

  console.log(
    `${passed ? '✅ PASS' : '❌ FAIL'} [${ratio.toFixed(2)}:1 vs ${minRequired}:1] ${c.name} (${c.fg} on ${c.bg})`
  );
});

console.log(`\nOverall Result: ${allPassed ? 'ALL COMBINATIONS PASS WCAG AA' : 'SOME COMBINATIONS FAILED'}`);
