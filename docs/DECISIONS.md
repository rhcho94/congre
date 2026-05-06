# 기술 결정 기록

> 새 결정은 위로 추가 (최신이 위). 형식: 날짜 / 결정 / 이유 / 대안.

## 2026-05-07 — Cron 이전: GitHub Actions → Vercel Cron, Pro 업그레이드

- **결정**: GitHub Actions schedule cron을 폐기하고 Vercel Cron으로 이전. Vercel Pro 플랜으로 업그레이드 ($20/월).
- **이유**:
  - GitHub Actions free tier에서 `*/5 * * * *` 스케줄이 실측 평균 5시간 간격으로 실행됨 (8시간 동안 12회, 60배 부족). 추가로 runner 할당 실패("The job was not acquired by Runner of type hosted") 발생.
  - render_delayed 정책의 T+E+30분 비가역 임계값은 분 단위 정밀도 필요. 5시간 간격 cron으로는 임계값 자체가 무의미.
  - DECISIONS 2026-05-06 "무료 티어 한계 시 유료 플랜" 정책 적용. 우회 검토 0회.
- **대안 검토**:
  - Shotstack webhook 도입 (cron 유지): 시간 카운트(render_delayed)는 webhook으로 못 함. 보완재이지 대체재 아님.
  - 외부 cron 서비스 (cron-job.org 등): 운영 책임 분산, 1인 비개발자에게 트레이드오프 나쁨.
  - cron 간격 매시간으로 변경: render_delayed 정책 후퇴.
- **인증**: Vercel Cron이 호출 시 `Authorization: Bearer ${CRON_SECRET}` 헤더 자동 주입. 라우트 코드 수정 불필요.
- **정리**: GitHub Actions 워크플로 yml 2개 삭제. GitHub Secrets (APP_URL, CRON_SECRET)는 사용자가 GitHub UI에서 별도 삭제.

## 2026-05-06 — Phase B-3 2단계 완료: events/clips Admin SDK 전용 전환

- **결정**: 대시보드의 Client SDK 실시간 구독 3개(subscribeToHostEvents, subscribeToEvent, subscribeToClips)를 서버 API polling으로 전환. Firestore rules에서 events/clips의 read를 `if false`로 잠금하여 Admin SDK 전용 경로로 통일. 권한 종류가 다른 라우트는 `/api/host/...` prefix로 분리.
- **이유**:
  - PII(sessionToken, organizerEmail 등) 노출을 클라이언트 SDK 의존에서 분리해 서버에서만 필터링 가능.
  - 인증 종류가 다른 케이스(호스트 Bearer vs 참가자 token)는 endpoint를 분리하는 게 OWASP 권장. 한 endpoint에서 인증 종류 분기 시 PII 노출 분기 사고 위험.
  - Polling 5초 + 탭 숨김 시 중단 + visibilitychange 복귀 시 재시작으로 실시간성 큰 손실 없이 보안 표면 축소.
- **대안 검토**:
  - SSE: Vercel 함수 800s 한도 + 재연결 루프 부담 + Vercel docs 권장 사용처 아님 → 기각.
  - 한 endpoint에서 Bearer 유무로 분기 (B 옵션): 분기 실수 시 PII 노출 사고 위험 → 기각.
- **관련 커밋**: 40bc970 (GET /api/events), 0a501b7 (/api/host/events/[eventId] + /api/host/clips), de6551b (/api/render/start eventId 기반), a701572 (대시보드 polling 전환), b2f618d (firestore.rules 잠금 + production 배포).

## 2026-05-06 — 1순위 시장 정의: 학교 졸업식 / 1인칭 짧은 인터뷰

