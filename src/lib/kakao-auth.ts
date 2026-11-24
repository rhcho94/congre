// 카카오 로그인 (2026-11-24). 카카오 개발자 앱의 REST API 방식.
// 흐름: /api/auth/kakao/start → 카카오 → /api/auth/kakao/callback → Firebase 커스텀 토큰 → /auth/kakao 화면에서 로그인.
// 받는 정보는 카카오 회원번호 · 닉네임뿐(이메일 · 전화번호는 받지 않는다 — 비즈 앱 · 권한 심사가 필요).
// Firebase 계정 아이디 = "kakao:회원번호". 이메일 인증 대신 이 아이디 꼴로 카카오 회원을 알아본다.
// 카카오 회원은 이메일이 없다 — 이벤트를 만들 때 알림 받을 이메일을 직접 적는다.

export const KAKAO_UID_PREFIX = "kakao:";
export const KAKAO_STATE_COOKIE = "cg_kakao_state";
export const KAKAO_REDIRECT_PATH = "/api/auth/kakao/callback";

// 탈퇴는 카카오로 다시 로그인한 뒤 이 시간 안에만 (비밀번호 재확인 대신)
export const KAKAO_REAUTH_MAX_SEC = 10 * 60;

export function isKakaoUid(uid: string | null | undefined): boolean {
  return typeof uid === "string" && /^kakao:\d+$/.test(uid);
}
