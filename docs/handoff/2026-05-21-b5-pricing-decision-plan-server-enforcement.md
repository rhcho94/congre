# Handoff — 2026-05-21: B5 가격 정책 결정 + 플랜 서버 강제 (β·γ)

## 본 세션 완료 항목

### 1. α — B5 가격 정책 결정 + D2 재작성 docs 갱신 (커밋 a9dec1f)

- **결정 본문**: `docs/decisions/market-product.md` 맨 위에 2026-05-21 B5 결정 추가 (77줄)
  - 결제 모델 S5 (첫 렌더 유료 + 재렌더 매번 유료)
  - 재렌더 의미 재정의 (품질 향상 ❌ / 클립 토글 ⭕ / 비결정성 인정)
  - 플랜 구조 (무료 10·소형 50·중형 200·대형 5000)
  - 가격 시작점 (소형 2만 / 중형 7만 / 대형 별도, 길이별 ±20%)
  - 재렌더 가격 (1차 -20%, 2차 이후 80% 고정)
  - 무료→유료 마감 전까지 업그레이드 가능
- **D2 재작성**: `docs/decisions/data-flow.md` 맨 위에 2026-05-21 본문 추가 (46줄)
  - 모두 7일 보관 + 매일 1회 cron 일괄 삭제
  - 서브컬렉션 `events/{eventId}/renders/{renderId}` 전환 (기존 결정 유지)
  - 호스트당 N개 완성본 동시 보존
- **DECISIONS.md 인덱스**: market-product 7→8, data-flow 11→12
- **CHANGELOG.md**: 2026-05-21 영역 한 줄 추가
- **known-issues.md**: 재렌더 UX 갭 + 완성본 단일 필드 항목 본문 갱신

### 2. β — 플랜별 클립 수 서버 강제 (커밋 2345d95)

- **신규 파일** `src/lib/plans.ts`: `PlanId` 타입 + `PLAN_CLIP_LIMITS` 상수 + `getPlanClipLimit` 헬퍼 (13줄)
- **api/clips POST**: EVENT_CLOSED 직후에 클립 수 검증 블록 추가
  - 현재 이벤트 plan 조회 → `count()` 쿼리 → 한도 초과 시 HTTP 409 `{ code: "PLAN_LIMIT_REACHED", limit, current }`
- **upload 페이지**: 응답 처리에서 PLAN_LIMIT_REACHED 분기 추가
  - `setStage("error") + "이 이벤트의 플랜 한도에 도달했어요 (현재 N/M명). 호스트에게 문의해주세요."` 메시지
- **TypeScript 빌드**: 0 errors
- **Firestore 인덱스**: 추가 불필요 (eventId 단일 조건 자동 인덱스)

### 3. γ — 무료 플랜 영상 길이 5·10초 제한 (커밋 f7cb3d2)

- **plans.ts 확장**: `PLAN_MAX_CLIP_SECONDS` 상수 + `getPlanMaxClipSeconds` 헬퍼 추가 (13→24줄)
  - free: 10, small/medium/large: 30
- **api/events POST**: 기존 range 검증(5–30초) 직후 plan 한도 검증 블록 추가
  - `maxClipSeconds > getPlanMaxClipSeconds(plan)`이면 HTTP 400 `{ code: "INVALID_CLIP_SECONDS", plan, maxAllowed }`
- **TypeScript 빌드**: 0 errors
- **PATCH/PUT 핸들러**: 정찰 결과 없음 (이벤트 plan/maxClipSeconds 변경 흐름이 코드에 없음)

## 다음 세션 우선 결정 영역

### 진입 영역 후보 4개

| # | 작업 | 크기 | 결제 흐름 의존 | 본인 평가 |
|---|---|---|---|---|
| δ | 이벤트 생성 UI 플랜별 분기 (γ 후속 — 무료 선택 시 5·10초 라디오만 활성화 + 서버 응답 INVALID_CLIP_SECONDS UI 분기) | 작음 | 없음 | 가장 자연스러운 다음 |
| ε | 워터마크 구현 (현재 코드 0건) | 중간 | 없음 | 별도 정찰 필요 (Shotstack 영역) |
| ζ | 무료→유료 업그레이드 UI (마감 전까지 가능) | 중간 | **있음** | 결제 PG 먼저 |
| S3-05 | 결제 PG 정찰 + 통합 (토스페이먼츠·카카오페이 등) | 큼 | 자체 | 본격 영업 진입 영역 |

### 본인 추천 우선순위

```
1. δ — γ 후속 UI 마무리 (작은 작업, 사용자 사고 방지)
2. ε — 워터마크 정찰 + 구현 (무료 플랜 실효성)
3. S3-05 — 결제 PG 정찰 (영업 개시 본 영역)
4. ζ — S3-05 끝나고 진입
```

### 운영자 결정 영역

1. **다음 세션 진입 영역** — δ·ε·ζ·S3-05 중 어디로
2. **워터마크 시각 위치·텍스트** (ε 진입 시 결정) — 좌상단 / 우하단 / 중앙 / 텍스트 vs 로고
3. **PG 선택** (S3-05 진입 시 결정) — 토스페이먼츠 / 카카오페이 / 양쪽

