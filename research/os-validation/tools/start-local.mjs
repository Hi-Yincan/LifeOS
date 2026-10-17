import { mkdirSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
import { resolve } from 'node:path';
import { createValidationServer } from '../server.mjs';

mkdirSync('.runtime', { recursive: true });
const file = '.runtime/credentials.json';
if (!existsSync(file)) writeFileSync(file, JSON.stringify({ adminPassword: randomBytes(20).toString('hex'), visitorPassword: randomBytes(20).toString('hex') }), { mode: 0o600 });
const passwords = JSON.parse(readFileSync(file, 'utf8'));
const server = createValidationServer({ dataDir: resolve('.runtime/data'), ...passwords });
server.listen(4387, '127.0.0.1', () => console.log('Local validation: http://127.0.0.1:4387 — credentials in ignored .runtime/credentials.json'));
