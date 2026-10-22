# 렌더 멈춤 비상 복구 절차서

> 근거: 2026-10-16, 앱 `d63da17`(렌더링 엔진 교체) + 엔진 `rhcho94/congre-engine` `44ceabe`. 이전판(Shotstack 기준)은 git 기록 `d63da17` 이전 판에 있다.
> **검증됨(코드)** = 코드로 동작 확인, **검증됨(실측)** = 실제로 해 봄, **미검증** = 해 본 적 없음.

## 1. 언제 쓰나

- 이벤트가 `status: "rendering"`에 오래 머문다.
- 신호: 예상 완료 시각 `expectedCompletedAt`(렌더 시작 + `renderEstimateMin`분, 최소 15분)이 지났고, 지연 알림이 발송됨(`notifications.renderDelayedNotifiedAt`이 찍힘).
- 지연 알림은 `cron/check-render-deadlines`가 보낸다. 이 cron은 시계 5분 단위 정각(:00, :05 …)마다 돌고, 알림과 `refundStatus`만 쓰고 `status`는 바꾸지 않는다.

## 2. 렌더가 끝나는 흐름

1. `render/start`: 엔진 시작 직전에 트랜잭션으로 `status: "rendering"`만 먼저 써 둔다(선점, `render/start:205-216`). 이미 `rendering`이면 409 `RENDER_IN_PROGRESS`. 작업 이름 `jobId = {eventId}-{시작 시각 밀리초}`로 엔진 작업 지휘(AWS Step Functions `congre-engine-render-job`, 서울 ap-northeast-2)를 시작한다(StartExecution). 성공하면 이벤트 문서에 `status: "rendering"`, `renderId`(= jobId), `renderExecutionArn`, `renderOutKey`(= `renders/{jobId}.mp4`), `bgmKey`, `renderStartedAt`, `renderEstimateMin`, `expectedCompletedAt`, `refundStatus: "none"`, `deadlineAt`을 쓰고, 알림 기록 `notifications.renderStartedNotifiedAt`·`renderCompletedNotifiedAt`·`renderDelayedNotifiedAt`을 `null`로 비우며 `renderSkipped`는 지운다(`:248-263`).
2. 엔진: 조각(인트로·하객 클립·아웃트로·글자 카드)마다 Lambda가 따로 굽고(`engine-jobs/{jobId}/seg/`, 하루 뒤 자동 삭제), merge Lambda가 이어 붙여 배경음악을 얹고 `renders/{jobId}.mp4`에 쓴다.
   - 하객 클립 하나가 실패하면 그 클립만 빼고 계속한다(`skipped`). 인트로·아웃트로·글자 카드가 실패하면 전체 실패.
   - 실행 전체 한도 1시간(넘으면 TIMED_OUT).
3. `cron/check-rendering`(시계 5분 단위 정각마다. 실행이 끝나도 다음 정각까지 최대 5분 걸린다): `status == "rendering"`인 이벤트마다 `renderExecutionArn`으로 실행 상태를 묻는다(DescribeExecution).
   - RUNNING → 다음 회차.
   - SUCCEEDED → `renderOutKey` 파일을 HeadObject로 확인. 있으면 `status: "done"`, `videoS3Key`, `renderDoneAt`, `videos[]`, 빠진 클립이 있으면 `renderSkipped` → 호스트·참가자 알림. 파일이 없으면(404) 다음 회차.
   - FAILED · TIMED_OUT · ABORTED → `status: "closed"` → 실패 알림 3통: 호스트 메일(제목 `[Congre] '{제목}' 영상 편집 실패 안내`), 호스트 문자(`[Congre] '{제목}' 편집 실패. 대시보드를 확인해 주세요.`), 운영자 문자(`[Congre 운영] 렌더 실패 '{제목}' eventId=…`, `CONGRE_INTERNAL_PHONE`이 있을 때). 호스트 메일·전화가 둘 다 있어야 보내고, 하나라도 없으면 운영자 문자도 안 나간다(`check-rendering:176`, `render-failed.ts`). Vercel 로그 `errorCode=`는 엔진이 code를 줬을 때만 남는다(`:170`).
   - `renderExecutionArn`이 없는 이벤트(엔진 교체 전 Shotstack 렌더)는 건너뛴다(로그 `pre-engine event`).
- 실측: 2026-10-16 무료 시험 행사(클립 5개) 시작 08:20 → 완성 문자 08:25. 검증됨(실측).
- 리허설: 2026-10-21 무료 시험 행사(클립 1개) 14:09 시작 → 곧바로 Step Functions **실행 중지** → 14:10 cron 회차에 `closed` + 호스트 문자·운영자 문자 수신(호스트 메일은 발송 호출만 확인) → 대시보드 다시 시작 → 결제 화면 없이 완성. 검증됨(실측).

## 3. 확인 순서

