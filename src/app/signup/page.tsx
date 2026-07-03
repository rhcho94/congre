"use client";

import { useState } from "react";
import Link from "next/link";
import { BrandName } from "@/components/BrandName";
import { LANDING_URL } from "@/lib/constants";
import PageBackdrop from "@/components/PageBackdrop";
import { useRouter } from "next/navigation";
import { signUpWithEmail } from "@/lib/auth";
import { isFirebaseConfigured } from "@/lib/firebase";

function getSignupErrorMessage(code: string): string {
  switch (code) {
    case "auth/email-already-in-use":
      return "이미 가입된 이메일입니다.";
    case "auth/invalid-email":
      return "이메일 형식이 올바르지 않습니다.";
    case "auth/weak-password":
      return "비밀번호는 6자 이상이어야 합니다.";
    case "auth/network-request-failed":
      return "네트워크 오류가 발생했습니다. 인터넷 연결을 확인해주세요.";
    default:
      return "가입 중 오류가 발생했습니다. 다시 시도해주세요.";
  }
}

export default function SignupPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [termsAgreed, setTermsAgreed] = useState(false);
  const [privacyAgreed, setPrivacyAgreed] = useState(false);
  const [ageAgreed, setAgeAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const canSubmit = termsAgreed && privacyAgreed && ageAgreed && !loading;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const phoneClean = phone.replace(/[\s-]/g, "");
    if (!/^[0-9]{10,11}$/.test(phoneClean)) {
      setError("전화번호는 10~11자리 숫자로 입력해주세요.");
      return;
    }

    setLoading(true);
    try {
      await signUpWithEmail({ email, password, name, phone: phoneClean });
      router.push("/dashboard");
    } catch (err) {
      console.error("[signup] error:", err);
      const code = (err as { code?: string }).code ?? "";
      setError(getSignupErrorMessage(code));
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <PageBackdrop pattern="a" />
      <div className="min-h-screen">
        <nav className="flex items-center justify-between px-8 py-6">
          <a href={LANDING_URL} className="text-xl tracking-wider hover:opacity-75 transition-opacity duration-200">
            <BrandName />
          </a>
          <Link href="/host" className="btn-quiet text-xs tracking-widest uppercase">
            로그인
          </Link>
        </nav>

        <main className="mx-auto max-w-md px-6 py-16">
          <div className="glass-panel w-full p-10">
            <h1 className="display text-3xl text-center mb-2">호스트 가입</h1>
            <p className="text-muted text-sm text-center mb-10">가입하면 바로 무료로 테스트해 볼 수 있어요</p>

            {!isFirebaseConfigured && (
              <div className="mb-6 notice">
                <p className="text-xs text-accent mb-1 font-medium tracking-wide">Firebase 미연결</p>
                <p className="text-xs text-muted leading-relaxed">
                  .env.local에 Firebase 설정값을 추가하면 실제 가입이 가능합니다.
                </p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <label htmlFor="signup-email" className="flex flex-col gap-1.5">
                <span className="eyebrow">이메일</span>
                <input
                  id="signup-email"
                  name="email"
                  type="email"
                  placeholder="host@congre.io"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                  className="input"
                />
                <p className="text-xs text-muted mt-1">완성본 링크와 알림을 이 주소로 보내드려요</p>
              </label>

              <label htmlFor="signup-password" className="flex flex-col gap-1.5">
                <span className="eyebrow">비밀번호</span>
                <input
                  id="signup-password"
                  name="password"
                  type="password"
                  placeholder="6자 이상"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  disabled={loading}
                  className="input"
                />
              </label>

              <label htmlFor="signup-name" className="flex flex-col gap-1.5">
                <span className="eyebrow">이름</span>
                <input
                  id="signup-name"
                  name="name"
                  type="text"
                  placeholder="홍길동"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  disabled={loading}
                  className="input"
                />
                <p className="text-xs text-muted mt-1">완성본과 하객 초대 화면에 표시돼요</p>
              </label>

              <label htmlFor="signup-phone" className="flex flex-col gap-1.5">
                <span className="eyebrow">전화번호</span>
                <input
                  id="signup-phone"
                  name="phone"
                  type="tel"
                  placeholder="01012345678"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  disabled={loading}
                  className="input"
                />
                <p className="text-xs text-muted mt-1">완성본이 준비되면 문자로 알려드려요</p>
              </label>

              <div className="flex flex-col gap-2 pt-2">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={termsAgreed}
                    onChange={(e) => setTermsAgreed(e.target.checked)}
                    disabled={loading}
                    className="mt-0.5 accent-[var(--accent)]"
                  />
                  <span className="text-xs text-muted leading-relaxed">
                    <Link href="/terms" target="_blank" className="text-accent hover:underline">
                      이용약관
                    </Link>
                    에 동의합니다 (필수)
                  </span>
                </label>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={privacyAgreed}
                    onChange={(e) => setPrivacyAgreed(e.target.checked)}
                    disabled={loading}
                    className="mt-0.5 accent-[var(--accent)]"
                  />
                  <span className="text-xs text-muted leading-relaxed">
                    <Link href="/privacy" target="_blank" className="text-accent hover:underline">
                      개인정보처리방침
                    </Link>
                    에 동의합니다 (필수)
                  </span>
                </label>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={ageAgreed}
                    onChange={(e) => setAgeAgreed(e.target.checked)}
                    disabled={loading}
                    className="mt-0.5 accent-[var(--accent)]"
                  />
                  <span className="text-xs text-muted leading-relaxed">
                    만 19세 이상입니다. (필수)
                  </span>
                  <p className="text-xs text-muted mt-1">서비스는 성인(만 19세 이상) 대상이에요</p>
                </label>
              </div>

              {error && (
                <p className="text-xs" style={{ color: "#d45040" }}>{error}</p>
              )}

              <button type="submit" disabled={!canSubmit} className="btn btn-primary mt-2">
                {loading ? "가입 중..." : "무료로 시작하기"}
              </button>
            </form>

            <div className="mt-4 text-center">
              <span className="text-xs text-muted">이미 계정이 있으신가요? </span>
              <Link href="/host" className="btn-quiet text-xs">
                로그인
              </Link>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
