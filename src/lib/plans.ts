export type PlanId = "free" | "paid";

export const PLAN_CLIP_LIMITS: Record<PlanId, number> = {
  free: 5,
  paid: 200,
};

export function getPlanClipLimit(plan: PlanId): number {
  return PLAN_CLIP_LIMITS[plan];
}

export const PLAN_MAX_CLIP_SECONDS: Record<PlanId, number> = {
  free: 10,
  paid: 100,
};

export function getPlanMaxClipSeconds(plan: PlanId): number {
  return PLAN_MAX_CLIP_SECONDS[plan];
}

export const MIN_PRICE = 10000;

// 누적 초(개수×길이) 상한 = 완성본 하객 영상 최대 30분. 엔진 TOO_LONG 기준과 같음
export const MAX_TOTAL_CLIP_SECONDS = 1800;

export function formatMinSec(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  if (m === 0) return `${s}초`;
  if (s === 0) return `${m}분`;
  return `${m}분 ${s}초`;
}

export function calcRawPrice(maxClipSeconds: number, clipCount: number): number {
  return maxClipSeconds * clipCount * 100;
}

export function calcPrice(maxClipSeconds: number, clipCount: number): number {
  return Math.max(calcRawPrice(maxClipSeconds, clipCount), MIN_PRICE);
}

export function calcRerenderPrice(firstAmount: number): number {
  return Math.round(firstAmount * 0.8);
}
