import { randomBytes } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const target = fileURLToPath(new URL("../.env.local", import.meta.url));
let template: string;
try { template = await readFile(target, "utf8"); }
catch (error) {
  if (!(error instanceof Error && "code" in error && error.code === "ENOENT")) throw new Error("Could not read private configuration.");
  template = await readFile(new URL("../.env.example", import.meta.url), "utf8");
}
let generated = 0;
for (const [name, bytes] of [["AUTH_SECRET", 40], ["IDENTITY_HMAC_KEY_BASE64", 32], ["LOCAL_CSFLE_MASTER_KEY_BASE64", 96]] as const) {
  const pattern = new RegExp(`^${name}=(?:replace_[^\\r\\n]*|)\\r?$`, "m");
  if (pattern.test(template)) { template = template.replace(pattern, `${name}=${randomBytes(bytes).toString("base64")}`); generated++; }
}
if (generated) await writeFile(target, template, { encoding: "utf8", mode: 0o600 });
console.info(`Prepared ${generated} missing local secrets in .env.local; retained existing values. Google/Atlas still need private setup. No values printed.`);
