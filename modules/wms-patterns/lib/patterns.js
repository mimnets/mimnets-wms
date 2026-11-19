// Section patterns (m1-079, D-CONTENT-24): ready-made arrangements of the
// existing widgets that editors copy from. Each pattern is one draft page
// under "Patterns (do not publish)". Pure: no Apostrophe calls, so the unit
// test can check the shape (scripts/patterns.test.mjs).
//
// Placeholder text says what to replace. No business facts, no images: an
// editor adds the site's own photos (D-CONTENT-12, D-CONTENT-20).

export const PARENT = {
  slug: '/patterns',
  title: 'Patterns (do not publish)'
};

export function patternPages(id) {
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
  const imageHere = () => area(text('<p>Add an image widget here.</p>'));
  const oneIdea = () => area(text('<h2>Replace with one idea</h2>' +
    '<p>Two or three short sentences. Long text belongs on its own page.</p>'));
  const layout = (...columns) => widget('@apostrophecms/layout', { columns: area(...columns) });

  const hero = (heading, line, buttons) => widget('wms-hero', {
    overlay: 'dark',
    content: area(text(`<h1>${heading}</h1><p>${line}</p>`)),
    buttons
  });
  const inquiry = () => widget('wms-hero', {
    overlay: 'none',
    content: area(text('<h2>Replace with a short invitation</h2>' +
      '<p>One sentence on what a visitor gets by getting in touch.</p>')),
    buttons: [ contactButton() ]
  });

  return [
    {
      slug: '/patterns/home-opening',
      title: 'Pattern: home opening',
      main: area(
        howTo('copy these three sections to the top of the home page. Add a wide photo to the ' +
          'hero (Background image), keep one H1, and replace every placeholder.'),
        hero('Replace with the one-line promise of the company',
          'One sentence that says who you serve and what you deliver.',
          [ contactButton() ]),
        widget('wms-stats', {
          intro: intro('Replace with a heading for the key figures', 'Use confirmed figures only.'),
          items: [ 1, 2, 3, 4 ].map(n => ({
            _id: id(),
            value: '0',
            label: `Figure ${n}: replace`
          }))
        }),
        widget('wms-feature-grid', {
          intro: intro('Replace with a heading for the divisions', 'One line on the range.'),
          columns: '3',
          items: [ 1, 2, 3 ].map(n => ({
            _id: id(),
            title: `Division ${n}: replace`,
            text: 'One or two sentences. Add an image and a link to the division page.',
            hasLink: false
          }))
        })
      )
    },
    {
      slug: '/patterns/story-band',
      title: 'Pattern: story band',
      main: area(
        howTo('an image beside a short text. Add an image widget to the left column. ' +
          'Use it to break up long text; one idea per band.'),
        layout(
          column(1, 0, imageHere()),
          column(7, 1, oneIdea())
        )
      )
    },
    // Layout patterns (m1-085, D-CONTENT-30): split media and text, and an
    // offset grid, on the core 12-column grid.
    {
      slug: '/patterns/split-image-left',
      title: 'Pattern: split, image left',
      main: area(
        howTo('an image beside text, the image narrower. Replace the placeholder in the ' +
          'left column with an image widget. On a phone the image comes first.'),
        layout(
          column(1, 0, imageHere(), 5),
          column(6, 1, oneIdea(), 7)
        )
      )
    },
    {
      slug: '/patterns/split-image-right',
      title: 'Pattern: split, image right',
      main: area(
        howTo('text beside an image, the image on the right. Replace the placeholder in the ' +
          'right column with an image widget. On a phone the text comes first.'),
        layout(
          column(1, 0, oneIdea(), 7),
          column(8, 1, imageHere(), 5)
        )
      )
    },
    {
      slug: '/patterns/offset-grid',
      title: 'Pattern: offset grid',
      main: area(
        howTo('two columns with space on both sides, for a calmer section. Keep one short ' +
          'text in each. For columns at different heights, set the Stagger style on the layout.'),
        layout(
          column(2, 0, oneIdea(), 5),
          column(7, 1, oneIdea(), 5)
        )
      )
    },
    {
      slug: '/patterns/trust-band',
      title: 'Pattern: trust band',
      main: area(
        howTo('client or certification logos, then one short quote. Add a Gallery widget ' +
          'below the heading, with 4 columns and no captions, and choose logos you have ' +
          'permission to show. (A gallery needs at least one image, so it is not pre-filled.)'),
        text('<h2>Replace with a heading, such as who you work with</h2><p>One line.</p>'),
        text('<blockquote><p>Replace with one short quote.</p></blockquote>')
      )
    },
    {
      slug: '/patterns/category-landing',
      title: 'Pattern: category landing',
      main: area(
        howTo('the opening of a product category page. Add a wide photo to the hero, then ' +
          'choose the products (or the category) in the product list and the files (or a tag) ' +
          'in the downloads.'),
        hero('Replace with the category name', 'One sentence on the range.', []),
        text('<p>Replace with a short introduction: two or three sentences.</p>'),
        widget('wms-product-list', {
          intro: intro('Replace with a heading for the products', 'One line.'),
          mode: 'pick',
          _products: [],
          columns: '3'
        }),
        widget('wms-downloads', {
          intro: intro('Replace with a heading for the downloads', 'One line.'),
          mode: 'pick',
          _files: []
        }),
        inquiry()
      )
    },
    {
      slug: '/patterns/inquiry-band',
      title: 'Pattern: inquiry band',
      main: area(
        howTo('end a page with one clear next step. Change the button if the page has a ' +
          'better next step than Contact us.'),
        inquiry()
      )
    },
    {
      slug: '/patterns/contact-page',
      title: 'Pattern: contact page',
      main: area(
        howTo('an introduction, the offices, then the contact form. Add the Form widget below ' +
          'the locations and choose the contact form.'),
        text('<h2>Replace with a heading</h2><p>One sentence on how and when you reply.</p>'),
        widget('wms-locations', {
          intro: intro('Replace with a heading for the offices', 'One line.'),
          mode: 'all',
          limit: 12,
          showAddress: true,
          columns: '3'
        })
      )
    }
  ];
}
