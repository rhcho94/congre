# Known Issues & Deferred Tasks

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

## 환경변수 미등록 — 운영 작업 [6] 대기 중

- **CRON_SECRET**: `/api/cron/check-render-deadlines` Bearer 인증 토큰. 코드 준비 완료, Vercel + GitHub Secrets 등록 필요.
- **NEXT_PUBLIC_APP_URL**: 크론에서 dashboardUrl 구성 시 사용 (`https://congre-three.vercel.app`). Vercel 등록 필요.

## GitHub Actions cron throttling — `* * * * *` 매분 스케줄 실질적 미동작

- **현상**: `* * * * *` 스케줄 등록 후 약 4시간에 1회만 자동 실행됨 (2026-05-05 관측).
- **원인**: GitHub Actions free tier에서 고빈도 cron을 throttling. 공식 보장 없음.
- **조치**: `*/5 * * * *` (5분 간격)으로 변경 후 재관측 예정. 여전히 부족하면 외부 cron 서비스 또는 Vercel Cron Jobs로 이전 검토.

## ✅ 영상 편집 결과물에 빈 시간/정지 화면 발생 [RESOLVED 2026-05-05 / ad4a352]

- **해결**: `CLIP_MAX_SEC = 10` 고정값 제거. 클라이언트(`upload/page.tsx`)가 `loadedmetadata` 이벤트로 실제 duration을 측정하여 Firestore `clips.durationSec`에 저장. `render/start`가 `durationsSec[]`를 수신해 `createRender`에 전달. `createRender`는 누적 `startCursor`로 각 클립의 `start`·`length`를 정확히 계산.
- **원인**: `shotstack.ts`의 `CLIP_MAX_SEC = 10` 상수를 모든 클립 슬롯에 고정 적용 → 실제 클립이 짧으면 마지막 프레임 freeze 발생
- WebM `Infinity` duration 예외: `Number.isFinite(d) && d > 0` 검증 실패 시 `lastTimerRef.current`(타이머 최종값)로 폴백

## clipCount 증가 실패 (무시됨)
- 현상: 업로드 시 events.clipCount 증가 permission-denied 발생
- 원인: 비로그인 참가자가 events 문서 update 불가 (Firebase 규칙)
- 현재 처리: .catch()로 무시 중. 클립 목록은 onSnapshot으로 직접 세므로 기능 영향 없음
- 해결 방법: Firebase 규칙에서 clipCount 필드만 비로그인 update 허용
  또는 Cloud Function으로 clipCount 업데이트 위임
- 우선순위: 배포 전 처리
