// Design suggestions suite (m1-088, D-CONTENT-33, ADR-0005), against a running
// server on a DISPOSABLE database, through the same REST endpoints the admin
// UI calls. Run by `npm run test:ci` only (DESIGN_TEST_DISPOSABLE=1).
//
//   node scripts/design-suggestion-test.mjs --off   server without a key: the
//                                                    feature is off
//   node scripts/design-suggestion-test.mjs         server with APOS_AI_MOCK=1
//                                                    and WMS_AI_DAILY_LIMIT=6
//
// The mock answers from modules/wms-design-suggestion/lib/mock.js: no
// network, no key, no cost. Covers: editors and visitors cannot read or write
// suggestions; a brief with contact details is refused and not stored; a
// theme suggestion creates a draft theme with the answer's tokens; one repair
// call after a contrast failure; a second failure creates nothing; a refusal;
// a layout suggestion creates a draft page under /templates from the
// patterns, with no H1, that cannot be published; the brief cannot be
// changed; the daily limit. Test records, themes and pages are archived.
import { themes } from '../lib/themes.js';

const BASE = process.env.BASE_URL || 'http://localhost:3000';
const RUN = Date.now().toString(36);
const OFF = process.argv.includes('--off');
const WAIT_MS = 20 * 1000;

if (process.env.DESIGN_TEST_DISPOSABLE !== '1') {
  console.error('Refusing to run: this suite writes suggestions, themes and pages. It runs ' +
    'from `npm run test:ci` (DESIGN_TEST_DISPOSABLE=1) on a throwaway database only.');
  process.exit(2);
}
for (const name of [
  'APOS_TEST_USER', 'APOS_TEST_PASSWORD', 'APOS_TEST_EDITOR_USER', 'APOS_TEST_EDITOR_PASSWORD'
]) {
  if (!process.env[name]) {
    console.error(`Set ${name}.`);
    process.exit(2);
  }
}

