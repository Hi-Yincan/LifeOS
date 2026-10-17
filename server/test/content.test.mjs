import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { once } from 'node:events';
import { createDevelopmentServer } from '../service.mjs';
const key = 'local-test-key-not-a-production-credential';
const png = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aGncAAAAASUVORK5CYII=';
async function fixture(t, options = {}) {
  const dataDir = options.dataDir ?? mkdtempSync(join(tmpdir(), 'hyc-dev-'));
  const server = createDevelopmentServer({ dataDir, key: options.key ?? key });
  server.listen(0, '127.0.0.1'); await once(server, 'listening');
  t.after(() => new Promise(resolve => server.close(resolve)));
  const base = `http://127.0.0.1:${server.address().port}`;
  const call = async (path, { method = 'GET', auth, body, headers = {} } = {}) => {
    const result = await fetch(base + path, { method, headers: { 'Content-Type': 'application/json', ...(auth ? { Cookie: auth.cookie, 'X-CSRF-Token': auth.csrf } : {}), ...headers }, ...(body !== undefined ? { body: JSON.stringify(body) } : {}) });
    const text = await result.text(); let data; try { data = JSON.parse(text); } catch { data = text; }
    return { status: result.status, headers: result.headers, data, text };
  };
  const login = async () => { const result = await call('/api/session', { method: 'POST', body: { key: options.key ?? key } }); assert.equal(result.status, 200); return { cookie: result.headers.get('set-cookie').split(';')[0], csrf: result.data.csrf }; };
  return { call, login, server, dataDir };
}

test('visitor sees four bilingual published works with contribution attribution, no management fields', async t => {
  const { call } = await fixture(t); const result = await call('/api/projects');
  assert.equal(result.status, 200); assert.equal(result.data.length, 4);
  assert.equal(result.data.filter(x => x.kind === 'contribution').length, 2);
  for (const p of result.data) { assert.ok(p.translations.zh.title && p.translations.en.title); assert.ok(!('privateNote' in p)); assert.ok(!('version' in p)); }
});

test('single-key session has no account requirement; anonymous role spoofing cannot write', async t => {
  const { call, login } = await fixture(t);
  assert.equal((await call('/api/session', { method: 'POST', body: { key: 'wrong', role: 'admin' } })).status, 401);
  assert.equal((await call('/api/admin/projects')).status, 401);
  assert.equal((await call('/api/admin/projects', { method: 'POST', body: { role: 'admin' }, headers: { 'X-Role': 'admin' } })).status, 401);
  const auth = await login(); assert.equal((await call('/api/session', { auth })).data.role, 'admin');
  assert.equal((await call('/api/admin/projects', { auth })).data.length, 4);
});

test('draft, bilingual edit, publish snapshot, concurrent edit and unpublish behave independently', async t => {
  const { call, login } = await fixture(t); const auth = await login();
  let item = (await call('/api/admin/projects', { method: 'POST', auth, body: {} })).data;
  assert.equal((await call(`/api/projects/${item.id}`)).status, 404);
  let result = await call(`/api/admin/projects/${item.id}/publish`, { method: 'POST', auth, body: { version: item.version } });
  assert.equal(result.status, 400);
  const translations = { zh: { title: '测试作品', summary: '中文摘要', background: '', contribution: '', detail: '' }, en: { title: 'Test work', summary: 'English summary', background: '', contribution: '', detail: '' } };
  item = (await call(`/api/admin/projects/${item.id}`, { method: 'PATCH', auth, body: { version: item.version, translations, repository: 'https://github.com/example/test', privateNote: 'PRIVATE_CONCEPT_NOTE' } })).data;
  item = (await call(`/api/admin/projects/${item.id}/publish`, { method: 'POST', auth, body: { version: item.version } })).data;
  result = await call(`/api/projects/${item.id}`); assert.equal(result.status, 200); assert.equal(result.data.translations.en.summary, 'English summary'); assert.ok(!result.text.includes('PRIVATE_CONCEPT_NOTE'));
  const oldVersion = item.version;
  item = (await call(`/api/admin/projects/${item.id}`, { method: 'PATCH', auth, body: { version: item.version, translations: { ...translations, en: { ...translations.en, summary: 'Unpublished change' } } } })).data;
  assert.equal((await call(`/api/projects/${item.id}`)).data.translations.en.summary, 'English summary');
  assert.equal((await call(`/api/admin/projects/${item.id}`, { method: 'PATCH', auth, body: { version: oldVersion, order: 7 } })).status, 409);
  assert.equal((await call(`/api/admin/projects/${item.id}/unpublish`, { method: 'POST', auth, body: { version: item.version } })).status, 200);
  assert.equal((await call(`/api/projects/${item.id}`)).status, 404);
});

