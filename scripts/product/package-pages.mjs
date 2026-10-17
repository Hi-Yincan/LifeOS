import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import {
  existsSync,
  readFileSync,
  readdirSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const out = resolve(root, "out");
const site = JSON.parse(
  readFileSync(resolve(root, "personal-site.json"), "utf8")
);
for (const file of [
  "content/profile.json",
  "content/projects.json",
  ".index/fs.9p.json",
]) {
  JSON.parse(readFileSync(resolve(out, file), "utf8"));
}
for (const file of ["server", ".runtime", ".git", "api", "private"])
  assert.equal(existsSync(resolve(out, file)), false, file);
let bytes = 0;
const inspect = (dir) => {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    assert.ok(
      !entry.isSymbolicLink(),
      `Unexpected artifact symlink: ${relative(out, path)}`
    );
    if (entry.isDirectory()) inspect(path);
    else bytes += statSync(path).size;
  }
};
inspect(out);
assert.ok(bytes < 1024 ** 3, "Pages artifact must stay below 1 GiB");
writeFileSync(resolve(out, ".nojekyll"), "");
writeFileSync(resolve(out, "CNAME"), new URL(site.url).hostname + "\n");
const commit = execFileSync("git", ["rev-parse", "HEAD"], {
  cwd: root,
  encoding: "utf8",
}).trim();
const dirty = Boolean(
  execFileSync("git", ["status", "--porcelain"], {
    cwd: root,
    encoding: "utf8",
  }).trim()
);
if (process.env.CI)
  assert.equal(dirty, false, "Publish only committed sources");
writeFileSync(
  resolve(out, "release.json"),
  JSON.stringify(
    {
      commit,
      dirty,
      mode: "visitor",
      builtAt: new Date().toISOString(),
      bytes,
    },
    null,
    2
  ) + "\n"
);
console.log(JSON.stringify({ mode: "visitor", bytes, commit }));
