# 2026-06-06 — 폐기 도메인 일소 + OG 이슈 종결 + 라이브 추첨 기능 구현·실기검증

## 한 줄 요약
폐기된 congre-three 도메인을 활성 문서 7곳에서 일소하고 OG 하드코딩 이슈를 의도적
유지로 종결. 라이브 추첨 기능(업로드 시 썸네일 캡처 → 풀스크린 추첨 모달: 이름 회전 →
당첨자 얼굴 + 컨페티, 순차 N회, 휘발성)을 atomic 3커밋으로 구현. 실기 검증서 iOS 썸네일
캡처가 hang으로 업로드 자체를 막는 버그 발견 → 타임아웃으로 긴급 복구. iOS 썸네일은
폴백(로고) 상태로 다음 트랙.

## 본 세션 커밋 (본 앱 git)
- 7278923 chore: replace purged congre-three domain with app.congre.kr
- d238211 docs: resolve OG image domain hardcode issue (intentional, env reversion is YAGNI)
- b2af0bc feat: capture and store per-clip thumbnail on upload
- e3dd927 feat: add live lottery with per-clip thumbnail reveal
- 9e4356f fix: add timeout to thumbnail capture to prevent iOS upload hang

## 본 세션 결정·발견

### 도메인 정리 (라이브 + 문서)
- 라이브 확인: Vercel `NEXT_PUBLIC_APP_URL` = `app.congre.kr` (All Environments 단일, docs의
  Production/Preview 2칸 표기와 달랐음). Firebase Action URL: 이메일 주소 확인·비밀번호 재설정
  = `app.congre.kr`로 운영자 수정 완료.
- **Firebase "이메일 주소 변경" 템플릿만 `congre-three` 잔존** — 콘솔 저장이 간헐 실패하여
  미수정. 단 mypage에 이메일 변경 기능이 없어 해당 메일은 발송 안 됨 = **무해(앱 미사용 템플릿)**.
