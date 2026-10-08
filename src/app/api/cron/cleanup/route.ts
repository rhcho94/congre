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
  const cutoffClips = Timestamp.fromMillis(now - 48 * 60 * 60 * 1000);
  const cutoffVideos = Timestamp.fromMillis(now - 7 * 24 * 60 * 60 * 1000);
  const cutoffStalledClips = Timestamp.fromMillis(now - 7 * 24 * 60 * 60 * 1000);
  const cutoffNotifications = Timestamp.fromMillis(now - 90 * 24 * 60 * 60 * 1000);

  const db = getAdminDb();

  // 이벤트의 클립(원본·썸네일)을 삭제한다. S3 삭제가 하나라도 실패한 클립은 문서를 남겨
  // 다음 실행에서 다시 잡히게 하고, 그때는 clipsDeletedAt을 찍지 않는다.
  // 클립이 모두 지워지면 인트로·아웃트로 파일도 지우고 clipsDeletedAt을 기록한다. 반환값은 삭제한 클립 수.
  async function deleteClipsAndMarkEvent(eventId: string): Promise<number> {
    let deleted = 0;
    let failed = 0;
    const clipsSnap = await db.collection("clips").where("eventId", "==", eventId).get();
    for (const clip of clipsSnap.docs) {
      const clipData = clip.data();
      const keys = [clipData.s3Key, clipData.thumbKey].filter((k): k is string => typeof k === "string" && k.length > 0);
      let s3Failed = false;
      for (const key of keys) {
        try {
          await deleteS3Object(key);
        } catch (e) {
          s3Failed = true;
          console.warn("[cleanup] clip s3 delete failed", { eventId, key, error: e });
        }
      }
      if (s3Failed) {
        failed++;
        continue;
      }
      await db.collection("clips").doc(clip.id).delete();
      deleted++;
    }
    if (failed > 0) return deleted;

    const eventSnap = await db.collection("events").doc(eventId).get();
    const eventData = eventSnap.data() ?? {};
    const updates: Record<string, unknown> = { clipsDeletedAt: FieldValue.serverTimestamp() };
    for (const side of ["intro", "outro"] as const) {
      const key = eventData[`${side}MediaKey`];
      if (typeof key !== "string" || !key) continue;
      try {
        await deleteS3Object(key);
        updates[`${side}MediaKey`] = FieldValue.delete();
        updates[`${side}MediaType`] = FieldValue.delete();
      } catch (e) {
        console.warn("[cleanup] host media s3 delete failed", { eventId, key, error: e });
      }
    }
    await db.collection("events").doc(eventId).update(updates);
    return deleted;
  }

  const snapshot = await db.collection("events").where("status", "==", "done").get();
  let clipsDeleted = 0;
  let videosDeleted = 0;

  for (const doc of snapshot.docs) {
    const data = doc.data();
    const eventId = doc.id;

    try {
      // D-1: 클립 48h 처리
      // 참가자 알림이 나갔으면 그 시각, 안 나갔으면 완성 시각(renderDoneAt, 없으면 videos[]의 가장 늦은 doneAt) 기준.
      const participantNotifiedAt = data.notifications?.participantNotifiedAt as Timestamp | undefined;
      let clipsBaseAt: Timestamp | undefined = participantNotifiedAt ?? undefined;
      if (clipsBaseAt == null) {
        const renderDoneAt = data.renderDoneAt as Timestamp | undefined;
        if (renderDoneAt instanceof Timestamp) {
          clipsBaseAt = renderDoneAt;
        } else {
          const doneAts = ((data.videos ?? []) as Array<{ doneAt?: unknown }>)
            .map((v) => v.doneAt)
            .filter((t): t is Timestamp => t instanceof Timestamp);
          if (doneAts.length > 0) {
            clipsBaseAt = doneAts.reduce((a, b) => (b.toMillis() > a.toMillis() ? b : a));
          }
        }
      }
      if (
        data.clipsDeletedAt == null &&
        clipsBaseAt != null &&
        clipsBaseAt.toMillis() < cutoffClips.toMillis()
      ) {
        clipsDeleted += await deleteClipsAndMarkEvent(eventId);
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
    } catch (err) {
      console.error(`[cleanup] 이벤트 처리 실패: eventId=${eventId}`, err);
      continue;
    }
  }

  // D-3: 지연·실패 이벤트(closed·rendering) 클립 7일 후 삭제
  const stalledSnapshot = await db
    .collection("events")
    .where("status", "in", ["closed", "rendering"])
    .get();

  for (const doc of stalledSnapshot.docs) {
    const data = doc.data();
    const eventId = doc.id;
    const status = data.status;

    try {
      const closedAt = data.closedAt as Timestamp | undefined;
      if (closedAt == null) {
        console.warn(`[cleanup] closedAt 없음, 건너뜀: eventId=${eventId} status=${status}`);
        continue;
      }

      if (
        closedAt.toMillis() <= cutoffStalledClips.toMillis() &&
        data.clipsDeletedAt == null
      ) {
        clipsDeleted += await deleteClipsAndMarkEvent(eventId);
      }
    } catch (err) {
      console.error(`[cleanup] 이벤트 처리 실패: eventId=${eventId}`, err);
      continue;
    }
  }

  // D-4: 알림 발송 기록 90일 후 삭제 (한 번에 최대 1000건, 배치 500건 단위)
  let notificationsDeleted = 0;
  try {
    const oldNotifications = await db
      .collection("notifications")
      .where("sentAt", "<", cutoffNotifications)
      .limit(1000)
      .get();
    for (let i = 0; i < oldNotifications.docs.length; i += 500) {
      const batch = db.batch();
      const chunk = oldNotifications.docs.slice(i, i + 500);
      for (const d of chunk) batch.delete(d.ref);
      await batch.commit();
      notificationsDeleted += chunk.length;
    }
  } catch (err) {
    console.error("[cleanup] notifications 정리 실패:", err);
  }

  console.log("cleanup done", { clipsDeleted, videosDeleted, notificationsDeleted });
  return Response.json({ ok: true, clipsDeleted, videosDeleted, notificationsDeleted });
}
