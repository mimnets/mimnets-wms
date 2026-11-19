// Theme presets as data (m1-084, D-CONTENT-29). The only source of every
// theme value: an admin picks a preset in Global Styles → Theme (the select's
// choices are built from `themes`), core puts its `className` on <body>, and
// `themeCss()` turns each preset into custom properties that the project
// styles read. Classic has no class and renders on :root.
//
// Every preset fills every field in `themeFields`; `validateTheme()` checks
// that, and scripts/themes.test.mjs checks the shape and WCAG contrast of
// every preset. A stored class that is not here (a removed preset) has no
// rules and renders as Classic.
//
// Class names are stored on the global doc (`stylesClasses`): never rename
// one without a migration (Quiet and Bold keep their m1-074 names).

// The approved faces (D-CONTENT-23 F1, D-CONTENT-29 Q4), self-hosted in
// _fonts.scss. A theme names one by key.
export const fonts = {
  roboto: 'Roboto, -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"',
  manrope: 'Manrope, -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif',
  inter: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif',
  spaceGrotesk: '"Space Grotesk", -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif',
  sourceSerif4: '"Source Serif 4", Georgia, "Times New Roman", serif',
  lora: 'Lora, Georgia, "Times New Roman", serif'
};

const color = { type: 'color' };
const oneOf = (...values) => ({
  type: 'enum',
  values
});
const range = (min, max) => ({
  type: 'number',
  min,
  max
});

// The shape of a theme (design note §3.2).
export const themeFields = {
  // Primary is a background (hero, skip link); `primaryText` is the primary
  // colour as text on the surface (menu, brand, key figures). `null` uses
  // `primary`; a dark theme needs a light one.
  primary: color,
  primaryText: { type: 'colorOrNull' },
  onPrimary: color,
  accent: color,
  onAccent: color,
  text: color,
  textMuted: color,
  surface: color,
  surfaceAlt: color,
  border: color,
  borderSubtle: color,
  borderStrong: color,
  link: color,
  linkVisited: color,
  focus: color,
  selection: color,
  danger: color,
  // Dark image overlay: colour and opacity in percent.
  overlay: color,
  overlayOpacity: range(0, 100),
  // `null` is the plain footer; an object paints a full-width band.
  footerBand: { type: 'footerBand' },
  fontBody: oneOf(...Object.keys(fonts)),
  fontHeading: oneOf('body', ...Object.keys(fonts)),
  typeScale: oneOf(1.25, 1.333),
  headingWeight: oneOf('light', 'normal', 'heavy'),
  headingTracking: range(-0.03, 0.03),
  eyebrowTracking: range(0.05, 0.2),
  radius: range(0, 24),
  radiusSmall: range(0, 16),
  buttonRadius: { type: 'buttonRadius' },
  shadow: oneOf('none', 'soft', 'medium', 'strong'),
  shadowTint: color,
  cardStyle: oneOf('bordered', 'subtle', 'raised'),
  keyFigures: oneOf('plain', 'accent'),
  sectionSpace: oneOf('compact', 'normal', 'airy'),
  headerLayout: oneOf('inline', 'centred'),
  headerCta: oneOf('solid', 'outline')
};

const footerBandFields = [ 'background', 'text', 'focus' ];
const hex = /^#[0-9a-f]{6}$/;

// Returns a list of problems; empty when the theme fits the shape.
export function validateTheme(theme) {
  const problems = [];
  if (!/^[a-z][a-zA-Z]*$/.test(theme.name ?? '')) {
    problems.push('name: a camelCase word');
  }
  if (typeof theme.label !== 'string' || !theme.label) {
    problems.push('label: required');
  }
  if (theme.className !== '' && !/^wms-theme-[a-z-]+$/.test(theme.className ?? '')) {
    problems.push('className: empty or wms-theme-…');
  }
  for (const key of Object.keys(theme.tokens ?? {})) {
    if (!themeFields[key]) {
      problems.push(`${key}: not a theme field`);
    }
  }
  for (const [ key, field ] of Object.entries(themeFields)) {
    const value = theme.tokens?.[key];
    const ok = {
      color: () => hex.test(value),
      colorOrNull: () => value === null || hex.test(value),
      enum: () => field.values.includes(value),
      number: () => typeof value === 'number' && value >= field.min && value <= field.max,
      buttonRadius: () => value === 'pill' || (typeof value === 'number' && value >= 0 && value <= 24),
      footerBand: () => value === null || (
        typeof value === 'object' &&
        Object.keys(value).length === footerBandFields.length &&
        footerBandFields.every(name => hex.test(value[name]))
      )
    }[field.type]();
    if (!ok) {
      problems.push(`${key}: invalid value ${JSON.stringify(value)}`);
    }
  }
  return problems;
}

