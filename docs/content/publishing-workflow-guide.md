# Publishing workflow guide (review before publish)

| | |
|---|---|
| **Status** | Agent draft (m1-037); for the business owner to review before staff rollout |
| **Decision** | [D-CONTENT-11](../engineering/decision-register.md), option B: review before publish, one approval per change |
| **Applies to** | Everyone who edits the website |

## 1. Roles

| Role | Who | Can do |
|---|---|---|
| **Contributor** | Content staff | Create and change **drafts** of pages, products, organisations, people, locations, forms and Global Content (contact details, footer, header button). **Submit** a draft for review. Choose images and files already in the media library |
| **Editor** | Named approvers (at least two, to cover absence) | Everything a contributor can do, plus **review** and **publish** submitted drafts, archive content, add images and files to the media library, and manage redirects |
| **Admin** | Developers | Everything, including user accounts, Global Styles and form submissions |

A contributor cannot publish, unpublish, archive or delete published content. The server refuses
these actions, as well as hiding the buttons.

The names of the people in each role are not kept in this repository.

## 2. Contributor: propose a change

1. Log in. Open the page, or open the item from **Content** (Products, Organisations, People,
   Locations) or **Global Content**.
2. Make the change. It is saved as a **draft**. Visitors still see the published version.
3. Select **Submit**. The message "Submitted to Admins and Editors for review" appears.
4. Tell an editor that a change is waiting. **The website sends no notification.**
5. To take a submission back before it is reviewed, open the draft and use **More Options** →
   **Dismiss Submission**.

Images and files: ask an editor to add new images or files to the media library. You can then
choose them in your draft.

## 3. Editor: review and publish

1. Log in. The **Manage Draft Submissions** icon in the admin bar shows how many drafts are
   waiting.
2. Open the icon. The list shows each draft, its type, when it was submitted and who submitted it.
3. Open a draft. Check the text, links, prices and legal wording. You can correct it yourself.
4. Select **Publish**. The change is now live and the submission leaves the list.
5. If the change should not go live, use **More Options** → **Dismiss Submission**. The draft is
   kept, unpublished. Tell the contributor why.

Check carefully before you publish: product claims, prices, contact details, regulatory and legal
text, and anything in Global Content (it appears on every page).

## 4. Points to know

- **Media is public at once.** An image or file in the media library is published as soon as an
  editor adds it. It shows on a page only when a published page uses it, but anyone who has its
  address can open it. Do not upload confidential files.
- **No email alerts.** Agree how contributors tell editors about waiting drafts (for example, a
  team chat message).
- **Accounts.** An admin creates accounts with the right role
  (`node app @apostrophecms/user:add <name> contributor` or `editor`) or in the Users manager. A
  role can be changed later without losing content.
- **Slideshows and motion** (m1-072). A page has one H1 heading. A slide heading is H2 by
  default; choose H1 only when the slideshow is the page title and no hero on the page uses H1.
  Visitors can always pause a slideshow; it starts paused while you edit the page, so use
  Preview to see it move. An "Entrance animation" (Styles button on layouts, columns and
  sections) plays once when the section scrolls into view; visitors who ask their device for
  less motion see no animation.

## 5. Start from a pattern or a template (m1-079, m1-086)

Patterns and templates are draft pages with placeholder text ("Replace …"). An admin adds them
with `node app wms-patterns:seed` (it only adds missing pages and never publishes). They are never
published: the site refuses to publish anything under "Patterns (do not publish)" or "Templates
(do not publish)", and visitors cannot see them.

