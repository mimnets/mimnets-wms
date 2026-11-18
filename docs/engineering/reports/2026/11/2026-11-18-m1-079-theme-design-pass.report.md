# m1-079 report: theme design pass

| | |
|---|---|
| **Task** | m1-079 (theme follow-ups in the [m1-079 handoff](../../../../milestones/m1-079-handoff.md) §2, the owner's choice: a design pass) |
| **Date** | 2026-11-18 |
| **Scope** | Audit of the real imported content on the three presets at 1440, 768 and 375 px; front-end fixes A1–A4; section patterns (`wms-patterns:seed`); a home proof in a local audit database; README "How it is built" (owner's request in the session). Not in scope: the OCI site, run-time AI (D-CONTENT-24 Q5: a design note later) |
| **Prompt** | [2026-11-18-m1-079-theme-design-pass.prompt.md](../../../prompts/2026/11/2026-11-18-m1-079-theme-design-pass.prompt.md) |
| **Design** | [m1-079 theme design pass](../../../../milestones/m1-079-theme-design-pass-design.md), decided by the owner (D-CONTENT-24): Q1 a, Q2 remove, Q3 a, Q4 after the proof, Q5 not now and a design note later; as built in §10 |
| **Branch** | `feat/m1-079-theme-design-pass` from `origin/main` at `02285fc` (PR #95 merged). Not committed; commit, push and PR wait for the owner's approval |

Checks marked agent-executed were run by the agent. They are not human approval.

## Requirements

- Show where the front end loses visitors, with the real content, and fix what code can fix
  (D-CONTENT-24 Q1 a).
- Remove the visitor "Log in" button (Q2).
- Give editors ready-made sections without a new widget and without anything going public (Q3 a,
  D-CONTENT-20).
- Leave the preset choice to the owner after a proof (Q4). No AI at run time (Q5).

## Work completed

- **Audit** (design §2–§3): WordPress import into `data/m1-079-audit.db` (348 drafts, 0 failed),
  published there only; 11 findings ranked. Main finding: the page structure (no hero, no H1, no
  call to action, full-screen images), not the presets, holds the site back.
- **A1** side margin on `main` (16 px); **A2** visitor "Log in" removed; **A3** two card columns on
  tablets (three from 840 px container width); **A4** "More" links at least 44 px high.
- **B** module `wms-patterns`, task `wms-patterns:seed`: a hidden draft page "Patterns (do not
  publish)" with six draft patterns (home opening, story band, trust band, category landing,
  inquiry band, contact page). Adds missing pages only; never publishes.
- **Home proof** in the audit database: the imported home sections rearranged into the patterns,
  text verbatim from the import.
- **README:** "How it is built" (three layers; what happens when the site runs) and the
  `wms-patterns` row.
- **Kiri import steps** for the owner's `wms-local` container, after a dry run there (348 to
  create, 0 failed; the home page is kept because the demo seed filled it).

## Files changed

| File | Change |
|---|---|
| `views/layout.jsx` | No visitor "Log in"; `Header` without `user` |
| `modules/asset/ui/src/scss/_wms.scss` | `.wms-main` side padding; product grid 3/4 columns from 840 px; `.wms-card__link` 44 px |
| `modules/asset/ui/src/scss/_corporate.scss`, `_sections.scss` | Three-column card grids from 840 px |
| `modules/asset/ui/src/scss/_themes.scss` | Quiet: the rule for the removed login link |
| `modules/wms-patterns/index.js`, `lib/patterns.js` (new) | The task and the six patterns |
| `app.js` | `wms-patterns` registered |
| `scripts/patterns.test.mjs` (new) | Unit tests for the patterns |
| `README.md` | "How it is built"; `wms-patterns` row |
| `docs/…` | Design note, this report, prompt record, D-CONTENT-24, INDEX, m1-080 handoff |

## Tests executed and actual results

| Command | Result |
|---|---|
| `npm run lint` | PASS, no warnings |
| `npm run test:unit` | PASS, 128/128 (includes the 5 new pattern tests) |
| `npm run test:smoke` | PASS, 18/18 |
| `npm run test:workflow` | PASS, 18/18 |
| `npm run test:persistence` | PASS, 7/7 |
| `wms-patterns:seed` twice (audit database) | PASS: first run created 7 draft pages; second run "Patterns already present; nothing changed." |
| `npm run test:ci`, `test:security`, `test:forms` | NOT RUN (not required by AGENTS.md for this change) |
| `npm run audit:check` (after the push) | FAIL on hosted CI, then PASS locally after D-SEC-11: a new high advisory, GHSA-fc5q-39xc-vjpf (`picomatch`, no patched version), not caused by this branch; accepted in the baseline by the owner, review by 2027-02-16. Three new moderate/low advisories warn only |