const rgb = value => [ 1, 3, 5 ].map(i => parseInt(value.slice(i, i + 2), 16)).join(' ');

const scales = {
  1.25: [ 1.25, 1.563, 1.953, 2.441 ],
  1.333: [ 1.333, 1.777, 2.369, 3.157 ]
};

// h1, h2 and h3, h4, and bold words inside a heading.
const weights = {
  light: [ 400, 400, 400, 600 ],
  normal: [ 600, 700, 700, 'bolder' ],
  heavy: [ 800, 800, 700, 'bolder' ]
};

const shadows = {
  none: null,
  soft: [ '0 8px 16px', 8 ],
  medium: [ '0 12px 24px', 15 ],
  strong: [ '0 16px 32px', 18 ]
};

const sectionSpace = {
  compact: '48px',
  normal: '64px',
  airy: '64px'
};

// `$bp-desktop` in _tokens.scss.
const desktop = '1024px';

// `initial` leaves a property unset, so the component's own fallback (today's
// Classic look) applies.
const unset = 'initial';

// The header layout and the footer band as custom properties. Used for each
// theme's default and for the Global Styles overrides below, so the mapping
// exists once (m1-085, D-CONTENT-30).
function headerProperties(layout) {
  const centred = layout === 'centred';
  return {
    '--wms-header-direction': centred ? 'column' : unset,
    '--wms-header-justify': centred ? 'center' : unset,
    '--wms-header-padding': centred ? '28px 16px 16px' : unset,
    '--wms-header-rule': centred ? '1px solid var(--wms-color-border-subtle)' : unset
  };
}

// The band's colours come from `--wms-footer-band-*`, which every theme sets
// (its own band, or primary and on-primary), so a band is readable on every
// preset.
function footerProperties(band) {
  return {
    '--wms-footer-bg': band ? 'var(--wms-footer-band-bg)' : unset,
    '--wms-footer-text': band ? 'var(--wms-footer-band-text)' : unset,
    '--wms-footer-focus': band ? 'var(--wms-footer-band-focus)' : unset,
    '--wms-footer-padding': band ? '48px 16px' : unset,
    '--wms-footer-margin': band ? 'var(--wms-space-section)' : unset
  };
}

// Global Styles → Header style and Footer style (m1-085, D-CONTENT-30). The
// theme sets the default; an explicit choice here wins, because themeCss()
// writes these rules after every theme rule (`body.wms-theme-…` has the same
// specificity; Classic is on :root). "Theme default" is the empty value: no
// class, no rule. A stored class that is not here has no rule either.
export const overrides = {
  headerStyle: [
    {
      label: 'Logo beside the menu',
      className: 'wms-header-inline',
      properties: headerProperties('inline')
    },
    {
      label: 'Logo above the menu',
      className: 'wms-header-centred',
      properties: headerProperties('centred')
    }
  ],
  footerStyle: [
    {
      label: 'Plain',
      className: 'wms-footer-plain',
      properties: footerProperties(false)
    },
    {
      label: 'Coloured band',
      className: 'wms-footer-band',
      properties: footerProperties(true)
    }
  ]
};

