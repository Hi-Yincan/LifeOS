import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createDevelopmentServer } from '../service.mjs';

const dataDir = mkdtempSync(join(tmpdir(), 'hyc-product-e2e-'));
const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const server = createDevelopmentServer({ dataDir, key: 'product-e2e-only-not-a-real-credential', staticDir: resolve(root, 'out') });
server.listen(4392, '127.0.0.1');
for (const signal of ['SIGINT', 'SIGTERM']) process.once(signal, () => server.close(() => {
  rmSync(dataDir, { recursive: true, force: true });
  process.exit(0);
}));
