"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { loadTossPayments, ANONYMOUS, type TossPaymentsWidgets } from "@tosspayments/tosspayments-sdk";
import { subscribeToAuthChanges, type User } from "@/lib/auth";
import { isFirebaseConfigured, getFirebaseAuth } from "@/lib/firebase";
import PageBackdrop from "@/components/PageBackdrop";
import AppHeader from "@/components/AppHeader";

interface PrepareResponse {
  orderId: string;
  amount: number;
  rawAmount: number;
  clipCount: number;
  orderName: string;
  maxClipSeconds: number;
  title: string | null;
  mode?: "first" | "rerender";
  firstAmount?: number;
}

const prepareErrorMessages: Record<string, string> = {
  NOT_PAID_PLAN: "무료 이벤트는 결제가 필요하지 않습니다.",
  ALREADY_UNLOCKED: "이미 결제가 완료된 이벤트입니다.",
  EVENT_NOT_OPEN: "이미 마감된 이벤트입니다.",
  NO_CLIPS: "업로드된 영상이 없어 결제할 수 없습니다.",
  FORBIDDEN: "이 이벤트에 접근할 권한이 없습니다.",
  EVENT_NOT_FOUND: "이벤트를 찾을 수 없습니다.",
  INVALID_EVENT_STATE: "지금은 결제를 진행할 수 없는 상태예요.",
  MISSING_FIRST_AMOUNT: "이 이벤트는 재편집 결제를 지원하지 않아요.",
};

