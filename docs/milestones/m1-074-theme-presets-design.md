# m1-074: theme presets from the owner's example sites (design)

| | |
|---|---|
| **Task** | m1-074 |
| **Date** | 2026-11-16 |
| **Author** | The agent (agent-executed; not a human approval) |
| **Status** | **D-CONTENT-23 decided 2026-11-16 by the owner: approved** ("approve"), with every recommended answer in §9. Built in m1-074; changes during the build in §10 |
| **Related** | [m1-074 handoff](m1-074-handoff.md) §2 · D-CONTENT-18 (design from example sites) · D-CONTENT-20 (themes as switchable presets, no demo content on production) · D-M0-11 (Global Styles for admins only) · [design tokens](../content/design-tokens.md) · [m1-073 rename design](m1-073-rename-design.md) (new `wms-` prefix) |

This is a paper task. No code was changed. The facts come from the repository at `54f010f`
(PR #90 merged) and `apostrophe` 4.34.0 in `node_modules`. The owner asked to run m1-074 in the
same Claude Code session as m1-073 follow-up work (AGENTS.md asks for a new session; the owner's
choice, recorded here).

## 1. The request and the limits

- D-CONTENT-18: the owner names example sites; the agent studies them read-only and proposes 2–3
  **original** directions. No copying of another site's look, text, images or logos.
- D-CONTENT-20: the directions become **theme presets**, switched by admins in settings; Global
  Styles stay for fine-tuning. No demo content on production.
- Limits: official Apostrophe APIs first; no new package; Community Edition only; WCAG 2.2 AA
  contrast for every preset; no change that breaks stored content; clean architecture.

Example sites given by the owner (2026-11-16): `asmaragroup.com` and `zxyinternational.com`.
Studied in Chrome at 1440 px, home page only, read-only (no cookie banner accepted, no forms).

## 2. What the example sites do (patterns, not looks)

| Pattern | asmaragroup.com | zxyinternational.com |
|---|---|---|
| Overall feel | Quiet, editorial, near-monochrome; lots of white space | Confident, bold, colourful; illustrated gradient background behind the hero and story sections |
| Type | One sans family, regular weight; headings in two weights on two lines (light word, then bold word); lowercase headings, uppercase small section labels | One rounded sans; very heavy, large headings (H1 64 px, 700); light body text at a large size |
| Colour | Greys and black; one natural accent used only for small marks (map dots, "+" links) | Dark navy surfaces, one warm orange accent (logo, heart, markers); white text on dark |
| Header | Centred logo above a horizontal text menu; small icon links at the right | Logo left, menu, then search, an outlined "Contact Us" pill and social icons at the right; a mega menu of product divisions and categories |
| Hero | Full-width photograph with a round white text badge | Headline and two paragraphs at the left, a 2×2 block of key figures in translucent cards at the right |
| Sections | Split image/text halves; 3-column icon + label + text grid; a world map of presence | Long full-width story sections; a certification logo strip; a 4-column footer |
| Buttons | Text links with a small "+" mark | Small rounded pills |
| Shape | Square corners, thin lines | Large radius cards and pills |

What this site already has for each pattern: split sections (layout widgets), 3-column grids
(feature grid), key figures (stats widget), full-width banners (hero, slideshow), certification
strip (gallery or organisations widget), product categories (division and category pages). So the
presets can be built from **tokens and component styles only**; no new widget is needed.

## 3. What is there today

| Fact | Where |
|---|---|
| Every colour, font, size, space and radius is a custom property in one file; project styles only read them | `modules/asset/ui/src/scss/_tokens.scss` (m1-020, m1-021) |
| Brand: navy `#212d68`, orange darkened to `#a85a00` for AA; Roboto self-hosted (400, 500, 700) | same, `_fonts.scss`, `public/fonts/roboto/` |
| Contrast checks for the tokens | `docs/content/design-tokens.md` |
| Global Styles (core `@apostrophecms/styles`) is admin-only (`editRole: 'admin'`, m1-022) | `modules/@apostrophecms/styles/index.js` |
| **Core supports a Global Styles `select` with `class: true`**: the value becomes a class on `<body>`, is stored on the global doc (`stylesClasses`), and the editor previews it live before publishing | `styles/lib/handlers.js` `mirrorToGlobal`, `TheAposStyles.vue` (`data-apos-body-styles-classes`) |
| The layout already passes `bodyClass` to the outer layout | `views/layout.jsx` |

## 4. Design summary

One **Theme** select at the top of Global Styles (admins only). Each value is a body class.
Each preset is one Sass block that overrides the existing tokens under that class, plus a small
number of component rules (header, buttons, headings, cards) that tokens alone cannot express.

```scss
// modules/asset/ui/src/scss/_themes.scss (new)
body.wms-theme-quiet {
  --assurer-color-primary: …;
  --assurer-font-body: …;
  --assurer-radius: 0;
  …
}
```

- Default (no value, or **Classic**) = today's look, unchanged. No migration; existing sites keep
  rendering exactly as now.
- The choice has drafts like any Global Styles change: preview, then publish. Logged-out visitors
  see only the published theme.
- Global Styles fine-tuning (sizes, widths, gaps) still applies on top of every preset.
- Brand stays: every preset keeps the Assurer navy and orange as its colour source; presets
  change how much and where they are used, plus type, space and shape.

## 5. The three presets (original directions)

**A. Classic** (default). Today's look. No change.

**B. Quiet** (informed by the editorial pattern; not its look).
- Near-white surfaces, charcoal text, navy only for headings and the footer; orange only for
  focus, small marks and the primary button.
- Larger, lighter headings (weight 400) with an optional bold second line via a rich-text style
  "Heading emphasis"; small uppercase eyebrows with letter spacing.
- More section space (`--assurer-space-section` 64 → 96 px on desktop), square corners, thin
  1 px rules, flat cards without shadow. Text-link buttons with an arrow mark.
- Header: centred logo above the menu on desktop; mobile unchanged.

**C. Bold** (informed by the confident pattern; not its look).
- Navy-dark surfaces for the header band, hero overlay and footer; white text; orange accent for
  buttons and figures.
- Heavy headings (weight 700), larger H1 scale (1.25 → 1.333 ratio), body at 400.
- Large radius (16 px cards, pill buttons), raised cards; the stats widget gets translucent cards
  when it sits on a dark section.
- Header: logo left, menu, the existing call-to-action as an outlined pill.

Each preset ships with a contrast table in `design-tokens.md` (AA for text, 3:1 for UI and
focus), checked before the build is reported done.

## 6. Fonts

Roboto stays for Classic. For a distinct type voice, B and C each need one more face. Options:

- **F1 (recommended):** two open-licence (SIL OFL) faces, self-hosted the same way as Roboto
  (woff2 files from Fontsource, latin subset, 2–3 weights each, about 25 KB per weight). No npm
  package; the file download needs the owner's approval. Proposed: **Source Serif 4** for Quiet
  headings (editorial, distinct from both example sites) and **Manrope** for Bold.
- **F2:** Roboto for all presets; the presets differ by weight, size, space, colour and shape only.
  No download, but B and C feel closer to Classic.

Only the active preset's font is used by the page, so visitors download one family.

## 7. Implicit state review (plan)

| State | Decision |
|---|---|
| Theme unset (every existing site) | Classic; no migration |
| Draft theme ≠ published theme | Core styles draft/preview; public pages use published `stylesClasses` only |
| Theme value removed in a later release | Unknown class → no rules → Classic; never a broken page |
| Global Styles values tuned for one preset, then the preset changes | Kept; they are sizes and widths, valid for all presets. Recorded in the editor help text |
| Editors | Cannot see or change the theme (Global Styles admin-only, D-M0-11) |

## 8. Architecture, files, tests

- `modules/@apostrophecms/styles/index.js`: add the `theme` select (`class: true`) in a new
  "Theme" group first in the panel. i18n keys under `project:`.
- `modules/asset/ui/src/scss/_themes.scss`: one block per preset; imported after `_tokens.scss`.
- `_fonts.scss` + `public/fonts/<face>/` with `OFL.txt` (F1 only).
- Small component rules in the existing partials, scoped by the theme class.
- `docs/content/design-tokens.md`: contrast table per preset.
- Tests: a smoke check that the published theme class reaches `<body>` for logged-out visitors;
  lint, smoke, workflow and persistence suites.
- Browser (agent-executed, Chrome, local): admin switches each preset, previews, publishes;
  logged-out view; editor cannot see the control; 1440/768/375 px with no sideways scroll;
  screenshots of the imported content in each preset under `evidence/m1-074/` for the owner.
- Showing the presets on the OCI site (D-CONTENT-18) happens after the release; the owner runs
  `deploy.sh`.

## 9. Decisions for the owner (D-CONTENT-23)

1. **Presets:** Classic (default), Quiet, Bold as in §5. *Recommended.* Or change, drop or add one.
2. **Fonts:** F1 (download two OFL faces, self-hosted) or F2 (Roboto only). *Recommended: F1.*
3. **Class prefix:** `wms-theme-*` (the final prefix from m1-073, so the stored value never needs
   a rename) or `assurer-theme-*`. *Recommended: `wms-`.*
4. **Header variants** (centred for Quiet, pill CTA for Bold) in m1-074, or tokens only first and
   header variants later. *Recommended: in m1-074.*

## 10. Changes during the build (m1-074)

- **No drafts for Global Styles (corrects §4 and §7).** Core `@apostrophecms/styles` is
  `autopublish: true` (`styles/index.js`): Save publishes at once. The preview is client-side, in
  the open panel, before Save; Cancel discards it. This is how every other Global Styles setting
  already works. The workflow test checks that a saved theme reaches the public `<body>` and that
  the original theme is restored.
- **No new rich-text style for two-weight headings.** In Quiet, headings are weight 400 and bold
  text inside a heading is 600, so editors make the two-weight line with the existing Bold button.
- **Bold keeps a white header.** The logo is a dark image and the mobile menu and submenus are
  white panels inside the header, so a navy header would hide the logo and need many resets. The
  navy band is on the footer; the header call to action is an outlined navy pill.
- **Labels in plain English**, like the other Global Styles fields, not `project:` keys.
- **Font weights:** Source Serif 4 400 and 600 (Quiet headings; body stays Roboto); Manrope 400,
  600 and 800 (Bold body and headings). Five files, 13–22 KB each.
