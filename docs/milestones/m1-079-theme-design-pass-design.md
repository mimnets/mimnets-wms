# m1-079: theme design pass (design)

| | |
|---|---|
| **Task** | m1-079 |
| **Date** | 2026-11-18 |
| **Author** | The agent (agent-executed; not a human approval) |
| **Status** | **D-CONTENT-24 decided 2026-11-18 by the owner:** Q1 a, Q2 remove, Q3 a, Q4 after the proof, Q5 "both" (not now, and a design note on run-time AI later). Built in m1-079; notes in §10 |
| **Related** | [m1-079 handoff](m1-079-handoff.md) · [m1-074 theme presets design](m1-074-theme-presets-design.md) (D-CONTENT-23) · [m1-071 layout columns design](m1-071-layout-columns-design.md) (D-CONTENT-21) · [editorial and design requirements](../content/editorial-and-design-requirements.md) §3, §4 · [WordPress import design](../content/wordpress-import-design.md) |

The facts come from the repository at `02285fc` (PR #95 merged). The owner chose this task on
2026-11-18.

## 1. The request and the limits

The owner asked how the front end can attract and keep visitors, given that the old site was laid
out by hand in WordPress with Elementor, and whether AI can design the layout. The agent proposed,
and the owner chose, a **design pass**: look at the real imported content on the three presets
(Classic, Quiet, Bold) at 1440, 768 and 375 px, rank what holds the site back, and propose fixes
and reusable section patterns.

Limits: official Apostrophe APIs first; no new package; Community Edition only; no change that
breaks stored content; WCAG 2.2 AA; no demo content on production (D-CONTENT-20); nothing invented
as business fact (D-CONTENT-12).

**AI's role.** AI designs at build time: the agent screenshots, critiques, changes and checks
again, as in this note. **No AI at run time** (layouts generated per visitor): it would need an
external API (a new dependency, a cost, visitor data sent to a third party), make pages slower and
inconsistent, and confuse search engines. Recorded as part of D-CONTENT-24 (Q1).

## 2. How the audit ran

- **Data:** the WordPress import (`wms-wp-import:run --execute`) into a separate local database,
  `data/m1-079-audit.db`: 348 drafts, 0 failed. The agent published them **in that database only**
  (13 pages, 47 products, 8 organisations, 1 location, 264 images, 8 files) so logged-out views
  could be checked. The working database and the WordPress site were not changed.
- **Browser:** Chrome (Claude in Chrome), agent-executed, `127.0.0.1:3000`, logged out. Presets
  compared by swapping the theme body class in the page (the preset is only that class, m1-074 §4).
  The window could not be resized, so 375 and 768 px were checked in same-origin iframes of those
  widths. Media queries and container queries respond to the iframe width.
- **Pages:** home, `/style`, `/style/apparels-textiles`, `/contact-us`, `/downloads`,
  `/leadership`.
- **Not checked:** the OCI site, the admin's real preset switch in Global Styles (m1-074 tested
  it), `/health/*` and `/gallery/images` in detail.

## 3. Findings, ranked by effect on visitors

The most important finding: **the presets are not what holds the site back. The page structure is.**
On the imported home page, the three presets look almost the same at first view, because the page
has no hero, no dark section and no call to action. Quiet and Bold differ mainly in those places.

| # | Finding | Where | Kind |
|---|---|---|---|
| F1 | **No first impression.** The home page opens straight into six division cards: no hero, no headline, no H1 (`h1` count 0), no call to action | Home | Structure (content) |
| F2 | **Three images fill whole screens.** Images carried over from Elementor render 1200 px wide and up to 1,259 px tall ("Assurance of Only the Best…", "AWW Serves", "ASSURER ContactS"); the home page is 7,900 px tall on desktop and 11,600 px on mobile | Home | Content (image widget Width style exists) |
| F3 | **The only button for visitors is "Log in."** The header shows a "Log in" pill to every logged-out visitor; no "Contact us" button. The header call-to-action setting (`showHeaderCta`) exists but is off | All pages | Code (login) and settings (CTA) |
| F4 | **No side margin on narrow screens.** `main` has no inline padding, so below about 1,232 px, content (cards, text) touches the screen edge: the card's left edge is at 0 px at 375 px wide | All pages, tablet and mobile | Code (bug) |
| F5 | **Thin footer.** Only the demonstration line; no contact details, locations or links, because Global Settings are empty on a new site | All pages | Settings (owner) |
| F6 | **Long text walls.** Centred headings over left-aligned paragraphs of 3–5 lines each; capitalised marketing phrases; stats marked "Unconfirmed" | Home | Content (owner) |
| F7 | **Category banner is soft.** A 1,440 × 1,440 square photo cropped to 1,200 × 525; the title sits below the image, not on it | `/style/*`, `/health/*` | Content (photo) and pattern |
| F8 | **Three columns at 768 px are cramped.** Cards at 235 px; titles wrap to three lines. The requirement (§4 of the editorial requirements) is two columns on tablet; the container query switches to three at 720 px | Card grids | Code (one threshold) |
| F9 | **Empty-looking pages.** Leadership has three headings and nothing else (people not imported, D-CONTENT-4); Contact has one address card and no form | `/leadership`, `/contact-us` | Content and pattern |
| F10 | Text errors from PDF copy: "Solu ons" (lost "ti" ligature) in download descriptions | `/downloads` | Content (owner) |
| F11 | "More" links are 6 tap targets under 44 px high | Cards | Code (small) |

