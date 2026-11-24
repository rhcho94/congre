import { randomBytes } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { KAKAO_REDIRECT_PATH, KAKAO_STATE_COOKIE } from "@/lib/kakao-auth";

// 카카오 로그인 시작 — 가로채기 방지값(state)을 쿠키에 두고 카카오 동의 화면으로 보낸다.
// ?next=create 는 로그인 뒤 이벤트 만들기로, ?next=withdraw 는 마이페이지 탈퇴 확인으로 돌아간다(다른 값은 무시).
export async function GET(request: NextRequest) {
  const clientId = process.env.KAKAO_REST_API_KEY;
  if (!clientId) {
    console.error("[auth/kakao/start] KAKAO_REST_API_KEY missing");
    return NextResponse.redirect(new URL("/auth/kakao?error=unavailable", request.url));
  }

  const nextParam = request.nextUrl.searchParams.get("next");
  const next = nextParam === "create" || nextParam === "withdraw" ? nextParam : "";
  const state = randomBytes(16).toString("hex");

  const authorize = new URL("https://kauth.kakao.com/oauth/authorize");
  authorize.searchParams.set("client_id", clientId);
  authorize.searchParams.set("redirect_uri", new URL(KAKAO_REDIRECT_PATH, request.url).toString());
  authorize.searchParams.set("response_type", "code");
  authorize.searchParams.set("state", state);
  // 탈퇴 확인은 이미 로그인돼 있어도 다시 동의 화면을 거치게 한다
  if (next === "withdraw") authorize.searchParams.set("prompt", "login");

  const response = NextResponse.redirect(authorize);
  response.cookies.set({
    name: KAKAO_STATE_COOKIE,
    value: next ? `${state}.${next}` : state,
    path: "/",
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 10 * 60,
  });
  return response;
}
