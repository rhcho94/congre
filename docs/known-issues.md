# Known Issues & Deferred Tasks

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

## 환경변수 미등록 — 운영 작업 [6] 대기 중

- **CRON_SECRET**: `/api/cron/check-render-deadlines` Bearer 인증 토큰. 코드 준비 완료, Vercel + GitHub Secrets 등록 필요.
- **NEXT_PUBLIC_APP_URL**: 크론에서 dashboardUrl 구성 시 사용 (`https://congre-three.vercel.app`). Vercel 등록 필요.

## GitHub Actions cron throttling — `* * * * *` 매분 스케줄 실질적 미동작

- **현상**: `* * * * *` 스케줄 등록 후 약 4시간에 1회만 자동 실행됨 (2026-05-05 관측).
- **원인**: GitHub Actions free tier에서 고빈도 cron을 throttling. 공식 보장 없음.
- **조치**: `*/5 * * * *` (5분 간격)으로 변경 후 재관측 예정. 여전히 부족하면 외부 cron 서비스 또는 Vercel Cron Jobs로 이전 검토.

## ✅ 영상 편집 결과물에 빈 시간/정지 화면 발생 [RESOLVED 2026-05-05 / ad4a352 → cad7b58]

- **원인**: `shotstack.ts`의 `CLIP_MAX_SEC = 10` 상수를 모든 클립 슬롯에 고정 적용 → 실제 클립이 짧으면 마지막 프레임 freeze 발생
- **해결 흐름**:
  - ad4a352: 옵션 A — 클라이언트 `loadedmetadata`로 duration 측정, Firestore `clips.durationSec` 저장, `createRender`에 누적 `startCursor` 적용
  - cad7b58: Shotstack Smart Clips 발견 → `start: "auto"`, `length: "auto"` 사용으로 전환. 클라이언트 측정 코드 원복. 길이 측정은 편집 도구 책임 원칙.
- **검증**: 짧은 클립 3개(약 3·6·9초)로 실제 렌더 테스트 — 결과 영상 길이가 클립 합과 일치, freeze 사라짐 확인

## 한글 인트로/아웃트로 기능 미구현

- **현상**: 행사 주최자가 인트로/아웃트로 텍스트를 입력하는 기능 없음. `shotstack.ts`에 타이틀 클립 자체가 없음.
- **배경**: 기존 코드에 "Shotstack 기본 폰트가 한글을 지원하지 않아 자막 깨짐 발생"이라는 주석이 있었으나 잘못된 진단. Shotstack은 HTML asset + 커스텀 TTF 폰트(예: Noto Sans KR) 방식으로 한글 렌더링을 지원함.
- **향후 작업**: 대시보드에 인트로/아웃트로 입력 UI 추가 → 한글 TTF 호스팅 → Shotstack timeline에 HTML asset 삽입
- **우선순위**: 미정. 필드 테스트 시작 후 사용자 피드백 기반 결정.

## ✅ clipCount 증가 실패 [RESOLVED 2026-05-07 / Phase B-2 자연 해결]

- **해결**: Phase B-2에서 클립 저장이 `POST /api/clips` 서버 라우트로 이전되면서 클라이언트 SDK의 `events.clipCount` `updateDoc` 호출 자체가 코드에서 제거됨. 서버 라우트는 `clipCount` 필드를 건드리지 않으며, `events` 문서의 `clipCount` 필드 자체가 사용되지 않음.
- **검증**: 코드베이스 전체에 `clipCount` increment/updateDoc 호출 0건. `clipCount` 참조 3곳은 모두 render-started 알림의 지역 변수(`s3Keys.length` 전달)로, Firestore 필드와 무관.
- **위치**: `src/app/api/clips/route.ts` (events update 없음), `src/app/api/render/start/route.ts:113` (지역 변수 사용)

## 네이버 메일 도달성 — 1차 점검 포인트 (메모)

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

## 미성년자 영상 법적 리스크 — 시장 진입 전 검토 필요

- **현상**: 1순위 시장(학교 졸업식)이 미성년자 영상 수집·처리. 단순 "이용약관 체크"로는 부족할 수 있음.
- **검토 영역**:
  - 개인정보보호법상 미성년자 동의 절차 (부모 동의 필수 여부)
  - 클립에 다른 학생 얼굴 비치는 경우 그 학생들 부모 동의
  - 영상 보존 기간 (학교 기록물 관리 규정 적용 가능성)
