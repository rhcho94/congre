import type { NextRequest } from "next/server";
import { Timestamp } from "firebase-admin/firestore";
import { verifyIdToken } from "@/lib/auth-server";
import { getAdminDb } from "@/lib/firebase-admin";

function tsToMs(v: unknown): number | null {
  return v instanceof Timestamp ? v.toMillis() : null;
}

export async function GET(request: NextRequest) {
  let uid: string;
  try {
    const token = await verifyIdToken(request);
    uid = token.uid;
  } catch {
    return Response.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const eventId = request.nextUrl.searchParams.get("eventId");
  if (!eventId) {
    return Response.json({ error: "EVENT_ID_REQUIRED" }, { status: 400 });
  }

  try {
    const db = getAdminDb();
    const eventSnap = await db.collection("events").doc(eventId).get();

    if (!eventSnap.exists || eventSnap.data()!.hostId !== uid) {
      return Response.json({ error: "NOT_FOUND" }, { status: 404 });
    }

    const clipsSnap = await db.collection("clips").where("eventId", "==", eventId).get();

    const clips = clipsSnap.docs
      .map((d) => {
        const data = d.data();
        return {
          id: d.id,
          eventId: data.eventId as string,
          s3Key: data.s3Key as string,
          uploadedAt: tsToMs(data.uploadedAt),
          excludedAt: tsToMs(data.excludedAt),
        };
      })
      .sort((a, b) => (b.uploadedAt ?? 0) - (a.uploadedAt ?? 0));

    return Response.json({ clips });
  } catch (err) {
    console.error("[api/host/clips GET] Firestore error:", err);
    return Response.json({ error: "INTERNAL_ERROR" }, { status: 500 });
  }
}
