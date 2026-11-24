"use client";

import dynamic from "next/dynamic";

// 주소의 # 뒤(토큰)는 폰에서만 읽을 수 있다 — 서버에서 미리 그리지 않는다
const KakaoAuthView = dynamic(() => import("./KakaoAuthView"), {
  ssr: false,
  loading: () => <p className="eyebrow text-center animate-pulse py-24">카카오 계정 확인 중...</p>,
});

export default function KakaoAuthPage() {
  return <KakaoAuthView />;
}
