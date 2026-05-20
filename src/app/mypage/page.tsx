"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { BrandName } from "@/components/BrandName";
import { useRouter } from "next/navigation";
import { subscribeToAuthChanges, logout, type User } from "@/lib/auth";
import { EmailVerificationBanner } from "@/components/EmailVerificationBanner";
import { type EventStatus } from "@/lib/events";
import { isFirebaseConfigured, getFirebaseAuth } from "@/lib/firebase";
import { getUserDoc, type UserDoc } from "@/lib/users";

interface ApiEvent {
  id: string;
  status: EventStatus;
}

export default function MyPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [authChecking, setAuthChecking] = useState(isFirebaseConfigured);
  const [events, setEvents] = useState<ApiEvent[]>([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [userDoc, setUserDoc] = useState<UserDoc | null>(null);
  const [userDocLoading, setUserDocLoading] = useState(false);

  useEffect(() => {
    if (!isFirebaseConfigured) return;
    return subscribeToAuthChanges(async (firebaseUser) => {
      if (firebaseUser && !firebaseUser.emailVerified) {
        try {
          await firebaseUser.reload();
        } catch (e) {
          console.error("[mypage] reload failed:", e);
        }
      }
      setUser(firebaseUser);
      setAuthChecking(false);
      if (!firebaseUser) router.push("/host");
    });
  }, [router]);

  useEffect(() => {
    if (!user) return;
    const currentUser = user;
    let cancelled = false;

    setEventsLoading(true);
    setUserDocLoading(true);

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
        console.error("[mypage] fetchEvents error:", err);
      } finally {
        if (!cancelled) setEventsLoading(false);
      }
    }

    async function fetchUserDoc() {
      try {
        const doc = await getUserDoc(currentUser.uid);
        if (!cancelled) setUserDoc(doc);
      } catch (err) {
        console.error("[mypage] getUserDoc error:", err);
      } finally {
        if (!cancelled) setUserDocLoading(false);
      }
    }

    fetchEvents();
    fetchUserDoc();

    return () => { cancelled = true; };
  }, [user]);

  const inProgress = events.filter((e) =>
    (["open", "closed", "rendering"] as EventStatus[]).includes(e.status)
  ).length;
  const doneCount = events.filter((e) => e.status === "done").length;

  if (!isFirebaseConfigured) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6">
        <div className="max-w-sm w-full p-6 border border-border bg-surface text-center">
          <p className="text-xs text-accent font-medium tracking-wide mb-2">Firebase 미연결</p>
          <p className="text-xs text-muted leading-relaxed mb-4">
            .env.local에 Firebase 설정값을 추가하면 마이페이지를 사용할 수 있습니다.
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
          className="text-xl tracking-wider hover:opacity-75 transition-opacity duration-200"
        >
          <BrandName />
        </Link>
        <div className="flex items-center gap-6">
          <span className="text-xs text-muted truncate max-w-[180px]">{user?.email}</span>
          <Link
            href="/guide/host"
            className="text-xs tracking-widest uppercase text-muted hover:text-accent transition-colors duration-200"
          >
            사용 가이드
          </Link>
          <button
            onClick={() => logout()}
            className="text-xs tracking-widest uppercase text-muted hover:text-accent transition-colors duration-200"
          >
            로그아웃
          </button>
        </div>
      </nav>

      <main className="mx-auto max-w-3xl px-6 py-16">
        <div className="mb-10">
          <p className="text-xs tracking-[0.4em] uppercase text-accent mb-2">Mypage</p>
          <h1
            className="text-3xl italic text-foreground"
            style={{ fontFamily: "var(--font-display, serif)" }}
          >
            내 계정
          </h1>
        </div>

        {user && !user.emailVerified && <EmailVerificationBanner />}

        {eventsLoading ? (
          <p className="text-center text-muted text-sm py-8 animate-pulse">불러오는 중...</p>
        ) : events.length === 0 ? (
          <div className="p-6 border border-border bg-surface mb-8 text-center">
            <p className="text-muted text-sm mb-4">아직 이벤트가 없습니다.</p>
            {user?.emailVerified ? (
              <Link
                href="/dashboard/create"
                className="text-xs tracking-widest uppercase text-accent hover:brightness-110 transition-all"
              >
                첫 이벤트 만들기 →
              </Link>
            ) : (
              <span className="text-xs text-muted">이메일 인증 후 이벤트를 만들 수 있습니다</span>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-between p-6 border border-border bg-surface mb-8">
            <div className="flex flex-col gap-1">
              <span className="text-sm text-foreground">진행 중 {inProgress}개</span>
              <span className="text-sm text-muted">완료된 {doneCount}개</span>
            </div>
            <Link
              href="/dashboard"
              className="text-xs tracking-widest uppercase text-muted hover:text-accent transition-colors duration-200"
            >
              내 이벤트 관리하기 →
            </Link>
          </div>
        )}

        <div className="rule mb-8" />

        <div>
          <p className="text-xs tracking-[0.4em] uppercase text-accent mb-6">프로필</p>
          {userDocLoading ? (
            <p className="text-muted text-sm animate-pulse">불러오는 중...</p>
          ) : (
            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-1">
                <span className="text-xs uppercase text-muted tracking-widest">이메일</span>
                <span className="text-sm text-foreground">{user?.email ?? "—"}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs uppercase text-muted tracking-widest">이름</span>
                <span className="text-sm text-foreground">{userDoc?.name ?? "-"}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs uppercase text-muted tracking-widest">전화번호</span>
                <span className="text-sm text-foreground">{userDoc?.phone ?? "-"}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs uppercase text-muted tracking-widest">가입일</span>
                <span className="text-sm text-foreground">
                  {userDoc?.createdAt
                    ? userDoc.createdAt.toDate().toLocaleDateString("ko-KR")
                    : "-"}
                </span>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
