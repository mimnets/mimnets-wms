# m1-083 report: menu and entrance animation after an editor refresh

| | |
|---|---|
| **Task** | m1-083 (edit-mode submenus, from the [m1-083 handoff](../../../../milestones/m1-083-handoff.md) §2, the owner's choice) |
| **Date** | 2026-11-19 |
| **Scope** | Find why desktop submenus showed open in edit mode after a refresh (m1-082 Known limitations) and fix it if it is ours. Not in scope: core changes, menu content, the OCI site, WordPress |
| **Prompt** | [2026-11-19-m1-083-refresh-scripts.prompt.md](../../../prompts/2026/11/2026-11-19-m1-083-refresh-scripts.prompt.md) |
| **Design** | [m1-083 refresh scripts](../../../../milestones/m1-083-refresh-scripts-design.md), decided by the owner (D-CONTENT-28): all recommendations |
| **Branch** | `fix/m1-083-refresh-scripts` from `origin/main` at `9cc5710` (PR #100 merged). Not committed: commit, push and PR wait for the owner's approval |

## Requirements

- Check whether the fault happens on `main`; find the cause.
- If ours, fix it within the existing design (D-CONTENT-28 Q1 a, Q2 a).
- Draft the core fault report for the owner (Q3 a).

## Work completed

- Reproduced on `main` in the release build (container), not in dev: every editor refresh (Edit,
  Preview, Update) replaces the header, and the new nav was never enhanced, so its submenus showed
  in the no-JavaScript layout. Same cause left `wms-motion` on `<html>` in edit mode (design §2–3).
- Cause: `apos.util.onReady` subscribes to `refreshed` in a `setTimeout(0)` that, in the release
  build, fires before the admin bundle creates `apos.bus`; the subscription is skipped silently.
- New `modules/asset/ui/src/on-page-ready.js`: runs a function on `DOMContentLoaded` and on every
  `refreshed`, subscribing once `apos.bus` exists. `nav.js` and `motion.js` use it.
- `nav.js`: the `document` click and `matchMedia` listeners are added once per page and act on the
  navs present, so repeated enhancement does not pile up listeners on detached navs.

## Files changed

| File | Change |
|---|---|
| `modules/asset/ui/src/on-page-ready.js` | new: ready-and-refresh helper |
| `modules/asset/ui/src/nav.js` | uses the helper; page-wide listeners once; `setMenu` and `closeSubmenus` take the nav |
| `modules/asset/ui/src/motion.js` | uses the helper |
| `docs/milestones/m1-083-refresh-scripts-design.md`, `docs/milestones/m1-084-handoff.md` | design note, handoff |
| `docs/engineering/decision-register.md`, `docs/engineering/INDEX.md`, this report, the prompt record | records |

## Tests executed and actual results

| Command | Result |
|---|---|
| `npm run lint` | First run: 1 error (`space-infix-ops` in `motion.js`, from the edit). Fixed; re-run PASS, no warnings |
| `npm run test:unit` | PASS, 134/134 |
| `npm run test:smoke` (developer server, port 3000) | PASS, 20/20 |
| `npm run test:workflow` | PASS, 25/25 |
| `npm run test:persistence` | PASS, 7/7 |

The suites call the API and do not cover browser scripts; no automated browser suite exists.

## Browser acceptance checklist (Chrome, agent-executed)

Local container `wms-local` (`127.0.0.1:3042`, release build), rebuilt from this branch with
`kiri compose up -d --build`. Window 1440 × 735. Signed in as admin by the owner (the agent did
not handle the password).

| Check | Result |
|---|---|
| Before the fix (same container, `main`): Edit → new nav class `wms-nav` only, submenus `display: block; position: static`; `apos.bus.$emit('refreshed')` by hand changes nothing; `wms-motion` kept in edit mode | FAIL as reported (the fault reproduced) |
| Dev server before the fix: Edit → nav enhanced again | PASS (fault does not show in dev) |
| After the fix: preview mode load, nav enhanced, 2 parents | PASS |
| Click **Edit**: nav replaced and enhanced (`wms-nav--enhanced`), both submenus `display: none`, `wms-motion` removed | PASS |
| In edit mode, click "Products submenu": dropdown opens under Products (screenshot checked) | PASS |
| Click outside (demo banner): both `aria-expanded="false"`, no `is-open` | PASS |
| Click **Preview**: nav replaced and enhanced, submenus closed, `wms-motion` back on `<html>` | PASS |
| Edit again (third refresh): nav enhanced | PASS |
| Dev server after the fix, visitor: nav enhanced | PASS |
| Refresh after **Update** (publish) | NOT TESTED: needs a content change; the same `refreshed` event as Edit and Preview |
| Same checks as a non-administrator editor | NOT TESTED: no editor account in the container this session (the owner creates it; the agent may not read `/data/secrets`). The fix is not role-dependent |
| 375 px and 768 px | NOT TESTED: `resize_window` reported success but the viewport stayed 1440 px. The change is JavaScript only, not width-dependent; CSS unchanged |
| Entrance-animated widget visible in edit mode after a refresh | NOT TESTED on screen: no such widget on the container home; `wms-motion` removal checked above |

## Implicit state review

| State | Found | Decision |
|---|---|---|
| Nav enhanced (`data-wms-nav-ready`, `wms-nav--enhanced`) | Lost on every refresh in release builds | Set again on every refresh (helper) |
| Submenu and mobile menu open (`aria-expanded`, `is-open`) | New nav started unenhanced | New nav starts closed, as on load |
| Page-wide nav listeners | Once per `enhance` call, each holding its nav | Once per page, acting on the current navs |
| `wms-motion` on `<html>` | Kept from the page load across mode switches | Set or removed on every refresh, by mode |
| Subscription to `refreshed` | Depended on bundle order, failed silently | Made after `DOMContentLoaded`; visitors (no `apos.bus`) skip it |

## Security observations

No new endpoint, field or data. Browser scripts only.

## Known limitations

- The project helper copies a core behaviour; if core fixes `onReady`, the helper can go back to
  `apos.util.onReady` (one line in each script).

## Unresolved decisions

- D-CONTENT-24 Q4 / D-CONTENT-25 Q7: the default preset.

## Rollback guidance

Revert the branch's commit; no data or migration involved. Rebuild the container image.

## For the owner

1. Review the branch; approve commit, push and PR.
2. Optionally send the core report below to ApostropheCMS (Q3 a).
3. Optionally run the editor and Update checks: create a disposable editor in the container as in
   m1-082, edit a text, Update, and look at the menu.

Draft core report (to send as you wish):

> **`apos.util.onReady` never re-runs after refresh in release builds (4.34.0).**
> `onReadyAndRefresh` subscribes to `refreshed` inside `setTimeout(0)` with
> `apos.bus && apos.bus.$on(...)`. In a release build the public `src` module bundle runs before
> `apos-module-bundle.js`, which creates `apos.bus`, and the timer fires in between. The
> subscription is skipped silently, so project code using `onReady` does not run after an editor
> refresh (edit/preview switch, publish). It works in dev (`@apostrophecms/vite`), where the order
> differs. Subscribing on `DOMContentLoaded` (after all module scripts) avoids it.

## Recommended next step

m1-084 in a new Claude Code session: [m1-084 handoff](../../../../milestones/m1-084-handoff.md)
(themes, layouts, page templates and AI-assisted design, as the owner asked).

## Left over

- Container `wms-local`: rebuilt from this branch; content unchanged. The home page was left in
  preview mode; no draft changes made.
- No test accounts created.
