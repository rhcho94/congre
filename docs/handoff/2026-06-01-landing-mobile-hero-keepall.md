# 2026-06-01 — 랜딩 모바일 깨짐 수정 (keep-all · Occasions · 히어로)

> 랜딩 트랙 (git 외부). 변경 도구: CD 아님 — 채팅 클로드가 deploy/index.html 직접 패치본 제공 → 운영자가 덮어쓰기 + `npx vercel --prod --yes`.

## 본 세션 한 줄 요약
모바일 랜딩 깨짐 3종 수정 — 한글 단어 중간 끊김(keep-all 누락), Occasions 설명문 오른쪽 잘림, 히어로 첫 화면(글자 왼쪽 쏠림 + 목업 세로 여백/잘림). 전부 실측 확인 완료.

## 본 세션 배포 (랜딩 = git 외부, 커밋 없음)
- 최종 프로덕션 배포: `congre-landing-hmi14pvrg` → `www.congre.kr` 연결, Ready 확인.
- 중간 재배포 다수(같은 파일 반복, 무해). 변경 이력은 Vercel Deployments 탭이 유일.
- **docs 갱신분(이 핸드오프 등)은 본 앱 repo(`rhcho94/congre`)에 CC가 커밋해야 함.** 랜딩 코드 자체는 git 외부.

## 변경 내용 (deploy/index.html, 원본 대비 12줄)
1. **keep-all** — `html, body`와 `.btn`에 `word-break: keep-all` 추가. 한글이 단어 중간(행/사, 시작하/기, 자릅/니다, 상/영)에서 끊기던 것 해소. (한글 기본값은 아무 글자 사이에서나 끊김 → keep-all로 단어 보존)
2. **Occasions 설명문** — 모바일(640px↓)에서 `.occasions .section-head .sub { white-space: normal }`. 기본 규칙의 `white-space: nowrap`이 모바일에서 한 줄 강제 → 오른쪽 잘림. (moments는 이미 풀려 있었고 occasions만 누락이었음)
3. **히어로 모바일(980px↓)** — `.hero-text { align-items:center; text-align:center }` + `.hero-ctas { justify-content:center }`. 1단으로 쌓일 때 가운데 정렬 규칙이 없어 왼쪽으로 쏠리던 것 해소.
4. **히어로 목업 vh 의존 제거** — `.hero .vid-main`에서 모바일 `max-height: 70vh` 제거 + `max-height: none`으로 기본 규칙의 `max-height: calc(100vh - 130px)` 차단. 목업 크기를 `width: min(360px,80vw)` + 9:16 비율로만 결정 → 주소창 보임/숨김과 무관하게 일정.

## 본 세션 결정·발견
- **Occasions 격자는 이미 정상이었음.** deploy/index.html은 bento 모바일 1칸 접힘(680px↓ 영역의 기존 규칙)과 사진/영상 `object-fit: cover`를 이미 갖추고 있었음. 배포 전 스샷에서 보인 극적인 오른쪽 잘림은 **배포 밀림(라이브가 로컬보다 뒤처짐) 아티팩트**였고, 재배포로 해소됨. → 초기 "격자가 모바일에서 안 접힘" 진단은 오진이었음.
- **모바일 vh 의존 = 주소창 따라 잘림/여백.** 히어로 목업이 `vh` 기반(70vh, calc(100vh-130px))으로 크기가 묶여 있어, 모바일 주소창 들락거림에 따라 세로로 잘리고 여백이 생겼음. 증상이 "주소창 상태에 따라 달라짐"이면 vh 의심.
- **vid-main vh 의존은 2곳이었음.** 1차 수정에서 모바일 override의 `70vh`만 제거 → 기본 규칙의 `calc(100vh-130px)`가 override 안 된 채 상속되어 잔여 발생. 2차로 `max-height: none` 추가해 완전 해소.
- 검증 경로: **실 기기(폰) + 주소창 보임/숨김 양쪽**. CSS만으론 vh-주소창 상호작용 못 봄. 배포 후 폰 실측이 유일한 확정.
- 정상 동작 확인: "참여자의 순간"(moments) 가로 슬라이드는 좌우 이동하며 전체 텍스트 노출 — 의도대로 작동(known-issues L5 모바일 마키 부분 검증됨).

## 미완 / 다음 세션 후보 (운영자 현재 만족 상태 — 우선순위 낮음)
1. **D. 1번 화면 텍스트 겹침** — "당신의 영상이 완성되었습니다"와 클립 리스트 글자 겹침(채팅 클로드 관찰, 사용자 미보고). 목업 편집-단계 애니메이션의 전환 중 한 프레임일 가능성. **미정찰** — 정지 버그인지부터 확인 필요.
2. **C. Showcase(결과물) 가로 슬라이드 카드** — `.showcase-track` 마키. `aspect-ratio:9/16` + `object-fit:cover` + 섹션 `overflow:hidden`이라 문제 가능성 낮아 보이나 **정찰 안 함**. 배포 전 스샷의 "목업 검은 여백" 일부가 히어로 세로 수정으로 이미 해소됐을 수 있음 — 라이브 재확인 필요.
3. (기존) known-issues 랜딩 L1 라벨 중복, L2 이미지 41/50, L3 Occasions 4타일 placeholder 영상화 — 다음 랜딩 사이클.

## 문서 갱신 의무 (CC가 본 앱 repo 커밋 시 포함)
- `docs/CHANGELOG.md`: 랜딩 모바일 수정 1줄.
- `docs/decisions/landing.md`: 결정 항목 추가 후보 — "랜딩 목업 크기는 너비 기준, 모바일에서 vh 의존 금지(주소창 잘림 방지)". 인덱스 항목 수 갱신.
- `docs/known-issues.md`: L5 부분 검증 메모, D(텍스트 겹침) 신규 등재 검토.

## 본 세션 학습 (누적 — CLAUDE.md 학습 룰에 추가 후보, 위에 한 줄씩)
- **CSS override는 명시 속성만 덮는다.** 기본 규칙의 미명시 속성(max-height 등)은 그대로 상속되어 남음. override 블록만 보고 "제거 완료" 판단 금지 — 기본 규칙까지 확인.
- **grep "없음" 단정 금지.** 범위 좁게 잡고 "규칙 0개" 단언했다가 본문 밖(미디어쿼리)에 있는 규칙 두 번 놓침. 미디어쿼리 본문 전수 확인 후 판단.
- **모바일 vh = 주소창 의존.** "주소창 보임/숨김에 따라 레이아웃 달라짐" 증상은 vh 단위 의심부터.
