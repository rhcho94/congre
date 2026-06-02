# Congre 운영 점검 문서 (v1) — 수동 모니터링 + 한도·비용

> 모니터링 화면을 만들기 전, 정찰로 얻은 정보를 한 곳에 모아 두고 이 문서로 직접 확인한다.
> 작성: 채팅 클로드 정찰 세션(2026-06-01~02). CC 코드 정찰 + 운영자 대시보드 확인 + 웹 검증.

**버전 이력 요약**: v0 뼈대 → CC 정찰 → Vercel Pro·Cron 위치 → Firebase Blaze·AWS·SOLAPI → cron 실행·CRON_SECRET → 예산 알림 → Resend·SOLAPI 상향 → **v1 Shotstack 확인 = 전 서비스 점검 완료**.

---

## 프로젝트 식별
| 대상 | Vercel 프로젝트명 | 기본 도메인 | 커스텀 도메인 | GitHub |
|---|---|---|---|---|
| 본앱 | **congre** | congre-three.vercel.app | app.congre.kr | rhcho94/congre |
| 랜딩 | **congre-landing** | congre-landing.vercel.app | congre.kr / www.congre.kr | (git 미연결) |
- Vercel 팀 = **Pro**. Firebase = congre-mvp(**Blaze**). AWS 계정 = 783837106823. 비용 알림 수신 = 운영자 Gmail.
- "congre-three"는 기본 도메인일 뿐 프로젝트명 아님(과거 docs 표기 정정). pickleball-club-manager는 Congre 무관.

---

## 0. 사용법
🟦 CC 정찰(코드) / 🟨 운영자 대시보드 / ⬛ docs. 정찰 과정의 추측 정정 로그:
events.status standby→**open** / users **email_verified 필드 없음**(인증은 Authentication 탭) / cron GitHub Actions→**Vercel Cron** / cron 위치 상단탭→**Settings→Cron Jobs**(로그는 Logs) / Vercel→**Pro** / Firebase→**Blaze**.

---

## 1. 수동 모니터링 — 호스트/이벤트 현황

### 1-1. Firebase 콘솔
```
console.firebase.google.com → congre-mvp
├─ Firestore Database → 데이터 → users / events / clips / notifications
└─ Authentication → Users → 계정별 "이메일 인증됨" 여부 (★ 인증은 여기서만)
```

### 1-2. 컬렉션
| 컬렉션 | 내용 | 확인용 |
|---|---|---|
| users | 가입 호스트 | 가입 시점 (인증 여부는 Authentication) |
| events | 이벤트 | 상태, 완성/환불 |
| clips | 참가자 영상 | 참여 수, 제외(excludedAt) |
| notifications | 알림 이력 | 열람만 |

### 1-3. 데이터 모델 🟦
- **users/{uid}**: email, name, phone, createdAt, termsAgreedAt, privacyAgreedAt
- **events/{eventId}**: title, date, plan, hostId, status, sessionToken, uploadToken, createdAt, organizerEmail, organizerPhone, (선택)introText/outroText/maxClipSeconds / 렌더시작: renderId, deadlineAt, renderStartedAt, renderEstimateMin, expectedCompletedAt, refund50At, refund100At, refundStatus, notifications.{6종} / 완료·실패: videoUrl, renderDoneAt / 정리: clipsDeletedAt, videoDeletedAt / 미디어: intro·outroMediaKey·Type
- **clips/{clipId}**: eventId, s3Key, uploaderName, uploaderPhone, duration, uploadedAt, excludedAt?, sessionToken?
- **notifications/{auto}**: eventId, scenario, channel, recipient, status, error?, providerMessageId?, sentAt
- **status (4개)**: open / closed(① 마감 ② 렌더실패 되돌림 — renderId·refundStatus로 구분) / rendering / done

---

## 2. 한도·비용 점검 현황 (전 서비스 확인 완료)

