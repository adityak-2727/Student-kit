import "server-only";
import { parseIntegrationEnvironment, parseRuntimeEnvironment } from "./schema.ts";

export function getRuntimeEnvironment() {
  return parseRuntimeEnvironment(process.env);
}

export function getIntegrationEnvironment() {
  if (getRuntimeEnvironment().APP_MODE !== "live") throw new Error("Account integration is disabled.");
  return parseIntegrationEnvironment(process.env);
}
