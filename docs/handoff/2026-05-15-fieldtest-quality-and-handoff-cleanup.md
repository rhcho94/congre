## 세션 한 줄 요약

필드테스트 영상 화질 분석으로 가설 A(업로드 시점 480p 압축) 확정 + Shotstack
output 옵션 변경 (atomic 1커밋) + 핸드오프 오염 사건 4단계 정리 (atomic 2커밋).
세 커밋 모두 빌드·push 완료. 다음 세션 진입점은 upload MediaRecorder 정찰.

## 본 세션 커밋 (3건)

| # | 해시 | 메시지 | 핵심 변경 |
|---|---|---|---|
| 1 | 98dc3b4 | feat(shotstack): output에 fps 30 + quality high 명시 | shotstack.ts output 블록 +2줄, CHANGELOG +1, rendering.md +9. 3 files, +12 insertions |
| 2 | 732f5b9 | docs: rewrite handoff pr10-cont5 with intra-session revision | cont5 핸드오프 115줄 → 252줄 정정 (트랙 2-A 복원 + 잘못된 프롬프트 진단). 1 file, +218 -81 |
| 3 | 0625f2a | docs: add missing handoff files (2026-05-10 ~ 2026-05-15) | 누락된 핸드오프 8개 일괄 정상화. 8 files, +1678 insertions |

origin/main push 완료. 실전 검증은 다음 세션 진입 후 운영자 확인 영역.

---

## Track A — 필드테스트 영상 화질 분석

### 진입점

운영자가 필드테스트 결과물 `필드테스트.mp4` (67.9MB, 66.9초) 공유. 지적:
"그냥 찍은 것보다 화질이 안 좋다." 채팅 클로드가 ffprobe로 직접 검증.

### 완성본 메타데이터 (Shotstack 출력)

| 항목 | 값 | 평가 |
|------|----|------|
| 해상도 | 1080×1920 (9:16) | 양호 |
| 코덱 | H.264 High profile | 표준 |
| 프레임레이트 | **25 fps** | 낮음 (폰 기본 30 또는 60) |
| 평균 비트레이트 | **8.0 Mbps** | 부족 (폰 1080p 원본 17~50 Mbps) |
| 인코더 | Lavf58.76.100 | Shotstack 서버 (FFmpeg/Libav) |

구간별 편차 큼: 11~23초 14~17Mbps, 52~63초 2~5Mbps. 후반 클립이 더 강하게
압축됨. 1초 단위 비트레이트 분포 그래프로 시각 검증.

원본 해상도 1:1 크롭 프레임 검증: 링잉, 모스키토 노이즈, 블러 뭉개짐. 전형적
저비트레이트 H.264 압축 아티팩트 관찰됨.

### 원본 클립 2개 분석 (가설 검증)

운영자가 S3에서 원본 클립 2개 다운로드 → 채팅 첨부.

| 항목 | 클립 A | 클립 B |
|------|--------|--------|
| 해상도 | **640×480** | **480×640** |
| 코덱 | H.264 Constrained Baseline | H.264 Baseline |
| 비디오 비트레이트 | (메타 깨짐) | 2 Mbps |
| 오디오 코덱 | AAC | **Opus** |
| fps | (메타 깨짐) | 24 fps |
| 크기 | 1.08 MB | 2.42 MB (9.96초) |

### 결정타 증거 3개

1. **해상도 480×640** — 폰 네이티브 카메라 최소 1080p. 480p는 강제 다운스케일.
2. **Opus 오디오 코덱** — Chrome MediaRecorder 기본 오디오 코덱. 폰 네이티브
   카메라(iOS/Android)는 AAC 출력. 결정타.
3. **H.264 Constrained Baseline / Baseline 프로파일** — 브라우저 MediaRecorder
   기본. 폰 네이티브 카메라는 High 프로파일.

→ **가설 A 확정**: 참가자가 본인 폰 카메라 앱이 아닌, **브라우저 안의
MediaRecorder API가 캡처·인코딩한 영상이 S3로 올라감**. 그게 코드 흐름상 정상.

### 진단 결과

- **가설 A 확정** — 업로드 시점 480p 압축이 화질 저하 주된 원인
- **가설 B 부차적** — Shotstack 8Mbps는 평이하지만, 원본 480p가 천장. Shotstack
  옵션을 아무리 올려도 화질 체감 큰 개선 어려움
