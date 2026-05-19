"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { applyActionCode } from "firebase/auth";
import { getFirebaseAuth } from "@/lib/firebase";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const oobCode = searchParams.get("oobCode");

  const [status, setStatus] = useState<"verifying" | "success" | "error">("verifying");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const called = useRef(false);

  useEffect(() => {
    if (called.current) return;
    called.current = true;

    if (!oobCode) {
      setStatus("error");
      setErrorMessage("잘못된 접근입니다.");
      return;
    }

    const auth = getFirebaseAuth();
    applyActionCode(auth, oobCode)
      .then(() => {
        setStatus("success");
        setTimeout(() => router.push("/dashboard"), 2000);
      })
      .catch((err) => {
        console.error("[verify-email] applyActionCode failed:", err);
        const code = (err as { code?: string }).code ?? "";
        if (code === "auth/expired-action-code") {
          setErrorMessage("인증 링크가 만료되었습니다. 대시보드에서 재발송해 주세요.");
        } else if (code === "auth/invalid-action-code") {
          setErrorMessage("유효하지 않은 링크입니다. 대시보드에서 재발송해 주세요.");
        } else {
          setErrorMessage("인증 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.");
        }
        setStatus("error");
      });
  }, [oobCode, router]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6">
      <div
        className="w-full max-w-sm p-8 border border-border bg-surface text-center"
      >
        {status === "verifying" && (
          <p className="text-xs tracking-widest uppercase text-muted animate-pulse">
            인증 중...
          </p>
        )}

        {status === "success" && (
          <>
            <div className="flex items-center justify-center gap-2 mb-3">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                style={{ color: "var(--accent)" }}
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <p className="text-sm text-foreground">이메일 인증 완료</p>
            </div>
            <p className="text-xs text-muted">대시보드로 이동 중...</p>
          </>
        )}

        {status === "error" && (
          <>
            <p className="text-sm text-foreground mb-2">인증 실패</p>
            <p className="text-xs text-muted mb-6 leading-relaxed">{errorMessage}</p>
            <button
              onClick={() => router.push("/dashboard")}
              className="px-6 py-2.5 border border-border text-xs tracking-widest uppercase text-muted hover:border-accent hover:text-foreground transition-all duration-200"
            >
              대시보드로 이동
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <p className="text-xs tracking-widest uppercase text-muted animate-pulse">
            로딩 중...
          </p>
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
