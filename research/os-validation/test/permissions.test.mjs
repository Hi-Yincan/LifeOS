import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { once } from 'node:events';
import { createValidationServer } from '../server.mjs';

const adminPassword = 'test-only-admin-passphrase';
const visitorPassword = 'test-only-reader-passphrase';
const png = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aGncAAAAASUVORK5CYII=';
async function start(t, dataDir = mkdtempSync(join(tmpdir(), 'os-validation-'))) {
  const server = createValidationServer({ dataDir, adminPassword, visitorPassword });
  server.listen(0, '127.0.0.1'); await once(server, 'listening');
  const base = `http://127.0.0.1:${server.address().port}`;
  t.after(() => new Promise(resolve => server.close(resolve)));
  const request = async (path, { method = 'GET', auth, body, headers = {} } = {}) => {
    const response = await fetch(base + path, { method, headers: { 'Content-Type': 'application/json', ...(auth ? { Cookie: auth.cookie, 'X-CSRF-Token': auth.csrf } : {}), ...headers }, ...(body !== undefined ? { body: JSON.stringify(body) } : {}) });
    const text = await response.text();
    let data; try { data = JSON.parse(text); } catch { data = text; }
    return { status: response.status, headers: response.headers, data, text };
  };
  const login = async (username = 'admin') => {
    const result = await request('/api/login', { method: 'POST', body: { username, password: username === 'admin' ? adminPassword : visitorPassword } });
    assert.equal(result.status, 200);
    return { cookie: result.headers.get('set-cookie').split(';')[0], csrf: result.data.csrf };
  };
  return { server, base, request, login, dataDir };
}

test('V01/V05 public lists omit drafts and management-only fields', async t => {
  const { request } = await start(t);
  const result = await request('/api/wardrobe');
  assert.equal(result.status, 200);
  assert.deepEqual(result.data.map(item => item.id), ['blue-shirt']);
  assert.ok(!result.text.includes('privateNote'));
  assert.ok(!result.text.includes('PRIVATE_FIXTURE_NOTE'));
  assert.equal((await request('/api/wardrobe/private-coat')).status, 404);
});

test('V04 role spoofing and anonymous writes fail at the API', async t => {
  const { request } = await start(t);
  for (const [path, method, body] of [
    ['/api/admin/wardrobe', 'POST', { title: 'Injected', role: 'admin' }],
    ['/api/admin/wardrobe/blue-shirt', 'PATCH', { title: 'Injected', role: 'admin' }],
    ['/api/admin/wardrobe/blue-shirt/publish', 'POST', { role: 'admin' }],
    ['/api/admin/wardrobe/blue-shirt', 'DELETE', { role: 'admin' }],
  ]) assert.equal((await request(path, { method, body, headers: { 'X-Role': 'admin' } })).status, 401);
});

test('V04 a real signed-in visitor cannot read admin data or write', async t => {
  const { request, login } = await start(t); const auth = await login('visitor');
  assert.equal((await request('/api/session', { auth })).data.role, 'visitor');
  assert.equal((await request('/api/admin/wardrobe', { auth })).status, 403);
  assert.equal((await request('/api/admin/wardrobe/blue-shirt/publish', { method: 'POST', auth, body: { role: 'admin' } })).status, 403);
});

test('V02/V03 drafts, publication snapshots, edits and withdrawal are isolated', async t => {
  const { request, login } = await start(t); const auth = await login();
  const created = await request('/api/admin/wardrobe', { method: 'POST', auth, body: { title: '验证衬衫' } });
  assert.equal(created.status, 201); const id = created.data.id;
  assert.equal((await request(`/api/wardrobe/${id}`)).status, 404);
  await request(`/api/admin/wardrobe/${id}`, { method: 'PATCH', auth, body: { description: '第一版', privateNote: 'PRIVATE_SECRET' } });
  await request(`/api/admin/wardrobe/${id}/publish`, { method: 'POST', auth, body: {} });
  const first = await request(`/api/wardrobe/${id}`);
  assert.equal(first.status, 200); assert.equal(first.data.description, '第一版'); assert.ok(!first.text.includes('PRIVATE_SECRET'));
  await request(`/api/admin/wardrobe/${id}`, { method: 'PATCH', auth, body: { description: '第二版草稿' } });
  assert.equal((await request(`/api/wardrobe/${id}`)).data.description, '第一版');
  await request(`/api/admin/wardrobe/${id}/publish`, { method: 'POST', auth, body: {} });
  assert.equal((await request(`/api/wardrobe/${id}`)).data.description, '第二版草稿');
  await request(`/api/admin/wardrobe/${id}/unpublish`, { method: 'POST', auth, body: {} });
  assert.equal((await request(`/api/wardrobe/${id}`)).status, 404);
  assert.ok(!(await request('/api/wardrobe')).data.some(item => item.id === id));
});

