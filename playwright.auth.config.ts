import { defineConfig } from "@playwright/test";

// Synthetic provider configuration exercises protocol/error surfaces only. No identity bypass,
// session minting, Google success, or persistent browser fixture is installed.
export default defineConfig({
  testDir: "./tests/auth-browser", fullyParallel: false, retries: 0, reporter: "list",
  use: { baseURL: "http://127.0.0.1:3101", browserName: "chromium" },
  webServer: {
    command: "pnpm dev --port 3101", url: "http://127.0.0.1:3101/signin", reuseExistingServer: false, timeout: 60_000,
    env: {
      APP_MODE: "live", ENABLE_TEST_AUTH: "false", APP_ORIGIN: "http://127.0.0.1:3101", NEXTAUTH_URL: "http://127.0.0.1:3101",
      AUTH_SECRET: "synthetic-browser-secret-for-protocol-tests-only", AUTH_GOOGLE_ID: "synthetic-client", AUTH_GOOGLE_SECRET: "synthetic-secret",
      MONGODB_URI: "mongodb+srv://integration-unavailable.invalid/", MONGODB_DB: "daylight_browser_test", MONGODB_KEY_VAULT_NAMESPACE: "daylight_browser_test_keys.__keyVault",
      IDENTITY_HMAC_KEY_BASE64: Buffer.alloc(32, 17).toString("base64"), IDENTITY_HMAC_KEY_VERSION: "1",
      ENCRYPTION_PROVIDER: "local", LOCAL_CSFLE_MASTER_KEY_BASE64: Buffer.alloc(96, 18).toString("base64"),
    },
  },
});
