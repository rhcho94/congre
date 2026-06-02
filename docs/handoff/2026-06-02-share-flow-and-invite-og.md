# 2026-06-02 (v2) — 공유 흐름 수리(⑥) + 초대장 OG 갈림길

> 본 앱 트랙. 채팅 클로드 계획·정찰 + CC 실행. 직전 핸드오프(2026-06-02 monitoring-and-cost-recon)의 Shotstack B 후속.

## 본 세션 한 줄 요약
Shotstack→S3 전환(B)을 정찰하다 "공유/OG 흐름"의 실제 결함 2건을 발견. 그중 즉시·독립적으로 고칠 수 있는 ⑥(대시보드 링크 복사가 raw 영상 URL 복사 → 공유 페이지 URL 복사)을 수리·커밋. 초대장 OG(인트로 이미지 미리보기)는 "OG 이미지 호스팅 전략(A/B)" 결정 대기로 보류.

## 본 세션 커밋
- `09acb72` — fix: copy share page URL instead of raw video URL in link copy
  - 3 files (+11/-7). page.tsx(handleLinkCopy +5/-2) + known-issues.md(환경변수 미등록 섹션 -5) + known-issues-resolved.md(동 항목 RESOLVED +6).
  - 빌드 통과, lint baseline(11 errors/3 warnings) 유지, main push 완료. 숫자 자체 검증 통과(diff 대조 일치).
- ※ 이 핸드오프 파일은 미커밋 → `docs(handoff):`로 커밋 필요.

## 본 세션에서 확정된 사실 (정찰 결과)

### 1번(Shotstack 저장 78%) 점검 — 출시 차단급 아님으로 격하
- 운영자 대시보드 실측: **Bandwidth 0B/500MB**, **Storage 392.4MB/500MB(78%, Within free allowance, 6/29 리셋)**.
- 직전 핸드오프의 "전송 500MB 병목 = 출시 차단급"은 **과대평가**. 전송 실측 0. B는 "출시 차단급"이 아니라 **중요-비긴급**(저장이 차면 언젠가 막힘, 시즌 전 권장).
- 392MB 누적 원인: "삭제 실패"가 아니라 **삭제 대상 자체가 적음**(완성본 7개뿐, 7일 넘긴 게 거의 없음)이 유력. 단정 불가.

### Shotstack B API 스펙 (공식 문서 검증 완료)
- S3 destination: `output.destinations`에 `{provider:"s3", options:{region, bucket, prefix?, filename?, acl?}}`. 썸네일·poster도 함께 전송됨.
- opt-out: `{provider:"shotstack", exclude:true}` 추가.
- **정정 1**: opt-out 해도 **bandwidth(전송)는 계속 소비**. 저장만 해소, 전송은 완화(시청 트래픽이 S3로 빠짐).
- **정정 2**: opt-out 시 Shotstack은 결과물을 **24h만 보관**. → 반드시 S3 URL 서빙, Shotstack 임시 URL을 DB 저장 금지.
- AWS 자격증명은 요청 본문 아님 → **Shotstack 대시보드 Integrations에서 등록**(전용 IAM 키, 루트 금지). 코드 전 운영자 선행.

### cleanup 7일 삭제 구조 (④ 정찰)
- `cleanup/route.ts:43-53`: 7일 분기에서 `deleteShotstackAssetsByRenderId`(try/catch) 후 Firestore 마킹(videoUrl=null, videoDeletedAt)은 try **밖** → 삭제 실패해도 마킹 진행.
- `shotstack.ts:227-252`: 이 함수는 실패 시 **조용히 return**(if !res.ok return), throw·로그 0 → **Vercel 로그에 흔적 0**. 삭제 작동 여부를 로그로 확인 불가한 구조.
- 운영자 확인법: Firestore events에서 `videoDeletedAt` 찍힌 문서 있으면 삭제 분기 1회 이상 작동. 삭제 누락 신호 = `status=="done" AND renderDoneAt < now-7d AND videoUrl!=null AND videoDeletedAt==null`(단 7일 직후 첫 cron 전 24h 윈도는 정상 대기).
- B 적용 시 이 함수 어차피 손댐 → 지금 따로 고치지 말 것(YAGNI).

### 공유/OG 흐름 (④ + 이번 정찰)
- **완성본 /share/[eventId]**: generateMetadata에 og:image=**로고 정적**, og:video/og:url 없음 → SNS 카드에 영상 썸네일 안 뜸.
- **대시보드 카카오 공유**: (a) `/share/${eventId}`. 단 NEXT_PUBLIC_APP_URL 미설정 시 raw videoUrl fallback.
- **대시보드 링크 복사**: ⑥에서 **수리 완료**(이제 /share URL 복사).
- **/share 페이지 카카오·링크복사**: 이미 (a) /share URL.
- **초대 페이지 /upload/[eventId]?token=...**: layout.tsx generateMetadata에 og:title/description, twitter:card=summary 있음. **og:image 없음** → 미리보기 이미지 없음.