- 문서 일소: 활성 7파일만 정정(.env.local.example, build_user_guide.py, README.md, decisions
  /auth-model·data-flow, guide-content.md, monitoring-ops-v0.md). **역사 기록(handoff/*,
  known-issues-resolved.md, plans/*)은 불변 원칙으로 미수정.**
- `monitoring.md`의 `congre-three.vercel.app`은 **폐기 아님** — Vercel 본 앱 프로젝트의 실제
  기본 도메인. 손대지 않음. (미확인: 콘솔 Domains 탭에서 기본 도메인이 지금도 이 값인지 곁다리 확인)

### OG 하드코딩 이슈 종결
- layout.tsx OG URL 3곳 + og-image route FALLBACK_URL 1곳 = 4곳이 `app.congre.kr`로 일관 하드코딩.
- 환경변수 환원 대신 **하드코딩 유지로 종결**: (a) 도메인 정착 → 환원은 YAGNI, (b) 카카오 OG
  영구 캐시 특성상 환원의 값 차이가 기존 초대장 미리보기를 깨뜨릴 위험만 추가.

### 라이브 추첨 기능 (구현 완료)
- 사양: 호스트가 인원 N 지정 → 1명씩 순차 N회 → 이름 회전(감속 ~2.5s) → 당첨자 썸네일 +
  컨페티 → [다음] → 중복 배제 → 결과 명단. **휘발성**(Firestore 미저장, 새로고침 시 beforeunload
  경고 + 초기화). 풀스크린 모달(기존 showCloseModal 패턴 재사용, page.tsx 내 state).
- 썸네일 = **B안**: 업로드 시 클라이언트 canvas로 프레임 1장(1초 지점, 짧으면 중간) 캡처 →
  S3 저장(kind:"thumb") → 클립 문서 thumbKey. 서빙 = og-image와 동일 프록시 라우트
  (/api/clips/[clipId]/thumb, 공개, 폴백 /logo.png).
- 풀 = clips 전체(제외 excludedAt 무시 — 추첨과 무관). 중복 배제는 state 타이밍 회피 위해
  startLotterySpin(currentWinners) 인자 전달 방식.
- 캡처 실패 거동: try/catch로 thumbKey 없이 업로드 계속(영상 업로드를 막지 않음).

### iOS 썸네일 캡처 — 실기서 버그 발견 + 긴급 복구
- **증상**: 아이폰 업로드가 "100%"에서 영구 멈춤(10분+), 대시보드 미표시.
- **원인**: iOS Safari가 onloadeddata/onseeked 이벤트를 안 쏴서 captureThumbnail이 hang.
  try/catch는 *에러*만 잡고 *멈춤*은 못 잡음 → /api/clips POST까지 도달 못 함 → 업로드 실패.
- **복구(9e4356f)**: captureThumbnail에 3초 타임아웃. 미완료 시 finish(null) → 기존 흐름대로
  thumbKey 없이 업로드 계속. 안드/PC는 3초 전 완료라 영향 0.
- **실기 검증 결과**: 6명 추첨(아이폰3 + 안드3). 안드 3개 실제 썸네일 OK, 아이폰 3개 폴백 로고
  (멈춤은 사라짐, 업로드·추첨 정상). 중복 배제 6명 전원 확인 OK, 컨페티·연출 OK.

## 미완 / 대기 (다음 세션 우선순위)
1. **iOS 썸네일 캡처 우회** — 현재 iOS는 폴백 로고. hang 원인이 백그라운드 <video> 이벤트
   미발생이므로, 우회 후보: 보이는(또는 화면 밖이지만 DOM에 붙은) video에 muted+playsInline로
   짧게 play() 후 캡처 / requestVideoFrameCallback / 업로드 직전 사용자 제스처 컨텍스트 활용.
   불확실성 높아 정찰+실기 필요. 치명적 아님(폴백 동작 중).
2. **s3.ts 인라인 fetch 통일** (작은 빚) — thumb presign을 page.tsx 인라인 fetch로 처리했음
   (s3.ts getPresignedUrl 타입 union에 "thumb" 미추가, "4곳 외 변경 금지" 준수). 향후 s3.ts
   타입 확장 + 헬퍼 호출로 통일 가능.
3. **Firebase 이메일 주소 변경 템플릿** — congre-three 잔존, 콘솔 저장 간헐 실패. 무해(앱 미사용).
4. **monitoring.md 기본 도메인 확인** — Vercel Domains 탭에서 본 앱 기본 도메인이 지금도
   congre-three.vercel.app인지 곁다리 확인. 그대로면 문서 정확, 바뀌었으면 표 1칸 갱신.
5. **BGM 분위기 옵션** — 곡 자산(라이선스) 병목 확인됨. 자산 확보가 선결. shotstack.ts
   soundtrack src 정찰은 그 다음.
6. **⑦ Shotstack raw 로그** — 외부 대기(내 액션 없음).

## 본 세션 학습
- **첨부 docs를 repo 현재 상태로 착각하지 말 것** — 첨부된 CLAUDE.md/PROJECT.md가 stale
  사본이었음. PROJECT.md는 이미 app.congre.kr, L6도 이미 resolved 이동 완료였는데 "정정 필요"로
  오판. docs 작업 전엔 첨부 말고 repo grep 먼저.
- **기술 제약을 기획 요구보다 앞세우지 말 것** — 핸드오프가 "썸네일 없음 → 이름 회전 MVP,
  썸네일 v2"로 박았으나, 실제 기획은 "당첨자 얼굴"이 핵심. 제약은 "그래서 못 한다"가 아니라
  "그래서 어떻게 확보하냐"로 풀어야 했음.
- **try/catch는 에러를 잡지 멈춤(hang)을 못 잡는다** — 비동기 이벤트 대기 코드는 타임아웃
  안전망을 기본으로. iOS Safari 미디어 이벤트는 실기 전엔 신뢰 불가.
- **"안 깨진 걸 고치지 마라"** — OG 하드코딩은 동작 정상이라 환원 대신 종결. 환원이 오히려
  카카오 캐시 깨짐 위험을 들여옴.
