# Changelog

> 기능 단위 작업 이력. 최신이 위.

## 2026-06-13

- refactor(ui): AppHeader 공용 컴포넌트 추출 — 대시보드 nav 4곳(dashboard, create, events/[eventId], mypage) 로고+컨테이너 중복 제거. 우측 메뉴는 children 유지. 그룹 B/C 미접촉. (32e1b7a)

## 2026-06-11

- fix(infra): IAM 정책 shotstack-s3-write에 shotstack-api-v1-output GetObject 추가 — Track ⑦(Shotstack→S3 복사 AccessDenied) 해결
- docs(handoff): 2026-06-11 ⑦ 해결 + 렌더 복구 검증 + 품질 결함 핸드오프

## 2026-06-03

- feat(seo): 초대 페이지 `/upload/[eventId]` OG 이미지 추가 — `/api/og-image/[eventId]` 프록시 라우트가 events.introMediaType==="image"일 때만 S3 객체 바이트 직접 서빙(presigned 없이 비공개 버킷 유지), 그 외(영상·미설정·실패)는 `/logo.png`로 302 fallback. layout.tsx generateMetadata에 openGraph.images/url/type + twitter.card=summary_large_image 추가. OG URL은 app.congre.kr 하드코딩(known-issues 갱신 사유 참조).

## 2026-06-02

- docs: 운영 모니터링·한도/비용 점검 문서(docs/ops/monitoring.md) 추가 + 프로젝트명(congre)·Firebase Blaze·cron(Vercel Cron Pro)·Shotstack CDN 항목 정정 (2026-06-02)

## 2026-06-01

- feat(seo): 게스트 초대 링크(`/upload/[eventId]`)에 서버사이드 동적 OG 카드 추가 (`layout.tsx` 신규 `generateMetadata`). 카카오·SNS 미리보기 카드에 호스트 이름·행사 이름 노출. events.title + users.name 2회 Admin 조회, hostName 12자·title 20자 초과 시 절단.
- feat(ui): 게스트 업로드 화면 uploader 단계 첫 방문(!isReturning)에 4단계 흐름 안내 스트립 `FlowStrip` 추가 (이름·번호 → 촬영 → 올리기 → 링크 받기). 인라인 SVG 4종 + 화살표, 외부 패키지·전역 CSS 클래스 의존성 0.
- feat(api): 게스트용 `GET /api/events/[eventId]` 응답에 `hostName` 필드 추가 (users 컬렉션 `name`만 join, 다른 PII 비노출).
- feat(ui): 게스트 업로드 화면 uploader 단계 첫 방문 문구 교체 — 호스트 이름·행사 이름·요청 영상 길이 노출 + 입력 정보 사용 목적 안내.
- refactor(ui): 게스트 uploader 첫 방문 문구 압축(호스트 이름 1회·길이 안내 1줄·정보 사용 목적 1줄) + 입력칸 아래 "같은 이름+전화번호로는 한 번만…" 사전 안내 삭제 (검증 에러 메시지로 충분).
- feat(render): 무료 플랜 완성본에 "made by Congre" 워터마크 트랙 추가 (rich-text, Cormorant Garamond italic, 우하단, opacity 0.40, 최상단 레이어).

## 2026-05-31

- feat(app): 앱 내 좌상단 로고 12곳 + "← 홈" 류 홈 버튼 6곳을 외부 랜딩 `congre.kr`로 연결 (`<Link href="/">` → `<a href={LANDING_URL}>`). 회원 탈퇴 직후 이동도 `/` → `/host`로 명시 (마케팅 랜딩 아닌 로그인 화면). 신규: `src/lib/constants.ts` `LANDING_URL`.
- refactor(app): 본 앱 루트 `/` 옛 랜딩 제거, `/host` 서버 리디렉트로 교체 (`next/navigation` `redirect()`). `LandingParticles` / `LandingSparkles` / `LandingHeroVideo` 3개 컴포넌트 삭제. 외부 랜딩 `congre.kr`로 일원화. 전역 `<Link href="/">` 19곳은 그대로 (host 거쳐 정상 동작).

## 2026-05-29

- 워터마크 정책 결정 (무료 박음/유료 제거) + 무료 플랜 사양 공식화 (클립 길이 10초 / 수 10개) — 코드 변경 없음, docs만. decisions/market-product.md 2026-05-29 (3)

## 2026-05-28

