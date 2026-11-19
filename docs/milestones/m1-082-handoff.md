# m1-082 start handoff (2026-11-19)

| | |
|---|---|
| **Prepared** | 2026-11-19, by the agent at the end of m1-081 (agent-executed; not a human approval) |
| **State of `main`** | `bad8ae7` when written. This file is in the m1-081 PR (branch `feat/m1-081-full-width-bands`). Before starting, check that its commit is on `origin/main` (`git merge-base --is-ancestor <commit> origin/main`) |
| **Session** | Start a **new Claude Code session** (AGENTS.md, Sessions and context) |
| **Read first** | [AGENTS.md](../../AGENTS.md) · [INDEX](../engineering/INDEX.md) · [m1-081 report](../engineering/reports/2026/11/2026-11-19-m1-081-full-width-bands.report.md) · [m1-081 design](m1-081-full-width-bands-design.md) §9 |

## 1. Where things stand

**Done in m1-081** (D-CONTENT-26): a "Band width" style on the feature grid, stats,
organizations, hero and layout widgets. "Full window width" runs the background edge to edge and
keeps the content at page width. The local `wms-local` home page now uses it for the hero and its
nine colour and photo sections.

**Open, for the owner**

1. Review and merge the m1-081 PR.
2. Choose the default preset on the container (`http://127.0.0.1:3042/`, Global Styles → Theme),
   now with full-width bands (D-CONTENT-24 Q4 / D-CONTENT-25 Q7).
3. After the release on OCI: set "Full window width" on the home bands there (Styles panel of each
   section), with the m1-080 items (footer, footer links, photo sections).
4. Still open from m1-080: check the original WordPress site for injected spam; optionally report
   the core Global Styles fault to ApostropheCMS.
5. Still open from earlier: the OCI switch (staging runbook §12.6); brand values (D-CONTENT-12);
   the privacy notice to the DPO (D-CONTENT-15); review and publish the import on OCI.

## 2. Recommended next task

The owner chooses one, each with a design note first:

- **Menu** (D-CONTENT-25 Q4 b): reorder and rename the page tree to match the original's
  Products, Organizations, Services, Leadership, Contact Us.
- **Run-time AI design note** (D-CONTENT-24 Q5).
- **Backup status in the dashboard's Health tab** (D-DB-24).

## 3. Lessons from m1-081

- Core writes simple style values (colour, padding, a Width of 100 %) **inline** on the styles
  wrapper, and image backgrounds and other widths in a `<style>` rule on `#<styleId>`. A project
  class cannot beat either for the same property; use a different property (`min-width`) or style
  the child.
- Core's layout grid has `width: 100%`: side margins on it overflow. Use `width: auto`.
- Login on `127.0.0.1:3042` redirects to `localhost:3042` (the base URL), which has its own
  cookies. Go back to `127.0.0.1` for the editor's session.
- `chrome.windows` resize had no effect on the maximized window; same-origin iframes 768 and
  375 px wide gave the tablet and phone measurements.
- Creating a user in the container: read the secrets as root and run the task with
  `gosu wms` (the `wms` user cannot read `/data/secrets/session-secret`).
- A page PATCH with `archived: true` returned `archived: false`. A move with
  `_targetId: '_archive'` answered with an error, yet the page was then in the archive
  (`/archive/0`). Check the result with a read; do not trust the response alone.

## 4. Limits

No change to WordPress. Commit, push and PR need the owner's approval. Anything on the OCI server is
run by the owner.

## 5. Prompt for the new session

> Start m1-082. Read AGENTS.md and docs/milestones/m1-082-handoff.md first, check that the m1-081
> PR is on main, confirm the task with me, write the design note and stop for my approval.
