# m1-074 — Theme presets from the owner's example sites

| | |
|---|---|
| **Task** | m1-074 (the theme presets item in the [m1-074 handoff](../../../../milestones/m1-074-handoff.md) §2) |
| **Date** | 2026-11-16 |
| **Scope** | Study of the owner's two example sites; design note; three theme presets (Classic, Quiet, Bold) switched by admins in Global Styles; two self-hosted fonts; contrast table; a workflow test for the theme. Not in scope: new widgets, showing the presets on the OCI site (after release, owner) |
| **Prompt** | [2026-11-16-m1-074-theme-presets.prompt.md](../../../prompts/2026/11/2026-11-16-m1-074-theme-presets.prompt.md) |
| **Design** | [m1-074 theme presets design](../../../../milestones/m1-074-theme-presets-design.md), approved by the owner with every recommended answer in §9 (D-CONTENT-23); build changes in §10 |
| **Branch** | `docs/m1-074-theme-presets-design` from `origin/main` at `54f010f` (PR #90 merged). Not committed; commit, push and PR wait for the owner's approval |

Checks marked agent-executed were run by the agent. They are not human approval.

## Requirements

- D-CONTENT-18: study the owner's example sites read-only; propose 2–3 original directions; no
  copying of another site's look, text, images or logos.
- D-CONTENT-20: the directions as theme presets switched by admins; Global Styles stay for
  fine-tuning; no demo content on production.
- AGENTS.md: official APIs first, no new package, WCAG 2.2 AA, no stored-content break.

## Work completed

- **Study** (Chrome, read-only, home pages at 1440 px; no cookie banner accepted): patterns of
  asmaragroup.com (quiet, editorial, two-weight headings, one small accent, split sections) and
  zxyinternational.com (heavy headings, navy and orange, figures beside the headline, pill
  buttons, certification strip). Every pattern maps to an existing widget, so the presets are
  tokens and component styles only (design §2).
- **Theme select**: `theme` in `@apostrophecms/styles` (admin-only Global Styles, D-M0-11), core
  `class: true`, first tab "Theme". Values `''` (Classic), `wms-theme-quiet`, `wms-theme-bold`.
  Core puts the value on `<body>` through the global doc's `stylesClasses`.
- **Presets**: `modules/asset/ui/src/scss/_themes.scss`, imported last. Quiet: Source Serif 4
  headings at weight 400 (bold words 600), muted greys, square corners, more section space,
  centred logo above the menu on desktop. Bold: Manrope, heading weight 800 on a 1.333 scale,
  16 px radius, raised cards and key figures, header call to action as an outlined navy pill, a
  full-width navy footer band (no sideways scroll).
- **Fonts**: Source Serif 4 (400, 600) and Manrope (400, 600, 800), latin woff2 from Fontsource
  5.3.1 and 5.3.0 via jsDelivr, each with its `OFL.txt`; no npm package. Files checked as woff2
  before they were copied in. Source Serif's licence file carries Adobe's copyright line (the
  Fontsource copy had a generic one).
- **Contrast**: table for every new pair in `docs/content/design-tokens.md`; lowest 4.70:1.
- **Records**: design note, D-CONTENT-23, this report, prompt record, INDEX, m1-075 handoff.

## Files changed

| File | Change |
|---|---|
| `modules/@apostrophecms/styles/index.js` | `theme` select and "Theme" tab |
| `modules/asset/ui/src/scss/_themes.scss` | New: Quiet and Bold |
| `modules/asset/ui/src/index.scss` | Import `_themes` last |
| `modules/asset/ui/src/scss/_fonts.scss` | Five `@font-face` rules |
| `public/fonts/source-serif-4/`, `public/fonts/manrope/` | New: woff2 files and `OFL.txt` |
| `scripts/editor-workflow-test.mjs` | Theme check: save, public `<body>`, restore |
| `docs/milestones/m1-074-theme-presets-design.md` | New |
| `docs/content/design-tokens.md` | Theme contrast table, scale notes |
| `docs/engineering/decision-register.md` | D-CONTENT-23 |
| `docs/engineering/INDEX.md` | m1-074 row, next ID |
| `docs/milestones/m1-075-handoff.md` | New |
| Prompt record, this report | New |

## Tests executed and actual results

Dev server started by the agent in this session (`npm run dev`); nothing listened on port 3000
before it.

| Command | Result |
|---|---|
| `npm run lint` | PASS (no findings) |
| `npm run test:smoke` | PASS, 18/18 |
| `npm run test:workflow` | PASS, 18/18 (3 new theme checks). First run 18/19: the test expected a draft theme to stay private, but core Global Styles is `autopublish`; the test was corrected, not the code (design §10) |
| `npm run test:persistence` | PASS, 7/7 |
| `npm run test:unit` | PASS, 112/112 |
| `npm run test:security` | PASS, 65/65 |

Not run locally: `scripts/content-model-test.mjs` (CI only, needs a disposable database; it
covers "editor cannot change Global Styles"); hosted CI.

## Browser acceptance checklist (Chrome, agent-executed)

The owner logged in as admin in the agent's tab; the agent did not see the password.

| # | Check | Result | Notes |
|---|---|---|---|
| 1 | Admin opens Global Styles: "Theme" is the first tab; select shows Classic, Quiet, Bold; help text shown | PASS | Two clicks to the field (tab, then section), as core groups work |
| 2 | Choose Quiet: page previews it live before Save (serif headings, centred logo, square button) | PASS | Screenshot viewed |
| 3 | Cancel: page returns to Classic, nothing saved | PASS | Public `<body>` unchanged |
| 4 | Choose Bold, "Update Global Styles": logged-out request gets `<body class="wms-theme-bold">` | PASS | `fetch('/', {credentials: 'omit'})` |
| 5 | Mobile preview (core, 404 px) and tablet preview (core, 1014 px), Quiet and Bold: no element wider than the page | PASS | Core device preview, not real 375 and 768 px windows (the Chrome window would not resize) |
| 6 | Desktop 1440 px logged out, all three themes: fonts load, footer band full width, no sideways scroll | PASS | Class set in the page with JavaScript; check 4 shows Save sets the same class |
| 7 | Restore Classic through the panel; public `<body>` has no theme class | PASS | |
| 8 | Editor cannot see the Theme control | NOT TESTED in the browser | Same admin-only panel as before (m1-022 browser check); server-side refusal covered by the CI content-model suite |
| 9 | Draft/published isolation | Not applicable | Global Styles has no drafts (core `autopublish`); the preview before Save is the private step |

Screenshots were viewed, not saved under `evidence/`.

## Implicit state review

| State | Before | After |
|---|---|---|
| Theme unset (every site today) | — | Classic, no class, no migration |
| Choosing a theme | — | Live preview in the open panel; Cancel discards; Save is public at once (core, like every Global Styles setting); the help text says the other tabs apply on top |
| Unknown or removed value | — | No rules match, page renders as Classic |
| Fonts | Roboto always loaded | A face downloads only when the active theme uses it |
| Who can change it | — | Admins only (D-M0-11) |

Decision taken: keep core's immediate save rather than add a custom draft step. It matches the
other Global Styles settings, and the panel preview already gives a safe look before Save.

## Security observations

No endpoint, permission or form changed. The new field sits in an admin-only panel; its value is
limited to the three choices by core select validation, so no free text reaches the `class`
attribute. Fonts are served from this site; no third-party requests.

## Known limitations

- Real 375 and 768 px windows not checked; core's mobile (404 px) and tablet (1014 px) previews
  were. The tablet preview is above the 1024 px menu breakpoint by 10 px, so the Quiet centred
  header was seen only at 1440 px.
- Bold has a white header (design §10); a navy header needs a light logo file.
- Quiet's two-weight headings depend on editors using Bold inside a heading; there is no separate
  style.

## Unresolved decisions

None for m1-074. The owner's own look at the presets on the OCI site after the release remains
the business approval (D-CONTENT-18).

## Rollback guidance

Set Theme to Classic in Global Styles (instant). For the code, revert the commit; a stored theme
value then has no rules and renders as Classic.

## For the owner

1. Approve the commit, push and PR of `docs/m1-074-theme-presets-design`.
2. After the release and `deploy.sh`: on the OCI site, open Global Styles → Theme, preview Quiet
   and Bold on the imported content, and choose one (or keep Classic).
3. Still open: the local folder rename (m1-073 report, "For the owner" step 2); the slideshow
   check on the OCI site (m1-072).

## Recommended next step

`m1-075`, in a new session: [m1-075 handoff](../../../../milestones/m1-075-handoff.md).

## Left over

The dev server this session started on port 3000 (`npm run dev`). Global Styles on the local
database is back to Classic. No test accounts were created; the workflow suite uploaded its usual two test images per run.
