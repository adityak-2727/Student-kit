import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/shell", fullyParallel: false, forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0, reporter: "list",
  use: { baseURL: "http://127.0.0.1:3100", browserName: "chromium", trace: "retain-on-failure" },
  webServer: {
    command: "pnpm dev --port 3100", url: "http://127.0.0.1:3100", reuseExistingServer: false,
    timeout: 60_000,
    env: { APP_MODE: "foundation", ENABLE_TEST_AUTH: "false", APP_ORIGIN: "http://localhost:3100" },
  },
});
