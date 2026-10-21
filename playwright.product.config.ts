import { defineConfig, devices } from "@playwright/test";

const port = Number(process.env.LIFEOS_PORT || 4392);
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error("Invalid LIFEOS_PORT");
}
const baseURL = `http://127.0.0.1:${port}`;

export default defineConfig({
  fullyParallel: false,
  projects: [{ name: "chromium", use: devices["Desktop Chrome"] }],
  reporter: [["list"], ["html", { open: "never" }]],
  retries: process.env.CI ? 1 : 0,
  testDir: "e2e",
  testMatch: [
    "boot.spec.ts",
    "startup-assets.spec.ts",
    "dashboard.spec.ts",
    "desktop-drag.spec.ts",
    "product.spec.ts",
    "messenger-*.spec.ts",
  ],
  use: {
    baseURL,
    locale: "en-US",
    trace: "retain-on-failure",
  },
  webServer: {
    command: "node server/test/serve.mjs",
    reuseExistingServer: false,
    url: `${baseURL}/api/projects`,
  },
  workers: 1,
});
