import { expect, type Locator, type Request, test } from "@playwright/test";

const expectNoManagement = async (scope: Locator): Promise<void> => {
  await expect(
    scope.getByRole("button", {
      name: /^(?:Enter management|New project|Edit project|Save draft|Publish saved version|Unpublish|Sign out|Manage content|Management|进入管理|新建作品|编辑作品|保存草稿|发布已保存版本|下架|退出管理|内容管理|管理模式)$/,
    })
  ).toHaveCount(0);
  await expect(
    scope.locator(
      'input[type="password"], input[name="administrator-key"], .hyc-editor, .hyc-maintenance, input[name="project-title"]'
    )
  ).toHaveCount(0);
  await expect(
    scope.locator("summary").filter({ hasText: /Site maintenance|站点维护/ })
  ).toHaveCount(0);
  await expect(
    scope.getByText(
      /^(?:Administrator|Visitor|Management|管理员|访客|管理模式)$/
    )
  ).toHaveCount(0);
};

test("plain visits show the desktop; portfolio remains opt-in", async ({
  page,
}) => {
  await page.goto("/");
  const shortcut = page.getByRole("button", { exact: true, name: "Portfolio" });
  await expect(shortcut).toBeVisible();
  await expect(page).toHaveTitle("Yincan Huang");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await shortcut.dblclick();
  await expect(page.getByRole("dialog", { name: "Portfolio" })).toBeVisible();
  await expect(
    page.getByRole("heading", { exact: true, name: "Yincan Huang" })
  ).toBeVisible();
  await page.goto("/");
  await expect(shortcut).toBeVisible();
  await expect(page.getByRole("dialog")).toHaveCount(0);
});

test("portfolio project links load public content", async ({ page }) => {
  await page.goto("/?app=Portfolio&project=aipm");
  await expect(
    page.getByRole("heading", { exact: true, name: "AIPM" })
  ).toBeVisible();
  await expect(page.getByRole("link", { name: "View source" })).toHaveAttribute(
    "href",
    /github\.com/
  );
});

test("portfolio categories toggle independently of search", async ({
  page,
}) => {
  await page.goto("/?app=Portfolio");
  await expect(page.locator(".hyc-project-card h3")).toHaveText([
    "AIPM",
    "VideoNote-MCP",
    "Agentero",
  ]);
  await expect(
    page.locator('.hyc-project-card[href$="project=multica"]')
  ).toHaveCount(0);
  await expect(page.locator(".hyc-collection h2 .hyc-count")).toHaveText("03");
  await page.getByRole("button", { exact: true, name: "Explore work" }).click();
  const cards = page.locator(".hyc-project-card");
  const categories = page.locator(".hyc-segments button");
  const selected = page.locator('.hyc-segments [aria-pressed="true"]');
  await expect(categories).toHaveText([
    "Products",
    "Tools",
    "Contributions",
    "Other",
  ]);
  await expect(selected).toHaveCount(0);
  await expect(cards).toHaveCount(16);
  /* eslint-disable no-await-in-loop -- 同一页面的筛选与取消操作必须顺序验证。 */
  for (const [index, titles] of [
    [0, ["AIPM", "JobMap"]],
    [
      1,
      [
        "VideoNote-MCP",
        "ocrsnip",
        "BililiveRecorder GUI",
        "EPay Observer Android",
        "Neptune Aircon Client",
      ],
    ],
    [
      2,
      [
        "Agentero",
        "Multica",
        "FanFan",
        "epay-go",
        "ARIS · Geoscience extensions",
      ],
    ],
    [3, ["Vertical HDD Power Mount", "idea", "AGENTS.md", "GitHub Stats"]],
  ] as const) {
    await categories.nth(index).click();
    await expect(selected).toHaveCount(1);
    await expect(cards.locator("h3")).toHaveText([...titles]);
    await categories.nth(index).press("Enter");
    await expect(selected).toHaveCount(0);
    await expect(cards).toHaveCount(16);
  }
  /* eslint-enable no-await-in-loop */
  await categories.nth(0).click();
  await categories.nth(1).click();
  await expect(selected).toHaveCount(1);
  await expect(cards).toHaveCount(5);
  await page
    .getByRole("textbox", { name: "Search projects or technology" })
    .fill("AIPM");
  await expect(cards).toHaveCount(0);
  await categories.nth(1).click();
  await expect(cards.locator("h3")).toHaveText(["AIPM"]);
  await categories.nth(1).click();
  await page.getByRole("button", { exact: true, name: "All work" }).click();
  await expect(selected).toHaveCount(0);
  await expect(cards).toHaveCount(16);
});

