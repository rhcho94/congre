# 핸드오프 2026-10-17 — 위험 4건 수정: 렌더 시작 자물쇠·결제 확인 복구 배포

작성: 채팅 클로드 코난. 다음 세션은 이 문서 + 프로젝트 문서 `claude/pending-backlog.md`(Q절)로 시작.
직전 핸드오프: `2026-10-16-handoff-paid-test-shotstack-cleanup.md`(`0b454d4`).

## 1. 한 줄 요약
10/16 정찰에서 찾은 위험 4건을 모두 고쳐 배포했다. 렌더 시작 쪽(커밋 A)은 실사이트 스모크로 중복 시작 차단을 확인했다. 결제 확인 쪽(커밋 B)은 코드 대조까지 끝났고 라이브 확인은 남았다. 환불 절차서에 당일 전체취소 결과를 반영했는데, A5 질문(취소한도 0원)은 절반만 답이 나온 것으로 정정했다.

## 2. 커밋·배포
| 레포 | 해시 | 내용 | push |
|---|---|---|---|
| `rhcho94/congre` | `28b4e19` | docs(ops): 환불 절차서 당일 전체취소 기록, CHANGELOG 10/16(⑥·⑦) — 2파일 +11 −6 | 10/17 13:02 |
| `rhcho94/congre` | `d8f64e8` | fix(render): render/start 중복 시작·고아 실행 방지, 결제 성공 화면에 시작 실패 이유 표시 — 4파일 +101 −27 | 10/17 15:12 |
| `rhcho94/congre` | `594fc23` | fix(payment): 결제 확인을 토스 중복·실패 호출에서 복구, 주문·행사 저장을 한 번에 — 1파일 +122 −44 | 10/17 21:23 |
| `rhcho94/congre` | (이 문서) | docs(handoff) | |

게이트(커밋 A·B 모두): 빌드 정적 31/31, Route 표 41, lint 12 errors / 2 warnings(차이 0), tsc 통과. 기준값 변동 없음.

## 3. 문서 커밋 `28b4e19`
- `docs/ops/runbook-refund-manual.md`: 4행 머리말, 20행(운영자 문자 설정 확인됨 10/10 — J6), 28행 기울임 메모, 4절 43~48행("확인됨 10/16 실측" + "아직 해 본 적 없음"). 50 → 53행.
- `docs/CHANGELOG.md`: 10/16에 ⑥ 유료 시험·⑦ Shotstack 정리 두 줄.
- refund-log는 남기지 않음(Ray: 시험 취소는 환불이 아님). `refund-log.md`는 저장소에 없다 — 절차서 3절 3번 규칙대로 첫 실제 환불 때 만든다.
- **A5 정정**: 원래 질문은 "취소한도 0원에서 취소가 되나". 확인된 건 당일 전체취소(매입 전 승인 취소)뿐이고 취소 시점 한도 표시값은 기록 안 함. 실제 환불 대부분인 당일 50% 부분취소·다음 날 이후 매입 후 취소는 미확인. 10/10 1:1 문의는 보낸 기록이 없음(지난 채팅·Gmail 확인). 주말엔 상담원 연결 뒤에만 입력 가능 → 월요일 문의(백로그 Q5).

## 4. 커밋 A `d8f64e8` — 렌더 시작 안전장치 (위험 a·c·d)
- `src/app/api/render/start/route.ts`
  - 행사가 이미 `rendering`이면 409 `RENDER_IN_PROGRESS`(빠른 검사 43~46행 + 엔진 시작 직전 트랜잭션 선점). 선점은 모든 검사(클립·길이·30분) 뒤라 검사 실패 때 되돌릴 게 없다.
  - 트랜잭션 콜백 첫 줄에서 `alreadyRendering`·`prevStatus` 초기화(콜백은 충돌 시 재실행됨 — 보정 1건).
  - 엔진 시작 실패 → 상태를 원래 값(closed/done)으로 되돌리고 500 `ENGINE_START_FAILED`(영어 원문은 로그에만).
  - 엔진 시작 뒤 저장 실패 → 1회 재시도, 그래도 실패면 500 `SAVE_AFTER_START_FAILED` + 로그 `[render/start] save after engine start failed`(jobId·executionArn·outKey). 상태는 선점한 `rendering` 그대로.
  - 시작 알림 표시 저장 실패는 로그만 남기고 정상 응답.
