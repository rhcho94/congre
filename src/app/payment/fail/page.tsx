"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import PageBackdrop from "@/components/PageBackdrop";

function PaymentFailContent() {
  const searchParams = useSearchParams();
  const code = searchParams.get("code");
  const message = searchParams.get("message");

  return (
    <>
      <PageBackdrop pattern="a" />
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="glass-panel w-full max-w-sm p-8 text-center">
          <p className="text-sm text-foreground mb-2">결제 실패</p>
          <p className="text-xs text-muted mb-6 leading-relaxed">
            {message ?? "결제가 진행되지 않았습니다."}
            {code && (
              <>
                <br />
                <span className="text-muted">오류 코드: {code}</span>
              </>
            )}
          </p>
          <Link href="/dashboard" className="btn btn-secondary">
            대시보드로 이동
          </Link>
        </div>
      </div>
    </>
  );
}

export default function Page() {
  return (
    <Suspense
      fallback={
        <>
          <PageBackdrop pattern="a" />
          <div className="min-h-screen flex items-center justify-center">
            <p className="eyebrow animate-pulse">로딩 중...</p>
          </div>
        </>
      }
    >
      <PaymentFailContent />
    </Suspense>
  );
}
