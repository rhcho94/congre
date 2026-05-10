# Decisions — Notifications

> 이메일·SMS·알림 시나리오·채널 정책 관련 결정. 새 결정은 맨 위에 추가 (최신이 위).

## 2026-05-10 — 참가자 결과 알림 채널: SMS 단독 (PR 2 사전 등록)

- **결정**: 참가자 결과 알림(렌더 완료 시 영상 URL 발송)은 SMS 단독. 이메일 채널 없음.
- **이유**:
  - 현재 사양(2026-05-09 "참가자 입력 사양 변경") 상 참가자는 이름 + 전화번호만 입력. 이메일 미수집 → 이메일 채널 자동 불가.
  - 2026-05-03 채널 정책은 주최자 5개 시나리오(event_created, render_started, render_completed, render_delayed, render_failed)만 다룸. 참가자 알림은 그 정책 범위 밖.
- **사양 정합**:
  - 본문: `[Congre] '{eventTitle}' 결과 영상이 준비됐어요: {videoUrl}` (SMS prefix [Congre], 이름 호칭 없음 — 한 폰 다중 사용자 케이스 + LMS 전환 회피)
  - 멱등성 키: `events.notifications.participantNotifiedAt` (2026-05-04 nested 패턴 일관)
- **대안 검토**:
  - SMS + 이메일 양채널: 이메일 미수집 → 불가.
  - 이메일 단독: SMS 도달성 우위 + 결혼식·졸업식 당일 즉시성 → 기각.
  - 채널 정책 미등록(자명함으로 처리): DECISIONS grep 시 누락. 사고 진단 비용 → 기각.

## 2026-05-04 — render_delayed 시나리오 정책 확정

### 결정
render_delayed 시나리오를 단일 +10분 알림에서 다단계 시간축으로 재설계한다.
T=0(마감 버튼) → T+E(예상 완료) → T+E+30분(50% 환불 확정) → T+24시간(100% 환불 확정).

### 핵심 정책
1. **T=0 기준점**: 주최자가 "마감하기" 버튼을 누르는 시점 (기존 deadlineAt 활용)
2. **E 산정 공식 (1차안)**: `E = max(15분, 클립수 × 30초 + 10분)`. 필드 테스트 후 조정.
3. **클립 수 소스**: render/start 시점에 클라이언트가 전달하는 s3Keys.length 사용.
   events.clipCount는 참가자(비로그인) 업로드 실패 가능성 때문에 신뢰 불가.
4. **환불 확정의 비가역성**: T+E+30분을 1초라도 넘으면 50% 확정. 이후 완료되어도
   번복하지 않음. 24시간 넘으면 100% 확정 + 영상은 끝까지 완성하여 전달.
5. **환불 처리는 알림만 자동, 실행은 수동**: 카카오톡 채널 @congre로 CS 응대 시 처리.
6. **품질 클레임 미접수**: 별도 결제 동의서에 명시 (별도 작업).
7. **고객 알림 횟수**: 시나리오당 1회 원칙. 중간 리마인더 없음.
8. **사내 담당자 알림**: SMS 이중 발송 (슬랙 도입 시 이전).

### 인프라
- 시간 카운트: GitHub Actions cron (매분 호출). Vercel Hobby 제약 우회.
- 향후 Vercel Pro 업그레이드 시 vercel.json cron으로 이전.
- 새 엔드포인트: `/api/cron/check-render-deadlines` (Bearer CRON_SECRET 인증).

### 데이터 스키마 (events 문서 신규 필드)
- `renderStartedAt`, `renderEstimateMin`, `expectedCompletedAt`
- `refund50At`, `refund100At`
- `notifications.{renderStartedNotifiedAt, renderDelayedNotifiedAt, refund50NotifiedAt, refund100NotifiedAt}` (멱등성)
- `refundStatus: 'none' | 'pending_50' | 'pending_100' | 'processed_50' | 'processed_100'`

### 톤 & 채널
- 알림 톤: 사회성·사과·이해 요청 강조. 서명 "꽁그레팀 드림", SMS prefix `[Congre]`.
- CS 채널: 카카오톡 채널 @congre. 전화는 발신만, 수신 없음.

### 보류·후속
- 유료 결제 동의서에 환불 정책·품질 클레임 조항 추가 (법무·UX)
- 슬랙 워크스페이스 도입 시 사내 알림 이전
- E 산정 공식의 필드 테스트 데이터 수집 후 재조정

### 근거
- 30분 임계값을 "확정·비가역"으로 정한 이유: 자동 알림 후 번복 시 신뢰 손상이
  지연 자체보다 큼. 운영자 수동 판단 단계를 빼서 의사결정 트리 단순화.
- 50% 알림에 환불 즉시 처리를 약속하지 않은 이유: CS 콜 한 번에 처리·소통이
  더 효율적이며, 고객 응대의 인간적 접점도 확보됨.
