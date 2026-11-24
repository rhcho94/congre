"use client";

// 카카오로 시작하기 (2026-11-24) — 로그인 · 가입 화면 맨 위. 서버 주소로 이동해 카카오 동의 화면을 연다.

export default function KakaoLoginButton() {
  return (
    <a
      href="/api/auth/kakao/start"
      className="btn btn-kakao w-full flex items-center justify-center gap-2"
      style={{ height: 54, fontSize: 17 }}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M12 3C6.48 3 2 6.69 2 11.25c0 2.87 1.7 5.39 4.31 6.95L5.25 21l3.96-2.12A12.2 12.2 0 0 0 12 19.5c5.52 0 10-3.69 10-8.25S17.52 3 12 3z" />
      </svg>
      카카오로 시작하기
    </a>
  );
}
