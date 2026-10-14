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
    parseRuntimeEnvironment(environment);
    console.info("Foundation configuration is valid. Sign-in and database integration are not implemented yet.");
  }
} catch (error) {
  console.error(error instanceof ConfigurationError ? error.message : "Configuration validation failed. Check local configuration privately.");
  process.exitCode = 1;
}
