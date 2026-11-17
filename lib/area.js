// Widget menus for every area that takes page content (m1-071, D-CONTENT-21).
// `expanded`: core shows the group headings (and widget descriptions) only in
// the expanded "Add Content" panel; the small dropdown lists widgets flat.
// One table: each widget's "Add Content" group and the places it may go.
//   page   - page-level `main` areas
//   column - a layout column (`@apostrophecms/layout-column`)
//   nested - a nested layout column (`nested-column`)
// Groups and their order are the same in every menu; a group with no widget
// for a place is left out of that menu.

const GROUPS = [
  [ 'text', 'project:groupTextMedia' ],
  [ 'sections', 'project:groupSections' ],
  [ 'listings', 'project:groupListings' ],
  [ 'forms', 'project:groupForms' ],
  [ 'layout', 'project:groupLayout' ]
];

const ALL = [ 'page', 'column', 'nested' ];

// [ widget type, group, places ]. Order within a group is menu order.
const WIDGETS = [
  [ '@apostrophecms/rich-text', 'text', ALL ],
  [ '@apostrophecms/image', 'text', ALL ],
  [ '@apostrophecms/video', 'text', ALL ],
  // A hero needs about 380 px; too narrow for a nested column.
  [ 'wms-hero', 'sections', [ 'page', 'column' ] ],
  [ 'wms-feature-grid', 'sections', ALL ],
  [ 'wms-stats', 'sections', ALL ],
  [ 'wms-downloads', 'sections', ALL ],
  [ 'wms-gallery', 'sections', ALL ],
  // Needs room for slide text and controls, like the hero (m1-072).
  [ 'wms-slideshow', 'sections', [ 'page', 'column' ] ],
  [ 'wms-product-grid', 'listings', ALL ],
  [ 'wms-product-list', 'listings', ALL ],
  [ 'wms-people', 'listings', ALL ],
  [ 'wms-locations', 'listings', ALL ],
  [ 'wms-organizations', 'listings', ALL ],
  [ '@apostrophecms/form', 'forms', ALL ],
  // Layout starters: the core layout opens with 2 columns.
  [ '@apostrophecms/layout', 'layout', [ 'page' ] ],
  [ 'layout-3', 'layout', [ 'page' ] ],
  [ 'layout-4', 'layout', [ 'page' ] ],
  [ 'layout-6', 'layout', [ 'page' ] ],
  // One level of nesting: a nested column offers no further layout.
  [ 'nested-layout', 'layout', [ 'column' ] ]
];

// Area field `options` for a place: `{ groups: { <name>: { label, widgets } } }`.
export function areaOptions(place) {
  const groups = {};
  for (const [ name, label ] of GROUPS) {
    const widgets = {};
    for (const [ type, group, places ] of WIDGETS) {
      if (group === name && places.includes(place)) {
        widgets[type] = {};
      }
    }
    if (Object.keys(widgets).length) {
      groups[name] = {
        label,
        widgets
      };
    }
  }
  return {
    expanded: true,
    groups
  };
}

export const pageArea = areaOptions('page');
export const columnArea = areaOptions('column');
export const nestedColumnArea = areaOptions('nested');
