"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import AppHeader from "@/components/AppHeader";
import PageBackdrop from "@/components/PageBackdrop";
import { useRouter } from "next/navigation";
import { subscribeToAuthChanges, logout, type User } from "@/lib/auth";
import { EmailVerificationBanner } from "@/components/EmailVerificationBanner";
import { type EventPlan, type EventStatus } from "@/lib/events";
import { isFirebaseConfigured, getFirebaseAuth } from "@/lib/firebase";

interface ApiEvent {
  id: string;
  title: string;
  date: number | null;
  plan: EventPlan;
  status: EventStatus;
}

const planLabels: Record<EventPlan, string> = {
  free: "무료", paid: "유료",
};

const statusLabels: Record<EventStatus, string> = {
  open: "수집중", closed: "마감", rendering: "편집중", done: "완성",
};

const statusBadgeClass: Record<EventStatus, string> = {
  open: "badge-live",
  closed: "badge-draft",
  rendering: "badge-draft",
  done: "badge-done",
};

// "+ 새 이벤트" — 채운 잉크 작은 버튼(44px)
const NEW_EVENT_BTN: React.CSSProperties = { height: 44, fontSize: 15, padding: "0 18px" };

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [authChecking, setAuthChecking] = useState(isFirebaseConfigured);
  const [events, setEvents] = useState<ApiEvent[]>([]);
  const [eventsLoading, setEventsLoading] = useState(false);

  useEffect(() => {
    if (!isFirebaseConfigured) return;
    return subscribeToAuthChanges(async (firebaseUser) => {
      if (firebaseUser && !firebaseUser.emailVerified) {
        try {
          await firebaseUser.reload();
        } catch (e) {
          console.error("[dashboard] reload failed:", e);
        }
      }
      setUser(firebaseUser);
      setAuthChecking(false);
      if (!firebaseUser) router.push("/host");
    });
  }, [router]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    async function fetchEvents() {
      try {
        const idToken = await getFirebaseAuth().currentUser?.getIdToken();
        if (!idToken || cancelled) return;
        const res = await fetch("/api/events", {
          headers: { Authorization: `Bearer ${idToken}` },
        });
        if (!res.ok || cancelled) return;
        const data = await res.json() as { events: ApiEvent[] };
        if (!cancelled) setEvents(data.events);
      } catch (err) {
        console.error("[dashboard] fetchEvents error:", err);
      } finally {
        if (!cancelled) setEventsLoading(false);
      }
    }

    setEventsLoading(true);
    fetchEvents();

    function onVisibility() {
      if (!document.hidden) fetchEvents();
    }
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [user]);

  if (!isFirebaseConfigured) {
    return (
      <>
        <PageBackdrop pattern="b" />
        <div className="min-h-screen flex items-center justify-center px-6">
          <div className="max-w-sm w-full notice text-center">
            <p className="text-xs text-accent font-medium mb-2">Firebase 미연결</p>
            <p className="text-xs text-muted leading-relaxed mb-4">
              .env.local에 Firebase 설정값을 추가하면 대시보드를 사용할 수 있습니다.
            </p>
            <Link href="/host" className="btn-quiet text-sm">
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
        <PageBackdrop pattern="b" />
        <div className="min-h-screen flex items-center justify-center">
          <p className="eyebrow animate-pulse">확인 중...</p>
        </div>
      </>
    );
  }

  return (
    <>
      <PageBackdrop pattern="b" />
      <div className="min-h-screen">
        <AppHeader>
          <div className="flex items-center gap-3 sm:gap-6">
            <span className="hidden sm:inline text-xs text-muted truncate max-w-[180px]">{user?.email}</span>
            <Link href="/guide/host" className="btn-quiet text-sm whitespace-nowrap">
              사용 가이드
            </Link>
            <Link href="/mypage" className="btn-quiet text-sm whitespace-nowrap">
              마이페이지
            </Link>
            <button onClick={() => logout()} className="btn-quiet text-sm whitespace-nowrap">
              로그아웃
            </button>
          </div>
        </AppHeader>

        <main className="mx-auto max-w-3xl px-5 pt-2 pb-16 flex flex-col gap-4">
          <div className="flex items-end justify-between gap-3" style={{ paddingTop: 12 }}>
            <h1 className="display" style={{ fontSize: 28, lineHeight: 1.3 }}>내 이벤트</h1>
            {user?.emailVerified ? (
              <Link href="/dashboard/create" className="btn btn-primary shrink-0" style={NEW_EVENT_BTN}>
                + 새 이벤트
              </Link>
            ) : (
              <div className="flex flex-col items-end gap-1 shrink-0">
                <button disabled className="btn btn-primary" style={NEW_EVENT_BTN}>
                  + 새 이벤트
                </button>
                <span className="text-xs text-muted">이메일 인증 후 이용 가능</span>
              </div>
            )}
          </div>

          {user && !user.emailVerified && <EmailVerificationBanner />}

          {eventsLoading ? (
            <p className="text-center text-muted text-sm py-16 animate-pulse">불러오는 중...</p>
          ) : events.length === 0 ? (
            <div className="notice text-center relative overflow-hidden" style={{ padding: "64px 20px" }}>
              {/* 배경 이미지 레이어 */}
              <div
                className="absolute inset-0"
                style={{
                  backgroundImage: "url('/images/empty-state-wedding.png')",
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              />
              {/* 흰색 반투명 오버레이 */}
              <div
                className="absolute inset-0"
                style={{ backgroundColor: "rgba(255, 255, 255, 0.80)" }}
              />
              {/* 콘텐츠 */}
              <div className="relative z-10">
                <p className="text-muted text-sm mb-6">마감하면 통상 10분 이내에 완성본을 직접 볼 수 있어요</p>
                <div className="flex flex-wrap items-start justify-center gap-x-3 gap-y-3 mb-6">
                  <div className="flex flex-col items-center gap-2">
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[var(--surface-2)] text-xs text-[var(--accent)]">1</span>
                    <span className="text-xs text-muted text-center break-keep">이벤트 만들기</span>
                  </div>
                  <span className="flex items-center shrink-0 self-start mt-2" style={{ color: "var(--accent)", opacity: 0.55 }} aria-hidden><svg viewBox="0 0 40 9" width="24" height="9" className="block"><line x1="1" y1="4.5" x2="34" y2="4.5" stroke="currentColor" strokeWidth={1.3} /><path d="M30 1.5 34.5 4.5 30 7.5" fill="none" stroke="currentColor" strokeWidth={1.3} /></svg></span>
                  <div className="flex flex-col items-center gap-2">
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[var(--surface-2)] text-xs text-[var(--accent)]">2</span>
                    <span className="text-xs text-muted text-center break-keep">QR을 내 폰으로 스캔</span>
                  </div>
                  <span className="flex items-center shrink-0 self-start mt-2" style={{ color: "var(--accent)", opacity: 0.55 }} aria-hidden><svg viewBox="0 0 40 9" width="24" height="9" className="block"><line x1="1" y1="4.5" x2="34" y2="4.5" stroke="currentColor" strokeWidth={1.3} /><path d="M30 1.5 34.5 4.5 30 7.5" fill="none" stroke="currentColor" strokeWidth={1.3} /></svg></span>
                  <div className="flex flex-col items-center gap-2">
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[var(--surface-2)] text-xs text-[var(--accent)]">3</span>
                    <span className="text-xs text-muted text-center break-keep">하객인 척 짧게 촬영</span>
                  </div>
                  <span className="flex items-center shrink-0 self-start mt-2" style={{ color: "var(--accent)", opacity: 0.55 }} aria-hidden><svg viewBox="0 0 40 9" width="24" height="9" className="block"><line x1="1" y1="4.5" x2="34" y2="4.5" stroke="currentColor" strokeWidth={1.3} /><path d="M30 1.5 34.5 4.5 30 7.5" fill="none" stroke="currentColor" strokeWidth={1.3} /></svg></span>
                  <div className="flex flex-col items-center gap-2">
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[var(--surface-2)] text-xs text-[var(--accent)]">4</span>
                    <span className="text-xs text-muted text-center break-keep">완성본 영상 확인</span>
                  </div>
                </div>
                <p className="text-xs text-muted mb-6">하객이 없어도 혼자 한 바퀴 돌려볼 수 있어요</p>
                <Link href="/dashboard/create" className="text-sm text-accent hover:brightness-110 transition-all">
                  첫 이벤트 만들기
                </Link>
              </div>
            </div>
          ) : (
            <div className="flex flex-col" style={{ borderTop: "1px solid var(--line)" }}>
              {events.map((event) => {
                const dateLabel = event.date
                  ? new Date(event.date).toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" })
                  : "";
                // 옛 플랜 값(small 등)은 라벨이 없어 날짜만 남는다
                const meta = [dateLabel, planLabels[event.plan]].filter(Boolean).join(", ");
                return (
                  <Link
                    key={event.id}
                    href={`/dashboard/events/${event.id}`}
                    className="flex items-center justify-between gap-3 hover:bg-[var(--surface-2)] transition-colors"
                    style={{ padding: "14px 4px", minHeight: 64, borderBottom: "1px solid var(--line)", color: "var(--text)" }}
                  >
                    <span className="flex flex-col gap-0.5 min-w-0 flex-1">
                      <span className="truncate" style={{ fontSize: 16 }}>{event.title}</span>
                      {meta && <span className="text-sm text-muted">{meta}</span>}
                    </span>
                    <span className={`badge ${statusBadgeClass[event.status]} shrink-0`}>
                      {statusLabels[event.status]}
                    </span>
                  </Link>
                );
              })}
            </div>
          )}
        </main>
      </div>
    </>
  );
}
