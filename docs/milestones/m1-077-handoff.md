# m1-077 start handoff (2026-11-17)

| | |
|---|---|
| **Prepared** | 2026-11-17, by the agent at the end of m1-076 (agent-executed; not a human approval) |
| **State of `main`** | `dd6af95` when written. This file is in the m1-076 PR (branch `chore/m1-076-rename-stage-3`). Before starting, check that its commit is on `origin/main` (`git merge-base --is-ancestor <commit> origin/main`) |
| **Session** | Start a **new Claude Code session** (AGENTS.md, Sessions and context) |
| **Read first** | [AGENTS.md](../../AGENTS.md) · [INDEX](../engineering/INDEX.md) (name map) · [m1-076 report](../engineering/reports/2026/11/2026-11-17-m1-076-rename-stage-3.report.md) · [m1-076 design](m1-076-rename-stage-3-design.md) §10 · for stage 4: [m1-073 rename design](m1-073-rename-design.md) §4, §8 D3 |

## 1. Where things stand

**Done in m1-076** (D-GIT-78):
- Modules, tasks and every code name are `wms-*`.
- The migration `wms-rename-stage-3` renames the stored type names, the entrance values and the
  scoped names, in docs and in saved versions.
- The local database has been migrated.
- Tested on SQLite and on MongoDB.

**Open, for the owner**

1. Approve the commit, push and PR of m1-076; `staging-arm64` must pass on the PR.
2. Deploy on OCI outside business hours (staging runbook §12.5). Rollback after it is a restore.
3. Decide the staff URL `/assurer/form-submissions` (INDEX name map, open row): keep it, or rename
   it with a redirect for links in sent emails.
4. Still open from earlier: the Quiet and Bold themes on the OCI site (D-CONTENT-18); the slideshow
   there (m1-072).

## 2. Recommended next task

The owner chooses one, each with a design note first:

- **Rename stage 4:** the visible labels are listed in the INDEX name map:
  - widget labels such as "Assurer Hero" and the other i18n labels;
  - the home page hint;
  - the demo form title;
  - the logo file name and `alt` text;
  - the demo PDF.

  D3 is decided per label: Assurer World stays the company name.
- **Theme follow-ups**, after the owner has seen the presets on the OCI site.

Later: rename stage 5 (Compose project, volumes, database, `ASSURER_*`, `shortName`); backup status
in the Health tab and the read-only MongoDB viewer (D-DB-24).

## 3. Lessons from m1-076

- Inventory stored names on a real database copy, not only in code. That found two of them:
  - saved versions in `aposDocsVersions` (packed);
  - `scopedArrayName` / `scopedObjectName`, which core stores and reads back.
- Copy a SQLite file with `VACUUM INTO`, and delete a target's `-wal` / `-shm` before copying over
  it. A leftover WAL silently replaced a fresh copy and hid a bug for one run.
- A running `npm start` locks module folders on Windows; the owner stops it.
- Apostrophe redirects a login to `baseUrl`. For an isolated editor test, run a second server on a
  database copy with `APOS_BASE_URL=http://<name>.localhost:<port>`.
- Chrome `resize_window` did not change the viewport here; same-origin iframes of fixed width
  did.

## 4. Limits

No change to WordPress. Commit, push and PR need the owner's approval. Anything on the OCI server is
run by the owner.

## 5. Prompt for the new session

> Start m1-077. Read AGENTS.md and docs/milestones/m1-077-handoff.md first, check that the m1-076
> PR is on main, confirm the task with me, write the design note and stop for my approval.
