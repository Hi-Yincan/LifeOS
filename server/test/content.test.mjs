import test from "node:test";
import assert from "node:assert/strict";
import { once } from "node:events";
import { METHODS, request } from "node:http";
import {
  existsSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  readlinkSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createDevelopmentServer } from "../service.mjs";

const seed = () =>
  JSON.parse(
    readFileSync(new URL("../content/seed.json", import.meta.url), "utf8")
  );
const clone = (value) => JSON.parse(JSON.stringify(value));
const privateMarker = "SYNTHETIC_PRIVATE_VALUE_DO_NOT_PUBLISH";
const png = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aGncAAAAASUVORK5CYII=",
  "base64"
);
const oldIdentity = {
  Authorization: "Bearer synthetic-retired-credential",
  Cookie: `hyc_concept_session=${"a".repeat(64)}; role=admin`,
  "X-CSRF-Token": "synthetic-retired-csrf",
  "X-Role": "admin",
};
const runtimeContent = () => {
  const original = seed();
  const published = {
    ...clone(original.projects[0]),
    id: "published-example",
    imageId: null,
    imageUrl: "/media/private.png",
    privateNote: privateMarker,
    source: privateMarker,
  };
  published.translations.en.privateNote = privateMarker;
  published.translations.other = { title: privateMarker };
  const profile = clone(original.profile);
  profile.privateNote = privateMarker;
  profile.bio.other = privateMarker;
  return {
    profile,
    projects: [
      {
        id: published.id,
        published,
        version: 7,
        updatedAt: privateMarker,
        draft: {
          ...clone(published),
          translations: { en: { title: privateMarker } },
        },
      },
      {
        id: "draft-only",
        published: null,
        draft: {
          id: "draft-only",
          privateNote: privateMarker,
          imageId: "deadbeef.png",
        },
      },
    ],
  };
};
const treeSnapshot = (directory) => {
  if (!existsSync(directory)) return null;
  return Object.fromEntries(
    readdirSync(directory)
      .sort()
      .map((name) => {
        const filename = join(directory, name);
        const info = lstatSync(filename);
        const content = info.isSymbolicLink()
          ? { link: readlinkSync(filename) }
          : info.isDirectory()
            ? treeSnapshot(filename)
            : {
                bytes: readFileSync(filename).toString("base64"),
                mode: info.mode,
                modified: info.mtimeMs,
              };
        return [name, content];
      })
  );
};

async function fixture(t, options = {}) {
  const directory = mkdtempSync(join(tmpdir(), "lifeos-readonly-test-"));
  const dataDir = join(directory, "runtime", "data");
  const staticDir = join(directory, "out");
  if (options.content) {
    mkdirSync(dataDir, { recursive: true });
    writeFileSync(
      join(dataDir, "content.json"),
      JSON.stringify(options.content)
    );
  }
  for (const [id, bytes] of Object.entries(options.images ?? {})) {
    mkdirSync(join(dataDir, "images"), { recursive: true });
    writeFileSync(join(dataDir, "images", id), bytes);
  }
  if (options.static) {
    mkdirSync(staticDir, { recursive: true });
    writeFileSync(join(staticDir, "index.html"), "<h1>Static fixture</h1>");
    writeFileSync(join(staticDir, "app.css"), "body { color: white; }");
  }
  options.prepare?.({ directory, dataDir, staticDir });
  const settings = {
    dataDir,
    staticDir: options.static ? staticDir : undefined,
  };
  // 旧凭据参数即使由调用方提供，也不能被服务读取。
  Object.defineProperties(settings, {
    key: {
      get() {
        throw new Error("Legacy key was read");
      },
    },
    secureCookies: {
      get() {
        throw new Error("Legacy session option was read");
      },
    },
  });
  const server = createDevelopmentServer(settings);
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  t.after(async () => {
    await new Promise((resolve) => server.close(resolve));
    rmSync(directory, { recursive: true, force: true });
  });
  const base = `http://127.0.0.1:${server.address().port}`;
  const call = (path, { method = "GET", headers = {}, body } = {}) =>
    new Promise((resolve, reject) => {
      const finish = (response, chunks) => {
        const bytes = Buffer.concat(chunks);
        const text = bytes.toString();
        const data =
          text &&
          response.headers["content-type"]?.startsWith("application/json")
            ? JSON.parse(text)
            : text;
        resolve({
          status: response.statusCode,
          headers: response.headers,
          data,
          text,
          bytes,
        });
      };
      const payload = body === undefined ? undefined : JSON.stringify(body);
      const req = request(base + path, {
        method,
        headers: {
          "Content-Type": "application/json",
          ...(payload === undefined
            ? {}
            : { "Content-Length": Buffer.byteLength(payload) }),
          ...headers,
        },
      });
      req.on("response", (response) => {
        const chunks = [];
        response.on("data", (chunk) => chunks.push(chunk));
        response.on("end", () => finish(response, chunks));
        response.on("error", reject);
      });
      req.on("connect", (response, socket, head) => {
        const chunks = [head];
        socket.on("data", (chunk) => chunks.push(chunk));
        socket.on("end", () => finish(response, chunks));
        socket.on("error", reject);
        socket.resume();
      });
      req.on("error", (error) => {
        error.message = `${method} ${path}: ${error.message}`;
        reject(error);
      });
      req.end(payload);
    });
  return { call, directory, dataDir, staticDir };
}

