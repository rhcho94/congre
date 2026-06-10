"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { BrandName } from "@/components/BrandName";
import { LANDING_URL } from "@/lib/constants";
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
  free: "무료", small: "소형", medium: "중형", large: "대형",
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
          <div className="max-w-sm w-full card text-center">
            <p className="text-xs text-accent font-medium tracking-wide mb-2">Firebase 미연결</p>
            <p className="text-xs text-muted leading-relaxed mb-4">
              .env.local에 Firebase 설정값을 추가하면 대시보드를 사용할 수 있습니다.
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
        <nav className="flex items-center justify-between flex-wrap gap-y-3 px-5 sm:px-8 py-6">
          <a href={LANDING_URL} className="text-xl tracking-wider hover:opacity-75 transition-opacity duration-200">
            <BrandName />
          </a>
          <div className="flex items-center gap-3 sm:gap-6">
            <span className="hidden sm:inline text-xs text-muted truncate max-w-[180px]">{user?.email}</span>
            <Link href="/guide/host" className="btn-quiet text-xs tracking-widest uppercase whitespace-nowrap">
              사용 가이드
            </Link>
            <Link href="/mypage" className="btn-quiet text-xs tracking-widest uppercase whitespace-nowrap">
              마이페이지
            </Link>
            <button onClick={() => logout()} className="btn-quiet text-xs tracking-widest uppercase whitespace-nowrap">
              로그아웃
            </button>
          </div>
        </nav>

        <main className="mx-auto max-w-3xl px-6 py-16">
          <div className="flex items-end justify-between mb-10">
            <div>
              <p className="eyebrow mb-2">Dashboard</p>
              <h1 className="display text-3xl">내 이벤트</h1>
            </div>
            {user?.emailVerified ? (
              <Link href="/dashboard/create" className="btn btn-secondary">
                + 새 이벤트
              </Link>
            ) : (
              <div className="flex flex-col items-end gap-1">
                <button disabled className="btn btn-secondary opacity-50 cursor-not-allowed">
                  + 새 이벤트
                </button>
                <span className="text-xs text-muted">이메일 인증 후 이용 가능</span>
              </div>
            )}
          </div>

          {user && !user.emailVerified && <EmailVerificationBanner />}

          <div className="hr mb-8" />

          {eventsLoading ? (
            <p className="text-center text-muted text-sm py-16 animate-pulse">불러오는 중...</p>
          ) : events.length === 0 ? (
            <div className="card text-center py-16">
              <p className="text-muted text-sm mb-4">아직 이벤트가 없습니다.</p>
              <Link href="/dashboard/create" className="text-xs tracking-widest uppercase text-accent hover:brightness-110 transition-all">
                첫 이벤트 만들기 →
              </Link>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {events.map((event) => (
                <Link
                  key={event.id}
                  href={`/dashboard/events/${event.id}`}
                  className="row flex items-center justify-between"
                >
                  <div className="flex flex-col gap-1 min-w-0 flex-1">
                    <span className="text-sm text-foreground font-medium truncate">
                      {event.title}
                    </span>
                    <span className="text-xs text-muted">
                      {event.date ? new Date(event.date).toLocaleDateString("ko-KR") : ""}
                      {" · "}
                      {planLabels[event.plan]}
                    </span>
                  </div>
                  <span className={`badge ${statusBadgeClass[event.status]} shrink-0 ml-4`}>
                    {statusLabels[event.status]}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </main>
      </div>
    </>
  );
}
