import type { PlanId } from "@/lib/plans";

type ShotstackEnv = "stage" | "production";

function resolveShotstackEnv(): ShotstackEnv {
  const raw =
    process.env.SHOTSTACK_ENV ??
    (process.env.VERCEL_ENV === "production" ? "production" : "stage");

  if (raw === "stage" || raw === "production") return raw;

  console.warn(`[Shotstack] Invalid SHOTSTACK_ENV value: "${raw}". Falling back to "stage".`);
  return "stage";
}

const shotstackEnv = resolveShotstackEnv();

const baseUrl =
  shotstackEnv === "production"
    ? "https://api.shotstack.io/edit/v1"
    : "https://api.shotstack.io/edit/stage";

const probeBaseUrl =
  shotstackEnv === "production"
    ? "https://api.shotstack.io/v1"
    : "https://api.shotstack.io/stage";

const SHOTSTACK_API_KEY = process.env.SHOTSTACK_API_KEY ?? "";

console.log(`[Shotstack] env=${shotstackEnv}`);

function assertApiKey(): void {
  if (!SHOTSTACK_API_KEY) {
    throw new Error(
      `SHOTSTACK_API_KEY is not set. Check your .env.local or Vercel environment variables. (current SHOTSTACK_ENV: ${shotstackEnv})`
    );
  }
}

export async function probeDurationSec(url: string): Promise<number | null> {
  assertApiKey();
  try {
    const res = await fetch(`${probeBaseUrl}/probe/${encodeURIComponent(url)}`, {
      headers: { "x-api-key": SHOTSTACK_API_KEY },
    });
    if (!res.ok) {
      const text = await res.text();
      console.error("[shotstack] probe non-OK:", res.status, text.slice(0, 200));
      return null;
    }
    const json = await res.json() as { success?: boolean; response?: { metadata?: { format?: { duration?: string | number } } } };
    if (!json.success) return null;
    const dur = json.response?.metadata?.format?.duration;
    const n = typeof dur === "number" ? dur : (typeof dur === "string" ? Number(dur) : NaN);
    return Number.isFinite(n) && n > 0 ? n : null;
  } catch (err) {
    console.error("[shotstack] probe failed:", url.slice(0, 100), err);
    return null;
  }
}

function makeTextClip(
  text: string,
  start: number | "auto",
  overlayMode: boolean,
  length: number | "auto" = 3,
) {
  if (!overlayMode) {
    // [B] 분기 — 현재 동작 보존 (검은 배경 단독 클립)
    return {
      asset: {
        type: "rich-text",
        text,
        font: { family: "Noto Sans KR", size: 64, color: "#c8892c" },
        background: { color: "#0c0b09" },
        align: { horizontal: "center", vertical: "middle" },
      },
      start,
      length,
    };
  }
  // [A] 분기 — 미디어 overlay 모드
  return {
    asset: {
      type: "rich-text",
      text,
      font: { family: "Noto Sans KR", size: 64, color: "#c8892c" },
      background: { color: "#0c0b09", opacity: 0.5 },
      stroke: { width: 4, color: "#0c0b09", opacity: 1 },
      align: { horizontal: "center", vertical: "middle" },
    },
    start,
    length,
    transition: { in: "fade", out: "fade" },
  };
}

function makeMediaClip(
  src: string,
  mediaType: "image" | "video",
  start: number | "auto",
): {
  asset: { type: "image" | "video"; src: string };
  start: number | "auto";
  length: number | "auto";
  fit: "contain";
} {
  return {
    asset: { type: mediaType, src },
    start,
    length: mediaType === "image" ? 5 : "auto",
    fit: "contain",
  };
}

const TRANSITION_POOLS = {
  default: ["fadeFast", "slideLeftFast", "slideRightFast", "zoom"],
  soft: ["fade", "fadeSlow"],
  dynamic: ["slideLeftFast", "slideRightFast", "zoom"],
} as const;

type TransitionStyle = keyof typeof TRANSITION_POOLS;

function pickSequence(pool: readonly string[], count: number): string[] {
  const result: string[] = [];
  for (let i = 0; i < count; i++) {
    let pick: string;
    do {
      pick = pool[Math.floor(Math.random() * pool.length)];
    } while (i > 0 && pick === result[i - 1]);
    result.push(pick);
  }
  return result;
}

