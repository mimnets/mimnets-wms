// The scripted answers for tests (m1-088, ADR-0005 Decision 9). Core's
// `@apostrophecms/ai` consults its `mock` option only when APOS_AI_MOCK=1:
// no network, no key, no cost. modules/@apostrophecms/ai/index.js installs
// this function only then.
//
// A marker in the brief chooses the answer:
//   mock:low-contrast   a theme that fails contrast, every time
//   mock:repair         a theme that fails contrast, then passes on repair
//   mock:refuse         the model refuses (core's aiRefusal)
// Anything else: a valid theme (the Ocean preset's tokens) or a valid layout.
import { themes } from '../../../lib/themes.js';

const ocean = themes.find(theme => theme.name === 'ocean') || themes[0];

const text = content => (Array.isArray(content)
  ? content.filter(part => part.type === 'text').map(part => part.text).join(' ')
  : String(content ?? ''));

export function designMock(apos) {
  return async (req, request) => {
    const prompt = request.messages.map(message => text(message.content)).join('\n');
    const repairing = /refused because these colour pairs/.test(prompt);
    if (/mock:refuse/.test(prompt)) {
      throw apos.error('aiRefusal', 'The model declined the request (mock).');
    }
    let object;
    if (request.schema?.properties?.tokens) {
      const failing = /mock:low-contrast/.test(prompt) || (/mock:repair/.test(prompt) && !repairing);
      object = {
        name: 'Harbour',
        closestPreset: ocean.name,
        tokens: {
          ...ocean.tokens,
          // Muted grey text on white: about 2.3:1, below 4.5:1.
          ...(failing ? { text: '#AAAAAA' } : {})
        },
        notes: 'Teal for trust, coral accents for calls to action (mock).'
      };
    } else if (request.schema?.properties?.sections) {
      object = {
        title: 'About our services',
        sections: [
          {
            pattern: 'story-band',
            why: 'Opens with one idea and an image.'
          },
          {
            pattern: 'split-image-left',
            why: 'Explains the service beside a photo.'
          },
          {
            pattern: 'inquiry-band',
            why: 'Ends with the next step.'
          }
        ],
        notes: 'A short page that leads to contact (mock).'
      };
    } else {
      return undefined;
    }
    const json = JSON.stringify(object);
    return {
      content: [ {
        type: 'text',
        text: json
      } ],
      object,
      finishReason: 'stop',
      usage: {
        inputTokens: Math.round(((request.system || '').length + prompt.length) / 4),
        outputTokens: Math.round(json.length / 4)
      }
    };
  };
}
