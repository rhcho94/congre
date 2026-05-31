# 2026-05-31 — 사이클 4 (2/2): 랜딩 버튼 본 앱 직행 연결 + 라이브 배포

## 본 세션 한 줄 요약

직전 핸드오프(2026-05-31-cycle4-app-restyle-deployed.md) 이어받음. 사이클 4의 **버튼 연결** 파트 완료 → 랜딩(`www.congre.kr` + `www.congre.kr/pricing`) 라이브 반영. 정찰→결정→실행→검증→실측 풀 사이클. **이로써 사이클 4 (디자인 통일 + 버튼 연결) 두 파트 전부 종료.**

## 본 세션 커밋

랜딩 트랙(git 외부)이라 **git 커밋 0건.** 변경 이력은 Vercel Deployments 탭이 유일.
- index.html 배포: dpl_828VDrtZQihhHvqq1PXAQ84a7uUd (READY)
- pricing.html 배포: dpl_CjpFFPfvdfN2Qs8fs67WyTdx1vSk (READY)

※ 본 핸드오프 파일은 본 앱 repo의 docs/handoff/에 커밋돼야 다음 세션이 읽을 수 있음 (랜딩 작업과 별개).

## 본 세션 결정

- **"시작하기"류 도착지 = 전부 `/signup`** (결정1-가). 무료 사용자도 가입 거침. 본 앱 코드 안 건드림 → 순수 랜딩 트랙.
  - 플랜 자동선택(`?plan=`)은 **이번 범위 제외.** 본 앱 create 페이지에 쿼리 읽는 코드가 없고(정찰 확인), 결제가 "사업자 준비 후 보류"라 반쪽 구현은 YAGNI. 결제 붙을 때 제대로 설계.
- 행사 호스트에게 전달 = Web Share API + 클립보드 fallback
- 학교·기업 도입 문의 = `mailto:hello@congre.kr`
- nav "요금" = `/pricing` 연결 (기존엔 "곧 공개" 토스트였음)
- 라지 "문의하기" = `mailto:hello@congre.kr`
- 사전예약 모달 = 완전 삭제 (HTML+JS). ※ v5-r10은 "백엔드 유지"였으나 **정찰 결과 백엔드가 애초에 없었음** — 폼 제출이 화면에 완료 표시만 하고 데이터를 아무 데도 안 보냄. 따라서 "재활용할 백엔드"가 없어 라지 문의도 mailto로 처리.

## 본 세션 발견 (정찰 수확)

### 본 앱 쪽 (CC 정찰)
- `src/lib/plans.ts`: PlanId = free|small|medium|large. PLAN_CLIP_LIMITS(10/50/200/5000), PLAN_MAX_CLIP_SECONDS(10/30/30/30). import 3곳(dashboard/create, api/events, api/clips).
- `/dashboard/create`: 플랜 라디오 4개 이미 존재(sr-only radio, name="plan"). **URL 쿼리(?plan=) 읽는 코드 없음.** 초기값 useState "free" 하드코딩. Firestore에 plan 필드로 저장함.
- 로그인 실경로 = **`/host`** (src/app/login 폴더 없음. host/page.tsx의 view==="login"). /signup 존재. /dashboard/create 존재.
- 미인증 흐름: 비로그인 → /host, 로그인+이메일미인증 → /dashboard. 가입 성공 → /dashboard.
- deploy 폴더 `.git` 없음 = **git 외부 확정** (CLAUDE.md 기재와 일치. cycle4 1/2 핸드오프의 "별도 repo" 표현은 부정확이었음).

### 랜딩 쪽 (채팅 클로드가 파일 직접 읽어 확인 — CC 불필요)
- index.html 버튼 전부 `data-cta` 위임 핸들러 경유. start/school/corp/share/login이 전부 같은 사전예약 모달로 가던 구조.
- pricing.html 4장 버튼은 핸들러·href 없는 맨 `<button type="button">` — 클릭해도 무동작이었음.
- **pricing.html엔 글로벌 `a { text-decoration:none }` 리셋이 없음** (index.html엔 있음). button→a 교체 시 밑줄 생김 → .cta에 text-decoration:none 한 줄 보정으로 해소.

## 완료된 작업

### index.html (8건 배선 + 모달 제거)
- nav 로그인 → `app.congre.kr/host`
- nav 시작하기 / Hero 무료로 시작 / CTA섹션 무료로 시작 → `app.congre.kr/signup` (3건)
- CTA섹션 행사 호스트에게 전달 → `data-action="share-host"` (Web Share + 클립보드 fallback)
- nav 요금 + 푸터 요금 → `/pricing` (2건)
- 학교·기업 도입 문의 → `mailto:hello@congre.kr` (2건)
- 사전예약 모달 HTML 41줄 + 관련 JS(configureSignup, submit 핸들러 등) 제거. demo 모달·toast·soon 토스트는 유지.
- 용량 178,267 → 172,582 bytes (-5,685)