export async function createRender(
  clips: Array<{ src: string; length: number; name?: string }>,
  intro?: { text?: string; mediaUrl?: string; mediaType?: "image" | "video"; mediaDurationSec?: number },
  outro?: { text?: string; mediaUrl?: string; mediaType?: "image" | "video"; mediaDurationSec?: number },
  plan?: PlanId,
  style?: { filter?: string; transition?: TransitionStyle; showNames?: boolean; bgmSrc?: string; bgmDurationSec?: number },
): Promise<string> {
  assertApiKey();

  const hasIntroMedia = !!(intro?.mediaUrl && intro.mediaType);
  const hasOutroMedia = !!(outro?.mediaUrl && outro.mediaType);
  const useDualTrack = hasIntroMedia || hasOutroMedia;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!appUrl) throw new Error("MISSING_APP_URL");

  const awsRegion = process.env.AWS_REGION;
  const awsBucket = process.env.AWS_S3_BUCKET;
  if (!awsRegion || !awsBucket) throw new Error("MISSING_AWS_REGION_OR_BUCKET");

  const showNames = !!style?.showNames;
  const hasAnyText = !!(intro?.text || outro?.text);
  const fonts: Array<{ src: string }> = [];
  if (hasAnyText || showNames) fonts.push({ src: `${appUrl}/fonts/NotoSansKR-Regular.ttf` });
  if (plan === "free") fonts.push({ src: `${appUrl}/fonts/CormorantGaramond-Italic.ttf` });

  const transitionPool = TRANSITION_POOLS[style?.transition ?? "default"];
  const transitionsIn = pickSequence(transitionPool, clips.length);
  const transitionsOut = pickSequence(transitionPool, clips.length);

  const videoClips = clips.map((clip, i) => ({
    asset: { type: "video", src: clip.src, volumeEffect: "fadeInFadeOut" },
    start: "auto",
    length: clip.length,
    fit: "contain",
    transition: { in: transitionsIn[i], out: transitionsOut[i] },
    ...(style?.filter ? { filter: style.filter } : {}),
  }));

  // 이름 자막 — 영상과 같은 start·length로 별도 텍스트 트랙 또는 textClips에 push.
  // intro 비디오 길이는 probe로 측정해 mediaDurationSec로 받음. probe 실패 시 0(과거 동작).
  let captionStartOffset = 0;
  if (useDualTrack) {
    if (hasIntroMedia && intro!.mediaType === "image") captionStartOffset = 5;
    else if (hasIntroMedia && intro!.mediaType === "video" && intro!.mediaDurationSec) captionStartOffset = intro!.mediaDurationSec;
  } else if (intro?.text) {
    captionStartOffset = 3;
  }
  // textClips 트랙 공유 시 intro text(0-3)와 겹침 방지.
  const introTextEnd = intro?.text ? 3 : 0;
  const captionsOnTextTrack = useDualTrack && captionStartOffset >= introTextEnd;
  if (useDualTrack && !captionsOnTextTrack && intro?.text) {
    captionStartOffset = Math.max(captionStartOffset, introTextEnd);
  }

  const captionClips: unknown[] = [];
  if (showNames) {
    let cursor = captionStartOffset;
    for (const clip of clips) {
      const name = (clip.name ?? "").trim();
      if (name.length > 0) {
        captionClips.push({
          asset: {
            type: "rich-text",
            text: name,
            font: { family: "Noto Sans KR", size: 36, color: "#ffffff" },
            stroke: { width: 4, color: "#0c0b09", opacity: 1 },
            align: { horizontal: "center", vertical: "bottom" },
          },
          start: cursor,
          length: clip.length,
        });
      }
      cursor += clip.length;
    }
  }

  let tracks: Array<{ clips: unknown[] }>;
  if (useDualTrack) {
    // [A] 분기 — 듀얼 track: track[0] introText overlay, track[1] 미디어
    const textClips = [
      ...(intro?.text ? [makeTextClip(intro.text, 0, true, 3)] : []),
      ...(captionsOnTextTrack ? captionClips : []),
    ];

    const mediaClips = [
      ...(hasIntroMedia ? [makeMediaClip(intro!.mediaUrl!, intro!.mediaType!, 0)] : []),
      ...videoClips,
      ...(hasOutroMedia ? [makeMediaClip(outro!.mediaUrl!, outro!.mediaType!, "auto")] : []),
      ...(outro?.text ? [makeTextClip(outro.text, "auto", false, 3)] : []),
    ];

    tracks = [
      ...(textClips.length > 0 ? [{ clips: textClips }] : []),
      { clips: mediaClips },
    ];

    if (!captionsOnTextTrack && captionClips.length > 0) {
      tracks.unshift({ clips: captionClips });
    }
  } else {
    // [B] 분기 — 단일 track: 현재 동작 그대로 보존
    const allClips = [
      ...(intro?.text ? [makeTextClip(intro.text, 0, false, 3)] : []),
      ...videoClips,
      ...(outro?.text ? [makeTextClip(outro.text, "auto", false, 3)] : []),
    ];
    tracks = [{ clips: allClips }];

    if (captionClips.length > 0) {
      tracks.unshift({ clips: captionClips });
    }
  }

  if (plan === "free") {
    tracks.unshift({
      clips: [
        {
          asset: {
            type: "rich-text",
            text: "made by Congre   \n ",
            font: { family: "Cormorant Garamond", size: 40, color: "#c8892c" },
            align: { horizontal: "right", vertical: "bottom" },
          },
          start: 0,
          length: "end",
          opacity: 0.40,
        },
      ],
    });
  }

  const clipsTotal = clips.reduce((s, c) => s + c.length, 0);
  let introLen = 0;
  let outroLen = 0;
  if (useDualTrack) {
    if (hasIntroMedia) {
      introLen = intro!.mediaType === "image" ? 5 : (intro!.mediaDurationSec ?? 0);
    }
    if (hasOutroMedia) {
      outroLen = outro!.mediaType === "image" ? 5 : (outro!.mediaDurationSec ?? 0);
    }
    if (outro?.text) outroLen += 3;
  } else {
    if (intro?.text) introLen = 3;
    if (outro?.text) outroLen = 3;
  }
  const totalDuration = clipsTotal + introLen + outroLen;

  const OVERLAP = 0.5;
  const bgmSrc = style?.bgmSrc;
  const bgmDur = style?.bgmDurationSec;
  const introVideoOk = !hasIntroMedia || intro!.mediaType !== "video" || (intro!.mediaDurationSec ?? 0) > 0;
  const outroVideoOk = !hasOutroMedia || outro!.mediaType !== "video" || (outro!.mediaDurationSec ?? 0) > 0;
  const canLoopBgm = !!bgmSrc && !!bgmDur && bgmDur > OVERLAP && introVideoOk && outroVideoOk;

  const timeline: {
    background: string;
    tracks: Array<{ clips: unknown[] }>;
    fonts?: Array<{ src: string }>;
    soundtrack?: { src: string; effect: string; volume: number };
  } = {
    background: "#0c0b09",
    tracks,
    ...(fonts.length > 0 ? { fonts } : {}),
  };

  if (canLoopBgm) {
    const D = bgmDur!;
    const step = D - OVERLAP;
    const bgmClips: unknown[] = [];
    let s = 0;
    while (s < totalDuration) {
      const remaining = totalDuration - s;
      if (remaining <= 0) break;
      bgmClips.push({
        asset: { type: "audio", src: bgmSrc, volume: 0.1 },
        start: +s.toFixed(3),
        length: +Math.min(D, remaining).toFixed(3),
      });
      s += step;
    }
    timeline.tracks.push({ clips: bgmClips });
  } else {
    timeline.soundtrack = {
      src: bgmSrc ?? `${appUrl}/audio/bgm.mp3`,
      effect: "fadeInFadeOut",
      volume: 0.1,
    };
  }

  const body = {
    timeline,
    output: {
      format: "mp4",
      fps: 30,
      quality: "high",
      size: { width: 1080, height: 1920 },
      destinations: [
        {
          provider: "s3",
          options: {
            region: awsRegion,
            bucket: awsBucket,
          },
        },
      ],
    },
  };

  console.log("[shotstack] createRender body:", JSON.stringify(body, null, 2));

  const res = await fetch(`${baseUrl}/render`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": SHOTSTACK_API_KEY,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("[shotstack] non-OK response:", res.status, text);
    throw new Error(`shotstack_create:${res.status} ${text.slice(0, 200)}`);
  }

  const json = await res.json() as { response: { id: string } };
  return json.response.id;
}

