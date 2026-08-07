# Resolved Issues

> known-issues.md에서 분리된 해결 완료 이력. 사고 재발 진단 시 grep 대상.
> 새 RESOLVED 항목 발생 시 known-issues.md에서 이 파일로 이동.

## ✅ introMediaKey·s3Key 무검증 — 버킷 내 임의 키 열람 프리미티브 (2026-08-07 해소)

- **심각도**: MEDIUM. 2026-08-06 보안 감사 M-1·M-2.
- **M-1**: `api/host/events/[eventId]/route.ts:171-178` — introMediaKey/outroMediaKey가
  `events/{자기eventId}/` 프리픽스 소속인지 검증 없음. 저장된 값은 invite-urls:57-64(1h
  presigned GET), render/start:149-160(24h presigned GET), og-image:24,48(미인증 프록시)
  세 곳에서 소유권 재검사 없이 S3 키로 사용됨.
- **M-2**: `api/clips/route.ts:37,75-83` — 게스트가 보낸 s3Key가 `typeof === "string"`
  검사만 받고 presign 발급 프리픽스와 대조되지 않음.
- **전제 조건**: 대상 키를 미리 알아야 성립. 클립 키는 `events/{20자 ID}/clip/{서버ms}-clip-{클라ms}.{ext}`로
  ms 타임스탬프 2개가 곱해져 무작위 대입 비현실적. 단 로그 유출과 체인을 이루면
  한 번 샌 키가 상시 열람 창구가 됨(M-4는 `01b80f3`으로 처리 완료).
- **해소**: 2026-08-07 `9779c13`. 클라이언트가 보낸 S3 키가 `events/{eventId}/` 프리픽스에
  속하는지 **저장 시점에** 검증한다. `isKeyInEvent(key, eventId)` 헬퍼를 `src/lib/s3-server.ts`에
  신설하고 `api/clips`(s3Key·thumbKey)와 `api/host/events/[eventId]`(introMediaKey·outroMediaKey)에서
  호출, 위반 시 400 `INVALID_KEY`. 검사는 인증 통과 뒤에 배치했고 `null`(미디어 삭제)은 통과시킨다.
- **결정 본문**: `docs/decisions/data-flow.md` 2026-08-07 항목 — 갈래 비교(A/B/C), 읽기 시점에
  검증을 넣지 않은 이유, `videoS3Key` 제외 근거, 정규식 대신 `startsWith`를 쓴 이유.
- **검증**: build 통과, lint delta 0. 배포 후 실사용 확인 — 인트로 미디어 업로드·삭제 양쪽 통과.
- **분리 잔존**: presign 발급 성공 로그의 S3 키 평문 기록 건은 미처리 상태로 known-issues.md에
  별도 항목으로 남겼다.

## ✅ 인트로/아웃트로 미디어 10MB 제한 — 폰 영상 사실상 업로드 불가 (2026-08-06 해소)

- **현황**: 2026-08-06 H-1 배포 검증 중 발견. 호스트 인트로/아웃트로 미디어 업로드가
  10MB에서 막힌다. 폰으로 촬영한 영상은 짧아도 이 한도를 넘는 경우가 대부분이라
  (아이폰 4K는 10초에 50MB 초과), 인트로 영상 기능이 실사용상 도달 불가에 가깝다.
  Ray 실측: "폰으로 찍은 웬만한 건 다 용량 제한에 걸림".
- **미확인**: 제한값 10MB가 박힌 위치(프론트 검사 / S3 정책 / 기타)와 그 근거.
  코드 정찰 미실시. 결정 기록도 확인되지 않음.
- **부수 영향**: H-1 검증에서 인트로 **영상** 업로드 경로가 이 제한에 막혀 MIME
  화이트리스트 실측에 도달하지 못했다(known-issues-resolved H-1 항목 참조).
- **처리**: 이번 사이클 미처리. 보안 트랙 범위 밖이며, 완화는 S3 비용·Shotstack 렌더
  시간·Vercel 함수 한도가 얽힌 별개 결정이다.
- **선행 작업**: 제한값 위치·근거 정찰 → 실제 폰 영상 용량 분포 실측 → 한도 재산정
  또는 클라이언트 압축 도입 검토.
- **격상 트리거**: 호스트가 인트로 영상 업로드 실패를 신고할 때 / 졸업식 시즌 진입 전.
- **해소일**: 2026-08-06
- **해소 내역**: 크기 100MB · 영상 길이 15초로 교체
- **근거**: `docs/decisions/rendering.md` 2026-08-07 결정 참조

## ✅ 저장형 XSS — presign Content-Type 무통제 + og-image 재전송 (2026-08-06 해소)

- **심각도**: HIGH. 2026-08-06 보안 감사 H-1.
- **원 경로(3단 연쇄)**: presign이 클라이언트 `fileType`을 무검증으로 ContentType 서명 →
  og-image가 미인증으로 S3 바이트를 객체 자신의 ContentType 그대로 재전송 →
  브라우저가 `app.congre.kr` 오리진에서 공격자 HTML 실행 → 같은 오리진 Firebase ID
  토큰 탈취. 응답에 24시간 CDN 캐시가 붙어 원본 삭제 후에도 하루 배포됨.
- **처방(3중 방어)**:
  1. `api/upload/presign/route.ts` — kind별 MIME 화이트리스트. clip·thumb는 목록 대조,
     intro/outro는 `image/`·`video/` 접두 허용 + `image/svg+xml` 명시 거부.
     불일치 시 400 `INVALID_CONTENT_TYPE`. 이벤트 조회보다 앞에 배치(DB 왕복 전 차단).
  2. `api/og-image/[eventId]/route.ts` — 응답 직전 S3 객체 ContentType 재검증.
     `image/` 접두 + svg 거부 통과분만 서빙, 나머지는 기존 fallbackRedirect().
     검사를 `transformToByteArray()` 앞에 배치해 거부 대상은 다운로드조차 하지 않음.
     응답 헤더에 `X-Content-Type-Options: nosniff` 추가.
  3. `next.config.ts` — `headers()` 신설, `source: "/:path*"` 전 경로에 nosniff.
- **MIME 정규화**: 비교는 `.trim().toLowerCase()`한 사본으로. `image/SVG+xml`·끝 공백
  변형 우회를 막는다. **서명값·PutObjectCommand·presign 로그는 정규화 전 원본 유지** —
  presign 서명 Content-Type과 브라우저 PUT 헤더가 글자 단위로 일치해야 업로드가 성립.
- **S3 버킷 공개 여부**: 감사 당시 "미확인"으로 등재됐으나 docs 대조로 확정됨 —
  버킷 비공개. 근거 3건: 2026-05-11 공개 URL 403 실측(CHANGELOG), og-image 프록시가
  존재하는 이유 자체가 비공개 버킷 유지, 2026-06-04 public-read 폐기·presigned 채택
  결정(decisions/data-flow.md). → S3 직접 URL 노출 경로 없음. 공격 경로는 og-image
  하나였고 처방으로 완결.
