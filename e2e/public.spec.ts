import { expect, test } from "@playwright/test";

test("public snapshot excludes management fields and local service data", async ({
  request,
}) => {
  const response = await request.get("/content/projects.json");
  expect(response.ok()).toBe(true);
  const projects = (await response.json()) as {
    featured: boolean;
    id: string;
  }[];
  expect(projects.map(({ id }) => id)).toEqual([
    "aipm",
    "videonote",
    "agentero",
    "multica",
    "jobmap",
    "ocrsnip",
    "bililive-recorder-gui",
    "epay-observer-android",
    "neptune-aircon-client",
    "fanfan",
    "epay-go",
    "aris-geo",
    "vertical-hdd-power-mount",
    "idea",
    "agents-guidelines",
    "github-stats",
  ]);
  expect(
    projects.filter(({ featured }) => featured).map(({ id }) => id)
  ).toEqual(["aipm", "videonote", "agentero"]);
  expect(await response.text()).not.toMatch(
    /privateNote|updatedAt|"draft"|"version"|"published"/
  );
  const absentPaths = [
    "/server/content/seed.json",
    "/server/.runtime/key.json",
    "/api/session",
    "/api/admin/projects",
  ];
  const responses = await Promise.all(
    absentPaths.map((path) => request.get(path))
  );
  responses.forEach((missingResponse) =>
    expect(missingResponse.status()).toBe(404)
  );
  expect(
    (
      await request.post("/api/session", { data: { key: "not-a-credential" } })
    ).status()
  ).toBe(501);
  expect((await request.get("/.index/fs.9p.json")).ok()).toBe(true);
  const release = (await (await request.get("/release.json")).json()) as {
    commit: string;
    mode: string;
  };
  expect(release.mode).toBe("visitor");
  expect(release.commit).toMatch(/^[a-f0-9]{40}$/);
});

test("public settings only expose preferences and never request a session", async ({
  page,
}) => {
  const apiRequests: string[] = [];
  page.on("request", (request) => {
    if (new URL(request.url()).pathname.startsWith("/api/")) {
      apiRequests.push(request.url());
    }
  });
  await page.goto("/?app=SystemSettings");
  const settings = page.locator(".hyc-settings");
  await expect(settings.locator('select[name="os-language"]')).toBeVisible();
  await expect(settings.locator("summary")).toHaveCount(0);
  await expect(settings.getByRole("button")).toHaveCount(0);
  await expect(
    settings.getByText(/maintenance|management|Administrator|Visitor/i)
  ).toHaveCount(0);
  await expect(page.locator('input[name="administrator-key"]')).toHaveCount(0);
  await page.locator('select[name="os-language"]').selectOption("zh");
  await expect(
    settings.getByRole("heading", { name: "系统设置" })
  ).toBeVisible();
  await expect(settings.getByText(/维护|管理|访客|密钥/)).toHaveCount(0);
  await page.goto("/?app=Portfolio&project=aipm");
  await expect(
    page.getByRole("heading", { exact: true, name: "AIPM" })
  ).toBeVisible();
  expect(apiRequests).toEqual([]);
});
