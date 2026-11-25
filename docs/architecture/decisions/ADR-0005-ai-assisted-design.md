# ADR-0005: AI-assisted design through Apostrophe's core AI engine

| | |
|---|---|
| **Status** | **Accepted** 2026-11-25 (`m1-088`, D-CONTENT-33 Q1). Drafted by the agent; accepted by the owner |
| **Date** | 2026-11-25 |
| **Task** | `m1-088` · design: [m1-088 design note](../../milestones/m1-088-ai-assisted-design-design.md) · report: to follow |
| **Approved by** | Project owner, 2026-11-25, in session: "continue with your recommendatons", recorded as approval of every recommendation in D-CONTENT-33 (Q1–Q9 a), Q1 being this ADR |

## Context

The [m1-084 handoff](../../milestones/m1-084-handoff.md) §4 planned AI-assisted design: suggest a
theme (a token set) or a page layout (existing widgets, patterns and templates, never raw HTML or
CSS) from a short brief, each result a draft for a human to publish. m1-084 to m1-087 built the
data shapes it needs: themes as data with a fixed shape (`lib/themes.js`), WCAG 2.2 AA contrast
checks (`lib/theme-contrast.js`), section patterns and page templates built by pure functions
(`modules/wms-patterns/lib/`), and custom themes as an admin-only, validated piece type
(`wms-theme`). The [m1-088 handoff](../../milestones/m1-088-handoff.md) makes an ADR the first
step: an external AI service, a key and spending are architecture gates (AGENTS.md).

**Core already has an AI engine.** Apostrophe 4.33.0 added `apos.ai`, and the installed 4.34.0
ships it enabled but inert (checked in `node_modules/apostrophe`):

| Fact | Where |
|---|---|
| `@apostrophecms/ai` plus adapters for Anthropic, OpenAI, Google and any OpenAI-compatible service are in core's default module list | `defaults.js` |
| Opt-in: no provider and no key out of the box. A provider is an entry in the module's `providers` option; with none, `apos.ai.active` is false | `ai/index.js` |
| The Anthropic adapter calls the Messages API through core `apos.http`, **no SDK**. Its key comes from `APOS_ANTHROPIC_KEY` (the environment overrides the option) | `ai-adapter-anthropic/index.js`, `ai/lib/startup.js` |
| A configured provider without a key **stops the app at start** (`requireApiKey`); there is no network call at start | same |
| `generate(req, { system, messages, schema, maxTokens, effort })`: structured output against a JSON Schema, validated by the engine (Ajv) before it is returned | `ai/index.js` |
| `generateJob()`: the same call as a background job on `@apostrophecms/job`, with an `onEnd` callback; the job status route needs `view-draft` and the same user | `ai/index.js`, `job/index.js` |
| A `usage` event once per provider response (billed tokens, retries included) | `ai/index.js`, CHANGELOG 4.34.0 |
| Retries with a 60 s budget per call; a refusal is the `aiRefusal` error (422) | `ai/index.js` |
| `APOS_AI_MOCK=1` answers every call with a mock, no network and no key: tests run offline | `ai/lib/mock.js` |
| The engine adds **no route** of its own. Only project code can start a call | grep of `ai*` modules |

## Decision

1. **Engine.** AI-assisted design uses core `apos.ai` only. No new package, no SDK, no direct HTTP
   call to a provider from project code. Changing provider is a configuration change.
2. **Provider and model** (owner's choice, D-CONTENT-33 Q2). Recommended: **Anthropic**, through
   core's adapter, model `claude-opus-5-5` at effort `medium` (the model's default). Price on
   2026-11-25: USD 4 per million input tokens, 20 per million output tokens (thinking included).
