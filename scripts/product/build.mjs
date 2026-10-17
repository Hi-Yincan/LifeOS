import { execFileSync } from 'node:child_process';
import { existsSync, rmSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
if (process.versions.node.split('.')[0] !== '22') throw new Error('Use the Node 22 version in .node-version');
const run = (script, args = []) => execFileSync(process.execPath, [resolve(root, script), ...args], { cwd: root, stdio: 'inherit' });
// Rebuild generated data; never overwrite source files or import a temporary checkout.
for (const file of ['.next', '.swc', 'out', 'tsconfig.tsbuildinfo', 'public/.index', 'public/robots.txt', 'public/sitemap.xml']) {
  rmSync(resolve(root, file), { recursive: true, force: true });
}
for (const script of ['personalSite.cjs', 'searchIndex.js', 'preloadIcons.js', 'cacheShortcuts.js']) run(`scripts/${script}`);
run('scripts/fs2json.js', ['--exclude', '.index,private', '--out', 'public/.index/fs.9p.json', './public']);
if (existsSync(resolve(root, 'public/private'))) run('scripts/fs2json.js', ['--out', 'public/.index/fs.private.9p.json', './public/private']);
run('node_modules/next/dist/bin/next', ['build', '--webpack']);
run('scripts/minifyHtml.js');
run('scripts/minifyJs.js');
run('scripts/product/audit-site.mjs');
for (const file of ['.next', '.swc', 'tsconfig.tsbuildinfo']) rmSync(resolve(root, file), { recursive: true, force: true });
