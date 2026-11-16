# m1-074 start handoff (2026-11-16)

| | |
|---|---|
| **Prepared** | 2026-11-16, by the agent at the end of m1-073 (agent-executed; not a human approval) |
| **State of `main`** | `373fa3f` when written. This file is in the m1-073 PR (branch `docs/m1-073-rename-design`). Before starting, check that its commit is on `origin/main` (`git merge-base --is-ancestor <commit> origin/main`) |
| **Session** | Start a **new Claude Code session** (AGENTS.md, Sessions and context). If the local folder was renamed, open it from `Documents\mimnets-wms` |
| **Read first** | [AGENTS.md](../../AGENTS.md) · [INDEX](../engineering/INDEX.md) and its Name map · [m1-073 report](../engineering/reports/2026/11/2026-11-16-m1-073-rename-stage-1.report.md) · [m1-073 rename design](m1-073-rename-design.md) §2–§5 · [m1-068 design](m1-068-release-pipeline-design.md) (images, `deploy.sh`) |

## 1. Where things stand

**Done in m1-073** (D-GIT-76): the rename design with the full inventory, and stage 1: package
name `mimnets-wms`, project titles, live repository links, the INDEX name map. Decisions: the
written form is `mimnets-wms`; the public site keeps "Assurer World" (only the product name
changes); the new prefix for modules, images and CSS is `wms-`; the local folder is renamed after
stage 1. No stored name changed. All local suites pass (report).

**Open, for the owner**

1. Push and merge the m1-073 PR (committed, not pushed, when this was written).
2. The local folder rename (m1-073 report, "For the owner" step 2), between sessions.
3. From m1-072: check the slideshow on the OCI site after the release and `deploy.sh`.

## 2. Recommended next task

The owner chooses one, each with a design note first:

- **Rename stage 2**: image names `ghcr.io/mimnets/wms-{app,mongo,nginx,certbot}`, script and
  file names inside the images, `deploy.sh`, CI (`ci.yml`, `staging-arm64.yml`). Keep `ASSURER_*`
  settings (stage 5). The old images stay on ghcr.io, so `deploy.sh <old sha>` is the rollback.
  Touches production: the owner runs the deploy.
- **Theme presets** (D-CONTENT-18, D-CONTENT-20), the next item in the owner's order.

Later: rename stages 3–5 (design §4); backup status in the dashboard's Health tab and the
read-only MongoDB viewer (D-DB-24).

## 3. Lessons from m1-073

- Apostrophe's `shortName` names the session, CSRF and `loggedIn` cookies; changing it logs
  everyone out. It is a stage 5 item, not a label.
- Check port 3000 before tests (no server was running this time); run smoke once (form rate limit).

## 4. Limits

No change to WordPress. Commit, push and PR need the owner's approval. Anything on the OCI server is
run by the owner. Stages 2 and 5 touch production and need their own approval.

## 5. Prompt for the new session

> Start m1-074. Read AGENTS.md and docs/milestones/m1-074-handoff.md first, check that the m1-073
> PR is on main, confirm the task with me, write the design note and stop for my approval.
