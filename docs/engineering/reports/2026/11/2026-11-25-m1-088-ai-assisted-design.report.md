# m1-088 report: AI-assisted design

| | |
|---|---|
| **Task** | m1-088 (§2 of the [m1-088 handoff](../../../../milestones/m1-088-handoff.md)) |
| **Date** | 2026-11-25 |
| **Scope** | ADR and design note, then admin-only design suggestions: a theme or a page layout from a short brief, created as a draft. Not in scope: generated page text or images, a live AI call, any server, WordPress |
| **Prompt** | [2026-11-25-m1-088-ai-assisted-design.prompt.md](../../../prompts/2026/11/2026-11-25-m1-088-ai-assisted-design.prompt.md) |
| **ADR** | [ADR-0005](../../../architecture/decisions/ADR-0005-ai-assisted-design.md), accepted by the owner (D-CONTENT-33 Q1) |
| **Design** | [m1-088 AI-assisted design](../../../../milestones/m1-088-ai-assisted-design-design.md), decided by the owner (D-CONTENT-33): "continue with your recommendatons", recorded as approval of every recommendation (Q1–Q9 a) |
| **Branch** | `feat/m1-088-ai-assisted-design` from `origin/main` at `7eb573e` (PR #107, m1-087, merged). Commit and push approved by the owner ("approve"); the owner opens the PR from the compare link (`gh` is not installed) |

## Requirements

- Core `apos.ai` only: no new package, no SDK, no direct provider call (ADR-0005 Decision 1).
- Anthropic `claude-opus-5-5`, effort medium (Q2); key from `APOS_ANTHROPIC_KEY`, feature off
  without it (Decision 3).
- Only the brief and a fixed catalogue are sent; e-mail addresses and phone numbers refused; no
  tools for the model (Decision 4, Q4).
- Admins only (Q5); a record per request with its result and tokens; 20 a day per site (Q4).
- Theme: a draft `wms-theme`, checked like any theme, one repair call on a contrast failure (Q9).
- Layout: existing patterns only, no generated text, a draft page under Templates (Q6, Q7);
  patterns described by key without changing the seeded pages (Q8).
- Tests offline with core's mock (Decision 9).

## Work completed

1. **Start checks.** m1-087 (PR #107) is on `origin/main` (`git merge-base --is-ancestor`).
   Found that core 4.34.0 already ships `@apostrophecms/ai` with Anthropic, OpenAI, Google and
   OpenAI-compatible adapters, opt-in; the ADR builds on it.
2. **ADR-0005 and the design note**, then the owner's decisions (D-CONTENT-33).
3. **`modules/@apostrophecms/ai/index.js`:** the Anthropic provider only when the key is set; the
   scripted mock only under `APOS_AI_MOCK=1`.
4. **`modules/wms-design-suggestion`:** admin-only piece type (autopublish, a request and its
   log); `lib/brief.js` (brief check), `lib/prompts.js` (system prompts and JSON Schemas built
   from `themeFields`, the presets, the contrast pairs and the pattern catalogue),
   `lib/answers.js` (the project's checks on an answer), `lib/mock.js` (test answers). The run
   is a background `apos.ai.generateJob()`; its `onEnd` creates the draft and records status,
   notes, calls and tokens (from core's `usage` event); the admin gets a notification. Hidden
   from the admin bar and refused on the server while `apos.ai.active` is false.
5. **Pattern refactor (Q8):** `patternDefs(id, { heroLevel })` with a `summary` per pattern;
   `patternPages()` builds the pages from it. Output byte-identical before and after (compared on
   a snapshot, and by a hash over all 14 pages computed from the stashed original code).
6. **Configuration:** `.env.example` (key, daily limit, mock); `docker/staging/app-env.sh`
   exports the key from the `app-secrets` volume when the file exists; staging runbook §6 says
   how the owner adds, rotates or removes it.
7. **Guide:** publishing workflow guide §7, Design suggestions.
8. Details found while building are in the design note §9.

## Files changed

| File | Change |
|---|---|
| `modules/@apostrophecms/ai/index.js` | New: provider only with a key; test mock |
| `modules/wms-design-suggestion/index.js`, `lib/brief.js`, `lib/prompts.js`, `lib/answers.js`, `lib/mock.js` | New |
| `modules/wms-patterns/lib/patterns.js` | Patterns described by key (`patternDefs`), same pages |
| `modules/wms-theme/lib/fields.js` | Exports the token labels and help for the prompt |
| `modules/@apostrophecms/admin-bar/index.js`, `app.js` | Design suggestions in Site admin; module registered |
| `scripts/design-suggestion.test.mjs`, `scripts/design-suggestion-test.mjs` | New unit and REST suites |
| `scripts/patterns.test.mjs` | Hash over all 14 patterns; keys, summaries, `heroLevel` |
| `scripts/run-ci-tests.mjs` | Runs the suite without a key, then on a server restarted with the mock |
| `.env.example`, `docker/staging/app-env.sh`, `docs/runbooks/staging-container.md` | Key handling |
| `docs/content/publishing-workflow-guide.md` | §7 Design suggestions |
| `docs/architecture/decisions/ADR-0005-ai-assisted-design.md`, `README.md` | New ADR, index row |
| `docs/milestones/m1-088-ai-assisted-design-design.md`, `docs/milestones/m1-089-handoff.md` | New |
| `docs/engineering/decision-register.md`, `INDEX.md`, prompt and this report | Records |

## Tests executed and actual results

This clone has no `.env` or `data/` database, so the server suites (`test:smoke`,
`test:workflow`, `test:persistence` and the rest) ran through `npm run test:ci` on a throwaway
database, as in m1-087.

| Command | Result |
|---|---|
| `npm run lint` | PASS, no errors or warnings (final code) |
| `npm run test:unit` | PASS, 178/178 (9 new design suggestion tests, 3 new pattern tests) |
| `npm run test:ci`, run 1 | FAIL in clean-up only: the design suggestions suite passed every functional check, but archiving the two suggested (never-published) themes answered 500 (core bug, Findings 1). Every step before it PASS; the chain stops at the first failure |
| `npm run test:ci`, run 2 | PASS, every step (34). Clean-up publishes a test theme before archiving it |
| `npm run test:ci`, run 3 (final code, after the browser findings) | PASS, every step (34): smoke, editor workflow, content model, SEO, publishing workflow, data dashboard, page templates, custom themes, design suggestions without a key (4/4), design suggestions with the mock (33/33), seeds twice, persistence after restart, WordPress import, forms, security and HTTPS-proxy suites |

No live AI call was made: there is no key, and a live call needs the owner's approval for the
spending (ADR-0005 Decision 9).

## Browser acceptance checklist (Chrome, agent-executed)

Agent-executed; not a human approval. Throwaway local server on `127.0.0.1:3200` with
`APOS_AI_MOCK=1`, a new SQLite database in the OS temp folder, demo and pattern seeds, and two
disposable accounts (admin, editor) with random passwords kept in the scratch folder outside the
repository. No screenshots kept.

| Check | Result |
|---|---|
| Admin bar → Site admin lists Design suggestions (between Themes and Data dashboard) | PASS |
| New Design suggestion: Name, Suggest, Brief with the help text; Result and Usage tabs | PASS |
| Save with an e-mail address in the brief | PASS: refused, "Remove personal contact details …"; nothing saved |
| Brief corrected, Save | PASS: saved, the list shows it, a "ready" notification appears. **Found:** the notification showed `{{ title }}` literally. Fixed (plain text, `localize: false`); after a restart the next notification read "Design suggestion "Browser check layout" is ready …" |
| Theme record, Result tab | PASS: Status "Done", "Harbour (AI suggestion)" linked, the notes. **Found:** an empty "Problem" box on a done record; changed to show only on a failed one (checked on the layout record) |
| Layout record, Result and Usage tabs | PASS: page "Suggestion: About our services" linked, notes with one reason per section; model `claude-opus-5-5`, 1 call, tokens (mock values) |
| Suggested page as admin | PASS: draft under Templates, breadcrumb "Templates (do not publish)", the "How to use" note, then the chosen sections with placeholders |
| Publish the suggested page from the page's Publish button | PASS: refused, "Templates and patterns are never published …" |
| Layout at 1440, 768, 375 px | PASS: measured in iframes of those widths (the window may not resize, m1-087 lesson): no horizontal overflow, one H1 (the page title) |
| Site admin → Themes: suggested theme listed as Draft; its form | PASS: "Started from: AI suggestion, closest to Ocean: teal and coral", the token tabs |
| Row menu of the never-published theme | Core offers Edit, Duplicate, Document Versions, Export, **Delete Draft** (no Archive). Delete Draft not clicked |
| Editor signed in | PASS: no Site admin group, no Design suggestions; REST list from the editor's session returns no records |
| Logged out | PASS: the suggested page 404 (403 with `aposMode=draft`); the suggestions REST list `notfound` |
| Theme preview in Global Styles | NOT TESTED in this run (needs publishing the suggested theme; covered for custom themes in m1-087) |
| Duplicate of a suggestion record, Duplicate of the suggested page | NOT TESTED in Chrome (record Duplicate is core's; page Duplicate tested in m1-086) |

Clean-up: both accounts signed out; the throwaway database (2 suggestions, 1 draft theme, 1 draft
page) and the scratch file with the passwords were deleted; the browser tab was closed.

## Implicit state review

| State | Found | Decision |
|---|---|---|
| Running → done or failed | Read-only fields; core `convert` skips them | Set only by the server (`record()`); result, notes and problem shown by status |
| Brief refused, daily limit reached | Design said "saved as failed" | Refused at save: nothing stored, nothing sent, reason in the form |
| Run lost by a restart | Job lives in one process | Records still running after 30 minutes become failed ("Interrupted"), at start and before each new record |
| No key / key removed | Core stops the app when a provider has no key | Provider only with a key; menu hidden (`when`), new records refused; old records readable |
| Contrast failure | — | One repair call with the pairs by token name; a second failure creates nothing and names the pairs |
| Refusal, timeout, invalid answer | — | Failed with a plain message; tokens billed are stored |
| Brief or kind changed later | — | Refused on the server ("Duplicate it to try again"); the name may change |
| Suggested page published | — | Refused by the m1-086 guard (UI and REST tested) |
| Suggested theme no longer wanted | Core REST archive of a never-published draft answers 500 | UI offers Delete Draft; guide says so; core bug reported below |
| Editor, visitor | — | No read, no write, no menu (REST and UI tested) |

## Findings

1. **Core 4.34.0 bug: archiving a never-published draft through the REST API answers 500**
   (`TypeError: Cannot read properties of undefined (reading 'endsWith')` in `unpublish`, from
   `afterArchive` → `retainOnlyAsDraft` → `revertDraftToPublished`, which returns `false` when no
   published version exists). Seen for `wms-theme`; by the code path it applies to every
   localized type without autopublish, including themes made by hand (not tried for others). The admin UI offers Delete Draft instead for such a draft, so
   the normal path works; the Themes list's batch Archive was not tried. Not fixed (core code).
   Suggested: the owner files an upstream issue; a project-level workaround would need its own
   approval.
2. **Core notification interpolation** did not fill `{{ title }}` for a server-side
   `apos.notify` with an `interpolate` object (seen in Chrome). Worked around with a plain-text
   message; not investigated further.

## Security observations

- No new package; core's adapter calls the provider through `apos.http`. The key is read from the
  environment only and never stored, logged or sent to the browser.
- The model gets no tools (one turn, structured output): it cannot read or change content. Its
  answer is checked by core's schema validation and again by the project (shape, contrast,
  pattern keys) before anything is created; read-only text fields are stripped of `<` and `>`
  and length-limited. Page content comes only from the pattern builders through core `convert`.
- A brief with an e-mail address or phone number is refused before it is stored or sent. The
  prompt holds no database content, no user identity and no site name.
- Admin-only by core roles; editors and visitors get nothing (REST and UI tested). Results are
  drafts: the theme is unpublished, the page cannot be published.
- Test passwords were random, used only on `127.0.0.1`, kept in the scratch folder and deleted;
  the temporary databases were deleted.

## Known limitations

- No live call yet: real token counts and cost per suggestion are unmeasured (estimate USD 0.05 to
  0.20; at most USD 0.32 per call by the output cap).
- The daily limit can be exceeded by one when two processes accept a record at the same moment
  (design note §3.7).
- Suggestions are not reproducible; the same brief can give another result.
- The brief check is a safeguard, not a guarantee (names are not detected).
- Production use waits for the DPO (ADR-0005 Decision 10).

## Rollback guidance

Revert the branch's changes. Records of type `wms-design-suggestion` stay in the database but are
unused without the module; suggested themes and pages are ordinary drafts. No migration ran. To
turn the feature off without a release, remove the key and restart.

## For the owner

1. Review the branch; approve commit, push and PR.
2. When ready: create a provider workspace and key for a site with a monthly spend limit, put it
   in `.env` (local) or the `app-secrets` volume (staging runbook §6). The agent never sees it.
3. Approve one live call per kind on a local or staging site to measure tokens and cost.
4. Ask the DPO about the provider before production use (ADR-0005 Decision 10).
5. File the core archive bug upstream (Findings 1), if wanted.

## Recommended next step

A new session from the [m1-089 handoff](../../../../milestones/m1-089-handoff.md): the live
measurement once a key exists, or an open item the owner picks.

## Left over

Nothing in the repository or the test databases. The scratch folder holds CI and server logs (no
secrets) and the pattern snapshots.
