# 2026-09-21 저녁 핸드오프 — 결제 가드 원복 + 409 재결제 경로 + 결제 전 마감 미복원 결정

> 직전 핸드오프: `2026-09-21-handoff-rotation-kakao-share.md`
> 다음 세션 첨부: 이 문서

## 1. 요약

라이브 전환(④) 전 관문인 ③-1·③-2를 처리했다. 클립 0개 결제를 `prepare`에서 차단하고(가드
원복), 결제·렌더 실패 로그를 3곳 추가했으며, 409 `CLIP_COUNT_CHANGED` 화면에서 결제
페이지로 바로 갈 수 있게 했다. 결제 전 마감(`3615b9b`)은 되살리지 않기로 결정했다.
probe 경로는 "버그 의심"에서 "스펙 불일치, 현재 동작함"으로 판정을 바꿨다. 테스트 키로
409 → 재결제 → 렌더 → 편집 완료까지 종단 검증했다.

## 2. 커밋

전부 `main`, push 완료. (오전 핸드오프 커밋 `33b2348`은 제외)

| 커밋 | 내용 |
|---|---|
| `8e5eb2f` | docs: probe baseUrl 판정 반영 — 스펙 불일치·현재 동작함, makeMediaClip 작업과 묶음 |
| `987e5d5` | fix(payment): restore NO_CLIPS guard in prepare, remove unreachable zero-clip banner |
| `6c3da92` | docs: CC 보고를 코드 블록 하나에 담는 형식 규칙 추가 |
| `e523b29` | fix(logging): log Toss confirm rejections and render start failures |
| `9dd3a04` | fix(payment): include eventId in CLIP_COUNT_CHANGED and link straight to repayment |
| `dd976a0` | docs: 2026-09-21 저녁 사이클 기록 — 클립 0개 가드·로그·409 재결제, 결제 전 마감 미복원 결정 |

- `8e5eb2f` — known-issues의 probe 항목을 판정 결과로 갱신하고, 경로 수정을 `makeMediaClip`
  transcode 작업과 묶기로 한 결정을 `decisions/rendering.md` 2026-09-21 항목에 추가했다
- `987e5d5` — `payment/prepare`에 클립 0개 가드를 되돌리고(`src/app/api/payment/prepare/route.ts:56-58`),
  도달 불가가 된 결제 페이지의 클립 0개 경고 배너를 삭제했다
- `6c3da92` — CC 보고를 백틱 4개 코드 블록 하나에 담는 규칙을 CLAUDE.md 「응답 스타일」에 넣었다
- `e523b29` — `confirm`의 토스 거절 분기, `render/start`의 `createRender` catch, 대시보드
  재렌더 버튼 catch 세 곳에 `console.error`를 넣었다. 동작 변경 없음
- `9dd3a04` — 409 응답 본문에 `eventId`를 추가하고(`confirm/route.ts:73`) 409 화면에
  [새 금액으로 결제하기] 버튼을 넣었다
- `dd976a0` — 위 작업의 문서 기록. known-issues 해소 3건 이동 + 신규 4건 등재,
  `decisions/market-product.md` 2건, CHANGELOG, DECISIONS 인덱스

## 3. 확정된 사실

- **probe 경로**: production `probeBaseUrl`은 `https://api.shotstack.io/v1`이다
  (`src/lib/shotstack.ts:23-26`). 공식 스펙은 `https://api.shotstack.io/edit/{version}`이고
  같은 파일의 렌더용 `baseUrl`(`:18-21`)에는 `/edit/`가 들어 있다. Vercel Logs
  2026-09-07~09-21 구간을 검색어 없이 Console Level Error로 보면 **0건**이고, 같은 기간
  production 렌더가 있었다. probe는 렌더마다 BGM으로 최소 1회 호출되고 HTTP non-OK는
  `console.error`를 남기므로(`shotstack.ts:48`), **레거시 경로가 현재 응답 중**이다