- feat(api): /api/lead 리드 수집 엔드포인트 (가격 페이지 폼 → Resend → 운영자 메일)
- feat(api): emailChannel reply-to 지원 (어댑터 확장)
- feat(landing): /pricing 가격 페이지 + 리드 수집 폼 (cleanUrls, nav·footer 연결)
- docs: B 트랙 결정·known-issue 정식 반영
- decision: A 트랙 가격 정책 결정 (B5 빈칸 채우기 — 사진 가격대 기준, 세그먼트 차등 없음, 커스텀 상담 트랙 신설, 워터마크·PG 보류)
- decision(rendering): D1에 B5 갱신 메모 추가 (7일 누락 정정)

## 2026-05-22

- docs(claude): CC 보고 메타 코멘트 금지 룰 추가 (격상 처리)
- fix(ui): 이벤트 생성 폼 초기 영상 길이 10초 (free 플랜 정합)
- feat(ui): 이벤트 생성 폼 플랜별 영상 길이 분기 + 자물쇠 잠금 표시 (무료 플랜 15·20·25·30초 비활성)

## 2026-05-21

- decision: B5 가격 정책 (S5 모델: 첫 렌더 유료 + 재렌더 매번 유료) + D2 사양 재작성 (B5 반영)
- chore: S4-09 D2 진입 전 데드코드 정리 (renderDoneAt 타입 추가 + updateEventRender 제거 + draftVideoUrl 제거)
- fix: 회원 탈퇴 차단 범위에서 closed 상태 제외 (데드락 해소)

## 2026-05-20

- docs: P3d 이메일 발신 도메인 DNS 검증 완료 확인 — Gmail 도달 실측 + Firebase Auth 인증 메일 noreply@congre.kr 통합 확인 + 회원 탈퇴 데드락 known-issues 등재
- S2-04 P4 마이페이지 회원 탈퇴 (Admin SDK 일괄 삭제, 진행 중 이벤트 마감 요구, 약관·처리방침 v0.2)
- S2-04 P3 마이페이지 비밀번호 변경 (reauthenticate + updatePassword, show/hide 토글)
- feat: S2-04 P2 완료 (마이페이지 프로필 수정 — name·phone + Firestore users update 규칙)
- feat: S2-04 P1 완료 (마이페이지 골격 + 이벤트 요약 + 프로필 표시)

## 2026-05-19

- feat(auth): 이메일 인증 차단 흐름 (P3a) — Firestore email_verified 조건 추가 + EmailVerificationBanner + 대시보드 이벤트 생성 버튼 비활성 + /dashboard/create 미인증 리디렉션 (커밋 bada6d0)
- feat(auth): 이메일 인증 Custom Action URL + /verify-email 페이지 (P3b) — Firebase actionCodeSettings + applyActionCode + Suspense 래퍼 + useRef 이중 실행 가드 (커밋 08be31f)
- chore(firebase): congre.kr 이메일 발신 도메인 커스텀 설정 완료 (P3d) — DNS TXT SPF·TXT verification·CNAME DKIM ×2 등록 + Firebase Console Templates Action URL 설정
- iOS Safari capture 480p 사고 처리 (옵션 B) — iPhone 검출 시 즉석 촬영 버튼 숨김, 갤러리 전용 흐름 + iOS 정책 안내 문구

## 2026-05-18 v1

- docs: PROJECT.md / DECISIONS.md / known-issues.md 현 코드 상태와 동기화 (자동 첨부 자료 stale 발견 후 정상화)
- rules: CLAUDE.md Kickoff 룰 6번 신설 (핸드오프 2개 교차 검증 의무) + 핸드오프 파일 명명 규칙 명시

## 2026-05-17

- chore(rules): add "운영자 기억 의존 신호 = CC 정찰 병렬 트리거" to CLAUDE.md (2026-05-17 사양 C 검증 사고 사례)

## 2026-05-16

