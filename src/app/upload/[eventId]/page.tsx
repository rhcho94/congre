"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import { BrandName } from "@/components/BrandName";
import { LANDING_URL } from "@/lib/constants";
import PageBackdrop from "@/components/PageBackdrop";
import FlowStrip from "@/components/FlowStrip";
import { useParams, useSearchParams } from "next/navigation";
import { checkS3, getPresignedUrl, uploadToS3 } from "@/lib/s3";
import CongreBadge from "@/components/CongreBadge";
import { isIOS } from "@/lib/device";

type Stage = "verifying" | "invalid" | "uploader" | "idle" | "preview" | "uploading" | "done" | "error";

async function captureThumbnail(blob: Blob): Promise<Blob | null> {
  return new Promise((resolve) => {
    const video = document.createElement("video");
    video.preload = "metadata";
    video.muted = true;
    video.playsInline = true;
    const url = URL.createObjectURL(blob);
    let done = false;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    const finish = (result: Blob | null) => {
      if (done) return;
      done = true;
      if (timeoutId) clearTimeout(timeoutId);
      URL.revokeObjectURL(url);
      resolve(result);
    };
    timeoutId = setTimeout(() => {
      if (done) return;
      console.warn("[upload] thumb capture timed out");
      finish(null);
    }, 3000);
    video.onloadeddata = () => {
      const d = video.duration;
      const seekTo = !Number.isFinite(d) || d <= 1 ? (d > 0 ? d / 2 : 0) : 1;
      try {
        video.currentTime = seekTo;
      } catch {
        finish(null);
      }
    };
    video.onseeked = () => {
      try {
        const vw = video.videoWidth;
        const vh = video.videoHeight;
        if (!vw || !vh) { finish(null); return; }
        const maxW = 640;
        const scale = vw > maxW ? maxW / vw : 1;
        const cw = Math.round(vw * scale);
        const ch = Math.round(vh * scale);
        const canvas = document.createElement("canvas");
        canvas.width = cw;
        canvas.height = ch;
        const ctx = canvas.getContext("2d");
        if (!ctx) { finish(null); return; }
        ctx.drawImage(video, 0, 0, cw, ch);
        canvas.toBlob((b) => finish(b), "image/jpeg", 0.8);
      } catch {
        finish(null);
      }
    };
    video.onerror = () => finish(null);
    video.src = url;
  });
}

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
  const [event, setEvent] = useState<{ id: string; title: string; maxClipSeconds?: number; hostName?: string | null; plan?: string } | null>(null);
  const [progress, setProgress] = useState(0);
  const [retryNum, setRetryNum] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [uploaderError, setUploaderError] = useState("");
  const [isReturning, setIsReturning] = useState(false);
  const [agreed, setAgreed] = useState(false);
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
        const evt = await res.json() as { id: string; title: string; maxClipSeconds?: number; hostName?: string | null; plan?: string };
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
    if (!agreed) {
      setUploaderError("위 내용에 동의해 주세요.");
      return;
    }

    try {
      const res = await fetch(
        `/api/clips/check?eventId=${encodeURIComponent(eventId)}&phone=${encodeURIComponent(phoneClean)}&name=${encodeURIComponent(trimmedName)}&token=${encodeURIComponent(urlToken)}`
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

    const { url, key } = await getPresignedUrl(eventId, fileName, mimeType, "clip", { sessionToken: urlToken });
    console.log(`[upload] presign ok → key=${key}`);

    await uploadToS3(url, blob, mimeType, setProgress);
    console.log(`[upload] S3 PUT success`);

    let thumbKey: string | undefined;
    try {
      const thumbBlob = await captureThumbnail(blob);
      if (thumbBlob) {
        const thumbFileName = `thumb-${Date.now()}.jpg`;
        const presignRes = await fetch("/api/upload/presign", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ eventId, fileName: thumbFileName, fileType: "image/jpeg", kind: "thumb", token: urlToken }),
        });
        if (!presignRes.ok) throw new Error(`thumb_presign:${presignRes.status}`);
        const { url: thumbUrl, key: tKey } = await presignRes.json() as { url: string; key: string };
        await uploadToS3(thumbUrl, thumbBlob, "image/jpeg", () => {});
        thumbKey = tKey;
        console.log(`[upload] thumb PUT success → key=${tKey}`);
      } else {
        console.warn("[upload] thumb capture returned null, skipping");
      }
    } catch (err) {
      console.warn("[upload] thumb skipped:", err instanceof Error ? err.message : String(err));
    }

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
        ...(thumbKey ? { thumbKey } : {}),
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
        <div className="min-h-screen flex flex-col items-center justify-center px-5 text-center gap-6" style={{ maxWidth: "480px", margin: "0 auto" }}>
          <div className="w-16 h-16 flex items-center justify-center" style={{ background: "#fff", border: "1px solid var(--line)" }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-muted">
              <path d="M18 11V7a6 6 0 0 0-12 0v4" />
              <rect x="3" y="11" width="18" height="11" rx="1" />
            </svg>
          </div>
          <div className="notice w-full">
            <p className="display text-xl mb-2">마감된 이벤트입니다</p>
            <p className="text-sm text-muted leading-relaxed">업로드 기간이 종료되었습니다.</p>
          </div>
          <a href={LANDING_URL} className="btn-quiet text-sm">
            홈으로
          </a>
        </div>
      </>
    );
  }

  // ── uploader / idle / preview / uploading / done / error ──
  return (
    <>
      <PageBackdrop pattern="e" />
      <div className="min-h-screen flex flex-col" style={{ maxWidth: "480px", margin: "0 auto" }}>
        {/* Header */}
        <header className="flex items-center justify-between gap-2 pl-5 pr-3.5 py-2 min-h-[56px]">
          <a href={LANDING_URL} className="inline-flex items-center hover:opacity-75 transition-opacity duration-200">
            <BrandName height={30} />
          </a>
          {/* 새 탭 — 촬영·업로드 중에 눌러도 찍은 영상이 사라지지 않게 */}
          <a href="/guide/guest" target="_blank" rel="noopener" className="btn-quiet text-sm"
            style={{ padding: "0 4px" }}>
            참가자 가이드
          </a>
        </header>

        <main className="flex-1 flex flex-col gap-3.5 px-5 pb-7">
          {stage === "uploader" && !isReturning && <FlowStrip />}

          {/* 행사 카드 */}
          <section className="notice flex flex-col gap-2" style={{ padding: "16px 18px 14px" }}>
            <p className="text-sm text-muted">{hostDisplay}님이 초대했어요</p>
            <h1 className="display" style={{ fontSize: 26, lineHeight: 1.3 }}>{event?.title ?? "이벤트"}</h1>
            {stage === "uploader" && (
              <>
                <p style={{ fontSize: 15, lineHeight: 1.6, color: "var(--text-dim)" }}>축하 한마디 남겨 주세요</p>
                <p
                  className="pen"
                  style={{ paddingTop: 8, borderTop: "1px dashed var(--line)", fontSize: 24, lineHeight: 1.2, color: "var(--pen-red)" }}
                >
                  예) 축하해요! 오늘처럼 늘 웃는 날만 있길
                </p>
              </>
            )}
          </section>

          {/* S3 미연결 배너 */}
          {s3Ready === false && (
            <div className="notice">
              <p className="text-xs text-accent mb-0.5">S3 미연결</p>
              <p className="text-xs text-muted leading-relaxed">
                .env.local에 AWS 설정값을 추가하면 실제 업로드가 가능합니다.
              </p>
            </div>
          )}

          {/* ── uploader ── */}
          {stage === "uploader" && (
            <>
              {isReturning ? (
                <p className="break-keep" style={{ fontSize: 15, lineHeight: 1.6 }}>
                  다시 오셨네요. 이름과 전화번호를 확인해주세요. 같은 이름으로는 한 번만 올릴 수 있어요.
                </p>
              ) : (
                <ul className="list-disc flex flex-col gap-1" style={{ paddingLeft: 18, fontSize: 15, lineHeight: 1.55 }}>
                  <li>폰을 세로로 들고 {maxClipSeconds}초 동안 찍어요</li>
                  <li>{maxClipSeconds}초가 넘으면 앞부분만 들어가요</li>
                </ul>
              )}

              <div className="flex flex-col gap-1.5">
                <label htmlFor="uploader-name" style={{ fontSize: 15 }}>이름</label>
                <div className="relative">
                  <input
                    id="uploader-name"
                    type="text"
                    value={name}
                    onChange={(e) => { setName(e.target.value.slice(0, 20)); setUploaderError(""); }}
                    onKeyDown={(e) => { if (e.key === "Enter") handleUploaderNext(); }}
                    placeholder="예: 대학 동기 서연"
                    maxLength={20}
                    autoFocus
                    className="input"
                    style={{ paddingRight: 56 }}
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[13px] text-muted tabular-nums pointer-events-none">
                    {name.length}/20
                  </span>
                </div>
                <p className="text-[13px] text-muted" style={{ lineHeight: 1.55 }}>어떤 사이인지 같이 적으면 더 좋아요.</p>
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="uploader-phone" style={{ fontSize: 15 }}>전화번호</label>
                <input
                  id="uploader-phone"
                  type="tel"
                  inputMode="numeric"
                  value={phone}
                  onChange={(e) => { setPhone(e.target.value.slice(0, 13)); setUploaderError(""); }}
                  onKeyDown={(e) => { if (e.key === "Enter") handleUploaderNext(); }}
                  placeholder="01012345678"
                  maxLength={13}
                  className="input"
                />
                <p className="text-[13px] text-muted" style={{ lineHeight: 1.55 }}>완성본이 나오면 문자로 알려 드려요.</p>
              </div>

              <p className="text-[13px]" style={{ lineHeight: 1.55, color: "var(--text-dim)" }}>
                이름과 전화번호는 영상 구분과 완성본 알림에만 써요. 보낸 영상은 결과를 알린 뒤 48시간이 지나면 지워져요.{" "}
                <a href="/privacy" target="_blank" rel="noopener" className="underline" style={{ color: "var(--accent)" }}>
                  개인정보처리방침
                </a>
              </p>

              <label className="flex items-start gap-2.5 min-h-[44px] py-2.5 cursor-pointer" style={{ fontSize: 14, lineHeight: 1.5 }}>
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={(e) => { setAgreed(e.target.checked); setUploaderError(""); }}
                  className="shrink-0 cursor-pointer"
                  style={{ width: 22, height: 22, margin: 0, accentColor: "var(--accent)" }}
                />
                <span>위 내용에 동의해요 (필수)</span>
              </label>

              {uploaderError && (
                <p className="text-[13px]" style={{ color: "var(--danger)" }}>{uploaderError}</p>
              )}

              <button
                onClick={handleUploaderNext}
                disabled={!name.trim() || !phone.trim() || !agreed}
                className="btn btn-primary w-full"
                style={{ height: 54, fontSize: 17, marginTop: 4 }}
              >
                다음
              </button>
            </>
          )}

          {/* ── idle ── */}
          {stage === "idle" && (
            <>
              <p className="text-center" style={{ fontSize: 15 }}>
                소중한 순간을 영상으로 남겨주세요
              </p>

              <div className="notice">
                <ul className="list-disc flex flex-col gap-1" style={{ paddingLeft: 18, fontSize: 15, lineHeight: 1.55 }}>
                  <li>휴대폰을 세로로 들고 찍어주세요</li>
                  <li>앞부분 {maxClipSeconds}초만 영상에 담겨요 (뒤는 잘려요)</li>
                </ul>
              </div>

              {iosDevice ? (
                <>
                  {/* iOS 안내 */}
                  <div className="w-full notice flex flex-col gap-2">
                    <p className="text-sm text-accent">iPhone 사용 중이시군요</p>
                    <p className="text-[13px] text-muted leading-relaxed">
                      iOS 정책상 iPhone 즉석 촬영은 화질이 낮습니다.<br />
                      미리 카메라 앱으로 영상을 찍어두신 뒤 아래 버튼을 눌러주세요.
                    </p>
                  </div>

                  {/* 갤러리 선택 — 큰 박스 */}
                  <label
                    className="group relative w-full hover:bg-[var(--surface-2)] transition-colors duration-300 flex flex-col items-center justify-center gap-5 cursor-pointer"
                    style={{
                      aspectRatio: "9 / 16",
                      maxHeight: "58vh",
                      background: "var(--surface-1)",
                      border: "1.5px solid var(--field)",
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
                      <p className="text-base text-accent">
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
                    className="group relative w-full hover:bg-[var(--surface-2)] transition-colors duration-300 flex flex-col items-center justify-center gap-5 cursor-pointer"
                    style={{
                      aspectRatio: "9 / 16",
                      maxHeight: "58vh",
                      background: "var(--surface-1)",
                      border: "1.5px solid var(--field)",
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
                      <p className="text-base text-accent">
                        지금 촬영하기
                      </p>
                      <p className="text-sm text-muted">최대 {maxClipSeconds}초, 탭하여 시작</p>
                    </div>
                  </label>

                  <label className="btn-quiet text-sm cursor-pointer self-center">
                    <input type="file" accept="video/*" className="sr-only" onChange={handleFileSelected} />
                    갤러리에서 선택
                  </label>
                </>
              )}

              <p className="text-[13px] text-center text-muted leading-relaxed">
                모든 순간을 모아 자동으로 한 편의 영상으로 편집해 드려요.
              </p>
            </>
          )}

          {/* ── preview ── */}
          {stage === "preview" && (
            <div className="w-full flex flex-col gap-5">
              <div
                className="relative w-full bg-black overflow-hidden"
                style={{ aspectRatio: "9 / 16", maxHeight: "54vh" }}
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

              <button onClick={reRecord} className="btn-quiet text-sm self-center">
                다시 촬영
              </button>
            </div>
          )}

          {/* ── uploading ── */}
          {stage === "uploading" && (
            <div className="notice w-full flex flex-col items-center gap-6" style={{ padding: "40px 20px" }}>
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
            <div className="notice w-full flex flex-col items-center gap-6 text-center" style={{ padding: "40px 20px" }}>
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

              {/* 배지 미리보기 — 워터마크는 무료 플랜에만 들어간다 */}
              {event?.plan !== "paid" && (
                <div className="flex flex-col items-center gap-2">
                  <CongreBadge />
                  <p className="text-[13px] text-muted">
                    곧 Congre 배지가 담긴 편집 영상을 받아보실 수 있어요
                  </p>
                </div>
              )}

              <button onClick={reRecord} className="btn btn-secondary">
                하나 더 올리기
              </button>
            </div>
          )}

          {/* ── error ── */}
          {stage === "error" && (
            <div className="notice w-full flex flex-col items-center gap-6 text-center" style={{ padding: "40px 20px" }}>
              <div className="w-16 h-16 flex items-center justify-center" style={{ border: "1px solid var(--line)" }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ color: "var(--danger)" }}>
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </div>
              <div>
                <p className="text-base text-foreground mb-2">오류가 발생했습니다</p>
                <p className="text-sm leading-relaxed" style={{ color: "var(--danger)" }}>{errorMsg}</p>
              </div>
              <div className="flex gap-4">
                {blobRef.current && (
                  <button onClick={handleUpload} className="btn btn-primary" style={{ height: 44, padding: "0 20px", fontSize: 15 }}>
                    다시 시도
                  </button>
                )}
                <button onClick={reRecord} className="btn btn-secondary" style={{ height: 44, padding: "0 20px", fontSize: 15 }}>
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