What is fine: no horizontal overflow at any width; body text 16 px at every width; mobile menu
works; product category grids with line-art icons read well; the world map and the client logo
strip are strong images; presets load only their own font (Source Serif 4 or Manrope, checked).

## 4. Design summary

Three parts. Only part A changes code. B ships editor tools built from existing widgets. C is a
content list for the owner.

### 4.1 A: front-end fixes (code)

| Fix | Change | Finding |
|---|---|---|
| A1 Side margin | A gutter token (`--wms-space-gutter`, 16 px mobile, 24 px from 768 px) as inline padding on `main` and the footer, matching the header | F4 |
| A2 Log in out of the public header | Remove the visitor "Log in" pill; staff use `/login` (unchanged; production `robots.txt` already disallows it, m1-018). Signed-in users keep the admin bar | F3 |
| A3 Two columns on tablet | Raise the three-column container threshold from 720 to 840 px (`.wms-grid--3`, `.wms-grid--cols-3/4`). A grid in a wide layout column is unaffected | F8 |
| A4 Tap targets | Card "More" links get `min-height: 44px` (the whole card stays one link) | F11 |
| A5 Each preset shows its character | Quiet and Bold already restyle the hero, dark backgrounds and buttons. No new rule: the patterns (B) put those elements on the page | F1 |

No migration and no stored-content change. A2 is a visible change, so it is Q2.

### 4.2 B: section patterns (editor tools, no new widget)

Core already gives editors **page duplicate** and **widget copy and paste** (the clipboard in
`AposAreaWidget.vue`, checked in `node_modules/apostrophe` 4.34). A pattern is therefore just a
well-built set of existing widgets that editors copy from:

| Pattern | Sections (existing widgets) |
|---|---|
| P1 Home opening | Hero with photo, H1, one sentence and a "Contact us" button · key figures (stats) · division cards |
| P2 Story band | Layout widget, two columns, image beside short text; Background style dark (m1-071) |
| P3 Trust band | Client logos (gallery) · one-line quote |
| P4 Category landing | Hero with title on the photo (H1) · short intro · product grid · downloads for the category · inquiry band |
| P5 Inquiry band | Hero without image (CTA band, editorial requirements §2) with "Contact us" |
| P6 Contact page | Intro · locations · contact form (`@apostrophecms/form`) |

**Delivery (Q3):** a task `wms-patterns:seed` in a new small module `modules/wms-patterns`
writes a **draft-only** page "Patterns (do not publish)" (`hideInNav`, never published by the task)
with one sub-page per pattern. Placeholder text says "Replace this heading", and images come from
the site's own media library or stay empty. The task is idempotent (skips pages that exist) and never
publishes. Drafts are not public (D-CONTENT-20 holds: nothing fictional goes live). The
publishing workflow guide gets a short "Start from a pattern" section.

### 4.3 C: content and settings for the owner (no code)

Rebuild the imported home page from P1, P2, P3 and P5. Set the large images to Width 50% or
remove them. Turn on the header call to action and fill the footer in Global Settings. Confirm or
remove the four figures. Shorten the home text to one sentence per idea. Supply a wide photo per
category (about 2,400 × 1,000). Fix "Solu ons". Keep Leadership unpublished until D-CONTENT-4
consent. After that, choose the preset (Q4).

The agent can draft the rebuilt home page **in the local audit database** as a proof (no real
site touched) and show it on all three presets, so the owner decides on the preset with real
structure in place.

## 5. Owner checklist (items waiting on the owner, from the session)

