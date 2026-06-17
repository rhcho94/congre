import { GetObjectCommand, ListObjectsV2Command, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { createRender, probeDurationSec } from "@/lib/shotstack";
import { getAdminDb } from "@/lib/firebase-admin";
import { verifyIdToken } from "@/lib/auth-server";
import { notifyRenderStarted } from "@/lib/notifications/scenarios/render-started";
import { type PlanId } from "@/lib/plans";
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

  const body = await request.json() as { eventId?: string };
  const { eventId } = body;

  if (!eventId) {
    return Response.json({ error: "EVENT_ID_REQUIRED" }, { status: 400 });
  }

  let uid: string;
  try {
    const token = await verifyIdToken(request);
    uid = token.uid;
  } catch {
    return Response.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const db = getAdminDb();
  const eventSnap = await db.collection("events").doc(eventId).get();

  if (!eventSnap.exists) {
    return Response.json({ error: "EVENT_NOT_FOUND" }, { status: 404 });
  }

  const eventData = eventSnap.data()!;

  if (eventData.hostId !== uid) {
    return Response.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  const plan = (eventData.plan as string | undefined ?? "free") as PlanId;
  if (plan === "paid") {
    console.error("[render/start] blocked: paid plan not available yet", { eventId });
    return Response.json({ error: "PAID_NOT_AVAILABLE" }, { status: 403 });
  }

  const clipsSnap = await db.collection("clips").where("eventId", "==", eventId).get();

  if (clipsSnap.empty) {
    return Response.json({ error: "NO_CLIPS" }, { status: 400 });
  }

  const includedDocs = clipsSnap.docs
    .filter((d) => !d.data().excludedAt)
    .sort((a, b) => {
      const aMs = (a.data().uploadedAt as Timestamp)?.toMillis() ?? 0;
      const bMs = (b.data().uploadedAt as Timestamp)?.toMillis() ?? 0;
      return aMs - bMs;
    });

  if (includedDocs.length === 0) {
    return Response.json({ error: "NO_CLIPS_AFTER_EXCLUSION" }, { status: 400 });
  }

  const maxClipSeconds = (eventData.maxClipSeconds as number | undefined) ?? 15;

  const s3 = new S3Client({
    region: process.env.AWS_REGION!,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
  });

  // Presigned GET URLs valid 24 h — Shotstack downloads them during render
  const clipsWithLength = await Promise.all(
    includedDocs.map(async (doc) => {
      const data = doc.data();
      const duration = data.duration as number | undefined;
      if (typeof duration !== "number" || !Number.isFinite(duration) || duration <= 0) {
        throw new Error(`MISSING_DURATION:${doc.id}`);
      }
      const src = await getSignedUrl(
        s3,
        new GetObjectCommand({ Bucket: process.env.AWS_S3_BUCKET!, Key: data.s3Key as string }),
        { expiresIn: 86400 }
      );
      return {
        src,
        length: Math.min(duration, maxClipSeconds),
        name: data.uploaderName as string | undefined,
      };
    })
  );

  console.log("[render/start] clipsWithLength:", clipsWithLength.map((c) => ({ length: c.length, src: c.src.slice(0, 80) })));

  const introText      = eventData.introText      as string | undefined;
  const outroText      = eventData.outroText      as string | undefined;
  const introMediaKey  = eventData.introMediaKey  as string | undefined;
  const introMediaType = eventData.introMediaType as "image" | "video" | undefined;
  const outroMediaKey  = eventData.outroMediaKey  as string | undefined;
  const outroMediaType = eventData.outroMediaType as "image" | "video" | undefined;
  const videoFilter     = eventData.videoFilter     as string | undefined;
  const videoTransition = eventData.videoTransition as string | undefined;
  const showNames       = eventData.showNames       as boolean | undefined;
  const bgmMoodRaw      = eventData.bgmMood         as string | undefined;
  const bgmMood = (bgmMoodRaw === "calm" || bgmMoodRaw === "lively" || bgmMoodRaw === "epic") ? bgmMoodRaw : "lively";

  async function listMp3Keys(mood: string): Promise<string[]> {
    const res = await s3.send(new ListObjectsV2Command({
      Bucket: process.env.AWS_S3_BUCKET!,
      Prefix: `audio/${mood}/`,
    }));
    return (res.Contents ?? [])
      .map((o) => o.Key)
      .filter((k): k is string => !!k && k.toLowerCase().endsWith(".mp3"));
  }

  let bgmSrc: string | undefined;
  try {
    let keys = await listMp3Keys(bgmMood);
    if (keys.length === 0 && bgmMood !== "lively") {
      keys = await listMp3Keys("lively");
    }
    if (keys.length > 0) {
      const pickedKey = keys[Math.floor(Math.random() * keys.length)];
      bgmSrc = await getSignedUrl(
        s3,
        new GetObjectCommand({ Bucket: process.env.AWS_S3_BUCKET!, Key: pickedKey }),
        { expiresIn: 86400 }
      );
    }
  } catch (err) {
    console.error("[render/start] bgm pick failed:", err);
  }

  const introMediaUrl = introMediaKey
    ? await getSignedUrl(
        s3,
        new GetObjectCommand({ Bucket: process.env.AWS_S3_BUCKET!, Key: introMediaKey }),
        { expiresIn: 86400 }
      )
    : undefined;
  const outroMediaUrl = outroMediaKey
    ? await getSignedUrl(
        s3,
        new GetObjectCommand({ Bucket: process.env.AWS_S3_BUCKET!, Key: outroMediaKey }),
        { expiresIn: 86400 }
      )
    : undefined;

  const [bgmDurationSec, introMediaDurationSec, outroMediaDurationSec] = await Promise.all([
    bgmSrc ? probeDurationSec(bgmSrc) : Promise.resolve(null),
    introMediaUrl && introMediaType === "video" ? probeDurationSec(introMediaUrl) : Promise.resolve(null),
    outroMediaUrl && outroMediaType === "video" ? probeDurationSec(outroMediaUrl) : Promise.resolve(null),
  ]);

  let renderId: string;
  try {
    renderId = await createRender(
      clipsWithLength,
      (introText || introMediaUrl)
        ? { text: introText, mediaUrl: introMediaUrl, mediaType: introMediaType, mediaDurationSec: introMediaDurationSec ?? undefined }
        : undefined,
      (outroText || outroMediaUrl)
        ? { text: outroText, mediaUrl: outroMediaUrl, mediaType: outroMediaType, mediaDurationSec: outroMediaDurationSec ?? undefined }
        : undefined,
      plan,
      (() => {
        const style: { filter?: string; transition?: "soft" | "dynamic"; showNames?: boolean; bgmSrc?: string; bgmDurationSec?: number } = {};
        if (videoFilter) style.filter = videoFilter;
        if (videoTransition === "soft" || videoTransition === "dynamic") {
          style.transition = videoTransition;
        }
        if (showNames === true) style.showNames = true;
        if (bgmSrc) style.bgmSrc = bgmSrc;
        if (bgmDurationSec) style.bgmDurationSec = bgmDurationSec;
        return Object.keys(style).length > 0 ? style : undefined;
      })(),
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : "render_failed";
    return Response.json({ error: msg }, { status: 500 });
  }

  const renderEstimateMin = Math.max(15, Math.round(clipsWithLength.length * 0.5 + 10));
  const now = Date.now();

  await db.collection("events").doc(eventId).update({
    status: "rendering",
    renderId,
    deadlineAt: FieldValue.serverTimestamp(),
    renderStartedAt: Timestamp.fromMillis(now),
    renderEstimateMin,
    expectedCompletedAt: Timestamp.fromMillis(now + renderEstimateMin * 60 * 1000),
    refund50At: Timestamp.fromMillis(now + (renderEstimateMin + 30) * 60 * 1000),
    refund100At: Timestamp.fromMillis(now + 24 * 60 * 60 * 1000),
    refundStatus: "none",
    "notifications.renderStartedNotifiedAt": null,
    "notifications.renderCompletedNotifiedAt": null,
    "notifications.renderDelayedNotifiedAt": null,
    "notifications.refund50NotifiedAt": null,
    "notifications.refund100NotifiedAt": null,
    "notifications.participantNotifiedAt": null,
  });

  if (eventData.organizerEmail && eventData.organizerPhone) {
    const origin = request.headers.get("origin") ?? "";
    const dashboardUrl = `${origin}/dashboard/events/${eventId}`;
    await notifyRenderStarted({
      eventId,
      title: eventData.title as string,
      clipCount: clipsWithLength.length,
      renderEstimateMin,
      organizerEmail: eventData.organizerEmail,
      organizerPhone: eventData.organizerPhone,
      dashboardUrl,
    }).catch((err) => console.error("[render/start] notifyRenderStarted error:", err));
    await db.collection("events").doc(eventId).update({
      "notifications.renderStartedNotifiedAt": FieldValue.serverTimestamp(),
    });
  }

  return Response.json({ renderId });
}