- **우선순위**: 시장 진입 결정 시점 전 법무 검토 필수. 운영자 1인 비개발자 상황에서 기술 사고보다 법무 리스크가 큼.
- **현재 처리**: 미정. 결정 시 DECISIONS.md에 추가 예정.

## ✅ Shotstack rich-text 'Unknown property width/height' 400 에러 [RESOLVED 2026-05-08 / 37afdb8]

- **해결**: `makeTextClip`의 asset 객체에서 `width: 1080`, `height: 1920` 필드 제거. rich-text asset은 이 필드를 지원하지 않음. 해상도는 `output.size`에서 결정.
- **현상**: render/start → Shotstack POST → 400 "Validation failed — Found 2 validation errors: Unknown property 'width', Unknown property 'height'"
- **원인**: rich-text asset 스키마를 학습 데이터 기반으로 추정해 video asset과 혼용. WebFetch spec 실측 없이 구현.
- **학습**: Shotstack 필드 추가 전 공식 문서 실측 필수 (DECISIONS 2026-05-08 참조).

## Shotstack console.error 디버그 로그 영구 보존 (메모)

- **현황**: `shotstack.ts` createRender의 non-OK 분기에 `console.error("[shotstack] non-OK response:", res.status, text)` 영구 보존 확정 (DECISIONS 2026-05-08).
- **위치**: `src/lib/shotstack.ts` — `if (!res.ok)` 블록
- **이유**: Vercel 서버 로그가 유일한 원격 디버깅 채널. throw 전 전체 응답 본문 출력이 진단에 결정적이었음 (width/height 오류 발견).
- **운영 메모**: 프로덕션에서 Shotstack API 스키마 변경/오류 발생 시 Vercel 로그 → Functions 탭 → "non-OK response" 검색으로 바로 확인 가능.

## 인트로/아웃트로 편집 UI 미존재 — 이미 생성된 이벤트 수정 불가

- **현상**: 이벤트 생성 시 입력한 인트로/아웃트로 텍스트를 생성 후 수정하는 UI 없음. 잘못 입력했거나 변경하려면 Firestore 직접 수정 필요.
- **위치**: `src/app/dashboard/events/[eventId]/page.tsx` — 이벤트 상세 대시보드에 편집 폼 없음
- **우선순위**: 미정. 필드 테스트에서 수정 요구 발생 시 구현 검토.
- **임시 대응**: Firestore 콘솔에서 `events/{eventId}` 문서의 `introText`/`outroText` 필드 직접 수정.

## 재렌더 UX 갭 — done 상태 버튼 미노출, 클립 토글 모달 없음

- **현황**: 재렌더 버튼이 `status === "closed" && clips.length > 0` 조건에서만 노출 (정찰 B7). `status === "done"` 완성 후엔 안 보임. 클립 제외 토글 UI도 별도 섹션에 있어 재렌더 직전 토글 화면을 다시 보여주는 흐름 아님.
- **위치**: `src/app/dashboard/events/[eventId]/page.tsx` — done 상태 블록, 재렌더 버튼 조건부 렌더링
- **결정 사항**: DECISIONS 2026-05-09 (D1) 재렌더 정책에서 "done 상태에도 노출 + 클립 토글 모달" 사양 확정.
- **처리 시점**: 필드 테스트 첫 회차 결과 보고 갈래 5에서 처리.

## 완성본 단일 필드 덮어쓰기 구조 — D2 구현 시 전환 예정

- **현황**: `events/{eventId}.videoUrl` 단일 필드에 Shotstack URL 직접 저장 (정찰 E15, `src/app/api/cron/check-rendering/route.ts:45`). 재렌더 시 이전 영상 URL 소실. 한 이벤트는 단일 완성본만 보존하는 구조.
- **결정 사항**: DECISIONS 2026-05-09 (D2) 완성본 보존 정책에서 서브컬렉션 `events/{eventId}/renders/{renderId}` 전환 사양 확정.
- **처리 시점**: 갈래 6 (7일 보관 + 삭제 알림) 작업 시 동시 전환.
