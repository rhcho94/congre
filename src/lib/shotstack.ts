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

const CLIP_MAX_SEC = 10; // 녹화 상한. 실제 클립이 짧으면 background로 패딩됨.

export async function createRender(
  s3Urls: string[],
): Promise<string> {
  assertApiKey();
  // subscribeToClips가 uploadedAt 내림차순으로 전달하므로 뒤집어 오름차순(오래된 것 먼저) 배치.
  // 실제 클립이 10초 미만이면 남은 구간은 background(#0c0b09)으로 채워짐.
  // title 클립 제거: Shotstack 기본 폰트가 한글을 지원하지 않아 자막 깨짐 발생.
  const videoClips = [...s3Urls].reverse().map((src, i) => ({
    asset: { type: "video", src },
    start: i * CLIP_MAX_SEC,
    length: CLIP_MAX_SEC,
    fit: "cover",
  }));

  const body = {
    timeline: {
      background: "#0c0b09",
      tracks: [{ clips: videoClips }],
    },
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
    throw new Error(`shotstack_create:${res.status} ${text.slice(0, 200)}`);
  }

  const json = await res.json() as { response: { id: string } };
  return json.response.id;
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
