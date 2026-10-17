import test from 'node:test';
import assert from 'node:assert/strict';
import { emptyLibrary, externalURL, parseManifest, readLibrary } from '../../components/apps/AppStore/model.ts';
const origin = 'https://hyc.ac';
const manifest = { name: 'My app', url: 'https://example.com/app' };
const app = { ...parseManifest(manifest, origin), id: 'web-12345678-1234-1234-1234-123456789abc', enabled: true };

test('URL entry rejects executable, same-site, credentialed and local targets', () => {
  for (const url of ['javascript:alert(1)', 'data:text/html,x', 'file:///a', 'http://example.com', '/api/session', 'https://hyc.ac/api/session', 'https://hyc.ac:444/', 'https://a:b@example.com', 'https://localhost/', 'https://local.localhost/', 'https://192.168.1.2/', 'https://[::1]/', 'https://intranet/']) assert.throws(() => externalURL(url, origin), url);
  assert.equal(externalURL('https://example.com/app?q=1#x', origin), 'https://example.com/app?q=1#x');
});

test('manifest restricts fields and size without retaining executable permissions', () => {
  assert.deepEqual(parseManifest(manifest, origin), { ...manifest, nameEn: 'My app', description: '' });
  for (const data of [null, [], { ...manifest, code: 'alert(1)' }, { ...manifest, permissions: ['admin'] }, { ...manifest, name: '' }, { ...manifest, name: 'a'.repeat(81) }, { ...manifest, description: {} }]) assert.throws(() => parseManifest(data, origin));
});

test('library round trip preserves disabled state and rejects corrupt or duplicate entries', () => {
  const value = { version: 1, favorites: ['Paint'], apps: [{ ...app, enabled: false }] };
  assert.deepEqual(readLibrary(JSON.stringify(value), origin), value);
  assert.deepEqual(readLibrary(null, origin), emptyLibrary());
  for (const value of [{}, { version: 2, apps: [], favorites: [] }, { version: 1, favorites: [], apps: [app, app] }, { version: 1, favorites: [], apps: [{ ...app, url: 'javascript:alert(1)' }] }, { version: 1, favorites: [], apps: [{ ...app, enabled: 'false' }] }]) assert.throws(() => readLibrary(JSON.stringify(value), origin));
  assert.throws(() => readLibrary('{', origin));
});
