# m1-082: main menu like the original (design)

| | |
|---|---|
| **Task** | m1-082 |
| **Date** | 2026-11-19 |
| **Author** | The agent (agent-executed; not a human approval) |
| **Status** | **D-CONTENT-27 decided 2026-11-19 by the owner:** all recommendations (Q1 a, Q2 Organizations, Q3 a, Q4 a, Q5 a, Q6 a) |
| **Related** | [m1-082 handoff](m1-082-handoff.md) · [m1-080 design](m1-080-theme-follow-ups-design.md) §C, Q4 (D-CONTENT-25) · [IA §3–4](../content/corporate-information-architecture.md#4-navigation) (D-CONTENT-1) · [WordPress inventory](../content/wordpress-site-inventory.md) (header menu) |

The facts come from the repository at `dc0c05d` (PR #99, m1-081, merged), Apostrophe 4.34.0 in
`node_modules`, and the visitor view of the local `wms-local` container (`127.0.0.1:3042`). The
owner chose "Menu" from the handoff (2026-11-19). Draft pages in the container were not listed:
the test login does not work there, and the agent did not read the container's secrets.

## 1. Problem

The original site's header menu is Products, Organizations, Services, Leadership, Contact Us,
with dropdowns. The new site's menu is the page tree, which came from the WordPress pages, not
from the WordPress menu. Today a visitor sees:

| Original (inventory) | New site now |
|---|---|
| Products ▸ six categories from both divisions (Apparels & Textiles … Health Tex & Medi Care) | Style ▸ three categories · Health ▸ three categories |
| Organizations ▸ six companies (two external sites, four `#organizations`) | — |
| Services ▸ six services (all `#services`) | — |
| Leadership ▸ Sourcing Leaders and five roles (`#leadership`) | Leadership |
| Contact Us | Contact Us |
| — (Downloads in the bottom bar, gallery in the footer) | Downloads · Images |

D-CONTENT-25 Q4 kept the tree for now and named option b, "reorder and rename in the page tree
(no code)", for later.

## 2. Facts

- The menu is `Nav` in `views/layout.jsx`: the home page's children and grandchildren (the
  `ancestors.children` builder, depth 2, projected to `title`, `path`, `aposDocId`, `_url`, in
  `modules/@apostrophecms/page/index.js`). A parent keeps its link and has a separate expand
  button; behaviour in `modules/asset/ui/src/nav.js`. The label is always the page title.
- Global Content already has a list of links of the same kind: `footerLinks` (m1-080), an
  array of `linkFields()` (page or external URL), max 8, checked by `rejectNonWebUrls`
  (external URLs must start with `https://` or `http://`). A link to an unpublished page
  resolves to nothing for visitors and is not shown. The header button (`showHeaderCta`) uses
  the same fields.
- Section widgets have an anchor field (`anchorField` in `lib/listing.js`): organizations,
  feature grid, stats and others can carry `id="organizations"` and the like.
- Core keeps the old URL of a page whose slug changes and redirects it with 301
  (`modules/@apostrophecms/soft-redirect`). The legacy WordPress redirects
  (`wms-seo:seed-redirects`) point at today's URLs, so a move would add a second hop.
- D-CONTENT-1 (approved 2026-10-20) keeps all content URLs, renames "Organizations" to "Group
  companies", drops the Services and Leadership submenus, and puts Downloads in the header.
  The new pages it planned (`/about`, `/group`, `/products`, `/services`) were never built.
  Q4 b names "Organizations"; the two decisions disagree on that label (Q2).

## 3. Why the page tree alone cannot do it

A menu from the tree shows a page's own children. To get "Products ▸ six categories":

- `/style` and `/health` must move under a new `/products` page. Every category URL changes
  (`/style/apparels-textiles` → `/products/style/apparels-textiles`), against D-CONTENT-1 and
  D-CONTENT-3, with two-hop redirects from the WordPress URLs. Even then the dropdown shows
  "Style" and "Health", not the six categories (two levels only).
- Organizations links to two external sites and to sections of the home page. A page tree
  holds pages only, so these need empty placeholder pages or cannot be shown.
- Services needs a `/services` page that has no content yet (D-CONTENT-1 planned it).

## 4. Options

| | Approach | For | Against |
|---|---|---|---|
| A | Page tree only (Q4 b): new `/products`, `/organizations`, `/services` pages; move Style and Health under Products; reorder | No code | URLs change (§3); Products shows two divisions, not six categories; no external or section links; three pages without content |
| **B** | A **Main menu** list in Global Content (Navigation group): items with their own text and a link (page, page + section, or external URL), each with optional sub-items. Empty list: the menu is the page tree, as today | Matches the original exactly; no URL changes; editors rename and reorder without touching pages; reuses `linkFields()` and the `footerLinks` pattern; one renderer for both sources | A new page does not join the menu by itself once the list is filled; some code (§5) |
| C | A "dropdown items" field on each top-level page | Top level stays the tree | Puts site navigation into page content; still needs the three missing top-level pages |

**Recommended: B** (D-CONTENT-25 Q4 c in m1-080). It fits the existing design: Global Content
already holds the footer links and the header button. The tree stays the default, so a site
with no menu set (OCI today) does not change.

## 5. Design (B)

### B1. Fields (`modules/@apostrophecms/global/index.js`)

`mainMenu`, an array in the Navigation group, label "Main menu", help "Leave empty to build the
menu from the page tree. A link to a page appears only while the page is published.",
`titleField: 'linkText'`, max 8. Each item:

- `linkFields()`, the same as the footer links, and
- `section`, optional (`anchorField` shape, label "Section on the page", help "The anchor of a
  section on the linked page, for example services"), shown only for a page link. The href
  becomes `<page URL>#<section>`.
- `submenu`, an array (max 12, same fields without `submenu`), label "Submenu".

The page relationship projects only `title`, `path`, `aposDocId`, `_url` (as the tree menu,
m1-053), so the menu does not load page content on every request. `rejectNonWebUrls` also checks
`mainMenu.linkUrl` and `mainMenu.submenu.linkUrl`; `invalidWebUrls` (`lib/web-url.js`) now walks
nested array paths.

### B2. One menu shape, two sources (`lib/menu.js`, new)

Two small pure functions turn each source into one shape, `{ text, href, external, current,
inBranch, children }`:

- `menuFromTree(home, page)`: today's logic from `NavLink`/`Nav`, moved, not changed.
- `menuFromGlobal(global, page)`: uses `linkHref()`. An item with no href (page unpublished or
  archived) is left out with its submenu. `current` when the linked page is the current page
  and there is no section; `inBranch` when the current page is under the linked page.

`Nav` in `views/layout.jsx` renders that shape only: `mainMenu` if it has a visible item,
otherwise the tree. Markup, classes, the expand buttons, `nav.js` and the header button do not
change. External items get a visually hidden "(external site)" (IA §4: external links marked).

### B3. The local container's menu (content, no code)

Filled through Global Content as a disposable editor, published, per Q3:

| Item | Link | Submenu |
|---|---|---|
| Products | Home + `products` | The six category pages |
| Organizations | Home + `organizations` | Versatile Creations ↗ · Pure Naturals ↗ · the four others → Home + `organizations` |
| Services | Home + `services` | per Q3 |
| Leadership | Leadership page | per Q3 |
| Contact Us | Contact Us page | — |

The home sections get the anchors `products`, `organizations`, `services` where missing.
Downloads and Images move to the footer links (Q4). On OCI the owner does the same after the
release.

### B4. Not changed

The page tree, URLs, redirects, breadcrumbs, the header button, the menu's look and its
keyboard and mobile behaviour.

## 6. Decisions for the owner (D-CONTENT-27)

| | Question | Options | Recommended |
|---|---|---|---|
| Q1 | Approach | a. B, a Main menu in Global Content · b. A, page tree only · c. C, per-page dropdowns | **a** |
| Q2 | Label | "Organizations" (original, Q4 b) · "Group companies" (D-CONTENT-1) | **Organizations**, as on the original; an editor can change it in the menu |
| Q3 | Submenus | a. Products and Organizations only (D-CONTENT-1: the Services and Leadership sub-items all point to one section or are role names) · b. all four, as the original | **a** |
| Q4 | Downloads and Images | a. footer links, as on the original · b. keep in the header menu | **a** |
| Q5 | Empty Main menu | a. the page tree, as today · b. no menu | **a** (OCI and new sites keep working until the list is filled) |
| Q6 | Build scope | a. code, tests and the local container's menu · b. code only | **a** |

## 7. Implicit state review (planned)

- **Menu source** (list empty → page tree; list with a visible item → list). Stated in the
  field's help text. A list whose every page is unpublished falls back to the tree, not to an
  empty header.
- **Item visibility** follows the linked page's published state, as the footer links. Logged-in
  editors see draft links in draft mode (core behaviour).
- **Current item**: the page-only rule above; section links never mark a page as current, so
  "Products" and "Organizations" (both home sections) do not both light up on the home page.

## 8. Tests and checks (planned)

- `lib/menu.js`: both functions with fixed inputs (unpublished page, section, external, current,
  branch), in the existing test scripts.
- `npm run lint`, `test:smoke`, `test:workflow` (a menu saved by an editor appears for
  visitors; an item with an unpublished page does not), `test:persistence`.
- Browser (Claude in Chrome, disposable editor, agent-executed): fill and publish the menu;
  desktop, 768 and 375 px; keyboard (Tab, Enter, Escape); dropdowns; external marker; section
  links scroll to the section from another page; draft menu change not public until published;
  empty list gives the tree back.

## 9. Out of scope

New pages (`/products`, `/services`, `/group`), moving or renaming pages, a third menu level,
the fixed bottom bar and footer gallery (D-CONTENT-25 Q5), OCI, WordPress.
