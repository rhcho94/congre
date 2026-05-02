import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { FieldValue } from "firebase-admin/firestore";
import { createRender } from "@/lib/shotstack";
import { getAdminDb } from "@/lib/firebase-admin";
import { notifyRenderStarted } from "@/lib/notifications/scenarios/render-started";
import type { NextRequest } from "next/server";

const isConfigured = Boolean(
  process.env.AWS_ACCESS_KEY_ID &&
  process.env.AWS_S3_BUCKET &&
  process.env.SHOTSTACK_API_KEY
);

export async function POST(request: NextRequest) {
  if (!isConfigured) {
    return Response.json({ error: "NOT_CONFIGURED" }, { status: 503 });
  }

  const body = await request.json() as {
    eventId?: string;
    s3Keys?: string[];
    eventTitle?: string;
  };
  const { eventId, s3Keys, eventTitle } = body;

  if (!eventId || !Array.isArray(s3Keys) || s3Keys.length === 0) {
    return Response.json({ error: "INVALID_PARAMS" }, { status: 400 });
  }

  const s3 = new S3Client({
    region: process.env.AWS_REGION!,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
  });

  // Presigned GET URLs valid 24 h — Shotstack downloads them during render
  const s3Urls = await Promise.all(
    s3Keys.map((key) =>
      getSignedUrl(
        s3,
        new GetObjectCommand({ Bucket: process.env.AWS_S3_BUCKET!, Key: key }),
        { expiresIn: 86400 }
      )
    )
  );

  console.log("[render/start] s3Keys:", s3Keys);
  console.log("[render/start] presigned URLs (24h):");
  s3Urls.forEach((url, i) => console.log(`  [${i}] ${url}`));

  let renderId: string;
  try {
    renderId = await createRender(s3Urls);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "render_failed";
    return Response.json({ error: msg }, { status: 500 });
  }

  const db = getAdminDb();

  // Update Firestore: rendering state + deadline timestamp for completion-time calculation
  await db.collection("events").doc(eventId).update({
    status: "rendering",
    renderId,
    deadlineAt: FieldValue.serverTimestamp(),
  });

  // Fetch organizer contact for notification (graceful if fields are missing)
  const eventSnap = await db.collection("events").doc(eventId).get();
  const eventData = eventSnap.data();

  if (eventData?.organizerEmail && eventData?.organizerPhone) {
    const origin = request.headers.get("origin") ?? "";
    const dashboardUrl = `${origin}/dashboard/events/${eventId}`;
    notifyRenderStarted({
      eventId,
      title: eventData.title ?? eventTitle ?? eventId,
      clipCount: s3Keys.length,
      organizerEmail: eventData.organizerEmail,
      organizerPhone: eventData.organizerPhone,
      dashboardUrl,
    }).catch((err) => console.error("[render/start] notifyRenderStarted error:", err));
  }

  return Response.json({ renderId });
}
