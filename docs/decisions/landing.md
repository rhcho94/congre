# Decisions — Landing

> 랜딩 페이지(congre.kr / www.congre.kr, 정적 HTML `deploy/` 폴더) 디자인·자산·배포 관련 결정. 새 결정은 맨 위에 추가 (최신이 위).

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
