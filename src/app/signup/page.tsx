"use client";

import { useState } from "react";
import Link from "next/link";
import { BrandName } from "@/components/BrandName";
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const canSubmit = termsAgreed && privacyAgreed && !loading;

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
      const code = (err as { code?: string }).code ?? "";
      setError(getSignupErrorMessage(code));
    } finally {
      setLoading(false);
    }
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
        <Link
          href="/host"
          className="text-xs tracking-widest uppercase text-muted hover:text-accent transition-colors duration-200"
        >
          로그인
        </Link>
      </nav>

      <main className="mx-auto max-w-md px-6 py-16">
        <div className="relative isolate flex flex-col items-center">
          <div
            className="pointer-events-none absolute inset-0 opacity-25"
            style={{
              background: "radial-gradient(ellipse 100% 90% at 50% 50%, #c8892c 0%, transparent 70%)",
              zIndex: -1,
            }}
            aria-hidden
          />

          <div className="w-full">
            <p className="text-xs tracking-[0.4em] uppercase text-accent mb-4 text-center">Host</p>
            <h1
              className="text-3xl italic text-foreground text-center mb-10"
              style={{ fontFamily: "var(--font-display, serif)" }}
            >
              호스트 가입
            </h1>

            {!isFirebaseConfigured && (
              <div className="mb-6 p-4 border border-border bg-surface">
                <p className="text-xs text-accent mb-1 font-medium tracking-wide">Firebase 미연결</p>
                <p className="text-xs text-muted leading-relaxed">
                  .env.local에 Firebase 설정값을 추가하면 실제 가입이 가능합니다.
                </p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <label className="flex flex-col gap-1.5">
                <span className="text-xs tracking-widest uppercase text-muted">이메일</span>
                <input
                  type="email"
                  placeholder="host@congre.io"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                  className="bg-surface border border-border px-4 py-3 text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-accent transition-colors duration-200 disabled:opacity-50"
                />
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="text-xs tracking-widest uppercase text-muted">비밀번호</span>
                <input
                  type="password"
                  placeholder="6자 이상"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  disabled={loading}
                  className="bg-surface border border-border px-4 py-3 text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-accent transition-colors duration-200 disabled:opacity-50"
                />
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="text-xs tracking-widest uppercase text-muted">이름</span>
                <input
                  type="text"
                  placeholder="홍길동"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  disabled={loading}
                  className="bg-surface border border-border px-4 py-3 text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-accent transition-colors duration-200 disabled:opacity-50"
                />
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="text-xs tracking-widest uppercase text-muted">전화번호</span>
                <input
                  type="tel"
                  placeholder="01012345678"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  disabled={loading}
                  className="bg-surface border border-border px-4 py-3 text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-accent transition-colors duration-200 disabled:opacity-50"
                />
              </label>

              <div className="flex flex-col gap-2 pt-2">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={termsAgreed}
                    onChange={(e) => setTermsAgreed(e.target.checked)}
                    disabled={loading}
                    className="mt-0.5 accent-[#c8892c]"
                  />
                  <span className="text-xs text-muted leading-relaxed">
                    <Link
                      href="/terms"
                      target="_blank"
                      className="text-accent hover:underline"
                    >
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
                    className="mt-0.5 accent-[#c8892c]"
                  />
                  <span className="text-xs text-muted leading-relaxed">
                    <Link
                      href="/privacy"
                      target="_blank"
                      className="text-accent hover:underline"
                    >
                      개인정보처리방침
                    </Link>
                    에 동의합니다 (필수)
                  </span>
                </label>
              </div>

              {error && (
                <p className="text-xs" style={{ color: "#d45040" }}>{error}</p>
              )}

              <button
                type="submit"
                disabled={!canSubmit}
                className="mt-2 py-3.5 bg-gradient-to-b from-[#f5b04a] to-[#a06f1f] text-background text-sm tracking-widest uppercase font-medium hover:brightness-110 transition-all duration-200 shadow-[inset_0_1px_0_rgba(255,255,255,0.2),0_4px_12px_rgba(0,0,0,0.4),0_0_40px_rgba(200,137,44,0.3)] hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.25),0_6px_16px_rgba(0,0,0,0.5),0_0_50px_rgba(200,137,44,0.4)] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:brightness-100"
              >
                {loading ? "가입 중..." : "가입하기"}
              </button>
            </form>

            <div className="mt-4 text-center">
              <span className="text-xs text-muted">이미 계정이 있으신가요? </span>
              <Link
                href="/host"
                className="text-xs text-muted hover:text-accent transition-colors duration-200"
              >
                로그인
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
