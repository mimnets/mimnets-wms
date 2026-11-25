// The WCAG 2.2 AA colour pairs every theme must pass (m1-084; shared since
// m1-087, D-CONTENT-32 Q7). The unit test checks every preset with them
// (scripts/themes.test.mjs); the server checks every custom theme with them
// on save (modules/wms-theme), so presets and custom themes meet the same
// rules. docs/content/design-tokens.md §3 explains the pairs.
import { contrast } from './contrast.js';

// Token values with the fallbacks the stylesheet uses: `primaryText` null
// means the primary colour; a theme without a footer band still has one in
// the "Coloured band" footer style (m1-085), in primary and on-primary.
const resolvers = {
  primaryText: t => t.primaryText ?? t.primary,
  bandBackground: t => t.footerBand?.background ?? t.primary,
  bandText: t => t.footerBand?.text ?? t.onPrimary,
  bandFocus: t => t.footerBand?.focus ?? t.onPrimary
};
const value = (tokens, key) => (resolvers[key] ? resolvers[key](tokens) : tokens[key]);

// [foreground, background, minimum ratio, where it is used]
export const contrastPairs = [
  [ 'text', 'surface', 4.5, 'Body text' ],
  [ 'text', 'surfaceAlt', 4.5, 'Body text on the alternate surface' ],
  [ 'textMuted', 'surface', 4.5, 'Muted text (footer, breadcrumbs)' ],
  [ 'textMuted', 'surfaceAlt', 4.5, 'Muted text on the alternate surface' ],
  [ 'primaryText', 'surface', 4.5, 'Menu links, header button outline' ],
  [ 'primaryText', 'surfaceAlt', 4.5, 'Key figures' ],
  [ 'onPrimary', 'primary', 4.5, 'Hero text, skip link' ],
  // Hero text on a photo: the dark overlay's own colour is the lower bound.
  [ 'onPrimary', 'overlay', 4.5, 'Hero text on the image overlay' ],
  [ 'accent', 'surface', 4.5, 'Card links, outline button' ],
  [ 'accent', 'surfaceAlt', 4.5, 'Card badge, key figures on the alternate surface' ],
  [ 'onAccent', 'accent', 4.5, 'Primary button, submit' ],
  [ 'link', 'surface', 4.5, 'Links' ],
  [ 'link', 'surfaceAlt', 4.5, 'Links on the alternate surface' ],
  [ 'linkVisited', 'surface', 4.5, 'Visited links' ],
  [ 'danger', 'surface', 4.5, 'Form errors' ],
  [ 'text', 'selection', 4.5, 'Selected text' ],
  [ 'focus', 'surface', 3, 'Focus ring' ],
  [ 'borderStrong', 'surface', 3, 'Form fields, Menu button' ],
  [ 'bandText', 'bandBackground', 4.5, 'Footer band text' ],
  [ 'bandFocus', 'bandBackground', 3, 'Footer band focus ring' ]
];

// Every pair with its colours and ratio. Expects valid tokens
// (validateTheme() first).
export function contrastResults(tokens) {
  return contrastPairs.map(([ fg, bg, min, use ]) => {
    const foreground = value(tokens, fg);
    const background = value(tokens, bg);
    const ratio = contrast(foreground, background);
    return {
      use,
      foreground,
      background,
      min,
      ratio,
      ok: ratio >= min
    };
  });
}

// One sentence per failing pair; empty when the theme passes.
export function contrastProblems(tokens) {
  return contrastResults(tokens)
    .filter(result => !result.ok)
    .map(({
      use, foreground, background, ratio, min
      // Rounded down, so a failing 4.497 never reads as "4.50, needs 4.5".
    }) => `${use}: ${foreground} on ${background} is ${(Math.floor(ratio * 100) / 100).toFixed(2)}:1, needs ${min}:1.`);
}
