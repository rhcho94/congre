# Decisions — Rendering

> 영상 편집·Shotstack·클립·재렌더 관련 결정. 새 결정은 맨 위에 추가 (최신이 위).

## 2026-05-23 — outroText + outroMedia 동시 입력 사고 해소 (갈래 C: 직렬 배치)

- **사고**: outroText + outroMedia 동시 입력 시 [A] 분기에서 outroText 무시됨. UI "✓ 저장됨" 피드백으로 호스트 입장 원인 파악 불가.
- **사양**: [A] 분기 mediaClips 배열 끝에 `outro?.text` 조건부로 `makeTextClip(outro.text, "auto", false, 3)` 직렬 추가.
- **결정 영역**:
  - overlayMode=false — [B] 분기 outroText 처리와 통일
  - 같은 track[1] 안 직렬 배치 — cross-track 동기화 문제 해당 없음 (2026-05-12 폐기 결정과 별개)
- **검증 영역**: 실제 렌더 후 outroMedia 뒤 outroText 정상 출력 시각 확인.
- **변경 영역**: src/lib/shotstack.ts

## 2026-05-23 — transition in/out 분리 (pickSequence 2회 호출)

- **사양**: videoClips.map 영역 transition.in과 transition.out을 각각 독립적인 pickSequence 호출로 결정. POOL은 그대로 (TRANSITION_POOL 4종).
- **사유**: 시각 다양성 영역 격상. 한 클립이 fadeFast로 들어와 zoom으로 나가는 등 in/out 다양화 가능.
- **결정 영역**:
  - 같은 POOL 사용 (POOL 분리 안 함 — YAGNI, 검증 데이터 없음)
  - 한 클립 in/out 강제 분리 안 함 (우연히 같아도 OK — YAGNI)
- **검증 영역**: 실제 렌더 후 시각 확인 영역. 인접 회피는 in/out 각각 적용되나 한 클립 내부 in/out 일치 가능.
- **변경 영역**: src/lib/shotstack.ts

## 2026-05-23 — clip 개별 volumeEffect 도입 (참가자 video clip만)

- **사양**: videoClips.map 영역 asset에 `volumeEffect: "fadeInFadeOut"` 추가. volume 미지정 (현재 그대로 — 일률 조절 부작용 회피).
- **적용 범위**: 참가자 video clip 전용. makeMediaClip(intro/outro 미디어) 영역과 rich-text overlay 영역에는 적용 안 함.
- **사유**: 야외 촬영 30개 영상 cut 영역 음량 급변 흡수. BGM volume 0.1로 충분히 낮아 인터뷰 음성 묻힘 부담 없음.
- **검증 영역**: 페이드 시간 영역 Shotstack 공식 명시 없음 — 실제 렌더 후 시각·청각 확인 영역.
- **변경 영역**: src/lib/shotstack.ts

## 2026-05-19 — iOS Safari capture 480p 사고 처리 정책 (옵션 B)

### 사고

iPhone Safari에서 `<input type="file" capture="environment">`로 촬영 시
영상이 **480×360 H.264 Baseline 0.7 Mbps**로 강제 다운샘플링됨. 갤러리
경로(capture 속성 없음)는 1920×1080 High 15.5 Mbps 정상. 안드로이드 Chrome
은 native capture 정상(1920×1080 High 16.9 Mbps).

원인: WebKit Bug #238366 — Apple 의도적 제한. capture 속성값 무관 동일
파이프라인. JS 단 우회 불가.

### 결정

옵션 B — iOS 감지 → "지금 촬영하기" 버튼 숨김 + 갤러리 전용 안내.

근거:
- 1순위 시장(학교 졸업식) = 추억 보존 목적. 480p는 졸업식 추억으로 부적합
- 옵션 A(capture 속성 제거)는 사용자가 카메라 선택해도 480p — 근본 해결 아님
- 옵션 C(안내만 추가, 버튼 유지)는 안내 못 본 사용자 480p 사고 그대로 — 결과 양분
- 옵션 D(현재 흐름 유지)는 "알면서 영업 진입" 후속 호스트 클레임 약점

### 사양

- **OS 판정**: iOS 전체 (iPhone + iPod). 브라우저 무관 — Apple WebKit
  강제 정책으로 iOS Chrome·Firefox도 동일 사고. iPad는 iOS 13+ 데스크톱
  UA 스푸핑으로 감지 불가 → known-issues 등재 (deferred)
