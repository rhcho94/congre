# Resolved Issues

> known-issues.md에서 분리된 해결 완료 이력. 사고 재발 진단 시 grep 대상.
> 새 RESOLVED 항목 발생 시 known-issues.md에서 이 파일로 이동.

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
