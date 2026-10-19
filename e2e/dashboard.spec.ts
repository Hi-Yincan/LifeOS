import { expect, type Locator, type Page, test } from "@playwright/test";

const dashboard = (page: Page): Locator => page.locator(".hyc-dashboard");
const browserErrors = new WeakMap<Page, string[]>();
test.beforeEach(({ page }) => {
  const errors: string[] = [];
  browserErrors.set(page, errors);
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
});
test.afterEach(({ page }) => {
  expect(browserErrors.get(page)).toEqual([]);
});
const openDashboard = async (
  page: Page,
  module = "overview",
  item = ""
): Promise<Locator> => {
  await page.goto(
    `/?app=Dashboard&dashboard=${module}${item ? `&dashboardItem=${item}` : ""}`
  );
  const app = dashboard(page);
  await expect(
    app.getByText("Sample data", { exact: true }).first()
  ).toBeVisible();
  return app;
};
const navigate = async (app: Locator, name: string): Promise<void> => {
  const navigation = app.getByRole("navigation", {
    exact: true,
    name: "Dashboard views",
  });
  if (
    ["Membership dashboard", "Self-hosted services", "Servers"].includes(name)
  ) {
    const group = navigation.getByRole("button", {
      exact: true,
      name: "Services",
    });
    if ((await group.getAttribute("aria-expanded")) !== "true") {
      await group.click();
    }
  }
  await navigation.getByRole("button", { exact: true, name }).click();
};
const setLocale = async (page: Page, locale: "en" | "zh"): Promise<void> => {
  await page.locator('button[aria-label="Start"]').click();
  await page
    .locator('nav[aria-label="Start"]')
    .getByRole("button", { name: /System settings|系统设置/ })
    .click();
  const settings = page.getByRole("dialog", {
    name: /System Settings|System settings|系统设置/,
  });
  await settings.locator('select[name="os-language"]').selectOption(locale);
  await settings
    .getByRole("button", { exact: true, name: /Close|关闭/ })
    .click();
};
const expectReadOnly = async (app: Locator): Promise<void> => {
  await expect(
    app.getByRole("button", {
      name: /^(?:Add sample|Edit|Save|Record sample payment|Review sample payment|Confirm sample|Cancel renewal|Pause renewal|Plan to renew|Reset samples|新增|编辑|保存|记录示例付款|确认示例|取消续费|暂停续费|计划继续续费|重置示例)/,
    })
  ).toHaveCount(0);
  await expect(
    app.getByRole("combobox", {
      name: /Preview|Visibility|预览范围|访客可见性|公开范围/,
    })
  ).toHaveCount(0);
  await expect(
    app
      .locator("summary")
      .filter({ hasText: /Per-item visibility|逐项公开预览/ })
  ).toHaveCount(0);
  await expect(app.getByRole("form")).toHaveCount(0);
};
const expectHealthMetrics = async (
  app: Locator,
  locale: "en" | "zh" = "en"
): Promise<void> => {
  await expect(app.getByRole("article")).toHaveCount(4);
  await expect(app.locator("article h3")).toHaveText(
    locale === "zh"
      ? ["步数", "心率", "睡眠时长", "体重"]
      : ["Steps", "Heart rate", "Sleep duration", "Weight"]
  );
  expect(
    await app
      .getByRole("article")
      .evaluateAll((cards) => cards.map((card) => card.dataset.healthMetric))
  ).toEqual(["steps", "heartRate", "sleep", "weight"]);
  await expect(
    app.getByRole("combobox", { name: /Health metric|健康指标/ })
  ).toHaveCount(0);
};
const expectWorkspaceFits = async (app: Locator): Promise<void> => {
  const gap = await app.evaluate((node) => {
    const workspace = node.querySelector(".dashboard-workspace");
    const footer = node.querySelector(":scope > footer");
    if (!workspace || !footer) throw new Error("Dashboard regions missing");
    return (
      footer.getBoundingClientRect().top -
      workspace.getBoundingClientRect().bottom
    );
  });
  expect(Math.abs(gap)).toBeLessThanOrEqual(1);
  expect(
    await app
      .locator(".dashboard-content")
      .evaluate((node) => node.scrollWidth <= node.clientWidth + 1)
  ).toBe(true);
};

test("Dashboard uses desktop, Start and store entries as a single native window", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  const shortcut = page
    .getByRole("list", { name: "Desktop" })
    .getByRole("button", { exact: true, name: "Dashboard" });
  await shortcut.dblclick();
  const app = dashboard(page);
  await expect(app).toBeVisible();
  const window = page.getByRole("dialog", { exact: true, name: "Dashboard" });
  await window.getByRole("button", { exact: true, name: "Minimize" }).click();
  await shortcut.dblclick();
  await expect(app).toBeVisible();
  await page.locator('button[aria-label="Start"]').click();
  await page
    .locator("#startMenu")
    .getByRole("button", { exact: true, name: "Dashboard" })
    .click();
  await expect(window).toHaveCount(1);
  await page
    .getByRole("list", { name: "Desktop" })
    .getByRole("button", { exact: true, name: "App Store" })
    .dblclick();
  await page
    .locator('.hyc-store-card[data-app="Dashboard"] .hyc-store-launch')
    .click();
  await expect(window).toHaveCount(1);
  await window.getByRole("button", { exact: true, name: "Maximize" }).click();
  await expect(
    window.getByRole("button", { exact: true, name: "Restore" })
  ).toBeVisible();
  await window.getByRole("button", { exact: true, name: "Restore" }).click();
  await expectReadOnly(app);
});

