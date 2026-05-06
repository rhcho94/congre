import type { NextRequest } from "next/server";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { verifyIdToken } from "@/lib/auth-server";
import { getAdminDb } from "@/lib/firebase-admin";
import { notifyEventCreated } from "@/lib/notifications/scenarios/event-created";

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

  try {
    const db = getAdminDb();
    const snap = await db.collection("events").where("hostId", "==", uid).get();

    const events = snap.docs
      .map((d) => {
        const data = d.data();
        return {
          id: d.id,
          title: data.title as string,
          date: tsToMs(data.date),
          plan: data.plan as string,
          hostId: data.hostId as string,
          status: data.status as string,
          sessionToken: (data.sessionToken ?? null) as string | null,
          uploadToken: (data.uploadToken ?? undefined) as string | undefined,
          createdAt: tsToMs(data.createdAt),
          renderId: (data.renderId ?? undefined) as string | undefined,
          videoUrl: (data.videoUrl ?? undefined) as string | undefined,
          draftVideoUrl: (data.draftVideoUrl ?? undefined) as string | undefined,
          organizerEmail: (data.organizerEmail ?? undefined) as string | undefined,
          organizerPhone: (data.organizerPhone ?? undefined) as string | undefined,
          deadlineAt: tsToMs(data.deadlineAt),
        };
      })
      .sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));

    return Response.json({ events });
  } catch (err) {
    console.error("[api/events GET] Firestore error:", err);
    return Response.json({ error: "INTERNAL_ERROR" }, { status: 500 });
  }
}

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

  await notifyEventCreated({ eventId, title, date, organizerEmail, dashboardUrl }).catch((err) =>
    console.error("[api/events] notifyEventCreated error:", err)
  );

  return Response.json({ eventId, sessionToken });
}
