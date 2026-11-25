# m1-088 — Prompt

A new Claude Code session (cleared with `/clear` first), opened from
`C:\Users\Monir\Dev\mimnets-wms` (no `.env` or `data/` in this clone).

Owner's requests, verbatim, in order (2026-11-25):

- "Start m1-088. Read AGENTS.md and docs/milestones/m1-088-handoff.md first, check that the m1-087
  PR is on main, then write the ADR and design note for AI-assisted design (or the item I name) and
  stop for my approval." (the agent confirmed m1-087 on `origin/main`, PR #107 merged as
  `7eb573e`; found that core `apostrophe` 4.34.0 already ships `apos.ai` with provider adapters;
  wrote [ADR-0005](../../../../architecture/decisions/ADR-0005-ai-assisted-design.md) and the
  [design note](../../../../milestones/m1-088-ai-assisted-design-design.md), opened D-CONTENT-33 and
  stopped for the owner's decisions)
- "do we have a sitemap url to submit to google search console?" (answered in chat from
  `docs/runbooks/seo.md` §4 and §5; no change)
- "continue with your recommendatons" (recorded as approval of D-CONTENT-33, every
  recommendation, Q1–Q9 a, including ADR-0005; not an approval to commit, push or open a pull
  request, nor of a live AI call or spending)
- "approve" (after the agent's report asked to approve commit, push and opening the PR: recorded
  as approval of the commit and push; `gh` is not installed, so the owner opens the PR from the
  compare link. Not an approval of merging, a key, a live AI call or spending)