test("overview links, history and missing records preserve independent query fields", async ({
  page,
}) => {
  const app = await openDashboard(page);
  await app.locator("summary").filter({ hasText: "Sample details" }).click();
  await expect(
    app.getByText(
      "All records are fictional. All samples are available to read."
    )
  ).toBeVisible();
  await app.locator("summary").filter({ hasText: "Sample details" }).click();
  const actions = app.getByRole("region", { name: "Upcoming actions" });
  await actions
    .getByRole("button", { exact: true, name: "Memberships" })
    .click();
  await actions
    .getByRole("button", { exact: true, name: "Demo Cinema" })
    .click();
  await expect(page).toHaveURL(
    /dashboard=memberships&dashboardItem=demo-cinema/
  );
  await expect(app.getByRole("heading", { name: "Demo Cinema" })).toBeVisible();
  await page.goBack();
  await expect(
    app.getByRole("heading", { exact: true, name: "Overview" })
  ).toBeVisible();
  await page.goForward();
  await expect(app.getByRole("heading", { name: "Demo Cinema" })).toBeVisible();
  await page.reload();
  await expect(app.getByRole("heading", { name: "Demo Cinema" })).toBeVisible();
  await page.goto(
    "/?app=Dashboard&dashboard=services&dashboardItem=demo-notebook&view=projects&project=aipm"
  );
  await expect(
    app.getByRole("heading", { name: "Demo notebook" })
  ).toBeVisible();
  await navigate(app, "Servers");
  await expect(page).toHaveURL(/view=projects&project=aipm/);
  await page.goto("/?app=Dashboard&dashboard=invalid");
  await expect(
    app.getByText("This view is not recognized. The overview is shown instead.")
  ).toBeVisible();
  await page.goto("/?app=Dashboard&dashboard=services&dashboardItem=missing");
  await expect(
    app.getByText("This sample record does not exist.")
  ).toBeVisible();
  await app.getByRole("button", { name: "Back to list" }).click();
  await expect(
    app.getByRole("searchbox", { name: "Search service names" })
  ).toBeVisible();
});

test("membership filters and all access, renewal and payment records remain readable", async ({
  page,
}) => {
  const app = await openDashboard(page, "memberships");
  const table = app.getByRole("table", { name: "Membership list" });
  await expect(table.locator("tbody tr")).toHaveCount(6);
  await app
    .getByRole("searchbox", { name: "Search memberships" })
    .fill("not-a-member");
  await expect(app.getByText("No matching memberships")).toBeVisible();
  await expect(app.getByRole("button", { name: "Clear filters" })).toHaveCount(
    0
  );
  await app.getByRole("searchbox", { name: "Search memberships" }).fill("");
  await app
    .getByRole("combobox", { exact: true, name: "Category" })
    .selectOption("cloud");
  await expect(table.getByRole("button")).toHaveText(["Demo Cloud"]);
  await app
    .getByRole("combobox", { exact: true, name: "Category" })
    .selectOption("");
  await app
    .getByRole("combobox", { name: "Sort memberships" })
    .selectOption("name");
  await expect(table.getByRole("button")).toHaveText([
    "Demo Archive",
    "Demo Cinema",
    "Demo Cloud",
    "Demo Design",
    "Demo Learning",
    "Demo Notes",
  ]);
  await app
    .getByRole("button", { exact: true, name: "Details: Demo Cinema" })
    .click();
  await expect(app.getByText("Access active", { exact: true })).toBeVisible();
  await expect(
    app.getByText("Renewal planned", { exact: true }).first()
  ).toBeVisible();
  const payments = app.getByRole("table", {
    name: "Confirmed sample payments",
  });
  await expect(payments.locator("tbody tr")).toHaveCount(1);
  await expect(payments).toContainText("CNY 25.00");
  await expectReadOnly(app);
  await app.getByRole("button", { name: "Back to memberships" }).click();
  await app
    .getByRole("button", { exact: true, name: "Details: Demo Design" })
    .click();
  await expect(app.getByRole("heading", { name: "Demo Design" })).toBeVisible();
  await expectReadOnly(app);
});

test("membership currency switches all displayed amounts and keeps a single focus highlight", async ({
  page,
}) => {
  const app = await openDashboard(page, "memberships");
  const currencies = app.getByRole("group", { name: "Display currency" });
  const summary = app.locator("dl").first();
  await expect(
    currencies.getByRole("button", { exact: true, name: "CNY" })
  ).toHaveAttribute("aria-pressed", "true");
  await expect(summary).toContainText("CNY 136.00");
  await expect(summary).toContainText("CNY 957.00");
  await currencies.getByRole("button", { exact: true, name: "USD" }).click();
  await expect(summary).toContainText("USD 18.89");
  await expect(summary).toContainText("USD 132.92");
  await app
    .getByRole("button", { exact: true, name: "Details: Demo Cinema" })
    .click();
  await expect(
    currencies.getByRole("button", { exact: true, name: "USD" })
  ).toHaveAttribute("aria-pressed", "true");
  await expect(
    app.getByRole("table", { name: "Confirmed sample payments" })
  ).toContainText("USD 3.47");
  await app.getByRole("button", { name: "Back to memberships" }).click();
  const cny = currencies.getByRole("button", { exact: true, name: "CNY" });
  await cny.focus();
  await cny.press("Enter");
  await expect(summary).toContainText("CNY 136.00");
  await expect(cny).toBeFocused();
  await expect(cny).toHaveCSS("outline-offset", "-1px");
  const category = app.getByRole("combobox", { exact: true, name: "Category" });
  await category.focus();
  await expect(category).toBeFocused();
  await expect(category).toHaveCSS("outline-style", "none");
  await expect(category).toHaveCSS("border-top-width", "1px");
  await expect(category).toHaveCSS("box-shadow", "none");
  await currencies.getByRole("button", { exact: true, name: "USD" }).click();
  await page.reload();
  await expect(
    currencies.getByRole("button", { exact: true, name: "CNY" })
  ).toHaveAttribute("aria-pressed", "true");
});

