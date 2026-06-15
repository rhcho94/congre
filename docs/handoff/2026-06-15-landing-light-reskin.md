# 2026-06-15 (2) — 랜딩 라이트 톤 전면 reskin (다크 골드 → 밝은 파스텔) 완료·배포

## 한 줄 요약
랜딩(`congre.kr`, git 외부 `deploy/index.html`)을 **옛 다크+골드 톤에서 밝은 파스텔 라이트 톤으로 전면 reskin**하고 배포 완료.
색·폰트·배경·표면·버튼 다 교체. **앱(본 앱)은 손도 안 댐** — 랜딩만. 배포 후 **실측은 아직** = 다음 세션 첫 액션.

---

## ★ 확정된 최종 디자인 (이 트랙 핵심 — 다음 세션이 "뭐였더라" 안 하게)

### 방향 전환 (중요 — 지난 핸드오프 뒤집음)
- 직전 핸드오프(2026-06-15 (1))는 **"히어로=다크"** 시스템이었음. **이번 세션에 라이트로 뒤집음.**
- 계기: 운영자가 직접 수집한 Partiful 실물 스크린샷이 **밝은 파스텔 톤**이었고, 다크 reskin 1차 배포가 "빨강이 으스스/촌스럽다 + 휑하다"로 실패. 운영자가 "더 밝고 가볍게, 뒤 두 이미지(Partiful)처럼"을 명시.
- **즉 현재 진실 = 라이트 톤.** "다크"라고 적힌 옛 기록(2026-06-15 (1) 핸드오프, 토큰표)은 stale. **decisions/landing.md에 라이트 전환을 박아야 함 (아직 안 함, 아래 미완 작업).**

### 최종 토큰 (현재 deploy/index.html :root, L12~23)
| 토큰 | 값 | 의미 |
|---|---|---|
| `--bg` | `#f4f1ea` | 밝은 아이보리 (그라데이션 밑 fallback) |
| `--surface-1` | `#ffffff` | |
| `--surface-2` | `#f7f4ee` | |
| `--surface-3` | `#ece7dd` | |
| `--accent` | `#E8794A` | **주황 에나멜** (진행·CTA). 빨강 #FF5A5F에서 채도 뺀 주황으로 변경 |
| `--accent-soft` | `#E8794A1f` | |
| `--warm` | `#CFFF4D` | **라임** (완료·강조). 유지 |
| `--text` | `#1a1612` | **먹색** (거의 검정, 따뜻한 톤) |
| `--muted` | `#6b635a` | 회갈색 (부제·라벨) |
| `--hairline` | `rgba(26,22,18,0.10)` | 어두운 헤어라인 (라이트 배경용) |
| `--hairline-strong` | `rgba(26,22,18,0.18)` | |
| `--font-display`/`--font-body` | Pretendard | Cormorant 완전 제거됨 |

### 배경 (핵심)
- **움직이는 CSS 그라데이션** (정적 이미지 아님). html에 직접:
  `linear-gradient(-45deg, #e8e4f5, #d4e2f0, #f0dce8, #dcecea, #e8e8d4, #e8e4f5); background-size:400% 400%; animation: bgflow 14s ease infinite;`
- `@keyframes bgflow` (0%/50%/100% background-position 이동) + `@media (prefers-reduced-motion: reduce){ html{animation:none} }` 접근성 정지.
- **정적 이미지 배경(`images/shimmer-bg-q88.webp`)은 폐기됨** — 코드 참조 0건. 파일은 디스크에 남아있으나 안 쓰임 (삭제 가능, 운영자 처리 영역).
- 이유: 레퍼런스(Partiful 등)가 정적 이미지가 아니라 animated gradient를 씀. 웹 조사로 확인. "밝고 여러 색으로 꿈틀대는" 요구에 이게 정답.

### 표면 (프로스티드 글래스)
- 8개 클래스(.feed, .vs-col.old, .vs-col.new, .step, .bento .tile, .case, .quote, .quote.short)
- `background: rgba(255,255,255,0.55)` (.quote.short는 `rgba(247,244,238,0.6)`) + `backdrop-filter: blur(12px) saturate(120%)` + 어두운 hairline 보더.

