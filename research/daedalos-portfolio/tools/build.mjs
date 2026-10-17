import { execFileSync } from 'node:child_process';
import { existsSync, rmSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const tools = dirname(fileURLToPath(import.meta.url));
const checkout = resolve(process.argv[2] || '/tmp/hi-yincan-daedalos-concept');
// Prepare verifies the fixed upstream SHA and refuses unrecognized source edits.
execFileSync(process.execPath, [resolve(tools, 'prepare.mjs'), checkout], { stdio: 'inherit' });
for (const name of ['.next', '.swc', 'out', 'tsconfig.tsbuildinfo', 'public/.index', 'public/robots.txt', 'public/sitemap.xml']) {
  const path = resolve(checkout, name);
  if (existsSync(path)) rmSync(path, { recursive: true, force: true });
}
// An optional Yarn Classic JS entry point supports machines without global Yarn.
const yarnScript = process.argv[3];
execFileSync(yarnScript ? process.execPath : 'yarn', yarnScript ? [resolve(yarnScript), 'build'] : ['build'], { cwd: checkout, stdio: 'inherit' });
execFileSync(process.execPath, [resolve(tools, 'audit-site.mjs'), checkout], { stdio: 'inherit' });
// Static serving needs only out/. Keep required indexes, discard intermediate builds.
for (const name of ['.next', '.swc', 'tsconfig.tsbuildinfo']) rmSync(resolve(checkout, name), { recursive: true, force: true });
