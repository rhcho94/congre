"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { BrandName } from "@/components/BrandName";
import { LANDING_URL } from "@/lib/constants";
import PageBackdrop from "@/components/PageBackdrop";
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

const statusBadgeClass: Record<EventStatus, string> = {
  수집중: "badge-live",
  마감: "badge-draft",
  편집중: "badge-draft",
  완성: "badge-done",
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
  const [authChecking, setAuthChecking] = useState(isFirebaseConfigured);

  const [events, setEvents] = useState<CongreEvent[]>(mockEvents);
  const [form, setForm] = useState({ title: "", date: "", deadline: "" });

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState("");

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
    } catch (err) {
      const code = (err as { code?: string }).code ?? "";
      setLoginError(getAuthErrorMessage(code));
    } finally {
      setLoginLoading(false);
    }
  }

  async function handleLogout() {
    await logout();
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
        <nav className="flex items-center justify-between px-8 py-6">
          <a href={LANDING_URL} className="text-xl tracking-wider hover:opacity-75 transition-opacity duration-200">
            <BrandName />
          </a>
          {user && (
            <div className="flex items-center gap-6">
              <span className="text-xs text-muted truncate max-w-[180px]">{user.email}</span>
              <button onClick={handleLogout} className="btn-quiet text-xs tracking-widest uppercase">
                로그아웃
              </button>
            </div>
          )}
        </nav>

        <main className="mx-auto max-w-2xl px-6 py-16">
          {view === "login" && (
            <>
              <div className="glass-panel w-full max-w-md mx-auto p-10">
                <p className="eyebrow mb-4 text-center">Host</p>
                <h1 className="display text-3xl text-center mb-10">주최자 로그인</h1>

                {!isFirebaseConfigured && (
                  <div className="mb-6 notice">
                    <p className="text-xs text-accent mb-1 font-medium tracking-wide">Firebase 미연결</p>
                    <p className="text-xs text-muted leading-relaxed">
                      .env.local에 Firebase 설정값을 추가하면 실제 로그인이 가능합니다.
                    </p>
                  </div>
                )}

                <form onSubmit={handleLogin} className="flex flex-col gap-4">
                  <label className="flex flex-col gap-1.5">
                    <span className="eyebrow">이메일</span>
                    <input
                      type="email"
                      placeholder="host@congre.io"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      required
                      disabled={loginLoading}
                      className="input"
                    />
                  </label>

                  <label className="flex flex-col gap-1.5">
                    <span className="eyebrow">비밀번호</span>
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      required
                      disabled={loginLoading}
                      className="input"
                    />
                  </label>

                  {loginError && (
                    <p className="text-xs" style={{ color: "#d45040" }}>{loginError}</p>
                  )}

                  <button type="submit" disabled={loginLoading} className="btn btn-primary mt-2">
                    {loginLoading ? "로그인 중..." : "로그인"}
                  </button>
                </form>

                <div className="mt-4 text-center flex items-center justify-center gap-3">
                  <button type="button" onClick={openResetModal} className="btn-quiet text-xs">
                    비밀번호를 잊으셨나요?
                  </button>
                  <span className="text-xs text-muted">·</span>
                  <Link href="/signup" className="btn-quiet text-xs">
                    회원가입
                  </Link>
                </div>
              </div>

              {resetOpen && (
                <div
                  className="fixed inset-0 z-50 flex items-center justify-center px-6"
                  style={{ background: "rgba(12,11,9,0.8)", backdropFilter: "blur(4px)" }}
                  onClick={() => setResetOpen(false)}
                >
                  <div
                    className="glass-panel w-full max-w-sm p-8 flex flex-col gap-5"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center justify-between">
                      <p className="eyebrow">비밀번호 재설정</p>
                      <button onClick={() => setResetOpen(false)} className="text-muted hover:text-foreground transition-colors" aria-label="닫기">
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
                        <button onClick={() => setResetOpen(false)} className="btn btn-secondary mt-1">
                          닫기
                        </button>
                      </div>
                    ) : (
                      <form onSubmit={handlePasswordReset} className="flex flex-col gap-4">
                        <p className="text-xs text-muted leading-relaxed">
                          가입한 이메일을 입력하면 비밀번호 재설정 링크를 보내드립니다.
                        </p>
                        <label className="flex flex-col gap-1.5">
                          <span className="eyebrow">이메일</span>
                          <input
                            type="email"
                            placeholder="host@congre.io"
                            value={resetEmail}
                            onChange={(e) => setResetEmail(e.target.value)}
                            required
                            disabled={resetLoading}
                            autoFocus
                            className="input"
                          />
                        </label>
                        {resetError && (
                          <p className="text-xs" style={{ color: "#d45040" }}>{resetError}</p>
                        )}
                        <button type="submit" disabled={resetLoading} className="btn btn-primary">
                          {resetLoading ? "발송 중..." : "재설정 메일 보내기"}
                        </button>
                      </form>
                    )}
                  </div>
                </div>
              )}
            </>
          )}

          {view === "dashboard" && (
            <div>
              <div className="flex items-end justify-between mb-10">
                <div>
                  <p className="eyebrow mb-2">Dashboard</p>
                  <h1 className="display text-3xl">내 이벤트</h1>
                </div>
                <button onClick={() => setView("create")} className="btn btn-secondary">
                  + 새 이벤트
                </button>
              </div>

              <div className="hr mb-8" />

              {events.length === 0 ? (
                <p className="text-center text-muted text-sm py-16">아직 이벤트가 없습니다.</p>
              ) : (
                <div className="flex flex-col gap-3">
                  {events.map((event) => (
                    <div key={event.id} className="row flex items-center justify-between">
                      <div className="flex flex-col gap-1 min-w-0 flex-1">
                        <span className="text-sm text-foreground font-medium truncate">{event.title}</span>
                        <span className="text-xs text-muted">
                          {event.date} · 참가자 {event.participants}명
                        </span>
                      </div>
                      <div className="flex items-center gap-5 shrink-0 ml-4">
                        <span className={`badge ${statusBadgeClass[event.status]}`}>{event.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {view === "create" && (
            <div>
              <button onClick={() => setView("dashboard")} className="btn-quiet text-xs tracking-widest uppercase mb-8 inline-block">
                ← 목록으로
              </button>

              <p className="eyebrow mb-4">New Event</p>
              <h1 className="display text-3xl mb-10">새 이벤트 만들기</h1>

              <form onSubmit={handleCreate} className="flex flex-col gap-6">
                <label className="flex flex-col gap-1.5">
                  <span className="eyebrow">이벤트 이름</span>
                  <input
                    type="text"
                    placeholder="팀 워크샵 2025"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    required
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
                    className="input"
                    style={{ colorScheme: "dark" }}
                  />
                </label>

                <label className="flex flex-col gap-1.5">
                  <span className="eyebrow">업로드 마감</span>
                  <input
                    type="datetime-local"
                    value={form.deadline}
                    onChange={(e) => setForm({ ...form, deadline: e.target.value })}
                    className="input"
                    style={{ colorScheme: "dark" }}
                  />
                </label>

                <button type="submit" className="btn btn-primary mt-2">이벤트 만들기</button>
              </form>
            </div>
          )}
        </main>
      </div>
    </>
  );
}
