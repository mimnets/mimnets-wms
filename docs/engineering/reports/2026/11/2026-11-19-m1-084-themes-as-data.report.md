# m1-084 report: themes as data, and more presets

| | |
|---|---|
| **Task** | m1-084 (themes as data and more presets, from the [m1-084 handoff](../../../../milestones/m1-084-handoff.md) §4, scope confirmed by the owner) |
| **Date** | 2026-11-19 |
| **Scope** | Move the theme presets from hand-written Sass to data with a fixed shape, and add curated presets checked for WCAG AA. Not in scope: layout options (m1-085), templates (m1-086), AI (m1-087), the OCI site, WordPress |
| **Prompt** | [2026-11-19-m1-084-themes-as-data.prompt.md](../../../prompts/2026/11/2026-11-19-m1-084-themes-as-data.prompt.md) |
| **Design** | [m1-084 themes as data](../../../../milestones/m1-084-themes-as-data-design.md), decided by the owner (D-CONTENT-29): all recommendations |
| **Branch** | `feat/m1-084-themes-as-data` from `origin/main` at `f4b0849` (PR #102 merged), with `dc0ac38` (the core issue link, pushed after PR #102 merged) cherry-picked as `3e3b41d` at the owner's choice. The rest is not committed: commit, push and PR wait for the owner's approval |

## Requirements

- One theme = one object with a fixed shape; the select's choices and the CSS come from it.
- Classic, Quiet and Bold look as before; stored values keep working (the site's Bold), no migration.
- 12 presets (7 brand, 5 palette), each passing WCAG 2.2 AA; three more OFL fonts.
- Admins choose a preset; editors cannot.

## Work completed

- `lib/themes.js`: the shape (`themeFields`), `validateTheme`, `themeProperties`, `themeCss`, the
  approved `fonts`, and the 12 presets. Classic renders on `:root`, the others on `body.<class>`;
  every theme writes every property (`initial` where it uses the component's default).
- `lib/contrast.js`: WCAG contrast ratio.
- `modules/@apostrophecms/styles/index.js`: Theme choices built from `themes`; a public GET route
  `wms-themes` (text/css, one-year cache, URL versioned by a hash of the CSS); a `<head>` link
  added with `apos.template.prepend` through the component `wmsThemeStylesheet` (new JSX view).
- Sass: `_themes.scss` deleted; `_tokens.scss` keeps only the shared tokens; the component rules
  that were in `_themes.scss` are now token reads in `_type.scss`, `_wms.scss`, `_corporate.scss`,
  `_sections.scss`, `_slideshow.scss` (heading weight, tracking and line height, centred header,
  outline header button, footer band, card border and shadow, key figures, eyebrow tracking, button
  radius). Text uses of the primary colour read `--wms-color-primary-text`.
- Fonts: Inter, Lora, Space Grotesk `.woff2` files and OFL licences under `public/fonts/`,
  `@font-face` rules in `_fonts.scss`.
- `scripts/themes.test.mjs`: shape, unique names and classes, select choices, Classic/Quiet/Bold
  values, stylesheet structure, every contrast pair for every preset.
- Docs: design note (§10 as built), `design-tokens.md`, decision register, INDEX, this report, the
  prompt record, the [m1-085 handoff](../../../../milestones/m1-085-handoff.md).

Build changes from the design (details in the design's §10): `primaryText` added (found by the
browser check: Midnight's hero text was unreadable over a photo); `danger` became a theme field;
`eyebrowTracking`, `keyFigures`, `shadowTint` and a `subtle` card style express Quiet and Bold
exactly; Bold's alternate surface moved from `#eef1f8` to `#f0f3f9` because the test found the
card badge at 4.4999:1.

## Files changed

| File | Change |
|---|---|
| `lib/themes.js`, `lib/contrast.js` | new: theme data and contrast |
| `modules/@apostrophecms/styles/index.js`, `views/wmsThemeStylesheet.jsx` | choices from data; stylesheet route and link |
| `modules/asset/ui/src/scss/_themes.scss` | deleted |
| `modules/asset/ui/src/scss/_tokens.scss`, `_type.scss`, `_wms.scss`, `_corporate.scss`, `_sections.scss`, `_slideshow.scss`, `_fonts.scss`, `index.scss` | token reads, shared tokens only, new faces |
| `public/fonts/inter/`, `public/fonts/lora/`, `public/fonts/space-grotesk/` | new font files and OFL licences |
| `scripts/themes.test.mjs` | new unit test |
| `docs/milestones/m1-084-themes-as-data-design.md`, `docs/milestones/m1-085-handoff.md`, `docs/content/design-tokens.md` | design note, handoff, tokens guide |
| `docs/engineering/decision-register.md`, `docs/engineering/INDEX.md`, this report, the prompt record | records |

## Tests executed and actual results

| Command | Result |
|---|---|
| `npm run lint` | PASS, no warnings |
| `npm run test:unit` | First run of the new test: 1 failure (Bold card badge 4.4999:1, a real m1-074 defect), fixed in data. Final run on the final code: PASS, 142/142 |
| `npm run test:smoke` (developer server, port 3000) | Final run: PASS, 20/20. Earlier the same session: 20/20, then two back-to-back re-runs gave 19/20 (the failing check was not printed) and 15/20 (all five failures form checks answered 429 by the form rate limit, 10 per 15 minutes). The final run, after the window passed, is 20/20 |
| `npm run test:workflow` | Final run: PASS, 25/25 (saves Quiet, checks the public `<body>`, restores) |
| `npm run test:persistence` | Final run: PASS, 7/7 |

## Browser acceptance checklist (Chrome, agent-executed)

Developer server `127.0.0.1:3000` (restarted by the agent with the owner's approval, because
nodemon did not reload) and the rebuilt container `127.0.0.1:3042` (`kiri compose up -d --build`).

| Check | Result |
|---|---|
| Classic, Quiet and Bold, 1440 px: computed styles of 12 elements (body, h1–h3, header, footer, card, buttons, hero, eyebrow, menu link) on the new dev server against the old container build | PASS. Differences: body background transparent → white (invisible), footer shadow none → transparent (invisible), hero radius (the container's hero is in a full-width band, content not theme) |
| All 12 presets at 375, 768 and 1440 px (same-origin iframes, body class swapped): horizontal overflow | PASS, 0 px in 36 checks |
| Each preset loads its own body and heading face | PASS (computed `font-family` per preset) |
| Corporate, Editorial, Modern, Midnight, Forest, Ocean, Slate, Terracotta, Plum at 1440 px (screenshots) | PASS after the Midnight fix. First run: Midnight hero text dark on a dark overlay, FAIL; fixed with `primaryText`; re-checked PASS |
| Midnight bottom of page: form fields, submit, footer band | PASS |
| 375 px: Midnight with the mobile menu open, Terracotta hero, Modern cards | PASS (iframes; `resize_window` left the viewport at 1440 px, as in m1-083) |
| Admin: Global Styles → Theme → Midnight: live preview swaps the page at once; Update Global Styles; logged out `<body class="wms-theme-midnight">` | PASS |
| Admin: back to Classic through the same UI; logged out `<body>` without a theme class | PASS |
| Disposable editor (`m1084editor`, created with `@apostrophecms/user:add`): PATCH of the theme through the REST API | PASS, refused (404); public `<body>` unchanged |
| Container (release build): stylesheet route `text/css`, one-year cache, same hash as dev; Bold home and footer band as before; Manrope; no overflow; Inter file served | PASS |
| Editor Global Styles UI as a non-admin | NOT TESTED in the UI (the palette is hidden for editors since m1-022); the API refusal above covers the rule |
| Keyboard focus ring per preset | NOT TESTED on screen; colours checked by the unit test (3:1) |

## Implicit state review

| State | Found | Decision |
|---|---|---|
| Theme values in two places (`_tokens.scss` `:root`, `_themes.scss`) | Yes | One source: `lib/themes.js` |
| Theme names in two lists (select choices, Sass classes) | Yes | Choices built from `themes` |
| Derived tokens declared again per theme | Yes | `themeCss` writes resolved values |
| A theme's unset property inherits Classic's from `:root` | Would happen with partial blocks | Every theme writes every property; `initial` for "component default" |
| `primary` as both background and text colour | Implicit coupling, broke Midnight | `primaryText` (null = `primary`) |
| Stored theme class unknown (preset removed) | Renders as Classic | Kept; recorded in `lib/themes.js` |
| Cached theme stylesheet after a theme change | — | URL carries a hash of the CSS |
| Live preview needs every theme's CSS | — | All presets in the one stylesheet |
| Candidate, not changed: nodemon on this PC did not reload after file changes this session | Outside the task | Listed here only |

## Security observations

- New public GET route `/api/v1/@apostrophecms/styles/wms-themes`: no input is used, no user or
  document data; it returns the same CSS to everyone, built at start from code.
- No secret, no new package. Font files are OFL 1.1 data files from Fontsource 5.3.0 (jsDelivr),
  checked as `wOF2` files with their licence; they are served as static files.
- The disposable editor's password was generated at random, kept in the session scratch folder,
  and deleted after use.

## Known limitations

- Midnight changes the site's own colours only. Content colours chosen by editors (Background
  style, images, the demo notice) do not follow it; check pages before choosing it.
- Header layout and header button style are theme fields for now; m1-085 decides whether they
  become their own Global Styles fields.

## Unresolved decisions

None from this task.

## Rollback guidance

Revert the branch's commit. No data or migration involved: stored class values are unchanged. A
site that chose a new preset falls back to Classic after a rollback. Rebuild the container image.

## For the owner

1. Review the branch; approve commit, push and PR.
2. Optionally try the presets: Global Styles → Theme (admins).
3. On OCI after the release: Bold stays selected (unchanged class).

## Recommended next step

m1-085 (layout options) in a new Claude Code session: [m1-085 handoff](../../../../milestones/m1-085-handoff.md).

## Left over

- Local developer database: theme set to Midnight and back to Classic (as before). The editor
  `m1084editor` archived through the REST API.
- Container `wms-local`: rebuilt from this branch; content unchanged; Bold still selected.
- The developer server now runs from the agent's background shell (port 3000), not the owner's
  terminal.
