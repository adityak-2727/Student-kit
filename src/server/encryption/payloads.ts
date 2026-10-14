import "server-only";
import { z } from "zod";
import { Binary, ClientEncryption, type MongoClient } from "mongodb";
import type { IntegrationEnvironment } from "../config/schema.ts";
import { ServiceError } from "../http/errors.ts";

export const identityPayloadSchema = z.object({
  issuer: z.literal("https://accounts.google.com"), subject: z.string().min(1).max(255),
  email: z.email().max(320), name: z.string().max(200),
}).strict();
export type IdentityPayload = z.infer<typeof identityPayloadSchema>;
export type PayloadBinding = { ownerId: string; documentId: string; recordKind: string };

export function createEncryption(client: MongoClient, environment: Pick<IntegrationEnvironment, "MONGODB_KEY_VAULT_NAMESPACE" | "ENCRYPTION_PROVIDER" | "LOCAL_CSFLE_MASTER_KEY_BASE64" | "KMS_AWS_KEY_ARN" | "KMS_AWS_REGION">) {
  return new ClientEncryption(client, {
    keyVaultNamespace: environment.MONGODB_KEY_VAULT_NAMESPACE,
    kmsProviders: environment.ENCRYPTION_PROVIDER === "local"
      ? { local: { key: Buffer.from(environment.LOCAL_CSFLE_MASTER_KEY_BASE64!, "base64") } }
      : { aws: {} }, // Driver refreshes credentials using the official AWS SDK provider chain.
  });
}

export class PayloadEncryption {
  private readonly encryption: ClientEncryption;
  constructor(encryption: ClientEncryption) { this.encryption = encryption; }

  async encrypt<T>(binding: PayloadBinding, content: T, schema: z.ZodType<T>, keyId: Binary) {
    try {
      const envelope = { schemaVersion: 1, ...binding, content: schema.parse(content) };
      const encrypted = await this.encryption.encrypt(JSON.stringify(envelope), { keyId, algorithm: "AEAD_AES_256_CBC_HMAC_SHA_512-Random" });
      assertCiphertext(encrypted);
      return encrypted;
    } catch { throw new ServiceError("UNAVAILABLE", 503); }
  }

  async decrypt<T>(binding: PayloadBinding, ciphertext: Binary, schema: z.ZodType<T>): Promise<T> {
    try {
      assertCiphertext(ciphertext);
      const plaintext: unknown = await this.encryption.decrypt(ciphertext);
      if (typeof plaintext !== "string") throw new Error("Invalid payload.");
      const envelope = z.object({ schemaVersion: z.literal(1), ownerId: z.string(), documentId: z.string(), recordKind: z.string(), content: schema }).strict().parse(JSON.parse(plaintext));
      if (envelope.ownerId !== binding.ownerId || envelope.documentId !== binding.documentId || envelope.recordKind !== binding.recordKind) throw new Error("Payload binding mismatch.");
      return envelope.content;
    } catch { throw new ServiceError("UNAVAILABLE", 503); }
  }
}

export function assertCiphertext(value: unknown): asserts value is Binary {
  if (!(value instanceof Binary) || value.sub_type !== Binary.SUBTYPE_ENCRYPTED) throw new ServiceError("UNAVAILABLE", 503);
}
