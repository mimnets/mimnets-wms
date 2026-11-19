// Unit tests for the show pattern columns migration (m1-085, D-CONTENT-30).
// Run: npm run test:unit
import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  hiddenColumnFields, isPatternPage, showPatternColumns
} from '../modules/@apostrophecms/migration/lib/show-pattern-columns.js';

// A stand-in for core `apos.doc.walk`: every property at any depth, with its
// dot path. The migration on a database copy uses core's.
function walk(doc, iterator, path = '') {
  for (const [ key, value ] of Object.entries(doc)) {
    const dotPath = path ? `${path}.${key}` : key;
    iterator(doc, key, value, dotPath);
    if (value && typeof value === 'object') {
      walk(value, iterator, dotPath);
    }
  }
}

const column = (showTablet, showMobile) => ({
  metaType: 'widget',
  type: '@apostrophecms/layout-column',
  showTablet,
  showMobile
});
const page = (slug, ...columns) => ({
  slug,
  main: {
    metaType: 'area',
    items: [ {
      metaType: 'widget',
      type: '@apostrophecms/layout',
      columns: {
        metaType: 'area',
        items: columns
      }
    } ]
  }
});

test('only pages under /patterns/ are pattern pages', () => {
  assert.ok(isPatternPage({ slug: '/patterns/story-band' }));
  assert.ok(!isPatternPage({ slug: '/patterns' }));
  assert.ok(!isPatternPage({ slug: '/' }));
  assert.ok(!isPatternPage({ title: 'A piece' }));
});

test('a pattern page: hidden columns shown, deliberate single hides kept, idempotent', () => {
  const doc = page('/patterns/story-band', column(false, false), column(true, false));
  assert.deepEqual(showPatternColumns(doc, walk), [ 'main' ]);
  const [ first, second ] = doc.main.items[0].columns.items;
  assert.deepEqual([ first.showTablet, first.showMobile ], [ true, true ]);
  assert.deepEqual([ second.showTablet, second.showMobile ], [ true, false ]);
  assert.deepEqual(showPatternColumns(doc, walk), []);
});

test('another page is not changed, only reported', () => {
  const doc = page('/', column(false, false));
  assert.deepEqual(showPatternColumns(doc, walk), []);
  assert.equal(doc.main.items[0].columns.items[0].showMobile, false);
  assert.deepEqual(hiddenColumnFields(doc, walk), [ 'main' ]);
});