1. **Firestore** `events/{eventId}`: `status`, `renderId`, `renderExecutionArn`, `renderOutKey`, `renderStartedAt`.
2. **AWS 콘솔**(오른쪽 위 리전 = 서울) → Step Functions → 상태 머신 `congre-engine-render-job` → 실행 목록에서 **이름 = renderId**인 실행.
   - 상태: 실행 중 / 성공 / 실패 / 시간 초과 / 중단.
   - 실패면 실행 화면의 그래프에서 빨간 단계를 누르고 오류·원인을 본다. merge 단계 출력의 `code`가 원인이다(아래 표 아래 목록).
3. **S3** `congre-videos-kr` → `renders/{renderId}.mp4`: 있는지, **크기가 0보다 큰지**(check-rendering은 존재만 본다).
4. **Vercel → Logs**: `[render/start]`, `[cron/check-rendering]` 검색.
   - 요청 한 줄을 누르면 오른쪽 패널 **External APIs**에 그 회차가 부른 외부 서비스가 나온다: `states.ap-northeast-2…`(실행 상태 조회), `api.resend.com`(메일), `api.solapi.com`(문자). 알림이 실제로 나갔는지 여기서 본다.
5. 실패 이유는 이벤트 문서에 남지 않는다. Step Functions 실행 화면(2번)과 Vercel 로그 `errorCode=`(4번)에서만 볼 수 있다.

## 4. 멈춤 지점과 조치

| # | 지점 | 이벤트 문서 상태 | 코드상 빠져나오는 길 | 조치 | 상태 |
|---|---|---|---|---|---|
| 1 | 실행은 성공인데 `renderOutKey` 파일이 없음 | `rendering` | 없음. 5분마다 무한 재시도 | 실행 출력(merge 결과)의 `out_key` 확인. 다른 키에 있으면 그 파일을 `renderOutKey` 위치로 복사 → 다음 cron | 미검증 |
| 2 | 실행 상태 조회가 예외(권한·리전·ARN) | `rendering` | 재시도만, 한도 없음 | Vercel 로그 `getEngineRenderStatus failed` → IAM `congre-s3-user`의 `congre-engine-run` 정책, Vercel `AWS_REGION`(ap-northeast-2) 확인 | 미검증 |
| 3 | 실행이 계속 RUNNING | `rendering` | 1시간 뒤 TIMED_OUT → 다음 cron이 `closed` | 콘솔에서 멈춘 단계 확인. 필요하면 실행 화면 **실행 중지** → ABORTED → 다음 cron이 `closed` | 검증됨(실측, 2026-10-21 실행 중지) |
| 4 | `renderExecutionArn`이 없음 | `rendering` | 건너뜀(로그만) | 교체 전 Shotstack 렌더. 2026-10-15 22:47 교체 직전 확인 0건. 생기면 Firestore에서 `status`를 `closed`로 → 호스트가 다시 시작 | 검증됨(코드) |
| 5 | 실행 시작은 성공했는데 그 뒤 Firestore 저장이 재시도까지 실패 | `rendering`(선점만 됨. `renderId`·`renderExecutionArn` 없음) | 건너뜀(로그만. 호스트·운영자 알림 모두 없음) | 8장 | 검증됨(실측, 2026-10-21 손으로 만든 상황) |
| 6 | 실행 시작 자체가 실패 | 선점 뒤 이전 상태로 되돌림(`:238`). 되돌림이 실패하면 `rendering`에 남고 로그 `[render/start] revert after engine failure failed`(`:240`) | 화면 "영상 생성 시작에 실패" | Vercel 로그 `[render/start] failed` → AccessDenied(권한) · ARN 값 · 같은 이름 실행 중복 | 미검증 |
| 7 | 실행 실패 → `closed`로 되돌아감 | `closed`, `renderId` 남음 | 있음: 호스트가 다시 시작 가능 | 6장 | 검증됨(실측, 2026-10-21) |
| 8 | 연락처 없는 이벤트 | `rendering` | check-render-deadlines가 건너뜀(알림 없음). done 전환은 정상. 실패하면 `closed` 전환은 되지만 실패 알림(운영자 문자 포함)이 안 나감(`check-rendering:176`) | Firestore에서 `rendering` 이벤트를 직접 조회 | 검증됨(코드) |

**실패 원인 code (merge 결과)**
- `REQUIRED_SEGMENT_FAILED`: 인트로·아웃트로·글자 카드 실패. `detail`에 하위 원인 — `UNSUPPORTED_HDR_PQ`(PQ HDR 영상), `NO_TEXT`, `PROBE_FAILED` 등
- `NO_CLIPS_LEFT`: 하객 클립이 전부 실패
- `TOO_LONG`: 하객 클립 사용 시간 합 1,800초 초과(앱이 이벤트 생성·렌더 시작에서 먼저 막는다)
- `BGM_*`: 배경음악 파일 문제(삭제·손상·너무 짧음). `bgmKey`에 저장된 곡이 버킷에서 지워졌을 때도 여기
- merge Lambda 자체 예외는 MergeOk를 거치지 않고 실행이 실패한다 — 이때는 콘솔의 오류·원인 칸을 본다

## 5. 직접 복구 (지점 1)

