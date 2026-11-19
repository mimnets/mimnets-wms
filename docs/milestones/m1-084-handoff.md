# m1-084 start handoff (2026-11-19)

| | |
|---|---|
| **Prepared** | 2026-11-19, by the agent at the end of m1-083 (agent-executed; not a human approval) |
| **State of `main`** | `9cc5710` when written. This file is in the m1-083 PR (branch `fix/m1-083-refresh-scripts`). Before starting, check that its commit is on `origin/main` (`git merge-base --is-ancestor <commit> origin/main`) |
| **Session** | Start a **new Claude Code session** (AGENTS.md, Sessions and context) |
| **Read first** | [AGENTS.md](../../AGENTS.md) · [INDEX](../engineering/INDEX.md) · [m1-083 report](../engineering/reports/2026/11/2026-11-19-m1-083-refresh-scripts.report.md) · [m1-079 design](m1-079-theme-design-pass-design.md) (presets, patterns, D-CONTENT-24 Q5) · [m1-080 design](m1-080-theme-follow-ups-design.md) |

## 1. Where things stand

**Done in m1-083** (D-CONTENT-28): the menu and the entrance animation run again after every
editor refresh in release builds (`modules/asset/ui/src/on-page-ready.js`). Core cause in
`apos.util.onReady`; a draft report to ApostropheCMS is in the m1-083 report.

**Open, for the owner**

1. Review and merge the m1-083 PR. The core report is filed: [apostrophecms/apostrophe#5761](https://github.com/apostrophecms/apostrophe/issues/5761); when a fix ships, `onPageReady` can go back to `apos.util.onReady`.
2. Default preset decided 2026-11-19 (D-CONTENT-24 Q4 / D-CONTENT-25 Q7): Bold for the site, Classic stays the code default. The container already publishes Bold; set Bold on OCI after the release. The m1-082 test editor was archived the same day.
3. Still open from m1-083 handoff §1: the m1-082 test editor, OCI items, WordPress spam check,
   brand values (D-CONTENT-12), the privacy notice to the DPO (D-CONTENT-15).

## 2. The owner's request (2026-11-19, verbatim in the m1-083 prompt record)

More theme options, more layout options, and templates: **both** whole-page templates and more
section patterns; **as many themes as possible**; the size split is the agent's recommendation;
and **AI automation** that suggests themes and templates, shows a preview, and creates the chosen
one.

## 3. Facts to start from

- Themes: Global Styles → Theme, a `class: true` select with three presets (Classic, Quiet,
  Bold) in `modules/@apostrophecms/styles/index.js`; each preset is a `<body>` class that overrides
  design tokens in `_themes.scss` (m1-074, D-CONTENT-23).
- Layout: `layout-3/4/6` widgets, nested layout and column widgets, the "Band width" style
  (m1-081), page width (`page-width.js`).
- Section patterns: `node app wms-patterns:seed` adds draft-only pattern pages that editors copy
  sections from (m1-079, D-CONTENT-24 Q3).
- AI at run time: D-CONTENT-24 Q5 decided "not now, and a design note on it later". The owner's
  request reopens it: it needs that design note and an ADR (external service, secret, data sent,
  cost) before any code. It is an architecture gate.

## 4. Recommended split (each task: design note first, owner approval, then build)

| Task | Content | Why this order |
|---|---|---|
| **m1-084** | **Themes as data, and more presets.** Recommend moving presets from hand-written classes to one token set per theme (colours, fonts from the approved set, radius, shadow, spacing scale), rendered as CSS variables. Then add curated presets: recommend about 10–12, each checked for WCAG AA contrast against every widget, rather than an unbounded number. This is a refactor of the m1-074 design: the design note must state it and the owner approve it first (AGENTS.md, clean architecture) | AI can only produce a theme safely if a theme is data with a fixed shape; it also makes many presets cheap and testable |
| m1-085 | **Layout options**: site-wide choices (header style, footer style, content width) in Global Styles, and more section layouts (split media and text, offset grids) | Builds on the token set |
| m1-086 | **Templates**: more section patterns, and whole-page starters (a "Start from template" choice that copies a template page's areas into a new draft page, or new page types with prefilled areas: the design note compares the two) | Uses themes and layouts |
| m1-087 | **AI-assisted design**: ADR and design note first. Suggest themes (a token set) and templates (a list of existing widgets and patterns, never raw HTML or CSS) from a brief; preview each as a draft; the editor selects; the result is created as a draft for a human to publish. Admin only, server-side validation of every value against the schema, key in the secret store, cost and data-sent limits, no personal data in prompts | Needs the data shapes from m1-084 to m1-086; external service and secret are architecture gates |

Decisions the m1-084 design note should ask: the token set's fields; the preset count and names;
whether existing Quiet and Bold keep their class names (stored on the global doc; a rename needs
a migration); whether editors may also edit a preset's tokens or only choose one.

## 5. Lessons from m1-083

- Release builds and dev load bundles in a different order: check browser-script behaviour on the
  container (`kiri compose up -d --build`), not only on `npm run dev`.
- `apos.util.onReady` does not re-run after refresh in release builds; use `onPageReady`
  (`modules/asset/ui/src/on-page-ready.js`) for page-wide scripts.
- The dev server and the container share the cookie name (`shortName`): signing in on one signs
  out the other.
- `resize_window` may report success while the viewport stays the same; check `innerWidth`.
- The agent may not read the test password from `.env`; the owner signs in in Chrome.

## 6. Limits

No change to WordPress. Commit, push and PR need the owner's approval. Anything on the OCI server is
run by the owner. No AI service, key or dependency without an accepted ADR.

## 7. Prompt for the new session

> Start m1-084. Read AGENTS.md and docs/milestones/m1-084-handoff.md first, check that the m1-083
> PR is on main, confirm the task with me, write the design note and stop for my approval.
