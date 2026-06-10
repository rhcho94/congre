# 2026-06-10 타이포 통일 + 모바일 헤더 응급처치

## 한 줄 요약
랜딩·본 앱 UI 타이포를 공통 토큰으로 통일(폰트 Pretendard 일원화)하고, 모바일 대시보드 헤더 메뉴 줄바꿈을 응급 패치했다. 폰 실측까지 확인 완료.

## 본 세션 커밋
- (랜딩, git 외부) index.html 타이포 토큰 정리 + title 변경 → Vercel 배포 완료 (커밋 없음, Deployments 탭만)
- f96932f refactor: unify UI body font to Pretendard (remove DM Sans)
- a868e0c fix: prevent dashboard nav menu wrapping on mobile (4 pages)

## 본 세션 결정·발견
- 공통 타이포 토큰 확정 (랜딩+본 앱 공유):
  - 폰트: --font-display = Cormorant Garamond italic (브랜드/디스플레이만), --font-body = Pretendard Variable 체인 (본문 전부)
  - 크기: 랜딩은 --text-s(13)/--text-m(16)/--text-l(clamp 26→40) 3단계. 본 앱은 Tailwind 유틸(text-xs/sm/lg…) 유지 — 이미 정돈된 체계라 통일 안 함 (A안). "공통 한 벌"의 핵심은 폰트이지 크기 토큰 이름이 아님.
- 랜딩: 폰트 5종→2종, 크기 약 38종→3종, step 숫자 56→40, SVG 라벨까지 Pretendard 통일. <title> "(skeleton)" 제거 → "Congre — 다 같이 만드는 행사 영상".
- 본 앱 발견: 한글 UI 폰트가 명시 미지정이라 시스템 폴백으로 떨어지던 문제 → --font-body Pretendard 일원화로 해소. body의 var(--font-body,'DM Sans'),var(--pretendard) 중첩 폴백이 원인 정황.
- 본 앱 헤더: 11곳 복붙, 반응형 0건. 이번엔 4곳만 패치(dashboard/mypage/create/events). 나머지 7곳은 미패치.
- 인증 메일 발송 실패 진단(별건, 미해결): rhcho94@gmail.com 계정이 auth/too-many-requests로 재발송 차단 + 과거 메일은 스팸함行·만료. 다른 계정은 정상 → 계정 한정 문제로 우회(다른 계정 사용). 콘솔 에러에 auth/unauthorized-continue-uri도 찍혔으나 다른 계정 정상이라 전역 도메인 문제는 아님으로 판정.

## 미완 / 다음 세션 우선순위
1. (별건·잠재 격상) 인증 메일: 영업 후 실제 호스트가 재발송 연타 시 동일 too-many-requests 차단 위험. + 스팸 도달성(SPF 정렬 noreply@congre.kr vs send.congre.kr, known-issues 기존 항목). 재발송 버튼 쿨다운 부재. 한 묶음으로 다룰 후보.
2. (후보) 헤더 공용 컴포넌트화 — 11곳 복붙을 <DashboardNav> 하나로. 미패치 7곳 모바일 깨짐도 같이 해소. YAGNI상 급하지 않음.
3. (보류) Shotstack→S3 0바이트 복사 실패 — 외부 답신 대기 (직전 핸드오프 참조, 본 세션 미진행).

## 본 세션 학습 한 줄
- "메인 카피가 크다"의 실제 원인이 죽은 CSS 규칙(우선순위로 덮인 v4 잔재)일 수 있음 — 분포만 보지 말고 실제 적용값(specificity) 확인. / "이 계정만"인지 범위부터 물었으면 도메인 오진을 더 빨리 좁혔음.
