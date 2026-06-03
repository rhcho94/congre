# 2026-06-02 — 출시 전 운영 모니터링 + 백엔드 한도/비용 정찰

> 본 앱 트랙(일부 docs 커밋). 채팅 클로드 정찰 세션. CC 코드 정찰 + 운영자 대시보드 확인(스샷) + 웹 검증으로 진행.

## 본 세션 한 줄 요약
"출시 후 호스트·이벤트 상태를 어떻게 모니터링하나 + 백엔드 한도/비용 절벽은 어디인가"를 정찰해 `docs/ops/monitoring.md`(v1) 단일 문서로 정리·커밋. 전 서비스(Vercel/Firebase/AWS/Shotstack/Resend/SOLAPI) 플랜·한도·알림 상태 확정. 출시 차단급 발견 = **Shotstack 호스팅 전송·저장 500MB 병목**(해결책 B 결정, 미실행).

## 본 세션 커밋
- `cb9e5ce` — docs: add ops monitoring reference and correct project/cron/CDN facts
  - 8 files (+162/-10). 신규 `docs/ops/monitoring.md`(133줄) + CLAUDE.md·PROJECT.md·CHANGELOG.md·DECISIONS.md·decisions/infra.md·known-issues.md 수정 + known-issues-resolved.md(cron 항목 이동).
  - docs-only, 빌드 통과, main push 완료.
- ※ 이 핸드오프 파일은 아직 미커밋 → 다음에 `docs(handoff):`로 커밋 필요.
- ※ 운영자 local에 untracked `docs/ops/monitoring-ops-v0.md`(이전 초안) 잔존 — 정리해도 됨(repo엔 monitoring.md가 정본).

## 산출물 (정본 위치)
- **`docs/ops/monitoring.md`** ← 모니터링·한도·비용 현황의 정본. 상세는 이 문서 참조. 아래는 핵심 스냅샷.

---

## 확정된 현황 스냅샷 (서비스별)

| 서비스 | 플랜 | 한도/위험 | 알림 | 상태 |
|---|---|---|---|---|
| Vercel(본앱 **congre**) | **Pro** | cron 제약 해소(*/5 정상) | Spend "Alerts only" | ✅ |
| Firebase(congre-mvp) | **Blaze** | Firestore Spark 멈춤위험 해소→비용형(현 읽기 1.1천/주 미미) | GCP 예산 **월 ₩50,000**(50/90/100% 이메일) | ✅ |
| AWS(783837106823) | 무료+크레딧 | 현재 $0. S3 리전=**시드니(ap-southeast-2)** | Budget **월 $100**(85/100/예상100%→운영자 Gmail) | ✅ |
| **Shotstack** | 구독 200크레딧/월($39) PRODUCTION | ⚠️ **전송 500MB/월·저장 500MB(현 392MB=78%)** = 진짜 병목. 렌더 크레딧은 여유(385보유, 22.63/30일) | (분당 과금) | ⚠️ 해결 필요 |
| Resend | **Free** | 월 3,000/일 **100**(현 184/3,000). 알림메일 Delivered 확인 | — | ✅(출시규모 시 Pro) |
| SOLAPI | 개인 계정 | 일일 한도 50→**500 상향완료**. 500초과는 사업자계정 | 자동충전 **OFF** / 잔액소진경고 ON(임계 200) / 잔액 45,123원 | ✅(자동충전·임계는 검토) |

**cron(Vercel Cron, vercel.json)**: check-rendering·check-render-deadlines `*/5`, cleanup `0 18 * * *`(=KST 03:00). 2026-06-02 Logs에서 앞 둘 GET 200·에러 0 확인 → cron 실행 + **CRON_SECRET 등록 확정**(200=인증통과). cleanup만 24h 범위로 추후 확인.

**데이터 모델(콘솔 해석용)**: users(email,name,phone,createdAt,terms/privacyAgreedAt — **email_verified 필드 없음**, 인증은 Authentication 탭) / events(title,date,plan,hostId,status,organizerEmail/Phone,renderId,refund50At/100At,refundStatus,videoUrl,clipsDeletedAt,videoDeletedAt…) / clips(eventId,s3Key,uploaderName,uploaderPhone,duration,uploadedAt,excludedAt?) / notifications(eventId,scenario,channel,recipient,status,error?,sentAt). **status = open/closed/rendering/done** (closed는 ①마감 ②렌더실패 되돌림 — renderId·refundStatus로 구분).

---

## 본 세션 결정
1. **모니터링 방식** (decisions/infra.md 2026-06-02 기록): 전용 화면(/admin)은 호스트 수십 명+ 시점으로 보류(events read 차단→Admin SDK 서버 라우트 필요). 출시 초기엔 `docs/ops/monitoring.md` 수동 점검(Firebase 콘솔 직접 + 서비스 대시보드 + 비용 알림 이메일).
2. **운영자 사건 알림(C)** 채널 미정. 후보: 기존 SMS(`CONGRE_INTERNAL_PHONE` 활성화)/텔레그램 봇/카카오 나에게보내기. **SMS=SOLAPI 한도공유, 이메일=Resend 일100 한도공유, 텔레그램·카톡 나에게보내기=한도 무관.** 오픈채팅은 서버 발송 공식 API 없음.
3. **Shotstack 호스팅 비용** → 해결책 **B 권장 방향으로 결정(미실행)**: 렌더 output에 S3 destination 지정 + Shotstack 호스팅 opt-out. (상세는 아래 "Shotstack B" 절)