export async function deleteShotstackAssetsByRenderId(renderId: string): Promise<void> {
  assertApiKey();
  const serveBaseUrl =
    shotstackEnv === "production"
      ? "https://api.shotstack.io/serve/v1"
      : "https://api.shotstack.io/serve/stage";

  const res = await fetch(`${serveBaseUrl}/assets/render/${renderId}`, {
    headers: { "x-api-key": SHOTSTACK_API_KEY },
  });
  if (!res.ok) return;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const json = await res.json() as any;
  const data = json?.data;
  if (!Array.isArray(data) || data.length === 0) return;

  for (const item of data) {
    const assetId = item?.attributes?.id as string | undefined;
    if (!assetId) continue;
    await fetch(`${serveBaseUrl}/assets/${assetId}`, {
      method: "DELETE",
      headers: { "x-api-key": SHOTSTACK_API_KEY },
    });
  }
}

export async function getRenderStatus(
  renderId: string
): Promise<{ status: string; url?: string }> {
  assertApiKey();
  const res = await fetch(`${baseUrl}/render/${renderId}`, {
    headers: { "x-api-key": SHOTSTACK_API_KEY },
  });

  if (!res.ok) {
    throw new Error(`shotstack_status:${res.status}`);
  }

  const json = await res.json() as { response: { status: string; url?: string | null } };
  console.log("[shotstack] getRenderStatus raw:", JSON.stringify(json, null, 2));
  return {
    status: json.response.status,
    url: json.response.url ?? undefined,
  };
}
