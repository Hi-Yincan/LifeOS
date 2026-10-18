import { expect, test } from "@playwright/test";
import { type Project } from "components/system/LifeOS/context";

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

test("store defaults to all and toggles its three categories", async ({
  page,
}) => {
  await page.goto("/?app=AppStore");
  const cards = page.locator(".hyc-store-card");
  const categories = page.locator(".hyc-segments button");
  await expect(cards).toHaveCount(30);
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
  await expect(cards).toHaveCount(2);
  await expect(
    page.locator('.hyc-store-card[data-app="AppStore"]')
  ).toBeVisible();
  await categories.nth(1).click();
  await expect(cards).toHaveCount(30);
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
    "/System/LifeOS/avatar.png"
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
  expect((await request.get("/api/admin/projects")).status()).toBe(
    process.env.PUBLIC_DEPLOYMENT ? 404 : 401
  );
});

test("author can save a private draft, publish it and unpublish it", async ({
  page,
  request,
}) => {
  test.skip(
    Boolean(process.env.PUBLIC_DEPLOYMENT),
    "Public releases have no write API"
  );
  await page.goto("/?app=SystemSettings");
  await page.locator("summary").filter({ hasText: "Site maintenance" }).click();
  await page
    .locator('input[name="administrator-key"]')
    .fill("product-e2e-only-not-a-real-credential");
  await page.getByRole("button", { name: "Enter management" }).click();
  const portfolio = page.getByRole("dialog", {
    exact: true,
    name: "Portfolio",
  });
  await expect(portfolio).toBeVisible();
  await portfolio.locator('a[href="/?app=Portfolio&project=aipm"]').click();
  await portfolio
    .getByRole("button", { exact: true, name: "Edit project" })
    .click();
  await portfolio
    .locator('input[name="project-title"]')
    .fill("AIPM integration test");
  await portfolio
    .getByRole("button", { exact: true, name: "Save draft" })
    .click();
  await expect(portfolio.getByRole("status")).toContainText("Draft saved");
  const draftPublic = await request.get("/api/projects/aipm");
  expect(((await draftPublic.json()) as Project).translations.en.title).toBe(
    "AIPM"
  );
  await portfolio
    .getByRole("button", { exact: true, name: "Publish saved version" })
    .click();
  await expect(portfolio.getByRole("status")).toContainText("Published");
  const published = await request.get("/api/projects/aipm");
  expect(((await published.json()) as Project).translations.en.title).toBe(
    "AIPM integration test"
  );
  await portfolio
    .getByRole("button", { exact: true, name: "Unpublish" })
    .click();
  await expect(portfolio.getByRole("status")).toContainText("Unpublished");
  expect((await request.get("/api/projects/aipm")).status()).toBe(404);
});
