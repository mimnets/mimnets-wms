# mimnets-wms

mimnets-wms (website management system) runs the Assurer World corporate website,
built on **ApostropheCMS Community Edition** (MIT).
Started from the official
[Essentials starter kit](https://github.com/apostrophecms/starter-kit-essentials)
(commit `adbcab7`, MIT — see `licenses/`).

> **Status: Milestone 0 proof of concept.** All content is placeholder demonstration
> content. Not for deployment. See [`docs/milestones/`](./docs/milestones/).

## How it is built

mimnets-wms is a standard ApostropheCMS project. Apostrophe is installed as a framework from npm;
this repository configures it, extends it through its official extension points, and adds its own
modules. **Apostrophe's own code is never modified**, so upstream updates install like any other
package update.

### Three layers

| Layer | Where | What it holds | Changed by this project? |
|---|---|---|---|
| **1. Apostrophe core and official add-ons** | `node_modules/` (from `package.json`) | `apostrophe` 4.x: pages, pieces, widgets, the editor UI, users, drafts and publishing, the database layer, media. Add-ons: `@apostrophecms/form`, `seo`, `sitemap`, `redirect`, `import-export`, `security-headers`, `vite` | **No.** Upgraded with npm |
| **2. Core module overrides** | `modules/@apostrophecms/*` | A folder named like a core module adjusts it: options, extra fields, templates. Examples: `page/` (page types, the 404 template), `i18n/` (translation strings), `uploadfs/` (media storage), `security-headers/` (CSP) | Configuration only. Apostrophe merges these settings over its defaults; its source files stay untouched |
| **3. Project modules** | `modules/wms-*`, `lib/`, `views/` | The Assurer World site: content types, widgets, page types and tools (below). `lib/` holds shared field helpers (links, areas, listings); `views/layout.jsx` is the site chrome (header, navigation, footer) | Yes. Built only with Apostrophe's official APIs (`extend`, schema fields, the query builder, `@apostrophecms/migration`), as [AGENTS.md](./AGENTS.md) requires |

Project modules by kind:

- **Content types (pieces):** `wms-product`, `wms-person`, `wms-location`, `wms-organization`
- **Page types:** `wms-division-page`, `wms-product-category-page` (and the starter kit's `default-page`)
- **Widgets:** hero, slideshow, product grid and card, feature grid, stats, gallery, downloads,
  and listings of products, people, locations and organisations (`wms-*-widget`)
- **Tools:** `wms-wp-import` (WordPress import into drafts), `wms-patterns` (section patterns and
  page templates for editors), `wms-seo`, `wms-security`, `wms-forms`, `wms-data-dashboard`, `wms-demo` (demo
  content), `wms-test` (CI only)

### What happens when the site runs

1. `node app` (`app.js`) boots Apostrophe with the module list.
2. Apostrophe loads its core modules, then the overrides in `modules/@apostrophecms/`, then the
   `wms-*` modules.
3. Content is stored by Apostrophe itself: in **MongoDB** on servers and in containers, in
   **SQLite** for local development (`@apostrophecms/db-connect`). There is no second database
   and no custom ORM ([ADR-0002](./docs/architecture/decisions/)).
4. For each request, Apostrophe finds the page and renders its **JSX template** to HTML on the
   server, with Apostrophe's own renderer. There is no React and no client-side framework.
5. Editors work in Apostrophe's built-in admin UI; the project's fields and widgets appear inside
   it.

## Prerequisites

| Requirement | Version |
|-------------|---------|
| Node.js | 24 LTS (verified on 24.21.0) |
| npm | 11 (verified on 11.19.0) |
| Database | SQLite via `@apostrophecms/db-connect` — no server needed |

## Local setup

```sh
npm install
cp .env.example .env
# Set APOS_SESSION_SECRET in .env (the app refuses to start without it):
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"

node app @apostrophecms/user:add <username> admin   # prompts for a password
# For the editor workflow tests, put that login in .env as APOS_TEST_USER / APOS_TEST_PASSWORD
npm run seed:demo                                    # optional sample home page
npm run dev                                          # http://localhost:3000
```

Log in at `/login`. The server binds to `127.0.0.1` only (override with `ADDRESS`).

## Server setup

To run the site on a server (Docker, `arm64` or `amd64`), start at the
[staging container runbook §11](docs/runbooks/staging-container.md#11-ip-mode-the-site-on-the-public-address-before-go-live-m1-065):
`bash docker/staging/ip-setup.sh <public-ip>` starts it at `http://<public-ip>:8090`.

## Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Development server with restart-on-change |
| `npm start` | Development server without watching |
| `npm run seed:demo` | Load demo content onto the home page (`-- --force` to replace) |
| `npm run test:smoke` | HTTP checks: rendering, CSRF, contact-form validation (server must be running) |
| `npm run test:workflow` | Editor workflow via REST API (reads `APOS_TEST_USER` / `APOS_TEST_PASSWORD` from `.env`) |
| `npm run test:persistence` | Re-checks published state, e.g. after a restart |
| `npm run lint` | ESLint |
| `npm run build` | Production asset build (needs `APOS_RELEASE_ID`) |
| `npm run test:ci` | Same isolated run as CI: throwaway SQLite database and uploads in the temp directory, generated secrets, no `.env`; smoke, workflow and persistence (port 3100) |
| `npm run test:unit` | Unit tests for the audit gate and the test-admin guard |
| `npm run audit:check` | `npm audit` against `security/audit-baseline.json` |

CI (GitHub Actions, `.github/workflows/ci.yml`) runs lint, build, tests, gitleaks and the
audit check on every pull request. See [git-and-ci.md](./docs/engineering/git-and-ci.md#ci-github-actions).

## Layout

```
.github/
  workflows/            # CI (ci.yml)
lib/                    # shared field config and helpers (area.js, link.js, listing.js, ...)
  views/                # shared JSX components
modules/                # wms-* project modules; @apostrophecms/* core overrides
  asset/
    ui/
      src/              # client-side source (Vite): index.js, index.scss, scss/
views/                  # layout.jsx: site chrome (header, nav, footer)
scripts/                # test runners and unit tests (*.test.mjs)
security/               # npm audit baseline
demo-content/           # files and images for the "Demo" seed
public/
  images/               # static site images
licenses/               # third-party licence texts
docs/                   # engineering records, ADRs, content planning, runbooks, milestones
```

`app.js` holds the module list and app configuration. `default-page` and the `nested-*-widget`
modules are kept from the starter kit.

Not tracked (git-ignored): `.env`, `data` (local database), `public/uploads` (media),
`apos-build` and `public/apos-frontend` (build output), `backups`, `evidence`.
The `docs/` tree is detailed in [STANDARDS.md](./docs/engineering/STANDARDS.md#layout);
code conventions are in [ARCHITECTURE.md](./ARCHITECTURE.md) and [AGENTS.md](./AGENTS.md).

## Project modules

| Module | Purpose |
|--------|---------|
| `wms-hero-widget` | Hero banner: in-place editable headline/text, background image, buttons |
| `wms-slideshow-widget` | Image slideshow with captions, autoplay, keyboard and dot navigation |
| `wms-product-grid-widget` | Product section; cards are widgets in an area (add / reorder in place) |
| `wms-product-card-widget` | Single product card |
| `wms-demo` | `wms-demo:seed` task for demonstration content |
| `wms-patterns` | `wms-patterns:seed`: section patterns and page templates as draft pages under "Patterns (do not publish)" and "Templates (do not publish)"; never publishes, and refuses publishing under either parent (m1-086) |
| `wms-test` | `wms-test:ensure-admin`: creates the CI test admin; refuses anything but a temporary SQLite database |
| `@apostrophecms/form` (+ field widgets) | Contact forms (Community, MIT) |

See [AGENTS.md](./AGENTS.md) for template and code conventions.

## Documentation and governance

| Where | What |
|---|---|
| [AGENTS.md](./AGENTS.md) | Binding engineering rules for contributors and AI agents |
| [docs/engineering/INDEX.md](./docs/engineering/INDEX.md) | Tasks, prompts, reports, ADRs and PRs |
| [docs/architecture/decisions/](./docs/architecture/decisions/) | Architecture decision records |
| [docs/runbooks/](./docs/runbooks/) | Operational procedures (backup and restore, new site) |
| [docs/engineering/decision-register.md](./docs/engineering/decision-register.md) | Open decisions awaiting approval |
