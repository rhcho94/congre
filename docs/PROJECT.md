# Congre — 프로젝트 스냅샷

> 이 문서는 "현재 상태"를 담습니다. 변경 시 즉시 갱신.

## 앱 개요

다수 참가자가 폰으로 짧은 축하 영상을 올리면 자동 편집해 하나의 영상으로 만들어 주는 서비스. 주력 시장은 결혼식과 매주 열리는 행사(생일·돌잔치·칠순·졸업 파티). 졸업식은 보조. 클립 길이는 무료 10초, 유료 10~100초(5초 단위). 자세한 시장 정의는 docs/decisions/market-product.md 참조.

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
- AWS S3 (bucket: congre-mvp-videos, region: ap-southeast-2)
- Shotstack (AI 영상 편집) — production 키 적용. rich-text asset으로 한글 인트로/아웃트로 렌더.
- `public/fonts/NotoSansKR-Regular.ttf` — 한글 렌더링용 커스텀 TTF (SIL OFL). Shotstack `timeline.fonts` 소스.
- `public/fonts/NanumPenScript-Regular.ttf` — Shotstack 워터마크용 Nanum Pen TTF (라틴 부분 글꼴, 파일 안 family 이름 "Nanum Pen", SIL OFL — `public/fonts/OFL-NanumPenScript.txt`). 무료 플랜 워터마크 `timeline.fonts` 소스.
- Vercel 배포
- Tailwind v4 (config 파일 없이 @import 방식)

주요 의존성: `@aws-sdk/client-s3`, `@aws-sdk/s3-request-presigner`, `firebase`, `firebase-admin`, `resend`, `solapi`, `qrcode.react`, `lucide-react`, `canvas-confetti`.

## 디자인 시스템

라이트 단일 테마(`:root`). 정의 위치: `src/app/globals.css`. 기준: `docs/decisions/design.md`.

| 토큰 | 값 | 용도 |
|---|---|---|
| `--bg` | #EEF4FB | 바탕 (단색, 움직이는 배경 없음) |
| `--surface-1` | #FFFFFF | 표면 |
| `--surface-2` | #F5F8FC | 표면 |
| `--surface-3` | #E6EDF7 | 표면 |
| `--paper` | #FFFFFF | 종이 |
| `--accent` | #1F3C9C | 잉크(액센트) |
| `--accent-hi` | #152B73 | 잉크(액센트) hover |
| `--accent-soft` | rgba(31,60,156,0.10) | 잉크(액센트) 약 |
| `--text` | #222222 | 글자 |
| `--text-dim` | #333333 | 글자 |
| `--muted` | #4A5468 | 보조 글자 |
| `--hairline` / `--line` | #C9D6EA | 선 |
| `--hairline-strong` / `--field` | #7F92B8 | 입력 테두리 |
| `--danger` | #A61B1B | 위험 |
| `--pen-red` · `--pen-green` · `--pen-purple` · `--pen-brown` | #C62828 · #2E7D32 · #6A1B9A · #8D4E00 | 펜 |
| `--tape` | rgba(255,214,102,0.6) | 테이프 |
| `--font-body` = `--font-display` | Gowun Dodum 400 | 글꼴: UI 전부 |
| `--font-pen` | Nanum Pen Script | 글꼴: 펜 글씨 (로고는 글꼴이 아니라 SVG(BrandName)) |

- 모양: 버튼 6px, 입력칸 6px·높이 50px, 카드 직각 1px 선, 상태는 점 + 글자
- 공통 클래스: `.btn`/`.btn-primary`/`.btn-secondary`/`.btn-danger`/`.btn-quiet`/`.btn-kakao`, `.input`, `.panel`·`.notice`·`.glass-panel`(셋 다 같은 종이 카드. glass는 이름만 남음), `.badge`(점 + 글자), `.pen`
- Legacy 별칭: `--surface`=`var(--surface-1)`, `--border`=`var(--hairline-strong)`, `--accent-bright`=`var(--accent-hi)`

다크 테마 폐지(2026-10-07)

랜딩(`deploy/site.css`)도 같은 값을 쓴다. 둘을 바꿀 때는 함께 바꾼다.

## 브랜드 표기 규칙

- UI의 브랜드 표기는 로고 D SVG 하나(`src/components/BrandName.tsx`, 글자를 도형으로 바꾼 SVG). 글자색·글꼴로 "Congre"를 꾸미지 않는다
- "made by Congre"는 `BrandName withMadeBy`("made by" 보조 글자 + 작은 로고)
- 문장 속 "Congre"(예: "Congre로 만든 영상입니다")는 보통 글자
- 변수명·파일명·환경변수·도메인 등 기술 식별자는 소문자 (congre-mvp, app.congre.kr)
- 로고 원본 SVG: 채팅 클로드가 만든 `logo-d-*.svg` (2026-10-07). 결정은 docs/decisions/design.md

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
- **HTTP 보안 헤더 현 상태 (2026-08-06)**: `next.config.ts` `headers()`가 전 경로
  (`source: "/:path*"`)에 `X-Content-Type-Options: nosniff` 부착. og-image 라우트는
  응답에서 자체적으로도 부착. CSP·Content-Disposition은 미도입(known-issues 등재).
  `middleware.ts` 없음.
