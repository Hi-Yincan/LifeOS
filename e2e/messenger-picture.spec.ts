import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  // 仅验证本地编辑与断网失败，不向公共中继发布测试身份资料。
  await page.routeWebSocket(/wss?:\/\//, (socket) => socket.close());
  await page.goto("/?app=Messenger");
  await page.getByRole("button", { exact: true, name: "Profile" }).click();
  await page.getByRole("menuitem", { name: "Edit Picture" }).click();
});

test("picture selection crops a landscape image and supports keyboard adjustment and cancellation", async ({
  page,
}, testInfo) => {
  await expect(
    page.getByRole("button", { exact: true, name: "Browse…" })
  ).toBeFocused();
  await page.screenshot({ path: testInfo.outputPath("empty-editor.png") });
  const image = await page.evaluate(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 300;
    canvas.height = 100;
    const context = canvas.getContext("2d");

    if (!context) throw new Error("Canvas unavailable");

    ["red", "lime", "blue"].forEach((color, index) => {
      context.fillStyle = color;
      context.fillRect(index * 100, 0, 100, 100);
    });
    return canvas.toDataURL("image/png").split(",")[1];
  });
  const chooserPromise = page.waitForEvent("filechooser");
  await page.getByRole("button", { exact: true, name: "Browse…" }).click();
  const chooser = await chooserPromise;
  await chooser.setFiles({
    buffer: Buffer.from(image, "base64"),
    mimeType: "image/png",
    name: "synthetic-crop-test.png",
  });
  const preview = page.getByRole("img", { name: "Circular picture preview" });
  await expect(preview).toBeVisible();
  await expect(preview).toHaveCSS("border-radius", "50%");
  await page.screenshot({ path: testInfo.outputPath("native-editor.png") });
  const centerPixel = (): Promise<number[]> =>
    preview.evaluate((element) => {
      const context = (element as HTMLCanvasElement).getContext("2d");

      if (!context) throw new Error("Canvas unavailable");

      return [...context.getImageData(96, 96, 1, 1).data];
    });
  await expect.poll(centerPixel).toEqual([0, 255, 0, 255]);
  await page.getByRole("slider", { name: "Horizontal position" }).focus();
  await page.keyboard.press("Home");
  await expect.poll(centerPixel).toEqual([255, 0, 0, 255]);
  await page.getByRole("slider", { exact: true, name: "Zoom" }).focus();
  await page.keyboard.press("End");
  await expect(
    page.getByRole("slider", { exact: true, name: "Zoom" })
  ).toHaveValue("3");
  await page.keyboard.press("Escape");
  await expect(page.getByRole("region", { name: "Edit picture" })).toHaveCount(
    0
  );
  await expect(
    page.getByRole("list", { exact: true, name: "Chats" })
  ).toBeVisible();
  await expect(page.locator('button[aria-label="Profile"] img')).toHaveCount(0);
  await expect(
    page.getByRole("button", { exact: true, name: "Profile" })
  ).toBeFocused();
});

test("invalid and corrupt pictures show errors and cannot be saved", async ({
  page,
}) => {
  const input = page.getByLabel("Choose picture", { exact: true });
  const error = page
    .getByRole("region", { name: "Edit picture" })
    .getByRole("alert");
  await input.setInputFiles({
    buffer: Buffer.from("not an image"),
    mimeType: "text/plain",
    name: "invalid.txt",
  });
  await expect(error).toHaveText(
    "Choose a JPG, PNG or WebP image up to 10 MB."
  );
  await expect(
    page.getByRole("button", { name: "Save picture" })
  ).toBeDisabled();
  await input.setInputFiles({
    buffer: Buffer.from("corrupt image"),
    mimeType: "image/png",
    name: "corrupt.png",
  });
  await expect(error).toHaveText(
    "This image could not be opened. Try another picture."
  );
  await expect(
    page.getByRole("button", { name: "Save picture" })
  ).toBeDisabled();
  await input.setInputFiles({
    buffer: Buffer.alloc(10 * 1024 * 1024 + 1),
    mimeType: "image/png",
    name: "oversized.png",
  });
  await expect(error).toHaveText(
    "Choose a JPG, PNG or WebP image up to 10 MB."
  );
});

test("Chinese picture editing fits a narrow window", async ({
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
  await page.getByRole("menuitem", { name: "修改头像" }).click();
  await page
    .getByLabel("选择图片", { exact: true })
    .setInputFiles("public/System/PersonalOS/avatar.png");
  const editor = page.getByRole("region", { name: "修改头像" });
  await expect(page.getByRole("img", { name: "圆形头像预览" })).toBeVisible();
  expect(
    await editor.evaluate(
      (element) => element.scrollWidth <= element.clientWidth
    )
  ).toBe(true);
  await page.getByRole("button", { name: "保存头像" }).scrollIntoViewIfNeeded();
  await expect(page.getByRole("button", { name: "保存头像" })).toBeInViewport();
  await page.screenshot({
    path: testInfo.outputPath("chinese-narrow-editor.png"),
  });
  await page.getByRole("button", { exact: true, name: "取消" }).click();
  await expect(editor).toHaveCount(0);
});

test("failed publication retains the crop and leaves the existing profile unchanged", async ({
  page,
}) => {
  await page
    .getByLabel("Choose picture", { exact: true })
    .setInputFiles("public/System/PersonalOS/avatar.png");
  await expect(
    page.getByRole("img", { name: "Circular picture preview" })
  ).toBeVisible();
  await page.getByRole("button", { name: "Save picture" }).click();
  await expect(
    page.getByRole("region", { name: "Edit picture" }).getByRole("alert")
  ).toHaveText(
    "The picture could not be saved. Check your relay connection and try again."
  );
  await expect(
    page.getByRole("img", { name: "Circular picture preview" })
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Save picture" })
  ).toBeEnabled();
  await expect(page.locator('button[aria-label="Profile"] img')).toHaveCount(0);
  await page.getByRole("button", { name: "Cancel" }).click();
  await expect(
    page.getByRole("list", { exact: true, name: "Chats" })
  ).toBeVisible();
});
