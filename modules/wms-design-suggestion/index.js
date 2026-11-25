// Design suggestions (m1-088, D-CONTENT-33, ADR-0005): an admin writes a short
// brief and gets a theme or a page layout from an AI model, created as a
// draft for a human to review and publish. Design:
// docs/milestones/m1-088-ai-assisted-design-design.md.
//
// - Admins only (D-M0-11, Q5): core view, edit and publish roles, enforced by
//   core for the admin UI and the REST API. Hidden, and refused on the
//   server, while `apos.ai.active` is false (no key).
// - Each record is one request and its log: who, when, the brief, the result,
//   the model and the tokens. The daily cap counts them (Q4).
// - The brief is checked for personal contact details before it is saved or
//   sent (lib/brief.js), and cannot be changed afterwards: "try again" is
//   Duplicate, a new record and a new run.
// - One call through core `apos.ai.generateJob()`: a fixed system prompt, the
//   brief, a JSON Schema, no tools (lib/prompts.js). The answer is checked
//   again by the project (lib/answers.js) before anything is created.
// - A theme becomes a draft `wms-theme` (its own beforeSave checks it again);
//   one repair call when it fails contrast (Q9). A layout becomes a draft
//   page under "Templates (do not publish)", built only by the pattern
//   builders, with placeholders and no generated text (Q6, Q7).
import { themes } from '../../lib/themes.js';
import { patternDefs } from '../wms-patterns/lib/patterns.js';
import { sectionBuilders } from '../wms-patterns/lib/sections.js';
import { TEMPLATES_PARENT } from '../wms-patterns/lib/templates.js';
import { fieldsFromTokens } from '../wms-theme/lib/fields.js';
import { BRIEF_MAX, briefProblems } from './lib/brief.js';
import {
  layoutAnswerSchema, layoutSystemPrompt, repairMessage,
  themeAnswerSchema, themeSystemPrompt
} from './lib/prompts.js';
import {
  contrastFailures, plain, themeShapeProblems, tokensFromAnswer, unknownPatterns
} from './lib/answers.js';

const NOT_SET_UP = 'AI is not set up on this site. Ask the site owner to add the AI key.';
const LOCKED = 'A suggestion cannot be changed after it is made. Duplicate it to try again with another brief.';

const readOnly = (field) => ({
  ...field,
  readOnly: true
});

