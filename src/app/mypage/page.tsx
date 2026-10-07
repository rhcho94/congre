"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import AppHeader from "@/components/AppHeader";
import PageBackdrop from "@/components/PageBackdrop";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { subscribeToAuthChanges, logout, changePassword, deleteAccount, type User } from "@/lib/auth";
import { EmailVerificationBanner } from "@/components/EmailVerificationBanner";
import { type EventStatus } from "@/lib/events";
import { isFirebaseConfigured, getFirebaseAuth } from "@/lib/firebase";
import { getUserDoc, updateUserDoc, type UserDoc } from "@/lib/users";

interface ApiEvent {
  id: string;
  status: EventStatus;
}

// 작은 버튼 — 높이 44px, 15px
const SMALL_BTN: React.CSSProperties = { height: 44, fontSize: 15, padding: "0 16px" };

export default function MyPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [authChecking, setAuthChecking] = useState(isFirebaseConfigured);
  const [events, setEvents] = useState<ApiEvent[]>([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [userDoc, setUserDoc] = useState<UserDoc | null>(null);
  const [userDocLoading, setUserDocLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [pwMode, setPwMode] = useState(false);
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [pwSaving, setPwSaving] = useState(false);
  const [delMode, setDelMode] = useState(false);
  const [delPw, setDelPw] = useState("");
  const [showDelPw, setShowDelPw] = useState(false);
  const [delSaving, setDelSaving] = useState(false);

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
    (["open", "rendering"] as EventStatus[]).includes(e.status)
  ).length;
  const doneCount = events.filter((e) => e.status === "done").length;

  function handleEditStart() {
    setEditName(userDoc?.name ?? "");
    setEditPhone(userDoc?.phone ?? "");
    setEditMode(true);
  }

  function handleCancel() {
    setEditMode(false);
  }

  async function handleSave() {
    if (editName.trim() === "" || editPhone.trim() === "") {
      alert("이름과 전화번호를 입력해주세요");
      return;
    }
    if (!user) return;
    setSaving(true);
    try {
      await updateUserDoc(user.uid, { name: editName.trim(), phone: editPhone.trim() });
      setUserDoc((prev) => prev ? { ...prev, name: editName.trim(), phone: editPhone.trim() } : prev);
      alert("프로필이 저장되었습니다");
      setEditMode(false);
    } catch (err) {
      console.error("[mypage] updateUserDoc failed:", err);
      alert("저장 실패: " + (err instanceof Error ? err.message : "알 수 없는 오류"));
    } finally {
      setSaving(false);
    }
  }

  function handlePwStart() {
    setCurrentPw("");
    setNewPw("");
    setShowCurrentPw(false);
    setShowNewPw(false);
    setPwMode(true);
  }

  function handlePwCancel() {
    setPwMode(false);
  }

  async function handlePwSave() {
    if (currentPw.trim() === "" || newPw.trim() === "") {
      alert("현재 비밀번호와 새 비밀번호를 입력해주세요");
      return;
    }
    if (newPw.length < 6) {
      alert("새 비밀번호는 6자 이상이어야 합니다");
      return;
    }
    setPwSaving(true);
    try {
      await changePassword(currentPw, newPw);
      alert("비밀번호가 변경되었습니다");
      setPwMode(false);
    } catch (err) {
      console.error("[mypage] changePassword failed:", err);
      const code = err instanceof Error && "code" in err
        ? (err as { code: string }).code
        : "";
      if (code === "auth/wrong-password" || code === "auth/invalid-credential") {
        alert("현재 비밀번호가 올바르지 않습니다");
      } else {
        alert("변경 실패: " + (err instanceof Error ? err.message : "알 수 없는 오류"));
      }
    } finally {
      setPwSaving(false);
    }
  }

  function handleDelStart() {
    setDelPw("");
    setShowDelPw(false);
    setDelMode(true);
  }

  function handleDelCancel() {
    setDelMode(false);
  }

  async function handleDelSubmit() {
    if (delPw.trim() === "") {
      alert("현재 비밀번호를 입력해주세요");
      return;
    }
    const confirmed = confirm(
      "정말 탈퇴하시겠습니까?\n\n회원 정보, 모든 이벤트, 업로드된 클립, 완성본 영상이 즉시 삭제되며 복구할 수 없습니다."
    );
    if (!confirmed) return;

    setDelSaving(true);
    try {
      await deleteAccount(delPw);
      alert("회원 탈퇴가 완료되었습니다");
      router.push("/host");
    } catch (err) {
      console.error("[mypage] deleteAccount failed:", err);
      const code = err instanceof Error && "code" in err
        ? (err as { code: string }).code
        : "";
      if (code === "auth/wrong-password" || code === "auth/invalid-credential") {
        alert("현재 비밀번호가 올바르지 않습니다");
      } else if (code === "INCOMPLETE_EVENTS") {
        alert(err instanceof Error ? err.message : "진행 중 이벤트를 먼저 마감해주세요");
      } else {
        alert("탈퇴 실패: " + (err instanceof Error ? err.message : "알 수 없는 오류"));
      }
    } finally {
      setDelSaving(false);
    }
  }

  if (!isFirebaseConfigured) {
    return (
      <>
        <PageBackdrop pattern="b" />
        <div className="min-h-screen flex items-center justify-center px-6">
          <div className="max-w-sm w-full notice text-center">
            <p className="text-xs text-accent font-medium mb-2">Firebase 미연결</p>
            <p className="text-xs text-muted leading-relaxed mb-4">
              .env.local에 Firebase 설정값을 추가하면 마이페이지를 사용할 수 있습니다.
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
            <button onClick={() => logout()} className="btn-quiet text-sm whitespace-nowrap">
              로그아웃
            </button>
          </div>
        </AppHeader>

        <main className="mx-auto max-w-3xl px-5 pt-2 pb-16 flex flex-col gap-4">
          <h1 className="display" style={{ fontSize: 28, lineHeight: 1.3, paddingTop: 12 }}>내 계정</h1>

          {user && !user.emailVerified && <EmailVerificationBanner />}

          {/* 이벤트 요약 */}
          {eventsLoading ? (
            <p className="text-center text-muted text-sm py-8 animate-pulse">불러오는 중...</p>
          ) : events.length === 0 ? (
            <div className="notice text-center">
              <p className="text-muted text-sm mb-4">아직 이벤트가 없습니다.</p>
              {user?.emailVerified ? (
                <Link href="/dashboard/create" className="text-sm text-accent hover:brightness-110 transition-all">
                  첫 이벤트 만들기
                </Link>
              ) : (
                <span className="text-xs text-muted">이메일 인증 후 이벤트를 만들 수 있습니다</span>
              )}
            </div>
          ) : (
            <section className="notice flex items-center justify-between gap-3" style={{ padding: 16 }}>
              <div className="flex flex-col gap-1">
                <span style={{ fontSize: 15 }}>진행 중 {inProgress}개</span>
                <span className="text-sm text-muted">완료된 {doneCount}개</span>
              </div>
              <Link href="/dashboard" className="btn btn-secondary shrink-0" style={SMALL_BTN}>
                내 이벤트 관리하기
              </Link>
            </section>
          )}

          {/* 프로필 */}
          <section className="notice flex flex-col gap-4" style={{ padding: 16 }}>
            <h2 style={{ fontSize: 17 }}>프로필</h2>
            {userDocLoading ? (
              <p className="text-muted text-sm animate-pulse">불러오는 중...</p>
            ) : (
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-0.5">
                  <span className="text-[13px] text-muted">이메일</span>
                  <span style={{ fontSize: 15 }}>{user?.email ?? "—"}</span>
                </div>

                {editMode ? (
                  <>
                    <div className="flex flex-col gap-1.5">
                      <span className="text-[15px]">이름</span>
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        disabled={saving}
                        className="input"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <span className="text-[15px]">전화번호</span>
                      <input
                        type="text"
                        value={editPhone}
                        onChange={(e) => setEditPhone(e.target.value)}
                        disabled={saving}
                        className="input"
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[13px] text-muted">이름</span>
                      <span style={{ fontSize: 15 }}>{userDoc?.name ?? "-"}</span>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[13px] text-muted">전화번호</span>
                      <span style={{ fontSize: 15 }}>{userDoc?.phone ?? "-"}</span>
                    </div>
                  </>
                )}

                <div className="flex flex-col gap-0.5">
                  <span className="text-[13px] text-muted">가입일</span>
                  <span style={{ fontSize: 15 }}>
                    {userDoc?.createdAt
                      ? userDoc.createdAt.toDate().toLocaleDateString("ko-KR")
                      : "-"}
                  </span>
                </div>

                {editMode ? (
                  <div className="flex gap-3 pt-2">
                    <button onClick={handleSave} disabled={saving} className="btn btn-primary">
                      {saving ? "저장 중..." : "저장"}
                    </button>
                    <button onClick={handleCancel} disabled={saving} className="btn btn-secondary">
                      취소
                    </button>
                  </div>
                ) : (
                  userDoc !== null && (
                    <button onClick={handleEditStart} className="btn btn-secondary self-start" style={SMALL_BTN}>
                      프로필 수정
                    </button>
                  )
                )}
              </div>
            )}
          </section>

          {/* 비밀번호 */}
          <section className="notice flex flex-col gap-4" style={{ padding: 16 }}>
            <h2 style={{ fontSize: 17 }}>비밀번호</h2>
            {pwMode ? (
              <div className="flex flex-col gap-5">
                <div className="flex flex-col gap-1.5">
                  <span className="text-[15px]">현재 비밀번호</span>
                  <div className="relative">
                    <input
                      type={showCurrentPw ? "text" : "password"}
                      value={currentPw}
                      onChange={(e) => setCurrentPw(e.target.value)}
                      disabled={pwSaving}
                      className="input"
                      style={{ paddingRight: 44 }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPw((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground transition-colors"
                    >
                      {showCurrentPw ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <span className="text-[15px]">새 비밀번호 (6자 이상)</span>
                  <div className="relative">
                    <input
                      type={showNewPw ? "text" : "password"}
                      value={newPw}
                      onChange={(e) => setNewPw(e.target.value)}
                      disabled={pwSaving}
                      className="input"
                      style={{ paddingRight: 44 }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPw((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground transition-colors"
                    >
                      {showNewPw ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                  <button onClick={handlePwSave} disabled={pwSaving} className="btn btn-primary">
                    {pwSaving ? "변경 중..." : "변경"}
                  </button>
                  <button onClick={handlePwCancel} disabled={pwSaving} className="btn btn-secondary">
                    취소
                  </button>
                </div>
              </div>
            ) : (
              <button onClick={handlePwStart} className="btn btn-secondary self-start" style={SMALL_BTN}>
                비밀번호 변경
              </button>
            )}
          </section>

          {/* 회원 탈퇴 — 맨 아래, 위 카드와 떨어뜨림 */}
          <section className="flex flex-col gap-2" style={{ marginTop: 32 }}>
            <h2 style={{ fontSize: 17, color: "var(--danger)" }}>회원 탈퇴</h2>
            {inProgress > 0 ? (
              <p className="text-sm text-muted leading-relaxed">
                진행 중 이벤트가 {inProgress}개 있습니다. 모든 이벤트를 마감한 후 탈퇴할 수 있습니다.
              </p>
            ) : delMode ? (
              <div className="flex flex-col gap-5">
                <div className="notice" style={{ padding: 16 }}>
                  <p className="text-sm text-foreground leading-relaxed">
                    회원 탈퇴 시 회원 정보, 모든 이벤트, 업로드된 클립, 완성본 영상이 즉시 삭제되며 복구할 수 없습니다.
                  </p>
                </div>
                <div className="flex flex-col gap-1.5">
                  <span className="text-[15px]">현재 비밀번호</span>
                  <div className="relative">
                    <input
                      type={showDelPw ? "text" : "password"}
                      value={delPw}
                      onChange={(e) => setDelPw(e.target.value)}
                      disabled={delSaving}
                      className="input"
                      style={{ paddingRight: 44 }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowDelPw((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground transition-colors"
                    >
                      {showDelPw ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={handleDelSubmit}
                    disabled={delSaving}
                    className="btn"
                    style={{ background: "var(--danger)", color: "#fff" }}
                  >
                    {delSaving ? "처리 중..." : "탈퇴"}
                  </button>
                  <button onClick={handleDelCancel} disabled={delSaving} className="btn btn-secondary">
                    취소
                  </button>
                </div>
              </div>
            ) : (
              <button onClick={handleDelStart} className="btn btn-danger self-start" style={SMALL_BTN}>
                회원 탈퇴
              </button>
            )}
          </section>
        </main>
      </div>
    </>
  );
}
