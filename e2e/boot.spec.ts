import { expect, test } from "@playwright/test";

test("startup paints before application scripts and styles arrive", async ({
  page,
}, testInfo) => {
  const { promise: blocked, resolve: release } = Promise.withResolvers<void>();
  await page.route("**/_next/static/**", async (route) => {
    await blocked;
    await route.continue();
  });
  await page.goto("/", { waitUntil: "commit" });
  const boot = page.locator("#lifeos-boot");
  await expect(boot).toBeVisible();
  await expect(page.getByRole("status")).toHaveText("Starting up…");
  await expect(page.locator("#lifeos-root")).toHaveAttribute("inert", "");
  await expect(page.getByRole("navigation", { name: "Taskbar" })).toHaveCount(
    0
  );
  expect(
    await boot.locator("svg").evaluate((el) => el.getBoundingClientRect().width)
  ).toBe(56);
  await page.screenshot({ path: testInfo.outputPath("startup-desktop.png") });
  release();
  await expect(boot).toBeHidden({ timeout: 20000 });
  await expect(
    page.getByRole("button", { exact: true, name: "Portfolio" })
  ).toBeVisible();
  await expect(page.getByRole("dialog")).toHaveCount(0);
});

test("startup stays within an iPad viewport and enters as soon as resources arrive", async ({
  page,
}, testInfo) => {
  const { promise: blocked, resolve: release } = Promise.withResolvers<void>();
  await page.setViewportSize({ height: 1024, width: 768 });
  await page.route("**/_next/static/**", async (route) => {
    await blocked;
    await route.continue();
  });
  await page.goto("/", { waitUntil: "commit" });
  await expect(page.locator("#lifeos-boot")).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath("startup-ipad.png") });
  expect(
    await page.locator("#lifeos-boot").evaluate((el) => el.scrollWidth)
  ).toBe(768);
  release();
  await expect(page.locator("#lifeos-boot")).toBeHidden({ timeout: 20000 });
});

test("startup waits for the desktop icon download", async ({ page }) => {
  const { promise: blocked, resolve: release } = Promise.withResolvers<void>();
  await page.route("**/System/LifeOS/avatar.png", async (route) => {
    await blocked;
    await route.continue();
  });
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect(page.locator("#lifeos-boot-status")).toHaveText(
    "Preparing desktop…"
  );
  await expect(page.locator("#lifeos-root")).toHaveAttribute(
    "aria-hidden",
    "true"
  );
  await page.keyboard.press("Shift+Escape");
  await expect(page.locator("#startMenu")).toHaveCount(0);
  release();
  await expect(page.locator("#lifeos-boot")).toBeHidden({ timeout: 20000 });
  await expect(page.locator("#lifeos-root")).not.toHaveAttribute("inert");
  await page.getByRole("button", { exact: true, name: "Portfolio" }).dblclick();
  await expect(page.getByRole("dialog", { name: "Portfolio" })).toBeVisible();
});

test("application styles remain required after scripts initialize the desktop", async ({
  page,
}) => {
  const { promise: blocked, resolve: release } = Promise.withResolvers<void>();
  await page.route("**/_next/static/css/**", async (route) => {
    await blocked;
    await route.continue();
  });
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect(page.locator('[data-boot-icon-ready="true"]')).toHaveCount(6);
  await expect(page.locator("#clock")).toBeAttached();
  await expect(page.locator("#lifeos-boot-status")).toHaveText("Starting up…");
  await expect(page.locator("#lifeos-root")).toHaveAttribute("inert", "");
  release();
  await expect(page.locator("#lifeos-boot")).toBeHidden({ timeout: 20000 });
});

test("startup waits for the wallpaper worker to render", async ({ page }) => {
  const { promise: blocked, resolve: release } = Promise.withResolvers<void>();
  let workerRequests = 0;
  await page.addInitScript(() => {
    const NativeWorker = window.Worker;
    window.Worker = class extends NativeWorker {
      public constructor(scriptURL: string | URL, options?: WorkerOptions) {
        const url = new URL(scriptURL, location.href);
        if (options?.name === "Wallpaper (Galaxy)") {
          url.searchParams.set("boot-worker", "wallpaper");
        }
        super(url, options);
      }
    };
  });
  await page.route("**/*boot-worker=wallpaper", async (route) => {
    workerRequests += 1;
    await blocked;
    await route.continue();
  });
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect(page.locator("#lifeos-boot-status")).toHaveText(
    "Loading wallpaper…"
  );
  expect(workerRequests).toBeGreaterThan(0);
  release();
  await expect(page.locator("#lifeos-boot")).toBeHidden({ timeout: 20000 });
  await expect(
    page.locator('main > canvas[aria-hidden="true"]')
  ).toBeAttached();
});