// The custom properties of one theme. Every theme sets every property
// (`initial` for unused ones), so nothing leaks from Classic on :root.
export function themeProperties({ tokens: t }) {
  const [ h4, h3, h2, h1 ] = scales[t.typeScale];
  const [ h1Weight, headingWeight, h4Weight, strongWeight ] = weights[t.headingWeight];
  const shadow = shadows[t.shadow];
  const band = t.footerBand;
  const outline = t.headerCta === 'outline';
  const raised = t.cardStyle === 'raised';
  const accentFigures = t.keyFigures === 'accent';
  return {
    '--wms-color-primary': t.primary,
    '--wms-color-primary-text': t.primaryText ?? t.primary,
    '--wms-color-on-primary': t.onPrimary,
    '--wms-color-accent': t.accent,
    '--wms-color-on-accent': t.onAccent,
    '--wms-color-text': t.text,
    '--wms-color-text-muted': t.textMuted,
    '--wms-color-surface': t.surface,
    '--wms-color-surface-alt': t.surfaceAlt,
    '--wms-color-border': t.border,
    '--wms-color-border-subtle': t.borderSubtle,
    '--wms-color-border-strong': t.borderStrong,
    '--wms-color-link': t.link,
    '--wms-color-link-visited': t.linkVisited,
    '--wms-color-focus': t.focus,
    '--wms-color-selection': t.selection,
    '--wms-color-danger': t.danger,
    '--wms-overlay-dark': `rgb(${rgb(t.overlay)} / ${t.overlayOpacity}%)`,
    '--wms-overlay-light': `rgb(${rgb(t.surface)} / 70%)`,
    '--wms-shadow-raised': shadow ? `${shadow[0]} rgb(${rgb(t.shadowTint)} / ${shadow[1]}%)` : 'none',
    '--wms-font-body': fonts[t.fontBody],
    '--wms-font-heading': fonts[t.fontHeading === 'body' ? t.fontBody : t.fontHeading],
    '--wms-text-small': '0.875em',
    '--wms-text-h4': `${h4}em`,
    '--wms-text-h3': `${h3}em`,
    '--wms-text-h2': `${h2}em`,
    '--wms-text-h1': `${h1}em`,
    '--wms-heading-weight-h1': h1Weight,
    '--wms-heading-weight': headingWeight,
    '--wms-heading-weight-h4': h4Weight,
    '--wms-heading-strong-weight': strongWeight,
    '--wms-heading-tracking': t.headingTracking ? `${t.headingTracking}em` : unset,
    // The larger scale needs tighter lines (Bold, m1-074).
    '--wms-heading-line-height': t.typeScale === 1.333 ? '1.15' : unset,
    '--wms-eyebrow-tracking': `${t.eyebrowTracking}em`,
    '--wms-radius': `${t.radius}px`,
    '--wms-radius-small': `${t.radiusSmall}px`,
    '--wms-button-radius': t.buttonRadius === 'pill' ? '999px' : `${t.buttonRadius}px`,
    '--wms-space-section': sectionSpace[t.sectionSpace],
    '--wms-card-border': {
      bordered: unset,
      subtle: 'var(--wms-color-border-subtle)',
      raised: 'transparent'
    }[t.cardStyle],
    '--wms-card-shadow': raised ? 'var(--wms-shadow-raised)' : unset,
    '--wms-stats-item-bg': raised ? 'var(--wms-color-surface)' : unset,
    '--wms-stats-item-shadow': raised ? 'var(--wms-shadow-raised)' : unset,
    '--wms-stats-value-color': accentFigures ? 'var(--wms-color-accent)' : unset,
    '--wms-stats-value-size': accentFigures ? '2.5rem' : unset,
    '--wms-stats-value-weight': accentFigures ? '800' : unset,
    ...headerProperties(t.headerLayout),
    '--wms-cta-bg': outline ? 'transparent' : unset,
    '--wms-cta-text': outline ? 'var(--wms-color-primary-text)' : unset,
    '--wms-cta-border': outline ? 'var(--wms-color-primary-text)' : unset,
    '--wms-footer-band-bg': band?.background ?? t.primary,
    '--wms-footer-band-text': band?.text ?? t.onPrimary,
    '--wms-footer-band-focus': band?.focus ?? t.onPrimary,
    ...footerProperties(band)
  };
}

