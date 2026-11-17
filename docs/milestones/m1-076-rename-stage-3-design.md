# m1-076: rename stage 3, modules, CSS and stored types (design)

| | |
|---|---|
| **Task** | m1-076 |
| **Date** | 2026-11-17 |
| **Author** | The agent (agent-executed; not a human approval) |
| **Status** | **D-GIT-78 decided 2026-11-17 by the owner: approved** ("i approve"), every recommended answer in §8. Built in m1-076; changes while building in §10 |
| **Related** | [m1-076 handoff](m1-076-handoff.md) · [m1-073 rename design](m1-073-rename-design.md) §4 (stage 3), §7 · [m1-075 design](m1-075-rename-stage-2-design.md) · [INDEX name map](../engineering/INDEX.md#name-map) · D-GIT-76, D-GIT-77 · ADR-0002 |

This is a paper task. No code was changed. The facts come from the repository at `dd6af95`
(PR #92 merged) and `apostrophe` 4 in `node_modules`. The owner chose stage 3 on 2026-11-17 and
confirmed that the stage-2 release runs on OCI and the four `wms-*` packages are private.

## 1. The request and the limits

Stage 3 of D-GIT-76: module folders `assurer-*` → `wms-*` (D4), CSS classes, the AGENTS.md
prefix rule, and one idempotent `@apostrophecms/migration` for the stored `type` values.

Limits: no visible text changes (stage 4); no stored *infrastructure* name changes (`shortName`,
database, volumes, `ASSURER_*` settings: stage 5); no new package; past records stay as written;
production is deployed by the owner, after a backup.

## 2. Inventory

Counts from `git grep` in `modules`, `lib`, `views`, `scripts` and `app.js`.

### 2.1 Code names (no data behind them)

| Name | Count | New name |
|---|---|---|
| Module folders `modules/assurer-*` and their keys in `app.js`, imports, `apos.modules['assurer-…']`, `templateName`/`Component` references, admin-bar groups, page `types`, `withType` | 25 folders | `wms-*` |
| Tasks `assurer-*:*`: `package.json` `seed:demo`, `scripts/*`, `docker/entrypoint.sh`, `docker/staging/wms-task.sh` usage text | about 30 | `wms-*:*` |
| REST paths `/api/v1/assurer-*` (dashboard UI, tests) | follow the module names | `/api/v1/wms-*` |
| Kebab-case CSS classes and BEM blocks `assurer-…` | 1,223 matches with the above | `wms-…` |
| CSS custom properties `--assurer-*` | 42 unique | `--wms-*` |
| Data attributes `data-assurer-*` | 9 | `data-wms-*` |
| `modules/asset/ui/src/scss/_assurer.scss` | 1 file | `_wms.scss` |
| camelCase identifiers: `req.assurerSubmission`, `req.assurerImportCounts`, `assurerTrailingSlash`, `dataset.assurerNavReady`, `…EnterState`, `…SlideshowState`, Vue component `AssurerDataDashboard` | 9 names | `wms…` / `WmsDataDashboard` |
| Form spam guard: fields `_assurerWebsite`, `_assurerFill`; HMAC label `assurer-form-fill:`; headers `X-Assurer-Submission`, `X-Assurer-Submission-Key` | 5 | `_wmsWebsite`, `_wmsFill`, `wms-form-fill:`, `X-Wms-Submission`, `X-Wms-Submission-Key` |
| `@apostrophecms/form` `classPrefix: 'assurer-form'` (render only) | 1 | `wms-form` |

### 2.2 Stored names (data behind them)

| What is stored | Where | Handled by |
|---|---|---|
| Doc `type` of 4 piece types (`assurer-product`, `-organization`, `-person`, `-location`) and 2 page types (`assurer-division-page`, `-product-category-page`) | `aposDocs`, every mode (draft, published, previous) and archived docs | The migration (§3.2) |
| Widget `type` of 12 widget types (`assurer-hero`, `-slideshow`, `-product-grid`, `-product-card`, `-feature-grid`, `-stats`, `-product-list`, `-organizations`, `-people`, `-locations`, `-downloads`, `-gallery`) | Area items at any depth, in any doc, including the global doc and nested layouts | The migration |
| Entrance style values `assurer-enter-fade`, `assurer-enter-rise` (`lib/motion.js`, core `class: true`) | Top-level `entrance` field of any widget that has the style, core layout widgets included | The migration → `wms-enter-*` |
| Cache namespaces `assurer-form-rate-limit`, `assurer-form-submission-key` | `aposCache`, entries expire on their own | Renamed, not migrated: counters and the duplicate-submission keys start empty once (Q4) |
| Type names inside the dashboard activity log `details` | `dataDashboardActivity` | Not changed: it is history |
| Export archives made by `@apostrophecms/import-export` before the release | Files outside the database | Not migrated (Q5) |

Checked and **not** stored: relationship fields keep IDs only; the theme values from m1-074 are
already `wms-theme-*`; `aposMigrations` holds no project migration yet; form `classPrefix` is used
at render time only; `_id` and slugs do not contain the type.

### 2.3 Not in this stage

- Visible text: widget labels ("Assurer Hero", "Assurer Downloads" and the other i18n labels), the
  home page hint, the demo form title "DEMO – Contact Assurer", the layout logo `alt` and fallback,
  `public/images/brand/assurer-logo.png`: stage 4 (Q2).
- `ASSURER_*` settings, `shortName`, the SQLite file, database and Compose names: stage 5.
- `docker/*-poc`, `docker/mongodb-load-test`: finished experiments (m1-073 §2).
- Records: prompts, reports, milestone notes, the decision register, ADRs and
  `docs/content/wordpress-import-design.md` (a record since m1-075, §10).

## 3. Design

### 3.1 The code rename

1. `git mv` each module folder, so the history follows the files.
2. Replace names one category of §2.1 at a time, each with a narrow pattern (no wide regex, m1-075
   lesson). After each category, compare every changed line with "old line with the name
   replaced"; any other difference stops the work.
3. Gate: `git grep -i assurer -- modules lib views scripts app.js package.json` lists only what
   §2.3 keeps and the migration's own map of old names.
4. AGENTS.md "Project conventions": `assurer-` prefix → `wms-` prefix (`modules/wms-*`). README
   module table and live docs (runbooks and the current-state docs in `docs/content`) get the new
   module and task names.

### 3.2 The migration

One migration, `wms-rename-stage-3`, registered in a project override of the core migration
module (`modules/@apostrophecms/migration/index.js`, `self.add(…)` in `init`; Q6). Core runs
pending migrations on every start before `ready`, so new code never serves unmigrated data. The
staging app also runs `@apostrophecms/migration:migrate` in `app-entrypoint.sh` before it starts.

- A fixed map of the 18 old → new type names and the 2 entrance values, in a small pure
  function (`lib/rename-stage-3.js` beside the override), unit-tested in `scripts/*.test.mjs`.
- `eachDoc({}, …)` visits every doc. For each: map `doc.type`; walk its areas with core
  `apos.area.walk` and map each item's `type` and `entrance`; if anything changed, one
  `updateOne({ _id }, { $set })` with the changed top-level fields only. No dotted array paths,
  so SQLite (local, CI) and MongoDB (OCI) take the same update.
- Idempotent: a second run finds no old name and writes nothing. Core records the migration in
  `aposMigrations`, so it normally runs once. A restored backup from before stage 3 has no
  record, and the migration runs again on the next start, which is the wanted behaviour.
- A brand-new database (CI, a fresh site) is marked as migrated by core without running it.
- The WordPress import (D-CONTENT-19) writes the type names of the running code, so it needs no
  change.

### 3.3 The release

The owner deploys the release outside business hours, with a backup first (database **and**
media, `docs/runbooks/database-backup-and-restore.md`). Compose recreates the app container. The
entrypoint runs the migration while the old app is stopped, so old and new code never share data.
The site is down for that time (seconds for the current content).

One-time effects, all at the release:

- A form page loaded before the release and sent after it is refused by the spam guard (old field
  names and HMAC label). A reload fixes it.
- Form rate-limit counters and duplicate-submission keys start empty.
- Editors with an open admin UI reload once.

### 3.4 Rollback

Old code cannot read the new type names: its widgets and pieces would disappear. Rollback is
therefore: restore the pre-release backup, then `deploy.sh <old sha>` (Q3). Edits made after the
release are lost, which is why editing waits until the owner has checked the site.

Restoring any pre-stage-3 backup *later* needs nothing extra: the migration runs at the next start.
The backup runbook gets one line saying so.

## 4. Tests

| Kind | What |
|---|---|
| Automated | `npm run lint`, `test:unit` (new: the rewrite function with every old name, nested areas, the entrance values, a second run that changes nothing), `test:smoke`, `test:workflow`, `test:persistence`, `test:forms`, `test:security`; hosted CI on the PR |
| Migration on a copy (SQLite) | Copy the local database, record the counts per type, start the new code on the copy, compare: same doc counts, zero old names (doc types, widget types, `entrance`), page tree and URLs unchanged. Start again: nothing written |
| Migration on MongoDB | Local staging stack (m1-075 method, separate project name and ports): seed demo content with the **old** image, then start the new image on the same volumes; same checks as above |
| Visual | Screenshots of the home page and one page of each page type at 1440, 768 and 375 px before and after the rename, compared side by side (the CSS rename has 1,300 lines); no horizontal overflow |
| Browser (Chrome, as an `editor` account) | Add, edit and publish each of the 12 widgets and both page types; edit a piece of each type; entrance animation, slideshow, gallery lightbox, mobile nav, a contact-form submission; the data dashboard as admin; logged-out: draft not public, published visible |

## 5. Production steps (the owner, after the merge)

1. Back up database and media.
2. `bash docker/staging/deploy.sh <sha>` outside business hours.
3. Check: the app log shows that `wms-rename-stage-3` ran; the site; a page with each widget; the
   data dashboard and its Health tab.
4. If anything is wrong: §3.4.

## 6. Implicit state review (preview)

The state this stage adds: **which type names the stored content uses** versus which ones the
running code registers. It moves once, forward, at the first start of the new code, guarded by
the core migration lock and the `aposMigrations` record. Every way back into the old state, a
restore of an older backup, is caught by the same migration on the next start. The way forward
with old code (rollback) is not supported without a restore, and §3.4 says so. Transient state
(cache namespaces, form tokens in open pages, admin sessions) resets once and is listed in §3.3.
The final report repeats this review against what was built.

## 7. After approval

One branch `chore/m1-076-rename-stage-3`: §3.1, §3.2, tests in §4, the name map rows marked done,
runbook lines (§3.4, §5), the report and the m1-077 handoff. Commit, push and PR only with the
owner's approval.

## 8. Questions for the owner (D-GIT-78)

| # | Question | Options | Recommended |
|---|---|---|---|
| Q1 | Rename the code-only names beyond modules and classes: CSS variables, data attributes, camelCase identifiers, form guard fields and headers (§2.1)? | Yes · only modules and CSS classes | **Yes**: code only, one release, the only cost is the form effect in §3.3 |
| Q2 | Visible labels ("Assurer Hero" and the others in §2.3) | Stage 4 · now | **Stage 4**: this stage then changes no visible text, so the visual check in §4 is a pure "nothing changed" |
| Q3 | Rollback | Restore the backup, then deploy the old sha · also ship a reverse task | **Restore**: a reverse task must also remove the migration record, and is code that is never run |
| Q4 | Cache namespaces | Rename (empty once) · keep the old names | **Rename**: entries expire within hours anyway |
| Q5 | Export archives made before the release | Document "re-export after stage 3" · make the import rename old types | **Document**: no archive is known to be needed; the WordPress import does not use them |
| Q6 | Where the migration lives | Core override `modules/@apostrophecms/migration` · a new module `wms-rename` | **Core override**: the official place for migrations; no new module that exists only for this |

## 10. As built (m1-076)

- **Two more stored names**, found on the local database before the rename:
  - `aposDocsVersions` holds a packed copy of each doc for every version (20 local versions had
    old names). Editors can restore a version, which would bring the old names back. The
    migration unpacks, renames and packs them with core `docVersions.unpack` and `pack`.
  - Core stores `scopedArrayName` and `scopedObjectName` (`widget.<type>.<field>`,
    `doc.<type>.<field>`) on every array item and object field, and reads them back
    (`apos.util.getManagerOf`) to find their schema, for example for the hero buttons. Core sets
    them only on save, so the migration renames the type segment.
- The migration therefore walks the whole doc with core `apos.doc.walk` instead of
  `apos.area.walk`. It renames any object with `metaType: 'widget'` and any scoped name. The pure
  part is `modules/@apostrophecms/migration/lib/rename-stage-3.js`.
- It is registered in `apostrophe:modulesRegistered`, not in `init`, so that it runs after core's
  own migrations, which `@apostrophecms/document-versions` adds in its `init`.
- Not migrated, on purpose: `classPrefix: 'assurer-form'` stored on form field widgets
  (`@apostrophecms/form` sets it from the module option on every load); type names in the
  `aposMigrations` prop lists (core writes the new lists at the first start); text in content.
- **The staff URL `/assurer/form-submissions`** (and `Disallow: /assurer/` in `robots.txt`) is not
  renamed: it is not in §2, and notification emails already sent link to it. It is an open row in
  the INDEX name map.
- Docs: runbooks, `git-and-ci.md`, `STANDARDS.md`, README, `apostrophe-content-model.md` (planned
  types also become `wms-*`) and `design-tokens.md`. Server paths and names (`/opt/assurer-test`,
  `assurer-npm`, `assurer-staging`, `assurerApp`) stay until stage 5.
- `docker/entrypoint.sh` (one-container image) and `.env.example` get the new task names only.
