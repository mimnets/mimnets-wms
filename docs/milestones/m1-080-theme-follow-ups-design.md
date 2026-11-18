# m1-080: theme follow-ups (design)

| | |
|---|---|
| **Task** | m1-080 |
| **Date** | 2026-11-18 |
| **Author** | The agent (agent-executed; not a human approval) |
| **Status** | **D-CONTENT-25 decided 2026-11-18 by the owner:** all recommendations (Q1 a, Q2 a, Q3 a, Q4 a, Q5 not now, Q6 owner files it, Q7 after this task) |
| **Related** | [m1-080 handoff](m1-080-handoff.md) · [m1-079 theme design pass](m1-079-theme-design-pass-design.md) (D-CONTENT-24) · [m1-074 theme presets design](m1-074-theme-presets-design.md) (D-CONTENT-23) · [WordPress import design](../content/wordpress-import-design.md) |

The facts come from the repository at `8fd8982` (PR #97, m1-079, merged) and from a comparison in
Chrome on 2026-11-18. The owner chose "theme follow-ups" and then the agent's recommended scope:
(1) the Global Styles fault, (2) footer and header from the original site, (3) photo backgrounds
and the hero photo, (4) a menu decision. The default preset (D-CONTENT-24 Q4) is chosen after
these, on the result.

## 1. How the comparison ran

- **New site:** the owner's `wms-local` Kiri container, rebuilt from `origin/main`, with
  `wms-patterns:seed`, the WordPress import (348 created, 0 failed), the 341 imported drafts
  published locally, and the m1-079 home proof copied from `data/m1-079-audit.db` (relationship
  IDs mapped through `importSource`). Local only.
- **Original:** <https://www.assurerworld.com/>, viewed only (read). Nothing on WordPress changed.
- Chrome at 1440 px: page text of both, then screenshots top to bottom.

## 2. Findings

### 2.1 Global Styles never reach visitors (fault, all sites)

Visitors get browser defaults (16 px, line height about 1.15); signed-in editors get the theme
defaults (18 px, 1.5). The two see different pages, and the same fault means **a chosen preset
never reaches visitors** (its body class travels the same way).

Cause, in core 4.34.0 (`node_modules/apostrophe`):

- The visitor stylesheet and body classes live on the global document
  (`stylesStylesheet`, `stylesClasses`). Only `@apostrophecms/styles`' `afterSave` handler
  (`mirrorToGlobal`, `styles/lib/handlers.js`) writes them.
- On a new database, `@apostrophecms/migration`'s `requirements` handler inserts singletons in
  module order. `defaults.js` registers `@apostrophecms/styles` (line 39) **before**
  `@apostrophecms/global` (line 42), so the styles document is saved while no global document
  exists; the `updateOne` matches nothing. Nothing writes it again until someone saves Global
  Styles.
- Signed-in editors get the CSS rendered live in the browser, so editors never notice.

Both local databases show it (`stylesStylesheet` empty on every global document). Any server where
nobody has pressed Save in Global Styles, including OCI, is likely the same; the owner can check
by viewing the site logged out.

### 2.2 Content

Text: the main content matches the original almost word for word (categories, "Since 2012",
figures, services, entities, Trend Adapters, Leadership items, Goal to Sustainability, contacts
map). Known differences stay as decided before (Cairo text cut to 300 characters, figures marked
unconfirmed, ">>>>" removed).

Missing on the new site:

| Original | Where it belongs | Kind |
|---|---|---|
| Hero photo slider, title "ASSURER WORLD WIDE" and its sentence ("We are Assurers, AWW, World Wide Sourcing and Supply Company…") | Home hero (photo, text) | Content; the import did not read the slider |
| Footer: about text, call line, address (Versatile Creation Ltd, Uttara, Dhaka), phone, email, © line | Global Content: fields exist (`footerText`, `contactAddress`, `contactPhone`, `contactEmail`, `copyrightName`) | Content only |
| Footer "Know More": assurer.world, vclbd.net, Sitemap | No field for a list of footer links | Code (A3) |
| Footer gallery thumbnails | Nothing | Not proposed (Q5) |
| Bottom bar: WhatsApp, translate, location, presentation, Instagram | `socialLinks` has no WhatsApp; no fixed bar | Not proposed (Q5) |
| ASSURER.WORLD wall-logo photo, full width | Home, an image band | Content |
| Header menu: Products, Organizations, Services, Leadership, Contact Us | Page tree (Q4) | Decision |

### 2.3 Design and layout

The original is built from photo backgrounds and colour: a photo hero, an orange category band
with round photos, figures over an office photo, services on a linen texture with icons, entities
over a dark photo in flag-coloured cards, Goal to Values over a thread-spools photo, a navy
four-column footer. The new site has the same sections on plain white, with one navy hero box.

What the site can already do: the hero takes a background image (`wms-hero`); the layout widget
takes a colour, gradient or image background with an overlay (core `background` style preset,
m1-071). The section widgets (`wms-feature-grid`, `wms-stats`, `wms-organizations`) take none, so
an editor must wrap them in a layout to get a background.

### 2.4 Found on the original site (for the owner, not this task)

The page text of the original home page ends with casino advertising ("NV Casino", German and
Polish), not visible in the layout. That is a common sign of SEO spam injected into a compromised
WordPress site. The new site does not contain it (the import reads content areas only). The owner
should have the WordPress site checked; the agent changes nothing there.

## 3. Design

### A1. Global Styles reach visitors (code, fixes 2.1)

In the project override `modules/@apostrophecms/styles/index.js`, a handler on
`@apostrophecms/migration:requirements`. It runs after core's `insertRequired` (the migration
module registers first), so the global and styles documents exist in every locale and mode. For
each styles document whose global document has no `stylesStylesheet`, it saves the styles
document once with the official `update`, so core's own `mirrorToGlobal` writes the stylesheet and
classes. Nothing is copied from core.

