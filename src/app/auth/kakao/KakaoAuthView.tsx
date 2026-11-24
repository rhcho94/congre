"use client";

// 카카오 로그인 마무리 (2026-11-24). /api/auth/kakao/callback이 주소 # 뒤에 Firebase 토큰을 실어 보낸다.
// 토큰으로 로그인 → 가입한 적 있으면 바로 이동, 처음이면 이름 · 휴대폰 · 필수 동의 3개를 받아 가입을 마친다.

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BrandName } from "@/components/BrandName";
import PageBackdrop from "@/components/PageBackdrop";
import { LANDING_URL } from "@/lib/constants";
import { loginWithKakaoToken } from "@/lib/auth";
import { getFirebaseAuth } from "@/lib/firebase";
import { getUserDoc } from "@/lib/users";

const ERROR_TEXT: Record<string, string> = {
  cancelled: "카카오 로그인을 취소했어요.",
  state: "로그인 확인에 실패했어요. 처음부터 다시 시도해 주세요.",
  unavailable: "지금은 카카오 로그인을 쓸 수 없어요. 이메일로 로그인해 주세요.",
};

const CHECK_ROW: React.CSSProperties = { padding: "11px 0", fontSize: 14, lineHeight: 1.5 };
const CHECK_BOX: React.CSSProperties = { width: 22, height: 22, margin: 0, accentColor: "var(--accent)" };

type Phase = "working" | "signup" | "error";

// 주소에서 한 번만 읽는다 — 토큰은 # 뒤에 있다
type Landing = { token: string | null; error: string | null; next: string; nickname: string };
function readLanding(): Landing {
  if (typeof window === "undefined") return { token: null, error: null, next: "", nickname: "" };
  const hash = new URLSearchParams(window.location.hash.slice(1));
  return {
    token: hash.get("token"),
    error: new URLSearchParams(window.location.search).get("error"),
    next: hash.get("next") ?? "",
    nickname: hash.get("nickname") ?? "",
  };
}

function destination(n: string): string {
  return n === "create" ? "/dashboard/create" : n === "withdraw" ? "/mypage?withdraw=1" : "/dashboard";
}

