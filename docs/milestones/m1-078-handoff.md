# m1-078 start handoff (2026-11-17)

| | |
|---|---|
| **Prepared** | 2026-11-17, by the agent at the end of m1-077 (agent-executed; not a human approval) |
| **State of `main`** | `235d8f7` when written. This file is in the m1-077 PR (branch `chore/m1-077-rename-stage-4`). Before starting, check that its commit is on `origin/main` (`git merge-base --is-ancestor <commit> origin/main`) |
| **Session** | Start a **new Claude Code session** (AGENTS.md, Sessions and context) |
| **Read first** | [AGENTS.md](../../AGENTS.md) · [INDEX](../engineering/INDEX.md) (name map) · [m1-077 report](../engineering/reports/2026/11/2026-11-17-m1-077-rename-stage-4.report.md) · for stage 5: [m1-073 rename design](m1-073-rename-design.md) §4, §5 |

## 1. Where things stand

**Done in m1-077** (D-GIT-79):
- The 12 widget labels have no "Assurer " prefix ("Hero", "Slideshow" and the others); the empty
  home page hint matches.
- The demo PDF producer is `mimnets-wms demo seed`.
- Company names stay (D3 A): demo form title, logo file and `alt`, footer fallback, demo hero text.
- The staff URL `/assurer/form-submissions` is kept; its name map row is closed.
- The root one-container image (`Dockerfile`, `compose.yaml`) is in the name map for stage 5.

**Open, for the owner**

1. Approve the commit, push and PR of m1-077; `staging-arm64` must pass on the PR.
2. Release it on OCI (a normal release: no migration, no setting). Editors with the admin UI open
   see the new labels after a page reload.
3. Still open from earlier: the Quiet and Bold themes on the OCI site (D-CONTENT-18); the slideshow
   there (m1-072).

## 2. Recommended next task

The owner chooses one, each with a design note first:

- **Rename stage 5:** the stored infrastructure names in the INDEX name map:
  - Compose projects `mimnets-cms` (staging) and `assurer` (root image) and their volumes;
  - database `assurer` and MongoDB user `assurerApp`;
  - `ASSURER_*` settings and the server `.env`;
  - `shortName: 'vcl-assurer-group'` (cookie names: every signed-in user signs in again);
  - `data/vcl-assurer-group.db`, the server clone path, the old `ghcr.io` packages.

  Renaming a stored name orphans data, so the design must say, per name, how the data moves and
  how to roll back. Production steps are the owner's, with their own approval.
- **Theme follow-ups**, after the owner has seen the presets on the OCI site.
- **Backup status in the dashboard's Health tab** (D-DB-24), later the read-only MongoDB viewer.

## 3. Lessons from m1-077

- `test:forms` runs its tasks (`node app …`) with `APOS_DB_URI` from `.env`. When testing against
  a second server on a database copy, set `APOS_DB_URI` to the copy in the shell too; `--env-file`
  does not override a variable that is already set.
- Run `test:forms` before `test:smoke` and `test:security` on the same server, or expect 429s: those
  suites use up the per-IP form limit, and the forms suite clears it only through its own tasks.
- Memory was short on the owner's PC: a background server was stopped by Claude Code. Keep one
  extra server at most, and stop it when the checks are done.
- A label-only change is verified fastest by reading the "Add Content" menu text in the page.

## 4. Limits

No change to WordPress. Commit, push and PR need the owner's approval. Anything on the OCI server is
run by the owner.

## 5. Prompt for the new session

> Start m1-078. Read AGENTS.md and docs/milestones/m1-078-handoff.md first, check that the m1-077
> PR is on main, confirm the task with me, write the design note and stop for my approval.
