import type { NextRequest } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { notifyRenderStarted } from "@/lib/notifications/scenarios/render-started";

// Dev-only: returns 404 in production
export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV !== "development") {
    return Response.json({ error: "NOT_AVAILABLE" }, { status: 404 });
  }

  const { searchParams } = new URL(request.url);
  const eventId = searchParams.get("eventId");
  const clipCount = parseInt(searchParams.get("clipCount") ?? "3", 10);

  if (!eventId) {
    return Response.json({ error: "eventId 쿼리 파라미터 필요" }, { status: 400 });
  }

  const db = getAdminDb();
  const snap = await db.collection("events").doc(eventId).get();

  if (!snap.exists) {
    return Response.json({ error: "EVENT_NOT_FOUND" }, { status: 404 });
  }

  const data = snap.data()!;

  if (!data.organizerEmail || !data.organizerPhone) {
    return Response.json({
      error: "MISSING_CONTACT",
      organizerEmail: data.organizerEmail ?? null,
      organizerPhone: data.organizerPhone ?? null,
    }, { status: 422 });
  }

  const origin = new URL(request.url).origin;

  await notifyRenderStarted({
    eventId,
    title: data.title ?? eventId,
    clipCount,
    organizerEmail: data.organizerEmail,
    organizerPhone: data.organizerPhone,
    dashboardUrl: `${origin}/dashboard/events/${eventId}`,
  });

  return Response.json({
    ok: true,
    eventId,
    title: data.title,
    clipCount,
    sentTo: { email: data.organizerEmail, phone: data.organizerPhone },
  });
}
