# 2026-08-12 핸드오프 — 결제 흐름 사양 확정 + API 2개 신설

## 한 줄 요약
토스 심사용 결제 연동의 사양을 확정해 decisions에 편입하고(`dfae07d`),
결제 준비·승인 API 2개를 신설했다(`f4b3623`). 다음은 코드 ②(결제 요약 화면).

---

## 이번 세션 커밋 (3건)

| 해시 | 내용 |
|---|---|
| `dfae07d` | docs: 결제 흐름 사양 v2 + 토스 1차 회신 결정 편입 — 5 files, +92 −3 |
| `f4b3623` | feat(payment): 결제 준비·승인 API 2개 신설 — 2 files, +212 |
| (본 커밋) | docs: 2026-08-12 세션 핸드오프 |

`f4b3623`까지 push 완료.

---

## 확정된 것 (본문은 decisions에, 여기는 색인만)

- 결제 흐름 사양 v2 전문 → `decisions/market-product.md` 2026-08-12
- 토스 1차 회신 확약 내용 → `decisions/legal.md` 2026-08-12 결정 1
- 최고가 200만원 확약은 이미 참 (조치 불요) → 같은 파일 결정 2
- known-issues 신규 3건 (재렌더 80% 공개 선언 갭 / 결제 후 클립 제외 차액 / Clip 타입 불일치)

---

## 신설된 코드 (`f4b3623`)

- `src/app/api/payment/prepare/route.ts` (81줄)
- `src/app/api/payment/confirm/route.ts` (131줄)

핵심 동작:
- **prepare** — 인증·권한·플랜·상태 검증 → `!excludedAt` 클립 집계 →
  `calcPrice(event.maxClipSeconds, clipCount)` → `orderId` 발행 →
  `payments/{orderId}` 저장 (status `"pending"`)
- **confirm** — 2중 검사를 토스 승인 fetch **앞에** 배치
  - (a) 반환 `amount` vs 저장 `amount` (토스 공식 표준)
  - (b) 현재 클립 수 vs 저장 `clipCount` (우리 추가) → 다르면
    409 `CLIP_COUNT_CHANGED` + `{savedCount, currentCount, newAmount}`,
    `payments` status를 `"stale"`로 갱신

  둘 다 통과 시에만 승인 호출. 성공 시 `events`를 한 번의 update로
  `unlocked`·`closed`·`sessionToken` 처리
- **이 라우트는 렌더를 시작하지 않는다.** 렌더 트리거는 코드 ③에서
  클라이언트가 담당
- `payments` 컬렉션 신설. `firestore.rules` 미기재 = 자동 차단이므로
  콘솔 배포 불필요

---

## 환경변수 (Ray 설정 완료)

- Vercel: `NEXT_PUBLIC_TOSS_CLIENT_KEY` (All Environments, Sensitive 끔) /
  `TOSS_SECRET_KEY` (Production+Preview, Sensitive 켬)
- 로컬 `.env.local`에도 동일 2줄 기재 완료
- 값은 공개 문서 테스트 키 (`test_gck_docs_…` / `test_gsk_docs_…`)
- **Vercel 제약 실측**: Sensitive를 켜면 Development 환경이 잠긴다.
  Development 값은 `vercel env pull`로 읽어야 해서 Vercel이 차단하는
  것. 시크릿류는 Sensitive + Production/Preview가 기존 관례
  (`RESEND_API_KEY`·`CRON_SECRET`과 동일)

---

## 이번 세션에서 뒤집힌 것

1. **금액 상한 (A)/(B) 갈래는 애초에 성립하지 않았다.** 코드의 120초를
   과금 경로로 오독한 것. 120초는 개별 클립 업로드 한도이고, 과금의
   길이 항은 `event.maxClipSeconds`이며 서버가 100초로 검증한다.
   회신 확약은 이미 참.
2. **테스트 계정은 이미 준비돼 있었다.** 앞 세션 핸드오프 3곳이
   "미준비"로 적고 있었으나 1차 회신에 이미 발급·제출됐다. 원인은
   1차 회신 메일 내용이 저장소 어디에도 기록되지 않았던 것. 이번에
   `decisions/legal.md`로 편입.
3. **토스가 심사 가이드에서 안내한 SDK 문서 URL이 구버전(v1)이었다.**
   라나 조사로 v2(`@tosspayments/tosspayments-sdk` 2.7.1)가 현행임을
   확인. v1은 공식 문서에 "더 이상 업데이트되지 않음" 명시.
4. **9/1은 하드 데드라인이 아니라 목표일이다.** 카드 승인이 오픈의
   전제이므로 "승인 없이 오픈하는 기간"은 성립하지 않는다. 진짜
   고정점은 8/24 하나.

---

## 검증에서 잡힌 것 (다음 세션 주의)

1. **★ axe가 금액 계산에 근거 없는 기본값 `?? 15`를 넣었다.** 15는
   프로젝트 어디에도 없는 값이다(무료 10 / 쿠폰 30 / 유료 10~100
   5단위). 데이터 이상 시 조용히 15초로 오청구되는 구조였다. 제거하고
   `INVALID_EVENT_DATA` 400으로 교체. **결제 관련 프롬프트에는 매번
   "임의 기본값 금지"를 명시할 것.**
2. **CC가 두 차례 "금액 계산에 클립 실측 duration을 써야 한다"는
   방향으로 흘렀다.** 결정 원문은 "길이는 호스트가 정한 최대값으로
   계산"이다. 프롬프트에 매번 못박을 것.
