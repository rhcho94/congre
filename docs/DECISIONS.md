# 기술 결정 기록

> 새 결정은 위로 추가 (최신이 위). 형식: 날짜 / 결정 / 이유 / 대안.

## 2026-05-02 — Firestore Rules를 로컬 파일로 관리

- **결정**: `firestore.rules`를 프로젝트 루트에 두고 Git으로 변경 이력 추적. `firebase.json` + `.firebaserc`(프로젝트: congre-mvp)로 Firebase CLI 연동.
- **이유**: 콘솔에서만 관리하면 변경 이력이 없어 언제 어떤 규칙이 적용됐는지 알 수 없음. 코드 리뷰와 PR 흐름에 보안 규칙 변경을 포함시키기 위함.
- **배포 방법**: `firebase deploy --only firestore:rules` (Firebase CLI 필요 — `npm install -g firebase-tools`)
- **대안**: Firebase 콘솔에서 직접 관리 — 추적 불가.

## 2026-05-02 — 알림 채널: Resend 이메일 + SOLAPI SMS, FCM 미도입

- **결정**: 이메일은 Resend, SMS는 SOLAPI. FCM 푸시는 이번 단계에서 도입하지 않음.
- **이유**: Congre는 이벤트 당일 1회성 서비스 특성상 푸시 구독 관리 비용 대비 효용이 낮음. 이메일과 SMS는 앱 미설치 환경(iOS Safari 기본 PWA)에서도 안정적으로 전달됨. Resend는 Next.js App Router와 궁합이 좋고 무료 3,000건/월. SOLAPI는 국내 발신번호 등록·LMS 자동 전환 지원.
- **대안**: FCM 푸시 — iOS 16.4+ PWA 푸시 지원되나, 주최자가 별도로 알림 허용 설정 필요. 다음 PR에서 재검토 가능.

## 2026-05-02 — @react-email 대신 HTML 문자열 템플릿

- **결정**: 이메일 템플릿을 `@react-email/components` 대신 `src/emails/*.ts` 의 HTML 문자열 함수로 작성.
- **이유**: `@react-email/components@1.0.12` 가 npm에서 "Package no longer supported"로 deprecated 처리됨 (`npm view` 실측). React Email 팀이 통합 패키지를 버리고 개별 컴포넌트 패키지(`@react-email/html`, `@react-email/body` 등)로 분리했으나, 이 시점에 마이그레이션 경로가 명확하지 않았음. 단순한 트랜잭션 이메일 7개에는 HTML 직접 작성으로 충분하며, Resend는 HTML 문자열을 직접 수용함.
- **대안**: `@react-email/render@2.0.8` (deprecated 아님, 정상 유지보수 중) + 개별 컴포넌트 패키지 조합으로 마이그레이션 가능 — 생태계 안정화 확인 후 검토.

## 2026-05-01 — firebase-admin 도입

- **결정**: 서버 측 인증/Firestore 접근에 firebase-admin 사용. 첫 적용 지점은 클립 재생 API.
- **이유**: 푸시 알림(FCM), 결제 webhook 검증, 권한 분기 등에서 어차피 필요. 보안 표면을 클라이언트 SDK에만 의존하지 않게 됨.
- **대안**: 인증 없이 short-lived URL만으로 운영 — 단기적으로 가능하나 운영 기능 확장 시 한계.

## 2026-05-01 — 파티클 효과: canvas-confetti + CSS 하이브리드

- **결정**: 랜딩 페이지 burst는 canvas-confetti, 영상 주변 sparkle은 순수 CSS.
- **이유**: canvas-confetti는 7KB gzipped, 의존성 0개. burst 형태가 자연스럽게 구현되며 RAF 기반이라 끝나면 자동 정리. sparkle은 idle 상태에서 CPU 안 먹게 GPU 합성으로 처리.
- **대안**: tsparticles는 60KB+로 과함. 순수 CSS만으로는 다수 입자 burst가 키프레임 관리 부담.

## (이전 결정들)

이전 대화에서 내려진 결정 중 기억나는 것 — 추후 점진적으로 추가:
- Tailwind v4 채택 (config 파일 없는 @import 방식)
- Cormorant Garamond + DM Sans 폰트 조합
- Shotstack 선택 (AI 영상 편집)
- Firebase + S3 분리 구조 (메타데이터는 Firestore, 영상 파일은 S3)
- 브랜드 표기 통일을 위한 BrandName 컴포넌트 도입
