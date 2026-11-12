# m1-073 start handoff (2026-11-12)

| | |
|---|---|
| **Prepared** | 2026-11-12, by the agent at the end of m1-072 (agent-executed; not a human approval) |
| **State of `main`** | `63e691f` when written. This file is on branch `feat/m1-072-slideshow`, in the same PR as m1-072 (not in a separate handoff PR as in m1-071). Before starting, check that this file's commit is on `origin/main` (`git merge-base --is-ancestor <commit> origin/main`) |
| **Session** | Start a **new Claude Code session** (AGENTS.md, Sessions and context) |
| **Read first** | [AGENTS.md](../../AGENTS.md) · [INDEX](../engineering/INDEX.md) · [m1-072 report](../engineering/reports/2026/11/2026-11-12-m1-072-slideshow.report.md) · [m1-072 design](m1-072-slideshow-design.md) §11–12 · [m1-069 prompt record](../engineering/prompts/2026/11/2026-11-12-m1-069-arm64-restore-drill.prompt.md) (the owner's rename decision) · [m1-068 design](m1-068-release-pipeline-design.md) (images and `deploy.sh`) |

## 1. Where things stand

**Done in m1-072** (D-CONTENT-22): a pause/play control on autoplay slideshows (WCAG 2.2.2) with
a sticky pause; hidden slides `inert`; swipe; banner slides (eyebrow, heading with a level, one H1
per slideshow, text, up to 2 buttons shared with the hero through `lib/banner.js`, text position,
overlay); height, width (full width without sideways scroll), fade or slide, slow zoom, text
entrance and controls options; an "Entrance animation" style on layouts, columns and the section
widgets (`lib/motion.js`, core styles API); the slideshow in layout columns. No new package, no
migration. Tests and Chrome checks as an editor in the report.

**Open, for the owner**

1. **Push and merge the m1-072 PR** (branch `feat/m1-072-slideshow`, committed, not pushed). This
   handoff is in that PR.
2. **Check m1-072 on the OCI site** after the merge, the `release` run and `deploy.sh`. Not yet
   checked on MongoDB.
3. Not tested in m1-072 (report): reduced motion, swipe on a real touch screen, slide reordering
   in the editor, the hidden-tab and off-screen holds. A quick look on a phone would help.
4. Optional, from m1-072: testimonials (needs a content type), text position and height for the
   hero, a stagger for grid items, brand colour presets.
5. The local dev server from the m1-072 session may still run on port 3000 without a shell
   (PID 23632). Stop it with `taskkill /PID 23632 /T /F` before starting `npm run dev`.

## 2. Recommended next task

**`m1-073`: the staged rename to `mimnets-wms`, stage 1.** Design note first.

The owner's decision (2026-11-12, m1-069 prompt record): the product becomes **mimnets-wms**
("website management system"). The GitHub repository is already renamed
(`github.com/mimnets/mimnets-wms`; the old names redirect). Everything else changes later, one
stage at a time, without breaking the site. Past prompts, reports and decisions stay as written.

Agreed stages:

1. Repository links and the package name, plus a **name map in INDEX** (old name → new name,
   dated). This is the recommended scope for m1-073.
2. The `ghcr.io` image names and `deploy.sh`.
3. Module names (`assurer-*`), with `@apostrophecms/migration` for stored widget and piece types.
4. Site text and the visible brand (option B).
5. The database name, MongoDB user, `ASSURER_*` settings, Compose project name (`mimnets-cms`)
   and volumes. Needs a backup and a proven `arm64` restore; this is production on OCI.

Points for the design note:

- An inventory first: every place that names `vcl-assurer-group`, `assurer` or `mimnets-cms`,
  grouped by stage, so the owner sees the whole map before anything changes.
- What stage 1 touches and what it must not: stored names (database, volumes, the Compose
  project) stay until stage 5, because renaming them orphans data.
- How each later stage is tested and rolled back, and which stages need the owner on the server.
- Whether the local folder name (`vcl-assurer-group`) and the Claude Code memory path change, and
  when.

**After that, in the owner's order:** the theme presets (D-CONTENT-18, D-CONTENT-20). Later, from
D-DB-24: backup status in the dashboard's Health tab, and layer 2 (read-only MongoDB viewer).

## 3. Lessons from m1-072

- **Check which server you test** (as in m1-071). Before trusting server suites or Chrome checks,
  check the process on port 3000 and its start time. Do not start a second server.
- **The smoke suite meets the form rate limit** (10 submissions per 15 minutes). Running smoke
  twice in a row gives 429 errors; wait 15 minutes or run it once.
- **Wait for `test:ci` to finish before Chrome checks**: its restarts reload the open page.
- Log in on `localhost`, not `127.0.0.1`; the login redirects there.
- In Bash, do not pass scripts with backticks to `node -e`; write a scratch file or use the Edit
  tool.
- `gh` is not installed on the owner's PC: push the branch and give the owner the PR link,
  title and description.

## 4. Limits

- No change to WordPress. Commit, push and PR need the owner's approval. Anything on the OCI
  server is run by the owner. Stages 2 and 5 touch production and need their own approval.

## 5. Prompt for the new session

> Start m1-073. Read AGENTS.md and docs/milestones/m1-073-handoff.md first, check that the m1-072
> PR is on main, confirm the task with me, write the design note and stop for my approval.