- **결정**: congre의 1순위 시장은 초·중·고 졸업식. 핵심 사용 패턴은 "학생 본인이 폰으로 자기 졸업 소감을 짧게 찍은 클립을 30~100명분 모아 자동 편집".
- **시장 선정 이유**:
  - 폰 소지자 = 학생 본인 → 1인칭 자기 표현 영상 (외부 관찰자가 찍는 결혼식·어린이집과 본질 다름)
  - 현장성 강함 (당일 흥분 상태에서 즉석 인터뷰)
  - 반복 구매 (매년 졸업식)
  - 가격 저항 낮음 (인당 천원 수준, 졸업앨범 5만원 대비. 분식 1번 값으로 학생 본인이 "내 졸업 영상에 내가 들어간다" 가치를 사는 데 결정 부담 거의 없음)
  - 결제 단위 명확 (반 단위 일괄 또는 졸업앨범 끼워서)
- **포지셔닝**: "여러 명이 같은 사건을 자기 입으로 회고한 영상의 집합체". WeddingMix·Vloggi(행사 다큐멘터리)와 다르고, TikTok·릴스(개인 콘텐츠)와도 다른 자리.
- **확장 시장**: 결혼식, 기업 행사, 동창회 등은 보조 시장. 학교 졸업식에서 검증한 기술의 확장 대상.
- **함의**: 미성년자 영상이라 보안·법적 리스크 우선순위 격상. 학부모·교사 사용자 비율 높아 네이버 메일 도달성 격상. (관련 작업은 ROADMAP 참조.)

## 2026-05-06 — 클립 길이 정책: 인당 10초 이내

- **결정**: 사용자 1명이 올리는 클립 길이는 **10초 이내**.
- **이유 (3가지가 동시에 같은 답)**:
  - **콘텐츠**: 짧은 인터뷰는 5~10초가 자연스러움. 30초 넘기면 산만.
  - **원가**: Shotstack은 렌더 시간 단위 과금. 30초 클립 × 100명 = 50분 영상. 10초 × 100명 = 16분 40초. 단가 3배 차이가 인당 천원 가격에 직접 박힘.
  - **시청 완주율**: 5~16분이 SNS 공유·재시청 가능한 길이. 50분짜리는 끝까지 안 봄.
- **하한**: 별도 정책 없음 (필요시 추가 결정).

## 2026-05-06 — 무료 티어 한계 시 유료 플랜으로 진행

- **결정**: Vercel, GitHub Actions, AWS, SOLAPI, Resend, 카카오 등 인프라·플랫폼 무료 티어의 쿼터·throttling·기능 제한에 걸렸을 때, 우회 솔루션 검토 단계를 건너뛰고 유료 플랜으로 해결.
- **이유**:
  - 우회 검토(다른 무료 서비스 찾기, 자체 구현 등)는 시간·복잡도·향후 유지보수 부담을 키움.
  - 1인 비개발자 운영자에게 가장 비싼 자원은 시간. 유료 플랜의 월 비용보다 우회 작업의 시간 비용이 더 큼.
  - 직전 사례: GitHub Actions cron throttling — 무료 티어에서 매분 스케줄이 4시간에 1회만 실행. 우회 검토(외부 cron 서비스, Vercel Cron Jobs 비교) 자체가 부담이었음.
- **적용 영역**: 인프라·플랫폼 한정 (외부 신규 서비스 가입, 비즈니스 모델 영향 결정은 별도).
- **결제 결정권**: 사용자가 플랜·금액 보고 직접 결정. 클로드(채팅·CC)는 "유료 플랜이 표준 답"까지만 제안.
- **트리거**: 작업 중 무료 티어 한계가 막다른 길로 등장할 때 → 클로드는 우회 시도 0회로 두고 유료 플랜 추천 + 사용자 결정 대기.

## 2026-05-05 — 영상 가치 및 강화 방향 정의 (시장 2 안에서)

- **결정**: congre의 영상 가치는 "현장성 + 실제 얼굴이 나오는 것". AI 영상 생성(시장 1, Sora·Runway 등)으로는 가지 않음.
- **강화 방향 6항목**:
  1. 인물 보정 (촬영자 예쁘게)
  2. 배경 정리
  3. 화면 특수효과
  4. 클립 인아웃 효과 (지루하지 않게)
  5. 완성 영상에 코멘트 자막 (사전 입력받은 톤앤매너 기반, 즉석 사회자 스타일)
  6. 인트로/아웃트로 (행사 주최자 입력)
