// WCAG 2.2 contrast ratio of two `#rrggbb` colours (m1-084), with the
// relative luminance formula from the WCAG definition. Used by the theme test
// (scripts/themes.test.mjs) to check every preset in lib/themes.js.

function luminance(hex) {
  const [ r, g, b ] = [ 1, 3, 5 ]
    .map(i => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map(c => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrast(a, b) {
  const [ light, dark ] = [ luminance(a), luminance(b) ].sort((x, y) => y - x);
  return (light + 0.05) / (dark + 0.05);
}