- **원인 위치**: `src/app/upload/[eventId]/page.tsx`의 getUserMedia
  constraints + MediaRecorder 설정

### 시각 검증 자료

- 1초 단위 비트레이트 분포 그래프 (Chart.js)
- 완성본 원본 해상도 1:1 크롭 프레임 (펜스 + 잎사귀 압축 아티팩트)
- 원본 클립 A 첫 프레임 (실내 어두운 장면, 640×480)
- 원본 클립 B 중간 프레임 (인물 셀카, 480×640)

다음 세션 정찰에서 참조 가능. 채팅 클로드 본인은 다음 세션에서 재생성 가능.

### Track A 학습 한 줄

> "원본 1개 + 완성본 1개"의 ffprobe 메타 비교가 화질 의심 진단의 1차 도구.
> 본 세션은 5분 안에 가설 분기 끝남. Opus·Baseline·480p 시그니처가 결정타.
> 앞으로 화질·코덱·인코딩 의심 보고 들어오면 첫 단계로 사용.

---

## Track B — Shotstack output 옵션 변경

### 진입점

가설 A 확정으로 Shotstack 옵션 개선의 효용은 작음. 그러나 단가 0이고 마진
작아도 양수면 그냥 적용하는 게 합리적. CC 정찰 + 채팅 클로드 공식 문서 검증
거쳐 옵션 변경.

### CC 정찰 결과 (커밋 전)

| 필드 | 현재 | 변경 가능 값 | 권장 |
|------|------|--------------|------|
| fps | 기본 25 | 25, 29.97, 30 | 30 |
| quality | 기본 "medium" | low, medium, high | high |
| bitrate | (직접 제어 불가) | quality preset만 존재 | - |
| 4K 옵션 | (없음) | High Volume 플랜 전용 | - |

### 채팅 클로드 공식 문서 검증

- **단가 무영향 확인** (검증된 출처 2건):
  - shotstack.io/pricing: "1 credit is equal to 1 minute of video, regardless of resolution"
  - shotstack.io/vs/creatomate-alternatives: "A 4K video costs the same as a 720p video. A 60fps render costs the same as 30fps."
- 4K = High Volume 플랜 전용 확인 (Shotstack Help Center FAQ)

### 변경 사양 (커밋 98dc3b4)

`src/lib/shotstack.ts` output 블록:

```ts
output: {
  format: "mp4",
  fps: 30,
  quality: "high",
  size: { width: 1080, height: 1920 },
}
```

CHANGELOG + decisions/rendering.md 동반 갱신.

### Track B 학습 한 줄

> 가설 분기 후 "효용 작아도 마진 양수 + 단가 0 + 리스크 0" 변경은 그냥 적용.
> 진짜 화질 개선의 본 무대는 다음 세션 upload MediaRecorder 갈래.

---

## Track C — 핸드오프 오염 사건 4단계 정리

### 진입점 (부수 발견)

Shotstack 변경 커밋 직전 git status에서 `docs/handoff/2026-05-13-pr10-cont5.md`
modified 발견. CC 보고로 "다른 프로젝트(pickleball/Phase 4.1) 내용이 잘못
커밋되어 있다"로 알림. 채팅 클로드 권장은 정찰 먼저 (시나리오 C).

### 정찰 1차 결과 (오염 범위 확인)

- 오염 커밋: 53fc748 (2026-05-13 09:32:23), 1파일 단독 추가 커밋
- 추가 발견: `docs/handoff/2026-05-13-phase-5b-file-2-complete.md` (untracked, git
  미추적, 로컬에만 존재) — 진짜 pickleball 핸드오프
- 부수 발견: docs/handoff/에 untracked 핸드오프 9개 누적

### 정찰 2차 결과 (53fc748 본문 확인)

CC가 첫 시도에서 ctrl+o 펼침 영역으로 출력 → 채팅 전달 안 됨. 두 번째 시도에서
`/tmp/53fc748-content.md`로 떨어뜨린 후 cat으로 재출력 → 본문 전체 확보.

**판정**: 53fc748 본문(115줄)은 **congre 정상 핸드오프**. "Phase 4.1"·"pickleball"
용어가 본문에 등장하는 이유는, **그 잘못된 프롬프트가 pickleball 것이었고,
그게 congre에 영향 줬는지 검증한 보고서이기 때문**. 오염이 아님.