test("seed reads keep curated bilingual content and never create runtime files", async (t) => {
  const { call, directory, dataDir } = await fixture(t);
  const before = treeSnapshot(directory);
  const result = await call("/api/projects");
  assert.equal(result.status, 200);
  assert.equal(result.data.length, 16);
  assert.deepEqual(
    ["project", "tool", "contribution", "other"].map(
      (kind) => result.data.filter((item) => item.kind === kind).length
    ),
    [2, 5, 5, 4]
  );
  assert.deepEqual(
    result.data.filter((item) => item.featured).map((item) => item.id),
    ["aipm", "videonote", "agentero"]
  );
  assert.equal(
    result.data.find((item) => item.id === "multica").featured,
    false
  );
  for (const item of result.data) {
    assert.ok(item.translations.zh.title && item.translations.en.title);
    assert.equal("privateNote" in item, false);
    assert.equal("version" in item, false);
  }
  assert.equal((await call("/api/profile")).status, 200);
  assert.equal((await call("/api/projects/aipm", { method: "HEAD" })).text, "");
  assert.equal(existsSync(dataDir), false);
  assert.deepEqual(treeSnapshot(directory), before);
});

test("existing content exposes only published project and nested profile whitelists", async (t) => {
  const source = runtimeContent();
  const { call } = await fixture(t, { content: source });
  const list = await call("/api/projects");
  const profile = await call("/api/profile");
  const detail = await call("/api/projects/published-example");
  assert.equal(list.status, 200);
  assert.equal(list.data.length, 1);
  assert.deepEqual(detail.data, list.data[0]);
  assert.equal((await call("/api/projects/draft-only")).status, 404);
  assert.equal(
    JSON.stringify([list.data, profile.data]).includes(privateMarker),
    false
  );
  assert.deepEqual(Object.keys(profile.data).sort(), [
    "bio",
    "education",
    "email",
    "github",
    "headline",
    "name",
  ]);
  assert.deepEqual(Object.keys(profile.data.bio).sort(), ["en", "zh"]);
  assert.deepEqual(Object.keys(detail.data).sort(), [
    "accent",
    "featured",
    "id",
    "imageUrl",
    "kind",
    "order",
    "repository",
    "technology",
    "translations",
    "video",
    "website",
  ]);
  assert.deepEqual(Object.keys(detail.data.translations).sort(), ["en", "zh"]);
  assert.deepEqual(Object.keys(detail.data.translations.en).sort(), [
    "background",
    "contribution",
    "detail",
    "summary",
    "title",
  ]);
  assert.equal(detail.data.imageUrl, null);
});

test("every supported HTTP method receives 404 at retired session and admin paths", async (t) => {
  const { call, directory } = await fixture(t, { content: runtimeContent() });
  const before = treeSnapshot(directory);
  for (const method of METHODS) {
    for (const path of [
      "/api/session",
      "/api/session/",
      "/api/admin",
      "/api/admin/projects",
      "/api/admin/projects/published-example",
      "/api/admin/projects/published-example/publish",
      "/api/admin/projects/published-example/unpublish",
      "/api/admin/projects/published-example/image",
      "/api/%61dmin/projects",
    ]) {
      const result = await call(path, {
        method,
        headers: { ...oldIdentity, Origin: "https://untrusted.example" },
        body: ["GET", "HEAD", "CONNECT"].includes(method)
          ? undefined
          : {
              role: "admin",
              key: "synthetic-test-only",
              version: 7,
              base64: png.toString("base64"),
            },
      });
      assert.equal(result.status, 404, `${method} ${path}`);
      assert.equal(result.headers["set-cookie"], undefined);
      if (method !== "HEAD")
        assert.deepEqual(result.data, { error: "NOT_FOUND" });
    }
  }
  assert.deepEqual(treeSnapshot(directory), before);
});

