# m1-075 start handoff (2026-11-16)

| | |
|---|---|
| **Prepared** | 2026-11-16, by the agent at the end of m1-074 (agent-executed; not a human approval) |
| **State of `main`** | `54f010f` when written. This file is in the m1-074 PR (branch `docs/m1-074-theme-presets-design`). Before starting, check that its commit is on `origin/main` (`git merge-base --is-ancestor <commit> origin/main`) |
| **Session** | Start a **new Claude Code session** (AGENTS.md, Sessions and context). If the local folder was renamed, open it from `Documents\mimnets-wms` |
| **Read first** | [AGENTS.md](../../AGENTS.md) · [INDEX](../engineering/INDEX.md) · [m1-074 report](../engineering/reports/2026/11/2026-11-16-m1-074-theme-presets.report.md) · [m1-074 design](m1-074-theme-presets-design.md) · for stage 2: [m1-073 rename design](m1-073-rename-design.md) §4, [m1-068 design](m1-068-release-pipeline-design.md) |

## 1. Where things stand

**Done in m1-074** (D-CONTENT-23): a Theme select in Global Styles (admins only) with Classic
(default), Quiet and Bold; Source Serif 4 and Manrope self-hosted; contrast table; a workflow
test for the theme. Core Global Styles has no drafts: Save is public at once, the panel preview
comes first. All local suites pass (report).

**Open, for the owner**

1. Approve the commit, push and PR of m1-074.
2. After the release and `deploy.sh`: try Quiet and Bold on the OCI site with the imported content
   and choose one (the business approval for D-CONTENT-18).
3. The local folder rename (m1-073 report, "For the owner" step 2), between sessions.
4. From m1-072: check the slideshow on the OCI site.

## 2. Recommended next task

The owner chooses one, each with a design note first:

- **Rename stage 2**: image names `ghcr.io/mimnets/wms-*`, `deploy.sh`, CI. Touches production:
  the owner runs the deploy. Best after the folder rename.
- **Theme follow-ups**, after the owner has seen the presets on the OCI site: changes to Quiet or
  Bold, a light logo file for a navy header in Bold, or a third direction.

Later: rename stages 3–5; backup status in the dashboard's Health tab and the read-only MongoDB
viewer (D-DB-24).

## 3. Lessons from m1-074

- Core Global Styles is `autopublish: true`: no draft state to test; check the panel preview and
  Cancel instead.
- Apostrophe select options in the browser carry JSON-encoded values; choose by label in Chrome.
- The agent's Chrome tab group has its own session; the owner logs in in that tab when an admin
  check is needed. Core's device preview (404 and 1014 px) stands in when the window will not
  resize.
- Theme tokens derived from other tokens (focus from accent) must be declared again under the
  theme class.

## 4. Limits

No change to WordPress. Commit, push and PR need the owner's approval. Anything on the OCI server is
run by the owner.

## 5. Prompt for the new session

> Start m1-075. Read AGENTS.md and docs/milestones/m1-075-handoff.md first, check that the m1-074
> PR is on main, confirm the task with me, write the design note and stop for my approval.