워킹 디렉터리의 252줄(트랙 2-A 복원 + 잘못된 프롬프트 진단)은 **같은 세션
내에서 운영자가 방향 정정해 재작성한 더 나중·정확한 버전**, 커밋 누락된 상태.

### 처리 결과 (4단계)

| 단계 | 작업 | 결과 |
|------|------|------|
| 1 | cont5.md 정정 커밋 (252줄 정정본으로 git tracked 버전 덮어쓰기) | 커밋 732f5b9, +218 -81 |
| 2 | phase-5b-file 로컬 삭제 | 운영자가 pickleball 본가로 이동했으므로 이미 부재. 작업 불필요 |
| 3 | untracked 핸드오프 8개 정찰 (각 파일 첫 10줄 + 다른 프로젝트 키워드 grep + 라인 수) | 8개 모두 congre 내용 확인, grep 매칭 0건 |
| 4 | 8개 일괄 커밋 | 커밋 0625f2a, 8 files, +1678 insertions |

### Track C 학습 한 줄

> 단편 단서(첫 줄·키워드)로 전체 단정 패턴 본 세션 3회 반복: (1) 53fc748 첫 줄
> "Phase 4.1" → pickleball 단정 → 본문 보니 congre 진단 보고서, (2) 운영자
> "이번이 처음인 듯" → congre 맥락 단정 → 다른 프로젝트 얘기였음, (3) CC 보고
> "+52 lines (ctrl+o to expand)" → 본문 봤다고 단정 → 채팅 전달 안 됨.
> **단편 단서 받았을 때 전체 단정 전에 본문 직접 확인 또는 운영자 맥락 확인.**

---

## 본 세션 학습 요약

1. **ffprobe 메타 비교가 화질 의심 진단의 1차 도구** — "원본 1개 + 완성본 1개"
   비교로 가설 분기. 본 세션 5분 안에 결정타 확보.

2. **CC 정찰이 채팅 클로드 추측 정정 장치 (사례 추가)** — 이전 세션에서도
   관측된 패턴. 본 세션 Track C에서 한 번 더. 채팅 클로드 추측을 CC 본문
   확인이 정정.

3. **단편 단서 → 전체 단정 패턴 본 세션 3회** — 본인용 학습 누적. CLAUDE.md
   룰 추가는 보류 (1-2회 더 관측 시 정식 등재 검토).

4. **CC 펼침 영역 출력 → 채팅 전달 안 됨 패턴 (신규 관측)** — "+N lines
   (ctrl+o to expand)" 표기 보이면 본문 확인 안 된 것. 본문 필요한 정찰은
   파일로 떨어뜨려 cat 재출력. CLAUDE.md 룰 추가는 보류.

5. **CC가 한글 파일명 이스케이프 표기 인지하고 자체 우회 (좋은 사례)** —
   Track C 4단계에서 첫 grep에 안 잡힘 → porcelain으로 재확인 후 진행.
   CC가 자기 도구 출력의 한계를 인지한 사례.

---

## 다음 세션 진입점 — upload MediaRecorder 정찰 (우선)

### 갈래 명확

가설 A 확정으로 화질 체감 개선의 핵심은 **upload 페이지의 getUserMedia
constraints + MediaRecorder 설정**. Shotstack 옵션은 본 세션에서 처리 완료.

### 정찰 대상

`src/app/upload/[eventId]/page.tsx` (또는 카메라 관련 lib)

확인 항목:
- `getUserMedia` video constraints (현재 width/height/frameRate 어떻게 잡혀
  있는지)
- `MediaRecorder` 생성 시 mimeType, videoBitsPerSecond, audioBitsPerSecond
  옵션 명시 여부
- 현재 480×640 출력이 어디서 결정되는지 (브라우저 기본값 fallback인지, 코드가
  명시한 값인지)
- iOS Safari 호환성 (iOS는 MediaRecorder 지원이 제한적 → 다른 경로 가능성)
- 후면/전면 카메라 전환 시 constraints 차이

### 다음 세션 첫 작업 제안

1. **정찰만**: 위 5개 항목 CC에 정찰 시켜 현재 상태 파악
2. **결정**: 어디까지 손볼지 사용자 승인 (해상도만 올릴지, bitrate까지 명시할지,
   mimeType 지정까지 갈지)
