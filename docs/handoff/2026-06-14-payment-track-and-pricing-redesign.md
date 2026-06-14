# 2026-06-14 (2) — 결제 트랙 단계 1·2 + 랜딩 가격 페이지 계산기 재설계

## 한 줄 요약
결제 트랙(S3-05) 진입. plan 모델을 4단→2단(free/paid)으로 통합하고 계산식·정원 입력 UI까지
본 앱에 구현(커밋 2개, push 완료). 랜딩 가격 페이지(pricing.html)를 옛 4단 고정가 → 계산기
디자인으로 교체·배포. 토스 가입은 진행 중, 통신판매업 신고는 미완(단계 3 선행 관문).

## 본 세션 커밋 (본 앱, 시간순, 전부 push됨)
- b5c52f3 refactor(plans): 4단(free/small/medium/large) → 2단(free/paid) + calcPrice 추가
- d6534c1 feat(create): 유료 갯수·길이 스텝퍼 + 예상 금액 표시 + 정원 차단

(직전 BGM 세션 핸드오프 f7f0f43도 이번 세션 초반에 push됨 — 별건)

## 랜딩 트랙 변경 (git 외부, 커밋 없음, Vercel 배포본에만 존재)
- deploy/pricing.html 교체 배포 (dpl_AgrWnc7K4kS5ebB2Ygx1fff8g2sX, www.congre.kr 별칭)
- 백업 2개: pricing_pre_calc_backup.html(4단 시절), pricing_pre_mobile_backup.html(모바일 수정 직전)
- ★ 이 변경은 git에 없음. CD zip 또는 새 배포로 덮으면 사라짐 (known-issue L8과 동일 트랙)

---

## 확정된 가격 모델 (이번 세션에서 코드에 박음)

```
PlanId = "free" | "paid"
PLAN_CLIP_LIMITS      = { free: 5,  paid: 200 }
PLAN_MAX_CLIP_SECONDS = { free: 10, paid: 100 }
calcPrice(maxClipSeconds, clipCount) = Math.max(maxClipSeconds × clipCount × 100, 10000)
```

- 무료: 5클립 / 10초 고정 / 워터마크 / 0원
- 유료: 길이 10~100초(5초 단위) · 갯수 10~200개(1개 단위, "정원") · 워터마크 없음
- **결제 기준 = B안(실제 업로드 수)**: 호스트가 고른 갯수는 "정원(상한)"이고, 결제액은 마감 시
  실제 업로드된 클립 수 × 길이 × 100. 생성 시점엔 "최대 금액"만 표시.
- 결제 시점 = 마감 시 (단계 3에서 구현)
- 재렌더 = 첫 결제액의 80% (단계 3에서 구현, 아직 코드 없음)
- 200개 초과 = 별도 문의(기업 상담 트랙)
- 옛 데이터 fallback 안 만듦 — 운영자가 옛 이벤트(plan=small/medium/large) 삭제 예정

## 단계 1·2에서 바뀐 파일
- 단계1(b5c52f3): plans.ts, events.ts(EventPlan), api/events/route.ts(plan·maxClipSeconds 검증),
  dashboard/page.tsx(planLabels), dashboard/create/page.tsx(planOptions 2개로)
- 단계2(d6534c1): events.ts(maxClips 필드), api/events/route.ts(maxClips 검증·저장),
  api/clips/route.ts(cap 로직), dashboard/create/page.tsx(Stepper 컴포넌트·예상금액·안내문구)
- 둘 다 build 통과, lint 11 errors·3 warnings = baseline delta 0

---

## 결제 트랙 남은 것 = 단계 3 (외부 선행이 막고 있음)

### 단계 3 = 토스 PG 실연동 + 마감 결제 게이트
- handleClose(dashboard/events/[eventId]:730-752)가 지금 close→곧장 callRenderStart.
  유료면 그 사이에 금액계산→결제창→성공시 렌더 게이트를 끼워야 함. 무료는 지금처럼 바로 렌더.
