# 2026-06-12 완성본 세로 찌그러짐 해소 (fit cover→crop) + ⑦ 100클립 확정 + D 종료

## 한 줄 요약
완성본에서 가로 클립이 세로로 찌그러지던 launch blocker의 원인을 Shotstack fit
"cover"=stretch로 확정하고 crop으로 교체·배포. 더불어 ⑦ 100클립 done 확정,
D(갇힌 이벤트)는 복구 불필요로 종료.

## 본 세션 커밋 (해시 + 메시지)
- 5780a2d — fix: change Shotstack fit cover->crop to prevent vertical distortion
- b3956f3 — feat: add vertical recording guide on participant capture screen
- push: fb1b7ca..b3956f3 main (둘 다 빌드 OK, lint 11 errors + 3 warnings = baseline delta 0)

## 본 세션 결정·발견 사항

### ★ 최대 발견: Shotstack fit 용어 함정 (launch blocker 원인)
- Shotstack에서 `fit: "cover"` = 비율 깨고 늘림(=stretch). 일반 CSS object-fit cover와 정반대.
- `fit: "crop"`(Shotstack 기본값) = 비율 유지하며 채우고 넘치면 잘라냄.
- `fit: "contain"` = 비율 유지 + 레터박스(여백).
- 공식 문서 확인: shotstack.io/learn/image-video-fit-property, SDK 문서 일치.
- 우리 코드가 cover로 박혀 있어 가로 소스(1920×1080)가 세로 출력 틀(1080×1920)에서
  세로로 늘어남. crop으로 교체해 해소.

### fit 처리 방침 결정
- 참가자 클립 + intro/outro 미디어 모두 crop 통일 (shotstack.ts L79/L85/L143).
- 이유: 원인 동일하므로 일관 처리. 가로 자산 올라와도 안 찌그러짐(좌우 잘림은 감수).
- 가로 vs 세로 혼합 대응의 "본격 버전"(클립별 방향 판별 후 다른 fit, 또는 blur 배경)은
  YAGNI로 보류. crop + 촬영 안내로 현 단계 충분 판단.

### ⑦ 100클립 done 확정 (직전 인계분 등록)
- prod 키 100클립×10초 → done 7분 10초, 우리 S3 1.5GB 정상 도착·재생 정상.
- SLA 근거: "마감 후 약 7분 내 완성본" (단독 렌더 1건 기준. 동시·풀레이어링은 미검증).

### D — jhyun0021@kaist.ac.kr 갇힌 이벤트 → 복구 불필요로 종료
- 당사자 요청으로 정찰. uid 6jLGulRcp6TJDvUP6wqKzXaIyZz1, event mr94KGsRpQzFm6bKPOAI
  ("2026년 6월 와인모임").
- 실측 결과 status 이미 done, videoS3Key/renderId 박힘, 완성본 .mp4 S3 ALIVE
  (514d3ae5….mp4, 132MB), 클립 10/10 S3 생존.
- "편집 중 고착"은 polling 버그(69bff94 수정 전 시점) 화면을 호스트가 그렇게 인식한 것으로 추정.
  현재 배포본은 done에서 fetchEvent 폴링 멈춤 → 정상 표시 흐름.
- 복구 액션 불필요. 단, 이 완성본은 cover 시절 렌더라 찌그러진 채임(아래 미완 5 참조).

### stage 키 ≠ 환경 격리 (직전 인계분, 아직 docs 미반영)
- createRender의 destinations가 prod S3로 하드코딩 → stage 렌더 결과물도 prod 버킷에 샘.
- 다음 테스트 시 prod 버킷 오염 주의. 기록 또는 환경별 destinations 분기는 미결.

## 미완 작업 (다음 세션 우선 처리)

### 1. docs 갱신 일괄 (A 트랙) — 휘발 방지 위해 최우선
다음을 한 사이클로:
- decisions/rendering.md: Shotstack fit cover=stretch / crop=비율유지 함정 기록 + crop 통일 결정
- known-issues-resolved.md: 찌그러짐 이슈를 "해결됨(5780a2d)"으로 등재
  (※ 발견 당시 launch blocker였음을 명시 — 출시 검증에서 done만 보고 출력 품질 못 본 사각지대였음)
- decisions/infra.md 또는 rendering.md: stage 키 ≠ 격리 (destinations prod 하드코딩) 기록
- PROJECT.md: SLA 근거(마감 후 약 7분, 단독 렌더) 반영
- CLAUDE.md 학습 룰: "API 용어를 이름값으로 추론 말 것 — fit cover가 그 사례. 공식 문서 확인."

### 2. ㈑ 호스트 intro/outro 세로 안내 추가
- dashboard/create의 intro/outro 업로드 UI에 "세로로 올려주세요" 안내.
- 정찰 미실시 — 업로드 UI 위치·기존 안내 유무부터 확인 필요.

### 3. 본인(rhcho) rendering 갇힌 6건 복구
- 7kg2dUVqPYAsOD4aMyYM, FfKl53IyDrvLjimxu5nb, Imzt0K5lqcvMwZlWcK0X,
  M8KIxxR6w7YKlRH5Q2RQ, iyX3pk0O0Gwhfs7SD8SN, xVZeOB7NDmYhR47K2N6y
- status→closed + "다시 시작" 버튼 경로(검증된 경로). ⑦+crop 고쳤으니 이제 재렌더 시
  done까지 + 비율 정상으로 나올 것.

### 4. CC ※recap 규칙 강화
- 자유형(정찰/보고) 프롬프트 말미 ※recap 반복(누적 다회). per-prompt로 안 잡힘.
  CLAUDE.md 절대 규칙 강화 필요(9302871 escalation 패턴).

### 5. 기존 cover 시절 완성본 재렌더 여부 (판단 필요)
- D 와인모임 포함, cover로 이미 렌더돼 찌그러진 채 배포된 완성본들을 재렌더할지.
- 빈도·비용 대비 판단. 갇힌 6건 복구(미완 3)와 묶어서 처리 가능.

## 다음 세션 후보 (우선순위)
1. (높음) docs 갱신 일괄 — 미완 1
2. (중간) ㈑ 호스트 안내 — 미완 2 (정찰부터)
3. (중간) 갇힌 6건 복구 + 재렌더로 crop 적용 실데이터 확인 — 미완 3
4. (낮음) CC recap 규칙 강화 — 미완 4
5. (판단 필요) 기존 cover 시절 완성본 재렌더 여부 — 미완 5

## 본 세션 학습 한 줄
API 용어는 이름값으로 추론하면 안 된다 — Shotstack `fit:"cover"`를 CSS 통념(비율 유지)으로
읽었으나 실제는 stretch였다. 증상↔코드가 충돌할 때(소스는 가로, 코드는 cover인데 늘어남)가
바로 "코드 글자의 의미를 의심하라"는 신호. 공식 문서로 박은 뒤에야 원인 확정됨.
