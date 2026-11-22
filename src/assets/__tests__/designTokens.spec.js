import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, it, expect } from 'vitest';
import { parseColourTokens, contrastRatio } from './helpers/contrast';

// Read from disk: Vitest stubs CSS imports (even `?raw`) to an empty string by default.
const css = readFileSync(resolve(import.meta.dirname, '../main.css'), 'utf8');

// WCAG 2.2 AA minimums.
const TEXT = 4.5; // 1.4.3 Contrast (Minimum): normal-size text
const NON_TEXT = 3; // 1.4.11 Non-text Contrast: focus rings

describe('contrastRatio', () => {
  it('gives the known extremes', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 1);
    expect(contrastRatio('#ffffff', '#ffffff')).toBeCloseTo(1, 5);
  });

  it('matches the well-known 4.54:1 of #767676 on white', () => {
    expect(contrastRatio('#767676', '#ffffff')).toBeCloseTo(4.54, 2);
  });

  it('does not depend on argument order', () => {
    expect(contrastRatio('#767676', '#ffffff')).toBe(contrastRatio('#ffffff', '#767676'));
  });
});

describe('design tokens in main.css', () => {
  const tokens = parseColourTokens(css);

  // [foreground, background, minimum ratio, where the pairing is used]
  // Add a pairing whenever a component puts a token on a new background.
  const pairings = [
    ['ink', 'surface', TEXT, 'body text on cards'],
    ['ink', 'canvas', TEXT, 'body text on the page'],
    ['muted', 'surface', TEXT, 'secondary text on cards'],
    ['muted', 'canvas', TEXT, 'secondary text on the page'],
    ['accent', 'surface', TEXT, 'links on cards'],
    ['accent-strong', 'surface', TEXT, 'hovered links'],
    ['white', 'accent', TEXT, 'skip link and header badge'],
    ['accent', 'surface', NON_TEXT, 'focus ring on cards'],
    ['accent', 'canvas', NON_TEXT, 'focus ring on the page'],
  ];

  it('finds every token the pairings refer to', () => {
    for (const name of new Set(pairings.flatMap(([fg, bg]) => [fg, bg]))) {
      expect(tokens, `--color-${name} is missing from main.css`).toHaveProperty(name);
    }
  });

  it.each(pairings)('%s on %s meets %s:1 (%s)', (fg, bg, minimum) => {
    expect(contrastRatio(tokens[fg], tokens[bg])).toBeGreaterThanOrEqual(minimum);
  });
});
