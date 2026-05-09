import type { NextRequest } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";

export async function GET(request: NextRequest) {
  const eventId = request.nextUrl.searchParams.get("eventId");
  const phone = request.nextUrl.searchParams.get("phone");
  const name = request.nextUrl.searchParams.get("name");

  if (!eventId || !phone || !name) {
    return Response.json({ error: "BAD_REQUEST" }, { status: 400 });
  }

  const phoneClean = phone.replace(/\D/g, "");
  if (!/^010\d{8}$/.test(phoneClean)) {
    return Response.json({ error: "INVALID_PHONE" }, { status: 400 });
  }

  const db = getAdminDb();
  const snap = await db
    .collection("clips")
    .where("eventId", "==", eventId)
    .where("uploaderPhone", "==", phoneClean)
    .where("uploaderName", "==", name)
    .limit(1)
    .get();

  return Response.json({ exists: !snap.empty });
}
