// Core's AI engine, `apos.ai` (m1-088, ADR-0005, D-CONTENT-33). Opt-in: core
// ships no provider and no key. Used only by the admin-only design
// suggestions (modules/wms-design-suggestion).
//
// - The Anthropic provider is configured only when APOS_ANTHROPIC_KEY is set
//   (`.env` locally, the app's secret store on a server; never in Git). Core
//   stops the app when a configured provider has no key, so a site without a
//   key starts normally with `apos.ai.active` false and the feature off.
//   Core's Anthropic adapter reads the key from that variable and calls the
//   Messages API through `apos.http`: no SDK, no new package (Decision 1).
// - Usage records carry no person (`usageMetadata` stays empty).
// - APOS_AI_MOCK=1 (tests): core answers every call without network or key;
//   the scripted answers come from modules/wms-design-suggestion/lib/mock.js.
import { designMock } from '../../wms-design-suggestion/lib/mock.js';

export default {
  options: {
    providers: process.env.APOS_ANTHROPIC_KEY ? { anthropic: {} } : {}
  },
  init(self) {
    if (process.env.APOS_AI_MOCK === '1') {
      self.options.mock = designMock(self.apos);
    }
  }
};
