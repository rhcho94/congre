# 렌더 멈춤 비상 복구 절차서

> 근거: 2026-10-08 정찰 9 D1~D5(HEAD `694cf88`). 줄 번호는 같은 날 C21·C22 반영 뒤 코드로 다시 대조했다. 코드로 확인한 것만 적었다. 모르는 곳은 "모른다"로 남겼다.
> 각 조치의 **검증됨** = 코드로 동작을 확인함, **미검증** = 실제로 해 본 적 없음 또는 외부 조건에 달림.

## 1. 언제 쓰나

- 이벤트가 `status: "rendering"`에 오래 머문다.
- 신호: 예상 완료 시각 `expectedCompletedAt`(렌더 시작 + `renderEstimateMin`분, 최소 15분)이 지났고, 지연 알림이 발송됨(`notifications.renderDelayedNotifiedAt`이 찍힘).
- 지연 알림은 `cron/check-render-deadlines`가 5분마다 보낸다. 이 cron은 알림과 `refundStatus`만 쓰고 `status`는 바꾸지 않는다. 시간이 지나도 저절로 실패 처리되지 않는다.

## 2. 렌더가 끝나는 흐름 (참고)

1. `render/start`: Shotstack 렌더 생성 성공 뒤 이벤트 문서에 `status: "rendering"`, `renderId`, `renderStartedAt`, `renderEstimateMin`, `expectedCompletedAt`, `refundStatus: "none"`을 쓴다(`render/start/route.ts:206-217`).
2. `cron/check-rendering`(5분마다): `status == "rendering"`인 이벤트마다
   - Shotstack 상태 API `GET /edit/v1/render/{renderId}`를 부른다(`check-rendering:53`, `shotstack.ts:406-424`).
   - Shotstack이 `done` + `url`을 돌려주면(`:61`) S3 버킷 루트의 `{renderId}.mp4`를 `HeadObject`로 확인한다(`:62-65`).
   - 파일이 있으면 `status: "done"`, `videoS3Key`, `renderDoneAt`, `videos[]`에 `{renderId, s3Key, doneAt}` 추가(`:101-108`) → 호스트·참가자 알림.
   - Shotstack이 `failed`면 `status: "closed"`만 쓴다(`:161`) → 실패 알림.
   - 그 밖의 상태(queued 등)는 다음 실행까지 기다린다.

## 3. 확인 순서

1. **Firestore 이벤트 문서** (`events/{eventId}`): `status`, `renderId`, `renderStartedAt`, `expectedCompletedAt`.
   - `renderId`가 없으면 → 아래 표 5번.
2. **Shotstack 대시보드**에서 그 `renderId`의 상태: queued / rendering / done / failed, 그리고 결과 URL이 있는지.
3. **S3 버킷 루트**의 `{renderId}.mp4`: 있는지, **크기가 0보다 큰지**.
   - check-rendering은 존재만 보고 크기는 보지 않는다. 0바이트 파일도 done으로 넘어간다.

## 4. 멈춤 지점과 조치

| # | 지점 | 이벤트 문서에 남는 상태 | 코드상 빠져나오는 길 | 조치 | 상태 |
|---|---|---|---|---|---|
| 1 | Shotstack은 done인데 S3에 `{renderId}.mp4`가 없음(복사 실패·0바이트 등) | `rendering`, `renderId` 있음, `videoS3Key` 없음 | 없음. 5분마다 무한 재시도 | 5장 "S3에 직접 올려 복구" | 미검증 |
| 2 | Shotstack 상태 조회가 예외(키·네트워크·비정상 응답) | `rendering` | 다음 실행 재시도만, 한도 없음 | Vercel 로그에서 `[cron/check-rendering] getRenderStatus failed` 확인 → 원인(키·Shotstack 장애) 해소 후 다음 cron 대기 | 미검증 |
| 3 | Shotstack이 done인데 `url`이 비어 있음 | `rendering` | 없음(어느 분기에도 안 걸림) | 모른다. Shotstack 쪽 결과를 먼저 확인 | 미검증 |
| 4 | Shotstack이 queued/rendering에 계속 머묾 | `rendering` | 시간 한도 없음, 알림만 | Shotstack 대시보드·지원 문의. 실패로 끝나면 6장 | 미검증 |
| 5 | 이벤트에 `renderId`가 없음 | `rendering`, `renderId` 없음 | 없음(건너뛰는 로그만) | 모른다. 어느 렌더인지 Shotstack 대시보드에서 찾아야 함 | 미검증 |
| 6 | 렌더 생성은 성공했는데 그 뒤 Firestore 갱신(`render/start:206-217`) 실패 | 이전 상태 그대로, `renderId` 기록 안 됨. Shotstack에는 렌더가 생김 | 없음 | 호스트가 다시 렌더 시작(크레딧 추가 소모). 고아 렌더는 Shotstack에 남음 | 미검증 |
| 7 | Shotstack failed → `closed`로 되돌아감 | `closed`, `renderId` 남음, `refundStatus`는 그대로 | 있음: 호스트가 다시 편집·렌더 가능 | 6장 | 검증됨(코드) |
| 8 | 연락처 없는 이벤트 | `rendering` | check-render-deadlines가 통째로 건너뜀(알림 없음). done 전환은 정상 | 지연을 알림으로 알 수 없으니 Firestore에서 `rendering` 이벤트를 직접 조회 | 검증됨(코드) |

