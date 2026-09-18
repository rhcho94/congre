import type { NextRequest } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { verifyIdToken } from "@/lib/auth-server";
import { getAdminDb } from "@/lib/firebase-admin";

export async function POST(
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
  const db = getAdminDb();

  try {
    const snap = await db.collection("events").doc(eventId).get();

    if (!snap.exists) {
      return Response.json({ error: "EVENT_NOT_FOUND" }, { status: 404 });
    }

    const data = snap.data()!;

    if (data.hostId !== uid) {
      return Response.json({ error: "FORBIDDEN" }, { status: 403 });
    }

    if (data.status !== "closed" || data.renderId) {
      return Response.json({ error: "NOT_REOPENABLE" }, { status: 409 });
    }

    const uploadToken = data.uploadToken as string | undefined;
    if (!uploadToken) {
      return Response.json({ error: "NO_UPLOAD_TOKEN" }, { status: 409 });
    }

    await db.collection("events").doc(eventId).update({
      status: "open",
      sessionToken: uploadToken,
      closedAt: FieldValue.delete(),
    });

    return Response.json({ ok: true });
  } catch (err) {
    console.error("[event reopen] failed:", err);
    return Response.json({ error: "INTERNAL_ERROR" }, { status: 500 });
  }
}
