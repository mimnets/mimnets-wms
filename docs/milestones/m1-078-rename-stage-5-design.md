# m1-078: rename stage 5, stored infrastructure names (design)

| | |
|---|---|
| **Task** | m1-078 |
| **Date** | 2026-11-18 |
| **Author** | The agent (agent-executed; not a human approval) |
| **Status** | **D-GIT-80 decided 2026-11-18 by the owner: approved** ("please proceed with your recommendations"), every recommended answer in §8. Built in m1-078; notes in §10 |
| **Related** | [m1-078 handoff](m1-078-handoff.md) · [m1-073 rename design](m1-073-rename-design.md) §4, §5 · [m1-068 release pipeline design](m1-068-release-pipeline-design.md) (project switch precedent) · [staging runbook](../runbooks/staging-container.md) §12.3 · [INDEX name map](../engineering/INDEX.md#name-map) |

The facts come from the repository at `fb7a890` (PR #94 merged). The owner chose this task on
2026-11-18.

## 1. The request and the limits

Stage 5 renames the **stored** names: names that data, volumes, cookies or server files carry.
A changed stored name orphans what is stored under the old name, so for each name this note says
how the data moves and how to roll back (handoff §2).

Limits: minimal change; no new package; Community Edition; ADR-0002 (Apostrophe APIs for content,
no raw content writes); no `apos-db-restore`; nothing deleted (old volumes, old packages and old
files stay until the owner removes them, each with its own approval); every step on OCI is the
owner's.

## 2. Inventory

From `git grep -i -E "assurer|vcl-assurer"` outside `docs/` and `package-lock.json`, with company
names (D3 A), the kept staff URL and the stage-3 migration and its test left out.

| # | Name | Where | Stored in | Effect of a change |
|---|---|---|---|---|
| 1 | Compose project `mimnets-cms` | `docker/staging/compose.yaml` | Volume, network and container names (`mimnets-cms_mongo-db` and seven more volumes) | New empty volumes: the site starts empty unless the data moves |
| 2 | Database `assurer`, MongoDB user `assurerApp` | `app-env.sh`, `mongo-entrypoint.sh` | The `mongo-db` volume; every PBM backup and oplog slice | The app finds an empty database unless the data moves; backups made before the change restore the old name |
| 3 | 33 `ASSURER_*` settings (`ASSURER_DOMAIN`, `ASSURER_IMAGE_TAG`, `ASSURER_PROXY_MODE` and the like) | Compose files, `docker/staging/*.sh`, CI | The server's `docker/staging/.env`, written by the setup scripts | Compose ignores the old keys; `deploy.sh` refuses without `PROXY_MODE` |
| 4 | `ASSURER_NPM_NETWORK` default `assurer-npm` | `compose.npm.yaml`, `npm-setup.sh`, `install.sh` | An external network shared with NPM on a shared host | A new default breaks a running NPM host unless its `.env` keeps the old name |
| 5 | `shortName: 'vcl-assurer-group'` | `app.js` | Browser cookies `vcl-assurer-group.sid`, `.csrf`, `.loggedIn` (Apostrophe core) | Every signed-in user signs in once more; no data is lost |
| 6 | `data/vcl-assurer-group.db` | `.env.example`, a test fixture string | The owner's local `.env` and file | Only the default for new clones; the owner's `.env` keeps working |
| 7 | Root one-container stack: project `assurer`, image `assurer-site:local`, user `assurer`, `/etc/assurer`, `assurer-entrypoint`, database `assurer` / `assurerApp`, `ASSURER_ADMIN_PASSWORD` | `Dockerfile`, `compose.yaml`, `docker/entrypoint.sh`, `docs/runbooks/docker-single-container.md` | Local volumes `assurer_*` on a PC that ran it | New empty volumes; the demo site seeds itself again |
| 8 | Proof-of-concept stacks `docker/litestream-poc`, `docker/pbm-poc`, `docker/mongodb-load-test` | Their own files | Their own volumes | Already broken since stage 3 (`assurer-demo:seed` no longer exists); `pbm-poc` builds on row 7 |
| 9 | `assurer-deploy-hook` link | `docker/staging/certbot/Dockerfile` | Renewal files of certificates issued before m1-075 | Removing the link breaks renewal of those certificates |
| 10 | Server clone `/home/ubuntu/vcl-assurer-group` | OCI server | The path only; Compose reads `site.env` from it when a container is created | None while the project name is explicit; the owner moves it |
| 11 | Old packages `ghcr.io/mimnets/assurer-*` | GitHub | Image history | Removing them ends rollback to commits before m1-075 |

The local folder (`Documents\mimnets-wms`) is already renamed; its name map row closes as done.

## 3. Design

### 3.1 New names

| Old | New |
|---|---|
| Compose project `mimnets-cms` | `mimnets-wms` |
| Database `assurer`, user `assurerApp` | `wms`, `wmsApp` (Q3) |
| `ASSURER_*` | `WMS_*`, same suffixes |
| `shortName: 'vcl-assurer-group'` | `mimnets-wms` |
| `data/vcl-assurer-group.db` | `data/mimnets-wms.db` |
| Root stack project `assurer`, image `assurer-site:local`, user `assurer`, `/etc/assurer`, `assurer-entrypoint` | `wms-local`, `wms-site:local`, `wms`, `/etc/wms`, `wms-entrypoint`; database `wms` / `wmsApp` |

The root stack becomes `wms-local`, not `mimnets-wms`, so that it never shares volume names with the
staging stack on a PC that runs both.

### 3.2 Code (rows 3, 5, 6, 7, 8, 9)

- **Settings:** every `ASSURER_` becomes `WMS_` in the Compose files, the scripts, CI and the
  runbooks. One clean set of names; no code reads both (no fallback layer kept forever).
- **NPM network (row 4):** the default for new installs becomes `wms-npm`. For a host that already
  runs NPM mode, the switch (§3.3 step 4) writes `WMS_NPM_NETWORK=assurer-npm` into its `.env`
  when the key is not set, so the running NPM stays connected.
- **`shortName`:** `mimnets-wms` in `app.js`.
- **SQLite:** `.env.example` and the fixture string. The owner's own `.env` and file are the owner's
  step (§5); the agent changes neither.
- **Root stack:** renamed as §3.1; its runbook says the old `assurer_*` volumes are not reused.
- **Proofs of concept (Q5):** recommended to leave them as they are, frozen, with one header line
  each: "Historical (m1-0xx); not maintained; not renamed in stage 5." They already do not run.
- **`assurer-deploy-hook` (Q6):** recommended to keep the link (one line) until the owner confirms
  that no certificate on any server was issued before m1-075.

### 3.3 Data on a server: a one-time switch in `deploy.sh` (rows 1, 2, 3)

The m1-068 precedent (`--switch-from-one-container`, runbook §12.3) is reused: the owner pulls
`main`, then runs `deploy.sh` with a one-time option, here `--switch-to-mimnets-wms`. Differences
from m1-068: **the data is carried over** (the m1-068 switch started empty), and the old volumes
stay untouched as the fallback.

`deploy.sh` detects running containers of project `mimnets-cms`, refuses without the option (same
as today for `assurer-staging`), and with it:

1. **Checks** (read-only): no `mimnets-wms_*` volume exists yet, or each is empty. Otherwise it
   stops and names them; it never writes over a volume.
2. **Backup:** `pbmc backup --wait` in the old `pbm` container. If it fails, nothing has changed.
3. **Stop** the old project's containers (`docker stop`; not `down`, so the containers and their
   volumes stay).
4. **Settings:** copies `.env` to `.env.before-m1-078`, then renames each `ASSURER_` key to `WMS_`
   in `.env` (the values stay), plus the NPM network key of §3.2. `site.env` holds no
   `ASSURER_` key (to be checked in the build).
5. **Volumes:** copies each of the eight `mimnets-cms_<name>` volumes to `mimnets-wms_<name>` with
   `cp -a` in a one-shot container of the mongo image, `network_mode: none`. MongoDB is stopped, so
   the file copy is consistent. The copy keeps owners and modes (secrets, PBM backups, media,
   certificates).
6. **Database (Q3 A):** starts only the new `mongo`, then, as the MongoDB admin, inside the
   container: for each collection in `assurer`, `renameCollection` to `wms` (the cross-database
   form copies documents and indexes); create `wmsApp` with `readWrite` on `wms` and the existing
   app password; drop `assurerApp`. Idempotent: it does nothing when `assurer` has no collections,
   and it stops if both databases have collections. This runs on the copy only. The same step
   is a small script in the mongo image (`wms-rename-database`), so a restore of an old backup can
   run it again (§3.4).
7. **Start** the new project as a normal release (`up -d`), then the usual checks (app healthy,
   PBM agent OK), plus a document count in `wms` against the count taken in the old database
   before step 3.

The new `mongo-entrypoint.sh` creates `wmsApp` on an empty database, so new installs and CI never
see `assurer`.

### 3.4 Backups after the switch

The PBM backups made before the switch are in the copied `pbm-backups` volume and in the new
`admin` database, so `pbmc list` still shows them. Restoring one brings back the `assurer`
database and the `assurerApp` user. The restore runbook gets one step for that case: run
`wms-rename-database` in `mongo`, then restart the app. New backups contain `wms` only. The
restore drill in CI (`staging-arm64`) uses fresh volumes, so it tests the new names directly.

### 3.5 Rollback

A rollback across stage 5 is **not** `deploy.sh --rollback`; the new `deploy.sh` writes `WMS_`
keys, which an older Compose file does not read. The runbook gives the steps (as §12.3 step 5):

```sh
$S stop                                              # the new project
cp docker/staging/.env.before-m1-078 docker/staging/.env
git checkout --detach <previous release>
docker start $(docker ps -aq --filter label=com.docker.compose.project=mimnets-cms)
```

The old volumes were never written after step 3, so the site returns as it was at the switch.
Content edited after the switch is lost on rollback. Removing the old `mimnets-cms_*` volumes and
containers is a later step with its own approval, after the owner has checked the new site.

## 4. Tests

- `npm run lint`, `test:unit`, `test:smoke`, `test:workflow`, `test:persistence`,
  `test:security`, `test:forms` (in that order: forms first, handoff §3), `test:ci`.
- New unit test for the `.env` key rename (step 4): every `ASSURER_` key renamed, values and
  comments kept, a second run changes nothing, other keys untouched.
- `bash -n` and `shellcheck` (if present) on every changed script.
- **Switch drill on Docker (local, `amd64`):** start `mimnets-cms` from images of `fb7a890` built
  locally (`compose.build.yaml`), add content as an editor, take counts; run the new `deploy.sh
  --here --switch-to-mimnets-wms`; compare counts and media; sign in (once more, new cookie); run
  it again (nothing changes); roll back by §3.5 and check the old site. Memory on the owner's PC is
  short: one stack at a time, stopped after the drill (handoff §3).
- **Restore drill:** restore a backup from before the switch into the new project, run
  `wms-rename-database`, check the site.
- Hosted CI and `staging-arm64` on the PR (fresh volumes with the new names).
- **Chrome (agent-executed):** as a disposable editor, sign in, edit and publish a draft on the
  switched site; logged out, the draft is hidden. The old cookies are ignored (sign-in asked once).
- `git grep -i -E "assurer|vcl-assurer"` outside `docs/`: only company names, the staff URL, the
  stage-3 migration and its test, the frozen proofs of concept (Q5), the hook link (Q6) and the
  switch code itself.

## 5. Production steps (the owner, after the merge)

On OCI, in a quiet hour (every container is recreated; a few minutes down; everyone signs in again):

1. `git switch main && git pull` in the clone.
2. `bash docker/staging/deploy.sh --switch-to-mimnets-wms`. It ends with the counts and "Done".
3. Check the site; sign in again.
4. Optional, any time later: move the clone to `/home/ubuntu/mimnets-wms` (`mv`, then run
   `deploy.sh --here` from the new path once, so Compose records the new `site.env` path).
5. Later, each with its own approval: remove the `mimnets-cms_*` volumes and containers; delete the
   old `ghcr.io/mimnets/assurer-*` packages (Q7).

Locally (owner's PC, optional): rename `data/vcl-assurer-group.db` to `data/mimnets-wms.db` and
change `APOS_DB_URI` in `.env`; Docker volumes `assurer_*` of the root stack can be removed when
no longer wanted.

## 6. Implicit state review (preview)

- **Server stack state** gains one transition: `mimnets-cms running` → `switched` (new project
  running, old stopped with volumes) → `old removed`. `deploy.sh` tells the states apart from
  Docker labels and volumes alone; a half-done switch (stopped between steps) is safe to run again:
  steps 1, 4, 5 and 6 are idempotent and step 5 refuses to write over a filled volume.
- **Database name state** (`assurer` or `wms`) is explicit in one script that refuses the mixed
  state instead of guessing.
- **`.env` state**: old keys or new keys; the backup copy is written once and never overwritten.
- **Sign-in state**: old cookies become unknown; Apostrophe treats them as signed out. No error page.

## 7. After approval

Build as §3, run §4, write the report, the prompt record, INDEX (name map rows closed with the date,
task row, next ID), D-GIT-80 and the m1-079 handoff. Commit, push and PR wait for the owner.

## 8. Questions for the owner (D-GIT-80)

| ID | Question | Options | Recommended |
|---|---|---|---|
| Q1 | Approve this design (§3), with the new names in §3.1? | approve · change | Approve |
| Q2 | Carry the server data over, or start empty? | A. Carry over (copy volumes, §3.3) · B. Start empty and import again, as m1-068 | **A**: anything edited on the OCI site since the import (settings, pages, media) comes back only this way; B is simpler if the owner confirms nothing there needs keeping |
| Q3 | Database `assurer` and user `assurerApp` | A. Rename to `wms` / `wmsApp` in the switch (§3.3 step 6) · B. Keep them; close the row as kept (internal, never seen; no restore caveat) | **A**: the switch already takes the downtime and keeps the old volumes as the fallback; doing it later costs a second switch. B is the lower-risk choice if the restore caveat (§3.4) is not wanted |
| Q4 | Root one-container stack: project name | `wms-local` · `mimnets-wms-local` · other | **`wms-local`**: short, and never the staging name |
| Q5 | Proof-of-concept stacks (row 8) | A. Freeze with a header note, not renamed · B. Rename them · C. Remove them (records stay in Git history) | **A**: they already do not run; renaming dead code is work without use |
| Q6 | `assurer-deploy-hook` link | A. Keep until the owner confirms no certificate from before m1-075 exists · B. Remove now | **A** |
| Q7 | Old `ghcr.io/mimnets/assurer-*` packages | A. Owner deletes them when the old `mimnets-cms_*` volumes are removed (one decision ends rollback) · B. Keep | **A** |

## 10. As built (m1-078)

Built as §3, with these changes, each found or settled during the build and the local drill:

- **The database moves in `mongo`, not in `deploy.sh`** (§3.3 step 6). `mongo-entrypoint.sh`
  `move_old_database` runs at every start before the health check passes, so the app never meets an
  empty `wms` while `assurer` holds the site. There is no separate `wms-rename-database` script:
  restarting `mongo` is the way to run it again. It does nothing unless `listDatabases` shows
  `assurer`; only then does the user administrator hold `readWriteAnyDatabase`, revoked in a
  `finally` (the first drill run proved it cannot even list the collections without it). It
  counts the documents before and after and stops if they differ.
- **Both databases hold collections:** MongoDB stays up but never becomes ready, and the app waits
  (first built as an exit, which made `mongo` restart in a loop with no window to fix it). The
  runbook gives the drop command, which reads the `pbm` password from the secrets volume.
- **A restore of a backup from before the switch on a running site** (§3.4) leaves both databases:
  PBM restores `assurer` and its users and drops `wmsApp`, but keeps `wms`. Runbook: drop `wms`,
  restart `mongo`. Verified in the drill.
- **The old project's networks are removed** in the switch, after `docker stop`: the new `edge`
  network needs the same fixed subnet (`172.30.57.0/24`); the first drill run stopped on "Pool
  overlaps". Networks hold no data. So the way back (§3.5) is `$S down` on the new project, then the
  old release's `up -d`, not `docker start`.
- **The document count** is printed by `mongo` (§3.3 step 7), not by `deploy.sh`.
- `deploy.sh` reads the renamed settings from a private copy until the switch writes them, so the
  pull works with the new Compose files and nothing changes if it fails. It refuses any release from
  before m1-078 (its Compose project is `mimnets-cms`) and drops `WMS_PREVIOUS_TAG` at the switch.
- The domain placeholder `assurer.invalid` becomes `wms.invalid` in the settings; the nginx
  rate-limit zone `assurer_req` becomes `wms_req` (not stored).
- `ip-setup.sh`, `npm-setup.sh` and `install.sh` refuse settings that still have `ASSURER_` keys.
- `docker/staging/.env.before-m1-078` is git-ignored.
- The volume `acme-webroot` (ACME challenge files only) is not copied; Compose makes it empty.
- `scripts/security-test.mjs` checks both SQLite paths, old and new, are not served.
