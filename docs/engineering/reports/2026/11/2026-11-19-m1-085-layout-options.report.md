# m1-085 report: layout options

| | |
|---|---|
| **Task** | m1-085 (layout options, from the [m1-085 handoff](../../../../milestones/m1-085-handoff.md), scope confirmed by the owner: full scope) |
| **Date** | 2026-11-19 |
| **Scope** | Header and footer style in Global Styles, content width, section layouts (split media and text, offset grids). Not in scope: page templates (m1-086), AI (m1-087), the OCI site, WordPress |
| **Prompt** | [2026-11-19-m1-085-layout-options.prompt.md](../../../prompts/2026/11/2026-11-19-m1-085-layout-options.prompt.md) |
| **Design** | [m1-085 layout options](../../../../milestones/m1-085-layout-options-design.md), decided by the owner (D-CONTENT-30): "proceed", recorded as approval of every recommendation |
| **Branch** | `feat/m1-085-layout-options` from `origin/main` at `b02b12e` (PR #104 merged). Not committed: commit, push and PR wait for the owner's approval |

## Requirements

- Header style and footer style in Global Styles, with "Theme default"; an explicit choice wins
  over the theme, one owner at a time; no migration; the site keeps its look.
- A footer band on any theme, in theme colours that pass AA on every preset.
- Content width: no new control; help text on Content Max Width.
- Section layouts with the core layout widget: three patterns (split image left, split image
  right, offset grid) and a Stagger style.

## Work completed

- `lib/themes.js`: `headerProperties()` and `footerProperties()`, the one mapping from a header
  layout or footer band to custom properties, used by every theme and by the new `overrides`
  (Header Style, Footer Style). Every theme writes `--wms-footer-band-bg/-text/-focus` (its own
  band, or `primary` / `onPrimary`). `themeCss()` writes the override rules after every theme
  rule.
- `modules/@apostrophecms/styles/index.js`: `headerStyle` and `footerStyle` selects (core
  `class: true`, choices from `overrides`, "Theme default" first), in Layout → "Header and
  Footer"; help text on Content Max Width.
- `lib/stagger.js` and `_stagger.scss`: the Stagger style on `@apostrophecms/layout-widget` (and
  `layout-3/4/6`, which extend it): desktop only, every second column down by half the section
  space. i18n keys `project:stagger*`.
- `modules/wms-patterns/lib/patterns.js`: patterns "split, image left" (5 + 7 columns), "split,
  image right" (7 + 5, text first on a phone) and "offset grid" (columns 2–6 and 7–11); story band
  uses the same helpers (same output). Column helper sets `showTablet` and `showMobile` (below).
- Tests: `scripts/themes.test.mjs` (override rules after every theme, select choices match
  `overrides`, an override writes the same properties as a theme with that choice, Classic's band
  fallback, footer band contrast for every preset); `scripts/patterns.test.mjs` (9 patterns;
  columns inside the grid, no overlap, visible on every device).
- Docs: design note (§9 as built), decision register (D-CONTENT-30), `design-tokens.md`, INDEX,
  this report, the prompt record, the [m1-086 handoff](../../../../milestones/m1-086-handoff.md).

**Defect found and fixed for new seeds (m1-079):** core's boolean `convert` turns a missing
`showTablet` / `showMobile` into `false`, ignoring `def: true`. Every seeded pattern column, the
m1-079 story band included, rendered `data-visible-tablet="false"` and `data-visible-mobile="false"`,
so the layout's content disappeared below desktop width (seen in core's mobile preview). The
pattern helper now sets both to `true`. Pages already seeded, and sections editors pasted from
them, keep the stored `false`. The owner chose the recommended repair (2026-11-19, "go with your
recommendations"): the migration `wms-show-pattern-columns` (`modules/@apostrophecms/migration`,
helper in `lib/show-pattern-columns.js`, unit-tested) shows columns hidden on both tablet and phone
on pages under `/patterns/` only, every mode, archived too. On other pages it changes nothing and
logs each page that has such columns, for a person to check (a section pasted from a pattern keeps
them; elsewhere hiding may be deliberate). Old versions are not changed.

**Migration run, in order (actual):** (1) the running developer server's nodemon restarted when the
migration file was saved and ran it on the local developer database **before** the test on a
copy, against the rule "tested on a copy first". The local database is not shared and only the
four pattern pages qualified; after the run they show their columns and no other page has hidden
columns. (2) Test on a copy of `data/m1-079-audit.db` (made with SQLite `VACUUM INTO`, run with
`APOS_DB_URI` pointing at the copy): before, story band 2 hidden columns and the home page
(draft and published) 4; after, story band shown, the home page unchanged and listed in the log;
the copy was deleted afterwards. Lesson: stop or pause the developer server before adding a
migration.

## Files changed