- render/start(route.ts)에 결제 검증 분기 없음 — 여기에 paid 가드 추가 필요.
- 재렌더 80% 결제, 결제 실패·취소 처리, 토스 키 환경변수.

### ★ 외부 선행 순서 (역순 주의 — 토스가 통신판매업보다 먼저)
```
사업자등록(완료) → 토스 가입 → 구매안전서비스(에스크로) 이용확인증 발급
  → 정부24 통신판매업 신고(확인증 첨부) → 등록면허세 납부 → 신고증
  → 토스 가맹 심사 통과 → 라이브키 발급 → [단계 3 코드 시작]
```
- 토스 가입: **진행 중** (운영자, 2026-06-14 시점)
- 통신판매업 신고: **미완**. 면제 대상(직전연도 50건 미만/간이과세자)이어도 토스 심사가 요구할
  가능성 높아 신고 권장. 등록면허세 약 2.25만~4.05만원(지역별), 정부24 신청→1~3일→위택스 납부.
- 신고 후 의무: 판매 페이지에 사업자 정보+통신판매업 신고번호 기재 → 앱/랜딩 푸터에 박는 작업 발생(메모).

---

## 미완 작업 (다음 세션 시작 시)
- 없음(블로커). 결제 단계 1·2 종결, 랜딩 가격 페이지 배포 완료.
- 단계 3은 토스 라이브키·통신판매업 신고증이 나와야 시작 가능 = 외부 대기.

## 다음 세션 후보 (우선순위)
1. **결제 단계 3** — 토스 키·신고증 확보되면 1순위. 마감 결제 게이트가 핵심(handleClose 개조).
2. **랜딩 디자인 리뉴얼 (독립 트랙, 운영자 선행 필요)** — 운영자가 "세련되지 못함/올드함" 지적.
   블랙골드 자체 한계 아니라 "럭셔리-에디토리얼 톤(Cormorant 세리프 + 장식 과다 + 골드 남용)"이 원인.
   가격 페이지만 X — 랜딩 전체(index.html) 톤 재검토. **선행: 운영자가 트렌디 레퍼런스 2~3개 수집**
   (레퍼런스 없이는 CD가 또 AI slop으로 수렴). 그 후 CD 시안→반복→전면 적용.
3. #4 done 화면 재편집 버튼 — 결제 게이트(B5)와 묶임. 단계 3과 함께.

## 새로 등재할 known-issue
- **랜딩 pricing.html = git 외부 직접 수정분** (L8 푸터 건과 동일 트랙). 이번 계산기 섹션 전체가
  CC 직접 수정분이라 git에 없음. CD zip 새로 뽑아 덮으면 계산기째 사라짐. 다음 CD 랜딩 작업 시
  pricing.html 계산기 보존 여부 확인 의무. 백업: pricing_pre_calc_backup.html.
- **clips/route.ts cap=0 경로** (지금 안 고침): 유료인데 maxClips 비면 cap=0 → 업로드 전부 차단.
  새 생성 API가 paid에 maxClips 필수라 사실상 안 생기고 옛 데이터 삭제 예정이라 무해. "유료인데
  아무도 못 올린다" 증상 시 maxClips 필드 빈 것이 1순위 의심.

## 본 세션 학습 한 줄
- **CD용 프롬프트를 CC에 던지는 혼선** 발생. 결과적으로 CC가 frontend-design 스킬로 잘 만들어 사고는
  안 났지만(tmp 파일이라 git 무영향), 보통은 본 앱 git에 랜딩 파일이 섞이는 사고로 감. → 프롬프트
  최상단에 [CC용]/[CD용] 한 줄 박기.
- **외부 절차 의존 트랙은 의존 그래프를 먼저 그릴 것**: 토스(PG)가 통신판매업 신고의 선행(에스크로
  확인증 발급처)이라 순서가 직관과 역순. 코드 짜기 전 외부 게이트부터 그렸어야.
- 두 출처 대조 시 같은 값을 "다르다"고 단정한 오류(경로 C:\...\deploy 동일한데 다르다 함) — 실제
  글자 안 맞춰보고 대조한 척.
