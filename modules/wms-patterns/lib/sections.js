// Section builders shared by the patterns (patterns.js) and the page
// templates (templates.js) (m1-086, D-CONTENT-31 Q7). Pure: no Apostrophe
// calls, so the unit tests can check the shape.
//
// Every value passes through core's `convert` when seeded. Core's boolean
// `convert` stores a missing boolean as false, ignoring `def` (m1-085), so
// builders state every boolean a section needs.

export function sectionBuilders(id) {
  const widget = (type, fields = {}) => ({
    _id: id(),
    metaType: 'widget',
    type,
    ...fields
  });
  const area = (...items) => ({
    metaType: 'area',
    items
  });
  const text = html => widget('@apostrophecms/rich-text', { content: html });
  const intro = (heading, line) => area(text(`<h2>${heading}</h2><p>${line}</p>`));
  const contactButton = (linkText = 'Contact us') => ({
    _id: id(),
    linkText,
    linkType: 'url',
    linkUrl: '/contact-us',
    style: 'primary'
  });
  // `order` is the phone order: core stacks columns by it below the tablet
  // breakpoint; on desktop `colstart` places them. `showTablet` and
  // `showMobile` are explicit because core's boolean `convert` turns a
  // missing value into false (not the field's `def: true`), which hid the
  // columns on tablets and phones (found in m1-085).
  const column = (colstart, order, content, colspan = 6) => widget('@apostrophecms/layout-column', {
    colstart,
    colspan,
    rowstart: 1,
    rowspan: 1,
    order,
    showTablet: true,
    showMobile: true,
    content
  });
  const howTo = line => text(`<p><em>How to use: ${line}</em></p>`);
  // A placeholder for a widget that cannot be saved empty (image, video,
  // slideshow, form). In a column, wrap it: area(placeholder(…)).
  const placeholder = name => text(`<p>Add ${name} here.</p>`);
  const imageHere = () => area(placeholder('an image widget'));
  const oneIdea = () => area(text('<h2>Replace with one idea</h2>' +
    '<p>Two or three short sentences. Long text belongs on its own page.</p>'));
  const layout = (...columns) => widget('@apostrophecms/layout', { columns: area(...columns) });

  // `level`: every page type prints the page title as the H1, so a hero
  // below it (in a page template) uses h2. The home page has no title H1.
  const hero = (heading, line, buttons, level = 'h1') => widget('wms-hero', {
    overlay: 'dark',
    content: area(text(`<${level}>${heading}</${level}><p>${line}</p>`)),
    buttons
  });
  const inquiry = () => widget('wms-hero', {
    overlay: 'none',
    content: area(text('<h2>Replace with a short invitation</h2>' +
      '<p>One sentence on what a visitor gets by getting in touch.</p>')),
    buttons: [ contactButton() ]
  });
  const stats = (heading, line) => widget('wms-stats', {
    intro: intro(heading, line),
    items: [ 1, 2, 3, 4 ].map(n => ({
      _id: id(),
      value: '0',
      label: `Figure ${n}: replace`
    }))
  });
  const featureGrid = (heading, line, name, text) => widget('wms-feature-grid', {
    intro: intro(heading, line),
    columns: '3',
    items: [ 1, 2, 3 ].map(n => ({
      _id: id(),
      title: `${name} ${n}: replace`,
      text,
      hasLink: false
    }))
  });
  const productList = () => widget('wms-product-list', {
    intro: intro('Replace with a heading for the products', 'One line.'),
    mode: 'pick',
    _products: [],
    columns: '3'
  });
  const downloads = () => widget('wms-downloads', {
    intro: intro('Replace with a heading for the downloads', 'One line.'),
    mode: 'pick',
    _files: []
  });
  const locations = () => widget('wms-locations', {
    intro: intro('Replace with a heading for the offices', 'One line.'),
    mode: 'all',
    limit: 12,
    showAddress: true,
    columns: '3'
  });
  const people = heading => widget('wms-people', {
    intro: intro(heading, 'One line.'),
    mode: 'pick',
    _people: [],
    columns: '3'
  });
  const organizations = heading => widget('wms-organizations', {
    intro: intro(heading, 'One line.'),
    mode: 'all',
    limit: 12,
    layout: 'cards'
  });

  return {
    widget,
    area,
    text,
    intro,
    contactButton,
    column,
    howTo,
    placeholder,
    imageHere,
    oneIdea,
    layout,
    hero,
    inquiry,
    stats,
    featureGrid,
    productList,
    downloads,
    locations,
    people,
    organizations
  };
}
