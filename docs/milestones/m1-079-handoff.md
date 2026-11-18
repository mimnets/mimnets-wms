# m1-079 start handoff (2026-11-18)

| | |
|---|---|
| **Prepared** | 2026-11-18, by the agent at the end of m1-078 (agent-executed; not a human approval) |
| **State of `main`** | `fb7a890` when written. This file is in the m1-078 PR (branch `chore/m1-078-rename-stage-5`). Before starting, check that its commit is on `origin/main` (`git merge-base --is-ancestor <commit> origin/main`) |
| **Session** | Start a **new Claude Code session** (AGENTS.md, Sessions and context) |
| **Read first** | [AGENTS.md](../../AGENTS.md) · [INDEX](../engineering/INDEX.md) · [m1-078 report](../engineering/reports/2026/11/2026-11-18-m1-078-rename-stage-5.report.md) · [staging runbook](../runbooks/staging-container.md) §12.6 |

## 1. Where things stand

**Done in m1-078** (D-GIT-80): the stored names are renamed in code. Project `mimnets-wms`,
database `wms` / `wmsApp`, `WMS_*` settings, cookie prefix `mimnets-wms`, SQLite default
`data/mimnets-wms.db`, root stack `wms-local`. `deploy.sh --switch-to-mimnets-wms` moves a server
once; `mongo` moves the database at start. The rename's name map has no planned row left; what
stays old is recorded there (staff URL, company names, `assurer-deploy-hook`, frozen proofs of
concept, old packages until the old volumes go).

**Open, for the owner**

1. Approve the commit, push and PR of m1-078; `staging-arm64` must pass on the PR.
2. Run the switch on OCI (staging runbook §12.6), in a quiet hour; everyone signs in again. It is
   the first full run of `deploy.sh --switch-to-mimnets-wms` (its parts ran in the local drill).
3. Later, with their own approval: remove the `mimnets-cms` containers and volumes together with the
   old `ghcr.io/mimnets/assurer-*` packages; optionally move the server clone path.
4. Still open from earlier: the Quiet and Bold themes on the OCI site (D-CONTENT-18); the slideshow
   there (m1-072).

## 2. Recommended next task

The owner chooses one, each with a design note first:

- **Theme follow-ups**, after the owner has seen the presets on the OCI site.
- **Backup status in the dashboard's Health tab** (D-DB-24), later the read-only MongoDB viewer.
- If the OCI switch shows a problem: fix it first, from the owner's `deploy.sh` and `mongo` logs.

## 3. Lessons from m1-078

- Docker networks with a fixed subnet outlive `docker stop`; a second project with the same subnet
  fails with "Pool overlaps". Remove or `down` the other project's networks first.
- The MongoDB user administrator (`userAdminAnyDatabase`, `clusterAdmin`) cannot list a database's
  collections. `listDatabases` works.
- A PBM logical restore of a full backup keeps databases that are not in the backup and replaces the
  users.
- On the owner's PC, Git Bash rewrites `/paths` passed to `docker.exe`; `MSYS_NO_PATHCONV=1` stops
  that but then `/tmp` paths break. Use Windows paths in local drill scripts.
- Chrome (Claude in Chrome) cannot attach to a self-signed certificate warning page. For browser
  checks of the staging stack, use IP mode on a loopback port.
- BuildKit can time out exporting images while another stack starts; build first, then start.
- **Kiri is the container tool on the owner's PC** (AGENTS.md, Project conventions, 2026-11-18):
  `C:\Users\VCL-Admin\AppData\Local\Kiri\bin\kiri.exe` (`kiri compose …`); Docker Desktop is being
  removed. Never `kiri share` without approval. The m1-078 drill passed on Kiri.

## 4. Limits

No change to WordPress. Commit, push and PR need the owner's approval. Anything on the OCI server is
run by the owner.

## 5. Prompt for the new session

> Start m1-079. Read AGENTS.md and docs/milestones/m1-079-handoff.md first, check that the m1-078
> PR is on main, confirm the task with me, write the design note and stop for my approval.