## B5 결정 후속 미해결 영역

### 응답 형식 혼재 (격상 트리거 대기)

- 기존 코드: HTTP 4xx + `{ error: "..." }` (예: EVENT_CLOSED, INVALID_MAX_CLIP_SECONDS)
- 본 세션 신규: HTTP 4xx + `{ code: "...", ...meta }` (PLAN_LIMIT_REACHED, INVALID_CLIP_SECONDS)
- **현재 처리**: 미정정. 혼재 상태 유지
- **격상 트리거**: 다른 검증 신규 추가 시 또는 클라이언트 분기 통일 필요할 때
- **이유**: 본 세션 사양에서 `code` 형식 명시 + 기존 컨벤션 손대면 다른 호출처 영향. YAGNI

### 클라이언트 INVALID_CLIP_SECONDS UI 분기 (δ로 이관)

- γ 작업에서 서버 강제만 추가. 무료 + 15초 시도 시 폼 전송 → 서버 400 → 클라이언트 처리 영역 본인 미정찰
- 사용자 안내 메시지 노출이 안 될 가능성
- δ 작업에서 같이 처리 권장

### 기존 events 문서 마이그레이션 (안 함)

- 본 세션 이전 생성된 events 문서에 무료 + 15·30초 저장된 데이터 있을 수 있음
- 신규 생성·업데이트만 검증. 기존 데이터 손대지 않음
- **격상 트리거**: 기존 이벤트에서 동작 이상 보고 발생 시

## 본 세션 사고 학습 (본인 영역)

### 사고 1: docs 카운트를 핸드오프 수치로 가정

- 본인이 정찰 결과 docs 카운트 갱신 사양 작성 시, 직전 핸드오프(auth-model 5→6) 표기를 본인이 그대로 적용
- 실제 인덱스는 별개로 진화 — market-product 7개, data-flow 11개 상태
- CC가 실측해서 7→8, 11→12로 정정 적용
- **학습**: docs 카운트는 매 세션 인덱스 직접 view로 확인 후 적기. 핸드오프 수치를 정합 데이터로 받지 말 것

### 사고 2 (잠재): CC 마무리 멘트 패턴

- β·γ 두 보고 모두에서 CC가 보고 마지막에 자기 마음대로 "다음 단계 제안" 추가
- γ 프롬프트에 "보고 마지막에 다음 단계 제안 추가 금지" 명시했으나 CC가 또 추가함
- **학습**: 프롬프트 단발 지시로 CC 패턴 못 잡힘. 본 인스턴스 2회로는 단정 못 함
- **격상 트리거**: 다음 세션에 동일 패턴 재발 시 CLAUDE.md에 명시 룰 추가하거나 known-issues 등록

## 현재 커밋 상태

- `f7cb3d2` — feat(plans): 무료 플랜 영상 길이 5·10초로 제한 (γ)
- `2345d95` — feat(plans): 플랜별 클립 수 서버 강제 + 한도 초과 안내 (β)
- `a9dec1f` — docs: B5 가격 정책 + D2 사양 재작성 (α)

origin/main 동기화 완료. 본 세션 신규 = 3개 커밋.

## 다음 세션 진입 시 5개 셋트 + 추가

### 핵심 5개 (Kickoff 매번 동일)
1. CLAUDE.md
2. AGENTS.md
3. **본 핸드오프** (`2026-05-21-b5-pricing-decision-plan-server-enforcement.md`)
4. docs/DECISIONS.md (인덱스)
5. docs/known-issues.md

### 추가 첨부 후보 (다음 세션 진입 영역에 따라)
- **δ 진입 시**: `src/app/dashboard/create/page.tsx` (라디오 UI) + `src/app/upload/[eventId]/page.tsx` (응답 분기)
- **ε 진입 시**: `src/lib/shotstack.ts` (Shotstack 통합 영역) + `congreguestguide.pdf` (가이드 영역)
- **S3-05 진입 시**: 결제 PG 후보 비교 영역 + `src/app/terms/page.tsx` (약관 v0.2 트리거)

### 운영자 결정 영역 (다음 세션 진입 전)

1. **다음 세션 어느 영역**: δ·ε·ζ·S3-05 중 (본인 추천 = δ)
2. **본인 가설 가져올지 / 옵션 비교부터** 시작할지

## 본인 메모 (다음 세션 본인용)

- 운영자가 본 세션 막판에 "모든 거 니 추천대로"로 위임함. 본인이 가격 시작점(소형 2만 / 중형 7만 등)을 임의로 정했으나 운영자가 사후 검증 안 함
- 운영자 위임이 "임의값이라 어차피 시장 데이터로 교체" 의식에서 나왔음. 본인이 임의 결정한 영역은 시장 데이터 들어오는 시점에 다시 짚어줄 영역
- ε 워터마크 영역은 본인 Shotstack 워터마크 API 영역 무지. 정찰 별도 필요
- 핸드오프 5/21 본 파일이 본 영역(B5 + 플랜 서버 강제) 메인 핸드오프. 직전 핸드오프(`2026-05-21-s2-04-deadlock-iphone-s4-09-p0.md`)는 본 세션 진입 전 잔여 영역
