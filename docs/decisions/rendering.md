# Decisions — Rendering

> 영상 편집·Shotstack·클립·재렌더 관련 결정. 새 결정은 맨 위에 추가 (최신이 위).

## 2026-05-09 — 렌더링 클립 정렬 책임을 shotstack.ts에서 render/start로 이동

- **결정**: `shotstack.ts`는 입력 순서를 그대로 신뢰. 호출자(`render/start`)가 `uploadedAt` 오름차순 sort를 수행. JS sort callback 방식.
- **이유**: 회귀 원인이 "내림차순 입력 가정"이 호출자 변경(Phase B-3)으로 깨진 것 — 가정 자체를 없애는 게 정합. 명시적 sort가 render/start 코드에 있어야 향후 변경 시 의도 파악 가능. Firestore `orderBy` + 복합 인덱스 대비 운영 작업 0.
- **대안 검토**:
  - 갈래 B (`.reverse()`만 제거): "Firestore auto-ID ≈ 생성 시각" 비공식 보장에 의존 → 기각
  - 갈래 C (Firestore `orderBy` + 복합 인덱스): 인덱스 생성 운영 작업 추가 필요 → 기각
- **자체 학습**: Phase B-3 같은 큰 리팩토링 시 수정 코드의 출력을 받는 호출자의 가정을 점검하는 단계 누락. 다음 큰 리팩토링 시 grep 기반 호출자 가정 체크를 단계에 포함.

## 2026-05-09 — 재렌더 정책 (D1): 횟수 무제한, 경고 모달, 실서비스 시 사전 결제

- **결정**: 재렌더 횟수 무제한. 사용자가 [영상 다시 만들기] 클릭 시 경고 모달 노출. 실서비스 단계에서는 사전 결제 게이트 추가. 필드 테스트 단계는 결제 없이 경고 모달만.
- **추가 결정**: 재렌더 버튼을 `status === "done"` 상태에도 노출 (현재는 `"closed"`에서만 노출). 클릭 시 클립 토글 모달로 제외/포함을 다시 선택할 수 있게 함.
- **이유**:
  - 운영자 사용 패턴 인식상 "완성 영상 보고 클립 다시 선택해서 재렌더"가 흔한 케이스. 빈도 높음 + 복구 경로 부재 = 우선순위 격상.
  - 종량제 과금 모델에서 재렌더 비용은 사용자 부담. 횟수 제한은 사용자 가치를 깎고 운영자 부담은 안 줄임.
- **보류 의제** (실서비스 진입 시점에 결정): 사전 결제 시점이 종량제와 어떻게 결합되는지. 결제 모델 설계 의제로 별도 트랙.
- **대안**:
  - 재렌더 N회 제한: 사용자 가치 손실 + 종량제 모델과 부정합 → 기각.
  - 클립 토글 모달 없이 사전 토글 후 재렌더만: 발견율 낮음, 사용자 학습 비용 → 기각.

## 2026-05-09 — 카메라 광각 사고: 휴리스틱 자동 선택(옵션 5-A) 채택

- **결정**: `openCamera` 후면 호출 시 `pickStandardBackCamera` 휴리스틱으로 표준 wide 자동 선택. iOS는 라벨 매칭("후면 카메라"/"Back Camera"), Android(갤럭시 S22+ 기준)는 두 번째 facing back 디바이스. 휴리스틱 실패 시 원본 stream fallback.
- **이유**: 학생 사용자 학습 비용 0(카메라 선택 UI 없음), 운영자 사양 "기본 카메라 필수" 충족. 휴리스틱이 깨지는 기기는 known-issues 격상 트리거로 처리.
- **대안 검토**:
  - 옵션 5-B(자동 선택 + 실패 시 선택 UI): 작업 범위가 크고 첫 회차 일정에 영향 → 보류
  - 옵션 5-C(사용자가 항상 카메라 선택): 참가자 학습 비용 발생 → 보류
