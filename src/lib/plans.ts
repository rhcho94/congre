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

export function calcRawPrice(maxClipSeconds: number, clipCount: number): number {
  return maxClipSeconds * clipCount * 100;
}

export function calcPrice(maxClipSeconds: number, clipCount: number): number {
  return Math.max(calcRawPrice(maxClipSeconds, clipCount), MIN_PRICE);
}
