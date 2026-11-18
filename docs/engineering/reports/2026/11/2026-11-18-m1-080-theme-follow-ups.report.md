# m1-080 report: theme follow-ups

| | |
|---|---|
| **Task** | m1-080 (theme follow-ups in the [m1-080 handoff](../../../../milestones/m1-080-handoff.md) §2, the owner's choice) |
| **Date** | 2026-11-18 |
| **Scope** | Comparison of the new site with the original WordPress site; the Global Styles fault (visitors never got the theme's CSS or preset); background and padding for section widgets; footer links; the original's content and photos rebuilt in the local `wms-local` container. Not in scope: the OCI site, WordPress, the default preset (D-CONTENT-25 Q7), the menu (Q4) |
| **Prompt** | [2026-11-18-m1-080-theme-follow-ups.prompt.md](../../../prompts/2026/11/2026-11-18-m1-080-theme-follow-ups.prompt.md) |
| **Design** | [m1-080 theme follow-ups](../../../../milestones/m1-080-theme-follow-ups-design.md), decided by the owner (D-CONTENT-25): all recommendations; as built in §9 |
| **Branch** | `feat/m1-080-theme-follow-ups` from `origin/main` at `8fd8982` (PR #97 merged). Committed, pushed and PR opened with the owner's approval; merge waits for the owner |

Checks marked agent-executed were run by the agent. They are not human approval.

## Requirements

- Visitors see the same Global Styles and preset as editors, on new and existing sites (Q1 a).
- Editors can put a colour or photo behind a section without wrapping it in a layout (Q1 a, Q3 a).
- The footer can list links such as a sister company's site (Q1 a).
- The original's content and look rebuilt in the local container for the preset choice (Q1 a, Q2 a).

## Work completed

- **Comparison** (design §2): main text matches the original almost word for word; missing were
  the hero photo and sentence, the footer, the wall-logo band and the photo backgrounds.
- **A1** visitor stylesheet: core 4.34.0 saves the styles document before the global document
  exists on a new site, so the stylesheet that visitors receive was never stored. A handler in the
  styles override saves the styles document once (official `update`) wherever the stylesheet is
  missing, at every start and `migration:migrate`.
- **A2** core `background` and `padding` style presets on `wms-feature-grid`, `wms-stats` and
  `wms-organizations`; `padding` on the layout widget; `box-sizing: border-box` on widget style
  wrappers so a padded full-width layout does not overflow.
- **A3** `footerLinks` in Global Content, rendered in the footer; external URLs checked like the
  other link fields.
- **B** (local container only): image rebuilt from `origin/main` plus this branch; patterns
  seeded; WordPress import (348 created, 0 failed) published locally; the m1-079 home proof copied
  in; seven photos from the original (owner-approved) uploaded; footer filled; home rebuilt with the
  original hero and photo bands.

## Files changed

| File | Change |
|---|---|
| `modules/@apostrophecms/styles/index.js` | `ensureVisitorStylesheet` handler (A1) |
| `modules/wms-feature-grid-widget/index.js`, `modules/wms-stats-widget/index.js`, `modules/wms-organizations-widget/index.js` | `background` and `padding` style presets (A2) |
| `modules/@apostrophecms/layout-widget/index.js` | `padding` style preset (A2) |
| `modules/asset/ui/src/scss/_wms.scss` | `box-sizing` on widget style wrappers |
| `modules/@apostrophecms/global/index.js` | `footerLinks` field, Footer group, URL check (A3) |
| `views/layout.jsx`, `modules/asset/ui/src/scss/_corporate.scss` | footer links list (A3) |
| `scripts/smoke-test.mjs` | two checks: stylesheet linked for visitors, and served |
| `docs/milestones/m1-080-theme-follow-ups-design.md`, `docs/milestones/m1-081-handoff.md` | design note, handoff |
| `docs/engineering/decision-register.md`, `docs/engineering/INDEX.md`, this report, the prompt record | records |

## Tests executed and actual results

| Command | Result |
|---|---|
| `npm run lint` | PASS, no warnings |
| `npm run test:unit` | PASS, 128/128 |
| `npm run test:ci` (new temporary SQLite database, port 3100: smoke, editor workflow, content model, SEO, publishing workflow, data dashboard, persistence after restart, redirects, WordPress import twice, forms, security, HTTPS-proxy security) | PASS, every suite; smoke 20/20 including the two new Global Styles checks |
| `npm run test:smoke`, `test:workflow`, `test:persistence` against the developer server on port 3000 | NOT RUN separately: that server was started before this task with the old code, and the agent was not allowed to stop it. The same three suites ran inside `test:ci` above on the new code |
| A1 on two new SQLite databases (`migration:migrate`) | Without the handler: no stylesheet on either global document. With it: 569 bytes on draft and published; second run unchanged (same version) |

`npm run test:ci` ran twice: after A1, and again on the final code (with A2's padding preset, the
`box-sizing` rule and the footer links). Both runs passed every suite; lint ran again after each
change (PASS).

## Browser acceptance checklist (Chrome, agent-executed)

Local only: the `wms-local` container. Visitor checks on `127.0.0.1:3042` (no session cookie);
375 and 768 px in same-origin iframes, because the window cannot be resized.

| Check | Result |
|---|---|
| Original vs new, page text and screenshots top to bottom at 1440 | PASS (findings in design §2) |
| Logged out: body text 18 px / line height 1.5 at 1440, 16/24 at 768 and 375, on a site where nobody saved Global Styles | PASS |
| Logged out: hero photo, orange category band, navy figures, marble, linen, spools and factory bands; wall-logo photo; footer text, address, phone, email, links, © line | PASS |
| No horizontal overflow at 375, 768, 1440 | PASS (after the `box-sizing` fix; before it, a padded layout overflowed by 64 px at 1440) |
| As a disposable **editor**: Edit, select the category grid, Styles shows Background and Padding; pick a teal colour, Save | PASS |
| Draft change hidden from visitors before Update (logged-out page still orange) | PASS |
| After Update, visitors see teal | PASS |
| Editor has no Global Styles button | PASS |
| As admin: Global Styles → Theme → Bold, Update; logged out the body class is `wms-theme-bold` | PASS; set back to Classic through the same UI, checked logged out |
| Footer link with a relative URL refused by the server | PASS (API: "Website addresses must start with https:// or http://") |

No screenshots saved.

## Implicit state review

- **Visitor stylesheet present or missing** (made explicit): before, whether visitors got the
  theme depended on whether an admin had ever pressed Save, and editors could not see the
  difference. Now one handler owns the rule "every global document carries the stylesheet", runs
  at start and migrate, and stops once it holds. The comment names the core cause and when to
  remove it.
- **Preset class**: travels with the stylesheet; covered by the same rule.
- **Section background and padding**: core style fields, one place each; no new state.
- **Footer parts shown only when filled**: the same rule now covers `footerLinks` (an item without
  text or link is not shown).

## Security observations

- No new endpoint. `footerLinks` URLs go through core `url` sanitization and the project's
  `rejectNonWebUrls` (http and https only).
- The startup handler writes only the styles document through the official `update`, as the
  system task user; it reads nothing from requests.
- The original WordPress home page contains hidden casino spam text: a likely sign of a
  compromised WordPress site. Reported to the owner (design §2.4); nothing changed there.
- The local admin password of the container is the entrypoint default (no `WMS_ADMIN_PASSWORD`
  set); acceptable for a 127.0.0.1-only container, not for a shared one.
- Test editor password generated and kept in the session scratch folder; the account is archived.

## Known limitations

- Bands are as wide as the content, not the window (the original's are full width).
- No office photo was found among the original's backgrounds; the figures band is navy.
- Text on photo backgrounds stays dark (Q3 a): photos need a light overlay.
- The fix relies on Apostrophe's `migration:requirements` order (migration module before styles);
  a core change there would show in the new smoke checks.

## Unresolved decisions

- D-CONTENT-24 Q4 / D-CONTENT-25 Q7: the default preset, on the result in the container.
- Q6: the owner files the core fault with ApostropheCMS.

## Rollback guidance

Revert the branch's code commit. The handler only adds a stored stylesheet, which core would also
write at the next Global Styles save; nothing to undo in the database. Background and padding
values that editors set stay stored on widgets but are ignored once the presets are removed.

## For the owner

1. Review and merge the m1-080 PR.
2. Look at the home page in the container logged out (`http://127.0.0.1:3042/`) and choose the
   default preset (Global Styles → Theme).
3. Have the original WordPress site checked for the injected spam (design §2.4).
4. Optionally file the core fault with ApostropheCMS (Q6): "styles singleton inserted before global
   on a new database; `mirrorToGlobal` updates nothing; visitors get no stylesheet until a save".
5. After the release on OCI: check the site logged out (it should now get the theme's text size);
   fill the footer and footer links in Global Content; rebuild the home photo sections.

## Recommended next step

See the [m1-081 handoff](../../../../milestones/m1-081-handoff.md).

## Left over

- `wms-local` container: imported content published, home rebuilt with photos, seven uploaded
  photos (titles start with "m1-080"), footer filled, test editor archived (username renamed by
  core on archive). Local only.
- `data/m1-079-audit.db` still kept (m1-079); no longer needed for the preset choice, which now
  happens in the container. The owner may remove `data/m1-079-audit.db*`.
- The developer server on port 3000 (old code, normal database) is still running; the agent was
  not allowed to stop it.
- Session scratch folder (outside the repository): the downloaded photos, helper scripts and the
  test editor's password.
