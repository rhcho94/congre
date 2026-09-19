# 2026-09-18 핸드오프 — closed 상태 의미 중첩으로 결제 전 마감 롤백

> 직전 핸드오프: `2026-09-16-handoff-bizno-vercelignore.md`
> 다음 세션 첨부: 이 문서

## 1. 요약

남은 일 ②(라이브 키 교체 정찰)를 끝내고 ③(유료 개시 전 필수 2건)에 착수했다. ③의 설계·구현·검증·커밋·push까지 갔으나 프로덕션 실화면에서 유료 결제가 아예 막히는 것을 발견해 같은 날 롤백했다. 원인은 `status: "closed"`가 이미 여러 의미를 겸하고 있다는 것을 설계 단계에서 확인하지 않은 것이다. 롤백 과정의 정찰에서 이번 변경과 무관한 **재과금 위험**을 새로 발견했다.

## 2. 완료

### ② 라이브 키 교체 정찰 (T1~T8)
- **SDK**: `widgets()` 계열(결제위젯). `@tosspayments/tosspayments-sdk` ^2.7.1. 계약(결제위젯 Basic)과 일치
- **키 위치**: 클라이언트 `NEXT_PUBLIC_TOSS_CLIENT_KEY` (`payment/[eventId]/page.tsx:105`), 시크릿 `TOSS_SECRET_KEY` (`api/payment/confirm/route.ts:79`). 시크릿 참조는 이 한 곳뿐, `NEXT_PUBLIC_` 접두사 없음
- **하드코딩 폴백**: 토스 관련 0건. `test_`/`live_` 리터럴 0건
- **Shotstack destination**: `s3` 하나뿐, `exclude` 없음. git 전체 이력으로도 `destinations` 변경 커밋은 `98636a6`(2026-06-04) 하나
- **렌더 완료 감지**: 웹훅 라우트는 항상 401 `USE_CRON` 반환. 실제는 `/api/cron/check-rendering` 5분 cron
- **S3 도착 실패**: 재시도 카운터 없음. 5분 cron이 무한 재시도. 24시간 내 종료 보장 코드 없음
- **삭제 경로**: 회원 탈퇴·cleanup 만료 모두 Shotstack·S3 양쪽 삭제 호출

### Shotstack 벤더 진술 대조 (2차 회신 종결)
- 조항 해석 3건은 수용: 크레딧 이월(구독 유지 시 3배까지), 유료 구독 중 비활동 삭제 없음, 5.2조(7일·일반)와 Schedule 2(10일·SLA 크레딧)는 별개 절차
- **계정 데이터 진술 2건은 틀렸다**
  - 합계 134건 → 대시보드 실측 **105건**(Completed 104 + Failed 1). 구간별 63+42=105는 맞았고 합계만 틀림
  - "모든 렌더가 CDN에 잔존" → 5/23 렌더 자산에 `shotstack • 99.9 MB` + **`Deleted` 배지** 확인. 6/13 렌더는 `s3` 자산 1개뿐
- **판정: 삭제 코드는 정상 작동 중.** 조용한 실패 가설은 기각. 개인정보 파기 위험은 해소
- Shotstack은 삭제된 자산도 기록을 `deleted` 상태로 남긴다. 목록에 보인다≠남아 있다

### 베타 쿠폰 등록
- `betaCoupons` 컬렉션, 문서 ID가 전화번호 11자리(하이픈 없음), 필드는 `used`(boolean) / `memo` / `eventId`
- 신규 쿠폰 1건 등록 완료(번호는 Firestore `betaCoupons` 참조). 실제 사용 검증은 안 했다

## 3. 롤백된 작업 — ③ 유료 개시 전 필수 2건

### 커밋 이력
- `3615b9b` feat(payment): 유료 이벤트 결제 전 마감 + 클립 0개 차단 + 마감 되돌리기
- `5ff0661` Revert — 현재 `origin/main` HEAD
- **`3615b9b`은 브랜치 `claude/toss-live-key-migration-scout-jlyokd`에 남아 있다.** 되살릴 때 참조

### 구현했던 것 (되살릴 가치 있음)
1. 마감 모달에 업로드 수·포함 수 표시, 포함 0개면 마감 버튼 비활성
2. 유료도 close API 호출 후 결제 페이지로 이동
3. 결제 버튼 활성 조건에 `clipCount > 0` 추가
4. `/api/events/[eventId]/reopen` 신설 — `uploadToken`으로 `sessionToken` 복구
5. host 이벤트 GET 응답에 `renderId` 추가

