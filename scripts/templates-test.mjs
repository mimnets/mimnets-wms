// Page templates suite (m1-086, D-CONTENT-31), against a running server on a
// DISPOSABLE database seeded with `node app wms-patterns:seed`, through the
// same REST endpoints the admin UI calls. Run by `npm run test:ci` only: it
// creates pages, so it refuses to run unless TEMPLATES_TEST_DISPOSABLE=1.
//
// Credentials from the environment: APOS_TEST_EDITOR_USER /
// APOS_TEST_EDITOR_PASSWORD (an editor, not an admin). The bearer token is
// revoked at the end. Covers: patterns and templates are drafts and not
// public; the server refuses to publish them, their parents, and a copy still
// under Templates; core's Duplicate (`_copyingId`) makes a new draft of the
// template's type with the same content and new widget ids; moved out of
// Templates, the copy publishes and visitors see it; the template stays
// unpublished.

const BASE = process.env.BASE_URL || 'http://localhost:3000';
const COPY_TITLE = 'm1-086 test copy';

if (process.env.TEMPLATES_TEST_DISPOSABLE !== '1') {
  console.error('Refusing to run: this suite writes test pages. It runs from `npm run test:ci` ' +
    '(TEMPLATES_TEST_DISPOSABLE=1) on a throwaway database only.');
  process.exit(2);
}
for (const name of [ 'APOS_TEST_EDITOR_USER', 'APOS_TEST_EDITOR_PASSWORD' ]) {
  if (!process.env[name]) {
    console.error(`Set ${name}.`);
    process.exit(2);
  }
}

const results = [];
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
const visit = async p => {
  const res = await fetch(`${BASE}${p}`);
  return {
    status: res.status,
    html: await res.text()
  };
};
function widgetIds(area, out = []) {
  for (const item of area?.items || []) {
    out.push(item._id);
    for (const value of Object.values(item)) {
      if (value?.metaType === 'area') {
        widgetIds(value, out);
      }
    }
  }
  return out;
}
const texts = area => JSON.stringify(area).match(/Replace with[^<"]*/g) || [];

const token = (await api(null, 'POST', '@apostrophecms/login/login', {
  username: process.env.APOS_TEST_EDITOR_USER,
  password: process.env.APOS_TEST_EDITOR_PASSWORD
}, { draft: false })).token;

try {
  const all = (await api(token, 'GET', '@apostrophecms/page?all=1&flat=1&archived=any')).results;
  const bySlug = slug => all.find(p => p.slug === slug);
  const parent = bySlug('/templates');
  const templates = all.filter(p => p.slug.startsWith('/templates/'));
  const patterns = all.filter(p => p.slug.startsWith('/patterns/'));
  check('seeded: 5 templates and 14 patterns', templates.length === 5 && patterns.length === 14,
    `${templates.length}, ${patterns.length}`);
  const contact = bySlug('/templates/contact');
  check('the contact template is a draft, never published', contact && !contact.lastPublishedAt);
  check('the category template keeps its page type',
    bySlug('/templates/product-category')?.type === 'wms-product-category-page');

  for (const slug of [ '/templates', '/templates/contact', '/patterns', '/patterns/story-band' ]) {
    const r = await visit(slug);
    check(`logged out: ${slug} is not public`, r.status === 404, String(r.status));
  }

  // The parents: refused by the project rule, with its message. A page
  // under them: refused (core's "publish the parent first" may answer
  // before the project rule; the parent is then refused as above).
  const refused = r => r.status === 400 &&
    /never published|parent page/.test(r.json?.message || '');
  for (const doc of [ parent, bySlug('/patterns') ]) {
    const r = await call(token, 'POST', `@apostrophecms/page/${doc._id}/publish`, {});
    check(`editor cannot publish ${doc.slug}`,
      r.status === 400 && /never published/.test(r.json?.message || ''),
      `${r.status} ${r.json?.message || ''}`);
  }
  for (const doc of [ contact, bySlug('/patterns/people-band') ]) {
    const r = await call(token, 'POST', `@apostrophecms/page/${doc._id}/publish`, {});
    check(`editor cannot publish ${doc.slug}`, refused(r), `${r.status} ${r.json?.message || ''}`);
  }

  // Core's Duplicate as the page editor sends it while viewing the template
  // parent: the copy is placed under it (AposDocEditor.getRequestBody).
  const template = await api(token, 'GET', `@apostrophecms/page/${contact._id}`);
  const copy = await api(token, 'POST', '@apostrophecms/page', {
    title: COPY_TITLE,
    slug: '/templates/m1-086-test-copy',
    type: template.type,
    _targetId: parent._id,
    _position: 'lastChild',
    _copyingId: contact._id
  });
  check('duplicate: a new draft of the same type, recorded as a copy',
    copy.type === template.type && copy.copyOfId === contact._id &&
      !copy.lastPublishedAt);
  const before = new Set(widgetIds(template.main));
  const after = widgetIds(copy.main);
  check('duplicate: same content, every widget id new',
    after.length === before.size && after.every(id => !before.has(id)) &&
      JSON.stringify(texts(copy.main)) === JSON.stringify(texts(template.main)),
    `${after.length} widgets`);
  check('duplicate: not hidden from navigation', !copy.orphan);

  let r = await call(token, 'POST', `@apostrophecms/page/${copy._id}/publish`, {});
  check('a copy still under Templates is refused', refused(r),
    `${r.status} ${r.json?.message || ''}`);

  const moved = await api(token, 'PATCH', `@apostrophecms/page/${copy._id}`, {
    _targetId: '_home',
    _position: 'lastChild'
  });
  check('moved out of Templates, the slug follows the new parent',
    moved.slug === '/m1-086-test-copy', moved.slug);

  r = await call(token, 'POST', `@apostrophecms/page/${copy._id}/publish`, {});
  check('after the move the editor can publish the copy', r.status === 200, String(r.status));
  const shown = await visit(moved.slug);
  check('logged out: the copy is public', shown.status === 200 &&
    shown.html.includes('One sentence on how and when you reply.'), String(shown.status));
  const still = await visit('/templates/contact');
  check('logged out: the template is still not public', still.status === 404, String(still.status));

  // Clean up (disposable database), as core's page manager does: move the
  // page into the archive (`archived: true` alone changes nothing for a
  // page). Core unpublishes it on the way (retainOnlyAsDraft); unpublishing
  // first makes core fail with a 500 on the second unpublish.
  const archived = await api(token, 'PATCH', `@apostrophecms/page/${copy._id}`, {
    archived: true,
    _targetId: '_archive',
    _position: 'lastChild'
  });
  const gone = await visit(moved.slug);
  check('clean-up: the copy is archived and no longer public',
    archived.archived === true && gone.status === 404, String(gone.status));
} catch (e) {
  check('suite ran without errors', false, e.message);
} finally {
  await call(token, 'POST', '@apostrophecms/login/logout', {}, { draft: false });
}

const failed = results.filter(ok => !ok).length;
console.log(`\n${results.length - failed}/${results.length} passed`);
process.exit(failed ? 1 : 0);
