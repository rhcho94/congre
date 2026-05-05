import type { NextRequest } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { getRenderStatus } from "@/lib/shotstack";
import { notifyRenderCompleted } from "@/lib/notifications/scenarios/render-completed";
import { notifyRenderFailed } from "@/lib/notifications/scenarios/render-failed";

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
      await db.collection("events").doc(eventId).update({ status: "done", videoUrl: url });
      processedCount++;

      if (data.organizerEmail && data.organizerPhone) {
        const dashboardUrl = `${baseUrl}/dashboard/events/${eventId}`;
        notifyRenderCompleted({
          eventId,
          title: (data.title as string) ?? eventId,
          videoUrl: url,
          organizerEmail: data.organizerEmail as string,
          organizerPhone: data.organizerPhone as string,
          dashboardUrl,
          refundStatus: data.refundStatus as "none" | "50" | "100" | undefined,
        }).catch((err) =>
          console.error(`[cron/check-rendering] notifyRenderCompleted failed for eventId=${eventId}:`, err)
        );
      }
    } else if (status === "failed") {
      await db.collection("events").doc(eventId).update({ status: "closed" });
      processedCount++;

      if (data.organizerEmail && data.organizerPhone) {
        const dashboardUrl = `${baseUrl}/dashboard/events/${eventId}`;
        notifyRenderFailed({
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
