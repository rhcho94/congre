# 2026-06-16 — 본 앱 라이트 톤 전환 (15화면 중 1차 묶음)

## 한 줄 요약
본 앱 15화면 중 라이트 전환: 색 토큰 라이트/다크 분기(`data-theme` 스코프),
움직이는 그라데이션 배경 도입, `.glass-panel` 카드로 흐름 배경 위 가독성
확보(events/dashboard/mypage). 골드 폐기, 랜딩 주황(`#E8794A`)으로 통일.

## 본 세션 커밋 (본 앱, 6건 모두 origin/main 반영)
- **758b88e** feat(theme): light palette default, dark scoped to upload/share
  — `:root` 색 토큰 12개 라이트값으로 교체 + `[data-theme="dark"]` 블록에 기존
  다크값 보존. share/upload 2화면에 data-theme="dark" 표식. signup 골드 hex 2건
  토큰 참조로 정리.
- **940b293** feat(theme): animated gradient bg for light screens, photo bg kept for dark
  — `body { background: transparent }` + `body::before` 전역 그라데이션 레이어
  + `bgflow` 14s + `prefers-reduced-motion` 정지. `body::after` grain 전 화면
  OFF. `PageBackdrop`은 `pattern !== "e"`면 null(a~d 화면 사진 제거, e만 유지).
- **3c44fa4** feat(theme): add .glass-panel class, fix events card readability on gradient bg
  — `.glass-panel` 공용 클래스 신설(surface-1 88% + blur22 saturate140 +
  hairline-strong border + r-md). events 상세 4곳(.card/.row) 교체.
- **b9c6643** chore(theme): glass-panel opacity 88→78
  — events 가독성 1차 적용 후 농도 78%로 조정(create 인라인 glassPanel과 동일
  사양으로 맞춤).
- **1760b36** feat(theme): wrap dashboard event items in glass-panel cards
  — dashboard 이벤트 목록 항목 `<Link>` 1곳 `.row` → `.glass-panel`.
- **6138bd3** feat(theme): wrap mypage sections in glass-panel cards
  — mypage 섹션 4곳(.card) → `.glass-panel`(S1 계정 요약 / S2 비밀번호 / S3
  회원 탈퇴 / S4 프로필).

## 핵심 설계

### 색 토큰 분기 (data-theme 스코프)
- `:root` = 라이트 기본값. 색 변수 12개(`--bg`/`--surface-1~3`/`--accent`/`--accent-hi`/`--accent-soft`/`--text`/`--text-dim`/`--muted`/`--hairline`/`--hairline-strong`).
- `[data-theme="dark"]` = 다크 스코프 정의. 같은 12개 변수에 기존 다크값 그대로 보존.
- 다크 화면은 **share/upload 2화면**만. 각 page 최상위 div(또는 layout)에
  `data-theme="dark"` 부착. 나머지 13화면은 표식 없이 자동 라이트.
- 라이트/다크 공통 변수(`--warm`/`--kakao`/폰트/radius/legacy 별칭)는 :root에만 둠
  — var() 참조로 자동 따라옴, 분기 불필요.

### 전역 그라데이션 배경
- `body { background: transparent }` + `body::before { position: fixed; inset:0;
  z-index:-11; background: linear-gradient(-45deg, #b9a8e6, #98c6ea, #f0a8d0,
  #a0ddc8, #e6d68f, #b9a8e6); background-size: 400% 400%; animation: bgflow 14s
  ease infinite; }` (랜딩 5색 그라데이션 복제).
- `@keyframes bgflow` 0→50→0% 좌우 흐름. `@media (prefers-reduced-motion: reduce)`
  에서 정지.
- 다크 2화면 차단 별도 CSS 없음 — `PageBackdrop` 사진 레이어(z:-10)가
  body::before(-11)을 자연 덮음(z순서로 처리).
- 죽은 자산 `public/images/bg-stage-{a..d}.png` 4개는 참조만 끊김, 파일 삭제 안 함.

### grain
- `body::after { display: none; ... }` — film grain 전 화면 OFF. 정의 본문은 보존
  (미래에 첫 줄만 빼면 다시 켜짐).
- 다크 2화면(share/upload) grain 부활 필요 여부 = **실측 영역, 미판단**.

### .glass-panel 공용 카드
- 정의: `background: color-mix(in srgb, var(--surface-1) 78%, transparent);
  backdrop-filter: blur(22px) saturate(140%); -webkit-backdrop-filter: 동일;
  border: 1px solid var(--hairline-strong); border-radius: var(--r-md);
  padding: 24px;`
