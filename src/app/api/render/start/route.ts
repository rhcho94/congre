import { ListObjectsV2Command, S3Client } from "@aws-sdk/client-s3";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { isEngineConfigured, pickTransitions, startEngineRender, type EngineSegment } from "@/lib/engine";
import { getAdminDb } from "@/lib/firebase-admin";
import { verifyIdToken } from "@/lib/auth-server";
import { notifyRenderStarted } from "@/lib/notifications/scenarios/render-started";
import { MAX_TOTAL_CLIP_SECONDS, type PlanId } from "@/lib/plans";
import type { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  if (!isEngineConfigured()) {
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
  const unlocked = eventData.unlocked === true;
  if (plan === "paid" && !unlocked) {
    console.error("[render/start] blocked: paid plan not unlocked", { eventId });
    return Response.json({ error: "PAID_NOT_AVAILABLE" }, { status: 403 });
  }

  if (plan === "paid" && eventData.status === "closed" && eventData.refundStatus === "100") {
    console.error("[render/start] blocked: refund 100 locked", { eventId });
    return Response.json({ error: "REFUND_LOCKED" }, { status: 403 });
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

  let clipsWithLength: Array<{ key: string; length: number; name?: string }>;
  try {
    clipsWithLength = includedDocs.map((doc) => {
      const data = doc.data();
      const duration = data.duration as number | undefined;
      if (typeof duration !== "number" || !Number.isFinite(duration) || duration <= 0) {
        throw new Error(`MISSING_DURATION:${doc.id}`);
      }
      return {
        key: data.s3Key as string,
        length: Math.min(duration, maxClipSeconds),
        name: data.uploaderName as string | undefined,
      };
    });
  } catch (err) {
    console.error("[render/start] clip duration check failed:", { eventId, error: err });
    return Response.json({ error: "MISSING_DURATION" }, { status: 400 });
  }

  const totalSeconds = clipsWithLength.reduce((sum, c) => sum + c.length, 0);
  if (totalSeconds > MAX_TOTAL_CLIP_SECONDS) {
    return Response.json(
      { error: "TOTAL_TOO_LONG", totalSeconds: Math.round(totalSeconds), maxTotalSeconds: MAX_TOTAL_CLIP_SECONDS },
      { status: 400 }
    );
  }

  const introText      = (eventData.introText      as string | undefined)?.trim() || undefined;
  const outroText      = (eventData.outroText      as string | undefined)?.trim() || undefined;
  const introMediaKey  = eventData.introMediaKey  as string | undefined;
  const introMediaType = eventData.introMediaType as "image" | "video" | undefined;
  const outroMediaKey  = eventData.outroMediaKey  as string | undefined;
  const outroMediaType = eventData.outroMediaType as "image" | "video" | undefined;
  const videoFilter     = eventData.videoFilter     as string | undefined;
  const videoTransition = eventData.videoTransition as string | undefined;
  const showNames       = eventData.showNames       as boolean | undefined;
  const bgmMoodRaw      = eventData.bgmMood         as string | undefined;
  const bgmMood = (bgmMoodRaw === "calm" || bgmMoodRaw === "lively" || bgmMoodRaw === "epic") ? bgmMoodRaw : "lively";

  const jobId = `${eventId}-${Date.now()}`;
  const outKey = `renders/${jobId}.mp4`;

  const hasIntroMedia = !!(introMediaKey && introMediaType);
  const hasOutroMedia = !!(outroMediaKey && outroMediaType);

  const { transitionsIn, transitionsOut } = pickTransitions(
    clipsWithLength.length,
    videoTransition === "soft" || videoTransition === "dynamic" ? videoTransition : "default"
  );

  const segments: EngineSegment[] = [];

  if (hasIntroMedia) {
    segments.push({
      type: introMediaType!,
      key: introMediaKey!,
      ...(introText ? { text: introText } : {}),
      plan,
    });
  } else if (introText) {
    segments.push({ type: "card", text: introText, plan });
  }

  clipsWithLength.forEach((clip, i) => {
    const name = (clip.name ?? "").trim();
    segments.push({
      type: "clip",
      key: clip.key,
      length: clip.length,
      max_sec: maxClipSeconds,
      in: transitionsIn[i],
      out: transitionsOut[i],
      ...(showNames === true && name.length > 0 ? { name } : {}),
      ...(videoFilter === "muted" || videoFilter === "boost" ? { filter: videoFilter } : {}),
      plan,
    });
  });

  if (hasOutroMedia) {
    segments.push({ type: outroMediaType!, key: outroMediaKey!, plan });
    if (outroText) segments.push({ type: "card", text: outroText, plan });
  } else if (outroText) {
    segments.push({ type: "card", text: outroText, plan });
  }

  const s3 = new S3Client({
    region: process.env.AWS_REGION!,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
  });

  async function listMp3Keys(mood: string): Promise<string[]> {
    const res = await s3.send(new ListObjectsV2Command({
      Bucket: process.env.AWS_S3_BUCKET!,
      Prefix: `audio/${mood}/`,
    }));
    return (res.Contents ?? [])
      .map((o) => o.Key)
      .filter((k): k is string => !!k && k.toLowerCase().endsWith(".mp3"));
  }

  let bgmKey: string | undefined;
  const existingBgmKey = eventData.bgmKey as string | undefined;
  if (existingBgmKey && existingBgmKey.startsWith(`audio/${bgmMood}/`)) {
    bgmKey = existingBgmKey;
  } else {
    try {
      let keys = await listMp3Keys(bgmMood);
      if (keys.length === 0 && bgmMood !== "lively") {
        keys = await listMp3Keys("lively");
      }
      if (keys.length > 0) {
        bgmKey = keys[Math.floor(Math.random() * keys.length)];
      }
    } catch (err) {
      console.error("[render/start] bgm pick failed:", err);
    }
  }

  let executionArn: string;
  try {
    const started = await startEngineRender({
      jobId,
      segments,
      bgm: bgmKey ? { key: bgmKey, mode: "once" } : null,
      outKey,
    });
    executionArn = started.executionArn;
  } catch (err) {
    console.error("[render/start] failed:", { eventId, error: err });
    const msg = err instanceof Error ? err.message : "render_failed";
    return Response.json({ error: msg }, { status: 500 });
  }

  const renderEstimateMin = Math.max(15, Math.round(clipsWithLength.length * 0.5 + 10));
  const now = Date.now();

  await db.collection("events").doc(eventId).update({
    status: "rendering",
    renderId: jobId,
    renderExecutionArn: executionArn,
    renderOutKey: outKey,
    bgmKey: bgmKey ?? FieldValue.delete(),
    renderSkipped: FieldValue.delete(),
    deadlineAt: FieldValue.serverTimestamp(),
    renderStartedAt: Timestamp.fromMillis(now),
    renderEstimateMin,
    expectedCompletedAt: Timestamp.fromMillis(now + renderEstimateMin * 60 * 1000),
    refundStatus: "none",
    "notifications.renderStartedNotifiedAt": null,
    "notifications.renderCompletedNotifiedAt": null,
    "notifications.renderDelayedNotifiedAt": null,
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

  return Response.json({ renderId: jobId });
}
