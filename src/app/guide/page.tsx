import Link from "next/link";
import { BrandName } from "@/components/BrandName";

export default function GuidePage() {
  return (
    <div className="min-h-screen bg-background">
      <nav className="flex items-center justify-between px-8 py-6 border-b border-border">
        <Link
          href="/"
          className="text-xl tracking-wider hover:opacity-75 transition-opacity duration-200"
        >
          <BrandName />
        </Link>
        <Link
          href="/"
          className="text-xs tracking-widest uppercase text-muted hover:text-accent transition-colors duration-200"
        >
          ← 홈
        </Link>
      </nav>

      <main className="mx-auto max-w-5xl px-6 py-16">
        <div className="mb-10 max-w-3xl">
          <p className="text-xs tracking-[0.4em] uppercase text-accent mb-3">USER GUIDE</p>
          <h1
            className="text-3xl italic text-foreground"
            style={{ fontFamily: "var(--font-display, serif)" }}
          >
            Congre 사용 가이드
          </h1>
        </div>

        <div className="rule mb-10" />

        <p className="text-sm leading-relaxed text-muted max-w-3xl mb-12">
          이벤트 만들기부터 완성본 공유까지, 호스트와 참가자 양쪽 흐름을 한 권에 담았습니다.<br />
          처음 사용하신다면 본인 입장에 맞는 가이드를 선택해 주세요.
        </p>

        <div
          className="grid grid-cols-1 gap-px md:grid-cols-2"
          style={{ background: "var(--border)" }}
        >
          {/* 카드 A — 호스트 */}
          <div className="flex flex-col gap-5 p-8 bg-surface">
            <span className="text-xs tracking-[0.4em] uppercase text-accent">HOST · 6 STEPS</span>
            <h2
              className="text-xl font-medium text-foreground"
              style={{ fontFamily: "var(--font-display, serif)" }}
            >
              행사 주최자라면
            </h2>
            <p className="text-sm leading-relaxed text-muted">
              이벤트 만들기·참가자 초대·마감·완성본 받기까지 여섯 단계로 안내합니다.
            </p>
            <Link
              href="/guide/host"
              className="mt-auto text-sm text-accent hover:underline transition-colors duration-200"
            >
              호스트 가이드 보기 →
            </Link>
          </div>

          {/* 카드 B — 참가자 */}
          <div className="flex flex-col gap-5 p-8 bg-surface">
            <span className="text-xs tracking-[0.4em] uppercase text-accent">GUEST · 4 STEPS</span>
            <h2
              className="text-xl font-medium text-foreground"
              style={{ fontFamily: "var(--font-display, serif)" }}
            >
              행사 참가자라면
            </h2>
            <p className="text-sm leading-relaxed text-muted">
              QR 한 번이면 끝. 앱 설치 없이 네 단계로 영상을 올립니다.
            </p>
            <Link
              href="/guide/guest"
              className="mt-auto text-sm text-accent hover:underline transition-colors duration-200"
            >
              참가자 가이드 보기 →
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
