/**
 * Automated WCAG AA Contrast Verification Script
 * Checks contrast ratios for design token combinations.
 */

interface ColorPair {
  name: string;
  fg: string;
  bg: string;
  requiredRatio: number;
}

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  return [r, g, b];
}

function getLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map((val) => {
    const s = val / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * (rs ?? 0) + 0.7152 * (gs ?? 0) + 0.0722 * (bs ?? 0);
}

function getContrastRatio(hex1: string, hex2: string): number {
  const rgb1 = hexToRgb(hex1);
  const rgb2 = hexToRgb(hex2);
  const lum1 = getLuminance(rgb1[0], rgb1[1], rgb1[2]);
  const lum2 = getLuminance(rgb2[0], rgb2[1], rgb2[2]);
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  return (brightest + 0.05) / (darkest + 0.05);
}

const TOKEN_PAIRS: ColorPair[] = [
  { name: 'Brand Accent on White', fg: '#ca2484', bg: '#ffffff', requiredRatio: 4.5 },
  { name: 'Brand Deep on White', fg: '#aa1769', bg: '#ffffff', requiredRatio: 4.5 },
  { name: 'White on Brand 600 Button', fg: '#ffffff', bg: '#ca2484', requiredRatio: 4.5 },
  { name: 'White on Brand 700 Hover', fg: '#ffffff', bg: '#aa1769', requiredRatio: 4.5 },
  { name: 'Slate 900 on White', fg: '#0f172a', bg: '#ffffff', requiredRatio: 4.5 },
  { name: 'Slate 700 on White', fg: '#334155', bg: '#ffffff', requiredRatio: 4.5 },
  { name: 'Slate 600 on White', fg: '#475569', bg: '#ffffff', requiredRatio: 4.5 },
  { name: 'White on Slate 900 Header', fg: '#ffffff', bg: '#0f172a', requiredRatio: 4.5 },
  { name: 'Success Green on White', fg: '#15803d', bg: '#ffffff', requiredRatio: 4.5 },
  { name: 'Danger Red on White', fg: '#b91c1c', bg: '#ffffff', requiredRatio: 4.5 },
  { name: 'Warning Brown on White', fg: '#b45309', bg: '#ffffff', requiredRatio: 4.5 },
];

export function runContrastCheck(): boolean {
  console.log('--- Checking WCAG AA Contrast Ratios ---');
  let allPassed = true;

  for (const pair of TOKEN_PAIRS) {
    const ratio = getContrastRatio(pair.fg, pair.bg);
    const passed = ratio >= pair.requiredRatio;
    const formattedRatio = ratio.toFixed(2);
    if (passed) {
      console.log(`✓ PASS: ${pair.name} - Ratio ${formattedRatio}:1 (Required: ${pair.requiredRatio}:1)`);
    } else {
      console.error(`✗ FAIL: ${pair.name} - Ratio ${formattedRatio}:1 (Required: ${pair.requiredRatio}:1)`);
      allPassed = false;
    }
  }

  return allPassed;
}

if (typeof process !== 'undefined' && process.argv && process.argv[1] && import.meta.url === `file://${process.argv[1]}`) {
  const success = runContrastCheck();
  process.exit(success ? 0 : 1);
}