3. **Key.** One key per site (ADR-0002: one set of secrets per site), in a provider workspace of its
   own with a monthly spend limit set by the owner. Locally in the git-ignored `.env` as
   `APOS_ANTHROPIC_KEY`; on a server in the app's secret volume (`/secrets/app/anthropic-key`),
   exported by the app's start script as the session secret is. Never in the database, the browser,
   Git, logs, reports or test fixtures. **The provider entry is added only when the key is set**:
   without a key the app starts, `apos.ai.active` is false and the feature is off.
4. **What is sent.** Only the admin's brief (at most 1,000 characters) and a fixed catalogue from
   code: the theme token schema, preset names and labels, and the names and one-line descriptions
   of the section patterns. Never page content, users, form submissions, media, Global Content or
   any other database content. A brief that contains an e-mail address or a phone number is
   refused before anything is sent. The model gets **no tools** (one turn, structured output only),
   so it cannot read or change anything.
5. **Who.** Admins only (D-M0-11), checked on the server for the admin UI and the REST API. Nothing
   is exposed to visitors or editors.
6. **Cost limits.** At most 20 suggestions per site per day (environment setting, default 20); an
   output-token cap per call; at most one automatic repair call per suggestion; every call's token
   counts stored with the suggestion. Estimate: USD 0.05 to 0.20 per suggestion, so at most about
   USD 4 per site per day at the cap; to be measured in the build.
7. **Validation.** The engine checks the answer against the JSON Schema; then the project checks it
   with the same code as a human's save: `validateTheme()` and the contrast pairs for a theme
   (through `wms-theme`'s `beforeSave`), and names that must exist in the pattern catalogue for a
   layout, built only by the pattern builders. The model never writes HTML, CSS, rich text or a
   field the schema does not list.
8. **Result.** Always a draft that a human reviews and publishes: a draft `wms-theme`, or a draft
   page under "Templates (do not publish)" (design note §3.5). Nothing is published by the AI.
9. **Tests** run with `APOS_AI_MOCK=1`: no key, no network, no cost in CI. A live call needs the
   owner's key and the owner's approval for the spending.
10. **Where it may be used** (D-CONTENT-33 Q3). Recommended: locally and on staging with test briefs
    as soon as this ADR is accepted; on production only after the DPO confirms the provider as a
    processor (the provider processes the brief outside the site's hosting; its commercial terms
    govern retention).

## Consequences

- **Positive:** no new dependency or supply-chain risk; core maintains the provider dialects,
  retries, schema validation, jobs and usage records. The feature cannot change the live site:
  every result is a validated draft. Prompt injection through the brief can at worst produce a bad
  draft, because the model has no tools. Offline tests in CI.
- **Negative:**
  - An external processor receives the brief: a data-protection question for the DPO (Decision
    10).
  - Spending depends on the provider's price list, which can change; the cap and the provider's
    spend limit bound it.
  - `apos.ai` is new in core (4.33.0, 2026-09-30); its API may still change between minor
    releases. Each Apostrophe upgrade re-runs the mock suite.
  - Suggestions are not reproducible: the same brief can give a different result.
- **Follow-ups:** the DPO question (Decision 10); the owner creates the provider workspace, key and
  spend limit; the staging start script and runbook gain the key file.

## Alternatives considered

| Option | Why not chosen |
|---|---|
| The provider's official SDK (`@anthropic-ai/sdk`) or direct `fetch` from project code | Core already has the integration; a package needs the dependency gate; both duplicate core (AGENTS.md: official Apostrophe APIs first) |
| OpenAI or Google through core's other adapters | Possible by configuration (D-CONTENT-33 Q2 c). Not recommended now: one provider keeps the DPO question to one processor |
| A self-hosted model through the OpenAI-compatible adapter | No data leaves the site, but needs a GPU server and operation work far beyond this feature |
| Tools for the model (read pages, create the draft itself) | More capable but the model could act on the database; structured output plus project code that creates the draft is enough for a suggestion |
| No AI: more presets and templates only | Still possible; the owner asked for AI-assisted design in the m1-084 plan |
