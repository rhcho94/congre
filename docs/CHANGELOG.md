# Changelog

> 기능 단위 작업 이력. 최신이 위.

## 2026-09-01

- fix(payment): 결제 페이지에 제작 기간·환불·다운로드 고지 추가 + 근거 없는
  "우선 처리" 제거 — 토스 심사자가 영상 제작 기간의 홈페이지 기재를 요청했다.
  상품 설명 박스에 제작 기간(약관 제10조의2 ①)·지연 시 환불 구간(제10조의3 ③)·
  다운로드 기간(제11조 ①2호)을 넣었다. 다운로드 기산점은 "완성된 시점"으로
  적었다 — 코드(`cron/cleanup`의 `doneAt` + 7일)와 약관이 모두 완성 시점
  기준이며, 토스 1차 회신의 "결제 후 7일" 확약은 제작이 결제 직후 개시되므로
  항상 충족된다. "· 우선 처리"는 정찰 결과 코드 근거가 없어 제거했다.
  유료·무료의 실제 차이는 워터마크와 폰트뿐이고 Shotstack 호출에
  `priority`·`queue` 파라미터가 없다. (`4a343f7`)
- fix(payment): 고지 문단 내부 개행 제거 — `whitespace-pre-line`이라 소스
  개행이 화면에 그대로 나오고 브라우저 자동 줄바꿈과 겹쳐 "결제 금액의"·
  "처리됩니다." 같은 파편 줄이 생겼다. PC·모바일 양쪽 실화면에서 확인 후
  문단 내부 개행 4개를 제거했다. 공백 정규화 비교로 글자 무변경 확인
  (양쪽 346자). (`98f660a`)
- chore(landing): 랜딩 요금 페이지에 동일 고지 3항목 반영 + "우선 처리" 제거 —
  각주 `<p>` 1개를 3개(제작 기간/다운로드/재편집)로 나누고
  `max-width: 760px` + 인접 형제 `margin-top: 8px` CSS 2블록을 추가했다.
  재편집 48시간 기한을 함께 기재해 기존 known-issue를 해소했다.
  `deploy/pricing.html`은 git 밖이라 커밋 없음. `npx vercel --prod`로
  `congre-landing` 프로젝트에 배포.

## 2026-08-24

- fix(payment): 결제 준비 단계의 클립 0개 차단 가드 제거 — 결제대행사
  심사자가 영상 업로드 없이 카드결제창을 확인할 수 없어 심사가 막혔다.
  `payment/prepare`의 `NO_CLIPS` 400 반환을 제거하고, 이용자 보호를 위해
  결제 페이지에 클립 0개 경고 배너를 추가했다. `clipCount` 계산과
  `prepareErrorMessages`의 `NO_CLIPS` 항목은 유지했다. 최소 결제 금액
  가드(`MIN_PRICE` 10,000원)가 이미 있어 클립 0개여도 0원 결제는
  발생하지 않는다. (`f58281d`)

## 2026-08-17

- fix(notifications): 지연 알림 환불 고지를 결제 후 4시간 기준으로 정정 — 메일·plain
  text·SMS 3채널의 "30분 이내" 상대시간 문구를 `paidAt` + 4시간 기산점 명시로
  교체했다. 실제 `refund50At`은 결제 완료 기준 절대시각인데 문구는 발송 시점부터의
  상대시간을 말해 클립 수에 따라 최대 3시간 30분까지 오차가 벌어졌었다. 같은
  커밋에서 `cron/check-render-deadlines/route.ts:69`의 "T+E+30분" 주석도 함께
  정정했다(코드 로직 무변경, 주석만). 문구 3곳 정정 + cron 주석 정정 1곳이 같은
  커밋으로 처리됐다. (`bf93b72`)

## 2026-08-16

- verify(rerender): 재렌더 유료화 실동작 검증 — `rhcho94+tosstest@gmail.com` 이벤트
  `aVuMJn7tk4mrMJW8FXsm`에서 최초 10,000원 → 재렌더 8,000원 결제 완료. `closedAt`
  14:39:58과 `participantNotifiedAt` 14:45:4x가 최초 값 그대로 유지되고 `status`는
  `done` 유지, `firstPaidAmount` 10000 기록, `refund50At`이 재렌더 결제
  시각(14:56:16) +4시간으로 갱신됨을 확인. `renderCompletedNotifiedAt`은 `null`로
  남아 `render/start`의 나머지 리셋 3개가 살아 있음을 함께 확인했다. 결제는 1회 실패
  후 재시도로 완료 — 원인은 테스트 키 분당 100건 제한(`TOO_MANY_REQUESTS`). 실키(운영
  키)에도 동일한 rate limit이 걸리는지는 확인한 바 없다.
- fix(rerender): 재렌더 결제 버튼 라벨이 길어 줄바꿈이 생기던 것을
  해소. (325600c)
- feat(rerender): 재렌더 유료화 클라이언트 — done 화면 재렌더 버튼에 `clips.length > 0`
  가드를 걸어 클립 만료 후 "돈 받고 렌더 실패"가 되는 경로를 차단했다(약관 제14조 ④).
  유료 플랜은 결제 경로로 분기하며, 모달에 금액(처음 결제 금액의 80%)과 기한(48시간)
  2줄 고지를 넣어 약관 제14조 ③의 사전 고지·확인 의무를 이행한다. 버튼 라벨은 유료
  `결제하고 만들기` / 무료 `다시 만들기`. (ae4b6dc)
- feat(payment): 재렌더 결제 서버 로직 — `payment/prepare`가 요청 본문의 `mode`를 받지
  않고 events의 `status`·`unlocked`로 first/rerender를 자동 판정한다. 클라이언트가
  `mode`를 보내면 금액을 임의로 깎을 수 있어 2026-08-06 감사 H-2(unlocked 자기부여)와
  같은 계열의 우회가 되기 때문이다. 금액은 `round(최초 결제액 × 0.8)`이고 기준값은
  신설 필드 `events.firstPaidAmount`에서 읽는다(`payments` 쿼리는 재렌더 주문이
  쌓이면 정렬·인덱스가 필요해 기각). rerender confirm은 `refund50At`·`refund100At`만
  갱신하고 `closedAt`·`status`·`unlocked`·`sessionToken`·`firstPaidAmount`는 쓰지
  않는다. 409 `CLIP_COUNT_CHANGED` 검사는 first에서만 수행한다 — 재편집은 클립 수를
  바꾸는 것이 목적이라 rerender에 그대로 두면 정상 요청이 전부 막힌다.
  `AMOUNT_MISMATCH`는 토스 표준이라 두 mode 공통 유지. (8290dbe)
- fix(rerender): 재렌더 사전 정리 4건 — 클립 토글 비활성 조건을 `isClosed`에서
  `status === "rendering"`으로 좁혔다(closed·done에서 클립을 고르는 것이 재편집의
  목적이다). `render/start`의 `participantNotifiedAt: null` 리셋도 제거했다. 이
  리셋이 있으면 재렌더마다 필드가 초기화되고 cron이 새 시각으로 재기록해 cleanup
  D-1의 클립 48시간 시계가 매번 연장된다. 2026-08-14에 `closedAt` 축에서 막은 것과
  같은 구조가 이 축에 남아 있었다. 부수 효과로 재렌더 시 참가자 알림 재발송도
  멈춘다(`check-rendering:131` 가드가 제 역할을 회복). 인접 3개 NotifiedAt과
  `refundStatus`는 렌더 진행 알림 축이라 유지. (a1735a0)

## 2026-08-15

- fix(signup): 가입 안내 문구에서 "테스트" 제거 — `/signup` 상단 안내가 "가입하면 바로 무료로
  테스트해 볼 수 있어요"였다. 토스 1차 심사 지적이 "테스트 상품 불가"였으므로 제출 캡처 ④에
  이 단어가 남으면 오해 소지가 있어 교체했다. (c29efdc)
- feat(payment): 결제 성공·실패 페이지 신설 — 토스 결제창이 리다이렉트하는
  `/payment/success`·`/payment/fail` 두 경로에 페이지 자체가 없어 결제 완료 후 404로
  떨어지던 상태를 해소. success는 `authStateReady()` 대기 후 confirm → render/start →
  이벤트 페이지 이동 순으로 진행한다. 리다이렉트로 새로 열리는 페이지라 Firebase 로그인
  복원 전 `currentUser`가 null일 수 있어 대기가 필수다. 에러는 `CLIP_COUNT_CHANGED` /
  `ORDER_NOT_PENDING` / 그 외 3갈래로 분기하며, `confirm:111`이 토스 응답 본문을 그대로
  흘려보내므로 `error ?? code` 순으로 읽는다. render/start만 실패한 경우는 별도 상태로
  분리해 결제 완료 사실을 명시하고 이벤트 페이지 링크를 준다. fail은 API 호출 없이
  `code`·`message` 표시 + 대시보드 링크. lint baseline 11→12 동반 상향
  (`success/page.tsx:44` `set-state-in-effect` 1건, `verify-email:23`과 같은 패턴).
  (f9f54c9)
