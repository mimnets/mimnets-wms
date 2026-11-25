// Custom themes (m1-087, D-CONTENT-32): an admin copies a preset, changes its
// tokens and publishes it; Global Styles → Theme then offers it next to the
// presets. Design: docs/milestones/m1-087-custom-themes-design.md.
//
// - Admins only (D-M0-11): core view, edit and publish roles, enforced by
//   core for the admin UI and the REST API.
// - A full copy of a preset (Q1): on the first save the server copies the
//   chosen preset's tokens into the fields; a release that changes the preset
//   never changes the copy.
// - Validated on every save, drafts too (Q3): the shape (validateTheme()) and
//   the WCAG 2.2 AA pairs that every preset passes (lib/theme-contrast.js).
// - Published means "offered in Global Styles", not "visible": a theme has no
//   page and changes the site only when Global Styles chooses it.
// - The class is `wms-theme-custom-<aposDocId>` (Q4): the same in draft and
//   published, unchanged by a rename, never a preset's.
// - A theme chosen in Global Styles cannot be unpublished or archived (Q8).
import { themes, validateTheme } from '../../lib/themes.js';
import { contrastProblems } from '../../lib/theme-contrast.js';
import {
  colourFieldNames, fieldsFromTokens, normaliseColour,
  tokenFields, tokenGroups, tokensFromFields
} from './lib/fields.js';

const IN_USE_MESSAGE = 'This theme is used in Global Styles. Choose another theme there and ' +
  'save, then archive or unpublish this one.';

export default {
  extend: '@apostrophecms/piece-type',
  options: {
    label: 'Theme',
    pluralLabel: 'Themes',
    // Core derives "G,T"; a capital T keeps it apart from other types.
    shortcut: 'G,Shift+T',
    viewRole: 'admin',
    editRole: 'admin',
    publishRole: 'admin',
    quickCreate: false,
    searchable: false,
    // A theme has no page: no SEO fields (@apostrophecms/seo option).
    seoFields: false,
    sort: { title: 1 }
  },
  fields: {
    add: {
      title: {
        type: 'string',
        label: 'Name',
        help: 'How the theme is listed in Global Styles → Theme, for example "Ocean (customised)". Must be unique.',
        required: true
      },
      startFrom: {
        type: 'select',
        label: 'Start from',
        help: 'The theme to copy. Save, then open the theme again to change its colours, type and shape.',
        required: true,
        def: themes[0].name,
        if: { started: false },
        choices: themes.map(theme => ({
          label: theme.label,
          value: theme.name
        }))
      },
      startedFrom: {
        type: 'string',
        label: 'Started from',
        help: 'A copy of this theme when it was made. Later changes to that theme do not change this one.',
        readOnly: true,
        if: { started: true }
      },
      // Set by the server on the first save, when the tokens are copied.
      started: {
        type: 'boolean',
        def: false,
        hidden: true
      },
      ...tokenFields
    },
    group: {
      basics: {
        label: 'Basics',
        // `started` is hidden; listed so no empty "Ungrouped" tab appears.
        fields: [ 'title', 'startFrom', 'startedFrom', 'started' ]
      },
      ...tokenGroups
    }
  },
  handlers(self) {
    return {
      beforeInsert: {
        // Q1: a full copy of the chosen preset. A theme that arrives started
        // (core's Duplicate, a later AI draft) keeps its own tokens and is
        // checked like any other in beforeSave.
        copyPreset(req, doc) {
          const preset = themes.find(theme => theme.name === doc.startFrom);
          if (!doc.started) {
            if (!preset) {
              throw self.apos.error('invalid', 'Choose a theme to start from.');
            }
            Object.assign(doc, fieldsFromTokens(preset.tokens));
            doc.started = true;
          }
          // Read-only, so core's convert (and Duplicate) never fills it.
          doc.startedFrom = doc.startedFrom || preset?.label || '';
        }
      },
      beforeUpdate: {
        // Once started, always started: "Start from" would do nothing.
        keepStarted(req, doc) {
          doc.started = true;
        }
      },
      beforeSave: {
        async refuseArchiveInUse(req, doc) {
          if (doc.archived && !doc.aposWasArchived && await self.inUse(doc)) {
            throw self.apos.error('invalid', IN_USE_MESSAGE);
          }
        },
        async checkTheme(req, doc) {
          for (const name of colourFieldNames) {
            doc[name] = normaliseColour(doc[name]);
          }
          const problems = [
            ...validateTheme(self.themeFromDoc(doc)),
            ...await self.nameProblems(doc)
          ];
          if (!problems.length) {
            problems.push(...contrastProblems(tokensFromFields(doc)));
          }
          if (problems.length) {
            throw self.apos.error('invalid', `The theme was not saved. ${problems.join(' ')}`);
          }
        }
      },
      beforeUnpublish: {
        async refuseUnpublishInUse(req, published) {
          if (await self.inUse(published)) {
            throw self.apos.error('invalid', IN_USE_MESSAGE);
          }
        }
      }
    };
  },
  methods(self) {
    return {
      className(doc) {
        return `wms-theme-custom-${String(doc.aposDocId).toLowerCase().replace(/[^a-z0-9]/g, '')}`;
      },
      // The same object as a preset in lib/themes.js.
      themeFromDoc(doc) {
        return {
          name: 'custom',
          label: doc.title,
          className: self.className(doc),
          tokens: tokensFromFields(doc)
        };
      },
      // Unique among custom themes (not archived) and preset labels, so the
      // Theme list in Global Styles never shows two equal names.
      async nameProblems(doc) {
        const title = (doc.title || '').trim().toLowerCase();
        const others = await self.find(self.apos.task.getReq({ mode: 'draft' }), {
          aposDocId: { $ne: doc.aposDocId }
        }).project({ title: 1 }).toArray();
        const taken = [ ...themes, ...others ].some(other =>
          (other.label ?? other.title ?? '').trim().toLowerCase() === title);
        return taken ? [ `Another theme is already called "${doc.title}". Choose another name.` ] : [];
      },
      // Q8: chosen in Global Styles, draft or published, in any locale.
      async inUse(doc) {
        const className = self.className(doc);
        const styles = self.apos.modules['@apostrophecms/styles'];
        for (const locale of Object.keys(self.apos.i18n.locales)) {
          for (const mode of [ 'draft', 'published' ]) {
            const stylesDoc = await styles.find(self.apos.task.getReq({
              locale,
              mode
            }), {}).toObject();
            if (stylesDoc?.theme === className) {
              return true;
            }
          }
        }
        return false;
      },
      // A short string that changes whenever the published custom themes
      // change: the theme stylesheet rebuilds when it does (Q6).
      async revision() {
        const docs = await self.find(self.apos.task.getReq({ mode: 'published' }), {})
          .project({ updatedAt: 1 })
          .toArray();
        const latest = Math.max(0, ...docs.map(doc => new Date(doc.updatedAt).getTime()));
        return `${docs.length}:${latest}`;
      },
      // Published custom themes as theme objects, for the stylesheet and the
      // Theme select. One that fails the shape check (a stored theme from
      // before a token change, without its migration) is left out and
      // logged: it renders as Classic until fixed.
      async publishedThemes() {
        const docs = await self.find(self.apos.task.getReq({ mode: 'published' }), {}).toArray();
        const list = [];
        for (const doc of docs) {
          const theme = self.themeFromDoc(doc);
          const problems = validateTheme(theme);
          if (problems.length) {
            self.apos.util.warn(`Custom theme "${doc.title}" left out of the stylesheet: ${problems.join('; ')}`);
          } else {
            list.push(theme);
          }
        }
        return list;
      }
    };
  }
};
