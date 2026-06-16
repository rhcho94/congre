# Decisions — Misc

> 영역 외 결정 (프로세스 룰·UI 라이브러리 등). 새 결정은 맨 위에 추가 (최신이 위).

## 2026-06-16 — 본 앱 라이트 톤 전환 (15화면 중 1차: 색 토큰 분기 + 그라데이션 배경 + .glass-panel)

### 결정

본 앱 색 시스템을 라이트 기본 + 다크 스코프로 분기, 랜딩식 움직이는 그라데이션 배경
도입, 흐름 배경 위 가독성 확보용 공용 카드 `.glass-panel` 신설.

- **색 토큰 분기 방식 = data-theme 스코프**:
  - `globals.css :root` = 라이트 기본값(`--bg #f4f1ea` / `--surface-1~3` 베이지·아이보리 / `--accent #E8794A` 주황 / `--text #1a1612` 먹색 / hairline은 먹색 알파).
  - `[data-theme="dark"]` = 다크 스코프 정의(기존 다크 12개 값 보존).
  - 다크 화면은 **share/upload 2화면 한정**. 각 page 최상위 div(또는 layout)에 `data-theme="dark"` 부착. 나머지 13화면은 표식 없이 자동 라이트.
  - 라이트/다크 공통 변수(`--warm`/`--kakao`/폰트/radius/legacy 별칭)는 :root에만 정의 — var() 참조로 자동 따라옴, 분기 불필요.
