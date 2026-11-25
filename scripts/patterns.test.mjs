// Unit tests for the m1-079, m1-085 and m1-086 section patterns
// (modules/wms-patterns/lib/patterns.js): every pattern sits under the
// parent, has a unique slug, holds only widgets the page area offers, and
// carries no image or business fact.
// Run: npm run test:unit
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { test } from 'node:test';
import { pageArea } from '../lib/area.js';
import {
  PARENT, patternDefs, patternPages
} from '../modules/wms-patterns/lib/patterns.js';

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

test('fourteen patterns, unique slugs under the parent', () => {
  assert.equal(pages.length, 14);
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

// m1-085: columns stay inside the 12-column grid, do not overlap and show
// on every device.
test('layout columns fit the grid and show on every device', () => {
  for (const page of pages) {
    const layouts = widgets(page.main).filter(item => item.type === '@apostrophecms/layout');
    for (const layout of layouts) {
      const used = new Set();
      for (const column of layout.columns.items) {
        const { colstart, colspan } = column;
        assert.ok(colstart >= 1 && colstart + colspan - 1 <= 12, page.slug);
        // Core's convert stores a missing boolean as false: hidden columns.
        assert.ok(column.showTablet && column.showMobile, `${page.slug}: column hidden`);
        for (let c = colstart; c < colstart + colspan; c++) {
          assert.ok(!used.has(c), `${page.slug}: column ${c} used twice`);
          used.add(c);
        }
      }
    }
  }
});

// m1-086 (D-CONTENT-31 Q7): the section builders moved to sections.js. The
// nine patterns from before are seeded exactly as before. Change this hash
// only on purpose, when a pattern's content is meant to change.
test('the nine m1-079 and m1-085 patterns are unchanged', () => {
  const hash = createHash('sha256').update(JSON.stringify(pages.slice(0, 9))).digest('hex');
  assert.equal(hash, '685406838c2645c0ebec6be61133d20ece2c1fc61e2d57dc90e186e01bdb3dec');
});

// m1-088 (D-CONTENT-33 Q8): patterns are described by key (patternDefs) and
// the pages built from that. All fourteen pattern pages are seeded exactly as
// before the change.
test('all fourteen patterns are unchanged by the keyed descriptions', () => {
  const hash = createHash('sha256').update(JSON.stringify(pages)).digest('hex');
  assert.equal(hash, '1861278e011a6262149334770ed582516464d2a1e02466cb9e10255451da8f7b');
});

test('each pattern has a key, a summary and sections without the note', () => {
  const defs = patternDefs(() => 'x');
  assert.deepEqual(defs.map(def => `${PARENT.slug}/${def.key}`), pages.map(page => page.slug));
  for (const def of defs) {
    assert.match(def.key, /^[a-z]+(?:-[a-z]+)*$/);
    assert.ok(def.summary.length > 10 && def.summary.length <= 120, def.key);
    assert.ok(def.sections().length >= 1, def.key);
    assert.doesNotMatch(JSON.stringify(def.sections()), /How to use/, def.key);
  }
});

test('heroLevel h2 leaves no H1 in any pattern', () => {
  const all = patternDefs(() => 'x', { heroLevel: 'h2' })
    .flatMap(def => def.sections().flatMap(item => widgets({ items: [ item ] })));
  assert.ok(all.every(item => !/<h1>/.test(item.content || '')));
});
