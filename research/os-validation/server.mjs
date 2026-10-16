import http from 'node:http';
import { randomBytes, randomUUID, scryptSync, timingSafeEqual } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { dirname, extname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
export const article = {
  slug: 'validation-note', title: '把生活整理成自己的桌面',
  summary: '一篇完整的合成测试文章，用来验证中文阅读、内容链接和窗口导航。',
  paragraphs: [
    '这是用于选型验证的样例内容，不是作者的真实生活记录。这个桌面只承载博客和衣柜，让访客先看到内容，而不是学习一套复杂的操作系统。',
    '博客可以记录思考，衣柜可以展示搭配。它们共享窗口、导航和登录状态，但每个应用保留自己的内容结构。管理员可以在同一界面维护内容，访客看到的始终是明确发布过的版本。',
    '公开页面需要稳定链接。无论从桌面进入还是直接打开文章地址，都应读到同一篇文章。手机上则优先保证文字阅读、返回和应用切换。',
    '这次实验关注这些具体流程是否成立。框架名称、图标数量和动画都不能代替实际验收；一条可靠的发布链路，比一个看起来功能繁多的桌面更有价值。',
  ],
};

function initialData() {
  return { items: [
    { id: 'blue-shirt', draft: { title: '蓝色棉衬衫', description: '合成样例：适合日常通勤的蓝色衬衫。', privateNote: '仅管理员可见的采购备注', imageId: null }, published: { title: '蓝色棉衬衫', description: '合成样例：适合日常通勤的蓝色衬衫。', imageId: null }, updatedAt: new Date().toISOString() },
    { id: 'private-coat', draft: { title: '未发布测试外套', description: '这条草稿不应出现在访客列表。', privateNote: 'PRIVATE_FIXTURE_NOTE', imageId: null }, published: null, updatedAt: new Date().toISOString() },
  ] };
}

export function createValidationServer({ dataDir, adminPassword, visitorPassword, staticDir = resolve(root, 'dist') }) {
  if (!adminPassword || adminPassword.length < 12) throw new Error('An explicit local validation password of at least 12 characters is required.');
  mkdirSync(resolve(dataDir, 'images'), { recursive: true });
  const dataFile = resolve(dataDir, 'content.json');
  const persist = data => { writeFileSync(`${dataFile}.next`, JSON.stringify(data, null, 2), { mode: 0o600 }); renameSync(`${dataFile}.next`, dataFile); };
  if (!existsSync(dataFile)) persist(initialData());
  let data = JSON.parse(readFileSync(dataFile, 'utf8'));
  const salt = randomBytes(24);
  const credentials = new Map([['admin', { role: 'admin', hash: scryptSync(adminPassword, salt, 32) }]]);
  if (visitorPassword) credentials.set('visitor', { role: 'visitor', hash: scryptSync(visitorPassword, salt, 32) });
  const sessions = new Map();
  const loginAttempts = new Map();
  const json = (res, status, value, headers = {}) => { res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', ...headers }); res.end(JSON.stringify(value)); };
  const readBody = async req => {
    if (!req.headers['content-type']?.startsWith('application/json')) throw Object.assign(new Error('只接受 JSON 请求'), { status: 415 });
    const chunks = []; let size = 0;
    for await (const chunk of req) { size += chunk.length; if (size > 1_500_000) throw Object.assign(new Error('请求过大'), { status: 413 }); chunks.push(chunk); }
    try { return JSON.parse(Buffer.concat(chunks).toString()); } catch { throw Object.assign(new Error('JSON 无效'), { status: 400 }); }
  };
  const publicItem = item => ({ id: item.id, ...item.published, imageUrl: item.published.imageId ? `/media/${item.published.imageId}` : null });
  const adminItem = item => ({ id: item.id, ...item.draft, published: Boolean(item.published), imageUrl: item.draft.imageId ? `/media/${item.draft.imageId}` : null, updatedAt: item.updatedAt });

  const server = http.createServer(async (req, res) => {
    try {
      const expectedHost = `127.0.0.1:${server.address().port}`;
      if (![expectedHost, `localhost:${server.address().port}`].includes(req.headers.host)) return json(res, 421, { error: '无效主机' });
      const origin = `http://${req.headers.host}`;
      const url = new URL(req.url, origin);
      const token = /(?:^|;\s*)os_validation_session=([^;]+)/.exec(req.headers.cookie ?? '')?.[1];
      let session = sessions.get(token);
      if (session && session.expires < Date.now()) { sessions.delete(token); session = null; }
      const mutates = !['GET', 'HEAD'].includes(req.method);
      if (mutates && req.headers.origin && req.headers.origin !== origin) return json(res, 403, { error: '不允许外源写入' });
      if (req.method === 'GET' && url.pathname === '/api/session') return json(res, 200, { role: session?.role ?? 'visitor', authenticated: Boolean(session), csrf: session?.csrf ?? null });
      if (req.method === 'POST' && url.pathname === '/api/login') {
        const key = req.socket.remoteAddress;
        const recent = (loginAttempts.get(key) ?? []).filter(time => time > Date.now() - 60_000);
        if (recent.length >= 12) return json(res, 429, { error: '请稍后重试' });
        loginAttempts.set(key, [...recent, Date.now()]);
        const body = await readBody(req);
        const user = credentials.get(body.username);
        const candidate = scryptSync(String(body.password ?? ''), salt, 32);
        if (!user || !timingSafeEqual(candidate, user.hash)) return json(res, 401, { error: '登录信息无效' });
        const newToken = randomBytes(32).toString('hex');
        const newSession = { role: user.role, csrf: randomBytes(24).toString('hex'), expires: Date.now() + 3_600_000 };
        if (token) sessions.delete(token);
        sessions.set(newToken, newSession);
        return json(res, 200, { role: user.role, authenticated: true, csrf: newSession.csrf }, { 'Set-Cookie': `os_validation_session=${newToken}; HttpOnly; SameSite=Strict; Path=/; Max-Age=3600` });
      }
      if (req.method === 'POST' && url.pathname === '/api/logout') {
        if (!session || req.headers['x-csrf-token'] !== session.csrf) return json(res, 403, { error: '无效会话' });
        sessions.delete(token);
        return json(res, 200, { ok: true }, { 'Set-Cookie': 'os_validation_session=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0' });
      }
      if (req.method === 'GET' && url.pathname === '/api/blog') return json(res, 200, article);
      if (req.method === 'GET' && url.pathname === '/api/wardrobe') return json(res, 200, data.items.filter(item => item.published).map(publicItem));
      if (req.method === 'GET' && url.pathname.startsWith('/api/wardrobe/')) {
        const item = data.items.find(item => item.id === url.pathname.split('/')[3] && item.published);
        return item ? json(res, 200, publicItem(item)) : json(res, 404, { error: '内容不存在或未发布' });
      }
      if (req.method === 'GET' && url.pathname.startsWith('/media/')) {
        const imageId = url.pathname.slice(7);
        const allowed = /^[\da-f-]+\.png$/.test(imageId) && data.items.some(item => item.published?.imageId === imageId || (session?.role === 'admin' && item.draft.imageId === imageId));
        const path = resolve(dataDir, 'images', imageId);
        if (!allowed || !existsSync(path)) return json(res, 404, { error: '图片不可用' });
        res.writeHead(200, { 'Content-Type': 'image/png', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
        return res.end(readFileSync(path));
      }
      if (url.pathname.startsWith('/api/admin/')) {
        if (!session) return json(res, 401, { error: '需要登录' });
        if (session.role !== 'admin') return json(res, 403, { error: '没有内容管理权限' });
        if (mutates && req.headers['x-csrf-token'] !== session.csrf) return json(res, 403, { error: '请求校验失败' });
        if (req.method === 'GET' && url.pathname === '/api/admin/wardrobe') return json(res, 200, data.items.map(adminItem));
        if (req.method === 'POST' && url.pathname === '/api/admin/wardrobe') {
          const body = await readBody(req);
          if (typeof body.title !== 'string' || !body.title.trim() || body.title.length > 120) return json(res, 400, { error: '请填写有效名称' });
          const item = { id: randomUUID(), draft: { title: body.title.trim(), description: '', privateNote: '', imageId: null }, published: null, updatedAt: new Date().toISOString() };
          data.items.push(item); persist(data); return json(res, 201, adminItem(item));
        }
        const match = /^\/api\/admin\/wardrobe\/([\w-]+)(?:\/(publish|unpublish|image))?$/.exec(url.pathname);
        const item = match && data.items.find(item => item.id === match[1]);
        if (!item) return json(res, 404, { error: '未找到管理对象' });
        if (req.method === 'PATCH' && !match[2]) {
          const body = await readBody(req);
          if (Object.keys(body).some(key => !['title', 'description', 'privateNote'].includes(key))) return json(res, 400, { error: '包含不可修改字段' });
          for (const [key, value] of Object.entries(body)) if (typeof value !== 'string' || value.length > (key === 'title' ? 120 : 5000) || (key === 'title' && !value.trim())) return json(res, 400, { error: '字段格式无效' });
          Object.assign(item.draft, body);
        } else if (req.method === 'POST' && match[2] === 'publish') {
          const { title, description, imageId } = item.draft;
          item.published = { title, description, imageId };
        } else if (req.method === 'POST' && match[2] === 'unpublish') item.published = null;
        else if (req.method === 'POST' && match[2] === 'image') {
          const body = await readBody(req);
          const bytes = Buffer.from(String(body.base64 ?? ''), 'base64');
          if (bytes.length > 1_000_000 || !bytes.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10]))) return json(res, 400, { error: '实验只接受 1 MB 以内的 PNG 图片' });
          const imageId = `${randomUUID()}.png`;
          writeFileSync(resolve(dataDir, 'images', imageId), bytes, { mode: 0o600 }); item.draft.imageId = imageId;
        } else if (req.method === 'DELETE' && !match[2]) data.items = data.items.filter(entry => entry !== item);
        else return json(res, 405, { error: '不支持该操作' });
        item.updatedAt = new Date().toISOString(); persist(data); return json(res, 200, adminItem(item));
      }
      if (url.pathname.startsWith('/api/')) return json(res, 404, { error: '接口不存在' });
      if (!['GET', 'HEAD'].includes(req.method)) return json(res, 405, { error: '不支持该操作' });
      const contentRoute = url.pathname === '/' || url.pathname === '/wardrobe' || url.pathname === '/blog/validation-note' || (url.pathname.startsWith('/wardrobe/') && data.items.some(item => item.id === url.pathname.split('/')[2] && (item.published || session?.role === 'admin')));
      const target = contentRoute ? resolve(staticDir, 'index.html') : resolve(staticDir, `.${url.pathname}`);
      if (!target.startsWith(resolve(staticDir) + sep) || !existsSync(target)) return json(res, 404, { error: '页面不存在' });
      const type = { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png' }[extname(target)] ?? 'application/octet-stream';
      res.writeHead(200, { 'Content-Type': type, 'X-Content-Type-Options': 'nosniff', 'Cache-Control': 'no-store' }); res.end(req.method === 'HEAD' ? undefined : readFileSync(target));
    } catch (error) { json(res, error.status ?? 500, { error: error.status ? error.message : '实验服务错误' }); }
  });
  return server;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const server = createValidationServer({ dataDir: process.env.VALIDATION_DATA_DIR ?? resolve(root, '.runtime/data'), adminPassword: process.env.VALIDATION_ADMIN_PASSWORD, visitorPassword: process.env.VALIDATION_VISITOR_PASSWORD });
  const port = Number(process.env.VALIDATION_PORT ?? 4387);
  server.listen(port, '127.0.0.1', () => console.log(`Validation only: http://127.0.0.1:${port}`));
}