### 버튼 (운영자가 ④아웃라인 골랐으나 "나"=주버튼만 솔리드로 절충)
- **주 CTA** (.btn-primary — "무료로 시작하기", nav "시작하기"): 솔리드 주황 배경 + 흰 글씨. 그림자·그라데이션 없음.
- **보조** (.btn-ghost — "1분 데모 보기", "행사 호스트에게 전달"): 아웃라인 (주황 1.5px 보더 + 주황 글씨), 호버 시 주황-soft 배경.
- 둘 다 알약(border-radius 999px).

### 다크 섬 (의도적 보존)
- **작동원리 데모(`.vid-main` = 히어로 우측 LIVE·EDITING)는 다크 유지.** 영상 미리보기라 다크가 돋보임.
- 이 블록 안 `rgba(12,11,9,...)` 15건은 의도적 잔존(다크 배경·스크림). 모달 오버레이·이미지 위 가독성 스크림도 다크 유지.
- 단 이 블록 안의 빨강→주황 색 통일은 적용됨 (배경 다크만 유지).

---

## 본 세션 작업 흐름 (참고)
1차 패스(다크 reskin) → 배포 → "빨강 으스스+휑함" 실패 → 운영자 "밝게" 지시 → 2차 패스(라이트 전환) → 배포.
- 중간 사고: shimmer 정적이미지 7.4MB로 깔림(149KB→7.4MB 다른 파일) → WebP 50KB 압축. 근데 결국 정적이미지 자체를 폐기(animated gradient로). 그 과정에 body 검은배경이 ::before shimmer 가린 stacking 버그도 잡음(html 직접 배경으로 해결). 이 잔재(webp 파일)는 이제 무의미.

## 배포 상태
- **라이트 톤 라이브: https://www.congre.kr** (Deployment dpl_DsemLZLjgW62YSQ7gZo3QgtAMZYG, READY)
- 랜딩은 git 외부 → 이 변경은 git에 없고 Vercel 배포본에만 존재.
- 백업 2개 (deploy 폴더): `index_pre_reskin_backup.html`(1차 다크 reskin 전), `index_pre_light_backup.html`(2차 라이트 전 = 다크 reskin 상태).

---

## 미완 작업 / 다음 세션 첫 액션 (우선순위)

### 1. 배포 실측 (최우선 — 아직 안 함)
www.congre.kr 폰·PC 둘 다 (새로고침 Ctrl+Shift+R). 5개 체크:
1. 밝은 배경 — 파스텔 움직임 뜨나, 너무 허전/형광 아닌가, 먹색 글씨 읽히나
2. 프로스티드 카드 — 밝은 배경 위에서 카드 구분되나 (흰 카드가 묻히면 테두리/그림자 보강 필요) ⚠ 예상 위험지점
3. 버튼 — 주황 솔리드/아웃라인 깔끔한가, 빨강 으스스함 사라졌나
4. 다크 섬(작동원리 데모) — 밝은 페이지 속 어두운 영상카드가 어색한가 vs 돋보이나
5. SVG 일러스트(How it works 6컷·Why now 허브) — 다크 기준으로 그려져 밝은 배경에서 떠 보이나 ⚠ 예상 위험지점

### 2. decisions/landing.md + CLAUDE.md 갱신 (영구문서 — 아직 안 박음)
- **라이트 전환 결정**을 decisions/landing.md에 박기 (지난 세션 "다크" 뒤집은 것). 안 박으면 다음 세션 또 혼란.
- 학습 룰 후보(CLAUDE.md "학습 룰"): (a) 정적이미지 배경 < animated gradient — 레퍼런스가 후자 / (b) 레퍼런스 실물(Partiful)이 라이트인데 우리가 다크로 헛다리 = 운영자 레퍼런스 실물을 톤 방향의 1차 근거로 / (c) "밝게/가볍게" 반복 = 톤 방향 재검토 신호.
- 직전 핸드오프(2026-06-15 (1))의 학습룰 5개도 아직 미반영 — 같이 박을 후보.
- **운영자가 이전에 "적용 단계에서 코드와 함께"로 보류**했던 그 묶음. 이제 적용됐으니 박을 때.

### 3. 실측 후 손질 후보 (실측 결과 따라)
- 카드 대비 약하면 → 테두리/그림자 보강
- SVG 일러스트 떠 보이면 → 일러스트만 손보거나 들어내기 (운영자가 "과감하게 버리기"도 열어둠)
- 히어로 둥근버튼·선 모바일 깨짐 (이전 세션부터 미해결, reskin과 별개 레이아웃 이슈 — 정찰 필요)