The first seed run failed with `Cannot read properties of undefined (reading 'emit')`: the page
type was not passed through `convert`. Fixed as in `wms-demo` before the runs above.

## Browser acceptance checklist (Chrome, agent-executed)

Local only (`127.0.0.1:3000`, audit database). 375 and 768 px were checked in same-origin iframes
of those widths, because the window could not be resized. Presets compared by the body class.

| Check | Result |
|---|---|
| Logged out, home at 1440 on Classic, Quiet, Bold: one H1, hero, presets visibly different | PASS |
| No "Log in" in the header for visitors (`.wms-header__login` absent) | PASS |
| `main` side padding 16 px; card left edge at 16 px at 375 and 768 | PASS |
| Columns: 1 at 375, 2 at 768, 3 at 1440 | PASS |
| "More" links at least 44 px high (375, 768) | PASS |
| No horizontal overflow (375, 768, 1440) | PASS |
| Logged out, `/patterns` and `/patterns/home-opening`: 404 | PASS |
| As a disposable **editor**: open a pattern (draft), Edit, copy the hero ("Widget copied to clipboard"), open Contact Us, Edit, "Paste Hero" from the Add Content clipboard group, Update | PASS |
| After publishing, a logged-out request to `/contact-us` shows the pasted section | PASS |
| Before publishing, the pasted draft is hidden from visitors on `/contact-us` | NOT TESTED: the Chrome extension disconnected during that batch; draft isolation is covered by the pattern pages' 404 |
| Admin switching the preset in Global Styles | NOT TESTED in m1-079 (unchanged; tested in m1-074) |

No screenshots saved.

## Implicit state review

As planned in design §6, unchanged by the build: one staff login entry (`/login`); pattern pages
are drafts that nothing publishes, hidden from navigation and 404 for visitors; columns follow the
container; the theme stays a body class set by admins. No new state was made explicit, because none
is spread over several places.

## Security observations

- Removing the visitor login link does not change access: `/login` and its rate limits are as
  before.
- The pattern task writes drafts only, through `convert` (the editor sanitization path); no
  endpoint added.
- The audit accounts' passwords were generated and kept in the session scratch folder, outside the
  repository; not in this report.

## Known limitations

- The hero in the proof has no photo: the import has one wide image only. The owner supplies wide
  photos (design §4.3).
- The imported intro text in the story band repeats the H1 headline word for word (content, for
  the owner).
- Patterns cannot pre-fill a gallery (it needs an image); the how-to line says what to add.

## Unresolved decisions

- D-CONTENT-24 Q4: the default preset, after the owner has seen the proof.
- Run-time AI: a design note in a later task (Q5 "both").

## Rollback guidance

Revert the branch's code commit. Pattern pages already seeded on a site stay as drafts; archive
the "Patterns (do not publish)" page in the page manager if they are not wanted.

## For the owner

1. Look at the proof: stop any server on port 3000, then in `Documents\mimnets-wms` (PowerShell):
   `$env:APOS_DB_URI='sqlite://./data/m1-079-audit.db'; node --env-file=.env app`, open
   <http://127.0.0.1:3000/>; switch the preset in Global Styles as an admin, or tell the agent
   which one. Choose the default preset (Q4).
2. The Kiri import steps given in the session (dry run, clear the demo home page, `--execute`).
3. After the merge, on a real site: `node app wms-patterns:seed` (staging runbook §4.1 wrapper:
   `wms-task wms-patterns:seed`).
4. Content items from design §4.3 (photos, footer and header call to action in Global Settings,
   confirmed figures, shorter text).

## Recommended next step

The owner chooses, each with a design note first: theme follow-ups after the preset choice; the
run-time AI design note (Q5); or the backup status in the Health tab (D-DB-24). See the
[m1-080 handoff](../../../../milestones/m1-080-handoff.md).

## Left over

- `data/m1-079-audit.db` (git-ignored) with the accounts `auditadmin` and `auditeditor`, the
  imported content published, the home proof, and the pasted hero on Contact Us. Kept for the
  owner's preset choice (Q4). Remove the three files `data/m1-079-audit.db*` when no longer
  wanted; nothing else uses them.
- The dev server was left running on the normal database (port 3000).
