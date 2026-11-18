// Section patterns for editors (m1-079, D-CONTENT-24 Q3):
//
//   node app wms-patterns:seed
//
// Adds the draft page "Patterns (do not publish)" and one draft sub-page per
// pattern (lib/patterns.js). Editors open a pattern, copy a section (core's
// widget copy and paste) and paste it into their own page.
//
// Draft only: the task never publishes, so visitors never see a pattern. The
// parent is hidden from navigation. Adds missing pages only; a page that
// exists (also archived) is never changed, so a re-run keeps an editor's work.
// Everything goes through `convert`, the editor UI's sanitization path.
import { PARENT, patternPages } from './lib/patterns.js';

export default {
  tasks(self) {
    return {
      seed: {
        usage: 'Add the section patterns as draft pages (m1-079). Adds missing pages only; ' +
          'never publishes.\nUsage: node app wms-patterns:seed',
        task: () => self.seed()
      }
    };
  },
  methods(self) {
    return {
      async seed() {
        const req = self.apos.task.getReq({ mode: 'draft' });
        const created = [];
        const parent = await self.ensurePage(req, '_home', {
          ...PARENT,
          orphan: true,
          main: {
            metaType: 'area',
            items: []
          }
        }, created);
        for (const page of patternPages(() => self.apos.util.generateId())) {
          await self.ensurePage(req, parent._id, page, created);
        }
        self.apos.util.log(created.length
          ? `Patterns created as drafts: ${created.length}\n  ${created.join('\n  ')}`
          : 'Patterns already present; nothing changed.');
      },

      async ensurePage(req, parentId, input, created) {
        const existing = await self.apos.page.find(req, { slug: input.slug })
          .archived(null)
          .toObject();
        if (existing) {
          return existing;
        }
        const type = 'default-page';
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
