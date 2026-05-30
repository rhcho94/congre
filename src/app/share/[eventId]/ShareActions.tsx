"use client";

import { useEffect, useState } from "react";

interface KakaoInstance {
  init: (key: string) => void;
  isInitialized: () => boolean;
  Share: { sendDefault: (opts: Record<string, unknown>) => void };
}

interface Props {
  eventTitle: string;
  shareUrl: string;
  logoUrl: string;
}

export function ShareActions({ eventTitle, shareUrl, logoUrl }: Props) {
  const [kakaoReady, setKakaoReady] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_KAKAO_APP_KEY;
    if (!key) return;
    const win = window as Window & { Kakao?: KakaoInstance };
    if (win.Kakao?.isInitialized()) { setKakaoReady(true); return; }
    const script = document.createElement("script");
    script.src = "https://developers.kakao.com/sdk/js/kakao.min.js";
    script.async = true;
    script.onload = () => {
      const K = (window as Window & { Kakao?: KakaoInstance }).Kakao;
      if (K && !K.isInitialized()) { K.init(key); setKakaoReady(true); }
    };
    document.head.appendChild(script);
    return () => { script.remove(); };
  }, []);

  function handleKakaoShare() {
    const K = (window as Window & { Kakao?: KakaoInstance }).Kakao;
    if (!K?.Share) {
      navigator.clipboard.writeText(shareUrl).catch(() => {});
      alert("카카오톡 앱키가 설정되지 않았습니다. 링크가 복사되었습니다.");
      return;
    }
    try {
      K.Share.sendDefault({
        objectType: "feed",
        content: {
          title: eventTitle,
          description: "Congre로 만든 영상입니다 🎬",
          imageUrl: logoUrl,
          link: { mobileWebUrl: shareUrl, webUrl: shareUrl },
        },
      });
    } catch {
      navigator.clipboard.writeText(shareUrl).catch(() => {});
      alert("카카오톡 공유에 실패했습니다. 링크가 복사되었습니다.");
    }
  }

  async function handleLinkCopy() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch {
      alert("링크 복사에 실패했습니다.");
    }
  }

  return (
    <div className="flex gap-2 w-full">
      <button
        onClick={handleKakaoShare}
        disabled={Boolean(process.env.NEXT_PUBLIC_KAKAO_APP_KEY) && !kakaoReady}
        className="btn btn-kakao flex-1"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="#3C1E1E">
          <path d="M12 3C6.48 3 2 6.69 2 11.25c0 2.87 1.7 5.39 4.31 6.95L5.25 21l3.96-2.12A12.2 12.2 0 0 0 12 19.5c5.52 0 10-3.69 10-8.25S17.52 3 12 3z" />
        </svg>
        카카오톡
      </button>

      <button onClick={handleLinkCopy} className="btn btn-secondary flex-1" style={{ height: 46, padding: "0 18px", fontSize: 14 }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
        </svg>
        {linkCopied ? "복사됨!" : "링크 복사"}
      </button>
    </div>
  );
}