---

## 전체 그림 (어디까지 왔나)
```
디자인 리뉴얼
├─ 1단계: 시스템 확정 ✓ (2026-06-15 (1))
├─ 2단계: 전체 화면 정찰 ✓ (앱 15개 + 랜딩 9개 = 23 디자인대상)
├─ 3단계: 적용
│   ├─ 랜딩 ← ★ 색·톤·배경·버튼 reskin 완료·배포 (이번 세션). 실측만 남음
│   └─ 앱(15화면) ← 손도 안 댐. 다음 큰 덩어리
└─ (법적·가이드 5p = 라이트, 맨 뒤 우선순위 — 운영자 확정)
```

### 그룹핑 (2단계에서 확정)
| 그룹 | 화면 | 톤 | 주체 | 상태 |
|---|---|---|---|---|
| 랜딩 | 9섹션 | 라이트(파스텔) | 수동/CC | ✓ reskin 완료, 실측 대기 |
| 앱-호스트 | dashboard/create/events[id]/mypage | 라이트 | CC | 미착수 |
| 앱-인증 | host/signup/verify-email | 라이트 | CC | 미착수 |
| 게스트 | upload[id] | 다크 | CC | 미착수 |
| 결과물 | share[id] | 다크 | CC | 미착수 |
| 법적 | terms/privacy | 라이트(미정) | CC | 맨 뒤 |
| 가이드 | guide/host/guest | 라이트(미정) | CC | 맨 뒤 |
- 앱은 현재 전 화면 다크(globals.css body #0c0b09). 라이트 화면은 전부 신규 작업.
- 비번찾기 = /host 안 모달 (별도 화면 아님).

---

## 주의사항 (컨텍스트 안 새게)
- **랜딩 = git 외부** (`C:\Users\PC\Downloads\congre\deploy`, 배포 `npx vercel --prod --yes`, 도메인 congre.kr). 앱 = git, CC, app.congre.kr. 섞지 말 것.
- **L8 보존** — 푸터 약관·개인정보 4건 `https://app.congre.kr/terms`·`/privacy` 절대경로. CD zip/새배포로 덮으면 소실. 이번에도 보존 확인됨.
- **L9** = pricing.html 계산기 git-외부 수정분. 백업 `pricing_pre_calc_backup.html`. (이번 세션 미접촉)
- **CD 가져오기**: 디자인 핸드오프 URL은 73MB 초과로 채팅 클로드가 못 엶. 검토=스크린샷, 구현=이미지파일(PNG/WebP, HTML 아님).
- **움직이는 배경**: CSS animated gradient. 저사양/배터리 약간 더 쓰나 CSS라 부담 적고, prefers-reduced-motion 정지 넣음.

## 다른 트랙 (이번 세션 미접촉)
- 결제 트랙 S3-05 단계3 — 토스 사이트심사 중 + 통신판매업 신고 알아보는 중. 외부 절차 대기. 푸터 법적정보는 랜딩 리뉴얼에 흡수 예정.

## 본 세션 학습 (한 줄씩)
- **정적 이미지 배경 < animated gradient**: "꿈틀대는" 배경은 정적 이미지로 안 됨. 레퍼런스가 쓴 건 CSS animated gradient. 웹 조사로 확인 후 선회.
- **운영자 레퍼런스 실물이 톤 방향 1차 근거**: Partiful 실물이 라이트인데 우리가 "다크+비비드"로 헛다리. 운영자가 가져온 실물 스크린샷을 톤 방향의 1순위 기준으로 삼아야.
- **"밝게/가볍게" 반복 = 방향 재검토 신호**: 색 미세조정으론 안 풀리는, 톤 자체 문제일 수 있음.
- **shimmer 정적이미지 7.4MB 사고**: 운영자가 deploy에 넣은 파일이 점검한 149KB본이 아니라 CD 원본 7.4MB였음. 배포 전 파일 크기 확인이 걸러냄. (단, 결국 이미지 자체 폐기)
- **stacking context**: body 불투명 배경 + z-index:-1 ::before = ::before가 body 배경 뒤로 숨음. html 직접 배경이 깔끔.