export default function PaymentPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [authChecking, setAuthChecking] = useState(isFirebaseConfigured);
  const [prepared, setPrepared] = useState<PrepareResponse | null>(null);
  const [preparing, setPreparing] = useState(true);
  const [prepareError, setPrepareError] = useState<string | null>(null);
  const [agreed, setAgreed] = useState(false);
  const [widgetReady, setWidgetReady] = useState(false);
  const [widgetError, setWidgetError] = useState<string | null>(null);
  const [paying, setPaying] = useState(false);
  const preparedOnceRef = useRef(false);
  const widgetsRef = useRef<TossPaymentsWidgets | null>(null);

  useEffect(() => {
    if (!isFirebaseConfigured) return;
    return subscribeToAuthChanges((firebaseUser) => {
      setUser(firebaseUser);
      setAuthChecking(false);
      if (!firebaseUser) router.push("/host");
    });
  }, [router]);

  useEffect(() => {
    if (!eventId || !user) return;
    if (preparedOnceRef.current) return;
    preparedOnceRef.current = true;

    (async () => {
      try {
        const idToken = await getFirebaseAuth().currentUser?.getIdToken();
        if (!idToken) {
          setPrepareError("인증 토큰 발급에 실패했습니다. 다시 로그인해주세요.");
          setPreparing(false);
          return;
        }
        const res = await fetch("/api/payment/prepare", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${idToken}` },
          body: JSON.stringify({ eventId }),
        });
        if (!res.ok) {
          const errBody = await res.json().catch(() => ({})) as { error?: string };
          const code = errBody.error;
          setPrepareError(
            code && prepareErrorMessages[code]
              ? prepareErrorMessages[code]
              : `결제 준비 중 오류가 발생했습니다 (${code ?? res.status}). 운영자에게 문의해주세요.`
          );
          setPreparing(false);
          return;
        }
        const data = await res.json() as PrepareResponse;
        setPrepared(data);
        setPreparing(false);
      } catch (err) {
        console.error("[payment] prepare failed:", err);
        setPrepareError("결제 준비 중 오류가 발생했습니다. 운영자에게 문의해주세요.");
        setPreparing(false);
      }
    })();
  }, [eventId, user]);

  useEffect(() => {
    if (!prepared) return;
    let cancelled = false;

    (async () => {
      try {
        const clientKey = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY;
        if (!clientKey) {
          console.error("[payment] NEXT_PUBLIC_TOSS_CLIENT_KEY missing");
          setWidgetError("결제 설정 오류로 결제 위젯을 불러오지 못했습니다. 운영자에게 문의해주세요.");
          return;
        }
        const tossPayments = await loadTossPayments(clientKey);
        if (cancelled) return;
        const widgets = tossPayments.widgets({ customerKey: ANONYMOUS });
        widgetsRef.current = widgets;
        await widgets.setAmount({ currency: "KRW", value: prepared.amount });
        if (cancelled) return;
        await widgets.renderPaymentMethods({ selector: "#toss-payment-method" });
        if (cancelled) return;
        await widgets.renderAgreement({ selector: "#toss-agreement" });
        if (!cancelled) setWidgetReady(true);
      } catch (err) {
        console.error("[payment] widget init failed:", err);
        if (!cancelled) setWidgetError("결제 위젯을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [prepared]);

  async function handlePay() {
    if (!prepared || !widgetsRef.current || !agreed) return;
    setPaying(true);
    try {
      await widgetsRef.current.requestPayment({
        orderId: prepared.orderId,
        orderName: prepared.orderName,
        successUrl: `${window.location.origin}/payment/success`,
        failUrl: `${window.location.origin}/payment/fail`,
      });
    } catch (err) {
      console.error("[payment] requestPayment failed:", err);
      alert("결제 요청 중 오류가 발생했습니다.");
      setPaying(false);
    }
  }

  if (!isFirebaseConfigured) {
    return (
      <>
        <PageBackdrop pattern="a" />
        <div className="min-h-screen flex items-center justify-center px-6">
          <div className="glass-panel max-w-sm w-full p-8 text-center">
            <p className="text-xs text-accent font-medium tracking-wide mb-2">Firebase 미연결</p>
            <p className="text-xs text-muted leading-relaxed mb-4">
              .env.local에 Firebase 설정값을 추가하면 결제를 진행할 수 있습니다.
            </p>
            <Link href="/host" className="btn-quiet text-xs tracking-widest uppercase">
              ← 로그인 페이지
            </Link>
          </div>
        </div>
      </>
    );
  }

  if (authChecking || preparing) {
    return (
      <>
        <PageBackdrop pattern="a" />
        <div className="min-h-screen flex items-center justify-center">
          <p className="eyebrow animate-pulse">결제 준비 중...</p>
        </div>
      </>
    );
  }

  if (prepareError) {
    return (
      <>
        <PageBackdrop pattern="a" />
        <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-6">
          <p className="text-muted text-sm text-center">{prepareError}</p>
          <Link href={`/dashboard/events/${eventId}`} className="btn-quiet text-xs tracking-widest uppercase text-accent">
            ← 이벤트로 돌아가기
          </Link>
        </div>
      </>
    );
  }

  if (!prepared) {
    return null;
  }

  return (
    <>
      <PageBackdrop pattern="a" />
      <div className="min-h-screen">
        <AppHeader>
          <div className="flex items-center gap-3 sm:gap-4">
            <Link href={`/dashboard/events/${eventId}`} className="btn-quiet text-xs tracking-widest uppercase whitespace-nowrap">
              ← 이벤트로 돌아가기
            </Link>
          </div>
        </AppHeader>

        <main className="mx-auto max-w-lg px-6 py-16">
          <div className="glass-panel p-10">
            <p className="eyebrow mb-4">Payment</p>
            <h1 className="display text-3xl mb-2">결제하기</h1>
            <p className="text-sm text-muted mb-8">{prepared.title}</p>

            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/og-image.png"
              alt="Congre"
              className="w-full mb-6"
              style={{ borderRadius: "var(--r-sm)" }}
            />

            <p className="display text-xl mb-2">{prepared.orderName}</p>

            {prepared.clipCount === 0 && (
              <div className="notice mb-6">
                <p className="text-sm text-muted leading-relaxed">
                  ⚠️ 아직 업로드된 영상이 없습니다. 이 상태로 결제하면 제작할 영상이 없습니다. 결제 후 4시간 이내에는 환불이 제한됩니다.
                </p>
              </div>
            )}

            <div className="notice mb-8">
              <p className="text-sm text-muted leading-relaxed whitespace-pre-line">
                {`행사 참가자들이 올린 영상을 자동으로 편집해 완성본 1편으로 만들어 드립니다.

· 워터마크 없음
· 다운로드 가능
· 우선 처리

결제 금액은 마감 시점에 올라온 영상 수로 계산됩니다 (최소 10,000원).
결제는 이벤트당 1회입니다.`}
              </p>
            </div>

            <div className="mb-8">
              {prepared.mode === "rerender" ? (
                <p className="text-xs text-muted mb-2">
                  처음 결제 금액 {(prepared.firstAmount ?? 0).toLocaleString("ko-KR")}원의 80%
                </p>
              ) : (
                <>
                  <p className="text-xs text-muted mb-2">
                    영상 길이 {prepared.maxClipSeconds}초 × 영상 {prepared.clipCount}개 × 100원 = {prepared.rawAmount.toLocaleString("ko-KR")}원
                  </p>
                  {prepared.rawAmount !== prepared.amount && (
                    <p className="text-xs text-muted mb-2">
                      → 최소 결제 금액 {prepared.amount.toLocaleString("ko-KR")}원 적용
                    </p>
                  )}
                </>
              )}
              <p className="display text-3xl" style={{ color: "var(--accent)" }}>
                {prepared.amount.toLocaleString("ko-KR")}원
              </p>
            </div>

            <div id="toss-payment-method" className="mb-4" />
            <div id="toss-agreement" className="mb-6" />

            {widgetError && (
              <p className="text-sm mb-4" style={{ color: "#e05252" }}>
                {widgetError}
              </p>
            )}

            <label className="flex items-start gap-3 cursor-pointer mb-6">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                disabled={paying}
                className="mt-0.5 accent-[var(--accent)]"
              />
              <span className="text-xs text-muted leading-relaxed">
                디지털 콘텐츠 특성상 영상 제작이 시작된 뒤에는 청약철회가 제한됩니다. 이에 동의합니다.
              </span>
            </label>

            <button
              onClick={handlePay}
              disabled={!agreed || !widgetReady || paying}
              className="btn btn-primary w-full"
            >
              {paying ? "결제 진행 중..." : `${prepared.amount.toLocaleString("ko-KR")}원 결제하기`}
            </button>
          </div>
        </main>
      </div>
    </>
  );
}
