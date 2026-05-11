# Changelog

> 기능 단위 작업 이력. 최신이 위.

## 2026-05-11

- feat: presign 라우트에 kind 파라미터 추가, S3 prefix 분리 (events/{id}/{kind}/...)
- revert: welcomeText 입력을 이벤트 생성 폼에서 제거 (대시보드 초대장 섹션으로 재배치 예정)
- feat: /invite/[eventId] 초대 페이지 신설 (status 분기 + OG 메타 + 빈 필드 redirect)

## 2026-05-10

- docs: split DECISIONS.md into 8 area files (rendering / notifications / auth-model / legal / market-product / infra / data-flow / misc), keep root as index
- docs: split resolved issues from known-issues into known-issues-resolved (28 → 13 + 15)
- docs: add suspended.md for parked issues (legal v0.1, entry A/C)
- feat(cleanup): 자동 삭제 cron 추가 (클립 24h / 완성본 7d, KST 03:00 daily)
- fix: render-started/completed 알림 발송 후 Firestore 플래그 set 누락 수정
- feat(notify): 참가자 결과 SMS 트리거 연결 (PR 2)
- refactor(uploader): 닉네임 → 이름+전번 사양 전환. uploader stage·API 4개·대시보드·organizerPhone 검증 정합화.
- docs(legal): 이용약관·개인정보처리방침 페이지 추가 (v0.1) — /terms, /privacy 본문 작성 + 푸터 © 표기 정정
- fix(legal): privacy 제5조의2 AWS_S3_REGION 자리표시자 → ap-southeast-2 정정

## 2026-05-09

- feat(legal): 약관·개인정보 처리방침 페이지 골격 신설 — /privacy, /terms 라우트 추가. 콘텐츠는 임시 placeholder, 운영자가 채울 예정. 랜딩 푸터에 링크 추가.
- fix(admin): getAdminDb() settings() 중복 호출 가드 — SSR 서버 컴포넌트(generateMetadata + SharePage) 모듈 격리 환경에서 같은 Firestore 객체에 settings() 두 번 호출 시 throw 발생. try/catch로 "already initialized" 에러만 무시, 그 외 에러는 re-throw.
- feat(share): /share/{eventId} 공유 페이지 신설 — SSR 서버 컴포넌트, og 메타태그(generateMetadata), 상태별 화면 분기(done/준비 중/notFound), 카톡·링크복사 버튼(ShareActions 클라이언트 컴포넌트), BrandName 푸터
- fix(share): 호스트 대시보드 카톡 공유 link.webUrl을 cdn.shotstack.io → /share/{eventId}로 변경 — 카카오 콘솔 미등록 도메인 fallback 사고 해소
- fix(render): 영상 편집 클립 순서 오름차순 정렬 (uploadedAt 기준) — Phase B-3 (de6551b) 회귀 수정. render/start에서 uploadedAt 오름차순 sort 추가, shotstack.ts .reverse() 제거
- fix(email): render-completed "영상 확인하기" 버튼을 videoUrl(CDN 직접 링크)로 변경 — 미인증 수신자도 바로 영상 확인 가능, 기존 "영상 직접 링크"는 "대시보드 열기"로 교체
- feat(landing): 히어로 영상 unmute 버튼 추가 — 기본 무음 유지, 클릭 시 소리 토글 (VolumeX/Volume2 아이콘, LandingHeroVideo 클라이언트 컴포넌트 분리)
- fix(camera): 후면 카메라 표준 wide 자동 선택 — iOS 라벨 매칭("후면 카메라"/"Back Camera"), Android는 두 번째 facing back 디바이스 선택 (pickStandardBackCamera 휴리스틱)

## 2026-05-08 — 한글 인트로/아웃트로 기능 추가

- feat(fonts): NotoSansKR-Regular.ttf 추가 — /public/fonts/ 호스팅, Shotstack rich-text 폰트 소스 (SIL OFL)
- feat: 한글 인트로/아웃트로 입력 UI + API — 이벤트 생성 폼 필드 추가, POST /api/events 저장, CongreEvent 데이터 모델 introText/outroText 추가
- feat(shotstack): rich-text 클립 렌더 파이프라인 연결 — createRender에 인트로(start:0)/아웃트로(start:auto) rich-text clip + timeline.fonts 주입; fix: width/height 미지원 필드 제거 (37afdb8)

## 2026-05-08

- feat: [영상 생성 다시 시작] 버튼 — 마감 후 클립 제외 해제하고 재시도 가능 (행사 당일 클립 복구 경로)
- fix: handleClose render/start 응답 미체크 silent fail 픽스 — 에러 코드별 사용자 메시지 분기
- feat: 클립 제외/복원 기능 — 호스트 대시보드 토글 버튼, PATCH /api/clips/[clipId], render/start JS 필터, 제외 클립 시각적 dimming

## 2026-05-06

- chore(security): Firestore rules 잠금 — events read if false, clips read/create if false (Admin SDK 전용, Client SDK read 의존 제거 완료) (Phase B-3 2단계 커밋 4)
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
