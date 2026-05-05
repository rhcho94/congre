// ⚠️ 현재 비활성화 상태 — 모든 요청 즉시 401 반환
// createRender에 callback URL이 설정되어 있지 않아 Shotstack이 실제로 호출하지 않음.
// 활성화 시 필요한 작업:
//   1. shotstack.ts createRender body에 callback URL 추가
//   2. Shotstack payload 실제 스키마 확인 (현재 페이로드 구조는 미검증)
//   3. eventId 전달 방법 설계 (callback URL 쿼리 vs Shotstack metadata 필드)
//   4. 서명 대신 secret token으로 인증 (URL 쿼리 파라미터, WEBHOOK_SECRET 환경변수)
// 상세: docs/DECISIONS.md (정찰 보고서)
// 옛 핸들러 로직(eventId 검증, Firestore 업데이트, 알림 발송)은 git show 2d28780 으로 복구 가능

export async function POST() {
  return Response.json({ error: "WEBHOOK_DISABLED" }, { status: 401 });
}
