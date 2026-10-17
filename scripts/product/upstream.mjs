import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const baseline = JSON.parse(readFileSync(resolve(root, 'maintenance/upstream/baseline.json'), 'utf8'));
const git = args => execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim();
git(['merge-base', '--is-ancestor', baseline.sha, 'HEAD']);
const target = process.argv[2];
if (target) {
  if (!/^[a-f0-9]{40}$/.test(target)) throw new Error('Pass a fetched, full upstream commit SHA');
  git(['cat-file', '-e', `${target}^{commit}`]);
  const changes = git(['diff', '--name-only', baseline.sha, target]).split('\n').filter(Boolean);
  const customized = new Set(git(['diff', '--name-only', baseline.sha, 'HEAD']).split('\n'));
  console.log(JSON.stringify({ baseline: baseline.sha, target, changedFiles: changes, overlappingFiles: changes.filter(file => customized.has(file)) }, null, 2));
} else {
  const [head] = git(['ls-remote', baseline.repository, `refs/heads/${baseline.branch}`]).split(/\s+/);
  if (!/^[a-f0-9]{40}$/.test(head)) throw new Error('No valid upstream SHA returned');
  console.log(JSON.stringify({ baseline: baseline.sha, upstreamHead: head, updateAvailable: head !== baseline.sha, policy: 'Review a pinned target in an upgrade PR; no automatic merge or deployment' }, null, 2));
}