- **정찰 근거**: 갤럭시 S22+ 실측 — camera 0(deviceId 8182bd5c) = 표준 wide, camera 2(deviceId f2634c39) = ultrawide. 아이폰 실측 — 라벨 "후면 카메라" 단독 = 표준 wide, 가상 카메라(트리플·듀얼·울트라·망원 포함 라벨)는 제외.
- **미검증 기기 리스크**: 갤럭시 S22+, 아이폰 외 기기에서 Android 두 번째 휴리스틱이 틀릴 수 있음. 첫 회차 피드백 기반 격상 여부 결정.
- **후속 수정 (2026-05-09)**: Android 카메라 센서 점유 해제 — `pickStandardBackCamera`에서 새 `getUserMedia` 호출 전 `currentStream` 트랙 정지. deviceId 실패 시 `facingMode: { ideal: "environment" }` fallback 추가. openCamera 호출부에서 stream.stop() 제거(내부로 이동), fallback도 실패 시 error stage 전환.

## 2026-05-08 — Shotstack 필드 추가 전 공식 문서 WebFetch 선행

- **결정**: Shotstack API 필드 추가·변경 전 WebFetch로 공식 문서(또는 OpenAPI spec) 실측 후 구현. 학습 데이터 기반 필드 추정 금지.
- **이유**: `width`/`height` 필드를 rich-text asset에 추가했다가 "Unknown property" 400 에러 (commit 37afdb8에서 제거). Shotstack 학습 데이터가 실제 현행 스키마와 불일치함 확인.
- **적용**: Shotstack 필드 추가·변경 작업 시 → spec 실측 → 구현. 런타임 에러 발생 시에도 동일하게 spec 실측 우선.

## 2026-05-08 — Shotstack rich-text asset 채택, timeline fonts 주입, length 3초 고정

- **결정**: 한글 인트로/아웃트로 클립에 HtmlAsset 대신 `rich-text` asset 사용. 커스텀 폰트는 `timeline.fonts: [{ src: ... }]`로 주입. 클립 `length: 3` 고정 (auto length 미검증).
- **필드 주의사항**: `align.vertical`은 `"middle"` ("center" 아님 — top/middle/bottom). `width`/`height` 필드 없음 (해상도는 output.size에서 결정).
- **이유**: WebFetch로 Shotstack 공식 문서 실측. rich-text가 단순 텍스트·배경·폰트 조합에 더 간단한 API. HtmlAsset은 스키마 불명확하고 자유도만 높아 사고 확률 높음.
- **폰트 URL**: `${NEXT_PUBLIC_APP_URL}/fonts/NotoSansKR-Regular.ttf`. 인트로/아웃트로 없는 이벤트는 fonts 주입 건너뜀.
- **대안**: HtmlAsset + `<style>@font-face{...}</style>` 인라인 — 복잡도 높음, 검증된 예시 없음 → 기각.

## 2026-05-08 — Shotstack non-OK 응답 console.error 영구 보존

- **결정**: `shotstack.ts` `createRender`의 non-OK 분기에 `console.error("[shotstack] non-OK response:", res.status, text)` 영구 보존. 진단용 임시 추가 아닌 운영 코드로 확정.
- **이유**: Vercel 서버 로그는 배포 환경에서 운영자가 접근할 수 있는 유일한 원격 디버깅 채널. 400 에러 text를 200자 슬라이스로만 throw하면 로그에서 원인 파악 불가. console.error는 클라이언트에 노출되지 않으므로 보안 비용 없음.
- **대안**: 에러 throw만 유지, console.error 제거 — Shotstack API 스키마 변경/신규 필드 오류 재발 시 원격 진단 불가 → 기각.

## 2026-05-08 — 마감 후 렌더 재시도 경로 도입

