import { expect, test } from "@playwright/test";

test("plain visits show the desktop; portfolio remains opt-in", async ({ page }) => {
  await page.goto("/");
  const shortcut = page.getByRole("button", { exact: true, name: "Portfolio" });
  await expect(shortcut).toBeVisible();
  await expect(page).toHaveTitle("Yincan Huang");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await shortcut.dblclick();
  await expect(page.getByRole("dialog", { name: "Portfolio" })).toBeVisible();
  await expect(page.getByRole("heading", { exact: true, name: "Yincan Huang" })).toBeVisible();
  await page.goto("/");
  await expect(shortcut).toBeVisible();
  await expect(page.getByRole("dialog")).toHaveCount(0);
});

test("portfolio project links load public content", async ({ page }) => {
  await page.goto("/?app=Portfolio&project=aipm");
  await expect(page.getByRole("heading", { exact: true, name: "AIPM" })).toBeVisible();
  await expect(page.getByRole("link", { name: "View source" })).toHaveAttribute("href", /github\.com/);
});

test("store defaults to all and toggles its three categories", async ({ page }) => {
  await page.goto("/?app=AppStore");
  const cards = page.locator(".hyc-store-card");
  const categories = page.locator(".hyc-segments button");
  await expect(cards).toHaveCount(30);
  await expect(categories).toHaveText(["System software", "Application software", "Third-party"]);
  await expect(page.locator('.hyc-segments [aria-pressed="true"]')).toHaveCount(0);
  await categories.nth(0).click();
  await expect(cards).toHaveCount(28);
  await categories.nth(1).click();
  await expect(cards).toHaveCount(2);
  await expect(page.locator('.hyc-store-card[data-app="AppStore"]')).toBeVisible();
  await categories.nth(1).click();
  await expect(cards).toHaveCount(30);
  await page.getByRole("textbox", { name: "Search apps" }).fill("Paint");
  await expect(cards).toHaveCount(1);
  await categories.nth(1).click();
  await expect(cards).toHaveCount(0);
  await categories.nth(1).click();
  await expect(cards).toHaveCount(1);
});

test("Start keeps settings and Power without folder shortcuts", async ({ page }) => {
  await page.goto("/");
  await page.locator('button[aria-label="Start"]').click();
  const sidebar = page.locator('nav[aria-label="Start"]');
  await expect(sidebar.getByRole("button")).toHaveCount(4);
  await expect(sidebar.getByRole("button", { name: "System settings" })).toBeVisible();
  await expect(sidebar.getByRole("button", { name: "Power" })).toBeVisible();
  await expect(sidebar.getByRole("button", { name: /Documents|Pictures|Videos/ })).toHaveCount(0);
  await sidebar.getByRole("button", { name: "System settings" }).click();
  await expect(page.locator('select[name="os-language"]')).toBeVisible();
  await page.locator('select[name="os-language"]').selectOption("zh");
  await expect(page).toHaveTitle("系统设置 - Yincan Huang");
});

test("native Paint and file browser still load", async ({ page }) => {
  await page.goto("/?app=Paint");
  await expect(page.getByRole("dialog", { name: "Untitled - Paint" })).toBeVisible();
  await expect(page.frameLocator("iframe").getByRole("menubar")).toBeVisible();
  await page.goto("/?app=FileExplorer");
  await expect(page.getByRole("dialog", { name: "My PC" })).toBeVisible();
});

test("site metadata uses the owner identity and old assets stay absent", async ({ page, request }) => {
  await page.goto("/");
  await expect(page.locator('link[rel="icon"]')).toHaveAttribute("href", "/System/PersonalOS/avatar.png");
  await expect(page.locator('meta[property="og:url"]')).toHaveAttribute("content", "https://hyc.ac");
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute("content", "https://hyc.ac/System/PersonalOS/avatar.png");
  expect((await request.get("/favicon.ico")).status()).toBe(404);
  expect((await request.get("/screenshot.png")).status()).toBe(404);
  expect((await request.get("/rss.xml")).status()).toBe(404);
  expect((await request.get("/api/admin/projects")).status()).toBe(401);
});