### pricing.html (4건 배선 + CSS 보정)
- 무료 "지금 시작" / 스몰 "시작하기" / 미디엄 "시작하기" → `app.congre.kr/signup` (3건, button→a)
- 라지 "문의하기" → `mailto:hello@congre.kr` (button→a, class="cta secondary")
- `.cta`에 `text-decoration: none;` 한 줄 추가 (button→a 교체 시 기본 밑줄 방지용 보정)
- 용량 11,123 → 11,192 bytes (+69)

### 실측 (운영자, 폰+PC)
- index.html: 시작/로그인/무료시작 → 본 앱 이동 OK. 호스트에게 전달 → Web Share 공유시트 정상(제목·URL 정확). 데모 영상 재생 OK(회귀 없음). 콘솔 ReferenceError 0 (favicon 404 + "script loaded" 로그는 무관·무해).
- pricing.html: 버튼 4개 밑줄 없음. 무료/소형/중형 → /signup. 라지 → 메일앱. 버튼 모양 정상.

## 미착수 / 다음 작업 후보 (다음 세션 1번은 운영자가 택)

### 우선순위 높음
1. **옛 랜딩 `/` 삭제 + 그 자리 처리** — `src/app/page.tsx` (429줄, "이 순간을 영원히" 옛 랜딩). 운영자 "지워버려" 결정 있음. **삭제 후 `/`를 로그인/대시보드/redirect 중 무엇으로 할지 결정 비어 있음** — 그 결정부터. 작은 작업. (채팅 클로드 추천 1순위: 오늘 랜딩→본 앱 직행을 깔았는데 본 앱 `/`에 옛 랜딩이 남아있으면 동선 어수선)
2. **워터마크 본 앱 코드 구현** — 사양 확정(40px/0.40, Cormorant Garamond italic #c8892c 우하, 무료 플랜만). shotstack.ts createRender에 plan 인자 + render/start route에서 eventData.plan 전달 + 무료 전용 워터마크 트랙 + public/fonts/에 Cormorant ttf 추가. 순수 실행 트랙이나 렌더 파이프라인 핵심부라 검증 무거움.

### 우선순위 중간
3. **게스트 카피 개선** — /upload uploader 단계 "왜 이름·전화번호 입력하는지" 맥락 없음. 게스트 흐름 전체 카피 한 번에.
4. **dead code 정리** — host/page.tsx 안 옛 dashboard/create view + mockEvents 잔재.
5. **dashboard 썸네일** — 현재 placeholder. 인트로 미디어 썸네일 추출 로직 (기능 작업).

## 본 세션 학습 룰 후보 (격상 보류, 1회 관측)

1. **`<button>`→`<a>` 교체 사양엔 "그 파일에 글로벌 `a` 밑줄 리셋이 있는지" 선확인 필수** — index.html엔 있고 pricing.html엔 없어 같은 교체가 다른 결과(밑줄). 파일마다 글로벌 리셋 유무가 다름. CC가 자체 판단 안 하고 멈춰 보고한 건 올바른 동작.
2. **grep 문자열 카운트 ≠ 클릭되는 요소 수** — CC가 `mailto:` 카운트에 JS 문자열까지 잡아 "4개(메일 본문 내 1)"로 흐릿하게 보고. 실제 anchor는 3개. "버튼 N개"는 anchor 태그 기준으로 한 단계 더 갈라야 함.
3. **"백엔드 유지" 결정도 그 백엔드 실재부터 확인** — v5-r10 "사전예약 백엔드 유지/재활용"이 정찰 결과 *유지할 백엔드 자체가 없음*. 이전 핸드오프의 결정 문구를 코드로 한 번 더 검증.

## 다음 세션 진입 컨텍스트

- 사이클 4 = 디자인(1/2) + 버튼연결(2/2) **전부 종료.** 다음은 새 트랙.
- 랜딩 버튼 12건(index 8 + pricing 4) 전부 본 앱 직행 또는 mailto/Web Share로 연결됨. 사전예약 모달 제거됨.
- 본 앱 코드는 이번에 **0줄 변경.** 플랜 자동선택은 결제 트랙과 함께 미래로.
- 로그인 경로는 `/host`(login 폴더 아님), 가입은 `/signup`. 다음에 본 앱 라우팅 다룰 때 헷갈리지 말 것.

운영자 다음 세션 첫 메시지에 포함:
- 본 핸드오프 첨부
- 작업 영역 명시 (옛랜딩삭제 / 워터마크 / 게스트카피 중 택1)
- 옛 랜딩 삭제 택 시: `/` 자리를 뭘로 채울지 미리 생각해두면 결정이 빠름

## 작업 요약 (한 줄)

랜딩 버튼 12건(index 8 + pricing 4)을 본 앱 직행·mailto·Web Share로 연결 + 사전예약 모달 제거, www.congre.kr + /pricing 라이브 반영·실측 완료. 사이클 4 두 파트 전부 종료.