test("personal activity, schedules, location and checkups are all available to read", async ({
  page,
}) => {
  const app = await openDashboard(page, "personal");
  await expect(
    app.getByRole("button", { name: "Completing a sample task" })
  ).toBeVisible();
  await app
    .getByRole("combobox", { exact: true, name: "Show" })
    .selectOption("today");
  await expect(
    app.getByRole("button", { name: "Completing a sample task" })
  ).toHaveCount(0);
  await app
    .getByRole("combobox", { exact: true, name: "Show" })
    .selectOption("all");
  await app
    .getByRole("button", { exact: true, name: "Organizing project notes" })
    .click();
  await expect(
    app.getByRole("heading", { name: "Organizing project notes" })
  ).toBeVisible();
  await expectReadOnly(app);
  await app
    .getByRole("button", { exact: true, name: "Walk and break" })
    .click();
  await expect(
    app.getByRole("heading", { name: "Walk and break" })
  ).toBeVisible();
  await expectReadOnly(app);
  await app.getByRole("button", { name: "Location & route" }).click();
  await expect(
    app.getByRole("img", { name: "Synthetic location sequence" })
  ).toBeVisible();
  await expect(
    app.getByText("Demo space B", { exact: true }).first()
  ).toBeVisible();
  await expectReadOnly(app);
  await app
    .getByRole("button", { exact: true, name: "Checkup records" })
    .click();
  await app.getByRole("button", { name: /^Sample blood test ·/ }).click();
  await expect(
    app.getByRole("heading", { name: "Sample blood test" })
  ).toBeVisible();
  await expectReadOnly(app);
});

test("all four health articles share the trend range and retain missing values and source details", async ({
  page,
}) => {
  const app = await openDashboard(page, "personal", "health");
  await expectHealthMetrics(app);
  const steps = app.getByRole("article", { exact: true, name: "Steps" });
  const heart = app.getByRole("article", { exact: true, name: "Heart rate" });
  const sleep = app.getByRole("article", {
    exact: true,
    name: "Sleep duration",
  });
  const weight = app.getByRole("article", { exact: true, name: "Weight" });
  await expect(steps.locator("strong").first()).toHaveText("6,420");
  await expect(heart.locator("strong").first()).toHaveText("72");
  await expect(sleep.locator("strong").first()).toHaveText("7.4");
  await expect(weight.locator("strong").first()).toHaveText("—");
  await expect(weight.getByText("kg", { exact: true })).toBeVisible();
  await expect(
    weight.getByText("No samples in this range; an absent record is not zero.")
  ).toBeVisible();
  await expect(weight.getByRole("img")).toHaveCount(0);
  await steps.locator("summary").filter({ hasText: "View samples" }).click();
  await heart.locator("summary").filter({ hasText: "View samples" }).click();
  await sleep.locator("summary").filter({ hasText: "View samples" }).click();
  await weight.locator("summary").filter({ hasText: "View samples" }).click();
  const stepRows = steps.getByRole("table").locator("tbody tr");
  const heartRows = heart.getByRole("table").locator("tbody tr");
  const sleepRows = sleep.getByRole("table").locator("tbody tr");
  const weightRows = weight.getByRole("table").locator("tbody tr");
  await expect(stepRows).toHaveCount(12);
  await expect(heartRows).toHaveCount(24);
  await expect(sleepRows).toHaveCount(7);
  await expect(weightRows).toHaveCount(0);
  await expect(
    heart.getByRole("table").getByText("Missing sample", { exact: true })
  ).toHaveCount(2);
  await expect(
    steps.getByRole("table").getByText("Missing sample", { exact: true })
  ).toHaveCount(1);
  await app.getByRole("combobox", { name: "Trend range" }).selectOption("day");
  await expectHealthMetrics(app);
  await expect(stepRows).toHaveCount(12);
  await expect(heartRows).toHaveCount(24);
  await expect(sleepRows).toHaveCount(1);
  await expect(weightRows).toHaveCount(0);
  await expect(sleepRows).toContainText("Oct 18, 06:34");
  await app.getByRole("combobox", { name: "Trend range" }).selectOption("all");
  await expect(sleepRows).toHaveCount(7);
  await expect(heartRows).toHaveCount(24);
  await steps
    .locator("summary")
    .filter({ hasText: "Record notes and source" })
    .click();
  await expect(steps.getByText(/Sample goal: 8,000 steps/)).toBeVisible();
  await expect(steps.getByText(/Demo wearable data/)).toBeVisible();
  await expectReadOnly(app);
  await page.goto("/?app=Dashboard&dashboard=personal&dashboardItem=heartRate");
  await expectHealthMetrics(app);
  await page.reload();
  await expectHealthMetrics(app);
});

test("every domain is readable without visibility or mutation controls", async ({
  page,
}) => {
  const app = await openDashboard(page, "services");
  await expect(app.getByRole("slider")).toHaveCount(6);
  await app
    .getByRole("button", { exact: true, name: "Demo internal service" })
    .click();
  await expect(
    app.getByRole("heading", { name: "Demo internal service" })
  ).toBeVisible();
  await expectReadOnly(app);
  await navigate(app, "Servers");
  await expect(
    app
      .getByRole("table", { name: "Host resources and status" })
      .locator("tbody tr")
  ).toHaveCount(4);
  await app.getByRole("button", { name: "View Demo node C details" }).click();
  await expect(app.getByRole("heading", { name: "Demo node C" })).toBeVisible();
  await expectReadOnly(app);
  await navigate(app, "Membership dashboard");
  await expect(
    app.getByRole("table", { name: "Membership list" }).locator("tbody tr")
  ).toHaveCount(6);
  await expectReadOnly(app);
  await navigate(app, "Personal");
  await app.getByRole("button", { exact: true, name: "Daily health" }).click();
  await expectHealthMetrics(app);
  await expectReadOnly(app);
  await app.getByRole("button", { name: "Location & route" }).click();
  await expect(
    app.getByRole("heading", { name: "Route sketch" })
  ).toBeVisible();
  await expectReadOnly(app);
  await app
    .getByRole("button", { exact: true, name: "Checkup records" })
    .click();
  await expect(
    app.getByRole("button", { name: /^Sample blood test ·/ })
  ).toBeVisible();
  await expect(
    app.getByRole("button", { name: /^Sample vision check ·/ })
  ).toBeVisible();
  await expectReadOnly(app);
});

