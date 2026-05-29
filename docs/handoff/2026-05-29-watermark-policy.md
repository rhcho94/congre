# 2026-05-29 (2) — 워터마크 정책 결정 + 무료 플랜 사양 공식화

## 본 세션 한 줄 요약

A 트랙 5번 결정(워터마크 = 없는 방향 + 정찰 영역) 트리거로 진입. BM 정찰(채팅 클로드) + 기술 정찰(CC) + 외부 사양 정찰(채팅 클로드 web_search) 종합 → 운영자 결정 뒤집기 → docs 반영. 코드 변경 0건, 1커밋 모두 docs/메타. 부수적으로 plan 인프라 가동 중 발견(큰 발견 1건) + 직전 학습 룰 후보 #1(갱신 트리거 표시) 같은 세션 처리 실천 + 직전 학습 룰 후보 #3(CC 메타 코멘트 재발 패턴) 또 한 번 관측.

## 본 세션 커밋

| 해시 | 메시지 |
|---|---|
| 9ea7f95 | docs: watermark policy decision + free plan spec formalization (2026-05-29) |

## 본 세션 결정·발견

### 워터마크 정책 (decisions/market-product.md 2026-05-29 (3))

직전 2026-05-28 (2) 5번 결정 뒤집기. 6개 결정:

1. **워터마크 정책**: 무료 박음 / 유료 제거. 2026-05-28 (2) 5번 뒤집힘.
2. **무료/유료 차별화 축**: 클립 길이 / 클립 수 / 워터마크 3축.
3. **무료 플랜 사양 공식화**: 클립 길이 10초 (PLAN_MAX_CLIP_SECONDS.free), 클립 수 10개 (PLAN_CLIP_LIMITS.free). 운영자가 결정한 수치가 코드 plans.ts:3~8와 일치. plan 인프라 인지 후 결정.
4. **유료 플랜 실수치 미정**: 본 세션 영역 아님. plans.ts:3~8 초기값(small 50/medium 200/large 5000)은 임시값.
5. **워터마크 시각 사양**:
   - 위치: 우하 (Shotstack `position: "bottomRight"`)
   - 크기: 중간 (정밀치 CD 시안 후)
   - 텍스트: "made by Congre"
   - 투명도: 은은하게 (정밀치 CD 시안 후, 0.3~0.5 영역)
   - 폰트: Cormorant Garamond italic
   - 색: 앰버 #c8892c (디자인 토큰 --accent)
6. **본 세션 메타**: 결정·사양·정책 박기까지. 구현은 별도 트랙.

### 큰 발견: plan 인프라 가동 중

본 세션 CC 정찰 영역 3에서 발견. 운영자 인지 상태로 결정한 영역 확인됨.

| 항목 | 위치 |
|---|---|
| Plan 타입 | `src/lib/plans.ts:1` (`PlanId = "free" \| "small" \| "medium" \| "large"`) |
| 무료 클립 수 한도 | `PLAN_CLIP_LIMITS.free: 10` |
| 무료 클립 길이 한도 | `PLAN_MAX_CLIP_SECONDS.free: 10` |
| events 저장 시 plan 박힘 | `src/app/api/events/route.ts:104` |
| 업로드 시 한도 강제 | `src/app/api/clips/route.ts:54~60` |

워터마크 구현 시 plan 분기 인프라 추가 0건. shotstack.ts createRender 시그니처에 plan 인자 + render/start에서 eventData.plan 전달만 추가하면 됨.

### 외부 사양 정찰 결과 (채팅 클로드 web_search 2건)

| 영역 | 결과 |
|---|---|
| Shotstack 자체 워터마크 옵션 | **없음.** 별도 트랙 패턴이 표준 |
| 우하 정렬 | clip 레벨 `position: "bottomRight"` 표준 키워드 + offset 조정 |
| 텍스트 opacity | rich-text font.opacity 필드 존재 (Shotstack Studio npm) |
| Cormorant Garamond italic 호스팅 | 자체 호스팅 필요. Google Fonts ttf 받아 public/fonts/에 두고 timeline.fonts 등록 (NotoSansKR 패턴) |
| length: "auto" 단일 트랙 | 영상 전체 길이로 확장됨. 공식 워터마크 튜토리얼 패턴 |

### 신규 known-issues 2건

