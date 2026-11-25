// Pages that are never published (m1-086, D-CONTENT-31 Q3): the Patterns
// and Templates parents and everything under them. Their content is
// placeholders for editors to copy. A copy made with core's Duplicate while
// viewing a template is placed under it, so it is refused too until the
// editor moves it. Pure, unit-tested (scripts/templates.test.mjs).

import { PARENT } from './patterns.js';
import { TEMPLATES_PARENT } from './templates.js';

export const NEVER_PUBLISHED = [ PARENT.slug, TEMPLATES_PARENT.slug ];

export const NEVER_PUBLISHED_MESSAGE = 'Templates and patterns are never published. ' +
  'Duplicate the page, move the copy out of Patterns or Templates in Pages, then publish the copy.';

export function isNeverPublished(slug) {
  return typeof slug === 'string' &&
    NEVER_PUBLISHED.some(root => slug === root || slug.startsWith(`${root}/`));
}
