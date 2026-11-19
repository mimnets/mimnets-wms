// Unit tests for the theme presets in lib/themes.js (m1-084, D-CONTENT-29):
// every preset fits the shape, Classic, Quiet and Bold keep their m1-074
// values and class names, the Theme select lists every preset, and every
// colour pair passes WCAG 2.2 AA (docs/content/design-tokens.md §3).
// Run: npm run test:unit
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { contrast } from '../lib/contrast.js';
import {
  overrides, themeCss, themeProperties, themes, validateTheme
} from '../lib/themes.js';
import styles from '../modules/@apostrophecms/styles/index.js';

const byName = Object.fromEntries(themes.map(theme => [ theme.name, theme ]));

test('every preset fits the shape', () => {
  for (const theme of themes) {
    assert.deepEqual(validateTheme(theme), [], theme.name);
  }
});

test('the shape check refuses bad values', () => {
  const bad = structuredClone(byName.classic);
  bad.tokens.primary = 'navy';
  bad.tokens.radius = 99;
  bad.tokens.extra = 1;
  delete bad.tokens.danger;
  const problems = validateTheme(bad).join('\n');
  for (const field of [ 'primary', 'radius', 'extra', 'danger' ]) {
    assert.match(problems, new RegExp(`^${field}:`, 'm'));
  }
});

test('names and classes are unique; Classic, Quiet and Bold keep theirs', () => {
  assert.equal(new Set(themes.map(theme => theme.name)).size, themes.length);
  assert.equal(new Set(themes.map(theme => theme.className)).size, themes.length);
  assert.equal(byName.classic.className, '');
  assert.equal(byName.quiet.className, 'wms-theme-quiet');
  assert.equal(byName.bold.className, 'wms-theme-bold');
});

test('the Theme select lists every preset in order', () => {
  const choices = styles.styles.add.theme.choices;
  assert.deepEqual(choices, themes.map(theme => ({
    label: theme.label,
    value: theme.className
  })));
});

test('Classic, Quiet and Bold resolve to their m1-074 values', () => {
  const classic = themeProperties(byName.classic);
  assert.equal(classic['--wms-color-primary'], '#212d68');
  assert.equal(classic['--wms-overlay-dark'], 'rgb(33 45 104 / 60%)');
  assert.equal(classic['--wms-shadow-raised'], '0 12px 24px rgb(33 45 104 / 15%)');
  assert.equal(classic['--wms-space-section'], '48px');
  assert.equal(classic['--wms-text-h1'], '2.441em');
  assert.equal(classic['--wms-heading-weight-h1'], 600);
  assert.equal(classic['--wms-footer-bg'], 'initial');

  const quiet = themeProperties(byName.quiet);
  assert.match(quiet['--wms-font-heading'], /^"Source Serif 4"/);
  assert.equal(quiet['--wms-shadow-raised'], '0 8px 16px rgb(0 0 0 / 8%)');
  assert.equal(quiet['--wms-radius'], '0px');
  assert.equal(quiet['--wms-heading-weight'], 400);
  assert.equal(quiet['--wms-header-direction'], 'column');

  const bold = themeProperties(byName.bold);
  assert.match(bold['--wms-font-body'], /^Manrope/);
  assert.equal(bold['--wms-overlay-dark'], 'rgb(23 33 82 / 72%)');
  assert.equal(bold['--wms-shadow-raised'], '0 16px 32px rgb(23 33 82 / 18%)');
  assert.equal(bold['--wms-text-h1'], '3.157em');
  assert.equal(bold['--wms-heading-weight-h1'], 800);
  assert.equal(bold['--wms-footer-bg'], 'var(--wms-footer-band-bg)');
  assert.equal(bold['--wms-footer-band-bg'], '#172152');
  assert.equal(bold['--wms-cta-border'], 'var(--wms-color-primary-text)');
  assert.equal(bold['--wms-color-primary-text'], '#212d68');
  assert.equal(bold['--wms-space-section'], '64px');
});

