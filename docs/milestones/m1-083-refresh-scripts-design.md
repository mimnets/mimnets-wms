# m1-083: menu and entrance animation after an editor refresh (design)

| | |
|---|---|
| **Task** | m1-083 |
| **Date** | 2026-11-19 |
| **Author** | The agent (agent-executed; not a human approval) |
| **Status** | **D-CONTENT-28 decided 2026-11-19 by the owner:** all recommendations (Q1 a, Q2 a, Q3 a) |
| **Related** | [m1-083 handoff](m1-083-handoff.md) §2 · [m1-082 report](../engineering/reports/2026/11/2026-11-19-m1-082-menu.report.md), Known limitations · [m1-014](../engineering/INDEX.md) (menu behaviour) · m1-072 (entrance animation) |

The facts come from `main` at `9cc5710` (PR #100, m1-082, merged), Apostrophe 4.34.0 in
`node_modules`, the dev server (`npm run dev`, `127.0.0.1:3000`) and the local `wms-local`
container (`127.0.0.1:3042`, release build). The owner signed in on both in Chrome; the agent did
not handle the passwords. The owner chose "Edit-mode submenus" from the handoff (2026-11-19).

## 1. Problem

m1-082 saw the desktop submenus show open in edit mode after the page refreshed on Update. The
handoff asked whether this happens on `main` and, if it is ours, to fix it.

It happens on `main`, and it is ours to fix (§3). It is not limited to Update: every editor
refresh (entering edit mode, switching to preview, Update, undo) does it, in the release build
only. Visitors never get a refresh, so they are not affected.

## 2. Facts (agent-executed checks)

| # | Where | Step | Actual result |
|---|---|---|---|
| F1 | Container, admin | Load home in preview mode | Nav has `wms-nav--enhanced`; `apos.bus` exists |
| F2 | Container, admin | Click **Edit** (a refresh) | Nav element replaced; new nav has class `wms-nav` only, no `data-wms-nav-ready`; both submenus `display: block; position: static` |
| F3 | Container, admin | `apos.bus.$emit('refreshed')` by hand | Nav stays `wms-nav`: no listener of ours is registered |
| F4 | Container, admin, edit mode | Read `<html>` class | `wms-motion` still set; `motion.js` removes it in edit mode, so `setup` did not run on the refresh |
| F5 | Dev server, admin | Click **Edit** | Nav replaced and enhanced again: the fault does not show in dev |

Script order differs between the two builds:

- Release (container): `apos-src-module-bundle.js` (our code), then `apos-module-bundle.js`
  (admin UI, which creates `apos.bus`).
- Dev: `__vite/src/src.js`, then `apos-module-bundle.js` as a separate request.

## 3. Cause

`views/layout.jsx` renders the header inside `[data-apos-refreshable]`, so every refresh replaces
the nav with new, unenhanced markup. The nav needs its script to run again after the refresh.

`nav.js` and `motion.js` use `apos.util.onReady(fn)`. Core
(`@apostrophecms/util/ui/src/util.js`, `onReadyAndRefresh`) runs `fn` when the page loads, and
subscribes it to `refreshed` in a `setTimeout(0)` callback with `apos.bus && …`. In the release build that timer fires
before the admin bundle has created `apos.bus`, so the subscription is skipped and nothing
reports it. In dev the admin bundle arrives first and the subscription happens.

Core's own widget players are not affected: `AposAreas.js` subscribes from inside the admin
bundle. Our two widget players (gallery, slideshow) use that path and are fine.

Effects:

| Script | After a refresh in the release build |
|---|---|
| `nav.js` | Without `wms-nav--enhanced`, the no-JavaScript layout shows: submenus in the flow under their parents, Menu and expand buttons hidden. Below 1024 px the whole menu shows unfolded |
| `motion.js` | Preview → edit: `wms-motion` stays on `<html>` and new widgets lack `is-visible`, so entrance-animated widgets are hidden while editing. Edit → preview: no animation (harmless) |

The motion effect was not seen on screen: the container home has no entrance-animated widget. It
follows from F4 and the CSS, and will be checked in the browser (§7).

## 4. Options

| | Option | For | Against |
|---|---|---|---|
| **a** | A small project helper `onPageReady(fn)` (`modules/asset/ui/src/on-page-ready.js`): runs `fn` on `DOMContentLoaded` and subscribes to `refreshed` at that time, when every module script has run and `apos.bus` exists for editors | One place, used by both scripts; does not rely on bundle order; uses the official `apos.bus` `refreshed` event | A project copy of a core helper (about 10 lines) until core fixes it |
| b | Make the nav a widget player (`apos.util.widgetPlayers`, selector `[data-wms-nav]`); core runs players after every refresh | Official path, no new helper | The nav is not a widget; motion is page-wide and does not fit a per-element player, so it still needs option a |
| c | Report to ApostropheCMS and wait | No project code | Editors keep the fault until a core release |

**Recommended: a**, and optionally report the core fault too (c, as information), as for the
Global Styles fault.

## 5. Design (a)

### A1. `modules/asset/ui/src/on-page-ready.js` (new)

```js
// Runs fn when the page is ready and after every editor refresh.
// apos.util.onReady also does this, but subscribes to `refreshed` in a timer that can fire
// before the admin bundle creates apos.bus (release builds), and then never subscribes (m1-083).
export default function onPageReady(fn) {
  const start = () => {
    fn();
    window.apos.bus?.$on('refreshed', fn);
  };
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    setTimeout(start, 0);
  }
}
```

`DOMContentLoaded` fires after every module script has run, so `apos.bus` exists for signed-in
users. Visitors get no `apos.bus` and no refreshes.

### A2. `nav.js` and `motion.js`

Each replaces `apos.util.onReady(…)` with `onPageReady(…)`. Nothing else in `motion.js` changes.

### A3. `nav.js`: page-wide listeners once

Now that `enhance` runs again on every refresh, each run would add another `document` click
listener and another `matchMedia` listener, each holding a nav that is no longer in the page. Move
these two listeners to module level, registered once, acting on the navs in the page at the time.
The listeners on the nav element itself stay in `enhance`, since they leave with the old nav.

### A4. Not changed

Templates, CSS, `layout.jsx` (the header stays refreshable, so menu edits in Global Content show
after Update), the widget players, `page-width.js` (no `onReady`).

## 6. Decisions for the owner (D-CONTENT-28)

| Q | Question | Options | Recommended |
|---|---|---|---|
| Q1 | Approach | a. project helper · b. nav as widget player (motion still needs a) · c. wait for core | **a** |
| Q2 | Also fix `motion.js` (same cause, §3) | a. yes · b. no, menu only | **a** |
| Q3 | Report the core fault to ApostropheCMS | a. the owner reports it (agent drafts the text in the report) · b. no | **a** |

## 7. Implicit state review (planned)

| State | Today | After |
|---|---|---|
| Nav enhanced (`data-wms-nav-ready`, `wms-nav--enhanced`) | Lost on refresh in the release build | Set again on every refresh |
| Submenu open (`aria-expanded`, `is-open`) | New nav starts unenhanced | New nav starts closed, as on load |
| Page-wide nav listeners | One set per `enhance` call | One set per page |
| `wms-motion` on `<html>` | Kept from the last page load | Set or removed on every refresh, by mode |

## 8. Tests and checks (planned)

- `npm run lint`, `test:smoke`, `test:workflow`, `test:persistence`. They call the API and do not
  cover this; no automated browser suite exists.
- Rebuild the container image (Kiri) to get a release build, then in Chrome, as the test editor
  (§3 of AGENTS.md browser rules; the owner creates it): enter edit mode, Update, switch to
  preview; after each, at 1440 px the submenus are closed and open on hover and click, at 375 px
  the Menu button works. Check an entrance-animated widget stays visible in edit mode.
- The same on the dev server (no regression where it already worked).
- Count `document` click listeners after several refreshes (`getEventListeners` is not available
  to the extension; check behaviour instead: one click outside closes the submenu, no errors).

## 9. Out of scope

Other refresh-dependent code (none found in `modules/*/ui/src`), core changes, menu content.
