import { formatMinSec } from "@/lib/plans";

export function renderStartErrorMessage(
  code: string | undefined,
  body: { totalSeconds?: number },
  httpStatus: number
): string {
  if (code === "NO_CLIPS_AFTER_EXCLUSION") {
    return "선택된 클립이 없어요. 제외를 해제한 뒤 [영상 생성 다시 시작] 버튼을 눌러주세요.";
  } else if (code === "NO_CLIPS") {
    return "업로드된 클립이 없어요.";
  } else if (code === "NOT_CONFIGURED") {
    return "서버 설정 오류로 영상 생성을 시작하지 못했어요. 운영자에게 문의해주세요.";
  } else if (code === "PAID_NOT_AVAILABLE") {
    return "결제가 확인되지 않은 유료 이벤트예요. 결제 후 다시 시도해주세요.";
  } else if (code === "REFUND_LOCKED") {
    return "환불 대상으로 확정된 이벤트라 다시 만들 수 없어요. 카카오톡 @congre로 문의해 주세요.";
  } else if (code === "TOTAL_TOO_LONG") {
    const current = typeof body.totalSeconds === "number" ? ` (현재 ${formatMinSec(body.totalSeconds)})` : "";
    return `영상 합계가 30분을 넘어요${current}. 영상 일부를 제외한 뒤 [영상 생성 다시 시작] 버튼을 눌러주세요.`;
  } else if (code === "RENDER_IN_PROGRESS") {
    return "이미 영상을 만들고 있어요. 잠시 뒤 이벤트 페이지에서 확인해 주세요.";
  } else if (code === "ENGINE_START_FAILED") {
    return "영상 생성을 시작하지 못했어요. 이벤트 페이지의 [영상 생성 다시 시작] 버튼으로 다시 시도해 주세요. 계속 안 되면 카카오톡 @congre로 문의해 주세요.";
  } else if (code === "SAVE_AFTER_START_FAILED") {
    return "영상은 만들어지고 있지만 기록 저장에 문제가 생겼어요. 카카오톡 @congre로 알려 주세요.";
  }
  return `영상 생성 시작에 실패했습니다 (${code ?? httpStatus}). 운영자에게 문의해주세요.`;
}