- verify(payment): 결제 전 구간 실동작 검증 — `rhcho94+tosstest@gmail.com` 계정으로 신규
  이벤트(클립 3개, 10,000원) 테스트 결제 1건 실행. 카카오페이 승인 → `/payment/success` →
  `confirm` → `render/start` → Shotstack 렌더 → 27초 완성본 출력까지 전 구간 정상.
  `authStateReady()` 대기가 실제 리다이렉트 경로에서 작동함을 확인했다(대기 없이는
  `AUTH_FAILED`로 떨어졌을 경로). 다만 카카오페이는 외부 앱 경유 리다이렉트라 success
  화면이 사용자에게 표시되지 않고 곧바로 이벤트 페이지로 전환된다 — 동작은 정상이나 이
  경로에서는 success 화면 캡처가 불가능하다.
- verify(refund): 게이트 #7 환불 구간 실측 검증 — Firestore `events` 문서에서
  `closedAt` 16:46:30 / `refund50At` 20:46:30 (+4시간) / `refund100At` 8/17 16:46:30
  (+48시간)로 확인. 초 단위까지 동일해 `paidAt` 단일 시계 설계가 의도대로 작동했다.
  약관 제10조의3 ③과 코드가 실데이터로 정렬됨을 확인. `plan: "paid"`,
  `status: "rendering"`, `renderId` 발급도 정상.
- docs(handoff): 8/14 (2) 세션 핸드오프 커밋 누락분 등재 — 내용 수정 없이 그대로 커밋.
  (f53d478)

## 2026-08-14

- fix(refund): 환불 구간을 약관 제10조의3에 정렬 — 환불 경계 계산을 렌더 시작 → 결제 완료
  시점으로 이관. `payment/confirm`이 `paidAt` 상수 기준으로 `refund50At`(+4시간)·
  `refund100At`(+48시간)을 events에 기록하고, `render/start`의 계산 2줄과
  `notifications.refund50NotifiedAt`·`refund100NotifiedAt` 리셋 2줄 제거. 구 공식은 렌더
  시작 기준 (추정 완료+30분)/24시간으로 값도 기산점도 약관과 달랐다. 리셋 제거로 재렌더 시
  과거 시각 재계산에 의한 환불 메일 오발송 경로가 닫혔다. 무료 이벤트는 confirm을 거치지
  않아 두 필드 미기록으로 자연 제외(가드 코드 0줄). 메일 문구 `emails/refund-100.ts:26`
  24시간 → 48시간 동반 수정. push 전 Firestore `status == "rendering"` 조회 0건으로 기존
  문서 영향 없음 확인. (6e18ddd)
- fix(cleanup): 클립 보관 48시간 + 지연·실패 이벤트 클립 7일 삭제 경로 — `cutoffClips`
  24→48시간. 순회 쿼리가 `status == "done"` 하나뿐이라 렌더가 지연·실패한 이벤트의
  클립이 무기한 남던 구조에 D-3 루프를 신설, `status in ["closed","rendering"]`을 훑어
  `closedAt` 기준 7일 경과 + `clipsDeletedAt` 미기록이면 클립을 삭제한다(약관 제11조 ⑤
  이행). `closedAt` 부재 시 삭제 없이 `console.warn` 후 건너뜀. 클립 삭제 로직을
  `deleteClipsAndMarkEvent()`로 추출해 D-1·D-3이 공유하되 가드 조건은 각자 루프에 남김.
  두 루프에 이벤트 단위 try/catch 추가 — `update()` 예외로 루프 전체가 중단되던 구조를
  이벤트 단위 격리로 교체. D-3은 클립만 다루며 `videos`·`videoS3Key`·`renderId`는
  건드리지 않는다. (3adec53)
- feat(events): 마감 시각 `closedAt` 기록 — 약관 제11조 ⑤가 "무료 플랜의 경우 이벤트
  마감 시점"을 클립 7일 보존 기산점으로 선언했으나 그 시각이 데이터에 없었다. `closed`
  전환 2경로(`api/events/[eventId]/close`, `api/payment/confirm`)에
  `FieldValue.serverTimestamp()`로 기록하고 `lib/events.ts` `CongreEvent`에 옵셔널 필드
  추가. `check-rendering`의 렌더 실패 시 `closed` 전환에는 기록하지 않는다 — 덮어쓰면
  7일 시계가 다시 돌아 렌더 3회 실패 시 클립이 21일 남는다. (4cdcea2)
- fix(legal): 클립 7일 보존 기산점에 무료 플랜 분기 명시 — "결제 완료 시점(무료 플랜의
  경우 이벤트 마감 시점)으로부터 최대 7일까지". 무료 이벤트는 결제가 없어 기산점이
  없었다. 약관 제11조 ⑤ + 처리방침 제3조 ② 클립 행 2곳을 문자 단위 동일하게 교체.
  제10조의3의 "결제 완료 시각"은 환불 축이므로 미변경. (6aecdf5)
- fix(guide): 클립 보관 안내 24→48시간 — `guide/host` 2곳(보관 기한 안내·FAQ),
  `guide/guest` 1곳(개인정보 안내). 완성본 7일은 다른 축이라 불변. 가이드에는 7일 예외
  단서를 넣지 않고 단순 유지. (07f1a05)
- feat(legal): 개인정보처리방침 v1.0 결제 조문 적용 + 클립 보관 48시간 — 제2조 결제 정보
  수집 행 추가(6→7행)·③항 신설(결제수단 상세는 PG가 보관), 제3조 ② 법정 보존기간 3행
  추가(6→9행)·클립 및 참가자 정보 2행을 48시간 + 지연·실패 시 최대 7일 단서로 교체,
  제3조 ④ 1호 근거 법령 열거, 제3조 ⑤ 분리 보관 단서 삽입, 제5조 위탁 표에 토스페이먼츠
  추가(6→7행). 약관 제10조의2 ③이 이미 결제대행 위탁을 게시한 상태였으나 처리방침에는
  없어 어긋나 있던 불일치를 함께 해소. 조 번호·항 번호는 하나도 밀지 않았다. (e770a5d)

## 2026-08-13

- feat(legal): 이용약관 v1.0 유료 서비스 조문 적용 — 제10조를 (무료 베타 서비스의 면책)
  → (유료 서비스 및 요금)으로 교체하고 요금 산정식 명문화, 제10조의2(결제)·제10조의3
  (청약철회 및 환불)을 가지 번호로 신설, 제11조 ⑤ 추가(지연·실패 이벤트 클립 최대 7일
  보존), 제14조 ②③ 교체 + ④ 추가(재렌더 유료화 가능성), 제20조 ① 정정 + ④ 추가(유료
  손해배상 한도), 클립 보관 24→48시간(제11조 ①1호·제17조 ②2호). 시행일 2026-09-01이
  부칙에 이미 명시된 첫 시행이므로 개정이 아니며 제3조 ③의 30일 공지 규정은 대상이
  아니다. 가지 번호 삽입으로 기존 조 번호는 하나도 밀리지 않았다. (f0edbb4)
- fix(payment): 최소 결제 금액 적용 시 계산식 표시 정정 — 하한 1만원이 적용되면 계산식이
  "10초 × 2개 × 100원 = 10,000원"으로 산수가 맞지 않게 표시됐다. 서버가 하한 적용 전
  금액(`rawAmount`)을 함께 내려주고 화면이 두 값을 비교해 하한 안내를 별도 줄로 보인다.
  `calcRawPrice`·`MIN_PRICE` 추출(`calcPrice` 동작 불변), `payments` 저장 필드 불변.
  (705a9bc)
- feat(payment): 결제 요약 화면 + 마감 흐름 유료 분기 — 새 라우트 `/payment/[eventId]`
  신설(모달이 아닌 이유: 캡처에 도메인 노출이 필요하고 모달은 고유 URL이 없다).
  4요소(명칭·이미지·상세설명·금액)와 청약철회 제한 고지 체크박스 배치, 금액은 계산
  과정이 보이게 표시. `dashboard/events/[eventId]` `handleClose`를 `plan === "paid"`에서
  분기(무료는 기존 경로 유지), 마감 모달 셋째 줄을 "다음 화면에서 결제를 완료하면
  마감됩니다"로 교체. `prepare` 응답에 `title` 추가. 유료 플랜 `comingSoon` 잠금 해제.
  (16e3afc)