- **2026-09-21 10:49 KST의 400**은 테스트 결제 승인 후 `render/start`가 반환한
  `NO_CLIPS`였다(`src/app/api/render/start/route.ts:65`). 근거는 Vercel 로그의 Path
  (`/api/render/start`)와 실화면("결제는 완료됐습니다 / 다만 영상 생성 시작에는
  실패했습니다"). Ray의 필드샷 비교용 테스트 중 발생했다
- **`/payment/success`는 토스 `successUrl`로만 열린다.** 우리 코드에 이 경로로 보내는
  링크·`router.push`가 없다(`payment/[eventId]/page.tsx:139`가 유일한 참조).
  "이미 처리된 결제입니다"는 뒤로가기·새로고침으로 `confirm`이 재호출돼
  `ORDER_NOT_PENDING`(`confirm/route.ts:38`)을 받은 것이다. `ORDER_NOT_PENDING` 가드가
  토스 승인 호출(`:90`)보다 앞이라 **결제 중복은 없다**
- **`3615b9b`의 원래 이유**는 "마감은 주최자가 업로드된 영상을 확인하고 전부 포함하겠다고
  선언하는 행위이며, 그 시점에 책임이 주최자에게 넘어간다"였다(2026-09-18 결정 1).
  409 방지는 그 아래 **함의**로 적혀 있었다. revert로 문서가 사라졌고 원문은
  `git show 3615b9b -- docs/decisions/market-product.md`에 있다
- **`confirm`은 토스 응답의 결제 `status` 값을 검사하지 않는다.** `tossRes.ok`(HTTP 2xx)만
  보고 바로 주문을 `paid`로 쓴다(`confirm/route.ts:109`, `:121`). 결제 수단별 분기 코드도
  없다 — `method`·`virtualAccount`·`transfer` 검색 결과 0건
- **토스 위젯 결제 수단(테스트 키 화면 실측)**: 퀵계좌이체, 신용·체크카드, 토스페이,
  PAYCO, 카카오페이, 네이버페이. **가상계좌 없음**
- **카드사 미선택 상태로 결제 버튼**을 누르면 일반 문구 alert가 뜬다
  (`payment/[eventId]/page.tsx:143`). 닫으면 버튼은 다시 눌린다. 같은 catch의 `:142`에
  `console.error("[payment] requestPayment failed:", err)`가 이미 있다
- **실화면 검증**: 클립 0개 유료 이벤트에서 [마감하기] → "업로드된 영상이 없어 결제할 수
  없습니다." 표시, 결제 위젯 미노출. 409 경로는 결제 → 409 화면 → [새 금액으로 결제하기] →
  새 개수 기준 결제 페이지 → 결제 승인 → 렌더 시작 → 편집 완료까지 종단 확인
- **lint 기준선**: 12 errors + 3 warnings. 오늘 커밋 전부 delta 0

## 4. 기각된 가설 (다시 밟지 말 것)

- **"10:49의 400은 `confirm`의 토스 승인 거절이다"** — CC 정찰이 "가장 유력한 후보 1"로
  지목했으나 틀렸다. Vercel 로그의 Path가 `/api/render/start`였다. CC가
  `[Shotstack] env=production` 로그 한 줄을 "다른 요청의 콜드 스타트"로 가정하고 넘긴 것이
  발단이다
- **"10:49의 400은 결제가 끝나지 않아 가드가 막은 정상 동작이다"** — 채팅 클로드의 추정.
  결제는 승인됐다. Ray의 기억("결제를 끝까지 못함")보다 로그와 실화면이 맞았다
- **"`3615b9b`의 목적은 409 방지"** — 문서상 목적은 책임 전가 시점 정책이었다
- **"probe가 조용히 404를 받고 있다"** — 2주 구간 Console Level Error 0건으로 기각

## 5. 이번 세션 결정 (Ray)

- 클립 0개 결제는 `prepare`에서 차단한다. `decisions/market-product.md`의 2026-08-24
  "클립 0개 결제 허용"은 폐기 표시했다(토스 심사 트랙 종료로 전제 소멸)
- 결제 전 마감(`3615b9b`)은 되살리지 않는다(B안). 상세·감수한 위험·재검토 트리거는
  `docs/decisions/market-product.md` 2026-09-21 항목
- probe 경로 수정은 `makeMediaClip` transcode 작업과 묶어 production 검증 렌더 1회를
  공유한다
- 퀵계좌이체 등 실결제 테스트는 ⑤에서 한 번에 한다
- 결제 성공 페이지의 `router.push` → `replace`는 보류한다(known-issues 등재)

## 6. 남은 일

| 항목 | 상태 |
|---|---|
| ③-1 결제 전 마감 + 클립 0개 차단 | **클립 0개 차단 완료**(`987e5d5`). 결제 전 마감은 **미복원 결정** — 재개 아님 |
| ③-2 409 재발행 경로 | **완료** (`9dd3a04`) |
| ④ 라이브 키 교체 | **다음 차례.** 전제는 직전 핸드오프에서 이어짐 — 환불 수동 처리 확인, S3 고착 known-issue 검토. `NEXT_PUBLIC_TOSS_CLIENT_KEY`는 빌드 시 코드에 박히므로 Vercel 값 변경 후 재배포 필요 |
| ⑤ 실결제 검증 | ④ **직후 바로**. 라이브 키로 고객이 계좌이체를 쓸 수 있는 틈을 줄이기 위함. 체크리스트는 아래 |
| 재렌더 결제 서버 강제 (B안) | **변동 없음.** 보류 |
| `makeMediaClip` transcode + probe 경로 수정 | 묶음 1건. production 검증 렌더 1회 공유 |
| known-issues 신규 4건 (`dd976a0`) | 전부 등재만 |

**⑤ 실결제 검증 체크리스트**

- 카드 결제 성공
- 퀵계좌이체 성공 / 중간 취소 / 실패
- 결제 수단 목록에 **가상계좌가 없는지** — `confirm`이 결제 `status`를 보지 않으므로
  (3장), 가상계좌가 켜지면 입금 전에 `paid`로 처리될 위험이 있다
- 결제 실패 시 Vercel 로그에 `[payment/confirm] toss confirm non-OK`가 찍히는지
  (`e523b29`로 추가한 로그, `confirm/route.ts:110`)
- 환불 처리 절차

**오전 핸드오프(`2026-09-21-handoff-rotation-kakao-share.md`) 6장 남은 일 대조**

| 항목 | 상태 |
|---|---|
| #1 회전 원인 H1/H2 가르기 | 변동 없음 |
| #2 probe baseUrl `/edit/` 누락 의심 | **해소 — 판정 완료**(`8e5eb2f`). 버그가 아니라 스펙 불일치이며 현재 동작 중 |
| #3 `makeMediaClip`에 transcode 미적용 | probe 경로 수정과 **묶음**으로 변경 |
| #4 Preview 환경에 `SHOTSTACK_API_KEY` 없음 | 변동 없음 |
| #5 `NEXT_PUBLIC_APP_URL` 빈 문자열일 때 공유 `imageUrl` 상대 경로 | 변동 없음 |
| #6 카카오 SDK 버전 미고정·integrity 없음 | 변동 없음 |
| #7 cleanup의 S3 삭제 실패 처리·썸네일 미삭제 | 변동 없음 |
| #8 갤럭시 HDR(HLG) 클립 색 표현 미확인 | 변동 없음 |
| #9 `/api/og-image/<id>` 실동작·302 처리 미확인 | 변동 없음 |

## 7. 미확인

- 테스트 이벤트 완성본이 운영 S3에 남아 있다. 오늘 테스트 렌더 1건이 추가됐다.
  cleanup의 완성본 7일 시계(`videos[].doneAt` + 7일) 대상이다
- 오전 핸드오프 7장의 미확인 항목 — 변동 없음
- 훅이 커밋·push를 요구하는 설정(`~/.claude/stop-hook-git-check.sh`)의 실제 내용 —
  **본 적 없음**. 훅 출력 문구만 관측했다
- CC가 `claude/toss-live-key-migration-scout-jlyokd`를 "지정 개발 브랜치"로 인식한 이유 —
  미확인. 이번 세션의 모든 작업은 `main`에서 했다
- `docs/DECISIONS.md` 인덱스 드리프트 2건: legal 11 vs 13, landing 21 vs 23. 두 파일은
  `## 날짜 — … 결정 N건` 형식이라 헤더 1개가 결정 여러 건을 담아 세는 축이 다를 가능성이
  있다. 손대지 않았다

## 8. 학습·패턴

- **로그는 Path 필드부터 본다.** 기억 속 증상과 로그가 어긋나면 로그가 우선이다. 이번
  10:49 400 건에서 채팅 클로드와 CC가 각각 한 번씩 틀렸다
- **코드의 효과로 의도를 추정하지 말고 결정 기록을 먼저 찾는다.** `3615b9b`의 목적을
  "409 방지"로 읽었으나 문서상 목적은 책임 전가 시점 정책이었다
- **revert는 같은 커밋의 문서(결정·known-issue)까지 지운다.** 필요하면
  `git show <해시> -- <파일>`로 복원한다. `3615b9b`의 결정 3건과 known-issue 1건이
  그렇게 사라져 있었다
- **"로그 0건"이 의미를 가지려면 먼저 코드로 두 가지를 확인한다** — 호출은 되는가,
  실패 시 로그를 남기는가. probe 판정이 이 순서로 성립했다
- **프롬프트 배경에 핵심 사실(요청 경로)을 빠뜨리면 CC가 틀린 후보를 유력하게 본다.**
  10:49 건에서 Path 정보 없이 "400을 받았다"만 주어져 CC가 `confirm` 쪽을 1순위로 꼽았다
- **요약된 diff를 원문처럼 보고하는 사례가 관측됐다.** 이후 프롬프트에
  "요약·생략·헤더 편집 금지"를 명시했다
- **지시와 코드가 다르면 사실을 따르고 보고하는 게 옳다.** 결제 요청 팝업 항목을
  "로그 없음"으로 등재하라는 지시였으나 해당 catch에 `console.error`가 이미 있어
  항목의 축을 "팝업이 거절 사유를 가린다"로 바꾸고 그 사실을 본문에 적었다

## 9. 운영 메모

- **작업 브랜치는 `main`.** `claude/toss-live-key-migration-scout-jlyokd`는 `3615b9b`
  보관용이다 — 이동·커밋 금지
- **훅이 커밋·push를 요구한다.** 프롬프트가 커밋에 대해 침묵하면 CC가 검토 전에 커밋한다
  (`6c3da92` 사례). 모든 CC 프롬프트 첫 줄에 "커밋 허용/금지"를 명시한다. Ray가 CC에
  직접 지시할 때도 "커밋은 하지 마" 한 줄을 붙인다
- **미커밋 상태의 확인 작업에서 `git stash` 금지.** 명령 체인이 꼬여 stash 없이 pop만
  실행된 사례가 1건 있었다(작업트리는 무사)
- **CC 보고는 백틱 4개 코드 블록 하나에 담는다** (CLAUDE.md 「응답 스타일」, `6c3da92`)
- **"코난" = 채팅 클로드.** 문서 생성·갱신 결정 소관이다 (CLAUDE.md:157)