test("retired identity cookies cannot change dashboard content or expose editors", async ({
  context,
  page,
}) => {
  const app = await openDashboard(page, "memberships");
  const readContent = async (): Promise<Record<string, string[]>> => {
    await navigate(app, "Membership dashboard");
    const memberships = await app
      .getByRole("table", { name: "Membership list" })
      .locator("tbody tr")
      .allTextContents();
    await expectReadOnly(app);
    await navigate(app, "Self-hosted services");
    const services = await app
      .getByRole("slider")
      .evaluateAll((nodes) =>
        nodes.map((node) => node.getAttribute("aria-label") || "")
      );
    await expectReadOnly(app);
    await navigate(app, "Servers");
    const servers = await app
      .getByRole("table", { name: "Host resources and status" })
      .locator("tbody tr")
      .allTextContents();
    await expectReadOnly(app);
    await navigate(app, "Personal");
    await app
      .getByRole("button", { exact: true, name: "Daily health" })
      .click();
    await expectHealthMetrics(app);
    const health = await app
      .getByRole("article")
      .evaluateAll((nodes) =>
        nodes.map(
          (node) =>
            `${node.dataset.healthMetric}:${node.querySelector("strong")?.textContent}`
        )
      );
    await expectReadOnly(app);
    return { health, memberships, servers, services };
  };
  const before = await readContent();
  expect(before.memberships).toHaveLength(6);
  expect(before.services).toHaveLength(6);
  expect(before.servers).toHaveLength(4);
  expect(before.health).toEqual([
    "steps:6,420",
    "heartRate:72",
    "sleep:7.4",
    "weight:—",
  ]);
  await context.addCookies([
    {
      name: "hyc_concept_session",
      url: new URL(page.url()).origin,
      value: "synthetic-retired-session",
    },
    { name: "role", url: new URL(page.url()).origin, value: "admin" },
  ]);
  await page.reload();
  await expectHealthMetrics(app);
  expect(await readContent()).toEqual(before);
});

test("service statuses, maintenance records, latency and linked hosts remain readable", async ({
  page,
}) => {
  const app = await openDashboard(page, "services");
  await app
    .getByRole("searchbox", { name: "Search service names" })
    .fill("missing-service");
  await expect(app.getByText("No services match these filters")).toBeVisible();
  await expect(app.getByRole("button", { name: "Clear filters" })).toHaveCount(
    0
  );
  await app.getByRole("searchbox", { name: "Search service names" }).fill("");
  await app
    .getByRole("combobox", { exact: true, name: "Status" })
    .selectOption("pending");
  await app
    .getByRole("button", { exact: true, name: "Demo search service" })
    .click();
  await expect(app.getByText(/not a confirmed outage/)).toBeVisible();
  await app.getByRole("button", { name: "Back to services" }).click();
  await app
    .getByRole("combobox", { exact: true, name: "Status" })
    .selectOption("stale");
  await app.getByRole("button", { exact: true, name: "Demo gallery" }).click();
  await expect(
    app.getByText(/last status does not establish current availability/)
  ).toBeVisible();
  await app.getByRole("button", { name: "Back to services" }).click();
  await app
    .getByRole("combobox", { exact: true, name: "Status" })
    .selectOption("unmonitored");
  await app
    .getByRole("button", { exact: true, name: "Demo internal service" })
    .click();
  await expect(
    app.getByText(/no monitor. No availability result is inferred/)
  ).toBeVisible();
  await app.getByRole("button", { name: "Back to services" }).click();
  await expect(
    app.getByRole("combobox", { exact: true, name: "Status" })
  ).toHaveValue("unmonitored");
  await app
    .getByRole("combobox", { exact: true, name: "Status" })
    .selectOption("all");
  await app.getByRole("button", { exact: true, name: "Demo notebook" }).click();
  await app.getByRole("button", { name: "Last 6 sample hours" }).click();
  await app.locator("summary").filter({ hasText: "View samples" }).click();
  await expect(app.getByRole("table").locator("tbody tr")).toHaveCount(6);
  await app
    .getByRole("region", { name: "Events and maintenance" })
    .locator("summary")
    .click();
  await expect(app.getByText("Sample recovery event")).toBeVisible();
  await expect(app.getByText("No live URL configured")).toBeVisible();
  await expectReadOnly(app);
  await app.getByRole("button", { exact: true, name: "Demo node A" }).click();
  await expect(app.getByRole("heading", { name: "Demo node A" })).toBeVisible();
});

test("server filtering, metric windows and missing observations keep units and links", async ({
  page,
}) => {
  const app = await openDashboard(page, "servers");
  await app.getByRole("searchbox", { name: "Search hosts" }).fill("no-host");
  await expect(app.getByText("No matching hosts")).toBeVisible();
  await app.getByRole("searchbox", { name: "Search hosts" }).fill("");
  await app
    .getByRole("combobox", { name: "Data status" })
    .selectOption("stale");
  await app.getByRole("button", { name: "View Demo node B details" }).click();
  await expect(
    app.getByText(/last reported|last known|Stale/i).first()
  ).toBeVisible();
  await navigate(app, "Servers");
  await expect(app.getByRole("combobox", { name: "Data status" })).toHaveValue(
    "stale"
  );
  await app.getByRole("combobox", { name: "Data status" }).selectOption("all");
  await app.getByRole("button", { name: "View Demo node A details" }).click();
  await app
    .getByRole("combobox", { name: "Trend metric" })
    .selectOption("network");
  await app.getByRole("combobox", { name: "Time range" }).selectOption("24");
  await app.locator("summary").filter({ hasText: "View samples" }).click();
  await expect(app.getByRole("table")).toContainText("bytes/s");
  await expect(app.getByRole("table")).toContainText("Missing sample");
  await expect(app.getByRole("table").locator("tbody tr")).toHaveCount(12);
  await expect(
    app.getByRole("table").locator("tbody tr").first()
  ).toContainText("00:59");
  await app.getByRole("combobox", { name: "Time range" }).selectOption("6");
  await expect(app.getByRole("table").locator("tbody tr")).toHaveCount(6);
  await expect(
    app.getByRole("table").locator("tbody tr").first()
  ).toContainText("06:59");
  await expect(app.getByRole("table").locator("tbody tr").last()).toContainText(
    "11:59"
  );
  await app.getByRole("button", { exact: true, name: "Demo notebook" }).click();
  await expect(
    app.getByRole("heading", { name: "Demo notebook" })
  ).toBeVisible();
});

