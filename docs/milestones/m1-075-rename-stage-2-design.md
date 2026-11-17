# m1-075: rename stage 2, image and in-image names (design)

| | |
|---|---|
| **Task** | m1-075 |
| **Date** | 2026-11-17 |
| **Author** | The agent (agent-executed; not a human approval) |
| **Status** | **D-GIT-77 decided 2026-11-17 by the owner: approved** ("go with your recommendations"), every recommended answer in §7. Built in m1-075; see the report for changes while building |
| **Related** | [m1-075 handoff](m1-075-handoff.md) · [m1-073 rename design](m1-073-rename-design.md) §4 (stage 2) · [m1-068 release design](m1-068-release-pipeline-design.md) · [INDEX name map](../engineering/INDEX.md#name-map) · D-GIT-76 |

This is a paper task. No code was changed. The facts come from the repository at `6f8631f`
(PR #91 merged). The owner chose stage 2 on 2026-11-17. The local folder rename it waited for is
done (`Documents\mimnets-wms`).

## 1. The request and the limits

Stage 2 of D-GIT-76: the image names `ghcr.io/mimnets/assurer-*` become `ghcr.io/mimnets/wms-*`,
and the file and script names inside the images lose `assurer`. The rules from m1-073 still apply.
Nothing stored is renamed: no database, MongoDB user, volume, Compose project, network, `ASSURER_*`
setting or server file. Those belong to stage 5. Production changes only when the owner runs one
`deploy.sh`.

## 2. Inventory: what changes

| Now | After | Where |
|---|---|---|
| `ghcr.io/mimnets/assurer-{app,mongo,nginx,certbot}` | `ghcr.io/mimnets/wms-{app,mongo,nginx,certbot}` | `compose.yaml`, `ci.yml` (build check, push, release tag), `staging-arm64.yml` |
| `assurer-app-build` (local tag) | `wms-app-build` | `compose.build.yaml` |
| `/usr/local/bin/assurer-{app,task,setup,mongo,mongo-health,pbm-agent,backup-schedule,run-as}` | `wms-*` | Dockerfiles, `compose.yaml` entrypoints and health checks, the scripts that call them |
| `/usr/local/bin/assurer-deploy-hook` | `wms-deploy-hook`, with the old name kept (Q1) | certbot Dockerfile, `install.sh` |
| `/etc/assurer/`, `/usr/local/lib/assurer/` | `/etc/wms/`, `/usr/local/lib/wms/` | Dockerfiles, `mongo-entrypoint.sh`, `backup-schedule.sh`, `app-entrypoint.sh`, `wms-task`, `pbmc.sh`, `pbm-agent.sh` |
| `/tmp/assurer-mongo-ready`, `/tmp/assurer-tls-serial`, `/tmp/assurer-XXXXXX.js` | `/tmp/wms-*` | `mongo-entrypoint.sh`, `mongo-health.sh`, `deploy.sh` step 7 |
| `docker/staging/assurer-task.sh` | `wms-task.sh` | file rename (`git mv`) |
| nginx `assurer.conf.template`, `assurer-npm.conf.template`, `35-assurer-npm.sh`, `40-assurer-reload.sh`, the generated `assurer-npm.conf`, `$assurer_site`, `shared:assurer_tls` | `wms*` | `docker/staging/nginx/` (inside the image only) |
| Log prefix `[assurer]`, `[assurer-setup]` | `[wms]`, `[wms-setup]` (Q2) | the scripts above; the log greps in `ci.yml` and `staging-arm64.yml` |
| Linux user `assurer`, uid 1001 | `wms`, **uid 1001 kept** (Q2) | app Dockerfile, comments in `setup.sh` |
| `~/assurer-install-*.log`, `~/assurer-host-facts.txt`, `/tmp/assurer-pbm.$$` | `wms-*` | `install.sh`, `host-facts.sh` (new files only) |
| CA subject `CN=assurer-mongodb-ca` | `CN=wms-mongodb-ca` | `setup.sh`; only a new install makes a CA. The existing CA is kept as it is |
| Commands in current instructions (`exec app assurer-task …`) | `wms-task …` | `docs/runbooks/staging-container.md` (49 lines), the import command in `docs/content/wordpress-import-design.md`, the name map in INDEX |

## 3. What stays, and why

| Name | Why it stays |
|---|---|
| `ASSURER_*` settings, `ASSURER_NPM_NETWORK` | In the server's `.env`. Stage 5 |
| Network `assurer-npm` | Exists on the server; the owner joined NPM to it by hand. Stage 5 |
| `PLACEHOLDER=assurer.invalid` | Written to the server's `.env`; the scripts compare against it. Stage 5 |
| Database `assurer`, user `assurerApp`, `authSource=assurer` | Stored data. Stage 5 |
| `old_project=assurer-staging`, `mimnets-cms-*` container names | Names of stacks that exist or existed on the server; `deploy.sh` and the setup scripts detect them |
| Module names in commands (`assurer-wp-import:run`, `assurer-seo:…`) | Stage 3 |
| `docker/entrypoint.sh`, `docker/litestream-poc/`, `docker/pbm-poc/`, `docker/mongodb-load-test/` | Earlier test stacks, not built or deployed by CI. Not in stage 2 |
| Past designs, reports, prompts | Never rewritten (AGENTS.md, Records) |

## 4. Three traps found while taking the inventory

1. **Certificate renewals (the serious one).** `install.sh` issues the certificate with
   `--deploy-hook assurer-deploy-hook`. Certbot saves that hook name in the renewal file on the
   `certs` volume. The 12-hour `certbot renew` loop runs it after each renewal. If the image only
   has `wms-deploy-hook`, the next renewal gets a new certificate but does not copy it to
   `/etc/letsencrypt/current`. nginx then keeps serving the old one until it expires, about 30 days
   after the failed renewal, and nobody is warned. Options in Q1.
2. **`deploy.sh` runs the old copy of itself.** It reads the whole file before `git checkout`, by
   design. So the first deploy to stage 2 runs the old step 7, which looks for
   `/tmp/assurer-tls-serial` in the new mongo container. It is not there, so step 7 restarts
   MongoDB, the app and PBM once more. A rollback has the same effect in the other direction.
   Cost: about a minute of extra downtime once. No data is at risk. I recommend accepting this and
   writing it in the release notes, not adding code to read both names.
3. **This release restarts MongoDB.** An app release normally does not restart MongoDB. The image
   names change, so Compose recreates every service once: mongo, pbm, backup, nginx, certbot and
   the app. Expect the site to be down for a few minutes. `deploy.sh` takes a PBM base backup first,
   as it always does.

## 5. ghcr.io and rollback

- CI's `GITHUB_TOKEN` (`packages: write`) creates the four new packages on the first push to
  `main`. The `source` label links them to `mimnets/mimnets-wms`. A new package is **private** by
  default, the same as the current packages (m1-068). The owner checks this on the package pages
  after the first run. No GitHub setting changes.
- The server's `docker login ghcr.io` token (runbook §12.1) can read the new packages if it is a
  classic token with `read:packages`. A fine-grained token limited to the old packages would fail
  at the pull. `deploy.sh` stops then, before it changes anything.
- **Rollback:** `deploy.sh <old sha> --rollback` checks out the old Compose files, which name the
  old images. Those stay on ghcr.io (Q3). The certificate hook works in both directions (Q1 a).

## 6. Tests

| Check | How |
|---|---|
| No `assurer` left in the stage-2 scope | `grep` over `docker/staging`, `.github`; each remaining hit is listed in §3 |
| Shell scripts | `bash -n` and `shellcheck` (if installed) on every changed script |
| Images build, stack starts (amd64) | Locally on Docker Desktop: `compose.build.yaml` build, start with the local test `.env`, app healthy, HTTP→HTTPS through nginx, `pbmc status`, `exec app wms-task` with a read-only task, `[wms]` lines in the logs, both certbot hook names present. Then remove the stack and its test volumes |
| arm64 and the full drill | `staging-arm64.yml` runs on the PR (it changes `docker/staging/**`): build, backup, PITR restore |
| Push and release tag | `ci.yml` release jobs, only after the merge to `main`. The owner sees the `::notice` with the SHA |
| App suites | `npm run lint`, `test:smoke`, `test:workflow`, `test:persistence` (no app code changes, run anyway) |
| Browser | Short Chrome smoke check of the local public site (no UI change) |
| Production | Done by the owner: `bash docker/staging/deploy.sh <sha>` on OCI, then the site, the Health tab, and `docker compose … exec app wms-task …` |

## 7. Questions for the owner

| # | Question | Options | Recommended |
|---|---|---|---|
| Q1 | The certificate hook name (§4.1) | (a) Install the hook under both names in the certbot image: `wms-deploy-hook`, plus `assurer-deploy-hook` as a link to it, kept until stage 5. One line, certain to work. (b) Add `--deploy-hook wms-deploy-hook` to the `renew` command in Compose, relying on certbot letting a command-line value replace the stored one. Not verified yet. (c) Keep the old hook name | **(a)** |
| Q2 | Also rename the log prefix `[assurer]` and the in-image Linux user `assurer` (uid 1001 kept, so file ownership on the volumes stays the same)? | Yes / No, leave them for stage 5 | **Yes**: both exist only inside the images |
| Q3 | The old packages `ghcr.io/mimnets/assurer-*` | Keep them until stage 5 is done (rollback) / delete after this release | **Keep**. Deleting them later is the owner's choice and a GitHub action that needs its own approval |
| Q4 | Release timing | The owner deploys when it suits them, with a few minutes of downtime (§4.3) | Outside business hours |

## 8. Implicit state review (preview)

The state this stage touches: (1) the stored renewal hook name on the `certs` volume, which lives
longer than any image (Q1); (2) the TLS-serial marker that `deploy.sh` compares across two
releases (§4.2); (3) the name of the image each service runs, which changes once and makes Compose
recreate everything (§4.3); (4) the package visibility and access on ghcr.io (§5); (5) the server's
pull token. Every move between two releases, forward or back, is covered above. The final report
repeats this review against what was built.

## 9. After approval

One branch `chore/m1-075-rename-stage-2`: the changes in §2, the name map rows marked done, the
runbook commands, a short "first stage-2 release" note in the staging runbook (§4.2, §4.3, §5), the
tests in §6, the report and the m1-076 handoff. Commit, push and PR only with the owner's
approval.

## 10. As built (m1-075)

- `docs/content/wordpress-import-design.md` is **not** changed. Its commands are from the
  one-container stack (`exec site …`), so it is a record now. The current commands are in the
  staging runbook §4.1.
- The `[assurer-npm]` log prefix in `35-wms-npm.sh` became `[wms-npm]` (Q2).
- The image clean-up commands in the staging runbook match both `assurer-` and `wms-` images,
  because a server has both after the first stage-2 release.
- The `install.sh` host check that lists containers starting with `assurer` stays: it shows the old
  `assurer-staging` stack, which is server state (§3).
- The root `Dockerfile` (one-container image) keeps `/etc/assurer`. Only its build stage is used by
  the stack; its last stage belongs with `docker/entrypoint.sh` (§3).
