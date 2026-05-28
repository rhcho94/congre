import type { NextRequest } from "next/server";
import { emailChannel } from "@/lib/notifications/channels/email";

const ALLOWED_ORIGINS = ["https://congre.kr", "https://www.congre.kr"];
const LEAD_TO = "hello@congre.kr";
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const EVENT_TYPE_LABEL: Record<string, string> = {
  wedding: "결혼식",
  graduation: "졸업식",
  corporate: "기업·기관",
  community: "동호회·모임",
  other: "기타",
};

function corsHeaders(origin: string | null): HeadersInit {
  const allowOrigin = origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Vary": "Origin",
  };
}

function jsonResponse(body: unknown, status: number, origin: string | null) {
  return Response.json(body, { status, headers: corsHeaders(origin) });
}

export function OPTIONS(request: NextRequest) {
  const origin = request.headers.get("origin");
  return new Response(null, { status: 204, headers: corsHeaders(origin) });
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return jsonResponse({ ok: false, error: "요청 형식이 잘못됐습니다" }, 400, origin);
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim() : "";
  const eventType = typeof body.eventType === "string" ? body.eventType : "";
  const eventTypeCustom = typeof body.eventTypeCustom === "string" ? body.eventTypeCustom.trim() : "";
  const eventDate = typeof body.eventDate === "string" && body.eventDate ? body.eventDate : null;
  const attendees = typeof body.attendees === "number" ? body.attendees : null;
  const organization = typeof body.organization === "string" ? body.organization.trim() : null;
  const message = typeof body.message === "string" ? body.message.trim() : null;
  const honeypot = typeof body.honeypot === "string" ? body.honeypot : "";

  // honeypot — 봇에게 성공처럼 보이게 200 응답하되 발송 스킵
  if (honeypot.length > 0) {
    return jsonResponse({ ok: true }, 200, origin);
  }

  if (!name || name.length > 50) {
    return jsonResponse({ ok: false, error: "이름은 1~50자로 입력해주세요" }, 400, origin);
  }
  if (!email || !EMAIL_REGEX.test(email)) {
    return jsonResponse({ ok: false, error: "이메일 형식이 올바르지 않습니다" }, 400, origin);
  }
  if (!eventType || !(eventType in EVENT_TYPE_LABEL)) {
    return jsonResponse({ ok: false, error: "행사 유형을 선택해주세요" }, 400, origin);
  }
  if (eventType === "other" && (!eventTypeCustom || eventTypeCustom.length > 30)) {
    return jsonResponse({ ok: false, error: "기타 행사 유형은 1~30자로 입력해주세요" }, 400, origin);
  }
  if (organization && organization.length > 100) {
    return jsonResponse({ ok: false, error: "소속·기관명은 100자 이내로 입력해주세요" }, 400, origin);
  }
  if (message && message.length > 1000) {
    return jsonResponse({ ok: false, error: "문의 내용은 1000자 이내로 입력해주세요" }, 400, origin);
  }

  // TODO: rate limit — 봇 트래픽 발견 시 Upstash 격상 (known-issues 영역)

  const typeLabel = eventType === "other" ? eventTypeCustom : EVENT_TYPE_LABEL[eventType];
  const submittedAt = new Date().toISOString();
  const ip = request.headers.get("x-forwarded-for") ?? "-";
  const ua = request.headers.get("user-agent") ?? "-";

  const subject = `[Congre 문의] ${typeLabel} — ${name}`;
  const text = `이름: ${name}
이메일: ${email}
행사 유형: ${typeLabel}
예상 행사 일자: ${eventDate ?? "미정"}
예상 참여자 수: ${attendees ?? "-"}
소속·기관명: ${organization ?? "-"}
문의 내용:
${message ?? "-"}

---
제출 시각: ${submittedAt}
IP: ${ip}
User-Agent: ${ua}
`;

  try {
    const result = await emailChannel.send(LEAD_TO, {
      subject,
      text,
      replyTo: email,
    });
    if (!result.success) {
      console.error("[api/lead] email send failed:", result.error);
      return jsonResponse({ ok: false, error: "일시적 오류입니다" }, 500, origin);
    }
    return jsonResponse({ ok: true }, 200, origin);
  } catch (err) {
    console.error("[api/lead] email send threw:", err);
    return jsonResponse({ ok: false, error: "일시적 오류입니다" }, 500, origin);
  }
}
