"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { QRCodeSVG, QRCodeCanvas } from "qrcode.react";
import { Play, X, Loader2 } from "lucide-react";
import { subscribeToAuthChanges, type User } from "@/lib/auth";
import {
  getEvent,
  closeEvent,
  subscribeToClips,
  type CongreEvent,
  type Clip,
} from "@/lib/events";
import { isFirebaseConfigured } from "@/lib/firebase";
import { getClipPlaybackUrl } from "@/lib/clip-playback";
import CongreBadge from "@/components/CongreBadge";
import { BrandName } from "@/components/BrandName";
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

interface KakaoInstance {
  init: (key: string) => void;
  isInitialized: () => boolean;
  Share: { sendDefault: (opts: Record<string, unknown>) => void };
}

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
  const [activeClipId, setActiveClipId] = useState<string | null>(null);
  const [playbackUrl, setPlaybackUrl] = useState<string | null>(null);
  const [playbackLoading, setPlaybackLoading] = useState(false);
  const [playbackError, setPlaybackError] = useState<string | null>(null);
  const [instaCopied, setInstaCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [kakaoReady, setKakaoReady] = useState(false);
  const qrHiResRef = useRef<HTMLDivElement>(null);

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
    let isMounted = true;
    getEvent(eventId).then((evt) => {
      if (!isMounted) return;
      // Only show event to its host
      if (evt && user && evt.hostId !== user.uid) {
        setEventLoading(false);
        return; // event stays null → "not found" UI
      }
      setEvent(evt);
      setEventLoading(false);
      // uploadToken은 마감 후에도 보존 → sessionToken이 null이어도 QR 복원 가능
      const token = evt?.uploadToken ?? evt?.sessionToken;
      if (token) {
        setShareUrl(`${window.location.origin}/upload/${eventId}?token=${token}`);
      }
    });
    return () => { isMounted = false; };
  }, [eventId, user]);

  useEffect(() => {
    if (!eventId) return;
    return subscribeToClips(eventId, setClips);
  }, [eventId]);

  async function handleCopy() {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      alert("링크 복사에 실패했습니다.");
    }
  }

  const handlePlayClip = useCallback(async (clip: Clip) => {
    if (activeClipId === clip.id) {
      setActiveClipId(null);
      setPlaybackUrl(null);
      setPlaybackError(null);
      return;
    }
    setActiveClipId(clip.id);
    setPlaybackUrl(null);
    setPlaybackError(null);
    setPlaybackLoading(true);
    try {
      const { url } = await getClipPlaybackUrl(clip.id);
      setPlaybackUrl(url);
    } catch (err) {
      setPlaybackError(err instanceof Error ? err.message : "재생 URL 발급 실패");
    } finally {
      setPlaybackLoading(false);
    }
  }, [activeClipId]);

  // Kakao SDK 동적 로드
  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_KAKAO_APP_KEY;
    if (!key) return;
    const win = window as Window & { Kakao?: KakaoInstance };
    if (win.Kakao?.isInitialized()) { setKakaoReady(true); return; }
    const script = document.createElement("script");
    script.src = "https://developers.kakao.com/sdk/js/kakao.min.js";
    script.async = true;
    script.onload = () => {
      const K = (window as Window & { Kakao?: KakaoInstance }).Kakao;
      if (K && !K.isInitialized()) { K.init(key); setKakaoReady(true); }
    };
    document.head.appendChild(script);
    return () => { script.remove(); };
  }, []);

  function handleInstagramShare() {
    if (!event?.videoUrl) return;
    const isMobile = /iPhone|Android|iPad/i.test(navigator.userAgent);
    if (isMobile) {
      window.location.href = "instagram://story-camera";
    } else {
      navigator.clipboard.writeText(event.videoUrl).then(() => {
        setInstaCopied(true);
        setTimeout(() => setInstaCopied(false), 3500);
      }).catch(() => {});
    }
  }

  function handleKakaoShare() {
    if (!event?.videoUrl) return;
    const K = (window as Window & { Kakao?: KakaoInstance }).Kakao;
    if (!K?.Share) {
      navigator.clipboard.writeText(event.videoUrl).catch(() => {});
      alert("카카오톡 앱키가 설정되지 않았습니다. 링크가 복사되었습니다.");
      return;
    }
    try {
      K.Share.sendDefault({
        objectType: "feed",
        content: {
          title: event.title,
          description: "Congre로 만든 영상입니다 🎬",
          imageUrl: event.videoUrl,
          link: { mobileWebUrl: event.videoUrl, webUrl: event.videoUrl },
        },
      });
    } catch {
      navigator.clipboard.writeText(event.videoUrl).catch(() => {});
      alert("카카오톡 공유에 실패했습니다. 링크가 복사되었습니다.");
    }
  }

  async function handleLinkCopy() {
    if (!event?.videoUrl) return;
    try {
      await navigator.clipboard.writeText(event.videoUrl);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch {
      alert("링크 복사에 실패했습니다.");
    }
  }

  function handleQRDownload() {
    const canvas = qrHiResRef.current?.querySelector("canvas") as HTMLCanvasElement | null;
    if (!canvas || !event) return;
    const link = document.createElement("a");
    link.download = `congre-qr-${event.title.replace(/[^\w가-힣]/g, "-")}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  }

  async function handleClose() {
    setClosing(true);
    try {
      await closeEvent(eventId);
      setShowCloseModal(false);

      if (clips.length > 0 && event) {
        // render/start now updates Firestore (status, renderId, deadlineAt) server-side
        await fetch("/api/render/start", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            eventId,
            s3Keys: clips.map((c) => c.s3Key),
            eventTitle: event.title,
          }),
        });
      }

      const updated = await getEvent(eventId);
      setEvent(updated);
    } catch {
      alert("마감 처리 중 오류가 발생했습니다.");
    } finally {
      setClosing(false);
    }
  }

  // 30초마다 Shotstack 렌더 상태 폴링
  const renderingRenderId =
    event?.status === "rendering" ? (event.renderId ?? null) : null;

  useEffect(() => {
    if (!renderingRenderId) return;
    const capturedId = renderingRenderId;

    async function poll() {
      try {
        const res = await fetch(`/api/render/status?renderId=${capturedId}`);
        if (!res.ok) return;
        const { status, url } = await res.json() as { status: string; url?: string };
        if (status === "done" && url) {
          await fetch("/api/render/complete", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ eventId, status: "done", url }),
          });
          const updated = await getEvent(eventId);
          setEvent(updated);
        } else if (status === "failed") {
          await fetch("/api/render/complete", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ eventId, status: "failed" }),
          });
          const updated = await getEvent(eventId);
          setEvent(updated);
        }
      } catch {
        // 폴링 오류는 무시 — 다음 주기에 재시도
      }
    }

    poll();
    const timer = setInterval(poll, 30000);
    return () => clearInterval(timer);
  }, [renderingRenderId, eventId]);

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
          className="text-xl tracking-wider hover:opacity-75 transition-opacity duration-200"
        >
          <BrandName />
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

        {/* QR 코드 & 공유 링크 — 수집중(open)일 때만 표시 */}
        {event.status === "open" && shareUrl && (
          <div className="mb-8 w-full overflow-hidden">
            <p className="text-xs tracking-widest uppercase text-muted mb-4">참가자 초대</p>
            <div className="flex flex-col sm:flex-row gap-6 p-6 border border-border bg-surface">
              <div className="shrink-0 flex flex-col items-center gap-2">
                <QRCodeSVG
                  value={shareUrl}
                  size={140}
                  bgColor="#151310"
                  fgColor="#ede8df"
                  level="M"
                />
                <button
                  onClick={handleQRDownload}
                  className="px-3 py-1.5 border border-border text-xs text-foreground hover:border-accent hover:text-accent transition-all duration-200"
                >
                  QR 이미지 저장
                </button>
              </div>
              <div className="flex-1 min-w-0 flex flex-col justify-center gap-3">
                <p className="text-xs text-muted leading-relaxed">
                  QR코드를 스캔하거나 링크를 공유하세요.
                </p>
                <div className="flex items-center gap-2">
                  <span className="flex-1 min-w-0 text-xs text-foreground bg-[var(--surface-2)] border border-border px-3 py-2 truncate font-mono">
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
        )}

        {/* 렌더링 / 완성 상태 */}
        {event.status === "rendering" ? (
          <div className="mb-8 p-5 border border-border bg-surface">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-2 h-2 rounded-full bg-[#7b8ce0] animate-pulse" />
              <p className="text-sm text-muted">AI가 영상을 편집하고 있습니다...</p>
            </div>
            <p className="text-xs text-muted opacity-60 pl-5">
              3~5분 소요 · 30초마다 상태 확인 중
            </p>
          </div>
        ) : event.status === "done" ? (
          <div className="mb-8">
            {event.videoUrl ? (
              <div className="border border-border bg-surface p-5 flex flex-col gap-4">
                <div className="flex items-center gap-2">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#5ba06e" strokeWidth="1.5">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <p className="text-xs tracking-widest uppercase" style={{ color: "#5ba06e" }}>
                    편집 완료
                  </p>
                </div>
                {/* 배지 미리보기 */}
                <div className="flex flex-col items-center gap-2 py-1">
                  <CongreBadge />
                  <p className="text-[10px] tracking-widest uppercase text-muted opacity-60">
                    공유 시 이 배지가 함께 표시됩니다
                  </p>
                </div>

                <video
                  src={event.videoUrl}
                  controls
                  playsInline
                  className="w-full max-w-xs mx-auto"
                  style={{ aspectRatio: "9/16", background: "#0c0b09" }}
                />
                <a
                  href={event.videoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 bg-accent text-background text-xs tracking-widest uppercase font-medium text-center hover:brightness-110 transition-all duration-200 glow-accent block"
                >
                  영상 다운로드 →
                </a>

                {/* SNS 공유 */}
                <div className="pt-3 border-t border-border">
                  <p className="text-xs tracking-widest uppercase text-muted mb-3">공유하기</p>
                  <div className="grid grid-cols-3 gap-2">
                    {/* 인스타그램 */}
                    <button
                      onClick={handleInstagramShare}
                      className="flex flex-col items-center gap-1.5 py-3 text-xs font-medium transition-all duration-200 hover:brightness-110 active:scale-95"
                      style={{ background: "linear-gradient(135deg,#f09433 0%,#e6683c 25%,#dc2743 50%,#cc2366 75%,#bc1888 100%)" }}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5">
                        <rect x="2" y="2" width="20" height="20" rx="5" />
                        <circle cx="12" cy="12" r="4" />
                        <circle cx="17.5" cy="6.5" r="1" fill="white" stroke="none" />
                      </svg>
                      <span className="text-white leading-tight text-center">
                        {instaCopied ? "복사됨!" : "인스타그램"}
                      </span>
                    </button>

                    {/* 카카오톡 */}
                    <button
                      onClick={handleKakaoShare}
                      disabled={Boolean(process.env.NEXT_PUBLIC_KAKAO_APP_KEY) && !kakaoReady}
                      className="flex flex-col items-center gap-1.5 py-3 text-xs font-medium transition-all duration-200 hover:brightness-95 active:scale-95 disabled:opacity-50"
                      style={{ background: "#FEE500" }}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="#3C1E1E">
                        <path d="M12 3C6.48 3 2 6.69 2 11.25c0 2.87 1.7 5.39 4.31 6.95L5.25 21l3.96-2.12A12.2 12.2 0 0 0 12 19.5c5.52 0 10-3.69 10-8.25S17.52 3 12 3z" />
                      </svg>
                      <span style={{ color: "#3C1E1E" }}>카카오톡</span>
                    </button>

                    {/* 링크 복사 */}
                    <button
                      onClick={handleLinkCopy}
                      className="flex flex-col items-center gap-1.5 py-3 border border-border bg-surface text-muted text-xs hover:border-accent hover:text-foreground transition-all duration-200 active:scale-95"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                      </svg>
                      <span>{linkCopied ? "복사됨!" : "링크 복사"}</span>
                    </button>
                  </div>

                  {instaCopied && (
                    <p className="text-xs text-muted mt-2 text-center leading-relaxed">
                      링크가 복사됐습니다. 인스타그램 앱에서 스토리에 붙여넣기 하세요.
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-4 border border-border bg-surface flex items-center gap-3">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#5ba06e" strokeWidth="1.5">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <p className="text-sm" style={{ color: "#5ba06e" }}>편집이 완료되었습니다</p>
              </div>
            )}
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
              {clips.map((clip, i) => {
                const isActive = activeClipId === clip.id;
                return (
                  <div key={clip.id} className="flex flex-col bg-surface">
                    {/* 클립 행 */}
                    <div className="flex items-center justify-between px-5 py-4">
                      <span className="text-xs text-muted tabular-nums shrink-0">
                        #{clips.length - i}
                      </span>
                      <span className="text-xs text-muted font-mono truncate mx-4 flex-1">
                        {clip.s3Key.split("/").pop()}
                      </span>
                      <span className="text-xs text-muted shrink-0 mr-3">
                        {formatUploadTime(clip.uploadedAt)}
                      </span>
                      <button
                        onClick={() => handlePlayClip(clip)}
                        className="shrink-0 flex items-center gap-1 px-2.5 py-1.5 border text-xs tracking-widest uppercase transition-all duration-200"
                        style={
                          isActive
                            ? { borderColor: "var(--accent)", color: "var(--accent)" }
                            : { borderColor: "var(--border)", color: "var(--muted)" }
                        }
                        aria-label={isActive ? "닫기" : "재생"}
                      >
                        {isActive ? (
                          <X size={11} strokeWidth={2} />
                        ) : (
                          <Play size={11} strokeWidth={2} />
                        )}
                      </button>
                    </div>

                    {/* 인라인 플레이어 */}
                    {isActive && (
                      <div className="px-5 pb-5">
                        {playbackLoading && (
                          <div className="flex items-center gap-2 py-4">
                            <Loader2 size={14} className="animate-spin text-accent" />
                            <span className="text-xs text-muted">재생 URL 발급 중...</span>
                          </div>
                        )}
                        {playbackError && (
                          <p className="text-xs py-3" style={{ color: "#e05252" }}>
                            {playbackError}
                          </p>
                        )}
                        {playbackUrl && (
                          <video
                            src={playbackUrl}
                            controls
                            playsInline
                            autoPlay
                            className="w-full max-w-xs mx-auto block rounded"
                            style={{ aspectRatio: "9/16", background: "var(--surface)" }}
                          />
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* 고해상도 QR 다운로드용 히든 캔버스 (512×512, 흰 배경) */}
      {shareUrl && (
        <div
          ref={qrHiResRef}
          aria-hidden="true"
          style={{ position: "fixed", left: "-9999px", top: 0 }}
        >
          <QRCodeCanvas
            value={shareUrl}
            size={512}
            bgColor="#ffffff"
            fgColor="#151310"
            level="H"
          />
        </div>
      )}
    </div>
  );
}
