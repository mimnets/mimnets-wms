// Custom themes suite (m1-087, D-CONTENT-32), against a running server on a
// DISPOSABLE database, through the same REST endpoints the admin UI calls.
// Run by `npm run test:ci` only: it creates themes and changes Global Styles,
// so it refuses to run unless CUSTOM_THEMES_TEST_DISPOSABLE=1.
//
// Credentials from the environment: APOS_TEST_USER / APOS_TEST_PASSWORD (an
// admin) and APOS_TEST_EDITOR_USER / APOS_TEST_EDITOR_PASSWORD (an editor).
// Bearer tokens are revoked at the end. Covers: editors and visitors cannot
// read or write themes; a new theme is a copy of its preset; names are
// unique; a low-contrast save is refused with the pair named; colours are
// normalised; a published theme reaches the stylesheet and Global Styles; a
// draft theme is not offered; a theme in use cannot be archived or
// unpublished; Global Styles is restored and the test themes archived.
import { isDeepStrictEqual } from 'node:util';
import { themes } from '../lib/themes.js';
import { tokensFromFields } from '../modules/wms-theme/lib/fields.js';

const BASE = process.env.BASE_URL || 'http://localhost:3000';
const RUN = Date.now().toString(36);
const WAIT_MS = 15 * 1000;

if (process.env.CUSTOM_THEMES_TEST_DISPOSABLE !== '1') {
  console.error('Refusing to run: this suite writes themes and changes Global Styles. It runs ' +
    'from `npm run test:ci` (CUSTOM_THEMES_TEST_DISPOSABLE=1) on a throwaway database only.');
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

// The theme stylesheet linked from the public home page.
async function publicStylesheet() {
  const html = await (await fetch(`${BASE}/`)).text();
  const href = html.match(/href="([^"]*\/wms-themes\?version=[^"]*)"/)?.[1]
    ?.replace(/&amp;/g, '&');
  const body = html.match(/<body class="([^"]*)"/)?.[1]?.split(/\s+/) || [];
  const css = href ? await (await fetch(new URL(href, BASE))).text() : '';
  return {
    href,
    css,
    body
  };
}
async function waitFor(predicate) {
  const deadline = Date.now() + WAIT_MS;
  let last;
  while (Date.now() < deadline) {
    last = await publicStylesheet();
    if (predicate(last)) {
      return last;
    }
    await sleep(1000);
  }
  return last;
}

const admin = await login(process.env.APOS_TEST_USER, process.env.APOS_TEST_PASSWORD);
const editor = await login(process.env.APOS_TEST_EDITOR_USER,
  process.env.APOS_TEST_EDITOR_PASSWORD);
const ocean = themes.find(theme => theme.name === 'ocean');
const created = [];
let stylesDoc;
let originalTheme;

