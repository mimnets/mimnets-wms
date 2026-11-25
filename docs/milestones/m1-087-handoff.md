# m1-087 start handoff (2026-11-25)

| | |
|---|---|
| **Prepared** | 2026-11-25, by the agent at the end of m1-086 (agent-executed; not a human approval) |
| **State of `main`** | `65f2201` when written. This file is in the m1-086 branch (`feat/m1-086-templates`). Before starting, check that its commit is on `origin/main` (`git merge-base --is-ancestor <commit> origin/main`) |
| **Session** | Start a **new Claude Code session** (AGENTS.md, Sessions and context) |
| **Read first** | [AGENTS.md](../../AGENTS.md) · [INDEX](../engineering/INDEX.md) · [m1-086 report](../engineering/reports/2026/11/2026-11-25-m1-086-templates.report.md) · [m1-086 design](m1-086-templates-design.md) §9 · [m1-084 handoff](m1-084-handoff.md) §4 (the split) · [m1-085 report](../engineering/reports/2026/11/2026-11-19-m1-085-layout-options.report.md) (Recommended next step: customised themes) |

## 1. Where things stand

**Done in m1-086** (D-CONTENT-31): five page templates (about the company, division overview,
product category, leadership, contact) as draft pages under "Templates (do not publish)", used
with core's **Duplicate**; five more section patterns (slideshow opening, video and text, people
band, group companies band, downloads band); the server refuses to publish anything under
`/patterns` or `/templates`; the section builders shared in `modules/wms-patterns/lib/sections.js`;
the guide's section 5 ("Start from a pattern or a template"). Seeded by `node app wms-patterns:seed`
(adds missing pages only).

**Open, for the owner**

1. Review the m1-086 branch; approve commit, push and PR.
2. On each site (developer database, `wms-local` container, OCI): run `node app wms-patterns:seed`
   after the release to add the new patterns and the templates (nothing is published).
3. **"Category landing" pattern has a hero H1** (m1-079): pasted into a category page it gives the
   page two H1 headings. Fix (change the hero to H2 in the data, and the stored pattern page by
   hand) or leave; the owner's choice.
4. Still open from earlier handoffs: the m1-085 hidden pattern columns check after the release,
   OCI items (set Bold after the release, D-CONTENT-24 Q4), WordPress spam check, brand values
   (D-CONTENT-12), the privacy notice to the DPO (D-CONTENT-15).
5. **This clone has no `.env` or `data/`** (the old `Documents\mimnets-wms` folder is gone). m1-086
   ran the server suites through `npm run test:ci` (temporary database). Copy `.env` and the
   developer database into `C:\Users\Monir\Dev\mimnets-wms` before a task that needs them.

## 2. Next task: the owner chooses

| Option | Content | Gate |
|---|---|---|
| **m1-087 a. AI-assisted design** (m1-084 handoff §4) | Suggest themes (a token set) and page layouts (existing widgets, patterns and templates, never raw HTML or CSS) from a brief; each result is a draft for a human to publish | ADR first: an external AI service, a key in the secret store, cost and data limits, admin only. Architecture gate |
| **m1-087 b. Admin-customised themes** (owner's question, m1-085) | Copy a preset into an admin-only piece, validate on the server (shape and WCAG AA contrast), human name, hidden random ID in the class | Design note first; it makes the theme stylesheet depend on database content |

The owner said on 2026-11-25 that customised themes come after templates; whether before AI or
with it is open. If AI comes first, it should produce the same object a customised theme would,
so recommend b before a, or both in one design note.

## 3. Facts to start from

- Templates and patterns: `modules/wms-patterns/lib/{sections,patterns,templates,never-published}.js`
  (pure data and rules, unit-tested in `scripts/patterns.test.mjs` and `scripts/templates.test.mjs`);
  REST suite `scripts/templates-test.mjs` in `npm run test:ci`.
- Themes: `lib/themes.js` (data, `validateTheme()`, `overrides`), contrast pairs in
  `scripts/themes.test.mjs`.

## 4. Lessons from m1-086

- Core emits doc events from the **type** module: listen on `@apostrophecms/page-type:<event>`
  (or the piece type), not `@apostrophecms/page:<event>`. Prove a server rule with a REST test;
  a handler on the wrong name fails silently.
- Core's publish dialog replaces a `forbidden` error on the "publish the parent first" path with a
  canned permission text; use another error name to show your own message.
- A page is archived by moving it: `PATCH` with `archived: true`, `_targetId: '_archive'`,
  `_position: 'lastChild'`. `archived: true` alone answers 200 and changes nothing. The move
  unpublishes the page; unpublishing it first makes core 4.34 fail with a 500 (it unpublishes a
  second time).
- Every page type prints the title as the H1: content in `main` starts at H2.
- Duplicate places the copy under the page being viewed.
- `npm run test:ci` needs no `.env`; it is the way to run the server suites in a clone without one.

## 5. Limits

No change to WordPress. Commit, push and PR need the owner's approval. Anything on the OCI server
is run by the owner. No AI service, key or dependency without an accepted ADR.

## 6. Prompt for the new session

> Start m1-087. Read AGENTS.md and docs/milestones/m1-087-handoff.md first, check that the m1-086
> PR is on main, ask me which option (a or b), write the design note (and the ADR for a) and stop
> for my approval.
