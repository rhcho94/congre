"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { checkS3, getPresignedUrl, uploadToS3 } from "@/lib/s3";
import { saveVideoMetadata } from "@/lib/firestore";

type Stage = "idle" | "recording" | "preview" | "uploading" | "done" | "error";

const MAX_SEC = 10;

const eventData = {
  title: "2025 팀 워크샵",
  host: "김민준",
  deadline: "2025-05-10 18:00",
};

function getSessionToken(): string {
  const key = "congre_session";
  const existing = sessionStorage.getItem(key);
  if (existing) return existing;
  const token = crypto.randomUUID();
  sessionStorage.setItem(key, token);
  return token;
}

export default function EventPage() {
  const { id } = useParams<{ id: string }>();

  const [stage, setStage] = useState<Stage>("idle");
  const [timer, setTimer] = useState(0);
  const [progress, setProgress] = useState(0);
  const [retryNum, setRetryNum] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");
  const [s3Ready, setS3Ready] = useState<boolean | null>(null);

  const liveRef = useRef<HTMLVideoElement>(null);
  const previewRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const blobRef = useRef<Blob | null>(null);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const previewUrlRef = useRef<string>("");

  useEffect(() => {
    checkS3().then(setS3Ready);
  }, []);

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  useEffect(() => {
    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
      stopStream();
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    };
  }, [stopStream]);

  // stage가 "recording"으로 바뀐 뒤 video 엘리먼트가 마운트되면 스트림을 연결
  useEffect(() => {
    if (stage !== "recording") return;
    const video = liveRef.current;
    if (!video || !streamRef.current) return;
    video.srcObject = streamRef.current;
    video.play().catch(() => {});
  }, [stage]);

  // stage가 "preview"로 바뀐 뒤 video 엘리먼트가 마운트되면 blob URL을 연결
  useEffect(() => {
    if (stage !== "preview") return;
    const video = previewRef.current;
    if (!video || !previewUrlRef.current) return;
    video.src = previewUrlRef.current;
    video.load();
  }, [stage]);

  async function startCamera() {
    setErrorMsg("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" }, width: { ideal: 1080 }, height: { ideal: 1920 } },
        audio: true,
      });
      streamRef.current = stream;
      beginRecording(stream); // setStage("recording") → useEffect가 srcObject 연결
    } catch {
      setErrorMsg("카메라 접근 권한이 필요합니다. 브라우저 설정을 확인해주세요.");
      setStage("error");
    }
  }

  function beginRecording(stream: MediaStream) {
    chunksRef.current = [];
    const mimeType = ["video/webm;codecs=vp9", "video/webm", "video/mp4"].find(
      (m) => MediaRecorder.isTypeSupported(m)
    ) ?? "";

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
      setStage("preview"); // useEffect가 마운트 후 previewRef.current.src 연결
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

    console.log(`[upload] attempt=${attempt} mimeType=${mimeType} size=${blob.size}`);
    const { url, key } = await getPresignedUrl(id, fileName, mimeType);
    console.log(`[upload] presign key=${key}`);
    await uploadToS3(url, blob, mimeType, setProgress);

    // Firestore 저장은 best-effort — 실패·타임아웃해도 done 전환 막지 않음
    // (Firestore 미설정·규칙 거부 시 SDK가 무한 대기하므로 5초 타임아웃 적용)
    const firestoreSave = saveVideoMetadata({
      eventId: id,
      s3Key: key,
      fileName,
      fileSize: blob.size,
      mimeType,
      sessionToken: getSessionToken(),
    });
    const firestoreTimeout = new Promise<void>((_, reject) =>
      setTimeout(() => reject(new Error("firestore_timeout")), 5000)
    );
    await Promise.race([firestoreSave, firestoreTimeout]).catch((err) => {
      console.error("[firestore] saveVideoMetadata skipped:", err?.message ?? err);
    });
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
        if (attempt === 3) {
          setErrorMsg(
            err instanceof Error && err.message.includes("S3_NOT_CONFIGURED")
              ? "S3가 연결되지 않아 업로드할 수 없습니다."
              : "업로드에 실패했습니다. 네트워크를 확인해주세요."
          );
          setStage("error");
        }
      }
    }
  }

  const timerPct = (timer / MAX_SEC) * 100;

  return (
    <div className="min-h-screen bg-background flex flex-col" style={{ maxWidth: "480px", margin: "0 auto" }}>
      {/* Header */}
      <header className="px-6 py-5 border-b border-border flex items-center justify-between">
        <Link
          href="/"
          className="text-xl italic tracking-wider text-foreground"
          style={{ fontFamily: "var(--font-display, serif)" }}
        >
          congre
        </Link>
      </header>

      {/* Event info */}
      <div className="px-6 pt-8 pb-4">
        <p className="text-xs tracking-[0.4em] uppercase text-accent mb-2">Event · #{id}</p>
        <h1 className="text-2xl italic text-foreground" style={{ fontFamily: "var(--font-display, serif)" }}>
          {eventData.title}
        </h1>
        <p className="mt-1 text-sm text-muted">주최: {eventData.host}</p>
        <p className="mt-1 text-xs text-muted">마감 {eventData.deadline}</p>
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

        {/* ── idle ── */}
        {stage === "idle" && (
          <>
            <button
              onClick={startCamera}
              className="group relative w-full bg-surface hover:bg-[var(--surface-2)] border border-border hover:border-accent transition-all duration-300 flex flex-col items-center justify-center gap-4 cursor-pointer"
              style={{ aspectRatio: "9 / 16", maxHeight: "54vh" }}
            >
              <span className="absolute top-3 left-3 w-5 h-5 border-t border-l border-muted group-hover:border-accent transition-colors duration-300" />
              <span className="absolute top-3 right-3 w-5 h-5 border-t border-r border-muted group-hover:border-accent transition-colors duration-300" />
              <span className="absolute bottom-3 left-3 w-5 h-5 border-b border-l border-muted group-hover:border-accent transition-colors duration-300" />
              <span className="absolute bottom-3 right-3 w-5 h-5 border-b border-r border-muted group-hover:border-accent transition-colors duration-300" />

              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
                className="text-muted group-hover:text-accent transition-colors duration-300">
                <circle cx="12" cy="12" r="10" />
                <circle cx="12" cy="12" r="3" />
              </svg>
              <p className="text-sm tracking-widest uppercase text-muted group-hover:text-accent transition-colors duration-300">
                촬영 시작
              </p>
              <p className="text-xs text-muted opacity-50">최대 10초</p>
            </button>

            <p className="text-xs text-center text-muted leading-relaxed">
              이벤트 현장의 10초를 담아주세요.
              <br />
              AI가 모든 순간을 하나의 영상으로 편집합니다.
            </p>
          </>
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

        {/* ── preview ── */}
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
            <div className="w-16 h-16 border border-accent flex items-center justify-center">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-accent">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <div>
              <p className="text-xl italic text-foreground mb-2" style={{ fontFamily: "var(--font-display, serif)" }}>
                업로드 완료
              </p>
              <p className="text-sm text-muted leading-relaxed">
                영상이 성공적으로 제출되었습니다.
                <br />
                AI 편집 완료 후 알림을 드릴게요.
              </p>
            </div>
            <button
              onClick={reRecord}
              className="px-6 py-2.5 border border-border text-muted text-xs tracking-widest uppercase hover:border-accent hover:text-foreground transition-all duration-200"
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
