# Changelog

> 기능 단위 작업 이력. 최신이 위.

## 2026-05-06

- refactor(dashboard): 실시간 구독 3개 → polling/단발 fetch — Client SDK Firestore read 의존 제거, Timestamp ms 기반, 탭 숨김 시 polling 중단 (Phase B-3 2단계 커밋 3-2)
- refactor(api): /api/render/start eventId 기반 — 서버에서 clips 직접 read, body { eventId }만, 빈 clips 가드 (Phase B-3 2단계 커밋 3-1)
- feat(api): GET /api/host/events/[eventId] + /api/host/clips — 호스트 전용 polling route, Bearer 토큰 인증, hostId 소유권 검증 (Phase B-3 2단계 커밋 2)
- feat(api): GET /api/events 신설 — 호스트 이벤트 목록 서버 route, Bearer 토큰 인증, createdAt desc 정렬, Timestamp → ms 직렬화 (Phase B-3 2단계 커밋 1)

## 2026-05-05 (2)

- feat: /api/cron/check-rendering 신설 — 5분마다 rendering 이벤트 Shotstack 상태 조회, 완료 시 Firestore 업데이트 + 알림 발송
- refactor(dashboard): 클라이언트 30초 폴링 → Firestore onSnapshot 실시간 수신으로 교체, /api/render/complete 클라이언트 호출 제거
- chore(render/complete): 서버 cron 이전으로 dead endpoint 잠금 (401 반환)
- chore(ci): .github/workflows/cron-check-rendering.yml 추가 (5분 간격)

## 2026-05-05

- chore: 사용되지 않는 Clip.durationSec 필드 제거
- refactor(shotstack): Smart Clips로 전환 (start/length: "auto") — 클라이언트 duration 측정 코드 원복, 길이 측정은 편집 도구 책임 원칙 적용, 실제 렌더 테스트로 동작 검증 완료
- fix(render): 클립별 실제 재생 시간 사용 — CLIP_MAX_SEC 10초 고정값 제거, 클라이언트 loadedmetadata 측정값 → Firestore → render/start → createRender 전달, 정지 화면 패딩 문제 해결

## 2026-05-04

- chore(ci): cron 빈도 매분 → 5분 간격 변경 (GitHub Actions throttling 회피)
- fix(build): test/notify-render-started 라우트 제거 — RenderStartedCtx 인터페이스 변경 후 미사용/미동기화 상태
- chore(ci): GitHub Actions 워크플로 추가 (.github/workflows/cron-check-deadlines.yml) — `* * * * *` 스케줄로 /api/cron/check-render-deadlines 호출, APP_URL + CRON_SECRET GitHub Secrets 사용 (TODO [6])
- fix: render/complete에서 notifyRenderCompleted에 refundStatus 전달 추가 — 환불 발생 시 완료 이메일 환불 블록 표시
- feat: /api/cron/check-render-deadlines 신설 — render_delayed/refund_50/refund_100 시간 조건 점검 + 멱등성 플래그 기록, CRON_SECRET Bearer 인증, 순차 처리(for...of)
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
