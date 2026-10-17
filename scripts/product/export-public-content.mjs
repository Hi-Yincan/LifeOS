import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { publicSnapshot } from "./public-content.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
// The committed content fixture is the initial publication source. Never read .runtime.
const source = JSON.parse(
  readFileSync(resolve(root, "server/content/seed.json"), "utf8")
);
const { profile, projects } = publicSnapshot(source);
const target = resolve(root, "public/content");
mkdirSync(target, { recursive: true });
for (const [name, value] of Object.entries({ profile, projects })) {
  writeFileSync(
    resolve(target, `${name}.json`),
    JSON.stringify(value, null, 2) + "\n"
  );
}
console.log(
  `Exported ${projects.length} published projects; no runtime data or credentials included`
);
