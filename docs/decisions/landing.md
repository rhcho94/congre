# Decisions — Landing

> 랜딩 페이지(congre.kr / www.congre.kr, 정적 HTML `deploy/` 폴더) 디자인·자산·배포 관련 결정. 새 결정은 맨 위에 추가 (최신이 위).

## 2026-08-11 (20) — 랜딩 푸터 사업자 정보 신설 + 문의 이메일 회사 도메인 전환

- 배경: 전자상거래법상 사업자 신원 표시 의무와 토스 PG 카드사 심사 대응. 앱(terms·privacy)에는 f7561f6으로 적용됐으나 랜딩은 미적용이었다.
- 사업자 정보 7항목: index.html 푸터 .foot-bottom 뒤에 형제 요소 <div class="foot-biz"> 신설, 3줄 구성. 값은 src/app/terms/page.tsx:325-335와 문자 단위 동일.
- .foot-bottom 안에 넣지 않은 이유: 이 블록은 display:flex + justify-content:space-between 가로 2열(© 문구 ↔ .foot-legal)이라 세 번째 자식을 넣으면 데스크톱에서 두 요소 사이에 끼게 된다. 형제로 분리하면 기존 CSS 규칙을 한 줄도 건드리지 않는다.
- CSS 추가: .foot-biz 4규칙 10줄(margin-top 18px / var(--font-body) / var(--text-s) / var(--muted) / line-height 1.8, p margin 0, a는 색 상속). 기존 .foot-bottom·.foot-legal·.foot-grid·footer 규칙 무접촉. 미디어쿼리 무접촉 — p 나열이라 좁은 화면에서 자연 줄바꿈된다(모바일 실측 확인).
- 문의 이메일: hello@congre.kr → cs@rayne.co.kr. index.html 푸터 4곳(학교 도입 문의·기업 도입 문의·고객센터 + 하단 바는 href와 표시 텍스트 둘 다) + pricing.html:1030 "문의하기 →" 버튼 1곳. congre.kr은 수신 MX가 없어 종전 주소로 온 문의는 전부 소실되는 상태였다.
- pricing.html에 사업자 정보를 넣지 않은 이유: 이 파일에는 <footer> 태그가 없다(가격 섹션 하단 안내문 1줄이 전부). 신설하면 L7(Pretendard 미전환)과 톤이 어긋난다. 전자상거래법상 표시 지점은 초기화면이므로 index.html로 요건을 충족한다고 판단. 심사관이 서브페이지까지 요구할 경우 재검토.
- 랜딩은 git 외부 트랙 → 이 변경은 git에 없고 Vercel 배포본에만 존재한다. 백업: index_pre_bizinfo_backup.html, pricing_pre_email_backup.html (편집 전 상태). 배포: npx vercel --prod, deployment 3i3123mbEX7q47doeqBg2tg57WjY, 별칭 congre.kr·www.congre.kr 양쪽 반영 확인. 데스크톱·모바일 실물 확인 완료.
- known-issues L8에 확인 항목 등재 (CD zip 덮어쓰기 시 재적용 대상).

## 2026-06-16 (19) — 랜딩 라이트 톤 전환 (다크+골드 → 밝은 파스텔) 확정·배포

- 방향 전환: 2026-05-23 (다크+골드) 및 2026-06-15 핸드오프(1)의 "히어로=다크"
  시스템을 라이트(밝은 파스텔)로 뒤집음. 계기 = 운영자 수집 Partiful 실물이
  라이트 톤이었고, 다크 1차 배포가 "빨강 으스스+휑함"으로 실패.
- 확정 토큰 (deploy/index.html :root):
  - --bg #f4f1ea (아이보리 fallback), --text #1a1612 (먹색), --muted #6b635a
  - --accent #E8794A (주황, 기존 빨강 #FF5A5F에서 채도 뺀 것)
  - --warm #CFFF4D (라임, 유지)
  - 폰트 Pretendard (Cormorant 완전 제거)
