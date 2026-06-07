import type { NextRequest } from "next/server";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { verifyIdToken } from "@/lib/auth-server";
import { getAdminDb } from "@/lib/firebase-admin";
import { getVideoPresignedUrl } from "@/lib/s3-server";

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

    const videoS3Key = data.videoS3Key as string | undefined;
    const videoUrl = videoS3Key ? await getVideoPresignedUrl(videoS3Key) : undefined;

    return Response.json({
      id: snap.id,
      title: data.title as string,
      date: tsToMs(data.date),
      status: data.status as string,
      hostId: data.hostId as string,
      uploadToken: (data.uploadToken ?? undefined) as string | undefined,
      videoUrl,
      introText: (data.introText ?? null) as string | null,
      introMediaKey: (data.introMediaKey ?? null) as string | null,
      introMediaType: (data.introMediaType ?? null) as "image" | "video" | null,
      outroText: (data.outroText ?? null) as string | null,
      outroMediaKey: (data.outroMediaKey ?? null) as string | null,
      outroMediaType: (data.outroMediaType ?? null) as "image" | "video" | null,
      videoFilter: (data.videoFilter ?? null) as string | null,
      videoTransition: (data.videoTransition ?? null) as string | null,
      showNames: (data.showNames ?? false) as boolean,
      bgmMood: (data.bgmMood ?? null) as string | null,
    });
  } catch (err) {
    console.error("[api/host/events GET] Firestore error:", err);
    return Response.json({ error: "INTERNAL_ERROR" }, { status: 500 });
  }
}

export async function PATCH(
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

  const body = await request.json().catch(() => null) as {
    introText?: string | null;
    outroText?: string | null;
    introMediaKey?: string | null;
    outroMediaKey?: string | null;
    introMediaType?: "image" | "video" | null;
    outroMediaType?: "image" | "video" | null;
    videoFilter?: string | null;
    videoTransition?: string | null;
    showNames?: boolean | null;
    bgmMood?: string | null;
  } | null;

  if (!body) {
    return Response.json({ error: "INVALID_BODY" }, { status: 400 });
  }

  const hasIntroText = "introText" in body;
  const hasOutroText = "outroText" in body;
  const hasIntroMediaKey = "introMediaKey" in body;
  const hasOutroMediaKey = "outroMediaKey" in body;
  const hasIntroMediaType = "introMediaType" in body;
  const hasOutroMediaType = "outroMediaType" in body;
  const hasVideoFilter = "videoFilter" in body;
  const hasVideoTransition = "videoTransition" in body;
  const hasShowNames = "showNames" in body;
  const hasBgmMood = "bgmMood" in body;

  if (!hasIntroText && !hasOutroText &&
      !hasIntroMediaKey && !hasOutroMediaKey &&
      !hasIntroMediaType && !hasOutroMediaType &&
      !hasVideoFilter && !hasVideoTransition && !hasShowNames && !hasBgmMood) {
    return Response.json({ error: "NO_FIELDS" }, { status: 400 });
  }

  if (hasIntroText && typeof body.introText === "string" && body.introText.length > 60) {
    return Response.json({ error: "INVALID_INTRO_TEXT" }, { status: 400 });
  }
  if (hasOutroText && typeof body.outroText === "string" && body.outroText.length > 60) {
    return Response.json({ error: "INVALID_OUTRO_TEXT" }, { status: 400 });
  }
  if (hasIntroMediaType && body.introMediaType !== null &&
      body.introMediaType !== "image" && body.introMediaType !== "video") {
    return Response.json({ error: "INVALID_INTRO_MEDIA_TYPE" }, { status: 400 });
  }
  if (hasOutroMediaType && body.outroMediaType !== null &&
      body.outroMediaType !== "image" && body.outroMediaType !== "video") {
    return Response.json({ error: "INVALID_OUTRO_MEDIA_TYPE" }, { status: 400 });
  }
  if (hasIntroMediaKey !== hasIntroMediaType) {
    return Response.json({ error: "INVALID_INTRO_MEDIA" }, { status: 400 });
  }
  if (hasOutroMediaKey !== hasOutroMediaType) {
    return Response.json({ error: "INVALID_OUTRO_MEDIA" }, { status: 400 });
  }

  try {
    const db = getAdminDb();
    const snap = await db.collection("events").doc(eventId).get();

    if (!snap.exists) {
      return Response.json({ error: "NOT_FOUND" }, { status: 404 });
    }
    if (snap.data()!.hostId !== uid) {
      return Response.json({ error: "FORBIDDEN" }, { status: 403 });
    }

    const updates: Record<string, unknown> = {};

    if (hasIntroText) {
      updates.introText = !body.introText ? FieldValue.delete() : body.introText;
    }
    if (hasOutroText) {
      updates.outroText = !body.outroText ? FieldValue.delete() : body.outroText;
    }
    if (hasIntroMediaKey) {
      updates.introMediaKey = body.introMediaKey ?? FieldValue.delete();
      updates.introMediaType = body.introMediaType ?? FieldValue.delete();
    }
    if (hasOutroMediaKey) {
      updates.outroMediaKey = body.outroMediaKey ?? FieldValue.delete();
      updates.outroMediaType = body.outroMediaType ?? FieldValue.delete();
    }
    if (hasVideoFilter) {
      const allowed =
        body.videoFilter === "muted" ||
        body.videoFilter === "boost" ||
        body.videoFilter === "contrast";
      updates.videoFilter = allowed ? body.videoFilter : FieldValue.delete();
    }
    if (hasVideoTransition) {
      const allowed =
        body.videoTransition === "soft" ||
        body.videoTransition === "dynamic";
      updates.videoTransition = allowed ? body.videoTransition : FieldValue.delete();
    }
    if (hasShowNames) {
      updates.showNames = body.showNames === true ? true : FieldValue.delete();
    }
    if (hasBgmMood) {
      const allowed =
        body.bgmMood === "calm" ||
        body.bgmMood === "lively" ||
        body.bgmMood === "epic";
      updates.bgmMood = allowed ? body.bgmMood : FieldValue.delete();
    }

    await db.collection("events").doc(eventId).update(updates);

    return Response.json({ ok: true });
  } catch (err) {
    console.error("[host/events/[eventId] PATCH]", err);
    return Response.json({ error: "INTERNAL_ERROR" }, { status: 500 });
  }
}