| Item | Guide |
|---|---|
| OCI switch | [staging runbook](../runbooks/staging-container.md) §12.6 |
| Look at the presets | [m1-074 design](m1-074-theme-presets-design.md) §4 and §10: Global Styles → Theme, Save |
| Confirm the brand values | [design tokens](../content/design-tokens.md) §2 (D-CONTENT-12) |
| Privacy notice to the DPO | [privacy notice draft](../content/privacy-notice-draft.md) (D-CONTENT-15) |
| Import, review and publish on OCI | Staging runbook §4.1; [publishing workflow guide](../content/publishing-workflow-guide.md) |
| This note's decisions | §8 |

## 6. Implicit state review (plan)

| State | Decision |
|---|---|
| Login entry: header pill (visitors) vs `/login` vs admin bar | One entry for staff, `/login`; the header shows no login state for visitors. Recorded in the layout comment |
| Pattern pages: draft only, never published, hidden from navigation | The task never publishes; the page title says "do not publish". An editor who publishes one publishes placeholders: the help text warns; a guard (refuse publish under that page) is **not** added (Minimal change). Q3 |
| Grid columns: container width decides (m1-071) | Kept; only the threshold moves |
| Theme: body class, set by admins (m1-074) | Unchanged |

## 7. Tests

- `npm run lint`, `test:unit`, `test:smoke`, `test:workflow`, `test:persistence`; unit test for
  the pattern task's plan (idempotent, draft only, nothing published).
- Chrome (agent-executed, local): 375/768/1440 on the three presets: gutter present, no overflow,
  two columns at 768, no "Log in" for visitors, `/login` still works; as a disposable **editor**:
  open a pattern, copy a widget, paste it into a draft page, publish; logged out, the pattern page
  returns 404 and the published page shows the pasted section.
- Run the pattern task twice: the second run creates nothing.

## 8. Decisions for the owner (D-CONTENT-24)

| Q | Question | Options | Recommended |
|---|---|---|---|
| Q1 | Scope of m1-079 build | a. A fixes + B patterns + home proof in the audit DB · b. A fixes only · c. B only | **a** |
| Q2 | Remove "Log in" from the public header | yes (staff use `/login`) · keep | **yes** |
| Q3 | Pattern delivery | a. `wms-patterns:seed` task, draft-only pages · b. a written guide only, editors build patterns by hand | **a** |
| Q4 | Default preset | decide after the home proof (Classic stays default until then) · decide now | **after the proof** |
| Q5 | AI at run time | not now (build-time design only) · design note for it later | **not now** |

## 9. After the audit

- The audit database `data/m1-079-audit.db` (git-ignored, `data/`) and its admin `auditadmin`
  stay local for the proof in Q1 a. The password is in the session scratch folder, not in the
  repository. **Kept after m1-079** (changed at the end of the task): the owner chooses the
  preset on the home proof (Q4); the report's "Left over" says how to start and remove it.
- No evidence screenshots were saved.

## 10. As built (m1-079)

Built after D-CONTENT-24. Changes from §4 to §7, found during the build:

- **A1 gutter:** `.wms-main` reuses `--wms-space-4` (16 px) at every width, the value the
  header, breadcrumbs and footer already use; no new token and no 24 px step at 768 px. The
  full-width slideshow still centres (its breakout is symmetric).
- **A2:** the visitor "Log in" link and the Quiet preset's rule that placed it are removed;
  `Header` no longer takes `user`. `/login` is unchanged.
- **A3:** the three-column threshold moved to 840 px for `.wms-grid--3`, `.wms-grid--cols-3/4`
  and the product grid's 3 and 4 columns. The gallery keeps 720 px (photos, no text).
- **A4 (corrects §4.1):** the card's "More" is a separate link, not the whole card; it is now an
  `inline-flex` of at least 44 px height.
- **B patterns (corrects §4.2):** a gallery needs at least one image, so the trust band has a
  heading, a quote and a how-to line instead of an empty gallery; the product list and the
  downloads start in "pick" mode with nothing picked. The parent page uses core's "Hide in
  Navigation" (`orphan`). The task has no dry run: it only adds missing draft pages. Each pattern
  opens with an italic "How to use" line.
- **Home proof:** in the local audit database only (`data/m1-079-audit.db`): the imported home
  sections rearranged into P1 (hero with the site's own headline and first sentence, verbatim),
  P2 twice (layout columns), and P5 at the end. No text invented; no photo, because the import
  has one wide image only (the world map), so the hero is the theme's navy band.
- **README:** at the owner's request in the session, a "How it is built" section (the three
  layers and what happens when the site runs) and the `wms-patterns` row. It notes that local
  development uses SQLite and servers use MongoDB.

Implicit state review (§6), as built: unchanged. One login entry (`/login`); pattern pages are
drafts that the task never publishes and that visitors get as 404 (checked); grid columns still
follow the container; the theme class is untouched.