- `src/lib/render-start-errors.ts`(신규): 대시보드에 있던 실패 안내 문구를 옮긴 공용 함수 + 새 코드 3개 문구.
- 대시보드 `callRenderStart`와 결제 성공 화면이 이 함수를 같이 쓴다. 결제 성공 화면은 `RENDER_IN_PROGRESS`를 성공으로 처리하고, 그 밖의 실패는 안내 문구와 오류 코드를 보여 준다.
- 막는 범위는 `rendering`만. 재렌더는 `done`에서 render/start를 부르므로 `done`은 막지 않는다. `done`에서 결제 없이 다시 시작이 서버에서 안 막히는 문제는 기존 등재(재렌더 결제 서버 강제, B안 보류) 그대로.
- **라이브 스모크(코난, 앱 내 브라우저, 운영자 계정)** 행사 `스모크-1017` `TlmBK61xvuZ9llMfpgmw`(무료, Ray가 폰으로 클립 2개):
  - 탭 1: 마감 200 → render/start 200. 탭 2(옛 화면): 마감 200 → render/start **409 `{"error":"RENDER_IN_PROGRESS"}`**. 직후 상태 `rendering`.
  - 18:07 시작 문자 1통, 18:10 완성 → `done`, 완성본 `renders/TlmBK61xvuZ9llMfpgmw-1792228063074.mp4` 하나, previousVideos 비어 있음.
  - 18:10 문자 2통은 주최자용("편집 완료") + 하객용("결과 영상이 준비됐어요") — Ray가 같은 번호로 하객 업로드를 해서 둘 다 받음. cron check-rendering 140~160행. 정상 동작(10/16 유료 시험도 같은 패턴).
  - 마감 API `events/[eventId]/close`는 open이 아닌 행사에 아무것도 쓰지 않고 200(33~35행) — 두 번째 마감이 상태를 덮어쓰지 않는 이유.

## 5. 커밋 B `594fc23` — 결제 확인 안전장치 (위험 b)
- 대상: `src/app/api/payment/confirm/route.ts` 하나(155 → 233행). 결제 성공 화면은 서버 응답의 `message`를 이미 보여 주므로(83·102행) 수정 없음.
- 토스 승인 요청 예외, 또는 토스가 `ALREADY_PROCESSED_PAYMENT`를 주면 → 주문을 `failed`로 쓰지 않고 `GET /v1/payments/orders/{orderId}`로 조회. `status === "DONE"` + `totalAmount === 주문 금액` + `paymentKey` 일치일 때만 성공으로 이어감. 아니면 502 `PAYMENT_STATUS_UNKNOWN`(주문은 pending 유지 → 새로고침으로 재시도).
- `ALREADY_PROCESSING_REQUEST` → 쓰지 않고 409 `PAYMENT_PROCESSING`.
- 그 밖의 거절 코드 → 기존대로 `failed` + 400(토스 응답 그대로).
- 저장: 주문 `paid` + 행사 필드를 트랜잭션 하나로. 주문이 이미 `paid`면 아무것도 쓰지 않고 성공 반환(늦게 온 두 번째 요청이 렌더 중 행사를 `closed`로 되돌리는 일 차단). 콜백 첫 줄 초기화.
- 경로 표(eye·CC 작성, 코난 원문 대조): a 정상 / b 요청 예외+조회 일치 / e 이미 처리됨+조회 일치 → paid 저장·200. c 요청 예외+조회 불일치 / f 이미 처리됨+조회 불일치 → 쓰기 없음·502. d 처리 중 → 쓰기 없음·409. g 그 밖 → failed·400. h 저장 시점에 이미 paid → 쓰기 없음·200.
- 근거 문서(라나, 토스 공식): 오류 코드 표(ALREADY_PROCESSED_PAYMENT·ALREADY_PROCESSING_REQUEST 400), 결제 조회 경로, Payment 객체 status·totalAmount. 멱등키는 "모든 POST"라고만 있고 승인 API를 지명한 문장이 없어 쓰지 않음. 승인 전 주문 조회 응답, ALREADY_PROCESSING_REQUEST 권장 처리는 문서에 없음.
- 검증 중 터미널 줄바꿈으로 `4 * 60 * 60 * 100`처럼 깨진 출력이 나와 파일로 저장 후 원문 확인 — 198·201행 `* 1000` 두 줄 정상.
- **라이브 확인 안 함**(Q1).

