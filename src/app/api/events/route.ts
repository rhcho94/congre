import type { NextRequest } from "next/server";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { verifyIdToken } from "@/lib/auth-server";
import { getAdminDb } from "@/lib/firebase-admin";
import { notifyEventCreated } from "@/lib/notifications/scenarios/event-created";

export async function POST(request: NextRequest) {
  let uid: string;
  try {
    const token = await verifyIdToken(request);
    uid = token.uid;
  } catch {
    return Response.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const body = await request.json() as {
    title?: string;
    date?: string;
    plan?: string;
    organizerEmail?: string;
    organizerPhone?: string;
  };
  const { title, date, plan, organizerEmail, organizerPhone } = body;

  if (!title || !date || !plan || !organizerEmail || !organizerPhone) {
    return Response.json({ error: "MISSING_FIELDS" }, { status: 400 });
  }

  const db = getAdminDb();
  const sessionToken = crypto.randomUUID();

  const ref = await db.collection("events").add({
    title,
    date: Timestamp.fromDate(new Date(date + "T00:00:00")),
    plan,
    hostId: uid,
    status: "open",
    sessionToken,
    uploadToken: sessionToken,
    createdAt: FieldValue.serverTimestamp(),
    organizerEmail,
    organizerPhone,
  });

  const eventId = ref.id;
  const origin = request.headers.get("origin") ?? "";
  const dashboardUrl = `${origin}/dashboard/events/${eventId}`;

  // Fire notification without blocking the response
  notifyEventCreated({ eventId, title, date, organizerEmail, dashboardUrl }).catch((err) =>
    console.error("[api/events] notifyEventCreated error:", err)
  );

  return Response.json({ eventId, sessionToken });
}
