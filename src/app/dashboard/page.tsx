"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { subscribeToAuthChanges, logout, type User } from "@/lib/auth";
import {
  subscribeToHostEvents,
  type CongreEvent,
  type EventPlan,
  type EventStatus,
} from "@/lib/events";
import { isFirebaseConfigured } from "@/lib/firebase";

const planLabels: Record<EventPlan, string> = {
  free: "무료", small: "소형", medium: "중형", large: "대형",
};

const statusLabels: Record<EventStatus, string> = {
  open: "수집중", closed: "마감", rendering: "편집중", done: "완성",
};

const statusColors: Record<EventStatus, string> = {
  open: "var(--accent)",
  closed: "var(--muted)",
  rendering: "#7b8ce0",
  done: "#5ba06e",
};

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [authChecking, setAuthChecking] = useState(isFirebaseConfigured);
  const [events, setEvents] = useState<CongreEvent[]>([]);
  const [eventsLoading, setEventsLoading] = useState(false);

  useEffect(() => {
    if (!isFirebaseConfigured) return;
    return subscribeToAuthChanges((firebaseUser) => {
      setUser(firebaseUser);
      setAuthChecking(false);
      if (!firebaseUser) router.push("/host");
    });
  }, [router]);

  useEffect(() => {
    if (!user) return;
    setEventsLoading(true);
    return subscribeToHostEvents(user.uid, (evts) => {
      setEvents(evts);
      setEventsLoading(false);
    });
  }, [user]);

  if (!isFirebaseConfigured) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6">
        <div className="max-w-sm w-full p-6 border border-border bg-surface text-center">
          <p className="text-xs text-accent font-medium tracking-wide mb-2">Firebase 미연결</p>
          <p className="text-xs text-muted leading-relaxed mb-4">
            .env.local에 Firebase 설정값을 추가하면 대시보드를 사용할 수 있습니다.
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
          congre
        </Link>
        <div className="flex items-center gap-6">
          <span className="text-xs text-muted truncate max-w-[180px]">{user?.email}</span>
          <button
            onClick={() => logout()}
            className="text-xs tracking-widest uppercase text-muted hover:text-accent transition-colors duration-200"
          >
            로그아웃
          </button>
        </div>
      </nav>

      <main className="mx-auto max-w-3xl px-6 py-16">
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
          <Link
            href="/dashboard/create"
            className="px-5 py-2.5 border border-border text-muted text-xs tracking-widest uppercase hover:border-accent hover:text-foreground transition-all duration-200"
          >
            + 새 이벤트
          </Link>
        </div>

        <div className="rule mb-8" />

        {eventsLoading ? (
          <p className="text-center text-muted text-sm py-16 animate-pulse">불러오는 중...</p>
        ) : events.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-muted text-sm mb-4">아직 이벤트가 없습니다.</p>
            <Link
              href="/dashboard/create"
              className="text-xs tracking-widest uppercase text-accent hover:brightness-110 transition-all"
            >
              첫 이벤트 만들기 →
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-px" style={{ background: "var(--border)" }}>
            {events.map((event) => (
              <Link
                key={event.id}
                href={`/dashboard/events/${event.id}`}
                className="flex items-center justify-between p-6 bg-surface hover:bg-[var(--surface-2)] transition-colors duration-150"
              >
                <div className="flex flex-col gap-1 min-w-0 flex-1">
                  <span className="text-sm text-foreground font-medium truncate">
                    {event.title}
                  </span>
                  <span className="text-xs text-muted">
                    {event.date?.toDate().toLocaleDateString("ko-KR")}
                    {" · "}
                    {planLabels[event.plan]}
                    {" · "}
                    클립 {event.clipCount}개
                  </span>
                </div>
                <span
                  className="text-xs tracking-widest uppercase shrink-0 ml-4"
                  style={{ color: statusColors[event.status] }}
                >
                  {statusLabels[event.status]}
                </span>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
