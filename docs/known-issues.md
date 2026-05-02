# Known Issues & Deferred Tasks

## ✅ Phase 4 AI 렌더링 파이프라인 (완료)
- S3 업로드 정상
- Shotstack 렌더링 정상 (stage 환경, 워터마크 있음)
- 영상 재생 및 다운로드 정상
- 클립 타임라인 순서 수정 (uploadedAt 오름차순)

## [notifications:history] save failed — undefined 필드 처리 누락

- 현상: 알림 이력 저장 시 `save failed: undefined` 에러 발생 (일부 시나리오)
- 원인: `providerMessageId` 등 선택 필드가 `undefined`일 때 Firestore에 그대로 전달됨. Firestore는 `undefined` 값을 거부함
- 현재 처리: history 저장 실패는 `.catch()`로 무시하므로 알림 발송 자체에는 영향 없음
- 해결 방법: `saveNotificationHistory` 호출 전 `undefined` 필드 제거 (예: `...(messageId && { providerMessageId: messageId })`)
- 우선순위: 낮음 (이력 누락 문제, 기능 영향 없음)

## SMS 실패 시 failedMessageList 상세 사유 콘솔 미출력

- 현상: SOLAPI SMS 발송 실패 시 `result.error`에 최상위 에러 메시지만 기록되고 `failedMessageList` 내 개별 메시지 사유는 출력 안 됨
- 원인: `sms.ts` catch 블록이 `err.message`만 반환, SOLAPI SDK의 `res.failedMessageList` 미참조
- 현재 처리: Firestore `notifications` 이력에 최상위 에러 문자열만 저장됨
- 해결 방법: `service.send()` 반환값에서 `failedMessageList` 추출해 콘솔 출력 추가
- 우선순위: 낮음 (디버깅 편의 목적)

## clipCount 증가 실패 (무시됨)
- 현상: 업로드 시 events.clipCount 증가 permission-denied 발생
- 원인: 비로그인 참가자가 events 문서 update 불가 (Firebase 규칙)
- 현재 처리: .catch()로 무시 중. 클립 목록은 onSnapshot으로 직접 세므로 기능 영향 없음
- 해결 방법: Firebase 규칙에서 clipCount 필드만 비로그인 update 허용
  또는 Cloud Function으로 clipCount 업데이트 위임
- 우선순위: 배포 전 처리
