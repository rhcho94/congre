# Handoff — 2026-05-21: S2-04 P4 데드락 해소 + iPhone 실측 + S4-09 P0 + 재렌더 전략 재검토 필요

## 본 세션 완료 항목

### 1. S2-04 P4 회원 탈퇴 데드락 해소 (커밋 0cbe438)

- **사고 정의**: 클립 0개로 마감(close)한 이벤트는 rendering 전이 불가 → closed 영구 정체 → 차단 조건에 closed 포함 시 호스트 탈퇴 영구 불가
- **해결**: 차단 조건을 `["open", "closed", "rendering"]`에서 `["open", "rendering"]`로 축소 (옵션 1)
- **변경 파일**:
  - `src/app/api/user/delete/route.ts` 라인 29 (1라인)
  - `src/app/mypage/page.tsx` 라인 101 (1라인)
- **docs 갱신** (같은 커밋):
  - `docs/known-issues.md`: 회원 탈퇴 데드락 항목 제거
  - `docs/known-issues-resolved.md`: 해결 항목 첫 위치 등재
  - `docs/CHANGELOG.md`: 2026-05-21 fix 한 줄
  - `docs/decisions/auth-model.md`: 결정 본문 추가
  - `docs/DECISIONS.md`: auth-model 카운트 5→6
- **Race 평가**: closed → rendering 자동 전이 경로 0건 (정찰 확인). 사용자가 탈퇴 + 렌더 시작 동시 호출 확률 무시 가능
- **실측 검증 통과**: 시나리오 1+2+3 (차단 해제 + 카운트 + 일괄 삭제 + Auth 계정 삭제 + Firebase 잔여 데이터 0건)
- **트레이드오프**: 마감만 하고 렌더 미시작한 closed 이벤트도 탈퇴 시 일괄 삭제. confirm 다이얼로그 "모든 이벤트가 즉시 삭제"에 포함됨

### 2. iPhone Safari 카메라 실측 검증 전체 통과 (코드 변경 0건)

- 2026-05-19 v1에서 옵션 B 코드 변경 (커밋 6ec5873) 완료 상태에서 본 세션 운영자 실측
- **통과 항목**:
  - iPhone Safari → 업로드 페이지 → "지금 촬영하기" 안 보임 + 안내 박스 + "갤러리에서 선택" 메인 노출
  - 메인 버튼 탭 → 갤러리 피커 정상
  - 영상 선택 → 업로드 완료
  - **15초 클립 제한 정상 동작** (50초 영상 업로드 시 완성본에 15초만 포함)
  - 회귀 검증 (안드로이드 또는 데스크톱에서 기존 "지금 촬영하기" + "갤러리" 둘 다 노출)
- **iPad 영역**: deferred 유지 (별도 known-issues 항목)
- **잔여**: 호스트·게스트 가이드 PDF 갱신 (보정 큐)

### 3. launch-roadmap 본 세션 완료분 갱신 (커밋 8ea43eb)

- 변경 4영역:
  - S2-04 마이페이지 섹션: 2026-05-21 데드락 해소 추가 줄
  - S4-NEW iOS Safari 섹션: 제목 + 본문에 2026-05-21 실측 검증 통과 추가
  - 추천 진행 순서 5번: S2-04 strikethrough + P3·P4 완료 표기
  - Part 3 누적 영역: 본 세션 완료분 추가
- 변경 파일: `docs/launch-roadmap.md` 1파일만
- 미관 영역 1건: 변경 1에 markdown `**` 강조 누락 (의미 손실 없음, 다음 갱신 묶음에서 정정 가능)

### 4. S4-09 D2 진입 전 P0 데드코드 정리 (커밋 41e180f)

- **변경 1**: `CongreEvent` interface에 `renderDoneAt?: Timestamp` 추가
  - 근거: Firestore 문서엔 존재(check-rendering cron이 FieldValue.serverTimestamp()로 씀)하나 TypeScript 타입에 없음. cleanup cron이 runtime cast로 접근 중
- **변경 2**: `updateEventRender` 함수 제거
  - 근거: `src/` 전체에서 호출처 0건 (정찰 확인)
- **변경 3**: `draftVideoUrl` 필드 제거
  - 근거: 타입 정의 + API 직렬화 2곳만 사용. 실제 값 읽기·쓰기 0건
  - 사용처: `src/lib/events.ts` 라인 22 + `src/app/api/events/route.ts` 라인 39 (둘 다 제거됨)