const rule = (selector, properties) => {
  const declarations = Object.entries(properties)
    .map(([ name, value ]) => `  ${name}: ${value};`)
    .join('\n');
  return `${selector} {\n${declarations}\n}\n`;
};

// The stylesheet for every preset (all of them, because the Global Styles
// live preview swaps the body class in the browser), then the header and
// footer overrides, last so they win.
export function themeCss(list) {
  const rules = list.map(theme => {
    const selector = theme.className ? `body.${theme.className}` : ':root';
    let css = rule(selector, themeProperties(theme));
    if (theme.tokens.sectionSpace === 'airy') {
      css += `@media (min-width: ${desktop}) {\n  ${selector} { --wms-space-section: 96px; }\n}\n`;
    }
    return css;
  });
  for (const choice of Object.values(overrides).flat()) {
    rules.push(rule(`body.${choice.className}`, choice.properties));
  }
  return rules.join('');
}

// ---------------------------------------------------------------------------
// The presets (design note §4). Brand presets keep the Assurer navy and
// orange (D-CONTENT-12); palette presets change the colours.
// ---------------------------------------------------------------------------

const brand = {
  primary: '#212d68',
  primaryText: null,
  onPrimary: '#ffffff',
  accent: '#a85a00',
  onAccent: '#ffffff',
  link: '#1e44a4',
  linkVisited: '#434b74',
  focus: '#a85a00',
  selection: '#ff9c38'
};

// Today's look, the m1-021 brand tokens.
const classic = {
  ...brand,
  text: '#333333',
  textMuted: '#5d5d5d',
  surface: '#ffffff',
  surfaceAlt: '#f5f5f5',
  border: '#d5dde5',
  borderSubtle: '#eef1f4',
  borderStrong: '#6b7785',
  danger: '#b02a37',
  overlay: '#212d68',
  overlayOpacity: 60,
  footerBand: null,
  fontBody: 'roboto',
  fontHeading: 'body',
  typeScale: 1.25,
  headingWeight: 'normal',
  headingTracking: 0,
  eyebrowTracking: 0.12,
  radius: 10,
  radiusSmall: 6,
  buttonRadius: 'pill',
  shadow: 'medium',
  shadowTint: '#212d68',
  cardStyle: 'bordered',
  keyFigures: 'plain',
  sectionSpace: 'compact',
  headerLayout: 'inline',
  headerCta: 'solid'
};

