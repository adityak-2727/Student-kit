import "server-only";
import { randomUUID } from "node:crypto";
import { encode, decode } from "next-auth/jwt";
import { z } from "zod";

const salt = "daylight-signin-limiter-v1";
export function limiterCookieName(secure: boolean) { return `${secure ? "__Host-" : ""}daylight.signin-limiter`; }
export async function readLimiterId(token: string | undefined, secret: string) {
  if (!token || token.length > 2048) return null;
  try { return z.uuid().parse((await decode({ token, secret, salt }))?.limiterId); } catch { return null; }
}
export async function issueLimiterCookie(secret: string, secure: boolean) {
  const token = await encode({ token: { limiterId: randomUUID() }, secret, salt, maxAge: 3600 });
  return `${limiterCookieName(secure)}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=3600${secure ? "; Secure" : ""}`;
}
