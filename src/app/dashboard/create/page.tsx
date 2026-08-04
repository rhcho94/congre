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
import { getUserDoc } from "@/lib/users";
import { calcPrice } from "@/lib/plans";
import { ChevronUp, ChevronDown } from "lucide-react";

function Stepper({
  value, min, max, step, onChange, suffix, disabled,
}: {
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  suffix: string;
  disabled?: boolean;
}) {
  const clamp = (v: number) => Math.min(max, Math.max(min, v));
  const atMax = value >= max;
  const atMin = value <= min;
  return (
    <div
      className="flex items-center justify-between p-4"
      style={{
        background: "var(--surface-2)",
        border: "1px solid var(--hairline)",
        borderRadius: "var(--r-sm)",
      }}
    >
      <span className="text-base text-foreground font-medium">
        {value}
        <span className="text-sm text-muted ml-1">{suffix}</span>
      </span>
      <div className="flex flex-col gap-1">
        <button
          type="button"
          onClick={() => onChange(clamp(value + step))}
          disabled={disabled || atMax}
          aria-label="증가"
          className="flex items-center justify-center transition-opacity disabled:opacity-30"
          style={{
            width: 28, height: 22,
            background: "var(--surface-3)",
            border: "1px solid var(--hairline)",
            borderRadius: 4,
          }}
        >
          <ChevronUp size={14} />
        </button>
        <button
          type="button"
          onClick={() => onChange(clamp(value - step))}
          disabled={disabled || atMin}
          aria-label="감소"
          className="flex items-center justify-center transition-opacity disabled:opacity-30"
          style={{
            width: 28, height: 22,
            background: "var(--surface-3)",
            border: "1px solid var(--hairline)",
            borderRadius: 4,
          }}
        >
          <ChevronDown size={14} />
        </button>
      </div>
    </div>
  );
}

const planOptions: { value: EventPlan; label: string; desc: string; comingSoon?: boolean }[] = [
  { value: "free", label: "무료", desc: "최대 5클립 · 10초 · 워터마크" },
  { value: "paid", label: "유료", desc: "마감 시 사용량만큼 결제", comingSoon: true },
];

type View = "form" | "created";