- 한글 인트로/아웃트로 (이벤트 생성 폼 입력 → Firestore 저장 → Shotstack rich-text 클립 삽입, NotoSansKR TTF 호스팅)
- 자동 삭제 cron (`/api/cron/cleanup`, `vercel.json` 기준 `0 18 * * *` = UTC 18:00, KST 익일 03:00 1회) — 원본 클립은 `participantNotifiedAt` + **48시간**(`status: "done"` 이벤트 한정), 완성본은 배열 원소별 `doneAt` + 7일, 마감 후 정체(`closed`·`rendering`)는 `closedAt` + 7일. 세 시계가 서로 다른 필드를 기산점으로 쓴다. 멱등성 마커: clipsDeletedAt, videoDeletedAt. 완성본 S3 객체 실제 삭제는 2026-07-12(33430b6)에 복구됨 — Track ⑦ 저장 위치 이전 시 누락됐던 드리프트.
- 이용약관 / 개인정보처리방침 페이지 (`/terms`, `/privacy`) — v0.1 시행. 푸터 링크. 변경 이력은 `docs/legal/CHANGELOG.md`.
- **마이페이지 P1·P2·P3·P4** (`/mypage` — 이벤트 요약 + 프로필 표시 + name·phone 수정 + 비밀번호 변경 + 회원 탈퇴. dashboard nav 링크. 2026-05-20)
- 참가자 영상 클립 음량 페이드 (volumeEffect: fadeInFadeOut, BGM mixing 영역)
- 트랜지션 in/out 분리 (pickSequence 2회 호출, 시각 다양성)
- outroText + outroMedia 동시 입력 사고 해소 ([A] 분기 직렬 배치)
- **가격 페이지 + 리드 수집 폼** (랜딩 `/pricing` → 본 앱 `/api/lead` → Resend → 운영자 메일. emailChannel reply-to 확장. 2026-05-28)
- **워터마크 사양 확정** (40px / 0.40 / MEDIUM, 무료 플랜만. 본 앱 코드 구현은 별도 트랙. 2026-05-30. decisions/rendering.md 참조)
- **무료 플랜 워터마크 구현** ("made by Congre" rich-text, 우하단 align right/bottom, Cormorant Garamond italic 40px #c8892c, clip opacity 0.40, length "end" 최상단 트랙. plan==="free" 조건. 텍스트 공백 패딩으로 모서리 여백. 2026-06-01. decisions/rendering.md 2026-06-01 참조) (2026-10-07 글꼴·색 변경: Nanum Pen 52px 흰색 0.6)
- **게스트 업로드 화면 호스트 이름 노출 + 안내 카피 보강** (`/api/events/[eventId]` 게스트용 GET 응답에 `hostName` 1개 필드 추가 — users 컬렉션 `name`만 join, email·phone 등 다른 PII 비노출. uploader 단계 첫 방문 문구에 호스트 이름·행사 이름·요청 영상 길이 노출 + 입력 정보 사용 목적 안내. 2026-06-01. decisions/data-flow.md 2026-06-01 참조)
- **게스트 업로더 4단계 흐름 안내 스트립** (`src/components/FlowStrip.tsx` — 이름·번호 / 촬영 / 올리기 / 링크 받기. CD app-restyle/Flow Strip.html 자산을 React+Tailwind로 변환. 첫 방문 `!isReturning` 노출. 인라인 SVG, 외부 의존성·전역 CSS 클래스 0. 2026-06-01. decisions/misc.md 2026-06-01 참조)
- **게스트 초대 링크 동적 OG 카드** (`src/app/upload/[eventId]/layout.tsx` server-side `generateMetadata` — events.title + users.name Admin 2회 조회, `${hostName}님이 초대했어요 | ${title}` 형식. hostName 12자/title 20자 초과 시 절단, hostName 없으면 `${title} 영상에 초대합니다` fallback. 카카오·SNS 미리보기 카드 동적화. PII 미노출(텍스트만). 2026-06-01. decisions/data-flow.md 2026-06-01 OG 항목 참조) (2026-10-08 구분자 " | "로 변경)
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
- 변경 도구: CC 직접 수정 (2026-10-07 전면 개편부터. CD zip 덮어쓰기 금지)
- 변경 이력: Vercel Deployments 탭 (git 외부)

### 자산 인벤토리

지금 쓰는 것만:
- `site.css` — 4페이지 공통
- `media/` — demo-v2.mp4, poster, ch0~5, final, selfie-m·f, occasion-dol·birth·grad
- `videos/wedding_2.mp4` — 완성본 예시 재생
- `images/og-image.png` — 결혼식판
- `favicon.ico`·`apple-touch-icon.png`

폴더에 남아 있지만 쓰지 않는 것(videos의 demo·wedding_1·wedding_intro·graduation·challenge, images의 png 4개, image-slot.js·.image-slots.state.json, uploads/*.jpg 3개): 미사용, 배포에는 포함(.vercelignore 정리는 별도).

### 6섹션 흐름 (2026-10-07)

소개 / 50초로 보는 하루 / 완성본 예시 / 다른 행사 / 후기 / 시작하기

(옛 8섹션 흐름·히어로 재구성 내용은 decisions/landing.md에 이력으로 남아 있다.)

### 추가 페이지

- `/pricing`: 요금 계산기(무료·유료·별도 문의), 2026-10-07 공통 디자인·푸터 적용
- `/faq`: 자주 묻는 질문 10문항 3그룹(details/summary 아코디언), 2026-10-07 공통 디자인 적용
- `/about`: 서비스 소개·문의·사업자 정보, 2026-10-07 공통 디자인 적용
