import "server-only";
import { MongoClient } from "mongodb";
import { getIntegrationEnvironment } from "../config/environment.ts";
import { verifyAccountFoundation } from "./schema.ts";
import { ServiceError } from "../http/errors.ts";

const globalDatabase = globalThis as typeof globalThis & { daylightDatabase?: Promise<MongoClient> };

export async function getDatabaseClient() {
  const environment = getIntegrationEnvironment();
  globalDatabase.daylightDatabase ??= (async () => {
    const client = new MongoClient(environment.MONGODB_URI, {
      tls: true, maxPoolSize: 10, minPoolSize: 0, serverSelectionTimeoutMS: 5_000,
      connectTimeoutMS: 5_000, socketTimeoutMS: 15_000, retryWrites: true,
    });
    try {
      await client.connect();
      await verifyAccountFoundation(client, client.db(environment.MONGODB_DB), environment.MONGODB_KEY_VAULT_NAMESPACE);
      return client;
    } catch {
      await client.close().catch(() => {});
      throw new ServiceError("UNAVAILABLE", 503);
    }
  })();
  try { return await globalDatabase.daylightDatabase; }
  catch { delete globalDatabase.daylightDatabase; throw new ServiceError("UNAVAILABLE", 503); }
}