- **골드(#c8892c) 폐기 → 랜딩 주황(#E8794A) 통일**: 본 앱·랜딩 액센트 색 일원화. signup의 인라인 `accent-[#c8892c]` 2건도 `accent-[var(--accent)]`로 정리.
- **전역 그라데이션 배경**: `body { background: transparent }` + `body::before` 고정 레이어(z-index: -11)에 랜딩 5색 `linear-gradient(-45deg, #b9a8e6, #98c6ea, #f0a8d0, #a0ddc8, #e6d68f, #b9a8e6)` + `background-size: 400% 400%` + `bgflow` 14s. `prefers-reduced-motion` 정지. `body::after` grain 전 화면 OFF.
- **PageBackdrop 스코프 축소**: `pattern !== "e"`면 null 반환. a~d 화면(form/list/work/static)에서 사진 배경 제거, e만(게스트·결과물) 사진 유지. `public/images/bg-stage-{a..d}.png` 4개 참조만 끊김 — 파일 삭제 안 함(보존).
- **`.glass-panel` 공용 카드 신설**: `background: color-mix(in srgb, var(--surface-1) 78%, transparent)` + `backdrop-filter: blur(22px) saturate(140%)` + `border: 1px solid var(--hairline-strong)` + `border-radius: var(--r-md)` + `padding: 24px`. create/verify-email/signup/host의 인라인 `glassPanel` 상수와 동일 사양(향후 통합 후보).

### 이유

- 랜딩이 2026-06-15에 라이트 톤(Partiful 방향, 비비드 파스텔 animated gradient)으로
  전환됨. 본 앱도 같은 톤으로 통일해야 사용자 경험 단절 없음.
- 단일 :root에 라이트값을 박으면 share/upload(영상 다크가 자연) 화면이 어색해지므로
  `data-theme="dark"` 스코프로 격리. 13:2 비율이라 라이트를 기본, 다크를 스코프로
  잡는 게 옳음(반대로 잡으면 13군데에 표식 부착해야 함).
- 흐르는 그라데이션 배경 위에서는 기존 다크 시절 만든 "배경 없는 컨테이너"
  (.card/.row, padding only)가 글씨 흐림 유발(부모 단색 다크 전제). 토큰 분기만으로
  안 되고 카드 시스템 재정의 필요 — 그래서 `.glass-panel` 신설.
- 기존 `.card`/`.row` 정의는 미변경(다른 화면 의존). 신규 클래스로 격리해서 점진적
  교체.

### 적용

- 변경 6커밋(`758b88e`, `940b293`, `3c44fa4`, `b9c6643`, `1760b36`, `6138bd3`).
- 적용 완료 화면 (7): create / verify-email / signup / host (원래 인라인 glassPanel) + events 상세 / dashboard / mypage (.glass-panel 교체).
- 다크 유지 화면 (2): upload / share (`data-theme="dark"` 표식, PageBackdrop 사진).
- 미착수 (5): terms / privacy / guide / guide/guest / guide/host (pattern "d"였음, 현재 사진 빠진 라이트 상태, 실측 필요).
- 빌드/린트 게이트 통과: 6커밋 전 구간 `npm run build` 통과, `npm run lint` 11 errors / 3 warnings baseline 유지(delta 0).

### 비고

- 인라인 glassPanel 4벌(create:L85 / verify-email:L9 / signup:L27 / host:L55)을
  `.glass-panel` 공용 클래스로 통합하는 작업은 4차 미착수. 현재 사양 동일이라
  className 교체만으로 됨.
- `.glass-panel`에 미세 그레인 + 상단 하이라이트 장식 추가(4차 미착수)로 평이한
  unfrosted 글래스에 깊이 부여 예정.
- 다크 2화면 grain 부활 필요 여부는 실측 영역(현재 전체 OFF).

## 2026-06-13 — 박스(.card/.row) 투명화 + .notice 강조 박스 분리

### 결정

`globals.css`의 박스 공용 클래스를 두 갈래로 분리:

- **`.card`** — 장식·구획용 **투명 컨테이너**(padding만, background/border/border-radius 없음). 가이드 본문 래퍼·옵션 섹션·마이페이지 섹션·결과물 메인 영역 등.
- **`.row`** — 리스트 행 **투명 컨테이너**(padding만). hover 효과(surface-2 + hairline-strong) 제거. 행 사이 구분은 부모의 `flex flex-col gap-N`에 위임.
- **`.notice`** — 신설. 경고·안내·모달 본체용 **강조 박스**. `background: var(--surface-1)` + `border: 1px solid var(--hairline-strong)`(card 옛 정의보다 살짝 진함) + `border-radius: var(--r-md)` + `padding: 20px`.

### 적용 범위

- `.card` 사용처 28건 중 [경고/안내] 11건 + 모달 2건 = **13건의 className "card" → "notice"** 교체. 나머지 15건은 `.card`로 두되 정의가 투명해 자동 반영.
- [애매] 3건(`dashboard/create:342` 이벤트 생성 후 QR 카드, `[eventId]:1017` open 상태 QR/공유 카드, `[eventId]:1327` done 상태 결과 영상 카드)은 **운영자 결정 = 투명화(b안)**. `.card` 정의 투명화로 자동 반영, 별도 교체 없음.

### 근거

네모 테두리·면이 화면당 다수 누적되어 "옛날 앱" 느낌. 최신 앱 표준은 여백(gap/padding)으로 영역 구분, 박스는 강조가 필요한 곳에만. 한 곳(`.card` 정의)을 고치면 28건이 일괄 전환되는 기존 구조를 활용해 비용 최소화.

### 모달 처리

`.card` 투명화로 모달 본체(L801 마감 확인, L823 추첨)도 투명해지면 모달이 깨짐. 두 곳은 `.notice`로 교체하여 배경+테두리 보존.

### 비고

- 인라인 박스(`glassPanel` 11건, `EmailVerificationBanner`의 `bg-surface border-l-2`)는 별도 트랙. 본 결정 범위 외.
- `.row` hover 시각 피드백 제거 영향: dashboard 이벤트 리스트 행(`<Link>` L182)이 호버 색 변화 잃음. 클릭 가능성 표시는 padding과 텍스트 위계로 충분 판단. 필드 테스트에서 클릭 인지 사고 발생 시 보정.

## 2026-06-01 — 게스트 업로더 FlowStrip 통합 (CD 자산 → React 컴포넌트)

### 결정

CD handoff `app-restyle/Flow Strip.html`의 4단계 흐름 안내 스트립을 `src/components/FlowStrip.tsx`로 변환·통합. 게스트 업로드 화면 uploader 단계 첫 방문(`!isReturning`) 사용자에게만 노출.

### 사양

- **4단계 고정**: 이름·번호 / 촬영 / 올리기 / 링크 받기. CD 원본의 3단계 폴백은 폐기(본 흐름에 필요 없음).
- **노출 조건**: `stage === "uploader" && !isReturning`. 재방문자(`isReturning`)에겐 안 보임 — 학습된 사용자에게 화면 잡음을 추가하지 않음.
- **인라인 SVG 4종 + 화살표 SVG**: 외부 패키지·`lucide-react` 의존성 0. stroke="currentColor" 패턴으로 부모 color 상속.
- **레이아웃은 Tailwind 유틸**: 전역 CSS 클래스(`.flow-strip`, `.step`, `.ico`, `.lbl`, `.arrow`) 추가 안 함. `globals.css` 영향 0.
- **색상**: 본 앱 토큰(`var(--accent)`, `var(--text)`)을 inline style로 직접 참조. CD 원본의 4개 색 변수는 본 앱 토큰과 그대로 일치.
- **자산 자체 좌우 padding(16px 18px) 제거**: 좌우 여백은 부모 `<main className="... px-6 ...">`에 맡김.
- **배경 투명**: scrim 박스 없음(주변 카피 박스와 시각 분리).

### Noto Sans KR 별도 로드 안 함

CD 원본은 `<link>`로 Noto Sans KR(400/500/600) Google Fonts를 head에 로드. 본 결정은 **본 앱 화면 폰트로 Noto Sans KR을 추가로 로드하지 않기**로 함. 라벨 한글은 주변 화면 텍스트와 동일하게 기본 fallback(sans-serif)으로 렌더.

이유:
- 게스트 화면 라벨 4개(이름·번호 / 촬영 / 올리기 / 링크 받기) 한정 폰트 차별성 대비 추가 CDN 라운드트립·FCP 영향 비효율.
- 본 앱 화면 한글은 이미 system fallback으로 일관 운영 중.
- 영상 렌더용 `public/fonts/NotoSansKR-Regular.ttf`는 Shotstack timeline에만 주입(별도 영역).

### 변경 영역

- `src/components/FlowStrip.tsx` (신규)
- `src/app/upload/[eventId]/page.tsx` — import + uploader 분기 첫 자식으로 `{!isReturning && <FlowStrip />}` 삽입

## 2026-05-14 (2) — Track 4 강화: 1차 변경 폭 부족 → 한 단계 상향

- **결정**: (1) 배경 토큰 추가 명도 상향 (#13110f→#1f1c18 / #1c1916→#2a261f / #26211a→#34302a). (2) Primary 버튼 그라디언트를 더 밝은 팔레트(from-[#f5b04a] to-[#a06f1f])로 교체 + inset highlight·drop shadow·amber glow 복합 shadow 풀세트 적용 + glow-accent 클래스 제거(shadow에 통합). (3) 헤일로 4곳(landing Final CTA·host·upload·events done) opacity-15→opacity-25, ellipse 70% 60%→100% 90%로 강화.
- **이유**: 1차(cc255f8) 변경 후 실제 화면에서 변화 폭이 시각적으로 부족했음. 배경 너무 어두움, 버튼 입체감 부족, 헤일로 너무 희미. 한 단계 추가 상향.
- **적용**: `globals.css` 토큰 3개. 5개 파일 12개 버튼 shadow 풀세트 교체. 4곳 헤일로 opacity·ellipse 수정(page.tsx Final CTA에 zIndex:-1 추가 포함).

## 2026-05-14 — 디자인 시스템 통합: 토큰 명도·버튼 입체감·헤일로 확산

- **결정**: (1) 배경 토큰 3개 명도 상향 (#0c0b09→#13110f / #151310→#1c1916 / #1e1a13→#26211a). (2) Primary 버튼 `bg-accent` → `bg-gradient-to-b from-accent-bright to-accent`로 통일. Primary C 불일관 2건(재설정 메일·다시 시도)도 `glow-accent` 추가해 정규화. (3) Final CTA 헤일로 패턴(`radial-gradient amber opacity-15`)을 host 로그인·upload standby·events done 3곳에 확산.
- **이유**: 배경이 너무 어두워 가독성 낮았음. 버튼 3개 분류가 불일관으로 디자인 시스템 신뢰도 저하. 헤일로는 핵심 전환·감동 포인트에만 선택적 적용.
- **적용**: `src/app/globals.css` 토큰 3개. 6개 파일 12개 Primary 버튼 className. 3개 페이지 헤일로(`relative isolate` 컨테이너 + `absolute zIndex:-1` halo div 패턴).

## 2026-05-08 — 갈래 패턴: 정찰 → 코드 커밋 → 문서 커밋

- **결정**: 큰 기능은 갈래로 분리. 각 갈래: 정찰(코드 변경 없음) → 코드 atomic 커밋 → 다음 갈래 정찰... → 완료 후 문서 갱신 atomic 커밋 1개.
- **이유**: 정찰이 실행 범위를 결정하므로 선행 필요. 문서는 완료된 사실을 기록하므로 코드 후행. 중간 문서 갱신은 미완성 상태를 기록하게 되어 혼란 유발.
- **적용**: 인트로/아웃트로 작업이 초안 — 갈래 1(폰트) → 갈래 2(UI/API) → 갈래 3(Shotstack 연결 + 디버그 + 미세 수정) → 갈래 4(문서) 순서.

## 2026-05-01 — 파티클 효과: canvas-confetti + CSS 하이브리드

- **결정**: 랜딩 페이지 burst는 canvas-confetti, 영상 주변 sparkle은 순수 CSS.
- **이유**: canvas-confetti는 7KB gzipped, 의존성 0개. burst 형태가 자연스럽게 구현되며 RAF 기반이라 끝나면 자동 정리. sparkle은 idle 상태에서 CPU 안 먹게 GPU 합성으로 처리.
- **대안**: tsparticles는 60KB+로 과함. 순수 CSS만으로는 다수 입자 burst가 키프레임 관리 부담.