export default {
  extend: '@apostrophecms/piece-type',
  options: {
    label: 'Design suggestion',
    pluralLabel: 'Design suggestions',
    viewRole: 'admin',
    editRole: 'admin',
    publishRole: 'admin',
    // A request and its log, not content: saved and published in one step.
    autopublish: true,
    quickCreate: false,
    searchable: false,
    seoFields: false,
    sort: { createdAt: -1 },
    // ADR-0005 Decision 2 (D-CONTENT-33 Q2).
    provider: 'anthropic',
    model: 'claude-opus-5-5',
    reasoning: 'medium',
    // Output cap per call, thinking included: about USD 0.32 at most.
    maxTokens: 16000,
    // Q4: per site and day (UTC); WMS_AI_DAILY_LIMIT overrides.
    dailyLimit: Number.parseInt(process.env.WMS_AI_DAILY_LIMIT, 10) || 20,
    // A record still running after this long lost its run (a restart).
    staleMinutes: 30
  },
  fields: {
    add: {
      title: {
        type: 'string',
        label: 'Name',
        help: 'For your own list, for example "Home page refresh".',
        required: true
      },
      kind: {
        type: 'select',
        label: 'Suggest',
        required: true,
        def: 'theme',
        choices: [
          {
            label: 'A theme (colours, type and shape)',
            value: 'theme'
          },
          {
            label: 'A page layout (sections from the patterns)',
            value: 'layout'
          }
        ]
      },
      brief: {
        type: 'string',
        label: 'Brief',
        help: 'The mood, the audience and any colours you want, in a few sentences. It is sent ' +
          'to an external AI service: no names of people or customers, no contact details, no ' +
          'prices. Cannot be changed after saving.',
        textarea: true,
        required: true,
        max: BRIEF_MAX
      },
      status: readOnly({
        type: 'select',
        label: 'Status',
        choices: [
          {
            label: 'Running',
            value: 'running'
          },
          {
            label: 'Done: open the result below',
            value: 'done'
          },
          {
            label: 'Failed',
            value: 'failed'
          }
        ]
      }),
      _theme: readOnly({
        type: 'relationship',
        label: 'Suggested theme (draft)',
        withType: 'wms-theme',
        max: 1,
        if: {
          kind: 'theme',
          status: 'done'
        }
      }),
      _page: readOnly({
        type: 'relationship',
        label: 'Suggested page (draft, under Templates)',
        withType: '@apostrophecms/any-page-type',
        max: 1,
        if: {
          kind: 'layout',
          status: 'done'
        }
      }),
      notes: readOnly({
        type: 'string',
        label: 'Notes from the model',
        textarea: true,
        if: { status: 'done' }
      }),
      error: readOnly({
        type: 'string',
        label: 'Problem',
        textarea: true,
        if: { status: 'failed' }
      }),
      model: readOnly({
        type: 'string',
        label: 'Model'
      }),
      calls: readOnly({
        type: 'integer',
        label: 'Calls'
      }),
      inputTokens: readOnly({
        type: 'integer',
        label: 'Input tokens'
      }),
      outputTokens: readOnly({
        type: 'integer',
        label: 'Output tokens'
      })
    },
    group: {
      basics: {
        label: 'Request',
        fields: [ 'title', 'kind', 'brief' ]
      },
      result: {
        label: 'Result',
        fields: [ 'status', '_theme', '_page', 'notes', 'error' ]
      },
      usage: {
        label: 'Usage',
        fields: [ 'model', 'calls', 'inputTokens', 'outputTokens' ]
      }
    }
  },
  init(self) {
    // Tokens billed per running suggestion, from core's `usage` event (every
    // provider response, retries included), written when the run ends.
    self.usage = new Map();
  },
  handlers(self) {
    return {
      'apostrophe:ready': {
        async failStaleOnStart() {
          if (!self.apos.isTask()) {
            await self.failStale();
          }
        }
      },
      '@apostrophecms/ai:usage': {
        countTokens(req, record) {
          const id = req.wmsDesignSuggestionId;
          const totals = id && self.usage.get(id);
          if (totals) {
            totals.inputTokens += record.usage?.inputTokens || 0;
            totals.outputTokens += record.usage?.outputTokens || 0;
          }
        }
      },
      beforeInsert: {
        async checkRequest(req, doc) {
          if (doc.aposMode !== 'draft') {
            return;
          }
          if (!self.apos.ai.active) {
            throw self.apos.error('invalid', NOT_SET_UP);
          }
          const problems = briefProblems(doc.brief);
          if (problems.length) {
            throw self.apos.error('invalid', problems.join(' '));
          }
          await self.failStale();
          const today = await self.countToday(req);
          if (today >= self.options.dailyLimit) {
            throw self.apos.error('invalid', `The daily limit of ${self.options.dailyLimit} ` +
              'suggestions is reached. Try again after midnight (UTC).');
          }
          Object.assign(doc, {
            status: 'running',
            notes: '',
            error: '',
            model: self.options.model,
            calls: 0,
            inputTokens: 0,
            outputTokens: 0,
            themeIds: [],
            pageIds: []
          });
        }
      },
      beforeUpdate: {
        async lockRequest(req, doc) {
          const stored = await self.find(req, { _id: doc._id })
            .archived(null)
            .project({
              brief: 1,
              kind: 1
            })
            .toObject();
          if (stored && (stored.brief !== doc.brief || stored.kind !== doc.kind)) {
            throw self.apos.error('invalid', LOCKED);
          }
        }
      },
      afterInsert: {
        markNewRun(req, doc) {
          if (doc.aposMode === 'draft') {
            doc._wmsStartRun = true;
          }
        }
      },
      afterSave: {
        // After core's own afterSave handlers, so the record is published
        // before the run can update it.
        async startRun(req, doc) {
          if (!doc._wmsStartRun) {
            return;
          }
          delete doc._wmsStartRun;
          await self.call(req, doc, [ {
            role: 'user',
            content: doc.brief
          } ]);
        }
      }
    };
  },
  methods(self) {
    return {
      addToAdminBar() {
        self.apos.adminBar.add(
          `${self.__meta.name}:manager`,
          self.pluralLabel,
          {
            action: 'edit',
            type: self.name
          },
          { when: () => self.apos.ai.active }
        );
      },

      async countToday(req) {
        const midnight = new Date();
        midnight.setUTCHours(0, 0, 0, 0);
        return self.find(req, { createdAt: { $gte: midnight } })
          .archived(null)
          .toCount();
      },

      // One model call, in the background. `messages` is the brief, or the
      // repair message on the second call.
      async call(req, doc, messages) {
        const isTheme = doc.kind === 'theme';
        const runReq = req.clone({ wmsDesignSuggestionId: doc._id });
        if (!self.usage.has(doc._id)) {
          self.usage.set(doc._id, {
            calls: 0,
            inputTokens: 0,
            outputTokens: 0
          });
        }
        self.usage.get(doc._id).calls++;
        try {
          await self.apos.ai.generateJob(runReq, {
            system: isTheme ? themeSystemPrompt() : layoutSystemPrompt(),
            messages,
            schema: isTheme ? themeAnswerSchema() : layoutAnswerSchema(),
            maxSteps: 1,
            maxTokens: self.options.maxTokens,
            provider: self.options.provider,
            model: self.options.model,
            reasoning: self.options.reasoning,
            notify: false,
            onEnd: (error, result) => self.finish(req, doc, error, result)
              .catch(e => self.finishFailed(req, doc, e))
          });
        } catch (e) {
          await self.finishFailed(req, doc, e);
        }
      },

      async finish(req, doc, error, result) {
        if (error) {
          return self.finishFailed(req, doc, error);
        }
        if (!result?.object || result.finishReason !== 'stop') {
          const reason = result?.finishReason || 'unknown';
          return self.finishFailed(req, doc, new Error(`The model gave no answer (${reason}).`));
        }
        return doc.kind === 'theme'
          ? self.finishTheme(req, doc, result.object)
          : self.finishLayout(req, doc, result.object);
      },

      async finishTheme(req, doc, answer) {
        const tokens = tokensFromAnswer(answer.tokens);
        const shape = themeShapeProblems(tokens);
        if (shape.length) {
          return self.finishFailed(req, doc, new Error(`The suggested theme has invalid values: ${shape.join('; ')}.`));
        }
        const failures = contrastFailures(tokens);
        if (failures.length) {
          if (self.usage.get(doc._id).calls < 2) {
            return self.call(req, doc, [ {
              role: 'user',
              content: repairMessage(doc.brief, answer, failures)
            } ]);
          }
          return self.finishFailed(req, doc, new Error('The suggested theme failed the contrast ' +
            'check twice: ' + failures.map(f => `${f.use}: ${f.foreground} on ${f.background} ` +
            `is ${(Math.floor(f.ratio * 100) / 100).toFixed(2)}:1, needs ${f.min}:1`).join('; ') +
            '. No theme was created.'));
        }
        const manager = self.apos.modules['wms-theme'];
        const theme = manager.newInstance();
        Object.assign(theme, fieldsFromTokens(tokens), {
          title: await self.uniqueThemeTitle(req, `${plain(answer.name, 40)} (AI suggestion)`),
          startFrom: answer.closestPreset,
          started: true,
          startedFrom: `AI suggestion, closest to ${themes.find(t => t.name === answer.closestPreset)?.label || 'a preset'}`
        });
        const inserted = await manager.insert(req, theme);
        return self.record(req, doc, {
          status: 'done',
          notes: plain(answer.notes, 600),
          _theme: [ inserted ]
        });
      },

      async finishLayout(req, doc, answer) {
        const unknown = unknownPatterns(answer.sections);
        if (unknown.length) {
          return self.finishFailed(req, doc, new Error(`Unknown patterns: ${unknown.join(', ')}.`));
        }
        const id = () => self.apos.util.generateId();
        const byKey = Object.fromEntries(patternDefs(id, { heroLevel: 'h2' })
          .map(def => [ def.key, def ]));
        const { area, howTo } = sectionBuilders(id);
        const title = plain(answer.title, 80);
        const patterns = self.apos.modules['wms-patterns'];
        const parent = await patterns.ensurePage(req, '_home', {
          ...TEMPLATES_PARENT,
          orphan: true,
          main: area()
        }, []);
        const page = await patterns.ensurePage(req, parent._id, {
          slug: `${TEMPLATES_PARENT.slug}/suggestion-${self.apos.util.slugify(title)}-${doc._id.slice(0, 6).toLowerCase()}`,
          title: `Suggestion: ${title}`,
          type: 'default-page',
          main: area(
            howTo('a layout suggested by AI from a brief (Design suggestions). Duplicate this ' +
              'page, move the copy where it belongs in Pages, replace every placeholder with ' +
              'confirmed facts, add photos, delete this line and publish the copy.'),
            ...answer.sections.flatMap(section => byKey[section.pattern].sections())
          )
        }, []);
        const why = answer.sections.map((section, i) => `${i + 1}. ${section.pattern}: ${plain(section.why, 200)}`);
        return self.record(req, doc, {
          status: 'done',
          notes: [ plain(answer.notes, 600), ...why ].filter(Boolean).join('\n'),
          _page: [ page ]
        });
      },

      async finishFailed(req, doc, error) {
        const message = error?.name === 'aiRefusal'
          ? 'The AI model declined this brief. Try another wording.'
          : error?.name === 'aiRetry'
            ? 'The AI service did not answer in time. Try again later.'
            : plain(error?.message || 'The suggestion failed.', 1000);
        if (!error?.name || ![ 'invalid', 'aiRefusal', 'aiRetry' ].includes(error.name)) {
          self.apos.util.error(`Design suggestion ${doc._id} failed: ${error?.stack || error}`);
        }
        return self.record(req, doc, {
          status: 'failed',
          error: message
        });
      },

      // Writes the outcome and the billed tokens to the record, and tells
      // the admin who asked.
      async record(req, doc, patch) {
        const totals = self.usage.get(doc._id) || {};
        self.usage.delete(doc._id);
        const current = await self.find(req, { _id: doc._id }).archived(null).toObject();
        if (!current) {
          return;
        }
        Object.assign(current, patch, {
          calls: totals.calls || current.calls || 0,
          inputTokens: totals.inputTokens || 0,
          outputTokens: totals.outputTokens || 0
        });
        await self.update(req, current);
        // Plain text with the name in it (`localize: false`): the admin
        // UI shows notifications as text.
        const where = 'open it in Site admin → Design suggestions';
        await self.apos.notify(req, patch.status === 'done'
          ? `Design suggestion "${current.title}" is ready: ${where}.`
          : `Design suggestion "${current.title}" failed: ${where} for the reason.`, {
          type: patch.status === 'done' ? 'success' : 'danger',
          dismiss: true,
          localize: false
        }).catch(e => self.apos.util.warn(`Design suggestion notification: ${e.message}`));
      },

      // Unique among themes and presets, as wms-theme requires.
      async uniqueThemeTitle(req, base) {
        const others = await self.apos.modules['wms-theme'].find(req, {})
          .project({ title: 1 })
          .toArray();
        const taken = new Set([ ...themes.map(t => t.label), ...others.map(o => o.title) ]
          .map(title => title.trim().toLowerCase()));
        let title = base;
        for (let n = 2; taken.has(title.toLowerCase()); n++) {
          title = `${base} ${n}`;
        }
        return title;
      },

      // A run lost by a restart never ends: mark it failed (§5).
      async failStale() {
        const req = self.apos.task.getReq({ mode: 'draft' });
        const before = new Date(Date.now() - self.options.staleMinutes * 60 * 1000);
        const stale = await self.find(req, {
          status: 'running',
          createdAt: { $lt: before }
        }).archived(null).toArray();
        for (const doc of stale) {
          if (!self.usage.has(doc._id)) {
            await self.update(req, Object.assign(doc, {
              status: 'failed',
              error: 'Interrupted (the site restarted during the run). Duplicate the suggestion to try again.'
            }));
          }
        }
      }
    };
  }
};
