// Unit tests for the m1-086 page templates
// (modules/wms-patterns/lib/templates.js) and the publishing guard
// (lib/never-published.js), D-CONTENT-31. Core's Duplicate copies every
// field of a template, so a template must not carry anything a new page
// should not inherit.
// Run: npm run test:unit
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { pageArea } from '../lib/area.js';
import pageModule from '../modules/@apostrophecms/page/index.js';
import { PARENT } from '../modules/wms-patterns/lib/patterns.js';
import { TEMPLATES_PARENT, templatePages } from '../modules/wms-patterns/lib/templates.js';
import {
  NEVER_PUBLISHED, isNeverPublished
} from '../modules/wms-patterns/lib/never-published.js';

let n = 0;
const pages = templatePages(() => `id${++n}`);
const offered = new Set(Object.values(pageArea.groups)
  .flatMap(group => Object.keys(group.widgets)));
const pageTypes = new Set(pageModule.options.types.map(type => type.name));

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
const allWidgets = page => [ page.intro, page.main ].flatMap(area => widgets(area));

test('five templates, unique slugs under the parent, registered page types', () => {
  assert.equal(pages.length, 5);
  const slugs = pages.map(page => page.slug);
  assert.equal(new Set(slugs).size, slugs.length);
  for (const page of pages) {
    assert.ok(page.slug.startsWith(`${TEMPLATES_PARENT.slug}/`), page.slug);
    assert.ok(pageTypes.has(page.type), `${page.slug}: ${page.type}`);
    assert.notEqual(page.type, '@apostrophecms/home-page', page.slug);
  }
  assert.match(TEMPLATES_PARENT.title, /do not publish/);
});

test('only content fields: nothing a copy should not inherit', () => {
  const allowed = new Set([ 'slug', 'title', 'type', 'main', 'intro', 'summary' ]);
  for (const page of pages) {
    for (const key of Object.keys(page)) {
      assert.ok(allowed.has(key), `${page.slug}: ${key}`);
    }
  }
});

test('main sections are widgets the page area offers; intro is rich text', () => {
  for (const page of pages) {
    for (const item of page.main.items) {
      assert.ok(offered.has(item.type), `${page.slug}: ${item.type}`);
    }
    for (const item of page.intro?.items || []) {
      assert.equal(item.type, '@apostrophecms/rich-text', page.slug);
    }
  }
});

test('every widget has an id; ids are unique', () => {
  const all = pages.flatMap(allWidgets);
  assert.ok(all.every(item => item._id && item.metaType === 'widget'));
  assert.equal(new Set(all.map(item => item._id)).size, all.length);
});

test('no H1: every page type prints the title as the H1', () => {
  for (const page of pages) {
    assert.ok(allWidgets(page).every(item => !/<h1[ >]/.test(item.content || '')), page.slug);
  }
});

test('no relationship pre-filled', () => {
  const json = JSON.stringify(pages);
  assert.doesNotMatch(json, /"_[A-Za-z]+":\[[^\]]/);
});

test('every placeholder says what to do, and a how-to line comes first', () => {
  for (const page of pages) {
    assert.match(page.main.items[0].content, /How to use: Duplicate this page/, page.slug);
  }
  assert.ok(pages.every(page => !page.summary || page.summary.length <= 300));
});

test('layout columns show on every device', () => {
  for (const page of pages) {
    for (const item of allWidgets(page).filter(w => w.type === '@apostrophecms/layout-column')) {
      assert.ok(item.showTablet && item.showMobile, `${page.slug}: column hidden`);
    }
  }
});

test('never published: the two parents and everything under them', () => {
  assert.deepEqual(NEVER_PUBLISHED, [ PARENT.slug, TEMPLATES_PARENT.slug ]);
  for (const slug of [ '/patterns', '/patterns/story-band', '/templates', '/templates/contact',
    '/templates/contact/copy-of-contact' ]) {
    assert.equal(isNeverPublished(slug), true, slug);
  }
  for (const slug of [ '/', '/contact-us', '/templates-old', '/about/templates',
    '/patternsx/a', undefined, null ]) {
    assert.equal(isNeverPublished(slug), false, String(slug));
  }
});
