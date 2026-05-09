import Link from "next/link";
import { BrandName } from "@/components/BrandName";

const sections = [
  {
    title: "1. 목적",
    body: "작성 중입니다.",
  },
  {
    title: "2. 서비스 이용 조건",
    body: "작성 중입니다.",
  },
  {
    title: "3. 서비스 제공 및 변경",
    body: "작성 중입니다.",
  },
  {
    title: "4. 책임의 한계",
    body: "작성 중입니다.",
  },
  {
    title: "5. 지적재산권",
    body: "작성 중입니다.",
  },
  {
    title: "6. 분쟁 해결 및 준거법",
    body: "작성 중입니다.",
  },
];

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
      <nav className="flex items-center justify-between px-8 py-6 border-b border-border">
        <Link href="/" className="text-xl tracking-wider hover:opacity-75 transition-opacity duration-200">
          <BrandName />
        </Link>
        <Link
          href="/"
          className="text-xs tracking-widest uppercase text-muted hover:text-accent transition-colors duration-200"
        >
          ← 홈
        </Link>
      </nav>

      <main className="mx-auto max-w-3xl px-6 py-16">
        {/* 임시 배너 */}
        <div className="mb-10 p-4 border border-border bg-surface">
          <p className="text-xs text-accent tracking-wide font-medium">임시 페이지 — 콘텐츠 작성 중</p>
          <p className="text-xs text-muted mt-1 leading-relaxed">
            운영자가 콘텐츠를 추가할 예정입니다. 현재 항목 구조만 표시됩니다.
          </p>
        </div>

        <div className="mb-10">
          <p className="text-xs tracking-[0.4em] uppercase text-accent mb-3">Legal</p>
          <h1
            className="text-3xl italic text-foreground"
            style={{ fontFamily: "var(--font-display, serif)" }}
          >
            이용약관
          </h1>
          <p className="text-xs text-muted mt-3">시행일: 작성 중</p>
        </div>

        <div className="rule mb-10" />

        <div className="flex flex-col gap-10">
          {sections.map((s) => (
            <div key={s.title} className="flex flex-col gap-3">
              <h2 className="text-sm font-medium text-foreground tracking-wide">{s.title}</h2>
              <p className="text-sm leading-relaxed text-muted">{s.body}</p>
            </div>
          ))}
        </div>

        <div className="rule mt-14 mb-10" />

        <div className="flex flex-col gap-3">
          <p className="text-xs text-muted leading-relaxed">
            이용약관 관련 문의:{" "}
            <a
              href="mailto:hello@congre.kr"
              className="text-accent hover:underline"
            >
              hello@congre.kr
            </a>
          </p>
          <Link
            href="/"
            className="text-xs text-muted hover:text-accent tracking-widest uppercase transition-colors duration-200"
          >
            ← 홈으로
          </Link>
        </div>
      </main>
    </div>
  );
}
