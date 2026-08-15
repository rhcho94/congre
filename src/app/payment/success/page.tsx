"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { getFirebaseAuth } from "@/lib/firebase";
import PageBackdrop from "@/components/PageBackdrop";

type Status =
  | "processing"
  | "success"
  | "renderFailed"
  | "clipCountChanged"
  | "orderNotPending"
  | "error";

interface ClipCountChangedInfo {
  savedCount: number;
  currentCount: number;
  newAmount: number;
}

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const called = useRef(false);

  const [status, setStatus] = useState<Status>("processing");
  const [eventId, setEventId] = useState<string | null>(null);
  const [clipCountInfo, setClipCountInfo] = useState<ClipCountChangedInfo | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (called.current) return;
    called.current = true;

    const orderId = searchParams.get("orderId");
    const paymentKey = searchParams.get("paymentKey");
    const amountStr = searchParams.get("amount");
    const amount = amountStr !== null ? Number(amountStr) : NaN;

    if (!orderId || !paymentKey || Number.isNaN(amount)) {
      setErrorCode("INVALID_REQUEST");
      setStatus("error");
      return;
    }

    (async () => {
      try {
        const auth = getFirebaseAuth();
        await auth.authStateReady();
        const idToken = await auth.currentUser?.getIdToken();
        if (!idToken) {
          setErrorCode("AUTH_FAILED");
          setErrorMsg("로그인 후 대시보드에서 결제 상태를 확인해 주세요.");
          setStatus("error");
          return;
        }

        const confirmRes = await fetch("/api/payment/confirm", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${idToken}`,
          },
          body: JSON.stringify({ paymentKey, orderId, amount }),
        });

        const confirmBody = await confirmRes.json().catch(() => ({})) as {
          ok?: boolean;
          eventId?: string;
          error?: string;
          code?: string;
          message?: string;
          savedCount?: number;
          currentCount?: number;
          newAmount?: number;
        };

        if (!confirmRes.ok) {
          const code = confirmBody?.error ?? confirmBody?.code ?? "UNKNOWN";
          const msg = confirmBody?.message;

          if (confirmRes.status === 409 && code === "CLIP_COUNT_CHANGED") {
            setClipCountInfo({
              savedCount: confirmBody.savedCount ?? 0,
              currentCount: confirmBody.currentCount ?? 0,
              newAmount: confirmBody.newAmount ?? 0,
            });
            setStatus("clipCountChanged");
            return;
          }

          if (confirmRes.status === 400 && code === "ORDER_NOT_PENDING") {
            setStatus("orderNotPending");
            return;
          }

          setErrorCode(code);
          setErrorMsg(msg ?? null);
          setStatus("error");
          return;
        }

        const confirmedEventId = confirmBody.eventId;
        if (!confirmedEventId) {
          setErrorCode("MISSING_EVENT_ID");
          setStatus("error");
          return;
        }
        setEventId(confirmedEventId);

        const renderRes = await fetch("/api/render/start", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${idToken}`,
          },
          body: JSON.stringify({ eventId: confirmedEventId }),
        });

        if (!renderRes.ok) {
          setStatus("renderFailed");
          return;
        }

        setStatus("success");
        setTimeout(() => router.push(`/dashboard/events/${confirmedEventId}`), 2000);
      } catch (err) {
        console.error("[payment/success] confirm flow failed:", err);
        setErrorCode("NETWORK_ERROR");
        setStatus("error");
      }
    })();
  }, [searchParams, router]);

  return (
    <>
      <PageBackdrop pattern="a" />
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="glass-panel w-full max-w-sm p-8 text-center">
          {status === "processing" && (
            <p className="eyebrow animate-pulse">결제 확인 중...</p>
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
                <p className="text-sm text-foreground">결제 완료</p>
              </div>
              <p className="text-xs text-muted">영상 생성이 시작됐습니다. 이벤트로 이동 중...</p>
            </>
          )}

          {status === "renderFailed" && eventId && (
            <>
              <p className="text-sm text-foreground mb-2">결제는 완료됐습니다</p>
              <p className="text-xs text-muted mb-6 leading-relaxed">
                다만 영상 생성 시작에는 실패했습니다. 이벤트 페이지의 [영상 생성 다시 시작] 버튼으로 다시 시도해 주세요.
              </p>
              <Link href={`/dashboard/events/${eventId}`} className="btn btn-primary">
                이벤트로 이동
              </Link>
            </>
          )}

          {status === "clipCountChanged" && clipCountInfo && (
            <>
              <p className="text-sm text-foreground mb-2">클립 수가 바뀌어 금액이 달라졌습니다</p>
              <p className="text-xs text-muted mb-6 leading-relaxed">
                결제 준비 시점 {clipCountInfo.savedCount}개 → 현재 {clipCountInfo.currentCount}개로 바뀌어
                결제가 진행되지 않았습니다. 새 금액은 {clipCountInfo.newAmount.toLocaleString("ko-KR")}원입니다.
                대시보드에서 다시 결제를 진행해 주세요.
              </p>
              <Link href="/dashboard" className="btn btn-secondary">
                대시보드로 이동
              </Link>
            </>
          )}

          {status === "orderNotPending" && (
            <>
              <p className="text-sm text-foreground mb-2">이미 처리된 결제입니다</p>
              <p className="text-xs text-muted mb-6 leading-relaxed">
                이 주문은 이미 처리되었습니다. 대시보드에서 상태를 확인해 주세요.
              </p>
              <Link href="/dashboard" className="btn btn-secondary">
                대시보드로 이동
              </Link>
            </>
          )}

          {status === "error" && (
            <>
              <p className="text-sm text-foreground mb-2">결제 확인 실패</p>
              <p className="text-xs text-muted mb-6 leading-relaxed">
                {errorMsg ?? "결제 확인 중 오류가 발생했습니다."}
                <br />
                <span className="text-muted">오류 코드: {errorCode ?? "UNKNOWN"}</span>
                <br />
                잠시 후 다시 시도하거나 운영자에게 문의해 주세요.
              </p>
              <Link href="/dashboard" className="btn btn-secondary">
                대시보드로 이동
              </Link>
            </>
          )}
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
      <PaymentSuccessContent />
    </Suspense>
  );
}