| File | Change |
|---|---|
| `lib/themes.js` | header and footer mapping, `overrides`, band colour properties, overrides last in `themeCss` |
| `lib/stagger.js`, `modules/asset/ui/src/scss/_stagger.scss`, `modules/asset/ui/src/index.scss` | new Stagger style |
| `modules/@apostrophecms/styles/index.js` | Header Style, Footer Style, group, Content Max Width help |
| `modules/@apostrophecms/layout-widget/index.js` | Stagger style added |
| `modules/@apostrophecms/i18n/i18n/project/en.json` | `stagger`, `staggerHelp`, `staggerOff`, `staggerOn` |
| `modules/wms-patterns/lib/patterns.js` | three patterns, helpers, column visibility |
| `modules/@apostrophecms/migration/index.js`, `lib/show-pattern-columns.js`, `scripts/show-pattern-columns.test.mjs` | migration `wms-show-pattern-columns` and its test |
| `scripts/themes.test.mjs`, `scripts/patterns.test.mjs` | tests |
| `docs/milestones/m1-085-layout-options-design.md`, `docs/milestones/m1-086-handoff.md`, `docs/content/design-tokens.md` | design note, handoff, tokens guide |
| `docs/engineering/decision-register.md`, `docs/engineering/INDEX.md`, this report, the prompt record | records |

## Tests executed and actual results

| Command | Result |
|---|---|
| `npm run lint` | PASS, no warnings (final code, with the migration) |
| `npm run test:unit` | PASS, 147/147 (final code, with the migration) |
| `npm run test:smoke` (developer server, port 3000) | First run after the build: PASS, 20/20. Run on the final code: 19/20, then 15/20 on an immediate re-run: all five failures were form checks answered 429 by the form rate limit (10 per 15 minutes; the m1-084 lesson). Re-run after the window: PASS, 20/20 |
| `npm run test:workflow` | PASS, 25/25 (after the build, on the final code, and after the migration) |
| `npm run test:persistence` | PASS, 7/7 (after the build, on the final code, and after the migration) |
| `npm run test:smoke` after the migration | 19/20: one form check answered 429 (rate limit). Re-run after the window: PASS, 20/20 |

The developer server reloaded by itself this time: the served theme stylesheet hash (`228fa09316cf`)
matched the hash of the new code.

## Browser acceptance checklist (Chrome, agent-executed)

Developer server `127.0.0.1:3000`. The container was not rebuilt (see Not tested).

| Check | Result |
|---|---|
| New CSS served: theme stylesheet hash matches the code; Stagger rule in the page styles | PASS |
| Header and footer overrides, logged out, 1440 px: body classes set by script (simulation, not the Global Styles UI) on Classic, Quiet, Bold, Midnight, Ocean; computed header direction and footer colours | PASS. Quiet + inline → row; Classic + centred → column; Bold + plain → no band; Classic + band → navy `#212d68` band, white text; Ocean + band → its primary `#0f4c5c`; Bold default band unchanged (`#172152`) |
| Same combinations at 768 and 375 px (same-origin iframes): overflow and header | PASS: no horizontal overflow; centred header stays desktop only, as designed |
| Screenshots, Classic with centred header and band footer, 1440 px | PASS: logo above the menu; full-width navy footer, readable |
| Editor (disposable `m1-085-editor`): opens the offset grid pattern (draft), sets Stagger in the layout's Styles panel (label and help shown), saves, previews | PASS: second column lower; value kept after save and re-open; set back to Off afterwards |
| Stagger measured at 1440 px on a published layout (`/test`, class set by script) | PASS: second column 24 px lower (half of Classic's 48 px) |
| Split image left, split image right, offset grid, desktop 1440 px (editor, draft) | PASS: 5 + 7, 7 + 5, columns 2–6 and 7–11 |
| Split image right on a phone, core mobile preview (editor) | FAIL as seeded: layout content hidden (the m1-079 visibility defect above). With the visibility set by script (simulation): text first, then image, full width; PASS for the order |
| Editor cannot change Global Styles: palette hidden; PATCH of `headerStyle` through the REST API | PASS: no palette button; refused (404); value unchanged |
| Pattern drafts not public: `/patterns/offset-grid` logged out | PASS: 404 (403 with `aposMode=draft`) |
| Admin Global Styles UI (Header Style, Footer Style, live preview, save, published result logged out) | First NOT TESTED: the agent's read of the admin test credentials was refused by the tool's permission check. Then the owner signed in as admin in Chrome; the agent did not handle the password. PASS: Layout → Header and Footer shows both selects on "Theme default"; on Ocean, "Logo above the menu" and "Coloured band" change the live preview (header column, footer `#0f4c5c`); saved; values kept on re-open; logged-out `<body>` has `wms-theme-ocean wms-header-centred wms-footer-band` and no user data; set back to "Theme default", saved, logged-out `<body>` is `wms-theme-ocean` again |
| Container (`kiri compose up -d --build`) | NOT TESTED this task |

## Implicit state review

| State | Found | Decision |
|---|---|---|
| Header layout and footer band owned by the theme and, now, by Global Styles | Two possible owners | One rule: an explicit choice wins, `''` ("Theme default") uses the theme; in the help text and `lib/themes.js`; enforced by rule order, unit-tested |
| New fields absent on stored docs | Read as `''` (checked on the local styles doc) | Theme default; no migration |
| Theme changed while an override is set | — | Override stays (explicit choice) |
| Band on a theme without band colours | — | `primary` / `onPrimary`, tested for every preset |
| Header and footer mapping written twice (theme, override) | Would happen | One pair of functions |
| Override choices listed twice (select, CSS) | Would happen | Both built from `overrides` |
| Seeded column visibility | Implicit default resolved to "hidden" by core's `convert` | Stated in the pattern data; unit test. Stored pages: owner decision |
| Stagger with columns dragged out of document order | — | Follows document order; help text says so |
| Candidate, not changed: core's boolean `convert` ignores `def` | Core behaviour | Recorded; may be worth a core issue (owner's choice) |

