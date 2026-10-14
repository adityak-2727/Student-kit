import "server-only";
import { randomUUID } from "node:crypto";
import { Binary, ClientEncryption, MongoServerError, type Db } from "mongodb";
import type { IntegrationEnvironment } from "../config/schema.ts";
import { identityPayloadSchema, PayloadEncryption, type IdentityPayload } from "../encryption/payloads.ts";
import { providerIdentityHash, type SessionClaims } from "../auth/identity.ts";
import { ServiceError } from "../http/errors.ts";

export interface UserRecord {
  _id: string; providerIdentityHash: string; providerIdentityHashVersion: number;
  accountStatus: "provisioning" | "active" | "deleting" | "deleted"; sessionVersion: number;
  onboardingState: "pending" | "complete"; discoverable: boolean; shareMetrics: boolean;
  dataKeyId?: Binary; privatePayload?: Binary; schemaVersion: number; revision: number;
  createdAt: Date; updatedAt: Date;
}

export class AccountRepository {
  private readonly users;
  private readonly payloads;
  private readonly db: Db;
  private readonly encryption: ClientEncryption;
  private readonly environment: IntegrationEnvironment;
  constructor(db: Db, encryption: ClientEncryption, environment: IntegrationEnvironment) {
    this.db = db; this.encryption = encryption; this.environment = environment;
    this.users = db.collection<UserRecord>("users");
    this.payloads = new PayloadEncryption(encryption);
  }

  async signIn(identity: IdentityPayload) {
    const hash = providerIdentityHash(identity, this.environment.IDENTITY_HMAC_KEY_BASE64, this.environment.IDENTITY_HMAC_KEY_VERSION);
    const lookup = { providerIdentityHash: hash, providerIdentityHashVersion: this.environment.IDENTITY_HMAC_KEY_VERSION };
    try {
      // An interrupted first login remains retryable. No plaintext identity is stored in the reservation.
      const now = new Date();
      try {
        await this.users.updateOne(lookup, { $setOnInsert: {
          _id: randomUUID(), ...lookup, accountStatus: "provisioning", sessionVersion: 1,
          onboardingState: "pending", discoverable: false, shareMetrics: false,
          createdAt: now, updatedAt: now, schemaVersion: 1, revision: 1,
        } }, { upsert: true });
      } catch (error) { if (!(error instanceof MongoServerError && error.code === 11000)) throw error; }
      const reserved = await this.users.findOne(lookup);
      if (!reserved || ["deleting", "deleted"].includes(reserved.accountStatus)) throw new ServiceError("FORBIDDEN", 403);
      if (reserved.accountStatus === "active") {
        // Verify the retained key and binding before issuing a fresh session. Failure never overwrites data.
        const retained = await this.readIdentity({ userId: reserved._id, sessionVersion: reserved.sessionVersion, authenticatedAt: Math.floor(Date.now() / 1000) }, reserved._id);
        if (retained.issuer !== identity.issuer || retained.subject !== identity.subject) throw new ServiceError("UNAVAILABLE", 503);
        return reserved;
      }
      const keyAltName = `user:${reserved._id}`;
      let key = await this.encryption.getKeyByAltName(keyAltName);
      if (!key) {
        try {
          await this.encryption.createDataKey(this.environment.ENCRYPTION_PROVIDER, {
            keyAltNames: [keyAltName],
            ...(this.environment.ENCRYPTION_PROVIDER === "aws" ? { masterKey: { region: this.environment.KMS_AWS_REGION!, key: this.environment.KMS_AWS_KEY_ARN! } } : {}),
          });
        } catch (error) { if (!(error instanceof MongoServerError && error.code === 11000)) throw error; }
        key = await this.encryption.getKeyByAltName(keyAltName);
      }
      if (!key || !(key._id instanceof Binary)) throw new ServiceError("UNAVAILABLE", 503);
      const privatePayload = await this.payloads.encrypt({ ownerId: reserved._id, documentId: reserved._id, recordKind: "user" }, identity, identityPayloadSchema, key._id);
      // Built-in kinds are queryable metadata. Onboarding chooses which to enable; no choice is inferred.
      for (const [sortOrder, builtInKind] of ["study", "fitness", "relationships", "finance"].entries()) {
        await this.db.collection<{ _id: string; ownerId: string; builtInKind: string; enabled: boolean; sortOrder: number; createdAt: Date; revision: number }>("domains").updateOne({ ownerId: reserved._id, builtInKind }, { $setOnInsert: { _id: randomUUID(), ownerId: reserved._id, builtInKind, sortOrder, enabled: false, createdAt: now, revision: 1 } }, { upsert: true });
      }
      await this.users.updateOne({ _id: reserved._id, accountStatus: "provisioning", revision: reserved.revision }, {
        $set: { dataKeyId: key._id, privatePayload, accountStatus: "active", updatedAt: new Date() }, $inc: { revision: 1 },
      });
      const user = await this.users.findOne({ _id: reserved._id, accountStatus: "active" });
      if (!user) throw new ServiceError("UNAVAILABLE", 503);
      return user;
    } catch (error) {
      if (error instanceof ServiceError) throw error;
      throw new ServiceError("UNAVAILABLE", 503);
    }
  }

  async requireAccount(claims: SessionClaims) {
    const user = await this.users.findOne({ _id: claims.userId, accountStatus: "active", sessionVersion: claims.sessionVersion });
    if (!user) throw new ServiceError("UNAUTHENTICATED", 401);
    return user;
  }

  async readIdentity(claims: SessionClaims, recordId: string) {
    // Authorization is checked here, before fetch/decryption, even for internal callers.
    const user = await this.requireAccount(claims);
    if (recordId !== user._id) throw new ServiceError("NOT_FOUND", 404);
    if (!user.privatePayload) throw new ServiceError("UNAVAILABLE", 503);
    return this.payloads.decrypt({ ownerId: user._id, documentId: user._id, recordKind: "user" }, user.privatePayload, identityPayloadSchema);
  }

  async logoutAll(claims: SessionClaims) {
    await this.requireAccount(claims);
    const result = await this.users.updateOne({ _id: claims.userId, accountStatus: "active", sessionVersion: claims.sessionVersion }, { $inc: { sessionVersion: 1, revision: 1 }, $set: { updatedAt: new Date() } });
    if (result.modifiedCount !== 1) throw new ServiceError("UNAUTHENTICATED", 401);
  }
}
