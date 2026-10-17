import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, extname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const checkout = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const site = JSON.parse(readFileSync(resolve(checkout, 'personal-site.json'), 'utf8'));
const textExtensions = new Set(['.txt', '.json', '.xml', '.html', '.js', '.cjs', '.mjs', '.ts', '.tsx', '.css', '.svg', '.md', '.url', '.ini']);
const leftovers = [];
const baseline = JSON.parse(readFileSync(resolve(checkout, 'maintenance/upstream/baseline.json'), 'utf8'));
const directory = readFileSync(resolve(checkout, 'contexts/process/directory.ts'), 'utf8');
const processIds = [...directory.matchAll(/^  (\w+): \{/gm)].map(match => match[1]);
assert.deepEqual(processIds.toSorted(), [...baseline.nativeProcesses, ...baseline.productProcesses].toSorted(), 'Native and product process registry must stay complete');
let scanned = 0;
function scan(path) {
  for (const entry of readdirSync(path, { withFileTypes: true })) {
    const file = resolve(path, entry.name);
    // The auditor's own denylist is not runtime or published site content.
    if (file === fileURLToPath(import.meta.url)) continue;
    if (entry.isDirectory()) scan(file);
    else if (entry.isFile() && textExtensions.has(extname(file))) {
      scanned++;
      if (/dustinbrett\.com|dustinbrett@gmail\.com|npub10l3amzckl56834tgsvdafrg5dtux9aam9maqvudjfsjtnjjdduaqj0sehy/i.test(readFileSync(file, 'utf8'))) leftovers.push(file);
    }
  }
}
for (const name of ['public', 'out', 'components', 'contexts', 'utils', 'hooks', 'pages', 'scripts']) scan(resolve(checkout, name));
assert.deepEqual(leftovers, [], 'Old site identity must not reach runtime sources or output');
assert.equal(JSON.parse(readFileSync(resolve(checkout, 'package.json'), 'utf8')).author.url, site.url);
for (const tree of ['public', 'out']) {
  for (const name of ['favicon.ico', 'screenshot.png', 'rss.xml', 'System/PersonalOS/settings.svg', 'System/PersonalOS/capture.js']) {
    assert.equal(existsSync(resolve(checkout, tree, name)), false, `Retired artifact: ${tree}/${name}`);
  }
  const robots = readFileSync(resolve(checkout, tree, 'robots.txt'), 'utf8');
  assert.ok(robots.includes(`Sitemap: ${site.url}/sitemap.xml`));
  const sitemap = readFileSync(resolve(checkout, tree, 'sitemap.xml'), 'utf8');
  const links = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => match[1]);
  assert.deepEqual(links, site.entryPoints.map(path => new URL(path, site.url).href));
  assert.ok(existsSync(resolve(checkout, tree, `.${site.icon}`)));
  for (const index of ['fs.9p', 'search.lunr', 'shortcutCache', 'desktopIcons', 'startMenuIcons', 'iniIcons']) {
    JSON.parse(readFileSync(resolve(checkout, tree, `.index/${index}.json`), 'utf8'));
  }
}
const html = readFileSync(resolve(checkout, 'out/index.html'), 'utf8');
assert.ok(html.includes(site.name) && html.includes(`${site.url}${site.icon}`));
assert.ok(!html.includes('rss.xml') && !html.includes('screenshot.png'));
console.log(JSON.stringify({ status: 'passed', scannedTextFiles: scanned, site: site.url, retiredArtifactsAbsent: true, requiredIndexesPresent: true }, null, 2));
