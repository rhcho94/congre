# 2026-06-16 — 본 앱 라이트 톤 전환 (법적/가이드 5화면 + 글래스 장식, 2차 묶음)

## 한 줄 요약
1차 미착수였던 법적/가이드 5화면을 .glass-panel로 교체해 가독성 확보,
이어서 .glass-panel 자체에 상단 광택 + 미세 그레인을 더해 평이한 글래스에
깊이 부여. 운영자 "박스가 단색처럼 평이" 지적 해소.

## 본 세션 커밋 (본 앱, origin/main 반영)
- **855ce0a** feat(theme): wrap legal/guide pages in glass-panel cards
  — 5파일 6곳 className "card …" → "glass-panel …" (terms L29 / privacy L28 /
  guide L35·L47 / guide-guest L29 / guide-host L29). 나머지 Tailwind 유틸 보존.
  .card 정의·PageBackdrop·data-theme·privacy 표(bg-surface/border-border) 미변경.
  +6/−6. build 통과, lint 11/3 delta 0. app.congre.kr 5화면 가독성 실측 OK.
- **e6c2c01** feat(theme): add top sheen + subtle grain to glass-panel for depth
  — globals.css .glass-panel 한 곳에 position:relative / overflow:hidden /
  box-shadow inset 0 1px 0 0 rgba(255,255,255,0.7)(상단 광택) 3줄 추가 +
  .glass-panel::after 블록 신설(SVG fractalNoise 그레인, opacity 0.1,
  mix-blend-mode overlay, pointer-events none, border-radius inherit). +13줄.
  선행 확인서 기존 box-shadow·::after 없음 확정 후 진행. build 통과,
  lint 11/3 delta 0. 실측 OK(광택·그레인·가독성 전부 양호).

## 핵심 설계 — 글래스 장식
- 적용 범위: .glass-panel 정의 한 곳 → 이 클래스 쓰는 전 화면 자동 반영
  (5화면 + events/dashboard/mypage).
- 강도 결정: 그레인 opacity 0.1, 광택 0.7. 운영자 절충값(A안 은은 6% ~ B안 13%
  사이). 과하면 그레인 6~8%, 약하면 12~13%로 opacity 한 줄만 조정 가능.
- ::after는 pointer-events:none이라 클릭 통과, border-radius:inherit로 둥근
  모서리 따라감. position:relative(부모)+absolute(::after) 짝 필수.

## 진행 현황 갱신
- 1차 "미착수: 법적/가이드 5화면" → 해소 완료.
- 1차 "4차 ① 글래스 장식" → 해소 완료.
- 라이트 전환 화면 그룹:
  - 라이트 완료: create/verify-email/signup/host(인라인 glassPanel),
    events/dashboard/mypage/terms/privacy/guide/guide-guest/guide-host(.glass-panel)
  - 다크 유지: upload/share

## 남은 작업 / 다음 세션 후보
### 리팩토링 (보류)
- 4차 ② glassPanel 인라인 4벌(create L85/verify-email L9/signup L27/host L55)
  → .glass-panel 공용 클래스 통합. 78% 동일 사양 + 이제 장식까지 들어가서,
  통합하면 인라인 4벌에도 광택·그레인 자동 적용됨(현재는 인라인이라 장식 없음).
  동작 문제 없어 YAGNI 보류 중이나, 장식 일관성 측면 명분 생김.
### 가독성 (실측 대기)
- dashboard/create L430 .card 1건 잔여(본 세션 범위 외). 그라데이션 위 흐림
  가능성 — 발현 시 정찰 → .glass-panel 교체 후보.
### 판단 보류
- upload/share grain 부활 필요 여부(다크 2화면, 현재 전체 OFF).
### 실측 잔여 (1차 이월)
- mypage 회원탈퇴 빨강 대비 / S1 eyebrow 부재 / dashboard badge-draft 대비 /
  events 클립 행 +4px.

## 주의
- 본 앱 git 안. push 시 Vercel 자동 배포(app.congre.kr).
- .card/.row/.notice/.panel 기존 정의 미변경 — 다른 화면 의존.
- 인라인 glassPanel 4벌은 .glass-panel 클래스와 별개 — 장식 자동 반영 안 됨.

## 본 세션 학습 (한 줄)
- "평이함"의 원인은 backdrop-filter 미작동이 아니라 unfrosted 매끈한 면 자체
  였음. 가독성(배경 유무)과 깊이감(표면 질감)은 다른 축 — 전자는 카드 교체,
  후자는 표면 장식으로 따로 푼다. 미리보기로 강도 합의 후 실측 조정이 효율적.
