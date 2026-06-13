# 2026-06-13 — AppHeader 공용 컴포넌트 추출

## 한 줄 요약

대시보드 nav 4곳의 로고+컨테이너 중복을 AppHeader 컴포넌트로 추출(refactor). 동작·화면 변화 0, 실기기 확인 완료.

## 본 세션 커밋

- `32e1b7a` refactor: extract AppHeader component for dashboard nav (4 pages)

## 결정·발견

- 정찰 결과 nav가 12곳(직전 핸드오프 "11곳"은 부정확, `<nav>` 11 + `<header>` 1). 3종으로 분화:
  - **그룹 A — 대시보드 4곳** (`flex-wrap + gap-y-3 + px-5 sm:px-8`): dashboard, dashboard/create, dashboard/events/[eventId], mypage. 우측 메뉴 wrap 있음.
  - **그룹 B — auth/legal 7곳** (`px-8 py-6`, wrap 없음, 우측 링크 1개): host, signup, guide, guide/host, guide/guest, terms, privacy.
  - **그룹 C — upload 1곳** (`<header>` 태그, 480px 컨테이너 안): upload/[eventId].
- "12곳→1개"는 무리. 우측 메뉴가 곳마다 달라 children 방식 채택. 진짜 중복은 로고+컨테이너+wrap 클래스(그룹 A).
- 그룹 B 7곳 모바일 미깨짐을 운영자가 실기기 확인 → wrap 수정 동반 안 함, 의도적 제외.
- 06-10 `a868e0c`(모바일 wrap 수정)는 그룹 A 4곳에만 반영돼 있었음. 본 추출 작업으로 wrap 클래스가 AppHeader 1곳에 묶여 향후 재발 위험 소멸.
- 우측 메뉴 div의 gap 클래스 차이(`gap-3 sm:gap-6` 2곳 / `gap-3 sm:gap-4` 2곳)는 통일하지 않고 페이지별 children에 그대로 보존.
- `dashboard/create/page.tsx`의 `{view === "form" && (...)}` 조건부 우측 메뉴 구조도 children 내부에 그대로 유지.

## 미완 작업

없음.

## 다음 세션 후보 (우선순위)

1. **(우선) 인증메일 재발송 쿨다운 단독 개선** — 정찰 선행(현재 쿨다운 유무·동작 확인).
2. 그룹 B/C 헤더 통합은 YAGNI 보류(동작 멀쩡, 통증 적음).

## 본 세션 학습 한 줄

복붙처럼 보이는 12곳도 실측하면 로고만 공통이고 우측은 원래 다른 것이었다 — "중복 제거"와 "서로 다른 것 합치기"를 구분. 후자는 children/props로 차이를 보존.
