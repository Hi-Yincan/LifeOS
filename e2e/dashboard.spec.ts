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
  await app
    .getByRole("navigation", { name: "Dashboard views" })
    .getByRole("button", { exact: true, name })
    .click();
};
const answerDialog = async (
  page: Page,
  accept: boolean,
  action: () => Promise<unknown>
): Promise<void> => {
  const event = page.waitForEvent("dialog");
  const pending = action();
  const dialog = await event;
  expect(dialog.type()).toBe("confirm");
  await (accept ? dialog.accept() : dialog.dismiss());
  await pending;
};
const editActivity = async (app: Locator, title: string): Promise<void> => {
  await app.getByRole("button", { name: "Edit sample activity" }).click();
  await app.getByRole("textbox", { exact: true, name: "Title" }).fill(title);
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
  const card = page.locator('.hyc-store-card[data-app="Dashboard"]');
  await card.locator(".hyc-store-launch").click();
  await expect(window).toHaveCount(1);
  await expect(app).toBeVisible();
  await window.getByRole("button", { exact: true, name: "Maximize" }).click();
  await expect(
    window.getByRole("button", { exact: true, name: "Restore" })
  ).toBeVisible();
  await window.getByRole("button", { exact: true, name: "Restore" }).click();
});

test("overview filters and links preserve independent Dashboard and Portfolio query fields", async ({
  page,
}) => {
  const app = await openDashboard(page);
  await app.locator("summary").filter({ hasText: "Sample details" }).click();
  await expect(app.getByText(/All records are fictional/)).toBeVisible();
  await app.locator("summary").filter({ hasText: "Sample details" }).click();
  const actions = app.getByRole("region", { name: "Upcoming actions" });
  await actions
    .getByRole("button", { exact: true, name: "Memberships" })
    .click();
  await expect(
    actions.getByRole("button", { exact: true, name: "Demo Cinema" })
  ).toBeVisible();
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
    app.getByText("This record is not available in the current preview.")
  ).toBeVisible();
  await app.getByRole("button", { name: "Back to list" }).click();
  await expect(
    app.getByRole("searchbox", { name: "Search service names" })
  ).toBeVisible();
});

