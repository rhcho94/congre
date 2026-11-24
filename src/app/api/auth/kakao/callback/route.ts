import { NextResponse, type NextRequest } from "next/server";
import { getAdminAuth } from "@/lib/firebase-admin";
import { KAKAO_REDIRECT_PATH, KAKAO_STATE_COOKIE, KAKAO_UID_PREFIX } from "@/lib/kakao-auth";

// 카카오가 돌려준 코드 → 카카오 토큰 → 회원번호 · 닉네임 → Firebase 커스텀 토큰.
// 토큰은 주소의 # 뒤(서버 로그에 남지 않음)에 실어 /auth/kakao 화면으로 보낸다. 카카오 토큰은 저장하지 않는다.
export async function GET(request: NextRequest) {
  const fail = (reason: string) => {
    const res = NextResponse.redirect(new URL(`/auth/kakao?error=${reason}`, request.url));
    res.cookies.delete(KAKAO_STATE_COOKIE);
    return res;
  };

  const params = request.nextUrl.searchParams;
  if (params.get("error")) {
    // 사용자가 동의 화면에서 취소한 경우 등
    return fail("cancelled");
  }

  const code = params.get("code");
  const state = params.get("state");
  const saved = request.cookies.get(KAKAO_STATE_COOKIE)?.value ?? "";
  const [savedState, next = ""] = saved.split(".");
  if (!code || !state || !savedState || state !== savedState) {
    console.warn("[auth/kakao/callback] state mismatch or missing code");
    return fail("state");
  }

  const clientId = process.env.KAKAO_REST_API_KEY;
  const clientSecret = process.env.KAKAO_CLIENT_SECRET;
  if (!clientId) {
    console.error("[auth/kakao/callback] KAKAO_REST_API_KEY missing");
    return fail("unavailable");
  }

  try {
    const tokenRes = await fetch("https://kauth.kakao.com/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded;charset=utf-8" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        client_id: clientId,
        redirect_uri: new URL(KAKAO_REDIRECT_PATH, request.url).toString(),
        code,
        ...(clientSecret ? { client_secret: clientSecret } : {}),
      }),
    });
    if (!tokenRes.ok) {
      console.error("[auth/kakao/callback] token exchange failed:", tokenRes.status, await tokenRes.text().catch(() => ""));
      return fail("token");
    }
    const { access_token } = (await tokenRes.json()) as { access_token?: string };
    if (!access_token) return fail("token");

    const meRes = await fetch("https://kapi.kakao.com/v2/user/me", {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    if (!meRes.ok) {
      console.error("[auth/kakao/callback] user/me failed:", meRes.status);
      return fail("profile");
    }
    const me = (await meRes.json()) as {
      id?: number;
      kakao_account?: { profile?: { nickname?: string } };
      properties?: { nickname?: string };
    };
    if (typeof me.id !== "number") return fail("profile");

    const nickname = (me.kakao_account?.profile?.nickname ?? me.properties?.nickname ?? "").slice(0, 20);
    const token = await getAdminAuth().createCustomToken(`${KAKAO_UID_PREFIX}${me.id}`, { kakao: true });

    const hash = new URLSearchParams({ token, ...(nickname ? { nickname } : {}), ...(next ? { next } : {}) });
    const res = NextResponse.redirect(new URL(`/auth/kakao#${hash.toString()}`, request.url));
    res.cookies.delete(KAKAO_STATE_COOKIE);
    return res;
  } catch (err) {
    console.error("[auth/kakao/callback] failed:", err);
    return fail("server");
  }
}
