# m1-084: themes as data, and more presets (design)

| | |
|---|---|
| **Task** | m1-084 |
| **Date** | 2026-11-19 |
| **Author** | The agent (agent-executed; not a human approval) |
| **Status** | **D-CONTENT-29 decided 2026-11-19 by the owner: approved** ("approve"), every recommendation (Q1 a, Q2 as proposed, Q3 a, Q4 a, Q5 not now, Q6 keep, Q7 include). Built in m1-084; changes in §10 |
| **Related** | [m1-084 handoff](m1-084-handoff.md) §4 · [m1-074 theme presets design](m1-074-theme-presets-design.md) (D-CONTENT-23) · [m1-079 design](m1-079-theme-design-pass-design.md) (D-CONTENT-24) · [m1-080 design](m1-080-theme-follow-ups-design.md) (D-CONTENT-25) · [design tokens](../content/design-tokens.md) |

The facts come from the repository at `f4b0849` (PR #102 merged). The owner confirmed the scope
on 2026-11-19: themes as data and about 10–12 presets, design note first.

## 1. The request and the limits

The owner asked for more theme options, more layout options and templates, "as many themes as
possible", and later AI that suggests and creates themes and templates (handoff §2). This task is
the first step: make a theme **data with a fixed shape**, then add curated presets. Layouts
(m1-085), templates (m1-086) and AI (m1-087) follow, each with its own design note.

Limits: official Apostrophe APIs first; no new package; Community Edition only; stored values
keep working (the site's Bold choice, D-CONTENT-24 Q4); WCAG 2.2 AA for every preset; admins
only choose the theme (D-M0-11).

**This is a refactor of the m1-074 design** (AGENTS.md, clean architecture). It needs the owner's
approval before any code (Q1).

## 2. How themes work today

- Global Styles → Theme is a core `class: true` select (`modules/@apostrophecms/styles/index.js`)
  with three values: Classic `''`, `wms-theme-quiet`, `wms-theme-bold`. Core stores the chosen
  class on the global doc (`stylesClasses`) and puts it on `<body>`. In the Global Styles panel
  core swaps the body class in the browser for a live preview (`TheAposStyles.vue`), so the CSS
  for **every** theme must be on the page for editors.
- Classic is the `:root` tokens in `_tokens.scss`. Quiet and Bold are hand-written blocks in
  `_themes.scss` (147 lines). Each block does two different things:
  1. **Token overrides**: colours, fonts, radius, shadow, type scale, section space.
  2. **Component rules** tokens cannot express today: heading weight and letter spacing,
     uppercase eyebrows, button radius, card border or shadow, stats item style, header layout
     (Quiet centres the logo), header call to action as an outline pill, the navy footer band
     (Bold).
- Derived tokens (focus from accent, section space) are declared again in each block because a
  custom property resolves where it is declared (comment in `_themes.scss`).
- Contrast is checked by hand and recorded in `design-tokens.md` §3.
- Fonts: Roboto, Source Serif 4, Manrope, self-hosted (`_fonts.scss`, OFL). `@font-face` only
  downloads a face that a page uses, so an unused font costs nothing.

**Why this does not scale:** each new preset is new hand-written Sass with its own component
rules, a hand contrast check, and no way for code (a test, or later AI) to read or validate it.
Twelve presets this way would be about 600 lines of rules that nothing checks.

## 3. Design

### 3.1 One theme = one object with a fixed shape

A new file `lib/themes.js` holds:

- `themeFields`: the shape. Every field has a type and its allowed values (§3.2).
- `themes`: the presets, an ordered array of objects that fill every field.
- `validateTheme(theme)`: checks one object against `themeFields` (unknown field, missing field,
  value outside its allowed set, colour not `#rrggbb`). Used by the unit test now, and by the
  server when AI or an editor supplies a theme later (m1-087).
- `themeCss(themes)`: returns the CSS: Classic on `:root`, every other theme on
  `body.<class>`, every value resolved (no derived tokens, so the "declare again" rule goes away).

A small `lib/contrast.js` computes WCAG ratios (the relative luminance formula, about 15 lines,
no package). The test and later the server use it.

### 3.2 The token set (the shape)

| Group | Field | Type / allowed values | Today's equivalent |
|---|---|---|---|
| Colour | `primary`, `onPrimary`, `accent`, `onAccent` | `#rrggbb` | brand tokens |
| | `text`, `textMuted`, `surface`, `surfaceAlt`, `border`, `borderSubtle`, `borderStrong` | `#rrggbb` | neutrals |
| | `link`, `linkVisited`, `focus`, `selection` | `#rrggbb` | link and state tokens |
| | `overlay` | `#rrggbb` + opacity 0–100 | `--wms-overlay-dark` |
| | `footerBand` | `null` (plain footer) or `{ background, text, textMuted, link, focus }` | Bold's navy footer |
| Type | `fontBody`, `fontHeading` | one of the approved fonts (§3.4); heading may be `inherit` | font tokens |
| | `typeScale` | `1.25` or `1.333` (H1–H4 computed) | Bold's 1.333 |
| | `headingWeight` | 400, 600, 700, 800 | Quiet 400, Bold 800 |
| | `headingTracking` | −0.02 to 0.02 em | letter-spacing rules |
| | `eyebrowCase` | `none`, `uppercase` | Quiet's eyebrow rule |
| Shape | `radius`, `radiusSmall`, `buttonRadius` | 0–24 px; button also `pill` | radius tokens, Quiet's square button |
| | `shadow` | `none`, `soft`, `medium`, `strong` (tinted with `primary`) | `--wms-shadow-raised` |
| | `cardStyle` | `bordered`, `raised` | Bold's raised cards and stats |
| Space | `sectionSpace` | `compact` (48), `normal` (64), `airy` (64, 96 from 1024 px) | `--wms-space-section` |
| Chrome | `headerLayout` | `inline`, `centred` | Quiet's centred logo |
| | `headerCta` | `solid`, `outline` | Bold's outline pill |

Not in the shape (stay fixed in `_tokens.scss`): the spacing scale, `danger`, the notice colours,
breakpoints. They are semantics, not look.

**Component rules become token reads.** The rules in `_themes.scss` move into the component
partials as reads of new tokens, for example `font-weight: var(--wms-heading-weight)`,
`flex-direction: var(--wms-header-direction)` and a footer that paints its band from
`--wms-footer-bg` (transparent when `footerBand` is `null`). Enum fields that cannot be one
property become a token set by `themeCss` (for example `cardStyle: raised` sets
`--wms-card-border: transparent` and `--wms-card-shadow: var(--wms-shadow-raised)`).
`_themes.scss` is deleted; `_tokens.scss` keeps only the fixed tokens.

**Header layout and call to action overlap m1-085** (site-wide header and footer styles). This
task keeps them in the theme so Quiet and Bold look the same as today. m1-085 decides whether they
become their own Global Styles fields with a "Theme default" choice.

### 3.3 How the CSS reaches the page

The `@apostrophecms/styles` override (it already owns the Theme select) gets:

- the select's `choices` built from `themes` (label and class), so a new preset is one object,
  no second list;
- a GET route that serves `themeCss(themes)` (built once at start) as `text/css` with a one-year
  cache, versioned by a hash of the CSS, the same pattern core uses for the Global Styles
  stylesheet (`serveStylesheet` in `apostrophe/modules/@apostrophecms/styles/lib/methods.js`);
- a `<link rel="stylesheet">` to it in `<head>`, added with the official
  `self.apos.template.prepend('head', …)`.

All themes are always in that file, because the editor's live preview swaps the body class in
the browser. Size estimate for 12 themes: about 15 KB before compression, about 3 KB gzipped,
downloaded once and cached; a changed theme changes the hash and so the URL.

Rejected: (a) keep Sass and write the data as a Sass map with `@each`: no runtime part, but
JavaScript (the test, AI later) cannot read it; (b) a build step that writes Sass from the JS
file: a generated file in Git that can drift; (c) only the chosen theme per request: breaks the
live preview; (d) an inline `<style>` on every page: about 15 KB per page, not cached.

### 3.4 Fonts

The fonts are a fixed list (`fontBody` and `fontHeading` take only these). Today: Roboto,
Source Serif 4, Manrope. Twelve presets with three faces look alike in type. Q4 offers adding
up to three more OFL faces the same way as m1-074 F1 (self-hosted `.woff2` files under
`public/fonts/`, license file, no package): **Inter** (neutral sans), **Lora** (warm serif),
**Space Grotesk** (geometric display headings). Unused faces are never downloaded.

### 3.5 Classic, Quiet and Bold

Classic, Quiet and Bold become objects with today's values. **Class names stay**
(`wms-theme-quiet`, `wms-theme-bold`; Classic stays the empty value), so the stored choice and
the site's Bold keep working with **no migration**. A unit test compares the resolved tokens of
the three against today's values, and the browser check compares screenshots before and after.
An unknown stored value still renders as Classic (as today); a removed preset therefore falls
back to Classic, never to a broken page.

## 4. The presets (recommendation: 12)

The owner asked for "as many as possible". Recommended: **12 now**, because every preset adds a
browser check on every widget at three widths, and twelve already cover the useful range. The
data shape makes a thirteenth one object plus a passing test, so the number can grow later.

Two kinds, because mimnets-wms is a product and may run other sites (Q3):

**A. Brand presets** keep the Assurer navy `#212d68` and orange `#a85a00` (D-CONTENT-12), and
vary type, shape, space and surfaces:

| # | Name | Character |
|---|---|---|
| 1 | Classic | Today's default |
| 2 | Quiet | Today's: serif headings, square, airy, centred logo |
| 3 | Bold | Today's: heavy headings, 1.333 scale, navy footer band, raised cards. **The site's choice** |
| 4 | Corporate | Compact sections, small radius, bordered cards, weight 700 headings |
| 5 | Editorial | Serif headings and generous space, uppercase eyebrows, thin rules |
| 6 | Modern | Pill buttons, soft shadows, raised cards, centred header |
| 7 | Midnight | Dark surfaces (text `#e8ecf5` on `#0f1530`), orange `#ffb15c` accent. The riskiest: forms, images and every widget need a dark check |

**B. Palette presets** change the colours, for other sites and for a future brand change:

| # | Name | Primary / accent | Primary on white / accent on white / accent on alt |
|---|---|---|---|
| 8 | Forest | `#1f4d3a` / `#9a5b00` | 9.63 / 5.43 / 4.98 |
| 9 | Ocean | `#0f4c5c` / `#b4442c` | 9.51 / 5.52 / 5.00 |
| 10 | Slate | `#2b2f36` / `#1d5fbf` | 13.44 / 6.10 / 5.50 |
| 11 | Terracotta | `#5a2e1f` / `#8a5a00` | 11.38 / 5.93 / 5.38 |
| 12 | Plum | `#3d1f4d` / `#a0306a` | 13.99 / 6.72 / 6.03 |

The ratios were computed by the agent for these candidates (surface-alt per palette); Midnight's
main pairs are 15.17 (text), 9.54 (muted), 9.17 (link `#9db8ff`), 9.99 (accent). Final values
may move during the build; the test decides.

## 5. Contrast as a test, not a table

A unit test (`scripts/themes.test.mjs`, run by `npm run test:unit` and CI) validates every theme
with `validateTheme`, and checks every pair from `design-tokens.md` §3 for every theme: text pairs
4.5:1, large text and UI parts 3:1, footer band pairs when the band is on. A preset that fails
cannot merge. `design-tokens.md` §3 keeps the list of pairs and the rule, and points to the test
for the numbers (the per-preset table would be 12 × 16 rows that drift).

## 6. Editors and admins

- Admins choose a preset in Global Styles → Theme, as today. Editors see the result only.
- Per-token editing (an admin changes one colour of a preset) is **not** in this task (Q5). The
  shape makes it possible later as Global Styles fields or, with AI, as a "custom theme"
  (m1-087).
- The theme list stays in code (reviewed, tested), not in the database. m1-087 decides if
  AI-made themes become stored documents validated by the same `validateTheme`.

## 7. Implicit state review (plan)

| State | Decision |
|---|---|
| Chosen theme: one class on the global doc, draft and published (core) | Unchanged. Class names kept; no migration |
| Unknown or removed theme value | Renders as Classic (`:root`), as today. Recorded in `lib/themes.js` |
| Two sources of truth for theme values (`_tokens.scss` `:root` and `_themes.scss`) | **Removed**: `lib/themes.js` is the only source; `_tokens.scss` keeps only fixed tokens |
| Two lists of theme names (select choices and Sass classes) | **Removed**: choices are built from `themes` |
| Derived tokens declared twice per theme | **Removed**: `themeCss` writes resolved values |
| Live preview needs every theme's CSS | All themes in one cached stylesheet (§3.3) |
| Cached theme stylesheet after a theme change | URL carries a hash of the CSS, so a release with changed themes gets a new URL; no stale cache |
| Footer band on or off, header layout, button shape | Theme fields with fixed values; m1-085 may split header and footer out with a "Theme default" |

## 8. Tests and checks

- `npm run lint`, `test:unit` (new themes test), `test:smoke`, `test:workflow` (it already
  switches Quiet and Bold), `test:persistence`.
- Chrome, agent-executed, local dev **and** the container (m1-083 lesson):
  - Classic, Quiet and Bold before and after the refactor at 1440, 768, 375 px on home, a pattern
    page and a product page: same look (screenshots compared).
  - Each new preset: admin selects it in Global Styles (live preview changes), saves; logged out
    the published preset shows; patterns page widgets, forms, cards, stats, footer, mobile menu;
    no horizontal overflow; focus ring visible.
  - An editor (disposable account) cannot change the theme.
- After the build: set Bold back if a check changed it; archive the disposable editor.

## 9. Decisions for the owner (D-CONTENT-29)

| Q | Question | Options | Recommended |
|---|---|---|---|
| Q1 | Refactor themes to data (§3), deleting `_themes.scss` | a. yes · b. no, add presets as hand-written classes | **a** |
| Q2 | Token set (§3.2), including header layout and call to action for now | as proposed · changes | **as proposed** |
| Q3 | Presets | a. 12: 7 brand + 5 palette (§4) · b. brand presets only · c. a different count | **a** |
| Q4 | Fonts | a. add Inter, Lora, Space Grotesk (OFL, self-hosted files, no package) · b. the three we have | **a** |
| Q5 | Per-token editing by admins | not now (choose a preset only) · now | **not now** |
| Q6 | Class names of Quiet and Bold | keep (no migration) · rename | **keep** |
| Q7 | Midnight (dark theme) | include · leave out (smaller check) | **include** |

## 10. As built (m1-084)

Built after D-CONTENT-29. Changes from §3 to §8, found during the build:

- **`primaryText` added to the shape (§3.2).** Midnight first had a light `primary` so the menu
  stayed readable on the dark surface. The browser check showed the hero text (`onPrimary`, dark)
  unreadable over a photo with the dark overlay. `primary` is both a background (hero, skip link)
  and text on the surface (menu, brand, key figures, slideshow controls, light-overlay text); the
  new optional field `primaryText` (`null` = `primary`) is the text use. Midnight now has a
  mid-blue `primary` `#2c3f8f` with white text and `primaryText` `#c3d0ff`. The test adds the pair
  "hero text on the dark overlay".
- **`danger` is a theme field (§3.2 said fixed).** `#b02a37` fails on Midnight's dark surface;
  Midnight uses `#ff8a8a`. Only the notice colours and the spacing scale stay fixed.
- **Fields refined:** `eyebrowCase` became `eyebrowTracking` (eyebrows were already uppercase in
  every theme; Quiet only widened the letter spacing). `headingWeight` is `light`, `normal`,
  `heavy` (h1, h2–h3 and h4 weights as Classic, Quiet and Bold had them). `cardStyle` gained
  `subtle` (Quiet's thin border). `keyFigures` (`plain`, `accent`) and `shadowTint` were added
  to express Bold and Quiet exactly. `footerBand` is `{ background, text, focus }` (footer links
  already inherit the footer's colour).
- **Unset is `initial`.** Every theme writes every property; a property a theme does not use is
  `initial`, so the component's own fallback (today's Classic look) applies and nothing leaks from
  Classic on `:root` into another theme.
- **Bold's alternate surface `#eef1f8` → `#f0f3f9`.** The new contrast test found that the card
  badge (accent on the alternate surface) was 4.4999:1, under AA; m1-074 recorded the pair as not
  checked. The change is not visible.
- **Small look changes, on purpose:** the page `body` now has the surface colour as its
  background (needed for Midnight; white as before elsewhere); form fields take the surface and
  text colours; the form's submit button follows the theme's button radius (Quiet and the square
  presets had square buttons beside a round submit). The heading letter spacing of Quiet and Bold
  now also applies to h4.
- **Stylesheet route:** `GET /api/v1/@apostrophecms/styles/wms-themes?version=<hash>`, linked from
  `<head>` by the component `@apostrophecms/styles:wmsThemeStylesheet`
  (`modules/@apostrophecms/styles/views/wmsThemeStylesheet.jsx`). 25 KB for 12 themes, 2.3 KB gzipped.
- **Fonts:** Inter 400, 600, 700, 800; Lora 400, 600; Space Grotesk 500, 700 (Fontsource 5.3.0,
  latin, OFL 1.1, `public/fonts/<face>/OFL.txt`).

Implicit state review (§7), as built: unchanged, plus one row. `primary` had two jobs (a
background and a text colour on the surface), an implicit coupling that only shows on a dark
theme; `primaryText` makes it explicit, and `null` keeps every light theme on one value.
