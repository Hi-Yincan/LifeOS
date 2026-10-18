import { expect, test } from "@playwright/test";
import site from "lifeos.json";

test.beforeEach(async ({ page }) => {
  // 测试不向公共中继发布资料或发送私信。
  await page.routeWebSocket(/wss?:\/\//, (socket) => socket.close());
  await page.goto("/?app=Messenger");
});

test("site contact opens the supplied identity, appears in search and can be blocked", async ({
  context,
  page,
}) => {
  const contact = page.getByRole("button", {
    exact: true,
    name: "Yincan Huang",
  });
  await expect(contact).toHaveCount(1);
  await expect(contact.locator("img")).toHaveAttribute("src", site.icon);
  await contact.click();
  await page.getByRole("button", { exact: true, name: "Profile" }).click();
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.getByRole("menuitem", { name: "Copy npub address" }).click();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
    site.messenger.publicKey
  );
  await page.getByRole("button", { exact: true, name: "Back" }).click();
  await page.getByRole("button", { exact: true, name: "New message" }).click();
  await page
    .getByRole("textbox", { exact: true, name: "To" })
    .fill("Yincan Huang");
  await page
    .getByRole("list", { name: "Suggestions" })
    .getByRole("button", { name: "Yincan Huang" })
    .click();
  await page.getByRole("button", { exact: true, name: "Profile" }).click();
  await page.getByRole("menuitem", { exact: true, name: "Block" }).click();
  await expect(contact).toHaveCount(0);
  await page.reload();
  await expect(
    page.getByRole("button", { exact: true, name: "Profile" })
  ).toBeVisible();
  await expect(contact).toHaveCount(0);
});

test("six banner presets preview without publishing and cancellation preserves the profile", async ({
  page,
}, testInfo) => {
  const banner = page
    .locator('button[aria-label="Profile"]')
    .locator("xpath=../..");
  const original = await banner.evaluate(
    (element) => getComputedStyle(element).backgroundImage
  );
  await page.getByRole("button", { exact: true, name: "Profile" }).click();
  await page.getByRole("menuitem", { name: "Edit Banner" }).click();
  const editor = page.getByRole("region", { name: "Edit banner" });
  const previews = new Set<string>();

  /* eslint-disable no-await-in-loop -- 同一预览必须逐项切换并核验。 */
  for (const name of [
    "Deep sea",
    "Aurora",
    "Sunset",
    "Pine forest",
    "Violet night",
    "Graphite",
  ]) {
    const preset = editor.getByRole("button", { exact: true, name });
    await preset.click();
    await expect(preset).toHaveAttribute("aria-pressed", "true");
    const background = await page
      .getByRole("img", { name: "Banner preview" })
      .evaluate((element) => (element as HTMLElement).style.backgroundImage);
    expect(background).toContain("data:image/jpeg;base64,");
    previews.add(background);
  }
  /* eslint-enable no-await-in-loop */
  expect(previews.size).toBe(6);
  await editor.getByRole("button", { exact: true, name: "Aurora" }).click();
  await page.screenshot({ path: testInfo.outputPath("banner-presets.png") });
  await editor.getByRole("button", { name: "Cancel" }).click();
  await expect(banner).toHaveCSS("background-image", original);
  await expect(
    page.getByRole("button", { exact: true, name: "Profile" })
  ).toBeFocused();
});

test("banner save errors retain the selection and invalid custom URLs cannot publish", async ({
  page,
}) => {
  await page.getByRole("button", { exact: true, name: "Profile" }).click();
  await page.getByRole("menuitem", { name: "Edit Banner" }).click();
  const editor = page.getByRole("region", { name: "Edit banner" });
  await editor.getByRole("button", { name: "Sunset" }).click();
  await editor.getByRole("button", { name: "Save banner" }).click();
  await expect(editor.getByRole("alert")).toHaveText(
    "The banner could not be saved. Check your relay connection and try again."
  );
  await expect(editor.getByRole("button", { name: "Sunset" })).toHaveAttribute(
    "aria-pressed",
    "true"
  );
  await editor.locator("summary").click();
  await editor
    .getByRole("textbox", { name: "Custom image URL" })
    .fill("file:///invalid-banner.png");
  await editor.getByRole("button", { name: "Save banner" }).click();
  await expect(editor.getByRole("alert")).toHaveText(
    "Enter an HTTP or HTTPS image URL."
  );
});

test("Chinese banner presets fit a narrow window", async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ height: 667, width: 375 });
  await page.evaluate(() =>
    localStorage.setItem(
      "hyc.preferences.v1",
      JSON.stringify({ language: "zh" })
    )
  );
  await page.reload();
  await page.getByRole("button", { exact: true, name: "Profile" }).click();
  await page.getByRole("menuitem", { name: "修改背景图" }).click();
  const editor = page.getByRole("region", { name: "修改背景图" });
  await expect(editor.locator(".banner-presets button")).toHaveText([
    "深海",
    "极光",
    "晚霞",
    "松林",
    "紫夜",
    "石墨",
  ]);
  await editor.getByRole("button", { exact: true, name: "松林" }).click();
  await expect(
    editor.getByRole("button", { name: "保存背景图" })
  ).toBeInViewport();
  expect(
    await editor.evaluate(
      (element) => element.scrollWidth <= element.clientWidth
    )
  ).toBe(true);
  await page.screenshot({
    path: testInfo.outputPath("banner-presets-zh-narrow.png"),
  });
  await editor.getByRole("button", { exact: true, name: "取消" }).click();
  await expect(
    page.getByRole("button", { exact: true, name: "Yincan Huang" })
  ).toBeVisible();
});