- **변경 통계**: 3 files, 3+/18-
- **TypeScript 빌드**: 0 errors

---

## 다음 세션 우선 결정 영역 — 재렌더 전략 재검토 (S4-09 D2 본격 진입 보류 필요)

본 세션 막판에 운영자가 짚은 **두 가지 비즈니스 사실**이 D2 사양의 전제 자체를 흔듦. **B5 가격 정책 결정 → D2 사양 재작성** 순서로 가야 함.

### 두 사실

1. **재렌더는 운영자 비용**
   - Shotstack은 렌더 1회당 과금
   - 호스트 재렌더 N번 = 비용 N배
   - 영업 개시 후 결제 모델에서 **재렌더 비용 회수 방식** 결정 필요

2. **AI 렌더링은 결과 비결정적**
   - 같은 클립 묶음으로 두 번 렌더해도 결과 미묘하게 다를 수 있음
   - **재렌더가 품질 향상을 보증하지 않음**
   - 호스트가 "마음에 안 들어서" 재렌더 → 결과가 더 나아지지 않을 수 있음 → 클레임 가능성

### D1·D2 결정 본문 vs 위 사실의 충돌

- DECISIONS data-flow.md D2 2026-05-09 본문: "재렌더 무제한(D1) 정책의 안전망. 사용자 안심"
- 위 D2 전제 = 재렌더 무제한 + 비용 운영자 흡수. **영업 개시 후 유효하지 않음**
- D1 본문에 "실서비스 단계 사전 결제 게이트 추가 예정" 표기 있음 — 결정 시점에 영업 단계 전환 의식은 있었으나 D2 사양은 무제한 가정으로 작성됨

### 결제 모델 후보 (본 세션 정리, 운영자 결정 영역)

| 모델 | 장점 | 단점 | 본인 평가 |
|---|---|---|---|
| A. 재렌더 별도 결제 | 비용 회수 명확. Runway/Pika 표준 | UX 마찰. "왜 또 돈?" 클레임 | 중 |
| B. 첫 렌더 무료, N회 이내 재렌더 포함 (예: 3회) | 일정 안전망. 비용 예측 가능 | N 결정 어려움. 초과 결제 흐름 추가 필요 | 중~상 |
| C. 재렌더 비활성화 | 비용 0 | 클립 빼고 싶을 때 못 함. 1순위 시장(졸업식) 만족도 낮음 | 저 |
| D. 사전 미리보기 강화 → 재렌더 빈도 자체 낮추기 | UX·비용 동시 개선 | 코드 영역 큼 (사전 미리보기 인프라 필요) | 상 (다만 큰 작업) |
| E. 클립 토글만 무료, 인트로/아웃트로/BGM 변경 시 결제 | 미세 조정 자유, 큰 변경은 과금 | 분기 복잡 | 중 |

### 본 세션 본인 추천 우선순위 재배치

```
5. ~~S2-04 마이페이지~~ (완료)
6. **B5 가격 정책 결정** ← 재렌더 정책 포함. 운영자 결정 영역, 코드 0건
7. S3-06 상품 모델 + S3-05 PG 연동
8. S3-07 결제 이력 + S3-08 결제→이벤트
9. **S4-09 D2 (B5 결과에 따라 사양 재작성)**
```

근거:
- 현재 영업 차단 우려 영역 코드상 없음 (D1 미구현이라 done에서 재렌더 트리거 불가)
- B5 가격 정책 결정 시점에 재렌더 정책이 같이 결정됨 → D2 사양 자동으로 정해짐
- D2 단독 진입 시 결제 모델에 따라 만들고 다시 만들 가능성

### 다음 세션 진입 시 운영자 결정 영역 (Kickoff 항목)

1. **재렌더 모델 A·B·C·D·E 중 어느 방향 가는지** (조합 가능)
2. **첫 렌더 무료 / 첫 렌더부터 유료** 어느 쪽인지
3. **재렌더 결과 보장 안 함을 사용자에게 어떻게 알릴지** (UI 영역, 약관 영역 둘 다)
4. **D2 사양 영향**:
   - 모델 A → 7일 보관 큰 의미 (안전망)
   - 모델 C → D2 무의미 (버전 1개만)
   - 모델 D → D2 의미 약함 (재렌더 빈도 낮음)

---

## 알려진 정찰 결과 (다음 세션 D2 본격 진입 시 활용)

