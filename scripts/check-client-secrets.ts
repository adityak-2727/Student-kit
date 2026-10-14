import nextEnv from "@next/env";
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";

nextEnv.loadEnvConfig(process.cwd(), false, { info() {}, error() {} });
const fields = ["AUTH_SECRET", "AUTH_GOOGLE_SECRET", "IDENTITY_HMAC_KEY_BASE64", "LOCAL_CSFLE_MASTER_KEY_BASE64", "AWS_SECRET_ACCESS_KEY", "AWS_SESSION_TOKEN"];
const secrets = fields.flatMap(name => { const value = process.env[name]; return value && value.length >= 16 && !/^replace_/i.test(value) ? [{ name, bytes: Buffer.from(value) }] : []; });
if (!secrets.length) { console.error("No configured secret values to check. Configure privately before running this bundle check."); process.exitCode = 1; }
else {
  try {
    const root = join(process.cwd(), ".next", "static");
    const files = (await readdir(root, { recursive: true, withFileTypes: true })).filter(file => file.isFile());
    if (!files.length) throw new Error("Build missing.");
    let found = false;
    for (const file of files) {
      const content = await readFile(join(file.parentPath, file.name));
      if (secrets.some(secret => content.includes(secret.bytes))) found = true;
    }
    if (found) { console.error("Configured secret value found in browser build. Release blocked; values are not printed."); process.exitCode = 1; }
    else console.info(`Checked ${files.length} static build files against ${secrets.length} configured secret values: no matches. This is a bounded check, not a complete security audit.`);
  } catch { console.error("Client bundle check failed; build the application first. No secret values are printed."); process.exitCode = 1; }
}
