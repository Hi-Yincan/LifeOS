import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { publicSnapshot } from '../../scripts/product/public-content.mjs';

const fixture = () => JSON.parse(readFileSync(new URL('../content/seed.json', import.meta.url), 'utf8'));
test('public snapshot excludes unpublished records and private fields at each level', () => {
  const source = fixture();
  const secret = 'NEVER_INCLUDE_IN_PUBLIC_SNAPSHOT';
  source.profile.privateNote = secret;
  source.profile.bio.other = secret;
  source.projects[0].privateNote = secret;
  source.projects[0].draft = { title: secret };
  source.projects[0].translations.en.privateNote = secret;
  source.projects.push({ ...source.projects[0], id: secret, published: false });
  const snapshot = publicSnapshot(source);
  assert.equal(snapshot.projects.length, source.projects.length - 1);
  assert.equal(JSON.stringify(snapshot).includes(secret), false);
  assert.equal(snapshot.projects[0].id, 'aipm');
  assert.equal(snapshot.profile.name, source.profile.name);
});
test('public snapshot refuses unpublished local media references', () => {
  const source = fixture();
  source.projects[0].imageId = 'local-runtime-image';
  assert.throws(() => publicSnapshot(source), /Publish media explicitly/);
});
