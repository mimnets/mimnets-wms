# m1-088 start handoff (2026-11-25)

| | |
|---|---|
| **Prepared** | 2026-11-25, by the agent at the end of m1-087 (agent-executed; not a human approval) |
| **State of `main`** | `96c6826` when written. This file is in the m1-087 branch (`feat/m1-087-custom-themes`). Before starting, check that its commit is on `origin/main` (`git merge-base --is-ancestor <commit> origin/main`) |
| **Session** | Start a **new Claude Code session** (AGENTS.md, Sessions and context) |
| **Read first** | [AGENTS.md](../../AGENTS.md) · [INDEX](../engineering/INDEX.md) · [m1-087 report](../engineering/reports/2026/11/2026-11-25-m1-087-custom-themes.report.md) · [m1-087 design](m1-087-custom-themes-design.md) §3.11 and §9 · [m1-084 handoff](m1-084-handoff.md) §4 (the AI row) |

## 1. Where things stand

**Done in m1-087** (D-CONTENT-32): admins copy a preset into a custom theme (`wms-theme` piece
type, admin only), change its tokens in the admin UI and publish it; Global Styles → Theme offers
it after the presets. Every save is checked for shape and WCAG 2.2 AA contrast
(`lib/theme-contrast.js`, shared with the unit test). The theme stylesheet now includes published
custom themes (each process checks at most every 10 s). A theme in use cannot be archived or
unpublished. Guide: publishing workflow guide §6.

**Open, for the owner**

1. Review the m1-087 branch; approve commit, push and PR.
2. After the release on each site: nothing to run for m1-087 (no migration, no seed).
   `node app wms-patterns:seed` from m1-086 is still open if not yet run.
3. Still open: the category landing H1 (m1-087 handoff §1 item 3), the m1-085 hidden pattern
   columns check, OCI items (set Bold after the release, D-CONTENT-24 Q4), WordPress spam check,
   brand values (D-CONTENT-12), the privacy notice to the DPO (D-CONTENT-15).
4. **This clone has no `.env` or `data/`.** Server suites run through `npm run test:ci`.

## 2. Next task: m1-088 AI-assisted design (ADR first)

From the m1-084 handoff §4: suggest themes (a token set) and page layouts (existing widgets,
patterns and templates, never raw HTML or CSS) from a brief; each result is a draft for a human to
publish.

**Architecture gate first:** an ADR covering the external AI service, the key in the secret store,
cost and data limits (no personal data in prompts), admin only, and how results are validated. No
service, key or dependency before the ADR is accepted. The theme part has a ready target: create a
**draft `wms-theme`** with `started: true` and the tokens; the server's `beforeSave` checks it like
any other (m1-087 design §3.11). A page layout suggestion would need its own data shape (a list of
pattern or template sections), designed in the same note.

The owner may instead pick another item from §1.

## 3. Facts to start from

- Custom themes: `modules/wms-theme/index.js` (rules), `modules/wms-theme/lib/fields.js` (form
  from `themeFields`, `fieldsFromTokens()` / `tokensFromFields()`).
- Presets, shape and CSS: `lib/themes.js`; contrast: `lib/theme-contrast.js`.
- Stylesheet and Theme choices: `modules/@apostrophecms/styles/index.js` (`wmsRefreshThemes`,
  `wmsThemeChoices`).
- Tests: `scripts/custom-themes.test.mjs` (unit), `scripts/custom-themes-test.mjs` (REST, in
  `npm run test:ci`).

## 4. Lessons from m1-087

- Core hides an empty tab, but a field with no group creates an "Ungrouped" tab even when it is
  `hidden`: list hidden fields in a group.
- `@apostrophecms/seo` adds SEO fields to every piece type; `seoFields: false` turns them off.
- Core's `convert` skips `readOnly` fields: the UI and the API cannot set them, and Duplicate does
  not copy them.
- A select with `choices: '<method>'` is checked against those choices on save; an unknown value is
  stored as `null` with a 200, not refused.
- Compare objects with deep equality in tests, not `JSON.stringify` (key order).
- The Chrome window may be maximised and ignore resizing; an iframe of the target width measures
  overflow instead (record it as measured, not seen).

## 5. Limits

No change to WordPress. Commit, push and PR need the owner's approval. Anything on the OCI server
is run by the owner. No AI service, key or dependency without an accepted ADR.

## 6. Prompt for the new session

> Start m1-088. Read AGENTS.md and docs/milestones/m1-088-handoff.md first, check that the m1-087
> PR is on main, then write the ADR and design note for AI-assisted design (or the item I name) and
> stop for my approval.
