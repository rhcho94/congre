## 세션 한 줄 요약

Native capture 전환 시리즈 사양 A·B·C 실행 + 안드로이드 Chrome 14/15 사고
hotfix 실행 완료 (atomic 4커밋). 사양 D(가이드 텍스트 + PDF 갱신)는 정찰만
완료, 다음 세션 이월.

## 본 세션 커밋

| # | 해시 | 메시지 | 핵심 변경 |
|---|---|---|---|
| 1 | a5225bd | feat(events): add maxClipSeconds field for variable clip length | create page 6옵션 셀렉터(5~30s, default 15) + POST 검증 + GET 응답. 사양 A. |
| 2 | 81791b1 | feat(upload): native capture transition with duration capture | MediaRecorder 파이프라인 제거(~335→105줄). `<input type="file" accept="video/*">` 도입. measureDuration helper. quicktime(.mov) mime 처리. duration 검증·저장. 사양 B. |
| 3 | 1d6b5c8 | feat(shotstack): per-clip length calculation from duration | createRender 시그니처 변경(s3Urls → clips). length = Math.min(duration, maxClipSeconds), trim: 0. render/start/route.ts 호출부 동시 정정. 사양 C. |
| 4 | be7cef9 | fix(upload): split file input for camera and gallery on Android | idle stage 두 input 분리. 큰 박스(`capture="environment"`, "지금 촬영하기") + 보조 링크(capture 없음, "갤러리에서 선택"). 안드로이드 Chrome 14/15 갤러리 직행 사고 정정. |

origin/main 반영 완료.

---

## Track A — Native Capture 전환 시리즈 (사양 A·B·C 완료)

### 사양 A — events 모델에 maxClipSeconds (a5225bd)

- form state에 `maxClipSeconds: 15` default
- 3-col × 2-row 셀렉터 UI, "5초"~"30초" 단순 라벨
- POST /api/events: body 검증 (정수, 5~30)
- GET /api/events 목록·상세 응답 모두 maxClipSeconds 포함
- 7개 파일 변경 (src 3 + docs 4)

### 사양 B — upload page native capture 전환 + duration (81791b1)

- MediaRecorder 파이프라인 6함수 통째 제거: pickStandardBackCamera,
  openCamera, switchCamera, beginRecording, stopEarly, stopStream
- standby/recording stage 제거 (timer/facingMode/streamKey state + liveRef/
  streamRef/recorderRef/chunksRef/tickRef refs 동반 제거)
- `<input type="file" accept="video/*">` 도입 + measureDuration 헬퍼
- duration 검증: NaN/Infinity/<=0 즉시 차단, >120초 에러 stage
- doUpload에 quicktime(.mov) mimeType 분기 추가 (iOS native capture 대응)
- clips API에 duration 필수 필드 + 검증 추가 (number, finite, 0<x≤120)
- 6개 파일 변경 (src 2 + docs 4)

### 사양 C — Shotstack length 동적 계산 (1d6b5c8)

- createRender 시그니처: `s3Urls: string[]` → `clips: Array<{src, length}>`
- videoClips 조립: length = clip.length, trim: 0 명시
- render/start/route.ts: s3Keys 추출과 presigned URL 생성 두 단계를
  Promise.all(includedDocs.map) 하나로 통합. doc당 duration 검증 +
  Math.min(duration, maxClipSeconds ?? 15) 계산
- s3Keys 변수 완전 제거. renderEstimateMin·clipCount 참조도
  clipsWithLength.length로 교체
- 6개 파일 변경 (src 2 + docs 4)

### 사양 D — 가이드 텍스트 (미실행, 다음 세션)

핸드오프 사양은 "guide/guest/page.tsx:116 1줄 일반화"였으나 본 세션 PDF 정찰
결과 STEP 02·03 전면 재작성 필요로 판정. 호스트 가이드 점검도 추가.