- Idempotent: once the stylesheet exists, it does nothing. Runs at every start in development and
  at `migration:migrate` on servers (the existing release step), so new and existing sites heal
  without anyone pressing Save.
- Not an `@apostrophecms/migration` migration: those are skipped on a new database
  (`self.apos.isNew`), which is exactly the case that breaks.
- The handler's comment names the core cause, so it can be removed when core fixes the order.
  Reporting the fault to ApostropheCMS (GitHub issue) is outward-facing: the owner's choice (Q6).

### A2. Background for section widgets (code, enables 2.3)

Add the core preset `background: 'background'` to the `styles` of `wms-feature-grid`,
`wms-stats` and `wms-organizations`, as the layout widget already has. Editors get colour,
gradient or image plus overlay on the section itself, in the existing Styles panel. One line per
widget, no new field, no new CSS beyond a check that text stays readable:

- Text colour is unchanged (dark). With a photo, editors use the overlay (light, high opacity) so
  dark text stays readable, as on the original's Goal to Values cards. A light-text option for
  dark photos is Q3 b, not proposed by default.

### A3. Footer links (code, fills the "Know More" column)

A `footerLinks` array in Global Content (label plus the existing `linkFields()` page-or-URL link,
max 8), rendered as a list in the footer next to the contact block, only when it has items.
External links keep the site's existing link rules (`lib/web-url.js`).

### B. Content and settings (no code)

In the local container, as the proof for the preset choice, the agent enters the original site's
public footer data and builds the home page's photo sections. On OCI, the owner enters them after
the release.

1. Global Content: footer text, address, phone, email, `copyrightName` "Assurer World", the new
   footer links; header call to action "Contact Us" to the contact page. The values are the ones
   the original site publishes; the owner confirms them before OCI (D-CONTENT-12).
2. Home: hero with the original title and sentence; photo backgrounds on the categories, figures,
   entities and Goal to Values sections, with overlays; the wall-logo photo as a full-width image.
3. Photos (Q2): the original's background photos are not in the import (they are Elementor
   background images, not content). Either the owner supplies them, or the agent downloads them
   from the original site after the owner approves each file (download rule).

### C. Menu (decision only)

The menu is built from the page tree (two levels, "Hide in Navigation" respected). The tree comes
from the WordPress pages (`/style`, `/health` divisions, import design W02, W06), not from the
WordPress menu, so the two differ. Options in Q4.

## 4. Out of scope

Presets themselves (Q4 of D-CONTENT-24 comes after this task), a fixed bottom bar, footer gallery,
WhatsApp, a translate control, Elementor-style animated counters, the OCI site, WordPress.

## 5. Owner checklist

| Item | Guide |
|---|---|
| This note's decisions | §8 |
| Check the original WordPress site for injected spam | §2.4 |
| Confirm footer values before OCI (D-CONTENT-12) | §3 B1 |
| After release on OCI: enter Global Content, rebuild the home photo sections, choose the preset | §3 B |

