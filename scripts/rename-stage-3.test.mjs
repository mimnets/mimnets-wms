// Unit tests for the rename stage 3 migration (m1-076, D-GIT-78).
// Run: npm run test:unit
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readdirSync } from 'node:fs';
import {
  ENTRANCE, TYPES, renameDoc
} from '../modules/@apostrophecms/migration/lib/rename-stage-3.js';
import { entranceStyle } from '../lib/motion.js';

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

const area = items => ({
  metaType: 'area',
  items
});
const widget = (type, fields = {}) => ({
  metaType: 'widget',
  type,
  ...fields
});

test('the map names every module that stores a type, and every entrance value', () => {
  const stored = readdirSync(new URL('../modules/', import.meta.url))
    .filter(name => name.startsWith('wms-'))
    .map(name => name.replace(/-widget$/, ''))
    .filter(name => [ ...TYPES.values() ].includes(name));
  assert.equal(TYPES.size, 18);
  assert.equal(stored.length, 18);
  for (const [ from, to ] of TYPES) {
    assert.equal(from.replace(/^assurer-/, 'wms-'), to);
  }
  assert.deepEqual(
    [ ...ENTRANCE.values() ],
    entranceStyle.choices.map(choice => choice.value).filter(Boolean)
  );
});

test('renames doc type, widgets at any depth and scoped names; reports top-level fields', () => {
  const doc = {
    type: 'assurer-division-page',
    title: 'Text that says assurer-hero stays text',
    intro: area([
      widget('assurer-hero', {
        buttons: [ {
          metaType: 'arrayItem',
          scopedArrayName: 'widget.assurer-hero.buttons'
        } ]
      })
    ]),
    main: area([
      widget('assurer-product-grid', {
        entrance: 'assurer-enter-rise',
        cards: area([ widget('assurer-product-card') ])
      }),
      widget('@apostrophecms/layout', {
        columns: area([
          widget('@apostrophecms/layout-column', {
            content: area([
              widget('assurer-stats', { entrance: 'assurer-enter-fade' })
            ])
          })
        ])
      }),
      widget('@apostrophecms/rich-text', {
        content: '<p class="x">assurer-hero</p>',
        entrance: ''
      })
    ]),
    address: {
      metaType: 'object',
      scopedObjectName: 'doc.assurer-division-page.address'
    },
    untouched: area([ widget('@apostrophecms/image') ])
  };
  assert.deepEqual(
    renameDoc(doc, walk).sort(),
    [ 'address', 'intro', 'main', 'type' ]
  );
  assert.equal(doc.type, 'wms-division-page');
  assert.equal(doc.title, 'Text that says assurer-hero stays text');
  const hero = doc.intro.items[0];
  assert.equal(hero.type, 'wms-hero');
  assert.equal(hero.buttons[0].scopedArrayName, 'widget.wms-hero.buttons');
  assert.equal(doc.address.scopedObjectName, 'doc.wms-division-page.address');
  const [ grid, layout, text ] = doc.main.items;
  assert.equal(grid.type, 'wms-product-grid');
  assert.equal(grid.entrance, 'wms-enter-rise');
  assert.equal(grid.cards.items[0].type, 'wms-product-card');
  const stats = layout.columns.items[0].content.items[0];
  assert.equal(stats.type, 'wms-stats');
  assert.equal(stats.entrance, 'wms-enter-fade');
  assert.equal(text.content, '<p class="x">assurer-hero</p>');
  assert.equal(text.entrance, '');
});

test('a second run changes nothing; other names are left alone', () => {
  const doc = {
    type: 'assurer-product',
    description: area([ widget('assurer-gallery') ])
  };
  renameDoc(doc, walk);
  const after = structuredClone(doc);
  assert.deepEqual(renameDoc(doc, walk), []);
  assert.deepEqual(doc, after);
  const core = {
    type: '@apostrophecms/home-page',
    main: area([ widget('wms-hero'), widget('assurer-unknown') ]),
    links: [ {
      metaType: 'arrayItem',
      scopedArrayName: 'doc.@apostrophecms/global.links'
    } ]
  };
  const before = structuredClone(core);
  assert.deepEqual(renameDoc(core, walk), []);
  assert.deepEqual(core, before);
});
