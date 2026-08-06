# Congre — 프로젝트 스냅샷

> 이 문서는 "현재 상태"를 담습니다. 변경 시 즉시 갱신.

## 앱 개요

다수 참가자가 폰으로 짧은 인터뷰 영상을 올리면 자동 편집해 하나의 회고 영상으로 만들어주는 서비스. 1순위 시장은 초·중·고 졸업식 (학생 본인이 자기 소감을 찍는 1인칭 콘텐츠). 결혼식·기업 행사·동창회 등은 보조 시장. 클립 길이는 인당 10초 이내. 자세한 시장 정의는 docs/DECISIONS.md 참조.

**완성본 생성 시간 (SLA 근거)**: 마감 후 약 7분. 실측 100클립×10초 단독 렌더 1건 기준 done까지 7분 10초, 우리 S3에 1.5GB 정상 도착·재생 확인 (2026-06-11). 동시·풀레이어링은 미검증.

## 로컬 개발

```bash
npm run dev          # Next.js 개발 서버 (http://localhost:3000)

# Firestore 에뮬레이터 (보안 규칙 테스트용)
npx firebase emulators:start --only firestore
```

에뮬레이터 UI: http://localhost:4000 → Firestore → Rules Playground에서 규칙 검증 가능.
에뮬레이터는 prod 데이터에 영향 없음. 종료 후 데이터 초기화됨.
사전 조건: Java 설치 필요 (https://java.com/download). 미설치 시 "Could not spawn `java`" 오류.

**중요**: 에뮬레이터 테스트 통과는 실 배포 아님. 코드 변경 + 커밋 + push만으론 Firestore에 미반영. 실 배포는 Firebase 콘솔 Rules 탭 게시 또는 `firebase deploy --only firestore:rules`. 본 룰 누락 시 클라이언트 동작이 옛 규칙으로 거부됨 (CLAUDE.md 절대 규칙 참조).

## 배포 / 저장소

- Vercel: https://app.congre.kr
- GitHub: https://github.com/rhcho94/congre
- 개발 환경: Windows PC, Claude Code
- 운영 모니터링·한도/비용 점검: `docs/ops/monitoring.md` (2026-06-02 신규)
- Vercel 프로젝트명: congre

## 기술 스택

- Next.js (TypeScript, App Router)
- Firebase Auth + Firestore (project: congre-mvp, Blaze 요금제)
- AWS S3 (bucket: congre-mvp-videos)
- Shotstack (AI 영상 편집) — production 키 적용. rich-text asset으로 한글 인트로/아웃트로 렌더.
- `public/fonts/NotoSansKR-Regular.ttf` — 한글 렌더링용 커스텀 TTF (SIL OFL). Shotstack `timeline.fonts` 소스.
- `public/fonts/CormorantGaramond-Italic.ttf` — Shotstack 워터마크용 italic 세리프 TTF (SIL OFL). 무료 플랜 워터마크 `timeline.fonts` 소스.
- Vercel 배포
- Tailwind v4 (config 파일 없이 @import 방식)

주요 의존성: `@aws-sdk/client-s3`, `@aws-sdk/s3-request-presigner`, `firebase`, `firebase-admin`, `resend`, `solapi`, `qrcode.react`, `lucide-react`, `canvas-confetti`.

## 디자인 시스템

라이트/파스텔 톤이 기본. 다크는 업로드·공유 화면(`[data-theme="dark"]` 스코프)에만. 정의: `src/app/globals.css` (값은 2026-06-17 라이트 실값 기준).

| 토큰 | 값 | 용도 |
|---|---|---|
| `--bg` | #f4f1ea | 페이지 배경(아이보리) — `body::before` bgflow 14s 파스텔 그라데이션이 위에 깔림 |
| `--surface-1` | #ffffff | 카드 배경(불투명 흰색) |
| `--surface-2` | #f0ece2 | 카드 내부 강조 / 입력칸 |
| `--surface-3` | #e8e2d5 | 더 강한 강조 / 입력 focus |
| `--accent` | #E8794A | 주황 액센트(랜딩 통일, 골드 #c8892c 폐기) |
| `--accent-hi` | #ef8a5d | 액센트 hover |
| `--accent-soft` | #E8794A1f | 액센트 약(배지·box-shadow 등) |
| `--text` | #1a1612 | 본문 텍스트(먹색) |
| `--text-dim` | #3d362e | 본문 보조 |
| `--muted` | #6b635a | 보조 텍스트 |
| `--hairline` | rgba(26, 22, 18, 0.08) | 약한 헤어라인 보더 |
| `--hairline-strong` | rgba(26, 22, 18, 0.14) | 강한 헤어라인 보더 |
| `--font-display` | Cormorant Garamond italic (next/font 주입) | 디스플레이 |
| `--font-body` | Pretendard Variable, Pretendard, system-ui, sans-serif | 본문 (라틴·한글 모두 커버, 랜딩과 통일. 2026-06-10) |

Legacy 별칭: `--surface`=`var(--surface-1)`, `--border`=`var(--hairline-strong)`, `--accent-bright`=`var(--accent-hi)`.

다크 오버라이드(`[data-theme="dark"]` 12개 변수): --bg #0c0b09 / --surface-1 #151310 / --surface-2 #1e1a13 / --surface-3 #28221a / --accent #c8892c(골드) / --accent-hi #d99a3a / --accent-soft #c8892c1f / --text #ede8df / --text-dim #c8c2b6 / --muted #79716a / --hairline rgba(237, 232, 223, 0.07) / --hairline-strong rgba(237, 232, 223, 0.14).

글로벌 유틸리티: `.glass-panel` (frosted glass + inset sheen + fractalNoise grain), `.rule` (장식 수평선).

## 브랜드 표기 규칙

- UI에 보이는 모든 "Congre" → 대문자 C + 주황(#E8794A) + serif italic
- "made by Congre"는 별도 패턴 ("made by"는 muted, "Congre"는 표준 스타일)
- 공통 컴포넌트 `src/components/BrandName.tsx` 사용
- 변수명·파일명·환경변수·도메인 등 기술 식별자는 소문자 (congre-mvp, app.congre.kr)

## Firebase 커스텀 이메일 발신 도메인

- 발신 도메인: `congre.kr` (Firebase Console → Authentication → Settings → Email Sender Domain)
- DNS 레코드 (가비아 등록): TXT SPF, TXT verification, CNAME DKIM ×2
- Firebase Console Templates Action URL: `https://app.congre.kr/verify-email`
- 설정 완료: 2026-05-19 v3 (P3d)

## 환경변수 (Vercel)

| 변수 | Production | Preview/Development |
|---|---|---|
| SHOTSTACK_API_KEY | production 키 | stage 키 |
| SHOTSTACK_ENV | production | stage |
| NEXT_PUBLIC_APP_URL | https://app.congre.kr | 확인 필요 |

(Firebase, AWS 관련 환경변수는 Vercel 대시보드 참조)

## 완료된 기능

- 주최자 로그인/대시보드 (Firebase Auth, 비밀번호 찾기 포함)
- **호스트 가입 흐름** (`/signup` 페이지 + users 컬렉션 + 이메일 인증 발송 + rollback. 2026-05-19 v2)
- **대시보드 사용 가이드 링크** (3곳 nav: dashboard/, dashboard/create/, dashboard/events/[eventId]/. 2026-05-19 v2)
- **이메일 인증 차단 흐름** (EmailVerificationBanner + 대시보드 이벤트 생성 버튼 비활성 + /dashboard/create 미인증 리디렉션 + Firestore email_verified 규칙. P3a. 2026-05-19 v3)
- **이메일 인증 Custom Action URL + /verify-email 페이지** (Firebase actionCodeSettings + applyActionCode + Suspense 래퍼. P3b. 2026-05-19 v3)
- **Firebase Auth 커스텀 이메일 발신 도메인** (auth.congre.kr DNS 검증 완료, 발신 주소 noreply@congre.kr. P3d. 2026-05-20)
- 이벤트 생성 + QR 코드 + 공유 링크 + QR 이미지 저장
- 참가자 영상 촬영 (카메라 미리보기 → 촬영 → 업로드)
- S3 업로드 (presigned URL)
- 카메라 전/후면 전환 (standby에서만)
- 마감 기능 (세션 토큰 만료)
- Shotstack 환경 분기 (stage/production 자동)
- 한글 자막
- SNS 공유 버튼 (카카오·링크 복사)
- Congre 배지 (BrandName 컴포넌트)
- iOS Safari 호환성 (capture 480p 사고 옵션 B 처리, 2026-05-19 v1)
- 본 앱 루트 `/` → `/host` 서버 리디렉트 (`src/app/page.tsx` `next/navigation` `redirect()`. 2026-05-31. 옛 본 앱 랜딩 + 파티클 컴포넌트 3개 삭제 — 외부 랜딩 `congre.kr`로 일원화)
- 앱 내 로고·홈 버튼 18곳 → 외부 랜딩 `congre.kr` 직접 연결 (`LANDING_URL` 상수 `src/lib/constants.ts`. 2026-05-31. 회원 탈퇴 직후만 `/host`로 분리)
- 마감/렌더링/완료 상태에서 QR/링크 박스 자동 숨김
- 이벤트 페이지 overflow 정리
- 클립 재생 Pre-signed URL (주최자 대시보드에서 인라인 미리보기, firebase-admin 인증)
- 알림 시스템 (Resend 이메일 + SOLAPI SMS, 채널 어댑터 패턴, notifications 컬렉션 이력 저장)
  - 트리거 연결 6건: 이벤트 생성, 렌더 시작, 렌더 완료, 렌더 지연(10분 초과), 렌더 실패, **참가자 결과**
  - 함수만 구현 1건: 첫 클립 업로드
- **Firestore 보안 규칙 현 상태 (2026-08-06 콘솔 게시 완료, 저장소 파일과 일치 실측)**:
  - `events`: read·**create**·update 전부 차단. 생성은 `POST /api/events`(Admin SDK) 전담
    — 클라이언트 직접 생성을 허용하면 `unlocked:true` 자기부여로 결제 게이트 우회
    (2026-08-06 보안 감사 H-2, `bc7915a`). delete는 미기재로 암묵 거부
  - `clips`: read·create·update·delete 전부 차단 (2026-06-18 `0a83224`)
  - `notifications`: read·write 차단 (Admin SDK 전용)
  - `users`: read·create는 본인 doc만(`request.auth.uid == userId`),
    update는 `hasOnly(['name','phone'])` 화이트리스트, delete 차단
  - `betaCoupons`·`leads`: 규칙 미기재 → 암묵 거부. Admin SDK 전용
  - catch-all default-deny 미기재 (known-issues LOW 등재)
- 한글 인트로/아웃트로 (이벤트 생성 폼 입력 → Firestore 저장 → Shotstack rich-text 클립 삽입, NotoSansKR TTF 호스팅)
- 자동 삭제 cron (`/api/cron/cleanup`, KST 03:00 daily) — 클립 24h, 완성본 7d. 멱등성 마커: clipsDeletedAt, videoDeletedAt. 완성본 S3 객체 실제 삭제는 2026-07-12(33430b6)에 복구됨 — Track ⑦ 저장 위치 이전 시 누락됐던 드리프트.
- 이용약관 / 개인정보처리방침 페이지 (`/terms`, `/privacy`) — v0.1 시행. 푸터 링크. 변경 이력은 `docs/legal/CHANGELOG.md`.
- **마이페이지 P1·P2·P3·P4** (`/mypage` — 이벤트 요약 + 프로필 표시 + name·phone 수정 + 비밀번호 변경 + 회원 탈퇴. dashboard nav 링크. 2026-05-20)
- 참가자 영상 클립 음량 페이드 (volumeEffect: fadeInFadeOut, BGM mixing 영역)
- 트랜지션 in/out 분리 (pickSequence 2회 호출, 시각 다양성)
- outroText + outroMedia 동시 입력 사고 해소 ([A] 분기 직렬 배치)
- **가격 페이지 + 리드 수집 폼** (랜딩 `/pricing` → 본 앱 `/api/lead` → Resend → 운영자 메일. emailChannel reply-to 확장. 2026-05-28)
- **워터마크 사양 확정** (40px / 0.40 / MEDIUM, 무료 플랜만. 본 앱 코드 구현은 별도 트랙. 2026-05-30. decisions/rendering.md 참조)
- **무료 플랜 워터마크 구현** ("made by Congre" rich-text, 우하단 align right/bottom, Cormorant Garamond italic 40px #c8892c, clip opacity 0.40, length "end" 최상단 트랙. plan==="free" 조건. 텍스트 공백 패딩으로 모서리 여백. 2026-06-01. decisions/rendering.md 2026-06-01 참조)
- **게스트 업로드 화면 호스트 이름 노출 + 안내 카피 보강** (`/api/events/[eventId]` 게스트용 GET 응답에 `hostName` 1개 필드 추가 — users 컬렉션 `name`만 join, email·phone 등 다른 PII 비노출. uploader 단계 첫 방문 문구에 호스트 이름·행사 이름·요청 영상 길이 노출 + 입력 정보 사용 목적 안내. 2026-06-01. decisions/data-flow.md 2026-06-01 참조)
- **게스트 업로더 4단계 흐름 안내 스트립** (`src/components/FlowStrip.tsx` — 이름·번호 / 촬영 / 올리기 / 링크 받기. CD app-restyle/Flow Strip.html 자산을 React+Tailwind로 변환. 첫 방문 `!isReturning` 노출. 인라인 SVG, 외부 의존성·전역 CSS 클래스 0. 2026-06-01. decisions/misc.md 2026-06-01 참조)
- **게스트 초대 링크 동적 OG 카드** (`src/app/upload/[eventId]/layout.tsx` server-side `generateMetadata` — events.title + users.name Admin 2회 조회, `${hostName}님이 초대했어요 · ${title}` 형식. hostName 12자/title 20자 초과 시 절단, hostName 없으면 `${title} 영상에 초대합니다` fallback. 카카오·SNS 미리보기 카드 동적화. PII 미노출(텍스트만). 2026-06-01. decisions/data-flow.md 2026-06-01 OG 항목 참조)
- **초대장 OG 미리보기 이미지** (`/api/og-image/[eventId]` 프록시 라우트 — events.introMediaType==="image"일 때만 S3 객체 바이트 직접 서빙(비공개 버킷 유지), 영상/미설정/실패 시 `/logo.png` 302 fallback. openGraph.images + twitter.summary_large_image. OG URL은 정식 도메인 하드코딩(known-issues 참조). 2026-06-03)
- **가격 표시 UI 4장 라이브 반영** (`www.congre.kr/pricing` — 무료·소형·중형·라지. Pricing Section.html로 deploy/pricing.html 교체. 2026-05-30. decisions/landing.md 2026-05-30 (11))
- **이벤트별 영상 색감(필터) 옵션** (대시보드에서 선택: 시네마틱(muted) / 화사하게(boost) / 또렷하게(contrast). 저장 시 events.videoFilter, render/start가 읽어 createRender style 인자로 전달, 참가자 video clip 각각에 Shotstack filter 적용. 미선택 시 미적용(현재와 동일). 2026-06-06. decisions/rendering.md 2026-06-06 참조)
- **이벤트별 전환(transition) 스타일 옵션** (대시보드 "영상 스타일" 카드 select 2번째: 기본(현행 4종 혼합) / 부드럽게(soft=fade·fadeSlow) / 역동적으로(dynamic=slideLeft·slideRight·zoom). 저장 시 events.videoTransition, render/start가 createRender style.transition으로 전달, pickSequence 풀이 바뀜. 미선택 시 default 풀(현행). 2026-06-06. decisions/rendering.md 2026-06-06 (2) 참조)
- **이벤트별 참가자 이름 자막** (대시보드 "영상 스타일" 카드 체크박스. 켜면 각 참가자 영상 하단에 uploaderName이 rich-text(NotoSansKR 36px white + stroke)로 표시. 캡션 clip은 별도 텍스트 트랙(또는 [A]에서 textClips 트랙 공유, 겹침 시 새 트랙)에 numeric start/length로 push해 영상과 동기. createRender clips 항목에 name 추가, style.showNames=true 전달. 디폴트 꺼짐. 알려진 한계: intro 미디어가 비디오일 때 길이 미상으로 캡션 미세 어긋남. 2026-06-06. decisions/rendering.md 2026-06-06 (3) 참조)
- **완성본 이력 보존 + 이전 완성본 노출** (`events.videos[]` 배열에 완성본 이력 누적. 재렌더해도 이전 완성본이 소실되지 않고 done 화면 "이전 완성본" 섹션에서 다운로드 가능. 원소별 `doneAt` 기준 7일 자동 만료. 저장 구조는 배열 필드 채택 — 서브컬렉션 대비 Firestore 규칙 콘솔 게시 단계 제거. 2026-07-12. decisions/data-flow.md 2026-07-12 참조)

## 랜딩 페이지 (별도 트랙)

본 앱과 별도 트랙으로 운영되는 정적 HTML 랜딩 페이지.

- 도메인: `https://congre.kr` (307 → www), `https://www.congre.kr` (메인)
- Vercel 프로젝트: `congre-landing`
- 작업 폴더: `C:\Users\PC\Downloads\congre\deploy` (git 외부)
- 배포 명령: `npx vercel --prod --yes`
- 변경 도구: CD (Claude Design)에서 zip 받아 로컬 풀어덮기 후 배포
- 변경 이력: Vercel Deployments 탭 (git 외부)

### 자산 인벤토리

영상 (`deploy/videos/`):
- demo.mp4 — Hero 완성본 샘플 (2026-06-27 가로 16:9 폰 목업 인라인 + 음소거 토글). 4:3(1440×1080) 파일에 16:9 콘텐츠+상하 띠 → known-issues L11
- wedding_1.mp4 — Showcase 마퀴 결혼식 (결혼식 레퍼런스. 옛 "Hero 영상" 라벨은 2026-06-27 히어로 재구성으로 무효)
- wedding_2.mp4 — Bento 결혼식 타일, 다국어 셀카
- wedding_intro.mp4 — 결혼식 인트로
- graduation.mp4 — Bento 졸업식 타일, 중학교 졸업 + How it works LIVE·EDITING 과정 영상(2026-06-27 히어로→How 이동)
- challenge.mp4 — Bento 챌린지·모임 타일, K-pop 챌린지

이미지: `.image-slots.state.json` (base64 인코딩, 41장)
- 졸업식 20장 + 결혼식 20장 + K-pop 10장 = 운영자 결정 (2026-05-30) — 41장 충분, L2 known-issue 해소 처리 (known-issues-resolved.md 2026-05-27 항목)

### 8섹션 흐름

Hero / Showcase / How it works / Why now / Moments / Occasions / Testimonials / Trust / CTA / Footer

(2026-05-30 V5 R10 swap — Showcase가 Hero 직후로 이동. 결과물 hook 먼저 → 동작 → 비교 흐름. decisions/landing.md 2026-05-30 (10))

(data-screen-label 라벨 중복 이슈는 known-issues 랜딩 영역 L1, 2026-05-27 해소)

### 히어로 재구성 (2026-06-27)

- 헤드라인 "이 순간을 영원히, **영상 방명록**" (옛 "행사가 끝나기 전에, 영상이 나옵니다" 폐기). 배지 "QR 스캔 → 촬영 → 행사 영상 완성" (옛 "LIVE·AI 영상 메이커" 폐기).
- CTA 1개로 축소 — 상단바 "시작하기" + 히어로 "1분 데모 보기" 삭제, "무료로 시작하기"만 유지.
- 완성본 샘플 `demo.mp4`를 히어로에 인라인: 가로 16:9 폰 목업 `.hero-demo-phone`(showcase-phone 패턴 변형) + 음소거 토글 `.hero-mute-toggle`. demo.mp4 띠 처리는 known-issues L11.
- 옛 히어로의 **LIVE·EDITING 과정 영상은 더 이상 히어로에 없음** — `vid-main`(graduation.mp4 배경 + AI 진행률 오버레이)을 How it works 섹션으로 이동. `.howto` 100vh 높이 잠금(max-height/overflow) 해제.
- 배포: www.congre.kr (랜딩 git 외부 트랙). 핸드오프 docs/handoff/2026-06-27-landing-hero-redesign.md.

### 추가 페이지

- `/pricing` (= `deploy/pricing.html`) — Pricing Section.html로 통째 교체. 가격 4장 카드 (무료·소형·중형·라지) + footnote 박힘. Pretendard 톤 (V5 일관). 라이브 반영 `www.congre.kr/pricing`. 2026-05-30. 직전 리드 폼 영역은 별도 트랙으로 분리 (본 앱 `/api/lead` 백엔드는 유지).
