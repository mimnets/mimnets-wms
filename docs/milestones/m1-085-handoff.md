# m1-085 start handoff (2026-11-19)

| | |
|---|---|
| **Prepared** | 2026-11-19, by the agent at the end of m1-084 (agent-executed; not a human approval) |
| **State of `main`** | `f4b0849` when written. This file is in the m1-084 PR (branch `feat/m1-084-themes-as-data`). Before starting, check that its commit is on `origin/main` (`git merge-base --is-ancestor <commit> origin/main`) |
| **Session** | Start a **new Claude Code session** (AGENTS.md, Sessions and context) |
| **Read first** | [AGENTS.md](../../AGENTS.md) · [INDEX](../engineering/INDEX.md) · [m1-084 report](../engineering/reports/2026/11/2026-11-19-m1-084-themes-as-data.report.md) · [m1-084 design](m1-084-themes-as-data-design.md) (the theme shape, §3.2 and §10) · [m1-084 handoff](m1-084-handoff.md) §2 and §4 (the owner's request and the split) |

## 1. Where things stand

**Done in m1-084** (D-CONTENT-29): themes are data in `lib/themes.js` with a fixed shape, checked
by `scripts/themes.test.mjs` (shape and WCAG AA for every preset). 12 presets: Classic, Quiet,
Bold, Corporate, Editorial, Modern, Midnight, Forest, Ocean, Slate, Terracotta, Plum. New fonts
Inter, Lora, Space Grotesk. The styles module serves one cached theme stylesheet. Quiet and Bold
kept their class names; the site's Bold is unchanged.

**Open, for the owner**

1. Review and merge the m1-084 PR.
2. Still open from earlier handoffs: OCI items (set Bold after the release, D-CONTENT-24 Q4),
   WordPress spam check, brand values (D-CONTENT-12), the privacy notice to the DPO (D-CONTENT-15).

## 2. Next task: m1-085 layout options (from the m1-084 handoff §4)

Site-wide choices in Global Styles (header style, footer style, content width) and more section
layouts (split media and text, offset grids). Design note first, owner approval, then build.

Questions the design note should answer:

- **Header and footer style vs the theme.** m1-084 put `headerLayout` (inline, centred),
  `headerCta` (solid, outline) and `footerBand` in the theme. Either keep them there, or make them
  Global Styles fields with a "Theme default" choice that overrides the theme. Two owners of one
  setting is the implicit state to avoid: say which one wins and why.
- **Content width:** Global Styles already has "Content Max Width" (`--content-max-width`) and
  page width (`page-width.js`); say how a new choice relates to them, or whether none is needed.
- **Section layouts:** new widgets or styles on the existing layout widgets (`layout-3/4/6`,
  m1-071; band width, m1-081). Prefer styles and existing widgets (official APIs first).
- New values that are colours or type must come from theme tokens, never literal values, so every
  preset still passes the contrast test.

## 3. Facts to start from

- Theme tokens: `themeProperties()` in `lib/themes.js` lists every custom property; components
  read them with a fallback (`var(--wms-…, <Classic value>)`), and a theme writes `initial` for
  "use the fallback".
- `primary` is a background; `primaryText` (null = primary) is the primary colour as text. Use
  `--wms-color-primary-text` for text.
- The theme stylesheet URL carries a hash; a change to `lib/themes.js` gives a new URL.

## 4. Lessons from m1-084

- The contrast test found a real AA failure in an existing preset (Bold badge 4.4999:1); trust it
  over hand tables.
- A dark theme exposes colour tokens with two jobs: check one dark preset in the browser, not only
  the test.
- nodemon on the owner's PC did not reload after file changes; check the served code (for example
  the theme stylesheet hash) before testing, and ask before restarting the owner's server.
- The smoke test's form checks hit the form rate limit (10 per 15 minutes) when run several times
  in a row; wait the window out before re-running.
- `resize_window` still leaves the viewport at 1440 px; use same-origin iframes for 375 and 768 px.

## 5. Limits

No change to WordPress. Commit, push and PR need the owner's approval. Anything on the OCI server
is run by the owner. No AI service, key or dependency without an accepted ADR.

## 6. Prompt for the new session

> Start m1-085. Read AGENTS.md and docs/milestones/m1-085-handoff.md first, check that the m1-084
> PR is on main, confirm the task with me, write the design note and stop for my approval.