- docs(PROJECT): 디자인 토큰 표 동기화 (--border, --accent-bright 추가, --font-display italic 표기 정정, 폰트 정의 위치 메모 추가)
- chore(rules): add "단편 단서로 전체 단정 금지" rule to CLAUDE.md
- chore(rules): add "사양 외 자체 판단 명시" rule to CLAUDE.md
- docs: 호스트 가이드 STEP 02 클립 길이 항목 추가 + PROJECT.md 사양 A·B·C 동기화
- docs: 게스트 가이드 STEP 02·03 통합·재작성 (native capture 흐름 반영) + 랜딩 STEP 라벨 동기화
- fix(upload): 업로드 idle 화면 촬영 시간 안내 가독성 강화 (text-xs + opacity-60 → text-sm)
- fix(upload): 안드로이드 Chrome 14/15 갤러리 직행 사고 정정 — 카메라/갤러리 두 input 분리
- feat: Shotstack 클립별 length 동적 계산 (사양 C, native capture 전환 3단계)
- feat: 참가자 upload 페이지 native capture 전환 + duration 측정·저장 (사양 B, native capture 전환 2단계)
- feat: events 모델에 maxClipSeconds 필드 추가 (사양 A, native capture 전환 1단계)

## 2026-05-15

- upload 페이지 getUserMedia constraints에 width/height 1080×1920 ideal 추가 + MediaRecorder videoBitsPerSecond 5Mbps 명시. 참가자 영상 480p 압축 → 1080p 캡처로 전환 (가설 A 처방).
- feat(shotstack): output에 fps 30 + quality high 명시 (단가 무영향, 압축 아티팩트 완화)
- feat(guide): 사용 가이드 페이지 3종(/guide, /guide/host, /guide/guest) 신설 + 랜딩 미리보기 섹션 + 푸터 링크

## 2026-05-14

- fix(share): /share/{eventId} 재도입으로 카카오 공유 fallback 사고 해소 (regression of d74152e)
- chore: 외부 서비스 인벤토리 정찰 + 실전 테스트 전 사전 차단 액션 (Firebase Blaze 전환, SOLAPI 충전, GitHub Public 유지 결정)
- refactor: Track 4 강화 — 배경 토큰 추가 명도 상향(#1f1c18/#2a261f/#34302a), Primary 버튼 그라디언트 강화(from-[#f5b04a] to-[#a06f1f] + shadow 입체감 풀세트 + glow-accent 제거), 헤일로 4곳 opacity-25·ellipse 100% 90%로 강화
- feat: 배경 토큰 명도 조정(bg/surface/surface-2), Primary 버튼 gradient 통일(from-accent-bright to-accent), 헤일로 효과 3페이지 확산(host·upload standby·events done)

## 2026-05-12

- refactor: 초대장 기능 전체 제거 — /invite, /share 페이지 삭제; 대시보드 초대장 섹션(환영 문구·커버·갤러리) 제거; welcomeText/coverImageUrl/galleryUrls 필드 제거; 카카오 공유 링크 → 영상 직링크
- feat: 인트로/아웃트로 미디어 업로드 안내에 10초 권장 문구 추가 (accent 강조)
- refactor: outroText overlay 폐기 — [A] 분기 cross-track 동기화 한계 해소. probe API 도입 폐기(WebM duration 미반환 + 비용 미확증). introText overlay 보존. 사고 2①·2③ 해소
- refactor: shotstack multi-track 구조 도입 — 인트로/아웃트로 미디어(사진 5초/영상 원본) + 텍스트 overlay(fade transition + stroke + 반투명 박스). createRender 시그니처 변경(intro/outro 객체 인자). 단일 track 분기는 기존 동작 보존
- feat: 대시보드 인트로/아웃트로 업로드 UI + 텍스트 편집 — introText/outroText(60자) 저장 버튼, intro/outro 미디어(이미지·영상, 10MB) 업로드·미리보기·삭제; GET/PATCH API 6필드 확장(introText/introMediaKey/introMediaType/outroText/outroMediaKey/outroMediaType); invite-urls 응답에 introMediaUrl/outroMediaUrl 추가

## 2026-05-11

- feat: 대시보드 QR/링크 target을 invite 콘텐츠 유무에 따라 분기 — welcomeText·coverImage·gallery 중 하나라도 있으면 /invite, 없으면 /upload로 연결
- fix: 초대장 이미지 표시 방식 변경 — 공개 URL 대신 S3 키 저장 + presigned GET URL(1시간) 변환 (버킷 비공개 정책 403 수정)
- feat: 대시보드 초대장 작성 섹션 — welcomeText·커버·갤러리(최대 4장) 입력 UI + 이미지 즉시 업로드 + welcomeText 저장 버튼
- feat: PATCH /api/host/events/[eventId] — 초대장 필드(welcomeText, coverImageUrl, galleryUrls) 부분 업데이트 API 추가
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
