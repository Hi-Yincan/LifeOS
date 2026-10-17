import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createConceptServer } from '../service.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const runtime = resolve(root, '.runtime'); mkdirSync(runtime, { recursive: true });
const keyFile = resolve(runtime, 'key.json');
if (!existsSync(keyFile)) writeFileSync(keyFile, JSON.stringify({ key: randomBytes(32).toString('base64url') }), { mode: 0o600 });
const { key } = JSON.parse(readFileSync(keyFile, 'utf8'));
const staticDir = resolve(process.argv[2] || '/tmp/hi-yincan-daedalos-concept/out');
const server = createConceptServer({ dataDir: resolve(runtime, 'data'), key, staticDir });
server.listen(4391, '127.0.0.1', () => console.log('daedalOS concept: http://127.0.0.1:4391 — local key in ignored .runtime/key.json'));