- **실사용 검증(2026-08-06, 커밋 `98eb235` 배포 후 Ray 실측)**: (a) nosniff 헤더
  부착 확인 — `Invoke-WebRequest`로 캐시 우회 요청 시 `X-Content-Type-Options:
  nosniff` 응답. (b) 인트로 **이미지** 업로드 정상 — 화이트리스트가 정상 사용자를
  막지 않음. (c) 기존 이벤트 카톡 미리보기 정상 노출 — 기존 S3 객체의 ContentType이
  새 검증을 통과함이 확인돼 감사 시점 미검증 항목 해소.
- **미검증 잔여 2건**: (a) 인트로 **영상** 업로드 경로 — 10MB 프론트 용량 제한에
  막혀 MIME 검증에 도달조차 못 함(별도 known-issue 등재). 규칙이 `video/` 접두
  하나뿐이고 동형 규칙인 이미지 경로가 통과했으므로 위험 낮게 판단. (b) 응답
  Content-Type 소문자화가 브라우저 렌더에 무영향이라는 판정은 RFC 9110 기반 추론.
  단 (a)의 카톡 미리보기 정상 노출이 소문자화 경로의 실동작 통과를 간접 시사.
- **미검증 영역**: iOS 기기의 `file.type` 실값(HEIC 등) 미실측. 안드로이드·PC만 확인.

## 2026-07-12 해소 — 이메일 도달성 (Gmail 스팸 / SPF alignment)

- **해소: 2026-07-12** — mail-tester 점검으로 도달성 확인, Gmail 정상 수신 확인. 원인·조치 상세 미기록.
- (이하 known-issues.md에서 이관한 원 항목 본문 — "네이버 메일 도달성 — 1차 점검 포인트 (메모)")
- 현황 (2026-05-08 점검): 1통 실측에서 네이버 받은편지함 정상 도달, 경고 배너 없음. 약한 고리 아님으로 판정하고 보류.
- 인증 측 정합성 모두 통과: SPF (send.congre.kr 등록), DKIM (resend._domainkey 등록, 외부 검증 일치), DMARC (p=none, 발행됨), Resend verified.
- 잠재 리스크: 메일 From 주소가 noreply@congre.kr (루트)인데 SPF는 send.congre.kr (서브)에 등록됨. SPF alignment 측면에서 mismatch이지만 DKIM alignment로 DMARC 통과 중인 것으로 추정. 신규 도메인 평판이 쌓이지 않은 상태에서 발송량이 늘면 도달성이 떨어질 가능성 잠재.
- 점검 트리거: 사용자(특히 네이버 메일 사용 학부모·교사)로부터 "메일이 안 옴" 또는 "스팸함에서 발견" 신고 발생 시.
- 점검 순서:
  1. 본인 네이버 계정으로 트랜잭션 메일 1통 발송 → 받은편지함/스팸함/미도착 확인
  2. 스팸함 / 미도착 → 다음 작업 후보 2가지:
     a. 루트 congre.kr에 SPF 추가 등록 (Resend 콘솔 가이드 따름)
     b. 코드 From 주소를 noreply@send.congre.kr로 변경
  3. 둘 중 어느 게 적절한지는 그 시점 Resend 권장 사항 + 발신자 표시 UX 우선순위로 결정
- 관련 결정: DECISIONS 2026-05-02 (이메일 발송 도메인 congre.kr)
- 2026-05-20 갱신: Firebase Auth 인증 메일도 noreply@congre.kr 발신으로 통합됨. Gmail 도달 실측 확인. 네이버 메일 실측은 미실시, 트리거 발생 시 점검.
- 2026-06-05 갱신: Gmail 도달 실측에서 스팸함 분류 확인(네이버는 받은편지함 정상). 점검 트리거 발동. SPF alignment mismatch(루트 noreply@congre.kr vs 서브 send.congre.kr SPF) 후속 작업(a/b) 검토 대상으로 격상. 본 수정은 별도 트랙.
- 2026-06-20 갱신(FGT 점검): Ray 증언 — 네이버도 처음엔 스팸함行이었으나 모종의 작업으로 정상화됨(작업 내용 불명). 위 "줄곧 정상" 기술은 그 변화를 누락한 stale. Gmail은 여전히 스팸 잔존(2026-06-20 확인). FGT는 지인에게 "Gmail이면 스팸함 확인" 안내로 우회. 네이버 작업 내용 규명 + Gmail SPF alignment 근본 해소는 2단계(침투 마케팅) 전 별도 트랙. 다음 세션 후보 3.
- 2026-07-03 갱신: 이메일 인증 발송 실패의 진짜 원인은 도달성이 아니라 Firebase 승인된 도메인에 app.congre.kr 누락(auth/unauthorized-continue-uri 400)이었음. 도메인 추가로 해결(핸드오프 2026-07-03). 발송이 뚫린 뒤 Gmail 받은편지함/스팸 분류 재확인은 다음 세션 후보 3으로 승계.

## 2026-07-12 해소 — 완성본 단일 필드 덮어쓰기 구조 (D2) + cleanup S3 삭제 누락

- **원 증상**: `events.videoS3Key` 단일 필드에 완성본 S3 키를 저장. 재렌더 시 새 키로 덮어써져 이전 완성본 포인터가 소실됐다.
- **해소**: `events.videos[]` 이력 배열 도입 (a315b05) + done 화면 이전 완성본 목록·다운로드 (3060532). 저장 구조는 2026-05-21 결정(서브컬렉션)을 폐기하고 배열 필드로 변경 — 사유는 decisions/data-flow.md 2026-07-12 참조.
- **함께 발견된 드리프트 (별건, 더 심각)**: Track ⑦(2026-06-11)에서 완성본 출력지를 Shotstack CDN → 자체 S3로 옮기면서, cleanup cron의 삭제 대상이 옛 위치에 남았다. 그 결과 완성본 S3 객체가 **한 번도 만료되지 않고 누적**됐고, 개인정보처리방침 제3조 "완성본 7일 후 삭제" 선언과 동작이 불일치했다. 33430b6으로 정정.
- **실측**: S3 루트 완성본 mp4 12개 / 0.337GB 중 Firestore가 참조하는 건 1개뿐. 고아 11개 / 0.322GB를 일회성 스크립트로 삭제(성공 11 / 실패 0). S3 라이프사이클 규칙은 0개로 확인(AWS 자동 만료도 없었음).
- **왜 06-02 정찰은 이걸 못 잡았나**: 그때는 완성본이 Shotstack CDN에 있었고 cleanup의 Shotstack 삭제 코드는 실제로 존재했다. 정찰 결론("삭제 코드 있음")은 그 시점엔 옳았다. 문제는 그 뒤 ⑦이 저장 위치를 바꾸면서 삭제 경로를 같이 안 옮긴 것이다.
- **학습**: **저장 위치를 바꾸는 작업은 쓰기 경로뿐 아니라 삭제 경로도 짝이다.** 데이터 이사를 하면 "그 데이터를 지우는 코드"의 목적지도 함께 확인한다.