## 2026-08-12

- feat(payment): 결제 준비·승인 API 2개 신설 — `POST /api/payment/prepare`는 포함 클립 수를
  집계(`!excludedAt`)해 `calcPrice`로 금액을 산출하고 `orderId`를 발행해 `payments` 컬렉션에
  주문을 저장한다. `POST /api/payment/confirm`은 토스 승인 API 호출 **앞에** 2중 검사를 둔다
  — (a) 반환 `amount` vs 저장 `amount` 대조(토스 공식 표준, 위변조 방지), (b) 현재 클립 수 vs
  저장 `clipCount` 재검증(어긋나면 409로 재발행 유도). 둘 다 통과해야 승인을 호출하고, 성공
  시 `unlocked`·`closed`·`sessionToken`을 한 번의 update로 처리한다. 금액의 길이 항은
  `event.maxClipSeconds` 설정값이며 클립 `duration`은 쓰지 않는다 — 값이 유효한 정수가 아니면
  임의 기본값 없이 `INVALID_EVENT_DATA`로 중단한다. 렌더 시작은 이 라우트가 하지 않는다
  (클라이언트 담당, 코드 ③). 신설 파일 2개 `api/payment/prepare/route.ts`(81줄)·
  `api/payment/confirm/route.ts`(131줄). 사양: decisions/market-product.md 2026-08-12.
  (f4b3623)

## 2026-08-11

- fix(legal): 사업자 정보 통신판매업신고번호 표기를 `신고 예정` → `신고 면제
  대상 (전자상거래법 제12조 제1항 단서)`로 교체. 앱 2곳(terms·privacy) + 랜딩
  1곳(별도 트랙). 종전 표기는 "아직 안 한 것"으로 읽혀 심사에서 미비로 비칠
  소지가 있었고, 새 표기는 법정 면제 사유를 명시한다. (bc0a92f)
- docs(legal): 약관·개인정보처리방침 첫 시행일 2026-09-01 확정 — 회원 0명
  상태의 첫 시행이므로 개정이 아닌 제정으로 처리. 부칙의 v0.1·v0.2 시행 이력
  2줄을 삭제하고 한 줄로 교체. 상단 시행일 표기 2곳 + 부칙 본문 2곳 = 두 파일
  4곳. docs/legal/CHANGELOG.md 헤더 규약("시행 전 초안은 0.x, 첫 시행 = 1.0")과
  부칙 기재가 어긋나 있던 상태를 함께 해소. 본문에 버전 문자열은 넣지 않고
  CHANGELOG에만 둔다. 전제 조건: 유료 개시 전 계정·데이터 전수 초기화(별도 트랙).
  결정: decisions/legal.md 2026-08-11. (bfc7878)
- feat(legal): 약관·개인정보처리방침에 사업자 정보 섹션 신설 — 전자상거래법
  사업자 신원 표시 + 카드사 심사 대응. 7항목(상호·대표자·사업자등록번호·사업장
  주소·통신판매업신고번호·연락처·이메일)을 두 파일에 문자 단위 동일하게 배치.
  부칙 바로 앞, glass-panel 안쪽. 조문이 아닌 정보 블록이므로 조 번호 미부여.
  마크업은 각 파일 관례를 따름 — terms는 <p> 나열, privacy는 제9조와 동일한 표.
  통신판매업신고번호는 현재 "신고 예정" 표기. (f7561f6)
- fix(contact): 문의 이메일을 회사 도메인 rayne.co.kr로 교체 — 종전 문의처
  hello@congre.kr은 수신 MX가 없는 발송 전용 도메인이었고, 메일 공통 푸터의
  support@congre.app은 미소유 도메인이었다. 즉 공개 문의 경로 2개가 모두 도달
  불가 상태였다(실고객 없어 실피해 0). 앱 하단 문의처 2곳·메일 본문 3곳은
  고객 창구 계정 cs@rayne.co.kr, 개인정보 보호책임자는 실명 계정 ray@rayne.co.kr.
  src/lib/notifications/channels/email.ts:5의 폴백값 noreply@congre.app은
  EMAIL_FROM이 Production에 설정돼 있어 도달 불가 경로이므로 범위 밖 유지.
  결정: decisions/legal.md 2026-08-11. (b28f30d)

## 2026-08-07

- fix(upload): 게스트 클립 길이 안내에 초과분 잘림 명시 — 촬영 직전 안내를
  "최대 N초까지 영상에 담겨요"에서 "앞부분 N초만 영상에 담겨요 (뒤는 잘려요)"로
  교체. 종전 문구는 상한을 업로드 제한으로 읽히게 해, 실제로는 초과분이 렌더에서
  조용히 잘려나가는 것을 게스트가 알 수 없었음. 잘림 자체는 회피 불가 —
  iOS·Android 모두 네이티브 카메라로 촬영하므로 촬영 중 길이를 강제할 수단이 없고
  파일이 돌아온 뒤에야 duration을 알 수 있음. 강제를 조이는 대신 결과를 예측
  가능하게 만드는 방향을 택했다. 앞에서부터 잘린다는 것은 운영자 실측으로 확정.
  촬영 직전 안내 1곳만 교체하고 나머지 3곳(버튼 라벨·짧은 안내)과 120초 강제
  로직은 무접촉. (0356ab4)
- fix(security): S3 키 프리픽스 소속 검증 추가 — 클라이언트가 보낸 S3 키가
  `events/{eventId}/` 프리픽스에 속하는지 저장 시점에 검증. 종전에는
  `typeof === "string"` 검사만 있어 버킷 내 임의 키를 자기 이벤트 문서에 심을 수 있었고,
  그 뒤 presigned GET 발급 지점들이 소유권 재검사 없이 그 키를 서명해 넘겼음.
  `isKeyInEvent(key, eventId)` 헬퍼를 `lib/s3-server.ts`에 신설하고
  `api/clips`(s3Key·thumbKey, M-2) / `api/host/events/[eventId]`(introMediaKey·outroMediaKey, M-1)에서
  호출, 위반 시 400 `INVALID_KEY`. 검사는 인증 통과 뒤 배치(인증 앞에 두면 남의 이벤트 키
  형식을 떠보는 창구가 됨), `null`(미디어 삭제)은 통과. `videoS3Key`는 버킷 루트
  `${renderId}.mp4` 형식이라 검증 대상 제외. 2026-08-06 보안 감사 M-1·M-2 해소.
  결정: decisions/data-flow.md 2026-08-07. 배포 후 인트로 미디어 업로드·삭제 실사용 확인 완료. (9779c13)
- fix(dashboard): 인트로/아웃트로 미디어 업로드 상한 크기 10MB→100MB + 영상 길이 15초
  검사 신설. `src/lib/shotstack.ts:111`이 인트로 영상을 `length: "auto"`(원본 길이 그대로)로
  타임라인에 넣어 지금까지 크기 제한이 사실상 길이 제한을 겸해 왔음 — 크기만 풀면 긴
  영상이 완성본 맨 앞에 통째로 붙는 문제라, 크기 상향과 길이 검사 신설을 함께 처리.
  길이 검사는 `<video>` `loadedmetadata`로 duration을 측정해 15초 초과 시 alert, 판정
  불가(비표준 코덱 등)는 통과시킴(기존 동작 유지). 측정 헬퍼는
  `src/app/dashboard/events/[eventId]/page.tsx` 내부 전용(게스트 업로드 경로 무접촉).
  함께 인트로·아웃트로 미디어 섹션에 안내 문구 2곳 신설 —
  "영상은 15초까지 · 파일 100MB 이하 (사진은 길이 제한 없음)". 이 자리에는 과거
  "영상 16초 이내 권장 · 길수록 결과물 길어짐"이 있었으나 `c3c69e3`(2026-05-14,
  인트로/아웃트로 섹션 리디자인)에서 제거된 뒤 안내가 없는 상태였고, 같은 자리에
  "권장"이 아닌 상한 표현으로 복원한 것. 아웃트로에만 직렬 배치 안내 1줄 추가 —
  "아웃트로 문구를 함께 넣으면 미디어가 끝난 뒤 이어서 나와요"(2026-05-12 outroText
  overlay 폐기 사양의 UI 노출. 인트로는 overlay라 해당 없음).

## 2026-08-06

