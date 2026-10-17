import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  fullyParallel: false,
  projects: [{ name: "chromium", use: devices["Desktop Chrome"] }],
  reporter: [["list"], ["html", { open: "never" }]],
  retries: process.env.CI ? 1 : 0,
  testDir: "e2e",
  testMatch: "product.spec.ts",
  use: {
    baseURL: "http://127.0.0.1:4392",
    locale: "en-US",
    trace: "retain-on-failure",
  },
  webServer: {
    command: "node server/test/serve.mjs",
    reuseExistingServer: false,
    url: "http://127.0.0.1:4392/api/projects",
  },
  workers: 1,
});
