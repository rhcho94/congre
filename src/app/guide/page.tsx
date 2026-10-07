import Link from "next/link";
import type { CSSProperties } from "react";
import { BrandName } from "@/components/BrandName";
import { LANDING_URL } from "@/lib/constants";
import PageBackdrop from "@/components/PageBackdrop";

// 흰 카드 전체가 링크 — 아래 줄에 "… 가이드 보기"(화살표 없음)
const CARD: CSSProperties = { padding: 16, color: "var(--text)" };

export default function GuidePage() {
  return (
    <>
      <PageBackdrop pattern="d" />
      <div className="min-h-screen">
        <nav className="flex items-center justify-between gap-2 pl-5 pr-3.5 py-2 min-h-[60px]">
          <a href={LANDING_URL} className="inline-flex items-center hover:opacity-75 transition-opacity duration-200">
            <BrandName />
          </a>
          <a href={LANDING_URL} className="btn-quiet text-sm" style={{ padding: "0 6px" }}>
            ← 홈
          </a>
        </nav>

        <main className="mx-auto max-w-5xl px-5 pb-16 flex flex-col gap-4">
          <h1 className="display" style={{ fontSize: 28, lineHeight: 1.3, paddingTop: 12 }}>Congre 사용 가이드</h1>

          <p className="text-muted max-w-3xl" style={{ fontSize: 15, lineHeight: 1.6 }}>
            이벤트 만들기부터 완성본 공유까지, 호스트와 참가자 양쪽 흐름을 한 권에 담았습니다.<br />
            처음 사용하신다면 본인 입장에 맞는 가이드를 선택해 주세요.
          </p>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {/* 카드 A — 호스트 */}
            <Link href="/guide/host" className="notice flex flex-col gap-2.5" style={CARD}>
              <h2 className="display" style={{ fontSize: 20, lineHeight: 1.35 }}>행사 주최자라면</h2>
              <p className="text-muted" style={{ fontSize: 14, lineHeight: 1.6 }}>
                이벤트 만들기·참가자 초대·마감·완성본 받기까지 여섯 단계로 안내합니다.
              </p>
              <span className="mt-auto" style={{ fontSize: 15, color: "var(--accent)" }}>
                호스트 가이드 보기
              </span>
            </Link>

            {/* 카드 B — 참가자 */}
            <Link href="/guide/guest" className="notice flex flex-col gap-2.5" style={CARD}>
              <h2 className="display" style={{ fontSize: 20, lineHeight: 1.35 }}>행사 참가자라면</h2>
              <p className="text-muted" style={{ fontSize: 14, lineHeight: 1.6 }}>
                QR 한 번이면 끝. 앱 설치 없이 세 단계로 영상을 올립니다.
              </p>
              <span className="mt-auto" style={{ fontSize: 15, color: "var(--accent)" }}>
                참가자 가이드 보기
              </span>
            </Link>
          </div>
        </main>
      </div>
    </>
  );
}
