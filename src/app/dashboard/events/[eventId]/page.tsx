"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { QRCodeSVG, QRCodeCanvas } from "qrcode.react";
import { Play, X, Loader2, Eye, EyeOff } from "lucide-react";
import confetti from "canvas-confetti";
import { subscribeToAuthChanges, type User } from "@/lib/auth";
import { isFirebaseConfigured, getFirebaseAuth } from "@/lib/firebase";
import { getClipPlaybackUrl, toggleClipExclusion } from "@/lib/clip-playback";
import { getPresignedUrl, uploadToS3 } from "@/lib/s3";
import CongreBadge from "@/components/CongreBadge";
import AppHeader from "@/components/AppHeader";
import PageBackdrop from "@/components/PageBackdrop";

const statusLabels: Record<string, string> = {
  open: "수집중",
  closed: "마감",
  rendering: "편집 중...",
  done: "편집 완료",
};

const statusBadgeClass: Record<string, string> = {
  open: "badge-live",
  closed: "badge-draft",
  rendering: "badge-draft",
  done: "badge-done",
};

interface KakaoInstance {
  init: (key: string) => void;
  isInitialized: () => boolean;
  Share: { sendDefault: (opts: Record<string, unknown>) => void };
}

interface PreviousVideo {
  s3Key: string;
  url: string;
  doneAt: number;
}

interface ApiEvent {
  id: string;
  title: string;
  date: number | null;
  status: string;
  plan: string | null;
  hostId: string;
  uploadToken?: string;
  videoUrl?: string;
  introText: string | null;
  introMediaKey: string | null;
  introMediaType: "image" | "video" | null;
  outroText: string | null;
  outroMediaKey: string | null;
  outroMediaType: "image" | "video" | null;
  videoFilter: string | null;
  videoTransition: string | null;
  showNames: boolean;
  bgmMood: string | null;
  previousVideos?: PreviousVideo[];
}

interface ApiClip {
  id: string;
  eventId: string;
  s3Key: string;
  uploaderName?: string;
  uploaderPhone?: string;
  thumbKey?: string;
  uploadedAt: number | null;
  excludedAt?: number | null;
}


const dangerBtnStyle: React.CSSProperties = {
  background: "#b91c1c",
  color: "#fff",
};

/**
 * 영상 파일의 재생 시간을 초 단위로 측정한다.
 * 읽기 실패 또는 duration이 유한한 수가 아니면(판정 불가) reject 하지 않고 NaN을 resolve한다.
 * 호출부는 NaN을 "통과"로 처리한다.
 */
function measureVideoDuration(file: File): Promise<number> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement("video");
    video.preload = "metadata";
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(url);
      resolve(Number.isFinite(video.duration) ? video.duration : NaN);
    };
    video.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(NaN);
    };
    video.src = url;
  });
}

