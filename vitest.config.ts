import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  resolve: { alias: { "server-only": fileURLToPath(new URL("./tests/support/server-only.ts", import.meta.url)) } },
  test: { environment: "node", include: ["tests/unit/**/*.test.ts"], passWithNoTests: false },
});
