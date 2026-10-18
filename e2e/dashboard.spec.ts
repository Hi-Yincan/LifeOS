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
  await expect(app.getByText(/All records are fictional/)).toBeVisible();
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
  await app.getByRole("button", { name: "Clear filters" }).click();
  await app
    .getByRole("combobox", { exact: true, name: "Category" })
    .selectOption("cloud");
  await expect(app.getByRole("heading", { name: "Demo Cloud" })).toBeVisible();
  await expect(app.getByRole("heading", { name: "Demo Cinema" })).toHaveCount(
    0
  );
  await app
    .getByRole("combobox", { exact: true, name: "Category" })
    .selectOption("");
  await app
    .getByRole("combobox", { name: "Sort memberships" })
    .selectOption("name");
  await expect(app.locator("h3")).toHaveText([
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
    app.getByRole("heading", { name: "Window cinema" })
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
  await app.getByRole("button", { name: "Clear filters" }).click();
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
  await app.getByRole("button", { name: "Clear filters" }).click();
  await app
    .getByRole("combobox", { name: "Data status" })
    .selectOption("stale");
  await app.getByRole("button", { name: "View Demo node B details" }).click();
  await expect(
    app.getByText(/last reported|last known|Stale/i).first()
  ).toBeVisible();
  await navigate(app, "Servers");
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
  await expect(
    app.getByRole("navigation", { name: "看板视图" }).getByRole("button")
  ).toHaveText(["总览", "个人", "会员", "服务", "服务器"]);
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