export default function EventDetailPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [authChecking, setAuthChecking] = useState(isFirebaseConfigured);
  const [event, setEvent] = useState<ApiEvent | null>(null);
  const [eventLoading, setEventLoading] = useState(true);
  const [clips, setClips] = useState<ApiClip[]>([]);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [showRerenderModal, setShowRerenderModal] = useState(false);
  const [closing, setClosing] = useState(false);
  const [lotteryOpen, setLotteryOpen] = useState(false);
  const [lotteryTargetCount, setLotteryTargetCount] = useState(1);
  const [lotteryWinners, setLotteryWinners] = useState<ApiClip[]>([]);
  const [lotteryCurrentRound, setLotteryCurrentRound] = useState(1);
  const [lotteryPhase, setLotteryPhase] = useState<"setup" | "spinning" | "revealed" | "done">("setup");
  const [lotterySpinningName, setLotterySpinningName] = useState("");
  const [lotteryCurrentWinner, setLotteryCurrentWinner] = useState<ApiClip | null>(null);
  const [copied, setCopied] = useState(false);
  const [shareUrl, setShareUrl] = useState("");
  const [activeClipId, setActiveClipId] = useState<string | null>(null);
  const [playbackUrl, setPlaybackUrl] = useState<string | null>(null);
  const [playbackLoading, setPlaybackLoading] = useState(false);
  const [playbackError, setPlaybackError] = useState<string | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);
  const [kakaoReady, setKakaoReady] = useState(false);
  const qrHiResRef = useRef<HTMLDivElement>(null);
  const inviteInitializedRef = useRef(false);
  const [introText, setIntroText] = useState("");
  const [savedIntroText, setSavedIntroText] = useState("");
  const [savingIntroText, setSavingIntroText] = useState(false);
  const [introMediaKey, setIntroMediaKey] = useState<string | null>(null);
  const [introMediaType, setIntroMediaType] = useState<"image" | "video" | null>(null);
  const [introDisplayUrl, setIntroDisplayUrl] = useState<string | null>(null);
  const [introUploading, setIntroUploading] = useState(false);
  const [outroText, setOutroText] = useState("");
  const [savedOutroText, setSavedOutroText] = useState("");
  const [savingOutroText, setSavingOutroText] = useState(false);
  const [outroMediaKey, setOutroMediaKey] = useState<string | null>(null);
  const [outroMediaType, setOutroMediaType] = useState<"image" | "video" | null>(null);
  const [outroDisplayUrl, setOutroDisplayUrl] = useState<string | null>(null);
  const [outroUploading, setOutroUploading] = useState(false);
  const [videoFilter, setVideoFilter] = useState<string>("");
  const [savedVideoFilter, setSavedVideoFilter] = useState<string>("");
  const [savingVideoFilter, setSavingVideoFilter] = useState(false);
  const [videoTransition, setVideoTransition] = useState<string>("");
  const [savedVideoTransition, setSavedVideoTransition] = useState<string>("");
  const [savingVideoTransition, setSavingVideoTransition] = useState(false);
  const [showNames, setShowNames] = useState(false);
  const [savedShowNames, setSavedShowNames] = useState(false);
  const [savingShowNames, setSavingShowNames] = useState(false);
  const [bgmMood, setBgmMood] = useState<string>("");
  const [savedBgmMood, setSavedBgmMood] = useState<string>("");
  const [savingBgmMood, setSavingBgmMood] = useState(false);

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
    let cancelled = false;
    let timerId: ReturnType<typeof setTimeout> | null = null;

    async function fetchEvent() {
      if (cancelled || document.hidden) return;
      let receivedStatus: string | undefined;
      try {
        const idToken = await getFirebaseAuth().currentUser?.getIdToken();
        if (!idToken || cancelled) return;
        const res = await fetch(`/api/host/events/${eventId}`, {
          headers: { Authorization: `Bearer ${idToken}` },
        });
        if (cancelled) return;
        if (res.status === 404) {
          setEvent(null);
          setEventLoading(false);
          return;
        }
        if (!res.ok) return;
        const evt = await res.json() as ApiEvent;
        if (cancelled) return;
        setEvent(evt);
        setEventLoading(false);
        receivedStatus = evt.status;
        if (!inviteInitializedRef.current) {
          inviteInitializedRef.current = true;
          setIntroText(evt.introText ?? "");
          setSavedIntroText(evt.introText ?? "");
          setIntroMediaKey(evt.introMediaKey ?? null);
          setIntroMediaType(evt.introMediaType ?? null);
          setOutroText(evt.outroText ?? "");
          setSavedOutroText(evt.outroText ?? "");
          setOutroMediaKey(evt.outroMediaKey ?? null);
          setOutroMediaType(evt.outroMediaType ?? null);
          setVideoFilter(evt.videoFilter ?? "");
          setSavedVideoFilter(evt.videoFilter ?? "");
          setVideoTransition(evt.videoTransition ?? "");
          setSavedVideoTransition(evt.videoTransition ?? "");
          setShowNames(evt.showNames === true);
          setSavedShowNames(evt.showNames === true);
          setBgmMood(evt.bgmMood ?? "");
          setSavedBgmMood(evt.bgmMood ?? "");
          if (evt.introMediaKey || evt.outroMediaKey) {
            refreshInviteDisplayUrls(idToken);
          }
        }
        if (evt.uploadToken) {
          setShareUrl(`${window.location.origin}/upload/${eventId}?token=${evt.uploadToken}`);
        }
      } catch (err) {
        console.error("[event-detail] fetchEvent error:", err);
      } finally {
        if (!cancelled && receivedStatus !== "done") {
          timerId = setTimeout(fetchEvent, 5000);
        }
      }
    }

    function onVisibilityEvent() {
      if (!document.hidden) {
        if (timerId) { clearTimeout(timerId); timerId = null; }
        fetchEvent();
      }
    }
    document.addEventListener("visibilitychange", onVisibilityEvent);
    fetchEvent();

    return () => {
      cancelled = true;
      if (timerId) clearTimeout(timerId);
      document.removeEventListener("visibilitychange", onVisibilityEvent);
    };
  }, [eventId, user]);

  useEffect(() => {
    if (!eventId || !user) return;
    let cancelled = false;
    let timerId: ReturnType<typeof setTimeout> | null = null;

    async function fetchClips() {
      if (cancelled || document.hidden) return;
      try {
        const idToken = await getFirebaseAuth().currentUser?.getIdToken();
        if (!idToken || cancelled) return;
        const res = await fetch(`/api/host/clips?eventId=${encodeURIComponent(eventId)}`, {
          headers: { Authorization: `Bearer ${idToken}` },
        });
        if (!res.ok || cancelled) return;
        const data = await res.json() as { clips: ApiClip[] };
        if (!cancelled) setClips(data.clips);
      } catch (err) {
        console.error("[event-detail] fetchClips error:", err);
      } finally {
        if (!cancelled) {
          timerId = setTimeout(fetchClips, 5000);
        }
      }
    }

    function onVisibilityClips() {
      if (!document.hidden) {
        if (timerId) { clearTimeout(timerId); timerId = null; }
        fetchClips();
      }
    }
    document.addEventListener("visibilitychange", onVisibilityClips);
    fetchClips();

    return () => {
      cancelled = true;
      if (timerId) clearTimeout(timerId);
      document.removeEventListener("visibilitychange", onVisibilityClips);
    };
  }, [eventId, user]);

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

  const handlePlayClip = useCallback(async (clip: ApiClip) => {
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

  const handleToggleExclusion = useCallback(async (clip: ApiClip) => {
    const newExcludedAt = clip.excludedAt ? null : Date.now();
    setClips((prev) => prev.map((c) => c.id === clip.id ? { ...c, excludedAt: newExcludedAt } : c));
    try {
      await toggleClipExclusion(clip.id, !clip.excludedAt);
    } catch (err) {
      setClips((prev) => prev.map((c) => c.id === clip.id ? { ...c, excludedAt: clip.excludedAt } : c));
      console.error("[toggleExclusion]", err);
      alert("제외 상태 변경에 실패했습니다.");
    }
  }, []);

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

  useEffect(() => {
    if (introText.trim() === savedIntroText.trim()) return;
    if (introText.trim() === "") return;
    if (!user) return;
    if (event?.status !== "open") return;

    setSavingIntroText(true);
    const timer = setTimeout(async () => {
      try {
        await patchInvite({ introText: introText.trim() });
        setSavedIntroText(introText);
      } catch {
        alert("저장에 실패했습니다.");
      } finally {
        setSavingIntroText(false);
      }
    }, 500);

    return () => {
      clearTimeout(timer);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [introText, savedIntroText, user, event?.status]);

  useEffect(() => {
    if (outroText.trim() === savedOutroText.trim()) return;
    if (outroText.trim() === "") return;
    if (!user) return;
    if (event?.status !== "open") return;

    setSavingOutroText(true);
    const timer = setTimeout(async () => {
      try {
        await patchInvite({ outroText: outroText.trim() });
        setSavedOutroText(outroText);
      } catch {
        alert("저장에 실패했습니다.");
      } finally {
        setSavingOutroText(false);
      }
    }, 500);

    return () => {
      clearTimeout(timer);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [outroText, savedOutroText, user, event?.status]);

  useEffect(() => {
    if (videoFilter === savedVideoFilter) return;
    if (!user) return;
    if (event?.status !== "open") return;

    const timer = setTimeout(async () => {
      setSavingVideoFilter(true);
      try {
        await patchInvite({ videoFilter: videoFilter || null });
        setSavedVideoFilter(videoFilter);
      } catch {
        alert("저장에 실패했습니다.");
      } finally {
        setSavingVideoFilter(false);
      }
    }, 500);

    return () => {
      clearTimeout(timer);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoFilter, savedVideoFilter, user, event?.status]);

  useEffect(() => {
    if (videoTransition === savedVideoTransition) return;
    if (!user) return;
    if (event?.status !== "open") return;

    const timer = setTimeout(async () => {
      setSavingVideoTransition(true);
      try {
        await patchInvite({ videoTransition: videoTransition || null });
        setSavedVideoTransition(videoTransition);
      } catch {
        alert("저장에 실패했습니다.");
      } finally {
        setSavingVideoTransition(false);
      }
    }, 500);

    return () => {
      clearTimeout(timer);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoTransition, savedVideoTransition, user, event?.status]);

  useEffect(() => {
    if (showNames === savedShowNames) return;
    if (!user) return;
    if (event?.status !== "open") return;

    const timer = setTimeout(async () => {
      setSavingShowNames(true);
      try {
        await patchInvite({ showNames: showNames ? true : null });
        setSavedShowNames(showNames);
      } catch {
        alert("저장에 실패했습니다.");
      } finally {
        setSavingShowNames(false);
      }
    }, 500);

    return () => {
      clearTimeout(timer);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showNames, savedShowNames, user, event?.status]);

  useEffect(() => {
    if (bgmMood === savedBgmMood) return;
    if (!user) return;
    if (event?.status !== "open") return;

    const timer = setTimeout(async () => {
      setSavingBgmMood(true);
      try {
        await patchInvite({ bgmMood: bgmMood || null });
        setSavedBgmMood(bgmMood);
      } catch {
        alert("저장에 실패했습니다.");
      } finally {
        setSavingBgmMood(false);
      }
    }, 500);

    return () => {
      clearTimeout(timer);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bgmMood, savedBgmMood, user, event?.status]);

  useEffect(() => {
    if (!lotteryOpen) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [lotteryOpen]);

  function openLottery() {
    setLotteryOpen(true);
    setLotteryTargetCount(1);
    setLotteryWinners([]);
    setLotteryCurrentRound(1);
    setLotteryPhase("setup");
    setLotterySpinningName("");
    setLotteryCurrentWinner(null);
  }

  function closeLottery() {
    setLotteryOpen(false);
    setLotteryTargetCount(1);
    setLotteryWinners([]);
    setLotteryCurrentRound(1);
    setLotteryPhase("setup");
    setLotterySpinningName("");
    setLotteryCurrentWinner(null);
  }

  function startLotterySpin(currentWinners: ApiClip[] = lotteryWinners) {
    const pool = clips.filter((c) => !currentWinners.some((w) => w.id === c.id));
    if (pool.length === 0) return;
    setLotteryPhase("spinning");
    setLotteryCurrentWinner(null);

    const finalWinner = pool[Math.floor(Math.random() * pool.length)];
    const totalDuration = 2500;
    let elapsed = 0;
    let interval = 80;

    const tick = () => {
      if (elapsed >= totalDuration) {
        setLotterySpinningName(finalWinner.uploaderName ?? "(이름 없음)");
        setLotteryCurrentWinner(finalWinner);
        setLotteryPhase("revealed");
        try {
          confetti({ particleCount: 120, spread: 70, origin: { y: 0.5 } });
        } catch (err) {
          console.warn("[lottery] confetti failed:", err);
        }
        return;
      }
      const pick = pool[Math.floor(Math.random() * pool.length)];
      setLotterySpinningName(pick.uploaderName ?? "(이름 없음)");
      elapsed += interval;
      interval = Math.min(400, interval + 18);
      setTimeout(tick, interval);
    };
    tick();
  }

  function advanceLottery() {
    if (!lotteryCurrentWinner) return;
    const nextWinners = [...lotteryWinners, lotteryCurrentWinner];
    setLotteryWinners(nextWinners);
    if (nextWinners.length >= lotteryTargetCount) {
      setLotteryPhase("done");
      setLotteryCurrentWinner(null);
    } else {
      setLotteryCurrentRound(lotteryCurrentRound + 1);
      setLotteryCurrentWinner(null);
      startLotterySpin(nextWinners);
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
      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
      if (!appUrl) {
        console.warn("[kakao-share] NEXT_PUBLIC_APP_URL not set, falling back to direct video URL");
      }
      const shareUrl = appUrl ? `${appUrl}/share/${eventId}` : event.videoUrl;
      K.Share.sendDefault({
        objectType: "feed",
        content: {
          title: event.title,
          description: "Congre로 만든 영상입니다 🎬",
          imageUrl: `${appUrl}/logo.png`,
          link: {
            mobileWebUrl: shareUrl,
            webUrl: shareUrl,
          },
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
      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
      const shareUrl = appUrl ? `${appUrl}/share/${eventId}` : event.videoUrl;
      await navigator.clipboard.writeText(shareUrl);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch (err) {
      console.error("[copy-link] failed:", err);
      alert("링크 복사에 실패했습니다.");
    }
  }

  async function refreshInviteDisplayUrls(idToken: string) {
    try {
      const res = await fetch(`/api/host/events/${eventId}/invite-urls`, {
        headers: { Authorization: `Bearer ${idToken}` },
      });
      if (!res.ok) return;
      const data = await res.json() as {
        introMediaUrl: string | null;
        outroMediaUrl: string | null;
      };
      setIntroDisplayUrl(data.introMediaUrl ?? null);
      setOutroDisplayUrl(data.outroMediaUrl ?? null);
    } catch {
      // silent
    }
  }

  async function patchInvite(body: Record<string, unknown>) {
    const idToken = await getFirebaseAuth().currentUser?.getIdToken();
    if (!idToken) throw new Error("인증 토큰 발급 실패");
    const res = await fetch(`/api/host/events/${eventId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${idToken}` },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`PATCH ${res.status}`);
    return idToken;
  }

  async function handleIntroMediaUpload(file: File) {
    if (file.size > 100 * 1024 * 1024) {
      alert("파일 크기는 100MB 이하만 가능합니다");
      return;
    }
    if (file.type.startsWith("video/")) {
      const durationSec = await measureVideoDuration(file);
      if (Number.isFinite(durationSec) && durationSec > 15) {
        alert("인트로 영상은 15초 이내만 가능합니다");
        return;
      }
    }
    setIntroUploading(true);
    try {
      const mediaType = file.type.startsWith("video/") ? "video" : "image";
      const idTokenForPresign = await getFirebaseAuth().currentUser?.getIdToken();
      if (!idTokenForPresign) throw new Error("인증 토큰 발급 실패");
      const { url, key } = await getPresignedUrl(eventId, file.name, file.type, "intro", { idToken: idTokenForPresign });
      await uploadToS3(url, file, file.type, () => {});
      const idToken = await patchInvite({ introMediaKey: key, introMediaType: mediaType });
      setIntroMediaKey(key);
      setIntroMediaType(mediaType);
      if (idToken) await refreshInviteDisplayUrls(idToken);
    } catch {
      alert("업로드에 실패했습니다.");
    } finally {
      setIntroUploading(false);
    }
  }

  async function handleIntroMediaDelete() {
    const prevKey = introMediaKey;
    const prevType = introMediaType;
    const prevDisplay = introDisplayUrl;
    setIntroMediaKey(null);
    setIntroMediaType(null);
    setIntroDisplayUrl(null);
    try {
      await patchInvite({ introMediaKey: null, introMediaType: null });
    } catch {
      setIntroMediaKey(prevKey);
      setIntroMediaType(prevType);
      setIntroDisplayUrl(prevDisplay);
      alert("삭제에 실패했습니다.");
    }
  }

  async function handleOutroMediaUpload(file: File) {
    if (file.size > 100 * 1024 * 1024) {
      alert("파일 크기는 100MB 이하만 가능합니다");
      return;
    }
    if (file.type.startsWith("video/")) {
      const durationSec = await measureVideoDuration(file);
      if (Number.isFinite(durationSec) && durationSec > 15) {
        alert("아웃트로 영상은 15초 이내만 가능합니다");
        return;
      }
    }
    setOutroUploading(true);
    try {
      const mediaType = file.type.startsWith("video/") ? "video" : "image";
      const idTokenForPresign = await getFirebaseAuth().currentUser?.getIdToken();
      if (!idTokenForPresign) throw new Error("인증 토큰 발급 실패");
      const { url, key } = await getPresignedUrl(eventId, file.name, file.type, "outro", { idToken: idTokenForPresign });
      await uploadToS3(url, file, file.type, () => {});
      const idToken = await patchInvite({ outroMediaKey: key, outroMediaType: mediaType });
      setOutroMediaKey(key);
      setOutroMediaType(mediaType);
      if (idToken) await refreshInviteDisplayUrls(idToken);
    } catch {
      alert("업로드에 실패했습니다.");
    } finally {
      setOutroUploading(false);
    }
  }

  async function handleOutroMediaDelete() {
    const prevKey = outroMediaKey;
    const prevType = outroMediaType;
    const prevDisplay = outroDisplayUrl;
    setOutroMediaKey(null);
    setOutroMediaType(null);
    setOutroDisplayUrl(null);
    try {
      await patchInvite({ outroMediaKey: null, outroMediaType: null });
    } catch {
      setOutroMediaKey(prevKey);
      setOutroMediaType(prevType);
      setOutroDisplayUrl(prevDisplay);
      alert("삭제에 실패했습니다.");
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

  async function callRenderStart(idToken: string, eventId: string): Promise<boolean> {
    const renderRes = await fetch("/api/render/start", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify({ eventId }),
    });

    if (!renderRes.ok) {
      const body = await renderRes.json().catch(() => ({})) as { error?: string };
      const code = body.error;

      let message: string;
      if (code === "NO_CLIPS_AFTER_EXCLUSION") {
        message = "선택된 클립이 없어요. 제외를 해제한 뒤 [영상 생성 다시 시작] 버튼을 눌러주세요.";
      } else if (code === "NO_CLIPS") {
        message = "업로드된 클립이 없어요.";
      } else if (code === "NOT_CONFIGURED") {
        message = "서버 설정 오류로 영상 생성을 시작하지 못했어요. 운영자에게 문의해주세요.";
      } else if (code === "PAID_NOT_AVAILABLE") {
        message = "유료 플랜은 현재 준비 중입니다.";
      } else {
        message = `영상 생성 시작에 실패했습니다 (${code ?? renderRes.status}). 운영자에게 문의해주세요.`;
      }
      alert(message);
      return false;
    }

    return true;
  }

  async function handleClose() {
    if (event?.plan === "paid") {
      setShowCloseModal(false);
      router.push(`/payment/${eventId}`);
      return;
    }
    setClosing(true);
    try {
      const idToken = await getFirebaseAuth().currentUser?.getIdToken();
      if (!idToken) throw new Error("인증 토큰 발급 실패");

      const closeRes = await fetch(`/api/events/${eventId}/close`, {
        method: "POST",
        headers: { Authorization: `Bearer ${idToken}` },
      });
      if (!closeRes.ok) throw new Error(`close failed: ${closeRes.status}`);
      setShowCloseModal(false);

      if (clips.length > 0 && event) {
        await callRenderStart(idToken, eventId);
      }

    } catch {
      alert("마감 처리 중 오류가 발생했습니다.");
    } finally {
      setClosing(false);
    }
  }

  async function handleRestartRender() {
    setClosing(true);
    try {
      const idToken = await getFirebaseAuth().currentUser?.getIdToken();
      if (!idToken) throw new Error("인증 토큰 발급 실패");
      await callRenderStart(idToken, eventId);
    } catch {
      alert("영상 생성 시작 중 오류가 발생했습니다.");
    } finally {
      setClosing(false);
    }
  }

  if (authChecking || eventLoading) {
    return (
      <>
        <PageBackdrop pattern="c" />
        <div className="min-h-screen flex items-center justify-center">
          <p className="eyebrow animate-pulse">로딩 중...</p>
        </div>
      </>
    );
  }

  if (!event) {
    return (
      <>
        <PageBackdrop pattern="c" />
        <div className="min-h-screen flex flex-col items-center justify-center gap-4">
          <p className="text-muted text-sm">이벤트를 찾을 수 없습니다.</p>
          <Link href="/dashboard" className="btn-quiet text-xs tracking-widest uppercase text-accent">
            ← 대시보드
          </Link>
        </div>
      </>
    );
  }

  const isClosed = event.status !== "open";
  const includedCount = clips.filter((c) => !c.excludedAt).length;

  return (
    <>
      <PageBackdrop pattern="c" />
      <div className="min-h-screen">
        {/* Close confirmation modal */}
        {showCloseModal && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-6">
            <div className="notice max-w-sm w-full">
              <p className="display text-lg mb-3">정말 마감하시겠습니까?</p>
              <p className="text-sm text-muted mb-6 leading-relaxed">
                마감하면 참가자들이 더 이상 영상을 업로드할 수 없습니다.
                <br />
                <strong className="text-foreground">
                  {event.plan === "paid"
                    ? "다음 화면에서 결제를 완료하면 마감됩니다. 결제 전에는 마감되지 않습니다."
                    : "이 작업은 되돌릴 수 없습니다."}
                </strong>
              </p>
              <div className="flex gap-3">
                <button onClick={() => setShowCloseModal(false)} disabled={closing} className="btn btn-secondary flex-1">
                  취소
                </button>
                <button onClick={handleClose} disabled={closing} className="btn flex-1" style={dangerBtnStyle}>
                  {closing ? "처리 중..." : "마감 확인"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Rerender confirmation modal */}
        {showRerenderModal && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-6">
            <div className="notice max-w-sm w-full">
              <p className="display text-lg mb-3">완성본을 다시 만들까요?</p>
              <p className="text-sm text-muted mb-4 leading-relaxed">
                다시 만들기 전에 아래 목록에서 참가자 영상을 다시 고르거나, 대시보드에서 인트로·아웃트로를 바꿀 수 있어요.
              </p>
              <p className="text-sm text-muted mb-6">
                현재 전체 {clips.length}개 중 {includedCount}개 포함
              </p>
              {event.plan === "paid" && (
                <p className="text-sm text-muted mb-6">
                  처음 결제 금액의 80%가 부과돼요. 참가자 영상 보관 기간(48시간)이 지나면 다시 만들 수 없어요.
                </p>
              )}
              {includedCount === 0 && (
                <p className="text-sm mb-4" style={{ color: "#e05252" }}>
                  포함된 클립이 없어요. 제외를 해제해주세요.
                </p>
              )}
              <div className="flex gap-3">
                <button onClick={() => setShowRerenderModal(false)} disabled={closing} className="btn btn-secondary flex-1">
                  취소
                </button>
                <button
                  onClick={() => {
                    setShowRerenderModal(false);
                    if (event.plan === "paid") {
                      router.push(`/payment/${eventId}`);
                    } else {
                      handleRestartRender();
                    }
                  }}
                  disabled={includedCount === 0 || closing}
                  className="btn btn-primary flex-1"
                >
                  {closing ? "처리 중..." : event.plan === "paid" ? "결제하고 만들기" : "다시 만들기"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Lottery modal */}
        {lotteryOpen && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-6">
            <div className="notice max-w-md w-full" style={{ maxHeight: "90vh", overflowY: "auto" }}>
              {lotteryPhase === "setup" && (
                <>
                  <p className="display text-xl mb-2">추첨 시작</p>
                  <p className="text-sm text-muted mb-6 leading-relaxed">
                    몇 명을 뽑을까요? (최대 {clips.length}명)
                  </p>
                  <div className="flex flex-col gap-1.5 mb-6">
                    <span className="text-xs text-muted">인원 수</span>
                    <input
                      type="number"
                      min={1}
                      max={clips.length}
                      value={lotteryTargetCount}
                      onChange={(e) => {
                        const n = parseInt(e.target.value, 10);
                        if (Number.isFinite(n)) {
                          setLotteryTargetCount(Math.min(Math.max(1, n), clips.length));
                        }
                      }}
                      className="input"
                      style={{ height: "auto", padding: "12px 14px" }}
                    />
                  </div>
                  <div className="flex gap-3">
                    <button onClick={closeLottery} className="btn btn-secondary flex-1">
                      닫기
                    </button>
                    <button onClick={() => startLotterySpin([])} className="btn btn-primary flex-1">
                      시작
                    </button>
                  </div>
                </>
              )}

              {lotteryPhase === "spinning" && (
                <div className="flex flex-col items-center gap-6 py-8">
                  <p className="eyebrow">
                    {lotteryCurrentRound} / {lotteryTargetCount}
                  </p>
                  <p
                    className="display text-center"
                    style={{ fontSize: "2.5rem", lineHeight: 1.2, minHeight: "3rem" }}
                  >
                    {lotterySpinningName || "..."}
                  </p>
                  <p className="text-xs text-muted">추첨 중...</p>
                </div>
              )}

              {lotteryPhase === "revealed" && lotteryCurrentWinner && (
                <div className="flex flex-col items-center gap-5 py-6">
                  <p className="eyebrow">
                    {lotteryCurrentRound} / {lotteryTargetCount}
                  </p>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`/api/clips/${lotteryCurrentWinner.id}/thumb`}
                    alt={lotteryCurrentWinner.uploaderName ?? "winner"}
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = "/logo.png";
                    }}
                    style={{
                      width: 200,
                      height: 200,
                      objectFit: "cover",
                      borderRadius: "var(--r-md)",
                      border: "2px solid var(--accent)",
                    }}
                  />
                  <p className="display text-3xl text-center">
                    {lotteryCurrentWinner.uploaderName ?? "(이름 없음)"}
                  </p>
                  <p className="eyebrow" style={{ color: "var(--accent)" }}>당첨</p>
                  <div className="flex gap-3 w-full">
                    <button onClick={closeLottery} className="btn btn-secondary flex-1">
                      중단
                    </button>
                    <button onClick={advanceLottery} className="btn btn-primary flex-1">
                      {lotteryCurrentRound < lotteryTargetCount ? "다음" : "결과 보기"}
                    </button>
                  </div>
                </div>
              )}

              {lotteryPhase === "done" && (
                <>
                  <p className="display text-xl mb-1">당첨자 {lotteryWinners.length}명</p>
                  <p className="text-xs text-muted mb-5">결과는 저장되지 않습니다.</p>
                  <div className="flex flex-col gap-2 mb-6">
                    {lotteryWinners.map((w, i) => (
                      <div
                        key={w.id}
                        className="glass-panel flex items-center gap-3"
                        style={{ padding: "8px 12px" }}
                      >
                        <span className="text-xs text-muted tabular-nums shrink-0">
                          #{i + 1}
                        </span>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={`/api/clips/${w.id}/thumb`}
                          alt={w.uploaderName ?? "winner"}
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src = "/logo.png";
                          }}
                          style={{
                            width: 48,
                            height: 48,
                            objectFit: "cover",
                            borderRadius: "var(--r-sm)",
                          }}
                        />
                        <span className="text-sm text-foreground flex-1 truncate">
                          {w.uploaderName ?? "(이름 없음)"}
                        </span>
                      </div>
                    ))}
                  </div>
                  <button onClick={closeLottery} className="btn btn-primary w-full">
                    닫기
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        <AppHeader>
          <div className="flex items-center gap-3 sm:gap-4">
            <Link href="/guide/host" className="btn-quiet text-xs tracking-widest uppercase whitespace-nowrap">
              사용 가이드
            </Link>
            <Link href="/mypage" className="btn-quiet text-xs tracking-widest uppercase whitespace-nowrap">
              마이페이지
            </Link>
            <Link href="/dashboard" className="btn-quiet text-xs tracking-widest uppercase whitespace-nowrap">
              ← 대시보드
            </Link>
          </div>
        </AppHeader>

        <main className="mx-auto max-w-3xl px-6 py-16">
          {/* Event header */}
          <div className="flex items-start justify-between mb-10 gap-4">
            <div className="min-w-0">
              <p className="eyebrow mb-2">Event</p>
              <h1 className="display text-3xl">{event.title}</h1>
              <p className="text-xs text-muted mt-2">
                {event.date ? new Date(event.date).toLocaleDateString("ko-KR") : ""}
              </p>
            </div>
            <div className="flex flex-col items-end gap-3 shrink-0">
              <span className={`badge ${statusBadgeClass[event.status] ?? "badge-draft"}`}>
                {statusLabels[event.status]}
              </span>
              {!isClosed && (
                <button
                  onClick={() => setShowCloseModal(true)}
                  disabled={closing}
                  className="btn"
                  style={{ ...dangerBtnStyle, height: 40, padding: "0 16px", fontSize: 13 }}
                >
                  마감하기
                </button>
              )}
              {event.status === "closed" && clips.length > 0 && (
                <button
                  onClick={() => setShowRerenderModal(true)}
                  disabled={closing}
                  className="btn btn-primary"
                  style={{ height: 40, padding: "0 16px", fontSize: 13 }}
                >
                  {closing ? "처리 중..." : "영상 생성 다시 시작"}
                </button>
              )}
              {clips.length > 0 && (
                <button
                  onClick={openLottery}
                  className="btn btn-secondary"
                  style={{ height: 40, padding: "0 16px", fontSize: 13 }}
                >
                  추첨
                </button>
              )}
            </div>
          </div>

          <div className="hr mb-8" />

          {/* 렌더링 / 완성 상태 */}
          {event.status === "rendering" ? (
            <div className="notice mb-8">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-2 h-2 rounded-full bg-[#7b8ce0] animate-pulse" />
                <p className="text-sm text-muted">AI가 영상을 편집하고 있습니다...</p>
              </div>
              <p className="text-xs text-muted opacity-60 pl-5">
                3~5분 소요 · 완료되면 자동으로 업데이트됩니다
              </p>
            </div>
          ) : event.status === "done" ? (
            <div className="mb-8">
              {event.videoUrl ? (
                <div className="glass-panel flex flex-col gap-4">
                  <div className="flex items-center gap-2">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#5ba06e" strokeWidth="1.5">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    <p className="eyebrow" style={{ color: "#5ba06e" }}>편집 완료</p>
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
                    style={{ aspectRatio: "9/16", background: "#0c0b09", borderRadius: "var(--r-sm)" }}
                  />

                  {/* 영상 다운로드 — 주인공 (전체폭 primary) */}
                  <a
                    href={event.videoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-primary w-full"
                  >
                    영상 다운로드 →
                  </a>

                  {/* SNS 공유 — 보조 행, 작게 */}
                  <div className="pt-3" style={{ borderTop: "1px solid var(--hairline)" }}>
                    <p className="eyebrow mb-3">공유하기</p>
                    <div className="flex gap-2">
                      <button
                        onClick={handleKakaoShare}
                        disabled={Boolean(process.env.NEXT_PUBLIC_KAKAO_APP_KEY) && !kakaoReady}
                        className="btn btn-kakao"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="#3C1E1E">
                          <path d="M12 3C6.48 3 2 6.69 2 11.25c0 2.87 1.7 5.39 4.31 6.95L5.25 21l3.96-2.12A12.2 12.2 0 0 0 12 19.5c5.52 0 10-3.69 10-8.25S17.52 3 12 3z" />
                        </svg>
                        카카오톡
                      </button>
                      <button onClick={handleLinkCopy} className="btn btn-secondary" style={{ height: 46, padding: "0 18px", fontSize: 14 }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                        </svg>
                        {linkCopied ? "복사됨!" : "링크 복사"}
                      </button>
                    </div>
                  </div>

                  {clips.length > 0 && (
                    <>
                      <p className="text-sm text-muted" style={{ marginTop: 4 }}>
                        참가자 영상은 완성본이 나온 뒤 48시간까지 보관돼요. 그 뒤에는 다시 만들 수 없어요.
                      </p>
                      <button
                        onClick={() => setShowRerenderModal(true)}
                        disabled={closing}
                        className="btn btn-secondary w-full"
                      >
                        영상 다시 만들기
                      </button>
                    </>
                  )}
                </div>
              ) : (
                <div className="notice flex items-center gap-3">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#5ba06e" strokeWidth="1.5">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <p className="text-sm" style={{ color: "#5ba06e" }}>편집이 완료되었습니다</p>
                </div>
              )}
            </div>

          ) : null}

          {/* 이전 완성본 */}
          {event.status === "done" && (event.previousVideos?.length ?? 0) > 0 && (
            <div className="mb-8">
              <p className="eyebrow mb-3" style={{ color: "var(--accent)" }}>이전 완성본</p>
              <div className="flex flex-col gap-0">
                {(event.previousVideos ?? []).map((pv) => (
                  <div
                    key={pv.s3Key}
                    className="flex items-center justify-between py-3 border-b border-[var(--hairline)]"
                  >
                    <span className="text-xs text-foreground">
                      {new Date(pv.doneAt).toLocaleString("ko-KR", { timeZone: "Asia/Seoul" })}
                    </span>
                    <a
                      href={pv.url}
                      download
                      className="btn btn-secondary"
                      style={{ height: 32, padding: "0 12px", fontSize: 12 }}
                    >
                      다운로드
                    </a>
                  </div>
                ))}
              </div>
              <p className="text-xs mt-3" style={{ color: "var(--muted)" }}>
                이전 완성본은 만들어진 날로부터 7일 후 자동 삭제됩니다.
              </p>
            </div>
          )}

          {/* 영상 시작·끝 꾸미기 */}
          <div className={`panel mb-8 ${isClosed ? "opacity-60" : ""}`}>
            <p className="eyebrow mb-1" style={{ color: "var(--accent)" }}>선택 옵션 — 영상 시작·끝 꾸미기</p>
            <p className="text-xs text-muted mb-1 leading-relaxed">참가자 영상을 기다리는 동안, 인트로·아웃트로·음악·색감을 골라 완성본을 더 멋지게 꾸며보세요</p>
            <p className="text-xs text-muted mb-5 leading-relaxed">
              이벤트 영상 시작과 끝에 짧은 동영상, 텍스트, 사진을 추가할 수 있어요. 비워두면 참가자 영상만으로 만들어집니다.
              <br />
              📱 세로 영상(9:16)을 권장해요.
            </p>

            <div className="flex flex-col gap-6">
              {/* 영상 시작 화면 */}
              <div className="flex flex-col gap-3">
                <span className="eyebrow">영상 시작 화면</span>

                <div className="flex flex-col gap-1.5">
                  <span className="flex items-center justify-between">
                    <span className="text-xs text-muted">텍스트</span>
                    <span className="text-xs text-muted">{introText.length} / 60</span>
                  </span>
                  <textarea
                    rows={2}
                    maxLength={60}
                    placeholder="예: 결혼식이 시작됩니다"
                    value={introText}
                    onChange={(e) => setIntroText(e.target.value)}
                    disabled={isClosed}
                    className="input resize-none"
                    style={{ height: "auto", padding: "12px 14px" }}
                  />
                  {(introText.trim() !== "" || savedIntroText.trim() !== "") && !isClosed ? (
                    <span className="self-end text-xs text-muted">
                      {savingIntroText
                        ? "저장 중..."
                        : introText !== savedIntroText
                        ? "변경 중..."
                        : <span style={{ color: "var(--accent)" }}>✓ 저장됨</span>
                      }
                    </span>
                  ) : null}
                </div>

                <div className="flex flex-col gap-1.5">
                  <span className="text-xs text-muted">미디어 (이미지 또는 영상)</span>
                  <span className="text-xs text-accent">영상은 15초까지 · 파일 100MB 이하 (사진은 길이 제한 없음)</span>
                  {introUploading ? (
                    <div className="flex items-center gap-2 py-4">
                      <Loader2 size={14} className="animate-spin text-accent" />
                      <span className="text-xs text-muted">업로드 중...</span>
                    </div>
                  ) : introDisplayUrl ? (
                    <div className="relative inline-block self-start">
                      {introMediaType === "video" ? (
                        <video src={introDisplayUrl} controls playsInline className="max-h-48 object-cover" />
                      ) : (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={introDisplayUrl} alt="인트로 미디어" className="max-h-48 object-cover" />
                      )}
                      {!isClosed && (
                        <button
                          onClick={handleIntroMediaDelete}
                          className="absolute top-2 right-2 px-2 py-1 text-xs text-white transition-all duration-200"
                          style={{ background: "rgba(0,0,0,0.6)" }}
                        >
                          삭제
                        </button>
                      )}
                    </div>
                  ) : !isClosed ? (
                    <label className="btn btn-secondary cursor-pointer self-start" style={{ height: 40, padding: "0 16px", fontSize: 12 }}>
                      + 미디어 선택
                      <input
                        type="file"
                        accept="image/*,video/*"
                        className="sr-only"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleIntroMediaUpload(file);
                          e.target.value = "";
                        }}
                      />
                    </label>
                  ) : null}
                </div>
              </div>

              {/* 영상 마무리 화면 */}
              <div className="flex flex-col gap-3">
                <span className="eyebrow">영상 마무리 화면</span>

                <div className="flex flex-col gap-1.5">
                  <span className="flex items-center justify-between">
                    <span className="text-xs text-muted">텍스트</span>
                    <span className="text-xs text-muted">{outroText.length} / 60</span>
                  </span>
                  <textarea
                    rows={2}
                    maxLength={60}
                    placeholder="예: 함께해 주셔서 감사합니다"
                    value={outroText}
                    onChange={(e) => setOutroText(e.target.value)}
                    disabled={isClosed}
                    className="input resize-none"
                    style={{ height: "auto", padding: "12px 14px" }}
                  />
                  {(outroText.trim() !== "" || savedOutroText.trim() !== "") && !isClosed ? (
                    <span className="self-end text-xs text-muted">
                      {savingOutroText
                        ? "저장 중..."
                        : outroText !== savedOutroText
                        ? "변경 중..."
                        : <span style={{ color: "var(--accent)" }}>✓ 저장됨</span>
                      }
                    </span>
                  ) : null}
                </div>

                <div className="flex flex-col gap-1.5">
                  <span className="text-xs text-muted">미디어 (이미지 또는 영상)</span>
                  <span className="text-xs text-accent">영상은 15초까지 · 파일 100MB 이하 (사진은 길이 제한 없음)</span>
                  <span className="text-xs text-muted">아웃트로 문구를 함께 넣으면 미디어가 끝난 뒤 이어서 나와요</span>
                  {outroUploading ? (
                    <div className="flex items-center gap-2 py-4">
                      <Loader2 size={14} className="animate-spin text-accent" />
                      <span className="text-xs text-muted">업로드 중...</span>
                    </div>
                  ) : outroDisplayUrl ? (
                    <div className="relative inline-block self-start">
                      {outroMediaType === "video" ? (
                        <video src={outroDisplayUrl} controls playsInline className="max-h-48 object-cover" />
                      ) : (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={outroDisplayUrl} alt="아웃트로 미디어" className="max-h-48 object-cover" />
                      )}
                      {!isClosed && (
                        <button
                          onClick={handleOutroMediaDelete}
                          className="absolute top-2 right-2 px-2 py-1 text-xs text-white transition-all duration-200"
                          style={{ background: "rgba(0,0,0,0.6)" }}
                        >
                          삭제
                        </button>
                      )}
                    </div>
                  ) : !isClosed ? (
                    <label className="btn btn-secondary cursor-pointer self-start" style={{ height: 40, padding: "0 16px", fontSize: 12 }}>
                      + 미디어 선택
                      <input
                        type="file"
                        accept="image/*,video/*"
                        className="sr-only"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleOutroMediaUpload(file);
                          e.target.value = "";
                        }}
                      />
                    </label>
                  ) : null}
                </div>
              </div>
            </div>
          </div>

          {/* 영상 스타일 */}
          <div className={`panel mb-8 ${isClosed ? "opacity-60" : ""}`}>
            <p className="eyebrow mb-1" style={{ color: "var(--accent)" }}>선택 옵션 — 영상 스타일</p>
            <p className="text-xs text-muted mb-5 leading-relaxed">
              참가자 영상 전체에 적용될 색감과 전환 방식을 선택할 수 있어요. 비워두면 기본 스타일로 만들어집니다.
            </p>

            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-1.5">
                <span className="text-xs text-muted">색감</span>
                <select
                  value={videoFilter}
                  onChange={(e) => setVideoFilter(e.target.value)}
                  disabled={isClosed}
                  className="input"
                  style={{ height: "auto", padding: "12px 14px", colorScheme: "dark" }}
                >
                  <option value="">없음</option>
                  <option value="muted">시네마틱</option>
                  <option value="boost">화사하게</option>
                  <option value="contrast">또렷하게</option>
                </select>
                {(videoFilter !== "" || savedVideoFilter !== "") && !isClosed ? (
                  <span className="self-end text-xs text-muted">
                    {savingVideoFilter
                      ? "저장 중..."
                      : videoFilter !== savedVideoFilter
                      ? "변경 중..."
                      : <span style={{ color: "var(--accent)" }}>✓ 저장됨</span>
                    }
                  </span>
                ) : null}
              </div>

              <div className="flex flex-col gap-1.5">
                <span className="text-xs text-muted">음악 분위기</span>
                <select
                  value={bgmMood}
                  onChange={(e) => setBgmMood(e.target.value)}
                  disabled={isClosed}
                  className="input"
                  style={{ height: "auto", padding: "12px 14px", colorScheme: "dark" }}
                >
                  <option value="">경쾌하게 (기본)</option>
                  <option value="calm">잔잔하게</option>
                  <option value="epic">벅차게</option>
                </select>
                {(bgmMood !== "" || savedBgmMood !== "") && !isClosed ? (
                  <span className="self-end text-xs text-muted">
                    {savingBgmMood
                      ? "저장 중..."
                      : bgmMood !== savedBgmMood
                      ? "변경 중..."
                      : <span style={{ color: "var(--accent)" }}>✓ 저장됨</span>
                    }
                  </span>
                ) : null}
              </div>

              <div className="flex flex-col gap-1.5">
                <span className="text-xs text-muted">전환</span>
                <select
                  value={videoTransition}
                  onChange={(e) => setVideoTransition(e.target.value)}
                  disabled={isClosed}
                  className="input"
                  style={{ height: "auto", padding: "12px 14px", colorScheme: "dark" }}
                >
                  <option value="">기본</option>
                  <option value="soft">부드럽게</option>
                  <option value="dynamic">역동적으로</option>
                </select>
                {(videoTransition !== "" || savedVideoTransition !== "") && !isClosed ? (
                  <span className="self-end text-xs text-muted">
                    {savingVideoTransition
                      ? "저장 중..."
                      : videoTransition !== savedVideoTransition
                      ? "변경 중..."
                      : <span style={{ color: "var(--accent)" }}>✓ 저장됨</span>
                    }
                  </span>
                ) : null}
              </div>

              <div className="flex flex-col gap-1.5">
                <span className="text-xs text-muted">참가자 이름 표시</span>
                <label className="flex items-center gap-2 cursor-pointer" style={{ padding: "8px 0" }}>
                  <input
                    type="checkbox"
                    checked={showNames}
                    onChange={(e) => setShowNames(e.target.checked)}
                    disabled={isClosed}
                  />
                  <span className="text-xs text-foreground">각 영상 하단에 업로더 이름을 자막으로 표시</span>
                </label>
                {(showNames || savedShowNames) && !isClosed ? (
                  <span className="self-end text-xs text-muted">
                    {savingShowNames
                      ? "저장 중..."
                      : showNames !== savedShowNames
                      ? "변경 중..."
                      : <span style={{ color: "var(--accent)" }}>✓ 저장됨</span>
                    }
                  </span>
                ) : null}
              </div>
            </div>
          </div>

          {/* Clips list */}
          <div>
            <p className="eyebrow mb-4" style={{ color: "var(--accent)" }}>업로드된 클립 ({clips.length}개)</p>
            {clips.length === 0 ? (
              <p className="text-muted text-sm py-8 text-center">아직 업로드된 클립이 없습니다.</p>
            ) : (
              <div className="flex flex-col gap-0">
                {clips.map((clip, i) => {
                  const isActive = activeClipId === clip.id;
                  return (
                    <div key={clip.id} className="flex flex-col py-2 border-b border-[var(--hairline)]" style={clip.excludedAt ? { opacity: 0.45 } : {}}>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs text-muted tabular-nums shrink-0">
                          #{clips.length - i}
                        </span>
                        <div className="flex flex-col mx-4 flex-1 min-w-0">
                          <span className="text-xs text-foreground truncate">
                            {clip.uploaderName ?? <span className="text-muted">(이름 없음)</span>}
                          </span>
                        </div>
                        <button
                          onClick={() => handleToggleExclusion(clip)}
                          disabled={event.status === "rendering"}
                          className="shrink-0 flex items-center gap-1 px-2.5 py-1.5 text-xs tracking-widest uppercase transition-all duration-200 mr-2"
                          style={
                            clip.excludedAt
                              ? { border: "1px solid #e05252", color: "#e05252", borderRadius: "var(--r-sm)", ...(event.status === "rendering" ? { opacity: 0.4, cursor: "not-allowed" } : {}) }
                              : { border: "1px solid var(--hairline-strong)", color: "var(--muted)", borderRadius: "var(--r-sm)", ...(event.status === "rendering" ? { opacity: 0.4, cursor: "not-allowed" } : {}) }
                          }
                          aria-label={clip.excludedAt ? "복원" : "제외"}
                        >
                          {clip.excludedAt ? (
                            <EyeOff size={11} strokeWidth={2} />
                          ) : (
                            <Eye size={11} strokeWidth={2} />
                          )}
                        </button>
                        <button
                          onClick={() => handlePlayClip(clip)}
                          className="shrink-0 flex items-center gap-1 px-2.5 py-1.5 text-xs tracking-widest uppercase transition-all duration-200"
                          style={
                            isActive
                              ? { border: "1px solid var(--accent)", color: "var(--accent)", borderRadius: "var(--r-sm)" }
                              : { border: "1px solid var(--hairline-strong)", color: "var(--muted)", borderRadius: "var(--r-sm)" }
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
                        <div className="mt-4">
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
                              className="w-full max-w-xs mx-auto block"
                              style={{ aspectRatio: "9/16", background: "var(--surface-1)", borderRadius: "var(--r-sm)" }}
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

          {/* QR & 공유 — open일 때만 */}
          {event.status === "open" && shareUrl && (
            <div className="mb-8">
              <p className="eyebrow mb-4" style={{ color: "var(--accent)" }}>참가자 초대</p>
              <div className="glass-panel flex flex-col sm:flex-row gap-6">
                <div className="shrink-0 flex flex-col items-center gap-2">
                  <QRCodeSVG value={shareUrl} size={140} bgColor="#151310" fgColor="#ede8df" level="M" />
                  <button onClick={handleQRDownload} className="btn btn-secondary" style={{ height: 32, padding: "0 12px", fontSize: 11 }}>
                    QR 이미지 저장
                  </button>
                </div>
                <div className="flex-1 min-w-0 flex flex-col justify-center gap-3">
                  <p className="text-xs text-muted leading-relaxed">
                    아래 QR이나 링크를 참가자에게 공유해 영상을 모으세요
                  </p>
                  <div className="flex items-center gap-2">
                    <span
                      className="flex-1 min-w-0 text-xs text-foreground px-3 py-2 truncate font-mono"
                      style={{ background: "var(--surface-2)", border: "1px solid var(--hairline)", borderRadius: "var(--r-sm)" }}
                    >
                      {shareUrl}
                    </span>
                    <button onClick={handleCopy} className="btn btn-secondary shrink-0" style={{ height: 36, padding: "0 14px", fontSize: 12 }}>
                      {copied ? "복사됨" : "복사"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>

        {/* 고해상도 QR 다운로드용 히든 캔버스 */}
        {shareUrl && (
          <div
            ref={qrHiResRef}
            aria-hidden="true"
            style={{ position: "fixed", left: "-9999px", top: 0 }}
          >
            <QRCodeCanvas value={shareUrl} size={512} bgColor="#ffffff" fgColor="#151310" level="H" />
          </div>
        )}
      </div>
    </>
  );
}
