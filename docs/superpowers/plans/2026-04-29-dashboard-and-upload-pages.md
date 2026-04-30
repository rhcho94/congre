# Dashboard & Upload Pages Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the host dashboard (/dashboard, /dashboard/create, /dashboard/events/[eventId]) and a token-verified participant upload page (/upload/[eventId]) connected to real Firestore data.

**Architecture:** New `src/lib/events.ts` centralizes all event/clip Firestore CRUD. Dashboard pages are separate route files that guard against unauthenticated access via `subscribeToAuthChanges` + `useRouter` redirect. The upload page wraps `useSearchParams` in a Suspense boundary and verifies the URL token against Firestore before showing the recording UI.

**Tech Stack:** Next.js 16 App Router, Firebase Firestore (onSnapshot for realtime), Tailwind CSS 4, qrcode.react (QR generation), existing `@/lib/auth`, `@/lib/s3`, `@/lib/firebase` utilities.

---

## Firestore Index Note

Two queries require composite indexes. Firestore will log an error with a clickable link to auto-create them when first hit:
- `events` collection: `hostId ASC, createdAt DESC`
- `clips` collection: `eventId ASC, uploadedAt DESC`

Click the link in the browser console (or Firebase Console → Firestore → Indexes) to create them.

---

## File Map

| Path | Action | Responsibility |
|------|--------|----------------|
| `src/lib/events.ts` | **Create** | Event/clip Firestore CRUD: createEvent, getEvent, closeEvent, subscribeToHostEvents, subscribeToClips, saveClipMetadata |
| `src/app/dashboard/page.tsx` | **Create** | Auth-protected event list with realtime onSnapshot |
| `src/app/dashboard/create/page.tsx` | **Create** | Event creation form → QR code + share link display |
| `src/app/dashboard/events/[eventId]/page.tsx` | **Create** | Event detail: share link, realtime clip list, close modal |
| `src/app/upload/[eventId]/page.tsx` | **Create** | Token-verified participant recording/upload (adapted from /event/[id]) |

---

## Task 1: Install qrcode.react

**Files:**
- Modify: `package.json` (via npm)

- [ ] **Step 1: Install the package**

```bash
cd "C:/Users/PC/OneDrive/바탕 화면/my-project/congre"
npm install qrcode.react
```

Expected output: `added 1 package` (or similar), no errors.

- [ ] **Step 2: Verify TypeScript types are included**

`qrcode.react` v3+ ships its own types. Run:
```bash
npx tsc --noEmit
```
Expected: no type errors (or same errors as before install).

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "deps: add qrcode.react for QR code generation"
```

---

## Task 2: Create `src/lib/events.ts`

**Files:**
- Create: `src/lib/events.ts`

- [ ] **Step 1: Create the file**

```typescript
// src/lib/events.ts
import {
  collection, addDoc, doc, getDoc, updateDoc, onSnapshot,
  query, where, orderBy, serverTimestamp, increment, Timestamp,
} from "firebase/firestore";
import { getFirebaseFirestore, isFirebaseConfigured } from "./firebase";

export type EventPlan = "free" | "small" | "medium" | "large";
export type EventStatus = "open" | "closed" | "rendering" | "done";

export interface CongreEvent {
  id: string;
  title: string;
  date: Timestamp;
  plan: EventPlan;
  hostId: string;
  status: EventStatus;
  sessionToken: string | null;
  createdAt: Timestamp;
  clipCount: number;
}

export interface Clip {
  id: string;
  eventId: string;
  s3Key: string;
  uploadedAt: Timestamp;
  sessionToken: string;
}

export async function createEvent(input: {
  title: string;
  date: string; // "YYYY-MM-DD"
  plan: EventPlan;
  hostId: string;
}): Promise<{ eventId: string; sessionToken: string }> {
  const db = getFirebaseFirestore();
  const sessionToken = crypto.randomUUID();
  const ref = await addDoc(collection(db, "events"), {
    title: input.title,
    date: Timestamp.fromDate(new Date(input.date)),
    plan: input.plan,
    hostId: input.hostId,
    status: "open" as EventStatus,
    sessionToken,
    createdAt: serverTimestamp(),
    clipCount: 0,
  });
  return { eventId: ref.id, sessionToken };
}

