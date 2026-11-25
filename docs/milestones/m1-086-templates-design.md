# m1-086: templates (design)

| | |
|---|---|
| **Task** | m1-086 |
| **Date** | 2026-11-25 |
| **Author** | The agent (agent-executed; not a human approval) |
| **Status** | **D-CONTENT-31 decided 2026-11-25 by the owner: "go to with your recommendations"**, recorded as approval of every recommendation (Q1–Q7 a). Built in m1-086; changes in §9 |
| **Related** | [m1-086 handoff](m1-086-handoff.md) · [m1-084 handoff](m1-084-handoff.md) §4 (the split) · [m1-085 design](m1-085-layout-options-design.md) (D-CONTENT-30) · [m1-079 design](m1-079-theme-design-pass-design.md) (patterns, D-CONTENT-24) |

The facts come from the repository at `65f2201` (PR #105, m1-085, merged) and from the installed
core, `apostrophe` 4.34.0. The owner confirmed the scope on 2026-11-25: templates as planned
(more section patterns and whole-page starters); admin-customised themes come later.

## 1. The request and the limits

From the m1-084 handoff §4: **more section patterns**, and **whole-page starters**, either a
"Start from template" choice that copies a template page's areas into a new draft page, or new
page types with prefilled areas. This note compares the two.

Limits: official Apostrophe APIs first; no new package; Community Edition only (the Pro
"template library" extension is out); templates are never public; every value a template creates
goes through core's `convert`; existing pages and patterns keep working.

## 2. What exists today

| Item | Where | Notes |
|---|---|---|
| Section patterns | `modules/wms-patterns/lib/patterns.js` (pure data, 9 patterns), seeded by `node app wms-patterns:seed` as draft pages under "Patterns (do not publish)" (`/patterns`, `orphan`) | Editors copy one section (core's widget copy and paste) into their page. The seed adds missing pages only and never publishes |
| Page types | `default-page`, `wms-division-page` (intro, organisations, more sections), `wms-product-category-page` (summary, header image, intro, products, more sections), home | All `main` areas use `pageArea` (`lib/area.js`) |
| **Core "Duplicate"** | Page manager and page context menu → **Duplicate** (`AposDocContextMenu.copy`) → page editor with `copyOfId` → `POST /api/v1/@apostrophecms/page` with `_copyingId` → `convert(…, { copyingId })` | Copies **every field** of the source page (areas, relationships, SEO fields, "Hide in navigation") into a **new draft**, gives every area and widget a new `_id` (`schema.regenerateIds`), and records `copyOfId`. Title becomes "Copy of …", slug `<current page>/copy-of-…`. The copy is placed **under the page the editor is viewing** (`AposDocEditor.getRequestBody`). Editors may use it (needs create and edit) |
| Boolean `convert` | Core | A missing boolean is stored as `false`, ignoring `def` (m1-085). A full copy carries the stored values, so Duplicate is not affected; seeding is |

The key fact: **core already copies a page into a new draft with new widget IDs.** A
"Start from template" feature is mostly a matter of having good template pages to duplicate.

## 3. Design

### 3.1 Copy, not page types (Q1)

| | a. Template pages + core Duplicate | b. Custom "Start from template" field | c. Page types with prefilled areas |
|---|---|---|---|
| How | Template pages are drafts; an editor duplicates one, renames it and moves it | A select in the new-page dialog; a server hook copies the template's areas on insert | One page type per template; `newInstance()` returns prefilled areas |
| New code | Seed data only | A new field, a hook that repeats what `_copyingId` does, ID regeneration | A module and a template per page type |
| Who owns a template | Editors (a template is a page they can edit) | Editors | Developers (a release per change) |
| Page type of the result | Any: the template's own type (default, division, category) | Same | Fixed per template; one more entry in the page type list per template |
| After the template changes | Pages made before keep their content (no link) | Same | Same; changing the type of an existing page would not refill it |
| Cost of a mistake | Low: the copy is a draft | Low | A type cannot be removed while pages use it (stored `type`) |

**Recommended: a.** It uses core's own copy path (the one the UI already offers), adds no code
path to maintain, works for every page type, and keeps templates in editors' hands. b repeats a
core feature; c fixes content in code and grows the page type list with every template.

**Template changes after use (Q6):** no link, by design. A page made from a template is an
ordinary page; core's `copyOfId` stays as a record only. A changed template affects only the next
copy. Keeping pages in step with a template would make two owners of one page's content.

### 3.2 Where templates live (Q2)

A second draft-only parent page, **"Templates (do not publish)"** (`/templates`, hidden from
navigation), next to Patterns, seeded by the same task (`wms-patterns:seed`). Patterns and
templates are different tools (copy one section; duplicate a whole page), so they get two parents
and two lines in the guide.

A piece type was considered and rejected: core cannot duplicate a piece into a page, so it would
need option b's custom copy.

**Small refactor needed (AGENTS.md, clean architecture; Q7).** The section helpers (`widget`,
`area`, `text`, `column`, `hero`, `inquiry` and the like) are local to `patternPages()`. Templates
need the same helpers, and a second copy would drift. Proposed: move them into
`modules/wms-patterns/lib/sections.js` (pure), used by `patterns.js` and a new `templates.js`. The
pattern output stays the same: the unit test compares it before and after. `ensurePage()` takes
the page type from the data instead of always `default-page`.

### 3.3 Template pages (Q4)

Each template is one draft page of the right type, built only from existing widgets and
placeholders ("Replace …"), with a short "How to use" line at the top, as the patterns have.
Recommended first set (five):

| Template | Page type | Sections |
|---|---|---|
| About the company | `default-page` | hero, short story (split image left), key figures (stats), group companies (organisations), inquiry band |
| Division overview | `wms-division-page` | intro, organisations left empty, then feature grid (one card per category), inquiry band |
| Product category | `wms-product-category-page` | summary and intro placeholders, header image empty, product list, downloads, inquiry band (the "category landing" pattern as a whole page) |
| Leadership | `default-page` | intro, people (empty pick; people are not imported yet, D-CONTENT-4), inquiry band |
| Contact | `default-page` | intro, locations, a "Add the Form widget here" placeholder (the form is chosen by the editor) |

No home template: the home page is a parked singleton and cannot be duplicated into; the
existing "home opening" pattern covers it.

Template data rules (unit-tested, like the patterns): no "Hide in navigation", no SEO fields, no
relationships filled, every boolean style field stated (the m1-085 lesson), every column visible on
tablet and phone, one H1 at most.

### 3.4 More section patterns (Q5)

Patterns for widgets that have none yet, all existing widgets:

| Pattern | Sections |
|---|---|
| Slideshow opening | "How to use" note and a placeholder: each slide needs an image (`_image` is required), so the slideshow cannot be pre-filled, as the gallery in the trust band. The note gives the settings to choose (banner slides, autoplay off or with the pause control) |
| Video and text | layout 7 + 5: video widget placeholder and one idea (text first on a phone) |
| People band | heading, people widget (empty pick) |
| Group companies band | heading, organisations widget (all, logos) |
| Downloads band | heading, downloads widget (pick, empty) |

The exact field values are checked against each widget's schema at build time; a widget that
needs content before it can be saved (as the gallery did in m1-079) gets a placeholder note
instead, as the trust band does.

### 3.5 Publishing guard (Q3)

Today a pattern page can be published by mistake (m1-079 Q3 chose no guard). Templates raise the
risk: an editor may edit the template itself instead of a copy, and a copy made while viewing a
template is placed **under** `/templates` until it is moved. Proposed: one server rule, a
`@apostrophecms/page:beforePublish` handler in `wms-patterns` that refuses to publish a page whose
slug is `/patterns`, `/templates` or under them, with the message "Templates and patterns are
never published. Duplicate the page, move the copy out of Templates, then publish." It covers
the REST API too. Admins are not exempt (there is no reason to publish a template).

## 4. Editor flow (for the guide)

1. Pages → open "Templates (do not publish)" → on the template, **Duplicate**.
2. Change the title (and slug); save as draft. The copy appears under the page you were viewing.
3. Move the copy where it belongs in the page tree (drag in Pages).
4. Replace every placeholder; delete the "How to use" line; publish.

The publishing workflow guide gets a "Start a page from a template" section with these steps.
Whether step 1 should be **from the page you want as the parent** (so step 3 is not needed) is
checked in Chrome at build time and written in the guide as it actually works.

## 5. Implicit state review (plan)

| State | Decision |
|---|---|
| Template ↔ page made from it | No link (Q6). `copyOfId` is core's record only |
| Where a copy is placed | Core: under the page being viewed. Guide says so; the guard stops a copy under `/templates` from being published before it is moved |
| Fields copied by Duplicate (SEO, "Hide in navigation", relationships) | Templates leave them empty or default; unit test |
| Booleans in seeded widgets | Stated in the data; unit test (m1-085 lesson) |
| Template edited by an editor | Affects later copies only; a re-run of the seed never overwrites it |
| Template archived | Seed does not re-add it (finds archived pages too), as for patterns |
| Template or pattern published | Refused on the server (Q3 a) |
| Placeholder left in a published copy | Not prevented (a check of free text would be guesswork). Every placeholder starts with "Replace", so an editor can search for it. Known limitation |

## 6. Tests and checks

- `npm run lint`, `npm run test:unit` (patterns output unchanged after the refactor; template data
  rules in §3.3; slug guard as a pure function), `test:smoke`, `test:workflow`,
  `test:persistence`.
- Seed on a **copy** of the local database first, then on the developer database; a second run
  creates nothing.
- Chrome, agent-executed, disposable editor: duplicate each template, rename, move, replace a
  placeholder, publish; logged out the page shows and the template is 404; publishing a template
  and a copy still under `/templates` is refused with the message; each new pattern pasted into a
  draft page; 1440, 768 and 375 px in core's breakpoint preview (no hidden columns, no horizontal
  overflow). Clean up: archive test pages and the disposable editor.

## 7. Out of scope

Admin-customised themes (later, owner 2026-11-25), AI-assisted design (m1-087), a home template,
keeping pages in step with templates, the Pro template library.

## 8. Decisions for the owner (D-CONTENT-31)

| Q | Question | Options | Recommended |
|---|---|---|---|
| Q1 | Whole-page starters: how | a. template pages + core Duplicate · b. custom "Start from template" field · c. page types with prefilled areas | **a** |
| Q2 | Where templates live | a. new draft parent "Templates (do not publish)", same seed task · b. under the Patterns parent · c. a piece type (needs custom copy) | **a** |
| Q3 | Publishing guard | a. server refuses publishing anything under `/patterns` or `/templates` · b. no guard (as m1-079) | **a** |
| Q4 | Which templates | a. the five in §3.3 · b. fewer (the owner names them) · c. more (the owner names them) | **a** |
| Q5 | Which new patterns | a. the five in §3.4 · b. fewer or different (the owner names them) | **a** |
| Q6 | Template changed after use | a. no link; affects later copies only · b. track copies and flag changes | **a** |
| Q7 | Refactor: shared section helpers in `lib/sections.js`, pattern output unchanged | a. approve · b. keep helpers in `patterns.js` and export them from there | **a** |

## 9. As built (m1-086)

Built after D-CONTENT-31. Changes from §3 to §6, found during the build:

- **The guard's event (§3.5).** Core emits `beforePublish` from the page type module (for example
  `default-page`), not from `@apostrophecms/page`, so the handler listens on
  `@apostrophecms/page-type:beforePublish`. The first CI run caught this: with the event named in
  §3.5 the rule never ran and an editor could publish the "Templates" parent.
