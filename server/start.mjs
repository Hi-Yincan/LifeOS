import { randomBytes } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createDevelopmentServer } from './service.mjs';

const root = dirname(fileURLToPath(import.meta.url));
const runtime = resolve(root, '.runtime');
const port = Number(process.env.LIFEOS_PORT || 4392);
if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('Invalid LIFEOS_PORT');
const staticDir = resolve(root, '../out');
if (!existsSync(resolve(staticDir, 'index.html'))) throw new Error('Run yarn build first');
mkdirSync(runtime, { recursive: true });
const keyFile = resolve(runtime, 'key.json');
if (!existsSync(keyFile)) writeFileSync(keyFile, JSON.stringify({ key: randomBytes(32).toString('base64url') }), { mode: 0o600 });
const { key } = JSON.parse(readFileSync(keyFile, 'utf8'));
const server = createDevelopmentServer({ dataDir: resolve(runtime, 'data'), key, staticDir });
server.listen(port, '127.0.0.1', () => console.log(`Local development: http://127.0.0.1:${port} (credentials: server/.runtime/key.json)`));
for (const signal of ['SIGINT', 'SIGTERM']) process.once(signal, () => server.close(() => process.exit(0)));
