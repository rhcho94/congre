# 기술 결정 기록

> 새 결정은 위로 추가 (최신이 위). 형식: 날짜 / 결정 / 이유 / 대안.

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
