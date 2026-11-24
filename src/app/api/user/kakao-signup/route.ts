import { FieldValue } from "firebase-admin/firestore";
import type { NextRequest } from "next/server";
import { verifyIdToken } from "@/lib/auth-server";
import { getAdminDb } from "@/lib/firebase-admin";
import { isKakaoUid } from "@/lib/kakao-auth";
import { ATTRIBUTION_COOKIE, parseAttributionCookie } from "@/lib/attribution";
import { trackMetaEvent } from "@/lib/meta-capi";

// 카카오로 처음 온 호스트의 가입 마무리 — 이름 · 휴대폰 · 필수 동의 3개(이메일 가입과 같음)를 받아 users 문서를 만든다.
// 이메일은 받지 않으므로 빈 값. 이미 있으면 덮어쓰지 않는다.
export async function POST(request: NextRequest) {
  let uid: string;
  try {
    uid = (await verifyIdToken(request)).uid;
  } catch {
    return Response.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }
  if (!isKakaoUid(uid)) {
    return Response.json({ error: "NOT_KAKAO" }, { status: 400 });
  }

  const body = (await request.json().catch(() => null)) as {
    name?: unknown;
    phone?: unknown;
    terms?: unknown;
    privacy?: unknown;
    age?: unknown;
  } | null;
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const phone = typeof body?.phone === "string" ? body.phone.replace(/[\s-]/g, "") : "";
  if (!name || name.length > 20) {
    return Response.json({ error: "INVALID_NAME" }, { status: 400 });
  }
  if (!/^010[0-9]{8}$/.test(phone)) {
    return Response.json({ error: "INVALID_PHONE" }, { status: 400 });
  }
  if (body?.terms !== true || body?.privacy !== true || body?.age !== true) {
    return Response.json({ error: "AGREEMENT_REQUIRED" }, { status: 400 });
  }

  try {
    const ref = getAdminDb().collection("users").doc(uid);
    if ((await ref.get()).exists) {
      return Response.json({ ok: true, existed: true });
    }
    const now = FieldValue.serverTimestamp();
    const attribution = parseAttributionCookie(request.cookies.get(ATTRIBUTION_COOKIE)?.value);
    await ref.set({
      email: "",
      name,
      phone,
      provider: "kakao",
      createdAt: now,
      termsAgreedAt: now,
      privacyAgreedAt: now,
      signupTrackedAt: now,
      ...(attribution ? { attribution } : {}),
    });
    trackMetaEvent(request, { eventName: "CompleteRegistration", eventId: `signup_${uid}` });
    return Response.json({ ok: true });
  } catch (err) {
    console.error("[user/kakao-signup] failed:", err);
    return Response.json({ error: "INTERNAL_ERROR" }, { status: 500 });
  }
}