### 2-1. 서비스별 현황표
| 서비스 | 현재 플랜 | 비용/한도 알림 | 위험 지점 | 멈춤/비용 | 감지 위치 |
|---|---|---|---|---|---|
| Firebase Auth 메일 | Blaze | ✅ GCP 예산(아래 동일) | Blaze 메일 일일 한도 정책 확인 필요 | (확인필요) | Console → Authentication |
| Firestore | Blaze | ✅ GCP 예산 월 ₩50,000(50/90/100% 이메일) | 폭주 시 과금(읽기 1.1천/주, 미미) | 비용 | Console 사용량 |
| AWS S3 | 무료플랜+크레딧 | ✅ Budget 월 $100(실제85/100·예상100% → 운영자 Gmail) | 전송 비용($0). 리전=시드니 | 비용 | AWS Billing → 예산 |
| **Shotstack** | **구독 200크레딧/월 ($39), PRODUCTION** | (분당 과금) | ⚠️ **전송 500MB/월·저장 500MB(현 392MB=78%)**가 진짜 병목. 렌더 크레딧은 여유(385 보유, 22.63/30일 사용) | 멈춤+비용 | Shotstack Dashboard / Usage |
| Vercel(본앱 congre) | Pro | Spend "Alerts only" | cron 제약 해소. 대역폭/함수 비용 | 비용 | Vercel → Usage |
| Resend(메일) | Free | (무료 한도) | ⚠️ 월 3,000 / 일 100(현재 184/3,000). 일 100 초과 시 메일 실패. Pro($20)는 무제한 | 멈춤 | Resend → Settings → Usage |
| SOLAPI(SMS) | 개인 계정 | 자동충전 OFF / 잔액소진경고 ON(임계 200) / 잔액 45,123원 | 일일 한도 **50→500 상향 완료**. 500 초과는 사업자 계정 | 멈춤 | SOLAPI 대시보드 |

### 2-2. cron 작동 점검 🟦🟨 (Vercel Cron, 본앱 Pro)
| 경로 | 스케줄 | 실행 상태 | 영향 |
|---|---|---|---|
| /api/cron/check-rendering | `*/5` | ✅ 5분 GET 200, 에러 0 (06-02 로그) | 렌더 완료·실패 감지, 참가자 알림 |
| /api/cron/check-render-deadlines | `*/5` | ✅ 5분 GET 200, 에러 0 (06-02 로그) | 렌더 지연 감지, 환불 판정 |
| /api/cron/cleanup | `0 18 * * *`(KST 03:00) | ⬜ 24h 범위로 확인 권장 | 클립24h·완성본7d 삭제 |
- CRON_SECRET 등록 확인됨 ✅(200=인증 통과). cron은 Production만. Vercel cron 실패 알림 내장 없음(→§5 C). 로그: Vercel→congre→Logs→`requestPath:/api/cron/<경로>`.

### 2-3. 조용히 실패하는 것
- SOLAPI 일일 한도(500) 초과 → 그룹 접수실패·재발송 불가 / SOLAPI 잔액 소진(자동충전 OFF, 경고 ON) → SMS 실패 / **Resend 일 100건 초과 → 메일 미발송** / **Shotstack 전송·저장 500MB 초과 → 영상 호스팅 실패/추가과금** / Firebase Auth 메일 한도(확인 필요) / cron 실패(현재 정상).

---

## 3. 운영자 정기 점검 루틴
- 수시: Firestore events status=rendering 지연·closed+renderId(실패) / Authentication 미인증 신규
- 주 1회: AWS Billing / SOLAPI 잔액·일일량 / Resend Usage(월·일) / **Shotstack 전송·저장(500MB)** / Vercel Logs cron 200
- 사고 신호: "영상 안 나와요"→cron·Shotstack(전송·저장 포함) / "문자 안 와요"→SOLAPI 한도·잔액 / "메일 안 와요"→Resend 일100·Firebase
- 비용 알림(이메일): AWS $100·Firebase ₩50,000 임계 시 운영자 Gmail 자동 수신.

---