3. **실행**: 변경 적용 후 필드테스트 재실시 → ffprobe로 개선 확인

---

## 다음 세션 시작 시 운영자 작업 — 5개 셋트

진입점: **upload MediaRecorder 정찰 (Track 1) 또는 운영자 결정에 따라 변경**.

- CLAUDE.md (자동 첨부)
- AGENTS.md (자동 첨부)
- 본 핸드오프 (`2026-05-15-fieldtest-quality-and-handoff-cleanup.md`) ← 운영자 직접 첨부
- DECISIONS.md 인덱스 (자동 첨부)
- known-issues.md (자동 첨부)

작업 영역 파일 (진입 결정 후 추가 첨부):

| 진입 시나리오 | 추가 첨부 |
|--------------|----------|
| upload MediaRecorder 정찰 (우선) | `src/app/upload/[eventId]/page.tsx` + 카메라 관련 lib |
| 실전 테스트 결과 회고 | 운영자 관찰 메모 |
| 사용 가이드 스크린샷 추가 | 21장 카톡 이미지 묶음 |
| globals.css 토큰 완전 보정 | `src/app/globals.css` |
| BGM 다양성 격상 | decisions/rendering.md + shotstack.ts |
| 그 외 거론 보류 큐 | 영역에 따라 |

**첫 메시지 한 줄**:

"본 핸드오프 외엔 모르는 것으로 간주, 진단·결정 시 모르는 영역이면 명시.
CC 보고 받으면 검증 표 먼저. 이번 세션 진입점은 [영역명]."

### 다음 세션 채팅 클로드 본인용 노트

- **단편 단서 → 전체 단정 패턴 본인 학습 누적 (본 세션 3회)**. 다음 세션에서
  관측 시 누적 4회로 카운트. 4-5회 누적 시 CLAUDE.md 룰 정식 등재 검토.
- **CC 펼침 영역 출력 → 채팅 전달 안 됨**. "+N lines (ctrl+o to expand)" 보이면
  본문 확인 안 된 것. 본문 필요한 정찰은 파일로 떨어뜨려 cat 재출력하게 프롬프트
  명시.
- **ask_user_input_v0 한글 옵션 깨짐** (이전 핸드오프 노트). 짧고 분명한 단어로만
  사용. 의심스러우면 평문 질문.
- **운영자 발화 맥락 단정 금지**. 멀티 프로젝트 운영 중. "어느 프로젝트
  맥락인가요?" 한 번 더 확인.

---

## 보정 후보 누적 큐 (다음 세션 첫 작업 후보)

이전 세션에서 1건 누적. 본 세션 추가 없음. **잔여 1건**:

| # | 항목 | 출처 |
|---|------|------|
| 1 | globals.css 전체 재점검 + PROJECT.md 디자인 토큰 섹션 완전 동기화 (`--accent-bright: #e8a038` 추가 + 기타 누락 토큰 확인) | 2026-05-15 이전 세션 CC 정찰 |

---

## 거론 보류 큐 (실전 테스트 결과 후 결정) — 이전 세션 계승

본 세션에서 추가 없음:

- 재렌더 UX 갭 (done 상태 버튼 미노출)
- 완성본 단일 필드 덮어쓰기 → 서브컬렉션 전환 (D2)
- 클립 메타데이터 저장 실패 (S3 고아 파일)
- 호스트 클립 제거 시 영상 미리보기 흐름 검증
- 영상 호스팅 CDN 이전 (R2 vs Shotstack)
- 미성년자 영상 법적 리스크
- 네이버 메일 도달성
- BGM 다양성 격상
- 야외 환경 음량 검증

## 보류 큐 (운영자 트리거 대기)

- Track 1-B 카메라 광각 픽스 (iPhone 실기기 디버그) — **다음 세션 우선 진입점
  (upload MediaRecorder)과 관련 있을 가능성**. upload 정찰 결과에 따라 통합
  가능성 평가
- Track 4 작은 버튼 3건 부담 가능 (실전 후 평가)
- Track 5 빈 텍스트 의도적 비우기 불가 (YAGNI 보류)

## 예정된 작업 트리거

- AWS 무료 트라이얼 만료 30일 전 (~2026-09-28) — 결제 전환 또는 이전 결정
