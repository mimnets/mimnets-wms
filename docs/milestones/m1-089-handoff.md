# m1-089 start handoff (2026-11-25)

| | |
|---|---|
| **Prepared** | 2026-11-25, by the agent at the end of m1-088 (agent-executed; not a human approval) |
| **State of `main`** | `7eb573e` when written. This file is in the m1-088 branch (`feat/m1-088-ai-assisted-design`). Before starting, check that its commit is on `origin/main` (`git merge-base --is-ancestor <commit> origin/main`) |
| **Session** | Start a **new Claude Code session** (AGENTS.md, Sessions and context) |
| **Read first** | [AGENTS.md](../../AGENTS.md) · [INDEX](../engineering/INDEX.md) · [m1-088 report](../engineering/reports/2026/11/2026-11-25-m1-088-ai-assisted-design.report.md) · [ADR-0005](../architecture/decisions/ADR-0005-ai-assisted-design.md) · [m1-088 design](m1-088-ai-assisted-design-design.md) §9 |

## 1. Where things stand

**Done in m1-088** (ADR-0005 accepted, D-CONTENT-33): admins ask for a theme or a page layout
from a short brief in Site admin → Design suggestions. Core `apos.ai` with Anthropic
`claude-opus-5-5`, no new package; off without `APOS_ANTHROPIC_KEY`. A theme becomes a draft
`wms-theme` (one repair call on a contrast failure); a layout becomes a draft page under
"Templates (do not publish)" built from the section patterns. Tests run with core's mock.
Guide: publishing workflow guide §7.

**Open, for the owner**

1. Review the m1-088 branch; approve commit, push and PR.
2. After the release: nothing to run (no migration, no seed). The feature stays off until a key
   is added (staging runbook §6).
3. A key and a spend limit per site, then one approved live call per kind to measure tokens and
   cost. Production use only after the DPO confirms the provider (ADR-0005 Decision 10).
4. Core 4.34.0 bug: archiving a never-published draft through the REST API answers 500 (m1-088
   report, Findings 1). Upstream issue, if wanted.
5. Still open from earlier: `node app wms-patterns:seed` from m1-086 if not yet run, the category
   landing H1, the m1-085 hidden pattern columns check, OCI items (set Bold after the release,
   D-CONTENT-24 Q4), the WordPress spam check, brand values (D-CONTENT-12), the privacy notice to
   the DPO (D-CONTENT-15).
6. **This clone has no `.env` or `data/`.** Server suites run through `npm run test:ci`.

## 2. Next task: m1-089 (the owner chooses)

a. **Live measurement of design suggestions** once the owner has a key: one theme and one layout
   on a local site, the real token counts and cost recorded, the output cap and the prompt tuned
   if needed. The key stays with the owner (`.env`); the agent does not read it.
b. **An open item from §1** the owner picks.

## 3. Facts to start from

- Engine config: `modules/@apostrophecms/ai/index.js`; feature: `modules/wms-design-suggestion/`
  (`lib/prompts.js` holds the prompts and schemas; `lib/mock.js` the test answers).
- Patterns by key: `patternDefs()` in `modules/wms-patterns/lib/patterns.js`.
- Tests: `scripts/design-suggestion.test.mjs` (unit), `scripts/design-suggestion-test.mjs` (REST,
  in `npm run test:ci`, once without a key and once with `APOS_AI_MOCK=1`).

## 4. Lessons from m1-088

- Core 4.34.0 already has `apos.ai` (opt-in) with provider adapters, structured output, jobs,
  `usage` events and a mock: read `node_modules/apostrophe` before designing an integration.
- A configured `apos.ai` provider without a key stops the app at start: configure it only when
  the key is set.
- Core `apos.notify(req, message, options, interpolate)` from the server showed `{{ title }}`
  literally; a plain message with `localize: false` works.
- Archiving a never-published draft through the REST API fails in core 4.34.0; the UI offers
  Delete Draft for such a draft.
- A subclass's `afterSave` handler runs after core's (autopublish included).
- Test helpers must not import packages that are only transitive (Ajv): a small local checker did.

## 5. Limits

No change to WordPress. Commit, push and PR need the owner's approval. Anything on the OCI server
is run by the owner. No live AI call or spending without the owner's approval.

## 6. Prompt for the new session

> Start m1-089. Read AGENTS.md and docs/milestones/m1-089-handoff.md first, check that the m1-088
> PR is on main, then confirm the task with me (live measurement or an open item) and stop for my
> approval before any live AI call.
