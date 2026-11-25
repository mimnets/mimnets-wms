# m1-087: admin-customised themes (design)

| | |
|---|---|
| **Task** | m1-087 (option b of the [m1-087 handoff](m1-087-handoff.md)) |
| **Date** | 2026-11-25 |
| **Author** | The agent (agent-executed; not a human approval) |
| **Status** | **D-CONTENT-32 decided 2026-11-25 by the owner: "go with your recommendations"**, recorded as approval of every recommendation (Q1–Q8 a), including the architecture change in Q6 |
| **Related** | [m1-087 handoff](m1-087-handoff.md) · [m1-085 report](../engineering/reports/2026/11/2026-11-19-m1-085-layout-options.report.md), "Recommended next step" · [m1-084 handoff](m1-084-handoff.md) §4 (the split) · D-CONTENT-29 (themes as data) |

The facts come from the repository at `96c6826` (PR #106, m1-086, merged) and from the installed
core, `apostrophe` 4.34.0. The owner chose option b on 2026-11-25: admin-customised themes before
AI-assisted design.

## 1. The request and the limits

The owner's question in m1-085: can admins edit a theme, and how would it be saved? Today they
cannot: an admin chooses one of 12 presets in Global Styles → Theme (D-CONTENT-29 Q5, "not now").

Limits: official Apostrophe APIs first; no new package; Community Edition only; admins only
(D-M0-11); no theme below WCAG 2.2 AA can be used; existing presets and stored choices keep
working; the later AI task (now m1-088) must produce the same object as a custom theme.

**This is an architecture change.** Since m1-084 the theme stylesheet is built once at start from
code (`lib/themes.js`) and served at an immutable, hashed URL. Custom themes make it depend on
database content. AGENTS.md (clean architecture) asks for the owner's approval before such a
change (Q6).

## 2. What exists today

| Item | Where | Notes |
|---|---|---|
| 12 presets, the token shape (`themeFields`, 36 tokens), `validateTheme()`, `themeCss()` | `lib/themes.js` | Pure data and functions |
| Theme select in Global Styles | `modules/@apostrophecms/styles/index.js` | `class: true`; choices fixed at start from `themes`; the value is stored on the global doc (`stylesClasses`) and put on `<body>` |
| Theme stylesheet | same module, `init` + `GET /api/v1/@apostrophecms/styles/wms-themes` | Built once per process; URL carries a hash; `Cache-Control: immutable`. Holds every preset, because the Global Styles preview swaps the body class in the browser |
| WCAG contrast pairs (20 pairs) | `scripts/themes.test.mjs` (`pairs()`), `lib/contrast.js` | Checked only in the unit test, not at run time |
| Global Styles permissions | `editRole: 'admin'`, `publishRole: 'admin'` | Core options |
| Processes per site | Staging image: `APOS_CLUSTER_PROCESSES=2` | A value built in one process's memory is not seen by the other |

Core facts checked in 4.34.0: a `select` field accepts `choices: '<methodName>'` (dynamic
choices, `@apostrophecms/schema` `choicesRoute`); a `class: true` style puts the stored value on
`<body>` whatever it is (`styles/ui/apos/universal/render.mjs`); piece types support `viewRole`,
`editRole` and `publishRole`; core emits `beforeUnpublish` from the type module.

## 3. Design

### 3.1 Copy, never edit a preset (Q1)

A custom theme is a **full copy** of a preset's 36 tokens, stored in the database and edited from
there. Presets stay code: reviewed, contrast-tested, unchanged by any admin. A release that changes
a preset does not change a custom theme made from it (no hidden drift, no contrast surprise).

Rejected: storing only the changed tokens on top of a preset. It is smaller, but a release that
changes the preset would change every theme built on it, unvalidated.

### 3.2 Stored as an admin-only piece type (Q2)

New module `modules/wms-theme` (piece type `wms-theme`, label "Theme" / "Themes"):

- `viewRole: 'admin'`, `editRole: 'admin'`, `publishRole: 'admin'`: editors neither see it in the
  admin bar nor read it through the REST API (proved by a REST test as an editor).
- Draft and published like other content. **Published means "offered in Global Styles"**, not
  "visible to visitors": a theme has no public page; it changes the site only when Global Styles
  chooses it and Global Styles is published.
- Core's **Duplicate** on pieces gives "copy a custom theme" for free.

### 3.3 Fields, generated from `themeFields`

The schema is **built from `themeFields`** (one source; a new token cannot be forgotten in the
form). A unit test checks that every theme field has exactly one form field. Core field types
only, in four tabs:

| Tab | Tokens | Core field |
|---|---|---|
| Colours | 16 colours and the overlay colour | `color` (hex, no alpha; the server refuses anything else) |
| | `overlayOpacity` | `range` 0–100 |
| | `primaryText` (`null` = "same as primary") | `boolean` "Separate colour for primary text" + `color` with `if` |
| | `footerBand` (`null` = plain footer) | `boolean` "Footer is a coloured band" + three `color` fields with `if` |
| Type | `fontBody`, `fontHeading` (approved faces only), `typeScale`, `headingWeight`, `headingTracking`, `eyebrowTracking` | `select`, `range` |
| Shape | `radius`, `radiusSmall`, `buttonRadius` ("pill" or a number), `shadow`, `shadowTint`, `cardStyle` | `range`, `select` (+ `range` with `if` for the button) |
| Layout | `keyFigures`, `sectionSpace`, `headerLayout`, `headerCta` | `select` |

Labels and help texts use the `project:` i18n namespace.

### 3.4 Starting from a preset

A new theme shows only **Name** and **Start from** (a select of the 12 presets). On the first save
the server copies that preset's tokens into the fields and sets a hidden `started` flag. Every
token field has `if: { started: true }`, so it appears from the second opening, already filled.
After that, **Start from** is read-only (a record of where the theme came from). This uses only
schema `if` and a `beforeInsert` handler; no custom UI code.

Admin flow: Themes → New → name "Ocean (customised)", Start from "Ocean" → Save → open again →
change colours → Save (validated, §3.5) → Publish → Global Styles → Theme → choose it, preview,
publish Global Styles.

### 3.5 Validated on the server (Q3)

On every save (draft and published), in `beforeSave`:

1. Build the token object from the fields and run `validateTheme()` (shape).
2. Run the **contrast pairs**. They move from `scripts/themes.test.mjs` to a new
   `lib/theme-contrast.js` (`contrastProblems(tokens)`), used by the server and by the unit test,
   so presets and custom themes pass the same 20 checks (small refactor, Q7).
3. On a problem, refuse the save with error name `invalid` (not `forbidden`, m1-086 lesson) and
   a message that names each failing pair, for example: "Text on the alternate surface: 3.2:1,
   needs 4.5:1. Muted text: 4.1:1, needs 4.5:1." The modal stays open with the admin's values.

Recommended: refuse **draft saves too** (Q3 a). One rule, and an invalid theme can never be
offered or previewed.

### 3.6 Name and class (Q4)

- **Name:** the piece title, human, required, unique among custom themes and preset labels
  (checked on save). Default suggestion: "<preset> (customised)". Renaming is free.
- **Class:** `wms-theme-custom-<aposDocId>`, set once at insert in a hidden field. `aposDocId` is
  the same in draft, published and every locale, so a rename never needs a migration and the
  class cannot clash with a preset. `validateTheme()` gains digits in the custom class pattern.

### 3.7 Global Styles → Theme lists custom themes (Q5)

The Theme select's choices change from a fixed list to a method (`choices: 'wmsThemeChoices'`):
the 12 presets, then the **published** custom themes, by name. A draft custom theme is not offered.

Preview of changes to a theme already in use: Duplicate it, edit and publish the copy (not in use,
so the site does not change), choose the copy in Global Styles and preview, then publish Global
Styles. The guide gets this as a short section. A separate draft-preview stylesheet would allow
previewing an unpublished theme in place; it is left out (§7).

### 3.8 The stylesheet depends on the database (Q6)

`themeCss()` stays a pure function; its input becomes **presets + published custom themes**.

Because a site runs two processes, a stylesheet rebuilt in memory on publish would reach only
one process. Recommended (Q6 a):

- Each process keeps the built CSS and its hash, and a **revision**: the count of published custom
  themes and their latest `updatedAt` (one small indexed query).
- It checks the revision **at most every 10 seconds** when a page is rendered; if it changed, it
  rebuilds. The `<head>` link carries the hash as today, so the URL changes with the content and
  `immutable` caching stays correct.
- The route serves the current CSS. If a request asks for a version that this process does not
  have yet, it re-checks once before answering.

At worst a change shows up to 10 seconds late on one process. Considered and not recommended:
query on every page view (a database read per visitor for something that changes a few times a
year); rebuild only at start (an admin would need a restart).

The public stylesheet then contains published custom themes: class names and colour values only,
no names, users or other content.

### 3.9 A theme in use cannot be withdrawn (Q8)

Archiving or unpublishing a custom theme whose class is chosen in Global Styles (draft or
published, any locale) is refused with: "This theme is used in Global Styles. Choose another theme
there and publish, then archive this one." Handlers on `wms-theme:beforeUnpublish` and on the save
that archives (`archived: true`), each proved by a REST test (m1-086 lesson: a handler on the wrong
event name fails silently). Without this, the site would fall back to Classic without warning.

### 3.10 When the token shape changes later

A release that adds a token to `themeFields` ships an `@apostrophecms/migration` that fills it on
stored custom themes from their **Start from** preset (rule added to the comment in
`lib/themes.js`). As a safety net, a stored custom theme that fails `validateTheme()` is left out
of the stylesheet and logged once per build; it renders as Classic until fixed.

### 3.11 The later AI task

m1-088 (AI-assisted design, ADR first) would create a **draft** `wms-theme` through the same
insert and the same validation. Nothing in this design is AI-specific.

## 4. Admin flow (for the guide)

1. Admin bar → Themes → New theme. Name it, choose Start from, Save.
2. Open it again; change colours, type, shape and layout. Save. A contrast problem is named;
   fix the colour and save again.
3. Publish the theme: it is now offered in Global Styles → Theme. Nothing changes for visitors.
4. Global Styles → Theme → choose it, check the preview, publish Global Styles.
5. To change a theme in use without changing the live site: Duplicate, edit the copy, publish the
   copy, choose it in Global Styles and preview, publish Global Styles.

## 5. Implicit state review (plan)

| State | Decision |
|---|---|
| New theme, not started | Only Name and Start from visible; server fills tokens on first save |
| Start from after start | Read-only record; changing it would overwrite the admin's work |
| Draft vs published theme | Published = offered in Global Styles; drafts never offered and never in the stylesheet |
| Invalid values | Refused on every save (Q3 a); no invalid state can be stored |
| Theme in use | Cannot be unpublished or archived (§3.9) |
| Published edits to a theme in use | Go live on publish (that is the point of publishing); the guide shows the Duplicate route for preview |
| Preset changed in a release | Custom copies unchanged (§3.1) |
| Token shape changed in a release | Migration fills new tokens; invalid stored theme left out and logged (§3.10) |
| Two processes | Revision check every 10 s at most (§3.8) |
| Renamed theme | Class unchanged (§3.6) |
| Editor | No read, no write, no admin bar entry (`viewRole`), proved by REST |
| Stored class of a removed custom theme | Cannot happen while in use; if it did (database edit), no rules: Classic, as for a removed preset today |

## 6. Tests and checks

- `npm run lint`, `npm run test:unit`: the schema covers every theme field; `contrastProblems()`
  gives the same result as before for all 12 presets; the custom class pattern.
- REST suite `scripts/custom-themes-test.mjs` in `npm run test:ci`: create as admin, tokens copied
  from the preset; editor read and write refused; a low-contrast save refused with the pair named;
  publish → the theme is in the Theme choices and in the stylesheet, and the stylesheet URL
  changes; archive or unpublish while in use refused; archive when not in use works.
- Server suites `test:smoke`, `test:workflow`, `test:persistence` (through `npm run test:ci` if
  this clone still has no `.env`).
- Chrome, agent-executed: admin creates, edits (a failing colour, then a passing one), publishes,
  chooses the theme in Global Styles, previews, publishes; logged out the site shows it; at 1440,
  768 and 375 px; a disposable editor does not see Themes. Clean up: Global Styles back to its
  earlier theme, test theme archived, editor archived.

## 7. Out of scope

Editing a preset in place; a draft-preview stylesheet for unpublished themes; per-page or
per-section themes; new fonts or font upload; logos; AI (m1-088); OCI changes (the owner runs
releases).

## 8. Decisions for the owner (D-CONTENT-32)

| Q | Question | Options | Recommended |
|---|---|---|---|
| Q1 | What a custom theme is | a. full copy of a preset's tokens · b. only the changed tokens on top of a preset | **a** |
| Q2 | Where it is stored | a. admin-only piece type `wms-theme`, draft and published · b. fields on Global Styles (one custom theme only, no draft of its own) | **a** |
| Q3 | When validation applies | a. every save, drafts too · b. publish only | **a** |
| Q4 | Name and class | a. human name, unique; class from the hidden `aposDocId` · b. class from the name (a rename needs a migration) | **a** |
| Q5 | Which custom themes Global Styles offers | a. published only · b. drafts too (admins only) | **a** |
| Q6 | Stylesheet depends on the database: approve the change, and how processes learn of changes | a. revision check at most every 10 s · b. check on every page view · c. rebuild only at start | **a** |
| Q7 | Refactor: contrast pairs from the test into `lib/theme-contrast.js`, shared by server and test | a. approve · b. duplicate the pairs in the module | **a** |
| Q8 | Theme in use | a. cannot be unpublished or archived · b. allowed; the site falls back to Classic | **a** |

## 9. As built (m1-087)

Built as designed (Q1–Q8 a). Differences and details found while building:

- **Labels are plain English**, like the other piece types' fields (`wms-organization` and the
  rest), not `project:` i18n keys (§3.3). A later i18n pass can move them.