## clips 컬렉션 보안 규칙 정비 필요 [RESOLVED 2026-06-18]

- **현황**: `clips` 컬렉션 보안 규칙이 `allow update, delete: if request.auth != null`. 인증된 호스트면 다른 호스트 클립도 update·delete 가능. 현재 클라이언트가 직접 Firestore에 쓰지 않고 Admin SDK 경유라 실질 위험 낮음.
- **개선 영역**:
  - `allow update, delete: if request.auth != null && exists(/databases/$(database)/documents/events/$(resource.data.eventId))` 같은 조건 추가 → 이벤트 호스트 검증
  - 또는 events 보안 규칙처럼 hostId 매칭 추가
- **격상 트리거**: 클라이언트 SDK가 clips 직접 쓰는 흐름 추가 시점 + 영업 진입 전 보안 점검
- **관련 영역**: launch-roadmap S4-09 D2 완성본 보존 (서브컬렉션 전환) 작업과 묶음 가능
- **출처**: 2026-05-19 v2 P1 정찰
- **해결**: 2026-06-18 `0a83224`에서 `allow read, create, update, delete: if false`
  로 완전 차단. 클라이언트 SDK가 clips를 만지는 흐름은 존재하지 않음
  (firebase/firestore import 파일 3개 = firebase.ts·users.ts·events.ts,
  clip mutation 전부 Admin SDK).
- **게시 확인**: 2026-08-06 Firebase 콘솔 규칙 탭 실측으로 게시본도
  `if false` 확인. 저장소-게시본 일치.

## ✅ BGM이 영상보다 짧으면 중간에 끊김 — soundtrack loop 미지원 [RESOLVED 2026-06-14]

**해소: 2026-06-14** — timeline.soundtrack(loop 미지원)을 audio clip 0.5s 겹침 직렬 트랙으로 대체. 커밋 0003a1d + 71f1a18.

- 원인: Shotstack soundtrack 속성은 loop 미지원(공식 확인). BGM이 영상보다 짧으면 끝까지 가서 멈추고 뒷부분 무음.
- 해결: probe로 BGM 길이(D) 측정 → 같은 src를 audio clip으로 start=i*(D-0.5) 직렬 배치, 마지막 조각 length=min(D, totalDuration-start)로 영상 끝에 정확히 맞춤(overflow 없음). soundtrack 키 제거.
- 이음새: stage 3버전 실측(무fade/transition fade/0.5s 겹침)에서 0.5s 겹침이 가장 깔끔 — 운영자 청취 판정.
- 회귀 안전: probe 실패 시 기존 soundtrack 방식으로 폴백(끊겨도 무음보단 나음).
- 검증: stage 실측(8클립 92s + lively BGM 70.5s) done 도달, 70s 지점 loop 이음새 + 92s 끝 정합 + 이름 자막 모두 운영자 청취 통과(2026-06-14). 출력 길이 92.010s(예상 91.976s, delta +0.034s = 1프레임 GOP 정렬, BGM 꼬리 아님).
- 버그 1건: 최초 구현(0003a1d)에서 audio clip volume을 clip 레벨에 둬 Shotstack 400 거부. asset 레벨로 이동해 해결(71f1a18). stage 분기 테스트로 asset.volume만 수락됨 확인.
- 관련 결정: decisions/rendering.md 2026-06-14.

**종결 일자**: 2026-06-14
**종결 사유**: audio clip loop 전환 + stage 실측(loop 이음새·끝 정합·자막) 운영자 청취 통과.

## ✅ 이름 자막 + intro 비디오 동시 사용 시 캡션 미세 어긋남 [RESOLVED 2026-06-14]

**해소: 2026-06-14** — BGM loop 작업에서 도입한 probe로 비디오 intro 길이를 측정해 captionStartOffset에 반영. 커밋 0003a1d.

- 원인: showNames 캡션이 numeric start로 동기되는데, intro 미디어가 비디오면 length:"auto"라 서버가 길이를 몰라 0으로 가정 → 캡션이 intro 비디오 길이만큼 일찍 시작.
- 해결: render/start에서 비디오 intro/outro presigned URL을 probe로 측정 → createRender intro.mediaDurationSec로 전달 → captionStartOffset 분기에 video 케이스 추가(L180), 측정 길이를 그대로 offset으로 사용.
- 회귀 안전: probe 실패 시 종전대로 0(과거 동작) 유지.
- 메모: 이미지 intro(5)·텍스트 intro(3)·intro 없음 케이스는 종전부터 정확했음. 비디오 intro 케이스만 어긋났고 이번에 해소.
- 관련 결정: decisions/rendering.md 2026-06-14 (라).

**종결 일자**: 2026-06-14
**종결 사유**: probe 도입으로 비디오 intro 길이 측정 가능해져 캡션 offset 정확화.

## ✅ 재렌더 완성품 품질 결함 — done 도달하나 결과 영상 비정상 [RESOLVED 2026-06-13]

**해소: 2026-06-13** — 결함 증상이 가로 클립의 비율 찌그러짐/양끝 잘림이었고, fit 값 정정 작업으로 자연 해소(별도 조치 없음).