- **컨텍스트**: 트랙 B 편집 엔진 리서치에서 "AI 영상 생성"과 "프로그래밍 가능한 영상 편집"이 다른 시장임을 확인. congre는 후자(시장 2)에 속함.
- **활용**: 이 6항목은 향후 편집 엔진 평가의 체크리스트. 현재 Shotstack에서 어디까지 되는지, 안 되는 게 있으면 어떤 플랫폼이 가능한지가 평가 기준.

## 2026-05-05 — Shotstack Smart Clips로 전환, 길이 측정은 도구에 위임

- **결정**: `createRender`의 클립에 `start: "auto"`, `length: "auto"` 사용. 클라이언트 duration 측정 코드 원복. commit: cad7b58
- **컨텍스트**: 같은 날 ad4a352에서 옵션 A(클라이언트 측정) 적용 후, Shotstack 문서에서 Smart Clips 기능 발견.
- **원칙**: "영상 편집 도구의 길이 측정은 도구의 기본 기능. 우리가 책임지지 않음." 이 원칙은 향후 다른 편집 엔진 평가 시에도 적용.
- **옵션 A 보존**: ad4a352 커밋 히스토리에 보존됨. 별도 archive 불필요. 필요 시 `git show ad4a352`로 복구.
- **검증**: 짧은 클립 3개(약 3·6·9초)로 실제 렌더 테스트 — 결과 영상 길이가 클립 합과 일치, freeze 사라짐 확인.
- **후속 작업**: 사용자에게 예상 편집 시간 안내가 필요하면 Shotstack `/probe` API 활용 (별도 작업).

## 2026-05-05 — 클립 duration을 클라이언트에서 측정해 render/start로 전달 (Option A)

- **결정**: 업로드 페이지의 preview 단계에서 `loadedmetadata` 이벤트로 `video.duration`을 측정. Firestore `clips.durationSec`에 저장 후 `render/start` → `createRender` 전달. commit: ad4a352
- **컨텍스트**: `shotstack.ts`에 `CLIP_MAX_SEC = 10` 고정값이 있었음. 클립이 10초보다 짧으면 마지막 프레임을 freeze해서 완성본이 클립 합산보다 길어지는 문제.
- **대안 검토**:
  - A안: 클라이언트 측정 → Firestore → render/start **(선택)** — 서버는 S3 오브젝트에 직접 접근 없이 duration을 얻을 수 있음. 클라이언트가 측정한 값을 신뢰.
  - B안: 서버에서 ffprobe로 S3 오브젝트 분석 — ffprobe Lambda 또는 외부 서비스 필요, 구현 비용 높음.
  - C안: Shotstack API의 자동 duration 계산 — API 문서상 지원 여부 불확실, 현재 구조에서 검증 어려움.
- **WebM Infinity 처리**: 일부 브라우저에서 MediaRecorder 생성 WebM의 `video.duration`이 `Infinity` 반환. `Number.isFinite(d) && d > 0` 검증 후 실패 시 `lastTimerRef.current`(setInterval 최종 tick 값)로 폴백.

## 2026-05-03 — SOLAPI 실패 사유를 history.error에 상세 문자열로 저장

- **결정**: `MessageNotReceivedError.failedMessageList`를 파싱해 `[statusCode] statusMessage (to: 수신번호)` 형식 문자열을 `history.error` 필드에 저장 (B안). commit: 79af076
- **컨텍스트**: SOLAPI가 throw하는 `MessageNotReceivedError`의 `.message`는 "1개의 메시지가 접수되지 못했습니다"라는 안내문 수준. 실제 거절 사유는 `err.failedMessageList[].statusCode + statusMessage`에 있음.
- **대안 검토**:
  - A안: 콘솔 로그만 상세 출력, `history.error`는 짧은 메시지 유지 — 로그는 휘발성이라 사후 추적 불가
  - B안: `history.error`에 상세 사유 저장 **(선택)** — Firestore 콘솔 한 곳에서 사유 확인 가능
  - C안: `history`에 `failureCode`, `failureReason` 별도 필드 추가 — 스키마 변경 비용, 이메일 채널과 일관성 깨짐