test("store defaults to all and toggles its three categories", async ({
  page,
}) => {
  await page.goto("/?app=AppStore");
  const cards = page.locator(".hyc-store-card");
  const categories = page.locator(".hyc-segments button");
  await expect(cards).toHaveCount(31);
  await expect(categories).toHaveText([
    "System software",
    "Application software",
    "Third-party",
  ]);
  await expect(page.locator('.hyc-segments [aria-pressed="true"]')).toHaveCount(
    0
  );
  await categories.nth(0).click();
  await expect(cards).toHaveCount(28);
  await categories.nth(1).click();
  await expect(cards).toHaveCount(3);
  await expect(
    page.locator('.hyc-store-card[data-app="AppStore"]')
  ).toBeVisible();
  await expect(
    page.locator('.hyc-store-card[data-app="Dashboard"]')
  ).toBeVisible();
  await categories.nth(1).click();
  await expect(cards).toHaveCount(31);
  await page.getByRole("textbox", { name: "Search apps" }).fill("Paint");
  await expect(cards).toHaveCount(1);
  await categories.nth(1).click();
  await expect(cards).toHaveCount(0);
  await categories.nth(1).click();
  await expect(cards).toHaveCount(1);
});

for (const [appId, appTitle] of [
  ["Emulator", "Emulator"],
  ["JSDOS", "js-dos v7"],
  ["Marked", "Marked"],
  ["OpenType", "OpenType"],
  ["PDF", "PDF"],
  ["Photos", "Photos"],
  ["Ruffle", "Ruffle"],
  ["V86", "Virtual x86"],
  ["VideoPlayer", "Video Player"],
]) {
  test(`store opens file app ${appId} from its card and details`, async ({
    page,
  }) => {
    await page.goto("/?app=AppStore");
    const card = page.locator(`.hyc-store-card[data-app="${appId}"]`);
    await card.locator(".hyc-store-launch").click();
    const app = page.getByRole("dialog", { exact: true, name: appTitle });
    await expect(app).toBeVisible();
    await expect(
      page.getByRole("dialog", { exact: true, name: "My PC" })
    ).toHaveCount(0);
    await app.getByRole("button", { exact: true, name: "Close" }).click();
    await expect(app).toHaveCount(0);
    await card.getByRole("button", { name: `Details: ${appTitle}` }).click();
    await page.locator(".hyc-store-detail .hyc-primary").click();
    await expect(app).toBeVisible();
    await expect(app).toHaveCSS("opacity", "1");
    await expect(
      page.getByRole("dialog", { exact: true, name: "My PC" })
    ).toHaveCount(0);
  });
}

test("Start keeps settings and Power without folder shortcuts", async ({
  page,
}) => {
  await page.goto("/");
  await page.locator('button[aria-label="Start"]').click();
  const sidebar = page.locator('nav[aria-label="Start"]');
  await expect(sidebar.getByRole("button")).toHaveCount(4);
  await expect(
    sidebar.getByRole("button", { name: "System settings" })
  ).toBeVisible();
  await expect(sidebar.getByRole("button", { name: "Power" })).toBeVisible();
  await expect(
    sidebar.getByRole("button", { name: /Documents|Pictures|Videos/ })
  ).toHaveCount(0);
  await sidebar.getByRole("button", { name: "System settings" }).click();
  await expect(page.locator('select[name="os-language"]')).toBeVisible();
  await page.locator('select[name="os-language"]').selectOption("zh");
  await expect(page).toHaveTitle("系统设置 - Yincan Huang");
});

test("native Paint and file browser still load", async ({ page }) => {
  await page.goto("/?app=Paint");
  await expect(
    page.getByRole("dialog", { name: "Untitled - Paint" })
  ).toBeVisible();
  await expect(page.frameLocator("iframe").getByRole("menubar")).toBeVisible();
  await page.goto("/?app=FileExplorer");
  await expect(page.getByRole("dialog", { name: "My PC" })).toBeVisible();
});

test("site metadata uses the owner identity and old assets stay absent", async ({
  page,
  request,
}) => {
  await page.goto("/");
  await expect(page.locator('link[rel="icon"]')).toHaveAttribute(
    "href",
    "/System/LifeOS/favicon-48.png"
  );
  await expect(page.locator('meta[property="og:url"]')).toHaveAttribute(
    "content",
    "https://hyc.ac"
  );
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
    "content",
    "https://hyc.ac/System/LifeOS/avatar.png"
  );
  expect((await request.get("/favicon.ico")).status()).toBe(404);
  expect((await request.get("/screenshot.png")).status()).toBe(404);
  expect((await request.get("/rss.xml")).status()).toBe(404);
  expect((await request.get("/api/admin/projects")).status()).toBe(404);
});