- **iOS 검출 시 UI**:
  - "지금 촬영하기" 버튼 DOM에서 제거
  - "갤러리에서 선택"을 메인 버튼 스타일로 격상 (큰 박스, 앰버 액센트)
  - 안내 박스 추가:
    > iPhone 사용 중이시군요
    > iOS 정책상 iPhone 즉석 촬영은 화질이 낮습니다.
    > 미리 카메라 앱으로 영상을 찍어두신 뒤 아래 버튼을 눌러주세요.
- **안드로이드 + 데스크톱**: 기존 흐름 유지 (촬영 + 갤러리 둘 다 노출)

### 트레이드오프

- 학생이 졸업식 당일 즉석 한마디 찍는 흐름이 iPhone에서 3단계로 늘어남
  (카메라 앱 열기 → 촬영 → 우리 앱 갤러리 선택)
- 사전 촬영 흐름은 1080p 보장

### 관련 영역

- known-issues "iPad — iOS Safari capture 480p 사고 미처리" 항목
- WebKit Bug #238366 외부 영역. 해결 시점 미정

## 2026-05-16 — Android Chrome 14/15 file input 사고 — 카메라/갤러리 두 input 분리

- **결정**: idle stage에 큰 박스(`capture="environment"`, "지금 촬영하기")와
  보조 텍스트 링크(capture 없음, "갤러리에서 선택") 두 input 분리. addpipe Solution 2 패턴.
  두 input 모두 동일한 handleFileSelected 핸들러 재사용.
- **근거**: addpipe 검증 결과 (Android 14/15 Chrome/Edge에서 단일
  `<input type="file" accept="video/*">`는 갤러리만 열림). Chrome 이슈 트래커
  issuetracker.google.com/issues/317289301 미해결. 비표준 트릭 대비 표준 사양 안에서
  안정적이고 양쪽 OS 일관 동작 보장.
- **영향**: 게스트 흐름 사고 해소. 1순위 시장(즉석 촬영) 우선, 보조 시장
  (미리 찍은 영상) 갤러리 옵션 보존.

## 2026-05-16 — Shotstack 클립별 length 동적 계산 (사양 C)

- **결정**: createRender 시그니처를 `s3Urls: string[]` → `clips: Array<{src: string; length: number}>`로 변경.
  videoClips 조립 시 `length: clip.length`, `trim: 0` 명시.
  호출부에서 `length = Math.min(duration, maxClipSeconds)` 계산 후 전달.
- **근거**: Shotstack 공식 문서에서 `length > 원본 영상`일 때 last frame freeze 동작 확인.
  결혼식·졸업식 시장에서 영상 늘어짐은 상품성 손실 — 운영자 결정 (옵션 B 선택).
- **영향**: createRender 시그니처 변경. 호출처 1곳(render/start/route.ts) 동시 수정.
  native capture 전환 시리즈 사양 D(구 MediaRecorder 코드 정리)만 남음.

## 2026-05-16 — 참가자 업로드 native capture 전환 + duration 측정

- **결정**: MediaRecorder 파이프라인 제거 (~200줄). `<input type="file" accept="video/*">`으로 교체.
  preview stage 유지, capture 속성 미지정 (사용자가 OS UI에서 카메라·갤러리 선택).
  duration은 `<video>.duration`으로 측정하고 NaN/Infinity/≤0/120초 초과는 차단.
- **근거**: MediaRecorder 회전 메타 한계 (2026-05-15 외부 자료 결정타 4건).
  클라이언트 duration 측정으로 사양 C의 Shotstack length 동적 계산에 필요한 데이터 확보.
- **영향**: clips Firestore 스키마에 duration(초, float) 필드 추가. 사양 C에서 length 계산에 사용.

## 2026-05-16 — 참가자 영상 최대 길이를 호스트가 5~30초 가변 설정

- **결정**: 이벤트 생성 시 호스트가 6옵션 셀렉터(5/10/15/20/25/30초)로 maxClipSeconds 선택. default 15.
- **근거**: 졸업식·결혼식 등 시장별 적정 클립 길이 차이. 기존 16초 고정 대비 유연성 확보.
  5초 미만은 발화 내용 담기 어려움, 30초 초과는 결과 영상 길어져 시청 이탈 위험.
