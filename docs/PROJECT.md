# Congre — 프로젝트 스냅샷

> 이 문서는 "현재 상태"를 담습니다. 변경 시 즉시 갱신.

## 앱 개요

다수 참가자가 폰으로 짧은 인터뷰 영상을 올리면 자동 편집해 하나의 회고 영상으로 만들어주는 서비스. 1순위 시장은 초·중·고 졸업식 (학생 본인이 자기 소감을 찍는 1인칭 콘텐츠). 결혼식·기업 행사·동창회 등은 보조 시장. 클립 길이는 인당 10초 이내. 자세한 시장 정의는 docs/DECISIONS.md 참조.

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

- Vercel: https://congre-three.vercel.app
- GitHub: https://github.com/rhcho94/congre
- 개발 환경: Windows PC, Claude Code

## 기술 스택

- Next.js (TypeScript, App Router)
- Firebase Auth + Firestore (project: congre-mvp)
- AWS S3 (bucket: congre-mvp-videos)
- Shotstack (AI 영상 편집) — production 키 적용. rich-text asset으로 한글 인트로/아웃트로 렌더.
- `public/fonts/NotoSansKR-Regular.ttf` — 한글 렌더링용 커스텀 TTF (SIL OFL). Shotstack `timeline.fonts` 소스.
- Vercel 배포
- Tailwind v4 (config 파일 없이 @import 방식)

주요 의존성: `@aws-sdk/client-s3`, `@aws-sdk/s3-request-presigner`, `firebase`, `firebase-admin`, `resend`, `solapi`, `qrcode.react`, `lucide-react`, `canvas-confetti`.

## 디자인 시스템

다크/시네마틱/감성 톤. 결혼식·기록 컨셉.

| 토큰 | 값 | 용도 |
|---|---|---|
| `--bg` | #0c0b09 | 페이지 배경 |
| `--surface` | #151310 | 카드 배경 |
| `--surface-2` | #1e1a13 | 카드 내부 강조 |
| `--accent` | #c8892c | 앰버/골드 액센트 |
| `--text` | #ede8df | 본문 텍스트 |
| `--muted` | #79716a | 보조 텍스트 |
| `--font-display` | Cormorant Garamond italic | 디스플레이 |
| `--font-body` | DM Sans | 본문 |

글로벌 유틸리티: `.rule` (장식 수평선), `.glow-accent`, body::after film grain.

## 브랜드 표기 규칙

- UI에 보이는 모든 "Congre" → 대문자 C + 앰버 색 + serif italic
- "made by Congre"는 별도 패턴 ("made by"는 muted, "Congre"는 표준 스타일)
- 공통 컴포넌트 `src/components/BrandName.tsx` 사용
- 변수명·파일명·환경변수·도메인 등 기술 식별자는 소문자 (congre-mvp, congre-three.vercel.app)

## Firebase 커스텀 이메일 발신 도메인

- 발신 도메인: `congre.kr` (Firebase Console → Authentication → Settings → Email Sender Domain)
- DNS 레코드 (가비아 등록): TXT SPF, TXT verification, CNAME DKIM ×2
- Firebase Console Templates Action URL: `https://congre-three.vercel.app/verify-email`
- 설정 완료: 2026-05-19 v3 (P3d)

## 환경변수 (Vercel)

| 변수 | Production | Preview/Development |
|---|---|---|
| SHOTSTACK_API_KEY | production 키 | stage 키 |
| SHOTSTACK_ENV | production | stage |
| NEXT_PUBLIC_APP_URL | https://congre-three.vercel.app | https://congre-three.vercel.app |

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
- 랜딩 페이지 (Hero with 영상 + How / Why / Use cases / CTA / Footer)
- 마감/렌더링/완료 상태에서 QR/링크 박스 자동 숨김
- 이벤트 페이지 overflow 정리
- 랜딩 페이지 파티클 효과 (canvas-confetti burst + CSS sparkle)
- 클립 재생 Pre-signed URL (주최자 대시보드에서 인라인 미리보기, firebase-admin 인증)
- 알림 시스템 (Resend 이메일 + SOLAPI SMS, 채널 어댑터 패턴, notifications 컬렉션 이력 저장)
  - 트리거 연결 6건: 이벤트 생성, 렌더 시작, 렌더 완료, 렌더 지연(10분 초과), 렌더 실패, **참가자 결과**
  - 함수만 구현 1건: 첫 클립 업로드
- **Firestore 보안 규칙 현 상태 (2026-05-19 v3 콘솔 게시 완료)**:
  - `events`: read 차단, create는 `request.auth != null` + **`email_verified`** + `users/{auth.uid}` 존재 검증, update는 호스트 본인만
  - `clips`: read·create 차단, update·delete는 `request.auth != null` (클라이언트 열림 영역 — clips 정비 보정 큐 등재)
  - `notifications`: read·write 차단 (Admin SDK 전용)
  - `users`: read·create는 본인 doc만 (`request.auth.uid == userId`), update·delete 차단
- 한글 인트로/아웃트로 (이벤트 생성 폼 입력 → Firestore 저장 → Shotstack rich-text 클립 삽입, NotoSansKR TTF 호스팅)
- 자동 삭제 cron (`/api/cron/cleanup`, KST 03:00 daily) — 클립 24h, 완성본 7d. 멱등성 마커: clipsDeletedAt, videoDeletedAt
- 이용약관 / 개인정보처리방침 페이지 (`/terms`, `/privacy`) — v0.1 시행. 푸터 링크. 변경 이력은 `docs/legal/CHANGELOG.md`.
- **마이페이지 P1·P2·P3·P4** (`/mypage` — 이벤트 요약 + 프로필 표시 + name·phone 수정 + 비밀번호 변경 + 회원 탈퇴. dashboard nav 링크. 2026-05-20)
- 참가자 영상 클립 음량 페이드 (volumeEffect: fadeInFadeOut, BGM mixing 영역)
- 트랜지션 in/out 분리 (pickSequence 2회 호출, 시각 다양성)
- outroText + outroMedia 동시 입력 사고 해소 ([A] 분기 직렬 배치)

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
- wedding_1.mp4 — Hero 영상, 결혼식 레퍼런스
- wedding_2.mp4 — Bento 결혼식 타일, 다국어 셀카
- wedding_intro.mp4 — 결혼식 인트로
- graduation.mp4 — Bento 졸업식 타일, 중학교 졸업
- challenge.mp4 — Bento 챌린지·모임 타일, K-pop 챌린지

이미지: `.image-slots.state.json` (base64 인코딩, 41장)
- 졸업식 20장 + 결혼식 20장 + K-pop 10장 = 50장 목표 중 41장 채워짐 (known-issues 랜딩 영역 L2)

### 8섹션 흐름

Hero / Why now / How it works / Showcase / Moments / Occasions / Testimonials / Trust / CTA / Footer

(data-screen-label 라벨 중복 이슈는 known-issues 랜딩 영역 L1)