- **워터마크 시각 사양 정밀 수치** — CD 시안 검토 영역. 격상 트리거: 워터마크 구현 트랙 진입 직전
- **유료 플랜 실수치 미정** — 가격 + 운영 데이터 결정 영역. 격상 트리거: 가격 표시 UI 트랙 진입 또는 영업 진입 직전

### 직전 학습 룰 후보 #1 실천 (decisions/market-product.md 2026-05-28 (2) 5번 갱신 메모)

직전 세션(2026-05-29 핸드오프) 학습 룰 후보 #1 ("갱신 트리거 표시는 같은 세션에 처리해야 함")의 정정 실천. 5번 본문 끝에 "**2026-05-29 갱신**: ..." 한 줄 추가. D1 정정 패턴(직전 세션)과 동일.

## 본 세션 학습 (CLAUDE.md 학습 룰 후보, 본 세션 격상 안 함)

- **직전 학습 룰 후보 #3 또 관측** — "CC 메타 코멘트 재발 패턴, 프롬프트 끝에 명시해도 끼움". 본 세션 CC docs 갱신 보고 끝에 "※ recap: ..." 한 줄 또 끼움. 프롬프트 끝에 "보고 끝에 ※recap 끼우지 말 것" 박았는데도 재발. **패턴 충분히 누적됨 — 다음 세션에서 학습 룰 정식 격상 후보 1순위**.
- **본인 카운팅 오류 자체 검증 가치** — 본인이 "4파일 갱신"으로 사양 박았지만 실제 3파일이 정답(market-product.md 한 파일에 두 작업). CC가 정확히 3파일로 보고하면서 자연 정정됨. 사양 작성 시 파일 카운팅 사전 검증 영역.

## 미완 작업

없음. 본 세션 모든 트랙 마감.

## 다음 세션 후보

### 우선순위 높음
- **워터마크 구현 트랙** — 본 세션 사양 확정 후속. 코드 변경 영역:
  - shotstack.ts createRender 시그니처에 plan 인자 추가
  - render/start route에서 eventData.plan 전달
  - 무료 플랜에만 워터마크 전용 트랙 추가 (rich-text asset, font.opacity, position: "bottomRight" 등)
  - public/fonts/에 Cormorant Garamond italic ttf 추가 + timeline.fonts 등록
  - 선행: CD 시안 검토 (KI 워터마크 시각 사양 정밀 수치 영역 해소)

### CD 토큰 복구 후
- **CD 시안 검토** — 워터마크 시각 사양 정밀 수치 결정. 워터마크 박은/안 박은 두 시안 비교. KI 신규 #1 트리거.
- **R4 결과물 섹션** — 2026-05-28 핸드오프에 "사양 확정·CD 영어 프롬프트 작성 완료" 상태로 박혀 있음. CD 복구 즉시 진입 가능.
- **R5~R8 + R9 zip 적용** — 랜딩 리뉴얼 잔여. R9 적용 시 KI-L7 (pricing.html Pretendard) 같이 처리.

### 운영자 결정 영역
- **CLAUDE.md 학습 룰 격상** — 직전 세션 학습 룰 후보 3건 + 본 세션 학습 1건. 본 세션 #3 또 관측으로 패턴 충분히 누적됨 판단 영역. 격상 트리거 도달.
- **덩어리 2: 홈피 가격 표시 UI** — A 트랙 결정의 자연 후속. /pricing 페이지에 실제 플랜 표 노출. CD/CC 협업 영역. 선행: 유료 플랜 실수치 결정(KI 신규 #2 해소).

### 외부 작업 의존
- **회사 메일함 구축** — 직전 세션 KI 리드 폼 수신지 복원 트리거.

### reference/ 16개 PNG 영역
- 직전 세션 잔여. 운영자 검증 영역.

## 다음 세션 진입 컨텍스트

운영자 첫 메시지에 포함할 것:
- 본 핸드오프 첨부
- 작업 영역 명시 (워터마크 구현 / CD 시안 / R4 / 학습 룰 격상 / 덩어리 2 / 회사 메일함 중 택1)
- 워터마크 구현이면: CD 시안 검토가 선행. 동시 진행 결정 영역
- 학습 룰 격상이면: 직전 세션 후보 3건 + 본 세션 1건 = 4건 후보. 전체 격상인지 선별인지 영역
