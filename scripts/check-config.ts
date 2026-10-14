import nextEnv from "@next/env";
import { ConfigurationError, parseIntegrationEnvironment, parseRuntimeEnvironment } from "../src/server/config/schema.ts";

const production = process.argv.includes("--production") || process.env.NODE_ENV === "production";
nextEnv.loadEnvConfig(process.cwd(), !production, { info() {}, error() {} });
const environment = { ...process.env, ...(production ? { NODE_ENV: "production" } : {}) };

try {
  if (process.argv.includes("--integration")) {
    parseIntegrationEnvironment(environment);
    console.info("Integration prerequisites are valid. Provider connections and encryption have not been tested.");
  } else {
    const runtime = parseRuntimeEnvironment(environment);
    if (runtime.APP_MODE === "live" && process.argv.includes("--dependencies")) {
      const { verifyAccountDependencies } = await import("../src/server/encryption/availability.ts");
      await verifyAccountDependencies(parseIntegrationEnvironment(environment));
    }
    console.info(runtime.APP_MODE === "live" ? (process.argv.includes("--dependencies") ? "Live configuration, database indexes and key protection are available." : "Live configuration is valid. External connections are checked separately.") : "Public preview configuration is valid. Account integration is disabled.");
  }
} catch (error) {
  console.error(error instanceof ConfigurationError ? error.message : "Configuration validation failed. Check local configuration privately.");
  process.exitCode = 1;
}
