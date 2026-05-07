import type { NextRequest } from "next/server";
import { Timestamp } from "firebase-admin/firestore";
import { verifyIdToken } from "@/lib/auth-server";
import { getAdminDb } from "@/lib/firebase-admin";

function tsToMs(v: unknown): number | null {
  return v instanceof Timestamp ? v.toMillis() : null;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ clipId: string }> }
) {
  let uid: string;
  try {
    const decoded = await verifyIdToken(request);
    uid = decoded.uid;
  } catch {
    return Response.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const { clipId } = await params;

  const body = await request.json().catch(() => null) as { excluded?: unknown } | null;
  if (!body || typeof body.excluded !== "boolean") {
    return Response.json({ error: "INVALID_BODY" }, { status: 400 });
  }
  const { excluded } = body;

  try {
    const db = getAdminDb();

    const clipSnap = await db.collection("clips").doc(clipId).get();
    if (!clipSnap.exists) {
      return Response.json({ error: "NOT_FOUND" }, { status: 404 });
    }
    const clip = clipSnap.data() as { eventId: string };

    const eventSnap = await db.collection("events").doc(clip.eventId).get();
    if (!eventSnap.exists) {
      return Response.json({ error: "EVENT_NOT_FOUND" }, { status: 404 });
    }
    const event = eventSnap.data() as { hostId: string };
    if (event.hostId !== uid) {
      return Response.json({ error: "FORBIDDEN" }, { status: 403 });
    }

    const excludedAt = excluded ? Timestamp.now() : null;
    await db.collection("clips").doc(clipId).update({ excludedAt });

    return Response.json({ ok: true, excludedAt: tsToMs(excludedAt) });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "internal_error";
    console.error("[clips/[clipId] PATCH]", msg);
    return Response.json({ error: msg }, { status: 500 });
  }
}
