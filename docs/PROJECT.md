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
| `--bg` | #1f1c18 | 페이지 배경 |
| `--surface` | #2a261f | 카드 배경 |
| `--surface-2` | #34302a | 카드 내부 강조 |
| `--accent` | #c8892c | 앰버/골드 액센트 |
| `--accent-bright` | #e8a038 | accent 밝은 버전 (현재 미사용, 향후 hover/glow 영역 후보) |
| `--border` | #2d2720 | 그리드 구분선·경계선 |
| `--text` | #ede8df | 본문 텍스트 |
| `--muted` | #79716a | 보조 텍스트 |
| `--font-display` | Cormorant Garamond | 디스플레이 (italic 활용) |
| `--font-body` | DM Sans | 본문 |

> 폰트 토큰은 `src/app/layout.tsx`에서 next/font/google 경유 주입
> (`--font-display`, `--font-body` 변수명으로 노출).

글로벌 유틸리티: `.rule` (장식 수평선), `.glow-accent`, body::after film grain.

## 브랜드 표기 규칙

- UI에 보이는 모든 "Congre" → 대문자 C + 앰버 색 + serif italic
- "made by Congre"는 별도 패턴 ("made by"는 muted, "Congre"는 표준 스타일)
- 공통 컴포넌트 `src/components/BrandName.tsx` 사용
- 변수명·파일명·환경변수·도메인 등 기술 식별자는 소문자 (congre-mvp, congre-three.vercel.app)

## 환경변수 (Vercel)

| 변수 | Production | Preview/Development |
|---|---|---|
| SHOTSTACK_API_KEY | production 키 | stage 키 |
| SHOTSTACK_ENV | production | stage |
| NEXT_PUBLIC_APP_URL | https://congre-three.vercel.app | https://congre-three.vercel.app |

(Firebase, AWS 관련 환경변수는 Vercel 대시보드 참조)

## 외부 서비스 인벤토리

> 정찰 시점: 2026-05-14

| # | 서비스 | 플랜 | 핵심 한도/잔액 | 결제 형태 |
|---|--------|------|--------------|----------|
| 1 | Vercel | Pro | 1TB bandwidth, 1M 함수 호출/월 | 월 $20 자동 |
| 2 | Firebase | Blaze | Spark 한도(read 50K/일) 내 무료, 초과 종량 | 종량제 (예산 알림 $5) |
| 3 | Shotstack | Pro | 월 200 credits, 매월 1일 갱신 추정 | 월 $39 자동 |
| 4 | SOLAPI | 충전식 | 일 한도 50건 (신규 가입 제한) | 충전 시 |
| 5 | Resend | Free | 월 3,000 / 일 100 | — |
| 6 | AWS | Free Trial | $100 크레딧 + 169일 (~2026-10-28) | 종료 시 카드 청구 |
| 7 | GitHub Actions | Public 무료 | 무제한 | — |
| 8 | 카카오 디벨로퍼스 | 무료 API | 월 300만 쿼터 | — |
| 9 | 도메인 (가비아) | 1년 등록 | 만료일 운영자 확인 | 갱신 시 결제 |

- AWS는 2026-10-28 무료 트라이얼 종료. 만료 전 결제 카드 자동 청구 전환 여부 / 다른 인프라 이전 검토 필요 (격상 트리거: 만료 30일 전).

## 완료된 기능

- 주최자 로그인/대시보드 (Firebase Auth, 비밀번호 찾기 포함)
- 이벤트 생성 + QR 코드 + 공유 링크 + QR 이미지 저장
- 이벤트 플랜 선택 (무료 10클립 / 소형 50 / 중형 200 / 대형 무제한)
- 참가자 영상 업로드 (이름·전화번호 입력 → OS 네이티브 카메라 → 미리보기 → 업로드)
- S3 업로드 (presigned URL)
- 마감 기능 (세션 토큰 만료)
- Shotstack 환경 분기 (stage/production 자동)
- 한글 자막
- SNS 공유 버튼 (카카오·링크 복사)
- Congre 배지 (BrandName 컴포넌트)
- iOS Safari 호환성
- 랜딩 페이지 (Hero with 영상 + How / Why / Use cases / CTA / Footer)
- 마감/렌더링/완료 상태에서 QR/링크 박스 자동 숨김
- 이벤트 페이지 overflow 정리
- 랜딩 페이지 파티클 효과 (canvas-confetti burst + CSS sparkle)
- 클립 재생 Pre-signed URL (주최자 대시보드에서 인라인 미리보기, firebase-admin 인증)
- 알림 시스템 (Resend 이메일 + SOLAPI SMS, 채널 어댑터 패턴, notifications 컬렉션 이력 저장)
  - 트리거 연결 6건: 이벤트 생성, 렌더 시작, 렌더 완료, 렌더 지연(10분 초과), 렌더 실패, **참가자 결과**
  - 함수만 구현 1건: 첫 클립 업로드
- Firestore 보안: events/clips Admin SDK 전용 (Client SDK read 잠금, Phase B-3 완료 2026-05-06)
- 한글 인트로/아웃트로 (이벤트 생성 폼 입력 → Firestore 저장 → Shotstack rich-text 클립 삽입, NotoSansKR TTF 호스팅)
- 자동 삭제 cron (`/api/cron/cleanup`, KST 03:00 daily) — 클립 24h, 완성본 7d. 멱등성 마커: clipsDeletedAt, videoDeletedAt
- 렌더링 polling cron (`/api/cron/check-rendering`) — Shotstack 렌더 완료 확인 후 videoUrl 저장
- 렌더 지연·환불 cron (`/api/cron/check-render-deadlines`) — 10분 초과 렌더 감지 후 알림 발송
- 이용약관 / 개인정보처리방침 페이지 (`/terms`, `/privacy`) — v0.1 시행. 푸터 링크. 변경 이력은 `docs/legal/CHANGELOG.md`.
- 가이드 페이지 3종 (`/guide`, `/guide/guest`, `/guide/host`)
- BGM (Shotstack timeline.soundtrack, fadeInFadeOut volume 0.1, public/audio/bgm.mp3 호스팅)
- 이벤트별 영상 최대 길이 설정 (maxClipSeconds: 5/10/15/20/25/30초, default 15, 이벤트 생성 시 호스트 선택)
- 참가자 업로드 native capture 전환 (OS 카메라 호출, 회전 메타 정상, duration 측정 후 Firestore 저장)
- Shotstack 클립별 length 동적 계산 (Math.min(duration, maxClipSeconds), trim: 0 명시). 짧은 영상 freeze 회피.
- 안드로이드 Chrome 14/15 갤러리 직행 사고 정정 (카메라/갤러리 input 분리, 2026-05-16)
- iOS Safari capture 480p 사고 분기 처리 (iPhone 검출 시 갤러리 전용 흐름, 안내 문구 노출, 2026-05-19)
- 업로드 idle 화면 촬영 시간 안내 가독성 강화 (text-xs + opacity-60 → text-sm, 2026-05-16)
- 렌더 상태 조회 API (`/api/render/status`) — GET, renderId 파라미터, Shotstack 상태 polling
- 렌더 완료 처리 API (`/api/render/complete`) — POST, 잠김 (401), 향후 Shotstack webhook 수신용으로 보존
