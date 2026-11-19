// Show pattern columns (m1-085, D-CONTENT-30): the `wms-patterns:seed` task
// stored `showTablet: false` and `showMobile: false` on every layout column
// (core's boolean `convert` ignores `def: true`), so the patterns' layouts
// disappeared below desktop width. Only the pattern pages are repaired: on
// any other page a hidden column may be an editor's choice, so those are
// only listed.

import { PARENT } from '../../../wms-patterns/lib/patterns.js';

export const isPatternPage = doc => typeof doc.slug === 'string' &&
  doc.slug.startsWith(`${PARENT.slug}/`);

const isHiddenColumn = value => value?.metaType === 'widget' &&
  value.type === '@apostrophecms/layout-column' &&
  value.showTablet === false &&
  value.showMobile === false;

// The top-level properties of `doc` that hold a layout column hidden on
// both tablet and phone. `walk` is core `apos.doc.walk`.
export function hiddenColumnFields(doc, walk) {
  const fields = new Set();
  walk(doc, (parent, key, value, dotPath) => {
    if (isHiddenColumn(value)) {
      fields.add(dotPath.split('.')[0]);
    }
  });
  return [ ...fields ];
}

// Shows the hidden columns of a pattern page, in place. Returns the
// top-level properties that changed, so the caller can `$set` them whole
// (no dotted array paths: SQLite and MongoDB take the same update).
export function showPatternColumns(doc, walk) {
  if (!isPatternPage(doc)) {
    return [];
  }
  const fields = hiddenColumnFields(doc, walk);
  walk(doc, (parent, key, value) => {
    if (isHiddenColumn(value)) {
      value.showTablet = true;
      value.showMobile = true;
    }
  });
  return fields;
}