export async function getEvent(eventId: string): Promise<CongreEvent | null> {
  if (!isFirebaseConfigured) return null;
  const db = getFirebaseFirestore();
  const snap = await getDoc(doc(db, "events", eventId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as CongreEvent;
}

export async function closeEvent(eventId: string): Promise<void> {
  const db = getFirebaseFirestore();
  await updateDoc(doc(db, "events", eventId), {
    status: "closed",
    sessionToken: null,
  });
}

export function subscribeToHostEvents(
  hostId: string,
  callback: (events: CongreEvent[]) => void,
  onError?: (err: Error) => void
): () => void {
  if (!isFirebaseConfigured) {
    callback([]);
    return () => {};
  }
  const db = getFirebaseFirestore();
  const q = query(
    collection(db, "events"),
    where("hostId", "==", hostId),
    orderBy("createdAt", "desc")
  );
  return onSnapshot(
    q,
    (snap) => callback(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as CongreEvent)),
    onError
  );
}

export function subscribeToClips(
  eventId: string,
  callback: (clips: Clip[]) => void,
  onError?: (err: Error) => void
): () => void {
  if (!isFirebaseConfigured) {
    callback([]);
    return () => {};
  }
  const db = getFirebaseFirestore();
  const q = query(
    collection(db, "clips"),
    where("eventId", "==", eventId),
    orderBy("uploadedAt", "desc")
  );
  return onSnapshot(
    q,
    (snap) => callback(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Clip)),
    onError
  );
}

export async function saveClipMetadata(data: {
  eventId: string;
  s3Key: string;
  sessionToken: string;
}): Promise<void> {
  if (!isFirebaseConfigured) return;
  const db = getFirebaseFirestore();
  await addDoc(collection(db, "clips"), {
    ...data,
    uploadedAt: serverTimestamp(),
  });
  await updateDoc(doc(db, "events", data.eventId), {
    clipCount: increment(1),
  });
}
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/events.ts
git commit -m "feat: add Firestore event/clip CRUD library"
```

---

## Task 3: Create `/dashboard` page

**Files:**
- Create: `src/app/dashboard/page.tsx`

- [ ] **Step 1: Create the file**

```tsx
// src/app/dashboard/page.tsx
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
  free: "무료",
  small: "소형",
  medium: "중형",
  large: "대형",
};

