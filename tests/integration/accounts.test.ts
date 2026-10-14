import { randomBytes, randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { Binary, type ClientEncryption, type Db } from "mongodb";
import { AccountRepository, type UserRecord } from "../../src/server/accounts/repository.ts";
import { createEncryption, identityPayloadSchema, PayloadEncryption } from "../../src/server/encryption/payloads.ts";
import { accountMigration, migrateAccountFoundation, verifyAccountFoundation } from "../../src/server/database/schema.ts";
import type { IntegrationEnvironment } from "../../src/server/config/schema.ts";
import { consumeSignInLimit } from "../../src/server/auth/rate-limit.ts";
import { startLocalMongo } from "../support/local-mongo.ts";
import { verifyKeyProtection } from "../../src/server/encryption/availability.ts";

let mongo: Awaited<ReturnType<typeof startLocalMongo>>;
let environment: IntegrationEnvironment;
let db: Db;
let repository: AccountRepository;
let encryption: ClientEncryption;
const identity = (subject: string) => ({ issuer: "https://accounts.google.com" as const, subject, email: "synthetic-student@fixture.invalid", name: "Synthetic private student" });
const claims = (user: UserRecord) => ({ userId: user._id, sessionVersion: user.sessionVersion, authenticatedAt: Math.floor(Date.now() / 1000) });

beforeAll(async () => {
  mongo = await startLocalMongo();
  const name = `daylight_test_${randomUUID().replaceAll("-", "")}`;
  environment = {
    NODE_ENV: "test", APP_MODE: "live", ENABLE_TEST_AUTH: "false", APP_ORIGIN: "http://localhost:3000",
    AUTH_SECRET: randomBytes(40).toString("base64"), AUTH_GOOGLE_ID: "synthetic", AUTH_GOOGLE_SECRET: "synthetic",
    MONGODB_URI: "unused-by-app-configuration", MONGODB_DB: name, MONGODB_KEY_VAULT_NAMESPACE: `${name}_keys.__keyVault`,
    IDENTITY_HMAC_KEY_BASE64: randomBytes(32).toString("base64"), IDENTITY_HMAC_KEY_VERSION: 1,
    ENCRYPTION_PROVIDER: "local", LOCAL_CSFLE_MASTER_KEY_BASE64: randomBytes(96).toString("base64"),
    SIGNIN_CLIENT_LIMIT: 10, SIGNIN_GLOBAL_LIMIT: 300,
  };
  db = mongo.client.db(name);
  await migrateAccountFoundation(mongo.client, db, environment.MONGODB_KEY_VAULT_NAMESPACE);
  encryption = createEncryption(mongo.client, environment);
  repository = new AccountRepository(db, encryption, environment);
});
afterAll(async () => { await mongo?.stop(); });

describe("real local replica-set encryption and account persistence (not Google/Atlas/KMS verification)", () => {
  it("installs and verifies durable collection validators and unique indexes", async () => {
    await verifyAccountFoundation(mongo.client, db, environment.MONGODB_KEY_VAULT_NAMESPACE);
    await migrateAccountFoundation(mongo.client, db, environment.MONGODB_KEY_VAULT_NAMESPACE);
    await db.collection<{ _id: string; checksum: string }>("migrations").updateOne({ _id: accountMigration.id }, { $set: { checksum: "synthetic-mismatch" } });
    await expect(migrateAccountFoundation(mongo.client, db, environment.MONGODB_KEY_VAULT_NAMESPACE)).rejects.toThrow("checksum mismatch");
    await db.collection<{ _id: string; checksum: string }>("migrations").updateOne({ _id: accountMigration.id }, { $set: { checksum: accountMigration.checksum } });
  });
  it("proves startup key wrapping/decryption and removes only its probe key", async () => {
    const keys = mongo.client.db(`${environment.MONGODB_DB}_keys`).collection("__keyVault");
    const before = await keys.countDocuments();
    await verifyKeyProtection(mongo.client, environment);
    expect(await keys.countDocuments()).toBe(before);
  });
  it("persists randomized BSON ciphertext and returns the same account with fresh request state", async () => {
    const user = await repository.signIn(identity("durable"));
    const raw = await db.collection<UserRecord>("users").findOne({ _id: user._id }); // no automatic decryption
    expect(raw?.privatePayload).toBeInstanceOf(Binary);
    expect(raw?.privatePayload?.sub_type).toBe(Binary.SUBTYPE_ENCRYPTED);
    expect(Buffer.from(raw!.privatePayload!.buffer).includes(Buffer.from("Synthetic private student"))).toBe(false);
    expect(raw).not.toHaveProperty("email"); expect(raw).not.toHaveProperty("subject"); expect(raw).not.toHaveProperty("name");
    const decrypted = await repository.readIdentity(claims(user), user._id);
    expect(decrypted).toEqual(identity("durable"));
    const freshEncryption = createEncryption(mongo.client, environment);
    const fresh = new AccountRepository(db, freshEncryption, environment);
    expect((await fresh.signIn(identity("durable")))._id).toBe(user._id);
    const twice = await new PayloadEncryption(freshEncryption).encrypt({ ownerId: user._id, documentId: user._id, recordKind: "user" }, decrypted, identityPayloadSchema, user.dataKeyId!);
    expect(Buffer.from(twice.buffer).equals(raw!.privatePayload!.buffer)).toBe(false);
  });
  it("makes concurrent first login race-safe with one user and one wrapped key", async () => {
    const users = await Promise.all(Array.from({ length: 8 }, () => repository.signIn(identity("concurrent"))));
    expect(new Set(users.map(user => user._id)).size).toBe(1);
    expect(await db.collection<UserRecord>("users").countDocuments({ _id: users[0]!._id })).toBe(1);
    expect(await mongo.client.db(`${environment.MONGODB_DB}_keys`).collection("__keyVault").countDocuments({ keyAltNames: `user:${users[0]!._id}` })).toBe(1);
    expect(await db.collection("domains").countDocuments({ ownerId: users[0]!._id })).toBe(4);
    expect(await db.collection("domains").countDocuments({ ownerId: users[0]!._id, enabled: true })).toBe(0);
  });
  it("denies cross-user access and stale sessions at the repository boundary", async () => {
    const first = await repository.signIn(identity("owner-a")); const second = await repository.signIn(identity("owner-b"));
    await expect(repository.readIdentity(claims(first), second._id)).rejects.toMatchObject({ code: "NOT_FOUND", status: 404 });
    await repository.logoutAll(claims(first));
    await expect(repository.readIdentity(claims(first), first._id)).rejects.toMatchObject({ code: "UNAUTHENTICATED", status: 401 });
    const fresh = await repository.signIn(identity("owner-a"));
    expect(fresh.sessionVersion).toBe(first.sessionVersion + 1);
    expect(await repository.readIdentity(claims(second), second._id)).toEqual(identity("owner-b"));
  });
  it("rejects ciphertext copied to a different owner/document/kind", async () => {
    const user = await repository.signIn(identity("binding"));
    const payloads = new PayloadEncryption(encryption);
    for (const binding of [{ ownerId: randomUUID(), documentId: user._id, recordKind: "user" }, { ownerId: user._id, documentId: randomUUID(), recordKind: "user" }, { ownerId: user._id, documentId: user._id, recordKind: "task" }]) {
      await expect(payloads.decrypt(binding, user.privatePayload!, identityPayloadSchema)).rejects.toMatchObject({ code: "UNAVAILABLE" });
    }
  });
  it("rejects tampering and wrong master keys without overwriting ciphertext", async () => {
    const user = await repository.signIn(identity("key-failure"));
    const corrupted = Buffer.from(user.privatePayload!.buffer); corrupted[corrupted.length - 1]! ^= 1;
    await expect(new PayloadEncryption(encryption).decrypt({ ownerId: user._id, documentId: user._id, recordKind: "user" }, new Binary(corrupted, Binary.SUBTYPE_ENCRYPTED), identityPayloadSchema)).rejects.toMatchObject({ code: "UNAVAILABLE" });
    const wrong = new AccountRepository(db, createEncryption(mongo.client, { ...environment, LOCAL_CSFLE_MASTER_KEY_BASE64: randomBytes(96).toString("base64") }), environment);
    await expect(wrong.signIn(identity("key-failure"))).rejects.toMatchObject({ code: "UNAVAILABLE" });
    expect(Buffer.from((await db.collection<UserRecord>("users").findOne({ _id: user._id }))!.privatePayload!.buffer).equals(user.privatePayload!.buffer)).toBe(true);
  });
  it("rejects plaintext updates in MongoDB independently of repository code", async () => {
    const user = await repository.signIn(identity("plaintext"));
    await expect(db.collection<{ _id: string; privatePayload: unknown }>("users").updateOne({ _id: user._id }, { $set: { privatePayload: "plaintext must fail" } })).rejects.toMatchObject({ code: 121 });
  });
  it("fails closed when a retained data key is missing without recreating private data", async () => {
    const user = await repository.signIn(identity("missing-key"));
    await encryption.deleteKey(user.dataKeyId!);
    const fresh = new AccountRepository(db, createEncryption(mongo.client, environment), environment);
    await expect(fresh.signIn(identity("missing-key"))).rejects.toMatchObject({ code: "UNAVAILABLE" });
    expect(Buffer.from((await db.collection<UserRecord>("users").findOne({ _id: user._id }))!.privatePayload!.buffer).equals(user.privatePayload!.buffer)).toBe(true);
  });
  it("resumes interrupted provisioning and never reactivates a deleting account", async () => {
    const user = await repository.signIn(identity("retry"));
    await db.collection<UserRecord>("users").updateOne({ _id: user._id }, { $set: { accountStatus: "provisioning" }, $unset: { privatePayload: "", dataKeyId: "" } });
    expect((await repository.signIn(identity("retry")))._id).toBe(user._id);
    await db.collection<UserRecord>("users").updateOne({ _id: user._id }, { $set: { accountStatus: "deleting" } });
    await expect(repository.signIn(identity("retry"))).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
  it("shares rate limits across callers and expires logically without waiting for TTL", async () => {
    const time = new Date("2026-10-14T09:00:00Z");
    await Promise.all(Array.from({ length: 10 }, () => consumeSignInLimit(db, "synthetic-caller", environment.IDENTITY_HMAC_KEY_BASE64, time)));
    await expect(consumeSignInLimit(db, "synthetic-caller", environment.IDENTITY_HMAC_KEY_BASE64, time)).rejects.toMatchObject({ status: 429 });
    await consumeSignInLimit(db, "synthetic-caller", environment.IDENTITY_HMAC_KEY_BASE64, new Date(time.getTime() + 60_000));
  });
  it("proves transaction support with rollback on this temporary topology", async () => {
    const session = mongo.client.startSession();
    const id = randomUUID();
    try {
      await expect(session.withTransaction(async () => { await db.collection<{ _id: string }>("transactionProbe").insertOne({ _id: id }, { session }); throw new Error("synthetic rollback"); })).rejects.toThrow("synthetic rollback");
      expect(await db.collection<{ _id: string }>("transactionProbe").countDocuments({ _id: id })).toBe(0);
    } finally { await session.endSession(); }
  });
});