- **결정**: 대시보드에 [영상 생성 다시 시작] 버튼 추가. 노출 조건 `event.status === "closed" && clips.length > 0`. 버튼 클릭 시 기존 render/start 재호출. 서버 라우트는 status 체크 없이 진행되므로 수정 불필요.
- **이유**:
  - 도메인 제약: 행사 당일 참가자 100명에게 다시 업로드 요청 불가능 → 올라간 클립은 어떤 경우에도 살려서 렌더 가능해야 함.
  - 직전 NO_CLIPS_AFTER_EXCLUSION 픽스(5c4559a)는 alert만 띄우고 사용자에게 막다른 길 제공 — 이 도메인 제약 위반.
- **대안 검토**:
  - CS 카톡 응대로 운영자가 Firestore 직접 조작: 1인 운영 + 행사 당일 즉시성 요구 불일치 → 기각.
  - closeEvent + render/start를 트랜잭션처럼 묶기 (마감 롤백): 보안 모델 변경 + 작업 분량 큼 → 기각.
  - `status === "closed"` 단독 조건 (clips.length 무시): 클립 0개 이벤트에서 의미 없는 버튼 노출 → 기각.
- **자체 학습**: 직전 결정에서 재시도 버튼을 "발생 빈도 낮음 + YAGNI"로 기각했으나, "발생 시 복구 불가능" 도메인 제약을 운영자가 명시한 후에야 잘못된 판단임을 발견. 빈도가 낮아도 발생 시 복구 불가면 비용은 빈도와 무관하게 큼. 향후 결정 시 "사고 시 복구 경로"를 도메인 제약으로 미리 검토.

## 2026-05-08 — 클립 제외 기능: excludedAt Timestamp 필드, JS 필터, 양방향 토글

- **결정**: 클립 제외 상태를 `clips.excludedAt: Timestamp | null` 필드로 관리. `render/start`에서 Firestore 조회 후 JS 필터(`!d.data().excludedAt`)로 적용. 주최자 대시보드 클립 행에 양방향 토글 버튼 (Eye/EyeOff 아이콘). 낙관적 업데이트 후 API 실패 시 롤백.
- **이유**:
  - Timestamp는 boolean 대비 언제 제외했는지 디버깅 정보를 보존. 미존재 필드(기존 클립)와 null(복원된 클립)을 동일하게 처리 가능.
  - JS 필터: Firestore `where("excludedAt", "==", null)` 사용 시 `excludedAt` 필드 미존재 문서가 쿼리에서 누락됨 (Firestore 동작 특성). JS 필터는 이 사고를 원천 차단 + composite index 불필요.
  - 양방향 토글: 제외 후 실수 복구 가능. 주최자 UX 안전.
- **대안 검토**:
  - `excluded: boolean` 필드: 시각 정보 없음. boolean → timestamp 마이그레이션은 정보가 없어 비용이 큰 반면 timestamp → boolean은 정보 줄이는 방향이라 거의 안 일어남. 비대칭 비용 → 기각.
  - Firestore where 절 필터: 미존재 필드 사고 위험 + composite index 필요 → 기각.
  - 단방향 삭제(Firestore doc delete): 실수 복구 불가 → 기각.
- **전체 제외 가드**: JS 필터 후 0개면 `400 NO_CLIPS_AFTER_EXCLUSION`. 기존 `NO_CLIPS`(클립 자체 0개)와 에러 코드 구분.

## 2026-05-06 — 클립 길이 정책: 인당 10초 이내

- **결정**: 사용자 1명이 올리는 클립 길이는 **10초 이내**.
- **이유 (3가지가 동시에 같은 답)**:
  - **콘텐츠**: 짧은 인터뷰는 5~10초가 자연스러움. 30초 넘기면 산만.
  - **원가**: Shotstack은 렌더 시간 단위 과금. 30초 클립 × 100명 = 50분 영상. 10초 × 100명 = 16분 40초. 단가 3배 차이가 인당 천원 가격에 직접 박힘.
  - **시청 완주율**: 5~16분이 SNS 공유·재시청 가능한 길이. 50분짜리는 끝까지 안 봄.
- **하한**: 별도 정책 없음 (필요시 추가 결정).

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
