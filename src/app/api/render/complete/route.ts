import type { NextRequest } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { notifyRenderCompleted } from "@/lib/notifications/scenarios/render-completed";
import { notifyRenderFailed } from "@/lib/notifications/scenarios/render-failed";

export async function POST(request: NextRequest) {
  const body = await request.json() as {
    eventId?: string;
    status?: "done" | "failed";
    url?: string;
  };
  const { eventId, status, url } = body;

  if (!eventId || !status) {
    return Response.json({ error: "MISSING_FIELDS" }, { status: 400 });
  }

  const db = getAdminDb();
  const eventSnap = await db.collection("events").doc(eventId).get();

  if (!eventSnap.exists) {
    return Response.json({ error: "EVENT_NOT_FOUND" }, { status: 404 });
  }

  const eventData = eventSnap.data()!;

  // Idempotency: skip if already in terminal state
  if (eventData.status === "done") {
    return Response.json({ ok: true });
  }

  const origin = request.headers.get("origin") ?? "";
  const dashboardUrl = `${origin}/dashboard/events/${eventId}`;
  const title = eventData.title ?? eventId;
  const hasContact = Boolean(eventData.organizerEmail && eventData.organizerPhone);

  if (status === "done" && url) {
    await db.collection("events").doc(eventId).update({ status: "done", videoUrl: url });

    if (hasContact) {
      notifyRenderCompleted({
        eventId,
        title,
        videoUrl: url,
        organizerEmail: eventData.organizerEmail,
        organizerPhone: eventData.organizerPhone,
        dashboardUrl,
      }).catch((err) =>
        console.error("[render/complete] notify render done error:", err)
      );
    }
  } else if (status === "failed") {
    await db.collection("events").doc(eventId).update({ status: "closed" });

    if (hasContact) {
      notifyRenderFailed({
        eventId,
        title,
        organizerEmail: eventData.organizerEmail,
        organizerPhone: eventData.organizerPhone,
        dashboardUrl,
      }).catch((err) =>
        console.error("[render/complete] notifyRenderFailed error:", err)
      );
    }
  }

  return Response.json({ ok: true });
}
