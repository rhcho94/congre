"use client";

import { useState, useEffect } from "react";
import { sendEmailVerification } from "firebase/auth";
import { getFirebaseAuth } from "@/lib/firebase";

export function EmailVerificationBanner() {
  const auth = getFirebaseAuth();
  const user = auth.currentUser;

  const [resendCooldown, setResendCooldown] = useState(0);
  const [resending, setResending] = useState(false);
  const [reloading, setReloading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  if (!user || user.emailVerified) return null;

  async function handleResend() {
    if (!user) return;
    setResending(true);
    setMessage(null);
    try {
      const actionCodeSettings = {
        url: `${process.env.NEXT_PUBLIC_APP_URL}/verify-email`,
        handleCodeInApp: false,
      };
      await sendEmailVerification(user, actionCodeSettings);
      setMessage("재발송했습니다.");
      setResendCooldown(60);
    } catch (err) {
      console.error("[email-banner] resend failed:", err);
      setMessage("재발송 실패. 잠시 후 다시 시도해 주세요.");
    } finally {
      setResending(false);
    }
  }

  async function handleReload() {
    if (!user) return;
    setReloading(true);
    setMessage(null);
    try {
      await user.reload();
      await user.getIdToken(true);
      if (!user.emailVerified) {
        setMessage("아직 인증되지 않았습니다. 메일을 확인해 주세요.");
      }
    } catch (err) {
      console.error("[email-banner] reload failed:", err);
    } finally {
      setReloading(false);
    }
  }

  const isError = message?.includes("실패") || message?.includes("아직");

  return (
    <div
      className="mb-8 p-5 bg-surface border-l-2"
      style={{ borderLeftColor: "var(--accent)" }}
    >
      <p className="text-sm text-foreground mb-1">이메일 인증이 필요합니다.</p>
      <p className="text-xs text-muted mb-4">
        받으신 메일에서 인증 링크를 클릭해 주세요.
      </p>
      {message && (
        <p
          className="text-xs mb-3"
          style={{ color: isError ? "#d45040" : "#5ba06e" }}
        >
          {message}
        </p>
      )}
      <div className="flex items-center gap-3">
        <button
          onClick={handleResend}
          disabled={resending || resendCooldown > 0}
          className="px-4 py-2 border border-border text-xs tracking-widest uppercase text-muted hover:border-accent hover:text-foreground transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {resendCooldown > 0
            ? `재발송 (${resendCooldown})`
            : resending
            ? "발송 중..."
            : "인증 메일 재발송"}
        </button>
        <button
          onClick={handleReload}
          disabled={reloading}
          className="px-4 py-2 border border-border text-xs tracking-widest uppercase text-muted hover:border-accent hover:text-foreground transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {reloading ? "확인 중..." : "인증 완료"}
        </button>
      </div>
    </div>
  );
}
