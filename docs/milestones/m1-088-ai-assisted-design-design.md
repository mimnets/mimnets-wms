# m1-088: AI-assisted design (design)

| | |
|---|---|
| **Task** | m1-088 (§2 of the [m1-088 handoff](m1-088-handoff.md)) |
| **Date** | 2026-11-25 |
| **Author** | The agent (agent-executed; not a human approval) |
| **Status** | **D-CONTENT-33 decided 2026-11-25 by the owner: "continue with your recommendatons"**, recorded as approval of every recommendation (Q1–Q9 a), including [ADR-0005](../architecture/decisions/ADR-0005-ai-assisted-design.md) (Q1) and the refactor in Q8 |
| **Related** | [m1-084 handoff](m1-084-handoff.md) §4 · [m1-087 design](m1-087-custom-themes-design.md) §3.11 · [m1-086 design](m1-086-templates-design.md) · D-CONTENT-29, D-CONTENT-31, D-CONTENT-32 |

The facts come from the repository at `7eb573e` (PR #107, m1-087, merged) and from the installed
core, `apostrophe` 4.34.0. Nothing is built, configured or called until the owner accepts
ADR-0005 and decides §8.

## 1. The request and the limits

From the m1-084 plan: an admin writes a short brief ("calm, trustworthy, for an insurance group;
navy and warm accents") and gets a **theme** or a **page layout** suggestion, created as a draft for
a human to review and publish.

Limits: official Apostrophe APIs first; no new package; Community Edition; admins only (D-M0-11);
no personal data in prompts; key in the secret store; cost limits; every value validated on the
server; never raw HTML or CSS; nothing published by the AI.

## 2. What exists today

| Item | Where | Use here |
|---|---|---|
| `apos.ai`: providers, structured output, background jobs, `usage` events, mock mode | core `@apostrophecms/ai` (4.33.0+), ADR-0005 Context | The only way to call the model |
| Theme shape (`themeFields`, 36 tokens), `validateTheme()`, 12 presets | `lib/themes.js` | Schema for the theme answer |
| Contrast pairs, `contrastProblems()` | `lib/theme-contrast.js` | Same check as a human's save |
| `wms-theme`: admin-only piece type; `started: true` keeps the given tokens; `beforeSave` checks shape and contrast | `modules/wms-theme/` | Target of a theme suggestion (m1-087 §3.11) |
| 14 section patterns, 5 templates, built by pure builders | `modules/wms-patterns/lib/` | Catalogue and builder for a layout |
| Publishing guard for `/patterns` and `/templates` | `modules/wms-patterns/index.js` | Keeps a layout draft unpublished |

## 3. Design

### 3.1 How an admin asks: a "Design suggestion" record (Q5)

New admin-only piece type **`wms-design-suggestion`** ("Design suggestion" / "Design
suggestions", Site admin menu), `viewRole`, `editRole` and `publishRole` `admin`, no SEO fields,
not searchable, shown only when `apos.ai.active`.

| Field | Set by | Notes |
|---|---|---|
| Kind | Admin | `theme` or `layout` |
| Brief | Admin | Plain text, 20 to 1,000 characters; help text says what not to include (§3.6) |
| Status | Server (read-only) | `running`, `done`, `failed` |
| Result | Server (read-only) | Relationship to the draft theme or the draft page |
| Notes | Server (read-only) | The model's short reasons, plain text, shown only here |
| Error | Server (read-only) | Plain message when failed (refused brief, contrast, provider error, daily cap) |
| Model, input tokens, output tokens | Server (read-only) | From the call's result and `usage` |

Saving a new suggestion starts the run: an `afterInsert` handler checks the daily cap and the
brief, then calls `apos.ai.generateJob()`. Its `onEnd` callback validates the answer, creates the
draft and fills Status, Result and the rest. The admin sees core's job notifications and opens the
result from the record. The brief is read-only after the first save; "try again" is Duplicate
(a new record, a new run, counted against the cap).

Why a piece type: it uses core's admin UI and REST API with their permission checks, needs no
custom Vue component or route, and every call leaves a record (who, when, what brief, what it
cost) that the daily cap counts. Rejected: a custom modal with its own route (new UI code and a
second permission path); a button in the theme form only (covers themes, not layouts).

### 3.2 The call

One `generateJob()` call per suggestion: a fixed system prompt (in code, the same for every site),
the brief as the user turn, a JSON Schema for the answer, no tools, `maxSteps: 1`, an output-token
cap, the model and effort from ADR-0005. Core's prompt cache (default `short`) reuses the fixed
part.

### 3.3 Theme answer

Schema (generated from `themeFields`, so a later token change cannot drift from it):

```js
{
  name: string (3–40),            // "Harbour (AI suggestion)" is added by the server
  closestPreset: enum(preset names),
  tokens: { /* every token in themeFields, its own type: #rrggbb, enum or number range */ },
  notes: string (≤ 600)
}
```

The server then inserts a **draft `wms-theme`** as the admin who asked: title `<name> (AI
suggestion)` (a number is added if the name is taken), `startFrom: closestPreset`,
`started: true`, the tokens through `fieldsFromTokens()`. `wms-theme`'s own `beforeSave` checks the
shape and the WCAG pairs, as for any admin's save.

**Contrast repair (Q9).** If the save is refused for contrast, the server makes **one** more call
with the brief, the first answer and the failing pairs named ("text on surface 3.9:1, needs
4.5:1"). If that also fails, the suggestion fails with the pairs listed and no theme is created.

The theme stays a draft. The admin opens it, changes what they like, publishes it, then chooses it
in Global Styles (m1-087 guide §6). Global Styles offers only published themes (D-CONTENT-32 Q5).

### 3.4 Layout answer: a list of known sections (Q6)

Schema:

```js
{
  title: string (3–80),
  sections: [ { pattern: enum(pattern keys), why: string (≤ 200) } ]  // 1 to 8
}
```

`pattern` is the key of an existing section pattern, the last part of its slug (`home-opening`,
`story-band`, `split-image-left`, …). The page is built only by the pattern builders, so every widget, style value
and placeholder is one a human-made pattern already uses. The model writes no page text in this
version: the sections keep their "Replace …" placeholders, and `why` is shown only on the
suggestion record. Generated text would mean business claims written by a model on a corporate
site (D-CONTENT-12: confirmed facts only); that can be a later, separate decision.

**Small refactor needed (AGENTS.md, clean architecture; Q8).** Today `patternPages()` returns
finished pages, each `main` area beginning with its "How to use" note. A layout needs a pattern's
sections without the note, by key. Proposed: `patterns.js` describes each pattern as
`{ key, slug, title, howTo, sections }`, and `patternPages()` builds the same pages from that. The
seeded pages stay byte-for-byte the same: the unit test compares the output before and after.

### 3.5 Where a layout draft goes (Q7)

A **draft page under "Templates (do not publish)"**, titled `Suggestion: <title>`, page type
`default-page`, its `main` area the chosen sections in order, each widget with new IDs. It is then
used like any template: Duplicate, move the copy, replace the placeholders, publish (m1-086 guide).
The existing guard already refuses publishing anything under `/templates`, so no new rule and no
new state. Rejected: a new draft page at the top level (publishable by mistake with placeholders in
it, and a second path next to templates).

### 3.6 Data sent, and the brief check

Sent: the system prompt, the brief, the schema (token names, preset names and labels, pattern keys
with one-line descriptions). Not sent: any database content, user or admin identity, site name,
URLs, images. `usageMetadata` carries no person.

Before the call the server refuses a brief that contains an e-mail address or a phone number
(simple patterns, unit-tested), with "Remove personal contact details from the brief." The help
text asks for no names of people, customers or prices. A brief is short and written by an admin,
so this is a safeguard, not a guarantee; the DPO question (ADR-0005 Decision 10) covers the rest.

### 3.7 Limits and cost (Q4)

- Daily cap: `WMS_AI_DAILY_LIMIT` (default 20) suggestions per site per day, counted from the
  records created that day (UTC). Over the cap the record saves as `failed` with "Daily limit
  reached", and no call is made. Two processes may race past it by one; acceptable.
- Output-token cap per call (set in the build from the measured answer size, with room for
  thinking).
- One repair call at most (§3.3), so at most two calls per suggestion.
- Tokens stored on each record; the provider workspace's spend limit (set by the owner) is the hard
  stop.
- Estimate at `claude-opus-5-5`: input about 3,000 to 8,000 tokens (USD 0.01 to 0.03), output with
  thinking about 2,000 to 8,000 tokens (USD 0.04 to 0.16): about USD 0.05 to 0.20 per suggestion.
  To be measured on the first live call, with the owner's approval.

### 3.8 Configuration

`modules/@apostrophecms/ai/index.js` (project override) adds the `anthropic` provider entry only
when `APOS_ANTHROPIC_KEY` is set, so a site without a key starts normally with the feature off
(core stops the app when a configured provider has no key). `.env.example` gains the key and
`WMS_AI_DAILY_LIMIT`, commented, marked "Secret: secret store or .env only". The staging start
script exports the key from `/secrets/app/anthropic-key` when the file exists; the runbook gains
the step. Nothing is set on any server by the agent (the owner runs servers).

## 4. Admin flow (for the guide)

1. Site admin → Design suggestions → New. Choose Theme or Layout, write the brief, save.
2. Wait for the notification (usually under a minute). Open the record: Status, notes, Result.
3. Theme: open the draft theme, adjust, publish, reload, choose it in Global Styles, preview,
   publish Global Styles.
4. Layout: open the suggestion page under Templates, Duplicate it, move the copy, replace the
   placeholders, add photos, publish.
5. Not useful? Archive the draft and the record, or Duplicate the record with a better brief.

## 5. Implicit state review (plan)

| State | Decision |
|---|---|
| Suggestion `running` → `done` / `failed` | Set only by the server; read-only fields (core `convert` skips them, m1-087 §9) |
| Process stops during a run | The job is lost. At start, and when the list is read, a record still `running` after 10 minutes is set to `failed` ("Interrupted, try again") |
| No key, or key removed later | Feature off: type hidden from the admin bar, a new record refused on the server; old records still readable |
| Daily cap reached | Record saved as `failed`, no call, message says when it resets |
| Model refuses or provider error | `failed` with a plain message; tokens already billed are stored |
| Invalid answer after the repair call | `failed`, contrast pairs listed; no theme created |
| Result draft archived or edited by the admin | Record keeps the relationship (empty if archived); nothing re-runs |
| Brief edited after the run | Not possible (read-only after the first save); Duplicate to try again |
| Layout draft published | Refused by the existing `/templates` guard |
| Theme suggestion published | Allowed: an admin's choice, as for any custom theme; only then offered in Global Styles |
| Editor | No read, no write, no admin bar entry (`viewRole`), proved by REST |

## 6. Tests and checks

- `npm run lint`, `npm run test:unit`: the theme schema covers every token; the brief check
  (e-mail, phone, length); the pattern refactor gives the same pages as before; a mocked theme
  answer passes `validateTheme()` and a low-contrast one is caught; layout keys outside the
  catalogue are refused by the schema.
- REST suite (new, in `npm run test:ci`, with `APOS_AI_MOCK=1` and a scripted mock): admin creates a
  theme suggestion → draft theme with the tokens; a low-contrast mock answer → one repair call,
  then `failed`; a layout suggestion → draft page under `/templates` with the chosen sections,
  publish refused; daily cap; brief with an e-mail refused, no call made; editor read and write
  refused.
- Server suites `test:smoke`, `test:workflow`, `test:persistence` (through `npm run test:ci`; this
  clone has no `.env`).
- Chrome, agent-executed, with the mock: admin flow for both kinds, the job notification, the
  record's fields, the theme preview in Global Styles, the layout draft at 1440, 768 and 375 px; a
  disposable editor does not see Design suggestions. Clean up through the UI.
- One live call per kind, **only with the owner's key and approval**, to measure tokens and cost;
  the result recorded in the report without the key or the brief's personal content.

## 7. Out of scope

Generated page text or images; changing an existing page; per-page themes; chat or iterative
refinement; any visitor-facing AI; AI for editors; other providers (a configuration change later);
production use before the DPO's answer; server configuration (the owner runs it).

## 8. Decisions for the owner (D-CONTENT-33)

| Q | Question | Options | Recommended |
|---|---|---|---|
| Q1 | Accept ADR-0005 (architecture gate: external AI service, key, spending) | a. accept · b. change first · c. no AI now | **a** |
| Q2 | Provider and model | a. Anthropic `claude-opus-5-5`, effort medium (USD 4 / 20 per million tokens) · b. Anthropic `claude-sonnet-5-5` (USD 2 / 10) · c. OpenAI or Google through core's adapters | **a**: volume is tiny, so quality matters more than price |
| Q3 | Where it may be used | a. local and staging with test briefs now; production after the DPO confirms the processor · b. everywhere now · c. local only | **a** |
| Q4 | Limits | a. 20 suggestions per site per day, brief ≤ 1,000 characters, e-mail and phone refused, spend limit in the provider workspace · b. other numbers | **a** |
| Q5 | How admins ask | a. admin-only piece type "Design suggestions" (record of every call) · b. custom modal and route | **a** |
| Q6 | What a layout suggestion contains | a. existing patterns only, placeholders kept, no generated text · b. also generated headings and text (plain text) | **a** |
| Q7 | Where a layout draft goes | a. draft page under "Templates (do not publish)", used through Duplicate · b. new top-level draft page | **a** |
| Q8 | Refactor: patterns described by key, with their sections apart from the "How to use" note (same seeded pages) | a. approve · b. a second copy of the sections for the AI | **a** |
| Q9 | Contrast repair | a. one automatic retry with the failing pairs · b. no retry, fail at once | **a** |

The owner also creates the provider workspace, key and spend limit when ready; the agent never
sees or stores the key.

## 9. As built (m1-088)

Built after D-CONTENT-33 (Q1–Q9 a). Differences and details found while building:

- **A refused brief or a reached daily limit refuses the save** (400), instead of storing a
  `failed` record (§3.1, §3.7). Nothing is stored or sent, and the admin sees the reason in the
  form. Every stored record counts against the cap, failed ones too.
- **"Interrupted" after 30 minutes, not 10** (§5): one provider call may take up to the core
  adapter's own timeout (10 minutes), retries aside.
- **Fields by status:** the result, the notes and "Problem" show only when they apply (`if` on
  status), so a running or done record has no empty "Problem" box.
- **Notification:** plain text with the name in it (`localize: false`). Core's browser-side
  interpolation showed `{{ title }}` literally (seen in Chrome, fixed).
- **Patterns by key (Q8):** `patternDefs(id, { heroLevel })` in `modules/wms-patterns/lib/patterns.js`,
  each with a one-line `summary` for the model; `patternPages()` builds the same pages from it
  (all 14 pages byte-identical before and after; the unit test now hashes all of them). A
  suggested page passes `heroLevel: 'h2'`: no H1 below the page title, the template rule.
- **The suggested page:** a "How to use" note, then the chosen patterns' sections, at
  `/templates/suggestion-<title>-<6 characters of the record id>`, through the same
  `ensurePage()` (core `convert`) as the seed.
- **Key file on a server:** `anthropic-key` in the `app-secrets` volume, which the app sees as
  `/secrets/anthropic-key` (ADR-0005 Decision 3 names the volume path as `setup` sees it). Exported
  by `docker/staging/app-env.sh` only when the file is not empty.
- **Output cap:** 16,000 tokens per call (thinking included), at most USD 0.32 per call at the
  prices in ADR-0005. Not yet measured on a live call (no key; needs the owner's approval).
- **Test mock:** core's `mock` option, installed by `modules/@apostrophecms/ai/index.js` only
  under `APOS_AI_MOCK=1`; scripted answers by markers in the brief
  (`modules/wms-design-suggestion/lib/mock.js`).
- **Found: core 4.34.0 answers 500 when a never-published draft is archived through the REST
  API** (`afterArchive` → `revertDraftToPublished` returns `false` when there is no published
  version → `unpublish(false)`). Suggested themes are never-published drafts. In the admin UI,
  core offers **Delete Draft** for such a draft, not Archive, so the normal path works; the
  Themes list's batch **Archive** was not tried. Not changed here (core code, Minimal change);
  the guide says to use Delete Draft. Upstream issue to be filed by the owner.

Implicit state review (§5), as built: unchanged, plus the two refusals above (no record) and the
never-published theme (Delete Draft, not Archive).
