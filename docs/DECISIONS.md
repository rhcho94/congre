# Decisions — 인덱스

> 도메인 결정 기록. 영역별 파일에 본문 보관. 새 결정은 해당 영역 파일 맨 위에 추가.

## 영역별

- [rendering](decisions/rendering.md) — 영상 편집·Shotstack·클립 (40개)
- [notifications](decisions/notifications.md) — 이메일·SMS·알림 시나리오 (8개)
- [auth-model](decisions/auth-model.md) — 호스트 인증·이벤트-바운드 (6개)
- [legal](decisions/legal.md) — 약관·개인정보·미성년자 (3개)
- [market-product](decisions/market-product.md) — 시장 정의·BM·서비스 모델 (16개)
- [infra](decisions/infra.md) — Vercel·Firebase·도메인·무료 티어 정책 (6개)
- [data-flow](decisions/data-flow.md) — Firestore·S3·Admin SDK·서버 이전 (18개)
- [landing](decisions/landing.md) — 랜딩 페이지 디자인·자산·배포 (19개)
- [misc](decisions/misc.md) — 영역 외 결정 (7개)

## 메타

(이전 결정들) — 결정 본문 없는 메모. 각 항목은 코드·docs 다른 위치에 흔적 있음.
- Tailwind v4 채택 (config 파일 없는 @import 방식)
- Cormorant Garamond + DM Sans 폰트 조합
- Shotstack 선택 (AI 영상 편집)
- Firebase + S3 분리 구조
- BrandName 컴포넌트 도입

## 사용 룰

- grep 첫 대상은 영역 파일. 어느 영역인지 모르면 본 인덱스에서 영역 식별 후 진입.
- 새 결정은 해당 영역 파일 맨 위에 추가, 인덱스 항목 수 갱신.