test("read-only routes survive native close and Portfolio history entries", async ({
  page,
}) => {
  const app = await openDashboard(page);
  await navigate(app, "Membership dashboard");
  await page
    .getByRole("dialog", { exact: true, name: "Dashboard" })
    .getByRole("button", { exact: true, name: "Close" })
    .click();
  await expect(app).toHaveCount(0);
  await page
    .getByRole("list", { name: "Desktop" })
    .getByRole("button", { exact: true, name: "Portfolio" })
    .dblclick();
  await page.getByRole("button", { exact: true, name: "Explore work" }).click();
  await page
    .getByRole("dialog", { exact: true, name: "Portfolio" })
    .getByRole("button", { exact: true, name: "Minimize" })
    .click();
  await page
    .getByRole("list", { name: "Desktop" })
    .getByRole("button", { exact: true, name: "Dashboard" })
    .dblclick();
  await app
    .getByRole("button", { exact: true, name: "Organizing project notes" })
    .click();
  await page.goBack();
  await expect(
    app.getByRole("heading", { name: "Organizing project notes" })
  ).toBeVisible();
  await page.goBack();
  await expect(
    app.getByRole("heading", { exact: true, name: "Membership dashboard" })
  ).toBeVisible();
  await page.goForward();
  await page.goForward();
  await expect(
    app.getByRole("heading", { name: "Organizing project notes" })
  ).toBeVisible();
  await expectReadOnly(app);
});

test("language changes and keyboard navigation preserve all readable health records", async ({
  page,
}) => {
  const app = await openDashboard(page, "personal", "heartRate");
  await expectHealthMetrics(app);
  await setLocale(page, "zh");
  await expectHealthMetrics(app, "zh");
  await expectReadOnly(app);
  await expect(
    app
      .getByRole("article", { exact: true, name: "心率" })
      .locator("strong")
      .first()
  ).toHaveText("72");
  await setLocale(page, "en");
  await expectHealthMetrics(app);
  const navigation = app.getByRole("navigation", {
    exact: true,
    name: "Dashboard views",
  });
  const services = navigation.getByRole("button", {
    exact: true,
    name: "Services",
  });
  await services.focus();
  await expect(services).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(services).toHaveAttribute("aria-expanded", "true");
  const memberships = app
    .getByRole("navigation", { exact: true, name: "Service views" })
    .getByRole("button", { exact: true, name: "Membership dashboard" });
  await memberships.focus();
  await expect(memberships).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(
    app.getByRole("table", { name: "Membership list" }).locator("tbody tr")
  ).toHaveCount(6);
  await setLocale(page, "zh");
  expect(
    await app
      .getByRole("navigation", { name: "看板视图" })
      .locator(":scope > button")
      .evaluateAll((buttons) =>
        buttons.map((button) => button.getAttribute("aria-label"))
      )
  ).toEqual(["总览", "个人", "服务"]);
  const serviceViews = app.getByRole("navigation", {
    exact: true,
    name: "服务视图",
  });
  await expect(serviceViews.getByRole("button")).toHaveCount(3);
  expect(
    await serviceViews
      .getByRole("button")
      .evaluateAll((buttons) =>
        buttons.map((button) => button.getAttribute("aria-label"))
      )
  ).toEqual(["自建服务", "服务器", "会员看板"]);
  await serviceViews
    .getByRole("button", { exact: true, name: "服务器" })
    .click();
  await expect(page).toHaveURL(/dashboard=servers/);
  await serviceViews
    .getByRole("button", { exact: true, name: "自建服务" })
    .click();
  await expect(page).toHaveURL(/dashboard=services/);
  await expect(
    app.getByRole("heading", { exact: true, name: "自建服务" })
  ).toBeVisible();
  await expect(app.locator(".dashboard-address")).toContainText(
    "综合看板 › 服务 › 自建服务"
  );
  await page.goBack();
  await expect(
    app.getByRole("heading", { exact: true, name: "服务器" })
  ).toBeVisible();
  await expectReadOnly(app);
});

test("reading every domain makes no business data requests, sockets or sample storage writes", async ({
  page,
}) => {
  const sockets: string[] = [];
  const requests: string[] = [];
  page.on("websocket", (socket) => sockets.push(socket.url()));
  page.on("request", (request) => {
    if (["fetch", "xhr"].includes(request.resourceType())) {
      requests.push(new URL(request.url()).pathname);
    }
  });
  const app = await openDashboard(page, "personal", "health");
  const stored = await page.evaluate(() => ({
    local: { ...localStorage },
    session: { ...sessionStorage },
  }));
  await app.getByRole("combobox", { name: "Trend range" }).selectOption("day");
  await app.getByRole("button", { name: "Location & route" }).click();
  await app
    .getByRole("button", { exact: true, name: "Checkup records" })
    .click();
  await navigate(app, "Membership dashboard");
  await navigate(app, "Self-hosted services");
  await navigate(app, "Servers");
  expect(
    requests.filter(
      (path) =>
        ![
          "/.index/fs.9p.json",
          "/content/projects.json",
          "/Users/Public/Desktop/desktop.ini",
        ].includes(path)
    )
  ).toEqual([]);
  expect(sockets).toEqual([]);
  expect(
    await page.evaluate(() => ({
      local: { ...localStorage },
      session: { ...sessionStorage },
    }))
  ).toEqual(stored);
  await page.reload();
  await navigate(app, "Personal");
  await app.getByRole("button", { exact: true, name: "Daily health" }).click();
  await expectHealthMetrics(app);
});