- **"Started from"** is a read-only field shown after the first save, set by the server. Core's
  `convert` skips read-only fields, so neither the UI nor the API can change it. "Start from" is
  hidden after the first save; `started` stays true on every update.
- **Duplicate** copies `started` and every token, so the copy keeps the original's values (no
  second copy from the preset). The name must be changed before the copy saves (names are unique).
- **Colours** from the picker are stored as `#rrggbb` (upper case and `#abc` are normalised before
  the check).
- **Global Styles** checks a chosen value against the dynamic choices (core's select `convert`),
  so the REST API cannot set a draft custom theme either.
- **Stylesheet route:** a request for an unknown version gets today's CSS with
  `Cache-Control: no-store`; only the current version is `immutable`.
- **Guide:** after publishing a theme, reload the page before choosing it in Global Styles. The
  open page still has the stylesheet from before the publish, so the preview would show no
  colours for the new class.
- Admin bar: **Site admin → Themes**; keyboard shortcut `G, Shift+T` (core's `G, T` default would
  be ambiguous).
- **Found in the browser check:** the hidden `started` field created an empty "Ungrouped" tab (it
  is now listed in Basics), and `@apostrophecms/seo` added an "SEO/AEO" tab to the theme form (off
  with the module's `seoFields: false`; a theme has no page).
