# m1-079 — Prompt

A new Claude Code session, opened from `Documents\mimnets-wms`.

Owner's requests, verbatim, in order (2026-11-18):

- "Tell me one thing honesty - we are using apostrophe rihgt as a framework and then changing and
  adding modules and features on it right?" and a follow-up on what happens if Apostrophe stops
  releasing updates (questions only; the agent answered, no change)
- "ok, let's continue with m1-079 - so brief me where are we now and what left and what time needed
  to achieve the target? And what about theme development or i mean to design of the theme or
  layout ... how can atleast design the layout automatic with AI for visitors attraction?" (the
  agent found PR #95 merged, briefed the status of CA-1 to CA-7, and proposed a theme design pass:
  screenshot critique of real content on the three presets, then section patterns; no runtime AI)
- "go with the theme design pass for m1-079 on the run book do you mentioned as guide all that
  waiting on me?" (the agent mapped each owner item to its guide; only the OCI switch is in the
  staging runbook, §12.6)
- Answer to the agent's question on where to take the screenshots: "Local, import real content
  (Recommended)": the WordPress import into a separate local audit database, drafts archived after
  the audit
- "first go with your findings and recommendations and for decisions what do you mean for
  D-CONTENT-24? 1. your recommended 2. remove 3. your recommended 4. your recommended 5. both"
  and "tell me how can i do the same import from the assurer website ... let me check it in local
  on the contianer with kiri." (approval of the design, recorded as D-CONTENT-24; the agent
  explained the decision register entry and gave the import steps for the `wms-local` container
  on Kiri, after a dry run there)
- "and i want you to - add this core structure in the readme file with polished:" followed by the
  agent's earlier explanation of the three layers (pasted by the owner): added to README.md as
  "How it is built", with one correction (SQLite locally, MongoDB on servers)