test("membership filters, sample edits and explicit payment/renewal decisions remain separate", async ({
  page,
}) => {
  const app = await openDashboard(page, "memberships");
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
  await expect(
    app.getByRole("button", { name: "Details: Demo Cloud" })
  ).toBeVisible();
  await expect(
    app.getByRole("button", { name: "Details: Demo Cinema" })
  ).toHaveCount(0);
  await app
    .getByRole("combobox", { exact: true, name: "Category" })
    .selectOption("");
  await app
    .getByRole("combobox", { name: "Sort memberships" })
    .selectOption("name");
  await expect(
    app.getByRole("table", { name: "Membership list" }).getByRole("button")
  ).toHaveText([
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
  await app.getByRole("button", { exact: true, name: "Edit sample" }).click();
  await app
    .getByRole("textbox", { exact: true, name: "Name (English)" })
    .fill("Discarded cinema");
  await app.getByRole("button", { exact: true, name: "Cancel" }).click();
  await app.getByRole("button", { name: "Keep editing" }).click();
  await expect(
    app.getByRole("textbox", { exact: true, name: "Name (English)" })
  ).toHaveValue("Discarded cinema");
  await app.getByRole("button", { exact: true, name: "Cancel" }).click();
  await app.getByRole("button", { name: "Discard changes" }).click();
  await expect(app.getByRole("heading", { name: "Demo Cinema" })).toBeVisible();
  const payments = app.getByRole("table", {
    name: "Confirmed sample payments",
  });
  await expect(payments.locator("tbody tr")).toHaveCount(1);
  await app
    .getByRole("button", { exact: true, name: "Cancel renewal" })
    .click();
  await app.getByRole("button", { name: "Confirm sample change" }).click();
  await expect(app.getByText("Access active", { exact: true })).toBeVisible();
  await expect(
    app.getByText("Renewal cancelled", { exact: true }).first()
  ).toBeVisible();
  await expect(payments.locator("tbody tr")).toHaveCount(1);
  await app.getByRole("button", { name: "Record sample payment" }).click();
  await app.getByRole("textbox", { name: "Amount per payment" }).fill("12.34");
  await app.getByRole("button", { name: "Review sample payment" }).click();
  await expect(
    app.getByRole("button", { name: "Confirm sample payment" })
  ).toBeVisible();
  await app.getByRole("button", { name: "Confirm sample payment" }).click();
  await expect(payments.locator("tbody tr")).toHaveCount(2);
  await expect(payments).toContainText("12.34");
  await expect(app.getByText("Access active", { exact: true })).toBeVisible();
  await app.getByRole("button", { exact: true, name: "Edit sample" }).click();
  await app
    .getByRole("textbox", { exact: true, name: "Name (English)" })
    .fill("Window cinema");
  await app.getByRole("button", { exact: true, name: "Save sample" }).click();
  await expect(
    app.getByRole("heading", { name: "Window cinema" })
  ).toBeVisible();
  await navigate(app, "Overview");
  await navigate(app, "Memberships");
  await expect(
    app.getByRole("button", { name: "Details: Window cinema" })
  ).toBeVisible();
  await app.getByRole("button", { name: "Add sample membership" }).click();
  await app.getByRole("button", { exact: true, name: "Save sample" }).click();
  await expect(app.getByRole("alert")).toContainText(
    "Enter a name in both Chinese and English."
  );
  await app
    .getByRole("textbox", { exact: true, name: "Name (English)" })
    .fill("New demo");
  await app
    .getByRole("textbox", { exact: true, name: "Name (Chinese)" })
    .fill("新增演示");
  await app.getByRole("button", { exact: true, name: "Save sample" }).click();
  await app
    .getByRole("button", { exact: true, name: "Details: New demo" })
    .click();
  await expect(app.getByRole("heading", { name: "New demo" })).toBeVisible();
});

test("personal records, local route sketch, health gaps and visibility rules work in memory", async ({
  page,
}) => {
  const app = await openDashboard(page, "personal");
  await app
    .getByRole("combobox", { exact: true, name: "Show" })
    .selectOption("today");
  await expect(
    app.getByRole("button", { name: "Completing a sample task" })
  ).toHaveCount(0);
  await app
    .getByRole("button", { exact: true, name: "Organizing project notes" })
    .click();
  await editActivity(app, "Edited activity");
  await app.getByRole("button", { exact: true, name: "Save sample" }).click();
  await expect(
    app.getByRole("heading", { name: "Edited activity" })
  ).toBeVisible();
  await app.getByRole("button", { name: "Edit sample activity" }).click();
  await app
    .getByRole("textbox", { exact: true, name: "Title" })
    .fill("Discard activity");
  await app.getByRole("button", { name: "Discard changes" }).click();
  await expect(
    app.getByRole("heading", { name: "Edited activity" })
  ).toBeVisible();
  await app.getByRole("button", { name: "Location & route" }).click();
  await expect(
    app.getByRole("heading", { name: "Route sketch" })
  ).toBeVisible();
  await expect(app.locator("svg[role=img]")).toBeVisible();
  await app.getByRole("button", { exact: true, name: "Daily health" }).click();
  await app
    .getByRole("combobox", { name: "Health metric" })
    .selectOption("heartRate");
  await app.getByRole("combobox", { name: "Trend range" }).selectOption("all");
  await app.locator("summary").filter({ hasText: "View samples" }).click();
  await expect(app.getByRole("table")).toContainText("Missing sample");
  await app
    .getByRole("button", { exact: true, name: "Checkup records" })
    .click();
  await app.getByRole("button", { name: /^Sample blood test ·/ }).click();
  await expect(
    app.getByRole("heading", { name: "Sample blood test" })
  ).toBeVisible();
  await app.getByRole("button", { name: "Activity & schedule" }).click();
  await app
    .locator("summary")
    .filter({ hasText: "Per-item visibility rules (demo)" })
    .click();
  await app
    .getByRole("combobox", { exact: true, name: "Visitor visibility" })
    .selectOption("public");
  await app
    .getByRole("combobox", { name: "History window" })
    .selectOption("day");
  await app
    .getByRole("combobox", { name: "Visibility delay" })
    .selectOption("0");
  await app
    .getByRole("combobox", { exact: true, name: "Preview" })
    .selectOption("visitor");
  await expect(
    app.getByRole("button", { exact: true, name: "Edited activity" })
  ).toBeVisible();
  await expect(
    app.getByRole("button", { name: "Completing a sample task" })
  ).toHaveCount(0);
  await expect(app.getByText(/Read-only visitor preview/)).toBeVisible();
  await app
    .getByRole("button", { exact: true, name: "Edited activity" })
    .click();
  await expect(
    app.getByRole("heading", { exact: true, name: "Edited activity" })
  ).toBeVisible();
  await expect(
    app.getByRole("button", { exact: true, name: "Edit sample activity" })
  ).toHaveCount(0);
  await app.getByRole("button", { name: "Activity & schedule" }).click();
  await app
    .getByRole("combobox", { exact: true, name: "Preview" })
    .selectOption("all");
  await app
    .locator("summary")
    .filter({ hasText: "Per-item visibility rules (demo)" })
    .click();
  await app
    .getByRole("combobox", { name: "Visibility delay" })
    .selectOption("1");
  await app
    .getByRole("combobox", { exact: true, name: "Preview" })
    .selectOption("visitor");
  await expect(
    app.getByRole("button", { name: "Completing a sample task" })
  ).toBeVisible();
  await expect(
    app.getByRole("button", { exact: true, name: "Edited activity" })
  ).toHaveCount(0);
  await app
    .getByRole("combobox", { exact: true, name: "Preview" })
    .selectOption("all");
  await app
    .locator("summary")
    .filter({ hasText: "Per-item visibility rules (demo)" })
    .click();
  await app
    .getByRole("combobox", { name: "History window" })
    .selectOption("month");
  await app
    .getByRole("combobox", { name: "Visibility delay" })
    .selectOption("0");
  await app
    .getByRole("combobox", { exact: true, name: "Preview" })
    .selectOption("visitor");
  await expect(
    app.getByRole("button", { name: "Completing a sample task" })
  ).toBeVisible();
  await expect(
    app.getByRole("button", { exact: true, name: "Edited activity" })
  ).toBeVisible();
  await app
    .getByRole("combobox", { exact: true, name: "Preview" })
    .selectOption("all");
  await app
    .locator("summary")
    .filter({ hasText: "Per-item visibility rules (demo)" })
    .click();
  await app
    .getByRole("combobox", { exact: true, name: "Visitor visibility" })
    .selectOption("private");
  await app
    .getByRole("combobox", { exact: true, name: "Preview" })
    .selectOption("visitor");
  await expect(app.getByText("No activity in this range")).toBeVisible();
  await navigate(app, "Memberships");
  await expect(
    app.getByRole("button", { name: "Add sample membership" })
  ).toHaveCount(0);
  await app
    .getByRole("button", { exact: true, name: "Details: Demo Cinema" })
    .click();
  await expect(
    app.getByRole("button", {
      name: /Edit sample|Record sample payment|Cancel renewal/,
    })
  ).toHaveCount(0);
  await navigate(app, "Services");
  await app.getByRole("button", { exact: true, name: "Demo notebook" }).click();
  await expect(
    app.getByRole("button", { exact: true, name: "Edit sample" })
  ).toHaveCount(0);
  await navigate(app, "Personal");
  await app
    .getByRole("combobox", { exact: true, name: "Preview" })
    .selectOption("all");
  await expect(
    app.getByRole("button", { exact: true, name: "Edited activity" })
  ).toBeVisible();
});

test("services distinguish pending, stale and unmonitored and edit directory samples", async ({
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
  await expect(
    app.getByRole("button", { exact: true, name: "Demo notebook" })
  ).toHaveCount(0);
  await app
    .getByRole("combobox", { exact: true, name: "Status" })
    .selectOption("all");
  await app.getByRole("button", { exact: true, name: "Demo notebook" }).click();
  await app.getByRole("button", { name: "Last 6 sample hours" }).click();
  await app.locator("summary").filter({ hasText: "View samples" }).click();
  await expect(app.getByRole("table")).toBeVisible();
  await app.getByRole("button", { exact: true, name: "Edit sample" }).click();
  await app
    .getByRole("textbox", { exact: true, name: "Name (English)" })
    .fill("Discard service");
  await app.getByRole("button", { exact: true, name: "Cancel" }).click();
  await app.getByRole("button", { name: "Discard changes" }).click();
  await expect(
    app.getByRole("heading", { name: "Demo notebook" })
  ).toBeVisible();
  await app.getByRole("button", { exact: true, name: "Edit sample" }).click();
  await app
    .getByRole("textbox", { exact: true, name: "Name (English)" })
    .fill("Edited notebook");
  await app.getByRole("button", { exact: true, name: "Save sample" }).click();
  await expect(
    app.getByRole("heading", { name: "Edited notebook" })
  ).toBeVisible();
  await expect(app.getByText("Sample saved in this window.")).toBeVisible();
  await expect(app.getByText("No live URL configured")).toBeVisible();
  await app.getByRole("button", { exact: true, name: "Demo node A" }).click();
  await expect(app.getByRole("heading", { name: "Demo node A" })).toBeVisible();
});

test("server filtering, metric windows and missing observations keep units and links", async ({
  page,
}) => {
  const app = await openDashboard(page, "servers");
  await app.getByRole("searchbox", { name: "Search hosts" }).fill("no-host");
  await expect(app.getByText("No matching hosts")).toBeVisible();
  await expect(app.getByRole("button", { name: "Clear filters" })).toHaveCount(
    0
  );
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
  await expect(
    app.getByText(/valid samples · .* missing samples/)
  ).toBeVisible();
  await app.getByRole("button", { exact: true, name: "Demo notebook" }).click();
  await expect(
    app.getByRole("heading", { name: "Demo notebook" })
  ).toBeVisible();
});

test("dirty forms guard module, preview, history, reset and native close without losing saved samples", async ({
  page,
}) => {
  const app = await openDashboard(page, "personal", "demo-focus");
  await editActivity(app, "Unsaved activity");
  await answerDialog(page, false, () => navigate(app, "Memberships"));
  await expect(
    app.getByRole("textbox", { exact: true, name: "Title" })
  ).toHaveValue("Unsaved activity");
  await answerDialog(page, false, () =>
    app
      .getByRole("combobox", { exact: true, name: "Preview" })
      .selectOption("visitor")
  );
  await expect(
    app.getByRole("combobox", { exact: true, name: "Preview" })
  ).toHaveValue("all");
  await answerDialog(page, true, () =>
    app
      .getByRole("combobox", { exact: true, name: "Preview" })
      .selectOption("visitor")
  );
  await expect(
    app.getByRole("textbox", { exact: true, name: "Title" })
  ).toHaveCount(0);
  await app
    .getByRole("combobox", { exact: true, name: "Preview" })
    .selectOption("all");
  await editActivity(app, "Unsaved activity");
  await answerDialog(page, false, () =>
    page
      .getByRole("dialog", { exact: true, name: "Dashboard" })
      .getByRole("button", { exact: true, name: "Close" })
      .click()
  );
  await expect(
    app.getByRole("textbox", { exact: true, name: "Title" })
  ).toHaveValue("Unsaved activity");
  await answerDialog(page, true, () => navigate(app, "Memberships"));
  await expect(
    app.getByRole("textbox", { exact: true, name: "Title" })
  ).toHaveCount(0);
  await page.goBack();
  await editActivity(app, "Saved activity");
  await app.getByRole("button", { exact: true, name: "Save sample" }).click();
  await answerDialog(page, false, () =>
    app.getByRole("button", { name: "Reset samples" }).click()
  );
  await expect(
    app.getByRole("heading", { name: "Saved activity" })
  ).toBeVisible();
  await answerDialog(page, true, () =>
    app.getByRole("button", { name: "Reset samples" }).click()
  );
  await expect(
    app.getByRole("button", { exact: true, name: "Organizing project notes" })
  ).toBeVisible();
  await app
    .getByRole("button", { exact: true, name: "Organizing project notes" })
    .click();
  await editActivity(app, "Close discarded");
  await answerDialog(page, true, () =>
    page
      .getByRole("dialog", { exact: true, name: "Dashboard" })
      .getByRole("button", { exact: true, name: "Close" })
      .click()
  );
  await expect(app).toHaveCount(0);
  await page.getByRole("button", { exact: true, name: "Dashboard" }).dblclick();
  await expect(
    app.getByRole("button", { exact: true, name: "Organizing project notes" })
  ).toBeVisible();
  await app
    .getByRole("button", { exact: true, name: "Organizing project notes" })
    .click();
  await editActivity(app, "Saved until close");
  await app.getByRole("button", { exact: true, name: "Save sample" }).click();
  await expect(
    app.getByRole("heading", { name: "Saved until close" })
  ).toBeVisible();
  await page
    .getByRole("dialog", { exact: true, name: "Dashboard" })
    .getByRole("button", { exact: true, name: "Close" })
    .click();
  await expect(app).toHaveCount(0);
  await page
    .getByRole("list", { name: "Desktop" })
    .getByRole("button", { exact: true, name: "Dashboard" })
    .dblclick();
  await expect(
    app.getByRole("button", { exact: true, name: "Organizing project notes" })
  ).toBeVisible();
  await expect(
    app.getByRole("button", { exact: true, name: "Saved until close" })
  ).toHaveCount(0);
});

test("history cancellation restores the draft route across a closed instance and Portfolio entries", async ({
  page,
}) => {
  const app = await openDashboard(page);
  await navigate(app, "Memberships");
  await page
    .getByRole("dialog", { exact: true, name: "Dashboard" })
    .getByRole("button", { exact: true, name: "Close" })
    .click();
  await page.getByRole("button", { exact: true, name: "Portfolio" }).dblclick();
  await page.getByRole("button", { exact: true, name: "Explore work" }).click();
  await page
    .getByRole("dialog", { exact: true, name: "Portfolio" })
    .getByRole("button", { exact: true, name: "Minimize" })
    .click();
  await page.getByRole("button", { exact: true, name: "Dashboard" }).dblclick();
  await app
    .getByRole("button", { exact: true, name: "Organizing project notes" })
    .click();
  await editActivity(app, "History draft");
  const draftURL = page.url();
  await page.goBack();
  await expect(
    app.getByRole("textbox", { exact: true, name: "Title" })
  ).toHaveValue("History draft");
  await answerDialog(page, false, () => page.goBack());
  await expect(page).toHaveURL(draftURL);
  await expect(
    app.getByRole("textbox", { exact: true, name: "Title" })
  ).toHaveValue("History draft");
  await answerDialog(page, true, () => page.goBack());
  await expect(
    app.getByRole("heading", { exact: true, name: "Memberships" })
  ).toBeVisible();
});

test("language changes preserve a draft's editing language and keyboard navigation", async ({
  page,
}) => {
  const app = await openDashboard(page, "personal", "demo-focus");
  await editActivity(app, "English draft preserved");
  await setLocale(page, "zh");
  await expect(
    app.getByRole("textbox", { exact: true, name: "标题" })
  ).toHaveValue("English draft preserved");
  await expect(app.getByText(/当前编辑文字语言：英文/)).toBeVisible();
  await app.getByRole("button", { exact: true, name: "保存示例" }).click();
  await expect(
    app.getByRole("heading", { name: "整理项目笔记" })
  ).toBeVisible();
  await setLocale(page, "en");
  await expect(
    app.getByRole("heading", { name: "English draft preserved" })
  ).toBeVisible();
  const memberships = app
    .getByRole("navigation", { name: "Dashboard views" })
    .getByRole("button", { exact: true, name: "Memberships" });
  await memberships.focus();
  await expect(memberships).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(
    app.getByRole("heading", { exact: true, name: "Memberships" })
  ).toBeVisible();
  await setLocale(page, "zh");
  expect(
    await app
      .getByRole("navigation", { name: "看板视图" })
      .locator(":scope > button")
      .evaluateAll((buttons) =>
        buttons.map((button) => button.getAttribute("aria-label"))
      )
  ).toEqual(["总览", "个人", "会员", "服务", "服务器"]);
  await expect(
    app.getByText("示例数据", { exact: true }).first()
  ).toBeVisible();
  await setLocale(page, "en");
  await app
    .getByRole("button", { exact: true, name: "Details: Demo Cinema" })
    .click();
  await app.getByRole("button", { exact: true, name: "Edit sample" }).click();
  await app
    .getByRole("textbox", { exact: true, name: "Name (English)" })
    .fill("Bilingual cinema");
  await setLocale(page, "zh");
  await expect(
    app.getByRole("textbox", { exact: true, name: "名称（英文）" })
  ).toHaveValue("Bilingual cinema");
  await app.getByRole("button", { exact: true, name: "保存示例" }).click();
  await expect(app.getByRole("heading", { name: "演示影音" })).toBeVisible();
  await setLocale(page, "en");
  await expect(
    app.getByRole("heading", { name: "Bilingual cinema" })
  ).toBeVisible();
});

test("Dashboard interactions issue no data requests or sockets and do not persist sample edits", async ({
  page,
}) => {
  const errors: string[] = [];
  const sockets: string[] = [];
  const requests: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("websocket", (socket) => sockets.push(socket.url()));
  page.on("request", (request) => {
    if (["fetch", "xhr"].includes(request.resourceType())) {
      requests.push(new URL(request.url()).pathname);
    }
  });
  const app = await openDashboard(page, "personal", "demo-focus");
  const stored = await page.evaluate(() => ({
    local: { ...localStorage },
    session: { ...sessionStorage },
  }));
  await editActivity(app, "Memory only");
  await app.getByRole("button", { exact: true, name: "Save sample" }).click();
  await navigate(app, "Memberships");
  await navigate(app, "Services");
  await navigate(app, "Servers");
  await app
    .getByRole("combobox", { exact: true, name: "Preview" })
    .selectOption("visitor");
  await app.locator("summary").filter({ hasText: "Sample details" }).click();
  await expect(
    app.getByText(/not a security control or a publication/)
  ).toBeVisible();
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
  expect(errors).toEqual([]);
  expect(
    await page.evaluate(() => ({
      local: { ...localStorage },
      session: { ...sessionStorage },
    }))
  ).toEqual(stored);
  await page.reload();
  await navigate(app, "Personal");
  await expect(
    app.getByRole("button", { exact: true, name: "Organizing project notes" })
  ).toBeVisible();
  await expect(
    app.getByRole("button", { exact: true, name: "Memory only" })
  ).toHaveCount(0);
});

test("list filters survive detail navigation and confirmed abandonment clears membership drafts", async ({
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
  await app
    .getByRole("button", { exact: true, name: "Details: Demo Cinema" })
    .click();
  await app.getByRole("button", { exact: true, name: "Edit sample" }).click();
  await app
    .getByRole("textbox", { exact: true, name: "Name (English)" })
    .fill("Abandoned cinema");
  await answerDialog(page, false, () => navigate(app, "Memberships"));
  await expect(
    app.getByRole("textbox", { exact: true, name: "Name (English)" })
  ).toHaveValue("Abandoned cinema");
  await answerDialog(page, true, () => navigate(app, "Memberships"));
  await expect(
    app.getByRole("searchbox", { name: "Search memberships" })
  ).toHaveValue("Cinema");
  await app
    .getByRole("button", { exact: true, name: "Details: Demo Cinema" })
    .click();
  await expect(
    app.getByRole("heading", { exact: true, name: "Demo Cinema" })
  ).toBeVisible();
  await expect(
    app.getByRole("form", { name: "Edit sample membership" })
  ).toHaveCount(0);
  await app.getByRole("button", { name: "Record sample payment" }).click();
  await app.getByRole("textbox", { name: "Amount per payment" }).fill("48.50");
  await app.getByRole("button", { name: "Review sample payment" }).click();
  await answerDialog(page, true, () => navigate(app, "Memberships"));
  await app
    .getByRole("button", { exact: true, name: "Details: Demo Cinema" })
    .click();
  await expect(
    app.getByRole("form", { name: "Record sample payment" })
  ).toHaveCount(0);
  await expect(
    app
      .getByRole("table", { name: "Confirmed sample payments" })
      .locator("tbody tr")
  ).toHaveCount(1);
  await app
    .getByRole("button", { exact: true, name: "Cancel renewal" })
    .click();
  await expect(
    app.getByRole("button", { name: "Confirm sample change" })
  ).toBeVisible();
  await navigate(app, "Memberships");
  await app
    .getByRole("button", { exact: true, name: "Details: Demo Cinema" })
    .click();
  await expect(
    app.getByRole("button", { name: "Confirm sample change" })
  ).toHaveCount(0);
  await expect(
    app.getByText("Renewal planned", { exact: true }).first()
  ).toBeVisible();
});

test("service and host detail round trips preserve combined filters", async ({
  page,
}) => {
  const app = await openDashboard(page, "services");
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
  await app.getByRole("button", { exact: true, name: "Demo notebook" }).click();
  await app.getByRole("button", { exact: true, name: "Edit sample" }).click();
  await app
    .getByRole("textbox", { exact: true, name: "Name (English)" })
    .fill("Abandoned notebook");
  await answerDialog(page, true, () => navigate(app, "Services"));
  await expect(
    app.getByRole("searchbox", { name: "Search service names" })
  ).toHaveValue("notebook");
  await app.getByRole("button", { exact: true, name: "Demo notebook" }).click();
  await expect(
    app.getByRole("form", { name: "Edit service sample" })
  ).toHaveCount(0);
  await expect(
    app.getByRole("heading", { exact: true, name: "Demo notebook" })
  ).toBeVisible();
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

test("overview disclosures retain complete costs, actions and source evidence", async ({
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

test("service health rows preserve 90 UTC days, observed uptime and accessible day inspection", async ({
  page,
}) => {
  const app = await openDashboard(page, "services");
  const sliders = app.getByRole("slider");
  await expect(sliders).toHaveCount(6);
  const drive = app.getByRole("listitem").filter({
    has: page.getByRole("button", { exact: true, name: "Demo drive" }),
  });
  const driveSlider = drive.getByRole("slider", {
    name: "Demo drive · 90-day health history",
  });
  const days = driveSlider.locator("[data-date]");
  await expect(days).toHaveCount(90);
  await expect(days.first()).toHaveAttribute("data-date", "2026-07-20");
  await expect(days.last()).toHaveAttribute("data-date", "2026-10-17");
  await expect(driveSlider.locator('[data-date="2026-10-18"]')).toHaveCount(0);
  await expect(driveSlider.locator('[data-health="degraded"]')).toHaveCount(3);
  await expect(driveSlider.locator('[data-health="down"]')).toHaveCount(1);
  await expect(driveSlider.locator('[data-health="up"]')).toHaveCount(86);
  const rate = drive.locator('[aria-label="90-day uptime"]');
  await expect(rate).toContainText("Uptime 99.50%");
  await expect(rate).toContainText("Coverage 100.00%");
  await expect(rate.locator("[title]")).toHaveAttribute(
    "title",
    "129600 / 129600 observed / expected checks"
  );
  await expect(driveSlider).toHaveAttribute("tabindex", "0");
  await expect(driveSlider.locator("[tabindex], button")).toHaveCount(0);
  await driveSlider.focus();
  await driveSlider.press("Home");
  await expect(driveSlider).toHaveAttribute("aria-valuenow", "1");
  await expect(driveSlider).toHaveAttribute("aria-valuetext", /2026-07-20 UTC/);
  await driveSlider.press("ArrowRight");
  await expect(driveSlider).toHaveAttribute("aria-valuetext", /2026-07-21 UTC/);
  await driveSlider.press("End");
  await expect(driveSlider).toHaveAttribute("aria-valuenow", "90");
  await expect(driveSlider).toHaveAttribute("aria-valuetext", /2026-10-17 UTC/);
  await expect(driveSlider.locator("..").getByRole("status")).toBeVisible();
  await driveSlider.press("Escape");
  await expect(driveSlider.locator("..").getByRole("status")).toHaveCount(0);
  await driveSlider.press("ArrowLeft");
  await expect(driveSlider.locator("..").getByRole("status")).toContainText(
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
    expect(
      await app
        .locator(".dashboard-content")
        .evaluate((node) => node.scrollWidth <= node.clientWidth + 1)
    ).toBe(true);
    await expect(app.getByRole("button", { name: /清除筛选/ })).toHaveCount(0);
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
});

test("vertical navigation adapts to the actual native window width in both languages", async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ height: 900, width: 1440 });
  const app = await openDashboard(page, "personal");
  const window = page.locator(".react-draggable").filter({ has: app });
  const before = await window.boundingBox();
  expect(before).not.toBeNull();
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
  const nativeGap = await app.evaluate((node) => {
    const workspace = node.querySelector(".dashboard-workspace");
    const footer = node.querySelector(":scope > footer");
    if (!workspace || !footer) throw new Error("Dashboard regions missing");
    return (
      footer.getBoundingClientRect().top -
      workspace.getBoundingClientRect().bottom
    );
  });
  expect(Math.abs(nativeGap)).toBeLessThanOrEqual(1);
  const mainButtons = app
    .getByRole("navigation", { exact: true, name: "Dashboard views" })
    .locator(":scope > button");
  const boxes = await mainButtons.evaluateAll((buttons) =>
    buttons.map((button) => {
      const { x, y } = button.getBoundingClientRect();
      return { x, y };
    })
  );
  expect(boxes).toHaveLength(5);
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
  await expect(
    app.getByRole("combobox", { name: "Health metric" })
  ).toBeVisible();
  await expect(health).toHaveAttribute("aria-current", "page");
  const content = app.locator(".dashboard-content");
  expect(
    await content.evaluate((node) => node.scrollWidth <= node.clientWidth + 1)
  ).toBe(true);
  await navigate(app, "Memberships");
  await app
    .getByRole("button", { exact: true, name: "Details: Demo Cinema" })
    .click();
  await expect(
    app.getByRole("heading", { exact: true, name: "Demo Cinema" })
  ).toBeVisible();
  await setLocale(page, "zh");
  const personal = app
    .getByRole("navigation", { exact: true, name: "看板视图" })
    .getByRole("button", { exact: true, name: "个人" });
  await personal.focus();
  await page.keyboard.press("Enter");
  await expect(
    app
      .getByRole("navigation", { exact: true, name: "个人状况视图" })
      .getByRole("button")
  ).toHaveCount(4);
  await app.getByRole("button", { exact: true, name: "位置与轨迹" }).click();
  await expect(app.getByRole("heading", { name: "路线示意" })).toBeVisible();
  expect(
    await content.evaluate((node) => node.scrollWidth <= node.clientWidth + 1)
  ).toBe(true);
  await page.screenshot({
    path: testInfo.outputPath("dashboard-native-window-520-zh.png"),
  });
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
  test(`Dashboard retains native layout and readable charts at ${viewport.width}px`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize(viewport);
    const app = await openDashboard(page, "servers", "demo-node-a");
    await expect(
      app.getByRole("combobox", { name: "Trend metric" })
    ).toBeVisible();
    await app
      .getByRole("combobox", { name: "Trend metric" })
      .selectOption("memory");
    const content = app.locator(".dashboard-content");
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
      await content.evaluate((node) => node.scrollWidth <= node.clientWidth + 1)
    ).toBe(true);
    const chart = app.locator("svg[role=img]");
    await chart.scrollIntoViewIfNeeded();
    await expect(chart).toBeVisible();
    expect(
      await chart.evaluate((node) => node.getBoundingClientRect().width)
    ).toBeGreaterThan(viewport.width === 390 ? 200 : 500);
    await page.screenshot({
      path: testInfo.outputPath(`dashboard-${viewport.width}.png`),
    });
    await navigate(app, "Memberships");
    await app.getByRole("button", { name: "Add sample membership" }).click();
    await expect(
      app.getByRole("textbox", { exact: true, name: "Name (English)" })
    ).toBeVisible();
    expect(
      await content.evaluate((node) => node.scrollWidth <= node.clientWidth + 1)
    ).toBe(true);
  });
}