- fix(security): 저장형 XSS 3중 차단 — presign kind별 MIME 화이트리스트(intro/outro는
  `image/`·`video/` 접두 + `image/svg+xml` 거부, 불일치 400 `INVALID_CONTENT_TYPE`,
  DB 왕복 전 검사) / og-image 응답 직전 S3 ContentType 재검증(`image/` 접두 + svg 거부,
  미통과 시 기존 fallbackRedirect, `transformToByteArray()` 앞 배치로 거부분 미다운로드)
  + `X-Content-Type-Options: nosniff` / `next.config.ts` `headers()` 신설로 전 경로
  nosniff. MIME 비교는 `.trim().toLowerCase()` 정규화 사본, 서명값·PutObjectCommand는
  원본 유지(presign 서명↔PUT 헤더 글자 일치 조건). 2026-08-06 보안 감사 H-1 해소.
- fix(security): events 클라이언트 직접 생성 차단 — `firestore.rules`의 events
  `allow create`가 `hostId` 한 필드만 강제하고 plan·unlocked·maxClips·maxClipSeconds는
  무검증이었음. 이메일 인증만 마친 계정이 브라우저 콘솔에서 클라이언트 SDK로
  `unlocked:true` 이벤트를 생성하면 `render/start`의 결제 게이트를 통째로 우회 가능한
  상태. `allow create: if false`로 차단하고, 이에 따라 영구히 동작 불가해지는
  `lib/events.ts`의 `createEvent` 데드 코드(호출부 0건) 제거. 타입 정의 4개는 보존,
  `Timestamp`는 `import type` 전환으로 이 모듈이 런타임에 클라이언트 Firestore SDK를
  끌어오지 않게 됨. 콘솔 게시 + 이벤트 생성 실사용 검증 완료. (bc7915a)
- fix(security): Shotstack 요청 로그에서 서명 URL 제거 — `lib/shotstack.ts:346`이
  createRender body 전체를 JSON으로 기록해 참가자 원본 영상·intro/outro·BGM의 24시간
  presigned URL을 서명값째로 Vercel 런타임 로그에 평문 노출하고 있었음. 로그 열람
  권한자가 한 줄 복사로 24시간 참가자 영상을 인증 없이 다운로드 가능한 상태.
  asset.src를 어떤 형태로도 참조하지 않는 구조 요약 로그로 교체(트랙 수·클립 수·
  soundtrack 유무·output 4종). destinations는 버킷명·리전 포함으로 제외. (01b80f3)
- docs: 2026-08-06 보안 감사 결과 등재 — HIGH 1건(H-1 XSS 미처리)·MEDIUM 2건·
  LOW 9건 + 쿠폰 3종 수용 결정을 known-issues.md에 등재. clips 보안 규칙 항목은
  게시본 실측으로 해결 확인되어 resolved로 이동. PROJECT.md 규칙 현황을
  2026-05-19 기준에서 2026-08-06 게시본 기준으로 갱신.

## 2026-08-05

- docs: API 에러 응답 키 관례 예외 2곳 등재 + 서버 단독 변경 금지 규약 추가 — 전수 정찰로 `dashboard/create/page.tsx` 외 서버↔프론트 에러 키 불일치 0건 확정(프론트 `err.code` 매치 5건은 전부 Firebase SDK 예외 객체의 `auth/...` 코드로, 우리 API 응답 본문과 무관). 관례 예외 2곳(`api/clips/route.ts:61` = `code`, `api/user/delete/route.ts` = `code`+`message`)은 짝 프론트가 맞춰져 있어 동작 정상 → 코드 미수정, known-issues 등재 + CLAUDE.md 절대 규칙으로 재발 예방.

## 2026-08-04

- feat(beta): 베타 쿠폰 해제 — Toss PG 심사 대기 중 결제 없이 실베타를 돌리기 위한 임시 경로. Firestore `betaCoupons` 화이트리스트(문서 ID = 정규화 전화번호) 조회 후 유효 시 서버가 클라 body의 plan/maxClips/maxClipSeconds를 무시하고 `plan:"paid"·unlocked:true·unlockedBy:번호·maxClips:20·maxClipSeconds:30` 고정 저장. 생성 성공 후 쿠폰에 `used:true`+`eventId` 기록(단일 사용). 렌더 게이트를 `plan==="paid"` 무조건 차단에서 `plan==="paid" && !unlocked`로 교체(결제 성공 시 같은 unlocked 필드를 켜는 방식으로 승계). 파일 4개: api/events/route.ts, api/render/start/route.ts, dashboard/create/page.tsx, lib/events.ts. (b0e7988)
- fix(upload): 게스트 초대 화면 문구 정리 — 이벤트 문서 ID 노출 제거, 안내 문구의 제목 접미사("영상입니다") 중복 해소(제목은 h1 단독 노출), 이름 입력 안내에 닉네임 허용 문구 추가.
- fix(create): 이벤트 생성 에러 처리 정합화 — 서버 에러 응답 키를 error로 통일(L107만 code였음), 프론트가 읽는 키를 맞추고 INVALID_COUPON·COUPON_ALREADY_USED 사용자 메시지 매핑 추가, catch에 console.error 보강. 라벨 "갯수"→"개수" 표기 정정 + 한글 라벨 자간 국소 해제.
- fix(guest): 게스트 화면 가독성 보정 — 업로드·공유 화면 스크림 농도 0.55~0.75 → 0.78~0.90 상향(밝은 배경 사진 구간에서 제목이 배경에 묻히던 현상 대응), 업로드 안내 문구에 break-keep 적용으로 한글 낱글자 줄바꿈 해소.
- fix(guest): 게스트 화면 제목 색 직접 지정 — layout.tsx의 data-theme="dark"가 h1.display에 적용되지 않아(DevTools 계산값 rgb(26,22,18) 확인) 어두운 스크림 위에 검은 제목이 표시되던 문제 처치. 같은 화면 본문은 정상(흰색)이라 제목 2곳만 인라인 color 지정. 근본 원인(변수 상속 체인 단절)은 미확정, known-issues 등재 예정.
- docs: DECISIONS 인덱스 market-product 항목 수 정정(14 → 16) — 기존 1건 드리프트 동시 해소. 세는 규칙은 "## 헤더 개수"로 확정.
- docs: DECISIONS 인덱스 항목 수 드리프트 정정 — rendering 38→40, legal 2→3, misc 6→7. 9개 영역 전수 실측 대조로 확인된 잔여 3건(모두 인덱스가 실제보다 적은 방향). 세는 규칙은 "## 헤더 개수"(날짜 헤더 1줄 = 1항목, 괄호 번호는 미반영).

## 2026-07-12

- feat(ui): done 화면 "이전 완성본" 섹션 — `videos[]` 이력을 presigned 목록으로 노출(날짜 + 다운로드). 현재 완성본(`videoS3Key`)은 제외, `doneAt` 내림차순. `host/events` GET에 `previousVideos` 응답 필드 추가(개별 presign 실패는 해당 원소만 제외하고 진행). 재생 버튼·인라인 플레이어 없음(이전 버전 수요의 본질은 "확보"라 판단, YAGNI). `previousVideos`는 optional + 옵셔널 체이닝(5초 폴링 중 필드 부재 시 `undefined.length` 크래시 방지). (3060532)
- feat(video-history): 완성본 이력 배열 `events.videos[]` 도입 (D2) — 재렌더 시 `videoS3Key` 단일 필드가 덮어써져 이전 완성본이 소실되던 구조 정정. `check-rendering` done 전환 시 `arrayUnion`으로 이력 누적 + `videos[]` 도입 이전 done 이벤트 백필(기존 `videoS3Key`가 배열에 없으면 함께 적재 → 고아 방지). `cleanup`은 원소별 `doneAt` 기준 7일 개별 만료. `user/delete`는 탈퇴 시 전 원소 삭제. `videoS3Key`/`renderDoneAt`는 "현재 완성본" 포인터로 유지(읽는 곳 5군데 무변경), `videos[]` 없는 옛 문서는 단건 로직 폴백. Firestore 제약: `arrayUnion` 원소에 `serverTimestamp()` 사용 불가 → `Timestamp.now()`. 결정: decisions/data-flow.md 2026-07-12. (a315b05)
- fix(cleanup): 완성본 7일 만료 시 S3 객체 실제 삭제 — Track ⑦(2026-06-11) 완성본 출력지 이전(Shotstack CDN → 자체 S3) 시 cleanup의 삭제 대상이 옛 위치에 남아, S3 완성본이 한 번도 만료되지 않고 누적되던 드리프트 정정. 개인정보처리방침 제3조 "완성본 7일 후 삭제" 선언-동작 불일치 해소. S3 삭제 성공 시에만 `videoS3Key`를 null 처리(실패 시 포인터를 보존해 다음 cron이 자동 재시도 → 고아 방지). (33430b6)
- chore(s3): D2 이전 구조가 만든 고아 완성본 11개(0.322GB) 일회성 삭제. 참조 집합(`videoS3Key` + `videos[].s3Key`) 재계산 후 S3 루트 `*.mp4`만 대상, prefix 하위(`audio/`·`events/`) 원천 제외. 성공 11 / 실패 0, 보존 1건(참조 중). 코드 커밋 아님(운영 작업).