- **부가 결정**: `instanceof` 안전성을 위해 `catch` 블록 내 `MessageNotReceivedError` 동적 재import. 모듈 캐싱으로 런타임 비용 없음.

## 2026-05-03 — Firestore Admin SDK에 ignoreUndefinedProperties: true 적용

- **결정**: `firebase-admin.ts`의 `getAdminDb()`에서 db 인스턴스를 캐싱하고, 최초 1회 `db.settings({ ignoreUndefinedProperties: true })` 호출 (A안). commit: bcfe1f3
- **컨텍스트**: `notifications` 컬렉션 저장 시 `error`, `providerMessageId` 등 optional 필드가 `undefined`인 채로 전달되어 Firestore가 거부. 발송 자체는 성공해도 이력이 누락됨.
- **대안 검토**:
  - A안: Admin SDK 전역 `ignoreUndefinedProperties: true` **(선택)** — 공식 권장 방식. 이후 다른 컬렉션 쓰기에서도 동일 문제 예방
  - B안: `history.ts` 저장 직전 `undefined` 필드 제거 — 로컬 패치라 향후 다른 컬렉션에서 재발 위험
- **안전성 검토**: 코드베이스 전체 `: undefined` 의도적 사용 0건(grep 확인) — 부작용 없음.
- **구현 주의**: `settings()`는 인스턴스당 1회만 허용. `_db` 변수로 인스턴스 캐싱 후 조건부 호출.

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

## 2026-05-02 — 도메인 전략: congre.kr 우선 등록

- **결정**: 1단계(한국 시장)는 `congre.kr`만 등록. 다른 TLD는 글로벌 진출 검토 시점에 결정.
- **배경**: `congre.com`은 일본의 컨벤션·국제행사 컨설팅 회사가 보유 중. 업종이 "행사" 카테고리 공유로 인접하나 즉각적인 직접 충돌은 아님. 글로벌 B2B 진출 시 충돌 가능성은 인지하고 있음.
- **이름 어원**: "Congre" = 한국식 유머 발음 "꽁그래츄(Congrats)"의 줄임. "축하"의 친근한 표현.
- **2단계 옵션 (글로벌 검토 시 선택 필요)**:
  a. 이름 유지 + `.net` 또는 다른 TLD
  b. 변형 이름 + `.com`
  c. 새 이름 + `.com`
  d. `congre.com` 인수 시도
- **결정 시점**: 글로벌 진출 직전, 적어도 마케팅 본격화 전.

## 2026-05-02 — 마감 처리(closeEvent)를 서버 API로 이전

- **결정**: 이벤트 마감을 클라이언트 SDK 직접 쓰기 대신 `POST /api/events/[eventId]/close`로 처리.
- **이유**: 클라이언트에서 Firestore에 직접 쓰면 인증 토큰이 있어도 "요청자 == 주최자" 서버 검증이 불가능함. 서버 이전으로 hostId 비교 + 403 반환이 가능해짐. 이로써 모든 이벤트 상태 변경이 서버 사이드 경로로 통일됨.
- **대안**: Firestore 규칙에서 `request.auth.uid == resource.data.hostId` 조건 — 규칙 관리 복잡도 증가, 서버 로직과 이원화.

## 2026-05-02 — Firestore Rules를 로컬 파일로 관리