test("retired cookies, forged roles and authorization never alter public reads", async (t) => {
  const source = runtimeContent();
  source.projects[0].published.imageId = "aabbcc.png";
  const { call } = await fixture(t, {
    content: source,
    images: { "aabbcc.png": png },
  });
  for (const path of [
    "/api/profile",
    "/api/projects",
    "/api/projects/published-example",
    "/media/aabbcc.png",
  ]) {
    const anonymous = await call(path);
    assert.equal(anonymous.status, 200);
    for (const headers of [
      oldIdentity,
      { Cookie: "role=admin", "X-Role": "admin" },
      { Authorization: "Bearer synthetic-token" },
    ]) {
      const identified = await call(path, { headers });
      assert.equal(identified.status, anonymous.status);
      assert.deepEqual(identified.bytes, anonymous.bytes);
      assert.equal(identified.headers["set-cookie"], undefined);
    }
  }
});

test("all write requests leave files and reads unchanged", async (t) => {
  const source = runtimeContent();
  source.projects[0].published.imageId = "aabbcc.png";
  const { call, directory } = await fixture(t, {
    content: source,
    static: true,
    images: { "aabbcc.png": png },
    prepare: ({ dataDir }) =>
      writeFileSync(
        join(dataDir, "key.json"),
        "SYNTHETIC_INVALID_JSON_NOT_A_CREDENTIAL"
      ),
  });
  const before = treeSnapshot(directory);
  const beforeRead = await call("/api/projects");
  for (const method of ["POST", "PUT", "PATCH", "DELETE", "OPTIONS", "TRACE"]) {
    for (const path of [
      "/api/profile",
      "/api/projects",
      "/api/projects/published-example",
      "/media/aabbcc.png",
      "/index.html",
      "/app.css",
    ]) {
      const result = await call(path, {
        method,
        headers: oldIdentity,
        body: { profile: privateMarker, published: true, role: "admin" },
      });
      assert.equal(result.status, 404, `${method} ${path}`);
      assert.equal(result.headers["set-cookie"], undefined);
    }
  }
  assert.deepEqual((await call("/api/projects")).data, beforeRead.data);
  assert.deepEqual(treeSnapshot(directory), before);
});

test("only referenced, valid published images are served, including HEAD", async (t) => {
  const source = runtimeContent();
  const images = {
    "aabbcc.png": png,
    "aabbcc.jpg": Buffer.from([255, 216, 255, 224]),
    "aabbcc.webp": Buffer.from("RIFF0000WEBPtest"),
    "bad.png": Buffer.from("not an image"),
    "deadbeef.png": png,
    "faded.png": png,
  };
  for (const [index, id] of [
    "aabbcc.png",
    "aabbcc.jpg",
    "aabbcc.webp",
    "bad.png",
    "abc.png",
    "def.png",
  ].entries()) {
    const published = {
      ...clone(source.projects[0].published),
      id: `published-${index}`,
      imageId: id,
    };
    source.projects.push({ id: published.id, published, draft: {} });
  }
  const { call } = await fixture(t, {
    content: source,
    images,
    prepare: ({ dataDir, directory }) => {
      const outside = join(directory, "private-image.png");
      writeFileSync(outside, png);
      symlinkSync(outside, join(dataDir, "images", "abc.png"));
      mkdirSync(join(dataDir, "images", "def.png"));
    },
  });
  for (const [id, type] of [
    ["aabbcc.png", "image/png"],
    ["aabbcc.jpg", "image/jpeg"],
    ["aabbcc.webp", "image/webp"],
  ]) {
    const image = await call(`/media/${id}`);
    assert.equal(image.status, 200);
    assert.equal(image.headers["content-type"], type);
    assert.equal(image.headers["cache-control"], "no-store");
    assert.deepEqual(image.bytes, images[id]);
    const head = await call(`/media/${id}`, { method: "HEAD" });
    assert.equal(head.status, 200);
    assert.equal(head.text, "");
  }
  for (const id of [
    "deadbeef.png",
    "faded.png",
    "bad.png",
    "abc.png",
    "def.png",
    "aabbcc.svg",
    "%2e%2e%2fcontent.json",
  ]) {
    assert.equal(
      (await call(`/media/${id}`, { headers: oldIdentity })).status,
      404,
      id
    );
  }
});