## 6. 미완 — 다음 세션 가장 먼저
1. **Q1 커밋 B 라이브 확인**: 유료 시험 1회(정상 경로) + 당일 전체취소. 중복·실패 경로는 실사이트 재현 불가 → 5절 경로 표로 갈음.
2. **Q2 문서 커밋**(제자리 수정이라 정찰 먼저):
   - known-issues: P1 4건 resolved(`d8f64e8`·`594fc23`) + 신규 등재 2건 — (가) 저장 실패 뒤 새로고침 전 클립 수가 바뀌면 재시도가 토스 호출 전 클립 수 검사(`d8f64e8` 기준 65~76행, 커밋 B로 줄 번호 밀림)에 걸려 `stale`(돈은 빠졌는데 미완료로 보임), (나) `SAVE_AFTER_START_FAILED`면 행사는 `rendering` + 실행 id 없음 → cron이 건너뜀(51행).
   - `docs/ops/runbook-render-stuck.md`: (나)의 복구 절차(로그의 jobId·executionArn·outKey로 행사 필드 채우기 — 필드 이름은 render/start 저장 필드 기준, 정찰로 확정).
   - `docs/ops/runbook-refund-manual.md` 2절: 결제 확인 이상 로그 `[payment/confirm] payment status unknown after request failure`·`already processed but not confirmed DONE`.
   - CHANGELOG 10/17.
   - 끝나면 Ray가 known-issues 프로젝트 문서 재업로드.
3. **Q5 월요일 토스 1:1 문의**(Ray): 취소한도 0원에서 당일 부분취소(50%)·매입 후 부분·전체취소가 되는지. 답은 환불 절차서 4절 "아직 해 본 적 없음"에.

## 7. 다음 세션 후보
- (상) 6절 1~3
- (중) ⑧ 처리방침(Ray 법률, O5)
- (중) O7 완성본 크기
- (하) L1 휴대폰 번호 오류 안내(INVALID_PHONE), L2 환경변수 trim

## 8. 학습
- 사고 계기를 일반 웹 패턴으로 짐작하지 않는다. "성공 화면 새로고침이 중복 렌더 계기"라고 했다가 코드에서 틀림(새로고침은 ORDER_NOT_PENDING에서 멈춤). 계기 판단은 화면 코드를 본 뒤에.
- 트랜잭션 콜백은 충돌하면 다시 실행된다. 콜백 바깥 변수는 콜백 첫 줄에서 초기화한다(커밋 A 보정 → 커밋 B 사양에 처음부터 포함).
- 터미널 출력은 줄바꿈으로 글자가 빠져 돈 관련 숫자가 틀려 보일 수 있다. 의심되면 CC에 "파일로 저장 후 Read로 읽어 붙이기"를 시킨다.
- 질문의 조건과 실제 시험 조건을 대조한다(A5: 한도 0원 질문 vs 당일 승인 취소 시험). 금액 공식 대조(10/16)와 같은 유형.
- 검증 에이전트가 본문 없이 요약만 넘기면 독립 검증이 약하다. 돈·상태가 걸린 핵심 줄은 원문으로 다시 본다.
- 채팅 클로드가 앱 내 브라우저로 스모크를 할 수 있다(운영자 계정 로그인 유지, 네트워크 기록으로 응답 코드 확인). 파일 첨부(클립 업로드)와 문자 확인은 Ray 몫. 폼 제출·되돌릴 수 없는 버튼은 매번 허락받는다.
- 사용자 표현의 뜻을 먼저 확인한다("보낸 사람" = 영상 올린 사람, 문자 발신 번호가 아님).
