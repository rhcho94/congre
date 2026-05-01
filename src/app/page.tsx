import Link from "next/link";
import {
  QrCode,
  Sparkles,
  Share2,
  Download,
  Clock,
  Smartphone,
  ChevronDown,
} from "lucide-react";

/* ─── data ─────────────────────────────────────────── */

const steps = [
  {
    num: "01",
    title: "QR로 영상 받기",
    desc: "참가자가 QR을 스캔해 축하 영상을 올립니다. 앱 설치 없음.",
  },
  {
    num: "02",
    title: "AI가 자동 편집",
    desc: "마감하면 베스트컷을 골라 한 편의 영상을 완성합니다.",
  },
  {
    num: "03",
    title: "SNS 즉시 공유",
    desc: "인스타·틱톡·카카오로 행사 중에 바로 공유할 수 있어요.",
  },
];

const reasons = [
  {
    icon: QrCode,
    title: "앱 설치 없이 QR 한 번",
    desc: "참가자는 가입·다운로드 불필요. 링크 하나로 바로 촬영.",
  },
  {
    icon: Sparkles,
    title: "AI 베스트컷 자동 선별",
    desc: "웃음·환호 구간을 자동으로 찾아 하이라이트 영상으로.",
  },
  {
    icon: Clock,
    title: "행사 중 5분 내 완성",
    desc: "분위기가 식기 전에 영상이 나옵니다.",
  },
  {
    icon: Smartphone,
    title: "SNS 최적 9:16",
    desc: "인스타 릴스·틱톡에 그대로 올리는 세로 영상.",
  },
];

const useCases = [
  {
    label: "결혼식",
    desc: "하객 한 사람 한 사람의 진심 어린 순간을 한 편에.",
    accent: "var(--accent)",
  },
  {
    label: "돌잔치",
    desc: "소중한 첫 번째 생일을 가족 모두의 시선으로 담습니다.",
    accent: "#a07850",
  },
  {
    label: "기업 행사",
    desc: "컨퍼런스·송년회의 에너지를 팀 모두가 함께 기억하도록.",
    accent: "#7b8ce0",
  },
  {
    label: "동호회·모임",
    desc: "함께한 시간의 감동을 오래 남길 단 하나의 영상으로.",
    accent: "#5ba06e",
  },
];

/* ─── page ──────────────────────────────────────────── */