### 인트로/아웃트로 자산 구조 (초대장 OG 재료)
- 이벤트 생성 폼엔 업로드 UI 없음. 이벤트 **상세 페이지**에서 업로드.
- 저장: S3 `events/${eventId}/intro|outro/...` (버킷 = AWS_S3_BUCKET = congre-mvp-videos).
- events 필드: `introMediaKey`(S3 key), `introMediaType`("image"|"video"), outro 동일. **타입 구분 이미 저장됨.**
- presigned 발급: invite-urls/route.ts, expiresIn 3600(1시간), 호스트 인증 필요.
- **영상 인트로용 정지 썸네일/포스터 필드 없음** → 영상 인트로는 og:image로 직접 못 씀.

## 본 세션 결정
- ⑥(링크 복사 수리) 실행 완료.
- B(S3 전환)는 **중요-비긴급**으로 재분류. 출시 차단급 아님.
- ⑦(완성본 OG)은 **B와 한 묶음**으로 결론(썸네일이 S3에 영구로 살아야 OG 안 깨짐). 단독 분리 불가.
- 초대장 OG는 **OG 이미지 호스팅 전략 미결**로 보류(아래).

## 미완 작업 (다음 세션, 결정 먼저)

### ★ 초대장 OG — OG 이미지 호스팅 전략 A vs B 결정 필요 (이번 세션 보류 지점)
미리보기에 인트로 이미지를 띄우려면 카톡이 영구 캐시할 **안 죽는 이미지 URL**이 필요. 우리 인트로 이미지는 S3 비공개(presigned 1h 만료) → **영구 캐시 ↔ 1h 만료 충돌**.
- **A안(추천)**: `events/{id}/intro/` 경로 이미지 객체만 **public-read**. 신규 인프라 0. 단 **AWS 버킷 정책 변경**(운영자 영역, 영상 본체까지 공개 안 되게 intro 경로만 좁혀야 함 — 미성년자 영상 보안 민감) + CC OG 코드 분기.
- **B안**: presigned 만료를 7·30일로 늘림. AWS 안 만짐. 단 만료 지나면 미리보기 깨짐(불완전).
- 공통 제약: 인트로가 **영상이면 OG 이미지 없음** → "이미지일 때만 미리보기, 영상/없으면 기본 이미지(로고)" 분기가 현실적(영상 썸네일 추출은 YAGNI).
- **다음 세션 시작점**: A vs B 결정 → A면 AWS 버킷 정책 안내 + CC 코드 사양, B면 만료 변경 사양.

## 다음 세션 후보 (우선순위)
- ★ 초대장 OG (위 A/B 결정부터)
- ★ ⑦ 완성본 OG + B(S3 전환) 한 묶음 — 중요-비긴급. B 선행: 운영자 Shotstack Integrations S3 등록.
- ★ Firestore composite index 사전 생성(clips: eventId+uploaderPhone+uploaderName) — 첫 업로드 차단 방지(known-issues 기존).
- CLAUDE.md lint 게이트 불일치 정정: 문서 "errors 0" vs 실제 baseline 11. 둘 맞추기(문서 수정 or error 11개 정리) 결정.
- (선택) NEXT_PUBLIC_APP_URL Vercel 화면 눈 확인 / SOLAPI 한도 / Resend Free→Pro / 운영자 알림(C) / 랜딩 L1~L5.

## 본 세션 학습 (CLAUDE.md 학습 룰 추가 후보)
- **"가볍다"를 우선순위 기준으로 쓰지 말 것**: 우선순위는 목표(출시 차단급) 기준. 가벼운 작업을 앞세우면 무거운 본체가 계속 뒤로 밀림. 1(점검) vs B에서 반복 관측.
- **OG는 태그가 아니라 "그 뒤의 영구 이미지 호스팅"이 본체**: og:image 한 줄 추가로 봤다가, 그 이미지가 어디서 영구히 사는지(만료·캐시 충돌)가 진짜 난제였음. ⑦을 가볍게 본 오판.
- **개선안 비교는 "더 나쁜 현状"과**: 링크복사 fallback이 상대경로라 "깨진다"고 우려했으나, 비교 대상이 raw URL 복사(더 나쁨)였음. 개선 여부는 현状 대비로 판단.
- (재확인) **78% 같은 수치의 원인을 화면 보기 전 단정 금지**: "삭제 실패"로 반복 의심했으나 실측은 "삭제 대상 적음". 원인 단정 전 실측.
