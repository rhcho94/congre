import type { NextRequest } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase-admin";
import { getRenderStatus } from "@/lib/shotstack";
import { notifyRenderCompleted } from "@/lib/notifications/scenarios/render-completed";
import { notifyRenderFailed } from "@/lib/notifications/scenarios/render-failed";
import { notifyParticipantResult } from "@/lib/notifications/scenarios/participant-result";

export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return Response.json({ error: "CRON_SECRET not configured" }, { status: 500 });
  }

  const awsRegion = process.env.AWS_REGION;
  const awsBucket = process.env.AWS_S3_BUCKET;
  if (!awsRegion || !awsBucket) {
    return Response.json({ error: "AWS_REGION or AWS_S3_BUCKET not configured" }, { status: 500 });
  }

  const authHeader = request.headers.get("authorization") ?? "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
  if (token !== cronSecret) {
    return Response.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const db = getAdminDb();
  const snapshot = await db.collection("events").where("status", "==", "rendering").get();

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
  let processedCount = 0;

  for (const docSnap of snapshot.docs) {
    const data = docSnap.data();
    const eventId = docSnap.id;

    if (!data.renderId) {
      console.log(`[cron/check-rendering] eventId=${eventId} skipped: no renderId`);
      continue;
    }

    let renderResult: { status: string; url?: string };
    try {
      renderResult = await getRenderStatus(data.renderId as string);
    } catch (err) {
      console.error(`[cron/check-rendering] getRenderStatus failed for eventId=${eventId}:`, err);
      continue;
    }

    const { status, url } = renderResult;

    if (status === "done" && url) {
      const s3Url = `https://${awsBucket}.s3.${awsRegion}.amazonaws.com/${data.renderId}.mp4`;
      let s3Ready = false;
      try {
        const head = await fetch(s3Url, { method: "HEAD" });
        s3Ready = head.ok;
        if (!s3Ready) {
          console.log(`[cron/check-rendering] eventId=${eventId} s3 not ready yet (status=${head.status}), retry next tick`);
        }
      } catch (err) {
        console.error("[cron/check-rendering] s3 head failed:", err);
      }
      if (!s3Ready) continue;

      await db.collection("events").doc(eventId).update({ status: "done", videoUrl: s3Url, renderDoneAt: FieldValue.serverTimestamp() });
      processedCount++;

      if (data.organizerEmail && data.organizerPhone) {
        const dashboardUrl = `${baseUrl}/dashboard/events/${eventId}`;
        await notifyRenderCompleted({
          eventId,
          title: (data.title as string) ?? eventId,
          videoUrl: s3Url,
          organizerEmail: data.organizerEmail as string,
          organizerPhone: data.organizerPhone as string,
          dashboardUrl,
          refundStatus: data.refundStatus as "none" | "50" | "100" | undefined,
        }).catch((err) =>
          console.error(`[cron/check-rendering] notifyRenderCompleted failed for eventId=${eventId}:`, err)
        );
        await db.collection("events").doc(eventId).update({
          "notifications.renderCompletedNotifiedAt": FieldValue.serverTimestamp(),
        });
      }

      if (data.notifications?.participantNotifiedAt == null) {
        const clipsSnap = await db.collection("clips")
          .where("eventId", "==", eventId).get();

        // JS 필터: excludedAt 없는 클립만 (DECISIONS 2026-05-08)
        const includedClips = clipsSnap.docs.filter((d) => !d.data().excludedAt);

        // distinct uploaderPhone (친구 폰 돌려쓰기 케이스 1건만)
        const phones = [...new Set(
          includedClips
            .map((d) => d.data().uploaderPhone as string | undefined)
            .filter((p): p is string => !!p)
        )];

        for (const phone of phones) {
          await notifyParticipantResult({
            eventId,
            title: (data.title as string) ?? eventId,
            videoUrl: s3Url,
            recipientPhone: phone,
          }).catch((err) =>
            console.error(`[cron/check-rendering] notifyParticipantResult failed for eventId=${eventId} phone=${phone}:`, err)
          );
        }

        await db.collection("events").doc(eventId).update({
          "notifications.participantNotifiedAt": FieldValue.serverTimestamp(),
        });
      }
    } else if (status === "failed") {
      await db.collection("events").doc(eventId).update({ status: "closed" });
      processedCount++;

      if (data.organizerEmail && data.organizerPhone) {
        const dashboardUrl = `${baseUrl}/dashboard/events/${eventId}`;
        await notifyRenderFailed({
          eventId,
          title: (data.title as string) ?? eventId,
          organizerEmail: data.organizerEmail as string,
          organizerPhone: data.organizerPhone as string,
          dashboardUrl,
        }).catch((err) =>
          console.error(`[cron/check-rendering] notifyRenderFailed failed for eventId=${eventId}:`, err)
        );
      }
    }
    // queued | fetching | rendering → 다음 tick에서 재확인
  }

  return Response.json({ checked: snapshot.docs.length, processed: processedCount });
}