test("failed application resources keep the gate closed and allow reload", async ({
  page,
}) => {
  await page.route("**/_next/static/chunks/pages/index-*.js", (route) =>
    route.abort()
  );
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("status")).toContainText("could not load");
  await expect(page.locator("#lifeos-root")).toHaveAttribute("inert", "");
  await page.unroute("**/_next/static/chunks/pages/index-*.js");
  await page.getByRole("link", { exact: true, name: "Reload" }).focus();
  await page.keyboard.press("Enter");
  await expect(page.locator("#lifeos-boot")).toBeHidden({ timeout: 20000 });
});

test("long waits offer recovery without opening an unfinished desktop", async ({
  page,
}) => {
  const { promise: blocked, resolve: release } = Promise.withResolvers<void>();
  await page.clock.install();
  await page.route("**/_next/static/**", async (route) => {
    await blocked;
    await route.continue();
  });
  await page.goto("/", { waitUntil: "commit" });
  await expect(page.locator("#lifeos-boot")).toBeVisible();
  await page.clock.fastForward(21000);
  await expect(page.getByRole("status")).toContainText(
    "Still loading resources"
  );
  await expect(page.locator("#lifeos-boot")).toBeVisible();
  await expect(
    page.getByRole("link", { exact: true, name: "Reload" })
  ).toBeVisible();
  await expect(page.locator("#lifeos-root")).toHaveAttribute(
    "aria-hidden",
    "true"
  );
  release();
  await page.unrouteAll({ behavior: "wait" });
});

test.describe("Chinese startup and reduced motion", () => {
  test.use({
    locale: "zh-CN",
    reducedMotion: "reduce",
    viewport: { height: 844, width: 390 },
  });

  test("uses saved language immediately and fits a phone", async ({
    page,
  }, testInfo) => {
    const { promise: blocked, resolve: release } =
      Promise.withResolvers<void>();
    await page.addInitScript(() =>
      localStorage.setItem(
        "hyc.preferences.v1",
        JSON.stringify({ language: "zh" })
      )
    );
    await page.route("**/_next/static/**", async (route) => {
      await blocked;
      await route.abort();
    });
    await page.goto("/", { waitUntil: "commit" });
    await expect(page.getByRole("status")).toHaveText("正在启动系统…");
    expect(
      await page
        .locator(".boot-dots i")
        .first()
        .evaluate((el) => getComputedStyle(el).animationName)
    ).toBe("none");
    expect(
      await page.locator("#lifeos-boot").evaluate((el) => el.scrollWidth)
    ).toBe(390);
    await page.screenshot({
      path: testInfo.outputPath("startup-phone.png"),
    });
    release();
    await expect(page.getByRole("status")).toContainText("启动资源加载失败");
    await expect(page.getByRole("link", { name: "重新加载" })).toBeVisible();
  });
});

test("missing pages show their error page without a startup gate", async ({
  page,
}) => {
  await page.goto("/404.html");
  await expect(page.locator("#lifeos-boot")).toHaveCount(0);
});

test("startup also completes with main-thread wallpaper and clock rendering", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Reflect.deleteProperty(window, "OffscreenCanvas");
  });
  await page.goto("/");
  await expect(page.locator("#lifeos-boot")).toBeHidden({ timeout: 20000 });
  await expect(page.locator("#clock")).toContainText(/\d+:\d+/);
  await expect(
    page.locator('main > canvas[aria-hidden="true"]')
  ).toBeAttached();
});

test("deep-linked windows regain native focus after startup", async ({
  page,
}) => {
  await page.goto("/?app=Dashboard&dashboard=personal&dashboardItem=heartRate");
  await expect(page.locator("#lifeos-boot")).toBeHidden({ timeout: 20000 });
  const dashboard = page.getByRole("dialog", {
    exact: true,
    name: "Dashboard",
  });
  await expect(dashboard).toBeFocused();
  await page.getByRole("button", { exact: true, name: "Start" }).click();
  await page
    .locator('nav[aria-label="Start"]')
    .getByRole("button", { name: "System settings" })
    .click();
  const settings = page.getByRole("dialog", {
    exact: true,
    name: "System settings",
  });
  await settings.locator('select[name="os-language"]').selectOption("zh");
  await page
    .getByRole("dialog", { exact: true, name: "系统设置" })
    .getByRole("button", { exact: true, name: "关闭" })
    .click();
  await expect(
    page.getByRole("dialog", { exact: true, name: "系统设置" })
  ).toHaveCount(0);
});
