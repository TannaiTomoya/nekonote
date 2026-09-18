import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests",
  testMatch: "**/*.spec.ts",
  fullyParallel: false,
  workers: 1,
  timeout: 45000,
  expect: { timeout: 10000 },
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: process.env.TEST_BASE_URL || "http://127.0.0.1:3100",
    channel: "chrome",
    viewport: { width: 1280, height: 900 },
    locale: "ja-JP",
    timezoneId: "Asia/Tokyo",
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
  outputDir: "test-results",
});
