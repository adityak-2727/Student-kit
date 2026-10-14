import "server-only";
import { randomUUID } from "node:crypto";
import { MongoClient, type ClientEncryption } from "mongodb";
import type { IntegrationEnvironment } from "../config/schema.ts";
import { verifyAccountFoundation } from "../database/schema.ts";
import { createEncryption } from "./payloads.ts";
import { ServiceError } from "../http/errors.ts";

export async function verifyKeyProtection(client: MongoClient, environment: IntegrationEnvironment) {
  const encryption = createEncryption(client, environment);
  let key: Awaited<ReturnType<ClientEncryption["createDataKey"]>> | undefined;
  try {
    key = await encryption.createDataKey(environment.ENCRYPTION_PROVIDER, {
      keyAltNames: [`startup-probe:${randomUUID()}`],
      ...(environment.ENCRYPTION_PROVIDER === "aws" ? { masterKey: { region: environment.KMS_AWS_REGION!, key: environment.KMS_AWS_KEY_ARN! } } : {}),
    });
    // Fresh libmongocrypt context ensures unwrap permissions are tested, not a newly created key cache.
    const fresh = createEncryption(client, environment);
    const ciphertext = await fresh.encrypt("daylight-key-availability", { keyId: key, algorithm: "AEAD_AES_256_CBC_HMAC_SHA_512-Random" });
    if (await fresh.decrypt(ciphertext) !== "daylight-key-availability") throw new Error("Key unavailable.");
  } catch { throw new ServiceError("UNAVAILABLE", 503); }
  finally { if (key) { try { await encryption.deleteKey(key); } catch { throw new ServiceError("UNAVAILABLE", 503); } } }
}

export async function verifyAccountDependencies(environment: IntegrationEnvironment) {
  const client = new MongoClient(environment.MONGODB_URI, { tls: true, serverSelectionTimeoutMS: 5_000, connectTimeoutMS: 5_000, socketTimeoutMS: 15_000 });
  try {
    await client.connect();
    await verifyAccountFoundation(client, client.db(environment.MONGODB_DB), environment.MONGODB_KEY_VAULT_NAMESPACE);
    await verifyKeyProtection(client, environment);
  } catch { throw new ServiceError("UNAVAILABLE", 503); }
  finally { await client.close().catch(() => {}); }
}
