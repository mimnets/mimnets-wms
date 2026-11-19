# m1-085: layout options (design)

| | |
|---|---|
| **Task** | m1-085 |
| **Date** | 2026-11-19 |
| **Author** | The agent (agent-executed; not a human approval) |
| **Status** | **D-CONTENT-30 decided 2026-11-19 by the owner: "proceed"**, recorded as approval of every recommendation (Q1 a, Q2 a, Q3 a, Q4 a, Q5 a). Built in m1-085; changes in §9 |
| **Related** | [m1-085 handoff](m1-085-handoff.md) · [m1-084 handoff](m1-084-handoff.md) §4 · [m1-084 design](m1-084-themes-as-data-design.md) (D-CONTENT-29) · [m1-081 design](m1-081-full-width-bands-design.md) (D-CONTENT-26) · [m1-079 design](m1-079-theme-design-pass-design.md) (patterns) |

The facts come from the repository at `b02b12e` (PR #104, m1-084, merged). The owner confirmed
the scope on 2026-11-19: site-wide choices (header style, footer style, content width) and
section layouts (split media and text, offset grids), design note first.

## 1. The request and the limits

The owner asked for more layout options (m1-084 handoff §2 and §4). This task covers:

- **site-wide choices** in Global Styles: header style, footer style, content width;
- **section layouts**: split media and text, offset grids.

Limits: official Apostrophe APIs first, and styles on existing widgets before new widgets; no new
package; Community Edition only; stored values keep working (the site's Bold theme); colours and
type come from theme tokens only, so every preset still passes the contrast test; Global Styles
stay admin only (D-M0-11).

## 2. What exists today

| Item | Where | Owner of the value |
|---|---|---|
| Header layout (inline, centred) | `headerLayout` in each theme (`lib/themes.js`) → `--wms-header-*` tokens → `.wms-header` (`_wms.scss`), desktop only | The theme |
| Header button style (solid, outline) | `headerCta` in each theme → `--wms-cta-*` → `.wms-nav__item--cta .wms-button` | The theme |
| Footer band (plain, or a full-width band) | `footerBand` in each theme (`null` or `{ background, text, focus }`) → `--wms-footer-*` | The theme |
| Content width | Global Styles → Layout → Container → **Content Max Width** (range 800–1600 px, default 1200) → `--content-max-width` on `:root`. Header, main, footer, bands (`_bands.scss`) and the full-width slideshow read it | Global Styles |
| Window width without the scrollbar | `page-width.js` → `--wms-vw` on `<html>`. A measurement for full-width bands and the slideshow, not a setting | — (computed) |
| Columns | Core layout widget (12-column grid; each column stores `colstart`, `colspan`, `rowstart`, `rowspan`, `order`; tablet and mobile have their own placement or "auto"). Starters `layout-3/4/6` (m1-071). Styles: width, alignment, background, padding, band width (m1-081), entrance | The editor, per widget |
| Split media and text | Possible today: a 2-column layout with an image widget in one column and rich text in the other. The pattern "story band" (m1-079) is one, 6 + 6 columns | The editor, per widget |
| Offset grid (columns that do not start at the grid's edge) | The core grid stores `colstart` per column, so a column can start at column 2 and leave a gap. No pattern shows it | The editor, per widget |

Two facts drive the design:

1. Header and footer style are already **theme values**. A new Global Styles control for the same
   value would make two owners of one setting (the implicit state the handoff warns about).
2. Most section layouts are **already possible** with the core layout widget. What is missing is
   a way to find them (patterns) and one arrangement the grid cannot express: columns shifted
   down (a staggered grid).

## 3. Design

### 3.1 Header and footer style: the theme sets the default, Global Styles may override

Two new Global Styles selects, in Layout → a new group **Header and footer**:

| Field | Choices (value) | Stored as |
|---|---|---|
| **Header style** (`headerStyle`) | Theme default (`''`) · Logo beside the menu (`wms-header-inline`) · Logo above the menu (`wms-header-centred`) | core `class: true`: a class on `<body>`, as Theme does |
| **Footer style** (`footerStyle`) | Theme default (`''`) · Plain (`wms-footer-plain`) · Coloured band (`wms-footer-band`) | the same |

**Which one wins.** One rule, stated in the help text and in `lib/themes.js`: *an explicit
choice in Global Styles wins; "Theme default" (the empty value) uses the theme.* At any moment one
owner sets each value: the theme when the control says "Theme default", the admin otherwise.
There is no third state.

Why this way, and not "theme only" or "Global Styles only":

- **Not theme only:** the owner asked for header and footer choices in Global Styles; today the
  only way to get a centred header is to change the whole look.
- **Not Global Styles only (removing the fields from the theme):** a preset is a designed whole
  (Quiet is centred, Bold has a band). Keeping the theme value as the default means choosing a
  preset still gives its intended look, and the stored site (Bold) does not change: both new
  fields are absent on the stored doc, which reads as `''`, "Theme default". No migration.
- **The override survives a theme change.** Changing the theme does not reset the header or footer
  choice: an admin's explicit choice stays until the admin sets it back to "Theme default". The
  alternative (reset on theme change) is a hidden coupling between two controls.

**How it reaches the page (no new mechanism).** The theme stylesheet already maps theme values to
custom properties (`themeProperties()`). The build moves the header and footer parts of that
mapping into two small functions, used both for each theme and for the override classes, so the
mapping exists once. `themeCss()` writes the override rules **after** every theme rule:

```css
body.wms-header-centred { --wms-header-direction: column; … }   /* same values as a centred theme */
body.wms-header-inline  { --wms-header-direction: initial; … }  /* back to the component fallback */
body.wms-footer-band    { --wms-footer-bg: var(--wms-footer-band-bg); … }
body.wms-footer-plain   { --wms-footer-bg: initial; … }
```

A theme on `body.wms-theme-x` and an override on `body.wms-header-…` have the same specificity,
so the later rule wins; Classic is on `:root`, which any `body` rule beats. A unit test checks
that the override rules come after the theme rules.

**Footer band colours when the theme has none.** "Coloured band" on a theme without a band (for
example Classic) needs colours. Each theme writes its band colours as `--wms-footer-band-bg`,
`-text`, `-focus`: the theme's own `footerBand` when it has one, otherwise `primary` (background)
and `onPrimary` (text and focus ring). These pairs are already tested (hero text on primary); the
contrast test adds "footer band" for every preset, so a future preset cannot break it. No literal
colour in the override rules.

**Header button style** (`headerCta`, solid or outline) stays a theme value only (Q2): it is a
detail of the theme's look, not a layout choice. It can follow the same pattern later.

### 3.2 Content width: no new control

Global Styles → Layout → **Content Max Width** already is the content width, the only owner of
`--content-max-width`, and no theme sets it. A second control (for example "narrow, normal,
wide") would be a second owner of the same value. `page-width.js` is a measurement, not a
setting, and is unchanged.

Change: help text only, so admins know what it moves: "The width of the header, the page content
and the footer. Full-width bands keep their content inside this width." (Q4.)

### 3.3 Section layouts: patterns for what the grid can do, one style for what it cannot

**a. Three new section patterns** (data in `modules/wms-patterns/lib/patterns.js`, added by the
existing `node app wms-patterns:seed`, which adds missing pages only and never publishes). Each
uses the core layout widget, an image placeholder and rich text, as "story band" does:

| Pattern | Desktop | Phone |
|---|---|---|
| **Split: image left** | image 5 columns, text 7 | image, then text |
| **Split: image right** | text 7 columns, image 5 | text, then image |
| **Offset grid** | two columns of 5, starting at column 2 and column 7 (a margin on both sides) | stacked |

The phone order uses the core `order` field. Editors copy a section and paste it into their page,
as with the m1-079 patterns. No new widget.

**b. One new style on the layout widgets: Stagger** (`lib/stagger.js`, added like `bandStyle` and
`entranceStyle`, to `@apostrophecms/layout-widget`, which `layout-3/4/6` extend):

- Choices: Off (`''`) · Stagger columns (`wms-layout-stagger`), core `class: true` on the styles
  wrapper.
- Effect, desktop only (≥ 1024 px): every second column moves down by half the section space
  (`calc(var(--wms-space-section) / 2)`, so it follows the theme's spacing). Tablet and phone keep
  the core arrangement.
- "Every second" counts columns in document order. If an editor reorders columns on desktop by
  dragging, the stagger follows the order in the document, not on screen. Recorded in the help
  text.

**Not proposed: an image that runs to the window edge** (one column bleeds out of a full-width
band). It needs the band inset maths on one column and an image that fills the column's height;
each has a case to get wrong (which column, phone layout, image cropping). Option c in Q5 if the
owner wants it now; otherwise a later task.

## 4. Editors and admins

- Header style, footer style and content width are Global Styles: **admins only**, as today.
- Patterns and the Stagger style are for **editors**, as every layout widget style is.
- Labels: the Global Styles fields use plain English like the other Global Styles fields; the
  Stagger style uses `project:` i18n keys like the band style.

## 5. Implicit state review (plan)

| State | Decision |
|---|---|
| Header layout and footer band: two possible owners (theme, Global Styles) | **One rule:** an explicit Global Styles choice wins; `''` ("Theme default") uses the theme. Written in the help text and in `lib/themes.js` |
| New fields absent on the stored doc | Read as `''`: the site keeps Bold's look. No migration |
| Theme changed while an override is set | The override stays (explicit choice); not reset by a hidden coupling |
| Footer band on, theme has no band colours | Defined fallback: `primary` / `onPrimary`; tested for every preset |
| Unknown or removed override value | No rules: renders as "Theme default" |
| Override vs theme CSS order | Override rules written after theme rules in one generated stylesheet; unit test |
| Content width | One owner (Content Max Width). No new control |
| Stagger order with dragged columns | Follows document order; stated in help text |
| Patterns already seeded on a site | Seed adds missing pages only; an editor's work is kept |

## 6. Tests and checks

- `npm run lint`, `test:unit` (themes test: override rules after theme rules; footer band
  contrast with the fallback for every preset), `test:smoke`, `test:workflow`, `test:persistence`.
- Chrome, agent-executed, local dev and the container:
  - Admin: each header style and footer style on Classic, Quiet, Bold and Midnight; live preview
    changes; saved; logged out the published choice shows; "Theme default" gives the theme's look;
    focus ring visible in the footer band; 1440, 768, 375 px, no horizontal overflow.
  - Editor (disposable account): cannot change Global Styles; pastes each new pattern into a
    draft page; sets Stagger on a 3-column layout; publishes; logged out sees it; draft edits stay
    hidden. Checks that columns can be moved to leave a gap in the core layout editor (the offset
    grid relies on it).
- After the build: set the Global Styles back to what they were (Bold, "Theme default");
  archive the test page and the disposable editor.

## 7. Decisions for the owner (D-CONTENT-30)

| Q | Question | Options | Recommended |
|---|---|---|---|
| Q1 | Header and footer style: who owns the value (§3.1) | a. theme default, Global Styles may override ("Theme default" choice) · b. theme only, no new control · c. Global Styles only, removed from the theme | **a** |
| Q2 | Which site-wide choices | a. header layout and footer style · b. also the header button style (solid, outline) | **a** |
| Q3 | Footer band colours on a theme without a band | a. theme `primary` / `onPrimary` (tested) · b. offer "Coloured band" only on themes that have one (cannot be enforced in the select) | **a** |
| Q4 | Content width | a. no new control; help text on Content Max Width · b. a new narrow / normal / wide select (second owner, or a migration to replace the range) | **a** |
| Q5 | Section layouts | a. three patterns (split left, split right, offset grid) and the Stagger style · b. patterns only · c. a, plus an image to the window edge | **a** |

## 8. Out of scope

New header types (sticky, transparent over the hero), page templates (m1-086), AI-assisted design
(m1-087), per-token theme editing (D-CONTENT-29 Q5, "not now").

## 9. As built (m1-085)

Built after D-CONTENT-30. Changes from §3 to §6, found during the build:

- **Overrides are data in `lib/themes.js`** (`overrides.headerStyle`, `overrides.footerStyle`);
  the Global Styles choices are built from them, as the Theme choices are built from `themes`.
  `headerProperties()` and `footerProperties()` are the one mapping, used by every theme and by
  the overrides.
- **Footer band colours as properties:** every theme now writes `--wms-footer-band-bg`, `-text`
  and `-focus` (its own band, or `primary` / `onPrimary`); `--wms-footer-bg` and the others point
  at them with `var()` when the band is on. The Bold value of `--wms-footer-bg` is now
  `var(--wms-footer-band-bg)`; the computed colour is unchanged (`#172152`, checked in Chrome).
- **Pattern columns were hidden on tablets and phones (an m1-079 defect).** Core's boolean
  `convert` turns a missing `showTablet` / `showMobile` into `false`, not the field's `def: true`,
  so every seeded pattern column, story band included, rendered `data-visible-tablet="false"` and
  `data-visible-mobile="false"`. The pattern helper now sets both to `true` and the unit test checks
  it. Pattern pages already seeded (and sections pasted from them) keep the stored `false`: the
  seed never changes an existing page. The owner chose the repair (2026-11-19): migration `wms-show-pattern-columns` for pattern pages
  only; other pages are listed in the log for a hand check (m1-085 report).
- **Stagger** shifts by half the section space (24 px on Classic, 32 px on Bold). The style
  wrapper is the grid's direct parent, as assumed.
- **Labels:** "Header Style" choices are "Logo beside the menu" and "Logo above the menu";
  "Footer Style" choices are "Plain" and "Coloured band"; both open with "Theme default".

Implicit state review (§5), as built: unchanged, plus one row. A seeded column's visibility was
an implicit default that core's `convert` resolved to "hidden"; the pattern data now states it.