## 5. S3에 직접 올려 복구하는 길 (지점 1)

Shotstack 대시보드에서 완성본을 받아 S3 버킷 루트에 `{renderId}.mp4`로 올리면, 다음 check-rendering이 done으로 넘길 수 **있다**. 아래 네 조건이 모두 맞아야 한다.

1. 이벤트 `status == "rendering"` (`check-rendering:37`)
2. 이벤트 문서에 `renderId`가 있음 (`:46`)
3. **Shotstack 상태 API가 그 renderId에 대해 `status: "done"`과 `url`을 계속 돌려줌** (`:61`). S3 파일만으로는 안 된다. Shotstack이 `failed`를 돌려주면 `closed`로 간다.
   - **미검증**: Shotstack이 렌더 기록을 얼마나 오래 보존하는지 모른다. 기록이 사라지면 이 길은 막힌다.
4. 키가 정확히 버킷 루트의 `{renderId}.mp4` (접두사 없음) (`:62`)

- 올린 뒤 **파일 크기를 반드시 확인한다.** 0바이트도 통과해 빈 영상이 완성본으로 나간다.
- 원래 판정: 2026-10-01 핸드오프 §4는 "S3 파일 존재만 본다"고 적었으나, 코드는 조건 3을 먼저 본다. 정찰 9 D4 판정 = 조건부 맞음.
- Shotstack 결과 URL의 임시 보관: S3 destination만 쓰고 Shotstack 호스팅을 끄면 24시간만 보관된다(Shotstack 공식 문서). 지금 코드에는 Shotstack 호스팅을 끄는 설정(`exclude`)이 없다(`shotstack.ts:334-342`). 그래서 Shotstack 호스팅 사본도 생긴다. 그 사본의 보존 기간은 모른다.

## 6. 실패(`closed`로 돌아감)일 때

- 호스트가 다시 편집·렌더할 수 있다(`render/start`에 status 가드 없음).
- 단, 유료 + `status: "closed"` + `refundStatus: "100"`이면 다시 렌더할 수 없다(403 `REFUND_LOCKED`, `render/start:57-60`).
- 환불을 실행하는 코드는 없다. `refundStatus`("50"/"100")와 알림만 남는다(`check-render-deadlines:70-103`). 환불은 토스 콘솔에서 수동으로 한다.
- 환불 시각: `refund50At` = 결제 + 4시간, `refund100At` = 결제 + 48시간(`payment/confirm/route.ts:127-132`).

## 7. Firestore 필드를 손으로 바꿀 때 주의

자동 정리(`cron/cleanup`, 매일 1회)가 아래 필드를 읽는다. 손으로 고치면 삭제 시점이 바뀌거나 영상이 지워지지 않을 수 있다.

- `videos[]` (`{renderId, s3Key, doneAt}`): 완성본 7일 삭제 기준. `doneAt`이 없거나 형식이 다르면 지워지지 않는다.
- `renderDoneAt`: `videos[]`가 없는 옛 문서의 완성본 삭제 기준. 참가자 알림이 안 나간 완성 이벤트의 클립 48시간 삭제 기준이기도 하다.
- `notifications.participantNotifiedAt`: 클립 48시간 삭제 기준.
- 공유 페이지는 `status === "done"`이고 `videoS3Key`가 있어야 영상을 보여 준다(`share/[eventId]/page.tsx:58`).
- `status`를 손으로 `done`으로 바꾸면 check-rendering을 거치지 않으므로 `videos[]`·`renderDoneAt`·알림이 모두 빠진다. 권하지 않는다(미검증).
