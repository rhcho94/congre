import { after, type NextRequest } from "next/server";
import { ATTRIBUTION_COOKIE, parseAttributionCookie } from "./attribution";

// 메타 전환 API — 가입 완료 · 이벤트 생성 · 결제 확정을 서버에서 메타로 보낸다.
// NEXT_PUBLIC_META_PIXEL_ID · META_CAPI_ACCESS_TOKEN 둘 중 하나라도 없으면 아무것도 하지 않는다.
// 이름 · 이메일 · 전화번호는 보내지 않는다. 보내는 것은 접속 IP · 브라우저 정보 · 메타 쿠키(_fbp · _fbc)뿐이다.
// 응답을 다 보낸 뒤에 전송하므로(after) 실패해도 가입 · 결제 흐름을 막지 않는다.

const GRAPH_VERSION = "v27.0";

interface MetaEvent {
  eventName: "CompleteRegistration" | "EventCreated" | "Purchase";
  eventId: string; // 같은 일이 두 번 전송돼도 메타가 하나로 세도록 하는 값
  value?: number; // 원 단위
}

export function trackMetaEvent(request: NextRequest, event: MetaEvent): void {
  const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID;
  const accessToken = process.env.META_CAPI_ACCESS_TOKEN;
  if (!pixelId || !accessToken) return;

  const attribution = parseAttributionCookie(request.cookies.get(ATTRIBUTION_COOKIE)?.value);
  const fbp = request.cookies.get("_fbp")?.value;
  // _fbc 쿠키가 없으면 처음 본 fbclid로 만든다 — 형식은 메타 문서의 fb.1.<처음 본 시각 ms>.<fbclid>
  const fbc =
    request.cookies.get("_fbc")?.value ??
    (attribution?.fbclid ? `fb.1.${attribution.capturedAt}.${attribution.fbclid}` : undefined);
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const userAgent = request.headers.get("user-agent");
  const sourceUrl =
    request.headers.get("referer") ?? process.env.NEXT_PUBLIC_APP_URL ?? "https://app.congre.kr";
  const testEventCode = process.env.META_TEST_EVENT_CODE;

  const payload = {
    data: [
      {
        event_name: event.eventName,
        event_time: Math.floor(Date.now() / 1000),
        event_id: event.eventId,
        action_source: "website",
        event_source_url: sourceUrl,
        user_data: {
          ...(ip ? { client_ip_address: ip } : {}),
          ...(userAgent ? { client_user_agent: userAgent } : {}),
          ...(fbp ? { fbp } : {}),
          ...(fbc ? { fbc } : {}),
        },
        ...(typeof event.value === "number"
          ? { custom_data: { currency: "KRW", value: event.value } }
          : {}),
      },
    ],
    ...(testEventCode ? { test_event_code: testEventCode } : {}),
  };

  after(async () => {
    try {
      const res = await fetch(
        `https://graph.facebook.com/${GRAPH_VERSION}/${pixelId}/events?access_token=${encodeURIComponent(accessToken)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          signal: AbortSignal.timeout(5000),
        },
      );
      if (!res.ok) {
        console.error("[meta-capi] non-OK:", {
          eventName: event.eventName,
          status: res.status,
          body: await res.text().catch(() => ""),
        });
      }
    } catch (err) {
      console.error("[meta-capi] failed:", { eventName: event.eventName, err });
    }
  });
}