test("membership, service and host combined filters survive detail round trips", async ({
  page,
}) => {
  const app = await openDashboard(page, "memberships");
  await app
    .getByRole("searchbox", { name: "Search memberships" })
    .fill("Cinema");
  await app
    .getByRole("combobox", { exact: true, name: "Category" })
    .selectOption("media");
  await app
    .getByRole("combobox", { name: "Sort memberships" })
    .selectOption("name");
  await app
    .getByRole("button", { exact: true, name: "Details: Demo Cinema" })
    .click();
  await app.getByRole("button", { name: "Back to memberships" }).click();
  await expect(
    app.getByRole("searchbox", { name: "Search memberships" })
  ).toHaveValue("Cinema");
  await expect(
    app.getByRole("combobox", { exact: true, name: "Category" })
  ).toHaveValue("media");
  await expect(
    app.getByRole("combobox", { name: "Sort memberships" })
  ).toHaveValue("name");
  await expect(
    app.getByRole("table", { name: "Membership list" }).locator("tbody tr")
  ).toHaveCount(1);
  await navigate(app, "Self-hosted services");
  await app
    .getByRole("searchbox", { name: "Search service names" })
    .fill("notebook");
  await app
    .getByRole("group", { exact: true, name: "Category" })
    .getByRole("button", { exact: true, name: "Productivity" })
    .click();
  await app
    .getByRole("combobox", { exact: true, name: "Status" })
    .selectOption("up");
  await app.getByRole("button", { exact: true, name: "Demo notebook" }).click();
  await app.getByRole("button", { name: "Back to services" }).click();
  await expect(
    app.getByRole("searchbox", { name: "Search service names" })
  ).toHaveValue("notebook");
  await expect(
    app.getByRole("combobox", { exact: true, name: "Status" })
  ).toHaveValue("up");
  await expect(
    app.getByRole("button", { exact: true, name: "Productivity" })
  ).toHaveAttribute("aria-pressed", "true");
  await navigate(app, "Servers");
  await app.getByRole("searchbox", { name: "Search hosts" }).fill("node B");
  await app
    .getByRole("combobox", { exact: true, name: "Host status" })
    .selectOption("up");
  await app
    .getByRole("combobox", { exact: true, name: "Data status" })
    .selectOption("stale");
  await app.getByRole("button", { name: "View Demo node B details" }).click();
  await app.getByRole("button", { name: "Back to hosts" }).click();
  await expect(
    app.getByRole("searchbox", { name: "Search hosts" })
  ).toHaveValue("node B");
  await expect(
    app.getByRole("combobox", { exact: true, name: "Host status" })
  ).toHaveValue("up");
  await expect(
    app.getByRole("combobox", { exact: true, name: "Data status" })
  ).toHaveValue("stale");
  await expect(
    app
      .getByRole("table", { name: "Host resources and status" })
      .locator("tbody tr")
  ).toHaveCount(1);
  await app.getByRole("searchbox", { name: "Search hosts" }).fill("");
  await app
    .getByRole("combobox", { exact: true, name: "Host status" })
    .selectOption("all");
  await app
    .getByRole("combobox", { exact: true, name: "Data status" })
    .selectOption("all");
  await expect(
    app
      .getByRole("table", { name: "Host resources and status" })
      .locator("tbody tr")
  ).toHaveCount(4);
});

test("overview disclosures retain complete costs, actions and source timestamps", async ({
  page,
}) => {
  const app = await openDashboard(page);
  await app
    .locator("summary")
    .filter({ hasText: "Summary definitions and membership costs" })
    .click();
  await expect(app.getByText("CNY 64.00", { exact: true })).toBeVisible();
  await expect(app.getByText("USD 10.00", { exact: true })).toBeVisible();
  const actions = app.getByRole("region", { name: "Upcoming actions" });
  await expect(actions.getByRole("listitem")).toHaveCount(4);
  await actions
    .locator("summary")
    .filter({ hasText: "4 more actions" })
    .click();
  await expect(actions.getByRole("listitem")).toHaveCount(8);
  await app
    .locator("summary")
    .filter({ hasText: "View source statuses and timestamps" })
    .click();
  const source = app
    .locator("summary")
    .filter({ hasText: /^Demo service monitor ·/ });
  await source.click();
  await expect(
    source.locator("..").getByText("Observed (UTC)", { exact: true })
  ).toBeVisible();
  await expect(
    source.locator("..").getByText("Source updated (UTC)", { exact: true })
  ).toBeVisible();
});

