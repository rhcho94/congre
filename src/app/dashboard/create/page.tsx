"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import AppHeader from "@/components/AppHeader";
import PageBackdrop from "@/components/PageBackdrop";
import { useRouter } from "next/navigation";
import { QRCodeSVG, QRCodeCanvas } from "qrcode.react";
import { subscribeToAuthChanges, type User } from "@/lib/auth";
import { type EventPlan } from "@/lib/events";
import { isFirebaseConfigured, getFirebaseAuth } from "@/lib/firebase";
import { getPlanMaxClipSeconds } from "@/lib/plans";
import { Lock } from "lucide-react";

const planOptions: { value: EventPlan; label: string; desc: string }[] = [
  { value: "free", label: "무료", desc: "최대 5클립 · 10초 · 워터마크" },
  { value: "paid", label: "유료", desc: "마감 시 사용량만큼 결제" },
];

type View = "form" | "created";

const glassPanel: React.CSSProperties = {
  background: "color-mix(in srgb, var(--surface-1) 78%, transparent)",
  backdropFilter: "blur(22px) saturate(140%)",
  WebkitBackdropFilter: "blur(22px) saturate(140%)",
  border: "1px solid var(--hairline-strong)",
  borderRadius: "var(--r-lg)",
};

export default function CreateEventPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [authChecking, setAuthChecking] = useState(isFirebaseConfigured);
  const [view, setView] = useState<View>("form");
  const [form, setForm] = useState({
    title: "",
    date: "",
    plan: "free" as EventPlan,
    maxClipSeconds: 10,
    organizerEmail: "",
    organizerPhone: "",
  });
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
      if (!firebaseUser) {
        router.push("/host");
      } else if (!firebaseUser.emailVerified) {
        router.push("/dashboard");
      } else if (firebaseUser.email && !form.organizerEmail) {
        setForm((f) => ({ ...f, organizerEmail: firebaseUser.email! }));
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setSubmitting(true);
    try {
      const idToken = await getFirebaseAuth().currentUser?.getIdToken();
      if (!idToken) throw new Error("인증 토큰 발급 실패");

      const res = await fetch("/api/events", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          title: form.title,
          date: form.date,
          plan: form.plan,
          maxClipSeconds: form.maxClipSeconds,
          organizerEmail: form.organizerEmail,
          organizerPhone: form.organizerPhone,
        }),
      });

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({})) as { code?: string };
        if (errBody.code === "INVALID_CLIP_SECONDS") {
          alert("무료 플랜은 최대 10초까지 가능해요. 더 긴 영상이 필요하면 유료 플랜을 선택해주세요.");
          return;
        }
        throw new Error(`HTTP ${res.status}`);
      }
      const { eventId, sessionToken } = await res.json() as {
        eventId: string;
        sessionToken: string;
      };
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
      <>
        <PageBackdrop pattern="a" />
        <div className="min-h-screen flex items-center justify-center px-6">
          <div className="max-w-sm w-full p-8 text-center" style={glassPanel}>
            <p className="text-xs text-accent font-medium tracking-wide mb-2">Firebase 미연결</p>
            <p className="text-xs text-muted leading-relaxed mb-4">
              .env.local에 Firebase 설정값을 추가하면 이벤트를 생성할 수 있습니다.
            </p>
            <Link href="/host" className="btn-quiet text-xs tracking-widest uppercase">
              ← 로그인 페이지
            </Link>
          </div>
        </div>
      </>
    );
  }

  if (authChecking) {
    return (
      <>
        <PageBackdrop pattern="a" />
        <div className="min-h-screen flex items-center justify-center">
          <p className="eyebrow animate-pulse">확인 중...</p>
        </div>
      </>
    );
  }

  return (
    <>
      <PageBackdrop pattern="a" />
      <div className="min-h-screen">
        <AppHeader>
          {view === "form" && (
            <div className="flex items-center gap-3 sm:gap-4">
              <Link href="/guide/host" className="btn-quiet text-xs tracking-widest uppercase whitespace-nowrap">
                사용 가이드
              </Link>
              <Link href="/mypage" className="btn-quiet text-xs tracking-widest uppercase whitespace-nowrap">
                마이페이지
              </Link>
              <Link href="/dashboard" className="btn-quiet text-xs tracking-widest uppercase whitespace-nowrap">
                ← 대시보드
              </Link>
            </div>
          )}
        </AppHeader>

        <main className="mx-auto max-w-lg px-6 py-16">
          {view === "form" ? (
            <div className="p-10" style={glassPanel}>
              <p className="eyebrow mb-4">New Event</p>
              <h1 className="display text-3xl mb-10">새 이벤트 만들기</h1>

              <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                <label className="flex flex-col gap-1.5">
                  <span className="eyebrow">이벤트 이름</span>
                  <input
                    type="text"
                    placeholder="팀 워크샵 2026"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    required
                    disabled={submitting}
                    className="input"
                  />
                </label>

                <label className="flex flex-col gap-1.5">
                  <span className="eyebrow">이벤트 날짜</span>
                  <input
                    type="date"
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                    required
                    disabled={submitting}
                    className="input"
                    style={{ colorScheme: "dark" }}
                  />
                </label>

                <div className="flex flex-col gap-1.5">
                  <span className="eyebrow">플랜 선택</span>
                  <div className="grid grid-cols-2 gap-2">
                    {planOptions.map((opt) => (
                      <label
                        key={opt.value}
                        className="flex flex-col gap-0.5 p-4 cursor-pointer transition-all duration-150"
                        style={{
                          background: form.plan === opt.value ? "var(--surface-3)" : "var(--surface-2)",
                          border: `1px solid ${form.plan === opt.value ? "var(--accent)" : "var(--hairline)"}`,
                          borderRadius: "var(--r-sm)",
                        }}
                      >
                        <input
                          type="radio"
                          name="plan"
                          value={opt.value}
                          checked={form.plan === opt.value}
                          onChange={() => {
                            const newPlan = opt.value;
                            const maxAllowed = getPlanMaxClipSeconds(newPlan);
                            setForm({
                              ...form,
                              plan: newPlan,
                              maxClipSeconds: form.maxClipSeconds > maxAllowed ? maxAllowed : form.maxClipSeconds,
                            });
                          }}
                          disabled={submitting}
                          className="sr-only"
                        />
                        <span className="text-sm text-foreground font-medium">{opt.label}</span>
                        <span className="text-xs text-muted">{opt.desc}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <span className="eyebrow">영상 최대 길이</span>
                  <div className="grid grid-cols-3 gap-2">
                    {([5, 10, 15, 20, 25, 30] as const).map((sec) => {
                      const isLocked = sec > getPlanMaxClipSeconds(form.plan);
                      return (
                        <label
                          key={sec}
                          className={`relative flex items-center justify-center p-4 transition-all duration-150 ${
                            isLocked ? "opacity-40 cursor-not-allowed" : "cursor-pointer"
                          }`}
                          style={{
                            background: form.maxClipSeconds === sec && !isLocked ? "var(--surface-3)" : "var(--surface-2)",
                            border: `1px solid ${form.maxClipSeconds === sec && !isLocked ? "var(--accent)" : "var(--hairline)"}`,
                            borderRadius: "var(--r-sm)",
                          }}
                        >
                          <input
                            type="radio"
                            name="maxClipSeconds"
                            value={sec}
                            checked={form.maxClipSeconds === sec}
                            onChange={() => setForm({ ...form, maxClipSeconds: sec })}
                            disabled={submitting || isLocked}
                            className="sr-only"
                          />
                          <span className="text-sm text-foreground font-medium">{sec}초</span>
                          {isLocked && (
                            <Lock size={12} className="absolute top-1.5 right-1.5 text-muted" />
                          )}
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div className="pt-2" style={{ borderTop: "1px solid var(--hairline)" }}>
                  <p className="eyebrow mb-4 mt-4">알림 수신 정보</p>
                  <div className="flex flex-col gap-4">
                    <label className="flex flex-col gap-1.5">
                      <span className="eyebrow">이메일</span>
                      <input
                        type="email"
                        placeholder="organizer@example.com"
                        value={form.organizerEmail}
                        onChange={(e) => setForm({ ...form, organizerEmail: e.target.value })}
                        required
                        disabled={submitting}
                        className="input"
                      />
                    </label>
                    <label className="flex flex-col gap-1.5">
                      <span className="eyebrow">휴대폰 번호</span>
                      <input
                        type="tel"
                        placeholder="01012345678"
                        value={form.organizerPhone}
                        onChange={(e) => setForm({ ...form, organizerPhone: e.target.value })}
                        required
                        disabled={submitting}
                        className="input"
                      />
                    </label>
                  </div>
                </div>

                <button type="submit" disabled={submitting} className="btn btn-primary mt-2">
                  {submitting ? "생성 중..." : "이벤트 만들기"}
                </button>
              </form>
            </div>
          ) : (
            <div className="p-10" style={glassPanel}>
              <div className="flex items-center gap-3 mb-10">
                <div
                  className="w-8 h-8 flex items-center justify-center shrink-0"
                  style={{ border: "1px solid var(--accent)", borderRadius: "var(--r-sm)" }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-accent">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <div>
                  <p className="eyebrow">이벤트 생성 완료</p>
                  <p className="text-xs text-muted mt-0.5">QR코드로 참가자를 초대하세요</p>
                </div>
              </div>

              <div className="card flex flex-col items-center gap-6 mb-8">
                <div className="flex flex-col items-center gap-3">
                  <QRCodeSVG value={shareUrl} size={180} bgColor="#151310" fgColor="#ede8df" level="M" />
                  <button onClick={handleQRDownload} className="btn btn-secondary" style={{ height: 36, padding: "0 14px", fontSize: 12 }}>
                    QR 이미지 저장
                  </button>
                </div>
                <div className="w-full">
                  <p className="eyebrow mb-2">공유 링크</p>
                  <div className="flex items-center gap-2">
                    <span
                      className="flex-1 min-w-0 text-xs text-foreground px-3 py-2 truncate font-mono"
                      style={{ background: "var(--surface-2)", border: "1px solid var(--hairline)", borderRadius: "var(--r-sm)" }}
                    >
                      {shareUrl}
                    </span>
                    <button onClick={handleCopy} className="btn btn-secondary shrink-0" style={{ height: 36, padding: "0 14px", fontSize: 12 }}>
                      {copied ? "복사됨" : "복사"}
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <Link href={`/dashboard/events/${createdEventId}`} className="btn btn-primary w-full">
                  이벤트 대시보드로 이동 →
                </Link>
                <Link href="/dashboard" className="btn btn-secondary w-full">
                  목록으로 돌아가기
                </Link>
              </div>
            </div>
          )}
        </main>

        {shareUrl && (
          <div
            ref={qrHiResRef}
            aria-hidden="true"
            style={{ position: "fixed", left: -9999, top: -9999, pointerEvents: "none" }}
          >
            <QRCodeCanvas value={shareUrl} size={512} bgColor="#ffffff" fgColor="#0c0b09" level="M" />
          </div>
        )}
      </div>
    </>
  );
}