export default function CreateEventPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [authChecking, setAuthChecking] = useState(isFirebaseConfigured);
  const [view, setView] = useState<View>("form");
  const [form, setForm] = useState({
    title: "",
    date: "",
    plan: "free" as EventPlan,
    maxClipSeconds: 15,    // 유료 스텝퍼 기본값(첫 paid 선택 시 표시). 무료는 POST에 10 고정 전송.
    maxClips: 30,          // 유료 스텝퍼 기본값(첫 paid 선택 시 표시).
    organizerEmail: "",
    organizerPhone: "",
    couponPhone: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [createdEventId, setCreatedEventId] = useState("");
  const [shareUrl, setShareUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const qrHiResRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isFirebaseConfigured) return;
    return subscribeToAuthChanges(async (firebaseUser) => {
      setUser(firebaseUser);
      setAuthChecking(false);
      if (!firebaseUser) {
        router.push("/host");
      } else if (!firebaseUser.emailVerified) {
        router.push("/dashboard");
      } else if (firebaseUser.email) {
        const todayKST = new Date(
          new Date().toLocaleString("en-US", { timeZone: "Asia/Seoul" })
        );
        const yyyy = todayKST.getFullYear();
        const mm = String(todayKST.getMonth() + 1).padStart(2, "0");
        const dd = String(todayKST.getDate()).padStart(2, "0");
        const todayStr = `${yyyy}-${mm}-${dd}`;

        setForm((f) => ({
          ...f,
          organizerEmail: firebaseUser.email!,
          date: todayStr,
        }));

        try {
          const userDoc = await getUserDoc(firebaseUser.uid);
          if (userDoc) {
            setForm((f) => ({
              ...f,
              ...(userDoc.name ? { title: `${userDoc.name}씨의 축하영상입니다` } : {}),
              ...(userDoc.phone ? { organizerPhone: userDoc.phone } : {}),
            }));
          }
        } catch (err) {
          console.error("[create] user profile prefetch failed:", err);
        }
      }
    });
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
          maxClipSeconds: form.plan === "free" ? 10 : form.maxClipSeconds,
          organizerEmail: form.organizerEmail,
          organizerPhone: form.organizerPhone,
          ...(form.plan === "paid" ? { maxClips: form.maxClips } : {}),
          ...(form.couponPhone.trim() ? { couponPhone: form.couponPhone.trim() } : {}),
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

  const couponEntered = form.couponPhone.trim().length > 0;

  if (!isFirebaseConfigured) {
    return (
      <>
        <PageBackdrop pattern="a" />
        <div className="min-h-screen flex items-center justify-center px-6">
          <div className="glass-panel max-w-sm w-full p-8 text-center">
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
            <div className="glass-panel p-10">
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

                {!couponEntered && (
                  <div className="flex flex-col gap-1.5">
                    <span className="eyebrow">플랜 선택</span>
                    <div className="grid grid-cols-2 gap-2">
                      {planOptions.map((opt) => {
                        const locked = opt.comingSoon;
                        return (
                          <label
                            key={opt.value}
                            className="flex flex-col gap-0.5 p-4 transition-all duration-150"
                            style={{
                              background: form.plan === opt.value ? "var(--surface-3)" : "var(--surface-2)",
                              border: `1px solid ${form.plan === opt.value ? "var(--accent)" : "var(--hairline)"}`,
                              borderRadius: "var(--r-sm)",
                              cursor: locked ? "not-allowed" : "pointer",
                              opacity: locked ? 0.55 : 1,
                            }}
                          >
                            <input
                              type="radio"
                              name="plan"
                              value={opt.value}
                              checked={form.plan === opt.value}
                              onChange={() => setForm({ ...form, plan: opt.value })}
                              disabled={submitting || locked}
                              className="sr-only"
                            />
                            <span className="text-sm text-foreground font-medium">
                              {opt.label}
                              {locked && <span className="text-xs text-muted ml-1.5">· 준비 중</span>}
                            </span>
                            <span className="text-xs text-muted">{opt.desc}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}

                <label className="flex flex-col gap-1.5">
                  <span className="eyebrow">베타 쿠폰 (전화번호)</span>
                  <input
                    type="tel"
                    placeholder="쿠폰 발급받은 전화번호"
                    value={form.couponPhone}
                    onChange={(e) => setForm({ ...form, couponPhone: e.target.value })}
                    disabled={submitting}
                    className="input"
                  />
                  {couponEntered && (
                    <span className="text-xs text-muted">베타: 클립 20개 × 30초 상한이 적용돼요.</span>
                  )}
                </label>

                {couponEntered ? (
                  <div className="flex flex-col gap-1.5">
                    <span className="eyebrow">갯수와 길이</span>
                    <div
                      className="p-4 flex flex-col gap-1.5"
                      style={{
                        background: "var(--surface-2)",
                        border: "1px solid var(--hairline)",
                        borderRadius: "var(--r-sm)",
                      }}
                    >
                      <p className="text-sm text-foreground">
                        <strong>20개</strong> × <strong>30초</strong> 고정
                      </p>
                      <p className="text-xs text-muted leading-relaxed">
                        베타 쿠폰은 클립 20개, 각 30초까지 받을 수 있어요.
                      </p>
                    </div>
                  </div>
                ) : form.plan === "free" ? (
                  <div className="flex flex-col gap-1.5">
                    <span className="eyebrow">갯수와 길이</span>
                    <div
                      className="p-4 flex flex-col gap-1.5"
                      style={{
                        background: "var(--surface-2)",
                        border: "1px solid var(--hairline)",
                        borderRadius: "var(--r-sm)",
                      }}
                    >
                      <p className="text-sm text-foreground">
                        <strong>5개</strong> × <strong>10초</strong> 고정
                      </p>
                      <p className="text-xs text-muted leading-relaxed">
                        무료 플랜은 클립 5개, 각 10초까지 받을 수 있어요. 완성본 우하단에 워터마크가 들어가요.
                      </p>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex flex-col gap-1.5">
                      <span className="eyebrow">영상 갯수 (정원)</span>
                      <Stepper
                        value={form.maxClips}
                        min={10}
                        max={200}
                        step={1}
                        onChange={(v) => setForm({ ...form, maxClips: v })}
                        suffix="개"
                        disabled={submitting}
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <span className="eyebrow">영상 길이</span>
                      <Stepper
                        value={form.maxClipSeconds}
                        min={10}
                        max={100}
                        step={5}
                        onChange={(v) => setForm({ ...form, maxClipSeconds: v })}
                        suffix="초"
                        disabled={submitting}
                      />
                    </div>

                    <div
                      className="p-4 flex flex-col gap-1.5"
                      style={{
                        background: "var(--surface-2)",
                        border: "1px solid var(--hairline)",
                        borderRadius: "var(--r-sm)",
                      }}
                    >
                      <p className="text-sm text-foreground leading-relaxed">
                        정원이 다 차면 최대{" "}
                        <strong style={{ color: "var(--accent)" }}>
                          {calcPrice(form.maxClipSeconds, form.maxClips).toLocaleString("ko-KR")}원
                        </strong>
                        , 실제 결제는 마감 시 올라온 영상 수로 계산돼요 (최소 10,000원).
                      </p>
                      <p className="text-xs text-muted">
                        결제는 이벤트를 마감할 때 진행돼요. 지금은 결제하지 않습니다.
                      </p>
                    </div>
                  </>
                )}

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
                  {submitting ? "생성 중..." : "이벤트 시작하기"}
                </button>
              </form>
            </div>
          ) : (
            <div className="glass-panel p-10">
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
                  <p className="text-xs text-muted mt-0.5">아래 QR이나 링크를 참가자에게 공유해 영상을 모으세요</p>
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
