import nextEnv from "@next/env";
import { MongoClient } from "mongodb";
import { parseIntegrationEnvironment } from "../src/server/config/schema.ts";
import { migrateAccountFoundation } from "../src/server/database/schema.ts";

nextEnv.loadEnvConfig(process.cwd(), process.env.NODE_ENV !== "production", { info() {}, error() {} });
let client: MongoClient | undefined;
try {
  const environment = parseIntegrationEnvironment(process.env);
  client = new MongoClient(environment.MONGODB_URI, { tls: true, serverSelectionTimeoutMS: 5_000 });
  await client.connect();
  await migrateAccountFoundation(client, client.db(environment.MONGODB_DB), environment.MONGODB_KEY_VAULT_NAMESPACE);
  console.info("Account collection validation and unique/expiry indexes are installed.");
} catch { console.error("Database migration failed. Check private configuration, access, and duplicate index values. No credentials or database errors are printed."); process.exitCode = 1; }
finally { await client?.close(); }
