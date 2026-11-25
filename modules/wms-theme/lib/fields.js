// The custom theme form, built from `themeFields` in lib/themes.js (m1-087,
// D-CONTENT-32), so a new token cannot be left out of the form. Pure data and
// functions: scripts/custom-themes.test.mjs checks that every token has a
// field and that a preset survives the trip to a stored theme and back.
//
// A stored theme keeps each token in a field of the same name, except three
// tokens that are two choices in the form:
//   primaryText  → primaryTextSeparate (boolean) + primaryText (colour)
//   footerBand   → footerBandOn (boolean) + footerBandBackground,
//                  footerBandText, footerBandFocus (colours)
//   buttonRadius → buttonShape ('pill' or 'rounded') + buttonRadius (number)
import { themeFields, themes } from '../../../lib/themes.js';

const classic = themes[0].tokens;

const labels = {
  primary: 'Primary',
  primaryText: 'Primary as text',
  onPrimary: 'Text on primary',
  accent: 'Accent',
  onAccent: 'Text on accent',
  text: 'Text',
  textMuted: 'Muted text',
  surface: 'Surface (page background)',
  surfaceAlt: 'Alternate surface',
  border: 'Border',
  borderSubtle: 'Subtle border',
  borderStrong: 'Strong border (form fields)',
  link: 'Link',
  linkVisited: 'Visited link',
  focus: 'Focus ring',
  selection: 'Text selection',
  danger: 'Error',
  overlay: 'Image overlay',
  overlayOpacity: 'Image overlay opacity (%)',
  fontBody: 'Body font',
  fontHeading: 'Heading font',
  typeScale: 'Type scale',
  headingWeight: 'Heading weight',
  headingTracking: 'Heading letter spacing (em)',
  eyebrowTracking: 'Eyebrow letter spacing (em)',
  radius: 'Corner radius (px)',
  radiusSmall: 'Small corner radius (px)',
  buttonRadius: 'Button corner radius (px)',
  shadow: 'Shadow',
  shadowTint: 'Shadow tint',
  cardStyle: 'Card style',
  keyFigures: 'Key figures',
  sectionSpace: 'Space between sections',
  headerLayout: 'Header layout',
  headerCta: 'Header button'
};

const help = {
  primary: 'Backgrounds: hero, skip link, coloured bands.',
  onPrimary: 'Text on the primary colour.',
  accent: 'Buttons, card links, badges.',
  onAccent: 'Text on the accent colour.',
  overlay: 'The dark layer over hero photos, so text stays readable.',
  selection: 'The background of text a visitor selects.'
};

const fontNames = {
  roboto: 'Roboto',
  manrope: 'Manrope',
  inter: 'Inter',
  spaceGrotesk: 'Space Grotesk',
  sourceSerif4: 'Source Serif 4',
  lora: 'Lora',
  body: 'Same as body font'
};
const choiceLabels = {
  typeScale: {
    1.25: '1.25 (calm)',
    1.333: '1.333 (bigger headings)'
  }
};
const choiceLabel = (key, value) => choiceLabels[key]?.[value] ??
  fontNames[value] ??
  String(value).charAt(0).toUpperCase() + String(value).slice(1);

// The token names in words, also given to the design suggestion's model
// (m1-088, modules/wms-design-suggestion/lib/prompts.js).
export { labels as tokenLabels, help as tokenHelp };

const steps = {
  overlayOpacity: 1,
  headingTracking: 0.005,
  eyebrowTracking: 0.01,
  radius: 1,
  radiusSmall: 1
};

// Hex only, no alpha: the shape check accepts `#rrggbb` (D-CONTENT-32).
const colourField = (label, extra = {}) => ({
  type: 'color',
  label,
  required: true,
  options: {
    format: 'hex',
    disableAlpha: true,
    presetColors: [ '#212d68', '#a85a00', '#ffffff', '#333333' ]
  },
  ...extra
});

const started = { started: true };

function tokenField(key, field) {
  const label = labels[key];
  const extra = {
    if: started,
    ...(help[key] ? { help: help[key] } : {})
  };
  switch (field.type) {
    case 'color':
      return {
        [key]: colourField(label, {
          def: classic[key],
          ...extra
        })
      };
    case 'colorOrNull':
      return {
        primaryTextSeparate: {
          type: 'boolean',
          label: 'Separate colour for primary text',
          help: 'Menu links, the brand name and key figures. Off: the primary colour. A dark theme needs a light one.',
          def: false,
          if: started
        },
        [key]: colourField(label, {
          def: classic.primary,
          if: {
            ...started,
            primaryTextSeparate: true
          }
        })
      };
    case 'footerBand':
      return {
        footerBandOn: {
          type: 'boolean',
          label: 'Footer is a coloured band',
          help: 'Off: a plain footer. Global Styles → Footer Style can still choose either.',
          def: false,
          if: started
        },
        ...Object.fromEntries([
          [ 'footerBandBackground', 'Footer band background', classic.primary ],
          [ 'footerBandText', 'Footer band text', classic.onPrimary ],
          [ 'footerBandFocus', 'Footer band focus ring', classic.onPrimary ]
        ].map(([ name, fieldLabel, def ]) => [ name, colourField(fieldLabel, {
          def,
          if: {
            ...started,
            footerBandOn: true
          }
        }) ]))
      };
    case 'buttonRadius':
      return {
        buttonShape: {
          type: 'select',
          label: 'Button shape',
          def: 'pill',
          required: true,
          if: started,
          choices: [
            {
              label: 'Pill (fully rounded)',
              value: 'pill'
            },
            {
              label: 'Rounded corners',
              value: 'rounded'
            }
          ]
        },
        [key]: {
          type: 'range',
          label,
          min: 0,
          max: 24,
          step: 1,
          def: 6,
          if: {
            ...started,
            buttonShape: 'rounded'
          }
        }
      };
    case 'enum':
      return {
        [key]: {
          type: 'select',
          label,
          required: true,
          def: String(classic[key]),
          choices: field.values.map(value => ({
            label: choiceLabel(key, value),
            value: String(value)
          })),
          ...extra
        }
      };
    case 'number':
      return {
        [key]: {
          type: 'range',
          label,
          required: true,
          min: field.min,
          max: field.max,
          step: steps[key],
          def: classic[key],
          ...extra
        }
      };
    default:
      throw new Error(`No form field for theme field type ${field.type}`);
  }
}

