import "server-only";
import { createHash } from "node:crypto";
import type { Db, IndexDescription, MongoClient } from "mongodb";

const validator = { $jsonSchema: {
    bsonType: "object", required: ["_id", "accountStatus", "sessionVersion", "providerIdentityHash", "providerIdentityHashVersion"],
    properties: {
      _id: { bsonType: "string" }, accountStatus: { enum: ["provisioning", "active", "deleting", "deleted"] },
      sessionVersion: { bsonType: ["int", "long", "double"], minimum: 1 },
      providerIdentityHash: { bsonType: "string" }, providerIdentityHashVersion: { bsonType: ["int", "double"], minimum: 1 },
      privatePayload: { bsonType: "binData" }, dataKeyId: { bsonType: "binData" },
    },
}, $or: [{ accountStatus: "provisioning" }, { privatePayload: { $type: "binData" }, dataKeyId: { $type: "binData" } }] };
const userIndexes: IndexDescription[] = [
  { key: { providerIdentityHashVersion: 1, providerIdentityHash: 1 }, unique: true, name: "provider_identity" },
  { key: { usernameNormalized: 1 }, unique: true, partialFilterExpression: { usernameNormalized: { $type: "string" } }, name: "username" },
];
const keyIndex: IndexDescription = { key: { keyAltNames: 1 }, unique: true, partialFilterExpression: { keyAltNames: { $exists: true } }, name: "key_alt_names" };
const rateIndex: IndexDescription = { key: { expiresAt: 1 }, expireAfterSeconds: 0, name: "bucket_expiry" };
const domainIndexes: IndexDescription[] = [
  { key: { ownerId: 1, builtInKind: 1 }, unique: true, partialFilterExpression: { builtInKind: { $type: "string" } }, name: "built_in_domain" },
  { key: { ownerId: 1, archivedAt: 1, sortOrder: 1 }, name: "domain_order" },
];

// Checksum the actual installed validation/index definition. Changes need a new migration ID.
export const accountMigration = { id: "account-foundation-v1", checksum: createHash("sha256").update(JSON.stringify({ validator, userIndexes, keyIndex, rateIndex, domainIndexes, validationLevel: "strict", validationAction: "error" })).digest("hex") };

// Run with a separate migration identity; the serving identity never needs collMod.
export async function migrateAccountFoundation(client: MongoClient, db: Db, keyVaultNamespace: string) {
  const applied = await db.collection<{ _id: string; checksum: string }>("migrations").findOne({ _id: accountMigration.id });
  if (applied && applied.checksum !== accountMigration.checksum) throw new Error("Account migration checksum mismatch; add a new migration instead of changing an applied one.");
  if (!(await db.listCollections({ name: "users" }).hasNext())) await db.createCollection("users", { validator, validationLevel: "strict", validationAction: "error" });
  else await db.command({ collMod: "users", validator, validationLevel: "strict", validationAction: "error" });
  await db.collection("users").createIndexes(userIndexes);
  const [vaultDb, vaultCollection] = keyVaultNamespace.split(".");
  if (!vaultDb || !vaultCollection) throw new Error("Invalid key vault namespace.");
  await client.db(vaultDb).collection(vaultCollection).createIndexes([keyIndex]);
  await db.collection("rateLimitBuckets").createIndexes([rateIndex]);
  await db.collection("domains").createIndexes(domainIndexes);
  await db.collection<{ _id: string; checksum: string; appliedAt: Date }>("migrations").updateOne({ _id: accountMigration.id }, { $setOnInsert: { checksum: accountMigration.checksum, appliedAt: new Date() } }, { upsert: true });
}

export async function verifyAccountFoundation(client: MongoClient, db: Db, keyVaultNamespace: string) {
  const users = await db.collection("users").indexes();
  const [vaultDb, vaultCollection] = keyVaultNamespace.split(".");
  const keys = await client.db(vaultDb!).collection(vaultCollection!).indexes();
  const limits = await db.collection("rateLimitBuckets").indexes();
  const collection = await db.listCollections({ name: "users" }).next();
  const applied = await db.collection<{ _id: string; checksum: string }>("migrations").findOne({ _id: accountMigration.id });
  const domains = await db.collection("domains").indexes();
  if (!users.some(i => i.name === "provider_identity" && i.unique) || !users.some(i => i.name === "username" && i.unique) ||
    !keys.some(i => i.name === "key_alt_names" && i.unique) || !limits.some(i => i.name === "bucket_expiry" && i.expireAfterSeconds === 0) ||
    !domains.some(i => i.name === "built_in_domain" && i.unique) || applied?.checksum !== accountMigration.checksum ||
    !collection || !("options" in collection) || !collection.options.validator || collection.options.validationAction !== "error") throw new Error("Run the account database migration before serving sign-in.");
}
