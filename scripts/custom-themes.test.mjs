// Unit tests for custom themes (m1-087, D-CONTENT-32): the form built from
// `themeFields` covers every token once, every preset survives the trip to a
// stored theme and back, colours from the picker are normalised, and the
// shape check accepts the custom class.
// Run: npm run test:unit
import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  themeFields, themes, validateTheme
} from '../lib/themes.js';
import {
  colourFieldNames, fieldsFromTokens, normaliseColour,
  tokenFields, tokenGroups, tokensFromFields
} from '../modules/wms-theme/lib/fields.js';
import wmsTheme from '../modules/wms-theme/index.js';

test('every theme token has a form field', () => {
  // The footer band is a switch (footerBandOn) and three colours.
  for (const key of Object.keys(themeFields)) {
    assert.ok(tokenFields[key] ?? tokenFields[`${key}On`], key);
  }
});

test('every form field is in exactly one tab, and every tab field exists', () => {
  const grouped = Object.values(tokenGroups).flatMap(group => group.fields);
  assert.equal(new Set(grouped).size, grouped.length, 'a field is in two tabs');
  assert.deepEqual([ ...grouped ].sort(), Object.keys(tokenFields).sort());
});

test('token fields show only after the first save', () => {
  for (const [ name, field ] of Object.entries(tokenFields)) {
    assert.equal(field.if?.started, true, name);
  }
});

test('every preset survives the trip to a stored theme and back', () => {
  for (const theme of themes) {
    const back = tokensFromFields(fieldsFromTokens(theme.tokens));
    assert.deepEqual(back, theme.tokens, theme.name);
  }
});

test('colours are hex without alpha, normalised to #rrggbb', () => {
  assert.equal(normaliseColour('#ABCDEF'), '#abcdef');
  assert.equal(normaliseColour(' #Fa0 '), '#ffaa00');
  assert.equal(normaliseColour('#12345678'), '#12345678');
  for (const name of colourFieldNames) {
    assert.equal(tokenFields[name].options.format, 'hex', name);
    assert.equal(tokenFields[name].options.disableAlpha, true, name);
  }
});

test('the shape check accepts a custom class and refuses others', () => {
  const custom = {
    name: 'custom',
    label: 'Ocean (customised)',
    tokens: structuredClone(themes[0].tokens)
  };
  assert.deepEqual(validateTheme({
    ...custom,
    className: 'wms-theme-custom-ck1a2b3c4d'
  }), []);
  for (const className of [ 'wms-theme-Custom-1', 'theme-custom-1', 'wms-theme-1' ]) {
    assert.match(validateTheme({
      ...custom,
      className
    }).join('\n'), /^className:/m, className);
  }
});

test('admins only, and the class comes from aposDocId', () => {
  assert.equal(wmsTheme.options.viewRole, 'admin');
  assert.equal(wmsTheme.options.editRole, 'admin');
  assert.equal(wmsTheme.options.publishRole, 'admin');
  const methods = wmsTheme.methods({});
  assert.equal(methods.className({ aposDocId: 'ck1A2b:x' }), 'wms-theme-custom-ck1a2bx');
});

test('Start from lists every preset', () => {
  assert.deepEqual(wmsTheme.fields.add.startFrom.choices.map(choice => choice.value),
    themes.map(theme => theme.name));
});
