import http from "node:http";
import { lstatSync, readFileSync, realpathSync, statSync } from "node:fs";
import { dirname, extname, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(fileURLToPath(import.meta.url));
const seed = JSON.parse(
  readFileSync(resolve(root, "content/seed.json"), "utf8")
);
const locales = ["zh", "en"];
const imagePattern = /^[a-f\d-]+\.(png|jpg|webp)$/;
const imageTypes = {
  ".jpg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
};
const staticTypes = {
  ...imageTypes,
  ".css": "text/css",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".js": "text/javascript",
  ".json": "application/json",
  ".mp3": "audio/mpeg",
  ".mp4": "video/mp4",
  ".svg": "image/svg+xml",
  ".txt": "text/plain; charset=utf-8",
  ".wasm": "application/wasm",
  ".woff2": "font/woff2",
  ".xml": "application/xml; charset=utf-8",
};
const requireObject = (value) => {
  if (value === null || typeof value !== "object" || Array.isArray(value))
    throw new Error("INVALID_PUBLIC_CONTENT");
  return value;
};
const pickText = (value, fields) => {
  requireObject(value);
  return Object.fromEntries(
    fields.map((field) => {
      if (typeof value[field] !== "string")
        throw new Error("INVALID_PUBLIC_CONTENT");
      return [field, value[field]];
    })
  );
};
const publicProfile = (value) => {
  const profile = pickText(value, ["name", "email", "github"]);
  for (const field of ["headline", "bio", "education"])
    profile[field] = pickText(value[field], locales);
  return profile;
};
const publicProject = (value) => {
  const project = pickText(value, [
    "id",
    "kind",
    "accent",
    "repository",
    "website",
    "video",
  ]);
  if (
    !/^[\w-]+$/.test(project.id) ||
    !["project", "tool", "contribution", "other"].includes(project.kind) ||
    !Number.isInteger(value.order) ||
    !Array.isArray(value.technology) ||
    value.technology.some((item) => typeof item !== "string") ||
    (value.featured !== undefined && typeof value.featured !== "boolean")
  )
    throw new Error("INVALID_PUBLIC_CONTENT");
  for (const field of ["repository", "website", "video"]) {
    if (project[field] && !/^https:\/\//.test(project[field]))
      throw new Error("INVALID_PUBLIC_URL");
  }
  requireObject(value.translations);
  project.translations = Object.fromEntries(
    locales.map((locale) => [
      locale,
      pickText(value.translations[locale], [
        "title",
        "summary",
        "background",
        "contribution",
        "detail",
      ]),
    ])
  );
  if (
    value.imageId !== undefined &&
    value.imageId !== null &&
    (typeof value.imageId !== "string" || !imagePattern.test(value.imageId))
  )
    throw new Error("INVALID_PUBLIC_MEDIA");
  project.order = value.order;
  project.technology = [...value.technology];
  project.featured = value.featured === true;
  project.imageUrl = value.imageId ? `/media/${value.imageId}` : null;
  return project;
};

const readPublishedContent = (dataDir) => {
  let source = seed;
  let stored = false;
  if (dataDir) {
    const filename = resolve(dataDir, "content.json");
    try {
      // 不跟随内容文件符号链接，不读取同目录的密钥或会话文件。
      if (!lstatSync(filename).isFile())
        throw new Error("INVALID_CONTENT_FILE");
      source = JSON.parse(readFileSync(filename, "utf8"));
      stored = true;
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
    }
  }
  requireObject(source);
  if (!Array.isArray(source.projects))
    throw new Error("INVALID_PUBLIC_CONTENT");
  const media = new Set();
  const projects = [];
  for (const entry of source.projects) {
    requireObject(entry);
    let published;
    if (stored) {
      if (entry.published === null || entry.published === false) continue;
      published = requireObject(entry.published);
      if (published.id !== entry.id)
        throw new Error("INVALID_PUBLISHED_SNAPSHOT");
    } else {
      if (entry.published !== true) continue;
      published = entry;
    }
    projects.push(publicProject(published));
    if (stored && published.imageId) media.add(published.imageId);
  }
  return {
    media,
    profile: publicProfile(source.profile),
    projects: projects.sort((a, b) => a.order - b.order),
  };
};

const inside = (base, filename) =>
  filename === base || filename.startsWith(base + sep);
const staticFile = (staticDir, pathname) => {
  const base = resolve(staticDir);
  let filename = resolve(base, `.${pathname}`);
  if (!inside(base, filename)) return undefined;
  try {
    if (statSync(filename).isDirectory())
      filename = resolve(filename, "index.html");
    const canonical = realpathSync(filename);
    if (!inside(realpathSync(base), canonical) || !statSync(canonical).isFile())
      return undefined;
    return canonical;
  } catch (error) {
    if (["ENOENT", "ENOTDIR"].includes(error.code)) return undefined;
    throw error;
  }
};
const publicImage = (dataDir, id) => {
  if (!dataDir) return undefined;
  const filename = resolve(dataDir, "images", id);
  try {
    const info = lstatSync(filename);
    if (!info.isFile() || info.size > 3_000_000) return undefined;
    if (realpathSync(filename) !== resolve(realpathSync(dataDir), "images", id))
      return undefined;
    const bytes = readFileSync(filename);
    const extension = extname(id);
    const valid =
      (extension === ".png" &&
        bytes
          .subarray(0, 8)
          .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) ||
      (extension === ".jpg" &&
        bytes[0] === 255 &&
        bytes[1] === 216 &&
        bytes[2] === 255) ||
      (extension === ".webp" &&
        bytes.toString("ascii", 0, 4) === "RIFF" &&
        bytes.toString("ascii", 8, 12) === "WEBP");
    return valid ? bytes : undefined;
  } catch (error) {
    if (["ENOENT", "ENOTDIR"].includes(error.code)) return undefined;
    throw error;
  }
};

export function createDevelopmentServer({ dataDir, staticDir } = {}) {
  // 启动时只投影已发布数据；运行期间不创建目录、不写文件、不建立会话。
  const data = readPublishedContent(dataDir);
  const send = (res, status, body) => {
    res.writeHead(status, {
      "Cache-Control": "no-store",
      "Content-Type": "application/json; charset=utf-8",
      "X-Content-Type-Options": "nosniff",
    });
    res.end(JSON.stringify(body));
  };
  const notFound = (res) => send(res, 404, { error: "NOT_FOUND" });
  const server = http.createServer((req, res) => {
    try {
      const port = server.address().port;
      if (
        ![`127.0.0.1:${port}`, `localhost:${port}`].includes(req.headers.host)
      )
        return send(res, 421, { error: "INVALID_HOST" });
      const url = new URL(req.url, `http://${req.headers.host}`);
      let path;
      try {
        path = decodeURIComponent(url.pathname);
      } catch {
        return send(res, 400, { error: "INVALID_PATH" });
      }
      if (path.includes("\0")) return notFound(res);
      if (
        path === "/api/session" ||
        path.startsWith("/api/session/") ||
        path === "/api/admin" ||
        path.startsWith("/api/admin/") ||
        !["GET", "HEAD"].includes(req.method)
      )
        return notFound(res);
      if (path === "/api/profile") return send(res, 200, data.profile);
      if (path === "/api/projects") return send(res, 200, data.projects);
      if (/^\/api\/projects\/[^/]+$/.test(path)) {
        const found = data.projects.find(
          (item) => item.id === path.split("/")[3]
        );
        return found ? send(res, 200, found) : notFound(res);
      }
      if (path.startsWith("/media/")) {
        const id = path.slice(7);
        if (!imagePattern.test(id) || !data.media.has(id)) return notFound(res);
        const bytes = publicImage(dataDir, id);
        if (!bytes) return notFound(res);
        res.writeHead(200, {
          "Cache-Control": "no-store",
          "Content-Type": imageTypes[extname(id)],
          "X-Content-Type-Options": "nosniff",
        });
        return req.method === "HEAD" ? res.end() : res.end(bytes);
      }
      if (path.startsWith("/api/") || !staticDir) return notFound(res);
      const asset = staticFile(staticDir, path);
      if (!asset) return notFound(res);
      res.writeHead(200, {
        "Cache-Control": "no-cache",
        "Content-Type":
          staticTypes[extname(asset)] ?? "application/octet-stream",
        "Cross-Origin-Embedder-Policy": "credentialless",
        "Cross-Origin-Opener-Policy": "same-origin",
        "X-Content-Type-Options": "nosniff",
      });
      return req.method === "HEAD" ? res.end() : res.end(readFileSync(asset));
    } catch {
      return send(res, 500, { error: "SERVER_ERROR" });
    }
  });
  // CONNECT 不进入普通请求回调；同样拒绝，不建立代理隧道。
  server.on("connect", (_req, socket) => {
    const body = JSON.stringify({ error: "NOT_FOUND" });
    socket.end(
      `HTTP/1.1 404 Not Found\r\nConnection: close\r\nContent-Type: application/json; charset=utf-8\r\nContent-Length: ${Buffer.byteLength(body)}\r\n\r\n${body}`
    );
  });
  return server;
}