- 원인: 완성본에서 가로 클립이 세로 캔버스(1080×1920)에 잘못 맞춰진 fit 처리. ⑦(전송) 해결 후 done까지 도달했으나 출력 품질이 비정상이었음.
- 해소 경로:
  - 2026-06-12 / 5780a2d: fit "cover"(Shotstack에서 stretch=비율 깨짐) → "crop"
  - 2026-06-13: fit "crop"(양끝 잘림) → "contain"(비율 유지 + 레터박스, 배경 #0c0b09)
- 검증: 운영자 화면 확인 — 완성 영상 정상 판정(2026-06-13).
- 메모: 2026-06-11 등재 시 증상 미기록 상태. 후속 fit 작업이 같은 결함의 원인이었음이 화면 확인으로 확정. 합성/순서/인트로·아웃트로/자막/BGM 등 다른 층 문제 아니었음.

**종결 일자**: 2026-06-13
**종결 사유**: 증상이 fit 관련 비율/잘림이었고 06-12·06-13 fit 정정으로 해소, 운영자 화면 검증 완료.

## 완성본 세로 찌그러짐 (fit cover=stretch) — 해결 (2026-06-12 / 5780a2d)
- 증상: 가로 클립이 세로 완성본(1080×1920)에서 비율 깨지며 세로로 늘어남.
- 원인: src/lib/shotstack.ts의 fit 값이 "cover"였고, Shotstack에서 cover는
  stretch(비율 깨고 늘림) 의미. CSS object-fit의 cover(비율 유지)와 정반대.
- 해결: 5780a2d — 참가자 클립 + intro/outro 미디어 모두 "crop"으로 교체.
  상세는 docs/decisions/rendering.md 2026-06-12 (1) 참조.
- 메모: 발견 당시 launch blocker. 출시 검증에서 done 도달 여부만 확인하고
  출력 품질(비율)을 보지 못한 사각지대였음. 이름값(cover) 추론으로 코드
  글자의 실제 의미를 의심하지 않았던 사고.

## 완성본 done 상태 재생 무한 재버퍼링 — 해결 (2026-06-11)
- 증상: 호스트 대시보드 완성본 재생이 2~3초만 나오고 까만 화면, BGM 도입부
  반복. 다운로드는 정상. duration은 정상 표시.
- 원인: done 이벤트의 5초 폴링이 GET /api/host/events/[eventId]를 반복 호출,
  매 응답마다 새 presigned videoUrl 발급(getVideoPresignedUrl, expiresIn
  3600). <video src={event.videoUrl}>가 5초마다 새 URL로 교체되어 받던
  영상 버리고 0부터 재시작.
- 해결: 69bff94 — fetchEvent 폴링이 status === "done"이면 다음 tick 예약
  안 함(폴링 자연 종료). videoUrl 발급 로직은 미변경.
- 관련: docs/handoff/2026-06-11-done-polling-playback-fix.md

## ✅ Track ⑦ — Shotstack→S3 복사 실패 (0바이트/AccessDenied) [RESOLVED 2026-06-11]

**해소: 2026-06-11** — IAM 정책 shotstack-s3-write에 소스 버킷 GetObject 권한 추가로 해결.

- 진짜 원인: shotstack-s3-write 정책에 arn:aws:s3:::shotstack-api-v1-output/* 대상 s3:GetObject 누락. 워커(user/shotstack-s3, prod 키)가 Shotstack 출력 버킷에서 결과물을 HeadObject로 읽으려다 AccessDenied. 우리 정책은 우리 버킷 권한만 보유.
- 해결: ShotstackSourceRead 블록(s3:GetObject on shotstack-api-v1-output/*) 추가. render ecc75d01에서 S3 도착·done 전환 정상 확인.
- 발견: CloudTrail Trail + Logs Insights로 워커 실호출 직접 판정. errorCode 필터로 단일 HeadObject AccessDenied 포착.
- 폐기 가설(사실 취급 금지): sandbox 키설(실제 prod 키), PutObject 403(실제 HeadObject), cross-account 불가설(우리 IAM 한 줄로 해결).

**종결 일자**: 2026-06-11
**종결 사유**: 근본 원인 확정 + 영구 권한 추가 + 재렌더 정상 흐름 검증 완료.

## ✅ OG 이미지 도메인 하드코딩 [RESOLVED 2026-06-06]

**해소: 2026-06-06** — 환경변수 환원 대신 하드코딩 유지로 종결.

- 현황: /upload/[eventId] OG 이미지 URL이 https://app.congre.kr로 하드코딩.
  이유: NEXT_PUBLIC_APP_URL 실제 값이 https://congre-three.vercel.app이라,
  사용자에게 보이는 OG 이미지 도메인을 정식 도메인으로 고정하기 위해 OG
  경로만 하드코딩함. 환경변수는 미변경(공유/크론 등 다른 사용처 영향 회피).
- 위치: src/app/upload/[eventId]/layout.tsx generateMetadata
- 격상 트리거: NEXT_PUBLIC_APP_URL을 app.congre.kr로 통일하는 도메인 정책
  정리 작업 시. 그때 이 하드코딩 제거하고 환경변수로 환원.
- 주의: OG 이미지 URL은 카카오가 영구 캐시하므로, 도메인을 바꾸면 이미
  뿌려진 초대장 미리보기가 깨질 수 있음. 도메인 확정 후 변경 권장.

**종결 일자**: 2026-06-06
**종결 사유**: 이슈가 가정한 동기("NEXT_PUBLIC_APP_URL 실제 값이 congre-three라서 OG만 정식 도메인으로 하드코딩")가 소멸. 환경변수가 app.congre.kr로 정정됨(커밋 7278923, 2026-06-05 트랙 B). 도메인이 app.congre.kr로 정착했고, OG 관련 URL 4곳(layout.tsx의 openGraph.images·openGraph.url·twitter.images + og-image route의 FALLBACK_URL)이 모두 app.congre.kr로 일관 하드코딩됨을 코드로 확인. 환경변수 환원은 (a) 도메인이 더 바뀔 일이 없어 YAGNI이고 (b) 카카오 OG 영구 캐시 특성상 환원 과정의 값 차이가 기존 초대장 미리보기를 깨뜨릴 위험만 추가하므로, 하드코딩을 의도적으로 유지하고 종결.

## ✅ L6. 본 앱 로컬 경로 OneDrive 안 [RESOLVED 2026-06-03]

**해소: 2026-06-03** — 본 앱 로컬 폴더를 C:\projects\congre 로 이전(OneDrive 밖). git clone + npm install + npm run build 통과 확인. 이전 폴더는 백업으로 잔류.

- **현황**: 본 앱 로컬 경로가 `C:\Users\PC\OneDrive\바탕 화면\my-project\congre`. OneDrive 폴더 안에 git 저장소 존재.
- **잠재 리스크**:
  - OneDrive가 `.git/` 동기화 시도하면서 `index.lock` 충돌 가능
  - 한글 폴더명("바탕 화면")이 일부 명령행 도구·환경 변수 호환 이슈
  - Webpack·Next.js 빌드 도중 OneDrive 파일 잠금으로 빌드 실패 사례 보고됨
- **현재 상태**: 운영자가 지금까지 정상 운영. 큰 사고 없음
- **발현 이력**: 2026-05-28 B 트랙 작업 중 `.next` 폴더 OneDrive 잠금으로 빌드 1회 실패 → `rm -rf .next` 후 재빌드로 우회 (세션 중 수 회). 격상 트리거(`npm run build` 간헐 실패) 실제 발현. 반복 빈도 증가 시 OneDrive 외부 이전 검토.
- **격상 트리거**:
  - git 명령이 "index.lock" 에러로 실패
  - `npm run build` 간헐 실패
  - 파일 저장 후 옛 내용이 다른 도구에서 보임
- **격상 시 처리**: OneDrive 외부 폴더로 이전 (예: `C:\projects\congre`)

## ✅ 환경변수 미등록 — CRON_SECRET / NEXT_PUBLIC_APP_URL [RESOLVED 2026-06-02]

- **CRON_SECRET**: 등록 확인됨(2026-06-02). 미설정 시 500/불일치 401인데 Vercel Logs GET 200 = env 등록·일치 확인.
- **NEXT_PUBLIC_APP_URL**: Vercel 등록 완료(`https://congre-three.vercel.app`). 등록 흔적: handoff/2026-05-05.md L43 / handoff/2026-05-14-user-guide-pdf-and-kakao-share-fix.md L19(잘못된 값 발견 후 재등록) / ROADMAP.md L6 체크 / PROJECT.md L82 표.
- **종결 일자**: 2026-06-02 / **종결 사유**: 두 변수 모두 Vercel 등록 완료 확인. known-issues.md "환경변수 미등록" 섹션은 CRON_SECRET 갱신(직전 커밋 cb9e5ce)에도 NEXT_PUBLIC_APP_URL 라인이 남아 있었으나, docs 교차 기록상 둘 다 등록 완료이므로 섹션 전체 종결.

## ✅ GitHub Actions cron throttling — `* * * * *` 매분 스케줄 실질적 미동작 [RESOLVED 2026-06-02]

- **현상**: `* * * * *` 스케줄 등록 후 약 4시간에 1회만 자동 실행됨 (2026-05-05 관측).
- **원인**: GitHub Actions free tier에서 고빈도 cron을 throttling. 공식 보장 없음.
- **조치**: `*/5 * * * *` (5분 간격)으로 변경 후 재관측 예정. 여전히 부족하면 외부 cron 서비스 또는 Vercel Cron Jobs로 이전 검토.
- **해결(2026-06-02)**: cron은 Vercel Cron(vercel.json)으로 운영, GitHub Actions 미사용. 본앱 Pro라 */5(5분) 정상, 2026-06-02 Vercel Logs에서 check-rendering·check-render-deadlines 모두 GET 200·에러 0 확인.

## ✅ 워터마크 시각 사양 정밀 수치 — CD 시안 검토 영역 [RESOLVED 2026-06-01]

- **현황**: 2026-05-29 (3) 결정에서 워터마크 시각 사양 박힘. 위치·텍스트·색·폰트는 확정. font.size "중간" 정밀치 + font.opacity "은은하게" 정밀치 + 우하 offset 정밀치 미정.
- **해결**:
  - 2026-05-30 정밀치 확정 (40px / 0.40 MEDIUM, decisions/rendering.md 2026-05-30).
  - 2026-06-01 본 앱 코드 구현 완료 (commits dc2b898·98404d5·552f373·d652e15·5ccd6e8). 무료 플랜 완성본 우하단 노출 검증 완료. decisions/rendering.md 2026-06-01 항목 참조.
- **종결 일자**: 2026-06-01 / **종결 사유**: 정밀치 결정 + 코드 구현 + 렌더 검증 모두 완료.

## ✅ 랜딩 data-screen-label 중복 [RESOLVED 2026-05-27]

- **현황**: 랜딩 `index.html`에서 `data-screen-label` 값이 두 번 겹침. 실제 중복은 05(Moments+Testimonials)·06(Occasions+Trust) 두 쌍. CTA·Footer는 단독.
- **위치**: `deploy/index.html`
- **발견 경위**: CD #4 (Landing v4 상태 확인) 자체 점검 시 발견
- **해결**: 2026-05-27 재번호화 01~10 순차로 정리. Testimonials 07, Trust 08, CTA 09, Footer 10. `data-screen-label`은 CSS·JS 셀렉터 비사용(grep 0건) 확인 → 시각·기능 영향 0. 본 사이클에선 vercel 재배포 안 함, 본격 디자인 수정 사이클 첫 배포 시 함께 반영.
- **종결 일자**: 2026-05-27 / **종결 사유**: 재번호화 4건 치환 완료.

## ✅ 랜딩 이미지 슬롯 50장 목표 → 41장 (9장 결손) [RESOLVED 2026-05-27]

- **현황**: 이미지 슬롯 50장 목표 중 41장 채워짐. 졸업·결혼·K-pop 외 Hero 추가 후보 영역
- **위치**: `deploy/.image-slots.state.json`
- **해결**: 2026-05-27 운영자 결정: 41장으로 마감. 더 손대지 않음.
- **종결 일자**: 2026-05-27 / **종결 사유**: 운영자 마감 결정.

## ✅ 랜딩 Occasions 4 타일 placeholder [RESOLVED 2026-05-27]

- **현황**: Occasions 7타일 중 챌린지·모임 외 4타일(기업·동창회·생일·추모)이 placeholder
- **결정 영역**: 운영자. (a) 영상 생성 후 임베드, (b) 정적 이미지로 유지, (c) 일부만 영상화
- **해결**: 2026-05-27 운영자 결정: 4타일에 이미지로 마감. 영상화 안 함.
- **종결 일자**: 2026-05-27 / **종결 사유**: 운영자 결정 옵션 (b).

## ✅ 회원 탈퇴 데드락 — closed 상태 차단 범위에서 제외 [RESOLVED 2026-05-21]

- **원인**: S2-04 P4 회원 탈퇴 사양에서 차단 대상 상태를 `["open", "closed", "rendering"]`으로 설정. 클립 0개로 마감한 이벤트는 rendering으로 전이 불가 → closed 영구 정체 → 탈퇴 불가.
- **발견 경위**: 2026-05-20 P4 실측 테스트. 빈 이벤트 마감 후 마이페이지 "진행 중 이벤트 1개" 차단 메시지 무한 노출. Firebase 콘솔 events 문서 직접 삭제로 우회.
- **해결**: 차단 범위를 `["open", "rendering"]`으로 축소. `api/user/delete/route.ts` + `mypage/page.tsx` 2곳 변경.
- **Race 평가**: closed → rendering 자동 전이 경로 없음 (사용자 명시적 호출만). race 확률 무시 가능.
- **종결 일자**: 2026-05-21 / **종결 사유**: 옵션 1 실행. 관련 결정: auth-model.md 2026-05-21 항목.

## ✅ getUserMedia constraints 처방 (5Mbps 코드) — native capture 전환으로 제거 완료 [RESOLVED 2026-05-18]

- **현황**: 2026-05-15 커밋 6ccd731로 `src/app/upload/[eventId]/page.tsx`에
  getUserMedia width/height 1080×1920 ideal + MediaRecorder
  videoBitsPerSecond: 5_000_000 명시.
- **후속 발견**: MediaRecorder API가 rotation 메타데이터를 박지 못하는 구조적
  한계로 세로 촬영 영상이 가로로 저장됨 (외부 자료 결정타 4건 확인).
- **결정**: native capture 전환 사양 확정. 사양 B 실행 시 본 처방 코드
  (constraints 명시 + videoBitsPerSecond)를 포함한 MediaRecorder 관련 약 200줄
  전체 제거됨.
- **5Mbps 처방의 가치**: 본 처방이 실패는 아님. 480p → 2160p / 2Mbps → 5Mbps
  개선 자체는 가설 A 진단의 정확한 처방. 다만 그 다음 단계로 회전 문제 발견
  → 처방 무대 자체가 다른 영역으로 이동.
- **관련 결정**: DECISIONS rendering.md 2026-05-15 native capture 전환 항목.
- **관련 핸드오프**: 2026-05-15-native-capture-decision.md
- **종결 일자**: 2026-05-18 / **종결 사유**: 사양 B 실행 시 src/ 전역 MediaRecorder·getUserMedia 0건 확인 (2026-05-18 정찰)

## ✅ 1a784d0 회귀 의심 → 미재현 확인 [RESOLVED 2026-05-18]

- **현황**: 1a784d0 (커밋 6: branch share URL target by invite content presence) 배포
  직후 일부 이벤트에서 "화면 stuck + 무한 호출" 사고로 보고됨. b98cb2c로 revert.
  이후 4f05a44로 동일 변경 재배포 + 운영자 단독 회귀 테스트 결과 **미재현**.
- **실제 진단**:
  - "무한 호출"은 5초 간격 정상 폴링 (setTimeout(fetchEvent, 5000),
    setTimeout(fetchClips, 5000))의 오진. 호출 빈도만 보고 무한 루프로 단정함.
  - "화면 stuck"은 실재 여부 불명. 무한 호출 오진과 묶여 회귀로 분류됐으나
    재검증 시 Console 깨끗, 화면 정상, 분기 양방향 동작 모두 정상.
- **학습**:
  - fetch 반복 보고 시 첫 질문은 호출 빈도가 아니라 **간격**. 5초·30초·1초
    어느 쪽이냐로 정상 폴링/실제 루프 즉시 갈림.
  - 사고 보고 두 가지가 동시 발생했을 때 한 원인으로 묶기 전에 각 현상의
    독립성 먼저 검증.
  - 검증 안 된 사고 보고는 가설로 표시. revert 결정의 근거가 다른 오진과
    묶여 있는지 점검.
- **관련 커밋**: 1a784d0, b98cb2c, 4f05a44
- **관련 핸드오프**: docs/handoff/2026-05-11-pr9-cont2.md
- **종결 일자**: 2026-05-18 / **종결 사유**: 항목 본문에 미재현 확인 종결 명시

## ✅ Android Chrome 14/15 file input 갤러리 직행 사고 [RESOLVED 2026-05-16 / fix: split file input]

- **해결**: idle stage에 두 input 분리. 큰 박스: `<input capture="environment">` (카메라 직접 호출). 보조 링크: `<input>` capture 없음 (갤러리). addpipe Solution 2 패턴.
- **원인**: Android 14/15 + Chrome 134-137에서 `<input type="file" accept="video/*">` 단독 사용 시 갤러리만 열리고 카메라 옵션 미노출. 사양 B(native capture 전환) 직후 발견.
- **외부 근거**: addpipe 2025-07 검증 (OnePlus 13 Android 15, Galaxy S21 FE Android 14). Chrome 이슈 트래커 issuetracker.google.com/issues/317289301 미해결.
- **위치**: `src/app/upload/[eventId]/page.tsx` idle stage JSX

## ✅ GitHub Actions cron throttling — `* * * * *` 매분 스케줄 실질적 미동작 [RESOLVED 2026-05-15]

- **해결**: Vercel Cron Jobs로 이전 완료 (vercel.json + `/api/cron/*` 엔드포인트). GitHub Actions workflow 제거. GitHub 저장소 Public 상태에서도 무제한 사용 가능한 Vercel Pro 크론으로 대체.
- **원인**: GitHub Actions free tier의 고빈도 cron throttling (`* * * * *` 등록 후 약 4시간에 1회 실행). 공식 보장 없음 (2026-05-05 관측).

## ✅ 사고 2① — outroText 인트로 구간 차례 표시 (cross-track 동기화 한계) [RESOLVED 2026-05-12 / refactor: drop outroText overlay]

- **해결**: [A] 분기에서 outroText overlay 자체 폐기. introText overlay만 보존.
- **원인**: Shotstack timeline cross-track 동기화 미지원. track[0] textClip의 "auto" start가 track[1] outroMedia 시작 시점이 아닌 timeline 전체 시작점 기준으로 배치됨.
- **위치**: `src/lib/shotstack.ts` createRender [A] 분기 textClips 배열

## ✅ 사고 2③ — 비대칭 입력(introMedia + outroText만)에서 outroText 무시 [RESOLVED 2026-05-12 / refactor: drop outroText overlay]

- **해결**: outroText overlay 폐기로 해당 케이스 자체 소멸. [B] 분기(미디어 없음)의 outroText 단일 track 동작은 사고 없이 정상 유지.
- **원인**: [A] 분기 textClips 조건이 `outro?.text && hasOutroMedia` 였음. outroText만 있고 outroMedia 없으면 textClip 생성 불가 구조.
- **위치**: `src/lib/shotstack.ts` createRender [A] 분기 textClips 배열

## ✅ 한글 인트로/아웃트로 기능 [RESOLVED 2026-05-12 / refactor: shotstack multi-track]

- **해결**: shotstack multi-track 구조 도입. 호스트 미디어 + 텍스트 overlay (Noto Sans KR TTF + fade transition + stroke + 반투명 박스). 트랙 2-A 항목 6 라운드 ①~③ 완결.
- **위치**: `src/lib/shotstack.ts`, `src/app/api/render/start/route.ts`
- **발견 경위**: 기존 코드 주석 "Shotstack 기본 폰트가 한글 미지원"이 잘못된 진단으로 확인. HTML asset + 커스텀 TTF 방식으로 가능함을 정찰로 발견.

## ✅ 인트로/아웃트로 편집 UI [RESOLVED 2026-05-12 / feat: add intro/outro upload UI]

- **해결**: 대시보드 상세 페이지에 인트로/아웃트로 텍스트(60자) + 미디어(이미지·영상 10MB) 편집 UI 추가. PATCH/GET API + invite-urls API + s3.ts 타입 동기화 포함. 트랙 2-A 항목 6 라운드 ② 작업분.
- **위치**: `src/app/dashboard/events/[eventId]/page.tsx`
- **발견 경위**: 트랙 2-A 항목 6 의제 진입 시 운영자 요건으로 확정.

## ✅ renderStartedNotifiedAt + renderCompletedNotifiedAt 알림 플래그 set 누락 [RESOLVED 2026-05-10]

- **해결**: 두 플래그 모두 알림 함수 호출 후 `FieldValue.serverTimestamp()` set 코드가 없었음. 각 호출 직후에 별도 `db.update()` 추가.
  - `render/start/route.ts`: `notifyRenderStarted()` `.catch()` 직후 `renderStartedNotifiedAt` set. 초기화 블록에 `renderCompletedNotifiedAt: null` 추가.
  - `check-rendering/route.ts`: `notifyRenderCompleted()` `.catch()` 직후 `renderCompletedNotifiedAt` set (organizerEmail/Phone 조건문 안).
- **원인**: `participantNotifiedAt` 등 다른 플래그는 set 코드가 있었으나, render-started/completed 두 시나리오는 알림 함수 호출만 있고 set 단계가 누락된 채 배포됨.
- **정찰 결과 (2026-05-10)**: SMS 발송 자체는 정상 동작 확인 (이벤트 MclmxNgLQBb8Lb6jexc9, "멱동성테스트"). renderCompletedNotifiedAt은 초기화도 set도 없이 코드베이스 참조 0건이었음.
- **위치**: `src/app/api/render/start/route.ts`, `src/app/api/cron/check-rendering/route.ts`

## ✅ SSR 서버 컴포넌트 getAdminDb() 중복 호출 — settings() throw [RESOLVED 2026-05-09]

- **해결**: `getAdminDb()` 내 `_db.settings()` 호출을 try/catch로 감쌈. "already initialized" 문자열 포함 에러만 무시, 그 외는 re-throw.
- **발현 조건**: SSR 서버 컴포넌트에서 `generateMetadata`와 페이지 함수가 각각 `getAdminDb()`를 호출할 때. Next.js SSR 모듈 격리로 두 함수가 별도 모듈 인스턴스에서 실행되면 `_db` 모듈 변수가 공유되지 않음 → 둘 다 `getFirestore()`로 같은 내부 객체를 받고 `.settings()` 두 번 호출 → throw.
- **격상 트리거**: SSR 서버 컴포넌트 내 `getAdminDb()` 호출자가 늘어나거나, Edge Runtime 등 다른 환경에서 동일 패턴이 깨지면 `globalThis` 싱글턴 패턴으로 격상 검토.
- **위치**: `src/lib/firebase-admin.ts` `getAdminDb()`, `src/app/share/[eventId]/page.tsx` (트리거 파일)

## ✅ 영상 편집 순서 역순 회귀 [RESOLVED 2026-05-09]

- **해결**: `render/start`에서 `includedDocs`를 `uploadedAt` 오름차순으로 sort 추가. `shotstack.ts`의 `.reverse()` 및 "내림차순 입력" 가정 주석 제거.
- **발견 경위**: 2026-05-09 운영자 사용성 테스트에서 먼저 올린 클립이 완성 영상 끝에 나오는 것 확인.
- **회귀 도입 커밋**: `de6551b` (2026-05-06, Phase B-3) — render/start가 클라이언트 s3Keys body 전달 → Firestore 서버 직접 read로 변경되면서 `orderBy` 누락. `shotstack.ts:62`의 ".reverse()가 내림차순 입력을 받는다" 가정이 깨짐. Firestore auto-ID 기반 반환 순서(≈ 생성 시각 오름차순)에 `.reverse()` 적용 → 최종 내림차순 출력.
- **영향 범위**: `src/app/api/render/start/route.ts` (sort 추가), `src/lib/shotstack.ts` (`.reverse()` 및 주석 제거). 대시보드 정렬(`host/clips/route.ts`)은 별도 코드라 무영향.

## ✅ 카메라 광각 고정 — 후면 표준 wide 자동 선택 [RESOLVED 2026-05-09]

- **해결**: `openCamera`에 `pickStandardBackCamera` 휴리스틱 추가. iOS는 라벨 "후면 카메라"/"Back Camera" 정확 매칭(가상 카메라 제외), Android는 두 번째 facing back 디바이스 선택. 휴리스틱 실패 시 원본 stream 유지(fallback).
- **휴리스틱 한계**: 운영자 갤럭시 S22+ + 아이폰 외 기기 미검증. 다른 폰에서 ultrawide가 잡힐 가능성 잔존.
- **격상 트리거**: 첫 회차에서 "내 영상이 광각으로 찍혀 이상하다" 호스트 또는 참가자 신고 시 → 사용자 카메라 선택 UI(옵션 5-C) 격상 검토.
- **후속 수정 (2026-05-09)**: Android "Could not start video source" — 기존 stream을 정지하지 않고 새 getUserMedia(deviceId) 호출 시 카메라 센서 점유 충돌. `pickStandardBackCamera` 내에서 `currentStream.getTracks().forEach(t => t.stop())` 선행 후 getUserMedia 호출로 수정. deviceId 호출 실패 시 facingMode fallback 추가.
- **영향 범위**: `src/app/upload/[eventId]/page.tsx` — `pickStandardBackCamera` 모듈 레벨 함수 추가, `openCamera` 내 후면 분기 추가.

## ✅ 랜딩 히어로 영상 무음 고정 — 소리 켜는 방법 없음 [RESOLVED 2026-05-09]

- **해결**: `LandingHeroVideo` 클라이언트 컴포넌트 신설. 영상 우하단에 VolumeX/Volume2 아이콘 버튼 추가 — 클릭 시 `video.muted` 토글. 기본은 무음 유지(브라우저 자동재생 정책 준수).
- **발견 경위**: 2026-05-09 필드 테스트 직전 사용성 테스트.
- **원인**: `autoPlay muted` 조합은 브라우저 자동재생 정책상 필수. `muted` 제거 시 재생 자체가 차단됨. Unmute 버튼 없어서 사용자가 소리를 들을 방법이 없었음.
- **영향 범위**: `src/app/page.tsx` (video 블록 → LandingHeroVideo 위임), `src/components/LandingHeroVideo.tsx` 신규.

## ✅ render-completed 이메일 "영상 확인하기" 버튼 → /host 리다이렉트 [RESOLVED 2026-05-09]

- **해결**: `src/emails/render-completed.ts`의 "영상 확인하기" 버튼 href를 `dashboardUrl` → `videoUrl`(Shotstack CDN)로 변경. 보조 링크는 "대시보드 열기"로 교체하여 `dashboardUrl` 유지.
- **발견 경위**: 2026-05-09 필드 테스트 직전 사용성 테스트 — 번갈아 호스트·참가자 역할 시 render_completed 이메일을 비로그인 상태에서 확인하면 "영상 확인하기" 클릭 시 /host 리다이렉트.
- **원인**: `render_completed` 이메일의 주 버튼이 `/dashboard/events/{id}` (호스트 인증 필요)를 가리키고 있었음. "영상 직접 링크"는 CDN URL이라 정상 동작.
- **영향 범위**: `src/emails/render-completed.ts` 1파일. 다른 이메일 템플릿(event-created, render-started 등)의 dashboardUrl 버튼은 대시보드 이동 목적이라 변경 대상 아님.

## ✅ handleClose silent fail — render/start 응답 미체크 [RESOLVED 2026-05-08]

- **해결**: handleClose의 render/start fetch 호출에 응답 코드 체크 추가. 에러 코드별 사용자 메시지 분기 (NO_CLIPS_AFTER_EXCLUSION, NO_CLIPS, NOT_CONFIGURED 등).
- 위치: `src/app/dashboard/events/[eventId]/page.tsx` `handleClose`
- 발견 경위: 클립 제외 기능 테스트 중 모든 클립을 제외한 채 마감 시도 → render/start가 400 NO_CLIPS_AFTER_EXCLUSION 반환했지만 클라이언트가 응답을 보지 않아 silent fail. event.status = "closed"이지만 renderStartedAt 미설정 상태로 정지.
- 잠재성: 클립 제외 기능 도입 이전부터 존재한 버그. 503/500 등 다른 에러도 동일하게 silent fail이었음. 이번에 처음 표면화.
- 운영 메모: 사고 발생한 어정쩡한 상태 이벤트(status=closed + renderStartedAt 없음)는 자동 복구 경로 없음. 발생 빈도 낮으므로 CS 채널(@congre 카카오톡)로 응대 후 Firestore 직접 정리.

## ✅ Phase 4 AI 렌더링 파이프라인 (완료)
- S3 업로드 정상
- Shotstack 렌더링 정상 (stage 환경, 워터마크 있음)
- 영상 재생 및 다운로드 정상
- 클립 타임라인 순서 수정 (uploadedAt 오름차순)

## ✅ [notifications:history] save failed — undefined 필드 처리 누락 [RESOLVED 2026-05-03 / bcfe1f3]

- **해결**: `src/lib/firebase-admin.ts`에서 db 인스턴스 캐싱 후 `settings({ ignoreUndefinedProperties: true })` 1회 적용. 이후 모든 Admin Firestore 쓰기에서 `undefined` 필드 자동 무시됨. 코드베이스 전체 의도적 `undefined` 사용 0건 확인(grep) 후 부작용 없음 판정.
- 위치: `src/lib/firebase-admin.ts` (`getAdminDb()` 함수)
- 현상: 알림 이력 저장 시 `save failed: undefined` 에러 발생 (일부 시나리오)
- 원인: `error`, `providerMessageId` 등 optional 필드가 `undefined`인 채로 Firestore `add()` 호출됨. Firestore Admin SDK는 기본적으로 `undefined` 값을 거부함
- 영향: history 저장 실패는 `.catch()`로 격리되어 있어 알림 발송 자체에는 영향 없었음. 이력 컬렉션 저장만 누락됐었음

## ✅ SMS 실패 시 failedMessageList 상세 사유 미출력 [RESOLVED 2026-05-03 / 79af076]

- **해결**: `catch` 블록에서 `MessageNotReceivedError` instanceof 분기 추가. `failedMessageList`를 순회해 `[statusCode] statusMessage (to: 수신번호)` 형식으로 콘솔 출력 + `history.error` 필드에 저장. 동적 재import로 instanceof 안전성 보장 (모듈 캐싱으로 비용 없음).
- 위치: `src/lib/notifications/channels/sms.ts`
- 현상: SOLAPI 거절 시 "1개의 메시지가 접수되지 못했습니다"만 표시, 상태코드·거절 사유가 콘솔·이력에 남지 않음
- 원인: `catch` 블록이 `err.message`만 반환, SOLAPI SDK `MessageNotReceivedError.failedMessageList` 미참조
- 검증: 발신번호 미등록(statusCode 1062) 시나리오로 검증 — before: 일반 안내문, after: `[1062] 발신번호 미등록 (to: 010xxxx)`

## ✅ render_delayed 장애 대응 시나리오 재설계 [RESOLVED 2026-05-04]

- 재설계 완료. 다단계 시간축(T+E / T+E+30분 / T+24h) + 환불 정책 적용.
- 크론 라우트([3]), 알림 템플릿 5종([2]) 구현 완료. GitHub Actions 워크플로 등록([5]) 및 운영 작업([6]) 진행 중.

## ✅ 영상 편집 결과물에 빈 시간/정지 화면 발생 [RESOLVED 2026-05-05 / ad4a352 → cad7b58]

- **원인**: `shotstack.ts`의 `CLIP_MAX_SEC = 10` 상수를 모든 클립 슬롯에 고정 적용 → 실제 클립이 짧으면 마지막 프레임 freeze 발생
- **해결 흐름**:
  - ad4a352: 옵션 A — 클라이언트 `loadedmetadata`로 duration 측정, Firestore `clips.durationSec` 저장, `createRender`에 누적 `startCursor` 적용
  - cad7b58: Shotstack Smart Clips 발견 → `start: "auto"`, `length: "auto"` 사용으로 전환. 클라이언트 측정 코드 원복. 길이 측정은 편집 도구 책임 원칙.
- **검증**: 짧은 클립 3개(약 3·6·9초)로 실제 렌더 테스트 — 결과 영상 길이가 클립 합과 일치, freeze 사라짐 확인

## ✅ clipCount 증가 실패 [RESOLVED 2026-05-07 / Phase B-2 자연 해결]

- **해결**: Phase B-2에서 클립 저장이 `POST /api/clips` 서버 라우트로 이전되면서 클라이언트 SDK의 `events.clipCount` `updateDoc` 호출 자체가 코드에서 제거됨. 서버 라우트는 `clipCount` 필드를 건드리지 않으며, `events` 문서의 `clipCount` 필드 자체가 사용되지 않음.
- **검증**: 코드베이스 전체에 `clipCount` increment/updateDoc 호출 0건. `clipCount` 참조 3곳은 모두 render-started 알림의 지역 변수(`s3Keys.length` 전달)로, Firestore 필드와 무관.
- **위치**: `src/app/api/clips/route.ts` (events update 없음), `src/app/api/render/start/route.ts:113` (지역 변수 사용)

## ✅ Shotstack rich-text 'Unknown property width/height' 400 에러 [RESOLVED 2026-05-08 / 37afdb8]

- **해결**: `makeTextClip`의 asset 객체에서 `width: 1080`, `height: 1920` 필드 제거. rich-text asset은 이 필드를 지원하지 않음. 해상도는 `output.size`에서 결정.
- **현상**: render/start → Shotstack POST → 400 "Validation failed — Found 2 validation errors: Unknown property 'width', Unknown property 'height'"
- **원인**: rich-text asset 스키마를 학습 데이터 기반으로 추정해 video asset과 혼용. WebFetch spec 실측 없이 구현.
- **학습**: Shotstack 필드 추가 전 공식 문서 실측 필수 (DECISIONS 2026-05-08 참조).

## ✅ 사용자 닉네임 회상 사고 [RESOLVED 2026-05-10 / PR 1]

- **해결**: 참가자 입력 사양이 닉네임 → 이름+전화번호로 변경(PR 1). 이름을 잊어도 전화번호가 기본 식별자가 됨. sessionStorage에 이름+전번 JSON으로 저장, 재방문 시 자동 미리 채움.
