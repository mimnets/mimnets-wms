// Section patterns (m1-079, D-CONTENT-24 Q3) and page templates (m1-086,
// D-CONTENT-31) for editors:
//
//   node app wms-patterns:seed
//
// Adds the draft page "Patterns (do not publish)" with one draft sub-page per
// pattern (lib/patterns.js), and "Templates (do not publish)" with one draft
// sub-page per template (lib/templates.js). Editors copy a section from a
// pattern (core's widget copy and paste) or duplicate a whole template (core's
// Duplicate), then edit and publish their own page.
//
// Draft only: the task never publishes, and the server refuses to publish
// anything under the two parents (lib/never-published.js), so visitors never
// see a pattern or template. The parents are hidden from navigation. Adds
// missing pages only; a page that exists (also archived) is never changed, so
// a re-run keeps an editor's work. Everything goes through `convert`, the
// editor UI's sanitization path.
import { PARENT, patternPages } from './lib/patterns.js';
import { TEMPLATES_PARENT, templatePages } from './lib/templates.js';
import { NEVER_PUBLISHED_MESSAGE, isNeverPublished } from './lib/never-published.js';

export default {
  handlers(self) {
    return {
      '@apostrophecms/page-type:beforePublish': {
        // D-CONTENT-31 Q3: covers the editor UI (also core's offer to publish
        // unpublished parents first) and the REST API, for every role. Core
        // emits beforePublish from the page type module, so the handler
        // listens on the base class. 'invalid', not 'forbidden': core's
        // publish dialog replaces a 'forbidden' parent error with a canned
        // text about permissions; any other error shows this message.
        refuseNeverPublished(req, { draft }) {
          if (isNeverPublished(draft.slug)) {
            throw self.apos.error('invalid', NEVER_PUBLISHED_MESSAGE);
          }
        }
      }
    };
  },
  tasks(self) {
    return {
      seed: {
        usage: 'Add the section patterns (m1-079) and page templates (m1-086) as draft ' +
          'pages. Adds missing pages only; never publishes.\nUsage: node app wms-patterns:seed',
        task: () => self.seed()
      }
    };
  },
  methods(self) {
    return {
      async seed() {
        const req = self.apos.task.getReq({ mode: 'draft' });
        const created = [];
        const id = () => self.apos.util.generateId();
        for (const [ parentInput, pages ] of [
          [ PARENT, patternPages(id) ],
          [ TEMPLATES_PARENT, templatePages(id) ]
        ]) {
          const parent = await self.ensurePage(req, '_home', {
            ...parentInput,
            orphan: true,
            main: {
              metaType: 'area',
              items: []
            }
          }, created);
          for (const page of pages) {
            await self.ensurePage(req, parent._id, page, created);
          }
        }
        self.apos.util.log(created.length
          ? `Patterns and templates created as drafts: ${created.length}\n  ` +
            created.join('\n  ')
          : 'Patterns and templates already present; nothing changed.');
      },

      async ensurePage(req, parentId, input, created) {
        const existing = await self.apos.page.find(req, { slug: input.slug })
          .archived(null)
          .toObject();
        if (existing) {
          return existing;
        }
        // Patterns and parents are default pages; a template names its type.
        const type = input.type || 'default-page';
        const manager = self.apos.doc.getManager(type);
        const page = manager.newInstance();
        await manager.convert(req, {
          ...input,
          type
        }, page);
        const inserted = await self.apos.page.insert(req, parentId, 'lastChild', page);
        created.push(input.slug);
        return inserted;
      }
    };
  }
};
