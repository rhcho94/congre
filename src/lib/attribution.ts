// 광고 유입 정보 — 첫 방문 때 주소에 붙은 utm_* · fbclid를 쿠키에 적어 두고,
// 가입할 때 서버가 읽어 users 문서에 붙인다. 결제는 가입 며칠 ~ 몇 주 뒤라 메타 집계로는 잇지 못하기 때문이다.
// 처음 온 유입만 남긴다(이미 쿠키가 있으면 덮어쓰지 않는다).
// 광고는 랜딩(www.congre.kr)에 도착하고 가입은 앱(app.congre.kr)에서 하므로 쿠키를 congre.kr 전체에서 읽게 적는다.
// 랜딩 쪽 짝은 git 밖 deploy/visit.js — 쿠키 이름 · 모양을 바꾸면 그 파일도 같이 바꾼다.

export const ATTRIBUTION_COOKIE = "cg_attr";
const COOKIE_ROOT_DOMAIN = "congre.kr";
const MAX_AGE_SECONDS = 90 * 24 * 60 * 60;
const MAX_VALUE_LENGTH = 500;

const KEYS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
  "fbclid",
] as const;

type AttributionKey = (typeof KEYS)[number];

export type Attribution = Partial<Record<AttributionKey, string>> & {
  landingPath: string; // 처음 본 화면 — "호스트이름/경로" (예: www.congre.kr/pricing)
  capturedAt: number; // 처음 본 시각(ms) — 메타 fbc 값의 creationTime으로도 쓴다
};

export function parseAttributionCookie(raw: string | undefined): Attribution | null {
  if (!raw) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    try {
      parsed = JSON.parse(decodeURIComponent(raw));
    } catch {
      return null;
    }
  }
  if (!parsed || typeof parsed !== "object") return null;
  const source = parsed as Record<string, unknown>;
  if (typeof source.capturedAt !== "number" || typeof source.landingPath !== "string") {
    return null;
  }
  const result: Attribution = {
    landingPath: source.landingPath.slice(0, MAX_VALUE_LENGTH),
    capturedAt: source.capturedAt,
  };
  for (const key of KEYS) {
    const value = source[key];
    if (typeof value === "string" && value) {
      result[key] = value.slice(0, MAX_VALUE_LENGTH);
    }
  }
  return result;
}

// 브라우저 전용. 주소에 유입 정보가 있고 쿠키가 아직 없을 때만 적는다.
export function captureAttribution(search: string, pathname: string): void {
  if (document.cookie.split("; ").some((c) => c.startsWith(`${ATTRIBUTION_COOKIE}=`))) {
    return;
  }
  const params = new URLSearchParams(search);
  const host = window.location.hostname;
  const found: Attribution = { landingPath: `${host}${pathname}`, capturedAt: Date.now() };
  let hasAny = false;
  for (const key of KEYS) {
    const value = params.get(key);
    if (value) {
      found[key] = value.slice(0, MAX_VALUE_LENGTH);
      hasAny = true;
    }
  }
  if (!hasAny) return;
  // congre.kr 밖(로컬 · 미리보기 주소)에서는 domain을 붙이지 않는다 — 붙이면 브라우저가 쿠키를 버린다.
  const onCongre = host === COOKIE_ROOT_DOMAIN || host.endsWith(`.${COOKIE_ROOT_DOMAIN}`);
  document.cookie =
    `${ATTRIBUTION_COOKIE}=${encodeURIComponent(JSON.stringify(found))}` +
    `; path=/; max-age=${MAX_AGE_SECONDS}; SameSite=Lax` +
    (onCongre ? `; domain=.${COOKIE_ROOT_DOMAIN}` : "");
}
