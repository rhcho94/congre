# Congre — 프로젝트 스냅샷

> 이 문서는 "현재 상태"를 담습니다. 변경 시 즉시 갱신.

## 앱 개요

결혼식 등 행사에서 참가자들이 영상을 촬영·업로드하면 AI가 자동으로 편집해서 SNS 공유용 영상을 만들어주는 서비스.

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
- Shotstack (AI 영상 편집) — production 키 적용
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

## 환경변수 (Vercel)

| 변수 | Production | Preview/Development |
|---|---|---|
| SHOTSTACK_API_KEY | production 키 | stage 키 |
| SHOTSTACK_ENV | production | stage |

(Firebase, AWS 관련 환경변수는 Vercel 대시보드 참조)

## 완료된 기능

- 주최자 로그인/대시보드 (Firebase Auth, 비밀번호 찾기 포함)
- 이벤트 생성 + QR 코드 + 공유 링크 + QR 이미지 저장
- 참가자 영상 촬영 (카메라 미리보기 → 촬영 → 업로드)
- S3 업로드 (presigned URL)
- 카메라 전/후면 전환 (standby에서만)
- 마감 기능 (세션 토큰 만료)
- Shotstack 환경 분기 (stage/production 자동)
- 한글 자막
- SNS 공유 버튼 (인스타·카카오·링크 복사)
- Congre 배지 (BrandName 컴포넌트)
- iOS Safari 호환성
- 랜딩 페이지 (Hero with 영상 + How / Why / Use cases / CTA / Footer)
- 마감/렌더링/완료 상태에서 QR/링크 박스 자동 숨김
- 이벤트 페이지 overflow 정리
- 랜딩 페이지 파티클 효과 (canvas-confetti burst + CSS sparkle)
- 클립 재생 Pre-signed URL (주최자 대시보드에서 인라인 미리보기, firebase-admin 인증)
- 알림 시스템 (Resend 이메일 + SOLAPI SMS, 채널 어댑터 패턴, notifications 컬렉션 이력 저장)
  - 트리거 연결 5건: 이벤트 생성, 렌더 시작, 렌더 완료, 렌더 지연(10분 초과), 렌더 실패
  - 함수만 구현 2건: 첫 클립 업로드, 참가자 결과 (다음 PR에서 트리거 연결)
