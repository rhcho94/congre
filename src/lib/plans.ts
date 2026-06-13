export type PlanId = "free" | "small" | "medium" | "large";

export const PLAN_CLIP_LIMITS: Record<PlanId, number> = {
  free: 5,
  small: 50,
  medium: 200,
  large: 5000,
};

export function getPlanClipLimit(plan: PlanId): number {
  return PLAN_CLIP_LIMITS[plan];
}

export const PLAN_MAX_CLIP_SECONDS: Record<PlanId, number> = {
  free: 10,
  small: 30,
  medium: 30,
  large: 30,
};

export function getPlanMaxClipSeconds(plan: PlanId): number {
  return PLAN_MAX_CLIP_SECONDS[plan];
}