- GitHub Actions를 단기 선택한 이유: Vercel Hobby에서 매분 cron 불가, Pro 업그레이드는
  필드 테스트 후로 보류된 상태에서 무료·즉시 구축 가능한 외부 cron이 합리적.

## 2026-05-03 — SOLAPI 실패 사유를 history.error에 상세 문자열로 저장

- **결정**: `MessageNotReceivedError.failedMessageList`를 파싱해 `[statusCode] statusMessage (to: 수신번호)` 형식 문자열을 `history.error` 필드에 저장 (B안). commit: 79af076
- **컨텍스트**: SOLAPI가 throw하는 `MessageNotReceivedError`의 `.message`는 "1개의 메시지가 접수되지 못했습니다"라는 안내문 수준. 실제 거절 사유는 `err.failedMessageList[].statusCode + statusMessage`에 있음.
- **대안 검토**:
  - A안: 콘솔 로그만 상세 출력, `history.error`는 짧은 메시지 유지 — 로그는 휘발성이라 사후 추적 불가
  - B안: `history.error`에 상세 사유 저장 **(선택)** — Firestore 콘솔 한 곳에서 사유 확인 가능
  - C안: `history`에 `failureCode`, `failureReason` 별도 필드 추가 — 스키마 변경 비용, 이메일 채널과 일관성 깨짐
- **부가 결정**: `instanceof` 안전성을 위해 `catch` 블록 내 `MessageNotReceivedError` 동적 재import. 모듈 캐싱으로 런타임 비용 없음.

## 2026-05-03 — 알림 시나리오별 채널 정책 (이메일 전용 vs 이메일+SMS)

- **결정**: B안 채택 — 긴급/중요 시나리오만 SMS 추가 발송.
  - `event_created` → 이메일만 (주최자가 화면 보고 직접 만든 직후, SMS는 중복 노이즈)
  - `render_started` → 이메일 + SMS (행사 당일 처리 시작, 문자가 채널 적합도 높음)
  - `render_completed` → 이메일 + SMS (결과물 도착, 즉시 알림 필요)
  - `render_delayed` → 이메일 + SMS (지연 발생, 주최자 인지 필요)
  - `render_failed` → 이메일 + SMS (조치 필요, 5개 시나리오 중 가장 시급)
- **이유**: 결혼식 등 행사 당일에는 이메일 확인이 어색하고 SMS 전달력이 높음. 단, 이벤트 생성은 주최자가 앱을 직접 사용 중인 시점이므로 SMS가 불필요한 알림이 됨.
- **대안**: A안 (전 시나리오 이메일+SMS) — 생성 시점 SMS는 주최자 입장에서 노이즈.

## 2026-05-02 — 이메일 발송 도메인: congre.kr

- **결정**: Resend 도메인 인증 시 `congre.kr` 사용. 발신 주소 `noreply@congre.kr` 또는 `hello@congre.kr`.
- **이유**: 한국 시장 우선 진입. `.kr`이 브랜드 정체성과 일치.
- **대안**: 커스텀 도메인 없이 Resend 기본 도메인 — 스팸 필터 불리, 브랜드 신뢰도 낮음.

## 2026-05-02 — 알림 채널: Resend 이메일 + SOLAPI SMS, FCM 미도입

- **결정**: 이메일은 Resend, SMS는 SOLAPI. FCM 푸시는 이번 단계에서 도입하지 않음.
- **이유**: Congre는 이벤트 당일 1회성 서비스 특성상 푸시 구독 관리 비용 대비 효용이 낮음. 이메일과 SMS는 앱 미설치 환경(iOS Safari 기본 PWA)에서도 안정적으로 전달됨. Resend는 Next.js App Router와 궁합이 좋고 무료 3,000건/월. SOLAPI는 국내 발신번호 등록·LMS 자동 전환 지원.
- **대안**: FCM 푸시 — iOS 16.4+ PWA 푸시 지원되나, 주최자가 별도로 알림 허용 설정 필요. 다음 PR에서 재검토 가능.

## 2026-05-02 — @react-email 대신 HTML 문자열 템플릿

- **결정**: 이메일 템플릿을 `@react-email/components` 대신 `src/emails/*.ts` 의 HTML 문자열 함수로 작성.
- **이유**: `@react-email/components@1.0.12` 가 npm에서 "Package no longer supported"로 deprecated 처리됨 (`npm view` 실측). React Email 팀이 통합 패키지를 버리고 개별 컴포넌트 패키지(`@react-email/html`, `@react-email/body` 등)로 분리했으나, 이 시점에 마이그레이션 경로가 명확하지 않았음. 단순한 트랜잭션 이메일 7개에는 HTML 직접 작성으로 충분하며, Resend는 HTML 문자열을 직접 수용함.
- **대안**: `@react-email/render@2.0.8` (deprecated 아님, 정상 유지보수 중) + 개별 컴포넌트 패키지 조합으로 마이그레이션 가능 — 생태계 안정화 확인 후 검토.