- **The guard's error is `invalid` (400), not `forbidden`.** Core's publish dialog replaces a
  `forbidden` error on the "publish the parent first" path with a canned text about permissions
  ("we are saving and submitting your draft"); any other error shows the server's message. The
  rule is about content, not permission. Seen in Chrome: the editor gets the project's message
  when publishing a template, and when publishing a copy that is still under Templates.
- **Duplicate from the template's own page** places the copy under the template
  (`/templates/contact/copy-of-contact`), as core's code says (§2). Choosing Publish in the
  dialog saves the copy as a draft and shows the message; the editor then moves it in Pages and
  the slug follows the new parent (`/copy-of-contact`). The guide describes this path.
- **Moving a never-published page** in Pages shows core's "notfound" notice (the page manager
  asks for the published version). It happens with any never-published page, not only copies;
  the move works. One line in the guide.
- **No H1 in templates (§3.3).** Every page type prints the title as the H1, so templates have no
  H1 at all (the hero builder takes a heading level; patterns keep theirs). Two m1-079 patterns
  have a hero H1: "home opening" (right on the home page, which has no title H1) and "category
  landing" (gives a category page two H1s; not changed here, Minimal change; see the report).
- **Templates do not repeat what the page type lists.** The division page lists its category
  pages and organisations, and the category page its products, by themselves; their templates
  have a story band or downloads and an inquiry band instead of the listings in §3.3.
- **Video and slideshow** need content before they can be saved (`video` and each slide's
  `_image` are required), so "video and text" has a placeholder column and "slideshow opening" a
  placeholder, as the trust band's gallery.
- **CI:** the seed runs twice in `npm run test:ci`, and a new suite (`scripts/templates-test.mjs`)
  duplicates a template as an editor through core's REST API (`_copyingId`).

Implicit state review (§5), as built: unchanged, plus the guard's two cases (a page under the
parents refused by the project rule; the parents themselves, which core's "publish the parent
first" offer would otherwise publish).
