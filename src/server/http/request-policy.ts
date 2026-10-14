import "server-only";
import { ServiceError } from "./errors.ts";

export function checkMutation(request: Request, origin: string, contentTypes: string[] = ["application/json"]) {
  if (request.headers.get("origin") !== origin || request.headers.get("sec-fetch-site") === "cross-site") {
    throw new ServiceError("FORBIDDEN", 403);
  }
  const contentType = request.headers.get("content-type")?.split(";")[0]?.trim();
  if (!contentType || !contentTypes.includes(contentType)) throw new ServiceError("INVALID_REQUEST", 400);
  const length = request.headers.get("content-length");
  if (length && (!/^\d+$/.test(length) || Number(length) > 16_384)) throw new ServiceError("INVALID_REQUEST", 400);
}

export async function readBoundedBody(request: Request, maxBytes: number) {
  const reader = request.body?.getReader();
  if (!reader) return "";
  const chunks: Uint8Array[] = []; let size = 0;
  try {
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > maxBytes) { await reader.cancel(); throw new ServiceError("INVALID_REQUEST", 400); }
      chunks.push(value);
    }
    return new TextDecoder("utf-8", { fatal: true }).decode(Buffer.concat(chunks, size));
  } catch (error) { if (error instanceof ServiceError) throw error; throw new ServiceError("INVALID_REQUEST", 400); }
  finally { reader.releaseLock(); }
}

export function checkSignInQuery(url: URL) {
  // NextAuth v4 merges query parameters into provider authorization parameters.
  // Our UI has no custom authorization parameters; reject overrides of scope, redirect_uri, etc.
  if ([...url.searchParams.keys()].some(key => key !== "callbackUrl")) throw new ServiceError("INVALID_REQUEST", 400);
}

// Fixed destinations avoid reflecting provider errors/callback URLs into markup.
export function signInErrorMessage(error: unknown) {
  if (error === "AccessDenied") return "Google sign-in was not approved. Use a Google account with a verified email and try again.";
  if (error === "SessionRequired") return "Your session has ended. Sign in to continue.";
  if (error === "OAuthCallback" || error === "OAuthSignin" || error === "Configuration") return "Sign-in could not finish. Try again shortly; if it continues, contact the app administrator.";
  return "Sign-in could not finish. Please try again.";
}