test('draft media is private, becomes public on publish and is revoked on unpublish', async t => {
  const { call, login } = await fixture(t); const auth = await login();
  let item = (await call('/api/admin/projects', { auth })).data[0];
  item = (await call(`/api/admin/projects/${item.id}/image`, { method: 'POST', auth, body: { version: item.version, base64: png } })).data;
  const image = item.imageUrl;
  assert.equal((await call(image)).status, 404); assert.equal((await call(image, { auth })).status, 200);
  item = (await call(`/api/admin/projects/${item.id}/publish`, { method: 'POST', auth, body: { version: item.version } })).data;
  assert.equal((await call(image)).status, 200); assert.equal((await call(image)).headers.get('cache-control'), 'no-store');
  await call(`/api/admin/projects/${item.id}/unpublish`, { method: 'POST', auth, body: { version: item.version } });
  assert.equal((await call(image)).status, 404);
});

test('missing CSRF and foreign origins cannot change content or authenticate', async t => {
  const { call, login } = await fixture(t); const auth = await login();
  assert.equal((await call('/api/admin/projects', { method: 'POST', auth, body: {}, headers: { 'X-CSRF-Token': '' } })).status, 403);
  assert.equal((await call('/api/admin/projects', { method: 'POST', auth, body: {}, headers: { Origin: 'https://untrusted.example' } })).status, 403);
  assert.equal((await call('/api/session', { method: 'POST', body: { key }, headers: { Origin: 'https://untrusted.example' } })).status, 403);
});

test('logout revokes a copied session cookie; restart preserves content but not sessions', async t => {
  const first = await fixture(t), auth = await first.login();
  await first.call('/api/session', { method: 'DELETE', auth, body: {} });
  assert.equal((await first.call('/api/admin/projects', { auth })).status, 401);
  const auth2 = await first.login(); const item = (await first.call('/api/admin/projects', { method: 'POST', auth: auth2, body: {} })).data;
  await new Promise(resolve => first.server.close(resolve));
  const second = await fixture(t, { dataDir: first.dataDir });
  assert.equal((await second.call('/api/admin/projects', { auth: auth2 })).status, 401);
  const auth3 = await second.login(); assert.ok((await second.call('/api/admin/projects', { auth: auth3 })).data.some(x => x.id === item.id));
});

test('unsafe URLs, unknown fields and unsupported images are rejected', async t => {
  const { call, login } = await fixture(t), auth = await login();
  for (const fields of [{ repository: 'javascript:alert(1)' }, { role: 'admin' }, { published: true }]) assert.equal((await call('/api/admin/projects/aipm', { method: 'PATCH', auth, body: { version: 1, ...fields } })).status, 400);
  assert.equal((await call('/api/admin/projects/aipm/image', { method: 'POST', auth, body: { version: 1, base64: Buffer.from('<svg/>').toString('base64') } })).status, 415);
});

test('repeated invalid keys are rate limited', async t => {
  const { call } = await fixture(t);
  for (let i = 0; i < 12; i++) assert.equal((await call('/api/session', { method: 'POST', body: { key: 'invalid' } })).status, 401);
  assert.equal((await call('/api/session', { method: 'POST', body: { key: 'invalid' } })).status, 429);
});
