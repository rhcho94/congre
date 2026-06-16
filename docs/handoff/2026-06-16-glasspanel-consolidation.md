# 2026-06-16 — 인라인 glassPanel 4벌 → .glass-panel 공용 클래스 통합

## 한 줄 요약
직전 세션에서 YAGNI 보류했던 glassPanel 인라인 4벌을 .glass-panel 공용
클래스로 통합. 광택·그레인 장식이 4화면에 자동 상속됨(인라인엔 가상요소
적용 불가라 통합이 일관성 명분). 실측 OK 후 push 완료.

## 본 세션 커밋 (origin/main 반영)
- **20dd79d** refactor(theme): consolidate inline glassPanel into .glass-panel class
  — create(JSX 3곳)/verify-email(1곳)/signup(1곳)/host(2곳, 로그인+모달)
  에서 style={glassPanel} 제거 + className 맨 앞 glass-panel 추가.
  각 파일 const glassPanel 정의(7속성+닫기, 8줄) 제거.
  4 files, +7/−40 (net −33). Tailwind 유틸(p-8/p-10/w-full/max-w-*)과
  host 모달 onClick stopPropagation 전부 보존. build 통과, lint 11/3 delta 0.
  4화면 실측 OK(광택·그레인·overflow·position·모서리·모달 onClick 전부 양호).

## 핵심 — 통합 시 차이 3종
- 의도된 변화: 광택(box-shadow inset)+그레인(::after) 4화면 자동 상속.
  통합 목적 자체. 가상요소는 인라인 style로 불가능해서 인라인 유지 시
  영영 장식 못 받음 → 통합이 유일한 경로.
- 승인된 시각 변화: border-radius r-lg(28px)→r-md(22px), 6px 축소.
  실측에서 거슬리지 않음 확인. 거슬리면 .glass-panel { border-radius }
  한 줄을 r-lg로 바꾸면 복구되나, 그 경우 .glass-panel 쓰는 8화면
  (법적/가이드5+events/dashboard/mypage)도 동반 28px로 커짐.
- 부작용 없음 확인: position static→relative, overflow visible→hidden
  은 4화면 카드에서 잘림/위치점프 미발생(실측). host 모달도 정상.

## 직전 핸드오프 정정
- 이전 핸드오프(2026-06-16-legal-guide-glass-decoration.md)의
  "78% 동일 사양"은 오기. 인라인 4벌은 5속성(background/blur/webkit/
  border/border-radius) 100% 글자단위 동일이었음. 78%는 background의
  --surface-1 78% 값을 일치율로 오독한 흔적.

## 진행 현황 갱신
- 4차 ② glassPanel 인라인 4벌 통합 → 해소 완료.
- 라이트 전환 화면 그룹(전부 .glass-panel 또는 통합 완료):
  - 라이트 완료: create/verify-email/signup/host + events/dashboard/
    mypage/terms/privacy/guide/guide-guest/guide-host
  - 다크 유지: upload/share

## 남은 작업 / 다음 세션 후보
### 가독성 (실측 대기)
- dashboard/create L430 .card 1건 잔여. 그라데이션 위 흐림 가능성 —
  발현 시 정찰 → .glass-panel 교체 후보.
### 판단 보류
- upload/share grain 부활 필요 여부(다크 2화면, 현재 전체 OFF).
### 실측 잔여 (1·2차 이월)
- mypage 회원탈퇴 빨강 대비 / S1 eyebrow 부재 / dashboard badge-draft
  대비 / events 클립 행 +4px.

## 주의
- 본 앱 git 안. push 시 Vercel 자동 배포(app.congre.kr).
- .glass-panel 정의 한 곳이 이제 12화면 지배(통합 4 + 기존 8). 이 클래스
  수정 시 영향 범위 큼.
- .card/.row/.notice/.panel 기존 정의 미변경 — 다른 화면 의존.

## 본 세션 학습 (한 줄)
- 인라인 style로는 ::after 가상요소·box-shadow 장식을 못 받는다.
  표면 장식을 공용으로 주려면 인라인을 클래스로 통합하는 게 전제.
  "동작 문제 없음"이 YAGNI 보류 근거였으나, 장식 일관성이라는 새 명분이
  보류를 풀었음 — YAGNI는 필요가 생기면 재평가된다.
