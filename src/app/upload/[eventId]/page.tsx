"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import { BrandName } from "@/components/BrandName";
import { LANDING_URL } from "@/lib/constants";
import PageBackdrop from "@/components/PageBackdrop";
import { useParams, useSearchParams } from "next/navigation";
import { checkS3, getPresignedUrl, uploadToS3 } from "@/lib/s3";
import CongreBadge from "@/components/CongreBadge";
import { isIOS } from "@/lib/device";

type Stage = "verifying" | "invalid" | "uploader" | "idle" | "preview" | "uploading" | "done" | "error";

// 게스트 화면 텍스트는 솔리드 카드 없이 사진 위에 직접 — 가독성 위해 국소 스크림 적용
const scrim: React.CSSProperties = {
  background: "linear-gradient(180deg, rgba(12,11,9,0.55), rgba(12,11,9,0.75))",
  borderRadius: "var(--r-md)",
  padding: "16px 18px",
};

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
  const [event, setEvent] = useState<{ id: string; title: string; maxClipSeconds?: number; hostName?: string | null } | null>(null);
  const [progress, setProgress] = useState(0);
  const [retryNum, setRetryNum] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [uploaderError, setUploaderError] = useState("");
  const [isReturning, setIsReturning] = useState(false);
  const [s3Ready, setS3Ready] = useState<boolean | null>(null);
  const [iosDevice, setIosDevice] = useState(false);

  const previewRef = useRef<HTMLVideoElement>(null);
  const blobRef = useRef<Blob | null>(null);
  const previewUrlRef = useRef<string>("");
  const durationRef = useRef<number>(0);

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
        const evt = await res.json() as { id: string; title: string; maxClipSeconds?: number; hostName?: string | null };
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

  useEffect(() => { setIosDevice(isIOS()); }, []);

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
        const body = await clipRes.json().catch(() => ({})) as { error?: string; code?: string; limit?: number; current?: number };
        if (body.error === "DUPLICATE_UPLOADER") throw new Error("DUPLICATE_UPLOADER");
        if (body.code === "PLAN_LIMIT_REACHED") {
          throw new Error(`PLAN_LIMIT_REACHED:${body.current ?? 0}:${body.limit ?? 0}`);
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg === "DUPLICATE_UPLOADER") throw err;
      if (msg.startsWith("PLAN_LIMIT_REACHED:")) throw err;
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
        if (msg.startsWith("PLAN_LIMIT_REACHED:")) {
          const parts = msg.split(":");
          setErrorMsg(`이 이벤트의 플랜 한도에 도달했어요 (현재 ${parts[1]}/${parts[2]}명). 호스트에게 문의해주세요.`);
          setStage("error");
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
  const hostDisplay = event?.hostName?.trim() || "호스트";

  // ── verifying ──
  if (stage === "verifying") {
    return (
      <>
        <PageBackdrop pattern="e" />
        <div className="min-h-screen flex items-center justify-center" style={{ maxWidth: "480px", margin: "0 auto" }}>
          <p className="eyebrow animate-pulse">확인 중...</p>
        </div>
      </>
    );
  }

  // ── invalid ──
  if (stage === "invalid") {
    return (
      <>
        <PageBackdrop pattern="e" />
        <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center gap-6" style={{ maxWidth: "480px", margin: "0 auto" }}>
          <div className="w-16 h-16 flex items-center justify-center" style={{ border: "1px solid var(--hairline-strong)", borderRadius: "var(--r-sm)" }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-muted">
              <path d="M18 11V7a6 6 0 0 0-12 0v4" />
              <rect x="3" y="11" width="18" height="11" rx="1" />
            </svg>
          </div>
          <div style={scrim}>
            <p className="display text-xl mb-2">마감된 이벤트입니다</p>
            <p className="text-sm text-muted leading-relaxed">업로드 기간이 종료되었습니다.</p>
          </div>
          <a href={LANDING_URL} className="btn-quiet text-xs tracking-widest uppercase">
            홈으로
          </a>
        </div>
      </>
    );
  }

  // ── idle / preview / uploading / done / error ──
  return (
    <>
      <PageBackdrop pattern="e" />
      <div className="min-h-screen flex flex-col" style={{ maxWidth: "480px", margin: "0 auto" }}>
        {/* Header */}
        <header className="px-6 py-5 flex items-center justify-between">
          <a href={LANDING_URL} className="text-xl tracking-wider hover:opacity-75 transition-opacity duration-200">
            <BrandName />
          </a>
        </header>

        {/* Event info — 사진 위 텍스트, 국소 스크림 */}
        <div className="px-6 pt-4 pb-4">
          <div style={scrim}>
            <p className="eyebrow mb-2">
              Event · <span className="accent">#{eventId}</span>
            </p>
            <h1 className="display text-2xl">{event?.title ?? "이벤트"}</h1>
          </div>
        </div>

        {/* S3 미연결 배너 */}
        {s3Ready === false && (
          <div className="mx-6 mt-2 card">
            <p className="text-xs text-accent font-medium tracking-wide mb-0.5">S3 미연결</p>
            <p className="text-xs text-muted leading-relaxed">
              .env.local에 AWS 설정값을 추가하면 실제 업로드가 가능합니다.
            </p>
          </div>
        )}

        <div className="hr mx-6 my-5" />

        <main className="flex-1 flex flex-col items-center px-6 py-4 gap-6">

          {/* ── uploader ── */}
          {stage === "uploader" && (
            <>
              <p className="text-sm text-center text-foreground leading-relaxed" style={scrim}>
                {isReturning ? (
                  "다시 오셨네요. 이름과 전화번호를 확인해주세요. 같은 이름으로는 한 번만 올릴 수 있어요."
                ) : (
                  <>
                    🎬 {hostDisplay}님과 함께 만드는 {event?.title ?? "이벤트"} 영상입니다
                    <br />
                    {maxClipSeconds}초짜리 영상을 올려주세요.
                    <br />
                    <br />
                    이름·전화번호는 영상 구분과 완성본 전달에만 사용해요.
                  </>
                )}
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
                    className="input pr-14"
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
                  className="input"
                />
                {uploaderError && (
                  <p className="text-xs" style={{ color: "#e05252" }}>{uploaderError}</p>
                )}
              </div>
              <button
                onClick={handleUploaderNext}
                disabled={!name.trim() || !phone.trim()}
                className="btn btn-primary w-full"
              >
                다음
              </button>
            </>
          )}

          {/* ── idle ── */}
          {stage === "idle" && (
            <>
              <p className="text-sm text-center text-foreground leading-relaxed" style={scrim}>
                소중한 순간을 영상으로 남겨주세요
              </p>

              {iosDevice ? (
                <>
                  {/* iOS 안내 박스 */}
                  <div className="w-full card flex flex-col gap-2">
                    <p className="text-xs text-accent font-medium tracking-wide">iPhone 사용 중이시군요</p>
                    <p className="text-xs text-muted leading-relaxed">
                      iOS 정책상 iPhone 즉석 촬영은 화질이 낮습니다.<br />
                      미리 카메라 앱으로 영상을 찍어두신 뒤 아래 버튼을 눌러주세요.
                    </p>
                  </div>

                  {/* 갤러리 선택 — 큰 박스 */}
                  <label
                    className="group relative w-full hover:bg-[var(--surface-2)] transition-all duration-300 flex flex-col items-center justify-center gap-5 cursor-pointer"
                    style={{
                      aspectRatio: "9 / 16",
                      maxHeight: "58vh",
                      background: "color-mix(in srgb, var(--surface-1) 70%, transparent)",
                      backdropFilter: "blur(8px)",
                      border: "2px solid var(--hairline-strong)",
                      borderRadius: "var(--r-md)",
                    }}
                  >
                    <input type="file" accept="video/*" className="sr-only" onChange={handleFileSelected} />
                    <span className="absolute top-4 left-4 w-6 h-6 border-t-2 border-l-2 border-muted group-hover:border-accent transition-colors duration-300" />
                    <span className="absolute top-4 right-4 w-6 h-6 border-t-2 border-r-2 border-muted group-hover:border-accent transition-colors duration-300" />
                    <span className="absolute bottom-4 left-4 w-6 h-6 border-b-2 border-l-2 border-muted group-hover:border-accent transition-colors duration-300" />
                    <span className="absolute bottom-4 right-4 w-6 h-6 border-b-2 border-r-2 border-muted group-hover:border-accent transition-colors duration-300" />
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-20 h-20 rounded-full border-2 border-muted group-hover:border-accent flex items-center justify-center transition-colors duration-300">
                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
                          className="text-muted group-hover:text-accent transition-colors duration-300">
                          <rect x="3" y="3" width="18" height="18" rx="2" />
                          <circle cx="8.5" cy="8.5" r="1.5" />
                          <polyline points="21 15 16 10 5 21" />
                        </svg>
                      </div>
                      <p className="text-base tracking-widest uppercase font-medium text-muted group-hover:text-accent transition-colors duration-300">
                        갤러리에서 선택
                      </p>
                      <p className="text-sm text-muted">최대 {maxClipSeconds}초</p>
                    </div>
                  </label>
                </>
              ) : (
                <>
                  {/* 카메라 촬영 — 큰 박스 */}
                  <label
                    className="group relative w-full hover:bg-[var(--surface-2)] transition-all duration-300 flex flex-col items-center justify-center gap-5 cursor-pointer"
                    style={{
                      aspectRatio: "9 / 16",
                      maxHeight: "58vh",
                      background: "color-mix(in srgb, var(--surface-1) 70%, transparent)",
                      backdropFilter: "blur(8px)",
                      border: "2px solid var(--hairline-strong)",
                      borderRadius: "var(--r-md)",
                    }}
                  >
                    <input type="file" accept="video/*" capture="environment" className="sr-only" onChange={handleFileSelected} />
                    <span className="absolute top-4 left-4 w-6 h-6 border-t-2 border-l-2 border-muted group-hover:border-accent transition-colors duration-300" />
                    <span className="absolute top-4 right-4 w-6 h-6 border-t-2 border-r-2 border-muted group-hover:border-accent transition-colors duration-300" />
                    <span className="absolute bottom-4 left-4 w-6 h-6 border-b-2 border-l-2 border-muted group-hover:border-accent transition-colors duration-300" />
                    <span className="absolute bottom-4 right-4 w-6 h-6 border-b-2 border-r-2 border-muted group-hover:border-accent transition-colors duration-300" />
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
                      <p className="text-sm text-muted">최대 {maxClipSeconds}초 · 탭하여 시작</p>
                    </div>
                  </label>

                  <label className="btn-quiet text-xs tracking-widest uppercase cursor-pointer">
                    <input type="file" accept="video/*" className="sr-only" onChange={handleFileSelected} />
                    갤러리에서 선택
                  </label>
                </>
              )}

              <p className="text-xs text-center text-muted leading-relaxed opacity-80" style={scrim}>
                AI가 모든 순간을 모아 하나의 영상으로 편집해드려요.
              </p>
            </>
          )}

          {/* ── preview ── */}
          {stage === "preview" && (
            <div className="w-full flex flex-col gap-5">
              <div
                className="relative w-full bg-black overflow-hidden"
                style={{ aspectRatio: "9 / 16", maxHeight: "54vh", borderRadius: "var(--r-md)" }}
              >
                <span className="absolute top-3 left-3 w-5 h-5 border-t border-l z-10" style={{ borderColor: "var(--hairline-strong)" }} />
                <span className="absolute top-3 right-3 w-5 h-5 border-t border-r z-10" style={{ borderColor: "var(--hairline-strong)" }} />
                <span className="absolute bottom-3 left-3 w-5 h-5 border-b border-l z-10" style={{ borderColor: "var(--hairline-strong)" }} />
                <span className="absolute bottom-3 right-3 w-5 h-5 border-b border-r z-10" style={{ borderColor: "var(--hairline-strong)" }} />
                <video ref={previewRef} playsInline controls className="w-full h-full object-cover" />
              </div>

              <button onClick={handleUpload} disabled={s3Ready === false} className="btn btn-primary w-full">
                업로드하기
              </button>

              <button onClick={reRecord} className="btn-quiet text-xs text-center uppercase tracking-widest">
                다시 촬영
              </button>
            </div>
          )}

          {/* ── uploading ── */}
          {stage === "uploading" && (
            <div className="w-full flex flex-col items-center gap-6 py-10" style={scrim}>
              <p className="eyebrow">
                {retryNum > 0 ? `재시도 중... (${retryNum}/3)` : "업로드 중..."}
              </p>
              <div className="w-full h-px bg-[var(--hairline-strong)] relative overflow-hidden">
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
            <div className="w-full flex flex-col items-center gap-6 text-center py-10" style={scrim}>
              <div className="w-20 h-20 rounded-full border-2 border-accent flex items-center justify-center">
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-accent">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <div>
                <p className="display text-2xl mb-3">전달됐어요!</p>
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

              <button onClick={reRecord} className="btn btn-secondary">
                하나 더 올리기
              </button>
            </div>
          )}

          {/* ── error ── */}
          {stage === "error" && (
            <div className="w-full flex flex-col items-center gap-6 text-center py-10" style={scrim}>
              <div className="w-16 h-16 flex items-center justify-center" style={{ border: "1px solid var(--hairline-strong)", borderRadius: "var(--r-sm)" }}>
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
                  <button onClick={handleUpload} className="btn btn-primary" style={{ height: 44, padding: "0 20px", fontSize: 13 }}>
                    다시 시도
                  </button>
                )}
                <button onClick={reRecord} className="btn btn-secondary" style={{ height: 44, padding: "0 20px", fontSize: 13 }}>
                  다시 촬영
                </button>
              </div>
            </div>
          )}
        </main>
      </div>
    </>
  );
}

export default function UploadPage() {
  return (
    <Suspense
      fallback={
        <>
          <PageBackdrop pattern="e" />
          <div className="min-h-screen flex items-center justify-center" style={{ maxWidth: "480px", margin: "0 auto" }}>
            <p className="eyebrow animate-pulse">로딩 중...</p>
          </div>
        </>
      }
    >
      <UploadInner />
    </Suspense>
  );
}
