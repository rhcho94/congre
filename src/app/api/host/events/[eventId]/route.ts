import type { NextRequest } from "next/server";
import { Timestamp } from "firebase-admin/firestore";
import { verifyIdToken } from "@/lib/auth-server";
import { getAdminDb } from "@/lib/firebase-admin";

function tsToMs(v: unknown): number | null {
  return v instanceof Timestamp ? v.toMillis() : null;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  let uid: string;
  try {
    const token = await verifyIdToken(request);
    uid = token.uid;
  } catch {
    return Response.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const { eventId } = await params;

  try {
    const db = getAdminDb();
    const snap = await db.collection("events").doc(eventId).get();

    if (!snap.exists || snap.data()!.hostId !== uid) {
      return Response.json({ error: "NOT_FOUND" }, { status: 404 });
    }

    const data = snap.data()!;

    return Response.json({
      id: snap.id,
      title: data.title as string,
      date: tsToMs(data.date),
      status: data.status as string,
      hostId: data.hostId as string,
      uploadToken: (data.uploadToken ?? undefined) as string | undefined,
      videoUrl: (data.videoUrl ?? undefined) as string | undefined,
    });
  } catch (err) {
    console.error("[api/host/events GET] Firestore error:", err);
    return Response.json({ error: "INTERNAL_ERROR" }, { status: 500 });
  }
}
