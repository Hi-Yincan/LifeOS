import { expect, test } from "@playwright/test";

for (const ratio of [1, 2, 3]) {
  test.describe(`${ratio}x avatar assets`, () => {
    test.use({ deviceScaleFactor: ratio });

    test("desktop and portfolio avoid full-resolution avatar downloads", async ({
      page,
      request,
    }, testInfo) => {
      const requested = new Set<string>();
      page.on("request", (resource) => {
        requested.add(new URL(resource.url()).pathname);
      });
      await page.goto("/");
      await expect(page.locator("#lifeos-boot")).toBeHidden({ timeout: 20000 });
      expect([...requested]).not.toContain("/System/LifeOS/portfolio.svg");
      expect([...requested]).not.toContain("/System/LifeOS/avatar.png");

      const shortcut = page.getByRole("button", {
        exact: true,
        name: "Portfolio",
      });
      const icon = shortcut.locator('img[src*="lifeos-avatar"]');
      await expect(icon).toBeVisible();
      const expectedSize = 48 * ratio;
      expect(
        await icon.evaluate((image: HTMLImageElement) => image.currentSrc)
      ).toContain(`/${expectedSize}x${expectedSize}/lifeos-avatar.webp`);
      const favicon = page.locator('link[rel="icon"]');
      await expect(favicon).toHaveAttribute(
        "href",
        "/System/LifeOS/favicon-48.png"
      );
      const faviconResponse = await request.get(
        "/System/LifeOS/favicon-48.png"
      );
      expect(faviconResponse.ok()).toBe(true);
      expect((await faviconResponse.body()).byteLength).toBeLessThan(4096);
      if (ratio === 2) {
        await page.screenshot({ path: testInfo.outputPath("desktop-2x.png") });
      }

      await shortcut.dblclick();
      await expect(page.locator(".hyc-hero img")).toBeVisible();
      expect(
        await page
          .locator(".hyc-hero img")
          .evaluate((image: HTMLImageElement) => image.currentSrc)
      ).toContain(`/${expectedSize}x${expectedSize}/lifeos-avatar.webp`);
      if (ratio === 2) {
        await page.screenshot({
          path: testInfo.outputPath("portfolio-overview-2x.png"),
        });
      }
      await page.getByRole("button", { exact: true, name: "About" }).click();
      await expect(page.locator(".hyc-about-avatar")).toBeVisible();
      expect([...requested]).not.toContain("/System/LifeOS/avatar.png");
      expect([...requested]).not.toContain("/System/LifeOS/portfolio.svg");
      await expect(favicon).toHaveAttribute(
        "href",
        "/System/LifeOS/favicon-48.png"
      );
      if (ratio === 2) {
        await page.screenshot({
          path: testInfo.outputPath("portfolio-about-2x.png"),
        });
      }
    });
  });
}
