import { getOwnAccount } from "@/server/accounts/service";
import { errorResponse, privateHeaders } from "@/server/http/errors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET() {
  try { return Response.json({ data: await getOwnAccount() }, { headers: privateHeaders }); }
  catch (error) { return errorResponse(error); }
}
