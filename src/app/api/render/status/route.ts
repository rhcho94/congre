import { getRenderStatus } from "@/lib/shotstack";
import type { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const renderId = request.nextUrl.searchParams.get("renderId");
  if (!renderId) {
    return Response.json({ error: "MISSING_RENDER_ID" }, { status: 400 });
  }

  try {
    const result = await getRenderStatus(renderId);
    console.log("[render/status] renderId=%s result=%s", renderId, JSON.stringify(result));
    return Response.json(result);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "status_failed";
    return Response.json({ error: msg }, { status: 500 });
  }
}