try {
  // --- Admins only -------------------------------------------------------
  const edList = await call(editor, 'GET', 'wms-theme');
  check('editor cannot list themes',
    none(edList), String(edList.status));
  const edCreate = await call(editor, 'POST', 'wms-theme', {
    title: `m1-087 editor ${RUN}`,
    startFrom: 'ocean'
  });
  check('editor cannot create a theme', edCreate.status >= 400, String(edCreate.status));
  const guest = await call(null, 'GET', 'wms-theme', null, { draft: false });
  check('visitors cannot list themes',
    none(guest), String(guest.status));

  // --- A copy of the preset ----------------------------------------------
  const title = `m1-087 test ${RUN}`;
  const theme = await api(admin, 'POST', 'wms-theme', {
    title,
    startFrom: 'ocean'
  });
  created.push(theme);
  check('a new theme is started and a full copy of its preset',
    theme.started === true && isDeepStrictEqual(tokensFromFields(theme), ocean.tokens));
  check('"Started from" records the preset', theme.startedFrom === ocean.label, theme.startedFrom);
  const className = `wms-theme-custom-${theme.aposDocId}`;

  const twin = await call(admin, 'POST', 'wms-theme', {
    title: title.toUpperCase(),
    startFrom: 'classic'
  });
  check('a second theme with the same name is refused',
    twin.status === 400 && /already called/.test(twin.json?.message || ''), String(twin.status));
  const presetName = await call(admin, 'POST', 'wms-theme', {
    title: ocean.label,
    startFrom: 'classic'
  });
  check('a preset\'s name is refused', presetName.status === 400, String(presetName.status));

  // --- Validation on every save ------------------------------------------
  const low = await call(admin, 'PATCH', `wms-theme/${theme._id}`, { textMuted: '#bbbbbb' });
  check('a low-contrast save is refused, the pair named',
    low.status === 400 && /Muted text .*#bbbbbb.*needs 4\.5:1/.test(low.json?.message || ''),
    `${low.status} ${(low.json?.message || '').slice(0, 120)}`);
  const afterLow = await api(admin, 'GET', `wms-theme/${theme._id}`);
  check('the refused value was not stored', afterLow.textMuted === ocean.tokens.textMuted);
  const upper = await api(admin, 'PATCH', `wms-theme/${theme._id}`, {
    accent: ocean.tokens.accent.toUpperCase()
  });
  check('colours are stored as #rrggbb', upper.accent === ocean.tokens.accent, upper.accent);

  // --- Not offered or served while a draft --------------------------------
  const styles = await api(admin, 'GET', '@apostrophecms/styles');
  stylesDoc = styles._id ? styles : styles.results?.[0];
  originalTheme = stylesDoc.theme ?? '';
  const draftChoice = await call(admin, 'PATCH', `@apostrophecms/styles/${stylesDoc._id}`, {
    theme: className
  });
  check('Global Styles refuses a draft theme',
    draftChoice.status >= 400 || draftChoice.json?.theme !== className,
    `${draftChoice.status} ${draftChoice.json?.theme}`);
  // Whatever core did with the refused value, put the site's theme back.
  await api(admin, 'PATCH', `@apostrophecms/styles/${stylesDoc._id}`, { theme: originalTheme });

  // --- Published: in the stylesheet and Global Styles ---------------------
  await api(admin, 'POST', `wms-theme/${theme._id}/publish`, {});
  const served = await waitFor(sheet => sheet.css.includes(`body.${className} {`));
  check('the published theme is in the public stylesheet',
    served.css.includes(`body.${className} {`) &&
      served.css.includes(`--wms-color-primary: ${ocean.tokens.primary}`),
    served.href);
  const sheetRes = await fetch(new URL(served.href, BASE));
  check('the stylesheet under its own version is cached as immutable',
    /immutable/.test(sheetRes.headers.get('cache-control') || ''));
  const stale = await fetch(`${BASE}/api/v1/@apostrophecms/styles/wms-themes?version=old`);
  check('an unknown version is not cached', stale.headers.get('cache-control') === 'no-store');
  check('the stylesheet has no theme names', !served.css.includes(title));

  const chosen = await api(admin, 'PATCH', `@apostrophecms/styles/${stylesDoc._id}`, {
    theme: className
  });
  check('Global Styles accepts the published theme', chosen.theme === className, chosen.theme);
  const live = await publicStylesheet();
  check('visitors get the custom theme class on <body>', live.body.includes(className));

  // --- In use: cannot be withdrawn ----------------------------------------
  const archive = await call(admin, 'PATCH', `wms-theme/${theme._id}`, { archived: true });
  check('a theme in use cannot be archived',
    archive.status === 400 && /used in Global Styles/.test(archive.json?.message || ''),
    String(archive.status));
  const unpublish = await call(admin, 'POST', `wms-theme/${theme._id}/unpublish`, {});
  check('a theme in use cannot be unpublished',
    unpublish.status === 400 && /used in Global Styles/.test(unpublish.json?.message || ''),
    String(unpublish.status));
} catch (e) {
  check('suite ran to the end', false, e.message);
} finally {
  // --- Clean up: Global Styles back, test themes archived ------------------
  if (stylesDoc) {
    const back = await api(admin, 'PATCH', `@apostrophecms/styles/${stylesDoc._id}`, {
      theme: originalTheme
    });
    check('clean-up: Global Styles theme restored', (back.theme ?? '') === originalTheme);
  }
  for (const doc of created) {
    const r = await call(admin, 'PATCH', `wms-theme/${doc._id}`, { archived: true });
    check(`clean-up: ${doc.title} archived`, r.status === 200, String(r.status));
    const gone = await waitFor(sheet => !sheet.css.includes(`wms-theme-custom-${doc.aposDocId}`));
    check('clean-up: the archived theme left the stylesheet',
      !gone.css.includes(`wms-theme-custom-${doc.aposDocId}`));
  }
  for (const token of [ admin, editor ]) {
    await call(token, 'POST', '@apostrophecms/login/logout', {}, { draft: false });
  }
}

const failed = results.some(ok => !ok);
console.log(failed ? '\nCustom themes suite FAILED' : '\nCustom themes suite passed');
process.exit(failed ? 1 : 0);
