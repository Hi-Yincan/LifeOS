import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  projects: [{ name: "chromium", use: devices["Desktop Chrome"] }],
  reporter: "list",
  retries: process.env.CI ? 1 : 0,
  testDir: "e2e",
  testMatch: ["product.spec.ts", "public.spec.ts", "messenger-*.spec.ts"],
  use: { baseURL: "http://127.0.0.1:4393", locale: "en-US" },
  webServer: {
    command: "python3 scripts/product/serve-static.py",
    reuseExistingServer: false,
    url: "http://127.0.0.1:4393/release.json",
  },
  workers: 1,
});
