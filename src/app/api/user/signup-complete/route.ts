import { FieldValue, type Timestamp } from "firebase-admin/firestore";
import type { NextRequest } from "next/server";
import { verifyIdToken } from "@/lib/auth-server";
import { getAdminDb } from "@/lib/firebase-admin";
import { ATTRIBUTION_COOKIE, parseAttributionCookie } from "@/lib/attribution";
import { trackMetaEvent } from "@/lib/meta-capi";

// 가입 마무리 표시 — 가입은 브라우저가 users 문서를 직접 만들어 서버가 가입을 알 길이 없다.
// 가입 화면이 가입 직후 이 주소를 한 번 불러, 광고 유입 정보를 users 문서에 붙이고 가입 완료를 메타에 알린다.

const FRESH_SIGNUP_WINDOW_MS = 10 * 60 * 1000;

export async function POST(request: NextRequest) {
  let uid: string;
  try {
    uid = (await verifyIdToken(request)).uid;
  } catch {
    return Response.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  try {
    const ref = getAdminDb().collection("users").doc(uid);
    const snap = await ref.get();
    if (!snap.exists) {
      return Response.json({ error: "USER_NOT_FOUND" }, { status: 404 });
    }
    const data = snap.data()!;
    const createdAt = data.createdAt as Timestamp | undefined;
    // 이미 표시했거나, 방금 만든 계정이 아니면 아무것도 하지 않는다 (예전 가입자가 다시 불러도 가입으로 세지 않게)
    if (
      data.signupTrackedAt ||
      !createdAt ||
      Date.now() - createdAt.toMillis() > FRESH_SIGNUP_WINDOW_MS
    ) {
      return Response.json({ ok: true, tracked: false });
    }

    const attribution = parseAttributionCookie(request.cookies.get(ATTRIBUTION_COOKIE)?.value);
    await ref.update({
      signupTrackedAt: FieldValue.serverTimestamp(),
      ...(attribution ? { attribution } : {}),
    });
    trackMetaEvent(request, { eventName: "CompleteRegistration", eventId: `signup_${uid}` });
    return Response.json({ ok: true, tracked: true });
  } catch (err) {
    console.error("[user/signup-complete] failed:", err);
    return Response.json({ error: "INTERNAL_ERROR" }, { status: 500 });
  }
}