test("media directories cannot redirect published references to private files", async (t) => {
  const source = runtimeContent();
  source.projects[0].published.imageId = "aabbcc.png";
  const { call } = await fixture(t, {
    content: source,
    prepare: ({ dataDir, directory }) => {
      const outside = join(directory, "private-media");
      mkdirSync(outside);
      writeFileSync(join(outside, "aabbcc.png"), png);
      symlinkSync(outside, join(dataDir, "images"));
    },
  });
  assert.equal((await call("/media/aabbcc.png")).status, 404);
});

test("static preview retains GET and HEAD while blocking outside files and retired route fallback", async (t) => {
  const { call, directory } = await fixture(t, {
    static: true,
    prepare: ({ directory: target, staticDir }) => {
      writeFileSync(join(target, "private.txt"), privateMarker);
      symlinkSync(join(target, "private.txt"), join(staticDir, "outside.txt"));
      mkdirSync(join(staticDir, "api", "session"), { recursive: true });
      writeFileSync(
        join(staticDir, "api", "session", "index.html"),
        "retired fallback"
      );
    },
  });
  const before = treeSnapshot(directory);
  assert.equal((await call("/")).text, "<h1>Static fixture</h1>");
  const css = await call("/app.css");
  assert.equal(css.status, 200);
  assert.equal(css.headers["content-type"], "text/css");
  assert.equal(css.headers["cross-origin-embedder-policy"], "credentialless");
  const head = await call("/app.css", { method: "HEAD" });
  assert.equal(head.status, 200);
  assert.equal(head.text, "");
  for (const path of [
    "/outside.txt",
    "/..%2fprivate.txt",
    "/api/session",
    "/api/session/",
    "/api/unknown",
    "/app.css%00",
  ])
    assert.equal((await call(path)).status, 404, path);
  assert.equal((await call("/%ZZ")).status, 400);
  assert.equal(
    (await call("/api/profile", { headers: { Host: "untrusted.example" } }))
      .status,
    421
  );
  assert.deepEqual(treeSnapshot(directory), before);
});

test("an existing empty data directory remains empty after seed reads", async (t) => {
  const { call, dataDir } = await fixture(t, {
    prepare: ({ dataDir: target }) => mkdirSync(target, { recursive: true }),
  });
  assert.equal((await call("/api/projects")).status, 200);
  assert.deepEqual(readdirSync(dataDir), []);
});

test("invalid stored content fails explicitly without fallback or repairs", (t) => {
  const directory = mkdtempSync(join(tmpdir(), "lifeos-readonly-invalid-"));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  const booleanPublished = runtimeContent();
  booleanPublished.projects[0].published = true;
  const malformedPublicField = runtimeContent();
  malformedPublicField.profile.bio.en = { privateNote: privateMarker };
  const invalidMedia = runtimeContent();
  invalidMedia.projects[0].published.imageId = "../private.png";
  for (const [index, content] of [
    "{",
    JSON.stringify(booleanPublished),
    JSON.stringify(malformedPublicField),
    JSON.stringify(invalidMedia),
  ].entries()) {
    const dataDir = join(directory, String(index));
    mkdirSync(dataDir);
    writeFileSync(join(dataDir, "content.json"), content);
    const before = treeSnapshot(dataDir);
    assert.throws(() => createDevelopmentServer({ dataDir }));
    assert.deepEqual(treeSnapshot(dataDir), before);
  }
  const linked = join(directory, "linked");
  mkdirSync(linked);
  symlinkSync(
    join(directory, "0", "content.json"),
    join(linked, "content.json")
  );
  assert.throws(
    () => createDevelopmentServer({ dataDir: linked }),
    /INVALID_CONTENT_FILE/
  );
});
