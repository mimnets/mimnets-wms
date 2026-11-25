// What a design suggestion sends to the model and the shape of its answer
// (m1-088, D-CONTENT-33, ADR-0005 Decisions 4 and 7). Pure: built from code
// only (the theme shape, the presets, the pattern catalogue), never from
// database content. scripts/design-suggestion.test.mjs checks the schemas
// against the presets and the pattern keys.
//
// The model writes no HTML, CSS or rich text: a theme is tokens of a fixed
// type, a layout is a list of pattern keys. The server validates both again
// before anything is created.
import {
  fonts, themeFields, themes
} from '../../../lib/themes.js';
import { contrastPairs } from '../../../lib/theme-contrast.js';
import { patternDefs } from '../../wms-patterns/lib/patterns.js';
import { tokenHelp, tokenLabels } from '../../wms-theme/lib/fields.js';

const hex = {
  type: 'string',
  pattern: '^#[0-9a-fA-F]{6}$'
};

// One JSON Schema per token type in `themeFields`.
function tokenSchema(field) {
  switch (field.type) {
    case 'color':
      return hex;
    case 'colorOrNull':
      return { anyOf: [ hex, { type: 'null' } ] };
    case 'footerBand':
      return {
        anyOf: [ { type: 'null' }, {
          type: 'object',
          additionalProperties: false,
          required: [ 'background', 'text', 'focus' ],
          properties: {
            background: hex,
            text: hex,
            focus: hex
          }
        } ]
      };
    case 'buttonRadius':
      return {
        anyOf: [ { const: 'pill' }, {
          type: 'number',
          minimum: 0,
          maximum: 24
        } ]
      };
    case 'enum':
      return { enum: field.values };
    case 'number':
      return {
        type: 'number',
        minimum: field.min,
        maximum: field.max
      };
    default:
      throw new Error(`No answer schema for theme field type ${field.type}`);
  }
}

export const NAME_MAX = 40;
export const NOTES_MAX = 600;

export function themeAnswerSchema() {
  return {
    type: 'object',
    additionalProperties: false,
    required: [ 'name', 'closestPreset', 'tokens', 'notes' ],
    properties: {
      name: {
        type: 'string',
        minLength: 3,
        maxLength: NAME_MAX
      },
      closestPreset: { enum: themes.map(theme => theme.name) },
      tokens: {
        type: 'object',
        additionalProperties: false,
        required: Object.keys(themeFields),
        properties: Object.fromEntries(Object.entries(themeFields)
          .map(([ key, field ]) => [ key, tokenSchema(field) ]))
      },
      notes: {
        type: 'string',
        maxLength: NOTES_MAX
      }
    }
  };
}

export const SECTIONS_MAX = 8;

// The catalogue a layout is chosen from: every section pattern by key.
export function patternCatalogue() {
  return patternDefs(() => 'x').map(({ key, summary }) => ({
    key,
    summary
  }));
}

export function layoutAnswerSchema() {
  return {
    type: 'object',
    additionalProperties: false,
    required: [ 'title', 'sections', 'notes' ],
    properties: {
      title: {
        type: 'string',
        minLength: 3,
        maxLength: 80
      },
      sections: {
        type: 'array',
        minItems: 1,
        maxItems: SECTIONS_MAX,
        items: {
          type: 'object',
          additionalProperties: false,
          required: [ 'pattern', 'why' ],
          properties: {
            pattern: { enum: patternCatalogue().map(pattern => pattern.key) },
            why: {
              type: 'string',
              maxLength: 200
            }
          }
        }
      },
      notes: {
        type: 'string',
        maxLength: NOTES_MAX
      }
    }
  };
}

const describe = (key) => {
  const label = tokenLabels[key] || key;
  return tokenHelp[key] ? `${label}. ${tokenHelp[key]}` : label;
};

export function themeSystemPrompt() {
  const example = themes[0].tokens;
  return [
    'You design visual themes for the corporate website of a group of companies. A theme is a ' +
      'fixed set of design tokens; the website renders it with its own templates. You choose ' +
      'values only: you never write HTML, CSS or page text.',
    'The user message is a short brief from the site administrator. Answer only through the ' +
      'final answer tool, with every field.',
    '',
    'Tokens (name: meaning):',
    ...Object.keys(themeFields).map(key => `- ${key}: ${describe(key)}`),
    '- primaryText: null means the primary colour is used as text on the surface; a dark ' +
      'primary on a light surface needs null or a darker colour, a dark theme a light one.',
    '- footerBand: null for a plain footer, or { background, text, focus } for a coloured band.',
    '- buttonRadius: "pill" or a number of pixels.',
    `- fontBody, fontHeading: only ${Object.keys(fonts).join(', ')} (fontHeading may also be "body").`,
    '',
    'Accessibility is required (WCAG 2.2 AA). Every one of these colour pairs must reach the ' +
      'contrast ratio given, or the theme is refused (primaryText means primary when it is null; ' +
      'bandText, bandBackground and bandFocus are the footer band, or onPrimary on primary when ' +
      'it is null):',
    ...contrastPairs.map(([ fg, bg, min, use ]) => `- ${fg} on ${bg}: at least ${min}:1 (${use})`),
    '',
    `Presets you may start from (closestPreset is the one most like your theme): ${themes
      .map(theme => `${theme.name} (${theme.label})`).join('; ')}.`,
    `Example of valid tokens (the ${themes[0].label} preset): ${JSON.stringify(example)}`,
    '',
    `name: two or three words for the theme, no company or person names (at most ${NAME_MAX} ` +
      'characters).',
    'notes: up to three short plain sentences for the administrator on your main choices.'
  ].join('\n');
}

export function layoutSystemPrompt() {
  return [
    'You plan the sections of a new page for the corporate website of a group of companies. ' +
      'The page is built only from ready-made section patterns; you choose which and in what ' +
      'order. You never write HTML, CSS or page text: every section keeps placeholders that an ' +
      'editor replaces with confirmed facts.',
    'The user message is a short brief from the site administrator. Answer only through the ' +
      'final answer tool, with every field.',
    '',
    'Section patterns (key: what it is):',
    ...patternCatalogue().map(({ key, summary }) => `- ${key}: ${summary}`),
    '',
    `sections: two to six patterns in page order (at most ${SECTIONS_MAX}); a pattern may appear ` +
      'more than once. End with inquiry-band when the page should lead to contact. The page ' +
      'title is printed above the first section.',
    'why: one short plain sentence per section.',
    'title: a plain working title for the page, no company or person names.',
    'notes: up to three short plain sentences for the administrator.'
  ].join('\n');
}

// The second call when the first theme fails contrast (Q9): the brief, the
// first answer and the failing pairs, by token name.
export function repairMessage(brief, answer, failures) {
  return [
    brief,
    '',
    'Your previous theme was refused because these colour pairs are below the required contrast:',
    ...failures.map(({
      fg, bg, ratio, min
    }) =>
      `- ${fg} on ${bg}: ${ratio.toFixed(2)}:1, needs ${min}:1`),
    '',
    `Previous answer: ${JSON.stringify(answer)}`,
    'Return a corrected theme for the same brief. Change only what is needed to pass every pair.'
  ].join('\n');
}
