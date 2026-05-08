import type { NextRequest } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";

export async function GET(request: NextRequest) {
  const eventId = request.nextUrl.searchParams.get("eventId");
  const name = request.nextUrl.searchParams.get("name");

  if (!eventId || !name) {
    return Response.json({ error: "BAD_REQUEST" }, { status: 400 });
  }

  const db = getAdminDb();
  const snap = await db
    .collection("clips")
    .where("eventId", "==", eventId)
    .where("uploaderName", "==", name)
    .limit(1)
    .get();

  return Response.json({ exists: !snap.empty });
}
