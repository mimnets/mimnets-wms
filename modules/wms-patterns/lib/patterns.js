// Section patterns (m1-079, D-CONTENT-24): ready-made arrangements of the
// existing widgets that editors copy from. Each pattern is one draft page
// under "Patterns (do not publish)". Pure: no Apostrophe calls, so the unit
// test can check the shape (scripts/patterns.test.mjs).
//
// Placeholder text says what to replace. No business facts, no images: an
// editor adds the site's own photos (D-CONTENT-12, D-CONTENT-20).
// The section builders are shared with the page templates (sections.js).
//
// Each pattern is described by key (m1-088, D-CONTENT-33 Q8): its sections
// apart from the "How to use" note, so a design suggestion can build a page
// from patterns by key (modules/wms-design-suggestion). `summary` is the
// one-line description the suggestion's model chooses by. The seeded pages
// are unchanged (scripts/patterns.test.mjs hashes them).

import { sectionBuilders } from './sections.js';

export const PARENT = {
  slug: '/patterns',
  title: 'Patterns (do not publish)'
};

// `heroLevel`: the seeded patterns keep their H1 banner (the home page has no
// title H1); a suggested page passes 'h2', because its title is the H1.
export function patternDefs(id, { heroLevel = 'h1' } = {}) {
  const {
    text, column, imageHere, oneIdea, layout, hero, inquiry, stats,
    featureGrid, productList, downloads, locations, people, organizations, placeholder,
    contactButton, area
  } = sectionBuilders(id);

  return [
    {
      key: 'home-opening',
      title: 'Pattern: home opening',
      summary: 'Top of the home page: a banner with the main promise, key figures, and cards for the divisions.',
      howTo: 'copy these three sections to the top of the home page. Add a wide photo to the ' +
        'hero (Background image), keep one H1, and replace every placeholder.',
      sections: () => [
        hero('Replace with the one-line promise of the company',
          'One sentence that says who you serve and what you deliver.',
          [ contactButton() ], heroLevel),
        stats('Replace with a heading for the key figures', 'Use confirmed figures only.'),
        featureGrid('Replace with a heading for the divisions', 'One line on the range.',
          'Division', 'One or two sentences. Add an image and a link to the division page.')
      ]
    },
    {
      key: 'story-band',
      title: 'Pattern: story band',
      summary: 'An image beside one short idea.',
      howTo: 'an image beside a short text. Add an image widget to the left column. ' +
        'Use it to break up long text; one idea per band.',
      sections: () => [
        layout(
          column(1, 0, imageHere()),
          column(7, 1, oneIdea())
        )
      ]
    },
    // Layout patterns (m1-085, D-CONTENT-30): split media and text, and an
    // offset grid, on the core 12-column grid.
    {
      key: 'split-image-left',
      title: 'Pattern: split, image left',
      summary: 'Image on the left, text on the right; the image comes first on a phone.',
      howTo: 'an image beside text, the image narrower. Replace the placeholder in the ' +
        'left column with an image widget. On a phone the image comes first.',
      sections: () => [
        layout(
          column(1, 0, imageHere(), 5),
          column(6, 1, oneIdea(), 7)
        )
      ]
    },
    {
      key: 'split-image-right',
      title: 'Pattern: split, image right',
      summary: 'Text on the left, image on the right; the text comes first on a phone.',
      howTo: 'text beside an image, the image on the right. Replace the placeholder in the ' +
        'right column with an image widget. On a phone the text comes first.',
      sections: () => [
        layout(
          column(1, 0, oneIdea(), 7),
          column(8, 1, imageHere(), 5)
        )
      ]
    },
    {
      key: 'offset-grid',
      title: 'Pattern: offset grid',
      summary: 'Two short texts in an inset grid, for a calmer section.',
      howTo: 'two columns with space on both sides, for a calmer section. Keep one short ' +
        'text in each. For columns at different heights, set the Stagger style on the layout.',
      sections: () => [
        layout(
          column(2, 0, oneIdea(), 5),
          column(7, 1, oneIdea(), 5)
        )
      ]
    },
    {
      key: 'trust-band',
      title: 'Pattern: trust band',
      summary: 'Client or certification logos, then one short quote.',
      howTo: 'client or certification logos, then one short quote. Add a Gallery widget ' +
        'below the heading, with 4 columns and no captions, and choose logos you have ' +
        'permission to show. (A gallery needs at least one image, so it is not pre-filled.)',
      sections: () => [
        text('<h2>Replace with a heading, such as who you work with</h2><p>One line.</p>'),
        text('<blockquote><p>Replace with one short quote.</p></blockquote>')
      ]
    },
    {
      key: 'category-landing',
      title: 'Pattern: category landing',
      summary: 'Opening of a product category: banner, introduction, product list, downloads, contact band.',
      howTo: 'the opening of a product category page. Add a wide photo to the hero, then ' +
        'choose the products (or the category) in the product list and the files (or a tag) ' +
        'in the downloads.',
      sections: () => [
        hero('Replace with the category name', 'One sentence on the range.', [], heroLevel),
        text('<p>Replace with a short introduction: two or three sentences.</p>'),
        productList(),
        downloads(),
        inquiry()
      ]
    },
    {
      key: 'inquiry-band',
      title: 'Pattern: inquiry band',
      summary: 'A closing band with one clear next step (Contact us).',
      howTo: 'end a page with one clear next step. Change the button if the page has a ' +
        'better next step than Contact us.',
      sections: () => [
        inquiry()
      ]
    },
    {
      key: 'contact-page',
      title: 'Pattern: contact page',
      summary: 'Contact introduction and the office locations; the contact form goes below.',
      howTo: 'an introduction, the offices, then the contact form. Add the Form widget below ' +
        'the locations and choose the contact form.',
      sections: () => [
        text('<h2>Replace with a heading</h2><p>One sentence on how and when you reply.</p>'),
        locations()
      ]
    },
    // More patterns (m1-086, D-CONTENT-31 Q5): one for each listing or media
    // widget that had none. A widget that cannot be saved empty (slideshow,
    // video) is a placeholder, as the gallery in the trust band.
    {
      key: 'slideshow-opening',
      title: 'Pattern: slideshow opening',
      summary: 'Rotating banners at the top of a page, instead of a single banner.',
      howTo: 'rotating banners at the top of a page, instead of a hero. Replace the ' +
        'placeholder below with a Slideshow widget (each slide needs an image, so it is not ' +
        'pre-filled). Use banner slides with one heading each, two to four slides, and keep ' +
        'the pause control if autoplay is on.',
      sections: () => [
        placeholder('a Slideshow widget')
      ]
    },
    {
      key: 'video-and-text',
      title: 'Pattern: video and text',
      summary: 'A short video beside one idea.',
      howTo: 'a short video beside one idea. Replace the placeholder in the left column with ' +
        'a Video widget (it needs the video address, so it is not pre-filled). On a phone ' +
        'the text comes first.',
      sections: () => [
        layout(
          column(1, 1, area(placeholder('a Video widget')), 7),
          column(8, 0, oneIdea(), 5)
        )
      ]
    },
    {
      key: 'people-band',
      title: 'Pattern: people band',
      summary: 'A row of people, such as the leadership team.',
      howTo: 'a row of people, such as the leadership team. Choose the people in the widget, ' +
        'or switch it to one organisation.',
      sections: () => [
        people('Replace with a heading, such as our leadership')
      ]
    },
    {
      key: 'group-companies-band',
      title: 'Pattern: group companies band',
      summary: 'The group companies with their logos.',
      howTo: 'the group companies with their logos. The widget lists every published ' +
        'organisation; switch it to choose them by hand.',
      sections: () => [
        organizations('Replace with a heading, such as our group companies')
      ]
    },
    {
      key: 'downloads-band',
      title: 'Pattern: downloads band',
      summary: 'Brochures, certificates or data sheets to download.',
      howTo: 'brochures, certificates or data sheets to download. Choose the files (or a tag) ' +
        'in the widget.',
      sections: () => [
        downloads()
      ]
    }
  ];
}

// The pattern pages that `wms-patterns:seed` adds: the "How to use" note, then
// the sections. Builders run in this order so widget ids come out as before.
export function patternPages(id) {
  const { area, howTo } = sectionBuilders(id);
  return patternDefs(id).map(({
    key, title, howTo: note, sections
  }) => ({
    slug: `${PARENT.slug}/${key}`,
    title,
    main: area(howTo(note), ...sections())
  }));
}