## 4. 출시 전 차단 항목 (must-do)
- [x] Vercel 본앱 = Pro
- [x] Firebase = Blaze
- [x] CRON_SECRET 등록 + cron 2개 실행 확인 (cleanup만 24h 범위 재확인 권장)
- [x] AWS Budgets 비용 알림 (월 $100) — 생성 클릭 확인만
- [x] Firebase(GCP) 예산 알림 (월 ₩50,000)
- [x] SOLAPI 일일 한도 상향 (50→500). 500 초과는 사업자 등록
- [~] SOLAPI 잔액소진 경고 ON (자동충전 OFF / 임계 200 낮음→상향 검토)
- [ ] **Shotstack 전송·저장 500MB 대책** — 출시 시 시청 트래픽으로 전송 초과 예상. 상위 플랜 또는 영상 CDN 이전(R2 등, known-issues 항목) / 저장 78% 점검 ★
- [ ] (출시 규모 시) Resend Free→Pro 검토 (일 100건 cliff). 현재 여유
- [ ] Firestore composite index 미리 생성(clips: eventId+uploaderPhone+uploaderName)
- [ ] (확인 필요) Blaze에서 Firebase Auth 메일 일일 한도 정책

---

## 5. 앞으로

### C — 서비스 운영자 알림 (현황 🟦 + 채널 옵션)
현재 알림 1~5(생성/시작/완료/지연/실패)는 전부 호스트(organizerEmail/Phone) 수신, 운영자 미수신. 사내 배선 `CONGRE_INTERNAL_PHONE`은 지연/환불50/환불100 3개에만, 전부 TODO로 꺼짐, SMS만. 운영자 이메일 변수 없음.
※ 비용 알림(AWS·Firebase)은 이미 운영자 이메일 수신 설정됨 → C에서 다룰 건 "운영 사건"(렌더 실패·지연·신규 이벤트) 알림.

| 채널 | 사전작업 | 비용 | 적합도 |
|---|---|---|---|
| (있음) SMS — CONGRE_INTERNAL_PHONE 켜기 | 켜기만 | ~20원/건(SOLAPI 한도 공유) | 추가개발 거의 0 |
| 카카오 나에게 보내기 | 카카오 로그인+메시지권한, OAuth 토큰 발급·갱신 | 무료 | 무료지만 토큰관리 |
| SOLAPI 알림톡 | 비즈채널+템플릿 승인 | ~7~9원/건 | 고객 카톡 발송 계획 시 |
| 오픈채팅 | — | — | ❌ 서버 발송 공식 API 없음 |
| 텔레그램 봇 | 봇 토큰+chat_id | 무료 | 승인·갱신 없음, 자기수신 최강 |
- ※ SMS는 SOLAPI 한도, 이메일은 Resend 일 100건 한도를 각각 참가자/호스트 알림과 공유. 텔레그램·카톡 나에게보내기는 한도 무관.

### 모니터링 화면(/admin)
- 호스트 수십 명+ 시점에 빌드. events read 차단 → Admin SDK 경유 서버 라우트 필요.

---

## 부록 A. 정찰 소스 매핑
CC: A 운영자화면 없음→§5 / B 데이터모델→§1-3 / C 알림→§5 / D cron→§2-2·§4 / E 폴링·composite→§2·§4 / F env→부록 C
운영자: 플랜→§2-1 / 예산알림→§2-1·§4 / SOLAPI·Resend·Shotstack→§2-1·§3 / CRON_SECRET·Cron→§2-2

## 부록 B. 환경변수 이름 🟦 (값 아님)
Firebase 클라이언트: NEXT_PUBLIC_FIREBASE_{API_KEY,AUTH_DOMAIN,PROJECT_ID,STORAGE_BUCKET,MESSAGING_SENDER_ID,APP_ID}
Firebase Admin: FIREBASE_ADMIN_{PROJECT_ID,CLIENT_EMAIL,PRIVATE_KEY}
AWS: AWS_REGION,AWS_ACCESS_KEY_ID,AWS_SECRET_ACCESS_KEY,AWS_S3_BUCKET
Shotstack: SHOTSTACK_API_KEY,SHOTSTACK_ENV / Vercel: VERCEL_ENV
카카오: NEXT_PUBLIC_KAKAO_APP_KEY / 앱 URL: NEXT_PUBLIC_APP_URL
Resend: RESEND_API_KEY,EMAIL_FROM,EMAIL_FROM_NAME
SOLAPI: SOLAPI_API_KEY,SOLAPI_API_SECRET,SOLAPI_SENDER
Cron: CRON_SECRET / 사내 SMS(미배선): CONGRE_INTERNAL_PHONE