const results = [];
const none = r => r.status >= 400 || (r.json?.results || []).length === 0;
function check(name, ok, detail = '') {
  results.push(ok);
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? `  (${detail})` : ''}`);
}

// Returns { status, json } and never throws on HTTP errors.
async function call(token, method, url, body, { draft = true } = {}) {
  const sep = url.includes('?') ? '&' : '?';
  const res = await fetch(`${BASE}/api/v1/${url}${draft ? `${sep}aposMode=draft` : ''}`, {
    method,
    headers: {
      ...(token ? { authorization: `Bearer ${token}` } : {}),
      ...(body ? { 'content-type': 'application/json' } : {})
    },
    body: body ? JSON.stringify(body) : undefined
  });
  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch (e) {
    json = text;
  }
  return {
    status: res.status,
    json
  };
}
async function api(token, method, url, body, opts) {
  const r = await call(token, method, url, body, opts);
  if (r.status < 200 || r.status > 299) {
    throw new Error(`${method} ${url} -> ${r.status} ${JSON.stringify(r.json).slice(0, 300)}`);
  }
  return r.json;
}
const login = async (username, password) => (await api(null, 'POST',
  '@apostrophecms/login/login', {
    username,
    password
  }, { draft: false })).token;
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

const BRIEF = 'Calm and trustworthy, for an insurance group; navy with warm accents.';
const admin = await login(process.env.APOS_TEST_USER, process.env.APOS_TEST_PASSWORD);
const editor = await login(process.env.APOS_TEST_EDITOR_USER,
  process.env.APOS_TEST_EDITOR_PASSWORD);
const suggestions = [];
const themeIds = new Set();
const pageIds = new Set();

async function ask(kind, brief, name = `m1-088 ${kind} ${RUN}`) {
  const r = await call(admin, 'POST', 'wms-design-suggestion', {
    title: name,
    kind,
    brief
  });
  if (r.status === 200) {
    suggestions.push(r.json);
  }
  return r;
}
// Waits until the run has ended and returns the record.
async function settled(doc) {
  const deadline = Date.now() + WAIT_MS;
  let last;
  while (Date.now() < deadline) {
    last = await api(admin, 'GET', `wms-design-suggestion/${doc._id}`);
    if (last.status !== 'running') {
      break;
    }
    await sleep(500);
  }
  for (const id of last?.themeIds || []) {
    themeIds.add(id);
  }
  for (const id of last?.pageIds || []) {
    pageIds.add(id);
  }
  return last;
}

try {
  // --- Admins only -------------------------------------------------------
  const edList = await call(editor, 'GET', 'wms-design-suggestion');
  check('editor cannot list suggestions', none(edList), String(edList.status));
  const edCreate = await call(editor, 'POST', 'wms-design-suggestion', {
    title: `m1-088 editor ${RUN}`,
    kind: 'theme',
    brief: BRIEF
  });
  check('editor cannot create a suggestion', edCreate.status >= 400, String(edCreate.status));
  const guest = await call(null, 'GET', 'wms-design-suggestion', null, { draft: false });
  check('visitors cannot list suggestions', none(guest), String(guest.status));

  if (OFF) {
    // --- No key: the feature is off ----------------------------------------
    const off = await ask('theme', BRIEF);
    check('without a key a suggestion is refused',
      off.status === 400 && /not set up/.test(off.json?.message || ''), String(off.status));
  } else {
    // --- The brief check ---------------------------------------------------
    const before = (await api(admin, 'GET', 'wms-design-suggestion')).results.length;
    const personal = await ask('theme', `${BRIEF} Questions to jane.doe@example.com`);
    check('a brief with an e-mail address is refused',
      personal.status === 400 && /contact details/.test(personal.json?.message || ''),
      String(personal.status));
    const after = (await api(admin, 'GET', 'wms-design-suggestion')).results.length;
    check('the refused brief is not stored', after === before, `${before} → ${after}`);

    // --- Theme ---------------------------------------------------------------
    const theme = await settled((await ask('theme', BRIEF)).json);
    check('a theme suggestion ends done, one call, tokens counted',
      theme.status === 'done' && theme.calls === 1 && theme.inputTokens > 0 &&
        theme.outputTokens > 0,
      `${theme.status} ${theme.calls} ${theme.inputTokens}/${theme.outputTokens} ${theme.error || ''}`);
    const themeDoc = theme._theme?.[0];
    check('it links a draft theme with the suggested name',
      Boolean(themeDoc) && /\(AI suggestion\)$/.test(themeDoc.title) && themeDoc.started === true,
      themeDoc?.title);
    // The mock answers with the Ocean preset's tokens.
    const ocean = themes.find(t => t.name === 'ocean');
    check('the draft theme keeps the suggested tokens',
      themeDoc?.primary === ocean.tokens.primary &&
        themeDoc?.accent === ocean.tokens.accent,
      themeDoc?.primary);
    check('the model notes are on the record', /mock/.test(theme.notes || ''));
    if (themeDoc) {
      const publishedId = themeDoc._id.replace(':draft', ':published');
      const published = await call(admin, 'GET', `wms-theme/${publishedId}`, null,
        { draft: false });
      check('the suggested theme is not published', published.status === 404,
        String(published.status));
    }

    const repaired = await settled((await ask('theme', `${BRIEF} mock:repair`)).json);
    check('a contrast failure gets one repair call, then a theme',
      repaired.status === 'done' && repaired.calls === 2 && (repaired.themeIds || []).length === 1,
      `${repaired.status} ${repaired.calls} ${repaired.error || ''}`);

    const low = await settled((await ask('theme', `${BRIEF} mock:low-contrast`)).json);
    check('two contrast failures: failed, pair named, no theme',
      low.status === 'failed' && low.calls === 2 && /Body text: #aaaaaa on/.test(low.error || '') &&
        (low.themeIds || []).length === 0,
      `${low.status} ${low.calls} ${(low.error || '').slice(0, 80)}`);

    const refused = await settled((await ask('theme', `${BRIEF} mock:refuse`)).json);
    check('a refusal ends failed with a plain message',
      refused.status === 'failed' && /declined/.test(refused.error || ''),
      `${refused.status} ${refused.error || ''}`);

    // --- Layout --------------------------------------------------------------
    const layout = await settled((await ask('layout', `${BRIEF} An about page.`)).json);
    const pageDoc = layout._page?.[0];
    check('a layout suggestion ends done and links a page',
      layout.status === 'done' && Boolean(pageDoc), `${layout.status} ${layout.error || ''}`);
    if (pageDoc) {
      const page = await api(admin, 'GET', `@apostrophecms/page/${pageDoc._id}`);
      check('the page is a draft under Templates',
        page.slug.startsWith('/templates/suggestion-') && page.title.startsWith('Suggestion: '),
        page.slug);
      const items = page.main?.items || [];
      check('the page holds the note, then the chosen patterns',
        items.length === 4 && /How to use/.test(items[0].content || '') &&
          items[1].type === '@apostrophecms/layout' && items[3].type === 'wms-hero',
        items.map(item => item.type).join(', '));
      check('no H1 in the suggested page', !JSON.stringify(page.main).includes('<h1>'));
      const publish = await call(admin, 'POST', `@apostrophecms/page/${pageDoc._id}/publish`, {});
      check('the suggested page cannot be published',
        publish.status === 400 && /never published/.test(publish.json?.message || ''),
        String(publish.status));
    }
    check('the record lists why each section', /story-band: /.test(layout.notes || ''));

    // --- Locked brief --------------------------------------------------------
    const changed = await call(admin, 'PATCH', `wms-design-suggestion/${theme._id}`, {
      brief: `${BRIEF} Changed.`
    });
    check('the brief cannot be changed', changed.status === 400 &&
      /cannot be changed/.test(changed.json?.message || ''), String(changed.status));
    const renamed = await call(admin, 'PATCH', `wms-design-suggestion/${theme._id}`, {
      title: `m1-088 renamed ${RUN}`
    });
    check('the name can be changed; the result stays',
      renamed.status === 200 && renamed.json.status === 'done' &&
        (renamed.json.themeIds || []).length === 1, String(renamed.status));

    // --- Daily limit (6 in this run) ----------------------------------------
    const sixth = await ask('layout', BRIEF);
    check('the sixth suggestion today is accepted', sixth.status === 200, String(sixth.status));
    if (sixth.status === 200) {
      await settled(sixth.json);
    }
    const seventh = await ask('layout', BRIEF);
    check('the seventh is refused by the daily limit',
      seventh.status === 400 && /daily limit/.test(seventh.json?.message || ''),
      String(seventh.status));
  }
} catch (e) {
  check('suite ran to the end', false, e.message);
} finally {
  // --- Clean up: records, themes and pages archived ------------------------
  for (const doc of suggestions) {
    const r = await call(admin, 'PATCH', `wms-design-suggestion/${doc._id}`, { archived: true });
    check(`clean-up: suggestion ${doc.title} archived`, r.status === 200, String(r.status));
  }
  // Core 4.34.0 answers 500 when a never-published draft is archived through
  // the REST API (afterArchive reverts to a published version that does not
  // exist; m1-088 report, Findings), so the test themes are published first.
  for (const id of themeIds) {
    await call(admin, 'POST', `wms-theme/${id}:en:draft/publish`, {});
    const r = await call(admin, 'PATCH', `wms-theme/${id}:en:draft`, { archived: true });
    check(`clean-up: theme ${id} archived`, r.status === 200, String(r.status));
  }
  for (const id of pageIds) {
    const r = await call(admin, 'PATCH', `@apostrophecms/page/${id}:en:draft`, { archived: true });
    check(`clean-up: page ${id} archived`, r.status === 200, String(r.status));
  }
  for (const token of [ admin, editor ]) {
    await call(token, 'POST', '@apostrophecms/login/logout', {}, { draft: false });
  }
}

const failed = results.some(ok => !ok);
console.log(failed ? '\nDesign suggestions suite FAILED' : '\nDesign suggestions suite passed');
process.exit(failed ? 1 : 0);