## 본 세션 발견·정정 (추측이 깨진 것)
- Vercel 프로젝트명 `congre-three` → **`congre`** (congre-three는 기본 도메인일 뿐)
- Firebase Spark 추정 → **Blaze**
- events.status `standby` → **`open`** (standby는 촬영화면 stage, events.status 아님)
- cron "GitHub Actions" → **Vercel Cron**(vercel.json). known-issues 항목 resolved 이동.
- cron 위치 "상단 Crons 탭"(추측) → **Settings → Cron Jobs**(로그는 Logs)
- users에 email_verified 필드 없음 → 인증여부는 **Authentication 탭**
- 알림 수신자 1~5 = 전부 **호스트**(organizerEmail/Phone), 운영자 미수신. `CONGRE_INTERNAL_PHONE`은 지연/환불50/환불100 3개에만·TODO로 꺼짐·SMS only.

---

## 미완 작업 (다음 세션 시작 시 가장 먼저)
1. **Shotstack 저장 78% 즉각 점검** — 출시 전 500MB 꽉 차면 새 렌더 호스팅 실패 가능. B 적용 전이면 한 번 비우기 검토.
2. **Shotstack B 적용**(아래 상세) — 출시 차단급. 정찰부터.

## 다음 세션 후보 (우선순위)
- ★★ **Shotstack B** (전송·저장 500MB 병목 해소) — 출시 차단급
- ★ **SOLAPI 한도 결정**: 500으로 충분한지 vs 사업자 등록 전환(사업자계정 1,000~). 사업자 등록은 법무·세무와 묶임.
- ★ **Firestore composite index 사전 생성**(clips: eventId+uploaderPhone+uploaderName) — 첫 업로드 차단 방지(known-issues 기존 항목)
- Resend Free→Pro 검토(일 100건 cliff) — 출시 규모 시
- C(운영자 알림) 구현 — 채널 결정 후 정찰→실행
- Blaze에서 Firebase Auth 메일 일일 한도 정책 확인 / cleanup 24h 범위 실행 확인(선택) / SOLAPI 자동충전·경고 임계(200) 상향 검토
- (직전 핸드오프 잔여) 랜딩 D(히어로 텍스트 겹침)·C(Showcase) 정찰, 랜딩 L1~L5

---

## Shotstack B — 다음 세션이 바로 쓸 상세
**문제**: 현재 렌더 결과가 Shotstack CDN(cdn.shotstack.io)에 호스팅됨. 저장(누적)·전송(시청) 둘 다 500MB 한도를 먹음. 저장은 이미 392/500(78%).
**해결책 B(권장)**: 렌더 output에 destinations로 S3 지정 + Shotstack 옵트아웃.
- `"destinations": [{"provider":"s3","options":{"region":"ap-southeast-2","bucket":"congre-mvp-videos",...}},{"provider":"shotstack","exclude":true}]`
- 결과물이 기존 S3(시드니, 이미 있음)로 직접 → 저장·전송 둘 다 Shotstack 안 씀.
- Shotstack 대시보드 Integrations에서 S3 destination 연동(전용 IAM 키, 루트 금지).
- **주의**: 옵트아웃 시 Shotstack 임시 URL은 24h만 유지 → 반드시 S3 URL 서빙(임시 URL 서빙 금지).
**C(대규모 시)**: 목적지를 Cloudflare R2로(egress 무료). known-issues "영상 호스팅 CDN 이전" 항목.
**B 정찰 포인트(읽기 전용 먼저)**:
- `src/app/api/render/start/route.ts` — render 요청 output 구성(현재 destinations 없음 추정)
- videoUrl 저장/재생 흐름 — events.videoUrl이 cdn.shotstack.io. 재생은 presigned URL 방식(클립 재생에서 이미 사용 중) 재사용 가능한지
- `src/app/api/cron/cleanup/route.ts` — 현재 무엇을 지우는지(Shotstack 호스팅 삭제 여부 **불명** — 저장 78% 누적 원인 가능성). B 후엔 S3 완성본 삭제로 확장 필요.
- S3 IAM 권한 / 버킷 ACL 또는 presigned 전략

---

## 본 세션 학습 (CLAUDE.md 학습 룰 추가 후보, 위에 한 줄씩)
- **200 응답으로 환경변수 등록 역추론**: cron 라우트가 미설정 시 500/불일치 401이면, Logs의 GET 200만으로 CRON_SECRET 등록·일치를 확정 가능. 별도 화면 불필요.
- **"플랜 등급=비용"이 아니라 기능 작동 직결일 수 있음**: Vercel Hobby면 `*/5` cron이 배포 거부됨 → 렌더 감지·환불·알림 마비. 플랜 확인이 단순 비용이 아니라 1순위 점검인 이유.
- **렌더 API는 "렌더 횟수"보다 "호스팅 전송·저장"이 병목**: Shotstack 크레딧 여유여도 CDN 500MB가 먼저 막힘. 크레딧 여유 ≠ 안전.
- (재확인) **외부 SaaS 메뉴 추측 금지**: "상단 Crons 탭"으로 단정했으나 실제 Settings→Cron Jobs. 화면 확인 전 메뉴명 단정 금지(기존 룰 재발).

## 참고
- CC가 보고 끝에 "※ recap" 메타 코멘트를 또 붙임(프롬프트 금지에도). CC 자동 recap 기능 — `/config`로 끌 수 있음. 보고 검증 시 무시.
- docs-only 커밋도 main push라 Vercel 재배포 트리거됨(앱 영향 없음).