- **결정**: `firestore.rules`를 프로젝트 루트에 두고 Git으로 변경 이력 추적. `firebase.json` + `.firebaserc`(프로젝트: congre-mvp)로 Firebase CLI 연동.
- **이유**: 콘솔에서만 관리하면 변경 이력이 없어 언제 어떤 규칙이 적용됐는지 알 수 없음. 코드 리뷰와 PR 흐름에 보안 규칙 변경을 포함시키기 위함.
- **배포 방법**: `firebase deploy --only firestore:rules` (Firebase CLI 필요 — `npm install -g firebase-tools`)
- **대안**: Firebase 콘솔에서 직접 관리 — 추적 불가.

## 2026-05-02 — 알림 채널: Resend 이메일 + SOLAPI SMS, FCM 미도입

- **결정**: 이메일은 Resend, SMS는 SOLAPI. FCM 푸시는 이번 단계에서 도입하지 않음.
- **이유**: Congre는 이벤트 당일 1회성 서비스 특성상 푸시 구독 관리 비용 대비 효용이 낮음. 이메일과 SMS는 앱 미설치 환경(iOS Safari 기본 PWA)에서도 안정적으로 전달됨. Resend는 Next.js App Router와 궁합이 좋고 무료 3,000건/월. SOLAPI는 국내 발신번호 등록·LMS 자동 전환 지원.
- **대안**: FCM 푸시 — iOS 16.4+ PWA 푸시 지원되나, 주최자가 별도로 알림 허용 설정 필요. 다음 PR에서 재검토 가능.

## 2026-05-02 — @react-email 대신 HTML 문자열 템플릿

- **결정**: 이메일 템플릿을 `@react-email/components` 대신 `src/emails/*.ts` 의 HTML 문자열 함수로 작성.
- **이유**: `@react-email/components@1.0.12` 가 npm에서 "Package no longer supported"로 deprecated 처리됨 (`npm view` 실측). React Email 팀이 통합 패키지를 버리고 개별 컴포넌트 패키지(`@react-email/html`, `@react-email/body` 등)로 분리했으나, 이 시점에 마이그레이션 경로가 명확하지 않았음. 단순한 트랜잭션 이메일 7개에는 HTML 직접 작성으로 충분하며, Resend는 HTML 문자열을 직접 수용함.
- **대안**: `@react-email/render@2.0.8` (deprecated 아님, 정상 유지보수 중) + 개별 컴포넌트 패키지 조합으로 마이그레이션 가능 — 생태계 안정화 확인 후 검토.

## 2026-05-01 — firebase-admin 도입

- **결정**: 서버 측 인증/Firestore 접근에 firebase-admin 사용. 첫 적용 지점은 클립 재생 API.
- **이유**: 푸시 알림(FCM), 결제 webhook 검증, 권한 분기 등에서 어차피 필요. 보안 표면을 클라이언트 SDK에만 의존하지 않게 됨.
- **대안**: 인증 없이 short-lived URL만으로 운영 — 단기적으로 가능하나 운영 기능 확장 시 한계.

## 2026-05-01 — 파티클 효과: canvas-confetti + CSS 하이브리드

- **결정**: 랜딩 페이지 burst는 canvas-confetti, 영상 주변 sparkle은 순수 CSS.
- **이유**: canvas-confetti는 7KB gzipped, 의존성 0개. burst 형태가 자연스럽게 구현되며 RAF 기반이라 끝나면 자동 정리. sparkle은 idle 상태에서 CPU 안 먹게 GPU 합성으로 처리.
- **대안**: tsparticles는 60KB+로 과함. 순수 CSS만으로는 다수 입자 burst가 키프레임 관리 부담.

## (이전 결정들)

이전 대화에서 내려진 결정 중 기억나는 것 — 추후 점진적으로 추가:
- Tailwind v4 채택 (config 파일 없는 @import 방식)
- Cormorant Garamond + DM Sans 폰트 조합
- Shotstack 선택 (AI 영상 편집)
- Firebase + S3 분리 구조 (메타데이터는 Firestore, 영상 파일은 S3)
- 브랜드 표기 통일을 위한 BrandName 컴포넌트 도입

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
