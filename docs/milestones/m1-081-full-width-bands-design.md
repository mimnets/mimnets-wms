# m1-081: full-width bands (design)

| | |
|---|---|
| **Task** | m1-081 |
| **Date** | 2026-11-19 |
| **Author** | The agent (agent-executed; not a human approval) |
| **Status** | **D-CONTENT-26 decided 2026-11-19 by the owner:** all recommendations (Q1 a, Q2 a, Q3 a, Q4 a) |
| **Related** | [m1-081 handoff](m1-081-handoff.md) · [m1-080 theme follow-ups design](m1-080-theme-follow-ups-design.md) §2.3, §9 (D-CONTENT-25) · [m1-079 theme design pass](m1-079-theme-design-pass-design.md) (D-CONTENT-24) |

The facts come from the repository at `bad8ae7` (PR #98, m1-080, merged) and from Apostrophe
4.34.0 in `node_modules`. The owner chose "full-width bands" from the handoff (2026-11-19).

## 1. Problem

On the original site each section is a band of colour or photo across the whole window, with its
content kept at the page width. Here, since m1-080, a section takes a background, but the band
stops at the content width (`--content-max-width`) and, below that width, at the m1-079 side
margin. The home page therefore reads as a stack of boxes, not as bands.

## 2. Facts

- `.wms-main` is centred, `max-width: var(--content-max-width)`, with side padding
  `--wms-space-4` (m1-079), in `_wms.scss`. The header and footer share the same width.
- The core `background` and `padding` style presets write their CSS on the widget's **styles
  wrapper**: the `<div id="<styleId>" data-apos-widget-style-wrapper-for>` that core puts around
  every widget with `styles`. The selector is `#<styleId>` (an id), in
  `widget-type/index.js` (`rootSelector`).
- A style field with `class: true` adds its value as a class on the same wrapper. The project
  already uses this for the entrance animation (`lib/motion.js`, `entranceStyle`).
- The slideshow already breaks out to the full window (m1-072): `--wms-vw` from
  `page-width.js` (the width without the scrollbar; `100vw` scrolls sideways on Windows),
  `width: var(--wms-vw)` and negative margins, only inside `.wms-main`, not inside a layout
  column. Without the script it stays content width.
- The footer's navy band uses `box-shadow` plus `clip-path` (`_themes.scss`). That paints a flat
  colour only, not a photo or gradient.
- The hero paints its own background on `.wms-hero` (own image field, overlay, rounded corners),
  not on the wrapper.

## 3. Options

| | Approach | For | Against |
|---|---|---|---|
| **A** | A "Band width" style (content / full window) that adds a class on the styles wrapper; the wrapper breaks out like the slideshow, and the widget inside stays at page width | Reuses two existing patterns (class style, `--wms-vw` breakout); one shared definition; works with colour, gradient and photo; editors choose per section | CSS must handle the hero (own background) and layout columns |
| B | Make `main` full width and give every widget its own page-width container | No breakout | Touches every widget and template, every page type and the m1-079 margin; large regression risk; a refactor this task does not need |
| C | Footer trick (`box-shadow` + `clip-path`) on banded widgets | Pure CSS | Flat colour only; photos and gradients, which the original uses, stop at content width |

**Recommended: A.** It fits the current design; no refactor is needed first.

## 4. Design (A)

### A1. The style

`lib/band.js` exports `bandStyle`, shaped like `entranceStyle`: a select, `class: true`,
choices "Content width" (`''`, the default) and "Full window width" (`wms-band-full`), with help
text "The background runs edge to edge; the content stays at page width. Not in a layout
column." Labels in `project:` i18n keys (en, and the other locales the project has).

Added to `styles` of: `wms-feature-grid`, `wms-stats`, `wms-organizations`, the layout widget
(`@apostrophecms/layout-widget`, which the layout-3/4/6 starters extend) and `wms-hero` (Q2).
The slideshow keeps its own `width` field (Q3).

### A2. CSS (new partial `_bands.scss`)

- `.has-wms-vw .wms-main .wms-band-full`: `width: var(--wms-vw)`, margins
  `calc(50% - var(--wms-vw) / 2)`, as the slideshow does. `min-width: var(--wms-vw)` as well,
  so the layout widget's Width style (`#id { width: N% }`, which an id selector would otherwise
  win) cannot shrink a full band. The help text says Width does not apply to a full band.
