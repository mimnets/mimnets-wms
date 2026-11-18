# m1-077: rename stage 4, visible labels and demo files (design)

| | |
|---|---|
| **Task** | m1-077 |
| **Date** | 2026-11-17 |
| **Author** | The agent (agent-executed; not a human approval) |
| **Status** | **D-GIT-79 decided 2026-11-17 by the owner: approved** ("approve and preapre the handoff"), every recommended answer in §8. Built in m1-077; notes in §10 |
| **Related** | [m1-077 handoff](m1-077-handoff.md) · [m1-073 rename design](m1-073-rename-design.md) §4, §8 D3 · [m1-076 design](m1-076-rename-stage-3-design.md) §10 · [INDEX name map](../engineering/INDEX.md#name-map) |

The facts come from the repository at `235d8f7` (PR #93 merged). The owner chose this task and
confirmed that m1-076 is deployed on OCI (2026-11-17).

## 1. The request and the limits

Stage 4 of the rename (m1-073 §4): the visible product name in labels and demo files.

D3 was decided in m1-073 (option A): **Assurer World is the company whose site this is, and it
stays.** Only the product name changes. So this stage asks one question per label: does "Assurer"
here name the company, or the product? A company name stays; a product name goes.

Limits: minimal change; no stored names (stage 5); no new package; no change to content in the
database; no change on OCI except a normal release by the owner.

## 2. Inventory

From `git grep -i assurer` without `docs/`, `docker/`, `.github/`, `package-lock.json`, the
`ASSURER_*` settings and the stage-3 migration and its test (they must keep the old names).

| # | Where | Text | Names | Seen by |
|---|---|---|---|---|
| 1 | `i18n/project/en.json` (8 keys) | "Assurer Downloads", "Assurer Feature Grid", "Assurer Gallery", "Assurer Locations", "Assurer Organizations", "Assurer People", "Assurer Product List", "Assurer Key Figures" | Product | Editors: "Add Content" menu, widget editor title, breadcrumb |
| 2 | `wms-hero-widget`, `wms-slideshow-widget`, `wms-product-card-widget`, `wms-product-grid-widget` `index.js` | "Assurer Hero", "Assurer Slideshow", "Assurer Product Card", "Assurer Product Cards" (plain strings, not i18n keys) | Product | Editors, as row 1 |
| 3 | `@apostrophecms/home-page/views/page.jsx:14` | Empty-page hint: "add an Assurer Hero, Slideshow, Product Cards…" | Product (repeats row 2) | Editors, on an empty home page |
| 4 | `wms-demo/index.js:41` | Demo form title "DEMO – Contact Assurer" | Company | Editors; staff in the notification email subject |
| 5 | `wms-demo/index.js:138` | Demo hero text "…for the Assurer World proof of concept" | Company | Visitors (demo content only) |
| 6 | `views/layout.jsx:131` | Logo file `public/images/brand/assurer-logo.png` | Company (it is the company's logo) | Nobody (a URL) |
| 7 | `views/layout.jsx:140–141` | Logo `alt="Assurer World"`; text fallback "Assurer World" | Company | Visitors, screen readers |
| 8 | `views/layout.jsx:256` | Footer fallback "© Assurer World — demonstration content…" | Company | Visitors, when the footer text is empty |
| 9 | `en.json` `seoTitleSuffixHelp` | Example "Assurer World Wide" | Company | Admins |
| 10 | `demo-content/files/demo-brochure.pdf` | PDF `/Producer (vcl-assurer-group demo seed)` | Product (old name) | Anyone who opens the file properties |
| 11 | Comments: `home-page/views/page.jsx:1`, `_wms.scss:1`, `wms-gallery-widget/ui/src/index.js:1`, `wms-slideshow-widget/ui/src/index.js:1` | "Assurer home page", "Assurer project styles", "the Assurer gallery", "the Assurer slideshow" | Product | Developers |
| 12 | `_tokens.scss:5` | "the live assurerworld.com" | Company (a fact) | Developers |
| 13 | Tests (`seo.test.mjs`, `form-ops-test.mjs`) | "Contact Assurer", "Assurer World Wide" | Company (test data) | Developers |

The name map row "Product name in admin labels" (data dashboard) has nothing left: the dashboard
says "Data dashboard", and no admin label carries `vcl-assurer-group` or a product name. Core does
not show `shortName` anywhere a user sees it.

Two finds that are not stage 4:
- The root one-container image (`Dockerfile`, `compose.yaml`: project `assurer`, image
  `assurer-site:local`, user `assurer`, `/etc/assurer`, `assurer-entrypoint`) is not in the name
  map. The Compose project name prefixes its volumes, so it is stored. Proposed: add it to the
  map as **stage 5**.
- The staff URL `/assurer/form-submissions` (open row): §8 Q3.

## 3. Design

Changes (rows from §2):

1. **Widget labels (rows 1, 2): drop "Assurer ".** "Hero", "Slideshow", "Product Card",
   "Product Cards", "Downloads", "Feature Grid", "Gallery", "Locations", "Organizations",
   "People", "Product List", "Key Figures". The prefix only told project widgets from core ones;
   the grouped "Add Content" menu (`lib/area.js`, m1-071) does that now. No core widget has any of
   these names. Labels are not stored, so nothing in the database changes.
   Row 2's four plain strings stay plain strings: moving them to i18n keys is a separate cleanup,
   not needed for the rename (Minimal change).
2. **Home page hint (row 3):** "add a Hero, Slideshow, Product Cards…", to match change 1.
3. **Demo PDF (row 10):** `/Producer (mimnets-wms demo seed)`. The new string is 6 bytes shorter,
   so `startxref` changes from 539 to 533; the object offsets before it do not move. Check: the
   file still opens, and `wp-import-test` and `content-model-test` (which upload it) pass.
   Databases that already hold the seeded copy keep it; the seed does not upload it again.
4. **Comments (row 11):** "Home page", "Project styles", "the gallery widget", "the slideshow
   widget".
5. **Live docs that quote the old labels:** `m0-editor-acceptance-checklist.md` row 4 (it is used
   for acceptance runs). Historical records keep the old labels.
6. **INDEX name map:** stage 4 rows marked done, with the per-label outcome; the root image row
   added for stage 5; the staff URL row per Q3.

Kept, because they name the company (D3 A): rows 4–9, 12, 13. The demo form title (row 4) also
has a state reason, in §6.

## 4. Tests

- `npm run lint`, `test:smoke`, `test:workflow`, `test:persistence`; `test:unit`, `test:forms` and
  `scripts/content-model-test.mjs` (they upload the PDF and check the form title).
- A search that shows no product "Assurer" left in labels and comments: `git grep -n "Assurer "`
  shows only the kept rows.
- Browser, as a disposable non-admin editor (AGENTS.md): open "Add Content" on the home page; each
  group lists the new labels; add a Hero, check the editor title and breadcrumb say "Hero"; the
  empty-page hint on a copy with an empty home page if one is at hand, otherwise NOT TESTED.
  Public site smoke check at about 1440, 768 and 375 px (no layout change expected).

## 5. Production steps (the owner, after the merge)

A normal release (staging runbook): no migration, no setting. Rollback is the previous image.

## 6. Implicit state review (preview)

- **Demo form lookup by title.** The seed finds the demo form by its title
  (`wms-demo/index.js:236`). A new title makes the seed miss the existing form and create a second
  one on every database already seeded (local, OCI). That is a further reason to keep "DEMO –
  Contact Assurer" (it names the company anyway).
- **Labels in an editor's open session.** Labels come from the server at page load. An editor with
  the admin UI open during a release sees the old labels until the page reloads. No data effect.
- **The seeded PDF.** Stored attachments are copies; the seed's existing-attachment check means old
  databases keep the old producer string. No effect on users; recorded, not changed.

No new state is added.

## 7. After approval

Build §3 on `chore/m1-077-rename-stage-4`, run §4, write the report, prompt record, INDEX entry,
D-GIT-79 and the m1-078 handoff. Commit, push and PR need the owner's approval.

## 8. Questions for the owner (D-GIT-79)

| ID | Question | Options | Recommended |
|---|---|---|---|
| Q1 | Approve this design (§3), with the per-label outcome in §2? | approve · change | Approve |
| Q2 | Widget label form | "Hero" (no prefix) · "WMS Hero" · keep "Assurer Hero" | **"Hero"**: the menu groups already separate project widgets; a product name in an editor label adds nothing |
| Q3 | Staff URL `/assurer/form-submissions` | A. Keep, close the open row ("Assurer" here reads as the company; staff-only; not indexed) · B. Rename to `/wms/form-submissions` with a permanent redirect from the old path for links in sent emails, both paths in `Disallow` | **A**: B adds a legacy route kept forever for little gain |
| Q4 | Add the root one-container image names (`Dockerfile`, `compose.yaml`) to the name map as stage 5? | yes · no | Yes |

## 10. As built (m1-077)

- Built as §3. The widget labels were changed in place (eight i18n values, four plain strings).
- The demo PDF was rewritten byte for byte except the producer; `startxref` is now 533, and every
  object offset in the xref table still points at its object.
- Q3: the staff URL row in the INDEX name map is closed as kept. Q4: the root one-container image
  row is added for stage 5.
- `scripts/form-ops-test.mjs` runs its tasks (`node app …`) with the database from `.env`, not the
  server's. Against a second server on a database copy, set `APOS_DB_URI` to the copy too; Node's
  `--env-file` does not override a variable that is already set. Recorded in the m1-077 report.
