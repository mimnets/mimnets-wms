# m1-073: the staged rename to mimnets-wms (design)

| | |
|---|---|
| **Task** | m1-073 |
| **Date** | 2026-11-16 |
| **Author** | The agent (agent-executed; not a human approval) |
| **Status** | **D-GIT-76 decided 2026-11-16 by the owner: approved** ("go with your recommendation"), with every recommended answer in §8. Stage 1 built in m1-073 |
| **Related** | [m1-073 handoff](m1-073-handoff.md) §2 · m1-069 prompt record (the owner's rename decision) · m1-070 prompt record ("no brand in stored names") · [m1-068 design](m1-068-release-pipeline-design.md) (images, `deploy.sh`) |

This is a paper task. No code was changed. The facts come from the repository at `373fa3f`
(PR #89 merged) and `apostrophe` in `node_modules`.

## 1. The request and the limits

The owner's words (m1-069 record): "i changed the name name mimnets-wms instead mimnets-cms and
also repo change - https://github.com/mimnets/mimnets-wms.git", "wms means - website management
system". From m1-070: "i can see still assurer where it should mimnets-wms keep in mind".

Agreed rules (m1-069 report §4, m1-073 handoff): rename everything, one stage at a time, without
breaking the site. Past prompts, reports and decisions stay as written. INDEX gets a dated name map.

Limits: minimal change per stage; no new package; stored names (database, MongoDB user, volumes,
Compose project) do not change before stage 5, because renaming them orphans data; production on
OCI is changed only by the owner, with its own approval (stages 2 and 5).

## 2. Inventory

Counts come from `git grep -i`, without `package-lock.json` and the historical records
(`docs/engineering/reports`, `docs/engineering/prompts`).

| Name | Where | Kind | Stage |
|---|---|---|---|
| `github.com/mimnets/vcl-assurer-group` | `docker/staging/compose.build.yaml:11` (image `source` label); live docs: `git-and-ci.md`, `runbooks/project-test-on-oci-docker.md` | Repository link | 1 |
| `vcl-assurer-group` | `package.json` `name`, `description`; `package-lock.json` (2 `name` fields) | Package name | 1 |
| `VCL-ASSURER-GROUP` | Titles of `README.md`, `AGENTS.md`, `CLAUDE.md`; `.gitleaks.toml` `title`; `.env.example` line 1 | Project title | 1 |
| `vcl-assurer-group` | `app.js:14` `shortName` | Stored: names the session, CSRF and `loggedIn` cookies (core `express`, `login`, `admin-bar`); default database name when the URI has none | 5 |
| `data/vcl-assurer-group.db` | `.env.example:9`, the developer's local `.env`; test fixtures in `scripts/content-model.test.mjs`, `ensure-admin-guard.test.mjs`, `publishing-workflow.test.mjs`, `security-test.mjs` | Stored: local SQLite file | 5 (local) |
| `ghcr.io/mimnets/assurer-{app,mongo,nginx,certbot}` | `docker/staging/compose.yaml`, `.github/workflows/ci.yml`, `staging-arm64.yml`, `deploy.sh` | Image names | 2 |
| `assurer-*` inside images | `/etc/assurer`, `assurer-run-as`, `assurer-task.sh`, `/tmp/assurer-*`, nginx `assurer*.conf.template`, `35-assurer-npm.sh`, install log name | Script and file names in images | 2 |
| `assurer-*` modules (25) | `modules/assurer-*`, `app.js`, imports | Module names. **Stored**: piece, page and widget `type` values in the database | 3 |
| `assurer-` CSS classes, `_assurer.scss` | 110 code files, about 1,250 matches in `modules`, `views`, `lib`, `scripts` | Code only | 3 |
| `assurer-` prefix rule | `AGENTS.md` Project conventions | Rule | 3 |
| `Assurer World` | `views/layout.jsx` (2), `i18n/project/en.json` (1), `assurer-demo` (1), content | Visible brand | 4 (see §8, D3) |
| Demo PDF producer | `demo-content/files/demo-brochure.pdf` | Demo file | 4 |
| `mimnets-cms` | `compose.yaml:11` `name:`, `ip-setup.sh`, `npm-setup.sh`; live runbooks | Stored: Compose project, prefixes all 17 volumes | 5 |
| Database `assurer`, user `assurerApp` | `app-env.sh:4`, `mongo-entrypoint.sh:16` | Stored | 5 |
| `ASSURER_*` settings | `compose*.yaml`, `install.sh`, `deploy.sh`, `ci.yml`, nginx templates, server `.env` | Settings names (server `.env` holds them) | 5 |
| Local folder `vcl-assurer-group`, Claude Code memory key | Owner's PC | Local | §6 |

Not renamed: historical prompts, reports, decision-register entries and old handoffs (links to
the old repository URL still redirect); the `project:` i18n namespace and the dashboard's
`dataDashboardActivity` collection (no brand); `docker/*-poc` and `docker/mongodb-load-test`
(finished experiments; renamed only if a later task reuses them).

## 3. Stage 1 (this task, after approval)

Changes:

1. `package.json`: `name` → `mimnets-wms`; `description` → new wording (§8, D2). The two `name`
   fields in `package-lock.json` by hand (no `npm install`, no dependency change).
2. Titles of `README.md`, `AGENTS.md`, `CLAUDE.md`, `.gitleaks.toml`, `.env.example` line 1.
   AGENTS.md gains one line: the product is mimnets-wms, the site it runs is Assurer World.
3. Repository links in live documents and the `compose.build.yaml` image label →
   `github.com/mimnets/mimnets-wms`.
4. INDEX: a new section **Name map** (old name, new name, stage, date changed, task), with every
   row from §2, stages 2–5 marked "planned".

Not touched: `shortName`, the SQLite file, images, modules, CSS, stored names.

Test: lint, the four suites (no behaviour change expected), the hosted CI run on the PR and on
`main` (the label only changes image metadata), a short smoke check of the public site in Chrome.
Rollback: revert the commit. Nothing on the server changes.

## 4. Later stages

| Stage | What | How tested | Rollback | Owner on the server |
|---|---|---|---|---|
| 2 | Image names `ghcr.io/mimnets/wms-*` (D4), file and script names in images | CI builds and pushes both arches; `staging-arm64` run; `deploy.sh <sha>` on OCI | `deploy.sh <old sha>` pulls the old image names, which stay on ghcr.io | Yes: one deploy |
| 3 | Module folders `assurer-*` → new prefix (D4), CSS classes, the AGENTS.md rule; one idempotent `@apostrophecms/migration` that rewrites stored `type` values in `aposDocs` (pieces, pages) and widget `type` inside areas, draft and published | Migration tested on a copy of the local database first, run twice (second run changes nothing); all suites; Chrome as an editor: every widget and page type renders and edits | Restore the backup taken before the migration (database and media) | Yes: backup, then deploy (the migration runs on start) |
| 4 | Visible product brand (D3), demo PDF | Chrome on desktop, tablet, mobile; logged-out check | Revert | Deploy only |
| 5 | Compose project, volumes, database, MongoDB user, `ASSURER_*` settings, `shortName`, local SQLite file | Full drill on a copy first: PBM backup, restore into the new names on `arm64`, compare counts; then production in a maintenance window | Old volumes kept, not deleted, until the owner confirms; switch back by the old `.env` | Yes: the whole stage. Everyone is logged out once (new cookie names) |

Stage 3 could be easier if the OCI database is wiped and re-imported (D-CONTENT-19) after it: the
import then writes the new types. The migration is still needed for local and any other data.

## 5. Order and timing

Stage 1 now. Stages 2 and 3 are independent; 2 first (smaller, quick rollback). Stage 4 after 3
(class names settle). Stage 5 last, together with or after the final WordPress import, so data
moves once.

## 6. The local folder and Claude Code memory

Claude Code stores memory under a key made from the folder path
(`~/.claude/projects/C--Users-VCL-Admin-Documents-vcl-assurer-group/memory`). Renaming the folder
starts with empty memory unless the folder is copied.

Recommended: after the stage 1 PR is merged, between sessions, by the owner: stop every dev server
on port 3000, close editors and sessions, rename the folder to `mimnets-wms`, copy the memory
folder to the new key (`C--Users-VCL-Admin-Documents-mimnets-wms`), run `npm run dev` once. Code and
live documents have no absolute path to this folder (two m0 records do, and stay as written), so
nothing in Git changes. The agent can write
the exact PowerShell commands into the stage 1 report.

## 7. Implicit state review (for the design)

The rename has one real state: which names a running site expects versus which names its stored
data and server `.env` carry. Rule that keeps it safe: a stage that renames something stored also
ships the code that reads the old name until its migration has run (stage 3) or keeps the old
store untouched until the owner confirms (stage 5). The INDEX name map is the one place that says
which stage each name is in, for people and agents.

## 8. Decisions for the owner

| ID | Question | Options | Recommended |
|---|---|---|---|
| D1 | Approve this design and stage 1 as in §3? | approve · change | Approve |
| D2 | Written form of the name in titles | `mimnets-wms` · `MIMNETS-WMS` · `Mimnets WMS` | `mimnets-wms` in code and titles; "mimnets-wms (website management system)" in the README |
| D3 | "Everywhere including the brand": does the public site stop saying "Assurer World"? | A. No: Assurer World is the company whose site this is; only the product name changes (README, admin labels such as the data dashboard, demo files) · B. Yes, the site text too | A. Please confirm; the handoff's "option B" for stage 4 has no record behind it |
| D4 | New prefix for modules, images and CSS (stages 2–3) | `wms-` · `mimnets-` · none | `wms-` (short; `mimnets-wms-` would double the name) |
| D5 | Local folder rename | after stage 1 (§6) · after stage 5 | After stage 1 |