## 2026-07-10

- feat(rerender): done 상태 재렌더 버튼 + 재렌더 확인 모달 추가 — 완성(done) 상태에서도 "영상 다시 만들기" 노출(기존엔 closed에서만), done·closed 공용 확인 모달을 거치도록 통일. 모달에 "전체 N개 중 M개 포함" 요약 + 인라인 클립 재선택·인트로/아웃트로 변경 안내 문구. includedCount===0이면 [다시 만들기] 비활성(서버 NO_CLIPS_AFTER_EXCLUSION 도달 전 차단). 결제 게이트(B5 재렌더 유료)는 결제 트랙(Toss v2)에 남김 — 이번 스코프 제외. handleRestartRender/callRenderStart 본문·FGT 유료 가드·클립 토글 API 무변경. 대상 파일 1개: src/app/dashboard/events/[eventId]/page.tsx.

## 2026-07-03

- feat(signup): 가입 폼 완주율 카피 — 필드 안내(이메일·이름·전화) + 만19세 맥락 + 제목 정리(Host eyebrow 제거·무료 테스트 부제) + 버튼 "무료로 시작하기".
- feat(dashboard): 빈상태를 셀프 테스트 여정 안내로 확장 — 긍정형 제목(5분이면 완성본까지) + 4단계 여정 스트립(이벤트 만들기→QR 스캔→촬영→완성본 확인) + 보조 문구(혼자 한 바퀴).
- feat(create): 이벤트 생성 카피 — 버튼 "이벤트 시작하기" + QR 완료 화면 안내 문구 통일(공유해 영상을 모으세요).
- feat(event-dashboard): 카피 — QR 안내 문구 통일(공유해 영상을 모으세요) + 선택옵션 섹션에 대기중 유도 문구(참가자 영상을 기다리는 동안 인트로·아웃트로·음악·색감).
- fix(dashboard): 빈상태 여정 스트립 시각 보강 — 단계 세로 정렬(뱃지 위·라벨 아래) + 단계 사이 화살표(인라인 SVG, FlowStrip 비결합) 추가로 흐름 가독성 개선.
- feat(dashboard): 빈상태 시각 완성 — 반투명 결혼식 사진 배경(empty-state-wedding.png, blur 3px) + 흰색 오버레이 80% + 라벨 줄바뀜 수정(고정폭 w-16 제거·break-keep).
- fix(dashboard): 빈상태 사진 배경 blur 제거 — 인물 형체 노출(흰색 오버레이 80% 유지). blur(3px)·scale(1.05) 속성 삭제 + stale 주석 정리.

## 2026-06-27

- feat(landing): 히어로 재구성 — 카피 전면 교체("LIVE·AI 영상 메이커" 폐기 → "이 순간을 영원히, 영상 방명록" + "QR 스캔→촬영→행사 영상 완성" 배지), 상단 시작하기·1분 데모 버튼 삭제(CTA 1개로), 완성본 demo.mp4를 가로 16:9 폰 목업(.hero-demo-phone)으로 히어로 인라인 + 음소거 토글(.hero-mute-toggle) 추가, LIVE·EDITING 과정 영상(vid-main)을 How it works로 이동, .howto 높이 잠금 해제. www.congre.kr 배포(랜딩 git 외부 트랙). 핸드오프 docs/handoff/2026-06-27-landing-hero-redesign.md.

## 2026-06-22

- chore(agents): 4개 에이전트 description에 트리거 케이스 명시 + 능동 위임 신호 부여(axe만 제외, 승인 게이트 강조). CLAUDE.md 학습 룰에 "에이전트 라우팅 빠른 참조" 표 추가. description 자동위임 매칭 시운전 4/4 의도대로 통과. 커밋 2484105(description) + 본 커밋(문서).

## 2026-06-18

- feat(security): `firestore.rules` clips 완전 차단 + events create hostId 강제·update 잠금. `clips` 블록을 `read, create, update, delete: if false`로 일원화(모든 clip mutation은 Admin SDK 경유라 클라이언트 직접 update/delete 잠가도 정상 기능 영향 0). `events.create` 조건에 `request.resource.data.hostId == request.auth.uid` AND 추가(인증 사용자가 타인 uid를 hostId로 박는 경로 차단). `events.update`는 `if false`로 잠금(events 갱신은 전부 `/api/host/events/[eventId]` PATCH Admin SDK 경유 확인). notifications·users 블록 미접촉. ★ 콘솔 게시(Firebase Console Rules 탭)는 운영자 수동 단계 필요.
- feat(security): presign·clips/check 라우트에 sessionToken·호스트 ID 토큰 검증 추가. `/api/upload/presign` POST가 (a) 이벤트 존재 확인 + fileName 화이트리스트(`/^[A-Za-z0-9._-]+$/`, path traversal 차단) + kind별 확장자 화이트리스트(clip=mp4/mov/webm, thumb=jpg, intro/outro=제한 없음) 공통 가드 통과 후 (b) clip/thumb는 body `token` === `events.sessionToken` + `status==="open"`을 검증, (c) intro/outro는 `verifyIdToken` + `events.hostId === uid` 검증. `/api/clips/check` GET은 `?token=` 필수, sessionToken 일치 + 이벤트 존재 확인. `src/lib/s3.ts` getPresignedUrl 시그니처에 `auth?: { sessionToken?; idToken? }` 인자 추가 + 비ASCII 파일명 클라이언트 sanitize(`_`치환). 호출부 4곳 정합: upload 페이지 clip(L281)·thumb inline(L292)·clips/check(L204)는 urlToken 동봉, dashboard 페이지 intro(L622)·outro(L660)는 `getIdToken()` 동봉. 모든 catch 블록 `console.error` 부착.

## 2026-06-17

- docs(design): CLAUDE.md·PROJECT.md 디자인 토큰을 라이트 테마 globals.css 실값으로 동기화 — 배경 #f4f1ea, 액센트 주황 #E8794A(골드 폐기), 본문 폰트 Pretendard, bgflow 그라데이션·.glass-panel·[data-theme=dark] 스코프 반영.
- feat(seo): /share 완성본 공유 링크 OG 이미지를 /upload와 동일한 /api/og-image 프록시로 전환 — 인트로 이미지 있으면 노출, 없으면 og-image.png 브랜드 카드 폴백. 기존 logo.png 직접 참조 교체 + appUrl 상대경로 위험 제거.
- feat(seo): 초대 링크 OG fallback 이미지를 로고→브랜드 카드(og-image.png)로 교체. 인트로 이미지 없는 초대 링크의 카톡 미리보기 개선. public/og-image.png 신규(랜딩 deploy/images에서 복사), api/og-image/[eventId] FALLBACK_URL 변경.
- feat(fgt): FGT용 무료 전환 — 유료 라디오 비활성화 + "준비 중" 표시(`dashboard/create`) / `render/start` paid 가드(`PAID_NOT_AVAILABLE` 403, console.error 로깅) + 호스트 안내 분기(`events/[eventId]`: "유료 플랜은 현재 준비 중입니다.") / `signup` 19세 자가신고 체크박스(`ageAgreed`, canSubmit 필수).

## 2026-06-14

- feat(render): BGM 끊김(soundtrack loop 미지원) 해결 + 캡션 어긋남 동시 수정. timeline.soundtrack 단일 슬롯을 audio clip 0.5s 겹침 직렬 트랙으로 대체. probe(`/{stage|v1}/probe`)로 BGM·비디오 intro/outro 길이 측정 후 totalDuration = clipsTotal+introLen+outroLen 산출, 그 끝까지 N개 조각 직렬 배치. 비디오 intro 길이를 알게 되어 `captionStartOffset` 분기에 video 케이스 추가(이름 자막 어긋남 해소). probe 실패 시 기존 soundtrack 동작으로 폴백(회귀 안전). 변경: `src/lib/shotstack.ts`(probeDurationSec export 추가, createRender 시그니처에 mediaDurationSec/bgmDurationSec 옵션 추가, soundtrack 블록 교체, captionStartOffset 분기 확장), `src/app/api/render/start/route.ts`(probe 3개 병렬 호출 + createRender 인자 전달). 결정: decisions/rendering.md 2026-06-14.

