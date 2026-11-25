// Section patterns (m1-079, D-CONTENT-24): ready-made arrangements of the
// existing widgets that editors copy from. Each pattern is one draft page
// under "Patterns (do not publish)". Pure: no Apostrophe calls, so the unit
// test can check the shape (scripts/patterns.test.mjs).
//
// Placeholder text says what to replace. No business facts, no images: an
// editor adds the site's own photos (D-CONTENT-12, D-CONTENT-20).
// The section builders are shared with the page templates (sections.js).

import { sectionBuilders } from './sections.js';

export const PARENT = {
  slug: '/patterns',
  title: 'Patterns (do not publish)'
};

export function patternPages(id) {
  const {
    area, text, column, howTo, imageHere, oneIdea, layout, hero, inquiry, stats,
    featureGrid, productList, downloads, locations, people, organizations, placeholder,
    contactButton
  } = sectionBuilders(id);

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
        stats('Replace with a heading for the key figures', 'Use confirmed figures only.'),
        featureGrid('Replace with a heading for the divisions', 'One line on the range.',
          'Division', 'One or two sentences. Add an image and a link to the division page.')
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
        productList(),
        downloads(),
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
        locations()
      )
    },
    // More patterns (m1-086, D-CONTENT-31 Q5): one for each listing or media
    // widget that had none. A widget that cannot be saved empty (slideshow,
    // video) is a placeholder, as the gallery in the trust band.
    {
      slug: '/patterns/slideshow-opening',
      title: 'Pattern: slideshow opening',
      main: area(
        howTo('rotating banners at the top of a page, instead of a hero. Replace the ' +
          'placeholder below with a Slideshow widget (each slide needs an image, so it is not ' +
          'pre-filled). Use banner slides with one heading each, two to four slides, and keep ' +
          'the pause control if autoplay is on.'),
        placeholder('a Slideshow widget')
      )
    },
    {
      slug: '/patterns/video-and-text',
      title: 'Pattern: video and text',
      main: area(
        howTo('a short video beside one idea. Replace the placeholder in the left column with ' +
          'a Video widget (it needs the video address, so it is not pre-filled). On a phone ' +
          'the text comes first.'),
        layout(
          column(1, 1, area(placeholder('a Video widget')), 7),
          column(8, 0, oneIdea(), 5)
        )
      )
    },
    {
      slug: '/patterns/people-band',
      title: 'Pattern: people band',
      main: area(
        howTo('a row of people, such as the leadership team. Choose the people in the widget, ' +
          'or switch it to one organisation.'),
        people('Replace with a heading, such as our leadership')
      )
    },
    {
      slug: '/patterns/group-companies-band',
      title: 'Pattern: group companies band',
      main: area(
        howTo('the group companies with their logos. The widget lists every published ' +
          'organisation; switch it to choose them by hand.'),
        organizations('Replace with a heading, such as our group companies')
      )
    },
    {
      slug: '/patterns/downloads-band',
      title: 'Pattern: downloads band',
      main: area(
        howTo('brochures, certificates or data sheets to download. Choose the files (or a tag) ' +
          'in the widget.'),
        downloads()
      )
    }
  ];
}
