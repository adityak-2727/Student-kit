import { spawnSync } from "node:child_process";
import { describe, expect, it } from "vitest";

const synthetic = {
  NODE_ENV: "production", APP_MODE: "live", APP_ORIGIN: "https://student.invalid", ENABLE_TEST_AUTH: "false", NEXTAUTH_URL: "https://student.invalid",
  AUTH_SECRET: "synthetic-startup-secret-for-tests-only", AUTH_GOOGLE_ID: "synthetic-client", AUTH_GOOGLE_SECRET: "synthetic-secret",
  MONGODB_URI: "mongodb+srv://synthetic.invalid/", MONGODB_DB: "daylight_test", MONGODB_KEY_VAULT_NAMESPACE: "daylight_test_keys.__keyVault",
  IDENTITY_HMAC_KEY_BASE64: Buffer.alloc(32, 1).toString("base64"), IDENTITY_HMAC_KEY_VERSION: "1",
  ENCRYPTION_PROVIDER: "local", LOCAL_CSFLE_MASTER_KEY_BASE64: Buffer.alloc(96, 2).toString("base64"),
} as const;

describe("actual production command preflight", () => {
  it.each([
    { override: {}, message: "production requires AWS KMS" },
    { override: { ENABLE_TEST_AUTH: "true", APP_MODE: "foundation" }, message: "test authentication bypass is unavailable" },
  ])("exits before server/database startup for unsafe settings: $message", ({ override, message }) => {
    const result = spawnSync(process.execPath, ["--conditions=react-server", "scripts/check-config.ts", "--production", "--dependencies"], {
      cwd: process.cwd(), env: { ...process.env, ...synthetic, ...override }, encoding: "utf8", timeout: 10_000, windowsHide: true,
    });
    expect(result.status).toBe(1);
    expect(result.stderr).toContain(message);
    expect(result.stdout).not.toContain("Live configuration");
    expect(result.stderr).not.toContain(synthetic.AUTH_SECRET);
    expect(result.stderr).not.toContain(synthetic.LOCAL_CSFLE_MASTER_KEY_BASE64);
  });
});
