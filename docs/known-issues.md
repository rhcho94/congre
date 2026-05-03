# Known Issues & Deferred Tasks

## ✅ Phase 4 AI 렌더링 파이프라인 (완료)
- S3 업로드 정상
- Shotstack 렌더링 정상 (stage 환경, 워터마크 있음)
- 영상 재생 및 다운로드 정상
- 클립 타임라인 순서 수정 (uploadedAt 오름차순)

## [notifications:history] save failed — undefined 필드 처리 누락

- 위치: `src/lib/notifications/history.ts:18`
- 현상: 알림 이력 저장 시 `save failed: undefined` 에러 발생 (일부 시나리오)
- 원인: `record`에 `error`, `providerMessageId` 등 선택 필드가 `undefined`인 채로 Firestore `add()` 호출됨. Firestore는 `undefined` 값을 거부함
- 현재 처리: history 저장 실패는 `.catch()`로 무시하므로 알림 발송 자체에는 영향 없음. 이력 컬렉션 저장만 누락
- 해결 방향: `ignoreUndefinedProperties` Admin SDK 옵션 활성화, 또는 record 작성 시 `undefined` 필드 스프레드 제거 (예: `...(messageId && { providerMessageId: messageId })`)
- 우선순위: 낮음 (이력 누락 문제, 기능 영향 없음)

## SMS 실패 시 failedMessageList 상세 사유 콘솔 미출력

- 위치: `src/lib/notifications/channels/sms.ts`
- 현상: SOLAPI 거절 시 "1개의 메시지가 접수되지 못했습니다"만 표시, 상태코드·거절 사유가 콘솔에 출력 안 됨
- 원인: `catch` 블록이 `err.message`만 반환하고 SOLAPI SDK error 객체의 `failedMessageList` 미참조
- 현재 처리: Firestore `notifications` 이력에 최상위 에러 문자열만 저장됨
- 해결 방향: `service.send()` 반환값 또는 catch error에서 `failedMessageList` 파싱해 상세 출력 추가
- 우선순위: 낮음 (디버깅 편의 목적)

## render_delayed 메시지 톤 정의 모호

- 현상: 현재 메시지는 "완료됐는데 늦었다" 톤 (사후 안내). 이메일 제목도 "완료되었습니다 (지연)"
- 의문: "아직 처리 중인데 평소보다 오래 걸리고 있음" 알림(진행 중 사전 안내)이 별도로 필요한지 정책 검토 필요
- 처리 방향: 별도 세션에서 메시지 톤·의미 재정의 + 필요 시 별도 시나리오(`render_processing_slow`) 추가
- 우선순위: 낮음 (현재 동작은 정상, UX 개선 영역)

## clipCount 증가 실패 (무시됨)
- 현상: 업로드 시 events.clipCount 증가 permission-denied 발생
- 원인: 비로그인 참가자가 events 문서 update 불가 (Firebase 규칙)
- 현재 처리: .catch()로 무시 중. 클립 목록은 onSnapshot으로 직접 세므로 기능 영향 없음
- 해결 방법: Firebase 규칙에서 clipCount 필드만 비로그인 update 허용
  또는 Cloud Function으로 clipCount 업데이트 위임
- 우선순위: 배포 전 처리
