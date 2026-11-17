# m1-076 start handoff (2026-11-17)

| | |
|---|---|
| **Prepared** | 2026-11-17, by the agent at the end of m1-075 (agent-executed; not a human approval) |
| **State of `main`** | `6f8631f` when written. This file is in the m1-075 PR (branch `chore/m1-075-rename-stage-2`). Before starting, check that its commit is on `origin/main` (`git merge-base --is-ancestor <commit> origin/main`) |
| **Session** | Start a **new Claude Code session** (AGENTS.md, Sessions and context) |
| **Read first** | [AGENTS.md](../../AGENTS.md) · [INDEX](../engineering/INDEX.md) (name map) · [m1-075 report](../engineering/reports/2026/11/2026-11-17-m1-075-rename-stage-2.report.md) · [m1-075 design](m1-075-rename-stage-2-design.md) · for stage 3: [m1-073 rename design](m1-073-rename-design.md) §4 |

## 1. Where things stand

**Done in m1-075** (D-GIT-77): the images are `ghcr.io/mimnets/wms-*`; scripts, paths, log prefix
and app user inside them are `wms`; `assurer-deploy-hook` stays as a link until stage 5. Local
build and stack checks pass; arm64 and the release push run in CI.

**Open, for the owner**

1. Approve the commit, push and PR of m1-075; `staging-arm64` must pass on the PR.
2. After the merge and the release tag: check that the four `wms-*` packages are private.
3. Deploy on OCI outside business hours (runbook §12.4): every service restarts once.
4. Still open from earlier: try the Quiet and Bold themes on the OCI site (D-CONTENT-18); check the
   slideshow there (m1-072).

## 2. Recommended next task

The owner chooses one, each with a design note first:

- **Rename stage 3**: module folders `assurer-*` → `wms-*`, CSS classes, the AGENTS.md prefix rule,
  and an idempotent `@apostrophecms/migration` for stored `type` values. Best after the stage-2
  deploy has run on OCI. Needs a backup before the deploy.
- **Theme follow-ups**, after the owner has seen the presets on the OCI site.

Later: rename stages 4–5; backup status in the dashboard's Health tab and the read-only MongoDB
viewer (D-DB-24).

## 3. Lessons from m1-075

- Narrow `sed` patterns only, with no `\\\[`-style escapes: one wide pattern turned `tr -d '\r'` into
  a character class. Compare every changed line against "old line with the name replaced".
- In Git Bash, `docker compose exec … /abs/path` needs `MSYS_NO_PATHCONV=1`.
- Ports 80 and 443 on this PC belong to WSL; bind a local test stack with `ASSURER_HTTP_BIND` and
  `ASSURER_HTTPS_BIND`, and a separate project name (`-p`).
- nginx answers a bare-IP HTTP request with 444 (empty reply); send `Host: localhost`.

## 4. Limits

No change to WordPress. Commit, push and PR need the owner's approval. Anything on the OCI server is
run by the owner.

## 5. Prompt for the new session

> Start m1-076. Read AGENTS.md and docs/milestones/m1-076-handoff.md first, check that the m1-075
> PR is on main, confirm the task with me, write the design note and stop for my approval.
