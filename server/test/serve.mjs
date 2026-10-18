import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createDevelopmentServer } from "../service.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const port = Number(process.env.LIFEOS_PORT || 4392);
if (!Number.isInteger(port) || port < 1 || port > 65535)
  throw new Error("Invalid LIFEOS_PORT");
const server = createDevelopmentServer({ staticDir: resolve(root, "out") });
server.listen(port, "127.0.0.1");
for (const signal of ["SIGINT", "SIGTERM"])
  process.once(signal, () =>
    server.close(() => {
      process.exit(0);
    })
  );