- **영향**:
  - events Firestore 스키마에 maxClipSeconds 필드 추가.
  - 사양 B: 참가자 upload 페이지에서 maxClipSeconds 읽어 카운트다운 변수화.
  - 사양 C: Shotstack render API에서 maxClipSeconds로 length 동적 계산.
- **사양 시리즈**: A(본 결정) → B(참가자 페이지) → C(Shotstack) → D(후속 정리)

## 2026-05-15 — MediaRecorder → native capture 전환 결정 (사양 확정, 미실행)

- **문제**: getUserMedia constraints 명시(가설 A 처방)로 해상도/비트레이트 개선
  후 발견된 회전 메타 부재 문제. 폰 세로로 들고 촬영해도 가로 영상 저장.
  MediaRecorder API의 구조적 한계 (WebKit Bugzilla #198912, RecordRTC #395 등).
- **결정**: `<input type="file" accept="video/*">` (W3C HTML Media Capture)
  전환. OS 카메라 앱이 회전·코덱·해상도·인코딩 전부 처리.
- **동반 결정** (호스트 가변 시간 제한):
  - 호스트가 이벤트 생성 시 maxClipSeconds 선택 (5/10/15/20/25/30초, default 15)
  - 초과 길이는 Shotstack trim으로 서버 컷
  - preview stage 유지
  - file input capture 속성 미지정 (사용자가 OS UI에서 선택)
- **트레이드오프**:
  - 잃는 것: "Congre 안에서 직접 녹화" 일체감, 클라이언트 16초 시간 제한 강제
  - 얻는 것: 폰 네이티브 카메라 화질, 회전 정상, AAC 오디오, High 프로파일,
    iOS Safari 호환성, 200줄 코드 제거
- **검증 결정타**: H.264 High 프로파일 / AAC / rotation 메타 있음 — 3개 시그니처
- **미확정 부분 (다음 세션 첫 정찰)**: Shotstack `length` > 원본 영상일 때 동작
  공식 미명시. 검은 화면 / freeze / 짧게 끝남 중 어느 것인지 정찰 필요. 결과에
  따라 `length: "auto"` + `asset.trim` 조합으로 사양 정정 가능성.
- **관련 핸드오프**: 2026-05-15-native-capture-decision.md

## 2026-05-15 — 참가자 영상 캡처 해상도·비트레이트 코드 명시

- **문제**: 참가자 업로드 영상이 480×640 + 낮은 비트레이트로 캡처돼 화질 천장이 480p로 고정됨. Shotstack 1080p 업스케일해도 체감 화질 개선 없음.
- **원인**: `src/app/upload/[eventId]/page.tsx`의 getUserMedia / MediaRecorder가 해상도·비트레이트를 명시하지 않아 브라우저(Chrome MediaRecorder) 기본값 480×640 사용.
- **결정**:
  - getUserMedia constraints에 `width: { ideal: 1080 }, height: { ideal: 1920 }` 추가 (3개 호출 위치 모두).
  - MediaRecorder 생성 시 `videoBitsPerSecond: 5_000_000` (5 Mbps) 명시.
  - 폴백 경로 `video: true`는 변경하지 않음 (constraint 거부 시 안전망 유지).
- **트레이드오프**:
  - 1080p 채택 사유: 최종 렌더 1080p이므로 원본 끝까지 유지가 합당.
  - 5 Mbps 채택 사유: 8 Mbps 대비 차이 체감 작은데 업로드 부담만 증가 (YAGNI).
  - iOS Safari가 `videoBitsPerSecond` 무시할 가능성 있음. 무시되어도 에러 없이 기본값 사용 → 손해 없음 구조.
- **검증**: 필드테스트 재실시 후 ffprobe로 원본 해상도/비트레이트 확인. 480×640 → 1080×1920 변경 확인.
- **관련 핸드오프**: 2026-05-15-fieldtest-quality-and-handoff-cleanup.md Track A

## 2026-05-15 — Shotstack output에 fps 30 + quality high 명시

- **결정**: `createRender` output 블록에 `fps: 30`, `quality: "high"` 명시 추가.
- **변경 영역**: `src/lib/shotstack.ts` — output 블록
- **단가 영향**: 없음. Shotstack 공식 문서 확인: 렌더 크레딧은 영상 길이 기준 (1분 = 1크레딧), fps·quality 값 무관.
- **화질 마진**: 실제 체감 개선 폭은 제한적. 원본이 스마트폰 MediaRecorder WebM 480p 내외 천장이라 업스케일 없음. 후반부 MP4 인코딩 압축 아티팩트는 완화 기대.
- **진짜 화질 개선 경로**: 업로드 MediaRecorder 설정 개선 (비트레이트·해상도 상향) 갈래에서 처리 예정. 본 결정은 서버 사이드에서 할 수 있는 최선 적용.
- **출처**: Shotstack 공식 API 문서 (output object 스펙) WebFetch 실측 기반. DECISIONS 2026-05-08 "Shotstack 필드 추가 전 공식 문서 WebFetch 선행" 원칙 적용.

## 2026-05-13 — BGM volume 재조정 (0.2 → 0.1)

- **결정**: `timeline.soundtrack.volume`을 0.2에서 0.1로 낮춤.
- **변경 영역**: `src/lib/shotstack.ts`
- **사유**: 직전 조정(0.3 → 0.2) 시각·청각 확인 결과 BGM이 여전히 참가자 음성보다 또렷·우세. 0.2 → 0.1로 50% 감소시켜 청각 변화 명확히 확인. Shotstack volume이 선형 스케일이면 0.3→0.2(33% 감소)는 청각상 미미할 수 있다는 추정 반영. 옵션 C(수동 ducking) 격상 여부는 본 조정 결과로 결정.

## 2026-05-13 — BGM volume 조정 (0.3 → 0.2)

- **결정**: `timeline.soundtrack.volume`을 0.3에서 0.2로 낮춤.
- **변경 영역**: `src/lib/shotstack.ts`
- **사유**: 직전 결정(BGM 도입, volume 0.3) 시각·청각 확인 결과 참가자 음성이 BGM에 묻힘 발생. 0.2로 낮춰 음성 우선 정합 강화. ducking 옵션 A 유지 (수동 ducking 옵션 C 격상 안 함 — 첫 조정으로 묻힘 해결 여부 재확인 후 판단).

## 2026-05-13 — BGM 도입 (timeline.soundtrack)

- **결정**: Shotstack `timeline.soundtrack`으로 BGM 삽입.
  - `src`: `${NEXT_PUBLIC_APP_URL}/audio/bgm.mp3` (public 호스팅)
  - `effect`: `fadeInFadeOut`
  - `volume`: 0.3
- **호스트 옵션 없음**: 음악 1개 코드 고정. UI 미노출.
- **영상 클립 volume**: 손대지 않음 (기본 1.0 유지).
- **변경 영역**: `src/lib/shotstack.ts`, `public/audio/bgm.mp3`
- **부수 정리**: `appUrl` 변수 스코프 상향 (hasAnyText 분기 위로), 에러 메시지 `MISSING_APP_URL_FOR_INTRO_OUTRO` → `MISSING_APP_URL` 일반화.
- **사유**: 트랙 2-A 시각 확인 결과 "기능적 OK, 감성적 미달" → 감성 영역 보완. 정찰 결과 BGM 감성 기여도 높음. 음악 1개 고정은 YAGNI 정합 (다양성 가치 미검증 → 첫 회차 시각·청각 확인 후 평가). volume 0.3은 ducking 옵션 A 채택 (참가자 음성 우선, BGM은 깔린 듯이). 첫 시각·청각 확인 결과에 따라 조정 가능.

## 2026-05-13 — TRANSITION_POOL 재조정 + Ken Burns effect 폐기 (트랙 2-A 항목 4 조정, 항목 3 폐기)

- **결정**: TRANSITION_POOL을 7종 → 4종으로 축소, EFFECT_POOL(Ken Burns) 완전 제거.
- **새 TRANSITION_POOL**: `fadeFast`, `slideLeftFast`, `slideRightFast`, `zoom` (4종)
- **제거 항목**: `slideUpFast`, `slideDownFast`, `wipeLeftFast`, `wipeRightFast` (세로/와이프 계열 — 첫 시각 테스트에서 세로 방향 영상에 어색)
- **zoom 추가**: speed suffix 없는 유일한 transition 타입. Shotstack 레퍼런스 확인 후 추가.
- **Ken Burns(effect) 폐기 사유**: 10초 내외 영상에서 zoomInSlow/zoomOutSlow 효과가 시각적으로 감지 불가. transition으로 충분한 동적 효과 확보 판단.
- **EFFECT_POOL 전면 제거**: 코드에서 EFFECT_POOL 상수, effects 배열, videoClips의 effect 속성 모두 삭제.
- **변경 영역**: `src/lib/shotstack.ts`

## 2026-05-13 — Ken Burns effect (트랙 2-A 항목 3)

- **결정**: 참가자 video clip 각각에 `effect` 속성 추가. `zoomInSlow` / `zoomOutSlow` 2종 풀, 인접 회피로 교차 패턴.
- **풀**: `zoomInSlow`, `zoomOutSlow` (Ken Burns 정의 — 줌 계열만)
- **속도**: Slow suffix 고정 (감성적 미세 줌)
- **인접 회피**: 풀 2종이므로 결과적으로 zoomInSlow → zoomOutSlow → zoomInSlow 교차.
- **적용 범위**: 참가자 클립만. intro/outro 미디어 클립(makeMediaClip)·텍스트 클립(makeTextClip)은 변경 없음.
- **사유**: 항목 4(transition) 완료 후 항목 3 진입. Slow 속도로 클립 재생 중 미세한 줌 움직임 적용.
- **추가 리팩터**: transition·effect 선택 루프를 `pickSequence` 헬퍼로 추출 (동일 패턴 2회 사용).
- **변경 영역**: `src/lib/shotstack.ts`

## 2026-05-13 — 참가자 클립 인아웃 transition 효과 (트랙 2-A 항목 4)

- **결정**: 참가자 video clip 각각에 `transition: { in, out }` 속성 추가. 7종 풀에서 무작위 선택 + 인접 회피.
- **풀**: `fadeFast`, `slideLeftFast`, `slideRightFast`, `slideUpFast`, `slideDownFast`, `wipeLeftFast`, `wipeRightFast`
- **속도**: Fast suffix 고정 (Shotstack transition 속도 제어는 Fast/기본/Slow suffix 3단계만 가능, 수치 지정 불가).
- **in/out**: 같은 종류로 통일. 분기 없음.
- **인접 회피**: 직전 클립과 같은 종류면 재추첨. 풀 크기 7 ≥ 2이므로 무한 루프 없음.
- **적용 범위**: 참가자 클립만. intro/outro 미디어 클립(makeMediaClip)·텍스트 클립(makeTextClip)은 변경 없음.
- **사유**: 다양성 + 인접 회피로 연속 동일 효과 방지. cont5 정찰로 duration 수치 지정 불가 확인 후 Fast suffix 채택.
- **변경 영역**: `src/lib/shotstack.ts`

## 2026-05-12 — outroText overlay 폐기, probe API 도입 폐기

- **결정**: [A] 분기(듀얼 track)에서 outroText overlay 제거. introText overlay만 보존. [B] 분기(미디어 없음, 단일 track)의 outroText 처리는 변경 없음.
- **폐기 사유 (probe API)**:
  - 브라우저 MediaRecorder 생성 WebM에 duration 메타데이터 없음 → probe가 null 반환 (Shotstack 커뮤니티 확인). 참가자 클립 전부가 이 케이스.
  - probe 호출당 비용 미확증 (Shotstack Help Center에 항목 없음).
  - 두 한계 모두 해소 불가 → probe 도입 효용 보장 안 됨.
- **폐기 사유 (outroText overlay)**:
  - cross-track 동기화 한계: outroText 시작 오프셋을 track[1] outroMedia 시작 시점에 맞출 수 없음 (Shotstack timeline의 cross-track 동기화 미지원).
  - probe 없이 outroMedia duration을 서버에서 알 방법 없음.
- **해소된 사고**: 사고 2①(아웃트로 텍스트가 인트로 구간에 차례 표시) + 사고 2③(비대칭 입력에서 outroText 무시).
- **보존 동작**: [A] 분기 introText overlay(fade + stroke + 반투명 박스). [B] 분기 outroText 단일 track 직렬 배치.
- **관련 커밋**: `refactor: drop outroText overlay to resolve cross-track sync limitation`

## 2026-05-12 — Multi-track 구조로 인트로/아웃트로 미디어 + 텍스트 overlay 지원

- **결정**: shotstack timeline을 조건부 분기로 듀얼/단일 track 구성.
  - **[A] 듀얼 track**: 인트로 또는 아웃트로에 미디어 있을 때. track[0] 텍스트 overlay + track[1] 미디어
  - **[B] 단일 track**: 미디어 둘 다 없을 때. 현재 코드 동작 그대로 보존
- **길이**: 사진 5초 고정, 영상 원본 길이("auto"). 인트로 텍스트 3초 고정. 아웃트로 텍스트는 outroMedia 길이에 동기화.
- **outroText 동기화 한계**: outroMedia 없을 때 outroText가 [A] 분기에서 무시됨. cross-track 정확한 끝 동기화는 probe API 필요 — 본 의제 외.
- **스타일 (overlay 모드)**: stroke 외곽선 + 반투명 박스(opacity 0.5) + fade in/out transition.
- **스타일 (text-only 모드)**: 기존 동작 보존. background.opacity 명시 안 함 (불투명).
- **알려진 한계**: [A] 분기에서 outroText 단독(outroMedia 없음) 케이스는 overlay 안 됨. 운영상 비대칭 입력(intro 미디어 있음 + outro 텍스트만)이 실제로 드물 것으로 예상.
- **관련 커밋**: `refactor: shotstack multi-track with intro/outro media overlay`

## 2026-05-09 — 렌더링 클립 정렬 책임을 shotstack.ts에서 render/start로 이동

- **결정**: `shotstack.ts`는 입력 순서를 그대로 신뢰. 호출자(`render/start`)가 `uploadedAt` 오름차순 sort를 수행. JS sort callback 방식.
- **이유**: 회귀 원인이 "내림차순 입력 가정"이 호출자 변경(Phase B-3)으로 깨진 것 — 가정 자체를 없애는 게 정합. 명시적 sort가 render/start 코드에 있어야 향후 변경 시 의도 파악 가능. Firestore `orderBy` + 복합 인덱스 대비 운영 작업 0.
- **대안 검토**:
  - 갈래 B (`.reverse()`만 제거): "Firestore auto-ID ≈ 생성 시각" 비공식 보장에 의존 → 기각
  - 갈래 C (Firestore `orderBy` + 복합 인덱스): 인덱스 생성 운영 작업 추가 필요 → 기각
- **자체 학습**: Phase B-3 같은 큰 리팩토링 시 수정 코드의 출력을 받는 호출자의 가정을 점검하는 단계 누락. 다음 큰 리팩토링 시 grep 기반 호출자 가정 체크를 단계에 포함.

## 2026-05-09 — 재렌더 정책 (D1): 횟수 무제한, 경고 모달, 실서비스 시 사전 결제

- **결정**: 재렌더 횟수 무제한. 사용자가 [영상 다시 만들기] 클릭 시 경고 모달 노출. 실서비스 단계에서는 사전 결제 게이트 추가. 필드 테스트 단계는 결제 없이 경고 모달만.
- **2026-05-21 B5 갱신**: 본 결정의 "실서비스 단계 사전 결제 게이트" 영역이 2026-05-21 B5 결정으로 구체화됨. 유료 플랜은 첫 렌더·재렌더 매번 사전 결제(재렌더 1차 80% / 2차 이후 80%). 무료 플랜은 워터마크 + 클립 수·길이 제한. "재렌더 무제한 무료" 전제는 폐기 (운영자 비용 + AI 비결정성 사유). 상세는 `decisions/market-product.md` 2026-05-21 B5 항목 참조. `data-flow.md` D2도 동일 트리거로 재작성됨.
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

## 2026-05-06 — 클립 길이 정책: 인당 16초 이내

- **결정**: 사용자 1명이 올리는 클립 길이는 **16초 이내**.
- **이유 (3가지가 동시에 같은 답)**:
  - **콘텐츠**: 짧은 인터뷰는 5~10초가 자연스러움. 30초 넘기면 산만.
  - **원가**: Shotstack은 렌더 시간 단위 과금. 30초 클립 × 100명 = 50분 영상. 16초 × 100명 = 26분 40초. 단가 3배 차이가 인당 천원 가격에 직접 박힘.
  - **시청 완주율**: 5~16분이 SNS 공유·재시청 가능한 길이. 50분짜리는 끝까지 안 봄.
- **하한**: 별도 정책 없음 (필요시 추가 결정).
- **변경 (2026-05-14)**: 실제 촬영 테스트 결과 10초가 짧다는 운영자 피드백 → 16초로 상향.

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
