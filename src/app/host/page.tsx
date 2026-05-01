"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { BrandName } from "@/components/BrandName";
import { useRouter } from "next/navigation";
import { loginWithEmail, logout, resetPassword, subscribeToAuthChanges, type User } from "@/lib/auth";
import { isFirebaseConfigured } from "@/lib/firebase";

type View = "login" | "dashboard" | "create";
type EventStatus = "수집중" | "마감" | "편집중" | "완성";

interface CongreEvent {
  id: string;
  title: string;
  date: string;
  participants: number;
  status: EventStatus;
}

const mockEvents: CongreEvent[] = [
  { id: "evt_01", title: "2025 팀 워크샵", date: "2025-05-10", participants: 24, status: "수집중" },
  { id: "evt_02", title: "신입 환영회", date: "2025-04-20", participants: 31, status: "완성" },
  { id: "evt_03", title: "창립 10주년 파티", date: "2025-03-15", participants: 87, status: "완성" },
];

const statusColors: Record<EventStatus, string> = {
  수집중: "var(--accent)",
  마감: "var(--muted)",
  편집중: "#7b8ce0",
  완성: "#5ba06e",
};

function getAuthErrorMessage(code: string): string {
  switch (code) {
    case "auth/invalid-email":
      return "이메일 형식이 올바르지 않습니다.";
    case "auth/invalid-credential":
    case "auth/user-not-found":
    case "auth/wrong-password":
      return "이메일 또는 비밀번호가 올바르지 않습니다.";
    case "auth/too-many-requests":
      return "로그인 시도가 너무 많습니다. 잠시 후 다시 시도해주세요.";
    case "auth/network-request-failed":
      return "네트워크 오류가 발생했습니다. 인터넷 연결을 확인해주세요.";
    case "auth/user-disabled":
      return "비활성화된 계정입니다. 관리자에게 문의하세요.";
    default:
      return "로그인 중 오류가 발생했습니다. 다시 시도해주세요.";
  }
}

