// Rename stage 3 (m1-076, D-GIT-78): the names that content stored while the
// project modules used the `assurer-` prefix. Doc types of the piece and page
// types, widget types, the type inside the scoped names core stores on array
// items and objects (`widget.<type>.<field>`, read back to find their schema),
// and the entrance style values (lib/motion.js) that core stores on widgets.
// Design: docs/milestones/m1-076-rename-stage-3-design.md.

const DOC_TYPES = [
  'product', 'organization', 'person', 'location',
  'division-page', 'product-category-page'
];
const WIDGET_TYPES = [
  'hero', 'slideshow', 'product-grid', 'product-card', 'feature-grid', 'stats',
  'product-list', 'organizations', 'people', 'locations', 'downloads', 'gallery'
];
const ENTRANCES = [ 'enter-fade', 'enter-rise' ];
const SCOPED = [ 'scopedArrayName', 'scopedObjectName' ];

const renames = names => new Map(names.map(name => [ `assurer-${name}`, `wms-${name}` ]));

export const TYPES = renames([ ...DOC_TYPES, ...WIDGET_TYPES ]);
export const ENTRANCE = renames(ENTRANCES);

// Rewrites `doc` in place. `walk` is core `apos.doc.walk`, which visits every
// property at any depth with its dot path. Returns the top-level properties
// that changed, so the caller can `$set` them whole (no dotted array paths:
// SQLite and MongoDB take the same update).
export function renameDoc(doc, walk) {
  const changed = new Set();
  if (TYPES.has(doc.type)) {
    doc.type = TYPES.get(doc.type);
    changed.add('type');
  }
  walk(doc, (parent, key, value, dotPath) => {
    if (value && typeof value === 'object' && renameObject(value)) {
      changed.add(dotPath.split('.')[0]);
    }
  });
  return [ ...changed ];
}

function renameObject(object) {
  let changed = false;
  if (object.metaType === 'widget') {
    if (TYPES.has(object.type)) {
      object.type = TYPES.get(object.type);
      changed = true;
    }
    if (ENTRANCE.has(object.entrance)) {
      object.entrance = ENTRANCE.get(object.entrance);
      changed = true;
    }
  }
  for (const name of SCOPED) {
    const scoped = renameScoped(object[name]);
    if (scoped !== object[name]) {
      object[name] = scoped;
      changed = true;
    }
  }
  return changed;
}

// `widget.assurer-hero.buttons` → `widget.wms-hero.buttons`
function renameScoped(value) {
  if (typeof value !== 'string') {
    return value;
  }
  const [ metaType, type, ...rest ] = value.split('.');
  return TYPES.has(type) ? [ metaType, TYPES.get(type), ...rest ].join('.') : value;
}
