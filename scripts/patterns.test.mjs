// Unit tests for the m1-079 section patterns (modules/wms-patterns/lib/patterns.js):
// every pattern sits under the parent, has a unique slug, holds only widgets the
// page area offers, and carries no image or business fact.
// Run: npm run test:unit
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { pageArea } from '../lib/area.js';
import { PARENT, patternPages } from '../modules/wms-patterns/lib/patterns.js';

let n = 0;
const pages = patternPages(() => `id${++n}`);
const offered = new Set(Object.values(pageArea.groups)
  .flatMap(group => Object.keys(group.widgets)));

function widgets(area, out = []) {
  for (const item of area?.items || []) {
    out.push(item);
    for (const value of Object.values(item)) {
      if (value?.metaType === 'area') {
        widgets(value, out);
      }
    }
  }
  return out;
}

test('six patterns, unique slugs under the parent', () => {
  assert.equal(pages.length, 6);
  const slugs = pages.map(page => page.slug);
  assert.equal(new Set(slugs).size, slugs.length);
  for (const slug of slugs) {
    assert.ok(slug.startsWith(`${PARENT.slug}/`), slug);
  }
  assert.match(PARENT.title, /do not publish/);
});

test('top-level sections are widgets the page area offers', () => {
  for (const page of pages) {
    for (const item of page.main.items) {
      assert.ok(offered.has(item.type.replace(/-widget$/, '')), `${page.slug}: ${item.type}`);
    }
  }
});

test('every widget has an id; ids are unique', () => {
  const all = pages.flatMap(page => widgets(page.main));
  assert.ok(all.every(item => item._id && item.metaType === 'widget'));
  assert.equal(new Set(all.map(item => item._id)).size, all.length);
});

test('one H1 at most per pattern, and only in a hero', () => {
  for (const page of pages) {
    const h1 = widgets(page.main)
      .filter(item => /<h1>/.test(item.content || ''));
    assert.ok(h1.length <= 1, page.slug);
  }
});

test('no images and no relationships pre-filled', () => {
  const json = JSON.stringify(pages);
  assert.doesNotMatch(json, /"_(image|images|backgroundImage|products|files)":\[[^\]]/);
});