export const themes = [
  {
    name: 'classic',
    label: 'Classic',
    className: '',
    tokens: classic
  },
  {
    name: 'quiet',
    label: 'Quiet: calm and editorial',
    className: 'wms-theme-quiet',
    tokens: {
      ...classic,
      text: '#222222',
      textMuted: '#595959',
      surfaceAlt: '#f6f6f4',
      border: '#dcdcd8',
      borderSubtle: '#ececea',
      fontHeading: 'sourceSerif4',
      headingWeight: 'light',
      headingTracking: -0.01,
      eyebrowTracking: 0.14,
      radius: 0,
      radiusSmall: 0,
      buttonRadius: 0,
      shadow: 'soft',
      shadowTint: '#000000',
      cardStyle: 'subtle',
      sectionSpace: 'airy',
      headerLayout: 'centred'
    }
  },
  {
    name: 'bold',
    label: 'Bold: dark sections and heavy headings',
    className: 'wms-theme-bold',
    tokens: {
      ...classic,
      text: '#1d2433',
      textMuted: '#4f5868',
      // m1-074's #eef1f8 gave the card badge (accent) 4.4999:1, under AA.
      surfaceAlt: '#f0f3f9',
      border: '#d3d9e6',
      overlay: '#172152',
      overlayOpacity: 72,
      footerBand: {
        background: '#172152',
        text: '#ffffff',
        focus: '#ffb15c'
      },
      fontBody: 'manrope',
      typeScale: 1.333,
      headingWeight: 'heavy',
      headingTracking: -0.02,
      radius: 16,
      radiusSmall: 10,
      shadow: 'strong',
      shadowTint: '#172152',
      cardStyle: 'raised',
      keyFigures: 'accent',
      sectionSpace: 'normal',
      headerCta: 'outline'
    }
  },
  {
    name: 'corporate',
    label: 'Corporate: compact and businesslike',
    className: 'wms-theme-corporate',
    tokens: {
      ...classic,
      fontBody: 'inter',
      headingTracking: -0.01,
      radius: 4,
      radiusSmall: 2,
      buttonRadius: 4,
      shadow: 'soft'
    }
  },
  {
    name: 'editorial',
    label: 'Editorial: serif type and generous space',
    className: 'wms-theme-editorial',
    tokens: {
      ...classic,
      text: '#1f1f1f',
      textMuted: '#5a5a5a',
      surfaceAlt: '#f7f5f0',
      border: '#dedad0',
      borderSubtle: '#eeebe4',
      fontBody: 'sourceSerif4',
      fontHeading: 'lora',
      headingWeight: 'light',
      eyebrowTracking: 0.18,
      radius: 2,
      radiusSmall: 2,
      buttonRadius: 2,
      shadow: 'none',
      cardStyle: 'subtle',
      sectionSpace: 'airy',
      headerLayout: 'centred'
    }
  },
  {
    name: 'modern',
    label: 'Modern: rounded, raised and bright',
    className: 'wms-theme-modern',
    tokens: {
      ...classic,
      surfaceAlt: '#f1f3fa',
      border: '#d6dbea',
      fontBody: 'inter',
      fontHeading: 'spaceGrotesk',
      typeScale: 1.333,
      headingWeight: 'heavy',
      headingTracking: -0.02,
      radius: 20,
      radiusSmall: 12,
      cardStyle: 'raised',
      keyFigures: 'accent',
      sectionSpace: 'normal',
      headerLayout: 'centred',
      headerCta: 'outline'
    }
  },
  {
    name: 'midnight',
    label: 'Midnight: dark background, light text',
    className: 'wms-theme-midnight',
    tokens: {
      ...classic,
      primary: '#2c3f8f',
      primaryText: '#c3d0ff',
      onPrimary: '#ffffff',
      accent: '#ffb15c',
      onAccent: '#0f1530',
      text: '#e8ecf5',
      textMuted: '#b3bdd6',
      surface: '#0f1530',
      surfaceAlt: '#182044',
      border: '#36406a',
      borderSubtle: '#232c55',
      borderStrong: '#8793b8',
      link: '#9db8ff',
      linkVisited: '#c6b8ff',
      focus: '#ffb15c',
      selection: '#6b4a12',
      danger: '#ff8a8a',
      overlay: '#0f1530',
      overlayOpacity: 70,
      footerBand: {
        background: '#0a0f24',
        text: '#e8ecf5',
        focus: '#ffb15c'
      },
      fontBody: 'inter',
      fontHeading: 'manrope',
      headingWeight: 'heavy',
      headingTracking: -0.01,
      shadow: 'strong',
      shadowTint: '#000000',
      cardStyle: 'raised',
      keyFigures: 'accent',
      sectionSpace: 'normal'
    }
  },
  {
    name: 'forest',
    label: 'Forest: green and amber',
    className: 'wms-theme-forest',
    tokens: {
      ...classic,
      primary: '#1f4d3a',
      accent: '#9a5b00',
      link: '#1d6b4c',
      linkVisited: '#4a5d52',
      focus: '#9a5b00',
      selection: '#f2c46d',
      text: '#26302b',
      textMuted: '#56615b',
      surfaceAlt: '#f3f6f2',
      border: '#d3ddd5',
      borderSubtle: '#eaf0eb',
      borderStrong: '#6b7a70',
      overlay: '#1f4d3a',
      shadowTint: '#1f4d3a',
      fontBody: 'inter',
      fontHeading: 'lora',
      radius: 8,
      radiusSmall: 4,
      sectionSpace: 'normal'
    }
  },
  {
    name: 'ocean',
    label: 'Ocean: teal and coral',
    className: 'wms-theme-ocean',
    tokens: {
      ...classic,
      primary: '#0f4c5c',
      accent: '#b4442c',
      link: '#0b5f74',
      linkVisited: '#4a5a7a',
      focus: '#b4442c',
      selection: '#ffb59e',
      text: '#1f2d33',
      textMuted: '#52626a',
      surfaceAlt: '#eef5f6',
      border: '#cfdfe3',
      borderSubtle: '#e6f0f2',
      borderStrong: '#627880',
      overlay: '#0f4c5c',
      footerBand: {
        background: '#0f4c5c',
        text: '#ffffff',
        focus: '#ffb59e'
      },
      fontBody: 'manrope',
      headingWeight: 'heavy',
      radius: 12,
      radiusSmall: 8,
      shadowTint: '#0f4c5c',
      cardStyle: 'raised',
      keyFigures: 'accent',
      sectionSpace: 'normal',
      headerCta: 'outline'
    }
  },
  {
    name: 'slate',
    label: 'Slate: charcoal and blue',
    className: 'wms-theme-slate',
    tokens: {
      ...classic,
      primary: '#2b2f36',
      accent: '#1d5fbf',
      link: '#1d5fbf',
      linkVisited: '#5a4fa0',
      focus: '#1d5fbf',
      selection: '#b9d3ff',
      text: '#24272c',
      textMuted: '#575d66',
      surfaceAlt: '#f2f3f5',
      border: '#d6d9de',
      borderSubtle: '#eceef1',
      borderStrong: '#6c727c',
      overlay: '#2b2f36',
      fontBody: 'inter',
      fontHeading: 'spaceGrotesk',
      typeScale: 1.333,
      headingWeight: 'heavy',
      headingTracking: -0.01,
      radius: 4,
      radiusSmall: 2,
      buttonRadius: 4,
      shadowTint: '#2b2f36',
      keyFigures: 'accent'
    }
  },
  {
    name: 'terracotta',
    label: 'Terracotta: warm earth and serif type',
    className: 'wms-theme-terracotta',
    tokens: {
      ...classic,
      primary: '#5a2e1f',
      accent: '#8a5a00',
      link: '#8a3b1f',
      linkVisited: '#5c4a6e',
      focus: '#8a5a00',
      selection: '#f5c9a0',
      text: '#2e2420',
      textMuted: '#66574f',
      surfaceAlt: '#f8f3ee',
      border: '#e3d6cb',
      borderSubtle: '#f0e8e0',
      borderStrong: '#7d6b60',
      overlay: '#5a2e1f',
      fontHeading: 'sourceSerif4',
      headingWeight: 'light',
      eyebrowTracking: 0.16,
      radius: 2,
      radiusSmall: 2,
      buttonRadius: 2,
      shadow: 'soft',
      shadowTint: '#5a2e1f',
      cardStyle: 'subtle',
      sectionSpace: 'airy',
      headerLayout: 'centred'
    }
  },
  {
    name: 'plum',
    label: 'Plum: deep purple and rose',
    className: 'wms-theme-plum',
    tokens: {
      ...classic,
      primary: '#3d1f4d',
      accent: '#a0306a',
      link: '#7a2f8f',
      linkVisited: '#4f4a7a',
      focus: '#a0306a',
      selection: '#f0c6e0',
      text: '#2a2230',
      textMuted: '#5f5566',
      surfaceAlt: '#f6f1f7',
      border: '#e0d5e4',
      borderSubtle: '#efe8f1',
      borderStrong: '#76697d',
      overlay: '#3d1f4d',
      footerBand: {
        background: '#3d1f4d',
        text: '#ffffff',
        focus: '#f0c6e0'
      },
      fontBody: 'manrope',
      fontHeading: 'lora',
      radius: 14,
      radiusSmall: 8,
      shadowTint: '#3d1f4d',
      cardStyle: 'raised',
      sectionSpace: 'normal',
      headerCta: 'outline'
    }
  }
];
