import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import type { Account, Session } from "next-auth";
import { verifiedGoogleIdentity, providerIdentityHash, minimalSessionClaims } from "../../src/server/auth/identity.ts";
import { accountCallbacks } from "../../src/server/auth/callbacks.ts";
import { checkMutation, checkSignInQuery, readBoundedBody, signInErrorMessage } from "../../src/server/http/request-policy.ts";
import { errorResponse, ServiceError } from "../../src/server/http/errors.ts";
import { issueLimiterCookie, readLimiterId } from "../../src/server/auth/limiter-cookie.ts";

const profile = { iss: "https://accounts.google.com", sub: "synthetic-subject", email: "synthetic@fixture.invalid", email_verified: true, name: "Synthetic private name" };
const key = Buffer.alloc(32, 7).toString("base64");
const account: Account = { provider: "google", providerAccountId: profile.sub, type: "oauth" };

describe("Google identity and minimal/revocable session contract", () => {
  it("requires a valid Google issuer, subject and verified email", () => {
    expect(verifiedGoogleIdentity(profile).subject).toBe(profile.sub);
    expect(verifiedGoogleIdentity({ ...profile, iss: "accounts.google.com" }).issuer).toBe(profile.iss);
    for (const bad of [{ ...profile, iss: "https://attacker.invalid" }, { ...profile, email_verified: false }, { ...profile, sub: "" }, { ...profile, email: "bad" }]) expect(() => verifiedGoogleIdentity(bad)).toThrow(ServiceError);
  });
  it("never identifies or links accounts by email; HMAC key/version are independent", () => {
    const identity = verifiedGoogleIdentity(profile);
    const hash = providerIdentityHash(identity, key, 1);
    expect(providerIdentityHash({ ...identity, subject: "another-subject" }, key, 1)).not.toBe(hash);
    expect(providerIdentityHash(identity, key, 2)).not.toBe(hash);
    expect(providerIdentityHash(identity, Buffer.alloc(32, 8).toString("base64"), 1)).not.toBe(hash);
  });
  it("drops provider secrets/private fields and ignores client session updates", async () => {
    const id = randomUUID();
    const callbacks = accountCallbacks("https://student.invalid", { signIn: async () => ({ _id: id, sessionVersion: 2 }), validate: async () => {} });
    const jwt = await callbacks.jwt!({ token: { name: profile.name, email: profile.email, access_token: "synthetic-secret" }, account, profile, user: { id: profile.sub }, trigger: "signIn" });
    expect(Object.keys(jwt).sort()).toEqual(["authenticatedAt", "sessionVersion", "userId"]);
    const renewed = await callbacks.jwt!({ token: jwt, trigger: "update", session: { userId: randomUUID(), sessionVersion: 50, email: profile.email }, account: null, user: { id } });
    expect(renewed).toEqual(jwt);
    const session = await callbacks.session!({ session: { expires: "2026-10-20", user: { id: profile.sub }, name: profile.name } as Session, token: renewed, user: { id, email: profile.email, emailVerified: null }, newSession: { email: profile.email }, trigger: "update" });
    expect(session).toEqual({ expires: "2026-10-20", user: { id }, sessionVersion: 2, authenticatedAt: jwt.authenticatedAt });
  });
  it("fails closed on revoked accounts, invalid/expired claims, or provider failure", async () => {
    const id = randomUUID();
    const callbacks = accountCallbacks("https://student.invalid", { signIn: async () => { throw new ServiceError("UNAVAILABLE", 503); }, validate: async () => { throw new ServiceError("UNAUTHENTICATED", 401); } });
    const unverified = { ...profile, email_verified: false };
    expect(await callbacks.signIn!({ user: { id }, account, profile: unverified })).toBe(false);
    await expect(callbacks.jwt!({ token: {}, account, profile, user: { id }, trigger: "signIn" })).rejects.toMatchObject({ code: "UNAVAILABLE" });
    expect(await callbacks.jwt!({ token: { userId: id, sessionVersion: 1, authenticatedAt: Math.floor(Date.now() / 1000) }, user: { id }, account: null })).toEqual({});
    expect(await callbacks.jwt!({ token: { userId: id, sessionVersion: 1, authenticatedAt: 1 }, user: { id }, account: null })).toEqual({});
    expect(() => minimalSessionClaims({ userId: "google-id", sessionVersion: 1 })).toThrow(ServiceError);
    expect(await callbacks.redirect!({ url: "https://attacker.invalid", baseUrl: "https://attacker.invalid" })).toBe("https://student.invalid/app/today");
    expect(await callbacks.redirect!({ url: "/signin", baseUrl: "https://attacker.invalid" })).toBe("https://student.invalid/signin");
  });
});

describe("request and error boundaries", () => {
  it("uses a server-issued limiter identity and rejects forged cookies", async () => {
    const cookie = await issueLimiterCookie("synthetic-independent-secret".repeat(2), true);
    const token = cookie.split(";")[0]!.split("=")[1]!;
    expect(cookie).toContain("__Host-"); expect(cookie).toContain("HttpOnly"); expect(cookie).toContain("Secure");
    expect(await readLimiterId(token, "synthetic-independent-secret".repeat(2))).toMatch(/^[a-f0-9-]{36}$/);
    expect(await readLimiterId(token, "different-synthetic-secret".repeat(2))).toBeNull();
    expect(await readLimiterId("client-chosen-id", "synthetic-independent-secret".repeat(2))).toBeNull();
  });
  it("bounds streaming/chunked bodies and rejects OAuth scope overrides", async () => {
    const request = new Request("https://student.invalid", { method: "POST", body: "a".repeat(65) });
    await expect(readBoundedBody(request, 64)).rejects.toMatchObject({ code: "INVALID_REQUEST" });
    expect(await readBoundedBody(new Request("https://student.invalid", { method: "POST", body: "{}" }), 64)).toBe("{}");
    checkSignInQuery(new URL("https://student.invalid/api/auth/signin/google"));
    for (const query of ["scope=contacts", "redirect_uri=https://attacker.invalid", "access_type=offline"]) expect(() => checkSignInQuery(new URL(`https://student.invalid/api/auth/signin/google?${query}`))).toThrow(ServiceError);
  });
  it("rejects cross-origin and unsafe content-type mutations", () => {
    const origin = "https://student.invalid";
    checkMutation(new Request(origin, { method: "POST", headers: { origin, "content-type": "application/json" } }), origin);
    for (const headers of [{ "content-type": "application/json" }, { origin: "https://attacker.invalid", "content-type": "application/json" }, { origin, "content-type": "text/plain" }, { origin, "content-type": "application/json", "sec-fetch-site": "cross-site" }, { origin, "content-type": "application/json", "content-length": "999999" }]) expect(() => checkMutation(new Request(origin, { method: "POST", headers }), origin)).toThrow(ServiceError);
  });
  it("never reflects raw errors or provider error values and prevents caching", async () => {
    const response = errorResponse(new Error("secret uri/name/token must never appear"));
    expect(response.status).toBe(503); expect(response.headers.get("cache-control")).toContain("private, no-store");
    expect(await response.text()).not.toContain("secret uri");
    expect(signInErrorMessage("sentinel-private-value")).not.toContain("sentinel");
  });
});
