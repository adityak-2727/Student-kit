import { describe, expect, it } from "vitest";
import { ConfigurationError, parseIntegrationEnvironment, parseRuntimeEnvironment } from "../../src/server/config/schema";

// Synthetic values only. No network calls or real credentials.
const fixture = {
  AUTH_SECRET: "a".repeat(40), AUTH_GOOGLE_ID: "synthetic-client", AUTH_GOOGLE_SECRET: "synthetic-secret",
  MONGODB_URI: "mongodb+srv://synthetic.invalid/", MONGODB_DB: "daylight_test",
  MONGODB_KEY_VAULT_NAMESPACE: "daylight_test_keys.__keyVault",
  IDENTITY_HMAC_KEY_BASE64: Buffer.alloc(32, 1).toString("base64"), IDENTITY_HMAC_KEY_VERSION: "1",
  ENCRYPTION_PROVIDER: "local", LOCAL_CSFLE_MASTER_KEY_BASE64: Buffer.alloc(96, 2).toString("base64"),
};

describe("foundation configuration", () => {
  it("runs the public foundation without credentials", () => {
    expect(parseRuntimeEnvironment({}).APP_MODE).toBe("foundation");
  });
  it.each(["true", "1"])("rejects an authentication bypass (%s)", (value) => {
    expect(() => parseRuntimeEnvironment({ ENABLE_TEST_AUTH: value, NODE_ENV: "production" })).toThrow(ConfigurationError);
  });
  it.each(["live", "demo"])("rejects unavailable %s mode", (value) => {
    expect(() => parseRuntimeEnvironment({ APP_MODE: value })).toThrow(ConfigurationError);
  });
  it.each(["http://student.invalid", "https://student.invalid/path", "https://user:secret@student.invalid", "https://student.invalid/?token=secret"])("rejects unsafe origin %s", (origin) => {
    expect(() => parseRuntimeEnvironment({ APP_ORIGIN: origin })).toThrow(ConfigurationError);
  });
  it("allows HTTPS deployment and local HTTP origins", () => {
    expect(parseRuntimeEnvironment({ APP_ORIGIN: "https://student.invalid" }).APP_ORIGIN).toBe("https://student.invalid");
    expect(parseRuntimeEnvironment({ APP_ORIGIN: "http://127.0.0.1:3000" }).APP_ORIGIN).toBe("http://127.0.0.1:3000");
  });
});

describe("integration prerequisites", () => {
  it("rejects placeholders and missing settings", () => {
    expect(() => parseIntegrationEnvironment({ ...fixture, AUTH_SECRET: "replace_with_independent_random_secret" })).toThrow(ConfigurationError);
    expect(() => parseIntegrationEnvironment({})).toThrow(ConfigurationError);
  });
  it("requires a correctly sized local key", () => {
    expect(parseIntegrationEnvironment(fixture).ENCRYPTION_PROVIDER).toBe("local");
    expect(() => parseIntegrationEnvironment({ ...fixture, LOCAL_CSFLE_MASTER_KEY_BASE64: Buffer.alloc(32).toString("base64") })).toThrow(ConfigurationError);
  });
  it("forbids production local keys", () => {
    expect(() => parseIntegrationEnvironment({ ...fixture, NODE_ENV: "production" })).toThrow(/production requires AWS KMS/);
  });
  it("requires KMS settings for AWS", () => {
    expect(() => parseIntegrationEnvironment({ ...fixture, ENCRYPTION_PROVIDER: "aws" })).toThrow(/KMS_AWS_REGION/);
  });
  it.each(["mongodb://synthetic.invalid/", "mongodb+srv://synthetic.invalid/?tls=false", "mongodb+srv://synthetic.invalid/?tlsInsecure=true"])("rejects insecure MongoDB transport %s", (uri) => {
    expect(() => parseIntegrationEnvironment({ ...fixture, MONGODB_URI: uri })).toThrow(/MONGODB_URI/);
  });
  it("does not include submitted secrets in diagnostics", () => {
    const sensitive = "sentinel-sensitive-value";
    try { parseIntegrationEnvironment({ ...fixture, MONGODB_URI: sensitive }); }
    catch (error) {
      expect(error).toBeInstanceOf(ConfigurationError);
      expect(String(error)).not.toContain(sensitive);
      expect(String(error)).not.toContain(fixture.AUTH_SECRET);
      return;
    }
    throw new Error("Expected invalid configuration to fail.");
  });
});
