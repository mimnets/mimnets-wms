// Project migrations. Core runs each pending migration once, in the order
// added, on every start before the site serves requests, and records it in
// `aposMigrations`.
import { renameDoc } from './lib/rename-stage-3.js';
import {
  hiddenColumnFields, isPatternPage, showPatternColumns
} from './lib/show-pattern-columns.js';

export default {
  handlers(self) {
    return {
      'apostrophe:modulesRegistered': {
        // Added here, not in `init`, so that it runs after core's own
        // migrations, including the one that packs legacy versions.
        addRenameStage3() {
          // Rename stage 3 (m1-076, D-GIT-78): stored `assurer-*` names become
          // `wms-*` in every doc (all modes, archived too) and in the packed
          // doc of every version, which editors can restore. Idempotent; a
          // restored pre-stage-3 backup has no record and runs it again.
          self.add('wms-rename-stage-3', async () => {
            const walk = self.apos.doc.walk;
            await self.eachDoc({}, 5, async doc => {
              const fields = renameDoc(doc, walk);
              if (fields.length) {
                const $set = Object.fromEntries(
                  fields.map(field => [ field, doc[field] ])
                );
                await self.apos.doc.db.updateOne({ _id: doc._id }, { $set });
              }
            });
            const versions = self.apos.docVersions;
            await self.each(versions.db, {}, 5, async version => {
              const doc = await versions.unpack(version.doc);
              if (renameDoc(doc, walk).length) {
                const packed = await versions.pack(doc);
                await versions.db.updateOne(
                  { _id: version._id },
                  { $set: { doc: packed } }
                );
              }
            });
          });
        },
        addShowPatternColumns() {
          // m1-085 (D-CONTENT-30): layout columns on the pattern pages were
          // stored hidden on tablets and phones; show them. Every mode,
          // archived too. Other pages are only listed in the log, for a
          // person to check (a section pasted from a pattern keeps the
          // hidden columns; on other pages hiding may be deliberate).
          // Idempotent: a shown column no longer matches. Old versions are
          // not changed: restoring one brings the hidden columns back.
          self.add('wms-show-pattern-columns', async () => {
            const walk = self.apos.doc.walk;
            const fixed = [];
            const toCheck = [];
            await self.eachDoc({}, 5, async doc => {
              const fields = showPatternColumns(doc, walk);
              if (fields.length) {
                const $set = Object.fromEntries(
                  fields.map(field => [ field, doc[field] ])
                );
                await self.apos.doc.db.updateOne({ _id: doc._id }, { $set });
                fixed.push(doc._id);
              } else if (!isPatternPage(doc) && hiddenColumnFields(doc, walk).length) {
                toCheck.push(`${doc.slug || doc.title} (${doc._id})`);
              }
            });
            self.apos.util.log(`wms-show-pattern-columns: shown on ${fixed.length} pattern doc(s).`);
            if (toCheck.length) {
              self.apos.util.log('wms-show-pattern-columns: columns hidden on tablet and phone, ' +
                `not changed, check by hand:\n  ${toCheck.join('\n  ')}`);
            }
          });
        }
      }
    };
  }
};