const statusLabels: Record<EventStatus, string> = {
  open: "수집중",
  closed: "마감",
  rendering: "편집중",
  done: "완성",
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
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit
```

Expected: no new errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/dashboard/page.tsx
git commit -m "feat: add /dashboard host event list page"
```

---

## Task 4: Create `/dashboard/create` page

**Files:**
- Create: `src/app/dashboard/create/page.tsx`

- [ ] **Step 1: Create the file**

```tsx
// src/app/dashboard/create/page.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
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

  async function handleCopy() {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
              <QRCodeSVG
                value={shareUrl}
                size={180}
                bgColor="#151310"
                fgColor="#ede8df"
                level="M"
              />
              <div className="w-full">
                <p className="text-xs text-muted tracking-widest uppercase mb-2">공유 링크</p>
                <div className="flex items-center gap-2">
                  <span className="flex-1 text-xs text-foreground bg-[var(--surface-2)] border border-border px-3 py-2 truncate font-mono">
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
    </div>
  );
}
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit
```

Expected: no new errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/dashboard/create/page.tsx
git commit -m "feat: add /dashboard/create event creation page with QR code"
```

---

## Task 5: Create `/dashboard/events/[eventId]` page

**Files:**
- Create: `src/app/dashboard/events/[eventId]/page.tsx`

- [ ] **Step 1: Create the file**

```tsx
// src/app/dashboard/events/[eventId]/page.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import { subscribeToAuthChanges, type User } from "@/lib/auth";
import {
  getEvent,
  closeEvent,
  subscribeToClips,
  type CongreEvent,
  type Clip,
} from "@/lib/events";
import { isFirebaseConfigured } from "@/lib/firebase";
import type { Timestamp } from "firebase/firestore";

const statusLabels: Record<string, string> = {
  open: "수집중",
  closed: "마감",
  rendering: "편집 중...",
  done: "편집 완료",
};

const statusColors: Record<string, string> = {
  open: "var(--accent)",
  closed: "var(--muted)",
  rendering: "#7b8ce0",
  done: "#5ba06e",
};

function formatUploadTime(ts: Timestamp | undefined): string {
  if (!ts) return "";
  return ts.toDate().toLocaleString("ko-KR", {
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
  });
}

export default function EventDetailPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [authChecking, setAuthChecking] = useState(isFirebaseConfigured);
  const [event, setEvent] = useState<CongreEvent | null>(null);
  const [eventLoading, setEventLoading] = useState(true);
  const [clips, setClips] = useState<Clip[]>([]);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [closing, setClosing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [shareUrl, setShareUrl] = useState("");

  useEffect(() => {
    if (!isFirebaseConfigured) return;
    return subscribeToAuthChanges((firebaseUser) => {
      setUser(firebaseUser);
      setAuthChecking(false);
      if (!firebaseUser) router.push("/host");
    });
  }, [router]);

  useEffect(() => {
    if (!eventId) return;
    getEvent(eventId).then((evt) => {
      setEvent(evt);
      setEventLoading(false);
      if (evt?.sessionToken) {
        setShareUrl(
          `${window.location.origin}/upload/${eventId}?token=${evt.sessionToken}`
        );
      }
    });
  }, [eventId]);

  useEffect(() => {
    if (!eventId) return;
    return subscribeToClips(eventId, setClips);
  }, [eventId]);

  async function handleCopy() {
    if (!shareUrl) return;
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleClose() {
    setClosing(true);
    try {
      await closeEvent(eventId);
      setShowCloseModal(false);
      setShareUrl("");
      const updated = await getEvent(eventId);
      setEvent(updated);
    } catch {
      alert("마감 처리 중 오류가 발생했습니다.");
    } finally {
      setClosing(false);
    }
  }

  if (authChecking || eventLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-xs tracking-widest uppercase text-muted animate-pulse">로딩 중...</p>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <p className="text-muted text-sm">이벤트를 찾을 수 없습니다.</p>
        <Link href="/dashboard" className="text-xs text-accent tracking-widest uppercase">
          ← 대시보드
        </Link>
      </div>
    );
  }

  const isClosed = event.status !== "open";

  return (
    <div className="min-h-screen bg-background">
      {/* Close confirmation modal */}
      {showCloseModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-6">
          <div className="bg-[var(--surface)] border border-border p-8 max-w-sm w-full">
            <p
              className="text-lg italic text-foreground mb-3"
              style={{ fontFamily: "var(--font-display, serif)" }}
            >
              정말 마감하시겠습니까?
            </p>
            <p className="text-sm text-muted mb-6 leading-relaxed">
              마감하면 참가자들이 더 이상 영상을 업로드할 수 없습니다.
              <br />
              <strong className="text-foreground">이 작업은 되돌릴 수 없습니다.</strong>
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowCloseModal(false)}
                disabled={closing}
                className="flex-1 py-3 border border-border text-muted text-xs tracking-widest uppercase hover:border-accent hover:text-foreground transition-all duration-200 disabled:opacity-50"
              >
                취소
              </button>
              <button
                onClick={handleClose}
                disabled={closing}
                className="flex-1 py-3 bg-red-600 text-white text-xs tracking-widest uppercase hover:bg-red-700 transition-all duration-200 disabled:opacity-50"
              >
                {closing ? "처리 중..." : "마감 확인"}
              </button>
            </div>
          </div>
        </div>
      )}

      <nav className="flex items-center justify-between px-8 py-6 border-b border-border">
        <Link
          href="/"
          className="text-xl italic tracking-wider text-foreground hover:text-accent transition-colors duration-200"
          style={{ fontFamily: "var(--font-display, serif)" }}
        >
          congre
        </Link>
        <Link
          href="/dashboard"
          className="text-xs tracking-widest uppercase text-muted hover:text-accent transition-colors duration-200"
        >
          ← 대시보드
        </Link>
      </nav>

      <main className="mx-auto max-w-3xl px-6 py-16">
        {/* Event header */}
        <div className="flex items-start justify-between mb-10 gap-4">
          <div className="min-w-0">
            <p className="text-xs tracking-[0.4em] uppercase text-accent mb-2">Event</p>
            <h1
              className="text-3xl italic text-foreground"
              style={{ fontFamily: "var(--font-display, serif)" }}
            >
              {event.title}
            </h1>
            <p className="text-xs text-muted mt-2">
              {event.date?.toDate().toLocaleDateString("ko-KR")}
              {" · "}
              클립 {clips.length}개
            </p>
          </div>
          <div className="flex flex-col items-end gap-3 shrink-0">
            <span
              className="text-xs tracking-widest uppercase"
              style={{ color: statusColors[event.status] }}
            >
              {statusLabels[event.status]}
            </span>
            {!isClosed && (
              <button
                onClick={() => setShowCloseModal(true)}
                className="px-4 py-2 bg-red-600 text-white text-xs tracking-widest uppercase hover:bg-red-700 transition-all duration-200"
              >
                마감하기
              </button>
            )}
          </div>
        </div>

        <div className="rule mb-8" />

        {/* Share / status section */}
        {!isClosed && shareUrl ? (
          <div className="mb-12">
            <p className="text-xs tracking-widest uppercase text-muted mb-4">참가자 초대</p>
            <div className="flex flex-col sm:flex-row gap-6 p-6 border border-border bg-surface">
              <div className="shrink-0 flex justify-center">
                <QRCodeSVG
                  value={shareUrl}
                  size={140}
                  bgColor="#151310"
                  fgColor="#ede8df"
                  level="M"
                />
              </div>
              <div className="flex-1 flex flex-col justify-center gap-3">
                <p className="text-xs text-muted leading-relaxed">
                  QR코드를 스캔하거나 링크를 공유하세요.
                </p>
                <div className="flex items-center gap-2">
                  <span className="flex-1 text-xs text-foreground bg-[var(--surface-2)] border border-border px-3 py-2 truncate font-mono">
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
          </div>
        ) : event.status === "rendering" ? (
          <div className="mb-8 p-4 border border-border bg-surface flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-[#7b8ce0] animate-pulse" />
            <p className="text-sm text-muted">AI가 영상을 편집하고 있습니다...</p>
          </div>
        ) : event.status === "done" ? (
          <div className="mb-8 p-4 border border-border bg-surface flex items-center gap-3">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#5ba06e"
              strokeWidth="1.5"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
            <p className="text-sm" style={{ color: "#5ba06e" }}>
              편집이 완료되었습니다
            </p>
          </div>
        ) : null}

        {/* Clips list */}
        <div>
          <p className="text-xs tracking-widest uppercase text-muted mb-4">
            업로드된 클립 ({clips.length}개)
          </p>
          {clips.length === 0 ? (
            <p className="text-muted text-sm py-8 text-center">
              아직 업로드된 클립이 없습니다.
            </p>
          ) : (
            <div className="flex flex-col gap-px" style={{ background: "var(--border)" }}>
              {clips.map((clip, i) => (
                <div
                  key={clip.id}
                  className="flex items-center justify-between px-5 py-4 bg-surface"
                >
                  <span className="text-xs text-muted tabular-nums shrink-0">
                    #{clips.length - i}
                  </span>
                  <span className="text-xs text-muted font-mono truncate mx-4 flex-1">
                    {clip.s3Key.split("/").pop()}
                  </span>
                  <span className="text-xs text-muted shrink-0">
                    {formatUploadTime(clip.uploadedAt)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit
```

Expected: no new errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/dashboard/events/
git commit -m "feat: add /dashboard/events/[eventId] detail page with clip list and close modal"
```

---

## Task 6: Create `/upload/[eventId]` page

**Files:**
- Create: `src/app/upload/[eventId]/page.tsx`

This page adapts `/event/[id]/page.tsx` with token verification. `useSearchParams` requires a `Suspense` wrapper — the outer `UploadPage` provides the boundary, `UploadInner` holds all the logic.

- [ ] **Step 1: Create the file**

```tsx
// src/app/upload/[eventId]/page.tsx
"use client";

import { useState, useRef, useEffect, useCallback, Suspense } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { checkS3, getPresignedUrl, uploadToS3 } from "@/lib/s3";
import { getEvent, saveClipMetadata, type CongreEvent } from "@/lib/events";
import { isFirebaseConfigured } from "@/lib/firebase";

type Stage = "verifying" | "invalid" | "idle" | "recording" | "preview" | "uploading" | "done" | "error";

const MAX_SEC = 10;

function UploadInner() {
  const { eventId } = useParams<{ eventId: string }>();
  const searchParams = useSearchParams();
  const urlToken = searchParams.get("token") ?? "";

  const [stage, setStage] = useState<Stage>("verifying");
  const [event, setEvent] = useState<CongreEvent | null>(null);
  const [timer, setTimer] = useState(0);
  const [progress, setProgress] = useState(0);
  const [retryNum, setRetryNum] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");
  const [s3Ready, setS3Ready] = useState<boolean | null>(null);

  const liveRef = useRef<HTMLVideoElement>(null);
  const previewRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const blobRef = useRef<Blob | null>(null);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const previewUrlRef = useRef<string>("");

  // Verify token against Firestore
  useEffect(() => {
    async function verify() {
      if (!isFirebaseConfigured || !urlToken) {
        setStage("invalid");
        return;
      }
      const evt = await getEvent(eventId);
      if (!evt || evt.sessionToken === null || evt.sessionToken !== urlToken) {
        setStage("invalid");
        return;
      }
      setEvent(evt);
      setStage("idle");
    }
    verify();
  }, [eventId, urlToken]);

  useEffect(() => {
    checkS3().then(setS3Ready);
  }, []);

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  useEffect(() => {
    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
      stopStream();
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    };
  }, [stopStream]);

  useEffect(() => {
    if (stage !== "recording") return;
    const video = liveRef.current;
    if (!video || !streamRef.current) return;
    video.srcObject = streamRef.current;
    video.play().catch(() => {});
  }, [stage]);

  useEffect(() => {
    if (stage !== "preview") return;
    const video = previewRef.current;
    if (!video || !previewUrlRef.current) return;
    video.src = previewUrlRef.current;
    video.load();
  }, [stage]);

  async function startCamera() {
    setErrorMsg("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" }, width: { ideal: 1080 }, height: { ideal: 1920 } },
        audio: true,
      });
      streamRef.current = stream;
      beginRecording(stream);
    } catch {
      setErrorMsg("카메라 접근 권한이 필요합니다. 브라우저 설정을 확인해주세요.");
      setStage("error");
    }
  }

  function beginRecording(stream: MediaStream) {
    chunksRef.current = [];
    const mimeType =
      ["video/webm;codecs=vp9", "video/webm", "video/mp4"].find((m) =>
        MediaRecorder.isTypeSupported(m)
      ) ?? "";
    const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
    recorderRef.current = recorder;

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };

    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: recorder.mimeType });
      blobRef.current = blob;
      stopStream();
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = URL.createObjectURL(blob);
      setStage("preview");
    };

    recorder.start(100);
    setStage("recording");
    setTimer(0);

    tickRef.current = setInterval(() => {
      setTimer((t) => {
        const next = t + 1;
        if (next >= MAX_SEC) {
          clearInterval(tickRef.current!);
          tickRef.current = null;
          if (recorderRef.current?.state === "recording") recorderRef.current.stop();
          return MAX_SEC;
        }
        return next;
      });
    }, 1000);
  }

  function stopEarly() {
    if (tickRef.current) {
      clearInterval(tickRef.current);
      tickRef.current = null;
    }
    if (recorderRef.current?.state === "recording") recorderRef.current.stop();
  }

  function reRecord() {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = "";
    }
    blobRef.current = null;
    setTimer(0);
    setProgress(0);
    setRetryNum(0);
    setErrorMsg("");
    setStage("idle");
  }

  async function doUpload(attempt: number): Promise<void> {
    const blob = blobRef.current!;
    const mimeType = blob.type.split(";")[0] || "video/webm";
    const ext = mimeType.includes("mp4") ? "mp4" : "webm";
    const fileName = `clip-${Date.now()}.${ext}`;

    const { url, key } = await getPresignedUrl(eventId, fileName, mimeType);
    await uploadToS3(url, blob, mimeType, setProgress);

    const clipSave = saveClipMetadata({ eventId, s3Key: key, sessionToken: urlToken });
    const clipTimeout = new Promise<void>((_, reject) =>
      setTimeout(() => reject(new Error("firestore_timeout")), 5000)
    );
    await Promise.race([clipSave, clipTimeout]).catch((err) => {
      console.error("[firestore] saveClipMetadata skipped:", err?.message ?? err);
    });
  }

  async function handleUpload() {
    if (!blobRef.current) return;
    setStage("uploading");
    setProgress(0);
    setRetryNum(0);
    setErrorMsg("");

    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        if (attempt > 1) {
          setRetryNum(attempt - 1);
          setProgress(0);
          await new Promise((r) => setTimeout(r, 1000 * attempt));
        }
        await doUpload(attempt);
        setStage("done");
        return;
      } catch (err) {
        if (attempt === 3) {
          setErrorMsg(
            err instanceof Error && err.message.includes("S3_NOT_CONFIGURED")
              ? "S3가 연결되지 않아 업로드할 수 없습니다."
              : "업로드에 실패했습니다. 네트워크를 확인해주세요."
          );
          setStage("error");
        }
      }
    }
  }

  const timerPct = (timer / MAX_SEC) * 100;

  // ── verifying ──
  if (stage === "verifying") {
    return (
      <div
        className="min-h-screen bg-background flex items-center justify-center"
        style={{ maxWidth: "480px", margin: "0 auto" }}
      >
        <p className="text-xs tracking-widest uppercase text-muted animate-pulse">확인 중...</p>
      </div>
    );
  }

  // ── invalid (closed / wrong token) ──
  if (stage === "invalid") {
    return (
      <div
        className="min-h-screen bg-background flex flex-col items-center justify-center px-6 text-center gap-6"
        style={{ maxWidth: "480px", margin: "0 auto" }}
      >
        <div className="w-16 h-16 border border-border flex items-center justify-center">
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            className="text-muted"
          >
            <path d="M18 11V7a6 6 0 0 0-12 0v4" />
            <rect x="3" y="11" width="18" height="11" rx="1" />
          </svg>
        </div>
        <div>
          <p
            className="text-xl italic text-foreground mb-2"
            style={{ fontFamily: "var(--font-display, serif)" }}
          >
            마감된 이벤트입니다
          </p>
          <p className="text-sm text-muted leading-relaxed">업로드 기간이 종료되었습니다.</p>
        </div>
        <Link
          href="/"
          className="text-xs text-muted hover:text-accent tracking-widest uppercase transition-colors"
        >
          홈으로
        </Link>
      </div>
    );
  }

  // ── upload UI ──
  return (
    <div
      className="min-h-screen bg-background flex flex-col"
      style={{ maxWidth: "480px", margin: "0 auto" }}
    >
      <header className="px-6 py-5 border-b border-border flex items-center justify-between">
        <Link
          href="/"
          className="text-xl italic tracking-wider text-foreground"
          style={{ fontFamily: "var(--font-display, serif)" }}
        >
          congre
        </Link>
      </header>

      <div className="px-6 pt-8 pb-4">
        <p className="text-xs tracking-[0.4em] uppercase text-accent mb-2">
          Event · #{eventId}
        </p>
        <h1
          className="text-2xl italic text-foreground"
          style={{ fontFamily: "var(--font-display, serif)" }}
        >
          {event?.title ?? "이벤트"}
        </h1>
      </div>

      {s3Ready === false && (
        <div className="mx-6 mt-2 p-3 border border-border bg-surface">
          <p className="text-xs text-accent font-medium tracking-wide mb-0.5">S3 미연결</p>
          <p className="text-xs text-muted leading-relaxed">
            .env.local에 AWS 설정값을 추가하면 실제 업로드가 가능합니다.
          </p>
        </div>
      )}

      <div className="rule mx-6 my-5" />

      <main className="flex-1 flex flex-col items-center px-6 py-4 gap-6">
        {/* ── idle ── */}
        {stage === "idle" && (
          <>
            <button
              onClick={startCamera}
              className="group relative w-full bg-surface hover:bg-[var(--surface-2)] border border-border hover:border-accent transition-all duration-300 flex flex-col items-center justify-center gap-4 cursor-pointer"
              style={{ aspectRatio: "9 / 16", maxHeight: "54vh" }}
            >
              <span className="absolute top-3 left-3 w-5 h-5 border-t border-l border-muted group-hover:border-accent transition-colors duration-300" />
              <span className="absolute top-3 right-3 w-5 h-5 border-t border-r border-muted group-hover:border-accent transition-colors duration-300" />
              <span className="absolute bottom-3 left-3 w-5 h-5 border-b border-l border-muted group-hover:border-accent transition-colors duration-300" />
              <span className="absolute bottom-3 right-3 w-5 h-5 border-b border-r border-muted group-hover:border-accent transition-colors duration-300" />
              <svg
                width="36"
                height="36"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                className="text-muted group-hover:text-accent transition-colors duration-300"
              >
                <circle cx="12" cy="12" r="10" />
                <circle cx="12" cy="12" r="3" />
              </svg>
              <p className="text-sm tracking-widest uppercase text-muted group-hover:text-accent transition-colors duration-300">
                촬영 시작
              </p>
              <p className="text-xs text-muted opacity-50">최대 10초</p>
            </button>
            <p className="text-xs text-center text-muted leading-relaxed">
              이벤트 현장의 10초를 담아주세요.
              <br />
              AI가 모든 순간을 하나의 영상으로 편집합니다.
            </p>
          </>
        )}

        {/* ── recording ── */}
        {stage === "recording" && (
          <div className="w-full flex flex-col items-center gap-4">
            <div className="w-full flex items-center gap-3">
              <div className="flex-1 h-px bg-border relative overflow-hidden">
                <div
                  className="absolute inset-y-0 left-0 transition-all duration-1000 ease-linear"
                  style={{ width: `${timerPct}%`, background: "var(--accent)" }}
                />
              </div>
              <span className="text-xs text-accent tabular-nums shrink-0">
                {MAX_SEC - timer}s
              </span>
            </div>
            <div
              className="relative w-full bg-black overflow-hidden"
              style={{ aspectRatio: "9 / 16", maxHeight: "54vh" }}
            >
              <span className="absolute top-3 left-3 w-5 h-5 border-t border-l border-accent z-10" />
              <span className="absolute top-3 right-3 w-5 h-5 border-t border-r border-accent z-10" />
              <span className="absolute bottom-3 left-3 w-5 h-5 border-b border-l border-accent z-10" />
              <span className="absolute bottom-3 right-3 w-5 h-5 border-b border-r border-accent z-10" />
              <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-10">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <span className="text-xs text-white tracking-widest uppercase">REC</span>
              </div>
              <video ref={liveRef} playsInline muted className="w-full h-full object-cover" />
            </div>
            <button
              onClick={stopEarly}
              className="px-8 py-3 border border-border text-muted text-xs tracking-widest uppercase hover:border-accent hover:text-foreground transition-all duration-200"
            >
              촬영 완료
            </button>
          </div>
        )}

        {/* ── preview ── */}
        {stage === "preview" && (
          <div className="w-full flex flex-col gap-5">
            <div
              className="relative w-full bg-black overflow-hidden"
              style={{ aspectRatio: "9 / 16", maxHeight: "54vh" }}
            >
              <span className="absolute top-3 left-3 w-5 h-5 border-t border-l border-border z-10" />
              <span className="absolute top-3 right-3 w-5 h-5 border-t border-r border-border z-10" />
              <span className="absolute bottom-3 left-3 w-5 h-5 border-b border-l border-border z-10" />
              <span className="absolute bottom-3 right-3 w-5 h-5 border-b border-r border-border z-10" />
              <video
                ref={previewRef}
                playsInline
                controls
                className="w-full h-full object-cover"
              />
            </div>
            <button
              onClick={handleUpload}
              disabled={s3Ready === false}
              className="w-full py-4 bg-accent text-background text-sm tracking-widest uppercase font-medium hover:brightness-110 transition-all duration-200 glow-accent disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:brightness-100"
            >
              업로드하기
            </button>
            <button
              onClick={reRecord}
              className="text-xs text-center text-muted hover:text-accent transition-colors uppercase tracking-widest"
            >
              다시 촬영
            </button>
          </div>
        )}

        {/* ── uploading ── */}
        {stage === "uploading" && (
          <div className="w-full flex flex-col items-center gap-6 py-10">
            <p className="text-sm text-muted tracking-widest uppercase">
              {retryNum > 0 ? `재시도 중... (${retryNum}/3)` : "업로드 중..."}
            </p>
            <div className="w-full h-px bg-border relative overflow-hidden">
              <div
                className="absolute inset-y-0 left-0 bg-accent transition-all duration-150"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-xs text-muted tabular-nums">{progress}%</p>
          </div>
        )}

        {/* ── done ── */}
        {stage === "done" && (
          <div className="w-full flex flex-col items-center gap-6 text-center py-10">
            <div className="w-16 h-16 border border-accent flex items-center justify-center">
              <svg
                width="28"
                height="28"
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
              <p
                className="text-xl italic text-foreground mb-2"
                style={{ fontFamily: "var(--font-display, serif)" }}
              >
                업로드 완료
              </p>
              <p className="text-sm text-muted leading-relaxed">
                영상이 성공적으로 제출되었습니다.
                <br />
                AI 편집 완료 후 알림을 드릴게요.
              </p>
            </div>
            <button
              onClick={reRecord}
              className="px-6 py-2.5 border border-border text-muted text-xs tracking-widest uppercase hover:border-accent hover:text-foreground transition-all duration-200"
            >
              하나 더 올리기
            </button>
          </div>
        )}

        {/* ── error ── */}
        {stage === "error" && (
          <div className="w-full flex flex-col items-center gap-6 text-center py-10">
            <div className="w-16 h-16 border border-border flex items-center justify-center">
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                className="text-muted"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </div>
            <div>
              <p className="text-base text-foreground mb-2">오류가 발생했습니다</p>
              <p className="text-sm text-muted leading-relaxed">{errorMsg}</p>
            </div>
            <div className="flex gap-4">
              {blobRef.current && (
                <button
                  onClick={handleUpload}
                  className="px-5 py-2.5 bg-accent text-background text-xs tracking-widest uppercase hover:brightness-110 transition-all duration-200"
                >
                  다시 시도
                </button>
              )}
              <button
                onClick={reRecord}
                className="px-5 py-2.5 border border-border text-muted text-xs tracking-widest uppercase hover:border-accent hover:text-foreground transition-all duration-200"
              >
                다시 촬영
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default function UploadPage() {
  return (
    <Suspense
      fallback={
        <div
          className="min-h-screen bg-background flex items-center justify-center"
          style={{ maxWidth: "480px", margin: "0 auto" }}
        >
          <p className="text-xs tracking-widest uppercase text-muted animate-pulse">로딩 중...</p>
        </div>
      }
    >
      <UploadInner />
    </Suspense>
  );
}
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit
```

Expected: no new errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/upload/
git commit -m "feat: add /upload/[eventId] token-verified participant upload page"
```

---

## Spec Coverage Check

| Spec Requirement | Task |
|-----------------|------|
| /dashboard — auth-protected event list | Task 3 |
| Event cards: 이름, 날짜, 플랜, 상태, 클립 수 | Task 3 |
| "새 이벤트 만들기" button | Task 3 |
| /dashboard/create — form: title, date, plan | Task 4 |
| createEvent → sessionToken UUID → Firestore | Task 2, 4 |
| QR code display (qrcode.react) | Tasks 1, 4 |
| Share link `/upload/[eventId]?token=[sessionToken]` | Task 4 |
| /dashboard/events/[eventId] — share link + QR | Task 5 |
| Realtime clip list (onSnapshot) | Tasks 2, 5 |
| 클립 수 + 업로드 시간 | Task 5 |
| 마감 버튼 (red, modal, irreversible warning) | Task 5 |
| status → "closed", sessionToken → null on close | Tasks 2, 5 |
| Rendering/done status display | Task 5 |
| /upload/[eventId] — URL token verification | Task 6 |
| Mismatch or null → "마감된 이벤트입니다" | Task 6 |
| Valid token → existing recording UI | Task 6 |
| Save to clips collection + increment clipCount | Tasks 2, 6 |
| Mobile optimized (9:16, 480px max) | Task 6 (upload), Task 3-5 (responsive) |
| Loading/error states | All tasks |
