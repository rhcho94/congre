import Link from "next/link";

const features = [
  {
    number: "01",
    title: "QR 하나로 접속",
    desc: "참가자는 앱 설치 없이 QR 코드나 링크로 바로 입장합니다.",
  },
  {
    number: "02",
    title: "10초 영상 업로드",
    desc: "누구든 스마트폰으로 촬영한 순간을 그 자리에서 공유합니다.",
  },
  {
    number: "03",
    title: "AI 자동 편집",
    desc: "마감 후 AI가 9:16 세로 영상으로 자동 편집해 바로 공유 가능합니다.",
  },
];

export default function LandingPage() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Radial vignette */}
      <div
        className="pointer-events-none fixed inset-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 70% at 50% 40%, #1c1710 0%, var(--bg) 70%)",
        }}
      />

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-8 py-6">
        <span
          className="text-2xl italic tracking-wider text-foreground"
          style={{ fontFamily: "var(--font-display, serif)" }}
        >
          congre
        </span>
        <Link
          href="/host"
          className="text-sm tracking-widest uppercase text-muted hover:text-accent transition-colors duration-200"
        >
          주최자 로그인 →
        </Link>
      </nav>

      {/* Hero */}
      <section className="relative z-10 flex flex-col items-center px-4 pt-20 pb-28 text-center">
        {/* Eyebrow + rules */}
        <div className="mb-6 flex items-center gap-4 w-full max-w-lg">
          <div className="rule flex-1" />
          <span className="text-xs tracking-[0.4em] uppercase text-accent whitespace-nowrap">
            Event Video Platform
          </span>
          <div className="rule flex-1" />
        </div>

        {/* Wordmark */}
        <h1
          className="text-[clamp(4rem,15vw,9rem)] leading-none tracking-[0.18em] uppercase font-light italic select-none text-foreground"
          style={{
            fontFamily: "var(--font-display, serif)",
            textShadow: "0 0 80px rgba(200,137,44,0.14)",
          }}
        >
          Congre
        </h1>

        <div className="rule mt-6 w-full max-w-sm mx-auto" />

        <p className="mt-8 text-sm tracking-[0.2em] uppercase text-muted">
          이벤트의 모든 순간을 하나의 영상으로
        </p>

        {/* CTAs */}
        <div className="mt-10 flex flex-col sm:flex-row gap-4">
          <Link
            href="/host"
            className="px-8 py-3.5 text-sm tracking-widest uppercase font-medium bg-accent text-background hover:brightness-110 transition-all duration-200 glow-accent"
          >
            주최자로 시작하기
          </Link>
          <p className="px-2 py-3.5 text-xs text-muted leading-relaxed text-center max-w-xs" style={{ opacity: 0.7 }}>
            참가자는 주최자에게 받은 링크 또는 QR코드로 접속해주세요
          </p>
        </div>
      </section>

      {/* Feature cards */}
      <section className="relative z-10 mx-auto max-w-4xl px-6 pb-24">
        <div className="rule mb-16" />

        <div
          className="grid grid-cols-1 md:grid-cols-3 gap-px"
          style={{ background: "var(--border)" }}
        >
          {features.map((f) => (
            <div
              key={f.number}
              className="flex flex-col gap-4 p-8 bg-surface"
            >
              <span className="text-xs tracking-[0.4em] uppercase text-accent">
                {f.number}
              </span>
              <h3
                className="text-lg font-medium text-foreground"
                style={{ fontFamily: "var(--font-display, serif)" }}
              >
                {f.title}
              </h3>
              <p className="text-sm leading-relaxed text-muted">{f.desc}</p>
            </div>
          ))}
        </div>

        <div className="rule mt-16" />

        <p className="mt-8 text-center text-xs tracking-[0.3em] uppercase text-muted">
          © 2025 congre
        </p>
      </section>
    </div>
  );
}