**A section from a pattern.** Open a page under "Patterns (do not publish)", copy the section
(the widget's copy button) and paste it into your own page.

**A whole page from a template** (about the company, division overview, product category,
leadership, contact):

1. Open **Pages**, find the template under "Templates (do not publish)" and choose **Duplicate**
   in its menu.
2. Change the title and the slug, and save the draft. The copy is placed under the page you were
   viewing when you chose Duplicate.
3. If the copy is under "Templates (do not publish)" or in the wrong place, drag it to where it
   belongs in **Pages**. A copy under Templates cannot be published. Moving a page that was never
   published may show a short "notfound" notice; the move has worked (it is a core message).
4. Replace every placeholder, add your images, delete the "How to use" line and publish (or
   submit it for review).

The new page has no link to its template: changing a template later changes only the pages made
from it afterwards. Edit a template only to improve it for everyone; never put real content in it.

## 6. Custom themes (admins only, m1-087)

Global Styles → Theme offers 12 ready-made themes. An admin can also make a custom theme: a copy
of one of them with changed colours, type, shape or layout. Editors do not see Themes.

1. Admin bar → **Site admin** → **Themes** → **New Theme**. Give it a unique name (for example
   "Ocean (customised)"), choose **Start from**, and save.
2. Open the theme again. The Colours, Type, Shape and Layout tabs now hold the copied values.
   Change what you need and save.
3. Every save is checked for readable colours (WCAG 2.2 AA). If a pair is too weak, the theme is
   not saved and the message names the pair and both colours, for example "Muted text (footer,
   breadcrumbs): #999999 on #ffffff is 2.84:1, needs 4.5:1". Change one of the two colours and
   save again.
4. **Publish** the theme. This only adds it to Global Styles → Theme; visitors see no change yet.
5. Reload the page, open **Global Styles → Theme**, choose the theme, check the preview, and save.
   Visitors see the new look from then on (within about 10 seconds on every server process).

Points to know:

- **A theme in use cannot be archived or unpublished.** Choose another theme in Global Styles
  first.
- **Publishing changes to a theme in use changes the live site.** To try changes first, choose
  **Duplicate** on the theme, change and publish the copy (not in use, so nothing changes), choose
  the copy in Global Styles to preview it, and save Global Styles only if you like it.
- **A custom theme is a copy.** Later releases that change the theme it started from do not change
  it. "Started from" records where it came from.
- The other Global Styles settings (line height, font sizes, header and footer style and so on)
  apply on top of every theme, custom or not.

## 7. Design suggestions from AI (admins only, m1-088)

On a site with an AI key, an admin can ask for a theme or a page layout from a short brief. The
result is always a draft that you review; nothing is published for you. Editors do not see Design
suggestions, and the menu entry is hidden on a site without a key.

1. Admin bar → **Site admin** → **Design suggestions** → **New Design suggestion**.
2. Give it a name for your own list, choose **A theme** or **A page layout**, and write the
   **Brief**: the mood, the audience and any colours, in a few sentences.
   The brief is sent to an external AI service. Write no names of people or customers, no
   contact details and no prices. A brief with an e-mail address or a phone number is not saved.
3. Save. The suggestion runs in the background (usually under a minute); a notification says when
   it is ready or failed. Open the suggestion again: **Result** shows the status, the model's
   notes and the draft it made.
4. **Theme:** open the suggested theme (Site admin → Themes, named "… (AI suggestion)"). It is
   checked for readable colours like any theme. Change what you like, then follow §6 from step 4:
   publish, reload, choose it in Global Styles, preview, save.
5. **Page layout:** open the page under **Templates (do not publish)** named "Suggestion: …". It is
   built only from the section patterns (§5), with placeholders. Use it like a template:
   Duplicate, move the copy, replace every placeholder with confirmed facts, add photos, publish
   the copy. The suggestion page itself can never be published.

Points to know:

- **A brief cannot be changed after saving.** To try another brief, choose **Duplicate** on the
  suggestion, change the brief and save.
- **Daily limit:** 20 suggestions per site per day (UTC) unless the site sets another number.
  Every suggestion counts, failed ones too.
- **Usage** shows the model and the tokens billed for each suggestion.
- **Failed** shows why: the model declined the brief, the service did not answer, or the theme
  failed the readability check twice (the colour pairs are named). Nothing is created then.
- **Not useful?** Archive the suggestion. For a suggested theme that was never published, the
  theme's menu (⋮ in Themes) offers **Delete Draft**: that removes it for good. Leaving it as a
  draft is harmless: Global Styles offers published themes only. Avoid **Archive** in the Themes
  list for a never-published theme: the CMS version in use answers that request with an error
  through its API (found in m1-088; the list button itself was not tried).