export default function HostPage() {
  const router = useRouter();
  const [view, setView] = useState<View>("login");
  const [user, setUser] = useState<User | null>(null);
  // Firebase 설정이 없으면 auth 체크를 건너뜀
  const [authChecking, setAuthChecking] = useState(isFirebaseConfigured);

  // 이벤트 목록 (추후 Firestore로 교체)
  const [events, setEvents] = useState<CongreEvent[]>(mockEvents);
  const [form, setForm] = useState({ title: "", date: "", deadline: "" });

  // 로그인 폼 상태
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState("");

  // 비밀번호 재설정 모달 상태
  const [resetOpen, setResetOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [resetError, setResetError] = useState("");

  useEffect(() => {
    if (!isFirebaseConfigured) return;

    const unsubscribe = subscribeToAuthChanges((firebaseUser) => {
      setUser(firebaseUser);
      setAuthChecking(false);
      if (firebaseUser) {
        router.push("/dashboard");
      } else {
        setView("login");
      }
    });

    return unsubscribe;
  }, [router]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoginError("");
    setLoginLoading(true);

    try {
      await loginWithEmail(loginEmail, loginPassword);
      // 뷰 전환은 subscribeToAuthChanges가 처리
    } catch (err) {
      const code = (err as { code?: string }).code ?? "";
      setLoginError(getAuthErrorMessage(code));
    } finally {
      setLoginLoading(false);
    }
  }

  async function handleLogout() {
    await logout();
    // 뷰 전환은 subscribeToAuthChanges가 처리
  }

  function openResetModal() {
    setResetEmail(loginEmail);
    setResetSent(false);
    setResetError("");
    setResetOpen(true);
  }

  async function handlePasswordReset(e: React.FormEvent) {
    e.preventDefault();
    setResetLoading(true);
    setResetError("");
    try {
      await resetPassword(resetEmail);
      setResetSent(true);
    } catch (err) {
      const code = (err as { code?: string }).code ?? "";
      if (code === "auth/invalid-email") {
        setResetError("이메일 형식이 올바르지 않습니다.");
      } else if (code === "auth/user-not-found") {
        setResetError("등록되지 않은 이메일입니다.");
      } else {
        setResetError("메일 발송에 실패했습니다. 다시 시도해주세요.");
      }
    } finally {
      setResetLoading(false);
    }
  }

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const created: CongreEvent = {
      id: `evt_${Date.now()}`,
      title: form.title || "새 이벤트",
      date: form.date,
      participants: 0,
      status: "수집중",
    };
    setEvents([created, ...events]);
    setForm({ title: "", date: "", deadline: "" });
    setView("dashboard");
  }

  // Firebase auth 상태 확인 중
  if (authChecking) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-xs tracking-widest uppercase text-muted animate-pulse">
          확인 중...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="flex items-center justify-between px-8 py-6 border-b border-border">
        <Link
          href="/"
          className="text-xl tracking-wider hover:opacity-75 transition-opacity duration-200"
        >
          <BrandName />
        </Link>
        {user && (
          <div className="flex items-center gap-6">
            <span className="text-xs text-muted truncate max-w-[180px]">{user.email}</span>
            <button
              onClick={handleLogout}
              className="text-xs tracking-widest uppercase text-muted hover:text-accent transition-colors duration-200"
            >
              로그아웃
            </button>
          </div>
        )}
      </nav>

      <main className="mx-auto max-w-2xl px-6 py-16">
        {/* ─── Login ─── */}
        {view === "login" && (
          <>
          <div className="flex flex-col items-center">
            <div className="w-full max-w-md">
              <p className="text-xs tracking-[0.4em] uppercase text-accent mb-4 text-center">
                Host
              </p>
              <h1
                className="text-3xl italic text-foreground text-center mb-10"
                style={{ fontFamily: "var(--font-display, serif)" }}
              >
                주최자 로그인
              </h1>

              {/* Firebase 미연결 안내 */}
              {!isFirebaseConfigured && (
                <div className="mb-6 p-4 border border-border bg-surface">
                  <p className="text-xs text-accent mb-1 font-medium tracking-wide">
                    Firebase 미연결
                  </p>
                  <p className="text-xs text-muted leading-relaxed">
                    .env.local에 Firebase 설정값을 추가하면 실제 로그인이 가능합니다.
                  </p>
                </div>
              )}

              <form onSubmit={handleLogin} className="flex flex-col gap-4">
                <label className="flex flex-col gap-1.5">
                  <span className="text-xs tracking-widest uppercase text-muted">이메일</span>
                  <input
                    type="email"
                    placeholder="host@congre.io"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    required
                    disabled={loginLoading}
                    className="bg-surface border border-border px-4 py-3 text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-accent transition-colors duration-200 disabled:opacity-50"
                  />
                </label>

                <label className="flex flex-col gap-1.5">
                  <span className="text-xs tracking-widest uppercase text-muted">비밀번호</span>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    required
                    disabled={loginLoading}
                    className="bg-surface border border-border px-4 py-3 text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-accent transition-colors duration-200 disabled:opacity-50"
                  />
                </label>

                {loginError && (
                  <p className="text-xs" style={{ color: "#d45040" }}>
                    {loginError}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loginLoading}
                  className="mt-2 py-3.5 bg-accent text-background text-sm tracking-widest uppercase font-medium hover:brightness-110 transition-all duration-200 glow-accent disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:brightness-100"
                >
                  {loginLoading ? "로그인 중..." : "로그인"}
                </button>
              </form>

              <div className="mt-4 text-center">
                <button
                  type="button"
                  onClick={openResetModal}
                  className="text-xs text-muted hover:text-accent transition-colors duration-200"
                >
                  비밀번호를 잊으셨나요?
                </button>
              </div>
            </div>
          </div>

          {/* 비밀번호 재설정 모달 */}
          {resetOpen && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center px-6"
              style={{ background: "rgba(12,11,9,0.8)", backdropFilter: "blur(4px)" }}
              onClick={() => setResetOpen(false)}
            >
              <div
                className="w-full max-w-sm bg-surface border border-border p-8 flex flex-col gap-5"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between">
                  <p className="text-xs tracking-[0.3em] uppercase text-accent">비밀번호 재설정</p>
                  <button
                    onClick={() => setResetOpen(false)}
                    className="text-muted hover:text-foreground transition-colors"
                    aria-label="닫기"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>

                {resetSent ? (
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-2">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#5ba06e" strokeWidth="1.5">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      <p className="text-sm" style={{ color: "#5ba06e" }}>재설정 메일을 보냈습니다</p>
                    </div>
                    <p className="text-xs text-muted leading-relaxed">
                      {resetEmail} 로 전송됐습니다. 메일함을 확인해주세요.
                    </p>
                    <button
                      onClick={() => setResetOpen(false)}
                      className="mt-1 py-2.5 border border-border text-xs tracking-widest uppercase text-muted hover:border-accent hover:text-foreground transition-all duration-200"
                    >
                      닫기
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handlePasswordReset} className="flex flex-col gap-4">
                    <p className="text-xs text-muted leading-relaxed">
                      가입한 이메일을 입력하면 비밀번호 재설정 링크를 보내드립니다.
                    </p>
                    <label className="flex flex-col gap-1.5">
                      <span className="text-xs tracking-widest uppercase text-muted">이메일</span>
                      <input
                        type="email"
                        placeholder="host@congre.io"
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                        required
                        disabled={resetLoading}
                        autoFocus
                        className="bg-background border border-border px-4 py-3 text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-accent transition-colors duration-200 disabled:opacity-50"
                      />
                    </label>
                    {resetError && (
                      <p className="text-xs" style={{ color: "#d45040" }}>{resetError}</p>
                    )}
                    <button
                      type="submit"
                      disabled={resetLoading}
                      className="py-3 bg-accent text-background text-xs tracking-widest uppercase font-medium hover:brightness-110 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {resetLoading ? "발송 중..." : "재설정 메일 보내기"}
                    </button>
                  </form>
                )}
              </div>
            </div>
          )}
          </>
        )}

        {/* ─── Dashboard ─── */}
        {view === "dashboard" && (
          <div>
            <div className="flex items-end justify-between mb-10">
              <div>
                <p className="text-xs tracking-[0.4em] uppercase text-accent mb-2">Dashboard</p>
                <h1
                  className="text-3xl italic text-foreground"
                  style={{ fontFamily: "var(--font-display, serif)" }}
                >
                  내 이벤트
                </h1>
              </div>
              <button
                onClick={() => setView("create")}
                className="px-5 py-2.5 border border-border text-muted text-xs tracking-widest uppercase hover:border-accent hover:text-foreground transition-all duration-200"
              >
                + 새 이벤트
              </button>
            </div>

            <div className="rule mb-8" />

            {events.length === 0 ? (
              <p className="text-center text-muted text-sm py-16">
                아직 이벤트가 없습니다.
              </p>
            ) : (
              <div className="flex flex-col gap-px" style={{ background: "var(--border)" }}>
                {events.map((event) => (
                  <div
                    key={event.id}
                    className="flex items-center justify-between p-6 bg-surface hover:bg-[var(--surface-2)] transition-colors duration-150"
                  >
                    <div className="flex flex-col gap-1 min-w-0 flex-1">
                      <span className="text-sm text-foreground font-medium truncate">
                        {event.title}
                      </span>
                      <span className="text-xs text-muted">
                        {event.date} · 참가자 {event.participants}명
                      </span>
                    </div>
                    <div className="flex items-center gap-5 shrink-0 ml-4">
                      <span
                        className="text-xs tracking-widest uppercase"
                        style={{ color: statusColors[event.status] }}
                      >
                        {event.status}
                      </span>
                      {event.status === "완성" && (
                        <Link
                          href={`/player/${event.id}`}
                          className="text-xs tracking-widest uppercase text-muted hover:text-accent transition-colors"
                        >
                          보기 →
                        </Link>
                      )}
                      {event.status === "수집중" && (
                        <Link
                          href={`/event/${event.id}`}
                          className="text-xs tracking-widest uppercase text-muted hover:text-accent transition-colors"
                        >
                          관리 →
                        </Link>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ─── Create Event ─── */}
        {view === "create" && (
          <div>
            <button
              onClick={() => setView("dashboard")}
              className="text-xs tracking-widest uppercase text-muted hover:text-accent transition-colors mb-8 inline-block"
            >
              ← 목록으로
            </button>

            <p className="text-xs tracking-[0.4em] uppercase text-accent mb-4">New Event</p>
            <h1
              className="text-3xl italic text-foreground mb-10"
              style={{ fontFamily: "var(--font-display, serif)" }}
            >
              새 이벤트 만들기
            </h1>

            <form onSubmit={handleCreate} className="flex flex-col gap-6">
              <label className="flex flex-col gap-1.5">
                <span className="text-xs tracking-widest uppercase text-muted">이벤트 이름</span>
                <input
                  type="text"
                  placeholder="팀 워크샵 2025"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  required
                  className="bg-surface border border-border px-4 py-3 text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-accent transition-colors duration-200"
                />
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="text-xs tracking-widest uppercase text-muted">이벤트 날짜</span>
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  required
                  className="bg-surface border border-border px-4 py-3 text-sm text-foreground focus:outline-none focus:border-accent transition-colors duration-200"
                  style={{ colorScheme: "dark" }}
                />
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="text-xs tracking-widest uppercase text-muted">업로드 마감</span>
                <input
                  type="datetime-local"
                  value={form.deadline}
                  onChange={(e) => setForm({ ...form, deadline: e.target.value })}
                  className="bg-surface border border-border px-4 py-3 text-sm text-foreground focus:outline-none focus:border-accent transition-colors duration-200"
                  style={{ colorScheme: "dark" }}
                />
              </label>

              <button
                type="submit"
                className="mt-2 py-3.5 bg-accent text-background text-sm tracking-widest uppercase font-medium hover:brightness-110 transition-all duration-200 glow-accent"
              >
                이벤트 만들기
              </button>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}