export default function KakaoAuthView() {
  const router = useRouter();
  const [landing] = useState<Landing>(readLanding);
  const failed = Boolean(landing.error) || !landing.token;
  const [phase, setPhase] = useState<Phase>(failed ? "error" : "working");
  const [error, setError] = useState(
    failed ? ERROR_TEXT[landing.error ?? ""] ?? "카카오 로그인에 실패했어요. 다시 시도해 주세요." : "",
  );
  const next = landing.next;
  const [name, setName] = useState(landing.nickname);
  const [phone, setPhone] = useState("");
  const [terms, setTerms] = useState(false);
  const [privacy, setPrivacy] = useState(false);
  const [age, setAge] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    // 토큰이 주소창 · 방문 기록에 남지 않게 바로 지운다
    window.history.replaceState(null, "", "/auth/kakao");
    if (!landing.token) return;
    const token = landing.token;
    (async () => {
      try {
        const cred = await loginWithKakaoToken(token);
        const doc = await getUserDoc(cred.user.uid);
        if (doc) {
          router.replace(destination(landing.next));
        } else {
          setPhase("signup");
        }
      } catch (e) {
        console.error("[auth/kakao] sign-in failed:", e);
        setError("카카오 로그인에 실패했어요. 다시 시도해 주세요.");
        setPhase("error");
      }
    })();
  }, [landing, router]);

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    const phoneClean = phone.replace(/[\s-]/g, "");
    if (!name.trim()) {
      setFormError("이름을 입력해 주세요.");
      return;
    }
    // 이메일 가입 · 이벤트 생성과 같은 규칙
    if (!/^010[0-9]{8}$/.test(phoneClean)) {
      setFormError("휴대폰 번호는 010으로 시작하는 11자리 숫자로 입력해주세요.");
      return;
    }
    setSaving(true);
    try {
      const idToken = await getFirebaseAuth().currentUser?.getIdToken();
      if (!idToken) throw new Error("로그인 상태가 아닙니다");
      const res = await fetch("/api/user/kakao-signup", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${idToken}` },
        body: JSON.stringify({ name: name.trim(), phone: phoneClean, terms, privacy, age }),
      });
      if (!res.ok) throw new Error(`kakao-signup ${res.status}`);
      router.replace(destination(next));
    } catch (err) {
      console.error("[auth/kakao] signup failed:", err);
      setFormError("가입에 실패했어요. 다시 시도해 주세요.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <PageBackdrop pattern="a" />
      <div className="min-h-screen">
        <nav className="flex items-center justify-between gap-2 px-5 py-2 min-h-[60px]">
          <a href={LANDING_URL} className="inline-flex items-center hover:opacity-75 transition-opacity duration-200">
            <BrandName />
          </a>
        </nav>

        <main className="mx-auto max-w-md px-5 pt-2 pb-16">
          {phase === "working" && <p className="eyebrow text-center animate-pulse py-24">카카오 계정 확인 중...</p>}

          {phase === "error" && (
            <div className="notice w-full flex flex-col gap-4 text-center" style={{ marginTop: 24 }}>
              <p className="text-sm text-foreground">{error}</p>
              <Link href="/host" className="btn btn-primary w-full">
                로그인 화면으로
              </Link>
            </div>
          )}

          {phase === "signup" && (
            <div className="w-full">
              <h1 className="display mb-1" style={{ fontSize: 28, lineHeight: 1.3, paddingTop: 12 }}>가입 마무리</h1>
              <p className="text-muted text-sm mb-6">처음 한 번만 확인할게요</p>

              <form onSubmit={handleSignup} className="flex flex-col gap-4">
                <label className="flex flex-col gap-1.5">
                  <span className="text-[15px]">이름</span>
                  <input
                    type="text"
                    placeholder="홍길동"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    maxLength={20}
                    required
                    disabled={saving}
                    className="input"
                  />
                  <p className="text-[13px] text-muted">완성본과 하객 초대 화면에 표시돼요</p>
                </label>

                <label className="flex flex-col gap-1.5">
                  <span className="text-[15px]">휴대폰 번호</span>
                  <input
                    type="tel"
                    inputMode="numeric"
                    placeholder="01012345678"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                    disabled={saving}
                    className="input"
                  />
                  <p className="text-[13px] text-muted">완성본이 준비되면 문자로 알려드려요</p>
                </label>

                <div className="flex flex-col pt-1">
                  <label className="flex items-start gap-2.5 cursor-pointer" style={CHECK_ROW}>
                    <input type="checkbox" checked={terms} onChange={(e) => setTerms(e.target.checked)} disabled={saving} className="shrink-0" style={CHECK_BOX} />
                    <span>
                      <Link href="/terms" target="_blank" className="text-accent hover:underline">
                        이용약관
                      </Link>
                      에 동의합니다 (필수)
                    </span>
                  </label>
                  <label className="flex items-start gap-2.5 cursor-pointer" style={CHECK_ROW}>
                    <input type="checkbox" checked={privacy} onChange={(e) => setPrivacy(e.target.checked)} disabled={saving} className="shrink-0" style={CHECK_BOX} />
                    <span>
                      <Link href="/privacy" target="_blank" className="text-accent hover:underline">
                        개인정보처리방침
                      </Link>
                      에 동의합니다 (필수)
                    </span>
                  </label>
                  <label className="flex items-start gap-2.5 cursor-pointer" style={CHECK_ROW}>
                    <input type="checkbox" checked={age} onChange={(e) => setAge(e.target.checked)} disabled={saving} className="shrink-0" style={CHECK_BOX} />
                    <span className="flex flex-col gap-0.5">
                      <span>만 14세 이상입니다. (필수)</span>
                      <span className="text-[13px] text-muted">만 14세 미만은 가입할 수 없어요 (이용약관 제5조)</span>
                    </span>
                  </label>
                </div>

                {formError && <p className="text-[13px]" style={{ color: "var(--danger)" }}>{formError}</p>}

                <button
                  type="submit"
                  disabled={!(terms && privacy && age) || saving}
                  className="btn btn-primary mt-2"
                  style={{ height: 54, fontSize: 17 }}
                >
                  {saving ? "가입 중..." : "무료로 시작하기"}
                </button>
              </form>
            </div>
          )}
        </main>
      </div>
    </>
  );
}
