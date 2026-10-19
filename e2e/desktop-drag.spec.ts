import { expect, test } from "@playwright/test";

declare global {
  interface Window {
    dragPreviewImages: HTMLImageElement[];
    dragPreviewSize?: { height: number; width: number };
  }
}

for (const deviceScaleFactor of [1, 2, 3]) {
  test.describe(`desktop drag at ${deviceScaleFactor}x pixel density`, () => {
    test.use({ deviceScaleFactor });

    test("multiple icons keep their original size in the drag preview", async ({
      page,
    }) => {
      await page.addInitScript(() => {
        window.dragPreviewImages = [];
        const NativeImage = window.Image;
        window.Image = class extends NativeImage {
          public constructor() {
            super();
            window.dragPreviewImages.push(this);
          }
        };
        const { setDragImage: nativeSetDragImage } = DataTransfer.prototype;
        DataTransfer.prototype.setDragImage = function setDragImage(
          image,
          x,
          y
        ) {
          const canvas = document.createElement("canvas");
          const preview = image as HTMLImageElement;
          canvas.width = preview.naturalWidth;
          canvas.height = preview.naturalHeight;
          const context = canvas.getContext("2d");
          if (!context) throw new Error("Drag preview canvas is unavailable");
          context.drawImage(preview, 0, 0);
          const { data } = context.getImageData(
            0,
            0,
            canvas.width,
            canvas.height
          );
          let left = canvas.width;
          let top = canvas.height;
          let right = 0;
          let bottom = 0;
          for (let row = 0; row < canvas.height; row++) {
            for (let column = 0; column < canvas.width; column++) {
              if (data[(row * canvas.width + column) * 4 + 3]) {
                left = Math.min(left, column);
                right = Math.max(right, column);
                top = Math.min(top, row);
                bottom = Math.max(bottom, row);
              }
            }
          }
          window.dragPreviewSize = {
            height: bottom - top + 1,
            width: right - left + 1,
          };
          nativeSetDragImage.call(this, image, x, y);
        };
      });
      await page.goto("/");
      const desktop = page.getByRole("list", { exact: true, name: "Desktop" });
      const store = desktop.getByRole("button", { name: "App Store" });
      await store.click();
      await desktop
        .getByRole("button", { name: "Portfolio" })
        .click({ modifiers: ["Control"] });
      await expect(desktop.locator("li.focus-within")).toHaveCount(2);
      await page.waitForFunction(() =>
        window.dragPreviewImages.some(
          (image) =>
            image.src.startsWith("data:image/png") &&
            image.complete &&
            image.naturalWidth > 0
        )
      );
      const bounds = await desktop
        .locator("li.focus-within")
        .evaluateAll((entries) => {
          const rects = entries.map((entry) => entry.getBoundingClientRect());
          return {
            height:
              Math.max(...rects.map(({ bottom }) => bottom)) -
              Math.min(...rects.map(({ top }) => top)),
            width:
              Math.max(...rects.map(({ right }) => right)) -
              Math.min(...rects.map(({ left }) => left)),
          };
        });
      await store.evaluate((button) => {
        const entry = button.closest("li");
        if (!entry) throw new Error("Desktop entry is unavailable");
        entry.dispatchEvent(
          new DragEvent("dragstart", {
            bubbles: true,
            dataTransfer: new DataTransfer(),
          })
        );
      });
      const preview = await page.evaluate(() => window.dragPreviewSize);
      if (!preview) throw new Error("Multiple icons did not create a preview");
      expect(preview.width).toBeGreaterThan(40);
      expect(preview.height).toBeGreaterThan(100);
      expect(preview.width).toBeLessThanOrEqual(Math.ceil(bounds.width));
      expect(preview.height).toBeLessThanOrEqual(Math.ceil(bounds.height));
    });
  });
}
