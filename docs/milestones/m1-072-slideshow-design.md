# m1-072: the slideshow upgrade, with image and text animation (design)

| | |
|---|---|
| **Task** | m1-072 |
| **Date** | 2026-11-12 |
| **Author** | The agent (agent-executed; not a human approval) |
| **Status** | **D-CONTENT-22 decided 2026-11-12 by the owner: approved** ("approve"), with every decision in §11 as the agent chose it. Built in m1-072; changes during the build in §12 |
| **Related** | [m1-072 handoff](m1-072-handoff.md) §2 · [m1-071 design](m1-071-layout-columns-design.md) §12 (animation moved here) · m1-069 prompt record (the owner's slider request) · [editorial requirements](../content/editorial-and-design-requirements.md) §6 (motion, keyboard) · D-CONTENT-21 |

This is a paper task. No code was changed. The facts come from the repository at `63e691f`
(PR #88 merged) and `apostrophe` 4.34.0 in `node_modules`.

## 1. The request and the limits

The owner's words (m1-069 and m1-071 records):

1. "need to have more control and design options for slider … now the slider is very simple and
   general". Main use: "full-width banner with headlines and buttons, like a hero and please also
   consider other options too."
2. Image and text animation, "with the slideshow upgrade".

Limits: official Apostrophe APIs first; no new package (animation libraries declined on
2026-10-29: GSAP licence, Lenis scrolling); Community Edition only; clean architecture;
`prefers-reduced-motion` respected and no auto-moving text (editorial requirements §6); no
change that breaks stored content.

## 2. What is there today

| Fact | Where |
|---|---|
| A slide is an image (required, alt text required by `sanitize`) and a plain caption. Up to 12 slides | `modules/assurer-slideshow-widget/index.js` |
| Widget options: autoplay (default on) and 3 to 30 seconds per slide | same |
| Fixed look: 16:7 track inside the content width, fade between slides, caption bar at the bottom, ‹ dots › below the image | `views/widget.jsx`, `_assurer.scss` |
| Slides are stacked with `position: absolute` in a fixed 16:7 box, so the box cannot grow for text. At 375 px it is about 150 px high | `_assurer.scss` |
| Player: arrows, dots, ← → keys; autoplay stops under reduced motion, on hover and on focus inside (m1-066 "holds" set); the old timer stops when the widget is re-rendered | `ui/src/index.js` |
| **No visible pause control** (fails WCAG 2.2.2, Pause, Stop, Hide) | same |
| Hidden slides get `aria-hidden="true"` but stay focusable. Today they only hold an image; with buttons on slides, Tab would reach the links of hidden slides | same |
| Autoplay continues when the slideshow is scrolled out of view or the tab is hidden | same |
| No swipe on touch screens | same |
| The hero: eyebrow, a rich-text area (H1, H2 or paragraph) edited in place, background image, overlay (dark, light, none), up to 2 buttons (`linkFields()` plus a style) | `modules/assurer-hero-widget/` |
| The slideshow is allowed in page `main` areas only ("page only until the slideshow upgrade") | `lib/area.js` |
| Tests that touch the slideshow: smoke (3 slides render), content model (alt text refused), area lists (not in columns) | `scripts/smoke-test.mjs`, `scripts/content-model-test.mjs`, `scripts/area.test.mjs` |

**Core 4.34, checked:**

- No animation feature: the style presets are `width`, `alignment`, `padding`, `margin`,
  `border`, `boxShadow`, `background` and `layoutGap` (`styles/lib/presets.js`).
- The styles API accepts a **custom select with `class: true`**: the chosen value becomes a class
  on the widget's styles wrapper (`styles/ui/apos/universal/render.mjs`, `applyFieldClass`). That
  is the official way to give editors an "Entrance animation" choice. No custom field type and no
  custom editor UI are needed.
- **A styles wrapper changes the markup.** Core wraps a widget in an extra `<div>` only when its
  module has styles (`widget-type/index.js`, `hasStyles && stylesWrapper !== false`). Adding a
  style to every widget would add a `<div>` around all of them, including product cards inside
  the product grid, rich text inside the hero, and form fields. §7 limits the style for that reason.
- No core carousel or slideshow widget exists to reuse.

## 3. Summary of the design, and the scope decisions

The agent decided the scope, as the owner asked. **Build in m1-072:**

1. **Accessibility first** (§4): a pause/play button; hidden slides made `inert`; autoplay pauses
   off-screen and in a hidden tab; a visitor's pause sticks; announcements only while paused.
2. **Banner slides** (§5): each slide may have an eyebrow, a heading with a chosen level, a short
   text, up to 2 buttons, text position and overlay. A slide without text stays an image slide,
   as today. One shared definition for the buttons, used by the hero too.
3. **Slideshow display options** (§6): height, width (content or edge to edge), transition (fade
   or slide), image effect (none or slow zoom), text entrance, which controls show. Swipe on touch
   screens.
4. **Entrance animation for sections and layouts** (§7): a "Entrance animation" style (none,
   fade in, rise) on layouts, layout columns and the Assurer section widgets, through the core
   styles API. One small observer script. Off under reduced motion and while editing.
5. **The slideshow in layout columns** (§8), not in nested columns.

**Not now, with the reason** (they can be separate tasks later):

| Idea | Why not now |
|---|---|
| **Testimonial slides** | No testimonial content exists. It needs a piece type (quote, name, role, photo, consent) and an amendment of the content model (ADR-0003). Worth a task when the owner has real quotes |
| **Logo or partner strip** | The organizations widget already shows logos as a grid. A moving logo strip is auto-moving content (WCAG 2.2.2 again) and adds little over a grid |
| **Video slides** | Large files on every page view, and every video needs captions (editorial §6). The core video widget already covers video on a page |
| **Several slides in view at once (card carousel)** | A grid shows everything without clicking and reads better on every device; the grids now fit columns (m1-071) |
| **Thumbnail navigation, progress bar, fullscreen** | Small value for a banner; the gallery widget has a lightbox for photo sets |
| **Options for the hero** (text position, height) | Minimal change. The hero keeps its fields; it only takes its buttons from the shared definition (§9) and gets the entrance animation (§7) |

Stored content does not change: every new field is optional and the template's default for a
missing value is today's look. No migration.

## 4. Accessibility and control (fix first)

Following the WAI-ARIA Authoring Practices carousel pattern:

- **Pause/play button**, the first control in the slideshow (before previous/next), shown
  whenever autoplay is on and there are 2 or more slides. Its label changes between
  "Pause slideshow" and "Play slideshow"; the icon changes with it.
- **A visitor's pause sticks.** Today the "holds" set restarts autoplay when the pointer leaves or
  focus moves out. A `user` hold is added that only the Play button releases.
- **Reduced motion:** the slideshow starts paused, with the Play button shown, so a visitor can
  choose to play it. Transitions and the slow zoom are off; slides change instantly.
- **Off-screen and hidden tab:** two more holds, from an `IntersectionObserver` and the
  `visibilitychange` event. Nothing moves where nobody looks.
- **Hidden slides are `inert`**, so Tab never reaches a hidden slide's buttons and screen readers
  skip them.
- **Announcements:** the track has `aria-live="off"` while playing and `"polite"` while paused,
  so a screen reader announces a slide changed by the visitor but is not interrupted every few
  seconds.
- **Keyboard:** ← → as today (when focus is inside the slideshow); all controls are buttons with
  visible focus.
- **Swipe:** pointer events (left/right over a 40 px threshold); `touch-action: pan-y` so
  vertical page scrolling still works. No library.
- **While editing** (edit mode for logged-in editors) autoplay starts paused, so a slideshow does
  not move under the editor's hand; preview mode shows the real behaviour.

## 5. Banner slides

New optional fields on each slide (the image stays required, with alt text):

| Field | Type and choices | Default |
|---|---|---|
| Eyebrow | string, short label above the heading | empty |
| Heading | string | empty |
| Heading level | select: H1, H2, H3, Paragraph (bold, not a heading). Shown when there is a heading | H2 |
| Text | string, `textarea`, max about 300 characters | empty |
| Buttons | array, max 2: `linkFields()` plus style (primary, outline): the **shared** definition, §9 | none |
| Text position | two selects: across (left, centre, right) and down (top, middle, bottom) | left, middle |
| Overlay | select: dark, light. Applies only when the slide has text | dark |
| Caption | string, as today: the caption bar at the bottom | empty |

Decisions:

- **Plain fields, not a rich-text area.** The hero edits its heading in place in a rich-text area.
  In a slideshow only one slide shows at a time, so in-place editing of hidden slides would be
  awkward. Plain fields in the slide dialog also let the template control the heading level and
  the markup.
- **One H1 per page:** H2 is the default. The widget's `sanitize` refuses more than one H1 slide
  in one slideshow. The page as a whole (an H1 in the hero and in a slideshow) cannot be checked
  in one widget; the publishing workflow guide gets one line on this, and the browser checks
  look at it.
- **Contrast:** text over an image always gets an overlay (editorial §6), so a slide with text
  has no "none" choice. A slide with no text has no overlay.
- **The text fits:** slides stack in one CSS grid cell instead of `position: absolute`, so the
  track is as tall as the tallest slide. The chosen height (§6) is a minimum. On a phone the text
  never gets clipped; the image fills the rest (`object-fit: cover`, focal point respected).
- **Narrow containers** (container query, as m1-071 did for the hero): below 560 px wide the text
  block uses the full width; heading size follows the container width, not the screen.
- **Image loading:** the first slide's image loads at once (`loading="eager"`, as today); the
  player loads the next slide's image just before it is shown, so a lazy image never flashes in.

## 6. Slideshow display options

On the widget (the "Slideshow settings" part of its dialog):

| Option | Choices | Default (today's look) |
|---|---|---|
| Height | Short (16:7), Medium (16:9), Tall (75% of the screen height, in page areas only) | Short |
| Width | Content width, Full width (edge to edge, in page areas only) | Content width |
| Transition | Fade, Slide | Fade |
| Image effect | None, Slow zoom (the active image slowly scales from 100% to about 106%) | None |
| Text entrance | None, Fade in, Rise: the text of a slide appears when the slide becomes active, once, then stays still | Rise for new widgets; None when the field is missing (old widgets) |
| Controls | Arrows and dots, Dots only, Arrows only | Arrows and dots |
| Advance automatically / seconds per slide | as today | on / 6 |

Decisions:

- **Controls stay below the image**, as today, for every choice. On top of a photo they would
  need their own contrast handling and could cover slide text.
- **Always loops**, as today. No option: a "loop" switch would only add a dead end.
- **"Slow zoom" and the text entrance are not auto-moving text:** the zoom moves the image, not
  the text, and stops with pause; the text moves once, when its slide appears. Both are off under
  reduced motion and stop with the pause button. This is the editorial requirement as written; the
  owner can still say no in §11.
- **Full width and Tall are ignored inside a layout column** (§8): a column is narrower than the
  screen. The dialog says so in the help text.
- **Full width without horizontal scrolling:** `100vw` includes the scrollbar on Windows and makes
  the page scroll sideways. The build uses the page's real width without the scrollbar
  (`document.documentElement.clientWidth`, as a CSS variable) or a layout-level breakout; the
  browser checks look for horizontal overflow at 1440, 768 and 375 px.

## 7. Entrance animation for sections and layouts

- **Field:** a style select, `class: true`, "Entrance animation": None (default), Fade in, Rise.
  Defined once in `lib/motion.js` and added to the `styles` of each module that gets it. Editors
  choose it from the widget's Styles (palette) button, like the m1-071 Background style.
- **Which widgets:** the layout widget (the starters `layout-3`, `layout-4`, `layout-6` and
  `nested-layout` inherit it), the layout column (and `nested-column`), and the Assurer section
  widgets: hero, feature grid, stats, downloads, gallery, product grid, product list, people,
  locations, organizations. **Not** on rich text, image, video, form or the product card: these
  sit inside other widgets, and a styles wrapper would change their markup (§2). To animate a
  paragraph or an image, an editor puts it in a layout and animates the layout or the column.
- **Script:** one small module in `modules/asset/ui/src/` with one `IntersectionObserver`. When a
  widget with an entrance class comes into view, it adds `is-visible`, once, then stops watching
  it. Duration about 600 ms; no stagger (later, if wanted).
- **Safe by default (the hidden start state):** content is hidden only when the script has run and
  added a class to `<html>`. Without JavaScript, when printing, under reduced motion and in edit
  mode, nothing is hidden and nothing moves. Content already in view at page load shows at once.
- **The slideshow's text entrance (§6)** uses the same CSS keyframes, started by the player when a
  slide becomes active, not by the observer.

## 8. The slideshow in layout columns

Yes, in layout columns (`column` place in `lib/area.js`); not in nested columns (too narrow for
text and controls, as for the hero). The track and text read their container width (container
query on `.assurer-slideshow`, as for the hero in m1-071). Full width and Tall do not apply in a
column (§6). Image `sizes` stays `100vw` for now (the m1-071 later task covers `sizes` for all
widgets in columns).

## 9. Architecture and files

| File | Change |
|---|---|
| `lib/banner.js` (new) | `bannerButtons()`: the buttons array (`linkFields()` plus style), used by the hero and by slides. The hero's stored field names do not change |
| `lib/views/BannerButtons.jsx` (new) | The buttons markup, used by both templates (as `lib/views/EmptyHint.jsx` is today) |
| `lib/motion.js` (new) | The entrance style field definition |
| `modules/assurer-hero-widget/` | Uses `bannerButtons()` and `BannerButtons`; gets the entrance style. No new fields |
| `modules/assurer-slideshow-widget/index.js` | Slide fields (§5), display options (§6), `sanitize` for one H1, entrance style |
| `modules/assurer-slideshow-widget/views/widget.jsx` | New markup: slide text block, pause button, controls choice, classes for options |
| `modules/assurer-slideshow-widget/ui/src/index.js` | Player: pause/play, `user`, `offscreen` and `hidden` holds, `inert`, `aria-live`, swipe, slide transition, preloading the next image, text entrance |
| `modules/asset/ui/src/motion.js` (new) and `index.js` | The entrance observer |
| `modules/asset/ui/src/scss/_slideshow.scss` and `_motion.scss` (new) | Slideshow styles move out of `_assurer.scss` (the file is long); motion keyframes and reduced-motion rules |
| The 10 section widgets, `layout-widget`, `layout-column-widget` | One line each: `styles: { add: { entrance: entranceStyle } }` |
| `lib/area.js` | Slideshow allowed in `column` |
| `modules/assurer-demo/index.js` | The demo slideshow gets one banner slide with a heading and buttons, labelled "Demo" |
| Docs | Publishing workflow guide (heading levels, pause, animation), editorial requirements status, decision register D-CONTENT-22, INDEX, prompt record and report |

No new package, no new stored type, no migration. Labels follow the surrounding widgets (plain
English strings in the widget modules).

## 10. Tests and proof

- `npm run lint`, `test:smoke`, `test:workflow`, `test:persistence` (dev server checked first:
  the process on port 3000 and its start time, m1-071 lesson).
- New checks: the area lists (slideshow in columns, not in nested columns); a banner slide renders
  its heading at the chosen level, its buttons and the pause button; hidden slides are `inert`;
  two H1 slides are refused; an old slideshow (no new fields) renders as before (classes for the
  defaults).
- **Browser, as an editor (not admin), agent-executed:** build a banner slideshow with 3 slides
  through the UI (fields, image, buttons, reorder by dragging, publish); check every display
  option once; pause and play; keyboard only (Tab order skips hidden slides, ← →, the pause
  button); swipe where Chrome can emulate it, else NOT TESTED; reduced motion (Chrome rendering
  emulation): starts paused, no transitions, entrance content visible at once; a slideshow in a
  layout column; the entrance style on a layout and a section; logged-out view and
  draft/published isolation. At 1440, 768 and 375 px: no horizontal overflow, text not clipped,
  full width without a sideways scroll. Disposable editor and page archived afterwards.
- **Implicit state review** (STANDARDS.md): the player's state (current slide; playing as
  autoplay and no holds, with the holds pointer, focus, user, offscreen, hidden; reduced motion;
  edit mode; re-render), the entrance state (hidden, visible, never hidden without the script),
  and defaults for widgets stored before m1-072.

## 11. Decisions for the owner

The agent's decisions; one approval covers them all, or name the ones to change.

| # | Decision | Agent's choice |
|---|---|---|
| Q1 | Scope as in §3: build items 1 to 5; testimonials, logo strip, video slides and card carousels not now | **Yes** |
| Q2 | Slide text as plain fields with a heading-level choice (H2 default, at most one H1 per slideshow), not an in-place rich-text area | **Yes** |
| Q3 | Image effect "Slow zoom" and the slide text entrance are allowed (one-time or image-only motion, off under reduced motion and when paused) | **Yes** |
| Q4 | Entrance animation on layouts, columns and the 10 section widgets only, not on rich text, image, video, form or product cards | **Yes** |
| Q5 | The slideshow in layout columns, not in nested columns | **Yes** |
| Q6 | Autoplay starts paused in edit mode and under reduced motion (Play button shown) | **Yes** |
| Q7 | The hero gets no new options in this task (only the shared buttons and the entrance style) | **Yes**; text position and height for the hero can follow later |

After approval: build on branch `feat/m1-072-slideshow` (created from `origin/main` at
`63e691f`; no commits yet), tests, browser checks, report. No commit, push or PR without the
owner's approval.

## 12. Changes during the build (m1-072)

- **Text entrance default:** Rise for every slideshow, including those stored before m1-072
  (§6 said None for a missing value). A schema default that differs from the template's fallback
  is a hidden state: opening and saving an old slideshow would switch the option on without the
  editor choosing it. Old slides have no text, so nothing visible changes.
- **The page width** (`--assurer-vw`, §6) is set by its own small script,
  `modules/asset/ui/src/page-width.js`, not by the motion script: it is layout, not motion.
- **In view at page load:** a widget with an entrance style that is already in view when the
  script runs is marked `is-visible is-instant` and does not animate (§7 said "shows at once").
  Animating it would hide content that was already painted.
- **Zoom handover:** the slide that just left keeps its zoomed image (`is-leaving`) while it
  fades, so the image does not jump back to full size during the fade.
- **Slide list title:** the slide list in the dialog uses the slide heading as its title
  (`titleField`), so banner slides are named in the list; image-only slides show no title there.
- **Full width only in the page's `<main>`** (found in Chrome): in the editor's page dialog the
  breakout spilled past the dialog, because the dialog is not centred on the page. The rule now
  applies inside `.assurer-main` only. In full width, slide text lines up with the page content
  (padding from the content width) instead of the screen edge.
- **Observable state** (implicit state review): the player writes
  `data-assurer-slideshow-state` (`static`, `playing`, `paused`) where it reflects the state, and
  the entrance script writes `data-assurer-enter-state` (`waiting`, `shown`).