운영자 결정:
- 게스트 가이드 전면 재작성 + 변수화 (사양 B로 카메라/촬영 흐름 자체 변경)
- 호스트 가이드도 정찰 — maxClipSeconds 설정 안내 + 사양 B 영향 점검
- PDF는 채팅 클로드가 만든 것 → 페이지 + PDF 둘 다 갱신

진입 단계에서 hotfix가 들어와 본격 작업 미진입. 다음 세션 첫 작업 후보.

---

## Track B — 안드로이드 Chrome 14/15 hotfix (be7cef9)

### 사고 발견

운영자 안드로이드 필드테스트 보고:
> "QR로 이벤트 가기 하면 카메라 켜기 화면 뜨고, 카메라 켜기 클릭하면
> 동영상 촬영이 아닌 폰 보관 동영상 보기로 이동. 동영상 촬영까지 갈 수
> 없음"

호스트 흐름은 정상 동작 확인 (사양 A 검증됨).

### 채팅 클로드 1차 실수 + 정정

- 1차 응답: 외부 검색 없이 옵션 비교만 제시. 운영자 결정 5("capture
  미지정")의 안드로이드 동작이 검증 안 됐던 사실을 추측으로 메우려 함.
- 운영자 지적: "혼자 이렇게 해결방법 제시하지 말고, 검색해. 다른 유사
  서비스들 이런 문제 다 겪었고 어떻게든 해결했을 거야. 전 세계 서비스
  뒤져서라도 표준적이고 안정된 해결책을 찾아내봐."
- 5단계 검색 → 결정타 4건 확보.

### 외부 자료 결정타

1. **addpipe (영상 SaaS, 14년 운영) 2025-07 검증**: Android 14/15 Chrome/
   Edge에서 `<input type="file" accept="video/*">` 단독 사용 시 카메라
   옵션 사라짐. OnePlus 13 Android 15, Samsung Galaxy S21 FE Android 14,
   Chrome 134-137 모두 재현. Android 13 이하·Firefox는 정상.

2. **MDN browser-compat-data 이슈 #19603 (2023)**: Android에서
   `capture="user"`(셀카) 속성은 무시됨, 후면 카메라가 열림. iOS는 정상.
   여러 안드로이드 버전 동일.

3. **Chrome 이슈 트래커 issuetracker.google.com/issues/317289301**: 2년째
   미해결. 의도적 변경(privacy 강화).

4. **addpipe Solution 2 + freecodecamp 표준 패턴**: 두 input 분리 — 카메라용
   (`capture="environment"`) + 갤러리용(capture 없음). 표준 사양 안에서
   안정 동작. 양쪽 OS 일관.

비표준 트릭(`accept="video/*,android/allowCamera"`)도 작동 확인되나 향후
보장 없음 — 채택 안 함.

### 채팅 클로드 2차 실수 + 정정

- 갈래 3(두 input 분리) 추천 시 "모르는 영역 3건" 적음: `capture="environment"`
  안드로이드 동작, 갤러리 input, iOS 액션시트
- 운영자 지적: "이게 왜 중요해? 카메라 기능 조작만 가능하면, 전후면 카메라
  선택, 화각 선택 하는 것은 요즘 애들한테는 문제가 안 돼. 켜진 카메라를
  전환 할 수 없다는 말인가?"
- 정정: 사고 본 영역(`capture="user"` 무시)에서 데어서 다른 capture 동작도
  의심하기 시작. 운영자 한 마디로 깨짐.

### 실행 (be7cef9)

- idle stage 큰 박스: `<input>`에 `capture="environment"` 추가, 텍스트
  "카메라 켜기" → "지금 촬영하기"
- 큰 박스 직후 보조 텍스트 링크 추가: `<label>` + 숨겨진 `<input>` (capture
  없음), 텍스트 "갤러리에서 선택"
- 두 input 모두 동일 handleFileSelected 공유 — e.target.files[0] +
  e.target.value 리셋만 사용해 자동으로 안전
- 5개 파일 변경 (src 1 + docs 4)
- known-issues-resolved.md에 항목 추가 (resolved 처리)

### 운영자 안드로이드 재테스트 (다음 세션 첫 검증 항목)

다음 세션 진입 시 다음 두 가지 확인 필요:
1. "지금 촬영하기" 큰 박스 → 카메라 앱 직접 실행 (갤러리 안 뜸)
2. "갤러리에서 선택" 보조 링크 → 갤러리 직행 (카메라 안 뜸)

iOS 동작은 운영자 다음 날 테스트 예정 (사양 A·B·C 통합 + hotfix 분리).

---

## 본 세션 학습

### 1. 단편 단서 → 전체 단정 패턴 (누적 5회 도달)

- 이전 세션 누적 4회 (직전 핸드오프 본인용 노트에 명시됨)
- 본 세션 hotfix 검토 중 "모르는 영역 3건" 작성 시 1회 추가 → **누적 5회**
- 사고 본 영역(`capture="user"` 무시)에서 다른 capture 동작도 의심한 것이
  단편 단서를 다른 사실로 확장하려 한 패턴
- **CLAUDE.md 룰 정식 등재 시점 도달** (운영자 결정 영역)

### 2. 외부 검색 트리거의 결정적 가치 (재확인)

- 직전 세션에서도 같은 학습: "추측·가설 하지 말고 검색해" 한 마디로 전환
- 본 세션 hotfix에서도 동일 패턴 재발. 운영자가 한 번 더 지적
- **운영자 명시 지시 없이 채팅 클로드 자체로 외부 검색 트리거하는 능력 부족
  관측됨**. 사고 발견 → 옵션 비교 → 결정 흐름이 자동화돼서, 검색 단계가
  생략되는 패턴

### 3. 다중 단계 결정 시 운영자 결정의 누적 효과

- 사양 A·B·C·D 각각의 운영자 결정 (셀렉터 옵션 / 라벨 / fallback / quicktime
  처리 / duration 상한 / capture 속성 등)이 누적되며 사양 의도가 명확해짐
- 채팅 클로드가 사양 짤 때 "추천 + 이유" 패턴 유지하면서도 트레이드오프
  명시한 것이 작동
- 운영자가 "모두 추천대로"라고 답한 빈도 높음 — 추천 품질 유지의 가치

### 4. CC 정찰의 검증 장치 역할 재확인

- 사양 A·B·C·hotfix 모두 CC 정찰 단계에서 사양과 코드 일치 확인 후 실행
- 본 세션 의외값 발견 0건 — 핸드오프 정찰이 신뢰할 만한 수준
- 채팅 클로드 사양 짤 때 핸드오프 정찰만 믿지 않고 본인이 직접 view한 점이
  결과적으로 사양 정밀도에 기여

### 5. 검증 표 룰 정착 (9회 적용, 사고 0건)

본 세션 검증 표 적용 9회 — 사양 A 정찰·실행, 사양 B 정찰·실행, 사양 C
1차·2차 정찰·실행, hotfix 정찰·실행. 모두 자체 합계 거짓 패턴 없음. CC 보고
정확도 일관.

---

## 보정 후보 누적 큐 (다음 세션 첫 작업 후보)

본 세션 처리 없음. 잔여 1건 + 본 세션 추가 1건:

| # | 항목 | 출처 |
|---|------|------|
| 1 | globals.css 전체 재점검 + PROJECT.md 디자인 토큰 섹션 완전 동기화 (`--accent-bright: #e8a038` 추가 + 기타 누락 토큰) | 2026-05-15 이전 세션 |
| 2 | 단편 단서 → 전체 단정 패턴 누적 5회 도달 → CLAUDE.md 정식 등재 검토 | 본 세션 |

---

## 미해결 — 다음 세션 진입점

### 다음 세션 첫 검증

**안드로이드 hotfix 동작 확인** (운영자 즉시 가능):
- "지금 촬영하기" → 카메라 직행
- "갤러리에서 선택" → 갤러리 직행

미통과 시 추가 정찰 및 갈래 5(addpipe 비표준 MIME 트릭) 검토.

### 다음 세션 작업 후보

| 후보 | 비고 |
|------|------|
| **사양 D 실행** (가이드 텍스트 전면 재작성 + PDF 갱신) | 본 세션 정찰만 한 상태. 게스트 가이드 STEP 02·03 + 호스트 가이드 maxClipSeconds 안내 + PDF 재생성 |
| **iOS 필드테스트** | 운영자 "내일 가능"이라고 본 세션 명시. 양쪽 OS 검증 완료 시 사양 시리즈 마무리 |
| **보정 후보 #1 globals.css 토큰 보정** | 본 세션 처리 안 됨 |

### 거론 보류 큐 (이전 세션 계승)

- 재렌더 UX 갭 (done 상태 버튼 미노출)
- 완성본 단일 필드 덮어쓰기 → 서브컬렉션 전환 (D2)
- 클립 메타데이터 저장 실패 (S3 고아 파일)
- 호스트 클립 제거 시 영상 미리보기 흐름 검증
- 영상 호스팅 CDN 이전 (R2 vs Shotstack)
- 미성년자 영상 법적 리스크
- 네이버 메일 도달성
- BGM 다양성 격상
- 야외 환경 음량 검증

### 보류 큐 (운영자 트리거 대기)

- Track 4 작은 버튼 3건 부담 가능 (실전 후 평가)
- Track 5 빈 텍스트 의도적 비우기 불가 (YAGNI 보류)

본 세션 변경:
- ~~Track 1-B 카메라 광각 픽스~~ — native capture 전환으로 자동 해결됨

### 예정된 작업 트리거

- AWS 무료 트라이얼 만료 30일 전 (~2026-09-28)

---

## 다음 세션 시작 시 운영자 작업 — 5개 셋트

진입점: **iOS 필드테스트 결과 회고 또는 사양 D 실행**.

- CLAUDE.md (자동 첨부)
- AGENTS.md (자동 첨부)
- 본 핸드오프 (`2026-05-16-native-capture-execution-and-android-hotfix.md`) ←
  운영자 직접 첨부
- DECISIONS.md 인덱스 (자동 첨부)
- known-issues.md (자동 첨부)

### 진입 시나리오별 추가 필요 자료

| 진입 시나리오 | 추가 첨부 |
|--------------|----------|
| iOS 필드테스트 결과 회고 | 운영자 관찰 메모 (자유 형식) |
| 사양 D 실행 (가이드 재작성) | `src/app/guide/guest/page.tsx`, `src/app/guide/host/page.tsx`, `src/app/page.tsx` (랜딩 16초 잔존 확인용) |
| globals.css 토큰 보정 | `src/app/globals.css` |

**첫 메시지 한 줄**:

"본 핸드오프 외엔 모르는 것으로 간주. 진단·결정 시 모르는 영역이면 명시.
CC 보고 받으면 검증 표 먼저. 이번 세션 진입점은 [영역명]."

### 다음 세션 채팅 클로드 본인용 노트

- **단편 단서 → 전체 단정 패턴 누적 5회**. 본 세션 hotfix 검토 중 1회 추가
  관측. CLAUDE.md 정식 등재 검토 시점.
- **외부 검색 트리거 자체 발동 부족** 관측. 사고 발견 시 옵션 비교 단계
  진입 전 "이거 다른 데서도 겪었을 텐데" 자문 한 번. 운영자 지시 없이
  검색 단계 들어가는 능력 부족 자체 모니터링.
- **CC 정찰 누적 신뢰도 9회 통과**. CC 정찰 보고에 라인 번호·코드 인용
  포함되면 검증 표만 짜고 진입해도 안전 수준.
- **사양 시리즈 진행 시 atomic 1커밋 원칙 견고**. 사양 A·B·C·hotfix 각 1커밋.
  빌드 깨진 채 중간 커밋 0건. 룰 작동 확인.
- **PDF 검증 도구 활용**: 채팅 클로드가 `/mnt/project/` PDF를 pdftotext로
  추출 가능. 본 세션 사양 D 정찰 시 활용. 다음 세션 PDF 갱신 시 동일 방식.
