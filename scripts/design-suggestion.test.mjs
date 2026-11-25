// Unit tests for design suggestions (m1-088, D-CONTENT-33, ADR-0005): the
// brief check, the answer schemas against the theme shape and the pattern
// catalogue, the project's own checks on an answer, and the test mock.
// Run: npm run test:unit
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { themeFields, themes } from '../lib/themes.js';
import { briefProblems } from '../modules/wms-design-suggestion/lib/brief.js';
import {
  layoutAnswerSchema, layoutSystemPrompt, patternCatalogue, repairMessage,
  themeAnswerSchema, themeSystemPrompt
} from '../modules/wms-design-suggestion/lib/prompts.js';
import {
  contrastFailures, themeShapeProblems, tokensFromAnswer, unknownPatterns
} from '../modules/wms-design-suggestion/lib/answers.js';
import { designMock } from '../modules/wms-design-suggestion/lib/mock.js';
import { patternDefs } from '../modules/wms-patterns/lib/patterns.js';

// The JSON Schema keywords the answer schemas use, checked here without a
// package (core's engine checks the real answers with its own Ajv).
function fits(schema, value) {
  if (schema.anyOf) {
    return schema.anyOf.some(sub => fits(sub, value));
  }
  if ('const' in schema) {
    return value === schema.const;
  }
  if (schema.enum) {
    return schema.enum.includes(value);
  }
  const type = value === null ? 'null' : Array.isArray(value) ? 'array' : typeof value;
  if (schema.type && schema.type !== type) {
    return false;
  }
  if (type === 'string') {
    return value.length >= (schema.minLength ?? 0) &&
      value.length <= (schema.maxLength ?? Infinity) &&
      (!schema.pattern || new RegExp(schema.pattern).test(value));
  }
  if (type === 'number') {
    return value >= (schema.minimum ?? -Infinity) &&
      value <= (schema.maximum ?? Infinity);
  }
  if (type === 'array') {
    return value.length >= (schema.minItems ?? 0) &&
      value.length <= (schema.maxItems ?? Infinity) &&
      value.every(item => fits(schema.items, item));
  }
  if (type === 'object') {
    const keys = Object.keys(value);
    return (schema.required || []).every(key => keys.includes(key)) &&
      keys.every(key => (schema.properties?.[key]
        ? fits(schema.properties[key], value[key])
        : schema.additionalProperties !== false));
  }
  return true;
}
const themeValid = answer => fits(themeAnswerSchema(), answer);
const layoutValid = answer => fits(layoutAnswerSchema(), answer);
const ok = 'Calm and trustworthy, for an insurance group; navy with warm accents.';

test('a design brief passes', () => {
  assert.deepEqual(briefProblems(ok), []);
  const figures = 'Since 1998; colours 255 255 255 and #1f3a5c; 3 divisions, 12 offices.';
  assert.deepEqual(briefProblems(figures), []);
});

test('too short or too long is refused', () => {
  assert.equal(briefProblems('navy').length, 1);
  assert.equal(briefProblems('x'.repeat(1001)).length, 1);
  assert.equal(briefProblems(undefined).length, 1);
});

test('e-mail addresses and phone numbers are refused', () => {
  for (const brief of [
    `${ok} Contact jane.doe@example.com`,
    `${ok} Contact jane (at) example.com`,
    `${ok} Call +880 1711 123456`,
    `${ok} Call (020) 7946 0958`,
    `${ok} Call 01711-123456`
  ]) {
    assert.match(briefProblems(brief).join(' '), /contact details/, brief);
  }
});

test('every preset is a valid theme answer', () => {
  for (const theme of themes) {
    const answer = {
      name: 'Test',
      closestPreset: theme.name,
      tokens: theme.tokens,
      notes: ''
    };
    assert.ok(themeValid(answer), theme.name);
  }
});

test('the theme schema lists every token, and refuses extras and bad values', () => {
  const { tokens } = themeAnswerSchema().properties;
  assert.deepEqual(tokens.required, Object.keys(themeFields));
  const base = {
    name: 'Test',
    closestPreset: 'ocean',
    tokens: themes[0].tokens,
    notes: ''
  };
  assert.ok(!themeValid({
    ...base,
    tokens: {
      ...base.tokens,
      css: 'body{}'
    }
  }));
  assert.ok(!themeValid({
    ...base,
    tokens: {
      ...base.tokens,
      primary: 'red'
    }
  }));
  assert.ok(!themeValid({
    ...base,
    closestPreset: 'nope'
  }));
});

test('answer colours are normalised and checked like a custom theme', () => {
  const tokens = tokensFromAnswer({
    ...themes[0].tokens,
    primary: '#212D68'
  });
  assert.equal(tokens.primary, '#212d68');
  assert.deepEqual(themeShapeProblems(tokens), []);
  assert.deepEqual(contrastFailures(tokens), []);
  const low = contrastFailures({
    ...tokens,
    text: '#aaaaaa'
  });
  assert.ok(low.some(f => f.fg === 'text' && f.bg === 'surface'));
  assert.match(repairMessage(ok, {}, low), /text on surface: \d\.\d\d:1, needs 4\.5:1/);
});

test('the layout schema offers exactly the pattern keys', () => {
  const keys = patternDefs(() => 'x').map(def => def.key);
  assert.deepEqual(patternCatalogue().map(p => p.key), keys);
  const schemaSections = layoutAnswerSchema().properties.sections;
  assert.deepEqual(schemaSections.items.properties.pattern.enum, keys);
  const answer = {
    title: 'About us',
    sections: [ {
      pattern: 'story-band',
      why: 'x'
    } ],
    notes: ''
  };
  assert.ok(layoutValid(answer));
  assert.ok(!layoutValid({
    ...answer,
    sections: [ {
      pattern: 'raw-html',
      why: 'x'
    } ]
  }));
  assert.ok(!layoutValid({
    ...answer,
    sections: []
  }));
  const sections = [ { pattern: 'story-band' }, { pattern: 'nope' } ];
  assert.deepEqual(unknownPatterns(sections), [ 'nope' ]);
});

test('the prompts carry no database content and name every contrast pair', () => {
  const theme = themeSystemPrompt();
  assert.match(theme, /text on surface: at least 4\.5:1/);
  assert.match(theme, /never write HTML, CSS/);
  assert.match(layoutSystemPrompt(), /story-band: /);
});

test('the test mock answers both kinds and fails contrast on request', async () => {
  const apos = { error: (name, message) => Object.assign(new Error(message), { name }) };
  const mock = designMock(apos);
  const ask = (schema, brief, system = '') => mock({}, {
    schema,
    system,
    messages: [ {
      role: 'user',
      content: brief
    } ]
  });
  const theme = await ask(themeAnswerSchema(), ok);
  assert.ok(themeValid(theme.object));
  assert.deepEqual(contrastFailures(tokensFromAnswer(theme.object.tokens)), []);
  const low = await ask(themeAnswerSchema(), `${ok} mock:low-contrast`);
  assert.ok(contrastFailures(tokensFromAnswer(low.object.tokens)).length > 0);
  const layout = await ask(layoutAnswerSchema(), ok);
  assert.ok(layoutValid(layout.object));
  await assert.rejects(ask(themeAnswerSchema(), `${ok} mock:refuse`), { name: 'aiRefusal' });
});