eye 검증은 전부 통과했다(사양 4건 충족, build 32/32 + 라우트 43개, lint delta 0). **코드 품질 문제가 아니라 설계 전제가 틀렸다.**

### 실패 원인
`api/payment/prepare/route.ts:41-50`이 결제 모드를 이렇게 가른다.
- `status === "open" && unlocked !== true` → `first`
- `(status === "closed" || "done") && unlocked === true` → `rerender`
- 그 외 → 400 `INVALID_EVENT_STATE`

"결제 전 마감"은 `closed` + `unlocked: false`라 어디에도 안 맞아 400으로 떨어진다. 최초 결제 분기가 `status === "open"`을 요구하는데 마감을 앞당겨 스스로를 막았다.

부수 증상: `dashboard/events/[eventId]/page.tsx:1138`의 "영상 생성 다시 시작" 버튼이 `status === "closed" && clips.length > 0`만 보므로 결제 전에도 노출됐다. 다만 `render/start:50-54`가 `plan === "paid" && !unlocked`이면 403이라 실제 무료 렌더는 막힌다(정적 코드 확인, 브라우저 재현 안 함).

## 4. ★ 신규 발견 — 재과금 위험 (이번 변경과 무관, 기존 버그)

**`closed` + `unlocked: true` + `renderId` 없음** 상태에서 재결제 화면으로 가면 최초 결제액의 80%가 재청구될 수 있다.

- 이 상태가 만들어지는 경로 둘
  - `payment/success/page.tsx:114-126, 167-176` — 결제 확인 후 `/api/render/start` 자동 호출이 실패하면 "[영상 생성 다시 시작] 버튼으로 다시 시도" 안내
  - `api/cron/check-rendering/route.ts:161` — 렌더 실패 시 `closed`로 되돌림(`renderId`는 안 지움)
- `prepare:44`가 이를 "done 이후 재렌더"와 구분하지 못해 `mode: "rerender"` → `calcRerenderPrice`(80%) 청구
- 코드로 여기까지 확인했고, **실제 재과금 화면 도달은 브라우저 재현을 안 해서 판정 불가**
- **라이브 키 교체 전에 반드시 닫아야 한다.** 필수 항목이 2건에서 3건이 됐다

## 5. `closed`의 의미 중첩 (다음 사이클의 설계 과제)

`status: "closed"`를 읽는 곳 10곳. 현재 이 값이 겸하는 상태가 최소 셋이다.

| 상태 | unlocked | renderId | 비고 |
|---|---|---|---|
| 결제 후 렌더 실패 | true | 있음 | 재과금 위험 지점 |
| 렌더 완료 후 | true | 있음 | 원래 뜻 |
| 결제 전 마감 | false | 없음 | 롤백으로 현재는 없음 |

결제 여부를 events 문서만으로 판정할 수 있는 필드는 `unlocked` 하나다. 단 `api/events/route.ts:149`가 **베타 쿠폰 생성 시에도 `unlocked: true`**로 만들므로 결제와 동의어가 아니다. `renderId`는 free 플랜도 생기므로 결제 지표가 아니다.

다음 사이클의 결정 포인트: 새 status 값을 만들지, `unlocked`·`renderId` 조합으로 판정할지.

## 6. 문서에 다시 넣어야 할 것

revert로 함께 사라졌다. 코드와 같은 커밋이었으니 정상 동작이다.

- CHANGELOG 7줄, `decisions/market-product.md` 19줄, `known-issues.md` 10줄
- 되살릴 때 `3615b9b`의 diff 참조

별도로 아직 안 고친 기록 오류 2건
- **lint baseline이 11이 아니라 12다.** `known-issues.md:479`. 별도 worktree로 HEAD를 직접 린트해 확인했다
- `DECISIONS.md` 인덱스가 `market-product`를 19개로 적고 있으나 실제 `##` 항목은 20개

## 7. known-issues 등재 후보 (미등재)

