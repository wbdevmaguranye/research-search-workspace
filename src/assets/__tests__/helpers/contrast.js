/**
 * WCAG 2.2 contrast ratio, implemented exactly as the spec defines it:
 * https://www.w3.org/TR/WCAG22/#dfn-relative-luminance
 * https://www.w3.org/TR/WCAG22/#dfn-contrast-ratio
 */

const TOKEN_PATTERN = /--color-([\w-]+):\s*(#[0-9a-f]{6})\b/gi;

/** Reads every `--color-name: #rrggbb` declaration from a stylesheet into { name: '#rrggbb' }. */
export function parseColourTokens(css) {
  const tokens = {};
  for (const [, name, hex] of css.matchAll(TOKEN_PATTERN)) {
    tokens[name] = hex;
  }
  return tokens;
}

function toLinear(channel) {
  const c = channel / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

export function relativeLuminance(hex) {
  const [r, g, b] = [1, 3, 5].map((i) => toLinear(parseInt(hex.slice(i, i + 2), 16)));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastRatio(hexA, hexB) {
  const [lighter, darker] = [relativeLuminance(hexA), relativeLuminance(hexB)].sort(
    (x, y) => y - x,
  );
  return (lighter + 0.05) / (darker + 0.05);
}