- The widget inside the wrapper keeps the page's content line at every screen width:
  `margin-inline: max(var(--wms-space-4), (100% - var(--content-max-width)) / 2 + var(--wms-space-4))`.
  Its content therefore never touches the screen edge on phones. The editor's Padding style still
  adds on the wrapper, as now.
- Hero: inside a full band, `.wms-hero` loses its rounded corners and fills the band. Its
  `__inner` lines up with the page content.
- No breakout inside a layout column (`.layout-widget .wms-band-full` resets to content width),
  as for the slideshow. A full-width layout may contain sections; their own band setting is then
  ignored.
- Without `--wms-vw` (no script, or the editor's page dialog), the band stays content width, as
  today. Nothing breaks.
- Space between bands: Q1.

### B. Content (no code, local `wms-local` container only)

Set "Full window width" on the home page's hero and its colour and photo bands, as on the
original. Nothing on OCI. The owner repeats it there after release.

## 5. Out of scope

`main`'s width and the m1-079 side margin (unchanged), the slideshow's width field, new background
options, light text on dark photos (D-CONTENT-25 Q3), the menu, OCI, WordPress.

## 6. Implicit state review (plan)

| State | Decision |
|---|---|
| Band width per widget: content or full window | One style field, one class, one place (`lib/band.js`); default content, so existing pages do not change |
| Page width known (`has-wms-vw`) or not | Full band only when known; otherwise content width (same rule as the slideshow) |
| Widget in `main` or in a layout column | Breakout only directly in `main`; in a column the setting is ignored, and the help text says so |
| Full band vs the layout widget's Width style | Full band wins (`min-width`); help text says so. Not two competing rules |
| Two width options on the slideshow (own field, and band) | Avoided: the slideshow does not get `bandStyle` (Q3) |

## 7. Tests

- `npm run lint`, `test:unit`, `test:smoke`, `test:workflow`, `test:persistence`.
- Unit: `bandStyle` choices and `class: true`; each listed widget has it in `styles`.
- Smoke or workflow: a published page with a full-band feature grid renders the
  `wms-band-full` class on the wrapper for a logged-out visitor.
- Chrome (agent-executed, local container), as a disposable **editor**: set "Full window
  width" with a photo background on a feature grid, publish, check logged out on
  `127.0.0.1:3042`. At 1440, 768 and 375 px: the background reaches both window edges, the
  content lines up with the header and footer, no horizontal overflow
  (`scrollWidth == clientWidth`). Also: hero full band; a full-band layout with its Width at 50 %;
  a full-band section inside a layout column stays content width; an unpublished change stays
  hidden from visitors.

## 8. Decisions for the owner (D-CONTENT-26)

| Q | Question | Options | Recommended |
|---|---|---|---|
| Q1 | Space between two full bands next to each other | a. none, they touch, as on the original · b. keep the normal section space | **a** |
| Q2 | Hero gets the option too | a. yes (the original's hero is full width) · b. sections and layouts only | **a** |
| Q3 | Slideshow | a. keep its own width field (no change) · b. replace it with the shared style (needs a migration of stored values) | **a** |
| Q4 | Build scope | a. A + B in the local container · b. A only | **a** |

## 9. As built (m1-081)

- **A1** as designed: `lib/band.js` (`bandStyle`), on the feature grid, stats, organizations,
  hero and layout widgets; four `project:` keys in `en.json`. The slideshow is unchanged (Q3 a).
- **A2** as designed, in `_bands.scss`, plus `width: auto` on the band's child. Core gives the
  layout grid `width: 100%`, so with the side margins the three full-width layouts overflowed the
  window by 67 px (seen in Chrome). Core writes the layout's Width style in a `#id` rule, not inline;
  `min-width` still keeps a full band at the window width (checked with Width 50 %).
- On wide screens the content of every band lines up with the header and footer. Below
  `--content-max-width` the editor's Padding adds to the side margin: sections with 32 px Padding
  sit 48 px from the screen edge, the hero 24 px (its own padding). Nothing touches the edge.
- Bands next to each other touch (Q1 a): `display: flow-root` keeps the section's own margins
  inside the band, and the hero loses its bottom margin in a band.
- **B** in the `wms-local` container only: the home page's hero and its nine colour and photo
  sections set to "Full window width" and published (the hero and the first section in the Styles
  panel, the rest through the REST API in the same editor session). The wall-logo image, the
  contacts layout without a background and the second hero stay content width.