- 배경: animated CSS gradient (정적 이미지 폐기). 화면 고정 레이어(body::before
  position:fixed)로 viewport에 고정 — 스크롤해도 화면 안에서 흐름.
  prefers-reduced-motion 정지 포함.
  - 비비드 파스텔 6색: #b9a8e6 #98c6ea #f0a8d0 #a0ddc8 #e6d68f.
  - 진하기: 낮 자연광 실측 통과로 비비드 확정 (2026-06-16). 야간 1차
    "진한 감"은 조명 탓이었고 낮에는 문제없음. 중간안(#cfc4ec 계열)은 미채택.
- 표면: 프로스티드 글래스 (rgba(255,255,255,0.55) + backdrop-filter blur).
- 다크 섬 의도적 보존: 히어로 영상 데모(.vid-main) + 모달 오버레이 + 이미지 위
  가독성 스크림은 다크 유지 (영상 미리보기는 다크가 돋보임).
- 가독성 후속 (2026-06-16): 라이트 전환 후 다크 잔재 색 11곳 정리
  (LIVE·EDITING 글자, 외주2주/예전방식 글자, Congre 붉은기, Occasions 큰 영상
  3개 글씨 삭제, 하단 4타일 VIDEO 라벨 추가). 배경 진하기 비비드 채택.
- 랜딩은 git 외부 트랙 → 본 변경은 git에 없고 Vercel 배포본에만 존재.
- 폐기(다시 채택 금지): 정적 이미지 배경(shimmer webp), html 직접 배경
  (페이지 전체 캔버스라 화면 안 꿈틀거림 약함).

## 2026-06-13 (18) — 랜딩 pricing 무료 클립 수 10→5 표기 통일

- 가격 모델 전환(market-product.md 2026-06-13 (7))에 따라 무료 플랜 클립 수 5개로 변경.
- 변경 파일 (git 외부 랜딩 트랙):
  - deploy/pricing.html L283 — "클립 10개까지" → "클립 5개까지"
  - deploy/Pricing Card.html L162 — 동일
- 배포: dpl_A8FiJUH9MfnHHnKGAuC4pYXaQCUi (production, READY)
- 푸터 약관·개인정보 절대경로 4건(app.congre.kr) 보존 확인 (known-issue L8).
- 미반영(CD 트랙 이월): 4카드 구조 자체는 폐기된 소·중·대 플랜 기준이라, 계산식 단가 모델로의 pricing 재설계는 CD 시안 작업으로 분리(다음 랜딩 사이클).

## 2026-06-13 — 랜딩 편집 시간 표기 8분 통일

- 기존: 히어로 "5분", 후기 통계 "12분", WHY NOW 카피 "Congre는 5분" 혼재(충돌).
- 결정: 전부 8분 통일. 근거 — 5분은 평균값으로 빡빡, 12분은 "빠르다" 메시지 약화. 8분이 절충.
- 적용 위치(deploy/index.html): 히어로 L2383, 후기 L3578, WHY NOW 헤드 L3182, SVG 텍스트 L3356, SVG 주석 L3299·3334·3355, 데모 카드 L2584("7분 32초", 평균보다 짧은 단일 사례).
- 배포: 2026-06-13 `npx vercel --prod`, `www.congre.kr` alias READY.
- 비고: 랜딩은 git 외부라 CHANGELOG 미반영. 본 결정이 유일한 기록. clip-time "N분 전" 가짜 피드는 편집시간 무관이라 미변경.

## 2026-06-10 (13) 공통 토큰 폰트 = display:Cormorant / body:Pretendard (두 트랙 통일)

랜딩(2026-05-27 (5))과 본 앱의 UI 본문 폰트를 Pretendard로 통일. 본 앱에서 DM Sans 완전 제거.

- 본 앱 `--font-display` = Cormorant Garamond italic (브랜드/디스플레이, 유지)
- 본 앱 `--font-body` = `"Pretendard Variable", Pretendard, system-ui, sans-serif` (랜딩 체인과 동일)
- next/font `DM_Sans` 인스턴스·import 제거 (`src/app/layout.tsx`). Cormorant만 next/font 유지.
- `globals.css` `--font-body`를 :root에서 직접 정의 (next/font 변수 주입에 의존하지 않음). `--sans` 토큰도 Pretendard 체인으로 재정의 — `.eyebrow`·`.badge`가 system-ui로 떨어지지 않도록.
- body `font-family`를 평탄한 단일 체인 `var(--font-body)`로 정리. 기존 `var(--font-body, 'DM Sans'), var(--pretendard)` 중첩 폴백 제거.

**이유**: 2026-05-27 (5) 항목에서 본 앱 측 폰트는 "별도 결정 영역"으로 보류. 한글 본문이 명시적 폰트 없이 시스템 폴백으로 떨어지는 현황 + 랜딩과 본 앱 톤 불일치 해소를 위해 통일. Pretendard Variable이 라틴·한글 모두 커버하므로 본문 폰트 일원화 가능.

**확인 못 함**: `--pretendard` 토큰(33행)은 그대로 둠. `--font-body`와 사실상 동일 체인이라 중복 — 정리는 별도 커밋.

## 2026-05-31 (12) 랜딩 푸터 약관·개인정보 링크 → 본 앱 절대경로

랜딩 푸터의 "이용약관" / "개인정보처리방침" 링크 4건(footer 본문 2 + foot-bottom 2)을 자기 도메인 상대경로(`/terms`, `/privacy`)에서 본 앱 절대경로(`https://app.congre.kr/terms`, `https://app.congre.kr/privacy`)로 변경.

**배경**: 랜딩 `deploy/` 폴더에는 `terms.html` / `privacy.html` 파일이 없고 `vercel.json`도 rewrites 없음(`cleanUrls`만). 즉 `congre.kr/terms` · `congre.kr/privacy` 라이브 응답이 **HTTP 404**. 약관·개인정보 페이지는 본 앱(`src/app/terms/page.tsx`, `src/app/privacy/page.tsx`)에만 존재.

**옵션 비교**:
- (a) 절대경로 — 채택. 본 앱 단일 소스 유지, 약관 v0.x 갱신 시 본 앱 한 곳만 수정. 랜딩 사용자 입장에서 도메인 전환은 한 번 클릭.
- (b) 랜딩 `deploy/`에 `terms.html`·`privacy.html` 추가 — YAGNI 위반. 약관 v 갱신 시 본 앱·랜딩 양쪽 동기 부담 발생, 두 버전이 어긋날 위험.

**라이브 검증**: `https://app.congre.kr/terms` / `/privacy` 둘 다 HTTP 200 (2026-05-31).

**git 외부 트랙 주의**: 본 변경은 `deploy/index.html` 직접 수정 + Vercel 수동 배포. git 형상에 없음. 다음 CD 랜딩 zip 적용 시 푸터 4건 절대경로가 유지되는지 확인 의무 — known-issues L8 참조.

## 2026-05-30 (10) V5 R10 — 8섹션 swap + R4 압축

8섹션 순서 변경:
- 변경 전: Hero → Why now → How → Showcase → Moments → Occasions → Testimonials → CTA
- 변경 후: Hero → Showcase → How → Why now → Moments → Occasions → Testimonials → CTA

이유: 결과물(시각 hook) 먼저 → 동작 방식 → 외주 대비 우위 흐름. AIDA(주의·관심·욕구·행동) 변형.

R4 (Showcase) 섹션 17인치 노트북 viewport 압축 — 헤드라인 + 서브 + 카드 5장 + 캡션 본문이 100vh 안에 다 들어오도록 padding·gap 압축. 100vh 룰 전 섹션 일관성 유지.

라이브 반영: www.congre.kr (2026-05-30)

## 2026-05-30 (11) 가격 표시 UI 4장 (덩어리 2)

`/pricing` 페이지에 가격 4장 섹션 박음 — Pricing Section.html이 deploy/pricing.html 통째 교체.

4장 카드 사양:
- 무료: 가격 자리 "무료로 테스트" (eyebrow 없음, 부제 없음), 클립 10개까지, 업로드 클립 길이 10초, 워터마크 포함, 다운로드 가능, CTA "지금 시작"
- 소형: ₩10,000 / 1회 결제, 클립 50개까지, 업로드 클립 길이 10~30초, 워터마크 없음, 다운로드 가능, CTA "시작하기"
- 중형 (추천 배지 + 앰버 테두리): ₩50,000 / 1회 결제, 클립 200개까지, 업로드 클립 길이 10~30초, 워터마크 없음, 다운로드 가능, 우선 처리, CTA "시작하기"
- 라지: 별도 문의 / 클립 200개 초과·커스텀, 클립 200개 이상, 업로드 클립 길이 10~30초, 워터마크 없음, 다운로드 가능, 전담 지원, 현장 옵션 상담 가능, CTA "문의하기"

섹션 헤드라인: 요금 (eyebrow) / "행사 규모에 맞춰 고르세요" / "무료로 먼저 만들어 보고, 필요한 만큼만 올리세요."

Footnote: "* 결제는 이벤트당 1회. 재편집 시 처음 금액의 80%로 재결제됩니다."

폰트: Pretendard (V5 톤). 디자인 토큰 일관.

라이브 반영: www.congre.kr/pricing (2026-05-30)

## 2026-05-28 — /pricing 가격 페이지 신규 + nav·footer 처리

- **결정**: `deploy/pricing.html` 신규. Hero + 행사유형 카드 4장 + 리드 폼 + footer. `vercel.json {"cleanUrls": true}`로 `/pricing` 깔끔한 URL.
- **nav "요금"**: 토스트 placeholder 제거 → `/pricing` 연결 (index.html top nav + footer 2곳).
- **footer**: index.html literal 복사 시 토스트 핸들러 script 부재로 죽은 링크 발생 → 단순화 + 도입문의(메일·카톡 외부 동작) 2개 삭제.

## 2026-05-27 (4) — 랜딩 카피 아키텍처 전면 교체 (R1·R2·R3 사이클)

- **결정**: 랜딩 메시지 아키텍처 전면 교체. 주요 카피 변경:
  - Hero: "행사가 끝나기 전에, 영상이 나옵니다." + "각자 폰으로 10초씩. AI가 실시간으로 한 편을 만듭니다."
  - Why now: "외주는 2주, Congre는 5분." + "편집자 없이, 기다림 없이, 행사 끝나기 전에."
  - How it works: 키커 "이렇게 동작합니다" (영어 HOW IT WORKS → 한글) + 카드 카피 정정 (Card 02 셀카 촬영 → QR 진입+촬영)
  - 메트릭: 평균 편집 시간 5분으로 통일 (이전 12분은 실측 아닌 영업용 placeholder)
  - "식" → "행사" 전체 치환
- **이유**: 직전 카피가 추상·기능 나열 위주였고 BM 핵심("행사 끝나기 전 영상") 직접 표현 부족. 운영자 11장 캡처 진단에서 12개 문제점 도출.
- **적용**: R1~R3 CD 사이클로 적용. 결과는 CD 프로젝트 보관, 로컬 미반영. R4~R8 마감 후 zip export → 로컬 풀어덮기 → vercel 일괄 배포.

## 2026-05-27 (5) — Pretendard 산세리프 폰트 도입

- **결정**: 랜딩 디스플레이·본문 모두 Pretendard 산세리프로 통일. Cormorant Garamond italic 제거. 단 nav 로고 "Congre"는 예외 — 브랜드 마크 룰(CLAUDE.md 절대 규칙) 따라 serif italic 골드 유지.
- **이유**: 한글 본문 가독성 + 산세리프 톤이 IT 도구로서의 격식 우선. Cormorant은 한글 미지원이라 본문에선 한글 영역만 다른 폰트로 갈라져 일관성 깨짐.
- **적용**: CDN `https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css`. 본 앱 토큰(`--font-display` Cormorant)과는 의도적 분리 — 랜딩과 본 앱 트랙별 폰트 정책 갈라짐. 본 앱 측 폰트는 별도 결정 영역.

## 2026-05-27 (6) — 모든 섹션 100vh 단위 정렬 룰

- **결정**: 랜딩 모든 섹션 `min-height: 100vh` + flex center. 17인치 노트북(1280×800 ~ 1920×1080) 기준 1페이지 단위로 떨어짐. 이웃 섹션이 같은 viewport에 안 나타남.
- **이유**: 운영자 진단 "잘림" 영역의 근본 처방. 섹션 경계가 viewport 중간에서 끊기면 위·아래 섹션이 동시에 일부씩 보여 어느 섹션인지 인지 부담. 100vh 단위는 한 번에 한 섹션 풀이 원칙.
- **적용**: 모든 `<section>` + `<footer>`에 적용. 콘텐츠가 100vh 초과 시 자연 늘어남 허용 (min-height라 max 아님).

## 2026-05-27 (7) — How it works 카드 톤 크림 배경

- **결정**: How 섹션만 다크 페이지(`#0c0b09`) 위에 크림 카드(`#f5efe4` 영역)로 강한 대비. 다른 섹션(Hero·Why now 등)은 다크 시네마틱 톤 유지.
- **이유**: 운영자 결정. 시각 다양성 + "이렇게 동작합니다"의 친근한 톤 표현. 다크 일관성 vs 섹션별 톤 차이 갈래에서 후자 채택.
- **적용**: How 섹션 카드 3개 모두 크림 배경. 카피·아이콘 톤 다크 텍스트로 가독성 확보.

## 2026-05-27 (1) — Kling 이미지 생성 시 NO-TEXT 룰 강제

- **결정**: Kling AI로 이미지 생성 시 프롬프트에 NO-TEXT 룰을 명시적으로 박는다. 배경에 한국어·영어 텍스트, 현수막, 칠판, 포스터 등 글자 들어가는 요소 모두 배제. Negative prompt에도 hangul text / gibberish text / scrambled characters 명시.
- **이유**: CD #3 (콘텐츠 수정 및 동영상 추가) 사이클에서 중학교 졸업식 클립 배경 현수막에 국적 불명 가짜 한국어 글자 등장. Kling이 한국어를 제대로 못 쓰는데도 "한국어처럼 보이는 글씨"를 만들어 넣는 경향 발견.
- **적용**: 모든 신규 Kling 이미지 생성에 NO-TEXT 룰 표준 프롬프트 포함 필수.

## 2026-05-27 (2) — 랜딩 페이지 변경 흐름 = CD → zip → 로컬 → Vercel 직접 배포

- **결정**: 랜딩 페이지(`deploy/` 폴더)는 git 외부 트랙. 변경 흐름은 CD에서 zip 받아 → `C:\Users\PC\Downloads\congre\deploy`에 풀어덮기 → `npx vercel --prod --yes`. 현재 상태로 결정.
- **이유**: CD가 zip 패키지로 deploy 폴더 통째 재생성. CC가 단일 1만 줄 HTML 다루는 부담 회피. 운영자 1인 작업이라 git 분기·머지 효익 낮음.
- **적용**: 변경 이력 git 외부. 롤백은 Vercel Deployments 탭 promotion으로. 다음 트랙 도입(예: git 추가) 검토 시점: (a) 협업자 추가, (b) 큰 디자인 리팩토링, (c) Vercel Deployments 히스토리 한도 도달.

## 2026-05-27 (3) — 결혼식 영상 15초 4편 (풀버전 안 만듦)

- **결정**: 결혼식 영상은 15초짜리 4편으로 운영. 풀버전(45초)은 제작 안 함.
- **이유**: 운영자 결정. 마키 가로 스크롤·Hero·Bento 임베드 모두 짧은 클립이 더 자연스러움. 풀버전 제작 부담 회피.
- **적용**: `deploy/videos/` 폴더에 wedding_1.mp4, wedding_2.mp4, wedding_intro.mp4 3개 + Hero용 1개 = 4개 유지. 풀버전 추가 안 함.

## 2026-05-25 — 이미지 슬롯 사양 9:16 / 360×640 / JPG·WebP / 50-100KB

- **결정**: Hero 영역 이미지 슬롯 컴포넌트(`image-slot.js`)에 들어갈 이미지 표준 사양. 9:16 세로 비율, 360×640px 또는 450×800px, JPG 또는 WebP, 개당 50-100KB.
- **이유**: 실제 표시 크기 약 40×72px (작은 썸네일). 레티나·고해상도 위해 표시 크기의 4-9배 권장. 총 50장 목표 시 ~1.5MB 이하로 압축.
- **적용**: 이미지 생성·교체 시 위 사양 준수. 현재 41장 채워짐 (9장 결손, known-issues 랜딩 영역 L2).

## 2026-05-24 (1) — Occasions 섹션 챌린지·모임 카테고리 신규 추가

- **결정**: Occasions 섹션 Bento 그리드에 "챌린지·모임" 7번째 타일 추가. K-pop 챌린지 영상(challenge.mp4) 노출 위함.
- **이유**: 원래 5개 카테고리(졸업/결혼/기업/동창회/생일/추모 6개)에 K-pop 영상을 어디에 둘지 모호. 색감(네온·그래피티) 차이로 기존 카테고리에 안 맞음. 별도 카테고리 신설이 자연스러움. 추모 타일은 size-sm으로 축소해 자리 확보.
- **적용**: Occasions 7타일 구조 확정. 챌린지·모임 외 4타일(기업·동창회·생일·추모)은 현재 placeholder, 영상화 여부 미정 (known-issues 랜딩 영역 L3).

## 2026-05-24 (2) — 영상 4편 풀패키지 배치 (Hero + Bento + Showcase)

- **결정**: 4개 영상을 3곳에 분산 배치.
  - Hero (위치 1): wedding_1.mp4 — 우측 세로 폰 프레임 자동 루프
  - Bento Occasions (위치 2): wedding_2 / graduation / challenge — 3타일 임베드, 호버 시 재생
  - Showcase 신규 섹션 (위치 3): 4편 가로 마키 (How it works ↔ Occasions 사이)
- **이유**: 한 곳에 몰면 단조로움. CapCut·HeyGen·Runway·Tavus·Descript 등 다른 영상 편집 플랫폼 패턴 참고해 분산 배치가 랜딩 흐름에 더 효과적.
- **적용**: 모바일 데이터 절약 위해 Hero 외 영상은 preload="none", IntersectionObserver로 스크롤 도달 시 로드. autoplay muted loop playsinline.

## 2026-05-23 — 랜딩 톤 다크 시네마틱 + 골드 유지

- **결정**: 랜딩 페이지 톤을 본 앱과 동일한 다크 시네마틱(#0c0b09) + 골드 액센트(#c8892c)로 유지. Round 1B(밝은 변형) 비교 안 함.
- **이유**: 본 앱 다른 페이지(대시보드·업로드·약관)와 톤 일관성 우선. 다크 톤이 "공식 행사 도구"로서의 격식·신중함 신호. 친근함은 카피·이미지로 보완.
- **적용**: 디자인 토큰 그대로 유지. 랜딩에서도 같은 hex 사용. 변경 시 두 트랙 동시 갱신 필요.
