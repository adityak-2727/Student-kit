import "server-only";
import { randomUUID } from "node:crypto";

export class ServiceError extends Error {
  readonly code: "UNAUTHENTICATED" | "NOT_FOUND" | "FORBIDDEN" | "UNAVAILABLE" | "INVALID_REQUEST" | "RATE_LIMITED";
  readonly status: number;
  constructor(code: ServiceError["code"], status: number) {
    super(code);
    this.code = code; this.status = status;
  }
}

const messages = {
  UNAUTHENTICATED: "Sign in again to continue.", NOT_FOUND: "That record is unavailable.",
  FORBIDDEN: "This request is not permitted.", UNAVAILABLE: "The account service is unavailable. Try again shortly.",
  INVALID_REQUEST: "Check the request and try again.", RATE_LIMITED: "Too many attempts. Please wait before trying again.",
};

export const privateHeaders = { "Cache-Control": "private, no-store, max-age=0", "Pragma": "no-cache", "Vary": "Cookie" };

export function errorResponse(error: unknown) {
  const safe = error instanceof ServiceError ? error : new ServiceError("UNAVAILABLE", 503);
  return Response.json({ error: { code: safe.code, message: messages[safe.code], requestId: randomUUID() } }, {
    status: safe.status, headers: { ...privateHeaders, ...(safe.status === 429 ? { "Retry-After": "60" } : {}) },
  });
}
