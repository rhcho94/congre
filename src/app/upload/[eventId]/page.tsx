"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import Link from "next/link";
import { BrandName } from "@/components/BrandName";
import { useParams, useSearchParams } from "next/navigation";
import { checkS3, getPresignedUrl, uploadToS3 } from "@/lib/s3";
import CongreBadge from "@/components/CongreBadge";

type Stage = "verifying" | "invalid" | "uploader" | "idle" | "preview" | "uploading" | "done" | "error";

async function measureDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.preload = "metadata";
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(video.src);
      const d = video.duration;
      if (!Number.isFinite(d) || d <= 0) {
        reject(new Error("INVALID_DURATION"));
      } else {
        resolve(d);
      }
    };
    video.onerror = () => {
      URL.revokeObjectURL(video.src);
      reject(new Error("VIDEO_LOAD_ERROR"));
    };
    video.src = URL.createObjectURL(file);
  });
}

function UploadInner() {
  const { eventId } = useParams<{ eventId: string }>();
  const searchParams = useSearchParams();
  const urlToken = searchParams.get("token") ?? "";

  const [stage, setStage] = useState<Stage>("verifying");
  const [event, setEvent] = useState<{ id: string; title: string; maxClipSeconds?: number } | null>(null);
  const [progress, setProgress] = useState(0);
  const [retryNum, setRetryNum] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [uploaderError, setUploaderError] = useState("");
  const [isReturning, setIsReturning] = useState(false);
  const [s3Ready, setS3Ready] = useState<boolean | null>(null);

  const previewRef = useRef<HTMLVideoElement>(null);
  const blobRef = useRef<Blob | null>(null);
  const previewUrlRef = useRef<string>("");
  const durationRef = useRef<number>(0);

  // Verify token via server API (sessionToken never sent to client)
  useEffect(() => {
    let isMounted = true;
    async function verify() {
      if (!urlToken) {
        if (isMounted) setStage("invalid");
        return;
      }
      try {
        const res = await fetch(`/api/events/${eventId}?token=${encodeURIComponent(urlToken)}`);
        if (!isMounted) return;
        if (!res.ok) {
          setStage("invalid");
          return;
        }
        const evt = await res.json() as { id: string; title: string; maxClipSeconds?: number };
        setEvent(evt);
        setStage("uploader");
      } catch {
        if (isMounted) setStage("invalid");
      }
    }
    verify();
    return () => { isMounted = false; };
  }, [eventId, urlToken]);

  useEffect(() => {
    checkS3().then(setS3Ready);
  }, []);

  useEffect(() => {
    if (stage !== "uploader") return;
    const raw = sessionStorage.getItem(`congre-uploader-${eventId}`);
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as { name?: unknown; phone?: unknown };
        if (typeof parsed.name === "string" && typeof parsed.phone === "string") {
          setName(parsed.name);
          setPhone(parsed.phone);
          setIsReturning(true);
          return;
        }
      } catch {
        // 깨진 값 무시
      }
    }
    setIsReturning(false);
  }, [stage, eventId]);

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    };
  }, []);

  // stage가 "preview"로 바뀐 뒤 video 엘리먼트가 마운트되면 blob URL을 연결
  useEffect(() => {
    if (stage !== "preview") return;
    const video = previewRef.current;
    if (!video || !previewUrlRef.current) return;
    video.src = previewUrlRef.current;
    video.load();
  }, [stage]);

  async function handleUploaderNext() {
    const trimmedName = name.trim();
    const phoneClean = phone.replace(/\D/g, "");
    setUploaderError("");

    if (!trimmedName) {
      setUploaderError("이름을 입력해주세요");
      return;
    }
    if (trimmedName.length > 20) {
      setUploaderError("이름은 20자까지 입력할 수 있어요");
      return;
    }
    if (!/^010\d{8}$/.test(phoneClean)) {
      setUploaderError("전화번호는 010으로 시작하는 11자리 숫자로 입력해주세요");
      return;
    }

    try {
      const res = await fetch(
        `/api/clips/check?eventId=${encodeURIComponent(eventId)}&phone=${encodeURIComponent(phoneClean)}&name=${encodeURIComponent(trimmedName)}`
      );
      const data = await res.json() as { exists: boolean };
      if (data.exists) {
        setUploaderError("이전 영상과 다른 이름을 입력해주세요");
        return;
      }
      setName(trimmedName);
      setPhone(phoneClean);
      sessionStorage.setItem(`congre-uploader-${eventId}`, JSON.stringify({ name: trimmedName, phone: phoneClean }));
      setStage("idle");
    } catch {
      setUploaderError("확인 중 오류가 발생했습니다. 다시 시도해주세요.");
    }
  }

  async function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setErrorMsg("");
    try {
      const duration = await measureDuration(file);
      if (duration > 120) {
        setErrorMsg("영상이 너무 깁니다. 2분 이내로 촬영해주세요.");
        setStage("error");
        return;
      }
      durationRef.current = duration;
      blobRef.current = file;
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = URL.createObjectURL(file);
      setStage("preview");
    } catch {
      setErrorMsg("영상을 읽을 수 없습니다. 다시 촬영해주세요.");
      setStage("error");
    } finally {
      // 같은 파일 재선택 가능하도록 input value 리셋
      e.target.value = "";
    }
  }

  function reRecord() {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = "";
    }
    blobRef.current = null;
    setProgress(0);
    setRetryNum(0);
    setErrorMsg("");
    setUploaderError("");
    setStage("uploader");
    // name/phone state 유지 — useEffect가 sessionStorage에서 다시 채움
  }

  async function doUpload(attempt: number): Promise<void> {
    const blob = blobRef.current!;
    const rawType = blob.type.split(";")[0] || "video/mp4";

    let mimeType: string;
    let ext: string;
    if (rawType.includes("quicktime")) {
      mimeType = "video/quicktime";
      ext = "mov";
    } else if (rawType.includes("mp4")) {
      mimeType = "video/mp4";
      ext = "mp4";
    } else if (rawType.includes("webm")) {
      mimeType = "video/webm";
      ext = "webm";
    } else {
      // 알 수 없는 타입 — mp4로 기본 처리 (native capture 대부분 mp4/mov)
      mimeType = "video/mp4";
      ext = "mp4";
    }

    const fileName = `clip-${Date.now()}.${ext}`;

    console.log(`[upload] attempt=${attempt} blobType="${blob.type}" mimeType="${mimeType}" size=${blob.size} ext=${ext} duration=${durationRef.current}`);

    const { url, key } = await getPresignedUrl(eventId, fileName, mimeType, "clip");
    console.log(`[upload] presign ok → key=${key}`);

    await uploadToS3(url, blob, mimeType, setProgress);
    console.log(`[upload] S3 PUT success`);

    const clipSave = fetch("/api/clips", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        eventId,
        s3Key: key,
        token: urlToken,
        uploaderName: name,
        uploaderPhone: phone.replace(/\D/g, ""),
        duration: durationRef.current,
      }),
    });
    const clipTimeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("clip_save_timeout")), 5000)
    );
    try {
      const clipRes = await Promise.race([clipSave, clipTimeout]);
      if (!clipRes.ok) {
        const body = await clipRes.json().catch(() => ({})) as { error?: string };
        if (body.error === "DUPLICATE_UPLOADER") throw new Error("DUPLICATE_UPLOADER");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg === "DUPLICATE_UPLOADER") throw err;
      console.error("[clip] save skipped:", msg);
    }
  }

  async function handleUpload() {
    if (!blobRef.current) return;
    setStage("uploading");
    setProgress(0);
    setRetryNum(0);
    setErrorMsg("");

    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        if (attempt > 1) {
          setRetryNum(attempt - 1);
          setProgress(0);
          await new Promise((r) => setTimeout(r, 1000 * attempt));
        }
        await doUpload(attempt);
        setStage("done");
        return;
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error(`[upload] attempt=${attempt} FAILED:`, msg, err);
        if (msg === "DUPLICATE_UPLOADER") {
          setUploaderError("이전 영상과 다른 이름을 입력해주세요");
          setStage("uploader");
          return;
        }
        if (attempt === 3) {
          const display = msg.includes("S3_NOT_CONFIGURED")
            ? "S3가 연결되지 않아 업로드할 수 없습니다."
            : `업로드 실패: ${msg}`;
          setErrorMsg(display);
          setStage("error");
        }
      }
    }
  }

  const maxClipSeconds = event?.maxClipSeconds ?? 15;

  // ── verifying ──
  if (stage === "verifying") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center" style={{ maxWidth: "480px", margin: "0 auto" }}>
        <p className="text-xs tracking-widest uppercase text-muted animate-pulse">확인 중...</p>
      </div>
    );
  }

  // ── invalid ──
  if (stage === "invalid") {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 text-center gap-6" style={{ maxWidth: "480px", margin: "0 auto" }}>
        <div className="w-16 h-16 border border-border flex items-center justify-center">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-muted">
            <path d="M18 11V7a6 6 0 0 0-12 0v4" />
            <rect x="3" y="11" width="18" height="11" rx="1" />
          </svg>
        </div>
        <div>
          <p className="text-xl italic text-foreground mb-2" style={{ fontFamily: "var(--font-display, serif)" }}>
            마감된 이벤트입니다
          </p>
          <p className="text-sm text-muted leading-relaxed">업로드 기간이 종료되었습니다.</p>
        </div>
        <Link href="/" className="text-xs text-muted hover:text-accent tracking-widest uppercase transition-colors">
          홈으로
        </Link>
      </div>
    );
  }

  // ── idle / preview / uploading / done / error ──
  return (
    <div className="min-h-screen bg-background flex flex-col" style={{ maxWidth: "480px", margin: "0 auto" }}>
      {/* Header */}
      <header className="px-6 py-5 border-b border-border flex items-center justify-between">
        <Link
          href="/"
          className="text-xl tracking-wider hover:opacity-75 transition-opacity duration-200"
        >
          <BrandName />
        </Link>
      </header>

      {/* Event info */}
      <div className="px-6 pt-8 pb-4">
        <p className="text-xs tracking-[0.4em] uppercase text-accent mb-2">Event · #{eventId}</p>
        <h1 className="text-2xl italic text-foreground" style={{ fontFamily: "var(--font-display, serif)" }}>
          {event?.title ?? "이벤트"}
        </h1>
      </div>

      {/* S3 미연결 배너 */}
      {s3Ready === false && (
        <div className="mx-6 mt-2 p-3 border border-border bg-surface">
          <p className="text-xs text-accent font-medium tracking-wide mb-0.5">S3 미연결</p>
          <p className="text-xs text-muted leading-relaxed">
            .env.local에 AWS 설정값을 추가하면 실제 업로드가 가능합니다.
          </p>
        </div>
      )}

      <div className="rule mx-6 my-5" />

      <main className="flex-1 flex flex-col items-center px-6 py-4 gap-6">

        {/* ── uploader ── */}
        {stage === "uploader" && (
          <>
            <p className="text-sm text-center text-foreground leading-relaxed">
              {isReturning
                ? "다시 오셨네요. 이름과 전화번호를 확인해주세요. 같은 이름으로는 한 번만 올릴 수 있어요."
                : "이름과 전화번호를 입력해주세요. 결과 영상이 준비되면 문자로 알려드려요."}
            </p>
            <div className="w-full flex flex-col gap-3">
              <div className="relative">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => { setName(e.target.value.slice(0, 20)); setUploaderError(""); }}
                  onKeyDown={(e) => { if (e.key === "Enter") handleUploaderNext(); }}
                  placeholder="이름 (최대 20자)"
                  maxLength={20}
                  autoFocus
                  className="w-full bg-surface border border-border px-4 py-3 pr-14 text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-accent transition-colors"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted tabular-nums pointer-events-none">
                  {name.length}/20
                </span>
              </div>
              <input
                type="tel"
                inputMode="numeric"
                value={phone}
                onChange={(e) => { setPhone(e.target.value.slice(0, 13)); setUploaderError(""); }}
                onKeyDown={(e) => { if (e.key === "Enter") handleUploaderNext(); }}
                placeholder="010-1234-5678 또는 01012345678"
                maxLength={13}
                className="w-full bg-surface border border-border px-4 py-3 text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-accent transition-colors"
              />
              {uploaderError && (
                <p className="text-xs" style={{ color: "#e05252" }}>{uploaderError}</p>
              )}
              <p className="text-xs text-muted leading-relaxed opacity-70">
                같은 이름+전화번호로는 한 번만 올릴 수 있어요. 이름을 달리해서 여러 영상을 올릴 수 있어요.
              </p>
            </div>
            <button
              onClick={handleUploaderNext}
              disabled={!name.trim() || !phone.trim()}
              className="w-full py-4 bg-gradient-to-b from-[#f5b04a] to-[#a06f1f] text-background text-sm tracking-widest uppercase font-medium hover:brightness-110 transition-all duration-200 shadow-[inset_0_1px_0_rgba(255,255,255,0.2),0_4px_12px_rgba(0,0,0,0.4),0_0_40px_rgba(200,137,44,0.3)] hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.25),0_6px_16px_rgba(0,0,0,0.5),0_0_50px_rgba(200,137,44,0.4)] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:brightness-100"
            >
              다음
            </button>
          </>
        )}

        {/* ── idle ── */}
        {stage === "idle" && (
          <>
            <p className="text-sm text-center text-foreground leading-relaxed">
              소중한 순간을 영상으로 남겨주세요 📹
            </p>

            <label
              className="group relative w-full bg-surface hover:bg-[var(--surface-2)] border-2 border-border hover:border-accent transition-all duration-300 flex flex-col items-center justify-center gap-5 cursor-pointer"
              style={{ aspectRatio: "9 / 16", maxHeight: "58vh" }}
            >
              <input
                type="file"
                accept="video/*"
                capture="environment"
                className="sr-only"
                onChange={handleFileSelected}
              />
              {/* 모서리 프레임 */}
              <span className="absolute top-4 left-4 w-6 h-6 border-t-2 border-l-2 border-muted group-hover:border-accent transition-colors duration-300" />
              <span className="absolute top-4 right-4 w-6 h-6 border-t-2 border-r-2 border-muted group-hover:border-accent transition-colors duration-300" />
              <span className="absolute bottom-4 left-4 w-6 h-6 border-b-2 border-l-2 border-muted group-hover:border-accent transition-colors duration-300" />
              <span className="absolute bottom-4 right-4 w-6 h-6 border-b-2 border-r-2 border-muted group-hover:border-accent transition-colors duration-300" />

              {/* 카메라 아이콘 */}
              <div className="flex flex-col items-center gap-3">
                <div className="w-20 h-20 rounded-full border-2 border-muted group-hover:border-accent flex items-center justify-center transition-colors duration-300">
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
                    className="text-muted group-hover:text-accent transition-colors duration-300">
                    <path d="M23 7l-7 5 7 5V7z" />
                    <rect x="1" y="5" width="15" height="14" rx="2" />
                  </svg>
                </div>
                <p className="text-base tracking-widest uppercase font-medium text-muted group-hover:text-accent transition-colors duration-300">
                  지금 촬영하기
                </p>
                <p className="text-xs text-muted opacity-60">최대 {maxClipSeconds}초 · 탭하여 시작</p>
              </div>
            </label>

            <label className="text-xs text-muted hover:text-accent transition-colors duration-200 tracking-widest uppercase cursor-pointer">
              <input
                type="file"
                accept="video/*"
                className="sr-only"
                onChange={handleFileSelected}
              />
              갤러리에서 선택
            </label>

            <p className="text-xs text-center text-muted leading-relaxed opacity-70">
              AI가 모든 순간을 모아 하나의 영상으로 편집해드려요.
            </p>
          </>
        )}

        {/* ── preview (파일 선택 후 재생) ── */}
        {stage === "preview" && (
          <div className="w-full flex flex-col gap-5">
            <div
              className="relative w-full bg-black overflow-hidden"
              style={{ aspectRatio: "9 / 16", maxHeight: "54vh" }}
            >
              <span className="absolute top-3 left-3 w-5 h-5 border-t border-l border-border z-10" />
              <span className="absolute top-3 right-3 w-5 h-5 border-t border-r border-border z-10" />
              <span className="absolute bottom-3 left-3 w-5 h-5 border-b border-l border-border z-10" />
              <span className="absolute bottom-3 right-3 w-5 h-5 border-b border-r border-border z-10" />
              <video
                ref={previewRef}
                playsInline
                controls
                className="w-full h-full object-cover"
              />
            </div>

            <button
              onClick={handleUpload}
              disabled={s3Ready === false}
              className="w-full py-4 bg-gradient-to-b from-[#f5b04a] to-[#a06f1f] text-background text-sm tracking-widest uppercase font-medium hover:brightness-110 transition-all duration-200 shadow-[inset_0_1px_0_rgba(255,255,255,0.2),0_4px_12px_rgba(0,0,0,0.4),0_0_40px_rgba(200,137,44,0.3)] hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.25),0_6px_16px_rgba(0,0,0,0.5),0_0_50px_rgba(200,137,44,0.4)] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:brightness-100"
            >
              업로드하기
            </button>

            <button
              onClick={reRecord}
              className="text-xs text-center text-muted hover:text-accent transition-colors uppercase tracking-widest"
            >
              다시 촬영
            </button>
          </div>
        )}

        {/* ── uploading ── */}
        {stage === "uploading" && (
          <div className="w-full flex flex-col items-center gap-6 py-10">
            <p className="text-sm text-muted tracking-widest uppercase">
              {retryNum > 0 ? `재시도 중... (${retryNum}/3)` : "업로드 중..."}
            </p>
            <div className="w-full h-px bg-border relative overflow-hidden">
              <div
                className="absolute inset-y-0 left-0 bg-accent transition-all duration-150"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-xs text-muted tabular-nums">{progress}%</p>
          </div>
        )}

        {/* ── done ── */}
        {stage === "done" && (
          <div className="w-full flex flex-col items-center gap-6 text-center py-10">
            <div className="w-20 h-20 rounded-full border-2 border-accent flex items-center justify-center">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-accent">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <div>
              <p className="text-2xl italic text-foreground mb-3" style={{ fontFamily: "var(--font-display, serif)" }}>
                전달됐어요! 🎬
              </p>
              <p className="text-sm text-muted leading-relaxed">
                영상이 전달됐어요!
                <br />
                곧 편집된 영상을 받아보실 수 있어요.
              </p>
            </div>

            {/* 배지 미리보기 */}
            <div className="flex flex-col items-center gap-2">
              <CongreBadge />
              <p className="text-[10px] tracking-widest uppercase text-muted opacity-60">
                곧 Congre 배지가 담긴 편집 영상을 받아보실 수 있어요
              </p>
            </div>

            <button
              onClick={reRecord}
              className="px-6 py-3 border border-border text-muted text-xs tracking-widest uppercase hover:border-accent hover:text-foreground transition-all duration-200"
            >
              하나 더 올리기
            </button>
          </div>
        )}

        {/* ── error ── */}
        {stage === "error" && (
          <div className="w-full flex flex-col items-center gap-6 text-center py-10">
            <div className="w-16 h-16 border border-border flex items-center justify-center">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-muted">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </div>
            <div>
              <p className="text-base text-foreground mb-2">오류가 발생했습니다</p>
              <p className="text-sm text-muted leading-relaxed">{errorMsg}</p>
            </div>
            <div className="flex gap-4">
              {blobRef.current && (
                <button
                  onClick={handleUpload}
                  className="px-5 py-2.5 bg-gradient-to-b from-[#f5b04a] to-[#a06f1f] text-background text-xs tracking-widest uppercase hover:brightness-110 transition-all duration-200 shadow-[inset_0_1px_0_rgba(255,255,255,0.2),0_4px_12px_rgba(0,0,0,0.4),0_0_40px_rgba(200,137,44,0.3)] hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.25),0_6px_16px_rgba(0,0,0,0.5),0_0_50px_rgba(200,137,44,0.4)]"
                >
                  다시 시도
                </button>
              )}
              <button
                onClick={reRecord}
                className="px-5 py-2.5 border border-border text-muted text-xs tracking-widest uppercase hover:border-accent hover:text-foreground transition-all duration-200"
              >
                다시 촬영
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default function UploadPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center" style={{ maxWidth: "480px", margin: "0 auto" }}>
          <p className="text-xs tracking-widest uppercase text-muted animate-pulse">로딩 중...</p>
        </div>
      }
    >
      <UploadInner />
    </Suspense>
  );
}
