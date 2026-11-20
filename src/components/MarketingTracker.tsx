"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { captureAttribution } from "@/lib/attribution";

// 메타 픽셀(페이지 조회만) + 광고 유입 정보 저장.
// NEXT_PUBLIC_META_PIXEL_ID가 없으면 아무것도 하지 않는다.
// 참가자 화면(/upload · /share)과 참가자 안내(/guide/guest — 업로드 화면에서 넘어온다)는 가입하지 않은 사람이 쓰므로 넣지 않는다.
// 가입 · 이벤트 생성 · 결제는 브라우저가 아니라 서버가 보낸다(src/lib/meta-capi.ts).
// 랜딩(www.congre.kr)의 같은 일은 git 밖 deploy/visit.js가 한다.

const PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID;
const EXCLUDED_PREFIXES = ["/upload", "/share", "/guide/guest"];

interface Fbq {
  (...args: unknown[]): void;
  callMethod?: (...args: unknown[]) => void;
  queue: unknown[][];
  push: Fbq;
  loaded: boolean;
  version: string;
}

declare global {
  interface Window {
    fbq?: Fbq;
    _fbq?: Fbq;
  }
}

function ensurePixel(pixelId: string): Fbq {
  if (window.fbq) return window.fbq;
  const fbq = function (...args: unknown[]) {
    if (fbq.callMethod) {
      fbq.callMethod(...args);
    } else {
      fbq.queue.push(args);
    }
  } as Fbq;
  fbq.push = fbq;
  fbq.loaded = true;
  fbq.version = "2.0";
  fbq.queue = [];
  window.fbq = fbq;
  window._fbq = fbq;
  const script = document.createElement("script");
  script.async = true;
  script.src = "https://connect.facebook.net/en_US/fbevents.js";
  document.head.appendChild(script);
  // 자동 구성(버튼 클릭 · 페이지 정보 자동 수집)을 끈다 — 페이지 조회만 보낸다는 처리방침 범위(제2조 · 제8조)에 맞춘다.
  // init보다 먼저 불러야 적용된다(메타 픽셀 문서의 autoConfig 옵션).
  fbq("set", "autoConfig", false, pixelId);
  fbq("init", pixelId);
  return fbq;
}

export default function MarketingTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (!PIXEL_ID) return;
    if (EXCLUDED_PREFIXES.some((prefix) => pathname.startsWith(prefix))) return;
    try {
      captureAttribution(window.location.search, pathname);
      ensurePixel(PIXEL_ID)("track", "PageView");
    } catch (err) {
      console.error("[marketing-tracker] failed:", err);
    }
  }, [pathname]);

  return null;
}
