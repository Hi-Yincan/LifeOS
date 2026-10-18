import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createDevelopmentServer } from "./service.mjs";

const root = dirname(fileURLToPath(import.meta.url));
const runtime = resolve(root, ".runtime");
const port = Number(process.env.LIFEOS_PORT || 4392);
if (!Number.isInteger(port) || port < 1 || port > 65535)
  throw new Error("Invalid LIFEOS_PORT");
const staticDir = resolve(root, "../out");
if (!existsSync(resolve(staticDir, "index.html")))
  throw new Error("Run yarn build first");
const server = createDevelopmentServer({
  dataDir: resolve(runtime, "data"),
  staticDir,
});
server.listen(port, "127.0.0.1", () =>
  console.log(`Read-only local preview: http://127.0.0.1:${port}`)
);
for (const signal of ["SIGINT", "SIGTERM"])
  process.once(signal, () => server.close(() => process.exit(0)));
