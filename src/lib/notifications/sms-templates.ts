export function renderSms(template: string, vars: Record<string, string>): string {
  return Object.entries(vars).reduce(
    (t, [k, v]) => t.replace(new RegExp(`\\{${k}\\}`, "g"), v),
    template
  );
}

// All templates must stay ≤ 90 bytes (Korean ≈ 45 chars).
// SOLAPI auto-upgrades SMS→LMS for longer messages, but keep short where possible.
export const smsTemplates = {
  render_started:
    "[Congre] '{title}' 편집이 시작되었습니다.",
  render_completed:
    "[Congre] '{title}' 편집 완료! 영상: {url}",
  render_delayed:
    "[Congre] '{title}' 편집 지연 중. 30분 후 50% 환불 확정 예정. 문의: 카카오톡 @congre",
  refund_50:
    "[Congre] '{title}' 편집 지연으로 50% 환불이 확정되었습니다. 환불 절차: 카카오톡 @congre",
  refund_100:
    "[Congre] '{title}' 편집 지연으로 100% 환불이 확정되었습니다. 영상은 완성 후 전달드립니다.",
  render_failed:
    "[Congre] '{title}' 편집 실패. 대시보드를 확인해 주세요.",
  first_clip_uploaded:
    "[Congre] '{title}' 첫 클립이 업로드되었습니다.",
  participant_result:
    "[Congre] '{title}' 결과 영상이 준비되었습니다: {url}",
} as const;
