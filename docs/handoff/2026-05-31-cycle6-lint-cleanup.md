# 2026-05-31 — 사이클 6: 본 앱 lint baseline 정리 (103 → 11)

## 본 세션 한 줄 요약

직전 사이클이 남긴 lint errors 103건 baseline을 정찰부터 분해. 89%(no-unescaped-entities 92건)는 화면 영향 없는 스타일 규칙이라 ESLint 설정에서 일괄 비활성화, 나머지 react-hooks/* 11건은 전수 분류 결과 [실제 위험] 0건. 불확실 2건(upload:613 ref)은 보류 + known-issues에 격상 트리거 문서화. 코드 사고 0건. docs 3커밋.

## 본 세션 커밋 / 배포

본 앱 repo (git):
- `69639d2` chore: disable react/no-unescaped-entities lint rule
- `ad2e87e` docs: record lint baseline reduction (103 → 11)
- `aecfb55` docs: record B-track lint scout result (react-hooks 11건, 위험 0)

(랜딩 트랙 변경 없음)

## 본 세션 결정

1. **무더기 A (no-unescaped-entities 92건) = ESLint 규칙 비활성화** (옵션 A1). 화면 영향 없는 따옴표/아포스트로피 HTML entity 강제 규칙 + 자동수정 불가 + 92건 대량 + 전부 정적 안내·약관 페이지(guide/guest·terms·guide/host·privacy). 수작업 escape는 약관 텍스트 건드리는 위험 대비 가치 없어 기각. `eslint.config.mjs` (ESLint v9 flat config) 끝에 rules override 객체로 off.
2. **무더기 B (react-hooks/* 11건) = 정찰 후 보류**. 전수 분류 결과 [실제 위험] 0 / [무해·관행] 9 / [불확실] 2. 무해 9건은 잘 도는 코드라 YAGNI로 안 건드림. 불확실 2건(upload:613 ref)은 수정 위험 > 효익이라 보류, known-issues에 격상 트리거 기록.

## 본 세션 발견 / 사고

- **103건의 실체 = 89% 화장 + 11% 잠재버그**. "lint 103 정리"로 뭉뚱그리면 가려지는 차이. 정찰로 갈라서 A는 싸게 털고 B만 신중히 봄. `--fix` 한 방 돌렸으면 무해 9건·불확실 2건까지 휩쓸려 동작 건드릴 뻔.
- **B 정찰 [불확실] 2건**: `src/app/upload/[eventId]/page.tsx:613` react-hooks/refs (같은 위치 2건, 실질 1지점). JSX 렌더 중 `blobRef.current` 직접 읽기. 위반은 명백하나 stale로 인한 실제 오작동은 런타임 시퀀스 확인 필요라 미확정. 보류 + known-issues 격상 트리거 등록(증상: "다시 시도 버튼 안 보임/엉뚱하게 보임").
- **CC 자체 합계 오류 1건(검증 단계서 정정)**: 정찰 보고 중 "92건이 3개 파일에 88건 집중" → 실제 34+30+26=90. 총계 103은 정확, 결론 영향 없음.
- **CC `※ recap` 메타 코멘트 재발 1회**: A1 보고 끝에 붙음. CLAUDE.md 절대 규칙 위반. 이후 프롬프트에 명시적 금지 한 줄 추가로 재발 차단.

## 미완 / 다음 작업 후보 (다음 세션 1번은 운영자가 택)

**lint 트랙은 닫힘.** 아래 후보에서 lint 제외.

### 우선순위 높음
1. **워터마크 본 앱 구현** — 사양 확정(40px/0.40, Cormorant italic #c8892c 우하, 무료 플랜만). shotstack.ts createRender + plan 전달 + 무료 전용 워터마크 트랙 + Cormorant ttf. 렌더 파이프라인 핵심부, 검증 무거움.

### 우선순위 중간
2. **게스트 카피 개선** — /upload uploader 단계 맥락 부족. 위험 낮고 빠른 성과.
3. **dead code 정리** — host/page.tsx 옛 dashboard/create view + mockEvents.
4. **dashboard 썸네일** — placeholder, 인트로 미디어 썸네일 추출.

### 보류 트랙 (트리거 대기)
- **upload:613 ref stale (불확실 2건)** — known-issues 등록 완료. "다시 시도 버튼 안 보임/엉뚱" 사고 보고 시 격상.
- **lint baseline 11건** — 신규 작업 lint 게이트는 "errors ≤ 11 (delta 0)". 11건 전부 [무해/불확실]로 분류돼 적극 정리 동기 없음.

## 본 세션 학습 한 줄

- **"103 정리" 같은 큰 숫자는 성격별로 갈라야 결정이 나온다**. 89% 화장 vs 11% 잠재버그를 분리하니 처리 방식·위험도·검증 무게가 완전히 달라짐. 숫자 총량이 아니라 구성을 먼저 본다.

## 다음 세션 진입 컨텍스트

- 본 앱 lint baseline = 11 errors + 3 warnings (전 사이클 103). react/no-unescaped-entities는 eslint.config.mjs에서 off.
- 잔존 11건 = react-hooks/set-state-in-effect 9 + react-hooks/refs 2. 전수 분류 끝, [실제 위험] 0. 상세는 known-issues "본 앱 lint errors baseline" 항목.
- 신규 작업 lint 게이트: "errors ≤ 11 (delta 0)".
- 운영자 다음 세션 첫 메시지: 본 핸드오프 첨부 + 작업 영역 명시(워터마크 / 게스트카피 / dead code / 썸네일 중 택1). 워터마크 택 시 검증 무거우니 정찰부터.
