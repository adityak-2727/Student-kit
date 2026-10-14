import nextEnv from "@next/env";
import { randomUUID } from "node:crypto";
import { Binary, MongoClient } from "mongodb";
import { parseIntegrationEnvironment } from "../src/server/config/schema.ts";
import { createEncryption, PayloadEncryption } from "../src/server/encryption/payloads.ts";
import { z } from "zod";

// Only an explicit, dedicated test database may receive this synthetic verification record.
nextEnv.loadEnvConfig(process.cwd(), process.env.NODE_ENV !== "production", { info() {}, error() {} });
let client: MongoClient | undefined;
try {
  const environment = parseIntegrationEnvironment(process.env);
  if (!/^daylight_verify_[a-z0-9_]+$/.test(environment.MONGODB_DB) || environment.MONGODB_KEY_VAULT_NAMESPACE !== `${environment.MONGODB_DB}_keys.__keyVault`) throw new Error("Dedicated verification databases required.");
  client = new MongoClient(environment.MONGODB_URI, { tls: true, serverSelectionTimeoutMS: 5_000 });
  await client.connect();
  const encryption = createEncryption(client, environment);
  const id = randomUUID();
  const key = await encryption.createDataKey(environment.ENCRYPTION_PROVIDER, environment.ENCRYPTION_PROVIDER === "aws" ? { masterKey: { region: environment.KMS_AWS_REGION!, key: environment.KMS_AWS_KEY_ARN! } } : {});
  const schema = z.object({ text: z.literal("synthetic encryption verification") }).strict();
  const binding = { ownerId: id, documentId: id, recordKind: "verification" };
  const payloads = new PayloadEncryption(encryption);
  const privatePayload = await payloads.encrypt(binding, { text: "synthetic encryption verification" }, schema, key);
  const collection = client.db(environment.MONGODB_DB).collection<{ _id: string; privatePayload: Binary }>("encryptionVerification");
  try {
    await collection.insertOne({ _id: id, privatePayload });
    // This client has no autoEncryption setting, so this is an independent raw database read.
    const raw = await collection.findOne({ _id: id });
    if (!raw || raw.privatePayload.sub_type !== Binary.SUBTYPE_ENCRYPTED || Buffer.from(raw.privatePayload.buffer).includes(Buffer.from("synthetic encryption verification"))) throw new Error("Raw storage verification failed.");
    await payloads.decrypt(binding, raw.privatePayload, schema);
    console.info(`Native randomized encryption, raw BSON subtype 6, and authorized decryption passed (${environment.ENCRYPTION_PROVIDER}). No keys/content printed.`);
  } finally { await collection.deleteOne({ _id: id }); await encryption.deleteKey(key); }
} catch { console.error("Encryption verification failed or prerequisites are missing. Use the dedicated verification runbook; no secrets are printed."); process.exitCode = 1; }
finally { await client?.close(); }
