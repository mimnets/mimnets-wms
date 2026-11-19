# m1-081 report: full-width bands

| | |
|---|---|
| **Task** | m1-081 (full-width bands from the [m1-081 handoff](../../../../milestones/m1-081-handoff.md) §2, the owner's choice) |
| **Date** | 2026-11-19 |
| **Scope** | A "Band width" style so a section's background runs the width of the window while its content stays at page width; the local `wms-local` home page set to use it. Not in scope: `main`'s width and the m1-079 side margin, the slideshow's width field, the OCI site, WordPress |
| **Prompt** | [2026-11-19-m1-081-full-width-bands.prompt.md](../../../prompts/2026/11/2026-11-19-m1-081-full-width-bands.prompt.md) |
| **Design** | [m1-081 full-width bands](../../../../milestones/m1-081-full-width-bands-design.md), decided by the owner (D-CONTENT-26): all recommendations; as built in §9 |
| **Branch** | `feat/m1-081-full-width-bands` from `origin/main` at `bad8ae7` (PR #98 merged). Not committed: commit, push and PR wait for the owner's approval |

Checks marked agent-executed were run by the agent. They are not human approval.

## Requirements

- An editor can make a section's background run edge to edge, as on the original site (Q4 a).
- The content inside stays on the page's content line and never touches the screen edge.
- Bands next to each other touch (Q1 a); the hero can be a band (Q2 a); the slideshow keeps its
  own Width field (Q3 a).
- Existing pages do not change until an editor chooses the option.

## Work completed

- **A1** `lib/band.js` exports `bandStyle`: a select, `class: true`, "Content width" (default)
  or "Full window width" (`wms-band-full`), with help text. Added to the `styles` of
  `wms-feature-grid`, `wms-stats`, `wms-organizations`, `wms-hero` and the layout widget.
- **A2** `_bands.scss`: the styles wrapper breaks out to `--wms-vw` (as the slideshow does),
  `min-width` so the layout's Width style cannot shrink it, `display: flow-root` so bands touch;
  the widget inside gets the page's content line as side margins and `width: auto`; the hero fills
  the band, square. No breakout inside a layout column or without `--wms-vw`.
- **B** (local container only): image rebuilt; the home page's hero and nine colour and photo
  sections set to "Full window width" and published by a disposable editor.

## Files changed

| File | Change |
|---|---|
| `lib/band.js` | new: `bandStyle` |
| `modules/wms-feature-grid-widget/index.js`, `modules/wms-stats-widget/index.js`, `modules/wms-organizations-widget/index.js`, `modules/wms-hero-widget/index.js`, `modules/@apostrophecms/layout-widget/index.js` | `band: bandStyle` in `styles` |
| `modules/asset/ui/src/scss/_bands.scss`, `modules/asset/ui/src/index.scss` | new partial and its import |
| `modules/@apostrophecms/i18n/i18n/project/en.json` | four `project:band*` keys |
| `scripts/section-widgets.test.mjs` | unit test: the style and the widgets that have it |
| `scripts/editor-workflow-test.mjs` | two checks: band saved in draft, class on the public wrapper |
| `docs/milestones/m1-081-full-width-bands-design.md`, `docs/milestones/m1-082-handoff.md` | design note, handoff |
| `docs/engineering/decision-register.md`, `docs/engineering/INDEX.md`, this report, the prompt record | records |

## Tests executed and actual results

| Command | Result |
|---|---|
| `npm run lint` | PASS, no warnings (after the last change) |
| `npm run test:unit` | PASS, 129/129 (after the last change) |
| `npm run test:ci` (new temporary SQLite database: smoke, editor workflow, content model, SEO, publishing workflow, data dashboard, persistence after restart, redirects, WordPress import, forms, security) | PASS, every suite (after the last change); editor workflow includes the two new band checks |
| `npm run test:smoke`, `test:workflow`, `test:persistence` against a developer server on port 3000 | NOT RUN separately: no server was running on port 3000. The same three suites ran inside `test:ci` above |

## Browser acceptance checklist (Chrome, agent-executed)

Local container `wms-local` (`127.0.0.1:3042`), rebuilt from this branch. Window 1440 × 791.

| Check | Result |
|---|---|
| As a disposable **editor** (`node app @apostrophecms/user:add … editor`): Edit, select the hero, Styles shows "Band width" with its help text; choose "Full window width" | PASS: live preview runs edge to edge, the text lines up with the logo |
| Save; hero band 1430 px wide at x = 0 (window without scrollbar 1430) | PASS |
| Same for the orange feature grid in its Styles panel (with Background and Padding) | PASS: band edge to edge, cards at x = 131 like the page content |
| Draft not public: logged-out request for `/` before publishing has no `wms-band-full` | PASS (0) |
| First measurement of the draft: horizontal overflow | **FAIL**, found and fixed: the three full-width layouts overflowed by 67 px (`scrollWidth` 1497). Fixed with `width: auto` (design §9); re-measured after the image rebuild: PASS |
| Publish as the editor (Update) | PASS: "Your changes have been published" |
| Full band inside a layout column (disposable draft page) | PASS: stays column width (568 px), no breakout |
| Full-band layout with Width 50 % | PASS: core writes `width: 50%`; band stays 1430 px |
| Draft test page as a visitor | PASS: 404 |
| Visitor (logged out, no admin bar), 1440 px: 10 bands, all window width, content at the page's line (128 px), bands touch, `scrollWidth` = `clientWidth` | PASS |
| Visitor, 768 px and 375 px (same-origin iframes of that width; resizing the maximized window had no effect) | PASS: 10 bands at window width, no horizontal overflow, bands touch; content 24 px (hero) and 48 px (sections with 32 px Padding) from the screen edge |
| Visual check at 375 px | PASS: orange band edge to edge, cards inset |

## Implicit state review

- **Band width per widget** (content or full window): one style field in one place
  (`lib/band.js`); the default is content width, so stored widgets without the field are
  unchanged. No migration.
- **Page width known or not** (`has-wms-vw`): a full band needs it, as the slideshow does; without
  it the band is content width. One rule for both.
- **In `main` or in a layout column**: the breakout applies only directly in `main`; in a column
  the setting is ignored, and the help text says so. Checked in Chrome.
- **Full band and the layout's Width style**: the band wins (`min-width`); the help text says so.
  Not two competing rules.
- **Slideshow**: does not get the band style, so it never has two width options (Q3 a).

## Security observations

- No new endpoint, field type or input. The style is a select with two fixed values; core
  renders its value as a class only.
- Test editor password generated into the session scratch folder (outside the repository) and
  never written to a tracked file; the account is archived.

## Known limitations

- Below `--content-max-width` the editor's Padding adds to the side margin, so content in a band
  sits further in than the page's 16 px line (48 px with the home's 32 px Padding). Editors who
  want it closer reduce the side Padding.
- "Full window width" on a widget nested inside another widget (other than a layout column) is
  not covered; the five widgets with the style are placed in page areas or layout columns.
- The help text mentions the Width style on widgets that have none (hero, sections); harmless.

## Unresolved decisions

- D-CONTENT-24 Q4 / D-CONTENT-25 Q7: the default preset, now on the result with bands.

## Rollback guidance

Revert the branch's code commit. Stored `band` values stay on widgets and are ignored once the
style is removed; pages show content-width bands again.

## For the owner

1. Review the changes; approve commit, push and the PR.
2. Look at the home page in the container logged out (`http://127.0.0.1:3042/`) and choose the
   default preset (Global Styles → Theme).
3. After the release on OCI: set "Full window width" on the home sections there.

## Recommended next step

See the [m1-082 handoff](../../../../milestones/m1-082-handoff.md).

## Left over

- `wms-local` container: home page with ten published full-width bands; disposable page
  "m1-081 band test" archived (`/archive/0`); test editor archived (username renamed by core on
  archive). Local only.
- In Chrome, the admin was logged out on `127.0.0.1:3042` (needed for the editor and visitor
  checks); the admin session on `localhost:3042` is unchanged.
- Session scratch folder (outside the repository): the test editor's password.
