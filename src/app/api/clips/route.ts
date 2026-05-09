import type { NextRequest } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase-admin";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);

  if (
    !body ||
    typeof body.eventId !== "string" ||
    typeof body.s3Key !== "string" ||
    typeof body.token !== "string" ||
    typeof body.uploaderName !== "string" ||
    typeof body.uploaderPhone !== "string"
  ) {
    return Response.json({ error: "BAD_REQUEST" }, { status: 400 });
  }

  const uploaderName = body.uploaderName.trim();
  if (uploaderName.length < 1 || uploaderName.length > 20) {
    return Response.json({ error: "BAD_REQUEST" }, { status: 400 });
  }

  const phoneClean = body.uploaderPhone.replace(/\D/g, "");
  if (!/^010\d{8}$/.test(phoneClean)) {
    return Response.json({ error: "INVALID_PHONE" }, { status: 400 });
  }

  const { eventId, s3Key, token } = body as { eventId: string; s3Key: string; token: string };

  const db = getAdminDb();
  const snap = await db.collection("events").doc(eventId).get();

  if (!snap.exists) {
    return Response.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  const data = snap.data()!;

  if (!data.sessionToken || data.sessionToken !== token) {
    return Response.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  if (data.status !== "open") {
    return Response.json({ error: "EVENT_CLOSED" }, { status: 409 });
  }

  const dupSnap = await db
    .collection("clips")
    .where("eventId", "==", eventId)
    .where("uploaderPhone", "==", phoneClean)
    .where("uploaderName", "==", uploaderName)
    .limit(1)
    .get();
  if (!dupSnap.empty) {
    return Response.json({ error: "DUPLICATE_UPLOADER" }, { status: 409 });
  }

  const clipRef = await db.collection("clips").add({
    eventId,
    s3Key,
    uploaderName,
    uploaderPhone: phoneClean,
    uploadedAt: FieldValue.serverTimestamp(),
  });

  return Response.json({ id: clipRef.id });
}