test("service health rows preserve 90 UTC days, observed uptime and accessible inspection", async ({
  page,
}) => {
  const app = await openDashboard(page, "services");
  await expect(app.getByRole("slider")).toHaveCount(6);
  const drive = app.getByRole("listitem").filter({
    has: page.getByRole("button", { exact: true, name: "Demo drive" }),
  });
  const slider = drive.getByRole("slider", {
    name: "Demo drive · 90-day health history",
  });
  const days = slider.locator("[data-date]");
  await expect(days).toHaveCount(90);
  await expect(days.first()).toHaveAttribute("data-date", "2026-07-20");
  await expect(days.last()).toHaveAttribute("data-date", "2026-10-17");
  await expect(slider.locator('[data-date="2026-10-18"]')).toHaveCount(0);
  await expect(slider.locator('[data-health="degraded"]')).toHaveCount(3);
  await expect(slider.locator('[data-health="down"]')).toHaveCount(1);
  await expect(slider.locator('[data-health="up"]')).toHaveCount(86);
  const rate = drive.locator('[aria-label="90-day uptime"]');
  await expect(rate).toContainText("Uptime 99.50%");
  await expect(rate).toContainText("Coverage 100.00%");
  await expect(rate.locator("[title]")).toHaveAttribute(
    "title",
    "129600 / 129600 observed / expected checks"
  );
  await expect(slider).toHaveAttribute("tabindex", "0");
  await expect(slider.locator("[tabindex], button")).toHaveCount(0);
  await slider.focus();
  await slider.press("Home");
  await expect(slider).toHaveAttribute("aria-valuenow", "1");
  await expect(slider).toHaveAttribute("aria-valuetext", /2026-07-20 UTC/);
  await slider.press("ArrowRight");
  await expect(slider).toHaveAttribute("aria-valuetext", /2026-07-21 UTC/);
  await slider.press("End");
  await expect(slider).toHaveAttribute("aria-valuenow", "90");
  await expect(slider).toHaveAttribute("aria-valuetext", /2026-10-17 UTC/);
  await expect(slider.locator("..").getByRole("status")).toBeVisible();
  await slider.press("Escape");
  await expect(slider.locator("..").getByRole("status")).toHaveCount(0);
  await slider.press("ArrowLeft");
  await expect(slider.locator("..").getByRole("status")).toContainText(
    "2026-10-16"
  );
  await page.keyboard.press("Tab");
  await expect(
    app.getByRole("button", { exact: true, name: "Demo code service" })
  ).toBeFocused();
  const notebook = app.getByRole("slider", {
    name: "Demo notebook · 90-day health history",
  });
  const partial = notebook.locator('[data-date="2026-08-01"]');
  await expect(partial).toHaveAttribute("data-health", "unknown");
  await partial.hover();
  await expect(notebook).toHaveAttribute(
    "aria-valuetext",
    /2026-08-01 UTC · Missing samples.*720\/720.*Coverage 720\/1440/
  );
  const pending = app.getByRole("listitem").filter({
    has: page.getByRole("button", {
      exact: true,
      name: "Demo search service",
    }),
  });
  await expect(pending.locator('[data-health="unknown"]')).toHaveCount(90);
  await expect(pending.locator('[aria-label="90-day uptime"]')).toContainText(
    "Uptime —"
  );
  await expect(pending.locator('[aria-label="90-day uptime"]')).toContainText(
    "Coverage 0.00%"
  );
  await app
    .locator("summary")
    .filter({ hasText: "90-day health history" })
    .click();
  await expect(app.getByText(/Missing checks are excluded/)).toBeVisible();
  await expect(
    app.getByText(/Gray: no checks or incomplete healthy coverage/)
  ).toBeVisible();
  await drive.getByRole("button", { exact: true, name: "Demo drive" }).click();
  await expect(app.locator('[aria-label="90-day uptime"]')).toContainText(
    "Uptime 99.50%"
  );
  await expect(app.locator('[aria-label="90-day uptime"]')).toContainText(
    "Coverage 100.00%"
  );
  await expect(app.getByRole("slider").locator("[data-date]")).toHaveCount(90);
  await app.getByRole("button", { name: "Last 6 sample hours" }).click();
  await app.locator("summary").filter({ hasText: "View samples" }).click();
  await expect(app.getByRole("table").locator("tbody tr")).toHaveCount(6);
  await app.getByRole("button", { name: "Last 12 sample hours" }).click();
  await expect(app.getByRole("table").locator("tbody tr")).toHaveCount(12);
});

test.describe("service health touch inspection", () => {
  test.use({ hasTouch: true, viewport: { height: 844, width: 390 } });
  test("touch selects a day and remains readable in Chinese at 390px", async ({
    page,
  }, testInfo) => {
    const app = await openDashboard(page, "services");
    const slider = app.getByRole("slider", {
      name: "Demo drive · 90-day health history",
    });
    await slider.scrollIntoViewIfNeeded();
    const bounds = await slider.boundingBox();
    if (!bounds) throw new Error("Health history bounds missing");
    await slider.tap({
      position: { x: (bounds.width * 30.5) / 90, y: bounds.height / 2 },
    });
    await expect(slider).toHaveAttribute("aria-valuenow", "31");
    await expect(slider).toHaveAttribute(
      "aria-valuetext",
      /2026-08-19 UTC · Failed checks/
    );
    await expect(slider.locator("..").getByRole("status")).toContainText(
      "Coverage 1440/1440"
    );
    await setLocale(page, "zh");
    const chinese = app.getByRole("slider", {
      name: "演示文件服务 · 90 日健康历史",
    });
    await chinese.scrollIntoViewIfNeeded();
    await chinese.tap({ position: { x: 1, y: 10 } });
    await expect(chinese).toHaveAttribute(
      "aria-valuetext",
      /2026-07-20 UTC · 正常/
    );
    await expect(chinese.locator("..").getByRole("status")).toBeVisible();
    const row = app.getByRole("listitem").filter({
      has: page.getByRole("slider", { name: "演示文件服务 · 90 日健康历史" }),
    });
    await expect(row.locator('[aria-label="90 日可用率"]')).toContainText(
      "可用率 99.50%"
    );
    await expectWorkspaceFits(app);
    await expectReadOnly(app);
    await page.screenshot({
      path: testInfo.outputPath("services-health-touch-390-zh.png"),
    });
  });
});