## 2026-06-13

- feat(plans): 무료 플랜 클립 수 10→5 (`PLAN_CLIP_LIMITS.free`). create 폼 desc·guide/host 플랜 문구 동기화. guide의 폐기된 소/중/대 플랜 줄은 계산식 안내로 교체. 가격 모델 전환은 market-product.md 2026-06-13 (7).
- fix(ui): 이벤트 상세 옵션 카드 2개 `.panel` 면 복원 — 0fd28eb 투명화로 배경 장식 비쳐 흐려진 것 정정 + 안내문 inline `opacity: 0.7` 제거. `.panel` 신설(surface-1 + 약한 보더 + padding 24px). QR·완성영상 카드는 b안 투명화 유지.
- refactor(ui): 박스 리디자인 — `.card`/`.row` 투명화(여백만), `.notice` 강조 박스 신설. 경고/안내 11곳 + 모달 2곳 = 13건을 `.notice`로 교체. 가이드 본문·옵션 섹션·결과물 카드 등 15건은 `.card`로 유지(정의 투명화로 자동 반영). 모달은 `.notice`로 박스 보존. 근거·범위: decisions/misc.md 2026-06-13.
- fix(ui): 게스트 촬영 안내 + 호스트 인트로/아웃트로 안내에서 "가로로 찍으면 양옆이 잘려요" 문구 제거. contain 전환으로 잘림 사라져 사실 불일치였음. "세로 권장" 헤더만 유지.
- fix(render): 클립 fit `"crop"` → `"contain"` 전환 — 참가자 영상 + 인트로/아웃트로 미디어 모두. 가로 클립이 세로 캔버스에서 양끝 잘리지 않고 비율 유지된 채 전체 노출(위아래 레터박스, 배경 `#0c0b09`). 06-12 cover→crop 전환의 후속.
- refactor(ui): AppHeader 공용 컴포넌트 추출 — 대시보드 nav 4곳(dashboard, create, events/[eventId], mypage) 로고+컨테이너 중복 제거. 우측 메뉴는 children 유지. 그룹 B/C 미접촉. (32e1b7a)

## 2026-06-11

- fix(infra): IAM 정책 shotstack-s3-write에 shotstack-api-v1-output GetObject 추가 — Track ⑦(Shotstack→S3 복사 AccessDenied) 해결
- docs(handoff): 2026-06-11 ⑦ 해결 + 렌더 복구 검증 + 품질 결함 핸드오프

## 2026-06-03

- feat(seo): 초대 페이지 `/upload/[eventId]` OG 이미지 추가 — `/api/og-image/[eventId]` 프록시 라우트가 events.introMediaType==="image"일 때만 S3 객체 바이트 직접 서빙(presigned 없이 비공개 버킷 유지), 그 외(영상·미설정·실패)는 `/logo.png`로 302 fallback. layout.tsx generateMetadata에 openGraph.images/url/type + twitter.card=summary_large_image 추가. OG URL은 app.congre.kr 하드코딩(known-issues 갱신 사유 참조).

## 2026-06-02

- docs: 운영 모니터링·한도/비용 점검 문서(docs/ops/monitoring.md) 추가 + 프로젝트명(congre)·Firebase Blaze·cron(Vercel Cron Pro)·Shotstack CDN 항목 정정 (2026-06-02)

## 2026-06-01

- feat(seo): 게스트 초대 링크(`/upload/[eventId]`)에 서버사이드 동적 OG 카드 추가 (`layout.tsx` 신규 `generateMetadata`). 카카오·SNS 미리보기 카드에 호스트 이름·행사 이름 노출. events.title + users.name 2회 Admin 조회, hostName 12자·title 20자 초과 시 절단.
- feat(ui): 게스트 업로드 화면 uploader 단계 첫 방문(!isReturning)에 4단계 흐름 안내 스트립 `FlowStrip` 추가 (이름·번호 → 촬영 → 올리기 → 링크 받기). 인라인 SVG 4종 + 화살표, 외부 패키지·전역 CSS 클래스 의존성 0.
- feat(api): 게스트용 `GET /api/events/[eventId]` 응답에 `hostName` 필드 추가 (users 컬렉션 `name`만 join, 다른 PII 비노출).
- feat(ui): 게스트 업로드 화면 uploader 단계 첫 방문 문구 교체 — 호스트 이름·행사 이름·요청 영상 길이 노출 + 입력 정보 사용 목적 안내.
- refactor(ui): 게스트 uploader 첫 방문 문구 압축(호스트 이름 1회·길이 안내 1줄·정보 사용 목적 1줄) + 입력칸 아래 "같은 이름+전화번호로는 한 번만…" 사전 안내 삭제 (검증 에러 메시지로 충분).
- feat(render): 무료 플랜 완성본에 "made by Congre" 워터마크 트랙 추가 (rich-text, Cormorant Garamond italic, 우하단, opacity 0.40, 최상단 레이어).

## 2026-05-31

- feat(app): 앱 내 좌상단 로고 12곳 + "← 홈" 류 홈 버튼 6곳을 외부 랜딩 `congre.kr`로 연결 (`<Link href="/">` → `<a href={LANDING_URL}>`). 회원 탈퇴 직후 이동도 `/` → `/host`로 명시 (마케팅 랜딩 아닌 로그인 화면). 신규: `src/lib/constants.ts` `LANDING_URL`.
- refactor(app): 본 앱 루트 `/` 옛 랜딩 제거, `/host` 서버 리디렉트로 교체 (`next/navigation` `redirect()`). `LandingParticles` / `LandingSparkles` / `LandingHeroVideo` 3개 컴포넌트 삭제. 외부 랜딩 `congre.kr`로 일원화. 전역 `<Link href="/">` 19곳은 그대로 (host 거쳐 정상 동작).

## 2026-05-29

- 워터마크 정책 결정 (무료 박음/유료 제거) + 무료 플랜 사양 공식화 (클립 길이 10초 / 수 10개) — 코드 변경 없음, docs만. decisions/market-product.md 2026-05-29 (3)

## 2026-05-28

- feat(api): /api/lead 리드 수집 엔드포인트 (가격 페이지 폼 → Resend → 운영자 메일)
- feat(api): emailChannel reply-to 지원 (어댑터 확장)
- feat(landing): /pricing 가격 페이지 + 리드 수집 폼 (cleanUrls, nav·footer 연결)
- docs: B 트랙 결정·known-issue 정식 반영
- decision: A 트랙 가격 정책 결정 (B5 빈칸 채우기 — 사진 가격대 기준, 세그먼트 차등 없음, 커스텀 상담 트랙 신설, 워터마크·PG 보류)
- decision(rendering): D1에 B5 갱신 메모 추가 (7일 누락 정정)

## 2026-05-22

- docs(claude): CC 보고 메타 코멘트 금지 룰 추가 (격상 처리)
- fix(ui): 이벤트 생성 폼 초기 영상 길이 10초 (free 플랜 정합)
- feat(ui): 이벤트 생성 폼 플랜별 영상 길이 분기 + 자물쇠 잠금 표시 (무료 플랜 15·20·25·30초 비활성)

## 2026-05-21

- decision: B5 가격 정책 (S5 모델: 첫 렌더 유료 + 재렌더 매번 유료) + D2 사양 재작성 (B5 반영)
- chore: S4-09 D2 진입 전 데드코드 정리 (renderDoneAt 타입 추가 + updateEventRender 제거 + draftVideoUrl 제거)
- fix: 회원 탈퇴 차단 범위에서 closed 상태 제외 (데드락 해소)

## 2026-05-20

- docs: P3d 이메일 발신 도메인 DNS 검증 완료 확인 — Gmail 도달 실측 + Firebase Auth 인증 메일 noreply@congre.kr 통합 확인 + 회원 탈퇴 데드락 known-issues 등재
- S2-04 P4 마이페이지 회원 탈퇴 (Admin SDK 일괄 삭제, 진행 중 이벤트 마감 요구, 약관·처리방침 v0.2)
- S2-04 P3 마이페이지 비밀번호 변경 (reauthenticate + updatePassword, show/hide 토글)
- feat: S2-04 P2 완료 (마이페이지 프로필 수정 — name·phone + Firestore users update 규칙)
- feat: S2-04 P1 완료 (마이페이지 골격 + 이벤트 요약 + 프로필 표시)

## 2026-05-19

