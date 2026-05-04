# Changelog

> 기능 단위 작업 이력. 최신이 위.

## 2026-05-04

- feat: render_delayed 재설계 알림 템플릿 5종 정비 — render-started(E 동적화), render-delayed(재설계), refund-50(신규), refund-100(신규), render-completed(refundStatus 조건부 블록)
- refactor: render/complete에서 구 isDelayed 분기 제거 → notifyRenderCompleted 단일 호출
- chore: CONGRE_INTERNAL_PHONE env var 코드 준비 (TODO [6] — 실제 번호 미등록)

## 2026-05-03

- chore: congre.kr 도메인 가비아 등록 완료 (1년)
- chore: Resend 가입 + congre.kr 도메인 인증 완료 (DKIM/SPF/DMARC 4개 레코드)
- chore: SOLAPI 가입 + 발신번호 등록 + API 키 발급 (개인 휴대폰 명의)
- chore: .env.local 6개 변수 입력 (RESEND_API_KEY, EMAIL_FROM, EMAIL_FROM_NAME, SOLAPI_API_KEY, SOLAPI_API_SECRET, SOLAPI_SENDER)
- chore: 알림 시나리오 5/5건 실제 발송 검증 완료 — event_created(이메일), render_completed·delayed·failed(이메일+SMS), render_started(이메일+SMS)
- feat: dev 전용 검증 엔드포인트 추가 — GET /api/test/notify-render-started, 프로덕션 404 보장 (commit bcfe1f3)
- fix: notifications:history — Firestore Admin `ignoreUndefinedProperties: true` 적용, optional 필드 undefined 에러 해결, db 인스턴스 캐싱 (commit bcfe1f3)
- fix: sms.ts — SOLAPI `MessageNotReceivedError.failedMessageList` 상세 사유 콘솔·history.error 출력 (commit 79af076)

## 2026-05-02

- refactor: closeEvent 서버 API 이전 — POST /api/events/[eventId]/close, hostId 주최자 검증 포함, 클라이언트 Firestore 직접 쓰기 완전 제거
- feat: 알림 시스템 도입 — Resend 이메일 + SOLAPI SMS, 시나리오 5건 트리거 연결 (이벤트 생성, 렌더 시작/완료/지연/실패), 시나리오 2건 함수만 구현 (첫 클립 업로드, 참가자 결과)
- feat: POST /api/events 신설 — 서버 사이드 이벤트 생성 + 알림 트리거
- feat: POST /api/render/complete 신설 — 렌더 완료 서버 사이드 처리 + 10분 기준 완료/지연 분기
- feat: events 문서에 organizerEmail, organizerPhone, deadlineAt 필드 추가
- refactor: render/start에서 Firestore 상태 업데이트 서버 사이드로 이전

## 2026-05-01

- chore: 테스트 데이터 정리 실행 — events 32건 + clips 57건 + S3 객체 57건 삭제
- chore: add execute mode to cleanup script with S3 object deletion
- chore: add dry-run cleanup script for test events
- feat: 클립 재생 Pre-signed URL 구현 (firebase-admin 도입)
- docs: 프로젝트 문서화 시스템 도입 (CLAUDE.md 확장, README 갱신, docs/ 신규 4종)
- feat: 랜딩 페이지 파티클 효과 추가 (canvas-confetti burst + ambient CSS sparkles)
