// Page templates (m1-086, D-CONTENT-31): whole-page starters. Each template
// is one draft page under "Templates (do not publish)". An editor makes a
// page from one with core's Duplicate (page context menu or Pages manager),
// which copies every field into a new draft with new widget ids. There is no
// link back: a changed template affects later copies only (Q6).
//
// Pure: no Apostrophe calls, so the unit test can check the shape
// (scripts/templates.test.mjs). Rules, because Duplicate copies every field:
// no "Hide in navigation", no SEO fields, no relationship filled, no H1
// (every page type prints the title as the H1), every boolean stated.

import { sectionBuilders } from './sections.js';

export const TEMPLATES_PARENT = {
  slug: '/templates',
  title: 'Templates (do not publish)'
};

export function templatePages(id) {
  const {
    area, text, column, howTo, imageHere, oneIdea, layout, hero, inquiry, stats,
    downloads, locations, people, organizations, placeholder
  } = sectionBuilders(id);
  const duplicate = 'Duplicate this page (Pages, or the page menu), rename the copy, move it ' +
    'where it belongs in Pages, replace every placeholder and delete this line.';

  return [
    {
      slug: '/templates/about-company',
      title: 'Template: about the company',
      type: 'default-page',
      main: area(
        howTo(`${duplicate} Add a wide photo to the opening banner and an image to the story.`),
        hero('Replace with what the company stands for',
          'One sentence on who you serve and since when.', [], 'h2'),
        layout(
          column(1, 0, imageHere(), 5),
          column(6, 1, oneIdea(), 7)
        ),
        stats('Replace with a heading for the key figures', 'Use confirmed figures only.'),
        organizations('Replace with a heading, such as our group companies'),
        inquiry()
      )
    },
    {
      slug: '/templates/division-overview',
      title: 'Template: division overview',
      type: 'wms-division-page',
      intro: area(text('<p>Replace with two or three sentences on the division.</p>')),
      main: area(
        howTo(`${duplicate} Product category pages placed under the copy are listed ` +
          'automatically; choose the group organisations in the page settings.'),
        layout(
          column(1, 0, imageHere(), 5),
          column(6, 1, oneIdea(), 7)
        ),
        inquiry()
      )
    },
    {
      slug: '/templates/product-category',
      title: 'Template: product category',
      type: 'wms-product-category-page',
      summary: 'Replace with one or two sentences for the card on the division page.',
      intro: area(text('<p>Replace with a short introduction: two or three sentences.</p>')),
      main: area(
        howTo(`${duplicate} Choose the header image in the page settings. Products that ` +
          'name this category are listed automatically.'),
        downloads(),
        inquiry()
      )
    },
    {
      slug: '/templates/leadership',
      title: 'Template: leadership',
      type: 'default-page',
      main: area(
        howTo(`${duplicate} Choose the people in the people widget.`),
        text('<p>Replace with one or two sentences on how the group is led.</p>'),
        people('Replace with a heading, such as the board'),
        inquiry()
      )
    },
    {
      slug: '/templates/contact',
      title: 'Template: contact',
      type: 'default-page',
      main: area(
        howTo(`${duplicate} Replace the last placeholder with the Form widget and choose ` +
          'the contact form.'),
        text('<h2>Replace with a heading</h2><p>One sentence on how and when you reply.</p>'),
        locations(),
        placeholder('the Form widget')
      )
    }
  ];
}