- feat(auth): 이메일 인증 차단 흐름 (P3a) — Firestore email_verified 조건 추가 + EmailVerificationBanner + 대시보드 이벤트 생성 버튼 비활성 + /dashboard/create 미인증 리디렉션 (커밋 bada6d0)
- feat(auth): 이메일 인증 Custom Action URL + /verify-email 페이지 (P3b) — Firebase actionCodeSettings + applyActionCode + Suspense 래퍼 + useRef 이중 실행 가드 (커밋 08be31f)
- chore(firebase): congre.kr 이메일 발신 도메인 커스텀 설정 완료 (P3d) — DNS TXT SPF·TXT verification·CNAME DKIM ×2 등록 + Firebase Console Templates Action URL 설정
- iOS Safari capture 480p 사고 처리 (옵션 B) — iPhone 검출 시 즉석 촬영 버튼 숨김, 갤러리 전용 흐름 + iOS 정책 안내 문구

## 2026-05-18 v1

- docs: PROJECT.md / DECISIONS.md / known-issues.md 현 코드 상태와 동기화 (자동 첨부 자료 stale 발견 후 정상화)
- rules: CLAUDE.md Kickoff 룰 6번 신설 (핸드오프 2개 교차 검증 의무) + 핸드오프 파일 명명 규칙 명시

## 2026-05-17

- chore(rules): add "운영자 기억 의존 신호 = CC 정찰 병렬 트리거" to CLAUDE.md (2026-05-17 사양 C 검증 사고 사례)

## 2026-05-16

- docs(PROJECT): 디자인 토큰 표 동기화 (--border, --accent-bright 추가, --font-display italic 표기 정정, 폰트 정의 위치 메모 추가)
- chore(rules): add "단편 단서로 전체 단정 금지" rule to CLAUDE.md
- chore(rules): add "사양 외 자체 판단 명시" rule to CLAUDE.md
- docs: 호스트 가이드 STEP 02 클립 길이 항목 추가 + PROJECT.md 사양 A·B·C 동기화
- docs: 게스트 가이드 STEP 02·03 통합·재작성 (native capture 흐름 반영) + 랜딩 STEP 라벨 동기화
- fix(upload): 업로드 idle 화면 촬영 시간 안내 가독성 강화 (text-xs + opacity-60 → text-sm)
- fix(upload): 안드로이드 Chrome 14/15 갤러리 직행 사고 정정 — 카메라/갤러리 두 input 분리
- feat: Shotstack 클립별 length 동적 계산 (사양 C, native capture 전환 3단계)
- feat: 참가자 upload 페이지 native capture 전환 + duration 측정·저장 (사양 B, native capture 전환 2단계)
- feat: events 모델에 maxClipSeconds 필드 추가 (사양 A, native capture 전환 1단계)

## 2026-05-15

- upload 페이지 getUserMedia constraints에 width/height 1080×1920 ideal 추가 + MediaRecorder videoBitsPerSecond 5Mbps 명시. 참가자 영상 480p 압축 → 1080p 캡처로 전환 (가설 A 처방).
- feat(shotstack): output에 fps 30 + quality high 명시 (단가 무영향, 압축 아티팩트 완화)
- feat(guide): 사용 가이드 페이지 3종(/guide, /guide/host, /guide/guest) 신설 + 랜딩 미리보기 섹션 + 푸터 링크

## 2026-05-14