// Every token's form field, in `themeFields` order.
export const tokenFields = Object.assign({}, ...Object.entries(themeFields)
  .map(([ key, field ]) => tokenField(key, field)));

// The form's tabs. Every token field is in exactly one.
export const tokenGroups = {
  colours: {
    label: 'Colours',
    fields: [
      'primary', 'onPrimary', 'primaryTextSeparate', 'primaryText', 'accent', 'onAccent',
      'text', 'textMuted', 'surface', 'surfaceAlt', 'border', 'borderSubtle', 'borderStrong',
      'link', 'linkVisited', 'focus', 'selection', 'danger', 'overlay', 'overlayOpacity',
      'footerBandOn', 'footerBandBackground', 'footerBandText', 'footerBandFocus'
    ]
  },
  type: {
    label: 'Type',
    fields: [ 'fontBody', 'fontHeading', 'typeScale', 'headingWeight', 'headingTracking', 'eyebrowTracking' ]
  },
  shape: {
    label: 'Shape',
    fields: [ 'radius', 'radiusSmall', 'buttonShape', 'buttonRadius', 'shadow', 'shadowTint', 'cardStyle' ]
  },
  layout: {
    label: 'Layout',
    fields: [ 'keyFigures', 'sectionSpace', 'headerLayout', 'headerCta' ]
  }
};

// `#ABC` or `#AABBCC` from the colour picker → `#aabbcc`; anything else is
// returned unchanged for the shape check to refuse.
export function normaliseColour(value) {
  if (typeof value !== 'string') {
    return value;
  }
  const v = value.trim().toLowerCase();
  if (/^#[0-9a-f]{3}$/.test(v)) {
    return `#${[ ...v.slice(1) ].map(c => c + c).join('')}`;
  }
  return v;
}

// The colour fields of a stored theme, for normalising before the check.
export const colourFieldNames = Object.entries(tokenFields)
  .filter(([ , field ]) => field.type === 'color')
  .map(([ name ]) => name);

// A preset's tokens → the stored theme's fields.
export function fieldsFromTokens(tokens) {
  const fields = {};
  for (const [ key, field ] of Object.entries(themeFields)) {
    const value = tokens[key];
    if (field.type === 'colorOrNull') {
      fields.primaryTextSeparate = value !== null;
      fields.primaryText = value ?? tokens.primary;
    } else if (field.type === 'footerBand') {
      fields.footerBandOn = value !== null;
      fields.footerBandBackground = value?.background ?? tokens.primary;
      fields.footerBandText = value?.text ?? tokens.onPrimary;
      fields.footerBandFocus = value?.focus ?? tokens.onPrimary;
    } else if (field.type === 'buttonRadius') {
      fields.buttonShape = value === 'pill' ? 'pill' : 'rounded';
      fields.buttonRadius = value === 'pill' ? 6 : value;
    } else if (field.type === 'enum') {
      fields[key] = String(value);
    } else {
      fields[key] = value;
    }
  }
  return fields;
}

// A stored theme's fields → tokens, for validateTheme() and the stylesheet.
export function tokensFromFields(doc) {
  const tokens = {};
  for (const [ key, field ] of Object.entries(themeFields)) {
    if (field.type === 'colorOrNull') {
      tokens[key] = doc.primaryTextSeparate ? doc.primaryText : null;
    } else if (field.type === 'footerBand') {
      tokens[key] = doc.footerBandOn
        ? {
          background: doc.footerBandBackground,
          text: doc.footerBandText,
          focus: doc.footerBandFocus
        }
        : null;
    } else if (field.type === 'buttonRadius') {
      tokens[key] = doc.buttonShape === 'pill' ? 'pill' : doc.buttonRadius;
    } else if (field.type === 'enum') {
      // Select values are strings; the token keeps its own type (1.25).
      tokens[key] = field.values
        .find(value => String(value) === String(doc[key])) ?? doc[key];
    } else {
      tokens[key] = doc[key];
    }
  }
  return tokens;
}
