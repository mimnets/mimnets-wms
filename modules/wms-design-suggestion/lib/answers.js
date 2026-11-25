// Checks on the model's answer before anything is created (m1-088,
// D-CONTENT-33, ADR-0005 Decision 7). The engine has already checked the
// answer against the JSON Schema; these are the project's own rules, the same
// as for a theme or page an admin makes. Pure: scripts/design-suggestion.test.mjs.
import { validateTheme } from '../../../lib/themes.js';
import { contrastPairs, contrastResults } from '../../../lib/theme-contrast.js';
import { patternCatalogue } from './prompts.js';

const lower = value => (typeof value === 'string' && value.startsWith('#') ? value.toLowerCase() : value);

// The answer's tokens with colours in the stored form (`#rrggbb`).
export function tokensFromAnswer(tokens) {
  return Object.fromEntries(Object.entries(tokens).map(([ key, value ]) => [
    key,
    value && typeof value === 'object'
      ? Object.fromEntries(Object.entries(value).map(([ k, v ]) => [ k, lower(v) ]))
      : lower(value)
  ]));
}

// Shape problems, as `validateTheme()` reports them for a custom theme.
export function themeShapeProblems(tokens) {
  return validateTheme({
    name: 'suggestion',
    label: 'Suggestion',
    className: '',
    tokens
  });
}

// The failing contrast pairs, by token name, for the repair call (Q9).
export function contrastFailures(tokens) {
  return contrastResults(tokens)
    .map((result, i) => ({
      fg: contrastPairs[i][0],
      bg: contrastPairs[i][1],
      ...result
    }))
    .filter(result => !result.ok);
}

// Pattern keys that are not in the catalogue (the schema's enum already
// refuses them; checked again because a page is built from them).
export function unknownPatterns(sections) {
  const known = new Set(patternCatalogue().map(pattern => pattern.key));
  return sections.map(section => section.pattern).filter(key => !known.has(key));
}

// Plain text for a read-only string field: no markup, one line per line,
// limited length.
export function plain(value, max) {
  return String(value ?? '').replace(/[<>]/g, '').replace(/\s+\n/g, '\n').trim().slice(0, max);
}
