# m1-086 start handoff (2026-11-19)

| | |
|---|---|
| **Prepared** | 2026-11-19, by the agent at the end of m1-085 (agent-executed; not a human approval) |
| **State of `main`** | `b02b12e` when written. This file is in the m1-085 PR (branch `feat/m1-085-layout-options`). Before starting, check that its commit is on `origin/main` (`git merge-base --is-ancestor <commit> origin/main`) |
| **Session** | Start a **new Claude Code session** (AGENTS.md, Sessions and context) |
| **Read first** | [AGENTS.md](../../AGENTS.md) · [INDEX](../engineering/INDEX.md) · [m1-085 report](../engineering/reports/2026/11/2026-11-19-m1-085-layout-options.report.md) · [m1-085 design](m1-085-layout-options-design.md) §9 · [m1-084 handoff](m1-084-handoff.md) §4 (the split) · [m1-079 design](m1-079-theme-design-pass-design.md) (patterns) |

## 1. Where things stand

**Done in m1-085** (D-CONTENT-30): Global Styles → Layout → Header and Footer: Header Style and
Footer Style, each with "Theme default"; an explicit choice wins over the theme (`overrides` in
`lib/themes.js`, rules after every theme). Any theme can show a footer band (its own colours, or
`primary` / `onPrimary`). Content width unchanged (help text only). Section patterns "split,
image left", "split, image right", "offset grid", and a Stagger style on layout widgets.

**Open, for the owner**

1. Review and merge the m1-085 PR.
2. **Hidden pattern columns already stored** (m1-079 defect): the migration
   `wms-show-pattern-columns` repairs the pattern pages at the next start. Back up the database and
   media first; after start, check each page the log lists (probably the home page) in core's
   mobile preview.
3. Still open from earlier handoffs: OCI items (set Bold after the release, D-CONTENT-24 Q4),
   WordPress spam check, brand values (D-CONTENT-12), the privacy notice to the DPO (D-CONTENT-15).

## 2. Next task: m1-086 templates (from the m1-084 handoff §4)

More section patterns, and whole-page starters: a "Start from template" choice that copies a
template page's areas into a new draft page, or new page types with prefilled areas. The design
note compares the two. Design note first, owner approval, then build.

Questions the design note should answer:

- **Copy vs page type:** copying keeps one page type and editor-owned templates, but needs a
  copy step (official APIs: `apos.page.insert` with converted areas, new widget `_id`s); a page
  type is code-owned and fixed. Which owns the template, and what happens when a template changes
  after pages were made from it (no link, by design?).
- **Where templates live:** draft pages under "Patterns", or a piece type. Templates must never
  be public.
- **Seeding through `convert`:** core's boolean `convert` stores a missing boolean as `false`
  (m1-085). Every widget a template or pattern creates must state its boolean style fields.

**Candidate from the owner (2026-11-19): admin-customised themes.** Today admins only choose a
preset. The owner asked whether admins can edit a theme and how it would be saved and named. The
recommended shape is in the [m1-085 report](../engineering/reports/2026/11/2026-11-19-m1-085-layout-options.report.md)
(Recommended next step): copy a preset into an admin-only piece, validate on the server (shape and
contrast), human name with a hidden random ID in the class. The owner decides whether this comes
before templates, after them, or with AI (m1-087).

## 3. Facts to start from

- Patterns: `modules/wms-patterns/lib/patterns.js` (pure data, unit-tested in
  `scripts/patterns.test.mjs`), seeded by `node app wms-patterns:seed` as drafts under
  `/patterns`, never published; the seed adds missing pages only.
- Layout columns: core 12-column grid; `colstart`, `colspan`, `order` (phone order), `showTablet`,
  `showMobile`.
- Theme overrides: `overrides` in `lib/themes.js`; header and footer mapping in
  `headerProperties()` / `footerProperties()`.

## 4. Lessons from m1-085

- Stop or pause the developer server before adding a migration: nodemon restarts it and the
  migration runs on the local database before any test on a copy (it happened in m1-085).
- Core's boolean `convert` ignores `def`: a seeded widget without the boolean gets `false`. Check
  seeded layouts in core's mobile preview, not only at 1440 px.
- Same-origin iframes measure nothing useful on an editor's draft page (editor DOM); use core's
  breakpoint preview buttons.
- The smoke test's form checks still hit the form rate limit (10 per 15 minutes) on back-to-back
  runs; wait the window out.
- The agent may not read the admin test credentials: plan admin UI checks with the owner signed in
  in Chrome.
- nodemon reloaded this time; still check the served theme stylesheet hash before testing.

## 5. Limits

No change to WordPress. Commit, push and PR need the owner's approval. Anything on the OCI server
is run by the owner. No AI service, key or dependency without an accepted ADR.

## 6. Prompt for the new session

> Start m1-086. Read AGENTS.md and docs/milestones/m1-086-handoff.md first, check that the m1-085
> PR is on main, confirm the task with me, write the design note and stop for my approval.
