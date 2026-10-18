import { defineConfig, devices } from "@playwright/test";

process.env.PUBLIC_DEPLOYMENT = "1";

export default defineConfig({
  fullyParallel: false,
  projects: [{ name: "chromium", use: devices["Desktop Chrome"] }],
  reporter: "list",
  retries: 0,
  testDir: "e2e",
  testMatch: ["dashboard.spec.ts", "product.spec.ts", "public.spec.ts"],
  use: {
    baseURL: "http://127.0.0.1:4497",
    locale: "en-US",
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
  webServer: {
    command:
      "NO_UPDATE_CHECK=1 node node_modules/serve/build/main.js out --listen tcp://127.0.0.1:4497 --no-clipboard --no-request-logging --no-port-switching",
    reuseExistingServer: false,
    url: "http://127.0.0.1:4497/release.json",
  },
  workers: 1,
});
