// ⚠️ 현재 비활성화 상태 — 모든 요청 즉시 401 반환
// createRender에 callback URL이 설정되어 있지 않아 Shotstack이 실제로 호출하지 않음.
// 활성화 시 필요한 작업:
//   1. shotstack.ts createRender body에 callback URL 추가
//   2. Shotstack payload 실제 스키마 확인 (현재 페이로드 구조는 미검증)
//   3. eventId 전달 방법 설계 (callback URL 쿼리 vs Shotstack metadata 필드)
//   4. 서명 대신 secret token으로 인증 (URL 쿼리 파라미터, WEBHOOK_SECRET 환경변수)
// 상세: docs/DECISIONS.md (정찰 보고서)
import type { NextRequest } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { notifyRenderCompleted } from "@/lib/notifications/scenarios/render-completed";
import { notifyRenderFailed } from "@/lib/notifications/scenarios/render-failed";

export async function POST(request: NextRequest) {
  // ⚠️ 비활성화 상태 — 아래 로직은 활성화 시 참고용으로 보존. 활성화 시 이 블록 제거.
  // true as boolean: TypeScript가 아래 코드를 dead code 처리 않도록 (narrowing 유지)
  if (true as boolean) {
    return Response.json({ error: "WEBHOOK_DISABLED" }, { status: 401 });
  }

  const body = await request.json() as {
    eventId?: string;
    status?: "done" | "failed";
    url?: string;
  };
  const { eventId, status, url } = body;

  if (!eventId || !status) {
    return Response.json({ error: "MISSING_FIELDS" }, { status: 400 });
  }

  const db = getAdminDb();
  const eventSnap = await db.collection("events").doc(eventId).get();

  if (!eventSnap.exists) {
    return Response.json({ error: "EVENT_NOT_FOUND" }, { status: 404 });
  }

  const eventData = eventSnap.data()!;

  // Idempotency: skip if already in terminal state
  if (eventData.status === "done") {
    return Response.json({ ok: true });
  }

  const origin = request.headers.get("origin") ?? "";
  const dashboardUrl = `${origin}/dashboard/events/${eventId}`;
  const title = eventData.title ?? eventId;
  const hasContact = Boolean(eventData.organizerEmail && eventData.organizerPhone);

  if (status === "done" && url) {
    await db.collection("events").doc(eventId).update({ status: "done", videoUrl: url });

    if (hasContact) {
      notifyRenderCompleted({
        eventId,
        title,
        videoUrl: url,
        organizerEmail: eventData.organizerEmail,
        organizerPhone: eventData.organizerPhone,
        dashboardUrl,
        refundStatus: eventData.refundStatus,
      }).catch((err) =>
        console.error("[render/complete] notify render done error:", err)
      );
    }
  } else if (status === "failed") {
    await db.collection("events").doc(eventId).update({ status: "closed" });

    if (hasContact) {
      notifyRenderFailed({
        eventId,
        title,
        organizerEmail: eventData.organizerEmail,
        organizerPhone: eventData.organizerPhone,
        dashboardUrl,
      }).catch((err) =>
        console.error("[render/complete] notifyRenderFailed error:", err)
      );
    }
  }

  return Response.json({ ok: true });
}
