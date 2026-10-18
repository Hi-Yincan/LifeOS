import { defineConfig } from "@playwright/test";
import publicConfig from "playwright.public.config";

process.env.PUBLIC_DEPLOYMENT = "1";

export default defineConfig({
  ...publicConfig,
  fullyParallel: false,
  retries: 0,
  testMatch: ["dashboard.spec.ts", "product.spec.ts", "public.spec.ts"],
  use: {
    ...publicConfig.use,
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
});