- `shotstack.ts:379-404` 삭제 함수의 실패 경로 3개가 전부 조용하다. 목록 조회 실패·빈 목록은 로그조차 없고, DELETE는 `res.ok`를 안 본다. 현재 작동은 확인됐으나 실패해도 알 방법이 없다
- `api/render/start/route.ts:106`이 presigned URL 앞 80자를 콘솔에 남긴다. 같은 기능의 `shotstack.ts:346-347` 주석은 "서명 URL은 절대 기록하지 않는다"고 명시해 서로 어긋난다
- `vercel.json:3`의 `check-render-deadlines`는 알림·환불만 하고 `status`를 바꾸지 않는다. S3 도착 실패로 `rendering`에 고착된 이벤트를 탈출시키는 코드가 어느 cron에도 없다

## 8. 남은 일

| 순서 | 항목 | 상태 |
|---|---|---|
| ② | 라이브 키 교체 정찰 | **완료** |
| ③-1 | 클립 0개 결제 후 렌더 실패 | 롤백. `closed` 의미 분리 설계 후 재시도 |
| ③-2 | 409 재발행 경로 | ③-1에 종속 |
| ③-3 | **재과금 위험** (4장) | 신규. 미착수 |
| ④ | 라이브 키 교체 | ③ 전부 뒤 |

라이브 키 교체 시 주의: `NEXT_PUBLIC_TOSS_CLIENT_KEY`는 빌드 시 코드에 박히므로 **Vercel에서 값만 바꾸면 반영되지 않는다. 재배포가 필요하다.**

## 9. 이번 세션 결정 (Ray)

- 클립 0개 유료 이벤트는 마감 시점에 감지해 결제 전에 차단. "그래도 진행" 우회 없음
- 마감 확인 화면에 업로드 수와 선택 수를 표시하고 확인해야 결제로 진행
- 마감 이후 업로드는 무조건 제외. 마감은 주최자가 영상을 확인하고 전부 포함하겠다고 선언하는 행위이며 그 시점에 책임이 넘어간다
- 되돌리기는 `uploadToken` 복사로 원본 토큰 복구. 새 토큰 발급 안 함
- 사양 밖 변경 2건 승인: host GET에 `renderId` 추가, 마감 모달 유료 안내 문구 변경
- 버그 발견 후 즉시 롤백. 수정보다 롤백을 택한 이유는 고칠 범위가 `closed` 읽는 10곳 전체라서

## 10. 학습·패턴

- **상태값을 새 시점에 쓰기 전에 그 값을 읽는 쪽을 전수로 훑어야 한다.** 이번에 정찰을 세 번 돌렸는데 전부 "쓰는 쪽"만 봤다. `closed`를 읽는 10곳을 봤다면 `prepare:41-50`을 설계 단계에서 발견했다.
- 벤더의 계정 데이터 진술은 대시보드로 대조하고 받는다. 조항 해석은 쓸 만했지만 숫자와 보관 상태는 둘 다 틀렸다.
- 벤더 진술을 고정점으로 두고 우리 코드에서 모순의 원인을 찾으려 하면 오판한다. 코드에 조용한 실패 경로가 실제로 있어 이야기가 맞아떨어져 보였다.
- 문서의 baseline 수치는 낡을 수 있다. 검증 게이트 delta를 재기 전에 별도 worktree로 HEAD를 직접 재는 것이 확실하다.
- known-issues의 L 번호는 랜딩 트랙 전용이다. 본 앱 이슈는 번호 없이 `##` 제목 + 현황/영향/처리/출처 형식이다.
- eye 통과가 설계 정합성을 보장하지 않는다. eye는 사양 대조만 하므로 사양 자체가 틀리면 통과한다.

## 11. 미확인

- 마감했다가 롤백한 테스트 이벤트(`mg3fNMxKINplMzjPPH9A`)가 `closed`로 남아 있는지 — Ray 확인 필요. 남아 있으면 Firestore에서 `status`를 `open`으로, `sessionToken`에 `uploadToken` 값을 복사해 수동 복구
- 신규 베타 쿠폰 실제 사용 가능 여부 — 등록만 하고 써보지 않았다
- 알림 계열(`src/lib/notifications/scenarios/*`)이 `closed`를 간접 참조하는지 — 리터럴 검색에 안 걸렸으나 개별 파일은 안 열어봤다
- 5/29~6/2 구간 Shotstack 렌더 잔존 여부 — 필드 전환 고아 구간. 확인 안 함
