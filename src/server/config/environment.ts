import "server-only";
import { parseRuntimeEnvironment } from "./schema";

export function getRuntimeEnvironment() {
  return parseRuntimeEnvironment(process.env);
}
