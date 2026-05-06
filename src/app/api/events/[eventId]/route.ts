import type { NextRequest } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  const { eventId } = await params;
  const token = request.nextUrl.searchParams.get("token");

  if (!token) {
    return Response.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  const db = getAdminDb();
  const snap = await db.collection("events").doc(eventId).get();

  if (!snap.exists) {
    return Response.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  const data = snap.data()!;

  if (!data.sessionToken || data.sessionToken !== token) {
    return Response.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  return Response.json({ id: snap.id, title: data.title as string });
}