test('the stylesheet puts Classic on :root, every other preset on its body class', () => {
  const css = themeCss(themes);
  assert.match(css, /^:root \{/);
  for (const theme of themes.slice(1)) {
    assert.ok(css.includes(`body.${theme.className} {`), theme.name);
  }
  // Quiet's extra space from the desktop breakpoint.
  assert.match(css, /@media \(min-width: 1024px\) \{\n {2}body\.wms-theme-quiet \{ --wms-space-section: 96px; \}/);
  // Every preset sets every property, so nothing leaks from Classic.
  const count = Object.keys(themeProperties(byName.classic)).length;
  const presetBlocks = css.split(/\n\}\n/)
    .filter(part => /^(:root|body\.wms-theme-[a-z-]+) \{$/m.test(part));
  assert.equal(presetBlocks.length, themes.length);
  for (const block of presetBlocks) {
    assert.equal(block.split('\n').filter(line => line.startsWith('  --')).length, count);
  }
});

// m1-085 (D-CONTENT-30): an explicit header or footer style wins over the
// theme because its rule comes after every theme rule.
test('header and footer overrides come after every theme and match the select', () => {
  const css = themeCss(themes);
  const lastTheme = Math.max(...themes.slice(1).map(theme => css.indexOf(`body.${theme.className} {`)));
  for (const [ field, choices ] of Object.entries(overrides)) {
    assert.deepEqual(styles.styles.add[field].choices, [
      {
        label: 'Theme default',
        value: ''
      },
      ...choices.map(choice => ({
        label: choice.label,
        value: choice.className
      }))
    ]);
    for (const choice of choices) {
      assert.ok(css.indexOf(`body.${choice.className} {`) > lastTheme, choice.className);
    }
  }
  // An override writes the same properties as a theme with that choice.
  const quiet = themeProperties(byName.quiet);
  const centred = overrides.headerStyle.find(choice => choice.className === 'wms-header-centred');
  for (const [ name, value ] of Object.entries(centred.properties)) {
    assert.equal(value, quiet[name], name);
  }
  const bold = themeProperties(byName.bold);
  const band = overrides.footerStyle.find(choice => choice.className === 'wms-footer-band');
  for (const [ name, value ] of Object.entries(band.properties)) {
    assert.equal(value, bold[name], name);
  }
  // Classic has no band: the band colours fall back to primary and on-primary.
  const classic = themeProperties(byName.classic);
  assert.equal(classic['--wms-footer-band-bg'], byName.classic.tokens.primary);
  assert.equal(classic['--wms-footer-band-text'], byName.classic.tokens.onPrimary);
});

// [foreground, background, minimum ratio, where it is used]
const pairs = ({ primaryText, ...t }) => [
  [ t.text, t.surface, 4.5, 'text' ],
  [ t.text, t.surfaceAlt, 4.5, 'text on alternate surface' ],
  [ t.textMuted, t.surface, 4.5, 'muted text (footer, breadcrumbs)' ],
  [ t.textMuted, t.surfaceAlt, 4.5, 'muted text on alternate surface' ],
  [ primaryText ?? t.primary, t.surface, 4.5, 'menu links, header button outline' ],
  [ primaryText ?? t.primary, t.surfaceAlt, 4.5, 'key figures' ],
  [ t.onPrimary, t.primary, 4.5, 'hero text, skip link' ],
  // Hero text on a photo: the dark overlay's own colour is the lower bound.
  [ t.onPrimary, t.overlay, 4.5, 'hero text on the dark overlay' ],
  [ t.accent, t.surface, 4.5, 'card links, outline button' ],
  [ t.accent, t.surfaceAlt, 4.5, 'card badge, key figures' ],
  [ t.onAccent, t.accent, 4.5, 'primary button, submit' ],
  [ t.link, t.surface, 4.5, 'links' ],
  [ t.link, t.surfaceAlt, 4.5, 'links on alternate surface' ],
  [ t.linkVisited, t.surface, 4.5, 'visited links' ],
  [ t.danger, t.surface, 4.5, 'form errors' ],
  [ t.text, t.selection, 4.5, 'selected text' ],
  [ t.focus, t.surface, 3, 'focus ring' ],
  [ t.borderStrong, t.surface, 3, 'form fields, Menu button' ],
  // The theme's own band, or the fallback of the "Coloured band" footer
  // style (m1-085): every preset can show a band.
  [ t.footerBand?.text ?? t.onPrimary, t.footerBand?.background ?? t.primary, 4.5, 'footer band text' ],
  [ t.footerBand?.focus ?? t.onPrimary, t.footerBand?.background ?? t.primary, 3, 'footer band focus ring' ]
];

test('every colour pair passes WCAG 2.2 AA', () => {
  const failures = [];
  for (const theme of themes) {
    for (const [ fg, bg, min, use ] of pairs(theme.tokens)) {
      const ratio = contrast(fg, bg);
      if (ratio < min) {
        failures.push(`${theme.name}: ${use} ${fg} on ${bg} = ${ratio.toFixed(2)} (needs ${min})`);
      }
    }
  }
  assert.deepEqual(failures, []);
});

test('contrast matches the recorded m1-021 values', () => {
  assert.equal(contrast('#333333', '#ffffff').toFixed(2), '12.63');
  assert.equal(contrast('#ffffff', '#a85a00').toFixed(2), '5.09');
});