## 6. Implicit state review (plan)

| State | Decision |
|---|---|
| Visitor stylesheet present or missing on the global document (today: missing until someone saves, editors and visitors see different pages) | Made explicit: one place heals it (A1), at start and migrate; the comment states the rule "the global document always carries the styles stylesheet". Final state: present, handler does nothing |
| Preset body class (`stylesClasses`) travels with the stylesheet | Covered by A1; no separate state |
| Section background on or off (A2) | Core's style field, one place; unchanged semantics |
| Footer parts shown only when filled | Unchanged rule, extended to `footerLinks` |

## 7. Tests

- `npm run lint`, `test:unit`, `test:smoke`, `test:workflow`, `test:persistence`.
- Unit or startup test for A1: a new database (SQLite) gets `stylesStylesheet` on every global
  document after start; a second start changes nothing (same `stylesStylesheetVersion`).
- Chrome (agent-executed, local container): logged out, body text 18 px and line height 1.5 on a
  site never saved; switch the preset as admin, then logged out the body class changes; as a
  disposable **editor**, set an image background with overlay on a feature grid, publish, check
  logged out; footer links shown only when filled; 375, 768 and 1440 px, no horizontal overflow;
  draft change stays hidden from visitors.

## 8. Decisions for the owner (D-CONTENT-25)

| Q | Question | Options | Recommended |
|---|---|---|---|
| Q1 | Build scope | a. A1 + A2 + A3 + B in the local container · b. A1 only (the fault) · c. A1 + A2 | **a** |
| Q2 | Photos | a. agent downloads the original's background and hero photos, each file approved by the owner · b. owner supplies photos | **a** (same company's own photos) |
| Q3 | Text on photo backgrounds | a. overlay only, dark text (no new field) · b. also a light-text option | **a** |
| Q4 | Menu | a. keep the page tree as is · b. reorder and rename in the page tree to match the original (no code) · c. a hand-made menu in Global Content (code) | **a** now; b later once the owner settles the structure |
| Q5 | Bottom bar, footer gallery, WhatsApp | not now · later task | **not now** |
| Q6 | Report the core fault to ApostropheCMS | owner files it · not | **owner files it** (outward-facing) |
| Q7 | Default preset (D-CONTENT-24 Q4) | after this task, on the local container · now | **after this task** |

## 9. As built (m1-080)

- **A1** as designed: `ensureVisitorStylesheet` on `@apostrophecms/migration:requirements` in
  `modules/@apostrophecms/styles/index.js`. Proved on two new SQLite databases: without it every
  global document has no stylesheet; with it each gets one, and a second start changes nothing (same
  `stylesStylesheetVersion`). An existing database (the `wms-local` container) healed at its next
  start. The test is in the smoke suite, which CI runs on a new database: the logged-out home page
  links the stylesheet and the stylesheet is served (not a unit test, because the fault only shows
  on a real start).
- **A2** as designed, plus the core `padding` preset next to `background` on the three section
  widgets and on the layout widget. Without inner space, cards and text touched the edges of a
  coloured or photo band (seen in Chrome). Same kind of one-line core preset; editors set both in
  the Styles panel.
- **CSS:** `[data-apos-widget-style-wrapper-for] { box-sizing: border-box; }` in `_wms.scss`. Core
  puts the Width style (`width: 100%`) and the Padding style on the same wrapper; without it a
  padded layout overflowed the page by its padding.
- **A3** as designed: `footerLinks` in Global Content (group Footer), checked by the existing
  `rejectNonWebUrls` (`footerLinks.linkUrl`), rendered as `.wms-footer__links`. A relative URL
  ("/sitemap.xml") is refused, as for the other link fields; the original's "Sitemap" link is
  therefore not repeated (an XML sitemap is not a page for visitors).
- **B** in the `wms-local` container only: seven photos from the original site, each approved by
  the owner (Q2 a), uploaded through the REST API; Global Content footer filled and published;
  the home page rebuilt with the original hero (photo, title, sentence), colour and photo bands
  with padding, section headings moved into each widget's intro area, Goal to Values and the
  contacts wrapped in one-column layouts, the wall-logo photo as a full-width image. The header
  call to action was **not** turned on: the menu already has "Contact Us" (Q4 a keeps the menu),
  so a second "Contact Us" button would repeat it.
- Bands are as wide as the content, not the full window as on the original. A full-width band is a
  layout change (the `main` width and the margin of m1-079), left for the owner (handoff).
