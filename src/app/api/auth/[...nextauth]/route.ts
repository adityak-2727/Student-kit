import NextAuth from "next-auth";
import { NextRequest } from "next/server";
import { getAuthOptions } from "@/server/auth/options";
import { getIntegrationEnvironment, getRuntimeEnvironment } from "@/server/config/environment";
import { errorResponse, privateHeaders, ServiceError } from "@/server/http/errors";
import { checkMutation, checkSignInQuery, readBoundedBody } from "@/server/http/request-policy";
import { getDatabaseClient } from "@/server/database/connection";
import { consumeSignInLimit } from "@/server/auth/rate-limit";
import { issueLimiterCookie, limiterCookieName, readLimiterId } from "@/server/auth/limiter-cookie";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function handle(request: NextRequest, context: { params: Promise<{ nextauth: string[] }> }) {
  try {
    if (getRuntimeEnvironment().APP_MODE !== "live") throw new ServiceError("UNAVAILABLE", 503);
    const environment = getIntegrationEnvironment();
    // Host/forwarding headers never determine redirects or the provider callback origin.
    if (request.headers.get("host") !== new URL(environment.APP_ORIGIN).host) throw new ServiceError("FORBIDDEN", 403);
    const action = (await context.params).nextauth[0];
    if (action === "signin") checkSignInQuery(request.nextUrl);
    const secure = environment.APP_ORIGIN.startsWith("https://");
    const limiterId = await readLimiterId(request.cookies.get(limiterCookieName(secure))?.value, environment.AUTH_SECRET);
    let boundedRequest = request;
    if (request.method === "POST") {
      checkMutation(request, environment.APP_ORIGIN, ["application/x-www-form-urlencoded", "application/json"]);
      const body = await readBoundedBody(request, 16_384);
      boundedRequest = new NextRequest(request.url, { method: "POST", headers: request.headers, body });
      if (action === "signin") {
        if (!limiterId) throw new ServiceError("FORBIDDEN", 403);
        const client = await getDatabaseClient();
        // Signed per-browser identity plus a separate higher deployment safety ceiling.
        // Neither client-selected IDs nor untrusted X-Forwarded-For headers are used.
        const db = client.db(environment.MONGODB_DB);
        await consumeSignInLimit(db, limiterId, environment.IDENTITY_HMAC_KEY_BASE64, new Date(), environment.SIGNIN_CLIENT_LIMIT);
        await consumeSignInLimit(db, "deployment", environment.IDENTITY_HMAC_KEY_BASE64, new Date(), environment.SIGNIN_GLOBAL_LIMIT);
      }
    }
    const response: Response = await NextAuth(getAuthOptions())(boundedRequest, context);
    if (request.method === "GET" && action === "csrf" && !limiterId) response.headers.append("Set-Cookie", await issueLimiterCookie(environment.AUTH_SECRET, secure));
    for (const [key, value] of Object.entries(privateHeaders)) response.headers.set(key, value);
    return response;
  } catch (error) { return errorResponse(error); }
}

export { handle as GET, handle as POST };