본 세션 정찰에서 회수된 영역. 다음 세션이 같은 정찰 반복 안 하도록 기록.

### D2 결정 본문 위치
- `docs/decisions/data-flow.md` 라인 101–116 (rendering.md 아님 — 본인 사고 사례)
- D1 결정 본문: `docs/decisions/rendering.md` 라인 231–242

### videoUrl 참조 위치 (전수 grep, 8 파일)

| 파일 | 라인 | 종류 |
|---|---|---|
| `src/app/api/user/delete/route.ts` | 63–64 | 분기 조건 (renderId && videoUrl 조건부 Shotstack 삭제) |
| `src/emails/render-completed.ts` | 5, 35 | 읽기 (이메일 템플릿 href) |
| `src/emails/participant-result.ts` | 5, 23 | 읽기 (참가자 결과 이메일 href) |
| `src/lib/events.ts` | 21 | 타입 정의 (CongreEvent interface) |
| `src/app/api/events/route.ts` | 38 | 읽기 (API 직렬화) |
| `src/app/api/cron/cleanup/route.ts` | 46, 51 | 분기 조건 + 쓰기(null) |
| `src/app/api/host/events/[eventId]/route.ts` | 41 | 읽기 (API 직렬화) |
| `src/lib/notifications/scenarios/participant-result.ts` | 8, 18, 25, 37 | 읽기 (알림 시나리오) |
| `src/lib/notifications/scenarios/render-completed.ts` | 8, 18, 30 | 읽기 (알림 시나리오) |
| `src/app/api/cron/check-rendering/route.ts` | 47, 55, 86 | 쓰기 + 읽기 (status=done + videoUrl=url 덮어씀) |
| `src/app/dashboard/events/[eventId]/page.tsx` | 42, 332, 335, 344, 358, 364, 366, 905, 924, 931 | 읽기 + 분기 (대시보드 상세, 카카오 공유·링크·다운로드) |
| `src/app/share/[eventId]/page.tsx` | 39, 45, 60 | 읽기 + 분기 (isReady = status === "done" && !!videoUrl) |

### renderId 참조 위치 (전수 grep, 7 파일)

| 파일 | 종류 |
|---|---|
| `src/lib/shotstack.ts` | 함수 정의 (deleteShotstackAssetsByRenderId, getRenderStatus) |
| `src/lib/events.ts` | 타입 정의 |
| `src/app/api/events/route.ts` | 읽기 (API 직렬화) |
| `src/app/api/user/delete/route.ts` | 분기 조건 + 읽기 |
| `src/app/api/cron/cleanup/route.ts` | 읽기 (7일 TTL 시 Shotstack 자산 삭제) |
| `src/app/api/cron/check-rendering/route.ts` | 분기 조건 + 읽기 (renderId 없으면 skip) |
| `src/app/api/render/status/route.ts` | 읽기 (query param으로 받음) |
| `src/app/api/render/start/route.ts` | 쓰기 (createRender 반환값을 events 문서에 저장, 기존 renderId 덮어씀) |

### 현재 상태 머신 (S2-04 P4 정찰 + D2 정찰 종합)

```
[open]  ──── close API ────▶  [closed]
                                   │
                                   ├── 클립 ≥ 1 + render/start API ──▶ [rendering]
                                   │                                      │
                                   │                                      ├── check-rendering cron + Shotstack done ──▶ [done]
                                   │                                      └── check-rendering cron + Shotstack failed ──▶ [closed] (롤백)
                                   │
                                   └── 클립 0개 ──▶ ❌ render/start 불가 ──▶ closed 영구 정체
                                                                              (탈퇴 차단 범위에서 본 세션 제외됨)
```

### 미확인 영역 (다음 세션 D2 본격 진입 전 정찰 필요)

- `src/app/api/render/start/route.ts` 라인 1–129 본문: 재시작 시 기존 videoUrl 필드 처리 여부
- `src/app/api/cron/check-render-deadlines/route.ts` 전체: rendering → closed/done 전환 여부
- Firestore 보안 규칙 본문 (서브컬렉션 룰 추가 시 영향 영역)
- 기존 videoUrl을 가진 events 문서 수 (Firebase 콘솔 영역, 코드로 알 수 없음)

---

## 본 세션 사고 학습 (본인 영역)