## Security observations

- No new route, endpoint or upload. Two new Global Styles fields: admin-only (existing
  `editRole`/`publishRole`); an editor's PATCH was refused. Select values are laundered by core
  against their choices.
- No secret or new package. The disposable editor's password was generated at random, kept in
  the session scratch folder (outside the repository) and deleted after use.

## Known limitations

- Sections pasted from a pattern into other pages keep hidden columns on tablets and phones; the
  migration lists them but does not change them. Old versions of pattern pages also keep them.
- Stagger counts columns in document order, not screen order.
- The centred header applies from 1024 px, as before.

## Unresolved decisions

- Customised themes: before templates (m1-086), after them, or with AI (m1-087). The agent gave
  no recommendation on the order; the owner decides at the next handoff.

## Rollback guidance

Revert the branch's commit. The migration's changes stay (columns shown on pattern pages; to
hide them again, use each column's Styles). The new Global Styles fields are ignored after a
rollback (their classes have no rules), the Stagger class has no rule, and the three new pattern
pages stay as drafts (archive them if wanted). Rebuild the container image.

## For the owner

1. Review the branch; approve commit, push and PR.
2. Before the release on the container and OCI: back up the database and media (the migration
   runs at start). After start, read the log line `wms-show-pattern-columns`; for each page it
   lists, open the page in core's mobile preview and turn "Show on tablet/mobile" back on for
   sections that should show. The m1-079 audit copy lists the home page, so the home proof on the
   container or OCI probably has hidden columns.

## Recommended next step

**The owner's question: can admins edit a theme, and how would it be saved?** Today, no: admins
choose a preset (D-CONTENT-29 Q5, "not now"); the other Global Styles fields apply on top of any
preset. m1-084 made themes data with a fixed shape partly so this becomes possible. Recommended
shape for a later task (design note and owner approval first; it makes the theme stylesheet
depend on database content):

- **Customise = copy, never edit a preset in place.** Presets are code, reviewed and
  contrast-tested; an edit in the database would be lost or diverge at the next release.
- **Stored as an admin-only piece type** (for example `wms-theme`), started from a preset, with the
  same fields as `themeFields`, edited with core field types (colour, select, range), draft and
  published like other content so it can be previewed before use.
- **Validated on the server:** `validateTheme()` plus the contrast pairs now in the unit test
  (moved into `lib/`), so a theme under WCAG AA cannot be saved.
- **Name: human, editable, unique; ID: random and hidden.** The admin sees "Ocean (customised)" by
  default and can rename it; the stored class is built from the document's ID
  (`wms-theme-custom-<id>`), so a rename never needs a migration. A random visible name is hard
  to tell apart in the Theme list and in history.
- **The stylesheet** includes published custom themes and is rebuilt on save (new hash, new URL).
- **A custom theme in use cannot be archived** (otherwise the site falls back to Classic without
  warning).
- m1-087 (AI) would produce the same object as a draft custom theme.


m1-086 (templates) in a new Claude Code session:
[m1-086 handoff](../../../../milestones/m1-086-handoff.md).

## Left over

- Local developer database: the "Patterns (do not publish)" page and 9 pattern drafts created by
  the seed (they were not in this database before); the offset grid draft edited (Stagger on,
  then Off: same content, a new draft revision). Disposable editor `m1-085-editor` archived through the REST API in the
  owner's admin session (core renamed it with its `deduplicate-…` prefix); not deleted. Global
  Styles as the owner left them: Ocean (set by the owner before the admin check), both new fields
  "Theme default".
