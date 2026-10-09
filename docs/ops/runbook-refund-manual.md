# 환불 수동 처리 절차서

> 근거: 2026-10-09 정찰(HEAD 기준 코드). 코드에는 토스 결제취소 API 호출이 없다(known-issues "환불 집행 코드가 없다"). `refundStatus`는 "환불 대상 확정"이지 "환불 완료"가 아니다. 실제 환급은 운영자가 토스 상점관리자에서 한다.
> **미확정**: 취소한도 0원인 상태에서 상점관리자 취소가 되는지, 되지 않으면 어떤 경로인지 — Ray가 토스 1:1 문의(pending-backlog A5)로 확인한 뒤 이 절차서의 4절을 채운다.

## 1. 언제 환불이 생기나 (약관 제10조의3)

| 구분 | 조건 | 금액 | 자동으로 되는 것 | 수동 |
|---|---|---|---|---|
| 지연 50% | 결제 완료(`paidAt`) + 4시간이 지나도록 `rendering` | 결제 금액의 50% | cron `check-render-deadlines`가 `refundStatus: "50"` 기록 + 호스트 메일·문자(refund_50) + 운영자 문자(CONGRE_INTERNAL_PHONE 설정 시) | 토스 취소 |
| 지연 100% | 결제 완료 + 48시간 | 전액 | 같은 cron이 `refundStatus: "100"` + refund_100 알림. 영상은 끝까지 완성해 전달 | 토스 취소 |
| 렌더 실패 | Shotstack `failed` → 이벤트 `closed` | 약관 제10조의3 ④ 회사 귀책 | `check-rendering`이 호스트에게 render_failed 알림 + 운영자 문자(2026-10-09~) | 재시도 또는 토스 취소. **cron의 4시간·48시간 환불은 `rendering` 상태만 보므로 실패 뒤에는 자동 확정이 없다** — 운영자가 판단 |
| 결제 후 렌더 시작 실패 | 결제 성공 페이지의 `render/start` 호출 실패(`renderFailed`) | 위와 같음 | 없음(호스트가 직접 재시작) | 위와 같음 |
| 호스트 변심 | — | 없음 | — | 환불 없음(취소한도 0원이 정책, decisions/infra.md 2026-09-22~24 결정 4) |

약관상 처리 기한: **환불 사유가 확정된 날부터 영업일 기준 3일 이내**(제10조의3 ⑧).

## 2. 사고를 아는 방법

1. 운영자 문자(`CONGRE_INTERNAL_PHONE`): 지연·환불 확정·렌더 실패 때 온다. Vercel 환경변수에 값이 있어야 한다 — **설정 여부 미확인**(2026-10-09).
2. Vercel 로그: `[cron] refund_50`, `[cron] refund_100`, `[cron/check-rendering] ... failed`.
3. Firestore `events/{eventId}`: `refundStatus`, `notifications.refund50NotifiedAt`, `notifications.refund100NotifiedAt`.
4. 호스트 문의(카카오톡 @congre / cs@rayne.co.kr).

## 3. 처리 순서

1. **금액 확정**: Firestore `payments`에서 해당 이벤트의 `status: "paid"` 문서 → `orderId`, `amount`, `paymentKey`, `paidAt`. 50%는 `amount × 0.5`(원 단위 절사 여부는 토스 화면 기준).
2. **토스 상점관리자**에서 취소: 상점관리자 → 거래 조회 → 해당 주문(orderId 또는 결제일·금액) → 취소(부분 취소 = 50%). *4절 미확정 — 취소한도 0원이면 여기서 막힐 수 있다.*
3. **기록**: Firestore 이벤트 문서에 수동 필드를 넣지 않는다(코드가 읽지 않음). 대신 `docs/ops/refund-log.md`(없으면 생성)에 날짜·이벤트 id·orderId·금액·토스 취소번호를 한 줄로 남긴다.
4. **호스트 안내**: 자동 메일은 "별도로 연락드리겠습니다"라고 했으므로 취소 완료 뒤 카카오톡 또는 cs@rayne.co.kr로 "취소 처리 완료, 카드사 반영 3~7영업일" 한 줄.
5. **재렌더 여부**: 50%·100% 모두 영상은 완성해 전달한다(약관·refund_100 메일 문구). 렌더가 멈춘 상태면 `docs/ops/runbook-render-stuck.md`로.

## 4. 토스 취소 경로 (미확정 — Ray 문의 뒤 채움)

- 질문 1: 취소한도 0원에서 당사 귀책 환불을 어떻게 집행하나 (상점관리자 수동 취소가 되는지, 한도 일시 조정인지).
- 질문 2: 한도 기준과 조정 가능 여부.
- 질문 3: API 결제취소가 한도로 실패할 때 대체 방법.
- 답을 받으면 2절·3절 2번을 확정 절차로 바꾼다.

## 5. 알려진 구멍

- 재렌더 결제 뒤에는 `refund50At`/`refund100At`이 새로 기록되지만 `refund50NotifiedAt`/`refund100NotifiedAt`은 초기화되지 않아 두 번째 지연에는 환불 알림이 다시 나가지 않는다(2026-10-09 정찰). 등재만.
- 렌더 실패·시작 실패 뒤에는 자동 환불 확정이 없다(1절 표). 운영자 문자로 알고 수동 판단.
