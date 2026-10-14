import { z } from "zod";

type Environment = Record<string, string | undefined>;

// Only names and controlled messages leave this module; issues may contain inputs.
export class ConfigurationError extends Error {
  readonly problems: string[];
  constructor(problems: string[]) {
    const unique = [...new Set(problems)];
    super(`Configuration needs attention:\n${unique.join("\n")}`);
    this.name = "ConfigurationError";
    this.problems = unique;
  }
}

const runtimeSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  APP_MODE: z.enum(["foundation", "live"]).default("foundation"),
  APP_ORIGIN: z.url().default("http://localhost:3000"),
  ENABLE_TEST_AUTH: z.literal("false").default("false"),
});

function parseRuntimeBase(input: Environment) {
  const parsed = runtimeSchema.safeParse(input);
  if (!parsed.success) {
    throw new ConfigurationError(parsed.error.issues.map((issue) =>
      `${issue.path.join(".")}: ${issue.path[0] === "APP_MODE"
        ? "use foundation or live; demo mode is unavailable"
        : issue.path[0] === "ENABLE_TEST_AUTH"
          ? "test authentication bypass is unavailable" : "set a valid runtime value"}`));
  }
  const origin = new URL(parsed.data.APP_ORIGIN);
  const loopback = ["localhost", "127.0.0.1", "[::1]"].includes(origin.hostname);
  if (origin.username || origin.password || origin.pathname !== "/" || origin.search || origin.hash ||
      (origin.protocol !== "https:" && !(origin.protocol === "http:" && loopback))) {
    throw new ConfigurationError(["APP_ORIGIN: use an HTTPS origin, or HTTP on loopback for local inspection; no credentials, path, query, or fragment"]);
  }
  return { ...parsed.data, APP_ORIGIN: origin.origin };
}

export function parseRuntimeEnvironment(input: Environment) {
  const runtime = parseRuntimeBase(input);
  if (runtime.APP_MODE === "live") parseIntegrationEnvironment(input);
  return runtime;
}

const requiredValue = z.string().min(1).refine((value) =>
  !/replace_|your_|example|placeholder/i.test(value), "required non-placeholder value");

function base64Bytes(length: number, minimum = false) {
  return requiredValue.refine((value) => {
    if (!/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(value)) return false;
    const bytes = Buffer.from(value, "base64");
    return bytes.toString("base64") === value && (minimum ? bytes.length >= length : bytes.length === length);
  }, "required base64 key with the documented byte length");
}

const integrationSchema = z.object({
  AUTH_SECRET: requiredValue.min(32), AUTH_GOOGLE_ID: requiredValue, AUTH_GOOGLE_SECRET: requiredValue,
  MONGODB_URI: requiredValue.refine((value) => {
    try {
      const uri = new URL(value);
      const entries = [...uri.searchParams].map(([key, value]) => [key.toLowerCase(), value.toLowerCase()]);
      const tlsDisabled = entries.some(([key, value]) => ["tls", "ssl"].includes(key ?? "") && value !== "true");
      const insecure = entries.some(([key, value]) => ["tlsinsecure", "tlsallowinvalidcertificates", "tlsallowinvalidhostnames"].includes(key ?? "") && value !== "false");
      return !tlsDisabled && !insecure && !!uri.hostname &&
        (uri.protocol === "mongodb+srv:" || (uri.protocol === "mongodb:" && uri.searchParams.get("tls") === "true"));
    } catch { return false; }
  }),
  MONGODB_DB: requiredValue.regex(/^[a-zA-Z0-9_-]+$/),
  MONGODB_KEY_VAULT_NAMESPACE: requiredValue.regex(/^[a-zA-Z0-9_-]+\.__keyVault$/),
  IDENTITY_HMAC_KEY_BASE64: base64Bytes(32, true), IDENTITY_HMAC_KEY_VERSION: z.coerce.number().int().positive(),
  ENCRYPTION_PROVIDER: z.enum(["local", "aws"]), LOCAL_CSFLE_MASTER_KEY_BASE64: z.string().optional(),
  KMS_AWS_REGION: z.string().optional(), KMS_AWS_KEY_ARN: z.string().optional(),
  SIGNIN_CLIENT_LIMIT: z.coerce.number().int().min(1).max(100).default(10),
  SIGNIN_GLOBAL_LIMIT: z.coerce.number().int().min(10).max(10_000).default(300),
});

export function parseIntegrationEnvironment(input: Environment) {
  const runtime = parseRuntimeBase(input);
  const parsed = integrationSchema.safeParse(input);
  if (!parsed.success) {
    throw new ConfigurationError(parsed.error.issues.map((issue) =>
      `${issue.path.join(".")}: required valid non-placeholder setting; see .env.example`));
  }
  const data = parsed.data;
  if (input.NEXTAUTH_URL) {
    try { if (parseRuntimeBase({ APP_ORIGIN: input.NEXTAUTH_URL }).APP_ORIGIN !== runtime.APP_ORIGIN) throw new Error("Mismatch."); }
    catch { throw new ConfigurationError(["NEXTAUTH_URL: if set, must match the canonical APP_ORIGIN"]); }
  }
  if (runtime.NODE_ENV === "production" && !runtime.APP_ORIGIN.startsWith("https://")) {
    throw new ConfigurationError(["APP_ORIGIN: live production authentication requires HTTPS"]);
  }
  if (data.MONGODB_KEY_VAULT_NAMESPACE.split(".")[0] === data.MONGODB_DB) {
    throw new ConfigurationError(["MONGODB_KEY_VAULT_NAMESPACE: keep the key vault in a separate database"]);
  }
  if (data.ENCRYPTION_PROVIDER === "local") {
    if (runtime.NODE_ENV === "production") {
      throw new ConfigurationError(["ENCRYPTION_PROVIDER: production requires AWS KMS; local master keys are forbidden"]);
    }
    if (!base64Bytes(96).safeParse(data.LOCAL_CSFLE_MASTER_KEY_BASE64).success) {
      throw new ConfigurationError(["LOCAL_CSFLE_MASTER_KEY_BASE64: set exactly 96 random bytes encoded as base64"]);
    }
  } else if (!requiredValue.safeParse(data.KMS_AWS_REGION).success ||
             !requiredValue.safeParse(data.KMS_AWS_KEY_ARN).success ||
             !/^arn:aws(?:-us-gov|-cn)?:kms:[a-z0-9-]+:\d{12}:key\/[a-zA-Z0-9-]+$/.test(data.KMS_AWS_KEY_ARN ?? "") ||
             data.KMS_AWS_KEY_ARN?.split(":")[3] !== data.KMS_AWS_REGION) {
    throw new ConfigurationError(["KMS_AWS_REGION / KMS_AWS_KEY_ARN: configure the AWS wrapping key and workload identity"]);
  }
  return { ...runtime, ...data };
}

export type IntegrationEnvironment = ReturnType<typeof parseIntegrationEnvironment>;
