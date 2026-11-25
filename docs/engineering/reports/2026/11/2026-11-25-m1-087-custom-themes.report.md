# m1-087 report: admin-customised themes

| | |
|---|---|
| **Task** | m1-087 (option b of the [m1-087 handoff](../../../../milestones/m1-087-handoff.md), chosen by the owner) |
| **Date** | 2026-11-25 |
| **Scope** | Admins copy a preset into a custom theme, change it, and choose it in Global Styles. Not in scope: AI (m1-088), editing presets, a draft-preview stylesheet, the OCI site, WordPress |
| **Prompt** | [2026-11-25-m1-087-custom-themes.prompt.md](../../../prompts/2026/11/2026-11-25-m1-087-custom-themes.prompt.md) |
| **Design** | [m1-087 custom themes](../../../../milestones/m1-087-custom-themes-design.md), decided by the owner (D-CONTENT-32): "go with your recommendations", recorded as approval of every recommendation (Q1–Q8 a), including the architecture change (Q6) |
| **Branch** | `feat/m1-087-custom-themes` from `origin/main` at `96c6826` (PR #106, m1-086, merged). Not committed: commit, push and PR wait for the owner's approval |

## Requirements

- A custom theme is a full copy of a preset's 36 tokens; presets stay code (Q1).
- Stored as an admin-only piece type with draft and publish (Q2).
- Every save checked for shape and WCAG 2.2 AA contrast, drafts too (Q3).
- Human, unique name; class from the hidden `aposDocId` (Q4).
- Global Styles → Theme offers the presets, then published custom themes (Q5).
- The theme stylesheet includes published custom themes; every process sees a change within
  10 seconds (Q6).
- The contrast pairs are shared by the unit test and the server (Q7).
- A theme chosen in Global Styles cannot be archived or unpublished (Q8).

## Work completed

- `lib/theme-contrast.js` (new): the 20 contrast pairs moved out of `scripts/themes.test.mjs`,
  with `contrastResults()` and `contrastProblems()` (one sentence per failing pair, colours and
  ratio rounded down). The theme test uses it; same pairs, same minimums.
- `lib/themes.js`: `validateTheme()` accepts `wms-theme-custom-<id>`; `themeChoices()`; a comment
  with the rule that a `themeFields` change ships a migration for stored custom themes.
- `modules/wms-theme` (new piece type, registered in `app.js`, in the admin bar's Site admin menu):
  - `lib/fields.js`: the form built from `themeFields` (core `color` fields as hex without alpha,
    `select`, `range`; switches for "separate primary text colour", "footer is a coloured band"
    and "button shape"); tabs Colours, Type, Shape, Layout; `fieldsFromTokens()` /
    `tokensFromFields()`; colour normalisation.
  - `index.js`: `viewRole`, `editRole`, `publishRole` admin; no SEO fields; on the first save the
    chosen preset's tokens are copied in and "Started from" is set (read-only); every save
    normalises colours and refuses a bad shape, a taken name or a failing contrast pair (`invalid`,
    with the pairs named); archive and unpublish are refused while Global Styles uses the theme
    (draft or published, every locale); `revision()` and `publishedThemes()` for the stylesheet.
- `modules/@apostrophecms/styles/index.js`: the Theme select's choices come from
  `wmsThemeChoices` (presets, then published custom themes); the stylesheet is presets plus
  published custom themes, rebuilt when the revision changes, checked at most every 10 s per
  process; the `<head>` link carries the CSS hash; only the current version is cached as
  `immutable`, an unknown one gets `no-store`.
- Tests: `scripts/custom-themes.test.mjs` (unit), `scripts/custom-themes-test.mjs` (REST, in
  `npm run test:ci`), `scripts/themes.test.mjs` updated.
- Docs: publishing workflow guide §6 (admin steps), design tokens guide, design note §9 (as
  built), decision register (D-CONTENT-32), prompt record, INDEX, the m1-088 handoff.

## Files changed

| File | Change |
|---|---|
| `lib/theme-contrast.js` | New |
| `lib/themes.js` | Custom class pattern, `themeChoices()`, migration rule comment |
| `modules/wms-theme/index.js`, `modules/wms-theme/lib/fields.js` | New |
| `modules/@apostrophecms/styles/index.js` | Dynamic choices; stylesheet from presets + published custom themes |
| `modules/@apostrophecms/admin-bar/index.js` | Themes in Site admin |
| `app.js` | Registers `wms-theme` |
| `scripts/custom-themes.test.mjs`, `scripts/custom-themes-test.mjs` | New |
| `scripts/themes.test.mjs` | Uses the shared pairs; choices test |
| `scripts/run-ci-tests.mjs` | Runs the custom themes suite |
| `docs/content/publishing-workflow-guide.md`, `docs/content/design-tokens.md` | Admin steps, notes |
| `docs/milestones/m1-087-custom-themes-design.md`, `docs/milestones/m1-088-handoff.md` | New |
| `docs/engineering/decision-register.md`, `INDEX.md`, prompt and this report | Records |

## Tests executed and actual results

This clone still has no `.env` and no developer database, so `test:smoke`, `test:workflow` and
`test:persistence` ran inside `npm run test:ci` (own server, temporary SQLite database), as in
m1-086.

| Command | Result |
|---|---|
| `npm run lint` | PASS, no warnings (final code) |
| `npm run test:unit` | PASS, 166/166 |
| `npm run test:ci`, run 1 | FAIL: custom themes suite 21/22. The failing check compared tokens with `JSON.stringify`, which depends on key order (a suite defect; the values were equal). Every step before it PASS; the chain stops at the first failure |
| `npm run test:ci`, run 2 | PASS, every step (31), custom themes 22/22 |
| `npm run test:ci`, run 3 (final code, after the two browser findings below) | PASS, every step (31): smoke, editor workflow, content model, SEO, publishing workflow, data dashboard, page templates, custom themes 22/22, seeds twice, persistence after restart, WordPress import, forms, security and HTTPS-proxy suites |

## Browser acceptance checklist (Chrome, agent-executed)

Disposable server on `127.0.0.1:3000` with a temporary SQLite database under the OS temp folder
(no `.env`; demo content, patterns and templates seeded), disposable admin `m1-087-admin` and
editor `m1-087-editor` created with `wms-test:ensure-admin` / `ensure-editor`, random passwords in
the session scratch folder. The database, the media folder and the password file were deleted
afterwards.

| Check | Result |
|---|---|
| Admin bar → Site admin lists Themes | PASS |
| New Theme shows only Name and Start from | PASS after a fix: first run also showed an empty "Ungrouped" tab (the hidden `started` field had no group) and an "SEO/AEO" tab (the SEO module adds fields to every piece type). Fixed: `started` in Basics, `seoFields: false` |
| Name "Ocean (m1-087 test)", Start from Ocean, Save Draft | PASS: "Draft saved" |
| Open again | PASS: Basics shows "Started from: Ocean: teal and coral" (read-only); Colours, Type, Shape, Layout tabs with Ocean's values (primary `#0f4c5c`, accent `#b4442c`) |
| Text on primary → orange swatch, Save Draft | PASS: refused; notice "The theme was not saved. Hero text, skip link: #a85a00 on #0f4c5c is 1.86:1, needs 4.5:1. Hero text on the image overlay …"; the form stays open with the values |
| Text on primary back to white, accent → navy swatch, Publish | PASS: "Your changes have been published" |
| Reload, Global Styles → Theme | PASS: the 12 presets, then "Ocean (m1-087 test)" |
| Choose it: live preview | PASS: teal hero, navy button |
| Update Global Styles; logged out `/` | PASS: `<body class="wms-theme-custom-…">` |
| Themes → Archive while in use | PASS: refused, "An error occurred: This theme is used in Global Styles. …" |
| 1440, 768, 375 px (the page in an iframe of that width) | PASS: no horizontal overflow at any width; the custom primary and accent apply at each. The window itself could not be resized (maximised), so the phone width was measured, not looked at |
| Global Styles back to Classic; logged out `/` | PASS: no theme class |
| Archive the theme (not in use) | PASS: "Content Archived" |
| Editor: admin bar | PASS: no Site admin menu, no Themes |
| Editor: `GET /api/v1/wms-theme?archived=any` | PASS: 200 with no results |
| Container (`kiri compose up -d --build`) | NOT TESTED this task |

## Implicit state review

| State | Found | Decision |
|---|---|---|
| New theme, not started | Token fields hidden by `if`; empty tabs hidden by core | Server copies the preset on the first save |
| "Start from" after the start | Would do nothing | Hidden; "Started from" (read-only, core `convert` skips it) records it; `started` forced true on update |
| Duplicate | Core copies every non-read-only field | The copy keeps the original's tokens (no second preset copy); its name must change (unique) |
| Draft vs published theme | — | Published = offered in Global Styles and in the stylesheet; drafts neither |
| Invalid values | — | Refused on every save; nothing invalid is stored |
| Theme in use | — | Archive and unpublish refused (UI and REST tested) |
| Global Styles set by API to an unknown or draft theme | Core's select `convert` stores `null` (Classic) and answers 200, as for any unknown preset value before | Not changed (core behaviour); the UI never offers such a value. Known limitation |
| Page open while a theme is published | Its stylesheet predates the theme | Guide: reload before choosing it |
| Two processes | — | Revision check at most every 10 s; a stale version request re-checks at once |
| Preset changed in a release | — | Custom copies unchanged |
| Token shape changed in a release | — | Migration rule in `lib/themes.js`; an invalid stored theme is left out of the stylesheet and logged |

## Security observations

- No new package. The new piece type is admin-only by core roles (view, edit, publish); editors
  and visitors get nothing from its REST API (tested).
- The public stylesheet holds class names and token values only, no theme names or user data
  (tested). The stylesheet route takes one query value, laundered as a string.
- Every stored value is checked on the server: hex colours, enums, ranges, the token shape, a
  unique name and contrast.
- Test passwords were random, used only on `127.0.0.1`, kept in the scratch folder outside the
  repository and deleted; the temporary databases were deleted.

## Known limitations

- Changing a published theme that is in use changes the live site when published; the guide gives
  the Duplicate route to preview first. No draft-preview stylesheet (out of scope).
- After publishing a theme, the admin reloads the page before choosing it (guide).
- A change reaches every process within about 10 seconds, not at once.
- Core stores Classic when the API sends an unknown theme value (above).
- Form labels are plain English, not i18n keys, like the other piece types.

## Rollback guidance

Revert the branch's commit. First choose a preset in Global Styles on each site: a stored custom
class without its CSS renders as Classic. Stored `wms-theme` pieces stay in the database unused;
archive them before the revert if wanted. No migration, no stored type renamed.

## For the owner

1. Review the branch; approve commit, push and PR.
2. This clone still has no `.env` or `data/` (m1-087 handoff §1 item 5).
3. Still open from earlier handoffs: `wms-patterns:seed` on each site after the m1-086 release,
   the category landing H1, the m1-085 hidden pattern columns check, OCI items, WordPress spam
   check, brand values (D-CONTENT-12), the privacy notice to the DPO (D-CONTENT-15).

## Recommended next step

m1-088, AI-assisted design (ADR first), in a new Claude Code session:
[m1-088 handoff](../../../../milestones/m1-088-handoff.md). An AI theme suggestion would be a
draft `wms-theme` through the same insert and checks.

## Left over

- Nothing on the developer database, the containers or OCI (not touched).
- Two scripts in the session scratch folder (the disposable server script, CI logs); no
  credentials.
