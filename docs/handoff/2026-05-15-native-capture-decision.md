## 세션 한 줄 요약

필드테스트 영상 화질 처방(가설 A) 후속으로 발견된 회전 메타 문제 외부 자료
조사 + 진단 + native capture (`<input type="file" accept="video/*" capture>`)
전환 결정. 호스트 가변 시간 제한(5~30초, 기본 15초) 동반 도입 결정. 사양 5개
확정. 코드 변경 0건. 다음 세션 첫 작업은 Shotstack `length` 동작 정찰.

## 본 세션 커밋 (1건)

| # | 해시 | 메시지 | 핵심 변경 |
|---|---|---|---|
| 1 | TBD | docs: native capture transition decision and spec | 본 핸드오프 + DECISIONS rendering.md + known-issues.md 정정 |

origin/main push 완료.

---

## Track A — MediaRecorder 회전 한계 진단

### 진입점

운영자 가설 A 처방(getUserMedia constraints + videoBitsPerSecond 명시) 적용 후
ffprobe 검증에서 해상도 480×640 → 2160×1216 / 비트레이트 2Mbps → 5Mbps 개선
확정. 그러나 운영자 보고: 미리보기에 세로로 보였던 영상이 파일에선 가로,
"전면 카메라 얼굴이 다 안 들어갈 정도로 화각이 좁아짐". 채팅 클로드 1차
가설("MediaRecorder가 세로 회전 인식 못 함")이 운영자 발언("미리보기에서는 꽉
찬 세로")으로 깨짐.

### 정정된 진단 메커니즘

폰 카메라 센서는 항상 가로 좌표계로 출력. 미리보기 박스(`aspectRatio: "9/16"`
+ `object-cover`)는 가로 영상을 세로 박스에 끼우면서 좌우 잘라 표시 → "꽉 찬
세로"로 보임. 파일은 잘리지 않은 가로 원본 그대로 S3 저장. Shotstack은
rotation 메타 없는 가로 영상을 받아 세로 viewport에 fit "cover"로 배치하면서
가운데 잘라냄.

### 외부 자료 결정타 4건

1. **WebKit Bugzilla #198912**: iOS MediaRecorder incorrect screen orientation
   handling — 미해결 버그
2. **videojs-record GitHub #370**: "iOS Safari에서 portrait mode 녹화 시 프레임
   90도 회전 + 9:16 stretch"
3. **RecordRTC GitHub #395**: "portrait video stream 640×480 displayed → 480×640
   recorded sideways, no rotate tag in metadata"
4. **Android 공식 문서**: `setOrientationHint()`로 rotation 박는 네이티브 API
   존재. **JavaScript MediaRecorder에는 대응 메서드 없음**

→ MediaRecorder API로 정상 세로 영상 만드는 표준화된 방법 없음. 구조적 한계.

### 업계 표준 해법 2갈래 (외부 자료)

- **갈래 A — `<input type="file" capture>`** (W3C HTML Media Capture): 폰 OS의
  카메라 앱을 직접 호출. 회전·코덱·해상도·인코딩 전부 OS 처리. AddPipe, Pipe
  등 상업 영상 녹화 SaaS의 모바일 default.
- **갈래 B — Canvas + DeviceOrientation 우회**: 코드 복잡, 성능 비용, 코덱은
  여전히 Baseline + Opus.

### Track A 학습 한 줄

> 같은 영역에서 두 번째 사고 발생 시 처방 추가 전에 외부 자료부터. 첫 처방으로
> 일부 풀렸다고 같은 도구로 더 풀린다는 보장 없음. 본 세션 채팅 클로드 1차
> 가설이 운영자 한 마디로 깨진 사례 1회 추가.

---

## Track B — 결정 사항 5건

| # | 항목 | 결정 | 근거 |
|---|------|------|------|
| 1 | 캡처 방식 | native capture (`<input type="file" accept="video/*">`) | MediaRecorder 회전 한계 / 업계 표준 / 코덱·해상도·인코딩 OS 위임 |
| 2 | 시간 제한 | 호스트 가변 (5~30초, default 15) | 졸업식·결혼식 등 시장별 길이 다름 |
| 3 | 초과 길이 처리 | Shotstack trim 서버 컷 | 사용자 재촬영 부담 0 / Shotstack 1줄 추가 |
| 4 | preview stage | 유지 | 사용자 영상 확인 후 업로드 권리 |
| 5 | capture 속성 | 미지정 (OS UI 선택) | 사용자 익숙함 우선 |

운영자 결정 흐름: 채팅 클로드 추천 → 운영자 검토 → 질문 5만 추천(A 셀카
default)에서 C(미지정) 정정. 나머지 4건 추천대로.

---

## Track C — 정찰 결과 (CC)

### 항목 1 — 이벤트 데이터 모델

- 이벤트 생성: `src/app/dashboard/create/page.tsx`. form state {title, date,
  plan, organizerEmail, organizerPhone}
- introText/outroText는 create 페이지에 없음 → 대시보드 별도 입력 경로
- Firestore events/{eventId}: title, date(Timestamp), plan, hostId,
  status("open"), sessionToken, uploadToken, createdAt, organizerEmail,
  organizerPhone, introText?, outroText?
- maxClipSeconds 추가 자리: create/page.tsx + api/events/route.ts +
  api/events/[eventId]/route.ts + upload/[eventId]/page.tsx

### 항목 2 — Shotstack timeline

- 참가자 video clip: `fit: "cover"`, `length: "auto"` (`src/lib/shotstack.ts`
  128-134줄)
- 인트로/아웃트로 이미지: `length: 5` 고정, 비디오는 `length: "auto"`
- **trim 옵션 코드 어디에도 없음**
- MAX_SEC=16의 강제는 클라이언트 타이머만. Shotstack 쪽은 length: "auto"
- 가변 시간 도입 시 Shotstack 영향: `length: maxClipSeconds` + `asset.trim`
  조합 검토 필요. 원본 < length일 때 Shotstack 동작 미명시 (다음 세션 정찰
  필요)

### 항목 3 — 16초 제한 위치 (6곳)

| 파일 | 라인 | 내용 |
|------|------|------|
| upload/[eventId]/page.tsx | 14 | `const MAX_SEC = 16` 상수 |
| upload/[eventId]/page.tsx | 323 | 타이머 자동 중단 조건 |
| upload/[eventId]/page.tsx | 327 | 타이머 최대값 |
| upload/[eventId]/page.tsx | 431 | 진행 바 계산 |
| upload/[eventId]/page.tsx | 596 | "최대 16초 · 탭하여 시작" 안내 |
| guide/guest/page.tsx | 116 | "최대 16초. 권장은 인당 10초 이내." 가이드 |

API에서 영상 길이 체크 없음.

### 항목 4 — Stage 판정

10개 stage 중 standby/recording 제거 대상. preview는 결정 4로 유지 확정.
나머지 7개 stage 유지(idle은 버튼 레이블만 변경).

제거 코드 범위 약 200줄 (pickStandardBackCamera, openCamera, switchCamera,
beginRecording, stopEarly, stopStream + 관련 state/refs/useEffect/JSX).

---

## Track D — 최종 사양 (4건)

### 사양 A — 데이터 모델
- create/page.tsx: form state + 6옵션 셀렉터 UI + POST body
- api/events/route.ts: body 타입 + 검증 5~30 + Firestore add
- api/events/[eventId]/route.ts: 반환 객체에 maxClipSeconds 포함
- default 15

### 사양 B — 참가자 업로드 페이지
- 제거 200줄 / 추가 약 50줄 (file input + handleFileSelected)
- preview stage 유지. blobRef/previewUrlRef/previewRef 재사용
- idle stage 버튼/안내 텍스트 동적 변수화

### 사양 C — Shotstack timeline (미확정 부분 포함)
- 참가자 video clip: `length: maxClipSeconds` + `asset.trim: 0` 추가
- **⚠️ 다음 세션 첫 정찰**: 원본 < length일 때 Shotstack 동작 (검은 화면 /
  freeze / 짧게 끝남)
- 대비책 후보: `length: "auto"` 유지하고 `asset.trim` 조합으로 자르기 검증

### 사양 D — 가이드 페이지
- guide/guest/page.tsx:116 일반화 ("최대 시간은 이벤트에 따라 다릅니다")

---

## 다음 세션 첫 작업 — Shotstack length 동작 정찰

### 정찰 항목

1. Shotstack 공식 문서 재검색: `clip.length` > 원본 영상 길이일 때 동작
2. community.shotstack.io 검색: 동일 케이스 사례
3. 필요 시: stage 환경에서 짧은 테스트 영상으로 실험 (5초 영상 + length: 30
   설정하여 결과 확인)

### 정찰 결과에 따라 사양 C 확정 후 작업 순서

1. Shotstack length 정찰 → 운영자 결정
2. 사양 A 실행 (데이터 모델 4파일) — atomic 커밋
3. 사양 B 실행 (upload page 교체 200줄 제거 + 50줄 추가) — atomic 커밋
4. 사양 C 실행 (shotstack.ts + 호출부) — atomic 커밋
5. 사양 D 실행 (guide 텍스트) — 커밋 4번에 함께 또는 별도
6. 필드테스트 재실시 + ffprobe 검증

### 다음 세션 검증 결정타 시그니처

- 해상도: 폰 네이티브 (보통 1080×1920 세로 또는 그 이상)
- 프로파일: **H.264 High** (Baseline 아님)
- 오디오: **AAC** (Opus 아님)
- rotation 메타: **있음**
- 비트레이트: 폰 네이티브 (10~17Mbps 추정)

세 결정타 (High / AAC / rotation 있음) 다 정상이면 native capture 전환 성공.

---

## 다음 세션 시작 시 운영자 작업 — 5개 셋트

- CLAUDE.md (자동 첨부)
- AGENTS.md (자동 첨부)
- 본 핸드오프 (`2026-05-15-native-capture-decision.md`) ← 운영자 직접 첨부
- DECISIONS.md 인덱스 (자동 첨부)
- known-issues.md (자동 첨부)

작업 영역 파일 (진입 시):

| 시나리오 | 추가 첨부 |
|---------|----------|
| Shotstack length 정찰 (1번 작업) | `src/lib/shotstack.ts` |
| 사양 A 실행 (2번 작업) | `src/app/dashboard/create/page.tsx`, `src/app/api/events/route.ts`, `src/app/api/events/[eventId]/route.ts` |
| 사양 B 실행 (3번 작업) | `src/app/upload/[eventId]/page.tsx` (가장 큰 변경) |
| 사양 C 실행 (4번 작업) | `src/lib/shotstack.ts` + cron/render 호출부 |

**첫 메시지 한 줄**:

"본 핸드오프 외엔 모르는 것으로 간주. 진입점은 Shotstack length 정찰."

---

## 본 세션 학습

1. **외부 자료 조사 트리거**: 같은 영역 두 번째 사고 발생 + 운영자 발언으로
   1차 가설 깨짐 → 외부 자료 본격 조사 신호. 본 세션이 그 사례 (직전 처방
   성공 후 회전 문제 발견 → MediaRecorder 한계 검색)

2. **단편 단서 → 전체 단정 패턴 본인 학습 누적 (직전 세션 3회 + 본 세션 1회 =
   누적 4회)**. 본 세션 사례: 두 번째 클립(2160×1216)에서 "MediaRecorder가
   세로 회전 인식 못 한다"고 단정 → 운영자 "미리보기엔 꽉 찬 세로" 한 마디로
   깨짐. **누적 4회 도달. CLAUDE.md 정식 등재 검토 후보**.

3. **추측 금지 모드 작동 사례**: 운영자 "추측·가설 하지 말고 검색해" 지시
   후 외부 자료 60+ 출처 5단계 검색 → 결정타 4건 확보 → 사양 결정. 추측
   모드보다 한 번에 정확한 답에 도달.

---

## 보정 후보 누적 큐 — 본 세션 추가 없음. 잔여 1건

| # | 항목 | 출처 |
|---|------|------|
| 1 | globals.css 전체 재점검 + PROJECT.md 디자인 토큰 섹션 완전 동기화 | 2026-05-15 이전 세션 |

## 거론 보류 큐 — 본 세션 추가 없음

(직전 핸드오프 계승)

## 보류 큐 (운영자 트리거 대기)

- Track 1-B 카메라 광각 픽스: **native capture 전환으로 자동 해결 예정** (OS가
  처리)
- Track 4 작은 버튼 3건 부담 가능 (실전 후 평가)
- Track 5 빈 텍스트 의도적 비우기 불가 (YAGNI 보류)

## 예정된 작업 트리거

- AWS 무료 트라이얼 만료 30일 전 (~2026-09-28)