test('V03/V05 draft images are private and withdrawal removes public image access', async t => {
  const { request, login, base } = await start(t); const auth = await login();
  const uploaded = await request('/api/admin/wardrobe/private-coat/image', { method: 'POST', auth, body: { base64: png } });
  assert.equal(uploaded.status, 200); const imageUrl = uploaded.data.imageUrl;
  assert.equal((await request(imageUrl)).status, 404);
  assert.equal((await fetch(base + imageUrl, { headers: { Cookie: auth.cookie } })).status, 200);
  await request('/api/admin/wardrobe/private-coat/publish', { method: 'POST', auth, body: {} });
  const publicImage = await fetch(base + imageUrl); assert.equal(publicImage.status, 200); assert.equal(publicImage.headers.get('cache-control'), 'no-store');
  await request('/api/admin/wardrobe/private-coat/unpublish', { method: 'POST', auth, body: {} });
  assert.equal((await request(imageUrl)).status, 404);
});

test('V05 foreign origins and absent CSRF proofs cannot write', async t => {
  const { request, login } = await start(t); const auth = await login();
  assert.equal((await request('/api/admin/wardrobe/blue-shirt', { method: 'PATCH', auth, body: { title: 'Injected' }, headers: { Origin: 'https://foreign.example' } })).status, 403);
  assert.equal((await request('/api/admin/wardrobe/blue-shirt', { method: 'PATCH', auth, body: { title: 'Injected' }, headers: { 'X-CSRF-Token': '' } })).status, 403);
  assert.equal((await request('/api/login', { method: 'POST', body: { username: 'admin', password: adminPassword }, headers: { Origin: 'https://foreign.example' } })).status, 403);
});

test('V06 logout revokes the session even if its cookie is replayed', async t => {
  const { request, login } = await start(t); const auth = await login();
  assert.equal((await request('/api/admin/wardrobe', { auth })).status, 200);
  assert.equal((await request('/api/logout', { method: 'POST', auth, body: {} })).status, 200);
  assert.equal((await request('/api/admin/wardrobe', { auth })).status, 401);
});

test('V06 saved and published content survives a service restart', async t => {
  const first = await start(t); const auth = await first.login();
  await first.request('/api/admin/wardrobe/blue-shirt', { method: 'PATCH', auth, body: { title: '重启后仍存在' } });
  await first.request('/api/admin/wardrobe/blue-shirt/publish', { method: 'POST', auth, body: {} });
  await new Promise(resolve => first.server.close(resolve));
  const second = await start(t, first.dataDir);
  assert.equal((await second.request('/api/wardrobe/blue-shirt')).data.title, '重启后仍存在');
  assert.equal((await second.request('/api/admin/wardrobe', { auth })).status, 401);
});

test('V08 direct content URLs work and unknown or unpublished URLs return 404', async t => {
  const { request } = await start(t);
  for (const path of ['/', '/wardrobe', '/blog/validation-note', '/wardrobe/blue-shirt']) assert.equal((await request(path)).status, 200);
  for (const path of ['/missing', '/wardrobe/private-coat', '/wardrobe/missing']) assert.equal((await request(path)).status, 404);
});

test('V05 only supported image content and draft fields can be saved', async t => {
  const { request, login } = await start(t); const auth = await login();
  assert.equal((await request('/api/admin/wardrobe/blue-shirt/image', { method: 'POST', auth, body: { base64: Buffer.from('<svg onload="alert(1)">').toString('base64') } })).status, 400);
  assert.equal((await request('/api/admin/wardrobe/blue-shirt', { method: 'PATCH', auth, body: { published: { privateNote: 'leak' } } })).status, 400);
});

test('V09 the installed dependency tree has core but no optional OS app packages', () => {
  const lock = JSON.parse(readFileSync(new URL('../package-lock.json', import.meta.url), 'utf8'));
  assert.equal(lock.packages['node_modules/@prozilla-os/core'].version, '2.1.2');
  for (const name of ['app-center', 'browser', 'terminal', 'file-explorer', 'code-editor']) assert.ok(!lock.packages[`node_modules/@prozilla-os/${name}`], `${name} should not be installed`);
});