- create/verify-email/signup/host의 인라인 `glassPanel` 상수(4벌 중복)와 사양 일치
  (라이트/다크 토큰 분기는 var() 참조로 자동 따라옴).
- 신규 별도 클래스 — 기존 `.card`/`.row`/`.notice`/`.panel` 정의는 절대 미변경
  (다른 화면 의존).

## 라이트 전환 화면 그룹 — 진행 현황
- **완료(라이트 + 가독성 확보)**:
  - create / verify-email / signup / host — 원래 인라인 `glassPanel` 카드라
    토큰 분기만으로 자연 라이트 전환됨
  - events 상세 / dashboard / mypage — `.glass-panel` 교체로 가독성 확보
- **다크 유지**: upload / share — `data-theme="dark"`, `PageBackdrop` 사진 배경(z:-10)
- **미착수(라이트 실측·정리 필요)**: 법적/가이드 — terms / privacy / guide /
  guide/guest / guide/host. 이들은 PageBackdrop pattern="d"였고 직전 커밋으로
  사진 빠진 상태. 그라데이션 위에 배경 없는 카드로 떠있을 가능성 있음, 실측 필요.

## 남은 작업 / 다음 세션 후보

### 4차(미착수)
- ① `.glass-panel`에 장식 추가: 미세 그레인 + 상단 하이라이트(헤어라인 광택)로
  현재 평이한 unfrosted 글래스에 깊이 부여.
- ② glassPanel 인라인 중복 4벌(`create:L85` / `verify-email:L9` / `signup:L27` /
  `host:L55`)을 `.glass-panel` 공용 클래스로 통합. 현재 `.glass-panel`이 78%로
  인라인과 동일 사양이라 className 교체만으로 됨.

### 판단 보류
- upload/share grain 부활 필요 여부 (현재 전체 OFF, 다크 시네마틱 톤 의도와 충돌
  여부 실측).
- 법적/가이드 5화면 라이트 실측 + `.glass-panel` 또는 다른 처리 결정.

### 실측 잔여(발현 시 정찰)
- mypage 회원탈퇴 빨강(`#7f1d1d` / `#fca5a5`): 다크용 코랄/머룬, 라이트서 대비
  약할 수 있음.
- mypage S1 계정 요약 eyebrow 부재(다른 섹션은 있음): 일관성 결손.
- dashboard `.badge-draft` 대비(`--surface-2` + `--muted`): 카드 위라 해결됐을
  수도, 실측.
- events 클립 리스트 행 +4px(L1406 .row→.glass-panel padding 22→24px): 행 키
  증가, 페이지네이션·스크롤 영향.

## 학습
- **"목록 = 슬림 카드"는 일반론**: 본 서비스는 호스트당 이벤트 1~2개라 두꺼운
  카드 + 스크롤 OK. 도메인 맥락이 UI 관례를 이김. 카드 농도·padding 보수적으로
  잡지 말 것.
- **시각 결함 원인은 "어떤 클래스를 쓰나"부터 가름**: events 글씨 흐림을
  glassPanel 투명도로 추정했으나 실제 원인은 배경 0인 `.card`/`.row`였음.
  정찰에서 카드 종류 분류(.card/.row/.notice/.panel/.glass-panel)가 원인 특정의
  1순위.
- **라이트 전환은 토큰만 바꿔선 안 됨**: 다크 시절 만든 "배경 없는 컨테이너"
  (.card/.row)가 검은 단색 부모를 전제로 설계됨. 흐름 배경 위에선 글씨가 그라데이션
  사이로 비쳐 깨짐. 토큰 분기 + 배경 레이어 + 카드 시스템 셋이 같이 가야 함.

## 주의
- 본 앱은 git 안(랜딩 트랙과 다름). push 시 Vercel 자동 배포(app.congre.kr).
  `vercel --prod` 수동 안 함.
- `.card` / `.row` / `.notice` / `.panel` 기존 클래스 정의는 미변경 — 다른 화면
  의존. `.glass-panel`은 신규 별도 클래스로 격리.
- `data-theme="dark"` 표식은 share/upload 2화면 한정. 다른 화면에 잘못 부착하면
  단독으로 다크 섬이 생김.

## 본 세션 학습 (한 줄)
- 색 토큰을 라이트로 뒤집을 때, "배경이 없는" 옛 다크 시절 컨테이너 클래스가
  발목 잡음 — 토큰 분기는 시작일 뿐이고 카드 시스템 재정의가 본 작업.
