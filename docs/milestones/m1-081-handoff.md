# m1-081 start handoff (2026-11-18)

| | |
|---|---|
| **Prepared** | 2026-11-18, by the agent at the end of m1-080 (agent-executed; not a human approval) |
| **State of `main`** | `8fd8982` when written. This file is in the m1-080 PR (branch `feat/m1-080-theme-follow-ups`). Before starting, check that its commit is on `origin/main` (`git merge-base --is-ancestor <commit> origin/main`) |
| **Session** | Start a **new Claude Code session** (AGENTS.md, Sessions and context) |
| **Read first** | [AGENTS.md](../../AGENTS.md) · [INDEX](../engineering/INDEX.md) · [m1-080 report](../engineering/reports/2026/11/2026-11-18-m1-080-theme-follow-ups.report.md) · [m1-080 design](m1-080-theme-follow-ups-design.md) §2, §9 |

## 1. Where things stand

**Done in m1-080** (D-CONTENT-25): visitors now get the Global Styles CSS and preset on every site
(the core fault is healed at start); section widgets take a background and padding; footer links
in Global Content; the original site's hero, photos and footer rebuilt in the local `wms-local`
container.

**Open, for the owner**

1. Review and merge the m1-080 PR.
2. Choose the default preset on the container (`http://127.0.0.1:3042/`, Global Styles → Theme)
   (D-CONTENT-24 Q4 / D-CONTENT-25 Q7).
3. Have the original WordPress site checked for injected spam (m1-080 design §2.4).
4. Optionally report the core fault to ApostropheCMS (Q6; text in the m1-080 report).
5. After the release on OCI: check the site logged out, fill the footer and footer links, rebuild
   the home photo sections (m1-080 design §3 B).
6. Still open from earlier: the OCI switch (staging runbook §12.6); brand values (D-CONTENT-12);
   the privacy notice to the DPO (D-CONTENT-15); review and publish the import on OCI.

## 2. Recommended next task

The owner chooses one, each with a design note first:

- **Full-width bands**: let a section's background run the width of the window, as on the
  original (touches the `main` width and the m1-079 side margin).
- **Menu** (D-CONTENT-25 Q4 b): reorder and rename the page tree to match the original's
  Products, Organizations, Services, Leadership, Contact Us.
- **Run-time AI design note** (D-CONTENT-24 Q5).
- **Backup status in the dashboard's Health tab** (D-DB-24).

## 3. Lessons from m1-080

- The REST API takes relationships in their joined form, `_image: [{ _id: "<id>:en:draft" }]`,
  with the full draft `_id`. The stored form (`imageIds`) is dropped silently on PATCH.
- Core puts `width: 100%` and padding on the same widget wrapper; the project's `box-sizing` rule
  in `_wms.scss` keeps that from overflowing.
- Signed-in editors see Global Styles rendered in the browser, so a visitor-only fault is invisible
  to them. Check visitor views on `127.0.0.1:3042` (no cookie), not `localhost:3042`.
- Tasks in the container run with `kiri exec -w /app wms-local-site-1` as the `wms` user, with
  `APOS_DB_URI` built inside the container from `/data/secrets` (nothing printed).
- `@apostrophecms/migration` migrations are skipped on a new database; a fix that must also cover
  new sites belongs on `migration:requirements` or later.

## 4. Limits

No change to WordPress. Commit, push and PR need the owner's approval. Anything on the OCI server is
run by the owner.

## 5. Prompt for the new session

> Start m1-081. Read AGENTS.md and docs/milestones/m1-081-handoff.md first, check that the m1-080
> PR is on main, confirm the task with me, write the design note and stop for my approval.
