import http from 'node:http';
import { randomBytes, randomUUID, scryptSync, timingSafeEqual } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync, renameSync, statSync } from 'node:fs';
import { resolve, dirname, extname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
const clone = value => JSON.parse(JSON.stringify(value));
const seed = JSON.parse(readFileSync(resolve(root, 'content/seed.json'), 'utf8'));
const safeUrl = value => !value || /^https:\/\//.test(value);
const publicFields = item => ({ id: item.id, kind: item.kind, order: item.order, accent: item.accent, technology: item.technology, repository: item.repository, website: item.website, video: item.video, translations: item.translations, imageId: item.imageId, imageUrl: item.imageId ? `/media/${item.imageId}` : null });
const initial = () => ({ profile: clone(seed.profile), projects: seed.projects.map(item => ({ id: item.id, draft: clone(item), published: item.published ? publicFields(item) : null, version: 1, updatedAt: new Date().toISOString() })) });

export function createDevelopmentServer({ dataDir, key, staticDir, secureCookies = false }) {
  if (typeof key !== 'string' || key.length < 24) throw new Error('Provide an explicit concept key of at least 24 characters');
  mkdirSync(resolve(dataDir, 'images'), { recursive: true });
  const file = resolve(dataDir, 'content.json');
  const persist = value => { writeFileSync(file + '.next', JSON.stringify(value, null, 2), { mode: 0o600 }); renameSync(file + '.next', file); };
  if (!existsSync(file)) persist(initial());
  let data = JSON.parse(readFileSync(file, 'utf8'));
  const sessions = new Map(), attempts = new Map(), salt = randomBytes(24), keyHash = scryptSync(key, salt, 32);
  const send = (res, status, body, headers = {}) => { res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', ...headers }); res.end(JSON.stringify(body)); };
  const cookie = token => `hyc_concept_session=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${token ? 3600 : 0}${secureCookies ? '; Secure' : ''}`;
  const body = async req => {
    if (!req.headers['content-type']?.startsWith('application/json')) throw Object.assign(new Error('JSON_REQUIRED'), { status: 415 });
    let length = 0; const chunks = [];
    for await (const chunk of req) { length += chunk.length; if (length > 4_300_000) throw Object.assign(new Error('TOO_LARGE'), { status: 413 }); chunks.push(chunk); }
    try { return JSON.parse(Buffer.concat(chunks).toString()); } catch { throw Object.assign(new Error('INVALID_JSON'), { status: 400 }); }
  };
  const invalid = message => Object.assign(new Error(message), { status: 400 });
  const validate = item => {
    if (!['project', 'contribution'].includes(item.kind) || !Number.isInteger(item.order) || item.order < 0 || item.order > 10000) throw invalid('INVALID_FIELDS');
    if (!Array.isArray(item.technology) || item.technology.length > 15 || item.technology.some(x => typeof x !== 'string' || x.length > 80)) throw invalid('INVALID_TECHNOLOGY');
    if (!['blue', 'violet', 'teal', 'amber'].includes(item.accent)) throw invalid('INVALID_ACCENT');
    for (const field of ['repository', 'website', 'video']) if (typeof item[field] !== 'string' || item[field].length > 2000 || !safeUrl(item[field])) throw invalid('INVALID_URL');
    if (typeof item.privateNote !== 'string' || item.privateNote.length > 5000) throw invalid('INVALID_NOTE');
    for (const locale of ['zh', 'en']) {
      const text = item.translations?.[locale];
      if (!text || !text.title?.trim() || text.title.length > 100) throw invalid('TITLE_REQUIRED');
      for (const field of ['summary', 'background', 'contribution', 'detail']) if (typeof text[field] !== 'string' || text[field].length > 10000) throw invalid('INVALID_TRANSLATION');
    }
  };
  const server = http.createServer(async (req, res) => {
    try {
      const port = server.address().port;
      if (![`127.0.0.1:${port}`, `localhost:${port}`].includes(req.headers.host)) return send(res, 421, { error: 'INVALID_HOST' });
      const origin = `http://${req.headers.host}`, url = new URL(req.url, origin), path = url.pathname;
      const token = /(?:^|;\s*)hyc_concept_session=([^;]+)/.exec(req.headers.cookie ?? '')?.[1];
      let session = sessions.get(token);
      if (session && session.expires < Date.now()) { sessions.delete(token); session = null; }
      const write = !['GET', 'HEAD'].includes(req.method);
      if (write && req.headers.origin && req.headers.origin !== origin) return send(res, 403, { error: 'INVALID_ORIGIN' });
      if (req.method === 'GET' && path === '/api/session') return send(res, 200, { role: session ? 'admin' : 'visitor', csrf: session?.csrf ?? null });
      if (req.method === 'POST' && path === '/api/session') {
        const ip = req.socket.remoteAddress, recent = (attempts.get(ip) ?? []).filter(x => x > Date.now() - 60000);
        if (recent.length >= 12) return send(res, 429, { error: 'TRY_LATER' });
        attempts.set(ip, [...recent, Date.now()]); const input = await body(req);
        if (typeof input.key !== 'string' || input.key.length > 256 || !timingSafeEqual(scryptSync(input.key, salt, 32), keyHash)) return send(res, 401, { error: 'INVALID_KEY' });
        if (token) sessions.delete(token);
        const next = randomBytes(32).toString('hex'); session = { csrf: randomBytes(24).toString('hex'), expires: Date.now() + 3600000 }; sessions.set(next, session);
        return send(res, 200, { role: 'admin', csrf: session.csrf }, { 'Set-Cookie': cookie(next) });
      }
      if (req.method === 'DELETE' && path === '/api/session') {
        if (!session || req.headers['x-csrf-token'] !== session.csrf) return send(res, 403, { error: 'INVALID_SESSION' });
        sessions.delete(token); return send(res, 200, { role: 'visitor', csrf: null }, { 'Set-Cookie': cookie('') });
      }
      if (req.method === 'GET' && path === '/api/profile') return send(res, 200, data.profile);
      if (req.method === 'GET' && path === '/api/projects') return send(res, 200, data.projects.filter(x => x.published).map(x => x.published).sort((a, b) => a.order - b.order));
      if (req.method === 'GET' && /^\/api\/projects\/[^/]+$/.test(path)) {
        const found = data.projects.find(x => x.id === path.split('/')[3] && x.published);
        return found ? send(res, 200, found.published) : send(res, 404, { error: 'NOT_FOUND' });
      }
      if (req.method === 'GET' && path.startsWith('/media/')) {
        const id = path.slice(7), allowed = /^[a-f\d-]+\.(png|jpg|webp)$/.test(id) && data.projects.some(x => x.published?.imageId === id || (session && x.draft.imageId === id));
        const filename = resolve(dataDir, 'images', id);
        if (!allowed || !existsSync(filename)) return send(res, 404, { error: 'NOT_FOUND' });
        res.writeHead(200, { 'Content-Type': { '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp' }[extname(id)], 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' }); return res.end(readFileSync(filename));
      }
      if (path.startsWith('/api/admin/')) {
        if (!session) return send(res, 401, { error: 'AUTH_REQUIRED' });
        if (write && req.headers['x-csrf-token'] !== session.csrf) return send(res, 403, { error: 'CSRF_REQUIRED' });
        if (req.method === 'GET' && path === '/api/admin/projects') return send(res, 200, data.projects.map(x => ({ ...x.draft, published: Boolean(x.published), version: x.version, updatedAt: x.updatedAt, imageUrl: x.draft.imageId ? `/media/${x.draft.imageId}` : null })).sort((a, b) => a.order - b.order));
        if (req.method === 'POST' && path === '/api/admin/projects') {
          const id = randomUUID(), draft = { id, kind: 'project', order: data.projects.length, accent: 'blue', technology: [], repository: '', website: '', video: '', imageId: null, privateNote: '', translations: { zh: { title: '新项目', summary: '', background: '', contribution: '', detail: '' }, en: { title: 'New project', summary: '', background: '', contribution: '', detail: '' } } };
          data.projects.push({ id, draft, published: null, version: 1, updatedAt: new Date().toISOString() }); persist(data); return send(res, 201, { ...draft, version: 1 });
        }
        const match = /^\/api\/admin\/projects\/([\w-]+)(?:\/(publish|unpublish|image))?$/.exec(path), item = match && data.projects.find(x => x.id === match[1]);
        if (!item) return send(res, 404, { error: 'NOT_FOUND' });
        const input = await body(req);
        if (input.version !== item.version) return send(res, 409, { error: 'VERSION_CONFLICT' });
        if (req.method === 'PATCH' && !match[2]) {
          const allowed = ['version', 'translations', 'kind', 'order', 'accent', 'technology', 'repository', 'website', 'video', 'privateNote'];
          if (Object.keys(input).some(x => !allowed.includes(x))) return send(res, 400, { error: 'INVALID_FIELDS' });
          const { version, ...fields } = input; const next = { ...item.draft, ...fields }; validate(next); item.draft = next;
        } else if (req.method === 'POST' && match[2] === 'publish') {
          validate(item.draft);
          if (!item.draft.repository || ['zh', 'en'].some(locale => !item.draft.translations[locale].summary.trim())) return send(res, 400, { error: 'PUBLICATION_INCOMPLETE' });
          item.published = publicFields(clone(item.draft));
        } else if (req.method === 'POST' && match[2] === 'unpublish') item.published = null;
        else if (req.method === 'POST' && match[2] === 'image') {
          if (typeof input.base64 !== 'string' || input.base64.length > 4200000) return send(res, 413, { error: 'IMAGE_TOO_LARGE' });
          const bytes = Buffer.from(input.base64, 'base64'); let extension;
          if (bytes.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10]))) extension = 'png';
          else if (bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255) extension = 'jpg';
          else if (bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP') extension = 'webp';
          if (!extension || bytes.length > 3000000) return send(res, 415, { error: 'INVALID_IMAGE' });
          const imageId = `${randomUUID()}.${extension}`; writeFileSync(resolve(dataDir, 'images', imageId), bytes, { mode: 0o600 }); item.draft.imageId = imageId;
        } else return send(res, 405, { error: 'METHOD_NOT_ALLOWED' });
        item.version++; item.updatedAt = new Date().toISOString(); persist(data);
        return send(res, 200, { ...item.draft, version: item.version, published: Boolean(item.published), imageUrl: item.draft.imageId ? `/media/${item.draft.imageId}` : null });
      }
      if (path.startsWith('/api/')) return send(res, 404, { error: 'NOT_FOUND' });
      if (!['GET', 'HEAD'].includes(req.method) || !staticDir) return send(res, 404, { error: 'NOT_FOUND' });
      const decoded = decodeURIComponent(path), base = resolve(staticDir), filename = resolve(base, '.' + decoded);
      if (!filename.startsWith(base + sep) && filename !== base) return send(res, 404, { error: 'NOT_FOUND' });
      let asset = filename;
      if (existsSync(asset) && statSync(asset).isDirectory()) asset = resolve(asset, 'index.html');
      if (!existsSync(asset)) return send(res, 404, { error: 'NOT_FOUND' });
      const type = { '.txt':'text/plain; charset=utf-8', '.xml':'application/xml; charset=utf-8', '.html':'text/html; charset=utf-8', '.js':'text/javascript', '.css':'text/css', '.json':'application/json', '.svg':'image/svg+xml', '.png':'image/png', '.webp':'image/webp', '.jpg':'image/jpeg', '.ico':'image/x-icon', '.wasm':'application/wasm', '.woff2':'font/woff2', '.mp4':'video/mp4', '.mp3':'audio/mpeg' }[extname(asset)] ?? 'application/octet-stream';
      res.writeHead(200, { 'Content-Type': type, 'Cache-Control': 'no-cache', 'X-Content-Type-Options': 'nosniff', 'Cross-Origin-Opener-Policy': 'same-origin', 'Cross-Origin-Embedder-Policy': 'credentialless' });
      return req.method === 'HEAD' ? res.end() : res.end(readFileSync(asset));
    } catch (error) { send(res, error.status ?? 500, { error: error.status ? error.message : 'SERVER_ERROR' }); }
  });
  return server;
}
