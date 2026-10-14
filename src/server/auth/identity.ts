import "server-only";
import { createHmac } from "node:crypto";
import { z } from "zod";
import { ServiceError } from "../http/errors.ts";
import type { IdentityPayload } from "../encryption/payloads.ts";

const googleClaims = z.object({
  iss: z.enum(["https://accounts.google.com", "accounts.google.com"]), sub: z.string().min(1).max(255),
  email: z.email().max(320), email_verified: z.literal(true), name: z.string().max(200).default(""),
});

// Called only after NextAuth validates the ID token's signature, audience, issuer and protocol checks.
export function verifiedGoogleIdentity(profile: unknown): IdentityPayload {
  const claims = googleClaims.safeParse(profile);
  if (!claims.success) throw new ServiceError("FORBIDDEN", 403);
  return { issuer: "https://accounts.google.com", subject: claims.data.sub, email: claims.data.email, name: claims.data.name };
}

export function providerIdentityHash(identity: Pick<IdentityPayload, "issuer" | "subject">, keyBase64: string, version: number) {
  return createHmac("sha256", Buffer.from(keyBase64, "base64")).update(JSON.stringify(["google-oidc", version, identity.issuer, identity.subject])).digest("hex");
}

export const sessionClaimsSchema = z.object({ userId: z.uuid(), sessionVersion: z.number().int().positive(), authenticatedAt: z.number().int().positive() });
export type SessionClaims = z.infer<typeof sessionClaimsSchema>;

export function minimalSessionClaims(value: unknown): SessionClaims {
  const claims = sessionClaimsSchema.safeParse(value);
  if (!claims.success) throw new ServiceError("UNAUTHENTICATED", 401);
  return claims.data;
}
