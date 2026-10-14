import { logoutAllSessions } from "@/server/accounts/service";
import { getRuntimeEnvironment } from "@/server/config/environment";
import { errorResponse, privateHeaders, ServiceError } from "@/server/http/errors";
import { checkMutation, readBoundedBody } from "@/server/http/request-policy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  try {
    checkMutation(request, getRuntimeEnvironment().APP_ORIGIN);
    const text = await readBoundedBody(request, 64);
    // No userId or other client-owned properties are accepted.
    let body: unknown;
    try { body = JSON.parse(text); } catch { throw new ServiceError("INVALID_REQUEST", 400); }
    if (!body || typeof body !== "object" || Array.isArray(body) || Object.keys(body).length) throw new ServiceError("INVALID_REQUEST", 400);
    await logoutAllSessions();
    return Response.json({ data: { signedOut: true } }, { headers: privateHeaders });
  } catch (error) { return errorResponse(error); }
}
