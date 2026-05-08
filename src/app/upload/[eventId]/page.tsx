"use client";

import { useState, useRef, useEffect, useCallback, Suspense } from "react";
import Link from "next/link";
import { BrandName } from "@/components/BrandName";
import { useParams, useSearchParams } from "next/navigation";
import { checkS3, getPresignedUrl, uploadToS3 } from "@/lib/s3";
import CongreBadge from "@/components/CongreBadge";

// "standby" = 카메라 켜진 미리보기 (녹화 전)
// "preview"  = 녹화 완료 후 blob 재생 (기존)
type Stage = "verifying" | "invalid" | "nickname" | "idle" | "standby" | "recording" | "preview" | "uploading" | "done" | "error";

const MAX_SEC = 10;

function UploadInner() {
  const { eventId } = useParams<{ eventId: string }>();
  const searchParams = useSearchParams();
  const urlToken = searchParams.get("token") ?? "";

  const [stage, setStage] = useState<Stage>("verifying");
  const [event, setEvent] = useState<{ id: string; title: string } | null>(null);
  const [timer, setTimer] = useState(0);
  const [progress, setProgress] = useState(0);
  const [retryNum, setRetryNum] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");
  const [nickname, setNickname] = useState("");
  const [nicknameError, setNicknameError] = useState("");
  const [s3Ready, setS3Ready] = useState<boolean | null>(null);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("environment");
  // streamKey: openCamera 호출마다 증가 → useEffect([stage, streamKey])가 재실행되어 video.srcObject 갱신
  const [streamKey, setStreamKey] = useState(0);

  const liveRef = useRef<HTMLVideoElement>(null);
  const previewRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const blobRef = useRef<Blob | null>(null);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const previewUrlRef = useRef<string>("");

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
        const evt = await res.json() as { id: string; title: string };
        setEvent(evt);
        setStage("nickname");
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
    if (stage !== "nickname") return;
    const saved = sessionStorage.getItem(`congre-nick-${eventId}`);
    if (saved) setNickname(saved);
  }, [stage, eventId]);

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    // 이전 스트림 잔재 제거 — srcObject를 null로 초기화하지 않으면 검은 화면 잔류
    if (liveRef.current) liveRef.current.srcObject = null;
  }, []);

  useEffect(() => {
    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
      stopStream();
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    };
  }, [stopStream]);

  // standby·recording 진입 시, 또는 streamKey가 바뀔 때(카메라 전환) video에 스트림 연결
  useEffect(() => {
    if (stage !== "standby" && stage !== "recording") return;
    const video = liveRef.current;
    if (!video || !streamRef.current) return;
    video.srcObject = streamRef.current;
    video.play().catch(() => {});
  }, [stage, streamKey]);

  // stage가 "preview"로 바뀐 뒤 video 엘리먼트가 마운트되면 blob URL을 연결
  useEffect(() => {
    if (stage !== "preview") return;
    const video = previewRef.current;
    if (!video || !previewUrlRef.current) return;
    video.src = previewUrlRef.current;
    video.load();
  }, [stage]);

  // 카메라 스트림 획득만 담당. streamRef·streamKey 갱신. 녹화 시작 안 함.
  async function openCamera(facing: "user" | "environment"): Promise<MediaStream | null> {
    setErrorMsg("");
    if (typeof MediaRecorder === "undefined") {
      setErrorMsg("이 브라우저에서는 녹화가 지원되지 않습니다. iOS 15 이상의 Safari를 사용해주세요.");
      setStage("error");
      return null;
    }
    try {
      let stream: MediaStream;
      try {
        // 기본 시도: facingMode ideal constraints
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: facing } },
          audio: true,
        });
      } catch {
        // iOS 일부 버전에서 constraints 거부 시 최소 constraints로 폴백
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      }
      streamRef.current = stream;
      setStreamKey((k) => k + 1); // useEffect 재실행 트리거
      return stream;
    } catch {
      setErrorMsg("카메라 접근 권한이 필요합니다. 브라우저 설정을 확인해주세요.");
      setStage("error");
      return null;
    }
  }

  async function handleNicknameNext() {
    const trimmed = nickname.trim();
    if (!trimmed) return;
    setNicknameError("");
    try {
      const res = await fetch(
        `/api/clips/check?eventId=${encodeURIComponent(eventId)}&name=${encodeURIComponent(trimmed)}`
      );
      const data = await res.json() as { exists: boolean };
      if (data.exists) {
        setNicknameError("이미 사용된 닉네임이에요. 다른 닉네임을 입력해주세요.");
        return;
      }
      setNickname(trimmed);
      sessionStorage.setItem(`congre-nick-${eventId}`, trimmed);
      setStage("idle");
    } catch {
      setNicknameError("확인 중 오류가 발생했습니다. 다시 시도해주세요.");
    }
  }

  // idle → standby: 카메라 켜고 미리보기 진입 (녹화 없음)
  async function startPreview() {
    const stream = await openCamera(facingMode);
    if (!stream) return;
    setStage("standby");
  }

  // standby 전용 카메라 전환 — 녹화 중 전환은 데이터 손실을 유발하므로 허용하지 않음
  async function switchCamera() {
    if (stage !== "standby") return;

    const newFacing = facingMode === "environment" ? "user" : "environment";
    setFacingMode(newFacing);

    stopStream();

    const stream = await openCamera(newFacing);
    if (!stream) return;
    // streamKey 증가만으로 useEffect가 video.srcObject 갱신
  }

  function beginRecording(stream: MediaStream) {
    chunksRef.current = [];
    // H.264 MP4를 우선 시도 — Shotstack sandbox는 VP9 WebM을 비디오 트랙으로 인식 못하는 경우 있음
    const mimeType = [
      "video/mp4;codecs=avc1",
      "video/mp4",
      "video/webm;codecs=vp9",
      "video/webm",
    ].find((m) => MediaRecorder.isTypeSupported(m)) ?? "";

    const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
    recorderRef.current = recorder;

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };

    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: recorder.mimeType });
      blobRef.current = blob;
      stopStream();
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = URL.createObjectURL(blob);
      setStage("preview");
    };

    recorder.start(100);
    setStage("recording");
    setTimer(0);

    tickRef.current = setInterval(() => {
      setTimer((t) => {
        const next = t + 1;
        if (next >= MAX_SEC) {
          clearInterval(tickRef.current!);
          tickRef.current = null;
          if (recorderRef.current?.state === "recording") recorderRef.current.stop();
          return MAX_SEC;
        }
        return next;
      });
    }, 1000);
  }

  function stopEarly() {
    if (tickRef.current) {
      clearInterval(tickRef.current);
      tickRef.current = null;
    }
    if (recorderRef.current?.state === "recording") recorderRef.current.stop();
  }

  function reRecord() {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = "";
    }
    blobRef.current = null;
    setTimer(0);
    setProgress(0);
    setRetryNum(0);
    setErrorMsg("");
    setStage("idle");
  }

  async function doUpload(attempt: number): Promise<void> {
    const blob = blobRef.current!;
    // codec 파라미터 제거 ("video/webm;codecs=vp9" → "video/webm")
    // presign 서명과 XHR Content-Type이 일치해야 S3가 403을 내지 않음
    const mimeType = blob.type.split(";")[0] || "video/webm";
    const ext = mimeType.includes("mp4") ? "mp4" : "webm";
    const fileName = `clip-${Date.now()}.${ext}`;

    console.log(`[upload] attempt=${attempt} blobType="${blob.type}" mimeType="${mimeType}" size=${blob.size} ext=${ext}`);

    const { url, key } = await getPresignedUrl(eventId, fileName, mimeType);
    console.log(`[upload] presign ok → key=${key}`);
    console.log(`[upload] presign url: ${url.slice(0, 150)}...`);

    await uploadToS3(url, blob, mimeType, setProgress);
    console.log(`[upload] S3 PUT success`);

    const clipSave = fetch("/api/clips", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ eventId, s3Key: key, token: urlToken, uploaderName: nickname }),
    });
    const clipTimeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("clip_save_timeout")), 5000)
    );
    try {
      const clipRes = await Promise.race([clipSave, clipTimeout]);
      if (!clipRes.ok) {
        const body = await clipRes.json().catch(() => ({})) as { error?: string };
        if (body.error === "DUPLICATE_NICKNAME") throw new Error("DUPLICATE_NICKNAME");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg === "DUPLICATE_NICKNAME") throw err;
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
        if (msg === "DUPLICATE_NICKNAME") {
          setNicknameError("이미 사용된 닉네임이에요. 다른 닉네임을 입력해주세요.");
          setStage("nickname");
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

  const timerPct = (timer / MAX_SEC) * 100;

  // 카메라 전환 버튼 — standby 전용
  const flipButton = (
    <button
      onClick={switchCamera}
      className="absolute top-4 right-4 z-10 w-10 h-10 flex items-center justify-center rounded-full bg-black/50"
      aria-label="카메라 전환"
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M1 4v6h6" />
        <path d="M23 20v-6h-6" />
        <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4-4.64 4.36A9 9 0 0 1 3.51 15" />
      </svg>
    </button>
  );

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

  // ── idle / standby / recording / preview / uploading / done / error ──
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

        {/* ── nickname ── */}
        {stage === "nickname" && (
          <>
            <p className="text-sm text-center text-foreground leading-relaxed">
              영상에 표시될 닉네임을 입력해주세요.
            </p>
            <div className="w-full flex flex-col gap-3">
              <div className="relative">
                <input
                  type="text"
                  value={nickname}
                  onChange={(e) => { setNickname(e.target.value.slice(0, 10)); setNicknameError(""); }}
                  onKeyDown={(e) => { if (e.key === "Enter") handleNicknameNext(); }}
                  placeholder="닉네임 (최대 10자)"
                  maxLength={10}
                  autoFocus
                  className="w-full bg-surface border border-border px-4 py-3 pr-14 text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-accent transition-colors"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted tabular-nums pointer-events-none">
                  {nickname.length}/10
                </span>
              </div>
              {nicknameError && (
                <p className="text-xs" style={{ color: "#e05252" }}>{nicknameError}</p>
              )}
              <p className="text-xs text-muted leading-relaxed opacity-70">
                같은 이벤트에서 중복 사용 불가. 한 번 입력 후 여러 영상을 올릴 수 있어요.
              </p>
            </div>
            <button
              onClick={handleNicknameNext}
              disabled={!nickname.trim()}
              className="w-full py-4 bg-accent text-background text-sm tracking-widest uppercase font-medium hover:brightness-110 transition-all duration-200 glow-accent disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:brightness-100"
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

            <button
              onClick={startPreview}
              className="group relative w-full bg-surface hover:bg-[var(--surface-2)] border-2 border-border hover:border-accent transition-all duration-300 flex flex-col items-center justify-center gap-5 cursor-pointer"
              style={{ aspectRatio: "9 / 16", maxHeight: "58vh" }}
            >
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
                  카메라 켜기
                </p>
                <p className="text-xs text-muted opacity-60">최대 10초 · 탭하여 시작</p>
              </div>
            </button>

            <p className="text-xs text-center text-muted leading-relaxed opacity-70">
              AI가 모든 순간을 모아 하나의 영상으로 편집해드려요.
            </p>
          </>
        )}

        {/* ── standby: 카메라 미리보기 (녹화 전) ── */}
        {stage === "standby" && (
          <div className="w-full flex flex-col items-center gap-4">
            <div
              className="relative w-full bg-black overflow-hidden"
              style={{ aspectRatio: "9 / 16", maxHeight: "54vh" }}
            >
              <span className="absolute top-3 left-3 w-5 h-5 border-t border-l border-accent z-10" />
              <span className="absolute top-3 right-3 w-5 h-5 border-t border-r border-accent z-10" />
              <span className="absolute bottom-3 left-3 w-5 h-5 border-b border-l border-accent z-10" />
              <span className="absolute bottom-3 right-3 w-5 h-5 border-b border-r border-accent z-10" />

              {flipButton}

              <video
                ref={liveRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
            </div>

            <p className="text-xs text-muted opacity-60 text-center">
              카메라를 선택한 뒤 촬영을 시작하세요
            </p>

            <button
              onClick={() => { if (streamRef.current) beginRecording(streamRef.current); }}
              className="w-full py-4 bg-accent text-background text-sm tracking-widest uppercase font-medium hover:brightness-110 transition-all duration-200 glow-accent"
            >
              촬영 시작
            </button>
          </div>
        )}

        {/* ── recording ── */}
        {stage === "recording" && (
          <div className="w-full flex flex-col items-center gap-4">
            {/* Timer bar */}
            <div className="w-full flex items-center gap-3">
              <div className="flex-1 h-px bg-border relative overflow-hidden">
                <div
                  className="absolute inset-y-0 left-0 transition-all duration-1000 ease-linear"
                  style={{ width: `${timerPct}%`, background: "var(--accent)" }}
                />
              </div>
              <span className="text-xs text-accent tabular-nums shrink-0">
                {MAX_SEC - timer}s
              </span>
            </div>

            {/* Live viewfinder */}
            <div
              className="relative w-full bg-black overflow-hidden"
              style={{ aspectRatio: "9 / 16", maxHeight: "54vh" }}
            >
              <span className="absolute top-3 left-3 w-5 h-5 border-t border-l border-accent z-10" />
              <span className="absolute top-3 right-3 w-5 h-5 border-t border-r border-accent z-10" />
              <span className="absolute bottom-3 left-3 w-5 h-5 border-b border-l border-accent z-10" />
              <span className="absolute bottom-3 right-3 w-5 h-5 border-b border-r border-accent z-10" />

              {/* REC indicator */}
              <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-10">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <span className="text-xs text-white tracking-widest uppercase">REC</span>
              </div>

              <video
                ref={liveRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
            </div>

            <button
              onClick={stopEarly}
              className="px-8 py-3 border border-border text-muted text-xs tracking-widest uppercase hover:border-accent hover:text-foreground transition-all duration-200"
            >
              촬영 완료
            </button>
          </div>
        )}

        {/* ── preview (녹화 후 blob 재생) ── */}
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
              className="w-full py-4 bg-accent text-background text-sm tracking-widest uppercase font-medium hover:brightness-110 transition-all duration-200 glow-accent disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:brightness-100"
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
                  className="px-5 py-2.5 bg-accent text-background text-xs tracking-widest uppercase hover:brightness-110 transition-all duration-200"
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