### 사고 1: 본인이 정찰 프롬프트에 "rendering.md 2026-05-09 D2"로 단정
- 실제 위치는 data-flow.md
- 원인: DECISIONS 인덱스에 "rendering (26개)"와 "data-flow (11개)" 둘 다 있는데, "완성본 보존"이 영상 영역이라 자동으로 rendering.md로 단정
- 학습: 결정 본문 위치는 영역 분류만으론 단언 불가. 정찰 프롬프트에 후보 2개 두는 게 안전

### 사고 2: 운영자 "진행 중 1개" 단편 정보로 시나리오 1 실패 단정
- 운영자가 마감 전 시점 화면 공유였으나 본인은 마감 후 결과로 단정
- 학습: 운영자 보고 형식이 명시적으로 시작 안 했을 때, 단편 데이터 → 시나리오 결과 자동 매핑 금지. 어느 단계인지 한 번 묻기

### 사고 3: 운영자 "50초 전체 포함" 보고 받고 즉시 "새 사고 발견" + 정찰 방향 4건 작성
- 운영자가 직접 재확인 후 "15초 정확히 잘림" 정정
- 학습: 단편 단서로 전체 사고 단정 패턴. 본인이 먼저 "완성본 다시 확인" 요청했어야 함. 5/18 검증 영상 출처 누락 사고와 같은 패턴

### 사고 4 (잠재): D2 분해 시 비즈니스 영역(재렌더 비용·결정성) 못 봄
- P0~P4 사양 작성 시 코드·데이터 영역에만 집중
- 운영자가 재렌더 비용 + 비결정성 짚고 나서 D2 전제 자체가 흔들림 발견
- 학습: 큰 작업 분해 시 비즈니스 영역(비용·결제·UX 클레임 가능성) 짚는 단계가 분해 사양에 없었음. 다음 세션 진입 시 영역별 짚을 점 체크리스트 만들어 운용

### 사고 5: CC가 P0 사전 정찰 grep 결과 명시 출력 생략
- "Conversation compacted" 직후 보고가 압축적
- 본인이 검증 시점에 의외값 없으므로 사후 정정 강제 안 함
- 학습: 다음 세션에 같은 패턴(보고 압축 + 정찰 결과 미출력) 발생 시 격상

---

## 현재 커밋 상태

- `41e180f` — S4-09 P0 데드코드 정리 (renderDoneAt + updateEventRender 제거 + draftVideoUrl 제거)
- `8ea43eb` — launch-roadmap 본 세션 완료분 4영역 갱신
- `0cbe438` — S2-04 P4 회원 탈퇴 데드락 해소

origin/main 동기화 완료.

---

## 다음 세션 진입 시 5개 셋트 + 추가

### 핵심 5개 (Kickoff 매번 동일)
1. CLAUDE.md
2. AGENTS.md
3. **본 핸드오프** (`2026-05-21-s2-04-deadlock-iphone-s4-09-p0.md`)
4. docs/DECISIONS.md (인덱스)
5. docs/known-issues.md

### 추가 첨부 후보 (다음 세션 진입 영역에 따라)
- **B5 가격 정책 결정 진입 시**: docs/decisions/market-product.md, docs/launch-roadmap.md (B5 항목 본문)
- **D2 본격 진입 시 (B5 결정 후)**: docs/decisions/data-flow.md (D2 본문), docs/decisions/rendering.md (D1 본문)
- **PDF 보정 큐 진입 시**: 첨부된 congreguestguide.pdf

### 운영자 결정 영역 (다음 세션 진입 전)
- 본 세션 막판에 짚은 **재렌더 전략**을 본인 머릿속에서 어느 방향(A·B·C·D·E 중)으로 가설 잡고 시작할지
- 본인이 강요 안 함. 가설 자유 — 다음 세션이 옵션 비교부터 시작해도 됨

---

## 본인 메모 (다음 세션 본인용)

- 운영자가 "갈래 A: D2 단독 진입"을 선택했고 본인이 "갈래 D: 데드코드만"을 약하게 추천했었음
- 운영자가 본인 추천 안 받고 갈래 A 선택 → P0 분해 시점에 운영자가 재렌더 비즈니스 영역 짚음 → 본 세션이 결국 "갈래 D + 재렌더 전략 재검토" 형태로 매듭됨
- 즉 본인 약한 추천이 비즈니스 영역 짚음 후 사후적으로 정합 영역으로 귀결. **본인 우선순위 평가가 비즈니스 영역을 잘 못 보더라도, 운영자 짚음으로 정정되는 패턴 확인됨**. 다음 세션도 비슷한 패턴 작동 가능