3. **eye 실행 환경에서 `npm run build`가 Google Fonts 404로 실패한다.**
   외부망 차단이 원인이며 코드 결함이 아니다. import trace가
   `layout.tsx`→폰트 경로로만 나오면 이 케이스다. CC 본체가 직접
   실행해 갈라야 한다. 앞으로도 반복될 것이므로 매번 재조사하지 말 것.

---

## 다음 세션 작업 목록

### 0. 세션 시작 시
- Project Knowledge 재업로드: `docs/DECISIONS.md`, `docs/decisions/legal.md`,
  `docs/decisions/market-product.md`, `docs/known-issues.md`,
  `docs/CHANGELOG.md`
- `AGENTS.md`는 이번 세션 PK에 누락돼 있었다. 첨부 필요

### 1. 코드 ② — 결제 요약 화면 + 마감 흐름 분기
- `npm i @tosspayments/tosspayments-sdk` (이 단계에서 처음 필요)
- 4요소: 명칭 "Congre 영상 제작 — 유료" / 이미지 `public/og-image.png` /
  상세설명은 랜딩 pricing 문구 복사 / 금액은 계산 과정이 보이게
- 약관 동의 체크박스 1개 (청약철회 제한 고지 자리)
- `dashboard/events/[eventId]/page.tsx` `handleClose`(`:771-793`)를
  `plan === "paid"`에서 분기. 무료는 기존 경로 그대로
- `comingSoon` 잠금 해제 (`dashboard/create/page.tsx:79-82`, `:315`)

### 2. 코드 ③ — `/payment/success`, `/payment/fail`
- `successUrl` 리다이렉트를 받아 `confirm` 호출
- 성공 시 `callRenderStart`(`:738-769`)로 렌더 시작
- 409 `CLIP_COUNT_CHANGED` 응답 시 재발행 안내 UI

### 3. 약관 v1.0 조문 적용 (③장 재료)
- draft 13항목 중 반영 완료 2건 제외 11건
- 시행일: 부칙에 결제 관련 조문 별도 시행일을 한 줄 추가하는 (가)안 유지
- draft 자체 결함 2건 동반 정정 (`:84` 소제목 모순, `:207` stale)

### 4. PPT 캡처 (기한 8/24)
- ① 표지 — **완료** (테스트 계정 `rhcho94+tosstest@gmail.com`)
- ② 하단정보 — 완료
- ③ 환불규정 — 약관 조문 적용 후
- ④ 로그인/회원가입 — **코드 작업 불요. 지금 바로 촬영 가능**
- ⑤⑥ — 코드 ②③ 후
- 형식: PPT / 도메인 노출 / PC 시계 포함
- ⑤장 캡처 시 **쿠폰을 입력하면 안 된다** — `create/page.tsx:310`이
  `{!couponEntered && (플랜 라디오)}`라 쿠폰 입력 시 플랜 선택 UI가
  사라진다

### 5. 2차 회신에 담을 것
- 상품 상세페이지 URL (= 결제 요약 화면)
- 개정 약관 URL
- 통신판매업 표기 설명 한 줄 — 회신은 "미신고", 화면은 "신고 면제
  대상"이라 나란히 보면 모순으로 읽힐 여지가 있다. 제12조 제1항 단서
  면제 사유 명시임을 밝힐 것. 화면은 수정하지 않는다

---

## 미해결 / 확인 대기

- **결제위젯 전용 키 미발급**: 개발자센터에 "내 키는 전자결제 신청하고
  확인할 수 있어요" + [이용 신청하기] 버튼 잔존. 별도 신청 필요인지
  심사 완료 시 자동 발급인지 미확인. 노상미 담당자 문의 예정. 공개
  문서 키로 진행 가능하므로 블로커 아님
- **closed 상태에서 클립 제외 토글 노출 여부** 미확인 (known-issues
  등재분)
- **verifyIdToken catch에 console.error 미부착** — 신규 2개 파일 포함
  코드베이스 전역 패턴(`events/route.ts:17,59` 등 8곳 확인). 신규
  위반이 아니므로 이번엔 손대지 않음. 별도 사이클에서 전역 일괄
- 토스 서류 심사 결과 대기 (8/17 전후 예상)

---

## 메모

- 랜딩 트랙 실제 경로가 `C:\Users\PC\Downloads\congre\deploy` 임이 이번
  세션 eye 로그로 드러났다. 다운로드 폴더는 실수로 삭제되기 쉬운
  위치라 언젠가 옮기는 것을 권함. 이번 세션 범위 밖

---

## 이번 세션 학습

- **외부에 나간 문서가 저장소에 없으면 stale 기록이 반복 생산된다.**
  1차 회신 메일이 기록되지 않아 세 세션 연속 "테스트 계정 미준비"가
  유지됐다. 외부 확약은 결정 기록으로 편입한다.
- **공급자가 준 링크도 최신이라는 보장이 없다.** 토스가 심사
  가이드에서 준 SDK 문서 URL이 v1이었다. 외부 기술 문서는 라나에게
  버전 확인부터 시킬 것.
- **검증자를 따로 두면 결과가 같아도 근거 오류를 잡는다.** eye가
  axe의 번호 관례 판단을 전수 grep으로 정정했다. 결과물은 동일했으나
  근거가 틀렸다.
- **돈 계산에 임의 기본값을 두면 조용한 오청구가 된다.** 타입 에러를
  피하려 넣은 `?? 15`가 그 예다. 검증 단계에서만 잡혔다.
- **날짜에는 기한과 목표가 있다.** 코난이 9/1을 기한으로 읽어
  불필요한 갈래 3개를 만들었다.
