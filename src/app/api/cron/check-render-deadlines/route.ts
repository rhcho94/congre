import type { NextRequest } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase-admin";
import { notifyRenderDelayed } from "@/lib/notifications/scenarios/render-delayed";
import { notifyRefund50 } from "@/lib/notifications/scenarios/refund-50";
import { notifyRefund100 } from "@/lib/notifications/scenarios/refund-100";

export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return Response.json({ error: "CRON_SECRET not configured" }, { status: 500 });
  }

  const authHeader = request.headers.get("authorization") ?? "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
  if (token !== cronSecret) {
    return Response.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const db = getAdminDb();
  const snapshot = await db.collection("events").where("status", "==", "rendering").get();

  // TODO [6]: NEXT_PUBLIC_APP_URL 환경변수 Vercel 등록 필요
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";

  let notifiedCount = 0;
  const now = Date.now();

  for (const doc of snapshot.docs) {
    const data = doc.data();
    const eventId = doc.id;

    if (!data.expectedCompletedAt) {
      console.log(`[cron] eventId=${eventId} skipped: legacy event without expectedCompletedAt`);
      continue;
    }

    if (!data.organizerEmail || !data.organizerPhone) {
      console.warn(`[cron] eventId=${eventId} skipped: missing contact info`);
      continue;
    }

    const dashboardUrl = `${baseUrl}/dashboard/events/${eventId}`;
    const ctxBase = {
      eventId,
      title: data.title ?? eventId,
      organizerEmail: data.organizerEmail,
      organizerPhone: data.organizerPhone,
      dashboardUrl,
    };

    // ① render_delayed (T+E 초과 + 미발송)
    if (
      data.expectedCompletedAt.toMillis() <= now &&
      data.notifications?.renderDelayedNotifiedAt == null
    ) {
      try {
        await notifyRenderDelayed(ctxBase);
        await db.collection("events").doc(eventId).update({
          "notifications.renderDelayedNotifiedAt": FieldValue.serverTimestamp(),
        });
        notifiedCount++;
      } catch (err) {
        console.error(`[cron] render_delayed failed for eventId=${eventId}:`, err);
        // 플래그 미기록 → 다음 실행에서 재시도
      }
    }

    // ② refund_50 (T+E+30분 초과 + 미발송)
    if (
      data.refund50At?.toMillis() <= now &&
      data.notifications?.refund50NotifiedAt == null
    ) {
      try {
        await notifyRefund50(ctxBase);
        await db.collection("events").doc(eventId).update({
          "notifications.refund50NotifiedAt": FieldValue.serverTimestamp(),
          refundStatus: "50",
        });
        notifiedCount++;
      } catch (err) {
        console.error(`[cron] refund_50 failed for eventId=${eventId}:`, err);
        // 플래그 미기록 → 다음 실행에서 재시도
      }
    }

    // ③ refund_100 (T+24h 초과 + 미발송)
    if (
      data.refund100At?.toMillis() <= now &&
      data.notifications?.refund100NotifiedAt == null
    ) {
      try {
        await notifyRefund100(ctxBase);
        await db.collection("events").doc(eventId).update({
          "notifications.refund100NotifiedAt": FieldValue.serverTimestamp(),
          refundStatus: "100",
        });
        notifiedCount++;
      } catch (err) {
        console.error(`[cron] refund_100 failed for eventId=${eventId}:`, err);
        // 플래그 미기록 → 다음 실행에서 재시도
      }
    }
  }

  return Response.json({ checked: snapshot.docs.length, notified: notifiedCount });
}
