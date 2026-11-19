# m1-083 start handoff (2026-11-19)

| | |
|---|---|
| **Prepared** | 2026-11-19, by the agent at the end of m1-082 (agent-executed; not a human approval) |
| **State of `main`** | `dc0c05d` when written. This file is in the m1-082 PR (branch `feat/m1-082-menu`). Before starting, check that its commit is on `origin/main` (`git merge-base --is-ancestor <commit> origin/main`) |
| **Session** | Start a **new Claude Code session** (AGENTS.md, Sessions and context) |
| **Read first** | [AGENTS.md](../../AGENTS.md) · [INDEX](../engineering/INDEX.md) · [m1-082 report](../engineering/reports/2026/11/2026-11-19-m1-082-menu.report.md) · [m1-082 design](m1-082-menu-design.md) |

## 1. Where things stand

**Done in m1-082** (D-CONTENT-27): a "Main menu" list in Global Content (Navigation). Items link
to a page, a section of a page or an external URL, with an optional submenu; an empty list keeps
the page-tree menu. The local `wms-local` container now has the original's menu (Products,
Organizations, Services, Leadership, Contact Us), anchors on three home sections, and Downloads
and Images in the footer links.

**Open, for the owner**

1. Review and merge the m1-082 PR.
2. Archive the test editor `m1-082-editor` in the container (Users, as admin).
3. Choose the default preset on the container (Global Styles → Theme; D-CONTENT-24 Q4 /
   D-CONTENT-25 Q7).
4. After the release on OCI: set the home anchors, Main menu and footer links there, with the
   m1-080 and m1-081 items (footer, photo sections, full-width bands).
5. Still open from earlier: check the original WordPress site for injected spam; optionally report
   the core Global Styles fault to ApostropheCMS; the OCI switch (staging runbook §12.6); brand
   values (D-CONTENT-12); the privacy notice to the DPO (D-CONTENT-15); review and publish the
   import on OCI.

## 2. Recommended next task

The owner chooses one, each with a design note first:

- **Run-time AI design note** (D-CONTENT-24 Q5).
- **Backup status in the dashboard's Health tab** (D-DB-24).
- **Edit-mode submenus**: check whether desktop submenus showing open in edit mode after an
  Update also happens on `main` (m1-082 report, Known limitations); fix if it is ours.

## 3. Lessons from m1-082

- The page tree cannot reproduce the original menu: categories sit under `/style` and `/health`,
  and organizations link to external sites and home sections. A Global Content list avoids URL
  changes.
- Page `_url` values are absolute (base URL): tests must not expect a relative `href`.
- In the container, the agent may not read `/data/secrets`. The owner creates the test editor
  with one `kiri exec … bash -c '…'` command. In Windows PowerShell 5.1, the command must contain
  no inner double quotes (PowerShell strips them); escape `&` as `\&`.
- Apostrophe's array editor: wait about one second after a dialog opens before clicking "add";
  an early click selects the existing item and typing goes into it.
- Native `<select>` popups do not respond to the extension's clicks or keys. Set the visible
  select's value and dispatch `change`; `form_input` by ref can hit a hidden select of the parent
  dialog.
- Update right after a widget save can publish before the save lands; check the public page and
  Update again if needed.

## 4. Limits

No change to WordPress. Commit, push and PR need the owner's approval. Anything on the OCI server is
run by the owner.

## 5. Prompt for the new session

> Start m1-083. Read AGENTS.md and docs/milestones/m1-083-handoff.md first, check that the m1-082
> PR is on main, confirm the task with me, write the design note and stop for my approval.
