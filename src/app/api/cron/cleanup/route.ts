import type { NextRequest } from "next/server";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase-admin";
import { deleteS3Object } from "@/lib/s3-server";
import { deleteShotstackAssetsByRenderId } from "@/lib/shotstack";

export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return Response.json({ error: "CRON_SECRET not configured" }, { status: 500 });
  const authHeader = request.headers.get("authorization") ?? "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
  if (token !== cronSecret) return Response.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const now = Date.now();
  const cutoffClips = Timestamp.fromMillis(now - 24 * 60 * 60 * 1000);
  const cutoffVideos = Timestamp.fromMillis(now - 7 * 24 * 60 * 60 * 1000);

  const db = getAdminDb();
  const snapshot = await db.collection("events").where("status", "==", "done").get();
  let clipsDeleted = 0;
  let videosDeleted = 0;

  for (const doc of snapshot.docs) {
    const data = doc.data();
    const eventId = doc.id;

    // D-1: 클립 24h 처리
    const participantNotifiedAt = data.notifications?.participantNotifiedAt as Timestamp | undefined;
    if (
      data.clipsDeletedAt == null &&
      participantNotifiedAt != null &&
      participantNotifiedAt.toMillis() < cutoffClips.toMillis()
    ) {
      const clipsSnap = await db.collection("clips").where("eventId", "==", eventId).get();
      for (const clip of clipsSnap.docs) {
        try { await deleteS3Object(clip.data().s3Key as string); } catch (e) { console.warn("S3 delete failed", { eventId, clipId: clip.id, error: e }); }
        await db.collection("clips").doc(clip.id).delete();
        clipsDeleted++;
      }
      await db.collection("events").doc(eventId).update({ clipsDeletedAt: FieldValue.serverTimestamp() });
    }

    // D-2: 완성본 7d 처리
    const videosArr = data.videos as Array<{ renderId: string; s3Key: string; doneAt: Timestamp }> | undefined;

    if (videosArr && videosArr.length > 0) {
      // videos[] 있는 신규 문서: 원소별 개별 판정
      const expiredEntries = videosArr.filter(
        (v) => v.doneAt instanceof Timestamp && v.doneAt.toMillis() < cutoffVideos.toMillis()
      );
      const surviving = [...videosArr];
      let videoS3KeyNulled = false;

      for (const entry of expiredEntries) {
        try {
          await deleteShotstackAssetsByRenderId(entry.renderId);
        } catch (e) {
          console.warn("[cleanup] Shotstack delete failed", { eventId, renderId: entry.renderId, error: e });
        }

        let s3Deleted = false;
        try {
          await deleteS3Object(entry.s3Key);
          s3Deleted = true;
        } catch (err) {
          console.error("[cleanup] video s3 delete failed:", err);
        }

        if (s3Deleted) {
          const idx = surviving.findIndex((v) => v.renderId === entry.renderId && v.s3Key === entry.s3Key);
          if (idx !== -1) surviving.splice(idx, 1);
          if (entry.s3Key === data.videoS3Key) videoS3KeyNulled = true;
          videosDeleted++;
        }
      }

      if (surviving.length !== videosArr.length) {
        const updatePayload: Record<string, unknown> = { videos: surviving };
        if (videoS3KeyNulled) {
          updatePayload.videoS3Key = null;
          updatePayload.videoDeletedAt = FieldValue.serverTimestamp();
        }
        await db.collection("events").doc(eventId).update(updatePayload);
      }
    } else {
      // videos[] 없는 옛 문서: 기존 단건 로직 그대로 (하위호환)
      const renderDoneAt = data.renderDoneAt as Timestamp | undefined;
      if (
        data.videoS3Key &&
        renderDoneAt != null &&
        renderDoneAt.toMillis() < cutoffVideos.toMillis()
      ) {
        try { await deleteShotstackAssetsByRenderId(data.renderId as string); } catch (e) { console.warn("Shotstack delete failed", { eventId, error: e }); }
        let s3Deleted = false;
        try { await deleteS3Object(data.videoS3Key as string); s3Deleted = true; } catch (err) { console.error("[cleanup] video s3 delete failed:", err); }
        if (s3Deleted) {
          await db.collection("events").doc(eventId).update({ videoS3Key: null, videoDeletedAt: FieldValue.serverTimestamp() });
          videosDeleted++;
        }
      }
    }
  }

  console.log("cleanup done", { clipsDeleted, videosDeleted });
  return Response.json({ ok: true, clipsDeleted, videosDeleted });
}
