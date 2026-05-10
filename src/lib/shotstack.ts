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

function makeTextClip(text: string, start: number | "auto") {
  return {
    asset: {
      type: "rich-text",
      text,
      font: { family: "Noto Sans KR", size: 64, color: "#c8892c" },
      background: { color: "#0c0b09" },
      align: { horizontal: "center", vertical: "middle" },
    },
    start,
    length: 3,
  };
}

export async function createRender(
  s3Urls: string[],
  introText?: string,
  outroText?: string,
): Promise<string> {
  assertApiKey();

  const hasIntroOutro = !!(introText || outroText);
  let fontsSrc: string | undefined;
  if (hasIntroOutro) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL;
    if (!appUrl) throw new Error("MISSING_APP_URL_FOR_INTRO_OUTRO");
    fontsSrc = `${appUrl}/fonts/NotoSansKR-Regular.ttf`;
  }

  const videoClips = [...s3Urls].map((src) => ({
    asset: { type: "video", src },
    start: "auto",
    length: "auto",
    fit: "cover",
  }));

  const allClips = [
    ...(introText ? [makeTextClip(introText, 0)] : []),
    ...videoClips,
    ...(outroText ? [makeTextClip(outroText, "auto")] : []),
  ];

  const timeline = {
    background: "#0c0b09",
    tracks: [{ clips: allClips }],
    ...(fontsSrc ? { fonts: [{ src: fontsSrc }] } : {}),
  };

  const body = {
    timeline,
    output: {
      format: "mp4",
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
