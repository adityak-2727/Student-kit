export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Process liveness only; intentionally reveals no dependency configuration.
export function GET() {
  return Response.json({ data: { status: "ok" } }, { headers: { "Cache-Control": "no-store" } });
}
