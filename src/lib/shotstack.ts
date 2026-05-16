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

const SHOTSTACK_API_KEY = process.env.SHOTSTACK_API_KEY ?? "";

console.log(`[Shotstack] env=${shotstackEnv}`);

function assertApiKey(): void {
  if (!SHOTSTACK_API_KEY) {
    throw new Error(
      `SHOTSTACK_API_KEY is not set. Check your .env.local or Vercel environment variables. (current SHOTSTACK_ENV: ${shotstackEnv})`
    );
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
  fit: "cover";
} {
  return {
    asset: { type: mediaType, src },
    start,
    length: mediaType === "image" ? 5 : "auto",
    fit: "cover",
  };
}

const TRANSITION_POOL = [
  "fadeFast",
  "slideLeftFast",
  "slideRightFast",
  "zoom",
] as const;

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
  clips: Array<{ src: string; length: number }>,
  intro?: { text?: string; mediaUrl?: string; mediaType?: "image" | "video" },
  outro?: { text?: string; mediaUrl?: string; mediaType?: "image" | "video" },
): Promise<string> {
  assertApiKey();

  const hasIntroMedia = !!(intro?.mediaUrl && intro.mediaType);
  const hasOutroMedia = !!(outro?.mediaUrl && outro.mediaType);
  const useDualTrack = hasIntroMedia || hasOutroMedia;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!appUrl) throw new Error("MISSING_APP_URL");

  const hasAnyText = !!(intro?.text || outro?.text);
  let fontsSrc: string | undefined;
  if (hasAnyText) {
    fontsSrc = `${appUrl}/fonts/NotoSansKR-Regular.ttf`;
  }

  const transitions = pickSequence(TRANSITION_POOL, clips.length);

  const videoClips = clips.map((clip, i) => ({
    asset: { type: "video", src: clip.src },
    start: "auto",
    length: clip.length,
    trim: 0,
    fit: "cover",
    transition: { in: transitions[i], out: transitions[i] },
  }));

  let tracks;
  if (useDualTrack) {
    // [A] 분기 — 듀얼 track: track[0] introText overlay, track[1] 미디어
    // outroText overlay 폐기 (cross-track 동기화 한계 + probe API WebM 미반환)
    const textClips = [
      ...(intro?.text ? [makeTextClip(intro.text, 0, true, 3)] : []),
    ];

    const mediaClips = [
      ...(hasIntroMedia ? [makeMediaClip(intro!.mediaUrl!, intro!.mediaType!, 0)] : []),
      ...videoClips,
      ...(hasOutroMedia ? [makeMediaClip(outro!.mediaUrl!, outro!.mediaType!, "auto")] : []),
    ];

    tracks = [
      ...(textClips.length > 0 ? [{ clips: textClips }] : []),
      { clips: mediaClips },
    ];
  } else {
    // [B] 분기 — 단일 track: 현재 동작 그대로 보존
    const allClips = [
      ...(intro?.text ? [makeTextClip(intro.text, 0, false, 3)] : []),
      ...videoClips,
      ...(outro?.text ? [makeTextClip(outro.text, "auto", false, 3)] : []),
    ];
    tracks = [{ clips: allClips }];
  }

  const timeline = {
    background: "#0c0b09",
    soundtrack: {
      src: `${appUrl}/audio/bgm.mp3`,
      effect: "fadeInFadeOut",
      volume: 0.1,
    },
    tracks,
    ...(fontsSrc ? { fonts: [{ src: fontsSrc }] } : {}),
  };

  const body = {
    timeline,
    output: {
      format: "mp4",
      fps: 30,
      quality: "high",
      size: { width: 1080, height: 1920 },
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