- check-rendering은 **실행 상태가 SUCCEEDED일 때만** 파일을 본다. 실행이 실패했으면 파일을 올려도 done으로 가지 않는다(이미 `closed`).
- 파일을 옮기거나 올린 뒤 **크기를 반드시 확인한다.** 0바이트도 통과해 빈 영상이 완성본으로 나간다.

## 6. 실패(`closed`로 돌아감)일 때

- 호스트가 다시 시작할 수 있다(`render/start`는 `rendering`만 막는다 — `:43-46`, `:210-224`. `closed`에서는 다시 시작된다).
- 다시 시작 화면: 대시보드 **"영상 생성 다시 시작"** → 확인 창 **"다시 만들기"**(유료이면서 `unlocked`가 아닌 행사는 "결제하고 만들기" → 결제 화면). 무료 행사는 결제 화면 없이 시작된다 — 검증됨(실측 2026-10-21). 유료 행사는 미검증.
- 호스트는 이미 실패 문자·메일을 받았다(2장 3번). 대시보드에는 실패가 따로 표시되지 않고 "마감"으로만 보인다(2026-10-21 확인). 호스트가 "영상이 안 나와요"라고 물으면 이 장을 본다.
- 단, 유료 + `status: "closed"` + `refundStatus: "100"`이면 다시 렌더할 수 없다(403 `REFUND_LOCKED`).
- 환불을 실행하는 코드는 없다. `refundStatus`("50"/"100")와 알림만 남는다. 환불은 토스 콘솔에서 수동(docs/ops/runbook-refund-manual.md).
- 환불 시각: `refund50At` = 결제 + 4시간, `refund100At` = 결제 + 48시간.

## 7. Firestore 필드를 손으로 바꿀 때 주의

자동 정리(`cron/cleanup`, 매일 1회)가 아래 필드를 읽는다.

- `videos[]` (`{renderId, s3Key, doneAt}`): 완성본 7일 삭제 기준. `doneAt`이 없거나 형식이 다르면 지워지지 않는다.
- `renderDoneAt`: `videos[]`가 없는 옛 문서의 완성본 삭제 기준. 참가자 알림이 안 나간 완성 이벤트의 클립 48시간 삭제 기준이기도 하다.
- `notifications.participantNotifiedAt`: 클립 48시간 삭제 기준.
- `bgmKey`: 다시 만들 때 같은 곡을 재사용한다(분위기 폴더가 같을 때). **그 곡 파일을 버킷에서 지웠으면 이 필드를 지워야 다시 만들기가 성공한다**(코드 대비 없음, known-issues).
- 공유 페이지는 `status === "done"`이고 `videoS3Key`가 있어야 영상을 보여 준다.
- `status`를 손으로 `done`으로 바꾸면 check-rendering을 거치지 않으므로 `videos[]`·`renderDoneAt`·알림이 모두 빠진다. 권하지 않는다(미검증).

## 8. 엔진 시작 뒤 저장 실패 복구 (표 5번)

1. Vercel 로그에서 `[render/start] save after engine start failed`를 찾아 eventId·jobId를 적어 둔다.
2. Firestore `events/{eventId}`에서 `status`가 `rendering`이고 `renderId`가 없는지 본다. `renderId`가 있으면 이 절차가 아니다(4장 표로).
3. `status`를 `closed`로 바꾼다. **이전 값이 `done`이었어도 `closed`로 바꾼다.** `done`으로 두면 유료 행사는 재렌더 결제를 다시 요구한다. `closed` + `unlocked: true`면 결제 없이 다시 시작된다(대시보드 `isFreeRestart`). 무료 행사도 결제 없이 다시 시작된다.
4. 호스트에게 바로 연락한다: 행사 화면 "영상 생성 다시 시작" → "다시 만들기". 다시 시작하기 전까지 공유 페이지에 완성본이 안 보인다.
5. 고아 완성본: 첫 실행이 끝난 뒤(보통 수 분) S3 `renders/{jobId}.mp4`를 직접 삭제한다. cleanup은 이 파일을 지우지 않는다. 새 실행은 jobId가 달라 이름이 겹치지 않으니, 행사의 새 `renderOutKey`와 헷갈리지 않게 한다.
6. 환불: 멈춰 있는 동안 check-render-deadlines가 이 행사를 건너뛰었다. 다시 시작하면 결제 시각 기준 `refund50At`·`refund100At`으로 판정하므로, 이미 지났다면 다시 시작 직후 환불 알림이 나갈 수 있다(미검증).
- 검증 상태: 2·3단계와 다시 시작은 검증됨(실측 2026-10-21 — 무료 행사에서 `status`를 `rendering`으로 바꾸고 `renderId`·`renderExecutionArn`·`expectedCompletedAt`을 지워 만든 상황. cron 회차를 지나도 문자·메일 0건, `closed`로 바꾼 뒤 다시 시작 → 완성). 1단계 로그·5단계 고아 파일·6단계 환불 알림·유료 행사는 미검증(흉내로 만들 수 없음).
