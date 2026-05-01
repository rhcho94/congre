"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { QRCodeSVG, QRCodeCanvas } from "qrcode.react";
import { subscribeToAuthChanges, type User } from "@/lib/auth";
import { createEvent, type EventPlan } from "@/lib/events";
import { isFirebaseConfigured } from "@/lib/firebase";

const planOptions: { value: EventPlan; label: string; desc: string }[] = [
  { value: "free",   label: "무료", desc: "최대 10클립" },
  { value: "small",  label: "소형", desc: "최대 50클립" },
  { value: "medium", label: "중형", desc: "최대 200클립" },
  { value: "large",  label: "대형", desc: "무제한" },
];

type View = "form" | "created";

export default function CreateEventPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [authChecking, setAuthChecking] = useState(isFirebaseConfigured);
  const [view, setView] = useState<View>("form");
  const [form, setForm] = useState({ title: "", date: "", plan: "free" as EventPlan });
  const [submitting, setSubmitting] = useState(false);
  const [createdEventId, setCreatedEventId] = useState("");
  const [shareUrl, setShareUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const qrHiResRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isFirebaseConfigured) return;
    return subscribeToAuthChanges((firebaseUser) => {
      setUser(firebaseUser);
      setAuthChecking(false);
      if (!firebaseUser) router.push("/host");
    });
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setSubmitting(true);
    try {
      const { eventId, sessionToken } = await createEvent({
        title: form.title,
        date: form.date,
        plan: form.plan,
        hostId: user.uid,
      });
      const url = `${window.location.origin}/upload/${eventId}?token=${sessionToken}`;
      setCreatedEventId(eventId);
      setShareUrl(url);
      setView("created");
    } catch {
      alert("이벤트 생성 중 오류가 발생했습니다. 다시 시도해주세요.");
    } finally {
      setSubmitting(false);
    }
  }

  function handleQRDownload() {
    const canvas = qrHiResRef.current?.querySelector("canvas");
    if (!canvas) return;
    const url = (canvas as HTMLCanvasElement).toDataURL("image/png");
    const a = document.createElement("a");
    a.href = url;
    a.download = `congre-qr-${form.title || createdEventId}.png`;
    a.click();
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      alert("링크 복사에 실패했습니다.");
    }
  }

  if (!isFirebaseConfigured) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6">
        <div className="max-w-sm w-full p-6 border border-border bg-surface text-center">
          <p className="text-xs text-accent font-medium tracking-wide mb-2">Firebase 미연결</p>
          <p className="text-xs text-muted leading-relaxed mb-4">
            .env.local에 Firebase 설정값을 추가하면 이벤트를 생성할 수 있습니다.
          </p>
          <Link
            href="/host"
            className="text-xs tracking-widest uppercase text-muted hover:text-accent transition-colors"
          >
            ← 로그인 페이지
          </Link>
        </div>
      </div>
    );
  }

  if (authChecking) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-xs tracking-widest uppercase text-muted animate-pulse">확인 중...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <nav className="flex items-center justify-between px-8 py-6 border-b border-border">
        <Link
          href="/"
          className="text-xl italic tracking-wider text-foreground hover:text-accent transition-colors duration-200"
          style={{ fontFamily: "var(--font-display, serif)" }}
        >
          Congre
        </Link>
        {view === "form" && (
          <Link
            href="/dashboard"
            className="text-xs tracking-widest uppercase text-muted hover:text-accent transition-colors duration-200"
          >
            ← 대시보드
          </Link>
        )}
      </nav>

      <main className="mx-auto max-w-lg px-6 py-16">
        {view === "form" ? (
          <>
            <p className="text-xs tracking-[0.4em] uppercase text-accent mb-4">New Event</p>
            <h1
              className="text-3xl italic text-foreground mb-10"
              style={{ fontFamily: "var(--font-display, serif)" }}
            >
              새 이벤트 만들기
            </h1>

            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
              <label className="flex flex-col gap-1.5">
                <span className="text-xs tracking-widest uppercase text-muted">이벤트 이름</span>
                <input
                  type="text"
                  placeholder="팀 워크샵 2026"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  required
                  disabled={submitting}
                  className="bg-surface border border-border px-4 py-3 text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-accent transition-colors duration-200 disabled:opacity-50"
                />
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="text-xs tracking-widest uppercase text-muted">이벤트 날짜</span>
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  required
                  disabled={submitting}
                  className="bg-surface border border-border px-4 py-3 text-sm text-foreground focus:outline-none focus:border-accent transition-colors duration-200"
                  style={{ colorScheme: "dark" }}
                />
              </label>

              <div className="flex flex-col gap-1.5">
                <span className="text-xs tracking-widest uppercase text-muted">플랜 선택</span>
                <div className="grid grid-cols-2 gap-2">
                  {planOptions.map((opt) => (
                    <label
                      key={opt.value}
                      className={`flex flex-col gap-0.5 p-4 border cursor-pointer transition-all duration-150 ${
                        form.plan === opt.value
                          ? "border-accent bg-[var(--surface-2)]"
                          : "border-border bg-surface hover:border-muted"
                      }`}
                    >
                      <input
                        type="radio"
                        name="plan"
                        value={opt.value}
                        checked={form.plan === opt.value}
                        onChange={() => setForm({ ...form, plan: opt.value })}
                        disabled={submitting}
                        className="sr-only"
                      />
                      <span className="text-sm text-foreground font-medium">{opt.label}</span>
                      <span className="text-xs text-muted">{opt.desc}</span>
                    </label>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="mt-2 py-3.5 bg-accent text-background text-sm tracking-widest uppercase font-medium hover:brightness-110 transition-all duration-200 glow-accent disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:brightness-100"
              >
                {submitting ? "생성 중..." : "이벤트 만들기"}
              </button>
            </form>
          </>
        ) : (
          <>
            <div className="flex items-center gap-3 mb-10">
              <div className="w-8 h-8 border border-accent flex items-center justify-center shrink-0">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  className="text-accent"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <div>
                <p className="text-xs tracking-[0.4em] uppercase text-accent">이벤트 생성 완료</p>
                <p className="text-xs text-muted mt-0.5">QR코드로 참가자를 초대하세요</p>
              </div>
            </div>

            <div className="flex flex-col items-center gap-6 p-8 border border-border bg-surface mb-8">
              <div className="flex flex-col items-center gap-3">
                <QRCodeSVG
                  value={shareUrl}
                  size={180}
                  bgColor="#151310"
                  fgColor="#ede8df"
                  level="M"
                />
                <button
                  onClick={handleQRDownload}
                  className="px-3 py-1.5 border border-border text-xs text-foreground hover:border-accent hover:text-accent transition-all duration-200"
                >
                  QR 이미지 저장
                </button>
              </div>
              <div className="w-full">
                <p className="text-xs text-muted tracking-widest uppercase mb-2">공유 링크</p>
                <div className="flex items-center gap-2">
                  <span className="flex-1 min-w-0 text-xs text-foreground bg-[var(--surface-2)] border border-border px-3 py-2 truncate font-mono">
                    {shareUrl}
                  </span>
                  <button
                    onClick={handleCopy}
                    className="shrink-0 px-3 py-2 border border-border text-xs text-muted hover:border-accent hover:text-foreground transition-all duration-200"
                  >
                    {copied ? "복사됨" : "복사"}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <Link
                href={`/dashboard/events/${createdEventId}`}
                className="w-full py-3.5 bg-accent text-background text-sm tracking-widest uppercase font-medium text-center hover:brightness-110 transition-all duration-200 glow-accent block"
              >
                이벤트 대시보드로 이동 →
              </Link>
              <Link
                href="/dashboard"
                className="w-full py-3 border border-border text-muted text-xs tracking-widest uppercase text-center hover:border-accent hover:text-foreground transition-all duration-200 block"
              >
                목록으로 돌아가기
              </Link>
            </div>
          </>
        )}
      </main>

      {/* 고해상도 QR 다운로드용 히든 캔버스 */}
      {shareUrl && (
        <div
          ref={qrHiResRef}
          aria-hidden="true"
          style={{ position: "fixed", left: -9999, top: -9999, pointerEvents: "none" }}
        >
          <QRCodeCanvas
            value={shareUrl}
            size={512}
            bgColor="#ffffff"
            fgColor="#0c0b09"
            level="M"
          />
        </div>
      )}
    </div>
  );
}