export default function LandingPage() {
  return (
    <div className="relative min-h-screen overflow-x-hidden">

      {/* ── Nav ── */}
      <nav className="relative z-20 flex items-center justify-between px-8 py-6">
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

      {/* ── Hero ── */}
      <section className="relative z-10 flex flex-col" style={{ minHeight: "calc(90vh - 80px)" }}>
        <div className="mx-auto w-full max-w-6xl px-6 pt-12 pb-16 md:pt-16 flex-1 flex flex-col">
          {/* Ambient glow */}
          <div
            className="pointer-events-none absolute right-0 top-0 h-[600px] w-[400px] opacity-20 blur-3xl"
            style={{ background: "radial-gradient(ellipse at center, #c8892c 0%, transparent 70%)" }}
            aria-hidden
          />

          <div className="relative grid grid-cols-1 gap-16 md:grid-cols-12 md:gap-8 md:items-center flex-1">

            {/* Left: copy + CTA — 7 cols */}
            <div className="flex flex-col gap-8 md:col-span-7">
              {/* Eyebrow */}
              <div className="flex items-center gap-4">
                <div className="h-px w-10 shrink-0" style={{ background: "var(--border)" }} />
                <span className="text-xs tracking-[0.4em] uppercase text-accent whitespace-nowrap">
                  Event Video Platform
                </span>
              </div>

              {/* Wordmark + headline */}
              <div className="flex flex-col gap-4">
                <span
                  className="text-sm italic tracking-[0.3em] uppercase text-muted"
                  style={{ fontFamily: "var(--font-display, serif)" }}
                >
                  congre
                </span>
                <h1
                  className="text-5xl leading-tight italic text-foreground md:text-6xl lg:text-7xl"
                  style={{ fontFamily: "var(--font-display, serif)" }}
                >
                  이 순간을
                  <br />
                  <span style={{ color: "var(--accent)" }}>영원히</span>
                </h1>
              </div>

              <p className="text-base leading-relaxed text-muted max-w-md">
                결혼식·돌잔치 하객의 10초 영상이 모여,<br />
                평생 간직할 한 편의 영상이 됩니다.
              </p>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <Link
                  href="/host"
                  className="inline-block px-8 py-4 text-sm tracking-widest uppercase font-medium bg-accent text-background glow-accent text-center transition-all duration-200 ease-out hover:brightness-110 hover:scale-[1.02] hover:shadow-[0_0_60px_0_rgba(200,137,44,0.38)] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                >
                  이벤트 만들기
                </Link>
                <span className="text-xs text-muted opacity-60 pl-1">
                  지금은 무료로 체험 가능
                </span>
              </div>
            </div>

            {/* Right: hero video — 5 cols */}
            <div className="flex justify-center md:col-span-5">
              <div
                className="relative overflow-hidden rounded-2xl bg-surface shadow-2xl"
                style={{
                  aspectRatio: "9 / 16",
                  width: "100%",
                  maxWidth: "260px",
                  boxShadow: "0 0 60px 0 rgba(200, 137, 44, 0.12), 0 32px 64px rgba(0,0,0,0.6)",
                }}
              >
                <video
                  autoPlay
                  muted
                  loop
                  playsInline
                  preload="metadata"
                  className="w-full h-full object-cover"
                  style={{ background: "var(--surface)" }}
                >
                  <source src="/videos/hero.mp4" type="video/mp4" />
                </video>
                <div
                  className="pointer-events-none absolute inset-0 rounded-2xl"
                  style={{ boxShadow: "inset 0 0 40px 0 rgba(12,11,9,0.4)" }}
                  aria-hidden
                />
              </div>
            </div>

          </div>
        </div>

        {/* Scroll cue */}
        <div className="flex justify-center pb-8 opacity-40">
          <ChevronDown
            size={22}
            className="text-accent animate-bounce"
            strokeWidth={1.5}
            aria-hidden
          />
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="relative z-10 mx-auto max-w-5xl px-6 py-24 md:py-32">
        <div className="rule mb-16" />

        <div className="mb-14 flex flex-col gap-3">
          <span className="text-xs tracking-[0.4em] uppercase text-accent">How it works</span>
          <h2
            className="text-3xl italic text-foreground md:text-4xl"
            style={{ fontFamily: "var(--font-display, serif)" }}
          >
            세 단계면 끝납니다
          </h2>
        </div>

        <div
          className="grid grid-cols-1 gap-px md:grid-cols-3"
          style={{ background: "var(--border)" }}
        >
          {steps.map((s) => (
            <div key={s.num} className="flex flex-col gap-5 p-8 bg-surface">
              <span
                className="text-5xl italic text-accent leading-none opacity-70"
                style={{ fontFamily: "var(--font-display, serif)" }}
              >
                {s.num}
              </span>
              <h3
                className="text-lg font-medium text-foreground"
                style={{ fontFamily: "var(--font-display, serif)" }}
              >
                {s.title}
              </h3>
              <p className="text-sm leading-relaxed text-muted">{s.desc}</p>
            </div>
          ))}
        </div>

        <div className="rule mt-16" />
      </section>

      {/* ── Why congre ── */}
      <section className="relative z-10 mx-auto max-w-5xl px-6 py-12 md:py-20">
        {/* subtle bg wash */}
        <div
          className="pointer-events-none absolute inset-0 opacity-30"
          style={{
            background: "radial-gradient(ellipse 80% 60% at 50% 50%, #1c1710 0%, transparent 80%)",
          }}
          aria-hidden
        />

        <div className="relative mb-14 flex flex-col gap-3">
          <span className="text-xs tracking-[0.4em] uppercase text-accent">Why congre</span>
          <h2
            className="text-3xl italic text-foreground md:text-4xl"
            style={{ fontFamily: "var(--font-display, serif)" }}
          >
            왜 congre인가요
          </h2>
        </div>

        <div className="relative grid grid-cols-1 gap-6 sm:grid-cols-2">
          {reasons.map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="flex gap-5 p-7 border border-border bg-surface hover:border-accent transition-colors duration-300"
            >
              <div className="shrink-0 mt-0.5">
                <Icon size={20} className="text-accent opacity-80" strokeWidth={1.5} />
              </div>
              <div className="flex flex-col gap-2">
                <h3 className="text-sm font-medium text-foreground tracking-wide">{title}</h3>
                <p className="text-sm leading-relaxed text-muted">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Use cases ── */}
      <section className="relative z-10 mx-auto max-w-5xl px-6 py-24 md:py-32">
        <div className="rule mb-16" />

        <div className="mb-14 flex flex-col gap-3">
          <span className="text-xs tracking-[0.4em] uppercase text-accent">Use cases</span>
          <h2
            className="text-3xl italic text-foreground md:text-4xl"
            style={{ fontFamily: "var(--font-display, serif)" }}
          >
            어떤 자리에든 어울립니다
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-px sm:grid-cols-2" style={{ background: "var(--border)" }}>
          {useCases.map((c) => (
            <div
              key={c.label}
              className="group flex flex-col gap-4 p-8 bg-surface hover:bg-[var(--surface-2)] transition-colors duration-200"
            >
              <span
                className="text-xs tracking-[0.4em] uppercase transition-colors duration-200"
                style={{ color: c.accent }}
              >
                {c.label}
              </span>
              <p className="text-sm leading-relaxed text-muted">{c.desc}</p>
            </div>
          ))}
        </div>

        <div className="rule mt-16" />
      </section>

      {/* ── Final CTA ── */}
      <section className="relative z-10 mx-auto max-w-3xl px-6 py-24 text-center md:py-36">
        <div
          className="pointer-events-none absolute inset-0 opacity-15"
          style={{
            background: "radial-gradient(ellipse 70% 60% at 50% 50%, #c8892c 0%, transparent 70%)",
          }}
          aria-hidden
        />
        <div className="relative flex flex-col items-center gap-8">
          <div className="flex items-center gap-4 w-full max-w-xs mx-auto">
            <div className="rule flex-1" />
            <Share2 size={14} className="text-accent shrink-0" strokeWidth={1.5} />
            <div className="rule flex-1" />
          </div>

          <h2
            className="text-4xl italic text-foreground md:text-5xl lg:text-6xl"
            style={{ fontFamily: "var(--font-display, serif)" }}
          >
            지금 시작해보세요
          </h2>

          <p className="text-sm text-muted tracking-wide">
            지금은 무료로 체험할 수 있어요
          </p>

          <Link
            href="/host"
            className="inline-block px-10 py-4 text-sm tracking-widest uppercase font-medium bg-accent text-background glow-accent transition-all duration-200 ease-out hover:brightness-110 hover:scale-[1.02] hover:shadow-[0_0_60px_0_rgba(200,137,44,0.38)] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            이벤트 만들기
          </Link>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="relative z-10 border-t border-border">
        <div className="mx-auto max-w-5xl px-6 py-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-1">
            <span
              className="text-base italic tracking-wider text-foreground"
              style={{ fontFamily: "var(--font-display, serif)" }}
            >
              congre
            </span>
            <p className="text-xs text-muted opacity-60">© 2025 congre. All rights reserved.</p>
          </div>
          <a
            href="mailto:hello@congre.io"
            className="text-xs tracking-widest uppercase text-muted hover:text-accent transition-colors duration-200"
          >
            문의하기 →
          </a>
        </div>
      </footer>

    </div>
  );
}