test("checkup filters recover through the original selector without clear buttons", async ({
  page,
}) => {
  const app = await openDashboard(page, "personal", "checkups");
  const type = app.getByRole("combobox", { name: "Checkup type" });
  await type.selectOption("blood");
  await expect(
    app.getByRole("button", { name: /^Sample blood test ·/ })
  ).toBeVisible();
  await expect(
    app.getByRole("button", { name: /^Sample vision check ·/ })
  ).toHaveCount(0);
  await type.selectOption("general");
  await expect(app.getByText("No matching checkup records")).toBeVisible();
  await expect(
    app.getByRole("button", { name: /^Clear filters?$/ })
  ).toHaveCount(0);
  await type.selectOption("all");
  await expect(
    app.getByRole("button", { name: /^Sample blood test ·/ })
  ).toBeVisible();
  await expect(
    app.getByRole("button", { name: /^Sample vision check ·/ })
  ).toBeVisible();
  await setLocale(page, "zh");
  await app.getByRole("combobox", { name: "检查类型" }).selectOption("general");
  await expect(app.getByText("没有符合条件的检查记录")).toBeVisible();
  await expect(app.getByRole("button", { name: "清除筛选" })).toHaveCount(0);
  await app.getByRole("combobox", { name: "检查类型" }).selectOption("all");
  await expect(
    app.getByRole("button", { name: /^血常规示例 ·/ })
  ).toBeVisible();
  await expectReadOnly(app);
});

test("vertical navigation and all health articles adapt to a native 520px window", async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ height: 900, width: 1440 });
  const app = await openDashboard(page, "personal");
  const window = page.locator(".react-draggable").filter({ has: app });
  const before = await window.boundingBox();
  if (!before) throw new Error("Dashboard window bounds missing");
  await page.mouse.move(
    before.x + before.width - 1,
    before.y + before.height / 2
  );
  await page.mouse.down();
  await page.mouse.move(before.x + 520, before.y + before.height / 2, {
    steps: 12,
  });
  await page.mouse.up();
  await expect
    .poll(async () => (await window.boundingBox())?.width)
    .toBeGreaterThanOrEqual(515);
  await expect
    .poll(async () => (await window.boundingBox())?.width)
    .toBeLessThanOrEqual(525);
  expect(await page.evaluate(() => innerWidth)).toBe(1440);
  await expectWorkspaceFits(app);
  const boxes = await app
    .getByRole("navigation", { exact: true, name: "Dashboard views" })
    .locator(":scope > button")
    .evaluateAll((buttons) =>
      buttons.map((button) => {
        const { x, y } = button.getBoundingClientRect();
        return { x, y };
      })
    );
  expect(boxes).toHaveLength(3);
  expect(
    boxes.every(
      (box, index) =>
        Math.abs(box.x - boxes[0].x) < 1 &&
        (index === 0 || box.y > boxes[index - 1].y)
    )
  ).toBe(true);
  const subnav = app.getByRole("navigation", {
    exact: true,
    name: "Personal views",
  });
  await expect(subnav.getByRole("button")).toHaveCount(4);
  const health = subnav.getByRole("button", {
    exact: true,
    name: "Daily health",
  });
  await health.focus();
  await expect(health).toBeFocused();
  await page.keyboard.press("Enter");
  await expectHealthMetrics(app);
  await expect(health).toHaveAttribute("aria-current", "page");
  const cards = await app.getByRole("article").evaluateAll((nodes) =>
    nodes.map((node) => ({
      x: node.getBoundingClientRect().x,
      y: node.getBoundingClientRect().y,
    }))
  );
  expect(cards[0].x).toBe(cards[1].x);
  expect(cards[1].y).toBeGreaterThan(cards[0].y);
  await expectWorkspaceFits(app);
  await setLocale(page, "zh");
  await expectHealthMetrics(app, "zh");
  await app
    .getByRole("article", { exact: true, name: "体重" })
    .scrollIntoViewIfNeeded();
  await page.screenshot({
    path: testInfo.outputPath("all-health-native-520-zh.png"),
  });
  await app.getByRole("button", { exact: true, name: "位置与轨迹" }).click();
  await expect(app.getByRole("heading", { name: "路线示意" })).toBeVisible();
  await expectWorkspaceFits(app);
  await setLocale(page, "en");
  await expect(
    app.getByRole("button", { exact: true, name: "Location & route" })
  ).toHaveAttribute("aria-current", "page");
});

for (const viewport of [
  { height: 844, width: 390 },
  { height: 768, width: 1024 },
  { height: 900, width: 1440 },
]) {
  test(`readable metrics and charts fit the native layout at ${viewport.width}px`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize(viewport);
    const app = await openDashboard(page, "servers", "demo-node-a");
    await app
      .getByRole("combobox", { name: "Trend metric" })
      .selectOption("memory");
    await expectWorkspaceFits(app);
    const chart = app.locator("svg[role=img]");
    await chart.scrollIntoViewIfNeeded();
    await expect(chart).toBeVisible();
    expect(
      await chart.evaluate((node) => node.getBoundingClientRect().width)
    ).toBeGreaterThan(viewport.width === 390 ? 200 : 500);
    await navigate(app, "Membership dashboard");
    await expect(
      app.getByRole("table", { name: "Membership list" }).locator("tbody tr")
    ).toHaveCount(6);
    await expectWorkspaceFits(app);
    await navigate(app, "Personal");
    await app
      .getByRole("button", { exact: true, name: "Daily health" })
      .click();
    await expectHealthMetrics(app);
    await expectWorkspaceFits(app);
    const cards = await app.getByRole("article").evaluateAll((nodes) =>
      nodes.map((node) => ({
        x: node.getBoundingClientRect().x,
        y: node.getBoundingClientRect().y,
      }))
    );
    expect(cards[1].x === cards[0].x).toBe(viewport.width === 390);
    expect(cards[1].x > cards[0].x).toBe(viewport.width !== 390);
    expect(cards[1].y > cards[0].y).toBe(viewport.width === 390);
    expect(cards[1].y === cards[0].y).toBe(viewport.width !== 390);
    if (viewport.width === 390) await setLocale(page, "zh");
    await expectHealthMetrics(app, viewport.width === 390 ? "zh" : "en");
    await expectReadOnly(app);
    await page.screenshot({
      path: testInfo.outputPath(`all-health-${viewport.width}.png`),
    });
  });
}