- fix(share): /share/{eventId} 재도입으로 카카오 공유 fallback 사고 해소 (regression of d74152e)
- chore: 외부 서비스 인벤토리 정찰 + 실전 테스트 전 사전 차단 액션 (Firebase Blaze 전환, SOLAPI 충전, GitHub Public 유지 결정)
- refactor: Track 4 강화 — 배경 토큰 추가 명도 상향(#1f1c18/#2a261f/#34302a), Primary 버튼 그라디언트 강화(from-[#f5b04a] to-[#a06f1f] + shadow 입체감 풀세트 + glow-accent 제거), 헤일로 4곳 opacity-25·ellipse 100% 90%로 강화
- feat: 배경 토큰 명도 조정(bg/surface/surface-2), Primary 버튼 gradient 통일(from-accent-bright to-accent), 헤일로 효과 3페이지 확산(host·upload standby·events done)

## 2026-05-12

- refactor: 초대장 기능 전체 제거 — /invite, /share 페이지 삭제; 대시보드 초대장 섹션(환영 문구·커버·갤러리) 제거; welcomeText/coverImageUrl/galleryUrls 필드 제거; 카카오 공유 링크 → 영상 직링크
- feat: 인트로/아웃트로 미디어 업로드 안내에 10초 권장 문구 추가 (accent 강조)
- refactor: outroText overlay 폐기 — [A] 분기 cross-track 동기화 한계 해소. probe API 도입 폐기(WebM duration 미반환 + 비용 미확증). introText overlay 보존. 사고 2①·2③ 해소
- refactor: shotstack multi-track 구조 도입 — 인트로/아웃트로 미디어(사진 5초/영상 원본) + 텍스트 overlay(fade transition + stroke + 반투명 박스). createRender 시그니처 변경(intro/outro 객체 인자). 단일 track 분기는 기존 동작 보존
- feat: 대시보드 인트로/아웃트로 업로드 UI + 텍스트 편집 — introText/outroText(60자) 저장 버튼, intro/outro 미디어(이미지·영상, 10MB) 업로드·미리보기·삭제; GET/PATCH API 6필드 확장(introText/introMediaKey/introMediaType/outroText/outroMediaKey/outroMediaType); invite-urls 응답에 introMediaUrl/outroMediaUrl 추가

## 2026-05-11

- feat: 대시보드 QR/링크 target을 invite 콘텐츠 유무에 따라 분기 — welcomeText·coverImage·gallery 중 하나라도 있으면 /invite, 없으면 /upload로 연결
- fix: 초대장 이미지 표시 방식 변경 — 공개 URL 대신 S3 키 저장 + presigned GET URL(1시간) 변환 (버킷 비공개 정책 403 수정)
- feat: 대시보드 초대장 작성 섹션 — welcomeText·커버·갤러리(최대 4장) 입력 UI + 이미지 즉시 업로드 + welcomeText 저장 버튼
- feat: PATCH /api/host/events/[eventId] — 초대장 필드(welcomeText, coverImageUrl, galleryUrls) 부분 업데이트 API 추가
- feat: presign 라우트에 kind 파라미터 추가, S3 prefix 분리 (events/{id}/{kind}/...)
- revert: welcomeText 입력을 이벤트 생성 폼에서 제거 (대시보드 초대장 섹션으로 재배치 예정)
- feat: /invite/[eventId] 초대 페이지 신설 (status 분기 + OG 메타 + 빈 필드 redirect)

## 2026-05-10

- docs: split DECISIONS.md into 8 area files (rendering / notifications / auth-model / legal / market-product / infra / data-flow / misc), keep root as index
- docs: split resolved issues from known-issues into known-issues-resolved (28 → 13 + 15)
- docs: add suspended.md for parked issues (legal v0.1, entry A/C)
- feat(cleanup): 자동 삭제 cron 추가 (클립 24h / 완성본 7d, KST 03:00 daily)
- fix: render-started/completed 알림 발송 후 Firestore 플래그 set 누락 수정
- feat(notify): 참가자 결과 SMS 트리거 연결 (PR 2)
- refactor(uploader): 닉네임 → 이름+전번 사양 전환. uploader stage·API 4개·대시보드·organizerPhone 검증 정합화.
- docs(legal): 이용약관·개인정보처리방침 페이지 추가 (v0.1) — /terms, /privacy 본문 작성 + 푸터 © 표기 정정
- fix(legal): privacy 제5조의2 AWS_S3_REGION 자리표시자 → ap-southeast-2 정정

## 2026-05-09

- feat(legal): 약관·개인정보 처리방침 페이지 골격 신설 — /privacy, /terms 라우트 추가. 콘텐츠는 임시 placeholder, 운영자가 채울 예정. 랜딩 푸터에 링크 추가.
- fix(admin): getAdminDb() settings() 중복 호출 가드 — SSR 서버 컴포넌트(generateMetadata + SharePage) 모듈 격리 환경에서 같은 Firestore 객체에 settings() 두 번 호출 시 throw 발생. try/catch로 "already initialized" 에러만 무시, 그 외 에러는 re-throw.
- feat(share): /share/{eventId} 공유 페이지 신설 — SSR 서버 컴포넌트, og 메타태그(generateMetadata), 상태별 화면 분기(done/준비 중/notFound), 카톡·링크복사 버튼(ShareActions 클라이언트 컴포넌트), BrandName 푸터
- fix(share): 호스트 대시보드 카톡 공유 link.webUrl을 cdn.shotstack.io → /share/{eventId}로 변경 — 카카오 콘솔 미등록 도메인 fallback 사고 해소
- fix(render): 영상 편집 클립 순서 오름차순 정렬 (uploadedAt 기준) — Phase B-3 (de6551b) 회귀 수정. render/start에서 uploadedAt 오름차순 sort 추가, shotstack.ts .reverse() 제거
- fix(email): render-completed "영상 확인하기" 버튼을 videoUrl(CDN 직접 링크)로 변경 — 미인증 수신자도 바로 영상 확인 가능, 기존 "영상 직접 링크"는 "대시보드 열기"로 교체
- feat(landing): 히어로 영상 unmute 버튼 추가 — 기본 무음 유지, 클릭 시 소리 토글 (VolumeX/Volume2 아이콘, LandingHeroVideo 클라이언트 컴포넌트 분리)
- fix(camera): 후면 카메라 표준 wide 자동 선택 — iOS 라벨 매칭("후면 카메라"/"Back Camera"), Android는 두 번째 facing back 디바이스 선택 (pickStandardBackCamera 휴리스틱)

## 2026-05-08 — 한글 인트로/아웃트로 기능 추가

- feat(fonts): NotoSansKR-Regular.ttf 추가 — /public/fonts/ 호스팅, Shotstack rich-text 폰트 소스 (SIL OFL)
- feat: 한글 인트로/아웃트로 입력 UI + API — 이벤트 생성 폼 필드 추가, POST /api/events 저장, CongreEvent 데이터 모델 introText/outroText 추가
- feat(shotstack): rich-text 클립 렌더 파이프라인 연결 — createRender에 인트로(start:0)/아웃트로(start:auto) rich-text clip + timeline.fonts 주입; fix: width/height 미지원 필드 제거 (37afdb8)

## 2026-05-08

- feat: [영상 생성 다시 시작] 버튼 — 마감 후 클립 제외 해제하고 재시도 가능 (행사 당일 클립 복구 경로)
- fix: handleClose render/start 응답 미체크 silent fail 픽스 — 에러 코드별 사용자 메시지 분기
- feat: 클립 제외/복원 기능 — 호스트 대시보드 토글 버튼, PATCH /api/clips/[clipId], render/start JS 필터, 제외 클립 시각적 dimming

## 2026-05-06

- chore(security): Firestore rules 잠금 — events read if false, clips read/create if false (Admin SDK 전용, Client SDK read 의존 제거 완료) (Phase B-3 2단계 커밋 4)
- refactor(dashboard): 실시간 구독 3개 → polling/단발 fetch — Client SDK Firestore read 의존 제거, Timestamp ms 기반, 탭 숨김 시 polling 중단 (Phase B-3 2단계 커밋 3-2)
- refactor(api): /api/render/start eventId 기반 — 서버에서 clips 직접 read, body { eventId }만, 빈 clips 가드 (Phase B-3 2단계 커밋 3-1)
- feat(api): GET /api/host/events/[eventId] + /api/host/clips — 호스트 전용 polling route, Bearer 토큰 인증, hostId 소유권 검증 (Phase B-3 2단계 커밋 2)
- feat(api): GET /api/events 신설 — 호스트 이벤트 목록 서버 route, Bearer 토큰 인증, createdAt desc 정렬, Timestamp → ms 직렬화 (Phase B-3 2단계 커밋 1)

## 2026-05-05 (2)

- feat: /api/cron/check-rendering 신설 — 5분마다 rendering 이벤트 Shotstack 상태 조회, 완료 시 Firestore 업데이트 + 알림 발송
- refactor(dashboard): 클라이언트 30초 폴링 → Firestore onSnapshot 실시간 수신으로 교체, /api/render/complete 클라이언트 호출 제거
- chore(render/complete): 서버 cron 이전으로 dead endpoint 잠금 (401 반환)
- chore(ci): .github/workflows/cron-check-rendering.yml 추가 (5분 간격)

## 2026-05-05

- chore: 사용되지 않는 Clip.durationSec 필드 제거
- refactor(shotstack): Smart Clips로 전환 (start/length: "auto") — 클라이언트 duration 측정 코드 원복, 길이 측정은 편집 도구 책임 원칙 적용, 실제 렌더 테스트로 동작 검증 완료
- fix(render): 클립별 실제 재생 시간 사용 — CLIP_MAX_SEC 10초 고정값 제거, 클라이언트 loadedmetadata 측정값 → Firestore → render/start → createRender 전달, 정지 화면 패딩 문제 해결

## 2026-05-04

- chore(ci): cron 빈도 매분 → 5분 간격 변경 (GitHub Actions throttling 회피)
- fix(build): test/notify-render-started 라우트 제거 — RenderStartedCtx 인터페이스 변경 후 미사용/미동기화 상태
- chore(ci): GitHub Actions 워크플로 추가 (.github/workflows/cron-check-deadlines.yml) — `* * * * *` 스케줄로 /api/cron/check-render-deadlines 호출, APP_URL + CRON_SECRET GitHub Secrets 사용 (TODO [6])
- fix: render/complete에서 notifyRenderCompleted에 refundStatus 전달 추가 — 환불 발생 시 완료 이메일 환불 블록 표시
- feat: /api/cron/check-render-deadlines 신설 — render_delayed/refund_50/refund_100 시간 조건 점검 + 멱등성 플래그 기록, CRON_SECRET Bearer 인증, 순차 처리(for...of)
- feat: render_delayed 재설계 알림 템플릿 5종 정비 — render-started(E 동적화), render-delayed(재설계), refund-50(신규), refund-100(신규), render-completed(refundStatus 조건부 블록)
- refactor: render/complete에서 구 isDelayed 분기 제거 → notifyRenderCompleted 단일 호출
- chore: CONGRE_INTERNAL_PHONE env var 코드 준비 (TODO [6] — 실제 번호 미등록)

## 2026-05-03

- chore: congre.kr 도메인 가비아 등록 완료 (1년)
- chore: Resend 가입 + congre.kr 도메인 인증 완료 (DKIM/SPF/DMARC 4개 레코드)
- chore: SOLAPI 가입 + 발신번호 등록 + API 키 발급 (개인 휴대폰 명의)
- chore: .env.local 6개 변수 입력 (RESEND_API_KEY, EMAIL_FROM, EMAIL_FROM_NAME, SOLAPI_API_KEY, SOLAPI_API_SECRET, SOLAPI_SENDER)
- chore: 알림 시나리오 5/5건 실제 발송 검증 완료 — event_created(이메일), render_completed·delayed·failed(이메일+SMS), render_started(이메일+SMS)
- feat: dev 전용 검증 엔드포인트 추가 — GET /api/test/notify-render-started, 프로덕션 404 보장 (commit bcfe1f3)
- fix: notifications:history — Firestore Admin `ignoreUndefinedProperties: true` 적용, optional 필드 undefined 에러 해결, db 인스턴스 캐싱 (commit bcfe1f3)
- fix: sms.ts — SOLAPI `MessageNotReceivedError.failedMessageList` 상세 사유 콘솔·history.error 출력 (commit 79af076)

## 2026-05-02

- refactor: closeEvent 서버 API 이전 — POST /api/events/[eventId]/close, hostId 주최자 검증 포함, 클라이언트 Firestore 직접 쓰기 완전 제거
- feat: 알림 시스템 도입 — Resend 이메일 + SOLAPI SMS, 시나리오 5건 트리거 연결 (이벤트 생성, 렌더 시작/완료/지연/실패), 시나리오 2건 함수만 구현 (첫 클립 업로드, 참가자 결과)
- feat: POST /api/events 신설 — 서버 사이드 이벤트 생성 + 알림 트리거
- feat: POST /api/render/complete 신설 — 렌더 완료 서버 사이드 처리 + 10분 기준 완료/지연 분기
- feat: events 문서에 organizerEmail, organizerPhone, deadlineAt 필드 추가
- refactor: render/start에서 Firestore 상태 업데이트 서버 사이드로 이전

## 2026-05-01

- chore: 테스트 데이터 정리 실행 — events 32건 + clips 57건 + S3 객체 57건 삭제
- chore: add execute mode to cleanup script with S3 object deletion
- chore: add dry-run cleanup script for test events
- feat: 클립 재생 Pre-signed URL 구현 (firebase-admin 도입)
- docs: 프로젝트 문서화 시스템 도입 (CLAUDE.md 확장, README 갱신, docs/ 신규 4종)
- feat: 랜딩 페이지 파티클 효과 추가 (canvas-confetti burst + ambient CSS sparkles)
