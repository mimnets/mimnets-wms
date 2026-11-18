# m1-080 start handoff (2026-11-18)

| | |
|---|---|
| **Prepared** | 2026-11-18, by the agent at the end of m1-079 (agent-executed; not a human approval) |
| **State of `main`** | `02285fc` when written. This file is in the m1-079 PR (branch `feat/m1-079-theme-design-pass`). Before starting, check that its commit is on `origin/main` (`git merge-base --is-ancestor <commit> origin/main`) |
| **Session** | Start a **new Claude Code session** (AGENTS.md, Sessions and context) |
| **Read first** | [AGENTS.md](../../AGENTS.md) · [INDEX](../engineering/INDEX.md) · [m1-079 report](../engineering/reports/2026/11/2026-11-18-m1-079-theme-design-pass.report.md) · [m1-079 design](m1-079-theme-design-pass-design.md) §3, §4, §10 |

## 1. Where things stand

**Done in m1-079** (D-CONTENT-24): the audit with real content; side margin, no visitor "Log in",
two card columns on tablets, 44 px "More" links; `wms-patterns:seed` (six draft-only patterns);
a home proof in the local audit database `data/m1-079-audit.db` (git-ignored, kept for Q4);
README "How it is built".

**Open, for the owner**

1. Approve the commit, push and PR of m1-079.
2. Look at the home proof (report, "For the owner" step 1) and choose the default preset
   (D-CONTENT-24 Q4).
3. After the merge and release: run `wms-patterns:seed` on the site; rebuild the real home page
   from the patterns; the content items in design §4.3 (wide photos, header call to action and
   footer in Global Settings, confirmed figures, shorter text).
4. Still open from earlier: the OCI switch (staging runbook §12.6); brand values (D-CONTENT-12);
   the privacy notice to the DPO (D-CONTENT-15); review and publish the import on OCI.

## 2. Recommended next task

The owner chooses one, each with a design note first:

- **Theme follow-ups** after the preset choice (for example the default preset, a tuned hero).
- **Run-time AI design note** (D-CONTENT-24 Q5 "both"): what AI at run time could do on this
  site, its costs, privacy and dependency gates; a note only, nothing built.
- **Backup status in the dashboard's Health tab** (D-DB-24).

## 3. Lessons from m1-079

- The Chrome window could not be resized; same-origin iframes at 375 and 768 px give real media
  and container query results.
- `@apostrophecms/user:add` reads the password up to a newline: pipe it with a trailing newline,
  once. Without one it waits; two copies are read as one longer password.
- A page inserted by a task needs `type` in the `convert` input (as `wms-demo` does), or
  `apos.page.insert` fails with "reading 'emit'".
- `node --env-file=.env` keeps a variable already set in the environment, so
  `APOS_DB_URI=… node --env-file=.env app …` points a task at another local database.
- The WordPress import keeps a home page that already has content (the demo seed's), so on the
  `wms-local` container the home page must be cleared before `--execute`.

## 4. Limits

No change to WordPress. Commit, push and PR need the owner's approval. Anything on the OCI server is
run by the owner.

## 5. Prompt for the new session

> Start m1-080. Read AGENTS.md and docs/milestones/m1-080-handoff.md first, check that the m1-079
> PR is on main, confirm the task with me, write the design note and stop for my approval.