test("retired browser identity keeps the same portfolio and cannot reveal management", async ({
  context,
  page,
}) => {
  const reads: Request[] = [];
  page.on("request", (request) => {
    if (["fetch", "xhr"].includes(request.resourceType())) reads.push(request);
  });
  await page.goto("/?app=Portfolio&view=projects");
  const portfolio = page.locator(".hyc-portfolio");
  const cards = portfolio.locator(".hyc-project-card h3");
  await expect(cards).toHaveCount(16);
  const titles = await cards.allTextContents();
  await expectNoManagement(portfolio);
  await context.addCookies([
    {
      name: "hyc_concept_session",
      url: new URL(page.url()).origin,
      value: "synthetic-retired-session",
    },
    { name: "role", url: new URL(page.url()).origin, value: "admin" },
  ]);
  await page.reload();
  await expect(cards).toHaveText(titles);
  await expectNoManagement(portfolio);
  await portfolio.locator('a[href="/?app=Portfolio&project=aipm"]').click();
  await expect(portfolio.getByRole("heading", { name: "AIPM" })).toBeVisible();
  await expectNoManagement(portfolio);
  await page.goto("/?app=SystemSettings");
  const settings = page.locator(".hyc-settings");
  await expect(settings.locator('select[name="os-language"]')).toBeVisible();
  await expectNoManagement(settings);
  await settings.locator('select[name="os-language"]').selectOption("zh");
  await expect(
    settings.getByRole("heading", { name: "系统设置" })
  ).toBeVisible();
  await expectNoManagement(settings);
  expect(
    (await context.cookies()).find(({ name }) => name === "hyc_concept_session")
      ?.value
  ).toBe("synthetic-retired-session");
  expect(
    reads.filter((request) =>
      /\/api\/(?:session|admin)(?:\/|$)/.test(new URL(request.url()).pathname)
    )
  ).toHaveLength(0);
  const contentReads = reads.filter((request) =>
    /\/(?:api|content)\/(?:projects|profile)(?:\.json)?$/.test(
      new URL(request.url()).pathname
    )
  );
  expect(contentReads.length).toBeGreaterThanOrEqual(4);
  expect(
    [
      ...new Set(
        contentReads.map((request) => new URL(request.url()).pathname)
      ),
    ].sort()
  ).toEqual(
    process.env.PUBLIC_DEPLOYMENT
      ? ["/content/profile.json", "/content/projects.json"]
      : ["/api/profile", "/api/projects"]
  );
  const headers = await Promise.all(
    contentReads.map((request) => request.allHeaders())
  );
  expect(contentReads.every((request) => request.method() === "GET")).toBe(
    true
  );
  expect(
    headers.every((value) => !value.cookie && !value["x-csrf-token"])
  ).toBe(true);
});

test("retired endpoints reject old credentials and never change public content", async ({
  request,
}) => {
  const paths = process.env.PUBLIC_DEPLOYMENT
    ? ["/content/projects.json", "/content/profile.json"]
    : ["/api/projects", "/api/profile"];
  const readSnapshot = async (
    path: string,
    headers: Record<string, string> = {}
  ): Promise<unknown> => {
    const response = await request.get(path, { headers });
    expect(response.status()).toBe(200);
    return (await response.json()) as unknown;
  };
  const before = await Promise.all(paths.map((path) => readSnapshot(path)));
  const oldIdentity = {
    Authorization: "Bearer synthetic-retired-credential",
    Cookie: "hyc_concept_session=synthetic-retired-session; role=admin",
    "X-CSRF-Token": "synthetic-retired-csrf",
    "X-Role": "admin",
  };
  const claimed = await Promise.all(
    paths.map((path) => readSnapshot(path, oldIdentity))
  );
  expect(claimed).toEqual(before);
  expect(JSON.stringify(claimed)).not.toMatch(
    /privateNote|updatedAt|"draft"|"version"|"published"/
  );
  const attempts = await Promise.all(
    ["GET", "HEAD", "POST", "PATCH", "DELETE"].flatMap((method) =>
      [
        "/api/session",
        "/api/admin",
        "/api/admin/projects",
        "/api/admin/projects/aipm",
        "/api/admin/projects/aipm/publish",
        "/api/admin/projects/aipm/unpublish",
        "/api/admin/projects/aipm/image",
      ].map(async (path) => ({
        method,
        response: await request.fetch(path, {
          headers: oldIdentity,
          method,
          ...(["GET", "HEAD"].includes(method)
            ? {}
            : {
                data: {
                  key: "synthetic-retired-credential",
                  role: "admin",
                  version: 1,
                },
              }),
        }),
      }))
    )
  );
  for (const { method, response } of attempts) {
    expect(response.status()).toBe(
      process.env.PUBLIC_DEPLOYMENT && !["GET", "HEAD"].includes(method)
        ? 501
        : 404
    );
    expect(response.headers()["set-cookie"]).toBeUndefined();
  }
  const after = await Promise.all(paths.map((path) => readSnapshot(path)));
  expect(after).toEqual(before);
});
