import type { NextRequest } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";

export async function GET(request: NextRequest) {
  const eventId = request.nextUrl.searchParams.get("eventId");
  const phone = request.nextUrl.searchParams.get("phone");
  const name = request.nextUrl.searchParams.get("name");
  const token = request.nextUrl.searchParams.get("token");

  if (!eventId || !phone || !name || !token) {
    return Response.json({ error: "BAD_REQUEST" }, { status: 400 });
  }

  const phoneClean = phone.replace(/\D/g, "");
  if (!/^010\d{8}$/.test(phoneClean)) {
    return Response.json({ error: "INVALID_PHONE" }, { status: 400 });
  }

  const db = getAdminDb();

  try {
    const eventSnap = await db.collection("events").doc(eventId).get();
    if (!eventSnap.exists) {
      return Response.json({ error: "EVENT_NOT_FOUND" }, { status: 404 });
    }
    const eventData = eventSnap.data()!;
    if (!eventData.sessionToken || eventData.sessionToken !== token) {
      return Response.json({ error: "UNAUTHORIZED" }, { status: 401 });
    }
  } catch (err) {
    console.error("[clips/check] event lookup failed:", err);
    return Response.json({ error: "INTERNAL_ERROR" }, { status: 500 });
  }

  const snap = await db
    .collection("clips")
    .where("eventId", "==", eventId)
    .where("uploaderPhone", "==", phoneClean)
    .where("uploaderName", "==", name)
    .limit(1)
    .get();

  return Response.json({ exists: !snap.empty });
}
