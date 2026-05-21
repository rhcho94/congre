export type PlanId = "free" | "small" | "medium" | "large";

export const PLAN_CLIP_LIMITS: Record<PlanId, number> = {
  free: 10,
  small: 50,
  medium: 200,
  large: 5000,
};

export function getPlanClipLimit(plan: PlanId): number {
  return PLAN_CLIP_LIMITS[plan];
}
